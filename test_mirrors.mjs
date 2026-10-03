import { eqNavIds } from './steps.js';
import fs from 'fs';
import K from './mirrorsData.js';
import COPY, { AXN, axset, weight } from './mirrorsCopy.js';
import EQC from './equationsCopy.js';
import { MR_PY, MRM_PY } from './mirrorsSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import { SHORT } from './audienceCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const J = JSON.parse(fs.readFileSync('./selfcheck/mirrors.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/mirrors_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.mr) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(MR_PY === fs.readFileSync('./selfcheck/mirrors_selfcheck.py', 'utf8') && MRM_PY === fs.readFileSync('./selfcheck/mirrors_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(MR_PY) && /ALL MIRRORS CHECKS PASS/.test(MR_PY) && /ALL MIRRORS MATRIX CHECKS PASS/.test(MRM_PY), 'script interfaces');
ok(!/gravity/.test(MRM_PY), 'the matrix check does not depend on the gravity files');
const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
// ---- an independent Clifford product on bit masks (floats): sign = parity of swaps, times the squares of repeated generators
const cm = (a, b, sq) => { let sw = 0; for (let j = 0; j < sq.length; j++) if (b >> j & 1) for (let i = j + 1; i < sq.length; i++) if (a >> i & 1) sw++; let s = sw % 2 ? -1 : 1; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const mvMul = (A, B, sq) => { const r = new Map(); for (const [a, x] of A) for (const [b, y] of B) { const [m, s] = cm(a, b, sq), v = (r.get(m) || 0) + s * x * y; r.set(m, v); } return r; };
const rev = A => { const r = new Map(); for (const [m, x] of A) { const k = weight(m); r.set(m, x * ((k * (k - 1) / 2) % 2 ? -1 : 1)); } return r; };
const vec = x => new Map(x.map((c, i) => [1 << i, c]).filter(([, c]) => c));
const sqSpace = n => Array(n).fill(-1), sqLor = n => Array.from({ length: n }, (_, i) => (i ? -1 : 1));
// ---- counts by enumeration of corners
for (let n = 2; n <= 8; n++) {
  const r = K.mr.ladder[n]; const byW = Array(n + 1).fill(0); for (let S = 0; S < 1 << n; S++) byW[weight(S)]++;
  ok(r.corners === 1 << n && r.layers.join() === byW.join() && byW.join() === Array.from({ length: n + 1 }, (_, k) => C(n, k)).join(), `n=${n}: layers by enumeration`);
  const even = byW.filter((_, k) => k % 2 === 0).reduce((a, b) => a + b, 0);
  ok(r.rotors === even && r.rotors === 1 << (n - 1) && r.reflections === 1 << (n - 1) && r.rotor_layers.join() === byW.filter((_, k) => k % 2 === 0).join(), `n=${n}: rotors = even corners`);
  ok(r.B_order === (1 << n) * fact(n) && r.D_order === (1 << (n - 1)) * fact(n) && r.max_mirrors === n && r.edges_of_cube === n * (1 << (n - 1)), `n=${n}: group orders and edges`);
  ok(byW[2] === n * (n - 1) / 2, `n=${n}: the weight-2 corners are the planes`);
}
// ---- a corner is the product of its coordinate mirrors, and flips exactly its axes (twisted sandwich computed with the independent product)
for (const [name, sqf] of [['space', sqSpace], ['lorentz', sqLor]]) for (let n = 2; n <= 6; n++) { const sq = sqf(n); let good = true;
  for (let S = 0; S < 1 << n; S++) { let V = new Map([[0, 1]]); const k = weight(S); for (let i = 0; i < n; i++) if (S >> i & 1) V = mvMul(V, vec(Array.from({ length: n }, (_, j) => (j === i ? 1 : 0))), sq);
    const VV = mvMul(V, rev(V), sq).get(0);
    for (let j = 0; j < n; j++) { const x = vec(Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))), y = mvMul(mvMul(V, x, sq), rev(V), sq), want = (S >> j & 1) ? -1 : 1, got = (y.get(1 << j) || 0) / VV * (k % 2 ? -1 : 1);
      if (Math.abs(got - want) > 1e-9) good = false; for (const [m, c] of y) if (m !== 1 << j && Math.abs(c) > 1e-9) good = false; } }
  ok(good, `JS: corners flip exactly their axes, ${name}, n=${n}`); }
// ---- reflections as Householder matrices and random versors: the twisted sandwich equals the product of the reflections
let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }, gauss = () => { let s = 0; for (let i = 0; i < 12; i++) s += rnd(); return s - 6; };
const dot = (a, b, sq) => a.reduce((s, x, i) => s + sq[i] * x * b[i], 0);
const house = (a, sq) => { const n = sq.length, aa = dot(a, a, sq), M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - 2 * a[i] * sq[j] * a[j] / aa)); return M; };
const mm = (A, B) => A.map((_, i) => B[0].map((__, j) => A[i].reduce((s, _x, k) => s + A[i][k] * B[k][j], 0)));
const mv = (A, x) => A.map(r => r.reduce((s, c, j) => s + c * x[j], 0));
const eye = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const randVec = sq => { for (;;) { const a = sq.map(() => gauss()), q = dot(a, a, sq), e = a.reduce((s, x) => s + x * x, 0); if (Math.abs(q) > 0.4 * e) return a; } };
const det = A => { const n = A.length, M = A.map(r => r.slice()); let d = 1; for (let c = 0; c < n; c++) { let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i; if (Math.abs(M[p][c]) < 1e-14) return 0; if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; d = -d; } d *= M[c][c]; for (let i = c + 1; i < n; i++) { const f = M[i][c] / M[c][c]; for (let j = c; j < n; j++) M[i][j] -= f * M[c][j]; } } return d; };
const maxAbs = A => Math.max(...A.flat().map(Math.abs));
for (const [name, sqf] of [['space', sqSpace], ['lorentz', sqLor]]) for (let n = 2; n <= 5; n++) { const sq = sqf(n); let good = true, detOk = true, iso = true;
  for (let t = 0; t < 30; t++) { const k = 1 + Math.floor(rnd() * (2 * n + 1)); let V = new Map([[0, 1]]), R = eye(n); for (let i = 0; i < k; i++) { const a = randVec(sq); V = mvMul(V, vec(a), sq); R = mm(R, house(a, sq)); }
    const VV = mvMul(V, rev(V), sq); let isScalar = true; for (const [m, c] of VV) if (m !== 0 && Math.abs(c) > 1e-6 * Math.abs(VV.get(0))) isScalar = false; if (!isScalar) good = false;
    for (let j = 0; j < n; j++) { const e = Array.from({ length: n }, (_, i) => (i === j ? 1 : 0)), y = mvMul(mvMul(V, vec(e), sq), rev(V), sq), want = mv(R, e); for (let i = 0; i < n; i++) if (Math.abs((y.get(1 << i) || 0) / VV.get(0) * (k % 2 ? -1 : 1) - want[i]) > 1e-8 * (1 + Math.abs(want[i]))) good = false; }
    if (Math.abs(det(R) - (k % 2 ? -1 : 1)) > 1e-8) detOk = false; const eta = sq; const RT = R[0].map((_, j) => R.map(r => r[j])); const G = mm(mm(RT, eta.map((s, i) => eta.map((_, j) => (i === j ? s : 0)))), R); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (Math.abs(G[i][j] - (i === j ? sq[i] : 0)) > 1e-8 * (1 + maxAbs(R) ** 2)) iso = false; }
  ok(good && detOk && iso, `JS: twisted sandwich = product of Householder matrices, determinant (−1)^k, isometry, ${name}, n=${n}`); }
// ---- a wrong version must fail: the untwisted sandwich for an odd number of mirrors
{ const n = 3, sq = sqLor(n); let fails = 0; for (let t = 0; t < 10; t++) { const a = randVec(sq), V = vec(a), VV = mvMul(V, rev(V), sq).get(0), e = [1, 0, 0], y = mvMul(mvMul(V, vec(e), sq), rev(V), sq), want = mv(house(a, sq), e); let d = 0; for (let i = 0; i < n; i++) d = Math.max(d, Math.abs((y.get(1 << i) || 0) / VV - want[i])); if (d > 1e-6) fails++; } ok(fails === 10, 'JS: the untwisted sandwich fails for one mirror'); }
// ---- Cartan–Dieudonné by a structured basis: u_i = P e_i for a random isometry P, a_i = O_i u_i − u_i
function cartan(O, sq) {
  const n = sq.length;
  for (let attempt = 0; attempt < 200; attempt++) { let P = eye(n); for (let i = 0; i < 2 * n; i++) P = mm(P, house(randVec(sq), sq)); const mirrors = []; let Ok = O, fine = true;
    for (let i = 0; i < n; i++) { const u = P.map(r => r[i]), w = mv(Ok, u), a = w.map((x, j) => x - u[j]), aa = a.reduce((s, x) => s + x * x, 0); if (aa < 1e-14) continue; if (Math.abs(dot(a, a, sq)) < 1e-3 * aa) { fine = false; break; } mirrors.push(a); Ok = mm(house(a, sq), Ok); }
    if (fine && maxAbs(Ok.map((r, i) => r.map((x, j) => x - (i === j ? 1 : 0)))) < 1e-7) return mirrors; }
  return null;
}
for (const [name, sqf] of [['space', sqSpace], ['lorentz', sqLor]]) for (let n = 2; n <= 6; n++) { const sq = sqf(n); let good = true, parity = true, prod = true; const seen = {};
  for (let t = 0; t < 20; t++) { const k = 1 + Math.floor(rnd() * (2 * n + 1)); let O = eye(n); for (let i = 0; i < k; i++) O = mm(O, house(randVec(sq), sq));
    const ms = cartan(O, sq); if (!ms || ms.length > n) { good = false; continue; } if ((ms.length - k) % 2) parity = false;
    let Pm = eye(n); for (const a of ms) Pm = mm(Pm, house(a, sq)); if (maxAbs(Pm.map((r, i) => r.map((x, j) => x - O[i][j]))) > 1e-6 * (1 + maxAbs(O))) prod = false; seen[ms.length] = 1; }
  ok(good && parity && prod, `JS: Cartan–Dieudonné gives at most n mirrors with the right parity and product, ${name}, n=${n} (counts seen ${Object.keys(seen).join('/')})`); }
// all-flip corner needs n mirrors: the rank of -1 - 1 is n
for (let n = 2; n <= 6; n++) { const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? -2 : 0))); ok(Math.abs(det(M)) > 0, `n=${n}: the all-flip corner minus the identity has full rank`); }
// ---- the examples
const fr = s => { const [a, b] = String(s).split('/'); return b ? +a / +b : +a; };
for (const [key, sq] of [['rotation_3_4_5', [-1, -1]], ['boost_5_4_3_4', [1, -1]]]) { const ex = K.mr.examples[key], a1 = ex.mirror_normals[0].map(fr), a2 = ex.mirror_normals[1].map(fr), O = ex.matrix.map(r => r.map(fr)), P = mm(house(a1, sq), house(a2, sq)); ok(maxAbs(P.map((r, i) => r.map((x, j) => x - O[i][j]))) < 1e-12, `example ${key}: the two mirrors multiply to the matrix`); }
{ const O = K.mr.examples.rotation_3_4_5.matrix.map(r => r.map(fr)); ok(Math.abs(O[0][0] - .6) < 1e-12 && Math.abs(O[1][0] - .8) < 1e-12 && Math.abs(det(O) - 1) < 1e-12, 'rotation 3/5, 4/5'); const B = K.mr.examples.boost_5_4_3_4.matrix.map(r => r.map(fr)); ok(Math.abs(det(B) - 1) < 1e-12 && Math.abs(B[0][0] * B[0][0] - B[0][1] * B[0][1] - 1) < 1e-12, 'boost 5/4, 3/4 preserves the metric'); }
// ---- B_n and D_n by closure of signed permutations
function closure(gens, n) { const key = m => m.join(','), seen = new Set([key(Array.from({ length: n }, (_, i) => i + 1))]), all = [Array.from({ length: n }, (_, i) => i + 1)]; let frontier = [Array.from({ length: n }, (_, i) => i + 1)];
  while (frontier.length) { const next = []; for (const x of frontier) for (const g of gens) { const z = x.map(v => { const w = g[Math.abs(v) - 1]; return Math.sign(v) * w; }); const k = key(z); if (!seen.has(k)) { seen.add(k); next.push(z); all.push(z); } } frontier = next; } return all; }
for (let n = 2; n <= 4; n++) { const id = Array.from({ length: n }, (_, i) => i + 1), sw = (i, j, s) => { const g = id.slice(); g[i] = s * (j + 1); g[j] = s * (i + 1); return g; };
  const gensB = [id.map((v, i) => (i === 0 ? -v : v))]; for (let i = 0; i + 1 < n; i++) gensB.push(sw(i, i + 1, 1));
  const gensD = []; for (let i = 0; i + 1 < n; i++) { gensD.push(sw(i, i + 1, 1)); } gensD.push(sw(0, 1, -1));
  const B = closure(gensB, n), D = closure(gensD, n); ok(B.length === K.mr.coxeter[n].B_order && D.length === K.mr.coxeter[n].D_order && B.length === (1 << n) * fact(n) && D.length === (1 << (n - 1)) * fact(n), `n=${n}: B and D orders by an independent closure (${B.length}, ${D.length})`);
  let evenSigns = 0, allSigns = new Set(); for (const z of D) allSigns.add(z.map(v => (v < 0 ? 1 : 0)).reduce((s, b, i) => s + (b << (Math.abs(z[i]) - 1)), 0)); for (const S of allSigns) if (weight(S) % 2 === 0) evenSigns++; ok(allSigns.size === 1 << (n - 1) && evenSigns === allSigns.size, `n=${n}: the sign changes of D_n are exactly the even corners`); }
// ---- E8
{ const roots = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) for (const si of [2, -2]) for (const sj of [2, -2]) { const x = Array(8).fill(0); x[i] = si; x[j] = sj; roots.push(x); }
  const d8 = roots.length; for (let m = 0; m < 256; m++) { let neg = 0; const x = []; for (let i = 0; i < 8; i++) { const s = m >> i & 1 ? -1 : 1; if (s < 0) neg++; x.push(s); } if (neg % 2 === 0) roots.push(x); }
  const set = new Set(roots.map(r => r.join(','))); let perm = true; for (const r of roots) for (const x of roots) { const d = x.reduce((s, v, i) => s + v * r[i], 0) / 4, y = x.map((v, i) => v - d * r[i]); if (!set.has(y.join(','))) perm = false; }
  ok(d8 === 112 && roots.length === 240 && set.size === 240 && perm, 'JS: E8 has 112 + 128 roots, all permuted by their mirrors'); ok(K.mr.e8.d8_roots === 112 && K.mr.e8.demicube_vertices === 128 && K.mr.e8.roots === 240 && K.mr.e8.mirrors_permute_roots === true, 'stored E8 data'); }
// ---- stored checks
for (const n of [2, 3, 4, 5]) for (const s of ['space', 'lorentz']) { const v = K.mr.versors[`${n},${s}`]; ok(v.mirror_formula && v.isometry && v.determinant && v.parity && v.parity_of_count && v.at_most_n && v.reduced_versor_equal_up_to_scalar, `stored versor checks ${n},${s}`); ok(Object.keys(v.mirrors_used).every(k => +k <= n) && Object.keys(v.mirrors_used).some(k => +k >= 2), `non-vacuous: several mirror counts seen ${n},${s}`); }
for (let n = 2; n <= 6; n++) for (const s of ['space', 'lorentz']) { const c = K.mr.corners[`${n},${s}`]; ok(c.all_flip && c.even_corners === 1 << (n - 1) && Object.entries(c.weights).every(([k, v]) => v === C(n, +k)), `stored corners ${n},${s}`); }
ok(K.mr.dirac_current.two_mirror_spinors_tested === 12 && K.mr.dirac_current.current_is_a_vector && K.mr.dirac_current.square_equals_scalar_density_squared, 'stored Dirac current');
const MX = K.matrix; ok(Object.keys(MX.twisted_sandwich_error).length === 10 && Object.values(MX.twisted_sandwich_error).every(v => v === 0), 'matrix: twisted sandwich at n = 2..6, both signatures');
ok(Object.keys(MX.cartan_dieudonne).length === 10 && Object.values(MX.cartan_dieudonne).every(v => v.at_most_n && Object.keys(v.mirror_counts_seen).length >= 2), 'matrix: Cartan–Dieudonné at n = 2..6');
ok(Object.values(MX.corner).every((v, i, a) => v.all_flip_needs === v.rank_of_flip_minus_identity), 'matrix: the all-flip corner needs n mirrors');
ok(Object.keys(MX.controls).length === 4 && Object.values(MX.controls).every(v => /fail|never|not an isometry/.test(v)), 'matrix: four negative controls');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it) && keys(COPY.en.m1) === keys(COPY.it.m1) && keys(COPY.en.m1.dl) === keys(COPY.it.m1.dl), 'copy keys');
for (const lang of ['en', 'it']) { const t = COPY[lang].m1;
  for (let n = 2; n <= 8; n++) { const v = t.views({ ...K.mr.ladder[n], n_value: n }); ok(v.length === 7, `${lang} n=${n}: 7 views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} view tag ${g}`); }
  for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`); ok(t.open.length === 3 && t.xr.length === 4, `${lang} lists`);
  for (let n = 2; n <= 5; n++) for (let S = 0; S < 1 << n; S++) { const c = t.corner(n, S); ok(c.head && c.lines.length === 3 && !/undefined|NaN/.test(JSON.stringify(c)), `${lang} corner text n=${n} S=${S}`); }
  const all = JSON.stringify([t, [2, 3, 4, 5, 6, 7, 8].map(n => t.views({ ...K.mr.ladder[n], n_value: n })), [3, 7, 15].map(S => t.corner(4, S))]);
  ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|terms|blades|boosts|rotations|mirrors|corners)\b/, /\b1 specchi\b/]) ok(!b.test(all), `${lang} banned ${b}`); }
ok(/Nothing here selects three generations/.test(COPY.en.m1.open[2][1]) && /Niente di quanto qui scelga tre generazioni/.test(COPY.it.m1.open[2][1]) && /not defined \(a·a = 0\)/.test(COPY.en.m1.open[1][1]) && /physical role/.test(COPY.en.m1.open[0][1]), 'open items are stated');
ok(/textbook/.test(COPY.en.m1.xr[0][1]) && /relabelling/.test(COPY.en.m1.xr[0][1]) && /standard material/.test(COPY.en.m1.lede) && /does not claim a physical role/.test(COPY.en.m1.lede), 'the standard / ours flags are stated');
ok(/we read/.test(COPY.en.m1.xr[3][1]) && /have not compared/.test(COPY.en.m1.xr[3][1]), 'what was read and what was not');
// ---- spot checks of the text against the data
{ const v = COPY.en.m1.views({ ...K.mr.ladder[4], n_value: 4 }); ok(/1 \+ 4 \+ 6 \+ 4 \+ 1/.test(v[1].t) && /1 \+ 6 \+ 1 = 8/.test(v[1].t) && /\|Bₙ\| = 2ⁿ n! = 384/.test(v[1].t) && /192/.test(v[1].t) && /at most n = 4 mirrors/.test(v[0].t) && /6 of them/.test(v[2].t) && /12 random spinors|12 random/.test(v[6].t), 'n=4 text matches the data'); }
{ const v = COPY.en.m1.views({ ...K.mr.ladder[8], n_value: 8 }); ok(/1 \+ 28 \+ 70 \+ 28 \+ 1 = 128/.test(v[1].t) && /10321920/.test(v[1].t) && /not done|closure is run to n = 5/.test(v[1].t) && /only there|n = 4/.test(v[6].t), 'n=8 text'); }
{ const t = COPY.en.m1.corner(4, 15); ok(/txyz/.test(t.head) && /4 axes/.test(t.lines[0]) && /diag\(−1, −1, −1, −1\)/.test(t.lines[0]) && /4 mirrors/.test(t.lines[1]) && /Even/.test(t.lines[2]), 'corner txyz'); const u = COPY.en.m1.corner(3, 1); ok(/1 axis\b/.test(u.lines[0]) && /1 mirror\b/.test(u.lines[1]) && /Odd/.test(u.lines[2]), 'one corner: singular'); const w = COPY.it.m1.corner(3, 1); ok(/1 specchio/.test(w.lines[1]) && /l’asse/.test(w.lines[0]), 'Italian singular'); }
ok(axset(0) === '∅' && axset(5) === 'ty' && AXN.slice(0, 4).join('') === 'txyz', 'labels');
// ---- tally, nav, audience, wiring
ok(eqNavIds().at(-1) === 'tally' && EQC.en.t.rows.length === eqNavIds().length && EQC.it.t.rows.length === eqNavIds().length, 'tally and nav have the mirrors entry');
ok(EQC.en.t.rows[8][2] === '16 corners in 4D' && EQC.en.t.rows[8][3] === '8 rotors, 8 reflections, at most 4 mirrors in 4D', 'tally row from the data');
ok(SHORT.en.mirrors.length === 2 && SHORT.it.mirrors.length === 2 && SHORT.en.mirrors.every(x => x.length > 100) && SHORT.it.mirrors.every(x => x.length > 100), 'short readings for the audiences');
const pg = fs.readFileSync('./EquationsSection.jsx', 'utf8'); ok(/MirrorsSection/.test(pg) && eqNavIds().includes('mirrors'), 'section wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL MIRRORS TESTS PASS'); process.exit(bad ? 1 : 0);
