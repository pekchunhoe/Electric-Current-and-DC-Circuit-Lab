/** SI internally: A, V, Ω, m, m², C, s, J; temperatures in °C. */
export const ELECTRON_CHARGE = 1.602176634e-19;
export function finite(x: number, name = "Value") {
  if (!Number.isFinite(x)) throw new Error(`${name} must be finite.`);
  return x;
}
export function positive(x: number, name = "Value") {
  finite(x, name);
  if (x <= 0) throw new Error(`${name} must be positive.`);
  return x;
}
export function nonnegative(x: number, name = "Value") {
  finite(x, name);
  if (x < 0) throw new Error(`${name} cannot be negative.`);
  return x;
}
export const current = (q: number, t: number) =>
  finite(q, "Charge") / positive(t, "Time");
export const charge = (electrons: number) =>
  nonnegative(electrons, "Electron count") * ELECTRON_CHARGE;
export const ohm = (v: number, r: number) =>
  finite(v, "Voltage") / positive(r, "Resistance");
export const resistivity = (rho: number, length: number, area: number) =>
  (positive(rho, "Resistivity") * positive(length, "Length")) /
  positive(area, "Area");
export function microscopic(v: number, area: number, time: number) {
  const r = resistivity(1.7e-8, 2, area);
  const i = ohm(v, r);
  positive(time, "Counting interval");
  return {
    r,
    i,
    q: i * time,
    electrons: Math.abs(i * time) / ELECTRON_CHARGE,
    drift: i / (8.5e28 * ELECTRON_CHARGE * area),
  };
}
export function temperature(r0: number, alpha: number, t: number) {
  positive(r0, "Reference resistance");
  finite(alpha, "Coefficient");
  finite(t, "Temperature");
  return positive(r0 * (1 + alpha * (t - 20)), "Modelled resistance");
}
export function battery(
  emf: number,
  internal: number,
  load: number,
  closed = true,
) {
  nonnegative(emf, "EMF");
  nonnegative(internal, "Internal resistance");
  positive(load, "Load");
  const i = closed ? emf / (load + internal) : 0;
  return {
    i,
    terminal: emf - i * internal,
    drop: i * internal,
    loadPower: i * i * load,
    loss: i * i * internal,
    sourcePower: emf * i,
  };
}
export function series(rs: number[]) {
  if (!rs.length) throw new Error("At least one resistor is required.");
  return rs.reduce((a, r) => a + positive(r, "Resistance"), 0);
}
export function parallel(rs: number[]) {
  if (!rs.length) throw new Error("At least one resistor is required.");
  return 1 / rs.reduce((a, r) => a + 1 / positive(r, "Resistance"), 0);
}
export type Arrangement =
  "series2" | "series3" | "parallel2" | "parallel3" | "mixed";
export function network(
  v: number,
  rs: number[],
  kind: Arrangement,
  closed = true,
) {
  finite(v, "Supply");
  rs.forEach((r) => positive(r, "Resistance"));
  const used = rs.slice(0, kind.endsWith("2") ? 2 : 3);
  if (used.length !== (kind.endsWith("2") ? 2 : 3))
    throw new Error("Missing resistors.");
  const req =
    kind === "mixed"
      ? used[0] + parallel(used.slice(1))
      : kind.startsWith("series")
        ? series(used)
        : parallel(used);
  const total = closed ? v / req : 0;
  const voltages = used.map((r, j) =>
    !closed
      ? 0
      : kind === "mixed"
        ? j === 0
          ? total * r
          : v - total * used[0]
        : kind.startsWith("series")
          ? total * r
          : v,
  );
  const branches = used.map((r, j) => ({
    r,
    v: voltages[j],
    i: voltages[j] / r,
    p: voltages[j] ** 2 / r,
  }));
  return { req, total, branches };
}
/** Scaled partial-pivot Gaussian elimination; invalid/singular circuits fail explicitly. */
export function solve(a: number[][], b: number[]) {
  const n = b.length;
  if (!n || a.length !== n || a.some((r) => r.length !== n))
    throw new Error("Invalid circuit matrix.");
  const m = a.map((r, i) => [...r.map((v) => finite(v)), finite(b[i])]);
  const scales = a.map((r) => Math.max(...r.map(Math.abs)));
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let j = k + 1; j < n; j++)
      if (
        Math.abs(m[j][k]) / (scales[j] || 1) >
        Math.abs(m[p][k]) / (scales[p] || 1)
      )
        p = j;
    if (!scales[p] || Math.abs(m[p][k]) <= 1e-12 * scales[p])
      throw new Error(
        "Circuit has no unique solution: disconnected, shorted or conflicting ideal sources.",
      );
    [m[k], m[p]] = [m[p], m[k]];
    [scales[k], scales[p]] = [scales[p], scales[k]];
    for (let j = k + 1; j < n; j++) {
      const q = m[j][k] / m[k][k];
      for (let c = k; c <= n; c++) m[j][c] -= q * m[k][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let j = n - 1; j >= 0; j--)
    x[j] = finite(
      (m[j][n] -
        m[j].slice(j + 1, n).reduce((s, c, k) => s + c * x[j + 1 + k], 0)) /
        m[j][j],
      "Circuit result",
    );
  return x;
}
export function meshes(
  e1: number,
  e2: number,
  r1: number,
  r2: number,
  shared: number,
) {
  finite(e1);
  finite(e2);
  nonnegative(r1);
  nonnegative(r2);
  nonnegative(shared);
  const [i1, i2] = solve(
    [
      [r1 + shared, -shared],
      [-shared, r2 + shared],
    ],
    [e1, e2],
  );
  const is = i1 - i2;
  return {
    i1,
    i2,
    is,
    v: is * shared,
    kcl: i1 - i2 - is,
    kvl1: e1 - i1 * r1 - is * shared,
    kvl2: e2 - i2 * r2 + is * shared,
    sourcePower: e1 * i1 + e2 * i2,
    dissipated: i1 ** 2 * r1 + i2 ** 2 * r2 + is ** 2 * shared,
  };
}
export function power(v: number, r: number) {
  const i = ohm(v, r);
  return { i, p: finite(v * i) };
}
export function accumulate(energy: number, p: number, dt: number) {
  return (
    nonnegative(energy, "Energy") +
    nonnegative(p, "Power") * nonnegative(dt, "Time step")
  );
}
export function divider(
  v: number,
  rs: number[],
  a = 0,
  b = rs.length,
  closed = true,
) {
  finite(v);
  if (rs.length < 2 || rs.length > 3)
    throw new Error("Use two or three resistors.");
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0 && n <= rs.length))
    throw new Error("Invalid output terminals.");
  const total = series(rs),
    i = closed ? v / total : 0;
  const nodes = [closed ? v : 0];
  for (const r of rs) nodes.push(nodes.at(-1)! - i * r);
  return {
    i,
    total,
    drops: rs.map((r) => i * r),
    nodes,
    output: nodes[a] - nodes[b],
  };
}
export function potentiometer(
  primary: number,
  wireR: number,
  rheostat: number,
  cell: number,
  cellR: number,
  load: number,
  loaded: boolean,
  lengthCm: number,
  closed = true,
) {
  nonnegative(primary);
  positive(wireR);
  nonnegative(rheostat);
  nonnegative(cell);
  nonnegative(cellR);
  positive(load);
  if (lengthCm < 0 || lengthCm > 100)
    throw new Error("Contact must be on the 100 cm wire.");
  finite(lengthCm);
  const primaryI = closed ? primary / (wireR + rheostat) : 0;
  const k = (primaryI * wireR) / 100;
  const target = loaded ? (cell * load) / (load + cellR) : cell;
  const balance = k > 0 ? target / k : null;
  const rt = (wireR * lengthCm) / 100;
  const remainder = wireR - rt + rheostat;
  const wireThevenin = !closed
    ? rt
    : rt === 0 || remainder === 0
      ? 0
      : parallel([rt, remainder]);
  const testThevenin = loaded
    ? cellR === 0
      ? 0
      : parallel([cellR, load])
    : cellR;
  // Exact Thevenin detector current for a 10 kΩ galvanometer, positive test-cell → wire.
  const mismatch = target - k * lengthCm;
  // With the primary open, the secondary cell can still drive the detector through the wire segment.
  const galvanometer = mismatch / (10000 + wireThevenin + testThevenin);
  return {
    primaryI,
    k,
    target,
    balance,
    attainable: closed && balance !== null && balance >= 0 && balance <= 100,
    galvanometer,
    mismatch,
    wireDrop: k * lengthCm,
  };
}
export function cellResistance(l1: number, l2: number, load: number) {
  positive(l1);
  positive(l2);
  positive(load);
  if (l2 > l1)
    throw new Error(
      "Loaded balance length must not exceed open-circuit length.",
    );
  return load * (l1 / l2 - 1);
}
export function regression(points: { x: number; y: number }[]) {
  if (points.length < 2) return null;
  const x = points.reduce((s, p) => s + p.x, 0) / points.length,
    y = points.reduce((s, p) => s + p.y, 0) / points.length;
  const d = points.reduce((s, p) => s + (p.x - x) ** 2, 0);
  if (d < 1e-20) return null;
  const slope = points.reduce((s, p) => s + (p.x - x) * (p.y - y), 0) / d;
  return { slope, intercept: y - slope * x };
}
