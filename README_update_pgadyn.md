# Update: step 13, "A rigid body: from the segment to the tesseract", and the benchmark of the label claims

**Step 13** (equations page, after step 12; 13 numbered steps now, 14 tally rows)
Ladder, each rung with three views (mechanics / the cube / the algebra) and a live widget, EN and IT, three audiences:
segment (n=1) -> square (n=2) -> the cube with its own labels (n=3) -> a body hung from a spring under gravity (1 to 3 bodies, n=1..4, damping) -> the frame table (n=1..6) ->
later rungs from the ganja.js repository examples: the free top, the Moon, the Sun and five planets.
Setting: PGA R(n,0,1) on the bit rule (generator 0 = null e0, bit 0); motors = even blades = the vertices of the n-cube; M' = -MB/2, B' = A^-1(F + [B, A(B)]/2) (Dorst and De Keninck, standard).
Gravity, a Hooke spring (the join of two points), damping and Newton's law are forces in the same equation.

New files: RigidSection.jsx, RigidWidgets.jsx, RigidWidgets2.jsx, rigidCopy.js, rigidRows.js (56 rows EN/IT), pgaEngine.js (the floating-point engine the widgets run),
pgadynData.js, pgadynSelfcheckSource.js, ganjaFixtureData.js (generated), benchKernels.js, benchData.js (generated), selfcheck/pgadyn_selfcheck.py, selfcheck/pgadyn.json,
selfcheck/ganja_fixture.json, selfcheck/ganja_fixture_gen.cjs, selfcheck/bench_labels.mjs, selfcheck/bench_labels.json, selfcheck/regen_pgadyn.sh, selfcheck/regen_bench.sh,
test_pgadyn.mjs (754 checks), test_pgadyn_ui.mjs.

Checks: `python3 selfcheck/pgadyn_selfcheck.py` (110 checks in 56 claims, exact rationals as power series to t^10, standard library only, about 2.5 s), `--row T2`,
`--compare selfcheck/pgadyn.json`. The reference rows R1..R9 run against ganja.js 1.0.189 outputs stored in ganja_fixture.json (dyadic inputs, exact doubles).
The page's engine is also compared with the exact series and with the same fixture by test_pgadyn.mjs; nine deliberate mutations of the engine are all caught.

Status tags: all 110 checks hold. Standard: the equations, Newton, Kepler, Euler's top and the tennis-racket instability, Runge-Kutta 4. Ours: the label readings (the corner label as the address
of a vertex, the frame as n+1 sandwiches, the sign bits for contact, the 2n-vertex outline) and the vertex-mass inertia (arithmetic, not a new law).
Observation, not judged: R8 (the inertia map). Plausibility only: N9 (the planets, see below).

## The benchmark (you asked for one; this is what it says)
The sentence "they follow from linearity of the sandwich, a standard fact, and the bit label is only the addressing; I did not benchmark anything" was right about the first half
and the second half was a gap. Now timed (selfcheck/bench_labels.mjs; node 22.22.0, one noisy 2-core virtual machine, batches of at least 60 ms, median of 7, spread about 5 %):

| claim | n=1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| vertices: direct (2^n sandwiches) / frame (n+1 sandwiches + adds), relative speed | 0.67 | 0.95 | 1.60 | 3.24 | 7.03 | 14.5 |
| mirrored odd half vs frame | - | 0.97 | 0.95 | 0.91 | 0.98 | 0.93 |
| deepest vertex: scan of a table that is already built / n sign bits | 1.27 | 1.31 | 1.86 | 3.38 | 5.75 | 10.1 |
| same, counting the cost of building the table or the frame | 1.15 | 1.10 | 1.11 | 1.08 | 1.05 | 1.04 |
| outline: hull of 2^n points / zonogon of n edges, given data | - | 1.84 | 1.51 | 2.25 | 3.39 | 6.36 |
| same, counting the construction | - | 1.22 | 1.29 | 1.33 | 1.25 | 1.19 |

Reading: the frame costs more than it saves at n=1, ties at n=2 and wins from n=3 (14x at n=6). The mirror trick gains nothing. The sign-bit contact test is much faster in isolation but
negligible once building is counted. The zonogon outline wins 1.2x to 6x. Also measured: one doubling pass (table step alone) beats an n^2-flops-per-vertex matrix by 1.3x to 4.6x for n>=3, but once the frame is included the two totals are not measurably different (0.97 to 1.05x, within the noise).
A second, quick run gave 0.64, 0.92, 1.63, 3.37, 6.94, 14.0x, within about 5 % of the first. Other machines, other engines, other languages are open. Everything here is a measurement,
not a proof; the page says "timed" and shows this table next to a button that times it in the visitor's browser.
Side finding about this engine: allocating a Float64Array of 16 or more doubles costs about 2.3 microseconds against 0.06 for a plain array, so the engine uses plain arrays.
`sh selfcheck/regen_bench.sh` re-times on your machine and rewrites bench_labels.json and benchData.js (about a minute).

## What the page does not do (also stated on the page, the Map and in the Ask persona)
Collision impulses, constraints and joints, friction, an action principle, a spring network with vector displacements (its zero modes should be the rigid motions; open), more than six bodies.
The planets are the repository example's own printed table (JPL, 16 January 2018, could not be reached from here): the semi-major axes agree within 0.2 % (worst 0.107 %) and the
total momentum of the six bodies is 0.102 of the sum of m|v|, so it is a plausibility check and not a verification. One Euler step leaves the motor group (M M~ = 1 + (hb/2)^2) and the Moon widget shows it. The versor condition fails by one equation at n=5 (17 needed, 16 given): a statement about that check.

## Wiring (changed)
steps.js (13 equation steps, nav name), EquationsSection.jsx, equationsCopy.js (tally row, note: Fourteen rows, last four steps), storyCopy.js (equations page, map "before"), audienceCopy.js (short readings),
lib/chatPersona.js (step 13, benchmark, limits; limit raised to 28500 characters), mapData.js / mapCopy.js (new branch `rigid`; the planned `next_rigid` is done and replaced by `next_network`,
a spring network with vector displacements; 15 + 9 scripts; stats 604 . 60 . 110), springCopy.js (step 12 now points to step 13), MapSection.jsx, build.sh.
Tests changed: nav 14, "STEP k OF 13", tally positions, map counts (24 scripts), persona, audience ids.
Dependencies: `test_findings.mjs` and `test_spin.mjs` compile the page's LaTeX with `katex` (`npm install katex`); everything else in the data tests needs only node, and the check scripts need only python3.
Run: `node test_pgadyn.mjs`, then (after `sh /home/claude/ui/build.sh`) `node test_pgadyn_ui.mjs`, `node test_i18n_audit.mjs` and the other `test_*_ui.mjs`.
