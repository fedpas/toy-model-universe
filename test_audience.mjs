import { SHORT, FOLD, level } from './audienceCopy.js';
import G from './gravityData.js';
import EQ from './equationsData.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const EQIDS = ['comm', 'dirac', 'coupling', 'ym', 'matter', 'grav1', 'grav2', 'mirrors', 'projective', 'forque', 'spin', 'spring', 'rigid'];
// every section lede and every page introduction has a short reading too
const IDS = [...EQIDS.slice(0, 9), 'maxwell', 'dictionary', 'threegen', 'findings', 'orth', 'demi', 'gosset', 'tally', ...['rule', 'atlas', 'maxwell', 'furey', 'shapes', 'equations', 'map', 'ask'].map(p => 'page_' + p), 'forque', 'spin', 'spring', 'rigid'];
ok(level('Young Learner') === 0 && level('Physicist') === 1 && level('Mathematician') === 2, 'levels');
ok(Object.keys(FOLD.en).join() === Object.keys(FOLD.it).join(), 'fold labels');
for (const lang of ['en', 'it']) {
  ok(Object.keys(SHORT[lang]).join() === IDS.join(), `${lang}: ids`);
  for (const id of IDS) { const v = SHORT[lang][id]; ok(v.length === 2 && v.every(x => typeof x === 'string' && x.length > 60), `${lang} ${id}: two readings`); ok(v[0].length < 330, `${lang} ${id}: the learner reading is short (${v[0].length})`); ok(v[1].length < 460, `${lang} ${id}: the physicist reading is short (${v[1].length})`); }
  const all = JSON.stringify(SHORT[lang]);
  ok(!/undefined|NaN|\[object/.test(all), `${lang} placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|terms|blades)\b/]) ok(!b.test(all), `${lang} banned ${b}`);
}
// the numbers in the readings agree with the data
ok(G.gv.ladder[4].riemann_independent === 20 && /20 in four dimensions/.test(SHORT.en.grav1[0]) && /20 a n = 4|20 in quattro/.test(SHORT.it.grav1[1] + SHORT.it.grav1[0]), 'Riemann count 20 at n = 4');
ok(/40 incidences/.test(SHORT.en.dirac[1]) && /40 incidenze/.test(SHORT.it.dirac[1]), 'Dirac incidences');
ok(JSON.stringify(EQ.eq.dirac).includes('40'), 'the data has the Dirac incidence count');
ok(/n = 3/.test(SHORT.en.coupling[1]), 'complex structure from n = 3');
for (const id of ['coupling', 'ym', 'matter', 'grav2']) ok(/Open|Aperti?/.test(SHORT.en[id][1] + SHORT.it[id][1]), `${id}: the physicist reading says what is open`);
for (const id of ['coupling', 'ym', 'matter', 'grav1', 'grav2']) ok(!/(?<!not )\bsolv/i.test(SHORT.en[id][0].replace(/we (do not|build no) /gi, '')) || /do not|no solutions|open/i.test(SHORT.en[id][0]), `${id}: the learner reading does not imply solutions`);
console.log(bad ? bad + ' FAILURES' : 'ALL AUDIENCE TESTS PASS'); process.exit(bad ? 1 : 0);
