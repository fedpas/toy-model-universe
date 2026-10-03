#!/usr/bin/env python3
"""Mirrors: reflections, versors and the Cartan-Dieudonne decomposition on the bit rule.  Exact arithmetic, standard library only.
  python3 mirrors_selfcheck.py                          run all checks
  python3 mirrors_selfcheck.py --write mirrors.json     also write the data
  python3 mirrors_selfcheck.py --compare mirrors.json   assert the portal data equals the rebuilt data
Blades are bit masks over n orthogonal generators (time squares +1, space squares -1).  A VERSOR is a product of vectors a_1 ... a_k.
It acts on a vector x by the twisted sandwich  x -> (-1)^k V x V^-1, which is the product of the k mirrors  x -> x - 2 (x.a)/(a.a) a.
  corner S of the n-cube = the versor  prod_{i in S} e_i   = the product of the coordinate mirrors i in S   (it flips the axes of S)
  even corners (the demicube) are rotors, odd corners are reflections; the number of mirrors of a corner is its weight
Checked exactly (rational numbers): the mirror formula, the twisted sandwich is an isometry with determinant (-1)^k, a corner flips exactly its axes,
the Cartan-Dieudonne decomposition (every product of any number of vectors reduces to at most n mirrors, and the reduced versor is the same versor up to a scalar),
the orders of the reflection groups B_n and D_n by closure, the 240 roots of E8 (112 + the 128 vertices of the 8-demicube) permuted by all their mirrors,
and the current of a two-mirror spinor in the space-time algebra."""
import argparse, itertools, json, random
from fractions import Fraction as F
from math import comb, factorial

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

class MV:
    """a multivector: {mask: Fraction} in the algebra with the generator squares `sq`"""
    def __init__(self, sq, d=None): self.sq = sq; self.d = {m: c for m, c in (d or {}).items() if c}
    def __add__(self, o):
        r = dict(self.d)
        for m, c in o.d.items(): r[m] = r.get(m, 0) + c
        return MV(self.sq, r)
    def scale(self, k): return MV(self.sq, {m: c * k for m, c in self.d.items()})
    def __sub__(self, o): return self + o.scale(-1)
    def __mul__(self, o):
        r = {}
        for a, ca in self.d.items():
            for b, cb in o.d.items():
                m, s = bmul(a, b, self.sq)
                if s: r[m] = r.get(m, 0) + s * ca * cb
        return MV(self.sq, r)
    def rev(self): return MV(self.sq, {m: c * (-1 if (popc(m) * (popc(m) - 1) // 2) % 2 else 1) for m, c in self.d.items()})
    def grades(self): return {popc(m) for m in self.d}
    def is_scalar(self): return all(m == 0 for m in self.d)
    def __eq__(self, o): return self.d == o.d
def vec(sq, xs): return MV(sq, {1 << i: F(x) for i, x in enumerate(xs) if x})
def dot(sq, x, y): return sum(F(s) * a * b for s, a, b in zip(sq, x, y))
def inv_versor(V):
    VV = V * V.rev(); assert VV.is_scalar() and VV.d, 'a versor times its reverse must be a non-zero scalar'
    return V.rev().scale(1 / VV.d[0])

def twisted(V, k, x, sq):
    """(-1)^k V x V^-1 for a vector x given as a coefficient list; returns the coefficient list"""
    r = V * vec(sq, x) * inv_versor(V); assert r.grades() <= {1}, 'the sandwich of a vector must be a vector'
    sign = -1 if k % 2 else 1
    return [sign * r.d.get(1 << i, F(0)) for i in range(len(sq))]
def matrix_of(V, k, sq):
    n = len(sq); cols = [twisted(V, k, [1 if i == j else 0 for i in range(n)], sq) for j in range(n)]
    return [[cols[j][i] for j in range(n)] for i in range(n)]
def det(M):
    M = [r[:] for r in M]; n = len(M); d = F(1)
    for c in range(n):
        p = next((i for i in range(c, n) if M[i][c] != 0), None)
        if p is None: return F(0)
        if p != c: M[c], M[p] = M[p], M[c]; d = -d
        d *= M[c][c]
        for i in range(c + 1, n):
            f = M[i][c] / M[c][c]; M[i] = [x - f * y for x, y in zip(M[i], M[c])]
    return d
def matvec(M, x): return [sum(M[i][j] * x[j] for j in range(len(x))) for i in range(len(M))]
def matmul(A, B): return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]
def reflect(sq, a, x):
    aa = dot(sq, a, a); f = 2 * dot(sq, x, a) / aa
    return [xi - f * ai for xi, ai in zip(x, a)]
def reflection_matrix(sq, a):
    n = len(sq); cols = [reflect(sq, a, [1 if i == j else 0 for i in range(n)]) for j in range(n)]
    return [[cols[j][i] for j in range(n)] for i in range(n)]
def rank(M):
    M = [r[:] for r in M]; rk = 0; ncols = len(M[0]) if M else 0
    for c in range(ncols):
        p = next((i for i in range(rk, len(M)) if M[i][c] != 0), None)
        if p is None: continue
        M[rk], M[p] = M[p], M[rk]
        for i in range(len(M)):
            if i != rk and M[i][c] != 0:
                f = M[i][c] / M[rk][c]; M[i] = [x - f * y for x, y in zip(M[i], M[rk])]
        rk += 1
    return rk

def rand_vec(rng, sq):
    while True:
        a = [rng.randint(-3, 3) for _ in sq]
        if any(a) and dot(sq, a, a) != 0: return a
def versor(sq, vs):
    V = MV(sq, {0: F(1)})
    for a in vs: V = V * vec(sq, a)
    return V

def cartan_dieudonne(sq, O, rng):
    """reflect O to the identity: returns vectors r_1 ... r_m with  O = R_{r1} ... R_{rm}  and m <= n.
    a = O u - u is orthogonal to everything O fixes, and R_a maps O u to u, so each step fixes one more dimension."""
    n = len(sq); cur = [r[:] for r in O]; out = []; I = [[F(int(i == j)) for j in range(n)] for i in range(n)]
    while cur != I:
        for _ in range(400):
            u = [rng.randint(-3, 3) for _ in range(n)]
            if matvec(cur, u) == [F(x) for x in u]: continue
            a = [p - q for p, q in zip(matvec(cur, u), u)]
            if dot(sq, a, a) != 0: break
        else: raise AssertionError('no non-null reflection vector found')
        out.append(a); cur = matmul(reflection_matrix(sq, a), cur)
        assert len(out) <= n, 'Cartan-Dieudonne bound exceeded'
    return out

def versor_checks(sq, seed, trials):
    n = len(sq); rng = random.Random(seed); hist = {}; ok = {'mirror_formula': True, 'isometry': True, 'determinant': True, 'parity': True, 'reduced_versor_equal_up_to_scalar': True, 'at_most_n': True, 'parity_of_count': True}
    for _ in range(trials):
        a = rand_vec(rng, sq); x = [rng.randint(-4, 4) for _ in range(n)]
        r = twisted(vec(sq, a), 1, x, sq)
        if r != reflect(sq, a, x): ok['mirror_formula'] = False
        k = rng.randint(1, 2 * n + 1); vs = [rand_vec(rng, sq) for _ in range(k)]; V = versor(sq, vs); O = matrix_of(V, k, sq)
        y = [rng.randint(-4, 4) for _ in range(n)]
        if dot(sq, matvec(O, x), matvec(O, y)) != dot(sq, x, y): ok['isometry'] = False
        if det(O) != (-1) ** k: ok['determinant'] = False
        if {popc(m) % 2 for m in V.d} != {k % 2}: ok['parity'] = False
        rs = cartan_dieudonne(sq, O, rng); m = len(rs); hist[m] = hist.get(m, 0) + 1
        if m > n: ok['at_most_n'] = False
        if (m - k) % 2: ok['parity_of_count'] = False
        W = versor(sq, rs)
        m0 = next(iter(V.d)); lam = V.d[m0] / W.d[m0] if m0 in W.d else None
        if lam is None or W.scale(lam).d != V.d: ok['reduced_versor_equal_up_to_scalar'] = False
    assert all(ok.values()), (sq, ok)
    return {'trials': trials, 'mirrors_used': {str(k): hist[k] for k in sorted(hist)}, **ok}

def corner_flips(sq):
    n = len(sq); res = {'weights': {}, 'even_corners': 0, 'all_flip': True}
    for S in range(1 << n):
        k = popc(S); V = MV(sq, {S: F(1)}); O = matrix_of(V, k, sq)
        want = [[F(-1 if (S >> i & 1) else 1) if i == j else F(0) for j in range(n)] for i in range(n)]
        assert O == want, ('a corner must flip exactly its axes', sq, S)
        rk = rank([[O[i][j] - (1 if i == j else 0) for j in range(n)] for i in range(n)]); assert rk == k, 'the number of mirrors of a corner is its weight'
        assert det(O) == (-1) ** k
        res['weights'][str(k)] = res['weights'].get(str(k), 0) + 1; res['even_corners'] += (k % 2 == 0)
    assert res['even_corners'] == 1 << (n - 1) and all(res['weights'][str(k)] == comb(n, k) for k in range(n + 1))
    return res

def group_closure(gens, limit=100000):
    n = len(gens[0]); I = tuple(tuple(int(i == j) for j in range(n)) for i in range(n)); seen = {I}; frontier = [I]
    while frontier:
        nxt = []
        for g in frontier:
            for h in gens:
                p = tuple(tuple(sum(h[i][k] * g[k][j] for k in range(n)) for j in range(n)) for i in range(n))
                if p not in seen: seen.add(p); nxt.append(p)
        frontier = nxt; assert len(seen) < limit
    return seen
def int_reflection(n, kind, i, j=None):
    M = [[int(a == b) for b in range(n)] for a in range(n)]
    if kind == 'flip': M[i][i] = -1
    elif kind == 'swap': M[i][i] = M[j][j] = 0; M[i][j] = M[j][i] = 1
    elif kind == 'swapneg': M[i][i] = M[j][j] = 0; M[i][j] = M[j][i] = -1
    return tuple(tuple(r) for r in M)
def coxeter(n):
    swaps = [int_reflection(n, 'swap', i, i + 1) for i in range(n - 1)]
    B = group_closure(swaps + [int_reflection(n, 'flip', n - 1)])
    D = group_closure(swaps + [int_reflection(n, 'swapneg', n - 2, n - 1)])
    diagD = {g for g in D if all(g[i][j] == 0 for i in range(n) for j in range(n) if i != j)}
    diagB = {g for g in B if all(g[i][j] == 0 for i in range(n) for j in range(n) if i != j)}
    evenD = {tuple(tuple(-1 if (S >> i & 1) and i == j else int(i == j) for j in range(n)) for i in range(n)) for S in range(1 << n) if popc(S) % 2 == 0}
    assert len(B) == 2 ** n * factorial(n) and len(D) == 2 ** (n - 1) * factorial(n), (n, len(B), len(D))
    assert len(diagB) == 2 ** n and diagD == evenD, 'the sign changes of D_n are exactly the even corners (the demicube)'
    return {'B_order': len(B), 'D_order': len(D), 'sign_changes_in_B': len(diagB), 'sign_changes_in_D': len(diagD)}

def e8():
    roots = []
    for i in range(8):
        for j in range(i + 1, 8):
            for a in (2, -2):
                for b in (2, -2):
                    v = [0] * 8; v[i] = a; v[j] = b; roots.append(tuple(v))
    half = []
    for S in range(256):
        if popc(S) % 2 == 0: half.append(tuple(-1 if S >> i & 1 else 1 for i in range(8)))
    roots += half; R = set(roots); assert len(R) == 240 and len(half) == 128
    for r in roots:
        for x in roots:
            d = sum(p * q for p, q in zip(x, r)); assert d % 4 == 0 and (d // 4) in (-2, -1, 0, 1, 2)
            y = tuple(p - (d // 4) * q for p, q in zip(x, r)); assert y in R, 'a mirror of E8 must permute the roots'
    demi = {tuple(1 if c > 0 else -1 for c in v) for v in half}; assert len(demi) == 128 and all(sum(1 for c in v if c < 0) % 2 == 0 for v in demi)
    return {'roots': 240, 'd8_roots': 112, 'demicube_vertices': 128, 'mirrors_permute_roots': True}

def examples():
    out = {}
    sq = [-1, -1]; O = [[F(3, 5), F(-4, 5)], [F(4, 5), F(3, 5)]]; rng = random.Random(7); rs = cartan_dieudonne(sq, O, rng)
    V = versor(sq, rs); assert matrix_of(V, len(rs), sq) == O and len(rs) == 2
    out['rotation_3_4_5'] = {'mirror_normals': [[str(c) for c in r] for r in rs], 'matrix': [[str(c) for c in r] for r in O]}
    sq = [1, -1]; O = [[F(5, 4), F(3, 4)], [F(3, 4), F(5, 4)]]; rs = cartan_dieudonne(sq, O, random.Random(3))
    V = versor(sq, rs); assert matrix_of(V, len(rs), sq) == O and len(rs) == 2
    out['boost_5_4_3_4'] = {'mirror_normals': [[str(c) for c in r] for r in rs], 'matrix': [[str(c) for c in r] for r in O]}
    return out

def dirac_current(seed):
    sq = [1, -1, -1, -1]; rng = random.Random(seed); n_ok = 0
    for _ in range(12):
        a = rand_vec(rng, sq); b = rand_vec(rng, sq); psi = vec(sq, a) * vec(sq, b); assert psi.grades() <= {0, 2}
        g0 = vec(sq, [1, 0, 0, 0]); X = psi * g0 * psi.rev(); assert X.grades() <= {1}, 'the current of a two-mirror spinor is a vector'
        s = psi * psi.rev(); assert s.is_scalar(); XX = X * X; assert XX.is_scalar() and XX.d.get(0, 0) == s.d.get(0, 0) ** 2, 'X.X = (psi psi~)^2'
        n_ok += 1
    return {'two_mirror_spinors_tested': n_ok, 'current_is_a_vector': True, 'square_equals_scalar_density_squared': True}

def counts(n):
    return {'corners': 1 << n, 'rotors': 1 << (n - 1), 'reflections': 1 << (n - 1), 'layers': [comb(n, k) for k in range(n + 1)], 'max_mirrors': n,
            'B_order': 2 ** n * factorial(n), 'D_order': 2 ** (n - 1) * factorial(n), 'edges_of_cube': n * (1 << (n - 1)), 'rotor_layers': [comb(n, k) for k in range(0, n + 1, 2)]}

def build():
    out = {'ladder': {}, 'versors': {}, 'corners': {}, 'coxeter': {}, 'e8': {}, 'examples': {}, 'dirac_current': {}, 'status': {}}
    for n in range(2, 9): out['ladder'][str(n)] = counts(n)
    for n, tr in ((2, 40), (3, 40), (4, 30), (5, 20)):
        out['versors']['%d,space' % n] = versor_checks([-1] * n, 100 + n, tr)
        out['versors']['%d,lorentz' % n] = versor_checks([1] + [-1] * (n - 1), 200 + n, tr)
    for n in range(2, 7):
        out['corners']['%d,space' % n] = corner_flips([-1] * n); out['corners']['%d,lorentz' % n] = corner_flips([1] + [-1] * (n - 1))
    for n in range(2, 6): out['coxeter'][str(n)] = coxeter(n)
    out['e8'] = e8(); out['examples'] = examples(); out['dirac_current'] = dirac_current(5)
    out['status'] = {
        'checked': ['a corner of the n-cube is the product of the coordinate mirrors of its axes: it flips exactly those axes, its number of mirrors is its weight, even corners (the demicube) are rotors; exact for n = 2 to 6, both signatures',
                    'the mirror formula, the twisted sandwich as an isometry of determinant (-1)^k, and parity of a versor, exact on random products of up to 2n+1 vectors, n = 2 to 5',
                    'Cartan-Dieudonne: every such product reduces to at most n mirrors with the same parity, and the reduced versor equals the original up to a scalar, both signatures',
                    'the reflection groups B_n and D_n by closure (n = 2 to 5): orders 2^n n! and 2^(n-1) n!, with the sign changes of D_n exactly the even corners',
                    'the 240 roots of E8: 112 of D8 and the 128 vertices of the 8-demicube, permuted by all 240 mirrors',
                    'the current of a two-mirror spinor in the space-time algebra is a vector with square (psi psi~)^2'],
        'standard': ['reflections as sandwiches, versors, the Pin and Spin groups, the Cartan-Dieudonne theorem, Coxeter groups, the root system of E8'],
        'ours': ['reading the n-cube as the group of coordinate mirrors: its layers by weight count the mirrors, its even half is the demicube, and the demicube vertices of E8 are the even corners of the 8-cube'],
        'open': ['whether the mirrors have any physical role in the model', 'the degenerate case (a null generator) is step 9', 'nothing here selects three generations']}
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    data = build(); js = json.dumps(data, sort_keys=True, indent=1)
    if a.write: open(a.write, 'w').write(js + '\n')
    if a.compare:
        old = json.load(open(a.compare)); assert old == json.loads(js), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL MIRRORS CHECKS PASS')
if __name__ == '__main__': main()
