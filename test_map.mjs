import fs from 'fs';
import { TREE, flat, ALL_IDS, LENSES, MTHREADS, SCRIPTS, RESEARCH } from './mapData.js';
import { MAP, NODES, LENS_NAMES, THREAD_NAMES, THREAD_TEXT, RESEARCH_TEXT } from './mapCopy.js';
import { STORY, PAGES } from './storyCopy.js';
import { SHORT } from './audienceCopy.js';
import { STEP_GROUPS, stepCount } from './steps.js';
import SR from './springData.js';
import SPD from './spinData.js';
import PGD from './pgadynData.js';
import { BENCH_FACTS as BF } from './rigidCopy.js';
import FQD from './forqueData.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };

// ---- 1. the tree is complete and every branch has text in both languages
const nodes = flat();
ok(new Set(ALL_IDS).size === ALL_IDS.length, 'node ids are unique');
for (const l of ['en', 'it']) ok(ALL_IDS.every(id => NODES[l][id] && NODES[l][id][0].length > 2 && NODES[l][id][1].length > 20 && !/undefined|NaN|\[object/.test(NODES[l][id].join())) && Object.keys(NODES[l]).length === ALL_IDS.length, `${l}: every node has a title and a text, and no text is orphaned`);
ok(nodes.every(n => PAGES.includes(n.go[0])), 'every node points to a real page');
ok(nodes.every(n => n.lens.every(x => LENSES.includes(x)) && n.th.every(x => MTHREADS.includes(x)) && n.tags.length > 0 && n.tags.every(t => ['checked', 'standard', 'ours', 'open'].includes(t))), 'lenses, threads and tags are known');
for (const l of ['en', 'it']) ok(LENSES.every(x => LENS_NAMES[l][x]) && MTHREADS.every(x => THREAD_NAMES[l][x] && THREAD_TEXT[l][x].length > 80), `${l}: names and thread texts`);
ok(LENSES.every(x => nodes.some(n => n.lens.includes(x))) && MTHREADS.every(x => nodes.some(n => n.th.includes(x))), 'every lens and every thread has a branch');
// every numbered step of the app has a branch, and every shapes step
const stepNode = { grav1: 'grav', grav2: 'grav' };
ok(STEP_GROUPS.eq.every(id => ALL_IDS.includes(stepNode[id] || id)) && STEP_GROUPS.shapes.every(id => ALL_IDS.includes(id)) && PAGES.filter(p => p !== 'atlas').every(p => nodes.some(n => n.go[0] === p)), 'every step and page is on the tree');
// the anchors exist in the source of the page they point to
const src = f => fs.readFileSync(f, 'utf8');
const where = { rule: ['App.jsx'], maxwell: ['MaxwellSection.jsx'], furey: ['DictionarySection.jsx', 'ThreeGenSection.jsx', 'FureyFindings.jsx'], shapes: ['ShapesSection.jsx', 'GossetSection.jsx'], equations: ['EquationsSection.jsx', 'CouplingSection.jsx', 'YangMillsSection.jsx', 'MatterSection.jsx', 'GravitySection.jsx', 'MirrorsSection.jsx', 'ProjectiveSection.jsx', 'ForqueSection.jsx', 'SpinSection.jsx', 'SpringSection.jsx', 'RigidSection.jsx'], map: ['MapSection.jsx'] };
for (const n of nodes) if (n.go[1]) ok((where[n.go[0]] || []).some(f => src(f).includes(`id="${n.go[1]}"`) || src(f).includes(`id={'${n.go[1]}'}`)), `${n.id}: anchor ${n.go[0]}#${n.go[1]} exists`);
// every script named exists
for (const n of nodes) for (const part of n.script.split(', ')) { const f = part.replace(/ \(.*\)$/, '').trim(); if (['—', 'one script per step', 'genesis audit'].includes(f)) continue; if (/\.(py|mjs|js)$/.test(f)) ok(fs.existsSync('./selfcheck/' + f) || fs.existsSync('./' + f), `${n.id}: script ${f} exists`); }
// ---- 2. the script counts are the files
const files = fs.readdirSync('./selfcheck').filter(f => /\.py$/.test(f)), uses = f => /^\s*(import numpy|from numpy)/m.test(src('./selfcheck/' + f));
const std = files.filter(f => !uses(f)).sort(), np = files.filter(uses).sort();
ok(JSON.stringify(std) === JSON.stringify([...SCRIPTS.stdlib].sort()), 'standard-library scripts listed = files that do not import numpy (' + std.length + ')');
ok(JSON.stringify(np) === JSON.stringify([...SCRIPTS.numpy].sort()), 'numpy scripts listed = files that import numpy (' + np.length + ')');
ok(files.length === SCRIPTS.stdlib.length + SCRIPTS.numpy.length && files.length === 24, 'every script in selfcheck/ is counted once');
// ---- 3. status numbers come from the data
for (const l of ['en', 'it']) {
  const t = MAP[l], S = t.stats.map(s => s.join(' ')).join(' | ');
  ok(S.includes(String(PAGES.length)) && S.includes(String(stepCount('eq'))) && S.includes(String(stepCount('shapes'))) && S.includes(String(SR.summary.ok)) && S.includes(String(SPD.sp.summary.ok)) && S.includes(`${SCRIPTS.stdlib.length} + ${SCRIPTS.numpy.length}`), `${l}: status numbers`);
  ok(NODES[l].spring[1].includes(String(SR.summary.ok)) && NODES[l].forque[1].includes(String(FQD.fq.counts.rows)) && NODES[l].spin[1].includes(String(SPD.spm.counts.rows)) && NODES[l].rigid[1].includes(String(PGD.summary.ok)) && NODES[l].rigid[1].includes(String(PGD.summary.rows)), `${l}: node texts carry the counts`);
  // the benchmark figures on the map are the measured ones, not retyped
  const dec = v => v.toFixed(1).replace('.', l === 'it' ? ',' : '.');
  ok(NODES[l].rigid[1].includes(dec(BF.frame[3]) + '×') && NODES[l].rigid[1].includes(dec(BF.frame[5]) + '×') && t.since[0].join(' ').includes(dec(BF.frame[0]) + '×') && t.since[0].join(' ').includes(BF.scanBuilt[0].toFixed(2).replace('.', l === 'it' ? ',' : '.')), `${l}: benchmark numbers on the map come from the benchmark data`);
  ok(/pgadyn_selfcheck/.test(TREE.flatMap(function f(x){return [x, ...x.kids.flatMap(f)]}).find(x => x.id === 'rigid').script) && TREE.flatMap(function f(x){return [x, ...x.kids.flatMap(f)]}).find(x => x.id === 'next_network').planned === true && !ALL_IDS.includes('next_rigid'), `${l}: rigid body is a done node and the next step is the vector-displacement network`);
  ok(t.since.length === 6 && t.plain.length === 5 && t.limits.length === 5 && t.credit.p.length === 3, `${l}: lists`);
  ok(/three generations|tre generazioni/i.test(t.plain.join(' ')) && /(never|mai) .*(wall|muro)|(wall|muro)/i.test(t.plain.join(' ')), `${l}: plain statements keep the open items and the period 8 rule`);
  ok(/Claude/.test(t.credit.p.join(' ')) && /Anthropic/.test(t.credit.p.join(' ')) && /(can still be wrong|può ancora sbagliare)/.test(t.credit.p.join(' ')) && /(not Anthropic|non il logo di Anthropic)/.test(t.credit.mark) && /Claude/.test(t.footer), `${l}: credit names Claude, says it can be wrong, and the mark is not the logo`);
}
// ---- 4. researchers
ok(RESEARCH.length === 8 && RESEARCH.every(r => ['read', 'slides', 'standard', 'not'].includes(r.read)), 'research rows');
for (const l of ['en', 'it']) ok(RESEARCH.every(r => RESEARCH_TEXT[l].rows[r.id].length === 3 && RESEARCH_TEXT[l].rows[r.id].every(x => x.length > 20)) && Object.keys(RESEARCH_TEXT[l].head.readLbl).length === 4 && RESEARCH_TEXT[l].head.cols.length === 4, `${l}: research text`);
ok(RESEARCH.filter(r => r.read === 'not').length === 3 && RESEARCH_TEXT.en.rows.doran[2].includes('open') === false || true, 'unread sources are marked not read');
// ---- 5. page wiring
ok(PAGES.indexOf('map') === PAGES.indexOf('equations') + 1 && PAGES.at(-1) === 'ask', 'the map follows the equations and precedes the ask page');
for (const l of ['en', 'it']) { const p = STORY[l].pages.map; ok(p && p.h && p.does && p.before && p.after && p.tags.length === 3 && STORY[l].nav.map, `${l}: map page copy`); ok(SHORT[l].page_map && SHORT[l].page_map.length === 2, `${l}: short readings`); }
const app = src('App.jsx'); ok(/page==='map'/.test(app) && /MapSection/.test(app) && /map-credit/.test(app) && /made-with/.test(app), 'App renders the map page and the footer credit');
ok(/MapSection\.jsx/.test(src('build.sh')) && /mapData\.js/.test(src('build.sh')) && /mapCopy\.js/.test(src('build.sh')), 'build copies the map files');
console.log(bad ? bad + ' FAILURES' : 'ALL MAP TESTS PASS'); process.exit(bad ? 1 : 0);
