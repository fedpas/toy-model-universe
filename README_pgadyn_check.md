# Rigid bodies on the bit rule: the exact check and the timing of the label claims (the data behind step 13)

Files (all in `selfcheck/`):
- `pgadyn_selfcheck.py`: exact rational arithmetic, standard library only. `python3 pgadyn_selfcheck.py` runs 110 checks in 56 claims (about 2.5 s);
  `--row T2` prints one claim; `--write pgadyn.json` / `--compare pgadyn.json` write / compare the data (it is deterministic).
- `ganja_fixture.json`: outputs of ganja.js 1.0.189 (the library of the Dorst and De Keninck listings) for dimensions 1..4, dyadic inputs, so every double is exact.
- `ganja_fixture_gen.cjs`: regenerates the fixture (needs `ganja.js` next to it; MIT licence, not included).
- `bench_labels.mjs`: times the label claims (node 22; `--quick` for a 15 s run, `--write bench_labels.json`); `bench_labels.json` is the run reported in the app.
  It imports `../benchKernels.js` (the same kernels the app's Timing tab runs).
- `regen_pgadyn.sh`, `regen_bench.sh`: rebuild pgadyn.json and the generated modules / re-time on this machine.

What the claims are (ids): A the labels and the motor group (A7: motor counts, and the versor condition that falls one equation short at n = 5); B the segment (n=1); C the square (n=2);
D the printed 3D formulas; E the same equations for n = 1..4 (invariants, gravity, Hooke, damping, the hung body, exact series); F inertia from the vertex masses of step 12;
G the bit labels as an address (G1 frame of n+1 sandwiches, G2 the mirror, G3 contact vertex from sign bits, G4 the 2n-vertex outline, G5 the frame table); N Newton, Runge-Kutta 4 (points stay points),
the Euler step that leaves the motor group, Kepler, the Moon, and the planets (N9: plausibility only); T the free top (tennis racket: mu = b^2 (Ic-Ia)(Ia-Ib)/(Ib Ic));
R reference runs against the library (R8 is an observation about the inertia map, stated and not judged).

Standard (not ours): the equations M' = -M B/2, B' = A^-1(F + [B, A(B)]/2), Hooke, gravity, damping (Dorst and De Keninck; Gunn), Newton, Kepler, Euler's top.
Ours: the label readings in A and G, and the vertex-mass inertia in F (arithmetic, not a new law).
Not checked: collision response (impulses), constraints and joints, friction, any action principle, the planets against JPL (unreachable from here).
Timing is not part of the proof: the label claims G1–G4 (the ones timed) are exact; bench_labels.mjs only measures how much the labels save on one machine (14x at n=6 for the frame, no gain for the mirrored half, negligible for sign-bit contact once building is counted).
