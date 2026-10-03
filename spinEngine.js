// The bit-rule Clifford algebra for the live widgets of step 11 (spinors).
// Generators are bits 0..n-1; the squares sq[i] are +1, -1 or 0; a blade is a bit mask and the product of two blades is the XOR of the masks with a sign.
// Floating point, exact for the small integers and halves used by the widgets (the page's authority is selfcheck/spin_selfcheck.py, which is exact).
export const pc = x => { let c = 0; for (; x; x >>= 1) c += x & 1; return c; };
export const EPS = 1e-9;

export function mk(sq) {
  const n = sq.length;
  const bm = (a, b) => { // [sign, mask] of the product of two blades
    let s = 1, t = a >> 1;
    while (t) { if (pc(t & b) & 1) s = -s; t >>= 1; }
    const c = a & b; for (let i = 0; i < n; i++) if (c >> i & 1) s *= sq[i];
    return [s, a ^ b];
  };
  const clean = M => { for (const [k, v] of M) if (Math.abs(v) < EPS) M.delete(k); return M; };
  const mul = (A, B) => {
    const R = new Map();
    for (const [a, x] of A) for (const [b, y] of B) { const [s, m] = bm(a, b); if (s) R.set(m, (R.get(m) || 0) + s * x * y); }
    return clean(R);
  };
  const add = (A, B, s = 1) => { const R = new Map(A); for (const [k, v] of B) R.set(k, (R.get(k) || 0) + s * v); return clean(R); };
  const scale = (A, c) => clean(new Map([...A].map(([k, v]) => [k, v * c])));
  const sign = m => { const k = pc(m); return (k * (k - 1) / 2) % 2 ? -1 : 1; };
  const rev = A => new Map([...A].map(([k, v]) => [k, v * sign(k)]));
  const one = new Map([[0, 1]]), zero = new Map();
  const blade = m => new Map([[m, 1]]);
  const g = i => blade(1 << i);
  const eq = (A, B, tol = 1e-7) => { for (const k of new Set([...A.keys(), ...B.keys()])) if (Math.abs((A.get(k) || 0) - (B.get(k) || 0)) > tol) return false; return true; };
  const get = (A, m) => A.get(m) || 0;
  const prod = (...xs) => xs.reduce((a, b) => mul(a, b), one);
  const I = blade((1 << n) - 1);
  const inv = A => { const r = rev(A), s = mul(A, r); if (!(s.size === 1 && s.has(0))) return null; return scale(r, 1 / s.get(0)); }; // versors only
  const part = (A, f) => new Map([...A].filter(([k]) => f(k)));
  const name = m => (m ? 'e' + [...Array(n)].map((_, j) => (m >> j & 1 ? String(j + 1) : '')).join('') : '1');
  const show = A => (!A.size ? '0' : [...A].sort((x, y) => x[0] - y[0]).map(([k, v]) => { const c = Math.abs(Math.abs(v) - 1) < EPS && k ? '' : String(Math.round(v * 1e6) / 1e6); return (v < 0 ? '−' : '+') + (v < 0 ? c.replace('-', '') : c) + (k ? name(k) : (c === '' ? '1' : '')); }).join(' ').replace(/^\+/, '').replace(/ \+/g, ' + ').replace(/ −/g, ' − '));
  return { n, sq, one, zero, blade, g, mul, add, scale, rev, eq, get, prod, I, inv, part, name, show, bm };
}

// a tiny deterministic generator for the “new sample” buttons
export const rng = seed => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
export const ri = (r, a = -3, b = 3) => a + Math.floor(r() * (b - a + 1));

// ---------------------------------------------------------------- the pieces the widgets share
// Cl(2,0): the rotor R = cos t + B sin t acting on a vector
export function planar(t) {
  const A = mk([1, 1]), u = A.g(0), v = A.g(1), B = A.mul(u, v), a = Math.cos(t), s = Math.sin(t);
  const R = A.add(A.scale(A.one, a), A.scale(B, s)), w = A.mul(A.mul(R, v), A.rev(R));
  return { R: [a, s], vec: [A.get(w, 1), A.get(w, 2)], ok: Math.abs(A.get(w, 2) - Math.cos(2 * t)) < 1e-9 && Math.abs(A.get(w, 1) - Math.sin(2 * t)) < 1e-9, A };
}
// the three kinds of i (and a fourth), for squares (a, b) of two generators
export function kinds(a, b) {
  const kind1 = { sq: a, grades: '(1, e)', alg: a };
  const E = mk([a, b]), e12 = E.mul(E.g(0), E.g(1)), kind2 = (E.get(E.mul(e12, e12), 0));
  let kind3 = null, ref = null;
  if (a !== 0 || b !== 0) {
    const ui = a !== 0 ? 0 : 1, wi = 1 - ui, u = E.g(ui), w = E.g(wi), uinv = E.inv(u), x = E.mul(E.mul(w, u), w); // w ∘ w = w u w
    kind3 = uinv ? E.get(x, 1 << ui) / E.get(uinv, 1 << ui) : null; ref = 'e' + (ui + 1);
    kind3 = Math.round(kind3 * 1e9) / 1e9;
  }
  return { k1: a, k2: kind2, k3: kind3, ref };
}
export function pseudoscalar(d) { // Euclid, I = e_1..d: its square, and whether it is central
  const E = mk(Array(d).fill(1)), I = E.I; let central = true;
  for (let i = 0; i < d; i++) if (!E.eq(E.mul(E.g(i), I), E.mul(I, E.g(i)))) central = false;
  return { sq: E.get(E.mul(I, I), 0), central };
}
// labels of the blades of Cl(d,0) by conjugation with the pair bivectors b_j = e_{2j-1,2j}
export function labelling(d) {
  const k = d / 2, E = mk(Array(d).fill(1)), ms = [...Array(k)].map((_, j) => 3 << (2 * j)), cls = new Map();
  let ok = true;
  for (let x = 0; x < 1 << d; x++) {
    const s = ms.map(m => (pc(x & m) & 1 ? -1 : 1));
    for (const [j, m] of ms.entries()) { const b = E.blade(m), y = E.blade(x), c = E.mul(E.mul(b, y), E.inv(b)); if (!E.eq(c, E.scale(y, s[j]))) ok = false; }
    const key = s.join(','); if (!cls.has(key)) cls.set(key, []); cls.get(key).push(x);
  }
  const H = new Set([0]); for (const m of ms) for (const h of [...H]) H.add(h ^ m);
  const plus = new Set(cls.get(Array(k).fill(1).join(',')));
  const selfDual = ms.every(a => ms.every(b => !(pc(a & b) & 1))) && H.size === 1 << k;
  return { k, ms, cls, H: [...H].sort((p, q) => p - q), sameAsPlus: H.size === plus.size && [...H].every(h => plus.has(h)), ok, selfDual, E };
}
// the pure spinors of Cl(3,0) (k = 1) and Cl(7,0) (k = 3) with i = I, as in the lecture: Φ_σ = Π_j (B_j + i) or v_j (B_j + i)
export function spinors(k) {
  const d = 2 * k + 1, E = mk(Array(d).fill(1)), I = E.I, u = j => E.g(2 * j), v = j => E.g(2 * j + 1), B = j => E.mul(u(j), v(j)), w = E.g(2 * k);
  const phi = sg => { let r = E.one; sg.forEach((s, j) => { const f = E.add(B(j), I); r = E.mul(r, s > 0 ? f : E.mul(v(j), f)); }); return r; };
  const cx = (a, b) => E.add(E.scale(E.one, a), E.scale(I, b));
  return { E, I, u, v, B, w, phi, cx, k, d };
}
// the pointor test: ψ O ψ~ = λ O ?
export function pointorTest(E, psi, O) {
  const X = E.mul(E.mul(psi, O), E.rev(psi)), lam = E.get(X, E.n ? (1 << E.n) - 1 : 0), ok = E.eq(X, E.scale(O, lam), 1e-6 * Math.max(1, Math.abs(lam)));
  return { ok, lam };
}
export const versor = (E, r, deg, lim = 3) => { let x = E.one; for (let i = 0; i < deg; i++) { let vv = new Map(); while (!vv.size) { vv = new Map(); for (let j = 0; j < E.n; j++) { const c = ri(r, -lim, lim); if (c) vv.set(1 << j, c); } } x = E.mul(x, vv); } return x; };

// ---------------------------------------------------------------- samples used by the pointor and Hestenes widgets (kept here so the tests can run them)
const PYTH = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
export function pointorSample(kind, seed) {
  const E = mk([1, 1, 1, 1]), O = E.I, r = rng(seed * 7919 + 13), R = versor(E, r, 2), rho = [ri(r, 1, 3), ri(r, 1, 3)];
  let psi, txt;
  if (kind === 'flatland') { const [p, q, h] = PYTH[seed % 3], c = p / h, s = q / h; psi = E.add(E.scale(E.add(E.scale(E.g(0), c), E.scale(E.g(1), s)), rho[0]), E.scale(E.add(E.scale(E.one, c), E.scale(E.mul(E.g(0), E.g(1)), s)), rho[1])); txt = `${rho[0]}·r + ${rho[1]}·R`; }
  else if (kind === 'vR') { const v = versor(E, r, 1); psi = E.mul(E.add(E.scale(E.one, rho[0]), E.scale(v, rho[1])), R); txt = `(${rho[0]} + ${rho[1]}v) R`; }
  else if (kind === 'unrelated') { const P = versor(E, r, 3); psi = E.add(E.scale(R, rho[0]), E.scale(P, rho[1])); txt = `${rho[0]}·R + ${rho[1]}·P`; }
  else { psi = R; txt = 'R'; }
  const res = pointorTest(E, psi, O); return { ...res, txt, E, psi };
}
export const PKINDS = ['flatland', 'vR', 'unrelated', 'versor'];
let CL13 = null; export const cl13 = () => CL13 || (CL13 = mk([1, -1, -1, -1]));
export const EVEN = [0, 3, 5, 6, 9, 10, 12, 15];
export function hestenes(kind, seed) {
  const E = cl13(), r = rng(seed * 104729 + 7), O = E.I; let psi;
  if (kind === 'versor') psi = versor(E, r, 2); else { psi = new Map(); for (const m of EVEN) { const c = ri(r, -2, 2); if (c) psi.set(m, c); } if (!psi.size) psi.set(0, 1); }
  const pp = E.mul(psi, E.rev(psi)), a = E.get(pp, 0), b = E.get(pp, 15), other = [...pp.keys()].some(k => k !== 0 && k !== 15 && Math.abs(pp.get(k)) > 1e-9);
  return { a, b, other, ok: pointorTest(E, psi, O).ok, E };
}
export function chirality() { // the involution psi -> I psi J on the even blades of Cl(1,3), J = gamma_2 gamma_1
  const E = cl13(), I = E.I, J = E.mul(E.g(2), E.g(1));
  return EVEN.map(x => { const y = E.mul(E.mul(I, E.blade(x)), J), m = [...y.keys()][0]; return { x, m, s: y.get(m), ok: y.size === 1 && m === (x ^ 9) }; });
}
