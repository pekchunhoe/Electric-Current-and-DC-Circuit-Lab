import { useRef } from "react";
import { divider } from "../physics/engine";
import { useLab } from "../hooks/useLab";
import {
  Activity,
  Challenge,
  Equation,
  Graph,
  Lab,
  Meter,
  Meters,
  Notes,
  Range,
  ResetEffect,
  Select,
  Toggle,
  fmt,
  type SimProps,
} from "../components/Lab";
import { Cell, Resistor, Stage, Wire } from "../components/Circuit";
export default function Divider({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("divider", {
    v: 12,
    r1: 2,
    r2: 4,
    r3: 3,
    three: false,
    a: 1,
    b: 2,
    closed: true,
    dragging: false,
  });
  const rs = [s.r1 * 1000, s.r2 * 1000, ...(s.three ? [s.r3 * 1000] : [])],
    m = divider(s.v, rs, s.a, s.b, s.closed);
  const svgRef = useRef<SVGGElement>(null);
  const dragging = useRef(false);
  const nodeX = (j: number) => 180 + j * 110;
  function drag(e: React.PointerEvent<SVGGElement>) {
    const svg = svgRef.current?.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * 600) / rect.width;
    const j = Math.max(0, Math.min(rs.length, Math.round((x - 180) / 110)));
    set("a", j);
  }
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <Stage label="Unloaded series potential divider. Drag the cyan positive probe between junctions, or use output terminal controls.">
            <Cell x={85} y={180} emf={s.v} />
            <Wire
              d={`M85 134V105H${nodeX(rs.length)}V280H85V226`}
              flow={m.i * 1000}
            />
            {rs.map((r, j) => (
              <g key={j}>
                <Resistor
                  x={nodeX(j) + 55}
                  y={105}
                  r={r}
                  label={`R${j + 1}`}
                  selected={j >= Math.min(s.a, s.b) && j < Math.max(s.a, s.b)}
                  onClick={() => setState((o) => ({ ...o, a: j, b: j + 1 }))}
                />
                <text
                  x={nodeX(j) + 55}
                  y="175"
                  textAnchor="middle"
                  className="value-label"
                >
                  {fmt(m.drops[j])} V
                </text>
              </g>
            ))}
            {m.nodes.map((v, j) => (
              <g key={j}>
                <circle cx={nodeX(j)} cy={105} r="5" className="node" />
                <text
                  x={nodeX(j)}
                  y="68"
                  textAnchor="middle"
                  className="tiny-label"
                >
                  N{j}: {fmt(v)} V
                </text>
              </g>
            ))}
            <g
              ref={svgRef}
              className="probe-drag"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                set("dragging", true);
                drag(e);
              }}
              onPointerMove={(e) => {
                if (dragging.current) drag(e);
              }}
              onPointerUp={(e) => {
                drag(e);
                dragging.current = false;
                set("dragging", false);
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => {
                dragging.current = false;
                set("dragging", false);
              }}
            >
              <rect
                x={nodeX(s.a) - 50}
                y="185"
                width="100"
                height="85"
                fill="transparent"
              />
              <path
                d={`M${nodeX(s.a)} 105V210L${nodeX(s.a) - 9} 228H${nodeX(s.a) + 9}L${nodeX(s.a)} 210`}
                className="positive-probe"
              />
              <text
                x={nodeX(s.a)}
                y="253"
                textAnchor="middle"
                className="value-label"
              >
                + drag
              </text>
            </g>
            <path d={`M${nodeX(s.b)} 105V280`} className="negative-probe" />
            <text x="300" y="328" textAnchor="middle" className="value-label">
              V(N{s.a}) − V(N{s.b}) = {fmt(m.output)} V
            </text>
          </Stage>
        }
        meters={
          <Meters>
            <Meter label="Selected output" value={m.output} unit="V" accent />
            <Meter label="Series current" value={m.i * 1000} unit="mA" />
            <Meter label="Total resistance" value={m.total / 1000} unit="kΩ" />
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
            {(["r1", "r2", "r3"] as const).slice(0, rs.length).map((key, j) => (
              <Range
                key={key}
                label={`Divider R${j + 1}`}
                value={s[key]}
                min={0.5}
                max={10}
                step={0.5}
                unit="kΩ"
                onChange={(v) => set(key, v)}
              />
            ))}
            <Toggle
              checked={s.three}
              onChange={(v) =>
                setState((o) => ({
                  ...o,
                  three: v,
                  a: Math.min(o.a, v ? 3 : 2),
                  b: Math.min(o.b, v ? 3 : 2),
                }))
              }
            >
              Include third resistor
            </Toggle>
            <Select
              label="Positive output terminal"
              value={String(s.a)}
              options={m.nodes.map((_, j) => [String(j), `Node N${j}`])}
              onChange={(v) => set("a", +v)}
            />
            <Select
              label="Negative output terminal"
              value={String(s.b)}
              options={m.nodes.map((_, j) => [String(j), `Node N${j}`])}
              onChange={(v) => set("b", +v)}
            />
            <Toggle checked={s.closed} onChange={(v) => set("closed", v)}>
              Supply switch
            </Toggle>
          </>
        }
        equation={
          <Equation tex="V_i=\frac{R_i}{\sum_j R_j}V_s">
            V₁ = {s.closed ? s.v : 0} × {s.r1} / {m.total / 1000} ={" "}
            {fmt(m.drops[0])} V. Signed output between N{s.a} and N{s.b}:{" "}
            {fmt(m.output)} V.
          </Equation>
        }
      />
      <Graph
        xLabel="Junction index N"
        yLabel="Potential relative to return (V)"
        curve={m.nodes.map((v, j) => ({ x: j, y: v }))}
        annotation="Voltage-position chart at the junctions. Horizontal spacing represents component order, not physical wire resistance; each resistor accounts for its own voltage drop."
      />
      {mode === "Experiment" && (
        <Activity
          aim="Investigate the resistor ratio and output terminal polarity."
          steps={[
            "Start with 12 V, R₁ = 2 kΩ, R₂ = 4 kΩ. Select each resistor to read 4 V and 8 V.",
            "Drag the positive probe, or select a terminal from the controls. Output equals positive-node potential minus negative-node potential.",
            "Add R₃. Measure across two resistors together. Check the voltage drops still sum to the supply.",
            "For an 8 V output across R₂ at a 12 V supply, determine R₁:R₂ = 1:2.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="divider"
          spec={{
            question: `An unloaded divider has ${rs.map((r, j) => `R${j + 1} = ${r / 1000} kΩ`).join(", ")} and supply ${s.v} V. Find the voltage across R₁ with the switch closed.`,
            answer: divider(s.v, rs).drops[0],
            unit: "V",
            hints: [
              "The series current is the same through every resistor.",
              "Voltage divides in proportion to resistance.",
              "V₁ = V_supply × R₁/(sum of resistances).",
            ],
            solution: `V₁ = ${s.v} × ${s.r1}/${m.total / 1000}.`,
          }}
        />
      )}
      <Notes>
        <p>
          This is an unloaded divider measured with an ideal voltmeter. There is
          no hidden output load. Up to three resistors are supported. Equal
          terminal choices give zero output; reversing terminals reverses
          polarity. Opening the ideal source connection leaves zero potential
          differences throughout the passive resistor chain. The node potentials
          are referenced to the return terminal.
        </p>
      </Notes>
    </>
  );
}
