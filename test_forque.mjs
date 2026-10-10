import fs from 'fs';
import katex from 'katex';
import K from './forqueData.js';
import COPY, { rowText, convText, ids } from './forqueCopy.js';
import { ROWS_IT, CONV_IT } from './forqueRowsIt.js';
import { FQ_PY, FQM_PY } from './forqueSelfcheckSource.js';
import { uni } from './forqueTex.js';
import { simulate, predictedRate } from './forquePhysics.js';
import EQC from './equationsCopy.js';
import { SHORT } from './audienceCopy.js';
import { STEP_GROUPS, eqNavIds, stepEyebrow, stepCount } from './steps.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// ---- 1. data, scripts and counts agree
const J = JSON.parse(fs.readFileSync('./selfcheck/forque.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/forque_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.fq) && JSON.stringify(JM) === JSON.stringify(K.fqm), 'data module equals the json files');
ok(FQ_PY === fs.readFileSync('./selfcheck/forque_selfcheck.py', 'utf8') && FQM_PY === fs.readFileSync('./selfcheck/forque_matrix_check.py', 'utf8'), 'embedded scripts equal the files');
ok(/--compare/.test(FQ_PY) && /--row/.test(FQ_PY) && /ALL NUMERIC CHECKS PASS/.test(FQM_PY), 'scripts have the advertised switches');
const rows = K.fq.rows, C = K.fq.counts;
ok(rows.length === 41 && ids.join() === Array.from({ length: 41 }, (_, i) => 'F' + String(i).padStart(2, '0')).join(), 'rows F00..F40 in order');
ok(C.rows === rows.length && C.ok === rows.filter(r => r.status === 'ok').length && C.note === rows.filter(r => r.status === 'note').length && C.not_checked === rows.filter(r => r.status === 'not checked').length && C.ok + C.note + C.not_checked === C.rows, 'counts equal the rows');
ok(rows.every(r => ['ok', 'note', 'not checked'].includes(r.status)), 'status vocabulary');
ok(rows.filter(r => r.status !== 'not checked').every(r => r.paper && r.ours && r.how && r.ref && r.page > 0), 'checked rows have paper, ours, how, ref, page');
ok(rows.filter(r => r.status === 'note').every(r => r.note.length > 40) && rows.filter(r => r.status === 'not checked').every(r => r.note), 'every note is written');
ok(K.fq.findings.length === C.note + C.remarks && K.fq.findings.every(f => rows.some(r => r.id === f.id)), 'findings = noted rows + remarks');
ok(rows.filter(r => r.status !== 'not checked').every(r => r.code), 'every checked row has a one-line check');
// each one-line check must also be in the downloadable script, so an author can find it there
for (const r of rows.filter(r => r.code)) ok(FQ_PY.includes(r.code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')) || FQ_PY.includes(r.code), `one-line check of ${r.id} is in the script`);
ok(JM.free_top.ok && JM.gravity_top.ok && JM.conservation.ok && JM.spherical_top.ok && JM.symmetric_top.ok && JM.tennis_racket.ok && JM.representation.ok, 'numpy flags');
ok(Object.values(JM.negative_controls).every(v => v.fails_as_expected), 'numpy negative controls fail as they must');
ok(K.fq.atlas_signature.law_of_motion_holds === true, 'law of motion with space squares -1');

// ---- 2. every equation compiles in KaTeX and renders to Unicode with nothing left over
const tex = []; for (const r of rows.filter(r => r.status !== 'not checked')) tex.push([r.id + ' paper', r.paper], [r.id + ' ours', r.ours]);
for (const l of ['en', 'it']) for (const x of COPY[l].f.lines) tex.push([`line ${x.h}`, x.tex]);
for (const [w, s] of tex) { try { katex.renderToString(s, { throwOnError: true }); } catch (e) { ok(false, `katex ${w}: ${e.message}`); } const u = uni(s); ok(u && !/[\\{}?]/.test(u), `unicode of ${w} has leftovers: ${u}`); }
ok(uni(String.raw`\dot M=-\tfrac12M\mathbb B_b`).normalize('NFD').includes('Ṁ'.normalize('NFD')) && uni(String.raw`\dot M=-\tfrac12M\mathbb B_b`).includes('½') && uni(String.raw`\mathbb B_b`) === '𝔹_b', 'unicode renderer on a known line');

// ---- 3. Italian covers every row, convention and line
for (const r of rows.filter(r => r.status === 'not checked')) { ok(!/\\/.test(r.paper) && ROWS_IT[r.id].paper && rowText('it', r).paper === ROWS_IT[r.id].paper && rowText('en', r).paper === r.paper, `the not-checked row ${r.id} has a plain-text description in both languages`); }
for (const r of rows) { const en = rowText('en', r), it = rowText('it', r); for (const k of ['how', 'note', 'remark']) if (en[k]) ok(it[k] && (it[k] !== en[k] || !/[a-z]{4,}/.test(en[k])), `Italian ${k} for ${r.id}`); else ok(!it[k], `no stray Italian ${k} for ${r.id}`); }
ok(Object.keys(ROWS_IT).every(i => ids.includes(i)) && CONV_IT.length === K.fq.conventions.length, 'Italian keys match the rows and conventions');
K.fq.conventions.forEach((c, i) => { const v = convText('it', c, i); ok(v.ours && v.note && v.theirs && v.note !== c.note, `Italian convention ${i}`); });
for (const l of ['en', 'it']) { const t = COPY[l].f; ok(t.lines.length === 4 && t.lines.every(x => x.rows.every(i => ids.includes(i))) && t.open.length === 5 && t.convCols.length === 3 && Object.keys(t.filters).length === 4, `${l} copy shape`); ok(typeof t.racketOut(simulate([5, 3, 1]))[0] === 'string', `${l} racket text`); }
ok(Object.keys(COPY.en.f.labels).join() === Object.keys(COPY.it.f.labels).join() && Object.keys(COPY.en.f).join() === Object.keys(COPY.it.f).join(), 'English and Italian have the same keys');
ok(SHORT.en.forque[1].includes(`${C.rows} equations`) && SHORT.en.forque[1].includes(`${C.ok} agree`) && SHORT.it.forque[1].includes(`${C.rows} equazioni`) && SHORT.it.forque[1].includes(`${C.not_checked} non verificate`), 'the short readings quote the current counts');
ok(eqNavIds().length === STEP_GROUPS.eq.length + 1 && STEP_GROUPS.eq.at(-4) === 'forque' && EQC.en.t.rows.length === eqNavIds().length && EQC.it.t.rows.length === eqNavIds().length && EQC.en.t.rows.at(-4)[1].startsWith('step 10') && EQC.it.t.rows.at(-4)[1].startsWith('passo 10'), 'tally and navigation have the Forque step');
ok(EQC.en.t.rows.at(-4)[3].includes(`${C.ok} agree exactly`) && /Fourteen rows/.test(EQC.en.t.note) && /Quattordici righe/.test(EQC.it.t.note), 'tally counts and the written number of rows');
ok(stepEyebrow('en', 'eq', 'forque') === `STEP 10 OF ${stepCount('eq')} · FORQUE: FORCE AND TORQUE AS ONE LINE` && stepEyebrow('it', 'eq', 'comm').startsWith(`PASSO 1 DI ${stepCount('eq')} · `), 'eyebrow of the new step');

ok(/ForqueSection/.test(fs.readFileSync('./EquationsSection.jsx', 'utf8')) && /eq-forque/.test(fs.readFileSync('./ForqueSection.jsx', 'utf8')), 'section wired into the page');
// ---- 4. an independent bit-mask Clifford algebra in JS: free rigid body with the paper's equations (Pdot = F = 0 means the world momentum stays constant)
const SQ = [0, 1, 1, 1];
const cm = (a, b) => { let sw = 0; for (let j = 0; j < 4; j++) if (b >> j & 1) for (let i = j + 1; i < 4; i++) if (a >> i & 1) sw++; let s = sw % 2 ? -1 : 1; const c = a & b; for (let j = 0; j < 4; j++) if (c >> j & 1) s *= SQ[j]; return [a ^ b, s]; };
const clean = r => { for (const [k, v] of [...r]) if (Math.abs(v) < 1e-14) r.delete(k); return r; };
const mul = (A, B) => { const r = new Map(); for (const [a, x] of A) for (const [b, y] of B) { const [m, s] = cm(a, b); if (s) r.set(m, (r.get(m) || 0) + s * x * y); } return clean(r); };
const add = (A, B, c = 1) => { const r = new Map(A); for (const [m, v] of B) r.set(m, (r.get(m) || 0) + c * v); return clean(r); };
const scale = (A, c) => new Map([...A].map(([m, v]) => [m, v * c]));
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const rev = A => new Map([...A].map(([m, v]) => { const g = pc(m); return [m, g * (g - 1) / 2 % 2 ? -v : v]; }));
const comm = (A, B) => scale(add(mul(A, B), mul(B, A), -1), 0.5);
const sgnOf = (a, b) => { let sw = 0; for (let j = 0; j < 4; j++) if (b >> j & 1) for (let i = j + 1; i < 4; i++) if (a >> i & 1) sw++; return sw % 2 ? -1 : 1; };
const wedge = (A, B) => { const r = new Map(); for (const [a, x] of A) for (const [b, y] of B) if (!(a & b)) r.set(a | b, (r.get(a | b) || 0) + sgnOf(a, b) * x * y); return clean(r); };
const star = A => new Map([...A].map(([m, v]) => [15 ^ m, v * sgnOf(15 ^ m, m)]));          // (star B) ^ B = I
const istar = A => new Map([...A].map(([c, v]) => [15 ^ c, v * sgnOf(c, 15 ^ c)]));         // inverse of the signed complement
const join = (A, B) => istar(wedge(star(A), star(B)));
const O = new Map([[14, 1]]), I = mul(new Map([[1, 1]]), O), vec = q => new Map(q.map((x, i) => [2 << i, x]).filter(([, x]) => x));
// calibration against the four values the paper states
ok(star(O).get(1) === 1 && star(mul(vec([1, 0, 0]), I)).get(2) === 1, 'star calibration: *O = eps, *(qI) = q');
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 - 0.5;
const pts = Array.from({ length: 5 }, () => ({ m: 1 + Math.abs(rnd()) * 2, x: [rnd() * 2, rnd() * 2, rnd() * 2] }));
const point = x => add(O, mul(vec(x), I));
const MB = [3, 5, 9, 6, 10, 12];                                                           // eps e1, eps e2, eps e3, e12, e13, e23
const toMV = c => new Map(MB.map((m, i) => [m, c[i]]).filter(([, x]) => x)), fromMV = A => { for (const m of A.keys()) if (!MB.includes(m)) throw new Error('not a bivector: ' + m); return MB.map(m => A.get(m) || 0); };
const Idef = (Bm, P) => P.reduce((acc, p) => { const X = point(p.x); return add(acc, scale(join(X, comm(X, Bm)), p.m)); }, new Map());
const body = pts;
const Mx = MB.map((_, k) => fromMV(Idef(toMV(MB.map((_, j) => (j === k ? 1 : 0))), body)));  // columns of the inertia map
const mv = (Mat, v) => Mat[0].map((_, i) => Mat.reduce((s, col, k) => s + col[i] * v[k], 0));
const solve = (A6, y) => { const n = 6, a = A6.map((row, i) => [...row, y[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r; [a[c], a[p]] = [a[p], a[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = a[r][c] / a[c][c]; for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k]; } } return a.map((row, i) => row[n] / row[i]); };
const Icols = Mx, Imat = Icols[0].map((_, i) => Icols.map(col => col[i]));                    // Imat[i][k]
ok(Math.max(...Imat.flat().map(Math.abs)) > 0.1, 'the inertia map is not trivial');
const Iof = c => mv(Icols, c), Iinv = y => solve(Imat, y);
const worldP = (M, Bb) => { const Bw = mul(mul(M, toMV(Bb)), rev(M)); return fromMV(body.reduce((acc, p) => { const X = mul(mul(M, point(p.x)), rev(M)); return add(acc, scale(join(X, comm(X, Bw)), p.m)); }, new Map())); };
const kinetic = Bb => { const J = join(toMV(Bb), toMV(Iof(Bb))); return 0.5 * (J.get(0) || 0); };
function run(withCoriolis, T = 3, dt = 0.005) {
  let Bb = [0.3, -0.2, 0.5, 0.9, 0.4, -0.6], M = new Map([[0, 1]]);
  const f = (M, B) => ({ dM: scale(mul(M, toMV(B)), -0.5), dB: withCoriolis ? Iinv(fromMV(comm(toMV(B), toMV(Iof(B))))) : B.map(() => 0) });
  const P0 = worldP(M, Bb), T0 = kinetic(Bb); let dP = 0, dT = 0;
  for (let s = 0; s < T / dt; s++) {
    const a = f(M, Bb), M2 = add(M, a.dM, dt / 2), B2 = Bb.map((x, i) => x + dt / 2 * a.dB[i]), b = f(M2, B2), M3 = add(M, b.dM, dt / 2), B3 = Bb.map((x, i) => x + dt / 2 * b.dB[i]), c = f(M3, B3), M4 = add(M, c.dM, dt), B4 = Bb.map((x, i) => x + dt * c.dB[i]), d = f(M4, B4);
    M = add(M, add(add(a.dM, b.dM, 2), add(c.dM, d.dM, 2), 1).size ? add(add(add(a.dM, scale(b.dM, 2)), scale(c.dM, 2)), d.dM) : new Map(), dt / 6);
    Bb = Bb.map((x, i) => x + dt / 6 * (a.dB[i] + 2 * b.dB[i] + 2 * c.dB[i] + d.dB[i]));
    if (s % 40 === 0) { dP = Math.max(dP, Math.hypot(...worldP(M, Bb).map((x, i) => x - P0[i]))); dT = Math.max(dT, Math.abs(kinetic(Bb) - T0)); }
  }
  const MM = mul(M, rev(M)); return { dP, dT, unit: Math.abs((MM.get(0) || 0) - 1), P0: Math.hypot(...P0) };
}
const good = run(true), wrong = run(false);
ok(good.P0 > 0.1 && good.dP < 1e-6 && good.dT < 1e-6 && good.unit < 1e-6, `free body: world momentum constant (${good.dP.toExponential(1)}), kinetic energy constant (${good.dT.toExponential(1)}), M M~ = 1 (${good.unit.toExponential(1)})`);
ok(wrong.dP > 1e-2, `without the Coriolis term the momentum is NOT constant (${wrong.dP.toExponential(1)})`);
console.log(`  JS bit-algebra twin: drift ${good.dP.toExponential(1)} against ${wrong.dP.toExponential(1)} without the term`);

// ---- 5. the tennis-racket demo
for (const I of [[5, 3, 1], [3, 5, 1], [2, 1.5, 1], [10, 9, 1], [4, 2.5, 0.5], [7, 6, 5]]) { const r = simulate(I); ok(r.measured !== null && near(r.measured, predictedRate(I), 0.01), `racket ${I}: rate ${r.measured} vs ${predictedRate(I)}`); ok(r.energyDrift < 1e-9 && r.momentumDrift < 1e-9, `racket ${I}: conserved`); }
{ const r = simulate([2, 2, 1]); ok(r.lam === 0 && r.measured === null && r.energyDrift < 1e-12, 'a symmetric top has no middle axis'); }
ok(near(predictedRate([5, 3, 1]), JM.tennis_racket.predicted_rate, 1e-12), 'the page and the numpy script predict the same rate');
console.log(bad ? bad + ' FAILURES' : 'ALL FORQUE TESTS PASS'); process.exit(bad ? 1 : 0);
