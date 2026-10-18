import { describe, expect, it } from "vitest";
import {
  ELECTRON_CHARGE,
  accumulate,
  battery,
  cellResistance,
  charge,
  current,
  divider,
  meshes,
  microscopic,
  network,
  ohm,
  parallel,
  potentiometer,
  power,
  regression,
  resistivity,
  series,
  solve,
  temperature,
} from "./engine";
describe("Mandatory curriculum benchmarks", () => {
  it("1 · 3 C / 2 s = 1.5 A", () => expect(current(3, 2)).toBe(1.5));
  it("2 · 12 V / 6 Ω = 2 A", () => expect(ohm(12, 6)).toBe(2));
  it("3 · copper geometry gives 0.034 Ω", () =>
    expect(resistivity(1.7e-8, 2, 1e-6)).toBeCloseTo(0.034, 12));
  it("4 · 10 Ω at 20 °C becomes 12 Ω at 70 °C", () =>
    expect(temperature(10, 0.004, 70)).toBe(12));
  it("5 · loaded real cell gives 2 A and 10 V", () => {
    const m = battery(12, 1, 5);
    expect(m.i).toBe(2);
    expect(m.terminal).toBe(10);
    expect(m.drop).toBe(2);
  });
  it("6 · series 4 Ω + 6 Ω = 10 Ω", () => expect(series([4, 6])).toBe(10));
  it("7 · parallel 6 Ω and 3 Ω = 2 Ω", () => {
    const m = network(12, [6, 3], "parallel2");
    expect(m.req).toBe(2);
    expect(m.total).toBe(6);
    expect(m.branches.map((b) => b.i)).toEqual([2, 4]);
  });
  it("8 · 24 W and 240 J after 10 s", () => {
    const m = power(12, 6);
    expect(m.i).toBe(2);
    expect(m.p).toBe(24);
    expect(accumulate(0, m.p, 10)).toBe(240);
  });
  it("9 · potential divider gives 4 V and 8 V", () =>
    expect(divider(12, [2000, 4000]).drops).toEqual([4, 8]));
  it("10 · potentiometer lengths 80 / 64 cm give 1 Ω", () =>
    expect(cellResistance(80, 64, 4)).toBe(1));
  it.each([
    [12, 6, 4, 6, 2, 2.4545454545454546, 1.3636363636363635],
    [12, -18, 4, 6, 2, 1.3636363636363635, -1.9090909090909092],
    [12, -12, 4, 4, 2, 1.5, -1.5],
    [12, 12, 4, 4, 2, 3, 3],
    [0, 0, 4, 6, 2, 0, 0],
  ])(
    "11 · signed two-loop fixture ε1=%s, ε2=%s",
    (e1, e2, r1, r2, rs, i1, i2) => {
      const m = meshes(e1, e2, r1, r2, rs);
      expect(m.i1).toBeCloseTo(i1, 10);
      expect(m.i2).toBeCloseTo(i2, 10);
      expect(m.kcl).toBeCloseTo(0, 12);
      expect(m.kvl1).toBeCloseTo(0, 12);
      expect(m.kvl2).toBeCloseTo(0, 12);
    },
  );
});
describe("Physical invariants and experiment models", () => {
  it("electron count differs from number density", () => {
    expect(charge(2)).toBe(2 * ELECTRON_CHARGE);
    const m = microscopic(0.034, 1e-6, 2);
    expect(m.i).toBeCloseTo(1);
    expect(m.q).toBeCloseTo(2);
    expect(m.electrons * ELECTRON_CHARGE).toBeCloseTo(m.q);
    expect(m.drift * 8.5e28 * ELECTRON_CHARGE * 1e-6).toBeCloseTo(m.i);
  });
  it("current reverses with the field", () => {
    const p = microscopic(0.034, 1e-6, 2),
      n = microscopic(-0.034, 1e-6, 2);
    expect(n.i).toBe(-p.i);
    expect(n.drift).toBe(-p.drift);
  });
  it("resistance scales with length and inversely with area", () => {
    expect(resistivity(1e-6, 4, 1e-6)).toBe(2 * resistivity(1e-6, 2, 1e-6));
    expect(resistivity(1e-6, 2, 2e-6)).toBe(resistivity(1e-6, 2, 1e-6) / 2);
  });
  it("temperature reference and positive slope", () => {
    expect(temperature(10, 0.004, 20)).toBe(10);
    expect(temperature(10, 0.004, 100)).toBeGreaterThan(
      temperature(10, 0.004, 70),
    );
  });
  it("open circuit has emf but no current or power", () => {
    const m = battery(12, 1, 5, false);
    expect(m.terminal).toBe(12);
    expect(m.i).toBe(0);
    expect(m.sourcePower).toBe(0);
  });
  it("zero internal resistance maintains terminal emf", () =>
    expect(battery(12, 0, 5).terminal).toBe(12));
  it("lower load increases internal voltage loss", () =>
    expect(battery(12, 1, 2).drop).toBeGreaterThan(battery(12, 1, 10).drop));
  it.each(["series2", "series3", "parallel2", "parallel3", "mixed"] as const)(
    "network %s conserves energy and opens correctly",
    (kind) => {
      const m = network(12, [4, 6, 3], kind);
      expect(m.branches.reduce((s, b) => s + b.p, 0)).toBeCloseTo(12 * m.total);
      const o = network(12, [4, 6, 3], kind, false);
      expect(o.total).toBe(0);
      expect(o.branches.every((b) => b.i === 0 && b.v === 0 && b.p === 0)).toBe(
        true,
      );
    },
  );
  it("variable-power energy preserves earlier contributions", () =>
    expect(accumulate(accumulate(0, 24, 5), 96, 5)).toBe(600));
  it("power follows all three equivalent expressions", () => {
    const { i, p } = power(12, 6);
    expect(p).toBe(i * i * 6);
    expect(p).toBe((12 * 12) / 6);
    expect(power(24, 6).p).toBe(4 * p);
  });
  it("divider cumulative potential and signed outputs", () => {
    const m = divider(12, [2000, 4000, 6000], 0, 2);
    expect(m.drops).toEqual([2, 4, 6]);
    expect(m.nodes).toEqual([12, 10, 6, 0]);
    expect(m.output).toBe(6);
    expect(divider(12, [2000, 4000, 6000], 2, 0).output).toBe(-6);
    expect(divider(12, [2, 4], 1, 1).output).toBe(0);
    expect(divider(12, [2, 4], 0, 2, false).output).toBe(0);
  });
  it("potentiometer null, loaded null and polarity", () => {
    const open = potentiometer(4, 10, 10, 1.6, 1, 4, false, 80);
    expect(open.k).toBe(0.02);
    expect(open.balance).toBe(80);
    expect(open.galvanometer).toBe(0);
    const loaded = potentiometer(4, 10, 10, 1.6, 1, 4, true, 64);
    expect(loaded.balance).toBe(64);
    expect(loaded.galvanometer).toBe(0);
    expect(
      potentiometer(4, 10, 10, 1.6, 1, 4, false, 60).galvanometer,
    ).toBeGreaterThan(0);
    expect(
      potentiometer(4, 10, 10, 1.6, 1, 4, false, 90).galvanometer,
    ).toBeLessThan(0);
  });
  it("no balance outside wire, including primary off", () => {
    expect(potentiometer(1, 10, 30, 1.6, 1, 4, false, 80).attainable).toBe(
      false,
    );
    const m = potentiometer(4, 10, 10, 1.6, 1, 4, false, 80, false);
    expect(m.attainable).toBe(false);
    expect(m.balance).toBeNull();
    expect(m.galvanometer).toBeCloseTo(1.6 / (10000 + 8 + 1), 12);
  });
  it("emf ratio equals balance length ratio", () => {
    const a = potentiometer(4, 10, 10, 1.6, 1, 4, false, 80),
      b = potentiometer(4, 10, 10, 1.2, 1, 4, false, 60);
    expect(a.balance! / b.balance!).toBeCloseTo(1.6 / 1.2);
  });
  it("potentiometer wire endpoint with zero rheostat has zero source-side Thevenin resistance", () => {
    const m = potentiometer(4, 10, 0, 1.6, 1, 4, false, 100);
    expect(m.galvanometer).toBeCloseTo((1.6 - 4) / (10000 + 1), 12);
  });
  it("regression interprets V-I and terminal V-I correctly", () => {
    expect(
      regression([
        { x: 1, y: 6 },
        { x: 2, y: 12 },
        { x: 3, y: 18 },
      ]),
    ).toEqual({ slope: 6, intercept: 0 });
    expect(
      regression([
        { x: 0, y: 12 },
        { x: 1, y: 11 },
        { x: 2, y: 10 },
      ]),
    ).toEqual({ slope: -1, intercept: 12 });
    expect(
      regression([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ]),
    ).toBeNull();
  });
  it("deterministic property sweep: 250 passive networks and two-loop circuits", () => {
    let seed = 712;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    for (let k = 0; k < 250; k++) {
      const rs = Array.from({ length: 3 }, () => 0.1 + rand() * 100),
        v = rand() * 24;
      expect(parallel(rs)).toBeLessThanOrEqual(Math.min(...rs) + 1e-10);
      expect(series(rs)).toBeGreaterThanOrEqual(Math.max(...rs));
      const m = meshes(
        v,
        rand() * 48 - 24,
        ...(rs as [number, number, number]),
      );
      expect(m.kcl).toBeCloseTo(0, 9);
      expect(m.kvl1).toBeCloseTo(0, 9);
      expect(m.kvl2).toBeCloseTo(0, 9);
      expect(m.sourcePower).toBeCloseTo(m.dissipated, 9);
      const b = battery(v, rs[0], rs[1]);
      expect(b.sourcePower).toBeCloseTo(b.loss + b.loadPower, 9);
    }
  });
});
describe("Invalid and singular circuit guards", () => {
  it.each([
    () => ohm(1, 0),
    () => ohm(NaN, 6),
    () => resistivity(1, 2, 0),
    () => current(3, 0),
    () => temperature(1, 1, -20),
    () => battery(12, -1, 4),
    () => parallel([]),
    () => series([0]),
    () => divider(12, [1, 2, 3, 4]),
    () => divider(12, [1, 2], -1, 2),
    () => cellResistance(64, 80, 4),
    () => potentiometer(4, 10, 10, 1.6, 1, 4, false, 101),
    () => accumulate(1, 2, -1),
    () =>
      solve(
        [
          [0, 0],
          [0, 0],
        ],
        [1, 1],
      ),
    () =>
      solve(
        [
          [1, -1],
          [-1, 1],
        ],
        [1, 2],
      ),
    () => meshes(12, 6, 0, 0, 0),
  ])("rejects invalid input %s", (fn) => expect(fn).toThrow());
  it("partial pivoting handles a zero leading diagonal", () =>
    expect(
      solve(
        [
          [0, 2],
          [1, 1],
        ],
        [4, 3],
      ),
    ).toEqual([1, 2]));
});
