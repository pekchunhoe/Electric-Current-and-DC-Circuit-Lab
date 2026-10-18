import { battery } from "../physics/engine";
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
  Toggle,
  fmt,
  type Point,
  type SimProps,
} from "../components/Lab";
import { SimpleCircuit } from "../components/Circuit";
export default function Battery({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("battery", {
    emf: 12,
    r: 1,
    load: 5,
    closed: true,
    points: [] as Point[],
  });
  const m = battery(s.emf, s.r, s.load, s.closed);
  const change = (patch: Partial<typeof s>) =>
    setState((o) => ({ ...o, ...patch, points: [] }));
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            <SimpleCircuit
              v={s.emf}
              r={s.load}
              i={m.i}
              loadV={m.terminal}
              closed={s.closed}
              toggle={() => set("closed", !s.closed)}
              internal={s.r}
            />
            <div className="voltage-budget">
              <span style={{ flex: m.terminal || 0.001 }}>
                Terminal {fmt(m.terminal)} V
              </span>
              <span style={{ flex: m.drop || 0.001 }}>
                Lost {fmt(m.drop)} V
              </span>
            </div>
          </>
        }
        meters={
          <Meters>
            <Meter label="Current" value={m.i} unit="A" />
            <Meter
              label="Terminal voltage"
              value={m.terminal}
              unit="V"
              accent
            />
            <Meter label="Internal voltage drop" value={m.drop} unit="V" />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Battery emf ε"
              value={s.emf}
              min={1}
              max={24}
              step={0.5}
              unit="V"
              onChange={(v) => change({ emf: v })}
            />
            <Range
              label="Internal resistance r"
              value={s.r}
              min={0}
              max={5}
              step={0.1}
              unit="Ω"
              onChange={(v) => change({ r: v })}
            />
            <Range
              label="External load R"
              value={s.load}
              min={1}
              max={30}
              step={0.5}
              unit="Ω"
              onChange={(v) => set("load", v)}
            />
            <Toggle checked={s.closed} onChange={(v) => set("closed", v)}>
              Circuit switch · {s.closed ? "closed" : "open"}
            </Toggle>
            <p className="muted">
              Source {fmt(m.sourcePower)} W = load {fmt(m.loadPower)} W +
              internal heating {fmt(m.loss)} W.
            </p>
          </>
        }
        equation={
          <>
            <Equation tex="I=\frac{\varepsilon}{R+r},\qquad V=\varepsilon-Ir">
              {s.closed
                ? `I = ${s.emf}/(${s.load} + ${s.r}) = ${fmt(m.i)} A.`
                : "Open switch: I = 0 A."}{" "}
              V = {s.emf} − {fmt(m.i)} × {s.r} = {fmt(m.terminal)} V.
            </Equation>
          </>
        }
      />
      <Measurements
        points={s.points}
        onRecord={() => set("points", [...s.points, { x: m.i, y: m.terminal }])}
        onClear={() => set("points", [])}
        xLabel="Current I (A)"
        yLabel="Terminal V (V)"
        curve={[
          { x: 0, y: s.emf },
          { x: s.emf / (1 + s.r), y: s.emf - (s.emf / (1 + s.r)) * s.r },
        ]}
        annotation={`Vertical intercept = ε = ${s.emf} V. Gradient = −r = ${-s.r} Ω. Vary the load to take readings; opening the switch records the intercept.`}
      />
      {mode === "Experiment" && (
        <Activity
          aim="Determine emf and internal resistance from a terminal-voltage graph."
          steps={[
            "Open the switch and record the no-load terminal voltage. This is the emf.",
            "Close the switch and collect at least five readings with different load resistances.",
            "Find ε from the vertical intercept and r from the negative of the fitted V–I gradient.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="battery"
          spec={{
            question: `A ${s.emf} V battery with internal resistance ${s.r} Ω supplies a ${s.load} Ω load. Find its closed-circuit terminal voltage.`,
            answer: battery(s.emf, s.r, s.load).terminal,
            unit: "V",
            hints: [
              "Find current using both the load and internal resistance.",
              "Use I = ε/(R + r).",
              "Subtract the internal drop Ir from ε.",
            ],
            solution: `I = ${s.emf}/(${s.load}+${s.r}); V = ε − Ir.`,
          }}
        />
      )}
      <Notes>
        <p>
          Emf is energy supplied per unit charge by the cell. Internal
          resistance models energy dissipated inside the cell. Terminal
          potential difference is energy delivered per unit charge to the
          external circuit. The ideal high-resistance voltmeter reads emf when
          no current flows. Cell chemistry, electrode separation and area,
          electrolyte condition, temperature and age can affect internal
          resistance; no universal numerical relationship is assumed here.
        </p>
      </Notes>
    </>
  );
}
