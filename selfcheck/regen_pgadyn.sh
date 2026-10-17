#!/bin/sh
# rebuild pgadyn.json (exact) and the three modules the page imports from it (run from anywhere)
set -e
cd "$(dirname "$0")"
python3 pgadyn_selfcheck.py --write pgadyn.json | tail -2 && python3 pgadyn_selfcheck.py --compare pgadyn.json | tail -1
cd ..
python3 - <<'PY'
import json
d=json.load(open('selfcheck/pgadyn.json'))
open('pgadynData.js','w').write('export default '+json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
open('ganjaFixtureData.js','w').write('export default '+json.dumps(json.load(open('selfcheck/ganja_fixture.json')),separators=(',',':'))+';\n')
open('pgadynSelfcheckSource.js','w').write('export const PGA_PY = '+json.dumps(open('selfcheck/pgadyn_selfcheck.py').read(),ensure_ascii=False)+';\n')
PY
# the build mirror used while developing this app, if it exists
if [ -d /home/claude/ui ]; then mkdir -p /home/claude/ui/selfcheck && cp selfcheck/pgadyn* selfcheck/ganja_fixture* /home/claude/ui/selfcheck/; fi
