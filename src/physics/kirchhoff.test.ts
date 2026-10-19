import { describe, expect, it } from "vitest";
import { solve } from "./engine";
import {
  branchCircuit,
  branchEquations,
  branchReferences,
  checkJunctionEquation,
  currentDirection,
  equivalentRows,
  junctionCurrents,
  type CircuitParameters,
  type ReferenceSigns,
} from "./kirchhoff";

const example: CircuitParameters = {
  e1: 18,
  e2: -18,
  r1: 4,
  r2: 6,
  rs: 5,
  structure: "two",
};
const conservation = (p: CircuitParameters) => {
  const m = branchCircuit(p);
  const [i1, i2, i3] = m.canonical;
  expect(i1 - i2 - i3).toBeCloseTo(0, 9);
  expect(p.r1 * i1 + p.rs * i3).toBeCloseTo(p.e1, 8);
  if (p.structure !== "single")
    expect(p.r2 * i2 - p.rs * i3).toBeCloseTo(p.e2, 8);
  expect(m.sourcePower).toBeCloseTo(m.dissipated, 7);
  expect(m.canonical.every(Number.isFinite)).toBe(true);
  return m;
};

describe("Three branch currents and physical directions", () => {
  it("matches the independent exact 54/37, -36/37, 90/37 A benchmark", () => {
    const m = conservation(example);
    [54 / 37, -36 / 37, 90 / 37].forEach((value, j) =>
      expect(m.canonical[j]).toBeCloseTo(value, 12),
    );
    expect(m.canonical.map(currentDirection)).toEqual([
      "forward",
      "reverse",
      "forward",
    ]);
    expect(m.sourcePower).toBeCloseTo(1620 / 37, 12);
    const upper = junctionCurrents(m.canonical);
    expect(upper.incoming).toEqual([m.canonical[0], -m.canonical[1], 0]);
    expect(upper.outgoing).toEqual([0, 0, m.canonical[2]]);
    expect(upper.totalIn).toBeCloseTo(upper.totalOut, 12);
    const lower = junctionCurrents(m.canonical, true);
    expect(lower.incoming).toEqual(upper.outgoing);
    expect(lower.outgoing).toEqual(upper.incoming);
  });
  it.each([
    [
      "both outer branch currents positive",
      { e1: 18, e2: 18 },
      ["forward", "forward", "forward"],
    ],
    ["one negative branch", {}, ["forward", "reverse", "forward"]],
    [
      "balanced sources, zero shared current",
      { e1: 12, e2: 18 },
      ["forward", "forward", "zero"],
    ],
    ["all zero", { e1: 0, e2: 0 }, ["zero", "zero", "zero"]],
    [
      "all polarities reversed",
      { e1: -18, e2: 18 },
      ["reverse", "forward", "reverse"],
    ],
    ["left branch zero", { e1: 5, e2: -11 }, ["zero", "reverse", "forward"]],
    ["right branch zero", { e1: 9, e2: -5 }, ["forward", "zero", "forward"]],
  ])("%s", (_, overrides, directions) => {
    const m = conservation({ ...example, ...overrides });
    expect(m.canonical.map(currentDirection)).toEqual(directions);
  });
  it("reversing both sources reverses flow but preserves every resistor's dissipation", () => {
    const forward = conservation(example);
    const reverse = conservation({ ...example, e1: -18, e2: 18 });
    reverse.canonical.forEach((value, j) =>
      expect(value).toBeCloseTo(-forward.canonical[j], 12),
    );
    expect(reverse.dissipated).toBeCloseTo(forward.dissipated, 12);
  });
  it("single-loop and junction views retain correct topology", () => {
    const single = conservation({ ...example, structure: "single" });
    expect(single.canonical).toEqual([2, 0, 2]);
    expect(
      branchCircuit({ ...example, structure: "single", e2: 0, r2: 20 }),
    ).toEqual(single);
    expect(branchCircuit({ ...example, structure: "junction" })).toEqual(
      branchCircuit(example),
    );
  });
  it("agrees with independent three-equation and nodal solutions across 300 circuits", () => {
    let seed = 4289;
    const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
    for (let index = 0; index < 300; index++) {
      const p = {
        ...example,
        e1: 36 * random() - 18,
        e2: 36 * random() - 18,
        r1: 1 + 19 * random(),
        r2: 1 + 19 * random(),
        rs: 1 + 19 * random(),
      };
      const m = conservation(p);
      const independent = solve(
        [
          [p.r1, 0, p.rs],
          [0, p.r2, -p.rs],
          [1, -1, -1],
        ],
        [p.e1, p.e2, 0],
      );
      const va = (p.e1 / p.r1 - p.e2 / p.r2) / (1 / p.r1 + 1 / p.r2 + 1 / p.rs);
      const nodal = [(p.e1 - va) / p.r1, (va + p.e2) / p.r2, va / p.rs];
      m.canonical.forEach((value, j) => {
        expect(value).toBeCloseTo(independent[j], 10);
        expect(value).toBeCloseTo(nodal[j], 10);
      });
    }
  });
  it.each([
    { rs: 1 },
    { rs: 20 },
    { r1: 1 },
    { r1: 20 },
    { r2: 1 },
    { r2: 20 },
    { e1: -9 },
    { e2: 7 },
    { e1: 18, e2: 18, r1: 1, r2: 20, rs: 1 },
    { r1: 1e-6, r2: 2e-6, rs: 3e-6 },
    { r1: 1e6, r2: 2e6, rs: 3e6 },
  ])(
    "conserves current, voltage and power after parameter changes %j",
    (overrides) => {
      conservation({ ...example, ...overrides });
    },
  );
});

describe("Reference directions are coordinate changes, traversal is independent", () => {
  for (const a of [1, -1] as const)
    for (const b of [1, -1] as const)
      for (const c of [1, -1] as const) {
        it(`all references (${a}, ${b}, ${c}) preserve KCL, both KVL laws and power`, () => {
          const signs: ReferenceSigns = [a, b, c];
          const m = conservation(example);
          const currents = branchReferences(m.canonical, signs);
          currents.forEach((value, j) =>
            expect(value * signs[j]).toBeCloseTo(m.canonical[j], 12),
          );
          const clockwise = branchEquations(example, signs);
          const reverse = branchEquations(example, signs, false, true);
          for (const key of ["kcl", "left", "right"] as const) {
            const row = clockwise[key];
            expect(
              row
                .slice(0, 3)
                .reduce((sum, coeff, j) => sum + coeff * currents[j], -row[3]),
            ).toBeCloseTo(0, 11);
            reverse[key].forEach((value, j) =>
              expect(value).toBeCloseTo(-row[j], 12),
            );
          }
          const source =
            example.e1 * currents[0] * a + example.e2 * currents[1] * b;
          const resistors =
            example.r1 * currents[0] ** 2 +
            example.r2 * currents[1] ** 2 +
            example.rs * currents[2] ** 2;
          expect(source).toBeCloseTo(resistors, 12);
        });
      }
});

describe("Restricted linear KCL equation checker", () => {
  it.each([
    "i1=i2+i3",
    "i3=i1-i2",
    "i2+i3=i1",
    "0=i1-i2-i3",
    "2*i1=2*i2+2*i3",
    "2(i1-i2)=2i3",
    "(i1-i2)/2=i3/2",
    "I₁ − I₂ − I₃ = 0",
    "-i1+i2+i3=0",
  ])("accepts equivalent equation %s", (input) =>
    expect(checkJunctionEquation(input, [1, -1, -1, 0])).toBe(true),
  );
  it.each([
    "i1=i2-i3",
    "i1=i1",
    "0=0",
    "i1=i2+i3+1",
    "i1=i2",
    "i1*i2=i3",
    "i1/i2=i3",
    "i1/0=i2+i3",
    "i1=i2+i3=0",
    "window.alert(1)",
    "globalThis.x=1",
    "i1 = (() => 1)()",
    "i1=Infinity",
    "i1=NaN",
    "i1=1e999",
    "i1=foo",
    "i1=i2+is",
    "(".repeat(20) + "i1" + ")".repeat(20) + "=i2+i3",
    "x".repeat(257),
  ])("rejects invalid, unsafe or nonconserving input %s", (input) =>
    expect(checkJunctionEquation(input, [1, -1, -1, 0])).toBe(false),
  );
  it("adapts to reversed references rather than accepting only one text string", () => {
    expect(checkJunctionEquation("i1+i2=i3", [1, 1, -1, 0])).toBe(true);
    expect(checkJunctionEquation("i1=i2+i3", [1, 1, -1, 0])).toBe(false);
  });
  it("accepts scaled KVL coefficient rows and rejects a wrong shared-current term", () => {
    expect(equivalentRows([8, 0, 10, 36], [4, 0, 5, 18])).toBe(true);
    expect(equivalentRows([0, -6, 5, 18], [0, 6, -5, -18])).toBe(true);
    expect(equivalentRows([0, 6, 5, -18], [0, 6, -5, -18])).toBe(false);
    expect(equivalentRows([0, 0, 0, 0], [4, 0, 5, 18])).toBe(false);
    expect(equivalentRows([NaN, 0, 5, 18], [4, 0, 5, 18])).toBe(false);
  });
});

describe("Branch-model invalid inputs", () => {
  it.each([
    { e1: NaN },
    { e2: Infinity },
    { r1: 0 },
    { r2: -1 },
    { rs: 0 },
    { rs: Infinity },
    { structure: "disconnected" },
    { structure: "single", e1: Number.MAX_VALUE, r1: 1e-300, rs: 1e-300 },
    { e1: 1e200, e2: -1e200 },
  ])("rejects invalid configuration %j", (overrides) =>
    expect(() => branchCircuit({ ...example, ...overrides })).toThrow(),
  );
});
