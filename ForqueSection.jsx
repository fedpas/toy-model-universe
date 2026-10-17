import React, { useState, useMemo, useRef } from 'react';
import { Fold, Intro, level } from './Fold.jsx';
import K from './forqueData.js';
import { FQ_PY, FQM_PY } from './forqueSelfcheckSource.js';
import { STORY } from './storyCopy.js';
import COPY, { rowText, convText, PAPER_URL } from './forqueCopy.js';
import { uni } from './forqueTex.js';
import { simulate } from './forquePhysics.js';
import { stepEyebrow } from './steps.js';

// Step 10 of the equations page: Dorst and De Keninck's Forque dynamics on the bit rule, with a translation matrix of the paper's equations.
// Every row comes from selfcheck/forque_selfcheck.py (exact, standard library); selfcheck/forque_matrix_check.py is the numpy cross-check; test_forque.mjs recomputes the page's own numbers.
const download = (name, text, type) => { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } };
const copyText = async (text, done) => { try { await navigator.clipboard.writeText(text); done(true); } catch (e) { done(false); } };
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const STATUS_TAG = { ok: 'checked', note: 'ours', nc: 'open' };
const statusKey = r => (r.status === 'not checked' ? 'nc' : r.status);
const STYLE = `.fq-row{border:1px solid rgba(128,128,128,.35);border-radius:10px;margin:8px 0;padding:0}.fq-row.open{border-color:#4aa8ff}
.fq-row-h{display:grid;grid-template-columns:3.2em 1fr;gap:4px 10px;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:10px 12px}
.fq-id{font-family:ui-monospace,monospace;font-weight:700}.fq-ref{font-size:.82em;opacity:.8}.fq-eqs{grid-column:2}
.fq-eqs{display:block}.fq-eq{display:block;font-family:ui-monospace,monospace;font-size:.82em;line-height:1.5;overflow-wrap:anywhere;margin:2px 0}.fq-eq b{font-family:inherit;opacity:.7;font-weight:600;margin-right:6px}
.fq-row:not(.open) .fq-eq{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fq-detail{padding:2px 14px 12px 14px;border-top:1px solid rgba(128,128,128,.25)}.fq-detail h5{margin:.9em 0 .2em;font-size:.9em;opacity:.8}.fq-detail p{margin:.2em 0}
.fq-code{display:block;font-family:ui-monospace,monospace;font-size:.8em;background:rgba(128,128,128,.14);border-radius:6px;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere}
.fq-inst{font-family:ui-monospace,monospace;font-size:.82em}.fq-pre{font-size:.75em;max-height:240px;overflow:auto;background:rgba(128,128,128,.12);padding:6px;border-radius:6px}
.fq-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.fq-bar input[type=search]{flex:1;min-width:200px;background:none;border:1px solid rgba(128,128,128,.45);border-radius:8px;padding:5px 9px;color:inherit;font:inherit}
.fq-line{border-left:3px solid #fbbf24;padding:2px 0 2px 12px;margin:12px 0}.fq-line .fq-eq{font-size:.95em}.fq-jump{background:none;border:1px solid rgba(128,128,128,.45);border-radius:6px;color:inherit;cursor:pointer;font:inherit;font-size:.78em;padding:0 6px;margin-right:4px;font-family:ui-monospace,monospace}
.fq-auth li{margin:.6em 0}.fq-sl{display:flex;gap:14px;flex-wrap:wrap}.fq-sl label{display:flex;gap:6px;align-items:center;font-size:.9em}`;

function Racket({ t }) {
  const [I, setI] = useState([5, 3, 1]);
  const r = useMemo(() => simulate(I), [I]);
  const W = 400, H = 150, X = s => 8 + (W - 16) * s / r.T, Y = v => H / 2 - (H / 2 - 10) * Math.max(-1.25, Math.min(1.25, v)) / 1.25, col = ['#fbbf24', '#60a5fa', '#34d399'];
  return <div className="eq-card"><p>{t.racketLede}</p>
    <div className="fq-sl" role="group">{t.racketSl.map((nm, i) => <label key={i}>{nm}<input type="range" className="fq-slider" min="1" max="10" step="0.5" value={I[i]} aria-label={nm} onChange={e => setI(I.map((x, j) => (j === i ? +e.target.value : x)))} /><span className="eq-mono">{I[i]}</span></label>)}</div>
    <svg className="eq-svg fq-plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.racketCap}><line x1="8" y1={H / 2} x2={W - 8} y2={H / 2} stroke="currentColor" opacity=".3" />
      {[0, 1, 2].map(c => <polyline key={c} fill="none" stroke={col[c]} strokeWidth="1.6" points={r.ts.map((tt, i) => `${X(tt).toFixed(1)},${Y(r.ws[i][c]).toFixed(1)}`).join(' ')} />)}</svg>
    <p className="eq-cap">{t.racketCap}</p>{t.racketOut(r).map((x, i) => <p key={i} className="fq-racket-out">{x}</p>)}</div>;
}

function RowView({ r, lang, lv, t, open, toggle }) {
  const tx = rowText(lang, r), L = t.labels, [cp, setCp] = useState(null), sk = statusKey(r);
  const cmd = `python3 forque_selfcheck.py --row ${r.id}`;
  return <article className={'fq-row' + (open ? ' open' : '')} id={'fq-row-' + r.id} data-row={r.id} data-status={sk}>
    <button className="fq-row-h" aria-expanded={open} aria-controls={'fq-det-' + r.id} onClick={() => toggle(r.id)}>
      <span className="fq-id">{r.id}</span><span><span className="fq-ref">{r.ref}</span> <span className={'tag fq-status ' + STATUS_TAG[sk]}>{t.status[sk]}</span></span>
      {sk !== 'nc' && <span className="fq-eqs"><span className="fq-eq fq-eq-paper"><b>{L.paper}</b>{uni(r.paper)}</span><span className="fq-eq fq-eq-ours"><b>{L.ours}</b>{uni(r.ours)}</span></span>}
      {sk === 'nc' && <span className="fq-eqs"><span className="fq-eq fq-eq-paper"><b>{L.paper}</b>{tx.paper}</span><span className="fq-eq fq-eq-note">{tx.note}</span></span>}
    </button>
    {open && <div className="fq-detail" id={'fq-det-' + r.id}>
      {r.worked && <><h5>{L.worked}</h5><p className="fq-inst fq-worked">d = {r.worked.d}: {L.lhs} = {r.worked.lhs} · {L.rhs} = {r.worked.rhs} · {r.worked.lhs === r.worked.rhs ? '✓ ' + L.equal : '✗'}</p></>}
      {tx.how && <><h5>{L.how}</h5><p className="fq-how">{tx.how}</p></>}
      {tx.note && <><h5>{L.note}</h5><p className="fq-note">{tx.note}</p></>}
      {tx.remark && <><h5>{L.remark}</h5><p className="fq-remark">{tx.remark}</p></>}
      {r.dims.length > 0 && <p className="eq-cap">{L.dims}: {r.dims.join(', ')} · {L.page} {r.page}</p>}
      {r.code && <><h5>{L.code} <span className="eq-cap">({r.code_kind === 'call' ? L.callNote : L.exprNote})</span></h5><code className="fq-code fq-codeline">{r.code}</code>
        <button className="eq-btn fq-copy" onClick={() => copyText(r.code, ok => { setCp(ok); setTimeout(() => setCp(null), 1500); })}>{cp ? L.copied : L.copy}</button></>}
      <h5>{L.cmd}</h5><code className="fq-code fq-cmd">{cmd}</code>
      {r.extra && <Fold nested title={L.extra} open={lv >= 2}><pre className="fq-pre">{JSON.stringify(r.extra, null, 1)}</pre></Fold>}
    </div>}</article>;
}

const notesMd = (lang, t) => {
  const lines = [`# ${t.notesHead}`, '', t.notesIntro, ''];
  for (const f of K.fq.findings) { const r = K.fq.rows.find(x => x.id === f.id), tx = rowText(lang, r), body = f.kind === 'slip' ? tx.note : tx.remark; lines.push(`- **${f.id}** (${t.notesRow}; ${f.ref}): ${body}`); }
  lines.push('', `${PAPER_URL}`, '');
  return lines.join('\n');
};

export default function ForqueSection({ lang = 'en', profile = 'Young Learner' }) {
  const lv = level(profile), l = COPY[lang] ? lang : 'en', t = COPY[l].f, rows = K.fq.rows, C = K.fq.counts;
  const [flt, setFlt] = useState('all'), [q, setQ] = useState(''), [openIds, setOpen] = useState([]), top = useRef(null);
  const toggle = id => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const jump = id => { setFlt('all'); setQ(''); setOpen(o => (o.includes(id) ? o : [...o, id])); setTimeout(() => document.getElementById('fq-row-' + id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 30); };
  const hay = r => { const tx = rowText(l, r), nc = statusKey(r) === 'nc'; return [r.id, r.ref, 'p.' + r.page, t.status[statusKey(r)], nc ? tx.paper : uni(r.paper), nc ? '' : uni(r.ours), tx.how, tx.note, tx.remark].join(' ').toLowerCase(); };
  const shown = rows.filter(r => (flt === 'all' || statusKey(r) === flt) && (!q.trim() || q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay(r).includes(w))));
  const count = k => (k === 'all' ? rows.length : rows.filter(r => statusKey(r) === k).length);
  return <section className="eq" id="eq-forque" aria-labelledby="eq-fq-h"><style>{STYLE}</style><p className="eyebrow">{stepEyebrow(l, 'eq', 'forque')}</p><h2 id="eq-fq-h">{t.title}</h2><Intro lang={l} profile={profile} id="forque" lede={t.lede} />
    <div><Tags kinds={['checked', 'standard', 'ours', 'open']} lang={l} /></div>
    <h3>{t.linesH}</h3><div className="eq-card"><p className="eq-cap">{t.linesCap}</p>
      {t.lines.map(x => <div key={x.h} className="fq-line"><h4>{x.h}</h4><div className="fq-eq fq-line-tex">{uni(x.tex)}</div><p>{x.say}</p><p>{x.rows.map(id => <button key={id} className="fq-jump" onClick={() => jump(id)}>{id}</button>)}</p></div>)}</div>
    <h3 ref={top}>{t.mxH}</h3><p>{t.mxLede}</p>
    <div className="fq-bar"><div className="eq-chips" role="group" aria-label={t.filterLbl}>{['all', 'ok', 'note', 'nc'].map(k => <button key={k} className={'eq-chip fq-flt' + (k === flt ? ' on' : '')} aria-pressed={k === flt} data-flt={k} onClick={() => setFlt(k)}>{t.filters[k]} · {count(k)}</button>)}</div>
      <input type="search" className="fq-search" placeholder={t.searchPh} aria-label={t.searchLbl} value={q} onChange={e => setQ(e.target.value)} /><span className="eq-cap fq-count">{t.mxCount(shown.length, rows.length)}</span></div>
    <div className="fq-matrix">{shown.length ? shown.map(r => <RowView key={r.id} r={r} lang={l} lv={lv} t={t} open={openIds.includes(r.id)} toggle={toggle} />) : <p className="eq-cap">{t.labels.nothing}</p>}</div>
    <Fold title={t.convH} open={lv >= 2}><div className="eq-card" style={{ overflowX: 'auto' }}><p className="eq-cap">{t.convLede}</p><table className="fq-conv"><thead><tr>{t.convCols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{K.fq.conventions.map((c, i) => { const v = convText(l, c, i); return <tr key={i}><td className="eq-mono">{v.theirs}</td><td className="eq-mono">{v.ours}</td><td>{v.note}</td></tr>; })}</tbody></table></div></Fold>
    <h3>{t.authH}</h3><div className="eq-card fq-auth"><p>{t.authLede}</p><ul>{K.fq.findings.map(f => { const r = rows.find(x => x.id === f.id), tx = rowText(l, r); return <li key={f.id + f.kind} className="fq-finding" data-row={f.id}><button className="fq-jump" onClick={() => jump(f.id)} title={t.authGo}>{f.id}</button><span className="eq-cap">{f.ref} · </span><span className={'tag ' + (f.kind === 'slip' ? 'ours' : 'standard')}>{t.authKind[f.kind]}</span> {f.kind === 'slip' ? tx.note : tx.remark}</li>; })}</ul>
      <button className="eq-btn" onClick={() => download('forque_notes_for_authors.md', notesMd(l, t), 'text/markdown')}>{t.dl.notes}</button></div>
    <h3>{t.racketH}</h3><Racket t={t} />
    <Fold title={t.numH} open={lv >= 1}><div className="eq-card"><p><Tags kinds={['checked']} lang={l} /> {t.num}</p><p className="eq-cap">{t.atlasH}: {t.atlas}</p></div></Fold>
    <div>{t.open.map(([k, txt], i) => <div key={i} className="eq-pt"><div style={{ minWidth: 92 }}><Tags kinds={[k]} lang={l} /></div><p>{txt}</p></div>)}</div>
    <Fold title={t.dl.h} open={lv >= 2}><p>{t.dl.text}</p><div><button className="eq-btn" onClick={() => download('forque_selfcheck.py', FQ_PY, 'text/x-python')}>{t.dl.py}</button><button className="eq-btn" onClick={() => download('forque_matrix_check.py', FQM_PY, 'text/x-python')}>{t.dl.py2}</button><button className="eq-btn" onClick={() => download('forque.json', JSON.stringify(K.fq, null, 1), 'application/json')}>{t.dl.json}</button><button className="eq-btn" onClick={() => download('forque_matrix.json', JSON.stringify(K.fqm, null, 1), 'application/json')}>forque_matrix.json</button></div>
      <p className="eq-mono eq-cap">{t.dl.cmd}</p><p>{t.dl.link}: <a className="fq-paper-link" href={PAPER_URL} target="_blank" rel="noreferrer noopener">{t.dl.linkText}</a></p></Fold></section>;
}
