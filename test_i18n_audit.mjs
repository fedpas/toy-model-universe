import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
// Audit of language and audience: every page, EN/IT, three audiences.
//  1. step numbering is derived: "PAGE k OF 8", "STEP k OF 13" (equations), "STEP k OF 3" (shapes), in order, in both languages
//  2. the introduction of each page and section differs between the three audiences (the mathematician reads the full text)
//  3. Italian pages contain no English prose (code, equations, commands and a short allow-list excepted)
//  4. the control bar and the chat labels are localised
//  5. a report of text blocks that are the same in EN and IT, and sections whose lede does not vary by audience
const PAGES=['rule','atlas','maxwell','furey','shapes','equations','map','ask'], PROF=['Young Learner','Physicist','Mathematician'];
const SEL='p, li, td, th, h1, h2, h3, h4, h5, summary, button, label, small, .tag, figcaption';
const SKIP='pre, code, svg, .eq-mono, .fq-eq, .fq-code, textarea, input, .chat-answer, .katex, script, style, .lens-grid b, .brand';
const EN_W=['the','and','of','is','with','for','that','this','are','from','each','which','not','can','you','your','one','all','when','where','what','how'];
const IT_W=['il','lo','la','le','gli','di','del','della','dei','delle','e','che','per','con','un','una','uno','è','sono','non','come','da','nel','nella','si','più','ogni','dove','quando','cosa','tu','tuo','alla','dal','al'];
// phrases that are allowed to stay in English inside an Italian page (names of files, models, products, code identifiers)
const ALLOW=[/^(Claude Opus|OpenAI o3)$/, /selfcheck|\.py|\.json|python3|numpy|run_all/, /^(EN|IT)$/, /^Download /, /ganja/, /Dorst|De Keninck|Furey|Hestenes|Gosset|Cartan|Coxeter/];
// 0. static: no copy file writes a step number by hand (they are all derived in steps.js)
const errs0=[]; for(const f of fs.readdirSync('.').filter(f=>/(Copy|Section)\.(js|jsx)$/.test(f))){ const t=fs.readFileSync(f,'utf8'); if(/eyebrow: '(STEP|PASSO) \d/i.test(t))errs0.push(f+': a hand-written step eyebrow'); if(/\bnav: ?\[?'(Step|Passo) \d/.test(t))errs0.push(f+': a hand-written step in a nav label'); }
const b=await chromium.launch();const errs=[...errs0], report={sameInBoth:{}, lede:{}, english:{}};
const stats={};
async function visit(lang,prof,page,w=1100){
  const pg=await b.newPage({viewport:{width:w,height:900}});
  pg.on('pageerror',e=>errs.push(`${lang}/${prof}/${page}: ${e.message}`));
  await pg.goto('file:///home/claude/ui/dist/app.html#'+page);await pg.waitForTimeout(250);
  if(lang==='it')await pg.locator('[data-lang="it"]').click();
  await pg.locator(`[data-profile="${prof}"]`).click();await pg.waitForTimeout(150);
  const data=await pg.evaluate(([SEL,SKIP])=>{
    const blocks=[...document.querySelectorAll(SEL)].filter(e=>!e.closest(SKIP)&&!e.querySelector(SEL.replace(/ ,/g,','))).map(e=>(e.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
    const eyebrows=[...document.querySelectorAll('.eyebrow')].map(e=>e.textContent.trim());
    const ledes=[...document.querySelectorAll('section')].map(s=>({id:s.id||s.className,t:(s.querySelector('.lede')?.textContent||'').trim()})).filter(x=>x.t);
    const controls=document.querySelector('.controls')?.textContent||'';
    return {blocks,eyebrows,ledes,controls,pageIntro:document.querySelector('.page-intro .lede')?.textContent||''};
  },[SEL,SKIP]);
  await pg.close();return data;
}
const words=t=>t.toLowerCase().match(/[a-zà-ú’']+/g)||[];
const isEnglishProse=t=>{ if(ALLOW.some(r=>r.test(t))) return false; const w=words(t); if(w.length<6) return false; const en=new Set(w.filter(x=>EN_W.includes(x))), it=new Set(w.filter(x=>IT_W.includes(x))); return en.size>=2&&it.size<=1; };
const seen={};
for(const lang of ['en','it']) for(const page of PAGES) for(const prof of PROF){
  const d=await visit(lang,prof,page); seen[`${lang}/${page}/${prof}`]=d;
}
// ---- 1. numbering
for(const lang of ['en','it']) for(const page of PAGES) for(const prof of PROF){
  const d=seen[`${lang}/${page}/${prof}`], P=lang==='en'?'PAGE':'PAGINA', S=lang==='en'?'STEP':'PASSO', O=lang==='en'?'OF':'DI';
  const tag=`${lang}/${page}/${prof}`;
  if(!d.eyebrows.includes(`${P} ${PAGES.indexOf(page)+1} ${O} ${PAGES.length}`))errs.push(`${tag}: page eyebrow missing: ${d.eyebrows.slice(0,3)}`);
  const steps=d.eyebrows.filter(e=>new RegExp(`^${S} \\d+`).test(e));
  const want={shapes:3,equations:13}[page]||0;
  if(steps.length!==want)errs.push(`${tag}: ${steps.length} step eyebrows, expected ${want}`);
  steps.forEach((e,i)=>{ if(!e.startsWith(`${S} ${i+1} ${O} ${want} · `))errs.push(`${tag}: step eyebrow ${i+1} reads "${e}"`); });
  if(d.eyebrows.some(e=>new RegExp(`^${S} \\d+ ·`).test(e)))errs.push(`${tag}: an eyebrow with a step number but no total`);
  // 4. controls
  const want4=lang==='en'?['LANGUAGE','AUDIENCE','METRIC','LENS','Presentation matrix']:['LINGUA','PUBBLICO','METRICA','LENTE','Matrice di presentazione'];
  for(const x of want4) if(!d.controls.includes(x))errs.push(`${tag}: control label "${x}" missing in "${d.controls.slice(0,80)}"`);
  if(lang==='it'&&/LANGUAGE|AUDIENCE|Presentation/.test(d.controls))errs.push(`${tag}: English control label in Italian`);
}
// ---- 2. the introductions differ by audience
for(const lang of ['en','it']) for(const page of PAGES){
  const [a,p,m]=PROF.map(x=>seen[`${lang}/${page}/${x}`]);
  const pi=[a.pageIntro,p.pageIntro,m.pageIntro]; if(new Set(pi).size!==3)errs.push(`${lang}/${page}: the page introduction does not vary by audience`);
  const ids=new Set([...a.ledes,...p.ledes,...m.ledes].map(x=>x.id));
  for(const id of ids){ const get=d=>d.ledes.find(x=>x.id===id)?.t||''; const t=[get(a),get(p),get(m)]; if(t.some(x=>!x))continue; if(new Set(t).size!==3){ (report.lede[`${lang}/${page}`]??=[]).push(id); if(!/^(atlas-hero|explorer-intro|chat)/.test(id)) errs.push(`${lang}/${page}/${id}: lede does not vary by audience`); } }
}
// ---- 3. no English prose in Italian
for(const page of PAGES) for(const prof of PROF){
  for(const t of seen[`it/${page}/${prof}`].blocks){ if(isEnglishProse(t)) { const k=t.slice(0,140); (report.english[`${page}`]??=new Set()).add(k); } }
}
for(const [pg,set] of Object.entries(report.english)) for(const t of set) errs.push(`it/${pg}: English prose: ${t}`);
// ---- 5. report: text blocks identical in EN and IT (notation excepted)
const md=['# Language and audience audit','',`Pages: ${PAGES.join(', ')}; audiences: ${PROF.join(', ')}.`,''];
for(const page of PAGES){
  const en=new Set(PROF.flatMap(p=>seen[`en/${page}/${p}`].blocks)), it=new Set(PROF.flatMap(p=>seen[`it/${page}/${p}`].blocks));
  const same=[...en].filter(t=>it.has(t)&&words(t).length>=3&&/[a-zA-Z]{4,}/.test(t));
  report.sameInBoth[page]=same; md.push(`## ${page}: ${en.size} EN blocks, ${it.size} IT blocks; ${same.length} identical in both languages`,''); same.slice(0,60).forEach(t=>md.push('- '+t.slice(0,160))); md.push('');
}
md.push('## Introductions that do not vary by audience','',...Object.entries(report.lede).map(([k,v])=>`- ${k}: ${v.join(', ')}`),'');
fs.writeFileSync('./i18n_audit_report.md',md.join('\n'));
const nSame=Object.values(report.sameInBoth).reduce((s,x)=>s+x.length,0);
console.log(`blocks identical in EN and IT (notation, names): ${nSame}; written to i18n_audit_report.md`);
await b.close();console.log(errs.length?errs.slice(0,80):'I18N AUDIT OK');if(errs.length>80)console.log('... '+errs.length+' in all');process.exit(errs.length?1:0);
