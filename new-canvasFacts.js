// Facts shared by the canvases. Everything is computed from the audited atlas; nothing is hand-set per sector.
import { AUDITED_ATLAS, cliffordCell } from './genesis_audit_v3.js';

export const PLUS = 0x4cc9f0, MINUS = 0xff5d8f, GOLD = 0xffd166, GHOST = 0xdfe7ff, DIM = 0x34425f;

export function atlasCell(sector) {
  const row = AUDITED_ATLAS.find((r) => r[0] === sector);
  return row && row[3] != null ? { p: row[3], q: row[4] } : null;
}
const popc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
// Spatial = Cl(p,q); Temporal = mirror Cl(q,p) (Q -> -Q).
export function cellFacts(p, q, mirror = false) {
  const P = mirror ? q : p, Q = mirror ? p : q, n = P + Q, c = cliffordCell(P, Q);
  const signs = [...Array(P).fill(1), ...Array(Q).fill(-1)];
  let compact = 0, boost = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) (signs[i] === signs[j] ? compact++ : boost++);
  const I2 = ((n * (n - 1)) / 2 % 2 ? -1 : 1) * (Q % 2 ? -1 : 1);
  return { p: P, q: Q, n, signs, algebra: c.algebra, compact, boost, I2, central: n % 2 === 1, dim: 2 ** n, name: `Cl(${P},${Q})` };
}
// a blade (bitmask over generators) squares to (-1)^(k(k-1)/2) times the product of its generators' squares
export function bladeSquare(mask, signs) {
  const k = popc(mask); let neg = 0;
  for (let i = 0; i < signs.length; i++) if (mask >> i & 1 && signs[i] < 0) neg++;
  return ((k * (k - 1)) / 2 + neg) % 2 ? -1 : 1;
}
export const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
export const gradeCounts = (n) => Array.from({ length: n + 1 }, (_, k) => binom(n, k));

// Genesis ladder: n null generators = k polarized pairs + r unpaired null (radical). Pairs give Cl(k,k); the radical adds an exterior factor.
export function genesisFacts(n) {
  const k = Math.floor(n / 2), r = n % 2;
  return { n, k, r, cell: `Cl(${k},${k}${r ? ',1' : ''})`, algebra: k === 0 && !r ? 'ℝ' : `M${sub(2 ** k)}(ℝ)${r ? '⊗Λ(ℝ¹)' : ''}`, dim: 2 ** (2 * k + r), budget: n / 8, reset: n === 8 };
}
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (x) => String(x).split('').map((d) => SUB[+d]).join('');
export const mono = (x) => (x === 1 ? '' : sub(x));

// Peirce blocks of the Furey ledger (real picture of End_R(V) = M16(R))
export const LEDGER_BLOCKS = [2, 6, 4, 2, 1, 1];
export const LEDGER_COLORS = [0x61dff0, 0x4fd18b, 0xffa06f, 0xa78bfa, 0xff5d8f, 0xffd166];

export const HOST_STYLE = 'position:absolute;left:10px;bottom:8px;right:10px;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#dfe7ff;pointer-events:none;text-shadow:0 1px 2px #000;';
export function addLegend(host, lines, budget) {
  host.style.position = 'relative';
  const d = document.createElement('div'); d.setAttribute('style', HOST_STYLE); d.className = 'canvas-legend';
  lines.forEach((t, i) => { const l = document.createElement('div'); l.textContent = t; if (i === 0) l.style.fontWeight = '700'; d.appendChild(l); });
  if (budget != null) {
    const bar = document.createElement('div'); bar.setAttribute('style', 'display:flex;gap:3px;margin-top:4px;align-items:center');
    for (let i = 0; i < 8; i++) { const b = document.createElement('span'); b.setAttribute('style', `width:18px;height:6px;border-radius:2px;background:${i < budget ? '#ffd166' : '#34425f'}`); bar.appendChild(b); }
    d.appendChild(bar);
  }
  host.appendChild(d); return d;
}
