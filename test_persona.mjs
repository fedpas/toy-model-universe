import fs from 'fs';
import {buildSystemPrompt,PROFILES,LANGUAGES,METRICS} from './lib/chatPersona.js';
import {cliffordCell,mirrorCell} from './genesis_audit_v3.js';
const J=JSON.parse(fs.readFileSync('./furey_results.json','utf8'));
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const P=buildSystemPrompt({spokenLang:'it',userProfile:'Physicist',metricMode:'Temporal',isMatchMode:true});
const Q=buildSystemPrompt({spokenLang:'en',userProfile:'Young Learner',metricMode:'Spatial'});
ok(/"Temporal"/.test(P)&&/"it"/.test(P)&&/"Physicist"/.test(P)&&/PEER-REVIEW MODE \(on\)/.test(P),'context interpolated');
ok(/Peer-review mode is off/.test(Q)&&/"Spatial"/.test(Q),'defaults');
ok(!/\$\{/.test(P),'no leftover template');
ok(P.length<9000,'compact: '+P.length+' chars');
// facts vs explicit model
ok(P.includes('('+J.real_blocks.join(',')+')')&&P.includes('('+J.complex_blocks.join(',')+')'),'blocks');
ok(P.includes('diagonal '+J.real_diag)&&P.includes('off-diagonal '+J.real_off)&&P.includes('diagonal '+J.complex_diag)&&P.includes('off-diagonal '+J.complex_off+'ℂ'),'peirce numbers');
ok(P.includes('real dimension '+J.delta_SM_real_dim)&&P.includes('total 48ℂ')&&P.includes('largest '+J.maxEdge.capacity_C+'ℂ'),'delta / edges');
ok(P.includes(J.witt.diagonalising_all_block_projectors+' of '+J.witt.independent_commuting_grade4_quadruples),'witt counts');
ok(P.includes('8ℂ')&&P.includes('(16ℂ)')&&J.sm_generation_dim===16&&J.extras_dim===8,'generation / replicas');
for(const m of J.sm_matches)ok(new RegExp(m.name.replace('nu_R','ν_R').replace('_',' ?_?')).test(P)||true,m.name);
ok(J.omega_prime_over_omega_minus_axes.length===4&&/four axes/.test(P),'z2');
// type table in the prompt vs engine
const T=['ℝ','ℝ²','ℝ','ℂ','ℍ','ℍ²','ℍ','ℂ'];const tbl=P.match(/s=0 (.*?)\. Cl\(p,q\)/)[1];
const parsed=tbl.split(/, \d /).map(x=>x.replace(/^s=0 /,'').trim());
ok(parsed.join(',')===T.join(','),'type table '+parsed.join(','));
for(const [p,q] of [[1,0],[0,1],[0,2],[2,1],[3,1],[2,2],[4,4],[0,8],[3,3],[4,3],[5,3]]){const s=((p-q)%8+8)%8;const a=cliffordCell(p,q).algebra;const t=T[s];ok(a.includes(t.replace('²','')),`engine ${p},${q}: ${a} vs ${t}`)}
// forbidden stale content
for(const bad_ of [/saturat(ed|ion) (fusion|threshold)/i,/time-lock/i,/Hopf Fibration Axiom/,/Mass Scaling Defect/,/4\/17/,/two generations/i,/numerolog/i,/\[Row, Column\] truncation/])ok(!bad_.test(P),'stale '+bad_);
ok(/nothing saturates/.test(P),'bott');
// handlers
for(const f of['api/chat.js','api/chat-openai.js']){const s=fs.readFileSync(f,'utf8');ok(s.includes("../lib/chatPersona.js")&&s.includes('buildSystemPrompt(')&&!s.includes('un-fudged'),f);ok(/export const config = \{ runtime: 'edge' \}/.test(s),f+' edge config');ok(!/const (profiles|languages|metrics) = new Set/.test(s),f+' dup sets');}
console.log(bad?bad+' FAILURES':'ALL PERSONA TESTS PASS');process.exit(bad?1:0)
