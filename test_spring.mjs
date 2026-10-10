import fs from 'fs';
import { execSync } from 'child_process';
import K from './springData.js';
import { SPR_PY } from './springSelfcheckSource.js';
import COPY, { rowText, rowIds, ROW_META, CONTROLS, THREADS } from './springCopy.js';
import * as S from './springEngine.js';
import { labelRow } from './springEngine.js';
import EQC from './equationsCopy.js';
import { SHORT } from './audienceCopy.js';
import { STORY } from './storyCopy.js';
import { STEP_GROUPS, eqNavIds, stepEyebrow, stepCount } from './steps.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));

// ---- 1. data, script and counts agree
const J = JSON.parse(fs.readFileSync('./selfcheck/spring.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K), 'data module equals spring.json');
ok(SPR_PY === fs.readFileSync('./selfcheck/spring_selfcheck.py', 'utf8'), 'embedded script equals the file');
ok(/--compare/.test(SPR_PY) && /--row/.test(SPR_PY) && /ALL SPRING CHECKS PASS/.test(SPR_PY), 'script has the advertised switches');
ok(/standard library/.test(SPR_PY) && !/import numpy|from numpy/.test(SPR_PY), 'script is standard library only');
const run = a => execSync('python3 selfcheck/spring_selfcheck.py ' + a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
ok(/ALL SPRING CHECKS PASS/.test(run('')) && /data == rebuilt data/.test(run('--compare selfcheck/spring.json')), 'script passes and data equals the rebuilt data');
ok(/4\/4 checks hold/.test(run('--row D5')) && /rows are A1/.test((() => { try { run('--row ZZ'); return ''; } catch (e) { return String(e.stderr || e.message); } })()), '--row runs one row and refuses an unknown one');
ok(K.summary.ok === K.summary.rows && K.summary.rows === K.rows.reduce((s, r) => s + r.checks, 0) && K.rows.every(r => r.ok), 'summary equals the sum of the rows');

// ---- 2. rows, threads and copy
ok(rowIds.length === 22 && rowIds.join() === 'A1,A2,A3,A4,B1,B2,B3,B4,B5,B6,B7,B8,C1,C2,C3,C4,D1,D2,D3,D4,D5,E1', 'rows A1..E1');
ok(rowIds.every(id => ROW_META[id] && THREADS.includes(ROW_META[id][0]) && ['standard', 'ours'].includes(ROW_META[id][1])), 'every row has a thread and a source');
ok(THREADS.every(t => rowIds.some(id => ROW_META[id][0] === t)), 'every thread has rows');
ok(CONTROLS.join() === 'A4,B8,C3' && CONTROLS.every(id => rowIds.includes(id)), 'three negative controls');
for (const id of rowIds) for (const lang of ['en', 'it']) { const r = rowText(lang, id); ok(r.claim.length > 25 && r.inst.length > 8 && !/undefined|NaN|\[object/.test(r.claim + r.inst), `${lang} ${id}: row text`); }
ok(rowIds.every(id => rowText('en', id).claim !== rowText('it', id).claim), 'Italian row texts differ from English');
const shape = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? shape(v, p + k + '.') : [p + k + (typeof v === 'function' ? '()' : Array.isArray(v) ? '[' + v.length + ']' : '')]));
ok(shape(COPY.en.s).join() === shape(COPY.it.s).join(), 'English and Italian copy have the same shape');
for (const lang of ['en', 'it']) {
  const t = COPY[lang].s, W = t.w;
  ok(t.ladder.length === 4 && THREADS.every(id => t.threads[id].h.length > 12 && ['q', 'which', 'mech', 'cube', 'alg'].every(k => t.threads[id][k].length > 30)), `${lang} threads complete`);
  const samples = [W.osc.sig(1, -1, 1), W.osc.law('−4'), W.osc.val('1', '2'), W.osc.energy('13'), W.cube.modeInfo('101', 2, 4, 3), W.cube.pluckInfo('101'), W.cube.econs('1.5', '1.5'), W.spec.plainLine(5, '0, 2', '1, 4'), W.spec.signedLine(2, '2', '6', 8), W.spec.trace(16, 16, '64', '64', 64), W.face.counts(8, 12, 6), W.face.faceTitle('12@000'), W.face.flux(6, '−1'), W.lab.head('0011', 2, W.lab.evenWord), W.lab.mode('0011', 4, false), W.lab.mode('0111', 2, true), t.mxCount(3, 22)];
  ok(samples.every(x => typeof x === 'string' && x.length > 3 && !/undefined|NaN|\[object|\$\{/.test(x)), `${lang} widget strings`);
  ok(t.open.some(([k]) => k === 'open') && t.open.some(([k, x]) => k === 'standard' && /Huang/.test(x)) && t.open.some(([k, x]) => k === 'ours' && /π/.test(x)), `${lang} says what is open, standard and ours`);
  ok(/scalar|scalar/i.test(t.open.find(([k]) => k === 'open')[1]) || /scalare/.test(t.open.find(([k]) => k === 'open')[1]), `${lang} states the scalar-displacement limit`);
  ok(/60|exact|esatt/.test(t.lede) && t.lede.includes(String(K.summary.ok)) && t.mxLede.includes(String(K.summary.ok)), `${lang} counts come from the data`);
}

// ---- 3. the engine, recomputed independently of the script
const L = n => { const N = 1 << n; return Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? n : 0) - (S.verts(n).includes(i ^ j) && [1, 2, 4, 8, 16].includes(i ^ j) ? 1 : 0))); };
const mv = (A, v) => A.map(r => r.reduce((s, a, k) => s + a * v[k], 0));
for (const n of [2, 3, 4, 5]) {
  const c = S.counts(n), d = K.cube[n];
  ok(c.V === d.V && c.E === d.E && c.F === d.F && d.euler === d.V - d.E + d.F && d.betti[0] === 1 && d.betti[1] === 0, `n=${n}: counts and Betti numbers`);
  ok(Object.entries(d.modes).every(([j, m]) => m === S.binom(n, +j)) && Object.values(d.modes).reduce((a, b) => a + b, 0) === 1 << n, `n=${n}: multiplicities are binomials`);
  const Ln = L(n); let eig = true; for (let s = 0; s < 1 << n; s++) { const w = S.verts(n).map(x => S.walsh(s, x)), Lw = mv(Ln, w); if (!Lw.every((v, i) => near(v, 2 * S.omega2(s) / 2 * w[i]))) eig = false; }
  ok(eig, `n=${n}: every Walsh vector is a mode with omega^2 = 2|s|`);
  const ch = S.signedChecks(n); ok(ch.sym && ch.dsq && ch.tr === 0 && ch.quad && ch.flux.length === c.F && ch.flux.every(h => h === -1), `n=${n}: signed network D^2 = nI, flux -1 on every face`);
  const sl = S.signedLevels(n), pl = S.plainLevels(n);
  ok(sl.length === 2 && sl[0].mult === 1 << (n - 1) && near(sl[0].w2 + sl[1].w2, 2 * n) && near(sl[1].w2 - sl[0].w2, 2 * Math.sqrt(n)) && K.clifford[n].multiplicity_each === sl[0].mult && K.clifford[n].plain_levels === pl.length && K.clifford[n].frequencies_squared === `${n} +- sqrt(${n})`, `n=${n}: Clifford levels agree with the data`);
  const tr = a => a.reduce((s, l) => s + l.w2 * l.mult, 0); ok(near(tr(pl), n * (1 << n)) && near(tr(sl), n * (1 << n)), `n=${n}: both networks have trace n 2^n`);
  const x = S.randomDisp(n, 7), e = S.signedEnergy(n, x); ok(e.quad === e.edgeSum, `n=${n}: signed matrix is a sum of edge energies`);
  for (const seed of [1, 2, 3]) { const u = S.randomDisp(n, seed); ok(S.faceSums(n, S.stretch(n, u)).every(v => v === 0), `n=${n} seed ${seed}: stretches close up`); }
  if (n >= 3) ok([1, 2, 3, 4].some(seed => S.faceSums(n, S.randomField(n, seed, true)).some(v => v !== 0)), `n=${n}: an arbitrary field does not close`);
}
// motion: the closed forms against the power series x = sum (-L)^j x0 t^2j/(2j)! (float, 40 terms)
const series = (n, x0, v0, t) => { const Ln = L(n); let a = x0.slice(), b = v0.slice(), x = x0.map(() => 0); let f = 1; for (let j = 0; j < 40; j++) { const c = (-1) ** j * t ** (2 * j) / fact(2 * j), c2 = (-1) ** j * t ** (2 * j + 1) / fact(2 * j + 1); x = x.map((v, i) => v + c * a[i] + c2 * b[i]); a = mv(Ln, a); b = mv(Ln, b); } return x; };
function fact(k) { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; }
for (const n of [3, 4]) for (const t of [0.3, 1.1, 2.4]) {
  const v = n === 3 ? 5 : 9, d0 = S.verts(n).map(i => (i === v ? 1 : 0)), z = d0.map(() => 0);
  ok(S.pluck(n, v, t).every((c, i) => near(c, series(n, d0, z, t)[i], 1e-9)), `n=${n} t=${t}: pluck equals the series`);
  const x = S.pluck(n, v, t), xd = S.pluckVel(n, v, t), e = S.springEnergy(n, x) + S.kinetic(xd); ok(near(e, S.springEnergy(n, S.pluck(n, v, 0)), 1e-9), `n=${n} t=${t}: energy conserved`);
  const s = 5 & ((1 << n) - 1), w = S.verts(n).map(i => S.walsh(s, i)); ok(S.mode(n, s, t).every((c, i) => near(c, series(n, w, z, t)[i], 1e-9)), `n=${n} t=${t}: a mode follows cos(sqrt(2|s|) t)`);
}
// the three kinds of i
for (const [kind, B2] of [['harmonic', -1], ['inverted', 1], ['free', 0]]) {
  for (const t of [0, 0.4, 1.3, 2.2]) {
    const o = S.oscillator(kind, 1.5, t, 3, 2), h = 1e-3, p = S.oscillator0(kind, 1.5, t + h, 3, 2).x, m = S.oscillator0(kind, 1.5, t - h, 3, 2).x, d2 = (p - 2 * o.x + m) / (h * h);
    ok(o.Bsq === B2 && Math.abs(d2 - B2 * 2.25 * o.x) < 1e-3 * Math.max(1, Math.abs(o.x)), `${kind} t=${t}: B^2 = ${B2} and x'' = B^2 w^2 x`);
    ok(o.okHalf, `${kind} t=${t}: sandwich with the half angle reproduces the motion`);
    if (t > 0.3) ok(!o.okFull, `${kind} t=${t}: negative control, the full angle does not`);
  }
}
ok(near(S.oscillator('harmonic', 1, 2.7, 3, 2).s2, 13) && S.oscillator('harmonic', 1, 5, 3, 2).s2 === S.oscillator('harmonic', 1, 0, 3, 2).s2 && near(Math.hypot(S.oscillator0('harmonic', 1, 2.7, 3, 2).x, S.oscillator0('harmonic', 1, 2.7, 3, 2).q), Math.sqrt(13)), 'harmonic: s^2 = x^2 + q^2 is constant');
// labels are modes
for (const n of [3, 4]) for (let m = 0; m < 1 << n; m++) { const rows = labelRow(n, m), odd = [...m.toString(2)].filter(c => c === '1').length & 1, star = odd ? ((1 << n) - 1) ^ m : m; ok(rows.every(r => r.ok && r.sign === S.walsh(star, r.x)), `n=${n} m=${m}: the label is the Walsh character of ${star}`); }

// ---- 4. wiring
ok(STEP_GROUPS.eq.at(-2) === 'spring' && STEP_GROUPS.eq.at(-1) === 'rigid' && eqNavIds().at(-3) === 'spring' && eqNavIds().at(-2) === 'rigid' && eqNavIds().at(-1) === 'tally', 'spring is followed by the rigid body, then the tally');
const spRowEn = EQC.en.t.rows.at(-2), spRowIt = EQC.it.t.rows.at(-2);
ok(spRowEn[1].startsWith('step 12') && spRowIt[1].startsWith('passo 12') && spRowEn[3].includes(`${K.summary.ok} exact claims`) && EQC.it.t.rows.length === eqNavIds().length, 'tally has the spring row');
ok(stepEyebrow('en', 'eq', 'spring') === `STEP 12 OF ${stepCount('eq')} · A SPRING ON THE CUBE: VERTICES, EDGES, FACES` && stepEyebrow('it', 'eq', 'spring') === `PASSO 12 DI ${stepCount('eq')} · UNA MOLLA SUL CUBO: VERTICI, SPIGOLI, FACCE`, 'eyebrow');
ok(/SpringSection/.test(fs.readFileSync('./EquationsSection.jsx', 'utf8')) && /SpringSection\.jsx/.test(fs.readFileSync('./build.sh', 'utf8')), 'section wired into the page and the build');
ok(['en', 'it'].every(l => SHORT[l].spring.length === 2 && SHORT[l].spring[1].includes(String(K.summary.ok))), 'short readings exist and carry the count');
ok(/spring network/.test(STORY.en.pages.equations.tags[0][1]) && /rete di molle/.test(STORY.it.pages.equations.tags[0][1]), 'page tags mention the spring');
const persona = fs.readFileSync('./lib/chatPersona.js', 'utf8'); ok(/step 12/.test(persona) && persona.includes('ω²=2j') && /Map page|page 7/.test(persona) && /Claude/.test(persona), 'persona knows step 12, the map and the credit');
console.log(bad ? bad + ' FAILURES' : 'ALL SPRING TESTS PASS'); process.exit(bad ? 1 : 0);
