#!/usr/bin/env python3
"""Independent cross-check of the mirrors step with explicit matrices (numpy).
  python3 mirrors_matrix_check.py [--write mirrors_matrix.json] [--compare mirrors_matrix.json]
Nothing here uses the bit-mask products: the frame algebra is Jordan-Wigner gamma matrices , a vector a is the matrix g(a) = sum a_i gamma_i,
a reflection is the Householder matrix x -> x - 2 (x.a)/(a.a) a with the metric eta = diag(sq), and a versor is a product of such matrices.
Checks (floating point, tolerance 1e-9), signatures (+,-,...,-) and (-,...,-), n = 2..6:
  (1) the twisted sandwich (-1)^k V g(x) V^-1 equals g(R x), R the product of the k Householder matrices          random products of 1 to 2n+1 vectors
  (2) Cartan-Dieudonne by Householder: for a random orthogonal O (a product of random reflections) the construction a = O u - u, u not null, stops after at most n mirrors,
      their product is O, and the product of the gamma matrices of the mirrors is proportional to V (real, nonzero scalar)
  (3) the all-flip corner -1 needs exactly n mirrors: rank(-1 - 1) = n, and the product of the n coordinate mirrors is the corner matrix
  (4) rotation 3/5, 4/5 and boost 5/4, 3/4 as two mirrors
negative controls that must fail: the untwisted sandwich V g(x) V^-1 for an odd number of mirrors; a gamma matrix with the wrong square (the Clifford relation or the mirror formula breaks);
n - 1 random mirrors never reproduce the all-flip corner; the Householder formula with the wrong metric (the matrix is not an isometry of eta)."""
import sys, json, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(20261008)
TOL = 1e-9

def euclid_gens(n):
    """Jordan-Wigner: n anticommuting Hermitian matrices with square +1 (X and Y on a ladder of Z strings)"""
    N = (n + 1) // 2; X = np.array([[0, 1], [1, 0]], complex); Y = np.array([[0, -1j], [1j, 0]]); Z = np.diag([1, -1]).astype(complex); I2 = np.eye(2, dtype=complex)
    def kron(l):
        r = np.eye(1, dtype=complex)
        for a in l: r = np.kron(r, a)
        return r
    g = []
    for k in range(N):
        g.append(kron([Z] * k + [X] + [I2] * (N - k - 1))); g.append(kron([Z] * k + [Y] + [I2] * (N - k - 1)))
    return g[:n]
def gammas(sq, wrong=None):
    """gamma_i^2 = sq_i; a generator with sq = -1 is i times a Euclidean one; `wrong` flips the square of that one"""
    e = euclid_gens(len(sq)); g = []
    for i, s in enumerate(sq):
        if wrong == i: s = -s
        g.append(e[i] if s == 1 else 1j * e[i])
    return g
class gm: pass
gm.gammas = staticmethod(gammas)

def sig(n, kind): return [-1] * n if kind == 'space' else [1] + [-1] * (n - 1)
def gmat(g, x): return sum(c * m for c, m in zip(x, g))
def householder(sq, a):
    eta = np.diag(np.array(sq, float)); aa = a @ eta @ a
    return np.eye(len(a)) - 2 * np.outer(a, a @ eta) / aa
def rand_nonnull(sq):
    eta = np.array(sq, float)
    while True:
        a = rng.normal(size=len(sq))
        if abs(np.sum(eta * a * a)) > 0.4 * np.sum(a * a): return a        # away from the light cone: keeps the boosts moderate, so the floating point error stays small
def propto(A, B):
    """A = c B for a real nonzero c ?"""
    c = np.vdot(B, A) / np.vdot(B, B)
    return bool(np.abs(A - c * B).max() < TOL * max(1, np.abs(A).max())) and abs(c) > 1e-6 and abs(c.imag) < TOL
def nullspace(M):
    u, s, vt = np.linalg.svd(M); r = int((s > 1e-9).sum()); return vt[r:].T
def cartan_dieudonne(sq, O, attempts=60):
    """a = O u - u with u random and not null; an unlucky u can leave a remainder whose every a is null, so the draw is repeated (the theorem needs one good choice)"""
    for _ in range(attempts):
        try:
            r = _cd_once(sq, O)
            if r is not None: return r
        except AssertionError: pass
    raise AssertionError('no decomposition found')
def _cd_once(sq, O):
    n = len(sq); eta = np.diag(np.array(sq, float)); mirrors = []; Ok = O.copy(); fixed = []
    for _ in range(n + 1):
        if np.abs(Ok - np.eye(n)).max() < 1e-8: return mirrors
        W = nullspace(np.array(fixed) @ eta) if fixed else np.eye(n)
        for _try in range(200):
            u = W @ rng.normal(size=W.shape[1])
            if abs(u @ eta @ u) < 0.3 * (u @ u): continue
            a = Ok @ u - u
            if np.abs(a).max() < 1e-9: break                     # this u is already fixed: not useful, try another
            if abs(a @ eta @ a) < 1e-3 * (a @ a): continue
            Ok = householder(sq, a) @ Ok; mirrors.append(a); fixed.append(u); break
        else: raise AssertionError('no usable u')
    return mirrors if np.abs(Ok - np.eye(n)).max() < 1e-8 else None

def check_versors(n, kind, trials, untwisted=False, wrong=None):
    sq = sig(n, kind); g = gm.gammas(sq, wrong); eta = np.array(sq, float); worst = 0.
    for t in range(trials):
        k = int(rng.integers(1, 2 * n + 2)); V = np.eye(len(g[0]), dtype=complex); R = np.eye(n)
        for _ in range(k):
            a = rand_nonnull(sq); V = V @ gmat(g, a); R = R @ householder(sq, a)
        sgn = 1 if untwisted else (-1) ** k; Vi = np.linalg.inv(V)
        for _ in range(3):
            x = rng.normal(size=n); lhs = sgn * V @ gmat(g, x) @ Vi; rhs = gmat(g, R @ x); worst = max(worst, float(np.abs(lhs - rhs).max()))
    return worst
def check_decomposition(n, kind, trials):
    sq = sig(n, kind); g = gm.gammas(sq); eta = np.diag(np.array(sq, float)); used = {}
    for t in range(trials):
        k = int(rng.integers(1, 2 * n + 2)); V = np.eye(len(g[0]), dtype=complex); O = np.eye(n)
        for _ in range(k):
            a = rand_nonnull(sq); V = V @ gmat(g, a); O = O @ householder(sq, a)
        assert np.abs(O.T @ eta @ O - eta).max() < 1e-8, 'not an isometry'
        ms = cartan_dieudonne(sq, O); assert ms is not None and len(ms) <= n, ('more than n mirrors', n, len(ms) if ms is not None else None)
        assert (len(ms) - k) % 2 == 0, 'parity must be kept'
        P = np.eye(n); W = np.eye(len(g[0]), dtype=complex)
        for a in ms: P = P @ householder(sq, a); W = W @ gmat(g, a)
        # P is the product of the same reflections in the order a1 a2 ... ak; the construction gave O = R_a1 R_a2 ... R_ak
        assert np.abs(P - O).max() < 1e-8, 'the mirrors do not multiply to O'
        assert propto(W, V), 'the reduced versor is not proportional to V'
        used[str(len(ms))] = used.get(str(len(ms)), 0) + 1
    return dict(sorted(used.items()))
def corner_matrix(n, kind):
    sq = sig(n, kind); g = gm.gammas(sq); P = np.eye(n); V = np.eye(len(g[0]), dtype=complex)
    for i in range(n):
        e = np.zeros(n); e[i] = 1; P = P @ householder(sq, e); V = V @ gmat(g, e)
    return P, V, sq, g
def fewer_mirrors_cannot(n, kind, tries=300):
    """n-1 random mirrors never give -1 (the rank of -1 - 1 is n, a product of k reflections moves at most a k dimensional space)"""
    sq = sig(n, kind); best = 1e9
    for _ in range(tries):
        P = np.eye(n)
        for _ in range(n - 1): P = P @ householder(sq, rand_nonnull(sq))
        best = min(best, float(np.abs(P + np.eye(n)).max()))
    return best
def example(sq, O, mirrors_expected=2):
    O = np.array(O, float); ms = cartan_dieudonne(sq, O); assert ms is not None and len(ms) == mirrors_expected, len(ms)
    P = np.eye(2)
    for a in ms: P = P @ householder(sq, a)
    assert np.abs(P - O).max() < 1e-9; return len(ms)

def main():
    out = {'twisted_sandwich_error': {}, 'cartan_dieudonne': {}, 'corner': {}, 'examples': {}, 'controls': {}}
    for kind in ('space', 'lorentz'):
        for n in range(2, 7):
            key = '%d,%s' % (n, kind); w = check_versors(n, kind, 25); assert w < TOL, ('twisted sandwich', key, w); out['twisted_sandwich_error'][key] = 0
            used = check_decomposition(n, kind, 25); assert max(int(k) for k in used) <= n; out['cartan_dieudonne'][key] = {'at_most_n': True, 'mirror_counts_seen': used}
            P, V, sq, g = corner_matrix(n, kind); assert np.abs(P + np.eye(n)).max() < 1e-12
            assert np.linalg.matrix_rank(-np.eye(n) - np.eye(n)) == n
            out['corner'][key] = {'all_flip_needs': n, 'rank_of_flip_minus_identity': n}
    assert example([-1, -1], [[0.6, -0.8], [0.8, 0.6]]) == 2; assert example([1, -1], [[1.25, 0.75], [0.75, 1.25]]) == 2
    out['examples'] = {'rotation_3_4_5': 'two mirrors', 'boost_5_4_3_4': 'two mirrors'}
    # negative controls
    assert check_versors(4, 'lorentz', 20, untwisted=True) > 1e-3; out['controls']['untwisted_sandwich'] = 'fails for an odd number of mirrors'
    try: bad = check_versors(4, 'lorentz', 5, wrong=2)
    except Exception: bad = 1.0
    assert bad > 1e-3; out['controls']['wrong_gamma_square'] = 'fails (the vector is not sent to a vector)'
    best = min(fewer_mirrors_cannot(n, 'space') for n in (3, 4, 5)); assert best > 0.05; out['controls']['n_minus_1_mirrors_for_the_corner'] = 'never reaches -1 (closest distance %.2f)' % best
    n = 4; eta_wrong = np.diag([-1.] * n); a = rand_nonnull(sig(n, 'lorentz')); H = np.eye(n) - 2 * np.outer(a, a @ eta_wrong) / (a @ eta_wrong @ a)
    assert np.abs(H.T @ np.diag(sig(n, 'lorentz')) @ H - np.diag(sig(n, 'lorentz'))).max() > 1e-3; out['controls']['wrong_metric'] = 'the matrix is not an isometry of eta'
    out['status'] = 'ALL MIRRORS MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
