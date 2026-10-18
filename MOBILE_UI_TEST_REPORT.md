# Mobile UI and browser verification

Date: 18 October 2026, Asia/Kuala_Lumpur. Test host: Windows, Node 24.18.0, Playwright 1.64.1. Engines: Chromium 156, Firefox 157 and Playwright WebKit 27.2.

## Nine-tab status

All rows have working Explore, Experiment and Challenge modes, live physical controls and reset behavior. Physics functions pass independently of the browser.

| Subtopic | Distinct visual / working controls | Graph or analysis surface | Activity | Physics | Responsive browser checks |
| --- | --- | --- | --- | --- | --- |
| 3.1 Electrical current | Lattice, random electrons, net drift, counting plane; V, area, counting time, playback and arrows | Signed Q-t prediction and measured counter | Charge counting and current challenge | Pass | Pass |
| 3.2 Ohm's Law and resistivity | Switched ammeter/voltmeter circuit; R, V, material, length, area and arrangement | Manual V-I points, V/I table, fitted gradient, point inspection | Guided Experiment 2 and numerical challenge | Pass | Pass |
| 3.3 Variation of resistance with temperature | Heated vibrating lattice; T, R0, alpha, material, fixed V and pause | R-T line and manual readings | Temperature procedure and resistance challenge | Pass | Pass |
| 3.4 Electromotive force (emf), internal resistance and potential difference | Series internal resistor and terminal voltmeter; emf, r, load and switch | Terminal V-I graph, intercept, slope and loss budget | Battery experiment and terminal-voltage challenge | Pass | Pass |
| 3.5 Resistors in series and parallel | Five configurations, selectable resistor, branch V/I/P, visibility switches | Equivalent-resistance V-I investigation | Series/parallel procedure and reduction challenge | Pass | Pass |
| 3.6 Kirchhoff's Rules | Junction, one/two loops, signed sources, assumed directions and traversal selection | Junction and loop equation activities; simultaneous solution; conservation residuals | Guided two-loop analysis and shared-current challenge | Pass | Pass |
| 3.7 Electrical energy and power | Power-dependent lamp, ammeter, voltmeter, wattmeter, stopwatch, independent resets | Piecewise integrated energy-time trace | Timed power/energy investigation and challenge | Pass | Pass |
| 3.8 Potential divider | Two/three resistors, positive-probe drag, output terminal polarity and switch | Node-potential chart | Resistor-ratio experiment and divider challenge | Pass | Pass |
| 3.9 Potentiometer | Metre wire, rheostat, primary switch, two cells, jockey, load and galvanometer | Exact null, balance-length notebook, emf ratio and measured internal resistance | Guided Experiment 3 and dry-cell challenge | Pass | Pass |

## Viewport coverage

The all-tab browser scenario visits every subtopic at each size below in all three engines: **216 tab/viewport/engine combinations**.

| Viewport (CSS pixels) | Horizontal page overflow | Equation overflow or malformed KaTeX | Tabs and simulation visible |
| --- | --- | --- | --- |
| 320 x 568 | None detected | None detected | Pass |
| 360 x 800 | None detected | None detected | Pass |
| 375 x 812 | None detected | None detected | Pass |
| 390 x 844 | None detected | None detected | Pass |
| 430 x 932 | None detected | None detected | Pass |
| 768 x 1024 | None detected | None detected | Pass |
| 1280 x 800 | None detected | None detected | Pass |
| 1920 x 1080 | None detected | None detected | Pass |

Phone layout puts the experiment before controls, uses horizontal chapter navigation and native keyboard-capable sliders, and exposes exact numeric fields. Scientific probe drag surfaces suppress browser panning during a gesture. The final controls allow temporary partial numeric input while maintaining the previous valid physical state; out-of-range drafts revert on blur. Labels use unique IDs, including labels with Greek symbols/subscripts.

## Actual test runs and final status

- `npm test`: **53 passed**, zero failed.
- Initial complete `npx playwright test`: **41 passed, 5 failed, 2 skipped**. Failures were three test locators using subscript digits where the visible control used ordinary digits, and two exact pointer-position assertions affected by native CSS-pixel rounding. Both test defects were corrected.
- Corrected potentiometer/control scenarios, all three engines: **6 passed** in 23.4 s.
- Final numeric editing, state/reset and physical-control scenarios, all three engines: **9 passed** in 37.9 s.
- Final resistor flow/configuration scenarios after branch animation refinement: **3 passed** in 13.3 s.

Final unique scenario/engine results across these runs: **49 passed, 0 unresolved failures, 2 intentional skips**. This includes the additional three-engine numeric-entry regression. The skip is the same Chromium-specific touch test under two unsupported CDP engines, not omitted functional circuit coverage.

The final evidence is a **latest-result aggregation per named scenario and browser**, not a claim that the original full command was green. `test-results/browser-results.json`, `recheck-results.json`, `control-final-results.json` and `flow-final-results.json` retain the individual results; `verification-summary.json` combines them without replacing the historical failures. No product test failure remains unresolved after the targeted corrections.

Two intentional skips cover Chromium-specific CDP touch injection under Firefox and WebKit. All engines pass ordinary pointer drag and keyboard/numeric alternatives. Actual touch event injection is verified on Chromium at 390 x 844. The measured native pointer result has a 0.2 cm tolerance, consistent with pixel resolution; exact balance lengths are verified independently with numeric entry.

## Accessibility and visual review

- Axe WCAG 2 A/AA and WCAG 2.1 AA checks pass for all nine tabs in both themes in each engine: **54 audited tab/theme/engine views**. This is automated coverage, not a full assistive-technology certification.
- Tab arrow keys, Home/End, native slider keyboard controls, explicit accessible labels and focus indicators are verified. Drag interactions have numeric/select alternatives.
- Reduced-motion emulation disables SVG/CSS motion; the electron illustration respects the preference on rendering. Current calculations remain independent of visual playback speed.
- All nine default tabs were captured at 390 and 1280 pixels wide in each engine. Additional captures show five V-I readings, open-circuit terminal voltage, correct/incorrect feedback and light theme.
- Instrument panels for all nine phone experiments were visually inspected as a contact sheet. Graph axes, measured points, source polarity, internal-resistance wiring and null apparatus were inspected. Label sizes and drag target sizes were improved following review.

These captures establish initial visual evidence. A committed pixel-difference baseline is not included; screenshot generation plus visual inspection was used for this new project. Screenshots/traces are ignored development evidence in `test-results/`.

## Limits

No physical Android or iPhone was available. WebKit automation is not a substitute for device Safari testing. Network/CPU throttling is desktop emulation. A long classroom session, real screen-reader usability study, and low-end physical-device thermal/battery measurements remain untested. No layout or functional blocker was found in the tested environment.
