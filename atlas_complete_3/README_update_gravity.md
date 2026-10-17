# Update: steps 6 and 7 of "More equations" — gravity

New: GravitySection.jsx (two sections), gravityCopy.js, gravityData.js, gravitySelfcheckSource.js, selfcheck/gravity_selfcheck.py + gravity.json,
selfcheck/gravity_matrix_check.py (needs gravity_selfcheck.py and gravity.json beside it) + gravity_matrix.json, test_gravity.mjs, test_gravity_ui.mjs.
Changed: EquationsSection.jsx (8 nav links), equationsCopy.js (tally rows 7 and 8), storyCopy.js, lib/chatPersona.js (older bullets compressed; prompt 17.4k characters, cap 17,800), test_persona.mjs, layout_check.mjs, and the earlier equation/UI tests (nav and tally counts).

Run: `python3 selfcheck/gravity_selfcheck.py --compare selfcheck/gravity.json` (stdlib, ~12 s), `python3 selfcheck/gravity_matrix_check.py --compare selfcheck/gravity_matrix.json` (numpy), `node test_gravity.mjs`.
Open, as stated on the page: the coupling kappa and the source sign (no action), solving T = 0 for omega, any solution or metric, whether this is the gravity of the model, the Dirac equation on a curved tetrad.

## Audience levels on the equations page
The page now follows the Learner / Physics / Math switch. New: Fold.jsx, audienceCopy.js (short readings, EN/IT), test_audience.mjs, test_audience_ui.mjs.
Learner and Physics read a short version of each step's introduction (the full text is one click away); Math reads the full text. Folded by default: Learner = everything except the picture, its controls and the open items; Physics = also the views and identities are open; Math = all open.
Open items and the pictures are never folded. Changed: EquationsSection.jsx (takes `profile`), App.jsx (passes it), the five section components, build.sh copy list.
