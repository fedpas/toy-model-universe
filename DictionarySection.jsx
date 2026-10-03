import React, { useMemo, useState } from 'react';
import DICT from './dictionaryData';
import { SELFCHECK_PY } from './selfcheckSource';
import { cliffordCell } from './genesis_audit_v3';
import { BLOCK_COLORS } from './findingsData';

/* ---------- constants ---------- */
const CH = { 0: '#8b93a8', 1: '#4cc9f0', 2: '#ffd166', 3: '#ff5d8f', 8: '#4fd18b', 9: '#a78bfa', 10: '#ffa06f', 11: '#61dff0' };
const FANO_POS = { 3: [60, 250], 8: [300, 250], 9: [180, 50], 2: [180, 183], 11: [180, 250], 1: [240, 150], 10: [120, 150] };
const FANO_LINES = DICT.channels.fano_lines;
const VERTS = ['o', 'O1', 'O2', 'O3', 'H1', 'H2', 'c', 'r'];
const VBLOCK = { o: 0, O1: 1, O2: 1, O3: 1, H1: 2, H2: 2, c: 3, r: 4 };
const isPrime = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const fstr = n => { if (n < 2) return String(n); const f = []; let m = n; for (let d = 2; d * d <= m; d++) { let e = 0; while (m % d === 0) { m /= d; e++; } if (e) f.push(e > 1 ? `${d}^${e}` : `${d}`); } if (m > 1) f.push(`${m}`); return f.join('·'); };
const fracStr = s => s.replace('-', '−');
const vpos = (i, R, cx, cy, off = -Math.PI / 2) => [cx + R * Math.cos(off + i * 2 * Math.PI / 8), cy + R * Math.sin(off + i * 2 * Math.PI / 8)];

/* ---------- text ---------- */
const UI = {
  en: {
    eyebrow: 'DICTIONARY', title: 'One generation, six languages',
    lede: 'Every Standard Model particle and gauge generator of Furey’s model, written in six languages: Furey (audited), Simplex, Clifford, Cube, Prime, and the cross-view that holds them together. We build from 0 up, so the symmetries appear as the structure grows.',
    ladderH: 'Build-up: from 0 to 8, and why nothing new comes after', stage: 'Stage n (bits)',
    views: { alg: 'Real algebra idea', sim: 'Simplex', cub: 'Cube', pri: 'Prime' },
    dictH: 'The dictionary', pick: 'Pick a particle or gauge generator',
    groups: { matter: 'Quarks and leptons (one generation)', gauge: 'Gauge bosons', cartan: 'Diagonal generators', replica: 'Replica edges (open)' },
    cols: { furey: 'Furey (audited)', sim: 'Simplex', cli: 'Clifford', cub: 'Cube', pri: 'Prime', crs: 'Cross-view' },
    fanoH: 'The seven channels are a Fano plane', cartH: 'The diagonal generators on the faces', dlH: 'Check it yourself',
    dlText: 'The script rebuilds the 16-dimensional model from octonions, recomputes every row of this dictionary and the ladder, and asserts them. Run it with python3 and numpy.',
    dlPy: 'Download self-check (Python)', dlJson: 'Download dictionary data (JSON)', dlCmd: 'python3 dictionary_selfcheck.py --compare dictionary.json',
    antiNote: 'Antiparticles are the reversed edges. They touch the same faces, so the face map alone cannot tell a particle from its antiparticle.',
    open: 'Open: Higgs and the replica edges are not placed by this model; one generation only.',
    why8H: 'Why 8 is the last new thing', rec: 'Real:', imag: 'ω-partner:'
  },
  it: {
    eyebrow: 'DIZIONARIO', title: 'Una generazione, sei linguaggi',
    lede: 'Ogni particella del Modello Standard e ogni generatore di gauge del modello di Furey, scritti in sei linguaggi: Furey (verificato), Simplesso, Clifford, Cubo, Primi e la vista incrociata che li tiene insieme. Costruiamo da 0 in su, così le simmetrie compaiono man mano che la struttura cresce.',
    ladderH: 'Costruzione: da 0 a 8, e perché dopo non c’è nulla di nuovo', stage: 'Stadio n (bit)',
    views: { alg: 'Idea di algebra reale', sim: 'Simplesso', cub: 'Cubo', pri: 'Primi' },
    dictH: 'Il dizionario', pick: 'Scegli una particella o un generatore di gauge',
    groups: { matter: 'Quark e leptoni (una generazione)', gauge: 'Bosoni di gauge', cartan: 'Generatori diagonali', replica: 'Lati di replica (aperto)' },
    cols: { furey: 'Furey (verificato)', sim: 'Simplesso', cli: 'Clifford', cub: 'Cubo', pri: 'Primi', crs: 'Vista incrociata' },
    fanoH: 'I sette canali sono un piano di Fano', cartH: 'I generatori diagonali sulle facce', dlH: 'Verificalo tu',
    dlText: 'Lo script ricostruisce il modello a 16 dimensioni dagli ottonioni, ricalcola ogni riga di questo dizionario e la scala, e le verifica. Si esegue con python3 e numpy.',
    dlPy: 'Scarica l’auto-verifica (Python)', dlJson: 'Scarica i dati del dizionario (JSON)', dlCmd: 'python3 dictionary_selfcheck.py --compare dictionary.json',
    antiNote: 'Le antiparticelle sono i lati invertiti. Toccano le stesse facce, quindi la sola mappa sulle facce non distingue una particella dalla sua antiparticella.',
    open: 'Aperto: il modello non colloca il bosone di Higgs né i lati di replica; solo una generazione.',
    why8H: 'Perché 8 è l’ultima novità', rec: 'Reale:', imag: 'partner ω:'
  }
};
const STAGE = {
  en: [
    ['A single tile. Nothing to switch yet.', 'ℝ: one element, one face (the empty, scalar face), one cube vertex, the integer 1, nothing to factor.'],
    ['One ghost switch: it has no sign and no partner.', 'A null seed n²=0: Cl(0,0,1). One simplex vertex, a cube edge, labels 0 and 1, grade counts 1,1.'],
    ['Two ghost switches hold hands and wake a plus and a minus lamp.', 'Polarization {n₁,n₂}=1 gives Cl(1,1)=M₂(ℝ): the first real matrix algebra. Simplex: an edge. Cube: a square.'],
    ['Three switches: the seven lit corners of a little cube meet in triples.', 'Cl(0,3)=ℍ⊕ℍ. The 7 nonzero vertices of the 3-cube are the points of the Fano plane. First odd prime in the grade counts: 3.'],
    ['Four switches: numbers with four parts (quaternions) show up inside grids.', 'Cl(2,2)=M₄(ℝ) and Cl(0,4)=M₂(ℍ). Grade counts 1,4,6,4,1.'],
    ['Five switches: a new counting number, 5, appears.', 'Cl(0,5)=M₄(ℂ). Grade count 10=2·5.'],
    ['Six switches: a hidden turning key appears (a quarter-turn that squares to −1).', 'Cl(0,6)=M₈(ℝ)=End_ℝ(𝕆): the first real matrix algebra from the negative edge, with volume element ω²=−1, a complex structure (Furey’s ω=L_{e₇}).'],
    ['Seven switches: the world splits into two mirror halves.', 'Cl(0,7)=M₈(ℝ)⊕M₈(ℝ): central volume element, I²=+1. 7 divides every grade count C(7,k), 0<k<7.'],
    ['Eight switches: the filing grid closes up, and the next rounds repeat it.', 'Cl(0,8)=M₁₆(ℝ): the first real matrix algebra whose volume element squares to +1. The 16 diagonal blades form the extended Hamming code. 8=7+1: 7 divides C(8,k) for k=2…6, 3 divides none.']
  ],
  it: [
    ['Una sola piastrella. Ancora niente da accendere.', 'ℝ: un elemento, una faccia (quella vuota, scalare), un vertice del cubo, l’intero 1, nulla da fattorizzare.'],
    ['Un interruttore fantasma: nessun segno e nessun compagno.', 'Un seme nullo n²=0: Cl(0,0,1). Un vertice del simplesso, uno spigolo del cubo, etichette 0 e 1, conteggi di grado 1,1.'],
    ['Due fantasmi si danno la mano e accendono una lampada più e una meno.', 'La polarizzazione {n₁,n₂}=1 dà Cl(1,1)=M₂(ℝ): la prima algebra di matrici reale. Simplesso: uno spigolo. Cubo: un quadrato.'],
    ['Tre interruttori: i sette angoli accesi di un cubetto si incontrano a tre a tre.', 'Cl(0,3)=ℍ⊕ℍ. I 7 vertici non nulli del 3-cubo sono i punti del piano di Fano. Primo primo dispari nei conteggi di grado: 3.'],
    ['Quattro interruttori: numeri a quattro parti (quaternioni) compaiono nelle griglie.', 'Cl(2,2)=M₄(ℝ) e Cl(0,4)=M₂(ℍ). Conteggi di grado 1,4,6,4,1.'],
    ['Cinque interruttori: compare un nuovo numero, il 5.', 'Cl(0,5)=M₄(ℂ). Conteggio di grado 10=2·5.'],
    ['Sei interruttori: compare una chiave nascosta (un quarto di giro che al quadrato fa −1).', 'Cl(0,6)=M₈(ℝ)=End_ℝ(𝕆): la prima algebra di matrici reale dal bordo negativo, con elemento di volume ω²=−1, una struttura complessa (ω=L_{e₇} di Furey).'],
    ['Sette interruttori: il mondo si divide in due metà speculari.', 'Cl(0,7)=M₈(ℝ)⊕M₈(ℝ): elemento di volume centrale, I²=+1. 7 divide ogni conteggio C(7,k), 0<k<7.'],
    ['Otto interruttori: la griglia dell’archivio si chiude, e i giri successivi la ripetono.', 'Cl(0,8)=M₁₆(ℝ): la prima algebra di matrici reale il cui elemento di volume ha quadrato +1. I 16 blade diagonali formano il codice di Hamming esteso. 8=7+1: 7 divide C(8,k) per k=2…6, 3 non ne divide nessuno.']
  ]
};
const TAIL = {
  en: ['More switches just stack copies of the same filing grid.', 'n = 9…16: Cl(0,n)=Cl(0,n−8)⊗M₁₆(ℝ). Same type, 16 times the matrix size. Nothing new in type.'],
  it: ['Altri interruttori impilano solo copie della stessa griglia.', 'n = 9…16: Cl(0,n)=Cl(0,n−8)⊗M₁₆(ℝ). Stesso tipo, dimensione di matrice 16 volte maggiore. Nulla di nuovo nel tipo.']
};
const WHY8 = {
  en: ['The type sequence along Cl(0,n) repeats with minimal period 8 (computed to n=16).',
    'n=6 is the first real split algebra, with I²=−1 (a complex structure). n=8 is the first with I²=+1.',
    'Doubly-even self-dual binary codes of length n (the way to build a diagonal torus from grade 0, 4, 8 blades) do not exist for n<8; exhaustive count at n=8: 30. This concerns that kind of torus, not every torus.',
    'Beyond 8 the rule Cl(0,n)=Cl(0,n−8)⊗M₁₆(ℝ) only multiplies the matrix size by 16.'],
  it: ['La sequenza dei tipi lungo Cl(0,n) si ripete con periodo minimo 8 (calcolata fino a n=16).',
    'n=6 è la prima algebra reale scissa, con I²=−1 (struttura complessa). n=8 è la prima con I²=+1.',
    'I codici binari autoduali doppiamente pari di lunghezza n (il modo di costruire un toro diagonale con blade di grado 0, 4, 8) non esistono per n<8; conteggio esaustivo a n=8: 30. Riguarda questo tipo di toro, non ogni toro.',
    'Oltre 8 la regola Cl(0,n)=Cl(0,n−8)⊗M₁₆(ℝ) moltiplica solo per 16 la dimensione della matrice.']
};
const CARTAN_INFO = {
  Y0: { w: { o: -3 / 8, O: 1 / 3 - 3 / 8, H1: 1 / 2 - 3 / 8, H2: 1 / 2 - 3 / 8, c: 1 - 3 / 8, r: -3 / 8 }, en: 'hypercharge: Y=⅓P_{𝕆₂}+½P_ℍ+P_ℂ, minus 3/8', it: 'ipercarica: Y=⅓P_{𝕆₂}+½P_ℍ+P_ℂ, meno 3/8' },
  Q0: { w: { o: -3 / 8, O: 1 / 3 - 3 / 8, H1: -3 / 8, H2: 1 - 3 / 8, c: 1 - 3 / 8, r: -3 / 8 }, en: 'electric charge: Q=⅓P_{𝕆₂}+P_{ℍ₂}+P_ℂ, minus 3/8 (photon direction is an interpretation)', it: 'carica elettrica: Q=⅓P_{𝕆₂}+P_{ℍ₂}+P_ℂ, meno 3/8 (la direzione del fotone è un’interpretazione)' },
  T3: { w: { H1: -1 / 2, H2: 1 / 2 }, en: 'su(2) Cartan: ½(P_{ℍ₂}−P_{ℍ₁})', it: 'Cartan di su(2): ½(P_{ℍ₂}−P_{ℍ₁})' },
  l3: { w: { O1: 1, O2: -1 }, en: 'su(3) Cartan λ₃', it: 'Cartan di su(3) λ₃' },
  l8: { w: { O1: 1, O2: 1, O3: -2 }, en: 'su(3) Cartan λ₈ (unnormalised)', it: 'Cartan di su(3) λ₈ (non normalizzato)' }
};
const REP = { uL: '(3,2,+1/6)', dL: '(3,2,+1/6)', uR: '(3,1,+2/3)', dR: '(3,1,−1/3)', nuL: '(1,2,−1/2)', eL: '(1,2,−1/2)', eR: '(1,1,−1)', nuR: '(1,1,0)' };
const KIND_EN = { matter: 'matter', gauge: 'gauge root', replica: 'replica', cartan: 'diagonal' };
const KIND_IT = { matter: 'materia', gauge: 'radice di gauge', replica: 'replica', cartan: 'diagonale' };

/* ---------- data helpers ---------- */
const OMEGA_N = DICT.omega.N;
const CODE = DICT.code.faces;                         // 16 integers
const REPS = (() => {                                 // coset representative per class
  const m = {}; DICT.states.forEach(s => { [...s.faces, ...s.phase_faces].forEach(f => { if (!(f.class in m)) m[f.class] = f.N; }); });
  DICT.cartan.forEach(c => { [...c.faces, ...c.phase_faces].forEach(f => { if (!(f.class in m)) m[f.class] = f.N; }); });
  return m;
})();
const CLASSES = Array.from({ length: 16 }, (_, i) => i);
const classRep = c => { if (REPS[c] !== undefined) return REPS[c]; return null; };
function allClassReps() {
  // build reps for all 16 classes from the footprint data not shipped: derive by xor with the omega class partner
  const r = { ...REPS }; return r;
}
const ORBIT = (() => { const o = {}; Object.entries(DICT.channels.by_channel).forEach(([c, v]) => v.classes.forEach(k => { o[k] = +c; })); o[0] = 0; o[7] = 0; return o; })();
function normalise(entry, group) {
  if (group === 'cartan') return { ...entry, kind: 'cartan', classes: [0, entry.phase_class], channel: 0, grade_parity: 0, grades: [...new Set([...entry.faces, ...entry.phase_faces].map(f => f.grade))].sort((a, b) => a - b) };
  return entry;
}
const ENTRIES = [
  ...DICT.states.map(s => ({ ...s, group: s.kind === 'matter' ? 'matter' : s.kind === 'gauge' ? 'gauge' : 'replica' })),
  ...DICT.cartan.map(c => ({ ...normalise(c, 'cartan'), group: 'cartan' }))
];
const lbl = (e, lang) => lang === 'en' ? e.label : e.label.replace('colour', 'colore').replace('gluon root', 'radice di gluone').replace('weak', 'debole').replace('colour', 'colore').replace('hypercharge', 'ipercarica').replace('electric charge', 'carica elettrica');
const faceSet = e => new Set([...(e.faces || []).map(f => f.N)]);
const phaseSet = e => new Set([...(e.phase_faces || []).map(f => f.N)]);

/* ---------- pictures ---------- */
function cubePositions(n, size) {
  const vs = []; const a = Array.from({ length: n }, (_, i) => [Math.cos(Math.PI * i / Math.max(n, 1) + 0.3), Math.sin(Math.PI * i / Math.max(n, 1) + 0.3)]);
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (let v = 0; v < 2 ** n; v++) { let x = 0, y = 0; for (let i = 0; i < n; i++) if (v >> i & 1) { x += a[i][0]; y += a[i][1]; } vs.push([x, y]); minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const m = n <= 4 ? 34 : 12, s = (size - 2 * m) / Math.max(maxx - minx, maxy - miny, 1e-9);
  return vs.map(([x, y]) => [m + (x - minx) * s + (size - 2 * m - (maxx - minx) * s) / 2, m + (y - miny) * s + (size - 2 * m - (maxy - miny) * s) / 2]);
}
function Cube({ n, hl = new Set(), hl2 = new Set(), size = 220, labels = false }) {
  const P = useMemo(() => cubePositions(n, size), [n, size]);
  const lines = []; for (let v = 0; v < 2 ** n; v++) for (let i = 0; i < n; i++) if (!(v >> i & 1)) lines.push([v, v | (1 << i)]);
  const dot = n >= 7 ? 1.6 : n >= 5 ? 2.4 : 4;
  return <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${n}-cube`}>
    {lines.map(([a, b], i) => <line key={i} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke="currentColor" strokeOpacity={n >= 7 ? .12 : .3} strokeWidth=".6" />)}
    {P.map(([x, y], v) => { const h1 = hl.has(v), h2 = hl2.has(v); return <circle key={v} cx={x} cy={y} r={h1 || h2 ? dot * 1.9 : dot} fill={h1 ? '#4cc9f0' : h2 ? '#ff5d8f' : 'currentColor'} fillOpacity={h1 || h2 ? 1 : .55} stroke={h1 || h2 ? '#fff' : 'none'} strokeWidth=".6" />; })}
    {labels && n <= 4 && P.map(([x, y], v) => <text key={'t' + v} x={x + 6} y={y - 5} fontSize="9" fill="currentColor">{v.toString(2).padStart(n, '0')}</text>)}
  </svg>;
}
function Simplex({ n, size = 220 }) {
  if (n === 0) return <svg viewBox={`0 0 ${size} ${size}`}><circle cx={size / 2} cy={size / 2} r="6" fill="none" stroke="currentColor" strokeDasharray="3 3" /><text x={size / 2} y={size / 2 + 26} textAnchor="middle" fontSize="11" fill="currentColor">∅ (scalar face)</text></svg>;
  const P = Array.from({ length: n }, (_, i) => n === 1 ? [size / 2, size / 2] : [size / 2 + (size / 2 - 22) * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), size / 2 + (size / 2 - 22) * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)]);
  return <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${n - 1}-simplex`}>
    {P.flatMap((a, i) => P.slice(i + 1).map((b, j) => <line key={i + '-' + j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="currentColor" strokeOpacity=".35" strokeWidth=".8" />))}
    {P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill="#4cc9f0" stroke="#0008" />)}
  </svg>;
}
function PrimeGrid({ n, hl = new Set(), hl2 = new Set(), size = 220, numbers = false }) {
  const cols = n >= 8 ? 16 : Math.ceil(Math.sqrt(2 ** n)), rows = Math.ceil(2 ** n / cols), c = (size - 4) / cols;
  const cells = []; for (let v = 0; v < 2 ** n; v++) {
    const x = 2 + (v % cols) * c, y = 2 + Math.floor(v / cols) * c, p = isPrime(v), h1 = hl.has(v), h2 = hl2.has(v);
    cells.push(<g key={v}><rect x={x} y={y} width={c - .6} height={c - .6} fill={h1 ? '#4cc9f0' : h2 ? '#ff5d8f' : p ? '#ffd166' : 'currentColor'} fillOpacity={h1 || h2 ? .95 : p ? .55 : .08} />
      {numbers && <text x={x + c / 2} y={y + c / 2 + 3} fontSize={Math.min(11, c / 2.2)} textAnchor="middle" fill="currentColor">{v}</text>}</g>);
  }
  return <svg viewBox={`0 0 ${size} ${Math.max(size * rows / cols, 30)}`} role="img" aria-label="integer grid with primes">{cells}</svg>;
}
function GradeBars({ row, size = 220 }) {
  const mx = Math.max(...row.grades.map(g => g.count)), w = (size - 10) / row.grades.length;
  return <svg viewBox={`0 0 ${size} 150`} role="img" aria-label="grade counts">
    {row.grades.map((g, i) => { const h = 90 * g.count / mx; return <g key={i}><rect x={5 + i * w + 2} y={105 - h} width={w - 4} height={h} fill="#4cc9f0" fillOpacity=".8" /><text x={5 + i * w + w / 2} y={118} fontSize="9" textAnchor="middle" fill="currentColor">{g.count}</text><text x={5 + i * w + w / 2} y={130} fontSize="7.5" textAnchor="middle" fill="currentColor" fillOpacity=".7">{g.factors}</text><text x={5 + i * w + w / 2} y={144} fontSize="8" textAnchor="middle" fill="currentColor" fillOpacity=".6">g{g.g}</text></g>; })}
  </svg>;
}
function PeirceGraph({ entry, size = 260 }) {
  const P = {}; VERTS.forEach((v, i) => { P[v] = vpos(i, size / 2 - 34, size / 2, size / 2 + 4); });
  const from = entry.from, to = entry.to, chan = entry.channel;
  const chanEdges = chan ? DICT.channels.by_channel[chan].edges : [];
  const isSel = e => (e.edge[0] === from && e.edge[1] === to) || (e.edge[0] === to && e.edge[1] === from);
  return <svg viewBox={`0 0 ${size} ${size + 8}`} role="img" aria-label="Peirce simplex">
    {DICT.channels.edges28.map((e, i) => { const [a, b] = e.edge.map(v => P[v]); const sel = isSel(e), mate = chan && e.channel === chan;
      return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CH[e.channel]} strokeOpacity={sel ? 1 : mate ? .75 : .16} strokeWidth={sel ? 3.4 : mate ? 1.8 : .8} strokeDasharray={e.kind === 'replica' ? '4 3' : undefined} />; })}
    {from && to && (() => { const a = P[from], b = P[to], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, tx = b[0] - ux * 14, ty = b[1] - uy * 14;
      return <polygon points={`${b[0] - ux * 9},${b[1] - uy * 9} ${tx - uy * 5},${ty + ux * 5} ${tx + uy * 5},${ty - ux * 5}`} fill="#fff" />; })()}
    {VERTS.map(v => { const [x, y] = P[v], hot = v === from || v === to; return <g key={v}><circle cx={x} cy={y} r={hot ? 14 : 11} fill={BLOCK_COLORS[VBLOCK[v]]} stroke={hot ? '#fff' : '#0008'} strokeWidth={hot ? 2 : 1} /><text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#111">{v}</text></g>; })}
    {entry.kind === 'cartan' && CARTAN_INFO[entry.id] && VERTS.map(v => { const w = CARTAN_INFO[entry.id].w[v[0] === 'O' ? 'O' : v] ?? CARTAN_INFO[entry.id].w[v]; if (w === undefined) return null; const [x, y] = P[v]; return <text key={'w' + v} x={x} y={y - 17} textAnchor="middle" fontSize="8.5" fill="currentColor">{w === Math.round(w) ? w : w.toFixed(3)}</text>; })}
  </svg>;
}
function CosetGrid({ entry, size = 260 }) {
  // rows: 16 classes ordered by channel; columns: 16 code words. cell = rep_class XOR code_word
  const order = [0, 7, 1, 6, 2, 5, 3, 4, 8, 15, 9, 14, 10, 13, 11, 12];
  const real = faceSet(entry), ph = phaseSet(entry);
  const reps = useMemo(() => {                       // class reps from data: any face gives its class; others via the omega partner
    const m = {}; ENTRIES.forEach(e => [...e.faces, ...e.phase_faces].forEach(f => { m[f.class] = m[f.class] ?? f.N; }));
    Object.keys(m).forEach(c => { const p = ORBIT[c] === 0 ? null : null; });
    return m;
  }, []);
  const known = order.filter(c => reps[c] !== undefined);
  const c = (size - 30) / 16;
  return <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="coset grid">
    {order.map((cl, r) => reps[cl] === undefined ? null : CODE.map((cw, j) => { const N = reps[cl] ^ cw, h1 = real.has(N), h2 = ph.has(N); return <rect key={r + '-' + j} x={28 + j * c} y={4 + r * c} width={c - .8} height={c - .8} fill={h1 ? '#4cc9f0' : h2 ? '#ff5d8f' : CH[ORBIT[cl]] ?? '#888'} fillOpacity={h1 || h2 ? 1 : .22} />; }))}
    {order.map((cl, r) => reps[cl] === undefined ? null : <text key={'l' + r} x="24" y={4 + r * c + c * .72} fontSize="8" textAnchor="end" fill="currentColor">{cl}</text>)}
  </svg>;
}
function Fano({ pick, setPick, entry }) {
  const members = ch => DICT.channels.by_channel[ch].edges.filter(e => e.kind !== 'replica').map(e => e.edge.join('–'));
  const even = DICT.channels.even_channels;
  return <svg viewBox="0 0 360 310" role="img" aria-label="Fano plane of channels">
    {[[3, 8], [8, 9], [9, 3]].map(([a, b], i) => <line key={i} x1={FANO_POS[a][0]} y1={FANO_POS[a][1]} x2={FANO_POS[b][0]} y2={FANO_POS[b][1]} stroke="currentColor" strokeOpacity=".45" />)}
    {[[3, 1], [8, 10], [9, 11]].map(([a, b], i) => <line key={'m' + i} x1={FANO_POS[a][0]} y1={FANO_POS[a][1]} x2={FANO_POS[b][0]} y2={FANO_POS[b][1]} stroke="currentColor" strokeOpacity=".45" />)}
    <circle cx="180" cy="183" r="67" fill="none" stroke="#4cc9f0" strokeOpacity=".7" strokeWidth="2" strokeDasharray="5 3" />
    {Object.entries(FANO_POS).map(([ch, [x, y]]) => { const c = +ch, on = entry && entry.channel === c;
      return <g key={ch} onClick={() => setPick && setPick(c)} style={{ cursor: 'pointer' }}><circle cx={x} cy={y} r={on ? 19 : 16} fill={CH[c]} stroke={on ? '#fff' : '#0008'} strokeWidth={on ? 3 : 1} /><text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111">{c}</text></g>; })}
  </svg>;
}

/* ---------- main ---------- */
const STYLE = `
.dict{margin:0;max-width:none;padding:0}
.dict h2{margin:.2rem 0 .6rem}.dict h3{margin:1.4rem 0 .5rem}
.dict .d-card{border:1px solid rgba(160,170,200,.28);border-radius:14px;padding:1rem 1.1rem;background:rgba(120,130,170,.07)}
.dict .d-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem}
.dict .d-row2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin-top:.8rem}
.dict .d-cap{font-size:.74rem;opacity:.72;margin:.2rem 0 0}.dict svg{width:100%;height:auto;display:block}
.dict .d-chips{display:flex;flex-wrap:wrap;gap:.35rem}.dict button.d-chip{font:inherit;font-size:.82rem;border:1px solid rgba(160,170,200,.4);background:transparent;color:inherit;border-radius:99px;padding:.2rem .7rem;cursor:pointer}
.dict button.d-chip.on{background:#4cc9f0;color:#06222b;border-color:#4cc9f0}
.dict .d-head{display:flex;gap:.6rem;align-items:baseline;flex-wrap:wrap}.dict .d-badge{font-size:.72rem;border:1px solid;border-radius:99px;padding:.1rem .6rem}
.dict .d-mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.76rem;word-break:break-all}.dict .d-card h4{margin:.1rem 0 .35rem;font-size:.9rem}
.dict .d-card p{margin:.25rem 0;font-size:.86rem}
.dict .d-stages{display:flex;gap:.3rem;flex-wrap:wrap;margin:.5rem 0}
@media(max-width:900px){.dict .d-row{grid-template-columns:repeat(2,minmax(0,1fr))}.dict .d-row2{grid-template-columns:1fr}}`;

function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }

function Ladder({ lang, profile }) {
  const [n, setN] = useState(8);
  const t = UI[lang]; const learner = profile === 'Young Learner';
  const row = DICT.ladder[Math.min(n, 16)];
  const cell = cliffordCell(0, Math.min(n, 16)), neutral = n % 2 === 0 ? cliffordCell(n / 2, n / 2) : null;
  const txt = n <= 8 ? STAGE[lang][n] : TAIL[lang];
  const k = row.k, r = row.r, genesis = `Cl(${k},${k}${r ? ',1' : ''})`;
  return <div>
    <div className="d-stages" role="tablist" aria-label={t.stage}>{Array.from({ length: 10 }, (_, i) => <button key={i} className={'d-chip' + ((i === 9 ? n > 8 : n === i) ? ' on' : '')} onClick={() => setN(i === 9 ? 9 : i)} aria-pressed={i === 9 ? n > 8 : n === i}>{i === 9 ? '9–16' : i}</button>)}</div>
    <p style={{ fontSize: '.95rem' }}><b>{t.stage}: {n > 8 ? '9–16' : n}</b> — {learner ? txt[0] : txt[1]}</p>
    <div className="d-row">
      <div className="d-card"><h4>{t.views.alg}</h4>{n <= 8 && <p className="d-mono">{lang === 'en' ? 'Genesis cell' : 'Cella Genesi'} {genesis}{learner ? '' : ` · dim ${row.dim}`}</p>}<p className="d-mono">Cl(0,{n}) = {cell.algebra}</p>{!learner && neutral && <p className="d-mono">Cl({n / 2},{n / 2}) = {neutral.algebra}</p>}{!learner && <p className="d-mono">I² = {cell.omega2 > 0 ? '+1' : '−1'}</p>}<GradeBars row={row} /></div>
      <div className="d-card"><h4>{t.views.sim}</h4><Simplex n={Math.min(n, 8)} /><p className="d-cap">{n === 0 ? '0-simplex: ∅' : `${Math.min(n, 8)} vertices = ${Math.min(n, 8) - 1}-simplex · ${2 ** Math.min(n, 8)} faces incl. ∅`}</p></div>
      <div className="d-card"><h4>{t.views.cub}</h4><Cube n={Math.min(n, 8)} labels /><p className="d-cap">{2 ** Math.min(n, 8)} vertices · {Math.min(n, 8) * 2 ** Math.max(Math.min(n, 8) - 1, 0)} edges · {3 ** Math.min(n, 8)} faces</p></div>
      <div className="d-card"><h4>{t.views.pri}</h4><PrimeGrid n={Math.min(n, 8)} numbers={n <= 4} /><p className="d-cap">{DICT.ladder[Math.min(n, 8)].primes_in_labels} primes among labels 0…{2 ** Math.min(n, 8) - 1}{!learner && row.odd_primes_in_grade_counts.length ? ` · odd primes in C(${n > 8 ? 'n' : n},k): ${row.odd_primes_in_grade_counts.join(', ')}` : ''}</p></div>
    </div>
    {n >= 8 && <div className="d-card" style={{ marginTop: '.8rem' }}><h4>{t.why8H}</h4><ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{WHY8[lang].map((x, i) => <li key={i} style={{ fontSize: '.86rem' }}>{x}</li>)}</ul></div>}
  </div>;
}

function Detail({ e, lang, profile }) {
  const t = UI[lang], learner = profile === 'Young Learner';
  const real = [...faceSet(e)], ph = [...phaseSet(e)];
  const isEdge = e.kind !== 'cartan', ch = e.channel;
  const KI = lang === 'en' ? KIND_EN : KIND_IT;
  const furey = isEdge
    ? `${e.blocks[0].replace('C3_O', 'ℂ³_𝕆').replace('C2_H', 'ℂ²_ℍ').replace('C_C', 'ℂ_ℂ').replace('C_O', 'ℂ_𝕆').replace('C_last', 'ℂ_last')} ← ${e.blocks[1].replace('C3_O', 'ℂ³_𝕆').replace('C2_H', 'ℂ²_ℍ').replace('C_C', 'ℂ_ℂ').replace('C_O', 'ℂ_𝕆').replace('C_last', 'ℂ_last')} · Y=${fracStr(e.Y)} · Q=${fracStr(e.Q)}${REP[e.id.replace(/\d$/, '')] ? ' · ' + REP[e.id.replace(/\d$/, '')] : ''}`
    : CARTAN_INFO[e.id][lang];
  const simplex = isEdge
    ? `${lang === 'en' ? 'Peirce simplex edge' : 'Lato del simplesso di Peirce'} ${e.from}→${e.to} · ${lang === 'en' ? 'channel' : 'canale'} ${ch}${lang === 'en' ? ': a perfect matching of the 8 vertices with' : ': accoppiamento perfetto degli 8 vertici con'} ${DICT.channels.by_channel[ch].edges.map(x => x.edge.join('–')).join(', ')}`
    : (lang === 'en' ? 'weights on the 8 vertices of the Peirce simplex (numbers on the picture)' : 'pesi sugli 8 vertici del simplesso di Peirce (numeri nel disegno)');
  const foot = ch ? DICT.channels.blade_simplex_footprint[ch] : DICT.channels.blade_simplex_footprint[0];
  const gradeDims = e.grades.map(g => g - 1).join(', ');
  const clifford = isEdge
    ? `${lang === 'en' ? 'Real part: 8 blades of grade' : 'Parte reale: 8 blade di grado'} ${[...new Set(e.faces.map(f => f.grade))].join(', ')} ${lang === 'en' ? 'in coset' : 'nel laterale'} ${e.faces[0].class}${learner ? '' : ` (coefficients ${[...new Set(e.faces.map(f => fracStr(f.coef)))].join(', ')})`}; ${lang === 'en' ? 'ω-partner in coset' : 'partner ω nel laterale'} ${e.phase_faces[0].class}. ${lang === 'en' ? 'Blade-simplex faces of dimension' : 'Facce del simplesso dei blade di dimensione'} ${gradeDims}.`
    : `${lang === 'en' ? 'Diagonal: blades of grade' : 'Diagonale: blade di grado'} ${[...new Set(e.faces.map(f => f.grade))].join(', ')} (${lang === 'en' ? 'code faces' : 'facce del codice'}); ${lang === 'en' ? 'phase form ω·X in coset' : 'forma di fase ω·X nel laterale'} ${e.phase_class}.`;
  const cube = `${[...real.map(n => n.toString(2).padStart(8, '0')), ...ph.map(n => n.toString(2).padStart(8, '0'))].join(' ')}`;
  const primeList = [...real, ...ph].sort((a, b) => a - b).map(n => `${n}${learner ? '' : ` (${fstr(n)})`}`).join(', ');
  const cross = isEdge
    ? (lang === 'en'
      ? `${lbl(e, lang)}: edge ${e.from}→${e.to} of the Peirce simplex, channel ${ch} (${e.grade_parity ? 'odd' : 'even'} grades). In Clifford it is 8+8 blades ${e.grade_parity ? 'of odd grade (the two copies are exchanged by g₈)' : 'of even grade (inside one octonion copy)'}; in the 8-cube it is two 8-vertex pieces of two cosets, one the ω-translate (XOR ${OMEGA_N.toString(2).padStart(8, '0')}) of the other; as integers: ${[...real].sort((a, b) => a - b).join(', ')}.`
      : `${lbl(e, lang)}: lato ${e.from}→${e.to} del simplesso di Peirce, canale ${ch} (gradi ${e.grade_parity ? 'dispari' : 'pari'}). In Clifford sono 8+8 blade ${e.grade_parity ? 'di grado dispari (le due copie sono scambiate da g₈)' : 'di grado pari (dentro una copia ottonionica)'}; nell’8-cubo sono due pezzi da 8 vertici di due laterali, uno traslato di ω (XOR ${OMEGA_N.toString(2).padStart(8, '0')}) dell’altro; come interi: ${[...real].sort((a, b) => a - b).join(', ')}.`)
    : (lang === 'en' ? `${lbl(e, lang)}: a combination of the 16 code blades (the Witt torus) on the Peirce vertices; its phase form lives in the ω-coset.` : `${lbl(e, lang)}: combinazione dei 16 blade del codice (toro di Witt) sui vertici di Peirce; la sua forma di fase vive nel laterale di ω.`);
  const cards = [[t.cols.furey, furey], [t.cols.sim, simplex + (isEdge ? ` · ${lang === 'en' ? 'footprint in the blade 7-simplex' : 'impronta nel 7-simplesso dei blade'}: ${foot.vertices.length ? foot.vertices.length + (lang === 'en' ? ' vertices, ' : ' vertici, ') : ''}${foot.edges.length ? foot.edges.length + (lang === 'en' ? ' edges, ' : ' spigoli, ') : ''}${Object.entries(foot.faces_by_grade).map(([g, c]) => `${c}×dim ${g - 1}`).join(', ')}` : '')], [t.cols.cli, clifford], [t.cols.cub, cube], [t.cols.pri, primeList + (learner ? '' : (lang === 'en' ? ` · each digit is 1 in exactly 4 of the 8 real faces (integers sum to 1020 = 4·255)` : ` · ogni cifra vale 1 in esattamente 4 degli 8 blade reali (somma degli interi 1020 = 4·255)`))], [t.cols.crs, cross]];
  return <div className="d-card" style={{ marginTop: '.8rem' }}>
    <div className="d-head"><h3 style={{ margin: 0 }}>{lbl(e, lang)}</h3><span className="d-badge" style={{ color: ch ? CH[ch] : '#8b93a8', borderColor: ch ? CH[ch] : '#8b93a8' }}>{KI[e.kind]}{ch ? ` · ${lang === 'en' ? 'channel' : 'canale'} ${ch}` : ''}</span></div>
    <div className="d-row2">{cards.map(([h, b]) => <div className="d-card" key={h}><h4>{h}</h4><p className={h === t.cols.cub || h === t.cols.pri ? 'd-mono' : ''}>{b}</p></div>)}</div>
    <div className="d-row" style={{ marginTop: '.8rem' }}>
      <div><PeirceGraph entry={e} /><p className="d-cap">{t.cols.sim}</p></div>
      <div><CosetGrid entry={e} /><p className="d-cap">{t.cols.cli}: 16 {lang === 'en' ? 'cosets × 16 code words' : 'laterali × 16 parole del codice'}</p></div>
      <div><Cube n={8} hl={faceSet(e)} hl2={phaseSet(e)} size={260} /><p className="d-cap">{t.cols.cub}: 256 {lang === 'en' ? 'vertices; blue real part, pink ω-partner' : 'vertici; blu parte reale, rosa partner ω'}</p></div>
      <div><PrimeGrid n={8} hl={faceSet(e)} hl2={phaseSet(e)} size={260} /><p className="d-cap">{t.cols.pri}: 0…255 {lang === 'en' ? '(gold = prime numbers)' : '(oro = numeri primi)'}</p></div>
    </div>
  </div>;
}

function CartanLedger({ lang }) {
  const L = DICT.cartan_ledger, en = lang === 'en', ids = ['Y0', 'Q0', 'T3', 'l3', 'l8'];
  const nm = { Y0: 'Y₀ = Y − 3/8', Q0: 'Q₀ = Q − 3/8', T3: 'T₃', l3: 'λ₃', l8: 'λ₈' };
  const gr = g => Object.entries(g).map(([k, v]) => v + '×' + (k === '2' ? (en ? 'bivector' : 'bivettore') : k === '6' ? (en ? 'hexavector' : 'esavettore') : 'g' + k)).join(' + ');
  const sg = (pos, n) => pos === 0 ? (en ? 'all −' : 'tutti −') : pos === n ? (en ? 'all +' : 'tutti +') : pos + '+ / ' + (n - pos) + '−';
  return <div className="d-card">
    <p>{en ? <>The five diagonal generators are signed combinations of only <b>{L.distinct_code_faces.length}</b> code faces and their <b>{L.distinct_phase_faces.length}</b> ω-translates (XOR with ω = N {L.omega_mask} = <span className="d-mono">{L.omega_bits}</span>, a single grade-6 face). All 14 are ℂ-linear. The empty face is absent for every operator: all five are traceless. Y₀ and Q₀ are the traceless parts of hypercharge and charge (Tr_ℂ Y = 3 over dimension 8).</> : <>I cinque generatori diagonali sono combinazioni con segno di sole <b>{L.distinct_code_faces.length}</b> facce del codice e delle loro <b>{L.distinct_phase_faces.length}</b> traslate per ω (XOR con ω = N {L.omega_mask} = <span className="d-mono">{L.omega_bits}</span>, una sola faccia di grado 6). Tutte e 14 sono ℂ-lineari. La faccia vuota è assente in ogni operatore: tutti e cinque sono a traccia nulla. Y₀ e Q₀ sono le parti a traccia nulla di ipercarica e carica (Tr_ℂ Y = 3 su dimensione 8).</>}</p>
    <div style={{ overflowX: 'auto' }}><table className="d-mono" style={{ borderCollapse: 'collapse', fontSize: '.8rem', width: '100%' }}>
      <thead><tr>{[en ? 'operator' : 'operatore', en ? 'code faces' : 'facce codice', en ? 'phase faces (grades)' : 'facce di fase (gradi)', en ? 'signs code' : 'segni codice', en ? 'signs phase' : 'segni fase', en ? '|coef| code' : '|coef| codice'].map(h => <th key={h} style={{ textAlign: 'left', padding: '2px 8px', borderBottom: '1px solid currentColor' }}>{h}</th>)}</tr></thead>
      <tbody>{ids.map(i => { const r = L.per_operator[i]; return <tr key={i}><td style={{ padding: '2px 8px' }}>{nm[i]}</td><td style={{ padding: '2px 8px' }}>{r.code_faces}</td><td style={{ padding: '2px 8px' }}>{r.phase_faces} = {gr(r.phase_grades)}</td><td style={{ padding: '2px 8px' }}>{sg(r.code_pos, r.code_faces)}</td><td style={{ padding: '2px 8px' }}>{sg(r.phase_pos, r.phase_faces)}</td><td style={{ padding: '2px 8px' }}>{r.code_abs.join(', ')}</td></tr>; })}</tbody></table></div>
    <p>{en ? 'Y₀ and Q₀ share one code set: 3 Fano-line tetrahedra {0,1,2,7}, {2,4,5,7}, {2,3,6,7}, their 3 complements {3,4,5,6}, {0,1,3,6}, {0,1,4,5}, and the top face (all 8 vertices). The operators overlap heavily (face {0,1,4,5} is used by all five), so the counts are per operator and do not partition anything; 9 of the 16 code faces are unused.' : 'Y₀ e Q₀ condividono lo stesso insieme di facce: 3 tetraedri di retta di Fano {0,1,2,7}, {2,4,5,7}, {2,3,6,7}, i 3 complementari {3,4,5,6}, {0,1,3,6}, {0,1,4,5} e la faccia superiore (tutti e 8 i vertici). Gli operatori si sovrappongono molto (la faccia {0,1,4,5} è usata da tutti e cinque), quindi i conteggi sono per operatore e non partizionano nulla; 9 delle 16 facce del codice restano inutilizzate.'}</p>
    <p className="d-cap">{en ? 'Coefficient sums depend on the normalisation and are not structure; counts, grades and the XOR rule are. Face integers and their prime factors change with vertex order.' : 'Le somme dei coefficienti dipendono dalla normalizzazione e non sono struttura; lo sono i conteggi, i gradi e la regola XOR. Gli interi delle facce e i loro fattori primi cambiano con l’ordine dei vertici.'}</p>
  </div>;
}

export default function DictionarySection({ lang = 'en', profile = 'Young Learner' }) {
  const t = UI[lang] || UI.en, learner = profile === 'Young Learner';
  const [sel, setSel] = useState('uL1');
  const e = ENTRIES.find(x => x.id === sel) || ENTRIES[0];
  const groups = ['matter', 'gauge', 'cartan', 'replica'];
  return <section className="dict" id="dictionary" aria-labelledby="dict-h">
    <style>{STYLE}</style>
    <p className="eyebrow">{t.eyebrow}</p><h2 id="dict-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <h3>{t.ladderH}</h3><Ladder lang={lang} profile={profile} />
    <h3>{t.dictH}</h3><p className="d-cap" style={{ fontSize: '.85rem' }}>{t.pick}</p>
    {groups.map(g => <div key={g} style={{ margin: '.5rem 0' }}><div className="d-cap" style={{ marginBottom: '.2rem' }}>{t.groups[g]}</div><div className="d-chips">{ENTRIES.filter(x => x.group === g).map(x => <button key={x.id} className={'d-chip' + (x.id === sel ? ' on' : '')} onClick={() => setSel(x.id)} aria-pressed={x.id === sel}>{lbl(x, lang)}</button>)}</div></div>)}
    <Detail e={e} lang={lang} profile={profile} />
    <p className="d-cap" style={{ fontSize: '.82rem' }}>{t.antiNote} {t.open}</p>
    <h3>{t.cartH}</h3><CartanLedger lang={lang} />
    <h3>{t.fanoH}</h3>
    <div className="d-row2"><div className="d-card"><Fano pick={e.channel} setPick={c => { const x = ENTRIES.find(z => z.channel === c && z.kind === 'matter') || ENTRIES.find(z => z.channel === c); if (x) setSel(x.id); }} entry={e} /></div>
      <div className="d-card" style={{ gridColumn: 'span 2' }}><p>{lang === 'en' ? 'The 28 edges of the Peirce simplex fall into 7 parallel classes (channels); any two channels lie on exactly one of 7 lines of three: a Fano plane.' : 'I 28 lati del simplesso di Peirce cadono in 7 classi parallele (canali); due canali qualsiasi stanno su una sola delle 7 rette da tre: un piano di Fano.'}</p>
        <p>{lang === 'en' ? 'The dashed circle is a line: channels 1, 10, 11 hold the even-grade blades (colour-neutral edges: gauge roots and leptons). The other four channels form the quadrangle of odd-grade blades (quark edges and ν_R). Grade parity is whether the edge joins the two octonion copies.' : 'Il cerchio tratteggiato è una retta: i canali 1, 10, 11 contengono i blade di grado pari (lati neutri di colore: radici di gauge e leptoni). Gli altri quattro canali formano il quadrangolo dei blade di grado dispari (lati dei quark e ν_R). La parità del grado dice se il lato unisce le due copie ottonioniche.'}</p>
        <p>{lang === 'en' ? 'In the blade 7-simplex, each odd channel owns a pair of vertices ({0,1}, {2,7}, {3,6}, {4,5}); each even channel owns 8 edges; the 4 vertex pairs are the edges of the diagonal channel.' : 'Nel 7-simplesso dei blade, ogni canale dispari possiede una coppia di vertici ({0,1}, {2,7}, {3,6}, {4,5}); ogni canale pari possiede 8 spigoli; le 4 coppie di vertici sono gli spigoli del canale diagonale.'}</p>
        {!learner && <p className="d-cap">{lang === 'en' ? 'Not checked: whether this Fano plane equals the octonion multiplication plane.' : 'Non verificato: se questo piano di Fano coincida con il piano di moltiplicazione degli ottonioni.'}</p>}</div></div>
    <h3>{t.dlH}</h3>
    <div className="d-card"><p>{t.dlText}</p>
      <div className="d-chips"><button className="d-chip on" onClick={() => download('dictionary_selfcheck.py', SELFCHECK_PY, 'text/x-python')}>{t.dlPy}</button><button className="d-chip" onClick={() => download('dictionary.json', JSON.stringify(DICT, null, 1), 'application/json')}>{t.dlJson}</button></div>
      <p className="d-mono" style={{ marginTop: '.5rem' }}>{t.dlCmd}</p></div>
  </section>;
}
