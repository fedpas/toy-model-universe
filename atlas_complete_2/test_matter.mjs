import fs from 'fs';
import K from './matterData.js';
import COPY, { internalHalves, halfEdges } from './matterCopy.js';
import EQC from './equationsCopy.js';
import S from './shapesData.js';
import { MT_PY, MTM_PY } from './matterSelfcheckSource.js';
import { STORY } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const J = JSON.parse(fs.readFileSync('./selfcheck/matter.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/matter_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.mt) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(MT_PY === fs.readFileSync('./selfcheck/matter_selfcheck.py', 'utf8') && MTM_PY === fs.readFileSync('./selfcheck/matter_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(MT_PY) && /ALL MATTER CHECKS PASS/.test(MT_PY) && /ALL MATTER MATRIX CHECKS PASS/.test(MTM_PY), 'script interfaces');
// ---- an independent Clifford product (written here)
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const bm = (a, b, sq) => { let s = 1; for (let i = 0; i < sq.length; i++) if (b >> i & 1 && pc(a >> (i + 1)) % 2) s = -s; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const rv = m => (pc(m) * (pc(m) - 1) / 2) % 2 ? -1 : 1;
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const sqS = n => Array.from({ length: n }, (_, i) => (i ? -1 : 1)), sqI = m => Array(m).fill(-1);
const gensOf = m => { const g = []; for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) g.push(1 << i | 1 << j); return g; };
const CELL = { 2: [1, 4, 1], 3: [1, 4, 2], 4: [2, 4, 1], 5: [4, 2, 1], 6: [8, 1, 1], 7: [8, 1, 2], 8: [16, 1, 1] };    // N, dim K, summands for Cl(0,m)
const prod = (masks, sq) => { let m = 0, s = 1; for (const x of masks) { const [mm, ss] = bm(m, x, sq); m = mm; s *= ss; } return [m, s]; };
// ---- counts by enumeration, equation by equation
function enumerate(n, m) {
  const sq = sqS(n), si = sqI(m), g = gensOf(m), G = g.length, ev = [...Array(1 << n).keys()].filter(x => pc(x) % 2 === 0), tg = new Map();
  const add = (k, v) => { const key = k[0] + ',' + k[1]; if (!tg.has(key)) tg.set(key, { d: 0, g: 0, m: 0 }); tg.get(key)[v]++; };
  for (const S0 of ev) for (let T = 0; T < 1 << m; T++) {
    for (let mu = 0; mu < n; mu++) { const [t1] = bm(1 << mu, S0, sq), [o] = bm(t1, 6, sq); add([o, T], 'd'); for (let a = 0; a < G; a++) { const [t] = bm(g[a], T, si); add([o, t], 'g'); } }
    add([S0 ^ 1, T], 'm'); }
  let uniform = true; for (const v of tg.values()) if (v.d !== n || v.g !== n * G || v.m !== 1) uniform = false;
  return { targets: tg.size, uniform, total: [...tg.values()].reduce((s, v) => s + v.d + v.g + v.m, 0) };
}
for (let m = 2; m <= 6; m++) { const r = K.mt.ladder[m], e = enumerate(4, m), G = C(m, 2);
  ok(e.uniform && e.targets === r.equations && e.total === r.terms_total && r.terms_per_equation === 4 * (G + 1) + 1 && r.gauge_terms_per_equation === 4 * G && r.components === 8 * 2 ** m && r.gens === G, `m=${m} n=4: counts by enumeration`); }
for (let m = 7; m <= 8; m++) { const r = K.mt.ladder[m], G = C(m, 2); ok(r.components === 8 * 2 ** m && r.terms_per_equation === 4 * (G + 1) + 1 && r.terms_total === r.components * r.terms_per_equation && r.gauge_terms_total === r.components * 4 * G, `m=${m}: counts from the formula`); }
for (let n = 3; n <= 6; n++) { const r = K.mt.spacetime[n], e = enumerate(n, 3); ok(e.uniform && e.total === r.terms_total && r.terms_per_equation === n * 4 + 1 && r.gauge_terms_per_equation === 3 * n && r.components === 2 ** (n - 1) * 8, `m=3 n=${n}: counts by enumeration`); }
for (let m = 2; m <= 8; m++) { const r = K.mt.ladder[m], [N, dk, sm] = CELL[m]; ok(r.internal_dim === 2 ** m && r.minimal_module_real_dim === N * dk && r.copies_of_each_module === N && r.summands === sm && sm * N * N * dk === 2 ** m, `m=${m}: internal algebra and module sizes`); }
// ---- the current: corner masks and monomial counts, recomputed
for (const [n, m] of [[4, 2], [4, 3], [4, 4], [4, 5]]) { const sq = sqS(n), si = sqI(m), g = gensOf(m), ev = [...Array(1 << n).keys()].filter(x => pc(x) % 2 === 0), r = K.mt.ladder[m];
  for (let nu = 0; nu < n; nu++) { ok(r.current_corner_masks[nu] === ((1 << nu) ^ 7) && r.current_corner_distance[nu] === pc((1 << nu) ^ 7), `m=${m}: corner mask of direction ${nu}`);
    const coef = new Map(); const a = 0;
    for (const S0 of ev) for (const S2 of ev) { const [mk, sg] = prod([S0, 1 << nu, S2, 1, 6], sq); if (mk !== 0) continue; if ((S0 ^ S2) !== r.current_corner_masks[nu]) ok(false, 'mask'); for (let T = 0; T < 1 << m; T++) { const [t, s] = bm(g[a], T, si); const c = sg * -1 * rv(S0) * sq[nu] * s; const key = [[S0, T], [S2, t]].sort((x, y) => x[0] - y[0] || x[1] - y[1]).join('|'); coef.set(key, (coef.get(key) || 0) + c); } }
    ok([...coef.values()].filter(c => c !== 0).length === r.current_monomials_per_component[nu] && r.current_monomials_per_component[nu] === 2 ** (n + m - 2), `m=${m} nu=${nu}: monomials ${2 ** (n + m - 2)}`); } }
// ---- an independent exact check, with integers: conservation of the current at points where the matter equation holds
function conservation(n, m, seed, flip) {
  let st = seed; const rnd = () => { st = (st * 1103515245 + 12345) & 0x7fffffff; return (st >> 8) % 7 - 3; };
  const sq = sqS(n), si = sqI(m), g = gensOf(m), G = g.length, ev = [...Array(1 << n).keys()].filter(x => pc(x) % 2 === 0), gg = 3, mass = 5, key = (S0, T) => S0 + ':' + T;
  const f = {}; g.forEach((a, i) => g.forEach((b, j) => { const [m1, s1] = bm(a, b, si), [m2, s2] = bm(b, a, si); if (s1 !== s2) f[i + ',' + j] = [g.indexOf(m1), s1 - s2]; }));
  const rndField = () => { const o = new Map(); for (const S0 of ev) for (let T = 0; T < 1 << m; T++) o.set(key(S0, T), rnd()); return o; };
  const Psi = rndField(), A = Array.from({ length: n }, () => Array.from({ length: G }, rnd)), dPsi = Array.from({ length: n }, rndField);
  const parse = k => k.split(':').map(Number), addTo = (mp, k, v) => mp.set(k, (mp.get(k) || 0) + v);
  const lm = (a, X) => { const o = new Map(); for (const [k, v] of X) { const [S0, T] = parse(k), [t, s] = bm(g[a], T, si); addTo(o, key(S0, t), s * v); } return o; };
  const gam = (mu, X) => { const o = new Map(); for (const [k, v] of X) { const [S0, T] = parse(k), [t, s] = bm(1 << mu, S0, sq); addTo(o, key(t, T), s * sq[mu] * v); } return o; };
  const rmask = (mask, coef, X) => { const o = new Map(); for (const [k, v] of X) { const [S0, T] = parse(k), [t, s] = bm(S0, mask, sq); addTo(o, key(t, T), s * coef * v); } return o; };
  const plus = (X, Y, c = 1) => { const o = new Map(X); for (const [k, v] of Y) addTo(o, k, c * v); return o; };
  const Eval = dP => { let tot = new Map(); for (let mu = 0; mu < n; mu++) { let D = new Map(dP[mu]); for (let a = 0; a < G; a++) if (A[mu][a]) D = plus(D, lm(a, Psi), gg * A[mu][a]); tot = plus(tot, rmask(6, -1, gam(mu, D))); } return plus(tot, rmask(1, 1, Psi), -mass); };
  dPsi[0] = new Map(); const R0 = Eval(dPsi), Z = new Map();
  for (const [k, v] of R0) { const [S0, T] = parse(k), [a1, s1] = bm(1, S0, sq), [b1, s2] = bm(a1, 6, sq); addTo(Z, key(b1, T), -s1 * s2 * v); } dPsi[0] = Z;
  ok([...Eval(dPsi).values()].every(v => v === 0), `JS: E = 0 reached at n=${n} m=${m}`);
  const Bn = (Phi, Ps, nu) => { let tot = 0; for (const [k, v] of Phi) { const [S0, T] = parse(k); for (const S2 of ev) { const w = Ps.get(key(S2, T)); if (!w) continue; const [mk, s] = prod([S0, 1 << nu, S2, 1, 6], sq); if (mk === 0) tot += v * w * s * -1 * rv(S0) * sq[nu]; } } return tot; };
  let anyNonzero = false, allZero = true;
  for (let a = 0; a < G; a++) { let div = 0; const La = lm(a, Psi);
    for (let nu = 0; nu < n; nu++) div += Bn(dPsi[nu], La, nu) + Bn(Psi, lm(a, dPsi[nu]), nu);
    for (const [k, [c, v]] of Object.entries(f).map(([k, [c, v]]) => [k, [c, v]])) { const [aa, b] = k.split(',').map(Number); if (c === a) { for (let nu = 0; nu < n; nu++) div += (flip ? -1 : 1) * gg * v * A[nu][aa] * Bn(Psi, lm(b, Psi), nu); } }
    // f[(aa,b)] = [c, v] means [B_aa, B_b] = v B_c; the gauge term of D^nu j^a is g f^a_bc A^b j^c: sum over (b, c) with [B_b, B_c] containing B_a
    if (div !== 0) allZero = false; for (let nu = 0; nu < n; nu++) if (Bn(Psi, La, nu) !== 0) anyNonzero = true; }
  return { allZero, anyNonzero };
}
for (const [n, m, s] of [[3, 2, 3], [3, 3, 5], [4, 3, 7]]) { const r = conservation(n, m, s, false); ok(r.allZero && r.anyNonzero, `JS: D·j = 0 on shell at n=${n}, m=${m}, with a non-zero current`); }
{ const r = conservation(4, 3, 9, true); ok(!r.allZero, 'JS: a wrong sign of g breaks conservation at n=4, m=3'); }
for (const k of Object.keys(K.mt.identities)) { const v = K.mt.identities[k]; ok(v.commutator_identity && v.gauge_covariance_of_E_first_order && v.conserved_on_shell && v.adjoint_covariance && v.abelian_current_equals_step3_X && v.current_is_not_zero, `stored identities ${k}`); }
ok(Object.keys(K.mt.identities).join() === '3,2,3,3,4,2,4,3,4,4,5,3', 'identity pairs');
// ---- the picture: the parity halves of the internal cube are demicubes, each generator a perfect matching
for (let m = 2; m <= 6; m++) { const [ev, od] = internalHalves(m); ok(ev.length === 2 ** (m - 1) && od.length === 2 ** (m - 1) && halfEdges(m, 0).length === 2 ** (m - 2) * C(m, 2) && halfEdges(m, 1).length === halfEdges(m, 0).length, `m=${m}: halves and their edge counts`);
  for (const gm of gensOf(m)) for (const h of [0, 1]) { const es = halfEdges(m, h).filter(([a, b]) => (a ^ b) === gm), seen = new Set(es.flat()); ok(es.length === 2 ** (m - 2) && seen.size === 2 ** (m - 1), `m=${m}: generator ${gm} is a perfect matching of half ${h}`); } }
for (let m = 3; m <= 5; m++) ok(S.demicube.rows[m].vertices === 2 ** (m - 1) && S.demicube.rows[m].edges === halfEdges(m, 0).length, `m=${m}: each half is the ${m}-demicube of the shapes page`);
// ---- the numpy results
const M = K.matrix;
ok(Object.keys(M.max_error_equation).join() === '3,2,3,3,4,2,4,3,4,4' && Object.values(M.max_error_equation).every(x => x < 1e-9), 'matrix: tiny errors for five pairs');
ok(Object.values(M.current).every(v => v.equals_part_of_spinor_bilinear === 'im' && v.abs_constant === 1), 'matrix: currents equal the imaginary part of the spinor bilinear');
ok(Object.keys(M.controls).length === 4 && Object.values(M.controls).every(v => /fails/.test(v)), 'matrix: four negative controls fail');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it) && keys(COPY.en.dl) === keys(COPY.it.dl), 'copy keys');
for (const lang of ['en', 'it']) { const t = COPY[lang];
  for (let m = 2; m <= 8; m++) { const v = t.views({ ...K.mt.ladder[m], m_value: m }); ok(v.length === 6, `${lang} m=${m}: 6 views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} tag ${g}`); ok(t.picCap(m, 1, 1) && t.picBig(m) && t.viewsH(m), `${lang} m=${m} captions`); }
  ok(t.selCap('12', 2) && t.selNone, `${lang} selection captions`);
  for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`);
  const all = JSON.stringify([t, [2, 3, 4, 5, 6, 7, 8].map(m => t.views({ ...K.mt.ladder[m], m_value: m }))]); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|terms|blades)\b/]) ok(!b.test(all), `${lang} banned ${b}`);
  ok(t.open.length === 3 && t.xr.length === 4, `${lang} lists`); }
ok(/no action here/.test(COPY.en.open[0][1]) && /Nothing here selects three generations/.test(COPY.en.open[2][1]) && /chirality is not treated/.test(COPY.en.open[1][1]) && /standard Dirac field/.test(COPY.en.xr[3][1]), 'open items and the standard flag are stated');
ok(/wrong sign of g breaks it/.test(COPY.en.idNote), 'the negative control is stated');
// ---- tally, nav, wiring
ok(EQC.en.nav.length === 8 && EQC.it.nav.length === 8 && EQC.en.t.rows.length === 8 && EQC.it.t.rows.length === 8, 'tally and nav have the matter entry');
ok(EQC.en.t.rows[5][2] === '64 in 4D at m = 3' && EQC.en.t.rows[5][3] === '1088 in 4D at m = 3', 'tally row from the data');
const pg = fs.readFileSync('./EquationsSection.jsx', 'utf8'); ok(/MatterSection/.test(pg) && /eq-matter/.test(pg), 'section wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL MATTER TESTS PASS'); process.exit(bad ? 1 : 0);
