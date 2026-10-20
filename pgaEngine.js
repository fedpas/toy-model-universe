// The floating-point engine of step 13 (a rigid body from the segment to the tesseract), on the bit rule with ONE null generator:
// generator 0 is e0 (square 0, bit 0), generators 1..n are the unit directions (square +1). A blade is a bit mask; the product of two blades is the XOR of the masks
// with a sign; two blades that share bit 0 multiply to 0. Plain arrays (see z below) and precomputed sign tables, so a tesseract (32 blades) steps in a few hundred microseconds.
// The authority is selfcheck/pgadyn_selfcheck.py (exact rationals, cross-checked against ganja.js); test_pgadyn.mjs recomputes every number the page shows against it.
export const pc = x => { let c = 0; for (; x; x >>= 1) c += x & 1; return c; };
const cache = {};

export function alg(n) {
  if (cache[n]) return cache[n];
  const N = 1 << (n + 1), full = N - 1;
  const SG = new Int8Array(N * N);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    let s = 1, t = a >> 1; while (t) { if (pc(t & b) & 1) s = -s; t >>= 1; }
    if ((a & b) & 1) s = 0;                                              // e0 e0 = 0
    SG[a * N + b] = s;
  }
  const revS = new Int8Array(N), sgnT = new Int8Array(N);
  for (let m = 0; m < N; m++) { const k = pc(m); revS[m] = (k * (k - 1) / 2) % 2 ? -1 : 1; sgnT[m] = SG[m * N + (full ^ m)]; }
  const idx = f => { const r = []; for (let m = 0; m < N; m++) if (f(m)) r.push(m); return r; };
  const ALL = idx(() => true), EVEN = idx(m => pc(m) % 2 === 0), BIV = idx(m => pc(m) === 2), VEC = idx(m => pc(m) === 1), PTS = idx(m => pc(m) === n), FRC = idx(m => pc(m) === n - 1);
  const z = () => new Array(N).fill(0);                                  // plain arrays: in node 22 a Float64Array of 16 or more doubles costs 2.3 us to allocate, a plain array 0.06 us (measured; see README)
  // product restricted to the given index lists (the operands are sparse: a motor has 2^n coefficients, a point n + 1)
  const mul = (a, b, ia = ALL, ib = ALL, out = z()) => {
    out.fill(0);
    for (let p = 0; p < ia.length; p++) { const i = ia[p], ai = a[i]; if (ai === 0) continue; const row = i * N; for (let q = 0; q < ib.length; q++) { const j = ib[q], s = SG[row + j]; if (s !== 0) out[i ^ j] += s * ai * b[j]; } }
    return out;
  };
  const add = (a, b, c = 1, out = z()) => { for (let i = 0; i < N; i++) out[i] = a[i] + c * b[i]; return out; };
  const scale = (a, c, out = z()) => { for (let i = 0; i < N; i++) out[i] = a[i] * c; return out; };
  const rev = (a, out = z()) => { for (let i = 0; i < N; i++) out[i] = a[i] * revS[i]; return out; };
  const dual = a => { const o = z(); for (let m = 0; m < N; m++) if (a[m] !== 0) o[full ^ m] += a[m] * sgnT[m]; return o; };          // right complement: e_m ^ dual(e_m) = I
  const undual = a => { const o = z(); for (let k = 0; k < N; k++) if (a[k] !== 0) o[full ^ k] += a[k] * sgnT[full ^ k]; return o; };
  const wedge = (a, b) => { const o = z(); for (let i = 0; i < N; i++) { if (a[i] === 0) continue; for (let j = 0; j < N; j++) if (b[j] !== 0 && !(i & j)) o[i ^ j] += SG[i * N + j] * a[i] * b[j]; } return o; };
  const join = (a, b) => undual(wedge(dual(a), dual(b)));
  const blade = (m, c = 1) => { const o = z(); o[m] = c; return o; };
  const one = () => blade(0);
  const point = x => { const V = z(); V[1] = 1; for (let i = 0; i < n; i++) V[2 << i] = x[i]; return dual(V); };            // the dual of e0 + x.e
  const q = (P, i) => P[full ^ (1 << i)] * sgnT[1 << i];
  const weight = P => q(P, 0);
  const pos = P => { const w = q(P, 0), r = new Array(n); for (let i = 0; i < n; i++) r[i] = q(P, i + 1) / w; return r; };
  const dir = P => { const r = new Array(n); for (let i = 0; i < n; i++) r[i] = q(P, i + 1); return r; };                     // the components of an ideal vector (weight 0)
  const sand = (M, X, ix = ALL, Mr = rev(M)) => mul(mul(M, X, EVEN, ix), Mr, ALL, EVEN);                                       // M X M~ for an even M
  const sandRev = (M, X, ix = ALL) => mul(mul(rev(M), X, EVEN, ix), M, ALL, EVEN);                                             // M~ X M
  // motors: M = T R, rotate about the body origin, then translate by t. The translator is 1 - (t.e0i)/2, the rotor cos(a/2) - sin(a/2) e_ij (the sandwich of the printed convention turns e_i towards e_j by a)
  const trans = t => { const T = one(); for (let i = 0; i < n; i++) T[1 | 2 << i] = -t[i] / 2; return T; };
  const rotPlane = (i, j, a) => { const R = one(); R[0] = Math.cos(a / 2); R[(2 << (i - 1)) | (2 << (j - 1))] = -Math.sin(a / 2); return R; };      // generators i, j are 1-based; with the sign below a positive angle turns e_i towards e_j
  const motor = (t, planes = []) => { let R = one(); for (const [i, j, a] of planes) R = mul(R, rotPlane(i, j, a), EVEN, EVEN); return mul(trans(t), R, EVEN, EVEN); };
  const sqDist = (P, Q) => { let s = 0; for (let i = 1; i <= n; i++) s += (q(P, i) / q(P, 0) - q(Q, i) / q(Q, 0)) ** 2; return s; };
  // dynamics (Dorst and De Keninck): M' = -M B/2, B' = A^-1 (F + [B, A(B)]/2), A(e_m) = c_m dual(e_m)
  const Amap = (B, c, out = z()) => { out.fill(0); for (const m of BIV) if (B[m] !== 0) out[full ^ m] += B[m] * c[m] * sgnT[m]; return out; };
  const Ainv = (X, c, out = z()) => { out.fill(0); for (const m of BIV) { const k = full ^ m; if (X[k] !== 0) out[m] += X[k] * sgnT[m] / c[m]; } return out; };
  const dM = (M, B) => scale(mul(M, B, EVEN, BIV), -0.5);
  const dB = (B, c, F = null) => {
    const AB = Amap(B, c), X = scale(add(mul(B, AB, BIV, FRC), mul(AB, B, FRC, BIV), -1), 0.5);
    return Ainv(F ? add(X, F) : X, c);
  };
  const gravity = (M, g, j, mass = 1) => { const X = blade(1 | 1 << j, -g); return scale(dual(sandRev(M, X, BIV)), mass); };                  // dual(M~ (-g e0j) M): a line through the body origin
  const hooke = (M, k, pb, aw) => scale(join(pb, sandRev(M, aw, PTS)), k);                                                  // k ((M~ a_w M) & p_b): the join of the body point and the pulled-back anchor
  const damping = (B, al) => scale(dual(B), -al);
  const normalise = M => { const S = mul(rev(M), M, EVEN, EVEN), T = scale(S, -1); T[0] += 3; return scale(mul(M, T, EVEN, EVEN), 0.5); };            // one Newton-Schulz step towards M~ M = 1
  const normErr = M => { const S = mul(M, rev(M), EVEN, EVEN); S[0] -= 1; let e = 0; for (const m of EVEN) e = Math.max(e, Math.abs(S[m])); return e; };
  const A_ = { n, N, full, SG, sgn: m => sgnT[m], ALL, EVEN, BIV, VEC, PTS, FRC, z, mul, add, scale, rev, dual, undual, wedge, join, blade, one, point, q, weight, pos, dir, sand, sandRev, trans, rotPlane, motor, sqDist,
    Amap, Ainv, dM, dB, gravity, hooke, damping, normalise, normErr };
  return (cache[n] = A_);
}

// ---------------------------------------------------------------- the body: an n-cube with edge lengths s, hung from springs under gravity
export const unitC = A => { const c = A.z(); for (const m of A.BIV) c[m] = 1; return c; };
// inertia of the 2^n vertex masses of step 12 (c = m on the translations e0i, (m/4)(s_j^2 + s_k^2) on e_jk) or of the solid box (m/12 ...)
export function boxC(A, m, s, solid = true) {
  const c = A.z(), d = solid ? 12 : 4;
  for (const b of A.BIV) { if (b & 1) c[b] = m; else { const [j, k] = [1, 2, 3, 4, 5].filter(i => i <= A.n && b >> i & 1); c[b] = m * (s[j - 1] ** 2 + s[k - 1] ** 2) / d; } }
  return c;
}
// one step of the state (M, B): RK4 on both, then the Newton-Schulz step on M (the repository examples renormalise the same way); force(M, B) returns the forque or null
export function stepRK4(A, st, c, force, h, renorm = true) {
  const f = (M, B) => [A.dM(M, B), A.dB(B, c, force ? force(M, B) : null)];
  const comb = (M, B, k, s) => [A.add(M, k[0], s), A.add(B, k[1], s)];
  const k1 = f(st.M, st.B), s2 = comb(st.M, st.B, k1, h / 2), k2 = f(s2[0], s2[1]), s3 = comb(st.M, st.B, k2, h / 2), k3 = f(s3[0], s3[1]), s4 = comb(st.M, st.B, k3, h), k4 = f(s4[0], s4[1]);
  const M = A.z(), B = A.z();
  for (let i = 0; i < A.N; i++) { M[i] = st.M[i] + h / 6 * (k1[0][i] + 2 * k2[0][i] + 2 * k3[0][i] + k4[0][i]); B[i] = st.B[i] + h / 6 * (k1[1][i] + 2 * k2[1][i] + 2 * k3[1][i] + k4[1][i]); }
  return { M: renorm ? A.normalise(M) : M, B };
}
// the explicit Euler step of the printed listings (h/600, ten steps a frame): cheaper, and it loses energy or gains it; kept to show the difference
export function stepEuler(A, st, c, force, h, renorm = true) {
  const M = A.add(st.M, A.dM(st.M, st.B), h), B = A.add(st.B, A.dB(st.B, c, force ? force(st.M, st.B) : null), h);
  return { M: renorm ? A.normalise(M) : M, B };
}
export const kinetic = (A, B, c) => { let e = 0; for (const m of A.BIV) e += c[m] * B[m] * B[m]; return e / 2; };
// the force of the hanging body: gravity (mass m, strength g, along -e_j), a Hooke spring (k) from the body vertex pb to the world anchor aw, damping alpha
export function hangForce(A, p) {
  const j = A.n === 1 ? 1 : 2, pb = A.point(p.pb), aw = A.point(p.anchor);
  return (M, B) => { let F = A.gravity(M, p.g, j, p.m); if (p.k) F = A.add(F, A.hooke(M, p.k, pb, aw)); if (p.alpha) F = A.add(F, A.damping(B, p.alpha)); return F; };
}
export function hangEnergy(A, st, c, p) {
  const j = A.n === 1 ? 1 : 2, xc = A.pos(A.sand(st.M, A.point(new Array(A.n).fill(0)))), xb = A.pos(A.sand(st.M, A.point(p.pb)));
  let sp = 0; for (let i = 0; i < A.n; i++) sp += (p.anchor[i] - xb[i]) ** 2;
  const K = kinetic(A, st.B, c), Ug = p.m * p.g * xc[j - 1], Us = p.k * sp / 2;
  return { K, Ug, Us, E: K + Ug + Us };
}

// ---------------------------------------------------------------- the labels as an address: the vertices of the world cube from the motor
// direct: one sandwich per vertex (2^n of them)
export function verticesDirect(A, M, s) {
  const n = A.n, Mr = A.rev(M), V = [];
  for (let v = 0; v < 1 << n; v++) { const p = new Array(n); for (let i = 0; i < n; i++) p[i] = ((v >> i & 1) - 0.5) * s[i]; V.push(A.pos(A.sand(M, A.point(p), A.PTS, Mr))); }
  return V;
}
// the frame: n + 1 sandwiches (the centre and the n edge directions), then vertex 2^i + j = vertex j + edge i, one addition of n numbers each
export function frame(A, M, s) {
  const n = A.n, Mr = A.rev(M), c = A.pos(A.sand(M, A.point(new Array(n).fill(0)), A.PTS, Mr)), f = [];
  for (let i = 0; i < n; i++) { const d = A.dir(A.sand(M, A.dual(A.blade(2 << i)), A.PTS, Mr)); f.push(d.map(x => x * s[i])); }       // the transported edge i, with its length
  return { c, f };
}
export function verticesFrame(A, M, s, fr = frame(A, M, s)) {
  const n = A.n, V = new Array(1 << n), c = fr.c, f = fr.f; V[0] = c.map((x, k) => { let t = x; for (let i = 0; i < n; i++) t -= f[i][k] / 2; return t; });
  for (let i = 0; i < n; i++) { const b = 1 << i, fi = f[i]; for (let j = 0; j < b; j++) { const u = V[j], w = new Array(n); for (let k = 0; k < n; k++) w[k] = u[k] + fi[k]; V[b + j] = w; } }
  return V;
}
// the usual way: the transported edges are the columns of the motor's matrix, and every vertex is c + sum_i (bit_i - 1/2) f_i, n^2 multiplications each (no doubling)
export function verticesMatrix(A, M, s, fr = frame(A, M, s)) {
  const n = A.n, V = new Array(1 << n), c = fr.c, f = fr.f;
  for (let v = 0; v < 1 << n; v++) { const w = new Array(n); for (let k = 0; k < n; k++) { let t = c[k]; for (let i = 0; i < n; i++) t += ((v >> i & 1) - 0.5) * f[i][k]; w[k] = t; } V[v] = w; }
  return V;
}
// only the even vertices from the table and the odd ones as mirror images through the centre (x(~v) = 2c - x(v)): the identity of G2. It saves nothing in additions; it is a symmetry, not a speed-up.
export function verticesMirror(A, fr) {
  const n = A.n, half = 1 << (n - 1), V = new Array(1 << n), c = fr.c, f = fr.f; V[0] = c.map((x, k) => { let t = x; for (let i = 0; i < n; i++) t -= f[i][k] / 2; return t; });
  for (let i = 0; i < n - 1; i++) { const b = 1 << i, fi = f[i]; for (let j = 0; j < b; j++) { const u = V[j], w = new Array(n); for (let k = 0; k < n; k++) w[k] = u[k] + fi[k]; V[b + j] = w; } }
  const all = (1 << n) - 1; for (let v = 0; v < half; v++) V[all - v] = V[v].map((x, k) => 2 * c[k] - x);
  return V;
}
// the deepest vertex below the plane nu.x + d = 0: scan the table, or read it from n sign bits (bit i is set when edge i points down along nu)
export function deepestScan(V, nu, d) {
  let best = 0, bd = Infinity; for (let v = 0; v < V.length; v++) { let s = d; for (let k = 0; k < nu.length; k++) s += nu[k] * V[v][k]; if (s < bd) { bd = s; best = v; } } return best;
}
export function deepestBits(fr, nu) {
  let label = 0; for (let i = 0; i < fr.f.length; i++) { let s = 0; const fi = fr.f[i]; for (let k = 0; k < nu.length; k++) s += nu[k] * fi[k]; if (s < 0) label |= 1 << i; } return label;
}
export const edgeList = n => { const r = []; for (let v = 0; v < 1 << n; v++) for (let i = 0; i < n; i++) if (!(v >> i & 1)) r.push([v, v | 1 << i, i]); return r; };

// ---------------------------------------------------------------- the picture: a flat outline from the n projected edge vectors (the zonogon), against a convex hull of 2^n points
// the gravity direction is up on the screen: axis 1 -> right, axis 2 -> up, axes 3, 4, 5 oblique. For n = 1 the segment is vertical.
export const SCREEN = [[0, 1], [1, 0], [0, 1], [-0.46, -0.34], [0.30, -0.52], [0.52, 0.30]];
const axis = k => SCREEN[k] || [0.45 * Math.cos(0.7 + 2.399963 * k), 0.45 * Math.sin(0.7 + 2.399963 * k)];            // beyond the fifth axis: spread by the golden angle
export const project = (n, x, view = 0) => {
  if (n === 1) return [0, x[0]];
  const ca = Math.cos(view), sa = Math.sin(view); let X = x[0], Y = x[1];
  for (let k = 2; k < n; k++) { const a = axis(k + 1); X += (a[0] * ca - a[1] * sa) * x[k]; Y += (a[0] * sa + a[1] * ca) * x[k]; }
  return [X, Y];
}
export function zonogon(g) {                                               // g: the n projected edge vectors; returns the outline as a list of vertex labels, counterclockwise from the lowest vertex
  const n = g.length, ang = i => { let [x, y] = g[i]; if (y < 0 || (y === 0 && x < 0)) { x = -x; y = -y; } return Math.atan2(y, x); };
  const flipped = i => g[i][1] < 0 || (g[i][1] === 0 && g[i][0] < 0);
  const order = [...Array(n).keys()].sort((a, b) => ang(a) - ang(b));
  let v = 0; for (let i = 0; i < n; i++) if (flipped(i)) v |= 1 << i;                  // start at the lowest vertex: edge i is taken at its lower end
  const out = [v]; for (const i of order) { v ^= 1 << i; out.push(v); } for (const i of order) { v ^= 1 << i; out.push(v); }
  out.pop(); return out;
}
export function hull(P) {                                                  // monotone chain over [x, y, label]; returns the labels of the hull
  const S = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of S) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-12) lo.pop(); lo.push(p); }
  for (const p of [...S].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 1e-12) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1)).map(p => p[2]);
}

// ---------------------------------------------------------------- Newton: bodies as PGA points and ideal vectors (the planets and moon examples)
// acceleration of body i: G sum_j m_j (p_j - p_i)/d^3 with p_j - p_i an ideal vector; plain coordinates here, the PGA form is cross-checked in the tests
export function newtonAcc(pos, mass, G, out) {
  const N = mass.length, n = pos[0].length;
  for (let i = 0; i < N; i++) { const a = out[i]; for (let k = 0; k < n; k++) a[k] = 0; }
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    let d2 = 0; for (let k = 0; k < n; k++) { const r = pos[j][k] - pos[i][k]; d2 += r * r; }
    const d = Math.sqrt(d2), f = G / (d2 * d);
    for (let k = 0; k < n; k++) { const r = pos[j][k] - pos[i][k]; out[i][k] += f * mass[j] * r; out[j][k] -= f * mass[i] * r; }
  }
  return out;
}
export function rk4Bodies(st, mass, G, h) {                                // st = { x: [[..]], v: [[..]] }; returns the new state (RK4, as in the examples)
  const N = mass.length, n = st.x[0].length, mkA = () => Array.from({ length: N }, () => new Array(n).fill(0));
  const k1x = st.v, k1v = newtonAcc(st.x, mass, G, mkA());
  const lin = (x, kx, s) => x.map((p, i) => p.map((c, k) => c + s * kx[i][k]));
  const x2 = lin(st.x, k1x, h / 2), v2 = lin(st.v, k1v, h / 2), k2x = v2, k2v = newtonAcc(x2, mass, G, mkA());
  const x3 = lin(st.x, k2x, h / 2), v3 = lin(st.v, k2v, h / 2), k3x = v3, k3v = newtonAcc(x3, mass, G, mkA());
  const x4 = lin(st.x, k3x, h), v4 = lin(st.v, k3v, h), k4x = v4, k4v = newtonAcc(x4, mass, G, mkA());
  const comb = (a, k1, k2, k3, k4) => a.map((p, i) => p.map((c, k) => c + h / 6 * (k1[i][k] + 2 * k2[i][k] + 2 * k3[i][k] + k4[i][k])));
  return { x: comb(st.x, k1x, k2x, k3x, k4x), v: comb(st.v, k1v, k2v, k3v, k4v) };
}
export function energyBodies(st, mass, G) {
  const N = mass.length, n = st.x[0].length; let K = 0, U = 0; const P = new Array(n).fill(0), L = [];
  for (let i = 0; i < N; i++) { let v2 = 0; for (let k = 0; k < n; k++) { v2 += st.v[i][k] ** 2; P[k] += mass[i] * st.v[i][k]; } K += mass[i] * v2 / 2; }
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { let d2 = 0; for (let k = 0; k < n; k++) d2 += (st.x[j][k] - st.x[i][k]) ** 2; U -= G * mass[i] * mass[j] / Math.sqrt(d2); }
  let Lz = 0; for (let i = 0; i < N; i++) Lz += mass[i] * (st.x[i][0] * st.v[i][1] - st.x[i][1] * st.v[i][0]);       // the e12 component of the angular momentum bivector
  return { K, U, E: K + U, P, Lz };
}
// the exact rotor step of the oscillator (no drift), for the comparison in the benchmark: x'' = -w^2 x
export const rk4Oscillator = (x, v, w, h) => { const f = (x, v) => [v, -w * w * x], a = f(x, v), b = f(x + h / 2 * a[0], v + h / 2 * a[1]), c = f(x + h / 2 * b[0], v + h / 2 * b[1]), d = f(x + h * c[0], v + h * c[1]); return [x + h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), v + h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1])]; };

// ---------------------------------------------------------------- several bodies hooked together (springs between a vertex of one body and a vertex of another, or the world)
// world = { n, bodies: [{ M, B, c, m }], springs: [{ a, pa, b, pb, k }], g, alpha }; b = -1 means the world, and pb is then the anchor point (coordinates). Gravity along -e_j (j = 2, or 1 for the segment).
export function worldForces(A, w, Ms, Bs) {
  const j = A.n === 1 ? 1 : 2, F = w.bodies.map((bd, i) => { let f = A.gravity(Ms[i], w.g, j, bd.m); if (w.alpha) f = A.add(f, A.damping(Bs[i], w.alpha)); return f; });
  for (const sp of w.springs) {
    const pa = A.point(sp.pa), wa = A.sand(Ms[sp.a], pa), wb = sp.b < 0 ? A.point(sp.pb) : A.sand(Ms[sp.b], A.point(sp.pb));
    F[sp.a] = A.add(F[sp.a], A.hooke(Ms[sp.a], sp.k, pa, wb));
    if (sp.b >= 0) F[sp.b] = A.add(F[sp.b], A.hooke(Ms[sp.b], sp.k, A.point(sp.pb), wa));
  }
  return F;
}
export function stepWorld(A, w, st, h, renorm = true) {
  const f = (Ms, Bs) => { const F = worldForces(A, w, Ms, Bs); return w.bodies.map((bd, i) => [A.dM(Ms[i], Bs[i]), A.dB(Bs[i], bd.c, F[i])]); };
  const lin = (s, k, c) => [s.map((x, i) => A.add(x.M, k[i][0], c)), s.map((x, i) => A.add(x.B, k[i][1], c))];
  const Ms = st.map(x => x.M), Bs = st.map(x => x.B), k1 = f(Ms, Bs), s2 = lin(st, k1, h / 2), k2 = f(s2[0], s2[1]), s3 = lin(st, k2, h / 2), k3 = f(s3[0], s3[1]), s4 = lin(st, k3, h), k4 = f(s4[0], s4[1]);
  return st.map((x, i) => {
    const M = A.z(), B = A.z();
    for (let q = 0; q < A.N; q++) { M[q] = x.M[q] + h / 6 * (k1[i][0][q] + 2 * k2[i][0][q] + 2 * k3[i][0][q] + k4[i][0][q]); B[q] = x.B[q] + h / 6 * (k1[i][1][q] + 2 * k2[i][1][q] + 2 * k3[i][1][q] + k4[i][1][q]); }
    return { M: renorm ? A.normalise(M) : M, B };
  });
}
export function energyWorld(A, w, st) {
  const j = A.n === 1 ? 1 : 2, z0 = A.point(new Array(A.n).fill(0)); let K = 0, Ug = 0, Us = 0;
  st.forEach((x, i) => { const bd = w.bodies[i]; K += kinetic(A, x.B, bd.c); Ug += bd.m * w.g * A.pos(A.sand(x.M, z0))[j - 1]; });
  for (const sp of w.springs) {
    const wa = A.pos(A.sand(st[sp.a].M, A.point(sp.pa))), wb = sp.b < 0 ? sp.pb : A.pos(A.sand(st[sp.b].M, A.point(sp.pb)));
    let d = 0; for (let i = 0; i < A.n; i++) d += (wa[i] - wb[i]) ** 2; Us += sp.k * d / 2;
  }
  return { K, Ug, Us, E: K + Ug + Us };
}

// the rotor that carries the direction u to the vertical e_j: R = (1 + e_j u)/|.|, with the sandwich of the engine (checked in test_pgadyn.mjs); for u = -e_j a half turn in the plane (j, k)
export function alignRotor(A, u, j) {
  const n = A.n, nu = Math.hypot(...u); if (n === 1) return A.one();
  const vec = x => { const v = A.z(); x.forEach((c, i) => { v[1 << (i + 1)] = c; }); return v; }, un = u.map(x => x / nu), ej = vec(Array.from({ length: n }, (_, i) => (i === j - 1 ? 1 : 0)));
  const P = A.add(A.one(), A.mul(ej, vec(un), A.VEC, A.VEC)), len = Math.sqrt(P.reduce((s, c, i) => s + (A.EVEN.includes(i) ? c * c : 0), 0));
  if (len < 1e-9) { const k = j === 1 ? 2 : 1, R = A.z(); R[(1 << j) | (1 << k)] = 1; return R; }
  return A.scale(P, 1 / len);
}
// the rest state of a chain of bodies hung from the world anchor (springs of stiffness k, equal masses m, gravity g along -e_j): body b hangs by its top vertex (label top), its bottom vertex
// (the complement label) carries the next body; every vertex-centre line is vertical, and the stretch of each spring is the weight it carries over k. Returns the motors and the springs.
export function chainRest(A, p) {
  const n = A.n, j = n === 1 ? 1 : 2, bits = i => (p.top >> i & 1);
  const out = { bodies: [], springs: [], anchor: null };
  const hvOf = s => s.map((x, i) => (bits(i) - 0.5) * x);
  let ytop = p.y0, prevHv = null; const anchor = new Array(n).fill(0); anchor[j - 1] = p.y0; out.anchor = anchor;
  for (let b = 0; b < p.nb; b++) {
    const s = p.sizes[b], hv = hvOf(s), r = Math.hypot(...hv), W = p.g * p.m * (p.nb - b), stretch = p.k ? W / p.k : 0;
    ytop -= stretch;                                                        // the top vertex hangs below what holds it by the stretch
    const sgn = n === 1 ? Math.sign(hv[0]) : 1, yc = ytop - sgn * r, ybot = yc - sgn * r;
    const R = alignRotor(A, hv, j), tilt = n >= 2 ? A.rotPlane(1, 2, p.tilt * (b % 2 ? -1 : 1)) : A.one();
    const c = new Array(n).fill(0); c[j - 1] = yc;
    const M = A.mul(A.trans(c), A.mul(tilt, R, A.EVEN, A.EVEN), A.EVEN, A.EVEN);
    out.bodies.push({ M, B: A.z(), m: p.m, c: boxC(A, p.m, s), s });
    out.springs.push(b === 0 ? { a: 0, pa: hv, b: -1, pb: anchor, k: p.k } : { a: b - 1, pa: prevHv.map(x => -x), b, pb: hv, k: p.k });
    ytop = ybot; prevHv = hv;
  }
  return out;
}

// the constants of the moon and planets examples of the repository (the same numbers as selfcheck/pgadyn_selfcheck.py, rows N8 and N9)
export const MOON = { G: 6.6703e-11, mE: 5.97237e24, mM: 7.342e22, vM: 1085, d: 362400e3 };
export const PLANET_G = 6.6723e-11 * 1e-9;                                 // km^3 kg^-1 s^-2: the table is in km and km/s
