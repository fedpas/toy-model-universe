import React, { useState } from 'react';
import K from './yangmillsData.js';
import { YM_PY, YMM_PY } from './yangmillsSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { gname, gensOf, graphEdges } from './yangmillsCopy.js';

// Step 4 of the equations page: Yang–Mills with the bivector algebra of m generators as gauge algebra, m = 2 ... 8.
// Numbers come from selfcheck/yangmills_selfcheck.py (exact) and selfcheck/yangmills_matrix_check.py (numpy); test_yangmills.mjs recomputes the structure independently.
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;

// generators on a circle; two generators are joined when they share exactly one index (they do not commute)
function Graph({ m, sel, setSel }) {
  const g = gensOf(m), edges = graphEdges(m), c = 170, R = 125, ang = k => (-90 + 360 * k / g.length) * Math.PI / 180, pos = Object.fromEntries(g.map((x, k) => [x, [c + R * Math.cos(ang(k)), c + R * Math.sin(ang(k))]]));
  const nb = sel == null ? new Set() : new Set(edges.filter(([a, b]) => a === sel || b === sel).flatMap(([a, b]) => [a, b]));
  const fs = g.length > 15 ? 8 : 10;
  return <svg className="eq-svg" style={{ maxWidth: 400 }} viewBox="0 0 340 340" role="img" aria-label={`Generators of so(${m}) and the pairs that do not commute`} data-m={m}>
    {edges.map(([a, b]) => { const on = sel == null || a === sel || b === sel; return <line key={a + '-' + b} className="ym-edge" x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke={sel != null && on ? '#60a5fa' : 'currentColor'} strokeWidth={sel != null && on ? 1.6 : .8} opacity={sel == null ? (g.length > 15 ? .22 : .5) : on ? .95 : .05}><title>{`[${gname(a)}, ${gname(b)}] = ±2 ${gname(a ^ b)}`}</title></line>; })}
    {g.map((x, k) => <g key={x} className="ym-node" style={{ cursor: 'pointer' }} onClick={() => setSel(sel === x ? null : x)}><circle className="ym-hit" cx={pos[x][0]} cy={pos[x][1]} r="12" fill="transparent" /><circle cx={pos[x][0]} cy={pos[x][1]} r={sel === x ? 7 : 5} fill={sel === x ? '#fbbf24' : nb.has(x) ? '#60a5fa' : '#8b93a7'} />
      <text x={c + (R + 15) * Math.cos(ang(k))} y={c + (R + 15) * Math.sin(ang(k)) + 3} textAnchor="middle" fontSize={fs} fill="currentColor" fontWeight={sel === x ? 700 : 400}>{gname(x)}</text></g>)}</svg>;
}

export default function YangMillsSection({ lang = 'en' }) {
  const l = COPY[lang] ? lang : 'en', t = COPY[l], Lad = K.ym.ladder, [m, setM] = useState(4), [sel, setSelRaw] = useState(null), r = { ...Lad[m], m_value: m }, ID = K.ym.identities, views = t.views(r);
  const setSel = x => setSelRaw(x), pick = k => { setM(k); setSelRaw(null); };
  const list = sel == null ? [] : graphEdges(m).filter(([a, b]) => a === sel || b === sel).map(([a, b]) => { const o = a === sel ? b : a; return [gname(o), gname(a ^ b)]; });
  return <section className="eq" id="eq-ym" aria-labelledby="eq-y-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="eq-y-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <div><Tags kinds={['checked', 'standard']} lang={l} /> <span className="eq-cap">{t.numbers}</span></div>
    <h3>{t.tableH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="ym-table"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.entries(Lad).map(([k, x]) => <tr key={k} className={+k === m ? 'on' : ''} onClick={() => pick(+k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{x.gens}</td><td>{x.noncommuting_pairs}</td><td>{x.commuting_pairs}</td><td>{x.triangles}</td><td>{x.neighbours_of_each_generator}</td><td>{x.F_components}</td><td>{x.quadratic_terms_per_F_component}</td><td>{t.eqt(+k)}</td><td>{t.std[k]}</td></tr>)}</tbody></table></div>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{Object.keys(Lad).map(k => <button key={k} className={'eq-chip ym-chip' + (+k === m ? ' on' : '')} aria-pressed={+k === m} onClick={() => pick(+k)}>{k}</button>)}</div>
      <h4>{t.graphH}</h4><Graph m={m} sel={sel} setSel={setSel} /><p className="eq-cap ym-graphcap">{t.graphCap(m)}</p>
      <p className="eq-cap ym-selcap">{sel == null ? t.selNone : t.selCap(gname(sel), list)}</p>
      <h4>{t.viewsH(m)}</h4><div className="ym-views">{views.map(v => <div key={v.h} className="eq-xr ym-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></div>
    <h3>{t.stH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="ym-st"><thead><tr>{t.stCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.entries(K.ym.spacetime).map(([n, x]) => <tr key={n}><td>{n}</td><td>{x.F_components}</td><td>{x.equations}</td><td>{x.equation_terms / x.equations}</td><td>{x.bianchi_equations}</td><td>{x.bianchi_equations ? x.bianchi_terms / x.bianchi_equations : '—'}</td></tr>)}</tbody></table><p className="eq-cap">{t.stNote}</p></div>
    <h3>{t.idH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="ym-id"><thead><tr>{t.idCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(ID).map(([k, v]) => { const [gm, ns] = k.split(','); return <tr key={k}><td>{gm}</td><td>{ns}</td><td>{v.bianchi ? '✓' : '✗'}</td><td>{v.gauge_covariance_first_order ? '✓' : '✗'}</td><td>{v.covariant_conservation ? '✓' : '✗'}</td></tr>; })}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div>
    <h3>{t.xrH}</h3>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}
    <h3>{t.matH}</h3><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p></div>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <h3>{t.dl.h}</h3><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('yangmills_selfcheck.py', YM_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('yangmills_matrix_check.py', YMM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('yangmills.json', JSON.stringify(K.ym, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></section>;
}
