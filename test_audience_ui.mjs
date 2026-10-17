import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];
const SECS=['#eq-comm','#eq-dirac','#eq-coupling','#eq-ym','#eq-matter','#eq-grav1','#eq-grav2','#eq-mirrors','#eq-projective','#eq-forque'];
// expected open folds per audience, counted over all ten steps (full introduction folds are closed except for Math, where the lede is shown plain)
const stats={};const ID={Learner:'Young Learner',Physics:'Physicist',Math:'Mathematician'};
for(const lang of ['en','it']) for(const [btn,lv] of [['Learner',0],['Physics',1],['Math',2]]){
 const pg=await b.newPage({viewport:{width:1100,height:900}});
 pg.on('pageerror',e=>errs.push(`${lang}${btn}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${btn} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.locator(`[data-profile="${ID[btn]}"]`).click();await pg.waitForTimeout(200);
 for(const s of SECS){
  const short=await pg.locator(`${s} .eq-short`).count();
  if(lv<2&&short!==1)errs.push(`${lang}${btn} ${s}: short reading ${short}`);
  if(lv===2&&short!==0)errs.push(`${lang}${btn} ${s}: math should read the full introduction`);
  const intro=await pg.locator(`${s} p.lede`).first().textContent(); if(!intro||intro.length<40)errs.push(`${lang}${btn} ${s}: no introduction`);
  const open=await pg.locator(`${s} details.eq-fold[open]`).count(), all=await pg.locator(`${s} details.eq-fold`).count();
  (stats[`${lang}${btn}`]??={})[s]=`${open}/${all}`;
  // the open items stay visible for everyone
  const pts=await pg.locator(`${s} .tag.open`).count(); const vis=await pg.locator(`${s} .tag.open`).last().isVisible(); if(pts<1||!vis)errs.push(`${lang}${btn} ${s}: open items must be visible`);
  // the picture and its controls are never folded
  const folded=await pg.evaluate(sel=>[...document.querySelectorAll(sel+' svg')].filter(e=>e.closest('details.eq-fold')&&!e.closest('details.eq-fold[open]')).length,s); if(folded)errs.push(`${lang}${btn} ${s}: ${folded} pictures hidden in a closed fold`);
 }
 // a reader can open what is closed
 if(lv===0){ const f=pg.locator('#eq-grav1 details.eq-fold').first(); const before=await f.evaluate(e=>e.open); await f.locator('summary').click(); const after=await f.evaluate(e=>e.open); if(before===after)errs.push('fold does not toggle'); }
 const hh=await pg.evaluate(()=>document.querySelector('#eq-tally')?.getBoundingClientRect().top+window.scrollY); stats[`${lang}${btn}`].pageHeight=await pg.evaluate(()=>document.documentElement.scrollHeight);
 await pg.close();}
await b.close();
// the page gets shorter for the shorter reading levels
for(const lang of ['en','it']){ const [a,p,m]=['Learner','Physics','Math'].map(x=>stats[lang+x].pageHeight); if(!(a<p&&p<m))errs.push(`${lang}: page heights should grow Learner < Physics < Math: ${a} ${p} ${m}`); }
console.log(JSON.stringify(Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,v.pageHeight]))));
console.log(errs.length?errs:'AUDIENCE UI OK');
