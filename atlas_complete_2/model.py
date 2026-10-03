import numpy as np, itertools
# ---- quaternions (basis 1,i,j,k) and octonions by Cayley-Dickson: (a,b)(c,d) = (ac - conj(d) b, d a + b conj(c))
def qmul(p,q):
    a1,b1,c1,d1=p; a2,b2,c2,d2=q
    return np.array([a1*a2-b1*b2-c1*c2-d1*d2, a1*b2+b1*a2+c1*d2-d1*c2, a1*c2-b1*d2+c1*a2+d1*b2, a1*d2+b1*c2-c1*b2+d1*a2])
def qconj(p): return np.array([p[0],-p[1],-p[2],-p[3]])
def omul(x,y):
    a,b=x[:4],x[4:]; c,d=y[:4],y[4:]
    return np.concatenate([qmul(a,c)-qmul(qconj(d),b), qmul(d,a)+qmul(b,qconj(c))])
E=np.eye(8)
# index: 0:1 1:i 2:j 3:k 4:l 5:li 6:lj 7:lk   (k=e7, j=e6, i=e2, l=e5 in Furey's labelling of the nested tower)
def Lmat(x): return np.array([omul(x,E[m]) for m in range(8)]).T
def Rmat(x): return np.array([omul(E[m],x) for m in range(8)]).T
I8=np.eye(8); I16=np.eye(16)
def blk(A,B,C,D): return np.block([[A,B],[C,D]])
Z=np.zeros((8,8))
def diag2(A): return blk(A,Z,Z,A)
