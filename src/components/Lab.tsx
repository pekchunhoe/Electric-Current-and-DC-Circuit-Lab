import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import katex from "katex";
import { regression } from "../physics/engine";
export const fmt = (n: number, digits = 3) =>
  !Number.isFinite(n)
    ? "—"
    : n !== 0 && (Math.abs(n) < 0.001 || Math.abs(n) >= 1e5)
      ? n.toExponential(2)
      : Number(n.toPrecision(digits)).toLocaleString("en", {
          maximumFractionDigits: 6,
        });
export function Equation({
  tex,
  children,
}: {
  tex: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current)
      katex.render(tex, ref.current, {
        throwOnError: false,
        trust: false,
        strict: "error",
        output: "htmlAndMathml",
      });
  }, [tex]);
  return (
    <div className="equation">
      <div ref={ref} />
      {children && <p>{children}</p>}
    </div>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <div className="range">
      <div className="range-title">
        <label htmlFor={id}>{label}</label>
        <span>
          <input
            aria-label={`${label} exact value`}
            type="number"
            value={draft}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              setDraft(e.currentTarget.value);
              const v = e.currentTarget.valueAsNumber;
              if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
            }}
            onBlur={() => setDraft(String(value))}
          />
          {unit}
        </span>
      </div>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={
          {
            "--fill": `${(100 * (value - min)) / (max - min)}%`,
          } as React.CSSProperties
        }
      />
      <div className="range-limits">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="select-label">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      className="toggle-row"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span>{children}</span>
      <span className={`toggle ${checked ? "on" : ""}`}>
        <i />
      </span>
    </button>
  );
}
export function Meter({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className={`meter ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>
        {fmt(value)}
        <small>{unit}</small>
      </strong>
      <div className="meter-dots">•••</div>
    </div>
  );
}
export function Meters({ children }: { children: ReactNode }) {
  return <div className="meters">{children}</div>;
}
export function Panel({
  label,
  children,
  actions,
}: {
  label: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>{label}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function Lab({
  visual,
  meters,
  controls,
  equation,
  children,
}: {
  visual: ReactNode;
  meters: ReactNode;
  controls: ReactNode;
  equation: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="lab-grid">
        <div className="bench">
          <div className="bench-top">
            <span>
              <i className="led" /> LIVE SIMULATION
            </span>
            <span>VIRTUAL INSTRUMENTS</span>
          </div>
          {visual}
          {meters}
        </div>
        <Panel label="Experiment controls">
          {controls}
          <div className="calculation-label">THE PHYSICS</div>
          {equation}
        </Panel>
      </div>
      {children}
    </>
  );
}
export type Point = { x: number; y: number; tag?: string };
export function Graph({
  points = [],
  curve = [],
  xLabel,
  yLabel,
  annotation,
  traceLabel = "Theoretical model",
}: {
  points?: Point[];
  curve?: Point[];
  xLabel: string;
  yLabel: string;
  annotation?: string;
  traceLabel?: string;
}) {
  const [selected, setSelected] = useState(-1);
  const all = [...points, ...curve, { x: 0, y: 0 }];
  let xmin = Math.min(...all.map((p) => p.x)),
    xmax = Math.max(...all.map((p) => p.x)),
    ymin = Math.min(...all.map((p) => p.y)),
    ymax = Math.max(...all.map((p) => p.y));
  if (xmin === xmax) xmax = xmin + 1;
  if (ymin === ymax) ymax = ymin + 1;
  const dx = (xmax - xmin) * 0.08,
    dy = (ymax - ymin) * 0.08;
  xmax += dx;
  ymax += dy;
  if (xmin < 0) xmin -= dx;
  if (ymin < 0) ymin -= dy;
  const X = (x: number) => 67 + ((x - xmin) / (xmax - xmin)) * 457,
    Y = (y: number) => 238 - ((y - ymin) / (ymax - ymin)) * 192;
  return (
    <div className="graph">
      <svg
        viewBox="0 0 560 290"
        role="img"
        aria-label={`${yLabel} against ${xLabel}. ${annotation ?? ""}`}
      >
        <title>
          {yLabel} against {xLabel}
        </title>
        {Array.from({ length: 5 }, (_, i) => {
          const x = xmin + ((xmax - xmin) * i) / 4,
            y = ymin + ((ymax - ymin) * i) / 4;
          return (
            <g key={i}>
              <path className="gridline" d={`M${X(x)} 46V238M67 ${Y(y)}H524`} />
              <text x={X(x)} y="257" textAnchor="middle">
                {fmt(x, 2)}
              </text>
              <text x="58" y={Y(y) + 4} textAnchor="end">
                {fmt(y, 2)}
              </text>
            </g>
          );
        })}
        <path className="axis" d="M67 40V238H530" />
        <text x="300" y="282" textAnchor="middle">
          {xLabel}
        </text>
        <text transform="translate(16 144) rotate(-90)" textAnchor="middle">
          {yLabel}
        </text>
        {curve.length > 0 && (
          <polyline
            className="theory"
            points={curve.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}
          />
        )}{" "}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={X(p.x)}
            cy={Y(p.y)}
            r="4.5"
            className="data-point"
          >
            <title>{`${xLabel}: ${fmt(p.x)}; ${yLabel}: ${fmt(p.y)} ${p.tag ?? ""}`}</title>
          </circle>
        ))}
      </svg>
      <div className="graph-legend">
        <span>
          <i />
          {traceLabel}
        </span>
        <span>
          <i />
          Recorded readings
        </span>
      </div>
      {points.length > 0 && (
        <label className="graph-inspect">
          Inspect a recorded point
          <select
            aria-label="Inspect recorded graph point"
            value={selected < points.length ? selected : -1}
            onChange={(e) => setSelected(+e.target.value)}
          >
            <option value="-1">Select a reading</option>
            {points.map((p, i) => (
              <option key={i} value={i}>
                {i + 1}: {xLabel} = {fmt(p.x)}; {yLabel} = {fmt(p.y)}
              </option>
            ))}
          </select>
        </label>
      )}
      {annotation && <p className="graph-annotation">{annotation}</p>}
    </div>
  );
}
export function Measurements({
  points,
  onRecord,
  onClear,
  xLabel,
  yLabel,
  curve,
  annotation,
  extra,
}: {
  points: Point[];
  onRecord: () => void;
  onClear: () => void;
  xLabel: string;
  yLabel: string;
  curve: Point[];
  annotation?: string;
  extra?: (p: Point) => string;
}) {
  const fit = regression(points);
  return (
    <Panel
      label="Laboratory notebook"
      actions={<span className="pill">{points.length} readings</span>}
    >
      <div className="notebook">
        <div>
          <div className="button-row">
            <button className="primary" onClick={onRecord}>
              ＋ Record reading
            </button>
            <button onClick={onClear} disabled={!points.length}>
              Clear data
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{xLabel}</th>
                  <th>{yLabel}</th>
                  {extra && <th>V/I (Ω)</th>}
                </tr>
              </thead>
              <tbody>
                {points.length === 0 ? (
                  <tr>
                    <td colSpan={extra ? 4 : 3} className="empty">
                      Adjust a control, then record a reading.
                    </td>
                  </tr>
                ) : (
                  points.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {fmt(p.x)} {p.tag && <small>{p.tag}</small>}
                      </td>
                      <td>{fmt(p.y)}</td>
                      {extra && <td>{extra(p)}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="muted">
            {fit
              ? `Least-squares fit of your recorded points: gradient ${fmt(fit.slope)}, intercept ${fmt(fit.intercept)}.`
              : "Record at least two distinct x-values to calculate a fitted gradient."}
          </p>
        </div>
        <Graph
          points={points}
          curve={curve}
          xLabel={xLabel}
          yLabel={yLabel}
          annotation={annotation}
        />
      </div>
    </Panel>
  );
}
export type ChallengeSpec = {
  question: string;
  answer: number;
  unit: string;
  hints: string[];
  solution: string;
};
const challengeCache = new Map<
  string,
  {
    answer: string;
    tried: boolean;
    hint: number;
    reveal: boolean;
    score: number;
    question: string;
    solved: string[];
  }
>();
export function Challenge({ id, spec }: { id: string; spec: ChallengeSpec }) {
  const [state, setState] = useState(() => {
    const cached = challengeCache.get(id);
    return cached?.question === spec.question
      ? cached
      : {
          answer: "",
          tried: false,
          hint: 0,
          reveal: false,
          score: cached?.score ?? 0,
          question: spec.question,
          solved: cached?.solved ?? [],
        };
  });
  const previous = useRef(spec.question);
  useEffect(() => {
    if (previous.current !== spec.question) {
      previous.current = spec.question;
      setState((s) => ({
        ...s,
        answer: "",
        tried: false,
        hint: 0,
        reveal: false,
        question: spec.question,
      }));
    }
  }, [spec.question]);
  useEffect(() => {
    challengeCache.set(id, state);
  }, [id, state]);
  const correct =
    state.answer.trim() !== "" &&
    Math.abs(Number(state.answer) - spec.answer) <=
      Math.max(0.0005, Math.abs(spec.answer) * 0.015);
  return (
    <Panel
      label="Test your understanding"
      actions={<span className="pill">{state.score} correct</span>}
    >
      <p className="challenge-question">{spec.question}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setState((s) => ({
            ...s,
            tried: true,
            score:
              s.score + (correct && !s.solved.includes(spec.question) ? 1 : 0),
            solved:
              correct && !s.solved.includes(spec.question)
                ? [...s.solved, spec.question]
                : s.solved,
          }));
        }}
      >
        <label className="answer-label">
          Your answer ({spec.unit})
          <input
            required
            type="number"
            step="any"
            value={state.answer}
            placeholder="Enter your prediction"
            onChange={(e) =>
              setState((s) => ({
                ...s,
                answer: e.target.value,
                tried: false,
                reveal: false,
              }))
            }
          />
        </label>
        <div className="button-row">
          <button className="primary" type="submit">
            Check answer
          </button>
          <button
            type="button"
            onClick={() =>
              setState((s) => ({
                ...s,
                hint: Math.min(s.hint + 1, spec.hints.length),
              }))
            }
          >
            Hint {state.hint ? `${state.hint}/${spec.hints.length}` : ""}
          </button>
          {state.tried && (
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, reveal: !s.reveal }))}
            >
              Show worked solution
            </button>
          )}
        </div>
      </form>
      {state.hint > 0 && (
        <div className="hint">
          {spec.hints.slice(0, state.hint).map((h, i) => (
            <p key={h}>
              {i + 1}. {h}
            </p>
          ))}
        </div>
      )}
      {state.tried && (
        <p
          className={`feedback ${correct ? "correct" : "incorrect"}`}
          role="status"
        >
          {correct
            ? "Correct. Your result agrees with the physical model."
            : "Try again. Check the fixed quantities, unit conversions and sign convention. A tolerance of 1.5% is allowed."}
        </p>
      )}
      {state.reveal && (
        <div className="solution">
          <ol>
            <li>Choose the governing relationship: {spec.hints[0]}</li>
            <li>{spec.hints[1]}</li>
            <li>{spec.solution}</li>
          </ol>
          <strong>
            Answer: {fmt(spec.answer)} {spec.unit}.
          </strong>
        </div>
      )}
    </Panel>
  );
}
export function Activity({
  aim,
  steps,
  children,
}: {
  aim: string;
  steps: string[];
  children?: ReactNode;
}) {
  return (
    <Panel label="Guided experiment">
      <p className="aim">{aim}</p>
      <ol className="procedure">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {children}
    </Panel>
  );
}
export function Notes({ children }: { children: ReactNode }) {
  return (
    <details className="notes">
      <summary>Model assumptions & teaching notes</summary>
      <div>{children}</div>
    </details>
  );
}
export type Mode = "Explore" | "Experiment" | "Challenge";
export type SimProps = { mode: Mode; resetKey: number };
export function ResetEffect({
  resetKey,
  reset,
}: {
  resetKey: number;
  reset: () => void;
}) {
  const last = useRef(resetKey);
  useEffect(() => {
    if (last.current !== resetKey) {
      last.current = resetKey;
      reset();
    }
  }, [resetKey, reset]);
  return null;
}
