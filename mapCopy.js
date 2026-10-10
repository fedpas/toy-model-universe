import FQD from './forqueData.js';
import SPD from './spinData.js';
import SRD from './springData.js';
import PGD from './pgadynData.js';
import { BENCH_FACTS as BF } from './rigidCopy.js';
import { STEP_GROUPS, stepCount, numWord, capital } from './steps.js';
import { PAGES } from './storyCopy.js';
import { SCRIPTS } from './mapData.js';

// Copy for the Map page (English and Italian). The counts are read from the same data files as the pages they describe.
const FC = FQD.fq.counts, SC = SPD.spm.counts, SR = SRD.summary, PG = PGD.summary, x1 = v => v.toFixed(1), SPC = SPD.sp.summary, nEq = stepCount('eq'), nSh = stepCount('shapes');
export const CREDIT_URL = 'https://www.anthropic.com';

// node text: [title, what is established]
export const NODES = {
  en: {
    rule: ['The rule and the three axioms', 'A null seed (n² = 0), B polarization (a conjugate pair gives +1 and −1, Cl(1,1) = M₂(ℝ)), C finite budget (n bits, 2ⁿ blades, Cl(k,k,r)). A blade is a bit pattern and the product is XOR with a sign. Time squares +1, space squares −1.'],
    atlas: ['The atlas', '25 cells Cl(p,q) at lattice address [p+q, p−q], each with an audit status; the 8-fold classification; four views of one cell (Clifford, Simplex, Cube, Prime). Prime and base-10 labels are notation only.'],
    maxwell: ['Test 1: Maxwell', '∇F = J on every split with k, d ≤ 4 and k + d ≤ 7; n·C(n,2) incidences (2, 9, 24, 50, 90, 147); the mirror reading Cl(q,p) gives the same system; the time ladder Cl(k,1) with period 8 to k = 11.'],
    furey: ['Test 2: Furey', 'Peirce blocks of M₁₆(ℝ) with ranks (2, 6, 4, 2, 1, 1); six edges hold one Standard Model generation (16ℂ); an exhaustive search over 5582 blocks never gives three generations.'],
    dictionary: ['The dictionary', 'The Cl(0,8) bit rule against the standard model labels: what maps to what, as exact tables.'],
    threegen: ['Three generations?', 'Where a 3 appears in the counts and why none of them is a derivation.'],
    findings: ['Findings on Furey’s construction', 'The Witt torus and the Z₂ parallel carry no 3; the (t,b)_L gap in her figure stays open.'],
    shapes: ['More shapes', 'The same cube seen inside out, from its even half, and as a root series.'],
    orth: ['The orthoplex', 'The cube turned inside out; the Fock-space reading; n = 4: 24 quaternions are three 16-cells (Q₈ has index 3); n = 8: 112 + 128 = 240 roots of E8.'],
    demi: ['The demicube', 'Even blades: 2ⁿ⁻¹ vertices; Cl⁰(p,q) = Cl(p,q−1); in Maxwell F is even and ∇F = J maps even to odd.'],
    gosset: ['The Gosset series', 'det(E_n) = 9 − n; the series stops at E8; the stop resembles our budget of 8 but the mechanisms are unrelated.'],
    equations: ['More equations', 'Equations drawn from the bit rule and checked; none new and none predicting anything.'],
    comm: ['1 · Commutators', 'Two bivectors anticommute exactly when they share one index; the commutator is ±2 times the bivector on the symmetric difference; so(p,q); the Lorentz algebra from boosts and rotations.'],
    dirac: ['2 · Dirac', 'ψ even in Cl(1,3), 8 components = the 8 corners of the demicube; ∇ψJ = mψγ₀; determinant (p² − m²)⁴; 40 incidences.'],
    coupling: ['3 · Maxwell meets Dirac', 'The current ψγ₀ψ̃ sources ∇F = eX; the complex structure J exists from n = 3 (counts 0, 0, 1, 3, 6); (2n+1)·2ⁿ⁻¹ terms.'],
    ym: ['4 · Yang–Mills', 'Gauge algebra = the bivectors of Cl(0,m); Bianchi, covariance and conservation exact; m = 2 is Maxwell.'],
    matter: ['5 · Charged matter', 'Ψ = ΣΨ_{S,T}; the bivectors act by left multiplication on the internal blade; the current j^a is conserved on shell.'],
    grav: ['6–7 · Gravity I and II', 'R = dω + ¼[ω,ω], T = de + ωe, Bianchi, the Einstein form; one extra generator gives so(1,n) or so(2,n−1).'],
    mirrors: ['8 · Mirrors', 'Versors, Cartan–Dieudonné (at most n mirrors), the cube as a group of mirrors, the E8 roots permuted by their mirrors.'],
    projective: ['9 · One more generator, and a null pair', '[B_an, B_bn] = −2s·B_ab; Euclid/elliptic/hyperbolic and Poincaré/de Sitter/anti-de Sitter; the null pair ε, o; PGA inside CGA.'],
    forque: ['10 · The Forque', `Dorst and De Keninck: Ṁ = −½MB, P = I[B], Ṗ = F. ${FC.rows} rows: ${FC.ok} agree, ${FC.note} after a noted correction, ${FC.not_checked} not checked; the tennis-racket rate; space squares −1 flip the sign of the energy (uninterpreted).`],
    spin: ['11 · Pointors and the three kinds of i', `Roelfs–Eelbode–De Keninck and Eelbode: labels, master idempotent, pointors; ${SC.rows} rows (${SC.ok}, ${SC.note}, ${SC.not_checked}). Four kinds of i. Our readings: ⊞ identification, left/right/conjugation label, self-dual code, XOR 9 chirality.`],
    spring: ['12 · A spring on the cube', `Masses on vertices, springs on edges, closure on faces; ω² = 2j with multiplicity C(n,j); an oscillator is a rotor, and the three kinds of i are oscillator, inverted oscillator and free motion; the Clifford-signed network has flux π per face and two levels n ± √n; the labels of step 11 are the Walsh modes. ${SR.ok} exact claims.`],
    rigid: ['13 · A rigid body, from a segment to a tesseract', `Dorst and De Keninck’s M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]) on the bit rule, climbed from a segment through the square and the cube with its own corner labels to a hung body, the frame table, a free top and orbits (the Moon, the Sun and five planets). ${PG.rows} rows, ${PG.ok} exact claims, and a floating-point engine checked against them. Timed on one machine: a frame of n + 1 sandwiches beats 2ⁿ from n = 3 (${x1(BF.frame[3])}× at n = 4, ${x1(BF.frame[5])}× at n = 6); the mirrored half and the sign-bit contact test gain almost nothing once building is counted.`],
    tally: ['Tally', 'One row per equation family, with what is drawn and what is not.'],
    map: ['The map', 'This page: the status, the tree, the researchers’ table, the next steps and who made this. Its counts are read from the data files of the pages they describe.'],
    ask: ['Ask', 'A reasoning core on the three axioms; every answer states how sure it is and says “open” when nobody knows.'],
    next: ['Next: dynamics on the cube', 'Three planned branches, in order. None is a result yet.'],
    next_network: ['A spring network with vector displacements', 'Step 13 treats the cube as one rigid body. What remains is the network of step 12 with every vertex free to move in n directions. The zero modes of its stiffness matrix should be the rigid motions (6 = C(4,2) bivectors of the PGA at n = 3). By Maxwell’s counting (standard) an edge-only cube has 12 bars where 18 are needed, so at least 6 internal mechanisms should appear on top of them, and a braced cube should lose them. To check on our matrix; not done.'],
    next_action: ['An action principle on the cube', 'Start with L = ½|ẋ|² − ½xᵀLx, then put energy on faces (lattice Maxwell: an edge field A with F = dA), then use the signed edge for Dirac. This is the route to the open items on the sign and size of the source terms.'],
    next_read: ['Read before relying', 'Doran and Lasenby (action, rotor mechanics), Roelfs and De Keninck (exponentials in any signature), the lecture video itself, then Lasenby, Todd, Holmer and Mann for conformal dynamics and the visual language.'],
  },
  it: {
    rule: ['La regola e i tre assiomi', 'A seme nullo (n² = 0), B polarizzazione (una coppia coniugata dà +1 e −1, Cl(1,1) = M₂(ℝ)), C budget finito (n bit, 2ⁿ lame, Cl(k,k,r)). Una lama è uno schema di bit e il prodotto è lo XOR con un segno. Il tempo ha quadrato +1, lo spazio −1.'],
    atlas: ['L’atlante', '25 celle Cl(p,q) all’indirizzo [p+q, p−q], ciascuna con uno stato di audit; la classificazione a 8 periodi; quattro viste di una cella (Clifford, Simplesso, Cubo, Primi). Le etichette in primi e in base 10 sono solo notazione.'],
    maxwell: ['Prova 1: Maxwell', '∇F = J su ogni suddivisione con k, d ≤ 4 e k + d ≤ 7; n·C(n,2) incidenze (2, 9, 24, 50, 90, 147); la lettura speculare Cl(q,p) dà lo stesso sistema; la scala temporale Cl(k,1) con periodo 8 fino a k = 11.'],
    furey: ['Prova 2: Furey', 'Blocchi di Peirce di M₁₆(ℝ) con ranghi (2, 6, 4, 2, 1, 1); sei spigoli contengono una generazione del Modello Standard (16ℂ); una ricerca esaustiva su 5582 blocchi non dà mai tre generazioni.'],
    dictionary: ['Il dizionario', 'La regola dei bit di Cl(0,8) contro le etichette del modello standard: che cosa corrisponde a che cosa, in tabelle esatte.'],
    threegen: ['Tre generazioni?', 'Dove compare un 3 nei conteggi e perché nessuno di essi è una derivazione.'],
    findings: ['Risultati sulla costruzione di Furey', 'Il toro di Witt e il parallelo Z₂ non portano alcun 3; la lacuna (t,b)_L nella sua figura resta aperta.'],
    shapes: ['Altre forme', 'Lo stesso cubo visto al rovescio, dalla sua metà pari e come serie di radici.'],
    orth: ['L’ortoplesso', 'Il cubo rovesciato; la lettura nello spazio di Fock; n = 4: 24 quaternioni sono tre 16-celle (Q₈ ha indice 3); n = 8: 112 + 128 = 240 radici di E8.'],
    demi: ['Il demicubo', 'Lame pari: 2ⁿ⁻¹ vertici; Cl⁰(p,q) = Cl(p,q−1); in Maxwell F è pari e ∇F = J manda il pari nel dispari.'],
    gosset: ['La serie di Gosset', 'det(E_n) = 9 − n; la serie si ferma a E8; la fermata somiglia al nostro budget di 8 ma i meccanismi non c’entrano.'],
    equations: ['Altre equazioni', 'Equazioni disegnate dalla regola dei bit e controllate; nessuna nuova e nessuna che predica qualcosa.'],
    comm: ['1 · Commutatori', 'Due bivettori anticommutano esattamente quando condividono un indice; il commutatore è ±2 volte il bivettore sulla differenza simmetrica; so(p,q); l’algebra di Lorentz da boost e rotazioni.'],
    dirac: ['2 · Dirac', 'ψ pari in Cl(1,3), 8 componenti = gli 8 angoli del demicubo; ∇ψJ = mψγ₀; determinante (p² − m²)⁴; 40 incidenze.'],
    coupling: ['3 · Maxwell incontra Dirac', 'La corrente ψγ₀ψ̃ è la sorgente di ∇F = eX; la struttura complessa J esiste da n = 3 (conteggi 0, 0, 1, 3, 6); (2n+1)·2ⁿ⁻¹ termini.'],
    ym: ['4 · Yang–Mills', 'Algebra di gauge = i bivettori di Cl(0,m); Bianchi, covarianza e conservazione esatte; m = 2 è Maxwell.'],
    matter: ['5 · Materia carica', 'Ψ = ΣΨ_{S,T}; i bivettori agiscono per moltiplicazione a sinistra sulla lama interna; la corrente j^a si conserva sulla superficie di massa.'],
    grav: ['6–7 · Gravità I e II', 'R = dω + ¼[ω,ω], T = de + ωe, Bianchi, la forma di Einstein; un generatore in più dà so(1,n) o so(2,n−1).'],
    mirrors: ['8 · Specchi', 'Versori, Cartan–Dieudonné (al più n specchi), il cubo come gruppo di specchi, le radici di E8 permutate dai loro specchi.'],
    projective: ['9 · Un generatore in più, e una coppia nulla', '[B_an, B_bn] = −2s·B_ab; euclideo/ellittico/iperbolico e Poincaré/de Sitter/anti-de Sitter; la coppia nulla ε, o; PGA dentro CGA.'],
    forque: ['10 · Il forque', `Dorst e De Keninck: Ṁ = −½MB, P = I[B], Ṗ = F. ${FC.rows} righe: ${FC.ok} tornano, ${FC.note} dopo una correzione annotata, ${FC.not_checked} non verificate; il tasso della racchetta da tennis; i quadrati spaziali −1 invertono il segno dell’energia (non interpretato).`],
    spin: ['11 · Pointor e i tre tipi di i', `Roelfs–Eelbode–De Keninck ed Eelbode: etichette, idempotente maestro, pointor; ${SC.rows} righe (${SC.ok}, ${SC.note}, ${SC.not_checked}). Quattro tipi di i. Nostre letture: l’identificazione di ⊞, l’etichetta sinistra/destra/coniugazione, il codice autoduale, la chiralità XOR 9.`],
    spring: ['12 · Una molla sul cubo', `Masse sui vertici, molle sugli spigoli, chiusura sulle facce; ω² = 2j con molteplicità C(n,j); un oscillatore è un rotore e i tre tipi di i sono oscillatore, oscillatore invertito e moto libero; la rete di Clifford con segni ha flusso π per faccia e due livelli n ± √n; le etichette del passo 11 sono i modi di Walsh. ${SR.ok} affermazioni esatte.`],
    rigid: ['13 · Un corpo rigido, dal segmento al tesseratto', `M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]) di Dorst e De Keninck sulla regola dei bit, scalato da un segmento al quadrato e al cubo con le proprie etichette degli angoli, fino a un corpo appeso, la tabella dei riferimenti, una trottola libera e le orbite (la Luna, il Sole e cinque pianeti). ${PG.rows} righe, ${PG.ok} affermazioni esatte e un motore in virgola mobile controllato contro di esse. Misurato su una macchina: un riferimento di n + 1 sandwich batte 2ⁿ da n = 3 (${x1(BF.frame[3]).replace('.', ',')}× a n = 4, ${x1(BF.frame[5]).replace('.', ',')}× a n = 6); la metà speculare e il test di contatto con i bit di segno non guadagnano quasi nulla una volta contata la costruzione.`],
    tally: ['Bilancio', 'Una riga per ogni famiglia di equazioni, con ciò che è disegnato e ciò che no.'],
    map: ['La mappa', 'Questa pagina: lo stato, l’albero, la tabella dei ricercatori, i passi successivi e chi ha fatto tutto questo. I suoi conteggi sono letti dai file di dati delle pagine che descrive.'],
    ask: ['Chiedi', 'Un nucleo di ragionamento sui tre assiomi; ogni risposta dichiara quanto è sicura e dice “aperto” quando nessuno lo sa.'],
    next: ['Avanti: la dinamica sul cubo', 'Tre rami previsti, in ordine. Nessuno è ancora un risultato.'],
    next_network: ['Una rete di molle con spostamenti vettoriali', 'Il passo 13 tratta il cubo come un solo corpo rigido. Resta la rete del passo 12 con ogni vertice libero di muoversi in n direzioni. I modi nulli della sua matrice di rigidità dovrebbero essere i moti rigidi (6 = C(4,2) bivettori della PGA a n = 3). Per il conteggio di Maxwell (standard) un cubo di soli spigoli ha 12 aste dove ne servono 18, quindi dovrebbero comparire almeno 6 meccanismi interni oltre ad essi, e un cubo irrigidito dovrebbe perderli. Da controllare sulla nostra matrice; non fatto.'],
    next_action: ['Un principio d’azione sul cubo', 'Si parte da L = ½|ẋ|² − ½xᵀLx, poi si mette energia sulle facce (Maxwell sul reticolo: un campo A sugli spigoli con F = dA), poi si usa lo spigolo con segno per Dirac. È la strada verso i punti aperti sul segno e la grandezza dei termini sorgente.'],
    next_read: ['Leggere prima di fidarsi', 'Doran e Lasenby (azione, meccanica dei rotori), Roelfs e De Keninck (esponenziali in qualsiasi segnatura), il video della lezione stesso, poi Lasenby, Todd, Holmer e Mann per la dinamica conforme e il linguaggio visivo.'],
  },
};

export const LENS_NAMES = {
  en: { clifford: 'Clifford algebra', cube: 'Cube graph', simplex: 'Simplex faces', mirror: 'Mirrors', spinor: 'Spinors', null: 'Null / projective', flow: 'Dynamics' },
  it: { clifford: 'Algebra di Clifford', cube: 'Grafo del cubo', simplex: 'Facce del simplesso', mirror: 'Specchi', spinor: 'Spinori', null: 'Nullo / proiettivo', flow: 'Dinamica' },
};
export const THREAD_NAMES = {
  en: { cube: 'The cube as graph', mirror: 'Mirrors everywhere', i: 'Kinds of i', eight: 'The budget of 8', three: 'The number 3', spring: 'Springs and motion' },
  it: { cube: 'Il cubo come grafo', mirror: 'Specchi ovunque', i: 'Tipi di i', eight: 'Il budget di 8', three: 'Il numero 3', spring: 'Molle e moto' },
};
export const THREAD_TEXT = {
  en: {
    cube: 'The cube as graph: blades are vertices, a generator is an edge, a bivector plane is a face, and an anticommuting pair gives the sign −1 around the face. It carries the Maxwell incidences, the Dirac edges, the commutator graph, the demicube and the orthoplex, and now the spring network.',
    mirror: 'Mirrors everywhere: reflections generate rotors and motors; Cartan–Dieudonné bounds them by n; the cube and the E8 roots are mirror groups; the Forque and the pointors are built from reflections. The squared frequency of a mode is twice the number of mirrors in its label.',
    i: 'Kinds of i: the Cl(0,1) mirror unit, the bivector unit of the even part, the odd carrier plane, and the central pseudoscalar of odd dimension. Squares −1, +1, 0 give rotation, boost, translation, and now oscillator, inverted oscillator, free motion. The complex structure J of the coupling and Furey’s ω belong here too.',
    eight: 'The budget of 8: n bits, the period 8 of the classification, Cl(0,8) = M₁₆(ℝ), and the stop of the Gosset series at E8. The mechanisms are different; period 8 repeats cells and is never a wall.',
    three: 'The number 3: quaternion index 3, the three 16-cells at n = 4, the branching E8 ⊃ E6 × A2, the binomial 3s in the spring spectrum. All are coincidences of counting. Three generations are not derived, and an exhaustive search in Furey’s setting never gives three.',
    spring: 'Springs and motion: the first place where equations are solved and not only drawn. An oscillator is a rotor flow, a network of them has the cube’s Walsh modes, a rigid body from the segment to the tesseract follows (step 13), and the next steps (vector displacements, action, lattice Maxwell) all start here.',
  },
  it: {
    cube: 'Il cubo come grafo: le lame sono vertici, un generatore è uno spigolo, un piano di bivettore è una faccia, e una coppia che anticommuta dà il segno −1 attorno alla faccia. Porta le incidenze di Maxwell, gli spigoli di Dirac, il grafo dei commutatori, il demicubo e l’ortoplesso, e ora la rete di molle.',
    mirror: 'Specchi ovunque: le riflessioni generano rotori e motori; Cartan–Dieudonné li limita a n; il cubo e le radici di E8 sono gruppi di specchi; il forque e i pointor sono costruiti da riflessioni. La frequenza al quadrato di un modo è il doppio del numero di specchi nella sua etichetta.',
    i: 'Tipi di i: l’unità-specchio di Cl(0,1), l’unità bivettoriale della parte pari, il piano portante dispari e lo pseudoscalare centrale di dimensione dispari. I quadrati −1, +1, 0 danno rotazione, boost, traslazione, e ora oscillatore, oscillatore invertito, moto libero. Anche la struttura complessa J dell’accoppiamento e l’ω di Furey stanno qui.',
    eight: 'Il budget di 8: n bit, il periodo 8 della classificazione, Cl(0,8) = M₁₆(ℝ) e la fermata della serie di Gosset a E8. I meccanismi sono diversi; il periodo 8 ripete le celle e non è mai un muro.',
    three: 'Il numero 3: indice 3 dei quaternioni, le tre 16-celle a n = 4, la ramificazione E8 ⊃ E6 × A2, i 3 binomiali nello spettro delle molle. Sono tutte coincidenze di conteggio. Le tre generazioni non sono derivate, e una ricerca esaustiva nell’impostazione di Furey non ne dà mai tre.',
    spring: 'Molle e moto: il primo luogo in cui le equazioni vengono risolte e non solo disegnate. Un oscillatore è il flusso di un rotore, una rete di oscillatori ha i modi di Walsh del cubo, un corpo rigido dal segmento al tesseratto viene dopo (passo 13), e i passi successivi (spostamenti vettoriali, azione, Maxwell sul reticolo) partono tutti da qui.',
  },
};

// the researchers’ table
export const RESEARCH_TEXT = {
  en: {
    head: { h: 'What we can take from other researchers to do dynamics', lede: 'The question is which ideas turn a static algebra into equations of motion, and whether we can derive them on the bit rule instead of importing them. “Read” means we worked through the source; “slides only” means we saw the lecture slides but not the video; “not read” means the idea comes from a list or from memory and has to be checked against the source before we rely on it.', cols: ['Source', 'Idea to take', 'How it connects to what we have', 'Reading'], readLbl: { read: 'read', slides: 'slides only', standard: 'standard', not: 'not read' } },
    rows: {
      forque: ['Dorst and De Keninck, “May the Forque Be with You”', 'Motion is a group element driven by a Lie-algebra element: Ṁ = −½MB. Momentum and force are lines, energy is a quadratic form.', 'An oscillator is the same flow with B² = −1 (step 12). The inertia map and Ṗ = F give step 13: the cube as a rigid body, and the paper’s ganja.js examples (hung body, free top, planets, Moon) as later rungs.'],
      roelfs: ['Roelfs, Eelbode, De Keninck, “From Invariant Decomposition to Spinors”', 'A versor splits into commuting simple factors; their labels classify the states; the point O stays fixed.', 'The labels are the Walsh characters of the cube, so they are the normal modes of a spring network (row E1). Each simple factor is an independent oscillator plane.'],
      eelbode: ['Eelbode, “Rotors and Spinors” (GAME23)', 'A spinor is an eigenelement; a rotation acts as a phase cos t + σ i sin t; overall phases are irrelevant, relative phases are physical.', 'Time evolution of a two-level system is the oscillator phase: springs and spinors are one flow seen in position space and in phase space.'],
      hestenes: ['Hestenes, space-time algebra', 'The Dirac equation with ψ even, ψ = ρ^½ e^{iβ/2} R.', 'Already in steps 2 and 11 (pointors are the slice β = 0 of the Yvon–Takabayasi angle).'],
      doran: ['Doran and Lasenby, Geometric Algebra for Physicists; gauge theory gravity', 'Action principles through the multivector derivative; rotor equations of motion, for example Kepler as a rotor problem.', 'This is what could close our standing open item: the sign and size of the source terms, because we never rebuilt an action. Start with the action of the spring, then lift it.'],
      exp: ['Roelfs and De Keninck, graded symmetry groups; Eelbode, Roelfs, De Keninck, outer exponentials', 'Closed forms for the exponential of a bivector in any signature, the tool for integrating motors.', 'Needed for dynamics in the atlas signature (space squares −1) and for the signed Forque energy we left uninterpreted.'],
      visual: ['Joan Lasenby, Hamish Todd, Freya Holmer, Stephen Mann', 'Rigid-body motion estimation, interactive visual rotors, conformal GA in practice.', 'A visual language for the spring widgets and for reading motors; conformal dynamics, which the Forque paper does not have.'],
      huang: ['Hao Huang, the sensitivity conjecture (2019)', 'A signed hypercube matrix A with A² = n·I and two eigenvalues ±√n.', 'It is the Clifford network of step 12 (D = Σ e_i). The algebra is standard and checked here; the reading of its signs as flux π through the faces is ours.'],
    },
  },
  it: {
    head: { h: 'Che cosa possiamo prendere da altri ricercatori per fare dinamica', lede: 'La domanda è quali idee trasformano un’algebra statica in equazioni del moto, e se possiamo derivarle sulla regola dei bit invece di importarle. «Letto» vuol dire che abbiamo lavorato sulla fonte; «solo diapositive» che abbiamo visto le diapositive della lezione ma non il video; «non letto» che l’idea viene da un elenco o dalla memoria e va controllata sulla fonte prima di appoggiarci.', cols: ['Fonte', 'Idea da prendere', 'Come si collega a ciò che abbiamo', 'Lettura'], readLbl: { read: 'letto', slides: 'solo diapositive', standard: 'standard', not: 'non letto' } },
    rows: {
      forque: ['Dorst e De Keninck, «May the Forque Be with You»', 'Il moto è un elemento di gruppo guidato da un elemento di algebra di Lie: Ṁ = −½MB. Quantità di moto e forza sono rette, l’energia è una forma quadratica.', 'Un oscillatore è lo stesso flusso con B² = −1 (passo 12). La mappa d’inerzia e Ṗ = F danno il passo 13: il cubo come corpo rigido, e gli esempi ganja.js dell’articolo (corpo appeso, trottola libera, pianeti, Luna) come gradini successivi.'],
      roelfs: ['Roelfs, Eelbode, De Keninck, «From Invariant Decomposition to Spinors»', 'Un versore si scompone in fattori semplici che commutano; le loro etichette classificano gli stati; il punto O resta fisso.', 'Le etichette sono i caratteri di Walsh del cubo, quindi sono i modi normali di una rete di molle (riga E1). Ogni fattore semplice è un piano oscillatore indipendente.'],
      eelbode: ['Eelbode, «Rotors and Spinors» (GAME23)', 'Uno spinore è un elemento-autovettore; una rotazione agisce come una fase cos t + σ i sin t; le fasi globali non contano, quelle relative sono fisiche.', 'L’evoluzione temporale di un sistema a due livelli è la fase dell’oscillatore: molle e spinori sono un solo flusso visto nello spazio delle posizioni e in quello delle fasi.'],
      hestenes: ['Hestenes, algebra spazio-temporale', 'L’equazione di Dirac con ψ pari, ψ = ρ^½ e^{iβ/2} R.', 'Già nei passi 2 e 11 (i pointor sono la fetta β = 0 dell’angolo di Yvon–Takabayasi).'],
      doran: ['Doran e Lasenby, Geometric Algebra for Physicists; teoria di gauge della gravità', 'Principi d’azione tramite la derivata multivettoriale; equazioni del moto dei rotori, per esempio Keplero come problema di rotori.', 'È ciò che potrebbe chiudere il nostro punto aperto di sempre: il segno e la grandezza dei termini sorgente, perché non abbiamo mai ricostruito un’azione. Partire dall’azione della molla, poi sollevarla.'],
      exp: ['Roelfs e De Keninck, gruppi di simmetria graduati; Eelbode, Roelfs, De Keninck, esponenziali esterni', 'Forme chiuse per l’esponenziale di un bivettore in qualsiasi segnatura, lo strumento per integrare i motori.', 'Serve per la dinamica nella segnatura dell’atlante (quadrati spaziali −1) e per l’energia del forque con segni che abbiamo lasciato non interpretata.'],
      visual: ['Joan Lasenby, Hamish Todd, Freya Holmer, Stephen Mann', 'Stima del moto del corpo rigido, rotori visivi interattivi, GA conforme in pratica.', 'Un linguaggio visivo per i widget delle molle e per leggere i motori; la dinamica conforme, che l’articolo sul forque non ha.'],
      huang: ['Hao Huang, la congettura della sensibilità (2019)', 'Una matrice A dell’ipercubo con segni, con A² = n·I e due autovalori ±√n.', 'È la rete di Clifford del passo 12 (D = Σ e_i). L’algebra è standard e controllata qui; la lettura dei suoi segni come flusso π attraverso le facce è nostra.'],
    },
  },
};

export const MAP = {
  en: {
    statusH: 'Status', treeH: 'The tree of knowledge', researchH: RESEARCH_TEXT.en.head.h, springH: 'The spring, in one paragraph', nextH: 'Next steps', creditH: 'Who made this',
    date: 'STATUS · 3 OCTOBER 2026',
    title: 'Cascade Atlas: where we stand, what connects, what comes next',
    stats: [
      [`${PAGES.length}`, `pages; the equations page has ${nEq} numbered steps and the shapes page ${nSh}`],
      [`${SCRIPTS.stdlib.length} + ${SCRIPTS.numpy.length}`, `check scripts that use only the standard library (exact fractions, all passing) and scripts that need numpy (the dictionary and the matrix cross-checks), each downloadable from its page`],
      [`${SPC.ok} · ${SR.ok} · ${PG.ok}`, `exact claims in the spinor, spring and rigid-body scripts (a matrix of ${SC.rows} rows for the spinors, ${SRD.rows.length} for the springs, ${PG.rows} for the rigid body)`],
      ['2 × 3', 'languages (English, Italian) times audiences (Young Learner, Physicist, Mathematician) on every page'],
    ],
    sinceH: 'Since the last report',
    since: [
      ['Step 13, a rigid body from a segment to a tesseract.', `The ladder: a segment, a square, the cube with its own labels, a body hung from a spring, the frame table, a free top, the Moon and five planets. ${PG.rows} rows, ${PG.ok} exact claims, a live engine checked against them, and a benchmark of the label speed-ups: the frame is slower at n = 1 (${x1(BF.frame[0])}×) and wins from n = 3 (up to ${x1(BF.frame[5])}× at n = 6), the mirrored half gains nothing, the sign-bit contact test gains ${BF.scanBuilt[0].toFixed(2)}–${BF.scanBuilt[1].toFixed(2)}× once building is counted. Timed on one machine.`],
      ['Step 12, a spring on the cube.', `The first step that solves its equations. Vertices carry masses, edges springs, faces the closure; the labels of step 11 are the normal modes; the three kinds of i are oscillator, inverted oscillator and free motion; the signed network has two levels. ${SR.ok} exact claims, five live widgets.`],
      ['This map.', 'A tree of knowledge that links back to each part of the app and to its script, a table of what to borrow from other researchers, and the next steps.'],
      ['Step 11, pointors and the three kinds of i.', `The Roelfs–Eelbode–De Keninck paper and Eelbode’s lecture, woven by subject: six threads, eight widgets, ${SC.rows} rows.`],
      ['Step 10, the Forque.', `A translation matrix of Dorst and De Keninck’s dynamics: ${FC.rows} rows, ${FC.ok} agree exactly, ${FC.note} after a noted correction, ${FC.not_checked} not checked.`],
      ['Language and audience sweep.', 'Every “STEP k OF N” is derived from one list, every section has short readings for the learner and the physicist, and an audit test renders every page in both languages for the three audiences.'],
    ],
    plainH: 'What we can say plainly',
    plain: [
      'The bit rule reproduces known structures exactly: Maxwell on every split up to n = 7, Dirac, its coupling, Yang–Mills, charged matter, first-order gravity, mirrors, the conformal ladder, rigid-body dynamics, spinors, a spring network, and now a rigid body from a segment to a tesseract. None of it predicts anything, and none of it selects three generations.',
      'Three generations remain open. In Furey’s model an exhaustive search gives at most two generations with exotic content and one in her own frame. The number 3 appears in our counts as a coincidence of capacity or branching, never as a derivation.',
      'Prime and base-10 labels are notation. Period 8 repeats cells; it is never a wall or a reset.',
      'Two sources are only partly read. Eelbode’s lecture was read from its slides, not from the video. The two papers the spinor authors cite for the decomposition were not read. The planets of step 13 are the repository example’s own printed table: JPL could not be reached, so they are checked for plausibility only.',
      'Two printed lines of the spinor paper read differently in our exact check (Theorems 2 and 3, both about which sums of rotors are pointors) and nine of the Forque paper. They are listed neutrally for the authors; any may be our error.',
    ],
    treeLede: 'Open a branch to see where it lives in the app, which script checks it, and what it established. Press “Go there” to jump to it. The chips highlight every branch that uses a lens or belongs to a thread; the rest fade. Dashed branches are plans.',
    lensLbl: 'Lenses', threadLbl: 'Threads', clear: 'Clear', threadsH: 'The threads, in one line each',
    kv: { est: 'Established', script: 'Script', where: 'Where', lenses: 'Lenses', go: 'Go there', planned: 'planned' },
    shown: n => `${n} branches highlighted`,
    springLede: 'Put a unit mass on every vertex of the n-cube, a Hooke spring on every edge, and let each vertex move along one axis. Vertices carry the masses, edges the springs, faces the closure, and the rotor of the earlier steps runs the oscillator. Everything is exact (rational arithmetic) and lives on page 6, step 12, with five widgets and a downloadable script. Below, the spectrum it produces.',
    springGo: 'Open step 12',
    chartH: 'Squared frequencies of the cube network', chartCap: 'Each mark sits at its ω² on one scale; its area is proportional to the multiplicity (the number printed above it). Top rows: plain spring. Bottom rows: Clifford (signed) spring.',
    rowsLbl: n => `n = ${n} plain`, rowsLblC: n => `n = ${n} Clifford`, axis: 'squared frequency ω²',
    limitsH: 'Limits, stated plainly',
    limits: [
      'One scalar displacement per vertex. Real springs in space need vector displacements; that is the next test, not done.',
      'The signed network is a legitimate mechanical model (springs that join a mass to the reversed coordinate of its neighbour), but we make no claim that the physics of the atlas is this. Its meaning for the Dirac operator on the demicube is a reading, open.',
      `No continuum limit and no action principle yet. The ${SR.ok} + ${PG.ok} claims are algebraic identities and exact series; the live widgets of step 13 integrate numerically (Runge–Kutta 4) and are checked against those series over short times.`,
      'The multiplicities 1, 3, 3, 1 at n = 3 are binomial coefficients. They say nothing about three generations.',
      'The label speed-ups of step 13 are a measurement on one machine (a noisy 2-core virtual machine, node 22), not a theorem: the frame pays from n = 3, while the mirrored half and the sign-bit contact test gain almost nothing once building is counted. Other machines and other engines are open. No collisions, joints or friction either.',
    ],
    nextLede: 'In order, each building on the one before. The first needs no new reading; the last two need sources we have not read yet.',
    nextOpenH: 'The open list we carry', nextOpen: 'Three generations; the lecture’s i in even dimension; conformal dynamics; chirality and the electroweak doublets; the Dirac equation on a curved tetrad; the gravity field equation with matter; the label speed-ups on other machines.',
    credit: {
      p: [
        'A person set the questions, supplied the sources (a paper, lecture slides, a list of researchers) and kept insisting on three things: every claim checked against data, open things called open, and nothing presented as new that is not new.',
        'Claude, an AI model made by Anthropic, did the building: it wrote the code of this web app, the exact check scripts, the English and Italian texts and the tests, read the sources it was given, and ran the checks. Claude proposes; the scripts and the sources decide.',
        'More than once a first reading was wrong and an exact check said so. In those cases the page was changed, not the check. Claude can still be wrong, in a script as much as in a sentence, which is why every page names the script that checks it, tags its claims, and says “open” where nobody knows. The model behind the Ask page can be wrong too.',
      ],
      mark: 'The small cube mark is our own drawing, not Anthropic’s logo.', link: 'About Claude and Anthropic',
    },
    footer: 'Built with Claude, an AI model by Anthropic',
  },
  it: {
    statusH: 'Stato', treeH: 'L’albero della conoscenza', researchH: RESEARCH_TEXT.it.head.h, springH: 'La molla, in un paragrafo', nextH: 'Passi successivi', creditH: 'Chi ha fatto tutto questo',
    date: 'STATO · 3 OTTOBRE 2026',
    title: 'Cascade Atlas: dove siamo, che cosa si collega, che cosa viene dopo',
    stats: [
      [`${PAGES.length}`, `pagine; la pagina delle equazioni ha ${nEq} passi numerati e quella delle forme ${nSh}`],
      [`${SCRIPTS.stdlib.length} + ${SCRIPTS.numpy.length}`, 'script di controllo che usano solo la libreria standard (frazioni esatte, tutti superati) e script che richiedono numpy (il dizionario e i controlli incrociati con matrici), ciascuno scaricabile dalla sua pagina'],
      [`${SPC.ok} · ${SR.ok} · ${PG.ok}`, `affermazioni esatte negli script degli spinori, delle molle e del corpo rigido (una matrice di ${SC.rows} righe per gli spinori, ${SRD.rows.length} per le molle, ${PG.rows} per il corpo rigido)`],
      ['2 × 3', 'lingue (inglese, italiano) per pubblici (giovane studente, fisico, matematico) su ogni pagina'],
    ],
    sinceH: 'Dall’ultimo rapporto',
    since: [
      ['Passo 13, un corpo rigido dal segmento al tesseratto.', `La scala: un segmento, un quadrato, il cubo con le proprie etichette, un corpo appeso a una molla, la tabella dei riferimenti, una trottola libera, la Luna e cinque pianeti. ${PG.rows} righe, ${PG.ok} affermazioni esatte, un motore dal vivo controllato contro di esse e una misura dei guadagni di velocità delle etichette: il riferimento è più lento a n = 1 (${x1(BF.frame[0]).replace('.', ',')}×) e vince da n = 3 (fino a ${x1(BF.frame[5]).replace('.', ',')}× a n = 6), la metà speculare non guadagna nulla, il test di contatto con i bit di segno guadagna ${BF.scanBuilt[0].toFixed(2).replace('.', ',')}–${BF.scanBuilt[1].toFixed(2).replace('.', ',')}× una volta contata la costruzione. Misurato su una macchina.`],
      ['Passo 12, una molla sul cubo.', `Il primo passo che risolve le sue equazioni. I vertici portano le masse, gli spigoli le molle, le facce la chiusura; le etichette del passo 11 sono i modi normali; i tre tipi di i sono oscillatore, oscillatore invertito e moto libero; la rete con segni ha due livelli. ${SR.ok} affermazioni esatte, cinque widget dal vivo.`],
      ['Questa mappa.', 'Un albero della conoscenza che rimanda a ogni parte dell’app e al suo script, una tabella di che cosa prendere da altri ricercatori e i passi successivi.'],
      ['Passo 11, pointor e i tre tipi di i.', `L’articolo di Roelfs–Eelbode–De Keninck e la lezione di Eelbode, intrecciati per argomento: sei filoni, otto widget, ${SC.rows} righe.`],
      ['Passo 10, il forque.', `Una matrice di traduzione della dinamica di Dorst e De Keninck: ${FC.rows} righe, ${FC.ok} tornano esattamente, ${FC.note} dopo una correzione annotata, ${FC.not_checked} non verificate.`],
      ['Revisione di lingua e pubblico.', 'Ogni «PASSO k DI N» deriva da un’unica lista, ogni sezione ha letture brevi per il giovane studente e il fisico, e un test di audit presenta ogni pagina nelle due lingue per i tre pubblici.'],
    ],
    plainH: 'Che cosa possiamo dire chiaramente',
    plain: [
      'La regola dei bit riproduce strutture note esattamente: Maxwell su ogni suddivisione fino a n = 7, Dirac, il suo accoppiamento, Yang–Mills, la materia carica, la gravità al primo ordine, gli specchi, la scala conforme, la dinamica del corpo rigido, gli spinori, una rete di molle, e ora un corpo rigido dal segmento al tesseratto. Niente di tutto ciò predice qualcosa, e niente seleziona tre generazioni.',
      'Le tre generazioni restano aperte. Nel modello di Furey una ricerca esaustiva dà al più due generazioni con contenuto esotico e una nel suo riferimento. Il numero 3 compare nei nostri conteggi come coincidenza di capacità o di ramificazione, mai come derivazione.',
      'Le etichette in primi e in base 10 sono notazione. Il periodo 8 ripete le celle; non è mai un muro né un azzeramento.',
      'Due fonti sono lette solo in parte. La lezione di Eelbode è stata letta dalle diapositive, non dal video. I due articoli citati dagli autori sugli spinori per la decomposizione non sono stati letti. I pianeti del passo 13 sono la tabella stampata nell’esempio del repository: JPL non era raggiungibile, quindi sono controllati solo per plausibilità.',
      'Due righe stampate dell’articolo sugli spinori si leggono diversamente nel nostro controllo esatto (Teoremi 2 e 3, entrambi su quali somme di rotori sono pointor) e nove di quello sul forque. Sono elencate in modo neutro per gli autori; ognuna può essere un nostro errore.',
    ],
    treeLede: 'Apri un ramo per vedere dove sta nell’app, quale script lo controlla e che cosa ha stabilito. Premi «Vai lì» per saltarci. I filtri evidenziano ogni ramo che usa una lente o appartiene a un filone; gli altri sbiadiscono. I rami tratteggiati sono piani.',
    lensLbl: 'Lenti', threadLbl: 'Filoni', clear: 'Azzera', threadsH: 'I filoni, in una riga ciascuno',
    kv: { est: 'Stabilito', script: 'Script', where: 'Dove', lenses: 'Lenti', go: 'Vai lì', planned: 'previsto' },
    shown: n => `${n} rami evidenziati`,
    springLede: 'Metti una massa unitaria su ogni vertice dell’n-cubo, una molla di Hooke su ogni spigolo, e lascia che ogni vertice si muova lungo un asse. I vertici portano le masse, gli spigoli le molle, le facce la chiusura, e il rotore dei passi precedenti governa l’oscillatore. Tutto è esatto (aritmetica razionale) e sta alla pagina 6, passo 12, con cinque widget e uno script scaricabile. Qui sotto, lo spettro che ne esce.',
    springGo: 'Apri il passo 12',
    chartH: 'Frequenze al quadrato della rete sul cubo', chartCap: 'Ogni segno sta al proprio ω² su un’unica scala; la sua area è proporzionale alla molteplicità (il numero scritto sopra). Righe in alto: molla semplice. Righe in basso: molla di Clifford (con segni).',
    rowsLbl: n => `n = ${n} semplice`, rowsLblC: n => `n = ${n} Clifford`, axis: 'frequenza al quadrato ω²',
    limitsH: 'Limiti, detti chiaramente',
    limits: [
      'Uno spostamento scalare per vertice. Le molle vere nello spazio richiedono spostamenti vettoriali; è la prova successiva, non fatta.',
      'La rete con segni è un modello meccanico legittimo (molle che collegano una massa alla coordinata invertita del vicino), ma non affermiamo che la fisica dell’atlante sia questa. Il suo significato per l’operatore di Dirac sul demicubo è una lettura, aperta.',
      `Nessun limite al continuo e nessun principio d’azione, per ora. Le ${SR.ok} + ${PG.ok} affermazioni sono identità algebriche e serie esatte; i widget dal vivo del passo 13 integrano numericamente (Runge–Kutta 4) e sono controllati contro quelle serie su tempi brevi.`,
      'Le molteplicità 1, 3, 3, 1 a n = 3 sono coefficienti binomiali. Non dicono nulla sulle tre generazioni.',
      'I guadagni di velocità delle etichette nel passo 13 sono una misura su una macchina (una macchina virtuale a 2 core, rumorosa, node 22), non un teorema: il riferimento conviene da n = 3, mentre la metà speculare e il test di contatto con i bit di segno non guadagnano quasi nulla una volta contata la costruzione. Altre macchine e altri motori sono aperti. Nemmeno urti, giunti o attrito.',
    ],
    nextLede: 'In ordine, ciascuno costruito sul precedente. Il primo non richiede nuove letture; gli ultimi due richiedono fonti che non abbiamo ancora letto.',
    nextOpenH: 'L’elenco aperto che ci portiamo dietro', nextOpen: 'Tre generazioni; l’i della lezione in dimensione pari; la dinamica conforme; la chiralità e i doppietti elettrodeboli; l’equazione di Dirac su una tetrade curva; l’equazione di campo della gravità con la materia; i guadagni di velocità delle etichette su altre macchine.',
    credit: {
      p: [
        'Una persona ha posto le domande, ha fornito le fonti (un articolo, le diapositive di una lezione, un elenco di ricercatori) e ha insistito su tre cose: ogni affermazione controllata sui dati, le cose aperte chiamate aperte, e niente presentato come nuovo se non lo è.',
        'Claude, un modello di intelligenza artificiale di Anthropic, ha costruito: ha scritto il codice di questa app web, gli script di controllo esatti, i testi in inglese e in italiano e i test, ha letto le fonti che gli sono state date e ha eseguito i controlli. Claude propone; gli script e le fonti decidono.',
        'Più di una volta una prima lettura era sbagliata e un controllo esatto lo ha detto. In quei casi è stata cambiata la pagina, non il controllo. Claude può ancora sbagliare, in uno script come in una frase, ed è per questo che ogni pagina nomina lo script che la controlla, etichetta le sue affermazioni e dice «aperto» dove nessuno lo sa. Anche il modello dietro la pagina Chiedi può sbagliare.',
      ],
      mark: 'Il piccolo cubo è un nostro disegno, non il logo di Anthropic.', link: 'Su Claude e Anthropic',
    },
    footer: 'Costruito con Claude, un modello di IA di Anthropic',
  },
};
