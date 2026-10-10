import K from './mirrorsData.js';

// Copy for step 8 of the equations page: mirrors (English and Italian).
// Every number is read from selfcheck/mirrors.json (exact, standard library) and selfcheck/mirrors_matrix.json (numpy).
const L = K.mr.ladder, EX = K.mr.examples;
export const AXN = ['t', 'x', 'y', 'z', 'u', 'v', 'w', 's'];
export const axset = m => AXN.filter((_, i) => m >> i & 1).join('') || '∅';
export const weight = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
const pe = (k, one, many) => (k === 1 ? one : many);
const C2 = n => n * (n - 1) / 2;
const frac = s => s; // the example strings are exact fractions already
const mat = M => `[[${M[0].map(frac).join(', ')}], [${M[1].map(frac).join(', ')}]]`;
const nrm = a => `(${a.map(frac).join(', ')})`;
const sample = n => AXN.slice(0, Math.min(n, 3)).join('');

const COPY = {
  en: {
    m1: {
      title: 'Mirrors: every rotation is a few reflections',
      lede: 'A mirror is the simplest move: reflect in the hyperplane orthogonal to a vector a, x ↦ x − 2(x·a)/(a·a) a, which in the algebra is the sandwich −a x a⁻¹. A product of k mirrors, a versor V = a₁…a_k, acts by the twisted sandwich (−1)^k V x V⁻¹. It is an isometry with determinant (−1)^k: an even product is a rotation, an odd one reverses orientation. The Cartan–Dieudonné theorem says that every isometry of n axes is a product of at most n mirrors. On the bit rule a corner of the n-cube is the product of the coordinate mirrors on its axes, so the cube becomes a group: its layers count mirrors and its even half is the demicube. This is standard material (Pin and Spin groups, Coxeter groups); the page checks it on the bit rule and reads the cube of the earlier steps through it. It does not claim a physical role for the mirrors.',
      tableH: 'The ladder', cols: ['n', 'corners 2ⁿ', 'layers by mirrors', 'rotors (even)', 'reflections (odd)', 'most mirrors needed', '|Bₙ|', '|Dₙ|'],
      pickH: 'Pick a number of axes', pick: 'n axes, one of them time',
      picH: 'The cube of mirrors',
      picCap: n => `The ${1 << n} corners of the ${n}-cube, in columns by the number of mirrors they need. Green: an even number (a rotor, the demicube, ${1 << (n - 1)} corners). Amber: odd (a reflection). Pick a corner to see its mirrors.`,
      onlyEven: 'demicube only', all: 'all corners',
      pickedH: 'Selected corner',
      corner: (n, S) => { const w = weight(S), names = axset(S), tn = [...Array(n).keys()].filter(i => S >> i & 1).map(i => AXN[i]);
        return { head: S === 0 ? 'The identity: no mirror.' : `The corner ${names}: the product ${tn.map(a => 'e_' + a).join(' ')}.`,
          lines: [`It flips the ${w} ax${pe(w, 'is', 'es')} ${S === 0 ? '(none)' : names} and keeps the others: the diagonal matrix ${'diag(' + Array.from({ length: n }, (_, i) => (S >> i & 1 ? '−1' : '+1')).join(', ') + ')'}.`,
            `It needs exactly ${w} mirror${pe(w, '', 's')}: its number of flipped axes (the rank of the matrix minus the identity).`,
            `${w % 2 === 0 ? 'Even: a rotor, a rotation (determinant +1).' : 'Odd: a reflection (determinant −1).'}`] }; },
      twoH: 'Two mirrors make a rotation or a boost',
      twoCap: 'The mirror lines are perpendicular to the normals. The vector x goes to the second mirror’s image and then to the first’s, and the result is the rotation by twice the angle between the lines. The boost is the same sum with the Lorentz metric.',
      twoCols: ['example', 'normals of the two mirrors', 'the matrix of the pair'],
      twoRows: [['rotation 3/5, 4/5', nrm(EX.rotation_3_4_5.mirror_normals[0]) + ', ' + nrm(EX.rotation_3_4_5.mirror_normals[1]), mat(EX.rotation_3_4_5.matrix)], ['boost 5/4, 3/4', nrm(EX.boost_5_4_3_4.mirror_normals[0]) + ', ' + nrm(EX.boost_5_4_3_4.mirror_normals[1]), mat(EX.boost_5_4_3_4.matrix)]],
      viewsH: n => `Every view at n = ${n}`,
      views: r => {
        const n = r.n_value, lay = r.layers.join(' + '), rl = r.rotor_layers.join(' + '), nt = n <= 5 ? '' : ' (the exact check stops at n = 5; the matrix check at n = 6)', tg = n <= 6 ? ['checked', 'standard'] : ['standard'];
        const cl = { h: 'Clifford', t: `A mirror is a vector a with a·a ≠ 0, and a versor is a product of them. The twisted sandwich is an isometry of determinant (−1)^k, and Cartan–Dieudonné reduces any such product to at most n = ${n} mirrors with the same parity, the reduced versor equal to the original up to a scalar. Checked exactly on random products of up to ${2 * n + 1} vectors, in both signatures${n <= 5 ? '' : ' at n = 2 to 5'}${nt}.`, tags: tg };
        const cu = { h: 'Cube and demicube', t: `The ${r.corners} corners are the sign patterns of the ${n}-cube. A corner flips exactly its axes and needs exactly that many mirrors: the layers are ${lay} (corners by mirrors needed). The even layers, ${rl} = ${r.rotors}, are the rotors, the demicube; the other ${r.reflections} are reflections. The sign changes of the reflection group Dₙ are exactly the even corners (checked for n ≤ 5), and |Bₙ| = 2ⁿ n! = ${r.B_order}, |Dₙ| = ${r.D_order}${n <= 5 ? ', both by closure' : ', from the formula (closure is run to n = 5)'}.`, tags: n <= 6 ? ['checked', 'ours'] : ['ours'] };
        const si = { h: 'Simplex', t: `The ${n} axes are the corners of a simplex, and a set of axes is one of its faces. A face with k corners is a corner of the cube with k mirrors, so the layers are the numbers of faces of each size. The faces with two corners, ${C2(n)} of them, are the planes of step 1: the two mirrors of axes i and j make the half-turn in the plane ij.`, tags: ['checked', 'ours'] };
        const wl = weight((1 << Math.min(n, 3)) - 1), la = { h: 'Labels', t: `A corner is named by its axes, as in step 1, and its bit mask has the number of mirrors as its weight and the parity of the weight as its type: ${sample(n)} is ${wl} mirror${pe(wl, '', 's')}, ${wl % 2 ? 'a reflection' : 'a rotor'}. Labels are notation.`, tags: ['checked', 'standard'] };
        const ma = { h: 'Maxwell', t: `The rotations and boosts under which the Maxwell page is covariant are products of two mirrors; the two examples below are checked. That Maxwell’s equations are also invariant under a single mirror is standard and not rebuilt here.`, tags: ['checked', 'standard'] };
        const ym = { h: 'Yang–Mills (step 4)', t: `The gauge transformations of step 4 are rotors of the internal algebra Cl(0,m), even products of vectors acting on the generators by the sandwich, which is the adjoint action. The even corners are the discrete rotors. That the exponential of a bivector is a rotor, and its agreement with the adjoint covariance of step 4, is standard and not rebuilt here.`, tags: ['standard'] };
        const di = { h: 'Dirac', t: n === 4 ? `In the space-time algebra a product of two vectors is a spinor ψ (even), and its current X = ψγ₀ψ̃ is a vector with X² = (ψψ̃)²: ${K.mr.dirac_current.two_mirror_spinors_tested} random spinors, exact. A general even ψ is a sum of such products, not one of them, so the check does not cover it. The equation is not solved.` : `The current of a two-mirror spinor was checked in the space-time algebra, n = 4, and only there. A general even spinor is a sum of such products, and no equation is solved.`, tags: n === 4 ? ['checked', 'open'] : ['open'] };
        return [cl, cu, si, la, ma, ym, di];
      },
      idH: 'What was checked, and where', idCols: ['n', 'versor checks', 'corners', 'Cartan–Dieudonné ≤ n', 'B and D orders'],
      idNote: 'Versor checks: mirror formula, isometry, determinant (−1)^k and parity, on random products in both signatures. Corners: each flips exactly its axes, in both signatures. Cartan–Dieudonné: at most n mirrors and the reduced versor equal to the original up to a scalar. B and D orders: by closure of the generating mirrors. Exact rational arithmetic.',
      e8H: 'Gosset and E8', e8: `The 240 roots of E8 are the 112 roots of D8 and the ${L[8].rotors} vertices of the 8-demicube, and all 240 mirrors permute them: checked exactly. The 128 demicube vertices are the even corners of the 8-cube, the rotors of the eight axes. That E8 is a Coxeter group is textbook.`,
      xrH: 'What each view teaches the others',
      xr: [
        ['ours', 'Cube → mirrors. The same bit rule: the corners of the n-cube are sign patterns, the layers by number of mirrors are the binomial counts, the even half is the demicube. Reading the layers as numbers of mirrors is a relabelling; the groups Bₙ and Dₙ are textbook.'],
        ['checked', 'Step 1 → mirrors. The planes of step 1 are the corners of two mirrors: half-turns. Two mirrors at a general angle give any rotation in the plane, and the commutator graph of step 1 is the algebra of these rotations.'],
        ['checked', 'Gosset → mirrors. The demicube vertices of E8 are the even corners of the 8-cube; all 240 roots are permuted by their mirrors.'],
        ['standard', 'Reflections as the basic move is the approach of the plane-based geometric algebra literature (Dorst and De Keninck, which we read, cite Cartan–Dieudonné). We have not compared with the other treatments.']
      ],
      matH: 'Independent check with matrices',
      mat: 'With Jordan–Wigner gamma matrices (numpy), n = 2 to 6 and both signatures, the twisted sandwich of a random product of vectors equals the Householder matrix of the product (error < 1e-9). Cartan–Dieudonné by the construction a = Ou − u, with u not null, gives at most n mirrors whose gamma matrices multiply to something proportional to V. The all-flip corner has rank(−1 − 1) = n. Wrong versions fail: the untwisted sandwich with an odd number of mirrors, a gamma matrix with the wrong square, one mirror fewer than n for the all-flip corner, and the reflection formula with the wrong metric. The random draw of u is repeated when an unlucky u leaves a remainder in which every a is null (the theorem needs one good choice).',
      open: [
        ['open', 'Whether the mirrors have any physical role in the model. Here they are a tool for rotations, not a field.'],
        ['open', 'The degenerate case. A mirror in a null vector is not defined (a·a = 0). That is the next step.'],
        ['open', 'Nothing here selects three generations.']
      ],
      dl: { h: 'Check it yourself', text: 'Two Python files. The first (standard library only) rebuilds everything above, exactly. The second (needs numpy) compares with explicit matrices and runs wrong versions that must fail.', py: 'Download mirrors_selfcheck.py', py2: 'Download mirrors_matrix_check.py', json: 'Download mirrors.json', cmd: 'python3 mirrors_selfcheck.py --compare mirrors.json   ·   python3 mirrors_matrix_check.py --compare mirrors_matrix.json' }
    }
  },
  it: {
    m1: {
      title: 'Specchi: ogni rotazione è fatta di poche riflessioni',
      lede: 'Uno specchio è la mossa più semplice: riflettere nell’iperpiano ortogonale a un vettore a, x ↦ x − 2(x·a)/(a·a) a, che nell’algebra è il sandwich −a x a⁻¹. Un prodotto di k specchi, un versore V = a₁…a_k, agisce con il sandwich ritorto (−1)^k V x V⁻¹. È un’isometria di determinante (−1)^k: un prodotto pari è una rotazione, uno dispari inverte l’orientamento. Il teorema di Cartan–Dieudonné dice che ogni isometria di n assi è un prodotto di al massimo n specchi. Sulla regola dei bit un vertice dell’n-cubo è il prodotto degli specchi coordinati sui suoi assi, così il cubo diventa un gruppo: i suoi strati contano gli specchi e la sua metà pari è il semicubo. È materiale standard (gruppi Pin e Spin, gruppi di Coxeter); la pagina lo verifica sulla regola dei bit e legge il cubo dei passi precedenti attraverso di esso. Non afferma un ruolo fisico per gli specchi.',
      tableH: 'La scala', cols: ['n', 'vertici 2ⁿ', 'strati per specchi', 'rotori (pari)', 'riflessioni (dispari)', 'specchi al massimo', '|Bₙ|', '|Dₙ|'],
      pickH: 'Scegli il numero di assi', pick: 'n assi, uno dei quali è il tempo',
      picH: 'Il cubo degli specchi',
      picCap: n => `I ${1 << n} vertici dell’${n}-cubo, in colonne per numero di specchi necessari. Verde: numero pari (un rotore, il semicubo, ${1 << (n - 1)} vertici). Ambra: dispari (una riflessione). Scegli un vertice per vederne gli specchi.`,
      onlyEven: 'solo il semicubo', all: 'tutti i vertici',
      pickedH: 'Vertice scelto',
      corner: (n, S) => { const w = weight(S), names = axset(S), tn = [...Array(n).keys()].filter(i => S >> i & 1).map(i => AXN[i]);
        return { head: S === 0 ? 'L’identità: nessuno specchio.' : `Il vertice ${names}: il prodotto ${tn.map(a => 'e_' + a).join(' ')}.`,
          lines: [`Inverte ${w === 1 ? 'l’asse' : 'gli ' + w + ' assi'} ${S === 0 ? '(nessuno)' : names} e lascia fermi gli altri: la matrice diagonale ${'diag(' + Array.from({ length: n }, (_, i) => (S >> i & 1 ? '−1' : '+1')).join(', ') + ')'}.`,
            `Servono esattamente ${w} ${w === 1 ? 'specchio' : 'specchi'}: il numero di assi invertiti (il rango della matrice meno l’identità).`,
            `${w % 2 === 0 ? 'Pari: un rotore, una rotazione (determinante +1).' : 'Dispari: una riflessione (determinante −1).'}`] }; },
      twoH: 'Due specchi fanno una rotazione o un boost',
      twoCap: 'Le rette degli specchi sono perpendicolari alle normali. Il vettore x va nell’immagine del secondo specchio e poi in quella del primo, e il risultato è la rotazione di un angolo doppio di quello tra le rette. Il boost è la stessa somma con la metrica di Lorentz.',
      twoCols: ['esempio', 'normali dei due specchi', 'la matrice della coppia'],
      twoRows: [['rotazione 3/5, 4/5', nrm(EX.rotation_3_4_5.mirror_normals[0]) + ', ' + nrm(EX.rotation_3_4_5.mirror_normals[1]), mat(EX.rotation_3_4_5.matrix)], ['boost 5/4, 3/4', nrm(EX.boost_5_4_3_4.mirror_normals[0]) + ', ' + nrm(EX.boost_5_4_3_4.mirror_normals[1]), mat(EX.boost_5_4_3_4.matrix)]],
      viewsH: n => `Tutte le viste a n = ${n}`,
      views: r => {
        const n = r.n_value, lay = r.layers.join(' + '), rl = r.rotor_layers.join(' + '), nt = n <= 5 ? '' : ' (la verifica esatta si ferma a n = 5; quella con matrici a n = 6)', tg = n <= 6 ? ['checked', 'standard'] : ['standard'];
        const cl = { h: 'Clifford', t: `Uno specchio è un vettore a con a·a ≠ 0, e un versore è un prodotto di specchi. Il sandwich ritorto è un’isometria di determinante (−1)^k, e Cartan–Dieudonné riduce ogni prodotto a al massimo n = ${n} specchi con la stessa parità, con il versore ridotto uguale all’originale a meno di uno scalare. Verificato esattamente su prodotti casuali fino a ${2 * n + 1} vettori, in entrambe le segnature${n <= 5 ? '' : ' per n da 2 a 5'}${nt}.`, tags: tg };
        const cu = { h: 'Cubo e semicubo', t: `I ${r.corners} vertici sono le configurazioni di segno dell’${n}-cubo. Un vertice inverte esattamente i suoi assi e richiede altrettanti specchi: gli strati sono ${lay} (vertici per specchi necessari). Gli strati pari, ${rl} = ${r.rotors}, sono i rotori, il semicubo; gli altri ${r.reflections} sono riflessioni. I cambi di segno del gruppo di riflessioni Dₙ sono esattamente i vertici pari (verificato per n ≤ 5), e |Bₙ| = 2ⁿ n! = ${r.B_order}, |Dₙ| = ${r.D_order}${n <= 5 ? ', entrambi per chiusura' : ', dalla formula (la chiusura è eseguita fino a n = 5)'}.`, tags: n <= 6 ? ['checked', 'ours'] : ['ours'] };
        const si = { h: 'Simplesso', t: `Gli ${n} assi sono i vertici di un simplesso, e un insieme di assi è una sua faccia. Una faccia con k vertici è un vertice del cubo con k specchi, quindi gli strati sono i numeri di facce di ciascuna taglia. Le facce con due vertici, ${C2(n)}, sono i piani del passo 1: i due specchi degli assi i e j fanno la mezza rotazione nel piano ij.`, tags: ['checked', 'ours'] };
        const wl = weight((1 << Math.min(n, 3)) - 1), la = { h: 'Etichette', t: `Un vertice è chiamato con i suoi assi, come nel passo 1, e la sua maschera di bit ha come peso il numero di specchi e come tipo la parità del peso: ${sample(n)} è ${wl} ${wl === 1 ? 'specchio' : 'specchi'}, ${wl % 2 ? 'una riflessione' : 'un rotore'}. Le etichette sono notazione.`, tags: ['checked', 'standard'] };
        const ma = { h: 'Maxwell', t: `Le rotazioni e i boost per cui la pagina di Maxwell è covariante sono prodotti di due specchi; i due esempi qui sotto sono verificati. Che le equazioni di Maxwell siano invarianti anche per un solo specchio è standard e non è ricostruito qui.`, tags: ['checked', 'standard'] };
        const ym = { h: 'Yang–Mills (passo 4)', t: `Le trasformazioni di gauge del passo 4 sono rotori dell’algebra interna Cl(0,m), prodotti pari di vettori che agiscono sui generatori con il sandwich, cioè con l’azione aggiunta. I vertici pari sono i rotori discreti. Che l’esponenziale di un bivettore sia un rotore, e il suo accordo con la covarianza aggiunta del passo 4, è standard e non è ricostruito qui.`, tags: ['standard'] };
        const di = { h: 'Dirac', t: n === 4 ? `Nell’algebra spazio-temporale un prodotto di due vettori è uno spinore ψ (pari), e la sua corrente X = ψγ₀ψ̃ è un vettore con X² = (ψψ̃)²: ${K.mr.dirac_current.two_mirror_spinors_tested} spinori casuali, esatto. Un ψ pari generico è una somma di tali prodotti, non uno di essi, quindi la verifica non lo copre. L’equazione non è risolta.` : `La corrente di uno spinore a due specchi è stata verificata nell’algebra spazio-temporale, n = 4, e solo lì. Uno spinore pari generico è una somma di tali prodotti, e nessuna equazione è risolta.`, tags: n === 4 ? ['checked', 'open'] : ['open'] };
        return [cl, cu, si, la, ma, ym, di];
      },
      idH: 'Cosa è stato verificato, e dove', idCols: ['n', 'verifiche dei versori', 'vertici', 'Cartan–Dieudonné ≤ n', 'ordini di B e D'],
      idNote: 'Verifiche dei versori: formula dello specchio, isometria, determinante (−1)^k e parità, su prodotti casuali nelle due segnature. Vertici: ciascuno inverte esattamente i suoi assi, nelle due segnature. Cartan–Dieudonné: al massimo n specchi e versore ridotto uguale all’originale a meno di uno scalare. Ordini di B e D: per chiusura degli specchi generatori. Aritmetica razionale esatta.',
      e8H: 'Gosset ed E8', e8: `Le 240 radici di E8 sono le 112 radici di D8 e i ${L[8].rotors} vertici dell’8-semicubo, e tutti i 240 specchi le permutano: verificato esattamente. I 128 vertici del semicubo sono i vertici pari dell’8-cubo, i rotori degli otto assi. Che E8 sia un gruppo di Coxeter è da manuale.`,
      xrH: 'Cosa ogni vista insegna alle altre',
      xr: [
        ['ours', 'Cubo → specchi. La stessa regola dei bit: i vertici dell’n-cubo sono configurazioni di segno, gli strati per numero di specchi sono i conteggi binomiali, la metà pari è il semicubo. Leggere gli strati come numeri di specchi è un cambio di etichetta; i gruppi Bₙ e Dₙ sono da manuale.'],
        ['checked', 'Passo 1 → specchi. I piani del passo 1 sono i vertici a due specchi: mezze rotazioni. Due specchi con un angolo qualsiasi danno ogni rotazione nel piano, e il grafo dei commutatori del passo 1 è l’algebra di queste rotazioni.'],
        ['checked', 'Gosset → specchi. I vertici del semicubo di E8 sono i vertici pari dell’8-cubo; tutte le 240 radici sono permutate dai loro specchi.'],
        ['standard', 'Le riflessioni come mossa di base sono l’approccio della letteratura sull’algebra geometrica basata sui piani (Dorst e De Keninck, che abbiamo letto, citano Cartan–Dieudonné). Non abbiamo confrontato con gli altri trattamenti.']
      ],
      matH: 'Verifica indipendente con matrici',
      mat: 'Con matrici gamma di Jordan–Wigner (numpy), n da 2 a 6 e le due segnature, il sandwich ritorto di un prodotto casuale di vettori è uguale alla matrice di Householder del prodotto (errore < 1e-9). Cartan–Dieudonné con la costruzione a = Ou − u, con u non nullo, dà al massimo n specchi le cui matrici gamma si moltiplicano in qualcosa di proporzionale a V. Il vertice con tutti gli assi invertiti ha rango(−1 − 1) = n. Le versioni sbagliate falliscono: il sandwich non ritorto con un numero dispari di specchi, una matrice gamma con il quadrato sbagliato, uno specchio in meno di n per il vertice con tutti gli assi invertiti, e la formula di riflessione con la metrica sbagliata. L’estrazione casuale di u è ripetuta quando un u sfortunato lascia un resto in cui ogni a è nullo (il teorema richiede una scelta buona).',
      open: [
        ['open', 'Se gli specchi abbiano un ruolo fisico nel modello. Qui sono uno strumento per le rotazioni, non un campo.'],
        ['open', 'Il caso degenere. Uno specchio in un vettore nullo non è definito (a·a = 0). È il passo successivo.'],
        ['open', 'Niente di quanto qui scelga tre generazioni.']
      ],
      dl: { h: 'Verificalo tu', text: 'Due file Python. Il primo (solo libreria standard) ricostruisce tutto quanto sopra, in modo esatto. Il secondo (richiede numpy) confronta con matrici esplicite ed esegue versioni sbagliate che devono fallire.', py: 'Scarica mirrors_selfcheck.py', py2: 'Scarica mirrors_matrix_check.py', json: 'Scarica mirrors.json', cmd: 'python3 mirrors_selfcheck.py --compare mirrors.json   ·   python3 mirrors_matrix_check.py --compare mirrors_matrix.json' }
    }
  }
};
export default COPY;
