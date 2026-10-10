import sys; sys.path.insert(0,'.')
from model import *
k=E[3]; Lk,Rk=Lmat(k),Rmat(k)
om=blk(Lk,Z,Z,Lk); om2=blk(-Rk,Z,Z,-Rk)
LR=Lk@Rk
Zop=blk(LR,Z,Z,Z)
blocks={'O1 {1,k}':[0,3],'O2 (6)':[1,2,4,5,6,7],"O' e5H":[8+m for m in (4,5,6,7)],"O' e6C":[9,10],"O' e7R":[11],"O' R":[8]}
for n,ix in blocks.items():
    sub=lambda M:M[np.ix_(ix,ix)]
    same=np.allclose(sub(om),sub(om2)); opp=np.allclose(sub(om),-sub(om2))
    # blocks that are not invariant (e7R,R) are reported as mixed
    print(f'{n:10s} omega=L_e7 vs omega\'=-R_e7:  equal={same}  opposite={opp}')
# on the second copy:  omega' vs omega
M2=om[8:,8:]; M2p=om2[8:,8:]
print("second copy: L_e7 = -R_e7 on span?:", [bool(np.allclose((M2+M2p)@E[m],0)) for m in range(8)])
print("second copy: L_e7 =  R_e7 on span?:", [bool(np.allclose((M2-M2p)@E[m],0)) for m in range(8)], '(unit index 0..7 = 1,i,j,k,l,li,lj,lk)')
# relation om2 = om * Zfull with Zfull diagonal sign (+1/-1)?
D=np.linalg.solve(om,om2); print('om^{-1} om2 diagonal +-1:',np.allclose(D,np.diag(np.diag(D))) , np.diag(D).round(3))
