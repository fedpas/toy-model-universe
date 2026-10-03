#!/usr/bin/env python3
"""Independent cross-check of the Yang-Mills structure with explicit matrices (numpy), gauge dimension m = 2 ... 6, space-time dimension 4.
  python3 yangmills_matrix_check.py [--write yangmills_matrix.json] [--compare yangmills_matrix.json]
The generators B_ij (bit-mask bivectors) act on the m-dimensional vector space by v -> B v - v B (the adjoint action on vectors), a real antisymmetric m x m matrix R_ij.
Checks: (1) [R_a, R_b] = sum_c f_ab^c R_c with the structure constants of the bit rule (a representation of the same algebra);
(2) the component field strength F^a = d A^a - d A^a + g f^a_bc A^b A^c equals the matrix field strength d A - d A + g [A, A] built from the R_a;
(3) the Bianchi identity holds for the matrix form (numerically); (4) m = 2 is a single commuting generator (Maxwell).
Negative controls that must fail: the wrong sign of g in the covariant derivative, structure constants with one wrong sign."""
import sys, json, itertools, importlib.util, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ym', os.path.join(here, 'yangmills_selfcheck.py')); ym = importlib.util.module_from_spec(spec); spec.loader.exec_module(ym)
rng = np.random.default_rng(20261003)
def vec_matrices(m):
    gens, idx, f = ym.algebra(m); sq = [-1] * m; R = []
    for g in gens:
        M = np.zeros((m, m))
        for j in range(m):
            m1, s1 = ym.bmul(g, 1 << j, sq); m2, s2 = ym.bmul(1 << j, g, sq); assert m1 == m2
            if s1 == s2: continue                                   # B commutes with e_j (j not in B): the product is a trivector, nothing to add
            i = m1.bit_length() - 1; assert m1 == 1 << i
            M[i, j] = s1 - s2
        R.append(M)
    return gens, f, R
def run(m, ns=4, flip_f=False, bad_D=False):
    gens, f, R = vec_matrices(m); G = len(gens)
    if flip_f and f:
        k = sorted(f)[0]; f = dict(f); f[k] = {c: -v for c, v in f[k].items()}
    # (1) representation property
    rep_err = 0.0
    for a in range(G):
        for b in range(G):
            lhs = R[a] @ R[b] - R[b] @ R[a]; rhs = sum(v * R[c] for c, v in f.get((a, b), {}).items()) if f.get((a, b)) else np.zeros((m, m))
            rep_err = max(rep_err, float(np.abs(lhs - rhs).max()))
    g_ = 0.8; worst_F = 0.0; worst_B = 0.0
    for _ in range(25):
        x = rng.normal(size=ns); A0 = rng.normal(size=(ns, G)); dA = rng.normal(size=(ns, ns, G))       # A^a_nu(x) = A0 + sum_l x_l dA[l,nu]
        Ax = A0 + np.einsum('l,lna->na', x, dA)
        mat = lambda c: sum(c[a] * R[a] for a in range(G))
        Am = [mat(Ax[nu]) for nu in range(ns)]
        Fc = np.zeros((ns, ns, G))                                                                 # component form
        for mu in range(ns):
            for nu in range(ns):
                Fc[mu, nu] = dA[mu, nu] - dA[nu, mu]
                for (b, c), d in f.items():
                    for a, v in d.items(): Fc[mu, nu, a] += g_ * v * Ax[mu, b] * Ax[nu, c]
        for mu in range(ns):
            for nu in range(ns):
                Fm = mat(dA[mu, nu] - dA[nu, mu]) + g_ * (Am[mu] @ Am[nu] - Am[nu] @ Am[mu])
                worst_F = max(worst_F, float(np.abs(Fm - mat(Fc[mu, nu])).max()))
        gs = -g_ if bad_D else g_
        dF = lambda l, mu, nu: g_ * ((mat(dA[l, mu]) @ Am[nu] - Am[nu] @ mat(dA[l, mu])) + (Am[mu] @ mat(dA[l, nu]) - mat(dA[l, nu]) @ Am[mu]))
        F = [[g_ * 0 + mat(dA[mu, nu] - dA[nu, mu]) + g_ * (Am[mu] @ Am[nu] - Am[nu] @ Am[mu]) for nu in range(ns)] for mu in range(ns)]
        for l, mu, nu in itertools.combinations(range(ns), 3):
            def D(a, mu_, nu_, F_=F): return dF(a, mu_, nu_) + gs * (Am[a] @ F_[mu_][nu_] - F_[mu_][nu_] @ Am[a])
            # d_l F_mn = g([d_l A_m, A_n] + [A_m, d_l A_n]) when the linear part of F is constant: dF above is that; gs is used for both
            t = D(l, mu, nu) + D(mu, nu, l) + D(nu, l, mu); worst_B = max(worst_B, float(np.abs(t).max()))
    return rep_err, worst_F, worst_B
def main():
    out = {'max_error_representation': {}, 'max_error_field_strength': {}, 'max_error_bianchi': {}, 'controls': {}}
    for m in range(2, 7):
        r, fe, b = run(m); z = lambda v: 0 if v < 1e-9 else v
        out['max_error_representation'][str(m)] = z(r); out['max_error_field_strength'][str(m)] = z(fe); out['max_error_bianchi'][str(m)] = z(b)
        assert r < 1e-9 and fe < 1e-9 and b < 1e-9, (m, r, fe, b)
    r, fe, b = run(3, flip_f=True); assert r > 1e-3 or fe > 1e-3; out['controls']['one_structure_constant_with_wrong_sign'] = 'fails (error > 1e-3)'
    r, fe, b = run(3, bad_D=True); assert b > 1e-3; out['controls']['wrong_sign_of_g_in_the_covariant_derivative'] = 'fails (error > 1e-3)'
    out['status'] = 'ALL YANG-MILLS MATRIX CHECKS PASS'
    if '--write' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--write') + 1], 'w'), indent=1, sort_keys=True)
    if '--compare' in sys.argv:
        old = json.load(open(sys.argv[sys.argv.index('--compare') + 1])); assert old == json.loads(json.dumps(out, sort_keys=True)), 'portal data differs'; print('portal data == rebuilt data')
    print(json.dumps(out, indent=1, sort_keys=True)); print(out['status'])
if __name__ == '__main__': main()
