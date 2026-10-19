import { finite, meshes, positive } from "./engine";

export type Triple = [number, number, number];
export type ReferenceSigns = [1 | -1, 1 | -1, 1 | -1];
export type CircuitParameters = {
  e1: number;
  e2: number;
  r1: number;
  r2: number;
  rs: number;
  structure: string;
};
export const CURRENT_EPSILON = 1e-9;
export const currentDirection = (value: number) =>
  Math.abs(value) <= CURRENT_EPSILON
    ? "zero"
    : value > 0
      ? "forward"
      : "reverse";

/** Canonical physical branches: I1 enters A, I2 leaves A, I3 goes A → B.
 * The two clockwise mesh currents equal the two outer branch currents;
 * the central branch is their difference, never an independent input.
 * Positive e1 is a rise up the left cell; positive e2 is a rise down the right.
 */
export function branchCircuit(p: CircuitParameters) {
  finite(p.e1);
  finite(p.e2);
  [p.r1, p.r2, p.rs].forEach((r) => positive(r, "Resistance"));
  if (!["two", "single", "junction"].includes(p.structure))
    throw new Error("Unknown circuit structure.");
  const single = p.structure === "single";
  const m = single ? null : meshes(p.e1, p.e2, p.r1, p.r2, p.rs);
  const i1 = finite(m?.i1 ?? p.e1 / (p.r1 + p.rs), "Branch current");
  const i2 = m?.i2 ?? 0;
  const i3 = finite(i1 - i2, "Shared branch current");
  const canonical: Triple = [i1, i2, i3];
  return {
    canonical,
    kcl: i1 - i2 - i3,
    kvl1: p.e1 - p.r1 * i1 - p.rs * i3,
    kvl2: single ? 0 : p.e2 - p.r2 * i2 + p.rs * i3,
    sourcePower: finite(p.e1 * i1 + (single ? 0 : p.e2 * i2), "Source power"),
    dissipated: finite(
      p.r1 * i1 ** 2 + p.r2 * i2 ** 2 + p.rs * i3 ** 2,
      "Dissipated power",
    ),
  };
}

export function branchReferences(
  canonical: Triple,
  signs: ReferenceSigns,
): Triple {
  return canonical.map((i, j) => i * signs[j]) as Triple;
}

/** Every row is aI1 + bI2 + cI3 = source, using the selected references.
 * Reversing traversal multiplies EVERY term, including the source, by -1.
 */
export function branchEquations(
  p: CircuitParameters,
  signs: ReferenceSigns,
  clockwise = true,
  lowerJunction = false,
) {
  const t = clockwise ? 1 : -1;
  const j = lowerJunction ? -1 : 1;
  return {
    kcl: [j * signs[0], -j * signs[1], -j * signs[2], 0],
    left: [t * p.r1 * signs[0], 0, t * p.rs * signs[2], t * p.e1],
    right: [0, t * p.r2 * signs[1], -t * p.rs * signs[2], t * p.e2],
  };
}

export function junctionCurrents(canonical: Triple, lower = false) {
  const into = canonical.map(
    (i, j) => i * (j === 0 ? 1 : -1) * (lower ? -1 : 1),
  );
  const incoming = into.map((i) => Math.max(0, i)) as Triple;
  const outgoing = into.map((i) => Math.max(0, -i)) as Triple;
  return {
    incoming,
    outgoing,
    totalIn: incoming.reduce((a, b) => a + b, 0),
    totalOut: outgoing.reduce((a, b) => a + b, 0),
  };
}

/** Compare normalized rows, allowing rearrangement or any nonzero scaling. */
export function equivalentRows(actual: number[], expected: number[]) {
  if (actual.length !== expected.length || !actual.every(Number.isFinite))
    return false;
  const pivot = expected.reduce(
    (best, v, j) => (Math.abs(v) > Math.abs(expected[best]) ? j : best),
    0,
  );
  if (!expected[pivot] || !actual[pivot]) return false;
  return actual.every(
    (v, j) =>
      Math.abs(v / actual[pivot] - expected[j] / expected[pivot]) <= 1e-8,
  );
}

type Linear = [number, number, number, number]; // three variable coefficients and constant
const constant = (n: number): Linear => [0, 0, 0, n];
const isConstant = (v: Linear) => v.slice(0, 3).every((n) => n === 0);
const scale = (v: Linear, n: number) => v.map((x) => finite(x * n)) as Linear;

/** Bounded arithmetic grammar for linear equations only. No eval, Function,
 * property access, arbitrary names, variable products or variable divisors.
 */
export function checkJunctionEquation(input: string, expected: number[]) {
  try {
    if (input.length > 256) return false;
    const normalized = input
      .toLowerCase()
      .replace(/[₁₂₃]/g, (c) => String("₀₁₂₃".indexOf(c)))
      .replace(/[−–]/g, "-")
      .replace(/\s/g, "");
    const tokens =
      normalized.match(
        /i[123]|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[+\-*/()=]/g,
      ) ?? [];
    if (tokens.join("") !== normalized || tokens.length > 128) return false;
    let position = 0;
    let depth = 0;
    function primary(): Linear {
      if (++depth > 12) throw new Error("Expression is too deep.");
      const token = tokens[position++];
      let value: Linear;
      if (token === "+" || token === "-")
        value = scale(primary(), token === "-" ? -1 : 1);
      else if (token === "(") {
        value = expression();
        if (tokens[position++] !== ")")
          throw new Error("Unclosed parenthesis.");
      } else if (/^i[123]$/.test(token ?? "")) {
        value = constant(0);
        value[Number(token[1]) - 1] = 1;
      } else if (token && Number.isFinite(Number(token)))
        value = constant(Number(token));
      else throw new Error("Expected a current or number.");
      depth--;
      return value;
    }
    function product(): Linear {
      let value = primary();
      while (
        tokens[position] === "*" ||
        tokens[position] === "/" ||
        /^(?:i[123]|\(|\d|\.)/.test(tokens[position] ?? "")
      ) {
        const op =
          tokens[position] === "*" || tokens[position] === "/"
            ? tokens[position++]
            : "*";
        const right = primary();
        if (op === "/") {
          if (!isConstant(right) || right[3] === 0)
            throw new Error("Invalid divisor.");
          value = scale(value, 1 / right[3]);
        } else if (isConstant(right)) value = scale(value, right[3]);
        else if (isConstant(value)) value = scale(right, value[3]);
        else throw new Error("Nonlinear expression.");
      }
      return value;
    }
    function expression(): Linear {
      let value = product();
      while (tokens[position] === "+" || tokens[position] === "-") {
        const sign = tokens[position++] === "+" ? 1 : -1;
        const right = product();
        value = value.map((v, j) => finite(v + sign * right[j])) as Linear;
      }
      return value;
    }
    const left = expression();
    if (tokens[position++] !== "=") return false;
    const right = expression();
    if (position !== tokens.length) return false;
    const row = left.map((v, j) => v - right[j]);
    return equivalentRows(row, [...expected.slice(0, 3), -expected[3]]);
  } catch {
    return false;
  }
}
