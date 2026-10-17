import React, { useState } from 'react';
import E from './equationsData.js';
import { EQ_PY, DIRAC_PY } from './equationsSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY from './equationsCopy.js';
import CouplingSection from './CouplingSection.jsx';
import YangMillsSection from './YangMillsSection.jsx';
import MatterSection from './MatterSection.jsx';
import { Fold, Intro, level } from './Fold.jsx';
import { GravityOneSection, GravityTwoSection } from './GravitySection.jsx';

// "More equations": step 1 the commutators of bivectors, step 2 the Dirac equation in the even subalgebra, step 3 coupling, step 4 Yang–Mills, step 5 charged matter, then the tally.
// Every number comes from selfcheck/equations_selfcheck.py (standard library) and selfcheck/dirac_matrix_check.py (numpy), and is rebuilt by test_equations.mjs.
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const AX = ['t', 'x', 'y', 'z'];
const nm = m => AX.filter((_, i) => m >> i & 1).join('') || '1';
const RC = { E: '#fbbf24', B: '#60a5fa', T: '#c084fc' };
const KC = { dt: '#fbbf24', dx: '#34d399', dy: '#60a5fa', dz: '#c084fc' };
const STYLE = `.eq{max-width:900px;margin:28px auto;padding:0 16px}.eq h3{margin:1.2em 0 .4em}.eq-card{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:12px 14px;margin:10px 0}
.eq table{border-collapse:collapse;width:100%;min-width:520px;font-size:.85em}.eq th,.eq td{text-align:left;padding:3px 8px;border-bottom:1px solid rgba(128,128,128,.25)}.eq tr.on td{background:rgba(80,170,255,.14)}
.eq-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.eq-chip{background:none;border:1px solid rgba(128,128,128,.45);border-radius:999px;padding:3px 11px;color:inherit;cursor:pointer;font:inherit;font-size:.85em}.eq-chip.on{background:rgba(80,170,255,.22);border-color:#4aa8ff}
.eq-cap{font-size:.82em;opacity:.8}.eq-mono{font-family:ui-monospace,monospace}.eq-btn{background:none;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 12px;color:inherit;cursor:pointer;font:inherit;margin:4px 8px 4px 0}
.eq-pt{display:flex;gap:10px;margin:8px 0}.eq-pt p{margin:0}.eq-svg{width:100%;max-width:520px;display:block;margin:6px auto}.eq-xr{border-left:3px solid rgba(128,128,128,.5);padding:2px 0 2px 12px;margin:14px 0}.eq-fold{margin:12px 0}.eq-fold>summary{cursor:pointer;font-weight:600;font-size:1.1em;padding:6px 0}.eq-fold-in{margin:8px 0 0}.eq-fold-in>summary{font-size:1em}.eq-short{font-size:1.05em}.eq-nav{display:flex;gap:10px;flex-wrap:wrap;max-width:900px;margin:10px auto 0;padding:0 16px}.eq-nav a{color:inherit;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:4px 12px;text-decoration:none;font-size:.9em}`;
function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const Chips = ({ items, value, onPick }) => <div className="eq-chips" role="group">{items.map(i => <button key={i} className={'eq-chip' + (i === value ? ' on' : '')} aria-pressed={i === value} onClick={() => onPick(i)}>{i}</button>)}</div>;

// ---- the 6 bivectors of 4 generators as an octahedron: complementary pairs opposite, joined unless complementary
const OCT = [[3, 90], [5, 150], [6, 210], [12, 270], [10, 330], [9, 30]];
function Octa({ p }) {
  const role = m => { const t = pc(m & ((1 << p) - 1)); return t === 1 ? 'E' : t === 0 ? 'B' : 'T'; };
  const pos = Object.fromEntries(OCT.map(([m, a]) => [m, [150 + 105 * Math.cos(a * Math.PI / 180), 150 - 105 * Math.sin(a * Math.PI / 180), a]]));
  const edges = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const a = OCT[i][0], b = OCT[j][0]; if (pc(a & b) === 1) edges.push([a, b, role(a ^ b)]); }
  return <svg className="eq-svg" viewBox="0 0 300 300" role="img" aria-label="The six bivectors of four generators and their commutators">
    {edges.map(([a, b, r]) => <line key={a + '-' + b} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke={RC[r]} strokeWidth="1.3" opacity=".75"><title>{`[${nm(a)}, ${nm(b)}] = ±2 ${nm(a ^ b)}`}</title></line>)}
    {OCT.map(([m, a]) => <g key={m}><circle cx={pos[m][0]} cy={pos[m][1]} r="7" fill={RC[role(m)]} /><text x={150 + 132 * Math.cos(a * Math.PI / 180)} y={150 - 132 * Math.sin(a * Math.PI / 180) + 4} textAnchor="middle" fontSize="12" fill="currentColor">{nm(m)}</text></g>)}</svg>;
}

// ---- the Dirac incidences: 8 even blades on the left, 8 odd blades (the equations) on the right
function DiracPic({ t }) {
  const [hot, setHot] = useState(null), D = E.eq.dirac, L = D.even_blades.map(b => b.mask), R = D.odd_blades.map(b => b.mask).sort((x, y) => pc(x) - pc(y) || x - y), rh = 34, H = 8 * rh + 24, X0 = 105, X1 = 335;
  const yl = new Map(L.map((m, i) => [m, 18 + rh * (i + .5)])), yr = new Map(R.map((m, i) => [m, 18 + rh * (i + .5)]));
  const used = hot == null ? [] : D.incidences.filter(e => e.to === hot);
  return <div style={{ overflowX: 'auto' }}><svg className="eq-svg" style={{ maxWidth: 560, minWidth: 440 }} viewBox={`0 0 440 ${H}`} role="img" aria-label="Incidences of the Dirac equation between even and odd blades">
    {D.incidences.map((e, j) => { const on = hot == null || e.to === hot, mass = e.kind === 'm'; return <line key={j} x1={X0} y1={yl.get(e.from)} x2={X1} y2={yr.get(e.to)} stroke={mass ? 'currentColor' : KC[e.kind]} strokeDasharray={mass ? '4 3' : undefined} strokeWidth={on && hot != null ? 1.8 : mass ? 1.1 : .8} opacity={hot == null ? (mass ? .55 : .42) : on ? .95 : .05}><title>{`${t.kinds[e.kind]}: ${nm(e.from)} → ${nm(e.to)} (sign ${e.sign > 0 ? '+' : '−'})`}</title></line>; })}
    {L.map(m => <g key={m}><circle cx={X0} cy={yl.get(m)} r="5" fill={pc(m) === 2 ? '#34d399' : '#fbbf24'} /><text x={X0 - 10} y={yl.get(m) + 4} textAnchor="end" fontSize="12" fill="currentColor">{nm(m)}</text></g>)}
    {R.map(m => <g key={m} style={{ cursor: 'pointer' }} onClick={() => setHot(hot === m ? null : m)}><circle cx={X1} cy={yr.get(m)} r="5" fill={pc(m) === 1 ? '#8b93a7' : 'none'} stroke="#8b93a7" strokeWidth="1.3" /><text x={X1 + 10} y={yr.get(m) + 4} fontSize="12" fill="currentColor" fontWeight={hot === m ? 700 : 400}>{nm(m)}</text></g>)}
  </svg>{hot != null && <p className="eq-cap">{nm(hot)}: {t.terms(used.length)} — {used.map(e => t.kinds[e.kind]).join(', ')}</p>}</div>;
}

export default function EquationsSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l], C = E.eq.commutators, D = E.eq.dirac, M = E.matrix, [p, setP] = useState(1);
  const go = id => e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth' }); };
  const roleRows = Object.entries(C.roles[`${p},${4 - p}`] || {});
  return <><style>{STYLE}</style><nav className="eq-nav" aria-label="Equations">{[['eq-comm', 0], ['eq-dirac', 1], ['eq-coupling', 2], ['eq-ym', 3], ['eq-matter', 4], ['eq-grav1', 5], ['eq-grav2', 6], ['eq-tally', 7]].map(([id, i]) => <a key={id} href={'#' + id} onClick={go(id)}>{t.nav[i]}</a>)}</nav>
    <section className="eq" id="eq-comm" aria-labelledby="eq-c-h"><p className="eyebrow">{t.c.eyebrow}</p><h2 id="eq-c-h">{t.c.title}</h2><Intro lang={l} profile={profile} id="comm" lede={t.c.lede} />
      <Fold title={t.c.tableH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.c.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
        {Object.entries(C.by_n).map(([n, r]) => <tr key={n} className={n === '4' ? 'on' : ''}><td>{n}</td><td>{r.bivectors}</td><td>{r.edges}</td><td>{r.commuting_pairs}</td><td>{r.triangles}</td></tr>)}</tbody></table><p className="eq-cap"><Tags kinds={['checked']} lang={l} /> {t.c.note}</p></div></Fold>
      <h3>{t.c.picH}</h3><div className="eq-card"><p className="eq-cap">{t.c.pick}</p><Chips items={[0, 1, 2, 3, 4]} value={p} onPick={setP} /><Octa p={p} /><p className="eq-cap">{t.c.cap(p)}</p>
        <p className="eq-cap">{t.c.legend} {Object.entries(t.c.roles).map(([k, v]) => <span key={k} style={{ marginRight: 12 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: RC[k], marginRight: 4 }} />{v}</span>)}</p>
        <h4>{t.c.roleH}</h4><div style={{ overflowX: 'auto' }}><table><thead><tr>{t.c.roleCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{roleRows.map(([k, v]) => { const [pair, sh] = k.split(' via '); return <tr key={k}><td>{pair.replace('+', ' · ')}</td><td>{t.c.via[sh]}</td><td>{v.result}</td><td>{v.edges}</td></tr>; })}</tbody></table></div>
        {p === 1 && <p>{t.c.lorentz}</p>}</div>
      <div>{t.c.points.map(([ks, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={ks} lang={l} /></div><p>{txt}</p></div>)}</div></section>
    <section className="eq" id="eq-dirac" aria-labelledby="eq-d-h"><p className="eyebrow">{t.d.eyebrow}</p><h2 id="eq-d-h">{t.d.title}</h2><Intro lang={l} profile={profile} id="dirac" lede={t.d.lede} />
      <div><Tags kinds={['checked']} lang={l} /> <span className="eq-cap">{t.d.numbers}</span></div>
      <h3>{t.d.picH}</h3><div className="eq-card"><DiracPic t={t.d} /><p className="eq-cap">{t.d.cap} {Object.entries(KC).map(([k, c]) => <span key={k} style={{ marginRight: 8, color: c }}>{t.d.kinds[k]}</span>)}</p></div>
      <Fold title={t.d.xrefH} open={lv >= 1}>
      {[['cube', ['checked', 'ours']], ['maxwell', ['checked']], ['comm', ['checked']], ['disp', ['checked']], ['mat', ['checked', 'standard']]].map(([k, ks]) => <div key={k} className="eq-xr"><h4>{t.d[k].h} <Tags kinds={ks} lang={l} /></h4><p>{t.d[k].t}</p></div>)}</Fold>
      <p className="eq-cap"><Tags kinds={['open']} lang={l} /> {t.d.limits}</p></section>
    <CouplingSection lang={l} profile={profile} />
    <YangMillsSection lang={l} profile={profile} />
    <MatterSection lang={l} profile={profile} />
    <GravityOneSection lang={l} profile={profile} />
    <GravityTwoSection lang={l} profile={profile} />
    <section className="eq" id="eq-tally" aria-labelledby="eq-t-h"><p className="eyebrow">{t.t.eyebrow}</p><h2 id="eq-t-h">{t.t.title}</h2><p className="lede">{t.t.lede}</p>
      <div className="eq-card" style={{ overflowX: 'auto' }}><table><thead><tr>{t.t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{t.t.rows.map((r, i) => <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Tags kinds={r[4]} lang={l} /></td></tr>)}</tbody></table></div>
      <p>{t.t.note}</p><p className="eq-cap"><Tags kinds={['open']} lang={l} /> {t.t.next}</p>
      <h3>{t.dl.h}</h3><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('equations_selfcheck.py', EQ_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('dirac_matrix_check.py', DIRAC_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('equations.json', JSON.stringify(E.eq, null, 1), 'application/json')}>{t.dl.json}</button></div><p className="eq-mono eq-cap">{t.dl.cmd}</p></section></>;
}
