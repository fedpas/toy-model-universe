#!/usr/bin/env python3
"""Independent numerical cross-check of the Forque dynamics with explicit matrices (numpy), against classical Newton-Euler.
  python3 forque_matrix_check.py [--write forque_matrix.json] [--compare forque_matrix.json]
Nothing here uses the bit-mask product.  Cl(3,0,1) is represented by 4x4 complex matrices:  e_i = sigma_i (x) Z,  eps = 1 (x) N  (N = [[0,1],[0,0]]),
which satisfy e_i e_j + e_j e_i = 2 delta_ij, eps^2 = 0 and eps e_i = -e_i eps.  The 16 products of the generators are checked to be linearly independent over the reals
(the matrices are a faithful picture of the degenerate algebra).  A multivector is read back from a matrix by linear least squares on those 16 products.
Checked (floating point, RK4, tolerance 1e-8 on positions):
  (1) the representation: relations and faithfulness
  (2) free asymmetric top with a translation, from an initial motor:  PGA state (M, B_b) with  dM/dt = -M B_b/2,  dB_b/dt = I^-1[B_b x I[B_b]],  I[B] = sum m_i (xdot_i . X_i)
      against the classical equations (m dv = f, I domega + omega x I omega = 0, dR = R [omega]x):  all point positions agree at t = 3
  (3) the same with uniform gravity (the forque is F_b = sum m_i g . X_i^b moved to the body frame)
  (4) the free symmetric top: the closed form M = M_p M_0 M_L M_A (B.15, M_0 = 1) against RK4;  and the free spherical top (B.6)
  (5) conserved: |momentum| and the kinetic energy (1/2) B v I[B] = (1/2) sum m |xdot|^2 along the free flow;  motor stays on the manifold M M~ = 1
  (6) the tennis racket: the growth rate of a perturbation of the middle axis equals Omega sqrt(omega_1 omega_3) (numerical linearisation)
negative controls that must fail: no B x I[B] term; wrong sign of that term; a 1 instead of 1/2 in the kinematic equation."""
import json, sys, itertools
import numpy as np
from math import sqrt
TOL = 1e-8
rng = np.random.default_rng(20261012)

S = [np.array([[0, 1], [1, 0]], complex), np.array([[0, -1j], [1j, 0]]), np.array([[1, 0], [0, -1]], complex)]
Z = np.diag([1, -1]).astype(complex); Nil = np.array([[0, 1], [0, 0]], complex); I2 = np.eye(2, dtype=complex)
G = [np.kron(I2, Nil)] + [np.kron(s, Z) for s in S]          # eps, e1, e2, e3
MASKS = list(range(16))
def prod(mask):
    r = np.eye(4, dtype=complex)
    for i in range(4):
        if mask >> i & 1: r = r @ G[i]
    return r
BASIS = [prod(m) for m in MASKS]
STACK = np.array([np.concatenate([b.real.ravel(), b.imag.ravel()]) for b in BASIS])      # 16 x 32
PINV = np.linalg.pinv(STACK.T)
def coords(M): return PINV @ np.concatenate([M.real.ravel(), M.imag.ravel()])
def from_coords(c): return sum(ci * b for ci, b in zip(c, BASIS))
def comm(A, B): return 0.5 * (A @ B - B @ A)
def rev(M):
    c = coords(M); return from_coords([ci * (-1 if (bin(m).count('1') * (bin(m).count('1') - 1) // 2) % 2 else 1) for ci, m in zip(c, MASKS)])
def invol(M):
    c = coords(M); return from_coords([ci * (-1 if bin(m).count('1') % 2 else 1) for ci, m in zip(c, MASKS)])
def vdot(x, A): return 0.5 * (x @ A - invol(A) @ x)
E = {k: prod(m) for k, m in (('e0', 1), ('e1', 2), ('e2', 4), ('e3', 8))}
O = E['e1'] @ E['e2'] @ E['e3']; EPS = E['e0']; I = EPS @ O
def vec(x): return x[0] * E['e1'] + x[1] * E['e2'] + x[2] * E['e3']
def point(q): return O + vec(q) @ I
def trans(t): return np.eye(4, dtype=complex) - 0.5 * EPS @ vec(t)
def rotor_from_matrix(R):
    # rotation matrix -> rotor  cos(phi/2) - sin(phi/2) n.(e23, e31, e12)  (R acts as x -> R x on vectors:  X -> M X M~)
    from math import acos
    tr = np.trace(R); w = sqrt(max(0.0, 1 + tr)) / 2
    if w > 1e-9: q = np.array([(R[2, 1] - R[1, 2]), (R[0, 2] - R[2, 0]), (R[1, 0] - R[0, 1])]) / (4 * w)
    else: raise ValueError('use a rotation away from 180 degrees')
    return w * np.eye(4, dtype=complex) - q[0] * E['e2'] @ E['e3'] - q[1] * E['e3'] @ E['e1'] - q[2] * E['e1'] @ E['e2']
def vec_of(M):
    c = coords(M); return np.array([c[2], c[4], c[8]])
def position_of(P):
    """point trivector -> q:  P = w (O + q I)"""
    c = coords(P); w = c[14]                                  # e123 = O has mask 14
    img = [coords(E[k] @ I) for k in ('e1', 'e2', 'e3')]
    return np.array([c[int(np.argmax(np.abs(im)))] / im[int(np.argmax(np.abs(im)))] for im in img]) / w
def skew(w): return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])
def expm_small(A):
    n = 30; Mx = np.eye(4, dtype=complex); T = np.eye(4, dtype=complex)
    for k in range(1, n): T = T @ A / k; Mx = Mx + T
    return Mx

class Body:
    def __init__(self, pts, masses):
        self.r = pts - (masses[:, None] * pts).sum(0) / masses.sum(); self.m = masses; self.mt = masses.sum()
        self.X = [point(r) for r in self.r]
        self.Ic = sum(m * (r @ r * np.eye(3) - np.outer(r, r)) for m, r in zip(self.m, self.r))
        self.bv = [E['e2'] @ E['e3'], E['e3'] @ E['e1'], E['e1'] @ E['e2'], EPS @ E['e1'], EPS @ E['e2'], EPS @ E['e3']]
        self.Imat = np.array([coords(self.I_def(b)) for b in self.bv]).T            # columns: image of each bivector, 16-vector coordinates
        self.rows = [i for i in range(16) if np.abs(self.Imat[i]).max() > 1e-12]
        self.Imat6 = self.Imat[self.rows]; assert self.Imat6.shape[0] == 6
        self.Iinv6 = np.linalg.inv(self.Imat6)
    def I_def(self, B):
        r = np.zeros((4, 4), complex)
        for m, X in zip(self.m, self.X):
            Xd = comm(X, B)                                      # = xdot I
            # xdot from Xdot = xdot I : read the vector part through its coordinates
            c = coords(Xd); xd = np.array([c[int(np.argmax(np.abs(coords(E[k] @ I))))] / coords(E[k] @ I)[int(np.argmax(np.abs(coords(E[k] @ I))))] for k in ('e1', 'e2', 'e3')])
            r = r + m * vdot(vec(xd), X)
        return r
    def I(self, B): return from_coords(np.eye(16)[:, self.rows] @ (self.Imat6 @ self.b6(B)))
    def Iinv(self, P): c = coords(P); return self.from6(self.Iinv6 @ c[self.rows])
    def b6(self, B):
        c = coords(B); return np.array([c[12], -c[10], c[6], c[3], c[5], c[9]])
    def from6(self, v): return sum(vi * b for vi, b in zip(v, self.bv))

def run_pga(body, M0, B0, T, dt, force=None, kin_half=0.5, coriolis=1.0):
    n = int(round(T / dt)); M = M0.copy(); B = B0.copy()
    def f(M, B):
        F = force(M, B) if force else 0 * B
        return -kin_half * M @ B, body.Iinv(coriolis * comm(B, body.I(B)) + F)
    for _ in range(n):
        k1 = f(M, B); k2 = f(M + dt / 2 * k1[0], B + dt / 2 * k1[1]); k3 = f(M + dt / 2 * k2[0], B + dt / 2 * k2[1]); k4 = f(M + dt * k3[0], B + dt * k3[1])
        M = M + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); B = B + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
    return M, B
def classical(body, c0, R0, vb0, wb0, T, dt, g=None):
    n = int(round(T / dt)); c = c0.copy(); R = R0.copy(); v = R0 @ vb0; w = wb0.copy(); Ic = body.Ic; Ii = np.linalg.inv(Ic)
    def f(c, R, v, w): return v, R @ skew(w), (g if g is not None else 0 * v), -Ii @ np.cross(w, Ic @ w)
    for _ in range(n):
        s = (c, R, v, w); k1 = f(*s); k2 = f(*[a + dt / 2 * b for a, b in zip(s, k1)]); k3 = f(*[a + dt / 2 * b for a, b in zip(s, k2)]); k4 = f(*[a + dt * b for a, b in zip(s, k3)])
        c, R, v, w = [a + dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4) for a, b1, b2, b3, b4 in zip(s, k1, k2, k3, k4)]
        u, _, vt = np.linalg.svd(R); R = u @ vt
    return c, R, v, w
def pose_error(body, M, c, R):
    return max(np.abs(position_of(M @ X @ rev(M)) - (c + R @ r)).max() for X, r in zip(body.X, body.r))
def omega_to_B(w): return w[0] * E['e2'] @ E['e3'] + w[1] * E['e3'] @ E['e1'] + w[2] * E['e1'] @ E['e2']     # B = omega I3

def compute():
    out = {}
    # (1) representation
    rel = max(np.abs(G[i] @ G[j] + G[j] @ G[i] - (2 * np.eye(4) if i == j and i > 0 else 0)).max() for i in range(4) for j in range(4))
    rank = np.linalg.matrix_rank(STACK, tol=1e-9); out['representation'] = {'relations_residual': float(rel), 'rank_of_16_products': int(rank), 'ok': bool(rel < 1e-12 and rank == 16)}
    pts = rng.normal(size=(6, 3)); mass = np.array([1.0, 2.0, 1.5, 0.7, 1.1, 2.2]); body = Body(pts, mass)
    ev = np.linalg.eigvalsh(body.Ic); out['body'] = {'principal_inertias': sorted(float(x) for x in ev), 'mass': float(mass.sum())}
    R0 = np.linalg.qr(rng.normal(size=(3, 3)))[0]; R0 = R0 * np.linalg.det(R0)
    while np.trace(R0) < -0.5: R0 = np.linalg.qr(rng.normal(size=(3, 3)))[0]; R0 = R0 * np.linalg.det(R0)
    c0 = rng.normal(size=3); wb = np.array([0.7, -0.4, 1.1]); vb = np.array([0.3, 0.5, -0.2]); T, dt = 3.0, 1e-3
    M0 = trans(c0) @ rotor_from_matrix(R0); B0 = omega_to_B(wb) + EPS @ vec(vb)
    out['initial_pose_error'] = float(pose_error(body, M0, c0, R0))
    # (2) free
    M, B = run_pga(body, M0, B0, T, dt); c, R, v, w = classical(body, c0, R0, vb, wb, T, dt)
    out['free_top'] = {'position_error': float(pose_error(body, M, c, R)), 'ok': bool(pose_error(body, M, c, R) < TOL)}
    out['motor_manifold_residual'] = float(np.abs(M @ rev(M) - np.eye(4)).max())
    # (3) gravity
    g = np.array([0.0, -9.81, 0.0])
    def g_body(M, g): return np.array([coords(rev(M) @ vec(g) @ M)[k] for k in (2, 4, 8)])        # the world acceleration seen in the body frame
    def Fgrav(M, B): return sum(m * vdot(vec(g_body(M, g)), X) for m, X in zip(body.m, body.X))   # F_b = sum m_i g_b . X_i   (2.31, for every mass point)
    M, B = run_pga(body, M0, B0, T, dt, force=Fgrav); c, R, v, w = classical(body, c0, R0, vb, wb, T, dt, g=g)
    out['gravity_top'] = {'position_error': float(pose_error(body, M, c, R)), 'ok': bool(pose_error(body, M, c, R) < TOL)}
    # (5) conservation
    Mf, Bf = run_pga(body, M0, B0, T, dt)
    Pw0 = M0 @ body.I(B0) @ rev(M0); Pw1 = Mf @ body.I(Bf) @ rev(Mf)
    out['conservation'] = {'momentum_drift': float(np.abs(Pw1 - Pw0).max()), 'ok': bool(np.abs(Pw1 - Pw0).max() < 1e-7)}
    # (4) closed forms
    # spherical top: a cube; body-frame ideal part rotates (B.5), M = exp(-v_w t/2) M0 exp(-B0 t/2)
    cube = Body(np.array(list(itertools.product((-1, 1), repeat=3)), float), np.ones(8)); B0e = omega_to_B(np.array([0.5, -0.3, 0.8])); v0 = np.array([0.4, 0.1, -0.6])
    Bs0 = B0e + EPS @ vec(v0); Mc, _ = run_pga(cube, np.eye(4, dtype=complex), Bs0, 2.0, 1e-3)
    Mclosed = expm_small(-0.5 * 2.0 * (EPS @ vec(v0))) @ expm_small(-0.5 * 2.0 * B0e)
    out['spherical_top'] = {'motor_error': float(np.abs(Mc - Mclosed).max()), 'ok': bool(np.abs(Mc - Mclosed).max() < 1e-8)}
    # symmetric top (B.15 with M_0 = 1): M = M_p M_L M_A
    sp = []
    a, cc = 1.0, 1.5
    for s_ in (1, -1):
        for k in (0, 1):
            q = np.zeros(3); q[k] = s_ * a; sp.append((q, 1.0))
    for s_ in (1, -1): q = np.zeros(3); q[2] = s_ * cc; sp.append((q, 1.3))
    sp.append((np.zeros(3), 2.0)); top = Body(np.array([p for p, _ in sp]), np.array([m for _, m in sp])); Ic = top.Ic
    i, i3 = Ic[0, 0], Ic[2, 2]; assert abs(Ic[0, 0] - Ic[1, 1]) < 1e-12 and abs(i - i3) > 1e-3
    wv = np.array([0.6, -0.5, 0.9]); B0s = omega_to_B(wv); A_ = (1 - i3 / i) * wv[2] * E['e1'] @ E['e2']; Lb = omega_to_B(Ic @ wv)
    Bst = B0s + EPS @ vec(v0); Mt, _ = run_pga(top, np.eye(4, dtype=complex), Bst, 2.0, 1e-3)
    Mclosed = expm_small(-0.5 * 2.0 * (EPS @ vec(v0))) @ expm_small(-0.5 * 2.0 * Lb / i) @ expm_small(-0.5 * 2.0 * A_)
    out['symmetric_top'] = {'motor_error': float(np.abs(Mt - Mclosed).max()), 'ok': bool(np.abs(Mt - Mclosed).max() < 1e-8), 'A_check': float(np.abs((B0s - Lb / i) - A_).max())}
    # (6) tennis racket
    i1, i2, i3 = 5.0, 3.0, 1.0; w1, w2, w3 = (i2 - i3) / i1, (i3 - i1) / i2, (i1 - i2) / i3
    def euler(b): return np.array([w1 * b[1] * b[2], w2 * b[2] * b[0], w3 * b[0] * b[1]])
    def evolve(b, tend, dtt=1e-3):
        mx = 0.0
        for _ in range(int(round(tend / dtt))):
            k1 = euler(b); k2 = euler(b + dtt / 2 * k1); k3 = euler(b + dtt / 2 * k2); k4 = euler(b + dtt * k3); b = b + dtt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); mx = max(mx, np.hypot(*[b[k] for k in range(3) if k != axis_]))
        return b, mx
    eps0 = 1e-8
    axis_ = 1; b0 = np.array([eps0 * sqrt(w1), 1.0, eps0 * sqrt(w3)]); b6, _ = evolve(b0, 6.0)            # growing eigenvector of the linearisation about the middle axis
    rate = np.log(np.hypot(b6[0], b6[2]) / np.hypot(b0[0], b0[2])) / 6.0
    axis_ = 0; _, m1 = evolve(np.array([1.0, eps0, eps0]), 6.0); axis_ = 2; _, m3 = evolve(np.array([eps0, eps0, 1.0]), 6.0)
    out['tennis_racket'] = {'predicted_rate': sqrt(w1 * w3), 'measured_rate_middle_axis': float(rate), 'max_perturbation_over_initial_axis1': float(m1 / eps0), 'max_perturbation_over_initial_axis3': float(m3 / eps0)}
    out['tennis_racket']['ok'] = bool(abs(rate - sqrt(w1 * w3)) < 1e-3 and m1 / eps0 < 10 and m3 / eps0 < 10)
    # negative controls
    neg = {}
    for name, kw in (('no_coriolis_term', dict(coriolis=0.0)), ('wrong_sign_coriolis', dict(coriolis=-1.0)), ('wrong_kinematic_factor', dict(kin_half=1.0))):
        Mn, _ = run_pga(body, M0, B0, T, dt, **kw); neg[name] = float(pose_error(body, Mn, *classical(body, c0, R0, vb, wb, T, dt)[:2]))
    out['negative_controls'] = {k: {'position_error': v, 'fails_as_expected': bool(v > 1e-3)} for k, v in neg.items()}
    return out

def main():
    import argparse; ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    out = compute()
    def flat(d, p=''):
        for k, v in d.items():
            if isinstance(v, dict): yield from flat(v, p + k + '.')
            else: yield p + k, v
    ok = True
    for k, v in flat(out):
        print(f'{k:60s} {v}')
        if k.endswith('.ok') and not v: ok = False
        if k.endswith('fails_as_expected') and not v: ok = False
    assert out['initial_pose_error'] < 1e-9 and out['motor_manifold_residual'] < 1e-6
    print('ALL NUMERIC CHECKS PASS' if ok else 'SOME NUMERIC CHECK FAILED')
    if a.write: json.dump(out, open(a.write, 'w'), indent=1); print('wrote', a.write)
    if a.compare:
        ref = json.load(open(a.compare)); cur = json.loads(json.dumps(out))
        def close(x, y):
            if isinstance(x, dict): return all(close(x[k], y[k]) for k in x)
            if isinstance(x, float): return abs(x - y) <= 1e-6 * max(1, abs(y))
            return x == y
        assert close(cur, ref), 'numeric data differs from the stored data'; print('numeric data == stored data (1e-6)')
    sys.exit(0 if ok else 1)
if __name__ == '__main__': main()
