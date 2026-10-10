import React, { useState, useMemo, useEffect } from 'react';
import { pc } from './spinEngine.js';
import { oscillator, orbit, KINDS, verts, edges, faces, counts, omega2, binom, mode, pluck, pluckVel, springEnergy, kinetic, stretch, faceSums, randomField, randomDisp, fluxes, plainLevels, signedLevels, labelRow, project, bits } from './springEngine.js';

// The live widgets of step 12. Each one recomputes in the browser, with springEngine.js, a statement that selfcheck/spring_selfcheck.py proves exactly
// (rational arithmetic); test_spring.mjs compares the two. All numbers here are floating point and are compared to 1e-7.
const f2 = x => { const r = Math.abs(x) < 5e-5 ? 0 : Math.round(x * 100) / 100; return String(r).replace('-', '−'); };
const f4 = x => { const r = Math.abs(x) < 5e-5 ? 0 : Math.round(x * 10000) / 10000; return String(r).replace('-', '−'); };
const Chips = ({ items, value, onPick, label, fmt = x => String(x) }) => <div className="eq-chips" role="group" aria-label={label}>{items.map(i => <button key={String(i)} className={'eq-chip' + (String(i) === String(value) ? ' on' : '')} aria-pressed={String(i) === String(value)} onClick={() => onPick(i)}>{fmt(i)}</button>)}</div>;
const Mark = ({ ok }) => <span className={'sp-mark ' + (ok ? 'ok' : 'bad')} aria-label={ok ? 'true' : 'false'}>{ok ? '✓' : '✗'}</span>;
const POS = '#60a5fa', NEG = '#fbbf24';

// ---------------------------------------------------------------- 1. one oscillator is a rotor; the three kinds of i are three motions
export function OscillatorI({ t }) {
  const [kind, setKind] = useState('harmonic'), [tt, setTt] = useState(8), x0 = 3, q0 = 2, w = 1;
  const T = kind === 'inverted' ? 1.8 : 6.3, tm = tt / 10, o = useMemo(() => oscillator(kind, w, tm, x0, q0), [kind, tm]);
  const path = useMemo(() => orbit(kind, w, x0, q0, T), [kind, T]), sc = 20, cx = 150, cy = 100;
  const d = path.map(([x, q], i) => (i ? 'L' : 'M') + (cx + sc * x).toFixed(1) + ' ' + (cy - sc * q).toFixed(1)).join(' ');
  const [a, b] = KINDS[kind];
  return <div className="eq-card sp-w spr-w-osc"><p>{t.lede}</p>
    <Chips items={['harmonic', 'inverted', 'free']} value={kind} onPick={setKind} label={t.kindLbl} fmt={k => t.kinds[k]} />
    <p className="eq-mono spr-sig">{t.sig(a, b, o.Bsq)}</p>
    <label className="sp-sl">{t.slider}<input type="range" min="0" max="63" step="1" value={tt} aria-label={t.slider} className="spr-slider" onChange={e => setTt(+e.target.value)} /><span className="eq-mono">t = {f2(tm)}</span></label>
    <svg className="eq-svg" viewBox="0 0 300 200" role="img" aria-label={t.cap}>
      <line x1="0" y1={cy} x2="300" y2={cy} stroke="currentColor" opacity=".25" /><line x1={cx} y1="0" x2={cx} y2="200" stroke="currentColor" opacity=".25" />
      <path d={d} fill="none" stroke={POS} strokeWidth="1.8" opacity=".85" /><circle cx={cx + sc * o.x} cy={cy - sc * o.q} r="5" fill={NEG} className="spr-dot" />
      <text x="286" y={cy - 4} fontSize="11" fill="currentColor" textAnchor="end">x</text><text x={cx + 5} y="12" fontSize="11" fill="currentColor">q</text></svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out spr-law">{t.law(f2(o.k2 * w * w))}</p>
    <p className="sp-out spr-val">{t.val(f2(o.x), f2(o.q))}</p>
    <p className="sp-out spr-half">{t.half} <Mark ok={o.okHalf} /> {tm > 0.05 && <>· {t.full} <Mark ok={!o.okFull} /></>}</p>
    {kind === 'harmonic' && <p className="sp-out spr-energy">{t.energy(f2(o.s2))}</p>}</div>;
}

// ---------------------------------------------------------------- 2. the cube as a spring network: modes, and plucking one vertex
export function CubeSprings({ t }) {
  const [n, setN] = useState(3), [view, setView] = useState('mode'), [s, setS] = useState(1), [v, setV] = useState(0), [tt, setTt] = useState(0), [play, setPlay] = useState(false);
  useEffect(() => { if (!play) return undefined; const id = setInterval(() => setTt(x => (x + 1) % 101), 70); return () => clearInterval(id); }, [play]);
  const ns = Math.min(s, (1 << n) - 1) | 0, sm = view === 'mode' ? ns : 0, vv = Math.min(v, (1 << n) - 1), tm = tt / 10;
  const x = useMemo(() => (view === 'mode' ? mode(n, sm, tm) : pluck(n, vv, tm)), [n, view, sm, vv, tm]);
  const xd = useMemo(() => (view === 'pluck' ? pluckVel(n, vv, tm) : null), [n, view, vv, tm]);
  const E = view === 'pluck' ? springEnergy(n, x) + kinetic(xd) : null, E0 = view === 'pluck' ? springEnergy(n, pluck(n, vv, 0)) + kinetic(pluckVel(n, vv, 0)) : null;
  const P = useMemo(() => { const U = verts(n).map(i => project(n, i, 1)), ux = U.map(p => p[0]), uy = U.map(p => p[1]), k = Math.min(250 / (Math.max(...ux) - Math.min(...ux)), 150 / (Math.max(...uy) - Math.min(...uy)), 150); return U.map(p => [p[0] * k, p[1] * k]); }, [n]), xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const ox = 180 - (Math.min(...xs) + Math.max(...xs)) / 2, oy = 135 - (Math.min(...ys) + Math.max(...ys)) / 2, amp = view === 'mode' ? 26 : 46;
  const pos = i => [P[i][0] + ox, P[i][1] + oy - amp * x[i]];
  const E_ = edges(n), j = pc(sm);
  return <div className="eq-card sp-w spr-w-cube"><p>{t.lede}</p>
    <Chips items={[2, 3, 4]} value={n} onPick={k => { setN(k); setS(1); setV(0); setTt(0); }} label={t.nLbl} fmt={k => `n = ${k}`} />
    <Chips items={['mode', 'pluck']} value={view} onPick={setView} label={t.viewLbl} fmt={k => t.views[k]} />
    {view === 'mode' && <div className="eq-chips spr-bits" role="group" aria-label={t.bitsLbl}>{Array.from({ length: n }, (_, i) => <button key={i} className={'eq-chip spr-bit' + (ns >> i & 1 ? ' on' : '')} aria-pressed={!!(ns >> i & 1)} onClick={() => setS(ns ^ (1 << i) || 1)}>{t.bit(i + 1)} {ns >> i & 1 ? '1' : '0'}</button>)}</div>}
    <label className="sp-sl">{t.slider}<input type="range" min="0" max="100" step="1" value={tt} aria-label={t.slider} className="spr-slider" onChange={e => setTt(+e.target.value)} /><span className="eq-mono">t = {f2(tm)}</span>
      <button className="eq-btn spr-play" aria-pressed={play} onClick={() => setPlay(p => !p)}>{play ? t.pause : t.play}</button></label>
    <svg className="eq-svg spr-svg" viewBox="0 0 360 270" role="img" aria-label={t.cap}>
      {E_.map(([a, b]) => { const A = pos(a), B = pos(b); return <line key={a + '-' + b} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="currentColor" strokeWidth="1.4" opacity=".5" />; })}
      {verts(n).map(i => <circle key={'g' + i} cx={P[i][0] + ox} cy={P[i][1] + oy} r="2.2" fill="none" stroke="currentColor" opacity=".35" />)}
      {verts(n).map(i => { const [px, py] = pos(i); const on = view === 'pluck' && i === vv; return <g key={i} className="spr-vtx" data-v={i} style={view === 'pluck' ? { cursor: 'pointer' } : undefined} onClick={view === 'pluck' ? () => { setV(i); setTt(0); } : undefined}>
        <circle cx={px} cy={py} r={on ? 8 : 6} fill={x[i] >= 0 ? POS : NEG} stroke={on ? 'currentColor' : 'none'} strokeWidth="2" />{n <= 3 && <text x={px + 9} y={py - 7} fontSize="9" fill="currentColor" opacity=".75">{bits(n, i)}</text>}</g>; })}</svg>
    <p className="eq-cap">{view === 'mode' ? t.capMode : t.capPluck}</p>
    {view === 'mode' && <p className="sp-out spr-modeinfo">{t.modeInfo(bits(n, ns), j, 2 * j, binom(n, j))}</p>}
    {view === 'pluck' && <><p className="sp-out spr-pluckinfo">{t.pluckInfo(bits(n, vv))}</p>
      <p className="sp-out spr-econs">{t.econs(f4(E), f4(E0))} <Mark ok={Math.abs(E - E0) < 1e-9} /></p>
      <div style={{ overflowX: 'auto' }}><table className="sp-tab spr-share"><thead><tr><th>{t.shareCols[0]}</th><th>{t.shareCols[1]}</th><th>{t.shareCols[2]}</th></tr></thead><tbody>{Array.from({ length: n + 1 }, (_, k) => <tr key={k}><td>{2 * k}</td><td>{binom(n, k)}</td><td>{binom(n, k)}/{1 << n}</td></tr>)}</tbody></table></div></>}</div>;
}

// ---------------------------------------------------------------- 3. the spectra: the plain spring and the Clifford (signed) spring
export function Spectra({ t }) {
  const [n, setN] = useState(4), pl = plainLevels(n), sg = signedLevels(n), top = 2 * n, X = w => 60 + w * 520 / top, tr = a => a.reduce((s, l) => s + l.w2 * l.mult, 0), ms = a => a.reduce((s, l) => s + l.mult, 0);
  const rows = [[t.plain, pl, 60, POS], [t.signed, sg, 130, NEG]];
  return <div className="eq-card sp-w spr-w-spec"><p>{t.lede}</p>
    <Chips items={[2, 3, 4, 5]} value={n} onPick={setN} label={t.nLbl} fmt={k => `n = ${k}`} />
    <svg className="eq-svg spr-svg" viewBox="0 0 640 190" role="img" aria-label={t.cap}>
      <line x1="40" y1="165" x2="600" y2="165" stroke="currentColor" opacity=".3" />{Array.from({ length: top + 1 }, (_, w) => <g key={w}><line x1={X(w)} y1="165" x2={X(w)} y2="170" stroke="currentColor" opacity=".4" /><text x={X(w)} y="183" fontSize="10" textAnchor="middle" fill="currentColor">{w}</text></g>)}
      {rows.map(([lab, lv, y, col]) => <g key={lab}><text x="4" y={y - 22} fontSize="11" fill="currentColor">{lab}</text>{lv.map(l => { const r = 3 + Math.sqrt(l.mult) * 2.6; return <g key={l.w2} className="spr-level" data-w2={f2(l.w2)} data-mult={l.mult}><circle cx={X(l.w2)} cy={y} r={r} fill={col} fillOpacity=".75" /><text x={X(l.w2)} y={y - r - 3} fontSize="10" textAnchor="middle" fill="currentColor">{l.mult}</text></g>; })}</g>)}</svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out spr-lv1">{t.plainLine(pl.length, pl.map(l => l.w2).join(', '), pl.map(l => l.mult).join(', '))}</p>
    <p className="sp-out spr-lv2">{t.signedLine(sg.length, f2(sg[0].w2), f2(sg[1].w2), sg[0].mult)}</p>
    <p className="sp-out spr-trace">{t.trace(ms(pl), ms(sg), f2(tr(pl)), f2(tr(sg)), n * (1 << n))} <Mark ok={Math.abs(tr(pl) - n * (1 << n)) < 1e-9 && Math.abs(tr(sg) - n * (1 << n)) < 1e-9 && ms(pl) === 1 << n && ms(sg) === 1 << n} /></p></div>;
}

// ---------------------------------------------------------------- 4. faces: closure of the strain, and the flux of the signed edge
export function FaceCloser({ t }) {
  const [n, setN] = useState(3), [kind, setKind] = useState('disp'), [seed, setSeed] = useState(1);
  const u = useMemo(() => randomDisp(n, seed), [n, seed]);
  const f = useMemo(() => (kind === 'disp' ? stretch(n, u) : randomField(n, seed, true)), [n, kind, seed, u]);
  const sums = useMemo(() => faceSums(n, f), [n, f]), fx = useMemo(() => fluxes(n), [n]), c = counts(n), allZero = sums.every(s => s === 0), allMinus = fx.every(h => h === -1);
  const name = ([x, i, j]) => `${i + 1}${j + 1}@${bits(n, x)}`;
  const F = faces(n);
  return <div className="eq-card sp-w spr-w-face"><p>{t.lede}</p>
    <Chips items={[2, 3, 4]} value={n} onPick={setN} label={t.nLbl} fmt={k => `n = ${k}`} />
    <Chips items={['disp', 'field']} value={kind} onPick={setKind} label={t.kindLbl} fmt={k => t.kinds[k]} />
    <button className="eq-btn spr-new" onClick={() => setSeed(x => x + 1)}>{t.again}</button>
    <p className="eq-cap">{t.counts(c.V, c.E, c.F)}</p>
    <div className="spr-faces" role="list" aria-label={t.facesLbl}>{F.map((fc, k) => <span key={k} role="listitem" className={'spr-face ' + (sums[k] === 0 ? 'z' : 'nz')} title={t.faceTitle(name(fc))}>{name(fc)}: {sums[k] > 0 ? '+' + sums[k] : String(sums[k]).replace('-', '−')}</span>)}</div>
    <p className="sp-out spr-verdict">{kind === 'disp' ? t.closed : t.open} <Mark ok={kind === 'disp' ? allZero : !allZero} /></p>
    <h5>{t.fluxH}</h5>
    <p className="sp-out spr-flux">{t.flux(fx.length, allMinus ? '−1' : '?')} <Mark ok={allMinus} /></p>
    <p className="eq-cap">{t.fluxCap}</p></div>;
}

// ---------------------------------------------------------------- 5. the labels of step 11 are the normal modes
export function LabelsAsModes({ t }) {
  const [n, setN] = useState(4), [m, setM] = useState(3);
  const mm = Math.min(m, (1 << n) - 1), rows = useMemo(() => labelRow(n, mm), [n, mm]), odd = pc(mm) & 1, star = odd ? ((1 << n) - 1) ^ mm : mm, ok = rows.every(r => r.ok);
  return <div className="eq-card sp-w spr-w-labels"><p>{t.lede}</p>
    <Chips items={[3, 4]} value={n} onPick={k => { setN(k); setM(3); }} label={t.nLbl} fmt={k => `n = ${k}`} />
    <div className="eq-chips spr-bits" role="group" aria-label={t.bitsLbl}>{Array.from({ length: n }, (_, i) => <button key={i} className={'eq-chip spr-lbit' + (mm >> i & 1 ? ' on' : '')} aria-pressed={!!(mm >> i & 1)} onClick={() => setM(mm ^ (1 << i))}>{t.bit(i + 1)} {mm >> i & 1 ? '1' : '0'}</button>)}</div>
    <p className="sp-out spr-lbl-head">{t.head(bits(n, mm), pc(mm), odd ? t.oddWord : t.evenWord)}</p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab spr-lbl-tab"><thead><tr><th>{t.cols[0]}</th><th>{t.cols[1]}</th><th>{t.cols[2]}</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.x}><td className="eq-mono">{bits(n, r.x)}</td><td>{r.sign > 0 ? '+1' : '−1'}</td><td>{r.char > 0 ? '+1' : '−1'} <Mark ok={r.ok} /></td></tr>)}</tbody></table></div>
    <p className="sp-out spr-lbl-mode">{t.mode(bits(n, star), 2 * pc(star), odd)} <Mark ok={ok} /></p>
    <p className="eq-cap">{t.cap}</p></div>;
}
