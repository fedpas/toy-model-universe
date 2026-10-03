# Update: step 5 of "More equations" — matter charged under so(m)

New: MatterSection.jsx, matterCopy.js, matterData.js, matterSelfcheckSource.js, selfcheck/matter_selfcheck.py + matter.json,
selfcheck/matter_matrix_check.py (needs matter_selfcheck.py beside it) + matter_matrix.json, test_matter.mjs, test_matter_ui.mjs.
Changed: EquationsSection.jsx (6 nav links), equationsCopy.js (tally row 6), storyCopy.js, lib/chatPersona.js, test_persona.mjs (length cap 17,800), and the earlier equation/UI tests (nav and tally counts).

Run: `python3 selfcheck/matter_selfcheck.py --compare selfcheck/matter.json` (stdlib, ~20 s), `python3 selfcheck/matter_matrix_check.py --compare selfcheck/matter_matrix.json` (numpy), `node test_matter.mjs`.
Open, as stated on the page: g and the sign of the source (no action), which representation the model uses, chirality, solutions.
