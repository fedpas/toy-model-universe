import fs from 'fs';
import { execSync } from 'child_process';
import K from './pgadynData.js';
import FIX from './ganjaFixtureData.js';
import BENCH from './benchData.js';
import { PGA_PY } from './pgadynSelfcheckSource.js';
import COPY, { rowText, rowIds, ROW_META, CONTROLS, STATUS, THREADS, BENCH_FACTS } from './rigidCopy.js';
import { ROWS } from './rigidRows.js';
import * as P from './pgaEngine.js';
import { checkAll, runBench } from './benchKernels.js';
import EQC from './equationsCopy.js';
import { SHORT } from './audienceCopy.js';
import { STORY } from './storyCopy.js';
import { STEP_GROUPS, eqNavIds, stepEyebrow, stepCount, STEP_NAMES, NAV_NAMES } from './steps.js';
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; console.log('FAIL', m); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
const fr = s => { const [a, b] = String(s).split('/'); return Number(a) / Number(b || 1); };       // an exact fraction string as a double
// a small deterministic generator, so a failure can be reproduced
let seed = 20261003; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }, rr = (a, b) => a + (b - a) * rnd();
const { alg, pc } = P;

// ---- 1. the data, the script, the fixture and the benchmark file agree
const J = JSON.parse(fs.readFileSync('./selfcheck/pgadyn.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K), 'data module equals pgadyn.json');
ok(PGA_PY === fs.readFileSync('./selfcheck/pgadyn_selfcheck.py', 'utf8'), 'embedded script equals the file');
ok(/--compare/.test(PGA_PY) && /--row/.test(PGA_PY) && /ALL RIGID-BODY CHECKS PASS/.test(PGA_PY), 'script has the advertised switches');
ok(/standard library/.test(PGA_PY) && !/import numpy|from numpy/.test(PGA_PY), 'script is standard library only');
ok(JSON.stringify(JSON.parse(fs.readFileSync('./selfcheck/ganja_fixture.json', 'utf8'))) === JSON.stringify(FIX), 'fixture module equals ganja_fixture.json');
const BJ = JSON.parse(fs.readFileSync('./selfcheck/bench_labels.json', 'utf8')); ok(JSON.stringify(BJ) === JSON.stringify(BENCH), 'benchData.js equals bench_labels.json');
const run = a => execSync('python3 pgadyn_selfcheck.py ' + a, { encoding: 'utf8', cwd: './selfcheck', stdio: ['ignore', 'pipe', 'pipe'] });
ok(/ALL RIGID-BODY CHECKS PASS/.test(run('')) && /data == rebuilt data/.test(run('--compare pgadyn.json')), 'script passes and data equals the rebuilt data');
ok(/3\/3 checks hold/.test(run('--row E11')) && /rows are A1/.test((() => { try { run('--row ZZ'); return ''; } catch (e) { return String(e.stderr || e.message); } })()), '--row runs one row and refuses an unknown one');
ok(K.summary.ok === K.summary.checks && K.summary.checks === K.rows.reduce((s, r) => s + r.checks, 0) && K.rows.length === K.summary.rows && K.rows.every(r => r.ok), 'summary equals the sum of the rows');
ok(K.summary.rows === 56 && K.summary.checks === 110, 'the page speaks of 56 rows and 110 claims');
ok(/ganja_fixture\.json/.test(PGA_PY), 'the reference rows read the fixture next to the script');

// ---- 2. rows, threads and copy
const idsData = K.rows.map(r => r.id).sort();
ok(rowIds.length === 56 && JSON.stringify([...rowIds].sort()) === JSON.stringify(idsData) && Object.keys(ROWS).sort().join() === idsData.join() && Object.keys(ROW_META).sort().join() === idsData.join(), 'rows: data, texts and metadata list the same 56 ids');
ok(rowIds.every(id => THREADS.includes(ROW_META[id][0]) && ['standard', 'ours'].includes(ROW_META[id][1])), 'every row has a thread and a source');
ok(THREADS.every(t => rowIds.some(id => ROW_META[id][0] === t)), 'every thread has rows');
ok(THREADS.join() === 'segment,square,cube,hang,frame,top,orbits', 'seven rungs in order');
ok(CONTROLS.length === 10 && CONTROLS.every(id => rowIds.includes(id)), 'ten negative controls');
ok(Object.keys(STATUS).every(id => rowIds.includes(id)) && Object.entries(STATUS).filter(([, v]) => v === 'ref').length === 8 && STATUS.N9 === 'plaus' && STATUS.R8 === 'obs', 'status badges: reference, plausibility, observation');
ok(rowIds.every(id => ['en', 'it'].every(l => { const t = rowText(l, id); return t.claim.length > 40 && t.inst.length > 8; })), 'every row has a claim and a how-it-is-checked in both languages');
ok(rowIds.every(id => rowText('en', id).claim !== rowText('it', id).claim), 'no Italian row equals the English one');
const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, p + k + '.') : [p + k + (typeof v === 'function' ? '()' + v.length : '')]));
const kEn = keys(COPY.en.s).sort(), kIt = keys(COPY.it.s).sort(); ok(JSON.stringify(kEn) === JSON.stringify(kIt), 'English and Italian copy have the same keys and the same function arities ' + kEn.filter(k => !kIt.includes(k)).concat(kIt.filter(k => !kEn.includes(k))).join(' '));
for (const l of ['en', 'it']) {
  const t = COPY[l].s; ok(THREADS.every(id => ['h', 'q', 'which', 'mech', 'cube', 'alg'].every(f => typeof t.threads[id][f] === 'string' && t.threads[id][f].length > (f === 'h' ? 8 : 30))), l + ': thread texts');
  ok(t.ladder.length === 7 && t.open.length === 6 && t.open.every(([k, x]) => ['checked', 'standard', 'ours', 'open'].includes(k) && x.length > 40), l + ': ladder and open list');
  ok(t.lede.includes(String(K.summary.ok)) && t.lede.includes(String(K.summary.rows)) && t.mxLede.includes(String(K.summary.rows)) && t.num.includes(String(K.summary.ok)), l + ': counts in the text come from the data');
  ok(Object.keys(t.w).sort().join() === 'hang,lab,orb,seg,sq,table,top', l + ': widget copy blocks');
  const dec = l === 'it' ? ',' : '.';
  ok(t.threads.orbits.mech.includes(K.moon.e.replace('.', dec)) && t.threads.orbits.alg.includes(K.planets.worst_a_error.replace('.', dec).replace('%', ' %')), l + ': moon and planet numbers in the text equal the data');
  ok(t.threads.frame.alg.includes(BENCH.machine.date) && t.threads.frame.alg.includes(BENCH.machine.cpu), l + ': the benchmark paragraph names its machine and date');
}
// the sentences about speed must stay true to the numbers they cite (re-running the benchmark may change them: then the text has to be revised)
const BF = BENCH_FACTS; ok(BF.frame[0] <= 1.05 && BF.frame[1] <= 1.1 && BF.frame[2] > 1.2 && BF.frame[5] > BF.frame[3] && BF.frame[3] > BF.frame[2], 'speed text: frame is no gain at n = 1, 2 and grows from n = 3');
ok(BF.mirror[1] <= 1.05, 'speed text: the mirror trick gains nothing'); ok(BF.scanBuilt[1] < 1.5 && BF.scanGiven[1] > 2, 'speed text: sign bits gain a lot on a given table and little with building');
ok(BF.hullBuilt[0] > 1 && BF.hullBuilt[1] < 2, 'speed text: the zonogon gains modestly with building');
ok(BENCH.rows.length === 6 && BENCH.rows.every(r => ['direct', 'frame', 'matrix', 'doubling', 'matrixGiven', 'scan', 'bits', 'scanBuilt', 'bitsBuilt'].every(k => r.ns[k].med > 0)), 'benchData has the six sizes and every timing');
ok(BENCH.machine.cpu && BENCH.machine.cores >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(BENCH.machine.date), 'benchData names its machine');

// ---- 3. the counts of the frame table from the engine's own blade lists
const C = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); };
for (let n = 1; n <= 5; n++) {
  const A = alg(n), T = K.frame_table[String(n)];
  ok(A.EVEN.length === T.motor_coefficients && T.motor_coefficients === 1 << n && T.vertices === 1 << n, `n=${n}: motor coefficients are the vertices`);
  ok(A.BIV.length === T.bivector_components && T.bivector_components === n * (n + 1) / 2 && T.group_dimension === n * (n + 1) / 2, `n=${n}: bivector components and group dimension`);
  ok(A.FRC.length === T.force_components && T.force_components === C(n + 1, n - 1), `n=${n}: force components are the grade n-1 blades`);
  ok(A.EVEN.filter(m => pc(m) === 0 || pc(m) === 4).length === T.norm_equations && T.norm_equations === 1 + C(n + 1, 4), `n=${n}: the equations of M M~ = 1`);
  ok(T.edges === n * 2 ** (n - 1) && T.sandwiches_direct === 2 ** n && T.sandwiches_frame === n + 1 && T.additions === 2 ** n - 1 && T.outline_vertices === 2 * n, `n=${n}: edges, sandwiches, additions, outline`);
  ok(T.integration_numbers === 2 ** n + n * (n + 1) / 2 && T.solution_numbers === n * (n + 1) && (T.norm_ok === (T.norm_equations === T.vertices - T.group_dimension)) && (n < 5 ? T.norm_ok : !T.norm_ok), `n=${n}: integration and solution numbers; the norm equations suffice up to n = 4`);
  ok(P.edgeList(n).length === T.edges, `n=${n}: edgeList`);
}
for (let n = 1; n <= 4; n++) { const b = K.bit_labels[String(n)]; ok(b.sandwiches_direct === 2 ** n && b.sandwiches_frame === n + 1 && b.additions === 2 ** n - 1 && b.edges === n * 2 ** (n - 1), `n=${n}: bit_labels counts`); }
// the labels: even blade <-> vertex, e0 present exactly when the weight is odd
for (let n = 1; n <= 5; n++) { const A = alg(n); const ev = A.EVEN.map(m => m >> 1).sort((a, b) => a - b); ok(ev.join() === [...Array(1 << n).keys()].join() && A.EVEN.every(m => (m & 1) === (pc(m >> 1) & 1)), `n=${n}: the label of the even blades`); }
{ const tab = K.labels.A3; ok(tab.length === 8 && tab.every(t => { const v = parseInt(t.vertex, 2); return t.has_e0 === ((pc(v) & 1) === 1); }), 'A3 table: e0 exactly at odd weight'); }

// ---- 4. the engine against the exact statements
const ones = A => P.unitC(A), blank = A => A.z();
// a motor from random plane angles and a translation, and a random velocity
const randMotor = A => { const n = A.n, planes = []; for (let i = 1; i < n; i++) planes.push([i, i + 1, rr(-3, 3)]); if (n >= 3) planes.push([1, 3, rr(-3, 3)]); return A.motor(Array.from({ length: n }, () => rr(-2, 2)), planes); };
const randB = A => { const B = A.z(); for (const m of A.BIV) B[m] = rr(-1.5, 1.5); return B; };
for (let n = 1; n <= 4; n++) {
  const A = alg(n), M = randMotor(A);
  ok(A.normErr(M) < 1e-12, `n=${n}: a motor from planes and translation has M M~ = 1`);
  const X = A.mul(M, A.rev(M), A.EVEN, A.EVEN); ok(A.EVEN.every(m => near(X[m], m === 0 ? 1 : 0, 1e-12) || pc(m) === 4), `n=${n}: M M~ has only grade 0 and 4 parts (A4)`);
  const t = Array.from({ length: n }, () => rr(-2, 2)), x = Array.from({ length: n }, () => rr(-2, 2)), T = A.trans(t), Q = A.sand(T, A.point(x));       // A6: the translator moves by +t, the weight stays 1
  ok(A.pos(Q).every((v, i) => near(v, x[i] + t[i], 1e-12)) && near(A.weight(Q), 1, 1e-12), `n=${n}: the translator moves a point by +t (A6)`);
  if (n >= 2) { const R = A.rotPlane(1, 2, 0.7), y = A.pos(A.sand(R, A.point(x))); ok(near(Math.hypot(...y), Math.hypot(...x), 1e-12) && near(y[0], x[0] * Math.cos(0.7) + x[1] * Math.sin(0.7), 1e-12) || near(y[0], x[0] * Math.cos(0.7) - x[1] * Math.sin(0.7), 1e-12), `n=${n}: a rotor turns a point about the origin and keeps the radius (A6)`); }
  const O = A.pos(A.sand(A.motor(t, []), A.point(new Array(n).fill(0)))); ok(O.every((v, i) => near(v, t[i], 1e-12)), `n=${n}: M carries the origin to t (A6)`);
}
{ const A = alg(3);       // A5: the scalar part of R R~ sums the squares on the even vertices; the e0123 part pairs every vertex with its COMPLEMENT (000 with 111, 001 with 110, ...)
  const r = A.z(); for (const m of A.EVEN) r[m] = rr(-2, 2); const S = A.mul(r, A.rev(r), A.EVEN, A.EVEN), base = S[0b1111];
  ok(near(S[0], A.EVEN.filter(m => !(m & 1)).reduce((s2, m) => s2 + r[m] * r[m], 0), 1e-12), 'A5: the scalar part sums the squares on the even vertices');
  ok(A.EVEN.every(m => { const r3 = r.slice(); r3[m] += 1; const up = A.mul(r3, A.rev(r3), A.EVEN, A.EVEN)[0b1111] - base; r3[m] -= 2; const dn = A.mul(r3, A.rev(r3), A.EVEN, A.EVEN)[0b1111] - base, g = (up - dn) / 2, v = m >> 1, c = 7 ^ v, mc = (c << 1) | (pc(c) & 1); return near(Math.abs(g), Math.abs(2 * r[mc]), 1e-9); }), 'A5: the e0123 part answers to the coefficient of the vertex v through the coefficient of its complement 7 ^ v');
  ok(A.EVEN.some(m => { const v = m >> 1, c = 6 ^ v, mc = (c << 1) | (pc(c) & 1); const r3 = r.slice(); r3[m] += 1; const up = A.mul(r3, A.rev(r3), A.EVEN, A.EVEN)[0b1111] - base; r3[m] -= 2; const dn = A.mul(r3, A.rev(r3), A.EVEN, A.EVEN)[0b1111] - base; return Math.abs(Math.abs((up - dn) / 2) - Math.abs(2 * r[mc])) > 1e-6; }), 'A5: a pairing that is not the complement (6 ^ v) fails (negative control)'); }
// B3: the exact series of the segment with one spring against the engine at a small step
{ const A = alg(1), c = ones(A), F = P.hangForce(A, { g: 0, m: 1, k: 4, alpha: 0, pb: [0], anchor: [0.5] }); let st = { M: A.trans([2]), B: A.z() }; const h = 0.002; const ser = K.segment.B3.series.map(fr);
  for (const t of [0.3, 0.45]) { st = { M: A.trans([2]), B: A.z() }; for (let i = 0; i < Math.round(t / h); i++) st = P.stepRK4(A, st, c, F, h); const x = A.pos(A.sand(st.M, A.point([0])))[0], xs = ser.reduce((s, a, k) => s + a * t ** k, 0); ok(near(x, xs, 1e-8), `B3: the segment vertex at t=${t}: engine ${x}, exact series through t^10 ${xs}`); ok(near(x, 0.5 + 1.5 * Math.cos(2 * t), 1e-9), `B3: and the cosine ${0.5 + 1.5 * Math.cos(2 * t)}`); }
  const F2 = P.hangForce(A, { g: 0, m: 1, k: -4, alpha: 0, pb: [0], anchor: [0.5] }); st = { M: A.trans([2]), B: A.z() }; for (let i = 0; i < 300; i++) st = P.stepRK4(A, st, c, F2, h); const xa = A.pos(A.sand(st.M, A.point([0])))[0]; ok(near(xa, 0.5 + 1.5 * Math.cosh(2 * 0.6), 1e-7), 'B4: with -k the vertex follows cosh 2t, got ' + xa);
  st = { M: A.trans([2]), B: A.z() }; st.B[3] = 1.5; const F0 = P.hangForce(A, { g: 0, m: 1, k: 0, alpha: 0, pb: [0], anchor: [0] }); for (let i = 0; i < 300; i++) st = P.stepRK4(A, st, c, F0, h); ok(near(A.pos(A.sand(st.M, A.point([0])))[0], 2 + 1.5 * 0.6, 1e-9), 'B2: with no force the position is x0 + b t'); }
// C1 and the Euler term: the square keeps b12 and the world momentum and the body-frame velocity turns at -b12
{ const A = alg(2), c = ones(A); let st = { M: A.motor([0, 0], []), B: A.z() }; st.B[0b011] = 1; st.B[0b101] = 0.5; st.B[0b110] = 1.5; const P0 = A.sand(st.M, A.Amap(st.B, c)), a0 = Math.atan2(st.B[0b101], st.B[0b011]); const h = 0.005; let T = 0;
  for (let i = 0; i < 400; i++) { st = P.stepRK4(A, st, c, null, h); T += h; } const P1 = A.sand(st.M, A.Amap(st.B, c));
  ok(P0.every((v, i) => near(v, P1[i], 1e-9)), 'C1: the world momentum is constant'); ok(near(st.B[0b110], 1.5, 1e-12), 'C1: the rotation rate is constant');
  const wrap = x => Math.atan2(Math.sin(x), Math.cos(x)); let d = wrap(Math.atan2(st.B[0b101], st.B[0b011]) - a0); ok(near(d, wrap(-1.5 * T), 1e-6), `C1: the body-frame velocity turns by -b12 t (${d} against ${wrap(-1.5 * T)})`);
  ok(K.square.rate === 2, 'C1 data: rate 2'); }
// E1-E3, D3: the free Euler equation conserves the world momentum, the energy and M M~
for (const n of [2, 3, 4]) { const A = alg(n), c = A.z(); for (const m of A.BIV) c[m] = rr(0.5, 3); let st = { M: randMotor(A), B: randB(A) }; const W0 = A.sand(st.M, A.Amap(st.B, c)), E0 = P.kinetic(A, st.B, c);
  for (let i = 0; i < 200; i++) st = P.stepRK4(A, st, c, null, 0.005); const W1 = A.sand(st.M, A.Amap(st.B, c)); ok(W0.every((v, i) => near(v, W1[i], 1e-7)), `n=${n}: free flow keeps M A(B) M~ (E2)`); ok(near(E0, P.kinetic(A, st.B, c), 1e-7), `n=${n}: free flow keeps the kinetic energy (E3)`); ok(A.normErr(st.M) < 1e-12, `n=${n}: M M~ stays 1 (E1)`); }
// the Euler term of the engine is the standard Euler equation of rigid-body rotation under omega = (B23, -B13, B12)
{ const A = alg(3); for (let t = 0; t < 5; t++) { const I = [rr(0.4, 2), rr(0.4, 2), rr(0.4, 2)], c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1 : 0; c[0b1100] = I[0]; c[0b1010] = I[1]; c[0b0110] = I[2]; const B = A.z(); B[0b1100] = rr(-1, 1); B[0b1010] = rr(-1, 1); B[0b0110] = rr(-1, 1);
    const dBe = A.dB(B, c), w = [B[0b1100], -B[0b1010], B[0b0110]], Iw = w.map((x, i) => I[i] * x), cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], std = cr(Iw, w).map((x, i) => x / I[i]);
    ok(near(dBe[0b1100], std[0], 1e-12) && near(-dBe[0b1010], std[1], 1e-12) && near(dBe[0b0110], std[2], 1e-12), 'the engine Euler term is I dw/dt = (I w) x w (D3)'); } }
// E4, E5: gravity and Hooke conserve K + U for any body point and any anchor, in 1 to 4 dimensions; E10: damping removes energy at the predicted rate
for (const n of [1, 2, 3, 4]) { const A = alg(n), c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1.5 : rr(0.4, 1.4); const p = { g: 2, m: 1.5, k: 3, alpha: 0, pb: Array.from({ length: n }, () => rr(-0.7, 0.7)), anchor: Array.from({ length: n }, () => rr(-1, 1)) }, F = P.hangForce(A, p);
  let st = { M: randMotor(A), B: randB(A) }; const E0 = P.hangEnergy(A, st, c, p).E; for (let i = 0; i < 300; i++) st = P.stepRK4(A, st, c, F, 0.002); ok(near(P.hangEnergy(A, st, c, p).E, E0, 1e-6), `n=${n}: gravity + Hooke conserve the energy (E4, E5)`);
  const q = { ...p, alpha: 0.4 }, Fd = P.hangForce(A, q); st = { M: randMotor(A), B: randB(A) }; const Ed0 = P.hangEnergy(A, st, c, q).E; for (let i = 0; i < 300; i++) st = P.stepRK4(A, st, c, Fd, 0.002); ok(P.hangEnergy(A, st, c, q).E < Ed0 - 1e-4, `n=${n}: damping removes energy (E10)`); }
// E7: free fall of a spinning body; E8: a spring from the centre to the origin, whatever the spin
for (const n of [2, 3, 4]) { const A = alg(n), c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1.5 : rr(0.4, 1.4); const j = 2, g = 2.5, M0 = randMotor(A), B0 = randB(A), P0 = A.point(new Array(n).fill(0)), x0 = A.pos(A.sand(M0, P0));
  const Md = A.dM(M0, B0), vel = A.add(A.mul(A.mul(Md, P0), A.rev(M0)), A.mul(A.mul(M0, P0), A.rev(Md))), v0 = Array.from({ length: n }, (_, i) => A.q(vel, i + 1));
  let st = { M: M0, B: B0 }; const F = P.hangForce(A, { g, m: 1.5, k: 0, alpha: 0, pb: new Array(n).fill(0), anchor: new Array(n).fill(0) }), cc = A.z(); for (const m of A.BIV) cc[m] = m & 1 ? 1.5 : c[m];
  for (let i = 0; i < 250; i++) st = P.stepRK4(A, st, cc, F, 0.002); const xc = A.pos(A.sand(st.M, P0)), t = 0.5; ok(xc.every((v, i) => near(v, x0[i] + v0[i] * t - (i === j - 1 ? g / 2 * t * t : 0), 1e-7)), `n=${n}: free fall of a spinning body (E7)`);
  const c1 = P.unitC(A), Fh = P.hangForce(A, { g: 0, m: 1, k: 4, alpha: 0, pb: new Array(n).fill(0), anchor: new Array(n).fill(0) }); st = { M: M0, B: B0 }; for (let i = 0; i < 250; i++) st = P.stepRK4(A, st, c1, Fh, 0.002);
  ok(A.pos(A.sand(st.M, P0)).every((v, i) => near(v, x0[i] * Math.cos(2 * t) + v0[i] / 2 * Math.sin(2 * t), 1e-7)), `n=${n}: a spring on the centre ignores the spin (E8)`); }
// E11: the chain is in balance at tilt 0 for every n, every hook, one to three bodies; moved tilted bodies are not
for (const n of [1, 2, 3, 4]) for (const nb of [1, 2, 3]) { const A = alg(n); for (let rep = 0; rep < 2; rep++) {
  const top = n === 1 ? 1 : 1 + Math.floor(rnd() * ((1 << n) - 1)), sizes = Array.from({ length: nb }, (_, b) => Array.from({ length: n }, (_, i) => rr(0.4, 1.1))), R = P.chainRest(A, { top, nb, sizes, k: 8, g: 3, m: 1, y0: 3, tilt: 0 });
  const w = { n, g: 3, alpha: 0, bodies: R.bodies.map(b => ({ m: b.m, c: b.c })), springs: R.springs }; let st = R.bodies.map(b => ({ M: b.M, B: b.B })); const c0 = st.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0)))));
  for (let i = 0; i < 150; i++) st = P.stepWorld(A, w, st, 1 / 200); const c1 = st.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0)))));
  ok(c0.every((p, b) => p.every((v, i) => Math.abs(v - c1[b][i]) < 1e-9)), `E11: chain n=${n} nb=${nb} top=${top} stays at rest`);
  const R2 = P.chainRest(A, { top, nb, sizes, k: 8, g: 3, m: 1, y0: 3, tilt: 0.6 }); if (n >= 2) { const w2 = { ...w, springs: R2.springs, bodies: R2.bodies.map(b => ({ m: b.m, c: b.c })) }; let s2 = R2.bodies.map(b => ({ M: b.M, B: b.B })); const d0 = s2.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0))))); for (let i = 0; i < 100; i++) s2 = P.stepWorld(A, w2, s2, 1 / 200); const d1 = s2.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0))))); ok(d0.some((p, b) => p.some((v, i) => Math.abs(v - d1[b][i]) > 1e-3)), `E11: a tilted chain n=${n} nb=${nb} moves`); } } }
// E12: two bodies and one spring: total world momentum constant (Newton III as forques), energy constant
for (const n of [2, 3, 4]) { const A = alg(n), mk = () => { const c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1.3 : rr(0.4, 1.4); return c; }, c1 = mk(), c2 = mk();
  const w = { n, g: 0, alpha: 0, bodies: [{ m: 1.3, c: c1 }, { m: 1.3, c: c2 }], springs: [{ a: 0, pa: Array.from({ length: n }, () => rr(-0.5, 0.5)), b: 1, pb: Array.from({ length: n }, () => rr(-0.5, 0.5)), k: 4 }] };
  let st = [{ M: A.motor(Array.from({ length: n }, () => rr(-1, 1)), [[1, 2, 0.5]]), B: randB(A) }, { M: A.motor(Array.from({ length: n }, () => rr(2, 3)), [[1, 2, -0.4]]), B: randB(A) }];
  const mom = s => { const o = A.z(); s.forEach((x, i) => { const W = A.sand(x.M, A.Amap(x.B, w.bodies[i].c)); for (let q = 0; q < A.N; q++) o[q] += W[q]; }); return o; }, m0 = mom(st), e0 = P.energyWorld(A, w, st).E;
  for (let i = 0; i < 300; i++) st = P.stepWorld(A, w, st, 0.002); ok(mom(st).every((v, i) => near(v, m0[i], 1e-7)), `n=${n}: two bodies, one spring: the total world momentum is constant (E12)`); ok(near(P.energyWorld(A, w, st).E, e0, 1e-7), `n=${n}: and the energy (E12)`);
  const w3 = { ...w, springs: [{ ...w.springs[0], k: 4 }, { a: 0, pa: [...w.springs[0].pa], b: -1, pb: new Array(n).fill(0.5), k: 3 }] }; let s3 = [{ ...st[0] }, { ...st[1] }]; const q0 = mom(s3); for (let i = 0; i < 300; i++) s3 = P.stepWorld(A, w3, s3, 0.002); ok(!mom(s3).every((v, i) => near(v, q0[i], 1e-3)), `n=${n}: a spring to the world breaks the momentum (control)`); }
// T1, T2, T3: stability of the free top from the Jacobian of the engine itself
{ const A = alg(3);
  for (let t = 0; t < 4; t++) { const I = [rr(0.3, 1), rr(1.1, 2), rr(2.1, 3)].sort(() => rnd() - 0.5), c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1 : 0; c[0b1100] = I[0]; c[0b1010] = I[1]; c[0b0110] = I[2]; const planes = [0b1100, 0b1010, 0b0110], b = rr(0.5, 2);
    planes.forEach((pl, a) => { const B = A.z(); B[pl] = b; ok(A.dB(B, c).every(v => Math.abs(v) < 1e-12), 'T1: a spin about a principal axis is stationary'); const others = planes.filter((_, k) => k !== a), J = others.map(r => others.map(cc2 => { const d = 1e-6, Bp = B.slice(), Bm = B.slice(); Bp[cc2] += d; Bm[cc2] -= d; return (A.dB(Bp, c)[r] - A.dB(Bm, c)[r]) / (2 * d); }));
      const J2 = [[J[0][0] * J[0][0] + J[0][1] * J[1][0], J[0][0] * J[0][1] + J[0][1] * J[1][1]], [J[1][0] * J[0][0] + J[1][1] * J[1][0], J[1][0] * J[0][1] + J[1][1] * J[1][1]]];
      const ia = [0b1100, 0b1010, 0b0110].indexOf(pl), Ia = I[ia], [ib, ic] = [0, 1, 2].filter(q => q !== ia).map(q => I[q]), mu = b * b * (ic - Ia) * (Ia - ib) / (ib * ic);
      ok(near(J[0][0], 0, 1e-6) && near(J[1][1], 0, 1e-6) && near(J2[0][0], mu, 1e-5) && near(J2[1][1], mu, 1e-5) && near(J2[0][1], 0, 1e-5) && near(J2[1][0], 0, 1e-5), `T2: J^2 = mu 1 about axis ${a}: ${J2[0][0]} vs ${mu}`); });
    const sorted = [...I].map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), mid = sorted[1][1]; planes.forEach((pl, a) => { const ia = a, Ia = I[ia], [ib, ic] = [0, 1, 2].filter(q => q !== ia).map(q => I[q]); ok(((ic - Ia) * (Ia - ib) > 0) === (a === mid), 'T2: mu > 0 exactly for the intermediate moment'); }); }
  const c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1 : 0; c[0b1100] = 0.3; c[0b1010] = 0.3; c[0b0110] = 0.55;           // a symmetric top: two equal moments I, the third Ia
  const eps = 1e-6, b = 1.2, Om = b * (0.55 - 0.3) / 0.3; let s2 = { M: A.motor([0, 0, 0], []), B: A.z() }; s2.B[0b0110] = b; s2.B[0b1100] = eps; const T = 0.5;
  for (let i = 0; i < 250; i++) s2 = P.stepRK4(A, s2, c, null, 0.002);
  ok(near(Math.hypot(s2.B[0b1100], s2.B[0b1010]) / eps, 1, 1e-4) && near(s2.B[0b0110], b, 1e-9), 'T3: the perturbation keeps its size and the spin stays (an oscillator)');
  ok(near(Math.abs(Math.atan2(s2.B[0b1010], s2.B[0b1100])), Om * T, 1e-4), `T3: the perturbation turns by Omega t = b (Ia - I)/I t (${Math.atan2(s2.B[0b1010], s2.B[0b1100])} against ${Om * T})`);
  const e1 = A.z(); for (const m of A.BIV) e1[m] = m & 1 ? 1 : 0; for (const m of [0b1100, 0b1010, 0b0110]) e1[m] = 1; const Bs = A.z(); Bs[0b1010] = 0.35; Bs[0b0110] = -0.27; ok(A.dB(Bs, e1).every(v => Math.abs(v) < 1e-14), 'T3: with all three moments equal every rotation-only B is stationary (the repository example)'); }
// N2: the join of two points has e0 part b - a and norm d; point + ideal vector = point
for (const n of [2, 3, 4]) { const A = alg(n), a = Array.from({ length: n }, () => rr(-2, 2)), b = Array.from({ length: n }, () => rr(-2, 2)), Pa = A.point(a), Pb = A.point(b), Jn = A.join(Pa, Pb), e0 = A.FRC.filter(m => !(m & 1)).map(m => Jn[m]), d = Math.hypot(...a.map((x, i) => b[i] - x));
  ok(near(Math.hypot(...e0), d, 1e-12), `n=${n}: the e0 part of the join has the norm d (N2)`); const dv = A.add(Pb, Pa, -1); ok(near(A.weight(dv), 0, 1e-12) && A.dir(dv).every((v, i) => near(v, b[i] - a[i], 1e-12)), `n=${n}: b - a is an ideal vector (N2)`);
  const Pc = A.add(Pa, dv, 0.37); ok(near(A.weight(Pc), 1, 1e-12) && A.pos(Pc).every((v, i) => near(v, a[i] + 0.37 * (b[i] - a[i]), 1e-12)), `n=${n}: a point plus a multiple of an ideal vector is a point (N2)`); ok(near(A.weight(A.add(Pa, Pb)), 2, 1e-12), `n=${n}: point + point has weight 2 (N2)`); }
// N1, N6: Newton on bodies
{ const N1 = K.newton['3'], ms = N1.masses.map(fr), xs = N1.points.map(p => p.map(Number)), G = 1.5; const st0 = { x: xs, v: xs.map(() => [0, 0, 0].map(() => rr(-0.3, 0.3))) }, e0 = P.energyBodies(st0, ms, G); let st = st0; for (let i = 0; i < 400; i++) st = P.rk4Bodies(st, ms, G, 0.002);
  const e1 = P.energyBodies(st, ms, G); ok(near(e1.E, e0.E, 1e-9) && e1.P.every((v, i) => near(v, e0.P[i], 1e-9)), 'N1: RK4 on the example masses conserves energy and momentum to 1e-9');
  const h = 0.1, [x1] = P.rk4Oscillator(1, 0.3, 1, h); ok(near(x1, 1 * (1 - h * h / 2 + h ** 4 / 24) + 0.3 * (h - h ** 3 / 6), 1e-14), 'N6: one RK4 step of the oscillator is the Taylor polynomial of the exact flow through h^4');
  const [x0, w0] = [1, 0]; const [xx, vv] = P.rk4Oscillator(x0, w0, 1, h); ok(near((xx * xx + vv * vv) / (x0 * x0 + w0 * w0), 1 - h ** 6 / 72 + h ** 8 / 576, 1e-12), 'N6: RK4 on the oscillator multiplies the energy by 1 - h^6/72 + h^8/576'); }
// N3, N4, N5: the Kepler problem; the engine's circular orbit and the energy, angular momentum and LRL vector of the eccentric orbit
{ const GM = 2, two = (x, v) => ({ x: [[0, 0], x], v: [[0, 0], v] });
  // the fixed centre is a heavy body: m = GM, G = 1, and a test mass 1e-30
  let s = two([2, 0], [0, 1]); const ms = [GM, 1e-30]; const t = 1.7, h = 0.001; for (let i = 0; i < Math.round(t / h); i++) s = P.rk4Bodies(s, ms, 1, h); ok(near(s.x[1][0], 2 * Math.cos(t / 2), 1e-9) && near(s.x[1][1], 2 * Math.sin(t / 2), 1e-9), 'N3: the circular orbit r = 2, v = 1, GM = 2 is x = 2 cos(t/2), y = 2 sin(t/2)');
  s = two([1, 0], [0, 0.75]); const en = x => { const r = Math.hypot(x.x[1][0], x.x[1][1]), v2 = x.v[1][0] ** 2 + x.v[1][1] ** 2, L = x.x[1][0] * x.v[1][1] - x.x[1][1] * x.v[1][0]; const lrl = [x.v[1][1] * L - x.x[1][0] / r, -x.v[1][0] * L - x.x[1][1] / r]; return { E: v2 / 2 - 1 / r, L, lrl }; };
  const k0 = en(s), ex = K.kepler.eccentric; ok(near(k0.E, fr(ex.E)) && near(k0.L, fr(ex.L)) && k0.lrl.every((v, i) => near(v, fr(ex.LRL[i]))), 'N4: the start has the exact E, L and LRL of the data');
  for (let i = 0; i < 2000; i++) s = P.rk4Bodies(s, [1, 1e-30], 1, 0.002); const k1 = en(s); ok(near(k1.E, k0.E, 1e-9) && near(k1.L, k0.L, 1e-9) && k1.lrl.every((v, i) => near(v, k0.lrl[i], 1e-8)), 'N4: the engine keeps E, L and the LRL vector'); }
// N8: the moon of the example, with the same constants as the exact row; the period from the engine
{ const { G, mE, mM, vM, d } = P.MOON, cog = d * mM / (mE + mM); let st = { x: [[-cog, 0], [d - cog, 0]], v: [[0, -vM * cog / d], [0, vM * (d - cog) / d]] }; const m = [mE, mM], e0 = P.energyBodies(st, m, G); let t = 0, rev = 0, last = 0, h = 5000; const startE = P.energyBodies(st, m, G);
  for (let i = 0; i < 400000 && rev < 6; i++) { const py = st.x[1][1] - st.x[0][1]; st = P.rk4Bodies(st, m, G, h); t += h; const y = st.x[1][1] - st.x[0][1]; if (py < 0 && y >= 0 && st.x[1][0] > st.x[0][0]) { rev++; last = t; } }
  ok(rev === 6 && Math.abs(last / 86400 / 6 - Number(K.moon.period_days)) < 0.01, `N8: six revolutions of the engine give ${last / 86400 / 6} days against the printed ${K.moon.period_days}`); const e1 = P.energyBodies(st, m, G); ok(Math.abs((e1.E - e0.E) / e0.E) < 1e-8, 'N8: the energy drift of the moon run is below 1e-8');
  const mu = G * (mE + mM), a = 1 / (2 / d - vM * vM / mu), ecc = d * vM * vM / mu - 1; ok(Math.abs(a / 1000 - Number(K.moon.a_km)) < 1 && near(ecc, Number(K.moon.e), 1e-3) && Math.abs(a * (1 + ecc) / 1000 - Number(K.moon.apogee_km)) < 20, 'N8: a, e and the apogee of the engine start equal the data'); }
// N9: the planets table of the example: the engine start has the momentum fraction of the data; the run conserves energy
{ const names = Object.keys(K.planets_data), mass = names.map(k => Number(K.planets_data[k].mass_kg)); let st = { x: names.map(k => K.planets_data[k].pos_km.map(Number)), v: names.map(k => K.planets_data[k].vel_kms.map(Number)) };
  const e0 = P.energyBodies(st, mass, P.PLANET_G), frac = Math.hypot(...e0.P) / st.v.reduce((s, v, i) => s + mass[i] * Math.hypot(...v), 0); ok(Math.abs(frac - Number(K.planets.momentum_fraction)) < 5e-4, `N9: momentum fraction ${frac} against ${K.planets.momentum_fraction}`);
  for (let i = 0; i < 1500; i++) st = P.rk4Bodies(st, mass, P.PLANET_G, 14400); const e1 = P.energyBodies(st, mass, P.PLANET_G); ok(Math.abs((e1.E - e0.E) / e0.E) < 1e-8 && Math.abs((e1.Lz - e0.Lz) / e0.Lz) < 1e-6, 'N9: the planets run (250 days, 4 h step) conserves energy to 1e-8');
  const sunE = names.indexOf('Earth'); const rel = [st.x[sunE][0] - st.x[0][0], st.x[sunE][1] - st.x[0][1], st.x[sunE][2] - st.x[0][2]]; ok(Math.hypot(...rel) / 149597870.7 > 0.97 && Math.hypot(...rel) / 149597870.7 < 1.03, 'N9: Earth stays near 1 AU from the Sun'); }
// G1-G4 from the engine: every variant of the benchmark returns the same answers, and the label identities hold
for (let n = 1; n <= 6; n++) ok(checkAll(n), `benchKernels: all variants agree for n=${n}`);
for (let n = 2; n <= 4; n++) { const A = alg(n); for (let t = 0; t < 20; t++) { const M = randMotor(A), s = Array.from({ length: n }, () => rr(0.3, 2)), f = P.frame(A, M, s), V = P.verticesFrame(A, M, s, f), D = P.verticesDirect(A, M, s);
  ok(V.every((v, i) => v.every((x, k) => near(x, D[i][k], 1e-12))), `G1: the frame builds the 2^${n} vertices`); const cen = f.c; ok(V.every((v, i) => v.every((x, k) => near(2 * cen[k] - x, V[V.length - 1 - i][k], 1e-12))), `G2: the complement is the mirror image (n=${n})`);
  const nu = Array.from({ length: n }, () => rr(-1, 1)), dd = rr(-1, 1); ok(P.deepestScan(V, nu, dd) === P.deepestBits(f, nu), `G3: the sign bits give the deepest vertex (n=${n})`);
  const view = rr(-1, 1), PR = V.map((v, i) => [...P.project(n, v, view), i]), H = P.hull(PR), Z = P.zonogon(f.f.map(g => P.project(n, g, view))); ok(Z.length === 2 * n && H.length === 2 * n && Z.every(a => H.includes(a)), `G4: the outline of the ${n}-cube has ${2 * n} vertices and equals the hull`);
  ok(Z.every((a, i) => { const b = Z[(i + 1) % Z.length], x = a ^ b; return x && !(x & (x - 1)); }) && [...Array(n).keys()].every(i => Z.filter((a, k) => (a ^ Z[(k + 1) % Z.length]) === 1 << i).length === 2), `G4: consecutive outline vertices differ in one bit, each bit twice (n=${n})`); } }
// the benchmark function itself runs (a very short run) and returns every variant with a positive time
{ let t = 0; const now = () => (t += 2), r = runBench({ ns: [2, 3], now, minMs: 1, reps: 3 }); ok(r.length === 2 && r.every(x => Object.values(x.ns).every(v => v && v.med > 0)), 'runBench returns every variant for every size'); }

// ---- 5. the engine against ganja.js (the library of the listings) directly: dyadic inputs, so the doubles agree to rounding
const maskOf = name => { let m = 0; for (const ch of name === '1' ? '' : name.slice(1)) m |= 1 << Number(ch); return m; };
const load = (A, obj) => { const o = A.z(); for (const [k, v] of Object.entries(obj)) o[maskOf(k)] = v; return o; };
const closeV = (a, b, t = 1e-12) => a.every((v, i) => near(v, b[i], t));
let cases = 0;
for (const d of [1, 2, 3, 4]) { const A = alg(d), c = P.unitC(A), j = d >= 2 ? 2 : 1;
  for (const cs of FIX[String(d)].cases) { cases++; const M = load(A, cs.M), B = load(A, cs.B), a = A.point(cs.attach), p = A.point(cs.pb), O = cs.out, G = A.gravity(M, 2, j, 1), H = A.hooke(M, 4, p, a), Dm = A.damping(B, 0.25), F = A.add(A.add(G, H), Dm);
    ok(closeV(A.dM(M, B), load(A, O.dM)), `ganja n=${d}: dM`); ok(closeV(A.dB(B, c), load(A, O.dBfree)), `ganja n=${d}: free Euler term`); ok(closeV(G, load(A, O.Gravity)), `ganja n=${d}: gravity`); ok(closeV(H, load(A, O.Hooke)), `ganja n=${d}: Hooke`);
    ok(closeV(Dm, load(A, O.Damping)), `ganja n=${d}: damping`); ok(closeV(A.dB(B, c, F), load(A, O.dBfull), 1e-11), `ganja n=${d}: the whole state derivative`); ok(closeV(A.sand(M, p), load(A, O.world)), `ganja n=${d}: world point`);
    ok(closeV(a, load(A, O.a)) && closeV(p, load(A, O.p)), `ganja n=${d}: points`);
    const T = A.trans(Array.from({ length: d }, (_, i) => (i === j - 1 ? 1 : 0))); ok(closeV(A.mul(T, p), load(A, O.attachProd)) && closeV(A.sand(T, p), load(A, O.attachSand)), `ganja n=${d}: attach is a product, the sandwich moves by a whole unit`); } }
ok(cases === K.reference.cases, `all ${cases} ganja cases compared (data says ${K.reference.cases})`);
{ const A = alg(3), ones3 = P.unitC(A); let cnt = 0;
  for (const top of FIX.later.top) for (const cs of top.cases) { const gg = load(A, cs.gg), vv = load(A, cs.vv), c = A.z(); for (const nm of ['e01', 'e02', 'e03', 'e12', 'e13', 'e23']) { const X = A.dual(A.blade(maskOf(nm))), mx = X.findIndex(v => v !== 0), base = A.Amap(X, ones3), mk = base.findIndex(v => v !== 0), ref = load(A, cs['A_' + nm]); c[mx] = ref[mk] / base[mk]; }
    const B = vv.map(v => -2 * v), dg = A.dM(gg, B), dv = A.scale(A.dB(B, c), -0.5); ok(closeV(dg, load(A, cs.dg), 1e-12), 'ganja top: g v = our dM'); ok(closeV(dv, load(A, cs.dv), 1e-11), 'ganja top: the velocity derivative under v = -B/2'); cnt++; }
  ok(cnt === 9, 'nine top cases'); }
for (const cs of FIX.later.twobody) { const n = cs.n, A = alg(n), Pa = A.point(cs.p1), Pb = A.point(cs.p2), v = A.add(Pb, Pa, -1), d = Math.hypot(...A.dir(v));
  ok(near(d, cs.d, 1e-14) && closeV(v, load(A, cs.v)), `ganja twobody n=${n}: the ideal vector p2 - p1 and its length`); const a1 = A.scale(v, cs.G * cs.m2 / d ** 3), a2 = A.scale(v, -cs.G * cs.m1 / d ** 3); ok(closeV(a1, load(A, cs.a1), 1e-13) && closeV(a2, load(A, cs.a2), 1e-13), `ganja twobody n=${n}: G m2 (p2 - p1)/d^3`);
  const acc = P.newtonAcc([cs.p1, cs.p2], [cs.m1, cs.m2], cs.G, [new Array(n).fill(0), new Array(n).fill(0)]); ok(acc[0].every((x, i) => near(x, A.dir(a1)[i], 1e-12)) && acc[1].every((x, i) => near(x, A.dir(a2)[i], 1e-12)), `ganja twobody n=${n}: newtonAcc equals the ideal-vector form`); }

// ---- 6. wiring: steps, page, tally, readings, story, persona, map, build
ok(STEP_GROUPS.eq.join() === 'comm,dirac,coupling,ym,matter,grav1,grav2,mirrors,projective,forque,spin,spring,rigid' && stepCount('eq') === 13, 'thirteen steps, rigid last');
ok(stepEyebrow('en', 'eq', 'rigid') === 'STEP 13 OF 13 · A RIGID BODY: FROM THE SEGMENT TO THE TESSERACT' && stepEyebrow('it', 'eq', 'rigid') === 'PASSO 13 DI 13 · UN CORPO RIGIDO: DAL SEGMENTO AL TESSERATTO', 'eyebrows in both languages');
ok(eqNavIds().length === 14 && NAV_NAMES.en.rigid === 'A rigid body' && NAV_NAMES.it.rigid === 'Un corpo rigido', 'navigation names');
const eqs = fs.readFileSync('./EquationsSection.jsx', 'utf8'), build = fs.readFileSync('./build.sh', 'utf8');
ok(/RigidSection/.test(eqs) && ['RigidSection.jsx', 'RigidWidgets.jsx', 'RigidWidgets2.jsx', 'rigidCopy.js', 'rigidRows.js', 'pgaEngine.js', 'benchKernels.js', 'benchData.js', 'pgadynData.js', 'pgadynSelfcheckSource.js', 'ganjaFixtureData.js'].every(f => build.includes(f)), 'section wired into the page and every new file into the build');
ok(['en', 'it'].every(l => SHORT[l].rigid.length === 2 && SHORT[l].rigid.every(x => x.length < 460) && SHORT[l].rigid[1].includes(String(K.summary.ok))), 'short readings exist, are short and carry the count');
ok(EQC.en.t.rows.some(r => /rigid body/.test(r[0]) && r[3].includes(String(K.summary.ok))) && EQC.it.t.rows.some(r => /corpo rigido/.test(r[0]) && r[3].includes(String(K.summary.ok))), 'the tally lists the rigid body in both languages');
ok(/Fourteen/.test(EQC.en.t.note) && /Quattordici/.test(EQC.it.t.note), 'the tally counts fourteen rows');
const persona = fs.readFileSync('./lib/chatPersona.js', 'utf8'); ok(/step 13/.test(persona) && /pgadyn_selfcheck/.test(persona) && /benchmark|timed/.test(persona) && /tennis|inverted oscillator/.test(persona), 'persona knows step 13');
console.log(`${checks} checks`); console.log(bad ? bad + ' FAILURES' : 'ALL RIGID-BODY TESTS PASS'); process.exit(bad ? 1 : 0);
