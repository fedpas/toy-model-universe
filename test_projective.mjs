import { eqNavIds } from './steps.js';
import fs from 'fs';
import K from './projectiveData.js';
import COPY, { NAMES, baseSq, key, pdot } from './projectiveCopy.js';
import EQC from './equationsCopy.js';
import { PJ_PY, PJM_PY } from './projectiveSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import { SHORT } from './audienceCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const J = JSON.parse(fs.readFileSync('./selfcheck/projective.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/projective_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.pj) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(PJ_PY === fs.readFileSync('./selfcheck/projective_selfcheck.py', 'utf8') && PJM_PY === fs.readFileSync('./selfcheck/projective_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(PJ_PY) && /ALL PROJECTIVE CHECKS PASS/.test(PJ_PY) && /ALL PROJECTIVE MATRIX CHECKS PASS/.test(PJM_PY) && /import mirrors_selfcheck/.test(PJ_PY) && !/mirrors_selfcheck|gravity/.test(PJM_PY), 'script interfaces and dependencies');
const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
// ---- an independent Clifford product on bit masks (floats; the inputs are small rationals, so the tolerance is tight)
const cm = (a, b, sq) => { let sw = 0; for (let j = 0; j < sq.length; j++) if (b >> j & 1) for (let i = j + 1; i < sq.length; i++) if (a >> i & 1) sw++; let s = sw % 2 ? -1 : 1; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const mul = (A, B, sq) => { const r = new Map(); for (const [a, x] of A) for (const [b, y] of B) { const [m, s] = cm(a, b, sq); if (s) r.set(m, (r.get(m) || 0) + s * x * y); } return clean(r); };
const clean = r => { for (const [k, v] of [...r]) if (Math.abs(v) < 1e-12) r.delete(k); return r; };
const add = (A, B, c = 1) => { const r = new Map(A); for (const [m, v] of B) r.set(m, (r.get(m) || 0) + c * v); return clean(r); };
const sc = (A, c) => clean(new Map([...A].map(([m, v]) => [m, v * c])));
const eq = (A, B) => { const d = add(A, B, -1); return [...d.values()].every(v => Math.abs(v) < 1e-9); };
const blade = (m, c = 1) => new Map([[m, c]]); const one = () => blade(0);
const rev = A => new Map([...A].map(([m, v]) => { const k = pc(m); return [m, v * ((k * (k - 1) / 2) % 2 ? -1 : 1)]; }));
const inv = (V, sq) => { const VV = mul(V, rev(V), sq); for (const [m, v] of VV) if (m !== 0 && Math.abs(v) > 1e-9) throw new Error('not a versor'); return sc(rev(V), 1 / VV.get(0)); };
const vecm = (x, sq) => new Map(x.map((c, i) => [1 << i, c]).filter(([, c]) => c));
const bs = (kind, n) => baseSq(kind, n), dotb = (b, x, y) => x.reduce((s, v, i) => s + b[i] * v * y[i], 0);
let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const rpt = n => Array.from({ length: n }, () => ri(-4, 4) / ri(1, 3));
const rnn = b => { for (;;) { const a = b.map(() => ri(-3, 3)); if (a.some(v => v) && Math.abs(dotb(b, a, a)) > 0) return a; } };
const comm = (A, B, sq) => add(mul(A, B, sq), mul(B, A, sq), -1);
const scalar = A => { for (const [m, v] of A) if (m !== 0 && Math.abs(v) > 1e-9) return null; return A.get(0) || 0; };
// ---- the ladder: one more generator of square s
const gens = N => { const g = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) g.push(1 << i | 1 << j); return g; };
for (const kind of ['space', 'lorentz']) for (let n = 2; n <= 6; n++) for (const s of [0, -1, 1]) {
  const b = bs(kind, n), sq = [...b, s], G = gens(n + 1), R = K.pj.ladder[key(kind, n, s)], N = n + 1;
  const f = G.map(A => G.map(B => comm(blade(A), blade(B), sq)));
  let good = G.length === C(N, 2) && R.dimension === G.length;
  for (let a = 0; a < n; a++) { const B = blade(1 << a | 1 << n), v = scalar(mul(B, B, sq)); if (v === null || Math.abs(v - (-b[a] * s)) > 1e-12 || !R.extra_squares.includes(Math.round(v))) good = false; }
  for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) { const ia = G.indexOf(1 << a | 1 << n), ic = G.indexOf(1 << c | 1 << n), cc = f[ia][ic], want = s ? blade(1 << a | 1 << c, -2 * s) : new Map(); if (!eq(cc, want)) good = false; if (s && Math.abs((cc.get(1 << a | 1 << c) / 2) - (-s)) > 1e-12) good = false; }
  // Jacobi on all triples through the structure constants
  const idx = new Map(G.map((m, i) => [m, i])), F3 = G.map((_, a) => G.map((__, c) => { const o = Array(G.length).fill(0); for (const [m, v] of f[a][c]) o[idx.get(m)] = v; return o; }));
  const brv = (u, v) => { const o = Array(G.length).fill(0); for (let a = 0; a < G.length; a++) if (u[a]) for (let c = 0; c < G.length; c++) if (v[c]) for (let d = 0; d < G.length; d++) o[d] += u[a] * v[c] * F3[a][c][d]; return o; };
  const E = i => Array.from({ length: G.length }, (_, k) => (k === i ? 1 : 0));
  if (n <= 4) for (let a = 0; a < G.length; a++) for (let c = 0; c < G.length; c++) for (let d = 0; d < G.length; d++) { const x = brv(E(a), brv(E(c), E(d))), y = brv(E(c), brv(E(d), E(a))), z = brv(E(d), brv(E(a), E(c))); for (let k = 0; k < G.length; k++) if (Math.abs(x[k] + y[k] + z[k]) > 1e-9) good = false; }
  // Killing form: diagonal, with the sign counts of the data
  let pos = 0, neg = 0, zer = 0, diag = true;
  for (let a = 0; a < G.length; a++) for (let c = 0; c < G.length; c++) { let k = 0; for (let x = 0; x < G.length; x++) for (let y = 0; y < G.length; y++) k += F3[a][x][y] * F3[c][y][x]; if (a !== c && Math.abs(k) > 1e-9) diag = false; if (a === c) { if (k > 1e-9) pos++; else if (k < -1e-9) neg++; else zer++; } }
  good = good && diag && R.killing.positive === pos && R.killing.negative === neg && R.killing.zero === zer;
  const np = sq.filter(v => v === 1).length, nm = sq.filter(v => v === -1).length;
  if (s) good = good && pos === np * nm && zer === 0; else { const bp = b.filter(v => v === 1).length, bm = b.filter(v => v === -1).length; good = good && pos === bp * bm && zer === n; }
  ok(good, `JS: ladder ${kind} n=${n} s=${s}`); ok(R.group === { 'space,0': 'Euclid', 'space,-1': 'elliptic', 'space,1': 'hyperbolic', 'lorentz,0': 'Poincare', 'lorentz,-1': 'de Sitter', 'lorentz,1': 'anti-de Sitter' }[`${kind},${s}`], `group name ${kind} ${s}`);
  ok(R.signature_plus_minus[0] === np && R.signature_plus_minus[1] === nm, `signature ${kind} n=${n} s=${s}`);
  // contraction: the constants of the rescaled generators carry lam^2
  if (s && n <= 4) { let c2 = true; for (const lam of [1, .5, .25]) for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) { const A = blade(1 << a | 1 << n, lam), B2 = blade(1 << c | 1 << n, lam), cc = comm(A, B2, sq); if (Math.abs((cc.get(1 << a | 1 << c) || 0) - (-2 * s * lam * lam)) > 1e-12) c2 = false; } ok(c2, `JS: contraction ${kind} n=${n} s=${s}`); }
}
// the two kinds of sign: elliptic is the compact one, hyperbolic is so(1,n)
ok(K.pj.ladder['space,4,-1'].killing.positive === 0 && K.pj.ladder['space,4,1'].killing.positive === 4 && K.pj.ladder['lorentz,4,-1'].killing.positive === 4 && K.pj.ladder['lorentz,4,1'].killing.positive === 6, 'stored: elliptic compact, hyperbolic so(1,4), de Sitter so(1,4), anti-de Sitter so(2,3)');
// ---- the null pair
const cga = (kind, n) => { const b = bs(kind, n), sq = [...b, -1, 1], ep = 1 << n, em = 1 << (n + 1), eps = new Map([[ep, 1], [em, 1]]), o = new Map([[em, .5], [ep, -.5]]); return { b, sq, ep, em, eps, o }; };
const point = (g, x) => add(add(g.o, vecm([...x, 0, 0], g.sq)), g.eps, -dotb(g.b, x, x) / 2);
const sym = (u, v, sq) => scalar(sc(add(mul(u, v, sq), mul(v, u, sq)), .5));
const readPoint = (g, R, n) => { const co = (R.get(g.em) || 0) - (R.get(g.ep) || 0); if (Math.abs(co) < 1e-12) return null; const x = Array.from({ length: n }, (_, i) => (R.get(1 << i) || 0) / co); return eq(R, sc(point(g, x), co)) ? x : null; };
const refl = (b, a, x) => { const f = 2 * dotb(b, x, a) / dotb(b, a, a); return x.map((v, i) => v - f * a[i]); };
const aff = (b, nv, dl, x) => { const f = 2 * (dotb(b, x, nv) + dl) / dotb(b, nv, nv); return x.map((v, i) => v - f * nv[i]); };
for (const kind of ['space', 'lorentz']) for (let n = 2; n <= 4; n++) { const g = cga(kind, n), { b, sq, eps, o } = g, I = one(); let good = true;
  good = good && mul(eps, eps, sq).size === 0 && mul(o, o, sq).size === 0 && Math.abs(sym(eps, o, sq) - 1) < 1e-12;
  for (let t = 0; t < 12; t++) { const x = rpt(n), y = rpt(n), P = point(g, x), Q = point(g, y), d = x.map((v, i) => v - y[i]); if (mul(P, P, sq).size) good = false; if (Math.abs(sym(P, Q, sq) + dotb(b, d, d) / 2) > 1e-9) good = false; }
  ok(good, `JS: null pair and points, ${kind} n=${n}`); ok(K.pj.null_pair[`${kind},${n}`].points_tested === 12, `stored points ${kind} ${n}`);
  // translation: only c = 1/2 works
  const works = c => { for (let t = 0; t < 6; t++) { const x = rpt(n), tv = rpt(n), tp = mul(vecm([...tv, 0, 0], sq), eps, sq), T = add(I, tp, c), Ti = add(I, tp, -c); if (!eq(mul(mul(T, point(g, x), sq), Ti, sq), point(g, x.map((v, i) => v + tv[i])))) return false; } return true; };
  ok(works(.5) && !works(-.5) && !works(1) && !works(.25), `JS: translation 1 + t eps/2 only, ${kind} n=${n}`);
  // rotation by two base mirrors, dilation, inversion, plane
  let rot = true, dil = true, inve = true, pla = true;
  for (let t = 0; t < 6; t++) { const a = rnn(b), c = rnn(b), R = mul(vecm([...a, 0, 0], sq), vecm([...c, 0, 0], sq), sq), Ri = inv(R, sq), x = rpt(n); if (!eq(mul(mul(R, o, sq), Ri, sq), o) || !eq(mul(mul(R, eps, sq), Ri, sq), eps)) rot = false; const out = readPoint(g, mul(mul(R, point(g, x), sq), Ri, sq), n), w = refl(b, a, refl(b, c, x)); if (!out || out.some((v, i) => Math.abs(v - w[i]) > 1e-9)) rot = false; }
  for (const u of [1 / 3, 1 / 2, -1 / 5]) { const V = add(I, blade(g.ep | g.em, u)), Vi = inv(V, sq), x = rpt(n).map((v, i) => v || (i ? 0 : 1)), R = mul(mul(V, point(g, x), sq), Vi, sq), out = readPoint(g, R, n); if (!out) { dil = false; continue; } const mu = out.find((v, i) => x[i]) / x.find(v => v); if (![(1 + u) / (1 - u), (1 - u) / (1 + u)].some(m => Math.abs(m - mu) < 1e-9) || out.some((v, i) => Math.abs(v - mu * x[i]) > 1e-9)) dil = false; }
  for (let t = 0; t < 6; t++) { const c = rpt(n), r2 = ri(1, 9) / ri(1, 3), S = add(point(g, c), eps, -r2 / 2), x = rpt(n), d = x.map((v, i) => v - c[i]), dd = dotb(b, d, d); if (Math.abs(dd) < 1e-9) continue; if (Math.abs(scalar(mul(S, S, sq)) + r2) > 1e-9) inve = false; const R = sc(mul(mul(S, point(g, x), sq), inv(S, sq), sq), -1), out = readPoint(g, R, n), want = c.map((v, i) => v - r2 * d[i] / dd); if (!out || out.some((v, i) => Math.abs(v - want[i]) > 1e-9)) inve = false; }
  for (let t = 0; t < 6; t++) { const nv = rnn(b), dl = ri(-5, 5) / ri(1, 3), pi = add(vecm([...nv, 0, 0], sq), eps, dl), x = rpt(n); if (Math.abs(sym(point(g, x), pi, sq) - (dotb(b, x, nv) + dl)) > 1e-9) pla = false; const R = sc(mul(mul(pi, point(g, x), sq), inv(pi, sq), sq), -1), out = readPoint(g, R, n), want = aff(b, nv, dl, x); if (!out || out.some((v, i) => Math.abs(v - want[i]) > 1e-9)) pla = false; }
  ok(rot && dil && inve && pla, `JS: rotation, dilation, inversion, plane, ${kind} n=${n} (${rot} ${dil} ${inve} ${pla})`);
  // two parallel planes are a translation; two concentric spheres a dilation
  let tw = true; for (let t = 0; t < 5; t++) { const nv = rnn(b), d1 = ri(-4, 4), d2 = ri(-4, 4), nn = dotb(b, nv, nv); if (d1 === d2) continue; const PP = mul(add(vecm([...nv, 0, 0], sq), eps, d1), add(vecm([...nv, 0, 0], sq), eps, d2), sq), tv = nv.map(v => 2 * (d2 - d1) / nn * v), T = add(I, mul(vecm([...tv, 0, 0], sq), eps, sq), .5); if (!eq(PP, sc(T, nn))) tw = false; }
  for (let t = 0; t < 5; t++) { const r1 = ri(1, 9), r2 = ri(1, 9); if (r1 === r2) continue; const SS = mul(add(o, eps, -r1 / 2), add(o, eps, -r2 / 2), sq), u = (r1 - r2) / (r1 + r2); if (!eq(SS, sc(add(I, blade(g.ep | g.em, u)), -(r1 + r2) / 2))) tw = false; }
  ok(tw && K.pj.null_pair[`${kind},${n}`].translation_is_two_parallel_planes && K.pj.null_pair[`${kind},${n}`].dilation_is_two_concentric_spheres, `JS: two parallel planes, two concentric spheres, ${kind} n=${n}`);
  // a mirror in a null vector is not defined: eps.eps = 0 and o.o = 0
  ok(Math.abs(sym(eps, eps, sq)) < 1e-12 && Math.abs(sym(o, o, sq)) < 1e-12, `${kind} n=${n}: the null vectors have no mirror`);
  // the wrong sign in the point is not null
  const wrong = add(add(o, vecm([...rpt(n), 0, 0], sq)), eps, +.5 * 3); ok(mul(wrong, wrong, sq).size > 0, 'wrong-sign point is not null');
}
// ---- PGA inside CGA: e_S -> e_S, e_S e_0 -> e_S eps is an injective algebra homomorphism
for (const kind of ['space', 'lorentz']) for (let n = 2; n <= 3; n++) { const g = cga(kind, n), psq = [...g.b, 0], phi = X => { let r = new Map(); for (const [m, c] of X) { if (m >> n & 1) r = add(r, mul(blade(m & ((1 << n) - 1), c), g.eps, g.sq)); else r = add(r, blade(m, c)); } return r; };
  let good = true; for (let a = 0; a < 1 << (n + 1); a++) for (let b2 = 0; b2 < 1 << (n + 1); b2++) { const X = blade(a), Y = blade(b2); if (!eq(phi(mul(X, Y, psq)), mul(phi(X), phi(Y), g.sq))) good = false; }
  ok(good && K.pj.pga[`${kind},${n}`].homomorphism && K.pj.pga[`${kind},${n}`].pga_dimension === 1 << (n + 1) && K.pj.pga[`${kind},${n}`].cga_dimension === 1 << (n + 2), `JS: PGA inside CGA, ${kind} n=${n}`); }
// ---- the conformal algebra: ad_D eigenvalues, closure of rotations + translations, counts
for (const kind of ['space', 'lorentz']) for (let n = 2; n <= 4; n++) { const g = cga(kind, n), sq = g.sq, e = i => blade(1 << i), D = sc(add(mul(g.eps, g.o, sq), mul(g.o, g.eps, sq), -1), .5); let good = true;
  ok(eq(D, blade(g.ep | g.em, 1)), `D = e_p e_m, ${kind} n=${n}`);
  for (let i = 0; i < n; i++) { const T = mul(e(i), g.eps, sq), Kk = mul(e(i), g.o, sq); if (!eq(comm(D, T, sq), sc(T, 2)) || !eq(comm(D, Kk, sq), sc(Kk, -2))) good = false; for (let j = 0; j < n; j++) { const T2 = mul(e(j), g.eps, sq), K2 = mul(e(j), g.o, sq); if (comm(T, T2, sq).size || comm(Kk, K2, sq).size) good = false; } }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (comm(D, mul(e(i), e(j), sq), sq).size) good = false;
  ok(good, `JS: [D,T] = 2T, [D,K] = -2K, translations and special conformal maps commute, ${kind} n=${n}`);
  const r = K.pj.conformal[`${kind},${n}`]; ok(r.generators === C(n + 2, 2) && r.rotations === C(n, 2) && r.translations === n && r.special_conformal === n && r.dilation === 1 && r.generators === r.rotations + 2 * n + 1 && r.euclid_subalgebra === C(n + 1, 2) && r.dilation_eigenvalue_on_T === '2' && r.dilation_eigenvalue_on_K === '-2', `stored conformal counts ${kind} ${n}`);
  const np = sq.filter(v => v === 1).length, nm = sq.filter(v => v === -1).length; ok(r.killing.positive === np * nm && r.killing.zero === 0, `conformal Killing ${kind} ${n}`); }
// ---- every isometry of R^n is at most n+1 plane mirrors (affine Cartan-Dieudonne), recomputed in JS for the Euclidean base
const eyeM = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))), mm = (A, B) => A.map((_, i) => B[0].map((__, j) => A[i].reduce((s, _x, k) => s + A[i][k] * B[k][j], 0))), mv = (A, x) => A.map(r => r.reduce((s, c, j) => s + c * x[j], 0));
const house = (b, a) => { const n = b.length, aa = dotb(b, a, a); return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - 2 * a[i] * b[j] * a[j] / aa)); };
const gauss = () => { let s = 0; for (let i = 0; i < 12; i++) s += rnd(); return s - 6; };
const rvec = b => { for (;;) { const a = b.map(() => gauss()); if (Math.abs(dotb(b, a, a)) > .4 * a.reduce((s, x) => s + x * x, 0)) return a; } };
const maxAbs = A => Math.max(...A.flat().map(Math.abs));
function cd(O, b) { const n = b.length; for (let at = 0; at < 200; at++) { let P = eyeM(n); for (let i = 0; i < 2 * n; i++) P = mm(P, house(b, rvec(b))); const ms = []; let Ok = O, fine = true;
  for (let i = 0; i < n; i++) { const u = P.map(r => r[i]), w = mv(Ok, u), a = w.map((x, j) => x - u[j]), aa = a.reduce((s, x) => s + x * x, 0); if (aa < 1e-14) continue; if (Math.abs(dotb(b, a, a)) < 1e-3 * aa) { fine = false; break; } ms.push(a); Ok = mm(house(b, a), Ok); }
  if (fine && maxAbs(Ok.map((r, i) => r.map((x, j) => x - (i === j ? 1 : 0)))) < 1e-7) return ms; } return null; }
for (let n = 2; n <= 4; n++) { const b = Array(n).fill(-1); let good = true, count = 0; const seen = {};
  for (let t = 0; t < 25; t++) { const k = ri(1, 2 * n + 2), pl = []; for (let i = 0; i < k; i++) pl.push([rvec(b), gauss() * 2]);
    const run = z => { for (let i = pl.length - 1; i >= 0; i--) z = aff(b, pl[i][0], pl[i][1], z); return z; }, tvec = run(Array(n).fill(0)), lin = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => run(Array.from({ length: n }, (_, i) => (i === c ? 1 : 0)))[r] - tvec[r]));
    const first = tvec.some(v => Math.abs(v) > 1e-9) ? [[tvec, -dotb(b, tvec, tvec) / 2]] : []; const A1 = z => { let w = mv(lin, z).map((v, i) => v + tvec[i]); for (const [nv, dl] of first) w = aff(b, nv, dl, w); return w; };
    const lin1 = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => A1(Array.from({ length: n }, (_, i) => (i === c ? 1 : 0)))[r])); if (A1(Array(n).fill(0)).some(v => Math.abs(v) > 1e-8)) good = false;
    const rs = cd(lin1, b); if (!rs) { good = false; continue; } const all = [...first, ...rs.map(a => [a, 0])]; if (all.length > n + 1) good = false;
    const z = rpt(n).map(Number); let w = z.slice(); for (let i = all.length - 1; i >= 0; i--) w = aff(b, all[i][0], all[i][1], w); const want = run(z); if (w.some((v, i) => Math.abs(v - want[i]) > 1e-6 * (1 + Math.abs(want[i])))) good = false; seen[all.length] = 1; count++; }
  ok(good && count >= 20, `JS: every isometry of R^${n} is at most n+1 plane mirrors (counts ${Object.keys(seen).join('/')})`); }
for (const kind of ['space', 'lorentz']) for (const n of [2, 3]) { const m = K.pj.motors[`${kind},${n}`]; ok(m.at_most_n_plus_1 && Math.max(...Object.keys(m.plane_mirrors_after_reduction).map(Number)) <= n + 1 && Object.keys(m.mirrors_in_product).length >= 4, `stored motors ${kind} ${n}`); }
// ---- Cl(k,k) = M_{2^k}(R) by Kronecker doubling, rank modulo a prime (independent code)
{ const P = 1000003, SZ = [[1, 0], [0, -1]], SX = [[0, 1], [1, 0]], JJ = [[0, 1], [-1, 0]];
  const kr = (A, B) => { const r = []; for (let i = 0; i < A.length * B.length; i++) { r.push([]); for (let j = 0; j < A[0].length * B[0].length; j++) r[i].push(A[Math.floor(i / B.length)][Math.floor(j / B[0].length)] * B[i % B.length][j % B[0].length]); } return r; };
  const id = d => eyeM(d), mmI = (A, B) => A.map((_, i) => B[0].map((__, j) => A[i].reduce((s, _x, k) => s + A[i][k] * B[k][j], 0)));
  let gs = []; for (let k = 1; k <= 4; k++) { const d = gs.length ? gs[0].length : 1; gs = [...gs.map(g => kr(g, SZ)), kr(id(d), SX), kr(id(d), JJ)]; const d2 = gs[0].length, N = gs.length;
    let good = true;
    const sqs = []; for (let i = 0; i < N; i++) { const s2 = mmI(gs[i], gs[i]); const v = s2[0][0]; sqs.push(v); if (s2.some((r, a) => r.some((x, b2) => x !== (a === b2 ? v : 0))) || Math.abs(v) !== 1) good = false; for (let j = i + 1; j < N; j++) { const ab = mmI(gs[i], gs[j]), ba = mmI(gs[j], gs[i]); if (ab.some((r, a) => r.some((x, b2) => x + ba[a][b2] !== 0))) good = false; } }
    good = good && sqs.filter(v => v === 1).length === k && sqs.filter(v => v === -1).length === k;
    const rows = []; for (let m = 0; m < 1 << N; m++) { let M = id(d2); for (let i = 0; i < N; i++) if (m >> i & 1) M = mmI(M, gs[i]); rows.push(M.flat().map(x => ((x % P) + P) % P)); }
    let rk = 0; const pw = (b, e) => { let r = 1n, x = BigInt(b), E = BigInt(e), p = BigInt(P); while (E > 0n) { if (E & 1n) r = r * x % p; x = x * x % p; E >>= 1n; } return Number(r); };
    for (let c = 0; c < d2 * d2 && rk < rows.length; c++) { let p = -1; for (let i = rk; i < rows.length; i++) if (rows[i][c]) { p = i; break; } if (p < 0) continue; [rows[rk], rows[p]] = [rows[p], rows[rk]]; const iv = pw(rows[rk][c], P - 2); rows[rk] = rows[rk].map(x => Number(BigInt(x) * BigInt(iv) % BigInt(P))); for (let i = 0; i < rows.length; i++) if (i !== rk && rows[i][c]) { const f = rows[i][c]; rows[i] = rows[i].map((x, j) => (((x - Number(BigInt(f) * BigInt(rows[rk][j]) % BigInt(P))) % P) + P) % P); } rk++; }
    ok(good && rk === d2 * d2 && K.pj.doubling[`${k},${k}`].matrix_size === d2 && K.pj.doubling[`${k},${k}`].algebra_dimension === 1 << (2 * k), `JS: Cl(${k},${k}) is the full ${d2} x ${d2} matrix algebra (rank ${rk})`); } }
// ---- counts
for (let n = 2; n <= 8; n++) { const c = K.pj.counts[n]; ok(c.ladder_generators === C(n + 1, 2) && c.euclid_generators === C(n + 1, 2) && c.conformal_generators === C(n + 2, 2) && c.pga_dimension === 2 ** (n + 1) && c.cga_dimension === 2 ** (n + 2) && c.rotations === C(n, 2) && c.planes_to_move_a_point === n + 1 && c.conformal_generators === C(n, 2) + 2 * n + 1, `n=${n}: counts`); }
// ---- stored numpy checks
const M = K.matrix; ok(Object.keys(M.checks).length === 6 && Object.values(M.checks).every(v => v.null_pair && v.points && v.translation && v.rotation && v.dilation && v.inversion && v.plane && v.pga_rank > 0 && v.conformal.generators > 0), 'matrix: six cases, all moves');
ok(Object.keys(M.ladder).length === 8 && Object.values(M.ladder).every(v => v['-1'] && v['0'] && v['1']), 'matrix: ladder for n = 2..5, both bases');
ok(Object.keys(M.controls).length === 5 && Object.values(M.controls).every(v => /not null|wrong place|singular/.test(v)), 'matrix: five negative controls');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it) && keys(COPY.en.p1) === keys(COPY.it.p1) && keys(COPY.en.p1.dl) === keys(COPY.it.p1.dl), 'copy keys');
for (const lang of ['en', 'it']) { const t = COPY[lang].p1;
  for (let n = 2; n <= 8; n++) { const v = t.views({ n_value: n }); ok(v.length === 7, `${lang} n=${n}: 7 views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} view tag ${g}`); }
  for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`); ok(t.open.length === 3 && t.xr.length === 4, `${lang} lists`);
  ok(t.motionsRows.length === 5 && t.motionsRows.every(r => K.pj.null_pair['lorentz,3'][r[3]]), `${lang} motions keys exist in the data`);
  for (const kind of ['space', 'lorentz']) for (let n = 2; n <= 6; n++) for (const s of [0, -1, 1]) { const inf = t.info(kind, n, s, K.pj.ladder[key(kind, n, s)]); ok(inf.length === 3 && !/undefined|NaN/.test(JSON.stringify(inf)) && inf[0].includes(NAMES[lang][`${kind},${s}`]), `${lang} info ${kind} ${n} ${s}`); ok(t.picCap(n, kind, s).length > 50, `${lang} caption`); }
  const all = JSON.stringify([t, [2, 3, 4, 5, 6, 7, 8].map(n => t.views({ n_value: n })), t.info('lorentz', 4, -1, K.pj.ladder['lorentz,4,-1'])]); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (generators|terms|blades|boosts|rotations|mirrors|corners|planes)\b/]) ok(!b.test(all.replace(/not a wall/g, '').replace(/non un muro/g, '')), `${lang} banned ${b}`); }
ok(/Nothing here selects three generations/.test(COPY.en.p1.open[2][1]) && /Niente di quanto qui scelga tre generazioni/.test(COPY.it.p1.open[2][1]) && /not re-derived/.test(COPY.en.p1.open[0][1]) && /non ricavato di nuovo/.test(COPY.it.p1.open[0][1]), 'open items are stated');
ok(/standard material/.test(COPY.en.p1.lede) && /claims no physical role/.test(COPY.en.p1.lede) && /textbook/.test(COPY.en.p1.xr[0][1]) && /is ours/.test(COPY.en.p1.xr[0][1]), 'the standard / ours flags are stated');
ok(/we read/.test(COPY.en.p1.xr[3][1]) && /Gunn/.test(COPY.en.p1.xr[3][1]) && /did not re-derive/.test(COPY.en.p1.xr[3][1]) && /have not compared/.test(COPY.en.p1.xr[3][1]), 'what was read, what was attributed and what was not');
ok(/not a wall/.test(COPY.en.p1.dblNote) && /non un muro/.test(COPY.it.p1.dblNote) && /modulo a prime/.test(COPY.en.p1.dblNote), 'period-8 wording and the rank caveat');
for (const lang of ['en', 'it']) for (const v of COPY[lang].p1.views({ n_value: 4 }).slice(4, 7)) ok(v.tags.includes('standard') && !v.tags.includes('checked') && /not rebuilt|non ricostruito/.test(v.t), `${lang} ${v.h}: conformal invariance is standard and not rebuilt`);
// ---- spot checks of the text against the data
{ const v = COPY.en.p1.views({ n_value: 4 }); ok(/10 bivectors/.test(v[0].t) && /32 blades/.test(v[0].t) && /64 blades/.test(v[0].t) && /M₁₆\(ℝ\)/.test(v[0].t) && /5 = n \+ 1/.test(v[1].t) && /10 edges/.test(v[2].t) && /15 edges/.test(v[2].t) && /\[D, T\] = 2T/.test(v[3].t), 'n=4 text matches the data'); }
{ const t = COPY.en.p1.info('lorentz', 4, -1, K.pj.ladder['lorentz,4,-1']); ok(/de Sitter/.test(t[0]) && /10 generators/.test(t[0]) && /\+1, −4/.test(t[0]) && /4 positive and 6 negative/.test(t[1]) && /k = −s = 1/.test(t[2]), 'dS n=4 info'); const u = COPY.en.p1.info('space', 3, 0, K.pj.ladder['space,3,0']); ok(/Euclid/.test(u[0]) && /3 translations commute/.test(u[1]) && /3 directions/.test(u[1]), 'Euclid n=3 info'); }
ok(pdot(0, 3) === 4.5 && pdot(1, 1) === 0 && pdot(2, 3) === .5, 'point inner products');
// ---- tally, nav, audience, wiring
ok(eqNavIds().at(-1) === 'tally' && EQC.en.t.rows.length === eqNavIds().length && EQC.it.t.rows.length === eqNavIds().length, 'tally and nav have the projective entry');
ok(EQC.en.t.rows[9][2] === '10 generators and 64 blades in 4D' && EQC.en.t.rows[9][3] === '15 conformal generators in 4D', 'tally row from the data');
ok(SHORT.en.projective.length === 2 && SHORT.it.projective.length === 2 && SHORT.en.projective.every(x => x.length > 100) && SHORT.it.projective.every(x => x.length > 100), 'short readings for the audiences');
const pg = fs.readFileSync('./EquationsSection.jsx', 'utf8'); ok(/ProjectiveSection/.test(pg) && eqNavIds().includes('projective'), 'section wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL PROJECTIVE TESTS PASS'); process.exit(bad ? 1 : 0);
