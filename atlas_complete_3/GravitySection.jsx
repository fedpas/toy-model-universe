import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './gravityData.js';
import { GV_PY, GVM_PY } from './gravitySelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { planes, pairClass, subsets4, plane } from './gravityCopy.js';

// Steps 6 and 7 of the equations page: gravity, n = 2 ... 8.
// Numbers come from selfcheck/gravity_selfcheck.py (exact) and selfcheck/gravity_matrix_check.py (numpy); test_gravity.mjs recomputes the structure independently.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const COL = { diagonal: '#fbbf24', one: '#60a5fa', disjoint: '#34d399' };
const AX = ['t', 'x', 'y', 'z', 'u', 'v', 'w', 's'];
const NS = Object.keys(K.gv.ladder).map(Number);
const tick = v => (v ? '✓' : '✗');

// the table of curvature components: unordered pairs of planes, coloured by how many axes the planes share
function PairGrid({ n, cls, sub, t }) {
  const pl = planes(n), P = pl.length, s = Math.min(16, 320 / P), W = P * s + 20;
  const hit = new Set();
  if (sub != null && sub !== '') {
    const [a, b, c, d] = subsets4(n)[+sub], key = (x, y) => (1 << x | 1 << y), ix = m => pl.indexOf(m);
    for (const [p, q] of [[key(a, b), key(c, d)], [key(a, c), key(b, d)], [key(a, d), key(b, c)]]) { const i = ix(p), j = ix(q); hit.add(Math.min(i, j) + ',' + Math.max(i, j)); }
  }
  const cells = [];
  for (let i = 0; i < P; i++) for (let j = i; j < P; j++) {
    const c = pairClass(pl[i], pl[j]), on = sub != null && sub !== '' ? hit.has(i + ',' + j) : (cls === 'all' || cls === c);
    cells.push(<rect key={i + ',' + j} className={'gv-cell' + (on ? ' on' : '')} data-class={c} data-on={on ? 1 : 0} x={10 + j * s} y={10 + i * s} width={s - 1} height={s - 1} fill={COL[c]} opacity={on ? .95 : .1}><title>{`(${axn(pl[i])} | ${axn(pl[j])}) ${t.classes[c]}`}</title></rect>);
  }
  return <svg className="eq-svg" style={{ maxWidth: 420 }} viewBox={`0 0 ${W} ${W}`} role="img" aria-label="Table of pairs of planes, coloured by the number of shared axes" data-n={n}>{cells}</svg>;
}
const axn = m => AX.filter((_, i) => m >> i & 1).join('');

export function GravityOneSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].g1, Lad = K.gv.ladder, [n, setN] = useState(4), [cls, setCls] = useState('all'), [sub, setSub] = useState('');
  const r = { ...Lad[n], n_value: n }, ID = K.gv.identities, views = t.views(r), CS = K.gv.curvature_space;
  const pick = k => { setN(k); setCls('all'); setSub(''); };
  const subs = n >= 4 ? subsets4(n) : [];
  const subName = i => subs[i].map(x => AX[x]).join('');
  const subCells = i => { const [a, b, c, d] = subs[i]; return [`${plane(a, b)}|${plane(c, d)}`, `${plane(a, c)}|${plane(b, d)}`, `${plane(a, d)}|${plane(b, c)}`].join(', '); };
  return <section className="eq" id="eq-grav1" aria-labelledby="eq-gv1-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="eq-gv1-h">{t.title}</h2><Intro lang={l} profile={profile} id="grav1" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard']} lang={l} /></div>
    <Fold title={t.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="gv-table"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {NS.map(k => { const x = Lad[k], cs = CS[k]; return <tr key={k} className={k === n ? 'on' : ''} onClick={() => pick(k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{x.frame_algebra}</td><td>{x.bivectors} ({x.boosts} + {x.rotations})</td><td>{x.omega_components}</td><td>{x.tetrad_components}</td><td>{x.curvature_components}</td><td>{x.torsion_components}</td><td>{x.riemann_independent}</td><td>{x.first_bianchi_constraints}</td><td>{cs ? `${cs.ricci_rank} + ${cs.weyl_dimension}` : '—'}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{NS.map(k => <button key={k} className={'eq-chip gv-chip' + (k === n ? ' on' : '')} aria-pressed={k === n} onClick={() => pick(k)}>{k}</button>)}</div>
      <h4>{t.picH}</h4><PairGrid n={n} cls={cls} sub={sub} t={t} /><p className="eq-cap gv-cap">{t.picCap(n)}</p>
      <div className="eq-chips gv-classes" role="group">{['all', 'diagonal', 'one', 'disjoint'].map(c => <button key={c} className={'eq-chip gv-cls' + (cls === c && sub === '' ? ' on' : '')} aria-pressed={cls === c && sub === ''} onClick={() => { setCls(c); setSub(''); }}>{t.classes[c]}{c !== 'all' ? ` · ${c === 'diagonal' ? r.pair_classes.diagonal : c === 'one' ? r.pair_classes.share_one_index : r.pair_classes.disjoint}` : ''}</button>)}</div>
      {n >= 4 && <p className="eq-cap"><label>{t.subLabel}: <select className="gv-sub" value={sub} onChange={e => setSub(e.target.value)}><option value="">{t.subNone}</option>{subs.map((_, i) => <option key={i} value={i}>{subName(i)}</option>)}</select></label></p>}
      <p className="eq-cap gv-selcap">{sub !== '' && n >= 4 ? t.subCap(subName(+sub), subCells(+sub)) : t.classCap(cls, cls === 'diagonal' ? r.pair_classes.diagonal : cls === 'one' ? r.pair_classes.share_one_index : r.pair_classes.disjoint)}</p>
      <Fold nested title={t.viewsH(n)} open={lv >= 1}><div className="gv-views">{views.map(v => <div key={v.h} className="eq-xr gv-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></Fold></div>
    <Fold title={t.idH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="gv-id"><thead><tr>{t.idCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(ID).map(([k, v]) => <tr key={k}><td>{k}</td><td>{tick(v.second_bianchi)}</td><td>{tick(v.first_bianchi)}</td><td>{tick(v.local_lorentz_covariance)}</td><td>{tick(v.spinor_commutator)}</td></tr>)}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div></Fold>
    <Fold title={t.xrH} open={lv >= 2}>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}</Fold>
    <Fold title={t.matH} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p><p className="eq-cap">{t.numbers}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('gravity_selfcheck.py', GV_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('gravity_matrix_check.py', GVM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('gravity.json', JSON.stringify(K.gv, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}

// the terms of E_a: for a fixed index a, the pairs {b, c} of the other axes (edges of the simplex on them); the remaining axes carry tetrads
function TermRing({ n, a, selected, onSelect, t }) {
  const R = 78, C = [130, 100], pos = k => [C[0] + R * Math.cos((-90 + 360 * k / n) * Math.PI / 180), C[1] + R * Math.sin((-90 + 360 * k / n) * Math.PI / 180)];
  const others = [...Array(n).keys()].filter(x => x !== a), edges = [];
  for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) edges.push([others[i], others[j]]);
  const sel = selected && selected[0] !== a && selected[1] !== a ? selected : null, rest = sel ? others.filter(x => x !== sel[0] && x !== sel[1]) : [];
  return <svg className="eq-svg" style={{ maxWidth: 400 }} viewBox="0 0 260 200" role="img" aria-label="The pairs of axes that make the terms of the Einstein form" data-n={n}>
    {edges.map(([b, c]) => { const on = sel && sel[0] === b && sel[1] === c; return <g key={b + '-' + c}><line className={'gv-edge' + (on ? ' on' : '')} x1={pos(b)[0]} y1={pos(b)[1]} x2={pos(c)[0]} y2={pos(c)[1]} stroke={on ? '#34d399' : 'currentColor'} strokeWidth={on ? 2.4 : .8} opacity={sel ? (on ? 1 : .25) : .55} /><line x1={pos(b)[0]} y1={pos(b)[1]} x2={pos(c)[0]} y2={pos(c)[1]} stroke="transparent" strokeWidth="9" style={{ cursor: 'pointer' }} className="gv-edge-hit" onClick={() => onSelect([b, c])}><title>{`{${AX[b]}, ${AX[c]}}`}</title></line></g>; })}
    {[...Array(n).keys()].map(k => { const p = pos(k), isA = k === a, isR = rest.includes(k), isP = sel && (sel[0] === k || sel[1] === k); return <g key={k} className="gv-node"><circle className={isA ? 'gv-a' : isR ? 'gv-rest' : isP ? 'gv-pair' : 'gv-plain'} cx={p[0]} cy={p[1]} r={isA ? 7 : 5} fill={isR ? '#fbbf24' : isP ? '#34d399' : isA ? 'none' : '#8b93a7'} stroke={isA ? '#f87171' : '#8b93a7'} strokeWidth={isA ? 2 : 1} /><text x={p[0] + (p[0] >= C[0] ? 10 : -10)} y={p[1] + 4} textAnchor={p[0] >= C[0] ? 'start' : 'end'} fontSize="11" fill="currentColor">{AX[k]}</text></g>; })}</svg>;
}

export function GravityTwoSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].g2, Lad = K.gv.ladder, [n, setN] = useState(4), [a, setA] = useState(0), [selected, setSelected] = useState(null);
  const r = { ...Lad[n], n_value: n }, views = t.views(r);
  const pick = k => { setN(k); setA(0); setSelected(null); };
  const sel = selected && selected[0] !== a && selected[1] !== a ? selected : null, rest = sel ? [...Array(n).keys()].filter(x => x !== a && x !== sel[0] && x !== sel[1]).map(x => AX[x]) : [];
  const EI = K.gv.einstein_identities, DS = K.gv.desitter, RT = K.gv.einstein_tensor_ratio;
  return <section className="eq" id="eq-grav2" aria-labelledby="eq-gv2-h"><p className="eyebrow">{t.eyebrow}</p><h2 id="eq-gv2-h">{t.title}</h2><Intro lang={l} profile={profile} id="grav2" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard']} lang={l} /></div>
    <Fold title={t.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="gv-table2"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {NS.map(k => { const x = Lad[k]; return <tr key={k} className={k === n ? 'on' : ''} onClick={() => pick(k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{x.einstein_components}</td><td>{x.einstein_terms_per_component}</td><td>{k >= 3 ? k - 3 : 0}</td><td>{x.divergence_torsion_terms_per_component}</td><td>{x.desitter_generators}</td><td>{x.desitter_curvature_components}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{NS.map(k => <button key={k} className={'eq-chip gv-chip2' + (k === n ? ' on' : '')} aria-pressed={k === n} onClick={() => pick(k)}>{k}</button>)}</div>
      <h4>{t.picH}</h4>
      <p className="eq-cap">{t.aLabel}:</p><div className="eq-chips gv-achips" role="group">{[...Array(n).keys()].map(k => <button key={k} className={'eq-chip gv-achip' + (a === k ? ' on' : '')} aria-pressed={a === k} onClick={() => { setA(k); setSelected(null); }}>{AX[k]}</button>)}</div>
      <TermRing n={n} a={a} selected={selected} onSelect={setSelected} t={t} /><p className="eq-cap gv-cap">{t.picCap(n)}</p>
      <p className="eq-cap gv-selcap">{sel ? t.capSel(AX[sel[0]], AX[sel[1]], rest) : t.capNone}</p>
      <Fold nested title={t.viewsH(n)} open={lv >= 1}><div className="gv-views2">{views.map(v => <div key={v.h} className="eq-xr gv-view2"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></Fold></div>
    <Fold title={t.idH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="gv-id2"><thead><tr>{t.idCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(EI).map(([k, v]) => { const [nn, c] = k.split(','); return <tr key={k}><td>{nn}</td><td>{c}</td><td>{tick(v.covariant_divergence_of_E_is_torsion_terms)}</td><td>{+c === 0 && RT[nn] === '1' ? '✓' : '—'}</td></tr>; })}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div></Fold>
    <Fold title={t.dsH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="gv-ds"><thead><tr>{t.dsCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Object.entries(DS).map(([k, v]) => <tr key={k}><td>{k.split(',')[0]}</td><td>{v.extra_generator_square > 0 ? '+1' : '−1'}</td><td>{v.group}</td><td>{v.coefficient_of_e_wedge_e > 0 ? '+' : ''}{v.coefficient_of_e_wedge_e}</td><td>{v.coefficient_of_torsion}</td></tr>)}</tbody></table><p className="eq-cap"><Tags kinds={['checked', 'standard']} lang={l} /> {t.dsNote}</p></div></Fold>
    <Fold title={t.xrH} open={lv >= 2}>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}</Fold>
    <Fold title={t.matH} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p><p className="eq-cap">{t.numbers}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('gravity_selfcheck.py', GV_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('gravity_matrix_check.py', GVM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('gravity.json', JSON.stringify(K.gv, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
export default GravityOneSection;
