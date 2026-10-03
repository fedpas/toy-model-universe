import fs from 'fs';
import M from './maxwellData.js';
import {MAXWELL_PY} from './maxwellSelfcheckSource.js';
import {cliffordCell} from './genesis_audit_v3.js';
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const J=JSON.parse(fs.readFileSync('./selfcheck/maxwell.json','utf8'));
ok(JSON.stringify(J)===JSON.stringify(JSON.parse(JSON.stringify(M))),'data equals rebuilt JSON');
ok(MAXWELL_PY===fs.readFileSync('./selfcheck/maxwell_selfcheck.py','utf8'),'embedded script equals file');
const norm=t=>t.replace(/[²2]$/,'');
// space ladder Cl(1,d) and time ladder Cl(k,1) against the independent JS engine
for(const l of M.ladder){const c=cliffordCell(l.p,l.q);ok(c.N===l.matrix_size&&norm(c.kind)===norm(l.type),`Cl(${l.p},${l.q})`)}
for(const l of M.time_ladder){const c=cliffordCell(l.k,1);ok(c.N===l.matrix_size&&norm(c.kind)===norm(l.type),`Cl(${l.k},1) ${c.kind}${c.N} vs ${l.type}${l.matrix_size}`);
 const m=cliffordCell(1,l.k);ok(m.N===l.mirror_matrix_size&&norm(m.kind)===norm(l.mirror_type),`mirror Cl(1,${l.k})`)}
// period 8 along time: Cl(k+8,1) = Cl(k,1) tensor M16(R)
for(let k=1;k<=11;k++){const a=cliffordCell(k,1),b=cliffordCell(k+8,1);ok(a.kind===b.kind&&b.N===16*a.N,`period 8 at k=${k}`)}
ok(M.ladder.map(l=>l.equations_total).join()==='1,2,4,8,15,26,42,64,93','equation counts n+C(n,3)');
ok(M.time_ladder.map(l=>l.equations_total).join()==='2,4,8,15,26,42,64,93,130','time-ladder equation counts');
// independent blade product: generators below k square +1, the rest -1
const pc=m=>(m.toString(2).match(/1/g)||[]).length;
const prod=(a,b,k)=>{let s=1;for(let t=a>>1;t;t>>=1)if(pc(t&b)%2)s=-s;let c=a&b,i=0;while(c){if(c&1)s*=i<k?1:-1;c>>=1;i++}return[a^b,s]};
const C=(n,r)=>r<0||r>n?0:r===0?1:n*C(n-1,r-1)/r;
const incExp={2:2,3:9,4:24,5:50};
const byN={};
for(const key of Object.keys(M.cells)){const D=M.cells[key],k=D.k,d=D.d,n=k+d;
 ok(key===`${k},${d}`&&D.n===n&&D.blades.length===1<<n,`${key} blades`);
 ok(D.counts.E===k*d&&D.counts.T===C(k,2)&&D.counts.B===C(d,2),`${key} field counts`);
 const order=D.conventions.field_order,sg=D.conventions.signs,sF={};
 D.incidences.forEach(i=>{sF[i.source]=sg[order.indexOf(i.field)]});
 ok(D.incidences.length===incExp[n],`${key} incidences ${D.incidences.length}`);
 for(const i of D.incidences){const[m,s]=prod(1<<i.axis,i.source,k);ok(m===i.target&&s*sF[i.source]===i.sign,`${key} ${i.field} d${i.axis_name}`);ok((i.source^(1<<i.axis))===i.target,'XOR rule')}
 ok(D.equations.length===n+C(n,3),`${key} equations`);
 for(const e of D.equations){const tt=D.incidences.filter(i=>i.target===e.target).length;ok(e.terms.length===tt,`${key} terms ${e.id}`);ok(e.op==='contract'?e.terms.length===n-1:e.terms.length===3,`${key} term count by op ${e.id}`)}
 ok(D.cube.edges.length===n*2**(n-1)&&D.cube.edges.every(([a,b,ax])=>(a^b)===(1<<ax)),`${key} cube`);
 ok(D.conventions.found===2&&D.checks.conventions===2,`${key} two conventions`);
 ok(D.checks.wave_equation&&D.checks.only_grades_1_and_3&&D.checks.charge_conservation,`${key} checks`);
 // symbol class
 const mn=Math.min(k,d),cl=mn===0?'elliptic':mn===1?'hyperbolic':'ultrahyperbolic';ok(D.symbol.class===cl,`${key} symbol ${D.symbol.class}`);
 // algebra against independent engine
 const c=cliffordCell(k,d);ok(c.N===D.algebra.matrix_size&&norm(c.kind)===norm(D.algebra.type),`${key} algebra`);
 // mirror
 ok(D.mirror.mirror_of[0]===d&&D.mirror.mirror_of[1]===k&&D.mirror.vector_equations_factor===-1&&D.mirror.triple_equations_factor===(n>=3?1:null),`${key} mirror factors`);
 (byN[n]=byN[n]||[]).push(D);}
// same n => same incidence structure (source, axis, target) in every split
for(const n in byN){const sets=byN[n].map(D=>JSON.stringify(D.incidences.map(i=>[i.source,i.axis,i.target]).sort()));ok(new Set(sets).size===1,`n=${n} same incidence set across splits`)}
ok(Object.keys(M.cells).length===10,'ten cells k+d<=5');
// Maxwell k=1 physical facts
const by3=Object.fromEntries(M.cells['1,3'].equations.map(e=>[e.id,e]));
ok(by3.gauss.terms.join()==='+∂xEx,+∂yEy,+∂zEz','3D Gauss terms');
ok(M.cells['1,3'].equations.filter(e=>e.id.startsWith('far_')).length===3,'3D Faraday count');
ok(M.cells['1,4'].equations.filter(e=>e.id.startsWith('far_')).length===6&&M.cells['1,4'].equations.filter(e=>e.id.startsWith('bian_')).length===4,'d=4 Faraday/Bianchi counts');
// first genuinely new regime
ok(Object.values(M.cells).filter(c=>c.symbol.class==='ultrahyperbolic').map(c=>`${c.k},${c.d}`).sort().join()==='2,2,2,3,3,2','ultrahyperbolic cells');
// d=7 = Cl(0,8) as algebra; splitting at d=0,4,8
{const a=cliffordCell(1,7),b=cliffordCell(0,8);ok(a.N===16&&b.N===16&&a.kind===b.kind,'Cl(1,7)=Cl(0,8)');
 ok(M.ladder.filter(l=>l.same_algebra_as_Cl08).map(l=>l.d).join()==='7','only d=7');
 ok(M.ladder.filter(l=>l.splits_in_two).map(l=>l.d).join()==='0,4,8','splits d=0,4,8');
 for(const l of M.ladder){const n=l.n,I=(1<<n)-1;let c=true;for(let a=0;a<n;a++)if(prod(I,1<<a,1)[1]!==prod(1<<a,I,1)[1])c=false;ok(c===l.pseudoscalar_central&&prod(I,I,1)[1]===l.pseudoscalar_square,`n=${n} pseudoscalar`)}
 for(const l of M.time_ladder){const n=l.n,I=(1<<n)-1;ok(prod(I,I,l.k)[1]===l.pseudoscalar_square,`time n=${n} I^2`)}}
ok(/--compare/.test(MAXWELL_PY)&&/ALL MAXWELL CHECKS PASS/.test(MAXWELL_PY),'script interface');
console.log(bad?bad+' FAILURES':'ALL MAXWELL TESTS PASS');process.exit(bad?1:0)
