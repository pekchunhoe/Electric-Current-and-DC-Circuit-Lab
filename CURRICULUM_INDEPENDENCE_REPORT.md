# Curriculum-independent interface verification

Verified locally on 19 October 2026. No Git push or deployment was performed.

## Changes

Removed fixed syllabus, course, semester, chapter, subtopic and experiment identifiers from the header, hero, footer, tab text, tooltips, accessible names, experiment headings, activity aims, browser title and page description. The hero now says “Virtual Laboratory”, experiment headings say “Interactive Experiment”, and the main title remains “Electric Current and DC Circuits”. The numbered teaching-note cross-reference now names the Series & parallel tab.

Reduced the desktop header from 92 px to 80 px and the mobile header from 73 px to 68 px. Reduced hero padding and removed unused label styles. Horizontal mobile navigation, keyboard navigation, existing stable tab IDs and light/dark theme behavior remain intact.

Physics calculations, controls, animations, graph labels, numerical values, units, procedures, challenges and learning outcomes were preserved. No physics engine, state hook, shared simulation component, dependency, internal filename or database identifier was changed.

## All nine tabs

| Navigation label | Experiment heading and tooltip/accessibility name |
| --- | --- |
| Electrical Current | Electrical Current |
| Ohm’s Law & Resistivity | Ohm’s Law and Resistivity |
| Resistance & temperature | Variation of resistance with temperature |
| emf & internal resistance | Electromotive force (emf), internal resistance and potential difference |
| Series & parallel | Resistors in series and parallel |
| Kirchhoff’s Rules | Kirchhoff’s Rules |
| Energy & power | Electrical energy and power |
| Potential divider | Potential divider |
| Potentiometer | Potentiometer |

## Verification

- `npm test`: all 57 physics/material tests passed.
- `npm run test:ui`: 49 passed, 20 Firefox failures before application loading, and two expected skips for the Chromium-only CDP touch test in Firefox/WebKit. All executable Chromium/WebKit desktop and mobile cases passed. The suite checks all nine simulations, controls, reset/state restoration, graphs, challenges, timing/integration, pointer/touch interaction, responsive layout and accessibility in both themes.
- `npm run build`: TypeScript checking and production build passed after the final source formatting.
- `npm run test:security`: all nine tabs and challenge submission passed under the existing CSP; no policy violations.
- Prettier check of all six modified source/test files: passed.
- `git diff --check`: passed.
- Source search across `src`, `index.html` and `public`: no remaining student-facing fixed curriculum identifiers. Remaining matches are internal CSS selectors, an existing test-suite description and scientific animation constants; none are curriculum labels shown to students.
- Independent browser audit: 108 states passed (nine tabs × Explore/Experiment/Challenge × light/dark × 390 px/1280 px). Checked body text including collapsed notes, tooltips, accessibility labels, metadata, all nine tab labels and headings, absence of horizontal page overflow, tab targets of at least 44 px, theme persistence after reload and absence of runtime errors.

| Browser project | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Chromium desktop | 21 | 0 | 0 |
| WebKit desktop | 20 | 0 | 1 |
| Chromium mobile (Pixel 7 emulation) | 4 | 0 | 0 |
| WebKit mobile (iPhone 13 emulation) | 4 | 0 | 0 |
| Firefox desktop | 0 | 20 | 1 |

Firefox fails at `browserContext.newPage` with `Target crashed`, before loading the application. A separate Firefox check using only a blank page reproduces the crash. The existing `MATERIAL_SELECTION_VALIDATION.md` records the same environment limitation. Firefox verification remains unavailable; its configuration and assertions were preserved.

After all 71 browser cases finished, Playwright waited during preview-server teardown. Stopping only the preview process launched by this run allowed the runner to finish and write its results normally. The command exited with status 1 because of the 20 Firefox failures; no test was interrupted.

Browser emulation does not establish behavior on physical phones or native Safari.

## Visual evidence

Captured 36 full-page screenshots for all nine tabs in both themes at mobile (390 × 844) and desktop (1280 × 800) viewports. Inspected the nine-tab desktop/mobile contact sheets, full-page Ohm views on desktop/mobile, and the desktop light-theme real-cell view. Headings wrap cleanly, navigation remains readable and touch-friendly, and removed labels leave no empty rows or separators.

- [Desktop overview, all nine tabs](test-results/curriculum-independent/dark-1280-overview.png)
- [Mobile overview, all nine tabs](test-results/curriculum-independent/light-390-overview.png)
- [Desktop Ohm view](test-results/curriculum-independent/dark-1280-tab-2.png)
- [Mobile Ohm view](test-results/curriculum-independent/dark-390-tab-2.png)
- [Desktop light theme, real-cell view](test-results/curriculum-independent/light-1280-tab-4.png)
- [108-state audit results](test-results/curriculum-independent/audit.json)
- [Full browser results](test-results/browser-results.json)

Existing browser regressions also capture all nine tabs at 390 px and 1280 px and check layout/equations across eight viewport widths from 320 px to 1920 px.

## Modified files

| File | Purpose |
| --- | --- |
| `src/app/App.tsx` | Shared labels, nine tab names/tooltips, headings, hero and footer |
| `src/styles.css` | Compact header/hero and removal of obsolete label styles |
| `src/simulations/Ohm.tsx` | Descriptive activity aim and teaching-note tab reference |
| `src/simulations/Potentiometer.tsx` | Descriptive activity aim |
| `index.html` | Curriculum-independent browser title and description |
| `tests/material-selection.spec.ts` | Replace the obsolete numbered-heading locator with the descriptive heading |
| `CURRICULUM_INDEPENDENCE_REPORT.md` | This change and verification report |

Generated local artifacts are ignored by Git: production files in `dist/`, screenshots/results/traces in `test-results/`, and audit scripts, build log and existing test screenshot outputs in `.tools/`. The supplemental scripts are `.tools/audit-curriculum-labels.mjs`, `.tools/curriculum-contact-sheets.ps1` and `.tools/firefox-smoke.mjs`.
