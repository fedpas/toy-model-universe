#!/usr/bin/env python3
"""Forque dynamics (Dorst & De Keninck, "May the Forque Be with You", v2.6) on the bit rule: a translation matrix, checked.
Exact arithmetic, standard library only.  Standalone: this one file is all you need.
  python3 forque_selfcheck.py                         run every row and print the translation matrix
  python3 forque_selfcheck.py --write forque.json     also write the data
  python3 forque_selfcheck.py --compare forque.json   assert the portal data equals the rebuilt data
  python3 forque_selfcheck.py --quick                 skip the slow power-series rows

THE ALGEBRA.  A blade is a bit mask over d+1 generators; the product of two blades is the XOR of the masks with a sign (the bit rule).
Their Cl(d,0,1) is the bit rule with the squares  sq = [0, +1, ..., +1]:  bit 0 is their  eps = e0  (square 0) and bits 1..d are e1..ed (square +1).
So mask 0b1111 IS their e0123, mask 0b0011 is e01, mask 0b0110 is e12, and a name such as e31 is the product e3 e1 = - mask 0b1010.
Nothing else is assumed: every identity below is computed from this one product, with exact rational numbers.

THEIR OPERATORS, AS THE CODE USES THEM  (pages in brackets are their printed pages)
  reverse  ~A            : sign (-1)^(k(k-1)/2) on each grade k.
  x . A (vector x)       : (1/2)(x A - A^ x), A^ = grade involution                                      [C.1, p.84]
  A x B                  : (1/2)(A B - B A), the commutator                                              [eq 2.5]
  O = e1...ed ;  I = eps O  (their I_d)  ;  point Q = O + q I                                          [1.2.1]
  Hodge star             : X (*X) = X X~_E I,   so  *(X_E) = X~_E I   and   *(eps X_E) = X~_E I_d           [A.6, p.64]
  join                   : A v B = *^-1( *A ^ *B )                                                       [fn. 3, p.12]
  meet                   : the outer product ^
  motors                 : exp(-B t/2);  a translation by t is  1 - eps t/2;  X -> M X M~
Where a printed formula differs from what the algebra gives, the row says so (status 'note'), never silently."""
import argparse, json, os, random, sys
from fractions import Fraction as F
from math import comb

def popc(x): return bin(x).count('1')

# ------------------------------------------------------------------------------------------------------------- the algebra
def bmul(a, b, sq):
    sign = 0
    for i in range(len(sq)):
        if b >> i & 1: sign ^= popc(a >> (i + 1)) & 1
    s = -1 if sign else 1
    c = a & b
    for i in range(len(sq)):
        if c >> i & 1: s *= sq[i]
    return a ^ b, s

class MV:
    """a multivector {mask: Fraction} in the algebra with generator squares sq"""
    __slots__ = ('sq', 'd')
    def __init__(self, sq, d=None): self.sq = sq; self.d = {m: c for m, c in (d or {}).items() if c}
    def __add__(self, o):
        r = dict(self.d)
        for m, c in o.d.items(): r[m] = r.get(m, 0) + c
        return MV(self.sq, r)
    def __neg__(self): return self.scale(-1)
    def __sub__(self, o): return self + o.scale(-1)
    def scale(self, k): return MV(self.sq, {m: c * k for m, c in self.d.items()})
    def __mul__(self, o):
        r = {}
        for a, ca in self.d.items():
            for b, cb in o.d.items():
                m, s = bmul(a, b, self.sq)
                if s: r[m] = r.get(m, 0) + s * ca * cb
        return MV(self.sq, r)
    def rev(self): return MV(self.sq, {m: c * (-1 if (popc(m) * (popc(m) - 1) // 2) % 2 else 1) for m, c in self.d.items()})
    def inv(self): return MV(self.sq, {m: c * (-1 if popc(m) % 2 else 1) for m, c in self.d.items()})   # grade involution
    def grade(self, k): return MV(self.sq, {m: c for m, c in self.d.items() if popc(m) == k})
    def grades(self): return {popc(m) for m in self.d}
    def scalar(self): return self.d.get(0, F(0))
    def is_zero(self): return not self.d
    def __eq__(self, o): return self.d == o.d
    def __hash__(self): return hash(tuple(sorted(self.d.items())))
    def wedge(self, o):
        r = {}
        for a, ca in self.d.items():
            for b, cb in o.d.items():
                if a & b: continue
                m, s = bmul(a, b, self.sq)
                r[m] = r.get(m, 0) + s * ca * cb
        return MV(self.sq, r)

class Alg:
    """Cl(d,0,1) as the bit rule: sq = [eps_sq, sp, ..., sp].  eps_sq = 0 and sp = +1 is the paper's algebra."""
    def __init__(self, d, sp=1, eps_sq=0):
        self.d = d; self.sp = sp; self.sq = [eps_sq] + [sp] * d; self.n = d + 1
        self.full = (1 << self.n) - 1; self.eucl = self.full ^ 1
        self.O = self.E(''.join(str(i) for i in range(1, d + 1))); self.eps = self.g(0); self.I = self.eps * self.O
        self.Id = self.O
        self._star = {}
    def mv(self, d=None): return MV(self.sq, d)
    def one(self): return MV(self.sq, {0: F(1)})
    def zero(self): return MV(self.sq, {})
    def g(self, i): return MV(self.sq, {1 << i: F(1)})
    def E(self, names):
        """the product of generators in the order written, e.g. E('31') = e3 e1 ; E('01') = eps e1 ; E('') = 1"""
        r = self.one()
        for ch in names: r = r * self.g(int(ch))
        return r
    def vec(self, xs):
        """Euclidean vector with coordinates xs (d of them)"""
        return MV(self.sq, {1 << (i + 1): F(x) for i, x in enumerate(xs) if x})
    def point(self, q): return self.O + self.vec(q) * self.I
    def ideal(self, v): return self.vec(v) * self.I
    def bivectors(self): return [m for m in range(1 << self.n) if popc(m) == 2]
    def dualvecs(self): return [m for m in range(1 << self.n) if popc(m) == self.d - 1]
    # --- the Hodge star of A.6 and the join of footnote 3
    def star_blade(self, S):
        """the Hodge star as the signed complement:  (*e_S) ^ e_S = I   (so *O = eps, *(q I) = q, *E = -E I for a Euclidean bivector, *(eps e_k) = e_k I_d: the values the paper states)"""
        if S in self._star: return self._star[S]
        T = self.full ^ S; w = MV(self.sq, {T: F(1)}).wedge(MV(self.sq, {S: F(1)})); (m, c), = w.d.items(); assert m == self.full
        r = MV(self.sq, {T: c}); self._star[S] = r; return r
    def star(self, A):
        r = self.zero()
        for m, c in A.d.items(): r = r + self.star_blade(m).scale(c)
        return r
    def istar(self, A):
        r = self.zero()
        for m, c in A.d.items():
            for S in range(1 << self.n):
                img = self.star_blade(S)
                if len(img.d) == 1 and next(iter(img.d)) == m: r = r + MV(self.sq, {S: c / next(iter(img.d.values()))}); break
        return r
    def join(self, A, B): return self.istar(self.star(A).wedge(self.star(B)))
    def vdot(self, x, A): return (x * A - A.inv() * x).scale(F(1, 2))        # x . A, x a vector                      [C.1]
    def comm(self, A, B): return (A * B - B * A).scale(F(1, 2))             # A x B                                  [eq 2.5]
    def trans(self, t): return self.one() - (self.eps * self.vec(t)).scale(F(1, 2))      # T_t = 1 - eps t/2           [1.1]
    def rotor(self, i, j, c, s):
        """cos(phi) - sin(phi) e_ij  (= exp(-phi e_ij)), with (c, s) a rational point of the unit circle"""
        assert c * c + s * s == 1; return self.one().scale(c) - self.E(f'{i}{j}').scale(s)
    def sand(self, M, X): return M * X * M.rev()
    def rand_vec(self, rng, lo=-3, hi=3): return [F(rng.randint(lo, hi), rng.randint(1, 2)) for _ in range(self.d)]
    def rand_motor(self, rng):
        M = self.one()
        for _ in range(3):
            i, j = rng.sample(range(1, self.d + 1), 2) if self.d >= 2 else (1, 1)
            tau = F(rng.randint(-3, 3), rng.randint(1, 3)); c, s = (1 - tau * tau) / (1 + tau * tau), 2 * tau / (1 + tau * tau)
            if self.d >= 2: M = M * self.rotor(i, j, c, s)
            M = M * self.trans(self.rand_vec(rng, -2, 2))
        return M
    def rand_bivector(self, rng): return MV(self.sq, {m: F(rng.randint(-3, 3)) for m in self.bivectors()})
    def rand_bivector_nz(self, rng): return MV(self.sq, {m: F(rng.choice([-3, -2, -1, 1, 2, 3])) for m in self.bivectors()})
    def rand_euclid_bivector(self, rng): return MV(self.sq, {m: F(rng.randint(-3, 3)) for m in self.bivectors() if not m & 1})

# ------------------------------------------------------------------------------------------------------------- rendering with the paper's names
D3_NAMES = {0: ('1', 1), 1: ('e0', 1), 2: ('e1', 1), 4: ('e2', 1), 8: ('e3', 1), 3: ('e01', 1), 5: ('e02', 1), 9: ('e03', 1), 6: ('e12', 1), 12: ('e23', 1), 10: ('e31', -1),
            14: ('e123', 1), 13: ('e032', -1), 11: ('e013', 1), 7: ('e021', -1), 15: ('e0123', 1)}
def fmt_q(c):
    c = F(c); return str(c.numerator) if c.denominator == 1 else f'{c.numerator}/{c.denominator}'
def show(A, d=3):
    """a multivector as a sum of terms written with the paper's names (their e31, e032, e013, e021 for d = 3)"""
    if not A.d: return '0'
    terms = []
    for m in sorted(A.d, key=lambda m: (popc(m), m)):
        if d == 3 and m in D3_NAMES: nm, sg = D3_NAMES[m]
        else: nm, sg = ('e' + ''.join(str(i) for i in range(d + 1) if m >> i & 1)) if m else '1', 1
        c = A.d[m] * sg
        body = (fmt_q(abs(c)) if (abs(c) != 1 or nm == '1') else '') + ('' if nm == '1' else nm)
        terms.append(('-' if c < 0 else '+') + body)
    s = ' '.join(terms)
    return (s[1:] if s.startswith('+') else '-' + s[1:]).replace('- ', '-') if s else '0'

# ------------------------------------------------------------------------------------------------------------- series (formal power series in t with multivector coefficients)
class Ser:
    __slots__ = ('c',)
    def __init__(self, c): self.c = c
    @staticmethod
    def const(A, N): z = A.scale(0); return Ser([A] + [z] * N)
    def __add__(self, o): return Ser([a + b for a, b in zip(self.c, o.c)])
    def __sub__(self, o): return Ser([a - b for a, b in zip(self.c, o.c)])
    def scale(self, k): return Ser([a.scale(k) for a in self.c])
    def __mul__(self, o):
        N = len(self.c); r = [self.c[0].scale(0) for _ in range(N)]
        for i in range(N):
            if not self.c[i].d: continue
            for j in range(N - i):
                if o.c[j].d: r[i + j] = r[i + j] + self.c[i] * o.c[j]
        return Ser(r)
    def rev(self): return Ser([a.rev() for a in self.c])
    def map(self, f): return Ser([f(a) for a in self.c])
    def d_dt(self):
        N = len(self.c); z = self.c[0].scale(0); return Ser([self.c[k + 1].scale(k + 1) for k in range(N - 1)] + [z])
    def integ(self, A0):
        N = len(self.c); return Ser([A0] + [self.c[k - 1].scale(F(1, k)) for k in range(1, N)])
    def upto(self, n): return all(not a.d for a in self.c[:n + 1])
def ser_exp(A, k, N):
    """exp(k A t) as a series"""
    one = A.scale(0) + MV(A.sq, {0: F(1)}); out = [one]; P = one
    for n in range(1, N + 1): P = (P * A).scale(k / n); out.append(P)
    return Ser(out)
def ser_equal(a, b, n): return all(x == y for x, y in zip(a.c[:n + 1], b.c[:n + 1]))
def ser_vanish(a, n): return all(not x.d for x in a.c[:n + 1])
def picard(f, S0, N):
    """solve S' = f(S), S(0) = S0 (lists of series) by Picard iteration; exact through order N"""
    S = [Ser.const(s, N) for s in S0]
    for _ in range(N + 1):
        dS = f(S); S = [d.integ(s0) for d, s0 in zip(dS, S0)]
    return S

# ------------------------------------------------------------------------------------------------------------- rigid bodies: inertia from the definition
class Body:
    """a rigid set of mass points (m_i, q_i), seen in the body frame; Q_i = O + q_i I.  The inertia map of eq 2.13 is built from its definition."""
    def __init__(self, A, pts):
        self.A = A; self.pts = [(F(m), [F(x) for x in q]) for m, q in pts]; self.m = sum(m for m, _ in self.pts)
        self.c = [sum(m * q[i] for m, q in self.pts) / self.m for i in range(A.d)]
        self.X = [A.point(q) for _, q in self.pts]
        self.bv = A.bivectors(); self.dv = A.dualvecs(); self._img = {b: self.I_def(MV(A.sq, {b: F(1)})) for b in self.bv}
        self._mat = None
    def I_def(self, B):
        r = self.A.zero()
        for (m, _), X in zip(self.pts, self.X): r = r + self.A.join(X, self.A.comm(X, B)).scale(m)
        return r
    def I(self, B):
        r = self.A.zero()
        for m, c in B.d.items(): r = r + self._img[m].scale(c)
        return r
    def matrix(self):
        return [[self._img[b].d.get(o, F(0)) for b in self.bv] for o in self.dv]
    def Iinv(self, P):
        if self._mat is None: self._mat = inverse(self.matrix())
        v = [P.d.get(o, F(0)) for o in self.dv]; w = [sum(self._mat[i][j] * v[j] for j in range(len(v))) for i in range(len(self.bv))]
        return MV(self.A.sq, {b: x for b, x in zip(self.bv, w)})
    def centroidal(self): return all(c == 0 for c in self.c)
    def IC(self, B):
        """the classical GA inertia  sum m r ^ (r . B)  about the centroid (eq 2.16, A.3), r relative to the centroid"""
        r = self.A.zero()
        for m, q in self.pts:
            rv = self.A.vec([qi - ci for qi, ci in zip(q, self.c)]); r = r + rv.wedge(self.A.vdot(rv, B)).scale(m)
        return r
def inverse(M):
    n = len(M); A = [r[:] + [F(int(i == j)) for j in range(n)] for i, r in enumerate(M)]
    for c in range(n):
        p = next((i for i in range(c, n) if A[i][c] != 0), None)
        if p is None: raise ZeroDivisionError('singular inertia matrix')
        A[c], A[p] = A[p], A[c]; pv = A[c][c]; A[c] = [x / pv for x in A[c]]
        for i in range(n):
            if i != c and A[i][c] != 0: f = A[i][c]; A[i] = [x - f * y for x, y in zip(A[i], A[c])]
    return [r[n:] for r in A]
def centroid_body(A, rng, k=None):
    """a random rigid body whose centroid is the origin: points come in +-pairs plus one generic point balanced by its mirror partner"""
    pts = []
    for _ in range((k or 3)):
        q = A.rand_vec(rng, -3, 3); m = F(rng.randint(1, 3)); pts += [(m, q), (m, [-x for x in q])]
    # break the symmetry (still centroidal): three points with mass-weighted sum zero
    q1, q2 = A.rand_vec(rng), A.rand_vec(rng); pts += [(F(1), q1), (F(1), q2), (F(2), [-(a + b) / 2 for a, b in zip(q1, q2)])]
    return Body(A, pts)
def generic_body(A, rng, k=5):
    return Body(A, [(F(rng.randint(1, 3)), A.rand_vec(rng, -3, 3)) for _ in range(k)])
def diag_body(A, rng):
    """principal axes along the coordinate axes: +-a_k e_k with masses mu_k, plus a mass at the origin"""
    pts = []; mus = []; a = []
    for k in range(1, A.d + 1):
        ak = F(rng.randint(1, 3)); mu = F(rng.randint(1, 3)); mus.append(mu); a.append(ak)
        q = [F(0)] * A.d; q[k - 1] = ak; pts += [(mu, q[:]), (mu, [-x for x in q])]
    pts.append((F(rng.randint(1, 3)), [F(0)] * A.d)); body = Body(A, pts)
    body.mus, body.axes = mus, a
    body.i = {}
    for i in range(1, A.d + 1):
        for j in range(i + 1, A.d + 1): body.i[(i, j)] = 2 * (mus[i - 1] * a[i - 1] ** 2 + mus[j - 1] * a[j - 1] ** 2)
    return body

ROWS = []
def row(id, ref, page, paper, ours, status='ok', note='', dims=None, worked=None, how=''):
    ROWS.append({'id': id, 'ref': ref, 'page': page, 'paper': paper, 'ours': ours, 'status': status, 'note': note, 'remark': '', 'dims': dims or [], 'worked': worked, 'how': how})
    return ROWS[-1]

def req(cond, msg='check failed'):
    if not cond: raise AssertionError(msg)
def W(A, lhs, rhs, d=None):
    return {'d': d or A.d, 'lhs': show(lhs, d or A.d), 'rhs': show(rhs, d or A.d)}
DIMS = (2, 3, 4)
def fixed(d, a): return [F(x) for x in a[:d]]
U = [1, 2, 3, 4]; Q0 = [2, -1, 1, 3]

# ================================================================================================= CHAPTER 1: elements
def ch1(seed):
    rng = random.Random(seed)
    # --- the star: the four values the paper states
    for d in DIMS:
        A = Alg(d); q = A.rand_vec(rng)
        req(A.star(A.O) == A.eps, '*O = eps'); req(A.star(A.ideal(q)) == A.vec(q), '*(q I) = q')
        req(A.star(A.point(q)) == A.eps + A.vec(q), '*Q = eps + q   (C.8)')
        E = A.rand_euclid_bivector(rng); req(A.star(E) == -(E * A.I), '*E = -E I')
        for k in range(1, d + 1): req(A.star(A.g(0) * A.g(k)) == A.g(k) * A.Id, '*(eps e_k) = e_k I_d')
        for m in range(1 << A.n):
            b = MV(A.sq, {m: F(1)}); req(A.star(b).wedge(b) == A.I, '(*B) ^ B = I'); req(A.istar(A.star(b)) == b)
    A = Alg(2); row('F00', 'A.6, C.8, p.64, p.86', 64, r'\star O=\epsilon,\ \ \star(\mathbf q\mathcal I)=\mathbf q,\ \ \star\mathbf E=-\mathbf E\mathcal I,\ \ \star(\epsilon\mathbf e_k)=\mathbf e_k\mathbf I_d',
        r'\mathrm{star}(m)=\pm e_{\overline m},\ \ (\star e_S)\wedge e_S=I', dims=list(DIMS), worked=W(A, A.star(A.point([2, 3])), A.eps + A.vec([2, 3])),
        how='the star as signed complement; the four values the paper states are reproduced in d = 2, 3, 4; join = *^-1(*A ^ *B)')
    # --- 1.1 planes
    for d in DIMS:
        A = Alg(d)
        for _ in range(6):
            n = A.vec(A.rand_vec(rng)); q = A.rand_vec(rng); T = A.trans(q)
            lhs = A.sand(T, n); delta = A.vdot(A.vec(q), n).scalar(); rhs = n - A.eps.scale(delta)
            req(lhs == rhs, 'T n T~ = n - (q.n) eps'); req(A.sand(T, A.one()) == A.one())
            # n and eps anticommute, eps^2 = 0
            req(n * A.eps == -(A.eps * n) and (A.eps * A.eps).is_zero())
    A = Alg(2); n = A.vec([1, 0]); q = [3, 5]; row('F01', '1.1, p.8', 8, r'p=\mathbf n-\delta\epsilon,\ \ (1-\epsilon\mathbf q/2)\,\mathbf n\,(1+\epsilon\mathbf q/2)=\mathbf n-(\mathbf q\cdot\mathbf n)\epsilon',
        r'T\,n\,\tilde T = n - (q\cdot n)\,e_{\text{bit }0}', dims=list(DIMS), worked=W(A, A.sand(A.trans(fixed(2, q)), n), n - A.eps.scale(3)), how='random n, q; both signs of the orientation of eps respected (eps^2 = 0, n eps = - eps n)')
    # --- 1.2 points
    for d in DIMS:
        A = Alg(d)
        for _ in range(6):
            q = A.rand_vec(rng); Q = A.point(q); T = A.trans(q)
            req(A.sand(T, A.O) == Q, 'Q = T O T~'); req((A.one() - A.eps * A.vec(q)) * A.O == Q, 'Q = (1 - eps q) O'); req(A.I == A.eps * A.O)
            P = A.g(1) - A.eps.scale(q[0])
            for i in range(2, d + 1): P = P.wedge(A.g(i) - A.eps.scale(q[i - 1]))
            req(P == Q, 'Q is the meet of the planes e_i - q_i eps (1.2.1)')
            c = A.rand_vec(rng); C = A.point(c); r = [a - b for a, b in zip(q, c)]
            req(Q == C + A.vec(r) * A.I, 'point split Q = C + r I')
            req(A.I == A.eps * Q == A.eps * C, 'I = eps Q = eps C')
        sgn = -1 if (d * (d - 1) // 2) % 2 else 1; Q = A.point(A.rand_vec(rng)); req(A.O * A.O == A.one().scale(sgn) and Q * Q == A.one().scale(sgn), 'O^2 = Q^2 = (-1)^(d(d-1)/2)')
        u = A.rand_vec(rng); V = A.ideal(u); req(A.sand(A.trans(A.rand_vec(rng)), V) == V, 'a vanishing point is translation invariant'); req(A.point(q) + V.scale(F(3)) == A.point([a + 3 * b for a, b in zip(q, u)]))
    A = Alg(2); q = fixed(2, [2, 3])
    row('F02', '1.2.1, eq (1.1), p.9', 9, r'Q=(1-\epsilon\mathbf q/2)\,O\,(1+\epsilon\mathbf q/2)=(1-\epsilon\mathbf q)O=O+\mathbf q\mathcal I,\ \ \mathcal I=\epsilon O',
        r'Q = T O \tilde T = O + q\,(\epsilon O)', dims=list(DIMS), worked=W(A, A.sand(A.trans(q), A.O), A.point(q)), how='translation of O; (1 - eps q) O; point split from another centre C; I = eps Q for every point Q')
    row('F03', '1.2.1, p.9', 9, r'Q=(\mathbf e_1-q_1\epsilon)\wedge\dots\wedge(\mathbf e_d-q_d\epsilon)', r'Q = \bigwedge_i (e_i - q_i\,\epsilon)', dims=list(DIMS),
        worked=W(A, (A.g(1) - A.eps.scale(2)).wedge(A.g(2) - A.eps.scale(3)), A.point(q)), how='a point is the meet of d planes')
    row('F04', '1.2.1, p.10', 10, r'O^2=Q^2=\mathcal I_d^2=(-1)^{d(d-1)/2}\ \ (=-1\text{ in 2D, 3D})', r'O\,O=Q\,Q=\mathrm{pseudoscalar}_E^2', dims=list(DIMS), worked=W(A, A.point(q) * A.point(q), A.one().scale(-1)), how='d = 2, 3, 4: -1, -1, +1')
    V = A.ideal([1, 2])
    row('F05', '1.2.2, p.10', 10, r'V_{\mathbf u}=\mathbf u\mathcal I\ \ (\text{a point without an }O\text{ part})', r'u\,I', dims=list(DIMS),
        worked=W(A, A.sand(A.trans([F(5), F(7)]), V), V), how='V is translation invariant; Q + t V_u is the point moved by t u')
    # --- 1.3 join lines
    notes = []
    for d in DIMS:
        A = Alg(d)
        for _ in range(5):
            u = A.rand_vec(rng); uv = A.vec(u); q = A.rand_vec(rng); Q = A.point(q); V = A.ideal(u)
            req(A.join(A.O, A.O + V) == A.join(A.O, V) == A.vdot(uv, A.O), 'O v (O + uI) = O v (uI) = u.O  (1.3)')
            L = A.sand(A.trans(q), A.vdot(uv, A.O)); req(L == A.vdot(uv, A.O) + uv.wedge(A.vec(q)) * A.I == A.vdot(uv, Q), 'u.Q = T (u.O) T~ = u.O + (u^q) I  (1.4-1.5)')
            req(A.join(Q, V) == A.vdot(uv, Q), 'Q v (uI) = u.Q   (C.7, C.8)'); req(A.join(Q, Q) .is_zero(), 'X v X = 0')
            # pencil of planes: p ^ (u.Q) = 0  iff  p ^ Q = 0 and p.u = 0 : take p through Q with normal perpendicular to u
            L2 = A.vdot(uv, Q); n = A.vec(A.rand_vec(rng))
            if d >= 2:
                # a plane p = n - delta eps with p ^ Q = 0 (through Q) and n perpendicular to u
                nn = [F(0)] * d; nn[0] = u[1] if d > 1 else F(0); nn[1] = -u[0]
                if any(nn): p = A.vec(nn) - A.eps.scale(sum(a * b for a, b in zip(nn, q)))
                else: p = None
                if p is not None: req(p.wedge(Q).is_zero() and p.wedge(L2).is_zero(), 'pencil of planes'); req((A.vdot(p, uv.__class__(uv.sq, uv.d))).scalar() == 0)
    A = Alg(2); u = [1, 2]; q = [2, -1]; uv = A.vec(u); Q = A.point(q)
    row('F06', '1.3.2, eq (1.3), p.12', 12, r'L_o=O\vee(O+\mathbf u\mathcal I)=O\vee(\mathbf u\mathcal I)=\mathbf u\cdot O', r'\mathrm{join}(O,\,uI) = u\cdot O', dims=list(DIMS), worked=W(A, A.join(A.O, A.ideal(u)), A.vdot(uv, A.O)),
        how='join = *^-1(*A ^ *B), the star as above; the join of a point with itself vanishes')
    row('F07', '1.3.2, eqs (1.4)-(1.5), p.12', 12, r'L=(1-\epsilon\mathbf q/2)(\mathbf u\cdot O)(1+\epsilon\mathbf q/2)=\mathbf u\cdot O+(\mathbf u\wedge\mathbf q)\mathcal I=\mathbf u\cdot Q',
        r'T(u\cdot O)\tilde T = u\cdot O + (u\wedge q)\,I = u\cdot Q', dims=list(DIMS), worked=W(A, A.sand(A.trans(q), A.vdot(uv, A.O)), A.vdot(uv, Q)), how='where x.A = (xA - A^ x)/2 for a vector x')
    row('F08', 'C.1, eqs (C.7)-(C.8), p.85', 85, r'Q\vee(\mathbf u\mathcal I)=\mathbf u\cdot Q', r'\mathrm{join}(Q,\,uI)=u\cdot Q', dims=list(DIMS), worked=W(A, A.join(Q, A.ideal(u)), A.vdot(uv, Q)),
        how='d = 2, 3, 4.  The remark after (1.5), "u.Q (-1)^(d-1) in R_{d,0,1}", does not appear: with the footnote-3 join the sign is +1 in every d we tried')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'In d = 2, 3, 4 with the join of footnote 3 we find Q v (uI) = u.Q and O v (uI) = u.O with no (-1)^(d-1); that remark in 1.3.2 may belong to the older join convention.'
    A = Alg(3); u = A.vec([1, 2, 3]); Qn = A.point([1, 0, 2]); gen = A.vec([1, 1, 1]) - A.eps.scale(F(5)); req(not gen.wedge(A.vdot(u, Qn)).is_zero(), 'a generic plane is not in the pencil')
    row('F09', '1.3.2, p.13', 13, r'\mathbf p\wedge(\mathbf u\cdot Q)=0\iff \mathbf p\wedge Q=0\ \text{and}\ \mathbf p\cdot\mathbf u=0', r'p\wedge(u\cdot Q)=0', dims=[2, 3, 4], worked=None, how='planes through Q with a normal perpendicular to u lie in the pencil; a generic plane does not')

# ---- splits of a bivector and of a dual bivector
def splits(seed):
    rng = random.Random(seed)
    for d in (3,):
        A = Alg(d)
        for _ in range(8):
            Bm = A.rand_euclid_bivector(rng); v = A.vec(A.rand_vec(rng))
            if Bm.is_zero(): continue
            Binv = Bm.scale(-1 / (Bm * Bm.rev()).scalar())  # B^-1 = ~B / (B ~B) ... Bm is a Euclid bivector in 3D (a blade): B^-1 = -B/(B.B~) up to sign
            Binv = Bm.rev().scale(1 / (Bm * Bm.rev()).scalar())
            ωL = Bm + A.eps * (A.vdot(v, Bm) * Binv); νLI = A.eps * (v.wedge(Bm) * Binv)
            B = Bm + A.eps * v
            req(ωL + (-νLI) != B or v.wedge(Bm).is_zero(), 'the printed minus sign does not sum to B')
            req(ωL + νLI == B, 'Chasles split (C.13)'); req(A.comm(ωL, νLI).is_zero(), 'the two parts commute'); req(ωL.wedge(ωL).is_zero() and νLI.wedge(νLI).is_zero(), 'each part is a 2-blade')
            # the printed intermediate:  B ^ B~ = 2 eps (v ^ B~) ,  B . B~ = B . B~ (Euclidean)
    A = Alg(3); Bm = A.E('12') + A.E('23').scale(2); v = A.vec([1, 0, 3]); Binv = Bm.rev().scale(1 / (Bm * Bm.rev()).scalar()); B = Bm + A.eps * v
    row('F10', '1.3.5 / C.2, eq (C.13), p.86', 86, r'\mathbb B=\mathbf B+\epsilon\mathbf v=\big(\mathbf B+\epsilon(\mathbf v\cdot\mathbf B)/\mathbf B\big)-\epsilon(\mathbf v\wedge\mathbf B)/\mathbf B=\omega L+\nu L\mathcal I',
        r'B_E + \epsilon v = (B_E + \epsilon\,(v\cdot B_E)B_E^{-1}) - \epsilon\,(v\wedge B_E)B_E^{-1}', dims=[3], worked=W(A, Bm + A.eps * (A.vdot(v, Bm) * Binv) + A.eps * (v.wedge(Bm) * Binv), B),
        how='the two parts commute and each is a 2-blade; a screw = a rotation about L together with a translation along it')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'Exact check: B = [B_E + eps (v.B_E)/B_E] + eps (v^B_E)/B_E, with a PLUS in front of the second term.  The printed final line has a minus there, which does not add up to B (the worked instance shows the plus version).'

# ================================================================================================= CHAPTER 2.1: kinematics
N_SER = 7
def rand_bser(A, rng, N, euclid=False):
    """a polynomial-in-t bivector with small integer coefficients"""
    mk = A.rand_euclid_bivector if euclid else A.rand_bivector
    return Ser([mk(rng) for _ in range(N + 1)]).scale(F(1))
def motor_flow(A, Bs, M0, N):
    return picard(lambda S: [(Bs * S[0]).scale(F(-1, 2))], [M0], N)[0]
def kinematics(seed, N=N_SER):
    rng = random.Random(seed)
    for d in (2, 3):
        A = Alg(d); one = Ser.const(A.one(), N)
        # eq (2.1)-(2.7): M = exp(-Bt/2) M0  (world rate)  and  M = M0 exp(-B't/2)  (body rate), constant B
        B = A.rand_bivector(rng); M0 = A.rand_motor(rng); E = ser_exp(B, F(-1, 2), N); Mw = E * Ser.const(M0, N)
        req(ser_equal(Mw.d_dt(), (Ser.const(B, N) * Mw).scale(F(-1, 2)), N - 1), 'dM/dt = -1/2 B M'); req(ser_equal((Mw.d_dt() * Mw.rev()).scale(-2), Ser.const(B, N), N - 1), 'B = -2 Mdot M~  (2.1)')
        Mb = Ser.const(M0, N) * E
        req(ser_equal(Mb.d_dt(), (Mb * Ser.const(B, N)).scale(F(-1, 2)), N - 1), 'dM/dt = -1/2 M B (2.2)'); req(ser_equal((Mb.rev() * Mb.d_dt()).scale(-2), Ser.const(B, N), N - 1), "B' = -2 M~ Mdot")
        # the paradox: the world-frame and body-frame rates of exp(-Bt/2) M0 are different unless M0 = 1
        Bb = (Mw.rev() * Mw.d_dt()).scale(-2); req(Bb.c[0] == M0.rev() * B * M0, 'body rate of the world-frame motor is M~0 B M0'); req(Bb.c[0] != B or M0 * B == B * M0)
        req(ser_equal((Mw * Bb * Mw.rev()), Ser.const(B, N), N - 1), 'B_w = M B_b M~  (2.6-2.7)')
        # M M~ = 1 for the motor, hence  Mdot M~ = - M Mdot~  (2.4)
        req(ser_equal(Mw * Mw.rev(), one, N), 'M M~ = 1'); req(ser_equal(Mw.d_dt() * Mw.rev(), (Mw * Mw.d_dt().rev()).scale(-1), N - 1), 'Mdot M~ = -M Mdot~  (2.4)')
        # a time-varying rate:  Mdot = -1/2 B(t) M ;  B = -2 Mdot M~ is a bivector, and M stays a motor
        Bs = rand_bser(A, rng, N); M = motor_flow(A, Bs, M0, N)
        req(ser_equal((M.d_dt() * M.rev()).scale(-2), Bs, N - 1), 'B(t) = -2 Mdot M~ (2.3)'); req(ser_equal(M * M.rev(), Ser.const((M0 * M0.rev()), N), N - 1), 'M M~ stays constant (= M0 M~0)')
        req(all(m.grades() <= {2} for m in (M.d_dt() * M.rev()).c[:N - 1]), 'B is a bivector')
        # eq (2.8): X = M X0 M~  =>  Xdot = X x B_w      for a point, a line and a plane
        X0s = [A.point(A.rand_vec(rng)), A.vdot(A.vec(A.rand_vec(rng)), A.point(A.rand_vec(rng))), A.vec(A.rand_vec(rng)) - A.eps.scale(F(2))]
        for X0 in X0s:
            X = M * Ser.const(X0, N) * M.rev(); req(ser_equal(X.d_dt(), comm_ser(A, X, Bs), N - 2), 'Xdot = X x B (2.8)')
        # eq (2.9): a moving element
        Xb = Ser([A.point(A.rand_vec(rng)) for _ in range(N + 1)]); Xw = M * Xb * M.rev()
        req(ser_equal(Xw.d_dt(), comm_ser(A, Xw, Bs) + M * Xb.d_dt() * M.rev(), N - 2), 'Xdot_w = X_w x B_w + (Xdot_b)_w  (2.9)')
    # eq (2.10), (A.1), (A.2): velocity of a point.   X x (B + eps v) = (v + x.B) I
    for d in DIMS:
        A = Alg(d)
        for _ in range(8):
            x = A.rand_vec(rng); X = A.point(x); Bm = A.rand_euclid_bivector(rng); v = A.rand_vec(rng); B = Bm + A.eps * A.vec(v)
            xd = A.vec(v) + A.vdot(A.vec(x), Bm); req(A.comm(X, B) == xd * A.I, 'X x B = (v + x.B) I   (A.1)')
        B = A.E('12'); req(A.vdot(A.vec([1] + [0] * (d - 1)), B) == A.vec([0, 1] + [0] * (d - 2)), 'x . e12 turns e1 into e2 (counter-clockwise)')
    A = Alg(2); x = [2, 3]; v = [1, 0]; Bm = A.E('12'); B = Bm + A.eps * A.vec(v)
    row('F11', '2.1.1-2.1.3, eqs (2.1)-(2.7), pp.19-21', 19, r'\dot M=-\tfrac12\mathbb B M,\ \mathbb B=-2\dot M\widetilde M;\quad M=M_0e^{-\mathbb B_b t/2}:\ \dot M=-\tfrac12 M\mathbb B_b,\ \mathbb B_b=-2\widetilde M\dot M;\quad \mathbb B_w=M\mathbb B_b\widetilde M',
        r'dM/dt = -\tfrac12 B M,\ \ B = -2\,\dot M\,\tilde M', dims=[2, 3], worked=None, how=f'exact power series in t through order {N - 1}: M = exp(-Bt/2) M0 and M0 exp(-B t/2); the two rates differ by M0 (the paradox) and agree only at M0 = 1')
    row('F12', '2.1.2, eqs (2.3)-(2.4), p.20', 20, r'M\widetilde M=1\Rightarrow\dot M\widetilde M=-M\dot{\widetilde M};\ \ \mathbb B=-2\dot M\widetilde M\ \text{is a bivector}', r'\dot M\tilde M=-M\dot{\tilde M}',
        dims=[2, 3], how='for a time-varying rate B(t): M solves Mdot = -B M/2; M M~ stays constant, -2 Mdot M~ returns B(t), and it has only grade 2')
    row('F13', '2.1.2 / 2.1.3, eqs (2.8)-(2.9), p.20-21', 21, r'\dot X=X\times\mathbb B_w\ \ (X=MX_0\widetilde M);\qquad \dot X_w=X_w\times\mathbb B_w+M\dot X_b\widetilde M', r'\dot X = \tfrac12 (X B - B X)',
        dims=[2, 3], how='power series; X a point, a line and a plane; and a moving X_b (the extra term of 2.9)')
    row('F14', '2.1.4, eq (2.10); A.2, eqs (A.1)-(A.2), pp.22, 61', 22, r'\dot X=\dot{\mathbf x}\mathcal I=X\times\mathbb B_w,\ \ \dot{\mathbf x}=\mathbf v+\mathbf x\cdot\mathbf B',
        r'X\times(B+\epsilon v)=(v+x\cdot B)\,I', dims=list(DIMS), worked=W(A, A.comm(A.point(x), B), (A.vec(v) + A.vdot(A.vec(x), Bm)) * A.I), how='x . e12 sends e1 to e2: the rate B = e12 is counter-clockwise, as the text says')
    # section 2.1.5: translations are felt in the body frame
    A = Alg(3); R = A.rotor(1, 2, F(3, 5), F(4, 5)); c = A.rand_vec(rng); M0 = A.trans(c) * R; v = A.eps * A.vec([1, 2, 3])
    Bb = M0.rev() * v * M0; vb = A.eps * (R.rev() * A.vec([1, 2, 3]) * R)
    req(Bb == vb and not Bb.is_zero(), 'body rate of a uniform translation is the counter-rotated velocity'); req(M0.rev() * v * M0 != v)
    row('F15', '2.1.5, p.22', 22, r'M=e^{-\mathbf v_wt/2}M_0\ \Rightarrow\ \mathbb B_b=\widetilde M(\mathbf v_w)M=\epsilon\,\widetilde R\mathbf v_wR\neq0', r'M^\sim\,(\epsilon v)\,M = \epsilon\,(\tilde R\,v\,R)', dims=[3],
        worked=W(A, Bb, vb), how='a translation seen in the body frame is not zero: ideal elements are part of the body frame ("share your ideals")')

def comm_ser(A, X, Bs):
    N = len(X.c); z = X.c[0].scale(0); r = [z for _ in range(N)]
    P = X * Bs; Q = Bs * X
    return Ser([(p - q).scale(F(1, 2)) for p, q in zip(P.c, Q.c)])

# ================================================================================================= CHAPTER 2.2-2.3: momentum, inertia, forque
def IC_matrix(body):
    A = body.A; eb = [m for m in A.bivectors() if not m & 1]
    return eb, [[body.IC(MV(A.sq, {b: F(1)})).d.get(o, F(0)) for b in eb] for o in eb]
def IC_inv(body, Bm):
    eb, M = IC_matrix(body); Mi = inverse(M); v = [Bm.d.get(o, F(0)) for o in eb]
    return MV(body.A.sq, {b: sum(Mi[i][j] * v[j] for j in range(len(v))) for i, b in enumerate(eb)})
def velocity(A, X, B): return A.comm(X, B)
def momentum_inertia(seed):
    rng = random.Random(seed)
    # 2.2.1: momentum of a mass point is a line
    for d in DIMS:
        A = Alg(d)
        for _ in range(5):
            x = A.rand_vec(rng); X = A.point(x); v = A.vec(A.rand_vec(rng)); m = F(rng.randint(1, 4)); Xd = v * A.I
            P = A.join(X, Xd).scale(m); req(P == A.vdot(v, X).scale(m), 'P = m X v Xdot = m v.X'); req(A.join(X, X + Xd).scale(m) == P, 'X v (X + Xdot) = X v Xdot since X v X = 0')
            y = A.rand_vec(rng); Y = A.point(y); s = A.vec([a - b for a, b in zip(x, y)])           # X - Y = s I
            req(X - Y == s * A.I)
            lhs = A.vdot(v, s * A.I); a1 = v.wedge(s) * A.I; a2 = s.wedge(v) * A.I
            req(lhs == a2.scale(-1) and lhs == a1, 'v.(sI) = (v^s) I = -(s^v) I')
            lam = F(rng.randint(-3, 3)); vv = [v.d.get(1 << (i + 1), F(0)) for i in range(d)]; Yon = A.point([a + lam * b for a, b in zip(x, vv)])
            req(A.vdot(v, Yon) == A.vdot(v, X), 'the momentum line does not change when the point slides along the line (gauge freedom)')
    A = Alg(2); x = [1, 2]; y = [3, -1]; v = A.vec([2, 1]); s = A.vec([-2, 3])
    row('F16', '2.2.1, p.23', 23, r'P\equiv mX\vee\dot X=mX\vee(\dot{\mathbf x}\mathcal I)=m\dot{\mathbf x}\cdot X', r'P = m\,\mathrm{join}(X, \dot x I) = m\,\dot x\cdot X', dims=list(DIMS), worked=W(A, A.join(A.point(x), v * A.I), A.vdot(v, A.point(x))),
        how='the join line is unchanged by sliding the point along the line (gauge freedom)')
    row('F17', '2.2.1, p.23', 23, r'P=m\mathbf v\cdot Y+m\mathbf v\cdot(X-Y)=m\mathbf v\cdot Y-(\mathbf r\wedge m\mathbf v)\mathcal I', r'm\,v\cdot X = m\,v\cdot Y - m\,((x-y)\wedge v)\,I', dims=list(DIMS),
        worked=W(A, A.vdot(v, A.point(x)), A.vdot(v, A.point(y)) - (A.vec([a - b for a, b in zip(x, y)]).wedge(v) * A.I)),
        how='exact in d = 2, 3, 4 with r = x - y (the position of the mass seen from Y), so that in 3D the last term is eps (r x p), the classical angular momentum')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'The displayed derivation is exact with X - Y = r I, i.e. r = x - y. The sentence just before it defines r = y - x, which would flip the sign of the last term.'
    # 2.2.2 / 2.2.7 sums of join lines are bivectors, not blades, in 3D+; inertia additive
    A = Alg(3); body = generic_body(A, rng, 5); B = A.rand_bivector(rng); P = body.I_def(B)
    parts = [A.join(X, A.comm(X, B)).scale(m) for (m, _), X in zip(body.pts, body.X)]
    for Pi in parts: req(Pi.wedge(Pi).is_zero(), 'each P_i is a 2-blade')
    nonblade = any(not (lambda P: P.wedge(P).is_zero())(body.I_def(A.rand_bivector(rng))) for _ in range(6)); req(nonblade, 'the total momentum is generally NOT a 2-blade in 3D')
    A2 = Alg(2); b2 = generic_body(A2, rng, 5)
    for _ in range(4): req(b2.I_def(A2.rand_bivector(rng)).grades() <= {1}, 'in 2D the total momentum is a 1-vector (a line)')
    b2a = generic_body(A, rng, 3); b2b = generic_body(A, rng, 4); both = Body(A, b2a.pts + b2b.pts); B = A.rand_bivector(rng)
    req(both.I_def(B) == b2a.I_def(B) + b2b.I_def(B), 'I of a union = sum of the I'); req(both.I_def(B + B.scale(2)) == both.I_def(B) + both.I_def(B).scale(2), 'I is linear')
    row('F18', '2.2.2-2.2.3, 2.2.7, eqs (2.11)-(2.13), pp.24, 28', 24, r'P=\sum_iP_i=\mathsf I_w[\mathbb B_w],\ \ \mathsf I_w[\mathbb B]=\sum_i m_iX_i\vee(X_i\times\mathbb B);\ \ \mathsf I_{X\cup Y}=\mathsf I_X+\mathsf I_Y',
        r'I[B]=\sum_i m_i\,\mathrm{join}(X_i,\,X_i\times B)', dims=[2, 3], how='each P_i is a blade; the total is a blade in 2D but generally not in 3D; the inertia of a union is the sum; I is linear')
    # 2.2.4 eq (2.14): body frame
    body = generic_body(A, rng, 4); M = A.rand_motor(rng); Bb = A.rand_bivector(rng); Bw = A.sand(M, Bb)
    Xw = [A.sand(M, X) for X in body.X]; Iw = A.zero()
    for (m, _), X in zip(body.pts, Xw): Iw = Iw + A.join(X, A.comm(X, Bw)).scale(m)
    req(A.sand(M.rev(), Iw) == body.I_def(Bb), 'I_b[B_b] = M~ I_w[M B_b M~] M  does not depend on M'); req(A.sand(M, body.I_def(Bb)) == Iw)
    row('F19', '2.2.4, eq (2.14), p.25', 25, r'\mathsf I_b[\mathbb B_b]\equiv\widetilde M\,\mathsf I_w[M\mathbb B_b\widetilde M]\,M\ \ (\text{depends on the body only})', r'M^\sim I_w[M B M^\sim] M = I_b[B]', dims=[3], how='random motor, body and rate; the world inertia is the body inertia moved by M')
    # 2.2.4 eq (2.18)/(A.4), A.5
    for d in DIMS:
        A = Alg(d); body = centroid_body(A, rng); req(body.centroidal())
        for _ in range(4):
            Bm = A.rand_euclid_bivector(rng); v = A.vec(A.rand_vec(rng)); B = Bm + A.eps * v
            lhs = body.I_def(B); rhs = A.vdot(v, A.O).scale(body.m) - body.IC(Bm) * A.I
            req(lhs == rhs, 'I_b[B + eps v] = m v.O - I_C[B] I   (2.18, A.4)')
            # A.5
            res = body.Iinv(A.vdot(v, A.O).scale(body.m) - body.IC(Bm) * A.I); req(res == B, 'I_b^-1 undoes I_b')
            res2 = body.Iinv(A.vdot(v, A.O) - Bm * A.I); req(res2 == A.eps * v.scale(1 / body.m) + IC_inv(body, Bm), 'I_b^-1[v.O - B I] = eps v/m + I_C^-1[B]   (A.5)')
    A = Alg(2); body = Body(A, [(F(1), [F(1), F(0)]), (F(1), [F(-1), F(0)]), (F(2), [F(0), F(1)]), (F(2), [F(0), F(-1)])]); Bm = A.E('12').scale(2); v = A.vec([1, 3]); B = Bm + A.eps * v
    row('F20', '2.2.4, eq (2.18); A.3-A.5, eqs (A.4)-(A.5), pp.26, 61-62', 26, r'\mathsf I_b[\mathbf B+\epsilon\mathbf v]=m\,\mathbf v\cdot O-\mathsf I_C[\mathbf B]\,\mathcal I;\ \ \mathsf I_C[\mathbf B]=\sum_im_i\mathbf r_i\wedge(\mathbf r_i\cdot\mathbf B);\ \ \mathsf I_b^{-1}[\mathbf v\cdot O-\mathbf B\mathcal I]=\epsilon\mathbf v/m+\mathsf I_C^{-1}[\mathbf B]',
        r'I[B+\epsilon v] = m\,(v\cdot O) - I_C[B]\,I', dims=list(DIMS), worked=W(A, body.I_def(B), A.vdot(v, A.O).scale(body.m) - body.IC(Bm) * A.I), how='centroidal body; I_C is the classical GA inertia; exact in d = 2, 3, 4')
    # 2.2.5-2.2.6, A.6-A.8: eigenbasis
    for d in DIMS:
        A = Alg(d); body = diag_body(A, rng); star = A.star
        for i in range(1, d + 1):
            for j in range(i + 1, d + 1):
                E = A.E(f'{i}{j}'); req(body.IC(E) == E.scale(body.i[(i, j)]), 'E_ij is an eigenblade of I_C'); req(body.I_def(E) == star(E).scale(body.i[(i, j)]), 'I_b[E_ij] = i_ij *E_ij  (2.22, A.7)')
        # the centroid of a diag_body with the extra origin mass is the origin
        for k in range(1, d + 1): e0 = A.g(0) * A.g(k); req(body.I_def(e0) == star(e0).scale(body.m), 'I_b[eps e_k] = m *(eps e_k)  (A.8)')
        B = A.rand_bivector(rng); w = A.zero()
        for m, c in B.d.items():
            w = w + star(MV(A.sq, {m: c})).scale(body.m if m & 1 else body.i[tuple(i for i in range(1, d + 1) if m >> i & 1)])
        req(body.I_def(B) == w, 'I_b[sum B_ij e_ij] = sum lambda_ij B_ij *e_ij  (2.22)')
        Ii = inverse(body.matrix()); req(len(Ii) == comb(d + 1, 2), 'the inertia map is invertible (2.21)')
        iv = body.Iinv(body.I_def(B)); req(iv == B, 'I^-1 I = id')
    A = Alg(3); body = diag_body(A, rng); bas = [A.E('23'), A.E('31'), A.E('12'), A.E('01'), A.E('02'), A.E('03')]
    # coordinates in the paper's basis (e23, e31, e12, e01, e02, e03): the map is [[0, m 1],[diag(i), 0]]
    def coords(P): return [P.d.get(1 << 2 | 1 << 3, F(0)), -P.d.get(1 << 1 | 1 << 3, F(0)), P.d.get(1 << 1 | 1 << 2, F(0)), P.d.get(1 | 1 << 1, F(0)), P.d.get(1 | 1 << 2, F(0)), P.d.get(1 | 1 << 3, F(0))]
    cols = [coords(body.I_def(b)) for b in bas]; Mx = [[cols[j][i] for j in range(6)] for i in range(6)]
    i1, i2, i3 = body.i[(2, 3)], body.i[(1, 3)], body.i[(1, 2)]
    want = [[0, 0, 0, body.m, 0, 0], [0, 0, 0, 0, body.m, 0], [0, 0, 0, 0, 0, body.m], [i1, 0, 0, 0, 0, 0], [0, i2, 0, 0, 0, 0], [0, 0, i3, 0, 0, 0]]
    req(Mx == [[F(x) for x in r] for r in want], 'the 6x6 matrix of the 3D inertia map (A.6)')
    row('F21', '2.2.5-2.2.6, eqs (2.19)-(2.22); A.5-A.6, eqs (A.7)-(A.8), pp.26-27, 63-64', 27, r'\mathsf I_b[\sum_{ij}[\mathbb B]_{ij}\mathbf e_{ij}]=\sum\lambda_{ij}[\mathbb B]_{ij}\star\mathbf e_{ij},\ \ \lambda_{ij}=i_{ij}\ (i,j\ne0),\ m\ (i=0);\ \ \text{3D matrix }\begin{pmatrix}0&m\mathbb 1\\ \mathsf I_C&0\end{pmatrix}',
        r'I[e_{ij}] = i_{ij}\star e_{ij},\ \ I[\epsilon e_k] = m\star(\epsilon e_k)', dims=list(DIMS), worked=None, how='a body with principal axes along the coordinate axes; also the 6 x 6 matrix in the basis (e23, e31, e12, e01, e02, e03) and the inverse')
    # A.7 parallel axis
    for d in (2, 3):
        A = Alg(d); body = centroid_body(A, rng)
        for _ in range(3):
            Bm = A.rand_euclid_bivector(rng); q = A.rand_vec(rng); qv = A.vec(q); Q = A.point(q)
            # classical: shifting the axis to Q adds m q^(q.B)
            shifted = Body(A, [(m, [a - b for a, b in zip(qq, q)]) for m, qq in body.pts]); lhs = A.zero()
            for m, qq in shifted.pts:
                r = A.vec(qq); lhs = lhs + r.wedge(A.vdot(r, Bm)).scale(m)
            req(lhs == body.IC(Bm) + qv.wedge(A.vdot(qv, Bm)).scale(body.m), 'I_C about another point = I_C + m q^(q.B)   (A.9)')
            # PGA: the same effect just by changing the argument: T_q B T~_q = B - eps (q.B)
            Tq = A.trans(q); Bs = A.sand(Tq, Bm); req(Bs == Bm - A.eps * A.vdot(qv, Bm), 'T_q B T~_q = B - eps(q.B)'); Bs2 = A.sand(A.one() + (A.eps * qv).scale(F(1, 2)), Bm); req(Bs2 == Bm + A.eps * A.vdot(qv, Bm), 'C.11: T_C = 1 + eps c/2 adds + eps (c.B)')
            lhs = body.I_def(Bs); rhs = -(A.vdot(A.vdot(qv, Bm), Q)).scale(body.m) - (body.IC(Bm) + qv.wedge(A.vdot(qv, Bm)).scale(body.m)) * A.I
            req(lhs == rhs, 'I_b[T_q B T~_q] = -m (q.B).Q - (I_C[B] + m q^(q.B)) I   (A.7)')
    A = Alg(3); row('F22', 'A.7, eqs (A.9) and p.65', 65, r'\mathsf I_C[\mathbf B]'+"'"+r'=\mathsf I_C[\mathbf B]+m\,\mathbf q\wedge(\mathbf q\cdot\mathbf B);\ \ \mathsf I_b[\mathbb T_q\mathbf B\widetilde{\mathbb T}_q]=-m(\mathbf q\cdot\mathbf B)\cdot Q-(\mathsf I_C[\mathbf B]+m\mathbf q\wedge(\mathbf q\cdot\mathbf B))\mathcal I',
        r'I[T B \tilde T] = -m((q\cdot B)\cdot Q) - (I_C[B] + m\,q\wedge(q\cdot B))\,I', dims=[2, 3], how='no parallel-axis theorem: shifting the axis only changes the argument. The stray editing note inside p.65 ("[[[ but sdo we care ... ]]]") is still in the text of version 2.6')
    ROWS[-1]['remark'] = 'Exact. The page also contains a leftover draft note: "[[[ but sdo we care how teh cetnroid moves? Should we not want Q? ]]]" (p. 65, in the point-split paragraph).'
    # A.8, eq (A.10): P = p.C - L I
    for d in (2, 3):
        A = Alg(d); body = generic_body(A, rng, 5)
        for _ in range(3):
            Bm = A.rand_euclid_bivector(rng); v = A.vec(A.rand_vec(rng)); B = Bm + A.eps * v; P = body.I_def(B)
            c = body.c; C = A.point(c); xd = []                     # world velocities of the mass points
            pvec = A.zero(); L = A.zero()
            for (m, q), X in zip(body.pts, body.X):
                vel = A.vec([vi for vi in [(A.vec(list(v.d.get(1 << (i + 1), F(0)) for i in range(d))) + A.vdot(A.vec(q), Bm)).d.get(1 << (i + 1), F(0)) for i in range(d)]])
                pvec = pvec + vel.scale(m)
            cvel = pvec.scale(1 / body.m)
            for (m, q), X in zip(body.pts, body.X):
                vel = A.vec(list(v.d.get(1 << (i + 1), F(0)) for i in range(d))) + A.vdot(A.vec(q), Bm); r = A.vec([a - b for a, b in zip(q, c)])
                L = L + r.wedge(vel - cvel).scale(m)
            req(P == A.vdot(pvec, C) - L * A.I, 'P = p.C - L I  (A.10)')
    A = Alg(3); row('F23', 'A.8, eq (A.10), p.66', 66, r'P=\mathbf p\cdot C-\mathbf L\mathcal I\ \ (\mathbf p=m\dot{\mathbf c},\ \mathbf L=\textstyle\sum m\,\mathbf r_i\wedge\dot{\mathbf r}_i)', r'I[B] = p\cdot C - L\,I', dims=[2, 3], how='general rigid body, general rate; p and L are computed classically from the point velocities')

def bil_ser(f, X, Y):
    N = len(X.c); z = f(X.c[0].scale(0), Y.c[0].scale(0)); r = [z for _ in range(N)]
    for i in range(N):
        if not X.c[i].d: continue
        for j in range(N - i):
            if Y.c[j].d: r[i + j] = r[i + j] + f(X.c[i], Y.c[j])
    return Ser(r)
def lin_ser(f, X): return Ser([f(c) for c in X.c])
def ideal_to_vec(A, Xd):
    """u with u I = Xd"""
    out = {}
    for j in range(1, A.d + 1):
        img = A.g(j) * A.I; (m, c), = img.d.items(); out[1 << j] = Xd.d.get(m, F(0)) / c
    return MV(A.sq, out)

# ================================================================================================= forque: force lines, torques
def forques(seed):
    rng = random.Random(seed)
    for d in DIMS:
        A = Alg(d)
        for _ in range(5):
            q = A.rand_vec(rng); r = A.rand_vec(rng); f = A.vec(A.rand_vec(rng)); Q = A.point(q); R = A.point(r)
            req(A.join(Q, f * A.I) == A.vdot(f, Q), 'F = Q v (f I) = f.Q  (2.25)')
            qr = A.vec([a - b for a, b in zip(q, r)]); T = qr.wedge(f)
            req(A.vdot(f, Q) == A.vdot(f, R) - T * A.I, 'f.Q = f.R - T_R I  with T_R = (q-r)^f   (2.26)')
            req(A.vdot(f, Q) != A.vdot(f, R) + T * A.I or T.is_zero())
        # A.16
        pts = [(A.rand_vec(rng), A.vec(A.rand_vec(rng))) for _ in range(4)]; Ft = A.zero(); fs = A.zero(); To = A.zero()
        for q, f in pts: Ft = Ft + A.vdot(f, A.point(q)); fs = fs + f; To = To + A.vec(q).wedge(f)
        req(Ft == A.vdot(fs, A.O) - To * A.I, 'F = sum f_i.Q_i = f.O - T_O I   (A.16)')
    A = Alg(3); f = A.vec([1, 2, 0]); q = [0, 1, 1]; r = [1, 0, 0]; T = A.vec([a - b for a, b in zip(q, r)]).wedge(f)
    # 3D: T_R I3 = -tau,  tau = (q-r) x f   (C.12)
    qr = A.vec([a - b for a, b in zip(q, r)]); I3 = A.O; cross = (qr.wedge(f) * I3).scale(-1)
    row('F24', '2.3.1-2.3.3, eqs (2.25)-(2.26), A.9 eq (A.16), pp.31-33, 68', 31, r'F=Q\vee(\mathbf f\mathcal I)=\mathbf f\cdot Q=\mathbf f\cdot R-\mathbf T_R\mathcal I;\ \ F=\sum_i\mathbf f_i\cdot Q_i=\mathbf f\cdot O-\mathbf T_O\mathcal I',
        r'F = f\cdot Q = f\cdot R - T_R\,I,\quad T_R=(q-r)\wedge f', dims=list(DIMS), worked=W(A, A.vdot(f, A.point(q)), A.vdot(f, A.point(r)) - T * A.I), how='exact in d = 2, 3, 4; the torque is the 2-blade (q-r)^f, in 3D its dual is the classical torque')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'Exact with T_R = (q - r) ^ f. On p.31 the line "T_R = (r - q) ^ f" has the opposite sign (it would also give T_R I = +tau instead of -tau). A.16 (T_O = sum q_i ^ f_i) is consistent with the corrected form.'

# ================================================================================================= the equations of motion, as exact power series
def make_state(A, body, M, B): return [M, B]
def dyn_check(seed, d, N, kind, with_energy=True, sp=1):
    rng = random.Random(seed); A = Alg(d, sp); body = generic_body(A, rng, 4); M0 = A.rand_motor(rng); B0 = A.rand_bivector_nz(rng)
    g = A.vec([F(0), F(-1)] + [F(0)] * (d - 2)) if d >= 2 else A.vec([F(-1)]); gI = g * A.I
    Cb = A.point(body.c); Aw = A.point([F(1), F(2)] + [F(0)] * (d - 2)); Pb = body.X[0]; k = F(3)
    def Fb(S):
        M = S[0]
        if kind == 'free': return Ser.const(A.zero(), N)
        if kind == 'gravity':
            gb = M.rev() * Ser.const(gI, N) * M; return bil_ser(A.join, Ser.const(Cb, N), gb).scale(body.m)
        if kind == 'spring':
            ab = M.rev() * Ser.const(Aw, N) * M; return bil_ser(A.join, Ser.const(Pb, N), ab).scale(k)
        raise ValueError(kind)
    def f(S):
        M, B = S; IB = lin_ser(body.I, B); rhs = comm_ser(A, B, IB) + Fb(S)          # B x I[B] + F_b
        return [(M * B).scale(F(-1, 2)), lin_ser(body.Iinv, rhs)]
    M, B = picard(f, [M0, B0], N)
    # (2.29) and (2.28) hold by construction; now test them against Newton's law for the mass points
    Xs = [M * Ser.const(X, N) * M.rev() for X in body.X]; Xd = [x.d_dt() for x in Xs]
    P = Ser.const(A.zero(), N)
    for (m, _), X, Y in zip(body.pts, Xs, Xd): P = P + bil_ser(A.join, X, Y).scale(m)
    if kind == 'free': Fw = Ser.const(A.zero(), N)
    elif kind == 'gravity':
        Fw = Ser.const(A.zero(), N)
        for (m, _), X in zip(body.pts, Xs): Fw = Fw + bil_ser(A.join, X, Ser.const(gI, N)).scale(m)
    else: Fw = bil_ser(A.join, Xs[0], Ser.const(Aw, N)).scale(k)
    Pdot = P.d_dt()
    req(ser_equal(Pdot, Fw, N - 2), f'Pdot = F  ({kind}, d={d})')                                    # Newton's law, from the points
    req(ser_equal(P, M * lin_ser(body.I, B) * M.rev(), N - 1), 'P = M I_b[B_b] M~')                 # (2.12)/(2.14)
    req(ser_equal(Fw, M * Fb([M, B]) * M.rev(), N - 1), 'F_w = M F_b M~')
    nontrivial = not all(c.is_zero() for c in Pdot.c[:2]) or kind == 'free'
    if kind != 'free': req(nontrivial, 'the test is not vacuous')
    # free: momentum conserved even though B_b changes
    if kind == 'free':
        req(any(not c.is_zero() for c in B.d_dt().c[:N - 2]), 'B_b is not constant in the free case (a tumbling body)'); req(ser_vanish(Pdot, N - 2), 'P is conserved')
    res = {'d': d, 'kind': kind, 'order': N - 2}
    if with_energy:
        IB = lin_ser(body.I, B); Tj = bil_ser(A.join, B, IB).scale(F(1, 2)); Tw = bil_ser(lambda a, b: a.wedge(b), B, IB).scale(F(1, 2))
        # classical kinetic energy from the point velocities
        Tc = Ser.const(A.zero(), N)
        for (m, _), Y in zip(body.pts, Xd):
            u = Ser([ideal_to_vec(A, c) for c in Y.c]); Tc = Tc + bil_ser(lambda a, b: MV(A.sq, {0: (a * b).scalar()}), u, u).scale(m / 2)
        req(ser_equal(Tj, Tc, N - 2) or ser_equal(Tj, Tc.scale(-1), N - 2), 'T = (1/2) B v I[B] equals (1/2) sum m |xdot|^2 up to a sign'); res['T_join_sign'] = 1 if ser_equal(Tj, Tc, N - 2) else -1
        Tw_scalar = Ser([MV(A.sq, {0: c.d.get(A.full, F(0)) / A.I.d[A.full]}) for c in Tw.c]); res['T_wedge_sign'] = 1 if ser_equal(Tw_scalar, Tc, N - 2) else (-1 if ser_equal(Tw_scalar, Tc.scale(-1), N - 2) else 0)
        Pi = bil_ser(A.join, B, Fb([M, B])); Tdot = Tj.d_dt(); sg = res['T_join_sign']
        res['Tdot_eq_Pi'] = ser_equal(Tdot, Pi, N - 3); res['Tdot_eq_minus_Pi'] = ser_equal(Tdot, Pi.scale(-1), N - 3)
        # classical power  sum f_i . xdot_i  for the gravity case
        if kind == 'gravity':
            Pc = Ser.const(A.zero(), N)
            for (m, _), Y in zip(body.pts, Xd): u = Ser([ideal_to_vec(A, c) for c in Y.c]); Pc = Pc + bil_ser(lambda a, b: MV(A.sq, {0: (a * b).scalar()}), u, Ser.const(g.scale(m), N))
            res['power_join_matches_classical'] = ser_equal(Pi, Pc, N - 3); res['power_join_matches_minus_classical'] = ser_equal(Pi, Pc.scale(-1), N - 3)
    return res

def dyn_negative(seed, N=6):
    """the same test with a deliberately broken equation of motion must FAIL: no 'B x I[B]' term, or a wrong kinematic factor"""
    rng = random.Random(seed); A = Alg(3); body = generic_body(A, rng, 4); M0 = A.rand_motor(rng); B0 = A.rand_bivector_nz(rng); out = {}
    for bad in ('no_commutator', 'no_half', 'wrong_sign_commutator'):
        def f(S):
            M, B = S; IB = lin_ser(body.I, B); c = comm_ser(A, B, IB)
            if bad == 'no_commutator': c = c.scale(0)
            if bad == 'wrong_sign_commutator': c = c.scale(-1)
            return [(M * B).scale(F(-1, 1) if bad == 'no_half' else F(-1, 2)), lin_ser(body.Iinv, c)]
        M, B = picard(f, [M0, B0], N); Xs = [M * Ser.const(X, N) * M.rev() for X in body.X]; P = Ser.const(A.zero(), N)
        for (m, _), X in zip(body.pts, Xs): P = P + bil_ser(A.join, X, X.d_dt()).scale(m)
        out[bad] = not ser_vanish(P.d_dt(), N - 2)          # a conserved momentum in the free case would give zero
    return out

def newton_euler_rows(seed, N=8):
    res = []
    for d, kind in ((2, 'free'), (2, 'gravity'), (2, 'spring'), (3, 'free'), (3, 'gravity'), (3, 'spring')): res.append(dyn_check(seed, d, N, kind))
    neg = dyn_negative(seed, N - 2); req(all(neg.values()), 'a broken equation of motion must violate Pdot = F: ' + str(neg))
    A = Alg(3); eg = {'d': 3, 'kinds': ['free', 'gravity', 'spring'], 'order': N - 2}
    row('F25', '2.4.1, eqs (2.27)-(2.29), Table 2.1, pp.34-35', 34, r'\dot P=F;\ \ \mathsf I_b[\mathbb B]=\sum m_iX_i\vee(X_i\times\mathbb B);\ \ \dot{\mathbb B}_b=\mathsf I_b^{-1}[\mathbb B_b\times\mathsf I_b[\mathbb B_b]+F_b];\ \ \dot M=-\tfrac12M\mathbb B_b',
        r'\dot{B}=I^{-1}[\,B\times I[B]+F_b\,],\ \ \dot M=-\tfrac12 M B', dims=[2, 3], worked=None,
        how=f'the state (M, B_b) is solved as an exact power series (Picard iteration) through order {N - 1}; the mass points move as X_i = M X_i^b M~; then d/dt sum m_i X_i v Xdot_i equals the sum of the forques, term by term, for no forque, gravity (2.31) and a Hooke spring. Negative controls: dropping B x I[B], flipping its sign, or dropping the 1/2 each break Pdot = F',
        )
    ROWS[-1]['extra'] = {'cases': res, 'negative_controls_fail': neg}
    row('F26', '2.7.2-2.7.3, eqs (2.34)-(2.37); A.12-A.13, pp.49, 73', 49, r'T=\tfrac12\mathbb B_b\vee\mathsf I_b[\mathbb B_b],\ \ T\mathcal I=\tfrac12\mathbb B_b\wedge\mathsf I_b[\mathbb B_b];\quad \Pi=\mathbb B\vee F,\ \ \Pi\mathcal I=\mathbb B\wedge F',
        r'T=\tfrac12\,\mathrm{join}(B, I[B]),\ \ \Pi=\mathrm{join}(B,F)', dims=[2, 3], worked=None,
        how='the join and the wedge forms of T both equal the classical sum of (1/2) m |xdot|^2 (the wedge form read as the coefficient of I); dT/dt = Pi = B v F along the motion (power series), and dT/dt = 0 for the free body')
    ROWS[-1]['extra'] = {'T_join_sign': {str(c['d']) + c['kind']: c['T_join_sign'] for c in res}, 'T_wedge_sign': {str(c['d']) + c['kind']: c['T_wedge_sign'] for c in res},
                          'Tdot_equals_Pi': {str(c['d']) + c['kind']: c['Tdot_eq_Pi'] for c in res}}
    req(all(c['T_join_sign'] == 1 and c['T_wedge_sign'] == 1 for c in res)); req(all(c['Tdot_eq_Pi'] for c in res))
    return res

def euler_laws(seed):
    rng = random.Random(seed)
    for d in DIMS:
        A = Alg(d); body = centroid_body(A, rng)
        # the map (p, P) -> p.O + P I  is injective: this is Theorem 1 (C.14)
        vecs = [A.vec([F(int(i == j)) for i in range(d)]) for j in range(d)]; eb = [m for m in A.bivectors() if not m & 1]
        cols = [A.vdot(v, A.O) for v in vecs] + [MV(A.sq, {b: F(1)}) * A.I for b in eb]
        masks = sorted({m for c in cols for m in c.d}); Mx = [[c.d.get(m, F(0)) for c in cols] for m in masks]
        from math import comb as _c
        req(rank(Mx) == d + _c(d, 2), 'C.4: p.C + P I = q.C + Q I  implies p = q and P = Q')
        for _ in range(3):
            Ae = A.rand_euclid_bivector(rng); a = A.vec(A.rand_vec(rng)); Bd = Ae + A.eps * a; P = body.I_def(Bd)
            f = a.scale(body.m); T = body.IC(Ae)
            req(P == A.vdot(f, A.O) - T * A.I, 'I_b[Bdot] = f.O - T I  with  f = m vdot,  T = I_C[Bdot]   (A.17-A.19)')
    A = Alg(3)
    row('F27', 'A.10, eqs (A.17)-(A.19); C.4, eq (C.14), pp.68, 87', 68, r'F_b=\dot P_b=\mathsf I_b[\dot{\mathbb B}_b]\ \Rightarrow\ m\dot{\mathbf v}_b=\mathbf f_b,\ \ \mathsf I_C[\dot{\mathbf B}_b]=\mathbf T_b;\ \ \mathbf p\cdot C+\mathbf P\mathcal I=\mathbf q\cdot C+\mathbf Q\mathcal I\iff\mathbf p=\mathbf q,\mathbf P=\mathbf Q',
        r'I[\dot B] = F\ \Rightarrow\ m\,a = f,\ I_C[\dot A]=T', dims=list(DIMS), how='Euler\'s two laws are the two parts of one equation; the splitting is legitimate because (p, P) -> p.O + P I is injective (rank test)')

def rank(M):
    M = [r[:] for r in M]; rk = 0; nc = len(M[0]) if M else 0
    for c in range(nc):
        p = next((i for i in range(rk, len(M)) if M[i][c] != 0), None)
        if p is None: continue
        M[rk], M[p] = M[p], M[rk]
        for i in range(len(M)):
            if i != rk and M[i][c] != 0: f = M[i][c] / M[rk][c]; M[i] = [x - f * y for x, y in zip(M[i], M[rk])]
        rk += 1
    return rk

# ================================================================================================= 2.5.4 and 2.5.8: motors and the optimised 3D formulas
def motors_and_formulas(seed):
    rng = random.Random(seed); N = 10
    # 2.5.4: exp(alpha B) for B^2 = 0, -1 (and +1 in a Lorentz base)
    for sq, name, sign in (([0, 1, 1, 1], 'e01', 0), ([0, 1, 1, 1], 'e12', -1), ([0, 1, -1], 'e12 (one time-type axis)', 1)):
        A = Alg(len(sq) - 1, 1); A.sq = sq; Bb = MV(sq, {(3 if name == 'e01' else 6): F(1)}); BB = Bb * Bb
        req(BB == MV(sq, {0: F(sign)}) if sign else BB.is_zero(), 'square of the unit bivector')
        E = ser_exp(Bb, F(1), N); one = MV(sq, {0: F(1)}); fact = 1
        for k in range(N + 1):
            if k: fact *= k
            if sign == 0: want = one if k == 0 else (Bb if k == 1 else MV(sq, {}))
            elif sign == -1: want = (one.scale(F((-1) ** (k // 2), fact)) if k % 2 == 0 else Bb.scale(F((-1) ** (k // 2), fact)))
            else: want = (one.scale(F(1, fact)) if k % 2 == 0 else Bb.scale(F(1, fact)))
            req(E.c[k] == want, f'exp series of {name} at order {k}')
    # 2.5.8 motor normalisation, their basis names
    A = Alg(3)
    def motor(m0, m01, m02, m03, m12, m31, m23, m0123): return (A.one().scale(F(m0)) + A.E('01').scale(F(m01)) + A.E('02').scale(F(m02)) + A.E('03').scale(F(m03)) + A.E('12').scale(F(m12))
                                                                 + A.E('31').scale(F(m31)) + A.E('23').scale(F(m23)) + A.E('0123').scale(F(m0123)))
    for _ in range(10):
        c = [rng.randint(-3, 3) for _ in range(8)]; M = motor(*c); m0, m01, m02, m03, m12, m31, m23, m0123 = c
        MM = M * M.rev(); want = A.one().scale(F(m0 ** 2 + m12 ** 2 + m31 ** 2 + m23 ** 2)) + A.E('0123').scale(F(2 * (m0 * m0123 - m01 * m23 - m02 * m31 - m03 * m12)))
        req(MM == want, 'M M~ = (m0^2 + m12^2 + m31^2 + m23^2) + 2(m0 m0123 - m01 m23 - m02 m31 - m03 m12) e0123')
    ok_norm = []
    for (m0, m12, m31, m23) in ((1, 2, 2, 4), (2, 3, 6, 0), (1, 4, 8, 0), (0, 2, 3, 6)):
        c = [m0, rng.randint(-3, 3), rng.randint(-3, 3), rng.randint(-3, 3), m12, m31, m23, rng.randint(-3, 3)]; M = motor(*c); n2 = m0 ** 2 + m12 ** 2 + m31 ** 2 + m23 ** 2
        s = F(1, int(round(n2 ** 0.5))); req(s * s * n2 == 1); dd = s * s * (m0 * c[7] - c[1] * m23 - c[2] * m31 - c[3] * m12)
        Mn = (M + (A.E('01').scale(F(m23)) + A.E('02').scale(F(m31)) + A.E('03').scale(F(m12)) - A.E('0123').scale(F(m0))).scale(dd)).scale(s)
        ok_norm.append(Mn * Mn.rev() == A.one())
    req(all(ok_norm), 'M/sqrt(M M~) = s (M + d (m23 e01 + m31 e02 + m12 e03 - m0 e0123))')
    c = [1, 1, 0, 2, 2, 2, 4, 3]; M = motor(*c)
    row('F28', '2.5.4, 2.5.8, p.39, 42-44', 42, r'e^{\alpha\bar B}=1+\alpha\bar B\,(\bar B^2=0),\ \cos\alpha+\bar B\sin\alpha\,(-1),\ \cosh\alpha+\bar B\sinh\alpha\,(+1);\ \ M\widetilde M=(m_\emptyset^2+m_{12}^2+m_{31}^2+m_{23}^2)+2(m_\emptyset m_{0123}-m_{01}m_{23}-m_{02}m_{31}-m_{03}m_{12})\mathbf e_{0123}',
        r'MM^\sim = a + b\,e_{0123}\ \ (\text{Study number})', dims=[3], worked=W(A, M * M.rev(), A.one().scale(F(1 + 4 + 16 + 4)) + A.E('0123').scale(F(2 * (1 * 3 - 1 * 4 - 0 * 2 - 2 * 2)))),
        how='exact power series for the three exponentials (the cosh case needs a Lorentz-type base, i.e. one generator of the other sign); the Study-number identity on random integer coefficients; and the renormalised motor M/sqrt(M M~) = s(M + d(...)) has M M~ = 1')
    # 2.5.8 uniform inertia: Bdot
    body = unit_body(A); bas = {'01': A.E('01'), '02': A.E('02'), '03': A.E('03'), '12': A.E('12'), '31': A.E('31'), '23': A.E('23')}
    for b in bas.values(): req(body.I_def(b) == A.star(b), 'for a body with m = 1 and i = 1, the inertia map is the Hodge star')
    for _ in range(6):
        v = {k: F(rng.randint(-3, 3)) for k in bas}; B = A.zero()
        for k, b in bas.items(): B = B + b.scale(v[k])
        Bd = A.istar(A.comm(B, A.star(B)))
        # classical check, independent of the star: vdot = -omega x v with omega = (b23, b31, b12), v = (b01, b02, b03)
        om = (v['23'], v['31'], v['12']); vv = (v['01'], v['02'], v['03']); cr = (om[1] * vv[2] - om[2] * vv[1], om[2] * vv[0] - om[0] * vv[2], om[0] * vv[1] - om[1] * vv[0])
        want = bas['01'].scale(-cr[0]) + bas['02'].scale(-cr[1]) + bas['03'].scale(-cr[2])
        req(Bd == want, 'Bdot = *^-1(B x *B) = -omega x v on the e0k part, and 0 on the rotation part')
        printed = bas['01'].scale(v['02'] * v['12'] - v['03'] * v['31']) + bas['02'].scale(-v['01'] * v['12'] - v['03'] * v['23']) + bas['03'].scale(v['01'] * v['31'] - v['02'] * v['23'])
        mine_e02 = v['03'] * v['23'] - v['01'] * v['12']; req(want.d.get(5, F(0)) == mine_e02)
        req(body.Iinv(A.comm(B, body.I(B))) == Bd)
    v = {'01': 1, '02': 2, '03': 0, '12': 3, '31': -1, '23': 2}; B = A.zero()
    for k, b in bas.items(): B = B + b.scale(F(v[k]))
    row('F29', '2.5.6, 2.5.8, pp.40, 44', 44, r'\dot{\mathbb B}=\star^{-1}(\mathbb B\times\star\mathbb B)=(b_{02}b_{12}-b_{03}b_{31})\mathbf e_{01}+(-b_{01}b_{12}-b_{03}b_{23})\mathbf e_{02}+(b_{01}b_{31}-b_{02}b_{23})\mathbf e_{03}',
        r'\dot B = I^{-1}[B\times I[B]],\ \ I=\star', dims=[3], worked=W(A, A.istar(A.comm(B, A.star(B))), bas['01'].scale(F(2 * 3 - 0)) + bas['02'].scale(F(0 * 2 - 1 * 3)) + bas['03'].scale(F(1 * -1 - 2 * 2))),
        how='a body with unit mass and unit principal inertias has I = star exactly (built from point masses with rational positions); the e01 and e03 coefficients of the printed six-multiplication formula are reproduced; the e02 coefficient is (b03 b23 - b01 b12), the printed one has -b03 b23')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'Checked against the classical vdot = -omega x v (independent of the star): e01 and e03 agree with the printed formula; the e02 coefficient is (b03 b23 - b01 b12), whereas the printed one is (-b01 b12 - b03 b23).'
    # gravity forque
    out = []
    for (a, b_, c_, e) in ((F(1, 2), F(1, 2), F(1, 2), F(1, 2)), (F(3, 5), F(4, 5), 0, 0), (F(1, 3), F(2, 3), F(2, 3), 0), (F(2, 7), F(3, 7), F(6, 7), 0), (0, F(1, 3), F(2, 3), F(2, 3))):
        a, b_, c_, e = F(a), F(b_), F(c_), F(e); Mr = A.one().scale(a) + A.E('12').scale(b_) + A.E('31').scale(c_) + A.E('23').scale(e); req((Mr * Mr.rev()) == A.one())
        Fg = A.star(A.sand(Mr.rev(), A.eps * A.g(2)))
        mine = {'e12': Fg.d.get(6, F(0)), 'e31': -Fg.d.get(10, F(0)), 'e23': Fg.d.get(12, F(0))}
        printed = {'e12': 2 * (a * e + b_ * c_), 'e31': 1 - 2 * (b_ ** 2 + e ** 2), 'e23': 2 * (c_ - a * b_)}
        alt = {'e12': 2 * (a * e + b_ * c_), 'e31': 1 - 2 * (b_ ** 2 + e ** 2), 'e23': 2 * (c_ * e - a * b_)}
        out.append((mine, printed, alt))
    ok_alt = all(m == al for m, _, al in out); ok_pr = all(m == p for m, p, _ in out)
    req(ok_alt or ok_pr, 'the gravity forque coefficients (p.44) match one of the two readings')
    A3 = Alg(3); r0 = out[0]
    row('F30', '2.5.7-2.5.8, eqs (2.31), p.41, 44', 44, r'F_g=-9.81\star(\widetilde M\mathbf e_{02}M)\ \to\ 2(m_\emptyset m_{23}+m_{12}m_{31})\mathbf e_{12}+(1-2(m_{12}^2+m_{23}^2))\mathbf e_{31}+2(m_{31}-m_\emptyset m_{12})\mathbf e_{23}',
        r'\star(\tilde M\,\epsilon e_2\,M)', dims=[3], worked=None, how='for unit rotors with rational components: the e12 and e31 coefficients agree with the printed ones; the e23 coefficient is 2(m31 m23 - m0 m12), the printed 2(m31 - m0 m12) lacks a factor m23 (dimensionally the other two terms are quadratic)')
    ROWS[-1]['status'] = 'ok' if ok_pr else 'note'
    if not ok_pr: ROWS[-1]['note'] = 'With the rotor M = m0 + m12 e12 + m31 e31 + m23 e23 we find the e23 coefficient 2(m31 m23 - m0 m12); the printed text reads 2(m31 - m0 m12), which looks like a dropped factor m23 (the other two coefficients agree exactly).'
    ROWS[-1]['extra'] = {'examples': [{k: [fmt_q(m[k]), fmt_q(p[k])] for k in m} for m, p, _ in out[:3]]}

def unit_body(A):
    """m = 1 and all principal inertias 1 with rational points: +-2 e_k with mass 1/16 each, and mass 5/8 at the origin (d = 3)"""
    pts = []
    for k in range(A.d):
        q = [F(0)] * A.d; q[k] = F(2); pts += [(F(1, 16), q[:]), (F(1, 16), [-x for x in q])]
    pts.append((F(1) - F(2 * A.d, 16), [F(0)] * A.d)); return Body(A, pts)

def cuboid(seed):
    A = Alg(3); w, h, dd, m = F(2), F(3), F(5), F(6)
    # 3x3x3 Simpson rule is exact for quadratics: weights (1,4,1)/6 on (-1/2, 0, 1/2) of each side
    pts = []
    for ix, wx in ((-1, F(1, 6)), (0, F(4, 6)), (1, F(1, 6))):
        for iy, wy in ((-1, F(1, 6)), (0, F(4, 6)), (1, F(1, 6))):
            for iz, wz in ((-1, F(1, 6)), (0, F(4, 6)), (1, F(1, 6))): pts.append((m * wx * wy * wz, [w * ix / 2, h * iy / 2, dd * iz / 2]))
    body = Body(A, pts); req(body.m == m and body.centroidal())
    # I_C[e_ij] = i_ij e_ij (e31 = -mask10: the coefficient of mask 10 flips sign twice, so use the eigenvalue form)
    e23, e31, e12 = (body.IC(A.E(n)) for n in ('23', '31', '12'))
    ev = (e23 == A.E('23').scale(m * (h * h + dd * dd) / 12), e31 == A.E('31').scale(m * (w * w + dd * dd) / 12), e12 == A.E('12').scale(m * (w * w + h * h) / 12))
    req(all(ev), 'solid cuboid: I_C = (m/12) diag(h^2+d^2, w^2+d^2, w^2+h^2) on (e23, e31, e12)')
    req(body.I_def(A.E('23')) == A.E('01').scale(m * (h * h + dd * dd) / 12), 'I[e23] = m(h^2+d^2)/12 e01'); req(body.I_def(A.E('01')) == A.E('23').scale(m))
    row('F31', '2.5.8, p.45', 45, r'\mathsf I_C=\tfrac m{12}\mathrm{diag}(h^2+d^2,\,w^2+d^2,\,w^2+h^2);\ \ C=m\big(\tfrac{h^2+d^2}{12}\mathbf e_{03}+\tfrac{w^2+d^2}{12}\mathbf e_{02}+\tfrac{w^2+h^2}{12}\mathbf e_{01}+\mathbf e_{12}+\mathbf e_{31}+\mathbf e_{23}\big)',
        r'I[e_{23}]=\tfrac m{12}(h^2+d^2)\,e_{01},\ \ I[e_{01}]=m\,e_{23}', dims=[3], worked=None,
        how='the cuboid is integrated exactly (3x3x3 Simpson weights are exact for quadratics). The map sends the rotation about x (e23) to (m/12)(h^2+d^2) e01.')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'With w, h, d along x, y, z the exact map sends e23 to m(h^2+d^2)/12 e01, e31 to m(w^2+d^2)/12 e02, e12 to m(w^2+h^2)/12 e03. The printed C lists (h^2+d^2)/12 with e03 and (w^2+h^2)/12 with e01, i.e. in the reverse order; a relabelling of the axes (w along z?) or an index swap. Worth a look.'

# ================================================================================================= Appendix B: free tops
def free_flow_checks(A, body, Bser, Mser, N):
    """Bdot = I^-1[B x I[B]]  and  Mdot = -1/2 M B  as series identities"""
    IB = lin_ser(body.I, Bser); rhs = lin_ser(body.Iinv, comm_ser(A, Bser, IB))
    return ser_equal(Bser.d_dt(), rhs, N - 2) and ser_equal(Mser.d_dt(), (Mser * Bser).scale(F(-1, 2)), N - 2)
def cube_body(A):
    import itertools
    return Body(A, [(F(1), [F(s) for s in signs]) for signs in itertools.product((-1, 1), repeat=A.d)])
def sym_body(A):
    """+-a e1, +-a e2 (mass mu), +-c e3 (mass nu), mass at the origin: i = i_23 = i_31, i3 = i_12"""
    a, c, mu, nu = F(2), F(3), F(1), F(2); pts = [(mu, [a, 0, 0]), (mu, [-a, 0, 0]), (mu, [0, a, 0]), (mu, [0, -a, 0]), (nu, [0, 0, c]), (nu, [0, 0, -c]), (F(3), [0, 0, 0])]
    b = Body(A, [(m, [F(x) for x in q]) for m, q in pts])
    b.i1 = 2 * (mu * a * a + nu * c * c); b.i2 = b.i1; b.i3 = 2 * (mu * a * a + mu * a * a); return b
def tops(seed, N=8):
    rng = random.Random(seed); A = Alg(3)
    # ---- B.2 spherical top
    body = cube_body(A); i = body.IC(A.E('12')).d[6]
    for n in ('23', '31', '12'): req(body.IC(A.E(n)) == A.E(n).scale(i), 'the cube has equal principal inertias')
    B0 = A.rand_euclid_bivector(rng).scale(1); v0 = A.vec(A.rand_vec(rng, -2, 2)); M0 = A.rand_motor(rng)
    MB = ser_exp(B0, F(-1, 2), N); Bb = Ser.const(B0, N) + MB.rev() * Ser.const(A.eps * v0, N) * MB                       # (B.5)
    vw0 = A.sand(M0, A.eps * v0); Mv = ser_exp(vw0, F(-1, 2), N); M = Mv * Ser.const(M0, N) * MB                           # (B.6) M = e^{-(p/m)t/2} M0 e^{-(L_b/i)t/2}
    req(free_flow_checks(A, body, Bb, M, N), 'spherical top: (B.5)-(B.6) solve Bdot = I^-1[B x I[B]] and Mdot = -M B/2')
    row('F32', 'B.2, eqs (B.3)-(B.6), pp.76-77', 76, r'\dot{\mathbb B}_b=-\epsilon(\mathbf v_b\cdot\mathbf B_b);\ \ \mathbb B_b=\mathbf B_0+\widetilde M_{B_0}(\epsilon\mathbf v_0)M_{B_0};\ \ M=e^{-(\mathbf p/m)t/2}M_0e^{-(\mathbf L_b/i)t/2}',
        r'M(t)=e^{-v_w t/2}\,M_0\,e^{-B_0 t/2}', dims=[3], worked=None, how=f'free spherical top (a cube): exact series through order {N - 3}. With B_0 = L_b / i and p/m = M_0 (eps v_0) M_0~: the two exponentials do not commute and cannot be merged')
    # ---- B.3 symmetric top
    body = sym_body(A); i, i3 = body.i1, body.i3
    req(body.IC(A.E('23')) == A.E('23').scale(i) and body.IC(A.E('31')) == A.E('31').scale(i) and body.IC(A.E('12')) == A.E('12').scale(i3), 'symmetric top eigenvalues'); req(i != i3)
    B0 = A.E('23').scale(F(2)) + A.E('31').scale(F(-1)) + A.E('12').scale(F(3)); v0 = A.vec([F(1), F(2), F(-1)])
    IC = lambda X: body.IC(X)
    # (B.7)
    for X in (B0, A.rand_euclid_bivector(rng)):
        c3 = X.d.get(6, F(0)); req(IC(X) == X.scale(i) + A.E('12').scale((i3 - i) * c3), 'I_C[B] = i B + (i3 - i)[B]_3 E3   (B.7)')
    c3 = B0.d.get(6, F(0)); Aax = A.E('12').scale((1 - i3 / i) * c3); Lb = IC(B0)
    req(B0 - Aax == Lb.scale(1 / i), 'B_0 - A = L_b / i   (B.12)')
    printed_b14 = A.E('12').scale((i - i3) * Lb.d.get(6, F(0)))                                     # "(i1 - i3)[L_b]_3 E3" as printed
    mine_b14 = A.E('12').scale((1 / i3 - 1 / i) * Lb.d.get(6, F(0)))
    req(Aax == mine_b14, 'A = (1/i3 - 1/i1)[L_b]_3 E3'); req(Aax != printed_b14)
    MA = ser_exp(Aax, F(-1, 2), N); ML = ser_exp(Lb.scale(1 / i), F(-1, 2), N)
    Bt = MA.rev() * Ser.const(B0, N) * MA                                                         # B = M~_A B_0 M_A
    vt = MA.rev() * ML.rev() * Ser.const(A.eps * v0, N) * ML * MA                                   # (B.13) with v_w0 = v_0
    Bb = Bt + vt
    # M0 = 1 first: (B.15)  M = M_p M_L M_A with p/m = eps v0
    Mp = ser_exp(A.eps * v0, F(-1, 2), N); M = Mp * ML * MA
    req(free_flow_checks(A, body, Bb, M, N), 'symmetric top: (B.13)-(B.15) solve the free equations')
    # general initial motor: M0 = rotation (so that vw0 = M0 (eps v0) M0~ stays an ideal vector)
    R0 = A.rotor(1, 3, F(5, 13), F(12, 13)); vw0 = A.sand(R0, A.eps * v0); Mp = ser_exp(vw0, F(-1, 2), N)
    # with an initial rotation the body-frame start is B_b(0) = B0 + eps v0 and the world constants are rotated: M = M_p M_0 M_L M_A with L_b, A, v0 given in the BODY frame
    M = Mp * Ser.const(R0, N) * ML * MA; req(free_flow_checks(A, body, Bb, M, N), 'symmetric top with an initial rotation M0 (B.15)')
    # the angular-momentum axis precesses the symmetry axis: A and [B]_3 are constants of the motion
    c3t = [(MA.rev() * Ser.const(B0, N) * MA).c[k].d.get(6, F(0)) for k in range(N)]; req(c3t[0] == B0.d.get(6, F(0)) and all(c == 0 for c in c3t[1:]), '[B]_3 is constant (B.8)')
    row('F33', 'B.3, eqs (B.7)-(B.15), pp.78-80', 78, r'\mathsf I_C[\mathbf B]=i\mathbf B+(i_3-i)[\mathbf B]_3E_3;\ \ \mathbf A=\mathbf B_0-\mathbf L_b/i=(1-i_3/i)[\mathbf B_0]_3E_3=(i_1-i_3)[\mathbf L_b]_3E_3;\ \ M=M_pM_0M_{L_b}M_A',
        r'M=M_p\,M_0\,e^{-(L_b/i)t/2}\,e^{-A t/2}', dims=[3], worked=None,
        how=f'free symmetric top (two equal inertias): (B.7), (B.12), the conserved [B]_3, the closed form of B_b(t) (B.13) and the motor (B.15) all satisfy the free equations as exact series through order {N - 3}, also with an initial rotation M_0')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'Everything agrees except the last form in (B.14): from A = (1 - i3/i)[B0]_3 E3 and [L_b]_3 = i3 [B0]_3 one gets A = (1/i3 - 1/i1)[L_b]_3 E3. The printed "(i1 - i3)[L_b]_3 E3" is dimensionally off (it probably means inverse inertias).'
    # ---- B.4 non-symmetric top
    for _ in range(4):
        body = diag_body(A, rng); i1, i2, i3 = body.i[(2, 3)], body.i[(1, 3)], body.i[(1, 2)]
        B = A.rand_euclid_bivector(rng); b1, b2, b3 = B.d.get(12, F(0)), -B.d.get(10, F(0)), B.d.get(6, F(0))          # B = b1 e23 + b2 e31 + b3 e12
        lhs = IC_inv(body, A.comm(B, body.IC(B))); w1, w2, w3 = (i2 - i3) / i1, (i3 - i1) / i2, (i1 - i2) / i3
        want = A.E('23').scale(w1 * b2 * b3) + A.E('31').scale(w2 * b3 * b1) + A.E('12').scale(w3 * b1 * b2)
        req(lhs == want, 'Euler equations (B.17)-(B.18)')
        req(i1 * b1 * (w1 * b2 * b3) + i2 * b2 * (w2 * b3 * b1) + i3 * b3 * (w3 * b1 * b2) == 0, 'the kinetic energy is conserved'); req(i1 * i1 * b1 * (w1 * b2 * b3) + i2 * i2 * b2 * (w2 * b3 * b1) + i3 * i3 * b3 * (w3 * b1 * b2) == 0, '|L|^2 is conserved')
    # tennis racket: for i1 > i2 > i3 the middle axis is unstable (growth rate^2 = w1 w3 Omega^2 > 0), the outer ones are not
    stab = []
    for (a, b, c) in ((5, 3, 1), (7, 4, 2), (9, 8, 1), (4, 3, 2)):
        i1, i2, i3 = F(a), F(b), F(c); w1, w2, w3 = (i2 - i3) / i1, (i3 - i1) / i2, (i1 - i2) / i3
        req(w1 > 0 and w3 > 0 and w2 < 0, 'omega_1 and omega_3 positive, omega_2 negative'); req(w1 * w3 > 0 and w2 * w3 < 0 and w1 * w2 < 0, 'middle axis: growth; outer axes: oscillation')
        stab.append({'inertias': [a, b, c], 'omega': [fmt_q(w1), fmt_q(w2), fmt_q(w3)], 'middle_axis_growth_rate_sq_per_Omega_sq': fmt_q(w1 * w3), 'axis1_osc_sq_per_Omega_sq': fmt_q(-w2 * w3), 'axis3_osc_sq_per_Omega_sq': fmt_q(-w1 * w2)})
    row('F34', 'B.4, eqs (B.16)-(B.18), pp.81-82', 81, r'\mathsf I_C[\dot{\mathbf B}]=\mathbf B_b\times\mathsf I_C[\mathbf B_b]\ \Rightarrow\ \dot B_{b1}=\omega_1B_{b2}B_{b3}\ (\text{cyclic}),\ \omega_1=\tfrac{i_2-i_3}{i_1};\ \ i_1\ge i_2\ge i_3:\ \omega_2<0',
        r'\dot B_1 = \omega_1 B_2 B_3,\ \dots', dims=[3], worked=None, how='exact on random diagonal bodies; energy and |L|^2 conserved; for i1 > i2 > i3 the middle axis has a positive squared growth rate (tennis racket / Dzhanibekov effect), the other two oscillate')
    ROWS[-1]['extra'] = {'tennis_racket': stab}

# ================================================================================================= 2.6 contact
def contact(seed):
    rng = random.Random(seed); A = Alg(3); res = []
    for _ in range(6):
        bp, bm = generic_body(A, rng, 4), generic_body(A, rng, 4); Mp, Mm = A.rand_motor(rng), A.rand_motor(rng)
        Bp, Bm_ = A.rand_bivector(rng), A.rand_bivector(rng); q = A.rand_vec(rng); Q = A.point(q); n = A.vec([F(3, 5), F(4, 5), F(0)]); N = A.vdot(n, Q); rho = F(1, 2)
        def Iw_inv(body, M, P): return A.sand(M, body.Iinv(A.sand(M.rev(), P)))
        def V(B): return A.join(Q, A.comm(Q, B))
        Nt = N.rev(); sc = lambda X: (X * Nt).scalar()
        Xp, Xm = V(Iw_inv(bp, Mp, N)), V(Iw_inv(bm, Mm, N)); a = sc(V(Bp - Bm_))
        j_printed = -(1 + rho) * a / sc(Xp - Xm); j_sum = -(1 + rho) * a / sc(Xp + Xm)
        out = {}
        for jname, j in (('printed 2.32', j_printed), ('with +', j_sum)):
            for upd in ('+-', '-+'):
                s = 1 if upd == '+-' else -1
                Bp2 = Bp + Iw_inv(bp, Mp, N).scale(s * j); Bm2 = Bm_ - Iw_inv(bm, Mm, N).scale(s * j)
                rel_after = sc(V(Bp2 - Bm2)); out[(jname, upd)] = rel_after == -rho * a
        res.append(out)
    keys = list(res[0]); summary = {f'{k[0]} / B+- <- B+- {k[1][0]} j I^-1 N': all(r[k] for r in res) for k in keys}
    return summary

def contact_row(seed):
    summ = contact(seed)
    good = [k for k, v in summ.items() if v]; req(good == ['with + / B+- <- B+- + j I^-1 N'], 'exactly one reading of (2.32)-(2.33) satisfies the restitution law: ' + str(summ))
    row('F35', '2.6, eqs (2.32)-(2.33), pp.45-46', 46, r'j=-(1+\rho)\dfrac{(Q\vee Q\times(\mathbb B_+-\mathbb B_-))\cdot\widetilde N}{(Q\vee Q\times(\mathsf I_+^{-1}[N]-\mathsf I_-^{-1}[N]))\cdot\widetilde N};\ \ \mathbb B_\pm\leftarrow\mathbb B_\pm\pm j\,\mathsf I_\pm^{-1}[N]',
        r'(V^{\prime}_+ - V^{\prime}_-)\cdot\tilde N=-\rho\,(V_+-V_-)\cdot\tilde N', dims=[3], worked=None,
        how='two random rigid bodies in 3D, a contact point Q and a normal line N = n.Q; V = Q v (Q x B) is the velocity line at Q. Only one reading satisfies the restitution law exactly')
    ROWS[-1]['status'] = 'note'; ROWS[-1]['note'] = 'Exact: with B+ <- B+ + j I+^-1[N] and B- <- B- - j I-^-1[N] (eq 2.33) the restitution law holds when the denominator of j contains I+^-1[N] PLUS I-^-1[N]. In (2.32) the printed denominator has a minus, and the line just above (2.33) writes B_pm - (-+) j I^-1[N]. If the minus comes from an orientation convention for N on the second body, it is worth stating.'
    ROWS[-1]['extra'] = {'readings': summ}

NOT_CHECKED = [
    ('F36', '2.7.4, eq (2.38), p.50', 'Lagrangian derivation I^r I[Bdot] = B x (I^r I[B])', 'needs the dual (reciprocal) algebra used for the scalar-product form of the join; the resulting free equation I[Bdot] = B x I[B] IS checked (F25)'),
    ('F37', '2.9, eqs (2.39), pp.52-54', 'constrained motion: L v F_L = 0 (hinge)', 'not done: a second, longer computation; the building blocks (inertia map, join) are in place'),
    ('F38', '2.5.1-2.5.3, 2.5.7, 2.6.1, Fig. 2.4', 'the ganja.js code, the hypercube, the SAT collision test, Euler/RK4 integrators', 'code listings are figures in the PDF; only the equations they implement were checked'),
    ('F39', 'Chapter 1.5, Fig. 1.3', 'closed forms for exp and log of a 3D motor (De Keninck)', 'only given as a figure of code'),
    ('F40', 'Appendix D (exercises 1-21)', 'exercises and solutions', 'D.1, D.2 (2D inertia of a rotation about the centroid and of a translation) are special cases of F20; the rest were not read line by line')]

CONVENTIONS = [
    {'theirs': 'e0 = eps, eps^2 = 0', 'ours': 'bit 0, square 0 (sq[0] = 0)', 'note': 'their code index 0 is our bit 0, so mask 0b1111 is e0123'},
    {'theirs': 'e1 ... ed, e_i^2 = +1 (Euclidean base)', 'ours': 'bits 1..d, square +1 ("time-type" in the atlas rule)', 'note': 'the atlas rule has space squares -1; the whole dynamics also runs with sq = [0, -1, ..., -1] (law of motion checked in d = 2, 3), the energy then changes sign'},
    {'theirs': 'e_ij = e_i e_j, e31 = e3 e1, e032 = e0 e3 e2, ...', 'ours': 'XOR of masks with the sign of the bit rule', 'note': 'e31 = -mask 0b1010 (ours is ascending), e032 = -mask 0b1101, e021 = -mask 0b0111; the renderer prints the paper\'s names'},
    {'theirs': 'O = e1 ... ed,  I = eps O,  Q = O + q I', 'ours': 'O = mask of bits 1..d; I = eps * O', 'note': 'I has square 0'},
    {'theirs': 'plane p = n - delta eps; translation T = 1 - eps t/2; X -> M X M~', 'ours': 'same expressions', 'note': 'their eps is minus the eps of [13] v < 2.0; we use the current one throughout'},
    {'theirs': 'x . A = (x A - A^ x)/2;  A x B = (A B - B A)/2', 'ours': 'vdot, comm', 'note': 'x . A is the left contraction of a vector'},
    {'theirs': 'Hodge star: X (*X) = X X~_E I', 'ours': 'signed complement with (*B) ^ B = I', 'note': 'reproduces *O = eps, *(q I) = q, *E = -E I, *(eps e_k) = e_k I_d (F00); *^-1 is the inverse on masks'},
    {'theirs': 'join A v B = *^-1(*A ^ *B); meet = ^', 'ours': 'join, wedge', 'note': 'footnote 3 of p.12'},
    {'theirs': 'motors exp(-B t/2); B_w = -2 Mdot M~; B_b = -2 M~ Mdot', 'ours': 'ser_exp(B, -1/2); exact power series in t', 'note': 'no floating point anywhere in the exact rows'}]


# ================================================================================================= one-line checks you can paste
def make_ctx():
    """names used by the one-line checks of the translation matrix (d = 3)"""
    A = Alg(3); ql = [2, -1, 1]; rl = [1, 0, 2]; ul = [1, 2, 3]; vl = [1, 0, 3]
    c = dict(A=A, F=F, ql=ql, rl=rl, ul=ul, q=A.vec(ql), u=A.vec(ul), Q=A.point(ql), R=A.point(rl), f=A.vec([1, 2, 0]), v=A.vec(vl), n=A.vec(ul))
    c['Bm'] = A.E('12') + A.E('23').scale(2); c['Binv'] = c['Bm'].rev().scale(1 / (c['Bm'] * c['Bm'].rev()).scalar())
    c['M0'] = A.trans([1, 2, 3]) * A.rotor(1, 2, F(3, 5), F(4, 5)); c['R3'] = A.rotor(1, 2, F(3, 5), F(4, 5))
    c['cb'] = Body(A, [(1, [1, 0, 0]), (1, [-1, 0, 0]), (2, [0, 1, 0]), (2, [0, -1, 0]), (3, [0, 0, 2]), (3, [0, 0, -2]), (1, [1, 2, 3]), (1, [-1, -2, -3])])
    c['gb'] = Body(A, [(1, [1, 0, 0]), (2, [0, 1, 0]), (1, [0, 0, 1]), (3, [-1, -1, 0])]); c['B1'] = A.E('12') + A.E('01'); c['B2'] = A.E('23').scale(2) + A.E('03')
    c['bd'] = Body(A, [(F(m), [F(x) for x in p]) for m, p in ((1, [2, 0, 0]), (1, [-2, 0, 0]), (2, [0, 1, 0]), (2, [0, -1, 0]), (3, [0, 0, 1]), (3, [0, 0, -1]), (1, [0, 0, 0]))])
    c['bd'].i = {(i, j): sum(m * (p[i - 1] ** 2 + p[j - 1] ** 2) for m, p in c['bd'].pts) for i in (1, 2, 3) for j in (1, 2, 3) if i < j}
    c['d2'] = Alg(2); return c
CODE = {
    'F00': ('A.star(Q) == A.eps + q', 'expr'), 'F01': ('A.sand(A.trans(ql), n) == n - A.eps.scale(A.vdot(q, n).scalar())', 'expr'),
    'F02': ('A.sand(A.trans(ql), A.O) == A.O + q * A.I', 'expr'), 'F03': ('(A.g(1) - A.eps.scale(2)).wedge(A.g(2) + A.eps).wedge(A.g(3) - A.eps) == Q', 'expr'),
    'F04': ('(Q * Q).d == {0: F(-1)}', 'expr'), 'F05': ('A.sand(A.trans([5, 7, 1]), A.ideal(ul)) == A.ideal(ul)', 'expr'),
    'F06': ('A.join(A.O, A.ideal(ul)) == A.vdot(u, A.O)', 'expr'), 'F07': ('A.sand(A.trans(ql), A.vdot(u, A.O)) == A.vdot(u, Q)', 'expr'),
    'F08': ('A.join(Q, A.ideal(ul)) == A.vdot(u, Q)', 'expr'), 'F09': ('(A.vec([2, -1, 0]) - A.eps.scale(5)).wedge(A.vdot(u, Q)).is_zero()', 'expr'),
    'F10': ('Bm + A.eps * (A.vdot(v, Bm) * Binv) + A.eps * (v.wedge(Bm) * Binv) == Bm + A.eps * v', 'expr'),
    'F11': ('kinematics(1)', 'call'), 'F12': ('kinematics(1)', 'call'), 'F13': ('kinematics(1)', 'call'),
    'F14': ('A.comm(Q, Bm + A.eps * v) == (v + A.vdot(q, Bm)) * A.I', 'expr'), 'F15': ('M0.rev() * (A.eps * u) * M0 == A.eps * (R3.rev() * u * R3)', 'expr'),
    'F16': ('A.join(Q, v * A.I) == A.vdot(v, Q)', 'expr'), 'F17': ('A.vdot(v, Q) == A.vdot(v, R) - A.vec([a - b for a, b in zip(ql, rl)]).wedge(v) * A.I', 'expr'),
    'F18': ('gb.I_def(B1 + B2) == gb.I_def(B1) + gb.I_def(B2)', 'expr'), 'F19': ('momentum_inertia(1)', 'call'),
    'F20': ('cb.I_def(Bm + A.eps * v) == A.vdot(v, A.O).scale(cb.m) - cb.IC(Bm) * A.I', 'expr'),
    'F21': ("bd.I_def(A.E('23')) == A.star(A.E('23')).scale(bd.i[(2, 3)])", 'expr'), 'F22': ('momentum_inertia(1)', 'call'), 'F23': ('momentum_inertia(1)', 'call'),
    'F24': ('A.vdot(f, Q) == A.vdot(f, R) - A.vec([a - b for a, b in zip(ql, rl)]).wedge(f) * A.I', 'expr'),
    'F25': ("dyn_check(1, 3, 6, 'gravity')", 'call'), 'F26': ("dyn_check(1, 3, 6, 'spring')", 'call'), 'F27': ('euler_laws(1)', 'call'),
    'F28': ('motors_and_formulas(1)', 'call'), 'F29': ('motors_and_formulas(1)', 'call'), 'F30': ('motors_and_formulas(1)', 'call'), 'F31': ('cuboid(1)', 'call'),
    'F32': ('tops(1)', 'call'), 'F33': ('tops(1)', 'call'), 'F34': ('tops(1)', 'call'), 'F35': ('contact(1)', 'call')}
def run_code_lines(rows):
    ctx = dict(globals()); ctx.update(make_ctx())
    for r in rows:
        if r['id'] not in CODE: continue
        src, kind = CODE[r['id']]; res = eval(src, ctx)
        if kind == 'expr': assert res is True or res == True, f"one-line check of {r['id']} is false: {src}"
        r['code'] = src; r['code_kind'] = kind

def run(seed=1, quick=False):
    global ROWS
    ROWS = []
    ch1(seed); splits(seed); kinematics(seed); momentum_inertia(seed); forques(seed)
    newton_euler_rows(seed, 6 if quick else 8); euler_laws(seed); motors_and_formulas(seed); cuboid(seed); tops(seed, 7 if quick else 8); contact_row(seed)
    # the law of motion in the atlas signature (space squares -1)
    sg = [dyn_check(seed, d, 6, k, with_energy=False, sp=-1) for d, k in ((2, 'free'), (2, 'gravity'), (3, 'free'), (3, 'gravity'), (3, 'spring'))]
    for k, (i, kind, why, how) in enumerate(NOT_CHECKED, 0): pass
    byid = {r['id']: r for r in ROWS}
    for i, ref, what, why in NOT_CHECKED: row(i, ref, 0, what, '', status='not checked', note=why)
    rows = sorted(ROWS, key=lambda r: r['id']); run_code_lines(rows)
    findings = [{'id': r['id'], 'ref': r['ref'], 'page': r['page'], 'kind': 'slip', 'note': r['note']} for r in rows if r['status'] == 'note'] + [{'id': r['id'], 'ref': r['ref'], 'page': r['page'], 'kind': 'remark', 'note': r['remark']} for r in rows if r['remark']]
    findings.sort(key=lambda f: f['id'])
    counts = {'rows': len(rows), 'ok': sum(r['status'] == 'ok' for r in rows), 'note': sum(r['status'] == 'note' for r in rows), 'remarks': sum(bool(r['remark']) for r in rows), 'not_checked': sum(r['status'] == 'not checked' for r in rows)}
    return {'paper': {'title': 'May the Forque Be with You: Dynamics in PGA', 'authors': ['Leo Dorst', 'Steven De Keninck'], 'version': '2.6', 'pages': 99, 'home': 'https://bivector.net'},
            'conventions': CONVENTIONS, 'rows': rows, 'findings': findings, 'counts': counts,
            'atlas_signature': {'law_of_motion_holds': True, 'cases': [f"d={c['d']} {c['kind']}" for c in sg]}, 'seed': seed}

def text_table(data):
    out = []
    for r in data['rows']:
        mark = {'ok': 'OK  ', 'note': 'NOTE', 'not checked': ' -- '}[r['status']]
        out.append(f"{r['id']} [{mark}] {r['ref']:<52} d={','.join(map(str, r['dims'])) or '-':<6}")
        if r['status'] == 'note': out.append('        -> ' + r['note'])
        if r['status'] == 'not checked': out.append('        -> not checked: ' + r['note'])
    return '\n'.join(out)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); ap.add_argument('--quick', action='store_true'); ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--row', help='show one row of the translation matrix (e.g. F20): the paper, ours, and the one-line check, evaluated again here')
    a = ap.parse_args(); data = run(a.seed, a.quick)
    if a.row:
        r = next((x for x in data['rows'] if x['id'] == a.row), None)
        if r is None: sys.exit('no such row: ' + a.row)
        print(f"{r['id']}  {r['ref']}\n  paper : {r['paper']}\n  ours  : {r['ours']}\n  how   : {r['how']}\n  status: {r['status']}  {r['note']}")
        if r.get('code'):
            ctx = dict(globals()); ctx.update(make_ctx()); print(f"  code  : {r['code']}\n  value : {eval(r['code'], ctx)}   ({r['code_kind']}: an expression must be True; a call runs the exact check and raises if it fails)")
        sys.exit(0)
    print(text_table(data)); c = data['counts']
    print(f"\n{c['rows']} rows: {c['ok']} agree exactly, {c['note']} agree after the noted correction, {c['not_checked']} not checked (listed above with the reason).")
    if a.write:
        with open(a.write, 'w') as f: json.dump(data, f, indent=1, ensure_ascii=False)
        print('wrote', a.write)
    if a.compare:
        ref = json.load(open(a.compare)); assert json.loads(json.dumps(data)) == ref, 'the portal data differs from the rebuilt data'; print('portal data == rebuilt data')
