// Copy for the six-page story. Status vocabulary: checked, standard, ours, open.
import { STEP_GROUPS, NAV_NAMES, stepCount, numWord, capital } from './steps.js';
export const PAGES = ['rule', 'atlas', 'maxwell', 'furey', 'shapes', 'equations', 'map', 'ask'];

export const STORY = {
  en: {
    nav: { rule: 'The rule', atlas: 'The atlas', maxwell: 'Test 1 · Maxwell', furey: 'Test 2 · Furey', shapes: 'More shapes', equations: 'More equations', map: 'Map', ask: 'Ask' },
    step: 'Step', of: 'of', prev: 'Back', next: 'Next', before: 'Before this', after: 'Next',
    tags: { checked: 'checked', standard: 'standard', ours: 'ours', open: 'open' },
    tagHelp: { checked: 'verified by exact arithmetic or a script you can download', standard: 'textbook mathematics or physics', ours: 'the reading we propose, not a result', open: 'not established' },
    legend: 'How to read the tags',
    pages: {
      rule: {
        h: 'One bit rule, four pictures',
        does: 'A blade is a bit pattern, and multiplying two blades is XOR on their labels (up to a sign). Here that rule is drawn four ways, and a short story shows the ladder of algebras it builds from three axioms.',
        before: '', after: 'Next we spread the same rule over a map of 25 cells, then test it on two theories we did not invent.',
        tags: [['standard', 'Clifford algebras and their classification'], ['ours', 'reading blades as faces, cube vertices and labels'], ['ours', 'prime labels are notation only']]
      },
      atlas: {
        h: 'The atlas: 25 cells of the same rule',
        does: 'Each cell is one Clifford algebra Cl(p,q), placed by its two gradings. Pick a cell to see its algebra, its simplex, its cube and its labels. Cell names are readings, so each carries its audit status.',
        before: 'The rule: blades are bit patterns and products are XOR.',
        after: 'Two cells are tested in depth: the electromagnetic one first, because everything about it is known.',
        tags: [['checked', 'algebra type and matrix size of every cell'], ['ours', 'the physical names given to cells'], ['open', 'cells marked research or speculative']]
      },
      maxwell: {
        h: 'Test 1: does the rule reproduce known physics?',
        does: 'Maxwell’s equations are one equation, ∇F = J. We rebuild them in 1 to 4 space dimensions and 1 to 4 time dimensions from the bit rule alone and check every term with exact arithmetic.',
        before: 'The atlas gave every cell an algebra. Here one family of cells is used as a real equation.',
        after: 'It works where the answer is known. The harder test is a model with matter in it.',
        tags: [['checked', 'every term, sign and wave equation'], ['standard', 'Maxwell in geometric algebra (Hestenes)'], ['standard', 'wave-operator type: elliptic, hyperbolic, ultrahyperbolic'], ['open', 'any link to Furey’s model']]
      },
      furey: {
        h: 'Test 2: one generation of matter',
        does: 'Furey’s model builds one generation of Standard Model states inside Cl(0,8). We rebuild it explicitly, then map its operators onto our blades, edges and channels and mark what fits and what does not.',
        before: 'Test 1 showed the rule reproduces a theory with no matter. This one has charges, colour and chirality.',
        after: 'What remains is listed as questions. Next, more shapes grow from the same rule and are checked against the views we already have.',
        tags: [['checked', 'the 16-dimensional model, the Cartan ledger, the 28 edges in 7 channels'], ['standard', 'Furey’s construction (arXiv 2607.18450)'], ['checked', 'one generation fits, three do not (Cl(0,8) gauge content)'], ['open', 'top quark, 210, mass scale, replica edges, a family structure for generations']]
      },
      shapes: {
        h: 'More shapes: the poles, the half-cube and the Gosset series',
        does: 'The simplex and the cube are two pictures of the same bit rule. Two more shapes exist in every dimension: the orthoplex, which gives each axis two poles, and the demicube, which keeps every second corner of the cube. The third step is the Gosset series E6, E7, E8, which turns out to be built from these two shapes. We add them one at a time and check each against the views we already have.',
        before: 'Test 2 rebuilt a model with matter in it: one generation fits, three do not.',
        after: `Next: ${numWord('en', stepCount('eq'))} steps of equations, from the Lorentz algebra to rigid-body dynamics and spinors, drawn and checked the same way as Maxwell.`,
        tags: [['checked', 'face counts, duality, even subalgebras, equation couplings, E6–E8 roots and polytopes from the Cartan matrices'], ['standard', 'Spin(2n) weights, Cl⁰(p,q) = Cl(p,q−1), the classification of E-type diagrams'], ['ours', 'reading even blades as fields and odd blades as sources'], ['open', 'whether any shape selects the number of generations, and whether the stop at E8 is related to period 8']]
      },
      equations: {
        h: `More equations: ${numWord('en', stepCount('eq'))} steps, from commutators to a rigid body`,
        does: `Maxwell was the first equation we could draw from the bit rule. ${capital(numWord('en', stepCount('eq')))} more steps follow the same recipe, each drawn as an incidence picture and checked by a script: ${STEP_GROUPS.eq.map(id => NAV_NAMES.en[id]).join(' · ')}. The last four steps are different. Two take the equations of other people’s work (a paper on rigid-body dynamics; a paper and a lecture on spinors), translate them to the bit rule and put them in a matrix, so that their authors can check them for themselves. One puts a spring network on the cube and solves it exactly. The last climbs a ladder from a segment to a tesseract, with a cube that carries its own labels, a body hung from a spring and a frame table, and every rung is checked against an exact solution.`,
        before: 'The shapes page showed the even half of the cube as the demicube and the Gosset series that grows from it.',
        after: 'Next: the map of everything so far, with a tree of knowledge that links back to each part and points to the next step.',
        tags: [['checked', 'bivector commutators for every signature up to n = 8; Dirac incidences, determinant and covariance; the coupling ladder for n = 1 to 8; Yang–Mills identities for gauge dimension 2 to 8; the charged-matter current and its conservation, exact; the Bianchi identities, the Einstein form and its divergence, exact; versors, the Cartan–Dieudonné bound and the cube as a group of mirrors; the extra generator s = 0, ±1, the null pair and the conformal algebra, exact and with matrices; the equations of the Forque paper translated to the bit rule, exact as power series, with a numpy cross-check; the labels, idempotents, pointors and phases of a spinor paper and lecture, exact on the bit rule; a spring network on the cube, plain and with the sign of the generator, exact as power series; a rigid body from the segment to the tesseract (free, under a spring, under gravity, a free top, planets and a moon), 110 claims in 56 rows, exact as power series, with a floating-point engine checked against them'], ['standard', 'Hestenes’ space-time algebra form of the Dirac equation; so(p,q) as bivectors; first-order (Cartan) gravity; reflections, versors, Cartan–Dieudonné, Coxeter groups; Hooke’s law and the hypercube spectrum (Walsh modes); rigid-body dynamics in plane-based PGA (Dorst and De Keninck); the invariant decomposition, pointors and spinors (Roelfs, Eelbode and De Keninck; Eelbode’s lecture); the tennis-racket (inverted oscillator) instability of a free top; Newton’s law of gravitation and Kepler’s laws'], ['ours', 'reading the derivative and coupling terms as edges and corner simplices of the cube; the 2ⁿ corner labels as bit masks, with the n+1 sandwiches of a frame instead of 2ⁿ (timed on one machine; it pays from n = 3)'], ['open', 'the sign and size of the source term, chirality and the electroweak doublets, the gravity field equation with matter, conformal dynamics (the Forque paper has none), the paper’s Lagrangian form and constrained motion, springs with vector displacements and their zero modes on the cube, an action principle, collisions, joints and friction, the label speed-ups outside the one machine they were timed on, the planets table against its JPL source']]
      },
      map: {
        h: 'The map: where we stand, the tree of what we know, and the next step',
        does: 'One page for the whole project. The status of every part, a tree of knowledge in which each branch says where it lives in the app and which script checks it, what could be borrowed from other researchers to do dynamics, the next steps, and who made this.',
        before: `The equations page ended with a rigid body, from a segment to a tesseract, whose motion is computed live and checked against an exact solution.`,
        after: 'Last stop: put any question to the model, with every claim tagged.',
        tags: [['checked', 'the counts on this page are read from the same data files as the pages they describe'], ['ours', 'the grouping of branches into lenses and threads is our reading'], ['open', 'the next steps are plans, not results']]
      },
      ask: {
        h: 'Ask the model',
        does: 'The guide answers from the same axioms and the same audit. It states a status for each claim and says “open” where that is the honest answer.',
        before: `You have seen the rule, the atlas, two tests, ${numWord('en', stepCount('shapes'))} steps of shapes and ${numWord('en', stepCount('eq'))} steps of equations, and the map.`,
        after: '',
        tags: [['open', 'it has not been tested live against every question']]
      }
    },
    hero: {
      'Young Learner': ['One switch rule, four ways to see it.', 'Switches are on or off. Flip two sets of switches together and you get a new set. We draw that one rule four ways, then check it on light and on particles.'],
      Physicist: ['One bit rule, read four ways.', 'Blades are bit patterns and their products are XOR on labels. We draw that one rule as algebra, simplex, cube and numbers, then test it on two known theories.'],
      Mathematician: ['One algebra, four coordinate languages.', 'Clifford blades as bitmasks with product given by XOR up to sign; one incidence structure drawn as Peirce data, simplex faces, cube vertices and integer labels, then checked against Maxwell in Cl(k,d) and Furey’s model in Cl(0,8).']
    },
    note: 'Standard mathematics, re-read. What is ours is the reading, not the algebra. Each claim carries a status: checked, standard, ours or open. Not a peer-reviewed physical theory.',
    metric: { Spatial: ['Space +', 'Reading 1: generators that square to +1 are space'], Temporal: ['Time +', 'Reading 2: the mirror reading, with time and space roles swapped (see Test 1)'] }
  },
  it: {
    nav: { rule: 'La regola', atlas: 'L’atlante', maxwell: 'Prova 1 · Maxwell', furey: 'Prova 2 · Furey', shapes: 'Altre forme', equations: 'Altre equazioni', map: 'Mappa', ask: 'Chiedi' },
    step: 'Passo', of: 'di', prev: 'Indietro', next: 'Avanti', before: 'Prima di questa', after: 'Poi',
    tags: { checked: 'verificato', standard: 'standard', ours: 'nostro', open: 'aperto' },
    tagHelp: { checked: 'verificato con aritmetica esatta o con uno script scaricabile', standard: 'matematica o fisica da manuale', ours: 'la lettura che proponiamo, non un risultato', open: 'non stabilito' },
    legend: 'Come leggere le etichette',
    pages: {
      rule: {
        h: 'Una regola di bit, quattro immagini',
        does: 'Una lama è uno schema di bit e moltiplicare due lame è XOR sulle loro etichette (a meno del segno). Qui la regola è disegnata in quattro modi e una breve storia mostra la scala di algebre che costruisce da tre assiomi.',
        before: '', after: 'Poi distribuiamo la stessa regola su una mappa di 25 celle e la mettiamo alla prova su due teorie che non abbiamo inventato.',
        tags: [['standard', 'algebre di Clifford e loro classificazione'], ['ours', 'lettura delle lame come facce, vertici del cubo ed etichette'], ['ours', 'le etichette primi sono solo notazione']]
      },
      atlas: {
        h: 'L’atlante: 25 celle della stessa regola',
        does: 'Ogni cella è un’algebra di Clifford Cl(p,q), collocata dalle sue due gradazioni. Scegli una cella per vedere algebra, simplesso, cubo ed etichette. I nomi delle celle sono letture, quindi ognuna riporta il proprio stato di verifica.',
        before: 'La regola: le lame sono schemi di bit e i prodotti sono XOR.',
        after: 'Due celle sono provate a fondo: prima quella elettromagnetica, perché di essa si sa tutto.',
        tags: [['checked', 'tipo di algebra e dimensione matriciale di ogni cella'], ['ours', 'i nomi fisici dati alle celle'], ['open', 'celle segnate come ricerca o speculative']]
      },
      maxwell: {
        h: 'Prova 1: la regola riproduce la fisica nota?',
        does: 'Le equazioni di Maxwell sono una sola equazione, ∇F = J. Le ricostruiamo da 1 a 4 dimensioni spaziali e da 1 a 4 temporali con la sola regola dei bit e verifichiamo ogni termine con aritmetica esatta.',
        before: 'L’atlante ha dato un’algebra a ogni cella. Qui una famiglia di celle diventa un’equazione vera.',
        after: 'Funziona dove la risposta è nota. La prova più dura è un modello con la materia dentro.',
        tags: [['checked', 'ogni termine, segno ed equazione d’onda'], ['standard', 'Maxwell in algebra geometrica (Hestenes)'], ['standard', 'tipo dell’operatore d’onda: ellittico, iperbolico, ultraiperbolico'], ['open', 'ogni legame con il modello di Furey']]
      },
      furey: {
        h: 'Prova 2: una generazione di materia',
        does: 'Il modello di Furey costruisce una generazione di stati del Modello Standard dentro Cl(0,8). Lo ricostruiamo in modo esplicito, poi mappiamo i suoi operatori su lame, spigoli e canali nostri e segniamo ciò che combacia e ciò che no.',
        before: 'La Prova 1 ha mostrato che la regola riproduce una teoria senza materia. Questa ha cariche, colore e chiralità.',
        after: 'Ciò che resta è elencato come domande. Poi altre forme crescono dalla stessa regola e vengono confrontate con le viste che già abbiamo.',
        tags: [['checked', 'il modello a 16 dimensioni, il registro di Cartan, i 28 spigoli in 7 canali'], ['standard', 'costruzione di Furey (arXiv 2607.18450)'], ['checked', 'una generazione ci sta, tre no (contenuto di gauge di Cl(0,8))'], ['open', 'quark top, 210, scala di massa, spigoli di replica, una struttura di famiglia per le generazioni']]
      },
      shapes: {
        h: 'Altre forme: i poli, il mezzo cubo e la serie di Gosset',
        does: 'Il simplesso e il cubo sono due immagini della stessa regola di bit. In ogni dimensione esistono altre due forme: l’ortoplesso, che dà a ogni asse due poli, e il demicubo, che tiene un vertice su due del cubo. Il terzo passo è la serie di Gosset E6, E7, E8, che risulta fatta di queste due forme. Le aggiungiamo una alla volta e le confrontiamo con le viste che già abbiamo.',
        before: 'La Prova 2 ha ricostruito un modello con la materia dentro: una generazione ci sta, tre no.',
        after: `Poi: ${numWord('it', stepCount('eq'))} passi di equazioni, dall’algebra di Lorentz alla dinamica del corpo rigido e agli spinori, disegnati e controllati come Maxwell.`,
        tags: [['checked', 'conteggi delle facce, dualità, sottoalgebre pari, accoppiamenti delle equazioni, radici e politopi di E6–E8 dalle matrici di Cartan'], ['standard', 'pesi di Spin(2n), Cl⁰(p,q) = Cl(p,q−1), la classificazione dei diagrammi di tipo E'], ['ours', 'leggere le lame pari come campi e quelle dispari come sorgenti'], ['open', 'se una qualche forma selezioni il numero di generazioni, e se l’arresto a E8 c’entri col periodo 8']]
      },
      equations: {
        h: `Altre equazioni: ${numWord('it', stepCount('eq'))} passi, dai commutatori a un corpo rigido`,
        does: `Maxwell è stata la prima equazione che abbiamo potuto disegnare dalla regola dei bit. Altri ${numWord('it', stepCount('eq'))} passi seguono la stessa ricetta, ciascuno disegnato come quadro di incidenze e controllato da uno script: ${STEP_GROUPS.eq.map(id => NAV_NAMES.it[id]).join(' · ')}. Gli ultimi quattro passi sono diversi. Due prendono le equazioni del lavoro di altri (un articolo sulla dinamica del corpo rigido; un articolo e una lezione sugli spinori), le traducono nella regola dei bit e le mettono in una matrice, così che i loro autori possano controllarle da soli. Uno mette una rete di molle sul cubo e la risolve esattamente. L’ultimo sale una scala dal segmento al tesseratto, con un cubo che porta le proprie etichette, un corpo appeso a una molla e una tabella dei riferimenti, e ogni gradino è controllato contro una soluzione esatta.`,
        before: 'La pagina delle forme ha mostrato la metà pari del cubo come demicubo e la serie di Gosset che ne cresce.',
        after: 'Avanti: la mappa di tutto ciò che c’è finora, con un albero della conoscenza che rimanda a ogni parte e indica il passo successivo.',
        tags: [['checked', 'commutatori dei bivettori per ogni segnatura fino a n = 8; incidenze di Dirac, determinante e covarianza; la scala dell’accoppiamento per n = 1…8; identità di Yang–Mills per dimensione di gauge 2…8; la corrente della materia carica e la sua conservazione, esatte; le identità di Bianchi, la forma di Einstein e la sua divergenza, esatte; versori, il limite di Cartan–Dieudonné e il cubo come gruppo di specchi; il generatore in più s = 0, ±1, la coppia nulla e l’algebra conforme, esatti e con matrici; le equazioni dell’articolo sul forque tradotte nella regola dei bit, esatte come serie di potenze, con un controllo numpy; le etichette, gli idempotenti, i pointor e le fasi di un articolo e di una lezione sugli spinori, esatti sulla regola dei bit; una rete di molle sul cubo, semplice e con il segno del generatore, esatta come serie di potenze; un corpo rigido dal segmento al tesseratto (libero, con una molla, sotto gravità, una trottola libera, pianeti e una luna), 110 affermazioni in 56 righe, esatte come serie di potenze, con un motore in virgola mobile controllato contro di esse'], ['standard', 'la forma di Hestenes (algebra spazio-temporale) dell’equazione di Dirac; so(p,q) come bivettori; gravità al primo ordine (di Cartan); riflessioni, versori, Cartan–Dieudonné, gruppi di Coxeter; la legge di Hooke e lo spettro dell’ipercubo (modi di Walsh); dinamica del corpo rigido nella PGA basata sui piani (Dorst e De Keninck); la decomposizione invariante, i pointor e gli spinori (Roelfs, Eelbode e De Keninck; la lezione di Eelbode); l’instabilità della trottola libera (racchetta da tennis, oscillatore invertito); la legge di gravitazione di Newton e le leggi di Keplero'], ['ours', 'leggere i termini di derivata e di accoppiamento come spigoli e simplessi d’angolo del cubo; le 2ⁿ etichette degli angoli come maschere di bit, con le n+1 sandwich di un riferimento invece di 2ⁿ (misurato su una macchina; conviene da n = 3)'], ['open', 'il segno e la grandezza del termine sorgente, la chiralità e i doppietti elettrodeboli, l’equazione di campo della gravità con la materia, la dinamica conforme (l’articolo sul forque non ne ha), la forma lagrangiana e il moto vincolato dell’articolo, molle con spostamenti vettoriali e i loro modi zero sul cubo, un principio d’azione, urti, giunti e attrito, le accelerazioni delle etichette fuori dalla macchina su cui sono state misurate, la tabella dei pianeti contro la sua fonte JPL']]
      },
      map: {
        h: 'La mappa: dove siamo, l’albero di ciò che sappiamo e il passo successivo',
        does: 'Una pagina per tutto il progetto. Lo stato di ogni parte, un albero della conoscenza in cui ogni ramo dice dove sta nell’app e quale script lo controlla, che cosa si può prendere da altri ricercatori per fare dinamica, i passi successivi e chi ha fatto tutto questo.',
        before: `La pagina delle equazioni è finita con un corpo rigido, dal segmento al tesseratto, il cui moto è calcolato in diretta e controllato contro una soluzione esatta.`,
        after: 'Ultima tappa: rivolgi qualsiasi domanda al modello, con ogni affermazione etichettata.',
        tags: [['checked', 'i conteggi di questa pagina sono letti dagli stessi file di dati delle pagine che descrivono'], ['ours', 'il raggruppamento dei rami in lenti e filoni è una nostra lettura'], ['open', 'i passi successivi sono piani, non risultati']]
      },
      ask: {
        h: 'Chiedi al modello',
        does: 'La guida risponde dagli stessi assiomi e dallo stesso audit. Dichiara lo stato di ogni affermazione e dice “aperto” dove è la risposta onesta.',
        before: `Hai visto la regola, l’atlante, due prove, ${numWord('it', stepCount('shapes'))} passi di forme e ${numWord('it', stepCount('eq'))} passi di equazioni, e la mappa.`,
        after: '',
        tags: [['open', 'non è stata provata dal vivo su ogni domanda']]
      }
    },
    hero: {
      'Young Learner': ['Una regola di interruttori, quattro modi di vederla.', 'Gli interruttori sono accesi o spenti. Gira due gruppi insieme e ottieni un nuovo gruppo. Disegniamo questa regola in quattro modi, poi la proviamo sulla luce e sulle particelle.'],
      Physicist: ['Una regola di bit, letta in quattro modi.', 'Le lame sono schemi di bit e i loro prodotti sono XOR sulle etichette. Disegniamo la regola come algebra, simplesso, cubo e numeri, poi la proviamo su due teorie note.'],
      Mathematician: ['Un’algebra, quattro linguaggi di coordinate.', 'Lame di Clifford come maschere di bit con prodotto dato dallo XOR a meno del segno; una struttura di incidenza disegnata come dati di Peirce, facce di simplesso, vertici del cubo ed etichette intere, poi verificata su Maxwell in Cl(k,d) e sul modello di Furey in Cl(0,8).']
    },
    note: 'Matematica standard, riletta. Nostra è la lettura, non l’algebra. Ogni affermazione ha uno stato: verificato, standard, nostro o aperto. Non è una teoria fisica sottoposta a revisione paritaria.',
    metric: { Spatial: ['Spazio +', 'Lettura 1: i generatori con quadrato +1 sono spazio'], Temporal: ['Tempo +', 'Lettura 2: la lettura speculare, con i ruoli di tempo e spazio scambiati (vedi Prova 1)'] }
  }
};

