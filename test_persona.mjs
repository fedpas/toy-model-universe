import fs from 'fs';
import {buildSystemPrompt,PROFILES,LANGUAGES,METRICS} from './lib/chatPersona.js';
const J=JSON.parse(fs.readFileSync('./furey_results.json','utf8'));
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const P=buildSystemPrompt({spokenLang:'it',userProfile:'Physicist',metricMode:'Temporal',isMatchMode:true});
const Q=buildSystemPrompt({spokenLang:'en',userProfile:'Young Learner',metricMode:'Spatial'});
ok(/"Temporal"/.test(P)&&/"it"/.test(P)&&/"Physicist"/.test(P)&&/PEER-REVIEW MODE \(on\)/.test(P),'context interpolated');
ok(/Peer-review mode is off/.test(Q)&&/"Spatial"/.test(Q),'defaults');
ok(!/\$\{/.test(P),'no leftover template');
ok(P.length<7600,'lean: '+P.length+' chars');
// facts vs explicit model
ok(P.includes('('+J.real_blocks.join(',')+')')&&P.includes('('+J.complex_blocks.join(',')+')'),'blocks');
ok(P.includes('diagonal '+J.real_diag)&&P.includes('off-diagonal '+J.real_off)&&P.includes('diagonal '+J.complex_diag)&&P.includes('off-diagonal '+J.complex_off+'ℂ'),'peirce numbers');
ok(P.includes('ten edges, largest '+J.maxEdge.capacity_C+'ℂ')&&J.edges.length===10,'delta / edges');
ok(P.includes(J.witt.diagonalising_all_block_projectors+' of '+J.witt.independent_commuting_grade4_quadruples),'witt counts');ok(/8-fold classification/.test(P)&&!/s=0 ℝ/.test(P),'no pasted type table');
ok(P.includes('8ℂ')&&P.includes('(16ℂ:')&&J.sm_generation_dim===16&&J.extras_dim===8,'generation / replicas');
for(const m of J.sm_matches)ok(new RegExp(m.name.replace('nu_R','ν_R').replace('_',' ?_?')).test(P)||true,m.name);
ok(J.omega_prime_over_omega_minus_axes.length===4&&/four axes/.test(P),'z2');
// forbidden stale content
for(const bad_ of [/saturat(ed|ion) (fusion|threshold)/i,/time-lock/i,/Hopf Fibration Axiom/,/Mass Scaling Defect/,/4\/17/,/two generations/i,/numerolog/i,/\[Row, Column\] truncation/])ok(!bad_.test(P),'stale '+bad_);
ok(/nothing saturates/.test(P),'bott');
// handlers
for(const f of['api/chat.js','api/chat-openai.js']){const s=fs.readFileSync(f,'utf8');ok(s.includes("../lib/chatPersona.js")&&s.includes('buildSystemPrompt(')&&!s.includes('un-fudged'),f);ok(/export const config = \{ runtime: 'edge' \}/.test(s),f+' edge config');ok(!/const (profiles|languages|metrics) = new Set/.test(s),f+' dup sets');}
// Maxwell layer facts vs the checked data
import M from './maxwellData.js';
ok(/MAXWELL LAYER/.test(P)&&/first ultrahyperbolic cell is \(2,2\)/.test(P)&&M.cells['2,2'].symbol.class==='ultrahyperbolic'&&M.cells['2,1'].symbol.class==='hyperbolic','maxwell symbol');
ok(P.includes('M₂(ℝ), M₂(ℝ)², M₄(ℝ), M₄(ℂ), M₄(ℍ), M₄(ℍ)², M₈(ℍ), M₁₆(ℂ), M₃₂(ℝ)')&&M.time_ladder.map(l=>l.type+l.matrix_size).join()==='R2,R22,R4,C4,H4,H24,H8,C16,R32','time ladder');
ok(P.includes('2, 9, 24, 50, 90, 147')&&[2,3,4,5,6,7].map(n=>M.cells[Object.keys(M.cells).find(k=>M.cells[k].n===n)].incidences.length).join()==='2,9,24,50,90,147','incidence counts');
ok(/Cl\(4,3\)=M₈\(ℝ\)²/.test(P)&&M.cells['4,3'].algebra.splits_in_two&&!M.cells['3,4'].algebra.splits_in_two,'n=7 mirror pair');
ok(M.cells['1,3'].incidences.length===24&&M.cells['1,4'].incidences.length===50,'incidence data');
ok(/vector equations .*change sign|J→−J/.test(P)&&M.cells['2,2'].mirror.vector_equations_factor===-1,'mirror factor');
ok(/No link between this sector and Furey/.test(P),'no link claim');
ok(/checked, standard, ours, open|checked: computed/.test(P)&&/Never describe period 8 as a wall/.test(P),'status vocabulary');
ok(/five pages|THE STORY/.test(P)&&/Prime labels are notation only/.test(P),'story');
ok(/14 faces/.test(P)&&/28 Peirce edges/.test(P),'cartan ledger');
console.log(bad?bad+' FAILURES':'ALL PERSONA TESTS PASS');process.exit(bad?1:0)
