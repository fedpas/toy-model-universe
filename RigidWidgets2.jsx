import React, { useState, useMemo, useEffect, useRef } from 'react';
import { alg, boxC, stepRK4, stepWorld, energyWorld, chainRest, verticesFrame, frame, edgeList, project, newtonAcc, rk4Bodies, energyBodies, kinetic, MOON, PLANET_G } from './pgaEngine.js';
import PD from './pgadynData.js';
import { Chips, Mark, f2, f3, f4, bits, bladeName, useTicker, POS, NEG, GRN, RED } from './RigidWidgets.jsx';

// The live widgets of step 13, second part: hang a chain of bodies from springs, the free top, the moon and the planets.
// pgaEngine.js does the work in floating point; selfcheck/pgadyn_selfcheck.py proves the same statements exactly (E4, E5, E11, E12, T1-T3, N1-N9) and test_pgadyn.mjs compares the two.
const zig = (x1, y1, x2, y2, m = 8, w = 5) => { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L, pts = [[x1, y1]]; for (let i = 1; i < 2 * m; i++) { const s = i / (2 * m), sg = i % 2 ? 1 : -1; pts.push([x1 + dx * s + px * w * sg, y1 + dy * s + py * w * sg]); } pts.push([x2, y2]); return pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' '); };
const COL = ['#60a5fa', '#34d399', '#f472b6'];
const H = 1 / 300;

// ---------------------------------------------------------------- 5. hang it from a spring: one body, or a chain of bodies hooked together, in 1 to 4 dimensions
export function HangIt({ t }) {
  const [n, setN] = useState(3), [nb, setNb] = useState(1), [top, setTop] = useState(7), [k, setK] = useState(8), [g, setG] = useState(30), [al, setAl] = useState(0), [tilt, setTilt] = useState(35), [view, setView] = useState(25), [play, setPlay] = useState(false), [, setTick] = useState(0);
  const A = useMemo(() => alg(n), [n]), full = (1 << n) - 1, tp = n === 1 ? 1 : Math.min(top, full), sim = useRef(null);
  const setup = useMemo(() => {
    const sizes = Array.from({ length: nb }, (_, b) => Array.from({ length: n }, (_, i) => Math.max(0.35, 1.0 - 0.14 * i - 0.12 * b)));
    const R = chainRest(A, { top: tp, nb, sizes, k, g: g / 10, m: 1, y0: 3, tilt: tilt * Math.PI / 180 });
    const w = { n, g: g / 10, alpha: al / 20, bodies: R.bodies.map(b => ({ m: b.m, c: b.c })), springs: R.springs }, st = R.bodies.map(b => ({ M: b.M, B: b.B }));
    const c0 = st.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0)))));
    return { w, st0: st, E0: energyWorld(A, w, st).E, sizes, R, c0 };
  }, [A, n, nb, tp, k, g, al, tilt]);
  useEffect(() => { sim.current = { setup, st: setup.st0, t: 0, trails: setup.st0.map(() => []), us: 0, steps: 0 }; setPlay(false); setTick(x => x + 1); }, [setup]);
  const cur = sim.current && sim.current.setup === setup ? sim.current : { setup, st: setup.st0, t: 0, trails: setup.st0.map(() => []), us: 0, steps: 0 };
  const advance = steps => {
    const s = sim.current; if (!s || s.setup !== setup) return; const t0 = performance.now(); let st = s.st;
    for (let i = 0; i < steps; i++) { st = stepWorld(A, setup.w, st, H); if ((s.steps + i) % 6 === 0) st.forEach((x, b) => { s.trails[b].push(A.pos(A.sand(x.M, A.point(new Array(n).fill(0))))); if (s.trails[b].length > 220) s.trails[b].shift(); }); }
    s.st = st; s.t += steps * H; s.steps += steps; s.us = (performance.now() - t0) / steps * 1000; setTick(x => x + 1);
  };
  useTicker(play, () => advance(10));
  const vw = view * Math.PI / 180, sc = nb === 1 ? 46 : nb === 2 ? 38 : 32, ox = 180, oy = 20 + sc * 3, pr = x => { const p = project(n, x, vw); return [ox + sc * p[0], oy - sc * p[1]]; };
  const bodies = cur.st.map((x, b) => ({ V: verticesFrame(A, x.M, setup.sizes[b]) })), en = energyWorld(A, setup.w, cur.st), drift = Math.abs(en.E - setup.E0);
  const cen = cur.st.map(x => A.pos(A.sand(x.M, A.point(new Array(n).fill(0))))), moved = Math.max(...cen.map((p, b) => Math.max(...p.map((v, i) => Math.abs(v - setup.c0[b][i])))));
  const nerr = Math.max(...cur.st.map(x => A.normErr(x.M))), E = edgeList(n), anchor = pr(setup.R.anchor);
  const wp = (b, p) => pr(A.pos(A.sand(cur.st[b].M, A.point(p))));
  return <div className="eq-card sp-w rg-w-hang"><p>{t.lede}</p>
    <Chips items={[1, 2, 3, 4]} value={n} onPick={q => { setN(q); setTop(q === 1 ? 1 : (1 << q) - 1); }} label={t.nLbl} fmt={q => ({ 1: t.segment, 2: t.square, 3: t.cube, 4: t.tesseract })[q]} />
    <Chips items={[1, 2, 3]} value={nb} onPick={setNb} label={t.nbLbl} fmt={q => t.bodies(q)} />
    {n >= 2 && <div className="eq-chips rg-topbits" role="group" aria-label={t.topLbl}>{Array.from({ length: n }, (_, i) => <button key={i} className={'eq-chip rg-bit' + (tp >> i & 1 ? ' on' : '')} aria-pressed={!!(tp >> i & 1)} onClick={() => setTop((tp ^ (1 << i)) || 1)}>{t.bit(i + 1)} {tp >> i & 1}</button>)}</div>}
    <label className="sp-sl">{t.k}<input type="range" min="2" max="30" value={k} aria-label={t.k} className="rg-k" onChange={e => setK(+e.target.value)} /><span className="eq-mono">k = {k}</span></label>
    <label className="sp-sl">{t.g}<input type="range" min="0" max="60" value={g} aria-label={t.g} className="rg-gr" onChange={e => setG(+e.target.value)} /><span className="eq-mono">g = {f2(g / 10)}</span></label>
    <label className="sp-sl">{t.al}<input type="range" min="0" max="20" value={al} aria-label={t.al} className="rg-al" onChange={e => setAl(+e.target.value)} /><span className="eq-mono">α = {f2(al / 20)}</span></label>
    <label className="sp-sl">{t.tilt}<input type="range" min="0" max="85" value={tilt} aria-label={t.tilt} className="rg-tilt" onChange={e => setTilt(+e.target.value)} /><span className="eq-mono">{tilt}°</span></label>
    {n >= 3 && <label className="sp-sl">{t.view}<input type="range" min="-60" max="60" value={view} aria-label={t.view} className="rg-view" onChange={e => setView(+e.target.value)} /><span className="eq-mono">{view}°</span></label>}
    <div className="sp-sl"><button className="eq-btn rg-play" aria-pressed={play} onClick={() => setPlay(p => !p)}>{play ? t.pause : t.drop}</button><button className="eq-btn rg-step" onClick={() => advance(30)}>{t.step}</button><button className="eq-btn rg-reset" onClick={() => { sim.current = { setup, st: setup.st0, t: 0, trails: setup.st0.map(() => []), us: 0, steps: 0 }; setPlay(false); setTick(x => x + 1); }}>{t.reset}</button><span className="eq-mono rg-time">t = {f2(cur.t)}</span></div>
    <svg className="eq-svg rg-svg" viewBox="0 0 360 320" role="img" aria-label={t.cap}>
      <line x1="150" y1={anchor[1]} x2="210" y2={anchor[1]} stroke="currentColor" strokeWidth="3" opacity=".6" />
      {cur.trails.map((tr, b) => <path key={'t' + b} d={tr.map((p, i) => { const q = pr(p); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ')} fill="none" stroke={COL[b]} opacity=".35" strokeDasharray="2 2" />)}
      {setup.w.springs.map((sp, i) => { const a = wp(sp.a, sp.pa), b = sp.b < 0 ? anchor : wp(sp.b, sp.pb); return <path key={'s' + i} d={zig(a[0], a[1], b[0], b[1], 9, 4)} fill="none" stroke={NEG} strokeWidth="1.5" opacity=".9" className="rg-spring" />; })}
      {bodies.map((bd, b) => <g key={b} className="rg-body" data-b={b}>{E.map(([a, c]) => { const p = pr(bd.V[a]), q = pr(bd.V[c]); return <line key={a + '-' + c} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={COL[b]} strokeWidth="1.3" opacity=".8" />; })}
        {bd.V.map((v, i) => { const p = pr(v), hot = i === tp || i === (full ^ tp); return <circle key={i} cx={p[0]} cy={p[1]} r={hot ? 4.2 : 2} fill={hot ? NEG : COL[b]} stroke={i === tp ? 'currentColor' : 'none'} />; })}</g>)}</svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out rg-attach">{t.attach(bits(n, tp), bladeName(n, tp), bits(n, full ^ tp))}</p>
    <p className="sp-out rg-energy">{t.energy(f4(en.K), f4(en.Ug), f4(en.Us), f4(en.E))}</p>
    <p className="sp-out rg-drift">{al ? t.damped : t.drift(drift.toExponential(1))} {!al && <Mark ok={drift < 1e-5} />}</p>
    <p className="sp-out rg-norm">{t.norm(nerr.toExponential(1))} <Mark ok={nerr < 1e-12} />{cur.steps ? ' · ' + t.speed(Math.round(cur.us)) : ''}</p>
    {tilt === 0 && <p className="sp-out rg-rest">{t.rest(moved.toExponential(1))} <Mark ok={moved < 1e-9} /></p>}</div>;
}

// ---------------------------------------------------------------- 6. later rung: the free top. Euler's equations on the momentum sphere; the three kinds of i again
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const eulerL = (L, I) => cross(L, L.map((x, i) => x / I[i]));
const rk4L = (L, I, h) => { const k1 = eulerL(L, I), a = L.map((x, i) => x + h / 2 * k1[i]), k2 = eulerL(a, I), b = L.map((x, i) => x + h / 2 * k2[i]), k3 = eulerL(b, I), c = L.map((x, i) => x + h * k3[i]), k4 = eulerL(c, I); return L.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); };
export const topMu = (I, a) => { const [b, c] = [0, 1, 2].filter(i => i !== a); return (I[c] - I[a]) * (I[a] - I[b]) / (I[b] * I[c]); };           // omega0 = 1: the square of the perturbation rate, J^2 = mu 1 (T2)
const PRESETS = { paper: [100 * 5 / 12, 100 * 1.36 / 12, 100 * 4.36 / 12], repo: [100 * 4.36 / 12, 100 * 1.36 / 12, 100 * 5 / 12], sym: [30, 30, 55] };
export function FreeTop({ t }) {
  const [I, setI] = useState(PRESETS.paper), [axis, setAxis] = useState(2), [eps, setEps] = useState(15), [az, setAz] = useState(30), [play, setPlay] = useState(false), [speed, setSpeed] = useState(2), [, setTick] = useState(0), [preset, setPreset] = useState('paper');
  const Im = I.map(x => x / 100), mu = [0, 1, 2].map(a => topMu(Im, a)), order = [0, 1, 2].sort((a, b) => Im[a] - Im[b]), mid = order[1];
  const A = useMemo(() => alg(3), []), cc = useMemo(() => { const c = A.z(); for (const m of A.BIV) c[m] = m & 1 ? 1 : 0; c[0b1100] = Im[0]; c[0b1010] = Im[1]; c[0b0110] = Im[2]; return c; }, [A, I]);
  const init = useMemo(() => { const e = eps / 100, L = [0, 0, 0]; L[axis] = 1; L[(axis + 1) % 3] = e; L[(axis + 2) % 3] = e / 2; const nl = Math.hypot(...L), B = A.z(); B[0b1100] = L[0] / nl / Im[0]; B[0b1010] = -L[1] / nl / Im[1]; B[0b0110] = L[2] / nl / Im[2]; return { M: A.motor([0, 0, 0], []), B }; }, [A, I, axis, eps]);
  const sim = useRef(null);
  useEffect(() => { sim.current = { init, st: init, trail: [], t: 0, flips: 0, e0: kinetic(A, init.B, cc), l0: Math.hypot(...Lof(init.B)) }; setPlay(false); setTick(x => x + 1); }, [init, cc, A]);
  const Lof = B => [cc[0b1100] * B[0b1100], -cc[0b1010] * B[0b1010], cc[0b0110] * B[0b0110]];
  const cur = sim.current && sim.current.init === init ? sim.current : { init, st: init, trail: [], t: 0, flips: 0, e0: kinetic(A, init.B, cc), l0: Math.hypot(...Lof(init.B)) };
  const advance = steps => { const s = sim.current; if (!s || s.init !== init) return; let st = s.st; for (let i = 0; i < steps; i++) { const prev = Lof(st.B)[axis]; st = stepRK4(A, st, cc, null, 0.01); const now = Lof(st.B)[axis]; if (prev * now < 0) s.flips++; if (i % 3 === 0) s.trail.push(Lof(st.B)); } if (s.trail.length > 500) s.trail.splice(0, s.trail.length - 500); s.st = st; s.t += steps * 0.01; setTick(x => x + 1); };
  useTicker(play, () => advance(3 * speed));
  const polhodes = useMemo(() => { const out = []; const N = 26, gold = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < N; i++) { const z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z); let L = [r * Math.cos(gold * i), r * Math.sin(gold * i), z]; const L0 = L, pts = [L]; for (let s = 0; s < 420; s++) { L = rk4L(L, Im, 0.03); pts.push(L); if (s > 30 && Math.hypot(L[0] - L0[0], L[1] - L0[1], L[2] - L0[2]) < 0.04) break; } out.push(pts); } return out; }, [I]);
  const el = 0.5, ca = Math.cos(az * Math.PI / 180), sa = Math.sin(az * Math.PI / 180), R = 95, cx = 120, cy = 112;
  const pj = p => { const x = p[0] * ca - p[1] * sa, y = p[0] * sa + p[1] * ca; return [cx + R * x, cy - R * (p[2] * Math.cos(el) - y * Math.sin(el)), y * Math.cos(el) + p[2] * Math.sin(el)]; };
  const paths = pts => { let f = '', b = '', lf = false, lb = false; pts.forEach(p => { const q = pj(p), front = q[2] <= 0; const seg = `${q[0].toFixed(1)} ${q[1].toFixed(1)}`; if (front) { f += (lf ? 'L' : 'M') + seg; lf = true; lb = false; } else { b += (lb ? 'L' : 'M') + seg; lb = true; lf = false; } }); return [f, b]; };
  const Lc = Lof(cur.st.B), nl = Math.hypot(...Lc), Ln = Lc.map(x => x / nl), E = kinetic(A, cur.st.B, cc);
  const sizes = [6 * (Im[1] + Im[2] - Im[0]), 6 * (Im[0] + Im[2] - Im[1]), 6 * (Im[0] + Im[1] - Im[2])].map(x => Math.sqrt(Math.max(0.04, x)));
  const Vb = verticesFrame(A, cur.st.M, sizes), P3 = Vb.map(p => project(3, p, 0)), Eb = edgeList(3), bs = 34;
  const kindOf = a => (mu[a] > 1e-9 ? 'inv' : mu[a] < -1e-9 ? 'osc' : 'free'), axNames = ['x', 'y', 'z'];
  return <div className="eq-card sp-w rg-w-top"><p>{t.lede}</p>
    <Chips items={['paper', 'repo', 'sym']} value={preset} onPick={k => { setPreset(k); setI(PRESETS[k]); setAxis(k === 'sym' ? 0 : k === 'paper' ? 2 : 0); }} label={t.presetLbl} fmt={k => t.presets[k]} />
    {[0, 1, 2].map(a => <label key={a} className="sp-sl">{t.moment(axNames[a])}<input type="range" min="5" max="100" value={Math.round(I[a])} aria-label={t.moment(axNames[a])} className={'rg-I' + a} onChange={e => { setPreset(''); setI(I.map((x, i) => (i === a ? +e.target.value : x))); }} /><span className="eq-mono">I<sub>{axNames[a]}</sub> = {f3(Im[a])}</span></label>)}
    <Chips items={[0, 1, 2]} value={axis} onPick={setAxis} label={t.axisLbl} fmt={a => t.axisChip(axNames[a], a === mid ? t.middle : a === order[0] ? t.smallest : t.largest)} />
    <label className="sp-sl">{t.eps}<input type="range" min="1" max="80" value={eps} aria-label={t.eps} className="rg-eps" onChange={e => setEps(+e.target.value)} /><span className="eq-mono">{(eps / 100).toFixed(2)}</span></label>
    <label className="sp-sl">{t.az}<input type="range" min="0" max="359" value={az} aria-label={t.az} className="rg-az" onChange={e => setAz(+e.target.value)} /><span className="eq-mono">{az}°</span></label>
    <div className="sp-sl"><button className="eq-btn rg-play" aria-pressed={play} onClick={() => setPlay(p => !p)}>{play ? t.pause : t.play}</button><button className="eq-btn rg-step" onClick={() => advance(60)}>{t.step}</button><Chips items={[1, 2, 6]} value={speed} onPick={setSpeed} label={t.speedLbl} fmt={k => `×${k}`} /><span className="eq-mono rg-time">t = {f2(cur.t)}</span></div>
    <svg className="eq-svg rg-svg" viewBox="0 0 360 224" role="img" aria-label={t.cap}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" opacity=".35" />
      {polhodes.map((pts, i) => { const [f, b] = paths(pts); return <g key={i}><path d={b} fill="none" stroke="currentColor" opacity=".13" /><path d={f} fill="none" stroke="currentColor" opacity=".3" /></g>; })}
      {[0, 1, 2].flatMap(a => [1, -1].map(sg => { const p = [0, 0, 0]; p[a] = sg; const q = pj(p); return <g key={a + '' + sg} className="rg-pole" data-axis={a} data-kind={kindOf(a)}><circle cx={q[0]} cy={q[1]} r={q[2] <= 0 ? 6 : 4} fill={kindOf(a) === 'inv' ? NEG : kindOf(a) === 'osc' ? POS : GRN} opacity={q[2] <= 0 ? 1 : 0.45} /><text x={q[0] + 7} y={q[1] - 6} fontSize="10" fill="currentColor" opacity={q[2] <= 0 ? 0.9 : 0.4}>{sg > 0 ? '+' : '−'}{axNames[a]}</text></g>; }))}
      <path d={paths(cur.trail)[0]} fill="none" stroke={RED} strokeWidth="1.6" /><path d={paths(cur.trail)[1]} fill="none" stroke={RED} strokeWidth="1" opacity=".3" />
      {(() => { const q = pj(Ln); return <circle cx={q[0]} cy={q[1]} r="5" fill={RED} className="rg-dot" />; })()}
      <g transform="translate(262 112)">{Eb.map(([a, b]) => <line key={a + '-' + b} x1={bs * P3[a][0]} y1={-bs * P3[a][1]} x2={bs * P3[b][0]} y2={-bs * P3[b][1]} stroke="currentColor" opacity=".7" />)}</g></svg>
    <p className="eq-cap">{t.cap}</p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab rg-axes"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{[0, 1, 2].map(a => <tr key={a} data-axis={a} data-kind={kindOf(a)} className={a === axis ? 'on' : ''}><td>{axNames[a]}</td><td>{f3(Im[a])}</td><td className="eq-mono">{f3(mu[a])}</td><td>{kindOf(a) === 'inv' ? t.kinds.inv(f2(Math.sqrt(mu[a])), f2(1 / Math.sqrt(mu[a]))) : kindOf(a) === 'osc' ? t.kinds.osc(f2(Math.sqrt(-mu[a])), f2(2 * Math.PI / Math.sqrt(-mu[a]))) : t.kinds.free}</td></tr>)}</tbody></table></div>
    <p className="sp-out rg-cons">{t.cons(f4(nl), f4(E), f4(cur.e0))} <Mark ok={Math.abs(nl - cur.l0) < 1e-6 && Math.abs(E - cur.e0) < 1e-6} /></p>
    <p className="sp-out rg-flips">{t.flips(axNames[axis], cur.flips)}</p>
    <p className="sp-out rg-size">{t.size(sizes.map(f2).join(' × '))}</p></div>;
}

// ---------------------------------------------------------------- 7. later rungs: the moon (two bodies in the plane) and the planets (six bodies in space), Newton on PGA points and ideal vectors
const euler1 = (st, mass, G, h) => { const a = newtonAcc(st.x, mass, G, st.x.map(p => p.map(() => 0))); return { x: st.x.map((p, i) => p.map((c, k) => c + h * st.v[i][k])), v: st.v.map((p, i) => p.map((c, k) => c + h * a[i][k])) }; };
const moonInit = f => { const { mE, mM, vM, d } = MOON, cog = d * mM / (mE + mM); return { x: [[-cog, 0], [d - cog, 0]], v: [[0, -vM * f * cog / d], [0, vM * f * (d - cog) / d]] }; };
const PL = Object.keys(PD.planets_data), PL_COL = { Sun: '#fbbf24', Mercury: '#9ca3af', Venus: '#fde68a', Earth: '#60a5fa', Mars: '#f87171', Jupiter: '#fb923c' };
const planetsInit = () => ({ x: PL.map(k => PD.planets_data[k].pos_km.map(Number)), v: PL.map(k => PD.planets_data[k].vel_kms.map(Number)) });
const PMASS = PL.map(k => Number(PD.planets_data[k].mass_kg)), PG = PLANET_G;
export function Orbits({ t }) {
  const [which, setWhich] = useState('moon'), [integ, setInteg] = useState('rk4'), [dt, setDt] = useState(5000), [vf, setVf] = useState(100), [speed, setSpeed] = useState(1), [play, setPlay] = useState(false), [, setTick] = useState(0), [rad, setRad] = useState('sqrt'), [pdt, setPdt] = useState(14400);
  const mass = which === 'moon' ? [MOON.mE, MOON.mM] : PMASS, G = which === 'moon' ? MOON.G : PG, h = which === 'moon' ? dt : pdt, f = vf / 100;
  const sim = useRef(null), key = which + integ + h + f;
  const mkSim = () => { const st = which === 'moon' ? moonInit(f) : planetsInit(), a0 = which === 'moon' ? 0 : Math.atan2(st.x[3][1] - st.x[0][1], st.x[3][0] - st.x[0][0]); return { key, st, e0: energyBodies(st, mass, G), t: 0, trail: PL.map(() => []), mtrail: [], rev: 0, last: 0, below: false, th: [a0, 0] }; };
  useEffect(() => { sim.current = mkSim(); setPlay(false); setTick(x => x + 1); }, [key]);
  const cur = sim.current && sim.current.key === key ? sim.current : mkSim();
  const advance = k => {
    const s = sim.current; if (!s || s.key !== key) return; let st = s.st;
    for (let i = 0; i < k; i++) {
      const prevY = st.x[1][1] - st.x[0][1]; st = integ === 'rk4' ? rk4Bodies(st, mass, G, h) : euler1(st, mass, G, h); s.t += h;
      if (which === 'moon') { const y = st.x[1][1] - st.x[0][1]; if (prevY < 0 && y >= 0 && st.x[1][0] > st.x[0][0]) { s.rev++; s.last = s.t; } }
      if (i % 3 === 0) { if (which === 'moon') s.mtrail.push([st.x[1][0] - st.x[0][0], st.x[1][1] - st.x[0][1]]); else st.x.forEach((p, b) => s.trail[b].push([p[0] - st.x[0][0], p[1] - st.x[0][1]])); }
    }
    if (which === 'moon' && s.mtrail.length > 400) s.mtrail.splice(0, s.mtrail.length - 400); else s.trail.forEach(tr => { if (tr.length > 360) tr.splice(0, tr.length - 360); });
    if (which === 'planets') { const e = st.x[3], su = st.x[0], ang = Math.atan2(e[1] - su[1], e[0] - su[0]); let d = ang - s.th[0]; d = Math.atan2(Math.sin(d), Math.cos(d)); s.th[1] += d; s.th[0] = ang; }
    s.st = st; setTick(x => x + 1);
  };
  useTicker(play, () => advance(which === 'moon' ? 4 * speed : 6 * speed));
  const en = energyBodies(cur.st, mass, G), e0 = cur.e0, dE = Math.abs((en.E - e0.E) / e0.E), dL = Math.abs((en.Lz - e0.Lz) / e0.Lz);
  const days = cur.t / 86400, date = new Date(Date.UTC(2018, 0, 16) + cur.t * 1000);
  const rel = (b) => [cur.st.x[b][0] - cur.st.x[0][0], cur.st.x[b][1] - cur.st.x[0][1]];
  const ex = PD.moon, mu = G * (MOON.mE + MOON.mM), r0 = MOON.d, v2 = (MOON.vM * f) ** 2, aK = 1 / (2 / r0 - v2 / mu), eK = r0 * v2 / mu - 1, TK = aK > 0 ? 2 * Math.PI * Math.sqrt(aK ** 3 / mu) / 86400 : NaN;
  const ms = which === 'moon' ? 150 / (aK > 0 ? Math.max(r0, aK * (1 + Math.abs(eK))) * 1.05 : 8e8) : 0, planetPos = b => { const p = rel(b), r = Math.hypot(p[0], p[1]) || 1, rr = rad === 'sqrt' ? 150 * Math.sqrt(r / 8.5e8) : 150 * r / 8.5e8; return [180 + rr * p[0] / r, 130 - rr * p[1] / r]; };
  const planetEarthRev = cur.th[1] / (2 * Math.PI), momFrac = Math.hypot(...en.P) / cur.st.v.reduce((s, v, i) => s + mass[i] * Math.hypot(...v), 0);
  return <div className="eq-card sp-w rg-w-orb"><p>{t.lede}</p>
    <Chips items={['moon', 'planets']} value={which} onPick={setWhich} label={t.whichLbl} fmt={k => t.which[k]} />
    <Chips items={['rk4', 'euler']} value={integ} onPick={setInteg} label={t.integLbl} fmt={k => t.integ[k]} />
    {which === 'moon' ? <>
      <label className="sp-sl">{t.dt}<input type="range" min="1000" max="120000" step="1000" value={dt} aria-label={t.dt} className="rg-dt" onChange={e => setDt(+e.target.value)} /><span className="eq-mono">Δt = {dt} s</span></label>
      <label className="sp-sl">{t.vf}<input type="range" min="60" max="140" value={vf} aria-label={t.vf} className="rg-vf" onChange={e => setVf(+e.target.value)} /><span className="eq-mono">{(f * MOON.vM).toFixed(0)} m/s</span></label></> : <>
      <label className="sp-sl">{t.dt}<input type="range" min="3600" max="432000" step="3600" value={pdt} aria-label={t.dt} className="rg-pdt" onChange={e => setPdt(+e.target.value)} /><span className="eq-mono">Δt = {(pdt / 3600).toFixed(0)} h</span></label>
      <Chips items={['sqrt', 'lin']} value={rad} onPick={setRad} label={t.radLbl} fmt={k => t.rad[k]} /></>}
    <div className="sp-sl"><button className="eq-btn rg-play" aria-pressed={play} onClick={() => setPlay(p => !p)}>{play ? t.pause : t.play}</button><button className="eq-btn rg-step" onClick={() => advance(which === 'moon' ? 100 : 60)}>{t.step}</button><button className="eq-btn rg-reset" onClick={() => { sim.current = mkSim(); setPlay(false); setTick(x => x + 1); }}>{t.reset}</button><Chips items={[1, 4, 16]} value={speed} onPick={setSpeed} label={t.speedLbl} fmt={k => `×${k}`} /></div>
    <svg className="eq-svg rg-svg" viewBox="0 0 360 260" role="img" aria-label={t.cap[which]}>
      {which === 'moon' ? <g>
        <path d={cur.mtrail.map((p, i) => (i ? 'L' : 'M') + (180 + ms * p[0]).toFixed(1) + ' ' + (130 - ms * p[1]).toFixed(1)).join(' ')} fill="none" stroke={POS} opacity=".5" />
        <circle cx="180" cy="130" r="6" fill="#34d399" /><text x="188" y="126" fontSize="10" fill="currentColor">{t.earth}</text>
        {(() => { const p = [cur.st.x[1][0] - cur.st.x[0][0], cur.st.x[1][1] - cur.st.x[0][1]]; return <g className="rg-moon"><circle cx={180 + ms * p[0]} cy={130 - ms * p[1]} r="3.6" fill={NEG} /><text x={188 + ms * p[0]} y={126 - ms * p[1]} fontSize="10" fill="currentColor">{t.moon}</text></g>; })()}</g> : <g>
        <circle cx="180" cy="130" r="5" fill={PL_COL.Sun} /><text x="187" y="126" fontSize="9" fill="currentColor">{PL[0]}</text>
        {PL.slice(1).map((k, i) => { const b = i + 1; const q = planetPos(b); return <g key={k} className="rg-planet" data-name={k}><path d={cur.trail[b].map((p, j) => { const r = Math.hypot(p[0], p[1]) || 1, rr = rad === 'sqrt' ? 150 * Math.sqrt(r / 8.5e8) : 150 * r / 8.5e8; return (j ? 'L' : 'M') + (180 + rr * p[0] / r).toFixed(1) + ' ' + (130 - rr * p[1] / r).toFixed(1); }).join(' ')} fill="none" stroke={PL_COL[k]} opacity=".5" /><circle cx={q[0]} cy={q[1]} r="3.2" fill={PL_COL[k]} /><text x={q[0] + 5} y={q[1] - 4} fontSize="8" fill="currentColor" opacity=".85">{k}</text></g>; })}</g>}</svg>
    <p className="eq-cap">{t.cap[which]}</p>
    {which === 'moon' ? <>
      <p className="sp-out rg-moon-now">{t.moonNow(Math.round(Math.hypot(...rel(1)) / 1000), Math.round(Math.hypot(cur.st.v[1][0] - cur.st.v[0][0], cur.st.v[1][1] - cur.st.v[0][1])), f2(days))}</p>
      <p className="sp-out rg-moon-rev">{cur.rev ? t.moonRev(cur.rev, f2(cur.last / 86400 / cur.rev)) : t.moonNoRev}</p>
      <p className="sp-out rg-moon-kep">{t.moonKepler(f4(eK), Math.round(aK / 1000), f2(TK))}{f === 1 && <> · {t.moonExact(ex.e, ex.a_km, ex.period_days)}</>}</p></> : <>
      <p className="sp-out rg-pl-now">{t.plNow(date.toISOString().slice(0, 10), f2(days), f2(planetEarthRev), planetEarthRev >= 1 ? f2(days / planetEarthRev) : '–')}</p>
      <p className="sp-out rg-pl-mom">{t.plMom(f3(momFrac), PD.planets.momentum_fraction)}</p>
      <p className="eq-cap">{t.plNote}</p></>}
    <p className="sp-out rg-orb-cons">{t.cons(dE.toExponential(1), dL.toExponential(1), integ)} <Mark ok={dE < 1e-6} /></p></div>;
}
