import fs from 'fs';
import G from './gossetData.js';
import COPY, { fmt } from './gossetCopy.js';
import { GOSSET_PY } from './gossetSelfcheckSource.js';
import { STORY } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// ---- the shipped data and script are the files
const J = JSON.parse(fs.readFileSync('./selfcheck/gosset.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(JSON.parse(JSON.stringify(G))), 'data equals rebuilt JSON');
ok(GOSSET_PY === fs.readFileSync('./selfcheck/gosset_selfcheck.py', 'utf8'), 'embedded script equals file');
ok(/--compare/.test(GOSSET_PY) && /ALL GOSSET CHECKS PASS/.test(GOSSET_PY), 'script interface');
// ---- independent of Python: Cartan determinants with BigInt (Bareiss), leading minors, E-series
const cartan = n => { const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 2n : 0n)));
  const ed = [[1, 3], ...Array.from({ length: Math.max(0, n - 3) }, (_, k) => [k + 3, k + 4]), [2, 4]]; for (const [a, b] of ed) if (a <= n && b <= n) { A[a - 1][b - 1] = -1n; A[b - 1][a - 1] = -1n; } return A; };
const bareiss = M => { const n = M.length; if (n === 0) return 1n; M = M.map(r => r.slice()); let sign = 1n, prev = 1n;
  for (let k = 0; k < n - 1; k++) { if (M[k][k] === 0n) { const p = M.findIndex((r, i) => i > k && r[k] !== 0n); if (p < 0) return 0n; [M[k], M[p]] = [M[p], M[k]]; sign = -sign; }
    for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) / prev; prev = M[k][k]; } return sign * M[n - 1][n - 1]; };
for (let n = 3; n <= 10; n++) {
  const A = cartan(n), d = bareiss(A); ok(d === BigInt(9 - n), `det E${n} = 9 - n`); ok(G.rank[n].det === 9 - n, `data det E${n}`);
  const minors = []; for (let k = 1; k <= n; k++) minors.push(bareiss(A.slice(0, k).map(r => r.slice(0, k))));
  if (n <= 8) ok(minors.every(m => m > 0n), `E${n} positive definite: all leading minors positive`);
  if (n === 9) ok(minors.slice(0, 8).every(m => m > 0n) && minors[8] === 0n, 'E9: first 8 minors positive, the last zero');
  if (n === 10) ok(minors.slice(0, 8).every(m => m > 0n) && minors[8] === 0n && minors[9] === -1n, 'E10: contains E9 (8 positive directions), determinant -1, so exactly one negative direction');
  const r = G.rank[n]; ok(r.inertia[0] + r.inertia[1] + r.inertia[2] === n, `inertia sums to rank E${n}`);
}
ok(G.rank[9].inertia.join() === '8,0,1' && G.rank[10].inertia.join() === '9,1,0', 'inertia of E9 and E10');
{ const A = cartan(9), v = G.rank[9].null_vector.map(BigInt); ok(A.every(r => r.reduce((s, x, j) => s + x * v[j], 0n) === 0n), 'E9 null vector really is null'); ok(v.join() === '2,3,4,6,5,4,3,2,1', 'marks of the affine E8'); }
// 1/p + 1/q + 1/r and the determinant formula, with rational arithmetic done by hand
for (let n = 4; n <= 10; n++) { const p = 2, q = 3, r = n - 3, num = q * r + p * r + p * q - p * q * r; ok(num === 9 - n, `p q r (1/p+1/q+1/r-1) = 9 - n at n=${n}`); ok((num > 0) === (n < 9) && (num === 0) === (n === 9), `sign of the arm sum at n=${n}`); }
// ---- roots by closing the simple roots, in coordinates, and the 112 + 128 split recomputed here
const H2 = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const simple = [[1, -1, -1, -1, -1, -1, -1, 1], [2, 2, 0, 0, 0, 0, 0, 0]]; for (let k = 2; k < 8; k++) { const v = Array(8).fill(0); v[k - 1] = 2; v[k - 2] = -2; simple.push(v); }      // doubled coordinates
ok(simple.every(v => H2(v, v) === 8), 'simple roots have squared length 2 (doubled coordinates)');
const closure = S => { const seen = new Map(S.map(v => [v.join(), v])); const st = S.slice(); while (st.length) { const v = st.pop(); for (const a of S) { const c = H2(v, a) / 4; const w = v.map((x, i) => x - c * a[i]); const k = w.join(); if (!seen.has(k)) { seen.set(k, w); st.push(w); } } } return [...seen.values()]; };
const E8 = closure(simple), E7 = closure(simple.slice(0, 7)), E6 = closure(simple.slice(0, 6));
ok(E8.length === 240 && E7.length === 126 && E6.length === 72, 'closure gives 240, 126, 72 roots');
ok([6, 7, 8].every(n => G.rank[n].roots === { 6: 72, 7: 126, 8: 240 }[n]), 'data root counts');
const isEdge = v => v.every(x => x % 2 === 0);
ok(E8.filter(isEdge).length === 112 && E8.filter(v => !isEdge(v)).length === 128, 'E8 = 112 edges + 128 corners (recomputed)');
ok(E8.filter(v => !isEdge(v)).every(v => v.every(x => Math.abs(x) === 1) && v.filter(x => x < 0).length % 2 === 0), 'the 128 are the even sign vectors');
{ const top = [0, 0, 0, 0, 0, 0, 2, 2]; ok(E8.some(v => v.join() === top.join()) && simple.slice(0, 7).every(a => H2(top, a) === 0) && H2(top, simple[7]) === 4, 'e7 + e8 is a root, perpendicular to alpha_1..alpha_7 and pairing 1 with alpha_8: the highest root');
  ok(E8.filter(v => H2(v, top) === 0).length === 126, 'E7 = roots perpendicular to the highest root'); }
const count = (R, f) => R.filter(f).length;
ok(count(E7, isEdge) === 62 && count(E7, v => !isEdge(v)) === 64 && count(E7, v => isEdge(v) && v.slice(6).every(x => x === 0)) === 60, 'E7 split 60 + 2 + 64');
ok(count(E6, isEdge) === 40 && count(E6, v => !isEdge(v)) === 32 && E6.filter(v => !isEdge(v)).map(v => v.slice(0, 5).join()).filter((x, i, a) => a.indexOf(x) === i).length === 32, 'E6 split 40 + 32, and the 32 corners are all 2^5 sign patterns on 5 axes');
ok(G.coordinates['8'].orthoplex_edges === 112 && G.coordinates['7'].demicube_vertices === 64 && G.coordinates['6'].demicube_vertices === 32 && G.coordinates['8_by_7_axes'].other_orthoplex_edges === 28, 'data splits');
// the E6 x A2 classes: roots perpendicular to alpha_1..alpha_6, then classes by A2 weight
{ const perp = E8.filter(v => simple.slice(0, 6).every(a => H2(v, a) === 0)); ok(perp.length === 6, 'commutant of E6 is an A2 with 6 roots');
  const a = perp.find(x => perp.some(y => H2(x, y) === -4)), b = perp.find(y => H2(a, y) === -4), cls = new Map();
  for (const r of E8) { const k = H2(r, a) / 4 + ',' + H2(r, b) / 4; cls.set(k, (cls.get(k) || 0) + 1); }
  ok([...cls.values()].sort((x, y) => y - x).join() === '72,27,27,27,27,27,27,1,1,1,1,1,1', 'E8 roots by A2 weight: 72 + 6 x 27 + 6 x 1'); }
// ---- Gosset polytopes by Weyl orbit of the weight at node n, with Dynkin labels
const orbit = (n, node) => { const A = cartan(n).map(r => r.map(Number)); const s0 = Array.from({ length: n }, (_, j) => (j === node - 1 ? 1 : 0)); const seen = new Set([s0.join()]), st = [s0];
  while (st.length) { const l = st.pop(); for (let i = 0; i < n; i++) if (l[i]) { const w = l.map((x, j) => x - l[i] * A[i][j]); if (!seen.has(w.join())) { seen.add(w.join()); st.push(w); } } } return seen.size; };
ok([5, 6, 7, 8].map(n => orbit(n, n)).join() === '16,27,56,240', 'orbit sizes 16, 27, 56, 240');
ok([5, 6, 7, 8].map(n => G.polytopes[n].vertices).join() === '16,27,56,240' && [5, 6, 7, 8].map(n => G.polytopes[n].edges).join() === '80,216,756,6720', 'vertices and edges against the literature (1_21, 2_21, 3_21, 4_21)');
ok([5, 6, 7, 8].every(n => G.polytopes[n].edges === G.polytopes[n].vertices * G.polytopes[n].degree / 2), 'edges = vertices x degree / 2');
ok([6, 7, 8].every((n, i) => G.polytopes[n].degree === G.polytopes[n - 1].vertices) && G.polytopes[5].degree === 10, 'the degree equals the vertex count of the previous polytope');
ok(G.weyl_orders['6'] === 27 * 1920 && G.weyl_orders['7'] === 56 * G.weyl_orders['6'] && G.weyl_orders['8'] === 240 * G.weyl_orders['7'], 'Weyl orders: each is the previous times the vertex count');
ok(G.polytopes[5].is_the_5_demicube === true && [5, 6, 7, 8].every(n => G.polytopes[n].vertex_figure.isomorphic), 'demicube and vertex figures flagged');
// ---- Coxeter number: order of the product of the simple reflections, independent of Python
const mm = (X, Y) => X.map((r, i) => Y[0].map((_, j) => r.reduce((s, x, k) => s + x * Y[k][j], 0)));
const coxeter = n => { const A = cartan(n).map(r => r.map(Number)); let C = A.map((_, i) => A.map((_, j) => +(i === j)));
  for (let i = 0; i < n; i++) { const S = A.map((_, r) => A.map((_, c) => (r === c ? 1 : 0))); for (let j = 0; j < n; j++) S[i][j] -= A[j][i]; C = mm(C, S); }
  let P = C, k = 1; const I = A.map((_, i) => A.map((_, j) => +(i === j))); while (JSON.stringify(P) !== JSON.stringify(I)) { P = mm(P, C); k++; } return k; };
for (const [n, h] of [[6, 12], [7, 18], [8, 30]]) { ok(coxeter(n) === h && G.coxeter[n].h === h, `Coxeter number E${n}`); ok(G.rank[n].roots === n * h, `roots = rank x h for E${n}`); ok(G.coxeter[n].points.length === n * h && G.coxeter[n].rings === n, `plot has ${n} rings of ${h}`);
  ok(new Set(G.coxeter[n].points.map(p => p[2])).size === n && G.coxeter[n].points.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1])), `plot points E${n}`); }
ok(G.coxeter[8].points.filter(p => p[3] === 'e').length === 112 && G.coxeter[8].points.filter(p => p[3] === 'd').length === 128, 'drawing colours = 112 + 128');
// ---- glue norm n/4
{ const rows = G.dn_plus; ok(rows.map(r => r.n).join() === '4,8,12,16', 'glue rows');
  for (const r of rows) { const g = r.n / 4; ok(+eval(r.glue_norm) === g, `glue norm n=${r.n}`); ok(r.even === (g % 2 === 0), `even n=${r.n}`); }
  ok(rows[1].minimal_vectors === 240 && rows[3].minimal_vectors === 480 && rows[2].minimal_vectors === 2 * 12 * 11, 'minimal vectors 240, 264, 480');
  const eights = []; for (let n = 4; n <= 64; n += 4) if ((n / 4) % 2 === 0) eights.push(n); ok(eights.every(n => n % 8 === 0), 'n/4 even exactly when 8 | n');
  ok([...Array(40).keys()].map(i => i + 1).filter(n => n / 4 === 2).join() === '8', 'corners are roots only at n = 8'); }
// ---- copy: both languages complete, tags valid, claims careful
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it), 'copy keys');
for (const k of Object.keys(COPY.en)) if (COPY.en[k] && typeof COPY.en[k] === 'object' && !Array.isArray(COPY.en[k])) ok(keys(COPY.en[k]) === keys(COPY.it[k]), `copy keys ${k}`);
for (const lang of ['en', 'it']) { const t = COPY[lang];
  ok(t.cols.length === 8 && t.glueCols.length === 5 && t.nestRow.length === 5 && t.gb.length === 4 && t.glueNote.length === 4, `${lang} shapes of copy`);
  for (const [ks] of t.gb) for (const k of ks) ok(STORY[lang].tags[k], `${lang} tag ${k}`);
  for (let n = 3; n <= 10; n++) ok(t.detail(n) && !/undefined|NaN/.test(t.detail(n)), `${lang} detail ${n}`);
  for (const n of [6, 7, 8]) ok(t.inCap(n) && t.split[n] && !/undefined|NaN/.test(t.inCap(n) + t.split[n]), `${lang} plane ${n}`);
  const all = JSON.stringify(t); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /derived from the budget/i]) ok(!b.test(all), `${lang} banned ${b}`);
  ok(/aperto|open|resemblance|somiglianza/.test(t.bd), `${lang} budget claim is marked as open / resemblance`);
}
ok(/Nothing on this page selects three generations/.test(COPY.en.limits) && /not a derivation/.test(COPY.en.limits), 'limits sentence');
ok(/Cl\(n\+4,n\+4\) = Cl\(n,n\) ⊗ M₁₆\(ℝ\)/.test(COPY.en.bd) && /repeats the cells rather than stopping them/.test(COPY.en.bd), 'period 8 is described as a repeat of types, not a wall');
ok(/determinants 6, 5, 4, 3, 2, 1/.test(COPY.en.bd) && [3, 4, 5, 6, 7, 8].map(n => G.rank[n].det).join() === '6,5,4,3,2,1', 'determinants quoted in the copy match the data');
ok(COPY.en.tableNote.includes('9 − n') && COPY.en.nest.includes('5-demicube'), 'key sentences');
ok(fmt(696729600) === '696 729 600', 'number format');
// ---- the page has the section and the story knows it
const src = fs.readFileSync('./ShapesSection.jsx', 'utf8'); ok(/GossetSection/.test(src) && /sh-gosset/.test(src), 'ShapesSection renders step 3');
for (const lang of ['en', 'it']) { const p = STORY[lang].pages.shapes; ok(/Gosset/.test(p.h) && /Gosset/.test(p.does) && p.tags.length === 4 && /E6|E8/.test(JSON.stringify(p.tags)), `${lang} story mentions Gosset`); }
console.log(bad ? bad + ' FAILURES' : 'ALL GOSSET TESTS PASS'); process.exit(bad ? 1 : 0);
