import { temperature } from "../physics/engine";
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
import { Stage } from "../components/Circuit";
const coefficientPresets: [string, string][] = [
  ["0.004", "Reference metal · 0.004 °C⁻¹"],
  ["0.00393", "Copper · 0.00393 °C⁻¹"],
  ["0.00429", "Aluminium · 0.00429 °C⁻¹"],
  ["0.0004", "Nichrome · 0.0004 °C⁻¹"],
];
export default function Temperature({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("temperature", {
    t: 70,
    r0: 10,
    alpha: 0.004,
    v: 12,
    fixed: true,
    paused: false,
    points: [] as Point[],
  });
  const r = temperature(s.r0, s.alpha, s.t);
  const change = (patch: Partial<typeof s>) =>
    setState((o) => ({ ...o, ...patch, points: [] }));
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <Stage
            label={`Metal lattice at ${s.t} degrees Celsius; resistance ${fmt(r)} ohms.`}
            paused={s.paused}
            speed={0.5 + s.t / 70}
          >
            <rect
              x="50"
              y="65"
              width="500"
              height="185"
              rx="20"
              className="metal-chamber"
            />
            <rect
              x="50"
              y="65"
              width="500"
              height="185"
              rx="20"
              fill="#ff9560"
              opacity={(s.t + 20) / 550}
            />
            {Array.from({ length: 28 }, (_, j) => (
              <g
                key={j}
                transform={`translate(${85 + (j % 7) * 70} ${98 + Math.floor(j / 7) * 40})`}
              >
                <g
                  className="lattice-ion"
                  style={
                    {
                      animationDelay: `${-j * 0.13}s`,
                      "--vibration": `${1 + s.t / 30}px`,
                    } as React.CSSProperties
                  }
                >
                  <circle r="10" className="ion" />
                  <text textAnchor="middle" y="5">
                    +
                  </text>
                </g>
              </g>
            ))}
            <path d="M90 285H440" className="heater" />
            <text x="265" y="317" textAnchor="middle" className="value-label">
              HEATING CONTROL · {s.t} °C
            </text>
            <g transform="translate(511 278)">
              <rect
                x="-8"
                y="-90"
                width="16"
                height="90"
                rx="8"
                className="thermometer"
              />
              <rect
                x="-4"
                y={-s.t * 0.42}
                width="8"
                height={Math.max(1, s.t * 0.42 + 4)}
                fill="#ffbf69"
              />
              <circle r="14" fill="#ffbf69" />
            </g>
          </Stage>
        }
        meters={
          <Meters>
            <Meter label="Temperature" value={s.t} unit="°C" />
            <Meter label="Resistance" value={r} unit="Ω" accent />
            <Meter
              label={s.fixed ? "Current at fixed V" : "Measurement source off"}
              value={s.fixed ? s.v / r : 0}
              unit="A"
            />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Temperature"
              value={s.t}
              min={0}
              max={150}
              unit="°C"
              onChange={(v) => set("t", v)}
            />
            <Range
              label="Reference resistance at 20°C"
              value={s.r0}
              min={1}
              max={30}
              step={0.5}
              unit="Ω"
              onChange={(v) => change({ r0: v })}
            />
            <Select
              label="Metal coefficient preset"
              value={String(s.alpha)}
              options={
                coefficientPresets.some(([value]) => value === String(s.alpha))
                  ? coefficientPresets
                  : [
                      ...coefficientPresets,
                      [String(s.alpha), "Current coefficient"],
                    ]
              }
              onChange={(v) => change({ alpha: +v })}
            />
            <Range
              label="Temperature coefficient α"
              value={s.alpha}
              min={0.0001}
              max={0.006}
              step={0.00001}
              unit="°C⁻¹"
              onChange={(v) => change({ alpha: v })}
            />
            <Toggle checked={s.fixed} onChange={(v) => set("fixed", v)}>
              Fixed-voltage measurement
            </Toggle>
            {s.fixed && (
              <Range
                label="Fixed voltage"
                value={s.v}
                min={1}
                max={24}
                step={0.5}
                unit="V"
                onChange={(v) => set("v", v)}
              />
            )}
            <button onClick={() => set("paused", !s.paused)}>
              {s.paused ? "Resume lattice" : "Pause lattice"}
            </button>
          </>
        }
        equation={
          <Equation tex="R=R_0[1+\alpha(T-20)]">
            R = {s.r0}[1 + {s.alpha}({s.t} − 20)] = {fmt(r)} Ω.
          </Equation>
        }
      />
      <Measurements
        points={s.points}
        onRecord={() => set("points", [...s.points, { x: s.t, y: r }])}
        onClear={() => set("points", [])}
        xLabel="Temperature T (°C)"
        yLabel="Resistance R (Ω)"
        curve={[
          { x: 0, y: temperature(s.r0, s.alpha, 0) },
          { x: 150, y: temperature(s.r0, s.alpha, 150) },
        ]}
        annotation={`The line passes through (${20} °C, ${s.r0} Ω). Gradient = αR₀ = ${fmt(s.alpha * s.r0)} Ω/°C.`}
      />
      {mode === "Experiment" && (
        <Activity
          aim="Investigate resistance and temperature in a metal."
          steps={[
            "Use the same R₀ and α throughout a run. Record readings from 20 °C upward.",
            "Confirm that R = R₀ at 20 °C. Determine the gradient of your R–T graph.",
            "Enable fixed voltage. Explain the decrease in current as resistance increases.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="temperature"
          spec={{
            question: `R₀ = ${s.r0} Ω at 20 °C and α = ${s.alpha} °C⁻¹. Find R at ${s.t} °C.`,
            answer: r,
            unit: "Ω",
            hints: [
              "Use the linear temperature model.",
              "The temperature change is T − 20, not T.",
              "Multiply R₀ by [1 + α(T − 20)].",
            ],
            solution: `R = ${s.r0}[1 + ${s.alpha}(${s.t} − 20)].`,
          }}
        />
      )}
      <Notes>
        <p>
          Stronger lattice vibration increases electron scattering in ordinary
          metals. The vibration is illustrative. The linear model is an
          approximation over a limited temperature range, not a universal law
          for every material. Coefficients are referenced to 20 °C. Self-heating
          is excluded so temperature can be controlled independently.
        </p>
      </Notes>
    </>
  );
}
