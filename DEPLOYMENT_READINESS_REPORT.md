# Deployment readiness

Status: **locally implemented, built and browser-tested; not deployed**. No preview hosting, production hosting, domain change, Git initialization, Git push or external storage operation was performed.

## Repository audit and protection

The starting folder was empty. There was no framework, package manifest, test harness, README, Git repository, branch/upstream, remote, deployment manifest or connected production project to preserve. No unrelated application was present and no existing user changes were overwritten. The supplied PDF was accessible and curriculum pages 7-8 were checked. The pasted master implementation prompt was treated as the user's request; the PDF supplied curriculum evidence only.

Added: React/TypeScript/Vite source under `src/`, central physics engine and tests, browser scenarios under `tests/`, performance/security scripts, npm manifest/lockfile, TypeScript/Vite/Playwright configuration, HTML entry point, `.gitignore`, static-host headers, README and four verification/coverage reports. No pre-existing files were modified or removed. `dist/` is the generated static build; `node_modules/` and test artifacts are ignored.

## Build and dependencies

`npm run build` passes strict TypeScript compilation and produces `dist/`. There are nine lazy module chunks. Runtime dependencies are React/React DOM 19.3.1 and KaTeX 0.19.0. Development tooling includes Vite 8.3.4, TypeScript 5.9.3, Vitest 4.1.11 and Playwright 1.64.1. Exact versions are locked by `package-lock.json`.

`npm audit --json` on the final lockfile reports **zero vulnerabilities at all severities**. An initial low-severity KaTeX advisory was addressed by updating to 0.19.0, then rechecking the application and equations. The formatting check passes. Test runner output includes a benign `NO_COLOR` / `FORCE_COLOR` environment warning; the production build has no build warning.

## Security verification

- No account, secrets, API tokens, database, cloud function, analytics or paid service is used.
- App operation sends no runtime external requests; scripts, fonts and styles are served locally from the static artifact.
- Source inspection found no `eval`, `new Function`, untrusted HTML insertion or credential material. Equation input is authored in source, with KaTeX trust disabled; student answers are rendered as text.
- Browser parameters are bounded and the engine rejects nonfinite/invalid values and singular circuits.
- No camera, microphone, location or other device permissions are needed.
- `npm run test:security` successfully loaded all nine tabs and submitted a challenge under the supplied Content Security Policy, with **zero policy violations**. An embedded bundled font required `data:` in `font-src`; the verified policy permits that font without enabling inline scripts or evaluation.
- `public/_headers` supplies CSP, no-sniff, no-referrer and restrictive Permissions-Policy headers. Only self-hosted scripts are permitted. Inline CSS is necessary for the equation renderer and state-dependent control styles. `connect-src 'none'`, `object-src 'none'`, `form-action 'none'` and frame restrictions are included.

Header enforcement is host-specific. The security test injects the response policy because Vite preview does not interpret `_headers`. Hosts that do not understand this format must configure equivalent HTTP headers. No claim is made about an uncreated production host.

## Performance measurement

`npm run test:performance` records raw measurements in `test-results/performance.json`. Test profile: Windows, Node 24.18.0, headless Chromium 156, 390 x 844 viewport, 4x CPU throttling, 1.6 Mbps download, 750 Kbps upload and 40 ms latency. Vite preview serves uncompressed responses; calculated gzip sizes are separate file measurements. Navigation timing and automated tab clicks include browser/tool overhead and are not field-user metrics.

| Measurement | Final sample |
| --- | --- |
| First contentful paint | 1,408 ms |
| DOM content loaded | 756.1 ms |
| Main document load event | 756.3 ms; lazy simulation content paints afterward |
| Active electron animation median frame interval | 16.7 ms, approximately 60 frames/s |
| Active electron animation 95th percentile interval | 16.8 ms, 119 sampled intervals |
| Cold automated tab switch + readiness | 205-1,043 ms, including initial chunk download and automation overhead |
| Warm automated tab switch + readiness | 151-271 ms, including automation overhead |
| Initial app + shared equations + current module | Approximately 157 kB gzip, excluding fonts and CSS |
| Bundled CSS | Approximately 13.9 kB gzip |

These are one-run observations, not a guarantee for all devices. Only the active simulation runs; electron animation uses local canvas rendering, other animations use CSS/SVG, and counter/energy time is independent of frame rate. Inactive modules are lazy-loaded and unmounted. Energy history is bounded by decimation. Warm tab measurements include Playwright action stabilization and should not be interpreted as a direct React render duration.

## Hosting prerequisites

1. Obtain explicit authorization and identify an isolated target project/audience before deploying.
2. Use `npm ci` and `npm run build`, then publish only `dist/` to a static HTTPS host.
3. Serve `.js`, `.css`, `.woff2` and other font assets with correct MIME types and HTTP compression. Do not upload `.tools/`, source-only dependencies or test traces.
4. Apply the supplied response headers or equivalent host configuration. Keep HTML revalidated and cache hashed assets immutably.
5. Verify the hosted build's asset paths, all nine tabs, CSP and mobile layout. `base: './'` supports an isolated static subdirectory.

No application database, environment secret or server-side runtime is required. There is no service-worker cache to invalidate. The app must be served over HTTP/HTTPS; opening the HTML directly from disk is unsupported.

## Remaining limits

The chapter's required functions are implemented. Real-handset verification and field performance remain untested; see `MOBILE_UI_TEST_REPORT.md`. Browser state is local session memory and theme preference is localStorage; there is no cross-device score or measurement sync. The circuit builder uses complete presets rather than arbitrary wire drawing. Non-ohmic loads, arbitrary larger networks and electrochemical dynamics are outside the specified chapter. Production publishing remains intentionally unauthorized and unperformed.
