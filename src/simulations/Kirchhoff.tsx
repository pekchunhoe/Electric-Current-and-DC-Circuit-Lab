import { meshes } from "../physics/engine";
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
import { Cell, Resistor, Stage, Wire } from "../components/Circuit";
export default function Kirchhoff({ mode, resetKey }: SimProps) {
  const { s, set, reset } = useLab("kirchhoff", {
    e1: 12,
    e2: 6,
    r1: 4,
    r2: 6,
    rs: 2,
    structure: "two",
    loop: "left",
    clockwise: true,
    assume1: true,
    assume2: true,
    reveal: false,
    equation: "",
    checked: false,
    coefficient1: "",
    coefficient2: "",
    sourceTerm: "",
    loopChecked: false,
  });
  const two = meshes(s.e1, s.e2, s.r1, s.r2, s.rs);
  const singleI = s.e1 / (s.r1 + s.rs);
  const m =
    s.structure === "single"
      ? {
          ...two,
          i1: singleI,
          i2: 0,
          is: singleI,
          kcl: 0,
          kvl1: 0,
          kvl2: 0,
          sourcePower: s.e1 * singleI,
          dissipated: singleI ** 2 * (s.r1 + s.rs),
        }
      : two;
  const sign = s.clockwise ? 1 : -1;
  const correctEquation =
    s.equation.replace(/\s/g, "").toLowerCase() === "i1=i2+is";
  const left = s.structure === "single" || s.loop === "left";
  const expected = [
    sign *
      (s.structure === "single" ? s.r1 + s.rs : left ? s.r1 + s.rs : -s.rs) *
      (s.assume1 ? 1 : -1),
    sign *
      (s.structure === "single" ? 0 : left ? -s.rs : s.r2 + s.rs) *
      (s.assume2 ? 1 : -1),
    sign * (left ? s.e1 : s.e2),
  ];
  const loopCorrect = [s.coefficient1, s.coefficient2, s.sourceTerm].every(
    (v, j) =>
      v.trim() !== "" &&
      Number.isFinite(+v) &&
      Math.abs(+v - expected[j]) < 1e-8,
  );
  return (
    <>
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          s.structure === "junction" ? (
            <Stage label="Current conservation at a junction. I1 enters; I2 and Is are signed outgoing currents.">
              <Wire d="M80 180H300" flow={m.i1} />
              <Wire d="M300 180L500 80" flow={m.i2} />
              <Wire d="M300 180L500 280" flow={m.is} />
              <circle cx="300" cy="180" r="9" className="node" />
              <text x="160" y="155">
                I₁ = {fmt(m.i1)} A →
              </text>
              <text x="380" y="100">
                I₂ = {fmt(m.i2)} A
              </text>
              <text x="380" y="290">
                Iₛ = {fmt(m.is)} A
              </text>
              <text x="300" y="335" textAnchor="middle" className="value-label">
                Signed currents: I₁ = I₂ + Iₛ
              </text>
            </Stage>
          ) : (
            <Stage
              label={`${s.structure === "single" ? "One" : "Two"} closed loops. Left mesh current clockwise, right mesh current clockwise; shared current downward.`}
            >
              <Wire
                d={
                  s.structure === "single"
                    ? "M100 134V70H300V280H100V226"
                    : "M100 134V70H500V280H100V226M500 134V70M500 226V280M300 70V280"
                }
                flow={s.structure === "single" ? singleI : 0}
              />
              {(["left", "right"] as const)
                .slice(0, s.structure === "single" ? 1 : 2)
                .map((loop) => (
                  <path
                    key={loop}
                    d={
                      loop === "left"
                        ? "M125 90H278V258H125Z"
                        : "M322 90H475V258H322Z"
                    }
                    className={`loop-highlight svg-button ${s.loop === loop ? "active-loop" : ""}`}
                    role="button"
                    aria-label={`Analyse ${loop} loop`}
                    tabIndex={0}
                    onClick={() => set("loop", loop)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        set("loop", loop);
                      }
                    }}
                  />
                ))}
              <Cell x={100} y={180} emf={s.e1} label="ε₁" />
              <Resistor x={205} y={70} r={s.r1} label="R₁" />
              <Resistor x={300} y={180} r={s.rs} label="Rₛ" vertical />
              {s.structure === "two" && (
                <>
                  <Resistor x={410} y={70} r={s.r2} label="R₂" />
                  <Cell x={500} y={180} emf={s.e2} label="ε₂" reverse />
                  <Wire d="M370 120H450" flow={m.i2} />
                  <text x="400" y="143" textAnchor="middle">
                    I₂ {fmt(m.i2)} A
                  </text>
                </>
              )}
              <Wire
                d="M145 115H240"
                flow={s.structure === "single" ? singleI : m.i1}
              />
              <text x="185" y="143" textAnchor="middle">
                I₁ {fmt(s.structure === "single" ? singleI : m.i1)} A
              </text>
              <text x="290" y="323" textAnchor="middle" className="tiny-label">
                {s.structure === "single"
                  ? "ONE LOOP"
                  : `SHARED CURRENT Iₛ = I₁ − I₂ = ${fmt(m.is)} A ↓`}
              </text>
              <circle cx="300" cy="70" r="4" className="node" />
              <circle cx="300" cy="280" r="4" className="node" />
              <text x="300" y="32" textAnchor="middle" className="tiny-label">
                {s.clockwise ? "CLOCKWISE" : "ANTICLOCKWISE"} TRAVERSAL
              </text>
            </Stage>
          )
        }
        meters={
          <Meters>
            <Meter
              label="Assumed I₁ solution"
              value={
                (s.structure === "single" ? singleI : m.i1) *
                (s.assume1 ? 1 : -1)
              }
              unit="A"
              accent
            />
            <Meter
              label="Assumed I₂ solution"
              value={s.structure === "single" ? 0 : m.i2 * (s.assume2 ? 1 : -1)}
              unit="A"
            />
            <Meter
              label="Shared downward current"
              value={s.structure === "single" ? singleI : m.is}
              unit="A"
            />
          </Meters>
        }
        controls={
          <>
            <Select
              label="Circuit structure"
              value={s.structure}
              options={[
                ["junction", "One junction · current rule"],
                ["single", "One closed loop · voltage rule"],
                ["two", "Two loops · shared resistor"],
              ]}
              onChange={(v) => set("structure", v)}
            />
            <Range
              label="Source ε₁"
              value={s.e1}
              min={-18}
              max={18}
              step={1}
              unit="V"
              onChange={(v) => set("e1", v)}
            />
            {s.structure !== "single" && (
              <Range
                label="Source ε₂ (signed)"
                value={s.e2}
                min={-18}
                max={18}
                step={1}
                unit="V"
                onChange={(v) => set("e2", v)}
              />
            )}
            <Range
              label="Resistance R₁"
              value={s.r1}
              min={1}
              max={20}
              unit="Ω"
              onChange={(v) => set("r1", v)}
            />
            {s.structure !== "single" && (
              <Range
                label="Resistance R₂"
                value={s.r2}
                min={1}
                max={20}
                unit="Ω"
                onChange={(v) => set("r2", v)}
              />
            )}
            <Range
              label="Shared resistance Rₛ"
              value={s.rs}
              min={1}
              max={20}
              unit="Ω"
              onChange={(v) => set("rs", v)}
            />
            {s.structure === "two" && (
              <Select
                label="Loop to analyse"
                value={s.loop}
                options={[
                  ["left", "Left loop"],
                  ["right", "Right loop"],
                ]}
                onChange={(v) => set("loop", v)}
              />
            )}
            <Toggle checked={s.clockwise} onChange={(v) => set("clockwise", v)}>
              Clockwise traversal
            </Toggle>
            <Toggle checked={s.assume1} onChange={(v) => set("assume1", v)}>
              Assume I₁ clockwise
            </Toggle>
            {s.structure !== "single" && (
              <Toggle checked={s.assume2} onChange={(v) => set("assume2", v)}>
                Assume I₂ clockwise
              </Toggle>
            )}
            <button onClick={() => set("reveal", !s.reveal)}>
              {s.reveal ? "Hide" : "Reveal"} simultaneous solution
            </button>
          </>
        }
        equation={
          <>
            {s.structure === "single" ? (
              <Equation tex="\varepsilon_1-I(R_1+R_s)=0">
                {sign * s.e1} − ({sign} × I × {s.r1 + s.rs}) = 0; I ={" "}
                {fmt(singleI)} A.
              </Equation>
            ) : (
              <>
                <Equation tex="(R_1+R_s)I_1-R_sI_2=\varepsilon_1">
                  {(s.r1 + s.rs) * (s.assume1 ? 1 : -1)}I₁ −{" "}
                  {s.rs * (s.assume2 ? 1 : -1)}I₂ = {s.e1}
                </Equation>
                <Equation tex="-R_sI_1+(R_2+R_s)I_2=\varepsilon_2">
                  −{s.rs * (s.assume1 ? 1 : -1)}I₁ +{" "}
                  {(s.r2 + s.rs) * (s.assume2 ? 1 : -1)}I₂ = {s.e2}
                </Equation>
              </>
            )}
          </>
        }
      />
      <Panel label="Conservation workbench">
        <div className="conservation">
          <div>
            <h4>Junction A · top of shared branch</h4>
            <p>Use signed currents: I₁ enters; I₂ and Iₛ leave.</p>
            <label className="answer-label">
              Construct the junction equation (use i1, i2, is)
              <input
                value={s.equation}
                onChange={(e) => {
                  set("equation", e.target.value);
                  set("checked", false);
                }}
                placeholder="e.g. i1 = ..."
              />
            </label>
            <button onClick={() => set("checked", true)}>Check equation</button>
            {s.checked && (
              <p role="status" className="feedback">
                {correctEquation
                  ? "Correct: signed charge is conserved."
                  : "Use i1 = i2 + is. A negative outgoing value means actual inflow."}
              </p>
            )}
            <p>KCL residual: {fmt(m.kcl)} A</p>
          </div>
          <div>
            <h4>
              {s.loop === "left" ? "Left" : "Right"} loop ·{" "}
              {s.clockwise ? "clockwise" : "anticlockwise"}
            </h4>
            <p>
              {s.loop === "left"
                ? `Source rise ${fmt(sign * s.e1)} V; R₁ term ${fmt(-sign * m.i1 * s.r1)} V; shared resistor term ${fmt(-sign * m.is * s.rs)} V.`
                : `Source rise ${fmt(sign * s.e2)} V; R₂ term ${fmt(-sign * m.i2 * s.r2)} V; shared resistor term ${fmt(sign * m.is * s.rs)} V.`}
            </p>
            <p>
              KVL residual: {fmt(sign * (s.loop === "left" ? m.kvl1 : m.kvl2))}{" "}
              V
            </p>
            <p>
              Construct this loop equation as aI₁ + bI₂ = c using your assumed
              directions and selected traversal.
            </p>
            <div className="coefficient-inputs">
              {(["coefficient1", "coefficient2", "sourceTerm"] as const).map(
                (key, j) => (
                  <label key={key}>
                    {["a (Ω)", "b (Ω)", "c (V)"][j]}
                    <input
                      aria-label={
                        [
                          "Loop I₁ coefficient",
                          "Loop I₂ coefficient",
                          "Loop source term",
                        ][j]
                      }
                      type="number"
                      step="any"
                      value={s[key]}
                      onChange={(e) => {
                        set(key, e.target.value);
                        set("loopChecked", false);
                      }}
                    />
                  </label>
                ),
              )}
            </div>
            <button onClick={() => set("loopChecked", true)}>
              Check loop equation
            </button>
            {s.loopChecked && (
              <p className="feedback" role="status">
                {loopCorrect
                  ? "Correct. This equation conserves energy around the selected loop."
                  : `Check traversal and current assumptions. The coefficients are a = ${expected[0]} Ω, b = ${expected[1]} Ω, c = ${expected[2]} V.`}
              </p>
            )}
            <p>
              Source power {fmt(m.sourcePower)} W = dissipation{" "}
              {fmt(m.dissipated)} W.
            </p>
            <p className="muted">
              The equations use your assumed current directions. Actual flow
              arrows use the solved signs. Reversing traversal multiplies every
              voltage term by −1.
            </p>
          </div>
        </div>
        {s.reveal && (
          <div className="solution">
            <p>
              1. Write KCL at the shared junction: Iₛ = I₁ − I₂ in the clockwise
              reference.
            </p>
            <p>
              2. Write the two loop equations shown above. A resistor is a
              voltage drop when traversed with its current.
            </p>
            <p>
              3. Determinant D = (R₁ + Rₛ)(R₂ + Rₛ) − Rₛ² ={" "}
              {(s.r1 + s.rs) * (s.r2 + s.rs) - s.rs * s.rs} Ω².
            </p>
            <p>
              4. I₁ = [ε₁(R₂ + Rₛ) + Rₛε₂]/D = {fmt(m.i1)} A. I₂ = [ε₂(R₁ + Rₛ)
              + Rₛε₁]/D = {fmt(m.i2)} A in the clockwise reference.
            </p>
            <p>
              5. Shared current = {fmt(m.is)} A downward. A negative answer
              means the actual direction opposes the assumption.
            </p>
          </div>
        )}
      </Panel>
      {mode === "Experiment" && (
        <Activity
          aim="Apply Kirchhoff’s Rules to at most two loops."
          steps={[
            "Start with the junction and single-loop structures. Identify entering currents and voltage rises/drops.",
            "Select two loops. Choose assumed mesh directions, then write both simultaneous equations.",
            "Reverse the second source or an assumed current. Predict which signed currents become negative.",
            "Select each loop, reverse traversal and verify that its algebraic voltage sum remains zero.",
          ]}
        />
      )}{" "}
      {mode === "Challenge" && (
        <Challenge
          id="kirchhoff"
          spec={{
            question: `For the displayed two-loop model, find shared-branch current, positive downward (clockwise reference I₁ − I₂). ε₁=${s.e1} V, ε₂=${s.e2} V, R₁=${s.r1} Ω, R₂=${s.r2} Ω, Rₛ=${s.rs} Ω.`,
            answer: two.is,
            unit: "A",
            hints: [
              "Use the two clockwise mesh equations.",
              "Solve for both mesh currents before finding the shared current.",
              "The shared current is I₁ − I₂, not their sum.",
            ],
            solution: `Clockwise reference: I₁ = ${fmt(m.i1)} A, I₂ = ${fmt(m.i2)} A; Iₛ = I₁ − I₂.`,
          }}
        />
      )}
      <Notes>
        <p>
          Charge conservation gives the junction rule; energy conservation gives
          the loop rule. Currents are signed relative to an assumption, not
          absolute magnitudes. Negative source settings reverse emf polarity. In
          the two-loop reference, ε₁ is a rise upward on the left; ε₂ is a rise
          downward on the right. The interface enforces positive resistors; the
          solver rejects singular, disconnected or inconsistent ideal
          constraints instead of inventing currents.
        </p>
      </Notes>
    </>
  );
}
