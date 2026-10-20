import K from './yangmillsData.js';

// Copy for step 4 of the equations page: Yang–Mills on the bit rule, gauge dimension m = 2 to 8 (English and Italian).
// Every number is read from selfcheck/yangmills.json (exact, standard library) and selfcheck/yangmills_matrix.json (numpy).
const L = K.ym.ladder, ST = K.ym.spacetime, MR = K.ym.maxwell_reduction, SP = K.ym.so4_split;
export const gname = mask => { let s = ''; for (let i = 0; i < 12; i++) if (mask >> i & 1) s += (i + 1); return s; };
export const gensOf = m => { const g = []; for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) g.push((1 << i) | (1 << j)); return g; };
const pc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
export const graphEdges = m => { const g = gensOf(m), e = []; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (pc(g[i] & g[j]) === 1) e.push([g[i], g[j]]); return e; };
const pe = (k, one, many) => (k === 1 ? one : many);
const STD = { 2: 'u(1)', 3: 'su(2)', 4: 'su(2) + su(2)', 5: 'sp(2)', 6: 'su(4)', 7: 'so(7)', 8: 'so(8)' };
const eqt = m => 3 * (2 * m - 3);                                   // terms per equation component in 4 space-time dimensions: (n−1)(2m−3)
const merr = Object.values(K.matrix.max_error_field_strength).every(x => x === 0) ? '0' : '< 1e-9';

const COPY = {
  en: { std: STD, eqt,
    title: 'Yang–Mills: the commutator graph becomes the gauge algebra',
    lede: 'Maxwell’s field strength is F = ∂A − ∂A. Give A a value in an algebra that does not commute and one term appears: F = ∂A − ∂A + g[A, A]. Step 1 already drew such an algebra: the bivectors of m generators, with the commutator rule of the bits. Here we use it as the gauge algebra. We climb from m = 2, the single bivector that commutes with itself, which is Maxwell, up to m = 8, with space-time fixed at one time and three space axes. A second table then varies the space-time dimension.',
    numbers: 'Exact arithmetic for m = 2 to 8; the identities are tested on random polynomial fields for the (gauge, space-time) pairs listed below; explicit matrices (numpy) for m = 2 to 6.',
    tableH: 'The ladder (space-time 1 + 3)', cols: ['m', 'generators', 'pairs that do not commute', 'pairs that commute', 'closed triangles', 'neighbours of each generator', 'F components', 'quadratic terms in each F', 'terms in each equation', 'also known as'],
    pickH: 'Pick a gauge dimension', pick: 'm generators of the underlying algebra Cl(0,m)',
    graphH: 'The gauge algebra as a graph', graphCap: m => `${L[m].gens} generators, one per pair of indices, on a circle. A line joins two generators that do not commute (${L[m].noncommuting_pairs} lines). Click a generator to see its neighbours and what their commutators are.${m === 2 ? ' With one generator there is nothing to join.' : ''}`,
    selCap: (name, list) => `${name}: ${list.length} neighbour${pe(list.length, '', 's')}. ${list.map(([b, c]) => `[${name}, ${b}] = ±2 ${c}`).join('; ')}.`, selNone: 'No generator selected.',
    viewsH: m => `Every view at m = ${m}`,
    views: r => {
      const m = r.m_value;
      const cl = { h: 'Clifford', t: `Cl(0,${m}) is ${r.algebra_cell}; its even half is ${r.even_half}. ${m === 2 ? 'The single bivector spans a one-dimensional subspace of the even half and commutes with itself. It generates spin(2), the double cover of so(2) = u(1) (standard).' : `The ${r.gens} bivectors span a subspace of the even half and close under the commutator. They generate spin(${m}), the double cover of so(${m}) (standard).`}`, tags: ['checked', 'standard'] };
      const cu = { h: 'Demicube and cube', t: m === 2 ? 'There is one bivector, a single vertex of grade 2 in the 2-demicube. It has no neighbour that does not commute.' : `The generators are the grade-2 vertices of the ${m}-demicube (even corners of the ${m}-cube with two bits set). Two of them do not commute exactly when they share one index, which is a demicube edge between grade-2 vertices: ${r.noncommuting_pairs} of them, the ‘2–2’ edges of the shapes page.${m === 4 ? ' At m = 4 this is the octahedral equator of the 16-cell: 6 vertices, 12 edges, and the 3 commuting pairs are antipodes.' : ''}${m === 3 ? ' At m = 3 the three bivectors form a face of the tetrahedron; the fourth vertex is the scalar.' : ''}`, tags: ['checked'] };
      const si = { h: 'Simplex', t: m < 3 ? 'There is no index triple, so no triangle.' : `Every triple of indices is a closed triangle of generators with [B₁₂, B₂₃] = ±2 B₁₃ and its cyclic partners: ${r.triangles} triangle${pe(r.triangles, '', 's')}, each a copy of so(3). Every pair that does not commute lies in exactly one triangle, and each generator has ${r.neighbours_of_each_generator} neighbours, two for each of the other ${m - 2} indices.`, tags: ['checked', 'ours'] };
      const la = { h: 'Labels', t: `${r.labels ? `The generator${pe(r.gens, ' has label', 's have labels')} ${r.labels.join(', ')} (${pe(r.gens, 'the mask', 'masks')} of the pair${pe(r.gens, '', 's')} of indices).` : 'Eight or more generators have too many labels to list.'} A commutator is the label of the symmetric difference. Labels are notation.`, tags: ['checked'] };
      const ma = { h: 'Maxwell', t: m === 2 ? `One generator, no cubic term: the system is Maxwell’s. In 4D the equation has ${MR[4].vector_terms} terms and the Bianchi identity ${MR[4].bianchi_terms}, together ${MR[4].total}, which equals the Maxwell incidences n·C(n,2). This holds for every space-time dimension from 2 to 7.` : `Each of the ${r.gens} generators carries its own Maxwell block (24 incidences in 4D, ${24 * r.gens} in all). On top of that come ${r.equation_gauge_terms} gauge terms in the equation and ${r.bianchi_gauge_terms} in the Bianchi identity. Each field component F gains ${r.quadratic_terms_per_F_component} quadratic terms A·A.`, tags: ['checked'] };
      const co = { h: 'Coupling (step 3)', t: m === 2 ? 'In step 3 the phase generator J = γ₂γ₁ squares to −1, like this B₁₂ in Cl(0,2). There J is a space-time bivector acting from the right and here the generator is an internal one; the two are not identified.' : 'Matter charged under these generators is not drawn. The coupling of step 3 is the abelian case only. How the field ψ would transform under so(m) is open.', tags: [m === 2 ? 'checked' : 'open'] };
      const out = [cl, cu, si, la, ma, co];
      if (m === 4) out.splice(3, 0, { h: 'Splitting', t: `so(4) splits into two commuting sets of three generators: B₁₂ ± B₃₄, B₁₃ ∓ B₂₄, B₁₄ ± B₂₃ (with the signs found by the check). Each set closes on itself and commutes with the other, which is su(2) + su(2) (standard). The octahedron is connected, so the split is a change of basis, not a gap in the graph.`, tags: ['checked', 'standard'] });
      return out;
    },
    stH: 'Space-time dimension, at m = 3 (su(2))', stCols: ['space-time n', 'F components', 'equations', 'terms in each equation', 'Bianchi equations', 'terms in each Bianchi equation'],
    stNote: 'A component of the equation D^μF_{μν} has (n − 1)(2m − 3) terms; a Bianchi equation has 3(2m − 3). At n = 2 there is no Bianchi equation.',
    idH: 'Exact identities (random polynomial fields)', idCols: ['gauge m', 'space-time n', 'Bianchi', 'gauge covariance (first order)', 'covariant conservation'],
    idNote: 'Bianchi: D_λF_{μν} + D_μF_{νλ} + D_νF_{λμ} = 0, which needs the Jacobi identity of the bit rule. Covariance: with A → A + Dλ the field strength changes by g[F, λ]. Conservation: D^μF_{μν} = J_ν forces D^νJ_ν = 0 whatever A is, so a source must be covariantly conserved. In Maxwell the same fact reads ∂·J = 0.',
    xrH: 'What each view teaches the others',
    xr: [
      ['checked', 'Step 1 → Yang–Mills. The commutator graph is the structure of the gauge algebra, and its closed triangles are the so(3) subalgebras. Nothing was added to the bit rule.'],
      ['checked', 'Maxwell → Yang–Mills. m = 2 gives exactly Maxwell’s incidences. For m ≥ 3 the only new terms are the commutator terms: 2(m − 2) quadratic terms per field component and (n − 1)(2m − 3) terms per equation.'],
      ['checked', 'Cube → Yang–Mills. The generators and their commutator pairs are corners and edges of the demicube that the shapes page already counted: the number of ‘2–2’ edges equals the number of terms that do not vanish in [B, B].'],
      ['standard', 'This is the textbook Yang–Mills system with gauge algebra so(m). We rebuilt its structure constants from the bit rule and checked the identities. Nothing here is new.']
    ],
    matH: 'Independent check with matrices',
    mat: `The generators act on the m-dimensional vector space as real antisymmetric matrices (numpy). The commutator of the matrices equals the bit-rule commutator, the component field strength equals the matrix field strength ∂A − ∂A + g[A, A], and the Bianchi identity holds for m = 2 to 6 (largest error ${merr}). Two wrong versions fail: one structure constant with the wrong sign, and the wrong sign of g in the covariant derivative.`,
    open: [
      ['open', 'Matter charged under so(m), and the coupling constant g. The system is drawn and its identities are checked; no action is rebuilt and no solution is computed.'],
      ['open', 'Which gauge algebra, if any, the model uses. so(m) is one choice whose structure the bit rule gives for free; other Lie algebras are not covered.'],
      ['open', 'Gravity is still not drawn. Nothing here selects three generations.']
    ],
    dl: { h: 'Check it yourself', text: 'Two Python files. The first (standard library only) rebuilds the structure constants, the counts and the three identities, exactly. The second (needs numpy) compares with explicit matrices and runs two wrong versions that must fail.', py: 'Download yangmills_selfcheck.py', py2: 'Download yangmills_matrix_check.py', json: 'Download yangmills.json', cmd: 'python3 yangmills_selfcheck.py --compare yangmills.json   ·   python3 yangmills_matrix_check.py --compare yangmills_matrix.json' }
  },
  it: { std: STD, eqt,
    title: 'Yang–Mills: il grafo dei commutatori diventa l’algebra di gauge',
    lede: 'L’intensità di campo di Maxwell è F = ∂A − ∂A. Se A prende valore in un’algebra che non commuta compare un solo termine in più: F = ∂A − ∂A + g[A, A]. Il passo 1 ha già disegnato un’algebra così: i bivettori di m generatori, con la regola dei commutatori dei bit. Qui la usiamo come algebra di gauge. Saliamo da m = 2, l’unico bivettore che commuta con se stesso, cioè Maxwell, fino a m = 8, con lo spazio-tempo fisso a un asse di tempo e tre di spazio. Una seconda tabella fa poi variare la dimensione dello spazio-tempo.',
    numbers: 'Aritmetica esatta per m = 2…8; le identità sono provate su campi polinomiali casuali per le coppie (gauge, spazio-tempo) elencate sotto; matrici esplicite (numpy) per m = 2…6.',
    tableH: 'La scala (spazio-tempo 1 + 3)', cols: ['m', 'generatori', 'coppie che non commutano', 'coppie che commutano', 'triangoli chiusi', 'vicini di ogni generatore', 'componenti di F', 'termini quadratici in ogni F', 'termini in ogni equazione', 'noto anche come'],
    pickH: 'Scegli una dimensione di gauge', pick: 'm generatori dell’algebra sottostante Cl(0,m)',
    graphH: 'L’algebra di gauge come grafo', graphCap: m => `${L[m].gens} generator${pe(L[m].gens, 'e', 'i')}, uno per coppia di indici, su un cerchio. Una linea unisce due generatori che non commutano (${L[m].noncommuting_pairs} linee). Clicca un generatore per vedere i suoi vicini e quali sono i loro commutatori.${m === 2 ? ' Con un solo generatore non c’è nulla da unire.' : ''}`,
    selCap: (name, list) => `${name}: ${list.length} vicin${pe(list.length, 'o', 'i')}. ${list.map(([b, c]) => `[${name}, ${b}] = ±2 ${c}`).join('; ')}.`, selNone: 'Nessun generatore selezionato.',
    viewsH: m => `Tutte le viste a m = ${m}`,
    views: r => {
      const m = r.m_value;
      const cl = { h: 'Clifford', t: `Cl(0,${m}) è ${r.algebra_cell}; la sua metà pari è ${r.even_half}. ${m === 2 ? 'Il bivettore singolo genera un sottospazio di dimensione uno della metà pari e commuta con se stesso. Genera spin(2), il rivestimento doppio di so(2) = u(1) (standard).' : `I ${r.gens} bivettori generano un sottospazio della metà pari e si chiudono sotto il commutatore. Generano spin(${m}), il rivestimento doppio di so(${m}) (standard).`}`, tags: ['checked', 'standard'] };
      const cu = { h: 'Demicubo e cubo', t: m === 2 ? 'C’è un solo bivettore, un unico vertice di grado 2 nel 2-demicubo. Non ha vicini che non commutano.' : `I generatori sono i vertici di grado 2 del ${m}-demicubo (vertici pari del ${m}-cubo con due bit accesi). Due di essi non commutano esattamente quando condividono un indice, cioè uno spigolo del demicubo tra vertici di grado 2: ${r.noncommuting_pairs} spigoli, gli spigoli ‘2–2’ della pagina delle forme.${m === 4 ? ' A m = 4 è l’equatore ottaedrico della 16-cella: 6 vertici, 12 spigoli, e le 3 coppie che commutano sono antipodi.' : ''}${m === 3 ? ' A m = 3 i tre bivettori formano una faccia del tetraedro; il quarto vertice è lo scalare.' : ''}`, tags: ['checked'] };
      const si = { h: 'Simplesso', t: m < 3 ? 'Non c’è nessuna terna di indici, quindi nessun triangolo.' : `Ogni terna di indici è un triangolo chiuso di generatori con [B₁₂, B₂₃] = ±2 B₁₃ e i suoi partner ciclici: ${r.triangles} triangol${pe(r.triangles, 'o', 'i')}, ciascuno una copia di so(3). Ogni coppia che non commuta sta in un solo triangolo, e ogni generatore ha ${r.neighbours_of_each_generator} vicini, due per ciascuno degli altri ${m - 2} indici.`, tags: ['checked', 'ours'] };
      const la = { h: 'Etichette', t: `${r.labels ? `${pe(r.gens, 'Il generatore ha', 'I generatori hanno')} ${pe(r.gens, 'etichetta', 'etichette')} ${r.labels.join(', ')} (${pe(r.gens, 'la maschera della coppia', 'maschere delle coppie')} di indici).` : 'Otto o più generatori hanno troppe etichette per elencarle.'} Un commutatore è l’etichetta della differenza simmetrica. Le etichette sono solo notazione.`, tags: ['checked'] };
      const ma = { h: 'Maxwell', t: m === 2 ? `Un generatore, nessun termine cubico: il sistema è quello di Maxwell. In 4D l’equazione ha ${MR[4].vector_terms} termini e l’identità di Bianchi ${MR[4].bianchi_terms}, insieme ${MR[4].total}, uguale alle incidenze di Maxwell n·C(n,2). Vale per ogni dimensione dello spazio-tempo da 2 a 7.` : `Ognuno dei ${r.gens} generatori porta il suo blocco di Maxwell (24 incidenze in 4D, ${24 * r.gens} in tutto). In più ci sono ${r.equation_gauge_terms} termini di gauge nell’equazione e ${r.bianchi_gauge_terms} nell’identità di Bianchi. Ogni componente di F guadagna ${r.quadratic_terms_per_F_component} termini quadratici A·A.`, tags: ['checked'] };
      const co = { h: 'Accoppiamento (passo 3)', t: m === 2 ? 'Nel passo 3 il generatore di fase J = γ₂γ₁ ha quadrato −1, come questo B₁₂ in Cl(0,2). Lì J è un bivettore dello spazio-tempo che agisce da destra e qui il generatore è interno; i due non sono identificati.' : 'La materia carica sotto questi generatori non è disegnata. L’accoppiamento del passo 3 è solo il caso abeliano. Come ψ si trasformerebbe sotto so(m) è aperto.', tags: [m === 2 ? 'checked' : 'open'] };
      const out = [cl, cu, si, la, ma, co];
      if (m === 4) out.splice(3, 0, { h: 'Scissione', t: 'so(4) si divide in due insiemi di tre generatori che commutano tra loro: B₁₂ ± B₃₄, B₁₃ ∓ B₂₄, B₁₄ ± B₂₃ (con i segni trovati dal controllo). Ogni insieme si chiude su se stesso e commuta con l’altro: è su(2) + su(2) (standard). L’ottaedro è connesso, quindi la scissione è un cambio di base, non un vuoto nel grafo.', tags: ['checked', 'standard'] });
      return out;
    },
    stH: 'Dimensione dello spazio-tempo, a m = 3 (su(2))', stCols: ['spazio-tempo n', 'componenti di F', 'equazioni', 'termini in ogni equazione', 'equazioni di Bianchi', 'termini in ogni equazione di Bianchi'],
    stNote: 'Una componente dell’equazione D^μF_{μν} ha (n − 1)(2m − 3) termini; un’equazione di Bianchi ne ha 3(2m − 3). A n = 2 non c’è nessuna equazione di Bianchi.',
    idH: 'Identità esatte (campi polinomiali casuali)', idCols: ['gauge m', 'spazio-tempo n', 'Bianchi', 'covarianza di gauge (primo ordine)', 'conservazione covariante'],
    idNote: 'Bianchi: D_λF_{μν} + D_μF_{νλ} + D_νF_{λμ} = 0, che richiede l’identità di Jacobi della regola dei bit. Covarianza: con A → A + Dλ l’intensità di campo cambia di g[F, λ]. Conservazione: D^μF_{μν} = J_ν impone D^νJ_ν = 0 qualunque sia A, quindi una sorgente deve essere conservata in modo covariante. In Maxwell lo stesso fatto si scrive ∂·J = 0.',
    xrH: 'Che cosa ogni vista insegna alle altre',
    xr: [
      ['checked', 'Passo 1 → Yang–Mills. Il grafo dei commutatori è la struttura dell’algebra di gauge, e i suoi triangoli chiusi sono le sottoalgebre so(3). Alla regola dei bit non è stato aggiunto niente.'],
      ['checked', 'Maxwell → Yang–Mills. m = 2 dà esattamente le incidenze di Maxwell. Per m ≥ 3 gli unici termini nuovi sono quelli di commutatore: 2(m − 2) termini quadratici per componente del campo e (n − 1)(2m − 3) termini per equazione.'],
      ['checked', 'Cubo → Yang–Mills. I generatori e le loro coppie di commutatori sono vertici e spigoli del demicubo che la pagina delle forme aveva già contato: il numero di spigoli ‘2–2’ è uguale al numero di termini che non si annullano in [B, B].'],
      ['standard', 'È il sistema di Yang–Mills da manuale con algebra di gauge so(m). Abbiamo ricostruito le sue costanti di struttura dalla regola dei bit e controllato le identità. Niente qui è nuovo.']
    ],
    matH: 'Controllo indipendente con matrici',
    mat: `I generatori agiscono sullo spazio vettoriale di dimensione m come matrici reali antisimmetriche (numpy). Il commutatore delle matrici coincide con il commutatore della regola dei bit, l’intensità di campo a componenti coincide con quella a matrici ∂A − ∂A + g[A, A], e l’identità di Bianchi vale per m = 2…6 (errore massimo ${merr}). Due versioni sbagliate falliscono: una costante di struttura con il segno sbagliato, e il segno sbagliato di g nella derivata covariante.`,
    open: [
      ['open', 'La materia carica sotto so(m), e la costante di accoppiamento g. Il sistema è disegnato e le sue identità sono controllate; non abbiamo ricostruito un’azione né calcolato soluzioni.'],
      ['open', 'Quale algebra di gauge, se c’è, usi il modello. so(m) è una scelta di cui la regola dei bit dà la struttura gratis; altre algebre di Lie non sono coperte.'],
      ['open', 'La gravità non è ancora disegnata. Niente qui sceglie tre generazioni.']
    ],
    dl: { h: 'Verificalo tu', text: 'Due file Python. Il primo (solo libreria standard) ricostruisce le costanti di struttura, i conteggi e le tre identità, esattamente. Il secondo (richiede numpy) confronta con matrici esplicite e fa girare due versioni sbagliate che devono fallire.', py: 'Scarica yangmills_selfcheck.py', py2: 'Scarica yangmills_matrix_check.py', json: 'Scarica yangmills.json', cmd: 'python3 yangmills_selfcheck.py --compare yangmills.json   ·   python3 yangmills_matrix_check.py --compare yangmills_matrix.json' }
  }
};
export default COPY;
