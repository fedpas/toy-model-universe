#!/usr/bin/env python3
"""Orthoplex ladder n = 0,1,2,...  read through the Genesis frame.  numpy for the explicit matrices.
Reading F (Fock): n modes = n Witt pairs (a_i, a_i^dagger) = 2n null generators = Genesis node 2n, algebra Cl(n,n) = M_{2^n}(R).
 vertices +-e_i = creation/annihilation of mode i;  facets (2^n) = occupation patterns = blades of Cl(n) = basis of the Fock space Lambda(R^n);
 edges = +-e_i +- e_j = bilinears (roots of so(2n));  faces <-> faces of the dual cube with grade m <-> n-m (pseudoscalar duality).
Run: python3 ladder_check.py  -> asserts, writes ladder.json"""
import itertools, json, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
from math import comb
import numpy as np
res = {'ladder': {}}
# ------------------------------------------------------------------ 1. face lattice of the orthoplex versus the cube: order-reversing bijection (exhaustive n <= 5), f-vectors (n <= 8)
def faces_orth(n): return list(itertools.product((0, 1, -1), repeat=n))          # 0 = generator absent, +1/-1 = pole
def leq_orth(a, b): return all(x == 0 or x == y for x, y in zip(a, b))           # a is a face of b
to_cube = {0: '*', 1: 1, -1: 0}
def leq_cube(a, b): return all(y == '*' or x == y for x, y in zip(a, b))          # a is a subcube of b
for n in range(0, 6):
    F = faces_orth(n); C = [tuple(to_cube[x] for x in f) for f in F]
    assert len(set(C)) == 3 ** n
    for i in range(len(F)):
        for j in range(len(F)):
            assert leq_orth(F[i], F[j]) == leq_cube(C[j], C[i])                    # order reversing
fvec = {}
for n in range(0, 9):
    fo = {m: comb(n, m) * 2 ** m for m in range(0, n + 1)}                      # faces with m vertices (m = 0: the empty face)
    fc = {j: comb(n, j) * 2 ** (n - j) for j in range(0, n + 1)}                # subcubes of dimension j
    assert all(fo[m] == fc[n - m] for m in fo) and sum(fo.values()) == 3 ** n
    fvec[n] = fo
# ------------------------------------------------------------------ 2. Cl(n,n) = M_{2^n}(R): explicit real matrices, independence of the 4^n blades
X = np.array([[0., 1], [1, 0]]); Zm = np.diag([1., -1]); Jm = np.array([[0., 1], [-1, 0]]); I2 = np.eye(2)
def kron_all(ms):
    out = np.eye(1)
    for m in ms: out = np.kron(out, m)
    return out
def real_gens(n):
    g = []
    for k in range(n):
        g.append(kron_all([Zm] * k + [X] + [I2] * (n - k - 1)))                  # squares +1
        g.append(kron_all([Zm] * k + [Jm] + [I2] * (n - k - 1)))                 # squares -1
    return g
def blades(g):
    N = len(g); out = []
    for mask in range(2 ** N):
        M = np.eye(g[0].shape[0])
        for i in range(N):
            if mask >> i & 1: M = M @ g[i]
        out.append(M)
    return out
for n in range(0, 5):
    g = real_gens(n) if n else []
    if n:
        for i in range(2 * n):
            for j in range(2 * n):
                P = g[i] @ g[j] + g[j] @ g[i]
                assert np.allclose(P, (2 * (1 if i % 2 == 0 else -1)) * np.eye(2 ** n) if i == j else 0)
        B = blades(g); rk = np.linalg.matrix_rank(np.array([b.reshape(-1) for b in B]))
        assert rk == 4 ** n, (n, rk)                                           # the 4^n blades span all of M_{2^n}(R)
    res['ladder'][n] = {'genesis_node': 2 * n, 'algebra': f'Cl({n},{n}) = M_{2 ** n}(R)', 'matrix_size': 2 ** n, 'blades_of_Cl(n,n)': 4 ** n, 'checked_explicitly': n <= 4}
# period: Cl(5,5) = Cl(1,1) x Cl(4,4): sizes
assert 2 ** 5 == 2 * 2 ** 4
res['ladder'][5] = ({'genesis_node': 10, 'matrix_size': 32, 'blades_of_Cl(n,n)': 1024, 'algebra': 'Cl(5,5) = M_32(R) = Cl(1,1) (x) Cl(4,4): the budget of 8 is used up at n = 4', 'checked_explicitly': False})
# ------------------------------------------------------------------ 3. Fock reading: operators a_i, a_i^dagger on 2^n states; weights = facets, root shifts = edges
sm = np.array([[0, 1], [0, 0]], dtype=complex)                                 # annihilation on one mode (basis: empty, full)
Zc = np.diag([1., -1]).astype(complex); Ic = np.eye(2, dtype=complex)
def fock(n):
    a = [kron_all([Zc] * k + [sm] + [Ic] * (n - k - 1)) for k in range(n)]
    return a, [x.conj().T for x in a]
def facet_pattern(idx, n): return tuple(1 if (idx >> (n - 1 - k)) & 1 == 0 else -1 for k in range(n))   # weight 1/2*(+-1,...)
for n in range(1, 6):
    a, ad = fock(n); N = 2 ** n
    for i in range(n):
        for j in range(n):
            assert np.allclose(a[i] @ ad[j] + ad[j] @ a[i], (1 if i == j else 0) * np.eye(N))
            assert np.allclose(a[i] @ a[j] + a[j] @ a[i], 0)
    # weight of basis state s under H_i = a_i^dagger a_i - 1/2
    H = [(ad[i] @ a[i] - 0.5 * np.eye(N)) for i in range(n)]
    W = {tuple(np.round(np.diag(H[i])[s].real * 2).astype(int) for i in range(n)) for s in range(N)}
    assert len(W) == 2 ** n                                                    # facets: all sign patterns appear exactly once
    ops = a + ad; shifts = set()
    for p, q in itertools.combinations(range(2 * n), 2):
        O = ops[p] @ ops[q]
        for s in range(N):
            for t in range(N):
                if abs(O[t, s]) > 1e-9:
                    ws = np.array([np.diag(H[i])[s].real for i in range(n)]) ; wt = np.array([np.diag(H[i])[t].real for i in range(n)])
                    shifts.add(tuple(np.round(wt - ws).astype(int)))
    roots = {s for s in shifts if any(s)}
    orth_edges = set()
    for (i, s1), (j, s2) in itertools.combinations([(i, s) for i in range(n) for s in (1, -1)], 2):
        if i != j:
            v = [0] * n; v[i] += s1; v[j] += s2; orth_edges.add(tuple(v))
    assert roots == orth_edges and len(roots) == 2 * n * (n - 1), n         # edges of the orthoplex = root shifts of the bilinears (D_n roots)
    assert n * (2 * n - 1) == 2 * n * (n - 1) + n                              # dim so(2n) = edges + diameters (Cartan)
    res['ladder'].setdefault(n, {}).update({'vertices': 2 * n, 'diameters(Cartan)': n, 'edges(roots of D_n)': 2 * n * (n - 1), 'so(2n)_dim': n * (2 * n - 1), 'facets(Fock states)': 2 ** n,
                             'half_spinors': 2 ** (n - 1), 'faces_total': 3 ** n, 'grade_counts': [comb(n, k) for k in range(n + 1)]})
res['ladder'][0].update({'vertices': 0, 'edges(roots of D_n)': 0, 'facets(Fock states)': 1, 'faces_total': 1, 'grade_counts': [1]})
# D_n is a root system: closed under reflections, integral
def is_root_system(R):
    R = [np.array(r, dtype=float) for r in R]; S = {tuple(r) for r in R}
    for a in R:
        for b in R:
            c = 2 * (a @ b) / (b @ b)
            assert abs(c - round(c)) < 1e-9
            assert tuple(a - c * b) in S
    return True
def Dn(n): return [tuple(([0] * i + [s1] + [0] * (j - i - 1) + [s2] + [0] * (n - j - 1))) for i in range(n) for j in range(i + 1, n) for s1 in (1, -1) for s2 in (1, -1)]
for n in (3, 4, 5): assert is_root_system(Dn(n))
# ------------------------------------------------------------------ 4. SU(n) content of the Fock space, n=3 (colour) and n=5 (one generation)
res['fock_su_content'] = {'n=3': {'all': [1, 3, 3, 1], 'even_half': [1, 3], 'odd_half': [3, 1]}, 'n=5': {'all': [1, 5, 10, 10, 5, 1], 'even_half(1+10+5)': [1, 10, 5], 'odd_half(5+10+1)': [5, 10, 1]}}
assert sum([comb(5, k) for k in (0, 2, 4)]) == 16 and sum([comb(5, k) for k in (1, 3, 5)]) == 16 and 6 + 3 + 1 == 10 and 3 + 2 == 5
assert 6 + 3 + 3 + 2 + 1 + 1 == 16           # Q_L, u_R, d_R, L, e_R, nu_R of the checked Furey model: 10 + 5 + 1
# ------------------------------------------------------------------ 5. n = 4: the 16-cell, the tesseract, the 24-cell, triality count
vec = [tuple(s if k == i else 0 for k in range(4)) for i in range(4) for s in (1, -1)]
half = [tuple(0.5 * s for s in sg) for sg in itertools.product((1, -1), repeat=4)]
even = [h for h in half if sum(1 for x in h if x < 0) % 2 == 0]; odd = [h for h in half if sum(1 for x in h if x < 0) % 2 == 1]
assert len(vec) == len(even) == len(odd) == 8
allp = vec + even + odd; assert len(allp) == 24 and all(abs(sum(x * x for x in p) - 1) < 1e-12 for p in allp)
def sixteen_cell(S):                                                           # closed under -x and contains 4 mutually orthogonal axes
    S = {tuple(p) for p in S}; axes = []
    for p in S:
        assert tuple(-x for x in p) in S
    for p in S:
        if tuple(-x for x in p) != p and all(abs(sum(a * b for a, b in zip(p, q))) < 1e-12 for q in axes): axes.append(p)
    return len(axes) >= 4
assert sixteen_cell(vec) and sixteen_cell(even) and sixteen_cell(odd)           # three 16-cells: 8_v, 8_s, 8_c
import sys; sys.path.insert(0, '..'); from model import qmul
Q = [np.array(p) for p in allp]; Qs = {tuple(np.round(q, 9)) for q in Q}
assert all(tuple(np.round(qmul(a, b), 9)) in Qs for a in Q for b in Q)         # the 24 points are a group (binary tetrahedral = Hurwitz units)
Q8 = {tuple(np.round(q, 9)) for q in map(np.array, vec)}
cosets = {frozenset(tuple(np.round(qmul(g, np.array(h)), 9)) for h in Q8) for g in Q}; assert len(cosets) == 3        # Q8 has index 3
assert {frozenset(map(lambda p: tuple(np.round(p, 9)), S)) for S in (vec, even, odd)} == cosets      # the three 16-cells ARE the three cosets
w = np.array([0.5, 0.5, 0.5, 0.5]); winv = np.array([w[0], -w[1], -w[2], -w[3]]); conj = lambda x: qmul(qmul(w, x), winv)
assert np.allclose(conj(np.array([0, 1, 0, 0])), [0, 0, 1, 0]) and np.allclose(conj(np.array([0, 0, 1, 0])), [0, 0, 0, 1]) and np.allclose(conj(np.array([0, 0, 0, 1])), [0, 1, 0, 0])      # an order-3 element cycles i -> j -> k
# and left multiplication by w permutes the three 16-cells cyclically
Lw = lambda S: frozenset(tuple(np.round(qmul(w, np.array(p)), 9)) for p in S)
cyc = [frozenset(tuple(np.round(np.array(p), 9)) for p in S) for S in (vec, even, odd)]
assert {Lw(S) for S in (vec, even, odd)} == set(cyc) and all(Lw(S) != S for S in (vec, even, odd))
res['n4_triality'] = {'8_v_vertices': 8, '8_s_even_facets': 8, '8_c_odd_facets': 8, 'union': 24, 'is_group_of_order_24': True, 'Q8_index': 3, 'three_16cells_are_the_cosets': True}
eq = [n for n in range(1, 40) if 2 * n == 2 ** (n - 1)]; assert eq == [4]
res['vertices_equal_half_facets_only_at'] = eq
# the 16 vertices of the dual tesseract = the 16 facets of the 16-cell = 4-bit occupation patterns
# ------------------------------------------------------------------ 6. the 16 Witt axes of the explicit model as the vertices of a tesseract
src = open('../family_test.py').read()
ns = {}
import os; os.chdir('..')
exec(src.split("# (2d) symmetries of the torus frame")[0], ns); exec(src[src.index("L4 = np.array"):src.index("blocksets = ")], ns)
C4, block_axes = ns['C4'], ns['block_axes']
def affine(pts):
    S = set(pts); return all(tuple(a ^ b ^ c for a, b, c in zip(x, y, z)) in S for x in S for y in S for z in S)
bl = {n: [C4[i] for i in block_axes[n]] for n in block_axes}
aff = {n: affine(p) for n, p in bl.items()}
Ocell = [p for n in ('O1', 'O2') for p in bl[n]]; Oprime = [p for n in ('H', 'C', 'e7R', 'R') for p in bl[n]]
res['witt_axes_as_tesseract'] = {'blocks_that_are_affine_subspaces': [n for n, v in aff.items() if v], 'blocks_not_affine': [n for n, v in aff.items() if not v],
                                 'O1+O2_is_a_cube(3-dim affine, 8 axes)': bool(affine(Ocell) and len(Ocell) == 8), "H+C+e7R+R_is_a_cube(8 axes)": bool(affine(Oprime) and len(Oprime) == 8),
                                 'C+e7R+R_is_a_square(4 axes)': bool(affine(bl['C'] + bl['e7R'] + bl['R'])), 'H_is_a_square(4 axes)': bool(affine(bl['H']))}
assert aff['H'] and aff['O1'] and aff['C'] and not aff['O2'] and res['witt_axes_as_tesseract']['O1+O2_is_a_cube(3-dim affine, 8 axes)'] and res['witt_axes_as_tesseract']["H+C+e7R+R_is_a_cube(8 axes)"]
assert res['witt_axes_as_tesseract']['C+e7R+R_is_a_square(4 axes)'] and res['witt_axes_as_tesseract']['H_is_a_square(4 axes)']
# ------------------------------------------------------------------ 7. n = 8: the 256 of the budget and E8 (standard fact, not a claim about the model)
n = 8
D8 = [tuple(([0] * i + [s1] + [0] * (j - i - 1) + [s2] + [0] * (n - j - 1))) for i in range(n) for j in range(i + 1, n) for s1 in (1, -1) for s2 in (1, -1)]
spin = [tuple(0.5 * s for s in sg) for sg in itertools.product((1, -1), repeat=n) if sum(1 for x in sg if x < 0) % 2 == 0]
E8 = D8 + spin; assert len(D8) == 112 == 2 * n * (n - 1) and len(spin) == 128 == 2 ** (n - 1) and len(E8) == 240
Ea = np.array(E8); assert np.allclose((Ea ** 2).sum(1), 2)
S = {tuple(np.round(r, 9)) for r in Ea}
for a in Ea[::7]:                                                              # reflection closure on a sample of 35 roots against all 240
    for b in Ea:
        c = 2 * (a @ b) / (b @ b); assert abs(c - round(c)) < 1e-9 and tuple(np.round(a - c * b, 9)) in S
res['n8'] = {'edges_112_plus_even_facets_128': 240, 'is_E8_root_set(checked: norms, integrality, reflection closure on a sample)': True, 'so(16)_dim': 120, 'plus_half_spinor': 128, 'E8_dim': 248,
             'End_V_antisymmetric_symmetric': [120, 136], 'facets': 256, 'even_blades': 128}
assert 8 + 112 == 120 and 120 + 128 == 248 and 16 * 15 // 2 == 120 and 256 - 120 == 136
json.dump(res, open(os.path.join(HERE, 'ladder.json'), 'w'), indent=1, default=str)
print('LADDER CHECKS PASS'); print(json.dumps({k: res[k] for k in ('witt_axes_as_tesseract', 'n4_triality', 'vertices_equal_half_facets_only_at', 'n8')}, indent=1))
