"""5-orthoplex in our frame (stdlib + itertools).  Vertices = +-e_i, face = signed subset of generators = signed blade.
Checks: face counts; faces <-> blades x signs; edge direction e_i+-e_j has square eta_i+eta_j (null iff the two generators have opposite square);
null edges = 4*E components; facets <-> cube vertices (dual); symmetry group orders; order-3 elements; cell algebra from maxwell.json (n=5 cells)."""
import itertools, json, math
from math import comb, factorial
n = 5
V = [(i, s) for i in range(n) for s in (1, -1)]
assert len(V) == 10
def faces(m): return [tuple(f) for f in itertools.combinations(V, m) if len({i for i, _ in f}) == m]   # no antipodal pair
cnt = {m: len(faces(m)) for m in range(1, n + 1)}
assert cnt == {1: 10, 2: 40, 3: 80, 4: 80, 5: 32} and sum(cnt.values()) == 3 ** n - 1 == 242
assert all(cnt[m] == comb(n, m) * 2 ** m for m in cnt)                       # grade-m blades x 2^m sign patterns
# facets <-> cube vertices (bitmask = which axes carry the + pole)
fac = {tuple(sorted(f)) for f in faces(n)}
bm = {sum(1 << i for i, s in f if s == 1) for f in fac}; assert bm == set(range(32))
data = json.load(open('../selfcheck/maxwell.json'))['cells']
out = {}
for k in range(0, n + 1):
    d = n - k
    eta = [-1] * k + [1] * d                           # time-like generators square -1 ... only the product eta_i*eta_j matters
    # edge e_a (+-) e_b ... all 40 edges; direction v = p - q for vertices p=(i,s), q=(j,t): square = eta_i + eta_j  (axes orthogonal)
    null = trip_null = 0; E = T = B = 0
    for (p, q) in faces(2):
        sq = eta[p[0]] + eta[q[0]]
        if sq == 0: null += 1
    nullE = 4 * k * d; assert null == nullE
    # B_k x B_d order and number of order-3 elements: 3-cycles on equal-signature axes (sign flips have order 2): elements of order 3 = 2*(#3-subsets) per S_m ... count by brute force
    def order3(m):
        c = 0
        for perm in itertools.permutations(range(m)):
            for signs in itertools.product((1, -1), repeat=m):
                # element (signs, perm): acts e_i -> signs[i] e_perm[i]; order 3 iff cube is identity and not identity
                g = [(perm[i], signs[i]) for i in range(m)]
                def mul(a, b): return [(a[b[i][0]][0], b[i][1] * a[b[i][0]][1]) for i in range(m)]
                g2 = mul(g, g); g3 = mul(g2, g)
                if all(g3[i] == (i, 1) for i in range(m)) and any(g[i] != (i, 1) for i in range(m)): c += 1
        return c
    def Bo(m): return 2 ** m * factorial(m)
    group = Bo(k) * Bo(d)
    # order-3 elements of B_k x B_d: (a,b) with a^3=b^3=1 and not both identity
    o3 = (1 + order3(k)) * (1 + order3(d)) - 1
    key = f'{k},{d}'
    alg = data[key]['algebra'] if key in data else None
    out[key] = {'time_gens': k, 'space_gens': d, 'F_components': comb(n, 2), 'E_components(k*d)': k * d, 'null_edges': null, 'null_edges_equal_4E': null == 4 * k * d,
                'time_time_edges': 4 * comb(k, 2), 'space_space_edges': 4 * comb(d, 2), 'symmetry_group_order': group, 'order3_elements': o3, 'algebra': alg and {'type': alg['type'], 'splits_in_two': alg['splits_in_two']}}
    assert 4 * k * d + 4 * comb(k, 2) + 4 * comb(d, 2) == 40
res = {'n': n, 'faces_by_vertices': cnt, 'total_faces': 242, 'facets_equal_cube_vertices': True, 'cells': out,
       'petrie_graph': 'K10 minus perfect matching (cocktail-party graph K_{2,2,2,2,2}): 40 edges',
       'coincidence': 'C(5,2) = 10 = number of vertices only for n = 5 (2n = n(n-1)/2)'}
json.dump(res, open('orthoplex.json', 'w'), indent=1)
print(json.dumps(res, indent=1)); print('ORTHOPLEX CHECKS PASS')
