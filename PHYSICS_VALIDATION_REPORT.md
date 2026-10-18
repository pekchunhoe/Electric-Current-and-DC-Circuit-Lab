# Physics validation report

Verification date: 18 October 2026 (Asia/Kuala_Lumpur).

`npm test` runs **53 passing tests in one file**. The final engine run completed in 398 ms, including 64 ms of test execution. No failed, skipped or untested mandatory benchmark remains. Deterministic property checks exercise 250 additional physically valid networks inside the invariant test.

| Required case | Calculated result | Status |
| --- | --- | --- |
| 1. Q = 3 C, t = 2 s | I = 1.5 A | Pass |
| 2. V = 12 V, R = 6 ohm | I = 2 A | Pass |
| 3. rho = 1.7e-8 ohm m, L = 2 m, A = 1e-6 m² | R = 0.034 ohm | Pass |
| 4. R0 = 10 ohm at 20 C, alpha = .004/C, T = 70 C | R = 12 ohm | Pass |
| 5. emf = 12 V, r = 1 ohm, R = 5 ohm | I = 2 A, terminal V = 10 V, internal drop = 2 V | Pass |
| 6. 4 ohm + 6 ohm in series | R_eq = 10 ohm | Pass |
| 7. 6 ohm parallel 3 ohm, supply 12 V | R_eq = 2 ohm, branch currents 2 A and 4 A, total 6 A | Pass |
| 8. 12 V, 6 ohm, 10 s | I = 2 A, P = 24 W, W = 240 J | Pass |
| 9. 12 V, divider 2 kohm and 4 kohm | V1 = 4 V, V2 = 8 V | Pass |
| 10. l1 = 80 cm, l2 = 64 cm, R = 4 ohm | r = 1 ohm | Pass |
| 11. Kirchhoff two-loop fixtures | KCL, both KVL equations and total power conserved | Pass |

Known-answer mesh fixtures include aiding/opposing sources, positive and negative mesh currents, zero shared current and zero source voltages. For the default 12 V / 6 V sources and 4 / 6 / 2 ohm resistors, clockwise mesh currents are 27/11 A and 15/11 A; shared downward current is 12/11 A. For equal 12 V sources and 4 / 4 / 2 ohm resistors, the two mesh currents are 3 A and the shared current is zero. For opposing 12 V / -12 V sources, they are +1.5 A and -1.5 A.

## Conservation and limit checks

- Series voltage sum and parallel current sum are reflected in the network model; each supported arrangement is checked against source power and per-component dissipation.
- Generated positive parallel networks have R_eq no greater than their smallest resistor; generated series networks have R_eq at least their largest resistor.
- Battery source power equals external load power plus internal heating. Open-circuit current is zero and terminal voltage equals emf.
- Temperature returns exactly R0 at 20 C. Positive alpha gives increasing resistance; fixed voltage then gives decreasing current.
- P = IV, I²R and V²/R agree. Doubling voltage at fixed R quadruples power. Accumulation preserves earlier contributions after power changes.
- Divider drops sum to supply, selected multiple-resistor spans are additive, terminal reversal reverses output, equal terminals give zero, and an open supply gives zero passive-chain voltage differences.
- Potentiometer default open null is 80 cm and loaded null 64 cm. Detector current vanishes at exact balance and reverses sign across it. Same-gradient cell emf ratios match length ratios. Out-of-wire balances are rejected.
- With the potentiometer primary open there is no imposed gradient, but the connected secondary cell can still drive the 10 kohm detector through the wire segment. A separate endpoint test covers an ideal source directly across the wire when rheostat resistance is zero.
- Measured V-I regression returns the correct resistance; terminal V-I regression returns intercept emf and slope -r. Coincident x-values do not produce a fabricated gradient.

## Numerical safeguards

Strict finite/positive/nonnegative input checks reject NaN, invalid geometry, zero denominators, negative physical resistances, out-of-wire contacts and invalid terminal selections. The scaled-pivot solver rejects singular/conflicting matrices and handles a zero leading diagonal by pivoting. Sixteen invalid-input fixtures are tested. Browser controls constrain parameters to the supported domain.

Residual assertions use floating-point tolerances rather than exact equality where appropriate. Browser meters display approximately three significant figures; the engine keeps full precision. Ideal readings have no hidden noise. Graph regression is explicitly based on manually recorded points. Animation playback speed never enters electrical calculations.

## Model limits

The engine solves the supported chapter circuits, not arbitrary networks. It excludes self-heating feedback, AC/transient behavior, non-ohmic lamp curves, electrochemical polarization and nonuniform potentiometer wire. Microscopic motion is a labelled qualitative illustration. Resistance-temperature linearity is a limited-range approximation. These are disclosed in the app and README.
