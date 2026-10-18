import { accumulate, power } from "../physics/engine";
import { useClock, useLab } from "../hooks/useLab";
import {
  Activity,
  Challenge,
  Equation,
  Graph,
  Lab,
  Meter,
  Meters,
  Notes,
  Panel,
  Range,
  ResetEffect,
  Toggle,
  fmt,
  type Point,
  type SimProps,
} from "../components/Lab";
import { SimpleCircuit } from "../components/Circuit";
export default function Energy({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("energy", {
    v: 12,
    r: 6,
    closed: true,
    running: false,
    time: 0,
    energy: 0,
    points: [{ x: 0, y: 0 }] as Point[],
  });
  const m = power(s.v, s.r),
    p = s.closed ? m.p : 0;
  const flush = useClock(s.running, (dt) =>
    setState((o) => {
      const time = o.time + dt,
        energy = accumulate(o.energy, p, dt);
      let points = [...o.points, { x: time, y: energy }];
      if (points.length > 600)
        points = points.filter(
          (_, i) => i === 0 || i === points.length - 1 || i % 2 === 0,
        );
      return { ...o, time, energy, points };
    }),
  );
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            <SimpleCircuit
              v={s.v}
              r={s.r}
              i={s.closed ? m.i : 0}
              loadV={s.closed ? s.v : 0}
              closed={s.closed}
              toggle={() => {
                flush();
                set("closed", !s.closed);
              }}
              lamp
              power={p}
            />
            <p className="visual-caption">
              Ideal resistive lamp · nominal brightness at 24 W
            </p>
          </>
        }
        meters={
          <Meters>
            <Meter label="Wattmeter" value={p} unit="W" accent />
            <Meter label="Energy counter" value={s.energy} unit="J" />
            <Meter label="Stopwatch" value={s.time} unit="s" />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Applied voltage"
              value={s.v}
              min={0}
              max={24}
              step={0.5}
              unit="V"
              onChange={(v) => {
                flush();
                set("v", v);
              }}
            />
            <Range
              label="Load resistance"
              value={s.r}
              min={1}
              max={30}
              step={0.5}
              unit="Ω"
              onChange={(v) => {
                flush();
                set("r", v);
              }}
            />
            <Toggle
              checked={s.closed}
              onChange={(v) => {
                flush();
                set("closed", v);
              }}
            >
              Circuit switch
            </Toggle>
            <div className="button-row">
              <button
                className="primary"
                onClick={() => {
                  flush();
                  set("running", !s.running);
                }}
              >
                {s.running ? "Pause stopwatch" : "Run stopwatch"}
              </button>
              <button
                onClick={() =>
                  setState((o) => ({
                    ...o,
                    time: 0,
                    energy: 0,
                    points: [{ x: 0, y: 0 }],
                    running: false,
                  }))
                }
              >
                Restart experiment
              </button>
              <button
                onClick={() =>
                  setState((o) => ({
                    ...o,
                    time: 0,
                    points: [{ x: 0, y: o.energy }],
                  }))
                }
              >
                Reset timer
              </button>
              <button
                onClick={() =>
                  setState((o) => ({
                    ...o,
                    energy: 0,
                    points: [{ x: o.time, y: 0 }],
                  }))
                }
              >
                Reset energy
              </button>
            </div>
            <p className="muted">
              Stopwatch and energy integration run at real elapsed time while
              this experiment is visible. Pausing retains both counters.
            </p>
            <p>
              Current {fmt(s.closed ? m.i : 0)} A · voltage{" "}
              {fmt(s.closed ? s.v : 0)} V · resistance {s.r} Ω.
            </p>
          </>
        }
        equation={
          <>
            <Equation tex="P=IV=I^2R=\frac{V^2}{R}">
              P = {fmt(s.closed ? m.i : 0)} × {s.closed ? s.v : 0} = {fmt(p)} W.
            </Equation>
            <Equation tex="W=Pt\quad\text{(constant power)}">
              For changing power, the energy counter sums each PΔt. Present run:{" "}
              {fmt(s.energy)} J.
            </Equation>
          </>
        }
      />
      <Panel label="Energy over time">
        <Graph
          curve={s.points}
          traceLabel="Integrated simulation trace"
          xLabel="Elapsed time t (s)"
          yLabel="Energy W (J)"
          annotation="Live integrated energy is drawn as a continuous trace. Its local gradient is power. Changing voltage changes the slope without rewriting earlier energy."
        />
        <p className="muted">
          This graph is generated from the simulation clock, not manually
          collected readings.
        </p>
      </Panel>
      {mode === "Experiment" && (
        <Activity
          aim="Measure power and accumulate electrical energy."
          steps={[
            "Set 12 V and 6 Ω. Restart the experiment, then run the stopwatch for about 10 s.",
            "Read P = 24 W and W ≈ 240 J. Compare energy divided by time with power.",
            "Change voltage while the timer runs. Explain the change in the energy graph gradient.",
            "With resistance fixed, double voltage. Observe that power increases by a factor of four.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="energy"
          spec={{
            question: `A steady ${s.v} V is applied across ${s.r} Ω for 10 s with the switch closed. How much energy is transferred?`,
            answer: m.p * 10,
            unit: "J",
            hints: [
              "First calculate the constant power.",
              "P = V²/R; energy W = Pt.",
              "Use t = 10 s, not the current stopwatch reading.",
            ],
            solution: `P = ${s.v}²/${s.r} = ${fmt(m.p)} W. W = P × 10.`,
          }}
        />
      )}
      <Notes>
        <p>
          The lamp is an ideal constant-resistance load. Brightness is a bounded
          visual mapping of electrical power relative to a 24 W nominal rating;
          it is not a photometric measurement. Real incandescent filaments heat
          up and change resistance. The integration clock is independent of
          visual animation. Hidden browser time and time spent in another
          experiment are excluded. Resetting either counter starts a fresh graph
          segment.
        </p>
      </Notes>
    </>
  );
}
