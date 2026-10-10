import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './mirrorsData.js';
import { MR_PY, MRM_PY } from './mirrorsSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { AXN, weight } from './mirrorsCopy.js';
import { stepEyebrow } from './steps.js';

// Step 8 of the equations page: mirrors, versors, Cartan–Dieudonné, the cube as a group, n = 2 ... 8.
// Numbers come from selfcheck/mirrors_selfcheck.py (exact) and selfcheck/mirrors_matrix_check.py (numpy); test_mirrors.mjs recomputes the structure independently.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const NS = Object.keys(K.mr.ladder).map(Number);
const tick = v => (v ? '✓' : '✗');
const EVEN = '#34d399', ODD = '#fbbf24';
const fr = s => { const [a, b] = String(s).split('/'); return b ? +a / +b : +a; };
const house = (a, x) => { const d = a[0] * a[0] + a[1] * a[1], p = (x[0] * a[0] + x[1] * a[1]) * 2 / d; return [x[0] - p * a[0], x[1] - p * a[1]]; };

// the corners of the n-cube in columns by weight; picking one shows its mirrors
function CubePic({ n, sel, onSel, evenOnly, t }) {
  const cols = Array.from({ length: n + 1 }, () => []);
  for (let S = 0; S < 1 << n; S++) cols[weight(S)].push(S);
  const mx = Math.max(...cols.map(c => c.length)), W = 36 * (n + 1) + 20, H = 22 * mx + 50;
  return <svg className="eq-svg mr-pic" style={{ maxWidth: 520 }} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The corners of the cube in columns by the number of mirrors" data-n={n}>
    {cols.map((c, k) => <g key={k}><text x={28 + 36 * k} y={14} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".7">{k}</text>
      {c.map((S, j) => { const y = 32 + (mx - c.length) * 11 + 22 * j, even = k % 2 === 0, on = S === sel, dim = evenOnly && !even; return <circle key={S} className={'mr-corner' + (even ? ' even' : ' odd') + (on ? ' on' : '')} data-mask={S} data-w={k} cx={28 + 36 * k} cy={y} r={on ? 8 : 6} fill={even ? EVEN : ODD} opacity={dim ? .12 : 1} stroke={on ? 'currentColor' : 'none'} strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => onSel(S)}><title>{`${S === 0 ? '1' : [...Array(n).keys()].filter(i => S >> i & 1).map(i => AXN[i]).join('')} · ${k}`}</title></circle>; })}</g>)}</svg>;
}
// the layers for n > 5: bars, since the corners are too many to click
function LayerBars({ r, evenOnly }) {
  const mx = Math.max(...r.layers), W = 36 * r.layers.length + 20;
  return <svg className="eq-svg mr-pic" style={{ maxWidth: 520 }} viewBox={`0 0 ${W} 120`} role="img" aria-label="The number of corners by number of mirrors" data-n={r.n_value}>{r.layers.map((c, k) => { const h = 80 * c / mx, even = k % 2 === 0; return <g key={k}><rect className="mr-bar" data-w={k} data-count={c} x={12 + 36 * k} y={100 - h} width="24" height={h} fill={even ? EVEN : ODD} opacity={evenOnly && !even ? .12 : 1}><title>{`${k}: ${c}`}</title></rect><text x={24 + 36 * k} y={114} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".7">{k}</text></g>; })}</svg>;
}
// two mirrors make the rotation 3/5, 4/5: x -> image in the second mirror -> image of that in the first
function TwoMirrors() {
  const ex = K.mr.examples.rotation_3_4_5, a1 = ex.mirror_normals[0].map(fr), a2 = ex.mirror_normals[1].map(fr), x = [1, 0], y = house(a2, x), z = house(a1, y), S = 90, C = [110, 110], P = p => [C[0] + S * p[0], C[1] - S * p[1]];
  const line = a => { const d = [-a[1], a[0]], m = Math.hypot(d[0], d[1]), u = [d[0] / m * 1.25, d[1] / m * 1.25]; return [P([-u[0], -u[1]]), P(u)]; };
  const pts = [[x, 'x'], [y, 'R₂x'], [z, 'R₁R₂x']];
  return <svg className="eq-svg mr-two-pic" style={{ maxWidth: 300 }} viewBox="0 0 220 220" role="img" aria-label="Two mirrors and the rotation they make" data-end={z.map(v => v.toFixed(6)).join(',')}>
    {[a1, a2].map((a, i) => { const [p, q] = line(a); return <line key={i} className="mr-mirror" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={i ? '#60a5fa' : '#f87171'} strokeWidth="2" />; })}
    {pts.map(([p, nm], i) => { const q = P(p); return <g key={i}><circle className="mr-pt" cx={q[0]} cy={q[1]} r="4" fill="currentColor" /><text x={q[0] + 6} y={q[1] - 6} fontSize="11" fill="currentColor">{nm}</text></g>; })}</svg>;
}

export default function MirrorsSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].m1, Lad = K.mr.ladder, [n, setN] = useState(4), [sel, setSel] = useState(15), [evenOnly, setEven] = useState(false);
  const r = { ...Lad[n], n_value: n }, views = t.views(r), pick = k => { setN(k); setSel(k <= 5 ? (1 << k) - 1 : 0); }, c = t.corner(Math.min(n, 5), sel & ((1 << Math.min(n, 5)) - 1));
  return <section className="eq" id="eq-mirrors" aria-labelledby="eq-mr-h"><p className="eyebrow">{stepEyebrow(l, 'eq', 'mirrors')}</p><h2 id="eq-mr-h">{t.title}</h2><Intro lang={l} profile={profile} id="mirrors" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours']} lang={l} /></div>
    <Fold title={t.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="mr-table"><thead><tr>{t.cols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>
      {NS.map(k => { const x = Lad[k]; return <tr key={k} className={k === n ? 'on' : ''} onClick={() => pick(k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{x.corners}</td><td>{x.layers.join(' + ')}</td><td>{x.rotors}</td><td>{x.reflections}</td><td>{x.max_mirrors}</td><td>{x.B_order}</td><td>{x.D_order}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{NS.map(k => <button key={k} className={'eq-chip mr-chip' + (k === n ? ' on' : '')} aria-pressed={k === n} onClick={() => pick(k)}>{k}</button>)}</div>
      <h4>{t.picH}</h4>{n <= 5 ? <CubePic n={n} sel={sel} onSel={setSel} evenOnly={evenOnly} t={t} /> : <LayerBars r={r} evenOnly={evenOnly} />}
      <p className="eq-cap mr-cap">{t.picCap(n)}</p>
      <div className="eq-chips" role="group"><button className={'eq-chip mr-toggle' + (evenOnly ? ' on' : '')} aria-pressed={evenOnly} onClick={() => setEven(!evenOnly)}>{evenOnly ? t.all : t.onlyEven}</button></div>
      {n <= 5 && <div className="eq-xr mr-picked"><h4>{t.pickedH}</h4><p className="mr-head"><strong>{c.head}</strong></p>{c.lines.map((x, i) => <p key={i} className="mr-line">{x}</p>)}</div>}
      <Fold nested title={t.viewsH(n)} open={lv >= 1}><div className="mr-views">{views.map(v => <div key={v.h} className="eq-xr mr-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></Fold></div>
    <h3>{t.twoH}</h3><div className="eq-card"><TwoMirrors /><p className="eq-cap">{t.twoCap}</p><div style={{ overflowX: 'auto' }}><table className="mr-two"><thead><tr>{t.twoCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{t.twoRows.map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div></div>
    <Fold title={t.idH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="mr-id"><thead><tr>{t.idCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{[2, 3, 4, 5].map(k => { const vs = ['space', 'lorentz'].map(s => K.mr.versors[`${k},${s}`]), cs = ['space', 'lorentz'].map(s => K.mr.corners[`${k},${s}`]), cx = K.mr.coxeter[k];
      return <tr key={k}><td>{k}</td><td>{tick(vs.every(v => v.mirror_formula && v.isometry && v.determinant && v.parity && v.parity_of_count))}</td><td>{tick(cs.every(v => v.all_flip))}</td><td>{tick(vs.every(v => v.at_most_n && v.reduced_versor_equal_up_to_scalar))}</td><td>{cx.B_order} / {cx.D_order}</td></tr>; })}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div></Fold>
    <Fold title={t.e8H} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.e8}</p></div></Fold>
    <Fold title={t.xrH} open={lv >= 2}>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}</Fold>
    <Fold title={t.matH} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('mirrors_selfcheck.py', MR_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('mirrors_matrix_check.py', MRM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('mirrors.json', JSON.stringify(K.mr, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
