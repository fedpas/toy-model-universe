import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];
const want={1:0,2:0,3:3,4:4,5:5,6:6,7:7,8:8};
for(const lang of ['en','it']) for(const w of [1100,375]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push(`${lang}${w}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${w} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 const nav=await pg.locator('.eq-nav a').count(); if(nav!==8)errs.push(`${lang}${w}: nav ${nav}`);
 const rows=await pg.locator('#eq-coupling .cp-table tbody tr').count(); if(rows!==8)errs.push(`${lang}${w}: ladder rows ${rows}`);
 const chips=pg.locator('#eq-coupling .cp-chip'); if(await chips.count()!==8)errs.push('chips '+await chips.count());
 for(let n=1;n<=8;n++){
  await chips.nth(n-1).click();
  const inn=await pg.locator('#eq-coupling svg .cp-in').count(), out=await pg.locator('#eq-coupling svg .cp-out').count();
  if(inn!==want[n]||out!==want[n])errs.push(`${lang}${w} n=${n}: ring lines ${inn}/${out}, want ${want[n]}`);
  const v=await pg.locator('#eq-coupling .cp-view').count(); if(v!==7)errs.push(`${lang}${w} n=${n}: ${v} views`);
  const on=await pg.locator('#eq-coupling .cp-table tbody tr.on td').first().textContent(); if(+on!==n)errs.push(`${lang}${w} n=${n}: highlighted row ${on}`);
  const cap=await pg.locator('#eq-coupling .cp-ringcap').count(); if(cap!==1)errs.push(`${lang}${w} n=${n}: ring caption ${cap}`);
  const txt=await pg.locator('#eq-coupling').textContent(); if(/undefined|NaN|\[object/.test(txt))errs.push(`${lang}${w} n=${n}: placeholder text`);
  const labs=await pg.locator('#eq-coupling svg .cp-lab').count(); if(n>=3&&labs!==2*n)errs.push(`${lang}${w} n=${n}: ${labs} labels`);
 }
 // clicking a table row selects it
 await pg.locator('#eq-coupling .cp-table tbody tr').nth(2).click(); if(+(await pg.locator('#eq-coupling .cp-table tbody tr.on td').first().textContent())!==3)errs.push('row click');
 await pg.locator('#eq-coupling .cp-chip').nth(3).click();
 // identities table all ticks
 const tick=await pg.locator('#eq-coupling table').nth(1).locator('td').filter({hasText:'✓'}).count(); if(tick!==12)errs.push('identity ticks '+tick);
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>2)errs.push(`${lang}${w}: overflow ${ov}`);
 // nav link scrolls
 await pg.locator('.eq-nav a').nth(2).click(); await pg.waitForTimeout(400);
 if(w===375&&lang==='en'){ await pg.locator('#eq-coupling').screenshot({path:'shots/cp_en_mobile.png'}); }
 if(w===1100&&lang==='en'){ await chips.nth(4).click(); await pg.locator('#eq-coupling').screenshot({path:'shots/cp_en_wide.png'}); }
 await pg.close();}
await b.close();console.log(errs.length?errs:'COUPLING UI OK');
