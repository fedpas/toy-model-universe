import E from './equationsData.js';
import S from './shapesData.js';
import KD from './couplingData.js';
import YD from './yangmillsData.js';
import MD from './matterData.js';
import GD from './gravityData.js';
import MRD from './mirrorsData.js';
import PJD from './projectiveData.js';
import FQD from './forqueData.js';
import SPD from './spinData.js';
import SRD from './springData.js';
import PGD from './pgadynData.js';

// Copy for the "More equations" page (English and Italian). Kept apart from the component so the tests can read it.
const K4 = KD.coupling.ladder[4], YM4 = YD.ym.ladder[3], MT3 = MD.mt.ladder[3], GV4 = GD.gv.ladder[4], GVC4 = GV4.pair_classes.diagonal + GV4.pair_classes.share_one_index + GV4.pair_classes.disjoint, MR4 = MRD.mr.ladder[4], PJ4 = PJD.pj.counts[4];
const FQC = FQD.fq.counts, SPC = SPD.spm.counts;
const C = E.eq.commutators, D = E.eq.dirac, M = E.matrix, MX4 = S.demicube.maxwell[4];
const err = M.worst_error === 0 ? '0' : M.worst_error.toExponential(0);
const ctrl = Object.values(M.negative_controls_fail_with_error).map(x => x.toFixed(1));
const COPY = {
  en: {
    c: {
      title: 'Commutators: the Lorentz algebra from the same bits',
      lede: 'In Maxwell the field F is a bivector. Bivectors also generate rotations: the commutator of two bivectors is again a bivector. The bit rule says exactly when it is not zero: two bivectors anticommute when they share exactly one index, and commute when they share none. This is the structure of so(p,q), which is the Lorentz algebra when p = 1 and q = 3.',
      tableH: 'The rule, for every number of generators', cols: ['n generators', 'bivectors', 'pairs that do not commute', 'pairs that commute', 'closed triangles (index triples)'],
      note: 'Every signature up to n = 8 was checked. A non-zero commutator is always a bivector with coefficient ±2. The Jacobi identity holds exactly for every triple up to n = 6. The action on vectors is faithful and keeps the metric, so the bivectors really are so(p,q). The pairs that do not commute number n(n−1)(n−2)/2.',
      picH: 'The four-generator case: an octahedron', pick: 'Signature: time axes + space axes',
      cap: p => `6 bivectors on a circle, complementary pairs opposite (tx with yz, ty with xz, tz with xy), joined unless complementary: 12 edges. An edge is a pair that does not commute, and the commutator is the third corner of its triangle. Signature ${p} + ${4 - p}.`,
      legend: 'Colour = role of the bivector or of the commutator.', roles: { E: 'E: one time index (a boost when there is one time axis)', B: 'B: no time index (a rotation)', T: 'T: two time indices' },
      roleH: 'What each commutator is made of', roleCols: ['pair', 'shared index', 'result', 'edges'], via: { t: 'a time axis', s: 'a space axis' },
      lorentz: 'With one time and three space axes this is the Lorentz algebra: boost with boost gives a rotation (3 edges), rotation with rotation gives a rotation (3), rotation with boost gives a boost (6). Nothing else is needed.',
      points: [
        [['checked'], `Maxwell (Test 1). Two field components share an equation exactly when they share an index. That is the same graph as the pairs that do not commute: ${C.by_n['4'].edges} edges at n = 4 on both sides, and equal counts for every n from 3 to 7.`],
        [['checked'], 'Demicube (More shapes, step 2). At n = 4 the 16-cell has the scalar and the pseudoscalar at two poles and the six bivectors as its equator. The octahedron above is that equator: 12 edges, and the three commuting pairs are the antipodes.'],
        [['standard'], 'What this is. The structure constants of so(p,q). A non-abelian field strength F = dA + A∧A needs a gauge algebra, and so(n) is one choice whose structure is exactly this graph. Other Lie algebras are not covered.'],
        [['open'], 'Not shown: a Yang–Mills equation with a gauge field, and any dynamics of the commutator terms.']
      ]
    },
    d: {
      title: 'The Dirac equation lives on the even half',
      lede: 'In the algebra of one time and three space axes, write the electron field as an even multivector ψ: a scalar, six bivectors and a pseudoscalar. That is 8 real numbers, exactly the 8 corners of the 4-demicube. The equation is ∇ψJ = mψγ₀, where J = γ₂γ₁ squares to −1 and plays the role of i. Both sides are odd: ∇ flips parity, as in Maxwell.',
      numbers: `${D.counts.components} components, ${D.counts.equations} equations, ${D.counts.incidences} incidences. Each equation has ${D.counts.terms_per_equation.derivative} derivative terms and ${D.counts.terms_per_equation.mass} mass term.`,
      picH: 'The incidence picture', cap: 'Left: the 8 even blades (ψ). Right: the 8 odd blades, one equation each. Coloured lines are the four derivatives. Dashed lines are the mass term. Click an odd blade to isolate its equation.',
      terms: n => `terms in this equation: ${n}`, kinds: { dt: '∂t', dx: '∂x', dy: '∂y', dz: '∂z', m: 'mass' },
      xrefH: 'Cross-references',
      cube: { h: 'Cube view', t: `The ${D.counts.cube_edges_used_by_derivative} derivative terms are all ${D.counts.cube_edges_used_by_derivative} edges of the 4-cube, from an even corner to an odd one, followed by one fixed shift by the bits of J. The ${D.counts.mass_edges} mass terms are the time edges of the cube.` },
      maxwell: { h: 'Maxwell (Test 1)', t: `The six bivector components of ψ are the same blades Maxwell uses for E and B. Maxwell's ∇F = J has ${MX4.incidences} incidences with ${MX4.vector_equations} vector and ${MX4.trivector_equations} trivector equations; the Dirac equation has ${D.counts.incidences} incidences, because ψ also carries a scalar and a pseudoscalar and the mass term returns to the odd half.` },
      comm: { h: 'Commutators (step 1)', t: 'Left multiplication of ψ by a bivector is an infinitesimal Lorentz transformation. For each of the 6 bivectors B the identity D(Bψ) = B D(ψ) − D′(ψ) holds exactly, where D′ has the momentum rotated by the commutator [B, p] and no mass term. So the graph of step 1 acts on the components of step 2.' },
      disp: { h: 'Momentum space', t: `The 8 × 8 system has determinant (p² − m²)⁴, checked exactly at ${D.dispersion.length} points. On the mass shell the solutions form a ${D.solution_space.massive_shell_real_dim}-dimensional real space (two spin states, two signs of energy). Off the shell there are none.` },
      mat: { h: 'Independent check', t: `With explicit 4 × 4 gamma matrices (numpy) we send ψ to Ψ = ψu, with u = (1, 0, 0, 0). Right multiplication by J then acts as i, and the expression above equals the standard Dirac equation on ${M.trials} random cases (largest error ${err}). Two wrong versions, J with the wrong sign and no J, fail by ${ctrl[0]} and ${ctrl[1]}.` },
      limits: 'What this does not show: solutions, spin sums, anything about antiparticles beyond the sign of the energy, or a gauge field. It is a known formulation (Hestenes’ space-time algebra). We rebuilt it on the bit rule and checked it. Nothing here selects a number of generations.',
      tags: [['checked'], ['standard'], ['ours']]
    },
    t: {
      eyebrow: 'WHERE THE TALLY STANDS', title: 'Equations we can draw and check',
      lede: 'Each row is an equation whose structure is drawn from the bit rule and checked by a script. The pictures show which components enter which equation, with which operation. They do not show solutions.',
      cols: ['equation', 'where', 'components', 'incidences', 'status'],
      rows: [
        ['∇F = J (Maxwell)', 'Test 1; cells n = 2 to 7', `${MX4.F_components} in 4D`, `${MX4.incidences} in 4D`, ['checked']],
        ['Commutators of bivectors (so(p,q))', 'step 1; n = 2 to 8', `${C.by_n['4'].bivectors} in 4D`, `${C.by_n['4'].edges} relations in 4D`, ['checked']],
        ['∇ψJ = mψγ₀ (Dirac)', 'step 2; Cl(1,3)', `${D.counts.components}`, `${D.counts.incidences}`, ['checked', 'standard']],
        ['Coupling: ∇F = eX and −eAψ', 'step 3; n = 1 to 8 (charged form from n = 3)', `${K4.psi_components} + ${K4.F_components} + 4 in 4D`, `${K4.incidences_total} + ${K4.maxwell_incidences} in 4D`, ['checked', 'standard']],
        ['Yang–Mills: D^μF_{μν} = J_ν, gauge algebra so(m)', 'step 4; m = 2 to 8', `${YM4.F_components} in 4D at m = 3`, `${YM4.equation_terms + YM4.bianchi_terms} in 4D at m = 3`, ['checked', 'standard']],
        ['Charged matter: Dirac + so(m), current j^a', 'step 5; m = 2 to 8', `${MT3.components} in 4D at m = 3`, `${MT3.terms_total} in 4D at m = 3`, ['checked', 'standard']],
        ['Gravity I: R = dω + ¼[ω,ω], T = de + ωe', 'step 6; n = 2 to 8', `${GV4.curvature_components} + ${GV4.torsion_components} in 4D`, `${GVC4} cells − ${GV4.first_bianchi_constraints} relation in 4D`, ['checked', 'standard']],
        ['Gravity II: Einstein form E_a, F = R + c e∧e', 'step 7; n = 3 to 8 (none at n = 2)', `${GV4.einstein_components} in 4D`, `${GV4.einstein_terms_per_component} terms in each E_a in 4D`, ['checked', 'standard']],
        ['Mirrors: x ↦ −a x a⁻¹, versors, Cartan–Dieudonné', 'step 8; n = 2 to 8', `${MR4.corners} corners in 4D`, `${MR4.rotors} rotors, ${MR4.reflections} reflections, at most ${MR4.max_mirrors} mirrors in 4D`, ['checked', 'standard']],
        ['One more generator and a null pair: [B_an, B_bn] = −2s B_ab; ε, o', 'step 9; n = 2 to 6 (null pair n = 2 to 4)', `${PJ4.ladder_generators} generators and ${PJ4.cga_dimension} blades in 4D`, `${PJ4.conformal_generators} conformal generators in 4D`, ['checked', 'standard']],
        ['Forque dynamics: Ṗ = F, Ḃ = I⁻¹[B×I[B]+F], Ṁ = −½MB', 'step 10; PGA with d = 2 and 3 (inertia map also d = 4)', `${FQC.rows} equations of one paper`, `${FQC.ok} agree exactly, ${FQC.note} after a noted correction, ${FQC.not_checked} not checked`, ['checked', 'standard']],
        ['Spinors: pointors ψOψ̃ = ρO, the labels of the b_j, ⊞ = Πw₊w₋ and the lecture’s B + i', 'step 11; Cl(2,0) to Cl(7,0) and Cl(1,3); the three kinds of i', `${SPC.rows} statements from a paper and a lecture`, `${SPC.ok} agree exactly, ${SPC.note} after a noted correction, ${SPC.not_checked} not checked`, ['checked', 'standard', 'ours']],
        ['A spring network on the cube: x″ = −Lx, plain and with the sign of the generator', 'step 12; n = 2 to 5 (series at n = 3); the three kinds of i as oscillator, inverted oscillator, free motion', `${SRD.cube['3'].V} masses and ${SRD.cube['3'].E} springs in 3D, ${SRD.cube['4'].V} and ${SRD.cube['4'].E} in 4D`, `${SRD.summary.ok} exact claims in ${SRD.rows.length} rows, all hold; 2 levels n ± √n against n + 1`, ['checked', 'standard', 'ours']],
        ['A rigid body: M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]), gravity, Hooke and damping as lines', 'step 13; n = 1 to 4 (counts to n = 5); segment, square, cube, tesseract, then the free top, the Moon, and the Sun with five planets', `${PGD.frame_table['3'].vertices} vertices carry ${PGD.frame_table['3'].motor_coefficients} motor coefficients in 3D, ${PGD.frame_table['4'].vertices} and ${PGD.frame_table['4'].motor_coefficients} in 4D`, `${PGD.summary.ok} claims in ${PGD.summary.rows} rows, all hold (reference rows against ganja.js); the speed of the labels is timed, not proved`, ['checked', 'standard', 'ours', 'open']]
      ],
      next: 'Still not drawn: chirality and the electroweak doublets, the Dirac equation on a curved tetrad, the field equation of gravity with matter (the coupling and its sign), the neutral (real) form at n = 1 and 2, and the solutions of any of these equations.',
      note: '{N} rows, none new. Maxwell, bivector commutators and Dirac are each linear in their own field; the coupling is bilinear (Aψ) and quadratic (ψγ₀ψ̃), and Yang–Mills adds terms quadratic and cubic in A from its own commutator, and gravity multiplies curvature (itself quadratic in ω) by tetrads, so the joint systems are nonlinear. The mirrors row and the one-more-generator row are not equations but groups of motions, so they give counts and no terms. We drew where the terms sit and checked identities, not solutions, except in the last four steps, which check another group’s equations of rigid-body motion, including exact power-series solutions, a paper and a lecture on spinors, where the claims are exact identities, a spring network on the cube, again with exact power-series solutions, and a rigid body from a segment to a tesseract, where a live engine is checked against exact power-series solutions. Nothing here predicts anything.'
    },
    dl: { h: 'Check it yourself', text: 'Two Python files. The first (standard library only) rebuilds the commutator tables, the Dirac incidences, the determinant, the shell dimensions and the covariance identity, exactly. The second (needs numpy) compares the Dirac form with the usual gamma matrices and runs two wrong versions that must fail.', py: 'Download equations_selfcheck.py', py2: 'Download dirac_matrix_check.py', json: 'Download equations.json', cmd: 'python3 equations_selfcheck.py --compare equations.json   ·   python3 dirac_matrix_check.py' }
  },
  it: {
    c: {
      title: 'Commutatori: l’algebra di Lorentz dagli stessi bit',
      lede: 'In Maxwell il campo F è un bivettore. I bivettori generano anche le rotazioni: il commutatore di due bivettori è di nuovo un bivettore. La regola dei bit dice esattamente quando non è zero: due bivettori anticommutano quando condividono esattamente un indice, e commutano quando non ne condividono nessuno. È la struttura di so(p,q), cioè l’algebra di Lorentz quando p = 1 e q = 3.',
      tableH: 'La regola, per ogni numero di generatori', cols: ['n generatori', 'bivettori', 'coppie che non commutano', 'coppie che commutano', 'triangoli chiusi (terne di indici)'],
      note: 'Abbiamo controllato ogni segnatura fino a n = 8. Un commutatore non nullo è sempre un bivettore con coefficiente ±2. L’identità di Jacobi vale esattamente per ogni terna fino a n = 6. L’azione sui vettori è fedele e conserva la metrica, quindi i bivettori sono davvero so(p,q). Le coppie che non commutano sono n(n−1)(n−2)/2.',
      picH: 'Il caso a quattro generatori: un ottaedro', pick: 'Segnatura: assi di tempo + assi di spazio',
      cap: p => `6 bivettori su un cerchio, coppie complementari opposte (tx con yz, ty con xz, tz con xy), uniti salvo i complementari: 12 spigoli. Uno spigolo è una coppia che non commuta, e il commutatore è il terzo vertice del suo triangolo. Segnatura ${p} + ${4 - p}.`,
      legend: 'Colore = ruolo del bivettore o del commutatore.', roles: { E: 'E: un indice di tempo (un boost se c’è un solo asse di tempo)', B: 'B: nessun indice di tempo (una rotazione)', T: 'T: due indici di tempo' },
      roleH: 'Di che cosa è fatto ogni commutatore', roleCols: ['coppia', 'indice condiviso', 'risultato', 'spigoli'], via: { t: 'un asse di tempo', s: 'un asse di spazio' },
      lorentz: 'Con un asse di tempo e tre di spazio è l’algebra di Lorentz: boost con boost dà una rotazione (3 spigoli), rotazione con rotazione dà una rotazione (3), rotazione con boost dà un boost (6). Non serve altro.',
      points: [
        [['checked'], `Maxwell (Prova 1). Due componenti del campo condividono un’equazione esattamente quando condividono un indice. È lo stesso grafo delle coppie che non commutano: ${C.by_n['4'].edges} spigoli a n = 4 da entrambe le parti, e conteggi uguali per ogni n da 3 a 7.`],
        [['checked'], 'Demicubo (Altre forme, passo 2). A n = 4 la 16-cella ha lo scalare e lo pseudoscalare ai due poli e i sei bivettori come equatore. L’ottaedro qui sopra è quell’equatore: 12 spigoli, e le tre coppie che commutano sono gli antipodi.'],
        [['standard'], 'Che cos’è. Le costanti di struttura di so(p,q). Un campo non abeliano F = dA + A∧A richiede un’algebra di gauge, e so(n) è una scelta la cui struttura è esattamente questo grafo. Altre algebre di Lie non sono coperte.'],
        [['open'], 'Non mostrato: un’equazione di Yang–Mills con un campo di gauge, e qualunque dinamica dei termini di commutatore.']
      ]
    },
    d: {
      title: 'L’equazione di Dirac vive sulla metà pari',
      lede: 'Nell’algebra di un asse di tempo e tre di spazio, scriviamo il campo dell’elettrone come un multivettore pari ψ: uno scalare, sei bivettori e uno pseudoscalare. Sono 8 numeri reali, esattamente gli 8 vertici del 4-demicubo. L’equazione è ∇ψJ = mψγ₀, dove J = γ₂γ₁ ha quadrato −1 e fa da i. Entrambi i lati sono dispari: ∇ scambia la parità, come in Maxwell.',
      numbers: `${D.counts.components} componenti, ${D.counts.equations} equazioni, ${D.counts.incidences} incidenze. Ogni equazione ha ${D.counts.terms_per_equation.derivative} termini di derivata e ${D.counts.terms_per_equation.mass} termine di massa.`,
      picH: 'Il quadro delle incidenze', cap: 'A sinistra: gli 8 blade pari (ψ). A destra: gli 8 blade dispari, uno per equazione. Le linee colorate sono le quattro derivate. Le linee tratteggiate sono il termine di massa. Clicca un blade dispari per isolare la sua equazione.',
      terms: n => `termini in questa equazione: ${n}`, kinds: { dt: '∂t', dx: '∂x', dy: '∂y', dz: '∂z', m: 'massa' },
      xrefH: 'Rimandi',
      cube: { h: 'Vista cubo', t: `I ${D.counts.cube_edges_used_by_derivative} termini di derivata sono tutti i ${D.counts.cube_edges_used_by_derivative} spigoli del 4-cubo, da un vertice pari a uno dispari, seguiti da un solo spostamento fisso con i bit di J. Gli ${D.counts.mass_edges} termini di massa sono gli spigoli temporali del cubo.` },
      maxwell: { h: 'Maxwell (Prova 1)', t: `Le sei componenti bivettoriali di ψ sono gli stessi blade che Maxwell usa per E e B. ∇F = J di Maxwell ha ${MX4.incidences} incidenze con ${MX4.vector_equations} equazioni vettoriali e ${MX4.trivector_equations} trivettoriali; l’equazione di Dirac ha ${D.counts.incidences} incidenze, perché ψ porta anche uno scalare e uno pseudoscalare e il termine di massa torna alla metà dispari.` },
      comm: { h: 'Commutatori (passo 1)', t: 'La moltiplicazione a sinistra di ψ per un bivettore è una trasformazione di Lorentz infinitesima. Per ciascuno dei 6 bivettori B l’identità D(Bψ) = B D(ψ) − D′(ψ) vale esattamente, dove D′ ha l’impulso ruotato dal commutatore [B, p] e nessun termine di massa. Quindi il grafo del passo 1 agisce sulle componenti del passo 2.' },
      disp: { h: 'Spazio degli impulsi', t: `Il sistema 8 × 8 ha determinante (p² − m²)⁴, controllato esattamente in ${D.dispersion.length} punti. Sulla superficie di massa le soluzioni formano uno spazio reale di dimensione ${D.solution_space.massive_shell_real_dim} (due stati di spin, due segni dell’energia). Fuori non ce ne sono.` },
      mat: { h: 'Controllo indipendente', t: `Con matrici gamma 4 × 4 esplicite (numpy) mandiamo ψ in Ψ = ψu, con u = (1, 0, 0, 0). La moltiplicazione a destra per J agisce allora come i, e l’espressione qui sopra coincide con l’equazione di Dirac standard su ${M.trials} casi casuali (errore massimo ${M.worst_error.toExponential(0)}). Due versioni sbagliate, J con il segno sbagliato e senza J, falliscono di ${ctrl[0]} e ${ctrl[1]}.` },
      limits: 'Che cosa questo non mostra: soluzioni, somme sugli spin, nulla sulle antiparticelle oltre il segno dell’energia, né un campo di gauge. È una formulazione nota (l’algebra spazio-temporale di Hestenes). L’abbiamo ricostruita sulla regola dei bit e controllata. Niente qui sceglie un numero di generazioni.',
      tags: [['checked'], ['standard'], ['ours']]
    },
    t: {
      eyebrow: 'A CHE PUNTO È IL BILANCIO', title: 'Equazioni che possiamo disegnare e controllare',
      lede: 'Ogni riga è un’equazione la cui struttura è disegnata dalla regola dei bit e controllata da uno script. I disegni mostrano quali componenti entrano in quale equazione, con quale operazione. Non mostrano le soluzioni.',
      cols: ['equazione', 'dove', 'componenti', 'incidenze', 'stato'],
      rows: [
        ['∇F = J (Maxwell)', 'Prova 1; celle n = 2…7', `${MX4.F_components} in 4D`, `${MX4.incidences} in 4D`, ['checked']],
        ['Commutatori dei bivettori (so(p,q))', 'passo 1; n = 2…8', `${C.by_n['4'].bivectors} in 4D`, `${C.by_n['4'].edges} relazioni in 4D`, ['checked']],
        ['∇ψJ = mψγ₀ (Dirac)', 'passo 2; Cl(1,3)', `${D.counts.components}`, `${D.counts.incidences}`, ['checked', 'standard']],
        ['Accoppiamento: ∇F = eX e −eAψ', 'passo 3; n = 1…8 (forma carica da n = 3)', `${K4.psi_components} + ${K4.F_components} + 4 in 4D`, `${K4.incidences_total} + ${K4.maxwell_incidences} in 4D`, ['checked', 'standard']],
        ['Yang–Mills: D^μF_{μν} = J_ν, algebra di gauge so(m)', 'passo 4; m = 2…8', `${YM4.F_components} in 4D a m = 3`, `${YM4.equation_terms + YM4.bianchi_terms} in 4D a m = 3`, ['checked', 'standard']],
        ['Materia carica: Dirac + so(m), corrente j^a', 'passo 5; m = 2…8', `${MT3.components} in 4D a m = 3`, `${MT3.terms_total} in 4D a m = 3`, ['checked', 'standard']],
        ['Gravità I: R = dω + ¼[ω,ω], T = de + ωe', 'passo 6; n = 2…8', `${GV4.curvature_components} + ${GV4.torsion_components} in 4D`, `${GVC4} celle − ${GV4.first_bianchi_constraints} relazione in 4D`, ['checked', 'standard']],
        ['Gravità II: forma di Einstein E_a, F = R + c e∧e', 'passo 7; n = 3…8 (nessuna a n = 2)', `${GV4.einstein_components} in 4D`, `${GV4.einstein_terms_per_component} termini in ogni E_a in 4D`, ['checked', 'standard']],
        ['Specchi: x ↦ −a x a⁻¹, versori, Cartan–Dieudonné', 'passo 8; n = 2…8', `${MR4.corners} vertici in 4D`, `${MR4.rotors} rotori, ${MR4.reflections} riflessioni, al massimo ${MR4.max_mirrors} specchi in 4D`, ['checked', 'standard']],
        ['Un generatore in più e una coppia nulla: [B_an, B_bn] = −2s B_ab; ε, o', 'passo 9; n = 2…6 (coppia nulla n = 2…4)', `${PJ4.ladder_generators} generatori e ${PJ4.cga_dimension} lame in 4D`, `${PJ4.conformal_generators} generatori conformi in 4D`, ['checked', 'standard']],
        ['Dinamica del forque: Ṗ = F, Ḃ = I⁻¹[B×I[B]+F], Ṁ = −½MB', 'passo 10; PGA con d = 2 e 3 (mappa d’inerzia anche d = 4)', `${FQC.rows} equazioni di un solo articolo`, `${FQC.ok} tornano esattamente, ${FQC.note} dopo una correzione annotata, ${FQC.not_checked} non verificate`, ['checked', 'standard']],
        ['Spinori: pointor ψOψ̃ = ρO, le etichette dei b_j, ⊞ = Πw₊w₋ e il B + i della lezione', 'passo 11; da Cl(2,0) a Cl(7,0) e Cl(1,3); i tre tipi di i', `${SPC.rows} affermazioni di un articolo e di una lezione`, `${SPC.ok} tornano esattamente, ${SPC.note} dopo una correzione annotata, ${SPC.not_checked} non verificate`, ['checked', 'standard', 'ours']],
        ['Una rete di molle sul cubo: x″ = −Lx, semplice e con il segno del generatore', 'passo 12; n = 2…5 (serie a n = 3); i tre tipi di i come oscillatore, oscillatore invertito, moto libero', `${SRD.cube['3'].V} masse e ${SRD.cube['3'].E} molle in 3D, ${SRD.cube['4'].V} e ${SRD.cube['4'].E} in 4D`, `${SRD.summary.ok} affermazioni esatte in ${SRD.rows.length} righe, tutte valide; 2 livelli n ± √n contro n + 1`, ['checked', 'standard', 'ours']],
        ['Un corpo rigido: M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]), gravità, Hooke e smorzamento come rette', 'passo 13; n = 1…4 (conteggi fino a n = 5); segmento, quadrato, cubo, tesseratto, poi la trottola libera, la Luna e il Sole con cinque pianeti', `${PGD.frame_table['3'].vertices} vertici portano ${PGD.frame_table['3'].motor_coefficients} coefficienti del motore in 3D, ${PGD.frame_table['4'].vertices} e ${PGD.frame_table['4'].motor_coefficients} in 4D`, `${PGD.summary.ok} affermazioni in ${PGD.summary.rows} righe, tutte valide (righe di riferimento contro ganja.js); la velocità delle etichette è misurata, non dimostrata`, ['checked', 'standard', 'ours', 'open']]
      ],
      next: 'Ancora non disegnate: la chiralità e i doppietti elettrodeboli, l’equazione di Dirac su una tetrade curva, l’equazione di campo della gravità con la materia (l’accoppiamento e il suo segno), la forma neutra (reale) a n = 1 e 2, e le soluzioni di tutte queste equazioni.',
      note: '{N} righe, nessuna nuova. Maxwell, i commutatori dei bivettori e Dirac sono lineari ciascuno nel proprio campo; l’accoppiamento è bilineare (Aψ) e quadratico (ψγ₀ψ̃), e Yang–Mills aggiunge termini quadratici e cubici in A dal proprio commutatore, e la gravità moltiplica la curvatura (già quadratica in ω) per le tetradi, quindi i sistemi congiunti sono non lineari. La riga sugli specchi e quella sul generatore in più non sono equazioni ma gruppi di moti, quindi danno conteggi e nessun termine. Abbiamo disegnato dove stanno i termini e controllato identità, non soluzioni, tranne negli ultimi quattro passi, che controllano le equazioni del moto del corpo rigido di un altro gruppo, comprese soluzioni esatte in serie di potenze, un articolo e una lezione sugli spinori, dove le affermazioni sono identità esatte, una rete di molle sul cubo, con soluzioni esatte in serie di potenze, e un corpo rigido da un segmento a un tesseratto, dove un motore dal vivo è controllato contro soluzioni esatte in serie di potenze. Niente qui predice qualcosa.'
    },
    dl: { h: 'Verificalo tu', text: 'Due file Python. Il primo (solo libreria standard) ricostruisce le tabelle dei commutatori, le incidenze di Dirac, il determinante, le dimensioni sulla superficie di massa e l’identità di covarianza, esattamente. Il secondo (richiede numpy) confronta la forma di Dirac con le solite matrici gamma e fa girare due versioni sbagliate che devono fallire.', py: 'Scarica equations_selfcheck.py', py2: 'Scarica dirac_matrix_check.py', json: 'Scarica equations.json', cmd: 'python3 equations_selfcheck.py --compare equations.json   ·   python3 dirac_matrix_check.py' }
  }
};
// the number of tally rows is written out from the rows themselves, so it can never go stale
const NUM = { en: { 10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen' }, it: { 10: 'Dieci', 11: 'Undici', 12: 'Dodici', 13: 'Tredici', 14: 'Quattordici' } };
for (const l of ['en', 'it']) COPY[l].t.note = COPY[l].t.note.replace('{N}', NUM[l][COPY[l].t.rows.length]);
export default COPY;
