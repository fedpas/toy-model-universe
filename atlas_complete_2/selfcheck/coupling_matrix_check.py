#!/usr/bin/env python3
"""Independent cross-check of the coupled Maxwell-Dirac system with explicit complex matrices (numpy), n = 3 ... 7.
  python3 coupling_matrix_check.py [--write coupling_matrix.json] [--compare coupling_matrix.json]
The multivector side uses the bit-mask product of coupling_selfcheck.py (blades, XOR, sign); the matrix side uses Jordan-Wigner
gamma matrices, gamma_0^2 = +1, gamma_k^2 = -1. Spinor Psi = psi u with gamma_0 u = u and J u = s i u  (J = gamma_2 gamma_1).
Checks, for random even psi(x), vector A(x), at a random point (linear fields, so the derivative is exact):
  (1) image of  grad(psi) J - e A psi - m psi gamma_0   equals   s i gamma^mu d_mu Psi - e A-slash Psi - m Psi    (error ~ 1e-15)
  (2) rank of psi -> psi u over the reals (4, 8, 8, 16, 16): psi doubles from n = 5
  (3) n = 3, 4: vector current X = psi gamma_0 psi~  equals  Psi^dagger gamma_0 gamma_mu Psi  component by component, up to one constant
  (4) n = 5: there is a psi with psi u = 0 whose vector current is still nonzero -> X is not a function of the Dirac spinor there
  negative controls: wrong sign of J, no A term, wrong signature of gamma."""
import sys, json, itertools, importlib.util, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cs', os.path.join(here, 'coupling_selfcheck.py')); cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
bmul, popc, sqs = cs.bmul, cs.popc, cs.sqs
rng = np.random.default_rng(20261003)

def euclid_gens(n):
    N = n // 2; X = np.array([[0, 1], [1, 0]], complex); Y = np.array([[0, -1j], [1j, 0]]); Z = np.diag([1, -1]).astype(complex); I2 = np.eye(2, dtype=complex)
    def kron(l):
        r = np.eye(1, dtype=complex)
        for a in l: r = np.kron(r, a)
        return r
    g = []
    for k in range(N):
        g.append(kron([Z] * k + [X] + [I2] * (N - k - 1))); g.append(kron([Z] * k + [Y] + [I2] * (N - k - 1)))
    if n % 2:
        P = np.eye(2 ** N, dtype=complex)
        for a in g: P = P @ a
        P = P * (1 if np.allclose(P @ P, np.eye(2 ** N)) else 1j)
        assert np.allclose(P @ P, np.eye(2 ** N)); g.append(P)
    return g[:n]
def gammas(n, wrong=False):
    e = euclid_gens(n); g = [e[0]] + [(e[k] if wrong else 1j * e[k]) for k in range(1, n)]
    sq = sqs(n)
    for a in range(n):
        for b in range(n):
            M = g[a] @ g[b] + g[b] @ g[a]
            assert np.allclose(M, (2 * sq[a] if a == b else 0) * np.eye(len(M))) or wrong
    return g
def blade_matrix(g, mask):
    M = np.eye(len(g[0]), dtype=complex)
    for i in range(len(g)):
        if mask >> i & 1: M = M @ g[i]
    return M
def mv_mul(A, B, sq):
    R = {}
    for a, x in A.items():
        for b, y in B.items():
            m, s = bmul(a, b, sq); R[m] = R.get(m, 0) + s * x * y
    return R
def rev(A): return {m: cs.rsign(popc(m)) * v for m, v in A.items()}
def add(A, B, c=1.0):
    R = dict(A)
    for m, v in B.items(): R[m] = R.get(m, 0) + c * v
    return R
def sc(A, c): return {m: c * v for m, v in A.items()}
def tomat(A, g): return sum(v * blade_matrix(g, m) for m, v in A.items())
def find_u(g):
    """joint eigenvector with gamma_0 u = u and J u = s i u (J = gamma_2 gamma_1); returns u, J, s (s = +1 tried first)"""
    n = len(g); J = -blade_matrix(g, 6); d = len(g[0])
    for s in (1, -1):
        P = (np.eye(d) + g[0]) / 2 @ ((np.eye(d) + J / (1j * s)) / 2)
        U, S, Vh = np.linalg.svd(P)
        if S[0] > 0.99: return U[:, 0], J, s
    raise AssertionError('no joint eigenvector')
def run(n, wrong_sig=False, flipJ=False, noA=False):
    sq = sqs(n); g = gammas(n, wrong_sig)
    u, Jm, sJ = find_u(g); assert np.allclose(Jm @ u, 1j * sJ * u) and np.allclose(g[0] @ u, u)
    s_use = -sJ if flipJ else sJ
    evens = [m for m in range(1 << n) if popc(m) % 2 == 0]
    worst = 0.0; e_, m_ = 0.7, 1.3
    for _ in range(40):
        x = rng.normal(size=n)
        psi0 = {m: rng.normal() for m in evens}; dpsi = [{m: rng.normal() for m in evens} for _ in range(n)]
        A0 = {1 << k: rng.normal() for k in range(n)}; dA = [{1 << k: rng.normal() for k in range(n)} for _ in range(n)]
        psi = psi0.copy()
        for k in range(n): psi = add(psi, dpsi[k], x[k])
        A = A0.copy()
        for k in range(n): A = add(A, dA[k], x[k])
        # multivector side: grad psi = sum_k gamma^k d_k psi, gamma^k = sq_k gamma_k
        gp = {}
        for k in range(n): gp = add(gp, mv_mul({1 << k: sq[k]}, dpsi[k], sq))
        J_mv = {6: -1.0}   # gamma_2 gamma_1 = - gamma_1 gamma_2
        D = mv_mul(gp, J_mv, sq)
        D = add(D, mv_mul(A, psi, sq), -e_)
        D = add(D, mv_mul(psi, {1: 1.0}, sq), -m_)
        lhs = tomat(D, g) @ u
        Psi = tomat(psi, g) @ u
        dPsi = [tomat(dpsi[k], g) @ u for k in range(n)]
        slash = sum(sq[k] * g[k] @ dPsi[k] for k in range(n))
        Ah = tomat(A, g)
        rhs = 1j * s_use * slash - (0 if noA else e_) * (Ah @ Psi) - m_ * Psi
        worst = max(worst, float(np.abs(lhs - rhs).max()))
    return worst, g, u, sJ
def rank_real(n):
    g = gammas(n); u, _, _ = find_u(g)
    evens = [m for m in range(1 << n) if popc(m) % 2 == 0]
    cols = []
    for m in evens:
        v = blade_matrix(g, m) @ u; cols.append(np.concatenate([v.real, v.imag]))
    return int(np.linalg.matrix_rank(np.array(cols).T, tol=1e-9))
def current_check(n):
    sq = sqs(n); g = gammas(n)
    u, J, _ = find_u(g)
    evens = [m for m in range(1 << n) if popc(m) % 2 == 0]
    ratios = []
    for _ in range(30):
        psi = {m: rng.normal() for m in evens}
        X = mv_mul(mv_mul(psi, {1: 1.0}, sq), rev(psi), sq)
        Psi = tomat(psi, g) @ u
        for mu in range(n):
            Xm = X.get(1 << mu, 0.0)                          # coefficient of gamma_mu
            bil = (Psi.conj() @ g[0] @ g[mu] @ Psi)
            ratios.append((mu, Xm, bil.real, bil.imag))
    return ratios
def main():
    out = {'max_error': {}, 'rank_real': {}, 'current': {}, 'controls': {}}
    for n in range(3, 8):
        w, *_ = run(n); out['max_error'][str(n)] = 0 if w < 1e-9 else w; assert w < 1e-9, (n, w)
        out['rank_real'][str(n)] = rank_real(n)
    assert [out['rank_real'][str(n)] for n in range(3, 8)] == [4, 8, 8, 16, 16], out['rank_real']
    for n in (3, 4):
        R = current_check(n)
        const = set()
        for mu in range(n):
            xs = np.array([(r[1], r[2]) for r in R if r[0] == mu])
            c = (xs[:, 0] @ xs[:, 1]) / (xs[:, 1] @ xs[:, 1]); err = np.abs(xs[:, 0] - c * xs[:, 1]).max()
            assert err < 1e-9, (n, mu, err); const.add(round(float(c), 9))
        out['current'][str(n)] = {'ratios_X_over_bilinear': sorted(const)}
        assert all(abs(abs(c) - abs(sorted(const)[0])) < 1e-9 for c in const)
        assert all(abs(r[3]) < 1e-9 for r in R)
    # n = 5: kernel of psi -> psi u carries a current
    n = 5; g = gammas(n); u, _, _ = find_u(g)
    sq = sqs(n); evens = [m for m in range(1 << n) if popc(m) % 2 == 0]
    M = np.array([np.concatenate([(blade_matrix(g, m) @ u).real, (blade_matrix(g, m) @ u).imag]) for m in evens]).T
    U, S, Vh = np.linalg.svd(M); null = Vh[np.sum(S > 1e-9):]
    assert len(null) == 8
    best = 0.0
    for _ in range(20):
        c = rng.normal(size=len(null)) @ null; psi = {m: float(c[i]) for i, m in enumerate(evens)}
        assert np.abs(tomat(psi, g) @ u).max() < 1e-9
        X = mv_mul(mv_mul(psi, {1: 1.0}, sq), rev(psi), sq)
        best = max(best, max(abs(X.get(1 << mu, 0.0)) for mu in range(n)))
    out['current']['5'] = {'psi_with_zero_spinor_but_nonzero_vector_current': bool(best > 1e-6)}
    # negative controls
    for name, kw in (('wrong_sign_of_J', dict(flipJ=True)), ('A_term_dropped_on_one_side', dict(noA=True)), ('wrong_gamma_signature', dict(wrong_sig=True))):
        try: w = run(4, **kw)[0]
        except AssertionError: w = 99.0
        out['controls'][name] = 'fails (error > 1e-3)'; assert w > 1e-3, (name, w)
    out['status'] = 'ALL MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
