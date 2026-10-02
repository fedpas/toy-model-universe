// =============================================================================
// genesis_audit_v3.js  -  Genesis ladder + audited atlas (ES module)
// Drop-in for ./genesis-metadata.js (GENESIS_METADATA) plus a patch layer for
// the 25 atlas nodes of matrixData.js (applyAudit).
//
// CORRECTED AXIOM SPINE (all views below are computed from it, not asserted)
//  A  Information is a null vector, n^2 = 0.  n null generators give
//     Cl(0,0,n) = Lambda(R^n): 2^n grades, no metric sign, no pairing.
//  B  Polarization = supplying a pairing {n,n~} = 1 (extra datum, not a
//     consequence of A).  Then e = n+n~ has e^2 = +1 and f = n-n~ has f^2 = -1.
//     k pairs give the NEUTRAL cell Cl(k,k) = M_{2^k}(R).  The sign of the
//     pairing is a Z2 gauge choice (n~ -> -n~).  An unpaired null stays radical.
//     Signed odd cells [2k+1, +-1] are faces of a fused pair, never reached
//     from a lone null.
//  C  Lattice cell [R, C] = Cl(p,q), R = p+q (size 2^R), C = p-q (type).
//     The algebra type depends only on C mod 8.  The period is DERIVED:
//     minimal shift of the type sequence, and the first rows in which every
//     residue class of their parity occurs twice, 8 columns apart (rows 7, 8).
//     Cl(n+8) = Cl(n) (x) M_16(R): construction may continue, novelty stops.
//  Metric mode: Temporal = mirror cell [R,-C] (Q -> -Q).  Neutral cells are
//  self-mirror, so Spatial and Temporal are the SAME algebra there.
//
// AUDIT CHANGE LOG (vs Genesis.pdf / Genesis.txt / matrixData.js)
//  1 Two nulls do not Witt-split into Cl(1,1): a pairing must be added.
//  2 Cl(0,0,1) -> Cl(1,0)/Cl(0,1) is not an isomorphism (rank invariant);
//    Cl(1,0), Cl(0,1) contract to it.  The real maps are quotient and inclusion.
//  3 Neutral ladder Cl(k,k) is always M_{2^k}(R): no C,H,O and no period there.
//  4 Nodes 3,5,7 are one pattern: Cl(k+1,k) = M_{2^k}(R)^2 for every k.
//  5 Node 1 coordinate [1,0] was impossible (R and C share parity).
//  6 4/17 and 210 are not reproduced by the lattice (no odd prime in 2^n).
//  7 Atlas: Cl(5,1) label vs [6,+2]; Cl(4,1) vs [5,-1]; Maxwell [8,+6];
//    Furey ledger [6,+2] / Cl(6,0)(x)Cl(2,0); Cl(2,0) is M_2(R) not H;
//    Cl(1,0) is R+R not a division algebra; Cl(1,3) is M_2(H) not biquaternion;
//    simplex face labels (grade k blade = (k-1)-face).
// =============================================================================

// ---------- derived structure ------------------------------------------------
const TYPE_BY_S = ['R', 'R2', 'R', 'C', 'H', 'H2', 'H', 'C']; // s = (p-q) mod 8
const SUB = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
const SYM = { R: 'ℝ', C: 'ℂ', H: 'ℍ' };

export function cliffordCell(p, q) {
  const n = p + q, s = (((p - q) % 8) + 8) % 8, kind = TYPE_BY_S[s];
  const base = kind[0], copies = kind.length > 1 ? 2 : 1;
  const d = { R: 1, C: 2, H: 4 }[base];
  const N = Math.sqrt(2 ** n / (d * copies));
  if (!Number.isInteger(N)) throw new Error(`bad dimension for Cl(${p},${q})`);
  const one = N === 1 ? SYM[base] : `M${SUB(N)}(${SYM[base]})`;
  const algebra = copies === 2 ? `${one}⊕${one}` : one;
  return {
    p, q, n, s, kind, dim: 2 ** n, N, algebra,
    omega2: (n * (n - 1) / 2 + q) % 2 === 0 ? 1 : -1, // volume element squared
    centreDim: n % 2 === 0 ? 1 : 2,                  // span{1} or span{1,omega}
    division: p === 0 && q <= 2,                     // R, C, H only
    mirror: { p: q, q: p }
  };
}
export const mirrorCell = (p, q) => cliffordCell(q, p);
export const cellName = (p, q) => `Cl(${p},${q})`;
export const coordOf = (p, q) => `B+F=${p + q}, B-F=${p - q > 0 ? '+' : ''}${p - q}`;
export const simplexView = (n) => (n === 0 ? 'Empty face (Ø)' : `${n - 1}-face (${n} vertices; a grade-k blade is a (k-1)-face)`);
export const cubeView = (n) => `Q${n}: ${2 ** n} vertices; all-ON corner ${'0'.repeat(8 - n)}${'1'.repeat(n)}`;
export const primeView = (n) => `2^${n} = ${2 ** n} (only prime 2; odd primes cannot arise from Axioms A,B)`;

export function signatureLattice(maxRow = 8) {
  const rows = [];
  for (let R = 0; R <= maxRow; R++) {
    const row = [];
    for (let C = -R; C <= R; C += 2) row.push({ R, C, ...cliffordCell((R + C) / 2, (R - C) / 2) });
    rows.push(row);
  }
  return rows;
}
export function periodDerivation() {
  let period = null;
  for (let d = 1; d <= 8 && !period; d++) if (TYPE_BY_S.every((t, s) => TYPE_BY_S[(s + d) % 8] === t)) period = d; // minimal shift
  const witness = { even: null, odd: null };
  for (const row of signatureLattice(12)) {
    const R = row[0].R, byRes = {};
    for (const c of row) (byRes[((c.C % 8) + 8) % 8] ??= []).push(c.algebra);
    const ok = Object.values(byRes).every((a) => a.length >= 2 && a.every((x) => x === a[0]));
    const key = R % 2 ? 'odd' : 'even';
    if (ok && witness[key] === null) witness[key] = R;
  }
  return { minimalPeriod: period, typeSequence: TYPE_BY_S.slice(), firstWitnessRows: witness };
}
// Blade census of Cl(p,q): population by (a,b) and number of blades squaring to +1.
export function bladeCensus(p, q) {
  const C = (n, k) => (k < 0 || k > n ? 0 : [...Array(k).keys()].reduce((a, i) => (a * (n - i)) / (i + 1), 1));
  let total = 0, active = 0; const cells = {};
  for (let a = 0; a <= p; a++) for (let b = 0; b <= q; b++) {
    const k = a + b, m = Math.round(C(p, a) * C(q, b));
    cells[`${a},${b}`] = m; total += m;
    if ((((k * (k - 1)) / 2 + b) % 2) === 0) active += m;
  }
  return { cells, total, active };
}
export function temporalNote(p, q, lang = 'en') {
  const a = cliffordCell(p, q), m = mirrorCell(p, q);
  const same = a.p === m.p && a.q === m.q;
  if (lang === 'it') return same ? `Lettura temporale: cella auto-speculare, stessa algebra ${a.algebra}; cambia solo il nome del segno.` : `Lettura temporale: cella speculare ${cellName(m.p, m.q)} = ${m.algebra} (Q→−Q); ${a.algebra === m.algebra ? 'stesso tipo' : 'algebra diversa'}.`;
  return same ? `Temporal reading: self-mirror cell, same algebra ${a.algebra}; only the name of the sign changes.` : `Temporal reading: mirror cell ${cellName(m.p, m.q)} = ${m.algebra} (Q→−Q); ${a.algebra === m.algebra ? 'same type' : 'a different algebra'}.`;
}

// ---------- Genesis ladder ---------------------------------------------------
// node n = n null generators; k = floor(n/2) pairs; r = n mod 2 radical bit.
// order of each story list: [YL-S, Phys-S, Math-S, YL-T, Phys-T, Math-T]
const G = [
{ grade: 'n=0 Pure Scalar', coord: 'B+F=0, B-F=0', title: 'Cl(0,0) = R',
  en: [
  [`The Quiet Sandbox // The Blank Slate`, `Everything starts with an empty, quiet sandbox. There are no lines, no clocks and no toys. Only the number one is there: the idea of "one thing".`],
  [`The Trivial Vacuum Origin`, `The scalar identity (1) with zero active generators. No quadratic form, orientation or duration: the reference element every later algebra is built on.`],
  [`The Multiplicative Identity Cl(0,0) = ℝ`, `The real field as the Clifford algebra of the zero space: dimension 1, one grade, trivial quadratic form. All later structure is ℝ-linear over this seed.`],
  [`The First Moment // The Frozen Frame`, `Imagine a film paused before the first frame. Time is not moving. There is only a "Now" with nothing before or after.`],
  [`The Motionless Reference Vacuum`, `With the time-positive sign convention nothing changes at this node: with no generator, swapping Q→−Q is the identity. Spatial and temporal readings coincide at the origin.`],
  [`Cl(0,0) Is Its Own Mirror`, `The mirror cell of [0,0] is [0,0]. ℝ carries no sign, so the Spatial and Temporal ontologies are literally the same algebra here.`]],
  it: [
  [`Il Recinto Silenzioso // La Tabula Rasa`, `Tutto comincia con un recinto vuoto e silenzioso. Non ci sono linee, orologi né giocattoli. C'è solo il numero uno: l'idea di «una cosa».`],
  [`L'Origine Banale del Vuoto`, `L'identità scalare (1) senza generatori attivi. Nessuna forma quadratica, orientamento o durata: l'elemento di riferimento su cui si costruiscono tutte le algebre successive.`],
  [`L'Identità Moltiplicativa Cl(0,0) = ℝ`, `Il campo reale come algebra di Clifford dello spazio nullo: dimensione 1, un solo grado, forma quadratica banale. Ogni struttura successiva è ℝ-lineare su questo seme.`],
  [`Il Primo Momento // Il Fotogramma Congelato`, `Immagina un film fermo prima del primo fotogramma. Il tempo non si muove. C'è solo un «Adesso» senza un prima né un dopo.`],
  [`Il Vuoto di Riferimento Immobile`, `Con la convenzione a tempo positivo nulla cambia in questo nodo: senza generatori, lo scambio Q→−Q è l'identità. Le letture spaziale e temporale coincidono all'origine.`],
  [`Cl(0,0) è il Proprio Specchio`, `La cella speculare di [0,0] è [0,0]. ℝ non porta alcun segno, quindi le ontologie Spaziale e Temporale sono qui la stessa algebra.`]] },
{ grade: 'n=1 Unpolarized Null', coord: 'B+F=0 (+1 null), B-F=0; signed shadows [1,±1]', title: 'Cl(0,0,1) = R[ε]/(ε²)',
  en: [
  [`The Lonely Switch // The Sandbox Dot`, `One magic switch appears, but it has no direction yet. It can fade back into the quiet floor or stay as a lonely dot. Without a partner it cannot become a line you can walk on.`],
  [`The Unpolarized Seed`, `One null generator (e²=0): a grade-1 filtration step with no metric sign. The space-like cell [1,+1] and the time-like cell [1,−1] are not reachable from it; they appear later as faces of a fused pair.`],
  [`ℝ[ε]/(ε²), the Dual-Number Radical Ideal`, `Cl(0,0,1)=ℝ⊕ℝε is local with nilradical (ε). Its two real maps are the quotient to ℝ (ε↦0) and the inclusion ℝ→Cl(0,0,1). It is not ℝ⊕ℝ = Cl(1,0): the rank of the quadratic form is invariant, though Cl(1,0) and Cl(0,1) contract to it as ε→0.`],
  [`The First Tick // Waiting Alone`, `The first "tick" of a clock cannot tell time by itself. It waits for a "tock" that tells it which way is forward.`],
  [`The Unsigned Tick`, `Still null, so the time-positive convention cannot yet label it. The direction of time needs the pairing that arrives at Node 2; before that, "forward" has no meaning.`],
  [`The Mirror Cell of the Radical`, `Q→−Q fixes Q=0, so the null seed is invariant under the Spatial/Temporal swap. The two ontologies first differ at the signed shadow cells [1,+1] (ℝ⊕ℝ) and [1,−1] (ℂ).`]],
  it: [
  [`L'Interruttore Solitario // Il Punto nel Recinto`, `Appare un interruttore magico, ma non ha ancora una direzione. Può svanire nel pavimento silenzioso oppure restare un punto solitario. Senza un compagno non diventa una linea su cui camminare.`],
  [`Il Seme Non Polarizzato`, `Un generatore nullo (e²=0): un passo di filtrazione di grado 1 senza segno metrico. Le celle di tipo spazio [1,+1] e di tipo tempo [1,−1] non sono raggiungibili da esso; compaiono dopo come facce di una coppia fusa.`],
  [`ℝ[ε]/(ε²), l'Ideale Radicale dei Numeri Duali`, `Cl(0,0,1)=ℝ⊕ℝε è locale con nilradicale (ε). Le sue due mappe vere sono il quoziente su ℝ (ε↦0) e l'inclusione ℝ→Cl(0,0,1). Non è ℝ⊕ℝ = Cl(1,0): il rango della forma quadratica è invariante, anche se Cl(1,0) e Cl(0,1) si contraggono ad esso per ε→0.`],
  [`Il Primo Tic // In Attesa da Solo`, `Il primo «tic» di un orologio non può dire il tempo da solo. Aspetta un «tac» che gli indichi dove sta il futuro.`],
  [`Il Tic Senza Segno`, `Ancora nullo: la convenzione a tempo positivo non può ancora etichettarlo. La direzione del tempo richiede l'accoppiamento che arriva al Nodo 2; prima, «avanti» non ha significato.`],
  [`La Cella Speculare del Radicale`, `Q→−Q lascia fisso Q=0, quindi il seme nullo è invariante per lo scambio Spaziale/Temporale. Le due ontologie differiscono per la prima volta nelle celle con segno [1,+1] (ℝ⊕ℝ) e [1,−1] (ℂ).`]] },
{ grade: 'n=2 Fused Pair', coord: 'B+F=2, B-F=0', title: 'Cl(1,1) = M₂(R)',
  en: [
  [`The First Handshake // The Magic Floor`, `A second switch arrives and the two agree to work as partners. Together they make a flat floor with a "plus" direction and a "minus" direction. Which one you call plus is your choice.`],
  [`The Hyperbolic Plane`, `A pairing {n,ñ}=1 is added. Then e=n+ñ squares to +1 and f=n−ñ to −1: one space-like and one fiber direction, with null cone n, ñ. Swapping ñ→−ñ exchanges the roles, so positive versus negative is a gauge choice.`],
  [`Cl(1,1) ≅ M₂(ℝ) from the Witt Pair`, `Two nulls with {n,ñ}=1 generate M₂(ℝ), which has zero divisors (nñ is idempotent). Anticommuting nulls alone give Λ(ℝ²), a different algebra: the pairing is extra data. Λ(ℝ²) is the associated graded of Cl(1,1).`],
  [`The Tick-Tock Cycle`, `The tick finds its tock. Together they make a clock face with a forward direction and a backward direction. Calling one "forward" is a choice, like choosing left or right.`],
  [`The Same Plane, Time-Positive`, `With t²=+1 the generator e becomes the time axis and f the space-like one. [2,0] is its own mirror, so this is the same algebra M₂(ℝ) under a different label.`],
  [`A Self-Mirror Cell`, `Cl(1,1) = Cl(1,1) under Q→−Q. Spatial and Temporal ontologies are isomorphic here, and the sign choice is the Z₂ symmetry ñ→−ñ.`]],
  it: [
  [`La Prima Stretta di Mano // Il Pavimento Magico`, `Arriva un secondo interruttore e i due decidono di lavorare insieme. Formano un pavimento piatto con una direzione «più» e una «meno». Quale chiamare «più» è una tua scelta.`],
  [`Il Piano Iperbolico`, `Si aggiunge un accoppiamento {n,ñ}=1. Allora e=n+ñ ha quadrato +1 e f=n−ñ ha quadrato −1: una direzione di tipo spazio e una di fibra, con cono nullo n, ñ. Scambiare ñ→−ñ inverte i ruoli: positivo o negativo è una scelta di gauge.`],
  [`Cl(1,1) ≅ M₂(ℝ) dalla Coppia di Witt`, `Due nulli con {n,ñ}=1 generano M₂(ℝ), che ha divisori dello zero (nñ è idempotente). Due nulli anticommutanti da soli danno Λ(ℝ²), un'algebra diversa: l'accoppiamento è un dato aggiuntivo. Λ(ℝ²) è il graduato associato di Cl(1,1).`],
  [`Il Ciclo Tic-Tac`, `Il tic trova il suo tac. Insieme fanno un quadrante con un verso avanti e uno indietro. Chiamare uno «avanti» è una scelta, come scegliere destra o sinistra.`],
  [`Lo Stesso Piano, a Tempo Positivo`, `Con t²=+1 il generatore e diventa l'asse del tempo e f quello di tipo spazio. [2,0] è il proprio specchio: è la stessa algebra M₂(ℝ) con un'altra etichetta.`],
  [`Una Cella Auto-Speculare`, `Cl(1,1) = Cl(1,1) sotto Q→−Q. Le ontologie Spaziale e Temporale sono isomorfe qui, e la scelta del segno è la simmetria Z₂ ñ→−ñ.`]] },
{ grade: 'n=3 Pair + Radical', coord: 'B+F=2 (+1 null), B-F=0; signed shadows [3,±1]', title: 'Cl(1,1,1)',
  en: [
  [`The Third Wheel // The Odd Switch Out`, `Three switches arrive but only two can partner. The odd one stays alone. There are three ways to choose who is left out, and nothing in the sandbox makes one choice special.`],
  [`Pair Plus Spectator`, `Cl(1,1,1): one fused pair and one null generator (radical). Relative to a fixed basis there are 3 choices of pair and 2 sign orders. The lone bit has no partner so no sign: it is not yet a leptonic state, a charge or a motion.`],
  [`Cl(1,1) ⊗̂ Cl(0,0,1), dim 8`, `Nondegenerate cell [2,0] with radical rank 1; I₃=e₁e₂e₃ is nilpotent in the null algebra. Signed shadows [3,+1]=Cl(2,1)=M₂(ℝ)⊕M₂(ℝ) (ω²=+1) and [3,−1]=Cl(1,2)=M₂(ℂ) (ω²=−1). Odd rows have no C=0 cell by parity.`],
  [`The Extra Tick`, `The clock goes tick-tock and then a third beat has no partner. It cannot join the cycle, so it waits.`],
  [`The Unpaired Beat`, `Same pair plus radical. The mirror exchanges the shadows, [3,+1] ↔ [3,−1], so the central element changes from an involution (two sectors) to a complex structure (a phase clock).`],
  [`Odd-Row Mirror: Cl(2,1) ↔ Cl(1,2)`, `Q→−Q sends M₂(ℝ)⊕M₂(ℝ) to M₂(ℂ). This is the first node where the two ontologies are genuinely different algebras: central ω with ω²=+1 versus ω²=−1.`]],
  it: [
  [`Il Terzo Incomodo // L'Interruttore Dispari`, `Arrivano tre interruttori ma solo due possono fare coppia. Quello dispari resta solo. Ci sono tre modi di scegliere chi resta fuori, e nel recinto nulla rende speciale una scelta.`],
  [`Coppia più Spettatore`, `Cl(1,1,1): una coppia fusa e un generatore nullo (radicale). Rispetto a una base fissata ci sono 3 scelte di coppia e 2 ordini di segno. Il bit solitario non ha partner, quindi nessun segno: non è ancora uno stato leptonico, una carica o un moto.`],
  [`Cl(1,1) ⊗̂ Cl(0,0,1), dim 8`, `Cella non degenere [2,0] con radicale di rango 1; I₃=e₁e₂e₃ è nilpotente nell'algebra nulla. Ombre con segno [3,+1]=Cl(2,1)=M₂(ℝ)⊕M₂(ℝ) (ω²=+1) e [3,−1]=Cl(1,2)=M₂(ℂ) (ω²=−1). Le righe dispari non hanno cella C=0 per parità.`],
  [`Il Tic in Più`, `L'orologio fa tic-tac e poi un terzo battito resta senza compagno. Non può entrare nel ciclo, così aspetta.`],
  [`Il Battito Senza Compagno`, `Stessa coppia più radicale. Lo specchio scambia le ombre, [3,+1] ↔ [3,−1], quindi l'elemento centrale passa da un'involuzione (due settori) a una struttura complessa (un orologio di fase).`],
  [`Specchio di Riga Dispari: Cl(2,1) ↔ Cl(1,2)`, `Q→−Q manda M₂(ℝ)⊕M₂(ℝ) in M₂(ℂ). È il primo nodo in cui le due ontologie sono algebre davvero diverse: ω centrale con ω²=+1 contro ω²=−1.`]] },
{ grade: 'n=4 Two Pairs', coord: 'B+F=4, B-F=0', title: 'Cl(2,2) = M₄(R)',
  en: [
  [`The Solid Castle // The Perfect Square`, `Four switches make two pairs. There are three ways to choose the pairs, but every way gives the same castle.`],
  [`The Balanced Core Cl(2,2)`, `Four nulls give two Witt pairs: two +1 and two −1 directions. Every perfect matching gives neutral signature (2,2), so Cl(4,0) and Cl(0,4) cannot be reached by pairing alone. The 4/17 ratio is not reproduced by the lattice (rows ≤4 hold 15 cells, rows ≤5 hold 19–21).`],
  [`Cl(2,2) ≅ M₄(ℝ) = Cl(1,1) ⊗̂ Cl(1,1)`, `Graded tensor product of two hyperbolic planes. Also Cl(2,0) ⊗̂ Cl(0,2); the ungraded tensor M₂(ℝ)⊗ℍ would give M₂(ℍ) ≠ M₄(ℝ). Dimension 16, centre ℝ, simple.`],
  [`The Four-Gear Clock`, `Four gears make two matched pairs. However you match them, the clock is the same.`],
  [`Time-Positive Crossroads`, `Two time-like and two space-like directions (t²=+1 convention). [4,0] is self-mirror, so nothing physical changes; only the name of the sign.`],
  [`A Self-Mirror Matrix Cell`, `Cl(2,2) ≅ Cl(2,2) under Q→−Q. All three pairings give isomorphic algebras.`]],
  it: [
  [`Il Castello Solido // Il Quadrato Perfetto`, `Quattro interruttori formano due coppie. Ci sono tre modi di scegliere le coppie, ma ogni modo dà lo stesso castello.`],
  [`Il Nucleo Bilanciato Cl(2,2)`, `Quattro nulli danno due coppie di Witt: due direzioni +1 e due −1. Ogni accoppiamento perfetto dà segnatura neutra (2,2), quindi Cl(4,0) e Cl(0,4) non si raggiungono col solo accoppiamento. Il rapporto 4/17 non è riprodotto dal reticolo (righe ≤4: 15 celle; righe ≤5: 19–21).`],
  [`Cl(2,2) ≅ M₄(ℝ) = Cl(1,1) ⊗̂ Cl(1,1)`, `Prodotto tensoriale graduato di due piani iperbolici. Anche Cl(2,0) ⊗̂ Cl(0,2); il prodotto non graduato M₂(ℝ)⊗ℍ darebbe M₂(ℍ) ≠ M₄(ℝ). Dimensione 16, centro ℝ, semplice.`],
  [`L'Orologio a Quattro Ingranaggi`, `Quattro ingranaggi formano due coppie. Comunque li abbini, l'orologio è lo stesso.`],
  [`Il Bivio a Tempo Positivo`, `Due direzioni di tipo tempo e due di tipo spazio (convenzione t²=+1). [4,0] è auto-speculare: fisicamente nulla cambia, solo il nome del segno.`],
  [`Una Cella Matriciale Auto-Speculare`, `Cl(2,2) ≅ Cl(2,2) sotto Q→−Q. I tre accoppiamenti danno algebre isomorfe.`]] },
{ grade: 'n=5 Two Pairs + Radical', coord: 'B+F=4 (+1 null), B-F=0; signed shadows [5,±1]', title: 'Cl(2,2,1)',
  en: [
  [`The Ghost at the Castle // The Odd One Out`, `A fifth switch arrives at a castle built from pairs. It has no partner, so it waits outside the walls, like the third wheel before it. Nothing about it is special to the number five.`],
  [`Pair-Block Plus Spectator`, `Cl(2,2,1): the same role as Node 3 with a bigger block. No neutrino, charge anchor or 1/3 weight can be read from a bare null bit. Fractional hypercharges in Furey's model come from the Peirce blocks of M₈(ℂ) (Y = ⅓, ½, 1), not from a bit.`],
  [`Shadows Cl(3,2) and Cl(2,3)`, `[5,+1]=Cl(3,2)=M₄(ℝ)⊕M₄(ℝ) and [5,−1]=Cl(2,3)=M₄(ℂ). Same pattern as Nodes 3 and 7: Cl(k+1,k)=M_{2^k}(ℝ)² for every k. Also Cl(4,1)≅Cl(2,3)≅M₄(ℂ) (s=3 and s=7).`],
  [`The Extra Gear`, `A fifth gear has no partner, so it spins without touching the others.`],
  [`The Unpaired Beat Again`, `Under the swap the shadow [5,+1] ↔ [5,−1]: involution versus complex structure. No special time-travel or leptonic channel follows.`],
  [`Mirror Pair M₄(ℝ)² ↔ M₄(ℂ)`, `Same duality as Node 3. The central element ω switches from ω²=+1 to ω²=−1.`]],
  it: [
  [`Il Fantasma al Castello // Quello Dispari`, `Un quinto interruttore arriva a un castello fatto di coppie. Non ha partner, quindi aspetta fuori dalle mura, come il terzo incomodo di prima. Nulla in lui è speciale perché è il numero cinque.`],
  [`Blocco di Coppie più Spettatore`, `Cl(2,2,1): lo stesso ruolo del Nodo 3 con un blocco più grande. Da un semplice bit nullo non si leggono neutrino, àncora di carica o peso 1/3. Le ipercariche frazionarie nel modello di Furey vengono dai blocchi di Peirce di M₈(ℂ) (Y = ⅓, ½, 1), non da un bit.`],
  [`Ombre Cl(3,2) e Cl(2,3)`, `[5,+1]=Cl(3,2)=M₄(ℝ)⊕M₄(ℝ) e [5,−1]=Cl(2,3)=M₄(ℂ). Stesso schema dei Nodi 3 e 7: Cl(k+1,k)=M_{2^k}(ℝ)² per ogni k. Inoltre Cl(4,1)≅Cl(2,3)≅M₄(ℂ) (s=3 e s=7).`],
  [`L'Ingranaggio in Più`, `Un quinto ingranaggio non ha partner, quindi gira senza toccare gli altri.`],
  [`Ancora il Battito Senza Compagno`, `Con lo scambio l'ombra [5,+1] ↔ [5,−1]: involuzione contro struttura complessa. Non ne segue alcun canale speciale di viaggio nel tempo o leptonico.`],
  [`Coppia Speculare M₄(ℝ)² ↔ M₄(ℂ)`, `Stessa dualità del Nodo 3. L'elemento centrale ω passa da ω²=+1 a ω²=−1.`]] },
{ grade: 'n=6 Three Pairs', coord: 'B+F=6, B-F=0', title: 'Cl(3,3) = M₈(R)',
  en: [
  [`The Triple Handshake // Three Pairs`, `Six switches make three pairs. Three pairs give a much bigger floor with 64 pieces. No new kind of number appears: it is just a bigger version of the same floor.`],
  [`Three Witt Pairs`, `Cl(3,3)=M₈(ℝ), dimension 64. Three pairs do not carry SU(3)×SU(2)×U(1) by themselves: a gauge group needs extra structure (Furey uses complexified octonions). Calling this the color mesh is an interpretation.`],
  [`Cl(3,3) ≅ M₈(ℝ), not ℂ⊗ℍ⊗𝕆`, `Neutral rows stay M_N(ℝ). The division algebras are ℂ=Cl(0,1) and ℍ=Cl(0,2) at the negative column edge; 𝕆 is not a Clifford algebra (not associative), but ℝ⁸ is the module of Cl(0,6)=M₈(ℝ).`],
  [`The Three Hands of the Clock`, `Six gears make three pairs. It is a bigger clock, with nothing new inside.`],
  [`A Self-Mirror Block`, `[6,0] is its own mirror. The "time-lock" claim is not derived: the algebra is the same M₈(ℝ).`],
  [`Self-Mirror M₈(ℝ)`, `Q→−Q leaves Cl(3,3) fixed.`]],
  it: [
  [`La Tripla Stretta di Mano // Tre Coppie`, `Sei interruttori formano tre coppie. Tre coppie danno un pavimento molto più grande con 64 pezzi. Non appare nessun nuovo tipo di numero: è solo una versione più grande dello stesso pavimento.`],
  [`Tre Coppie di Witt`, `Cl(3,3)=M₈(ℝ), dimensione 64. Tre coppie da sole non portano SU(3)×SU(2)×U(1): un gruppo di gauge richiede struttura aggiuntiva (Furey usa gli ottonioni complessificati). Chiamarlo maglia del colore è un'interpretazione.`],
  [`Cl(3,3) ≅ M₈(ℝ), non ℂ⊗ℍ⊗𝕆`, `Le righe neutre restano M_N(ℝ). Le algebre di divisione sono ℂ=Cl(0,1) e ℍ=Cl(0,2) al bordo negativo delle colonne; 𝕆 non è un'algebra di Clifford (non è associativo), ma ℝ⁸ è il modulo di Cl(0,6)=M₈(ℝ).`],
  [`Le Tre Lancette dell'Orologio`, `Sei ingranaggi formano tre coppie. È un orologio più grande, senza nulla di nuovo dentro.`],
  [`Blocco Auto-Speculare`, `[6,0] è il proprio specchio. L'affermazione del «blocco temporale» non è derivata: l'algebra è la stessa M₈(ℝ).`],
  [`M₈(ℝ) Auto-Speculare`, `Q→−Q lascia fisso Cl(3,3).`]] },
{ grade: 'n=7 Three Pairs + Radical', coord: 'B+F=6 (+1 null), B-F=0; signed shadows [7,±1]', title: 'Cl(3,3,1)',
  en: [
  [`The Mirror Gate // The Odd One Again`, `A seventh switch has no partner. This time the whole castle can be split into two halves, a left half and a right half, but the same happened with the odd switches at three and five.`],
  [`Chirality Split, Not Yet Antimatter`, `[7,+1]=Cl(4,3)=M₈(ℝ)⊕M₈(ℝ). The central involution ω=e₁…e₇ (ω²=+1) splits the algebra into two sectors. This is the same mechanism as at Nodes 1, 3, 5 with a larger block. Calling the sectors matter and antimatter is an interpretation.`],
  [`Cl(4,3) ≅ M₈(ℝ) ⊕ M₈(ℝ) ≅ Cl(0,7)`, `s=1: 2·8²=128. ω is central with ω²=+1, giving central idempotents (1±ω)/2. Cl(0,7) at [7,−7] is the same type. Node 7 is the last row with a new class on the Cl(0,k) track (k=7: ℝ²).`],
  [`The Time Mirror`, `The seventh gear has no partner. Seen from the time side, the castle gets a single central clock hand instead of a left-right split.`],
  [`Complex Structure Instead of Split`, `[7,−1]=Cl(3,4)=M₈(ℂ): ω²=−1, so ω acts as a global phase (J). It is the same J that reduces Furey's M₁₆(ℝ) to M₈(ℂ) (256ℝ→128ℝ). Time reversal is not derived.`],
  [`Cl(3,4) ≅ M₈(ℂ)`, `Mirror of Cl(4,3). Real dimension 128. ω²=−1 gives the central complex structure; the complexification of either cell is M₈(ℂ)⊕M₈(ℂ).`]],
  it: [
  [`Il Cancello Specchio // Ancora il Dispari`, `Un settimo interruttore non ha partner. Stavolta tutto il castello può dividersi in due metà, sinistra e destra, ma lo stesso accadeva con gli interruttori dispari a tre e a cinque.`],
  [`Scissione Chirale, Non Ancora Antimateria`, `[7,+1]=Cl(4,3)=M₈(ℝ)⊕M₈(ℝ). L'involuzione centrale ω=e₁…e₇ (ω²=+1) divide l'algebra in due settori. È lo stesso meccanismo dei Nodi 1, 3, 5 con un blocco più grande. Chiamare i settori materia e antimateria è un'interpretazione.`],
  [`Cl(4,3) ≅ M₈(ℝ) ⊕ M₈(ℝ) ≅ Cl(0,7)`, `s=1: 2·8²=128. ω è centrale con ω²=+1, con idempotenti centrali (1±ω)/2. Cl(0,7) in [7,−7] è dello stesso tipo. Il Nodo 7 è l'ultima riga con una classe nuova sulla traccia Cl(0,k) (k=7: ℝ²).`],
  [`Lo Specchio del Tempo`, `Il settimo ingranaggio non ha partner. Visto dal lato del tempo, il castello ottiene una sola lancetta centrale invece di una divisione destra-sinistra.`],
  [`Struttura Complessa invece di Scissione`, `[7,−1]=Cl(3,4)=M₈(ℂ): ω²=−1, quindi ω agisce come una fase globale (J). È lo stesso J che riduce M₁₆(ℝ) di Furey a M₈(ℂ) (256ℝ→128ℝ). L'inversione temporale non è derivata.`],
  [`Cl(3,4) ≅ M₈(ℂ)`, `Specchio di Cl(4,3). Dimensione reale 128. ω²=−1 dà la struttura complessa centrale; la complessificazione di entrambe le celle è M₈(ℂ)⊕M₈(ℂ).`]] },
{ grade: 'n=8 Four Pairs', coord: 'B+F=8, B-F=0 (≅ cells [8,±8])', title: 'Cl(4,4) = Cl(0,8) = Cl(8,0) = M₁₆(R)',
  en: [
  [`The Completed Castle // The Pattern Repeats`, `The eighth switch partners with the odd one, giving four pairs. The castle holds 256 pieces. Adding more switches does not teach you a new kind of castle: you get bigger copies of the old ones.`],
  [`Saturation of Types, Not a Wall`, `Cl(4,4)≅Cl(0,8)≅Cl(8,0)≅M₁₆(ℝ): three cells of row 8 with the same algebra. I₈²=+1. Cl(n+8)=Cl(n)⊗M₁₆(ℝ), so construction continues; only novelty stops. The Higgs VEV and the top quark are not located by this algebra.`],
  [`Row 8: First Row With All Even Residues Repeated`, `The algebra type depends on C mod 8. Rows 7 and 8 are the first rows where every residue class of their parity occurs at two columns 8 apart (for example C=−8, 0, +8 in row 8). That is the derived Bott repeat.`],
  [`The Grand Clock // It Starts Again`, `All eight gears turn together. Adding more gears only builds bigger copies of the same clock.`],
  [`Closure Without a Horizon`, `[8,0] is self-mirror. The Hubble-boundary and "historical synchronization" language is interpretation: the algebra only says that the type pattern repeats.`],
  [`Self-Mirror, Period 8`, `Under Q→−Q: Cl(4,4)↔Cl(4,4) and Cl(8,0)↔Cl(0,8), all M₁₆(ℝ). The map s→−s preserves the period 8 of the type sequence.`]],
  it: [
  [`Il Castello Completato // Lo Schema Si Ripete`, `L'ottavo interruttore fa coppia con quello dispari: quattro coppie. Il castello ha 256 pezzi. Aggiungendo interruttori non impari un nuovo tipo di castello: ottieni copie più grandi dei vecchi.`],
  [`Saturazione dei Tipi, Non un Muro`, `Cl(4,4)≅Cl(0,8)≅Cl(8,0)≅M₁₆(ℝ): tre celle della riga 8 con la stessa algebra. I₈²=+1. Cl(n+8)=Cl(n)⊗M₁₆(ℝ), quindi la costruzione continua; si ferma solo la novità. Il VEV di Higgs e il quark top non sono localizzati da questa algebra.`],
  [`Riga 8: Prima Riga con Tutti i Residui Pari Ripetuti`, `Il tipo di algebra dipende da C mod 8. Le righe 7 e 8 sono le prime in cui ogni classe di residuo della loro parità compare in due colonne a distanza 8 (ad esempio C=−8, 0, +8 nella riga 8). È la ripetizione di Bott derivata.`],
  [`Il Grande Orologio // Ricomincia`, `Tutti e otto gli ingranaggi girano insieme. Aggiungerne altri costruisce solo copie più grandi dello stesso orologio.`],
  [`Chiusura Senza Orizzonte`, `[8,0] è auto-speculare. Il linguaggio su confine di Hubble e «sincronizzazione storica» è interpretazione: l'algebra dice solo che lo schema dei tipi si ripete.`],
  [`Auto-Speculare, Periodo 8`, `Sotto Q→−Q: Cl(4,4)↔Cl(4,4) e Cl(8,0)↔Cl(0,8), tutte M₁₆(ℝ). La mappa s→−s preserva il periodo 8 della successione dei tipi.`]] }
];

export const GENESIS_STAGES = Array.from({ length: 9 }, (_, i) => `Sector_Genesis_Node_${i}`);
const PROFILE_KEYS = { en: ['Young Learner', 'Physicist', 'Mathematician'], it: ['Young Learner', 'Fisico', 'Matematico'] };
export const GENESIS_METADATA = {};
G.forEach((g, n) => {
  const k = Math.floor(n / 2), r = n % 2;
  for (const lang of ['en', 'it']) g[lang].forEach(([title, desc], i) => {
    const metric = i < 3 ? 'Spatial' : 'Temporal', prof = PROFILE_KEYS[lang][i % 3];
    const cell = cliffordCell(k, k);
    GENESIS_METADATA[`Sector_Genesis_Node_${n}_${lang}_${prof}_${metric}`] = {
      id: `Sector_Genesis_Node_${n}`, category: lang === 'it' ? 'Radici della Genesi' : 'Genesis Roots',
      grade: g.grade, coordinate: g.coord, title, desc,
      cell: cellName(k, k), algebra: cell.algebra, radicalRank: r, generators: n,
      simplex: simplexView(n), cube: cubeView(n), prime: primeView(n)
    };
  });
});
export function getGenesisDisplayData(stage, lang, profile, metricMode = 'Spatial') {
  const sp = lang === 'it' && profile === 'Physicist' ? 'Fisico' : lang === 'it' && profile === 'Mathematician' ? 'Matematico' : profile;
  return GENESIS_METADATA[`Sector_Genesis_Node_${stage}_${lang}_${sp}_${metricMode}`];
}

// ---------- Audited atlas (25 nodes of matrixData.js) -----------------------
// [id, audited tier, status, p, q, note]   (p,q = algebra cell; null = no cell)
// tier: Foundational = coordinate, algebra and claims check out;
//       Structural   = algebra is real but coordinate/label/text was realigned;
//       Speculative  = physics identification not derivable from the lattice.
const F = 'Foundational Symmetries', S = 'Structural Realignments', X = 'Speculative Frontiers';
export const AUDITED_ATLAS = [
  ['Sector_Vacuum_Origin', F, 'verified', 0, 0, 'B+F=0, B-F=0'],
  ['Sector_Inject_Base_Real', S, 'realigned', 1, 0, 'B+F=1, B-F=+1 (text: not a division algebra)'],
  ['Sector_Inject_Fiber_Clock', F, 'verified', 0, 1, 'B+F=1, B-F=-1'],
  ['Sector_Quaternionic_Base', S, 'realigned', 2, 0, 'B+F=2, B-F=+2 (text: Cl(2,0) is not the quaternions)'],
  ['Sector_Quaternionic_Fiber', F, 'verified', 0, 2, 'B+F=2, B-F=-2'],
  ['Sector_Trivector_Base', F, 'verified', 3, 0, 'B+F=3, B-F=+3 (simplex face: triangle, not tetrahedron)'],
  ['Sector_Trivector_Quark', S, 'realigned', 2, 1, 'B+F=3, B-F=+1 (text: direct sum, not quotient)'],
  ['Sector_Trivector_Lepton', F, 'verified', 1, 2, 'B+F=3, B-F=-1'],
  ['Sector_STA_Euclidean_Base', S, 'realigned', 4, 0, 'B+F=4, B-F=+4 (text: not an exterior algebra)'],
  ['Sector_STA_Minkowski', F, 'verified', 3, 1, 'B+F=4, B-F=+2'],
  ['Sector_STA_Symmetric_Core', F, 'verified', 2, 2, 'B+F=4, B-F=0'],
  ['Sector_STA_Fiber_Frame', S, 'realigned', 1, 3, 'B+F=4, B-F=-2 (text: M2(H), not biquaternion)'],
  ['Sector_Row5_Base', S, 'verified', 4, 1, 'B+F=5, B-F=+3'],
  ['Sector_Row6_Confinement', S, 'realigned', 4, 2, 'B+F=6, B-F=+2 but labelled Cl(5,1)'],
  ['Sector_Row7_Mirror', S, 'verified', 4, 3, 'B+F=7, B-F=+1 (was Speculative: mechanism is not unique to row 7)'],
  ['Sector_Chiral_Parity', S, 'realigned', 2, 3, 'B+F=5, B-F=-1 but labelled Cl(4,1)'],
  ['Sector_EM_Maxwell', S, 'realigned', 3, 1, 'B+F=8, B-F=+6 (invalid for a Cl(1,0)(x)Cl(0,1) tensor; F is a bivector of the spacetime algebra)'],
  ['Sector_Gravity_Strain', X, 'speculative', 3, 1, 'B+F=8, B-F=+4 (grade and cell were conflated)'],
  ['Sector_Baryon_Conservation', X, 'speculative', 5, 3, 'B+F=8, B-F=+2'],
  ['Sector_Electroweak_Unified', S, 'verified', 4, 4, 'B+F=8, B-F=0 (4/17 not reproduced)'],
  ['Sector_Vacuum_Mass_Generation', X, 'speculative', 0, 0, 'B+F=0, B-F=0'],
  ['Sector_GUT_Junction', X, 'speculative', 2, 6, 'B+F=8, B-F=-4'],
  ['Sector_Cosmic_Horizon', X, 'verified', 0, 8, 'B+F=8, B-F=-8'],
  ['Sector_Open_Questions', X, 'speculative', null, null, 'L_a R_b Framework Boundaries'],
  ['Sector_Furey_Ledger', X, 'realigned', 0, 8, 'Row B+F=6, Column B-F=+2 with Cl(6,0)(x)Cl(2,0) (that product is Cl(8,0))']
];

// full text replacements: id -> lang -> [YoungLearner, Physicist, Mathematician], each [title, desc]
export const TEXT_PATCH = {
  Sector_Inject_Base_Real: {
    en: [[`The Sandbox Line Painter`, `One switch paints a line with a "plus" side. The line has two halves that do not mix, like two separate rooms.`],
         [`The Cl(1,0) Space-Like Generator`, `One generator with e²=+1. Cl(1,0)=ℝ⊕ℝ (split-complex numbers): two non-interacting sectors e=±1. It is one signed face of a fused pair, not something a lone null can turn into.`],
         [`Cl(1,0) ≅ ℝ⊕ℝ, the Split-Complex Line`, `The central idempotents (1±e)/2 split the algebra into two copies of ℝ. It has zero divisors, so it is not a division algebra.`]],
    it: [[`Il Pittore di Linee del Recinto`, `Un interruttore dipinge una linea con un lato «più». La linea ha due metà che non si mescolano, come due stanze separate.`],
         [`Il Generatore di Tipo Spazio Cl(1,0)`, `Un generatore con e²=+1. Cl(1,0)=ℝ⊕ℝ (numeri split-complessi): due settori non interagenti e=±1. È una faccia con segno di una coppia fusa, non qualcosa in cui un nullo solitario possa trasformarsi.`],
         [`Cl(1,0) ≅ ℝ⊕ℝ, la Linea Split-Complessa`, `Gli idempotenti centrali (1±e)/2 dividono l'algebra in due copie di ℝ. Ha divisori dello zero, quindi non è un'algebra di divisione.`]] },
  Sector_Quaternionic_Base: {
    en: [[`The Spinning Top Floor Tile`, `Two space switches make a tile that can flip and turn. The tile can be written as a 2×2 grid of numbers.`],
         [`The Cl(2,0) Planar Matrix Cell`, `Two space-like generators give M₂(ℝ), the algebra of 2×2 real matrices (Pauli-type rotations in a plane). Hamilton's quaternions are Cl(0,2) at [2,−2], not here.`],
         [`Cl(2,0) ≅ M₂(ℝ) ≅ Cl(1,1)`, `Same algebra as the Witt-pair cell [2,0], in another column: s=2 and s=0 both give ℝ. It has zero divisors; it is not ℍ.`]],
    it: [[`La Piastrella a Trottola`, `Due interruttori dello spazio formano una piastrella che si capovolge e gira. La piastrella si può scrivere come una griglia 2×2 di numeri.`],
         [`La Cella Matriciale Planare Cl(2,0)`, `Due generatori di tipo spazio danno M₂(ℝ), l'algebra delle matrici reali 2×2 (rotazioni di tipo Pauli in un piano). I quaternioni di Hamilton sono Cl(0,2) in [2,−2], non qui.`],
         [`Cl(2,0) ≅ M₂(ℝ) ≅ Cl(1,1)`, `Stessa algebra della cella di coppia di Witt [2,0], in un'altra colonna: s=2 e s=0 danno entrambi ℝ. Ha divisori dello zero; non è ℍ.`]] },
  Sector_Trivector_Quark: {
    en: [[`The Lopsided Puzzle Piece`, `Two sandbox steps and one hidden gear make a piece that splits into two matching halves.`],
         [`The Mixed Cl(2,1) Cell`, `Two +1 and one −1 generator: M₂(ℝ)⊕M₂(ℝ), with a central involution ω (ω²=+1) that separates two sectors. Quark color or factor-7 loops are not derived from this cell.`],
         [`Cl(2,1) ≅ M₂(ℝ)⊕M₂(ℝ)`, `s=1, dimension 8, centre ℝ⊕ℝω with ω²=+1. A direct sum, not a quotient.`]],
    it: [[`Il Pezzo di Puzzle Sbilanciato`, `Due passi nel recinto e un ingranaggio nascosto formano un pezzo che si divide in due metà uguali.`],
         [`La Cella Mista Cl(2,1)`, `Due generatori +1 e uno −1: M₂(ℝ)⊕M₂(ℝ), con un'involuzione centrale ω (ω²=+1) che separa due settori. Il colore dei quark o i loop del fattore 7 non derivano da questa cella.`],
         [`Cl(2,1) ≅ M₂(ℝ)⊕M₂(ℝ)`, `s=1, dimensione 8, centro ℝ⊕ℝω con ω²=+1. Una somma diretta, non un quoziente.`]] },
  Sector_STA_Euclidean_Base: {
    en: [[`The Four-Dimensional Castle Block`, `Four space pieces make a solid block. It is built from 2×2 grids of four-part numbers.`],
         [`The Cl(4,0) Euclidean Cell`, `Four +1 generators: M₂(ℍ), dimension 16. A flat 4D container; the same type as Cl(0,4) at the opposite edge of row 4.`],
         [`Cl(4,0) ≅ M₂(ℍ) ≅ Cl(0,4)`, `s=4. Not an exterior algebra: its quadratic form is nondegenerate. The associated graded algebra is Λ(ℝ⁴).`]],
    it: [[`Il Blocco del Castello a Quattro Dimensioni`, `Quattro pezzi spaziali formano un blocco solido. È costruito con griglie 2×2 di numeri a quattro parti.`],
         [`La Cella Euclidea Cl(4,0)`, `Quattro generatori +1: M₂(ℍ), dimensione 16. Un contenitore 4D piatto; stesso tipo di Cl(0,4) al bordo opposto della riga 4.`],
         [`Cl(4,0) ≅ M₂(ℍ) ≅ Cl(0,4)`, `s=4. Non è un'algebra esterna: la sua forma quadratica è non degenere. Il graduato associato è Λ(ℝ⁴).`]] },
  Sector_STA_Fiber_Frame: {
    en: [[`The Mirror Image Box`, `One outer track and three inner gears make the mirror image of the movie projector's box.`],
         [`The Cl(1,3) Time-Positive Spacetime Frame`, `One +1 and three −1 generators: M₂(ℍ), the mirror of Minkowski's Cl(3,1)=M₄(ℝ). Both are valid spacetime algebras: they are different real forms of M₄(ℂ).`],
         [`Cl(1,3) ≅ M₂(ℍ), not Biquaternions`, `s=−2≡6 gives ℍ. Biquaternions ℍ⊗ℂ≅M₂(ℂ) are a different algebra.`]],
    it: [[`La Scatola Immagine Speculare`, `Un binario esterno e tre ingranaggi interni formano l'immagine speculare della scatola del proiettore.`],
         [`Il Frame Spazio-Temporale a Tempo Positivo Cl(1,3)`, `Un generatore +1 e tre −1: M₂(ℍ), lo specchio del Minkowski Cl(3,1)=M₄(ℝ). Entrambe sono algebre spazio-temporali valide: sono forme reali diverse di M₄(ℂ).`],
         [`Cl(1,3) ≅ M₂(ℍ), non Biquaternioni`, `s=−2≡6 dà ℍ. I biquaternioni ℍ⊗ℂ≅M₂(ℂ) sono un'altra algebra.`]] },
  Sector_Row6_Confinement: {
    en: [[`The Locking Grid`, `Six switches build a bigger grid. The grid is large, but no new puzzle pieces appear.`],
         [`The Cl(4,2) Six-Generator Cell`, `Four +1 and two −1: M₈(ℝ), dimension 64, the same type as the neutral Cl(3,3). Color confinement is a physical statement not derived from this cell.`],
         [`Cl(4,2) ≅ M₈(ℝ)`, `Relabelled from Cl(5,1) (=M₄(ℍ), at [6,+4]) to match the coordinate [6,+2]. Fano-plane loops live in the imaginary octonions, not in this associative algebra.`]],
    it: [[`La Griglia di Chiusura`, `Sei interruttori costruiscono una griglia più grande. La griglia è grande, ma non compaiono pezzi nuovi.`],
         [`La Cella a Sei Generatori Cl(4,2)`, `Quattro +1 e due −1: M₈(ℝ), dimensione 64, dello stesso tipo del neutro Cl(3,3). Il confinamento del colore è un'affermazione fisica non derivata da questa cella.`],
         [`Cl(4,2) ≅ M₈(ℝ)`, `Rietichettata da Cl(5,1) (=M₄(ℍ), in [6,+4]) per coincidere con la coordinata [6,+2]. I loop del piano di Fano vivono negli ottonioni immaginari, non in questa algebra associativa.`]] },
  Sector_Chiral_Parity: {
    en: [[`The One-Way Mirror Switch`, `One extra switch makes a mirror that gives the box a clock hand in the middle.`],
         [`The Cl(2,3) Complex-Structure Cell`, `Two +1 and three −1: M₄(ℂ) ≅ Cl(4,1). Its centre contains ω with ω²=−1, a complex structure. "Maximal parity violation" is a property of the weak interaction, not derived from this cell.`],
         [`Cl(2,3) ≅ Cl(4,1) ≅ M₄(ℂ)`, `[5,−1] and [5,+3] are 4 columns apart and both have odd s with ω²=−1: same algebra. The original label Cl(4,1) matched [5,+3], not [5,−1].`]],
    it: [[`L'Interruttore dello Specchio a Senso Unico`, `Un interruttore in più forma uno specchio che dà alla scatola una lancetta al centro.`],
         [`La Cella a Struttura Complessa Cl(2,3)`, `Due generatori +1 e tre −1: M₄(ℂ) ≅ Cl(4,1). Il suo centro contiene ω con ω²=−1, una struttura complessa. La «violazione massima di parità» è una proprietà dell'interazione debole, non derivata da questa cella.`],
         [`Cl(2,3) ≅ Cl(4,1) ≅ M₄(ℂ)`, `[5,−1] e [5,+3] distano 4 colonne ed entrambe hanno s dispari con ω²=−1: stessa algebra. L'etichetta originale Cl(4,1) corrispondeva a [5,+3], non a [5,−1].`]] },
  Sector_EM_Maxwell: {
    en: [[`The Flash of Light`, `Light is a ripple made from six numbers: three for electric pushes and three for magnetic twists.`],
         [`The Maxwell Bivector in Spacetime Algebra`, `F is a grade-2 element of Cl(3,1) (or its mirror Cl(1,3)): six components (E and B), with one equation ∇F=J. It lives in the cell [4,+2], not at [8,+6].`],
         [`F ∈ Λ²(ℝ^{3,1}) ⊂ Cl(3,1), ∇F = J`, `Grade is the blade degree inside the algebra; the cell is the algebra itself. dF=0 and d⋆F=J are the grade-3 and grade-1 parts of ∇F=J. Dimension of grade 2: C(4,2)=6.`]],
    it: [[`Il Lampo di Luce`, `La luce è un'onda fatta di sei numeri: tre per le spinte elettriche e tre per le torsioni magnetiche.`],
         [`Il Bivettore di Maxwell nell'Algebra dello Spazio-Tempo`, `F è un elemento di grado 2 di Cl(3,1) (o del suo specchio Cl(1,3)): sei componenti (E e B), con una sola equazione ∇F=J. Vive nella cella [4,+2], non in [8,+6].`],
         [`F ∈ Λ²(ℝ^{3,1}) ⊂ Cl(3,1), ∇F = J`, `Il grado è il grado della lama dentro l'algebra; la cella è l'algebra stessa. dF=0 e d⋆F=J sono le parti di grado 3 e 1 di ∇F=J. Dimensione del grado 2: C(4,2)=6.`]] },
  Sector_Gravity_Strain: {
    en: [[`The Big Squeeze`, `Near heavy things, the sandbox paths get squeezed. The idea is real physics, but the number-switch story does not prove it.`],
         [`Gauge-Theory Gravity in Spacetime Algebra`, `A position-dependent frame field h(a) and a rotation gauge field Ω in Cl(1,3), as in Lasenby, Doran and Gull. It is a real theory, but its link to a "256-vertex lattice strain" is not derived here.`],
         [`Gauge Fields h and Ω on a Flat Background`, `Covariant derivative D=∂_a+Ω(a); the curvature R is a bivector-valued 2-form. Nothing here comes from the 8-bit lattice.`]],
    it: [[`Il Grande Schiacciamento`, `Vicino alle cose pesanti, i percorsi del recinto si schiacciano. L'idea è fisica vera, ma la storia degli interruttori non la dimostra.`],
         [`Gravità di Gauge nell'Algebra dello Spazio-Tempo`, `Un campo di riferimento h(a) dipendente dalla posizione e un campo di gauge di rotazione Ω in Cl(1,3), come in Lasenby, Doran e Gull. È una teoria vera, ma il legame con una «deformazione del reticolo a 256 vertici» non è derivato qui.`],
         [`Campi di Gauge h e Ω su Sfondo Piatto`, `Derivata covariante D=∂_a+Ω(a); la curvatura R è una 2-forma a valori bivettoriali. Nulla di ciò deriva dal reticolo a 8 bit.`]] },
  Sector_Baryon_Conservation: {
    en: [[`The Counting Lock`, `A toy rule says "count the building blocks and keep the count". Nature allows tiny exceptions, so this is only a story.`],
         [`Baryon Number: Accidental, Not Topological`, `In the Standard Model B is an accidental global symmetry broken by electroweak sphalerons (B−L survives). A Fano-plane winding is an analogy; no conservation law is derived from the lattice. The cell [8,+2]=Cl(5,3)=M₁₆(ℝ) is the only verified part.`],
         [`Cl(5,3) ≅ M₁₆(ℝ) at [8,+2]`, `Verified type: s=2. The "Fano winding" is a combinatorial picture of octonion products, not a conserved charge of this algebra.`]],
    it: [[`Il Lucchetto del Conteggio`, `Una regola giocattolo dice «conta i mattoncini e mantieni il conto». La natura ammette piccole eccezioni, quindi è solo una storia.`],
         [`Numero Barionico: Accidentale, Non Topologico`, `Nel Modello Standard B è una simmetria globale accidentale violata dagli sfaleroni elettrodeboli (B−L sopravvive). Un avvolgimento sul piano di Fano è un'analogia; nessuna legge di conservazione deriva dal reticolo. La cella [8,+2]=Cl(5,3)=M₁₆(ℝ) è l'unica parte verificata.`],
         [`Cl(5,3) ≅ M₁₆(ℝ) in [8,+2]`, `Tipo verificato: s=2. L'«avvolgimento di Fano» è un'immagine combinatoria dei prodotti ottonionici, non una carica conservata di questa algebra.`]] },
  Sector_GUT_Junction: {
    en: [[`The Crowded Knot`, `At the number 210 the puzzle claims everything meets. But the building blocks only come in doubles, so that meeting is just a story.`],
         [`The 210 Checkpoint: Numerology`, `210=2·3·5·7 is a primorial. The lattice budget is 2⁸=256 with no odd prime factor, so 3, 5, 7 can only be imported. Cl(2,6)=M₈(ℍ) at [8,−4] is verified; unification is not.`],
         [`Cl(2,6) ≅ M₈(ℍ)`, `s=4, dimension 256. Odd primes do not arise from Axioms A and B: dimensions are 2ⁿ. Any appearance of 3 (Furey: the M₃ Peirce block) comes from the complex-octonion input.`]],
    it: [[`Il Nodo Affollato`, `Al numero 210 il puzzle dice che tutto si incontra. Ma i mattoncini vengono solo a coppie, quindi l'incontro è solo una storia.`],
         [`Il Checkpoint 210: Numerologia`, `210=2·3·5·7 è un primoriale. Il budget del reticolo è 2⁸=256 senza fattori primi dispari, quindi 3, 5, 7 possono solo essere importati. Cl(2,6)=M₈(ℍ) in [8,−4] è verificata; l'unificazione no.`],
         [`Cl(2,6) ≅ M₈(ℍ)`, `s=4, dimensione 256. I primi dispari non nascono dagli Assiomi A e B: le dimensioni sono 2ⁿ. Ogni comparsa del 3 (Furey: il blocco di Peirce M₃) viene dall'input ottonionico complesso.`]] },
  Sector_Furey_Ledger: {
    en: [[`Professor Cohl's Blueprint`, `A grid of 16 by 16 boxes is cut into blocks of sizes 1, 3, 2, 1 and 1. The boxes between blocks are where particles live.`],
         [`Furey's Cl(0,8) Ledger`, `The model works in Cl(0,8)≅M₁₆(ℝ), cell [8,−8], then picks a complex structure J giving M₈(ℂ) (256ℝ→128ℝ). Peirce blocks (1,3,2,1,1) satisfy Σn=8, Σn²=16. Top-quark gap: a 12ℂ edge against an 18ℂ demand; recombination is Furey's own proposal.`],
         [`End_ℂ(𝕍) ≅ M₈(ℂ) with Peirce Blocks (1,3,2,1,1)`, `Off-diagonal dimension 64−16=48=3×16. Edge capacities 2nᵢnⱼ sum to 48; the maximal edge is 12ℂ. The previous coordinate [6,+2] and Cl(6,0)⊗Cl(2,0) were inconsistent (that graded product is Cl(8,0)).`]],
    it: [[`Il Progetto della Professoressa Cohl`, `Una griglia di 16 per 16 caselle è tagliata in blocchi di dimensioni 1, 3, 2, 1 e 1. Le caselle tra i blocchi sono dove vivono le particelle.`],
         [`Il Registro Cl(0,8) di Furey`, `Il modello lavora in Cl(0,8)≅M₁₆(ℝ), cella [8,−8], poi sceglie una struttura complessa J che dà M₈(ℂ) (256ℝ→128ℝ). I blocchi di Peirce (1,3,2,1,1) soddisfano Σn=8, Σn²=16. Lacuna del top: un lato da 12ℂ contro una richiesta di 18ℂ; la ricombinazione è una proposta di Furey stessa.`],
         [`End_ℂ(𝕍) ≅ M₈(ℂ) con Blocchi di Peirce (1,3,2,1,1)`, `Dimensione fuori diagonale 64−16=48=3×16. Le capacità dei lati 2nᵢnⱼ sommano a 48; il lato massimo è 12ℂ. La coordinata precedente [6,+2] e Cl(6,0)⊗Cl(2,0) erano incoerenti (quel prodotto graduato è Cl(8,0)).`]] }
};
// audit notes appended to the existing text of nodes whose cell is fine
export const AUDIT_APPEND = {
  Sector_Electroweak_Unified: { en: `Audit: cell Cl(4,4)=M₁₆(ℝ) verified. The 4/17 ratio is not reproduced: rows ≤4 hold 15 cells, rows ≤5 hold 19 (B,F≤4) or 21; treat it as a convention.`, it: `Audit: cella Cl(4,4)=M₁₆(ℝ) verificata. Il rapporto 4/17 non è riprodotto: le righe ≤4 hanno 15 celle, le righe ≤5 ne hanno 19 (B,F≤4) o 21; trattalo come convenzione.` },
  Sector_Vacuum_Mass_Generation: { en: `Audit: the Higgs VEV and a sterile neutrino are not derived from Cl(0,0). Interpretation only.`, it: `Audit: il VEV di Higgs e un neutrino sterile non derivano da Cl(0,0). Solo interpretazione.` },
  Sector_Cosmic_Horizon: { en: `Audit: Cl(0,8)≅Cl(4,4)≅Cl(8,0)≅M₁₆(ℝ), I₈²=+1. A repeat of types, not a wall: Cl(n+8)=Cl(n)⊗M₁₆(ℝ).`, it: `Audit: Cl(0,8)≅Cl(4,4)≅Cl(8,0)≅M₁₆(ℝ), I₈²=+1. Una ripetizione di tipi, non un muro: Cl(n+8)=Cl(n)⊗M₁₆(ℝ).` },
  Sector_Row7_Mirror: { en: `Audit: Cl(4,3)=M₈(ℝ)², and the same split occurs at every Cl(k+1,k). The matter/antimatter reading is interpretive; the mirror cell is [7,−1]=Cl(3,4)=M₈(ℂ).`, it: `Audit: Cl(4,3)=M₈(ℝ)², e la stessa scissione avviene in ogni Cl(k+1,k). La lettura materia/antimateria è interpretativa; la cella speculare è [7,−1]=Cl(3,4)=M₈(ℂ).` },
  Sector_Row5_Base: { en: `Audit: Cl(4,1)=M₄(ℂ)≅Cl(2,3). "Maximal parity violation" is a weak-interaction fact, not derived from this cell.`, it: `Audit: Cl(4,1)=M₄(ℂ)≅Cl(2,3). La «violazione massima di parità» è un fatto dell'interazione debole, non derivato da questa cella.` },
  Sector_Open_Questions: { en: `Audit: lattice-level gaps: no odd primes, no mass scale, 4/17 and 210 not derived, and Spatial equals Temporal on neutral cells.`, it: `Audit: lacune a livello di reticolo: nessun primo dispari, nessuna scala di massa, 4/17 e 210 non derivati, e Spaziale uguale a Temporale sulle celle neutre.` }
};
const GRADE_FIX = {
  Sector_EM_Maxwell: 'Grade 2 bivector inside Cl(3,1)',
  Sector_Gravity_Strain: 'Gauge fields h (linear map) and Ω (bivector-valued) in the spacetime algebra',
  Sector_Furey_Ledger: 'Regular bimodule on Cl(0,8); complex structure J → M₈(ℂ)'
};
const PK = { 'Young Learner': 0, Physicist: 1, Mathematician: 2 };

// Merge the audit into matrixData's KNOWLEDGE_BASE_DIRECTORY (mutates and returns it).
export function applyAudit(KB) {
  for (const [id, tier, status, p, q, was] of AUDITED_ATLAS) {
    const cell = p === null ? null : cliffordCell(p, q);
    for (const lang of ['en', 'it']) for (const profile of ['Young Learner', 'Physicist', 'Mathematician']) {
      const key = `${id}_${lang}_${profile}`, base = KB[key] || {};
      const patch = TEXT_PATCH[id]?.[lang]?.[PK[profile]];
      const add = AUDIT_APPEND[id]?.[lang];
      KB[key] = {
        ...base, id, category: tier, originalCategory: base.category, auditStatus: status, was,
        ...(cell ? { coordinate: coordOf(p, q), cell: cellName(p, q), algebra: cell.algebra, omega2: cell.omega2,
          simplex: simplexView(cell.n), cube: cubeView(cell.n), prime: primeView(cell.n) } : {}),
        ...(GRADE_FIX[id] ? { grade: GRADE_FIX[id] } : {}),
        ...(patch ? { title: patch[0], desc: patch[1] } : {}),
        ...(add ? { desc: `${(patch ? patch[1] : base.desc) || ''} ${add}`.trim() } : {})
      };
    }
  }
  return KB;
}
// Temporal reading is derived (mirror cell), not authored.
export function getAuditedDisplayData(KB, id, lang, profile, metricMode = 'Spatial') {
  const rec = KB[`${id}_${lang}_${profile}`];
  if (!rec || metricMode === 'Spatial' || !rec.cell) return rec && { ...rec, metricMode: 'Spatial' };
  const [, p, q] = rec.cell.match(/Cl\((\d+),(\d+)\)/).map(Number);
  return { ...rec, metricMode: 'Temporal', desc: `${rec.desc} ${temporalNote(p, q, lang)}` };
}

// ---------- self-test (run: node genesis_audit_v3.js) ------------------------
export function selfTest() {
  const ok = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
  for (const row of signatureLattice(8)) for (const c of row) ok(c.dim === 2 ** c.n, `dim ${c.p},${c.q}`);
  ok(cliffordCell(1, 1).algebra === 'M₂(ℝ)' && cliffordCell(0, 2).algebra === 'ℍ' && cliffordCell(1, 0).algebra === 'ℝ⊕ℝ', 'small cells');
  ok(cliffordCell(1, 3).algebra === 'M₂(ℍ)' && cliffordCell(3, 1).algebra === 'M₄(ℝ)', 'STA');
  ok(cliffordCell(4, 3).algebra === 'M₈(ℝ)⊕M₈(ℝ)' && cliffordCell(3, 4).algebra === 'M₈(ℂ)', 'row 7');
  ok(['4,4', '0,8', '8,0'].every((s) => cliffordCell(...s.split(',').map(Number)).algebra === 'M₁₆(ℝ)'), 'row 8 triple');
  ok(cliffordCell(4, 2).algebra === 'M₈(ℝ)' && cliffordCell(5, 1).algebra === 'M₄(ℍ)', 'row 6 relabel');
  ok(cliffordCell(2, 3).algebra === 'M₄(ℂ)' && cliffordCell(4, 1).algebra === 'M₄(ℂ)', 'row 5 pair');
  const per = periodDerivation();
  ok(per.minimalPeriod === 8 && per.firstWitnessRows.even === 8 && per.firstWitnessRows.odd === 7, 'period/witness ' + JSON.stringify(per.firstWitnessRows));
  const bc = bladeCensus(4, 4);
  ok(bc.total === 256 && bc.active === 136, 'blade census 136');
  ok(bladeCensus(0, 8).active === 136, 'Cl(0,8) active 136');
  ok(cliffordCell(0, 8).omega2 === 1 && cliffordCell(4, 4).omega2 === 1, 'omega^2 row 8');
  ok(Object.keys(GENESIS_METADATA).length === 108, 'genesis 9x12');
  for (const [id, , , p, q] of AUDITED_ATLAS) if (p !== null) ok(p >= 0 && q >= 0, 'cell ' + id);
  ok(AUDITED_ATLAS.length === 25, 'atlas 25');
  return { period: per, genesisKeys: 108, atlasNodes: 25 };
}
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('genesis_audit_v3.js')) console.log(JSON.stringify(selfTest()));
