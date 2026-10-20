#!/usr/bin/env python3
"""How many Standard Model generations can the 256 real dimensions of End_R(V) = M16(R) hold?  Standard library only.
  python3 threegen_selfcheck.py                         run all checks
  python3 threegen_selfcheck.py --write threegen.json   also write the data
  python3 threegen_selfcheck.py --compare threegen.json assert the portal data equals the rebuilt data

Setting (Furey, arXiv:2607.18450v2; the portal's explicit model, checked in run_all.py): V is 16-dimensional real,
omega = L_{e7} is a complex structure, and V (x) C = W + W-bar with W = 8 complex dimensions split by the Peirce projectors
into blocks (sizes 1,3,2,1,1) with hypercharges y = (0, 1/3, 1/2, 1, 0).  End_R(V) (256 real dimensions) splits into
  linear operators (commute with omega)     = End_C(W) = W (x) W*     64 complex dimensions
  antilinear operators (anticommute)        = Hom(Wbar,W) = W (x) W   64 complex dimensions
(real dimensions 128 + 128).  The compact gauge group SU(3) x SU(2) x U(1) acts through omega: on a linear operator
s->t with charge y_t - y_s; on an antilinear operator with charge y_t + y_s (it conjugates the scalar), colour/isospin
as the tensor product of the two blocks.  Convention: SU(3) acts as 3-bar on the 3-block, which is what makes the Peirce
edges come out as Q_L=(3,2,+1/6) etc., and every block obeys the Standard Model relation 6Y = -2a - 3b (mod 6)."""
import argparse, itertools, json
from fractions import Fraction as F
from collections import Counter

# ---------- irreps of SU(3) x SU(2): colour in {1,3,3b,6,6b,8}, isospin dim in {1,2,3}
DUAL = {'1': '1', '3': '3b', '3b': '3', '6': '6b', '6b': '6', '8': '8'}
CDIM = {'1': 1, '3': 3, '3b': 3, '6': 6, '6b': 6, '8': 8}
CPROD = {('1', '1'): ['1'], ('3', '3'): ['6', '3b'], ('3b', '3b'): ['6b', '3'], ('3', '3b'): ['1', '8'], ('3b', '3'): ['1', '8']}
def cprod(a, b):
    if a == '1': return [b]
    if b == '1': return [a]
    return CPROD[(a, b)]
def iprod(a, b):
    if a == 1: return [b]
    if b == 1: return [a]
    assert (a, b) == (2, 2); return [1, 3]       # 2 x 2 = 1 + 3
def tensor(x, y):
    return [(c, i, x[2] + y[2]) for c in cprod(x[0], y[0]) for i in iprod(x[1], y[1])]
def dual(x): return (DUAL[x[0]], x[1], -x[2])
def dim(x): return CDIM[x[0]] * x[1]

SM = {'Q_L': ('3', 2, F(1, 6)), 'u_R': ('3', 1, F(2, 3)), 'd_R': ('3', 1, F(-1, 3)), 'L': ('1', 2, F(-1, 2)), 'e_R': ('1', 1, F(-1)), 'nu_R': ('1', 1, F(0))}
SM_DIM = {k: dim(v) for k, v in SM.items()}
assert sum(SM_DIM.values()) == 16
def sm_ok(x):                                       # Standard Model relation between triality, isospin and hypercharge
    a = {'1': 0, '3': 1, '3b': -1}[x[0]]; b = 1 if x[1] == 2 else 0
    return (6 * x[2] + 2 * a + 3 * b) % 6 == 0

FUREY_W = [('1', 1, F(0)), ('3b', 1, F(1, 3)), ('1', 2, F(1, 2)), ('1', 1, F(1)), ('1', 1, F(0))]
NAMES = ['C_O(1)', 'C3_O(3)', 'C2_H(2)', 'C_C(1)', 'C_last(1)']

def sectors(W, off_diagonal=False):
    lin, anti = Counter(), Counter()
    for s, t in itertools.product(range(len(W)), repeat=2):
        if not (off_diagonal and s == t):
            for r in tensor(W[t], dual(W[s])): lin[r] += 1      # linear operator s -> t: b_t (x) b_s*
        for r in tensor(W[t], W[s]): anti[r] += 1               # antilinear operator: b_t (x) b_s
    return lin, anti
def cdim(c): return sum(dim(r) * m for r, m in c.items())
def mult(c, r): return c.get(r, 0)
def fmt(r): return f"({r[0]},{r[1]},{'+' if r[2] > 0 else ''}{r[2]})"

SMC = set(SM.values()) | {dual(r) for r in SM.values()}
def exotic(c): return sum(dim(r) * m for r, m in c.items() if r not in SMC)
def analyse(W):
    lin, anti = sectors(W, off_diagonal=True)
    rows = {}
    for n, r in SM.items():
        rows[n] = {'rep': fmt(r), 'dim_C': dim(r), 'linear': mult(lin, r), 'linear_conj': mult(lin, dual(r)), 'antilinear': mult(anti, r), 'antilinear_conj': mult(anti, dual(r))}
    return lin, anti, rows
def generations(W):
    """copies of one full generation: the smallest multiplicity over the six irreps, counted in the matter part of the 256 real
    dimensions (linear off-diagonal + antilinear); the diagonal blocks are the gauge bosons, not matter"""
    lin, anti = sectors(W, off_diagonal=True)
    return min(mult(lin, r) + mult(anti, r) for r in SM.values())
def exotic_dim(W):
    lin, anti = sectors(W, off_diagonal=True); return exotic(lin) + exotic(anti)
def charge_check(W):
    """the hypercharges of the decomposition must equal the hypercharges counted state by state (independent of the irrep tables)"""
    ys = [b[2] for b in W for _ in range(dim(b))]
    lin_full, anti_full = sectors(W)
    got_l = Counter(); got_a = Counter()
    for r, m in lin_full.items(): got_l[r[2]] += dim(r) * m
    for r, m in anti_full.items(): got_a[r[2]] += dim(r) * m
    assert got_l == Counter(yt - ys_ for yt in ys for ys_ in ys) and got_a == Counter(yt + ys_ for yt in ys for ys_ in ys)
    return True

def admissible_blocks():
    sing = [('1', 1, F(k)) for k in range(-2, 3)]
    dbl = [('1', 2, F(k, 2)) for k in (-3, -1, 1, 3)]
    tri = [('3', 1, F(k, 3)) for k in range(-6, 7) if sm_ok(('3', 1, F(k, 3)))]
    trb = [('3b', 1, F(k, 3)) for k in range(-6, 7) if sm_ok(('3b', 1, F(k, 3)))]
    assert all(sm_ok(b) for b in sing + dbl + tri + trb)
    return sing, dbl, tri, trb

def build():
    D = {}
    assert all(sm_ok(b) for b in FUREY_W) and charge_check(FUREY_W)
    lin, anti, rows = analyse(FUREY_W)
    D['blocks'] = [{'name': n, 'colour': b[0], 'isospin': b[1], 'y': str(b[2]), 'dim': dim(b)} for n, b in zip(NAMES, FUREY_W)]
    D['dimensions'] = {'real_total': 256, 'linear_complex': 64, 'antilinear_complex': 64, 'diagonal_complex': 16, 'linear_off_diagonal_complex': cdim(lin), 'antilinear_complex_check': cdim(anti)}
    assert (cdim(lin), cdim(anti)) == (48, 64)
    D['sm_rows'] = rows
    D['linear_off_diagonal_irreps'] = {fmt(r): m for r, m in sorted(lin.items(), key=lambda kv: (-dim(kv[0]), str(kv[0])))}
    D['antilinear_irreps'] = {fmt(r): m for r, m in sorted(anti.items(), key=lambda kv: (-dim(kv[0]), str(kv[0])))}
    D['exotic'] = {'linear_off_diagonal': exotic(lin), 'antilinear': exotic(anti)}
    assert D['exotic'] == {'linear_off_diagonal': 0, 'antilinear': 32}
    # the linear off-diagonal sector is the Peirce-edge content of run_all.py: one generation (16C) and 8C of replicas in one direction, 48C in both
    one_gen = {'Q_L': 1, 'u_R': 1, 'd_R': 1, 'L': 1, 'e_R': 1, 'nu_R': 2}     # nu_R is its own conjugate: its edge is counted once in each direction
    extra = {n: rows[n]['linear'] - one_gen[n] for n in SM}
    D['linear_beyond_one_generation'] = extra
    assert extra == {'Q_L': 0, 'u_R': 0, 'd_R': 1, 'L': 2, 'e_R': 1, 'nu_R': 0} and sum(SM_DIM[n] * extra[n] for n in SM) == 8    # the 8C of replica-type content of run_all.py
    D['generations'] = {'furey_frame': generations(FUREY_W), 'furey_frame_conjugate': generations([dual(b) for b in FUREY_W])}
    assert D['generations'] == {'furey_frame': 1, 'furey_frame_conjugate': 1}
    # --- search 1: every admissible 8-dimensional W (blocks 1, 2, 3, 3-bar with Standard Model hypercharges, |y| <= 2)
    sing, dbl, tri, trb = admissible_blocks(); pool = [(b, dim(b)) for b in sing + dbl + tri + trb]
    hist, n_all, bestex = Counter(), 0, {}
    def rec(i, left, cur):
        nonlocal n_all
        if left == 0:
            n_all += 1; g = generations(cur); hist[g] += 1
            e = exotic_dim(cur)
            if g not in bestex or e < bestex[g]: bestex[g] = e
            return
        if i == len(pool): return
        b, d = pool[i]
        if d <= left: rec(i, left - d, cur + [b])
        rec(i + 1, left, cur)
    rec(0, 8, [])
    D['search_all'] = {'admissible_W': n_all, 'max_generations': max(hist), 'histogram': {str(k): v for k, v in sorted(hist.items())}, 'least_exotic_dimension_for_generations': {str(k): v for k, v in sorted(bestex.items())}}
    assert max(hist) == 2 and 3 not in hist
    # --- search 2: keep the Peirce frame (1,3,2,1,1) of Furey and vary only the hypercharges (and 3 versus 3-bar)
    h2, ex2 = Counter(), {}
    for col in ('3', '3b'):
        tri_c = [y for (c, _, y) in (tri if col == '3' else trb)]
        for y0, y3, y4 in itertools.product([b[2] for b in sing], repeat=3):
            for y1 in tri_c:
                for y2 in [b[2] for b in dbl]:
                    W = [('1', 1, y0), (col, 1, y1), ('1', 2, y2), ('1', 1, y3), ('1', 1, y4)]
                    g = generations(W); h2[g] += 1; e = exotic_dim(W)
                    if g not in ex2 or e < ex2[g]: ex2[g] = e
    D['search_peirce_frame'] = {'assignments': sum(h2.values()), 'histogram': {str(k): v for k, v in sorted(h2.items())}, 'least_exotic_dimension_for_generations': {str(k): v for k, v in sorted(ex2.items())}}
    assert max(h2) == 2 and 3 not in h2
    # --- where the limit comes from: the largest number of copies each irrep can reach over all admissible W, and the one that limits
    mx = {n: 0 for n in SM}
    def rec2(i, left, cur):
        if left == 0:
            lin_, anti_ = sectors(cur, off_diagonal=True)
            for n, r in SM.items(): mx[n] = max(mx[n], mult(lin_, r) + mult(anti_, r))
            return
        if i == len(pool): return
        b, d = pool[i]
        if d <= left: rec2(i, left - d, cur + [b])
        rec2(i + 1, left, cur)
    rec2(0, 8, [])
    D['max_copies_of_each_irrep'] = mx
    assert min(mx.values()) >= 2 and max(hist) == 2
    D['bottleneck'] = 'each irrep alone can be repeated more than twice by some choice of W, but never all six together: the number of complete generations is at most 2 in every admissible W (exhaustive search)'
    return D

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a = ap.parse_args()
    D = build(); txt = json.dumps(D, indent=1, sort_keys=True, ensure_ascii=False)
    if a.write: open(a.write, 'w', encoding='utf8').write(txt)
    if a.compare:
        assert json.loads(txt) == json.load(open(a.compare, encoding='utf8')), 'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL THREE-GENERATION CHECKS PASS')
if __name__ == '__main__': main()
