import K from './forqueData.js';
import { ROWS_IT, CONV_IT } from './forqueRowsIt.js';

// Copy for step 10 of the equations page: the Forque paper's equations on the bit rule, with a translation matrix (English and Italian).
// Every count is read from selfcheck/forque.json (exact, standard library) and selfcheck/forque_matrix.json (numpy); nothing is typed in by hand.
const C = K.fq.counts, FM = K.fqm, P = K.fq.paper;
export const PAPER_URL = P.home;
export const PAPER_CITE = lang => (lang === 'it' ? `${P.authors.join(' e ')}, «${P.title}», v${P.version}, ${P.pages} pagine` : `${P.authors.join(' and ')}, “${P.title}”, v${P.version}, ${P.pages} pages`);
export const ids = K.fq.rows.map(r => r.id);
// the text of a row in a language: Italian from forqueRowsIt.js, English from the data
export const rowText = (lang, r) => (lang === 'it' ? { paper: ROWS_IT[r.id]?.paper ?? '', how: ROWS_IT[r.id]?.how ?? '', note: ROWS_IT[r.id]?.note ?? '', remark: ROWS_IT[r.id]?.remark ?? '' } : { paper: r.paper, how: r.how, note: r.note, remark: r.remark });
export const convText = (lang, c, i) => (lang === 'it' ? { theirs: CONV_IT[i].theirs ?? c.theirs, ours: CONV_IT[i].ours, note: CONV_IT[i].note } : c);
const fmt = x => x.toExponential(0);
const worstNum = Math.max(FM.free_top.position_error, FM.gravity_top.position_error, FM.initial_pose_error, FM.motor_manifold_residual, FM.spherical_top.motor_error, FM.symmetric_top.motor_error, FM.conservation.momentum_drift);

const COPY = {
  en: {
    f: {
      title: 'Forque dynamics: force and torque as one line, and a translation matrix for the authors',
      lede: `This step is written for the authors of one paper as much as for the reader. ${P.authors.join(' and ')}, “${P.title}” (v${P.version}), write rigid-body dynamics in plane-based projective geometric algebra: a motor M moves the body, the body-frame velocity is one bivector B (rotation and translation together), momentum is P = I[B], force and torque form a single line, the “forque” F, and all of Newton and Euler is Ṗ = F and Ḃ = I⁻¹[B×I[B]+F]. We translate their algebra to the bit rule (bit 0 is ε with square 0, bits 1…d have square +1) and check their main equations on it with exact rational arithmetic, as formal power series in time. The matrix below sets the paper’s equation, ours, a one-line check and a worked instance side by side, so that any row can be re-run and seen to agree or not. This is checking someone else’s equations, not a physical claim of ours; where our computation reads differently from the printed line we say so and show the line. Only this one paper has been read.`,
      linesH: 'The four lines of the dynamics (Table 2.1 of the paper)',
      linesCap: 'Each line is followed by the rows of the matrix that check it; click a row number to jump to it.',
      lines: [
        { h: 'Motion', tex: String.raw`\dot M=-\tfrac12M\mathbb B_b`, say: 'The motor changes at a rate set by the body-frame velocity bivector.', rows: ['F11', 'F12', 'F13'] },
        { h: 'Momentum', tex: String.raw`P=\mathsf I_b[\mathbb B_b]=\sum_i m_iX_i\vee\dot X_i`, say: 'Momentum is a line, found from the velocity by the inertia map.', rows: ['F16', 'F18', 'F19', 'F20'] },
        { h: 'Forque', tex: String.raw`F=\mathbf f\cdot Q=\mathbf f\cdot R-\mathbf T_R\mathcal I`, say: 'A force at a point and its torque about another point are one line.', rows: ['F24'] },
        { h: 'Dynamics', tex: String.raw`\dot P=F\ \Longleftrightarrow\ \dot{\mathbb B}_b=\mathsf I_b^{-1}[\mathbb B_b\times\mathsf I_b[\mathbb B_b]+F_b]`, say: 'One equation holds Newton’s law and Euler’s law together.', rows: ['F25', 'F26', 'F27'] },
      ],
      mxH: 'The translation matrix', mxLede: 'One row per equation of the paper. Click a row to open its worked instance, its one-line check, how it was checked, and any note. “Agrees exactly” means the exact computation gives the printed line; “printed line differs” means it agrees after the correction written in the note.',
      mxCount: (shown, all) => `${shown} of ${all} rows`,
      filterLbl: 'Show', filters: { all: 'all', ok: 'agrees exactly', note: 'printed line differs', nc: 'not checked' },
      searchPh: 'search by equation number, page or word', searchLbl: 'Search the matrix',
      cols: ['row', 'where in the paper', 'status'],
      labels: { paper: 'In the paper', ours: 'On the bit rule', worked: 'Worked instance', how: 'How it was checked', note: 'Note', remark: 'Remark', code: 'One-line check', dims: 'dimensions', page: 'page', lhs: 'left side', rhs: 'right side', equal: 'equal', callNote: 'a function of forque_selfcheck.py that runs the exact check and raises if it fails', exprNote: 'an expression that must be True', cmd: 'Re-run just this row', copy: 'Copy', copied: 'Copied', open: 'Open', close: 'Close', nothing: 'No row matches.', noInst: 'no single worked instance: the check runs a whole series (see the one-line check)', extra: 'Raw check data' },
      status: { ok: 'agrees exactly', note: 'printed line differs', nc: 'not checked' },
      convH: 'Conventions: their symbols, ours', convLede: 'How the paper’s symbols sit on the bit rule. Their e0 is our bit 0. A product like e31 is minus our ascending mask, and the viewer prints the paper’s names.', convCols: ['paper', 'bit rule', 'note'],
      authH: 'For the authors: lines that read differently in our check',
      authLede: `${C.note} lines of the paper and ${C.remarks} remark do not come out letter for letter in our exact computation. Each may be a typo, a sign convention we have not matched, or an error of ours; the matrix row shows the check, so it can be judged. We list them as a courtesy, not as criticism. The same list can be downloaded as a text file.`,
      authKind: { slip: 'reads differently', remark: 'remark' }, authGo: 'Open the row',
      racketH: 'Try it: the tennis racket', racketLede: 'Euler’s equations of a free body, I_C[Ḃ] = B × I_C[B] (eq. B.18, row F34), integrated here in your browser. Spin about the middle axis and a tiny disturbance grows; spin about the largest or smallest and it only wobbles. The computed growth rate is compared with the formula √((i_mid−i_min)(i_max−i_mid)/(i_max·i_min)).',
      racketSl: ['i₁', 'i₂', 'i₃'],
      racketOut: r => r.lam > 1e-3
        ? [`Spin about axis ${r.m + 1} (the middle inertia). Predicted growth rate ${r.lam.toFixed(4)} per unit spin; measured ${r.measured === null ? '—' : r.measured.toFixed(4)}.`, `Energy drift ${r.energyDrift.toExponential(1)}, |L| drift ${r.momentumDrift.toExponential(1)} (relative, over the whole run).`]
        : ['Two inertias are equal: a symmetric top has no middle axis and the spin stays steady.', `Energy drift ${r.energyDrift.toExponential(1)}, |L| drift ${r.momentumDrift.toExponential(1)}.`],
      racketCap: 'The three curves are the components ω₁, ω₂, ω₃ of the spin (B₂₃, B₃₁, B₁₂); time runs to the right.',
      numH: 'The numerical cross-check', num: `A second script (needs numpy) represents the algebra by 4×4 matrices, steps the full equation of motion with RK4 and compares it with the classical Newton–Euler equations of a free and of a heavy body: the positions agree to ${fmt(worstNum)} or better, momentum is conserved, the spherical and symmetric closed forms of the paper are reproduced, and three wrong versions of the equation (no Coriolis term, wrong sign, wrong factor) fail as they must. The tennis-racket rate in that script is ${FM.tennis_racket.measured_rate_middle_axis.toFixed(6)} against the predicted ${FM.tennis_racket.predicted_rate.toFixed(6)}.`,
      atlasH: 'In the atlas signature', atlas: `The atlas rule gives space axes the square −1, the paper’s base has +1. The law of motion Ṗ = F was also checked with squares −1 (${K.fq.atlas_signature.cases.join('; ')}); the energy then changes sign, which we have not interpreted.`,
      open: [
        ['checked', `Every row marked “agrees” or “printed line differs” is reproduced by exact arithmetic, as power series in time through orders 5 to 7 (${C.ok} agree exactly, ${C.note} after a noted correction).`],
        ['standard', 'The equations themselves are the paper’s; the bit-rule product, the join as the inverse star of the wedge of stars, and Newton–Euler are textbook.'],
        ['ours', 'Putting these equations on the bit rule, and reading the extra bit 0 as the null generator of step 9, is our translation.'],
        ['open', `Not checked: ${C.not_checked} items (the Lagrangian form 2.38, constrained motion 2.9, the code figures, the closed forms of exp and log, the exercises). Each is listed in the matrix with the reason.`],
        ['open', 'The paper has no conformal dynamics, and we have not read the other authors working on this subject (Dechant, Roelfs, Eelbode, Holmer, the Lasenbys and Doran). Newton’s law in conformal space is a separate question.']
      ],
      dl: { h: 'Check it yourself', text: 'Two Python files and the data. The first (standard library only, a few seconds) rebuilds every row exactly and can show a single row with its one-line check. The second (needs numpy) is the matrix cross-check. The notes file is the list above, ready to send.', py: 'Download forque_selfcheck.py', py2: 'Download forque_matrix_check.py', json: 'Download forque.json', notes: 'Download the notes for the authors', cmd: 'python3 forque_selfcheck.py --compare forque.json   ·   python3 forque_selfcheck.py --row F20   ·   python3 forque_matrix_check.py', link: 'The paper', linkText: `${PAPER_CITE('en')}, at ${PAPER_URL}` },
      notesHead: 'Notes for the authors of “May the Forque Be with You”', notesIntro: `From an exact re-computation of ${C.rows} equations on a bit-rule implementation of Cl(d,0,1) (power series in t, rational arithmetic). Where a printed line reads differently from our computation we give the line and our reading. Any of these may be our error.`, notesRow: 'row'
    }
  },
  it: {
    f: {
      title: 'Dinamica del forque: forza e coppia come una sola riga, e una matrice di traduzione per gli autori',
      lede: `Questo passo è scritto per gli autori di un articolo almeno quanto per il lettore. ${P.authors.join(' e ')}, «${P.title}» (v${P.version}), scrivono la dinamica del corpo rigido nell’algebra geometrica proiettiva basata sui piani: un motore M muove il corpo, la velocità nel riferimento del corpo è un solo bivettore B (rotazione e traslazione insieme), la quantità di moto è P = I[B], forza e coppia formano un’unica retta, il «forque» F, e tutto Newton ed Eulero è Ṗ = F e Ḃ = I⁻¹[B×I[B]+F]. Traduciamo la loro algebra nella regola dei bit (il bit 0 è ε di quadrato 0, i bit 1…d hanno quadrato +1) e controlliamo le loro equazioni principali con aritmetica razionale esatta, come serie formali di potenze nel tempo. La matrice qui sotto mette affiancati l’equazione dell’articolo, la nostra, un controllo di una riga e un esempio svolto, così che ogni riga si può rieseguire e vedere se torna. È il controllo di equazioni altrui, non un’affermazione fisica nostra; dove il nostro calcolo legge diversamente dalla riga stampata lo diciamo e mostriamo la riga. È stato letto solo questo articolo.`,
      linesH: 'Le quattro righe della dinamica (Tabella 2.1 dell’articolo)',
      linesCap: 'Ogni riga è seguita dalle righe della matrice che la controllano; clicca un numero di riga per saltarci.',
      lines: [
        { h: 'Moto', tex: String.raw`\dot M=-\tfrac12M\mathbb B_b`, say: 'Il motore cambia con una velocità fissata dal bivettore della velocità nel riferimento del corpo.', rows: ['F11', 'F12', 'F13'] },
        { h: 'Quantità di moto', tex: String.raw`P=\mathsf I_b[\mathbb B_b]=\sum_i m_iX_i\vee\dot X_i`, say: 'La quantità di moto è una retta, ricavata dalla velocità con la mappa d’inerzia.', rows: ['F16', 'F18', 'F19', 'F20'] },
        { h: 'Forque', tex: String.raw`F=\mathbf f\cdot Q=\mathbf f\cdot R-\mathbf T_R\mathcal I`, say: 'Una forza in un punto e la sua coppia rispetto a un altro punto sono un’unica retta.', rows: ['F24'] },
        { h: 'Dinamica', tex: String.raw`\dot P=F\ \Longleftrightarrow\ \dot{\mathbb B}_b=\mathsf I_b^{-1}[\mathbb B_b\times\mathsf I_b[\mathbb B_b]+F_b]`, say: 'Una sola equazione contiene insieme la legge di Newton e quella di Eulero.', rows: ['F25', 'F26', 'F27'] },
      ],
      mxH: 'La matrice di traduzione', mxLede: 'Una riga per ogni equazione dell’articolo. Clicca una riga per aprire il suo esempio svolto, il controllo di una riga, come è stata verificata ed eventuali note. «Torna esattamente» vuol dire che il calcolo esatto dà la riga stampata; «la riga stampata differisce» vuol dire che torna dopo la correzione scritta nella nota.',
      mxCount: (shown, all) => `${shown} righe su ${all}`,
      filterLbl: 'Mostra', filters: { all: 'tutte', ok: 'torna esattamente', note: 'la riga stampata differisce', nc: 'non verificate' },
      searchPh: 'cerca per numero di equazione, pagina o parola', searchLbl: 'Cerca nella matrice',
      cols: ['riga', 'dove nell’articolo', 'stato'],
      labels: { paper: 'Nell’articolo', ours: 'Sulla regola dei bit', worked: 'Esempio svolto', how: 'Come è stata verificata', note: 'Nota', remark: 'Osservazione', code: 'Controllo di una riga', dims: 'dimensioni', page: 'pagina', lhs: 'primo membro', rhs: 'secondo membro', equal: 'uguali', callNote: 'una funzione di forque_selfcheck.py che esegue il controllo esatto e dà errore se fallisce', exprNote: 'un’espressione che deve essere True', cmd: 'Riesegui solo questa riga', copy: 'Copia', copied: 'Copiato', open: 'Apri', close: 'Chiudi', nothing: 'Nessuna riga corrisponde.', noInst: 'nessun esempio singolo: il controllo esegue un’intera serie (vedi il controllo di una riga)', extra: 'Dati grezzi del controllo' },
      status: { ok: 'torna esattamente', note: 'la riga stampata differisce', nc: 'non verificata' },
      convH: 'Convenzioni: i loro simboli, i nostri', convLede: 'Come i simboli dell’articolo stanno sulla regola dei bit. Il loro e0 è il nostro bit 0. Un prodotto come e31 è meno la nostra maschera ascendente, e il visualizzatore stampa i nomi dell’articolo.', convCols: ['articolo', 'regola dei bit', 'nota'],
      authH: 'Per gli autori: righe che nel nostro controllo si leggono diversamente',
      authLede: `${C.note} righe dell’articolo e ${C.remarks} osservazione non escono lettera per lettera dal nostro calcolo esatto. Ognuna può essere un refuso, una convenzione di segno che non abbiamo riprodotto, o un errore nostro; la riga della matrice mostra il controllo, così si può giudicare. Le elenchiamo come cortesia, non come critica. Lo stesso elenco si può scaricare come file di testo.`,
      authKind: { slip: 'si legge diversamente', remark: 'osservazione' }, authGo: 'Apri la riga',
      racketH: 'Prova: la racchetta da tennis', racketLede: 'Le equazioni di Eulero di un corpo libero, I_C[Ḃ] = B × I_C[B] (eq. B.18, riga F34), integrate qui nel tuo browser. Con rotazione attorno all’asse intermedio un piccolo disturbo cresce; attorno al maggiore o al minore oscilla soltanto. Il tasso di crescita calcolato è confrontato con la formula √((i_med−i_min)(i_max−i_med)/(i_max·i_min)).',
      racketSl: ['i₁', 'i₂', 'i₃'],
      racketOut: r => r.lam > 1e-3
        ? [`Rotazione attorno all’asse ${r.m + 1} (l’inerzia intermedia). Tasso di crescita previsto ${r.lam.toFixed(4)} per unità di rotazione; misurato ${r.measured === null ? '—' : r.measured.toFixed(4)}.`, `Deriva dell’energia ${r.energyDrift.toExponential(1)}, deriva di |L| ${r.momentumDrift.toExponential(1)} (relative, su tutta la corsa).`]
        : ['Due inerzie sono uguali: una trottola simmetrica non ha asse intermedio e la rotazione resta costante.', `Deriva dell’energia ${r.energyDrift.toExponential(1)}, deriva di |L| ${r.momentumDrift.toExponential(1)}.`],
      racketCap: 'Le tre curve sono le componenti ω₁, ω₂, ω₃ della rotazione (B₂₃, B₃₁, B₁₂); il tempo scorre verso destra.',
      numH: 'Il controllo numerico', num: `Un secondo script (richiede numpy) rappresenta l’algebra con matrici 4×4, integra l’equazione completa del moto con RK4 e la confronta con le equazioni classiche di Newton–Eulero di un corpo libero e di uno pesante: le posizioni coincidono fino a ${fmt(worstNum)} o meglio, la quantità di moto si conserva, le forme chiuse sferica e simmetrica dell’articolo sono riprodotte, e tre versioni sbagliate dell’equazione (senza termine di Coriolis, segno sbagliato, fattore sbagliato) falliscono come devono. Il tasso della racchetta da tennis in quello script è ${FM.tennis_racket.measured_rate_middle_axis.toFixed(6)} contro il previsto ${FM.tennis_racket.predicted_rate.toFixed(6)}.`,
      atlasH: 'Nella segnatura dell’atlante', atlas: `La regola dell’atlante dà agli assi spaziali il quadrato −1, la base dell’articolo ha +1. La legge del moto Ṗ = F è stata verificata anche con quadrati −1 (${K.fq.atlas_signature.cases.join('; ')}); l’energia cambia allora segno, e non l’abbiamo interpretato.`,
      open: [
        ['checked', `Ogni riga segnata «torna» o «la riga stampata differisce» è riprodotta con aritmetica esatta, come serie di potenze nel tempo fino agli ordini da 5 a 7 (${C.ok} tornano esattamente, ${C.note} dopo una correzione annotata).`],
        ['standard', 'Le equazioni sono quelle dell’articolo; il prodotto della regola dei bit, il join come inversa della stella del wedge delle stelle, e Newton–Eulero sono da manuale.'],
        ['ours', 'Mettere queste equazioni sulla regola dei bit, e leggere il bit 0 in più come il generatore nullo del passo 9, è una nostra traduzione.'],
        ['open', `Non verificati: ${C.not_checked} voci (la forma lagrangiana 2.38, il moto vincolato 2.9, le figure di codice, le forme chiuse di exp e log, gli esercizi). Ciascuna è nella matrice con il motivo.`],
        ['open', 'L’articolo non ha dinamica conforme, e non abbiamo letto gli altri autori che lavorano su questo tema (Dechant, Roelfs, Eelbode, Holmer, i Lasenby e Doran). La legge di Newton nello spazio conforme è una questione a parte.']
      ],
      dl: { h: 'Controllalo da solo', text: 'Due file Python e i dati. Il primo (solo libreria standard, pochi secondi) ricostruisce ogni riga in modo esatto e può mostrare una riga sola con il suo controllo di una riga. Il secondo (richiede numpy) è il controllo con matrici. Il file di note è l’elenco qui sopra, pronto da inviare.', py: 'Scarica forque_selfcheck.py', py2: 'Scarica forque_matrix_check.py', json: 'Scarica forque.json', notes: 'Scarica le note per gli autori', cmd: 'python3 forque_selfcheck.py --compare forque.json   ·   python3 forque_selfcheck.py --row F20   ·   python3 forque_matrix_check.py', link: 'L’articolo', linkText: `${PAPER_CITE('it')}, su ${PAPER_URL}` },
      notesHead: 'Note per gli autori di «May the Forque Be with You»', notesIntro: `Da un ricalcolo esatto di ${C.rows} equazioni su un’implementazione di Cl(d,0,1) sulla regola dei bit (serie di potenze in t, aritmetica razionale). Dove una riga stampata si legge diversamente dal nostro calcolo diamo la riga e la nostra lettura. Ognuna può essere un nostro errore.`, notesRow: 'riga'
    }
  }
};
export default COPY;
