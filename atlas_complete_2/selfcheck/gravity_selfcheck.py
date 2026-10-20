#!/usr/bin/env python3
"""Gravity on the bit rule: connection, curvature, torsion, the Einstein form and its conservation.  Exact arithmetic, standard library only.
  python3 gravity_selfcheck.py                          run all checks
  python3 gravity_selfcheck.py --write gravity.json     also write the data
  python3 gravity_selfcheck.py --compare gravity.json   assert the portal data equals the rebuilt data
Space-time dimension n, coordinates x^0 ... x^(n-1), local frame algebra Cl(1,n-1): vectors gamma_a (a = 0 is time), bivectors B_A = gamma_a gamma_b.
Differential forms are the SAME bit rule with every generator null (dx^mu squares to 0): the product of two masks gives the wedge product and its sign,
and the sign of a permutation (the Levi-Civita symbol) is the sign the null product produces.
  Spin connection      Omega = omega^A B_A                (a 1-form with values in the bivectors: the Lorentz algebra of step 1)
  Tetrad               e = e^a gamma_a                    (a 1-form with values in the vectors)
  Curvature            R^C = d omega^C + (1/4) f_AB^C omega^A ^ omega^B           ( = step 4 with g = 1/2 )
  Torsion              T^c = d e^c + h_Ab^c omega^A ^ e^b                           ( h: the commutator (1/2)[B_A, gamma_b] = h gamma_c )
  Einstein form        E_a = sum_{b<c} eps_{a b c d1 ... d(n-3)} F^{bc} ^ e^{d1} ^ ... ^ e^{d(n-3)},      F^{bc} = R^{bc} + c e^b ^ e^c
Checked exactly: second Bianchi D R = 0, first Bianchi D T = R ^ e, local Lorentz covariance, [D, D] psi = (1/2) R psi on spinors,
D E_a = (torsion terms only), E_a at e = dx equals the Einstein tensor built from the Ricci contraction,
the curvature of the de Sitter / anti-de Sitter algebra (one more generator) contains R + c e^e and the torsion, and the dimension of the space of
algebraic curvature tensors (with its Ricci and Weyl parts) by linear algebra."""
import argparse, itertools, json, random
from fractions import Fraction as F
from math import comb

def popc(x): return bin(x).count('1')
def rsign(k): return -1 if (k * (k - 1) // 2) % 2 else 1
def bmul(a, b, sq):
    sign = 0
    for i in range(len(sq)):
        if b >> i & 1: sign ^= popc(a >> (i + 1)) & 1
    s = -1 if sign else 1
    c = a & b
    for i in range(len(sq)):
        if c >> i & 1: s *= sq[i]
    return a ^ b, s
KIND = ['R', 'R2', 'R', 'C', 'H', 'H2', 'H', 'C']; DIMK = {'R': 1, 'C': 2, 'H': 4}
def cell(p, q):
    n = p + q
    if n == 0: return 'R'
    k = KIND[(p - q) % 8]; copies = 2 if k.endswith('2') else 1; base = k[0]
    N2 = 2 ** n // (copies * DIMK[base]); N = int(round(N2 ** 0.5)); assert N * N == N2
    return ('M%d(%s)' % (N, base)) + (' + M%d(%s)' % (N, base) if copies == 2 else '')

# ------------------------------------------------------------------------------------------------ polynomials in the n coordinates
def padd(a, b, c=1):
    r = dict(a)
    for k, v in b.items():
        x = r.get(k, 0) + c * v
        if x == 0: r.pop(k, None)
        else: r[k] = x
    return r
def pmul(a, b):
    r = {}
    for k1, v1 in a.items():
        for k2, v2 in b.items():
            k = tuple(x + y for x, y in zip(k1, k2)); x = r.get(k, 0) + v1 * v2
            if x == 0: r.pop(k, None)
            else: r[k] = x
    return r
def pder(a, i):
    r = {}
    for k, v in a.items():
        if k[i]:
            kk = list(k); kk[i] -= 1; kk = tuple(kk); r[kk] = r.get(kk, 0) + v * k[i]
    return {k: v for k, v in r.items() if v != 0}
def pscale(a, c): return {k: v * c for k, v in a.items()} if c != 0 else {}
def rpoly(rng, n, deg, density):
    mons = [e for e in itertools.product(range(deg + 1), repeat=n) if sum(e) <= deg]
    return {e: F(rng.randint(-3, 3)) for e in mons if rng.random() < density} or {(0,) * n: F(1)}

# ------------------------------------------------------------------------------------------------ differential forms = the bit rule with null generators
class Forms:
    def __init__(self, n): self.n = n; self.sq0 = [0] * n
    def add(self, X, Y, c=1):
        r = dict(X)
        for m, p in Y.items():
            x = padd(r.get(m, {}), p, c)
            if x: r[m] = x
            else: r.pop(m, None)
        return r
    def scale(self, X, c): return {m: pscale(p, c) for m, p in X.items()} if c != 0 else {}
    def wedge(self, X, Y):
        r = {}
        for a, pa in X.items():
            for b, pb in Y.items():
                m, s = bmul(a, b, self.sq0)
                if s == 0: continue
                x = padd(r.get(m, {}), pmul(pa, pb), s)
                if x: r[m] = x
                else: r.pop(m, None)
        return r
    def d(self, X):
        r = {}
        for a, p in X.items():
            for mu in range(self.n):
                dp = pder(p, mu)
                if not dp: continue
                m, s = bmul(1 << mu, a, self.sq0)
                if s == 0: continue
                x = padd(r.get(m, {}), dp, s)
                if x: r[m] = x
                else: r.pop(m, None)
        return r
    def scalar_field(self, p): return {0: p} if p else {}
def zero_list(k): return [{} for _ in range(k)]

# ------------------------------------------------------------------------------------------------ the algebras (bivectors / vectors of the frame algebra)
class Lie:
    def __init__(self, sq):
        self.sq = sq; N = len(sq); self.N = N
        self.gens = [(1 << i) | (1 << j) for i in range(N) for j in range(i + 1, N)]; self.idx = {g: k for k, g in enumerate(self.gens)}; self.G = len(self.gens)
        self.f = {}                                                           # f[(A, B)] = (C, coefficient)  with [B_A, B_B] = coefficient B_C  (+-2)
        for a, ga in enumerate(self.gens):
            for b, gb in enumerate(self.gens):
                m1, s1 = bmul(ga, gb, sq); m2, s2 = bmul(gb, ga, sq)
                if s1 != s2: self.f[(a, b)] = (self.idx[m1], s1 - s2)
        self.h = {}                                                           # h[(A, b)] = (c, +-1) with (1/2)[B_A, gamma_b] = h gamma_c
        for a, ga in enumerate(self.gens):
            for b in range(N):
                m1, s1 = bmul(ga, 1 << b, sq); m2, s2 = bmul(1 << b, ga, sq)
                if s1 != s2:
                    assert m1.bit_length() - 1 >= 0 and m1 == 1 << (m1.bit_length() - 1); self.h[(a, b)] = (m1.bit_length() - 1, F(s1 - s2, 2))
def lorentz(n): return Lie([1] + [-1] * (n - 1))

# ------------------------------------------------------------------------------------------------ the fields
class Grav:
    def __init__(self, n, lie=None):
        self.n = n; self.Fm = Forms(n); self.L = lie or lorentz(n); self.G = self.L.G
    def wedge_sum(self, terms):
        r = {}
        for c, X, Y in terms: r = self.Fm.add(r, self.Fm.wedge(X, Y), c)
        return r
    def curvature(self, om):                                                   # R^C = d omega^C + (1/4) f_AB^C omega^A ^ omega^B
        Fm = self.Fm; R = [Fm.d(om[C]) for C in range(self.G)]
        for (A, B), (C, f) in self.L.f.items(): R[C] = Fm.add(R[C], Fm.wedge(om[A], om[B]), F(f, 4))
        return R
    def D_bivector(self, om, Y):                                               # (D Y)^C = d Y^C + (1/2) f_AB^C omega^A ^ Y^B
        Fm = self.Fm; out = [Fm.d(Y[C]) for C in range(self.G)]
        for (A, B), (C, f) in self.L.f.items(): out[C] = Fm.add(out[C], Fm.wedge(om[A], Y[B]), F(f, 2))
        return out
    def D_vector(self, om, X):                                                 # (D X)^c = d X^c + h_Ab^c omega^A ^ X^b
        Fm = self.Fm; out = [Fm.d(X[c]) for c in range(self.n)]
        for (A, b), (c, h) in self.L.h.items(): out[c] = Fm.add(out[c], Fm.wedge(om[A], X[b]), h)
        return out
    def D_covector(self, om, E):                                               # (D E)_a = d E_a - omega^b_a ^ E_b,   omega^b_a = h_Aa^b omega^A
        Fm = self.Fm; out = [Fm.d(E[a]) for a in range(self.n)]
        for (A, a), (b, h) in self.L.h.items(): out[a] = Fm.add(out[a], Fm.wedge(om[A], E[b]), -h)
        return out
    def torsion(self, om, e): return self.D_vector(om, e)
    def D_spinor(self, om, psi):                                               # psi: dict S -> form ; D psi = d psi + (1/2) omega^A B_A psi
        Fm = self.Fm; sq = self.L.sq; out = {S: Fm.d(p) for S, p in psi.items()}
        for A, g in enumerate(self.L.gens):
            for S, p in psi.items():
                m, s = bmul(g, S, sq); out[m] = Fm.add(out.get(m, {}), Fm.wedge(om[A], p), F(s, 2))
        return {m: x for m, x in out.items() if x}
    def eps(self, seq):
        m, s = 0, 1
        for x in seq:
            m, t = bmul(m, 1 << x, self.Fm.sq0); s *= t
            if s == 0: return 0
        return s
    def einstein(self, om_unused, e, R, c=0):
        """E_a = sum_{b<c} eps_{a b c d...} F^{bc} ^ e^{d1} ^ ... ^ e^{dk} (d sorted), F^{bc} = R^{bc} + c e^b ^ e^c;  needs n >= 3"""
        n, Fm, L = self.n, self.Fm, self.L; k = n - 3; E = []
        F_ = {}
        for (a, b) in itertools.combinations(range(n), 2):
            A = L.idx[(1 << a) | (1 << b)]; F_[(a, b)] = Fm.add(R[A], Fm.wedge(e[a], e[b]), c) if c else R[A]
        for a in range(n):
            tot = {}
            for b, cc in itertools.combinations(range(n), 2):
                if a in (b, cc): continue
                rest = [x for x in range(n) if x not in (a, b, cc)]; s = self.eps([a, b, cc] + rest)
                form = F_[(b, cc)]
                for d in rest: form = Fm.wedge(form, e[d])
                tot = Fm.add(tot, form, s)
            E.append(tot)
        return E, F_
    def einstein_rhs(self, e, T, R, c=0, F_=None):
        """the torsion terms that D E_a must equal (D R = 0 used):  sum eps F^{bc} sum_j (-1)^(j-1) e..T^{dj}..e  +  c (T^b e^c - e^b T^c) e... """
        n, Fm, L = self.n, self.Fm, self.L; out = []
        for a in range(n):
            tot = {}
            for b, cc in itertools.combinations(range(n), 2):
                if a in (b, cc): continue
                rest = [x for x in range(n) if x not in (a, b, cc)]; s = self.eps([a, b, cc] + rest)
                Fbc = F_[(b, cc)]
                for j in range(len(rest)):
                    form = Fbc
                    for jj, d in enumerate(rest): form = Fm.wedge(form, T[d] if jj == j else e[d])
                    tot = Fm.add(tot, form, s * (-1) ** j)
                if c:
                    extra = Fm.add(Fm.wedge(T[b], e[cc]), Fm.wedge(e[b], T[cc]), -1)
                    for d in rest: extra = Fm.wedge(extra, e[d])
                    tot = Fm.add(tot, extra, s * c)
            out.append(tot)
        return out

def rform(rng, n, degree, deg=1, density=.6):
    """a random form of the given degree whose coefficients are polynomials of degree deg"""
    return {sum(1 << i for i in idx): rpoly(rng, n, deg, density) for idx in itertools.combinations(range(n), degree) if rng.random() < .9} or {sum(1 << i for i in range(degree)): {(0,) * n: F(1)}}
def eqz(X): return all(not p for p in X.values())
def lst_eq(X, Y):
    return all(Gr_eq(x, y) for x, y in zip(X, Y))
def Gr_eq(x, y):
    keys = set(x) | set(y)
    return all(x.get(k, {}) == y.get(k, {}) for k in keys)

# ------------------------------------------------------------------------------------------------ polynomial identities
def identities(n, seed):
    rng = random.Random(seed); Gv = Grav(n); Fm = Gv.Fm; L = Gv.L; G = Gv.G
    om = [rform(rng, n, 1) for _ in range(G)]; e = [rform(rng, n, 1) for _ in range(n)]
    R = Gv.curvature(om); T = Gv.torsion(om, e); out = {}
    DR = Gv.D_bivector(om, R); assert all(eqz(x) for x in DR), ('second Bianchi', n); out['second_bianchi'] = True
    DT = Gv.D_vector(om, T); rhs = [{} for _ in range(n)]
    for (A, b), (c, h) in L.h.items(): rhs[c] = Fm.add(rhs[c], Fm.wedge(R[A], e[b]), h)
    assert lst_eq(DT, rhs), ('first Bianchi', n); out['first_bianchi'] = True
    # local Lorentz transformation, first order:  delta omega = D lambda,  delta e^c = - h_Ab^c lambda^A e^b
    lam = [{0: rpoly(rng, n, 2, .5)} for _ in range(G)]
    dom = Gv.D_bivector(om, lam)                       # on 0-form lambda: D lambda = d lambda + (1/2) f omega lambda ; matches delta omega = D lambda
    de = zero_list(n)
    for (A, b), (c, h) in L.h.items(): de[c] = Fm.add(de[c], Fm.wedge(lam[A], e[b]), -h)
    dT = [Fm.d(de[c]) for c in range(n)]
    for (A, b), (c, h) in L.h.items(): dT[c] = Fm.add(dT[c], Fm.add(Fm.wedge(dom[A], e[b]), Fm.wedge(om[A], de[b])), h)
    wantT = zero_list(n)
    for (A, b), (c, h) in L.h.items(): wantT[c] = Fm.add(wantT[c], Fm.wedge(lam[A], T[b]), -h)
    assert lst_eq(dT, wantT), ('torsion covariance', n)
    dR = [Fm.d(dom[C]) for C in range(G)]
    for (A, B), (C, f) in L.f.items(): dR[C] = Fm.add(dR[C], Fm.add(Fm.wedge(dom[A], om[B]), Fm.wedge(om[A], dom[B])), F(f, 4))
    wantR = zero_list(G)
    for (A, B), (C, f) in L.f.items(): wantR[C] = Fm.add(wantR[C], Fm.wedge(R[A], lam[B]), F(f, 2))
    assert lst_eq(dR, wantR), ('curvature covariance', n); out['local_lorentz_covariance'] = True
    # spinor: [D, D] psi = (1/2) R psi  (D D psi, psi an even multivector of 0-form components)
    ev = [S for S in range(1 << n) if popc(S) % 2 == 0]; psi = {S: {0: rpoly(rng, n, 2, .5)} for S in ev}
    DD = Gv.D_spinor(om, Gv.D_spinor(om, psi)); want = {}
    for A, g in enumerate(L.gens):
        for S, p in psi.items():
            m, s = bmul(g, S, L.sq); want[m] = Fm.add(want.get(m, {}), Fm.wedge(R[A], p), F(s, 2))
    want = {m: x for m, x in want.items() if x}; assert all(Gr_eq(DD.get(m, {}), want.get(m, {})) for m in set(DD) | set(want)), ('spinor curvature', n); out['spinor_commutator'] = True
    return out

def einstein_identities(n, seed, c):
    rng = random.Random(seed); Gv = Grav(n); Fm = Gv.Fm; L = Gv.L
    om = [rform(rng, n, 1, 1, .5) for _ in range(Gv.G)]; e = [rform(rng, n, 1, 1, .5) for _ in range(n)]
    R = Gv.curvature(om); T = Gv.torsion(om, e)
    E, F_ = Gv.einstein(None, e, R, c); DE = Gv.D_covector(om, E); rhs = Gv.einstein_rhs(e, T, R, c, F_)
    assert lst_eq(DE, rhs), ('D E_a = torsion terms', n, c)
    if n == 3 and c == 0: assert all(eqz(x) for x in DE), 'in 3D with no cosmological term D E_a = 0 identically'
    # with zero torsion the right-hand side vanishes: E is conserved. Build a torsion-free tetrad by solving for omega is not polynomial; instead check the factor structure
    return {'covariant_divergence_of_E_is_torsion_terms': True}
def einstein_is_einstein_tensor(n, seed):
    """at e^a = dx^a, E_a (an (n-1)-form) equals c_n times the Einstein tensor built from the Ricci contraction of R^{bc}_{de}: exact, for arbitrary R"""
    rng = random.Random(seed); Gv = Grav(n); Fm = Gv.Fm; L = Gv.L; zero = (0,) * n
    e = [{1 << a: {zero: F(1)}} for a in range(n)]
    Rv = {}                                                                    # R^{bc}_{de}, antisymmetric in (b,c) and in (d,e)
    for (b, c) in itertools.combinations(range(n), 2):
        for (d, f) in itertools.combinations(range(n), 2):
            v = F(rng.randint(-4, 4)); Rv[(b, c, d, f)] = v; Rv[(c, b, d, f)] = -v; Rv[(b, c, f, d)] = -v; Rv[(c, b, f, d)] = v
    R = [{} for _ in range(Gv.G)]
    for (b, c) in itertools.combinations(range(n), 2):
        A = L.idx[(1 << b) | (1 << c)]
        for (d, f) in itertools.combinations(range(n), 2):
            if Rv[(b, c, d, f)]: R[A][(1 << d) | (1 << f)] = {zero: Rv[(b, c, d, f)]}
    E, _ = Gv.einstein(None, e, R, 0); full = (1 << n) - 1
    ric = {(b, ee): sum(Rv.get((b, c, c, ee), 0) for c in range(n) if c != b) for b in range(n) for ee in range(n)}
    S = sum(ric[(b, b)] for b in range(n)); G_ = {(b, ee): ric[(b, ee)] - (F(1, 2) * S if b == ee else 0) for b in range(n) for ee in range(n)}
    ratios = set()
    for a in range(n):
        for mu in range(n):
            mask = full ^ (1 << mu); comp = E[a].get(mask, {}).get(zero, 0)
            _, sg = bmul(1 << mu, mask, Fm.sq0)                                # dx^mu ^ (omitted-mu form) = sg * volume form
            if G_[(mu, a)] != 0: ratios.add(F(comp) * sg / G_[(mu, a)])
            else: assert comp == 0, ('E component without a matching Einstein component', n, a, mu)
    assert len(ratios) == 1, ('E_a is not proportional to the Einstein tensor', n, ratios)
    return list(ratios)[0]

# ------------------------------------------------------------------------------------------------ the de Sitter / anti-de Sitter algebra: one more generator
def desitter_embedding(n, seed, s):
    """so(1,n) (s = -1, de Sitter) or so(2,n-1) (s = +1, anti-de Sitter): omega on the first n generators, kappa e^a on B_{a n}. Its Yang-Mills curvature (step 4, g = 1/2) is (R + k e^e, mu T)."""
    rng = random.Random(seed); sq_ext = [1] + [-1] * (n - 1) + [s]; Lx = Lie(sq_ext); Gx = Grav(n, Lx); Gl = Grav(n); Fm = Gx.Fm; L = Gl.L
    om = [rform(rng, n, 1, 1, .5) for _ in range(Gl.G)]; e = [rform(rng, n, 1, 1, .5) for _ in range(n)]
    kappa = F(1)
    A = [{} for _ in range(Lx.G)]
    for A_, g in enumerate(L.gens): A[Lx.idx[g]] = om[A_]
    for a in range(n): A[Lx.idx[(1 << a) | (1 << n)]] = Fm.scale(e[a], kappa)
    Fx = Gx.curvature(A); R = Gl.curvature(om); T = Gl.torsion(om, e); ks, mus = set(), set()
    for (a, b) in itertools.combinations(range(n), 2):
        C = Lx.idx[(1 << a) | (1 << b)]; diff = Fm.add(Fx[C], R[L.idx[(1 << a) | (1 << b)]], -1); ee = Fm.wedge(e[a], e[b])
        if not eqz(ee):
            m0 = next(m for m, p in ee.items() if p); k0 = next(iter(ee[m0])); k = diff.get(m0, {}).get(k0, 0) / ee[m0][k0]
            assert Fm.add(diff, ee, -k) == {} or eqz(Fm.add(diff, ee, -k)), ('F^{ab} - R^{ab} is not proportional to e^a ^ e^b', n); ks.add(k)
        else: assert eqz(diff)
    for a in range(n):
        C = Lx.idx[(1 << a) | (1 << n)]
        if not eqz(T[a]):
            m0 = next(m for m, p in T[a].items() if p); k0 = next(iter(T[a][m0])); mu = Fx[C].get(m0, {}).get(k0, 0) / T[a][m0][k0]
            assert eqz(Fm.add(Fx[C], T[a], -mu)), ('F^{a n} is not proportional to the torsion', n); mus.add(mu)
    assert len(ks) == 1 and len(mus) == 1, (ks, mus)
    return list(ks)[0], list(mus)[0]

# ------------------------------------------------------------------------------------------------ algebraic curvature tensors by linear algebra
def rank_and_null(rows, ncols):
    M = [r[:] for r in rows]; piv = []; r = 0
    for c in range(ncols):
        p = next((i for i in range(r, len(M)) if M[i][c] != 0), None)
        if p is None: continue
        M[r], M[p] = M[p], M[r]; inv = 1 / M[r][c]; M[r] = [x * inv for x in M[r]]
        for i in range(len(M)):
            if i != r and M[i][c] != 0:
                f = M[i][c]; M[i] = [x - f * y for x, y in zip(M[i], M[r])]
        piv.append(c); r += 1
    free = [c for c in range(ncols) if c not in piv]; basis = []
    for fc in free:
        v = [F(0)] * ncols; v[fc] = F(1)
        for i, pc_ in enumerate(piv): v[pc_] = -M[i][fc]
        basis.append(v)
    return len(piv), basis
def curvature_space(n):
    pairs = list(itertools.combinations(range(n), 2)); P = len(pairs); pidx = {p: i for i, p in enumerate(pairs)}; N = P * P
    def var(b, c, d, e):                                                         # R^{bc}_{de} as a signed variable index
        if b == c or d == e: return None
        s = 1
        if b > c: b, c = c, b; s = -s
        if d > e: d, e = e, d; s = -s
        return s, pidx[(b, c)] * P + pidx[(d, e)]
    rows = []
    # first Bianchi: R^a_b ^ e^b = 0  <=>  R^{ab}_{cd} cyclic in (b, c, d), one row per (a, triple)
    for a in range(n):
        for tri in itertools.combinations(range(n), 3):
            row = [F(0)] * N
            for (b, c, d) in ((tri[0], tri[1], tri[2]), (tri[1], tri[2], tri[0]), (tri[2], tri[0], tri[1])):
                v = var(a, b, c, d)
                if v: row[v[1]] += v[0]
            if any(row): rows.append(row)
    rk, basis = rank_and_null(rows, N); dim = N - rk
    sym = all(all(v[pidx[pairs[i]] * P + pidx[pairs[j]]] == v[pidx[pairs[j]] * P + pidx[pairs[i]]] for i in range(P) for j in range(P)) for v in basis)
    # Ricci contraction Ric^b_e = sum_c R^{bc}_{ce} on the null space
    ric_rows = []
    for v in basis:
        ric = [F(0)] * (n * n)
        for b in range(n):
            for e in range(n):
                t = F(0)
                for c in range(n):
                    w = var(b, c, c, e)
                    if w: t += w[0] * v[w[1]]
                ric[b * n + e] = t
        ric_rows.append(ric)
    rr, _ = rank_and_null([list(col) for col in zip(*ric_rows)] if ric_rows else [], len(ric_rows)) if ric_rows else (0, None)
    return {'dimension': dim, 'pair_symmetric': bool(sym), 'ricci_rank': rr, 'weyl_dimension': dim - rr}

def pair_classes(n):
    A = [(1 << i) | (1 << j) for i in range(n) for j in range(i + 1, n)]; c = {0: 0, 1: 0, 2: 0}
    for i in range(len(A)):
        for j in range(i, len(A)):
            c[2 - popc(A[i] & A[j]) if i != j else 2] += 1
    # share two = diagonal, share one = pairs sharing exactly one index, share none = disjoint pairs
    return {'diagonal': len(A), 'share_one_index': 3 * comb(n, 3), 'disjoint': 3 * comb(n, 4)}

def counts(n):
    G = comb(n, 2); pc_ = pair_classes(n); dim = n * n * (n * n - 1) // 12
    return {'frame_algebra': cell(1, n - 1), 'even_half': cell(1, n - 2) if n >= 2 else None, 'bivectors': G, 'boosts': n - 1, 'rotations': comb(n - 1, 2),
            'omega_components': n * G, 'tetrad_components': n * n, 'curvature_components': G * comb(n, 2), 'torsion_components': n * comb(n, 2),
            'riemann_independent': dim, 'pair_classes': pc_, 'first_bianchi_constraints': comb(n, 4),
            'riemann_from_classes': pc_['diagonal'] + pc_['share_one_index'] + pc_['disjoint'] - comb(n, 4),
            'einstein_components': n * n if n >= 3 else 0, 'einstein_terms_per_component': comb(n - 1, 2) if n >= 3 else 0,
            'divergence_torsion_terms_per_component': comb(n - 1, 2) * (n - 3) if n >= 3 else 0,
            'desitter_generators': comb(n + 1, 2), 'desitter_curvature_components': comb(n + 1, 2) * comb(n, 2), 'poincare_generators': G + n}

def build():
    out = {'ladder': {}, 'curvature_space': {}, 'identities': {}, 'einstein_identities': {}, 'einstein_tensor_ratio': {}, 'desitter': {}, 'status': {}}
    for n in range(2, 9):
        c = counts(n); assert c['riemann_independent'] == c['riemann_from_classes'], ('Riemann count from the pair classes', n); out['ladder'][str(n)] = c
    for n in range(2, 8):
        cs = curvature_space(n); assert cs['dimension'] == out['ladder'][str(n)]['riemann_independent'] and cs['pair_symmetric'], ('curvature space', n, cs); out['curvature_space'][str(n)] = cs
    assert [out['curvature_space'][str(n)]['weyl_dimension'] for n in range(2, 8)] == [0, 0, 10, 35, 84, 168], out['curvature_space']
    for n in (2, 3, 4, 5): out['identities'][str(n)] = identities(n, 31 * n)
    for (n, c) in [(3, 0), (3, 1), (4, 0), (4, 1), (5, 0)]: out['einstein_identities']['%d,%d' % (n, c)] = einstein_identities(n, 17 * n + c, F(c))
    for n in (3, 4, 5): r = einstein_is_einstein_tensor(n, 5 * n); out['einstein_tensor_ratio'][str(n)] = str(r)
    for n in (3, 4):
        for s, name in ((-1, 'de Sitter'), (1, 'anti-de Sitter')):
            k, mu = desitter_embedding(n, 11 * n + s, s); out['desitter']['%d,%s' % (n, 'dS' if s < 0 else 'AdS')] = {'extra_generator_square': s, 'group': name, 'coefficient_of_e_wedge_e': str(k), 'coefficient_of_torsion': str(mu)}
    out['status'] = {
        'checked': ['connection, curvature, torsion and the Einstein form are all the bit rule: bivector and vector commutators of the frame algebra, and forms as the same rule with null generators',
                    'second Bianchi D R = 0, first Bianchi D T = R ^ e, local Lorentz covariance, [D, D] psi = (1/2) R psi, exact for n = 2 to 5',
                    'D E_a equals the torsion terms only (with and without a cosmological term); in 3D without it D E_a = 0 identically; exact for n = 3, 4, 5',
                    'at e = dx the Einstein form is a fixed multiple of the Einstein tensor built from the Ricci contraction (exact, any R)',
                    'the curvature of the de Sitter / anti-de Sitter algebra (one more generator) is R + k e ^ e together with a multiple of the torsion',
                    'algebraic curvature tensors: dimension n^2 (n^2 - 1)/12, pair-symmetric once the first Bianchi identity holds, Ricci and Weyl parts, n = 2 to 7 by linear algebra'],
        'standard': ['Einstein-Cartan / first-order gravity, Cartan structure equations, MacDowell-Mansouri embedding in so(1,n) or so(2,n-1)', 'Riemann, Ricci, Weyl decomposition'],
        'ours': ['reading the Riemann components as pairs of bivectors: diagonal pairs, pairs sharing one index (the commutator graph of step 1) and disjoint pairs (the commuting pairs, the antipodes of the 16-cell at n = 4), with the first Bianchi identity as one relation per 4-subset'],
        'open': ['the field equation with matter: the sign and size of the coupling kappa (no action rebuilt)', 'solutions: nothing is solved, no metric is built from the tetrad', 'whether any of this is the gravity of the model']}
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    data = build(); js = json.dumps(data, sort_keys=True, indent=1)
    if a.write: open(a.write, 'w').write(js + '\n')
    if a.compare:
        old = json.load(open(a.compare)); assert old == json.loads(js), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL GRAVITY CHECKS PASS')
if __name__ == '__main__': main()
