import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];let fails=0;
for(const [lang,w] of [['en',1100],['it',1100],['en',375],['it',375]]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push(lang+w+': '+e.message));pg.on('console',m=>m.type()==='error'&&errs.push(lang+w+' console: '+m.text()));
 await pg.goto('file:///home/claude/ui/dist/app.html#shapes');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 { const g=pg.locator('#sh-gosset .gs-chip'); const m=await g.count(); if(m<11) errs.push(lang+w+' gosset chips '+m);
   for(let i=0;i<m;i++){ if(i>=await g.count())break; await g.nth(i).click({timeout:3000}); }
   const sv=await pg.locator('#sh-gosset svg circle').count(); if(sv<60) errs.push(lang+w+' coxeter plane circles '+sv); }
 for(const sec of ['#sh-orth','#sh-demi']){
  const bt=pg.locator(sec+' button').filter({hasText:/^[0-9]$/});
  const n=await bt.count();
  for(let i=0;i<n;i++){if(i>=await bt.count())break;await bt.nth(i).click({timeout:3000});}
  if(n<6){errs.push(`${lang}${w} ${sec}: only ${n} chips`);}
 }
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 if(ov>2){fails++;errs.push(`${lang}${w}: horizontal overflow ${ov}px`);}
 if(w===375)await pg.locator('#sh-gosset').screenshot({path:`shots/gs_${lang}_mobile.png`});
 if(w===375)await pg.locator('#sh-demi').screenshot({path:`shots/sh_demi_${lang}_mobile.png`});
 await pg.close();}
// equations page: signature chips redraw the octahedron (12 edges each), blades isolate equations
for(const lang of ['en','it']) for(const w of [1100,375]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push('eq '+lang+w+': '+e.message));pg.on('console',m=>m.type()==='error'&&errs.push('eq '+lang+w+' console: '+m.text()));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 const ch=pg.locator('#eq-comm .eq-chip');
 for(let i=0;i<await ch.count();i++){await ch.nth(i).click();const ln=await pg.locator('#eq-comm svg line').count();if(ln!==12)errs.push(`eq ${lang}${w} chip ${i}: ${ln} octahedron edges`);}
 const rows=await pg.locator('#eq-comm .eq-card table').nth(1).locator('tbody tr').count(); if(rows<1)errs.push('eq role table empty');
 const dots=pg.locator('#eq-dirac svg g[style*="cursor"]'); if(await dots.count()!==8)errs.push('eq dirac: '+await dots.count()+' clickable equations');
 await dots.nth(3).click(); if(!(await pg.locator('#eq-dirac .eq-card p.eq-cap').first().textContent().then(x=>/5/.test(x))))errs.push('eq dirac: isolation caption');
 const nl=await pg.locator('#eq-dirac svg line').count(); if(nl!==40)errs.push('eq dirac lines '+nl);
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>2)errs.push(`eq ${lang}${w}: overflow ${ov}`);
 await pg.close();}
await b.close();console.log(errs.length?errs:'UI SMOKE OK');
