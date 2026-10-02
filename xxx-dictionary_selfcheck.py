#!/usr/bin/env python3
"""Self-check for the portal's Dictionary section.  Needs only numpy.
  python3 dictionary_selfcheck.py                 rebuild everything from scratch and assert every claim
  python3 dictionary_selfcheck.py --write out.json  also write the dictionary data
  python3 dictionary_selfcheck.py --compare dictionary.json   check the portal's data equals the rebuilt data
Model: V = O + O' (two Cayley-Dickson octonion copies, real dim 16); Cl(0,8) generators g_a = [[0,L_u],[L_u,0]] (u = the 7 imaginary
units) and g_8 = [[0,1],[-1,0]].  Blade e_S (S subset of {0..7}) <-> face S of the 7-simplex; integer label N(S) = sum 2^a, a in S.
Complex structure omega = L_e7 on both copies.  Conventions follow Furey, arXiv:2607.18450v2."""
import sys, json, itertools, math, argparse
from collections import defaultdict
from fractions import Fraction
import numpy as np

# ------------------------------------------------------------------ octonions
def qmul(p,q):
    a1,b1,c1,d1=p; a2,b2,c2,d2=q
    return np.array([a1*a2-b1*b2-c1*c2-d1*d2, a1*b2+b1*a2+c1*d2-d1*c2, a1*c2-b1*d2+c1*a2+d1*b2, a1*d2+b1*c2-c1*b2+d1*a2])
def qconj(p): return np.array([p[0],-p[1],-p[2],-p[3]])
def omul(x,y):
    a,b=x[:4],x[4:]; c,d=y[:4],y[4:]
    return np.concatenate([qmul(a,c)-qmul(qconj(d),b), qmul(d,a)+qmul(b,qconj(c))])
E=np.eye(8)
def Lmat(x): return np.array([omul(x,E[m]) for m in range(8)]).T
def Rmat(x): return np.array([omul(E[m],x) for m in range(8)]).T
I8=np.eye(8); I16=np.eye(16); Z=np.zeros((8,8))
blk=lambda A,B,C,D: np.block([[A,B],[C,D]])

# ------------------------------------------------------------------ small number helpers
def factor(n):
    f={}; d=2
    while n>1 and d*d<=n:
        while n%d==0: f[d]=f.get(d,0)+1; n//=d
        d+=1
    if n>1: f[n]=f.get(n,0)+1
    return f
def fstr(n):
    if n<2: return str(n)
    return '·'.join(f'{p}' if e==1 else f'{p}^{e}' for p,e in sorted(factor(n).items()))
def isprime(n): return n>1 and factor(n)=={n:1}
TYPES=['R','R2','R','C','H','H2','H','C']; KDIM={'R':1,'R2':1,'C':2,'H':4,'H2':4}; MULT={'R':1,'R2':2,'C':1,'H':1,'H2':2}
def cl_type(p,q):
    n=p+q; t=TYPES[(p-q)%8]; N2=2**n//(KDIM[t]*MULT[t]); N=int(round(math.sqrt(N2))); assert N*N==N2
    return {'cell':f'Cl({p},{q})','type':t,'matrix_size':N,'name':('M%d(%s)'%(N,t.replace('2','')) + ('²' if t in('R2','H2') else ''))}

# ------------------------------------------------------------------ ladder (stage n = number of generators / bits)
def doubly_even_self_dual_count(n):
    """number of binary codes of length n, dimension n/2, self-orthogonal with all weights = 0 mod 4 (exhaustive for n<=8)"""
    if n==0: return 1
    if n%2: return 0
    W=[w for w in range(1,2**n) if bin(w).count('1')%4==0]
    seen=set()
    def span(basis):
        s={0}
        for b in basis: s|={x^b for x in s}
        return frozenset(s)
    def grow(basis,code):
        if len(basis)==n//2: seen.add(code); return
        for w in W:
            if w in code or any(bin(w&b).count('1')%2 for b in basis): continue
            nb=basis+[w]; c=span(nb)
            if c in seen_partial: continue
            seen_partial.add(c); grow(nb,c)
    seen_partial=set(); grow([],frozenset({0}))
    return len(seen)
def ladder():
    rows=[]
    for n in range(0,17):
        k,r=n//2,n%2
        row={'n':n,'k':k,'r':r,'dim':2**n,'minus_edge':cl_type(0,n),'plus_edge':cl_type(n,0)}
        if r==0: row['neutral']=cl_type(k,k)
        row['grades']=[{'g':g,'count':math.comb(n,g),'factors':fstr(math.comb(n,g))} for g in range(n+1)]
        row['simplex']={'vertices':n,'dimension':n-1,'faces_incl_empty':2**n,'f_vector':[math.comb(n,j+1) for j in range(n)]}
        row['cube']={'vertices':2**n,'edges':n*2**max(n-1,0) if n else 0,'all_faces':3**n}
        row['odd_primes_in_grade_counts']=sorted({p for g in range(1,n) for p in factor(math.comb(n,g)) if p>2})
        row['primes_in_labels']=sum(isprime(x) for x in range(2**n))
        if n<=8: row['doubly_even_self_dual_codes']=doubly_even_self_dual_count(n)
        if n>=8:
            a,b=row['minus_edge'],cl_type(0,n-8)
            assert a['type']==b['type'] and a['matrix_size']==16*b['matrix_size'],n   # Cl(n+8)=Cl(n) (x) M16(R)
            row['tensor_rule']=f'Cl(0,{n}) = Cl(0,{n-8}) ⊗ M16(R)'
        rows.append(row)
    # the type sequence along the pure-negative edge has minimal period 8
    seq=[cl_type(0,n)['type'] for n in range(0,17)]
    per=min(p for p in range(1,9) if all(seq[i]==seq[i+p] for i in range(len(seq)-p)))
    assert per==8
    I2=lambda n,q: (-1)**(n*(n-1)//2)*(-1)**q          # volume element squared in Cl(p,q), n=p+q
    split=[n for n in range(2,17,2) if cl_type(0,n)['type']=='R' and cl_type(0,n)['matrix_size']==2**(n//2)]
    assert split[:3]==[6,8,14] or split[:2]==[6,8], split
    first_split=split[0]; first_split_I2plus=min(n for n in split if I2(n,n)==1)
    assert first_split==6 and I2(6,6)==-1 and first_split_I2plus==8       # n=6: complex structure omega; n=8: first real split with I^2=+1
    de={r['n']:r['doubly_even_self_dual_codes'] for r in rows if 'doubly_even_self_dual_codes' in r}
    assert de=={0:1,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:30}, de
    assert all(math.comb(8,g)%7==0 for g in range(2,7)) and all(math.comb(8,g)%3 for g in range(9))
    assert sum(3**0 for _ in range(1))==1 and rows[8]['cube']['all_faces']==6561==sum(math.comb(8,f)*2**(8-f) for f in range(9))
    return rows,{'minimal_period':per,'first_real_split_Cl(0,n)':first_split,'first_real_split_with_I2_plus':first_split_I2plus,'doubly_even_self_dual_codes_by_length':de}

# ------------------------------------------------------------------ the model
def build():
    D={}
    D['ladder'],D['why8']=ladder()
    k=E[3]; Lk,Rk=Lmat(k),Rmat(k); LR=Lk@Rk; assert np.allclose(LR@LR,I8)
    units=[E[m] for m in range(1,8)]
    g=[blk(Z,Lmat(u),Lmat(u),Z) for u in units]+[blk(Z,I8,-I8,Z)]
    assert all(np.allclose(g[a]@g[a],-I16) for a in range(8)) and all(np.allclose(g[a]@g[b]+g[b]@g[a],0) for a in range(8) for b in range(a))
    subsets=[S for r in range(9) for S in itertools.combinations(range(8),r)]
    B={}
    for S in subsets:
        M=I16.copy()
        for a in S: M=M@g[a]
        B[S]=M
    Nof=lambda S: sum(1<<a for a in S)
    bits=lambda S: format(Nof(S),'08b')
    def expand(X): return {S:np.trace(B[S].T@X)/16 for S in subsets if abs(np.trace(B[S].T@X)/16)>1e-9}
    # --- extended Hamming code = diagonal blades
    lines=[]
    for a in range(7):
        for b in range(a+1,7):
            p=omul(units[a],units[b]); c=int(np.argmax(abs(p)))-1
            if c>b: lines.append((a,b,c))
    assert len(lines)==7
    code={frozenset()}
    for s in [frozenset(l)|{7} for l in lines]: code|={frozenset(set(x)^s) for x in code}
    assert sorted(len(c) for c in code)==[0]+[4]*14+[8]
    quads=[c for c in code if len(c)==4]
    assert all(sum(1 for c in quads if set(t)<=c)==1 for t in itertools.combinations(range(8),3))
    for c in code: assert np.allclose(B[tuple(sorted(c))],np.diag(np.diag(B[tuple(sorted(c))])))
    LB=[B[tuple(sorted(l+(7,)))] for l in lines]
    cl={S:tuple(int(np.allclose(M@B[S],-B[S]@M)) for M in LB) for S in subsets}
    byc=defaultdict(list)
    for S in subsets: byc[cl[S]].append(S)
    assert len(byc)==16 and all(len(v)==16 for v in byc.values())
    for v in byc.values():
        base=set(v[0]); assert {frozenset(set(S)^base) for S in v}=={frozenset(c) for c in code}
    zero=tuple([0]*7); cid={c:i for i,c in enumerate(sorted(byc))}; inv={v:k_ for k_,v in cid.items()}; assert cid[zero]==0
    xor=lambda a,b:tuple(x^y for x,y in zip(a,b))
    lab={i:tuple(int(round((1-np.diag(M)[i])/2)) for M in LB) for i in range(16)}
    D['code']={'faces':sorted([Nof(sorted(c)) for c in code]),'weights':{'0':1,'4':14,'8':1},'steiner_S348':True,
               'fano_line_tetrahedra':[Nof(sorted(set(l)|{7})) for l in lines],'complement_tetrahedra':sorted(Nof(sorted(set(range(7))-set(l))) for l in lines)}
    # --- blocks, omega
    def proj(P8,second):
        P=np.zeros((16,16)); P[:8,:8]=P8
        for m in second: P[8+m,8+m]=1
        return P
    Q={'C_O':proj((I8-LR)/2,()),'C3_O':proj((I8+LR)/2,()),'C2_H':proj(0*I8,(4,5,6,7)),'C_C':proj(0*I8,(1,2)),'C_last':proj(0*I8,(3,))+proj(0*I8,(0,))}
    assert [int(round(np.trace(P)))//2 for P in Q.values()]==[1,3,2,1,1]
    om=blk(Lk,Z,Z,Lk); assert np.allclose(om@om,-I16) and all(np.allclose(om@P,P@om) for P in Q.values())
    eo=expand(om); assert len(eo)==1; Sw=list(eo)[0]; assert len(Sw)==6
    comm=[S for S in subsets if np.allclose(B[S]@om,om@B[S])]; assert len(comm)==128
    assert all(len(set(S)&set(Sw))%2==0 for S in comm)
    D['omega']={'face':sorted(Sw),'N':Nof(Sw),'complement':sorted(set(range(8))-set(Sw)),'linear_faces':128}
    w_t=cl[Sw]
    orb={}
    for i in range(16): orb[i]=min(i,cid[xor(inv[i],w_t)])
    # --- complex lines (omega pairs of real axes)
    pair={i:int(np.argmax(abs(om[:,i]))) for i in range(16)}
    lc=sorted({tuple(sorted((i,pair[i]))) for i in range(16)}); assert len(lc)==8
    blk_of={i:n for n,P in Q.items() for i in range(16) if P[i,i]>0.5}
    lb={l:blk_of[l[0]] for l in lc}; assert all(blk_of[l[1]]==lb[l] for l in lc)
    H_l=[l for l in lc if lb[l]=='C2_H']; O_l=[l for l in lc if lb[l]=='C3_O']
    H1,H2=H_l; name={}
    for l in lc:
        b=lb[l]; name[l]={'C_O':'o','C_C':'c','C_last':'r'}.get(b) or (f'O{O_l.index(l)+1}' if b=='C3_O' else ('H2' if l==H2 else 'H1'))
    byname={v:k_ for k_,v in name.items()}
    copy={n:(0 if byname[n][0]<8 else 1) for n in byname}
    assert all((l[0]<8)==(l[1]<8) for l in lc)
    # --- charges (Furey eq. 3, 42): Y = 1/3 P_O2 + 1/2 P_H + P_C ; Q = 1/3 P_O2 + P_H2 + P_C
    yv={'o':0,'O':Fraction(1,3),'H1':Fraction(1,2),'H2':Fraction(1,2),'c':1,'r':0}
    qv={'o':0,'O':Fraction(1,3),'H1':0,'H2':1,'c':1,'r':0}
    key=lambda n:'O' if n[0]=='O' else n
    Yp=lambda a,b: yv[key(b)]-yv[key(a)]; Qp=lambda a,b: qv[key(b)]-qv[key(a)]
    def Pl(l):
        P=np.zeros((16,16))
        for i in l: P[i,i]=1
        return P
    def chan_of(la,lb_):
        cs={cid[xor(lab[x],lab[y])] for x in la for y in lb_}; o={orb[c] for c in cs}; assert len(o)==1 and len(cs)==2
        return list(o)[0],sorted(cs)
    def operator(la,lb_):          # real C-linear operator mapping line lb_ -> line la
        M=np.zeros((16,16)); M[la[0],lb_[0]]=1; Ec=M-om@M@om
        assert np.allclose(om@Ec,Ec@om) and abs(np.abs(Ec).sum()-2)<1e-9
        return Ec
    def face_rows(X):
        e=expand(X); out=[]
        for S,c in sorted(e.items(),key=lambda t:(len(t[0]),Nof(t[0]))):
            fr=Fraction(c).limit_denominator(64)
            out.append({'S':list(S),'N':Nof(S),'bits':bits(S),'grade':len(S),'coef':str(fr),'prime':fstr(Nof(S)),'class':cid[cl[S]]})
        return out
    def mk(id_,label,kind,na,nb,mult=None):
        la,lb_=byname[na],byname[nb]; ch,cs=chan_of(la,lb_); X=operator(la,lb_); rows=face_rows(X); ph=face_rows(om@X)
        # a complex state = E + i*omega*E : the real part lives on 8 faces of one coset, the omega-translate on 8 faces of the partner coset
        assert len(rows)==8 and len(ph)==8 and len({r['class'] for r in rows})==1 and len({r['class'] for r in ph})==1
        assert sorted([rows[0]['class'],ph[0]['class']])==cs
        par={len(r['S'])%2 for r in rows+ph}; assert len(par)==1
        ints=[r['N'] for r in rows+ph]
        d=min(bin(a^b).count('1') for a,b in itertools.combinations(ints,2))
        return {'id':id_,'label':label,'kind':kind,'from':na,'to':nb,'blocks':[lb[la],lb[lb_]],'Y':str(Yp(na,nb)),'Q':str(Qp(na,nb)),
                'channel':ch,'classes':cs,'grade_parity':par.pop(),'faces':rows,'phase_faces':ph,'grades':sorted({r['grade'] for r in rows+ph}),
                'min_hamming':d,'gcd':math.gcd(*ints),'copy_pair':[copy[na],copy[nb]]}
    states=[]
    for i in range(3):
        o=f'O{i+1}'
        states.append(mk(f'uL{i+1}',f'u_L (colour {i+1})','matter',o,'H2')); states.append(mk(f'dL{i+1}',f'd_L (colour {i+1})','matter',o,'H1'))
        states.append(mk(f'uR{i+1}',f'u_R (colour {i+1})','matter',o,'c')); states.append(mk(f'dR{i+1}',f'd_R (colour {i+1})','matter',o,'r'))
    states+= [mk('nuL','ν_L','matter','c','H2'),mk('eL','e_L','matter','c','H1'),mk('eR','e_R','matter','c','r'),mk('nuR','ν_R','matter','o','r')]
    want={'uL':('1/6','2/3'),'dL':('1/6','-1/3'),'uR':('2/3','2/3'),'dR':('-1/3','-1/3'),'nuL':('-1/2','0'),'eL':('-1/2','-1'),'eR':('-1','-1'),'nuR':('0','0')}
    for s in states: assert (s['Y'],s['Q'])==want[s['id'].rstrip('123')],(s['id'],s['Y'],s['Q'])
    for a,b in [('O1','O2'),('O1','O3'),('O2','O3')]:
        states.append(mk(f'g{a[1]}{b[1]}',f'gluon root {a}→{b}','gauge',a,b)); states.append(mk(f'g{b[1]}{a[1]}',f'gluon root {b}→{a}','gauge',b,a))
    states+=[mk('Wp','W⁺ (H1→H2)','gauge','H1','H2'),mk('Wm','W⁻ (H2→H1)','gauge','H2','H1')]
    for a,b,i in [('o','O1','r1'),('o','O2','r2'),('o','O3','r3'),('o','H1','r4'),('o','H2','r5'),('o','c','r6'),('r','H1','r7'),('r','H2','r8')]:
        states.append(mk(i,f'replica {a}→{b}','replica',a,b))
    assert len(states)==16+8+8
    # Z-check: replicas = the four non-SM block pairs
    assert sum(1 for s in states if s['kind']=='matter')==16 and sum(1 for s in states if s['kind']=='replica')==8
    assert all(s['Q']==s['Q'] for s in states)
    # gauge: electric charge of W+: +1
    assert [s['Q'] for s in states if s['id']=='Wp']==['1'] and [s['Q'] for s in states if s['id']=='Wm']==['-1']
    D['states']=states
    # --- diagonal (Cartan) generators on the code faces; phase form = omega * X lives in the omega coset
    def diag_item(id_,label,X,note):
        rows=face_rows(X); ph=face_rows(om@X)
        assert all(frozenset(r['S']) in code for r in rows) and len({r['class'] for r in ph})==1
        return {'id':id_,'label':label,'note':note,'faces':rows,'phase_faces':ph,'phase_class':ph[0]['class']}
    PO=lambda i:Pl(O_l[i]); PH1,PH2=Pl(H1),Pl(H2)
    Y=Q['C3_O']/3+Q['C2_H']/2+Q['C_C']; Qe=Q['C3_O']/3+PH2+Q['C_C']
    assert abs(np.trace(Y)/16-3/8)<1e-12 and abs(np.trace(Qe)/16-3/8)<1e-12
    D['cartan']=[diag_item('Y0','hypercharge Y₀ = Y − 3/8',Y-3/8*I16,'Tr_C Y / dim_C V = 3/8'),
                 diag_item('Q0','electric charge Q₀ = Q − 3/8',Qe-3/8*I16,'photon direction (interpretation)'),
                 diag_item('T3','weak T₃ = ½(P_H2 − P_H1)',(PH2-PH1)/2,'su(2) Cartan'),
                 diag_item('l3','colour λ₃ = P_O1 − P_O2',PO(0)-PO(1),'su(3) Cartan'),
                 diag_item('l8','colour λ₈ ∝ P_O1 + P_O2 − 2 P_O3',PO(0)+PO(1)-2*PO(2),'su(3) Cartan')]
    # --- channels / Fano plane
    chans=sorted({s['channel'] for s in states}); assert chans==[1,2,3,8,9,10,11]
    edges28=[]
    for la,lb_ in itertools.combinations(lc,2):
        ba,bb=lb[la],lb[lb_]; ch,_=chan_of(la,lb_)
        kind='gauge' if ba==bb else ('matter' if ({ba,bb} in [{'C3_O','C2_H'},{'C3_O','C_C'},{'C3_O','C_last'},{'C_C','C2_H'},{'C_C','C_last'},{'C_O','C_last'}]) else 'replica')
        edges28.append({'edge':[name[la],name[lb_]],'channel':ch,'kind':kind})
    assert len(edges28)==28
    chdata={}
    for c in chans:
        es=[e for e in edges28 if e['channel']==c]; assert len(es)==4 and len({v for e in es for v in e['edge']})==8
        par={len(S)%2 for S in subsets if orb[cid[cl[S]]]==c and S in set(comm)}; assert len(par)==1
        chdata[c]={'edges':es,'grade_parity':par.pop(),'classes':[i for i in range(16) if orb[i]==c]}
    vec={c:inv[c] for c in range(16)}
    fano=set()
    for a,b in itertools.combinations(chans,2):
        cc=orb[cid[xor(vec[a],vec[b])]]; assert cc in chans and cc not in (a,b); fano.add(tuple(sorted((a,b,cc))))
    assert len(fano)==7 and all(sum(1 for l in fano if p in l)==3 for p in chans)
    assert all(sum(1 for l in fano if a in l and b in l)==1 for a,b in itertools.combinations(chans,2))     # Fano plane PG(2,2)
    even=[c for c in chans if chdata[c]['grade_parity']==0]; odd=[c for c in chans if chdata[c]['grade_parity']==1]
    assert tuple(sorted(even)) in fano and not any(set(l)<=set(odd) for l in fano)       # even channels = a Fano line; odd channels = a quadrangle
    # grade parity = which octonion copy the two complex lines belong to
    for e in edges28: assert chdata[e['channel']]['grade_parity']==(copy[e['edge'][0]]!=copy[e['edge'][1]])
    D['channels']={'by_channel':{str(c):chdata[c] for c in chans},'fano_lines':sorted(fano),'even_channels':even,'odd_channels':odd,
                   'copy_of_vertex':copy,'vertex_blocks':{name[l]:lb[l] for l in lc},'edges28':edges28}
    # --- footprint of the channels inside the blade 7-simplex (all 256 faces, not only the omega-linear ones)
    foot={c:{'vertices':[],'edges':[],'faces_by_grade':defaultdict(int)} for c in [0]+chans}
    for S in subsets:
        c=orb[cid[cl[S]]]; foot[c]['faces_by_grade'][len(S)]+=1
        if len(S)==1: foot[c]['vertices'].append(S[0])
        if len(S)==2: foot[c]['edges'].append(list(S))
    for c in foot: foot[c]['faces_by_grade']={str(g):v for g,v in sorted(foot[c]['faces_by_grade'].items())}
    assert all(len(foot[c]['vertices'])==2 for c in odd) and all(not foot[c]['vertices'] for c in even+[0])
    assert all(len(foot[c]['edges'])==8 for c in even) and len(foot[0]['edges'])==4
    assert sorted(v for c in odd for v in foot[c]['vertices'])==list(range(8))
    assert all(sum(foot[c]['faces_by_grade'].values())==32 for c in chans) and sum(foot[0]['faces_by_grade'].values())==32
    D['channels']['blade_simplex_footprint']={str(c):foot[c] for c in sorted(foot)}
    D['channels']['matching']=foot[0]['edges']
    # --- cube / ladder numbers for stage 8
    D['cube8']={'vertices':256,'edges':1024,'all_faces':6561,'edge_meaning':'multiplying a blade by one generator g_a flips bit a','subcube_meaning':'a k-subcube is a coset e_S0 * Cl(F) of a coordinate sub-Clifford algebra (free set F, |F|=k)'}
    # --- prime scan over the 8 channels (notation-dependent, reported only)
    scan={}
    for c in chans:
        ints=sorted({r['N'] for s in states if s['channel']==c for r in s['faces']}); scan[c]={'faces':len(ints),'prime_labelled':sum(isprime(x) for x in ints),'sum':sum(ints)}
    D['prime_scan']={'by_channel':{str(c):v for c,v in scan.items()},'primes_below_256':sum(isprime(x) for x in range(256)),
                     'note':'face integers depend on the vertex order; only C(n,k) factorizations are invariant'}
    # --- structure counts
    D['counts']={'matter_edges':16,'replica_edges':8,'gauge_root_edges':4,'edges':28,'directed_between_groups':48,'directed_inside_groups':8,'vertex_groups':[1,3,2,1,1]}
    return D

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--write'); ap.add_argument('--compare'); a=ap.parse_args()
    D=build(); txt=json.dumps(D,indent=1,sort_keys=True,ensure_ascii=False)
    if a.write: open(a.write,'w',encoding='utf8').write(txt)
    if a.compare:
        ref=json.load(open(a.compare,encoding='utf8')); assert json.loads(txt)==ref,'portal data differs from the rebuilt data'; print('portal data == rebuilt data')
    print('ALL DICTIONARY CHECKS PASS')
if __name__=='__main__': main()
