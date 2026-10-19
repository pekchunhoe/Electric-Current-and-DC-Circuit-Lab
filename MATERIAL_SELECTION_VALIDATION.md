# Material selection validation — 19 October 2026

The Nichrome/Copper mismatch was reproduced before changing application code in both desktop Chromium and WebKit, starting from clean Git revision `187eb69`. The tested configuration was 24 V, 0.5 m and 3 mm².

Selecting Nichrome stored the correct numeric resistivity, `1.1e-6`, and produced 0.183 Ω and 131 A. However, the controlled select received `String(s.rho)`, which evaluates to `"0.0000011"`. Its option value was the different string `"1.1e-6"`. React could not match an option and fell back to Copper. The physics engine was already using Nichrome. This was a controlled-value identity error, reproduced across engines, rather than an incorrect resistivity formula or a Safari-only problem.

The shared `Select` component uses native `<select>` rendering, keys derived from option values, and synchronous React change handlers. There is no custom label overlay. `useLab` caches state in memory when navigating between tabs; simulation inputs are not persisted across page reloads. Only the theme uses local storage. No independent material-name state or delayed calculation update was found.

The fix stores one material identifier (`copper`, `aluminium`, or `nichrome`) and looks up its resistivity, display text, description and conductor appearance in one preset table. Resistance, current, circuit instruments, meters, graph gradient, challenge answer and notebook readings use the resulting calculation. Changing the material still clears readings from the previous experiment.

The audit also confirmed duplicate option values and React keys in the temperature coefficient selector: its unconditional “Current coefficient” option duplicated whichever preset was active. That option now appears only for a custom coefficient.

Files changed:

| File | Change |
| --- | --- |
| `src/physics/materials.ts` | Material identifiers and authoritative preset table |
| `src/simulations/Ohm.tsx` | Store material ID; derive controls, appearance and physics inputs |
| `src/simulations/Temperature.tsx` | Avoid duplicate preset/custom option values and keys |
| `src/physics/materials.test.ts` | Independent expected resistivities, resistance/current benchmarks and preset identity checks |
| `tests/material-selection.spec.ts` | Browser synchronization, repeated/rapid changes, notebook/graph, reset, tab navigation, reload and selector audit |
| `tests/lab.spec.ts` | Make the two existing timer tests use a fixed clock origin and future pause target, avoiding the observed host/browser clock race |
| `playwright.config.ts` | Add Pixel 7/Chromium and iPhone 13/WebKit emulation for these regressions |
| `MATERIAL_SELECTION_VALIDATION.md` | Findings, validation and evidence |

Physics benchmarks use R = ρL/A, A = 3 × 10⁻⁶ m², and I = V/R:

| Material | ρ (Ω m) | R (Ω), rounded | I (A), rounded | Existing UI meter formatting |
| --- | ---: | ---: | ---: | --- |
| Copper | 1.7 × 10⁻⁸ | 0.00283 | 8,470.59 | 0.00283 Ω; 8,470 A |
| Aluminium | 2.82 × 10⁻⁸ | 0.00470 | 5,106.38 | 0.0047 Ω; 5,110 A |
| Nichrome | 1.1 × 10⁻⁶ | 0.18333 | 130.91 | 0.183 Ω; 131 A |

These are ideal mathematical currents at fixed temperature, not safe operating values or achievable currents for an ordinary practical circuit. The existing model notes identify the ideal instruments, excluded self-heating and theoretical large currents. The UI retains its existing three-significant-figure formatter; unit tests validate unrounded quantities.

All nine tabs were inspected for controlled selection identity and physics input mappings:

| Tab | Selection audit result |
| --- | --- |
| 3.1 Current | No physics preset dropdown; graph inspector uses numeric indices |
| 3.2 Ohm/resistivity | Material identity mismatch fixed; component and arrangement IDs already match |
| 3.3 Temperature | Duplicate custom/preset option fixed; coefficient remains the single numeric input |
| 3.4 emf/internal resistance | No physics preset dropdown; shared graph inspector reviewed |
| 3.5 Resistors | Configuration/component IDs match; selection resets when topology changes |
| 3.6 Kirchhoff | Structure and loop IDs match calculation/rendering state |
| 3.7 Energy/power | No physics preset dropdown; graph inspector reviewed |
| 3.8 Divider | Node IDs match physics inputs; removing R₃ clamps both terminals |
| 3.9 Potentiometer | Test-cell IDs match active cell inputs |

Validation results:

- `npm test`: 57 tests passed, including all existing physics tests and four added preset tests.
- `npm run build`: TypeScript checking and production build passed.
- New browser regressions: 16 passed across desktop Chromium, desktop WebKit, Pixel 7/Chromium emulation and iPhone 13/WebKit emulation. Coverage includes displayed selection, one checked option, resistivity, resistance/current equations, SVG ammeter, effective resistance, graph annotation, recorded points, clearing old readings, repeated Copper → Nichrome → Aluminium → Copper transitions, batched rapid changes, popup opening/cancellation, tab/component restoration, reset and reload defaults.
- Full Chromium/WebKit and mobile run (`npx playwright test --project=chromium --project=webkit --project=chromium-mobile --project=webkit-mobile --workers=2`): 48 passed, one expected WebKit skip for Chromium-only CDP touch injection, and one failure in the existing charge-counter test's clock setup (`Cannot fast-forward to the past`). This run includes all 16 new regressions, both engines' nine-tab responsive layouts, both-theme accessibility, challenges, graphs and other simulation controls.
- The clock failure was traced to `pauseAt(new Date())` racing the browser's clock against the host clock. Only the two timer tests' setup was changed to install a fixed origin and pause one second later. Both timer tests then passed three repeats in each engine (`npx playwright test tests/lab.spec.ts --project=chromium --project=webkit --grep 'integrat' --repeat-each=3 --output=.tools/material-selection/timer-regression-output --reporter=list`): 12/12 passed. Across the completed runs, all 49 executable browser cases passed. The full 50-case command was not rerun after this test-only correction; the affected tests were repeated directly. No assertions were removed.
- Development console audit: no console errors or uncaught page errors in Chromium or WebKit while visiting all nine tabs and changing material/coefficient selections.
- `npm run test:security`: all nine tabs and challenge submission passed under the supplied CSP, with no violations.
- Formatting check and `git diff --check`: passed.

Visual evidence was inspected locally. Before, Copper was displayed alongside Nichrome’s 0.183 Ω/131 A results; after, Nichrome, its explicit resistivity and grey conductor appearance agree with those readings. Evidence files are local artifacts in ignored `.tools/`, separate from source changes:

- [Before, WebKit](.tools/material-selection/before/webkit-before.png)
- [After, WebKit, matching viewport/configuration](.tools/material-selection/webkit-after-matched.png)
- [Before, Chromium](.tools/material-selection/before/chromium-before.png)
- [After, Chromium, matching viewport/configuration](.tools/material-selection/chromium-after-matched.png)
- [After, iPhone/WebKit emulation](.tools/material-selection/webkit-mobile-after.png)
- [After, Chromium phone emulation](.tools/material-selection/chromium-mobile-after.png)
- [Original regression run, including Firefox failures](.tools/material-selection/dropdown-browser-results.json)
- [Full browser run, including the subsequently corrected clock-harness failure](.tools/material-selection/full-browser-results.json)
- [Chromium development console and selection snapshots](.tools/material-selection/chromium-development-console.json)
- [WebKit development console and selection snapshots](.tools/material-selection/webkit-development-console.json)
- [CSP validation](.tools/material-selection/security.json)

Limitations: no physical iOS device or macOS Safari was available. Playwright WebKit with iPhone emulation is not real-device Safari verification. Tests verify the native select’s selected-option state; headless captures do not establish the exact OS-owned picker/checkmark appearance from the reported screenshot. The closed-label/physics discrepancy itself was reproduced before the fix in Chromium and WebKit. Firefox’s four new tests failed before page creation with `Target crashed`; a separate blank-page launch check also crashed, so Firefox remains unverified in this environment. Its configuration has not been weakened or removed.

Simulation state restoration across tabs is verified. Reload resets simulations by existing design; cross-reload simulation persistence was not added. No dependencies, security settings or unrelated physics engines were changed. All nine tabs, controls, animations, graphs, modes, challenges and themes remain present.

Git started clean. Changes remain local and uncommitted on `main`; no push, deployment or Vercel action was performed.
