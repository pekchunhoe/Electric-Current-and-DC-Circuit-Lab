import type { ReactNode } from "react";
import { fmt } from "./Lab";
export function Stage({
  children,
  label,
  paused = false,
  speed = 1,
}: {
  children: ReactNode;
  label: string;
  paused?: boolean;
  speed?: number;
}) {
  return (
    <svg
      className={`stage ${paused ? "paused" : ""}`}
      style={
        { "--duration": `${Math.max(0.25, 3 / speed)}s` } as React.CSSProperties
      }
      viewBox="0 0 600 360"
      role="group"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".12" />
        </pattern>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5 0 10Z" fill="var(--cyan)" />
        </marker>
        <linearGradient id="metal">
          <stop stopColor="#4a626e" />
          <stop offset=".35" stopColor="#97aeba" />
          <stop offset=".7" stopColor="#4a626e" />
          <stop offset="1" stopColor="#263a48" />
        </linearGradient>
      </defs>
      <rect width="600" height="360" fill="url(#dots)" />
      {children}
    </svg>
  );
}
export function Wire({
  d,
  flow = 0,
  amber = false,
}: {
  d: string;
  flow?: number;
  amber?: boolean;
}) {
  return (
    <g>
      <path d={d} className={`wire ${amber ? "amber-wire" : ""}`} />
      {Math.abs(flow) > 1e-9 && (
        <path
          d={d}
          className={`flow ${flow < 0 ? "reverse" : ""}`}
          style={{
            animationDuration: `${Math.max(0.4, 3 / Math.sqrt(Math.abs(flow)))}s`,
          }}
        />
      )}
    </g>
  );
}
export function Resistor({
  x,
  y,
  r,
  label,
  vertical = false,
  selected = false,
  onClick,
}: {
  x: number;
  y: number;
  r: number;
  label: string;
  vertical?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={onClick ? "svg-button" : ""}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${fmt(r)} ohms${selected ? ", selected" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <rect
        x={vertical ? -28 : -48}
        y={vertical ? -48 : -28}
        width={vertical ? 56 : 96}
        height={vertical ? 96 : 56}
        fill="transparent"
      />
      <g transform={vertical ? "rotate(90)" : undefined}>
        <path d="M-48 0H-30M30 0H48" className="wire" />
        <rect
          x="-30"
          y="-12"
          width="60"
          height="24"
          rx="3"
          className={`resistor ${selected ? "selected" : ""}`}
        />
        <path d="M-22 0H22" className="resistor-core" />
      </g>
      <text
        x={vertical ? 35 : 0}
        y={vertical ? -5 : -27}
        textAnchor={vertical ? "start" : "middle"}
        className="component-label"
      >
        {label}
      </text>
      <text
        x={vertical ? 35 : 0}
        y={vertical ? 15 : 39}
        textAnchor={vertical ? "start" : "middle"}
        className="value-label"
      >
        {fmt(r)} Ω
      </text>
    </g>
  );
}
export function Cell({
  x,
  y,
  emf,
  label = "DC SOURCE",
  horizontal = false,
  reverse = false,
}: {
  x: number;
  y: number;
  emf: number;
  label?: string;
  horizontal?: boolean;
  reverse?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        transform={`rotate(${(horizontal ? 90 : 0) + (reverse !== emf < 0 ? 180 : 0)})`}
      >
        <rect
          x="-30"
          y="-46"
          width="60"
          height="92"
          rx="9"
          className="battery-body"
        />
        <path
          d="M-19 -8H19M-11 8H11M0 -46V-8M0 8V46"
          className="battery-symbol"
        />
        <text x="-27" y="-18" className="polarity">
          +
        </text>
      </g>
      <text
        x={horizontal ? 0 : -46}
        y={horizontal ? 58 : 2}
        textAnchor={horizontal ? "middle" : "end"}
        className="value-label"
      >
        {fmt(emf)} V
      </text>
      <text
        x="0"
        y={horizontal ? 78 : 69}
        textAnchor="middle"
        className="tiny-label"
      >
        {label}
      </text>
    </g>
  );
}
export function Instrument({
  x,
  y,
  symbol,
  value,
  unit,
}: {
  x: number;
  y: number;
  symbol: string;
  value: number;
  unit: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="22" className="instrument" />
      <text textAnchor="middle" y="6" className="instrument-symbol">
        {symbol}
      </text>
      <text y="44" textAnchor="middle" className="value-label">
        {fmt(value)} {unit}
      </text>
    </g>
  );
}
export function Switch({
  x,
  y,
  closed,
  onClick,
}: {
  x: number;
  y: number;
  closed: boolean;
  onClick: () => void;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className="svg-button"
      role="switch"
      aria-label="Circuit switch"
      aria-checked={closed}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <rect x="-39" y="-27" width="78" height="60" rx="5" fill="transparent" />
      <path
        d={`M-35 0H-22M22 0H35M-22 0L22 ${closed ? 0 : -24}`}
        className="switch-blade"
      />
      <circle cx="-22" r="3" className="node" />
      <circle cx="22" r="3" className="node" />
      <text y="30" textAnchor="middle" className="tiny-label">
        {closed ? "CLOSED" : "OPEN"}
      </text>
    </g>
  );
}
export function SimpleCircuit({
  v,
  r,
  i,
  loadV,
  closed,
  toggle,
  lamp = false,
  power = 0,
  internal,
}: {
  v: number;
  r: number;
  i: number;
  loadV: number;
  closed: boolean;
  toggle: () => void;
  lamp?: boolean;
  power?: number;
  internal?: number;
}) {
  return (
    <Stage
      label={`DC circuit. Source ${fmt(v)} volts. Load ${fmt(r)} ohms, current ${fmt(i)} amperes. Switch ${closed ? "closed" : "open"}.`}
      paused={!closed}
    >
      {internal !== undefined && (
        <rect
          x="56"
          y="115"
          width="213"
          height="195"
          rx="12"
          className="internal-box"
        />
      )}
      <Wire d="M100 134V80H265M335 80H500V270H100V226" flow={i} />
      <Cell x={100} y={180} emf={v} />
      <Switch x={300} y={80} closed={closed} onClick={toggle} />
      <Instrument x={430} y={80} symbol="A" value={i} unit="A" />
      {lamp ? (
        <g transform="translate(420 270)">
          <circle r="40" fill="#ffbe56" opacity={Math.min(0.8, power / 48)} />
          <circle
            r="23"
            className="lamp"
            style={{
              fill: `rgba(255,190,86,${0.05 + 0.85 * Math.min(1, power / 24)})`,
            }}
          />
          <path d="M-15 -15 15 15M15 -15-15 15" className="lamp-cross" />
          <text y="54" textAnchor="middle" className="value-label">
            {fmt(power)} W · {fmt(r)} Ω
          </text>
        </g>
      ) : (
        <Resistor x={420} y={270} r={r} label="LOAD" />
      )}
      <Wire
        d={internal !== undefined ? "M100 80H280V270" : "M360 270V170H480V270"}
      />
      <Instrument
        x={internal !== undefined ? 280 : 420}
        y={170}
        symbol="V"
        value={loadV}
        unit="V"
      />
      {internal !== undefined && (
        <g>
          <Resistor x={205} y={270} r={internal} label="r (internal)" />
        </g>
      )}
      <text x="300" y="334" textAnchor="middle" className="tiny-label">
        {closed ? "Conventional current →" : "Open circuit · no current"}
      </text>
    </Stage>
  );
}
