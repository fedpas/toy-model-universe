// A small LaTeX -> Unicode renderer for the equations of the translation matrix (the page has no KaTeX; the test compiles every string with KaTeX too).
// Covers exactly the commands used in selfcheck/forque.json; an unknown command is left visible as "?name" so that a test can catch it.
const OFF = (base, chars) => Object.fromEntries([...chars].map((c, i) => [c, String.fromCodePoint(base + i)]));
const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LO = 'abcdefghijklmnopqrstuvwxyz', DG = '0123456789';
const BOLD = { ...OFF(0x1D400, UP), ...OFF(0x1D41A, LO), ...OFF(0x1D7CE, DG) };
const SANS = { ...OFF(0x1D5A0, UP), ...OFF(0x1D5BA, LO), ...OFF(0x1D7E2, DG) };
const BB = { ...OFF(0x1D538, UP), ...OFF(0x1D552, LO), ...OFF(0x1D7D8, DG), C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' };
const CAL = { ...OFF(0x1D49C, UP), B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' };
const FONTS = { mathbf: BOLD, mathsf: SANS, mathbb: BB, mathcal: CAL };
const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ' };
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', i: 'ⁱ', n: 'ⁿ', r: 'ʳ' };
const SYM = {
  cdot: '·', times: '×', wedge: '∧', vee: '∨', star: '⋆', epsilon: 'ε', alpha: 'α', delta: 'δ', lambda: 'λ', nu: 'ν', omega: 'ω', rho: 'ρ', Pi: 'Π', pm: '±',
  Rightarrow: '⇒', Longleftrightarrow: '⟺', Leftrightarrow: '⇔', iff: '⇔', to: '→', leftarrow: '←', equiv: '≡', ge: '≥', ne: '≠', neq: '≠', cup: '∪', emptyset: '∅', sim: '~', prime: '′', dots: '…', sum: 'Σ', bigwedge: '⋀',
  quad: '  ', qquad: '    ', textstyle: '', big: '', Big: '', left: '', right: '', rm: '', '{': '{', '}': '}',
  // step 11 (spinors): Greek, the lecture's boxes, relations
  theta: 'θ', sigma: 'σ', tau: 'τ', psi: 'ψ', Psi: 'Ψ', Phi: 'Φ', phi: 'φ', varphi: 'φ', eta: 'η', zeta: 'ζ', beta: 'β', gamma: 'γ', Gamma: 'Γ', mu: 'μ', pi: 'π',
  boxplus: '⊞', boxminus: '⊟', blacktriangle: '▲', in: '∈', cdots: '⋯', propto: '∝', circ: '∘', cong: '≅', le: '≤', mapsto: '↦', mp: '∓', perp: '⊥', prod: '∏', rangle: '⟩', oplus: '⊕', otimes: '⊗', infty: '∞', ell: 'ℓ', dim: 'dim',
};
const FUN = { cos: 'cos', sin: 'sin', cosh: 'cosh', sinh: 'sinh' };
const MARK = { dot: '̇', tilde: '̃', widetilde: '̃', bar: '̄', overline: '̄', vec: '⃗' };

function readGroup(s, i) { // s[i] is '{': return [inner, next index]
  let depth = 0, j = i;
  for (; j < s.length; j++) { if (s[j] === '{') depth++; else if (s[j] === '}') { depth--; if (depth === 0) break; } }
  return [s.slice(i + 1, j), j + 1];
}
function readArg(s, i) { // one argument: {group}, \command, or one character
  while (s[i] === ' ') i++;
  if (s[i] === '{') return readGroup(s, i);
  if (s[i] === '\\') { const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i)); return [m[0], i + m[0].length]; }
  return [s[i] || '', i + 1];
}
const mapChars = (str, table) => [...str].map(c => table[c] ?? c).join('');
function script(str, table, mark) { // sub/superscript: Unicode when every character exists, otherwise a bracketed ASCII form
  const t = tex(str);
  if ([...t].every(c => table[c])) return mapChars(t, table);
  return /^[A-Za-z0-9′±∅\u0370-\u03FF]+$/u.test(t) ? mark + t : mark + '(' + t + ')';
}
function tex(s) {
  let out = '';
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i)); const name = m[1]; i += m[0].length;
      if (/^[A-Za-z]+$/.test(name)) while (s[i] === ' ') i++;
      if (name === ' ' || name === ',' || name === ';' || name === '!' || name === ':') { out += name === '!' ? '' : ' '; continue; }
      if (name === '\\') { out += ' ; '; continue; }
      if (FONTS[name]) { const [a, j] = readArg(s, i); i = j; out += mapChars(tex(a), FONTS[name]); continue; }
      if (name === 'mathrm' || name === 'text' || name === 'operatorname') { const [a, j] = readArg(s, i); i = j; out += tex(a).replace(/^ +| +$/g, x => x); continue; }
      if (MARK[name]) { const [a, j] = readArg(s, i); i = j; const t = tex(a), g = [...t]; out += g.length === 1 ? t + MARK[name] : '(' + t + ')' + MARK[name]; continue; }
      if (name === 'tfrac' || name === 'dfrac' || name === 'frac') { const [a, j] = readArg(s, i), [b, k] = readArg(s, j); i = k; const ta = tex(a), tb = tex(b); if (ta === '1' && tb === '2') { out += '½'; continue; } out += (ta.length > 1 && !/^[\w₀-₉⁰-⁹]+$/u.test(ta) ? '(' + ta + ')' : ta) + '/' + (tb.length > 1 && !/^[\w₀-₉⁰-⁹]+$/u.test(tb) ? '(' + tb + ')' : tb); continue; }
      if (name === 'begin') { const [env, j] = readGroup(s, i); i = j; const e = s.indexOf('\\end{' + env + '}', i); const body = s.slice(i, e); i = e + ('\\end{' + env + '}').length; out += '[' + body.split('\\\\').map(r => r.split('&').map(x => tex(x.trim())).join(', ')).join(' ; ') + ']'; continue; }
      if (name === 'end') { const [, j] = readGroup(s, i); i = j; continue; }
      if (FUN[name]) { out += (/[A-Za-z0-9₀-₉]$/.test(out) ? ' ' : '') + FUN[name] + (/[A-Za-z\\]/.test(s[i] || '') ? ' ' : ''); continue; }
      if (name in SYM) { out += SYM[name]; continue; }
      out += '?' + name; continue;
    }
    if (c === '_' || c === '^') {
      const [a, j] = readArg(s, i + 1); i = j;
      out += c === '_' ? script(a, SUB, '_') : script(a, SUP, '^'); continue;
    }
    if (c === '{') { const [a, j] = readGroup(s, i); i = j; out += tex(a); continue; }
    if (c === '}') { i++; continue; }
    if (c === '~') { out += ' '; i++; continue; }
    if (c === '-') { out += '−'; i++; continue; }
    out += c; i++;
  }
  return out;
}
// tidy: collapse runs of spaces and the space left after a bracket
export const uni = s => tex(s).replace(/ {2,}/g, '  ').replace(/\s+$/, '').replace(/^\s+/, '');
export default uni;
