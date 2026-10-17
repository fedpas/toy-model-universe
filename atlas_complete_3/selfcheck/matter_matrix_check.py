#!/usr/bin/env python3
"""Independent cross-check of the matter equation and its current with explicit matrices (numpy), (n, m) = (3,2) (3,3) (4,2) (4,3) (4,4).
  python3 matter_matrix_check.py [--write matter_matrix.json] [--compare matter_matrix.json]
Multivector side: blades are bit masks, the bit product with signs; Psi = sum Psi_{S,T} e_S x eps_T, internal generators B_a act on the blade T from the left.
Matrix side: Jordan-Wigner gamma matrices (gamma_0^2 = +1, gamma_k^2 = -1), Psi_s[T] = Psi_T u with gamma_0 u = u, J u = s i u, and the internal action as a real matrix on the index T.
Checks, at random points with linear fields:
  (1) image of  sum_mu gamma^mu (d_mu Psi + g A^a_mu B_a Psi) J - m Psi gamma_0   equals   s i sum_mu gamma^mu (d_mu + g A^a_mu L_a) Psi_s - m Psi_s       (error ~ 1e-15)
  (2) the current  j^a_nu = sum_T < Psi~_T gamma^nu (B_a Psi)_T gamma_0 J >_0  equals  +-Im or Re of  sum_T Psi_s[T]^dag gamma_0 gamma^nu (L_a Psi_s)[T],  one constant sign per nu
negative controls that must fail: J with the wrong sign, the gauge term dropped on one side, gamma matrices with the wrong signature, the current without J."""
import sys, json, itertools, importlib.util, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ms', os.path.join(here, 'matter_selfcheck.py')); ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
bmul, popc, rsign = ms.bmul, ms.popc, ms.rsign
rng = np.random.default_rng(20261004)

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
        P = P * (1 if np.allclose(P @ P, np.eye(2 ** N)) else 1j); assert np.allclose(P @ P, np.eye(2 ** N)); g.append(P)
    return g[:n]
def gammas(n, wrong=False):
    e = euclid_gens(n); g = [e[0]] + [(e[k] if wrong else 1j * e[k]) for k in range(1, n)]; sq = ms.sq_space(n)
    for a in range(n):
        for b in range(n):
            M = g[a] @ g[b] + g[b] @ g[a]; assert np.allclose(M, (2 * sq[a] if a == b else 0) * np.eye(len(M))) or wrong
    return g
def blade_matrix(g, mask):
    M = np.eye(len(g[0]), dtype=complex)
    for i in range(len(g)):
        if mask >> i & 1: M = M @ g[i]
    return M
def find_u(g):
    J = -blade_matrix(g, 6); d = len(g[0])
    for s in (1, -1):
        P = (np.eye(d) + g[0]) / 2 @ ((np.eye(d) + J / (1j * s)) / 2); U, S, Vh = np.linalg.svd(P)
        if S[0] > 0.99: return U[:, 0], J, s
    raise AssertionError('no joint eigenvector')
def mv_spinor(g, u, Psi, n, m):                      # Psi: dict (S,T) -> float ; returns array [T] of spinors
    out = np.zeros((2 ** m, len(g[0])), complex)
    for (S, T), v in Psi.items(): out[T] += v * (blade_matrix(g, S) @ u)
    return out
def Lmat(m, gens, a):
    sqi = [-1] * m; M = np.zeros((2 ** m, 2 ** m))
    for T in range(2 ** m):
        t, s = bmul(gens[a], T, sqi); M[t, T] = s
    return M
def run(n, m, flipJ=False, dropA=False, wrong_sig=False, current_without_J=False):
    Y = ms.Sys(n, m); sq = Y.sq; g = gammas(n, wrong_sig); u, Jm, sJ = find_u(g); s_use = -sJ if flipJ else sJ
    assert np.allclose(g[0] @ u, u) and np.allclose(Jm @ u, 1j * sJ * u)
    G = Y.G; Ls = [Lmat(m, Y.gens, a) for a in range(G)]; gm, mass = 0.8, 1.3
    worstE = 0.0; ratios = {nu: [] for nu in range(n)}
    for _ in range(25):
        x = rng.normal(size=n)
        Psi0 = {(S, T): rng.normal() for S in Y.ev for T in Y.Ts}; dPsi = [{(S, T): rng.normal() for S in Y.ev for T in Y.Ts} for _ in range(n)]
        A0 = rng.normal(size=(n, G)); dA = rng.normal(size=(n, n, G)); Ax = A0 + np.einsum('l,lna->na', x, dA)
        Psi = dict(Psi0)
        for k in range(n):
            for key, v in dPsi[k].items(): Psi[key] += x[k] * v
        def lmul(a, X):
            out = {}
            for (S, T), v in X.items():
                t, s = bmul(Y.gens[a], T, Y.sqi); out[(S, t)] = out.get((S, t), 0.0) + s * v
            return out
        def gam(mu, X):
            out = {}
            for (S, T), v in X.items():
                t, s = bmul(1 << mu, S, sq); out[(t, T)] = out.get((t, T), 0.0) + s * sq[mu] * v
            return out
        def rmask(mask, coef, X):
            out = {}
            for (S, T), v in X.items():
                t, s = bmul(S, mask, sq); out[(t, T)] = out.get((t, T), 0.0) + s * coef * v
            return out
        def addd(a, b, c=1.0):
            r = dict(a)
            for k, v in b.items(): r[k] = r.get(k, 0.0) + c * v
            return r
        E = {}
        for mu in range(n):
            D = dict(dPsi[mu])
            for a in range(G): D = addd(D, lmul(a, Psi), gm * Ax[mu, a])
            E = addd(E, rmask(6, -1.0, gam(mu, D)))
        E = addd(E, rmask(1, 1.0, Psi), -mass)
        lhs = mv_spinor(g, u, E, n, m); Ps = mv_spinor(g, u, Psi, n, m)
        rhs = np.zeros_like(Ps)
        for mu in range(n):
            dPs = mv_spinor(g, u, dPsi[mu], n, m); D = dPs.copy()
            if not dropA:
                for a in range(G): D = D + gm * Ax[mu, a] * (Ls[a] @ Ps)
            rhs = rhs + 1j * s_use * sq[mu] * (D @ g[mu].T)
        rhs = rhs - mass * Ps
        worstE = max(worstE, float(np.abs(lhs - rhs).max()))
        # current
        for a in range(G):
            LaPs = Ls[a] @ Ps; LaPsi = lmul(a, Psi)
            for nu in range(n):
                tot = 0.0
                for (S, T), v in Psi.items():
                    for (S2, T2), w in LaPsi.items():
                        if T != T2: continue
                        mk, sg = ms.prod(([S, 1 << nu, S2, 1, 6] if not current_without_J else [S, 1 << nu, S2, 1]), sq)
                        if mk == 0: tot += v * w * sg * (-1 if not current_without_J else 1) * rsign(popc(S)) * sq[nu]
                b = sum(np.vdot(Ps[T], g[0] @ g[nu] @ LaPs[T]) for T in range(2 ** m))
                ratios[nu].append((tot, b.real, b.imag))
    return worstE, ratios
def best_part(rat):
    out = {}
    for nu, rs in rat.items():
        arr = np.array(rs); res = {}
        for name, col in (('re', 1), ('im', 2)):
            den = arr[:, col] @ arr[:, col]
            if den < 1e-12: res[name] = (None, np.inf); continue
            c = (arr[:, 0] @ arr[:, col]) / den; res[name] = (c, float(np.abs(arr[:, 0] - c * arr[:, col]).max()))
        out[nu] = res
    return out
def main():
    out = {'max_error_equation': {}, 'current': {}, 'controls': {}}
    for (n, m) in [(3, 2), (3, 3), (4, 2), (4, 3), (4, 4)]:
        w, rat = run(n, m); assert w < 1e-9, (n, m, w); out['max_error_equation']['%d,%d' % (n, m)] = 0 if w < 1e-9 else w
        bp = best_part(rat); parts = set(); consts = set()
        for nu, res in bp.items():
            part = min(res, key=lambda k: res[k][1]); assert res[part][1] < 1e-9, (n, m, nu, res); parts.add(part); consts.add(round(abs(res[part][0]), 6))
        assert len(parts) == 1 and consts == {1.0}, (parts, consts)
        out['current']['%d,%d' % (n, m)] = {'equals_part_of_spinor_bilinear': sorted(parts)[0], 'abs_constant': 1.0}
    for name, kw in (('wrong_sign_of_J', dict(flipJ=True)), ('gauge_term_dropped_on_one_side', dict(dropA=True)), ('wrong_gamma_signature', dict(wrong_sig=True))):
        try: w = run(4, 3, **kw)[0]
        except AssertionError: w = 99.0
        assert w > 1e-3, (name, w); out['controls'][name] = 'fails (error > 1e-3)'
    w, rat = run(4, 3, current_without_J=True); bp = best_part(rat)
    bad = all(not any(r[k][0] is not None and abs(abs(r[k][0]) - 1) < 1e-6 and r[k][1] < 1e-9 for k in r) for r in bp.values()); assert bad, 'the current without J must not match the spinor bilinear with constant 1'; out['controls']['current_without_J'] = 'fails (error > 1e-3)'
    out['status'] = 'ALL MATTER MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
