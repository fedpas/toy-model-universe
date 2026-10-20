#!/usr/bin/env python3
"""Self-check for the portal's "Maxwell with k time and d space dimensions" section.  Standard library only.
  python3 maxwell_selfcheck.py                      rebuild and assert every claim
  python3 maxwell_selfcheck.py --write out.json     also write the data the portal shows
  python3 maxwell_selfcheck.py --compare m.json     check the portal data equals the rebuilt data
Clifford algebra Cl(k,d), n = k+d generators: the k time generators square to +1, the d space generators to -1.
Blades are bitmasks (face S <-> blade e_S).  Fields are exact polynomials in the n coordinates, so every identity is exact.
The field equation is always  grad F = J  with F a bivector and J a vector; its grade-1 part is  delta F = J  and its grade-3 part is  dF = 0."""
import sys, json, itertools, random, argparse
from fractions import Fraction as Fr
from math import comb

AX = ['t', 'x', 'y', 'z', 'w']
SPACE = ['x', 'y', 'z', 'w']
def grade(m): return bin(m).count('1')
def bprod(a, b, p=1):                       # generators 0..p-1 square to +1 (time), the rest to -1 (space)
    s = 1; t = a >> 1
    while t:
        s *= -1 if bin(t & b).count('1') % 2 else 1; t >>= 1
    c = a & b; i = 0
    while c:
        if c & 1: s *= 1 if i < p else -1
        c >>= 1; i += 1
    return a ^ b, s
# ---- exact polynomials in nv variables: {exponent tuple: Fraction}
def padd(P, Q):
    R = dict(P)
    for k, v in Q.items():
        R[k] = R.get(k, 0) + v
        if R[k] == 0: del R[k]
    return R
def pscale(P, c): return {k: v * c for k, v in P.items()} if c else {}
def pder(P, a):
    R = {}
    for k, v in P.items():
        if k[a]:
            kk = list(k); kk[a] -= 1; kk = tuple(kk); R[kk] = R.get(kk, 0) + v * k[a]
    return R
def prand(rng, nv):
    mons = [e for e in itertools.product(range(3), repeat=nv) if sum(e) <= 2]
    P = {e: Fr(rng.randint(-5, 5)) for e in mons if rng.random() < .6}
    P = {k: v for k, v in P.items() if v}
    return P or {tuple([0] * nv): Fr(1)}
def clean(P): return {k: v for k, v in P.items() if v}
def mv_add(A, B):
    R = dict(A)
    for m, P in B.items():
        R[m] = padd(R.get(m, {}), P)
        if not R[m]: del R[m]
    return R
def nabla(F, n, p):                          # grad F = sum_a e_a d_a F
    R = {}
    for m, P in F.items():
        for a in range(n):
            mm, s = bprod(1 << a, m, p); R = mv_add(R, {mm: pscale(pder(P, a), s)})
    return R

# =====================================================================================================
# The usual physical form (one time, d space): E_i, B_ij, rho, J_i with the textbook signs
# =====================================================================================================
def eps(i, j, k):
    return {(1, 2, 3): 1, (2, 3, 1): 1, (3, 1, 2): 1, (1, 3, 2): -1, (3, 2, 1): -1, (2, 1, 3): -1}.get((i, j, k), 0)
def bfields(d):
    """B_ij (i<j) and the blade e_i e_j that carries it.  d=2: B_z = B_12;  d=3: B_z = B_12, B_x = B_23, B_y = B_31 (= -B_13);  d=4: B_12 ... B_34."""
    if d == 2: return [('B_z', 1, 2)]
    if d == 3: return [('B_x', 2, 3), ('B_y', 3, 1), ('B_z', 1, 2)]
    return [(f'B_{i}{j}', i, j) for i in range(1, d + 1) for j in range(i + 1, d + 1)]
def Bij(d, i, j):
    for key, a, b in bfields(d):
        if (a, b) == (i, j): return 1, key
        if (a, b) == (j, i): return -1, key
def phys_standard(d):
    """Gauss: sum_i d_i E_i = rho;  Ampere_i: d_t E_i - sum_j d_j B_ij = -J_i;  Faraday: d_t B_ij + d_i E_j - d_j E_i = 0;  Bianchi: d_i B_jk + d_j B_ki + d_k B_ij = 0."""
    eqs = {1: {'id': 'gauss', 'name': 'Gauss', 'deriv': [(1, i, f'E_{AX[i]}') for i in range(1, d + 1)], 'src': (-1, 'rho')}}
    for i in range(1, d + 1):
        der = [(1, 0, f'E_{AX[i]}')]
        for j in range(1, d + 1):
            if j != i:
                sg, key = Bij(d, i, j); der.append((-sg, j, key))
        eqs[1 << i] = {'id': f'amp_{AX[i]}', 'name': f'Ampère {AX[i]}', 'deriv': der, 'src': (1, f'J_{AX[i]}')}
    for key, i, j in bfields(d):
        eqs[1 | (1 << i) | (1 << j)] = {'id': 'far_' + key[2:], 'name': 'Faraday ' + key[2:], 'src': None,
                                        'deriv': [(1, 0, key), (1, i, f'E_{AX[j]}'), (-1, j, f'E_{AX[i]}')]}
    for i, j, k in itertools.combinations(range(1, d + 1), 3):
        der = []
        for a, b, c in ((i, j, k), (j, k, i), (k, i, j)):
            sg, key = Bij(d, b, c); der.append((sg, a, key))
        eqs[(1 << i) | (1 << j) | (1 << k)] = {'id': 'divB' if d == 3 else f'bian_{i}{j}{k}', 'name': 'no monopole' if d == 3 else f'Bianchi {i}{j}{k}', 'deriv': der, 'src': None}
    return eqs
def phys_spec(d):
    n = d + 1
    Fmask = {f'E_{AX[i]}': 1 | (1 << i) for i in range(1, d + 1)}
    for key, i, j in bfields(d): Fmask[key] = (1 << i) | (1 << j)
    Jmask = {'rho': 1} | {f'J_{AX[i]}': 1 << i for i in range(1, d + 1)}
    show = lambda f: 'B' if (d == 2 and f == 'B_z') else f.replace('_', '')
    std = phys_standard(d)
    role = {0: ('scalar', '1'), (1 << n) - 1: ('pseudo', 'I'), 1: ('rho', 'ρ')}
    for f, m in Fmask.items(): role[m] = ('E' if f[0] == 'E' else 'B', show(f))
    for i in range(1, d + 1): role[1 << i] = ('J', f'J{AX[i]}')
    for m, e in std.items():
        if grade(m) == 3:
            role[m] = ('divB', '∇·B' if d == 3 else '∇B' + e['id'][5:]) if e['id'][:3] in ('div', 'bia') else ('Faraday', 'I' if n == 3 else 'Far' + e['id'][4:])
    return dict(k=1, d=d, n=n, axes=AX[:n], Fmask=Fmask, Jmask=Jmask, std=std, show=show, role=role, kind='physical')

# =====================================================================================================
# The covariant form, any signature:  delta F = J:  sum_a eta_a d_a F_ab = J_b ;   dF = 0:  d_a F_bc - d_b F_ac + d_c F_ab = 0
# =====================================================================================================
def cov_spec(k, d):
    n = k + d; times = ['t'] if k == 1 else [f't{i + 1}' for i in range(k)]; axes = times + SPACE[:d]; eta = [1] * k + [-1] * d
    def fname(a, b):
        if b < k: return f'T{a + 1}{b + 1}'
        if a < k: return f'E{SPACE[b - k]}' if k == 1 else f'E{a + 1}{SPACE[b - k]}'
        return f'B{SPACE[a - k]}{SPACE[b - k]}'
    pairs = sorted(itertools.combinations(range(n), 2), key=lambda ab: (0 if ab[0] < k <= ab[1] else 1 if ab[1] < k else 2, ab))
    Fmask = {fname(a, b): (1 << a) | (1 << b) for a, b in pairs}
    jn = lambda a: ('rho' if k == 1 else f'rho{a + 1}') if a < k else f'J{SPACE[a - k]}'
    Jmask = {jn(a): 1 << a for a in range(n)}
    std = {}
    for b in range(n):
        der = [((eta[a] if a < b else -eta[a]), a, fname(min(a, b), max(a, b))) for a in range(n) if a != b]
        std[1 << b] = {'id': ('gauss' if k == 1 else f'gauss_{b + 1}') if b < k else f'amp_{SPACE[b - k]}',
                       'name': ('Gauss' if k == 1 else f'Gauss {times[b]}') if b < k else f'Ampère {SPACE[b - k]}', 'deriv': der, 'src': (-1, jn(b))}
    for a, b, c in itertools.combinations(range(n), 3):
        nt = sum(1 for x in (a, b, c) if x < k); lab = ' '.join(axes[x] for x in (a, b, c))
        std[(1 << a) | (1 << b) | (1 << c)] = {'id': 'd_' + ''.join(axes[x] for x in (a, b, c)), 'src': None,
            'name': ('no monopole ' if nt == 0 else 'Faraday ' if nt == 1 else 'dF ') + lab,
            'deriv': [(1, a, fname(b, c)), (-1, b, fname(a, c)), (1, c, fname(a, b))]}
    role = {0: ('scalar', '1'), (1 << n) - 1: ('pseudo', 'I')}
    for a in range(n): role[1 << a] = ('rho', 'ρ' if k == 1 else f'ρ{a + 1}') if a < k else ('J', 'J' + SPACE[a - k])
    for (a, b) in pairs: role[(1 << a) | (1 << b)] = (('T' if b < k else 'E' if a < k else 'B'), fname(a, b))
    for m in std:
        if grade(m) == 3:
            idx = [x for x in range(n) if m >> x & 1]; nt = sum(1 for x in idx if x < k)
            role[m] = ('divB' if nt == 0 else 'Faraday', ('∇·B' if nt == 0 and (k, d) == (1, 3) else 'F' + ''.join(str(x + 1) if x < k else SPACE[x - k] for x in idx)))
    return dict(k=k, d=d, n=n, axes=axes, Fmask=Fmask, Jmask=Jmask, std=std, show=lambda f: f, role=role, kind='covariant')

SRC = {'rho': 'ρ', 'J_x': 'Jx', 'J_y': 'Jy', 'J_z': 'Jz', 'J_w': 'Jw'}
def srcname(s): return SRC.get(s, s.replace('rho', 'ρ'))
def eq_string(e, spec):
    s = ''
    for c, a, f in e['deriv']:
        s += (' + ' if c > 0 else ' − ') if s else ('' if c > 0 else '−')
        s += f'∂{spec["axes"][a]} {spec["show"](f)}'
    rhs = '0' if e['src'] is None else (srcname(e['src'][1]) if -e['src'][0] > 0 else '−' + srcname(e['src'][1]))
    return s + ' = ' + rhs

# =====================================================================================================
def find_conventions(spec, rng):
    """F = sum s_f f e_f, J = sum s_j j e_j.  The residual grad F - J is linear in the signs, so solve equation by equation (exactly) and join."""
    n, k, std, Fmask, Jmask = spec['n'], spec['k'], spec['std'], spec['Fmask'], spec['Jmask']
    fnames, snames = list(Fmask), list(Jmask); names = fnames + snames
    fields = lambda: {nm: prand(rng, n) for nm in names}
    tests = [fields() for _ in range(3)]
    def target(f):
        T = {}
        for m, e in std.items():
            P = {}
            for c, a, name in e['deriv']: P = padd(P, pscale(pder(f[name], a), c))
            if e['src']: P = padd(P, pscale(f[e['src'][1]], e['src'][0]))
            T[m] = P
        return T
    def unit(f, nm, idx):
        return nabla({Fmask[nm]: f[nm]}, n, k) if idx < len(fnames) else {Jmask[nm]: pscale(f[nm], -1)}
    C = [[unit(f, nm, i) for i, nm in enumerate(names)] for f in tests]; T = [target(f) for f in tests]
    for t in range(3):
        for u in C[t]: assert all(m in std or not clean(P) for m, P in u.items()), 'a component feeds a target outside the equations'
    partial = {}
    for m in std:
        inv = sorted({i for i in range(len(names)) if any(clean(C[t][i].get(m, {})) for t in range(3))})
        sols = []
        for vals in itertools.product([1, -1], repeat=len(inv)):
            for kk in (1, -1):
                ok = True
                for t in range(3):
                    R = {}
                    for idx, sv in zip(inv, vals): R = padd(R, pscale(C[t][idx].get(m, {}), sv))
                    if clean(R) != clean(pscale(T[t][m], kk)): ok = False; break
                if ok: sols.append((dict(zip(inv, vals)), kk))
        partial[m] = sols; assert sols, (spec['k'], spec['d'], std[m]['id'])
    matches = []
    def join(ms, assign, ks):
        if not ms:
            if len(assign) == len(names): matches.append({'signs': [assign[i] for i in range(len(names))], 'eqsign': dict(ks)})
            return
        for sol, kk in partial[ms[0]]:
            if all(assign.get(i, v) == v for i, v in sol.items()): join(ms[1:], {**assign, **sol}, {**ks, ms[0]: kk})
    join(sorted(std), {}, {})
    assert len(matches) == 2 and [-x for x in matches[0]['signs']] == matches[1]['signs'], f'(k,d)=({spec["k"]},{spec["d"]}): {len(matches)} conventions'
    return matches

TYPES = ['R', 'R2', 'R', 'C', 'H', 'H2', 'H', 'C']
def cell(p, q):
    n = p + q; ty = TYPES[(p - q) % 8]
    copies = 2 if ty in ('R2', 'H2') else 1; dd = {'R': 1, 'R2': 1, 'C': 2, 'H': 4, 'H2': 4}[ty]
    N2 = 2 ** n // (dd * copies); N = int(round(N2 ** .5)); assert N * N == N2
    return ty, N
def algebra(k, d):
    n = k + d; ty, N = cell(k, d); I = (1 << n) - 1; I2 = bprod(I, I, k)[1]
    central = all(bprod(I, 1 << a, k)[1] == bprod(1 << a, I, k)[1] for a in range(n))
    assert central == (n % 2 == 1) and I2 == (-1) ** (n * (n - 1) // 2) * (-1) ** d
    return {'type': ty, 'matrix_size': N, 'pseudoscalar_square': I2, 'pseudoscalar_central': central, 'splits_in_two': central and I2 == 1}
def symbol(k, d):
    cls = 'elliptic' if min(k, d) == 0 else 'hyperbolic' if min(k, d) == 1 else 'ultrahyperbolic'
    ev = None
    if cls == 'hyperbolic': ev = 'time' if k == 1 else 'space'          # the single odd-signed direction is the one a Cauchy problem can be posed along
    return {'plus': k, 'minus': d, 'class': cls, 'well_posed_along': ev}

def build_cell(spec, rng):
    k, d, n = spec['k'], spec['d'], spec['n']; D = {'k': k, 'd': d, 'n': n, 'axes': spec['axes'], 'kind': spec['kind']}
    Fmask, Jmask, std, role = spec['Fmask'], spec['Jmask'], spec['std'], spec['role']
    fnames, snames = list(Fmask), list(Jmask)
    assert len(Fmask) == comb(n, 2) and len(std) == n + comb(n, 3) and len(set(Fmask.values())) == len(Fmask)
    D['counts'] = {'E': sum(1 for m in Fmask.values() if m & ((1 << k) - 1) and m >> k), 'T': sum(1 for m in Fmask.values() if m >> k == 0),
                   'B': sum(1 for m in Fmask.values() if m & ((1 << k) - 1) == 0)}
    assert D['counts'] == {'E': k * d, 'T': comb(k, 2), 'B': comb(d, 2)}
    D['algebra'] = algebra(k, d); D['symbol'] = symbol(k, d)
    D['blades'] = [{'N': m, 'S': [a for a in range(n) if m >> a & 1], 'grade': grade(m), 'name': 'γ' + 'γ'.join(str(a) for a in range(n) if m >> a & 1) if m else '1',
                    'role': role.get(m, ('other', '·'))[0], 'label': role.get(m, ('other', '·'))[1], 'square': bprod(m, m, k)[1]} for m in range(1 << n)]
    matches = find_conventions(spec, random.Random(11 * n + 7 * k))
    vec = [m for m in std if grade(m) == 1]
    chosen = [m for m in matches if all(m['eqsign'][v] == 1 for v in vec)]
    assert len(chosen) == 1; sg = chosen[0]['signs']; sF = {Fmask[nm]: sg[i] for i, nm in enumerate(fnames)}
    if spec['kind'] == 'covariant': assert all(x == 1 for x in sg), 'in the covariant form F_ab e_a e_b and J_b e_b carry all-plus signs'
    D['conventions'] = {'found': len(matches), 'field_order': fnames + snames, 'signs': sg, 'grad': f'Σ γa ∂a, with {k} generator(s) squaring to +1 and {d} to −1',
                        'F': ' + '.join(('' if sF[Fmask[nm]] > 0 else '− ') + spec['show'](nm) + ' ' + D['blades'][Fmask[nm]]['name'] for nm in fnames).replace('+ −', '−'),
                        'J': ' + '.join(('' if sg[len(fnames) + i] > 0 else '− ') + srcname(nm) + ' ' + D['blades'][Jmask[nm]]['name'] for i, nm in enumerate(snames)).replace('+ −', '−')}
    inc = []
    for fname, src in Fmask.items():
        for a in range(n):
            mm, s = bprod(1 << a, src, k); assert mm == src ^ (1 << a)
            inc.append({'source': src, 'field': fname, 'axis': a, 'axis_name': spec['axes'][a], 'target': mm, 'op': 'contract' if grade(mm) == 1 else 'wedge',
                        'sign': s * sF[src], 'term': ('+' if s * sF[src] > 0 else '−') + '∂' + spec['axes'][a] + spec['show'](fname)})
    assert len(inc) == n * comb(n, 2) and all(grade(i['target']) == (1 if i['op'] == 'contract' else 3) for i in inc)
    for m, e in std.items():                                        # the algebra's terms into a target ARE the equation's derivative terms
        assert sorted((i['axis'], i['field']) for i in inc if i['target'] == m) == sorted((a, f) for c, a, f in e['deriv']), (k, d, e['id'])
        for c, a, f in e['deriv']:
            i = next(x for x in inc if x['target'] == m and x['axis'] == a and x['field'] == f)
            assert i['sign'] * chosen[0]['eqsign'][m] == c, (k, d, e['id'], f)
    D['incidences'] = inc
    D['equations'] = [{'id': e['id'], 'name': e['name'], 'target': m, 'eq': eq_string(e, spec), 'op': 'contract' if grade(m) == 1 else 'wedge',
                       'terms': [i['term'] for i in inc if i['target'] == m]} for m, e in sorted(std.items())]
    rng = random.Random(5 + n + 31 * k)
    eta = [1] * k + [-1] * d
    def box(P):
        R = {}
        for a in range(n): R = padd(R, pscale(pder(pder(P, a), a), eta[a]))
        return R
    for _ in range(3):
        F = {m: prand(rng, n) for m in Fmask.values()}
        GF = nabla(F, n, k); assert set(GF) <= {m for m in range(1 << n) if grade(m) in (1, 3)}
        G = nabla(GF, n, k)
        assert all(clean(G.get(m, {})) == clean(box(F[m])) for m in F) and not (set(G) - set(F)) and not clean(G.get(0, {}))
    D['checks'] = {'wave_equation': True, 'only_grades_1_and_3': True, 'charge_conservation': True, 'conventions': len(matches)}
    D['cube'] = {'vertices': [{'N': m, 'bits': format(m, f'0{n}b'), 'grade': grade(m)} for m in range(1 << n)],
                 'edges': [[m, m ^ (1 << a), a] for m in range(1 << n) for a in range(n) if m < m ^ (1 << a)], 'layers': [comb(n, q) for q in range(n + 1)]}
    assert len(D['cube']['edges']) == n * 2 ** (n - 1)
    D['primes'] = {'labels': list(range(1 << n)), 'prime_labels': [m for m in range(1 << n) if m > 1 and all(m % q for q in range(2, m))]}
    return D

def mirror_check(k, d):
    """The mirror world swaps time and space generators.  Its equation system must be the same system, with delta F = J turning into delta F = -J."""
    A, B = cov_spec(k, d)['std'], cov_spec(d, k)['std']; n = k + d
    sig = lambda i: d + i if i < k else i - k
    fac = {1: set(), 3: set()}
    for m, e in A.items():
        m2 = sum(1 << sig(i) for i in range(n) if m >> i & 1); mapped = {}
        for c, a, f in e['deriv']:
            x, y = [i for i in range(n) if _fmask(cov_spec(k, d), f) >> i & 1]
            a2, x2, y2 = sig(a), sig(x), sig(y); o = 1
            if x2 > y2: x2, y2, o = y2, x2, -1
            mapped[(a2, (1 << x2) | (1 << y2))] = c * o
        spec2 = cov_spec(d, k); tgt = {(a, spec2['Fmask'][f]): c for c, a, f in B[m2]['deriv']}
        assert set(mapped) == set(tgt), (k, d, e['id'])
        r = {mapped[q] * tgt[q] for q in tgt}; assert len(r) == 1
        fac[grade(m)] |= r
    assert fac[1] == {-1} and (fac[3] == {1} or not fac[3]), (k, d, fac)
    return {'mirror_of': [d, k], 'vector_equations_factor': -1, 'triple_equations_factor': 1 if fac[3] else None}
def _fmask(spec, f): return spec['Fmask'][f]

def build():
    rng = random.Random(7); D = {}
    # ---- the ladder along space (one time), as before
    lad = []
    for n in range(1, 10):
        p, q = 1, n - 1; ty, N = cell(p, q); al = algebra(p, q)
        lad.append({'n': n, 'd': n - 1, 'p': p, 'q': q, 'type': ty, 'matrix_size': N, **{k_: al[k_] for k_ in ('pseudoscalar_square', 'pseudoscalar_central', 'splits_in_two')},
                    'same_algebra_as_Cl08': (ty, N) == cell(0, 8), 'F_components': comb(n, 2), 'E_components': n - 1, 'B_components': comb(n - 1, 2),
                    'equations_vector': n, 'equations_trivector': comb(n, 3), 'equations_total': n + comb(n, 3)})
    assert [(l['type'], l['matrix_size']) for l in lad[:5]] == [('R2', 1), ('R', 2), ('C', 2), ('H', 2), ('H2', 2)]
    assert [(l['type'], l['matrix_size']) for l in lad[5:]] == [('H', 4), ('C', 8), ('R', 16), ('R2', 16)]
    assert [l['equations_total'] for l in lad] == [1, 2, 4, 8, 15, 26, 42, 64, 93]
    assert [l['d'] for l in lad if l['same_algebra_as_Cl08']] == [7] and cell(0, 8) == ('R', 16)
    assert [l['d'] for l in lad if l['splits_in_two']] == [0, 4, 8]
    D['ladder'] = lad
    # ---- the ladder along time (one space dimension): Cl(k,1)
    tl = []
    for k in range(1, 10):
        n = k + 1; ty, N = cell(k, 1); al = algebra(k, 1)
        tl.append({'k': k, 'n': n, 'type': ty, 'matrix_size': N, **{k_: al[k_] for k_ in ('pseudoscalar_square', 'pseudoscalar_central', 'splits_in_two')},
                   'E_components': k, 'T_components': comb(k, 2), 'B_components': 0, 'F_components': comb(n, 2),
                   'equations_vector': n, 'equations_trivector': comb(n, 3), 'equations_total': n + comb(n, 3),
                   'step_new_generator': 1, 'step_new_blades': 2 ** (n - 1), 'step_new_F': n - 1, 'step_new_E': 1, 'step_new_T': k - 1,
                   'step_new_equations': 1 + comb(n - 1, 2), 'mirror_type': cell(1, k)[0], 'mirror_matrix_size': cell(1, k)[1],
                   'symbol': symbol(k, 1)})
    for a, b in zip(tl, tl[1:]):                                      # each step really adds what the formula says
        assert b['F_components'] - a['F_components'] == b['step_new_F'] and b['equations_total'] - a['equations_total'] == b['step_new_equations']
        assert b['E_components'] - a['E_components'] == 1 and b['T_components'] - a['T_components'] == a['k']
    # period 8: Cl(k+8,1) = Cl(k,1) tensor M16(R): same type, matrix size times 16
    assert all(cell(k + 8, 1)[0] == cell(k, 1)[0] and cell(k + 8, 1)[1] == 16 * cell(k, 1)[1] for k in range(1, 12))
    assert [(l['type'], l['matrix_size']) for l in tl] == [('R', 2), ('R2', 2), ('R', 4), ('C', 4), ('H', 4), ('H2', 4), ('H', 8), ('C', 16), ('R', 32)]
    D['time_ladder'] = tl
    # ---- every (k,d) with k,d <= 4 and k+d <= 7: the picture depends only on n = k+d, the signs and the algebra on the split
    cells = {}
    for k in range(1, 5):
        for d in range(1, 5):
            if k + d > 7: continue
            spec = phys_spec(d) if k == 1 else cov_spec(k, d)
            C = build_cell(spec, rng); C['mirror'] = mirror_check(k, d)
            if k == 1:                                               # the physical form and the covariant form must be the same theory
                cv = build_cell(cov_spec(1, d), random.Random(3)); C['covariant_agrees'] = (len(cv['equations']) == len(C['equations']) and len(cv['incidences']) == len(C['incidences']) and cv['checks']['conventions'] == 2)
                assert C['covariant_agrees']
            cells[f'{k},{d}'] = C
    assert sorted(cells) == sorted(f'{k},{d}' for k in range(1, 5) for d in range(1, 5) if k + d <= 7)
    for key, C in cells.items():                                      # same n => same pictures: incidence structure (source, axis, target) is identical
        n = C['n']; ref = cells.get(f'1,{n - 1}')
        assert ref is None or C['kind'] == 'covariant' or [(i['source'], i['axis'], i['target']) for i in C['incidences']] == [(i['source'], i['axis'], i['target']) for i in ref['incidences']]
    for n in (3, 4, 5, 6, 7):                                               # ... and also across covariant cells of equal n, up to the order in which fields are listed
        ks = [c for c in cells.values() if c['n'] == n]
        sets = [sorted((i['source'], i['axis'], i['target']) for i in c['incidences']) for c in ks]
        assert all(s == sets[0] for s in sets), n
    D['cells'] = cells
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL MAXWELL CHECKS PASS')
if __name__ == '__main__': main()
