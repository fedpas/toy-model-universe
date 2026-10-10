import React, { useState, useMemo } from 'react';
import { pc, planar, kinds, pseudoscalar, labelling, spinors, pointorSample, PKINDS, hestenes, cl13, EVEN, chirality } from './spinEngine.js';

// The live widgets of step 11. Each one recomputes in the browser, with the bit-rule engine of spinEngine.js, a statement that
// selfcheck/spin_selfcheck.py proves exactly; the page's test compares the two. All numbers are floating point and are compared to 1e-7.
const f3 = x => { const r = Math.abs(x) < 5e-7 ? 0 : Math.round(x * 1000) / 1000; return String(r).replace('-', '−'); };
const sgn = s => (s > 0 ? '+' : '−');
const Chips = ({ items, value, onPick, label, fmt = x => String(x) }) => <div className="eq-chips" role="group" aria-label={label}>{items.map(i => <button key={String(i)} className={'eq-chip' + (String(i) === String(value) ? ' on' : '')} aria-pressed={String(i) === String(value)} onClick={() => onPick(i)}>{fmt(i)}</button>)}</div>;
const Mark = ({ ok }) => <span className={'sp-mark ' + (ok ? 'ok' : 'bad')} aria-label={ok ? 'true' : 'false'}>{ok ? '✓' : '✗'}</span>;

// ---------------------------------------------------------------- 1. reflect: the double cover
export function RotorDial({ t }) {
  const [n, setN] = useState(6);
  const th = n * Math.PI / 12, r = useMemo(() => planar(th), [th]), deg = n * 15;
  const [a, b] = r.R, vx = r.vec[0], vy = r.vec[1];
  const near = (x, y) => Math.abs(x - y) < 1e-9;
  const name = near(a, 1) ? t.states[0] : near(a, -1) ? t.states[1] : near(b, 1) ? t.states[2] : near(b, -1) ? t.states[3] : null;
  const back = near(vx, 0) && near(vy, 1);
  return <div className="eq-card sp-w sp-w-reflect"><p>{t.lede}</p>
    <label className="sp-sl">{t.slider}<input type="range" min="0" max="48" step="1" value={n} aria-label={t.slider} className="sp-slider" onChange={e => setN(+e.target.value)} /><span className="eq-mono">t = {deg}°</span></label>
    <svg className="eq-svg" viewBox="0 0 440 190" role="img" aria-label={t.cap}>
      <g transform="translate(110,95)"><circle r="70" fill="none" stroke="currentColor" opacity=".25" /><line x1="-78" y1="0" x2="78" y2="0" stroke="currentColor" opacity=".25" /><line x1="0" y1="-78" x2="0" y2="78" stroke="currentColor" opacity=".25" />
        <line x1="0" y1="0" x2="0" y2="-70" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" /><line x1="0" y1="0" x2={70 * vx} y2={-70 * vy} stroke="#fbbf24" strokeWidth="2.5" className="sp-vec" />
        <circle cx={70 * vx} cy={-70 * vy} r="4" fill="#fbbf24" /><text x="-104" y="-76" fontSize="11" fill="currentColor">{t.vecLbl}</text></g>
      <g transform="translate(330,95)"><circle r="70" fill="none" stroke="currentColor" opacity=".25" /><line x1="-78" y1="0" x2="78" y2="0" stroke="currentColor" opacity=".25" /><line x1="0" y1="-78" x2="0" y2="78" stroke="currentColor" opacity=".25" />
        <line x1="0" y1="0" x2={70 * a} y2={-70 * b} stroke="#34d399" strokeWidth="2.5" className="sp-rot" /><circle cx={70 * a} cy={-70 * b} r="4" fill="#34d399" /><text x="-98" y="-76" fontSize="11" fill="currentColor">{t.rotLbl}</text>
        <text x="60" y="14" fontSize="10" fill="currentColor" opacity=".7">1</text><text x="-84" y="14" fontSize="10" fill="currentColor" opacity=".7">−1</text></g></svg>
    <p className="eq-cap">{t.cap}</p>
    <p className="sp-out">{t.line1(deg, f3(a), f3(b))}</p><p className="sp-out">{t.line2(2 * deg % 360, f3(vx), f3(vy), r.ok)} <Mark ok={r.ok} /></p>
    {name && <p className="sp-out sp-state"><b>{name}</b>{back ? ' · ' + t.back : ''}</p>}
    {near(a, -1) && back && <p className="eq-cap sp-double">{t.double}</p>}</div>;
}

// ---------------------------------------------------------------- 2. labels: cosets and the self-dual code
export function LabelExplorer({ t }) {
  const [d, setD] = useState(4), [sel, setSel] = useState(null);
  const L = useMemo(() => labelling(d), [d]), nm = m => L.E.name(m);
  const key = sel == null ? null : L.ms.map(m => (pc(sel & m) & 1 ? -1 : 1)).join(',');
  const chir = sel == null ? null : (pc(sel) & 1 ? -1 : 1);
  const plusKey = Array(L.k).fill(1).join(',');
  return <div className="eq-card sp-w sp-w-labels"><p>{t.lede}</p>
    <Chips items={[2, 4, 6]} value={d} onPick={x => { setD(x); setSel(null); }} label={t.dLbl} fmt={x => `d = ${x}  (k = ${x / 2})`} />
    <p className="eq-cap sp-masks">{t.masks(L.ms.map(m => `b${L.ms.indexOf(m) + 1} = ${nm(m)}`).join(', '))}</p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab sp-classes"><thead><tr><th>{t.cols[0]}</th><th>{t.cols[1]}</th><th>{t.cols[2]}</th></tr></thead><tbody>
      {[...L.cls.entries()].sort((p, q) => (p[0] === plusKey ? -1 : q[0] === plusKey ? 1 : 0)).map(([k, bl]) => <tr key={k} className={'sp-class' + (k === plusKey ? ' sp-H' : '') + (k === key ? ' on' : '')}>
        <td className="eq-mono">({k.split(',').map(x => sgn(+x)).join(', ')})</td><td>{bl.map(m => <button key={m} className={'sp-blade' + (m === sel ? ' on' : '')} onClick={() => setSel(m)} aria-label={nm(m)}>{nm(m)}</button>)}</td><td>{k === plusKey ? t.codeH : ''}</td></tr>)}</tbody></table></div>
    <p className="sp-out sp-checks">{t.checks(1 << d, L.cls.size)} <Mark ok={L.ok} /> · {t.hSame} <Mark ok={L.sameAsPlus} /> · {t.hSelf(L.H.length)} <Mark ok={L.selfDual} /></p>
    <p className="eq-cap sp-chir">{sel == null ? t.pickOne : t.chir(nm(sel), key.split(',').map(x => sgn(+x)).join(', '), sgn(chir), pc(sel) & 1 ? t.odd : t.even)}</p></div>;
}

// ---------------------------------------------------------------- 3. labels again: left, right and conjugation (Cl(7,0), i = I)
let SP7 = null; const sp7 = () => SP7 || (SP7 = spinors(3));
export function LeftRight({ t }) {
  const [sg, setSg] = useState([1, -1, 1]), P = sp7(), E = P.E;
  const res = useMemo(() => { const ph = P.phi(sg), iPhi = E.mul(P.I, ph); return [0, 1, 2].map(j => {
    const Bj = P.B(j), l = E.mul(Bj, ph), r = E.mul(ph, Bj), c = E.mul(E.mul(Bj, ph), E.inv(Bj)), sd = x => (E.eq(x, iPhi) ? 1 : E.eq(x, E.scale(iPhi, -1)) ? -1 : 0), sc = x => (E.eq(x, ph) ? 1 : E.eq(x, E.scale(ph, -1)) ? -1 : 0);
    return { l: sd(l), r: sd(r), c: sc(c) }; }); }, [sg]);
  const all = sg.every((s, j) => res[j].l === s && res[j].r === 1 && res[j].c === s);
  const keys = [...Array(8)].map((_, i) => [i & 1 ? -1 : 1, i & 2 ? -1 : 1, i & 4 ? -1 : 1]);
  return <div className="eq-card sp-w sp-w-lr"><p>{t.lede}</p>
    <Chips items={keys.map(k => k.join(','))} value={sg.join(',')} onPick={s => setSg(s.split(',').map(Number))} label={t.sigLbl} fmt={s => '(' + s.split(',').map(x => sgn(+x)).join(' ') + ')'} />
    <div style={{ overflowX: 'auto' }}><table className="sp-tab sp-lr"><thead><tr><th>{t.cols[0]}</th><th>B<sub>j</sub>Φ</th><th>ΦB<sub>j</sub></th><th>B<sub>j</sub>ΦB<sub>j</sub>⁻¹</th></tr></thead><tbody>
      {res.map((x, j) => <tr key={j}><td>j = {j + 1}</td><td className="eq-mono">{x.l ? sgn(x.l) + 'iΦ' : '?'}</td><td className="eq-mono">{x.r ? sgn(x.r) + 'iΦ' : '?'}</td><td className="eq-mono">{x.c ? sgn(x.c) + 'Φ' : '?'}</td></tr>)}</tbody></table></div>
    <p className="sp-out">{t.verdict} <Mark ok={all} /></p><p className="eq-cap">{t.cap}</p></div>;
}

// ---------------------------------------------------------------- 4. unit: the three kinds of i, and the fourth
export function ThreeI({ t }) {
  const [a, setA] = useState(1), [b, setB] = useState(1);
  const K = useMemo(() => kinds(a, b), [a, b]);
  const nameOf = s => (s === null ? t.none : s < 0 ? t.sys[0] : s > 0 ? t.sys[1] : t.sys[2]);
  const sq = s => (s === null ? '—' : f3(s));
  const rows = [[t.k1, t.g1, K.k1], [t.k2, t.g2, K.k2], [t.k3, t.g3(K.ref), K.k3]];
  const ps = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8].map(d => ({ d, ...pseudoscalar(d) })), []);
  const lbl = s => (s === -1 ? '−1' : s === 1 ? '+1' : '0');
  return <div className="eq-card sp-w sp-w-three"><p>{t.lede}</p>
    <div className="sp-pair"><span>{t.aLbl}</span><Chips items={[-1, 0, 1]} value={a} onPick={setA} label={t.aLbl} fmt={lbl} /><span>{t.bLbl}</span><Chips items={[-1, 0, 1]} value={b} onPick={setB} label={t.bLbl} fmt={lbl} /></div>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab sp-three"><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {rows.map(([nm, gr, s], i) => <tr key={i} data-kind={i + 1}><td>{nm}</td><td className="eq-mono">{gr}</td><td className="eq-mono sp-sq">{sq(s)}</td><td>{nameOf(s)}</td></tr>)}</tbody></table></div>
    <p className="eq-cap">{t.cap}</p>
    <h5>{t.fourthH}</h5><p className="eq-cap">{t.fourth}</p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab sp-fourth"><thead><tr><th>d</th>{ps.map(p => <th key={p.d}>{p.d}</th>)}</tr></thead><tbody>
      <tr><td className="eq-mono">I²</td>{ps.map(p => <td key={p.d} className="eq-mono">{lbl(p.sq)}</td>)}</tr><tr><td>{t.central}</td>{ps.map(p => <td key={p.d}>{p.central ? '✓' : '·'}</td>)}</tr></tbody></table></div></div>;
}

// ---------------------------------------------------------------- 5. spaces: Spin(2k) keeps the halves, Spin(2k+1) mixes them
let SP3 = null; const sp3 = () => SP3 || (SP3 = spinors(1));
export function MixHalves({ t }) {
  const [n, setN] = useState(3), [kind, setKind] = useState('w');
  const P = sp3(), E = P.E, th = n * Math.PI / 12, a = Math.cos(th), s = Math.sin(th);
  const r = useMemo(() => {
    const Pl = P.phi([1]), wv = E.mul(P.w, P.v(0)), G = kind === 'w' ? wv : P.B(0), R = E.add(E.scale(E.one, a), E.scale(G, s)), X = E.mul(R, Pl), wi = E.inv(P.w);
    const sw = E.mul(E.mul(P.w, X), wi), ev = E.scale(E.add(X, sw), .5), od = E.scale(E.add(X, sw, -1), .5);
    const nr = M => Math.sqrt([...M.values()].reduce((q, x) => q + x * x, 0)), n0 = nr(Pl);
    return { e: nr(ev) / n0, o: nr(od) / n0, X, Pl };
  }, [n, kind]);
  const mixes = r.o > 1e-9;
  return <div className="eq-card sp-w sp-w-mix"><p>{t.lede}</p>
    <Chips items={['B', 'w']} value={kind} onPick={setKind} label={t.kindLbl} fmt={k => t.kinds[k]} />
    <label className="sp-sl">{t.slider}<input type="range" min="0" max="48" step="1" value={n} aria-label={t.slider} className="sp-slider" onChange={e => setN(+e.target.value)} /><span className="eq-mono">t = {n * 15}°</span></label>
    <svg className="eq-svg" viewBox="0 0 440 70" role="img" aria-label={t.cap}><rect x="20" y="14" width={400 * Math.min(1, r.e)} height="18" fill="#60a5fa" className="sp-bar-e" /><rect x="20" y="40" width={400 * Math.min(1, r.o)} height="18" fill="#f87171" className="sp-bar-o" />
      <text x="24" y="27" fontSize="11" fill="currentColor">S⁺ (even) {f3(r.e)}</text><text x="24" y="53" fontSize="11" fill="currentColor">S⁻ (odd) {f3(r.o)}</text></svg>
    <p className="sp-out">{mixes ? t.mixes : t.keeps}</p><p className="eq-cap">{t.cap}</p></div>;
}

// ---------------------------------------------------------------- 6. states: phases, overall and relative
export function PhaseExplorer({ t }) {
  const P = sp7(), E = P.E;
  const [s1, setS1] = useState('1,1,1'), [s2, setS2] = useState('1,-1,-1'), [j, setJ] = useState(0), [n, setN] = useState(4), [c2, setC2] = useState(3);
  const keys = [...Array(8)].map((_, i) => [i & 1 ? -1 : 1, i & 2 ? -1 : 1, i & 4 ? -1 : 1].join(','));
  const th = n * Math.PI / 12, a = Math.cos(th), b = Math.sin(th);
  const r = useMemo(() => {
    const S = s1.split(',').map(Number), T = s2.split(',').map(Number), A = P.phi(S), Bq = P.phi(T), R = E.add(E.scale(E.one, a), E.scale(P.B(j), b));
    const M = E.add(A, E.scale(Bq, c2 / 2)), RM = E.mul(R, M), exp = E.add(E.mul(P.cx(a, b * S[j]), A), E.mul(P.cx(a, b * T[j]), E.scale(Bq, c2 / 2)));
    const overall = E.eq(RM, E.mul(P.cx(a, b * S[j]), M)), pure = E.eq(E.mul(R, A), E.mul(P.cx(a, b * S[j]), A));
    return { S, T, formula: E.eq(RM, exp), overall, pure, same: S[j] === T[j], same12: s1 === s2 };
  }, [s1, s2, j, n, c2]);
  const deg = n * 15;
  return <div className="eq-card sp-w sp-w-phase"><p>{t.lede}</p>
    <div className="sp-pair"><span>{t.first}</span><Chips items={keys} value={s1} onPick={setS1} label={t.first} fmt={s => '(' + s.split(',').map(x => sgn(+x)).join(' ') + ')'} /></div>
    <div className="sp-pair"><span>{t.second}</span><Chips items={keys} value={s2} onPick={setS2} label={t.second} fmt={s => '(' + s.split(',').map(x => sgn(+x)).join(' ') + ')'} /></div>
    <div className="sp-pair"><span>{t.plane}</span><Chips items={[0, 1, 2]} value={j} onPick={setJ} label={t.plane} fmt={x => `B${x + 1}`} /><span>{t.weight}</span><Chips items={[1, 2, 3, 4]} value={c2} onPick={setC2} label={t.weight} fmt={x => `${x}/2`} /></div>
    <label className="sp-sl">{t.slider}<input type="range" min="0" max="24" step="1" value={n} aria-label={t.slider} className="sp-slider" onChange={e => setN(+e.target.value)} /><span className="eq-mono">t = {deg}°</span></label>
    <p className="sp-out sp-pure">{t.pure(sgn(r.S[j]), deg, r.S[j] * deg)} <Mark ok={r.pure} /></p>
    <p className="sp-out sp-mixed">{r.same ? t.overall(deg * r.S[j]) : t.relative(deg * r.S[j], deg * r.T[j], deg * (r.S[j] - r.T[j]))} <Mark ok={r.formula && r.overall === r.same} /></p>
    <p className="eq-cap">{t.cap}</p></div>;
}

// ---------------------------------------------------------------- 7. pointors: which sums keep the point fixed
export function PointorTest({ t }) {
  const [kind, setKind] = useState('vR'), [seed, setSeed] = useState(1);
  const tally = useMemo(() => Object.fromEntries(PKINDS.map(k => [k, [...Array(12)].filter((_, i) => pointorSample(k, i + 1).ok).length])), []);
  const r = useMemo(() => pointorSample(kind, seed), [kind, seed]);
  return <div className="eq-card sp-w sp-w-pointor"><p>{t.lede}</p>
    <Chips items={PKINDS} value={kind} onPick={setKind} label={t.kindLbl} fmt={k => t.kinds[k]} />
    <p className="sp-out sp-sample">ψ = {r.txt} · {t.sampleNo(seed)} <button className="eq-btn sp-new" onClick={() => setSeed(s => s + 1)}>{t.again}</button></p>
    <p className="sp-out sp-verdict">{r.ok ? t.yes(f3(r.lam)) : t.no} <Mark ok={r.ok === (kind !== 'unrelated')} /></p>
    <div style={{ overflowX: 'auto' }}><table className="sp-tab sp-tally"><thead><tr><th>{t.cols[0]}</th><th>{t.cols[1]}</th></tr></thead><tbody>{PKINDS.map(k => <tr key={k} data-kind={k}><td>{t.kinds[k]}</td><td className="eq-mono">{tally[k]}/12</td></tr>)}</tbody></table></div>
    <p className="eq-cap">{t.cap}</p></div>;
}

// ---------------------------------------------------------------- 8. Hestenes spinors in Cl(1,3): the b = 0 slice and the XOR 9 chirality
export function HestenesSlice({ t }) {
  const [kind, setKind] = useState('generic'), [seed, setSeed] = useState(1);
  const r = useMemo(() => hestenes(kind, seed), [kind, seed]);
  const agree = useMemo(() => [...Array(24)].filter((_, i) => { const h = hestenes('generic', i + 1); return h.ok === (Math.abs(h.b) < 1e-9); }).length, []);
  const chi = useMemo(() => chirality(), []);
  const nm = m => cl13().name(m);
  return <div className="eq-card sp-w sp-w-hest"><p>{t.lede}</p>
    <Chips items={['generic', 'versor']} value={kind} onPick={setKind} label={t.kindLbl} fmt={k => t.kinds[k]} />
    <p className="sp-out sp-sample">{t.sample(seed)} <button className="eq-btn sp-new" onClick={() => setSeed(s => s + 1)}>{t.again}</button></p>
    <p className="sp-out sp-hv">ψψ̃ = {f3(r.a)} {r.b < 0 ? '−' : '+'} {f3(Math.abs(r.b))}·I {r.other ? '(+ ?)' : ''} · {r.ok ? t.pointor : t.notPointor} <Mark ok={r.ok === (Math.abs(r.b) < 1e-9) && !r.other} /></p>
    <p className="eq-cap sp-agree">{t.agree(agree, 24)}</p>
    <h5>{t.chiH}</h5><div style={{ overflowX: 'auto' }}><table className="sp-tab sp-xor"><thead><tr><th>e<sub>x</sub></th><th>IψJ</th><th>x ⊕ 9</th></tr></thead><tbody>
      {chi.map(c => <tr key={c.x}><td className="eq-mono">{nm(c.x)}</td><td className="eq-mono">{c.s < 0 ? '−' : '+'}{nm(c.m)}</td><td><Mark ok={c.ok} /></td></tr>)}</tbody></table></div><p className="eq-cap">{t.chiCap}</p></div>;
}
