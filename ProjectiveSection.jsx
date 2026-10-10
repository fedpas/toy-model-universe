import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './projectiveData.js';
import { PJ_PY, PJM_PY } from './projectiveSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { baseSq, key, pdot, sgn, AXN } from './projectiveCopy.js';
import { stepEyebrow } from './steps.js';

// Step 9 of the equations page: one more generator (s = 0, -1, +1) and a null pair, n = 2 ... 6.
// Numbers come from selfcheck/projective_selfcheck.py (exact) and selfcheck/projective_matrix_check.py (numpy); test_projective.mjs recomputes the structure independently.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const NS = [2, 3, 4, 5, 6], ALLN = Object.keys(K.pj.counts).map(Number), SS = [0, -1, 1];
const tick = v => (v ? '✓' : '✗');
const SCOL = { '0': '#9ca3af', '-1': '#60a5fa', '1': '#f87171' };

// n base axes round a circle, the extra generator in the middle, a spoke for each plane B_an with its square
function LadderPic({ n, kind, s }) {
  const bs = baseSq(kind, n), R = 80, C = [130, 100], pos = k => [C[0] + R * Math.cos((-90 + 360 * k / n) * Math.PI / 180), C[1] + R * Math.sin((-90 + 360 * k / n) * Math.PI / 180)], col = SCOL[String(s)];
  return <svg className="eq-svg pj-pic" style={{ maxWidth: 360 }} viewBox="0 0 260 200" role="img" aria-label="The base axes and the extra generator, with the plane of each axis and the extra one" data-n={n} data-s={s}>
    {bs.map((q, a) => { const p = pos(a), sqv = -q * s || 0, m = [(p[0] + C[0]) / 2, (p[1] + C[1]) / 2]; return <g key={a}><line className="pj-spoke" data-square={sqv} x1={p[0]} y1={p[1]} x2={C[0]} y2={C[1]} stroke={col} strokeWidth="2" strokeDasharray={s === 0 ? '4 3' : ''} /><text x={m[0] + 4} y={m[1] - 3} fontSize="11" fill={col}>{sgn(sqv)}</text></g>; })}
    {bs.map((q, a) => { const p = pos(a); return <g key={'n' + a}><circle className="pj-node" data-sq={q} cx={p[0]} cy={p[1]} r="7" fill={q > 0 ? '#fbbf24' : 'none'} stroke="currentColor" strokeWidth="1.5" /><text x={p[0] + (p[0] >= C[0] ? 11 : -11)} y={p[1] + 4} textAnchor={p[0] >= C[0] ? 'start' : 'end'} fontSize="11" fill="currentColor">{kind === 'lorentz' ? AXN[a] : AXN[a + 1]}</text></g>; })}
    <circle className="pj-extra" cx={C[0]} cy={C[1]} r="9" fill={s === 0 ? 'none' : col} stroke={col} strokeWidth="2" strokeDasharray={s === 0 ? '3 2' : ''} /><text x="6" y="14" fontSize="11" fill={col}>{`e, e² = ${sgn(s)}`}</text></svg>;
}
// the plane of the null pair: e_m (square +1) horizontal, e_p (square -1) vertical, eps and o along the diagonals
function NullPic() {
  return <svg className="eq-svg pj-null" style={{ maxWidth: 260 }} viewBox="0 0 220 200" role="img" aria-label="The plane of the null pair: the two null diagonals eps and o" >
    <line x1="20" y1="100" x2="200" y2="100" stroke="currentColor" opacity=".5" /><line x1="110" y1="190" x2="110" y2="10" stroke="currentColor" opacity=".5" />
    <line className="pj-eps" x1="40" y1="170" x2="180" y2="30" stroke="#f87171" strokeWidth="2.5" /><line className="pj-o" x1="40" y1="30" x2="180" y2="170" stroke="#60a5fa" strokeWidth="2.5" />
    <text x="186" y="30" fontSize="13" fill="#f87171">ε</text><text x="186" y="176" fontSize="13" fill="#60a5fa">o</text>
    <text x="203" y="96" fontSize="11" fill="currentColor">e_m</text><text x="114" y="14" fontSize="11" fill="currentColor">e_p</text></svg>;
}

export default function ProjectiveSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].p1, [n, setN] = useState(4), [kind, setKind] = useState('lorentz'), [s, setS] = useState(-1);
  const rec = K.pj.ladder[key(kind, n, s)], r = { n_value: n }, views = t.views(r), info = t.info(kind, n, s, rec);
  const allTrue = (grp, f) => Object.entries(K.pj[grp]).every(([, v]) => f(v));
  const idRow = k => { const both = ['space', 'lorentz'], g = (grp, kd) => K.pj[grp][`${kd},${k}`];
    return [k, tick(both.every(kd => SS.every(sv => K.pj.ladder[key(kd, k, sv)].jacobi) && K.pj.contraction[`${kd},${k}`])),
      tick(both.every(kd => g('null_pair', kd).points_tested === 12)),
      tick(both.every(kd => ['translation', 'rotation', 'dilation', 'inversion', 'plane'].every(m => g('null_pair', kd)[m]) && g('null_pair', kd).translation_is_two_parallel_planes && g('null_pair', kd).dilation_is_two_concentric_spheres)),
      k <= 3 ? tick(both.every(kd => g('pga', kd).homomorphism && g('pga', kd).injective)) : '—',
      k <= 3 ? tick(both.every(kd => g('motors', kd).at_most_n_plus_1)) : '—',
      tick(both.every(kd => g('conformal', kd).jacobi && g('conformal', kd).dilation_eigenvalue_on_T === '2' && g('conformal', kd).dilation_eigenvalue_on_K === '-2'))]; };
  return <section className="eq" id="eq-projective" aria-labelledby="eq-pj-h"><p className="eyebrow">{stepEyebrow(l, 'eq', 'projective')}</p><h2 id="eq-pj-h">{t.title}</h2><Intro lang={l} profile={profile} id="projective" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours']} lang={l} /></div>
    <Fold title={t.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="pj-table"><thead><tr>{t.cols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>
      {ALLN.map(k => { const c = K.pj.counts[k]; return <tr key={k} className={k === n ? 'on' : ''} onClick={() => NS.includes(k) && setN(k)} style={{ cursor: 'pointer' }}><td>{k}</td><td>{c.ladder_generators}</td><td>{c.euclid_generators}</td><td>{c.conformal_generators}</td><td>{c.pga_dimension}</td><td>{c.cga_dimension}</td><td>{c.planes_to_move_a_point}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.pickH}</h3><div className="eq-card"><p className="eq-cap">{t.pick}</p>
      <div className="eq-chips" role="group">{['space', 'lorentz'].map(k => <button key={k} className={'eq-chip pj-kind' + (k === kind ? ' on' : '')} aria-pressed={k === kind} onClick={() => setKind(k)}>{t.kinds[k]}</button>)}</div>
      <div className="eq-chips" role="group">{SS.map(v => <button key={v} className={'eq-chip pj-s' + (v === s ? ' on' : '')} aria-pressed={v === s} onClick={() => setS(v)}>{t.sLabel(v)}</button>)}</div>
      <div className="eq-chips" role="group">{NS.map(k => <button key={k} className={'eq-chip pj-chip' + (k === n ? ' on' : '')} aria-pressed={k === n} onClick={() => setN(k)}>{k}</button>)}</div>
      <h4>{t.picH}</h4><LadderPic n={n} kind={kind} s={s} /><p className="eq-cap pj-cap">{t.picCap(n, kind, s)}</p>
      <div className="eq-xr pj-info">{info.map((x, i) => <p key={i} className="pj-line">{x}</p>)}</div>
      <Fold nested title={t.viewsH(n)} open={lv >= 1}><div className="pj-views">{views.map(v => <div key={v.h} className="eq-xr pj-view"><h4>{v.h} <Tags kinds={v.tags} lang={l} /></h4><p>{v.t}</p></div>)}</div></Fold></div>
    <h3>{t.nullH}</h3><div className="eq-card"><NullPic /><p className="eq-cap">{t.nullCap}</p><div style={{ overflowX: 'auto' }}><table className="pj-pts"><thead><tr>{t.ptsCols.map((x, i) => <th key={i}>{x}</th>)}</tr></thead><tbody>
      {[0, 1, 2, 3].map(x => <tr key={x}><td>{x}</td><td>{`o + ${x}·e₁ + ${x * x / 2} ε`}</td>{[0, 1, 2, 3].map(y => <td key={y} className="pj-dot" data-x={x} data-y={y}>{pdot(x, y)}</td>)}</tr>)}</tbody></table></div></div>
    <h3>{t.motionsH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="pj-motions"><thead><tr>{t.motionsCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{t.motionsRows.map(([a, b, c, kk]) => <tr key={kk}><td>{a}</td><td>{b}</td><td>{c}</td><td>{tick(allTrue('null_pair', v => v[kk]))}</td></tr>)}</tbody></table><p className="eq-cap">{t.motionsNote}</p></div>
    <Fold title={t.idH} open={lv >= 1}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="pj-id"><thead><tr>{t.idCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{[2, 3, 4].map(k => <tr key={k}>{idRow(k).map((x, i) => <td key={i}>{x}</td>)}</tr>)}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.idNote}</p></div></Fold>
    <Fold title={t.dblH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table className="pj-dbl"><thead><tr>{t.dblCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{Object.entries(K.pj.doubling).map(([k, v]) => { const j = k.split(',')[0]; return <tr key={k}><td>{j}</td><td>{`Cl(${j},${j}) = M${v.matrix_size}(ℝ)`}</td><td>{v.matrix_size}</td><td>{v.algebra_dimension}</td></tr>; })}</tbody></table><p className="eq-cap"><Tags kinds={['checked', 'standard']} lang={l} /> {t.dblNote}</p></div></Fold>
    <Fold title={t.xrH} open={lv >= 2}>{t.xr.map(([k, txt], i) => <div key={i} className="eq-xr"><p><Tags kinds={[k]} lang={l} /> {txt}</p></div>)}</Fold>
    <Fold title={t.matH} open={lv >= 2}><div className="eq-card"><p><Tags kinds={['checked', 'standard']} lang={l} /> {t.mat}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('projective_selfcheck.py', PJ_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('projective_matrix_check.py', PJM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('projective.json', JSON.stringify(K.pj, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
