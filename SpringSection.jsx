import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './springData.js';
import { SPR_PY } from './springSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { THREADS, ROW_META, CONTROLS, rowText, rowIds } from './springCopy.js';
import { stepEyebrow } from './steps.js';
import { OscillatorI, CubeSprings, Spectra, FaceCloser, LabelsAsModes } from './SpringWidgets.jsx';

// Step 12 of the equations page: a spring on the cube. Every row comes from selfcheck/spring_selfcheck.py (exact, standard library);
// test_spring.mjs recomputes the page’s own numbers and test_spring_ui.mjs drives the page.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const copyText = async (text, done) => { try { await navigator.clipboard.writeText(text); done(true); } catch (e) { done(false); } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const WIDGETS = { oscillator: ['osc', OscillatorI], vertices: ['cube', CubeSprings], sign: ['spec', Spectra], faces: ['face', FaceCloser], labels: ['lab', LabelsAsModes] };
const STYLE = `.spr-row{border:1px solid rgba(128,128,128,.35);border-radius:10px;margin:8px 0}.spr-row.open{border-color:#4aa8ff}
.spr-row-h{display:block;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:10px 12px}.spr-id{font-family:ui-monospace,monospace;font-weight:700;margin-right:8px}
.spr-claim{display:block;margin-top:4px;overflow-wrap:anywhere}.spr-detail{padding:2px 14px 12px;border-top:1px solid rgba(128,128,128,.25)}.spr-detail h5{margin:.9em 0 .2em;font-size:.9em;opacity:.8}.spr-detail p{margin:.2em 0}
.spr-th{border-top:2px solid rgba(128,128,128,.3);margin-top:28px;padding-top:6px}.spr-q{font-style:italic;margin:.2em 0 .4em}.spr-which{font-size:.88em;margin:.3em 0 .6em}
.spr-views{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin:8px 0}.spr-view{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.spr-view h5{margin:.1em 0 .3em;font-size:.82em;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.spr-view p{margin:0;font-size:.92em}
.spr-view.mech{border-top:3px solid #60a5fa}.spr-view.cube{border-top:3px solid #34d399}.spr-view.alg{border-top:3px solid #fbbf24}
.spr-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.spr-bar input[type=search]{flex:1;min-width:200px;background:none;border:1px solid rgba(128,128,128,.45);border-radius:8px;padding:5px 9px;color:inherit;font:inherit}
.spr-faces{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.spr-face{font-family:ui-monospace,monospace;font-size:.76em;border:1px solid rgba(128,128,128,.4);border-radius:6px;padding:0 6px}.spr-face.z{border-color:#34d399;color:#34d399}.spr-face.nz{border-color:#f87171;color:#f87171}
.spr-svg{max-width:640px}.spr-lbl-tab td,.spr-lbl-tab th{padding:2px 8px}.sp-w h5{margin:.9em 0 .2em}.sp-sl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}.sp-sl input{flex:1;min-width:140px}.sp-out{margin:.35em 0;font-size:.93em}
.sp-tab{border-collapse:collapse;font-size:.88em;min-width:100%}.sp-tab th,.sp-tab td{border-bottom:1px solid rgba(128,128,128,.3);padding:3px 8px;text-align:left;vertical-align:top}.sp-mark.ok{color:#34d399}.sp-mark.bad{color:#f87171}
.spr-code{display:block;font-family:ui-monospace,monospace;font-size:.8em;background:rgba(128,128,128,.14);border-radius:6px;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere}.spr-ladder{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.spr-ladder>div{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.spr-ladder h5{margin:0;font-size:.95em}.spr-ladder .eq-mono{font-size:.8em;opacity:.8;display:block;margin:.1em 0 .3em}.spr-ladder p{margin:0;font-size:.9em}
.spr-maplink{color:#7fb2ff}.spr-jump{background:none;border:1px solid rgba(128,128,128,.45);border-radius:6px;color:inherit;cursor:pointer;font:inherit;font-size:.78em;padding:0 6px;margin-right:4px;font-family:ui-monospace,monospace}`;

function RowView({ id, lang, t, open, toggle }) {
  const m = ROW_META[id], r = K.rows.find(x => x.id === id), tx = rowText(lang, id), L = t.labels, [cp, setCp] = useState(null), cmd = `python3 spring_selfcheck.py --row ${id}`;
  return <article className={'spr-row' + (open ? ' open' : '')} id={'spr-row-' + id} data-row={id} data-thread={m[0]} data-src={m[1]}>
    <button className="spr-row-h" aria-expanded={open} aria-controls={'spr-det-' + id} onClick={() => toggle(id)}>
      <span className="spr-id">{id}</span><span className="tag checked spr-status">{t.status.ok}</span><span className={'tag spr-src ' + (m[1] === 'ours' ? 'ours' : 'standard')}>{t.srcTag[m[1]]}</span>{CONTROLS.includes(id) && <span className="tag open spr-ctrl">{L.control}</span>}
      <span className="eq-cap"> {r.checks} {L.checks}</span><span className="spr-claim">{tx.claim}</span></button>
    {open && <div className="spr-detail" id={'spr-det-' + id}><h5>{L.how}</h5><p className="spr-inst">{tx.inst}</p>
      <h5>{L.cmd}</h5><code className="spr-code spr-cmd">{cmd}</code><button className="eq-btn spr-copy" onClick={() => copyText(cmd, ok => { setCp(ok); setTimeout(() => setCp(null), 1500); })}>{cp ? (lang === 'it' ? 'copiato' : 'copied') : (lang === 'it' ? 'copia' : 'copy')}</button></div>}</article>;
}

export default function SpringSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].s;
  const [flt, setFlt] = useState('all'), [q, setQ] = useState(''), [openIds, setOpen] = useState([]);
  const toggle = id => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const jump = id => { setFlt('all'); setQ(''); setOpen(o => (o.includes(id) ? o : [...o, id])); setTimeout(() => document.getElementById('spr-row-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 30); };
  const goThread = id => setTimeout(() => document.getElementById('spr-th-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0);
  const hay = id => { const tx = rowText(l, id); return [id, tx.claim, tx.inst, ROW_META[id][0], t.srcTag[ROW_META[id][1]]].join(' ').toLowerCase(); };
  const match = id => (flt === 'all' || ROW_META[id][0] === flt) && (!q.trim() || q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(id).includes(w)));
  const shownN = rowIds.filter(match).length, count = k => (k === 'all' ? rowIds.length : rowIds.filter(id => ROW_META[id][0] === k).length);
  const toMap = e => { e.preventDefault(); try { history.replaceState(null, '', '#map'); window.dispatchEvent(new HashChangeEvent('hashchange')); window.scrollTo?.(0, 0); } catch (err) { /* ignore */ } };
  return <section className="eq" id="eq-spring" aria-labelledby="eq-spr-h"><style>{STYLE}</style><p className="eyebrow">{stepEyebrow(l, 'eq', 'spring')}</p><h2 id="eq-spr-h">{t.title}</h2><Intro lang={l} profile={profile} id="spring" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours', 'open']} lang={l} /></div>
    <h3>{t.ladderH}</h3><div className="eq-card"><div className="spr-ladder">{t.ladder.map(x => <div key={x.k} className="spr-lens"><h5>{x.k}</h5><span className="eq-mono">{x.g}</span><p>{x.say}</p></div>)}</div><p className="eq-cap">{t.ladderCap}</p></div>
    <div className="eq-chips spr-jumps" role="group" aria-label={t.jumpLbl}>{THREADS.map((id, i) => <a key={id} href={'#spr-th-' + id} className="eq-chip spr-jumpchip" onClick={() => goThread(id)}>{i + 1}. {t.threads[id].h}</a>)}</div>
    {THREADS.map((id, i) => { const th = t.threads[id], all = rowIds.filter(r => ROW_META[r][0] === id), W = WIDGETS[id];
      return <div key={id} className="spr-th" id={'spr-th-' + id} data-thread={id}><h3>{i + 1}. {th.h}</h3><p className="spr-q">{th.q}</p><p className="spr-which"><b>{t.which}:</b> {th.which}</p>
        <div className="spr-views">{['mech', 'cube', 'alg'].map(v => <div key={v} className={'spr-view ' + v} data-view={v}><h5>{t.views[v]}</h5><p>{th[v]}</p></div>)}</div>
        <p className="eq-cap">{t.labels.sections}: {all.map(r => <button key={r} className="spr-jump" onClick={() => jump(r)}>{r}</button>)}</p>
        {W && (() => { const Comp = W[1]; return <div><h4>{t.w[W[0]].h}</h4><Comp t={t.w[W[0]]} /></div>; })()}</div>; })}
    <h3>{t.tabH}</h3><div className="eq-card" style={{ overflowX: 'auto' }}><table className="sp-tab spr-numbers"><thead><tr>{t.tabCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {Object.keys(K.cube).map(n => { const c = K.cube[n], cl = K.clifford[n]; return <tr key={n} data-n={n}><td>{n}</td><td>{c.V}</td><td>{c.E}</td><td>{c.F}</td><td>{c.betti.join(', ')}</td><td>{Object.entries(c.modes).map(([k, m]) => `${2 * k} (${m})`).join(' · ')}</td><td>{cl.frequencies_squared.replace('+-', '±')} (×{cl.multiplicity_each})</td></tr>; })}</tbody></table><p className="eq-cap">{t.tabNote}</p></div>
    <h3>{t.mxH}</h3><p>{t.mxLede}</p>
    <div className="spr-bar"><div className="eq-chips" role="group" aria-label={t.filterLbl}>{['all', ...THREADS].map(k => <button key={k} className={'eq-chip spr-flt' + (k === flt ? ' on' : '')} aria-pressed={k === flt} data-flt={k} onClick={() => setFlt(k)}>{k === 'all' ? t.all : t.threads[k].h.split(':')[0]} · {count(k)}</button>)}</div>
      <input type="search" className="spr-search" placeholder={t.searchPh} aria-label={t.searchLbl} value={q} onChange={e => setQ(e.target.value)} /><span className="eq-cap spr-count">{t.mxCount(shownN, rowIds.length)}</span></div>
    <div className="spr-matrix">{shownN ? rowIds.filter(match).map(id => <RowView key={id} id={id} lang={l} t={t} open={openIds.includes(id)} toggle={toggle} />) : <p className="eq-cap">{t.labels.nothing}</p>}</div>
    <h3>{t.openH}</h3><div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <p>{t.next} <a className="spr-maplink" href="#map" onClick={toMap}>{t.mapLink}</a></p>
    <Fold title={t.numH} open={lv >= 1}><div className="eq-card"><p><Tags kinds={['checked']} lang={l} /> {t.num}</p></div></Fold>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('spring_selfcheck.py', SPR_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('spring.json', JSON.stringify(K, null, 1), 'application/json')}>{t.dl.json}</button></div>
      <p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
