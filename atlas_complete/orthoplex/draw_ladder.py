import math, itertools, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
info={0:('point','Cl(0)=R','node 0'),1:('segment','Cl(1,1)=M2(R)','node 2'),2:('square','Cl(2,2)=M4(R)','node 4'),3:('octahedron','Cl(3,3)=M8(R)','node 6'),4:('16-cell','Cl(4,4)=M16(R)','node 8'),5:('5-orthoplex','Cl(5,5)=M2 x M16','node 10')}
fig,axs=plt.subplots(1,6,figsize=(15,3.4),dpi=130)
for n,ax in zip(range(6),axs):
    V=[(i,s) for i in range(n) for s in (1,-1)]
    ang=lambda v: 2*math.pi*(v[0]+(0 if v[1]==1 else n))/(2*n)+math.pi/2 if n else 0
    for p,q in itertools.combinations(V,2):
        if p[0]==q[0]: continue
        a,b=ang(p),ang(q); ax.plot([math.cos(a),math.cos(b)],[math.sin(a),math.sin(b)],color='#6b7a8a',lw=.8)
    if n==1: ax.plot([0,0],[math.sin(ang(V[0])),math.sin(ang(V[1]))],color='#6b7a8a',lw=.8)
    if n==0: ax.scatter([0],[0],s=60,color='#1f4e79')
    for v in V:
        a=ang(v); ax.scatter([math.cos(a)],[math.sin(a)],s=45,color='#1f4e79',zorder=3)
    f=[math.comb(n,m)*2**m for m in range(1,n+1)]
    ax.set_title(f'n={n}  {info[n][0]}\n{info[n][1]}  ({info[n][2]})',fontsize=9)
    ax.text(0,-1.55,'faces by size: '+(' · '.join(map(str,f)) if f else '1 (empty)')+f'\nfacets = {2**n} = Fock states',ha='center',va='top',fontsize=8)
    ax.set_xlim(-1.35,1.35);ax.set_ylim(-1.9,1.35);ax.set_aspect('equal');ax.axis('off')
fig.suptitle('Orthoplex ladder read as n modes (n Witt pairs = Genesis node 2n)',fontsize=11,y=1.0)
plt.tight_layout(rect=(0,0,1,.93)); plt.savefig('ladder.png')
