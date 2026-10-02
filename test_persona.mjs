import fs from 'fs';
import { buildSystemPrompt, PROFILES, LANGUAGES, METRICS } from './lib/chatPersona.js';
import { cliffordCell } from './genesis_audit_v3.js';

const J = JSON.parse(fs.readFileSync('./furey_results.json', 'utf8'));
let bad = 0;
const ok = (condition, message) => { if (!condition) { bad++; console.log('FAIL', message); } };

const temporal = buildSystemPrompt({ spokenLang: 'it', userProfile: 'Physicist', metricMode: 'Temporal', isMatchMode: true });
const spatial = buildSystemPrompt({ spokenLang: 'en', userProfile: 'Young Learner', metricMode: 'Spatial' });

ok(PROFILES.has('Physicist') && LANGUAGES.has('it') && METRICS.has('Temporal'), 'context sets');
ok(temporal.includes('"Temporal"') && temporal.includes('"it"') && temporal.includes('"Physicist"') && temporal.includes('PEER-REVIEW MODE (on)'), 'context interpolation');
ok(spatial.includes('"Spatial"') && spatial.includes('Peer-review mode is off.'), 'default mode');
ok(!/\$\{/.test(temporal), 'no unresolved template variables');
ok(temporal.length < 9000, `prompt size: ${temporal.length}`);

ok(temporal.includes(`(${J.real_blocks.join(',')})`) && temporal.includes(`(${J.complex_blocks.join(',')})`), 'Peirce block ranks');
ok(temporal.includes(`diagonal ${J.real_diag}`) && temporal.includes(`off-diagonal ${J.real_off}`) && temporal.includes(`diagonal ${J.complex_diag}`) && temporal.includes(`off-diagonal ${J.complex_off}ℂ`), 'Peirce counts');
ok(temporal.includes('one Standard Model generation (16ℂ') && temporal.includes('8ℂ of replica-type content') && J.sm_generation_dim === 16 && J.extras_dim === 8, 'generation and replica counts');
ok(temporal.includes(`${J.witt.diagonalising_all_block_projectors} of ${J.witt.independent_commuting_grade4_quadruples}`), 'Witt count');
ok(temporal.includes('type from s=(p−q) mod 8') && temporal.includes('period 8'), 'derivation method');
ok(temporal.includes('nothing saturates') && temporal.includes('not time reversal'), 'period and temporal caveats');
ok(temporal.includes('derived') && temporal.includes('input') && temporal.includes('open'), 'status discipline');

for (const [p, q] of [[1, 0], [0, 1], [0, 2], [2, 1], [3, 1], [2, 2], [4, 4], [0, 8], [3, 3], [4, 3], [5, 3]]) {
  ok(typeof cliffordCell(p, q).algebra === 'string' && cliffordCell(p, q).algebra.length > 0, `engine cell ${p},${q}`);
}

for (const stale of [/saturat(ed|ion) (fusion|threshold)/i, /time-lock/i, /Hopf Fibration Axiom/, /Mass Scaling Defect/, /4\/17/, /two generations/i, /numerolog/i, /\[Row, Column\] truncation/]) {
  ok(!stale.test(temporal), `stale prompt content: ${stale}`);
}
for (const file of ['api/chat.js', 'api/chat-openai.js']) {
  const source = fs.readFileSync(file, 'utf8');
  ok(source.includes('../lib/chatPersona.js') && source.includes('buildSystemPrompt('), `${file} uses shared persona`);
  ok(/export const config = \{ runtime: 'edge' \}/.test(source), `${file} edge runtime`);
}

console.log(bad ? `${bad} FAILURES` : 'ALL PERSONA TESTS PASS');
process.exit(bad ? 1 : 0);
