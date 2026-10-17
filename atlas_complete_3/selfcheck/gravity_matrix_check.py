#!/usr/bin/env python3
"""Independent cross-check of the gravity step with explicit matrices and tensors (numpy).
  python3 gravity_matrix_check.py [--write gravity_matrix.json] [--compare gravity_matrix.json]
Nothing here uses the bit-mask products: the frame algebra is Jordan-Wigner gamma matrices of signature (1, n-1), forms are replaced by constant fields
(so only the algebra is tested; the derivative terms are tested in gravity_selfcheck.py), the Levi-Civita symbol is the parity of a permutation.
Checks:
  (1) structure constants:  [B_A, B_B] = f_AB^C B_C  and  (1/2)[B_A, gamma_b] = h_Ab^c gamma_c, read off the matrices, equal the constants of gravity_selfcheck.py     n = 2..6
  (2) with constant omega: the curvature R^C = (1/4) f omega omega equals the commutator of the vector-representation connection and (1/2 R^C B_C) the commutator
      of the spinor connection  [D_mu, D_nu] = (1/2) R_{mu nu} B                                                                                                         n = 2..6
  (3) algebraic curvature tensors R_{abcd} (lowered, metric eta): antisymmetric in (ab), (cd), first Bianchi R_{a[bcd]} = 0: null-space dimension n^2(n^2-1)/12 by SVD,
      pair symmetry, Ricci rank and Weyl dimension                                                                                                                        n = 2..7
  (4) E_a at e = dx equals the Einstein tensor Ric - (1/2) S delta, by tensor contraction with permutation signs, ratio 1 for arbitrary R                                    n = 3, 4, 5
  (5) the extra generator of square s: [B_an, B_bn] = -2 s B_ab, so the curvature of omega + kappa e is R - s kappa^2 e^e and kappa T, equal to the constants k, mu of the portal  n = 3, 4, 5
negative controls that must fail: a gamma matrix with the wrong square; first Bianchi dropped (dimension is P^2); Ricci instead of the Einstein tensor (ratio not constant);
trace coefficient 1 instead of 1/2 (ratio not constant); the sign of the extra generator square flipped (k changes sign)."""
import sys, json, itertools, importlib.util, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('gs', os.path.join(here, 'gravity_selfcheck.py')); gs = importlib.util.module_from_spec(spec); spec.loader.exec_module(gs)
rng = np.random.default_rng(20261005)

def euclid_gens(n):
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
    """gamma_i^2 = sq_i; the generators with sq = -1 are i times a Euclidean one; `wrong` flips the square of that one"""
    n = len(sq); e = euclid_gens(n); g = []
    for i, s in enumerate(sq):
        if wrong == i: s = -s
        g.append(e[i] if s == 1 else 1j * e[i])
    return g
def algebra_basis(g, sq, pairs):
    return [g[a] @ g[b] for a, b in pairs]
def express(M, basis):
    """coefficients of M in the span of `basis` (least squares), and the residual"""
    A = np.array([b.flatten() for b in basis]).T; c, *_ = np.linalg.lstsq(A, M.flatten(), rcond=None)
    assert np.abs(c.imag).max() < 1e-9, 'coefficients must be real'; return c.real, float(np.abs(A @ c - M.flatten()).max())

# ---------------------------------------------------------------------------------------- (1) and (2)
def lie_check(n, wrong=None):
    sq = [1] + [-1] * (n - 1); g = gammas(sq, wrong); pairs = [(a, b) for a in range(n) for b in range(a + 1, n)]; B = algebra_basis(g, sq, pairs); G = len(B)
    L = gs.lorentz(n); assert [(1 << a) | (1 << b) for a, b in pairs] == L.gens
    for a in range(n):
        for b in range(n):
            M = g[a] @ g[b] + g[b] @ g[a]
            if not np.allclose(M, (2 * sq[a] if a == b else 0) * np.eye(len(M))): return None
    I = np.eye(len(g[0])); rank = np.linalg.matrix_rank(np.array([b.flatten() for b in B]))
    assert rank == G, 'bivector matrices are not independent'
    f = np.zeros((G, G, G)); err = 0.
    for A in range(G):
        for C in range(G):
            c, r = express(B[A] @ B[C] - B[C] @ B[A], B); f[A, C] = c; err = max(err, r)
    h = np.zeros((G, n, n))                                                  # h[A, b, c] : (1/2)[B_A, gamma_b] = h_Ab^c gamma_c
    for A in range(G):
        for b in range(n):
            c, r = express(0.5 * (B[A] @ g[b] - g[b] @ B[A]), g); h[A, b] = c; err = max(err, r)
    fe = np.zeros_like(f); he = np.zeros_like(h)
    for (A, C), (D, v) in L.f.items(): fe[A, C, D] = v
    for (A, b), (c, v) in L.h.items(): he[A, b, c] = float(v)
    return {'err': err, 'f_equal': bool(np.abs(f - fe).max() < 1e-9), 'h_equal': bool(np.abs(h - he).max() < 1e-9), 'f': f, 'h': h, 'B': B, 'g': g, 'L': L}
def constant_connection_check(n):
    r = lie_check(n); f, h, B = r['f'], r['h'], r['B']; G = len(B); worst = 0.
    om = rng.normal(size=(G, n))                                             # omega^A_mu constants (d omega = 0)
    R = np.zeros((G, n, n))
    for A in range(G):
        for C in range(G):
            for D in range(G):
                R[D] += 0.25 * f[A, C, D] * (np.outer(om[A], om[C]) - np.outer(om[C], om[A]))        # R^D_{mu nu} = (1/4) f_AC^D (om^A_mu om^C_nu - om^A_nu om^C_mu)
    V = [h[A].T for A in range(G)]                                           # V_A[c, b] = h_Ab^c : vector representation of the connection
    for mu in range(n):
        for nu in range(n):
            Om_m = sum(om[A, mu] * V[A] for A in range(G)); Om_n = sum(om[A, nu] * V[A] for A in range(G))
            lhs = Om_m @ Om_n - Om_n @ Om_m; rhs = sum(R[D, mu, nu] * V[D] for D in range(G)); worst = max(worst, float(np.abs(lhs - rhs).max()))
            Dm = sum(0.5 * om[A, mu] * B[A] for A in range(G)); Dn = sum(0.5 * om[A, nu] * B[A] for A in range(G))
            lhs = Dm @ Dn - Dn @ Dm; rhs = sum(0.5 * R[D, mu, nu] * B[D] for D in range(G)); worst = max(worst, float(np.abs(lhs - rhs).max()))
    return worst

# ---------------------------------------------------------------------------------------- (3) algebraic curvature tensors
def curvature_space(n, with_bianchi=True):
    eta = np.diag([1.] + [-1.] * (n - 1)); pairs = list(itertools.combinations(range(n), 2)); P = len(pairs); pidx = {p: i for i, p in enumerate(pairs)}; N = P * P
    def var(a, b, c, d):
        if a == b or c == d: return None
        s = 1
        if a > b: a, b = b, a; s = -s
        if c > d: c, d = d, c; s = -s
        return s, pidx[(a, b)] * P + pidx[(c, d)]
    rows = []
    if with_bianchi:
        for a in range(n):
            for tri in itertools.combinations(range(n), 3):
                row = np.zeros(N)
                for (b, c, d) in ((tri[0], tri[1], tri[2]), (tri[1], tri[2], tri[0]), (tri[2], tri[0], tri[1])):
                    v = var(a, b, c, d)
                    if v: row[v[1]] += v[0]
                if row.any(): rows.append(row)
    M = np.array(rows) if rows else np.zeros((0, N)); u, s, vt = np.linalg.svd(M, full_matrices=True) if len(rows) else (None, np.array([]), np.eye(N))
    rk = int((s > 1e-9).sum()); null = vt[rk:]; dim = N - rk
    sym = True; ric_maps = []
    for v in null:
        T = np.zeros((n, n, n, n))
        for a in range(n):
            for b in range(n):
                for c in range(n):
                    for d in range(n):
                        w = var(a, b, c, d)
                        if w: T[a, b, c, d] = w[0] * v[w[1]]
        sym &= bool(np.abs(T - T.transpose(2, 3, 0, 1)).max() < 1e-9)
        ric_maps.append(np.einsum('ac,abcd->bd', np.linalg.inv(eta), T).flatten())
    rr = int(np.linalg.matrix_rank(np.array(ric_maps), tol=1e-8)) if ric_maps else 0
    return {'dimension': dim, 'pair_symmetric': sym, 'ricci_rank': rr, 'weyl_dimension': dim - rr}

# ---------------------------------------------------------------------------------------- (4) Einstein form at e = dx
def perm_sign(seq):
    s = 1; seq = list(seq)
    for i in range(len(seq)):
        for j in range(i + 1, len(seq)):
            if seq[i] > seq[j]: s = -s
    return s
def einstein_ratio(n, trace=0.5, use_ricci=False):
    Rv = np.zeros((n, n, n, n))
    for (b, c) in itertools.combinations(range(n), 2):
        for (d, f) in itertools.combinations(range(n), 2):
            v = float(rng.integers(-4, 5)); Rv[b, c, d, f] = v; Rv[c, b, d, f] = -v; Rv[b, c, f, d] = -v; Rv[c, b, f, d] = v
    Ric = np.einsum('bcce->be', Rv); S = np.trace(Ric); Gt = Ric - (0 if use_ricci else trace * S) * np.eye(n)
    ratios = []
    for a in range(n):
        for mu in range(n):
            # dx^mu ^ E_a  as a multiple of the volume form:  E_a = sum_{b<c} eps_{a b c rest} R^{bc} ^ dx^{rest}
            tot = 0.
            for b, c in itertools.combinations([x for x in range(n) if x != a], 2):
                rest = [x for x in range(n) if x not in (a, b, c)]; eps = perm_sign([a, b, c] + rest)
                for (d, f) in itertools.combinations(range(n), 2):
                    seq = [mu, d, f] + rest
                    if len(set(seq)) == n: tot += eps * Rv[b, c, d, f] * perm_sign(seq)
            if abs(Gt[mu, a]) > 1e-12: ratios.append(tot / Gt[mu, a])
            else:
                if abs(tot) > 1e-9: ratios.append(np.inf)
    return sorted(set(np.round(ratios, 6)))

# ---------------------------------------------------------------------------------------- (5) one more generator
def desitter_check(n, s, flip=False):
    sq = [1] + [-1] * (n - 1) + [s]; g = gammas(sq, n if flip else None); N = n + 1
    pairs = [(a, b) for a in range(N) for b in range(a + 1, N)]; B = algebra_basis(g, sq, pairs); pidx = {p: i for i, p in enumerate(pairs)}
    om = rng.normal(size=(n * (n - 1) // 2, n)); e = rng.normal(size=(n, n)); kappa = 1.3
    Lo = gs.lorentz(n); h = {(A, b): (c, float(v)) for (A, b), (c, v) in Lo.h.items()}
    omega_pairs = [(a, b) for a in range(n) for b in range(a + 1, n)]
    Dm = lambda mu: sum(0.5 * om[A, mu] * B[pidx[omega_pairs[A]]] for A in range(len(omega_pairs))) + sum(0.5 * kappa * e[a, mu] * B[pidx[(a, n)]] for a in range(n))
    ks, mus = set(), set()
    # [D_mu, D_nu] = (1/2) F^{AB}_{mu nu} B_AB  with F^{ab} = R^{ab} + k e^a e^b and F^{an} = mu kappa T^a  (constant fields: R, T from the algebra)
    f = {};
    for (A1, A2), (C, v) in Lo.f.items(): f[(A1, A2)] = (C, v)
    for mu, nu in [(0, 1), (0, 2), (1, 2)] if n >= 3 else [(0, 1)]:
        comm = Dm(mu) @ Dm(nu) - Dm(nu) @ Dm(mu); c, r = express(comm, B); assert r < 1e-9
        Rf = np.zeros(len(omega_pairs))
        for (A1, A2), (C, v) in f.items(): Rf[C] += 0.25 * v * (om[A1, mu] * om[A2, nu] - om[A1, nu] * om[A2, mu])
        T = np.zeros(n)
        for (A, b), (cc, v) in h.items(): T[cc] += v * (om[A, mu] * e[b, nu] - om[A, nu] * e[b, mu])
        for A, (a, b) in enumerate(omega_pairs):
            ee = e[a, mu] * e[b, nu] - e[a, nu] * e[b, mu]; diff = 2 * c[pidx[(a, b)]] - Rf[A]
            if abs(ee) > 1e-9: ks.add(round(diff / ee / kappa ** 2, 6))
            else: assert abs(diff) < 1e-9
        for a in range(n):
            if abs(T[a]) > 1e-9: mus.add(round(2 * c[pidx[(a, n)]] / (kappa * T[a]), 6))
    return ks, mus

def main():
    out = {'structure_constants': {}, 'constant_connection_error': {}, 'curvature_space': {}, 'einstein_ratio': {}, 'desitter': {}, 'controls': {}}
    for n in range(2, 7):
        r = lie_check(n); assert r['err'] < 1e-9 and r['f_equal'] and r['h_equal'], ('structure constants', n, r['err']); out['structure_constants'][str(n)] = 'equal to the bit-rule constants'
        w = constant_connection_check(n); assert w < 1e-9, ('constant connection', n, w); out['constant_connection_error'][str(n)] = 0
    ref = json.load(open(os.path.join(here, 'gravity.json')))
    for n in range(2, 8):
        cs = curvature_space(n); assert cs == ref['curvature_space'][str(n)], (n, cs, ref['curvature_space'][str(n)]); out['curvature_space'][str(n)] = cs
    for n in (3, 4, 5):
        rr = einstein_ratio(n); assert rr == [1.0], (n, rr); out['einstein_ratio'][str(n)] = '1'
    for n in (3, 4, 5):
        for s, name in ((-1, 'dS'), (1, 'AdS')):
            ks, mus = desitter_check(n, s); k = ref['desitter']['%d,%s' % (n, name)] if n in (3, 4) else None
            assert ks == {-float(s)} and mus == {1.0}, (n, s, ks, mus)                       # k = -s kappa^2 / kappa^2 : the constant per unit kappa^2 is -s
            if k: assert float(k['coefficient_of_e_wedge_e']) == -s and float(k['coefficient_of_torsion']) == 1
            out['desitter']['%d,%s' % (n, name)] = {'k': str(int(-s)), 'mu': '1'}
    # negative controls
    assert lie_check(4, wrong=2) is None; out['controls']['wrong_gamma_square'] = 'fails (Clifford relation broken)'
    cs = curvature_space(4, with_bianchi=False); assert cs['dimension'] == 36 and cs['dimension'] != 20 and not cs['pair_symmetric']; out['controls']['first_Bianchi_dropped'] = 'dimension 36 and not pair symmetric (instead of 20)'
    assert len(einstein_ratio(4, use_ricci=True)) > 1; out['controls']['Ricci_instead_of_Einstein'] = 'ratio not constant'
    assert len(einstein_ratio(4, trace=1.0)) > 1; out['controls']['trace_coefficient_1'] = 'ratio not constant'
    ks, mus = desitter_check(4, -1, flip=True); assert ks != {1.0} or mus != {1.0}; out['controls']['extra_square_sign_flipped'] = 'k changes sign'
    out['status'] = 'ALL GRAVITY MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
