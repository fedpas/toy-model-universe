// The spring widgets of step 12: one oscillator as a rotor, and a spring network on the n-cube (vertices = masses, edges = springs, faces = closure).
// Floating point for the pictures; the authority is selfcheck/spring_selfcheck.py (exact rationals). test_spring.mjs recomputes every number the page shows.
import { mk, pc } from './spinEngine.js';

export const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };

// ---------------------------------------------------------------- A. one oscillator, three kinds of i
// The phase vector s = x u + q v with u² = a, v² = b and B = uv. Its flow is s' = ω B s, and B² = −ab. Then x'' = −ab ω² x.
export const KINDS = { harmonic: [1, 1], inverted: [1, -1], free: [0, 1] };
export function oscillator(kind, w, t, x0, q0) {
  const [a, b] = KINDS[kind], A = mk([a, b]), u = A.g(0), v = A.g(1), B = A.mul(u, v), Bsq = A.get(A.mul(B, B), 0);
  // closed form from the three cases of B²
  let x, q;
  if (Bsq === -1) { x = x0 * Math.cos(w * t) + q0 * Math.sin(w * t); q = q0 * Math.cos(w * t) - x0 * Math.sin(w * t); }
  else if (Bsq === 1) { x = x0 * Math.cosh(w * t) - q0 * Math.sinh(w * t); q = q0 * Math.cosh(w * t) - x0 * Math.sinh(w * t); }
  else { x = x0 + w * q0 * t; q = q0; }
  // the rotor with the HALF angle: R = exp(ω t B / 2), the sandwich R s R~ = exp(ω t B) s
  const s0 = A.add(A.scale(u, x0), A.scale(v, q0));
  const expo = c => { let term = A.one, sum = A.one; for (let k = 1; k < 60; k++) { term = A.scale(A.mul(term, B), c / k); sum = A.add(sum, term); } return sum; };
  const R = expo(w * t / 2), sand = A.mul(A.mul(R, s0), A.rev(R)), full = A.mul(A.mul(expo(w * t), s0), A.rev(expo(w * t)));
  const tol = 1e-6 * Math.max(1, Math.abs(x), Math.abs(q));
  return { a, b, Bsq, k2: 0 - a * b, x, q, sx: A.get(sand, 1), sq: A.get(sand, 2), okHalf: Math.abs(A.get(sand, 1) - x) < tol && Math.abs(A.get(sand, 2) - q) < tol, okFull: Math.abs(A.get(full, 1) - x) < tol, s2: A.get(A.mul(s0, s0), 0) };
}
export const orbit = (kind, w, x0, q0, T, N = 120) => Array.from({ length: N + 1 }, (_, i) => { const t = T * i / N, o = oscillator0(kind, w, t, x0, q0); return [o.x, o.q, t]; });
// the closed form only (fast, for drawing an orbit)
export function oscillator0(kind, w, t, x0, q0) {
  const [a, b] = KINDS[kind], Bsq = -a * b;
  if (Bsq === -1) return { x: x0 * Math.cos(w * t) + q0 * Math.sin(w * t), q: q0 * Math.cos(w * t) - x0 * Math.sin(w * t) };
  if (Bsq === 1) return { x: x0 * Math.cosh(w * t) - q0 * Math.sinh(w * t), q: q0 * Math.cosh(w * t) - x0 * Math.sinh(w * t) };
  return { x: x0 + w * q0 * t, q: q0 };
}

// ---------------------------------------------------------------- B. the cube as a spring network
export const walsh = (s, x) => (pc(x & s) & 1 ? -1 : 1);
export const verts = n => Array.from({ length: 1 << n }, (_, i) => i);
export const edges = n => { const r = []; for (let x = 0; x < 1 << n; x++) for (let i = 0; i < n; i++) if (!(x >> i & 1)) r.push([x, x | 1 << i, i]); return r; };
export const faces = n => { const r = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let x = 0; x < 1 << n; x++) if (!(x >> i & 1) && !(x >> j & 1)) r.push([x, i, j]); return r; };
export const counts = n => ({ V: 1 << n, E: edges(n).length, F: faces(n).length });
export const omega2 = s => 2 * pc(s);
export const mode = (n, s, t) => verts(n).map(x => walsh(s, x) * Math.cos(Math.sqrt(omega2(s)) * t));
// plucking one vertex: x0 = delta_v, v0 = 0
export const pluck = (n, v, t) => verts(n).map(i => { let c = 0; for (let s = 0; s < 1 << n; s++) c += walsh(s, v) * walsh(s, i) * Math.cos(Math.sqrt(omega2(s)) * t); return c / (1 << n); });
export const pluckVel = (n, v, t) => verts(n).map(i => { let c = 0; for (let s = 0; s < 1 << n; s++) { const w = Math.sqrt(omega2(s)); c -= walsh(s, v) * walsh(s, i) * w * Math.sin(w * t); } return c / (1 << n); });
export const springEnergy = (n, x) => edges(n).reduce((e, [a, b]) => e + (x[a] - x[b]) ** 2 / 2, 0);
export const kinetic = xd => xd.reduce((e, c) => e + c * c / 2, 0);
// the share of the pluck in each level j = |s|: sum over |s| = j of (w_s(v)/2^n)² |w_s|² = C(n,j)/2^n
export const levelShare = (n, j) => binom(n, j) / (1 << n);
// the stretch of an edge field and the sum around a face (face (x,i,j): x -> x+i -> x+i+j -> x+j -> x)
export const stretch = (n, u) => { const f = new Map(); for (const [a, b] of edges(n)) f.set(a + ',' + b, u[b] - u[a]); return f; };
export function faceSums(n, f) { return faces(n).map(([x, i, j]) => { const xi = x | 1 << i, xj = x | 1 << j, xij = xi | 1 << j; return f.get(x + ',' + xi) + f.get(xi + ',' + xij) - f.get(xj + ',' + xij) - f.get(x + ',' + xj); }); }
export const randomField = (n, seed, wild) => { const f = new Map(); let k = seed; for (const [a, b] of edges(n)) { k = (k * 1103515245 + 12345) % 2147483648; f.set(a + ',' + b, (k >> 8) % 7 - 3 + (wild ? 1 : 0)); } return f; };
export const randomDisp = (n, seed) => { let k = seed * 7 + 3; return verts(n).map(() => { k = (k * 1103515245 + 12345) % 2147483648; return (k >> 8) % 9 - 4; }); };

// ---------------------------------------------------------------- C. the Clifford network: the same edges, with the sign of the generator
export function signedD(n) {
  const E = mk(Array(n).fill(1)), N = 1 << n, D = Array.from({ length: N }, () => Array(N).fill(0));
  for (let x = 0; x < N; x++) for (let i = 0; i < n; i++) { const [sg, m] = E.bm(1 << i, x); D[m][x] += sg; }
  return D;
}
export const fluxes = n => { const D = signedD(n); return faces(n).map(([x, i, j]) => { const xi = x ^ 1 << i, xj = x ^ 1 << j, xij = xi ^ 1 << j; return D[xi][x] * D[xij][xi] * D[xj][xij] * D[x][xj]; }); };
export const matmul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export function signedChecks(n) {
  const D = signedD(n), N = 1 << n, D2 = matmul(D, D), K = D.map((r, i) => r.map((v, j) => (i === j ? n : 0) - v));
  const KK = matmul(K, K), Z = KK.map((r, i) => r.map((v, j) => v - 2 * n * K[i][j] + (i === j ? n * n - n : 0)));
  return { sym: D.every((r, i) => r.every((v, j) => v === D[j][i])), dsq: D2.every((r, i) => r.every((v, j) => v === (i === j ? n : 0))), tr: D.reduce((s, r, i) => s + r[i], 0), quad: Z.every(r => r.every(v => v === 0)), flux: fluxes(n), N };
}
export const plainLevels = n => Array.from({ length: n + 1 }, (_, j) => ({ w2: 2 * j, mult: binom(n, j) }));
export const signedLevels = n => [{ w2: n - Math.sqrt(n), mult: 1 << (n - 1) }, { w2: n + Math.sqrt(n), mult: 1 << (n - 1) }];
// the energy of the signed network, compared with the sum over edges of (x_i − s_ij x_j)²
export function signedEnergy(n, x) { const D = signedD(n), N = 1 << n; let q = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) q += x[i] * ((i === j ? n : 0) - D[i][j]) * x[j]; const e = edges(n).reduce((s, [a, b]) => s + (x[a] - D[a][b] * x[b]) ** 2, 0); return { quad: q, edgeSum: e }; }

// ---------------------------------------------------------------- D. the labels of step 11 are the normal modes
// conjugation of e_x by the blade e_m: the sign of the Walsh character (−1)^{|x∧m|}, times (−1)^{|x|} when m is odd
export function labelRow(n, m) {
  const E = mk(Array(n).fill(1)), bm = E.blade(m), inv = E.inv(bm), out = [];
  for (let x = 0; x < 1 << n; x++) {
    const got = E.mul(E.mul(bm, E.blade(x)), inv), g = got.get(x) || 0, chi = walsh(m, x), odd = pc(m) & 1 ? (pc(x) & 1 ? -1 : 1) : 1;
    out.push({ x, sign: g, char: chi * odd, ok: got.size === 1 && Math.abs(g - chi * odd) < 1e-9 });
  }
  return out;
}

// a flat picture of the n-cube: one 2-D direction per bit
export const PROJ = [[1, 0], [0, -1], [0.46, -0.36], [-0.42, -0.5], [0.15, 0.58]];
export const project = (n, x, k = 52) => { let px = 0, py = 0; for (let i = 0; i < n; i++) if (x >> i & 1) { px += PROJ[i][0]; py += PROJ[i][1]; } return [px * k, py * k]; };
export const bits = (n, x) => x.toString(2).padStart(n, '0');
