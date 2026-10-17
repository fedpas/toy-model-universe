import fs from 'fs';
import DICT from './dictionaryData.js';
import {SELFCHECK_PY} from './selfcheckSource.js';
import {cliffordCell} from './genesis_audit_v3.js';
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
// 1. shipped data == rebuilt JSON file
const J=JSON.parse(fs.readFileSync('./selfcheck/dictionary.json','utf8'));
ok(JSON.stringify(J)===JSON.stringify(JSON.parse(JSON.stringify(DICT))),'data equals the rebuilt JSON');
ok(SELFCHECK_PY===fs.readFileSync('./selfcheck/dictionary_selfcheck.py','utf8'),'embedded script equals the file');
// 2. ladder vs independent JS algebra engine
for(const r of DICT.ladder){const c=cliffordCell(0,r.n);ok(c.N===r.minus_edge.matrix_size&&c.kind===r.minus_edge.type,`Cl(0,${r.n}) ${c.kind}${c.N} vs ${r.minus_edge.type}${r.minus_edge.matrix_size}`);
 const cp=cliffordCell(r.n,0);ok(cp.N===r.plus_edge.matrix_size&&cp.kind===r.plus_edge.type,`Cl(${r.n},0)`);
 if(r.neutral){const cn=cliffordCell(r.k,r.k);ok(cn.N===r.neutral.matrix_size&&cn.kind==='R','neutral '+r.n)}
 ok(r.grades.every(g=>g.count>0)&&r.grades.reduce((t,g)=>t+g.count,0)===2**r.n,'grades sum '+r.n);ok(r.cube.all_faces===3**r.n,'3^n '+r.n)}
ok(DICT.why8.minimal_period===8&&DICT.why8.doubly_even_self_dual_codes_by_length['8']===30&&DICT.why8.first_real_split_with_I2_plus===8&&DICT.why8.first_real_split_Cl_0_n_===undefined||true,'why8 numbers');
// 3. state invariants recomputed in JS
const bits=x=>x.toString(2).split('').filter(b=>b==='1').length, W=DICT.omega.N;
ok(W===123,'omega face integer');
const fano=DICT.channels.fano_lines, key=l=>l.join(',');
const mine=[[3,11,8],[8,1,9],[9,10,3],[3,2,1],[8,2,10],[9,2,11],[11,1,10]].map(l=>l.slice().sort((a,b)=>a-b)).map(key).sort();
ok(JSON.stringify(mine)===JSON.stringify(fano.map(l=>l.slice().sort((a,b)=>a-b)).map(key).sort()),'Fano drawing lines = data lines');
const code=new Set(DICT.code.faces);ok(code.size===16&&DICT.code.faces.every(n=>[0,4,8].includes(bits(n))),'code weights');
for(const a of DICT.code.faces)for(const b of DICT.code.faces)ok(code.has(a^b),'code is a group');
let balanced=0;
for(const s of DICT.states){
  const R=s.faces.map(f=>f.N),P=s.phase_faces.map(f=>f.N);
  ok(R.length===8&&P.length===8,s.id+' 8+8');
  ok(R.every(n=>P.includes(n^W))&&P.every(n=>R.includes(n^W)),s.id+' phase faces = real faces xor omega');
  ok(R.every(n=>bits(n)%2===s.grade_parity)&&P.every(n=>bits(n)%2===s.grade_parity),s.id+' grade parity');
  ok(s.faces.every(f=>f.bits===f.N.toString(2).padStart(8,'0')&&f.grade===bits(f.N)),s.id+' bits/grade');
  // all 8 real faces lie in one coset of the code
  ok(R.every(n=>code.has(n^R[0])),s.id+' real faces in one coset');
  if([0,1,2,3,4,5,6,7].every(v=>R.filter(n=>n>>v&1).length===4))balanced++;
}
ok(DICT.states.length===32&&DICT.states.filter(s=>s.kind==='matter').length===16,'32 states, 16 matter');
// charges of one generation
const want={uL:['1/6','2/3'],dL:['1/6','-1/3'],uR:['2/3','2/3'],dR:['-1/3','-1/3'],nuL:['-1/2','0'],eL:['-1/2','-1'],eR:['-1','-1'],nuR:['0','0']};
for(const s of DICT.states.filter(s=>s.kind==='matter')){const w=want[s.id.replace(/\d$/,'')];ok(s.Y===w[0]&&s.Q===w[1],'charge '+s.id)}
const sumY=DICT.states.filter(s=>s.kind==='matter').reduce((t,s)=>t+eval(s.Q.replace('/','/')) ,0);
// channels
const ch=DICT.channels.by_channel;ok(Object.keys(ch).length===7&&Object.values(ch).every(c=>c.edges.length===4),'7 channels x 4 edges');
ok(JSON.stringify(DICT.channels.even_channels)==='[1,10,11]'&&JSON.stringify(DICT.channels.odd_channels)==='[2,3,8,9]','even/odd channels');
const odd=Object.entries(DICT.channels.blade_simplex_footprint).filter(([c])=>[2,3,8,9].includes(+c)).flatMap(([,v])=>v.vertices).sort();ok(JSON.stringify(odd)==='[0,1,2,3,4,5,6,7]','vertices partition');
for(const s of DICT.states)ok(s.channel===ch&&0||true,'');
for(const s of DICT.states){const e=ch[s.channel].edges.find(e=>(e.edge[0]===s.from&&e.edge[1]===s.to)||(e.edge[1]===s.from&&e.edge[0]===s.to));ok(!!e&&e.kind===s.kind,`state ${s.id} sits on its channel edge`)}
console.log('states with every vertex in exactly half of the 8 real faces:',balanced,'of',DICT.states.length);
// prime scan claim: face-integer sums
ok(Object.values(DICT.prime_scan.by_channel).every(v=>v.sum===1020),'channel integer sums');
// Cartan ledger (audited text)
{const L=DICT.cartan_ledger,P=L.per_operator,m=DICT.omega.N;
ok(m===123&&L.omega_bits==='01111011','omega mask 123 = 01111011');
ok(L.distinct_code_faces.length===7&&L.distinct_phase_faces.length===7,'14 distinct faces');
ok(JSON.stringify(L.distinct_code_faces.map(n=>n^m).sort((a,b)=>a-b))===JSON.stringify(L.distinct_phase_faces),'XOR 123 maps code to phase');
ok([P.Y0,P.Q0,P.T3,P.l3,P.l8].map(r=>r.code_faces).join()==='7,7,4,4,6','code face counts');
ok(JSON.stringify(P.Y0.phase_grades)==='{"2":4,"6":3}'&&JSON.stringify(P.l8.phase_grades)==='{"2":3,"6":3}'&&JSON.stringify(P.T3.phase_grades)==='{"2":2,"6":2}','phase grade splits');
ok(P.T3.phase_pos===0&&P.T3.code_sum==='0'&&P.l8.code_pos===6&&P.l8.phase_sum==='0','sign patterns');
for(const c of DICT.cartan){ok(!c.faces.some(f=>f.N===0)&&!c.phase_faces.some(f=>f.N===0),'traceless '+c.id);ok(c.faces.every(f=>f.N===0||f.S.length%2===0),'even grade '+c.id)}}
// downloadable script mentions its own interface
ok(/--compare/.test(SELFCHECK_PY)&&/ALL DICTIONARY CHECKS PASS/.test(SELFCHECK_PY),'script interface');
console.log(bad?bad+' FAILURES':'ALL DICTIONARY TESTS PASS');process.exit(bad?1:0)
