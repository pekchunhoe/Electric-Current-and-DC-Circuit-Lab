import { useRef } from "react";
import { cellResistance, potentiometer } from "../physics/engine";
import { useLab } from "../hooks/useLab";
import {
  Activity,
  Challenge,
  Equation,
  Lab,
  Meter,
  Meters,
  Notes,
  Panel,
  Range,
  ResetEffect,
  Select,
  Toggle,
  fmt,
  type SimProps,
} from "../components/Lab";
import {
  Cell,
  Instrument,
  Resistor,
  Stage,
  Switch,
  Wire,
} from "../components/Circuit";
type Reading = {
  length: number;
  loaded: boolean;
  cell: string;
  gradient: number;
  load: number;
};
export default function Potentiometer({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("potentiometer", {
    primary: 4,
    wireR: 10,
    rheostat: 10,
    e1: 1.6,
    e2: 1.2,
    cell: "1",
    internal: 1,
    load: 4,
    loaded: false,
    length: 80,
    closed: true,
    dragging: false,
    points: [] as Reading[],
    notice: "",
  });
  const m = potentiometer(
    s.primary,
    s.wireR,
    s.rheostat,
    s.cell === "1" ? s.e1 : s.e2,
    s.internal,
    s.load,
    s.loaded,
    s.length,
    s.closed,
  );
  const group = useRef<SVGGElement>(null);
  const dragging = useRef(false);
  const nullPoint = m.attainable && Math.abs(m.mismatch) < 1e-6;
  const change = (patch: Partial<typeof s>) =>
    setState((o) => ({
      ...o,
      ...patch,
      points: [],
      notice:
        "Primary or cell conditions changed; a new comparison dataset has started.",
    }));
  function drag(e: React.PointerEvent<SVGGElement>) {
    const svg = group.current?.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    set(
      "length",
      Math.round(
        Math.max(
          0,
          Math.min(
            100,
            (((e.clientX - rect.left) * 600) / rect.width - 70) / 4.6,
          ),
        ) * 10,
      ) / 10,
    );
  }
  function record() {
    if (!nullPoint) {
      set(
        "notice",
        "Adjust the jockey until the galvanometer reads zero before recording a balance.",
      );
      return;
    }
    set("points", [
      ...s.points,
      {
        length: s.length,
        loaded: s.loaded,
        cell: s.cell,
        gradient: m.k,
        load: s.load,
      },
    ]);
    set("notice", "Balance length recorded.");
  }
  const l1 = [...s.points].reverse().find((p) => !p.loaded && p.cell === "1"),
    l2 = [...s.points].reverse().find((p) => p.loaded && p.cell === "1"),
    c2 = [...s.points].reverse().find((p) => !p.loaded && p.cell === "2");
  const measuredR =
    l1 && l2 && l2.length > 0 && l2.length <= l1.length
      ? cellResistance(l1.length, l2.length, l2.load)
      : null;
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            <Stage
              label={`Slide-wire potentiometer, jockey at ${s.length} centimetres. Galvanometer ${fmt(m.galvanometer * 1e6)} microamperes. ${nullPoint ? "Null balance." : m.attainable ? "Adjust to find null." : "No attainable null."}`}
            >
              <rect
                x="38"
                y="90"
                width="524"
                height="95"
                rx="10"
                className="wood-board"
              />
              <Wire d="M70 118V48H235M305 48H530V118" flow={-m.primaryI} />
              <Switch
                x={270}
                y={48}
                closed={s.closed}
                onClick={() => set("closed", !s.closed)}
              />
              <Cell
                x={155}
                y={48}
                emf={s.primary}
                horizontal
                label="PRIMARY"
                reverse
              />
              <Resistor x={390} y={48} r={s.rheostat} label="RHEOSTAT" />
              <path d="M70 118H530" className="slide-wire" />
              {Array.from({ length: 21 }, (_, i) => (
                <g key={i}>
                  <path
                    d={`M${70 + i * 23} 151V${i % 2 ? 160 : 168}`}
                    className="ruler-tick"
                  />
                  {i % 2 === 0 && (
                    <text
                      x={70 + i * 23}
                      y="180"
                      textAnchor="middle"
                      className="ruler-number"
                    >
                      {i * 5}
                    </text>
                  )}
                </g>
              ))}
              <text x="550" y="178" className="ruler-number">
                cm
              </text>
              <Wire d={`M70 118V278H560V210H${70 + s.length * 4.6}V127`} />
              <Cell
                x={135}
                y={278}
                emf={m.target}
                horizontal
                label={s.loaded ? "LOADED CELL" : "TEST CELL"}
                reverse
              />
              <Instrument
                x={300}
                y={278}
                symbol="G"
                value={m.galvanometer * 1e6}
                unit="µA"
              />
              <g
                ref={group}
                style={{ touchAction: "none" }}
                className="probe-drag"
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
                  x={70 + s.length * 4.6 - 50}
                  y="100"
                  width="100"
                  height="100"
                  fill="transparent"
                />
                <path
                  d={`M${70 + s.length * 4.6} 118l-9 23h18z`}
                  className="jockey"
                />
                <rect
                  x={70 + s.length * 4.6 - 7}
                  y="142"
                  width="14"
                  height="55"
                  rx="5"
                  className="jockey-grip"
                />
              </g>
              <text x="300" y="226" textAnchor="middle" className="tiny-label">
                JOCKEY: {s.length.toFixed(1)} cm ·{" "}
                {nullPoint
                  ? "NULL BALANCE"
                  : m.attainable
                    ? "SLIDE TO ZERO THE GALVANOMETER"
                    : "NO NULL WITHIN THE WIRE"}
              </text>
            </Stage>
            <div className="galvanometer">
              <span>−</span>
              <div>
                <i
                  style={{
                    transform: `rotate(${Math.max(-65, Math.min(65, m.galvanometer * 1e6 * 0.5))}deg)`,
                  }}
                />
              </div>
              <span>+</span>
              <strong>
                {nullPoint ? "NULL" : `${fmt(m.galvanometer * 1e6)} µA`}
              </strong>
            </div>
          </>
        }
        meters={
          <Meters>
            <Meter label="Potential gradient" value={m.k} unit="V/cm" />
            <Meter label="Wire drop to jockey" value={m.wireDrop} unit="V" />
            <Meter label="Test cell voltage" value={m.target} unit="V" accent />
          </Meters>
        }
        controls={
          <>
            <Range
              label="Jockey position"
              value={s.length}
              min={0}
              max={100}
              step={0.1}
              unit="cm"
              onChange={(v) => set("length", v)}
            />
            <button
              disabled={!m.attainable || Math.abs(m.mismatch) > m.k * 0.11}
              onClick={() => set("length", m.balance!)}
            >
              Fine tune to null
            </button>
            <p className="muted">
              Slide to within 0.1 cm of balance, then fine tune for an exact
              ideal null.
            </p>
            <Range
              label="Primary supply"
              value={s.primary}
              min={1}
              max={6}
              step={0.1}
              unit="V"
              onChange={(v) => change({ primary: v })}
            />
            <Range
              label="Rheostat"
              value={s.rheostat}
              min={0}
              max={30}
              step={0.5}
              unit="Ω"
              onChange={(v) => change({ rheostat: v })}
            />
            <Select
              label="Test cell"
              value={s.cell}
              options={[
                ["1", "Cell 1 · internal resistance experiment"],
                ["2", "Cell 2 · emf comparison"],
              ]}
              onChange={(v) => set("cell", v)}
            />
            <Range
              label={s.cell === "1" ? "Cell 1 emf" : "Cell 2 emf"}
              value={s.cell === "1" ? s.e1 : s.e2}
              min={0.2}
              max={3}
              step={0.1}
              unit="V"
              onChange={(v) => change(s.cell === "1" ? { e1: v } : { e2: v })}
            />
            <Range
              label="Cell internal resistance"
              value={s.internal}
              min={0}
              max={4}
              step={0.1}
              unit="Ω"
              onChange={(v) => change({ internal: v })}
            />
            <Range
              label="Known external load"
              value={s.load}
              min={1}
              max={10}
              step={0.5}
              unit="Ω"
              onChange={(v) => change({ load: v })}
            />
            <Toggle checked={s.loaded} onChange={(v) => set("loaded", v)}>
              Connect cell load
            </Toggle>
            <Toggle checked={s.closed} onChange={(v) => set("closed", v)}>
              Primary circuit switch
            </Toggle>
            <p className={m.attainable ? "muted" : "status-warning"}>
              {!s.closed
                ? "Primary off: no balance gradient. The test cell can still drive a detector current through the wire."
                : m.attainable
                  ? "Find null by sliding the jockey. Use the exact-value field for fine adjustment."
                  : "No null exists on this 100 cm wire. Raise the primary voltage or lower the rheostat."}
            </p>
          </>
        }
        equation={
          <>
            <Equation tex="\varepsilon=kl,\qquad\frac{\varepsilon_1}{\varepsilon_2}=\frac{l_1}{l_2}">
              k = I_primary R_wire / 100 = {fmt(m.k)} V/cm. At null, the
              detector current is zero.
            </Equation>
            <Equation tex="r=R\left(\frac{l_1}{l_2}-1\right)">
              Use open-circuit length l₁ and loaded length l₂ for the same cell
              and unchanged gradient.
            </Equation>
          </>
        }
      />
      <Panel
        label="Balance-length notebook"
        actions={<span className="pill">{s.points.length} readings</span>}
      >
        <div className="button-row">
          <button className="primary" onClick={record}>
            ＋ Record null balance
          </button>
          <button
            disabled={!s.points.length}
            onClick={() => {
              set("points", []);
              set("notice", "Readings cleared.");
            }}
          >
            Clear readings
          </button>
        </div>
        <p className="muted" role="status">
          {s.notice ||
            "Only null-balance measurements can be recorded. Ideal null criterion: |ΔV| < 1 µV."}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cell</th>
                <th>Condition</th>
                <th>Length (cm)</th>
                <th>k (V/cm)</th>
                <th>Load (Ω)</th>
              </tr>
            </thead>
            <tbody>
              {s.points.map((p, i) => (
                <tr key={i}>
                  <td>{p.cell}</td>
                  <td>{p.loaded ? "Loaded" : "Open circuit"}</td>
                  <td>{p.length.toFixed(1)}</td>
                  <td>{fmt(p.gradient)}</td>
                  <td>{p.loaded ? p.load : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {measuredR !== null && (
          <div className="result-callout">
            Measured internal resistance: {fmt(measuredR)} Ω = {l2!.load}(
            {l1!.length}/{l2!.length} − 1).
          </div>
        )}
        {l1 && c2 && c2.length > 0 && (
          <div className="result-callout">
            Measured emf ratio ε₁/ε₂ = {l1.length}/{c2.length} ={" "}
            {fmt(l1.length / c2.length)}.
          </div>
        )}
      </Panel>
      {mode === "Experiment" && (
        <Activity
          aim="Experiment 3 · Determine the internal resistance of a dry cell by null balance."
          steps={[
            "Apparatus: 100 cm uniform wire (10 Ω), primary source, rheostat, test cell, galvanometer, known load and jockey.",
            "Close the primary switch. Keep the primary settings fixed. With cell 1 unloaded, slide to null and record l₁. Default: 80.0 cm.",
            "Connect the known 4 Ω load across cell 1. Slide to null and record l₂. Default: 64.0 cm.",
            "The notebook calculates r = R(l₁/l₂ − 1). Default result: 1 Ω.",
            "For emf comparison, remove the load, record cell 1, switch to cell 2 and record its balance without changing the primary settings.",
          ]}
        >
          <p className="muted">
            Common errors: changing the gradient between readings, recording
            before null, poor wire contact, or confusing loaded terminal voltage
            with emf. The ideal virtual cell has no polarization or heating.
          </p>
        </Activity>
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="potentiometer"
          spec={{
            question: `Open balance length is 80 cm, loaded balance is 64 cm and the known load is ${s.load} Ω. Determine the dry-cell internal resistance.`,
            answer: cellResistance(80, 64, s.load),
            unit: "Ω",
            hints: [
              "The primary potential gradient is the same for both balances.",
              "ε/V = l₁/l₂ = (R + r)/R.",
              "Rearrange to r = R(l₁/l₂ − 1).",
            ],
            solution: `r = ${s.load}(80/64 − 1).`,
          }}
        />
      )}
      <Notes>
        <p>
          The wire is uniform and the primary circuit defines an unloaded
          gradient. A 10 kΩ detector includes the small loading effect away from
          balance; the detector current is positive from the test cell toward
          the wire. Away from null the detector slightly loads the wire; the
          displayed wire drop is the open-detector comparison potential. At
          exact null, loading vanishes and ε = kl holds. Opening the primary
          switch leaves the secondary test-cell branch connected, so the test
          cell can still drive a detector current. The cell load is applied
          across its terminals, not inserted into the primary wire.
          Internal-resistance measurements require one cell, one known load and
          unchanged primary gradient. Changing primary or cell parameters clears
          incompatible comparison readings.
        </p>
      </Notes>
    </>
  );
}
