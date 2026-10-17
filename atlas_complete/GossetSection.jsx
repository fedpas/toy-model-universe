import React, { useState } from 'react';
import G from './gossetData.js';
import { GOSSET_PY } from './gossetSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { fmt, inertia, roots } from './gossetCopy.js';

// Step 3 of the shapes page: the Gosset series E6, E7, E8 (and E9, E10), rebuilt from Cartan matrices.
// Every number comes from selfcheck/gosset_selfcheck.py (standard library only) and is rebuilt by test_gosset.mjs.
const STYLE = `.gs{max-width:900px;margin:28px auto;padding:0 16px}.gs h3{margin:1.2em 0 .4em}.gs-card{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:12px 14px;margin:10px 0}
.gs table{border-collapse:collapse;width:100%;min-width:560px;font-size:.85em}.gs th,.gs td{text-align:left;padding:3px 8px;border-bottom:1px solid rgba(128,128,128,.25)}.gs tr.on td{background:rgba(80,170,255,.14)}
.gs-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.gs-chip{background:none;border:1px solid rgba(128,128,128,.45);border-radius:999px;padding:3px 11px;color:inherit;cursor:pointer;font:inherit;font-size:.85em}.gs-chip.on{background:rgba(80,170,255,.22);border-color:#4aa8ff}
.gs-cap{font-size:.82em;opacity:.8}.gs-mono{font-family:ui-monospace,monospace}.gs-btn{background:none;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 12px;color:inherit;cursor:pointer;font:inherit;margin:4px 8px 4px 0}
.gs-pt{display:flex;gap:10px;margin:8px 0}.gs-pt p{margin:0}.gs-svg{width:100%;max-width:520px;display:block;margin:6px auto}.gs-xr{border-left:3px solid rgba(128,128,128,.5);padding:2px 0 2px 12px;margin:14px 0}`;
function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const Chips = ({ items, value, onPick, fmt: f = x => x }) => <div className="gs-chips" role="group">{items.map(i => <button key={i} className={'gs-chip' + (i === value ? ' on' : '')} aria-pressed={i === value} onClick={() => onPick(i)}>{f(i)}</button>)}</div>;
const COL = { e: '#60a5fa', d: '#fbbf24' };

function Plane({ n }) {
  const c = G.coxeter[n], pts = c.points, m = Math.max(...pts.map(p => Math.hypot(p[0], p[1]))), s = 135 / m, r = n === 8 ? 3 : 3.6;
  const rings = [...new Set(pts.map(p => p[2]))].map(i => { const q = pts.find(p => p[2] === i); return Math.hypot(q[0], q[1]) * s; });
  return <svg className="gs-svg" viewBox="0 0 300 300" role="img" aria-label={`The ${G.rank[n].roots} roots of E${n} in the Coxeter plane`}>
    {[...new Set(rings.map(x => Math.round(x * 10) / 10))].map((x, i) => <circle key={i} cx="150" cy="150" r={x} fill="none" stroke="#8b93a7" strokeWidth=".4" opacity=".5" />)}
    {pts.map((p, i) => <circle key={i} cx={150 + p[0] * s} cy={150 - p[1] * s} r={r} fill={COL[p[3]]} opacity=".92"><title>{(p[3] === 'e' ? 'orthoplex edge' : 'demicube corner') + ', ring ' + (p[2] + 1)}</title></circle>)}</svg>;
}

export default function GossetSection({ lang = 'en' }) {
  const l = COPY[lang] ? lang : 'en', t = COPY[l], [n, setN] = useState(8), [cx, setCx] = useState(8);
  const ranks = [3, 4, 5, 6, 7, 8, 9, 10], P = G.polytopes, X = G.coordinates;
  const yn = b => b ? t.yes : t.no;
  return <><style>{STYLE}</style><section className="gs" id="sh-gosset" aria-labelledby="gs-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="gs-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <h3>{t.tableH}</h3><div className="gs-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {ranks.map(k => { const r = G.rank[k]; return <tr key={k} className={k === n ? 'on' : ''}><td>{k}</td><td>{t.names[k]}</td><td className="gs-mono">{r.arms ? r.arms.join('·') : '—'}</td><td className="gs-mono">{r.arm_sum || '—'}</td><td>{r.det}</td><td className="gs-mono">{inertia(k)}</td><td>{roots(k, t.infinite)}</td><td>{t.poly[k] ? `${t.poly[k]}: ${P[k].vertices}` : '—'}</td></tr>; })}</tbody></table>
      <p className="gs-cap"><Tags kinds={['checked']} lang={l} /> {t.tableNote}</p>
      <p className="gs-cap">{t.pick}</p><Chips items={ranks} value={n} onPick={setN} /><p>{t.detail(n)}</p></div>
    <div className="gs-xr"><h4>{t.armsH} <Tags kinds={['standard', 'checked']} lang={l} /></h4><p>{t.arms}</p></div>
    <div className="gs-xr"><h4>{t.nestH} <Tags kinds={['checked']} lang={l} /></h4><p>{t.nest}</p>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th></th>{[5, 6, 7, 8].map(k => <th key={k}>{t.poly[k].split(' ')[0]}</th>)}</tr></thead><tbody>
        {[['vertices', k => P[k].vertices], ['edges', k => fmt(P[k].edges)], ['degree', k => P[k].degree], ['fig', k => t.figs[k]], ['weyl', k => k === 5 ? '1 920' : fmt(G.weyl_orders[k])]].map(([key, f], i) => <tr key={key}><td>{t.nestRow[i]}</td>{[5, 6, 7, 8].map(k => <td key={k}>{f(k)}</td>)}</tr>)}</tbody></table></div></div>
    <div className="gs-xr"><h4>{t.inH} <Tags kinds={['checked', 'ours']} lang={l} /></h4><p className="gs-cap">{t.inPick}</p><Chips items={[6, 7, 8]} value={cx} onPick={setCx} fmt={k => 'E' + k} />
      <Plane key={cx} n={cx} /><p className="gs-cap">{t.inCap(cx)}</p><p>{t.split[cx]}</p></div>
    <div className="gs-xr"><h4>{t.glueH} <Tags kinds={['checked', 'standard']} lang={l} /></h4><p>{t.glue}</p>
      <div style={{ overflowX: 'auto' }}><table><thead><tr>{t.glueCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
        {G.dn_plus.map(r => <tr key={r.n} className={r.n === 8 ? 'on' : ''}><td>{r.n}</td><td>{r.glue_norm}</td><td>{yn(r.integral)}</td><td>{yn(r.even)}</td><td>{r.minimal_vectors}</td></tr>)}</tbody></table></div>
      <ul className="gs-cap">{t.glueNote.map((x, i) => <li key={i}>{x}</li>)}</ul><p className="gs-cap">{t.glueTail}</p></div>
    <div className="gs-xr"><h4>{t.brH} <Tags kinds={['checked', 'standard', 'open']} lang={l} /></h4><p>{t.br}</p></div>
    <h3>{t.gbH}</h3><div>{t.gb.map(([ks, txt], i) => <div key={i} className="gs-pt"><div style={{ minWidth: 92 }}><Tags kinds={ks} lang={l} /></div><p>{txt}</p></div>)}</div>
    <div className="gs-xr"><h4>{t.bdH} <Tags kinds={['checked', 'ours', 'open']} lang={l} /></h4><p>{t.bd}</p></div>
    <p className="gs-cap"><Tags kinds={['open']} lang={l} /> {t.limits}</p>
    <h3>{t.dlH}</h3><p>{t.dlText}</p><div><button className="gs-btn" onClick={() => download('gosset_selfcheck.py', GOSSET_PY, 'text/x-python')}>{t.dlPy}</button><button className="gs-btn" onClick={() => download('gosset.json', JSON.stringify(G, null, 1), 'application/json')}>{t.dlJson}</button></div><p className="gs-mono gs-cap">{t.dlCmd}</p></section></>;
}
