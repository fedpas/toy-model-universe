import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];
const C=(n,k)=>{if(k<0||k>n)return 0;let r=1;for(let i=0;i<k;i++)r=r*(n-i)/(i+1);return Math.round(r);};
const CL={4:[6,12,3],5:[10,30,15],2:[1,0,0],3:[3,3,0],6:[15,60,45],7:[21,105,105],8:[28,168,210]};
for(const lang of ['en','it']) for(const w of [1100,375]){
 const pg=await b.newPage({viewport:{width:w,height:800}});
 pg.on('pageerror',e=>errs.push(`${lang}${w}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${w} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#equations');await pg.waitForTimeout(300);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(200);
 const nav=await pg.locator('.eq-nav a').count(); if(nav!==14)errs.push(`${lang}${w}: nav ${nav}`);
 // ---------- gravity I
 const r1=await pg.locator('#eq-grav1 .gv-table tbody tr').count(); if(r1!==7)errs.push(`${lang}${w}: g1 ladder rows ${r1}`);
 const i1=await pg.locator('#eq-grav1 .gv-id tbody tr').count(); if(i1!==4)errs.push(`${lang}${w}: g1 identity rows ${i1}`);
 const t1=await pg.locator('#eq-grav1 .gv-id td').filter({hasText:'✓'}).count(); if(t1!==16)errs.push(`${lang}${w}: g1 ticks ${t1}`);
 const ch=pg.locator('#eq-grav1 .gv-chip'); if(await ch.count()!==7)errs.push('g1 chips '+await ch.count());
 for(let n=2;n<=8;n++){
  await ch.nth(n-2).click();
  const v=await pg.locator('#eq-grav1 .gv-view').count(); if(v!==7)errs.push(`${lang}${w} g1 n=${n}: ${v} views`);
  const on=await pg.locator('#eq-grav1 .gv-table tbody tr.on td').first().textContent(); if(+on!==n)errs.push(`${lang}${w} g1 n=${n}: row ${on}`);
  const txt=await pg.locator('#eq-grav1').textContent(); if(/undefined|NaN|\[object/.test(txt))errs.push(`${lang}${w} g1 n=${n}: placeholder`);
  const P=C(n,2), cells=await pg.locator('#eq-grav1 .gv-cell').count(); if(cells!==P*(P+1)/2)errs.push(`${lang}${w} g1 n=${n}: ${cells} cells`);
  const [dg,one,dis]=CL[n];
  for(const [c,want] of [['diagonal',dg],['one',one],['disjoint',dis]]){ const got=await pg.locator(`#eq-grav1 .gv-cell[data-class="${c}"]`).count(); if(got!==want)errs.push(`${lang}${w} g1 n=${n}: class ${c} ${got} want ${want}`); }
  const btns=pg.locator('#eq-grav1 .gv-cls'); if(await btns.count()!==4)errs.push('class buttons');
  await btns.nth(2).click(); const hi=await pg.locator('#eq-grav1 .gv-cell[data-on="1"]').count(); if(hi!==one)errs.push(`${lang}${w} g1 n=${n}: one-class highlight ${hi} want ${one}`);
  await btns.nth(3).click(); const hd=await pg.locator('#eq-grav1 .gv-cell[data-on="1"]').count(); if(hd!==dis)errs.push(`${lang}${w} g1 n=${n}: disjoint highlight ${hd} want ${dis}`);
  await btns.nth(0).click(); const ha=await pg.locator('#eq-grav1 .gv-cell[data-on="1"]').count(); if(ha!==P*(P+1)/2)errs.push(`${lang}${w} g1 n=${n}: all highlight ${ha}`);
  const sel=pg.locator('#eq-grav1 .gv-sub');
  if(n>=4){ const no=await sel.locator('option').count(); if(no!==1+C(n,4))errs.push(`${lang}${w} g1 n=${n}: ${no} subset options want ${1+C(n,4)}`);
    await sel.selectOption({index:1}); const h3=await pg.locator('#eq-grav1 .gv-cell[data-on="1"]').count(); if(h3!==3)errs.push(`${lang}${w} g1 n=${n}: subset highlights ${h3}`);
    const cls3=await pg.locator('#eq-grav1 .gv-cell[data-on="1"][data-class="disjoint"]').count(); if(cls3!==3)errs.push(`${lang}${w} g1 n=${n}: subset cells not disjoint-class`);
    await sel.selectOption({index:no-1}); const h3b=await pg.locator('#eq-grav1 .gv-cell[data-on="1"]').count(); if(h3b!==3)errs.push(`${lang}${w} g1 n=${n}: last subset ${h3b}`);
    await sel.selectOption({index:0});
  } else if(await sel.count()!==0)errs.push(`g1 n=${n}: subset selector should be absent`);
 }
 // ---------- gravity II
 const r2=await pg.locator('#eq-grav2 .gv-table2 tbody tr').count(); if(r2!==7)errs.push(`${lang}${w}: g2 ladder rows ${r2}`);
 const i2=await pg.locator('#eq-grav2 .gv-id2 tbody tr').count(); if(i2!==5)errs.push(`${lang}${w}: g2 identity rows ${i2}`);
 const t2=await pg.locator('#eq-grav2 .gv-id2 td').filter({hasText:'✓'}).count(); if(t2!==8)errs.push(`${lang}${w}: g2 ticks ${t2}`);
 const d2=await pg.locator('#eq-grav2 .gv-ds tbody tr').count(); if(d2!==4)errs.push(`${lang}${w}: g2 de Sitter rows ${d2}`);
 const ch2=pg.locator('#eq-grav2 .gv-chip2'); if(await ch2.count()!==7)errs.push('g2 chips '+await ch2.count());
 for(let n=2;n<=8;n++){
  await ch2.nth(n-2).click();
  const v=await pg.locator('#eq-grav2 .gv-view2').count(); if(v!==7)errs.push(`${lang}${w} g2 n=${n}: ${v} views`);
  const on=await pg.locator('#eq-grav2 .gv-table2 tbody tr.on td').first().textContent(); if(+on!==n)errs.push(`${lang}${w} g2 n=${n}: row ${on}`);
  const txt=await pg.locator('#eq-grav2').textContent(); if(/undefined|NaN|\[object/.test(txt))errs.push(`${lang}${w} g2 n=${n}: placeholder`);
  const ed=await pg.locator('#eq-grav2 svg .gv-edge').count(), want=C(n-1,2); if(ed!==want)errs.push(`${lang}${w} g2 n=${n}: ${ed} edges want ${want}`);
  const na=await pg.locator('#eq-grav2 .gv-achip').count(); if(na!==n)errs.push(`${lang}${w} g2 n=${n}: ${na} index buttons`);
  const nn=await pg.locator('#eq-grav2 svg .gv-node').count(); if(nn!==n)errs.push(`${lang}${w} g2 n=${n}: ${nn} nodes`);
  if(want>0){ await pg.locator('#eq-grav2 .gv-edge-hit').first().dispatchEvent('click');
    const rest=await pg.locator('#eq-grav2 svg .gv-rest').count(); if(rest!==n-3)errs.push(`${lang}${w} g2 n=${n}: ${rest} tetrad axes want ${n-3}`);
    const pr=await pg.locator('#eq-grav2 svg .gv-pair').count(); if(pr!==2)errs.push(`${lang}${w} g2 n=${n}: ${pr} pair nodes`);
    const on1=await pg.locator('#eq-grav2 svg .gv-edge.on').count(); if(on1!==1)errs.push(`${lang}${w} g2 n=${n}: selected edge ${on1}`);
    await pg.locator('#eq-grav2 .gv-achip').nth(n-1).click(); const ed2=await pg.locator('#eq-grav2 svg .gv-edge').count(); if(ed2!==want)errs.push(`${lang}${w} g2 n=${n}: edges after index change ${ed2}`);
    const rest2=await pg.locator('#eq-grav2 svg .gv-rest').count(); if(rest2>n-3)errs.push('selection should not leak across index change');
  }
 }
 await ch.nth(2).click(); await ch2.nth(2).click();
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>2)errs.push(`${lang}${w}: overflow ${ov}`);
 if(w===1100&&lang==='en'){ await ch.nth(3).click(); await pg.locator('#eq-grav1 .gv-sub').selectOption({index:3}); await pg.locator('#eq-grav1').screenshot({path:'shots/gv1_en_wide.png'}); await ch2.nth(2).click(); await pg.locator('#eq-grav2 .gv-edge-hit').first().dispatchEvent('click'); await pg.locator('#eq-grav2').screenshot({path:'shots/gv2_en_wide.png'}); }
 await pg.close();}
await b.close();console.log(errs.length?errs:'GRAVITY UI OK');
