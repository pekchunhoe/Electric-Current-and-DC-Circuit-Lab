import { useEffect, useRef } from "react";
import { microscopic } from "../physics/engine";
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
  Range,
  ResetEffect,
  Toggle,
  fmt,
  type SimProps,
} from "../components/Lab";
function Electrons({
  drift,
  area,
  speed,
  paused,
  conventional,
  electron,
}: {
  drift: number;
  area: number;
  speed: number;
  paused: boolean;
  conventional: boolean;
  electron: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = 600 * dpr;
    canvas.height = 320 * dpr;
    ctx.scale(dpr, dpr);
    const half = 35 + Math.sqrt(area) * 22;
    const particles = Array.from({ length: 52 }, (_, j) => ({
      x: 45 + ((j * 109) % 510),
      y: 160 - half + 12 + (((j * 43) % 100) / 100) * (2 * half - 24),
      vx: Math.sin(j * 2.7),
      vy: Math.cos(j * 3.2),
    }));
    let last = performance.now(),
      frame = 0;
    function draw(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, 600, 320);
      ctx.fillStyle = "#102a38";
      ctx.strokeStyle = "#3f6978";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(30, 160 - half, 540, 2 * half, 18);
      ctx.fill();
      ctx.stroke();
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 10; col++) {
          const x = 65 + col * 52,
            y = 160 - half + 22 + (row * (2 * half - 44)) / 3;
          ctx.fillStyle = "#587386";
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#aac2cd";
          ctx.font = "12px sans-serif";
          ctx.fillText("+", x - 3.5, y + 4);
        }
      ctx.strokeStyle = "#ffbf69";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(330, 160 - half - 16);
      ctx.lineTo(330, 160 + half + 16);
      ctx.stroke();
      ctx.setLineDash([]);
      particles.forEach((p, j) => {
        if (!paused) {
          p.vx += Math.sin(now / 270 + j) * dt * 2;
          p.vy += Math.cos(now / 230 + j) * dt * 2;
          p.vx = Math.max(-1, Math.min(1, p.vx));
          p.vy = Math.max(-1, Math.min(1, p.vy));
          p.x +=
            p.vx * 38 * dt * speed -
            Math.sign(drift) * Math.min(35, Math.abs(drift) * 1e5) * dt * speed;
          p.y += p.vy * 40 * dt * speed;
          if (p.x < 38) p.x = 560;
          if (p.x > 562) p.x = 40;
          if (p.y < 164 - half || p.y > 156 + half) {
            p.vy *= -1;
            p.y = Math.max(164 - half, Math.min(156 + half, p.y));
          }
        }
        ctx.fillStyle = "#6de5dd";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#6de5dd";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#a5becb";
      ctx.fillText("METAL CONDUCTOR · MICROSCOPIC VIEW", 32, 32);
      ctx.fillStyle = "#ffbf69";
      ctx.fillText("Counting plane", 343, 160 + half + 30);
      const arrow = (y: number, dir: number, label: string, color: string) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(dir > 0 ? 70 : 260, y);
        ctx.lineTo(dir > 0 ? 260 : 70, y);
        ctx.stroke();
        ctx.beginPath();
        const end = dir > 0 ? 260 : 70;
        ctx.moveTo(end, y);
        ctx.lineTo(end - dir * 9, y - 5);
        ctx.lineTo(end - dir * 9, y + 5);
        ctx.fill();
        ctx.fillText(label, 70, y - 12);
      };
      if (conventional && drift !== 0)
        arrow(65, drift < 0 ? -1 : 1, "Conventional current", "#ffbf69");
      if (electron && drift !== 0)
        arrow(289, drift < 0 ? 1 : -1, "Average electron drift", "#6de5dd");
      if (!paused) frame = requestAnimationFrame(draw);
    }
    draw(last);
    return () => cancelAnimationFrame(frame);
  }, [drift, area, speed, paused, conventional, electron]);
  return (
    <canvas
      ref={ref}
      className="electron-canvas"
      role="img"
      aria-label="Simplified free electrons with random motion and a small net drift opposite to conventional current. Orange line marks the counting plane."
    />
  );
}
export default function Current({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("current", {
    v: 0.034,
    area: 1,
    interval: 2,
    speed: 1,
    paused: false,
    conventional: true,
    electron: true,
    counting: false,
    elapsed: 0,
    q: 0,
  });
  const m = microscopic(s.v, s.area * 1e-6, s.interval);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useClock(s.counting && !s.paused, (dt) =>
    setState((old) => {
      const step = Math.min(dt, old.interval - old.elapsed);
      return {
        ...old,
        elapsed: old.elapsed + step,
        q: old.q + m.i * step,
        counting: old.elapsed + step < old.interval - 1e-9,
      };
    }),
  );
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            <Electrons
              drift={m.drift}
              area={s.area}
              speed={s.speed}
              paused={s.paused || reduced}
              conventional={s.conventional}
              electron={s.electron}
            />
            <p className="visual-caption">
              Random motion + a small net drift. Particle count and motion are
              scaled for visibility.
            </p>
          </>
        }
        meters={
          <Meters>
            <Meter label="Electric current" value={m.i} unit="A" accent />
            <Meter
              label="Drift speed"
              value={Math.abs(m.drift) * 1000}
              unit="mm/s"
            />
            <Meter label="Charge counted" value={s.q} unit="C" />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Applied voltage"
              value={s.v}
              min={-0.1}
              max={0.1}
              step={0.001}
              unit="V"
              onChange={(v) => set("v", v)}
            />
            <Range
              label="Cross-sectional area"
              value={s.area}
              min={0.2}
              max={3}
              step={0.1}
              unit="mm²"
              onChange={(v) => set("area", v)}
            />
            <Range
              label="Counting interval"
              value={s.interval}
              min={1}
              max={10}
              step={0.5}
              unit="s"
              onChange={(v) =>
                setState((o) => ({
                  ...o,
                  interval: v,
                  elapsed: 0,
                  q: 0,
                  counting: false,
                }))
              }
            />
            <Range
              label="Animation speed"
              value={s.speed}
              min={0.25}
              max={3}
              step={0.25}
              unit="×"
              onChange={(v) => set("speed", v)}
            />
            <Toggle
              checked={s.conventional}
              onChange={(v) => set("conventional", v)}
            >
              Conventional current arrow
            </Toggle>
            <Toggle checked={s.electron} onChange={(v) => set("electron", v)}>
              Electron drift arrow
            </Toggle>
            <div className="button-row">
              <button onClick={() => set("paused", !s.paused)}>
                {s.paused ? "Resume motion" : "Pause motion"}
              </button>
              <button
                className="primary"
                onClick={() =>
                  setState((o) => ({
                    ...o,
                    counting: true,
                    elapsed: 0,
                    q: 0,
                    paused: false,
                  }))
                }
              >
                Start charge count
              </button>
            </div>
            <p className="muted">
              Counter: {fmt(s.elapsed)} / {s.interval} s. Playback speed affects
              the illustration only.
            </p>
          </>
        }
        equation={
          <Equation tex="I=\frac{\Delta Q}{\Delta t},\qquad Q=ne">
            At this steady setting: Q = {fmt(m.i)} × {s.interval} = {fmt(m.q)}{" "}
            C; {fmt(m.electrons)} electrons cross in {s.interval} s.
          </Equation>
        }
      />
      <div className="support-grid">
        <Graph
          xLabel="Time t (s)"
          yLabel="Charge Q (C)"
          curve={[
            { x: 0, y: 0 },
            { x: s.interval, y: m.q },
          ]}
          points={s.elapsed ? [{ x: s.elapsed, y: s.q }] : []}
          annotation="The line predicts constant-current charge transfer. The point shows the integrated counter; changing voltage during counting can move it off this line."
        />
        <Notes>
          <p>
            Fixed copper-like conductor: length 2 m, resistivity 1.7 × 10⁻⁸ Ω m,
            electron number density nₑ = 8.5 × 10²⁸ m⁻³. Charge count n is a
            number of electrons; number density nₑ is electrons per cubic metre.
            Electrons drift opposite to the signed conventional current.
            Positive lattice ions stay bound in the metal.
          </p>
          <Equation tex="I=n_e e A v_d" />
          <p>
            This is a supporting microscopic model. The drawn random
            trajectories and exaggerated drift are qualitative; they do not
            represent electron thermal speeds to scale. Negative Q indicates
            transfer opposite to the positive reference direction.
          </p>
        </Notes>
      </div>
      {mode === "Experiment" && (
        <Activity
          aim="Measure transferred charge and infer current."
          steps={[
            "Set a positive voltage and keep it fixed during a count.",
            "Start charge count. Wait for the chosen interval to finish.",
            "Divide measured charge by elapsed time; compare with the ammeter. Repeat with a different area.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="current"
          spec={{
            question: `At the current steady setting, ${fmt(m.q, 6)} C passes in ${s.interval} s. What is the signed current?`,
            answer: m.i,
            unit: "A",
            hints: [
              "Current is charge transferred per unit time.",
              "Use I = ΔQ / Δt.",
              "Divide the stated charge by the counting interval.",
            ],
            solution: `I = Q/t = ${fmt(m.q, 6)}/${s.interval}.`,
          }}
        />
      )}
    </>
  );
}
