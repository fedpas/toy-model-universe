import * as M from './matrixData.js';
import {cliffordCell} from './genesis_audit_v3.js';
import {STORY,PAGES} from './storyCopy.js';
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const P=['Young Learner','Physicist','Mathematician'];
// every Genesis node exists in every language, profile and metric
for(const lang of ['en','it'])for(const p of P)for(const mm of ['Spatial','Temporal'])for(let s=0;s<9;s++){const r=M.getGenesisDisplayData(s,lang,p,mm);ok(r&&r.title&&r.desc,`genesis ${s} ${lang} ${p} ${mm}`);}
// the algebra facts quoted in the Genesis text, against the independent Clifford engine
const norm=t=>t.replace(/[²2]$/,'');
const cell=(p,q,kind,N)=>{const c=cliffordCell(p,q);ok(c.N===N&&norm(c.kind)===norm(kind),`Cl(${p},${q}) ${c.kind}${c.N}`)};
cell(1,1,'R',2);cell(2,2,'R',4);cell(4,1,'C',4);cell(3,3,'R',8);cell(4,3,'R2',8);cell(4,4,'R',16);cell(0,8,'R',16);
ok(cliffordCell(0,0).N===1,'Cl(0,0)=R');
// pseudoscalar facts quoted: n=5,q=1 -> I^2=-1 central; n=7,q=3 -> +1 central; n=8 -> +1
const I2=(n,q)=>((n*(n-1)/2+q)%2?-1:1);ok(I2(5,1)===-1&&I2(7,3)===1&&I2(8,4)===1,'pseudoscalar squares quoted');
// no unsupported physical claims survive in the final text (both languages)
const banned=[/Sterile Neutrino Isomorphism/i,/ultimate origin key/i,/reflects escaping/i,/automatic involutionary/i,/forcing an automatic/i,/tree-level/i,/Hubble boundary/i,/fractional topological weight/i,/weight of 1\/3/i,/complete gauge group infrastructure/i,/required for color confinement/i,/Weak Lock/i,/blueprint for antimatter/i,/Big Reset/i,/world just resets/i,/establishes the Higgs VEV/i,/85 discrete/i];
const ids=M.MENU_SECTOR_LIST.map(x=>x.id);
for(const lang of ['en','it'])for(const p of P)for(const mm of ['Spatial','Temporal']){
 for(const id of ids){const r=M.getCompleteDualMetricDisplayData(id,lang,p,mm);const t=[r.title,r.subtitle,r.desc].join(' ');for(const b of banned)ok(!b.test(t),`${id} ${lang} ${p} ${mm} matches ${b}`)}
 for(let s=0;s<9;s++){const r=M.getGenesisDisplayData(s,lang,p,mm);const t=[r.title,r.desc].join(' ');for(const b of banned)ok(!b.test(t),`genesis ${s} ${lang} ${p} ${mm} matches ${b}`)}}
// readings are always marked
for(const lang of ['en','it'])for(const s of [3,5,6,7,8]){const r=M.getGenesisDisplayData(s,lang,'Physicist','Spatial');ok(/Reading, not derived|Lettura, non derivata/.test(r.desc),`node ${s} reading marked`)}
// the story shell: both languages have every page, every tag kind and a bridge sentence
for(const lang of ['en','it']){const S=STORY[lang];for(const pg of PAGES){ok(S.nav[pg]&&S.pages[pg].h&&S.pages[pg].does&&S.pages[pg].tags.length,`${lang} ${pg}`);for(const [k] of S.pages[pg].tags)ok(S.tags[k]&&S.tagHelp[k],`tag ${k}`)}
 for(const p of P)ok(S.hero[p].length===2,`hero ${p}`);ok(S.metric.Spatial&&S.metric.Temporal,'metric')}
for(let i=0;i<PAGES.length-1;i++)ok(STORY.en.pages[PAGES[i]].after,`page ${PAGES[i]} hands on`);
// every node has an audit status shown as a tag
for(const id of ids){const r=M.getCompleteDualMetricDisplayData(id,'en','Physicist','Spatial');ok(['verified','realigned','speculative'].includes(r.auditStatus),`${id} audit status`)}
console.log(bad?bad+' FAILURES':'ALL STORY TESTS PASS');process.exit(bad?1:0)
