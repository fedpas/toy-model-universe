import fs from 'fs';
import E from './equationsData.js';
import S from './shapesData.js';
import COPY from './equationsCopy.js';
import { EQ_PY, DIRAC_PY } from './equationsSelfcheckSource.js';
import { STORY, PAGES } from './storyCopy.js';
import { eqNavIds } from './steps.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// ---- shipped data and scripts are the files
const J = JSON.parse(fs.readFileSync('./selfcheck/equations.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/dirac_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(JSON.parse(JSON.stringify(E.eq))), 'equations data equals rebuilt JSON');
ok(JSON.stringify(JM) === JSON.stringify(JSON.parse(JSON.stringify(E.matrix))), 'matrix-check data equals file');
ok(EQ_PY === fs.readFileSync('./selfcheck/equations_selfcheck.py', 'utf8') && DIRAC_PY === fs.readFileSync('./selfcheck/dirac_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(EQ_PY) && /ALL EQUATION CHECKS PASS/.test(EQ_PY) && /ALL DIRAC MATRIX CHECKS PASS/.test(DIRAC_PY), 'script interfaces');
// ---- an independent Clifford product (written here, not shared with the Python)
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const bm = (a, b, sq) => { let s = 1; for (let i = 0; i < sq.length; i++) if (b >> i & 1 && pc(a >> (i + 1)) % 2) s = -s; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
// ---- A. commutators of bivectors, every signature, n = 2..7
for (let n = 2; n <= 7; n++) {
  const biv = [...Array(1 << n).keys()].filter(m => pc(m) === 2); let edgesAny = null;
  for (let p = 0; p <= n; p++) {
    const sq = Array.from({ length: n }, (_, i) => (i < p ? 1 : -1)); let edges = 0, tri = new Map();
    for (let i = 0; i < biv.length; i++) for (let j = i + 1; j < biv.length; j++) {
      const a = biv[i], b = biv[j], [m1, s1] = bm(a, b, sq), [m2, s2] = bm(b, a, sq); ok(m1 === m2, 'same blade both orders');
      const c = s1 - s2, share = pc(a & b);
      if (share === 1) { ok(Math.abs(c) === 2 && pc(a ^ b) === 2, `n=${n} p=${p}: commutator is 2 x a bivector`); edges++; tri.set(a | b, (tri.get(a | b) || 0) + 1); }
      else ok(c === 0, `n=${n} p=${p}: bivectors sharing ${share} indices commute`);
    }
    if (edgesAny == null) edgesAny = edges; ok(edges === edgesAny && edges === n * (n - 1) * (n - 2) / 2, `n=${n}: ${edges} edges, signature independent`);
    ok(tri.size === C(n, 3) && [...tri.values()].every(v => v === 3), `n=${n}: C(n,3) triangles, each with 3 edges`);
  }
  const r = E.eq.commutators.by_n[n]; ok(r.bivectors === C(n, 2) && r.edges === edgesAny && r.triangles === C(n, 3) && r.commuting_pairs === C(C(n, 2), 2) - edgesAny, `data row n=${n}`);
}
ok(E.eq.commutators.by_n[8].edges === 8 * 7 * 6 / 2 && E.eq.commutators.by_n[8].triangles === 56, 'n=8 row from the formula');
// ---- same graph as the Maxwell couplings and the demicube's edges between bivectors
for (let n = 3; n <= 7; n++) ok(S.demicube.maxwell[n].coupled_pairs === E.eq.commutators.by_n[n].edges, `Maxwell coupled pairs = non-commuting pairs, n=${n}`);
for (let n = 3; n <= 8; n++) ok(S.demicube.rows[n].edges_by_grade_pair['2-2'] === E.eq.commutators.by_n[n].edges, `demicube 2-2 edges = non-commuting pairs, n=${n}`);
// ---- the 16-cell: poles 1 and txyz, equator = six bivectors; the commuting pairs are antipodes
{ const ev = [...Array(16).keys()].filter(m => pc(m) % 2 === 0), adj = (a, b) => pc(a ^ b) === 2, non = []; for (const a of ev) for (const b of ev) if (a < b && !adj(a, b)) non.push([a, b]);
  ok(non.length === 4 && non.every(([a, b]) => (a ^ b) === 15), 'non-adjacent even pairs at n=4 are the 4 antipodes (complements)');
  ok(non.filter(([a, b]) => pc(a) === 2).length === 3 && non.some(([a, b]) => a === 0 && b === 15), 'three of them are commuting bivector pairs, the fourth is scalar-pseudoscalar');
  ok(JSON.stringify(S.demicube.rows[4].edges_by_grade_pair) === JSON.stringify({ '0-2': 6, '2-2': 12, '2-4': 6 }), '16-cell edges: 6 + 12 + 6'); }
// ---- role rule for 1 + 3: boost-boost -> rotation, rotation-rotation -> rotation, rotation-boost -> boost
{ const sq = [1, -1, -1, -1], biv = [3, 5, 6, 9, 10, 12], role = m => (m & 1 ? 'E' : 'B'), tab = {};
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const a = biv[i], b = biv[j]; if (pc(a & b) !== 1) continue; const k = [role(a), role(b)].sort().join('+') + ' via ' + ((a & b) & 1 ? 't' : 's') + ' -> ' + role(a ^ b); tab[k] = (tab[k] || 0) + 1; }
  ok(JSON.stringify(tab) === JSON.stringify({ 'B+E via s -> E': 6, 'B+B via s -> B': 3, 'E+E via t -> B': 3 }) || (tab['B+E via s -> E'] === 6 && tab['B+B via s -> B'] === 3 && tab['E+E via t -> B'] === 3 && Object.keys(tab).length === 3), 'Lorentz algebra: 3 + 3 + 6');
  const R = E.eq.commutators.roles['1,3']; ok(R['E+E via t'].result === 'B' && R['E+E via t'].edges === 3 && R['B+B via s'].result === 'B' && R['B+E via s'].result === 'E' && R['B+E via s'].edges === 6, 'role table in the data'); }
ok(E.eq.commutators.roles['2,2']['E+E via s'].result === 'T' && E.eq.commutators.roles['2,2']['E+E via t'].result === 'B', 'with two time axes the result depends on the shared index kind');
// ---- B. Dirac in the even subalgebra of Cl(1,3), recomputed here
const SQ = [1, -1, -1, -1], AXN = ['t', 'x', 'y', 'z'];
const [Jm, Js] = bm(1 << 2, 1 << 1, SQ);
{ const [m0, s0] = bm(Jm, Jm, SQ); ok(m0 === 0 && s0 * Js * Js === -1 && pc(Jm) === 2, 'J = gamma_2 gamma_1 is a bivector with J^2 = -1'); }
const even = [...Array(16).keys()].filter(m => pc(m) % 2 === 0), odd = [...Array(16).keys()].filter(m => pc(m) % 2 === 1);
const inc = [];
for (const s of even) { for (let mu = 0; mu < 4; mu++) { const [m1, s1] = bm(1 << mu, s, SQ), [m2, s2] = bm(m1, Jm, SQ); inc.push({ from: s, kind: 'd' + AXN[mu], to: m2, sign: s1 * s2 * Js }); } const [m3, s3] = bm(s, 1, SQ); inc.push({ from: s, kind: 'm', to: m3, sign: s3 }); }
const key = e => `${e.from}|${e.kind}|${e.to}|${e.sign}`;
ok(inc.length === 40 && E.eq.dirac.incidences.length === 40 && JSON.stringify(inc.map(key).sort()) === JSON.stringify(E.eq.dirac.incidences.map(key).sort()), '40 incidences recomputed equal the data (blade, derivative, target, sign)');
{ const by = {}; for (const e of inc) (by[e.to] ||= []).push(e.kind); ok(Object.keys(by).length === 8 && Object.values(by).every(v => v.length === 5 && v.includes('m') && ['dt', 'dx', 'dy', 'dz'].every(k => v.includes(k))), '8 equations, each with 4 derivative terms and 1 mass term'); }
ok(inc.filter(e => e.kind !== 'm').every(e => (e.from ^ e.to) === ((1 << AXN.indexOf(e.kind[1])) ^ Jm)) && inc.filter(e => e.kind === 'm').every(e => (e.from ^ e.to) === 1), 'derivative edges = cube edge + shift by J; mass edges = time edges');
{ const cube = new Set(); for (const e of inc.filter(e => e.kind !== 'm')) { const a = e.from, b = a ^ (1 << AXN.indexOf(e.kind[1])); cube.add(Math.min(a, b) + ',' + Math.max(a, b)); } ok(cube.size === 32, 'the derivative terms use all 32 edges of the 4-cube'); }
// determinant of psi -> p psi + m psi gamma_0 (8 x 8, exact, BigInt Bareiss) = +-(p^2 - m^2)^4
const bareiss = M => { const n = M.length; M = M.map(r => r.slice()); let sign = 1n, prev = 1n; for (let k = 0; k < n - 1; k++) { if (M[k][k] === 0n) { const p = M.findIndex((r, i) => i > k && r[k] !== 0n); if (p < 0) return 0n; [M[k], M[p]] = [M[p], M[k]]; sign = -sign; } for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) / prev; prev = M[k][k]; } return sign * M[n - 1][n - 1]; };
const symbol = (p, m) => { const cols = even.map(s => { const o = {}; for (let i = 0; i < 4; i++) if (p[i]) { const [mm, ss] = bm(1 << i, s, SQ); o[mm] = (o[mm] || 0n) + BigInt(ss * p[i]); } const [m3, s3] = bm(s, 1, SQ); o[m3] = (o[m3] || 0n) + BigInt(s3 * m); return odd.map(t => o[t] || 0n); }); return odd.map((_, i) => even.map((_, j) => cols[j][i])); };
for (const [p, m] of [[[1, 0, 0, 0], 1], [[2, 1, 0, 0], 1], [[1, 2, 3, 4], 2], [[5, 3, 4, 0], 3], [[7, 2, 1, 3], 4], [[0, 0, 0, 0], 1], [[3, 0, 0, 0], 3]]) {
  const p2 = p[0] ** 2 - p[1] ** 2 - p[2] ** 2 - p[3] ** 2, d = bareiss(symbol(p, m)), ex = BigInt(p2 - m * m) ** 4n; ok((d < 0n ? -d : d) === ex, `det = (p^2 - m^2)^4 at p=${p} m=${m}`); }
for (const r of E.eq.dirac.dispersion) ok(r.det_abs === r.expected, 'stored determinant equals its expected value');
ok(E.eq.dirac.solution_space.massive_shell_real_dim === 4 && E.eq.dirac.solution_space.off_shell_real_dim === 0 && E.eq.dirac.covariance.verified && E.eq.dirac.covariance.bivector_generators === 6, 'shell dimensions and covariance flags');
// ---- the numpy cross-check result
ok(E.matrix.worst_error < 1e-12 && E.matrix.bijection_rank === 8 && E.matrix.trials === 200 && Object.values(E.matrix.negative_controls_fail_with_error).every(x => x > 0.1), 'gamma-matrix check: tiny error on the right equation, large on the wrong ones');
// ---- copy, tags, careful claims
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it), 'copy top keys'); for (const part of ['c', 'd', 't', 'dl']) ok(keys(COPY.en[part]) === keys(COPY.it[part]), `copy keys ${part}`);
for (const k of ['cube', 'maxwell', 'comm', 'disp', 'mat']) ok(keys(COPY.en.d[k]) === keys(COPY.it.d[k]), `copy keys d.${k}`);
for (const lang of ['en', 'it']) { const t = COPY[lang];
  for (const [ks] of t.c.points) for (const k of ks) ok(STORY[lang].tags[k], `${lang} tag ${k}`); for (const r of t.t.rows) for (const k of r[4]) ok(STORY[lang].tags[k], `${lang} tally tag ${k}`);
  ok(t.c.points.length === 4 && t.t.rows.length === eqNavIds().length && t.c.cols.length === 5 && t.d.tags.length === 3, `${lang} shapes of copy`);
  for (const p of [0, 1, 2, 3, 4]) ok(t.c.cap(p) && !/undefined|NaN/.test(t.c.cap(p)), `${lang} caption p=${p}`);
  const all = JSON.stringify(t); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /\bwall\b|\breset/i]) ok(!b.test(all), `${lang} banned ${b}`); }
ok(/Nothing here selects a number of generations/.test(COPY.en.d.limits) && /Nothing here predicts anything/.test(COPY.en.t.note) && /none new/.test(COPY.en.t.note), 'limits and tally honesty sentences');
ok(/Hestenes/.test(COPY.en.d.limits) && /known formulation/.test(COPY.en.d.limits), 'Dirac is flagged as a known formulation');
ok(E.eq.dirac.counts.incidences === 40 && COPY.en.t.rows[2][3] === '40' && COPY.en.t.rows[0][3] === `${S.demicube.maxwell[4].incidences} in 4D` && COPY.en.t.rows[1][3].startsWith('12'), 'tally rows match the data');
// ---- the page exists and is wired
ok(PAGES.join() === 'rule,atlas,maxwell,furey,shapes,equations,map,ask', 'page order'); for (const lang of ['en', 'it']) { const p = STORY[lang].pages.equations; ok(p && p.h && p.does && p.before && p.after && p.tags.length === 4 && STORY[lang].nav.equations, `${lang} equations page copy`); }
ok(/EquationsSection/.test(fs.readFileSync('./App.jsx', 'utf8')) && /page==='equations'/.test(fs.readFileSync('./App.jsx', 'utf8')), 'App renders the equations page');
console.log(bad ? bad + ' FAILURES' : 'ALL EQUATIONS TESTS PASS'); process.exit(bad ? 1 : 0);
