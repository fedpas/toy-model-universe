#!/usr/bin/env python3
"""Cross-check of the Dirac equation in the even subalgebra of Cl(1,3) against the usual 4x4 complex gamma matrices (needs numpy).
The even multivector psi (8 real components) is sent to the Dirac spinor Psi = psi(gamma) u with u = (1,0,0,0).  We check, with no free parameters:
  1. gamma_0 u = u and (gamma_2 gamma_1) u = s i u for a fixed sign s, so right multiplication by J is multiplication by i
  2. psi -> Psi is a real-linear bijection from the 8 even components onto C^4
  3. for random psi and random first derivatives, the Hestenes expression  grad(psi) J - m psi gamma_0  maps to  s i gamma^mu d_mu Psi - m Psi
     (the standard Dirac equation up to the overall factor), to machine precision.
  python3 dirac_matrix_check.py            run;     python3 dirac_matrix_check.py --write dirac_matrix.json"""
import json, sys, itertools
import numpy as np
s0 = np.eye(2); s1 = np.array([[0, 1], [1, 0]], complex); s2 = np.array([[0, -1j], [1j, 0]]); s3 = np.array([[1, 0], [0, -1]], complex)
g0 = np.block([[s0, 0 * s0], [0 * s0, -s0]]).astype(complex)
gk = [np.block([[0 * s0, s], [-s, 0 * s0]]) for s in (s1, s2, s3)]
G = [g0] + gk                                           # gamma_0..3, squares +1, -1, -1, -1
eta = [1, -1, -1, -1]
for a in range(4):
    for b in range(4):
        assert np.allclose(G[a] @ G[b] + G[b] @ G[a], 2 * (eta[a] if a == b else 0) * np.eye(4))
u = np.array([1, 0, 0, 0], complex)
def blade(mask):
    M = np.eye(4, dtype=complex)
    for i in range(4):
        if mask >> i & 1: M = M @ G[i]                  # product in increasing index order = the bit-mask convention
    return M
J = G[2] @ G[1]
assert np.allclose(G[0] @ u, u), 'gamma_0 u = u'
Ju = J @ u; s = (Ju[0] / u[0]) / 1j if abs(u[0]) > 0 else None
assert np.allclose(Ju, s * 1j * u) and abs(abs(s) - 1) < 1e-12, 'J u = s i u'
even = [m for m in range(16) if bin(m).count('1') % 2 == 0]
def Phi(psi):                                           # psi: dict mask -> real coefficient
    return sum(c * blade(m) for m, c in psi.items()) @ u
# 2. bijection: real 8x8 matrix of the map even -> C^4 = R^8
A = np.array([np.concatenate([Phi({m: 1.0}).real, Phi({m: 1.0}).imag]) for m in even])
assert np.linalg.matrix_rank(A) == 8, 'psi -> Psi is a real-linear bijection'
# 3. the equation, pointwise, for random data
rng = np.random.default_rng(3); worst = 0.0
for _ in range(200):
    psi0 = {m: rng.normal() for m in even}; dpsi = [{m: rng.normal() for m in even} for _ in range(4)]; mass = rng.normal()
    mat = lambda d: sum(c * blade(m) for m, c in d.items())
    lhs = sum(G[mu] @ mat(dpsi[mu]) for mu in range(4)) @ J - mass * mat(psi0) @ g0       # grad(psi) J - m psi gamma_0   (as a 4x4 matrix)
    dirac = s * 1j * sum(G[mu] @ (mat(dpsi[mu]) @ u) for mu in range(4)) - mass * (mat(psi0) @ u)
    worst = max(worst, np.abs(lhs @ u - dirac).max())
assert worst < 1e-12, worst
# negative controls: the same comparison must FAIL for wrong versions of the equation
def controls():
    # (a mass term without gamma_0 is NOT a control here: gamma_0 u = u, so it is invisible on spinors; it is excluded by grade, see equations_selfcheck.py: both sides must be odd)
    bad = {'J replaced by gamma_1 gamma_2 (wrong sign of i)': None, 'derivative term without J': None}
    rng2 = np.random.default_rng(5); res = {}
    for label in bad:
        w = 0.0
        for _ in range(50):
            psi0 = {m: rng2.normal() for m in even}; dpsi = [{m: rng2.normal() for m in even} for _ in range(4)]; mass = rng2.normal() + 2
            mat = lambda d: sum(c * blade(m) for m, c in d.items())
            if label.startswith('J replaced'): lhs = sum(G[mu] @ mat(dpsi[mu]) for mu in range(4)) @ (G[1] @ G[2]) - mass * mat(psi0) @ g0
            else: lhs = sum(G[mu] @ mat(dpsi[mu]) for mu in range(4)) - mass * mat(psi0) @ g0
            dirac = s * 1j * sum(G[mu] @ (mat(dpsi[mu]) @ u) for mu in range(4)) - mass * (mat(psi0) @ u)
            w = max(w, np.abs(lhs @ u - dirac).max())
        assert w > 0.1, ('negative control did not fail', label, w); res[label] = float(w)
    return res
ctrl = controls()
out = {'gamma0_u_equals_u': True, 'J_u_equals_s_i_u': {'s': int(round(s.real))}, 'bijection_rank': 8, 'worst_error': float(worst), 'trials': 200, 'negative_controls_fail_with_error': ctrl,
       'meaning': 'right multiplication by J = gamma_2 gamma_1 acts as multiplication by i, so grad(psi) J = m psi gamma_0 is the Dirac equation i gamma^mu d_mu Psi = m Psi up to the sign s'}
if '--write' in sys.argv: open(sys.argv[sys.argv.index('--write') + 1], 'w').write(json.dumps(out, indent=1, sort_keys=True))
print('ALL DIRAC MATRIX CHECKS PASS  (worst error %.1e, s = %d)' % (worst, int(round(s.real))))
