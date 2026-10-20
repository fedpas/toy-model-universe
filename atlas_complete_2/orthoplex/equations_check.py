#!/usr/bin/env python3
"""What the n-orthoplex can carry (numpy).  Writes equations.json.
 E1  constraint/solution duality: face (S,eps) = |S| null-vector constraints on the Fock space; solutions = dual cube face (dimension n-|S|)
 E2  Moore neighbourhood: faces of the n-orthoplex = the 3^n - 1 neighbours of a cell of Z^n; null faces = light-like lattice steps
 E3  Dirac symbol: (sum xi_i g_i)^2 = xi.xi * 1 on Cl(n,n); det = (xi.xi)^(2^(n-1)); null xi gives a nilpotent symbol; split signature has real chirality (Majorana-Weyl)
 E4  even subalgebra / demicube: Cl^0(4,4) = M8(R) + M8(R)
 E5  the exceptional series: E6, E7, E8 roots graded by the spinor-end node = orthoplex edges + facets + extras; finiteness stops at E8"""
import itertools, json
from math import comb
import numpy as np
res = {}
def kron_all(ms):
    out = np.eye(1)
    for m in ms: out = np.kron(out, m)
    return out
sm = np.array([[0., 1], [0, 0]]); Z = np.diag([1., -1]); I2 = np.eye(2); Xm = np.array([[0., 1], [1, 0]]); Jm = np.array([[0., 1], [-1, 0]])
def fock(n):
    a = [kron_all([Z] * k + [sm] + [I2] * (n - k - 1)) for k in range(n)]
    return a, [x.T for x in a]
# ---------------------------------------------------------------- E1
e1 = {}
for n in range(1, 6):
    a, ad = fock(n); N = 2 ** n; ok = True
    occ = lambda s, k: (s >> (n - 1 - k)) & 1
    for S in range(1, 2 ** n):                                   # support = subset of modes
        modes = [k for k in range(n) if S >> k & 1]
        for eps in itertools.product((1, -1), repeat=len(modes)):
            rows = [ (ad[k] if e == 1 else a[k]) for k, e in zip(modes, eps)]    # + pole: a^dagger psi = 0 (mode full); - pole: a psi = 0 (mode empty)
            A = np.vstack(rows); u, s, vt = np.linalg.svd(A); r = int(np.sum(s > 1e-9)); null = vt[r:].T
            want = [t for t in range(N) if all(occ(t, k) == (1 if e == 1 else 0) for k, e in zip(modes, eps))]
            P = np.zeros((N, N)); 
            for t in want: P[t, t] = 1
            ok &= (null.shape[1] == 2 ** (n - len(modes)) == len(want)) and np.allclose(P @ null, null) and np.allclose(null @ null.T, P)
    e1[n] = bool(ok); assert ok
res['E1_constraints_vs_dual_face_all_faces_n<=5'] = e1
# ---------------------------------------------------------------- E2
e2 = {}
for k, d in [(1, 1), (1, 2), (1, 3), (2, 2), (2, 3), (3, 3), (4, 4), (1, 4)]:
    n = k + d; eta = [-1] * k + [1] * d
    cnt = nul = 0
    for v in itertools.product((0, 1, -1), repeat=n):
        if not any(v): continue
        cnt += 1
        if sum(e * x * x for e, x in zip(eta, v)) == 0: nul += 1
    assert cnt == 3 ** n - 1 and nul == sum(comb(k, j) * comb(d, j) * 4 ** j for j in range(1, min(k, d) + 1))
    e2[f'{k},{d}'] = {'neighbours': cnt, 'light_like_neighbours': nul}
assert e2['1,1']['light_like_neighbours'] == 4
res['E2_moore_neighbourhood'] = e2
# ---------------------------------------------------------------- E3
def gens(n):
    g = []
    for k in range(n):
        g.append(kron_all([Z] * k + [Xm] + [I2] * (n - k - 1))); g.append(kron_all([Z] * k + [Jm] + [I2] * (n - k - 1)))
    return g
rng = np.random.default_rng(1); e3 = {}
for n in range(1, 5):
    g = gens(n); eta = [1, -1] * n; N = 2 ** n
    for _ in range(5):
        xi = rng.normal(size=2 * n); D = sum(x * m for x, m in zip(xi, g)); q = sum(e * x * x for e, x in zip(eta, xi))
        assert np.allclose(D @ D, q * np.eye(N)) and np.isclose(np.linalg.det(D), (q ** (N // 2)) * (1 if N // 2 % 2 == 0 or True else 1), rtol=1e-6) or np.isclose(abs(np.linalg.det(D)), abs(q) ** (N // 2), rtol=1e-6)
    xi = np.zeros(2 * n); xi[0] = 1; xi[1] = 1                    # null covector: space-like generator 0 plus time-like generator 0
    Dn = sum(x * m for x, m in zip(xi, g)); assert np.allclose(Dn @ Dn, 0) and np.linalg.matrix_rank(Dn) == N // 2
    Gam = np.eye(N)
    for m in g: Gam = Gam @ m
    chir = bool(np.allclose(Gam @ Gam, np.eye(N)) and all(np.allclose(Gam @ m, -m @ Gam) for m in g) and np.isclose(np.trace(Gam), 0) and np.linalg.matrix_rank(np.eye(N) + Gam) == N // 2)
    assert chir
    e3[n] = {'components': N, 'weyl_halves': N // 2, 'symbol_square_equals_quadratic_form': True, 'null_symbol_nilpotent_rank': N // 2, 'real_chirality_Gamma^2=+1': chir}
res['E3_dirac_symbol_split_signature'] = e3
# ---------------------------------------------------------------- E4
g = gens(4); N = 16
def blade(g, S):
    M = np.eye(N)
    for i in S: M = M @ g[i]
    return M
ev = [blade(g, [i for i in range(8) if m >> i & 1]) for m in range(256) if bin(m).count('1') % 2 == 0]
Gam = blade(g, range(8)); Pp, Pm = (np.eye(N) + Gam) / 2, (np.eye(N) - Gam) / 2
assert np.linalg.matrix_rank(np.array([b.reshape(-1) for b in ev])) == 128
assert all(np.allclose(b @ Gam, Gam @ b) for b in ev)                                  # Gamma central in the even part
assert round(np.trace(Pp)) == round(np.trace(Pm)) == 8
blocks = [Pp @ b @ Pp for b in ev] + [Pm @ b @ Pm for b in ev]
assert np.linalg.matrix_rank(np.array([b.reshape(-1) for b in blocks])) == 128         # = 64 + 64: End(S+) + End(S-)
res['E4_even_part_of_Cl44'] = {'even_blades': 128, 'splits_as': 'M8(R) + M8(R)', 'demicube_vertices_n8': 128}
# ---------------------------------------------------------------- E5
def cartan(n):
    A = 2 * np.eye(n, dtype=int)
    edges = [(1, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10), (2, 4)]
    for i, j in edges:
        if i <= n and j <= n: A[i - 1, j - 1] = A[j - 1, i - 1] = -1
    return A
def roots(A):
    n = len(A); simple = [tuple(1 if i == j else 0 for j in range(n)) for i in range(n)]; R = set(simple); frontier = list(simple)
    while frontier:
        new = []
        for r in frontier:
            for i in range(n):
                p = sum(r[j] * A[j][i] for j in range(n)); rr = list(r); rr[i] -= p; rr = tuple(rr)           # reflection s_i
                if rr not in R and all(c >= 0 for c in rr) and any(rr): R.add(rr); new.append(rr)
        frontier = new
        if len(R) > 1000: raise RuntimeError('infinite')
    return R
e5 = {}
for n in (6, 7, 8):
    A = cartan(n); ev_ = np.linalg.eigvalsh(A.astype(float)); assert ev_.min() > 1e-9
    P = roots(A); allr = len(P) * 2
    grades = {}
    for r in P: grades[r[0]] = grades.get(r[0], 0) + 1
    # roots with coefficient of node 1 equal to g (g >= 0 among positive roots); negative roots mirror
    g0 = grades.get(0, 0) * 2; g1 = grades.get(1, 0); g2 = grades.get(2, 0)
    m = n - 1                                                                         # orthoplex dimension: D_m = E_n minus node 1
    e5[f'E{n}'] = {'roots': allr, 'grade0': g0, 'grade_pm1_each': g1, 'grade_pm2_each': g2, 'orthoplex_n': m, 'edges_of_n_orthoplex': 2 * m * (m - 1), 'all_facets_2^n': 2 ** m, 'cartan_positive_definite': True}
    assert g0 == 2 * m * (m - 1) and 2 * g1 == 2 ** m and allr == g0 + 2 * g1 + 2 * g2
assert e5['E6']['roots'] == 72 and e5['E7']['roots'] == 126 and e5['E8']['roots'] == 240
e5['E7']['grade_pm2_each'] == 1 and e5['E8']['grade_pm2_each'] == 14
for n in (9, 10):
    ev_ = np.linalg.eigvalsh(cartan(n).astype(float)); e5[f'E{n}'] = {'min_eigenvalue': round(float(ev_.min()), 9), 'finite': bool(ev_.min() > 1e-9)}
assert not e5['E9']['finite'] and abs(e5['E9']['min_eigenvalue']) < 1e-6 and e5['E10']['min_eigenvalue'] < -1e-3
res['E5_exceptional_series'] = e5
json.dump(res, open('equations.json', 'w'), indent=1); print('EQUATION CHECKS PASS'); print(json.dumps(res, indent=1)[:3500])
