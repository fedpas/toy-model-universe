import sys; sys.path.insert(0,'.')
from model import *
np.set_printoptions(linewidth=160,suppress=True)
k=E[3]
Lk,Rk=Lmat(k),Rmat(k)
LR=Lk@Rk
print('LkRk^2=I',np.allclose(LR@LR,I8),' eig counts +1/-1:',int(round((np.trace(LR)+8)/2)),int(round((8-np.trace(LR))/2)))
# --- her projectors on the first octonion copy: P_O1=(I-LR)/2 (rank 2), P_O2=(I+LR)/2 (rank 6)
PO1=(I8-LR)/2; PO2=(I8+LR)/2
print('rank P_O1,P_O2:',round(np.trace(PO1)),round(np.trace(PO2)),' idempotent:',np.allclose(PO1@PO1,PO1),np.allclose(PO2@PO2,PO2),' PO1 range = span{1,k}:',np.allclose(PO1@E[0],E[0]) and np.allclose(PO1@E[3],E[3]))
# --- V = O + O' ; second copy decomposition by nested Cayley-Dickson: R={1}, e7R={k}, e6C={j,jk=i}, e5H={l,li,lj,lk}
def sel(idx_first=(),idx_second=()):
    P=np.zeros((16,16))
    for m in idx_first: P[m,m]=1
    for m in idx_second: P[8+m,8+m]=1
    return P
def proj_from(Pfirst8,second_idx):
    P=np.zeros((16,16)); P[:8,:8]=Pfirst8
    for m in second_idx: P[8+m,8+m]=1
    return P
blocks={'O1(2)':proj_from(PO1,()), 'O2(6)':proj_from(PO2,()), 'H(4)':sel((),(4,5,6,7)), 'C(2)':sel((),(1,2)), 'R_e7(1)':sel((),(3,)), 'R(1)':sel((),(0,))}
names=list(blocks); Ps=[blocks[n] for n in names]
sizes=[int(round(np.trace(P))) for P in Ps]
print('real block ranks',dict(zip(names,sizes)),'sum',sum(sizes))
ok_orth=all(np.allclose(Ps[a]@Ps[b],(Ps[a] if a==b else 0*Ps[a])) for a in range(6) for b in range(6)); print('orthogonal idempotents:',ok_orth,' sum=I:',np.allclose(sum(Ps),I16))
diag=sum(s*s for s in sizes); print('real Peirce: diagonal',diag,' off-diagonal',256-diag)
# dimension of each Peirce piece P_i M16(R) P_j computed numerically
def dimpiece(Pi,Pj):  # rank of the map X -> Pi X Pj on M16
    return int(round(np.trace(Pi))*round(np.trace(Pj)))
# --- global complex structure omega = L_e7 on both copies
om=diag2(Lk); print('omega^2=-1:',np.allclose(om@om,-I16))
comm=lambda A,B:A@B-B@A
print('real blocks commuting with omega:',{n:bool(np.allclose(comm(om,P),0)) for n,P in blocks.items()})
# omega swaps the last two real blocks:
print('omega maps R -> e7R:',np.allclose(om@sel((),(0,))[:, :],om@sel((),(0,)))) 
v=np.zeros(16); v[8+0]=1; print('omega(1\') =',np.nonzero(om@v)[0], om@v[om@v!=0] if False else '')
# fused complex blocks
Q=[Ps[0],Ps[1],Ps[2],Ps[3],Ps[4]+Ps[5]]; cn=['C_O(1)','C3_O(3)','C2_H(2)','C_C(1)','C_last(1)']
print('fused blocks commute with omega:',[bool(np.allclose(comm(om,q),0)) for q in Q],' complex ranks',[int(round(np.trace(q)))//2 for q in Q])
# --- commutant of omega in M16(R): dimension via nullspace of X -> [om,X]
def commutant_dim(gens,n=16):
    rows=[]
    for g in gens:
        # vec([g,X]) = (I⊗g - g^T⊗I) vec(X)  (column-stacking)
        rows.append(np.kron(np.eye(n),g)-np.kron(g.T,np.eye(n)))
    A=np.vstack(rows); s=np.linalg.svd(A,compute_uv=False); return int(n*n-np.sum(s>1e-9))
print('dim_R End_C(V) = commutant of omega:',commutant_dim([om]),' (M8(C) -> 128)')
# Peirce pieces of End_C(V): dim of Q_i C Q_j (real) = 2 n_i n_j ; verify by projecting a basis of the commutant
def commutant_basis(gens,n=16):
    A=np.vstack([np.kron(np.eye(n),g)-np.kron(g.T,np.eye(n)) for g in gens]); u,s,vt=np.linalg.svd(A); r=np.sum(s>1e-9); return vt[r:].T  # columns: vec(X)
B=commutant_basis([om]); Bmats=[B[:,c].reshape(16,16,order='F') for c in range(B.shape[1])]
cp=lambda q:int(round(np.trace(q)))//2
tab=np.zeros((5,5),int)
for a in range(5):
    for b in range(5):
        M=np.array([ (Q[a]@X@Q[b]).reshape(-1) for X in Bmats]); tab[a,b]=np.linalg.matrix_rank(M,tol=1e-9)
print('real dim of Q_i End_C(V) Q_j:\n',tab,'\n expected 2*n_i*n_j:\n',np.array([[2*cp(Q[a])*cp(Q[b]) for b in range(5)] for a in range(5)]))
print('total',tab.sum(),'diag',np.trace(tab),'off-diag',tab.sum()-np.trace(tab),'  -> complex: diag',np.trace(tab)//2,' off',(tab.sum()-np.trace(tab))//2)
# the same with the other complex structure -R_e7
om2=-diag2(Rk) if False else diag2(-Rk)
print('\n-R_e7: omega^2=-1',np.allclose(om2@om2,-I16),'  blocks commute:',[bool(np.allclose(comm(om2,q),0)) for q in Q], ' P_O1,P_O2 commute:',bool(np.allclose(comm(om2,Ps[0]),0)),bool(np.allclose(comm(om2,Ps[1]),0)))
# --- centralizers behind Delta_SM
print('\ncentralizers inside End_R(O) (8x8): commute with L_e7 :',commutant_dim([Lk],8),'(M4(C)=32)  with L_e7 and R_e7:',commutant_dim([Lk,Rk],8),'(M3(C)+C = 20)')
# quaternion piece: End_R(H)=M4(R); H = span{1,i,j,k}, omega=L_k restricted
Lk4=Lk[:4,:4]; print('End_R(H) commutant of L_k:',commutant_dim([Lk4],4),'(M2(C)=8)')
print('Delta_SM real dim = 20+8+2+1 =',20+8+2+1)
# --- hypercharge: Y = 1/3 P_O2 + 1/2 P_H + P_C  (diagonal on blocks)
Y=Ps[1]/3+Ps[2]/2+Ps[3]
print('\nTr_R Y',np.trace(Y),' Tr_C Y',np.trace(Y)/2,' dim_C V 8 -> mean',np.trace(Y)/16)
y=[0,1/3,1/2,1,0]   # block values on (C_O, C3_O, C2_H, C_C, C_last)
from fractions import Fraction as F
yv=[F(0),F(1,3),F(1,2),F(1),F(0)]
n=[1,3,2,1,1]
print('\nEdges (i,j): complex dim n_i*n_j each way; Y of Hom(j->i) under commutator = y_i - y_j')
tot=0
for a in range(5):
    for b in range(a+1,5):
        print(f'  {cn[a]:9s}<->{cn[b]:9s} 2nn={2*n[a]*n[b]:2d}  one-way {n[a]*n[b]:2d}   Y = {yv[a]-yv[b]} / {yv[b]-yv[a]}')
