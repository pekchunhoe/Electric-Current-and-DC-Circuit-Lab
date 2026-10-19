// Stable identifiers are used by controls and state; numbers are physics inputs,
// never serialized option identities (String(1.1e-6) is "0.0000011").
export const WIRE_MATERIALS = {
  copper: {
    name: "Copper",
    rho: 1.7e-8,
    resistivityLabel: "1.7 × 10⁻⁸",
    description:
      "A low-resistivity conductor commonly used for electrical wiring.",
    appearance: "linear-gradient(#b98b5b, #ffd7a3, #966d42)",
  },
  aluminium: {
    name: "Aluminium",
    rho: 2.82e-8,
    resistivityLabel: "2.82 × 10⁻⁸",
    description: "A lightweight conductor with higher resistivity than copper.",
    appearance: "linear-gradient(#8999a6, #e4edf3, #738391)",
  },
  nichrome: {
    name: "Nichrome",
    rho: 1.1e-6,
    resistivityLabel: "1.1 × 10⁻⁶",
    description:
      "A high-resistivity alloy commonly used in resistance heating elements.",
    appearance: "linear-gradient(#626b76, #bcc4ce, #4b5561)",
  },
} as const;
export type WireMaterialId = keyof typeof WIRE_MATERIALS;
export const WIRE_MATERIAL_OPTIONS: [WireMaterialId, string][] = Object.entries(
  WIRE_MATERIALS,
).map(([id, material]) => [
  id as WireMaterialId,
  `${material.name} · ${material.resistivityLabel} Ω m`,
]);
