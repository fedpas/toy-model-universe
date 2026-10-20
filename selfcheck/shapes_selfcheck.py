#!/usr/bin/env python3
"""Two more shapes for the atlas: the orthoplex (cross-polytope) and the demicube (half-cube).  Standard library only.
  python3 shapes_selfcheck.py                         run all checks
  python3 shapes_selfcheck.py --write shapes.json     also write the data
  python3 shapes_selfcheck.py --compare shapes.json   assert the portal data equals the rebuilt data

Conventions.  A blade is a bit mask (bit i = generator i); the product of two blades is the XOR of the masks up to a sign.
The n-cube has the 2^n blades as vertices.  The orthoplex has the 2n poles +-e_i as vertices and a face is a choice of
generators with a pole for each (3^n faces counting the empty one).  The demicube keeps the even-weight vertices of the cube.
Cl(p,q): p generators square to +1, q to -1 (time = +1 as in the Maxwell page).  Cell type from s = (p - q) mod 8."""
import argparse, itertools, json
from fractions import Fraction as F
from math import comb, factorial

def popc(x): return bin(x).count('1')
# ------------------------------------------------------------------------------------------------ Clifford cells
KIND = ['R', 'R2', 'R', 'C', 'H', 'H2', 'H', 'C']
DIMK = {'R': 1, 'C': 2, 'H': 4}
def cell(p, q):
    n = p + q; k = KIND[(p - q) % 8]; copies = 2 if k.endswith('2') else 1; base = k[0]
    N2 = 2 ** n // (copies * DIMK[base]); N = int(round(N2 ** 0.5)); assert N * N == N2
    return {'kind': base, 'copies': copies, 'matrix_size': N, 'label': ('M%d(%s)' % (N, base)) + (' + M%d(%s)' % (N, base) if copies == 2 else '') if n else 'R'}
def bmul(a, b, sq):
    sign = 0
    for i in range(len(sq)):
        if b >> i & 1: sign ^= popc(a >> (i + 1)) & 1
    s = -1 if sign else 1
    c = a & b
    for i in range(len(sq)):
        if c >> i & 1: s *= sq[i]
    return a ^ b, s
def even_subalgebra(p, q):
    """Cl^0(p,q) = Cl(p,q-1) (q >= 1) or Cl(0,p-1) (q = 0): build the generators f_i = e_i e_L explicitly and check the Clifford relations"""
    n = p + q; sq = [1] * p + [-1] * q
    if n == 0: return {'p': 0, 'q': 0, 'dimension': 1}
    L = p if q >= 1 else 0
    gens = []
    for i in range(n):
        if i != L: gens.append(bmul(1 << i, 1 << L, sq))                   # (mask, sign)
    def prod(x, y):
        m, s = bmul(x[0], y[0], sq); return (m, s * x[1] * y[1])
    fp = fq = 0
    for i, x in enumerate(gens):
        m, s = prod(x, x); assert m == 0 and s in (1, -1)
        if s == 1: fp += 1
        else: fq += 1
        for y in gens[i + 1:]:
            u, v = prod(x, y), prod(y, x); assert u[0] == v[0] and u[1] == -v[1]
    assert (fp, fq) == ((p, q - 1) if q >= 1 else (0, p - 1))
    masks = {g[0] for g in gens}; assert all(popc(m) % 2 == 0 for m in masks)
    return {'p': fp, 'q': fq, 'dimension': 2 ** (n - 1)}

# ------------------------------------------------------------------------------------------------ orthoplex
def orthoplex():
    D = {}
    # faces <-> subcubes: order-reversing bijection, exhaustive for n <= 5
    for n in range(0, 6):
        Fc = list(itertools.product((0, 1, -1), repeat=n)); to = {0: '*', 1: 1, -1: 0}
        def le_o(a, b): return all(x == 0 or x == y for x, y in zip(a, b))
        def le_c(a, b): return all(y == '*' or x == y for x, y in zip(a, b))
        C = [tuple(to[x] for x in f) for f in Fc]; assert len(set(C)) == 3 ** n
        for i in range(len(Fc)):
            for j in range(len(Fc)): assert le_o(Fc[i], Fc[j]) == le_c(C[j], C[i])
    rows = {}
    for n in range(0, 9):
        fo = [comb(n, m) * 2 ** m for m in range(0, n + 1)]; fc = [comb(n, j) * 2 ** (n - j) for j in range(0, n + 1)]
        assert all(fo[m] == fc[n - m] for m in range(n + 1)) and sum(fo) == 3 ** n
        c = cell(n, n)
        rows[str(n)] = {'vertices': 2 * n, 'diameters': n, 'edges': 2 * n * (n - 1), 'facets': 2 ** n, 'faces_by_vertices': fo[1:], 'faces_total_with_empty': 3 ** n, 'so_2n_dimension': n * (2 * n - 1),
                        'genesis_node': 2 * n, 'algebra': 'Cl(%d,%d) = %s' % (n, n, c['label']), 'matrix_size': c['matrix_size'], 'half_spinors': max(1, 2 ** (n - 1)) if n else 1, 'self_dual_with_cube': n <= 2}
        assert n * (2 * n - 1) == 2 * n * (n - 1) + n
        assert c['kind'] == 'R' and c['copies'] == 1 and c['matrix_size'] == 2 ** n
    D['ladder'] = rows
    # constraints and solutions: Fock operators on basis states, Jordan-Wigner signs do not change which states are annihilated
    sol = {}
    for n in range(1, 6):
        ok = True
        for modes in itertools.chain.from_iterable(itertools.combinations(range(n), m) for m in range(1, n + 1)):
            for eps in itertools.product((1, -1), repeat=len(modes)):
                killed = [s for s in range(2 ** n) if all(((s >> k) & 1) == (1 if e == 1 else 0) for k, e in zip(modes, eps))]   # a_k^dagger s = 0 iff mode full; a_k s = 0 iff mode empty
                ok &= len(killed) == 2 ** (n - len(modes))
        sol[str(n)] = ok; assert ok
    D['constraint_solution_duality_checked_for_n'] = sorted(map(int, sol))
    # n = 4: the 24 unit quaternions are three 16-cells; vertices = even facets = odd facets = 8 only here
    vec = [tuple(F(s) if k == i else F(0) for k in range(4)) for i in range(4) for s in (1, -1)]
    half = [tuple(F(s, 2) for s in sg) for sg in itertools.product((1, -1), repeat=4)]
    ev = [h for h in half if sum(1 for x in h if x < 0) % 2 == 0]; od = [h for h in half if sum(1 for x in h if x < 0) % 2 == 1]
    allp = vec + ev + od
    def qmul(p, q):
        a1, b1, c1, d1 = p; a2, b2, c2, d2 = q
        return (a1*a2 - b1*b2 - c1*c2 - d1*d2, a1*b2 + b1*a2 + c1*d2 - d1*c2, a1*c2 - b1*d2 + c1*a2 + d1*b2, a1*d2 + b1*c2 - c1*b2 + d1*a2)
    S = set(allp); assert len(S) == 24 and all(qmul(a, b) in S for a in allp for b in allp)
    Q8 = set(vec); cos = {frozenset(qmul(g, h) for h in Q8) for g in allp}; assert len(cos) == 3 and cos == {frozenset(vec), frozenset(ev), frozenset(od)}
    assert [n for n in range(1, 40) if 2 * n == 2 ** (n - 1)] == [4]
    D['n4_triality'] = {'vertices_8v': 8, 'even_facets_8s': 8, 'odd_facets_8c': 8, 'union_is_group_of_order': 24, 'Q8_index': 3, 'three_16cells_are_the_cosets': True, 'vertices_equal_half_facets_only_at_n': [4]}
    # n = 5: the facets split by parity of the blade as 1+10+5 and 5+10+1
    D['n5_fock_content'] = {'even': [comb(5, k) for k in (0, 2, 4)], 'odd': [comb(5, k) for k in (1, 3, 5)], 'edges_are_roots_of_so10': 40, 'with_diameters': 45}
    assert sum(D['n5_fock_content']['even']) == 16 == sum(D['n5_fock_content']['odd'])
    # n = 8: edges (112) + even facets (128) = the 240 roots of E8
    n = 8
    D8 = [tuple(2 * v for v in ([0] * i + [s1] + [0] * (j - i - 1) + [s2] + [0] * (n - j - 1))) for i in range(n) for j in range(i + 1, n) for s1 in (1, -1) for s2 in (1, -1)]
    sp = [sg for sg in itertools.product((1, -1), repeat=n) if sum(1 for x in sg if x < 0) % 2 == 0]
    E8 = D8 + sp; assert len(D8) == 112 and len(sp) == 128 and all(sum(x * x for x in r) == 8 for r in E8)      # coordinates doubled
    Es = set(E8)
    for a in E8:
        for b in E8:
            ab = sum(x * y for x, y in zip(a, b)); assert (2 * ab) % 8 == 0
            assert tuple(x - (2 * ab // 8) * y for x, y in zip(a, b)) in Es
    D['n8_E8'] = {'edges': 112, 'even_facets': 128, 'roots': 240, 'closed_under_reflections': True, 'so16_dimension': 120, 'half_spinor': 128, 'E8_dimension': 248}
    # E6, E7, E8 roots graded by the node whose removal leaves D_{n-1}: orthoplex edges + facets + extras (E9, E10 have infinitely many roots)
    def cartan(m):
        A = [[2 if i == j else 0 for j in range(m)] for i in range(m)]
        for i, j in [(1, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10), (2, 4)]:
            if i <= m and j <= m: A[i - 1][j - 1] = A[j - 1][i - 1] = -1
        return A
    def pos_roots(A, cap=2000):
        m = len(A); simple = [tuple(1 if i == j else 0 for j in range(m)) for i in range(m)]; R = set(simple); fr = list(simple)
        while fr:
            new = []
            for r in fr:
                for i in range(m):
                    p = sum(r[j] * A[j][i] for j in range(m)); rr = list(r); rr[i] -= p; rr = tuple(rr)
                    if rr not in R and all(c >= 0 for c in rr) and any(rr): R.add(rr); new.append(rr)
            fr = new
            if len(R) > cap: return None
        return R
    ex = {}
    for m in (6, 7, 8):
        R = pos_roots(cartan(m)); g = {}
        for r in R: g[r[0]] = g.get(r[0], 0) + 1
        o = m - 1
        rec = {'roots': 2 * len(R), 'grade0': 2 * g.get(0, 0), 'grade_pm1_each': g.get(1, 0), 'grade_pm2_each': g.get(2, 0), 'orthoplex_n': o, 'edges_of_orthoplex': 2 * o * (o - 1), 'facets_of_orthoplex': 2 ** o}
        assert rec['grade0'] == rec['edges_of_orthoplex'] and 2 * rec['grade_pm1_each'] == rec['facets_of_orthoplex']
        ex['E%d' % m] = rec
    assert [ex[k]['roots'] for k in ('E6', 'E7', 'E8')] == [72, 126, 240]
    assert pos_roots(cartan(9)) is None and pos_roots(cartan(10)) is None
    ex['E9_and_E10'] = 'infinitely many roots (affine and hyperbolic): the finite series stops at E8'
    D['exceptional_series'] = ex
    return D

# ------------------------------------------------------------------------------------------------ demicube
NAMES = {3: 'tetrahedron (3-simplex)', 4: '16-cell (demitesseract)', 5: 'demipenteract', 6: 'demihexeract', 7: 'demihepteract', 8: 'demiocteract'}
def f_formula(n):
    f = []
    for k in range(0, n):
        if k == 0: v = 2 ** (n - 1)
        elif k == 1: v = 2 ** (n - 2) * comb(n, 2)
        else: v = 2 ** (n - 1) * comb(n, k + 1) + (comb(n, k) * 2 ** (n - k) if k >= 3 else 0)
        f.append(v)
    return f
def affine_dim(vs):
    base = vs[0]; rows = [[x - y for x, y in zip(v, base)] for v in vs[1:]]; r = 0; m = len(base)
    rows = [[F(x) for x in row] for row in rows]
    for c in range(m):
        piv = next((i for i in range(r, len(rows)) if rows[i][c] != 0), None)
        if piv is None: continue
        rows[r], rows[piv] = rows[piv], rows[r]
        for i in range(len(rows)):
            if i != r and rows[i][c] != 0:
                f = rows[i][c] / rows[r][c]; rows[i] = [a - f * b for a, b in zip(rows[i], rows[r])]
        r += 1
    return r
def brute_f_vector(n):
    V = [x for x in range(2 ** n) if popc(x) % 2 == 0]; idx = {x: i for i, x in enumerate(V)}
    coord = [tuple((x >> i) & 1 for i in range(n)) for x in V]
    cands = []
    for i in range(n):
        for val in (0, 1): cands.append(sum(1 << idx[x] for x in V if ((x >> i) & 1) == val))
    for v in range(2 ** n):
        if popc(v) % 2 == 1: cands.append(sum(1 << idx[x] for x in V if popc(x ^ v) == 1))
    def vs(mask): return [coord[i] for i in range(len(V)) if mask >> i & 1]
    cache = {}
    def dim(mask):
        if mask not in cache: cache[mask] = affine_dim(vs(mask))
        return cache[mask]
    full = (1 << len(V)) - 1; assert dim(full) == n
    facets = [c for c in cands if c and dim(c) == n - 1]
    # facets as vertex sets: unique
    facets = sorted(set(facets))
    faces = {full}; frontier = [full]
    while frontier:
        new = []
        for Fm in frontier:
            for G in facets:
                H = Fm & G
                if H and H != Fm and H not in faces: faces.add(H); new.append(H)
        frontier = new
    cnt = [0] * n
    for m in faces:
        if m != full: cnt[dim(m)] += 1
    return cnt, len(facets)
def demicube():
    D = {'rows': {}, 'names': {str(k): v for k, v in NAMES.items()}}
    for n in range(3, 9):
        f = f_formula(n); chi = sum((-1) ** k * f[k] for k in range(n)); assert chi == 1 - (-1) ** n, (n, chi)        # Euler relation
        cnt, nf = brute_f_vector(n); assert cnt == f and nf == f[n - 1], (n, cnt, f); brute = True
        facets = f[n - 1]; assert facets == (4 if n == 3 else 2 * n + 2 ** (n - 1))
        # even blades by grade, and the edges of the demicube by grade pair (Hamming distance 2 between even blades)
        ev = [x for x in range(2 ** n) if popc(x) % 2 == 0]; evset = set(ev)
        grade = {}
        for x in ev: grade[popc(x)] = grade.get(popc(x), 0) + 1
        pairs = {}; ne = 0
        for x in ev:
            for i in range(n):
                for j in range(i + 1, n):
                    y = x ^ (1 << i) ^ (1 << j)
                    if y > x:
                        key = '%d-%d' % (popc(x), popc(y)) if popc(x) <= popc(y) else '%d-%d' % (popc(y), popc(x)); pairs[key] = pairs.get(key, 0) + 1; ne += 1
        assert ne == f[1] and len(ev) == f[0]
        # each odd blade has n even neighbours forming an (n-1)-simplex: the corner simplices; they number 2^(n-1)
        odd = [x for x in range(2 ** n) if popc(x) % 2 == 1]; assert len(odd) == 2 ** (n - 1)
        D['rows'][str(n)] = {'name': NAMES[n], 'vertices': f[0], 'edges': f[1], 'facets': facets, 'f_vector': f, 'brute_force_verified': bool(brute), 'euler': chi,
                             'facet_split': {'demicubes_(n-1)': 2 * n if n >= 4 else 0, 'corner_simplices': 2 ** (n - 1)}, 'even_blades_by_grade': {str(k): v for k, v in sorted(grade.items())},
                             'edges_by_grade_pair': dict(sorted(pairs.items())), 'even_labels': ev if n <= 5 else None, 'corner_simplex_example_vertices': [1 ^ (1 << i) for i in range(n)]}
        D['rows'][str(n)]['even_equals_n-1_cube_vertices_by_dropping_last_bit'] = len({x & (2 ** (n - 1) - 1) for x in ev}) == 2 ** (n - 1)
        # the map is a group isomorphism for XOR
        assert all(((a ^ b) & (2 ** (n - 1) - 1)) == ((a & (2 ** (n - 1) - 1)) ^ (b & (2 ** (n - 1) - 1))) for a in ev for b in ev[:8])
    D['demicube_is_simplex_at'] = [3]; D['demicube_is_orthoplex_at'] = [4]
    # a demicube vertex of the n=4 case is one of the three 16-cells; at n = 5 the 16 vertices are 1 + 10 + 5 blades of grade 0, 2, 4
    assert D['rows']['5']['even_blades_by_grade'] == {'0': 1, '2': 10, '4': 5}
    assert D['rows']['8']['vertices'] == 128 and D['rows']['4']['f_vector'] == [8, 24, 32, 16]
    # even subalgebra of every signature up to n = 8
    ea = {}
    for n in range(1, 9):
        for p in range(0, n + 1):
            q = n - p; full = cell(p, q); eb = even_subalgebra(p, q)
            half = cell(eb['p'], eb['q']) if eb['p'] + eb['q'] else cell(0, 0)
            assert 2 ** (eb['p'] + eb['q']) == 2 ** (n - 1)
            ea['%d,%d' % (p, q)] = {'n': n, 'full': full['label'], 'even': half['label'], 'even_is': 'Cl(%d,%d)' % (eb['p'], eb['q']), 'even_splits': half['copies'] == 2, 'full_splits': full['copies'] == 2}
    assert ea['4,4']['even'] == 'M8(R) + M8(R)' and ea['4,3']['full'] == 'M8(R) + M8(R)' and ea['4,3']['even'] == 'M8(R)' and ea['2,2']['even'] == 'M2(R) + M2(R)' and ea['3,3']['even'] == 'M4(R) + M4(R)'
    D['even_subalgebra'] = ea
    # Maxwell: fields are bivectors (even), sources and equations are odd.  Rebuild the incidences from the bit rule.
    mx = {}
    for n in range(2, 8):
        src = [x for x in range(2 ** n) if popc(x) == 2]; inc = []
        for s in src:
            for i in range(n):
                t = s ^ (1 << i); inc.append((s, i, t, 'contract' if s >> i & 1 else 'wedge'))
        assert len(inc) == n * comb(n, 2)
        assert all(popc(t) % 2 == 1 and popc(s) % 2 == 0 for s, _, t, _ in inc) and all(popc(t) == (1 if op == 'contract' else 3) for _, _, t, op in inc)
        supp = {}
        for s, _, t, _ in inc: supp.setdefault(t, set()).add(s)
        sizes = {}
        for t, S_ in supp.items(): sizes.setdefault(popc(t), set()).add(len(S_))
        assert sizes == ({1: {n - 1}, 3: {3}} if n >= 3 else {1: {n - 1}})
        # two field components are coupled when they share an equation; this is exactly sharing one index = Hamming distance 2 = an edge of the demicube
        coupled = set()
        for t, S_ in supp.items():
            for a, b in itertools.combinations(sorted(S_), 2): coupled.add((a, b))
        sharing = {(a, b) for a, b in itertools.combinations(src, 2) if popc(a & b) == 1}
        assert coupled == sharing == {(a, b) for a, b in itertools.combinations(src, 2) if popc(a ^ b) == 2}
        # each coupled pair appears together in exactly two equations (a vector equation and a trivector equation) when n >= 3
        two = all(sum(1 for t, S_ in supp.items() if a in S_ and b in S_) == 2 for a, b in coupled) if n >= 3 else None
        mx[str(n)] = {'incidences': len(inc), 'F_components': comb(n, 2), 'vector_equations': n, 'trivector_equations': comb(n, 3), 'vector_equation_terms': n - 1, 'trivector_equation_terms': 3 if n >= 3 else 0,
                      'coupled_pairs': len(coupled), 'coupling_graph_is_demicube_edges_between_bivectors': True, 'each_coupled_pair_in_two_equations': two}
    D['maxwell'] = mx
    assert [mx[str(n)]['incidences'] for n in range(2, 8)] == [2, 9, 24, 50, 90, 147]
    return D

def build():
    D = {'orthoplex': orthoplex(), 'demicube': demicube()}
    D['status'] = {'checked': ['face counts and duality (n<=5 exhaustive)', 'f-vectors of the demicube (brute-force face lattice n<=8, Euler relation n<=8)', 'even subalgebra types, built from explicit generators', 'incidences and couplings of the Maxwell cells n=2..7', 'triality at n=4', 'roots of E6, E7, E8'],
                   'standard': ['Cl^0(p,q) = Cl(p,q-1)', 'Spin(2n) weights and roots from the orthoplex', 'Gosset series'], 'ours': ['reading even blades as the fields and odd blades as sources and equations', 'reading n=5 even blades as one generation'], 'open': ['whether any of these shapes selects the number of generations']}
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL SHAPE CHECKS PASS')
if __name__ == '__main__': main()
