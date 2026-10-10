import React, { useState } from 'react';
import K from './matterData.js';
import { MT_PY, MTM_PY } from './matterSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { internalHalves, halfEdges, nodeName } from './matterCopy.js';
import { gensOf, gname } from './yangmillsCopy.js';

// Step 5 of the equations page: matter charged under so(m), m = 2 ... 8.
// Numbers come from selfcheck/matter_selfcheck.py (exact) and selfcheck/matter_matrix_check.py (numpy); test_matter.mjs recomputes the structure independently.
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const PAL = ['#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f87171', '#2dd4bf', '#fb923c', '#a3e635', '#f472b6', '#94a3b8'];
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;

// the two parity halves of the internal cube as graphs; a line = two blades that differ in exactly two bits = where a generator acts
function Halves({ m, sel, lang, t }) {
  const gens = gensOf(m), colour = x => PAL[gens.indexOf(x) % PAL.length], halves = internalHalves(m), W = 170, R = m === 5 ? 62 : 56;
  return <svg className="eq-svg" style={{ maxWidth: 520 }} viewBox="0 0 340 190" role="img" aria-label="The even and odd internal blades and the lines where the generators act" data-m={m}>
    {halves.map((nodes, h) => { const c = [85 + 170 * h, 95], pos = Object.fromEntries(nodes.map((x, k) => [x, [c[0] + R * Math.cos((-90 + 360 * k / nodes.length) * Math.PI / 180), c[1] + R * Math.sin((-90 + 360 * k / nodes.length) * Math.PI / 180)]]));
      return <g key={h}>{halfEdges(m, h).map(([a, b]) => { const g = a ^ b, on = sel == null || g === sel; return <line key={a + '-' + b} className={'mt-edge mt-g' + gens.indexOf(g)} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke={sel == null ? 'currentColor' : colour(g)} strokeWidth={sel == null ? .7 : 1.8} opacity={sel == null ? (m > 4 ? .25 : .45) : on ? .95 : .04}><title>{`[${nodeName(a)}, ${nodeName(b)}] generator ${gname(g)}`}</title></line>; })}
        {nodes.map(x => <g key={x} className="mt-node"><circle cx={pos[x][0]} cy={pos[x][1]} r="4" fill={h ? 'none' : '#8b93a7'} stroke="#8b93a7" strokeWidth="1.2" />{nodes.length <= 8 && <text x={pos[x][0] + (pos[x][0] >= c[0] ? 7 : -7)} y={pos[x][1] + 3} textAnchor={pos[x][0] >= c[0] ? 'start' : 'end'} fontSize="9" fill="currentColor">{nodeName(x)}</text>}</g>)}
        <text x={c[0]} y="186" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".8">{h ? t.oddH : t.evenH}</text></g>; })}</svg>;
}

export default function MatterSection({ lang = 'en' }) {
  const l = COPY[lang] ? lang : 'en', t = COPY[l], Lad = K.mt.ladder, [m, setM] = useState(3), [sel, setSelRaw] = useState(null), r = { ...Lad[m], m_value: m }, ID = K.mt.identities, views = t.views(r), gens = gensOf(m);
  const pick = k => { setM(k); setSelRaw(null); };
  const edgesPerHalf = 2 ** (m - 2) * (m * (m - 1) / 2);
  return <section className="eq" id="eq-matter" aria-labelledby="eq-mt-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="eq-mt-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <div><Tags kinds={['checked', 'standard']} lang={l} /> <span className="eq-cap">{t.numbers}</span></div>
    <h3>{t.tableH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="mt-table"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.entries(Lad).map(([k, x]) => <tr key={k} className={+k === m ? 'on' : ''} onClick={() => pick(+k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{x.internal_dim}</td><td>{x.components}</td><td>{x.terms_per_equation}</td><td>{x.gauge_terms_per_equation}</td><td>{x.internal_cell}</td><td>{x.minimal_module_real_dim} × {x.copies_of_each_module}{x.summands === 2 ? ' (×2)' : ''}</td><td>{t.names[k]}</td></tr>)}</tbody></table></div>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{Object.keys(Lad).map(k => <button key={k} className={'eq-chip mt-chip' + (+k === m ? ' on' : '')} aria-pressed={+k === m} onClick={() => pick(+k)}>{k}</button>)}</div>
      <h4>{t.picH}</h4>{m <= 5 ? <><Halves m={m} sel={sel} lang={l} t={t} /><p className="eq-cap mt-cap">{t.picCap(m, gens.length, edgesPerHalf)}</p>
        <div className="eq-chips mt-gens" role="group">{gens.map(g => <button key={g} className={'eq-chip mt-gen' + (sel === g ? ' on' : '')} aria-pressed={sel === g} onClick={() => setSelRaw(sel === g ? null : g)}>{gname(g)}</button>)}</div>
        <p className="eq-cap mt-selcap">{sel == null ? t.selNone : t.selCap(gname(sel), 2 ** (m - 2))}</p></> : <p className="eq-cap mt-cap">{t.picBig(m)}</p>}
      <h4>{t.viewsH(m)}</h4><div className="mt-views">{views.map(v => <div key={v.h} className="eq-xr mt-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></div>
    <h3>{t.stH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="mt-st"><thead><tr>{t.stCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.entries(K.mt.spacetime).map(([n, x]) => <tr key={n}><td>{n}</td><td>{x.components}</td><td>{x.terms_per_equation}</td><td>{x.gauge_terms_per_equation}</td><td>{Object.values(x.current_corner_masks).join(', ')}</td><td>{Object.values(x.current_corner_distance).join(', ')}</td></tr>)}</tbody></table><p className="eq-cap">{t.stNote}</p></div>
    <h3>{t.idH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="mt-id"><thead><tr>{t.idCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(ID).map(([k, v]) => { const [n, gm] = k.split(','); return <tr key={k}><td>{n}</td><td>{gm}</td><td>{v.commutator_identity ? '✓' : '✗'}</td><td>{v.gauge_covariance_of_E_first_order ? '✓' : '✗'}</td><td>{v.conserved_on_shell ? '✓' : '✗'}</td><td>{v.adjoint_covariance ? '✓' : '✗'}</td><td>{v.abelian_current_equals_step3_X ? '✓' : '✗'}</td></tr>; })}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div>
    <h3>{t.xrH}</h3>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}
    <h3>{t.matH}</h3><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p></div>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <h3>{t.dl.h}</h3><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('matter_selfcheck.py', MT_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('matter_matrix_check.py', MTM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('matter.json', JSON.stringify(K.mt, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></section>;
}
