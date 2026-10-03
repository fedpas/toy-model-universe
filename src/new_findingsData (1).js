// Verified results of the explicit 16-dimensional Furey model (furey/run_all.py -> furey_results.json).
// Every number here is cross-checked against that JSON by test_findings.mjs.
export const REAL_BLOCKS = [2, 6, 4, 2, 1, 1];
export const COMPLEX_BLOCKS = [1, 3, 2, 1, 1];
export const BLOCK_NAMES = ['ℂ_𝕆', 'ℂ³_𝕆', 'ℂ²_ℍ', 'ℂ_ℂ', 'ℂ_last'];
export const BLOCK_COLORS = ['#61dff0', '#4fd18b', '#ffa06f', '#a78bfa', '#ffd166'];
export const NUMBERS = { realDiag: 62, realOff: 194, cxDiag: 16, cxOff: 48, deltaSM: 31, edgesTotal: 48, maxEdge: 12, generation: 16, replicas: 8, axes: 16, fanoLines: 7, quadruples: 18480, diagonalising: 616 };
// [a, b, capacityC, label or null (replica), replica label]
export const EDGES = [
  [1, 2, 12, 'Q_L (3,2,+1/6) 6ℂ + Q̄_L', 'sm'],
  [1, 3, 6, 'u_R 3ℂ', 'sm'],
  [1, 4, 6, 'd_R 3ℂ', 'sm'],
  [3, 2, 4, 'L 2ℂ', 'sm'],
  [3, 4, 2, 'e_R 1ℂ', 'sm'],
  [0, 4, 2, 'ν_R 1ℂ', 'sm'],
  [0, 1, 6, 'd_R-like 3ℂ', 'rep'],
  [0, 2, 4, 'L-like 2ℂ', 'rep'],
  [0, 3, 2, 'e_R-like 1ℂ', 'rep'],
  [2, 4, 4, 'L-like 2ℂ', 'rep']
];

const STATUS = {
  en: { verified: 'Verified by explicit construction', open: 'Open' },
  it: { verified: 'Verificato per costruzione esplicita', open: 'Aperto' }
};

export const FINDINGS_UI = {
  en: { eyebrow: 'OUR FINDINGS', title: 'What the explicit model settled', lede: 'We built Furey’s 16-dimensional space 𝕍 by hand (octonions by Cayley–Dickson, ω = L_{e₇}) and tested every claim numerically. Each card says what is established, what is not.', status: STATUS.en, repro: 'Reproduce: furey/run_all.py prints ALL FUREY CHECKS PASS and writes furey_results.json.', caption: { grid: 'Real 16×16 grid (left) and complex 8×8 grid (right). Diagonal blocks are coloured; everything else is an off-diagonal “edge”.', graph: 'The five complex blocks as nodes, the ten edges as lines. Gold = Standard Model content, dashed = replicas. Line width follows capacity 2nᵢnⱼ ℂ.', axes: '16 coordinate axes of 𝕍 (the Witt-torus eigenspaces), grouped by Peirce block.' } },
  it: { eyebrow: 'I NOSTRI RISULTATI', title: 'Cosa ha chiarito il modello esplicito', lede: 'Abbiamo costruito a mano lo spazio 16-dimensionale 𝕍 di Furey (ottonioni con Cayley–Dickson, ω = L_{e₇}) e verificato ogni affermazione numericamente. Ogni scheda dice cosa è stabilito e cosa no.', status: STATUS.it, repro: 'Riproduzione: furey/run_all.py stampa ALL FUREY CHECKS PASS e scrive furey_results.json.', caption: { grid: 'Griglia reale 16×16 (a sinistra) e complessa 8×8 (a destra). I blocchi diagonali sono colorati; il resto sono «lati» fuori diagonale.', graph: 'I cinque blocchi complessi come nodi, i dieci lati come linee. Oro = contenuto del Modello Standard, tratteggio = repliche. Lo spessore segue la capacità 2nᵢnⱼ ℂ.', axes: 'I 16 assi coordinati di 𝕍 (autospazi del toro di Witt), raggruppati per blocco di Peirce.' } }
};

// kind: grid | graph | axes | none
export const FINDINGS = [
  { id: 'blocks', status: 'verified', visual: 'grid',
    en: {
      'Young Learner': ['The filing grid is real', 'Imagine a giant checkerboard, 16 boxes by 16. Cut along the diagonal into squares of size 2, 6, 4, 2, 1 and 1. A special key (ω) glues the last two tiny squares into one, so the board becomes 8 by 8 with squares 1, 3, 2, 1 and 1. We built it and counted: it works exactly.'],
      Physicist: ['Peirce blocks, built and counted', 'On 𝕍 = e_i𝕆 ⊕ e₅ℍ ⊕ e₆ℂ ⊕ e₇ℝ ⊕ ℝ the projectors P_{𝕆₁,𝕆₂} = ½(I ∓ L_{e₇}R_{e₇}), P_ℍ, P_ℂ, P_ℝ give real blocks (2,6,4,2,1,1): diagonal 62, off-diagonal 194. The complex structure ω = L_{e₇} commutes with them and swaps the last two real blocks, which fuses them into one ℂ: complex blocks (1,3,2,1,1), diagonal 16, off-diagonal 48ℂ. Δ_SM = ℂ⊕M₃(ℂ)⊕M₂(ℂ)⊕ℂ⊕ℝ has real dimension 31, and Tr_ℂ Y = 3 over dimension 8.'],
      Mathematician: ['Peirce decomposition of End_ℝ(𝕍) and End_ℂ(𝕍)', 'With (L_{e₇}R_{e₇})² = +1 the projectors are orthogonal idempotents summing to I. Real ranks (2,6,4,2,1,1): Σn² = 62, 256 − 62 = 194. ω = L_{e₇} commutes with all of them and exchanges the two rank-1 blocks (1′ ↔ k′), so End_ℂ(𝕍) ≅ M₈(ℂ) carries ranks (1,3,2,1,1): Σn² = 16, 64 − 16 = 48ℂ. The fusion is derived, not read off a figure. Centralizer dimensions (32, 20, 8, 2, 1) are recorded in the JSON.']
    },
    it: {
      'Young Learner': ['La griglia dell’archivio è reale', 'Immagina una scacchiera gigante di 16 per 16. Tagliala lungo la diagonale in quadrati di lato 2, 6, 4, 2, 1 e 1. Una chiave speciale (ω) incolla gli ultimi due quadratini in uno, e la scacchiera diventa 8 per 8 con quadrati 1, 3, 2, 1 e 1. L’abbiamo costruita e contata: funziona esattamente.'],
      Physicist: ['Blocchi di Peirce, costruiti e contati', 'Su 𝕍 = e_i𝕆 ⊕ e₅ℍ ⊕ e₆ℂ ⊕ e₇ℝ ⊕ ℝ i proiettori P_{𝕆₁,𝕆₂} = ½(I ∓ L_{e₇}R_{e₇}), P_ℍ, P_ℂ, P_ℝ danno blocchi reali (2,6,4,2,1,1): diagonale 62, fuori diagonale 194. La struttura complessa ω = L_{e₇} commuta con essi e scambia gli ultimi due blocchi reali, fondendoli in un ℂ: blocchi complessi (1,3,2,1,1), diagonale 16, fuori diagonale 48ℂ. Δ_SM = ℂ⊕M₃(ℂ)⊕M₂(ℂ)⊕ℂ⊕ℝ ha dimensione reale 31 e Tr_ℂ Y = 3 su dimensione 8.'],
      Mathematician: ['Decomposizione di Peirce di End_ℝ(𝕍) e End_ℂ(𝕍)', 'Con (L_{e₇}R_{e₇})² = +1 i proiettori sono idempotenti ortogonali con somma I. Ranghi reali (2,6,4,2,1,1): Σn² = 62, 256 − 62 = 194. ω = L_{e₇} commuta con tutti e scambia i due blocchi di rango 1 (1′ ↔ k′), quindi End_ℂ(𝕍) ≅ M₈(ℂ) ha ranghi (1,3,2,1,1): Σn² = 16, 64 − 16 = 48ℂ. La fusione è derivata, non letta da una figura. Le dimensioni dei centralizzanti (32, 20, 8, 2, 1) sono nel JSON.']
    } },
  { id: 'edges', status: 'verified', visual: 'graph',
    en: {
      'Young Learner': ['One family of particles fits, with spares', 'The ten bridges between the squares carry 48 “slots”. Counting one way only, 24 slots. Six bridges hold exactly one full family of 16 particles: the quarks, the electron and its neutrino. The other four bridges hold 8 spare slots shaped like copies. The biggest bridge, 12 slots, holds one kind of quark plus its mirror-image antiparticle.'],
      Physicist: ['Edge content under the commutator action', 'With Y_phys = y_target − y_source, six edges give exactly one Standard Model generation (16ℂ): Q_L (3,2,+1/6) 6, u_R (3,1,+2/3) 3, d_R (3,1,−1/3) 3, L (1,2,−1/2) 2, e_R (1,1,−1) 1, ν_R (1,1,0) 1. Four edges give replicas, 8ℂ: d_R-like 3, L-like 2, e_R-like 1, L-like 2. The opposite direction of each edge is the conjugate. The 12ℂ edge ℂ³_𝕆↔ℂ²_ℍ is therefore Q_L ⊕ Q̄_L, one generation as particle plus antiparticle.'],
      Mathematician: ['Capacities 2nᵢnⱼ and their SU(3)×SU(2)×U(1) content', 'Σ_{i<j} 2nᵢnⱼ = 48 over ten edges, maximum 2·3·2 = 12. Under the commutator action only differences yᵢ − yⱼ of hypercharge matter. The ordered half (24ℂ) splits as 16ℂ matching one SM generation on six edges and 8ℂ of non-matching replicas on four. Hom_ij and Hom_ji are conjugate, which accounts for the factor 2 in the capacity. Whether the replicas are physical is a question for the model, not for the counting.']
    },
    it: {
      'Young Learner': ['Una famiglia di particelle ci sta, con dei posti di scorta', 'I dieci ponti tra i quadrati portano 48 «posti». Contando una sola direzione, 24 posti. Sei ponti contengono esattamente una famiglia completa di 16 particelle: i quark, l’elettrone e il suo neutrino. Gli altri quattro ponti hanno 8 posti di scorta a forma di copie. Il ponte più grande, 12 posti, contiene un tipo di quark più la sua antiparticella speculare.'],
      Physicist: ['Contenuto dei lati con l’azione per commutatore', 'Con Y_fis = y_arrivo − y_partenza, sei lati danno esattamente una generazione del Modello Standard (16ℂ): Q_L (3,2,+1/6) 6, u_R (3,1,+2/3) 3, d_R (3,1,−1/3) 3, L (1,2,−1/2) 2, e_R (1,1,−1) 1, ν_R (1,1,0) 1. Quattro lati danno repliche, 8ℂ: simili a d_R 3, a L 2, a e_R 1, a L 2. La direzione opposta di ogni lato è il coniugato. Il lato da 12ℂ ℂ³_𝕆↔ℂ²_ℍ è quindi Q_L ⊕ Q̄_L, una generazione come particella più antiparticella.'],
      Mathematician: ['Capacità 2nᵢnⱼ e contenuto SU(3)×SU(2)×U(1)', 'Σ_{i<j} 2nᵢnⱼ = 48 su dieci lati, massimo 2·3·2 = 12. Con l’azione per commutatore contano solo le differenze yᵢ − yⱼ di ipercarica. La metà ordinata (24ℂ) si divide in 16ℂ che corrispondono a una generazione SM su sei lati e 8ℂ di repliche non corrispondenti su quattro. Hom_ij e Hom_ji sono coniugati, e spiegano il fattore 2 nella capacità. Se le repliche siano fisiche è una domanda per il modello, non per il conteggio.']
    } },
  { id: 'witt', status: 'verified', visual: 'axes',
    en: {
      'Young Learner': ['The hidden coordinates', 'There are 16 hidden directions in the big space, like 16 lanes on a road. The squares of the checkerboard are just groups of lanes. The grouping is part of the recipe from Cayley–Dickson; the lanes alone do not force it.'],
      Physicist: ['The Witt torus and the block partition', 'The seven Fano-line blades g_ag_bg_cg₈ are commuting involutions, diagonal in the standard basis; their 16 joint eigenspaces are the coordinate axes of 𝕍. Every block projector is a sum of these axes (blade grades 0, 4, 8), and ω is a single grade-6 blade. The Cayley–Dickson flag is a nested affine flag in the axis labels, but the 6-block is not affine. Of 18480 independent commuting grade-4 quadruples, 616 diagonalize all block projectors: the partition is input, not forced by Witt pairing.'],
      Mathematician: ['The partition is Cayley–Dickson input', 'The seven Fano-line blades commute, square to +1, and are diagonal in the standard basis, so they define 16 joint eigenlines. Block projectors have blade support in grades {0,4,8}; ω is one grade-6 blade. The nested Cayley–Dickson subspaces ℝ ⊂ ℂ ⊂ ℍ ⊂ 𝕆 are affine subspaces of the label group (ℤ₂)⁴, while the rank-6 block is not. Counting commuting independent grade-4 quadruples gives 18480, of which 616 diagonalize every projector.']
    },
    it: {
      'Young Learner': ['Le coordinate nascoste', 'Nello spazio grande ci sono 16 direzioni nascoste, come 16 corsie di una strada. I quadrati della scacchiera sono solo gruppi di corsie. Il raggruppamento fa parte della ricetta di Cayley–Dickson; le corsie da sole non lo impongono.'],
      Physicist: ['Il toro di Witt e la partizione in blocchi', 'Le sette lame di Fano g_ag_bg_cg₈ sono involuzioni commutanti, diagonali nella base standard; i loro 16 autospazi congiunti sono gli assi coordinati di 𝕍. Ogni proiettore di blocco è somma di questi assi (gradi delle lame 0, 4, 8) e ω è una singola lama di grado 6. La bandiera di Cayley–Dickson è una bandiera affine annidata nelle etichette degli assi, ma il blocco da 6 non è affine. Su 18480 quadruple indipendenti commutanti di grado 4, 616 diagonalizzano tutti i proiettori: la partizione è input, non imposta dall’accoppiamento di Witt.'],
      Mathematician: ['La partizione è input di Cayley–Dickson', 'Le sette lame delle rette di Fano commutano, hanno quadrato +1 e sono diagonali nella base standard, quindi definiscono 16 rette congiunte. I proiettori di blocco hanno supporto in gradi {0,4,8}; ω è una lama di grado 6. I sottospazi annidati ℝ ⊂ ℂ ⊂ ℍ ⊂ 𝕆 sono sottospazi affini del gruppo delle etichette (ℤ₂)⁴, mentre il blocco di rango 6 non lo è. Le quadruple commutanti indipendenti di grado 4 sono 18480, di cui 616 diagonalizzano ogni proiettore.']
    } },
  { id: 'z2', status: 'open', visual: 'none',
    en: {
      'Young Learner': ['A mirror trick we could not match', 'Flipping left to right (L → −R) changes the special key ω, but only on the two single-box squares. The matching trick inside the hidden lanes flips eight lanes at once, so the two tricks do not line up. We call it open.'],
      Physicist: ['The Z₂ parallel stays open', 'ω′ = −R_{e₇} equals ω·D with D = −1 on exactly four axes {0,3,8,11}, i.e. on the two singlet blocks only. A Witt-torus generator has eight −1 signs, so D is not one. The Z₂ gauge parallel is therefore not established.'],
      Mathematician: ['ω′ = ω·D is not a torus element', 'D = diag(−1 on four axes) is a diagonal involution with four −1 signs, not a Fano-line blade (which has eight −1 signs). Hence no single torus generator relates ω and ω′. Open.']
    },
    it: {
      'Young Learner': ['Un trucco dello specchio che non combacia', 'Scambiare sinistra e destra (L → −R) cambia la chiave speciale ω, ma solo nei due quadrati da una casella. Il trucco corrispondente tra le corsie nascoste ne ribalta otto insieme, quindi i due trucchi non coincidono. Lo chiamiamo aperto.'],
      Physicist: ['Il parallelo Z₂ resta aperto', 'ω′ = −R_{e₇} è uguale a ω·D con D = −1 su esattamente quattro assi {0,3,8,11}, cioè solo sui due blocchi singoletto. Un generatore del toro di Witt ha otto segni −1, quindi D non lo è. Il parallelo di gauge Z₂ non è dunque stabilito.'],
      Mathematician: ['ω′ = ω·D non è un elemento del toro', 'D = diag(−1 su quattro assi) è un’involuzione diagonale con quattro segni −1, non una lama di Fano (che ha otto segni −1). Quindi nessun singolo generatore del toro lega ω e ω′. Aperto.']
    } },
  { id: 'open', status: 'open', visual: 'none',
    en: {
      'Young Learner': ['What we still do not know', 'Where the heaviest quark lives on the map is not settled. Why the number 210 shows up is not settled. And we do not yet know whether the spare slots on the four extra bridges are real particles or just room in the filing system. These are the next puzzles.'],
      Physicist: ['Open questions', 'The cell of the top quark (placed at [7,±1], [4,+4] and [3,+1] by different analyses, none derived); the origin of 210; odd primes and continuous parameters, which the lattice does not supply; whether the 8ℂ of replica edges are physical; and Furey’s Fig. 1, which lacks (t,b)_L. The 3/8 is a computation (Tr_ℂ Y = 3 over dimension 8), its role is the open part.'],
      Mathematician: ['Open questions', 'Placement of the top-quark cell; the number 210; odd primes and continuous parameters (cell sizes are powers of 2); the status of the four replica edges (8ℂ); the Z₂ parallel above; and the (t,b)_L gap in Furey’s Fig. 1. The value 3/8 = Tr_ℂ Y / dim_ℂ 𝕍 is computed.']
    },
    it: {
      'Young Learner': ['Cosa non sappiamo ancora', 'Dove viva sulla mappa il quark più pesante non è stabilito. Perché compaia il numero 210 non è stabilito. E non sappiamo ancora se i posti di scorta sui quattro ponti extra siano particelle vere o solo spazio nel sistema di archivio. Sono i prossimi enigmi.'],
      Physicist: ['Questioni aperte', 'La cella del quark top (collocata in [7,±1], [4,+4] e [3,+1] da analisi diverse, nessuna derivata); l’origine di 210; primi dispari e parametri continui, che il reticolo non fornisce; se gli 8ℂ dei lati di replica siano fisici; e la Fig. 1 di Furey, che manca di (t,b)_L. Il 3/8 è un calcolo (Tr_ℂ Y = 3 su dimensione 8): è il suo ruolo la parte aperta.'],
      Mathematician: ['Questioni aperte', 'Collocazione della cella del quark top; il numero 210; primi dispari e parametri continui (le dimensioni delle celle sono potenze di 2); lo statuto dei quattro lati di replica (8ℂ); il parallelo Z₂ qui sopra; e la lacuna (t,b)_L nella Fig. 1 di Furey. Il valore 3/8 = Tr_ℂ Y / dim_ℂ 𝕍 è calcolato.']
    } }
];
