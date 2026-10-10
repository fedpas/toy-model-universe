// The tennis-racket demo of the Forque page: Euler's equations for a free rigid body, I_C[dB/dt] = B x I_C[B] (eq. B.18 of the paper, F34 in the matrix),
// in the components w = (B23, B31, B12). Plain RK4, no libraries; test_forque.mjs recomputes the rate from the formula and from this integrator.
export const sortedI = I => [...I].sort((x, y) => x - y);
// growth rate of a small disturbance of the spin about the middle axis, per unit spin: sqrt((Imid-Imin)(Imax-Imid)/(Imax Imin))
export function predictedRate(I) { const [lo, mid, hi] = sortedI(I); return Math.sqrt(Math.max(0, (mid - lo) * (hi - mid) / (hi * lo))); }
const rhs = (I, w) => [(I[1] - I[2]) * w[1] * w[2] / I[0], (I[2] - I[0]) * w[2] * w[0] / I[1], (I[0] - I[1]) * w[0] * w[1] / I[2]];
const add = (a, b, k) => a.map((x, i) => x + k * b[i]);
export const energy = (I, w) => 0.5 * (I[0] * w[0] * w[0] + I[1] * w[1] * w[1] + I[2] * w[2] * w[2]);
export const momentum = (I, w) => Math.hypot(I[0] * w[0], I[1] * w[1], I[2] * w[2]);
export function simulate(I, { eps = 1e-4, dt = 0.004, every = 25 } = {}) {
  const lam = predictedRate(I), m = I.indexOf(sortedI(I)[1]);
  const T = lam > 1e-3 ? 9 / lam + 2 : 20, n = Math.ceil(T / dt);
  let w = [eps, eps, eps]; w[m] = 1;
  const E0 = energy(I, w), L0 = momentum(I, w), ts = [], ws = [], ps = [];
  let t1 = null, p1 = null, t2 = null, p2 = null;
  const pert = x => Math.hypot(...x.filter((_, i) => i !== m));
  for (let s = 0; s <= n; s++) {
    const t = s * dt, p = pert(w);
    if (s % every === 0) { ts.push(t); ws.push(w); ps.push(p); }
    if (t1 === null && p >= 1e-3) { t1 = t; p1 = p; }
    if (t2 === null && p >= 1e-1) { t2 = t; p2 = p; }
    const k1 = rhs(I, w), k2 = rhs(I, add(w, k1, dt / 2)), k3 = rhs(I, add(w, k2, dt / 2)), k4 = rhs(I, add(w, k3, dt));
    w = w.map((x, i) => x + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  const measured = t1 !== null && t2 !== null && t2 > t1 ? Math.log(p2 / p1) / (t2 - t1) : null;
  const Eend = energy(I, w), Lend = momentum(I, w);
  return { ts, ws, ps, m, T, lam, measured, energyDrift: Math.abs(Eend - E0) / E0, momentumDrift: Math.abs(Lend - L0) / L0 };
}
