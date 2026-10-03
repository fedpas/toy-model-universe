import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];
const C=m=>m*(m-1)/2;
for(const lang of ['en','it']) for(const w of [1100,375]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push(`${lang}${w}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${w} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 const nav=await pg.locator('.eq-nav a').count(); if(nav!==8)errs.push(`${lang}${w}: nav ${nav}`);
 const rows=await pg.locator('#eq-matter .mt-table tbody tr').count(); if(rows!==7)errs.push(`${lang}${w}: ladder rows ${rows}`);
 const st=await pg.locator('#eq-matter .mt-st tbody tr').count(); if(st!==4)errs.push(`${lang}${w}: spacetime rows ${st}`);
 const idr=await pg.locator('#eq-matter .mt-id tbody tr').count(); if(idr!==6)errs.push(`${lang}${w}: identity rows ${idr}`);
 const chips=pg.locator('#eq-matter .mt-chip'); if(await chips.count()!==7)errs.push('chips '+await chips.count());
 for(let m=2;m<=8;m++){
  await chips.nth(m-2).click();
  const v=await pg.locator('#eq-matter .mt-view').count(); if(v!==6)errs.push(`${lang}${w} m=${m}: ${v} views`);
  const on=await pg.locator('#eq-matter .mt-table tbody tr.on td').first().textContent(); if(+on!==m)errs.push(`${lang}${w} m=${m}: row ${on}`);
  const txt=await pg.locator('#eq-matter').textContent(); if(/undefined|NaN|\[object/.test(txt))errs.push(`${lang}${w} m=${m}: placeholder`);
  const edges=await pg.locator('#eq-matter svg .mt-edge').count(), nodes=await pg.locator('#eq-matter svg .mt-node').count();
  if(m<=5){ const want=2*(2**(m-2))*C(m); if(edges!==want||nodes!==2**m)errs.push(`${lang}${w} m=${m}: ${edges} edges ${nodes} nodes, want ${want}/${2**m}`);
    const gb=await pg.locator('#eq-matter .mt-gen').count(); if(gb!==C(m))errs.push(`${lang}${w} m=${m}: ${gb} generator buttons`);
    await pg.locator('#eq-matter .mt-gen').first().click();
    const hi=await pg.evaluate(()=>[...document.querySelectorAll('#eq-matter svg .mt-edge')].filter(e=>+e.getAttribute('opacity')>0.5).length); if(hi!==2*2**(m-2))errs.push(`${lang}${w} m=${m}: ${hi} highlighted lines, want ${2*2**(m-2)}`);
    await pg.locator('#eq-matter .mt-gen').first().click();
  } else { if(edges!==0)errs.push(`${lang}${w} m=${m}: picture should be replaced by a note`); }
 }
 await chips.nth(1).click();
 const tick=await pg.locator('#eq-matter .mt-id td').filter({hasText:'✓'}).count(); if(tick!==30)errs.push('identity ticks '+tick);
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>2)errs.push(`${lang}${w}: overflow ${ov}`);
 if(w===1100&&lang==='en'){ await chips.nth(2).click(); await pg.locator('#eq-matter .mt-gen').nth(1).click(); await pg.locator('#eq-matter').screenshot({path:'shots/mt_en_wide.png'}); }
 await pg.close();}
await b.close();console.log(errs.length?errs:'MATTER UI OK');
