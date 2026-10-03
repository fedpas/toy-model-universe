import math, itertools, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
n=5; ang=lambda v: 2*math.pi*(v[0]+(0 if v[1]==1 else n))/(2*n)+math.pi/2
V=[(i,s) for i in range(n) for s in (1,-1)]
fig,axs=plt.subplots(1,3,figsize=(13,4.6),dpi=130)
for ax,(k,d) in zip(axs,[(1,4),(2,3),(5,0)]):
    eta=[-1]*k+[1]*d
    for p,q in itertools.combinations(V,2):
        if p[0]==q[0]: continue
        a,b=ang(p),ang(q); null=eta[p[0]]+eta[q[0]]==0
        ax.plot([math.cos(a),math.cos(b)],[math.sin(a),math.sin(b)],color='#c0392b' if null else '#9aa5b1',lw=1.4 if null else .7,alpha=.9 if null else .55,zorder=2 if null else 1)
    for v in V:
        a=ang(v); c='#c0392b' if eta[v[0]]==-1 else '#1f4e79'
        ax.scatter([math.cos(a)],[math.sin(a)],s=90,color=c,zorder=3); ax.text(1.17*math.cos(a),1.17*math.sin(a),('+' if v[1]==1 else '−')+(['t','τ','σ','ρ','θ'][:k]+['x','y','z','w','u'])[v[0]],ha='center',va='center',fontsize=9)
    nn=4*k*d; ax.set_title(f'{k} time + {d} space  ·  {nn} of 40 edges null' if k else '5 time-like: no null edge',fontsize=10)
    ax.set_xlim(-1.4,1.4);ax.set_ylim(-1.4,1.4);ax.set_aspect('equal');ax.axis('off')
fig.suptitle('5-orthoplex, Petrie projection: 10 vertices ±e_i, 40 edges (antipodes are opposite). Red = null edge (time pole to space pole)',fontsize=10)
plt.tight_layout(); plt.savefig('orthoplex5.png')
