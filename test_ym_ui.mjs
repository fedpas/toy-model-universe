import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];
const C=m=>m*(m-1)/2, E=m=>m*(m-1)*(m-2)/2;
for(const lang of ['en','it']) for(const w of [1100,375]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push(`${lang}${w}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${w} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 const nav=await pg.locator('.eq-nav a').count(); if(nav!==14)errs.push(`${lang}${w}: nav ${nav}`);
 const rows=await pg.locator('#eq-ym .ym-table tbody tr').count(); if(rows!==7)errs.push(`${lang}${w}: ladder rows ${rows}`);
 const st=await pg.locator('#eq-ym .ym-st tbody tr').count(); if(st!==5)errs.push(`${lang}${w}: spacetime rows ${st}`);
 const idr=await pg.locator('#eq-ym .ym-id tbody tr').count(); if(idr!==7)errs.push(`${lang}${w}: identity rows ${idr}`);
 const chips=pg.locator('#eq-ym .ym-chip'); if(await chips.count()!==7)errs.push('chips '+await chips.count());
 for(let m=2;m<=8;m++){
  await chips.nth(m-2).click();
  const nodes=await pg.locator('#eq-ym svg .ym-node').count(), edges=await pg.locator('#eq-ym svg .ym-edge').count();
  if(nodes!==C(m)||edges!==E(m))errs.push(`${lang}${w} m=${m}: ${nodes} nodes ${edges} edges, want ${C(m)}/${E(m)}`);
  const v=await pg.locator('#eq-ym .ym-view').count(); if(v!==(m===4?7:6))errs.push(`${lang}${w} m=${m}: ${v} views`);
  const on=await pg.locator('#eq-ym .ym-table tbody tr.on td').first().textContent(); if(+on!==m)errs.push(`${lang}${w} m=${m}: row ${on}`);
  const txt=await pg.locator('#eq-ym').textContent(); if(/undefined|NaN|\[object/.test(txt))errs.push(`${lang}${w} m=${m}: placeholder`);
  if(m>=3){ await pg.locator('#eq-ym svg .ym-node circle:not(.ym-hit)').first().click();
    const cap=await pg.locator('#eq-ym .ym-selcap').textContent(); if(!/±2/.test(cap))errs.push(`${lang}${w} m=${m}: selection caption "${cap}"`);
    const deg=(cap.match(/±2/g)||[]).length; if(deg!==2*(m-2))errs.push(`${lang}${w} m=${m}: ${deg} neighbours, want ${2*(m-2)}`);
    await pg.locator('#eq-ym svg .ym-node circle:not(.ym-hit)').first().click(); }
 }
 await chips.nth(2).click();
 const tick=await pg.locator('#eq-ym .ym-id td').filter({hasText:'✓'}).count(); if(tick!==21)errs.push('identity ticks '+tick);
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>2)errs.push(`${lang}${w}: overflow ${ov}`);
 await pg.locator('.eq-nav a').nth(3).click(); await pg.waitForTimeout(400);
 if(w===1100&&lang==='en'){ await chips.nth(2).click(); await pg.locator('#eq-ym svg .ym-node circle:not(.ym-hit)').first().click(); await pg.locator('#eq-ym').screenshot({path:'shots/ym_en_wide.png'}); }
 if(w===375&&lang==='en'){ await pg.locator('#eq-ym').screenshot({path:'shots/ym_en_mobile.png'}); }
 await pg.close();}
await b.close();console.log(errs.length?errs:'YM UI OK');
