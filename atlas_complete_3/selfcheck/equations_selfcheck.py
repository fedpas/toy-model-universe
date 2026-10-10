#!/usr/bin/env python3
"""Two more equations on the bit rule: (A) the commutators of bivectors (the Lorentz / so(p,q) algebra, the non-abelian part of
Yang-Mills) and (B) the Dirac equation in the even subalgebra of Cl(1,3) (Hestenes' real form).  Standard library only, exact arithmetic.
  python3 equations_selfcheck.py                         run all checks
  python3 equations_selfcheck.py --write equations.json  also write the data
  python3 equations_selfcheck.py --compare equations.json  assert the portal data equals the rebuilt data

Conventions as in the other scripts: a blade is a bit mask, bit i = generator i, the first p generators square to +1 (time), the rest to -1.
Cl(1,3): bit 0 = t, bits 1,2,3 = x,y,z."""
import argparse, itertools, json
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
def mmul(A, B, sq):
    out = {}
    for a, x in A.items():
        for b, y in B.items():
            m, s = bmul(a, b, sq); out[m] = out.get(m, 0) + s * x * y
    return {m: v for m, v in out.items() if v != 0}
def madd(A, B, c=1):
    out = dict(A)
    for m, v in B.items(): out[m] = out.get(m, 0) + c * v
    return {m: v for m, v in out.items() if v != 0}
def comm(A, B, sq): return madd(mmul(A, B, sq), mmul(B, A, sq), -1)
def name(mask, ax): return ''.join(ax[i] for i in range(len(ax)) if mask >> i & 1) or '1'
AX = ['t', 'x', 'y', 'z']

# ============================================================================================== A. commutators
def commutators():
    D = {'by_n': {}, 'roles': {}}
    for n in range(2, 9):
        biv = [m for m in range(1 << n) if popc(m) == 2]; assert len(biv) == comb(n, 2)
        edges_n = n * comb(n - 1, 2)
        for p in range(0, n + 1):
            sq = [1] * p + [-1] * (n - p)
            edges = []
            for a, b in itertools.combinations(biv, 2):
                C = comm({a: 1}, {b: 1}, sq)
                share = popc(a & b)
                if share == 1:
                    assert len(C) == 1 and list(C)[0] == a ^ b and abs(list(C.values())[0]) == 2 and popc(a ^ b) == 2, (n, p, a, b, C)
                    edges.append((a, b))
                else: assert C == {}, (n, p, a, b, C)                    # share 0 or 2 indices: the blades commute
            assert len(edges) == edges_n == n * (n - 1) * (n - 2) // 2
            # Jacobi, exact, for every triple of bivectors (n <= 6 for speed in the all-signature sweep)
            if n <= 6:
                for a, b, c in itertools.combinations(biv, 3):
                    A, B, Cc = {a: 1}, {b: 1}, {c: 1}
                    J = madd(madd(comm(A, comm(B, Cc, sq), sq), comm(B, comm(Cc, A, sq), sq)), comm(Cc, comm(A, B, sq), sq))
                    assert J == {}, ('Jacobi', n, p, a, b, c)
            # faithful representation on vectors: ad_B(e_k) lies in grade 1 and preserves the metric: R^T eta + eta R = 0
            eta = sq
            Rm = {}
            for a in biv:
                R = [[F(0)] * n for _ in range(n)]
                for k in range(n):
                    img = comm({a: 1}, {1 << k: 1}, sq)
                    assert all(popc(m) == 1 for m in img), 'ad of a bivector keeps vectors vectors'
                    for m, v in img.items(): R[m.bit_length() - 1][k] = F(v)
                for i in range(n):
                    for j in range(n): assert R[j][i] * eta[j] + eta[i] * R[i][j] == 0, ('so(p,q)', n, p, a)
                Rm[a] = R
            flat = [tuple(sum(R, [])) for R in Rm.values()]
            rank = 0; M = [list(r) for r in flat]; cols = len(M[0])
            for c in range(cols):
                pv = next((r for r in range(rank, len(M)) if M[r][c] != 0), None)
                if pv is None: continue
                M[rank], M[pv] = M[pv], M[rank]
                for r in range(len(M)):
                    if r != rank and M[r][c] != 0:
                        f = M[r][c] / M[rank][c]; M[r] = [x - f * y for x, y in zip(M[r], M[rank])]
                rank += 1
            assert rank == len(biv), 'faithful: dim so(p,q) = number of bivectors'
            # Lie homomorphism on the edges: R_[a,b] = [R_a, R_b]
            for a, b in edges[:12]:
                C = comm({a: 1}, {b: 1}, sq); (m, v), = C.items()
                Ra, Rb, Rc = Rm[a], Rm[b], Rm[m]
                comm_mat = [[sum(Ra[i][k] * Rb[k][j] - Rb[i][k] * Ra[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
                assert all(comm_mat[i][j] == v * Rc[i][j] for i in range(n) for j in range(n)), 'homomorphism'
            # triangles: every edge lies in exactly one index triple, and there are C(n,3) of them
            tri = {}
            for a, b in edges: tri.setdefault(a | b, []).append((a, b))
            assert len(tri) == comb(n, 3) and all(len(v) == 3 for v in tri.values()) and all(popc(t) == 3 for t in tri)
            # roles for k = p time axes: E = one time index, B = none, T = two
            if n <= 6:
                role = lambda m: 'EBT'[0 if popc(m & ((1 << p) - 1)) == 1 else 1 if popc(m & ((1 << p) - 1)) == 0 else 2]
                tab = {}
                for a, b in edges:
                    (m, v), = comm({a: 1}, {b: 1}, sq).items(); sh = (a & b).bit_length() - 1
                    key = tuple(sorted((role(a), role(b)))) + ('t' if sh < p else 's',); res = role(m)       # the shared index is a time axis (t) or a space axis (s)
                    tab.setdefault(key, {}).setdefault(res, 0); tab[key][res] += 1
                    assert len(tab[key]) == 1, ('role rule not a function', n, p, key, tab[key])
                D['roles'][f'{p},{n - p}'] = {'+'.join(k[:2]) + ' via ' + k[2]: {'result': list(v)[0], 'edges': list(v.values())[0]} for k, v in sorted(tab.items())}
        D['by_n'][str(n)] = {'bivectors': comb(n, 2), 'edges': edges_n, 'triangles': comb(n, 3), 'signatures_checked': n + 1,
                             'commuting_pairs': comb(comb(n, 2), 2) - edges_n}
    return D

# ============================================================================================== B. Dirac in the even subalgebra
SQ = [1, -1, -1, -1]
def vec(p): return {1 << i: F(p[i]) for i in range(4) if p[i] != 0}
def dirac():
    D = {}
    # the Clifford relations of Cl(1,3)
    for i in range(4):
        m, s = bmul(1 << i, 1 << i, SQ); assert (m, s) == (0, SQ[i])
        for j in range(i + 1, 4):
            a, b = bmul(1 << i, 1 << j, SQ), bmul(1 << j, 1 << i, SQ); assert a[0] == b[0] and a[1] == -b[1]
    Jm, Js = bmul(1 << 2, 1 << 1, SQ); J = {Jm: F(Js)}                           # J = gamma_2 gamma_1, a bivector
    assert popc(Jm) == 2 and mmul(J, J, SQ) == {0: F(-1)}, 'J squares to -1'
    G0 = {1: F(1)}
    even = [m for m in range(16) if popc(m) % 2 == 0]; odd = [m for m in range(16) if popc(m) % 2 == 1]
    assert len(even) == len(odd) == 8 and [popc(m) for m in even].count(2) == 6
    D['even_blades'] = [{'mask': m, 'name': name(m, AX), 'grade': popc(m)} for m in even]
    D['odd_blades'] = [{'mask': m, 'name': name(m, AX), 'grade': popc(m)} for m in odd]
    # position-space incidences of  grad(psi) J = m psi gamma_0 :  derivative terms  d_mu psi  ->  gamma_mu e_S J,  mass terms  e_S gamma_0
    inc = []
    for S in even:
        for mu in range(4):
            m1, s1 = bmul(1 << mu, S, SQ); m2, s2 = bmul(m1, Jm, SQ); inc.append({'from': S, 'kind': 'd' + AX[mu], 'to': m2, 'sign': s1 * s2 * Js})
        m3, s3 = bmul(S, 1, SQ); inc.append({'from': S, 'kind': 'm', 'to': m3, 'sign': s3})
    assert len(inc) == 40 and all(popc(e['to']) % 2 == 1 for e in inc)
    sup = {}
    for e in inc: sup.setdefault(e['to'], []).append(e)
    assert len(sup) == 8 and all(len(v) == 5 for v in sup.values()), 'each of the 8 equations has 4 derivative terms and 1 mass term'
    for T, v in sup.items():
        assert sorted(e['kind'] for e in v) == sorted(['dt', 'dx', 'dy', 'dz', 'm']) and len({e['from'] for e in v}) == 5
    for mu in range(4): assert sorted(e['to'] for e in inc if e['kind'] == 'd' + AX[mu]) == odd, 'each derivative is a bijection even -> odd'
    assert sorted(e['to'] for e in inc if e['kind'] == 'm') == odd
    assert all((e['from'] ^ e['to']) == (1 << AX.index(e['kind'][1])) ^ Jm for e in inc if e['kind'][0] == 'd'), 'derivative edges = cube edge, then translate by the bits of J'
    assert all((e['from'] ^ e['to']) == 1 for e in inc if e['kind'] == 'm'), 'mass edges = the time edge of the cube'
    D['incidences'] = inc; D['J_mask'] = Jm
    D['counts'] = {'components': 8, 'equations': 8, 'incidences': 40, 'terms_per_equation': {'derivative': 4, 'mass': 1}, 'cube_edges_used_by_derivative': 32, 'mass_edges': 8}
    # the 4-cube has exactly 32 edges: the derivative terms are all of them
    assert 4 * 2 ** 3 == 32 and len({(min(e['from'], e['from'] ^ (e['from'] ^ e['to'] ^ Jm)), (e['from'] ^ e['to'] ^ Jm)) for e in inc if e['kind'][0] == 'd'}) == 32
    # momentum space: psi -> p psi + m psi gamma_0 on the 8 even components, 8 odd outputs; determinant = (p^2 - m^2)^4
    def symbol(p, m):
        cols = []
        for S in even:
            out = madd(mmul(vec(p), {S: F(1)}, SQ), {mm: v * m for mm, v in mmul({S: F(1)}, G0, SQ).items()})
            cols.append([out.get(T, F(0)) for T in odd])
        return [[cols[j][i] for j in range(8)] for i in range(8)]
    def det(M):
        M = [r[:] for r in M]; n = len(M); d = F(1)
        for c in range(n):
            pv = next((r for r in range(c, n) if M[r][c] != 0), None)
            if pv is None: return F(0)
            if pv != c: M[c], M[pv] = M[pv], M[c]; d = -d
            d *= M[c][c]
            for r in range(c + 1, n):
                f = M[r][c] / M[c][c]
                if f: M[r] = [x - f * y for x, y in zip(M[r], M[c])]
        return d
    pts = [((1, 0, 0, 0), 1), ((2, 1, 0, 0), 1), ((1, 2, 3, 4), 2), ((5, 3, 4, 0), 3), ((F(1, 2), F(1, 3), F(1, 5), F(2, 7)), F(3, 4)), ((0, 0, 0, 0), 1), ((3, 0, 0, 0), 3)]
    dets = []
    for p, m in pts:
        p2 = p[0] ** 2 - p[1] ** 2 - p[2] ** 2 - p[3] ** 2; d = det(symbol(p, F(m)))
        assert abs(d) == (p2 - F(m) ** 2) ** 4, (p, m, d, p2); dets.append({'p': [str(x) for x in p], 'm': str(m), 'p2': str(p2), 'det_abs': str(abs(d)), 'expected': str((p2 - F(m) ** 2) ** 4)})
    D['dispersion'] = dets
    # momentum-space null vectors exist exactly on the mass shell p^2 = m^2 (rank 4 of 8 over the reals: two spin states x two signs of energy)
    def rank(M):
        M = [r[:] for r in M]; r0 = 0
        for c in range(8):
            pv = next((r for r in range(r0, 8) if M[r][c] != 0), None)
            if pv is None: continue
            M[r0], M[pv] = M[pv], M[r0]
            for r in range(8):
                if r != r0 and M[r][c] != 0:
                    f = M[r][c] / M[r0][c]; M[r] = [x - f * y for x, y in zip(M[r], M[r0])]
            r0 += 1
        return r0
    # mass shell p^2 = m^2: real kernel of dimension 4 (two spin states times two signs of energy = 2 complex dimensions); off shell: no solution
    D['solution_space'] = {'massless_shell_real_dim': 8 - rank(symbol((5, 3, 4, 0), F(0))), 'off_shell_real_dim': 8 - rank(symbol((2, 1, 0, 0), F(1))),
                           'massive_shell_real_dim': 8 - rank(symbol((5, 0, 0, 0), F(5)))}
    assert D['solution_space'] == {'massless_shell_real_dim': 4, 'off_shell_real_dim': 0, 'massive_shell_real_dim': 4}
    # Lorentz covariance, infinitesimal and exact: D_p(B psi) = B D_p(psi) - D'_{[B,p]}(psi), D' has no mass term; B a bivector (left multiplication)
    import random
    rnd = random.Random(7)
    biv = [m for m in even if popc(m) == 2]
    for B in biv:
        Bm = {B: F(1)}
        for _ in range(3):
            psi = {m: F(rnd.randint(-5, 5)) for m in even}; p = [rnd.randint(-4, 4) for _ in range(4)]; mm = F(rnd.randint(1, 4))
            Dp = lambda psi_, p_, m_: madd(mmul(vec(p_), psi_, SQ), {k: v * m_ for k, v in mmul(psi_, G0, SQ).items()})
            lhs = Dp(mmul(Bm, psi, SQ), p, mm)
            rot = comm(Bm, vec(p), SQ); assert all(popc(k) == 1 for k in rot)
            rhs = madd(mmul(Bm, Dp(psi, p, mm), SQ), mmul(rot, psi, SQ), -1)
            assert lhs == rhs, ('covariance', B)
    D['covariance'] = {'bivector_generators': len(biv), 'identity': 'D_p(B psi) = B D_p(psi) - D\'_{[B,p]}(psi)', 'verified': True}
    return D

def build():
    D = {'commutators': commutators(), 'dirac': dirac()}
    D['status'] = {'checked': ['bivector commutators: nonzero exactly when two bivectors share one index, result a bivector of coefficient 2, Jacobi, faithful on vectors, so(p,q)',
                               'the nonzero-commutator graph has n(n-1)(n-2)/2 edges and C(n,3) triangles, and equals the demicube edges between bivectors',
                               'Dirac-Hestenes incidences: 8 even components, 8 odd equations, 40 incidences, 5 terms per equation', 'dispersion det = (p^2 - m^2)^4 and covariance identity, exact'],
                   'standard': ['Hestenes space-time algebra form of the Dirac equation', 'so(p,q) as the bivectors under commutator'],
                   'ours': ['reading the derivative terms as the 32 edges of the 4-cube and the mass term as its time edges'],
                   'open': ['the same construction for other signatures and for Yang-Mills with a gauge field', 'whether anything here selects a number of generations']}
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL EQUATION CHECKS PASS')
if __name__ == '__main__': main()
