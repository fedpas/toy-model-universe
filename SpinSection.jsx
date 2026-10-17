import React, { useState, useRef } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './spinData.js';
import { SP_PY } from './spinSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { rowText, PAPER_URL, LECTURE_URL, THREADS } from './spinCopy.js';
import { uni } from './forqueTex.js';
import { stepEyebrow } from './steps.js';
import { RotorDial, LabelExplorer, LeftRight, ThreeI, MixHalves, PhaseExplorer, PointorTest, HestenesSlice } from './SpinWidgets.jsx';

// Step 11 of the equations page: the paper “From Invariant Decomposition to Spinors” and David Eelbode’s lecture “Rotors and Spinors”, woven by subject.
// Every row comes from selfcheck/spin_selfcheck.py (exact, standard library); test_spin.mjs recomputes the page’s own numbers and test_spin_ui.mjs drives the page.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const copyText = async (text, done) => { try { await navigator.clipboard.writeText(text); done(true); } catch (e) { done(false); } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const STATUS_TAG = { ok: 'checked', note: 'ours', nc: 'open' };
const statusKey = r => (r.status === 'not checked' ? 'nc' : r.status);
const WIDGETS = { reflect: ['reflect'], labels: ['labels', 'lr'], unit: ['three'], spaces: ['mix'], pointor: ['pointor', 'hest'], states: ['phase'] };
const WCOMP = { reflect: RotorDial, labels: LabelExplorer, lr: LeftRight, three: ThreeI, mix: MixHalves, pointor: PointorTest, hest: HestenesSlice, phase: PhaseExplorer };
const STYLE = `.sp-row{border:1px solid rgba(128,128,128,.35);border-radius:10px;margin:8px 0}.sp-row.open{border-color:#4aa8ff}
.sp-row-h{display:block;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:10px 12px}.sp-id{font-family:ui-monospace,monospace;font-weight:700;margin-right:8px}
.sp-ref{font-size:.8em;opacity:.8;display:block}.sp-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:6px 12px;margin-top:6px}.sp-cell b{font-size:.78em;opacity:.75;display:block;font-weight:600}
.sp-eq{display:block;font-family:ui-monospace,monospace;font-size:.82em;line-height:1.5;overflow-wrap:anywhere}.sp-row:not(.open) .sp-eq{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sp-detail{padding:2px 14px 12px;border-top:1px solid rgba(128,128,128,.25)}.sp-detail h5{margin:.9em 0 .2em;font-size:.9em;opacity:.8}.sp-detail p{margin:.2em 0}
.sp-code{display:block;font-family:ui-monospace,monospace;font-size:.8em;background:rgba(128,128,128,.14);border-radius:6px;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere}.sp-inst{font-family:ui-monospace,monospace;font-size:.82em}
.sp-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.sp-bar input[type=search]{flex:1;min-width:200px;background:none;border:1px solid rgba(128,128,128,.45);border-radius:8px;padding:5px 9px;color:inherit;font:inherit}
.sp-th{border-top:2px solid rgba(128,128,128,.3);margin-top:28px;padding-top:6px}.sp-q{font-style:italic;margin:.2em 0 .4em}.sp-which{font-size:.88em;margin:.3em 0 .6em}.sp-views{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin:8px 0}
.sp-view{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.sp-view h5{margin:.1em 0 .3em;font-size:.82em;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.sp-view p{margin:0;font-size:.92em}
.sp-view.paper{border-top:3px solid #60a5fa}.sp-view.lecture{border-top:3px solid #f472b6}.sp-view.ours{border-top:3px solid #fbbf24}
.sp-jump{background:none;border:1px solid rgba(128,128,128,.45);border-radius:6px;color:inherit;cursor:pointer;font:inherit;font-size:.78em;padding:0 6px;margin-right:4px;font-family:ui-monospace,monospace}
.sp-ladder{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.sp-ladder>div{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 12px}.sp-ladder h5{margin:0;font-size:.95em}.sp-ladder .eq-mono{font-size:.8em;opacity:.8;display:block;margin:.1em 0 .3em}.sp-ladder p{margin:0;font-size:.9em}
.sp-w h5{margin:.9em 0 .2em}.sp-sl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}.sp-sl input{flex:1;min-width:140px}.sp-out{margin:.35em 0;font-size:.93em}.sp-pair{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:4px 0}
.sp-tab{border-collapse:collapse;font-size:.88em;min-width:100%}.sp-tab th,.sp-tab td{border-bottom:1px solid rgba(128,128,128,.3);padding:3px 8px;text-align:left;vertical-align:top}
.sp-blade{background:none;border:1px solid rgba(128,128,128,.35);border-radius:6px;color:inherit;cursor:pointer;font-family:ui-monospace,monospace;font-size:.78em;padding:0 5px;margin:1px 3px 1px 0}.sp-blade.on,.sp-class.on{background:rgba(80,170,255,.2)}.sp-class.sp-H td{font-weight:600}
.eq-pt p{min-width:0;overflow-wrap:anywhere}.sp-mark.ok{color:#34d399}.sp-mark.bad{color:#f87171}.sp-auth li{margin:.6em 0}`;

function RowView({ r, lang, lv, t, open, toggle }) {
  const tx = rowText(lang, r), L = t.labels, [cp, setCp] = useState(null), sk = statusKey(r), cmd = `python3 spin_selfcheck.py --row ${r.id}`;
  return <article className={'sp-row' + (open ? ' open' : '')} id={'sp-row-' + r.id} data-row={r.id} data-status={sk} data-src={r.src} data-thread={r.thread}>
    <button className="sp-row-h" aria-expanded={open} aria-controls={'sp-det-' + r.id} onClick={() => toggle(r.id)}>
      <span className="sp-id">{r.id}</span><span className={'tag sp-status ' + STATUS_TAG[sk]}>{t.status[sk]}</span><span className="tag standard sp-src">{L.src[r.src]}</span>
      <span className="sp-cols">
        {r.paper && <span className="sp-cell sp-cell-paper"><b>{L.paper}</b><span className="sp-ref">{tx.pref}{r.paper.page ? ` · ${L.page} ${r.paper.page}` : ''}</span>{r.paper.tex && <span className="sp-eq sp-eq-paper">{uni(r.paper.tex)}</span>}</span>}
        {r.lecture && <span className="sp-cell sp-cell-lecture"><b>{L.lecture}</b><span className="sp-ref">{tx.lref}</span>{r.lecture.tex && <span className="sp-eq sp-eq-lecture">{uni(r.lecture.tex)}</span>}</span>}
        {sk !== 'nc' ? <span className="sp-cell sp-cell-ours"><b>{L.ours}</b><span className="sp-eq sp-eq-ours">{uni(r.ours)}</span></span>
          : <span className="sp-cell sp-cell-ours"><b>{L.ours}</b><span className="sp-eq sp-eq-text">{tx.text}</span></span>}
      </span></button>
    {open && <div className="sp-detail" id={'sp-det-' + r.id}>
      {r.worked && <><h5>{L.worked}</h5><p className="sp-inst sp-worked">{tx.inst}: {L.lhs} = {r.worked.lhs} · {L.rhs} = {r.worked.rhs} · {r.worked.lhs === r.worked.rhs ? '✓ ' + L.equal : '·'}</p></>}
      {tx.how && <><h5>{L.how}</h5><p className="sp-how">{tx.how}</p></>}
      {tx.note && <><h5>{L.note}</h5><p className="sp-note">{tx.note}</p></>}
      {tx.remark && <><h5>{L.remark}</h5><p className="sp-remark">{tx.remark}</p></>}
      {r.code && <><h5>{L.code} <span className="eq-cap">({L.callNote})</span></h5><code className="sp-code sp-codeline">{r.code}</code>
        <button className="eq-btn sp-copy" onClick={() => copyText(r.code, ok => { setCp(ok); setTimeout(() => setCp(null), 1500); })}>{cp ? L.copied : L.copy}</button></>}
      <h5>{L.cmd}</h5><code className="sp-code sp-cmd">{cmd}</code>
    </div>}</article>;
}

const notesMd = (lang, t) => {
  const lines = [`# ${t.notesHead}`, '', t.notesIntro, ''];
  for (const f of K.spm.findings) { const r = K.spm.rows.find(x => x.id === f.id), tx = rowText(lang, r), body = f.kind === 'slip' ? tx.note : tx.remark; lines.push(`- **${f.id}** (${t.notesRow}; ${tx.pref || tx.lref}): ${body}`); }
  lines.push('', PAPER_URL, '', LECTURE_URL, '');
  return lines.join('\n');
};

export default function SpinSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].s, rows = K.spm.rows, C = K.spm.counts;
  const [flt, setFlt] = useState('all'), [sflt, setSflt] = useState('all'), [q, setQ] = useState(''), [openIds, setOpen] = useState([]), top = useRef(null);
  const toggle = id => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const jump = id => { setFlt('all'); setSflt('all'); setQ(''); setOpen(o => (o.includes(id) ? o : [...o, id])); setTimeout(() => document.getElementById('sp-row-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 30); };
  const goThread = id => setTimeout(() => document.getElementById('sp-th-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0);
  const hay = r => { const tx = rowText(l, r), sk = statusKey(r); return [r.id, tx.pref, tx.lref, t.status[sk], t.labels.src[r.src], r.paper?.tex ? uni(r.paper.tex) : '', r.lecture?.tex ? uni(r.lecture.tex) : '', sk === 'nc' ? tx.text : uni(r.ours), tx.how, tx.note, tx.remark].join(' ').toLowerCase(); };
  const match = r => (flt === 'all' || statusKey(r) === flt) && (sflt === 'all' || r.src === sflt) && (!q.trim() || q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(r).includes(w)));
  const shownN = rows.filter(match).length;
  const count = k => (k === 'all' ? rows.length : rows.filter(r => statusKey(r) === k).length), scount = k => (k === 'all' ? rows.length : rows.filter(r => r.src === k).length);
  return <section className="eq" id="eq-spin" aria-labelledby="eq-sp-h"><style>{STYLE}</style><p className="eyebrow">{stepEyebrow(l, 'eq', 'spin')}</p><h2 id="eq-sp-h">{t.title}</h2><Intro lang={l} profile={profile} id="spin" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours', 'open']} lang={l} /></div>
    <h3>{t.srcH}</h3><div className="sp-views sp-sources">
      <div className="sp-view paper"><h5>{t.srcPaper}</h5><p>{t.srcPaperText}</p><p><a className="sp-paper-link" href={PAPER_URL} target="_blank" rel="noreferrer noopener">{t.srcLinks[0]}</a></p></div>
      <div className="sp-view lecture"><h5>{t.srcLecture}</h5><p>{t.srcLectureText}</p><p><a className="sp-lecture-link" href={LECTURE_URL} target="_blank" rel="noreferrer noopener">{t.srcLinks[1]}</a></p></div></div>
    <p className="eq-cap">{t.weave}</p>
    <h3>{t.ladderH}</h3><div className="eq-card"><div className="sp-ladder">{t.ladder.map(x => <div key={x.k} className="sp-kind"><h5>{x.k}</h5><span className="eq-mono">{x.g}</span><p>{x.say}</p></div>)}</div><p className="eq-cap">{t.ladderCap}</p></div>
    <div className="eq-chips sp-jumps" role="group" aria-label={t.jumpLbl}>{THREADS.map((id, i) => <a key={id} href={'#sp-th-' + id} className="eq-chip sp-jumpchip" onClick={() => goThread(id)}>{i + 1}. {t.threads[id].h}</a>)}</div>
    <h3 ref={top}>{t.mxH}</h3><p>{t.mxLede}</p>
    <div className="sp-bar"><div className="eq-chips" role="group" aria-label={t.filterLbl}>{['all', 'ok', 'note', 'nc'].map(k => <button key={k} className={'eq-chip sp-flt' + (k === flt ? ' on' : '')} aria-pressed={k === flt} data-flt={k} onClick={() => setFlt(k)}>{t.filters[k]} · {count(k)}</button>)}</div>
      <div className="eq-chips" role="group" aria-label={t.srcFilterLbl}>{['all', 'paper', 'lecture', 'both', 'ours'].map(k => <button key={k} className={'eq-chip sp-sflt' + (k === sflt ? ' on' : '')} aria-pressed={k === sflt} data-sflt={k} onClick={() => setSflt(k)}>{t.srcFilters[k]} · {scount(k)}</button>)}</div>
      <input type="search" className="sp-search" placeholder={t.searchPh} aria-label={t.searchLbl} value={q} onChange={e => setQ(e.target.value)} /><span className="eq-cap sp-count">{t.mxCount(shownN, rows.length)}</span></div>
    {THREADS.map((id, i) => { const th = t.threads[id], all = rows.filter(r => r.thread === id), shown = all.filter(match);
      return <div key={id} className="sp-th" id={'sp-th-' + id} data-thread={id}><h3>{i + 1}. {th.h}</h3><p className="sp-q">{th.q}</p><p className="sp-which"><b>{t.which}:</b> {th.which}</p>
        <div className="sp-views">{['paper', 'lecture', 'ours'].map(v => <div key={v} className={'sp-view ' + v} data-view={v}><h5>{t.views[v]}</h5><p>{th[v]}</p></div>)}</div>
        <p className="eq-cap">{t.labels.sections}: {all.map(r => <button key={r.id} className="sp-jump" onClick={() => jump(r.id)}>{r.id}</button>)}</p>
        <div className="sp-matrix">{shown.length ? shown.map(r => <RowView key={r.id} r={r} lang={l} lv={lv} t={t} open={openIds.includes(r.id)} toggle={toggle} />) : <p className="eq-cap">{t.labels.nothing}</p>}</div>
        {WIDGETS[id].map(w => { const W = WCOMP[w]; return <div key={w}><h4>{t.w[w].h}</h4><W t={t.w[w]} /></div>; })}</div>; })}
    <Fold title={t.convH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><p className="eq-cap">{t.convLede}</p><table className="sp-tab sp-conv"><thead><tr>{t.convCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{t.conv.map((c, i) => <tr key={i}><td className="eq-mono">{c.theirs}</td><td className="eq-mono">{c.ours}</td><td>{c.note}</td></tr>)}</tbody></table></div></Fold>
    <h3>{t.authH}</h3><div className="eq-card sp-auth"><p>{t.authLede}</p><ul>{K.spm.findings.map(f => { const r = rows.find(x => x.id === f.id), tx = rowText(l, r); return <li key={f.id + f.kind} className="sp-finding" data-row={f.id}><button className="sp-jump" onClick={() => jump(f.id)} title={t.authGo}>{f.id}</button><span className="eq-cap">{tx.pref || tx.lref} · </span><span className={'tag ' + (f.kind === 'slip' ? 'ours' : 'standard')}>{t.authKind[f.kind]}</span> {f.kind === 'slip' ? tx.note : tx.remark}</li>; })}</ul>
      <button className="eq-btn" onClick={() => download('spin_notes_for_authors.md', notesMd(l, t), 'text/markdown')}>{t.dl.notes}</button></div>
    <Fold title={t.numH} open={lv >= 1}><div className="eq-card"><p><Tags kinds={['checked']} lang={l} /> {t.num}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('spin_selfcheck.py', SP_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('spin.json', JSON.stringify({ ...K.sp, matrix: K.spm }, null, 1), 'application/json')}>{t.dl.json}</button></div>
      <p className="eq-mono eq-cap">{t.dl.cmd}</p><p>{t.dl.link}: <a className="sp-paper-link2" href={PAPER_URL} target="_blank" rel="noreferrer noopener">{t.dl.linkText}</a></p><p>{t.dl.lectureLink}: <a className="sp-lecture-link2" href={LECTURE_URL} target="_blank" rel="noreferrer noopener">{t.dl.lectureText}</a></p></Fold></section>;
}
