#!/usr/bin/env python3
"""Maxwell meets Dirac, one dimension at a time (n = 1 ... 8), exact arithmetic, standard library only.
  python3 coupling_selfcheck.py                          run all checks
  python3 coupling_selfcheck.py --write coupling.json    also write the data
  python3 coupling_selfcheck.py --compare coupling.json  assert the portal data equals the rebuilt data

The coupled system, for the even multivector psi, the vector potential A and the vector current X = psi gamma_0 psi~ :
    D := grad(psi) J - e A psi - m psi gamma_0 = 0          (Dirac, minimal coupling)       J = gamma_2 gamma_1, J^2 = -1
    grad(grad A) = e X                                      (Maxwell, F = grad A, Lorenz gauge)
Conventions as in the other scripts: blades are bit masks, bit 0 = time (squares +1), the other n-1 axes square to -1.
All fields are exact polynomials with Fraction coefficients, so every identity below is an identity, not a numerical test."""
import argparse, itertools, json, random
from fractions import Fraction as F
from math import comb

def popc(x): return bin(x).count('1')
def rsign(k): return -1 if (k * (k - 1) // 2) % 2 else 1                           # sign of reversion on a blade of grade k
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
def sqs(n, p=1): return [1] * p + [-1] * (n - p)

# ------------------------------------------------------------------------------------------------ exact polynomial fields
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
def fadd(A, B, c=1):
    r = dict(A)
    for m, p in B.items():
        x = padd(r.get(m, {}), p, c)
        if x: r[m] = x
        else: r.pop(m, None)
    return r
def fmul(A, B, sq):
    r = {}
    for a, pa in A.items():
        for b, pb in B.items():
            m, s = bmul(a, b, sq); x = padd(r.get(m, {}), pmul(pa, pb), s)
            if x: r[m] = x
            else: r.pop(m, None)
    return r
def frev(A): return {m: pscale(p, rsign(popc(m))) for m, p in A.items()}
def fgrade(A, k): return {m: p for m, p in A.items() if popc(m) == k}
def fpoly(A, e): return {m: q for m, p in A.items() for q in [pmul(p, e)] if q}
def fder(A, i): return {m: q for m, p in A.items() for q in [pder(p, i)] if q}
def nabla(A, sq):
    n = len(sq); out = {}; one = {(0,) * n: F(1)}
    for mu in range(n): out = fadd(out, fmul({1 << mu: one}, fder(A, mu), sq))
    return out
def const(m, c, n): return {m: {(0,) * n: F(c)}}
def rpoly(rng, n, deg, density=.5):
    mons = [e for e in itertools.product(range(deg + 1), repeat=n) if sum(e) <= deg]
    return {e: F(rng.randint(-3, 3)) for e in mons if rng.random() < density } or {(0,) * n: F(1)}
def clean(p): return {k: v for k, v in p.items() if v != 0}

# ------------------------------------------------------------------------------------------------ the current psi gamma psi~ : which blades, which pairs of corners
def current_structure(n, p, gam=0):
    sq = sqs(n, p); ev = [m for m in range(1 << n) if popc(m) % 2 == 0]; coef = {}
    for S in ev:
        m1, s1 = bmul(S, 1 << gam, sq)
        for T in ev:
            m2, s2 = bmul(m1, T, sq); coef.setdefault(m2, {})[(S, T)] = s1 * s2 * rsign(popc(T))
    surv = {}
    for blade, d in coef.items():
        mon = {}
        for (S, T), c in d.items():
            key = (min(S, T), max(S, T)); mon[key] = mon.get(key, 0) + c
        nz = {k: v for k, v in mon.items() if v != 0}
        if nz: surv[blade] = nz
    return surv

def ladder_row(n):
    p = 1; sq = sqs(n, p); row = {'n': n, 'signature': '1+%d' % (n - 1)}
    even_alg = cell(0, 0) if n == 1 else cell(1, n - 2)
    row['algebra'] = cell(1, n - 1); row['even_half'] = even_alg
    row['psi_components'] = 2 ** (n - 1); row['dirac_real_dim'] = 2 ** (n // 2 + 1)
    row['psi_over_dirac'] = str(F(2 ** (n - 1), 2 ** (n // 2 + 1)))
    # Maxwell side
    row['F_components'] = comb(n, 2); row['maxwell_incidences'] = n * comb(n, 2)
    # a complex structure inside the even half: a bivector that squares to -1 and commutes with gamma_0
    biv = [m for m in range(1 << n) if popc(m) == 2]
    J = [m for m in biv if bmul(m, m, sq) == (0, -1) and bmul(m, 1, sq) == bmul(1, m, sq)]
    row['J_exists'] = bool(J); row['J_count'] = len(J)
    # the current
    surv = current_structure(n, p)
    grades = sorted({popc(b) for b in surv}); assert all(g % 4 == 1 for g in grades), ('grades of psi gamma psi~', n, grades)
    row['current_grades'] = grades; row['current_blades'] = {str(g): sum(1 for b in surv if popc(b) == g) for g in grades}
    row['current_monomials'] = {str(g): sum(len(v) for b, v in surv.items() if popc(b) == g) for g in grades}
    dist = {}
    for b, v in surv.items():
        for S, T in v: dist.setdefault(popc(b), set()).add(popc(S ^ T))
    row['pair_distance'] = {str(g): sorted(d) for g, d in sorted(dist.items())}
    assert row['pair_distance'].get('1', []) in ([0], [0, 2], [2], []) and all(d in (4, 6) for d in dist.get(5, []))
    # density: coefficient of gamma_0 comes from S = T only; positive definite?
    rho = surv[1]; assert all(S == T for S, T in rho)
    row['rho_terms'] = len(rho); row['rho_positive_definite'] = all(c > 0 for c in rho.values())
    # vector components: pairs of corners differ by exactly the bits {0,k}: a demicube edge
    comp = {}
    for k in range(1, n):
        v = surv.get(1 << k, {}); assert all((S ^ T) == (1 | (1 << k)) for S, T in v)
        comp[str(k)] = len(v)
    row['edge_terms_per_spatial_component'] = comp
    row['demicube_edges_of_type_0k'] = 2 ** (n - 2) if n >= 2 else 0
    # all signatures: when is the density positive definite?
    pos = []
    for pp in range(0, n + 1):
        s2 = current_structure(n, pp) if n <= 6 else None
        if s2 is not None and all(c > 0 for c in s2[1].values()): pos.append(pp)
    row['rho_positive_definite_for_p'] = pos if n <= 6 else None
    # minimal coupling and the Dirac incidences (n >= 3: the form with J)
    ev = [m for m in range(1 << n) if popc(m) % 2 == 0]; od = [m for m in range(1 << n) if popc(m) % 2 == 1]
    row['even_corners'] = len(ev); row['odd_corners'] = len(od)
    row['coupling_edges'] = n * len(ev)                                             # A_k psi_S -> blade S xor k : every cube edge, once
    for k in range(n): assert sorted(S ^ (1 << k) for S in ev) == od, 'A_k psi is odd: a bijection even -> odd'
    row['mass_edges'] = len(ev)
    if row['J_exists']:
        Jm = 6; assert Jm in J
        row['derivative_edges'] = n * len(ev)
        row['incidences_total'] = (2 * n + 1) * len(ev)
        # the coupling terms of equation T are the n even neighbours of T: its corner simplex; the mass term is one of them
        for T in od:
            nb = {T ^ (1 << k) for k in range(n)}; assert all(popc(x) % 2 == 0 for x in nb) and len(nb) == n
            assert (T ^ 1) in nb
            assert {T ^ (1 << k) ^ Jm for k in range(n)} == {x ^ Jm for x in nb}
        row['coupling_terms_are_corner_simplex'] = True
    else:
        row['derivative_edges'] = None; row['incidences_total'] = None; row['coupling_terms_are_corner_simplex'] = None
    row['even_labels'] = ev if n <= 5 else None
    row['gamma0_label'] = 1; row['J_label'] = 6 if row['J_exists'] else None
    return row

# ------------------------------------------------------------------------------------------------ exact identities with polynomial fields
def identities(n, seed):
    rng = random.Random(seed); sq = sqs(n); Jm, Js = bmul(1 << 2, 1 << 1, sq); Jf = {Jm: {(0,) * n: F(Js)}}; g0 = const(1, 1, n)
    assert fmul(Jf, Jf, sq) == const(0, -1, n), 'J^2 = -1'
    ev = [m for m in range(1 << n) if popc(m) % 2 == 0]
    psi = {S: rpoly(rng, n, 2, .35) for S in ev}; A = {1 << k: rpoly(rng, n, 1, .6) for k in range(n)}
    e, m = F(3), F(5)
    X = fmul(fmul(psi, g0, sq), frev(psi), sq)
    Dterm = fadd(fadd(fmul(nabla(psi, sq), Jf, sq), fmul(A, psi, sq), -e), fmul(psi, g0, sq), -m)
    assert all(popc(k) % 2 == 1 for k in Dterm), 'every term of the Dirac equation is odd'
    # (1) conservation: div X = -2 < gamma_0 psi~ D J >_0   for ALL psi, A  (so div X = 0 on every solution of D = 0)
    lhs = nabla(X, sq).get(0, {})
    rhs = pscale(fmul(fmul(fmul(g0, frev(psi), sq), Dterm, sq), Jf, sq).get(0, {}), -2)
    assert clean(lhs) == clean(rhs), ('conservation identity', n)
    # (1a) the two algebraic facts behind it
    assert fmul(fmul(fmul(g0, frev(psi), sq), fmul(A, psi, sq), sq), Jf, sq).get(0, {}) == {}, '< gamma_0 psi~ A psi J >_0 = 0'
    assert fmul(fmul(frev(psi), psi, sq), Jf, sq).get(0, {}) == {}, '< psi~ psi J >_0 = 0'
    # (2) gauge invariance to first order: psi -> psi (1 + J eps), A -> A - grad(eps)/e  gives  delta D = (D J) eps
    eps = rpoly(rng, n, 2, .4); eps = {k: v for k, v in eps.items()}
    dpsi = fpoly(fmul(psi, Jf, sq), eps); dA = {mm: pscale(p, -1 / e) for mm, p in nabla({0: eps}, sq).items()}
    dD = fadd(fadd(fadd(fmul(nabla(dpsi, sq), Jf, sq), fmul(A, dpsi, sq), -e), fmul(dA, psi, sq), -e), fmul(dpsi, g0, sq), -m)
    assert dD == fpoly(fmul(Dterm, Jf, sq), eps), ('gauge invariance', n)
    # (3) Maxwell consistency: div of the vector part of grad F vanishes for every bivector field F
    Fb = {mm: rpoly(rng, n, 2, .5) for mm in range(1 << n) if popc(mm) == 2}
    G = nabla(Fb, sq); assert nabla(fgrade(G, 1), sq).get(0, {}) == {} and nabla(G, sq).get(0, {}) == {}, 'div J = 0 is forced by grad F = J'
    return {'conservation_identity': True, 'algebraic_facts': True, 'gauge_first_order': True, 'maxwell_forces_div_J_zero': True}

# ------------------------------------------------------------------------------------------------ the Dirac symbol: real kernel on the mass shell
def kernel_dim(n, m=1):
    sq = sqs(n); ev = [mm for mm in range(1 << n) if popc(mm) % 2 == 0]; od = [mm for mm in range(1 << n) if popc(mm) % 2 == 1]
    p = [m] + [0] * (n - 1)
    cols = []
    for S in ev:
        out = {}
        for i in range(n):
            if p[i]:
                t, s = bmul(1 << i, S, sq); out[t] = out.get(t, 0) + s * p[i]
        t, s = bmul(S, 1, sq); out[t] = out.get(t, 0) + s * m
        cols.append([F(out.get(T, 0)) for T in od])
    M = [[cols[j][i] for j in range(len(ev))] for i in range(len(od))]; rank = 0
    for c in range(len(ev)):
        pv = next((r for r in range(rank, len(M)) if M[r][c] != 0), None)
        if pv is None: continue
        M[rank], M[pv] = M[pv], M[rank]
        for r in range(len(M)):
            if r != rank and M[r][c] != 0:
                f = M[r][c] / M[rank][c]; M[r] = [x - f * y for x, y in zip(M[r], M[rank])]
        rank += 1
    return len(ev) - rank

def build():
    D = {'ladder': {}, 'identities': {}, 'shell': {}}
    for n in range(1, 9): D['ladder'][str(n)] = ladder_row(n)
    L = D['ladder']
    assert [L[str(n)]['J_exists'] for n in range(1, 9)] == [False, False, True, True, True, True, True, True]
    assert [L[str(n)]['current_grades'] for n in range(1, 9)] == [[1], [1], [1], [1], [1, 5], [1, 5], [1, 5], [1, 5]]
    assert all(L[str(n)]['rho_positive_definite'] for n in range(1, 9)), 'for 1 time + (n-1) space the density is a sum of squares'
    assert [L[str(n)]['psi_over_dirac'] for n in range(1, 9)] == ['1/2', '1/2', '1', '1', '2', '2', '4', '4']
    assert [L[str(n)]['incidences_total'] for n in range(3, 9)] == [(2 * n + 1) * 2 ** (n - 1) for n in range(3, 9)]
    for n in (3, 4, 5): D['identities'][str(n)] = identities(n, 100 + n)
    for n in range(3, 8): D['shell'][str(n)] = {'kernel_real_dim': kernel_dim(n), 'half_of_psi': 2 ** (n - 2), 'one_dirac_spinor': 2 ** (n // 2)}
    assert all(v['kernel_real_dim'] == v['half_of_psi'] for v in D['shell'].values())
    D['status'] = {'checked': ['grades of psi gamma psi~ for every n up to 8: only grade 1 up to n=4, grades 1 and 5 from n=5', 'the vector part of the current is built from corners and demicube edges of type {0,k}',
                               'density = sum of squares for 1 time + (n-1) space', 'conservation identity div X = -2 <gamma_0 psi~ D J>_0 exactly for n = 3, 4, 5',
                               'first-order gauge invariance, Maxwell forcing div J = 0, minimal coupling = the n cube edges at each corner', 'solution space on the mass shell = half of psi, which is one Dirac spinor only at n = 3, 4'],
                   'standard': ['Hestenes / Doran-Lasenby form of the Dirac-Maxwell system', 'spinor dimensions 2^(floor(n/2)) complex'],
                   'ours': ['reading the coupling terms as the corner simplex of each equation'],
                   'open': ['the sign and size of the source term e X, which come from an action principle we have not rebuilt', 'n = 1, 2: no complex structure J inside the even half, so no charged field; a neutral (Majorana) form was not built', 'Yang-Mills with a non-abelian gauge field']}
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL COUPLING CHECKS PASS')
if __name__ == '__main__': main()
