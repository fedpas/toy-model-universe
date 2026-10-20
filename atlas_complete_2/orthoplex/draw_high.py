import math, itertools, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig,axs=plt.subplots(1,4,figsize=(15,4),dpi=130)
for ax,n in zip(axs,(6,7,8,12)):
    V=[(i,s) for i in range(n) for s in (1,-1)]
    ang=lambda v: 2*math.pi*(v[0]+(0 if v[1]==1 else n))/(2*n)+math.pi/2
    for p,q in itertools.combinations(V,2):
        if p[0]==q[0]: continue
        a,b=ang(p),ang(q); ax.plot([math.cos(a),math.cos(b)],[math.sin(a),math.sin(b)],color='#6b7a8a',lw=.35 if n<12 else .15,alpha=.8)
    for v in V:
        a=ang(v); ax.scatter([math.cos(a)],[math.sin(a)],s=22,color='#1f4e79',zorder=3)
    ax.set_title(f'n={n}: {2*n} vertices, {2*n*(n-1)} edges, {2**n} facets',fontsize=9)
    ax.set_xlim(-1.15,1.15);ax.set_ylim(-1.15,1.15);ax.set_aspect('equal');ax.axis('off')
fig.suptitle('The 2D trick for the orthoplex: Petrie polygon, any n (antipodes opposite, every other pair joined)',fontsize=10,y=1.0)
plt.tight_layout(rect=(0,0,1,.93)); plt.savefig('orthoplex_high.png')
