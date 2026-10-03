import K from './couplingData.js';

// Copy for step 3 of the equations page: Maxwell meets Dirac, one dimension at a time (English and Italian).
// Every number is read from selfcheck/coupling.json (exact, standard library) and selfcheck/coupling_matrix.json (numpy).
const L = K.coupling.ladder, ID = K.coupling.identities, SH = K.coupling.shell, MX = K.matrix;
const sub = d => ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'][d] ?? d;
const ratio = r => r.psi_over_dirac;
const AXN = ['t', 'x', 'y', 'z', 'u', 'v', 'w', 's'];
export const axname = m => AXN.filter((_, i) => m >> i & 1).join('') || '1';
const merr = Math.max(...Object.values(MX.max_error)) === 0 ? '0' : Math.max(...Object.values(MX.max_error)).toExponential(0);
const pe = (k, one, many) => (k === 1 ? one : many);
// the equation at the odd blade t (mask 1): coupling terms on the n cube neighbours o^k, derivative terms on the same neighbours shifted by J (mask 6)
export const ringNodes = n => Array.from({ length: n }, (_, k) => ({ k, inner: 1 ^ (1 << k), outer: 1 ^ (1 << k) ^ 6 }));
const doubling = n => L[n].psi_over_dirac;

const COPY = {
  en: {
    title: 'Coupling: the electron field sources Maxwell, and Maxwell acts on the electron',
    lede: 'Steps 1 and 2 drew two equations apart. Now we join them with the usual pair: the current X = ψγ₀ψ̃ is the source of Maxwell’s equation ∇F = eX, where F = ∇A, and the Dirac equation gains the term −eAψ. We climb one dimension at a time, from n = 1, and at each n we look at the same system in every view of the atlas.',
    numbers: `Signature 1 + (n−1). Exact arithmetic for n = 1 to 8; the identities below are tested on random polynomial fields for n = 3, 4, 5; explicit complex matrices (numpy) for n = 3 to 7.`,
    pickH: 'Pick a dimension', pick: 'n generators',
    tableH: 'The ladder', cols: ['n', 'algebra', 'ψ (real components)', 'one Dirac spinor', 'ψ ÷ Dirac', 'complex structure J', 'current grades', 'terms per equation'],
    noJ: 'none', terms: n => (n >= 3 ? `${2 * n + 1}` : '—'),
    ringH: 'One equation, drawn', ringCap: n => `The equation at the odd blade t (the γ₀ component). Inner ring: its ${n} even neighbours, which carry the terms Aₖψ (solid, one per axis); the time one also carries the mass term. Outer ring: the same ${n} neighbours shifted by the bits of J = xy (mask 6), which carry the derivative terms ∂ₖψ. Every equation of the system has this shape, with ${2 * n + 1} terms.`,
    ringNone: n => `At n = ${n} there is no complex structure J inside the even half, so the equation ∇ψJ = … has no charged form to draw. What does exist is listed in the views below.`,
    viewsH: n => `Every view at n = ${n}`,
    views: r => {
      const n = r.n, hasJ = r.J_exists;
      const cl = { h: 'Clifford', t: `Cl(1,${n - 1}) is ${r.algebra}. Its even half is ${r.even_half}. ψ has ${r.psi_components} real component${pe(r.psi_components, '', 's')}.${hasJ ? ` One Dirac spinor has ${r.dirac_real_dim} (the real count of 2^(⌊n/2⌋) complex numbers). Ratio ${ratio(r)}.` : ' Complex spinors need a complex structure J, and there is none, so no Dirac count is given here.'}`, tags: ['checked', 'standard'] };
      const cu = hasJ
        ? { h: 'Cube', t: `Terms at each corner of the ${n}-cube: ${n} derivative edges, ${n} coupling edges, 1 mass edge (the time edge). That is ${2 * n + 1} per equation and ${r.incidences_total} in all. Compared with step 2 the coupling adds ${r.coupling_edges} terms and no new edge: it lives on cube edges that were already there.`, tags: ['checked'] }
        : { h: 'Cube', t: `Only the ${r.mass_edges} time edge${pe(r.mass_edges, '', 's')} (the mass term ψγ₀) exist${pe(r.mass_edges, 's', '')}. The derivative term needs J, and there is none, so no derivative or coupling edges.`, tags: ['checked'] };
      const si = hasJ
        ? { h: 'Simplex', t: `The coupling terms of an odd blade sit on its ${n} even neighbours, which form a simplex (checked for this n). The derivative terms sit on the same simplex moved by J. Minimal coupling is therefore a statement about the corner simplex, with the time corner shared with the mass term.`, tags: ['checked', 'ours'] }
        : { h: 'Simplex', t: `The corner simplex of an odd blade has ${n} even neighbour${pe(n, '', 's')}, but with no J there is no derivative term to couple to.`, tags: ['checked'] };
      const gr = r.current_grades.map(g => `${r.current_blades[g]} blade${r.current_blades[g] > 1 ? 's' : ''} of grade ${g}`).join(' and ');
      const de = { h: 'Demicube', t: `The current ψγ₀ψ̃ has ${gr}. The density (the t component) uses the ${r.rho_terms} corner${pe(r.rho_terms, '', 's')}, each squared: a sum of squares.${n > 1 ? ` Each space component uses the ${r.demicube_edges_of_type_0k} demicube edge${pe(r.demicube_edges_of_type_0k, '', 's')} that change${pe(r.demicube_edges_of_type_0k, 's', '')} exactly the bits t and that axis.` : ' There is no space component.'}${r.current_grades.includes(5) ? ` The grade-5 part uses pairs of corners at distance ${r.pair_distance['5'].join(' or ')}, which are not edges.` : ''}`, tags: ['checked'] };
      const la = { h: 'Labels', t: `γ₀ is label 1.${hasJ ? ` J = γ₂γ₁ is label 6 (${r.J_count} spatial bivector${pe(r.J_count, ' squares', 's square')} to −1 and ${pe(r.J_count, 'commutes', 'commute')} with γ₀).` : ' No bivector squares to −1 and commutes with γ₀.'}${r.even_labels ? ` The even labels are ${r.even_labels.join(', ')}.` : ''} Labels are notation.`, tags: ['checked'] };
      const ma = { h: 'Maxwell', t: `F has ${r.F_components} component${pe(r.F_components, '', 's')} and ∇F = eX has ${r.maxwell_incidences} incidences${n < 2 ? ' (no field at n = 1)' : ''}. The source has ${n} vector component${pe(n, '', 's')}, all in the vector part of X.${r.current_grades.includes(5) ? ` The grade-5 part of X has ${r.current_blades['5']} blade${r.current_blades['5'] > 1 ? 's' : ''} and no slot in ∇F, which only has grades 1 and 3.` : ''}`, tags: ['checked'] };
      const di = { h: 'Dirac', t: !hasJ ? `No Dirac equation of this form: it needs J. A neutral (real) form was not built.` : r.psi_over_dirac === '1' ? `ψ is exactly one Dirac spinor here (ratio 1). The mass shell has real dimension ${SH[n].kernel_real_dim}.` : SH[n] ? `ψ has ${r.psi_over_dirac} times the components of one Dirac spinor. The solution space on the mass shell is ${SH[n].kernel_real_dim}, which is half of ψ and ${SH[n].kernel_real_dim / SH[n].one_dirac_spinor} times one Dirac spinor.` : `ψ has ${r.psi_over_dirac} times the components of one Dirac spinor. The mass-shell dimension was computed for n = 3 to 7 only.`, tags: hasJ ? ['checked', 'standard'] : ['open'] };
      return [cl, cu, si, de, la, ma, di];
    },
    idH: 'Exact identities (random polynomial fields)', idCols: ['n', 'conservation: div X = −2⟨γ₀ψ̃DJ⟩₀', 'first-order gauge invariance', 'Maxwell forces div X = 0', 'algebraic facts'],
    idNote: 'Here D is the left side of the Dirac equation with the A term. The identity holds for any ψ and A, so on every solution (D = 0) the divergence of X is zero. In Maxwell’s equation the divergence of ∇F is zero by itself, so its source must be conserved: the two equations agree on this. Gauge: replacing ψ by ψ(1 + Jε) and A by A − ∇ε/e changes D by (DJ)ε, to first order in ε, so a solution stays a solution.',
    xrH: 'What each view teaches the others',
    xr: [
      ['checked', 'Maxwell → Dirac. The coupling reuses the n cube edges at each corner. The only new thing is a factor A on edges that were already drawn.'],
      ['checked', 'Dirac → Maxwell. The source has only a vector part up to n = 4. From n = 5 a grade-5 part appears that Maxwell has no slot for.'],
      ['checked', `Spinor count. ψ is exactly one Dirac spinor only at n = 3 and 4. From n = 5 the even half is bigger (ratio ${[5, 6, 7, 8].map(doubling).join(', ')} for n = 5 to 8), and an explicit matrix check at n = 5 finds ψ with ψu = 0 whose vector current is not zero.`],
      ['standard', 'This is the known Dirac–Maxwell system in Hestenes’ form, with the same spinor dimensions as the standard tables. We rebuilt the structure on the bit rule and checked it.']
    ],
    matH: 'Independent check with matrices',
    mat: `With Jordan–Wigner gamma matrices (numpy), ψ goes to Ψ = ψu, where γ₀u = u and Ju = ±iu. The expression ∇ψJ − eAψ − mψγ₀ then equals the usual i∇̸Ψ − eA̸Ψ − mΨ on ${40 * 5} random cases for n = 3 to 7 (largest error ${merr}). The real rank of ψ → ψu is ${Object.values(MX.rank_real).join(', ')} for n = 3 to 7: the map starts losing information at n = 5. For n = 3 and 4 the current ψγ₀ψ̃ equals Ψ†γ₀γₘΨ component by component (ratio ±1, the metric sign). Three wrong versions fail: J with the wrong sign, the A term dropped on one side, gamma matrices with the wrong signature.`,
    open: [
      ['open', 'The sign and the size of the source term e·X. They come from an action principle that we have not rebuilt, so the system is drawn and its consistency is checked, but the coupling constant is not derived.'],
      ['open', 'n = 1 and 2: no J, so no charged field. A neutral form was not built.'],
      ['open', 'What the extra components of ψ do from n = 5, and where the grade-5 part of the current goes. Whether this has anything to do with the three generations is not known; nothing here selects three.'],
      ['open', 'Non-abelian coupling (Yang–Mills) and gravity are not drawn.']
    ],
    dl: { h: 'Check it yourself', text: 'Two Python files. The first (standard library only) rebuilds the ladder for n = 1 to 8, the three identities and the shell dimensions, exactly. The second (needs numpy) runs the matrix comparison and three wrong versions that must fail.', py: 'Download coupling_selfcheck.py', py2: 'Download coupling_matrix_check.py', json: 'Download coupling.json', cmd: 'python3 coupling_selfcheck.py --compare coupling.json   ·   python3 coupling_matrix_check.py --compare coupling_matrix.json' }
  },
  it: {
    title: 'Accoppiamento: il campo dell’elettrone è la sorgente di Maxwell, e Maxwell agisce sull’elettrone',
    lede: 'I passi 1 e 2 hanno disegnato due equazioni separate. Ora le uniamo con la coppia usuale: la corrente X = ψγ₀ψ̃ è la sorgente dell’equazione di Maxwell ∇F = eX, con F = ∇A, e l’equazione di Dirac acquista il termine −eAψ. Saliamo una dimensione alla volta, da n = 1, e a ogni n guardiamo lo stesso sistema in ogni vista dell’atlante.',
    numbers: 'Segnatura 1 + (n−1). Aritmetica esatta per n = 1…8; le identità qui sotto sono provate su campi polinomiali casuali per n = 3, 4, 5; matrici complesse esplicite (numpy) per n = 3…7.',
    pickH: 'Scegli una dimensione', pick: 'n generatori',
    tableH: 'La scala', cols: ['n', 'algebra', 'ψ (componenti reali)', 'uno spinore di Dirac', 'ψ ÷ Dirac', 'struttura complessa J', 'gradi della corrente', 'termini per equazione'],
    noJ: 'nessuna', terms: n => (n >= 3 ? `${2 * n + 1}` : '—'),
    ringH: 'Un’equazione, disegnata', ringCap: n => `L’equazione sul blade dispari t (la componente γ₀). Anello interno: i suoi ${n} vicini pari, che portano i termini Aₖψ (pieni, uno per asse); quello del tempo porta anche il termine di massa. Anello esterno: gli stessi ${n} vicini spostati dai bit di J = xy (maschera 6), che portano i termini di derivata ∂ₖψ. Ogni equazione del sistema ha questa forma, con ${2 * n + 1} termini.`,
    ringNone: n => `A n = ${n} non c’è una struttura complessa J dentro la metà pari, quindi l’equazione ∇ψJ = … non ha una forma carica da disegnare. Quello che esiste è elencato nelle viste qui sotto.`,
    viewsH: n => `Tutte le viste a n = ${n}`,
    views: r => {
      const n = r.n, hasJ = r.J_exists;
      const cl = { h: 'Clifford', t: `Cl(1,${n - 1}) è ${r.algebra}. La sua metà pari è ${r.even_half}. ψ ha ${r.psi_components} component${pe(r.psi_components, 'e reale', 'i reali')}.${hasJ ? ` Uno spinore di Dirac ne ha ${r.dirac_real_dim} (il conteggio reale di 2^(⌊n/2⌋) numeri complessi). Rapporto ${ratio(r)}.` : ' Gli spinori complessi richiedono una struttura complessa J, che non c’è, quindi qui non si dà un conteggio di Dirac.'}`, tags: ['checked', 'standard'] };
      const cu = hasJ
        ? { h: 'Cubo', t: `Termini a ogni vertice del ${n}-cubo: ${n} spigoli di derivata, ${n} di accoppiamento, 1 di massa (lo spigolo temporale). Sono ${2 * n + 1} per equazione e ${r.incidences_total} in tutto. Rispetto al passo 2 l’accoppiamento aggiunge ${r.coupling_edges} termini e nessuno spigolo nuovo: vive su spigoli del cubo che c’erano già.`, tags: ['checked'] }
        : { h: 'Cubo', t: `Esist${pe(r.mass_edges, 'e solo lo spigolo temporale', 'ono solo i ' + r.mass_edges + ' spigoli temporali')} (il termine di massa ψγ₀). Il termine di derivata richiede J, che non c’è, quindi niente spigoli di derivata o di accoppiamento.`, tags: ['checked'] };
      const si = hasJ
        ? { h: 'Simplesso', t: `I termini di accoppiamento di un blade dispari stanno sui suoi ${n} vicini pari, che formano un simplesso (controllato per questo n). I termini di derivata stanno sullo stesso simplesso spostato da J. L’accoppiamento minimale è dunque un fatto sul simplesso d’angolo, con il vertice del tempo condiviso col termine di massa.`, tags: ['checked', 'ours'] }
        : { h: 'Simplesso', t: `Il simplesso d’angolo di un blade dispari ha ${n} vicin${pe(n, 'o pari', 'i pari')}, ma senza J non c’è un termine di derivata a cui accoppiarsi.`, tags: ['checked'] };
      const gr = r.current_grades.map(g => `${r.current_blades[g]} blade di grado ${g}`).join(' e ');
      const de = { h: 'Demicubo', t: `La corrente ψγ₀ψ̃ ha ${gr}. La densità (la componente t) usa ${pe(r.rho_terms, 'il vertice', 'i ' + r.rho_terms + ' vertici')}, ciascuno al quadrato: una somma di quadrati.${n > 1 ? ` Ogni componente spaziale usa ${pe(r.demicube_edges_of_type_0k, 'lo spigolo', 'gli ' + r.demicube_edges_of_type_0k + ' spigoli')} del demicubo che cambia${pe(r.demicube_edges_of_type_0k, '', 'no')} esattamente i bit t e quell’asse.` : ' Non c’è una componente spaziale.'}${r.current_grades.includes(5) ? ` La parte di grado 5 usa coppie di vertici a distanza ${r.pair_distance['5'].join(' o ')}, che non sono spigoli.` : ''}`, tags: ['checked'] };
      const la = { h: 'Etichette', t: `γ₀ è l’etichetta 1.${hasJ ? ` J = γ₂γ₁ è l’etichetta 6 (${r.J_count} bivettor${r.J_count > 1 ? 'i spaziali hanno' : 'e spaziale ha'} quadrato −1 e commut${r.J_count > 1 ? 'ano' : 'a'} con γ₀).` : ' Nessun bivettore ha quadrato −1 e commuta con γ₀.'}${r.even_labels ? ` Le etichette pari sono ${r.even_labels.join(', ')}.` : ''} Le etichette sono solo notazione.`, tags: ['checked'] };
      const ma = { h: 'Maxwell', t: `F ha ${r.F_components} component${pe(r.F_components, 'e', 'i')} e ∇F = eX ha ${r.maxwell_incidences} incidenze${n < 2 ? ' (a n = 1 non c’è campo)' : ''}. La sorgente ha ${n} component${pe(n, 'e vettoriale', 'i vettoriali')}, ${pe(n, 'tutta', 'tutte')} nella parte vettoriale di X.${r.current_grades.includes(5) ? ` La parte di grado 5 di X ha ${r.current_blades['5']} blade e nessun posto in ∇F, che ha solo i gradi 1 e 3.` : ''}`, tags: ['checked'] };
      const di = { h: 'Dirac', t: !hasJ ? 'Nessuna equazione di Dirac di questa forma: serve J. Una forma neutra (reale) non è stata costruita.' : r.psi_over_dirac === '1' ? `Qui ψ è esattamente uno spinore di Dirac (rapporto 1). La superficie di massa ha dimensione reale ${SH[n].kernel_real_dim}.` : SH[n] ? `ψ ha ${r.psi_over_dirac} volte le componenti di uno spinore di Dirac. Lo spazio delle soluzioni sulla superficie di massa è ${SH[n].kernel_real_dim}, cioè metà di ψ e ${SH[n].kernel_real_dim / SH[n].one_dirac_spinor} volte uno spinore di Dirac.` : `ψ ha ${r.psi_over_dirac} volte le componenti di uno spinore di Dirac. La dimensione sulla superficie di massa è stata calcolata solo per n = 3…7.`, tags: hasJ ? ['checked', 'standard'] : ['open'] };
      return [cl, cu, si, de, la, ma, di];
    },
    idH: 'Identità esatte (campi polinomiali casuali)', idCols: ['n', 'conservazione: div X = −2⟨γ₀ψ̃DJ⟩₀', 'invarianza di gauge al primo ordine', 'Maxwell impone div X = 0', 'fatti algebrici'],
    idNote: 'Qui D è il lato sinistro dell’equazione di Dirac con il termine A. L’identità vale per ogni ψ e A, quindi su ogni soluzione (D = 0) la divergenza di X è zero. In Maxwell la divergenza di ∇F è zero da sola, quindi la sua sorgente deve essere conservata: le due equazioni concordano su questo. Gauge: sostituire ψ con ψ(1 + Jε) e A con A − ∇ε/e cambia D di (DJ)ε, al primo ordine in ε, quindi una soluzione resta una soluzione.',
    xrH: 'Che cosa ogni vista insegna alle altre',
    xr: [
      ['checked', 'Maxwell → Dirac. L’accoppiamento riusa gli n spigoli del cubo a ogni vertice. L’unica cosa nuova è un fattore A su spigoli già disegnati.'],
      ['checked', 'Dirac → Maxwell. La sorgente ha solo una parte vettoriale fino a n = 4. Da n = 5 compare una parte di grado 5 per cui Maxwell non ha posto.'],
      ['checked', `Conteggio degli spinori. ψ è esattamente uno spinore di Dirac solo a n = 3 e 4. Da n = 5 la metà pari è più grande (rapporto ${[5, 6, 7, 8].map(doubling).join(', ')} per n = 5…8), e un controllo matriciale esplicito a n = 5 trova ψ con ψu = 0 la cui corrente vettoriale non è zero.`],
      ['standard', 'È il noto sistema Dirac–Maxwell nella forma di Hestenes, con le stesse dimensioni spinoriali delle tabelle standard. Abbiamo ricostruito la struttura sulla regola dei bit e controllata.']
    ],
    matH: 'Controllo indipendente con matrici',
    mat: `Con matrici gamma di Jordan–Wigner (numpy), ψ va in Ψ = ψu, dove γ₀u = u e Ju = ±iu. L’espressione ∇ψJ − eAψ − mψγ₀ coincide allora con l’usuale i∇̸Ψ − eA̸Ψ − mΨ su ${40 * 5} casi casuali per n = 3…7 (errore massimo ${merr}). Il rango reale di ψ → ψu è ${Object.values(MX.rank_real).join(', ')} per n = 3…7: la mappa comincia a perdere informazione a n = 5. Per n = 3 e 4 la corrente ψγ₀ψ̃ coincide con Ψ†γ₀γₘΨ componente per componente (rapporto ±1, il segno della metrica). Tre versioni sbagliate falliscono: J col segno sbagliato, il termine A tolto da un lato, matrici gamma con la segnatura sbagliata.`,
    open: [
      ['open', 'Il segno e la grandezza del termine sorgente e·X. Vengono da un principio d’azione che non abbiamo ricostruito: il sistema è disegnato e la sua coerenza è controllata, ma la costante di accoppiamento non è derivata.'],
      ['open', 'n = 1 e 2: niente J, quindi niente campo carico. Una forma neutra non è stata costruita.'],
      ['open', 'Che cosa fanno le componenti in più di ψ da n = 5, e dove va la parte di grado 5 della corrente. Se questo abbia a che fare con le tre generazioni non si sa; niente qui ne sceglie tre.'],
      ['open', 'L’accoppiamento non abeliano (Yang–Mills) e la gravità non sono disegnati.']
    ],
    dl: { h: 'Verificalo tu', text: 'Due file Python. Il primo (solo libreria standard) ricostruisce la scala per n = 1…8, le tre identità e le dimensioni sulla superficie di massa, esattamente. Il secondo (richiede numpy) fa il confronto con le matrici e tre versioni sbagliate che devono fallire.', py: 'Scarica coupling_selfcheck.py', py2: 'Scarica coupling_matrix_check.py', json: 'Scarica coupling.json', cmd: 'python3 coupling_selfcheck.py --compare coupling.json   ·   python3 coupling_matrix_check.py --compare coupling_matrix.json' }
  }
};
export default COPY;
