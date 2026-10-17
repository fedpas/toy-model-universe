# Update: step 3 of "More equations" — Maxwell meets Dirac, from n = 1 upward

New files: CouplingSection.jsx, couplingCopy.js, couplingData.js, couplingSelfcheckSource.js, selfcheck/coupling_selfcheck.py + coupling.json,
selfcheck/coupling_matrix_check.py + coupling_matrix.json, test_coupling.mjs, test_coupling_ui.mjs.
Changed: EquationsSection.jsx (renders step 3, 4 nav links), equationsCopy.js (tally row, nonlinear note), storyCopy.js, lib/chatPersona.js, test_persona.mjs (length cap 14,400), test_equations.mjs, layout_check.mjs.

Run: `python3 selfcheck/coupling_selfcheck.py --compare selfcheck/coupling.json` (stdlib), `python3 selfcheck/coupling_matrix_check.py --compare selfcheck/coupling_matrix.json` (numpy), `node test_coupling.mjs`.
Open, as stated on the page: sign and size of the source term (no action principle rebuilt); no charged form at n = 1, 2; what the extra components of psi do from n = 5; nothing selects three generations.
