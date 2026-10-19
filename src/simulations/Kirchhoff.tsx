import {
  branchCircuit,
  branchEquations,
  branchReferences,
  checkJunctionEquation,
  currentDirection,
  equivalentRows,
  junctionCurrents,
  type ReferenceSigns,
} from "../physics/kirchhoff";
import { useLab } from "../hooks/useLab";
import {
  Activity,
  Challenge,
  Equation,
  Lab,
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
  CircuitView,
  CurrentCards,
  JunctionView,
  actualDirection,
  currentNames,
  currentText,
  referenceDirection,
} from "./KirchhoffVisuals";

function equationText(row: number[], tex = false) {
  const symbols = tex ? ["I_1", "I_2", "I_3"] : currentNames;
  const terms = row.slice(0, 3).flatMap((coefficient, j) => {
    if (!coefficient) return [];
    return [
      {
        negative: coefficient < 0,
        text: `${Math.abs(coefficient) === 1 ? "" : fmt(Math.abs(coefficient), 6)}${symbols[j]}`,
      },
    ];
  });
  const equation = `${terms.map((term, j) => `${j ? (term.negative ? " − " : " + ") : term.negative ? "−" : ""}${term.text}`).join("") || "0"} = ${fmt(row[3], 6)}`;
  return tex ? equation.replace(/−/g, "-") : equation;
}
function substitution(row: number[], currents: number[]) {
  return `${row
    .slice(0, 3)
    .flatMap((c, j) =>
      c
        ? [
            `${c > 0 ? "+" : "−"} ${Math.abs(c) === 1 ? "" : `${fmt(Math.abs(c))} × `}(${currentText(currents[j])})`,
          ]
        : [],
    )
    .join(" ")
    .replace(/^\+ /, "")} ≈ ${fmt(row[3], 6)}`;
}
function residual(row: number[], currents: number[]) {
  return row.slice(0, 3).reduce((sum, c, j) => sum + c * currents[j], -row[3]);
}
function voltageTerm(value: number) {
  return `${currentText(value)} V (${currentDirection(value) === "zero" ? "no change" : value > 0 ? "rise" : "drop"})`;
}

export default function Kirchhoff({ mode, resetKey }: SimProps) {
  const { s, set, setState, reset } = useLab("kirchhoff", {
    e1: 18,
    e2: -18,
    r1: 4,
    r2: 6,
    rs: 5,
    structure: "two",
    loop: "left",
    clockwise: true,
    assume1: true,
    assume2: true,
    assume3: true,
    actual: true,
    speed: 1,
    junction: "upper",
    equation: "",
    checked: false,
    kclReveal: false,
    kclHints: 0,
    coefficient1: "",
    coefficient2: "",
    coefficient3: "",
    sourceTerm: "",
    loopChecked: false,
    loopReveal: false,
    loopHints: 0,
    unknown: "2",
    prediction: "",
    predictionChecked: false,
    predictionReveal: false,
    predictionHints: 0,
  });
  function update<K extends keyof typeof s>(key: K, value: (typeof s)[K]) {
    setState((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "structure" && value === "single" ? { loop: "left" } : {}),
      ...(key === "actual" || key === "speed"
        ? {}
        : {
            checked: false,
            loopChecked: false,
            kclReveal: false,
            loopReveal: false,
            kclHints: 0,
            loopHints: 0,
            prediction: "",
            predictionChecked: false,
            predictionReveal: false,
            predictionHints: 0,
          }),
    }));
  }
  const single = s.structure === "single";
  const model = branchCircuit(s);
  const signs: ReferenceSigns = [
    s.assume1 ? 1 : -1,
    s.assume2 ? 1 : -1,
    s.assume3 ? 1 : -1,
  ];
  const currents = branchReferences(model.canonical, signs);
  const lower = s.junction === "lower";
  const rows = branchEquations(s, signs, s.clockwise, lower);
  const left = single || s.loop === "left";
  const selectedRow = left ? rows.left : rows.right;
  const junction = junctionCurrents(model.canonical, lower);
  const t = s.clockwise ? 1 : -1;
  const unknown = Number(s.unknown);
  const correctEquation = checkJunctionEquation(s.equation, rows.kcl);
  const coefficients = [
    s.coefficient1,
    s.coefficient2,
    s.coefficient3,
    s.sourceTerm,
  ];
  const loopCorrect =
    coefficients.every((v) => v.trim() !== "") &&
    equivalentRows(coefficients.map(Number), selectedRow);
  const predictionCorrect =
    s.prediction.trim() !== "" &&
    Number.isFinite(Number(s.prediction)) &&
    Math.abs(Number(s.prediction) - currents[unknown]) <=
      Math.max(0.0005, Math.abs(currents[unknown]) * 0.001);
  const visuals = {
    canonical: model.canonical,
    currents,
    signs,
    actual: s.actual,
    speed: s.speed,
  };
  const flowGroup = (magnitudes: number[]) =>
    magnitudes
      .flatMap((magnitude, j) =>
        currentDirection(magnitude) !== "zero"
          ? [`${currentNames[j]}: ${currentText(magnitude, false)} A`]
          : [],
      )
      .join(" + ") || "None (0.000 A)";
  const flowSum = (magnitudes: number[]) =>
    magnitudes
      .filter((value) => currentDirection(value) !== "zero")
      .map((value) => currentText(value, false))
      .join(" + ") || "0.000";
  const kclHints = [
    "First distinguish actual-flow arrows from assumed reference arrows. A negative reference value reverses physical flow.",
    `At the ${s.junction} junction, use the selected reference directions to assign a sign to each of I₁, I₂ and I₃.`,
    "Collect all entering terms on one side and all leaving terms on the other. Rearrangements and nonzero multiples are accepted.",
  ];
  const loopHints = [
    "Follow the selected loop in the selected traversal direction, starting at its source.",
    "Moving with conventional current through a resistor is a voltage drop; moving against it is a rise. Include I₃ through Rₛ.",
    "Use zero for the outer branch outside this loop. Reversing traversal changes every coefficient and the source term together.",
  ];
  return (
    <div className="kirchhoff-lab">
      <ResetEffect resetKey={resetKey} reset={reset} />
      <Lab
        visual={
          <>
            {s.structure === "junction" ? (
              <JunctionView {...visuals} lower={lower} />
            ) : (
              <CircuitView
                {...visuals}
                parameters={s}
                loop={left ? "left" : "right"}
                clockwise={s.clockwise}
                onLoop={(value) => update("loop", value)}
              />
            )}
            <p className="visual-caption">
              {s.actual
                ? "Arrows and moving dots show actual conventional current. Electrons in metal drift in the opposite direction. Labels are signed reference currents."
                : "Dashed arrows show assumed reference directions, not actual flow. Animation is paused; signed values still describe the same physical circuit."}
              {single && " The right branch is disconnected: I₂ = 0 A."}
            </p>
          </>
        }
        meters={<CurrentCards {...visuals} />}
        controls={
          <>
            <Select
              label="Circuit structure"
              value={s.structure}
              options={[
                ["junction", "Junction view · two-loop circuit"],
                ["single", "One closed loop · voltage rule"],
                ["two", "Two loops · shared resistor"],
              ]}
              onChange={(value) => update("structure", value)}
            />
            <Range
              label="Source ε₁"
              value={s.e1}
              min={-18}
              max={18}
              step={1}
              unit="V"
              onChange={(value) => update("e1", value)}
            />
            {!single && (
              <Range
                label="Source ε₂ (signed)"
                value={s.e2}
                min={-18}
                max={18}
                step={1}
                unit="V"
                onChange={(value) => update("e2", value)}
              />
            )}
            <p className="muted">
              Source settings are signed clockwise-loop emf contributions: ε₁ is
              a rise upward on the left, ε₂ a rise downward on the right. A
              negative setting reverses cell polarity. The diagram shows each
              cell’s positive voltage magnitude and its polarity.
            </p>
            <Range
              label="Resistance R₁"
              value={s.r1}
              min={1}
              max={20}
              unit="Ω"
              onChange={(value) => update("r1", value)}
            />
            {!single && (
              <Range
                label="Resistance R₂"
                value={s.r2}
                min={1}
                max={20}
                unit="Ω"
                onChange={(value) => update("r2", value)}
              />
            )}
            <Range
              label="Shared resistance Rₛ"
              value={s.rs}
              min={1}
              max={20}
              unit="Ω"
              onChange={(value) => update("rs", value)}
            />
            <fieldset className="branch-references">
              <legend>Branch current reference directions</legend>
              {(["assume1", "assume2", "assume3"] as const).map((key, j) => (
                <Select
                  key={key}
                  label={`${currentNames[j]} reference direction`}
                  value={s[key] ? "forward" : "reverse"}
                  options={[
                    ["forward", referenceDirection(j, 1)],
                    ["reverse", referenceDirection(j, -1)],
                  ]}
                  onChange={(value) => update(key, value === "forward")}
                />
              ))}
              <p className="muted">
                Changing a reference reverses its signed reading and equation
                coefficients. Physical current and power stay the same. I₃ is
                calculated by conservation, never independently adjusted.
              </p>
            </fieldset>
            {!single && (
              <Select
                label="Loop to analyse"
                value={s.loop}
                options={[
                  ["left", "Left loop"],
                  ["right", "Right loop"],
                ]}
                onChange={(value) => update("loop", value)}
              />
            )}
            <Toggle
              checked={s.clockwise}
              onChange={(value) => update("clockwise", value)}
            >
              Clockwise traversal
            </Toggle>
            <Range
              label="Animation speed"
              value={s.speed}
              min={0.25}
              max={3}
              step={0.25}
              unit="×"
              onChange={(value) => update("speed", value)}
            />
            <p className="muted">Animation speed changes playback only.</p>
          </>
        }
        equation={
          <>
            <h4>First Law · signed currents</h4>
            <Equation tex={equationText(rows.kcl, true)}>
              {substitution(rows.kcl, currents)} A.
            </Equation>
            <h4>Second Law · {s.clockwise ? "clockwise" : "anticlockwise"}</h4>
            <p className="muted">Left loop</p>
            <Equation tex={equationText(rows.left, true)}>
              {substitution(rows.left, currents)} V.
            </Equation>
            {!single && (
              <>
                <p className="muted">Right loop</p>
                <Equation tex={equationText(rows.right, true)}>
                  {substitution(rows.right, currents)} V.
                </Equation>
              </>
            )}
            {single && (
              <p className="muted">
                Right branch disconnected: I₂ = 0. The junction law gives the
                relationship between I₁ and I₃ in your selected references.
              </p>
            )}
          </>
        }
      />
      <Panel label="Conservation workbench">
        <div className="conservation kirchhoff-workbench">
          <section aria-label="Kirchhoff's First Law">
            <h4>Kirchhoff’s First Law — Junction Analysis</h4>
            <Select
              label="Selected junction"
              value={s.junction}
              options={[
                ["upper", "A · Upper junction"],
                ["lower", "B · Lower junction"],
              ]}
              onChange={(value) => update("junction", value)}
            />
            <div
              className="button-row direction-views"
              role="group"
              aria-label="Current direction view"
            >
              <button
                aria-pressed={s.actual}
                onClick={() => update("actual", true)}
              >
                Show actual current direction
              </button>
              <button
                aria-pressed={!s.actual}
                onClick={() => update("actual", false)}
              >
                Show assumed reference direction
              </button>
            </div>
            <JunctionView {...visuals} lower={lower} />
            <div
              className="junction-totals"
              aria-label="Actual junction currents"
              data-incoming={junction.totalIn}
              data-outgoing={junction.totalOut}
            >
              <p>
                <b>Incoming:</b> {flowGroup(junction.incoming)}
              </p>
              <p>
                <b>Outgoing:</b> {flowGroup(junction.outgoing)}
              </p>
              <p className="conservation-balance">ΣI_in = ΣI_out</p>
              <p>
                {flowSum(junction.incoming)} ≈ {flowSum(junction.outgoing)} A
              </p>
              <p>
                Totals: {currentText(junction.totalIn, false)} A in ≈{" "}
                {currentText(junction.totalOut, false)} A out.
              </p>
            </div>
            <p>
              These are actual incoming/outgoing <b>magnitudes</b>. The signed
              equation below uses your chosen references.
            </p>
            <p className="signed-kcl">{equationText(rows.kcl)}</p>
            <p className="kcl-substitution">
              {substitution(rows.kcl, currents)} A.
            </p>
            <p
              className="conservation-residual"
              data-testid="kcl-residual"
              data-value={residual(rows.kcl, currents)}
            >
              KCL residual: {currentText(residual(rows.kcl, currents), false)} A
              · conserved
            </p>
            <details className="notes sign-example">
              <summary>
                Guided example: what does a negative current mean?
              </summary>
              <div>
                <p>
                  With the canonical right-branch reference pointing away from
                  A, a negative I₂ means actual flow from the right into A. The
                  algebraic law is I₁ − I₂ − I₃ = 0; subtracting a negative I₂
                  adds its incoming magnitude. For example, −1 A against a
                  rightward reference means 1 A flowing leftward.
                </p>
                <p>
                  In your current settings: I₂ = {currentText(currents[1])} A,
                  reference {referenceDirection(1, signs[1])}; actual flow:{" "}
                  {actualDirection(1, model.canonical[1])}.
                </p>
              </div>
            </details>
            <details className="notes conservation-exercise">
              <summary>Build a junction equation</summary>
              <div>
                <label className="answer-label">
                  Construct the junction equation (use i1, i2, i3)
                  <input
                    value={s.equation}
                    maxLength={256}
                    onChange={(event) => {
                      set("equation", event.target.value);
                      set("checked", false);
                      set("kclReveal", false);
                    }}
                    placeholder="e.g. i1 = ..."
                  />
                </label>
                <p className="muted">
                  Use +, −, parentheses, numeric coefficients, × as * and
                  division by a constant. Equivalent linear equations are
                  accepted.
                </p>
                <div className="button-row">
                  <button onClick={() => set("checked", true)}>
                    Check equation
                  </button>
                  <button
                    onClick={() => set("kclHints", Math.min(3, s.kclHints + 1))}
                  >
                    Junction hint {s.kclHints || ""}
                  </button>
                  <button onClick={() => set("kclReveal", !s.kclReveal)}>
                    {s.kclReveal ? "Hide" : "Reveal"} junction solution
                  </button>
                </div>
                {s.checked && (
                  <p
                    role="status"
                    className={`feedback junction-equation-feedback ${correctEquation ? "correct" : "incorrect"}`}
                  >
                    {correctEquation
                      ? "Correct: signed charge is conserved."
                      : "Check each reference direction and collect all three currents. The equation must conserve charge for any valid branch currents."}
                  </p>
                )}
                {s.kclHints > 0 && (
                  <div className="hint">
                    {kclHints.slice(0, s.kclHints).map((hint) => (
                      <p key={hint}>{hint}</p>
                    ))}
                  </div>
                )}
                {s.kclReveal && (
                  <div className="solution">
                    <ol>
                      <li>
                        Choose junction {lower ? "B" : "A"} and distinguish
                        reference signs from actual flow.
                      </li>
                      <li>With your references, {equationText(rows.kcl)}.</li>
                      <li>
                        Substitute signed readings:{" "}
                        {substitution(rows.kcl, currents)} A.
                      </li>
                      <li>
                        Check actual magnitudes separately:{" "}
                        {currentText(junction.totalIn, false)} A in ={" "}
                        {currentText(junction.totalOut, false)} A out.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </details>
            <details className="notes conservation-exercise">
              <summary>Predict an unknown branch current</summary>
              <div>
                <Select
                  label="Unknown branch current"
                  value={s.unknown}
                  options={currentNames.map((name, j) => [String(j), name])}
                  onChange={(value) => update("unknown", value)}
                />
                <p>
                  At junction {lower ? "B" : "A"},{" "}
                  {currents
                    .flatMap((value, j) =>
                      j !== unknown
                        ? [`${currentNames[j]} = ${currentText(value)} A`]
                        : [],
                    )
                    .join(" and ")}
                  . Predict signed {currentNames[unknown]} using your selected
                  references.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    set("predictionChecked", true);
                  }}
                >
                  <label className="answer-label">
                    Unknown current prediction (A)
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Signed current in A"
                      value={s.prediction}
                      onChange={(event) => {
                        set("prediction", event.target.value);
                        set("predictionChecked", false);
                        set("predictionReveal", false);
                      }}
                    />
                  </label>
                  <div className="button-row">
                    <button type="submit">Check current prediction</button>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "predictionHints",
                          Math.min(3, s.predictionHints + 1),
                        )
                      }
                    >
                      Current hint {s.predictionHints || ""}
                    </button>
                    {s.predictionChecked && (
                      <button
                        type="button"
                        onClick={() =>
                          set("predictionReveal", !s.predictionReveal)
                        }
                      >
                        Reveal current solution
                      </button>
                    )}
                  </div>
                </form>
                {s.predictionChecked && (
                  <p
                    role="status"
                    className={`feedback current-prediction-feedback ${predictionCorrect ? "correct" : "incorrect"}`}
                  >
                    {predictionCorrect
                      ? "Correct. Your signed prediction conserves current."
                      : "Try again. Keep signed values when rearranging KCL; do not replace them with magnitudes. Display rounding or a 0.1% tolerance is allowed."}
                  </p>
                )}
                {s.predictionHints > 0 && (
                  <div className="hint">
                    {kclHints.slice(0, s.predictionHints).map((hint) => (
                      <p key={hint}>{hint}</p>
                    ))}
                  </div>
                )}
                {s.predictionReveal && (
                  <div className="solution">
                    <ol>
                      <li>Write {equationText(rows.kcl)}.</li>
                      <li>
                        Move the two known current terms to the other side;
                        divide by the coefficient of {currentNames[unknown]} (
                        {rows.kcl[unknown]}).
                      </li>
                      <li>
                        {currentNames[unknown]} ={" "}
                        {currentText(currents[unknown])} A. Actual flow:{" "}
                        {actualDirection(unknown, model.canonical[unknown])}.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </details>
          </section>
          <section aria-label="Kirchhoff's Second Law">
            <h4>Kirchhoff’s Second Law — Loop Analysis</h4>
            <p>
              <b>Selected closed loop:</b> {left ? "Left" : "Right"} ·{" "}
              {s.clockwise ? "clockwise" : "anticlockwise"} traversal.
            </p>
            <p>
              Branch current references and loop traversal are independent.
              Reversing traversal reverses every voltage term.
            </p>
            <ul className="voltage-terms">
              <li>
                Source {left ? "ε₁" : "ε₂"}:{" "}
                {voltageTerm(t * (left ? s.e1 : s.e2))}
              </li>
              <li>
                Resistor {left ? "R₁" : "R₂"}:{" "}
                {voltageTerm(
                  -t *
                    (left
                      ? s.r1 * model.canonical[0]
                      : s.r2 * model.canonical[1]),
                )}
              </li>
              <li>
                Shared resistor Rₛ (I₃):{" "}
                {voltageTerm((left ? -1 : 1) * t * s.rs * model.canonical[2])}
              </li>
            </ul>
            <p className="signed-kvl">{equationText(selectedRow)}</p>
            <p className="kvl-substitution">
              {substitution(selectedRow, currents)} V.
            </p>
            <p
              className="conservation-residual"
              data-testid="kvl-residual"
              data-value={-residual(selectedRow, currents)}
            >
              KVL residual:{" "}
              {currentText(-residual(selectedRow, currents), false)} V ·
              conserved
            </p>
            <div
              className="power-balance"
              data-source-power={model.sourcePower}
              data-dissipated={model.dissipated}
            >
              <p>
                Net source power {fmt(model.sourcePower, 5)} W = resistive
                dissipation {fmt(model.dissipated, 5)} W.
              </p>
              <p>
                Power residual:{" "}
                {currentText(model.sourcePower - model.dissipated, false)} W.
              </p>
            </div>
            <details className="notes conservation-exercise">
              <summary>Build a loop equation</summary>
              <div>
                <p>
                  Construct aI₁ + bI₂ + cI₃ = d for this loop and traversal,
                  using your selected branch references. Include a zero
                  coefficient for the outer branch outside this loop.
                </p>
                <div className="coefficient-inputs">
                  {(
                    [
                      "coefficient1",
                      "coefficient2",
                      "coefficient3",
                      "sourceTerm",
                    ] as const
                  ).map((key, j) => (
                    <label key={key}>
                      {["a (Ω)", "b (Ω)", "c (Ω)", "d (V)"][j]}
                      <input
                        aria-label={
                          [
                            "Loop I₁ coefficient",
                            "Loop I₂ coefficient",
                            "Loop I₃ coefficient",
                            "Loop source term",
                          ][j]
                        }
                        type="number"
                        step="any"
                        value={s[key]}
                        onChange={(event) => {
                          set(key, event.target.value);
                          set("loopChecked", false);
                          set("loopReveal", false);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div className="button-row">
                  <button onClick={() => set("loopChecked", true)}>
                    Check loop equation
                  </button>
                  <button
                    onClick={() =>
                      set("loopHints", Math.min(3, s.loopHints + 1))
                    }
                  >
                    Loop hint {s.loopHints || ""}
                  </button>
                  <button onClick={() => set("loopReveal", !s.loopReveal)}>
                    {s.loopReveal ? "Hide" : "Reveal"} loop solution
                  </button>
                </div>
                {s.loopChecked && (
                  <p
                    role="status"
                    className={`feedback loop-equation-feedback ${loopCorrect ? "correct" : "incorrect"}`}
                  >
                    {loopCorrect
                      ? "Correct. This equation conserves energy around the selected loop."
                      : "Check the loop’s resistor terms, the I₃ reference and the source polarity. Use a hint or request the solution to see the coefficients."}
                  </p>
                )}
                {s.loopHints > 0 && (
                  <div className="hint">
                    {loopHints.slice(0, s.loopHints).map((hint) => (
                      <p key={hint}>{hint}</p>
                    ))}
                  </div>
                )}
                {s.loopReveal && (
                  <div className="solution">
                    <ol>
                      <li>
                        Traverse the {left ? "left" : "right"} loop{" "}
                        {s.clockwise ? "clockwise" : "anticlockwise"}.
                      </li>
                      <li>
                        Sum the source rise/drop and the two resistor terms
                        listed above.
                      </li>
                      <li>Rearrange: {equationText(selectedRow)}.</li>
                      <li>
                        Substitute: {substitution(selectedRow, currents)} V;
                        residual ≈ 0 V.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </details>
          </section>
        </div>
      </Panel>
      <details className="notes kirchhoff-calculation">
        <summary>How I₁, I₂ and I₃ Are Calculated</summary>
        <div className="solution calculation-steps">
          <ol>
            <li>
              <b>Define the three current directions.</b>{" "}
              {currentNames
                .map((name, j) => `${name}: ${referenceDirection(j, signs[j])}`)
                .join("; ")}
              . Values are signed against these references.
            </li>
            <li>
              <b>Apply the First Law at junction {lower ? "B" : "A"}.</b>{" "}
              {equationText(rows.kcl)}. Only two branch currents are
              independent.
            </li>
            <li>
              <b>Apply the Second Law to the left loop.</b> For{" "}
              {s.clockwise ? "clockwise" : "anticlockwise"} traversal:{" "}
              {equationText(rows.left)}.
            </li>
            <li>
              <b>
                {single
                  ? "Account for the disconnected right branch."
                  : "Apply the Second Law to the right loop."}
              </b>{" "}
              {single
                ? "I₂ = 0 A; there is no second closed loop."
                : equationText(rows.right)}
              .
            </li>
            <li>
              <b>Solve the three simultaneous relationships.</b> Eliminate I₃
              with KCL, solve the two remaining independent relationships, then
              recover I₃.{" "}
              {currentNames
                .map((name, j) => `${name} = ${currentText(currents[j])} A`)
                .join("; ")}
              .
              {single
                ? ` The active series resistance is ${fmt(s.r1 + s.rs)} Ω.`
                : ` Determinant D = (R₁ + Rₛ)(R₂ + Rₛ) − Rₛ² = ${fmt(s.r1 * s.r2 + s.rs * (s.r1 + s.r2))} Ω².`}
            </li>
            <li>
              <b>Interpret negative current values.</b>{" "}
              {currentNames
                .map(
                  (name, j) =>
                    `${name}: ${actualDirection(j, model.canonical[j])}${currents[j] < -1e-9 ? " (opposite to its selected reference)" : ""}`,
                )
                .join("; ")}
              .
            </li>
            <li>
              <b>Verify current and voltage conservation.</b> KCL residual{" "}
              {currentText(residual(rows.kcl, currents), false)} A; selected{" "}
              {left ? "left" : "right"} loop KVL residual{" "}
              {currentText(-residual(selectedRow, currents), false)} V. Both
              loops are checked internally; power supplied equals dissipation.
            </li>
          </ol>
          {!single && (
            <details className="notes">
              <summary>Equivalent two-mesh method</summary>
              <div>
                <p>
                  Use distinct mesh symbols J_L and J_R, both clockwise. (R₁ +
                  Rₛ)J_L − RₛJ_R = ε₁; −RₛJ_L + (R₂ + Rₛ)J_R = ε₂.
                </p>
                <p>
                  D = R₁R₂ + Rₛ(R₁ + R₂) ={" "}
                  {fmt(s.r1 * s.r2 + s.rs * (s.r1 + s.r2))} Ω². J_L = [ε₁(R₂ +
                  Rₛ) + Rₛε₂]/D = {currentText(model.canonical[0])} A; J_R =
                  [ε₂(R₁ + Rₛ) + Rₛε₁]/D = {currentText(model.canonical[1])} A.
                </p>
                <p>
                  With your selected branch references: I₁ ={" "}
                  {signs[0] === 1 ? "" : "−"}J_L; I₂ ={" "}
                  {signs[1] === 1 ? "" : "−"}J_R; I₃ ={" "}
                  {signs[2] === 1 ? "" : "−"}(J_L − J_R) ={" "}
                  {currentText(currents[2])} A. The retained solver uses this
                  two-variable system.
                </p>
              </div>
            </details>
          )}
        </div>
      </details>
      {mode === "Experiment" && (
        <Activity
          aim="Measure all three branch currents and verify Kirchhoff’s First and Second Laws in at most two closed loops."
          steps={[
            "Start with the junction view. Select A and B; compare actual incoming and outgoing magnitudes with the signed I₁, I₂ and I₃ equation.",
            "Choose two loops. Record all three signed branch currents and solve two KVL equations together with KCL. I₃ is not an independent adjustment.",
            "Reverse a source polarity. Predict and observe current reversals. Change a current reference and confirm that physical flow and power stay unchanged.",
            "Select each loop and reverse traversal. Check that all voltage terms reverse and KVL still gives zero.",
            "Use the conservation exercises to construct equivalent equations and predict an unknown current. Request hints before revealing solutions.",
            "Try a single closed loop and confirm that the disconnected right branch has zero current. Return to two loops and explore a zero-I₃ state.",
          ]}
        />
      )}
      {mode === "Challenge" && (
        <Challenge
          id="kirchhoff"
          spec={{
            question: `For the displayed ${single ? "single-loop" : "two-loop"} circuit, find I₃ in A, signed with reference ${referenceDirection(2, signs[2])}. ε₁=${s.e1} V${single ? "" : `, ε₂=${s.e2} V`}, R₁=${s.r1} Ω${single ? "" : `, R₂=${s.r2} Ω`}, Rₛ=${s.rs} Ω. I₁ reference: ${referenceDirection(0, signs[0])}; I₂ reference: ${referenceDirection(1, signs[1])}.`,
            answer: currents[2],
            unit: "A",
            hints: [
              "Apply the signed junction law together with the active loop equations.",
              single
                ? "The right branch is disconnected. Find the series current from ε₁/(R₁ + Rₛ)."
                : "Use the left and right KVL equations to solve the two independent currents.",
              "Recover I₃ with KCL. A negative reading reverses its reference direction.",
            ],
            solution: `${equationText(rows.kcl)}. I₁ = ${currentText(currents[0])} A; I₂ = ${currentText(currents[1])} A; I₃ = ${currentText(currents[2])} A. Actual I₃ flow: ${actualDirection(2, model.canonical[2])}.`,
          }}
        />
      )}
      <Notes>
        <p>
          Charge conservation gives the junction rule; energy conservation gives
          the loop rule. The upper and lower junctions connect the same three
          branches. Canonical references are I₁ toward the upper junction, I₂
          away to the right and I₃ downward. The canonical relationships are I₁
          − I₂ − I₃ = 0, R₁I₁ + RₛI₃ = ε₁ and R₂I₂ − RₛI₃ = ε₂. A negative
          signed source contribution describes polarity relative to a loop, not
          a negative battery magnitude. Resistors are ideal and positive;
          invalid inputs are rejected. There are at most two closed loops;
          free-wire/open-branch editing beyond the single-loop preset is outside
          this model. Animation is qualitative conventional current, independent
          of numerical calculations. Displayed values are rounded; conservation
          uses full precision.
        </p>
      </Notes>
    </div>
  );
}
