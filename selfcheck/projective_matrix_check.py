#!/usr/bin/env python3
"""Independent cross-check of the projective / conformal step with explicit matrices (numpy).
  python3 projective_matrix_check.py [--write projective_matrix.json] [--compare projective_matrix.json]
Nothing here uses the bit-mask products: the generators are Jordan-Wigner gamma matrices (signature: time +1, space -1; the null pair is e_p with square -1 and e_m with square +1),
eps = g_p + g_m and o = (g_m - g_p)/2 are matrices, a point is the matrix P(x) = o + x - (1/2) x^2 eps, a plane n + delta eps, a sphere P(c) - (1/2) r^2 eps.
Checks (floating point, tolerance 1e-9), base space (all -1) and Lorentz (+1, -1, ...), n = 2 to 4:
  (1) eps and o are nilpotent (null), eps o + o eps = 2, and both anticommute with the base gammas
  (2) P(x) is null and P(x) P(y) + P(y) P(x) = -(x-y)^2
  (3) translation 1 + (1/2) t eps, rotation by two base mirrors, dilation 1 + u g_p g_m, inversion (reflection in a sphere), plane reflection: each sends P(x) to the expected point (up to scale)
  (4) the extra generator of square s: the matrices B_an = g_a g_n satisfy [B_an, B_bn] = -2 s B_ab for s = +1 (g_m), s = -1 (g_p), and = 0 for s = 0 (g_n = eps, a nilpotent matrix, no inverse)
  (5) PGA: the 2^(n+1) products of the base gammas and eps are linearly independent matrices (the degenerate algebra is represented faithfully)
  (6) the conformal algebra spanned by rotations, translations g_i eps, special conformal g_i o and the dilation (eps o - o eps)/2 closes under the commutator, and its Killing form has
      (number of +1 axes)(number of -1 axes) positive eigenvalues
negative controls that must fail: P(x) with the opposite sign of the x^2 term is not null; the same sign convention with o replaced by -o; a translation with the coefficient 1 instead of 1/2;
e_p and e_m both of square -1 (eps is then not null); a reflection in eps (a null vector, the matrix is singular, no inverse)."""
import sys, json, os
import numpy as np
rng = np.random.default_rng(20261012)
TOL = 1e-9

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
def gammas(sq):
    e = euclid_gens(len(sq)); return [e[i] if s == 1 else 1j * e[i] for i, s in enumerate(sq)]
def base_sq(kind, n): return [-1] * n if kind == 'space' else [1] + [-1] * (n - 1)
def setup(kind, n, pair=(-1, 1)):
    bs = base_sq(kind, n); sq = bs + list(pair); g = gammas(sq); eps = g[n] + g[n + 1]; o = 0.5 * (g[n + 1] - g[n]); return bs, sq, g, eps, o
def vecm(g, bs, x): return sum(c * g[i] for i, c in enumerate(x))
def dotb(bs, x, y): return float(sum(s * a * b for s, a, b in zip(bs, x, y)))
def point(g, bs, eps, o, x, sign=-1): return o + vecm(g, bs, x) + sign * 0.5 * dotb(bs, x, x) * eps
def same_up_to_scale(A, B):
    c = np.vdot(B, A) / np.vdot(B, B); return bool(np.abs(A - c * B).max() < 1e-8 * max(1, np.abs(A).max())) and abs(c) > 1e-9
def householder(bs, a, x):
    return x - 2 * dotb(bs, x, a) / dotb(bs, a, a) * a
def randx(n): return rng.integers(-4, 5, size=n) / rng.integers(1, 4, size=n)
def randnonnull(bs):
    while True:
        a = rng.integers(-3, 4, size=len(bs)).astype(float)
        if a.any() and abs(dotb(bs, a, a)) > 0.5: return a
def comm(A, B): return A @ B - B @ A
def rank(mats): return int(np.linalg.matrix_rank(np.array([m.flatten() for m in mats]), tol=1e-8))

def checks(kind, n):
    bs, sq, g, eps, o = setup(kind, n); I = np.eye(len(eps)); res = {}
    assert np.abs(eps @ eps).max() < TOL and np.abs(o @ o).max() < TOL and np.abs(eps @ o + o @ eps - 2 * I).max() < TOL
    assert all(np.abs(g[i] @ eps + eps @ g[i]).max() < TOL and np.abs(g[i] @ o + o @ g[i]).max() < TOL for i in range(n)); res['null_pair'] = True
    for _ in range(10):
        x, y = randx(n), randx(n); P, Q = point(g, bs, eps, o, x), point(g, bs, eps, o, y); d = x - y
        assert np.abs(P @ P).max() < TOL and np.abs(P @ Q + Q @ P + dotb(bs, d, d) * I).max() < 1e-8
    res['points'] = True
    for _ in range(8):                                                                       # translation
        x, t = randx(n), randx(n); T = I + 0.5 * vecm(g, bs, t) @ eps; Ti = I - 0.5 * vecm(g, bs, t) @ eps
        assert np.abs(T @ point(g, bs, eps, o, x) @ Ti - point(g, bs, eps, o, x + t)).max() < 1e-8
    res['translation'] = True
    for _ in range(8):                                                                       # rotation: two mirrors
        a, b = randnonnull(bs), randnonnull(bs); R = vecm(g, bs, a) @ vecm(g, bs, b); Ri = np.linalg.inv(R); x = randx(n)
        assert np.abs(R @ point(g, bs, eps, o, x) @ Ri - point(g, bs, eps, o, householder(bs, a, householder(bs, b, x)))).max() < 1e-7
    res['rotation'] = True
    for u in (1 / 3, 0.5, -0.2):                                                             # dilation
        V = I + u * g[n] @ g[n + 1]; Vi = np.linalg.inv(V); x = randx(n)
        if not x.any(): continue
        R = V @ point(g, bs, eps, o, x) @ Vi; found = False
        for mu in ((1 + u) / (1 - u), (1 - u) / (1 + u)):
            if same_up_to_scale(R, point(g, bs, eps, o, mu * x)): found = True
        assert found
    res['dilation'] = True
    for _ in range(8):                                                                       # inversion
        c, r2 = randx(n), float(rng.integers(1, 9)) / float(rng.integers(1, 4)); x = randx(n); d = x - c
        if abs(dotb(bs, d, d)) < 1e-6: continue
        S = point(g, bs, eps, o, c) - 0.5 * r2 * eps; assert np.abs(S @ S + r2 * I).max() < 1e-8
        R = -S @ point(g, bs, eps, o, x) @ np.linalg.inv(S); assert same_up_to_scale(R, point(g, bs, eps, o, c - r2 * d / dotb(bs, d, d)))
    res['inversion'] = True
    for _ in range(8):                                                                       # plane
        nv = randnonnull(bs); dl = float(rng.integers(-5, 6)) / float(rng.integers(1, 4)); x = randx(n); pi = vecm(g, bs, nv) + dl * eps
        R = -pi @ point(g, bs, eps, o, x) @ np.linalg.inv(pi); xr = x - 2 * (dotb(bs, x, nv) + dl) / dotb(bs, nv, nv) * nv; assert same_up_to_scale(R, point(g, bs, eps, o, xr))
    res['plane'] = True
    # PGA is faithfully represented: the 2^(n+1) products of g_0..g_{n-1} and eps are independent
    gens_ = g[:n] + [eps]; prods = []
    for m in range(1 << (n + 1)):
        P = I.copy()
        for i in range(n + 1):
            if m >> i & 1: P = P @ gens_[i]
        prods.append(P)
    assert rank(prods) == 1 << (n + 1); res['pga_rank'] = 1 << (n + 1)
    # the conformal algebra
    rot = [g[i] @ g[j] for i in range(n) for j in range(i + 1, n)]; T = [g[i] @ eps for i in range(n)]; K = [g[i] @ o for i in range(n)]; D = 0.5 * (eps @ o - o @ eps); basis = rot + T + K + [D]
    assert rank(basis) == len(basis) == (n + 2) * (n + 1) // 2
    A = np.array([b.flatten() for b in basis]).T
    def coords(M): c, *_ = np.linalg.lstsq(A, M.flatten(), rcond=None); assert np.abs(A @ c - M.flatten()).max() < 1e-8, 'closure'; return c
    ad = [np.array([coords(comm(X, Y)) for Y in basis]).T for X in basis]                  # ad[X][:, Y] = coordinates of [X, Y]
    Kf = np.array([[np.trace(a @ b).real for b in ad] for a in ad]); ev = np.linalg.eigvalsh((Kf + Kf.T) / 2)
    p, q = sum(1 for s in sq if s == 1), sum(1 for s in sq if s == -1); assert int((ev > 1e-8).sum()) == p * q and int((ev < -1e-8).sum()) == len(basis) - p * q
    res['conformal'] = {'generators': len(basis), 'positive_eigenvalues': p * q}
    return res

def ladder_matrices(kind, n):
    out = {}
    bs = base_sq(kind, n)
    for s in (-1, 1):
        sq = bs + [s]; g = gammas(sq); gn = g[n]
        for a in range(n):
            for b in range(a + 1, n):
                assert np.abs(comm(g[a] @ gn, g[b] @ gn) + 2 * s * g[a] @ g[b]).max() < TOL
        out[str(s)] = True
    _, _, g, eps, o = setup(kind, n)
    for a in range(n):
        for b in range(a + 1, n): assert np.abs(comm(g[a] @ eps, g[b] @ eps)).max() < TOL
        assert np.abs((g[a] @ eps) @ (g[a] @ eps)).max() < TOL
    assert np.linalg.matrix_rank(eps, tol=1e-8) < len(eps)                                   # the null generator has no inverse
    out['0'] = True; return out

def main():
    out = {'checks': {}, 'ladder': {}, 'controls': {}}
    for kind in ('space', 'lorentz'):
        for n in range(2, 5): out['checks']['%s,%d' % (kind, n)] = checks(kind, n)
        for n in range(2, 6): out['ladder']['%s,%d' % (kind, n)] = ladder_matrices(kind, n)
    kind, n = 'lorentz', 3; bs, sq, g, eps, o = setup(kind, n); I = np.eye(len(eps)); x = randx(n)
    assert np.abs(point(g, bs, eps, o, x, sign=+1) @ point(g, bs, eps, o, x, sign=+1)).max() > 1e-3; out['controls']['opposite_sign_of_x2_term'] = 'P(x) is not null'
    assert np.abs(point(g, bs, eps, -o, x) @ point(g, bs, eps, -o, x)).max() > 1e-3; out['controls']['o_replaced_by_minus_o'] = 'P(x) is not null'
    t = randx(n); T = I + vecm(g, bs, t) @ eps; assert np.abs(T @ point(g, bs, eps, o, x) @ np.linalg.inv(T) - point(g, bs, eps, o, x + t)).max() > 1e-3; out['controls']['translation_coefficient_1'] = 'moves the point to the wrong place'
    bs2, sq2, g2, eps2, o2 = setup(kind, n, pair=(-1, -1)); assert np.abs(eps2 @ eps2).max() > 1e-3; out['controls']['pair_of_equal_signs'] = 'eps is not null'
    assert np.linalg.matrix_rank(eps, tol=1e-8) < len(eps); out['controls']['reflection_in_a_null_vector'] = 'the matrix of eps is singular: no inverse, no mirror'
    out['status'] = 'ALL PROJECTIVE MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
