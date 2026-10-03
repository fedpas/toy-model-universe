import { eqNavIds } from './steps.js';
import fs from 'fs';
import K from './gravityData.js';
import COPY, { planes, pairClass, subsets4 } from './gravityCopy.js';
import EQC from './equationsCopy.js';
import { GV_PY, GVM_PY } from './gravitySelfcheckSource.js';
import { STORY } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const J = JSON.parse(fs.readFileSync('./selfcheck/gravity.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/gravity_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.gv) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(GV_PY === fs.readFileSync('./selfcheck/gravity_selfcheck.py', 'utf8') && GVM_PY === fs.readFileSync('./selfcheck/gravity_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(GV_PY) && /ALL GRAVITY CHECKS PASS/.test(GV_PY) && /ALL GRAVITY MATRIX CHECKS PASS/.test(GVM_PY), 'script interfaces');
ok(!/if False|calc/.test(GV_PY), 'no dead code left in the self-check');
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
// ---- an independent Clifford product: the sign is the parity of the swaps needed to sort, times the squares of repeated generators
const cm = (a, b, sq) => { let sw = 0; for (let j = 0; j < sq.length; j++) if (b >> j & 1) for (let i = j + 1; i < sq.length; i++) if (a >> i & 1) sw++; let s = sw % 2 ? -1 : 1; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const sqL = n => Array.from({ length: n }, (_, i) => (i ? -1 : 1));
// ---- the Lorentz algebra: bivector commutators f and vector action h
function lie(sq) {
  const N = sq.length, gens = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) gens.push(1 << i | 1 << j);
  const f = [], h = [];
  gens.forEach((ga, a) => { f[a] = []; gens.forEach((gb, b) => { const [m1, s1] = cm(ga, gb, sq), [m2, s2] = cm(gb, ga, sq); f[a][b] = s1 === s2 ? null : [gens.indexOf(m1), s1 - s2]; });
    h[a] = []; for (let b = 0; b < N; b++) { const [m1, s1] = cm(ga, 1 << b, sq), [, s2] = cm(1 << b, ga, sq); h[a][b] = s1 === s2 ? null : [Math.log2(m1), (s1 - s2) / 2]; } });
  return { gens, f, h, G: gens.length };
}
// ---- counts by enumeration
for (let n = 2; n <= 8; n++) {
  const r = K.gv.ladder[n], L = lie(sqL(n)), G = L.G, P = C(n, 2);
  ok(r.bivectors === G && r.boosts === n - 1 && r.rotations === C(n - 1, 2) && r.boosts + r.rotations === G, `n=${n}: bivectors, boosts, rotations`);
  ok(r.omega_components === n * G && r.tetrad_components === n * n && r.curvature_components === G * P && r.torsion_components === n * P, `n=${n}: component counts`);
  ok(r.poincare_generators === G + n && r.desitter_generators === C(n + 1, 2) && r.desitter_generators === r.poincare_generators && r.desitter_curvature_components === C(n + 1, 2) * P, `n=${n}: Poincare and de Sitter counts`);
  const pl = planes(n); let dg = 0, one = 0, dis = 0; for (let i = 0; i < pl.length; i++) for (let j = i; j < pl.length; j++) { const c = pairClass(pl[i], pl[j]); if (c === 'diagonal') dg++; else if (c === 'one') one++; else dis++; }
  ok(r.pair_classes.diagonal === dg && r.pair_classes.share_one_index === one && r.pair_classes.disjoint === dis, `n=${n}: pair classes by enumeration`);
  // the share-one class is the commutator graph: pairs of planes with a non-zero commutator, counted from the product
  let comm = 0; for (let a = 0; a < G; a++) for (let b = a + 1; b < G; b++) if (L.f[a][b]) comm++; ok(comm === one, `n=${n}: the share-one pairs are exactly the pairs that do not commute`);
  ok(dg + one + dis - C(n, 4) === r.riemann_independent && r.riemann_independent === n * n * (n * n - 1) / 12 && r.first_bianchi_constraints === C(n, 4) && subsets4(n).length === C(n, 4), `n=${n}: Riemann count from classes minus relations`);
  // the terms of E_a counted from the definition: pairs {b, c} of the other axes; each term carries n-3 tetrads; the torsion terms replace one tetrad at a time
  let terms = 0, tors = 0; if (n >= 3) { const a = 0, o = [...Array(n).keys()].filter(x => x !== a); for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) { terms++; tors += n - 3; } }
  ok(r.einstein_terms_per_component === terms && r.divergence_torsion_terms_per_component === tors && r.einstein_components === (n >= 3 ? n * n : 0), `n=${n}: Einstein-form term counts from the definition`);
}
for (let n = 4; n <= 8; n++) { const pl = planes(n), disj = []; for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) if (!(pl[i] & pl[j])) disj.push([i, j]); ok(disj.length === K.gv.ladder[n].pair_classes.disjoint, `n=${n}: disjoint pairs`); }
{ const pl = planes(4), anti = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if ((pl[i] ^ pl[j]) === 15) anti.push(1); ok(anti.length === 3 && K.gv.ladder[4].pair_classes.disjoint === 3, 'n=4: the disjoint pairs are the 3 antipodal pairs of the 16-cell'); }
// ---- the Jacobi identity for f and the frame frame action
for (let n = 2; n <= 5; n++) { const L = lie(sqL(n)), G = L.G; let jac = true;
  const br = (u, v) => { const out = Array(G).fill(0); for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) if (u[a] && v[b] && L.f[a][b]) out[L.f[a][b][0]] += u[a] * v[b] * L.f[a][b][1]; return out; };
  const e = i => Array.from({ length: G }, (_, k) => (k === i ? 1 : 0));
  for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) for (let c = 0; c < G; c++) { const x = br(e(a), br(e(b), e(c))), y = br(e(b), br(e(c), e(a))), z = br(e(c), br(e(a), e(b))); for (let k = 0; k < G; k++) if (x[k] + y[k] + z[k] !== 0) jac = false; }
  ok(jac, `n=${n}: Jacobi identity for the bivector commutators`); }
// ---- an independent forms engine with polynomial coefficients (integers; fractions 1/4 and 1/2 are exact in doubles)
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }, ri = () => Math.floor(rnd() * 7) - 3;
const padd = (p, q, s = 1) => { const r = new Map(p); for (const [k, v] of q) { const w = (r.get(k) || 0) + s * v; if (w) r.set(k, w); else r.delete(k); } return r; };
const pmul = (p, q) => { const r = new Map(); for (const [k, v] of p) for (const [l, w] of q) { const key = k.split(',').map((x, i) => +x + +l.split(',')[i]).join(','); const z = (r.get(key) || 0) + v * w; if (z) r.set(key, z); else r.delete(key); } return r; };
const pder = (p, mu) => { const r = new Map(); for (const [k, v] of p) { const e = k.split(',').map(Number); if (e[mu] > 0) { const c = v * e[mu]; e[mu]--; const key = e.join(','), z = (r.get(key) || 0) + c; if (z) r.set(key, z); else r.delete(key); } } return r; };
const pscale = (p, s) => { const r = new Map(); if (s) for (const [k, v] of p) r.set(k, v * s); return r; };
const rpoly = n => { const r = new Map(), z = Array(n).fill(0); if (rnd() < .5) { const c = ri(); if (c) r.set(z.join(','), c); } for (let i = 0; i < n; i++) if (rnd() < .5) { const c = ri(), e = z.slice(); e[i] = 1; if (c) r.set(e.join(','), c); } return r; };
const fadd = (f, g, s = 1) => { const r = new Map(); for (const [m, p] of f) r.set(m, p); for (const [m, p] of g) { const q = padd(r.get(m) || new Map(), p, s); if (q.size) r.set(m, q); else r.delete(m); } return r; };
const fscale = (f, s) => { const r = new Map(); if (s) for (const [m, p] of f) r.set(m, pscale(p, s)); return r; };
const fwedge = (f, g) => { let r = new Map(); for (const [a, p] of f) for (const [b, q] of g) { if (a & b) continue; let sw = 0; for (let i = 0; i < 12; i++) if (a >> i & 1) for (let j = 0; j < i; j++) if (b >> j & 1) sw++; r = fadd(r, new Map([[a | b, pmul(p, q)]]), sw % 2 ? -1 : 1); } return r; };
const fd = (f, n) => { let r = new Map(); for (const [m, p] of f) for (let mu = 0; mu < n; mu++) { if (m >> mu & 1) continue; const dp = pder(p, mu); if (!dp.size) continue; let sw = 0; for (let i = 0; i < mu; i++) if (m >> i & 1) sw++; r = fadd(r, new Map([[m | 1 << mu, dp]]), sw % 2 ? -1 : 1); } return r; };
const rform = (n, deg) => { const r = new Map(); const rec = (start, chosen) => { if (chosen.length === deg) { if (rnd() < .9) { const p = rpoly(n); if (p.size) r.set(chosen.reduce((a, i) => a | 1 << i, 0), p); } return; } for (let i = start; i < n; i++) rec(i + 1, [...chosen, i]); }; rec(0, []); if (!r.size) { const z = Array(n).fill(0).join(','); r.set((1 << deg) - 1, new Map([[z, 1]])); } return r; };
const isZero = f => f.size === 0;
const feq = (f, g) => isZero(fadd(f, g, -1));
function identities(n) {
  const L = lie(sqL(n)), G = L.G, one = () => new Map(), om = Array.from({ length: G }, () => rform(n, 1)), e = Array.from({ length: n }, () => rform(n, 1));
  // R^C = d om^C + (1/4) f_AB^C om^A om^B
  const R = Array.from({ length: G }, (_, C) => { let r = fd(om[C], n); for (let A = 0; A < G; A++) for (let B = 0; B < G; B++) if (L.f[A][B] && L.f[A][B][0] === C) r = fadd(r, fwedge(om[A], om[B]), L.f[A][B][1] / 4); return r; });
  // D X^C = d X^C + (1/2) f_AB^C om^A X^B  (adjoint)
  let secondBianchi = true;
  for (let C = 0; C < G; C++) { let dr = fd(R[C], n); for (let A = 0; A < G; A++) for (let B = 0; B < G; B++) if (L.f[A][B] && L.f[A][B][0] === C) dr = fadd(dr, fwedge(om[A], R[B]), L.f[A][B][1] / 2); if (!isZero(dr)) secondBianchi = false; }
  // T^c = d e^c + h_Ab^c om^A e^b ; D T^c = d T^c + h_Ab^c om^A T^b = h_Ab^c R^A e^b
  const T = Array.from({ length: n }, (_, c) => { let t = fd(e[c], n); for (let A = 0; A < G; A++) for (let b = 0; b < n; b++) if (L.h[A][b] && L.h[A][b][0] === c) t = fadd(t, fwedge(om[A], e[b]), L.h[A][b][1]); return t; });
  let firstBianchi = true;
  for (let c = 0; c < n; c++) { let dt = fd(T[c], n), rhs = new Map(); for (let A = 0; A < G; A++) for (let b = 0; b < n; b++) if (L.h[A][b] && L.h[A][b][0] === c) { dt = fadd(dt, fwedge(om[A], T[b]), L.h[A][b][1]); rhs = fadd(rhs, fwedge(R[A], e[b]), L.h[A][b][1]); } if (!feq(dt, rhs)) firstBianchi = false; }
  const nonTrivial = R.some(x => !isZero(x)) && T.some(x => !isZero(x)) && R.some(x => [...x.values()].some(p => [...p.keys()].some(k => k.split(',').reduce((a, b) => a + +b, 0) === 2)));
  return { secondBianchi, firstBianchi, nonTrivial, om, e, R, T, L };
}
for (const n of [2, 3, 4]) { const r = identities(n); ok(r.secondBianchi, `JS: D R = 0 at n=${n}`); ok(r.firstBianchi, `JS: D T = R ^ e at n=${n}`); ok(n === 2 || r.nonTrivial, `JS: the random fields give a non-zero curvature (with quadratic terms) and torsion at n=${n}`); }
// a wrong version must fail: the Bianchi identity with the wrong factor in the adjoint derivative
{ const n = 3, L = lie(sqL(3)), G = L.G, om = Array.from({ length: G }, () => rform(n, 1));
  const R = Array.from({ length: G }, (_, C) => { let r = fd(om[C], n); for (let A = 0; A < G; A++) for (let B = 0; B < G; B++) if (L.f[A][B] && L.f[A][B][0] === C) r = fadd(r, fwedge(om[A], om[B]), L.f[A][B][1] / 4); return r; });
  let allZero = true; for (let C = 0; C < G; C++) { let dr = fd(R[C], n); for (let A = 0; A < G; A++) for (let B = 0; B < G; B++) if (L.f[A][B] && L.f[A][B][0] === C) dr = fadd(dr, fwedge(om[A], R[B]), L.f[A][B][1]); if (!isZero(dr)) allZero = false; }
  ok(!allZero, 'JS: a wrong factor in the adjoint derivative breaks D R = 0'); }
// ---- the Einstein form: D E_a = torsion terms only
function perm(seq) { let s = 1; for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) s = -s; return s; }
function einstein(n) {
  const { om, e, R, T, L } = identities(n), G = L.G, pl = L.gens;
  const Fb = (b, c) => R[pl.indexOf(1 << b | 1 << c)];
  const E = [], rhs = [];
  for (let a = 0; a < n; a++) { let tot = new Map(), tt = new Map();
    for (let b = 0; b < n; b++) for (let c = b + 1; c < n; c++) { if (a === b || a === c) continue; const rest = [...Array(n).keys()].filter(x => ![a, b, c].includes(x)), s = perm([a, b, c, ...rest]); let form = Fb(b, c); for (const d of rest) form = fwedge(form, e[d]); tot = fadd(tot, form, s);
      for (let j = 0; j < rest.length; j++) { let f2 = Fb(b, c); rest.forEach((d, jj) => { f2 = fwedge(f2, jj === j ? T[d] : e[d]); }); tt = fadd(tt, f2, s * (j % 2 ? -1 : 1)); } }
    E.push(tot); rhs.push(tt); }
  // covector derivative: (D w)_b = d w_b - V_A[c, b] om^A w_c, V_A[c, b] = h_Ab^c
  let ok_ = true;
  for (let b = 0; b < n; b++) { let dw = fd(E[b], n); for (let A = 0; A < G; A++) for (let c = 0; c < n; c++) if (L.h[A][b] && L.h[A][b][0] === c) dw = fadd(dw, fwedge(om[A], E[c]), -L.h[A][b][1]); if (!feq(dw, rhs[b])) ok_ = false; if (n === 3 && !isZero(dw)) ok_ = false; }
  if (n >= 4 && rhs.every(isZero)) ok_ = false;
  if (n === 3 && E.every(isZero)) ok_ = false;
  return ok_;
}
for (const n of [3, 4]) ok(einstein(n), `JS: D E_a equals the torsion terms (and vanishes at n=3) at n=${n}`);
// ---- the curvature space by linear algebra modulo a large prime (an independent route to n^2 (n^2-1)/12, Ricci rank and Weyl)
const PR = 1000003n, md = x => ((x % PR) + PR) % PR;
function inv(a) { let r = 1n, e = PR - 2n, b = md(a); while (e > 0n) { if (e & 1n) r = r * b % PR; b = b * b % PR; e >>= 1n; } return r; }
function rref(rows, ncols) { const M = rows.map(r => r.map(md)); const piv = []; let r = 0; for (let c = 0; c < ncols && r < M.length; c++) { let p = -1; for (let i = r; i < M.length; i++) if (M[i][c] !== 0n) { p = i; break; } if (p < 0) continue; [M[r], M[p]] = [M[p], M[r]]; const iv = inv(M[r][c]); M[r] = M[r].map(x => x * iv % PR); for (let i = 0; i < M.length; i++) if (i !== r && M[i][c] !== 0n) { const f = M[i][c]; M[i] = M[i].map((x, k) => md(x - f * M[r][k])); } piv.push(c); r++; } return { M: M.slice(0, r), piv }; }
function curvatureSpace(n, bianchi) {
  const pl = planes(n), P = pl.length, N = P * P, idx = new Map(pl.map((m, i) => [m, i])); const pair = (a, b) => (a < b ? [1, 1 << a | 1 << b] : [-1, 1 << a | 1 << b]);
  const v = (a, b, c, d) => { if (a === b || c === d) return null; const [s1, m1] = pair(a, b), [s2, m2] = pair(c, d); return [s1 * s2, idx.get(m1) * P + idx.get(m2)]; };
  const rows = []; if (bianchi) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) { const row = Array(N).fill(0n); for (const [x, y, z] of [[b, c, d], [c, d, b], [d, b, c]]) { const w = v(a, x, y, z); if (w) row[w[1]] += BigInt(w[0]); } if (row.some(x => x !== 0n)) rows.push(row); }
  const { M, piv } = rref(rows, N), free = [...Array(N).keys()].filter(c => !piv.includes(c)); const basis = free.map(fc => { const vec = Array(N).fill(0n); vec[fc] = 1n; piv.forEach((pc_, i) => { vec[pc_] = md(-M[i][fc]); }); return vec; });
  // Ricci Ric_{bd} = sum_a eta^{aa} R_{abad}
  const eta = a => (a ? -1n : 1n), ric = basis.map(vec => { const out = []; for (let b = 0; b < n; b++) for (let d = 0; d < n; d++) { let t = 0n; for (let a = 0; a < n; a++) { const w = v(a, b, a, d); if (w) t += eta(a) * BigInt(w[0]) * vec[w[1]]; } out.push(md(t)); } return out; });
  const rr = ric.length ? rref(ric, n * n).piv.length : 0; return { dim: N - piv.length, ricci: rr, weyl: N - piv.length - rr, N };
}
for (let n = 2; n <= 6; n++) { const s = curvatureSpace(n, true), c = K.gv.curvature_space[n]; ok(s.dim === c.dimension && s.dim === n * n * (n * n - 1) / 12 && s.ricci === c.ricci_rank && s.weyl === c.weyl_dimension, `n=${n}: curvature space by linear algebra mod p (${JSON.stringify(s)})`); }
{ const s = curvatureSpace(4, false); ok(s.dim === 36, 'n=4: without the first Bianchi identity there are 36 components'); }
ok([2, 3, 4, 5, 6, 7].map(n => K.gv.curvature_space[n].weyl_dimension).join() === '0,0,10,35,84,168', 'Weyl dimensions');
for (let n = 3; n <= 7; n++) ok(K.gv.curvature_space[n].ricci_rank === n * (n + 1) / 2 && K.gv.curvature_space[n].pair_symmetric, `n=${n}: Ricci rank n(n+1)/2 and pair symmetry`);
// ---- stored identities and constants
for (const n of [2, 3, 4, 5]) { const v = K.gv.identities[n]; ok(v.second_bianchi && v.first_bianchi && v.local_lorentz_covariance && v.spinor_commutator, `stored identities n=${n}`); }
ok(Object.keys(K.gv.einstein_identities).join() === '3,0,3,1,4,0,4,1,5,0' && Object.values(K.gv.einstein_identities).every(v => v.covariant_divergence_of_E_is_torsion_terms), 'stored Einstein identities');
ok(Object.values(K.gv.einstein_tensor_ratio).join() === '1,1,1', 'stored Einstein tensor ratio');
for (const n of [3, 4]) { ok(K.gv.desitter[`${n},dS`].coefficient_of_e_wedge_e === '1' && K.gv.desitter[`${n},AdS`].coefficient_of_e_wedge_e === '-1' && K.gv.desitter[`${n},dS`].coefficient_of_torsion === '1' && K.gv.desitter[`${n},AdS`].coefficient_of_torsion === '1', `de Sitter constants n=${n}`); ok(K.gv.desitter[`${n},dS`].extra_generator_square === -1 && K.gv.desitter[`${n},AdS`].extra_generator_square === 1, `extra generator squares n=${n}`); }
// the sign rule k = -s from the Clifford product: [B_an, B_bn] = -2 s B_ab
for (const s of [-1, 1]) for (const n of [3, 4, 5]) { const sq = [...sqL(n), s]; let good = true; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { const A = 1 << a | 1 << n, B = 1 << b | 1 << n, [m1, s1] = cm(A, B, sq), [m2, s2] = cm(B, A, sq); if (m1 !== (1 << a | 1 << b) || m2 !== m1 || s1 - s2 !== -2 * s) good = false; } ok(good, `n=${n}, s=${s}: [B_an, B_bn] = -2 s B_ab`); }
// ---- the numpy results
const M = K.matrix;
ok(Object.keys(M.structure_constants).join() === '2,3,4,5,6' && Object.keys(M.constant_connection_error).join() === '2,3,4,5,6', 'matrix: structure constants and constant-connection checks for n = 2..6');
ok(JSON.stringify(M.curvature_space) === JSON.stringify(K.gv.curvature_space), 'matrix: curvature space equals the exact one');
ok(Object.values(M.einstein_ratio).join() === '1,1,1', 'matrix: Einstein tensor ratio 1');
ok(Object.keys(M.desitter).length === 6 && Object.entries(M.desitter).every(([k, v]) => v.mu === '1' && v.k === (/AdS/.test(k) ? '-1' : '1')), 'matrix: de Sitter constants k = -s, mu = 1, n = 3..5');
ok(Object.keys(M.controls).length === 5 && Object.values(M.controls).every(v => /fails|not constant|dimension 36|changes sign/.test(v)), 'matrix: five negative controls');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it) && keys(COPY.en.g1) === keys(COPY.it.g1) && keys(COPY.en.g2) === keys(COPY.it.g2) && keys(COPY.en.g1.dl) === keys(COPY.it.g1.dl), 'copy keys');
for (const lang of ['en', 'it']) { const g1 = COPY[lang].g1, g2 = COPY[lang].g2;
  for (let n = 2; n <= 8; n++) for (const [t, name] of [[g1, 'g1'], [g2, 'g2']]) { const v = t.views({ ...K.gv.ladder[n], n_value: n }); ok(v.length === 7, `${lang} ${name} n=${n}: 7 views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} tag ${g}`); ok(t.picCap(n) && t.viewsH(n), `${lang} ${name} n=${n} captions`); }
  ok(g1.subCap('txyz', 'a') && g1.classCap('all') && g1.classCap('one', 3) && g2.capSel('x', 'y', ['z']) && g2.capSel('x', 'y', []) && g2.capNone, `${lang} selection captions`);
  for (const t of [g1, g2]) { for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`); ok(t.open.length === 3 && t.xr.length === 4, `${lang} lists`); }
  const all = JSON.stringify([g1, g2, [2, 3, 4, 5, 6, 7, 8].map(n => [g1.views({ ...K.gv.ladder[n], n_value: n }), g2.views({ ...K.gv.ladder[n], n_value: n })])]); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|terms|blades|boosts|rotations)\b/]) ok(!b.test(all), `${lang} banned ${b}`); }
ok(/Nothing here selects three generations/.test(COPY.en.g1.open[2][1]) && /Nothing here selects three generations/.test(COPY.en.g2.open[2][1]) && /not derived/.test(COPY.en.g2.open[0][1]) && /no metric is built/.test(COPY.en.g2.open[1][1]) && /not built here/.test(COPY.en.g1.open[1][1]), 'open items are stated');
ok(/first-order \(Cartan\) gravity/.test(COPY.en.g1.xr[3][1]) && /Einstein–Cartan gravity/.test(COPY.en.g2.xr[3][1]), 'the standard flags are stated');
ok(/ours/.test(JSON.stringify(COPY.en.g1.xr[0])) && /by plane pairs and by the demicube is ours/.test(COPY.en.g1.xr[3][1]), 'the ours flag is stated for the plane-pair reading');
// ---- a few spot checks of the text against the data
{ const v = COPY.en.g1.views({ ...K.gv.ladder[4], n_value: 4 }); ok(/Cl\(1,3\) = M2\(H\)/.test(v[0].t) && /16-cell/.test(v[1].t) && /21 − 1 = 20/.test(v[2].t) && /rank 10/.test(v[3].t) && /10 components/.test(v[3].t), 'n=4 text matches the data'); }
{ const v = COPY.en.g2.views({ ...K.gv.ladder[3], n_value: 3 }); ok(/D E_a = 0 identically/.test(v[2].t) && /ratio is exactly 1/.test(v[3].t), 'n=3 Einstein text'); }
// ---- tally, nav, wiring
ok(eqNavIds().at(-1) === 'tally' && EQC.en.t.rows.length === eqNavIds().length && EQC.it.t.rows.length === eqNavIds().length, 'tally and nav have the gravity entries');
ok(EQC.en.t.rows[6][2] === '36 + 24 in 4D' && EQC.en.t.rows[6][3] === '21 cells − 1 relation in 4D' && EQC.en.t.rows[7][2] === '16 in 4D' && EQC.en.t.rows[7][3] === '3 terms in each E_a in 4D', 'tally rows from the data');
const pg = fs.readFileSync('./EquationsSection.jsx', 'utf8'); ok(/GravityOneSection/.test(pg) && /GravityTwoSection/.test(pg) && eqNavIds().includes('grav1') && eqNavIds().includes('grav2'), 'sections wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL GRAVITY TESTS PASS'); process.exit(bad ? 1 : 0);
