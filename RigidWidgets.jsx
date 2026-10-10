import React, { useState, useMemo, useEffect, useRef } from 'react';
import { alg, unitC, boxC, hangForce, stepRK4, frame, verticesFrame, verticesDirect, deepestScan, deepestBits, edgeList, project, zonogon, hull, pc } from './pgaEngine.js';
import { runBench } from './benchKernels.js';
import PD from './pgadynData.js';
import BENCH from './benchData.js';

// The live widgets of step 13, first part: the segment, the square, the labelled body and the frame table. Each one recomputes in the browser, with pgaEngine.js,
// statements that selfcheck/pgadyn_selfcheck.py proves exactly (rational arithmetic); test_pgadyn.mjs compares the two. Floating point here, compared to 1e-7 or better.
export const f2 = x => { const r = Math.abs(x) < 5e-5 ? 0 : Math.round(x * 100) / 100; return String(r).replace('-', '−'); };
export const f3 = x => { const r = Math.abs(x) < 5e-5 ? 0 : Math.round(x * 1000) / 1000; return String(r).replace('-', '−'); };
export const f4 = x => { const r = Math.abs(x) < 5e-5 ? 0 : Math.round(x * 10000) / 10000; return String(r).replace('-', '−'); };
export const Chips = ({ items, value, onPick, label, fmt = x => String(x) }) => <div className="eq-chips" role="group" aria-label={label}>{items.map(i => <button key={String(i)} className={'eq-chip' + (String(i) === String(value) ? ' on' : '')} aria-pressed={String(i) === String(value)} onClick={() => onPick(i)}>{fmt(i)}</button>)}</div>;
export const Mark = ({ ok }) => <span className={'sp-mark ' + (ok ? 'ok' : 'bad')} aria-label={ok ? 'true' : 'false'}>{ok ? '✓' : '✗'}</span>;
export const POS = '#60a5fa', NEG = '#fbbf24', GRN = '#34d399', RED = '#f87171';
export const bits = (n, x) => x.toString(2).padStart(n, '0');
export const useTicker = (on, fn, ms = 33) => { const ref = useRef(fn); ref.current = fn; useEffect(() => { if (!on) return undefined; const id = setInterval(() => ref.current(), ms); return () => clearInterval(id); }, [on, ms]); };
// a motor blade name: the vertex v of the n-cube labels the even blade whose bits are v shifted up, with e0 present exactly when the weight of v is odd
export const bladeName = (n, v) => { const m = (v << 1) | (pc(v) & 1); let s = ''; for (let i = 0; i <= n; i++) if (m >> i & 1) s += i; return m ? 'e' + s : '1'; };
const poly = (pts, sx, sy, ox, oy) => pts.map(([x, y], i) => (i ? 'L' : 'M') + (ox + sx * x).toFixed(1) + ' ' + (oy - sy * y).toFixed(1)).join(' ');
const zig = (x1, y1, x2, y2, m = 9, w = 6) => { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux, pts = [[x1, y1]]; for (let i = 1; i < 2 * m; i++) { const s = i / (2 * m), sg = i % 2 ? 1 : -1; pts.push([x1 + dx * s + px * w * sg, y1 + dy * s + py * w * sg]); } pts.push([x2, y2]); return pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' '); };

// ---------------------------------------------------------------- 1. the segment: one null generator, free motion; one spring supplies the other two kinds of i
export function SegmentSpring({ t }) {
  const [kind, setKind] = useState('spring'), [x0, setX0] = useState(20), [g, setG] = useState(0), [tt, setTt] = useState(35);
  const k = kind === 'spring' ? 4 : kind === 'anti' ? -4 : 0, a = 0.5, X0 = x0 / 10, G = g / 10, T = kind === 'anti' ? 1.6 : 6, h = 0.01;
  const xs = useMemo(() => {
    const A = alg(1), c = unitC(A), F = hangForce(A, { g: G, m: 1, k, alpha: 0, pb: [0], anchor: [a] }); let st = { M: A.trans([X0]), B: A.z() }; const r = [X0];
    for (let i = 0; i < Math.round(T / h); i++) { st = stepRK4(A, st, c, F, h); r.push(A.pos(A.sand(st.M, A.point([0])))[0]); }
    return r;
  }, [k, X0, G, T]);
  const eq = k ? a - G / k : 0, exact = tm => (k > 0 ? eq + (X0 - eq) * Math.cos(Math.sqrt(k) * tm) : k < 0 ? eq + (X0 - eq) * Math.cosh(Math.sqrt(-k) * tm) : X0 - G * tm * tm / 2);
  const i = Math.round(tt / 100 * (xs.length - 1)), tm = i * h, xn = xs[i], xe = exact(tm), err = Math.max(...xs.map((v, j) => Math.abs(v - exact(j * h))));
  const lo = Math.min(...xs.map((v, j) => Math.min(v, exact(j * h))), -1), hi = Math.max(...xs.map((v, j) => Math.max(v, exact(j * h))), 3), sy = 150 / (hi - lo), oy = 175 + lo * sy, sx = 205 / T;
  const Y = x => oy - sy * x, pts = xs.filter((_, j) => j % 4 === 0).map((v, j) => [j * 4 * h, v]), cl = xs.filter((_, j) => j % 10 === 0).map((_, j) => [j * 10 * h, exact(j * 10 * h)]);
  const M1 = -xn / 2, kk = [[0, 1], [-k, 0]], sq = kk.map((r, p) => kk[0].map((_, q) => r[0] * kk[0][q] + r[1] * kk[1][q]));
  return <div className="eq-card sp-w rg-w-seg"><p>{t.lede}</p>
    <Chips items={['spring', 'anti', 'free']} value={kind} onPick={setKind} label={t.kindLbl} fmt={q => t.kinds[q]} />
    <label className="sp-sl">{t.x0}<input type="range" min="-10" max="30" step="1" value={x0} aria-label={t.x0} className="rg-x0" onChange={e => setX0(+e.target.value)} /><span className="eq-mono">x₀ = {f2(X0)}</span></label>
    <label className="sp-sl">{t.grav}<input type="range" min="0" max="40" step="1" value={g} aria-label={t.grav} className="rg-g" onChange={e => setG(+e.target.value)} /><span className="eq-mono">g = {f2(G)}</span></label>
    <label className="sp-sl">{t.time}<input type="range" min="0" max="100" step="1" value={tt} aria-label={t.time} className="rg-t" onChange={e => setTt(+e.target.value)} /><span className="eq-mono">t = {f2(tm)}</span></label>
    <svg className="eq-svg rg-svg" viewBox="0 0 360 200" role="img" aria-label={t.cap}>
      <line x1="40" y1="8" x2="40" y2="196" stroke="currentColor" opacity=".2" /><rect x="30" y={Math.max(2, Math.min(190, Y(a)) - 3)} width="20" height="5" fill="currentColor" opacity=".6" />
      <path d={zig(40, Math.max(2, Math.min(190, Y(a))), 40, Math.max(6, Math.min(194, Y(xn))), 9, 7)} fill="none" stroke={k < 0 ? NEG : POS} strokeWidth="1.6" opacity={k ? 0.9 : 0.15} />
      <circle cx="40" cy={Math.max(6, Math.min(194, Y(xn)))} r="6" fill={NEG} className="rg-mass" />
      <line x1="90" y1="175" x2="350" y2="175" stroke="currentColor" opacity=".25" /><path d={poly(pts, sx, sy, 100, oy)} fill="none" stroke={POS} strokeWidth="2.2" /><path d={poly(cl, sx, sy, 100, oy)} fill="none" stroke="currentColor" strokeDasharray="3 4" opacity=".9" strokeWidth="1.1" />
      <circle cx={100 + sx * tm} cy={Math.max(4, Math.min(196, Y(xn)))} r="4" fill={NEG} /><text x="346" y="170" fontSize="10" textAnchor="end" fill="currentColor">t</text><text x="96" y="14" fontSize="10" fill="currentColor">x</text></svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out rg-motor">{t.motor(f3(M1))}</p>
    <p className="sp-out rg-val">{t.val(f3(xn), f3(xe))} <Mark ok={err < 1e-6} /></p>
    <p className="sp-out rg-i">{t.kindI(k, f2(sq[0][0]), kind)}</p>
    <p className="sp-out rg-eq">{k ? t.rest(f3(eq), f2(G), f2(k)) : t.restFree}</p></div>;
}

// ---------------------------------------------------------------- 2. the square: the first rotation, and the Euler term as the turning of the frame
export function SquareFree({ t }) {
  const [vx, setVx] = useState(10), [vy, setVy] = useState(5), [w, setW] = useState(15), [tt, setTt] = useState(20), [play, setPlay] = useState(false);
  const W = w / 10, S = [1.3, 0.8], h = 0.01, T = 8;
  const run = useMemo(() => {
    const A = alg(2), c = unitC(A); let st = { M: A.motor([0, 0], []), B: A.z() }; st.B[0b011] = vx / 10; st.B[0b101] = vy / 10; st.B[0b110] = W;
    const out = [];
    for (let i = 0; i <= Math.round(T / h); i++) {
      if (i % 5 === 0) { const V = verticesFrame(A, st.M, S), P = A.sand(st.M, A.Amap(st.B, c)), cen = A.pos(A.sand(st.M, A.point([0, 0]))); out.push({ V, cen, b: [st.B[0b011], st.B[0b101], st.B[0b110]], P: P.slice() }); }
      st = stepRK4(A, st, c, null, h);
    }
    return out;
  }, [vx, vy, W]);
  useTicker(play, () => setTt(x => (x + 1) % 101));
  const i = Math.round(tt / 100 * (run.length - 1)), r = run[i], tm = i * 5 * h;
  const cxs = run.map(q => q.cen[0]), cys = run.map(q => q.cen[1]), bx = (Math.max(...cxs) - Math.min(...cxs)) / 2 + 1, by = (Math.max(...cys) - Math.min(...cys)) / 2 + 1, sc = Math.min(48, 170 / bx, 100 / by), ox = 180 - sc * (Math.max(...cxs) + Math.min(...cxs)) / 2, oy = 120 + sc * (Math.max(...cys) + Math.min(...cys)) / 2;
  const drift = Math.max(...run.map(q => Math.max(...q.P.map((v, j) => Math.abs(v - run[0].P[j])))));
  const ang = q => Math.atan2(q.b[1], q.b[0]), rate = (() => { let tot = 0; for (let j = 1; j < run.length; j++) { let d = ang(run[j]) - ang(run[j - 1]); d = Math.atan2(Math.sin(d), Math.cos(d)); tot += d; } return tot / ((run.length - 1) * 5 * h); })();
  const sp = Math.hypot(vx / 10, vy / 10), order = [0, 1, 3, 2], poly4 = order.map(v => r.V[v]), path = run.filter((_, j) => j % 4 === 0).map(q => q.cen);
  const hasV = sp > 0.05;
  return <div className="eq-card sp-w rg-w-sq"><p>{t.lede}</p>
    <label className="sp-sl">{t.vx}<input type="range" min="-20" max="20" value={vx} aria-label={t.vx} className="rg-vx" onChange={e => setVx(+e.target.value)} /><span className="eq-mono">b₀₁ = {f2(vx / 10)}</span></label>
    <label className="sp-sl">{t.vy}<input type="range" min="-20" max="20" value={vy} aria-label={t.vy} className="rg-vy" onChange={e => setVy(+e.target.value)} /><span className="eq-mono">b₀₂ = {f2(vy / 10)}</span></label>
    <label className="sp-sl">{t.spin}<input type="range" min="0" max="40" value={w} aria-label={t.spin} className="rg-w" onChange={e => setW(+e.target.value)} /><span className="eq-mono">b₁₂ = {f2(W)}</span></label>
    <label className="sp-sl">{t.time}<input type="range" min="0" max="100" value={tt} aria-label={t.time} className="rg-t" onChange={e => setTt(+e.target.value)} /><span className="eq-mono">t = {f2(tm)}</span><button className="eq-btn rg-play" aria-pressed={play} onClick={() => setPlay(p => !p)}>{play ? t.pause : t.play}</button></label>
    <svg className="eq-svg rg-svg" viewBox="0 0 360 240" role="img" aria-label={t.cap}>
      <path d={poly(path, sc, sc, ox - 0 * 1, oy)} fill="none" stroke="currentColor" strokeDasharray="3 3" opacity=".5" />
      <polygon points={poly4.map(([x, y]) => `${(ox + sc * x).toFixed(1)},${(oy - sc * y).toFixed(1)}`).join(' ')} fill={POS} fillOpacity=".18" stroke={POS} strokeWidth="1.6" />
      {r.V.map((p, v) => <g key={v}><circle cx={ox + sc * p[0]} cy={oy - sc * p[1]} r="3.4" fill={pc(v) & 1 ? NEG : POS} /><text x={ox + sc * p[0] + 5} y={oy - sc * p[1] - 5} fontSize="9" fill="currentColor" opacity=".8">{bits(2, v)}</text></g>)}
      <circle cx={ox + sc * r.cen[0]} cy={oy - sc * r.cen[1]} r="2.5" fill="currentColor" /></svg>
    <svg className="eq-svg rg-svg2" viewBox="0 0 360 120" role="img" aria-label={t.cap2}>
      <circle cx="90" cy="60" r={Math.max(2, 40 * Math.min(1, sp / 2.2))} fill="none" stroke="currentColor" opacity=".3" /><line x1="30" y1="60" x2="150" y2="60" stroke="currentColor" opacity=".2" /><line x1="90" y1="10" x2="90" y2="110" stroke="currentColor" opacity=".2" />
      {hasV && <circle cx={90 + 40 * Math.min(1, sp / 2.2) * r.b[0] / sp} cy={60 - 40 * Math.min(1, sp / 2.2) * r.b[1] / sp} r="5" fill={NEG} className="rg-bvec" />}
      <text x="148" y="56" fontSize="10" fill="currentColor">b₀₁</text><text x="94" y="14" fontSize="10" fill="currentColor">b₀₂</text>
      <text x="170" y="40" fontSize="11" fill="currentColor">{t.bodyFrame}</text><text x="170" y="62" fontSize="11" fill="currentColor">b = ({f2(r.b[0])}, {f2(r.b[1])})</text><text x="170" y="84" fontSize="11" fill="currentColor">b₁₂ = {f2(r.b[2])}</text></svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out rg-const">{t.constant(f4(drift))} <Mark ok={drift < 1e-6} /></p>
    <p className="sp-out rg-rate">{hasV ? <>{t.rate(f3(rate), f3(-W))} <Mark ok={Math.abs(rate + W) < 1e-3} /></> : t.noV}</p></div>;
}

// ---------------------------------------------------------------- 3. the labelled body: the motor coefficients and the vertices carry the same labels
const BODY_S = [1.3, 1.0, 0.8, 0.6];
export function LabelledBody({ t }) {
  const [n, setN] = useState(3), [tab, setTab] = useState('labels'), [sel, setSel] = useState(5), [r12, setR12] = useState(25), [r23, setR23] = useState(35), [r34, setR34] = useState(30), [th, setTh] = useState(40), [bench, setBench] = useState(null), [busy, setBusy] = useState(false);
  const full = (1 << n) - 1, v = Math.min(sel, full), s = BODY_S.slice(0, n);
  const A = useMemo(() => alg(n), [n]);
  const body = useMemo(() => {
    const planes = []; if (n >= 2) planes.push([1, 2, r12 * Math.PI / 180]); if (n >= 3) planes.push([2, 3, r23 * Math.PI / 180]); if (n >= 4) planes.push([3, 4, r34 * Math.PI / 180]);
    const M = A.motor(new Array(n).fill(0), planes), fr = frame(A, M, s), V = verticesFrame(A, M, s, fr), D = verticesDirect(A, M, s);
    const err = Math.max(...V.map((p, i) => Math.max(...p.map((x, k) => Math.abs(x - D[i][k]))))), cen = fr.c;
    return { M, fr, V, err, cen };
  }, [A, n, r12, r23, r34]);
  const nu = useMemo(() => { const a = th * Math.PI / 180, r = [Math.cos(a), Math.sin(a)]; for (let i = 2; i < n; i++) r.push(i === 2 ? 0.35 : -0.25); return n === 1 ? [1] : r.slice(0, n); }, [n, th]), dd = 0.05;
  const P = body.V.map(p => project(n, p)), xs = P.map(p => p[0]), ys = P.map(p => p[1]), sc = 78, ox = 180 - sc * (Math.min(...xs) + Math.max(...xs)) / 2, oy = 120 + sc * (Math.min(...ys) + Math.max(...ys)) / 2;
  const X = i => ox + sc * P[i][0], Y = i => oy - sc * P[i][1], E = edgeList(n), comp = full ^ v;
  const dist = body.V.map(p => dd + p.reduce((q, x, k) => q + nu[k] * x, 0)), lab = deepestBits(body.fr, nu), scan = deepestScan(body.V, nu, dd);
  const outline = n >= 2 ? zonogon(body.fr.f.map(f => project(n, f))) : [], hl = n >= 2 ? hull(P.map((p, i) => [p[0], p[1], i])) : [];
  const flips = outline.map((a, i) => Math.log2(a ^ outline[(i + 1) % outline.length]));
  const mirrorErr = Math.max(...body.V[v].map((x, k) => Math.abs(2 * body.cen[k] - x - body.V[comp][k])));
  const doBench = () => { setBusy(true); setBench([]); const ns = [2, 3, 4, 5], step = i => { if (i >= ns.length) { setBusy(false); return; } setTimeout(() => { try { const r = runBench({ ns: [ns[i]], minMs: 15, reps: 5 }); setBench(b => [...(b || []), ...r]); } catch (e) { /* ignore */ } step(i + 1); }, 20); }; step(0); };
  const sd = Math.min(...dist), sdMax = Math.max(...dist) || 1;
  return <div className="eq-card sp-w rg-w-lab"><p>{t.lede}</p>
    <Chips items={[1, 2, 3, 4]} value={n} onPick={k => { setN(k); setSel(Math.min(sel, (1 << k) - 1)); }} label={t.nLbl} fmt={k => ({ 1: t.segment, 2: t.square, 3: t.cube, 4: t.tesseract })[k]} />
    <Chips items={['labels', 'frame', 'contact', 'outline', 'timing']} value={tab} onPick={setTab} label={t.tabLbl} fmt={k => t.tabs[k]} />
    {n >= 2 && <label className="sp-sl">{t.rot12}<input type="range" min="0" max="360" value={r12} aria-label={t.rot12} className="rg-r12" onChange={e => setR12(+e.target.value)} /><span className="eq-mono">{r12}°</span></label>}
    {n >= 3 && <label className="sp-sl">{t.rot23}<input type="range" min="0" max="360" value={r23} aria-label={t.rot23} className="rg-r23" onChange={e => setR23(+e.target.value)} /><span className="eq-mono">{r23}°</span></label>}
    {n >= 4 && <label className="sp-sl">{t.rot34}<input type="range" min="0" max="360" value={r34} aria-label={t.rot34} className="rg-r34" onChange={e => setR34(+e.target.value)} /><span className="eq-mono">{r34}°</span></label>}
    <svg className="eq-svg rg-svg" viewBox="0 0 360 240" role="img" aria-label={t.cap}>
      {tab === 'outline' && outline.length > 0 && <polygon points={outline.map(a => `${X(a).toFixed(1)},${Y(a).toFixed(1)}`).join(' ')} fill={GRN} fillOpacity=".12" stroke={GRN} strokeWidth="2" className="rg-zono" />}
      {E.map(([a, b, i]) => <line key={a + '-' + b} x1={X(a)} y1={Y(a)} x2={X(b)} y2={Y(b)} stroke={tab === 'frame' ? `hsl(${(i * 85 + 200) % 360} 70% 58%)` : 'currentColor'} strokeWidth={tab === 'frame' ? 1.8 : 1.2} opacity={tab === 'frame' ? 0.85 : 0.4} />)}
      {tab === 'labels' && <line x1={X(v)} y1={Y(v)} x2={X(comp)} y2={Y(comp)} stroke={RED} strokeDasharray="4 3" strokeWidth="1.4" />}
      {body.V.map((_, i) => { const odd = pc(i) & 1, deep = tab === 'contact' && i === lab, col = tab === 'contact' ? `hsl(${220 - 200 * (dist[i] - sd) / ((sdMax - sd) || 1)} 80% 55%)` : odd ? NEG : POS;
        return <g key={i} className="rg-vtx" data-v={i} style={{ cursor: 'pointer' }} onClick={() => setSel(i)}><circle cx={X(i)} cy={Y(i)} r={i === v ? 8 : deep ? 8 : 5.5} fill={col} stroke={i === v || deep ? 'currentColor' : i === comp && tab === 'labels' ? RED : 'none'} strokeWidth="2" />
          <text x={X(i) + 8} y={Y(i) - 7} fontSize="9" fill="currentColor" opacity=".85">{bits(n, i)}</text></g>; })}</svg>
    <p className="eq-cap">{t.cap}</p>
    {tab === 'labels' && <>
      <p className="sp-out rg-sel">{t.sel(bits(n, v), bladeName(n, v), pc(v) & 1 ? t.odd : t.even, bits(n, comp), bladeName(n, comp))}</p>
      <p className="sp-out rg-mirror">{t.mirror(f4(mirrorErr))} <Mark ok={mirrorErr < 1e-9} /></p>
      <div style={{ overflowX: 'auto' }}><table className="sp-tab rg-lab-tab"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
        {Array.from({ length: 1 << n }, (_, i) => <tr key={i} className={i === v ? 'on' : ''}><td className="eq-mono">{bits(n, i)}</td><td className="eq-mono">{bladeName(n, i)}</td><td>{pc(i) & 1 ? t.eps : t.rotor}</td><td className="eq-mono">{bits(n, full ^ i)}</td></tr>)}</tbody></table></div>
      {n === 3 && <p className="eq-cap">{t.study}</p>}</>}
    {tab === 'frame' && <>
      <p className="sp-out rg-count">{t.count(1 << n, n + 1, (1 << n) - 1)}</p>
      <p className="sp-out rg-addr">{t.addr(bits(n, v), [...Array(n).keys()].filter(i => v >> i & 1).map(i => `f${i + 1}`).join(' + ') || '0')}</p>
      <p className="sp-out rg-ferr">{t.ferr(f4(body.err))} <Mark ok={body.err < 1e-9} /></p></>}
    {tab === 'contact' && <>
      <label className="sp-sl">{t.angle}<input type="range" min="0" max="360" value={th} aria-label={t.angle} className="rg-th" onChange={e => setTh(+e.target.value)} /><span className="eq-mono">{th}°</span></label>
      <div style={{ overflowX: 'auto' }}><table className="sp-tab rg-sign-tab"><thead><tr>{t.signCols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{Array.from({ length: n }, (_, i) => { const d = nu.reduce((q, x, k) => q + x * body.fr.f[i][k], 0); return <tr key={i}><td>{i + 1}</td><td>{f3(d)}</td><td className="eq-mono">{d < 0 ? 1 : 0}</td></tr>; })}</tbody></table></div>
      <p className="sp-out rg-deep">{t.deep(bits(n, lab), f3(dist[lab]), 1 << n, n)} <Mark ok={lab === scan} /></p></>}
    {tab === 'outline' && (n >= 2 ? <>
      <p className="sp-out rg-outl">{t.outl(outline.length, 2 * n)} <Mark ok={outline.length === 2 * n && outline.length === hl.length && outline.every(a => hl.includes(a))} /></p>
      <p className="sp-out rg-seq eq-mono">{outline.map(a => bits(n, a)).join(' → ')} → {bits(n, outline[0])}</p>
      <p className="sp-out rg-flip">{t.flip(flips.map(f => f + 1).join(', '))} <Mark ok={flips.every(f => Number.isInteger(f)) && [...Array(n).keys()].every(i => flips.filter(f => f === i).length === 2)} /></p></> : <p className="eq-cap">{t.noOutline}</p>)}
    {tab === 'timing' && <>
      <p className="eq-cap">{t.benchLede}</p>
      <button className="eq-btn rg-bench" disabled={busy} onClick={doBench}>{busy ? t.running : t.run}</button>
      {bench && bench.length > 0 && <BenchTable t={t} rows={bench} title={t.here} cls="rg-bench-here" />}
      <BenchTable t={t} rows={BENCH.rows.filter(r => r.n >= 2 && r.n <= 5)} title={t.mine(BENCH.machine)} cls="rg-bench-mine" />
      <p className="eq-cap">{t.benchNote}</p></>}</div>;
}
const ratio = (a, b) => (a && b ? (a.med / b.med) : NaN);
const fmtNs = x => (x >= 1e4 ? (x / 1e3).toFixed(1) + ' µs' : Math.round(x) + ' ns');
function BenchTable({ t, rows, title, cls }) {
  const L = [['direct', 'direct'], ['frame', 'frame'], ['matrix', 'matrix'], ['scan', 'scan'], ['bits', 'bits'], ['hull', 'hull'], ['zono', 'zono']];
  return <div style={{ overflowX: 'auto' }}><table className={'sp-tab ' + cls}><caption style={{ textAlign: 'left' }}>{title}</caption><thead><tr><th>n</th><th>{t.bcols[0]}</th><th>{t.bcols[1]}</th><th>{t.bcols[2]}</th><th>{t.bcols[3]}</th><th>{t.bcols[4]}</th><th>{t.bcols[5]}</th></tr></thead>
    <tbody>{rows.map(r => <tr key={r.n} data-n={r.n}><td>{r.n}</td><td>{fmtNs(r.ns.direct.med)} → {fmtNs(r.ns.frame.med)}</td><td>{ratio(r.ns.direct, r.ns.frame).toFixed(2)}×</td><td>{ratio(r.ns.matrixGiven, r.ns.doubling).toFixed(2)}×</td><td>{ratio(r.ns.frame, r.ns.mirror).toFixed(2)}×</td><td>{ratio(r.ns.scan, r.ns.bits).toFixed(2)}× / {ratio(r.ns.scanBuilt, r.ns.bitsBuilt).toFixed(2)}×</td><td>{ratio(r.ns.hull, r.ns.zono).toFixed(2)}× / {ratio(r.ns.hullBuilt, r.ns.zonoBuilt).toFixed(2)}×</td></tr>)}</tbody></table></div>;
}

// ---------------------------------------------------------------- 4. the frame table: every count of the ladder, enumerated by the exact script
export function FrameTable({ t }) {
  const FT = PD.frame_table, ns = Object.keys(FT), R = [['vertices', 'vertices'], ['edges', 'edges'], ['motor_coefficients', 'motor'], ['bivector_components', 'biv'], ['group_dimension', 'group'], ['force_components', 'force'], ['norm_equations', 'norm'], ['integration_numbers', 'integ'], ['solution_numbers', 'sol'], ['sandwiches_direct', 'direct'], ['sandwiches_frame', 'frame'], ['additions', 'adds'], ['outline_vertices', 'outline']];
  const [hi, setHi] = useState('motor_coefficients');
  return <div className="eq-card sp-w rg-w-table"><p>{t.lede}</p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab rg-frame-tab"><thead><tr><th>{t.cols0}</th>{ns.map(n => <th key={n}>n = {n}</th>)}</tr></thead>
      <tbody>{R.map(([key, k]) => <tr key={key} data-row={key} className={key === hi ? 'on' : ''} onClick={() => setHi(key)} style={{ cursor: 'pointer' }}><td>{t.rows[k]}</td>{ns.map(n => <td key={n} className={key === 'norm_equations' && FT[n].norm_ok === false ? 'rg-short' : ''}>{FT[n][key]}</td>)}</tr>)}
        <tr data-row="need"><td>{t.rows.need}</td>{ns.map(n => <td key={n}>{FT[n].vertices - FT[n].group_dimension} {FT[n].norm_ok ? <Mark ok /> : <Mark ok={false} />}</td>)}</tr></tbody></table></div>
    <p className="eq-cap">{t.cap}</p><p className="sp-out rg-note">{t.note5(FT['5'].vertices - FT['5'].group_dimension, FT['5'].norm_equations)}</p></div>;
}
