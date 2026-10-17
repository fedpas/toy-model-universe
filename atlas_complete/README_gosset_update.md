# Atlas update: More shapes (orthoplex, demicube, Gosset series)

NEW
- selfcheck/gosset_selfcheck.py + gosset.json : Cartan E3..E10, roots by reflection, Gosset polytopes by Weyl orbit, vertex figures by graph isomorphism, E8 coordinates (112 + 128), E6 x A2 classes, Coxeter plane, D_n^+ glue norm.  `python3 gosset_selfcheck.py --compare gosset.json`
- src/GossetSection.jsx, gossetCopy.js (EN/IT), gossetData.js, gossetSelfcheckSource.js
- tests/test_gosset.mjs (independent JS recomputation), tests/layout_check.mjs (4 widths x 2 languages), tests/test_shapes_ui.mjs
UPDATED
- src/ShapesSection.jsx (step 3 wired in, tables scroll on phones, Maxwell diagram keeps readable size), shapesCopy.js (pointers to step 3), storyCopy.js (page text EN/IT), lib/chatPersona.js (+ Gosset paragraph; story now lists the Gosset series), tests/test_persona.mjs
- selfcheck/shapes_selfcheck.py + shapes.json, src/shapes*.js and tests/test_shapes.mjs (unchanged logic, included for completeness)
EARLIER THIS SESSION (included)
- orthoplex/ (ladder, equations, drawings), family_test.py + family_results.json
STATUS VOCABULARY: checked / standard / ours / open.  The stop at E8 vs period 8 is marked a resemblance (open); no shape selects three generations.
Run from the folder holding the src files: node tests/test_gosset.mjs, node tests/test_shapes.mjs, node tests/test_persona.mjs (persona test needs lib/chatPersona.js next to it).

NOTE: this is the COMPLETE package (every project file in /home/claude/out, no .bak files). GenesisCanvas.jsx and SimplexCanvas.jsx are copied from the build mirror; they are your files, unchanged.
