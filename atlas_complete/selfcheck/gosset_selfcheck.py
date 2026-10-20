#!/usr/bin/env python3
"""The Gosset series E6, E7, E8 (and E9, E10) rebuilt from the Cartan matrices with exact arithmetic.  Standard library only.
  python3 gosset_selfcheck.py                         run all checks
  python3 gosset_selfcheck.py --write gosset.json     also write the data
  python3 gosset_selfcheck.py --compare gosset.json   assert the portal data equals the rebuilt data

Conventions.  Nodes follow Bourbaki: a chain 1-3-4-5-...-n and one extra node 2 attached to node 4.  E3 = A2 x A1, E4 = A4, E5 = D5.
A root is a vector of integer coordinates in the simple-root basis.  A weight is a vector of Dynkin labels.
The Gosset polytope of E_n is the Weyl orbit of the fundamental weight of node n (the end of the long arm); its vertices are
16, 27, 56, 240 for n = 5, 6, 7, 8.  Everything is integer or Fraction arithmetic; floats appear only in the Coxeter-plane drawing."""
import argparse, json, math
from fractions import Fraction as F
from itertools import product

# ------------------------------------------------------------------------------------------------ linear algebra
def cartan(n):
    A = [[0] * n for _ in range(n)]
    for i in range(n): A[i][i] = 2
    ed = [(1, 3)] + [(k, k + 1) for k in range(3, n)] + [(2, 4)]
    for a, b in ed:
        if a <= n and b <= n: A[a - 1][b - 1] = A[b - 1][a - 1] = -1
    return A
def det(A):
    M = [[F(x) for x in r] for r in A]; n = len(M); d = F(1)
    for c in range(n):
        p = next((r for r in range(c, n) if M[r][c] != 0), None)
        if p is None: return F(0)
        if p != c: M[c], M[p] = M[p], M[c]; d = -d
        d *= M[c][c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            if f: M[r] = [x - f * y for x, y in zip(M[r], M[c])]
    return d
def inertia(A):
    """(positive, negative, zero) of a symmetric rational matrix by exact congruence elimination"""
    M = [[F(x) for x in r] for r in A]; n = len(M); pos = neg = 0; live = list(range(n))
    while live:
        k = next((i for i in live if M[i][i] != 0), None)
        if k is None:
            pr = next(((i, j) for i in live for j in live if i != j and M[i][j] != 0), None)
            if pr is None: return pos, neg, len(live)
            i, j = pr
            for t in range(n): M[i][t] += M[j][t]
            for t in range(n): M[t][i] += M[t][j]
            k = i
        piv = M[k][k]
        if piv > 0: pos += 1
        else: neg += 1
        for r in live:
            if r != k and M[r][k] != 0:
                f = M[r][k] / piv
                for t in range(n): M[r][t] -= f * M[k][t]
        for r in live:
            if r != k and M[k][r] != 0:
                for t in range(n): M[t][r] -= M[t][k] * (M[k][r] / piv)
        live.remove(k)
    return pos, neg, 0
def null_vector(A):
    n = len(A); M = [[F(x) for x in r] for r in A]; piv = []; r = 0
    for c in range(n):
        p = next((i for i in range(r, n) if M[i][c] != 0), None)
        if p is None: continue
        M[r], M[p] = M[p], M[r]; M[r] = [x / M[r][c] for x in M[r]]
        for i in range(n):
            if i != r and M[i][c] != 0:
                f = M[i][c]; M[i] = [x - f * y for x, y in zip(M[i], M[r])]
        piv.append(c); r += 1
    free = [c for c in range(n) if c not in piv]; assert len(free) == 1
    v = [F(0)] * n; v[free[0]] = F(1)
    for i, c in enumerate(piv): v[c] = -M[i][free[0]]
    m = math.lcm(*[x.denominator for x in v]); v = [int(x * m) for x in v]; g = math.gcd(*v)
    v = [x // g for x in v]; return v if v[0] > 0 else [-x for x in v]
def adjugate_int(A):
    n = len(A); d = det(A); assert d != 0
    cols = []
    for j in range(n):
        # solve A x = d e_j exactly
        M = [[F(A[i][k]) for k in range(n)] + [F(d if i == j else 0)] for i in range(n)]
        for c in range(n):
            p = next(r for r in range(c, n) if M[r][c] != 0); M[c], M[p] = M[p], M[c]; M[c] = [x / M[c][c] for x in M[c]]
            for r in range(n):
                if r != c and M[r][c] != 0:
                    f = M[r][c]; M[r] = [x - f * y for x, y in zip(M[r], M[c])]
        x = [M[i][n] for i in range(n)]; assert all(t.denominator == 1 for t in x); cols.append([int(t) for t in x])
    return [[cols[j][i] for j in range(n)] for i in range(n)], int(d)          # Ainv * det, det

# ------------------------------------------------------------------------------------------------ roots and weights
def roots(A, cap=None):
    """all roots by closing the simple roots under the simple reflections (root coordinates)"""
    n = len(A); seen = set(); stack = []
    for i in range(n):
        v = tuple(1 if j == i else 0 for j in range(n)); seen.add(v); stack.append(v)
    while stack:
        v = stack.pop()
        for i in range(n):
            t = sum(v[j] * A[j][i] for j in range(n)); w = list(v); w[i] -= t; w = tuple(w)
            if w not in seen:
                seen.add(w); stack.append(w)
                if cap and len(seen) > cap: return None
    return sorted(seen)
def orbit(A, lab):
    n = len(A); start = tuple(lab); seen = {start}; stack = [start]
    while stack:
        l = stack.pop()
        for i in range(n):
            if l[i]:
                w = tuple(l[j] - l[i] * A[i][j] for j in range(n))
                if w not in seen: seen.add(w); stack.append(w)
    return sorted(seen)
def height(v): return sum(v)

# ------------------------------------------------------------------------------------------------ graphs
def graph_iso(adj1, adj2):
    """backtracking isomorphism of two simple graphs given as dicts vertex -> set"""
    V1, V2 = sorted(adj1), sorted(adj2)
    if len(V1) != len(V2) or sum(map(len, adj1.values())) != sum(map(len, adj2.values())): return False
    def sig(adj, v): return (len(adj[v]), tuple(sorted(len(adj[u]) for u in adj[v])))
    s1 = {v: sig(adj1, v) for v in V1}; s2 = {v: sig(adj2, v) for v in V2}
    if sorted(s1.values()) != sorted(s2.values()): return False
    order = [V1[0]]; rest = set(V1[1:])
    while rest:
        nxt = max(rest, key=lambda v: sum(1 for u in adj1[v] if u in order)); order.append(nxt); rest.discard(nxt)
    mp, used = {}, set()
    def rec(i):
        if i == len(order): return True
        v = order[i]
        for w in V2:
            if w in used or s2[w] != s1[v]: continue
            ok = True
            for u in order[:i]:
                if (u in adj1[v]) != (mp[u] in adj2[w]): ok = False; break
            if ok:
                mp[v] = w; used.add(w)
                if rec(i + 1): return True
                del mp[v]; used.discard(w)
        return False
    return rec(0)

# ------------------------------------------------------------------------------------------------ the E8 coordinates (Bourbaki)
H = F(1, 2)
def e8_simple():
    S = []
    S.append([H, -H, -H, -H, -H, -H, -H, H])                       # a1 = 1/2 (e1 + e8 - e2 - ... - e7)
    S.append([1, 1, 0, 0, 0, 0, 0, 0])                              # a2 = e1 + e2
    for k in range(2, 8):                                           # a3 = e2 - e1, a4 = e3 - e2, ..., a8 = e7 - e6
        v = [0] * 8; v[k - 1] = 1; v[k - 2] = -1; S.append(v)
    return [[F(x) for x in r] for r in S]
def to_coords(S, c):
    return [sum(c[i] * S[i][t] for i in range(len(c))) for t in range(8)]

# ------------------------------------------------------------------------------------------------ Coxeter plane (floats only here)
def matmul(X, Y):
    n = len(X); return [[sum(X[i][k] * Y[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
def refl_matrix(A, i):
    n = len(A); M = [[1 if r == c else 0 for c in range(n)] for r in range(n)]       # acts on column vectors of root coordinates
    for j in range(n): M[i][j] -= A[j][i]
    return M
def coxeter_matrix(A):
    n = len(A); C = [[1 if r == c else 0 for c in range(n)] for r in range(n)]
    for i in range(n): C = matmul(C, refl_matrix(A, i))
    return C
def order(C):
    n = len(C); I = [[1 if r == c else 0 for c in range(n)] for r in range(n)]; P = C; k = 1
    while P != I: P = matmul(P, C); k += 1
    return k
def apply(C, v): return tuple(sum(C[i][j] * v[j] for j in range(len(v))) for i in range(len(v)))
def coxeter_plane(A, R, h, C):
    n = len(A); z = complex(math.cos(2 * math.pi / h), math.sin(2 * math.pi / h)); u = [1.0 + 0.37 * i for i in range(n)]
    CT = [[C[j][i] for j in range(n)] for i in range(n)]; w = [0j] * n; cur = list(u)
    for k in range(h):
        for t in range(n): w[t] += (z ** (-k)) * cur[t]
        cur = [sum(CT[i][j] * cur[j] for j in range(n)) for i in range(n)]
    sc = max(abs(x) for x in w); assert sc > 1e-6
    out = []
    for v in R:
        f = sum(w[t] * v[t] for t in range(n)); out.append(f)
    return out

# ------------------------------------------------------------------------------------------------ the checks
def series():
    D = {'rank': {}}
    tpq = {}
    for n in range(3, 11):
        A = cartan(n); d = det(A); pos, neg, zero = inertia(A)
        arms = (2, 3, n - 3) if n >= 4 else None
        rec = {'n': n, 'det': int(d), 'inertia': [pos, neg, zero], 'definite': (pos == n)}
        assert d == 9 - n, (n, d)
        if arms:
            s = F(1, arms[0]) + F(1, arms[1]) + F(1, arms[2]); rec['arms'] = list(arms); rec['arm_sum'] = str(s)
            assert d == arms[0] * arms[1] * arms[2] * (s - 1)                  # det = p q r (1/p + 1/q + 1/r - 1)
            assert (s > 1) == (pos == n) and (s == 1) == (zero == 1) and (s < 1) == (neg >= 1)
        if n <= 8: rec['roots'] = len(roots(A))
        else: rec['roots'] = None; rec['roots_exceed_1000'] = roots(A, cap=1000) is None
        D['rank'][str(n)] = rec
    assert [D['rank'][str(n)]['roots'] for n in range(3, 9)] == [8, 20, 40, 72, 126, 240]
    assert all(D['rank'][str(n)]['definite'] for n in range(3, 9))
    assert D['rank']['9']['inertia'] == [8, 0, 1] and D['rank']['10']['inertia'] == [9, 1, 0]
    assert not D['rank']['9']['definite'] and not D['rank']['10']['definite']
    D['rank']['9']['null_vector'] = null_vector(cartan(9))                       # the marks of the affine node: 2 3 4 6 5 4 3 2 1
    D['rank']['9']['null_vector'] = null_vector(cartan(9))
    A9 = cartan(9); nv = D['rank']['9']['null_vector']
    assert all(sum(A9[i][j] * nv[j] for j in range(9)) == 0 for i in range(9))
    assert roots(A9, cap=1000) is None, 'E9 must have infinitely many roots'
    assert roots(cartan(10), cap=1000) is None
    # --- roots, Weyl orbits and Gosset polytopes
    RT = {}; P = {}; wchain = {5: 120}
    graphs = {}
    for n in (5, 6, 7, 8):
        A = cartan(n); R = roots(A); RT[n] = R
        assert len(R) == {5: 40, 6: 72, 7: 126, 8: 240}[n]
        neg = [r for r in R if all(x <= 0 for x in r)]; assert len(neg) == len(R) // 2
        lab = tuple(1 if j == n - 1 else 0 for j in range(n)); O = orbit(A, lab)
        Ai, d0 = adjugate_int(A)
        W = [[sum(Ai[i][j] * o[j] for j in range(n)) for i in range(n)] for o in O]       # d0 * A^-1 * label
        norm2 = sum(O[0][i] * W[0][i] for i in range(n))                                  # d0 * |lambda|^2
        assert all(sum(O[k][i] * W[k][i] for i in range(n)) == norm2 for k in range(len(O)))
        adj = {k: set() for k in range(len(O))}; ipvals = {}
        for a in range(len(O)):
            for b in range(a + 1, len(O)):
                ip = sum(O[a][i] * W[b][i] for i in range(n)); ipvals[ip] = ipvals.get(ip, 0) + 1
                if 2 * norm2 - 2 * ip == 2 * d0: adj[a].add(b); adj[b].add(a)               # |l - m|^2 = 2: the difference is a root
        deg = sorted({len(v) for v in adj.values()}); assert len(deg) == 1
        edges = sum(len(v) for v in adj.values()) // 2
        graphs[n] = (adj, O)
        wchain[n] = len(O) * wchain[n - 1] if n > 5 else 1920
        P[n] = {'vertices': len(O), 'edges': edges, 'degree': deg[0], 'norm': str(F(norm2, d0)), 'inner_products': {str(F(k, d0)): v for k, v in sorted(ipvals.items())}}
    assert (P[5]['vertices'], P[6]['vertices'], P[7]['vertices'], P[8]['vertices']) == (16, 27, 56, 240)
    assert (P[5]['edges'], P[6]['edges'], P[7]['edges'], P[8]['edges']) == (80, 216, 756, 6720)
    assert (P[5]['degree'], P[6]['degree'], P[7]['degree'], P[8]['degree']) == (10, 16, 27, 56)
    assert (wchain[6], wchain[7], wchain[8]) == (51840, 2903040, 696729600), wchain       # orbit-stabiliser chain reproduces the Weyl group orders
    # --- vertex figures: the neighbours of a vertex of E_n's polytope form the previous polytope
    def sub(adj, ids): s = set(ids); return {v: adj[v] & s for v in ids}
    demi5 = {v: {u for u in range(32) if bin(u).count('1') % 2 == 0 and bin(u ^ v).count('1') == 2} for v in range(32) if bin(v).count('1') % 2 == 0}
    tri5 = {}
    pairs = [(a, b) for a in range(5) for b in range(a + 1, 5)]
    for p in pairs: tri5[p] = {q for q in pairs if len(set(p) & set(q)) == 1}
    prev = {5: tri5, 6: demi5, 7: graphs[6][0], 8: graphs[7][0]}
    names = {5: 'rectified 4-simplex (triangular graph T(5))', 6: '5-demicube', 7: 'the polytope of E6', 8: 'the polytope of E7'}
    for n in (5, 6, 7, 8):
        adj, O = graphs[n]; nb = sorted(adj[0]); ok = graph_iso(sub(adj, nb), prev[n]); assert ok, n
        P[n]['vertex_figure'] = {'vertices': len(nb), 'is': names[n], 'isomorphic': True}
    # the polytope of E5 is the 5-demicube: its graph is the even-weight half cube
    assert graph_iso(graphs[5][0], demi5)
    P[5]['is_the_5_demicube'] = True
    # --- E8 in orthonormal coordinates: 112 edges of the 8-orthoplex + 128 vertices of the 8-demicube
    S = e8_simple(); G = [[sum(S[i][t] * S[j][t] for t in range(8)) for j in range(8)] for i in range(8)]
    assert [[int(x) for x in r] for r in G] == cartan(8), 'Bourbaki simple roots do not reproduce the Cartan matrix'
    R8 = RT[8]; co = {r: to_coords(S, r) for r in R8}
    edge8, demi8 = [], []
    for r in R8:
        c = co[r]
        if all(x.denominator == 1 for x in c):
            assert sorted(abs(x) for x in c) == [0] * 6 + [1, 1]; edge8.append(r)
        else:
            assert all(abs(x) == H for x in c) and sum(1 for x in c if x < 0) % 2 == 0; demi8.append(r)
    assert (len(edge8), len(demi8)) == (112, 128)
    assert len({tuple(1 if x > 0 else 0 for x in co[r]) for r in demi8}) == 128
    top = max(R8, key=height); assert [x for x in co[top]] == [0] * 6 + [1, 1]       # highest root = e7 + e8
    # E7: roots with no alpha8 (= perpendicular to the highest root); E6: no alpha7, alpha8
    def split(Rsub, nfree):
        e = o = x = 0; heads = set()
        for r in Rsub:
            c = co[tuple(r) + (0,) * (8 - len(r))]
            if all(t.denominator == 1 for t in c):
                supp = [i for i in range(8) if c[i] != 0]
                if max(supp) < nfree: e += 1
                else: x += 1
            else: o += 1; heads.add(tuple(1 if t > 0 else 0 for t in c[:nfree]))
        return {'orthoplex_edges_inside_first_%d_axes' % nfree: e, 'demicube_vertices': o, 'other_orthoplex_edges': x, 'sign_patterns_on_first_%d_axes' % nfree: len(heads)}
    E7 = [tuple(r) + (0,) for r in RT[7]]; E6 = [tuple(r) + (0, 0) for r in RT[6]]
    assert len(E7) == 126 and all(r in co for r in E7) and len(E6) == 72 and all(r in co for r in E6)
    perp_top = [r for r in R8 if sum(co[r][t] * co[top][t] for t in range(8)) == 0]; assert sorted(perp_top) == sorted(E7)
    sp7, sp6 = split(E7, 6), split(E6, 5)
    assert sp7 == {'orthoplex_edges_inside_first_6_axes': 60, 'demicube_vertices': 64, 'other_orthoplex_edges': 2, 'sign_patterns_on_first_6_axes': 32}, sp7
    assert sp6 == {'orthoplex_edges_inside_first_5_axes': 40, 'demicube_vertices': 32, 'other_orthoplex_edges': 0, 'sign_patterns_on_first_5_axes': 32}, sp6
    sp8 = split(R8, 7); assert sp8 == {'orthoplex_edges_inside_first_7_axes': 84, 'demicube_vertices': 128, 'other_orthoplex_edges': 28, 'sign_patterns_on_first_7_axes': 128}, sp8
    split8 = {'orthoplex_edges': 112, 'demicube_vertices': 128}
    # --- E8 -> E6 x A2: roots sorted by their A2 weight
    perp6 = [r for r in R8 if all(sum(co[r][t] * S[i][t] for t in range(8)) == 0 for i in range(6))]
    assert len(perp6) == 6                                                                  # the commutant A2
    a2 = sorted(perp6, key=height)                                                           # the six roots of the A2
    s1, s2 = None, None
    for x in a2:
        for y in a2:
            if sum(co[x][t] * co[y][t] for t in range(8)) == -1: s1, s2 = x, y; break
        if s1: break
    cls = {}
    for r in R8:
        key = (int(sum(co[r][t] * co[s1][t] for t in range(8))), int(sum(co[r][t] * co[s2][t] for t in range(8))))
        cls.setdefault(key, []).append(r)
    sizes = sorted((len(v) for v in cls.values()), reverse=True); assert sizes == [72] + [27] * 6 + [1] * 6, sizes
    O1 = set(orbit(cartan(6), (1, 0, 0, 0, 0, 0))); O6 = set(orbit(cartan(6), (0, 0, 0, 0, 0, 1))); assert len(O1) == len(O6) == 27 and not (O1 & O6)
    kinds = {'27': 0, '27bar': 0}
    for key, v in cls.items():
        if len(v) == 27:
            lab = {tuple(int(sum(co[r][t] * S[i][t] for t in range(8))) for i in range(6)) for r in v}
            assert lab == O1 or lab == O6; kinds['27' if lab == O1 else '27bar'] += 1
    assert kinds == {'27': 3, '27bar': 3}
    branching = {'E6_roots': 72, 'A2_roots': 6, 'classes_of_27': 6, 'copies_of_27': 3, 'copies_of_27bar': 3, 'total': 72 + 6 + 6 * 27}
    assert branching['total'] == 240
    # --- Coxeter plane
    cox = {}
    for n in (6, 7, 8):
        A = cartan(n); C = coxeter_matrix(A); h = order(C); assert h == {6: 12, 7: 18, 8: 30}[n]
        R = RT[n]; assert len(R) == n * h
        seen, rings = set(), []
        for r in R:
            if r in seen: continue
            orb = [r]; v = apply(C, r)
            while v != r: orb.append(v); v = apply(C, v)
            assert len(orb) == h; seen.update(orb); rings.append(orb)
        assert len(rings) == n
        f = dict(zip(R, coxeter_plane(A, R, h, C)))
        rad = sorted(round(abs(f[o[0]]), 4) for o in rings)
        pts = []
        for ri, orb in enumerate(sorted(rings, key=lambda o: abs(f[o[0]]))):
            for r in orb:
                rr = tuple(r) + (0,) * (8 - n); c = co[rr]
                kind = 'e' if all(t.denominator == 1 for t in c) else 'd'
                pts.append([round(f[r].real, 3), round(f[r].imag, 3), ri, kind])
        cox[str(n)] = {'h': h, 'rings': n, 'ring_radii': rad, 'points': pts}
    # --- D_n^+ : orthoplex edges and demicube vertices make one lattice, and the glue has norm n/4
    dn = []
    for n in (4, 8, 12, 16):
        g = F(n, 4); roots_dn = 2 * n * (n - 1); minimal = min(F(2), g) if n > 4 else g
        mv = roots_dn + (2 ** (n - 1) if g == 2 else 0) if n > 4 else 2 ** (n - 1)
        dn.append({'n': n, 'glue_norm': str(g), 'integral': g.denominator == 1, 'even': g.denominator == 1 and g.numerator % 2 == 0, 'minimal_norm': str(minimal), 'minimal_vectors': mv})
    assert [r['even'] for r in dn] == [False, True, False, True] and [r['integral'] for r in dn] == [True, True, True, True]
    assert dn[1]['minimal_vectors'] == 240 and dn[0]['minimal_vectors'] == 8 and dn[2]['minimal_vectors'] == 264 and dn[3]['minimal_vectors'] == 480
    # even n/4 integer needs 8 | n; on those, the demicube vertices are roots only when n/4 = 2
    assert [n for n in range(1, 41) if F(n, 4).denominator == 1 and F(n, 4).numerator % 2 == 0] == [8, 16, 24, 32, 40]
    assert [n for n in range(1, 41) if F(n, 4) == 2] == [8]
    D['polytopes'] = {str(n): P[n] for n in P}
    D['weyl_orders'] = {'6': wchain[6], '7': wchain[7], '8': wchain[8]}
    D['coordinates'] = {'8': split8, '7': sp7, '6': sp6, '8_by_7_axes': sp8}
    D['branching'] = branching
    D['coxeter'] = cox
    D['dn_plus'] = dn
    return D

def build():
    D = series()
    D['status'] = {'checked': ['Cartan determinants 9-n, inertia (E3..E8 positive definite, E9 semidefinite with a null vector, E10 of signature (9,1))', 'root counts 72, 126, 240 by Weyl closure; E9 and E10 exceed 1000',
                               'Gosset polytopes by Weyl orbit: 16, 27, 56, 240 vertices; edges, degrees; vertex figure of each is the previous one',
                               'E8 roots in coordinates = 112 orthoplex edges + 128 demicube vertices; the E7 and E6 splits', 'E8 -> E6 x A2 root classes 72 + 6 + 6x27',
                               'Coxeter number 12, 18, 30 and the rings of the Coxeter-plane drawing', 'glue norm n/4 of D_n^+'],
                   'standard': ['the classification of finite Coxeter-Dynkin diagrams by 1/p+1/q+1/r > 1', 'E8 lattice is the unique even unimodular lattice of rank 8', 'E8 = so(16) + 128 half-spinor weights'],
                   'ours': ['reading 112 + 128 as the orthoplex and the demicube of the same 8 axes in our frame'],
                   'open': ['whether the stop at E8 has anything to do with the period 8 of the Clifford classification', 'whether the 3 in E6 x A2 is the three generations of the model']}
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL GOSSET CHECKS PASS')
if __name__ == '__main__': main()
