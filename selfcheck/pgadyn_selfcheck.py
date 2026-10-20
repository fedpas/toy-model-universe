#!/usr/bin/env python3
"""Rigid bodies on the bit rule, from the bottom: the segment (n=1), the square (n=2), the cube (n=3), the tesseract (n=4).
Projective geometric algebra R(n,0,1) = the bit rule with one null generator e0 (square 0) and n unit generators; exact rational arithmetic, standard library only.
  python3 pgadyn_selfcheck.py                 run every check
  python3 pgadyn_selfcheck.py --write f.json  also write the data
  python3 pgadyn_selfcheck.py --compare f.json  check that the data equals the file
  python3 pgadyn_selfcheck.py --row D2        print the checks of one row only

Sources (standard, not ours): Dorst and De Keninck, "May the Forque be with you" (n-dimensional rigid body dynamics; M' = -M B/2, the Euler equation,
Hooke, gravity, damping, impulses); Gunn, "Geometric Algebra for Computer Graphics" (SIGGRAPH 2019 notes; the motor group, the Euler equations, the cheat sheets).
What is checked here: their printed 3D formulas against an independent computation; the same equations in every dimension n = 1..4; and the bit-label readings,
which are ours (motor coefficients and body vertices carry the same labels; the complement pairs them; the contact vertex is read off from sign bits).
Not a claim anywhere: collision response, friction, constraints, a continuum limit, an action principle."""
import argparse, itertools, json, sys
from fractions import Fraction as F
from math import comb

RES = []
def row(id, claim, ok, detail=None):
    RES.append({'id': id, 'claim': claim, 'ok': bool(ok), 'detail': detail}); assert ok, f'{id}: {claim} {detail or ""}'

# ---------------------------------------------------------------- the bit rule, coefficients in any commutative ring (Fractions or truncated series)
def pc(x): return bin(x).count('1')
def bmul(a, b, sq):
    s = 1; t = a >> 1
    while t:
        if pc(t & b) & 1: s = -s
        t >>= 1
    c = a & b
    for i in range(len(sq)):
        if c >> i & 1: s *= sq[i]
    return s, a ^ b

K = 10                                                   # order of the exact power series
class Ser:
    """a truncated power series in t with Fraction coefficients; the ring the exact time integration lives in"""
    def __init__(s, c): s.c = list(c)
    @staticmethod
    def const(v): return Ser([F(v)] + [F(0)] * K)
    def _t(s, o): return o if isinstance(o, Ser) else Ser.const(o)
    def __add__(s, o): o = s._t(o); return Ser([a + b for a, b in zip(s.c, o.c)])
    __radd__ = __add__
    def __neg__(s): return Ser([-a for a in s.c])
    def __sub__(s, o): return s + (-s._t(o))
    def __mul__(s, o):
        if not isinstance(o, Ser): return Ser([a * o for a in s.c])
        r = [F(0)] * (K + 1)
        for i, a in enumerate(s.c):
            if a:
                for j in range(K + 1 - i):
                    if o.c[j]: r[i + j] += a * o.c[j]
        return Ser(r)
    __rmul__ = __mul__
    def __eq__(s, o): return s.c == s._t(o).c
    def __ne__(s, o): return not s == o
    def __hash__(s): return hash(tuple(s.c))
    def integ(s): return Ser([F(0)] + [a / (i + 1) for i, a in enumerate(s.c[:-1])])

class MV:
    def __init__(s, sq, d=None): s.sq = sq; s.d = {k: v for k, v in (d or {}).items() if v != 0}
    def __add__(s, o): r = dict(s.d); [r.__setitem__(k, r.get(k, 0) + v) for k, v in o.d.items()]; return MV(s.sq, r)
    def __neg__(s): return MV(s.sq, {k: -v for k, v in s.d.items()})
    def __sub__(s, o): return s + (-o)
    def scale(s, c): return MV(s.sq, {k: v * c for k, v in s.d.items()})
    def __mul__(s, o):
        r = {}
        for a, x in s.d.items():
            for b, y in o.d.items():
                sg, m = bmul(a, b, s.sq)
                if sg: r[m] = r.get(m, 0) + sg * x * y
        return MV(s.sq, r)
    def rev(s): return MV(s.sq, {k: v * (-1 if (pc(k) * (pc(k) - 1) // 2) % 2 else 1) for k, v in s.d.items()})
    def __eq__(s, o): return s.d == o.d
    def get(s, m): return s.d.get(m, 0)
    def grade(s, g): return MV(s.sq, {k: v for k, v in s.d.items() if pc(k) == g})
    def wedge(s, o): return MV(s.sq, _acc([(a ^ b, sg * x * y) for a, x in s.d.items() for b, y in o.d.items() if not a & b for sg in [bmul(a, b, s.sq)[0]]]))
    def comm(s, o): return s * o - o * s
    def map(s, f): return MV(s.sq, {k: f(v) for k, v in s.d.items()})
def _acc(pairs):
    r = {}
    for m, v in pairs: r[m] = r.get(m, 0) + v
    return r

class Alg:
    """R(n,0,1): generator 0 is the null e0 (square 0), generators 1..n are unit (square +1); the dual is the right complement (e_m ^ dual(e_m) = I)"""
    def __init__(s, n): s.n = n; s.sq = [0] + [1] * n; s.full = (1 << (n + 1)) - 1
    def blade(s, m, c=1): return MV(s.sq, {m: c})
    def one(s): return s.blade(0)
    def e(s, i): return s.blade(1 << i)
    def zero(s): return MV(s.sq, {})
    def sgn(s, m): return bmul(m, s.full ^ m, s.sq)[0]                  # e_m e_{~m} = sgn * I (disjoint masks, so no square enters)
    def dual(s, X): return MV(s.sq, _acc([(s.full ^ m, c * s.sgn(m)) for m, c in X.d.items()]))
    def undual(s, X): return MV(s.sq, _acc([(s.full ^ k, c * s.sgn(s.full ^ k)) for k, c in X.d.items()]))
    def join(s, a, b): return s.undual(s.dual(a).wedge(s.dual(b)))
    def point(s, x): return s.dual(s.e(0) + sum((s.e(i + 1).scale(c) for i, c in enumerate(x)), s.zero()))
    def q(s, P, i): return P.get(s.full ^ (1 << i)) * s.sgn(1 << i)
    def pos(s, P):
        w = s.q(P, 0)
        if isinstance(w, Ser): return [s.q(P, i + 1) for i in range(s.n)]
        return [F(s.q(P, i + 1)) / F(w) for i in range(s.n)]                   # exact: never an int / int
    def weight(s, P): return s.q(P, 0)
    def biv(s): return [m for m in range(1 << (s.n + 1)) if pc(m) == 2]
    def sand(s, M, X): return M * X * M.rev()
    def trans(s, t): return s.one() + sum((s.blade(1 | 1 << (i + 1), F(c, 2) * TS) for i, c in enumerate(t)), s.zero())
TS = -1                                                                  # with the duals of the cheat sheet, T = 1 - t.e0i / 2 moves a point by +t (checked in A5)

def rot_plane(A, i, j, c, s_):                                           # cos t/2 + sin t/2 e_ij with rational (c, s_), c^2 + s_^2 = 1
    assert c * c + s_ * s_ == 1; return A.one().scale(c) + A.blade(1 << i | 1 << j, s_)
def quat3(A, r):                                                         # r0 + r4 e12 + r5 e31 + r6 e23 with e31 = e3 e1 = - e13
    r0, r4, r5, r6 = r; return A.one().scale(r0) + A.blade(0b0110, r4) + A.blade(0b1010, -r5) + A.blade(0b1100, r6)
def rotor(A, rng_i=0):
    n = A.n
    if n == 1: return A.one()
    if n == 2: return [rot_plane(A, 1, 2, F(3, 5), F(4, 5)), rot_plane(A, 1, 2, F(5, 13), F(12, 13)), rot_plane(A, 1, 2, F(8, 17), F(15, 17))][rng_i % 3]
    if n == 3: return quat3(A, [(F(1, 5), F(2, 5), F(2, 5), F(4, 5)), (F(2, 7), F(3, 7), F(6, 7), F(0)), (F(4, 9), F(4, 9), F(7, 9), F(0)), (F(1, 3), F(2, 3), F(2, 3), F(0))][rng_i % 4])
    return rot_plane(A, 1, 2, F(3, 5), F(4, 5)) * rot_plane(A, 3, 4, F(5, 13), F(12, 13))
def motor(A, t, rng_i=0): return A.trans(t) * rotor(A, rng_i)             # rotate about the body origin, then translate
def rbiv(A, rng, lim=3): return MV(A.sq, {m: F(rng.choice([i for i in range(-lim, lim + 1) if i]), rng.randint(1, 3)) for m in A.biv()})

import random
RNG = random.Random(20261003)

# ---------------------------------------------------------------- the equations of motion (Dorst and De Keninck; Gunn), for any n and any diagonal inertia
# state: a motor M (body to world) and the velocity bivector B in the body frame
#   M' = - M B / 2                     B' = A^-1 ( F + [B, A(B)] / 2 )        A(B) = the inertia map, here diagonal: A(e_m) = c_m dual(e_m)
def Amap(A, B, c): return MV(A.sq, _acc([(A.full ^ m, v * c[m] * A.sgn(m)) for m, v in B.d.items()]))
def Ainv(A, X, c): return MV(A.sq, _acc([(A.full ^ k, v * A.sgn(A.full ^ k) * (F(1) / c[A.full ^ k])) for k, v in X.d.items()]))
def dM(M, B): return (M * B).scale(F(-1, 2))
def dB(A, B, c, force=None):
    X = (B * Amap(A, B, c) - Amap(A, B, c) * B).scale(F(1, 2))
    if force is not None: X = X + force
    return Ainv(A, X, c)
def unit_c(A): return {m: F(1) for m in A.biv()}
def kinetic(A, B, c): return sum((c[m] * v * v for m, v in B.d.items()), F(0)) / 2

def gravity(A, M, g, j): return A.dual(M.rev() * A.blade(1 | 1 << j, -g) * M)   # F_g = ( M~ (-g e0j) M )^dual, a force line through the body origin
def hooke(A, M, k, pb, aw): return A.join(pb, M.rev() * aw * M).scale(k)  # F_H = k ((M~ a_w M) & p_b) in the listings' notation; ganja's a & b is our join(b, a) for two points

def lift(mv): return MV(mv.sq, {m: Ser.const(v) for m, v in mv.d.items()})
def picard(A, S0, field, order=K):
    """exact Taylor series of the polynomial system S' = field(S): K Picard iterations give every coefficient through t^K"""
    S = [lift(x) for x in S0]
    for _ in range(order):
        d = field(S); S = [lift(S0[i]) + MV(d[i].sq, {m: v.integ() for m, v in d[i].d.items()}) for i in range(len(S0))]
    return S

def field_of(A, c, force=None):
    return lambda S: [dM(S[0], S[1]), dB(A, S[1], c, None if force is None else force(S[0], S[1]))]
def reven(A, rng, lim=3): return MV(A.sq, {m: F(rng.randint(-lim, lim), rng.randint(1, 3)) for m in range(1 << (A.n + 1)) if pc(m) % 2 == 0})
def rpos(A, rng, lim=3): return [F(rng.randint(-lim, lim), rng.randint(1, 3)) for _ in range(A.n)]
def rdiag(A, rng): return {m: F(rng.randint(1, 5), rng.randint(1, 3)) for m in A.biv()}
def mass_diag(A, rng, mass):                                                  # equal masses for the translations, free moments for the rotations
    c = rdiag(A, rng); c.update({m: F(mass) for m in A.biv() if m & 1}); return c

# the basis and the order used in the papers (3D): bivectors e01 e02 e03 e12 e31 e23, motors 1 e01 e02 e03 e12 e31 e23 e0123 (e31 = e3 e1 = - e13)
PB = [(0b0011, 1), (0b0101, 1), (0b1001, 1), (0b0110, 1), (0b1010, -1), (0b1100, 1)]
PM = [(0, 1), (0b0011, 1), (0b0101, 1), (0b1001, 1), (0b0110, 1), (0b1010, -1), (0b1100, 1), (0b1111, 1)]
def pbuild(A, r, basis): return MV(A.sq, {m: sg * c for (m, sg), c in zip(basis, r)})
def pread(X, basis): return [sg * X.get(m) for m, sg in basis]
def cos_series(w): return [F((-1) ** (k // 2) * w ** k, __import__('math').factorial(k)) if k % 2 == 0 else F(0) for k in range(K + 1)]
def sin_series(w): return [F((-1) ** (k // 2) * w ** k, __import__('math').factorial(k)) if k % 2 == 1 else F(0) for k in range(K + 1)]
def cosh_series(w): return [F(w ** k, __import__('math').factorial(k)) if k % 2 == 0 else F(0) for k in range(K + 1)]

# ---------------------------------------------------------------- A. the labels of the motors are the labels of the cube
def labels():
    out = {}
    for n in range(1, 6):
        ev = [m for m in range(1 << (n + 1)) if pc(m) % 2 == 0]
        ok = len(ev) == 1 << n and sorted(m >> 1 for m in ev) == list(range(1 << n)) and all((m & 1) == (pc(m >> 1) & 1) for m in ev)
        row('A1', f'R({n},0,1): the {len(ev)} even blades (the motor algebra) are labelled one-to-one by the {1 << n} vertices of the {n}-cube: drop the e0 bit; e0 is there exactly when the vertex weight is odd', ok)
    out['A1'] = 'n = 1..5'
    for n in range(1, 5):
        A = Alg(n); ev = [m for m in range(1 << (n + 1)) if pc(m) % 2 == 0]
        rr = all(bmul(a, b, A.sq)[0] != 0 and not (bmul(a, b, A.sq)[1] & 1) for a in ev for b in ev if not a & 1 and not b & 1)
        ee = all(bmul(a, b, A.sq)[0] == 0 for a in ev for b in ev if a & 1 and b & 1)
        re_ = all(bmul(a, b, A.sq)[0] != 0 and bmul(a, b, A.sq)[1] & 1 for a in ev for b in ev if bool(a & 1) != bool(b & 1))
        row('A2', f'R({n},0,1): the even vertices (no e0) multiply among themselves (the rotor part), the odd vertices square to zero in pairs (e0 is null), and even times odd is odd: motors = rotors + eps * rotors (dual numbers over the rotor algebra)', rr and ee and re_)
    A = Alg(3); tab = []
    for m in sorted((m for m in range(16) if pc(m) % 2 == 0), key=lambda m: (m >> 1)):
        name = 'e' + ''.join(str(i) for i in range(4) if m >> i & 1) if m else '1'; tab.append({'blade': name, 'vertex': format(m >> 1, '03b')[::-1][::-1], 'has_e0': bool(m & 1)})
    ok = {t['vertex'] for t in tab if not t['has_e0']} == {'000', '011', '101', '110'} and {t['vertex'] for t in tab if t['has_e0']} == {'001', '010', '100', '111'}
    row('A3', 'R(3,0,1): the 8 motor coefficients sit on the 8 cube vertices: the even tetrahedron {000, 011, 101, 110} = {1, e12, e13, e23} is the rotor (a quaternion), the odd tetrahedron {001, 010, 100, 111} = {e01, e02, e03, e0123} is the translation part; weights 0,1,2,3 give 1,3,3,1', ok)
    out['A3'] = tab
    for n in range(1, 5):
        A = Alg(n); X = reven(A, RNG); P = X * X.rev()
        row('A4', f'R({n},0,1): for any even element, X X~ has only grade 0 and grade 4 parts' + (' (so for n <= 2 it is a pure scalar)' if n <= 2 else ''), all(pc(m) in (0, 4) for m in P.d) and (n > 2 or all(m == 0 for m in P.d)))
    A = Alg(3); wrong_differs = False
    for _ in range(5):
        r = [F(RNG.randint(-4, 4), RNG.randint(1, 3)) for _ in range(8)]; R = pbuild(A, r, PM); P = R * R.rev()
        lhs = (P.get(0), P.get(0b1111)); rhs = (r[0] ** 2 + r[4] ** 2 + r[5] ** 2 + r[6] ** 2, 2 * (r[0] * r[7] - r[1] * r[6] - r[2] * r[5] - r[3] * r[4]))
        assert lhs == rhs and set(P.d) <= {0, 0b1111}
        wrong_differs |= lhs[1] != 2 * (r[0] * r[7] - r[1] * r[5] - r[2] * r[6] - r[3] * r[4])        # negative control: a pairing that is not the complement
    vert = lambda i: PM[i][0] >> 1
    pairs_ok = all(vert(i) ^ vert(j) == 7 for i, j in ((0, 7), (1, 6), (2, 5), (3, 4))) and {vert(i) for i in (0, 4, 5, 6)} == {0b000, 0b011, 0b101, 0b110}
    row('A5', 'R(3,0,1): the printed normalisation of a motor (Dorst and De Keninck, section 3.2) holds exactly: R R~ = (r0^2 + r4^2 + r5^2 + r6^2) + 2 (r0 r7 - r1 r6 - r2 r5 - r3 r4) e0123; read on the cube: the scalar part sums the squares on the even vertices, the e0123 part pairs every vertex with its COMPLEMENT (000 with 111, 001 with 110, 010 with 101, 100 with 011); a pairing that is not the complement fails', wrong_differs and pairs_ok)
    ok = True
    for n in range(1, 5):
        A = Alg(n)
        for ts in (1, -1):
            global TS; TS = ts; t = rpos(A, RNG); x = rpos(A, RNG); Q = A.sand(A.trans(t), A.point(x))
            if ts == -1: ok &= A.pos(Q) == [a + b for a, b in zip(x, t)] and A.weight(Q) == 1
            else: ok &= A.pos(Q) == [a - b for a, b in zip(x, t)]
        TS = -1
        for ri in range(3):
            Rr = rotor(A, ri); x = rpos(A, RNG); Q = A.sand(Rr, A.point(x)); y = A.pos(Q)
            ok &= A.weight(Q) == 1 and sum(a * a for a in y) == sum(a * a for a in x) and A.pos(A.sand(Rr, A.point([0] * n))) == [0] * n
        M = motor(A, t, 1); ok &= A.pos(A.sand(M, A.point([0] * n))) == t
    row('A6', 'R(n,0,1), n = 1..4: with the duals of the cheat sheet (dual e1 = e032, dual e0 = e123, dual e3 = e021) a point is the dual of e0 + x.e, the translator 1 - t.e0i/2 moves it by +t, a rotor turns it about the origin keeping |x|, and M = T R carries the origin to t', ok)
    cnt = {n: (1 << n, n * (n + 1) // 2, sum(comb(n + 1, g) for g in (0, 4, 8) if g <= n + 1)) for n in range(1, 7)}
    ok = all(cnt[n][0] - cnt[n][1] == cnt[n][2] for n in range(1, 5)) and cnt[5][0] - cnt[5][1] == 17 and cnt[5][2] == 16
    row('A7', 'motor counts: the even algebra has 2^n coefficients, the group has n(n+1)/2 dimensions; the equations of R R~ = 1 (grades 0 and 4) match exactly for n = 1..4 (1,1,2,6) and fall one short at n = 5 (17 needed, 16 given), so from n = 5 the condition R R~ = 1 alone is not enough (standard: the versor condition)', ok)
    out['A7'] = {str(n): {'coefficients': v[0], 'dimension': v[1], 'equations': v[2]} for n, v in cnt.items()}
    return out

# ---------------------------------------------------------------- B. rung 1: the segment. One null generator, one coordinate: free motion, then one spring
def rung1():
    A = Alg(1); out = {}; c = {0b11: F(1)}
    T = lambda a: A.trans([a]); ok = (A.blade(3) * A.blade(3)).d == {} and all(T(a) * T(b) == T(a + b) for a, b in [(F(1), F(2)), (F(1, 3), F(-5, 7))])
    ok &= all(A.pos(A.sand(T(a), A.point([x]))) == [x + a] for a, x in [(F(2), F(1, 2)), (F(-3, 5), F(7))])
    row('B1', 'R(1,0,1): the whole motor group is the translators 1 - (a/2) e01, and e01 squares to 0: T(a) T(b) = T(a + b), T(a) moves the point x to x + a (the null "i" of the spinor step, here as a group of translations)', ok)
    M0 = motor(A, [F(2)]); B0 = A.blade(3, F(3)); S = picard(A, [M0, B0], field_of(A, c))
    x0 = A.pos(A.sand(S[0], A.point([0])))[0]
    row('B2', 'segment, no force: the commutator [B, A(B)] vanishes (A(B) is a scalar), so B is constant; the exact series of the position is x(t) = x0 + v t (all coefficients after t^1 are 0)', all(v == 0 for v in S[1].d.get(3, Ser.const(3)).c[1:]) and x0.c[:2] == [2, 3] and all(v == 0 for v in x0.c[2:]))
    k = F(4); pb = A.point([F(1, 2)]); aw = A.point([F(1, 2)]); x0v = F(2)
    M0 = motor(A, [x0v - F(1, 2)]); B0 = A.zero()
    Fh = hooke(A, M0, k, pb, aw)
    force = lambda M, B: hooke(A, M, k, pb, aw)
    S = picard(A, [M0, B0], field_of(A, c, force)); xv = A.pos(A.sand(S[0], pb))[0]
    cs = cos_series(2); want = [(x0v - F(1, 2)) * cs[i] + (F(1, 2) if i == 0 else 0) for i in range(K + 1)]
    row('B3', 'segment, one spring: a Hooke force F = k ((M~ a_w M) & p_b) on the vertex with label 1, anchor at 1/2, k = 4, released at rest from 2: the exact series of the vertex is 1/2 + (3/2) cos 2t through t^10 (the force is a scalar: grade n - 1 = 0)', all(pc(m) == 0 for m in Fh.d) and xv.c == want, f'F at start grade-0 value = {Fh.get(0)}')
    kneg = lambda M, B: hooke(A, M, -k, pb, aw); Sn = picard(A, [M0, B0], field_of(A, c, kneg)); xn = A.pos(A.sand(Sn[0], pb))[0]
    ch = cosh_series(2); wantn = [(x0v - F(1, 2)) * ch[i] + (F(1, 2) if i == 0 else 0) for i in range(K + 1)]
    kk = [[0, 1], [-k, 0]]; sq = [[sum(kk[i][m] * kk[m][j] for m in range(2)) for j in range(2)] for i in range(2)]
    row('B4', 'segment: the sign of the spring decides the kind of "i": with +k the velocity-position pair (x, b) has matrix [[0,1],[-k,0]] whose square is -k I (rotation, the oscillator); with -k the series is cosh 2t (boost). The null generator alone is free motion; the coupling supplies the other two', xn.c == wantn and xv.c != xn.c and sq == [[-k, 0], [0, -k]])
    out['B3'] = {'series': [str(v) for v in xv.c]}
    return out

# ---------------------------------------------------------------- C. rung 2: the square. A rotation appears, and with it the first term of Euler's equation
def rung2():
    A = Alg(2); c = unit_c(A); out = {}
    M0 = motor(A, [F(1, 3), F(-1, 2)], 0); w = 2
    for tr in [(F(1), F(2)), (F(-3), F(1, 2)), (F(5, 7), F(-1))]:
        B0 = MV(A.sq, {0b011: tr[0], 0b101: tr[1], 0b110: F(w)})
        S = picard(A, [M0, B0], field_of(A, c)); B = S[1]
        z0 = (B0.get(0b011), B0.get(0b101)); cs, sn = cos_series(w), sin_series(w)
        got = (B.get(0b011).c, B.get(0b101).c)
        cand = {sgn: ([z0[0] * cs[i] + sgn * z0[1] * sn[i] for i in range(K + 1)], [z0[1] * cs[i] - sgn * z0[0] * sn[i] for i in range(K + 1)]) for sgn in (1, -1)}
        hit = [sgn for sgn in (1, -1) if got == cand[sgn]]
        W = [M * Amap(A, B, c) * M.rev() for M in [S[0]]][0]
        const = all(v.c[1:] == [0] * K for v in W.d.values()) if W.d else True
        assert hit == [1] and const and B.get(0b110).c == [w] + [0] * K, (hit, const)
    row('C1', 'square, no force: the rotation rate b12 stays constant, the world-frame momentum M A(B) M~ is constant (exact series through t^10), and the body-frame velocity (b01, b02) turns at exactly that rate: (b01 + i b02)(t) = (b01 + i b02)(0) e^(-i w t) - the Euler term is the turning of the frame, not a force', True)
    out['rate'] = w
    return out

# ---------------------------------------------------------------- D. rung 3: the cube. The printed formulas, against an independent computation
def printed3d():
    A = Alg(3); c = unit_c(A); out = {}
    ok = True
    for _ in range(6):
        b = [F(RNG.randint(-5, 5), RNG.randint(1, 3)) for _ in range(6)]; B = pbuild(A, b, PB)
        got = pread(dB(A, B, c), PB); want = [b[1] * b[3] - b[2] * b[4], -b[0] * b[3] + b[2] * b[5], b[0] * b[4] - b[1] * b[5], 0, 0, 0]
        ok &= got == want
    row('D1', 'cube, no force, unit inertia: the printed Euler equation B. = -(B* x B)^(-*) equals (b1 b3 - b2 b4) e01 + (-b0 b3 + b2 b5) e02 + (b0 b4 - b1 b5) e03 (nothing in e12, e31, e23: the rotation rate is constant, the translation velocity turns), exactly, six random bivectors', ok)
    ok = True; ok2 = True
    for _ in range(6):
        r = [F(RNG.randint(-4, 4), RNG.randint(1, 3)) for _ in range(8)]; M = pbuild(A, r, PM)
        Fg = gravity(A, M, F(-1), 2)                                     # (M~ e02 M)^dual, the unit force in the global e02 direction
        m = r; want = [0, 0, 0, 2 * (m[0] * m[6] + m[4] * m[5]), m[0] ** 2 - m[4] ** 2 + m[5] ** 2 - m[6] ** 2, 2 * (-m[0] * m[4] + m[5] * m[6])]
        ok &= pread(Fg, PB) == want and Fg == A.undual(M.rev() * A.blade(0b0101) * M)
    for q in [(F(1, 5), F(2, 5), F(2, 5), F(4, 5)), (F(2, 7), F(3, 7), F(6, 7), F(0)), (F(4, 9), F(4, 9), F(7, 9), F(0))]:
        M = quat3(A, q); Fg = gravity(A, M, F(-1), 2); ok2 &= pread(Fg, PB) == [0, 0, 0, 2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[1] ** 2 + q[3] ** 2), 2 * (q[2] * q[3] - q[0] * q[1])]
    row('D2', 'cube: the printed gravity forque (M~ e02 M)^(-*) = 2 (m0 m6 + m4 m5) e12 + (m0^2 - m4^2 + m5^2 - m6^2) e31 + 2 (m5 m6 - m0 m4) e23 holds exactly for every even M (the e0-parts of M drop out, so it is a line through the body origin), and with r0^2 + r4^2 + r5^2 + r6^2 = 1 the middle coefficient is 1 - 2 (m4^2 + m6^2) as printed; dual and undual agree on bivectors in 4 generators', ok and ok2)
    ok = True
    for n in (2, 3, 4):
        A = Alg(n)
        for _ in range(4):
            c = rdiag(A, RNG); B = rbiv(A, RNG); v = B.scale(F(-1, 2)); mm = Amap(A, v, c)
            vdot = Ainv(A, (mm * v - v * mm).scale(F(1, 2)), c).scale(2)       # Gunn: v' = 2 A^-1 (A(v) x v), x = half the commutator
            ok &= dB(A, B, c) == vdot.scale(-2)
    row('D3', 'n = 2, 3, 4, any diagonal inertia: the Euler equation of the SIGGRAPH notes (g. = g v, v. = 2 A^-1 (A(v) x v)) and the one of the forque paper (M. = -M B/2, B. = A^-1 [B, A(B)]/2) are the same equation under v = -B/2; the force terms carry different factors and are not compared', ok)
    ok = True
    for _ in range(5):
        A = Alg(3); mass = F(RNG.randint(1, 4), RNG.randint(1, 3)); sz = [F(RNG.randint(1, 5), RNG.randint(1, 3)) for _ in range(3)]
        slots = {0b0011: (sz[1] ** 2 + sz[2] ** 2) * mass / 12, 0b0101: (sz[2] ** 2 + sz[0] ** 2) * mass / 12, 0b1001: (sz[0] ** 2 + sz[1] ** 2) * mass / 12, 0b0110: mass, 0b1010: mass, 0b1100: mass}
        B = rbiv(A, RNG); dB_ = A.dual(B); paper = MV(A.sq, {m: v * slots[m] for m, v in dB_.d.items()})
        cc = {}
        for m in A.biv():
            if m & 1: cc[m] = mass
            else: j, k_ = [i for i in range(1, 4) if m >> i & 1]; cc[m] = mass * (sz[j - 1] ** 2 + sz[k_ - 1] ** 2) / 12
        ok &= paper == Amap(A, B, cc)
    row('D4', 'cube: the inertia map of the printed cuboid code (the dual of B, coefficient by coefficient, times m/12 (s_y^2 + s_z^2), ..., m, m, m) equals our diagonal map A(e_m) = c_m dual(e_m) with c = m on the translations e0i and c = (m/12)(s_j^2 + s_k^2) on the rotation e_jk', ok)
    return out

# ---------------------------------------------------------------- E. the same equations in every dimension n = 1..4: invariants, forces, exact series
def ddt_world(A, M, B, X):                                                # d/dt (M X M~) for a constant body-frame element X, by the product rule
    Md = dM(M, B); return Md * X * M.rev() + M * X * Md.rev()
def invariants():
    out = {}
    for n in range(1, 5):
        A = Alg(n); ok1 = ok2 = ok3 = True; ctl = []
        for _ in range(4):
            M = reven(A, RNG); B = rbiv(A, RNG); c = rdiag(A, RNG)
            Md = dM(M, B); ok1 &= (Md * M.rev() + M * Md.rev()).d == {}
            Pi = Amap(A, B, c); Bd = dB(A, B, c); Pid = Amap(A, Bd, c)
            tot = Md * Pi * M.rev() + M * Pid * M.rev() + M * Pi * Md.rev()
            ok2 &= tot.d == {}
            Bd_wrong = Ainv(A, (B * Pi - Pi * B).scale(F(-1, 2)), c); tot_wrong = Md * Pi * M.rev() + M * Amap(A, Bd_wrong, c) * M.rev() + M * Pi * Md.rev()
            Bd_none = A.zero(); tot_none = Md * Pi * M.rev() + M * Pi * Md.rev()
            ctl.append((tot_wrong.d != {}, tot_none.d != {}))
            Ed = sum((c[m] * B.get(m) * Bd.get(m) for m in A.biv()), F(0)); ok3 &= Ed == 0
        row('E1', f'R({n},0,1): for any even M and any bivector B, d(M M~)/dt = 0: the equation M. = -M B/2 keeps a motor a motor (exactly, no Lagrange multiplier); the integration space has 2^n + n(n+1)/2 numbers, the solution space n(n+1) of them', ok1)
        row('E2', f'R({n},0,1), random diagonal inertia: the Euler equation conserves the world-frame momentum M A(B) M~ exactly (product rule, no series)' + ('; with the Euler term removed or reversed it is not conserved' if n >= 2 else '; (the momentum is a scalar here, so there is no Euler term)'), ok2 and (n == 1 or all(a and b for a, b in ctl)))
        row('E3', f'R({n},0,1): the kinetic energy (1/2) sum c_m b_m^2 is conserved by the free flow, exactly. (It is conserved for either sign of the Euler term, so it cannot fix the sign; the world-frame momentum does.)', ok3)
    return out

def work_rows():
    for n in range(1, 5):
        A = Alg(n); j = min(2, n); okg = True; okh = True; ctl = True
        good = 0
        while good < 4:
            mass = F(RNG.randint(1, 4), RNG.randint(1, 3)); c = mass_diag(A, RNG, mass); g = F(RNG.randint(1, 5), RNG.randint(1, 2))
            M = motor(A, rpos(A, RNG), RNG.randint(0, 3)); B = rbiv(A, RNG); P0 = A.point([0] * n)
            Md = dM(M, B); vel = Md * P0 * M.rev() + M * P0 * Md.rev(); assert A.weight(vel) == 0; v = [A.q(vel, i + 1) for i in range(n)]
            Fg = gravity(A, M, g, j).scale(mass); Bd = Ainv(A, Fg, c)
            Ed = sum((c[m] * B.get(m) * Bd.get(m) for m in A.biv()), F(0)); Ud = mass * g * v[j - 1]
            okg &= Ed + Ud == 0 and all(not m & 1 for m in Fg.d)          # no e0 in the force line: it passes through the body origin
            pb = A.point(rpos(A, RNG)); aw = A.point(rpos(A, RNG)); k = F(RNG.randint(1, 6), RNG.randint(1, 3))
            Fh = hooke(A, M, k, pb, aw); Bd = Ainv(A, Fh, c); Ed = sum((c[m] * B.get(m) * Bd.get(m) for m in A.biv()), F(0))
            if Ed == 0: continue                                              # a zero force would make the reversed-sign control empty
            good += 1
            xw = A.pos(A.sand(M, pb)); a = A.pos(aw); velp = Md * pb * M.rev() + M * pb * Md.rev(); assert A.weight(velp) == 0; vp = [A.q(velp, i + 1) for i in range(n)]
            Ud = -k * sum((a[i] - xw[i]) * vp[i] for i in range(n)); okh &= Ed + Ud == 0
            ctl &= (Ed != 0) and (-Ed + Ud != 0)                            # the reversed spring does not conserve energy
        row('E4', f'R({n},0,1): gravity, F_g = m (M~ (-g e0j) M)^dual: its work on the kinetic energy is exactly minus d(m g height)/dt, it is a line through the body origin (no e0 part), for any mass and any rotational inertia', okg)
        row('E5', f'R({n},0,1): Hooke, F_H = k ((M~ a_w M) & p_b), the Hooke force of the listings, for ANY body point p_b and any anchor: the work is exactly minus d((k/2)|a_w - M p_b M~|^2)/dt; the reversed sign is not conservative', okh and ctl)

def ser_sum_sq(c, B):                                                      # sum c_m b_m(t)^2 as a series
    tot = Ser.const(0)
    for m in B.d: tot = tot + B.d[m] * B.d[m] * c[m]
    return tot
def one_series(): return [F(1)] + [F(0)] * K
def series_rows():
    out = {}
    for n in (3, 4):
        A = Alg(n); c = rdiag(A, RNG); M0 = motor(A, rpos(A, RNG), 1); B0 = rbiv(A, RNG)
        S = picard(A, [M0, B0], field_of(A, c)); W = S[0] * Amap(A, S[1], c) * S[0].rev(); W0 = M0 * Amap(A, B0, c) * M0.rev()
        Es = ser_sum_sq(c, S[1]); MM = S[0] * S[0].rev()
        ok = all(W.get(m).c[0] == W0.get(m) and W.get(m).c[1:] == [0] * K for m in set(W.d) | set(W0.d)) and Es.c[1:] == [0] * K and Es.c[0] != 0 and MM.get(0).c == one_series() and all(m == 0 for m in MM.d)
        row('E6', f'R({n},0,1), random diagonal inertia, random spin: the exact power series through t^{K} of the free flow keeps M A(B) M~ and the energy constant and M M~ = 1 (it needs {len(S[1].d)} velocity components and {len(S[0].d)} motor coefficients)', ok)
    for n in (2, 3, 4):
        A = Alg(n); j = 2; mass = F(3, 2); c = mass_diag(A, RNG, mass); g = F(5, 2); P0 = A.point([0] * n)
        M0 = motor(A, rpos(A, RNG), RNG.randint(0, 3)); B0 = rbiv(A, RNG); Md = dM(M0, B0)
        vel = Md * P0 * M0.rev() + M0 * P0 * Md.rev(); v0 = [A.q(vel, i + 1) for i in range(n)]; x0 = A.pos(A.sand(M0, P0))
        S = picard(A, [M0, B0], field_of(A, c, lambda M, B: gravity(A, M, g, j).scale(mass)))
        Q = A.sand(S[0], P0); X = A.pos(Q)
        ok = A.weight(Q).c == one_series()
        for i in range(n):
            want = [x0[i], v0[i], -g / 2 if i == j - 1 else F(0)] + [F(0)] * (K - 2); ok &= X[i].c == want
        row('E7', f'R({n},0,1): free fall of a spinning body (mass 3/2, random rotational inertia, random spin) under F_g: the world position of the centre is exactly x0 + v0 t - (g/2) t^2 e{j} (series through t^{K}); the mass cancels and the spin does not matter', ok)
    for n in (2, 3, 4):
        A = Alg(n); c = unit_c(A); P0 = A.point([0] * n); k = F(4)
        M0 = motor(A, rpos(A, RNG), RNG.randint(0, 3)); B0 = rbiv(A, RNG); Md = dM(M0, B0)
        vel = Md * P0 * M0.rev() + M0 * P0 * Md.rev(); v0 = [A.q(vel, i + 1) for i in range(n)]; x0 = A.pos(A.sand(M0, P0))
        S = picard(A, [M0, B0], field_of(A, c, lambda M, B: hooke(A, M, k, P0, P0))); X = A.pos(A.sand(S[0], P0)); cs, sn = cos_series(2), sin_series(2)
        ok = all(X[i].c == [x0[i] * cs[q] + v0[i] / 2 * sn[q] for q in range(K + 1)] for i in range(n))
        row('E8', f'R({n},0,1): a spring from the body centre to the world origin (k = 4) on a spinning body: every coordinate of the centre is x0 cos 2t + (v0/2) sin 2t, exactly (series through t^{K}): the spin does not couple to the centre, the n-dimensional isotropic oscillator of step 12', ok)
    ok = True
    for n in (1, 2, 3, 4):
        A = Alg(n); M = motor(A, rpos(A, RNG), 1); B = rbiv(A, RNG); X = A.point(rpos(A, RNG))
        ok &= A.sand(-M, X) == A.sand(M, X) and dM(-M, B) == -dM(M, B)
    A = Alg(2); w = 2; S = picard(A, [A.one(), MV(A.sq, {0b110: F(w)})], field_of(A, unit_c(A))); Q = A.sand(S[0], A.point([1, 0])); X = A.pos(Q)
    half = S[0].get(0).c == cos_series(1) and S[0].get(0b110).c in ([-v for v in sin_series(1)], sin_series(1))
    full = X[0].c == cos_series(2) and X[1].c in (sin_series(2), [-v for v in sin_series(2)])
    row('E9', 'R(n,0,1), n = 1..4: M and -M give the same motion and both solve M. = -M B/2 (the double cover); with B = 2 e12 the rotor series is cos t -+ sin t e12 (HALF the angle) while the point (1,0) turns by cos 2t, sin 2t (the full angle): the half angle of the oscillator rotor of step 12', ok and half and full)
    return out

# ---------------------------------------------------------------- F. the vertex masses of step 12 give the inertia of the body
def vertex_inertia():
    out = {}
    for n in (1, 2, 3, 4):
        A = Alg(n); m = F(RNG.randint(1, 5), RNG.randint(1, 3)); sz = [F(RNG.randint(1, 5), RNG.randint(1, 3)) for _ in range(n)]; ok = True
        for _ in range(3):
            B = rbiv(A, RNG); KE = F(0)
            for v in range(1 << n):
                p = A.point([(F(v >> i & 1) - F(1, 2)) * sz[i] for i in range(n)]); u = (p * B - B * p).scale(F(1, 2))
                assert A.weight(u) == 0; KE += m / (1 << n) * sum((A.q(u, i + 1) ** 2 for i in range(n)), F(0)) / 2
            cc = {}
            for mk_ in A.biv():
                if mk_ & 1: cc[mk_] = m
                else: j, k_ = [i for i in range(1, n + 1) if mk_ >> i & 1]; cc[mk_] = m * (sz[j - 1] ** 2 + sz[k_ - 1] ** 2) / 4
            ok &= KE == kinetic(A, B, cc)
        row('F1', f'R({n},0,1): 2^{n} equal point masses on the vertices (the masses of step 12): the kinetic energy of the body is (1/2) sum c_m b_m^2 with c = m on the translations and c = (m/4)(s_j^2 + s_k^2) on the rotation e_jk, no cross terms (generic B), exactly', ok)
    s = F(7, 3); solid = (((s / 2) ** 3 - (-s / 2) ** 3) / 3) / s
    row('F2', 'the vertex masses average x^2 to s^2/4, a uniform solid box to s^2/12: the rotational inertia of the printed cuboid (m/12 (s_j^2 + s_k^2)) is exactly one third of the same box carried by its 2^n vertices; the translational mass is the same', solid == s * s / 12 and F(1, 4) / F(1, 12) == 3)
    return out

# ---------------------------------------------------------------- G. the labels as an address: a faster picture of the motion
def bitlabels():
    out = {}
    for n in (1, 2, 3, 4):
        A = Alg(n); M = motor(A, rpos(A, RNG), RNG.randint(0, 3)); sz = [F(RNG.randint(1, 5), RNG.randint(1, 3)) for _ in range(n)]
        P0 = A.sand(M, A.point([0] * n)); Ei = [A.sand(M, A.dual(A.e(i + 1))) for i in range(n)]      # n + 1 sandwiches: the centre and the n edge directions
        base = P0 + sum((Ei[i].scale(-sz[i] / 2) for i in range(n)), A.zero()); T = [base]
        for i in range(n):
            for jj in range(1 << i): T.append(T[jj] + Ei[i].scale(sz[i]))                          # vertex 2^i + jj = vertex jj plus the edge i: one addition each
        direct = [A.sand(M, A.point([(F(v >> i & 1) - F(1, 2)) * sz[i] for i in range(n)])) for v in range(1 << n)]
        ok = all(T[v] == direct[v] for v in range(1 << n))
        C = A.pos(P0); anti = all([2 * C[i] - A.pos(T[v])[i] for i in range(n)] == A.pos(T[(1 << n) - 1 - v]) for v in range(1 << n))
        row('G1', f'R({n},0,1): the {1 << n} world vertices come from {n + 1} sandwiches (the centre and the {n} edge directions) and {(1 << n) - 1} additions, the vertex 2^i + j being the vertex j plus edge i; the bit label is the address (the direct way needs {1 << n} sandwiches; the printed demos sandwich both ends of every edge)', ok)
        row('G2', f'R({n},0,1): the complement of a label is the mirror image through the centre, x(~v) = 2 c - x(v) (the odd vertices are the even ones reflected): half of the table is enough', anti)
        out[str(n)] = {'sandwiches_direct': 1 << n, 'sandwiches_frame': n + 1, 'additions': (1 << n) - 1, 'edges': n * (1 << (n - 1))}
    for n in (1, 2, 3, 4):
        A = Alg(n); okd = oks = True
        for _ in range(8):
            M = motor(A, rpos(A, RNG), RNG.randint(0, 3)); sz = [F(RNG.randint(1, 5), RNG.randint(1, 3)) for _ in range(n)]
            nu = [F(RNG.choice([-3, -2, -1, 1, 2, 3]), RNG.randint(1, 3)) for _ in range(n)]; d = F(RNG.randint(-3, 3), RNG.randint(1, 3))
            plane = A.e(0).scale(d) + sum((A.e(i + 1).scale(nu[i]) for i in range(n)), A.zero())
            Ei = [A.sand(M, A.dual(A.e(i + 1))) for i in range(n)]; f = [[A.q(Ei[i], jx + 1) * sz[i] for jx in range(n)] for i in range(n)]
            vs = [A.sand(M, A.point([(F(v >> i & 1) - F(1, 2)) * sz[i] for i in range(n)])) for v in range(1 << n)]
            dist = [A.join(P_, plane).get(0) for P_ in vs]; xs = [A.pos(P_) for P_ in vs]
            lam = [l for l in (1, -1) if all(dist[v] == l * (sum(nu[i] * xs[v][i] for i in range(n)) + d) for v in range(1 << n))]
            okd &= len(lam) == 1
            label = sum((1 << i) for i in range(n) if lam[0] * sum(nu[jx] * f[i][jx] for jx in range(n)) < 0)       # minimise the join scalar: take edge i when it lowers it
            oks &= dist[label] == min(dist) and dist.count(min(dist)) == 1
        row('G3', f'R({n},0,1): the collision test of the printed demo (point v plane < 0) is the signed distance (+-1 times nu.x + d, one sign for all); the deepest vertex under a plane is read from {n} sign bits (bit i is set when the transported edge i points down), not searched among {1 << n}', okd and oks)
    for n in (2, 3, 4):
        ok = True
        for _ in range(6):
            while True:
                fp = [(F(RNG.randint(-6, 6), RNG.randint(1, 3)), F(RNG.randint(-6, 6), RNG.randint(1, 3))) for _ in range(n)]
                if all(a != (0, 0) for a in fp) and all(fp[i][0] * fp[j][1] - fp[i][1] * fp[j][0] != 0 for i in range(n) for j in range(i + 1, n)): break
            pts = sorted({(sum(fp[i][0] for i in range(n) if v >> i & 1), sum(fp[i][1] for i in range(n) if v >> i & 1)): v for v in range(1 << n)}.items())
            def hull(P_):
                def cr(o, a, b): return (a[0][0] - o[0][0]) * (b[0][1] - o[0][1]) - (a[0][1] - o[0][1]) * (b[0][0] - o[0][0])
                lo = []; up = []
                for p in P_:
                    while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
                    lo.append(p)
                for p in reversed(P_):
                    while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
                    up.append(p)
                return lo[:-1] + up[:-1]
            H = [v for _, v in hull(pts)]; flips = [H[i] ^ H[(i + 1) % len(H)] for i in range(len(H))]
            ok &= len(H) == 2 * n and all(pc(x) == 1 for x in flips) and sorted(x.bit_length() - 1 for x in flips) == sorted(list(range(n)) * 2)
        row('G4', f'a flat picture of the {n}-cube: its outline has exactly {2 * n} vertices, consecutive outline vertices differ in ONE bit (the outline walks along cube edges), and each bit flips exactly twice (up once, down once): the zonogon whose sides are the {n} projected edge vectors, drawn from {n} vectors', ok)
    return out


def frame_table():
    """the frame table: every count of the ladder n = 1..5, enumerated from the blades (not typed in), against its closed form"""
    out = {}; ok = True
    for n in range(1, 6):
        A = Alg(n); N = 1 << (n + 1); verts = 1 << n
        edges = sum(1 for a in range(verts) for i in range(n) if not a >> i & 1)
        motor = sum(1 for m in range(N) if pc(m) % 2 == 0); biv = len(A.biv()); force = sum(1 for m in range(N) if pc(m) == n - 1)
        t = {'vertices': verts, 'edges': edges, 'motor_coefficients': motor, 'bivector_components': biv, 'group_dimension': n * (n + 1) // 2, 'force_components': force,
             'moments': biv, 'sandwiches_direct': verts, 'sandwiches_frame': n + 1, 'additions': verts - 1,
             'integration_numbers': motor + biv, 'solution_numbers': n * (n + 1), 'outline_vertices': 2 * n if n >= 2 else 2}
        t['norm_equations'] = sum(1 for m in range(N) if pc(m) == 0 or pc(m) == 4)               # grade 0 plus the grade-4 components of R R~ (none of them for n <= 2)
        ok &= edges == n * verts // 2 and motor == verts and biv == comb(n + 1, 2) == n * (n + 1) // 2 and force == comb(n + 1, n - 1) and t['solution_numbers'] == 2 * biv and t['integration_numbers'] == verts + biv
        ok &= t['norm_equations'] == 1 + comb(n + 1, 4)
        t['norm_ok'] = t['norm_equations'] == verts - t['group_dimension']
        out[str(n)] = t
    row('G5', 'the frame table: for n = 1..5 every count is enumerated from the blades and equals its closed form: 2^n vertices, n 2^(n-1) edges, 2^n motor coefficients, n(n+1)/2 bivector components (the velocity B, and as many moments), C(n+1, n-1) force components (grade n - 1), 2^n + n(n+1)/2 integration numbers against n(n+1) solution numbers, 2^n direct sandwiches against n + 1 for the frame, 2^n - 1 additions; the equations of the norm 1 + C(n+1, 4) equal 2^n - n(n+1)/2 for n <= 4 and fall short at n = 5', ok and all(out[str(n)]['norm_ok'] for n in range(1, 5)) and not out['5']['norm_ok'])
    return out

def pair_rows():
    """two bodies joined by one Hooke spring (a vertex of each): Newton's third law as forques, and the energy of the pair"""
    for n in (2, 3, 4):
        A = Alg(n); ok = True; ctl_k = ctl_sign = True
        for _ in range(4):
            c1 = mass_diag(A, RNG, F(RNG.randint(1, 4), RNG.randint(1, 3))); c2 = mass_diag(A, RNG, F(RNG.randint(1, 4), RNG.randint(1, 3)))
            M1 = motor(A, rpos(A, RNG), RNG.randint(0, 3)); M2 = motor(A, rpos(A, RNG), RNG.randint(0, 3)); B1 = rbiv(A, RNG); B2 = rbiv(A, RNG)
            p1 = A.point(rpos(A, RNG)); p2 = A.point(rpos(A, RNG)); k = F(RNG.randint(1, 6), RNG.randint(1, 3))
            w1 = A.sand(M1, p1); w2 = A.sand(M2, p2)                                           # the world positions of the two ends
            F1 = hooke(A, M1, k, p1, w2); F2 = hooke(A, M2, k, p2, w1)
            def world_rate(M, B, c, Fo):
                Md = dM(M, B); Pi = Amap(A, B, c); Pid = Amap(A, dB(A, B, c, Fo), c)
                return Md * Pi * M.rev() + M * Pid * M.rev() + M * Pi * Md.rev()
            tot = world_rate(M1, B1, c1, F1) + world_rate(M2, B2, c2, F2)
            ok &= tot.d == {}
            tot_k = world_rate(M1, B1, c1, F1) + world_rate(M2, B2, c2, hooke(A, M2, k + 1, p2, w1)); ctl_k &= tot_k.d != {}
            tot_s = world_rate(M1, B1, c1, F1) + world_rate(M2, B2, c2, F2.scale(-1)); ctl_sign &= tot_s.d != {}
            Md1, Md2 = dM(M1, B1), dM(M2, B2); Bd1 = dB(A, B1, c1, F1); Bd2 = dB(A, B2, c2, F2)
            Ed = sum((c1[m] * B1.get(m) * Bd1.get(m) for m in A.biv()), F(0)) + sum((c2[m] * B2.get(m) * Bd2.get(m) for m in A.biv()), F(0))
            va = Md1 * p1 * M1.rev() + M1 * p1 * Md1.rev(); vb = Md2 * p2 * M2.rev() + M2 * p2 * Md2.rev(); xa, xb = A.pos(w1), A.pos(w2)
            Ud = k * sum((xa[i] - xb[i]) * (A.q(va, i + 1) - A.q(vb, i + 1)) for i in range(n))
            ok &= Ed + Ud == 0 and Ed != 0
        row('E12', f'R({n},0,1): two bodies joined by one Hooke spring between a vertex of each: the two forques are the same line reversed, so the total world momentum M A(B) M~ summed over both bodies has derivative exactly 0 (Newton III as forques), and the energy K1 + K2 + (k/2)|x_a - x_b|^2 is conserved exactly; a different k on one end, or a reversed spring on one end, breaks the momentum', ok and ctl_k and ctl_sign)

def damping_row():
    for n in (1, 2, 3, 4):
        A = Alg(n); ok = True
        for _ in range(4):
            al = F(RNG.randint(1, 6), RNG.randint(1, 4)); B = rbiv(A, RNG); c = unit_c(A); Fd = A.dual(B.scale(-al))
            Bd = dB(A, B, c, Fd); free = dB(A, B, c)
            ok &= Bd == free - B.scale(al) and sum((c[m] * B.get(m) * Bd.get(m) for m in A.biv()), F(0)) == -2 * al * kinetic(A, B, c)
            cg = rdiag(A, RNG); Bg = dB(A, B, cg, Fd); ok &= sum((cg[m] * B.get(m) * Bg.get(m) for m in A.biv()), F(0)) == -al * sum((v * v for v in B.d.values()), F(0)) and sum((v * v for v in B.d.values()), F(0)) > 0
        row('E10', f'R({n},0,1): the damping forque of the listings, F_d = (-alpha B)^dual, adds exactly -alpha B to B. for unit inertia, so the energy obeys E. = -2 alpha E; for any diagonal inertia it removes energy at the rate -alpha |B|^2 < 0 (the Euler term does not change the energy)', ok)

# ---------------------------------------------------------------- H. hanging by a vertex: the rest state of the widget is an exact equilibrium
def hang_rows():
    out = {}
    for n in (1, 2, 3):
        A = Alg(n); j = 1 if n == 1 else 2; m = F(3, 2); g = F(2); k = F(3); ok = ctl_side = ctl_height = True; used = []
        cand = [rotor(A, i) for i in range(4)] if n > 1 else [A.one()]
        for ri, R in enumerate(cand):
            if n == 1: f = [[F(1)]]
            else:
                f = [[A.q(A.sand(R, A.dual(A.e(i + 1))), jx + 1) for jx in range(n)] for i in range(n)]
            if any(f[i][j - 1] == 0 for i in range(n)): continue
            t = rpos(A, RNG); M = A.trans(t) * R; s = [2 * abs(f[i][j - 1]) for i in range(n)]
            bits = [1 if f[i][j - 1] > 0 else 0 for i in range(n)]; label = sum(b << i for i, b in enumerate(bits))
            pbv = [(F(bits[i]) - F(1, 2)) * s[i] for i in range(n)]; pb = A.point(pbv); xc = A.pos(A.sand(M, A.point([0] * n))); xv = A.pos(A.sand(M, pb))
            vertical = [xv[i] - xc[i] for i in range(n)] == [F(1) if i == j - 1 else F(0) for i in range(n)]
            up = lambda d: [(F(1) if i == j - 1 else F(0)) * d for i in range(n)]
            anchor = [xv[i] + up(m * g / k)[i] for i in range(n)]
            Ftot = lambda anc: hooke(A, M, k, pb, A.point(anc)) + gravity(A, M, g, j).scale(m)
            eq = Ftot(anchor) == A.zero()
            comp = (1 << n) - 1 - label; pbc = A.point([(F(1 - b) - F(1, 2)) * si for b, si in zip(bits, s)]); xvc = A.pos(A.sand(M, pbc))
            eq_c = (hooke(A, M, k, pbc, A.point([xvc[i] + up(m * g / k)[i] for i in range(n)])) + gravity(A, M, g, j).scale(m)) == A.zero()
            side = [anchor[i] + (F(1, 3) if (n > 1 and i == 0) else 0) for i in range(n)]
            ctl_side &= n == 1 or Ftot(side) != A.zero()
            ctl_height &= Ftot([anchor[i] + (F(1, 3) if i == j - 1 else 0) for i in range(n)]) != A.zero()
            ok &= vertical and eq and eq_c
            used.append({'rotor': ri, 'label': format(label, f'0{n}b')[::-1], 'complement': format(comp, f'0{n}b')[::-1], 'sizes': [str(x) for x in s]})
            if len(used) == (1 if n == 1 else 3): break
        assert used, n
        row('E11', f'R({n},0,1): hang a {n}-cube from a zero-length Hooke spring (k = 3) at a vertex, under gravity (m = 3/2, g = 2): choose the edge lengths s_i = 2 |f_i{j}| (f_ij = the transported edge i read along e{j}) and the vertex whose bit i is set exactly when f_i{j} > 0 (the sign-bit rule of G3): the vertex is then straight above the centre, and with the anchor above it by m g / k the spring forque and the gravity forque cancel EXACTLY (so B = 0 is a rest state); the complement vertex (straight below the centre) balances too; moving the anchor sideways or changing its height breaks it' , ok and ctl_side and ctl_height)
        out[str(n)] = used
    return out

# ---------------------------------------------------------------- T. the free top (n = 3): Euler's equations, the three kinds of i again
def top_rows():
    A = Alg(3); planes = [0b1100, 0b1010, 0b0110]; out = {}                      # e23, e13, e12: the rotations about axes 1, 2, 3 (c of a plane = the moment about the axis it leaves out)
    ok = moving = True
    for _ in range(6):
        c = rdiag(A, RNG)
        for m in planes: ok &= dB(A, A.blade(m, F(RNG.randint(1, 5), RNG.randint(1, 3))), c) == A.zero()
        c2 = dict(c); c2[planes[0]] = c2[planes[1]] + 1; moving &= dB(A, A.blade(planes[0], 1) + A.blade(planes[1], 1), c2) != A.zero()
    row('T1', 'R(3,0,1), any diagonal inertia: a spin about a principal axis (B = b e12, b e13 or b e23) is stationary, dB = 0 exactly, because the commutator of a plane with its own dual vanishes; a spin about a diagonal axis (e12 + e13) with unequal moments is not', ok and moving)
    ok = ctl = True; kinds = []
    for _ in range(8):
        while True:
            I3 = [F(RNG.randint(1, 9), RNG.randint(1, 3)) for _ in range(3)]
            if len(set(I3)) == 3: break
        c = rdiag(A, RNG)
        for pl, i_ in zip(planes, I3): c[pl] = i_
        for a in range(3):
            w = F(RNG.randint(1, 5), RNG.randint(1, 3)); B0 = A.blade(planes[a], w); oth = [i for i in range(3) if i != a]; Ia = I3[a]; Ib, Ic = I3[oth[0]], I3[oth[1]]
            J = [[F(0)] * 2 for _ in range(2)]
            for col, o in enumerate(oth):
                X = A.blade(planes[o], 1); r_ = dB(A, B0 + X, c) - dB(A, B0, c) - dB(A, X, c)
                for r2, o2 in enumerate(oth): J[r2][col] = r_.get(planes[o2])
                assert all(m in (planes[oth[0]], planes[oth[1]]) for m in r_.d)
            J2 = [[sum(J[i][m_] * J[m_][jj] for m_ in range(2)) for jj in range(2)] for i in range(2)]
            mu = w * w * (Ic - Ia) * (Ia - Ib) / (Ib * Ic); wrong = w * w * (Ia - Ib) * (Ia - Ic) / (Ib * Ic)
            ok &= J[0][0] == 0 and J[1][1] == 0 and J2 == [[mu, 0], [0, mu]] and (mu > 0) == (min(I3) < Ia < max(I3))
            ctl &= wrong != mu and (wrong > 0) != (mu > 0)
            kinds.append('inverted' if mu > 0 else 'oscillator')
    row('T2', 'R(3,0,1), three distinct moments I1, I2, I3: linearise the free Euler equation about a spin b e_a (a principal axis) and the 2 x 2 block J of the two other rotation components has zero diagonal and J^2 = mu 1 with mu = b^2 (I_c - I_a)(I_a - I_b)/(I_b I_c), exactly: mu < 0 (rotation, an oscillator) for the largest and the smallest moment, mu > 0 (a boost, an INVERTED oscillator: the tennis-racket flip) for the intermediate one; the formula with the wrong sign pattern is refused', ok and ctl and {'inverted', 'oscillator'} == set(kinds))
    ok = ok2 = True
    for _ in range(6):
        Ib_ = F(RNG.randint(1, 7), RNG.randint(1, 3)); Ia = F(RNG.randint(1, 9), RNG.randint(1, 3))
        if Ia == Ib_: continue
        c = rdiag(A, RNG); c[planes[0]] = Ia; c[planes[1]] = Ib_; c[planes[2]] = Ib_; w = F(RNG.randint(1, 5), RNG.randint(1, 3)); B0 = A.blade(planes[0], w)
        J = [[F(0)] * 2 for _ in range(2)]
        for col, o in enumerate((1, 2)):
            X = A.blade(planes[o], 1); r_ = dB(A, B0 + X, c) - dB(A, B0, c) - dB(A, X, c)
            for r2, o2 in enumerate((1, 2)): J[r2][col] = r_.get(planes[o2])
        Om = w * (Ia - Ib_) / Ib_; J2 = [[sum(J[i][m_] * J[m_][jj] for m_ in range(2)) for jj in range(2)] for i in range(2)]
        ok &= J2 == [[-Om * Om, 0], [0, -Om * Om]]
    cs = rdiag(A, RNG); cs.update({pl: F(5, 7) for pl in planes})
    for _ in range(4):
        B = MV(A.sq, {pl: F(RNG.randint(-5, 5), RNG.randint(1, 3)) for pl in planes}); ok2 &= dB(A, B, cs) == A.zero()
    Bs = MV(A.sq, {0b1010: F(35, 100), 0b0110: F(-27, 100)}); ok2 &= dB(A, Bs, unit_c(A)) == A.zero()
    row('T3', 'R(3,0,1), symmetric top (two equal moments I, the third I_a): the perturbation turns exactly at Omega = b (I_a - I)/I, J^2 = -Omega^2 1 (the precession of the symmetric top, a pure oscillator); with all three rotational moments equal every rotation-only B is stationary (the symmetric-top example of the repository, B = 0.35 e13 - 0.27 e12 with unit inertia)', ok and ok2)
    out['kinds'] = kinds[:3]
    return out

# ---------------------------------------------------------------- N. Newton: two bodies in the plane (the moon), bodies in space (the planets)
from math import isqrt
def isqrtF(x):                                                                   # exact square root of a rational perfect square
    r = F(isqrt(x.numerator), isqrt(x.denominator)); assert r * r == x, x; return r
def disp(A, pa, pb):                                                             # the ideal vector pb - pa and its components
    v = pb - pa; assert A.weight(v) == 0; return [A.q(v, i + 1) for i in range(A.n)]
def accel(A, ps, ms, G, power=3, twist=0):
    """a_i = G sum_j m_j (p_j - p_i) / d_ij^power, d_ij = the norm of the ideal vector p_j - p_i (rational for the chosen data)"""
    N = len(ps); acc = [[F(0)] * A.n for _ in ps]
    for i in range(N):
        for j in range(N):
            if i == j: continue
            r = disp(A, ps[i], ps[j]); d = isqrtF(sum(x * x for x in r)); f = G * ms[j] / d ** power
            acc[i] = [a + f * x for a, x in zip(acc[i], r)]
            if twist and A.n >= 2: acc[i][0] += twist * f * (-r[1]); acc[i][1] += twist * f * r[0]
    return acc
def newton_data(n):
    if n == 2: return [(0, 0), (3, 0), (3, 4)], [F(2), F(3), F(5)]
    return [(0, 0, 0), (3, 4, 0), (0, 0, 12), (3, 4, 12)], [F(2), F(3), F(1), F(5)]
def newton_rows():
    out = {}
    for n in (2, 3):
        A = Alg(n); xs, ms = newton_data(n); ps = [A.point([F(c) for c in x]) for x in xs]; G = F(3, 2); N = len(ps)
        vs = [[F(RNG.randint(-4, 4), RNG.randint(1, 3)) for _ in range(n)] for _ in xs]
        def balances(power, twist):
            acc = accel(A, ps, ms, G, power, twist)
            P = [sum(ms[i] * acc[i][c] for i in range(N)) for c in range(n)]
            L = [sum(ms[i] * (F(xs[i][a]) * acc[i][b] - F(xs[i][b]) * acc[i][a]) for i in range(N)) for a in range(n) for b in range(a + 1, n)]
            Ed = sum(ms[i] * sum(vs[i][c] * acc[i][c] for c in range(n)) for i in range(N))
            Ud = F(0)
            for i in range(N):
                for j in range(i + 1, N):
                    r = disp(A, ps[i], ps[j]); d = isqrtF(sum(x * x for x in r)); Ud += G * ms[i] * ms[j] * sum(r[c] * (vs[j][c] - vs[i][c]) for c in range(n)) / d ** 3
            return all(x == 0 for x in P), all(x == 0 for x in L), Ed + Ud == 0
        good = balances(3, 0); wrongE = balances(2, 0); wrongL = balances(3, 1)
        row('N1', f'R({n},0,1), {N} point masses with integer separations ({"3-4-5" if n == 2 else "5, 12, 13"}), Newton a_i = G sum_j m_j (p_j - p_i)/d_ij^3 with the p_j - p_i ideal vectors of the PGA points: the total momentum, the total angular momentum (all bivector components) and the energy K + U (U = -G sum m_i m_j/d_ij) are conserved EXACTLY; with 1/d^2 instead of 1/d^3 the energy is not, and with a perpendicular (non-central) part the angular momentum is not', all(good) and good[0] and not wrongE[2] and not wrongL[1])
        out[str(n)] = {'masses': [str(m_) for m_ in ms], 'points': [list(x) for x in xs]}
    for n in (2, 3, 4):
        A = Alg(n); ok = True
        for _ in range(4):
            x = rpos(A, RNG); y = rpos(A, RNG); pa = A.point(x); pb = A.point(y); W = A.dual(pa).wedge(A.dual(pb))
            e0part = [W.get(1 | 1 << (i + 1)) for i in range(n)]
            ok &= A.dual(A.join(pa, pb)) == W and e0part == [y[i] - x[i] for i in range(n)] and A.weight(pb - pa) == 0 and A.weight(pa + (pb - pa).scale(F(1, 3))) == 1 and A.weight(pa + pb) == 2
        row('N2', f'R({n},0,1): the join of two points, the line of the Hooke force, is dual(a*) ^ (b*) with e0-part exactly b - a (so its norm is the distance d); a point plus a multiple of an ideal vector is a point (weight 1), a point plus a point has weight 2: Hooke scales the join by k (potential k d^2/2), Newton by G m1 m2/d^3 (potential -G m1 m2/d); the same line carries both laws', ok)
    return out

def kepler_series(x0, v0, GM, power=3, upow=3):
    """x' = v, v' = -GM u^power x, u' = -u^upow (x.v) with u = 1/d: a polynomial system, so the exact series follows from Picard iteration"""
    n = len(x0); d0 = isqrtF(sum(a * a for a in x0)); S = [Ser.const(a) for a in x0] + [Ser.const(a) for a in v0] + [Ser.const(1 / d0)]
    init = list(S)
    for _ in range(K):
        x = S[:n]; v = S[n:2 * n]; u = S[2 * n]; up = u
        for _i in range(power - 1): up = up * u
        uq = u
        for _i in range(upow - 1): uq = uq * u
        xv = Ser.const(0)
        for a, b in zip(x, v): xv = xv + a * b
        rhs = list(v) + [-(up * a) * GM for a in x] + [-(uq * xv)]
        S = [init[i] + rhs[i].integ() for i in range(2 * n + 1)]
    return S
def const_series(s): return all(v == 0 for v in s.c[1:])
def kepler_rows():
    out = {}
    GM = F(2); S = kepler_series([F(2), F(0)], [F(0), F(1)], GM); cs, sn = cos_series(F(1, 2)), sin_series(F(1, 2))
    circ = S[0].c == [2 * v for v in cs] and S[1].c == [2 * v for v in sn] and S[2].c == [-v for v in sn] and S[3].c == cs
    wrong = kepler_series([F(2), F(0)], [F(0), F(1)], GM, power=2)
    row('N3', 'one body round a fixed centre (the Kepler problem in the plane, a polynomial system in (x, v, u = 1/d)): the circular orbit r = 2, v = 1, GM = 2 has the exact series x = 2 cos(t/2), y = 2 sin(t/2) through t^10, i.e. omega^2 r^3 = GM (Kepler III for a circle); with the wrong power of d the series is a different curve', circ and wrong[0].c != S[0].c)
    x0 = [F(1), F(0)]; v0 = [F(0), F(3, 4)]; GM = F(1); S = kepler_series(x0, v0, GM); x, y, vx, vy, u = S
    E = (vx * vx + vy * vy) * F(1, 2) - u * GM; L = x * vy - y * vx; Ax = vy * L - u * GM * x; Ay = Ser.const(0) - vx * L - u * GM * y
    ok = all(const_series(q) for q in (E, L, Ax, Ay)) and E.c[0] == F(-23, 32) and L.c[0] == F(3, 4) and Ax.c[0] == F(-7, 16) and Ay.c[0] == 0
    bad = kepler_series(x0, v0, GM, upow=2); Eb = (bad[2] * bad[2] + bad[3] * bad[3]) * F(1, 2) - bad[4] * GM
    row('N4', 'the Kepler problem, an eccentric orbit (x = (1, 0), v = (0, 3/4), GM = 1): the energy -23/32, the angular momentum 3/4 and the Laplace-Runge-Lenz vector (-7/16, 0) are constant through t^10 as exact series (e = 7/16, a = 16/23: the start is the far point); a wrong equation for u = 1/d breaks the energy', ok and not const_series(Eb))
    m1, m2, G = F(2), F(3), F(5, 4); X1 = [F(0), F(0)]; X2 = [F(3), F(4)]; V1 = [F(1, 2), F(-1)]; V2 = [F(-1, 3), F(1, 4)]
    d0 = isqrtF(F(25)); S = [Ser.const(a) for a in X1 + X2 + V1 + V2] + [Ser.const(1 / d0)]; init = list(S)
    for _ in range(K):
        x1, y1, x2, y2, u1, w1, u2, w2, u = S; r = [x2 - x1, y2 - y1]; u3 = u * u * u; rv = r[0] * (u2 - u1) + r[1] * (w2 - w1)
        rhs = [u1, w1, u2, w2, u3 * r[0] * (G * m2), u3 * r[1] * (G * m2), -(u3 * r[0]) * (G * m1), -(u3 * r[1]) * (G * m1), -(u * u * u * rv)]
        S = [init[i] + rhs[i].integ() for i in range(9)]
    M_ = m1 + m2; cg = [(m1 * S[0] + m2 * S[2]) * (1 / M_), (m1 * S[1] + m2 * S[3]) * (1 / M_)]
    c0 = [(m1 * X1[i] + m2 * X2[i]) / M_ for i in range(2)]; V = [(m1 * V1[i] + m2 * V2[i]) / M_ for i in range(2)]
    straight = all(cg[i].c == [c0[i], V[i]] + [F(0)] * (K - 1) for i in range(2))
    rel = kepler_series([X2[0] - X1[0], X2[1] - X1[1]], [V2[0] - V1[0], V2[1] - V1[1]], G * M_)
    same = S[2].c == [a + b for a, b in zip(S[0].c, rel[0].c)] and S[3].c == [a + b for a, b in zip(S[1].c, rel[1].c)]
    row('N5', 'two bodies in the plane (the moon example: Earth and Moon): the centre of gravity (the mass-weighted sum of the two PGA points, weight m1 + m2) moves exactly in a straight line, and the relative vector r = p2 - p1 obeys the one-body Kepler equation with GM = G (m1 + m2) (exact series through t^10, masses 2 and 3, G = 5/4)', straight and same)
    out['eccentric'] = {'E': '-23/32', 'L': '3/4', 'LRL': ['-7/16', '0']}
    return out

def rk4_rows():
    A = Alg(1); k = F(1); anchor = A.point([F(0)]); ok = ok2 = True; idx = None
    for h in (F(1, 4), F(1, 2), F(1, 8)):
        x0, v0 = F(RNG.randint(1, 5), RNG.randint(1, 3)), F(RNG.randint(-3, 3), RNG.randint(1, 3))
        p = A.point([x0]); v = A.point([x0 + v0]) - p                         # an ideal vector of length v0
        f = lambda P, V: (V, (P - anchor).scale(-k))
        k1 = f(p, v); s2 = (p + k1[0].scale(h / 2), v + k1[1].scale(h / 2)); k2 = f(*s2); s3 = (p + k2[0].scale(h / 2), v + k2[1].scale(h / 2)); k3 = f(*s3)
        s4 = (p + k3[0].scale(h), v + k3[1].scale(h)); k4 = f(*s4)
        pn = p + (k2[0] + k3[0] + (k1[0] + k4[0]).scale(F(1, 2))).scale(h / 3); vn = v + (k2[1] + k3[1] + (k1[1] + k4[1]).scale(F(1, 2))).scale(h / 3)
        ok &= all(A.weight(P_) == 1 for P_ in (p, s2[0], s3[0], s4[0], pn)) and all(A.weight(V_) == 0 for V_ in (v, s2[1], s3[1], s4[1], vn))
        xn = A.pos(pn)[0]; vn_ = A.q(vn, 1)
        v0c = A.q(v, 1)
        want_x = x0 * (1 - h * h / 2 + h ** 4 / 24) + v0c * (h - h ** 3 / 6); want_v = v0c * (1 - h * h / 2 + h ** 4 / 24) - x0 * (h - h ** 3 / 6)
        ok2 &= xn == want_x and vn_ == want_v
        E0 = x0 * x0 + v0c * v0c; E1 = xn * xn + vn_ * vn_; ok2 &= E1 == E0 * (1 - h ** 6 / 72 + h ** 8 / 576)
    row('N6', 'Runge-Kutta 4 on PGA points, as the repository examples use it (y + h k with k an ideal vector): every stage is a point (weight exactly 1) and every velocity stays ideal (weight 0); on the oscillator x" = -x one step is exactly x (1 - h^2/2 + h^4/24) + v (h - h^3/6) (the Taylor series of the exact flow through h^4) and the energy is multiplied by 1 - h^6/72 + h^8/576 < 1 per step: RK4 loses energy at O(h^6), the exact rotor flow loses none', ok and ok2)
    A = Alg(2); ok = True
    for _ in range(4):
        w = F(RNG.randint(1, 5), RNG.randint(1, 3)); h = F(RNG.randint(1, 4), RNG.randint(1, 4)); M = rotor(A, 0); B = MV(A.sq, {0b110: w}); Mn = M + dM(M, B).scale(h); P = Mn * Mn.rev()
        ok &= P.d == {0: 1 + (h * w / 2) ** 2}
    row('N7', 'R(2,0,1): an explicit Euler step M + h M. of the motor equation leaves the motor group: M M~ = 1 + (h b/2)^2 exactly for a rotation rate b (the exact flow, a rotor exp(-h B/2), has M M~ = 1 at every step, E1); so an Euler or RK4 step on motors is renormalised, a rotor step is not', ok)


from decimal import Decimal, getcontext
getcontext().prec = 40
def dec(x): return F(Decimal(x))                                                  # a printed decimal as an exact rational
def D(x): return Decimal(x.numerator) / Decimal(x.denominator)
PI = Decimal('3.14159265358979323846264338327950288')
def moon_rows():
    G = dec('6.6703E-11'); mE = dec('5.97237E24'); mM = dec('7.342E22'); vM = F(1085); dEM = dec('362400E3')
    CoG = dEM * mM / (mE + mM); A = Alg(2)
    xE = [-CoG, F(0)]; xM = [dEM - CoG, F(0)]; vE = [F(0), -vM * CoG / dEM]; vMo = [F(0), vM * (dEM - CoG) / dEM]
    S = A.point(xE).scale(mE) + A.point(xM).scale(mM)
    ok = A.weight(S) == mE + mM and A.pos(S) == [0, 0]
    ok &= [mE * vE[i] + mM * vMo[i] for i in range(2)] == [0, 0] and [vMo[i] - vE[i] for i in range(2)] == [0, vM] and (xM[0] - xE[0]) * (vMo[0] - vE[0]) + (xM[1] - xE[1]) * (vMo[1] - vE[1]) == 0
    mu = G * (mE + mM); r = dEM; v2 = vM * vM; e = r * v2 / mu - 1; a = 1 / (2 / r - v2 / mu)
    ok &= v2 / 2 - mu / r < 0 and e > 0 and a * (1 - e) == r
    T = 2 * PI * (D(a) ** 3 / D(mu)).sqrt() / Decimal(86400)
    row('N8', 'the moon example of the repository, its printed constants as exact rationals: with the origin at the centre of gravity the mass-weighted PGA points sum to the origin (weight m_E + m_M) and the two momenta cancel exactly; the relative speed is 1085 m/s, perpendicular to the separation (so the start is an apsis); the orbit is bound; e = r v^2/GM - 1 and a = 1/(2/r - v^2/GM) satisfy a (1 - e) = r (a perigee); Kepler III then gives the period', ok)
    return {'e': str(D(e).quantize(Decimal('0.0001'))), 'a_km': str((D(a) / 1000).quantize(Decimal('1'))), 'apogee_km': str((D(a * (1 + e)) / 1000).quantize(Decimal('1'))), 'period_days': str(T.quantize(Decimal('0.01')))}

PLANETS = {   # the table of example_pga3d_physics_planets.html, JPL Horizons 16/01/2018 as printed there: mass kg, position km, velocity km/s (the Sun and five planets)
 'Sun': ('1.988544E30', ('2.564294388666002E+05', '9.282480498916068E+05', '-1.766238790604926E+04'), ('-1.032271613682197E-02', '8.506510987745193E-03', '2.500579386306204E-04')),
 'Mercury': ('3.302E23', ('-4.261433008703040E+07', '-5.180047961851221E+07', '-3.933312499175891E+05'), ('2.791200817718316E+01', '-2.845907905315504E+01', '-4.887507665269149E+00')),
 'Venus': ('48.685E23', ('5.357396412032661E+07', '-9.395832506522638E+07', '-4.396021713049673E+06'), ('3.028389624261208E+01', '1.704407507992616E+01', '-1.514240016876114E+00')),
 'Earth': ('5.97219E24', ('-6.321181522689363E+07', '1.337035149539065E+08', '-2.323422257646173E+04'), ('-2.738214042693713E+01', '-1.295254402346621E+01', '1.833826936016081E-03')),
 'Mars': ('6.4185E23', ('-2.261872038770745E+08', '-8.456074820817514E+07', '3.748261255788427E+06'), ('9.452949401620625E+00', '-2.058946931255050E+01', '-6.636171336482146E-01')),
 'Jupiter': ('1898.13E24', ('-6.267852905434124E+08', '-5.152098357372769E+08', '1.615654184230065E+07'), ('8.141900694513106E+00', '-9.472185978646950E+00', '-1.428289208967608E-01'))}
STD_A = {'Mercury': Decimal('0.387098'), 'Venus': Decimal('0.723332'), 'Earth': Decimal('1.000003'), 'Mars': Decimal('1.523679'), 'Jupiter': Decimal('5.2026')}   # standard mean semi-major axes in AU (from memory of the usual tables, not fetched)
def planets_rows():
    G = dec('6.6723E-11'); AU = dec('149597870.7'); sun = PLANETS['Sun']; Ms = dec(sun[0]); out = {}; worst = Decimal(0)
    for k, (m, p, v) in PLANETS.items():
        if k == 'Sun': continue
        r = [dec(a) - dec(b) for a, b in zip(p, sun[1])]; w = [dec(a) - dec(b) for a, b in zip(v, sun[2])]; r2 = sum(x * x for x in r); v2 = sum(x * x for x in w)
        mu = G * (Ms + dec(m)) / 10 ** 9; rr = D(r2).sqrt(); a = 1 / (2 / rr - D(v2 / mu)); rel = abs(a / D(AU) / STD_A[k] - 1); worst = max(worst, rel)
        out[k] = {'r_AU': str((rr / D(AU)).quantize(Decimal('0.0001'))), 'a_AU': str((a / D(AU)).quantize(Decimal('0.0001'))), 'speed_kms': str(D(v2).sqrt().quantize(Decimal('0.01')))}
    P = [sum(dec(PLANETS[k][0]) * dec(PLANETS[k][2][i]) for k in PLANETS) for i in range(3)]
    tot = sum(dec(PLANETS[k][0]) * D(sum(dec(c) ** 2 for c in PLANETS[k][2])).sqrt().__float__().__round__(0) if False else Decimal(0) for k in PLANETS)
    tot = sum(D(dec(PLANETS[k][0])) * D(sum(dec(c) ** 2 for c in PLANETS[k][2])).sqrt() for k in PLANETS)
    frac = D(sum(x * x for x in P)).sqrt() / tot
    row('N9', 'PLAUSIBILITY, not verification (JPL cannot be reached from here): the table of the planets example, read as exact rationals, gives each planet (relative to the Sun) an osculating semi-major axis within 0.2% of the standard value (Mercury 0.3871, Venus 0.7233, Earth 1.000, Mars 1.5237, Jupiter 5.2026 AU) and Earth 0.984 AU from the Sun with speed 30.29 km/s; positions and velocities of the table agree with each other. The total momentum of the six bodies is about 10% of the sum of the m |v| (the missing outer planets), so the six-body system drifts as a whole', worst < Decimal('0.002') and Decimal('0.05') < frac < Decimal('0.2'))
    out['momentum_fraction'] = str(frac.quantize(Decimal('0.001'))); out['worst_a_error'] = str((worst * 100).quantize(Decimal('0.001'))) + '%'
    return out

def reference():
    import os
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ganja_fixture.json'); fx = json.load(open(path)); out = {'cases': 0}
    def blade(A, name):
        cur = A.one()
        for ch in ('' if name == '1' else name[1:]): cur = cur * A.e(int(ch))
        (m, v), = cur.d.items(); return m, v
    def load(A, obj): return MV(A.sq, {blade(A, k)[0]: F(v) * blade(A, k)[1] for k, v in obj.items()})        # a double that is a dyadic rational converts to a Fraction exactly
    ok = {k: True for k in ('dM', 'dBfree', 'Gravity', 'Hooke', 'Damping', 'dBfull', 'world', 'attach')}; half = True
    for d in (1, 2, 3, 4):
        A = Alg(d); c = unit_c(A); j = 2 if d >= 2 else 1
        for case in fx[str(d)]['cases']:
            out['cases'] += 1; M = load(A, case['M']); B = load(A, case['B']); ref = {k: load(A, v) for k, v in case['out'].items()}
            a = A.point([F(x) for x in case['attach']]); p = A.point([F(x) for x in case['pb']]); G = gravity(A, M, F(2), j); H = hooke(A, M, F(4), p, a); D_ = A.dual(B.scale(F(-1, 4)))
            ok['dM'] &= dM(M, B) == ref['dM']; ok['dBfree'] &= dB(A, B, c) == ref['dBfree']; ok['Gravity'] &= G == ref['Gravity']; ok['Hooke'] &= H == ref['Hooke']; ok['Damping'] &= D_ == ref['Damping']
            ok['dBfull'] &= dB(A, B, c, G + H + D_) == ref['dBfull']; ok['world'] &= A.sand(M, p) == ref['world'] and ref['a'] == a and ref['p'] == p
            T = A.trans([F(1) if i == j - 1 else F(0) for i in range(d)]); prod = T * p; sand = A.sand(T, p); x0 = A.pos(p)
            ok['attach'] &= prod == ref['attachProd'] and sand == ref['attachSand']
            half &= A.weight(prod) == 1 and all(pc(m) == d for m in prod.d) and A.pos(prod) == [x0[i] + (F(1, 2) if i == j - 1 else 0) for i in range(d)] and A.pos(sand) == [x0[i] + (1 if i == j - 1 else 0) for i in range(d)]
    row('R1', f'reference run: ganja.js 1.0.189 (the library of the listings, run under node on dyadic inputs, so its doubles are exact) and our exact engine give identical M. = -0.5 M B, in R(n,0,1) for n = 1..4 ({out["cases"]} cases)', ok['dM'])
    row('R2', 'reference run: the free Euler term of the listings, (-0.5 (B.Dual B - B B.Dual)).UnDual, is identical to ours for n = 1..4', ok['dBfree'])
    row('R3', 'reference run: gravity !(~M >>> -2e02) (e01 when n = 1) is identical to ours, and so are the duals of the points, for n = 1..4', ok['Gravity'])
    row('R4', 'reference run: Hooke 4 ((~M >>> a) & p) and damping !(-0.25 B) are identical to ours for n = 1..4 (ganja\'s a & b is the dual of the wedge of the duals taken in the order (b*, a*): for two points it is our join(b, a))', ok['Hooke'] and ok['Damping'])
    row('R5', 'reference run: the whole state derivative of the 2D and 4D listings, (F - 0.5 (B.Dual B - B B.Dual)).UnDual with F = Gravity + Hooke + Damping, and the world points M >>> p are identical to ours for n = 1..4', ok['dBfull'] and ok['world'])
    row('R6', 'reference run: in the hanging-body listings, attach = (1 - 0.5e02) * p is a plain PRODUCT, not a sandwich: it is a valid normalised point displaced by HALF a unit along e2 (the sandwich (1 - 0.5e02) >>> p would displace it by one unit); identical to ours for n = 1..4', ok['attach'] and half)
    return out

def ganja_blade(A, name):
    cur = A.one()
    for ch in ('' if name == '1' else name[1:]): cur = cur * A.e(int(ch))
    (m, v), = cur.d.items(); return m, v
def reference_later():
    import os
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ganja_fixture.json'); L = json.load(open(path))['later']; out = {}
    def near(a, b, tol=1e-12): return abs(a - b) <= tol * max(1.0, abs(b))
    def load(A, obj): return {ganja_blade(A, k)[0]: float(v) * ganja_blade(A, k)[1] for k, v in obj.items()}
    A = Alg(3); ok7 = ok8 = True; nz = set(); swapped = []
    for top in L['top']:
        s0, s1, s2 = [F(x) for x in top['size']]
        for case in top['cases']:
            vv = MV(A.sq, {m: F(x) for m, x in load(A, case['vv']).items()}); gg = MV(A.sq, {m: F(x) for m, x in load(A, case['gg']).items()}); dg = load(A, case['dg']); dv = load(A, case['dv'])
            c = {}
            for nm in ('e01', 'e02', 'e03', 'e12', 'e13', 'e23'):
                m_nm, sg = ganja_blade(A, nm); X = A.dual(A.blade(m_nm)); mx = next(iter(X.d)); ref = load(A, case['A_' + nm]); base = Amap(A, X, {q_: F(1) for q_ in A.biv()})
                (mk, bv), = base.d.items(); assert set(ref) <= {mk}; c[mx] = F(ref.get(mk, 0.0)) / bv
            B = vv.scale(-2); ours_dg = dM(gg, B); ok7 &= all(F(dg.get(m, 0.0)) == ours_dg.get(m) for m in set(dg) | set(ours_dg.d))
            ours_dv = dB(A, B, c).scale(F(-1, 2)); ok7 &= all(near(float(ours_dv.get(m)), dv.get(m, 0.0), 1e-11) for m in set(dv) | set(ours_dv.d))
            nz |= {abs(v) > 1e-3 for v in dv.values()}
        # the inertia map the example builds, against the box of the paper (D4, F1): c_jk = (s_j^2 + s_k^2)/12 on e_jk
        phys = {0b0110: (s0 ** 2 + s1 ** 2) / 12, 0b1010: (s0 ** 2 + s2 ** 2) / 12, 0b1100: (s1 ** 2 + s2 ** 2) / 12}
        swap = {0b0110: (s2 ** 2 + s1 ** 2) / 12, 0b1010: (s2 ** 2 + s0 ** 2) / 12, 0b1100: (s1 ** 2 + s0 ** 2) / 12}
        cc = c                                                                          # the last case of this size: the inertia does not depend on the state
        ok8 &= all(near(float(cc[m]), float(swap[m]), 1e-13) for m in swap) and all(near(float(cc[m]), 1.0, 1e-13) for m in cc if m not in swap)
        swapped.append(all(near(float(cc[m]), float(phys[m]), 1e-13) for m in phys) and s0 != s2)
        out.setdefault('c_example', {})[str([str(s0), str(s1), str(s2)])] = {name: f'{float(cc[m]):.6f}' for name, m in (('e23', 0b1100), ('e13', 0b1010), ('e12', 0b0110))}
    row('R7', 'reference run: the free-top example of the repository (its own inertia map and dState = [g v, A^-1 (A(v) v - v A(v))], three box sizes, three states each) gives the same g v as our M. = -M B/2 and the same velocity derivative as our B. = A^-1 [B, A(B)]/2 under v = -B/2, with the inertia it builds (to 1e-11: its numbers are not dyadic)', ok7 and len(nz) >= 1)
    row('R8', 'OBSERVATION on that example (stated, not judged): for a box of sizes (s0, s1, s2) the printed inertia map gives the rotation in the plane e23 the moment (s0^2 + s1^2)/12, in e13 (s0^2 + s2^2)/12, in e12 (s1^2 + s2^2)/12 - the moments of the box with x and z exchanged; the box of the paper (D4, F1) has (s1^2 + s2^2)/12, (s0^2 + s2^2)/12, (s0^2 + s1^2)/12 on e23, e13, e12. They differ whenever s0 != s2 (the example draws size [0.6, 2, 1]); the equation of motion is the same for any inertia, so only which axis is the intermediate one changes', ok8 and not any(swapped) and len(swapped) == 3)
    ok9 = True; cnt = 0
    for case in L['twobody']:
        n = case['n']; A = Alg(n); G = F(case['G']); m1, m2 = F(case['m1']), F(case['m2']); p1 = A.point([F(x) for x in case['p1']]); p2 = A.point([F(x) for x in case['p2']])
        v = p2 - p1; d = isqrtF(sum(F(A.q(v, i + 1)) ** 2 for i in range(n))); ok9 &= near(float(d), case['d'], 1e-15)
        for key, (pa, pb, mb) in (('a1', (p1, p2, m2)), ('a2', (p2, p1, m1))):
            ours = (pb - pa).scale(G * mb / d ** 3); ref = load(A, case[key])
            ok9 &= all(near(float(ours.get(m)), ref.get(m, 0.0), 1e-13) for m in set(ref) | set(ours.d)); cnt += 1
    row('R9', f'reference run: the acceleration function of the planets and moon examples, A = (p1,p2,m1,m2) => G m1 m2/(d d m1) v/d with v = p2 - p1 and d = v.VLength, equals G m2 (p2 - p1)/d^3 in R(2,0,1) and R(3,0,1) ({cnt} accelerations, to 1e-13 because 1/d^3 is not dyadic); m1 cancels, the vector is the ideal vector p2 - p1', ok9)
    return out

def run():
    global RES
    RES = []
    data = {'labels': labels(), 'segment': rung1(), 'square': rung2(), 'printed': printed3d(), 'invariants': invariants()}
    work_rows(); damping_row(); data['reference'] = reference(); data['series'] = series_rows(); data['vertex_inertia'] = vertex_inertia(); data['bit_labels'] = bitlabels()
    data['frame_table'] = frame_table(); pair_rows(); data['hang'] = hang_rows(); data['top'] = top_rows(); data['newton'] = newton_rows(); data['kepler'] = kepler_rows(); rk4_rows(); data['moon'] = moon_rows(); data['planets'] = planets_rows(); data['planets_data'] = {k: {'mass_kg': v[0], 'pos_km': list(v[1]), 'vel_kms': list(v[2])} for k, v in PLANETS.items()}; data['reference_later'] = reference_later()
    data['summary'] = {'rows': len({r['id'] for r in RES}), 'checks': len(RES), 'ok': sum(r['ok'] for r in RES)}
    ids = sorted({r['id'] for r in RES}); data['rows'] = [{'id': i, 'checks': sum(1 for r in RES if r['id'] == i), 'ok': all(r['ok'] for r in RES if r['id'] == i)} for i in ids]
    def nofloat(x):
        if isinstance(x, float): raise AssertionError('a float entered an exact check')
        if isinstance(x, dict): [nofloat(v) for v in x.values()]
        if isinstance(x, (list, tuple)): [nofloat(v) for v in x]
    nofloat(data)
    return json.loads(json.dumps(data, default=str))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); ap.add_argument('--row', help='print only the checks of one row, for example --row D2'); a = ap.parse_args()
    data = run(); seen = {}
    if a.row:
        hit = [r for r in RES if r['id'] == a.row]
        if not hit: sys.exit(f'no row {a.row}; rows are ' + ', '.join(sorted({r["id"] for r in RES})))
        for r in hit: print(('ok  ' if r['ok'] else 'FAIL') + f" {r['id']}: {r['claim']}" + (f" [{r['detail']}]" if r['detail'] else ''))
        print(f'{sum(r["ok"] for r in hit)}/{len(hit)} checks hold'); sys.exit(0 if all(r['ok'] for r in hit) else 1)
    for r in RES: seen.setdefault(r['id'], []).append(r['ok'])
    for k in sorted(seen): print(f'{k:3s} {sum(seen[k])}/{len(seen[k])} checks')
    print(f"\n{data['summary']['ok']}/{data['summary']['checks']} checks hold in {data['summary']['rows']} claims.  ALL RIGID-BODY CHECKS PASS")
    if a.write: json.dump(data, open(a.write, 'w'), indent=1, ensure_ascii=False); print('wrote', a.write)
    if a.compare: assert json.load(open(a.compare)) == data, 'the data differs from the rebuilt data'; print('data == rebuilt data')
