# DC Circuit Lab - Physics 2, Semester 2

A standalone, mobile-first SP025 Chapter 3 laboratory. All nine subtopics contain a working simulation, Explore/Experiment/Challenge modes, live calculations, reset controls and teaching notes. No login, database, API key or paid service is required.

## Run locally

Use Node.js 22.12+ or 24 and npm. In this folder:

```powershell
npm ci
npm run dev
```

Open the printed local address (normally http://127.0.0.1:5173). For the production build:

```powershell
npm run build
npm run preview
```

`dist/` is the static deployment artifact. It must be served over HTTP; opening `index.html` by double-click is not supported by JavaScript modules.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Strict TypeScript check and static production build |
| `npm test` | Independent physics benchmarks, invariants and invalid-input tests |
| `npm run test:ui` | Chromium, Firefox and WebKit browser verification |
| `npx playwright install` | Install the browser engines before first UI test run |
| `npx prettier --check src tests *.ts *.json index.html` | Source formatting check |
| `npm audit` | Check the locked dependency graph against current advisories |
| `npm run test:security` | Check all nine tabs and challenge submission under the supplied CSP |
| `npm run test:performance` | Record throttled phone emulation and bundle sizes |

## Experiments

| Tab | Working investigation |
| --- | --- |
| 3.1 Electrical current | Random microscopic motion, net electron drift, conventional current, signed charge counter, area and voltage investigation |
| 3.2 Ohm's Law and resistivity | Series ammeter, parallel voltmeter, switch, five-or-more readings, V-I regression, material and conductor geometry, equivalent-resistance graphing |
| 3.3 Variation of resistance with temperature | Heating and lattice vibration, 20 C reference model, R-T investigation and fixed-voltage current |
| 3.4 Electromotive force (emf), internal resistance and potential difference | Real-cell model, external load, open-circuit emf, internal loss, terminal V-I intercept and slope |
| 3.5 Resistors in series and parallel | Two/three series and parallel presets, mixed R1+(R2 parallel R3), selectable components, voltage/current/power inspection |
| 3.6 Kirchhoff's Rules | Junction, single loop, two shared-resistor loops, signed sources and assumed directions, selectable traversal, equation activities and simultaneous solution |
| 3.7 Electrical energy and power | Resistive lamp, wattmeter, stopwatch, piecewise-power energy accumulation, live energy-time trace |
| 3.8 Potential divider | Two/three resistors, movable positive probe and selectable signed terminals, node-potential graph |
| 3.9 Potentiometer | Metre wire, rheostat, draggable jockey, signed galvanometer, null recording, two-cell comparison and dry-cell internal-resistance measurement |

The full outcome-by-outcome mapping is in [CURRICULUM_COVERAGE_MATRIX.md](CURRICULUM_COVERAGE_MATRIX.md).

## Learning workflow

Explore freely; choose Experiment for the procedure and measurement activity; choose Challenge to predict an answer, request progressive hints and check the result. A worked explanation becomes available only after an attempt. Changing the physical question clears the previous attempt. The score counts each correctly solved parameter question once, within the browser session.

Tab changes preserve parameters, datasets, modes and challenge attempts in memory. A page reload starts a fresh lab; only the theme preference is stored in localStorage. Reset restores the active experiment's physical defaults and clears its measurements/counters. Scores are formative practice, not an assessment record.

Use the sliders, their exact-value number fields, or keyboard arrows. The potentiometer jockey and divider probe support pointer/touch dragging with keyboard-accessible controls as alternatives. To record an exact potentiometer null, slide close to balance and use **Fine tune to null** within 0.1 cm. Primary/cell parameter changes clear incompatible potentiometer comparison readings.

## Architecture

- `src/physics/engine.ts`: pure deterministic calculations, explicit SI inputs, Gaussian elimination with scaled pivoting, validation and regression.
- `src/simulations/`: nine lazy-loaded experiments.
- `src/components/`: shared instrument symbols, controls, MathML/KaTeX equations, graphs, notebook and formative challenges.
- `src/hooks/useLab.ts`: tab-state cache and monotonic simulation clock.
- `src/app/App.tsx`: accessible navigation, learning modes, theme and error boundary.
- `tests/lab.spec.ts`: functional browser, viewport, touch, accessibility and visual evidence checks.

Only the active module runs. Current animation uses a local canvas; other animations use SVG/CSS. The animation speed is independent of physics. Energy and charge are integrated using measured elapsed time, excluding hidden-browser time; no frame count determines the result. Energy graph history is decimated beyond 600 points to bound memory while preserving earlier contributions.

## Assumptions and scope

All resistors and introductory meters are ideal unless explicitly described. The electron model is qualitative and visually scaled; copper-like geometry and density are fixed. The temperature law is a limited-range linear approximation referenced to 20 C. The lamp is a constant-resistance teaching load, with brightness normalized to a 24 W rating. There are at most two Kirchhoff loops and three divider resistors. Arbitrary free-wire circuit building, AC/transient analysis and advanced loaded dividers are outside this chapter.

The potentiometer uses a uniform 100 cm, 10 ohm wire and a 10 kohm detector with an explicit Thevenin model. At null, detector loading vanishes exactly. The wire-drop display is the open-detector comparison potential; off-null detector loading is explained in the teaching notes. Cell comparison and internal-resistance measurements require a constant primary gradient.

No backend or runtime external request is used. All code and equation fonts are bundled locally. `public/_headers` supplies a static-host security policy; configure equivalent headers on hosts that do not support this file. CSS inline styles are required for controls and mathematical layout; script inline execution and evaluation are not required.

## Verification and delivery

See [PHYSICS_VALIDATION_REPORT.md](PHYSICS_VALIDATION_REPORT.md), [MOBILE_UI_TEST_REPORT.md](MOBILE_UI_TEST_REPORT.md) and [DEPLOYMENT_READINESS_REPORT.md](DEPLOYMENT_READINESS_REPORT.md) for actual test results, environment, measured performance and limits. Test-generated screenshots and traces are placed in ignored `test-results/`.

The original workspace was empty, with no Git metadata, remotes, existing application or hosting connection. No user files were removed or replaced, no credentials were needed, and no deployment or Git push was performed. The supplied curriculum PDF was read as curriculum evidence; its contents were not treated as operational instructions.

Implementation follows the official [React](https://react.dev/learn) and [Vite](https://vite.dev/guide/) workflows. The npm lockfile records the exact installed versions.
