import fs from 'fs';
import T from './threegenData.js';
import {THREEGEN_PY} from './threegenSelfcheckSource.js';
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const J=JSON.parse(fs.readFileSync('./selfcheck/threegen.json','utf8')),Fu=JSON.parse(fs.readFileSync('./furey_results.json','utf8'));
ok(JSON.stringify(J)===JSON.stringify(JSON.parse(JSON.stringify(T))),'data equals rebuilt JSON');
ok(THREEGEN_PY===fs.readFileSync('./selfcheck/threegen_selfcheck.py','utf8'),'embedded script equals file');
// parse irreps independently of the python tables: dimension and hypercharge in sixths
const CD={'1':1,'3':3,'3b':3,'6':6,'6b':6,'8':8};
const parse=s=>{const m=/^\((\w+),(\d),([+-]?\d+(?:\/\d+)?)\)$/.exec(s);const [n,d]=m[3].split('/').map(Number);return {dim:CD[m[1]]*Number(m[2]),y6:Math.round(6*n/(d||1))}};
const tot=o=>Object.entries(o).reduce((a,[k,m])=>a+parse(k).dim*m,0);
ok(tot(T.linear_off_diagonal_irreps)===48&&tot(T.antilinear_irreps)===64,'sector dimensions 48 and 64');
// independent hypercharge bookkeeping, state by state: blocks (dim, y in sixths) from the data
const states=[];for(const b of T.blocks){const [n,d]=b.y.split('/').map(Number);for(let i=0;i<b.dim;i++)states.push(Math.round(6*n/(d||1)))}
ok(states.length===8,'eight complex dimensions');
const cnt=(arr)=>{const c={};for(const v of arr)c[v]=(c[v]||0)+1;return JSON.stringify(Object.entries(c).sort((a,b)=>a[0]-b[0]))};
// antilinear sector: charge y_t + y_s over all ordered pairs of states
const antiExp=[];for(const t of states)for(const s of states)antiExp.push(t+s);
const antiGot=[];for(const [k,m] of Object.entries(T.antilinear_irreps)){const p=parse(k);for(let i=0;i<p.dim*m;i++)antiGot.push(p.y6)}
ok(cnt(antiExp)===cnt(antiGot),'antilinear charges state by state');
// linear sector off the diagonal blocks: y_t - y_s over pairs in different blocks
const blockOf=[];T.blocks.forEach((b,i)=>{for(let j=0;j<b.dim;j++)blockOf.push(i)});
const linExp=[];states.forEach((yt,a)=>states.forEach((ys,b)=>{if(blockOf[a]!==blockOf[b])linExp.push(yt-ys)}));
const linGot=[];for(const [k,m] of Object.entries(T.linear_off_diagonal_irreps)){const p=parse(k);for(let i=0;i<p.dim*m;i++)linGot.push(p.y6)}
ok(cnt(linExp)===cnt(linGot),'linear off-diagonal charges state by state');
// agrees with the earlier explicit-model audit (run_all.py)
ok(Fu.complex_off===48&&Fu.sm_generation_dim===16&&Fu.extras_dim===8,'furey_results.json');
ok(T.sm_rows.Q_L.linear===1&&T.sm_rows.u_R.linear===1&&T.sm_rows.d_R.linear===2&&T.sm_rows.L.linear===3&&T.sm_rows.e_R.linear===2,'multiplicities = one generation + replicas');
ok(T.linear_beyond_one_generation.d_R===1&&T.linear_beyond_one_generation.L===2&&T.linear_beyond_one_generation.e_R===1,'replica content d_R, 2 L, e_R');
ok(T.exotic.linear_off_diagonal===0&&T.exotic.antilinear===32,'exotic content');
// the dimension count that makes three generations look possible, and why it does not work
ok(3*2*16*2===192&&192<=256,'three generations of particle and antiparticle would fit in 256 real dimensions');
ok(48===3*16,'48 = 3 x 16 is a numerical coincidence of capacity, not a content statement');
ok(T.search_all.max_generations===2&&!('3' in T.search_all.histogram)&&T.search_all.admissible_W===5582,'no admissible W has three generations');
ok(T.search_peirce_frame.assignments===4000&&!('3' in T.search_peirce_frame.histogram)&&T.search_peirce_frame.histogram['2']===60,'Peirce frame search');
ok(T.search_all.least_exotic_dimension_for_generations['2']>0&&T.search_peirce_frame.least_exotic_dimension_for_generations['2']>0,'two generations always come with exotic content');
ok(Object.values(T.max_copies_of_each_irrep).every(v=>v>=2)&&T.max_copies_of_each_irrep.Q_L===4,'each irrep alone can be repeated, never all six together');
ok(/--compare/.test(THREEGEN_PY)&&/ALL THREE-GENERATION CHECKS PASS/.test(THREEGEN_PY),'script interface');
console.log(bad?bad+' FAILURES':'ALL THREEGEN TESTS PASS');process.exit(bad?1:0)
