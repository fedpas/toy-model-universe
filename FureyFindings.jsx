import React from 'react';
import { FINDINGS, FINDINGS_UI, REAL_BLOCKS, COMPLEX_BLOCKS, BLOCK_NAMES, BLOCK_COLORS, EDGES } from './findingsData';

const BADGE = { verified: '#4fd18b', open: '#ffd166' };
const CSS = `
.findings{margin:3rem auto;max-width:1100px;padding:0 1rem}
.findings h2{margin:.2rem 0 .6rem}
.findings .f-card{border:1px solid rgba(160,170,200,.28);border-radius:14px;padding:1.1rem 1.2rem;margin:1rem 0;background:rgba(120,130,170,.07)}
.findings .f-badge{display:inline-block;font-size:.72rem;letter-spacing:.04em;padding:.15rem .6rem;border-radius:99px;border:1px solid;margin-bottom:.4rem}
.findings .f-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1.2rem;align-items:center}
.findings .f-body.solo{grid-template-columns:1fr}
.findings svg{width:100%;height:auto;max-height:340px}
.findings .f-cap{font-size:.78rem;opacity:.75;margin-top:.3rem}
.findings .f-repro{font-size:.8rem;opacity:.7}
@media(max-width:760px){.findings .f-body{grid-template-columns:1fr}}`;

function Grid({ blocks, size, label }) {
  const total = blocks.reduce((a, b) => a + b, 0), c = size / total; let o = 0;
  const cols = label === 'real' ? [0, 1, 2, 3, 4, 4] : [0, 1, 2, 3, 4];
  return <g>
    <rect width={size} height={size} fill="none" stroke="currentColor" strokeOpacity=".35" />
    {blocks.map((n, i) => { const r = <rect key={i} x={o * c} y={o * c} width={n * c} height={n * c} fill={BLOCK_COLORS[cols[i]]} fillOpacity=".85" stroke="#0008" />; o += n; return r; })}
  </g>;
}
function GridVisual({ caption }) {
  return <figure style={{ margin: 0 }}><svg viewBox="0 0 440 210" role="img" aria-label="Peirce block grids">
    <g transform="translate(10,10)"><Grid blocks={REAL_BLOCKS} size={190} label="real" /></g>
    <g transform="translate(240,10)"><Grid blocks={COMPLEX_BLOCKS} size={190} label="cx" /></g>
    <text x="105" y="208" textAnchor="middle" fontSize="11" fill="currentColor">ℝ: 62 + 194</text>
    <text x="335" y="208" textAnchor="middle" fontSize="11" fill="currentColor">ℂ: 16 + 48ℂ</text>
  </svg><figcaption className="f-cap">{caption}</figcaption></figure>;
}
function GraphVisual({ caption }) {
  const R = 112, cx = 190, cy = 170, pts = COMPLEX_BLOCKS.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  return <figure style={{ margin: 0 }}><svg viewBox="0 0 380 320" role="img" aria-label="Edge graph">
    {EDGES.map(([a, b, cap, lab, kind], i) => { const [x1, y1] = pts[a], [x2, y2] = pts[b], sm = kind === 'sm';
      return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={sm ? '#ffd166' : '#9aa3b8'} strokeOpacity={sm ? .95 : .7} strokeWidth={1 + cap / 3} strokeDasharray={sm ? undefined : '5 4'} />
        <text x={(x1 * 2 + x2) / 3 + (x2 - x1) * .0} y={(y1 * 2 + y2) / 3} fontSize="9" fill="currentColor" textAnchor="middle" paintOrder="stroke" stroke="#0007" strokeWidth="2">{lab.split(' ')[0]}</text></g>; })}
    {pts.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={11 + 3 * COMPLEX_BLOCKS[i]} fill={BLOCK_COLORS[i]} stroke="#0008" /><text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111">{COMPLEX_BLOCKS[i]}</text>
      <text x={x} y={y + (y < cy ? -26 : 34)} textAnchor="middle" fontSize="10" fill="currentColor">{BLOCK_NAMES[i]}</text></g>)}
  </svg><figcaption className="f-cap">{caption}</figcaption></figure>;
}
function AxesVisual({ caption }) {
  const seq = []; REAL_BLOCKS.forEach((n, i) => { for (let k = 0; k < n; k++) seq.push(i); });
  const col = [0, 1, 2, 3, 4, 4];
  return <figure style={{ margin: 0 }}><svg viewBox="0 0 400 110" role="img" aria-label="16 Witt axes">
    {seq.map((b, i) => <g key={i}><rect x={8 + i * 24} y="20" width="20" height="40" rx="4" fill={BLOCK_COLORS[col[b]]} fillOpacity=".9" stroke="#0008" /><text x={18 + i * 24} y="76" textAnchor="middle" fontSize="9" fill="currentColor">{i}</text></g>)}
    <text x="200" y="100" textAnchor="middle" fontSize="10" fill="currentColor">2 · 6 · 4 · 2 · 1 · 1  (ℝ: sum 16)</text>
  </svg><figcaption className="f-cap">{caption}</figcaption></figure>;
}

export default function FureyFindings({ lang = 'en', profile = 'Young Learner' }) {
  const ui = FINDINGS_UI[lang] || FINDINGS_UI.en, V = { grid: GridVisual, graph: GraphVisual, axes: AxesVisual };
  return <section className="findings" id="findings" aria-labelledby="findings-h">
    <style>{CSS}</style>
    <p className="eyebrow">{ui.eyebrow}</p><h2 id="findings-h">{ui.title}</h2><p className="lede">{ui.lede}</p>
    {FINDINGS.map(f => {
      const [title, body] = (f[lang] || f.en)[profile] || f.en['Physicist']; const Vis = V[f.visual];
      return <article className="f-card" key={f.id} data-finding={f.id}>
        <span className="f-badge" style={{ color: BADGE[f.status], borderColor: BADGE[f.status] }}>{ui.status[f.status]}</span>
        <h3>{title}</h3>
        <div className={'f-body' + (Vis ? '' : ' solo')}><p>{body}</p>{Vis && <Vis caption={ui.caption[f.visual]} />}</div>
      </article>;
    })}
    <p className="f-repro">{ui.repro}</p>
  </section>;
}
