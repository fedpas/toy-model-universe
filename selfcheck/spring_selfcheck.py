#!/usr/bin/env python3
"""A spring on the bit rule: one oscillator as a rotor, and a spring network on the cube (vertices = masses, edges = springs, faces = compatibility).
Exact rational arithmetic, standard library only.
  python3 spring_selfcheck.py                 run every check
  python3 spring_selfcheck.py --write f.json  also write the data
  python3 spring_selfcheck.py --compare f.json  check that the data equals the file
  python3 spring_selfcheck.py --row B5        print the checks of one row only
What is new here is only the arrangement; Hooke's law, the hypercube Laplacian and its Walsh modes, and the signed hypercube matrix A^2 = n I (used by Huang in 2019) are standard.
"""
import argparse, itertools, json, sys
from fractions import Fraction as F
from math import comb, factorial

RES = []
def row(id, claim, ok, detail=None):
    RES.append({'id': id, 'claim': claim, 'ok': bool(ok), 'detail': detail}); assert ok, f'{id}: {claim} {detail or ""}'

# ---------------------------------------------------------------- the bit rule (the same product as the atlas)
def pc(x): return bin(x).count('1')
def bmul(a, b, sq):
    s = 1; t = a >> 1
    while t:
        if pc(t & b) & 1: s = -s
        t >>= 1
    c = a & b
    for i in range(len(sq)):
        if c >> i & 1: s *= sq[i]
    return s, a ^ b
class MV:
    def __init__(s, sq, d=None): s.sq = sq; s.d = {k: v for k, v in (d or {}).items() if v != 0}
    def __add__(s, o): r = dict(s.d); [r.__setitem__(k, r.get(k, 0) + v) for k, v in o.d.items()]; return MV(s.sq, r)
    def scale(s, c): return MV(s.sq, {k: v * c for k, v in s.d.items()})
    def __mul__(s, o):
        r = {}
        for a, x in s.d.items():
            for b, y in o.d.items():
                sg, m = bmul(a, b, s.sq)
                if sg: r[m] = r.get(m, 0) + sg * x * y
        return MV(s.sq, r)
    def __eq__(s, o): return s.d == o.d
    def get(s, m): return s.d.get(m, 0)

def taylor(kind, w, N):
    """coefficients of cos/cosh/sin/sinh(w t) up to t^N"""
    out = []
    for k in range(N + 1):
        if kind == 'cos': c = F((-1) ** (k // 2) * w ** k, factorial(k)) if k % 2 == 0 else F(0)
        elif kind == 'cosh': c = F(w ** k, factorial(k)) if k % 2 == 0 else F(0)
        elif kind == 'sin': c = F((-1) ** (k // 2) * w ** k, factorial(k)) if k % 2 == 1 else F(0)
        elif kind == 'sinh': c = F(w ** k, factorial(k)) if k % 2 == 1 else F(0)
        out.append(c)
    return out

# ---------------------------------------------------------------- A. one oscillator is a rotor, and the three kinds of i are three motions
def oscillator(N=12, w=2):
    """phase vector s = x u + p u... s = x u + q v, with q = p/(m w). Evolution s' = w B s with B = u v: s(t) = sum (w t)^k B^k s0 / k!"""
    out = {}
    for name, (a, b) in {'harmonic': (1, 1), 'inverted': (1, -1), 'free': (0, 1)}.items():
        sq = [a, b]; u = MV(sq, {1: F(1)}); v = MV(sq, {2: F(1)}); B = u * v; Bsq = int((B * B).get(0))
        # series: s(t) as a list of coefficient multivectors; start with s0 = x0 u + q0 v
        x0, q0 = F(3), F(5)
        s0 = u.scale(x0) + v.scale(q0); terms = [s0]
        for k in range(1, N + 1): terms.append((B * terms[-1]).scale(F(w, k)))   # (w B)^k s0 / k!  (the factor w^k / k! built step by step)
        xs = [t.get(1) for t in terms]; qs = [t.get(2) for t in terms]
        # x'' = w^2 B^2-law: coefficients of x'' equal (-a b) w^2 x
        k2 = -a * b
        ok_ode = all((k + 2) * (k + 1) * xs[k + 2] == k2 * w * w * xs[k] for k in range(N - 1))
        if name == 'harmonic': ref = [x0 * c1 + q0 * c2 for c1, c2 in zip(taylor('cos', w, N), taylor('sin', w, N))]; matches = (xs == ref)
        elif name == 'inverted': ref = [x0 * c1 - q0 * c2 for c1, c2 in zip(taylor('cosh', w, N), taylor('sinh', w, N))]; matches = (xs == ref)
        else: ref = [x0, w * q0] + [F(0)] * (N - 1); matches = (xs == ref) and qs == [q0] + [F(0)] * N
        row('A1', f'{name} case: B^2 = {Bsq}, x\'\' = {k2 * w * w} x as exact power series and the closed form (cos, cosh, straight line) matches', ok_ode and matches, f'(a,b)=({a},{b})')
        out[name] = {'signature': [a, b], 'B_squared': Bsq, 'x_double_dot_coefficient': k2 * w * w, 'ode_exact': ok_ode}
    # the invariant of the harmonic case is s^2 = x^2 + q^2, a scalar, constant in time: the energy
    sq = [1, 1]; u = MV(sq, {1: F(1)}); v = MV(sq, {2: F(1)}); B = u * v
    s0 = u.scale(F(3)) + v.scale(F(5)); terms = [s0]
    for k in range(1, N + 1): terms.append((B * terms[-1]).scale(F(w, k)))
    E = [F(0)] * (N + 1)                                    # s(t)^2 as a series, coefficient t^m
    for i in range(N + 1):
        for j in range(N + 1 - i): E[i + j] += (terms[i] * terms[j]).get(0)
    row('A2', 'harmonic case: s^2 = x^2 + q^2 is constant to order N (every coefficient t^1..t^N vanishes), the energy', E[0] == 34 and all(c == 0 for c in E[1:]), f'x0=3, q0=5: {E[0]}')
    # the half angle: the rotor acts by a sandwich R s R~ with R = exp(w t B / 2); the sandwich runs at the same speed as s' = w B s, a full-angle rotor would run twice as fast
    half = [F(1)]; Rt = []
    # R = sum (w t B/2)^k / k!, R~ = sum (-w t B/2)^k / k!  (B~ = -B)
    R = [MV(sq, {0: F(1)})]
    for k in range(1, N + 1): R.append((B * R[-1]).scale(F(w, 2 * k)))
    Rr = [MV(sq, {0: F(1)})]
    for k in range(1, N + 1): Rr.append((B * Rr[-1]).scale(F(-w, 2 * k)))
    prod = [MV(sq, {}) for _ in range(N + 1)]
    for i in range(N + 1):
        for j in range(N + 1 - i):
            prod[i + j] = prod[i + j] + (R[i] * s0 * Rr[j])
    row('A3', 'the sandwich R s R~ with the HALF angle R = exp(w t B / 2) gives the same x(t) as s\' = w B s (the double cover: a spinor turns half as fast)', [p.get(1) for p in prod] == [t.get(1) for t in terms], 'orders 0..N')
    # full-angle control: R = exp(w t B) in the sandwich runs at 2w, so it fails
    R2 = [MV(sq, {0: F(1)})]
    for k in range(1, N + 1): R2.append((B * R2[-1]).scale(F(w, k)))
    R2r = [MV(sq, {0: F(1)})]
    for k in range(1, N + 1): R2r.append((B * R2r[-1]).scale(F(-w, k)))
    prod2 = [MV(sq, {}) for _ in range(N + 1)]
    for i in range(N + 1):
        for j in range(N + 1 - i): prod2[i + j] = prod2[i + j] + (R2[i] * s0 * R2r[j])
    row('A4', 'negative control: the sandwich with the FULL angle runs twice as fast and does not reproduce the oscillator', [p.get(1) for p in prod2] != [t.get(1) for t in terms])
    return out

# ---------------------------------------------------------------- B. the cube as a spring network
def cube(n):
    V = list(range(1 << n)); E = [(x, x | (1 << i), i) for x in V for i in range(n) if not x >> i & 1]
    Fc = []
    for i, j in itertools.combinations(range(n), 2):
        for x in V:
            if not (x >> i & 1) and not (x >> j & 1): Fc.append((x, i, j))
    return V, E, Fc
def matmul(A, B): return [[sum(a * b for a, b in zip(r, c)) for c in zip(*B)] for r in A]
def transpose(A): return [list(c) for c in zip(*A)]
def rank(M):
    M = [[F(x) for x in r] for r in M]; r = 0
    for c in range(len(M[0]) if M else 0):
        p = next((i for i in range(r, len(M)) if M[i][c] != 0), None)
        if p is None: continue
        M[r], M[p] = M[p], M[r]
        for i in range(len(M)):
            if i != r and M[i][c] != 0:
                f = M[i][c] / M[r][c]; M[i] = [a - f * b for a, b in zip(M[i], M[r])]
        r += 1
    return r
def boundaries(n):
    V, E, Fc = cube(n); ei = {(a, b): k for k, (a, b, i) in enumerate(E)}
    d1 = [[0] * len(E) for _ in V]                          # edge (a -> b): boundary = b - a
    for k, (a, b, i) in enumerate(E): d1[b][k] = 1; d1[a][k] = -1
    d2 = [[0] * len(Fc) for _ in E]                         # face x, i<j: x -> x+i -> x+i+j -> x+j -> x
    for k, (x, i, j) in enumerate(Fc):
        xi, xj, xij = x | 1 << i, x | 1 << j, x | 1 << i | 1 << j
        d2[ei[(x, xi)]][k] += 1; d2[ei[(xi, xij)]][k] += 1; d2[ei[(xj, xij)]][k] -= 1; d2[ei[(x, xj)]][k] -= 1
    return V, E, Fc, d1, d2

def walsh(n, s): return [(-1) ** pc(x & s) for x in range(1 << n)]
def matvec(A, v): return [sum(a * b for a, b in zip(r, v)) for r in A]

def network(ns=(2, 3, 4, 5)):
    out = {}
    for n in ns:
        V, E, Fc, d1, d2 = boundaries(n); nv, ne, nf = len(V), len(E), len(Fc)
        row('B1', f'Q_{n}: counts V = {nv}, E = {ne} = n 2^(n-1), F = {nf} = C(n,2) 2^(n-2)', ne == n * 2 ** (n - 1) and nf == comb(n, 2) * 2 ** (n - 2) and nv == 2 ** n)
        z = matmul(d1, d2); row('B2', f'Q_{n}: the boundary of a face has no boundary, d1 d2 = 0 (the faces close up)', all(x == 0 for r in z for x in r))
        r1, r2 = rank(d1), rank(d2); b0 = nv - r1; b1 = ne - r1 - r2; b2 = nf - r2
        row('B3', f'Q_{n}: Betti numbers of the vertex-edge-face complex: b0 = {b0}, b1 = {b1}, b2 = {b2}; Euler: V - E + F = b0 - b1 + b2', b0 == 1 and b1 == 0 and nv - ne + nf == b0 - b1 + b2, f'V-E+F={nv - ne + nf}')
        L = matmul(d1, transpose(d1)); adj = [[(1 if pc(i ^ j) == 1 else 0) for j in V] for i in V]
        row('B4', f'Q_{n}: the spring matrix d1 d1^T is the Laplacian n I - adjacency', all(L[i][j] == (n if i == j else -adj[i][j]) for i in V for j in V))
        modes = {}
        for s in range(nv):
            w = walsh(n, s); Lw = matvec(L, w); assert all(Lw[i] == 2 * pc(s) * w[i] for i in V)
            modes[pc(s)] = modes.get(pc(s), 0) + 1
        row('B5', f'Q_{n}: every Walsh vector is a normal mode with omega^2 = 2|s| (k = 1, m = 1); multiplicity C(n, j) at omega^2 = 2j', all(modes[j] == comb(n, j) for j in range(n + 1)), str(sorted(modes.items())))
        nul = [nv - rank([[L[i][j] - (2 * j0 if i == j else 0) for j in V] for i in V]) for j0 in range(n + 1)]
        row('B6', f'Q_{n}: the multiplicities are also the nullities of L - 2j I (independent check)', nul == [comb(n, j) for j in range(n + 1)], str(nul))
        # faces: the strain of any displacement closes around every face; a general edge field does not
        x = [F((7 * i * i + 3 * i + 1) % 11) for i in V]; strain = [sum(d1[i][k] * x[i] for i in V) for k in range(ne)]
        curl = [sum(d2[e][f] * strain[e] for e in range(ne)) for f in range(nf)]
        row('B7', f'Q_{n}: the strain of a displacement sums to zero around every face (compatibility)', all(c == 0 for c in curl))
        gen = [F((5 * k * k + 2) % 7) for k in range(ne)]; curl2 = [sum(d2[e][f] * gen[e] for e in range(ne)) for f in range(nf)]
        row('B8', f'Q_{n}: negative control, an arbitrary edge field does not close around the faces', any(c != 0 for c in curl2))
        out[str(n)] = {'V': nv, 'E': ne, 'F': nf, 'betti': [b0, b1, b2], 'euler': nv - ne + nf, 'modes': {str(k): v for k, v in sorted(modes.items())}}
    return out

def series_energy(L, x0, v0, M):
    """x(t) = sum (-L)^j x0 t^(2j)/(2j)! + sum (-L)^j v0 t^(2j+1)/(2j+1)!; returns the series of E = 1/2 |x'|^2 + 1/2 x^T L x up to the degree where it is exact"""
    nv = len(x0); N = 2 * M
    X = [[F(0)] * nv for _ in range(N + 2)]
    cur = x0[:]
    for j in range(M + 1):
        c = F((-1) ** j, factorial(2 * j))
        for i in range(nv): X[2 * j][i] += c * cur[i]
        cur = matvec(L, cur)
    cur = v0[:]
    for j in range(M + 1):
        c = F((-1) ** j, factorial(2 * j + 1))
        for i in range(nv): X[2 * j + 1][i] += c * cur[i]
        cur = matvec(L, cur)
    dX = [[(k + 1) * X[k + 1][i] for i in range(nv)] for k in range(N + 1)]
    LX = [matvec(L, X[k]) for k in range(N + 2)]
    E = [F(0)] * (N + 1)
    for a in range(N + 1):
        for b in range(N + 1 - a):
            E[a + b] += F(1, 2) * sum(dX[a][i] * dX[b][i] for i in range(nv)) + F(1, 2) * sum(X[a][i] * LX[b][i] for i in range(nv))
    return X, E

def dynamics(n=3, M=7):
    V, E, Fc, d1, d2 = boundaries(n); L = matmul(d1, transpose(d1)); nv = len(V)
    x0 = [F((3 * i + 1) % 5) for i in V]; v0 = [F((2 * i + 3) % 4) for i in V]
    X, En = series_energy(L, x0, v0, M)
    row('C1', f'Q_{n}: the exact power-series solution of x\'\' = -L x conserves the spring energy: all coefficients of t^1 .. t^{2 * M} vanish (degrees above are cut off by the truncation)', all(c == 0 for c in En[1:2 * M]) and En[0] != 0, f'E0={En[0]}')
    # one mode, closed form: x0 = w_s, v0 = 0 -> x(t) = cos(sqrt(2|s|) t) w_s
    s = 0b101 if n >= 3 else 0b11; w = walsh(n, s); Xm, _ = series_energy(L, [F(c) for c in w], [F(0)] * nv, M)
    om2 = 2 * pc(s); ref = [F((-om2) ** j, factorial(2 * j)) for j in range(M + 1)]
    row('C2', f'Q_{n}: the mode s = {s:0{n}b} oscillates as cos(sqrt({om2}) t) (series equals the cosine series)', all(Xm[2 * j][i] == ref[j] * w[i] for j in range(M + 1) for i in V))
    wrongL = [[(0 if (i == 0 and j != 0) else L[i][j]) for j in V] for i in V]      # a broken network: the springs of vertex 0 pull on others but are not pulled back (Newton's third law broken)
    Xw, Ew = series_energy(wrongL, x0, v0, M)
    row('C3', 'negative control: a network that breaks the third law of Newton (vertex 0 is pushed by the others but does not push back, L not symmetric) does not conserve the energy', any(c != 0 for c in Ew[1:2 * M]))
    # plucking one vertex: x0 = delta_v, v0 = 0. The closed form x(t) = 2^-n sum_s w_s(v) cos(sqrt(2|s|) t) w_s equals the exact series coefficient by coefficient
    v0_ = 5 if nv > 5 else 1; delta = [F(1) if i == v0_ else F(0) for i in V]; Xd, _ = series_energy(L, delta, [F(0)] * nv, M)
    ok_p = all(Xd[2 * j][i] == sum(F(walsh(n, s_)[v0_] * walsh(n, s_)[i] * (-2 * pc(s_)) ** j, (1 << n) * factorial(2 * j)) for s_ in V) for j in range(M + 1) for i in V)
    row('C4', f'Q_{n}: plucking one vertex: x(t) = 2^-n sum_s w_s(v) cos(sqrt(2|s|) t) w_s agrees with the exact series, coefficient by coefficient (t^0 .. t^{2 * M})', ok_p, f'vertex {v0_}')
    return {'n': n, 'order': 2 * M, 'E0': str(En[0])}

# ---------------------------------------------------------------- C. the Clifford network: the same edges with the sign of the generator, flux pi through every face
def signed(ns=(2, 3, 4, 5)):
    out = {}
    for n in ns:
        sq = [1] * n; V = range(1 << n)
        D = [[0] * (1 << n) for _ in V]                         # D = sum_i (left multiplication by e_i) on the blade basis
        for x in V:
            for i in range(n):
                sg, m = bmul(1 << i, x, sq); D[m][x] += sg
        sym = all(D[i][j] == D[j][i] for i in V for j in V)
        D2 = matmul(D, D); row('D1', f'Cl({n},0): D = sum of left multiplications by the generators is symmetric and D^2 = n I (the cross terms cancel because the generators anticommute)', sym and all(D2[i][j] == (n if i == j else 0) for i in V for j in V))
        flux = []
        for i, j in itertools.combinations(range(n), 2):
            for x in V:
                if x >> i & 1 or x >> j & 1: continue
                h = D[x ^ 1 << i][x] * D[x ^ 1 << i ^ 1 << j][x ^ 1 << i] * D[x ^ 1 << j][x ^ 1 << i ^ 1 << j] * D[x][x ^ 1 << j]; flux.append(h)
        row('D2', f'Cl({n},0): the sign product around every face is -1 (flux pi through each of the {len(flux)} faces); for the plain spring it is +1', all(h == -1 for h in flux), f'{len(flux)} faces')
        K = [[(n if i == j else 0) - D[i][j] for j in V] for i in V]
        # K^2 - 2 n K + (n^2 - n) I = 0  ->  K has only the two eigenvalues n +- sqrt(n)
        KK = matmul(K, K); ok = all(KK[i][j] - 2 * n * K[i][j] + ((n * n - n) if i == j else 0) == 0 for i in V for j in V)
        tr = sum(D[i][i] for i in V)
        row('D3', f'Cl({n},0): the signed spring matrix K = n I - D satisfies K^2 - 2n K + (n^2 - n) I = 0 and tr D = 0: two frequencies^2, n +- sqrt(n), each 2^(n-1) times; the plain spring has {n + 1} levels', ok and tr == 0, f'n={n}')
        # the signed matrix is a genuine spring energy: x^T K x = sum over edges (x_i - D_ij x_j)^2, each spring compares one mass with the sign-twisted coordinate of its neighbour; the plain one is the same with every sign +1
        xs = [F((5 * i * i + 3 * i + 2) % 9 - 4) for i in V]; edges = [(a, a | 1 << i) for a in V for i in range(n) if not a >> i & 1]
        e_signed = sum((xs[a] - D[a][b] * xs[b]) ** 2 for a, b in edges); e_plain = sum((xs[a] - xs[b]) ** 2 for a, b in edges)
        quad = lambda M_: sum(xs[i] * M_[i][j] * xs[j] for i in V for j in V)
        Lp = [[(n if i == j else 0) - (1 if pc(i ^ j) == 1 else 0) for j in V] for i in V]
        row('D5', f'Cl({n},0): the signed matrix is a spring energy: x^T K x = sum over the {len(edges)} edges of (x_i - s_ij x_j)^2 with s_ij = the sign of the generator; the plain one has every s_ij = +1', quad(K) == e_signed and quad(Lp) == e_plain and all(abs(D[a][b]) == 1 for a, b in edges))
        out[str(n)] = {'faces': len(flux), 'frequencies_squared': f'{n} +- sqrt({n})', 'multiplicity_each': 2 ** (n - 1), 'plain_levels': n + 1}
    # the signed network is a spring network too: its energy is conserved exactly
    n = 3; sq = [1] * n; V = range(8); D = [[0] * 8 for _ in V]
    for x in V:
        for i in range(n):
            sg, m = bmul(1 << i, x, sq); D[m][x] += sg
    K = [[(n if i == j else 0) - D[i][j] for j in V] for i in V]
    X, En = series_energy(K, [F((3 * i + 1) % 5) for i in V], [F((2 * i + 3) % 4) for i in V], 7)
    row('D4', 'Cl(3,0): the signed network also conserves its energy, exact power series through t^14', all(c == 0 for c in En[1:14]) and En[0] != 0)
    return out


# ---------------------------------------------------------------- E. the labels of the spinor paper are the normal modes of the cube
def labels_are_modes(n=4):
    sq = [1] * n; ok_even = ok_odd = True; cnt = 0
    for m in range(1 << n):
        bm = MV(sq, {m: F(1)}); inv = bm.scale(F(1, (bm * bm).get(0)))        # e_m^-1 = e_m / e_m^2
        for x in range(1 << n):
            ex = MV(sq, {x: F(1)}); got = bm * ex * inv; chi = (-1) ** pc(x & m)
            if pc(m) % 2 == 0: ok_even &= (got == ex.scale(chi))
            else: ok_odd &= (got == ex.scale(chi * (-1) ** pc(x)))
            cnt += 1
    row('E1', f'Cl({n},0): conjugation of e_x by an even blade e_m is the Walsh character (-1)^|x&m| (the spinor paper\'s label), and by an odd blade it is that character times (-1)^|x|; {cnt} pairs', ok_even and ok_odd)
    return {'n': n, 'pairs': cnt, 'omega_squared_of_label_m': '2 |m|'}

def run():
    global RES
    RES = []
    data = {'oscillator': oscillator(), 'cube': network(), 'dynamics': dynamics(), 'clifford': signed(), 'labels': labels_are_modes()}
    data['summary'] = {'rows': len(RES), 'ok': sum(r['ok'] for r in RES)}
    ids = sorted({r['id'] for r in RES}); data['rows'] = [{'id': i, 'checks': sum(1 for r in RES if r['id'] == i), 'ok': all(r['ok'] for r in RES if r['id'] == i)} for i in ids]
    return json.loads(json.dumps(data))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); ap.add_argument('--row', help='print only the checks of one row, for example --row B5'); a = ap.parse_args()
    data = run(); seen = {}
    if a.row:
        hit = [r for r in RES if r['id'] == a.row]
        if not hit: sys.exit(f'no row {a.row}; rows are ' + ', '.join(sorted({r['id'] for r in RES})))
        for r in hit: print(('ok  ' if r['ok'] else 'FAIL') + f" {r['id']}: {r['claim']}" + (f" [{r['detail']}]" if r['detail'] else ''))
        print(f'{sum(r["ok"] for r in hit)}/{len(hit)} checks hold'); sys.exit(0 if all(r['ok'] for r in hit) else 1)
    for r in RES: seen.setdefault(r['id'], []).append(r['ok'])
    for k in sorted(seen): print(f'{k:3s} {sum(seen[k])}/{len(seen[k])} checks')
    print(f"\n{data['summary']['ok']}/{data['summary']['rows']} claims hold.  ALL SPRING CHECKS PASS")
    if a.write: json.dump(data, open(a.write, 'w'), indent=1, ensure_ascii=False); print('wrote', a.write)
    if a.compare: assert json.load(open(a.compare)) == data, 'the data differs from the rebuilt data'; print('data == rebuilt data')
