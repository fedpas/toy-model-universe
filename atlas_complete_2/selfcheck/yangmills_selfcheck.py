#!/usr/bin/env python3
"""Yang-Mills on the bit rule: the gauge algebra is the algebra of bivectors of m generators (so(m)), exact arithmetic, standard library only.
  python3 yangmills_selfcheck.py                          run all checks
  python3 yangmills_selfcheck.py --write yangmills.json   also write the data
  python3 yangmills_selfcheck.py --compare yangmills.json assert the portal data equals the rebuilt data
Gauge algebra: the bivectors B_ij of Cl(0,m) (blades are bit masks, every generator squares to -1), with [B_a, B_b] = f_ab^c B_c computed from the bit product.
Space-time: ns coordinates, signature 1+(ns-1).  Fields A_mu = A^a_mu B_a (linear polynomials, exact Fractions).
  F_mn = d_m A_n - d_n A_m + g [A_m, A_n]            D_l X = d_l X + g [A_l, X]
  Bianchi        D_l F_mn + D_m F_nl + D_n F_lm = 0
  Covariance     A -> A + D(lambda)  gives  dF = g [F, lambda]            (first order)
  Equation       D^m F_mn = J_n  forces  D^n J_n = 0  (covariant conservation) for every field A
For m = 2 there is one generator, nothing to commute, and the system is Maxwell's: counts are compared with n*C(n,2)."""
import argparse, itertools, json, random
from fractions import Fraction as F
from math import comb

def popc(x): return bin(x).count('1')
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

# ------------------------------------------------------------------------------------------------ the gauge algebra from the bit rule
def algebra(m):
    sq = [-1] * m; gens = [(1 << i) | (1 << j) for i in range(m) for j in range(i + 1, m)]; idx = {g: k for k, g in enumerate(gens)}
    f = {}                                                                     # f[(a, b)] = {c: coefficient}
    for a, ga in enumerate(gens):
        for b, gb in enumerate(gens):
            m1, s1 = bmul(ga, gb, sq); m2, s2 = bmul(gb, ga, sq); assert m1 == m2
            if s1 != s2:
                assert popc(m1) == 2 and abs(s1 - s2) == 2
                f[(a, b)] = {idx[m1]: s1 - s2}
    return gens, idx, f
def check_algebra(m):
    gens, idx, f = algebra(m); G = len(gens)
    def fc(a, b, c): return f.get((a, b), {}).get(c, 0)
    for a, b, c in itertools.product(range(G), repeat=3):                      # total antisymmetry of f_abc
        assert fc(a, b, c) == -fc(b, a, c) == -fc(a, c, b), ('antisymmetry', m, a, b, c)
    for a, b, c, d in itertools.product(range(G), repeat=4) if G <= 10 else []:  # Jacobi: sum_e f_ab^e f_ec^d + cyclic = 0
        t = sum(fc(a, b, e) * fc(e, c, d) + fc(b, c, e) * fc(e, a, d) + fc(c, a, e) * fc(e, b, d) for e in range(G)); assert t == 0, ('Jacobi', m)
    if G > 10:                                                                 # larger algebras: all triples with a random fourth index would be too slow; check every triple at each d
        for a, b, c in itertools.combinations(range(G), 3):
            for d in range(G):
                t = sum(fc(a, b, e) * fc(e, c, d) + fc(b, c, e) * fc(e, a, d) + fc(c, a, e) * fc(e, b, d) for e in range(G)); assert t == 0, ('Jacobi', m)
    return gens, idx, f
def structure(m):
    gens, idx, f = check_algebra(m); G = len(gens)
    pairs = sorted({tuple(sorted(k)) for k in f}); tri = list(itertools.combinations(range(m), 3))
    for i, j, k in tri:                                                        # each index triple is a closed so(3)
        a, b, c = idx[(1 << i) | (1 << j)], idx[(1 << j) | (1 << k)], idx[(1 << i) | (1 << k)]
        assert set(f[(a, b)]) == {c} and set(f[(b, c)]) == {a} and set(f[(a, c)]) == {b}
    assert len(pairs) == 3 * len(tri) == m * (m - 1) * (m - 2) // 2
    degree = {len({b for (a2, b) in f if a2 == a}) for a in range(G)}; assert degree <= {2 * (m - 2)}
    return {'gens': G, 'noncommuting_pairs': len(pairs), 'commuting_pairs': comb(G, 2) - len(pairs), 'triangles': len(tri),
            'neighbours_of_each_generator': 2 * (m - 2), 'algebra_cell': cell(0, m), 'even_half': cell(0, m - 1), 'labels': gens if m <= 5 else None}
def so4_split():
    gens, idx, f = algebra(4); G = 6
    def br(X, Y):
        r = [0] * G
        for a in range(G):
            for b in range(G):
                for c, v in f.get((a, b), {}).items(): r[c] += X[a] * Y[b] * v
        return r
    def vec(**kw):
        v = [0] * G
        for name, c in kw.items(): v[idx[int(name[1:], 2)]] = c
        return v
    B = lambda i, j: (1 << i) | (1 << j)
    for sg in itertools.product((1, -1), repeat=3):
        def mk(sign):
            out = []
            for (p, q), s in zip([((0, 1), (2, 3)), ((0, 2), (1, 3)), ((0, 3), (1, 2))], sg):
                v = [0] * G; v[idx[B(*p)]] = 1; v[idx[B(*q)]] += sign * s; out.append(v)
            return out
        X, Y = mk(1), mk(-1)
        if all(br(x, y) == [0] * G for x in X for y in Y):
            def closed(S):
                for x, y in itertools.combinations(S, 2):
                    r = br(x, y); nz = [c for c in r if c]
                    ok = any(r == [t * c for c in z] for z in S for t in (2, -2, 4, -4))
                    if not ok: return False
                return True
            if closed(X) and closed(Y): return {'found': True, 'self_dual_signs': list(sg), 'ideals_commute': True, 'each_ideal_closed': True, 'dimension_each': 3}
    return {'found': False}

# ------------------------------------------------------------------------------------------------ exact polynomial fields in ns space-time variables
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
class Gauge:
    """vectors in the adjoint: lists of G polynomials"""
    def __init__(self, m, ns, g=F(3)):
        self.m, self.ns, self.g = m, ns, g; self.gens, self.idx, self.f = algebra(m); self.G = len(self.gens)
        self.eta = [1] + [-1] * (ns - 1); self.zero = [{} for _ in range(self.G)]
    def add(self, X, Y, c=1): return [padd(x, y, c) for x, y in zip(X, Y)]
    def br(self, X, Y):                                                        # [X, Y]^c = f_ab^c X^a Y^b
        r = [{} for _ in range(self.G)]
        for (a, b), d in self.f.items():
            if X[a] and Y[b]:
                p = pmul(X[a], Y[b])
                for c, v in d.items(): r[c] = padd(r[c], p, v)
        return r
    def d(self, X, mu): return [pder(x, mu) for x in X]
    def D(self, A, X, mu): return self.add(self.d(X, mu), self.br(A[mu], X), self.g)
    def Fmn(self, A, mu, nu):
        r = self.add(self.d(A[nu], mu), self.d(A[mu], nu), -1)
        return self.add(r, self.br(A[mu], A[nu]), self.g)
def rpoly(rng, ns, deg, density):
    mons = [e for e in itertools.product(range(deg + 1), repeat=ns) if sum(e) <= deg]
    return {e: F(rng.randint(-3, 3)) for e in mons if rng.random() < density} or {(0,) * ns: F(1)}
def identities(m, ns, seed):
    rng = random.Random(seed); Y = Gauge(m, ns); G = Y.G
    A = [[rpoly(rng, ns, 1, .6) for _ in range(G)] for _ in range(ns)]
    Fm = {(mu, nu): Y.Fmn(A, mu, nu) for mu in range(ns) for nu in range(ns)}
    for mu in range(ns): assert all(not p for p in Fm[(mu, mu)])
    for mu, nu in itertools.combinations(range(ns), 2): assert Y.add(Fm[(mu, nu)], Fm[(nu, mu)]) == Y.zero
    # Bianchi
    for l, mu, nu in itertools.combinations(range(ns), 3):
        t = Y.add(Y.add(Y.D(A, Fm[(mu, nu)], l), Y.D(A, Fm[(nu, l)], mu)), Y.D(A, Fm[(l, mu)], nu)); assert t == Y.zero, ('Bianchi', m, ns)
    # covariance under A -> A + D lambda, first order: dF = g [F, lambda]
    lam = [rpoly(rng, ns, 2, .5) for _ in range(G)]
    dA = [Y.D(A, lam, mu) for mu in range(ns)]
    for mu, nu in itertools.combinations(range(ns), 2):
        dF = Y.add(Y.add(Y.d(dA[nu], mu), Y.d(dA[mu], nu), -1), Y.add(Y.br(dA[mu], A[nu]), Y.br(A[mu], dA[nu])), Y.g)
        want = [pscale(p, Y.g) for p in Y.br(Fm[(mu, nu)], lam)]
        assert dF == want, ('covariance', m, ns)
    # equation D^m F_mn = J_n, and covariant conservation D^n J_n = 0
    Jn = []
    for nu in range(ns):
        s = Y.zero
        for mu in range(ns):
            if mu != nu: s = Y.add(s, Y.D(A, Fm[(mu, nu)], mu), Y.eta[mu])
        Jn.append(s)
    div = Y.zero
    for nu in range(ns): div = Y.add(div, Y.D(A, Jn[nu], nu), Y.eta[nu])
    # index placement: J_n = eta^{mm} D_m F_mn  (n lower); divergence eta^{nn} D_n J_n
    assert div == Y.zero, ('covariant conservation', m, ns)
    return {'bianchi': True, 'gauge_covariance_first_order': True, 'covariant_conservation': True}

# ------------------------------------------------------------------------------------------------ counts, by enumeration
def term_counts(m, ns):
    gens, idx, f = algebra(m); G = len(gens)
    ordered = {a: [(b, c) for (b, c), d in f.items() if a in d] for a in range(G)}
    quad = {len(v) for v in ordered.values()}; assert quad == {2 * (m - 2)} if m >= 2 else True
    comps = G * comb(ns, 2)
    deriv = sum(1 for a in range(G) for nu in range(ns) for mu in range(ns) if mu != nu)
    gauge = sum(1 for a in range(G) for nu in range(ns) for mu in range(ns) if mu != nu for (b, c) in ordered[a])
    tri = comb(ns, 3)
    bi_d = sum(1 for a in range(G) for t in range(tri) for _ in range(3))
    bi_g = sum(1 for a in range(G) for t in range(tri) for _ in range(3) for (b, c) in ordered[a])
    r = {'F_components': comps, 'quadratic_terms_per_F_component': 2 * (m - 2), 'equations': G * ns,
         'equation_derivative_terms': deriv, 'equation_gauge_terms': gauge, 'equation_terms': deriv + gauge,
         'bianchi_equations': G * tri, 'bianchi_derivative_terms': bi_d, 'bianchi_gauge_terms': bi_g, 'bianchi_terms': bi_d + bi_g}
    assert r['equation_terms'] == G * ns * (ns - 1) * (2 * m - 3) and r['bianchi_terms'] == G * tri * 3 * (2 * m - 3)
    return r

def build():
    out = {'ladder': {}, 'spacetime': {}, 'identities': {}, 'maxwell_reduction': {}}
    for m in range(2, 9):
        s = structure(m); t = term_counts(m, 4); out['ladder'][str(m)] = {**s, **t}
    for ns in range(2, 7): out['spacetime'][str(ns)] = {'m': 3, **term_counts(3, ns)}
    out['so4_split'] = so4_split(); assert out['so4_split']['found']
    for ns in range(2, 8):
        t = term_counts(2, ns); tot = t['equation_terms'] + t['bianchi_terms']
        assert tot == ns * comb(ns, 2), ('Maxwell', ns)
        out['maxwell_reduction'][str(ns)] = {'vector_terms': t['equation_terms'], 'bianchi_terms': t['bianchi_terms'], 'total': tot, 'equals_n_times_C_n_2': True}
    for (m, ns) in [(2, 3), (2, 4), (3, 3), (3, 4), (3, 5), (4, 4), (5, 4)]:
        out['identities']['%d,%d' % (m, ns)] = identities(m, ns, 1000 * m + ns)
    out['status'] = {
        'checked': ['structure constants of so(m) from the bit product for m = 2 to 8: antisymmetric, Jacobi exact, every index triple a closed so(3)',
                    'non-commuting pairs = 3 C(m,3), neighbours of each generator = 2(m-2)', 'so(4) splits into two commuting triples of generators',
                    'Bianchi identity, first-order gauge covariance and covariant conservation, exact, for (m, space-time dimension) = (2,3), (2,4), (3,3), (3,4), (3,5), (4,4), (5,4)',
                    'm = 2 reproduces the Maxwell incidences n C(n,2) for n = 2 to 7'],
        'standard': ['Yang-Mills field strength and equation; so(3) = su(2), so(4) = su(2) + su(2), so(6) = su(4) as dimensions and structure'],
        'ours': ['the gauge algebra read as the commutator graph of step 1: generators = demicube bivector vertices, non-commuting pairs = its 2-2 edges, closed triangles = index triples'],
        'open': ['matter fields charged under so(m): the coupling of step 3 is the abelian case only', 'the coupling constant g and the dynamics (no action, no solutions)', 'which gauge algebra, if any, the model uses']}
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    data = build(); js = json.dumps(data, sort_keys=True, indent=1)
    if a.write: open(a.write, 'w').write(js + '\n')
    if a.compare:
        old = json.load(open(a.compare)); assert old == json.loads(js), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL YANG-MILLS CHECKS PASS')
if __name__ == '__main__': main()
