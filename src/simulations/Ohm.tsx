import { network, resistivity, type Arrangement } from "../physics/engine";
import {
  WIRE_MATERIALS,
  WIRE_MATERIAL_OPTIONS,
  type WireMaterialId,
} from "../physics/materials";
import { useLab } from "../hooks/useLab";
import {
  Activity,
  Challenge,
  Equation,
  Lab,
  Measurements,
  Meter,
  Meters,
  Notes,
  Range,
  ResetEffect,
  Select,
  Toggle,
  fmt,
  type Point,
  type SimProps,
} from "../components/Lab";
import { SimpleCircuit } from "../components/Circuit";
export default function Ohm({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("ohm", {
    v: 12,
    r: 6,
    r2: 3,
    length: 2,
    area: 1,
    material: "copper" as WireMaterialId,
    device: "resistor",
    arrangement: "single",
    closed: true,
    points: [] as Point[],
  });
  const material = WIRE_MATERIALS[s.material];
  const wireR = resistivity(material.rho, s.length, s.area * 1e-6),
    base = s.device === "wire" ? wireR : s.r;
  const eq =
    s.arrangement === "single"
      ? base
      : network(s.v, [base, s.r2, 1], s.arrangement as Arrangement).req;
  const i = s.closed ? s.v / eq : 0,
    v = s.closed ? s.v : 0;
  const change = (patch: Partial<typeof s>) =>
    setState((o) => ({ ...o, ...patch, points: [] }));
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            <SimpleCircuit
              v={s.v}
              r={eq}
              i={i}
              loadV={v}
              closed={s.closed}
              toggle={() => set("closed", !s.closed)}
            />
            {s.device === "wire" && (
              <div className="wire-sample">
                <div
                  style={{
                    width: `${30 + s.length * 12}%`,
                    height: 12 + s.area * 10,
                    background: material.appearance,
                  }}
                />
                <span>
                  {material.name} · L = {s.length} m · A = {s.area} mm²
                </span>
              </div>
            )}
          </>
        }
        meters={
          <Meters>
            <Meter label="Ammeter" value={i} unit="A" accent />
            <Meter label="Voltmeter" value={v} unit="V" />
            <Meter label="Effective resistance" value={eq} unit="Ω" />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Supply voltage"
              value={s.v}
              min={0}
              max={24}
              step={0.5}
              unit="V"
              onChange={(v) => set("v", v)}
            />
            <Select
              label="Test component"
              value={s.device}
              options={[
                ["resistor", "Ohmic resistor"],
                ["wire", "Uniform conductor · resistivity"],
              ]}
              onChange={(v) => change({ device: v })}
            />
            {s.device === "resistor" ? (
              <Range
                label="Resistance R₁"
                value={s.r}
                min={1}
                max={30}
                step={0.5}
                unit="Ω"
                onChange={(v) => change({ r: v })}
              />
            ) : (
              <>
                <Select
                  label="Material"
                  value={s.material}
                  options={WIRE_MATERIAL_OPTIONS}
                  onChange={(v) => change({ material: v as WireMaterialId })}
                />
                <p className="muted">
                  Resistivity ρ = {material.resistivityLabel} Ω m.
                </p>
                <p className="muted">{material.description}</p>
                <Range
                  label="Conductor length"
                  value={s.length}
                  min={0.5}
                  max={5}
                  step={0.1}
                  unit="m"
                  onChange={(v) => change({ length: v })}
                />
                <Range
                  label="Cross-sectional area"
                  value={s.area}
                  min={0.2}
                  max={3}
                  step={0.1}
                  unit="mm²"
                  onChange={(v) => change({ area: v })}
                />
              </>
            )}
            <Select
              label="Graph investigation"
              value={s.arrangement}
              options={[
                ["single", "Single test component"],
                ["series2", "R₁ + R₂ in series"],
                ["parallel2", "R₁ ∥ R₂ in parallel"],
              ]}
              onChange={(v) => change({ arrangement: v })}
            />
            {s.arrangement !== "single" && (
              <Range
                label="Resistance R₂"
                value={s.r2}
                min={1}
                max={30}
                step={0.5}
                unit="Ω"
                onChange={(v) => change({ r2: v })}
              />
            )}
            <Toggle checked={s.closed} onChange={(v) => set("closed", v)}>
              Circuit switch · {s.closed ? "closed" : "open"}
            </Toggle>
            <p className="muted">
              Changing the test component clears the readings to keep each V–I
              investigation at fixed resistance and temperature.
            </p>
          </>
        }
        equation={
          <>
            <Equation tex="V=IR,\qquad R=\frac{\rho L}{A}">
              I = {fmt(v)} / {fmt(eq)} = {fmt(i)} A.
            </Equation>
            {s.device === "wire" && (
              <p className="muted">
                A = {fmt(s.area * 1e-6)} m². R_wire = {fmt(material.rho)} ×{" "}
                {s.length} / {fmt(s.area * 1e-6)} = {fmt(wireR)} Ω.
              </p>
            )}
          </>
        }
      />
      <Measurements
        points={s.points}
        onRecord={() => set("points", [...s.points, { x: i, y: v }])}
        onClear={() => set("points", [])}
        xLabel="Current I (A)"
        yLabel="Voltage V (V)"
        extra={(p) => (p.x ? fmt(p.y / p.x) : "—")}
        curve={[
          { x: 0, y: 0 },
          { x: 24 / eq, y: 24 },
        ]}
        annotation={`V against I: theoretical gradient = ${fmt(eq)} Ω. Measurements are ideal; no noise is added.`}
      />
      {mode === "Experiment" && (
        <Activity
          aim="Verify Ohm’s Law and determine equivalent resistance by graphing."
          steps={[
            "Select a resistor and close the switch. Keep resistance and temperature fixed.",
            "Set five different supply voltages. Record each V and I pair in the notebook.",
            "The V–I gradient is resistance. Compare the fitted gradient with the theoretical value.",
            "Repeat with the series and parallel investigations. Compare their gradients.",
            "Choose a uniform conductor: double length, then double area separately, to investigate ρ = RA/L.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="ohm"
          spec={{
            question: `For a closed circuit with ${s.v} V across ${fmt(eq, 6)} Ω, predict current.`,
            answer: s.v / eq,
            unit: "A",
            hints: [
              "Ohm’s Law applies at constant temperature.",
              "Rearrange V = IR to I = V/R.",
              "Use the effective resistance of the chosen configuration.",
            ],
            solution: `I = ${s.v}/${fmt(eq, 6)}.`,
          }}
        />
      )}
      <Notes>
        <p>
          An ohmic conductor has current proportional to voltage at constant
          temperature. Ideal instruments do not alter the circuit. The uniform
          conductor remains at fixed temperature; self-heating is excluded.
          Large calculated currents in low-resistance wires are theoretical;
          this is a virtual investigation. The diagram shows the equivalent test
          load for series/parallel graphing; inspect individual branches in the
          Series &amp; parallel tab.
        </p>
      </Notes>
    </>
  );
}
