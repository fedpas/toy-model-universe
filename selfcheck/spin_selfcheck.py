#!/usr/bin/env python3
"""Spinors and complex structures on the bit rule: the three kinds of "i", and the invariant decomposition / pointors of
Roelfs, Eelbode and De Keninck, "From Invariant Decomposition to Spinors" (v1.1), checked exactly (Fractions, standard library only).

  python3 spin_selfcheck.py                 rebuild and assert every claim
  python3 spin_selfcheck.py --write f.json  also write the data
  python3 spin_selfcheck.py --compare f.json   check that the data equals the file

Blades are bit masks; the product of two blades is XOR of the masks with a sign from reordering, times the squares of the common generators
(sq[i] = +1, -1 or 0).  The atlas rule has time = +1 and space = -1.  Nothing here is a new physical claim."""
import argparse, itertools, json, random, sys
from fractions import Fraction as F

# ---------------------------------------------------------------- the bit-rule algebra
def bmul(a, b, sq):
    s = 1
    for j in range(len(sq)):
        if b >> j & 1:
            s *= -1 if bin(a >> (j + 1)).count('1') % 2 else 1
    for j in range(len(sq)):
        if a >> j & 1 and b >> j & 1: s *= sq[j]
    return a ^ b, s

class MV:
    def __init__(self, sq, d=None): self.sq = sq; self.d = {} if d is None else {m: F(v) for m, v in d.items() if v != 0}
    def __add__(s, o): r = dict(s.d); [r.__setitem__(m, r.get(m, 0) + v) for m, v in o.d.items()]; return MV(s.sq, r)
    def __sub__(s, o): return s + o.scale(-1)
    def scale(s, c): return MV(s.sq, {m: v * c for m, v in s.d.items()})
    def __mul__(s, o):
        r = {}
        for a, x in s.d.items():
            for b, y in o.d.items():
                m, sg = bmul(a, b, s.sq)
                if sg: r[m] = r.get(m, 0) + sg * x * y
        return MV(s.sq, r)
    def rev(s): return MV(s.sq, {m: v * (-1 if (bin(m).count('1') * (bin(m).count('1') - 1) // 2) % 2 else 1) for m, v in s.d.items()})
    def __eq__(s, o): return {m: v for m, v in (s - o).d.items() if v != 0} == {}
    def get(s, m): return s.d.get(m, F(0))
    def scalar(s): return s.get(0)
    def is_scalar(s): return all(m == 0 for m in s.d)
    def only(s, masks): return all(m in masks for m in s.d)
    def inv(s):
        n = (s * s.rev()); assert n.is_scalar() and n.scalar() != 0, 'not a non-null versor'
        return s.rev().scale(1 / n.scalar())
def E(sq, m): return MV(sq, {m: 1})
def one(sq): return MV(sq, {0: 1})
pc = lambda x: bin(x).count('1')
def rnd(rng, n=3): return F(rng.randint(-n, n), rng.randint(1, 3))
def rvec(sq, rng, bits=None):
    bits = range(len(sq)) if bits is None else bits
    return MV(sq, {1 << i: rnd(rng) or F(1) for i in bits})

RES = []
def row(i, claim, ok, detail=None, expected=True):
    RES.append({'id': i, 'claim': claim, 'ok': bool(ok) == expected, 'expected': expected, 'detail': detail})
    assert RES[-1]['ok'], f'{i} failed: {claim} {detail}'

# ---------------------------------------------------------------- A. three kinds of i, and their three planar relatives
SQN = {-1: 'complex', 1: 'split-complex', 0: 'dual'}
def planar(rng):
    tab = {}
    # type 1: the whole algebra of one generator, (scalar, 1-vector)
    for s in (-1, 1, 0):
        sq = [s]; e = E(sq, 1); sqr = e * e
        tab[f'1,{s}'] = {'grades': '(0,1)', 'signature': sq, 'unit_square': int(sqr.scalar()), 'closed': True}
        row('A1', f'one generator of square {s}: (scalar, 1-vector) is {SQN[s]}', sqr == one(sq).scale(s))
    # type 2: the even part of two generators, (scalar, 2-vector)
    for s, sq in ((-1, [1, 1]), (-1, [-1, -1]), (1, [1, -1]), (1, [-1, 1]), (0, [0, 1]), (0, [1, 0]), (0, [0, -1])):
        i = E(sq, 3); sqr = i * i
        tab[f'2,{s},{sq}'] = {'grades': '(0,2)', 'signature': sq, 'unit_square': int(sqr.scalar()), 'closed': True}
        row('A2', f'two generators {sq}: e12 squares to {s}, so (scalar, 2-vector) is {SQN[s]}', sqr == one(sq).scale(s), f'-ab = {-sq[0] * sq[1]}')
    # type 3: the odd part (1-vector, 1-vector) is not closed under the product; with a reference vector u the product x o y = x u y is
    for s, sq in ((-1, [1, 1]), (-1, [-1, -1]), (1, [1, -1]), (1, [-1, 1]), (0, [1, 0]), (0, [0, 1]), (0, [-1, 0])):
        a, b = sq
        # the odd part is not a subalgebra
        row('A3', f'odd part of {sq} is not closed under the product', not (E(sq, 1) * E(sq, 1)).only({1, 2}) or sq[0] == 0)
        k = 0 if a != 0 else 1          # the reference vector must be invertible
        u = E(sq, 1 << k); ui = u.inv(); im = E(sq, 1 << (1 - k))
        o = lambda x, y: x * u * y
        unit_ok = all(o(x, ui) == x and o(ui, x) == x for x in (E(sq, 1), E(sq, 2)))
        closed = all(o(x, y).only({1, 2}) for x in (E(sq, 1), E(sq, 2)) for y in (E(sq, 1), E(sq, 2)))
        assoc = all(o(o(x, y), z) == o(x, o(y, z)) for x in (E(sq, 1), E(sq, 2)) for y in (E(sq, 1), E(sq, 2)) for z in (E(sq, 1), E(sq, 2)))
        lam = o(im, im); is_ = lam == ui.scale(s)
        iso = all((o(x, y) * u) == (x * u) * (y * u) for x in (E(sq, 1), E(sq, 2)) for y in (E(sq, 1), E(sq, 2)))
        tab[f'3,{s},{sq}'] = {'grades': '(1,1)', 'signature': sq, 'unit_square': s if is_ else None, 'reference_vector': f'e{k + 1}'}
        row('A3', f'odd part of {sq} with reference vector u: unital, closed, associative, i o i = {s} (unit): {SQN[s]}; x -> x u is an isomorphism onto the even part', unit_ok and closed and assoc and is_ and iso)
    # the reference vector does not matter: the sign is that of -u^2 v^2 for any u, v perpendicular to u
    for sq in ([1, 1], [-1, -1], [1, -1], [-1, 1]):
        for _ in range(25):
            u = MV(sq, {1: rnd(rng) or F(1), 2: rnd(rng) or F(1)}); uu = (u * u).scalar()
            if uu == 0: continue
            v = MV(sq, {1: -sq[1] * u.get(2), 2: sq[0] * u.get(1)})              # <u, v> = 0
            assert (u * v + v * u).scalar() == 0 and v.d
            lam = (v * u * v); ui = u.inv(); ratio = None
            # v u v = -v^2 u  and  unit = u^{-1} = u / u^2, so  v o v = (-v^2 u^2) unit
            vv = (v * v).scalar(); row('A3', 'the sign of i o i does not depend on the reference vector', (v * u * v) == ui.scale(-vv * uu), f'{sq}')
            row('A3', 'the sign of i o i is the sign of -ab (independent of u)', (-vv * uu > 0) == (-sq[0] * sq[1] > 0))
    row('A3', 'the odd part of Cl(1,1) is split-complex (j^2 = +1), not complex, for every reference vector', all(tab[k]['unit_square'] == 1 for k in tab if k.startswith('3,1,')))
    return tab

# how many units of each kind (square -1, +1, 0) a signature offers, by grade
def unit_counts(p, q, z=0):
    sq = [1] * p + [-1] * q + [0] * z; n = len(sq); out = {}
    for m in range(1, 1 << n):
        k = pc(m); s = (E(sq, m) * E(sq, m)).scalar()
        # the closed form: (-1)^{k(k-1)/2} * product of the generator squares
        prod = 1
        for i in range(n):
            if m >> i & 1: prod *= sq[i]
        assert s == (-1) ** (k * (k - 1) // 2) * prod, 'closed form of e_m^2'
        out.setdefault(k, {-1: 0, 1: 0, 0: 0})[int(s)] += 1
    return out

# ---------------------------------------------------------------- C. the invariant decomposition on the bit rule
def decomposition(d, sq, rng):
    k = d // 2; ms = [3 << (2 * j) for j in range(k)]            # b_j = e_{2j+1} e_{2j+2}
    b = [E(sq, m) for m in ms]; O = E(sq, (1 << d) - 1)
    info = {'d': d, 'signature': sq, 'k': k, 'b_squares': [int((x * x).scalar()) for x in b]}
    labels = {}
    for x in range(1 << d):
        ex = E(sq, x); lab = []
        for j in range(k):
            conj = b[j] * ex * b[j].inv(); s = (-1) ** pc(x & ms[j])
            assert conj == ex.scale(s), 'conjugation by b_j gives +-1 on every blade, with sign (-1)^|x & m_j|'
            lab.append(s)
        labels.setdefault(tuple(lab), []).append(x)
    info['classes'] = len(labels); info['class_sizes'] = sorted({len(v) for v in labels.values()})
    # H = span of the m_j is its own orthogonal complement (a self-dual code) and is the all-plus class
    H = sorted({sum(ms[j] for j in range(k) if c >> j & 1) for c in range(1 << k)})
    row('C1', f'd={d}, {sq}: conjugation by each b_j is +-1 on every blade, with the sign (-1)^|x & m_j|; {2 ** k} classes of {2 ** k} blades', len(labels) == 2 ** k and info['class_sizes'] == [2 ** k], info)
    row('C1', f'd={d}: the all-plus class is the code H = span of the b_j masks (self-dual: H = H-perp)', sorted(labels[tuple([1] * k)]) == H)
    # the point is the product of the b_j and its conjugation is the parity
    prod = one(sq)
    for x in b: prod = prod * x
    row('C2', f'd={d}: the point O (all bits) is the product of the b_j', prod == O)
    ok = all((O * E(sq, x) * O.inv()) == E(sq, x).scale((-1) ** pc(x)) for x in range(1 << d))
    row('C2', f'd={d}: conjugation by the point is the parity of the blade (so the left/right split of eq. 7 is even/odd)', ok)
    row('C2', f'd={d}: the chirality label is the product of the k eigenvalues = parity of the blade', all(int(__import__("math").prod(l)) == (-1) ** pc(v[0]) for l, v in labels.items()))
    # reference states, one per class, of weight at most k (e.g. 1, u1, u2, u1u2)
    refs = {l: min(v, key=lambda x: (pc(x), x)) for l, v in labels.items()}
    info['reference_weights'] = sorted(pc(r) for r in refs.values())
    return info, b, O, ms, labels, refs

def commuting_algebra(sq):
    """d = 4: the algebra generated by b1, b2 (commuting, squares l1, l2)"""
    b1, b2 = E(sq, 3), E(sq, 12); O = E(sq, 15); l1, l2 = (b1 * b1).scalar(), (b2 * b2).scalar(); out = {'b1^2': int(l1), 'b2^2': int(l2), 'O^2': int((O * O).scalar())}
    assert b1 * b2 == b2 * b1 and b1 * b2 == O
    if l1 == l2 == -1:   # complex (x) complex: the point splits it
        Pp = (one(sq) + O).scale(F(1, 2)); Pm = (one(sq) - O).scale(F(1, 2))
        ok = Pp * Pp == Pp and Pm * Pm == Pm and Pp * Pm == MV(sq) and Pp + Pm == one(sq) and b2 * Pp == (b1 * Pp).scale(-1) and b2 * Pm == b1 * Pm
        out['splits_by'] = 'the point O = b1 b2 (O^2 = +1)'; row('C4', 'C (x) C = C + C: the idempotents (1 +- O)/2 split the torus algebra; on one b2 = -b1, on the other b2 = +b1 (the two identifications of i)', ok)
    else:                # a boost in the mix: O^2 = -1, the real split is by the boost
        bo, ro = (b1, b2) if l1 == 1 else (b2, b1)
        Pp = (one(sq) + bo).scale(F(1, 2)); Pm = (one(sq) - bo).scale(F(1, 2))
        ok = Pp * Pp == Pp and Pm * Pm == Pm and Pp * Pm == MV(sq) and (O * O) == one(sq).scale(-1)
        out['splits_by'] = 'the boost (1 +- b)/2; O^2 = -1 acts as a complex unit'; row('C4', 'with a boost the point squares to -1 (a complex unit); the real split of the torus algebra is by the boost, not by the point', ok)
    return out

# ---------------------------------------------------------------- D. pointors
def pointor_sum(d, sq, rng, labels, refs, ms, only_even=False):
    """psi = h * (sum_s rho_s ref_s) with ONE common h = prod_j (cos-like + sin-like b_j): the same rotor/boost/translation parameters in every class, only the weights rho_s differ"""
    k = d // 2; b = [E(sq, m) for m in ms]; h = one(sq)
    for j in range(k): h = h * (one(sq).scale(rnd(rng) or F(1)) + b[j].scale(rnd(rng)))
    core = MV(sq)
    for lab, ref in refs.items():
        if only_even and pc(ref) % 2: continue
        core = core + (E(sq, ref).scale(rnd(rng) or F(1)))
    return h * core
def is_multiple_of_O(x, sq, d): return x.only({(1 << d) - 1})
def pointor_checks(rng):
    out = {}
    for d, sqs in ((2, ([1, 1], [-1, -1], [1, -1])), (4, ([1] * 4, [-1] * 4, [1, -1, -1, -1])), (6, ([1] * 6, [1] + [-1] * 5))):
        for sq in sqs:
            info, b, O, ms, labels, refs = decomposition(d, sq, rng); k = d // 2
            good = 0; trials = 6; goodL = 0
            for _ in range(trials):
                psi = pointor_sum(d, sq, rng, labels, refs, ms); psiL = pointor_sum(d, sq, rng, labels, refs, ms, only_even=True)
                good += is_multiple_of_O(psi * O * psi.rev(), sq, d)
                nl = psiL * psiL.rev(); goodL += nl.is_scalar()
            expect = k < 3
            out[f'{d},{sq}'] = {'k': k, 'sum_is_pointor': f'{good}/{trials}', 'even_part_is_versor_like': f'{goodL}/{trials}'}
            row('D1', f'd={d} {sq} (k={k}): a sum of invariant pointor components psi = sum_s rho_s exp(sum theta_j b_j) ref_s satisfies psi O psi~ = rho O' if expect else f'd={d} {sq} (k={k}): the same sum is generally NOT a pointor (cross terms survive)', (good == trials) == expect, out[f'{d},{sq}'], True)
    return out

def versor(sq, rng, k):
    v = one(sq)
    for _ in range(k):
        x = rvec(sq, rng)
        while (x * x).scalar() == 0: x = rvec(sq, rng)
        v = v * x
    return v

def theorem3(rng):
    out = {}
    for d, sq in ((4, [1] * 4), (4, [1, -1, -1, -1]), (6, [1] * 6)):
        O = E(sq, (1 << d) - 1); t = 6; a = b_ = c = 0
        for _ in range(t):
            R = versor(sq, rng, 2); v = rvec(sq, rng); P = versor(sq, rng, 3); al, be = rnd(rng) or F(1), rnd(rng) or F(1)
            psi1 = R.scale(al) + (v * R).scale(be)         # (alpha + beta v) R
            psi2 = R.scale(al) + P.scale(be)               # alpha R + beta P, P an unrelated odd versor
            a += is_multiple_of_O(psi1 * O * psi1.rev(), sq, d); b_ += is_multiple_of_O(psi2 * O * psi2.rev(), sq, d)
            # the cross term is O (R P~ - P R~): it vanishes exactly when R P~ is self-reverse
            X = R * P.rev(); c += (psi2 * O * psi2.rev() - (R * O * R.rev()).scale(al * al) - (P * O * P.rev()).scale(be * be)) == (O * (X - X.rev())).scale(al * be)
        out[f'{d},{sq}'] = {'(alpha+beta v)R': f'{a}/{t}', 'alpha R + beta P (P unrelated)': f'{b_}/{t}', 'cross term formula': f'{c}/{t}'}
        row('D2', f'd={d} {sq}: psi = (alpha + beta v) R is a pointor (Theorem 3 with P = vR); alpha R + beta P with an unrelated odd versor P is not; cross term = O(R P~ - P R~)', a == t and b_ == 0 and c == t, out[f'{d},{sq}'])
    return out

def hestenes_slice(rng):
    sq = [1, -1, -1, -1]; I = E(sq, 15); ev = [m for m in range(16) if pc(m) % 2 == 0]; n = 0; pcount = 0; T = 20
    assert (I * I) == one(sq).scale(-1)
    for _ in range(T):
        psi = MV(sq, {m: rnd(rng) for m in ev}); n2 = psi * psi.rev()
        assert n2.only({0, 15}) and I * psi == psi * I        # psi psi~ = rho (cos b + I sin b); I is central in the even algebra
        pointor = (psi * I * psi.rev()).only({15}); pcount += pointor
        assert pointor == (n2.get(15) == 0)
    row('D3', 'in Cl(1,3), an even psi has psi psi~ = a + b I; psi O psi~ is a multiple of O exactly when b = 0 (Yvon-Takabayasi angle zero): pointors are the codimension-1 slice of Hestenes spinors', True, f'{pcount}/{T} random even psi happened to be pointors')
    # the slice is a codimension-one set: build one with b = 0 and check it
    R = versor(sq, rng, 2)
    row('D3', 'an even versor psi = R has b = 0 (a pointor)', (R * I * R.rev()).only({15}))
    return {'even_blades': len(ev), 'slice': 'b = 0, codimension 1'}

# ---------------------------------------------------------------- E. chirality of the Dirac structure, and J
def dirac_chirality(rng):
    sq = [1, -1, -1, -1]; g = [E(sq, 1 << i) for i in range(4)]; I = E(sq, 15); J = g[2] * g[1]
    row('E1', 'J = gamma2 gamma1 squares to -1 and commutes with gamma0 and I; I squares to -1 and anticommutes with every vector', J * J == one(sq).scale(-1) and J * g[0] == g[0] * J and I * I == one(sq).scale(-1) and all(I * x == (x * I).scale(-1) for x in g))
    ev = [m for m in range(16) if pc(m) % 2 == 0]; od = [m for m in range(16) if pc(m) % 2 == 1]
    C = lambda x: I * x * J                                          # the involution on even (and on odd) elements
    inv_ok = all(C(C(E(sq, m))) == E(sq, m) for m in range(16))
    flip = {}
    for m in range(16):
        x = C(E(sq, m)); assert len(x.d) == 1; (mm, v), = x.d.items(); flip[m] = (mm, int(v))
    row('E1', 'psi -> I psi J is an involution; on a blade it is the XOR with 9 (the t-z plane, the complement of J) and a sign', inv_ok and all(mm == m ^ 9 for m, (mm, v) in flip.items()), {str(m): f'{mm}{"+" if v > 0 else "-"}' for m, (mm, v) in flip.items() if m in ev})
    # eigenspaces have dimension 4 + 4 on the even blades
    plus = [m for m in ev if flip[m][1] > 0 and m < flip[m][0]] + [m for m in ev if flip[m][1] < 0 and m < flip[m][0]]
    row('E1', 'on the 8 even blades the involution pairs them into 4 pairs along the direction 9 and has eigenspaces 4 + 4 (the two Weyl halves of the Hestenes spinor)', len({frozenset((m, flip[m][0])) for m in ev}) == 4)
    # Dirac: D psi = P psi J (derivative -> momentum), M psi = psi gamma0
    ok_D = ok_M = True
    for _ in range(25):
        p = MV(sq, {1 << i: rnd(rng) for i in range(4)}); psi = MV(sq, {m: rnd(rng) for m in ev})
        D = lambda x: p * x * J; M = lambda x: x * g[0]
        ok_D &= D(C(psi)) == C(D(psi)).scale(-1)                    # the derivative flips the chirality label
        ok_M &= M(C(psi)) == C(M(psi))                              # the mass term keeps it
    row('E2', 'D psi = p psi J (the derivative term) anticommutes with the chirality involution and M psi = psi gamma0 (the mass term) commutes with it: for m = 0 the equation splits into the two Weyl halves, the mass couples them', ok_D and ok_M)
    return {'involution': 'psi -> I psi J', 'xor': 9}

def j_exists(rng):
    out = {}
    for n in range(1, 6):
        sq = [1] + [-1] * (n - 1); g0 = E(sq, 1)
        # bivectors that square to -1 and commute with gamma0 (the "J" of the coupling step), and vectors that square to -1 (type-1 units, they anticommute with gamma0)
        biv = [m for m in range(1, 1 << n) if pc(m) == 2 and (E(sq, m) * E(sq, m)) == one(sq).scale(-1) and E(sq, m) * g0 == g0 * E(sq, m)]
        vec = [m for m in range(1, 1 << n) if pc(m) == 1 and (E(sq, m) * E(sq, m)) == one(sq).scale(-1)]
        anti = all(E(sq, m) * g0 == (g0 * E(sq, m)).scale(-1) for m in vec)
        out[n] = {'type2_units_commuting_with_gamma0': len(biv), 'type1_units': len(vec), 'type1_anticommute_with_gamma0': anti}
    row('E3', 'a complex unit that is a bivector commuting with gamma0 exists from n = 3 (one at n = 3, three at n = 4, six at n = 5); at n = 1, 2 there is none (only split units: gamma0 gamma1 squares to +1)', [out[n]['type2_units_commuting_with_gamma0'] for n in range(1, 6)] == [0, 0, 1, 3, 6], out)
    row('E3', 'the vector units (square -1) are the space generators and all anticommute with gamma0', all(v['type1_anticommute_with_gamma0'] for v in out.values()))
    return out

# ---------------------------------------------------------------- run

# ---------------------------------------------------------------- G. Eelbode's construction (GAME23 lecture), exact, with i := the central pseudoscalar
def rank_Q(rows):
    M = [r[:] for r in rows]; r = 0; n = len(M[0]) if M else 0
    for c in range(n):
        piv = next((k for k in range(r, len(M)) if M[k][c] != 0), None)
        if piv is None: continue
        M[r], M[piv] = M[piv], M[r]
        for k in range(len(M)):
            if k != r and M[k][c] != 0:
                f = M[k][c] / M[r][c]; M[k] = [x - f * y for x, y in zip(M[k], M[r])]
        r += 1
    return r
def lecture(rng):
    """Spin(2k+1) with k = 3 (d = 7 = 3 mod 4, so the pseudoscalar I is central and I^2 = -1 and can play the lecture's i):
       B_j = e_{2j-1} e_{2j}, v_j = e_{2j-1}, w = e_7;  pure spinors Phi_sigma = prod_j f_j^{sigma_j},  f^+ = B_j + i,  f^- = v_j (B_j + i)"""
    k = 3; d = 7; sq = [1] * d; Z = MV(sq); one_ = one(sq); I = E(sq, (1 << d) - 1); i = I; out = {}
    row('G1', 'd = 7: the pseudoscalar I is central and I^2 = -1, so it can play the lecture\'s complex unit i inside the real algebra', all(I * E(sq, 1 << t) == E(sq, 1 << t) * I for t in range(d)) and (I * I) == one_.scale(-1))
    B = [E(sq, 3 << (2 * j)) for j in range(k)]; v = [E(sq, 1 << (2 * j)) for j in range(k)]; w = E(sq, 1 << 6)
    row('G2', 'each B_j squares to -1, the B_j commute, and v_j (in the B_j plane) anticommutes with B_j', all((b * b) == one_.scale(-1) for b in B) and all(B[a] * B[b] == B[b] * B[a] for a in range(k) for b in range(k)) and all(B[j] * v[j] + v[j] * B[j] == Z for j in range(k)))
    f = lambda j, sg: (B[j] + i) if sg > 0 else v[j] * (B[j] + i)
    states = {}
    for sg in itertools.product((1, -1), repeat=k):
        P = one_
        for j in range(k): P = P * f(j, sg[j])
        states[sg] = P
    ok_left = ok_right = ok_conj = ok_par = True
    for sg, P in states.items():
        for j in range(k):
            ok_left &= (B[j] * P == (i * P).scale(sg[j]))                    # left action: B_j Phi = sigma_j i Phi
            ok_right &= (P * B[j] == i * P)                                    # right action: always +i
            ok_conj &= (B[j] * P * B[j].inv() == P.scale(sg[j]))               # two-sided conjugation sees only the ratio left/right
        par = (w * P * w.inv()); neg = sum(1 for x in sg if x < 0) % 2
        ok_par &= (par == P.scale(1 if neg == 0 else -1))                      # even / odd by the parity of the number of minus signs
    row('G3', 'left action B_j Phi_sigma = sigma_j i Phi_sigma for all 2^3 orientations sigma', ok_left)
    row('G4', 'the right action is the same +i on every Phi_sigma, so conjugation B_j Phi B_j^-1 = sigma_j Phi: the two-sided action sees only the ratio left/right (our decomposition label); the left action alone carries +-i', ok_right and ok_conj)
    row('G5', 'Phi_sigma is even/odd (conjugation by w) according to the parity of the number of minus signs in sigma', ok_par)
    comb = [states[s] for s in sorted(states)]
    rows = [[x.get(m) for m in range(1 << d)] for x in comb] + [[(i * x).get(m) for m in range(1 << d)] for x in comb]
    row('G6', 'the 2^k = 8 pure spinors are independent over C = span(1, I) (real rank 16)', rank_Q(rows) == 16, f'rank {rank_Q(rows)}')
    # the whole left ideal generated by Phi_{+++} has the same real dimension 16 (one irreducible module of dimension 2^k over C)
    allb = [(E(sq, m) * states[(1, 1, 1)]) for m in range(1 << d)]
    rk = rank_Q([[x.get(m) for m in range(1 << d)] for x in allb]); row('G7', 'the left ideal generated by Phi_{+++} has real dimension 16, i.e. complex dimension 2^k = 8 = S+ (+) S- (4 + 4)', rk == 16, f'rank {rk}')
    # Spin(6) rotors (even, in e1..e6) cannot mix the parity classes; a Spin(7) rotor with the extra reflection w does
    a, b = F(3, 5), F(4, 5); R6 = (one_.scale(a) + (E(sq, 1) * E(sq, 4)).scale(b)) * (one_.scale(a) + (E(sq, 2) * E(sq, 8)).scale(b)); R7 = one_.scale(a) + (E(sq, 1) * w).scale(b)
    P0 = states[(1, 1, 1)]; ev = lambda X: (X + w * X * w.inv()).scale(F(1, 2)); od = lambda X: (X - w * X * w.inv()).scale(F(1, 2))
    row('G8', 'Spin(6) rotors act on S+ without leaving it: the odd-parity part of R Phi_{+++} is zero', od(R6 * P0) == Z and ev(R6 * P0) != Z)
    row('G9', 'Spin(7) rotors (with the extra reflection w) mix the parity classes: R Phi_{+++} has a nonzero odd part', od(R7 * P0) != Z and ev(R7 * P0) != Z)
    # pure vs mixed: a rotation in the B_j plane is a phase on a pure state, but a RELATIVE phase on a mixed one when sigma_j differs
    c = lambda t_a, t_b: one_.scale(t_a) + I.scale(t_b)
    S1, S2 = states[(1, 1, 1)], states[(1, -1, -1)]; M = S1.scale(F(1, 2)) + S2.scale(F(3, 2)); Rj = lambda j: one_.scale(a) + B[j].scale(b)
    row('G10', 'pure state: e^{tB_j} Phi_sigma = (cos t + sigma_j i sin t) Phi_sigma, a pure phase', all(Rj(j) * states[(1, -1, 1)] == (c(a, b * sg)) * states[(1, -1, 1)] for j, sg in ((0, 1), (1, -1), (2, 1))))
    row('G11', 'mixed state c1 Phi_s + c2 Phi_t with s_1 = t_1: B_1 rotation is an overall phase (irrelevant), but B_2 rotation (s_2 != t_2) changes the RELATIVE phase', Rj(0) * M == c(a, b) * M and Rj(1) * M != c(a, b) * M and Rj(1) * M == (c(a, b) * S1.scale(F(1, 2))) + (c(a, -b) * S2.scale(F(3, 2))))
    out['k'] = k; out['states'] = len(states); out['real_rank_all'] = 16
    return out

# ---------------------------------------------------------------- H. the translation matrix: paper (arXiv 2401.01142 v1.1) and lecture (GAME23 slides) on one page, by subject
# Each row is one statement, seen from up to three sides: the paper, the lecture, and the bit rule.  Status comes from running the check:
#   ok = agrees exactly, note = the printed line reads differently (the note says how), nc = not checked.
THREADS = ['reflect', 'labels', 'unit', 'spaces', 'pointor', 'states']
MX = []
def mx(id, thread, src, paper=None, lecture=None, ours='', how='', status='ok', note='', remark='', page=None):
    def deco(fn):
        MX.append(dict(id=id, thread=thread, src=src, paper=paper, lecture=lecture, ours=ours, how=how, status=status, note=note, remark=remark, page=page, fn=fn)); return fn
    return deco
def mx_nc(id, thread, src, paper=None, lecture=None, text='', note='', page=None):
    MX.append(dict(id=id, thread=thread, src=src, paper=paper, lecture=lecture, ours='', how='', status='not checked', note=note, remark='', page=page, fn=None, text=text))
NAMES = lambda m: 'e' + ''.join(str(j + 1) for j in range(12) if m >> j & 1) if m else '1'
def fmt(x):
    if not x.d: return '0'
    return ' + '.join((f'{v}' if m == 0 else (f'{v}*' if v != 1 else '') + NAMES(m)) for m, v in sorted(x.d.items())).replace('+ -', '- ')
def ctx3():
    sq = [1, 1, 1]; u, v, w = E(sq, 1), E(sq, 2), E(sq, 4); I = E(sq, 7)
    return dict(sq=sq, u=u, v=v, w=w, I=I, B=u * v, one=one(sq), Z=MV(sq))
def ctx7():
    sq = [1] * 7; u = [E(sq, 1 << (2 * j)) for j in range(3)]; v = [E(sq, 1 << (2 * j + 1)) for j in range(3)]
    return dict(sq=sq, u=u, v=v, b=[u[j] * v[j] for j in range(3)], w=E(sq, 64), I=E(sq, 127), one=one(sq), Z=MV(sq))
def cxn(c, a, b): return c['one'].scale(a) + c['I'].scale(b)           # the complex number a + i b, with i = I
def wpm(c, j=None):
    """isotropic eigenvectors w+- = (u +- i v)/2 of b = u v under the commutator, i = I"""
    if j is None: u, v = c['u'], c['v']
    else: u, v = c['u'][j], c['v'][j]
    return (u + c['I'] * v).scale(F(1, 2)), (u - c['I'] * v).scale(F(1, 2))
def master(c, k):
    """the master idempotent, product over j of w+_j w-_j; k = 1 uses Cl(3,0), k = 3 uses Cl(7,0)"""
    r = c['one']
    for j in range(k):
        wp, wm = wpm(c, None if k == 1 else j); r = r * wp * wm
    return r
def bvec(c, k): return [c['B']] if k == 1 else c['b']
def V(c, k, j=0): return c['v'] if k == 1 else c['v'][j]
def U(c, k, j=0): return c['u'] if k == 1 else c['u'][j]
W = lambda c: c['w']
def dimR(vecs, n):
    return rank_Q([[x.get(m) for m in range(1 << n)] for x in vecs])
def pair(lhs, rhs): return {'lhs': lhs if isinstance(lhs, str) else fmt(lhs), 'rhs': rhs if isinstance(rhs, str) else fmt(rhs)}

# ---- subject 1: reflections, rotors and the double cover
@mx('S01', 'reflect', 'both', paper=dict(ref='§2.3 eq. (1)', page=5, tex=r'R(\theta)=e^{\theta B}R_0,\ \ B=uv'), lecture=dict(ref='slides “How to make a 2D-rotor?” and “boring plus drastic = rotor”', tex=r'R=a\,1+bB,\ \ RR^{-1}=1\iff a^2+b^2=1'),
    ours=r'B=e_{12},\ B^2=-1,\ \ u\mapsto BuB^{-1}=-u,\ \ v\mapsto -v,\ \ (a+bB)(a-bB)=a^2+b^2',
    how='Exact in Cl(2,0) on the bit rule with u = bit 1, v = bit 2: the point reflection B = uv sends every vector of the plane to its negative; a + bB has inverse a − bB, and the product is the scalar a² + b², so R is a rotor exactly when a² + b² = 1.')
def _S01(rng):
    sq = [1, 1]; u, v = E(sq, 1), E(sq, 2); B = u * v; O1 = one(sq)
    ok = (B * B) == O1.scale(-1) and (B * u * (v * u)) == u.scale(-1) and (B * v * (v * u)) == v.scale(-1)
    for _ in range(20):
        a, b = rnd(rng), rnd(rng); ok &= ((O1.scale(a) + B.scale(b)) * (O1.scale(a) - B.scale(b)) == O1.scale(a * a + b * b))
    return ok, dict(inst='u = e1, v = e2, B = e12; vector u', **pair(B * u * (v * u), u.scale(-1)))
@mx('S02', 'reflect', 'both', paper=dict(ref='§2.3, fig. 6', page=6, tex=r'\tilde R\,\blacktriangle\,R:\ \text{two mirrors at angle }\beta\ \text{rotate by }2\beta'), lecture=dict(ref='slides “Angle versus schmangle” and “How to let a 2D-rotor act?”', tex=r'RvR^{\sim}=v\cos 2t+u\sin 2t,\ \ R=\cos t+B\sin t'),
    ours=r'R=a+bB,\ (a,b)=(\cos t,\sin t):\ \ RvR^{\sim}=(a^2-b^2)\,v+2ab\,u',
    how='Exact for rational points (cos t, sin t) = (3/5, 4/5), (5/13, 12/13), (8/17, 15/17): the conjugated vector is v cos 2t + u sin 2t, the double angle (“schmangle”), with the sign + for B = uv; the opposite sign fails.')
def _S02(rng):
    sq = [1, 1]; u, v = E(sq, 1), E(sq, 2); B = u * v; ok = True; last = None
    for a, b in ((F(3, 5), F(4, 5)), (F(5, 13), F(12, 13)), (F(8, 17), F(15, 17))):
        R = one(sq).scale(a) + B.scale(b); w = R * v * R.rev(); c2, s2 = a * a - b * b, 2 * a * b
        ok &= (w == v.scale(c2) + u.scale(s2)) and not (w == v.scale(c2) - u.scale(s2)); last = (w, v.scale(c2) + u.scale(s2))
    return ok, dict(inst='cos t = 3/5, sin t = 4/5 (the last point tested is 8/17, 15/17)', **pair(*last))
@mx('S03', 'reflect', 'both', paper=dict(ref='§2.3, 720° paragraph', page=6, tex=r'\text{the bireflection is back only after }2\pi'), lecture=dict(ref='slides “A line once crossed a road”, “Corporate needs you…”', tex=r'B\to -B\ \text{looks like a rotation by }\pm\pi\ (\text{schmangle})'),
    ours=r'R(t)=\cos t+B\sin t:\ R(\tfrac{\pi}{2})=B,\ R(\pi)=B^2=-1,\ R(2\pi)=B^4=1;\ \ R(\pi)\,v\,R(\pi)^{-1}=v',
    how='With B² = −1: R(π/2) = B turns a vector by π (v ↦ −v), R(π) = −1 leaves every vector in place (v ↦ v) yet is not 1, and only R(2π) = B⁴ = +1 is the identity. The 720° of spinors is the 2π of the bireflection.')
def _S03(rng):
    sq = [1, 1]; u, v = E(sq, 1), E(sq, 2); B = u * v; O1 = one(sq); m1 = O1.scale(-1)
    ok = (B * v * B.inv()) == v.scale(-1) and (B * B) == m1 and ((B * B) * v * (B * B).inv()) == v and (B * B) != O1 and (B * B * B * B) == O1
    return ok, dict(inst='the powers of B in Cl(2,0)', lhs='B^2 = -1, B^4 = 1', rhs='B^2 = ' + fmt(B * B) + ', B^4 = ' + fmt(B * B * B * B))
@mx('S04', 'reflect', 'both', paper=dict(ref='§2.5 eq. (6)', page=10, tex=r'O_d=\prod_{i=1}^{d}v_i=\prod_{j=1}^{k}b_j\quad(d=2k)'), lecture=dict(ref='slides “Cartan & Dieudonné approve”, “Input from the CD-OD”', tex=r'O=\prod_aB_a=e^{\frac{\pi}{2}(B_1+\cdots+B_k)},\ \ R\,O\,\tilde R=O'),
    ours=r'O=\text{mask }2^d-1=\prod_jb_j,\ \ O\,b\,O^{-1}\ \text{commutes};\ \ R\,O\,\tilde R=O\ (R\ \text{even})',
    how='On the bit rule b_j is the mask 3·4^(j−1) and the product of the b_j is the mask of all d bits with no sign. e^{(π/2)B} = B because B² = −1 (cos π/2 = 0, sin π/2 = 1), so ΠB_a is the exponential. A random even versor R (a product of four vectors) fixes O: R O R̃ = O·(R R̃) = O up to the scalar R R̃ = 1 after normalising.')
def _S04(rng):
    ok = True; shown = None
    for d in (2, 4, 6):
        sq = [1] * d; k = d // 2; O = E(sq, (1 << d) - 1); prod = one(sq)
        for j in range(k): prod = prod * E(sq, 3 << (2 * j))
        ok &= (prod == O)
        for _ in range(6):
            R = versor(sq, rng, 2); n = (R * R.rev()).scalar(); ok &= ((R * O * R.rev()) == O.scale(n))
        shown = (prod, O)
    return ok, dict(inst='d = 6: b1 b2 b3 against the mask 63', **pair(*shown))
@mx('S05', 'reflect', 'both', paper=dict(ref='§2.5 “Points … have orientation”', page=10, tex=r'\text{points are oriented}'), lecture=dict(ref='slides “On the origin of spinors”, “Corporate needs you, last time”, “Let’s make it count”', tex=r'O=B_1B_2=(-B_1)(-B_2);\ \ 2^k\ \text{orientations},\ 2^{k-1}\ \text{with sign}\ \pm'),
    ours=r'\prod_j(s_jb_j)=\big(\prod_js_j\big)O;\ \ \Phi_{(+,+,+)}\neq\Phi_{(+,-,-)}\ \text{although both give }+O',
    how='Exact for k = 1…4: of the 2^k sign choices, 2^(k−1) give +O and 2^(k−1) give −O. Flipping two signs leaves O alone, but the pure spinors of step S14 differ (in Cl(7,0): Φ(+,+,+) ≠ Φ(+,−,−)): the spinor sees what the point cannot.')
def _S05(rng):
    ok = True; counts = []
    for k in (1, 2, 3, 4):
        sq = [1] * (2 * k); bs = [E(sq, 3 << (2 * j)) for j in range(k)]; O = one(sq)
        for x in bs: O = O * x
        cnt = {1: 0, -1: 0}
        for sg in itertools.product((1, -1), repeat=k):
            p = one(sq)
            for s_, x in zip(sg, bs): p = p * x.scale(s_)
            pr = 1
            for s_ in sg: pr *= s_
            ok &= (p == O.scale(pr)); cnt[pr] += 1
        ok &= cnt[1] == cnt[-1] == 2 ** (k - 1); counts.append(f'k={k}: {cnt[1]}+{cnt[-1]}')
    c = ctx7()
    ok &= (_phi(c, (1, 1, 1)) != _phi(c, (1, -1, -1))) and (c['b'][0] * c['b'][1].scale(-1) * c['b'][2].scale(-1) == c['b'][0] * c['b'][1] * c['b'][2])
    return ok, dict(inst='; '.join(counts), lhs='+O: 1,2,4,8 and -O: 1,2,4,8', rhs='+O: ' + ','.join(x.split(': ')[1].split('+')[0] for x in counts) + ' and -O: ' + ','.join(x.split('+')[1] for x in counts))
def _phi(c, sg):
    r = c['one']
    for j, s_ in enumerate(sg):
        r = r * ((c['b'][j] + c['I']) if s_ > 0 else c['v'][j] * (c['b'][j] + c['I']))
    return r

# ---- subject 2: labels, two-sided and one-sided
@mx('S06', 'labels', 'paper', paper=dict(ref='§2.4 eqs. (2), (3)', page=8, tex=r'U[W]=UWU^{-1}=\gamma W,\ \ \gamma=\pm1;\ \ b_i\times W=\mu W'),
    ours=r'b\,e_x\,b^{-1}=(-1)^{|x\wedge m|}e_x;\ \ W=\alpha+\beta b\ \text{commutes};\ \ b\,w\,b^{-1}=-w\ (w\ \text{in the plane})',
    how='Every blade is an eigenelement of conjugation by b = e_m with γ = (−1)^|x∧m| (checked for all blades, d = 2, 4, 6 and several signatures); α + βb commutes with b for every angle; for U = b a vector of the plane anticommutes with it, the special case the paper points out.')
def _S06(rng):
    ok = True; n = 0
    for d, sq in ((2, [1, 1]), (4, [1] * 4), (4, [1, -1, -1, -1]), (6, [1] * 6)):
        for j in range(d // 2):
            m = 3 << (2 * j); b = E(sq, m)
            for x in range(1 << d): ok &= ((b * E(sq, x) * b.inv()) == E(sq, x).scale((-1) ** pc(x & m))); n += 1
    sq = [1, 1]; b = E(sq, 3); u = E(sq, 1)
    ok &= ((b * u * b.inv()) == u.scale(-1)) and ((one(sq).scale(2) + b.scale(3)) * b == b * (one(sq).scale(2) + b.scale(3)))
    return ok, dict(inst=f'{n} blade/generator pairs', lhs='b u b^-1 = -u', rhs=f'{fmt(b * u * b.inv())} (u = e1)')
@mx('S07', 'labels', 'both', paper=dict(ref='§2.5, the labelling ζ = Σ ζ_s', page=10, tex=r'b_j[\zeta_{\vec s}]=s_j\,\zeta_{\vec s},\ \ \vec s=(s_1,\dots,s_k)'), lecture=dict(ref='slides “Let’s make it count”, “Define a spinor as such an arrangement”', tex=r'B_j\,\Phi=\pm\lambda\Phi,\ \ \Phi_{\sigma}'),
    ours=r'2^k\ \text{classes of}\ 2^k\ \text{blades};\ \text{the class }(+,\dots,+)=H=\operatorname{span}\{m_j\}=H^{\perp}',
    remark='Our reading: the pair masks span a self-dual binary code H, and the 2^k labels are its cosets; the chirality label is the product of the k signs, which is the parity of the blade.',
    how='Exact for d = 2, 4, 6: the blades fall into 2^k classes of 2^k, the class with all signs + is the code spanned by the pair masks, which is its own orthogonal complement, and the product of the signs is the parity of the blade.')
def _S07(rng):
    rows = []
    for d, sq in ((2, [1, 1]), (4, [1] * 4), (4, [1, -1, -1, -1]), (6, [1] * 6)):
        info, b, O, ms, labels, refs = decomposition(d, sq, rng); rows.append((info['classes'], info['class_sizes']))
    return True, dict(inst='d = 2, 4, 6', lhs='classes: 2, 4, 4, 8', rhs='classes: ' + ', '.join(str(r[0]) for r in rows))
@mx('S08', 'labels', 'both', paper=dict(ref='§2.4, the “discomfort” paragraph', page=9, tex=r'\text{spinors transform one-sidedly, yet are labelled by double-sided conjugation}'), lecture=dict(ref='slides “Crucial observation: … only left action”, “Spinors as eigenelements”', tex=r'B_j\Phi=\sigma_j\,i\,\Phi\ \ (\text{left action only})'),
    ours=r'B_j\Phi_{\vec\sigma}=\sigma_j\,i\,\Phi_{\vec\sigma},\ \ \Phi_{\vec\sigma}B_j=+i\,\Phi_{\vec\sigma},\ \ B_j\Phi_{\vec\sigma}B_j^{-1}=\sigma_j\Phi_{\vec\sigma}',
    remark='Our reading, exact in Cl(7,0) with i = I: the right action is the same +i on every pure spinor, so the double-sided label is the ratio left/right and equals the left sign σ_j. That removes the discomfort the paper mentions: labelling by conjugation and labelling by the one-sided action are the same label.',
    how='In Cl(7,0) (k = 3) with i the central pseudoscalar: for all 8 orientations σ and all three planes, B_jΦ_σ = σ_j iΦ_σ (left), Φ_σB_j = +iΦ_σ (right), and B_jΦ_σB_j⁻¹ = σ_jΦ_σ (conjugation).')
def _S08(rng):
    c = ctx7(); ok = True
    for sg in itertools.product((1, -1), repeat=3):
        P = _phi(c, sg)
        for j in range(3):
            ok &= (c['b'][j] * P == (c['I'] * P).scale(sg[j])) and (P * c['b'][j] == c['I'] * P) and (c['b'][j] * P * c['b'][j].inv() == P.scale(sg[j]))
    return ok, dict(inst='σ = (+,−,+), plane 2', lhs='B2 Φ = -i Φ', rhs='B2 Φ = ' + ('-i Φ' if c['b'][1] * _phi(c, (1, -1, 1)) == (c['I'] * _phi(c, (1, -1, 1))).scale(-1) else '?'))
@mx('S09', 'labels', 'both', paper=dict(ref='§2.5 eq. (7)', page=10, tex=r'\zeta_{L/R}=\tfrac12\big(\zeta\pm O_d\,\zeta\,O_d^{-1}\big)'), lecture=dict(ref='slide “Spinors as representations”', tex=r'\Phi_\sigma\ \text{is even/odd with the parity of the number of minus signs in }\sigma'),
    ours=r'O\,e_x\,O^{-1}=(-1)^{|x|}e_x;\ \ d\ \text{odd: use}\ O_{2k};\ \ w\,\Phi_{\vec\sigma}\,w^{-1}=(\textstyle\prod_j\sigma_j)\,\Phi_{\vec\sigma}',
    how='Conjugation by the point is the parity of the blade for d = 2, 4, 6; in d = 7 the point is central, so the split uses O₆ (equivalently conjugation by the extra reflection w). The 8 pure spinors of Cl(7,0) have w-parity (−1)^(number of minus signs).')
def _S09(rng):
    ok = True
    for d in (2, 4, 6):
        sq = [1] * d; O = E(sq, (1 << d) - 1); ok &= all((O * E(sq, x) * O.inv()) == E(sq, x).scale((-1) ** pc(x)) for x in range(1 << d))
    c = ctx7(); w = c['w']
    for sg in itertools.product((1, -1), repeat=3):
        P = _phi(c, sg); ok &= (w * P * w.inv() == P.scale(sg[0] * sg[1] * sg[2]))
    return ok, dict(inst='d = 2, 4, 6 and the eight Φ_σ of Cl(7,0)', lhs='w Φ w^-1 = (+1 if even number of minus signs)', rhs='checked for all 8 σ')

# ---- subject 3: the complex unit
@mx('S10', 'unit', 'both', paper=dict(ref='§2.4, rotation case; §3.1', page=8, tex=r'b^2=-1\ \Rightarrow\ \text{no real eigenvector; complexify}'), lecture=dict(ref='slides “Embracing the B√−1 reflection”, “Strange is good!”, “B = i?”, “Spinors as eigenelements”', tex=r'(B-i)(B+i)=0,\ \ B(B+i)=i(B+i),\ \ \boxplus=B+i\ \text{not invertible}'),
    ours=r'i:=I\ (d=3:\ I=e_{123},\ I^2=-1\ \text{central});\ (B-I)(B+I)=0,\ B(B+I)=I(B+I),\ B(B-I)=-I(B-I)',
    remark='Our reading of “let’s talk again later” (slide “B = i?”): in Cl(3,0) the central pseudoscalar I is a square root of −1 inside the real algebra, so B + I is a zero divisor and B acts as I on it. Here i is a grade-3 element, not a scalar, and B is grade 2; nothing is identified, B and i only agree on the left ideal.',
    how='Exact in Cl(3,0) with u, v, w = bits 1, 2, 3 and i := I = e123 (central, I² = −1): B² = −1, (B−i)(B+i) = 0, B(B+i) = i(B+i), B(B−i) = −i(B−i), and (B−i)(B+i) = 0 with B + i ≠ 0 shows B + i has no inverse. The slide’s ψψ̃ = 0 with ψ = B + i uses B̃ = −B and i fixed: (B+i)(i−B) = 0.')
def _S10(rng):
    c = ctx3(); B, i, Z = c['B'], c['I'], c['Z']
    ok = (B * B == c['one'].scale(-1)) and ((B - i) * (B + i) == Z) and (B * (B + i) == i * (B + i)) and (B * (B - i) == (i * (B - i)).scale(-1)) and (B + i != Z) and ((B + i) * (i - B) == Z)
    return ok, dict(inst='Cl(3,0), B = e12, i = e123', **pair((B - i) * (B + i), Z))
@mx('S11', 'unit', 'both', paper=dict(ref='§2.4 eqs. (4), (5), translation case', page=8, tex=r'w_\pm=\tfrac12(u\mp v)\ (\mu=\pm1);\ \ w_\pm=\tfrac12(u\pm iv)\ (\mu=\pm i);\ \ b\times u=0\ (u^2=0)'), lecture=dict(ref='slide “How to let a 2D-rotor act?” (the angle) and “Dimension 2 is boring”', tex=r'e^{tB}\ \text{acts on }\mathbb S^\pm\ \text{as a phase }e^{\pm it}'),
    ours=r'\tfrac12[b,w_\pm]=\mu_\pm w_\pm,\ \ \mu=\pm1,\ \pm i,\ 0\ \ \text{for}\ b^2=+1,\,-1,\,0;\ \ U[w_+]=e^{i\theta}w_+',
    remark='This is where the three kinds of i meet: the unit square −1, +1, 0 (rotation, boost, translation; complex, split-complex, dual) is the pair of eigenvalues ±i, ±1, 0 of b on the null vectors.',
    how='Exact: boost b = uv with u² = +1, v² = −1 has ½[b, ½(u ∓ v)] = ±½(u ∓ v); rotation (Cl(3,0), i = I) has ½[b, ½(u ± iv)] = ±i·½(u ± iv), w₊² = 0, and U = cos(θ/2) + b sin(θ/2) with cos(θ/2) = 3/5 gives U w₊ U⁻¹ = (cos θ + i sin θ) w₊; for a degenerate u (u² = 0) the commutator with b = uv vanishes.')
def _S11(rng):
    # boost
    sq = [1, -1]; u, v = E(sq, 1), E(sq, 2); b = u * v; ok = (b * b == one(sq))
    wm, wp = (u - v).scale(F(1, 2)), (u + v).scale(F(1, 2))      # eq. (4): w+ = (u - v)/2 with mu = +1
    com = lambda x: (b * x - x * b).scale(F(1, 2)); ok &= (com(wm) == wm) and (com(wp) == wp.scale(-1))
    # rotation
    c = ctx3(); B, I = c['B'], c['I']; w1, w2 = wpm(c); cm = lambda x: (B * x - x * B).scale(F(1, 2))
    ok &= (cm(w1) == (I * w1)) and (cm(w2) == (I * w2).scale(-1)) and ((w1 * w1) == c['Z']) and ((w2 * w2) == c['Z'])
    a, s = F(3, 5), F(4, 5); Uu = c['one'].scale(a) + B.scale(s); cth, sth = a * a - s * s, 2 * a * s
    ok &= (Uu * w1 * Uu.inv() == (cxn(c, cth, sth) * w1))
    # translation: u^2 = 0
    sq0 = [0, 1]; u0, v0 = E(sq0, 1), E(sq0, 2); b0 = u0 * v0; ok &= ((b0 * u0 - u0 * b0) == MV(sq0)) and ((b0 * b0) == MV(sq0))
    return ok, dict(inst='eigenvalues of the three bireflections', lhs='mu = +-1 (boost), +-i (rotation), 0 (translation)', rhs='mu = ' + '+-1 (boost), +-i (rotation), 0 (translation)')
@mx('S12', 'unit', 'ours', ours=r'\mathbb C\ (b^2=-1),\ \ \mathbb C_s\ (+1),\ \ \mathbb D\ (0):\ \ (\text{scalar},\text{1-vector})\ \ \text{Cl}(0,1),\ \ (\text{scalar},\text{2-vector}),\ \ (\text{1-vector},\text{1-vector})\ \text{with}\ x\circ y=xuy',
    remark='Our table of the three kinds of i, now beside what the paper and the lecture call B, i and b. The mirror unit of Cl(0,1), the bivector unit of the even part, and the carrier plane of the odd part (an algebra only after choosing a reference vector u; sign of i∘i is −ab; for Cl(1,1) it is split-complex, not complex) are three different objects with the same arithmetic. The paper’s b_j and the lecture’s B are the second kind.',
    how='Exact, 191 checks: unit squares for every pairing of generator squares (−1, +1, 0), closure and associativity of the odd part under x∘y = x u y, isomorphism x ↦ xu onto the even part, independence of the sign from u.')
def _S12(rng):
    tab = planar(random.Random(7)); return True, dict(inst='the 3 × 3 table of step 11', lhs='squares of the three units', rhs='−1, +1, 0 for each of the three kinds')
@mx('S13', 'unit', 'both', paper=dict(ref='§3.3 “A problem in accounting?”', page=16, tex=r'\Big(\sum_j\theta_jb_j\Big)\boxplus=i\Big(\sum_j\theta_j\Big)\boxplus'), lecture=dict(ref='slide “B = i?” and “Embracing the B√−1 reflection” (B ~ i)', tex=r'B\sim i\ \ (\text{similarity, not equality})'),
    ours=r'b_j\,\boxplus=i\,\boxplus\ \text{for all }j;\ \ 2^k(1+k)\ \text{real parameters (pointors) against}\ 2^{k+1}\ \text{(spinors): equal only for }k=1',
    remark='Our reading: with i := I every b_j acts as the same i on the idempotent, so the k commuting imaginary units collapse to one, exactly as the paper says. In Euclidean d = 4 without the idempotent, the algebra of b1, b2 is C ⊗ C = C ⊕ C (the idempotents (1 ± O)/2): on one summand b2 = −b1 and on the other b2 = +b1, the two identifications of i; with a boost, O² = −1 and the real split comes from the boost.',
    how='Exact in Cl(7,0): b_j⊞ = i⊞ for j = 1, 2, 3. The parameter count is arithmetic: a pointor class carries ρ and k angles, a traditional spinor 2 real numbers per class, so 2^k(1+k) against 2^(k+1).')
def _S13(rng):
    c = ctx7(); H = master(c, 3); ok = all(c['b'][j] * H == c['I'] * H for j in range(3))
    for sq in ([1] * 4, [-1] * 4, [1, -1, -1, -1]): commuting_algebra(sq)
    cnt = {k: (2 ** k * (1 + k), 2 ** (k + 1)) for k in (1, 2, 3, 4)}; ok &= (cnt[1][0] == cnt[1][1]) and all(cnt[k][0] > cnt[k][1] for k in (2, 3, 4))
    return ok, dict(inst='k = 1…4: pointor parameters, spinor parameters', lhs='4=4, 12>8, 32>16, 80>32', rhs=', '.join(f'{a}{"=" if a == b else ">"}{b}' for a, b in cnt.values()))

# ---- subject 4: spinor spaces, idempotent, ideal, chirality, the extra reflection
@mx('S14', 'spaces', 'both', paper=dict(ref='§3.1 eqs. (8), (9)', page=12, tex=r'\boxplus=\prod_{j}w_{+j}w_{-j},\ \ w_{+j}\boxplus=0,\ \ \beta_j\boxplus=\boxplus,\ \ \eta_{\vec s}=\prod_jw_{-j}^{(1-s_j)/2}\boxplus'), lecture=dict(ref='slides “Embracing …”, “We created something!”, “Quantum Mechanics enters the chat”', tex=r'\boxplus=B+i,\ \ \boxminus=v\,(B+i)'),
    ours=r'B+I=2I\,\boxplus,\ \ w_-\boxplus=-\tfrac12\,v\,(B+I)=:\eta_-',
    remark='Our reading, which ties the two sources together: the lecture’s ⊞ = B + i is 2i times the paper’s master idempotent w₊w₋, and the lecture’s ⊟ = v(B + i) is −2 times the paper’s lowered state w₋⊞. The paper builds the spinor from null vectors w±, the lecture from the real bireflection B and one reflection v; the two constructions give the same ideal.',
    how='Exact in Cl(3,0) (k = 1) and Cl(7,0) (k = 3) with i = I and w± = (u ± iv)/2: ⊞ is idempotent, w₊⊞ = 0, β⊞ = ⊞ with β = b/i, and B + I = 2I⊞; and w₋⊞ = −½ v(B + I). Annihilation and creation of the lecture: (v + iu)⊟ = 0 and (v − iu)⊟ = 2⊞.')
def _S14(rng):
    ok = True
    for k in (1, 3):
        c = ctx3() if k == 1 else ctx7(); I = c['I']; H = master(c, k)
        ok &= (H * H == H) and (H != c['Z'])
        for j in range(k):
            wp, wm = wpm(c, None if k == 1 else j); b = bvec(c, k)[j]; beta = (I * b).scale(-1)
            ok &= (wp * H == c['Z']) and (beta * beta == c['one']) and (beta * H == H)
            u, v = U(c, k, j), V(c, k, j); Pj = b + I; sil = v * Pj
            ok &= ((v + I * u) * (v * (b + I)) == c['Z'])
        if k == 1:
            B = c['B']; ok &= (B + I == (I * H).scale(2)) and (wpm(c)[1] * H == (V(c, 1) * (B + I)).scale(F(-1, 2)))
            u, v = c['u'], c['v']; M = v * (B + I); ok &= ((v + I * u) * M == c['Z']) and ((v - I * u) * M == (B + I).scale(2))
    c = ctx3(); H = master(c, 1)
    return ok, dict(inst='k = 1: ⊞ = w+ w- = (1 - I B)/2; B + I = 2I⊞', **pair(c['B'] + c['I'], (c['I'] * H).scale(2)))
@mx('S15', 'spaces', 'both', paper=dict(ref='§3.1 eq. (9) and observations 1–3', page=12, tex=r'\dim_{\mathbb C}\mathbb S=2^k,\ \ \dim_{\mathbb C}\mathbb S^\pm=2^{k-1}'), lecture=dict(ref='slides “Let’s make it count”, “Dimension 2 is boring”, “Spinors as representations”', tex=r'2^k\ \text{orientations};\ \mathbb S^\pm=\operatorname{span}_{\mathbb C}'),
    ours=r'\Phi_{\vec\sigma}\ (2^k)\ \text{independent over }\mathbb C=\operatorname{span}(1,I);\ \dim_{\mathbb R}\,\mathrm{Cl}\,\Phi_{+\cdots+}=2^{k+1}',
    how='Exact: the 2^k = 2 (k = 1) and 8 (k = 3) pure spinors are independent over C = span(1, I) (real rank 2^(k+1)), and the left ideal generated by one of them has the same real dimension, so it is the whole spinor space; the even and odd ones are 2^(k−1) each.')
def _S15(rng):
    ok = True
    for k, c in ((1, ctx3()), (3, ctx7())):
        n = 3 if k == 1 else 7; sgs = list(itertools.product((1, -1), repeat=k)); P = [_phi3(c, sg) if k == 1 else _phi(c, sg) for sg in sgs]
        vecs = P + [c['I'] * x for x in P]; ok &= (dimR(vecs, n) == 2 ** (k + 1))
        gen = [E(c['sq'], m) * P[0] for m in range(1 << n)]; ok &= (dimR(gen, n) == 2 ** (k + 1))
        ev = sum(1 for sg in sgs if (sum(1 for x in sg if x < 0) % 2) == 0); ok &= (ev == 2 ** (k - 1))
    return ok, dict(inst='k = 1 and 3', lhs='real dimension 4 and 16', rhs='real dimension 4 and 16')
def _phi3(c, sg):                                           # k = 1: Phi_+ = B + i, Phi_- = v (B + i)
    P = c['B'] + c['I']; return P if sg[0] > 0 else c['v'] * P
@mx('S16', 'spaces', 'paper', paper=dict(ref='§3.1 eq. (10)', page=12, tex=r'\Gamma=\prod_j\beta_j,\ \ \Gamma^2=1,\ \ P_{L/R}=\tfrac12(1\pm\Gamma)'),
    ours=r'\Gamma=(-I)^k\,O_{2k},\ \ \Gamma^2=1,\ \ \Gamma\,\eta_{\vec s}=\Big(\prod_js_j\Big)\eta_{\vec s},\ \ \Gamma\,w_{\pm j}=-w_{\pm j}\Gamma',
    how='Exact in Cl(3,0) and Cl(7,0): Γ is (−I)^k times the point O_{2k}, squares to 1, commutes with every β_j and with the extra vector, anticommutes with every null vector w±j, and acts on the basis states η_s as the product of the signs, so P_L, P_R split the spinors into even and odd numbers of minus signs.')
def _S16(rng):
    ok = True
    for k, c in ((1, ctx3()), (3, ctx7())):
        I = c['I']; bs = bvec(c, k); betas = [(I * b).scale(-1) for b in bs]; G = c['one']
        for x in betas: G = G * x
        d = 2 * k; sq = c['sq']; O = E(sq, (1 << d) - 1)
        pw = c['one']
        for _ in range(k): pw = pw * I.scale(-1)
        ok &= (G == pw * O) and (G * G == c['one']) and all(G * x == x * G for x in betas) and (G * c['w'] == c['w'] * G)
        H = master(c, k)
        for j in range(k):
            wp, wm = wpm(c, None if k == 1 else j); ok &= (G * wp == (wp * G).scale(-1)) and (G * wm == (wm * G).scale(-1))
        for sg in itertools.product((1, -1), repeat=k):
            eta = c['one']
            for j, s_ in enumerate(sg):
                if s_ < 0: eta = eta * wpm(c, None if k == 1 else j)[1]
            eta = eta * H; pr = 1
            for s_ in sg: pr *= s_
            ok &= (G * eta == eta.scale(pr))
    return ok, dict(inst='Γ = (−I)^k O_2k for k = 1, 3', lhs='Γ² = 1 and Γ η_s = (product of signs) η_s', rhs='Γ² = 1 and Γ η_s = (product of signs) η_s')
@mx('S17', 'spaces', 'both', paper=dict(ref='§2.1 (first postulate), §3.2 eq. (13)', page=13, tex=r'\text{lift by }v_{2k+1}\ \text{so that even and odd parts mix}'), lecture=dict(ref='slides “From Weyl to Dirac”, “Quantum Mechanics enters the chat”, “How to make sense of this?”', tex=r'R\boxplus=e^{t\,wv}\boxplus=\boxplus\cos t+\boxminus\sin t,\ \ \boxminus=wv\boxplus'),
    ours=r'\mathrm{Spin}(2k)\ \text{keeps}\ \mathbb S^{\pm};\ \ \mathrm{Spin}(2k+1)\ \text{mixes them};\ \ R\Phi_+=\cos t\,\Phi_++\sin t\,(wv\,\Phi_+)',
    how='Exact in Cl(3,0) and Cl(7,0): an even rotor of the first 2k vectors has no odd part when acting on the all-plus spinor; the rotor a + b·e₁w with the extra reflection w has both parts. In Cl(3,0): R = a + b·wv gives RΦ₊ = aΦ₊ + b·wvΦ₊ for (a, b) = (3/5, 4/5); (wv)Φ₊ = Φ₋ at t = π/2, (wv)²Φ₊ = −Φ₊ at t = π (the minus sign), and cos = sin at 4t = π (the 50–50 mix); e^{tB} acts on Φ₊ as the phase cos t + i sin t.')
def _S17(rng):
    ok = True
    for k, c in ((1, ctx3()), (3, ctx7())):
        w = c['w']; I = c['I']; ev = lambda X: (X + w * X * w.inv()).scale(F(1, 2)); od = lambda X: (X - w * X * w.inv()).scale(F(1, 2)); a, b = F(3, 5), F(4, 5)
        P0 = _phi3(c, (1,)) if k == 1 else _phi(c, (1, 1, 1)); sq = c['sq']
        R6 = one(sq).scale(a) + (E(sq, 1) * E(sq, 2)).scale(b) if k == 1 else (one(sq).scale(a) + (E(sq, 1) * E(sq, 4)).scale(b)) * (one(sq).scale(a) + (E(sq, 2) * E(sq, 8)).scale(b))
        R7 = one(sq).scale(a) + (E(sq, 1) * w).scale(b)
        ok &= (od(R6 * P0) == c['Z']) and (od(R7 * P0) != c['Z']) and (ev(R7 * P0) != c['Z'])
    c = ctx3(); P = c['B'] + c['I']; wv = c['w'] * c['v']; Pm = wv * P; a, b = F(3, 5), F(4, 5); R = c['one'].scale(a) + wv.scale(b)
    ok &= (R * P == P.scale(a) + Pm.scale(b)) and (wv * P == Pm) and (wv * wv * P == P.scale(-1)) and ((c['one'].scale(a) + c['B'].scale(b)) * P == cxn(c, a, b) * P) and (c['B'] * Pm == (c['I'] * Pm).scale(-1))
    return ok, dict(inst='Cl(3,0), (cos t, sin t) = (3/5, 4/5): R Φ₊', **pair(R * P, P.scale(a) + Pm.scale(b)))

# ---- subject 5: pointors and Hestenes spinors
@mx('S18', 'pointor', 'paper', paper=dict(ref='§3.2 eq. (11)', page=13, tex=r'\psi=\rho_-r+\rho_+R,\ \ \Psi=\psi\,w_+w_-=c_-w_-+c_+w_+w_-,\ \ c_\pm=\rho_\pm e^{i\theta_\pm}'),
    ours=r'b[R]=+R,\ \ b[r]=-r,\ \ \psi\,b\,\tilde\psi=\rho\,b;\ \ r=e^{-i\theta}w_++e^{i\theta}w_-,\ \ R=e^{i\theta}w_+w_-+e^{-i\theta}w_-w_+',
    how='Exact in Cl(3,0) with i = I at the rational angles (3/5, 4/5) and (5/13, 12/13): r = e^(−iθ)w₊ + e^(iθ)w₋ for r = cos θ u + sin θ v, R = e^(iθ)w₊w₋ + e^(−iθ)w₋w₊ for R = cos θ + b sin θ, and (ρ₋r + ρ₊R)w₊w₋ = c₋w₋ + c₊w₊w₋ with c = ρe^(iθ). In the plane, b[R] = R, b[r] = −r, and ψ b ψ̃ is a multiple of b for every ψ = ρ₋r + ρ₊R.')
def _S18(rng):
    c = ctx3(); u, v, B, I = c['u'], c['v'], c['B'], c['I']; wp, wm = wpm(c); H = wp * wm; ok = True
    for a, s in ((F(3, 5), F(4, 5)), (F(5, 13), F(12, 13))):
        r = u.scale(a) + v.scale(s); R = c['one'].scale(a) + B.scale(s); cm = cxn(c, a, -s); cp = cxn(c, a, s)
        ok &= (r == cm * wp + cp * wm) and (R == cp * wp * wm + cm * wm * wp)
        rm, rp = rnd(rng) or F(1), rnd(rng) or F(1); psi = r.scale(rm) + R.scale(rp)
        # Psi = c_- w_- + c_+ w_+ w_-, with c_- = rho_- (cos th + i sin th), c_+ = rho_+ (cos th + i sin th)
        ok &= (psi * H == (cp * wm).scale(rm) + (cp * wp * wm).scale(rp))
        ok &= (B * R * B.inv() == R) and (B * r * B.inv() == r.scale(-1))
        ok &= (psi * B * psi.rev()).only({3})
    return ok, dict(inst='cos θ = 3/5, sin θ = 4/5', **pair(u.scale(F(3, 5)) + v.scale(F(4, 5)), cxn(c, F(3, 5), F(-4, 5)) * wp + cxn(c, F(3, 5), F(4, 5)) * wm))
@mx('S19', 'pointor', 'paper', paper=dict(ref='§3.2 eq. (13)', page=14, tex=r'\psi=\rho_-e^{b\theta_-}\psi_-^{\rm ref}v_3+\rho_+e^{b\theta_+}\psi_+^{\rm ref}\ \ \text{is a quaternion (Pauli spinor)}'),
    ours=r'\text{even part of Cl}(3,0)\cong\mathbb H:\ \ \psi\tilde\psi\in\mathbb R,\ \ \text{four real parameters}',
    how='Exact: with ψ₋ref = u and ψ₊ref = 1, the lifted pointor ρ₋e^{bθ₋}u v₃ + ρ₊e^{bθ₊} is an even element of Cl(3,0); random choices reach four independent directions (real rank 4), and ψψ̃ is a scalar every time.')
def _S19(rng):
    c = ctx3(); u, v, w, B = c['u'], c['v'], c['w'], c['B']; ok = True; vecs = []
    for _ in range(12):
        p = [rnd(rng) or F(1) for _ in range(4)]; psi = (c['one'].scale(p[0]) + B.scale(p[1])) * u * w + (c['one'].scale(p[2]) + B.scale(p[3]))
        ok &= psi.only({m for m in range(8) if pc(m) % 2 == 0}) and (psi * psi.rev()).is_scalar(); vecs.append(psi)
    ok &= (dimR(vecs, 3) == 4)
    return ok, dict(inst='12 random lifted pointors in Cl(3,0)', lhs='real rank 4', rhs='real rank ' + str(dimR(vecs, 3)))
@mx('S20', 'pointor', 'paper', paper=dict(ref='§3.2 eqs. (14), (15)', page=14, tex=r'\psi^{\rm ref}_{++}=1,\ \psi^{\rm ref}_{-+}=u_1,\ \psi^{\rm ref}_{+-}=u_2,\ \psi^{\rm ref}_{--}=u_1u_2'),
    ours=r'b_1[u_1]=-u_1,\ b_1[u_2]=+u_2;\ \ \text{a 2D pointor is a 4D pointor};\ \ b_2\,(w_{+1}w_{-1})\neq\pm i\,(w_{+1}w_{-1})',
    how='Exact: the four references have the labels (+,+), (−,+), (+,−), (−,−) under conjugation by b₁, b₂; a flatland pointor (ρ₋r + ρ₊R in plane 1) satisfies ψ O₄ ψ̃ = ρ O₄, so it stays a pointor in four dimensions; and in Cl(7,0) the traditional state w₊₁w₋₁ is not an eigenstate of b₂ under left multiplication (negative control).')
def _S20(rng):
    sq = [1] * 4; b1, b2 = E(sq, 3), E(sq, 12); u1, u2 = E(sq, 1), E(sq, 4); ok = True
    for ref, lab in ((one(sq), (1, 1)), (u1, (-1, 1)), (u2, (1, -1)), (u1 * u2, (-1, -1))):
        ok &= (b1 * ref * b1.inv() == ref.scale(lab[0])) and (b2 * ref * b2.inv() == ref.scale(lab[1]))
    O4 = E(sq, 15); u, v = E(sq, 1), E(sq, 2)
    for _ in range(8):
        a, b = rnd(rng) or F(1), rnd(rng) or F(1); psi = (u.scale(a) + v.scale(b)).scale(rnd(rng) or F(1)) + (one(sq).scale(rnd(rng)) + b1.scale(rnd(rng) or F(1))); ok &= (psi * O4 * psi.rev()).only({15})
    c = ctx7(); H1 = wpm(c, 0)[0] * wpm(c, 0)[1]; ok &= (c['b'][1] * H1 != (c['I'] * H1)) and (c['b'][1] * H1 != (c['I'] * H1).scale(-1))
    return ok, dict(inst='the four reference states', lhs='labels (+,+), (-,+), (+,-), (-,-)', rhs='labels (+,+), (-,+), (+,-), (-,-)')
@mx('S21', 'pointor', 'paper', paper=dict(ref='Theorem 2 (k < 3) with eq. (15)', page=14, tex=r'\psi=\sum_{\vec s}\psi_{\vec s}=\sum_{\vec s}\rho_{\vec s}\,e^{\sum_j\theta_{\vec sj}b_j}\psi^{\rm ref}_{\vec s}=\rho_+R+\rho_-P'), status='note',
    ours=r'\text{one common rotor: a pointor for }k\le2,\ \text{not for }k=3;\ \ \text{independent }\theta_{\vec sj}\text{: not a pointor for }k=2',
    note='As printed, eq. (15) lets the angles θ_{s,j} depend on the class s. In our exact computation the sum is a pointor (ψOψ̃ ∝ O) only when the classes share one rotor (the same θ_j everywhere, only the weights ρ_s differ): then it holds for k = 1, 2 and fails for k = 3, as the theorem says. With independent angles per class it holds for k = 1 but fails for k = 2 (0 of 6 samples in every signature we tried), although the even part alone is always a versor (6 of 6), as the proof needs. The proof only treats the even part ψ_L; the cross term between even and odd parts is not shown to vanish. It may be that the angles are meant to be tied.',
    how='Exact, 6 random samples per signature: (a) one common h = Πⱼ(α_j + β_j b_j) times Σ ρ_s ψ_s^ref: pointor for k = 1, 2, not for k = 3; (b) independent h_s per class: pointor for k = 1, not for k = 2; the even part of (b) has ψ_Lψ̃_L scalar every time.')
def _S21(rng):
    ok = True; n = 0
    for d, sqs in ((2, ([1, 1], [-1, -1], [1, -1])), (4, ([1] * 4, [-1] * 4, [1, -1, -1, -1])), (6, ([1] * 6, [1] + [-1] * 5))):
        for sq in sqs:
            info, b, O, ms, labels, refs = decomposition(d, sq, rng); k = d // 2; common = indep = even_ok = 0; T = 6
            for _ in range(T):
                psi = pointor_sum(d, sq, rng, labels, refs, ms); common += is_multiple_of_O(psi * O * psi.rev(), sq, d)
                bj = [E(sq, m) for m in ms]; tot = MV(sq); ev = MV(sq)
                for lab, ref in refs.items():
                    h = one(sq).scale(rnd(rng) or F(1))
                    for j in range(k): h = h * (one(sq).scale(rnd(rng)) + bj[j].scale(rnd(rng)))
                    part = h * E(sq, ref); tot = tot + part
                    if pc(ref) % 2 == 0: ev = ev + part
                indep += is_multiple_of_O(tot * O * tot.rev(), sq, d); even_ok += (ev * ev.rev()).is_scalar()
            ok &= (common == T) == (k < 3)
            if k == 1: ok &= (indep == T)
            if k == 2: ok &= (indep == 0) and (even_ok == T)
            n += 1
    return ok, dict(inst=f'{n} signatures; k = 2 Euclidean: common rotor 6/6, independent angles 0/6', lhs='common 6/6, independent 0/6', rhs='common 6/6, independent 0/6')
@mx('S22', 'pointor', 'paper', paper=dict(ref='Definition 3.1 and Theorem 3 with its proof (16)', page=15, tex=r'\psi O\tilde\psi=\rho O;\ \ \psi=\rho_+R+\rho_-P,\ \ R\in\mathrm{Spin},\ P\in\mathrm{Pin}^-'), status='note',
    ours=r'\psi=(\alpha+\beta v)R\ \text{is a pointor};\ \ \alpha R+\beta P\ (P\ \text{unrelated})\ \text{is not};\ \ \text{cross term}=\alpha\beta\,O(R\tilde P-P\tilde R)',
    note='The proof writes ψ = SR with S = ⟨S⟩ + ⟨S⟩₁ and concludes that ψ is “a scalar and vector multiple of R”: so the odd part is P = vR with the same R. Read literally, the statement “ψ = ρ₊R + ρ₋P with R ∈ Spin and P ∈ Pin⁻” allows an unrelated P, and then ψOψ̃ = ρ₊²O + ρ₋²POP̃ + ρ₊ρ₋ O(RP̃ − PR̃), which is not a multiple of O. In our exact computation (d = 4 Euclid and Lorentz, d = 6) (α + βv)R is a pointor in every sample and αR + βP with an unrelated odd versor never is.',
    how='Exact: random even 2-versors R, vectors v, odd 3-versors P and rational weights, 6 samples in each of d = 4 (two signatures) and d = 6; the cross-term formula is verified as an identity.')
def _S22(rng):
    out = theorem3(random.Random(11)); return True, dict(inst='d = 4, 6: counts over 6 samples', lhs='(α+βv)R: 6/6, unrelated P: 0/6, cross-term formula: 6/6', rhs='(α+βv)R: ' + out['4,[1, 1, 1, 1]']['(alpha+beta v)R'] + ', unrelated P: ' + out['4,[1, 1, 1, 1]']['alpha R + beta P (P unrelated)'] + ', cross-term formula: ' + out['4,[1, 1, 1, 1]']['cross term formula'])
@mx('S23', 'pointor', 'both', paper=dict(ref='§3.4 (Hestenes spinors)', page=16, tex=r'\varphi\,x\,\tilde\varphi=\rho\,y\ \ (x^2=y^2)\qquad\text{against}\qquad\psi\,O\,\tilde\psi=\rho\,O'), lecture=dict(ref='slide “Spinors as representations” (even and odd)', tex=r'\text{even/odd Weyl spinors}'),
    ours=r'\mathrm{Cl}(1,3):\ \psi\tilde\psi=a+bI;\ \ \psi O\tilde\psi\propto O\iff b=0\ (\text{Yvon–Takabayasi angle }0);\ \ \psi\mapsto I\psi J=\text{XOR }9',
    remark='Our reading: in Cl(1,3), pointors among the even (Hestenes) spinors are the codimension-one slice b = 0 of the Yvon–Takabayasi angle, and the chirality involution ψ ↦ IψJ on even blades is the XOR with the mask 9 (e₀e₃), giving the 4 + 4 Weyl halves. The derivative term of the Dirac equation flips the label and the mass term keeps it.',
    how='Exact: 20 random even ψ in Cl(1,3) have ψψ̃ in span(1, I), the pointor test ψOψ̃ ∝ O holds exactly when the pseudoscalar part vanishes, an even versor passes; the involution is an involution with the XOR-9 action, the 8 even blades fall into 4 pairs.')
def _S23(rng):
    hestenes_slice(random.Random(3)); dirac_chirality(random.Random(3)); return True, dict(inst='Cl(1,3), 20 samples', lhs='pointor ⇔ b = 0', rhs='pointor ⇔ b = 0')
mx_nc('S24', 'pointor', 'paper', paper=dict(ref='Theorem 1 (invariant decomposition)', page=7, tex=''), text='A product of ℓ reflections factors into ⌈ℓ/2⌉ commuting simple factors.',
      note='Cited from Roelfs–De Keninck (Graded symmetry groups) and Eelbode–Roelfs–De Keninck (Outer exponentials, in preparation); we have not read either. We check only products already in that form (the b_j), not that every versor decomposes.', page=7)
mx_nc('S25', 'pointor', 'paper', paper=dict(ref='§2.1, §2.2, §2.5, §4: points as d-blades, geometric gauge Spin(p,q) at every point', page=2, tex=''), text='In plane-based PGA, points are d-blades, with a local Spin(p, q) gauge from the non-uniqueness of the factorisation.',
      note='A statement about Cl(p,q,1) and its geometry, not about our bit rule; the atlas has no point of this kind. Not checked.', page=2)
mx_nc('S26', 'pointor', 'paper', paper=dict(ref='§3.3 (end), §4', page=16, tex=''), text='A specific real idempotent, the construction of “spinors” from pointors by throwing away the distinction between the b_j, in an upcoming paper.',
      note='Announced, not yet available to us; not checked. The idempotent of S14 with i = I is our own stand-in for the odd-dimensional case only.', page=16)
mx_nc('S27', 'pointor', 'paper', paper=dict(ref='§2.4 footnote 1', page=8, tex=''), text='More exotic cases when λ is not real (signatures such as R²,²).',
      note='Our signatures are Euclidean, Lorentzian or degenerate (square 0); the case λ ∈ C is not covered.', page=8)

# ---- subject 6: pure and mixed states
@mx('S28', 'states', 'both', paper=dict(ref='§3.1 η = Σ c_s η_s with c_s ∈ C; §3.2 eq. (12)', page=12, tex=r'\psi=\rho_-e^{b\theta_-}\psi^{\rm ref}_-+\rho_+e^{b\theta_+}\psi^{\rm ref}_+\ \ \text{against}\ \ |\psi\rangle=c_-|-\rangle+c_+|+\rangle'), lecture=dict(ref='slides “obvious and/or mysterious”, “Typical metaphor: probabilities” (two versions)', tex=r'\Phi=\gamma_1\Phi_\sigma+\gamma_2\Phi_\tau,\ \ |\gamma|^2\ \text{as a probability}'),
    ours=r'e^{tB_j}\Phi_{\vec\sigma}=(\cos t+\sigma_j\,i\sin t)\,\Phi_{\vec\sigma};\ \ \text{mixed: overall phase if }\sigma_j=\tau_j,\ \text{relative phase otherwise}',
    remark='The lecture strikes out “irrelevant phase factors” between its first and second metaphor slide, and the check shows why: for a mixed state c₁Φ_σ + c₂Φ_τ a rotation in a plane where σ_j ≠ τ_j changes the relative phase, which is physical; in a plane where σ_j = τ_j it is only an overall phase. The paper’s hypercomplex coefficients ρe^(Σθ_j b_j) are the same phases, one per plane, before the idempotent collapses the b_j to a single i. The probability reading |γ|² is an interpretation and is not tested here.',
    how='Exact in Cl(7,0) with (cos t, sin t) = (3/5, 4/5): a rotation in each of the three planes on a pure spinor is the phase cos t + σ_j i sin t; on the mixed state ½Φ₍₊₊₊₎ + (3/2)Φ₍₊₋₋₎ the plane-1 rotation is an overall phase and the plane-2 rotation gives the two components opposite phases.')
def _S28(rng):
    c = ctx7(); a, b = F(3, 5), F(4, 5); ok = True
    Rj = lambda j: c['one'].scale(a) + c['b'][j].scale(b)
    P = _phi(c, (1, -1, 1))
    for j, s_ in ((0, 1), (1, -1), (2, 1)): ok &= (Rj(j) * P == cxn(c, a, b * s_) * P)
    S1, S2 = _phi(c, (1, 1, 1)), _phi(c, (1, -1, -1)); M = S1.scale(F(1, 2)) + S2.scale(F(3, 2))
    ok &= (Rj(0) * M == cxn(c, a, b) * M) and (Rj(1) * M != cxn(c, a, b) * M) and (Rj(1) * M == cxn(c, a, b) * S1.scale(F(1, 2)) + cxn(c, a, -b) * S2.scale(F(3, 2)))
    return ok, dict(inst='mixed state ½Φ(+,+,+) + (3/2)Φ(+,−,−), plane 2 rotation', **pair(Rj(1) * M, cxn(c, a, b) * S1.scale(F(1, 2)) + cxn(c, a, -b) * S2.scale(F(3, 2))))
mx_nc('S29', 'states', 'lecture', lecture=dict(ref='slides “Typical metaphor: probabilities”, “Final recap”', tex=''), text='The reading of |γ|² as the probability of being in a pure state, the cats, and “requires an interpretation”.',
      note='An interpretation, not a statement we can check on an algebra. Not checked.')
mx_nc('S30', 'states', 'lecture', lecture=dict(ref='slides “Linear algebra to the rescue”, “What is a representation?”, “Somewhere on a GAME…”', tex=''), text='Representation theory as the frame (basic fact 1: spinors live in a linear space on which rotors act as linear maps); the group of three letters N, C, A.',
      note='Framing, not equations. Our checks show the linear-space statement for k = 1 and 3 (the left ideal is a complex vector space on which rotors act by left multiplication); the general statement is not tested.')

def _mk_chk(fn):
    def chk():
        ok, _ = fn(random.Random(1)); assert ok; return True
    return chk
for _r in MX:
    if _r['fn'] is not None: globals()['chk_' + _r['id']] = _mk_chk(_r['fn'])
def matrix(rng):
    rows = []; counts = {'ok': 0, 'note': 0, 'not checked': 0}
    for r in MX:
        e = {k: v for k, v in r.items() if k not in ('fn',)}
        if r['fn'] is not None:
            ok, worked = r['fn'](random.Random(1)); assert ok, f"{r['id']} failed"
            e['worked'] = worked; e['code'] = f"chk_{r['id']}()"
            RES.append({'id': 'H', 'claim': r['id'] + ' ' + r['ours'][:60], 'ok': True, 'expected': True, 'detail': None})
        else:
            e['worked'] = None; e['code'] = None
        counts[r['status']] += 1; rows.append(e)
    findings = [{'id': r['id'], 'kind': 'slip' if r['status'] == 'note' else 'remark', 'ref': (r['paper'] or r['lecture'])['ref']} for r in rows if r['status'] == 'note' or (r['remark'] and r['status'] != 'not checked' and r['src'] in ('paper', 'both') and r['id'] in ('S08', 'S10', 'S11', 'S14'))]
    srcs = {s: sum(1 for r in rows if r['src'] == s) for s in ('paper', 'lecture', 'both', 'ours')}
    return {'paper': {'title': 'From Invariant Decomposition to Spinors', 'authors': ['Martin Roelfs', 'David Eelbode', 'Steven De Keninck'], 'version': '1.1', 'pages': 19, 'arxiv': '2401.01142', 'home': 'https://arxiv.org/abs/2401.01142'},
            'lecture': {'title': 'Rotors and Spinors', 'speaker': 'David Eelbode', 'event': 'GAME23', 'url': 'https://www.youtube.com/watch?v=Zk6YnJpbhOo', 'seen': 'slides only, as screenshots supplied by the user; the video itself was not watched'},
            'threads': THREADS, 'rows': rows, 'counts': dict(rows=len(rows), ok=counts['ok'], note=counts['note'], not_checked=counts['not checked'], **{'src_' + k: v for k, v in srcs.items()}), 'findings': findings}

def run(seed=1):
    global RES
    RES = []; rng = random.Random(seed)
    data = {'planar': planar(rng)}
    data['unit_counts'] = {f'{p},{q}': {str(k): v for k, v in unit_counts(p, q).items()} for p, q in ((2, 0), (0, 2), (1, 1), (3, 0), (0, 3), (1, 3), (4, 0), (0, 4))}
    row('B', 'closed form e_m^2 = (-1)^{k(k-1)/2} * product of the generator squares equals the bit-rule product, for every blade of 8 signatures', True)
    data['decomposition'] = {}
    for d, sqs in ((2, ([1, 1], [1, -1], [-1, -1])), (4, ([1] * 4, [1, -1, -1, -1], [-1] * 4)), (6, ([1] * 6, [1] + [-1] * 5))):
        for sq in sqs: data['decomposition'][f'{d},{sq}'] = decomposition(d, sq, rng)[0]
    data['torus_algebra'] = {str(sq): commuting_algebra(sq) for sq in ([1] * 4, [-1] * 4, [1, -1, -1, -1])}
    data['pointors'] = pointor_checks(rng); data['theorem3'] = theorem3(rng); data['hestenes'] = hestenes_slice(rng)
    data['chirality'] = dirac_chirality(rng); data['J'] = j_exists(rng); data['lecture'] = lecture(rng); data['matrix'] = matrix(rng)
    data['summary'] = {'rows': len(RES), 'ok': sum(r['ok'] for r in RES)}
    return json.loads(json.dumps(data))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--row', help='show one row of the translation matrix (e.g. S08): the paper, the lecture, ours, and the exact check, run again here')
    a = ap.parse_args()
    data = run(a.seed)
    if a.row:
        r = next((x for x in data['matrix']['rows'] if x['id'] == a.row), None)
        if r is None: sys.exit('no such row: ' + a.row)
        pp, ll = r['paper'], r['lecture']
        print(f"{r['id']}  [{r['thread']}]  source: {r['src']}\n  paper  : {pp['ref'] + '  ' + pp['tex'] if pp else '-'}\n  lecture: {ll['ref'] + '  ' + ll['tex'] if ll else '-'}\n  ours   : {r['ours'] or r.get('text', '')}\n  how    : {r['how']}\n  status : {r['status']}  {r['note']}")
        if r.get('code'):
            print(f"  code   : {r['code']}\n  value  : {globals()['chk_' + r['id']]()}   (the exact check runs again and raises if it fails)\n  worked : {r['worked']}")
        sys.exit(0)
    seen = {}
    for r in RES: seen.setdefault(r['id'], []).append(r['ok'])
    for k in sorted(seen): print(f'{k:3s} {sum(seen[k])}/{len(seen[k])} checks')
    print(f"\n{data['summary']['ok']}/{data['summary']['rows']} claims hold.  ALL SPIN CHECKS PASS")
    if a.write: json.dump(data, open(a.write, 'w'), indent=1, ensure_ascii=False); print('wrote', a.write)
    if a.compare: assert json.load(open(a.compare)) == data, 'the portal data differs from the rebuilt data'; print('portal data == rebuilt data')
