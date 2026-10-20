#!/bin/sh
# rebuild spring.json (exact) and the two modules the page imports from it
cd /home/claude/out/selfcheck && python3 spring_selfcheck.py --write spring.json | tail -2 && python3 spring_selfcheck.py --compare spring.json | tail -1
cd /home/claude/out && python3 - <<'PY'
import json
d=json.load(open('selfcheck/spring.json'))
open('springData.js','w').write('export default '+json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
open('springSelfcheckSource.js','w').write('export const SPR_PY = '+json.dumps(open('selfcheck/spring_selfcheck.py').read(),ensure_ascii=False)+';\n')
PY
mkdir -p /home/claude/ui/selfcheck && cp selfcheck/spring* /home/claude/ui/selfcheck/
