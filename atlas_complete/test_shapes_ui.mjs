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
await b.close();console.log(errs.length?errs:'UI SMOKE OK');
