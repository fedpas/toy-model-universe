import React, { useState, useMemo } from 'react';
import { STORY } from './storyCopy.js';
import { TREE, LENSES, MTHREADS, RESEARCH, flat } from './mapData.js';
import { MAP, NODES, LENS_NAMES, THREAD_NAMES, THREAD_TEXT, RESEARCH_TEXT, CREDIT_URL } from './mapCopy.js';
import { plainLevels, signedLevels } from './springEngine.js';

// The Map page: status, the tree of knowledge (every branch links to its place in the app and names its script), the researchers’ table, the spring, the next steps and the credit.
// Counts are read from the data files of the pages they describe; test_map.mjs compares the tree with the app and the scripts with the selfcheck folder.
export const CubeMark = ({ size = 16 }) => <svg className="cube-mark" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ verticalAlign: '-3px' }}><g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><rect x="1.5" y="5.5" width="8.5" height="8.5" /><rect x="6" y="1.5" width="8.5" height="8.5" opacity=".6" /><path d="M1.5 5.5 6 1.5M10 5.5l4.5-4M10 14l4.5-4M1.5 14 6 10" opacity=".6" /></g></svg>;
const Tags = ({ kinds, lang }) => <>{kinds.map(k => <span key={k} className={'tag ' + k} title={STORY[lang].tagHelp[k]}>{STORY[lang].tags[k]}</span>)}</>;
const POS = '#60a5fa', NEG = '#fbbf24';
const STYLE = `.map .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.map .stat{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:10px 12px;min-width:0}.map .stat b{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums}.map .stat span{font-size:.85em;opacity:.8;overflow-wrap:anywhere}
.map ul.plain,.map ol.plain{margin:.4em 0;padding-left:1.2em}.map ul.plain li,.map ol.plain li{margin:.45em 0}
.map-tree{display:grid;gap:6px;margin:10px 0}.map-tree details{border-left:2px solid rgba(128,128,128,.4);padding-left:12px;margin-left:2px}.map-tree details>summary{cursor:pointer;padding:5px 0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
.map-tree details>summary::-webkit-details-marker{display:none}.map-tree details>summary::before{content:'▸';opacity:.6;width:1em}.map-tree details[open]>summary::before{content:'▾'}.map-tree details.leaf>summary::before{content:'•'}
.map-tree details.planned{border-left-style:dashed}.map-tree details.dim{opacity:.32}.map-tree details.hit>summary .map-t{color:#4aa8ff}.map-t{font-weight:600}.map-w{font-family:ui-monospace,monospace;font-size:.76em;opacity:.7}
.map-body{padding:2px 0 8px;display:grid;gap:4px}.map-kv{display:grid;grid-template-columns:7.5em 1fr;gap:8px;font-size:.9em}.map-kv .k{opacity:.7}.map-kv .v{overflow-wrap:anywhere}.map-kv .v.mono{font-family:ui-monospace,monospace;font-size:.88em}
.map-lens{font-size:.74em;border:1px dashed rgba(128,128,128,.55);border-radius:6px;padding:0 6px;margin-right:4px;white-space:nowrap;display:inline-block}
.map-research{overflow-x:auto}.map-research table{min-width:640px;border-collapse:collapse;font-size:.88em}.map-research th,.map-research td{text-align:left;padding:5px 8px;border-bottom:1px solid rgba(128,128,128,.25);vertical-align:top}
.map-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}.map-two>*{min-width:0}.map-box{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:8px 14px;margin:10px 0}
.map-credit{border:1px solid rgba(128,128,128,.35);border-left:4px solid #4aa8ff;border-radius:10px;padding:8px 16px;margin:10px 0}.map-credit p{margin:.6em 0}.map svg{max-width:100%;height:auto}.map a{color:#7fb2ff}.made-with{display:inline-block}`;

// the squared frequencies of the cube network, one scale for ω²
function Spectra({ t }) {
  const X = v => 60 + v * 560 / 9;
  const rows = [[t.rowsLbl(3), plainLevels(3), 20, POS], [t.rowsLbl(4), plainLevels(4), 62, POS], [t.rowsLblC(3), signedLevels(3), 108, NEG], [t.rowsLblC(4), signedLevels(4), 152, NEG]];
  return <svg viewBox="0 0 640 230" role="img" aria-label={t.chartH} className="map-chart"><line x1="60" y1="190" x2="620" y2="190" stroke="currentColor" opacity=".3" />
    {Array.from({ length: 10 }, (_, v) => <g key={v}><line x1={X(v)} y1="190" x2={X(v)} y2="195" stroke="currentColor" opacity=".4" /><text x={X(v)} y="208" textAnchor="middle" fontSize="11" fill="currentColor">{v}</text></g>)}
    <text x="340" y="224" textAnchor="middle" fontSize="11" fill="currentColor" opacity=".7">{t.axis}</text>
    {rows.map(([lab, lv, y, col]) => <g key={lab} className="map-row"><text x="4" y={y + 4} fontSize="11" fill="currentColor" opacity=".8">{lab}</text>{lv.map(l => { const r = 3 + Math.sqrt(l.mult) * 3.2; return <g key={l.w2} data-w2={Math.round(l.w2 * 1000) / 1000} data-mult={l.mult}><circle cx={X(l.w2)} cy={y} r={r} fill={col} fillOpacity=".75" /><text x={X(l.w2)} y={y - r - 3} textAnchor="middle" fontSize="10" fill="currentColor">{l.mult}</text></g>; })}</g>)}</svg>;
}

export default function MapSection({ lang = 'en', profile = 'Young Learner', go = () => {} }) {
  const l = MAP[lang] ? lang : 'en', t = MAP[l], nodes = NODES[l], S = STORY[l];
  const [cur, setCur] = useState(null), [openIds, setOpen] = useState(['equations']);
  const has = (n, key) => { const [kind, k] = key.split(':'); return (kind === 'lens' ? n.lens : n.th).includes(k); };
  const hits = useMemo(() => { if (!cur) return null; const own = new Set(), inside = new Set(); const walk = n => { const kidsHit = n.kids.map(walk).some(Boolean); if (has(n, cur)) own.add(n.id); if (kidsHit) inside.add(n.id); return has(n, cur) || kidsHit; }; TREE.forEach(walk); return { own, inside }; }, [cur]);
  const pick = k => { const next = cur === k ? null : k; setCur(next); if (next) { const ids = []; const walk = n => { const k2 = n.kids.map(walk).some(Boolean); const hit = has(n, next); if (hit || k2) ids.push(n.id); return hit || k2; }; TREE.forEach(walk); setOpen(ids); } };
  const toggle = (id, open) => setOpen(o => (open ? (o.includes(id) ? o : [...o, id]) : o.filter(x => x !== id)));
  const goTo = (page, anchor) => { go(page, anchor); };
  const node = n => { const [title, est] = nodes[n.id], dim = hits && !hits.own.has(n.id) && !hits.inside.has(n.id), hit = hits && hits.own.has(n.id);
    return <details key={n.id} className={(n.kids.length ? '' : 'leaf ') + (n.planned ? 'planned ' : '') + (dim ? 'dim ' : '') + (hit ? 'hit' : '')} open={openIds.includes(n.id)} data-node={n.id} data-lens={n.lens.join(' ')} data-th={n.th.join(' ')} onToggle={e => toggle(n.id, e.currentTarget.open)}>
      <summary><span className="map-t">{title}</span> <span className="map-w">{S.nav[n.go[0]]}{n.go[1] && n.go[1] !== 'top' ? ' · #' + n.go[1] : ''}</span> {n.planned && <span className="tag open">{t.kv.planned}</span>}<Tags kinds={n.tags} lang={l} /></summary>
      <div className="map-body"><div className="map-kv"><span className="k">{t.kv.est}</span><span className="v">{est}</span></div>
        <div className="map-kv"><span className="k">{t.kv.script}</span><span className="v mono">{n.script}</span></div>
        <div className="map-kv"><span className="k">{t.kv.lenses}</span><span className="v">{n.lens.length ? n.lens.map(x => <span key={x} className="map-lens">{LENS_NAMES[l][x]}</span>) : '—'}</span></div>
        <div><button className="eq-btn map-go" data-go={n.go[0] + (n.go[1] ? '#' + n.go[1] : '')} onClick={() => goTo(n.go[0], n.go[1])}>{t.kv.go}</button></div></div>
      {n.kids.map(node)}</details>; };
  const total = hits ? flat().filter(n => hits.own.has(n.id)).length : 0;
  const R = RESEARCH_TEXT[l];
  return <section className="eq map" id="map-top" aria-label={t.statusH}><style>{STYLE}</style>
    <h3 id="map-status">{t.statusH}</h3><p className="eyebrow">{t.date}</p>
    <div className="stats">{t.stats.map(([b, s], i) => <div key={i} className="stat"><b>{b}</b><span>{s}</span></div>)}</div>
    <div className="map-box"><h4>{t.sinceH}</h4><ul className="plain map-since">{t.since.map(([h, x]) => <li key={h}><b>{h}</b> {x}</li>)}</ul></div>
    <div className="map-box"><h4>{t.plainH}</h4><ul className="plain">{t.plain.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
    <h3 id="map-tree">{t.treeH}</h3><p>{t.treeLede}</p>
    <div className="eq-chips" role="group" aria-label={t.lensLbl}><span className="eq-cap" style={{ alignSelf: 'center' }}>{t.lensLbl}</span>{LENSES.map(k => <button key={k} className={'eq-chip map-chip' + (cur === 'lens:' + k ? ' on' : '')} data-f={'lens:' + k} aria-pressed={cur === 'lens:' + k} onClick={() => pick('lens:' + k)}>{LENS_NAMES[l][k]}</button>)}</div>
    <div className="eq-chips" role="group" aria-label={t.threadLbl}><span className="eq-cap" style={{ alignSelf: 'center' }}>{t.threadLbl}</span>{MTHREADS.map(k => <button key={k} className={'eq-chip map-chip' + (cur === 'th:' + k ? ' on' : '')} data-f={'th:' + k} aria-pressed={cur === 'th:' + k} onClick={() => pick('th:' + k)}>{THREAD_NAMES[l][k]}</button>)}<button className="eq-chip map-clear" onClick={() => { setCur(null); }}>{t.clear}</button></div>
    {cur && <p className="eq-cap map-shown" aria-live="polite">{t.shown(total)}</p>}
    <div className="map-tree" id="map-tree-body">{TREE.map(node)}</div>
    <div className="map-box"><h4>{t.threadsH}</h4>{MTHREADS.map(k => <p key={k} className="map-thread" data-th={k}><b>{THREAD_NAMES[l][k]}.</b> {THREAD_TEXT[l][k]}</p>)}</div>
    <h3 id="map-research">{t.researchH}</h3><p>{R.head.lede}</p>
    <div className="map-research"><table className="map-rtab"><thead><tr>{R.head.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{RESEARCH.map(r => { const [a, b, c] = R.rows[r.id]; return <tr key={r.id} data-r={r.id}><td>{a}</td><td>{b}</td><td>{c}</td><td><span className={'tag ' + (r.read === 'not' ? 'open' : 'standard')}>{R.head.readLbl[r.read]}</span><Tags kinds={r.tags.filter(x => x !== 'open' || r.read !== 'not')} lang={l} /></td></tr>; })}</tbody></table></div>
    <h3 id="map-spring">{t.springH}</h3><p>{t.springLede}</p>
    <div className="map-box"><h4>{t.chartH}</h4><Spectra t={t} /><p className="eq-cap">{t.chartCap}</p><button className="eq-btn map-gospring" onClick={() => goTo('equations', 'eq-spring')}>{t.springGo}</button></div>
    <div className="map-box"><h4>{t.limitsH}</h4><ul className="plain">{t.limits.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
    <h3 id="map-next">{t.nextH}</h3><p>{t.nextLede}</p>
    <ol className="plain map-nextlist">{['next_network', 'next_action', 'next_read'].map(id => <li key={id} data-next={id}><b>{nodes[id][0]}.</b> {nodes[id][1]}</li>)}</ol>
    <p className="eq-cap"><b>{t.nextOpenH}:</b> {t.nextOpen}</p>
    <h3 id="map-credit">{t.creditH}</h3>
    <div className="map-credit"><p><CubeMark size={18} /> <b>Claude</b> · Anthropic</p>{t.credit.p.map((x, i) => <p key={i}>{x}</p>)}<p className="eq-cap">{t.credit.mark} <a href={CREDIT_URL} target="_blank" rel="noreferrer noopener">{t.credit.link}</a></p></div></section>;
}
