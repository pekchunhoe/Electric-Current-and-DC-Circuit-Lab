import { describe, expect, it } from "vitest";
import { ohm, resistivity } from "./engine";
import { WIRE_MATERIALS, WIRE_MATERIAL_OPTIONS } from "./materials";

describe("Material presets at 24 V, 0.5 m and 3 mm²", () => {
  it.each([
    ["copper", 1.7e-8, 0.0028333333333333335, 8470.588235294117],
    ["aluminium", 2.82e-8, 0.0047, 5106.382978723404],
    ["nichrome", 1.1e-6, 0.18333333333333335, 130.9090909090909],
  ] as const)(
    "%s: correct resistivity, resistance and ideal current",
    (id, rho, r, i) => {
      const material = WIRE_MATERIALS[id];
      expect(material.rho).toBe(rho);
      const resistance = resistivity(material.rho, 0.5, 3e-6);
      expect(resistance).toBeCloseTo(r, 12);
      expect(ohm(24, resistance)).toBeCloseTo(i, 8);
    },
  );

  it("uses unique, stable option identifiers matching the material table", () => {
    const ids = WIRE_MATERIAL_OPTIONS.map(([id]) => id);
    expect(ids).toEqual(["copper", "aluminium", "nichrome"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(WIRE_MATERIAL_OPTIONS.map(([, label]) => label)).toEqual([
      "Copper · 1.7 × 10⁻⁸ Ω m",
      "Aluminium · 2.82 × 10⁻⁸ Ω m",
      "Nichrome · 1.1 × 10⁻⁶ Ω m",
    ]);
  });
});
