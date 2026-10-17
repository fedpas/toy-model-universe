# Update: step 10 (Forque dynamics, with a translation matrix for the authors) and the language / audience sweep

## Step 10
New: ForqueSection.jsx, forqueCopy.js (EN/IT), forqueRowsIt.js (Italian text of every row), forqueData.js, forqueSelfcheckSource.js, forqueTex.js (LaTeX → Unicode for the equations), forquePhysics.js (tennis-racket demo), selfcheck/forque_selfcheck.py + forque.json (standard library, ~3 s), selfcheck/forque_matrix_check.py + forque_matrix.json (numpy, ~20 s), test_forque.mjs, test_forque_ui.mjs.

The page is a translation matrix of Dorst and De Keninck, "May the Forque Be with You" (v2.6, https://bivector.net): 41 rows, each with the paper's equation, ours on the bit rule, the page and section, a one-line check, a worked instance, how it was checked, and a note. 27 agree exactly, 9 agree after a noted correction (printed lines that read differently, listed neutrally for the authors; any may be our error), 5 are not checked and say why. The page can download the list of differing lines as a text file for the authors.

Run: `python3 selfcheck/forque_selfcheck.py --compare selfcheck/forque.json`; one row: `python3 selfcheck/forque_selfcheck.py --row F20`; `python3 selfcheck/forque_matrix_check.py`; `node test_forque.mjs`.
Test_forque.mjs also recomputes the free-body dynamics in an independent JavaScript bit algebra (world momentum stays constant; without the Coriolis term it does not), compiles every equation with KaTeX, and checks that the Italian text covers every row.

Not checked / open (stated on the page): the Lagrangian form 2.38, constrained motion 2.9, the code figures, exp/log closed forms, the exercises; conformal dynamics (the paper has none); the other authors on this subject were not read.

## "STEP k OF N" and the language / audience sweep
- steps.js is the single list of steps. Every eyebrow is derived: "STEP 4 OF 10 · YANG–MILLS" / "PASSO 4 DI 10 · …" (equations, 10 steps), "STEP 2 OF 3" (shapes). The story pages say "PAGE 6 OF 7" so the word step is used only for the numbered steps. The navigation chips, the written numbers in the story text ("ten steps"), the tally note ("Eleven rows") and the page copy are generated from the same lists; the hand-written numbers were removed from the copy files.
- Short readings (learner, physicist; the mathematician reads the full text, the full text is one click away on the others) now exist for every section lede (Maxwell, dictionary, three generations, findings, orthoplex, demicube, Gosset, tally, Forque) and for the seven page introductions, EN and IT.
- Stale text fixed: the equations page introduction (stopped at step 9), the "Ask" page's "two more equations", the shapes page's "next: two more equations", the tally note ("Ten rows"), the Maxwell convention line (English inside the Italian page), the control bar and chat labels (Presentation matrix, LANGUAGE, AUDIENCE, METRIC, LENS, profile names, Space+/Time+, GENESIS profile).
- test_i18n_audit.mjs renders 7 pages × EN/IT × 3 audiences and checks: numbering and totals, introductions differ by audience, no English prose in the Italian pages (heuristic, with an allow-list for file names and proper names), localised controls, and no hand-written step number in any copy file. It writes i18n_audit_report.md: the text blocks that are identical in EN and IT (all are notation, commands and names).

Changed: App.jsx, StoryShell.jsx (+ Fold.jsx reused), EquationsSection.jsx, all section files and *Copy.js files (eyebrows and nav removed), storyCopy.js, audienceCopy.js, equationsCopy.js, MaxwellSection.jsx, lib/chatPersona.js (cap 21,500 characters; forque layer; repeated sentence removed), build.sh, and the nav/tally counts (10 → 11) and profile buttons (data-profile) in the earlier tests.
