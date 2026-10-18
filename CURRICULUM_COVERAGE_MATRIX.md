# Curriculum coverage matrix

Authority: supplied **Curriculum Specifications (CS) Physics SP025.pdf**, PDF/printed pages 7-8, Topic 3. Inspected text and rendered page. Semester identity remains **Semester 2**. Only the pasted implementation prompt was treated as the user's action request.

Every row has a functional experiment, not solely teaching text. Engine tests are in `src/physics/engine.test.ts`; browser checks are in `tests/lab.spec.ts`.

| Outcome | Functional feature | Verification |
| --- | --- | --- |
| 3.1(a) microscopic model, free electrons, drift velocity | Random-motion canvas, fixed positive lattice, signed drift/conventional arrows, visual scaling disclosure | Microscopic current identity, voltage reversal; browser voltage/speed independence |
| 3.1(b) define I = dQ/dt | Signed charge-counting interval and current meter; Q-t plot | 3 C / 2 s = 1.5 A benchmark |
| 3.1(c) use current and Q = ne | Calculated transferred charge, electron count and density distinguished | Electron count/charge identity and counting interval |
| 3.2(a) state and use Ohm's Law | Voltage slider, ohmic load, series ammeter, parallel voltmeter, switch | 12 V / 6 ohm = 2 A; browser controls and switch |
| 3.2(b) define and use resistivity | Copper/aluminium/nichrome presets; length and area controls and conductor dimension visual | 0.034 ohm fixture; length and area scaling; UI geometry changes |
| 3.2(c) sketch V-I graph (Experiment 2) | I on horizontal axis, V on vertical; theoretical line, recorded points, touch-readable point selector | Eight-viewport graph rendering and equation checks |
| 3.2(d) verify Ohm's Law (Experiment 2) | Unlimited manual readings, V/I column, fitted gradient, controlled fixed-resistance dataset | Browser records five voltages and recovers 6 ohm slope |
| 3.2(e) series/parallel effective resistance by graphing | Series/parallel test-load selector, independent voltage readings and regression | Network conservation tests; graph regression and arrangement browser checks |
| 3.3(a) explain temperature effect in metals | Heating control changes lattice vibration, resistance and fixed-voltage current | Positive coefficient monotonicity; reference and temperature browser checks |
| 3.3(b) R = R0[1 + alpha(T - T0)], alpha at 20 C | R0, alpha and material controls; R-T graph and substitution | 10 ohm, .004/C, 70 C -> 12 ohm; exact reference point |
| 3.4(a) define emf and internal resistance | Real-cell source, series internal resistor, terminal voltmeter, loss budget; definitions in notes | Loaded/open/zero-internal-resistance cases |
| 3.4(b) factors influencing internal resistance | Explicit adjustable r and qualitative discussion of chemistry, geometry, electrolyte, age and temperature | Notes inspected; no fabricated universal coefficient |
| 3.4(c) relationship of emf and terminal pd | Load and switch controls, terminal/lost-voltage budget | Open-circuit terminal voltage equals emf; load trend test |
| 3.4(d) V = emf - Ir | Terminal-voltage/current collection and regression; slope -r and intercept emf | 12 V, 1 ohm, 5 ohm -> 2 A, 10 V; regression -1 ohm, intercept 12 V |
| 3.5(a) effective series/parallel resistance | Two and three resistors; mixed preset; component selection and per-component V/I/P | Benchmarks 10 ohm and 2 ohm; all network power identities; property sweep |
| 3.6(a) state and apply Kirchhoff's Rules | Junction equation entry; single-loop KVL; selectable two loops/traversal; coefficient activity and worked simultaneous solution | Positive/negative/zero/shared-current fixtures; KCL, KVL, energy checks |
| 3.6 scope: maximum two closed loops | Only junction, single-loop and two-loop structures | Structure selector inspected and browser exercised |
| 3.7(a) P = IV = I²R = V²/R | Linked ammeter, voltmeter, wattmeter and lamp brightness | Equivalent power identities, voltage doubling gives quadruple power |
| 3.7(b) W = IVt | Stopwatch, energy counter and piecewise energy-time trace; independent resets | 240 J benchmark; browser 10 s at 24 W then 5 s at 96 W -> 720 J |
| 3.8(a) potential-divider principle | Draggable positive probe, signed terminal selection, resistor selection, node chart | Divider probe/terminal browser checks |
| 3.8(b) voltage-divider equation; max three resistors | Two/three resistor controls; summed resistance between chosen nodes | 4 V/8 V benchmark; three-node potentials, reversed/equal terminals, open switch |
| 3.9(a) principles and applications | Primary wire/rheostat, jockey, signed galvanometer and exact null | Null detector current, mismatch polarity, primary-off and unattainable balance |
| 3.9(b) emf1/emf2 = l1/l2 | Two-cell selector, separate null records, measured ratio | Analytical ratio test; UI 80 cm/60 cm -> 1.33 |
| 3.9(c) dry-cell internal resistance (Experiment 3) | Open/loaded switch, known load, null table, computed r; structured aim/apparatus/setup/procedure/errors | 80 cm/64 cm with 4 ohm -> 1 ohm in engine and browser |

Common coverage: all nine modules provide Explore, Experiment and Challenge modes; dynamic numerical questions; progressive hints; post-attempt worked explanations; reset, units, physical limits and concise teaching notes. Numeric entry and keyboard controls provide alternatives to dragging. Notes describe idealizations and scope limits.
