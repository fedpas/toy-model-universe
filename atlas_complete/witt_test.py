import sys, itertools; sys.path.insert(0,'.')
from model import *
np.set_printoptions(linewidth=170,suppress=True)
# explicit Cl(0,8) in End_R(V), V = O + O':  g_a = [[0,L_a],[L_a,0]] (a = i,j,k,l,li,lj,lk),  g_8 = [[0,1],[-1,0]]
units=[E[m] for m in range(1,8)]
g=[blk(Z,Lmat(u),Lmat(u),Z) for u in units]+[blk(Z,I8,-I8,Z)]
ok=all(np.allclose(g[a]@g[a],-I16) for a in range(8)) and all(np.allclose(g[a]@g[b]+g[b]@g[a],0) for a in range(8) for b in range(a))
print('Cl(0,8) relations hold:',ok)
# blades
def blade(S):
    M=I16.copy()
    for a in S: M=M@g[a]
    return M
subsets=[S for r in range(9) for S in itertools.combinations(range(8),r)]
B={S:blade(S) for S in subsets}
print('blades orthogonal under trace form:',all(abs(np.trace(B[S].T@B[T]))<1e-9 for S in subsets[:60] for T in subsets[:60] if S!=T), '  I8^2=+1:',np.allclose(B[tuple(range(8))]@B[tuple(range(8))],I16))
def expand(X):
    return {S:np.trace(B[S].T@X)/16 for S in subsets if abs(np.trace(B[S].T@X)/16)>1e-9}
# --- the Fano structure sits in the Hamming code: lines (a,b,c) with e_a e_b = ±e_c  <->  weight-4 blades g_a g_b g_c g_8
names=['i','j','k','l','li','lj','lk']
lines=[]
for a in range(7):
    for b in range(a+1,7):
        p=omul(units[a],units[b]); c=int(np.argmax(abs(p)))-1
        if c>b: lines.append((a,b,c))
print('Fano lines (unit indices 0..6 = i,j,k,l,li,lj,lk):',lines,' count',len(lines))
A=[B[tuple(sorted(l+(7,)))] for l in lines]
print('line blades square +1:',all(np.allclose(M@M,I16) for M in A),' mutually commute:',all(np.allclose(M@N,N@M) for M in A for N in A))
# joint eigenbasis of the line torus
rng=np.random.default_rng(0); M=sum(rng.normal()*a for a in A)
w,Vv=np.linalg.eigh((M+M.T)/2)
print('joint spectrum multiplicities (distinct eigenvalues):',len(set(np.round(w,6))))
# is the torus diagonal in the standard basis?  (i.e. are the line blades diagonal matrices?)
print('line blades diagonal in standard basis:',[bool(np.allclose(a,np.diag(np.diag(a)))) for a in A])
# her real block projectors (standard-basis diagonal) vs. the torus:
k=E[3]; LR=Lmat(k)@Rmat(k)
PO1=(I8-LR)/2; PO2=(I8+LR)/2
def proj(P8,second):
    P=np.zeros((16,16)); P[:8,:8]=P8
    for m in second: P[8+m,8+m]=1
    return P
Ps={'O1':proj(PO1,()),'O2':proj(PO2,()),'H':proj(0*I8,(4,5,6,7)),'C':proj(0*I8,(1,2)),'e7R':proj(0*I8,(3,)),'R':proj(0*I8,(0,))}
for n,P in Ps.items():
    print(f' {n:4s} commutes with all 7 line blades:',all(np.allclose(P@a,a@P) for a in A), ' blade support (grades):',sorted({len(S) for S in expand(P)}), ' #blades',len(expand(P)))
# which Clifford grades does each of her operators live in?
om=blk(Lmat(k),Z,Z,Lmat(k))
for n,X in [('omega=L_e7 (both copies)',om),('L_e7 R_e7 on O',blk(LR,Z,Z,Z))]:
    e=expand(X); print(f' {n}: #blades {len(e)}, grades {sorted({len(S) for S in e})}')
# ---- is there ANY Witt torus (4 commuting grade-4 blades from the Hamming family) that diagonalises all six block projectors?
w4=[S for S in subsets if len(S)==4]
good=[]
import itertools as it
def commute(S,T): return np.allclose(B[S]@B[T],B[T]@B[S])
comm4=[[commute(S,T) for T in w4] for S in w4]
cnt=0
for a,b,c,d in it.combinations(range(len(w4)),4):
    if all(comm4[x][y] for x,y in it.combinations((a,b,c,d),2)):
        # independent over Z2: the four sets' xor-span has size 16
        sets=[set(w4[i]) for i in (a,b,c,d)]
        span={frozenset()}
        for s in sets: span|={frozenset(x^s) if False else frozenset(set(x)^s) for x in span}
        if len(span)==16 and all(abs(np.trace(B[w4[i]]))<1e-9 for i in (a,b,c,d)):
            cnt+=1
            if all(all(np.allclose(P@B[w4[i]],B[w4[i]]@P) for i in (a,b,c,d)) for P in Ps.values()): good.append([w4[i] for i in (a,b,c,d)])
print(f'independent commuting grade-4 quadruples (Witt tori of blades): {cnt};  of these, diagonalising all 6 block projectors: {len(good)}')
print('example:',good[:2])

print('\n--- Witt-torus labels of the 16 coordinate axes of V ---')
# eigenvalue pattern of the 7 line blades on each standard basis vector -> F2^7 label (rank 4)
lab={}
for idx in range(16):
    lab[idx]=tuple(int(round((1-np.diag(a)[idx])/2)) for a in A)
labs=np.array([lab[i] for i in range(16)])
def f2rank(M):
    M=[int(''.join(map(str,r)),2) for r in M]; r=0
    for bit in reversed(range(7)):
        piv=[x for x in M if x>>bit&1]
        if piv:
            p=piv[0]; M=[x^p if (x>>bit&1) and x!=p else x for x in M if True]; r+=1
            M=[x for x in M if x!=p]
    return r
print('rank over F2 of the 16 labels:',f2rank(labs),'; distinct labels:',len({tuple(r) for r in labs}))
def affine(idxs):
    S={lab[i] for i in idxs}
    xor=lambda a,b:tuple(x^y for x,y in zip(a,b))
    return all(xor(xor(a,b),c) in S for a in S for b in S for c in S) and len(S)&(len(S)-1)==0
blocks_idx={'O1 {1,k}':[0,3],'O2 (6)':[1,2,4,5,6,7],'H e5H':[8+m for m in (4,5,6,7)],'C e6C':[8+1,8+2],'e7R':[8+3],'R':[8+0]}
for n,ix in blocks_idx.items(): print(f'  {n:10s} size {len(ix)}  affine subspace of the torus label space: {affine(ix)}')
print('  first copy O (8 axes) affine:',affine(range(8)),'  second copy O\' (8 axes) affine:',affine(range(8,16)))
print('  nested flag in 2nd copy: R+e7R (2) affine',affine([8,11]),'; +e6C (4) affine',affine([8,11,9,10]),'; +e5H (8) affine',affine(range(8,16)))
print('  O1 ∪ ... O (first copy) = O1 + O2 ; O1 (the C inside O) affine',affine([0,3]))
# number of distinct maximal blade tori (groups) and how many have the standard basis as frame
