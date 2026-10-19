import { useId } from "react";
import { Cell, Resistor, Stage } from "../components/Circuit";
import { fmt } from "../components/Lab";
import {
  currentDirection,
  type CircuitParameters,
  type ReferenceSigns,
  type Triple,
} from "../physics/kirchhoff";

export const currentNames = ["I₁", "I₂", "I₃"];
export function currentText(value: number, signed = true) {
  if (currentDirection(value) === "zero") return "0.000";
  const magnitude = Math.abs(value);
  const text =
    magnitude < 0.0005 || magnitude >= 1e5
      ? fmt(magnitude, 4)
      : magnitude.toFixed(3);
  return `${value < 0 ? "−" : signed ? "+" : ""}${text}`;
}
export function referenceDirection(branch: number, sign: number) {
  return [
    ["left → upper junction", "upper junction → left"],
    ["upper junction → right", "right → upper junction"],
    ["upper → lower junction", "lower → upper junction"],
  ][branch][sign > 0 ? 0 : 1];
}
export function actualDirection(branch: number, value: number) {
  return currentDirection(value) === "zero"
    ? "no current"
    : referenceDirection(branch, value);
}

function FlowPath({
  d,
  value,
  speed,
  actual,
}: {
  d: string;
  value: number;
  speed: number;
  actual: boolean;
}) {
  return (
    <>
      <path d={d} className="wire" />
      {actual && currentDirection(value) !== "zero" && (
        <path
          d={d}
          className={`flow ${value < 0 ? "reverse" : ""}`}
          style={{ animationDuration: `${3 / speed}s` }}
        />
      )}
    </>
  );
}

function CurrentIndicator({
  branch,
  canonical,
  signed,
  reference,
  actual,
  speed,
  marker,
  d,
  x,
  y,
  anchor = "middle",
}: {
  branch: number;
  canonical: number;
  signed: number;
  reference: number;
  actual: boolean;
  speed: number;
  marker: string;
  d: string;
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
}) {
  const arrow = actual ? canonical : reference;
  const direction = currentDirection(arrow);
  return (
    <g
      className="branch-indicator"
      data-branch={branch + 1}
      data-current={canonical}
      data-reference-current={signed}
      data-direction={direction}
      data-view={actual ? "actual" : "reference"}
      role="group"
      aria-label={`${currentNames[branch]}: signed reference current ${currentText(signed)} amperes. Actual flow: ${actualDirection(branch, canonical)}.`}
    >
      <path
        d={d}
        className={`current-arrow ${actual ? "" : "assumed-arrow"}`}
        markerStart={direction === "reverse" ? `url(#${marker})` : undefined}
        markerEnd={direction === "forward" ? `url(#${marker})` : undefined}
      />
      {actual && direction !== "zero" && (
        <path
          d={d}
          className={`flow ${arrow < 0 ? "reverse" : ""}`}
          style={{ animationDuration: `${3 / speed}s` }}
        />
      )}
      <text x={x} y={y} textAnchor={anchor} className="branch-current-label">
        {currentNames[branch]} {currentText(signed)} A
      </text>
    </g>
  );
}
function ArrowMarker({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0L10 5 0 10Z" fill="var(--cyan)" />
      </marker>
    </defs>
  );
}
export type VisualProps = {
  canonical: Triple;
  currents: Triple;
  signs: ReferenceSigns;
  actual: boolean;
  speed: number;
};
export function JunctionView({
  canonical,
  currents,
  signs,
  actual,
  speed,
  lower,
}: VisualProps & { lower: boolean }) {
  const marker = useId();
  const geometry = lower
    ? [
        { d: "M300 200H70", x: 150, y: 172 },
        { d: "M530 200H300", x: 450, y: 172 },
        { d: "M300 35V200", x: 320, y: 80, anchor: "start" as const },
      ]
    : [
        { d: "M70 100H300", x: 150, y: 72 },
        { d: "M300 100H530", x: 450, y: 72 },
        { d: "M300 100V265", x: 320, y: 200, anchor: "start" as const },
      ];
  return (
    <svg
      className="junction-diagram"
      viewBox="0 0 600 310"
      role="group"
      aria-label={`Junction ${lower ? "B, lower" : "A, upper"}. ${actual ? "Actual conventional current directions" : "Assumed reference directions"}.`}
    >
      <ArrowMarker id={marker} />
      {geometry.map((g, j) => (
        <g key={j}>
          <path d={g.d} className="wire" />
          <CurrentIndicator
            {...g}
            d={
              lower
                ? ["M230 200H110", "M490 200H370", "M300 70V155"][j]
                : ["M110 100H230", "M370 100H490", "M300 145V230"][j]
            }
            branch={j}
            canonical={canonical[j]}
            signed={currents[j]}
            reference={signs[j]}
            actual={actual}
            speed={speed}
            marker={marker}
          />
        </g>
      ))}
      <circle cx="300" cy={lower ? 200 : 100} r="8" className="node" />
      <text
        x="300"
        y={lower ? 245 : 40}
        textAnchor="middle"
        className="junction-label"
      >
        {lower ? "B · Lower junction" : "A · Upper junction"}
      </text>
      <text x="300" y="300" textAnchor="middle" className="junction-caption">
        {actual
          ? "Actual conventional current flow"
          : "Reference arrows · assumptions, not physical flow"}
      </text>
    </svg>
  );
}

export function CircuitView({
  canonical,
  currents,
  signs,
  actual,
  speed,
  parameters: p,
  loop,
  clockwise,
  onLoop,
}: VisualProps & {
  parameters: CircuitParameters;
  loop: string;
  clockwise: boolean;
  onLoop: (loop: string) => void;
}) {
  const marker = useId();
  const single = p.structure === "single";
  return (
    <Stage
      label={`${single ? "One" : "Two"} closed loops with three named branch currents. ${currentNames.map((name, j) => `${name} ${currentText(currents[j])} amperes, actual flow ${actualDirection(j, canonical[j])}`).join(". ")}. ${actual ? "Actual conventional flow" : "Assumed references; animation paused"}.`}
    >
      <ArrowMarker id={marker} />
      {(["left", "right"] as const).slice(0, single ? 1 : 2).map((name) => (
        <path
          key={name}
          d={name === "left" ? "M125 90H278V270H125Z" : "M322 90H475V270H322Z"}
          className={`loop-highlight svg-button ${loop === name ? "active-loop" : ""}`}
          role="button"
          aria-label={`Analyse ${name} loop`}
          tabIndex={0}
          onClick={() => onLoop(name)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onLoop(name);
            }
          }}
        />
      ))}
      <FlowPath
        d="M300 290H100V70H300"
        value={canonical[0]}
        actual={actual}
        speed={speed}
      />
      {!single && (
        <FlowPath
          d="M300 70H500V290H300"
          value={canonical[1]}
          actual={actual}
          speed={speed}
        />
      )}
      <FlowPath
        d="M300 70V290"
        value={canonical[2]}
        actual={actual}
        speed={speed}
      />
      <Cell
        x={100}
        y={180}
        emf={Math.abs(p.e1)}
        reverse={p.e1 < 0}
        label="ε₁"
      />
      <Resistor x={205} y={70} r={p.r1} label="R₁" />
      <Resistor x={300} y={185} r={p.rs} label="Rₛ" vertical />
      {!single && (
        <>
          <Resistor x={410} y={70} r={p.r2} label="R₂" />
          <Cell
            x={500}
            y={180}
            emf={Math.abs(p.e2)}
            reverse={p.e2 >= 0}
            label="ε₂"
          />
        </>
      )}
      {[
        { d: "M145 132H240", x: 190, y: 160 },
        { d: "M365 132H455", x: 410, y: 160 },
        { d: "M270 175V230", x: 325, y: 252, anchor: "start" as const },
      ]
        .filter((_, j) => !single || j !== 1)
        .map((g, index) => {
          const j = single && index === 1 ? 2 : index;
          return (
            <CurrentIndicator
              key={j}
              {...g}
              branch={j}
              canonical={canonical[j]}
              signed={currents[j]}
              reference={signs[j]}
              actual={actual}
              speed={speed}
              marker={marker}
            />
          );
        })}
      <circle cx="300" cy="70" r="5" className="node" />
      <circle cx="300" cy="290" r="5" className="node" />
      <text x="300" y="27" textAnchor="middle" className="junction-label">
        A · Upper junction
      </text>
      <text x="300" y="325" textAnchor="middle" className="junction-label">
        B · Lower junction
      </text>
      <text x="300" y="351" textAnchor="middle" className="tiny-label">
        {loop === "left" ? "LEFT" : "RIGHT"} LOOP ·{" "}
        {clockwise ? "CLOCKWISE" : "ANTICLOCKWISE"} TRAVERSAL
      </text>
    </Stage>
  );
}

export function CurrentCards({
  canonical,
  currents,
  signs,
}: Pick<VisualProps, "canonical" | "currents" | "signs">) {
  return (
    <div className="meters branch-meters">
      {[
        "Left Branch Current",
        "Right Branch Current",
        "Shared Branch Current",
      ].map((name, j) => (
        <div
          className="meter branch-meter"
          key={name}
          data-branch={j + 1}
          data-current={canonical[j]}
          data-reference-current={currents[j]}
        >
          <span>
            {currentNames[j]} — {name}
          </span>
          <strong>
            {currentText(currents[j])}
            <small>A</small>
          </strong>
          <p>Magnitude: {currentText(Math.abs(canonical[j]), false)} A</p>
          <p>Actual flow: {actualDirection(j, canonical[j])}</p>
          <p className="reference-caption">
            Reference: {referenceDirection(j, signs[j])}
          </p>
        </div>
      ))}
    </div>
  );
}
