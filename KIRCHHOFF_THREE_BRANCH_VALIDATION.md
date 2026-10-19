# Kirchhoff three-branch laboratory upgrade

Verified locally on 19 October 2026. Changes are uncommitted on `main`. No GitHub push, Vercel action or deployment was performed.

## Original model and source orientations

The existing `meshes()` function solves two clockwise mesh equations using scaled partial-pivot Gaussian elimination:

```text
(R₁ + Rₛ)J_L − RₛJ_R = ε₁
−RₛJ_L + (R₂ + Rₛ)J_R = ε₂
```

Each outer resistor belongs to one mesh, so its physical branch current equals that mesh current. The shared resistor carries the difference. The old interface reused I₁/I₂ for mesh assumptions and called the central result Iₛ, while showing mostly mesh equations. Its two-loop full-wire drawing did not animate all three physical branches separately.

The original left source contributes a positive voltage rise going upward; the right source contributes a positive rise going downward. These conventions are preserved. The diagram now displays each battery's **positive magnitude**, with source polarity represented by the cell symbol. Signed source controls explicitly describe clockwise-loop emf contributions. Thus ε₂ = −18 V places the right cell's positive terminal at the top; it does not mean a battery has a negative magnitude.

The shared `src/physics/engine.ts` solver is unchanged. A new Kirchhoff-specific model validates inputs and maps its solution to physical branches. The single-loop preset disconnects the right branch; the junction view uses the same underlying two-loop solution rather than inventing independent currents.

## Branch conventions and equations

Canonical references are:

| Current | Positive reference | Mesh mapping |
| --- | --- | --- |
| I₁ | Left branch toward upper junction A | J_L |
| I₂ | Upper junction A toward the right branch | J_R |
| I₃ | Shared resistor downward, A → B | J_L − J_R |

Only two currents are independent. There is no independent I₃ control.

```text
KCL:       I₁ − I₂ − I₃ = 0
Left KVL:  R₁I₁ + RₛI₃ = ε₁
Right KVL: R₂I₂ − RₛI₃ = ε₂
```

For user-selected reference signs s₁, s₂, s₃ (each +1 or −1), displayed readings are s₁J_L, s₂J_R and s₃(J_L − J_R). The equation coefficients transform by the same signs. Actual arrows always use the physical canonical currents. Reversing traversal multiplies every loop coefficient and the source term by −1, without changing the solved circuit or power. Selecting the lower junction reverses the entering/leaving classifications and signed KCL row.

## Visible changes

- Three equally styled current cards show signed reading, magnitude, actual physical direction and selected reference. Cards stack on phones.
- The circuit labels I₁, I₂ and I₃, with current values, direction arrows and animated conventional flow on all three branches. Upper/lower junctions are marked A/B. Zero-current branches have no actual arrowhead or moving dots.
- Actual-flow and assumed-reference views are mutually exclusive and clearly labeled. Assumed arrows are dashed, with animation paused. Electron drift is explained as opposite to conventional current.
- Animation speed changes playback only; it is not passed to the solver.
- First Law junction analysis selects A/B, displays all three currents, groups actual incoming/outgoing magnitudes, and shows totals, signed substitution and KCL residual.
- Second Law analysis displays the selected loop/traversal, each source/resistor rise or drop, an explicit branch-current equation, numerical substitution, KVL residual and power balance.
- Junction and loop equation exercises provide progressive hints, checked feedback and explicitly requested worked solutions. A separate unknown-current exercise checks signed predictions and explains the result.
- The KCL checker accepts rearrangements and nonzero multiples of equivalent linear equations. It uses a bounded arithmetic grammar with I₁/I₂/I₃, constants, parentheses and constant division. It rejects arbitrary names, code, nonlinear products, variable divisors, excessive nesting and tautologies. It uses neither `eval()` nor `Function()`.
- Loop entry now has coefficients for **all three currents** plus the source term; equivalent scaled rows are accepted.
- “How I₁, I₂ and I₃ Are Calculated” expands into seven live steps. An optional section explains the retained two-mesh method using distinct J_L/J_R symbols.
- Guided procedures, challenge questions, hints and solutions now use the displayed branch solution, including single-loop and reversed-reference states. Parameter/reference changes clear stale exercise feedback and predictions.

The other eight simulations, nine-tab navigation, stable tab IDs, theme preference, shared components, graph features, dependencies and security headers are unchanged. No fixed syllabus, semester, chapter or subtopic labels were introduced into the interface.

## Numerical validation

The new default uses the requested example: R₁ = 4 Ω, R₂ = 6 Ω, Rₛ = 5 Ω, ε₁ = +18 V and ε₂ = −18 V.

| Quantity | Exact/expected value | Display |
| --- | --- | --- |
| I₁ | 54/37 A | +1.459 A, left → A |
| I₂ | −36/37 A | −0.973 A, right → A |
| I₃ | 90/37 A | +2.432 A, A → B |
| Incoming at A | 54/37 + 36/37 A | 1.459 + 0.973 A |
| Outgoing at A | 90/37 A | 2.432 A |
| Net power supplied/dissipated | 1620/37 W ≈ 43.78378378 W | 43.784 W |

Full-precision relationships checked:

```text
54/37 − (−36/37) − 90/37 = 0 A
4(54/37) + 5(90/37) = 18 V
6(−36/37) − 5(90/37) = −18 V
ε₁I₁ + ε₂I₂ = R₁I₁² + R₂I₂² + RₛI₃²
```

Additional fixtures include both outer currents positive, all polarities reversed, zero shared current (ε₁ = 12 V, ε₂ = 18 V), zero outer branches, all sources zero, equal signed sources, resistor/source changes, single-loop behavior and all eight combinations of reference directions. A 300-circuit deterministic sweep compares the mesh-derived currents with **both independent nodal formulas and a separate three-equation system**. Tests cover supported resistance endpoints and uniformly scaled small/large resistances. Invalid/nonfinite inputs and numerical overflow are rejected.

All physics stays at full precision. Readings normally show three decimal places; incoming/outgoing substitutions use ≈ because displayed terms are rounded. The zero-flow display/animation threshold is 10⁻⁹ A. The unknown-current exercise accepts display rounding or 0.1% error. Existing main challenge tolerance remains 1.5%.

## Executed checks

- `npm test`: **126 passed**, including **69 new Kirchhoff tests** and all 57 previous physics/material tests.
- `npm run build`: TypeScript checking and production build passed.
- Prettier checks and `git diff --check`: passed.
- `npm run test:security`: all nine tabs loaded and challenge submission passed under the supplied CSP; no policy violations.
- Student-facing source search found no reintroduced fixed curriculum labels or legacy Iₛ/assumed-mesh labels in the Kirchhoff interface.

Browser command:

```powershell
npx playwright test --project=chromium --project=webkit --project=chromium-mobile --project=webkit-mobile --workers=2
```

The new seven-case Kirchhoff suite passed in all four projects: **28/28 new browser cases passed**. These check exact cards, arrow direction and marker placement, zero-flow behavior, both junctions, references/traversal, playback independence, rapid batched changes, reset/tab restoration, equivalent equations, hints/solutions, single-loop/challenge consistency, both themes, accessibility and responsive screenshots.

The first broad run completed with **75 passed, two test-harness failures and one expected skip**:

1. The existing all-tab challenge test used a global `.solution` locator, which also matched the new expandable calculation panel. Its locator was scoped to the actual challenge panel. The corrected challenge test passed in both Chromium and WebKit.
2. The WebKit 72-layout screenshot audit exceeded its 45-second budget under concurrent browser capture. This specific audit now allows 90 seconds; all layout/equation assertions are preserved.

The final targeted rerun executed both affected tests in both desktop engines: **4/4 passed**. The complete responsive audit took 17.1 seconds in Chromium and 24.5 seconds in WebKit in that sequential run. Across the completed runs, **all 77 executable browser cases have passed**; one WebKit skip is expected because CDP touch injection is Chromium-only. The entire 78-case command was not repeated after the two test-only corrections; the affected cases were rerun directly.

Raw broad-run results are retained in [.tools/kirchhoff/full-browser-results.json](.tools/kirchhoff/full-browser-results.json). Final affected-case rerun results are recorded in [.tools/kirchhoff/regression-rerun.json](.tools/kirchhoff/regression-rerun.json).

Firefox's independent blank-page smoke check still fails at `browser.newPage` with `Target crashed`, before loading the application, consistent with the earlier project reports. The updated Firefox application suite was therefore not claimed as verified. Its project configuration was retained. Browser profiles emulate Pixel 7 and iPhone 13; no physical phones or native macOS Safari were available.

## Screenshots and visual review

Captured **64 Kirchhoff screenshots**: circuit/cards and conservation workbench × default/reversed physical currents × light/dark themes × 390/1280 px × four browser projects. Automated layout checks also cover 320, 430 and 768 px; the existing all-tab audit additionally covers widths up to 1920 px.

Inspected default and reversed-flow views on desktop/mobile, in both themes, including iPhone/WebKit captures. Three current labels and arrows are visible, values agree with cards, polarity is correct, and diagrams/equations do not overlap or overflow. The offscreen skip link is hidden only during element screenshot capture to avoid a beyond-viewport fixed-element artifact; accessibility audits use the ordinary interface.

- [Desktop default circuit and three cards](.tools/kirchhoff/chromium-dark-1280-default-circuit.png)
- [Desktop reversed circuit, light theme](.tools/kirchhoff/chromium-light-1280-reversed-circuit.png)
- [Phone default circuit and stacked cards](.tools/kirchhoff/chromium-dark-390-default-circuit.png)
- [Phone default KCL/KVL workbench, light theme](.tools/kirchhoff/chromium-light-390-default-workbench.png)
- [iPhone/WebKit default circuit and cards](.tools/kirchhoff/webkit-mobile-dark-390-default-circuit.png)
- [iPhone/WebKit reversed workbench, light theme](.tools/kirchhoff/webkit-mobile-light-390-reversed-workbench.png)

## Files changed

| File | Change |
| --- | --- |
| `src/physics/kirchhoff.ts` | Validated branch mapping, reference/traversal rows, junction classification, restricted linear checker |
| `src/physics/kirchhoff.test.ts` | 69 new numerical, invariance, parser and invalid-input regressions |
| `src/simulations/Kirchhoff.tsx` | Three-current controls, equations, workbench, learning exercises, calculation steps and modes |
| `src/simulations/KirchhoffVisuals.tsx` | Branch diagrams, arrows/flow, junction views, signed current cards |
| `src/styles.css` | Scoped Kirchhoff styles and mobile card/exercise layouts |
| `tests/kirchhoff.spec.ts` | Seven new browser scenarios in desktop/mobile Chromium/WebKit profiles |
| `tests/lab.spec.ts` | Updated Kirchhoff conventions/default challenge, scoped solution locator and responsive-audit capture allowance |
| `playwright.config.ts` | Include Kirchhoff tests in both mobile projects |
| `KIRCHHOFF_THREE_BRANCH_VALIDATION.md` | This analysis and validation report |

Build output remains in ignored `dist/`. Raw browser artifacts are in ignored `test-results/`; persistent local evidence/build logs are in ignored `.tools/kirchhoff*`. No dependency, shared physics-engine, other simulation-module, deployment or unrelated-application changes were made. The maximum remains two closed loops; arbitrary circuit editing is outside this model.
