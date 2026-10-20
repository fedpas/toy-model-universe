import React, { useState } from 'react';
import S from './shapesData.js';
import WITT from './shapesWitt.js';
import { SHAPES_PY } from './shapesSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { sup, pow2 } from './shapesCopy.js';
import GossetSection from './GossetSection.jsx';
import GCOPY from './gossetCopy.js';
import { stepEyebrow, navLabel } from './steps.js';
import { Intro } from './Fold.jsx';

// Shapes for the atlas, one step at a time: 1 the orthoplex, 2 the demicube, 3 the Gosset series.
// Every number on this page comes from selfcheck/shapes_selfcheck.py (standard library only) and is rebuilt by test_shapes.mjs.
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const AX = ['x', 'y', 'z', 'w'];


const GC = ['#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f472b6'];     // even grades 0,2,4,6,8
const gradeColour = g => GC[Math.min(4, g / 2)];
const STYLE = `.sh{max-width:900px;margin:28px auto;padding:0 16px}.sh h3{margin:1.2em 0 .4em}.sh-card{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:12px 14px;margin:10px 0}
.sh table{border-collapse:collapse;width:100%;min-width:560px;font-size:.85em}.sh th,.sh td{text-align:left;padding:3px 8px;border-bottom:1px solid rgba(128,128,128,.25)}.sh tr.on td{background:rgba(80,170,255,.14)}
.sh-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.sh-chip{background:none;border:1px solid rgba(128,128,128,.45);border-radius:999px;padding:3px 11px;color:inherit;cursor:pointer;font:inherit;font-size:.85em}.sh-chip.on{background:rgba(80,170,255,.22);border-color:#4aa8ff}
.sh-cap{font-size:.82em;opacity:.8}.sh-mono{font-family:ui-monospace,monospace}.sh-subnav{display:flex;gap:10px;flex-wrap:wrap;max-width:900px;margin:10px auto 0;padding:0 16px}.sh-subnav a{color:inherit;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:4px 12px;text-decoration:none;font-size:.9em}
.sh-btn{background:none;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 12px;color:inherit;cursor:pointer;font:inherit;margin:4px 8px 4px 0}.sh-pt{display:flex;gap:10px;margin:8px 0}.sh-pt p{margin:0}.sh-svg{width:100%;max-width:520px;display:block;margin:6px auto}
.sh-xr{border-left:3px solid rgba(128,128,128,.5);padding:2px 0 2px 12px;margin:14px 0}.sh-xr h4{margin:.2em 0}`;
function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const Chips = ({ items, value, onPick, fmt = x => x }) => <div className="sh-chips" role="group">{items.map(i => <button key={i} className={'sh-chip' + (i === value ? ' on' : '')} aria-pressed={i === value} onClick={() => onPick(i)}>{fmt(i)}</button>)}</div>;

// ---------------------------------------------------------------- pictures
function Petrie({ n }) {
  const R = 120, c = 150, pts = [];
  for (let i = 0; i < n; i++) for (const s of [1, -1]) { const a = 2 * Math.PI * (i + (s === 1 ? 0 : n)) / (2 * n) + Math.PI / 2; pts.push({ i, s, x: c + R * Math.cos(a), y: c - R * Math.sin(a), a }); }
  const lines = [];
  if (n >= 2) for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) if (pts[a].i !== pts[b].i) lines.push(<line key={a + '-' + b} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} stroke="#8b93a7" strokeWidth={n > 6 ? .35 : .8} opacity={n > 6 ? .6 : .8} />);
  const lab = n <= 5;
  return <svg className="sh-svg" viewBox="0 0 300 300" role="img" aria-label={`Petrie polygon of the ${n}-orthoplex`}>
    {n === 0 && <circle cx={c} cy={c} r="5" fill="#60a5fa" />}
    {n === 1 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#8b93a7" />}
    {lines}{pts.map(p => <g key={p.i + '' + p.s}><circle cx={p.x} cy={p.y} r={n > 6 ? 3 : 4.5} fill="#60a5fa"><title>{(p.s === 1 ? '+' : '−') + 'e' + (p.i + 1)}</title></circle>
      {lab && <text x={c + (R + 16) * Math.cos(p.a)} y={c - (R + 16) * Math.sin(p.a) + 4} textAnchor="middle" fontSize="11" fill="currentColor">{(p.s === 1 ? '+' : '−') + 'e' + (p.i + 1)}</text>}</g>)}
  </svg>;
}
const bladeName = m => m === 0 ? '1' : Array.from({ length: 12 }, (_, i) => (m >> i & 1) ? 'e' + (i + 1) : '').join('');
function Zonogon({ n }) {
  const v = Array.from({ length: n }, (_, i) => [Math.cos(Math.PI * i / n), Math.sin(Math.PI * i / n)]), P = [];
  for (let m = 0; m < 1 << n; m++) { let x = 0, y = 0; for (let i = 0; i < n; i++) if (m >> i & 1) { x += v[i][0]; y += v[i][1]; } P.push([x, y]); }
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 || 1;
  const T = p => [150 + (p[0] - cx) / half * 135, 150 - (p[1] - cy) / half * 135], Q = P.map(T), edges = [];
  for (let m = 0; m < 1 << n; m++) if (pc(m) % 2 === 0) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const y = m ^ (1 << i) ^ (1 << j); if (y > m) edges.push(<line key={m + '-' + y} x1={Q[m][0]} y1={Q[m][1]} x2={Q[y][0]} y2={Q[y][1]} stroke="#8b93a7" strokeWidth={n > 6 ? .3 : .7} opacity={n > 6 ? .45 : .6} />); }
  const r = n > 6 ? 2.2 : n > 4 ? 3 : 4.5;
  return <svg className="sh-svg" viewBox="0 0 300 300" role="img" aria-label={`The ${n}-cube split into the even and odd corners`}>{edges}
    {Q.map((q, m) => pc(m) % 2 === 1 ? <circle key={m} cx={q[0]} cy={q[1]} r={r} fill="none" stroke="#8b93a7" strokeWidth=".9"><title>{`odd blade ${bladeName(m)} (label ${m})`}</title></circle> : null)}
    {Q.map((q, m) => pc(m) % 2 === 0 ? <circle key={m} cx={q[0]} cy={q[1]} r={r} fill={gradeColour(pc(m))}><title>{`even blade ${bladeName(m)} (label ${m}, grade ${pc(m)})`}</title></circle> : null)}</svg>;
}
function Corner({ n, g }) {
  const v = (1 << g) - 1, nb = Array.from({ length: n }, (_, i) => v ^ (1 << i)), R = 105, c = 150;
  const P = nb.map((m, i) => { const a = 2 * Math.PI * i / n - Math.PI / 2; return { m, x: c + R * Math.cos(a), y: c + R * Math.sin(a), a }; });
  return <svg className="sh-svg" viewBox="0 0 300 300" role="img" aria-label={`The corner simplex of the odd blade ${bladeName(v)}`}>
    {P.flatMap((p, a) => P.slice(a + 1).map((q, b) => <line key={a + '-' + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#8b93a7" strokeWidth=".8" opacity=".7" />))}
    {P.map(p => <g key={p.m}><circle cx={p.x} cy={p.y} r="6" fill={pc(p.m) === 2 ? '#34d399' : 'none'} stroke={pc(p.m) === 2 ? '#34d399' : '#8b93a7'} strokeWidth="1.5"><title>{`blade ${bladeName(p.m)} (grade ${pc(p.m)})`}</title></circle>
      <text x={c + (R + 26) * Math.cos(p.a)} y={c + (R + 26) * Math.sin(p.a) + 4} textAnchor="middle" fontSize="10" fill="currentColor">{bladeName(p.m)}</text></g>)}
    <text x={c} y={c + 4} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".8">{bladeName(v)}</text></svg>;
}
function Bipartite({ n, k, lang, t }) {
  const [hot, setHot] = useState(null), ax = i => i < k ? (k === 1 ? 't' : 't' + (i + 1)) : AX[i - k];
  const nm = m => Array.from({ length: n }, (_, i) => (m >> i & 1) ? ax(i) : '').join('');
  const biv = [], o1 = [], o3 = [];
  for (let m = 0; m < 1 << n; m++) { const c = pc(m); if (c === 2) biv.push(m); else if (c === 1) o1.push(m); else if (c === 3) o3.push(m); }
  const role = m => { const tc = pc(m & ((1 << k) - 1)); return tc === 1 ? 'E' : tc === 0 ? 'B' : 'T'; };
  biv.sort((a, b) => 'EBT'.indexOf(role(a)) - 'EBT'.indexOf(role(b)) || a - b);
  const right = [...o1, ...o3], rows = Math.max(biv.length, right.length), rh = Math.min(15, 430 / rows), H = rh * rows + 24, X0 = 95, X1 = 365;
  const yl = new Map(biv.map((m, i) => [m, 14 + rh * (i + .5) * rows / biv.length])), yr = new Map(right.map((m, i) => [m, 14 + rh * (i + .5) * rows / right.length]));
  const col = { E: '#fbbf24', B: '#60a5fa', T: '#c084fc' }, inc = [];
  for (const s of biv) for (let i = 0; i < n; i++) inc.push({ s, i, tg: s ^ (1 << i), op: (s >> i & 1) ? 'c' : 'w' });
  const used = hot == null ? null : inc.filter(e => e.tg === hot);
  return <div style={{ overflowX: 'auto' }}><svg className="sh-svg" style={{ maxWidth: 560, minWidth: 460 }} viewBox={`0 0 460 ${H}`} role="img" aria-label="Incidences of the Maxwell equations between bivectors and odd blades">
    {inc.map((e, j) => { const on = hot == null || e.tg === hot; return <line key={j} x1={X0} y1={yl.get(e.s)} x2={X1} y2={yr.get(e.tg)} stroke={e.op === 'c' ? '#34d399' : '#f87171'} strokeWidth={on && hot != null ? 1.6 : .7} opacity={hot == null ? .35 : on ? .95 : .06}><title>{`∂${ax(e.i)} on ${nm(e.s)} → ${nm(e.tg)}`}</title></line>; })}
    {biv.map(m => <g key={m}><circle cx={X0} cy={yl.get(m)} r={Math.min(4, rh / 2.4)} fill={col[role(m)]} /><text x={X0 - 8} y={yl.get(m) + 3} textAnchor="end" fontSize={Math.min(10, rh)} fill="currentColor">{role(m)}{nm(m)}</text></g>)}
    {right.map(m => <g key={m} style={{ cursor: 'pointer' }} onClick={() => setHot(hot === m ? null : m)}><circle cx={X1} cy={yr.get(m)} r={Math.min(4.5, rh / 2.2)} fill={pc(m) === 1 ? '#8b93a7' : 'none'} stroke="#8b93a7" strokeWidth="1.2" /><text x={X1 + 8} y={yr.get(m) + 3} fontSize={Math.min(10, rh)} fill="currentColor" fontWeight={hot === m ? 700 : 400}>{nm(m)}</text></g>)}
  </svg>{hot != null && <p className="sh-cap">{nm(hot)}: {t.terms(used.length)}</p>}</div>;
}

// ---------------------------------------------------------------- sections
function Orthoplex({ lang, profile }) {
  const t = COPY[lang].o, [n, setN] = useState(4), R = S.orthoplex.ladder;
  return <section className="sh" id="sh-orth" aria-labelledby="sh-o-h"><p className="eyebrow">{stepEyebrow(lang, 'shapes', 'orth')}</p><h2 id="sh-o-h">{t.title}</h2><Intro lang={lang} profile={profile} id="orth" lede={t.lede} />
    <h3>{t.tableH}</h3><div className="sh-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.keys(R).map(k => { const r = R[k]; return <tr key={k} className={+k === n ? 'on' : ''}><td>{k}</td><td>{t.shapes[+k]}</td><td>{+k < 1 ? '—' : r.vertices}</td><td>{+k < 2 ? '—' : r.edges}</td><td>{r.facets}</td><td>{r.faces_total_with_empty}</td><td>{r.genesis_node}</td><td className="sh-mono">{r.algebra}</td></tr>; })}</tbody></table><p className="sh-cap"><Tags kinds={['standard']} lang={lang} /> {t.note}</p></div>
    <h3>{t.picH}</h3><div className="sh-card"><p className="sh-cap">{t.pick}</p><Chips items={[0, 1, 2, 3, 4, 5, 6, 7, 8]} value={n} onPick={setN} /><Petrie n={n} /><p className="sh-cap">{t.pic(n)}</p></div>
    <div>{t.points.map(([ks, txt], i) => <div key={i} className="sh-pt"><div style={{ minWidth: 92 }}><Tags kinds={ks} lang={lang} /></div><p>{txt}</p></div>)}</div></section>;
}
function Demicube({ lang, profile }) {
  const t = COPY[lang].d, [n, setN] = useState(5), [g, setG] = useState(1), [kk, setK] = useState(1), rows = S.demicube.rows, r = rows[n], gOdd = [1, 3, 5, 7].filter(x => x <= n);
  const gSel = gOdd.includes(g) ? g : 1, nm = Math.min(n, 7), kmin = Math.max(1, nm - 4), kmax = Math.min(4, nm - 1), kSel = Math.min(kmax, Math.max(kmin, kk));
  const sigs = Array.from({ length: n + 1 }, (_, p) => [p, n - p]).filter(([p, q]) => true).map(([p, q]) => [p, q, S.demicube.even_subalgebra[p + ',' + q]]);
  return <section className="sh" id="sh-demi" aria-labelledby="sh-d-h"><p className="eyebrow">{stepEyebrow(lang, 'shapes', 'demi')}</p><h2 id="sh-d-h">{t.title}</h2><Intro lang={lang} profile={profile} id="demi" lede={t.lede} />
    <div><Tags kinds={['checked']} lang={lang} /> <span className="sh-cap">{t.facets}</span></div>
    <h3>{t.tableH}</h3><div className="sh-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.keys(rows).map(k => <tr key={k} className={+k === n ? 'on' : ''}><td>{k}</td><td>{rows[k].name}</td><td>{rows[k].vertices}</td><td>{rows[k].edges}</td><td>{rows[k].facets}</td><td className="sh-mono">{rows[k].f_vector.join(', ')}</td></tr>)}</tbody></table>
      <p className="sh-cap">{t.pick}</p><Chips items={[3, 4, 5, 6, 7, 8]} value={n} onPick={setN} /></div>
    <h3>{t.xref}</h3>
    <div className="sh-xr"><h4>{t.cube.h} <Tags kinds={['checked']} lang={lang} /></h4><p>{t.cube.t(n)}</p><Zonogon n={n} /><p className="sh-cap">{t.legend} {Object.entries(r.even_blades_by_grade).map(([gr, c]) => <span key={gr} style={{ marginRight: 10 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: gradeColour(+gr), marginRight: 4 }} />grade {gr}: {c}</span>)}</p></div>
    <div className="sh-xr"><h4>{t.cliff.h} <Tags kinds={['standard', 'checked']} lang={lang} /></h4><p>{t.cliff.t(n)}</p>
      <div style={{ overflowX: 'auto' }}><table><thead><tr>{t.cliff.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{sigs.map(([p, q, a]) => <tr key={p}><td>{p} + {q}</td><td className="sh-mono">{a.full}</td><td className="sh-mono">{a.even} <span className="sh-cap">= {a.even_is}</span></td></tr>)}</tbody></table></div><p className="sh-cap">{t.cliff.note}</p></div>
    <div className="sh-xr"><h4>{t.simp.h} <Tags kinds={['checked']} lang={lang} /></h4><p>{t.simp.t(n)}</p><p className="sh-cap">{t.simp.pick}</p><Chips items={gOdd} value={gSel} onPick={setG} /><Corner n={n} g={gSel} /></div>
    <div className="sh-xr"><h4>{t.lab.h} <Tags kinds={['ours']} lang={lang} /></h4><p>{t.lab.t(n)}{t.lab.note}</p></div>
    <div className="sh-xr"><h4>{t.mx.h} <Tags kinds={['checked', 'standard']} lang={lang} /></h4><p>{t.mx.t(nm)}</p>{n === 8 && <p className="sh-cap">{t.mx.cap7}</p>}
      <p className="sh-cap">{t.mx.pick}</p><Chips items={Array.from({ length: kmax - kmin + 1 }, (_, i) => kmin + i)} value={kSel} onPick={setK} />
      <Bipartite key={nm + '-' + kSel} n={nm} k={kSel} lang={lang} t={t.mx} /><p className="sh-cap">{t.mx.note} <span style={{ color: '#fbbf24' }}>E</span> <span style={{ color: '#60a5fa' }}>B</span> <span style={{ color: '#c084fc' }}>T</span></p></div>
    <div className="sh-xr"><h4>{t.orth.h} <Tags kinds={['checked', 'standard']} lang={lang} /></h4><p>{t.orth.t}</p></div>
    <div className="sh-xr"><h4>{t.fur.h} <Tags kinds={['checked', 'ours', 'open']} lang={lang} /></h4><p>{t.fur.t}</p><p className="sh-cap sh-mono">{[['H', WITT['H_is_a_square(4 axes)']], ['C+e7R+R', WITT['C+e7R+R_is_a_square(4 axes)']], ['O1+O2', WITT['O1+O2_is_a_cube(3-dim affine, 8 axes)']], ["H+C+e7R+R", WITT['H+C+e7R+R_is_a_cube(8 axes)']]].map(([a, ok]) => `${a}: ${ok ? '✓' : '✗'}`).join('   ')}   · orthoplex/ladder_check.py</p></div>
    <p className="sh-cap"><Tags kinds={['open']} lang={lang} /> {t.limits}</p>
    <h3>{t.dlH}</h3><p>{t.dlText}</p><div><button className="sh-btn" onClick={() => download('shapes_selfcheck.py', SHAPES_PY, 'text/x-python')}>{t.dlPy}</button><button className="sh-btn" onClick={() => download('shapes.json', JSON.stringify(S, null, 1), 'application/json')}>{t.dlJson}</button></div><p className="sh-mono sh-cap">{t.dlCmd}</p></section>;
}
export default function ShapesSection({ lang = 'en', profile = 'Young Learner' }) {
  const l = COPY[lang] ? lang : 'en';
  return <><style>{STYLE}</style><nav className="sh-subnav" aria-label="Shapes"><a href="#sh-orth" onClick={e => { e.preventDefault(); document.getElementById('sh-orth')?.scrollIntoView?.({ behavior: 'smooth' }); }}>{navLabel(l, 'shapes', 'orth')}</a><a href="#sh-demi" onClick={e => { e.preventDefault(); document.getElementById('sh-demi')?.scrollIntoView?.({ behavior: 'smooth' }); }}>{navLabel(l, 'shapes', 'demi')}</a><a href="#sh-gosset" onClick={e => { e.preventDefault(); document.getElementById('sh-gosset')?.scrollIntoView?.({ behavior: 'smooth' }); }}>{navLabel(l, 'shapes', 'gosset')}</a></nav>
    <Orthoplex lang={l} profile={profile} /><Demicube lang={l} profile={profile} /><GossetSection lang={l} profile={profile} /></>;
}
