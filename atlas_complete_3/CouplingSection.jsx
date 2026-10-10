import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './couplingData.js';
import { CP_PY, CPM_PY } from './couplingSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { axname, ringNodes } from './couplingCopy.js';

// Step 3 of the equations page: Maxwell meets Dirac, one dimension at a time (n = 1 ... 8), every view at each n.
// Numbers come from selfcheck/coupling_selfcheck.py (exact) and selfcheck/coupling_matrix_check.py (numpy); test_coupling.mjs recomputes the structure independently.
const PAL = ['#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f87171', '#2dd4bf', '#fb923c', '#a3e635'];
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;

function Ring({ n }) {
  const nodes = ringNodes(n), c = 170, R1 = 62, R2 = 118, ang = k => (-90 + 360 * k / n) * Math.PI / 180, fs = n > 6 ? 8 : 10;
  const P = (k, r) => [c + r * Math.cos(ang(k)), c + r * Math.sin(ang(k))], L = (k, r) => [c + (r + (n > 6 ? 17 : 14)) * Math.cos(ang(k)), c + (r + (n > 6 ? 17 : 14)) * Math.sin(ang(k)) + 3];
  return <svg className="eq-svg" style={{ maxWidth: 380 }} viewBox="0 0 340 340" role="img" aria-label={`The equation at the blade t for n = ${n}: inner ring coupling terms, outer ring derivative terms`} data-n={n}>
    {nodes.map(({ k }) => <g key={k}><line className="cp-in" x1={c} y1={c} x2={P(k, R1)[0]} y2={P(k, R1)[1]} stroke={PAL[k]} strokeWidth="1.6" /><line className="cp-out" x1={P(k, R1)[0]} y1={P(k, R1)[1]} x2={P(k, R2)[0]} y2={P(k, R2)[1]} stroke={PAL[k]} strokeWidth="1" strokeDasharray="3 2" opacity=".8" /></g>)}
    {nodes.map(({ k, inner, outer }) => <g key={'n' + k}>
      <circle cx={P(k, R1)[0]} cy={P(k, R1)[1]} r={k === 0 ? 6.5 : 5} fill={PAL[k]} stroke={k === 0 ? 'currentColor' : 'none'} strokeWidth="1.5"><title>{`${axname(inner)} · A${axname(1 << k)}ψ${k === 0 ? ' · and the mass term' : ''}`}</title></circle>
      <circle cx={P(k, R2)[0]} cy={P(k, R2)[1]} r="4" fill="none" stroke={PAL[k]} strokeWidth="1.4"><title>{`${axname(outer)} · ∂${axname(1 << k)}ψ`}</title></circle>
      <text x={L(k, R2)[0]} y={L(k, R2)[1]} textAnchor="middle" fontSize={fs} fill="currentColor" className="cp-lab">{axname(outer)}</text>
      <text x={P(k, R1)[0] + (P(k, R1)[0] > c + 2 ? 8 : P(k, R1)[0] < c - 2 ? -8 : 0)} y={P(k, R1)[1] + (Math.abs(P(k, R1)[0] - c) <= 2 ? (P(k, R1)[1] < c ? -9 : 15) : 3)} textAnchor={P(k, R1)[0] > c + 2 ? 'start' : P(k, R1)[0] < c - 2 ? 'end' : 'middle'} fontSize={fs - 1} fill="currentColor" opacity=".8" className="cp-lab">{axname(inner)}</text></g>)}
    <circle cx={c} cy={c} r="9" fill="#8b93a7" /><text x={c} y={c + 3.5} textAnchor="middle" fontSize="10" fill="#111">t</text></svg>;
}

export default function CouplingSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l], Lad = K.coupling.ladder, [n, setN] = useState(4), r = Lad[n], ID = K.coupling.identities, views = t.views(r);
  return <section className="eq" id="eq-coupling" aria-labelledby="eq-k-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="eq-k-h">{t.title}</h2><Intro lang={l} profile={profile} id="coupling" lede={t.lede} />
    <div><Tags kinds={['checked']} lang={l} /></div>
    <Fold title={t.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="cp-table"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.values(Lad).map(x => { const j = x.J_exists; return <tr key={x.n} className={x.n === n ? 'on' : ''} onClick={() => setN(x.n)} style={{ cursor: 'pointer' }}><td>{x.n}</td><td>{x.algebra}</td><td>{x.psi_components}</td><td>{j ? x.dirac_real_dim : '—'}</td><td>{j ? x.psi_over_dirac : '—'}</td><td>{j ? `${axname(6)} (${x.J_count})` : t.noJ}</td><td>{x.current_grades.join(' + ')}</td><td>{t.terms(x.n)}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{Object.keys(Lad).map(k => <button key={k} className={'eq-chip cp-chip' + (+k === n ? ' on' : '')} aria-pressed={+k === n} onClick={() => setN(+k)}>{k}</button>)}</div>
      <h4>{t.ringH}</h4>{r.J_exists ? <><Ring n={n} /><p className="eq-cap cp-ringcap">{t.ringCap(n)}</p></> : <p className="eq-cap cp-ringcap">{t.ringNone(n)}</p>}
      <Fold nested title={t.viewsH(n)} open={lv >= 1}><div className="cp-views">{views.map(v => <div key={v.h} className="eq-xr cp-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></Fold></div>
    <Fold title={t.idH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.idCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(ID).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v.conservation_identity ? '✓' : '✗'}</td><td>{v.gauge_first_order ? '✓' : '✗'}</td><td>{v.maxwell_forces_div_J_zero ? '✓' : '✗'}</td><td>{v.algebraic_facts ? '✓' : '✗'}</td></tr>)}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div></Fold>
    <Fold title={t.xrH} open={lv >= 2}>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}</Fold>
    <Fold title={t.matH} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p><p className="eq-cap">{t.numbers}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('coupling_selfcheck.py', CP_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('coupling_matrix_check.py', CPM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('coupling.json', JSON.stringify(K.coupling, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
