import fs from 'fs';
import katex from 'katex';
import {FINDINGS,FINDINGS_UI,EDGES,REAL_BLOCKS,COMPLEX_BLOCKS,BLOCK_NAMES,NUMBERS} from './findingsData.js';
import {peirceDecomposition} from './genesis_audit_v3.js';
const J=JSON.parse(fs.readFileSync('./furey_results.json','utf8'));
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
ok(eq(REAL_BLOCKS,J.real_blocks),'real blocks');ok(eq(COMPLEX_BLOCKS,J.complex_blocks),'complex blocks');
ok(NUMBERS.realDiag===J.real_diag&&NUMBERS.realOff===J.real_off&&NUMBERS.cxDiag===J.complex_diag&&NUMBERS.cxOff===J.complex_off,'peirce numbers');
ok(NUMBERS.deltaSM===J.delta_SM_real_dim&&NUMBERS.generation===J.sm_generation_dim&&NUMBERS.replicas===J.extras_dim&&NUMBERS.maxEdge===J.maxEdge.capacity_C,'sm numbers');
ok(NUMBERS.quadruples===J.witt.independent_commuting_grade4_quadruples&&NUMBERS.diagonalising===J.witt.diagonalising_all_block_projectors&&NUMBERS.fanoLines===J.witt.fano_lines,'witt numbers');
const idx={'C_O(1)':0,'C3_O(3)':1,'C2_H(2)':2,'C_C(1)':3,'C_last(1)':4};
ok(J.edges.length===EDGES.length,'edge count');
for(const e of J.edges){const a=idx[e.a],b=idx[e.b];const m=EDGES.find(x=>(x[0]===a&&x[1]===b)||(x[0]===b&&x[1]===a));ok(!!m&&m[2]===e.capacity_C,`edge ${e.a}-${e.b} capacity`);
 // block sizes consistent with capacity
 ok(e.capacity_C===2*COMPLEX_BLOCKS[a]*COMPLEX_BLOCKS[b],`2nn ${e.a}-${e.b}`)}
const smSet=EDGES.filter(x=>x[4]==='sm'),rep=EDGES.filter(x=>x[4]==='rep');
const smOne=smSet.reduce((t,x)=>t+(x[2]===12?6:x[2]/2),0),repOne=rep.reduce((t,x)=>t+x[2]/2,0);
ok(smOne===16&&repOne===8,'one-way SM 16 / replicas 8: '+smOne+'/'+repOne);
const pd=peirceDecomposition();ok(pd.edgeTotalC===48&&pd.smContent.generationC===16&&pd.smContent.replicaC===8,'audit module agrees');
ok(J.witt.cayley_dickson_flag_affine.every(Boolean)&&J.witt.block_is_affine.O2===false,'affine flag');
ok(eq(J.omega_prime_over_omega_minus_axes,[0,3,8,11])&&/0,3,8,11/.test(FINDINGS.find(f=>f.id==='z2').en.Physicist[1]),'z2 axes');
// text coverage + no stale claims
for(const f of FINDINGS)for(const L of['en','it'])for(const P of['Young Learner','Physicist','Mathematician']){const t=f[L]?.[P];ok(Array.isArray(t)&&t.length===2&&t[0]&&t[1],`${f.id}.${L}.${P}`)}
for(const f of FINDINGS)for(const L of['en','it'])for(const P in f[L])ok(!/withdrawn|retract|ritirat|ritrattaz|two generations|due generazioni|rejected|respint|corrected/i.test(f[L][P][1]+f[L][P][0]),`no history claims ${f.id}.${L}.${P}`);
console.log(bad?bad+' FAILURES':'ALL FINDINGS TESTS PASS');process.exit(bad?1:0)
