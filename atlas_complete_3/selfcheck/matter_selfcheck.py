#!/usr/bin/env python3
"""Matter charged under so(m): the Dirac field of step 3 gets an internal index.  Exact arithmetic, standard library only.
  python3 matter_selfcheck.py                          run all checks
  python3 matter_selfcheck.py --write matter.json      also write the data
  python3 matter_selfcheck.py --compare matter.json    assert the portal data equals the rebuilt data
The field is Psi = sum Psi_{S,T} e_S x eps_T : S an even blade of the space-time algebra Cl(1,n-1), T a blade of the internal algebra Cl(0,m)
(all internal generators square to -1).  The gauge algebra of step 4, the bivectors B_a of Cl(0,m), acts by LEFT multiplication on the internal blade:
    D_mu Psi = d_mu Psi + g A^a_mu B_a Psi            [D_mu, D_nu] Psi = g F_mu_nu Psi
    E := sum_mu gamma^mu (D_mu Psi) J  -  m Psi gamma_0 = 0         J = gamma_2 gamma_1 (as in step 3)
    current of the generator a:   j^a_nu = sum_T < Psi~_T gamma^nu (B_a Psi)_T gamma_0 J >_0       (scalar part, space-time algebra)
Checked exactly: the commutator identity, first-order gauge covariance of E, adjoint covariance of j, and  D^nu j^a_nu = 0  at points where E = 0.
The abelian current X = psi gamma_0 psi~ of step 3 is the same formula for the generator 'multiply by J on the right'."""
import argparse, itertools, json, random
from fractions import Fraction as F
from math import comb

def popc(x): return bin(x).count('1')
def rsign(k): return -1 if (k * (k - 1) // 2) % 2 else 1
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
def cell_data(p, q):
    n = p + q
    if n == 0: return (1, 'R', 1)
    k = KIND[(p - q) % 8]; copies = 2 if k.endswith('2') else 1; base = k[0]
    N2 = 2 ** n // (copies * DIMK[base]); N = int(round(N2 ** 0.5)); assert N * N == N2
    return (N, base, copies)
def cell_name(p, q):
    N, b, c = cell_data(p, q); return ('M%d(%s)' % (N, b)) + (' + M%d(%s)' % (N, b) if c == 2 else '')
def sq_space(n): return [1] + [-1] * (n - 1)

# ------------------------------------------------------------------------------------------------ the gauge algebra (as in step 4)
def algebra(m):
    sq = [-1] * m; gens = [(1 << i) | (1 << j) for i in range(m) for j in range(i + 1, m)]; idx = {g: k for k, g in enumerate(gens)}; f = {}
    for a, ga in enumerate(gens):
        for b, gb in enumerate(gens):
            m1, s1 = bmul(ga, gb, sq); m2, s2 = bmul(gb, ga, sq)
            if s1 != s2: f[(a, b)] = {idx[m1]: s1 - s2}
    return gens, idx, f

# ------------------------------------------------------------------------------------------------ polynomials in the n space-time coordinates
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
def rpoly(rng, n, deg, density):
    mons = [e for e in itertools.product(range(deg + 1), repeat=n) if sum(e) <= deg]
    return {e: F(rng.randint(-3, 3)) for e in mons if rng.random() < density} or {(0,) * n: F(1)}

# ------------------------------------------------------------------------------------------------ the matter field: dict (S, T) -> polynomial
class Sys:
    def __init__(self, n, m, g=F(3), mass=F(5)):
        self.n, self.m, self.g, self.mass = n, m, g, mass; self.sq = sq_space(n); self.sqi = [-1] * m
        self.gens, self.idx, self.f = algebra(m); self.G = len(self.gens)
        self.ev = [S for S in range(1 << n) if popc(S) % 2 == 0]; self.Ts = list(range(1 << m)); self.Jm = 6   # J = gamma_2 gamma_1 = - (mask 6)
    def lmul(self, a, Psi):                       # internal left multiplication by generator a
        out = {}
        for (S, T), p in Psi.items():
            t, s = bmul(self.gens[a], T, self.sqi); out[(S, t)] = padd(out.get((S, t), {}), p, s)
        return out
    def gam_left(self, mu, Psi):                  # gamma^mu = sq_mu gamma_mu
        out = {}
        for (S, T), p in Psi.items():
            t, s = bmul(1 << mu, S, self.sq); out[(t, T)] = padd(out.get((t, T), {}), p, s * self.sq[mu])
        return out
    def right(self, mask, coef, Psi):
        out = {}
        for (S, T), p in Psi.items():
            t, s = bmul(S, mask, self.sq); out[(t, T)] = padd(out.get((t, T), {}), p, s * coef)
        return out
    def rJ(self, Psi): return self.right(self.Jm, -1, Psi)
    def r0(self, Psi): return self.right(1, 1, Psi)
def fadd(X, Y, c=1):
    r = dict(X)
    for k, p in Y.items():
        x = padd(r.get(k, {}), p, c)
        if x: r[k] = x
        else: r.pop(k, None)
    return r
def fder(X, mu): return {k: q for k, p in X.items() for q in [pder(p, mu)] if q}
def fmulp(a, X): return {k: q for k, p in X.items() for q in [pmul(a, p)] if q}
def Dmu(Y, A, Psi, mu):
    r = fder(Psi, mu)
    for a in range(Y.G):
        if A[mu][a]: r = fadd(r, fmulp(A[mu][a], Y.lmul(a, Psi)), Y.g)
    return r
def Eop(Y, A, Psi):
    tot = {}
    for mu in range(Y.n): tot = fadd(tot, Y.rJ(Y.gam_left(mu, Dmu(Y, A, Psi, mu))))
    return fadd(tot, Y.r0(Psi), -Y.mass)
def Fcomp(Y, A, mu, nu):
    F_ = [padd(pder(A[nu][a], mu), pder(A[mu][a], nu), -1) for a in range(Y.G)]
    for (b, c), d in Y.f.items():
        p = pmul(A[mu][b], A[nu][c])
        for a, v in d.items(): F_[a] = padd(F_[a], p, Y.g * v)
    return F_

# ------------------------------------------------------------------------------------------------ polynomial identities
def poly_identities(n, m, seed):
    rng = random.Random(seed); Y = Sys(n, m); G = Y.G
    A = [[rpoly(rng, n, 1, .6) for _ in range(G)] for _ in range(n)]
    Psi = {(S, T): rpoly(rng, n, 1, .5) for S in Y.ev for T in Y.Ts}
    for mu, nu in itertools.combinations(range(n), 2):                            # (a) [D_mu, D_nu] Psi = g F_mn Psi
        c = fadd(Dmu(Y, A, Dmu(Y, A, Psi, nu), mu), Dmu(Y, A, Dmu(Y, A, Psi, mu), nu), -1)
        Fm = Fcomp(Y, A, mu, nu); want = {}
        for a in range(G): want = fadd(want, fmulp(Fm[a], Y.lmul(a, Psi)), Y.g)
        assert c == want, ('commutator identity', n, m)
    lam = [rpoly(rng, n, 2, .5) for _ in range(G)]                                 # (b) first-order covariance of E
    dPsi = {}
    for a in range(G): dPsi = fadd(dPsi, fmulp(lam[a], Y.lmul(a, Psi)), -Y.g)       # delta Psi = -g lambda^a B_a Psi
    dA = []
    for mu in range(n):
        v = [padd(pder(lam[a], mu), {}) for a in range(G)]
        for (b, c), d in Y.f.items():
            p = pmul(A[mu][b], lam[c])
            for a, w in d.items(): v[a] = padd(v[a], p, Y.g * w)
        dA.append(v)
    dE = {}
    for mu in range(n):
        t = fder(dPsi, mu)
        for a in range(G):
            if A[mu][a]: t = fadd(t, fmulp(A[mu][a], Y.lmul(a, dPsi)), Y.g)
            if dA[mu][a]: t = fadd(t, fmulp(dA[mu][a], Y.lmul(a, Psi)), Y.g)
        dE = fadd(dE, Y.rJ(Y.gam_left(mu, t)))
    dE = fadd(dE, Y.r0(dPsi), -Y.mass)
    E0 = Eop(Y, A, Psi); want = {}
    for a in range(G): want = fadd(want, fmulp(lam[a], Y.lmul(a, E0)), -Y.g)
    assert dE == want, ('gauge covariance of the matter equation', n, m)
    return {'commutator_identity': True, 'gauge_covariance_of_E_first_order': True}

# ------------------------------------------------------------------------------------------------ pointwise identities (values, no polynomials)
def prod(masks, sq):
    mk, sgn = 0, 1
    for x in masks:
        mk, s = bmul(mk, x, sq); sgn *= s
    return mk, sgn
def Bnu(Y, Phi, Psi, nu):                                                         # sum_T < Phi~_T gamma^nu Psi_T gamma_0 J >_0
    tot = 0
    for (S, T), v in Phi.items():
        for (S2, T2), w in Psi.items():
            if T != T2: continue
            mk, s = prod([S, 1 << nu, S2, 1, Y.Jm], Y.sq)
            if mk == 0: tot += v * w * s * (-1) * rsign(popc(S)) * Y.sq[nu]        # J = -(mask 6)
    return tot
def vals(Y, Psi): return {k: v.get((0,) * Y.n, 0) for k, v in Psi.items()}
def point_identities(n, m, seed):
    rng = random.Random(seed); Y = Sys(n, m); G = Y.G; rnd = lambda: F(rng.randint(-3, 3)); zero = (0,) * n
    Psi = {(S, T): rnd() for S in Y.ev for T in Y.Ts}; A = [[rnd() for _ in range(G)] for _ in range(n)]
    dPsi = [{(S, T): rnd() for S in Y.ev for T in Y.Ts} for _ in range(n)]
    def lm(a, X):
        out = {}
        for (S, T), v in X.items():
            t, s = bmul(Y.gens[a], T, Y.sqi); out[(S, t)] = out.get((S, t), 0) + s * v
        return out
    def gam(mu, X):
        out = {}
        for (S, T), v in X.items():
            t, s = bmul(1 << mu, S, Y.sq); out[(t, T)] = out.get((t, T), 0) + s * Y.sq[mu] * v
        return out
    def rmask(mask, coef, X):
        out = {}
        for (S, T), v in X.items():
            t, s = bmul(S, mask, Y.sq); out[(t, T)] = out.get((t, T), 0) + s * coef * v
        return out
    def addv(a, b, c=1):
        r = dict(a)
        for k, v in b.items():
            x = r.get(k, 0) + c * v
            if x == 0: r.pop(k, None)
            else: r[k] = x
        return r
    def Eval(dP):
        tot = {}
        for mu in range(n):
            D = dict(dP[mu])
            for a in range(G):
                if A[mu][a]: D = addv(D, lm(a, Psi), Y.g * A[mu][a])
            tot = addv(tot, rmask(Y.Jm, -1, gam(mu, D)))
        return addv(tot, rmask(1, 1, Psi), -Y.mass)
    dPsi[0] = {}; R0 = Eval(dPsi)                                                # solve gamma^0 d_0 Psi J = -R0
    Z = {}
    for (S, T), v in R0.items():
        a1, s1 = bmul(1, S, Y.sq); b1, s2 = bmul(a1, Y.Jm, Y.sq); Z[(b1, T)] = Z.get((b1, T), 0) - s1 * s2 * v      # J^{-1} = +mask 6
    dPsi[0] = Z; assert not Eval(dPsi), 'E = 0 is not reached'
    out = {'conserved_on_shell': True, 'current_is_not_zero': False, 'adjoint_covariance': True, 'abelian_current_equals_step3_X': True}
    js = []
    for a in range(G):
        La = lm(a, Psi); div = 0
        for nu in range(n):
            div += Bnu(Y, dPsi[nu], La, nu) + Bnu(Y, Psi, lm(a, dPsi[nu]), nu)
        for (b, c), d in Y.f.items():
            if a in d:
                for nu in range(n): div += Y.g * d[a] * A[nu][b] * Bnu(Y, Psi, lm(c, Psi), nu)
        assert div == 0, ('covariant conservation of the current', n, m, a)
        js.append([Bnu(Y, Psi, La, nu) for nu in range(n)])
    out['current_is_not_zero'] = any(x != 0 for row in js for x in row); assert out['current_is_not_zero']
    # wrong sign of g in the gauge term must break it (negative control inside the script)
    broke = False
    if G and m >= 3:
        for a in range(G):
            La = lm(a, Psi); div = 0
            for nu in range(n): div += Bnu(Y, dPsi[nu], La, nu) + Bnu(Y, Psi, lm(a, dPsi[nu]), nu)
            for (b, c), d in Y.f.items():
                if a in d:
                    for nu in range(n): div -= Y.g * d[a] * A[nu][b] * Bnu(Y, Psi, lm(c, Psi), nu)
            if div != 0: broke = True
        assert broke, 'a wrong sign of g must break conservation'
    # adjoint covariance: Psi -> Psi - g lambda^b B_b Psi  gives  delta j^a = - g lambda^b f_ab^c j^c   (the adjoint rotation, first order, any lambda)
    lamv = [rnd() for _ in range(G)]; dP = {}
    for b in range(G): dP = addv(dP, lm(b, Psi), -Y.g * lamv[b])
    for a in range(G):
        for nu in range(n):
            dj = Bnu(Y, dP, lm(a, Psi), nu) + Bnu(Y, Psi, lm(a, dP), nu)
            want = -sum(Y.g * lamv[b] * d.get(c, 0) * js[c][nu] for (aa, b), d in Y.f.items() if aa == a for c in d)
            assert dj == want, ('adjoint covariance of the current', n, m, a, nu)
    # the abelian generator "multiply by J on the right": same formula gives -X = - < psi~ gamma^nu psi gamma_0 >_0 of step 3
    PsiJ = rmask(Y.Jm, -1, Psi)
    for nu in range(n):
        lhs = Bnu(Y, Psi, PsiJ, nu); rhs = 0
        for (S, T), v in Psi.items():
            for (S2, T2), w in Psi.items():
                if T != T2: continue
                mk, s = prod([S, 1 << nu, S2, 1], Y.sq)
                if mk == 0: rhs += v * w * s * rsign(popc(S)) * Y.sq[nu]
        assert lhs == -rhs, ('abelian reduction', n, m, nu)
    return out

# ------------------------------------------------------------------------------------------------ counts, by enumeration
def counts(n, m):
    Y = Sys(n, m); G = Y.G; targets = {}
    for S in Y.ev:
        for T in Y.Ts:
            for mu in range(n):
                t1, s1 = bmul(1 << mu, S, Y.sq); o, s2 = bmul(t1, Y.Jm, Y.sq)
                targets.setdefault((o, T), []).append(('d', mu))
                for a in range(G):
                    t, s = bmul(Y.gens[a], T, Y.sqi); targets.setdefault((o, t), []).append(('g', mu, a))
            targets.setdefault((S ^ 1, T), []).append(('m',))
    per = {len([x for x in v]) for v in targets.values()}
    assert per == {n * (G + 1) + 1}, per
    assert all(sum(1 for x in v if x[0] == 'd') == n and sum(1 for x in v if x[0] == 'g') == n * G and sum(1 for x in v if x[0] == 'm') == 1 for v in targets.values())
    assert len(targets) == 2 ** (n - 1) * 2 ** m and all(popc(o) % 2 == 1 for (o, t) in targets)
    # current monomials: ordered pairs of components ((S,T),(S',T')) with S^S' = (1<<nu)^7, T' = B_a T
    mon = {}
    for a in range(G):
        for nu in range(n):
            mask = (1 << nu) ^ 7; coef = {}
            for S in Y.ev:
                S2 = S ^ mask
                if popc(S2) % 2: continue
                for T in Y.Ts:
                    t, s = bmul(Y.gens[a], T, Y.sqi); mk, sg = prod([S, 1 << nu, S2, 1, Y.Jm], Y.sq)
                    if mk != 0: continue
                    c = sg * (-1) * rsign(popc(S)) * Y.sq[nu] * s; key = tuple(sorted([(S, T), (S2, t)])); coef[key] = coef.get(key, 0) + c
                    # Psi_{S,T} * (B_a Psi)_{S2,T} : the factor (B_a Psi)_{S2,T} = s * Psi_{S2, t} with t = B_a T (up to the sign s above)
            mon[(a, nu)] = sum(1 for c in coef.values() if c != 0)
    nu_masks = {nu: (1 << nu) ^ 7 for nu in range(n)}
    return {'components': 2 ** (n - 1) * 2 ** m, 'equations': 2 ** (n - 1) * 2 ** m, 'derivative_terms_per_equation': n, 'gauge_terms_per_equation': n * G, 'mass_terms_per_equation': 1,
            'terms_per_equation': n * (G + 1) + 1, 'terms_total': 2 ** (n - 1) * 2 ** m * (n * (G + 1) + 1), 'gauge_terms_total': 2 ** (n - 1) * 2 ** m * n * G,
            'current_monomials_per_component': {str(nu): mon[(0, nu)] for nu in range(n)}, 'current_corner_masks': {str(nu): nu_masks[nu] for nu in range(n)},
            'current_corner_distance': {str(nu): popc(nu_masks[nu]) for nu in range(n)}}
def module_data(m):
    N, b, c = cell_data(0, m); dim = N * DIMK[b]
    assert c * N * N * DIMK[b] == 2 ** m
    return {'internal_dim': 2 ** m, 'internal_cell': cell_name(0, m), 'summands': c, 'minimal_module_real_dim': dim, 'copies_of_each_module': N}

def build():
    out = {'ladder': {}, 'spacetime': {}, 'identities': {}, 'status': {}}
    for m in range(2, 9):
        c = counts(4, m); out['ladder'][str(m)] = {**c, **module_data(m), 'gens': comb(m, 2)}
    for n in range(3, 7):
        c = counts(n, 3); out['spacetime'][str(n)] = {'m': 3, **c}
    for (n, m) in [(3, 2), (3, 3), (4, 2), (4, 3), (4, 4), (5, 3)]:
        r = {**poly_identities(n, m, 100 * n + m), **point_identities(n, m, 77 * n + m)}; out['identities']['%d,%d' % (n, m)] = r
    out['status'] = {
        'checked': ['the matter equation with the covariant derivative, the commutator identity [D, D] Psi = g F Psi, and first-order gauge covariance of the equation, exact (polynomial fields)',
                    'the current j^a_nu of each generator: adjoint covariance and D^nu j^a_nu = 0 at points where the matter equation holds, exact',
                    'term counts per equation n(G+1)+1 by enumeration for m = 2 to 8 at n = 4 and n = 3 to 6 at m = 3',
                    'the abelian current of step 3 is the same formula for the generator J acting on the right'],
        'standard': ['the Dirac equation with minimal coupling to a Yang-Mills field and its Noether current', 'left multiplication on Cl(0,m) is the spinor-type representation of spin(m); at m = 3 it is two doublets of su(2)'],
        'ours': ['reading the gauge terms as the n*G edges that combine one cube edge in space-time with one distance-2 edge in the internal cube'],
        'open': ['the coupling constant and the sign of the source term in D^mu F_mu_nu = kappa j_nu (no action rebuilt)', 'which representation, if any, the model uses', 'solutions of any of these equations']}
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    data = build(); js = json.dumps(data, sort_keys=True, indent=1)
    if a.write: open(a.write, 'w').write(js + '\n')
    if a.compare:
        old = json.load(open(a.compare)); assert old == json.loads(js), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL MATTER CHECKS PASS')
if __name__ == '__main__': main()
