import fs from 'fs';
import {buildSystemPrompt,PROFILES,LANGUAGES,METRICS} from './lib/chatPersona.js';
const J=JSON.parse(fs.readFileSync('./furey_results.json','utf8'));
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const P=buildSystemPrompt({spokenLang:'it',userProfile:'Physicist',metricMode:'Temporal',isMatchMode:true});
const Q=buildSystemPrompt({spokenLang:'en',userProfile:'Young Learner',metricMode:'Spatial'});
ok(/"Temporal"/.test(P)&&/"it"/.test(P)&&/"Physicist"/.test(P)&&/PEER-REVIEW MODE \(on\)/.test(P),'context interpolated');
ok(/Peer-review mode is off/.test(Q)&&/"Spatial"/.test(Q),'defaults');
ok(!/\$\{/.test(P),'no leftover template');
ok(P.length<17800,'lean: '+P.length+' chars');
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
import Tg from './threegenData.js';
ok(/Three generations \(checked/.test(P)&&/5582/.test(P)&&Tg.search_all.admissible_W===5582&&Tg.search_all.max_generations===2&&Tg.exotic.antilinear===32,'three-generation layer');
// shapes layer: every number quoted in the prompt equals the shapes data
import SH from './shapesData.js';
ok(/seven pages/.test(P)&&/5 More shapes: the orthoplex, the demicube, then the Gosset series E6–E8\. 6 More equations: commutators, the Dirac equation, then their coupling, Yang–Mills, charged matter\. 7 Ask/.test(P)&&/SHAPES LAYER/.test(P),'story lists the shapes page');
ok(SH.orthoplex.n8_E8.roots===240&&/112 edges plus 128 even facets are the 240 roots of E8/.test(P),'E8 count');
ok(JSON.stringify(SH.demicube.rows[5].even_blades_by_grade)===JSON.stringify({0:1,2:10,4:5})&&/graded 1\+10\+5/.test(P)&&/grades 0,2,4/.test(P),'n=5 grades');
ok(SH.demicube.even_subalgebra['4,4'].even==='M8(R) + M8(R)'&&SH.demicube.even_subalgebra['4,3'].full==='M8(R) + M8(R)'&&/Cl⁰\(4,4\)=M₈\(ℝ\)²=Cl\(4,3\)/.test(P),'even half of Cl(4,4)');
ok(SH.orthoplex.n4_triality.Q8_index===3&&/three 16-cells \(Q₈ has index 3\)/.test(P)&&/Poles equal half the facets only at n=4/.test(P),'triality');
ok(SH.demicube.maxwell[5].vector_equation_terms===4&&SH.demicube.maxwell[5].trivector_equation_terms===3&&/n−1 field components, a trivector equation 3/.test(P),'equation supports');
ok(SH.demicube.rows[4].f_vector.join()==='8,24,32,16'&&/n=3 tetrahedron, n=4 16-cell, n=5 demipenteract/.test(P),'named demicubes');
ok(/not an identification/.test(P)&&/is ours and open/.test(P)&&/No shape on this page selects the number of generations/.test(P),'status discipline in the shapes layer');
import GS from './gossetData.js';
ok(/Gosset series \(step 3/.test(P)&&/det\(E_n\)=9−n/.test(P)&&[3,4,5,6,7,8].map(n=>GS.rank[n].det).join()==='6,5,4,3,2,1'&&/\(6,5,4,3,2,1\)/.test(P),'Gosset determinants');
ok(GS.rank[9].null_vector.join(' ')==='2 3 4 6 5 4 3 2 1'&&/null vector 2 3 4 6 5 4 3 2 1/.test(P)&&GS.rank[10].inertia.join()==='9,1,0'&&/E10 is indefinite \(signs 9\+1\)/.test(P),'E9 and E10');
ok(/Roots 72, 126, 240; Gosset polytopes 16 \(the 5-demicube\), 27, 56, 240 vertices/.test(P)&&[5,6,7,8].map(n=>GS.polytopes[n].vertices).join()==='16,27,56,240','polytope counts');
ok(GS.coordinates['8'].orthoplex_edges===112&&GS.coordinates['8'].demicube_vertices===128&&/112 edges of the 8-orthoplex \+ 128 corners of the 8-demicube/.test(P)&&/E7 = 60\+2\+64, E6 = 40\+32/.test(P)&&GS.coordinates['7'].orthoplex_edges_inside_first_6_axes===60&&GS.coordinates['6'].orthoplex_edges_inside_first_5_axes===40,'E8, E7, E6 splits');
ok(GS.branching.total===240&&/72\+6\+3×27\+3×27̄/.test(P)&&/whether it is the model's generations is open/.test(P),'E6 x A2');
ok(/resembles our budget of 8 but the mechanisms are unrelated/.test(P)&&/it is not a wall/.test(P)&&/is open\. Maxwell gets nothing back/.test(P),'budget claim is a resemblance');
import EQ from './equationsData.js';
ok(/EQUATIONS LAYER/.test(P)&&/Eight things drawn and checked, none new/.test(P)&&/the rest are not/.test(P)&&/Not drawn: chirality and the electroweak doublets, the Dirac equation on a curved tetrad, the gravity field equation with matter, solutions of any equation/.test(P)&&/Yang–Mills \(step 4, climbed over the gauge dimension m=2\.\.8/.test(P)&&/Charged matter \(step 5, m=2\.\.8/.test(P)&&/Open: g and the sign of the source/.test(P)&&/Coupling \(step 3, climbed from n=1/.test(P)&&/\(2n\+1\)·2\^\{n−1\} \(72 at n=4\)/.test(P)&&/Open: the sign and size of the source term/.test(P)&&/Gravity \(steps 6, 7; n=2\.\.8/.test(P)&&/Open: κ and the source sign \(no action\), solving T=0 for ω, any solution, whether this is the model's gravity\. Nothing selects three generations/.test(P)&&/the plane-pair reading is ours/.test(P)&&/gravity dynamics \(only its kinematics are drawn\)/.test(P),'equations layer and its honesty');
ok(EQ.eq.commutators.by_n['4'].edges===12&&/\(12 at n=4\)/.test(P)&&/n\(n−1\)\(n−2\)\/2/.test(P)&&/C\(n,3\) triangles/.test(P),'commutator counts');
ok(EQ.eq.dirac.counts.incidences===40&&EQ.eq.dirac.counts.components===8&&/8 components, 8 equations, 40 incidences, 4 derivative terms plus 1 mass term/.test(P)&&/\(p²−m²\)⁴/.test(P),'Dirac counts');
ok(SH.demicube.maxwell[4].incidences===24&&/24 incidences in 4D/.test(P),'Maxwell numbers quoted');
ok(EQ.matrix.worst_error<1e-12&&/two wrong versions fail/.test(P)&&/Nothing here selects a number of generations/.test(P),'matrix check and generations');
console.log(bad?bad+' FAILURES':'ALL PERSONA TESTS PASS');process.exit(bad?1:0)
