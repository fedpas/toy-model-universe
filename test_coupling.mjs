import { eqNavIds } from './steps.js';
import fs from 'fs';
import K from './couplingData.js';
import COPY, { ringNodes } from './couplingCopy.js';
import EQC from './equationsCopy.js';
import { CP_PY, CPM_PY } from './couplingSelfcheckSource.js';
import { STORY } from './storyCopy.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
// ---- shipped data and scripts are the files
const J = JSON.parse(fs.readFileSync('./selfcheck/coupling.json', 'utf8')), JM = JSON.parse(fs.readFileSync('./selfcheck/coupling_matrix.json', 'utf8'));
ok(JSON.stringify(J) === JSON.stringify(K.coupling) && JSON.stringify(JM) === JSON.stringify(K.matrix), 'data modules equal the json files');
ok(CP_PY === fs.readFileSync('./selfcheck/coupling_selfcheck.py', 'utf8') && CPM_PY === fs.readFileSync('./selfcheck/coupling_matrix_check.py', 'utf8'), 'embedded scripts equal files');
ok(/--compare/.test(CP_PY) && /ALL COUPLING CHECKS PASS/.test(CP_PY) && /ALL MATRIX CHECKS PASS/.test(CPM_PY), 'script interfaces');
// ---- an independent Clifford product (written here)
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const bm = (a, b, sq) => { let s = 1; for (let i = 0; i < sq.length; i++) if (b >> i & 1 && pc(a >> (i + 1)) % 2) s = -s; const c = a & b; for (let i = 0; i < sq.length; i++) if (c >> i & 1) s *= sq[i]; return [a ^ b, s]; };
const rv = m => (pc(m) * (pc(m) - 1) / 2) % 2 ? -1 : 1;
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
const CELL = ['M1(R) + M1(R)', 'M2(R)', 'M2(C)', 'M2(H)', 'M2(H) + M2(H)', 'M4(H)', 'M8(C)', 'M16(R)'];
const EVEN_HALF = ['R', 'M1(R) + M1(R)', 'M2(R)', 'M2(C)', 'M2(H)', 'M2(H) + M2(H)', 'M4(H)', 'M8(C)'];
const Jexp = [false, false, true, true, true, true, true, true];
for (let n = 1; n <= 8; n++) {
  const r = K.coupling.ladder[n], sq = Array.from({ length: n }, (_, i) => (i === 0 ? 1 : -1));
  const even = [...Array(1 << n).keys()].filter(m => pc(m) % 2 === 0), odd = [...Array(1 << n).keys()].filter(m => pc(m) % 2 === 1);
  ok(r.algebra === CELL[n - 1] && r.even_half === EVEN_HALF[n - 1], `n=${n}: Cl(1,${n - 1}) and its even half`);
  ok(r.psi_components === even.length && r.psi_components === 2 ** (n - 1) && r.even_corners === even.length && r.odd_corners === odd.length, `n=${n}: component counts`);
  ok(r.F_components === C(n, 2) && r.maxwell_incidences === n * C(n, 2), `n=${n}: Maxwell counts`);
  ok(r.dirac_real_dim === 2 ** (Math.floor(n / 2) + 1), `n=${n}: real Dirac dimension`);
  ok(r.psi_over_dirac === (({ 1: '1/2', 2: '1/2', 3: '1', 4: '1', 5: '2', 6: '2', 7: '4', 8: '4' })[n]), `n=${n}: ratio psi / Dirac`);
  // complex structure: bivector, squares to -1, commutes with gamma_0 (mask 1)
  const Js = [...Array(1 << n).keys()].filter(m => pc(m) === 2 && bm(m, m, sq)[0] === 0 && bm(m, m, sq)[1] === -1 && bm(m, 1, sq).join() === bm(1, m, sq).join());
  ok(Js.length === r.J_count && (Js.length > 0) === r.J_exists && r.J_exists === Jexp[n - 1], `n=${n}: complex structure J exists = ${Jexp[n - 1]}, count ${Js.length}`);
  ok(!r.J_exists || (r.J_label === 6 && Js.includes(6)), `n=${n}: J label 6`);
  // the current psi gamma_0 psi~ : blade of the product of psi_S, gamma_0, rev(psi_T), with its sign; symmetrised over S <-> T
  const coef = new Map();
  for (const S of even) for (const T of even) { if (S > T) continue; const [a, s1] = bm(S, 1, sq), [b, s2] = bm(a, T, sq); const s = s1 * s2 * rv(T); let tot = s; if (S !== T) { const [a2, t1] = bm(T, 1, sq), [b2, t2] = bm(a2, S, sq); tot += t1 * t2 * rv(S); ok(b2 === b, 'same blade'); } const key = b + '|' + S + '|' + T; if (tot !== 0) coef.set(key, [b, tot, S, T]); }
  const byBlade = {}; for (const [b, tot, S, T] of coef.values()) { (byBlade[b] ||= []).push([tot, S, T]); }
  const grades = [...new Set(Object.keys(byBlade).map(b => pc(+b)))].sort((x, y) => x - y);
  ok(JSON.stringify(grades) === JSON.stringify(r.current_grades) && grades.every(g => g % 4 === 1), `n=${n}: current grades ${grades}`);
  for (const g of grades) ok(Object.keys(byBlade).filter(b => pc(+b) === g).length === r.current_blades[g], `n=${n}: grade ${g} blade count`);
  for (const g of grades) ok([...coef.values()].filter(([b]) => pc(b) === g).length === r.current_monomials[g], `n=${n}: grade ${g} monomial count`);
  // density: coefficient of gamma_0 (mask 1) only from S = T and positive; vector components from corners differing by bits {0,k}
  ok((byBlade[1] || []).every(([t, S, T]) => S === T && t > 0) && (byBlade[1] || []).length === even.length && r.rho_terms === even.length && r.rho_positive_definite, `n=${n}: density is a sum of squares over all corners`);
  for (let k = 1; k < n; k++) { const bl = byBlade[1 << k] || []; ok(bl.length === (n >= 2 ? 2 ** (n - 2) : 0) && bl.every(([t, S, T]) => (S ^ T) === (1 | (1 << k))), `n=${n}: component ${k} uses the demicube edges {0,${k}}`); }
  if (n >= 2) ok(r.demicube_edges_of_type_0k === 2 ** (n - 2), `n=${n}: edge count of type {0,k}`);
  const dist = new Set(); for (const [b, , S, T] of coef.values()) if (pc(b) === 5) dist.add(pc(S ^ T));
  ok(JSON.stringify([...dist].sort()) === JSON.stringify(r.pair_distance['5'] || []), `n=${n}: grade-5 pair distances ${[...dist]}`);
  // minimal coupling and derivative terms, equation by equation
  if (r.J_exists) {
    const Jm = 6, [, sJ] = bm(1 << 2, 1 << 1, sq); ok(bm(1 << 2, 1 << 1, sq)[0] === Jm, 'J = gamma_2 gamma_1 has mask 6');
    const eq = new Map(odd.map(o => [o, { A: [], d: [], m: [] }]));
    for (const S of even) {
      for (let k = 0; k < n; k++) { eq.get(S ^ (1 << k)).A.push(S); const [a] = bm(S, Jm, sq); eq.get(a ^ (1 << k)).d.push(S); }
      eq.get(S ^ 1).m.push(S);
    }
    let all = 0, simplexOk = true;
    for (const [o, v] of eq) { ok(v.A.length === n && v.d.length === n && v.m.length === 1, `n=${n} blade ${o}: n + n + 1 terms`); all += v.A.length + v.d.length + v.m.length;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (pc(v.A[i] ^ v.A[j]) !== 2) simplexOk = false; }
    ok(simplexOk && r.coupling_terms_are_corner_simplex === true, `n=${n}: the n even neighbours are pairwise at distance 2 (a simplex)`);
    ok(all === (2 * n + 1) * 2 ** (n - 1) && r.incidences_total === all && r.coupling_edges === n * 2 ** (n - 1) && r.derivative_edges === n * 2 ** (n - 1) && r.mass_edges === 2 ** (n - 1), `n=${n}: ${all} terms in all`);
    ok(eq.get(1).m.join() === eq.get(1).A.filter(S => S === 0).join(), `n=${n}: the mass neighbour of t is its time-edge neighbour`);
    // ring picture data equals the equation at the blade t
    const R = ringNodes(n); ok(JSON.stringify(R.map(x => x.inner).sort((a, b) => a - b)) === JSON.stringify(eq.get(1).A.slice().sort((a, b) => a - b)) && JSON.stringify(R.map(x => x.outer).sort((a, b) => a - b)) === JSON.stringify(eq.get(1).d.slice().sort((a, b) => a - b)), `n=${n}: ring nodes equal the terms of the equation at t`);
  }
}
// ---- shell dimensions and the extra components
for (let n = 3; n <= 7; n++) { const s = K.coupling.shell[n]; ok(s.kernel_real_dim === 2 ** (n - 2) && s.half_of_psi === 2 ** (n - 2) && s.one_dirac_spinor === 2 ** (Math.floor(n / 2)), `shell n=${n}`); }
for (const n of [3, 4, 5]) { const I = K.coupling.identities[n]; ok(I.conservation_identity && I.gauge_first_order && I.maxwell_forces_div_J_zero && I.algebraic_facts, `identities n=${n}`); }
// ---- the numpy results
const M = K.matrix;
ok(Object.values(M.max_error).every(x => x < 1e-9) && Object.keys(M.max_error).join() === '3,4,5,6,7', 'matrix: tiny errors for n = 3..7');
ok(Object.values(M.rank_real).join() === '4,8,8,16,16', 'matrix: real rank of psi -> psi u');
ok(M.current['5'].psi_with_zero_spinor_but_nonzero_vector_current === true && M.current['3'].ratios_X_over_bilinear.join() === '-1,1' && M.current['4'].ratios_X_over_bilinear.join() === '-1,1', 'matrix: current checks');
ok(Object.keys(M.controls).length === 3 && Object.values(M.controls).every(v => /fails/.test(v)), 'matrix: three negative controls fail');
ok(/range\(40\)/.test(CPM_PY), 'the 200 cases in the copy are 40 per n for n = 3..7');
// ---- copy
const keys = o => Object.keys(o).sort().join();
ok(keys(COPY.en) === keys(COPY.it), 'copy keys'); ok(keys(COPY.en.dl) === keys(COPY.it.dl), 'dl keys');
for (const lang of ['en', 'it']) { const t = COPY[lang];
  for (let n = 1; n <= 8; n++) { const v = t.views(K.coupling.ladder[n]); ok(v.length === 7 && v.map(x => x.h).length === 7, `${lang} n=${n}: 7 views`); for (const x of v) for (const g of x.tags) ok(STORY[lang].tags[g], `${lang} tag ${g}`); ok(t.ringCap(n) && t.ringNone(n) && t.viewsH(n), `${lang} n=${n} captions`); }
  for (const [k] of t.xr) ok(STORY[lang].tags[k], `${lang} xr tag`); for (const [k] of t.open) ok(STORY[lang].tags[k], `${lang} open tag`);
  const all = JSON.stringify([t, [1, 2, 3, 4, 5, 6, 7, 8].map(n => t.views(K.coupling.ladder[n]))]); ok(!/undefined|NaN|\[object/.test(all), `${lang} no placeholders`);
  for (const b of [/proves?\b.*generation/i, /explains? why three/i, /predict(s|ed)? (the|a)\b/i, /confirms?\b/i, /GUT\b/, /grand unif/i, /(?<!not a )\bwall\b|\breset/i, /\b1 (blades|components|corners|edges|terms)\b/]) ok(!b.test(all), `${lang} banned ${b}`);
  ok(t.open.length === 4 && t.xr.length === 4, `${lang} open and cross-reference lists`); }
ok(/sign and the size of the source term/.test(COPY.en.open[0][1]) && /nothing here selects three/.test(COPY.en.open[2][1]) && /not derived/.test(COPY.en.open[0][1]), 'open items are stated');
ok(/ratio 2, 2, 4, 4/.test(COPY.en.xr[2][1]) && /rapporto 2, 2, 4, 4/.test(COPY.it.xr[2][1]), 'doubling ratios in the copy');
ok(/4, 8, 8, 16, 16/.test(COPY.en.mat) && /4, 8, 8, 16, 16/.test(COPY.it.mat), 'rank list in the copy');
// ---- tally and nav
ok(eqNavIds().at(-1) === 'tally' && EQC.en.t.rows.length === eqNavIds().length && EQC.it.t.rows.length === eqNavIds().length, 'equations nav and tally have the coupling entry');
ok(EQC.en.t.rows[3][3] === '72 + 24 in 4D' && EQC.en.t.rows[3][2] === '8 + 6 + 4 in 4D', 'tally row from the data');
ok(/nonlinear/.test(EQC.en.t.note) && /non lineari/.test(EQC.it.t.note), 'tally says the joint systems are nonlinear');
ok(/CouplingSection/.test(fs.readFileSync('./EquationsSection.jsx', 'utf8')) && eqNavIds().includes('coupling'), 'section wired into the page');
console.log(bad ? bad + ' FAILURES' : 'ALL COUPLING TESTS PASS'); process.exit(bad ? 1 : 0);
