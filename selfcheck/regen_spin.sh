#!/bin/sh
# rebuild spin.json (exact) and the two modules the page imports from it
cd /home/claude/out/selfcheck && python3 spin_selfcheck.py --write spin.json | tail -2 && python3 spin_selfcheck.py --compare spin.json | tail -1
cd /home/claude/out && python3 - <<'PY'
import json
d=json.load(open('selfcheck/spin.json')); m=d.pop('matrix')
open('spinData.js','w').write('export default '+json.dumps({'sp':d,'spm':m},ensure_ascii=False,separators=(',',':'))+'\n')
open('spinSelfcheckSource.js','w').write('export const SP_PY = '+json.dumps(open('selfcheck/spin_selfcheck.py').read(),ensure_ascii=False)+';\n')
PY
cp selfcheck/spin* /home/claude/ui/selfcheck/
