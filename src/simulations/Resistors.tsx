import { network, type Arrangement } from "../physics/engine";
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
import { Cell, Resistor, Stage, Switch, Wire } from "../components/Circuit";
export default function Resistors({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("resistors", {
    v: 12,
    r1: 4,
    r2: 6,
    r3: 3,
    kind: "series2" as Arrangement,
    closed: true,
    selected: 0,
    arrows: true,
    drops: true,
    equivalent: true,
    points: [] as Point[],
  });
  const m = network(s.v, [s.r1, s.r2, s.r3], s.kind, s.closed),
    b = m.branches[Math.min(s.selected, m.branches.length - 1)];
  const change = (patch: Partial<typeof s>) =>
    setState((o) => ({ ...o, ...patch, points: [] }));
  const resistor = (j: number, x: number, y: number, vertical = false) => (
    <g key={j}>
      <Resistor
        x={x}
        y={y}
        r={m.branches[j].r}
        label={`R${j + 1}`}
        vertical={vertical}
        selected={s.selected === j}
        onClick={() => set("selected", j)}
      />
      {s.drops && (
        <text
          x={x}
          y={y + (vertical ? 75 : 63)}
          textAnchor="middle"
          className="tiny-label"
        >
          {fmt(m.branches[j].v)} V · {fmt(m.branches[j].i)} A
        </text>
      )}
    </g>
  );
  const flow = (i: number) => (s.arrows ? i : 0);
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <Stage
            label={`${s.kind} resistor arrangement. Tap a resistor to inspect its voltage, current and power.`}
            paused={!s.closed}
          >
            <Cell x={90} y={180} emf={s.v} />
            {s.kind.startsWith("series") ? (
              <>
                <Wire d="M90 134V70H520V260H90V226" flow={flow(m.total)} />
                <Switch
                  x={300}
                  y={70}
                  closed={s.closed}
                  onClick={() => set("closed", !s.closed)}
                />
                {m.branches.map((_, j) =>
                  resistor(
                    j,
                    200 + j * (m.branches.length === 2 ? 230 : 140),
                    260,
                  ),
                )}
              </>
            ) : s.kind === "mixed" ? (
              <>
                <Wire d="M90 134V65H350M350 300H90V226" flow={flow(m.total)} />
                <Wire d="M350 65V300" flow={flow(m.branches[1].i)} />
                <Wire d="M350 65H500V300H350" flow={flow(m.branches[2].i)} />
                <Resistor
                  x={260}
                  y={65}
                  r={s.r1}
                  label="R1"
                  selected={s.selected === 0}
                  onClick={() => set("selected", 0)}
                />
                {resistor(1, 350, 180, true)}
                {resistor(2, 500, 180, true)}
                <text
                  x="290"
                  y="337"
                  textAnchor="middle"
                  className="tiny-label"
                >
                  R₁ in series with (R₂ ∥ R₃)
                </text>
              </>
            ) : (
              <>
                <Wire
                  d={`M90 134V75H210V95M510 ${95 + (m.branches.length - 1) * (m.branches.length === 2 ? 150 : 90)}V305H90V226`}
                  flow={flow(m.total)}
                />
                {m.branches.map((branch, j) => (
                  <g key={j}>
                    {j < m.branches.length - 1 && (
                      <>
                        <Wire
                          d={`M210 ${95 + j * (m.branches.length === 2 ? 150 : 90)}V${95 + (j + 1) * (m.branches.length === 2 ? 150 : 90)}`}
                          flow={flow(
                            m.branches
                              .slice(j + 1)
                              .reduce((sum, b) => sum + b.i, 0),
                          )}
                        />
                        <Wire
                          d={`M510 ${95 + j * (m.branches.length === 2 ? 150 : 90)}V${95 + (j + 1) * (m.branches.length === 2 ? 150 : 90)}`}
                          flow={flow(
                            m.branches
                              .slice(0, j + 1)
                              .reduce((sum, b) => sum + b.i, 0),
                          )}
                        />
                      </>
                    )}
                    <Wire
                      d={`M210 ${95 + j * (m.branches.length === 2 ? 150 : 90)}H510`}
                      flow={flow(branch.i)}
                    />
                    {resistor(
                      j,
                      350,
                      95 + j * (m.branches.length === 2 ? 150 : 90),
                    )}
                  </g>
                ))}
              </>
            )}
            <text x="300" y="20" textAnchor="middle" className="tiny-label">
              {s.equivalent
                ? `EQUIVALENT RESISTANCE ${fmt(m.req)} Ω`
                : "SELECT A COMPONENT TO INSPECT"}
            </text>
          </Stage>
        }
        meters={
          <Meters>
            <Meter label="Total current" value={m.total} unit="A" accent />
            <Meter
              label={`Selected R${Math.min(s.selected, m.branches.length - 1) + 1} voltage`}
              value={b.v}
              unit="V"
            />
            <Meter label="Selected power" value={b.p} unit="W" />
          </Meters>
        }
        controls={
          <>
            <Select
              label="Circuit configuration"
              value={s.kind}
              onChange={(v) => change({ kind: v as Arrangement, selected: 0 })}
              options={[
                ["series2", "Two resistors · series"],
                ["series3", "Three resistors · series"],
                ["parallel2", "Two resistors · parallel"],
                ["parallel3", "Three resistors · parallel"],
                ["mixed", "Mixed · R₁ + (R₂ ∥ R₃)"],
              ]}
            />
            <Range
              label="Source voltage"
              value={s.v}
              min={0}
              max={24}
              step={0.5}
              unit="V"
              onChange={(v) => set("v", v)}
            />
            {(["r1", "r2", "r3"] as const)
              .slice(0, m.branches.length)
              .map((key, j) => (
                <Range
                  key={key}
                  label={`Resistor R${j + 1}`}
                  value={s[key]}
                  min={1}
                  max={30}
                  step={0.5}
                  unit="Ω"
                  onChange={(v) => change({ [key]: v })}
                />
              ))}
            <Select
              label="Inspect component"
              value={String(s.selected)}
              options={m.branches.map((_, j) => [
                String(j),
                `R${j + 1} · ${fmt(m.branches[j].i)} A`,
              ])}
              onChange={(v) => set("selected", +v)}
            />
            <Toggle checked={s.closed} onChange={(v) => set("closed", v)}>
              Circuit switch
            </Toggle>
            <Toggle checked={s.arrows} onChange={(v) => set("arrows", v)}>
              Show current flow
            </Toggle>
            <Toggle checked={s.drops} onChange={(v) => set("drops", v)}>
              Show voltage drops
            </Toggle>
            <Toggle
              checked={s.equivalent}
              onChange={(v) => set("equivalent", v)}
            >
              Show equivalent resistance
            </Toggle>
          </>
        }
        equation={
          <Equation
            tex={
              s.kind === "mixed"
                ? String.raw`R_{eq}=R_1+\frac{R_2R_3}{R_2+R_3}`
                : s.kind.startsWith("series")
                  ? String.raw`R_{eq}=\sum_i R_i`
                  : String.raw`\frac{1}{R_{eq}}=\sum_i\frac{1}{R_i}`
            }
          >
            R_eq = {fmt(m.req)} Ω; I = {fmt(m.total)} A. Selected component:{" "}
            {fmt(b.r)} Ω, {fmt(b.v)} V, {fmt(b.i)} A, {fmt(b.p)} W.
          </Equation>
        }
      />
      <Measurements
        points={s.points}
        onRecord={() =>
          set("points", [...s.points, { x: m.total, y: s.closed ? s.v : 0 }])
        }
        onClear={() => set("points", [])}
        xLabel="Total current I (A)"
        yLabel="Supply V (V)"
        curve={[
          { x: 0, y: 0 },
          { x: 24 / m.req, y: 24 },
        ]}
        annotation={`Equivalent resistance is the V–I gradient: ${fmt(m.req)} Ω. Changing the arrangement or resistors starts a new dataset.`}
      />
      {mode === "Experiment" && (
        <Activity
          aim="Compare voltage and current sharing in series, parallel and mixed circuits."
          steps={[
            "Choose a series circuit. Tap each resistor: currents match; voltage drops sum to the source.",
            "Choose a parallel circuit. Branch voltages match; branch currents sum to total current.",
            "Record five different supply settings and infer R_eq from the V–I slope. Repeat with another arrangement.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="resistors"
          spec={{
            question: `Determine the equivalent resistance of ${s.kind.replace(/2|3/g, "")} with R₁ = ${s.r1} Ω, R₂ = ${s.r2} Ω${m.branches.length === 3 ? `, R₃ = ${s.r3} Ω` : ""}.`,
            answer: m.req,
            unit: "Ω",
            hints: [
              "Identify which resistors are in series and which share both nodes.",
              "Series resistances add; parallel conductances add.",
              "For the mixed circuit, first reduce R₂ ∥ R₃, then add R₁.",
            ],
            solution: `Apply the ${s.kind} reduction to the displayed resistor values.`,
          }}
        />
      )}
      <Notes>
        <p>
          Series components carry equal current; their voltage drops sum to the
          supply. Parallel components share the same voltage; branch currents
          add at a junction. The mixed preset contains R₁ in series with R₂ ∥
          R₃. The animation indicates signed conventional current; its visible
          speed is scaled.
        </p>
      </Notes>
    </>
  );
}
