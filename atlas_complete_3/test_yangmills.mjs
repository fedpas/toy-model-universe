import fs from 'fs';
import K from './yangmillsData.js';
import COPY, { gensOf, graphEdges, gname } from './yangmillsCopy.js';
import EQC from './equationsCopy.js';
import E from './equationsData.js';
import S from './shapesData.js';
import { YM_PY, YMM_PY } from './yangmillsSelfcheckSource.js';
import { STORY } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// ---- shipped data and scripts are the files
const J = JSON.parse(fs.readFileSync('./selfcheck/yangmills.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/yangmills_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.ym) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(YM_PY === fs.readFileSync('./selfcheck/yangmills_selfcheck.py', 'utf8') && YMM_PY === fs.readFileSync('./selfcheck/yangmills_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(YM_PY) && /ALL YANG-MILLS CHECKS PASS/.test(YM_PY) && /ALL YANG-MILLS MATRIX CHECKS PASS/.test(YMM_PY), 'script interfaces');
// ---- an independent Clifford product and structure constants (written here)
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const bm = (a, b, sq) => { let s = 1; for (let i = 0; i < sq.length; i++) if (b >> i & 1 && pc(a >> (i + 1)) % 2) s = -s; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const CELL = ['M1(H)', 'M1(H) + M1(H)', 'M2(H)', 'M4(C)', 'M8(R)', 'M8(R) + M8(R)', 'M16(R)'], EVEN = ['M1(C)', 'M1(H)', 'M1(H) + M1(H)', 'M2(H)', 'M4(C)', 'M8(R)', 'M8(R) + M8(R)'];
function algebra(m) {
  const sq = Array(m).fill(-1), g = gensOf(m), f = new Map();
  g.forEach((ga, a) => g.forEach((gb, b) => { const [m1, s1] = bm(ga, gb, sq), [m2, s2] = bm(gb, ga, sq); if (m1 !== m2) throw 1; if (s1 !== s2) f.set(a + ',' + b, [g.indexOf(m1), s1 - s2]); }));
  return { g, f };
}
for (let m = 2; m <= 8; m++) {
  const r = K.ym.ladder[m], { g, f } = algebra(m), G = g.length;
  ok(G === C(m, 2) && r.gens === G, `m=${m}: generators`);
  ok(r.algebra_cell === CELL[m - 2] && r.even_half === EVEN[m - 2], `m=${m}: Cl(0,${m}) and its even half`);
  ok([...f.values()].every(([c, v]) => c >= 0 && Math.abs(v) === 2), `m=${m}: commutators are ±2 times a bivector`);
  const fc = (a, b, c) => { const e = f.get(a + ',' + b); return e && e[0] === c ? e[1] : 0; };
  let anti = true; for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) for (let c = 0; c < G; c++) if (fc(a, b, c) !== -fc(b, a, c) || fc(a, b, c) !== -fc(a, c, b)) anti = false; ok(anti, `m=${m}: f is totally antisymmetric`);
  let jac = true; for (let a = 0; a < G && jac; a++) for (let b = 0; b < G && jac; b++) for (let c = 0; c < G && jac; c++) for (let d = 0; d < G; d++) { let t = 0; for (let e = 0; e < G; e++) t += fc(a, b, e) * fc(e, c, d) + fc(b, c, e) * fc(e, a, d) + fc(c, a, e) * fc(e, b, d); if (t) { jac = false; break; } } ok(jac, `m=${m}: Jacobi identity, every quadruple`);
  const pairs = new Set([...f.keys()].map(k => k.split(',').map(Number).sort((x, y) => x - y).join())).size;
  ok(pairs === 3 * C(m, 3) && pairs === m * (m - 1) * (m - 2) / 2 && r.noncommuting_pairs === pairs && r.commuting_pairs === C(G, 2) - pairs && r.triangles === C(m, 3), `m=${m}: non-commuting pairs, commuting pairs, triangles`);
  ok(graphEdges(m).length === pairs && r.neighbours_of_each_generator === 2 * (m - 2), `m=${m}: graph edges = pairs; neighbours 2(m-2)`);
  for (let a = 0; a < G; a++) ok(graphEdges(m).filter(([x, y]) => x === g[a] || y === g[a]).length === 2 * (m - 2), `m=${m}: degree of generator ${a}`);
  // each index triple is a closed so(3)
  let tri = true; for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) for (let k = j + 1; k < m; k++) { const a = g.indexOf(1 << i | 1 << j), b = g.indexOf(1 << j | 1 << k), c = g.indexOf(1 << i | 1 << k); const e1 = f.get(a + ',' + b), e2 = f.get(b + ',' + c), e3 = f.get(a + ',' + c); if (!(e1 && e1[0] === c && e2 && e2[0] === a && e3 && e3[0] === b)) tri = false; } ok(tri, `m=${m}: every index triple is a closed triangle`);
  // every non-commuting pair lies in exactly one triangle: the pair's union is three indices
  const trs = new Map(); for (const [a, b] of graphEdges(m)) { const u = a | b; trs.set(u, (trs.get(u) || 0) + 1); } ok(trs.size === C(m, 3) && [...trs.values()].every(v => v === 3 && true), `m=${m}: each pair in exactly one triangle, three edges each`);
  ok(m > 5 ? r.labels === null : JSON.stringify(r.labels) === JSON.stringify(g), `m=${m}: labels are the masks of the pairs, in order`);
  // cross-checks with the earlier pages
  if (m >= 3) { ok(S.demicube.rows[m].edges_by_grade_pair['2-2'] === pairs, `m=${m}: demicube 2-2 edges = non-commuting pairs`); ok(E.eq.commutators.by_n[m].edges === pairs && E.eq.commutators.by_n[m].triangles === C(m, 3), `m=${m}: step-1 table agrees`); }
}
// ---- counts by enumeration: ordered pairs (b, c) with [B_b, B_c] containing B_a
function counts(m, ns) { const { g, f } = algebra(m), G = g.length, ord = Array.from({ length: G }, () => 0); for (const [k, [c]] of f) ord[c]++; ok(ord.every(x => x === 2 * (m - 2)), `ordered pairs per generator m=${m}`);
  const tri = C(ns, 3), q = 2 * (m - 2), deriv = G * ns * (ns - 1), gauge = G * ns * (ns - 1) * q, bd = G * tri * 3, bg = G * tri * 3 * q;
  return { F_components: G * C(ns, 2), quadratic_terms_per_F_component: q, equations: G * ns, equation_derivative_terms: deriv, equation_gauge_terms: gauge, equation_terms: deriv + gauge, bianchi_equations: G * tri, bianchi_derivative_terms: bd, bianchi_gauge_terms: bg, bianchi_terms: bd + bg }; }
for (let m = 2; m <= 8; m++) { const c = counts(m, 4), r = K.ym.ladder[m]; for (const k of Object.keys(c)) ok(r[k] === c[k], `m=${m} ns=4: ${k}`); }
for (let ns = 2; ns <= 6; ns++) { const c = counts(3, ns), r = K.ym.spacetime[ns]; for (const k of Object.keys(c)) ok(r[k] === c[k], `m=3 ns=${ns}: ${k}`); }
// ---- m = 2 is Maxwell: vector terms + Bianchi terms = n C(n,2) = the incidences of the Maxwell page
for (let ns = 2; ns <= 7; ns++) { const c = counts(2, ns); ok(c.equation_terms + c.bianchi_terms === ns * C(ns, 2) && c.equation_gauge_terms === 0 && c.bianchi_gauge_terms === 0, `m=2 reproduces n C(n,2), n=${ns}`); ok(K.ym.maxwell_reduction[ns].total === ns * C(ns, 2), `stored Maxwell reduction n=${ns}`); if (ns >= 3) ok(S.demicube.maxwell[ns].incidences === ns * C(ns, 2), `Maxwell page incidences n=${ns}`); }
// ---- so(4) = two commuting triples
{ const { g, f } = algebra(4), idx = x => g.indexOf(x), br = (X, Y) => { const r = Array(6).fill(0); for (const [k, [c, v]] of f) { const [a, b] = k.split(',').map(Number); r[c] += X[a] * Y[b] * v; } return r; };
  const mk = sign => [[[0, 1], [2, 3], 1], [[0, 2], [1, 3], -1], [[0, 3], [1, 2], 1]].map(([p, q, s]) => { const v = Array(6).fill(0); v[idx(1 << p[0] | 1 << p[1])] = 1; v[idx(1 << q[0] | 1 << q[1])] += sign * s; return v; });
  const X = mk(1), Y = mk(-1); ok(X.every(x => Y.every(y => br(x, y).every(v => v === 0))), 'so(4): the two triples commute');
  const closed = S0 => S0.every((x, i) => S0.every((y, j) => i >= j || (() => { const r = br(x, y); return S0.some(z => [2, -2, 4, -4].some(t => r.every((v, k) => v === t * z[k]))); })())); ok(closed(X) && closed(Y), 'so(4): each triple closes'); ok(K.ym.so4_split.self_dual_signs.join() === '1,-1,1', 'so(4): stored signs'); }
// ---- an independent exact polynomial engine: Bianchi, covariance and conservation (integer coefficients)
const padd = (a, b, c = 1) => { const r = new Map(a); for (const [k, v] of b) { const x = (r.get(k) || 0) + c * v; if (x === 0) r.delete(k); else r.set(k, x); } return r; };
const pmul = (a, b) => { const r = new Map(); for (const [k1, v1] of a) for (const [k2, v2] of b) { const k = k1.split(',').map((x, i) => +x + +k2.split(',')[i]).join(); const x = (r.get(k) || 0) + v1 * v2; if (x === 0) r.delete(k); else r.set(k, x); } return r; };
const pder = (a, i) => { const r = new Map(); for (const [k, v] of a) { const e = k.split(',').map(Number); if (e[i]) { e[i]--; const kk = e.join(); r.set(kk, (r.get(kk) || 0) + v * (e[i] + 1)); } } return r; };
const psc = (a, c) => { const r = new Map(); if (c !== 0) for (const [k, v] of a) r.set(k, v * c); return r; };
const peq = (a, b) => { const d = padd(a, b, -1); return d.size === 0; };
function identities(m, ns, seed) {
  let st = seed; const rnd = n => { st = (st * 1103515245 + 12345) & 0x7fffffff; return st % n; };
  const { f } = algebra(m), G = C(m, 2), g = 3, eta = Array.from({ length: ns }, (_, i) => (i ? -1 : 1)), zero = () => Array.from({ length: G }, () => new Map());
  const rpoly = deg => { const p = new Map(); const mons = []; const rec = (i, left, cur) => { if (i === ns) { mons.push(cur.join()); return; } for (let e = 0; e <= left; e++) rec(i + 1, left - e, [...cur, e]); }; rec(0, deg, []); for (const mo of mons) if (rnd(10) < 6) { const v = rnd(7) - 3; if (v) p.set(mo, v); } if (!p.size) p.set(Array(ns).fill(0).join(), 1); return p; };
  const add = (X, Y, c = 1) => X.map((x, a) => padd(x, Y[a], c)), d = (X, mu) => X.map(x => pder(x, mu));
  const br = (X, Y) => { const r = zero(); for (const [k, [c, v]] of f) { const [a, b] = k.split(',').map(Number); if (X[a].size && Y[b].size) r[c] = padd(r[c], pmul(X[a], Y[b]), v); } return r; };
  const D = (A, X, mu) => add(d(X, mu), br(A[mu], X), g), Fm = (A, mu, nu) => add(add(d(A[nu], mu), d(A[mu], nu), -1), br(A[mu], A[nu]), g);
  const A = Array.from({ length: ns }, () => Array.from({ length: G }, () => rpoly(1))), F = (mu, nu) => Fm(A, mu, nu), res = { bianchi: true, cov: true, cons: true };
  const eqz = X => X.every(x => x.size === 0);
  for (let l = 0; l < ns; l++) for (let mu = l + 1; mu < ns; mu++) for (let nu = mu + 1; nu < ns; nu++) if (!eqz(add(add(D(A, F(mu, nu), l), D(A, F(nu, l), mu)), D(A, F(l, mu), nu)))) res.bianchi = false;
  const lam = Array.from({ length: G }, () => rpoly(2)), dA = Array.from({ length: ns }, (_, mu) => D(A, lam, mu));
  for (let mu = 0; mu < ns; mu++) for (let nu = mu + 1; nu < ns; nu++) { const dF = add(add(d(dA[nu], mu), d(dA[mu], nu), -1), add(br(dA[mu], A[nu]), br(A[mu], dA[nu])), g), want = br(F(mu, nu), lam).map(p => psc(p, g)); if (!dF.every((p, a) => peq(p, want[a]))) res.cov = false; }
  let div = zero(); const Jn = []; for (let nu = 0; nu < ns; nu++) { let s = zero(); for (let mu = 0; mu < ns; mu++) if (mu !== nu) s = add(s, D(A, F(mu, nu), mu), eta[mu]); Jn.push(s); }
  for (let nu = 0; nu < ns; nu++) div = add(div, D(A, Jn[nu], nu), eta[nu]); if (!eqz(div)) res.cons = false;
  // negative control: a wrong sign in D must break Bianchi
  const Dbad = (A_, X, mu) => add(d(X, mu), br(A_[mu], X), -g); let broke = false; for (let l = 0; l < ns; l++) for (let mu = l + 1; mu < ns; mu++) for (let nu = mu + 1; nu < ns; nu++) if (m >= 3 && !eqz(add(add(Dbad(A, F(mu, nu), l), Dbad(A, F(nu, l), mu)), Dbad(A, F(l, mu), nu)))) broke = true;
  return { ...res, broke: m >= 3 ? broke : true };
}
for (const [m, ns] of [[2, 3], [3, 3], [3, 4], [4, 4]]) { const r = identities(m, ns, 7 * m + ns); ok(r.bianchi && r.cov && r.cons, `JS engine: Bianchi, covariance and conservation hold at m=${m}, ns=${ns}`); ok(r.broke, `JS engine: wrong sign of g breaks Bianchi at m=${m}, ns=${ns}`); ok(K.ym.identities[m + ',' + ns], `stored identities for ${m},${ns}`); }
for (const k of Object.keys(K.ym.identities)) { const v = K.ym.identities[k]; ok(v.bianchi && v.gauge_covariance_first_order && v.covariant_conservation, `stored identities ${k}`); }
// ---- the numpy results
const M = K.matrix;
for (const key of ['max_error_representation', 'max_error_field_strength', 'max_error_bianchi']) ok(Object.keys(M[key]).join() === '2,3,4,5,6' && Object.values(M[key]).every(x => x < 1e-9), `matrix: ${key}`);
ok(Object.keys(M.controls).length === 2 && Object.values(M.controls).every(v => /fails/.test(v)), 'matrix: two negative controls fail');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it), 'copy keys'); ok(keys(COPY.en.dl) === keys(COPY.it.dl), 'dl keys');
for (const lang of ['en', 'it']) { const t = COPY[lang];
  for (let m = 2; m <= 8; m++) { const v = t.views({ ...K.ym.ladder[m], m_value: m }); ok(v.length === (m === 4 ? 7 : 6), `${lang} m=${m}: ${v.length} views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} tag ${g}`); ok(t.graphCap(m) && t.viewsH(m), `${lang} m=${m} captions`); }
  ok(t.selCap('12', [['23', '13']]) && t.selNone, `${lang} selection captions`);
  for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`);
  const all = JSON.stringify([t, [2, 3, 4, 5, 6, 7, 8].map(m => t.views({ ...K.ym.ladder[m], m_value: m }))]); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|bivectors|triangles|edges|terms)\b/]) ok(!b.test(all), `${lang} banned ${b}`);
  ok(t.open.length === 3 && t.xr.length === 4, `${lang} lists`); }
ok(/no action is rebuilt/.test(COPY.en.open[0][1]) && /Nothing here selects three generations/.test(COPY.en.open[2][1]) && /Gravity is still not drawn/.test(COPY.en.open[2][1]) && /Nothing here is new/.test(COPY.en.xr[3][1]), 'open items and the standard flag are stated');
ok(/Jacobi/.test(COPY.en.idNote) && /Jacobi/.test(COPY.it.idNote), 'Bianchi needs Jacobi');
// ---- tally, nav, wiring
ok(EQC.en.t.rows.length === 8 && EQC.it.t.rows.length === 8 && EQC.en.nav.length === 8 && EQC.it.nav.length === 8, 'tally and nav have the Yang–Mills entry');
ok(EQC.en.t.rows[4][2] === '18 in 4D at m = 3' && EQC.en.t.rows[4][3] === '216 in 4D at m = 3', 'tally row from the data');
const pg = fs.readFileSync('./EquationsSection.jsx', 'utf8'); ok(/YangMillsSection/.test(pg) && /eq-ym/.test(pg), 'section wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL YANG-MILLS TESTS PASS'); process.exit(bad ? 1 : 0);
