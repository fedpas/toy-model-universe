import S from './shapesData.js';

// Copy for the shapes page (English and Italian). Kept apart from the component so the tests can read it.
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(c => SUP[+c]).join('');
const pow2 = n => `2${sup(n)}`;
const COPY = {
  en: {
    nav: ['Step 1 · Orthoplex', 'Step 2 · Demicube'],
    o: {
      eyebrow: 'STEP 1 · THE ORTHOPLEX', title: 'The orthoplex: every axis gets two poles',
      lede: 'Put a point on each side of the origin on every one of n axes. Their hull is the n-orthoplex. A face is a choice of axes with a pole for each, so it is a signed blade. It is the cube turned inside out: every face of one matches a face of the other, with the sizes swapped.',
      pick: 'Dimension n', tableH: 'The ladder, one step at a time', cols: ['n', 'shape', 'vertices', 'edges', 'facets', 'all faces (with the empty one)', 'Genesis node', 'algebra for n modes'],
      note: 'The budget of 8 is used up at n = 4 (node 8). Past it, Cl(n+4,n+4) = Cl(n,n) ⊗ M₁₆(ℝ): the same cells again, sixteen times bigger. A dash means the count is not defined for that dimension.',
      shapes: ['point', 'segment', 'square', 'octahedron', '16-cell', '5-orthoplex', '6-orthoplex', '7-orthoplex', '8-orthoplex'],
      picH: 'The 2D trick: the Petrie polygon',
      pic: n => n < 2 ? 'Too small to draw as a polygon: a point, then a segment with its two poles.' : `${2 * n} poles on a circle, antipodes opposite, and every pair joined except the antipodes: ${2 * n * (n - 1)} edges. This works for every n. The ${pow2(n)} facets are not drawn.`,
      points: [
        [['checked'], 'Dual of the cube. The 2ⁿ facets match the 2ⁿ corners of the cube, which are our blades, and a face with m vertices matches a cube face of dimension n − m. Checked for every face up to n = 5.'],
        [['checked', 'ours'], 'Fock reading. n modes are n Witt pairs: 2n null generators, which is Genesis node 2n with Cl(n,n) = M₂ⁿ(ℝ). A face is a set of constraints “this mode is empty” or “this mode is full”, and the matching cube face is the set of states that solve them. The count is checked; reading it as Genesis is ours.'],
        [['standard'], 'Equations. First-order spinor equations fit, with real Weyl halves (the even and odd facets) in split signature. Lattice stencils fit too: the faces are the neighbours of a cell of the integer lattice, and faces with equally many time and space poles are light-like steps. The second-order wave equation appears only after squaring.'],
        [['checked'], 'n = 4. The 24 unit quaternions are three 16-cells (the poles, the even facets, the odd facets), with Q₈ of index 3. It is the same 8 seen three ways, so nothing is new. The poles equal half the facets only at n = 4.'],
        [['standard', 'ours'], 'n = 5. The 32 facets split 16 + 16 by parity, and the even 16 have grades 1 + 10 + 5. The 40 edges are the roots of so(10). One generation also counts 6+3+1, 3+2, 1. The counts agree; that they are one thing is ours and open.'],
        [['standard'], 'n = 8. The 112 edges and the 128 even facets make the 240 roots of E8. The roots of E6, E7 and E8 split into orthoplex edges, facets and a few extras, and the finite series stops at E8 (step 3 rebuilds this exactly). No claim about our model.']
      ]
    },
    d: {
      eyebrow: 'STEP 2 · THE DEMICUBE', title: 'The demicube: the even half of the cube',
      lede: 'Keep every second corner of the n-cube: the corners with an even number of 1s. In our dictionary these are exactly the even blades: the scalar, the bivectors, the 4-vectors and so on. The other corners are the odd blades, and the two halves together are the cube. Every cube edge changes the parity, so no edge joins a half to itself.',
      pick: 'Dimension n', tableH: 'The demicubes', cols: ['n', 'shape', 'vertices', 'edges', 'facets', 'faces of each dimension'],
      facets: 'Facets: 2n smaller demicubes (one on each cube facet) plus 2ⁿ⁻¹ simplices, one cutting off each odd corner. At n = 3 only the four simplices remain. Every face count was also found by building the face lattice by brute force.',
      xref: 'The same shape in the views we already have', legend: 'Colour = blade grade. Hollow grey = odd blades.',
      cube: { h: 'Cube view', t: n => `The ${pow2(n)} corners are the blades. ${pow2(n - 1)} are even (filled, coloured by grade) and ${pow2(n - 1)} odd (hollow). Lines join even corners that differ in two bits. The picture is the same 2D trick as the orthoplex: n directions equally spaced in a half turn, one per axis.` },
      cliff: { h: 'Clifford view', t: n => `Even blades multiply among themselves, so they form the even subalgebra, and it equals the algebra of one generator fewer: Cl⁰(p,q) = Cl(p,q−1). We rebuilt it from explicit generators for every signature up to n = 8. For n = ${n}: the even half of node ${n} is the whole algebra of node ${n - 1}.`, cols: ['time + space', 'whole algebra', 'even half'], note: 'At n = 8 the balanced cell Cl(4,4) = M₁₆(ℝ) has even half M₈(ℝ) ⊕ M₈(ℝ), which is the whole algebra of Cl(4,3): two identical halves, the “mirror gate” of Genesis node 7.' },
      simp: { h: 'Simplex view', t: n => `Every odd corner has exactly n even neighbours, and they form a simplex with n vertices: the corner it cuts off. It is the same complete graph as in the Simplex view. Choose the grade of the odd blade; the filled vertices are bivectors.`, pick: 'Grade of the odd blade' },
      lab: { h: 'Labels (Prime view)', t: n => n <= 5 ? `Integer labels of the even blades for n = ${n}: ${S.demicube.rows[n].even_labels.join(', ')}.` : 'The even labels are the integers below 2ⁿ with an even number of 1s in binary.', note: ' Labels are notation only, as everywhere else.' },
      mx: {
        h: 'Maxwell (Test 1)', t: n => `The field F is a bivector, so it sits on the even half. The current J and the equations are odd. The operator ∇ flips parity, so ∇F = J maps the even half to the odd half. Rebuilt from the bit rule for n = ${n}: ${S.demicube.maxwell[n].incidences} incidences; each vector equation uses ${S.demicube.maxwell[n].vector_equation_terms} field components and each trivector equation uses 3, all inside the corner simplex of its odd blade. Two field components share an equation exactly when they share an index, which is exactly an edge of the demicube between two bivectors, and then they share two equations (one vector, one trivector).`,
        pick: 'Time axes k', note: 'Left: field components (bivectors). Right: odd blades, the vector equations then the trivector equations. Green: contraction. Red: wedge. Click an odd blade to isolate its equation.', cap7: 'The Maxwell cells in the atlas stop at 7 generators, so this picture shows n = 7.', E: 'E', B: 'B', T: 'T', terms: n => `terms in this equation: ${n}`
      },
      orth: { h: 'Orthoplex (step 1)', t: 'n = 3: the demicube is the tetrahedron, the simplex. n = 4: it is the 16-cell, one of the three 16-cells of step 1 (the even facets of the 4-orthoplex). n = 5: its 16 vertices are the even facets of the 5-orthoplex, grades 1 + 10 + 5. n = 8: its 128 vertices plus the 112 edges of the 8-orthoplex are the 240 roots of E8: step 3 builds on this.' },
      fur: { h: 'Furey (Test 2)', t: 'Dropping the last bit turns the vertices of the n-demicube into the vertices of the (n−1)-cube, and this respects the XOR rule: even blades of n generators are all blades of n−1 generators. At n = 5 that is the tesseract. In the explicit 16-dimensional model the 16 Witt axes are the vertices of a tesseract, with the Peirce blocks H and C + e₇R + R as square faces and O₁ + O₂ as a cube. One generation also has 16 complex dimensions. The bijection and the axes are checked, the equal count is not an identification. Whether they are one thing is open, and the family test found that no shape here gives a 3.' },
      limits: 'What this does not show: no shape here selects three generations, and nothing on this page is a physical claim beyond the Maxwell and Furey tests it points to.',
      dlH: 'Check it yourself', dlText: 'One self-contained Python file (standard library only). It rebuilds every number on this page, including the brute-force face lattices.', dlPy: 'Download shapes_selfcheck.py', dlJson: 'Download shapes.json', dlCmd: 'python3 shapes_selfcheck.py --compare shapes.json'
    }
  },
  it: {
    nav: ['Passo 1 · Orthoplex', 'Passo 2 · Demicubo'],
    o: {
      eyebrow: 'PASSO 1 · L’ORTOPLESSO', title: 'L’ortoplesso: ogni asse ha due poli',
      lede: 'Metti un punto da una parte e dall’altra dell’origine su ciascuno di n assi. Il loro guscio convesso è l’n-ortoplesso. Una faccia è una scelta di assi con un polo per ciascuno, quindi è una lama con segno. È il cubo rovesciato: a ogni faccia dell’uno corrisponde una faccia dell’altro, con le dimensioni scambiate.',
      pick: 'Dimensione n', tableH: 'La scala, un passo alla volta', cols: ['n', 'forma', 'vertici', 'spigoli', 'sfaccettature', 'tutte le facce (con quella vuota)', 'nodo Genesis', 'algebra per n modi'],
      note: 'Il budget di 8 si esaurisce a n = 4 (nodo 8). Oltre, Cl(n+4,n+4) = Cl(n,n) ⊗ M₁₆(ℝ): le stesse celle di nuovo, sedici volte più grandi. Un trattino significa che il conteggio non è definito per quella dimensione.',
      shapes: ['punto', 'segmento', 'quadrato', 'ottaedro', '16-celle', '5-ortoplesso', '6-ortoplesso', '7-ortoplesso', '8-ortoplesso'],
      picH: 'Il trucco in 2D: il poligono di Petrie',
      pic: n => n < 2 ? 'Troppo piccolo per un poligono: un punto, poi un segmento con i suoi due poli.' : `${2 * n} poli su una circonferenza, i poli opposti sono antipodi e ogni coppia è unita tranne gli antipodi: ${2 * n * (n - 1)} spigoli. Funziona per ogni n. Le ${pow2(n)} sfaccettature non sono disegnate.`,
      points: [
        [['checked'], 'Duale del cubo. Le sfaccettature sono tante quanti i vertici del cubo, cioè le nostre lame, e una faccia con m vertici corrisponde a una faccia del cubo di dimensione n − m. Verificato per ogni faccia fino a n = 5.'],
        [['checked', 'ours'], 'Lettura di Fock. n modi sono n coppie di Witt: 2n generatori nulli, cioè il nodo Genesis 2n con Cl(n,n) = M₂ⁿ(ℝ). Una faccia è un insieme di vincoli “questo modo è vuoto” o “questo modo è pieno”, e la faccia del cubo corrispondente è l’insieme degli stati che li risolvono. Il conteggio è verificato; leggerlo come Genesis è nostro.'],
        [['standard'], 'Equazioni. Le equazioni spinoriali del primo ordine ci stanno, con metà di Weyl reali (le sfaccettature pari e dispari) in segnatura split. Ci stanno anche gli stencil di reticolo: le facce sono i vicini di una cella del reticolo intero, e le facce con tanti poli di tempo quanti di spazio sono passi di tipo luce. L’equazione d’onda del secondo ordine compare solo elevando al quadrato.'],
        [['checked'], 'n = 4. I 24 quaternioni unitari sono tre 16-celle (i poli, le sfaccettature pari, quelle dispari), con Q₈ di indice 3. Sono gli stessi 8 visti in tre modi, quindi nulla di nuovo. I poli sono metà delle sfaccettature solo a n = 4.'],
        [['standard', 'ours'], 'n = 5. Le 32 sfaccettature si dividono 16 + 16 per parità, e i 16 pari hanno gradi 1 + 10 + 5. I 40 spigoli sono le radici di so(10). Anche una generazione conta 6+3+1, 3+2, 1. I numeri coincidono; che siano la stessa cosa è nostro e aperto.'],
        [['standard'], 'n = 8. I 112 spigoli e le 128 sfaccettature pari formano le 240 radici di E8. Le radici di E6, E7 ed E8 si dividono in spigoli dell’ortoplesso, sfaccettature e pochi extra, e la serie finita si ferma a E8 (il passo 3 lo ricostruisce con esattezza). Nessuna affermazione sul nostro modello.']
      ]
    },
    d: {
      eyebrow: 'PASSO 2 · IL DEMICUBO', title: 'Il demicubo: la metà pari del cubo',
      lede: 'Tieni un vertice su due dell’n-cubo: quelli con un numero pari di 1. Nel nostro dizionario sono esattamente le lame pari: lo scalare, i bivettori, i 4-vettori e così via. Gli altri vertici sono le lame dispari, e le due metà insieme sono il cubo. Ogni spigolo del cubo cambia la parità, quindi nessuno spigolo unisce una metà a sé stessa.',
      pick: 'Dimensione n', tableH: 'I demicubi', cols: ['n', 'forma', 'vertici', 'spigoli', 'sfaccettature', 'facce di ogni dimensione'],
      facets: 'Sfaccettature: 2n demicubi più piccoli (uno su ogni sfaccettatura del cubo) più 2ⁿ⁻¹ simplessi, uno per ogni vertice dispari tagliato via. A n = 3 restano solo i quattro simplessi. Ogni conteggio è stato ritrovato anche costruendo il reticolo delle facce a forza bruta.',
      xref: 'La stessa forma nelle viste che già abbiamo', legend: 'Colore = grado della lama. Grigio vuoto = lame dispari.',
      cube: { h: 'Vista cubo', t: n => `I ${pow2(n)} vertici sono le lame. ${pow2(n - 1)} sono pari (pieni, colorati per grado) e ${pow2(n - 1)} dispari (vuoti). Le linee uniscono vertici pari che differiscono in due bit. Il disegno usa lo stesso trucco 2D dell’ortoplesso: n direzioni equispaziate in mezzo giro, una per asse.` },
      cliff: { h: 'Vista Clifford', t: n => `Le lame pari si moltiplicano tra loro, quindi formano la sottoalgebra pari, e coincide con l’algebra di un generatore in meno: Cl⁰(p,q) = Cl(p,q−1). L’abbiamo ricostruita da generatori espliciti per ogni segnatura fino a n = 8. Per n = ${n}: la metà pari del nodo ${n} è l’intera algebra del nodo ${n - 1}.`, cols: ['tempo + spazio', 'algebra intera', 'metà pari'], note: 'A n = 8 la cella bilanciata Cl(4,4) = M₁₆(ℝ) ha metà pari M₈(ℝ) ⊕ M₈(ℝ), che è l’intera algebra di Cl(4,3): due metà identiche, il “cancello specchio” del nodo Genesis 7.' },
      simp: { h: 'Vista simplesso', t: n => `Ogni vertice dispari ha esattamente n vicini pari, e formano un simplesso con n vertici: l’angolo che taglia via. È lo stesso grafo completo della vista Simplesso. Scegli il grado della lama dispari; i vertici pieni sono bivettori.`, pick: 'Grado della lama dispari' },
      lab: { h: 'Etichette (vista Primi)', t: n => n <= 5 ? `Etichette intere delle lame pari per n = ${n}: ${S.demicube.rows[n].even_labels.join(', ')}.` : 'Le etichette pari sono gli interi sotto 2ⁿ con un numero pari di 1 in binario.', note: ' Le etichette sono solo notazione, come ovunque.' },
      mx: {
        h: 'Maxwell (Prova 1)', t: n => `Il campo F è un bivettore, quindi sta sulla metà pari. La corrente J e le equazioni sono dispari. L’operatore ∇ inverte la parità, quindi ∇F = J manda la metà pari nella metà dispari. Ricostruito dalla regola dei bit per n = ${n}: ${S.demicube.maxwell[n].incidences} incidenze; ogni equazione vettoriale usa ${S.demicube.maxwell[n].vector_equation_terms} componenti del campo e ogni equazione trivettoriale ne usa 3, tutte nel simplesso d’angolo della sua lama dispari. Due componenti del campo condividono un’equazione esattamente quando condividono un indice, cioè esattamente quando sono uno spigolo del demicubo tra due bivettori, e allora condividono due equazioni (una vettoriale, una trivettoriale).`,
        pick: 'Assi temporali k', note: 'A sinistra: componenti del campo (bivettori). A destra: lame dispari, prima le equazioni vettoriali poi quelle trivettoriali. Verde: contrazione. Rosso: cuneo. Clicca una lama dispari per isolare la sua equazione.', cap7: 'Le celle di Maxwell dell’atlante si fermano a 7 generatori, quindi qui il disegno mostra n = 7.', E: 'E', B: 'B', T: 'T', terms: n => `termini in questa equazione: ${n}`
      },
      orth: { h: 'Ortoplesso (passo 1)', t: 'n = 3: il demicubo è il tetraedro, il simplesso. n = 4: è la 16-celle, una delle tre 16-celle del passo 1 (le sfaccettature pari del 4-ortoplesso). n = 5: i suoi 16 vertici sono le sfaccettature pari del 5-ortoplesso, gradi 1 + 10 + 5. n = 8: i suoi 128 vertici più i 112 spigoli dell’8-ortoplesso sono le 240 radici di E8: il passo 3 parte da qui.' },
      fur: { h: 'Furey (Prova 2)', t: 'Togliere l’ultimo bit trasforma i vertici dell’n-demicubo nei vertici dell’(n−1)-cubo, e rispetta la regola XOR: le lame pari di n generatori sono tutte le lame di n−1 generatori. A n = 5 è il tesseratto. Nel modello esplicito a 16 dimensioni i 16 assi di Witt sono i vertici di un tesseratto, con i blocchi di Peirce H e C + e₇R + R come facce quadrate e O₁ + O₂ come cubo. Anche una generazione ha 16 dimensioni complesse. La biiezione e gli assi sono verificati, l’uguaglianza dei conteggi non è un’identificazione. Se siano una sola cosa è aperto, e la prova di famiglia ha trovato che nessuna forma qui dà un 3.' },
      limits: 'Che cosa questo non mostra: nessuna forma qui seleziona tre generazioni, e nulla in questa pagina è un’affermazione fisica oltre alle prove di Maxwell e Furey a cui rimanda.',
      dlH: 'Verificalo tu', dlText: 'Un unico file Python autonomo (solo libreria standard). Ricostruisce ogni numero di questa pagina, compresi i reticoli delle facce a forza bruta.', dlPy: 'Scarica shapes_selfcheck.py', dlJson: 'Scarica shapes.json', dlCmd: 'python3 shapes_selfcheck.py --compare shapes.json'
    }
  }
};
export default COPY;
export { sup, pow2 };
