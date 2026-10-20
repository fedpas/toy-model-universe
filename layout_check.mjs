import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch();const errs=[];const rep=[];
for(const page of ['shapes','equations']) for(const lang of ['en','it']) for(const w of [1280,820,375,320]){
 const pg=await b.newPage({viewport:{width:w,height:900}});
 pg.on('pageerror',e=>errs.push(`${lang}${w}: ${e.message}`));pg.on('console',m=>m.type()==='error'&&errs.push(`${lang}${w} console: ${m.text()}`));
 await pg.goto('file:///home/claude/ui/dist/app.html#'+page+'');await pg.waitForTimeout(400);
 if(lang==='it')await pg.getByRole('button',{name:'IT',exact:true}).click();
 await pg.waitForTimeout(300);
 const r=await pg.evaluate(()=>{
  const W=window.innerWidth, out={pageOverflow:document.documentElement.scrollWidth-W,clipped:[],svgSmall:[],tinyText:[],overlap:[]};
  const scrolls=e=>{let p=e;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll')return true;p=p.parentElement}return false};
  document.querySelectorAll('.sh *, .gs *, .eq *').forEach(e=>{
    const cs=getComputedStyle(e); if(cs.display==='none')return;
    const r=e.getBoundingClientRect(); if(!r.width)return;
    if(r.right>W+1&&!scrolls(e)) out.clipped.push(e.tagName+'.'+String(e.className).slice(0,20)+' '+Math.round(r.right));
    if(e.tagName==='svg'&&r.width<200) out.svgSmall.push(Math.round(r.width));
    if(e.children.length===0&&e.textContent.trim()&&parseFloat(cs.fontSize)<9.5&&e.tagName!=='text'&&e.tagName!=='title') out.tinyText.push(e.tagName+' '+cs.fontSize+' '+e.textContent.slice(0,20));
  });
  // sections stacked in order without overlap
  const secs=['#sh-orth','#sh-demi','#sh-gosset','#eq-comm','#eq-dirac','#eq-coupling','#eq-ym','#eq-matter','#eq-grav1','#eq-grav2','#eq-mirrors','#eq-projective','#eq-forque','#eq-spin','#eq-tally'].map(s=>document.querySelector(s)).filter(Boolean).map(e=>e.getBoundingClientRect());
  for(let i=1;i<secs.length;i++) if(secs[i].top<secs[i-1].bottom-1) out.overlap.push(i);
  // text elements wider than their card
  document.querySelectorAll('.sh-card,.gs-card,.sh-xr,.gs-xr,.eq-card,.eq-xr').forEach(c=>{ if(c.scrollWidth>c.clientWidth+1 && getComputedStyle(c).overflowX==='visible') out.clipped.push('card '+c.className+' sw'+c.scrollWidth+'>cw'+c.clientWidth)});
  return out;});
 rep.push(`${page} ${lang} ${w}: pageOverflow=${r.pageOverflow} clipped=${r.clipped.length} svgSmall=${r.svgSmall.length} tinyText=${r.tinyText.length} overlap=${r.overlap.length}`+(r.clipped.length?' '+JSON.stringify(r.clipped.slice(0,4)):'')+(r.tinyText.length?' '+JSON.stringify(r.tinyText.slice(0,3)):''));
 await pg.screenshot({path:`shots/lay_${page}_${lang}_${w}.png`,fullPage:true});
 await pg.close();}
await b.close();console.log(rep.join('\n'));console.log(errs.length?errs:'console errors: none');
