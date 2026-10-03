// The benchmark of the label claims of step 13: the same code runs under node (selfcheck/bench_labels.mjs) and in the browser (the "time it on this device" button).
// What is timed: (1) the 2^n world vertices of an n-cube from a motor: one sandwich per vertex (direct), the frame (n + 1 sandwiches and 2^n - 1 additions), and the frame with
// the odd half as mirror images; (2) the deepest vertex under a plane: a scan of the table against the n sign bits; (3) the flat outline: a convex hull of the 2^n projected points
// against the zonogon built from the n projected edge vectors. All variants return the same answers (checked before timing). Timings depend on the machine and the engine; they are not exact.
import { alg, verticesDirect, verticesFrame, verticesMatrix, verticesMirror, frame, deepestScan, deepestBits, zonogon, hull, project } from './pgaEngine.js';

let SINK = 0;
export const sinkValue = () => SINK;
export function timeIt(fn, now, minMs = 60, reps = 7) {
  let it = 1; for (;;) { const t0 = now(); for (let i = 0; i < it; i++) SINK += fn(i); if (now() - t0 >= minMs || it > 1e7) break; it *= 2; }      // warm-up and calibration: a batch of `it` calls lasts at least minMs
  const iters = it, per = [];
  for (let r = 0; r < reps; r++) { const t0 = now(); for (let i = 0; i < iters; i++) SINK += fn(i); per.push((now() - t0) / iters); }
  per.sort((a, b) => a - b); return { med: per[reps >> 1], min: per[0], max: per[reps - 1], iters };
}
const setup = n => {
  const A = alg(n), s = Array.from({ length: n }, (_, i) => 0.6 + 0.35 * i), planes = [];
  for (let i = 1; i < n; i++) planes.push([i, i + 1, 0.4 + 0.3 * i]);
  const M = A.motor(Array.from({ length: n }, (_, i) => 0.3 * i - 0.2), planes);
  const normals = Array.from({ length: 16 }, (_, t) => Array.from({ length: n }, (_, i) => Math.sin(7.1 * t + 2.3 * i + 1)));
  return { A, s, M, normals };
};
export function checkAll(n) {
  const { A, s, M, normals } = setup(n), fr = frame(A, M, s), D = verticesDirect(A, M, s), F = verticesFrame(A, M, s, fr), Mi = n >= 2 ? verticesMirror(A, fr) : F;
  const Mx = verticesMatrix(A, M, s, fr), near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)); let ok = D.every((v, i) => v.every((x, k) => near(x, F[i][k]) && near(x, Mi[i][k]) && near(x, Mx[i][k])));
  for (const nu of normals) ok = ok && deepestScan(F, nu, 0.1) === deepestBits(fr, nu);
  if (n >= 2) { const P = F.map((v, i) => [...project(n, v), i]), H = hull(P), Z = zonogon(fr.f.map(f => project(n, f))); ok = ok && H.length === Z.length && H.every(x => Z.includes(x)); }
  return ok;
}
// returns rows { n, sandwichesDirect, sandwichesFrame, additions, ns: { direct, frame, matrix (frame, then n^2 flops a vertex), doubling and matrixGiven (the table step alone, frame given), mirror, scan, bits, scanBuilt, bitsBuilt, hull, zono, hullBuilt, zonoBuilt } } with { med, min, max } in nanoseconds per call
export function runBench({ ns = [1, 2, 3, 4, 5, 6], now = () => performance.now(), minMs = 60, reps = 7, onRow = () => {} } = {}) {
  const rows = [];
  for (const n of ns) {
    if (!checkAll(n)) throw new Error('the variants disagree at n = ' + n);
    const { A, s, M, normals } = setup(n), fr = frame(A, M, s), V = verticesFrame(A, M, s, fr), P = V.map((v, i) => [...project(n, v), i]), g = fr.f.map(f => project(n, f));
    const T = (fn) => { const r = timeIt(fn, now, minMs, reps); return { med: r.med * 1e6, min: r.min * 1e6, max: r.max * 1e6 }; };            // ms -> ns
    const out = {
      direct: T(() => verticesDirect(A, M, s)[(1 << n) - 1][0]),
      frame: T(() => verticesFrame(A, M, s)[(1 << n) - 1][0]),
      matrix: T(() => verticesMatrix(A, M, s)[(1 << n) - 1][0]),
      doubling: T(() => verticesFrame(A, M, s, fr)[(1 << n) - 1][0]),
      matrixGiven: T(() => verticesMatrix(A, M, s, fr)[(1 << n) - 1][0]),
      mirror: n >= 2 ? T(() => verticesMirror(A, frame(A, M, s))[(1 << n) - 1][0]) : null,
      scan: T(i => deepestScan(V, normals[i & 15], 0.1)),
      bits: T(i => deepestBits(fr, normals[i & 15])),
      scanBuilt: T(i => deepestScan(verticesFrame(A, M, s), normals[i & 15], 0.1)),
      bitsBuilt: T(i => deepestBits(frame(A, M, s), normals[i & 15])),
      hull: n >= 2 ? T(() => hull(P).length) : null,
      zono: n >= 2 ? T(() => zonogon(g).length) : null,
      hullBuilt: n >= 2 ? T(() => hull(verticesFrame(A, M, s).map((v, i) => [...project(n, v), i])).length) : null,
      zonoBuilt: n >= 2 ? T(() => zonogon(frame(A, M, s).f.map(f => project(n, f))).length) : null,
    };
    const row = { n, sandwichesDirect: 1 << n, sandwichesFrame: n + 1, additions: (1 << n) - 1, ns: out }; rows.push(row); onRow(row);
  }
  return rows;
}
