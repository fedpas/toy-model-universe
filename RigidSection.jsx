import React, { useState } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './pgadynData.js';
import FIXTURE from './ganjaFixtureData.js';
import { PGA_PY } from './pgadynSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { THREADS, ROW_META, CONTROLS, STATUS, rowText, rowIds } from './rigidCopy.js';
import { stepEyebrow } from './steps.js';
import { SegmentSpring, SquareFree, LabelledBody, FrameTable } from './RigidWidgets.jsx';
import { HangIt, FreeTop, Orbits } from './RigidWidgets2.jsx';

// Step 13 of the equations page: a rigid body in the bit-rule algebra, from the segment to the tesseract, then the free top, the Moon and the planets.
// Every row comes from selfcheck/pgadyn_selfcheck.py (exact, standard library; the reference rows read ganja_fixture.json); test_pgadyn.mjs recomputes the page’s own numbers
// and test_pgadyn_ui.mjs drives the page. The speed of the labels is timed by selfcheck/bench_labels.mjs and is not part of the proof.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const copyText = async (text, done) => { try { await navigator.clipboard.writeText(text); done(true); } catch (e) { done(false); } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const WIDGETS = { segment: ['seg', SegmentSpring], square: ['sq', SquareFree], cube: ['lab', LabelledBody], hang: ['hang', HangIt], frame: ['table', FrameTable], top: ['top', FreeTop], orbits: ['orb', Orbits] };
const STYLE = `.rg-row{border:1px solid rgba(128,128,128,.35);border-radius:10px;margin:8px 0}.rg-row.open{border-color:#4aa8ff}
.rg-row-h{display:block;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:10px 12px}.rg-id{font-family:ui-monospace,monospace;font-weight:700;margin-right:8px}
.rg-claim{display:block;margin-top:4px;overflow-wrap:anywhere}.rg-detail{padding:2px 14px 12px;border-top:1px solid rgba(128,128,128,.25)}.rg-detail h5{margin:.9em 0 .2em;font-size:.9em;opacity:.8}.rg-detail p{margin:.2em 0}
.rg-th{border-top:2px solid rgba(128,128,128,.3);margin-top:28px;padding-top:6px}.rg-q{font-style:italic;margin:.2em 0 .4em}.rg-which{font-size:.88em;margin:.3em 0 .6em}
.rg-views{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin:8px 0}.rg-view{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.rg-view h5{margin:.1em 0 .3em;font-size:.82em;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.rg-view p{margin:0;font-size:.92em}
.rg-view.mech{border-top:3px solid #60a5fa}.rg-view.cube{border-top:3px solid #34d399}.rg-view.alg{border-top:3px solid #fbbf24}
.rg-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.rg-bar input[type=search]{flex:1;min-width:200px;background:none;border:1px solid rgba(128,128,128,.45);border-radius:8px;padding:5px 9px;color:inherit;font:inherit}
.sp-w .rg-svg,.sp-w .rg-svg2{max-width:560px;display:block;margin:6px auto}.rg-w-lab .eq-chips,.rg-w-hang .eq-chips{margin:6px 0}.rg-short{color:#f87171;font-weight:700}
.sp-w h5{margin:.9em 0 .2em}.sp-sl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}.sp-sl input{flex:1;min-width:140px}.sp-out{margin:.35em 0;font-size:.93em}
.sp-tab{border-collapse:collapse;font-size:.88em;min-width:100%}.sp-tab th,.sp-tab td{border-bottom:1px solid rgba(128,128,128,.3);padding:3px 8px;text-align:left;vertical-align:top}.sp-tab tr.on td{background:rgba(74,168,255,.12)}.sp-mark.ok{color:#34d399}.sp-mark.bad{color:#f87171}
.rg-code{display:block;font-family:ui-monospace,monospace;font-size:.8em;background:rgba(128,128,128,.14);border-radius:6px;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere}.rg-ladder{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.rg-ladder>div{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.rg-ladder h5{margin:0;font-size:.95em}.rg-ladder .eq-mono{font-size:.8em;opacity:.8;display:block;margin:.1em 0 .3em}.rg-ladder p{margin:0;font-size:.9em}
.rg-maplink{color:#7fb2ff}.rg-jump{background:none;border:1px solid rgba(128,128,128,.45);border-radius:6px;color:inherit;cursor:pointer;font:inherit;font-size:.78em;padding:3px 8px;min-height:26px;margin:2px 4px 2px 0;font-family:ui-monospace,monospace}`;

function RowView({ id, lang, t, open, toggle }) {
  const m = ROW_META[id], r = K.rows.find(x => x.id === id), tx = rowText(lang, id), L = t.labels, [cp, setCp] = useState(null), cmd = `python3 pgadyn_selfcheck.py --row ${id}`, st = STATUS[id] || 'ok';
  return <article className={'rg-row' + (open ? ' open' : '')} id={'rg-row-' + id} data-row={id} data-thread={m[0]} data-src={m[1]} data-status={st}>
    <button className="rg-row-h" aria-expanded={open} aria-controls={'rg-det-' + id} onClick={() => toggle(id)}>
      <span className="rg-id">{id}</span><span className={'tag rg-status ' + (st === 'ok' ? 'checked' : 'open')}>{t.status[st]}</span><span className={'tag rg-src ' + (m[1] === 'ours' ? 'ours' : 'standard')}>{t.srcTag[m[1]]}</span>{CONTROLS.includes(id) && <span className="tag open rg-ctrl">{L.control}</span>}
      <span className="eq-cap"> {r.checks} {L.checks}</span><span className="rg-claim">{tx.claim}</span></button>
    {open && <div className="rg-detail" id={'rg-det-' + id}><h5>{L.how}</h5><p className="rg-inst">{tx.inst}</p>
      <h5>{L.cmd}</h5><code className="rg-code rg-cmd">{cmd}</code><button className="eq-btn rg-copy" onClick={() => copyText(cmd, ok => { setCp(ok); setTimeout(() => setCp(null), 1500); })}>{cp ? (lang === 'it' ? 'copiato' : 'copied') : (lang === 'it' ? 'copia' : 'copy')}</button></div>}</article>;
}

export default function RigidSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].s;
  const [flt, setFlt] = useState('all'), [q, setQ] = useState(''), [openIds, setOpen] = useState([]);
  const toggle = id => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const jump = id => { setFlt('all'); setQ(''); setOpen(o => (o.includes(id) ? o : [...o, id])); setTimeout(() => document.getElementById('rg-row-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 30); };
  const goThread = id => setTimeout(() => document.getElementById('rg-th-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0);
  const hay = id => { const tx = rowText(l, id); return [id, tx.claim, tx.inst, ROW_META[id][0], t.srcTag[ROW_META[id][1]]].join(' ').toLowerCase(); };
  const match = id => (flt === 'all' || ROW_META[id][0] === flt) && (!q.trim() || q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(id).includes(w)));
  const shownN = rowIds.filter(match).length, count = k => (k === 'all' ? rowIds.length : rowIds.filter(id => ROW_META[id][0] === k).length);
  const toMap = e => { e.preventDefault(); try { history.replaceState(null, '', '#map'); window.dispatchEvent(new HashChangeEvent('hashchange')); window.scrollTo?.(0, 0); } catch (err) { /* ignore */ } };
  return <section className="eq" id="eq-rigid" aria-labelledby="eq-rg-h"><style>{STYLE}</style><p className="eyebrow">{stepEyebrow(l, 'eq', 'rigid')}</p><h2 id="eq-rg-h">{t.title}</h2><Intro lang={l} profile={profile} id="rigid" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours', 'open']} lang={l} /></div>
    <h3>{t.ladderH}</h3><div className="eq-card"><div className="rg-ladder">{t.ladder.map(x => <div key={x.k} className="rg-lens"><h5>{x.k}</h5><span className="eq-mono">{x.g}</span><p>{x.say}</p></div>)}</div><p className="eq-cap">{t.ladderCap}</p></div>
    <div className="eq-chips rg-jumps" role="group" aria-label={t.jumpLbl}>{THREADS.map((id, i) => <a key={id} href={'#rg-th-' + id} className="eq-chip rg-jumpchip" onClick={() => goThread(id)}>{i + 1}. {t.threads[id].h.split(':')[0]}</a>)}</div>
    {THREADS.map((id, i) => { const th = t.threads[id], all = rowIds.filter(r => ROW_META[r][0] === id), W = WIDGETS[id];
      return <div key={id} className="rg-th" id={'rg-th-' + id} data-thread={id}><h3>{i + 1}. {th.h}</h3><p className="rg-q">{th.q}</p><p className="rg-which"><b>{t.which}:</b> {th.which}</p>
        <div className="rg-views">{['mech', 'cube', 'alg'].map(v => <div key={v} className={'rg-view ' + v} data-view={v}><h5>{t.views[v]}</h5><p>{th[v]}</p></div>)}</div>
        <p className="eq-cap">{t.labels.sections}: {all.map(r => <button key={r} className="rg-jump" onClick={() => jump(r)}>{r}</button>)}</p>
        {W && (() => { const Comp = W[1]; return <div><h4>{t.w[W[0]].h}</h4><Comp t={t.w[W[0]]} /></div>; })()}</div>; })}
    <h3>{t.mxH}</h3><p>{t.mxLede}</p>
    <div className="rg-bar"><div className="eq-chips" role="group" aria-label={t.filterLbl}>{['all', ...THREADS].map(k => <button key={k} className={'eq-chip rg-flt' + (k === flt ? ' on' : '')} aria-pressed={k === flt} data-flt={k} onClick={() => setFlt(k)}>{k === 'all' ? t.all : t.threads[k].h.split(':')[0]} · {count(k)}</button>)}</div>
      <input type="search" className="rg-search" placeholder={t.searchPh} aria-label={t.searchLbl} value={q} onChange={e => setQ(e.target.value)} /><span className="eq-cap rg-count">{t.mxCount(shownN, rowIds.length)}</span></div>
    <div className="rg-matrix">{shownN ? rowIds.filter(match).map(id => <RowView key={id} id={id} lang={l} t={t} open={openIds.includes(id)} toggle={toggle} />) : <p className="eq-cap">{t.labels.nothing}</p>}</div>
    <h3>{t.openH}</h3><div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <p>{t.next} <a className="rg-maplink" href="#map" onClick={toMap}>{t.mapLink}</a></p>
    <Fold title={t.numH} open={lv >= 1}><div className="eq-card"><p><Tags kinds={['checked']} lang={l} /> {t.num}</p></div></Fold>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('pgadyn_selfcheck.py', PGA_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('pgadyn.json', JSON.stringify(K, null, 1), 'application/json')}>{t.dl.json}</button><button className="eq-btn" onClick={() => download('ganja_fixture.json', JSON.stringify(FIXTURE, null, 1), 'application/json')}>{t.dl.fixture}</button></div>
      <p className="eq-mono eq-cap">{t.dl.cmd}</p></Fold></section>;
}
