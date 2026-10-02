"""Reproducible check of Furey's Peirce-block construction (arXiv:2607.18450v2) in an explicit 16-dim real model.
V = O + O' (two copies of the octonions built by Cayley-Dickson), second copy split as R + e7R + e6C + e5H.
Run: python3 run_all.py   -> asserts everything and writes furey_results.json"""
import sys, json, itertools; sys.path.insert(0,'.')
from fractions import Fraction as F
from model import *
res={}
k=E[3]; Lk,Rk=Lmat(k),Rmat(k); LR=Lk@Rk
def tr(M): return int(round(np.trace(M)))
assert np.allclose(LR@LR,I8)
PO1=(I8-LR)/2; PO2=(I8+LR)/2
def proj(P8,second):
    P=np.zeros((16,16)); P[:8,:8]=P8
    for m in second: P[8+m,8+m]=1
    return P
real=[('O1',proj(PO1,())),('O2',proj(PO2,())),('H',proj(0*I8,(4,5,6,7))),('C',proj(0*I8,(1,2))),('e7R',proj(0*I8,(3,))),('R',proj(0*I8,(0,)))]
ranks=[tr(P) for _,P in real]; assert ranks==[2,6,4,2,1,1]
assert all(np.allclose(real[a][1]@real[b][1],(real[a][1] if a==b else 0*I16)) for a in range(6) for b in range(6)) and np.allclose(sum(P for _,P in real),I16)
res['real_blocks']=ranks; res['real_diag']=sum(r*r for r in ranks); res['real_off']=256-res['real_diag']
assert (res['real_diag'],res['real_off'])==(62,194)
om=diag2(Lk); assert np.allclose(om@om,-I16)
com=lambda A,B:A@B-B@A
res['blocks_commuting_with_omega']={n:bool(np.allclose(com(om,P),0)) for n,P in real}
assert [res['blocks_commuting_with_omega'][n] for n in ['O1','O2','H','C']]==[True]*4 and not any(res['blocks_commuting_with_omega'][n] for n in ['e7R','R'])
Q=[real[0][1],real[1][1],real[2][1],real[3][1],real[4][1]+real[5][1]]
assert all(np.allclose(com(om,q),0) for q in Q)
cr=[tr(q)//2 for q in Q]; assert cr==[1,3,2,1,1]; res['complex_blocks']=cr
def cdim(gens,n=16):
    A=np.vstack([np.kron(np.eye(n),g)-np.kron(g.T,np.eye(n)) for g in gens]); s=np.linalg.svd(A,compute_uv=False); return int(n*n-np.sum(s>1e-9))
def cbasis(gens,n=16):
    A=np.vstack([np.kron(np.eye(n),g)-np.kron(g.T,np.eye(n)) for g in gens]); u,s,vt=np.linalg.svd(A); r=int(np.sum(s>1e-9)); return [vt[r+c].reshape(n,n,order='F') for c in range(n*n-r)]
assert cdim([om])==128
Bm=cbasis([om]); tab=[[int(np.linalg.matrix_rank(np.array([(Q[a]@X@Q[b]).reshape(-1) for X in Bm]),tol=1e-9)) for b in range(5)] for a in range(5)]
assert all(tab[a][b]==2*cr[a]*cr[b] for a in range(5) for b in range(5))
res['complex_diag']=sum(c*c for c in cr); res['complex_off']=64-res['complex_diag']; assert (res['complex_diag'],res['complex_off'])==(16,48)
om2=diag2(-Rk); assert np.allclose(om2@om2,-I16) and all(np.allclose(com(om2,q),0) for q in Q)
res['omega_alt_minus_R_works']=True
D=np.linalg.solve(om,om2); d=np.diag(D); assert np.allclose(D,np.diag(d)); res['omega_prime_over_omega_minus_axes']=[int(i) for i in np.nonzero(d<0)[0]]
assert res['omega_prime_over_omega_minus_axes']==[0,3,8,11]
# centralizers behind Delta_SM
res['centralizers']={'O_L':cdim([Lk],8),'O_L_and_R':cdim([Lk,Rk],8),'H':cdim([Lk[:4,:4]],4),'C':2,'R':1}
assert res['centralizers']['O_L']==32 and res['centralizers']['O_L_and_R']==20 and res['centralizers']['H']==8
res['delta_SM_real_dim']=20+8+2+1; assert res['delta_SM_real_dim']==31
# hypercharge, commutator action
yv=[F(0),F(1,3),F(1,2),F(1),F(0)]
Y=real[1][1]/3+real[2][1]/2+real[3][1]
assert abs(np.trace(Y)/2-3)<1e-12 and abs(np.trace(Y)/16-3/8)<1e-12
# eigen-decomposition of ad_Y on End_C(V): complex multiplicity of each eigenvalue
adY=np.array([ (Y@X-X@Y).reshape(-1) for X in Bm]); 
# ad_Y acts diagonally on Peirce pieces with eigenvalue y_i-y_j: verify piecewise
for a in range(5):
    for b in range(5):
        for X in Bm[:20]:
            Xab=Q[a]@X@Q[b]; assert np.allclose(Y@Xab-Xab@Y,float(yv[a]-yv[b])*Xab)
n=cr; cn=['C_O(1)','C3_O(3)','C2_H(2)','C_C(1)','C_last(1)']
edges=[]
for a in range(5):
    for b in range(a+1,5):
        edges.append({'a':cn[a],'b':cn[b],'n_a':n[a],'n_b':n[b],'capacity_C':2*n[a]*n[b],'one_way_C':n[a]*n[b],'y_a_minus_y_b':str(yv[a]-yv[b])})
res['edges']=edges; assert sum(e['capacity_C'] for e in edges)==48 and max(e['capacity_C'] for e in edges)==12
# SM content (convention Y_phys = y_target - y_source, source/target as in SM_MATCH below)
SM=[('C3_O(3)','C2_H(2)','Q_L','(3,2,+1/6)',6),('C3_O(3)','C_C(1)','u_R','(3,1,+2/3)',3),('C3_O(3)','C_last(1)','d_R','(3,1,-1/3)',3),('C_C(1)','C2_H(2)','L','(1,2,-1/2)',2),('C_C(1)','C_last(1)','e_R','(1,1,-1)',1),('C_O(1)','C_last(1)','nu_R','(1,1,0)',1)]
idx={c:i for i,c in enumerate(cn)}
for s,t,name,rep,dim in SM:
    y=yv[idx[t]]-yv[idx[s]]; su3='3' if s.startswith('C3') else ('3bar' if t.startswith('C3') else '1'); su2='2' if ('C2' in s or 'C2' in t) else '1'
    want=eval(rep.replace('+','').replace('(','').replace(')','').split(',')[2].replace('/','/') if False else '0') if False else None
    ys=rep.strip('()').split(',')[2]; assert F(ys.replace('+',''))==y, (name,y,ys)
    assert n[idx[s]]*n[idx[t]]==dim
res['sm_matches']=[{'name':nm,'rep':rep,'dim_C':d} for _,_,nm,rep,d in SM]
res['sm_generation_dim']=sum(d for *_,d in SM); assert res['sm_generation_dim']==16
extras=[('C_O(1)','C3_O(3)','d_R-like','(3bar,1,+1/3)~(3,1,-1/3)',3),('C_O(1)','C2_H(2)','L-like','(1,2,+1/2)~(1,2,-1/2)',2),('C_O(1)','C_C(1)','e_R-like','(1,1,+1)~(1,1,-1)',1),('C2_H(2)','C_last(1)','L-like','(1,2,-1/2)',2)]
for s,t,nm,rep,d in extras: assert n[idx[s]]*n[idx[t]]==d
res['extras']=[{'name':nm,'rep':rep,'dim_C':d} for *_,nm,rep,d in extras]; res['extras_dim']=sum(d for *_,d in extras); assert res['extras_dim']==8
assert res['sm_generation_dim']+res['extras_dim']==24==sum(e['one_way_C'] for e in edges)
# the Q_L edge in both directions = Q_L and its conjugate
res['maxEdge']={'pair':'C3_O<->C2_H','capacity_C':12,'content':'Q_L (3,2,+1/6) + conjugate (3bar,2,-1/6): one generation, particle + antiparticle'}
# ---- Witt torus
units=[E[m] for m in range(1,8)]
g=[blk(Z,Lmat(u),Lmat(u),Z) for u in units]+[blk(Z,I8,-I8,Z)]
assert all(np.allclose(g[a]@g[a],-I16) for a in range(8)) and all(np.allclose(g[a]@g[b]+g[b]@g[a],0) for a in range(8) for b in range(a))
lines=[]
for a in range(7):
    for b in range(a+1,7):
        p=omul(units[a],units[b]); c=int(np.argmax(abs(p)))-1
        if c>b: lines.append((a,b,c))
def blade(S):
    M=I16.copy()
    for a in S: M=M@g[a]
    return M
A=[blade(l+(7,)) for l in lines]
assert len(lines)==7 and all(np.allclose(M@M,I16) for M in A) and all(np.allclose(M@N,N@M) for M in A for N in A) and all(np.allclose(M,np.diag(np.diag(M))) for M in A)
res['witt']={'fano_lines':len(lines),'line_blades_square_plus1':True,'commute':True,'diagonal_in_standard_basis':True,'axes':16}
assert all(all(np.allclose(P@a,a@P) for a in A) for _,P in real)
om_blade=np.allclose(om, om) and True
subsets=[S for r in range(9) for S in itertools.combinations(range(8),r)]
Bl={S:blade(S) for S in subsets}
def expand(X): return {S:np.trace(Bl[S].T@X)/16 for S in subsets if abs(np.trace(Bl[S].T@X)/16)>1e-9}
eo=expand(om); assert len(eo)==1 and {len(S) for S in eo}=={6}
res['witt']['omega_is_single_grade_blade']=6
res['witt']['projector_grades']=sorted({len(S) for _,P in real for S in expand(P)}); assert res['witt']['projector_grades']==[0,4,8]
w4=[S for S in subsets if len(S)==4]
cm=[[np.allclose(Bl[S]@Bl[T],Bl[T]@Bl[S]) for T in w4] for S in w4]
tot=good=0
for a,b,c,d_ in itertools.combinations(range(len(w4)),4):
    if all(cm[x][y] for x,y in itertools.combinations((a,b,c,d_),2)):
        span={frozenset()}
        for i in (a,b,c,d_): span|={frozenset(set(x)^set(w4[i])) for x in span}
        if len(span)==16:
            tot+=1
            if all(all(np.allclose(P@Bl[w4[i]],Bl[w4[i]]@P) for i in (a,b,c,d_)) for _,P in real): good+=1
res['witt']['independent_commuting_grade4_quadruples']=tot; res['witt']['diagonalising_all_block_projectors']=good
lab={i:tuple(int(round((1-np.diag(a)[i])/2)) for a in A) for i in range(16)}
def affine(ix):
    S={lab[i] for i in ix}; x=lambda p,q:tuple(u^v for u,v in zip(p,q))
    return all(x(x(p,q),r) in S for p in S for q in S for r in S) and len(S)&(len(S)-1)==0
flag=[affine([8]),affine([8,11]),affine([8,11,9,10]),affine(range(8,16))]; assert all(flag)
res['witt']['cayley_dickson_flag_affine']=flag
res['witt']['block_is_affine']={'O1':affine([0,3]),'O2':affine([1,2,4,5,6,7]),'H':affine(range(12,16)),'C':affine([9,10]),'e7R':True,'R':True}
assert res['witt']['block_is_affine']['O2'] is False
json.dump(res,open('furey_results.json','w'),indent=1,default=str)
print('ALL FUREY CHECKS PASS'); print(json.dumps({k:res[k] for k in ['real_blocks','complex_blocks','real_diag','real_off','complex_diag','complex_off','sm_generation_dim','extras_dim','witt']},indent=1,default=str))
