import fs from 'fs';
import S from './shapesData.js';
import WITT from './shapesWitt.js';
import COPY from './shapesCopy.js';
import { SHAPES_PY } from './shapesSelfcheckSource.js';
import { cliffordCell } from './genesis_audit_v3.js';
import { STORY, PAGES } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const J = JSON.parse(fs.readFileSync('./selfcheck/shapes.json', 'utf8')), MX = JSON.parse(fs.readFileSync('./selfcheck/maxwell.json', 'utf8')).cells;
ok(JSON.stringify(J) === JSON.stringify(JSON.parse(JSON.stringify(S))), 'data equals rebuilt JSON');
ok(SHAPES_PY === fs.readFileSync('./selfcheck/shapes_selfcheck.py', 'utf8'), 'embedded script equals file');
ok(/--compare/.test(SHAPES_PY) && /ALL SHAPE CHECKS PASS/.test(SHAPES_PY), 'script interface');
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
// ---- demicube: f-vectors against values known from the literature, Euler relation, and a count of edges done here from scratch
const known = { 3: [4, 6, 4], 4: [8, 24, 32, 16], 5: [16, 80, 160, 120, 26], 6: [32, 240, 640, 640, 252, 44] };
for (const n of [3, 4, 5, 6, 7, 8]) {
  const r = S.demicube.rows[n]; if (known[n]) ok(JSON.stringify(r.f_vector) === JSON.stringify(known[n]), `f-vector n=${n} against the literature`);
  const chi = r.f_vector.reduce((a, f, k) => a + (k % 2 ? -f : f), 0); ok(chi === 1 - (n % 2 ? -1 : 1), `Euler n=${n}`);
  ok(r.brute_force_verified === true, `brute force flag n=${n}`);
  ok(r.vertices === 2 ** (n - 1) && r.edges === 2 ** (n - 2) * C(n, 2) && r.facets === (n === 3 ? 4 : 2 * n + 2 ** (n - 1)), `vertices, edges, facets n=${n}`);
  let ev = 0, ed = 0; for (let x = 0; x < 1 << n; x++) if (pc(x) % 2 === 0) { ev++; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((x ^ (1 << i) ^ (1 << j)) > x) ed++; }
  ok(ev === r.vertices && ed === r.edges, `edges counted from scratch n=${n}`);
  const byGrade = {}; for (let x = 0; x < 1 << n; x++) if (pc(x) % 2 === 0) byGrade[pc(x)] = (byGrade[pc(x)] || 0) + 1;
  ok(JSON.stringify(Object.entries(byGrade).map(([g, c]) => [String(g), c])) === JSON.stringify(Object.entries(r.even_blades_by_grade)), `even blades by grade n=${n}`);
  ok(Object.values(r.edges_by_grade_pair).reduce((a, b) => a + b, 0) === r.edges, `edges by grade pair sum n=${n}`);
  if (n <= 5) ok(JSON.stringify(r.even_labels) === JSON.stringify([...Array(1 << n).keys()].filter(x => pc(x) % 2 === 0)), `even labels n=${n}`);
}
ok(S.demicube.rows[3].f_vector.join() === '4,6,4' && S.demicube.rows[4].f_vector.join() === '8,24,32,16', 'demicube is the simplex at n=3 and the 16-cell at n=4');
ok(JSON.stringify(S.demicube.rows[5].even_blades_by_grade) === JSON.stringify({ 0: 1, 2: 10, 4: 5 }), 'n=5 even blades 1 + 10 + 5');
// ---- even subalgebras against the independent Clifford engine (genesis_audit_v3.js)
const parse = lab => { const m = /^M(\d+)\((\w)\)( \+ M\d+\(\w\))?$/.exec(lab); return m ? { N: +m[1], base: m[2], copies: m[3] ? 2 : 1 } : { N: 1, base: 'R', copies: 1 }; };
const same = (lab, c) => { const p = parse(lab); return p.N === c.N && p.base === c.kind[0] && p.copies === (c.kind.length > 1 ? 2 : 1); };
let cells = 0;
for (let n = 1; n <= 8; n++) for (let p = 0; p <= n; p++) {
  const q = n - p, e = S.demicube.even_subalgebra[`${p},${q}`], full = cliffordCell(p, q), half = q >= 1 ? cliffordCell(p, q - 1) : cliffordCell(0, p - 1);
  ok(same(e.full, full) && same(e.even, half), `Cl(${p},${q}) full ${e.full} vs ${full.algebra}, even ${e.even} vs ${half.algebra}`);
  ok(half.dim === 2 ** (n - 1), `even half dimension Cl(${p},${q})`); cells++;
}
ok(cells === 44, 'all signatures up to n = 8');
ok(S.demicube.even_subalgebra['4,4'].even === 'M8(R) + M8(R)' && S.demicube.even_subalgebra['4,3'].full === 'M8(R) + M8(R)', 'even half of Cl(4,4) is the whole of Cl(4,3)');
// ---- Maxwell: incidences, supports and couplings recomputed from the published cells (maxwell.json), independent of the shapes script
for (const [key, cell] of Object.entries(MX)) {
  const n = cell.n; if (n < 2 || n > 7) continue;
  const inc = cell.incidences, pairs = new Set(inc.map(e => `${e.source}>${e.target}@${e.axis}`));
  ok(inc.length === S.demicube.maxwell[n].incidences, `cell ${key}: incidences ${inc.length}`);
  ok(inc.every(e => pc(e.source) === 2 && pc(e.target) % 2 === 1 && (e.source ^ (1 << e.axis)) === e.target && e.op === (e.source >> e.axis & 1 ? 'contract' : 'wedge')), `cell ${key}: every incidence is a cube edge from a bivector to an odd blade`);
  const supp = {}; for (const e of inc) (supp[e.target] ||= new Set()).add(e.source);
  const sizes = {}; for (const [t, s] of Object.entries(supp)) (sizes[pc(+t)] ||= new Set()).add(s.size);
  ok(sizes[1] && [...sizes[1]].join() === String(n - 1), `cell ${key}: vector equations use n-1 terms`);
  if (n >= 3) ok([...sizes[3]].join() === '3', `cell ${key}: trivector equations use 3 terms`);
  // coupling: two bivectors in a common equation
  const cp = new Set(); for (const s of Object.values(supp)) { const a = [...s].sort((x, y) => x - y); for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) cp.add(a[i] + ',' + a[j]); }
  ok(cp.size === S.demicube.maxwell[n].coupled_pairs, `cell ${key}: coupled pairs ${cp.size}`);
  if (n >= 3) ok(cp.size === S.demicube.rows[n]?.edges_by_grade_pair['2-2'] || n === 2, `cell ${key}: coupled pairs = demicube edges between bivectors`);
  // F components are exactly the bivectors, all even; sources and equations are odd; roles
  const roles = {}; for (const b of cell.blades) (roles[b.role] ||= new Set()).add(b.grade);
  ok([...(roles.E || [])].every(g => g === 2) && [...(roles.B || [])].every(g => g === 2) && [...(roles.T || [])].every(g => g === 2), `cell ${key}: E, B, T are bivectors`);
  ok([...(roles.rho || [])].every(g => g === 1) && [...(roles.J || [])].every(g => g === 1), `cell ${key}: rho and J are vectors`);
  ok(cell.counts.E + cell.counts.B + cell.counts.T === C(n, 2), `cell ${key}: F components`);
}
ok(S.demicube.maxwell[4].vector_equations === 4 && S.demicube.maxwell[4].trivector_equations === 4, 'n=4: four vector and four trivector equations');
// ---- orthoplex
for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
  const r = S.orthoplex.ladder[n], c = cliffordCell(n, n);
  ok(r.vertices === 2 * n && r.edges === 2 * n * (n - 1) && r.facets === 2 ** n && r.faces_total_with_empty === 3 ** n && r.genesis_node === 2 * n, `orthoplex counts n=${n}`);
  ok(r.matrix_size === c.N && c.kind === 'R' && c.N === 2 ** n, `Cl(${n},${n}) = M_${2 ** n}(R) from the independent engine`);
  ok(r.faces_by_vertices.reduce((a, b) => a + b, 1) === 3 ** n, `orthoplex faces sum n=${n}`);
  for (let m = 1; m <= n; m++) ok(r.faces_by_vertices[m - 1] === C(n, m) * 2 ** m, `faces with ${m} vertices, n=${n}`);
  // duality: faces with m vertices = subcubes of dimension n - m
  for (let m = 0; m <= n; m++) ok((m === 0 ? 1 : r.faces_by_vertices[m - 1]) === C(n, n - m) * 2 ** (n - (n - m)), `dual cube face count n=${n} m=${m}`);
}
ok(S.orthoplex.ladder[5].algebra.includes('M32'), 'node 10 algebra');
ok(S.orthoplex.n4_triality.vertices_equal_half_facets_only_at_n.join() === '4', 'triality count only at n=4');
{ const only = []; for (let n = 1; n < 40; n++) if (2 * n === 2 ** (n - 1)) only.push(n); ok(only.join() === '4', 'recomputed: 2n = 2^(n-1) only at n = 4'); }
// E8: 112 + 128 roots, norm and integrality recomputed here
{ const n = 8, R = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (const a of [2, -2]) for (const b of [2, -2]) { const v = Array(n).fill(0); v[i] = a; v[j] = b; R.push(v); }
  for (let m = 0; m < 256; m++) if (pc(m) % 2 === 0) R.push(Array.from({ length: n }, (_, i) => (m >> i & 1) ? -1 : 1));
  ok(R.length === 240 && R.every(v => v.reduce((s, x) => s + x * x, 0) === 8), '240 roots of norm 2 (coordinates doubled)');
  let integ = true; for (const a of R) for (const b of R) { const ip = a.reduce((s, x, i) => s + x * b[i], 0); if ((2 * ip) % 8) integ = false; } ok(integ, 'integrality of the 240 roots');
  const key = v => v.join(','), set = new Set(R.map(key)); let closed = true; for (const a of R) for (const b of R) { const k = 2 * a.reduce((s, x, i) => s + x * b[i], 0) / 8; if (!set.has(key(a.map((x, i) => x - k * b[i])))) closed = false; } ok(closed, 'closed under reflections'); }
ok(S.orthoplex.exceptional_series.E6.roots === 72 && S.orthoplex.exceptional_series.E7.roots === 126 && S.orthoplex.exceptional_series.E8.roots === 240, 'E6, E7, E8 root counts');
for (const [E, n] of [['E6', 5], ['E7', 6], ['E8', 7]]) { const e = S.orthoplex.exceptional_series[E]; ok(e.grade0 === 2 * n * (n - 1) && 2 * e.grade_pm1_each === 2 ** n && e.roots === e.grade0 + 2 * e.grade_pm1_each + 2 * e.grade_pm2_each, `${E} grading = orthoplex ${n}`); }
{ const L = JSON.parse(fs.readFileSync('./orthoplex/ladder.json', 'utf8')).witt_axes_as_tesseract; const canon = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])); ok(canon(L) === canon(WITT), 'Witt-axes data equals orthoplex/ladder.json'); ok(WITT['H_is_a_square(4 axes)'] && WITT['C+e7R+R_is_a_square(4 axes)'] && WITT['O1+O2_is_a_cube(3-dim affine, 8 axes)'] && WITT['H+C+e7R+R_is_a_cube(8 axes)'], 'tesseract facts'); }
// ---- copy: both languages complete, tags valid, no banned claims
const keys = o => Object.keys(o).sort().join();
for (const part of ['o', 'd']) ok(keys(COPY.en[part]) === keys(COPY.it[part]), `copy keys ${part}`);
ok(keys(COPY.en) === keys(COPY.it), 'copy top keys');
for (const k of Object.keys(COPY.en.d)) if (typeof COPY.en.d[k] === 'object' && !Array.isArray(COPY.en.d[k])) ok(keys(COPY.en.d[k]) === keys(COPY.it.d[k]), `copy keys d.${k}`);
for (const lang of ['en', 'it']) { const o = COPY[lang].o; ok(o.points.length === 6 && o.cols.length === 8 && o.shapes.length === 9, `${lang} orthoplex copy`); for (const [ks] of o.points) for (const k of ks) ok(STORY[lang].tags[k], `${lang} tag ${k}`);
  for (const n of [3, 4, 5, 6, 7, 8]) { const t = COPY[lang].d; ok(t.cube.t(n) && t.cliff.t(n) && t.simp.t(n) && t.lab.t(n) && t.mx.t(Math.min(n, 7)), `${lang} demicube copy n=${n}`); }
  const all = JSON.stringify(COPY[lang]); for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict/i, /confirms?\b/i, /GUT\b/, /grand unif/i]) ok(!b.test(all), `${lang} banned ${b}`); }
ok(/does not show/i.test(COPY.en.d.limits) && /no shape here selects three generations/.test(COPY.en.d.limits), 'limits sentence present');
ok(/not an identification/.test(COPY.en.d.fur.t) && /open/.test(COPY.en.d.fur.t), 'Furey cross-reference is flagged as not an identification');
// ---- the story shell has the page
ok(PAGES.includes('shapes') && PAGES.indexOf('shapes') === PAGES.indexOf('furey') + 1 && PAGES.at(-1) === 'ask', 'page order');
for (const lang of ['en', 'it']) { const p = STORY[lang].pages.shapes; ok(p && p.h && p.does && p.before && p.after && p.tags.length === 4 && STORY[lang].nav.shapes, `${lang} shapes page copy`); }
console.log(bad ? bad + ' FAILURES' : 'ALL SHAPES TESTS PASS'); process.exit(bad ? 1 : 0);
