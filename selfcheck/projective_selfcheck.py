#!/usr/bin/env python3
"""One more generator, and a null pair: Euclid / elliptic / hyperbolic, Poincare / de Sitter / anti-de Sitter, and the conformal algebra, on the bit rule.
Exact arithmetic, standard library only.  Needs mirrors_selfcheck.py in the same directory (the multivector class and the Cartan-Dieudonne routine).
  python3 projective_selfcheck.py                         run all checks
  python3 projective_selfcheck.py --write projective.json
  python3 projective_selfcheck.py --compare projective.json
Convention of the bit rule: time squares +1, space squares -1.  The base has n axes (all space, or one time and n-1 space).
LADDER.  One more generator e of square s in {0, -1, +1} is added.  The bivectors of the n+1 axes give C(n+1,2) generators for every s:
  [B_an, B_bn] = -2 s B_ab,  B_an^2 = -eta_a s,  and (1/2) of that constant is the coefficient -s of e^e in the curvature (step 7).
  s = 0 is Euclid (space base) or Poincare (Lorentz base); s = -1 is elliptic or de Sitter, s = +1 is hyperbolic or anti-de Sitter.
NULL PAIR.  Add two generators e_p (square -1) and e_m (square +1).  eps = e_p + e_m and o = (e_m - e_p)/2 are null, eps.o = 1,
  P(x) = o + x - (1/2) x^2 eps is null and P(x).P(y) = -(1/2)(x-y)^2.   The generators of the base and eps span the degenerate algebra Cl(n,0,1) (PGA) as a subalgebra.
  A plane is the vector n + delta eps, a sphere is P(c) - (1/2) r^2 eps; reflections in them, and products of two of them, are the Euclidean and the conformal motions.
Checked exactly: the algebra of the ladder (closure, Jacobi, the squares, the Killing form), the contraction to s = 0, the identities of the null pair, PGA as a subalgebra,
translation, rotation, dilation, inversion, plane and sphere reflections as sandwiches, at most n+1 plane mirrors for any isometry of R^n,
the conformal algebra (C(n+2,2) generators, the dilation scales translations and special conformal maps by opposite amounts), and Cl(p+1,q+1) = Cl(p,q) (x) M2(R)
by explicit real matrices up to Cl(4,4) = M16(R)."""
import argparse, json, os, random, sys
from fractions import Fraction as F
from math import comb
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import mirrors_selfcheck as ms
from mirrors_selfcheck import MV, vec, dot, popc, inv_versor, cartan_dieudonne, reflect, matvec

def base_sq(kind, n): return [-1] * n if kind == 'space' else [1] + [-1] * (n - 1)
def gens(N): return [(1 << i) | (1 << j) for i in range(N) for j in range(i + 1, N)]
def blade(sq, m, c=1): return MV(sq, {m: F(c)})
def comm(A, B): return A * B - B * A
def sym(u, v):
    r = (u * v + v * u).scale(F(1, 2)); assert r.is_scalar(), 'the symmetric product of two vectors is a scalar'; return r.d.get(0, F(0))
def in_span(basis, w):
    """is the multivector w in the span of `basis` (exact Gaussian elimination over the masks)?"""
    masks = sorted({m for b in basis for m in b.d} | set(w.d)); rows = [[b.d.get(m, F(0)) for m in masks] for b in basis]
    return ms.rank(rows + [[w.d.get(m, F(0)) for m in masks]]) == ms.rank(rows) if rows else not w.d

# ---------------------------------------------------------------------------------------------------------- the algebra of the bivectors
def algebra(sq):
    """structure constants of the bivector algebra of the generators `sq`: f[(A,B)] = {C: coeff} with [B_A, B_B] = sum f B_C"""
    N = len(sq); G = gens(N); f = {}
    for A in G:
        for B in G:
            c = comm(blade(sq, A), blade(sq, B)); assert all(popc(m) == 2 for m in c.d), 'a commutator of bivectors is a bivector'; f[(A, B)] = dict(c.d)
    return G, f
def jacobi(G, f):
    def br(u, v):
        r = {}
        for a, x in u.items():
            for b, y in v.items():
                for c, z in f[(a, b)].items(): r[c] = r.get(c, 0) + x * y * z
        return {k: v for k, v in r.items() if v}
    for a in G:
        for b in G:
            for c in G:
                t = {}
                for x in (br({a: F(1)}, br({b: F(1)}, {c: F(1)})), br({b: F(1)}, br({c: F(1)}, {a: F(1)})), br({c: F(1)}, br({a: F(1)}, {b: F(1)}))):
                    for k, v in x.items(): t[k] = t.get(k, 0) + v
                if any(t.values()): return False
    return True
def killing(G, f):
    K = {}
    for A in G:
        for B in G:
            K[(A, B)] = sum(f[(A, C)].get(D, 0) * f[(B, D)].get(C, 0) for C in G for D in G)
    return K
def killing_signature(G, f):
    K = killing(G, f); assert all(K[(A, B)] == 0 for A in G for B in G if A != B), 'the Killing form is diagonal on the bivector basis'
    d = [K[(A, A)] for A in G]; return {'positive': sum(1 for x in d if x > 0), 'negative': sum(1 for x in d if x < 0), 'zero': sum(1 for x in d if x == 0)}
def signature_counts(sq): return sum(1 for s in sq if s == 1), sum(1 for s in sq if s == -1)
NAMES = {('space', 0): 'Euclid', ('space', -1): 'elliptic', ('space', 1): 'hyperbolic', ('lorentz', 0): 'Poincare', ('lorentz', -1): 'de Sitter', ('lorentz', 1): 'anti-de Sitter'}

def ladder_check(kind, n, s):
    bs = base_sq(kind, n); sq = bs + [s]; G, f = algebra(sq); N = n + 1; assert len(G) == comb(N, 2)
    assert jacobi(G, f), 'Jacobi identity'
    extra = [m for m in G if m >> n & 1]; sqs = []
    for a in range(n):
        B = blade(sq, (1 << a) | (1 << n)); BB = B * B; assert BB.is_scalar(); v = BB.d.get(0, F(0)); assert v == -bs[a] * s, ('square of B_an', a, v); sqs.append(int(v))
    k_ok = True; coef = None
    for a in range(n):
        for b in range(a + 1, n):
            A, B = (1 << a) | (1 << n), (1 << b) | (1 << n); c = f[(A, B)]
            want = {(1 << a) | (1 << b): F(-2 * s)} if s else {}
            assert c == want, ('[B_an, B_bn]', a, b, c, want); coef = F(-2 * s)
            # the curvature of omega + kappa e: (1/4)(f_AB^C + f_BA^C with the swapped wedge sign) = (1/2) f_AB^C = -s
            if s: assert c[(1 << a) | (1 << b)] / 2 == -s
    sig = killing_signature(G, f); p, q = signature_counts(sq)
    if s:
        assert sig == {'positive': p * q, 'negative': comb(N, 2) - p * q, 'zero': 0}, (kind, n, s, sig, p, q)
    else:
        pb, qb = signature_counts(bs); assert sig == {'positive': pb * qb, 'negative': comb(n, 2) - pb * qb, 'zero': n}, (kind, n, s, sig)
        # the translations are an abelian ideal
        T = extra
        for a in T:
            for b in T: assert not f[(a, b)], 'translations commute'
        for a in G:
            for b in T: assert all(m in T for m in f[(a, b)]), 'translations are an ideal'
    return {'dimension': len(G), 'group': NAMES[(kind, s)], 'extra_squares': sqs, 'commutator_coefficient': str(coef if coef is not None else F(0)), 'curvature_coefficient': str(F(-s)),
            'killing': sig, 'signature_plus_minus': [p, q], 'jacobi': True}
def contraction_check(kind, n):
    """B_an -> lam B_an multiplies the commutator [B_an, B_bn] by lam^2: the constants of s = +-1 tend to those of s = 0 as lam -> 0"""
    bs = base_sq(kind, n)
    for s in (-1, 1):
        sq = bs + [s]; G, f = algebra(sq)
        for lam in (F(1), F(1, 2), F(1, 4)):
            for a in range(n):
                for b in range(a + 1, n):
                    A, B = (1 << a) | (1 << n), (1 << b) | (1 << n); c = f[(A, B)]; scaled = {m: v * lam * lam for m, v in c.items()}
                    assert scaled == {(1 << a) | (1 << b): F(-2 * s) * lam * lam}
    return True

# ---------------------------------------------------------------------------------------------------------- the null pair
def cga(kind, n):
    bs = base_sq(kind, n); sq = bs + [-1, 1]; ep, em = 1 << n, 1 << (n + 1)
    eps = MV(sq, {ep: F(1), em: F(1)}); o = MV(sq, {em: F(1, 2), ep: F(-1, 2)}); return bs, sq, ep, em, eps, o
def point(bs, sq, o, eps, x):
    x2 = dot(bs, x, x); return o + vec(sq, list(x) + [0, 0]) - eps.scale(x2 / 2)
def affine_reflect(bs, nvec, delta, x):
    nn = dot(bs, nvec, nvec); f = 2 * (dot(bs, x, nvec) + delta) / nn; return [xi - f * ni for xi, ni in zip(x, nvec)]
def proportional_point(bs, sq, o, eps, em, ep, R, x):
    """R is a multivector that should be a multiple of P(x): read x back from it"""
    co = R.d.get(em, F(0)) - R.d.get(ep, F(0))
    if co == 0: return None
    xs = [R.d.get(1 << i, F(0)) / co for i in range(len(bs))]; return xs, R == point(bs, sq, o, eps, xs).scale(co)
def randpoint(rng, n): return [F(rng.randint(-4, 4), rng.randint(1, 3)) for _ in range(n)]

def null_pair_checks(kind, n, seed):
    bs, sq, ep, em, eps, o = cga(kind, n); rng = random.Random(seed)
    assert (eps * eps).d == {} and (o * o).d == {} and sym(eps, o) == 1, 'eps and o are null, eps.o = 1'
    for i in range(n): assert sym(vec(sq, [1 if j == i else 0 for j in range(n + 2)]), eps) == 0 and sym(vec(sq, [1 if j == i else 0 for j in range(n + 2)]), o) == 0
    out = {}
    pts = 0
    for _ in range(12):
        x, y = randpoint(rng, n), randpoint(rng, n); P, Q = point(bs, sq, o, eps, x), point(bs, sq, o, eps, y)
        assert (P * P).d == {}, 'P(x) is null'; d = [a - b for a, b in zip(x, y)]; assert sym(P, Q) == -F(1, 2) * dot(bs, d, d), 'P(x).P(y) = -(1/2)(x-y)^2'; pts += 1
    out['points_tested'] = pts
    # translation: T = 1 + c t eps, T P(x) T^-1 = P(x + t) for exactly one sign of c
    good = []
    for c in (F(1, 2), F(-1, 2)):
        ok = True
        for _ in range(8):
            x, t = randpoint(rng, n), randpoint(rng, n); T = MV(sq, {0: F(1)}) + (vec(sq, t + [0, 0]) * eps).scale(c); Ti = MV(sq, {0: F(1)}) - (vec(sq, t + [0, 0]) * eps).scale(c)
            if T * point(bs, sq, o, eps, x) * Ti != point(bs, sq, o, eps, [a + b for a, b in zip(x, t)]): ok = False
        if ok: good.append(c)
    assert good == [F(1, 2)], good; out['translation'] = 'T = 1 + (1/2) t eps'
    # rotation: R = a b, two mirrors of the base, fixes o and eps and sends P(x) to P(R x)
    for _ in range(8):
        a, b = ms.rand_vec(rng, bs), ms.rand_vec(rng, bs); R = vec(sq, a + [0, 0]) * vec(sq, b + [0, 0]); Ri = inv_versor(R); x = randpoint(rng, n)
        assert R * o * Ri == o and R * eps * Ri == eps
        assert R * point(bs, sq, o, eps, x) * Ri == point(bs, sq, o, eps, reflect(bs, a, reflect(bs, b, x)))
    out['rotation'] = 'two mirrors of the base fix o and eps'
    # dilation: V = 1 + u e_p e_m is a hyperbolic rotation in the plane of the null pair
    mus = set()
    for u in (F(1, 3), F(1, 2), F(-1, 5)):
        V = MV(sq, {0: F(1)}) + blade(sq, ep | em, u); Vi = inv_versor(V)
        for _ in range(4):
            x = randpoint(rng, n)
            if all(c == 0 for c in x): continue
            R = V * point(bs, sq, o, eps, x) * Vi; xs, okp = proportional_point(bs, sq, o, eps, em, ep, R, x); assert okp
            mu = next((xs[i] / x[i] for i in range(n) if x[i]), None); assert all(xs[i] == mu * x[i] for i in range(n)); mus.add((u, mu))
        assert any(m in ((1 + u) / (1 - u), (1 - u) / (1 + u)) for uu, m in mus if uu == u), 'the scale factor is (1+u)/(1-u) or its inverse'
    out['dilation'] = 'V = 1 + u e_p e_m scales x by (1-u)/(1+u) or its inverse'
    # inversion: a sphere is the vector P(c) - (1/2) r^2 eps, with square -r^2; the reflection in it is the inversion
    for _ in range(8):
        c, r2 = randpoint(rng, n), F(rng.randint(1, 9), rng.randint(1, 3)); S = point(bs, sq, o, eps, c) - eps.scale(r2 / 2); assert S * S == MV(sq, {0: -r2}); Si = inv_versor(S)
        x = randpoint(rng, n); d = [a - b for a, b in zip(x, c)]; dd = dot(bs, d, d)
        if dd == 0: continue
        R = (S * point(bs, sq, o, eps, x) * Si).scale(-1); xs, okp = proportional_point(bs, sq, o, eps, em, ep, R, x); assert okp
        want = [ci - r2 * di / dd for ci, di in zip(c, d)]; assert xs == want, 'the reflection in the sphere is the inversion'
    # a point on the sphere lies on it: P(x).S = 0 for x = c + r e (a space axis); and the sphere through infinity is a plane
    r = F(5); c = [F(0)] * n; S = point(bs, sq, o, eps, c) - eps.scale(r * r / 2); x = [F(0)] * n; x[n - 1] = r; assert sym(point(bs, sq, o, eps, x), S) == 0
    out['inversion'] = 'sphere reflection = inversion x -> c - r^2 (x-c)/(x-c)^2'
    # a plane is n + delta eps (no o component): P(x).pi = x.n + delta and the reflection is the affine reflection
    for _ in range(10):
        nv = ms.rand_vec(rng, bs); dl = F(rng.randint(-5, 5), rng.randint(1, 3)); pi = vec(sq, nv + [0, 0]) + eps.scale(dl); x = randpoint(rng, n)
        assert sym(point(bs, sq, o, eps, x), pi) == dot(bs, x, nv) + dl
        R = (pi * point(bs, sq, o, eps, x) * inv_versor(pi)).scale(-1); xs, okp = proportional_point(bs, sq, o, eps, em, ep, R, x); assert okp and xs == affine_reflect(bs, nv, dl, x)
    out['plane'] = 'plane vector n + delta eps; its mirror is the affine reflection'
    # two parallel planes are a translation, two concentric spheres a dilation, two planes through the origin a rotation (the rotation case is above)
    for _ in range(6):
        nv = ms.rand_vec(rng, bs); d1, d2 = F(rng.randint(-4, 4)), F(rng.randint(-4, 4)); nn = dot(bs, nv, nv)
        if d1 == d2: continue
        PP = (vec(sq, nv + [0, 0]) + eps.scale(d1)) * (vec(sq, nv + [0, 0]) + eps.scale(d2)); t = [2 * (d2 - d1) / nn * c for c in nv]
        assert PP == (MV(sq, {0: F(1)}) + (vec(sq, t + [0, 0]) * eps).scale(F(1, 2))).scale(nn), 'two parallel planes are a translation'
    for _ in range(6):
        r1, r2 = F(rng.randint(1, 9)), F(rng.randint(1, 9))
        if r1 == r2: continue
        SS = (o - eps.scale(r1 / 2)) * (o - eps.scale(r2 / 2)); u = (r1 - r2) / (r1 + r2)       # r1, r2 are the squared radii
        assert SS == (MV(sq, {0: F(1)}) + blade(sq, ep | em, u)).scale(-(r1 + r2) / 2), 'two concentric spheres are a dilation'
    out['translation_is_two_parallel_planes'] = True; out['dilation_is_two_concentric_spheres'] = True
    # a mirror in a null vector is not defined: eps.eps = 0
    assert sym(eps, eps) == 0 and sym(o, o) == 0
    return out

def motors_checks(kind, n, seed):
    """a product of k plane mirrors acts on points by the twisted sandwich; k = 1..4; the composition of the affine reflections is an isometry of determinant (-1)^k;
    every isometry of R^n is at most n+1 plane mirrors (one to bring the origin home, then Cartan-Dieudonne)"""
    bs, sq, ep, em, eps, o = cga(kind, n); rng = random.Random(seed); hist = {}; planes_used = {}
    def rand_plane():
        while True:
            nv = ms.rand_vec(rng, bs); dl = F(rng.randint(-4, 4), rng.randint(1, 2)); return nv, dl
    for trial in range(30):
        k = rng.randint(1, 2 * n + 2); pl = [rand_plane() for _ in range(k)]; V = MV(sq, {0: F(1)})
        for nv, dl in pl: V = V * (vec(sq, nv + [0, 0]) + eps.scale(dl))
        Vi = inv_versor(V); x = randpoint(rng, n); y = randpoint(rng, n)
        def run(z):
            for nv, dl in reversed(pl): z = affine_reflect(bs, nv, dl, z)
            return z
        R = (V * point(bs, sq, o, eps, x) * Vi).scale(-1 if k % 2 else 1); xs, okp = proportional_point(bs, sq, o, eps, em, ep, R, x); assert okp and xs == run(x), 'twisted sandwich of the plane versor'
        d1 = [a - b for a, b in zip(x, y)]; d2 = [a - b for a, b in zip(run(x), run(y))]; assert dot(bs, d1, d1) == dot(bs, d2, d2), 'isometry'
        hist[k] = hist.get(k, 0) + 1
        # reduction of the isometry A(z) = run(z)
        t = run([F(0)] * n); lin = [[run([F(1) if i == j else F(0) for i in range(n)])[r] - t[r] for j in range(n)] for r in range(n)]
        if dot(bs, t, t) == 0 and any(t): continue                      # t null: skipped, the map is still a product of planes but the first plane would be null
        mirrors = []
        if any(t): mirrors.append((t, -dot(bs, t, t) / 2))
        def A(z): return [sum(lin[r][j] * z[j] for j in range(n)) + t[r] for r in range(n)]
        cur = A
        def A1(z):
            if not mirrors: return A(z)
            nv, dl = mirrors[0]; return affine_reflect(bs, nv, dl, A(z))
        assert A1([F(0)] * n) == [F(0)] * n, 'the first plane brings the origin home'
        lin1 = [[A1([F(1) if i == j else F(0) for i in range(n)])[r] for j in range(n)] for r in range(n)]
        rs = cartan_dieudonne(bs, lin1, rng); allp = mirrors + [(a, F(0)) for a in rs]; assert len(allp) <= n + 1, 'at most n + 1 plane mirrors'
        z = randpoint(rng, n)
        w = z[:]
        for nv, dl in reversed(allp): w = affine_reflect(bs, nv, dl, w)
        assert w == A(z), 'the reduced plane mirrors multiply to the same isometry'
        planes_used[len(allp)] = planes_used.get(len(allp), 0) + 1
    assert max(planes_used) <= n + 1
    return {'products_tested': sum(hist.values()), 'mirrors_in_product': {str(k): hist[k] for k in sorted(hist)}, 'plane_mirrors_after_reduction': {str(k): planes_used[k] for k in sorted(planes_used)}, 'at_most_n_plus_1': True}

def pga_inside_cga(kind, n):
    """the generators of the base and eps span the degenerate algebra Cl(n,0,1): the map e_S -> e_S, e_S e_0 -> e_S eps is an injective algebra homomorphism"""
    bs, sq, ep, em, eps, o = cga(kind, n); psq = bs + [0]
    def phi(X):
        r = MV(sq)
        for m, c in X.d.items():
            if m >> n & 1: S = m & ((1 << n) - 1); r = r + (MV(sq, {S: c}) * eps)
            else: r = r + MV(sq, {m: c})
        return r
    masks = list(range(1 << (n + 1))); tested = 0
    for a in masks:
        for b in masks:
            X, Y = blade(psq, a), blade(psq, b); assert phi(X * Y) == phi(X) * phi(Y), ('homomorphism', a, b); tested += 1
    # injective: distinct masks go to linearly independent elements
    imgs = [phi(blade(psq, m)) for m in masks]; keys = sorted({k for i in imgs for k in i.d}); assert ms.rank([[i.d.get(k, F(0)) for k in keys] for i in imgs]) == len(masks)
    return {'pga_dimension': 1 << (n + 1), 'cga_dimension': 1 << (n + 2), 'products_tested': tested, 'injective': True, 'homomorphism': True}

def conformal_algebra(kind, n):
    bs, sq, ep, em, eps, o = cga(kind, n); N = n + 2; G, f = algebra(sq); assert len(G) == comb(N, 2) and jacobi(G, f)
    e = lambda i: blade(sq, 1 << i); D = (eps * o - o * eps).scale(F(1, 2)); assert D.grades() == {2}
    B = [e(i) * e(j) for i in range(n) for j in range(i + 1, n)]; Tt = [e(i) * eps for i in range(n)]; Kk = [e(i) * o for i in range(n)]; basis = B + Tt + Kk + [D]
    assert len(basis) == comb(N, 2) and ms.rank([[b.d.get(m, F(0)) for m in G] for b in basis]) == len(G), 'the C(n+2,2) generators are independent and span the bivectors'
    for X in basis:
        for Y in basis: assert in_span(basis, comm(X, Y)), 'closure'
    lamT = lamK = None
    for i in range(n):
        c = comm(D, Tt[i]); m0 = next(iter(Tt[i].d)); lamT = c.d.get(m0, F(0)) / Tt[i].d[m0]; assert c == Tt[i].scale(lamT)
        c = comm(D, Kk[i]); m0 = next(iter(Kk[i].d)); lamK = c.d.get(m0, F(0)) / Kk[i].d[m0]; assert c == Kk[i].scale(lamK)
    for X in B: assert not comm(D, X).d, 'D commutes with the rotations'
    for X in Tt:
        for Y in Tt: assert not comm(X, Y).d
    for X in Kk:
        for Y in Kk: assert not comm(X, Y).d
    assert lamT == -lamK and abs(lamT) == 2, (lamT, lamK)
    for X in Tt:
        for Y in Kk: assert in_span(B + [D], comm(X, Y)), 'T and K give rotations and a dilation'
    sig = killing_signature(G, f); p, q = signature_counts(sq); assert sig == {'positive': p * q, 'negative': comb(N, 2) - p * q, 'zero': 0}
    # the Euclidean (Poincare) subalgebra: rotations and translations close and have C(n+1,2) generators
    sub = B + Tt; assert all(in_span(sub, comm(X, Y)) for X in sub for Y in sub) and len(sub) == comb(n + 1, 2)
    return {'generators': comb(N, 2), 'rotations': len(B), 'translations': n, 'special_conformal': n, 'dilation': 1, 'dilation_eigenvalue_on_T': str(lamT), 'dilation_eigenvalue_on_K': str(lamK),
            'killing': sig, 'euclid_subalgebra': comb(n + 1, 2), 'jacobi': True}

# ---------------------------------------------------------------------------------------------------------- Cl(p+1,q+1) = Cl(p,q) (x) M2(R)
def kron(A, B): return [[A[i // len(B)][j // len(B[0])] * B[i % len(B)][j % len(B[0])] for j in range(len(A[0]) * len(B[0]))] for i in range(len(A) * len(B))]
def mmul(A, B): return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]
def madd(A, B): return [[a + b for a, b in zip(r, s)] for r, s in zip(A, B)]
def mneg(A): return [[-a for a in r] for r in A]
def ident(d): return [[int(i == j) for j in range(d)] for i in range(d)]
def doubling(k_max, prime=1000003):
    SZ, SX, J = [[1, 0], [0, -1]], [[0, 1], [1, 0]], [[0, 1], [-1, 0]]; gens_ = []; sq = []; out = {}
    for k in range(1, k_max + 1):
        d = len(gens_[0]) if gens_ else 1
        gens_ = [kron(g, SZ) for g in gens_] + [kron(ident(d), SX), kron(ident(d), J)]; sq = sq + [1, -1]
        d2 = len(gens_[0])
        for i, g in enumerate(gens_):
            assert mmul(g, g) == [[sq[i] * int(a == b) for b in range(d2)] for a in range(d2)], 'squares'
            for j in range(i + 1, len(gens_)): assert madd(mmul(g, gens_[j]), mmul(gens_[j], g)) == [[0] * d2 for _ in range(d2)], 'anticommute'
        prods = []
        for m in range(1 << len(gens_)):
            P = ident(d2)
            for i in range(len(gens_)):
                if m >> i & 1: P = mmul(P, gens_[i])
            prods.append([x % prime for r in P for x in r])
        rows = prods; rk = 0
        for c in range(d2 * d2):
            p = next((i for i in range(rk, len(rows)) if rows[i][c]), None)
            if p is None: continue
            rows[rk], rows[p] = rows[p], rows[rk]; inv = pow(rows[rk][c], prime - 2, prime); rows[rk] = [x * inv % prime for x in rows[rk]]
            for i in range(len(rows)):
                if i != rk and rows[i][c]:
                    f_ = rows[i][c]; rows[i] = [(x - f_ * y) % prime for x, y in zip(rows[i], rows[rk])]
            rk += 1
        assert rk == d2 * d2 == 1 << (2 * k), ('the products of the generators are not a basis of the matrices', k, rk)
        out['%d,%d' % (k, k)] = {'matrix_size': d2, 'algebra_dimension': 1 << (2 * k), 'is_full_matrix_algebra_over_R': True}
    return out

def counts(n):
    return {'ladder_generators': comb(n + 1, 2), 'conformal_generators': comb(n + 2, 2), 'pga_dimension': 1 << (n + 1), 'cga_dimension': 1 << (n + 2), 'euclid_generators': comb(n + 1, 2),
            'rotations': comb(n, 2), 'planes_to_move_a_point': n + 1}

def build():
    out = {'ladder': {}, 'contraction': {}, 'null_pair': {}, 'motors': {}, 'pga': {}, 'conformal': {}, 'doubling': {}, 'counts': {}, 'status': {}}
    for kind in ('space', 'lorentz'):
        for n in range(2, 7):
            for s in (0, -1, 1): out['ladder']['%s,%d,%d' % (kind, n, s)] = ladder_check(kind, n, s)
            out['contraction']['%s,%d' % (kind, n)] = contraction_check(kind, n)
        for n in range(2, 5):
            out['null_pair']['%s,%d' % (kind, n)] = null_pair_checks(kind, n, 31 * n + (7 if kind == 'lorentz' else 0))
            out['pga']['%s,%d' % (kind, n)] = pga_inside_cga(kind, n) if n <= 3 else {'skipped': 'n <= 3 only'}
            out['conformal']['%s,%d' % (kind, n)] = conformal_algebra(kind, n)
        for n in range(2, 4): out['motors']['%s,%d' % (kind, n)] = motors_checks(kind, n, 400 + n + (9 if kind == 'lorentz' else 0))
    out['doubling'] = doubling(4)
    for n in range(2, 9): out['counts'][str(n)] = counts(n)
    out['status'] = {
        'checked': ['one more generator of square s = 0, -1, +1: C(n+1,2) generators, [B_an, B_bn] = -2 s B_ab, B_an^2 = -eta_a s, Jacobi, the Killing form (its sign counts equal the product of the numbers of +1 and -1 axes; degenerate exactly on the n translations for s = 0), the contraction to s = 0; both bases, n = 2 to 6',
                    'the null pair eps = e_p + e_m, o = (e_m - e_p)/2: eps and o null, eps.o = 1, P(x) null, P(x).P(y) = -(1/2)(x-y)^2; translation, rotation, dilation and inversion as sandwiches; planes n + delta eps and spheres P(c) - (1/2) r^2 eps; two parallel planes are a translation, two planes through the origin a rotation, two concentric spheres a dilation, one sphere an inversion; both bases, n = 2 to 4',
                    'the generators of the base and eps span the degenerate algebra Cl(n,0,1) as a subalgebra: an injective algebra homomorphism, all pairs of basis elements, n = 2, 3',
                    'products of up to 2n+2 plane mirrors act on points by the twisted sandwich as isometries; every isometry of R^n is at most n+1 plane mirrors (one brings the origin home, then Cartan-Dieudonne); n = 2, 3',
                    'the conformal algebra: C(n+2,2) generators, closure, Killing signature, the dilation scales translations and special conformal maps by opposite eigenvalues of absolute value 2, the translations and rotations close with C(n+1,2) generators; n = 2 to 4',
                    'Cl(p+1,q+1) = Cl(p,q) (x) M2(R) by explicit real matrices: Cl(k,k) is the full matrix algebra of size 2^k, k = 1 to 4, so four pairs give M16(R) (rank modulo a prime, a lower bound for the rank over the rationals)'],
        'standard': ['PGA and CGA, the Cayley-Klein geometries (Euclid, elliptic, hyperbolic; Poincare, de Sitter, anti-de Sitter), the conformal group SO(p+1,q+1), Cl(p+1,q+1) = Cl(p,q) (x) M2(R)'],
        'ours': ['reading the extra generator and the null pair as one or two more bits of the cube: the three squares s of one extra bit, and the pair of bits (-1, +1) that doubles the algebra'],
        'open': ['dynamics: force and forque, Newton-Euler equations, are the next step; that the equations of motion coincide in the three PGAs is stated in the source we read (citing Gunn) and is not re-derived here',
                 'conformal dynamics is not developed in the source we read, and not here',
                 'whether any of this has a physical role in the model; nothing here selects three generations']}
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    data = build(); js = json.dumps(data, sort_keys=True, indent=1)
    if a.write: open(a.write, 'w').write(js + '\n')
    if a.compare:
        old = json.load(open(a.compare)); assert old == json.loads(js), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL PROJECTIVE CHECKS PASS')
if __name__ == '__main__': main()
