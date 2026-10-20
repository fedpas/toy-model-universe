import React, { useState } from 'react';
import M from './maxwellData';
import { MAXWELL_PY } from './maxwellSelfcheckSource';

const COL = { E: '#4cc9f0', B: '#ffa06f', J: '#4fd18b', F: '#a78bfa', D: '#ff5d8f', T: '#2ec4b6', one: '#8b93a8' };
const roleColor = r => r === 'E' ? COL.E : r === 'T' ? COL.T : r === 'B' ? COL.B : (r === 'rho' || r === 'J') ? COL.J : r === 'Faraday' ? COL.F : r === 'divB' ? COL.D : COL.one;
const AXN = ['t', 'x', 'y', 'z', 'w'];
const SUB = s => s.replace('E_x', 'Eₓ').replace('J_x', 'Jₓ');

const T = {
  en: {
    eyebrow: 'MAXWELL · 1–4 SPACE AND 1–4 TIME DIMENSIONS', title: 'Maxwell’s equations in four views',
    lede: 'The electromagnetic field is one object F in a small Clifford algebra, and Maxwell’s equations are the single equation ∇F = J. Each term is one move: take a piece of F and add or drop one direction. We draw that move four ways: as algebra, on a simplex, on a cube, and on whole numbers. Choose how many space dimensions you want, then pick an equation to see its terms light up in all four views.',
    dimH: 'How many space dimensions?', dims: ['1 space dimension (a line)', '2 space dimensions (a plane)', '3 space dimensions (our world)', '4 space dimensions (one step up)'], pickEq: 'Pick an equation',
    clif: 'Clifford: what ∂ times each piece of F gives', simp: ['Simplex: a segment', 'Simplex: faces of a triangle', 'Simplex: faces of a tetrahedron', 'Simplex: a 4-simplex (pentagon with all diagonals)'], cube: ['Cube: a square, bits flip along an axis', 'Cube: bits flip along an axis', 'Cube: a 4-cube (two 3-cubes joined along z)', 'Cube: a 5-cube (four 3-cubes in a 2×2 grid)'], prime: 'Prime: the same moves as XOR on labels',
    contract: 'drop a vertex (divergence part, grade 1)', wedge: 'add a vertex (curl part, grade 3)', all: 'all',
    key: ['Electric field E: the single edge. Charge and current J: the two vertices. With only one space direction there is no magnetic field and no Faraday law: they need a plane.',
      'Electric field E: the edges at the time vertex. Magnetic field B: the edge opposite it. Charge and current J: the vertices. Faraday’s law: the filled triangle.',
      'Electric field E: the 3 edges at the time vertex. Magnetic field B: the 3 edges of the opposite triangle. Charge and current J: the vertices. Faraday’s law: the 3 faces that contain the time vertex. No magnetic monopoles, ∇·B = 0: the opposite, purely spatial face.',
      'Same rules, one more direction: E is the 4 edges at the time vertex, B the 6 edges among the 4 space vertices, the 4 space triangles are the no-monopole conditions, and the 6 triangles with the time vertex are Faraday’s law. ∇F has 5 + 10 = 15 pieces. New: the pseudoscalar I is central with I² = +1, so the whole algebra splits in two (1 ± I)/2.'],
    conv: 'Convention found by exhaustive search (exactly two sign choices reproduce the standard equations, and they differ by an overall sign):',
    note: 'This is standard geometric-algebra electromagnetism (Hestenes’ spacetime algebra). What is ours is the reading of the same algebra as faces of a simplex, bit moves on a cube and XOR on integer labels. Gold labels mark primes: notation only, no meaning is claimed. Not claimed either: any link between this sector and Furey’s Cl(0,8) model. How the two sit together is open.',
    cons: 'Checked exactly on random polynomial fields, in each dimension: ∇∇F = □F (every component obeys the wave equation at speed 1); ∇F has only grade 1 and grade 3; the grade-0 part of ∇∇F vanishes, which is charge conservation; and the algebra’s terms into each target are exactly the derivative terms of the physical equation.',
    dlH: 'Check it yourself', dlText: 'One self-contained Python file (standard library only). It rebuilds the algebra from the bit rule for 1, 2, 3 and 4 space dimensions, finds the sign convention by exhaustive search, and asserts every statement above with exact arithmetic.', dlPy: 'Download maxwell_selfcheck.py', dlJson: 'Download maxwell.json', dlCmd: 'python3 maxwell_selfcheck.py --compare maxwell.json',
    ladH: 'Where the ladder goes next', ladNote: 'Numbers only. Each row is Cl(1,d): the algebra of d space dimensions plus time. When the central pseudoscalar squares to +1 the algebra splits in two (d = 4, 8); at d = 7 it is M16(ℝ), the same abstract algebra as Cl(0,8). That is a statement about the algebra only: no physical claim is made.', cols: ['space dims d', 'algebra Cl(1,d)', 'I²', 'F = E + B', 'equations ∇F'], same: 'same algebra as Cl(0,8)', splits: 'splits in two', cell: 'cell = coefficient of that blade in ∂·F', n0: '0 space dimensions would be time alone: one generator and no field, because a field strength needs a plane.'
  },
  it: {
    eyebrow: 'MAXWELL · 1–4 DIMENSIONI SPAZIALI E 1–4 TEMPORALI', title: 'Le equazioni di Maxwell in quattro viste',
    lede: 'Il campo elettromagnetico è un solo oggetto F in una piccola algebra di Clifford, e le equazioni di Maxwell sono l’unica equazione ∇F = J. Ogni termine è una mossa: prendi un pezzo di F e aggiungi o togli una direzione. Disegniamo la mossa in quattro modi: come algebra, su un simplesso, su un cubo e sui numeri interi. Scegli quante dimensioni spaziali vuoi, poi un’equazione, e vedi i suoi termini accendersi in tutte e quattro le viste.',
    dimH: 'Quante dimensioni spaziali?', dims: ['1 dimensione spaziale (una retta)', '2 dimensioni spaziali (un piano)', '3 dimensioni spaziali (il nostro mondo)', '4 dimensioni spaziali (un gradino in su)'], pickEq: 'Scegli un’equazione',
    clif: 'Clifford: che cosa dà ∂ per ogni pezzo di F', simp: ['Simplesso: un segmento', 'Simplesso: facce di un triangolo', 'Simplesso: facce di un tetraedro', 'Simplesso: un 4-simplesso (pentagono con tutte le diagonali)'], cube: ['Cubo: un quadrato, bit che si invertono lungo un asse', 'Cubo: bit che si invertono lungo un asse', 'Cubo: un 4-cubo (due 3-cubi uniti lungo z)', 'Cubo: un 5-cubo (quattro 3-cubi in una griglia 2×2)'], prime: 'Primi: le stesse mosse come XOR sulle etichette',
    contract: 'togli un vertice (parte divergenza, grado 1)', wedge: 'aggiungi un vertice (parte rotore, grado 3)', all: 'tutte',
    key: ['Campo elettrico E: l’unico spigolo. Carica e corrente J: i due vertici. Con una sola direzione spaziale non ci sono campo magnetico né legge di Faraday: servono un piano.',
      'Campo elettrico E: gli spigoli al vertice del tempo. Campo magnetico B: lo spigolo opposto. Carica e corrente J: i vertici. Legge di Faraday: il triangolo pieno.',
      'Campo elettrico E: i 3 spigoli al vertice del tempo. Campo magnetico B: i 3 spigoli del triangolo opposto. Carica e corrente J: i vertici. Legge di Faraday: le 3 facce che contengono il vertice del tempo. Niente monopoli magnetici, ∇·B = 0: la faccia opposta, puramente spaziale.',
      'Stesse regole, una direzione in più: E sono i 4 spigoli al vertice del tempo, B i 6 spigoli tra i 4 vertici spaziali, i 4 triangoli spaziali sono le condizioni di assenza di monopoli e i 6 triangoli con il vertice del tempo sono la legge di Faraday. ∇F ha 5 + 10 = 15 pezzi. Novità: lo pseudoscalare I è centrale con I² = +1, quindi tutta l’algebra si spezza in due (1 ± I)/2.'],
    conv: 'Convenzione trovata per ricerca esaustiva (esattamente due scelte di segno riproducono le equazioni standard, e differiscono per un segno globale):',
    note: 'È elettromagnetismo standard in algebra geometrica (l’algebra dello spaziotempo di Hestenes). Nostra è la lettura della stessa algebra come facce di un simplesso, mosse di bit su un cubo e XOR su etichette intere. Le etichette dorate segnano i primi: solo notazione, nessun significato è affermato. Non affermiamo nemmeno alcun legame tra questo settore e il modello Cl(0,8) di Furey: come stiano insieme è aperto.',
    cons: 'Verificato esattamente su campi polinomiali casuali, in ogni dimensione: ∇∇F = □F (ogni componente obbedisce all’equazione d’onda a velocità 1); ∇F ha solo grado 1 e grado 3; la parte di grado 0 di ∇∇F si annulla, cioè la conservazione della carica; e i termini dell’algebra verso ogni bersaglio sono esattamente i termini di derivata dell’equazione fisica.',
    dlH: 'Verificalo tu', dlText: 'Un unico file Python autonomo (solo libreria standard). Ricostruisce l’algebra dalla regola dei bit per 1, 2, 3 e 4 dimensioni spaziali, trova la convenzione dei segni per ricerca esaustiva e verifica ogni affermazione con aritmetica esatta.', dlPy: 'Scarica maxwell_selfcheck.py', dlJson: 'Scarica maxwell.json', dlCmd: 'python3 maxwell_selfcheck.py --compare maxwell.json',
    ladH: 'Dove porta la scala', ladNote: 'Solo numeri. Ogni riga è Cl(1,d): l’algebra di d dimensioni spaziali più il tempo. Quando lo pseudoscalare centrale ha quadrato +1 l’algebra si spezza in due (d = 4, 8); per d = 7 è M16(ℝ), la stessa algebra astratta di Cl(0,8). È un’affermazione solo sull’algebra: nessuna affermazione fisica.', cols: ['dim. spaziali d', 'algebra Cl(1,d)', 'I²', 'F = E + B', 'equazioni ∇F'], same: 'stessa algebra di Cl(0,8)', splits: 'si spezza in due', cell: 'cella = coefficiente di quel blade in ∂·F', n0: '0 dimensioni spaziali sarebbero il solo tempo: un generatore e nessun campo, perché l’intensità di campo richiede un piano.'
  }
};
const EQN = { it: { 'no monopole': 'niente monopoli' } };

function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }
const sgn = s => (s > 0 ? '+' : '−');
const bits = m => [0, 1, 2, 3, 4, 5, 6].filter(a => m >> a & 1);
const gname = (m, n) => m === 0 ? '1' : (bits(m).length === 3 && n === 3) ? 'I' : 'γ' + bits(m).join('');
const lit = (D, eq) => D.incidences.filter(i => eq === 'all' || i.target === D.equations.find(e => e.id === eq).target);

function Arrow({ x1, y1, x2, y2, c, w = 2, dash }) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hx = x2 - ux * 6, hy = y2 - uy * 6;
  return <g stroke={c} fill={c} strokeWidth={w} strokeDasharray={dash}><line x1={x1} y1={y1} x2={hx} y2={hy} /><polygon stroke="none" points={`${x2},${y2} ${hx - uy * 4},${hy + ux * 4} ${hx + uy * 4},${hy - ux * 4}`} /></g>;
}

/* ---- view 1: Clifford grid ---- */
function ViewClifford({ D, eq }) {
  const n = D.n, t = T.en, BL = Object.fromEntries(D.blades.map(b => [b.N, b])), on = lit(D, eq);
  const fnames = D.conventions.field_order.filter(f => /^[ETB]/.test(f)), src = fnames.map(f => D.incidences.find(i => i.field === f).source);
  const R = src.length, cw = Math.min(78, 248 / n), rh = n >= 6 ? 19 : n === 5 ? 22 : Math.min(36, 156 / R), x0 = 70, y0 = 44, fs = n >= 6 ? 8.5 : n === 5 ? 9.5 : n === 4 ? 11 : 13;
  const H = y0 + R * rh + (n >= 6 ? 100 : 82);
  const e = D.equations.find(z => z.id === eq);
  return <svg viewBox={`0 0 330 ${H}`} role="img" aria-label="Clifford product table">
    <text x="8" y="16" fontSize="11" fill="currentColor">∇F = ∇·F + ∇∧F = J</text>
    {[...Array(n).keys()].map(a => <text key={a} x={x0 + a * cw + cw / 2} y={y0 - 8} textAnchor="middle" fontSize="12" fill="currentColor">∂{D.axes[a]}</text>)}
    {src.map((s, i) => <g key={s}>
      <text x={x0 - 6} y={y0 + i * rh + rh / 2 + 4} textAnchor="end" fontSize={n >= 6 ? 8.5 : n === 5 ? 10 : 11.5} fill={roleColor(BL[s].role)}>{SUB(BL[s].label)}</text>
      {[...Array(n).keys()].map(a => { const inc = D.incidences.find(z => z.source === s && z.axis === a), isOn = on.includes(inc), c = roleColor(BL[inc.target].role);
        return <g key={a} opacity={isOn ? 1 : .28}><rect x={x0 + a * cw + 2} y={y0 + i * rh + 2} width={cw - 4} height={rh - 4} rx="6" fill={c} fillOpacity={isOn ? .3 : .1} stroke={c} strokeWidth={isOn ? 2 : 1} />
          <text x={x0 + a * cw + cw / 2} y={y0 + i * rh + rh / 2 + 4.5} textAnchor="middle" fontSize={fs} fill="currentColor">{sgn(inc.sign)}{gname(inc.target, n)}</text></g>; })}
    </g>)}
    {[['E', COL.E], ['T', COL.T], ['B', COL.B], ['ρ, J', COL.J], ['faces', COL.F]].filter(([l]) => (l !== 'B' || D.counts.B > 0) && (l !== 'T' || D.counts.T > 0)).map(([l, c], k) => <g key={l}><rect x={8 + k * 58} y={y0 + R * rh + 10} width="10" height="10" rx="3" fill={c} /><text x={22 + k * 58} y={y0 + R * rh + 19} fontSize="10.5" fill="currentColor">{l}</text></g>)}
    <text x="8" y={y0 + R * rh + 40} fontSize="10.5" fill="currentColor" opacity=".75">{t.cell}</text>
    {e && (n >= 6 ? <foreignObject x="8" y={y0 + R * rh + 46} width="316" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 10.5, lineHeight: 1.35, color: 'currentColor', fontFamily: 'ui-monospace,Menlo,monospace' }}>{e.eq}</div></foreignObject> : <text x="8" y={y0 + R * rh + 58} fontSize="11.5" fill="currentColor">{e.eq}</text>)}
    <text x="8" y={H - 6} fontSize="10" fill="currentColor" opacity=".6">γ0²=+1, γi²=−1</text>
  </svg>;
}

/* ---- view 2: simplex (segment, triangle, tetrahedron) ---- */
const SP = { 2: [[200, 50], [80, 190]], 3: [[150, 36], [50, 196], [250, 196]], 4: [[150, 44], [46, 198], [262, 198], [206, 150]], 5: [0, 1, 2, 3, 4].map(k => [155 + 92 * Math.cos((-90 + 72 * k) * Math.PI / 180), 124 + 92 * Math.sin((-90 + 72 * k) * Math.PI / 180)]),
  6: [0, 1, 2, 3, 4, 5].map(k => [155 + 84 * Math.cos((-90 + 60 * k) * Math.PI / 180), 118 + 84 * Math.sin((-90 + 60 * k) * Math.PI / 180)]),
  7: [0, 1, 2, 3, 4, 5, 6].map(k => [155 + 84 * Math.cos((-90 + 360 / 7 * k) * Math.PI / 180), 120 + 84 * Math.sin((-90 + 360 / 7 * k) * Math.PI / 180)]) };
function ViewSimplex({ D, eq }) {
  const n = D.n, P = SP[n], BL = Object.fromEntries(D.blades.map(b => [b.N, b])), on = lit(D, eq);
  const cen = m => { const v = bits(m).map(a => P[a]); return [v.reduce((s, p) => s + p[0], 0) / v.length, v.reduce((s, p) => s + p[1], 0) / v.length]; };
  const C0 = cen((1 << n) - 1), away = (p, k) => { const dx = p[0] - C0[0], dy = p[1] - C0[1], L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * k, p[1] + dy / L * k]; };
  const masks = g => D.blades.filter(b => b.grade === g).map(b => b.N);
  const tgt = i => i.op === 'wedge' ? cen(i.target) : P[Math.log2(i.target)];
  return <svg viewBox="0 0 310 235" role="img" aria-label="simplex">
    {masks(3).filter(m => n < 5 || on.some(i => i.target === m)).map(m => { const v = bits(m).map(a => P[a].join(',')).join(' '), isT = on.some(i => i.target === m); return <polygon key={m} points={v} fill={roleColor(BL[m].role)} fillOpacity={isT ? .32 : .07} stroke="none" />; })}
    {masks(2).map(m => { const [a, b] = bits(m); return <line key={m} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={roleColor(BL[m].role)} strokeWidth={n >= 5 ? 2.2 : 3.6} strokeOpacity={n >= 5 ? (on.some(i => i.source === m) ? 1 : .5) : n === 4 && !bits(m).includes(0) ? .8 : 1} />; })}
    {on.map((i, k) => { const m = cen(i.source), to = tgt(i); return <Arrow key={k} x1={m[0]} y1={m[1]} x2={to[0]} y2={to[1]} c={roleColor(BL[i.target].role)} w={2.1} dash={i.op === 'wedge' ? '5 3' : undefined} />; })}
    {on.map((i, k) => { const m = cen(i.source), to = tgt(i), mx = (m[0] + to[0]) / 2, my = (m[1] + to[1]) / 2, dx = to[0] - m[0], dy = to[1] - m[1], L = Math.hypot(dx, dy) || 1;
      return <text key={'l' + k} x={mx - dy / L * 9} y={my + dx / L * 9 + 3} textAnchor="middle" fontSize="10.5" fill="currentColor">{sgn(i.sign)}∂{i.axis_name}</text>; })}
    {[...Array(n).keys()].map(a => <g key={a}><circle cx={P[a][0]} cy={P[a][1]} r="12" fill={a === 0 ? COL.one : COL.J} fillOpacity=".92" /><text x={P[a][0]} y={P[a][1] + 4} textAnchor="middle" fontSize="11" fill="#0b1020">{a}</text>
      <text {...(([x, y]) => ({ x, y }))(n === 4 && a === 3 ? [P[a][0] + 18, P[a][1] - 12] : away(P[a], 24))} textAnchor={n === 4 && a === 3 ? 'start' : 'middle'} fontSize="11" fill="currentColor">{D.axes[a]} · {BL[1 << a].label}</text></g>)}
    {masks(2).filter(m => n < 5 || on.some(i => i.source === m)).map(m => { const q = away(cen(m), n >= 5 ? 9 : 13); return <text key={'e' + m} x={q[0]} y={q[1] + 4} textAnchor="middle" fontSize={n >= 5 ? 10 : 11.5} fill={roleColor(BL[m].role)}>{SUB(BL[m].label)}</text>; })}
    {n === 3 && <text x={cen(7)[0]} y={cen(7)[1] + 4} textAnchor="middle" fontSize="12" fill={COL.F}>I</text>}
    {n === 4 && masks(3).map(m => { const q = cen(m); return <text key={'f' + m} x={q[0]} y={q[1] + 4} textAnchor="middle" fontSize="9.5" fill={roleColor(BL[m].role)} opacity=".95">{BL[m].label}</text>; })}
  </svg>;
}

/* ---- view 3: cube (square, cube, 4-cube) ---- */
const AXV = { 2: [[150, 0], [0, -120]], 3: [[120, 0], [0, -100], [62, -50]], 4: [[80, 0], [0, -62], [36, -30], [118, 54]], 5: [[40, 0], [0, -38], [20, -17], [112, 16], [8, 94]] };
const BASE = { 2: [60, 190], 3: [38, 186], 4: [30, 126], 5: [34, 88] };
const CP = (m, n) => { let [x, y] = BASE[n]; AXV[n].forEach((v, a) => { if (m >> a & 1) { x += v[0]; y += v[1]; } }); return [x, y]; };
/* n = 6, 7: bits 0-2 are a small oblique cube; bits 3-6 place the small cubes on a grid (bit3, bit4: columns; bit5, bit6: rows) */
const CUBE_A = [[28, 0], [0, -22], [12, -10]];
const cpBig = m => { const col = (m >> 3 & 1) + 2 * (m >> 4 & 1), row = (m >> 5 & 1) + 2 * (m >> 6 & 1); let x = 14 + col * 76, y = 58 + row * 46; CUBE_A.forEach((v, a) => { if (m >> a & 1) { x += v[0]; y += v[1]; } }); return [x, y]; };
function ViewCubeBig({ D, eq }) {
  const n = D.n, on = lit(D, eq), BL = Object.fromEntries(D.blades.map(b => [b.N, b])), litV = new Set(on.flatMap(i => [i.source, i.target]));
  const L = (a, b) => on.find(i => (i.source === a && i.target === b) || (i.source === b && i.target === a));
  return <svg viewBox="0 0 310 235" role="img" aria-label="cube">
    {D.cube.edges.map(([a, b, ax], k) => { if (L(a, b)) return null; const A = cpBig(a), B = cpBig(b); return <line key={k} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="currentColor" strokeOpacity={ax < 3 ? .3 : .12} strokeWidth={ax < 3 ? 1 : .7} />; })}
    {D.cube.edges.map(([a, b, ax], k) => { const l = L(a, b); if (!l) return null; const A = cpBig(a), B = cpBig(b); return <g key={'l' + k}><line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={roleColor(BL[l.target].role)} strokeWidth="2.6" strokeDasharray={l.op === 'wedge' ? '5 3' : undefined} /><text x={(A[0] + B[0]) / 2 + 3} y={(A[1] + B[1]) / 2 - 3} fontSize="8.5" fill="currentColor">∂{D.axes[ax]}</text></g>; })}
    {D.cube.vertices.map(v => { const p = cpBig(v.N), c = roleColor(BL[v.N].role), isL = litV.has(v.N);
      return <g key={v.N}><circle cx={p[0]} cy={p[1]} r={isL ? 6.5 : 2.4} fill={c} fillOpacity={isL ? .92 : .55} />{isL && <text x={p[0]} y={p[1] + 2.8} textAnchor="middle" fontSize="7.5" fill="#0b1020">{v.N}</text>}{isL && <text x={p[0]} y={p[1] - 9} textAnchor="middle" fontSize="8" fill="currentColor" opacity=".9">{SUB(BL[v.N].label)}</text>}</g>; })}
    <text x="6" y="12" fontSize="9" fill="currentColor" opacity=".7">bits 0–2: small cube · bits 3, 4: columns · {n === 7 ? 'bits 5, 6: rows' : 'bit 5: rows'}</text>
    <text x="6" y="231" fontSize="10" fill="currentColor" opacity=".7">layers by weight: {D.cube.layers.join(' · ')}</text>
  </svg>;
}
function ViewCube({ D, eq }) {
  if (D.n >= 6) return <ViewCubeBig D={D} eq={eq} />;
  const n = D.n, on = lit(D, eq), BL = Object.fromEntries(D.blades.map(b => [b.N, b])), r = n === 5 ? 4 : n === 4 ? 9.5 : 12;
  const L = (a, b) => on.find(i => (i.source === a && i.target === b) || (i.source === b && i.target === a));
  const litV = new Set(on.flatMap(i => [i.source, i.target]));
  return <svg viewBox="0 0 310 235" role="img" aria-label="cube">
    {D.cube.edges.map(([a, b, ax], k) => { const A = CP(a, n), B = CP(b, n), l = L(a, b); return <line key={k} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={l ? roleColor(BL[l.target].role) : 'currentColor'} strokeOpacity={l ? 1 : .26} strokeWidth={l ? 3 : 1.1} strokeDasharray={l && l.op === 'wedge' ? '6 3' : undefined} />; })}
    {D.cube.edges.map(([a, b, ax], k) => { const l = L(a, b); if (!l) return null; const A = CP(a, n), B = CP(b, n); return <text key={'t' + k} x={(A[0] + B[0]) / 2 + 5} y={(A[1] + B[1]) / 2 - 5} fontSize="10.5" fill="currentColor">∂{D.axes[ax]}</text>; })}
    {D.cube.vertices.map(v => { const p = CP(v.N, n), c = roleColor(BL[v.N].role), isL = litV.has(v.N), show = n < 4 || isL, rr = n === 5 && isL ? 7 : r;
      return <g key={v.N}><circle cx={p[0]} cy={p[1]} r={rr} fill={c} fillOpacity={n >= 4 && !isL ? .55 : .88} />{(n < 5 || isL) && <text x={p[0]} y={p[1] + 3.2} textAnchor="middle" fontSize={n === 5 ? 8 : n === 4 ? 9.5 : 11} fill="#0b1020">{v.N}</text>}
        {show && <text x={n >= 4 ? p[0] : p[0] + (v.N & 1 ? r + 4 : -r - 4)} y={n >= 4 ? p[1] - rr - 3 : p[1] + r + 6} textAnchor={n >= 4 ? 'middle' : v.N & 1 ? 'start' : 'end'} fontSize={n === 5 ? 8.5 : 10} fill="currentColor" opacity=".85">{SUB(BL[v.N].label)}</text>}</g>; })}
    <text x="6" y="14" fontSize="9.5" fill="currentColor" opacity=".7">{D.axes.map((a, i) => `bit${i}=${a}`).join('  ')}{n === 4 ? '  (bit 3: second cube)' : n === 5 ? '  (bits 3, 4: grid)' : ''}</text>
    <text x="6" y="231" fontSize="10" fill="currentColor" opacity=".7">layers by weight: {D.cube.layers.join(' · ')}</text>
  </svg>;
}

/* ---- view 4: integer labels ---- */
function ViewPrimeGrid({ D, eq }) {
  const n = D.n, on = lit(D, eq), cnt = 1 << n, cols = n === 7 ? 16 : 8, rows = cnt / cols, cw = 19, ch = n === 7 ? 17 : 19, BL = Object.fromEntries(D.blades.map(b => [b.N, b])), isP = new Set(D.primes.prime_labels), litV = new Set(on.flatMap(i => [i.source, i.target]));
  const x = m => 12 + (m % cols) * cw + cw / 2, y = m => 26 + Math.floor(m / cols) * ch + ch / 2, extra = Math.max(0, Math.ceil(on.length / 5) - 3) * 15, top = 26 + rows * ch + 8;
  return <svg viewBox={`0 0 330 ${top + 66 + extra}`} role="img" aria-label="integer labels">
    <text x="8" y="14" fontSize="9.5" fill="currentColor" opacity=".7">label m = row × {cols} + column; gold border: m is prime (notation only)</text>
    {Array.from({ length: cnt }, (_, m) => <g key={m}><rect x={x(m) - cw / 2 + 1} y={y(m) - ch / 2 + 1} width={cw - 2} height={ch - 2} rx="3" fill={roleColor(BL[m].role)} fillOpacity={litV.has(m) ? .5 : .16} stroke={isP.has(m) ? '#ffd166' : roleColor(BL[m].role)} strokeWidth={isP.has(m) ? 1.6 : .6} /><text x={x(m)} y={y(m) + 3} textAnchor="middle" fontSize={litV.has(m) ? 8 : 6.5} fill="currentColor" opacity={litV.has(m) ? 1 : .6}>{m}</text></g>)}
    {on.map((i, k) => { const a = [x(i.source), y(i.source)], b = [x(i.target), y(i.target)], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 10 - Math.abs(a[0] - b[0]) * .08; return <path key={k} d={`M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`} fill="none" stroke={roleColor(BL[i.target].role)} strokeWidth="1.6" strokeDasharray={i.op === 'wedge' ? '4 3' : undefined} />; })}
    <foreignObject x="6" y={top} width="318" height={60 + extra}><div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 10.5, lineHeight: 1.4, color: 'currentColor', opacity: .85, fontFamily: 'ui-monospace,Menlo,monospace' }}>
      {on.map((i, k) => <React.Fragment key={k}>{k > 0 && ' · '}<span style={{ whiteSpace: 'nowrap' }}>{i.source}⊕{1 << i.axis}={i.target}</span></React.Fragment>)}</div></foreignObject>
  </svg>;
}
function ViewPrime({ D, eq }) {
  if (D.n >= 6) return <ViewPrimeGrid D={D} eq={eq} />;
  const n = D.n, on = lit(D, eq), cnt = 1 << n, BL = Object.fromEntries(D.blades.map(b => [b.N, b])), isP = new Set(D.primes.prime_labels);
  const gap = n === 5 ? 1 : n === 4 ? 2 : 4, w = Math.min(34, (300 - gap * cnt) / cnt), x = m => 14 + m * (w + gap) + w / 2, bw = n === 5 ? 8 : n === 4 ? 9.5 : 14, litV = new Set(on.flatMap(i => [i.source, i.target]));
  const extra = Math.max(0, Math.ceil(on.length / 5) - 3) * 15;
  return <svg viewBox={`0 0 330 ${235 + extra}`} role="img" aria-label="integer labels">
    {on.map((i, k) => { const a = x(i.source), b = x(i.target), h = 22 + Math.abs(a - b) * (n >= 4 ? .2 : .32), y = 96; return <g key={k}><path d={`M${a},${y} Q${(a + b) / 2},${y - h} ${b},${y}`} fill="none" stroke={roleColor(BL[i.target].role)} strokeWidth="1.8" strokeDasharray={i.op === 'wedge' ? '5 3' : undefined} />
      {n < 4 && <text x={(a + b) / 2} y={y - h / 2 - 6} textAnchor="middle" fontSize="10" fill="currentColor">⊕{1 << i.axis}</text>}</g>; })}
    {Array.from({ length: cnt }, (_, m) => <g key={m}><rect x={x(m) - w / 2} y="100" width={w} height="34" rx={n >= 4 ? 3 : 6} fill={roleColor(BL[m].role)} fillOpacity=".22" stroke={isP.has(m) ? '#ffd166' : roleColor(BL[m].role)} strokeWidth={isP.has(m) ? 2.4 : 1} />
      {(n < 5 || litV.has(m) || m % 8 === 0) && <text x={x(m)} y="122" textAnchor="middle" fontSize={bw} fill="currentColor">{m}</text>}
      {n < 4 && <text x={x(m)} y="150" textAnchor="middle" fontSize="9" fill="currentColor" opacity=".75" fontFamily="monospace">{m.toString(2).padStart(n, '0')}</text>}
      {(n < 4 || litV.has(m)) && <text x={x(m)} y={n < 4 ? 164 : 150 + (m % 2) * 11} textAnchor="middle" fontSize={n < 4 ? 10.5 : n === 4 ? 8.5 : 7.5} fill={roleColor(BL[m].role)}>{SUB(BL[m].label)}</text>}</g>)}
    <foreignObject x="6" y="176" width="318" height={56 + extra}><div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 10.5, lineHeight: 1.4, color: 'currentColor', opacity: .85, fontFamily: 'ui-monospace,Menlo,monospace' }}>
      {on.map((i, k) => <React.Fragment key={k}>{k > 0 && ' · '}<span style={{ whiteSpace: 'nowrap' }}>{i.source}⊕{1 << i.axis}={i.target}</span></React.Fragment>)}</div></foreignObject>
  </svg>;
}

const TX = {
  en: {
    timeH: 'How many time and how many space dimensions?', timeL: 'time dimensions (generators that square to +1)', spaceL: 'space dimensions (square to −1)',
    limit: 'The pictures go up to 7 generators in all (k + d ≤ 7, each at most 4). The tables below go further.',
    stepH: 'What this step adds', start: 'Starting point: two generators, one time and one space. One field piece E and two equations.',
    newT: 'New generator: a time direction (squares to +1)', newS: 'New generator: a space direction (squares to −1)',
    blades: 'Blades', pieces: 'Field pieces F', eqs: 'Equations ∇F = J', algebra: 'Algebra', pde: 'Wave operator', newMark: '★ = equations that involve the new generator',
    partsT: (d, k) => `${d} new electric E (time–space) and ${k - 1} new time–time T`, partsS: (k, d) => `${k} new electric E (time–space) and ${d - 1} new magnetic B (space–space)`,
    newEq: (k) => `one new δF = J and ${k} new dF = 0`,
    cls: { elliptic: 'elliptic: no direction is special', hyperbolic: 'hyperbolic', ultrahyperbolic: 'ultrahyperbolic: at least two directions of each sign, so in general no direction supports a well-posed initial-value problem' },
    along: { time: 'an initial-value problem is well-posed along time', space: 'the single odd-signed direction is the space direction, so an initial-value problem is well-posed along space and not along any time' },
    classNote: 'Classification of the principal symbol of the wave operator Σ ηₐ ∂ₐ² (standard PDE theory, not proved here).',
    mirH: 'The mirror world', mirText: (k, d, mk) => `Swap time and space generators: (${k} time, ${d} space) becomes (${d} time, ${k} space), the algebra Cl(${k},${d}) becomes Cl(${d},${k}) = ${mk}. The equation system is exactly the same system, with δF = J turning into δF = −J and dF = 0 unchanged (checked for every cell). Only the algebra and the names change.`,
    mirPair: 'Selected equation, and the same equation in the mirror:', mirGo: 'go to the mirror',
    keyK: (c) => `Time–space edges are electric E (${c.E}). Time–time edges are T (${c.T}): they have no counterpart in the usual Maxwell theory. Space–space edges are magnetic B (${c.B}). Vertices are charge densities ρ (one per time) and currents J. Faces are the conditions dF = 0.`,
    ladTimeH: 'The ladder along time (one space dimension)', ladTimeNote: 'Numbers only. Cl(k,1): k times and one space. The algebra differs from its mirror Cl(1,k) (last-but-one column), yet the equation system is the same one. After 8 steps the type repeats and the matrices are 16 times bigger: Cl(k+8,1) = Cl(k,1) ⊗ M16(ℝ) (checked up to k = 11). Nothing new at the period, only more of the same.',
    tcols: ['times k', 'algebra Cl(k,1)', 'mirror Cl(1,k)', 'I²', 'F = E + T', 'equations ∇F', 'step adds (F / eqs)'],
    ladSpaceH: 'The ladder along space (one time dimension)'
  },
  it: {
    timeH: 'Quante dimensioni di tempo e quante di spazio?', timeL: 'dimensioni di tempo (generatori con quadrato +1)', spaceL: 'dimensioni di spazio (quadrato −1)',
    limit: 'Le immagini arrivano fino a 7 generatori in tutto (k + d ≤ 7, al massimo 4 per tipo). Le tabelle sotto vanno oltre.',
    stepH: 'Che cosa aggiunge questo passo', start: 'Punto di partenza: due generatori, un tempo e uno spazio. Un pezzo di campo E e due equazioni.',
    newT: 'Nuovo generatore: una direzione di tempo (quadrato +1)', newS: 'Nuovo generatore: una direzione di spazio (quadrato −1)',
    blades: 'Blade', pieces: 'Pezzi di campo F', eqs: 'Equazioni ∇F = J', algebra: 'Algebra', pde: 'Operatore d’onda', newMark: '★ = equazioni che coinvolgono il nuovo generatore',
    partsT: (d, k) => `${d} nuovi elettrici E (tempo–spazio) e ${k - 1} nuovi tempo–tempo T`, partsS: (k, d) => `${k} nuovi elettrici E (tempo–spazio) e ${d - 1} nuovi magnetici B (spazio–spazio)`,
    newEq: (k) => `una nuova δF = J e ${k} nuove dF = 0`,
    cls: { elliptic: 'ellittico: nessuna direzione è speciale', hyperbolic: 'iperbolico', ultrahyperbolic: 'ultraiperbolico: almeno due direzioni per ogni segno, quindi in generale nessuna direzione ammette un problema ai valori iniziali ben posto' },
    along: { time: 'un problema ai valori iniziali è ben posto lungo il tempo', space: 'l’unica direzione di segno opposto è quella spaziale, quindi il problema ai valori iniziali è ben posto lungo lo spazio e non lungo alcun tempo' },
    classNote: 'Classificazione del simbolo principale dell’operatore d’onda Σ ηₐ ∂ₐ² (teoria standard delle PDE, non dimostrata qui).',
    mirH: 'Il mondo speculare', mirText: (k, d, mk) => `Scambia generatori di tempo e di spazio: (${k} tempo, ${d} spazio) diventa (${d} tempo, ${k} spazio), l’algebra Cl(${k},${d}) diventa Cl(${d},${k}) = ${mk}. Il sistema di equazioni è esattamente lo stesso, con δF = J che diventa δF = −J e dF = 0 invariata (verificato per ogni cella). Cambiano solo l’algebra e i nomi.`,
    mirPair: 'Equazione scelta, e la stessa equazione nello specchio:', mirGo: 'vai allo specchio',
    keyK: (c) => `Gli spigoli tempo–spazio sono elettrici E (${c.E}). Gli spigoli tempo–tempo sono T (${c.T}): non hanno controparte nella teoria di Maxwell usuale. Gli spigoli spazio–spazio sono magnetici B (${c.B}). I vertici sono densità di carica ρ (una per tempo) e correnti J. Le facce sono le condizioni dF = 0.`,
    ladTimeH: 'La scala lungo il tempo (una dimensione di spazio)', ladTimeNote: 'Solo numeri. Cl(k,1): k tempi e uno spazio. L’algebra differisce dalla sua speculare Cl(1,k) (penultima colonna), eppure il sistema di equazioni è lo stesso. Dopo 8 passi il tipo si ripete e le matrici sono 16 volte più grandi: Cl(k+8,1) = Cl(k,1) ⊗ M16(ℝ) (verificato fino a k = 11). Niente di nuovo al periodo, solo di più della stessa cosa.',
    tcols: ['tempi k', 'algebra Cl(k,1)', 'speculare Cl(1,k)', 'I²', 'F = E + T', 'equazioni ∇F', 'il passo aggiunge (F / eq.)'],
    ladSpaceH: 'La scala lungo lo spazio (una dimensione di tempo)'
  }
};
T.en.simp.push('Simplex: a 5-simplex (hexagon with all diagonals)', 'Simplex: a 6-simplex (heptagon with all diagonals)');
T.en.cube.push('Cube: a 6-cube (eight small cubes on a grid)', 'Cube: a 7-cube (sixteen small cubes on a grid)');
T.it.simp.push('Simplesso: un 5-simplesso (esagono con tutte le diagonali)', 'Simplesso: un 6-simplesso (ettagono con tutte le diagonali)');
T.it.cube.push('Cubo: un 6-cubo (otto piccoli cubi su una griglia)', 'Cubo: un 7-cubo (sedici piccoli cubi su una griglia)');
const BIG = {
  en: {
    h: 'Six and seven generators: the logic keeps holding',
    gen: (n, c, D) => `With ${n} generators F has ${c.E + c.T + c.B} components (${c.E} E, ${c.T} T, ${c.B} B) and ∇F = J splits into ${n} + ${D.equations.length - n} equations, from ${D.incidences.length} incidences. The pictures are the same bit rule on a ${n - 1}-simplex and an ${n}-cube, only denser: the lit moves are what to follow.`,
    c33: 'Cl(3,3) = M₈(ℝ) is its own mirror, and it is the algebra of three Witt pairs, the same cell the Genesis page reaches at node 6.',
    c34: 'This is half of a mirror pair with different algebras: Cl(4,3) = M₈(ℝ) ⊕ M₈(ℝ) has a central I with I² = +1 and splits in two, while Cl(3,4) = M₈(ℂ) has a central I with I² = −1 and does not. The equation system is the same in both; the algebra is not. Cl(4,3) is the cell the Genesis page uses at node 7.',
    nonew: 'Nothing here is a new kind of Maxwell theory: all of these are ultrahyperbolic. The point is that the same rule, checked exactly, keeps working one generator at a time.'
  },
  it: {
    h: 'Sei e sette generatori: la logica continua a reggere',
    gen: (n, c, D) => `Con ${n} generatori F ha ${c.E + c.T + c.B} componenti (${c.E} E, ${c.T} T, ${c.B} B) e ∇F = J si divide in ${n} + ${D.equations.length - n} equazioni, da ${D.incidences.length} incidenze. Le immagini sono la stessa regola dei bit su un ${n - 1}-simplesso e un ${n}-cubo, solo più dense: conta seguire le mosse accese.`,
    c33: 'Cl(3,3) = M₈(ℝ) è il proprio specchio ed è l’algebra di tre coppie di Witt, la stessa cella a cui la pagina Genesi arriva al nodo 6.',
    c34: 'È metà di una coppia speculare con algebre diverse: Cl(4,3) = M₈(ℝ) ⊕ M₈(ℝ) ha I centrale con I² = +1 e si spezza in due, mentre Cl(3,4) = M₈(ℂ) ha I centrale con I² = −1 e non si spezza. Il sistema di equazioni è lo stesso in entrambe; l’algebra no. Cl(4,3) è la cella che la pagina Genesi usa al nodo 7.',
    nonew: 'Niente di tutto ciò è un nuovo tipo di teoria di Maxwell: sono tutte ultraiperboliche. Il punto è che la stessa regola, verificata in modo esatto, continua a funzionare un generatore alla volta.'
  }
};
const cellStr = (ty, N) => { const k = { R: 'ℝ', R2: 'ℝ', C: 'ℂ', H: 'ℍ', H2: 'ℍ' }[ty], one = `M${N}(${k})`; return ty.endsWith('2') ? `${one} ⊕ ${one}` : one; };
const C2 = (n, r) => r < 0 || r > n ? 0 : r === 0 ? 1 : (n * C2(n - 1, r - 1)) / r;

export default function MaxwellSection({ lang = 'en', profile = 'Young Learner' }) {
  const t = { ...(T[lang] || T.en), ...(TX[lang] || TX.en) }, [k, setK] = useState(1), [d, setD] = useState(1), [eq, setEq] = useState('gauss');
  const D = M.cells[`${k},${d}`], n = D.n, expert = profile !== 'Young Learner', al = D.algebra, sy = D.symbol;
  const pickK = v => { setK(v); if (v + d > 7) setD(7 - v); }; const pickD = v => { setD(v); if (v + k > 7) setK(7 - v); };
  const eqEff = eq === 'all' || D.equations.some(e => e.id === eq) ? eq : D.equations[0].id, cur = D.equations.find(e => e.id === eqEff);
  const eqName = e => lang === 'it' && EQN.it[e.name] ? EQN.it[e.name] : e.name;
  // the step that led here: along time if k > 1, else along space if d > 1
  const stepTime = k > 1, prev = k > 1 ? M.cells[`${k - 1},${d}`] : d > 1 ? M.cells[`${k},${d - 1}`] : null, newIdx = stepTime ? k - 1 : n - 1;
  const isNew = e => prev && (e.target >> newIdx & 1);
  const mir = M.cells[`${d},${k}`], sig = i => i < k ? d + i : i - k, mt = bits(D.equations.find(e => e.id === eqEff)?.target ?? 0).reduce((s, i) => s + (1 << sig(i)), 0), meq = mir.equations.find(e => e.target === mt);
  const pdeText = `${t.cls[sy.class]}${sy.class === 'hyperbolic' ? ': ' + t.along[sy.well_posed_along] : ''}`;
  const R = x => cellStr(x.type, x.matrix_size);
  return <section className="mx" id="maxwell" aria-labelledby="mx-h">
    <style>{STYLE}</style>
    <p className="eyebrow">{t.eyebrow}</p><h2 id="mx-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <h3>{t.timeH}</h3>
    <div className="mx-row"><span className="mx-lab">{t.timeL}</span><div className="mx-chips">{[1, 2, 3, 4].map(v => <button key={v} className={'mx-chip' + (k === v ? ' on' : '')} onClick={() => pickK(v)} aria-pressed={k === v}>{v}</button>)}</div></div>
    <div className="mx-row"><span className="mx-lab">{t.spaceL}</span><div className="mx-chips">{[1, 2, 3, 4].map(v => <button key={v} className={'mx-chip' + (d === v ? ' on' : '')} onClick={() => pickD(v)} aria-pressed={d === v}>{v}</button>)}</div></div>
    <div className="mx-card" style={{ marginTop: '.5rem' }}>
      <p className="mx-mono">Cl({k},{d}) = {R(al)}  ·  {n} generators, {1 << n} blades  ·  F: {C2(n, 2)} = {D.counts.E} E{D.counts.T ? ` + ${D.counts.T} T` : ''}{D.counts.B ? ` + ${D.counts.B} B` : ''}  ·  ∇F: {n} + {C2(n, 3)} = {n + C2(n, 3)} equations</p>
      {al.splits_in_two && <p className="mx-cap">I² = +1 and I is central: {t.splits}, with central projectors (1 ± I)/2.</p>}
      <p className="mx-cap">{t.pde}: {pdeText}. {t.classNote}</p><p className="mx-cap">{t.limit}</p>
    </div>
    <h3>{t.stepH}</h3>
    <div className="mx-card">{!prev ? <p>{t.start}</p> : <>
      <p><b>{stepTime ? t.newT : t.newS}</b></p>
      <p className="mx-mono">{t.blades}: {1 << (n - 1)} → {1 << n}  ·  {t.pieces}: {C2(n - 1, 2)} → {C2(n, 2)} (+{n - 1}: {stepTime ? t.partsT(d, k) : t.partsS(k, d)})  ·  {t.eqs}: {prev.n + C2(prev.n, 3)} → {n + C2(n, 3)} (+{1 + C2(n - 1, 2)}: {t.newEq(C2(n - 1, 2))})</p>
      <p className="mx-mono">{t.algebra}: Cl({stepTime ? k - 1 : k},{stepTime ? d : d - 1}) = {R(prev.algebra)} → Cl({k},{d}) = {R(al)}  ·  I²: {prev.algebra.pseudoscalar_square > 0 ? '+1' : '−1'} → {al.pseudoscalar_square > 0 ? '+1' : '−1'}  ·  {t.pde}: {prev.symbol.class} → {sy.class}</p></>}</div>
    {n >= 6 && (() => { const B = BIG[lang] || BIG.en; return <div className="mx-card"><h4>{B.h}</h4><p>{B.gen(n, D.counts, D)}</p>{k === 3 && d === 3 && <p>{B.c33}</p>}{((k === 3 && d === 4) || (k === 4 && d === 3)) && <p>{B.c34}</p>}<p className="mx-cap">{B.nonew}</p></div>; })()}
    <h3>{t.pickEq}</h3>
    <div className="mx-chips" style={D.equations.length > 16 ? { maxHeight: 132, overflowY: 'auto' } : undefined}><button className={'mx-chip' + (eqEff === 'all' ? ' on' : '')} onClick={() => setEq('all')}>{t.all}</button>
      {D.equations.map(e => <button key={e.id} className={'mx-chip' + (eqEff === e.id ? ' on' : '')} onClick={() => setEq(e.id)}>{isNew(e) ? '★ ' : ''}{eqName(e)}: <span className="mx-mono">{e.eq}</span></button>)}</div>
    {prev && <p className="mx-cap">{t.newMark}</p>}
    {cur && <p className="mx-cap">{cur.op === 'contract' ? t.contract : t.wedge}</p>}
    <div className="mx-grid">
      <div className="mx-card"><h4>{t.clif}</h4><ViewClifford D={D} eq={eqEff} /></div>
      <div className="mx-card"><h4>{t.simp[n - 2]}</h4><ViewSimplex D={D} eq={eqEff} /></div>
      <div className="mx-card"><h4>{t.cube[n - 2]}</h4><ViewCube D={D} eq={eqEff} /></div>
      <div className="mx-card"><h4>{t.prime}</h4><ViewPrime D={D} eq={eqEff} /></div>
    </div>
    <p className="mx-cap">{k === 1 ? t.key[d - 1] : t.keyK(D.counts)}</p>
    <h3>{t.mirH}</h3>
    <div className="mx-card"><p>{t.mirText(k, d, `${R(mir.algebra)}`)}</p>
      {meq && cur && <p className="mx-cap">{t.mirPair}</p>}{meq && cur && <p className="mx-mono">({k},{d}): {cur.eq}<br />({d},{k}): {meq.eq}</p>}
      {k !== d && <div className="mx-chips"><button className="mx-chip" onClick={() => { setK(d); setD(k); }}>{t.mirGo} ({d},{k})</button></div>}</div>
    {expert && <div className="mx-card" style={{ marginTop: '.8rem' }}><p>{t.conv}</p><p className="mx-mono">∇ = {D.conventions.grad}<br />F = {D.conventions.F}<br />J = {D.conventions.J}</p><p>{t.cons}</p></div>}
    <p className="mx-cap" style={{ fontSize: '.82rem' }}>{t.note}</p>
    <h3>{t.ladTimeH}</h3>
    <div className="mx-card"><div style={{ overflowX: 'auto' }}><table className="mx-mono" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.78rem' }}>
      <thead><tr>{t.tcols.map(h => <th key={h} style={{ textAlign: 'left', padding: '2px 8px', borderBottom: '1px solid currentColor' }}>{h}</th>)}</tr></thead>
      <tbody>{M.time_ladder.map(l => <tr key={l.k} style={{ background: l.k === k && d === 1 ? 'rgba(76,201,240,.18)' : undefined }}>
        <td style={{ padding: '2px 8px' }}>{l.k}</td><td style={{ padding: '2px 8px' }}>{cellStr(l.type, l.matrix_size)}</td><td style={{ padding: '2px 8px' }}>{cellStr(l.mirror_type, l.mirror_matrix_size)}</td>
        <td style={{ padding: '2px 8px' }}>{l.pseudoscalar_square > 0 ? '+1' : '−1'}{l.pseudoscalar_central ? ' central' : ''}{l.splits_in_two ? ' · ' + t.splits : ''}</td>
        <td style={{ padding: '2px 8px' }}>{l.F_components} = {l.E_components} + {l.T_components}</td><td style={{ padding: '2px 8px' }}>{l.equations_vector} + {l.equations_trivector} = {l.equations_total}</td>
        <td style={{ padding: '2px 8px' }}>{l.k === 1 ? '·' : `+${l.step_new_F} / +${l.step_new_equations}`}</td></tr>)}</tbody></table></div>
      <p className="mx-cap">{t.ladTimeNote}</p></div>
    <h3>{t.ladSpaceH}</h3>
    <div className="mx-card"><div style={{ overflowX: 'auto' }}><table className="mx-mono" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.78rem' }}>
      <thead><tr>{t.cols.map(h => <th key={h} style={{ textAlign: 'left', padding: '2px 8px', borderBottom: '1px solid currentColor' }}>{h}</th>)}</tr></thead>
      <tbody>{M.ladder.map(l => <tr key={l.d} style={{ background: l.d === d && k === 1 ? 'rgba(76,201,240,.18)' : undefined }}>
        <td style={{ padding: '2px 8px' }}>{l.d}</td><td style={{ padding: '2px 8px' }}>{cellStr(l.type, l.matrix_size)}{l.same_algebra_as_Cl08 ? '  = Cl(0,8)' : ''}</td>
        <td style={{ padding: '2px 8px' }}>{l.pseudoscalar_square > 0 ? '+1' : '−1'}{l.pseudoscalar_central ? ' central' : ''}{l.splits_in_two ? ' · ' + t.splits : ''}</td>
        <td style={{ padding: '2px 8px' }}>{l.F_components} = {l.E_components} + {l.B_components}</td><td style={{ padding: '2px 8px' }}>{l.equations_vector} + {l.equations_trivector} = {l.equations_total}</td></tr>)}</tbody></table></div>
      <p className="mx-cap">{t.ladNote}</p></div>
    <h3>{t.dlH}</h3>
    <div className="mx-card"><p>{t.dlText}</p>
      <div className="mx-chips"><button className="mx-chip on" onClick={() => download('maxwell_selfcheck.py', MAXWELL_PY, 'text/x-python')}>{t.dlPy}</button><button className="mx-chip" onClick={() => download('maxwell.json', JSON.stringify(M, null, 1), 'application/json')}>{t.dlJson}</button></div>
      <p className="mx-mono" style={{ marginTop: '.5rem' }}>{t.dlCmd}</p></div>
  </section>;
}

const STYLE = `
.mx{margin:3rem auto;max-width:1180px;padding:0 1rem}.mx h2{margin:.2rem 0 .6rem}.mx h3{margin:1.4rem 0 .5rem}
.mx .mx-card{border:1px solid rgba(160,170,200,.28);border-radius:14px;padding:.9rem 1rem;background:rgba(120,130,170,.07)}
.mx .mx-card h4{margin:.1rem 0 .35rem;font-size:.88rem}.mx .mx-card p{margin:.25rem 0;font-size:.86rem}
.mx .mx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-top:.8rem}
.mx svg{width:100%;height:auto;display:block}.mx .mx-cap{font-size:.76rem;opacity:.75;margin:.4rem 0}
.mx .mx-row{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap;margin:.3rem 0}.mx .mx-lab{font-size:.8rem;opacity:.8;min-width:15rem}
.mx .mx-chips{display:flex;flex-wrap:wrap;gap:.35rem}.mx button.mx-chip{font:inherit;font-size:.82rem;border:1px solid rgba(160,170,200,.4);background:transparent;color:inherit;border-radius:99px;padding:.2rem .7rem;cursor:pointer}
.mx button.mx-chip.on{background:#4cc9f0;color:#06222b;border-color:#4cc9f0}
.mx .mx-mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.78rem;word-break:break-word}
@media(max-width:760px){.mx .mx-grid{grid-template-columns:1fr}}`;
