# Update: step 11 (pointors and the three kinds of i), a paper and a lecture woven by subject

New: SpinSection.jsx, SpinWidgets.jsx (eight live widgets), spinEngine.js (bit-rule Clifford engine for them), spinCopy.js (EN/IT), spinRowsIt.js (Italian text of every row), spinData.js, spinSelfcheckSource.js, selfcheck/spin_selfcheck.py + spin.json (standard library, a few seconds), selfcheck/regen_spin.sh, test_spin.mjs, test_spin_ui.mjs. forqueTex.js (LaTeX → Unicode) gained the symbols of this step.

Sources: Roelfs, Eelbode, De Keninck, "From Invariant Decomposition to Spinors" v1.1 (arXiv 2401.01142), read in full; David Eelbode's GAME23 lecture "Rotors and Spinors", read from its slides only (screenshots; the video was not watched). The page is arranged by subject, not by source: six threads (reflections and the double cover; labels; what is i; spinor spaces; pointors; states and phases). Each thread shows the paper's view, the lecture's view and ours, then its rows of the translation matrix (paper equation | lecture equation | ours), then live widgets. The connecting thread is four kinds of i: (scalar,1-vector), (scalar,2-vector), (1-vector,1-vector), and the central pseudoscalar of odd dimension.

30 rows: 22 agree exactly, 2 agree after a noted correction (Theorem 2 needs one common rotor; Theorem 3 needs the odd part P = vR), 6 not checked and say why. Our readings that tie the sources together (⊞ identification, left/right/conjugation label, self-dual code, XOR 9 chirality) are marked as ours.

Run: `python3 selfcheck/spin_selfcheck.py` (604 exact claims), `--compare selfcheck/spin.json`, `--row S08`; `sh selfcheck/regen_spin.sh` rebuilds spin.json, spinData.js, spinSelfcheckSource.js; `node test_spin.mjs`, `node test_spin_ui.mjs`.

Changed: steps.js (11 equation steps), EquationsSection.jsx, equationsCopy.js (tally row 12), audienceCopy.js (spin readings), storyCopy.js, lib/chatPersona.js (spin paragraph; cap 24,000), build.sh, and the nav/tally/eyebrow counts (11 → 12 links, 10 → 11 steps) in the earlier tests.
