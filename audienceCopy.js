// Short readings of each equation step for the three audiences (Learner, Physics, Math). The full text stays on the page, folded.
// Level 0 = Young Learner, 1 = Physicist, 2 = Mathematician (the mathematician reads the full introduction, so no short text is needed).
import FQ from './forqueData.js';
import SPD from './spinData.js';
import SRD from './springData.js';
import PGS from './pgadynData.js';
import { STEP_GROUPS, NAV_NAMES, stepCount, numWord, capital } from './steps.js';
const FC = FQ.fq.counts, SC = SPD.spm.counts, SR = SRD, PG = PGS.summary;
export const level = p => (p === 'Young Learner' ? 0 : p === 'Physicist' ? 1 : 2);
export const FOLD = { en: { full: 'Full introduction' }, it: { full: 'Introduzione completa' } };
export const SHORT = {
  en: {
    comm: [
      'Some moves in the model commute (the order does not matter) and some do not. Two planes that share one axis do not commute, and the result is the third plane. Draw those pairs as lines and you get the Lorentz transformations: boosts and rotations.',
      'Two bivectors anticommute exactly when they share one index; the commutator is ±2 times the bivector on the symmetric difference. With 1 time and 3 space axes this is the Lorentz algebra (boost·boost → rotation, rotation·boost → boost). It is so(p,q) drawn as a graph, not a gauge field.'
    ],
    dirac: [
      'The electron’s equation, built from the same rule: a few numbers on the corners of a 4-dimensional shape, each tied to its neighbours. We count the links and check that the equation behaves correctly under rotations and boosts. We do not solve it.',
      'Hestenes’ space-time-algebra form: ψ even in Cl(1,3), ∇ψJ = mψγ₀ with J = γ₂γ₁. 8 components, 8 equations, 40 incidences. The determinant (p²−m²)⁴ and covariance under the six bivectors are exact. No solutions or spin sums are shown.'
    ],
    coupling: [
      'Here the electron’s equation and Maxwell’s meet: the electron makes the field, and the field pushes back on the electron. We build it one dimension at a time and check that the electric current is conserved. How strong the push is, we do not derive.',
      'The current X = ψγ₀ψ̃ sources ∇F = eX, and Dirac gains −eAψ. A charged form needs a complex structure J, which exists from n = 3. Exact: current conservation and first-order gauge invariance. Open: the sign and size of the source term (no action).'
    ],
    ym: [
      'Maxwell has one kind of charge; stronger forces have several that do not commute. We use the plane-rotations of step 1 as the list of charges and check that the field equations still conserve what they should. With two indices it is exactly Maxwell again.',
      'Gauge algebra so(m) as the bivectors of Cl(0,m); F = ∂A − ∂A + g[A,A]. Exact: Bianchi (needs Jacobi), first-order gauge covariance, D^νJ_ν = 0. m = 2 is Maxwell. Open: g, the action, and which gauge algebra the model uses.'
    ],
    matter: [
      'Now the electron field gets a second label that the new forces act on, a little like a colour tag. Each force has a conserved current. We check that the bookkeeping is consistent; we do not say which labels real particles carry.',
      'Ψ = ΣΨ_{S,T}; the so(m) generators act by left multiplication on the internal blade T, D = ∂ + gA^aB_a, [D,D]Ψ = gFΨ. Exact: adjoint covariance and D^νj^a_ν = 0 on shell. Open: g, the source sign, which representation the model uses, chirality.'
    ],
    grav1: [
      'Gravity is drawn like the other forces, with a frame and a rule for how it twists from place to place. The twisting (curvature) is a table of numbers, and we count how many independent entries it has: 20 in four dimensions. We build no solutions.',
      'Spin connection ω, curvature R = dω + ¼[ω,ω], tetrad e, torsion T = de + ωe, all on the bit rule. Exact for n = 2 to 5: D R = 0, D T = R∧e, local Lorentz covariance, [D,D]ψ = ½Rψ. Riemann count n²(n²−1)/12 (20 at n = 4), Ricci and Weyl split by linear algebra. First-order (Cartan) gravity; the plane-pair reading is ours.'
    ],
    grav2: [
      'Einstein’s equation, written with the frame and the curvature. We check that, as in the electric case, whatever it is tied to must be conserved. The sign of the cosmological term turns out to be the sign of one extra axis. The strength and sign of the coupling to matter are open.',
      'E_a = Σ ε F^{bc}∧e^d…, F = R + c e∧e. Exact for n = 3, 4, 5: D E_a = torsion terms only; at e = dx, E_a is the Einstein tensor (ratio 1). One extra generator of square s gives dS or AdS with k = −s (MacDowell–Mansouri). Open: κ and the source sign, solving T = 0 for ω, any solution.'
    ],
    mirrors: [
      'A mirror flips space across a line or plane. Two mirrors make a turn, and any move of space needs at most as many mirrors as there are directions. Each corner of the cube is a set of mirrors, and we count them. Half of the corners (an even number of mirrors) are turns.',
      'Reflection in a vector, x ↦ −a x a⁻¹; a product of k of them acts by the twisted sandwich with determinant (−1)^k. Cartan–Dieudonné: at most n mirrors, checked exactly and with matrices. Corners of the n-cube are products of coordinate mirrors; the even half is the demicube (Dₙ), and the 128 demicube vertices of E8 are the even corners of the 8-cube.'
    ],
    projective: [
      'What if the space we move in is flat, curved one way, or curved the other way? One extra direction, with three possible kinds, gives these three, and we count their moves. Two more directions give the conformal moves (stretch, shrink, invert) and contain the flat ones. No dynamics yet.',
      'One extra generator of square s = 0, −1, +1 gives C(n+1,2) generators with [B_an, B_bn] = −2s B_ab: Euclid/elliptic/hyperbolic on a space base, Poincaré/dS/AdS on a Lorentz base (k = −s of step 7). A null pair ε, o gives P(x) = o + x − ½x²ε, planes and spheres as vectors, and the conformal algebra with C(n+2,2) generators; PGA sits inside CGA as the algebra of the base and ε. Exact; dynamics (forque) is the next step.'
    ],
    maxwell: [
      'Light and electricity follow rules called Maxwell’s equations. Here all of them become one short equation, and each piece of it is a small step on the cube: add one direction or drop one. We show it four ways and check every piece.',
      '∇F = J in the Clifford algebra of space-time, rebuilt in 1 to 4 space and 1 to 4 time dimensions: each term is a grade-changing move on F, drawn as algebra, simplex, cube and integer labels. Every term, sign and wave equation is exact; the wave operator is elliptic, hyperbolic or ultrahyperbolic by signature.'
    ],
    dictionary: [
      'Every particle and force in the Standard Model has a name in Furey’s model. Here each one is written six ways, from a plain bit pattern to Furey’s own notation, so you can see the same thing in six languages.',
      'Each Standard Model state and gauge generator of Furey’s Cl(0,8) model, written in six notations (Furey, simplex, Clifford, cube, prime, cross-view). Built up from 0 so the symmetries appear as the structure grows; the Furey column is audited, the others are readings.'
    ],
    threegen: [
      'A short question: could the same structure hold three copies of the particle family? Counting boxes, yes, there is room. Checking that the boxes carry the right charges, no.',
      'Do the 256 real dimensions of End(V) = M₁₆(ℝ) hold three generations? We decompose them into Standard Model irreps under Furey’s gauge action and count complete generations: the dimensions allow it, the gauge representations do not (one generation fits).'
    ],
    findings: [
      'We rebuilt Furey’s 16-dimensional space by hand and tested every claim by computer. Each card says what is settled and what is not.',
      'Explicit 𝕍 (octonions by Cayley–Dickson, ω = L_{e₇}); every claim tested numerically; each card gives the status and the evidence. Reproduce with furey/run_all.py.'
    ],
    orth: [
      'Take every direction and put a point on each side of the centre. Joining them gives a shape called the orthoplex. It is the cube turned inside out: what is a corner of one is a face of the other.',
      'The hull of ±e_i on n axes. Faces are signed blades (a choice of axes with a pole for each); the orthoplex is dual to the cube, with the face counts swapped.'
    ],
    demi: [
      'Take a cube and keep every second corner: the ones with an even number of 1s. That half is the demicube. In our dictionary it is exactly the even blades, and every edge of the cube jumps between the two halves.',
      'The even-weight corners of the n-cube are the even blades (scalar, bivectors, 4-vectors…); the odd corners are the odd blades. Every cube edge flips parity, so no edge lies inside a half.'
    ],
    gosset: [
      'Two of our shapes meet in a special place: eight dimensions. Together they make the 240 corners of a famous shape called E8, with two smaller relatives inside it. We rebuild the whole family with exact arithmetic.',
      'The 8-orthoplex (112 edges) plus the 8-demicube (128 corners) give the 240 roots of E8, with E6 and E7 inside. Rebuilt exactly from the Cartan matrices, then compared with the views we already have.'
    ],
    tally: [
      'A table of every equation we drew and checked, one row each. The pictures show which pieces go into which equation. They never show solutions.',
      'One row per equation: where it appears, component and incidence counts, and the status. Structure is drawn from the bit rule and checked by script: identities, not solutions.'
    ],
    page_rule: [
      'A shape can be described by on/off switches, and combining two sets of switches follows one simple rule. We draw that rule four ways and show how a ladder of algebras grows from three starting ideas.',
      'Blades are bit patterns and the product is XOR on labels, up to a sign. The rule is drawn as algebra, simplex, cube and integers, and the ladder of Clifford algebras is built from three axioms.'
    ],
    page_atlas: [
      'A map of 25 boxes, each a different set of rules built from the same switches. Pick one to see its pieces. A box’s name is our reading, so each box shows how sure we are.',
      '25 cells Cl(p,q) placed by two gradings; for each, the algebra, simplex, cube and labels. Algebra type and matrix size are checked; the physical names are readings, each with an audit status.'
    ],
    page_maxwell: [
      'Test 1: can the rule rebuild something we already know? Light and electricity are one equation. We rebuild it in many dimensions and check every term.',
      '∇F = J rebuilt from the bit rule alone in 1 to 4 space and 1 to 4 time dimensions, every term checked in exact arithmetic.'
    ],
    page_furey: [
      'Test 2: a harder case with matter in it. A published model builds one family of particles from one algebra. We rebuild it and mark what fits and what does not.',
      'Furey’s one-generation Standard Model construction in Cl(0,8), rebuilt explicitly; its operators mapped onto our blades, edges and channels, with fit and misfit marked.'
    ],
    page_shapes: [
      'Besides the simplex and the cube there are two more shapes: one with two poles per direction, and the half-cube. A third step shows how both build a famous eight-dimensional shape.',
      'The orthoplex and the demicube beside the simplex and the cube; the Gosset series E6, E7, E8 built from the two; each checked against the earlier views.'
    ],
    page_equations: [
      `Besides Maxwell, ${numWord('en', stepCount('eq'))} more steps of equations, each drawn from the same rule and checked by a script. The last three are someone else’s paper on pushes, a paper and a lecture on spins, and a spring on the cube, written out so that anyone can check them.`,
      `${capital(numWord('en', stepCount('eq')))} more steps (${STEP_GROUPS.eq.map(id => NAV_NAMES.en[id]).join(', ')}), each an incidence picture checked by script. Steps 10 and 11 translate other people’s work (Forque dynamics; spinors) into matrices; step 12 is our own exactly solved spring network.`
    ],
    page_map: [
      'One page for the whole project: what is finished, a tree of everything we learned with a button to jump to each part, and what to do next. At the bottom it says who made all this, and what they can get wrong.',
      'Status of every part, a tree of knowledge whose branches link to the page and the script behind them (filter by lens or thread), what to borrow from other researchers for dynamics, the planned next steps, and a credit to Claude, which wrote the code and checks.'
    ],
    page_ask: [
      'Ask anything about the model. Every answer says how sure it is, and says “open” when nobody knows.',
      'The guide answers from the same axioms and audit, tags each claim with a status, and says “open” where that is the honest answer.'
    ],
    forque: [
      'A push makes something move and spin. Two mathematicians found a way to write both as one line. Here we take their equations one at a time, write each on our bit rule and check it with exact arithmetic. You can open any row and re-run the check. A few printed lines come out slightly different, and we say which.',
      `Dorst and De Keninck’s PGA dynamics: a motor M, body velocity bivector B, momentum P = I[B], force and torque as one line F, and Ṗ = F, i.e. Ḃ = I⁻¹[B×I[B]+F] (Newton and Euler together). A translation matrix: ${FC.rows} equations of the paper beside their bit-rule form, a one-line check each, exact power series (${FC.ok} agree, ${FC.note} after a noted correction, ${FC.not_checked} not checked), a numpy check against Newton–Euler, the tennis racket. Only this paper was read.`
    ],
    spin: [
      'A spinor needs two full turns to come back to itself. Here a paper and a lecture say how to build one. We lay what each says side by side, subject by subject, and check it on our bit rule. The question that ties it together: what is i? We find four different things behind it. Open any row and re-run the check.',
      `Roelfs–Eelbode–De Keninck’s invariant decomposition (commuting simple factors b_j, labels, master idempotent ⊞, pointors ψOψ̃ = ρO) and Eelbode’s lecture (B = uv, boring plus drastic, ⊞ = B + i) on the bit rule: ${SC.rows} statements in six threads, ${SC.ok} agree exactly, ${SC.note} after a noted correction, ${SC.not_checked} not checked. Four kinds of i. The lecture was read from its slides only.`
    ],
    spring: [
      'Put a weight on every corner of the cube and a spring on every edge, then pluck one corner. The weights ring in a few pure tones, and we can say exactly which. The same rotation we used for planes also makes a single spring swing, and flipping a sign turns the swing into a runaway or a straight line.',
      `A unit mass on each vertex of the n-cube, a Hooke spring on each edge: x″ = −Lx, L = n·I − adjacency, modes the Walsh vectors with ω² = 2j and multiplicity C(n,j). An oscillator is the rotor flow s′ = ωBs with B² = −1 (+1: inverted, 0: free). With the generator’s sign on each spring the flux through every face is π and two levels n ± √n remain. ${SR.summary.ok} exact claims. Scalar displacements only.`
    ],
    rigid: [
      'Now the cube is not a pile of weights but one solid thing that moves. We start with a stick that can only slide, add a square that can spin, then the cube and the 4D cube. Hang one from a spring, flip a book in the air, send the Moon round the Earth. A script checks each step; the one claim about speed is timed, not proved.',
      `One rigid body in the plane-based algebra R(n,0,1) on the bit rule: M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]), the 2ⁿ motor coefficients on the 2ⁿ cube vertices. Segment to tesseract, a hung body (Hooke, gravity, damping as lines), the free top (inverted oscillator), the Moon and five planets. ${PG.ok} exact claims, ganja.js cross-checked; the label speedups are timed, not proved.`
    ]
  },
  it: {
    comm: [
      'Alcune mosse del modello commutano (l’ordine non conta) e altre no. Due piani che condividono un asse non commutano, e il risultato è il terzo piano. Disegna quelle coppie come linee e ottieni le trasformazioni di Lorentz: boost e rotazioni.',
      'Due bivettori anticommutano esattamente quando condividono un indice; il commutatore è ±2 volte il bivettore sulla differenza simmetrica. Con 1 asse di tempo e 3 di spazio è l’algebra di Lorentz (boost·boost → rotazione, rotazione·boost → boost). È so(p,q) disegnata come grafo, non un campo di gauge.'
    ],
    dirac: [
      'L’equazione dell’elettrone, costruita con la stessa regola: pochi numeri sui vertici di una forma a 4 dimensioni, ciascuno legato ai suoi vicini. Contiamo i legami e controlliamo che l’equazione si comporti bene sotto rotazioni e boost. Non la risolviamo.',
      'Forma di Hestenes (algebra spazio-temporale): ψ pari in Cl(1,3), ∇ψJ = mψγ₀ con J = γ₂γ₁. 8 componenti, 8 equazioni, 40 incidenze. Il determinante (p²−m²)⁴ e la covarianza sotto i sei bivettori sono esatti. Nessuna soluzione né somma sugli spin.'
    ],
    coupling: [
      'Qui l’equazione dell’elettrone e quella di Maxwell si incontrano: l’elettrone crea il campo, e il campo risponde sull’elettrone. Lo costruiamo una dimensione alla volta e controlliamo che la corrente elettrica si conservi. Quanto sia forte la risposta, non lo deriviamo.',
      'La corrente X = ψγ₀ψ̃ è la sorgente di ∇F = eX, e Dirac acquista −eAψ. Una forma carica richiede una struttura complessa J, che esiste da n = 3. Esatti: conservazione della corrente e invarianza di gauge al primo ordine. Aperto: segno e grandezza del termine sorgente (nessuna azione).'
    ],
    ym: [
      'Maxwell ha un solo tipo di carica; le forze più forti ne hanno diverse che non commutano. Usiamo le rotazioni di piano del passo 1 come elenco delle cariche e controlliamo che le equazioni di campo conservino ancora ciò che devono. Con due indici è di nuovo esattamente Maxwell.',
      'Algebra di gauge so(m) come bivettori di Cl(0,m); F = ∂A − ∂A + g[A,A]. Esatti: Bianchi (richiede Jacobi), covarianza di gauge al primo ordine, D^νJ_ν = 0. m = 2 è Maxwell. Aperti: g, l’azione, e quale algebra di gauge usi il modello.'
    ],
    matter: [
      'Ora il campo dell’elettrone riceve una seconda etichetta su cui agiscono le nuove forze, un po’ come un’etichetta di colore. Ogni forza ha una corrente conservata. Controlliamo che la contabilità sia coerente; non diciamo quali etichette portino le particelle reali.',
      'Ψ = ΣΨ_{S,T}; i generatori di so(m) agiscono per moltiplicazione a sinistra sul blade interno T, D = ∂ + gA^aB_a, [D,D]Ψ = gFΨ. Esatti: covarianza aggiunta e D^νj^a_ν = 0 sulla superficie. Aperti: g, il segno della sorgente, quale rappresentazione usi il modello, la chiralità.'
    ],
    grav1: [
      'La gravità è disegnata come le altre forze, con un riferimento e una regola su come si torce da un punto all’altro. La torsione (curvatura) è una tabella di numeri, e contiamo quante voci indipendenti ha: 20 in quattro dimensioni. Non costruiamo soluzioni.',
      'Connessione di spin ω, curvatura R = dω + ¼[ω,ω], tetrade e, torsione T = de + ωe, tutto sulla regola dei bit. Esatti per n = 2…5: D R = 0, D T = R∧e, covarianza di Lorentz locale, [D,D]ψ = ½Rψ. Conteggio di Riemann n²(n²−1)/12 (20 a n = 4), divisione in Ricci e Weyl con l’algebra lineare. Gravità al primo ordine (di Cartan); la lettura per coppie di piani è nostra.'
    ],
    grav2: [
      'L’equazione di Einstein, scritta con il riferimento e la curvatura. Controlliamo che, come nel caso elettrico, ciò a cui è legata debba essere conservato. Il segno del termine cosmologico risulta essere il segno di un asse in più. Forza e segno dell’accoppiamento alla materia sono aperti.',
      'E_a = Σ ε F^{bc}∧e^d…, F = R + c e∧e. Esatti per n = 3, 4, 5: D E_a = solo termini di torsione; a e = dx, E_a è il tensore di Einstein (rapporto 1). Un generatore in più di quadrato s dà dS o AdS con k = −s (MacDowell–Mansouri). Aperti: κ e il segno della sorgente, risolvere T = 0 per ω, qualunque soluzione.'
    ],
    mirrors: [
      'Uno specchio ribalta lo spazio rispetto a una retta o a un piano. Due specchi fanno una rotazione, e ogni movimento dello spazio richiede al massimo tanti specchi quante sono le direzioni. Ogni vertice del cubo è un insieme di specchi, e li contiamo. Metà dei vertici (numero pari di specchi) sono rotazioni.',
      'Riflessione in un vettore, x ↦ −a x a⁻¹; un prodotto di k riflessioni agisce con il sandwich ritorto di determinante (−1)^k. Cartan–Dieudonné: al massimo n specchi, verificato esattamente e con matrici. I vertici dell’n-cubo sono prodotti di specchi coordinati; la metà pari è il semicubo (Dₙ), e i 128 vertici del semicubo di E8 sono i vertici pari dell’8-cubo.'
    ],
    projective: [
      'E se lo spazio in cui ci muoviamo fosse piatto, curvo in un verso o curvo nell’altro? Una direzione in più, di tre tipi possibili, dà questi tre casi, e ne contiamo i movimenti. Due direzioni in più danno i moti conformi (allargare, stringere, invertire) e contengono quelli piatti. Ancora nessuna dinamica.',
      'Un generatore in più di quadrato s = 0, −1, +1 dà C(n+1,2) generatori con [B_an, B_bn] = −2s B_ab: Euclide/ellittico/iperbolico su base spaziale, Poincaré/dS/AdS su base di Lorentz (k = −s del passo 7). Una coppia nulla ε, o dà P(x) = o + x − ½x²ε, piani e sfere come vettori, e l’algebra conforme con C(n+2,2) generatori; la PGA sta dentro la CGA come algebra della base e di ε. Esatto; la dinamica (forque) è il passo successivo.'
    ],
    maxwell: [
      'La luce e l’elettricità seguono regole chiamate equazioni di Maxwell. Qui diventano un’unica equazione breve, e ogni pezzo è un piccolo passo sul cubo: aggiungi una direzione o toglila. La mostriamo in quattro modi e controlliamo ogni pezzo.',
      '∇F = J nell’algebra di Clifford dello spazio-tempo, ricostruita in 1–4 dimensioni spaziali e 1–4 temporali: ogni termine è una mossa che cambia grado su F, disegnata come algebra, simplesso, cubo ed etichette intere. Ogni termine, segno ed equazione d’onda è esatto; l’operatore d’onda è ellittico, iperbolico o ultraiperbolico a seconda della segnatura.'
    ],
    dictionary: [
      'Ogni particella e ogni forza del Modello Standard ha un nome nel modello di Furey. Qui ognuna è scritta in sei modi, da un semplice schema di bit alla notazione di Furey, così vedi la stessa cosa in sei lingue.',
      'Ogni stato del Modello Standard e ogni generatore di gauge del modello Cl(0,8) di Furey, scritti in sei notazioni (Furey, simplesso, Clifford, cubo, primi, vista incrociata). Costruito da 0 in su, così le simmetrie compaiono man mano che la struttura cresce; la colonna di Furey è verificata, le altre sono letture.'
    ],
    threegen: [
      'Una domanda breve: la stessa struttura potrebbe contenere tre copie della famiglia di particelle? Contando le caselle, sì, c’è posto. Controllando che le caselle portino le cariche giuste, no.',
      'Le 256 dimensioni reali di End(V) = M₁₆(ℝ) contengono tre generazioni? Le scomponiamo in irreps del Modello Standard con l’azione di gauge di Furey e contiamo le generazioni complete: le dimensioni lo permettono, le rappresentazioni di gauge no (ne entra una).'
    ],
    findings: [
      'Abbiamo ricostruito a mano lo spazio a 16 dimensioni di Furey e verificato ogni affermazione al computer. Ogni scheda dice cosa è stabilito e cosa no.',
      '𝕍 esplicito (ottonioni con Cayley–Dickson, ω = L_{e₇}); ogni affermazione verificata numericamente; ogni scheda dà lo stato e le prove. Riproduzione con furey/run_all.py.'
    ],
    orth: [
      'Prendi ogni direzione e metti un punto da ciascun lato del centro. Unendoli ottieni una forma chiamata ortoplesso. È il cubo rovesciato: ciò che è un vertice dell’uno è una faccia dell’altro.',
      'Il guscio convesso di ±e_i su n assi. Le facce sono lame con segno (una scelta di assi con un polo ciascuno); l’ortoplesso è duale del cubo, con i conteggi delle facce scambiati.'
    ],
    demi: [
      'Prendi un cubo e tieni un vertice su due: quelli con un numero pari di 1. Quella metà è il demicubo. Nel nostro dizionario sono esattamente le lame pari, e ogni spigolo del cubo salta da una metà all’altra.',
      'I vertici di peso pari dell’n-cubo sono le lame pari (scalare, bivettori, 4-vettori…); i vertici dispari sono le lame dispari. Ogni spigolo del cubo cambia la parità, quindi nessuno spigolo sta dentro una metà.'
    ],
    gosset: [
      'Due delle nostre forme si incontrano in un posto speciale: otto dimensioni. Insieme fanno i 240 vertici di una forma famosa chiamata E8, con due parenti più piccole dentro. Ricostruiamo tutta la famiglia con aritmetica esatta.',
      'L’8-ortoplesso (112 spigoli) più l’8-demicubo (128 vertici) danno le 240 radici di E8, con E6 ed E7 dentro. Ricostruito esattamente dalle matrici di Cartan, poi confrontato con le viste che già abbiamo.'
    ],
    tally: [
      'Una tabella di ogni equazione che abbiamo disegnato e controllato, una riga ciascuna. I disegni mostrano quali pezzi entrano in quale equazione. Non mostrano mai soluzioni.',
      'Una riga per equazione: dove compare, conteggi di componenti e incidenze, e lo stato. La struttura è disegnata dalla regola dei bit e controllata da script: identità, non soluzioni.'
    ],
    page_rule: [
      'Una forma si può descrivere con interruttori acceso/spento, e combinare due gruppi di interruttori segue una regola semplice. Disegniamo la regola in quattro modi e mostriamo come una scala di algebre cresce da tre idee di partenza.',
      'Le lame sono schemi di bit e il prodotto è XOR sulle etichette, a meno del segno. La regola è disegnata come algebra, simplesso, cubo e interi, e la scala delle algebre di Clifford è costruita da tre assiomi.'
    ],
    page_atlas: [
      'Una mappa di 25 caselle, ciascuna un diverso insieme di regole costruito con gli stessi interruttori. Scegline una per vedere i suoi pezzi. Il nome di una casella è una nostra lettura, quindi ognuna mostra quanto siamo sicuri.',
      '25 celle Cl(p,q) collocate da due gradazioni; per ognuna, algebra, simplesso, cubo ed etichette. Tipo di algebra e dimensione matriciale sono verificati; i nomi fisici sono letture, ciascuna con il suo stato di verifica.'
    ],
    page_maxwell: [
      'Prova 1: la regola può ricostruire qualcosa che già conosciamo? Luce ed elettricità sono un’unica equazione. La ricostruiamo in molte dimensioni e controlliamo ogni termine.',
      '∇F = J ricostruita con la sola regola dei bit in 1–4 dimensioni spaziali e 1–4 temporali, ogni termine controllato con aritmetica esatta.'
    ],
    page_furey: [
      'Prova 2: un caso più difficile, con la materia dentro. Un modello pubblicato costruisce una famiglia di particelle da un’algebra. Lo ricostruiamo e segniamo ciò che combacia e ciò che no.',
      'La costruzione di Furey di una generazione del Modello Standard in Cl(0,8), ricostruita esplicitamente; i suoi operatori mappati su lame, spigoli e canali nostri, con corrispondenze e discrepanze segnate.'
    ],
    page_shapes: [
      'Oltre al simplesso e al cubo ci sono altre due forme: una con due poli per direzione, e il mezzo cubo. Un terzo passo mostra come entrambe costruiscano una famosa forma a otto dimensioni.',
      'L’ortoplesso e il demicubo accanto al simplesso e al cubo; la serie di Gosset E6, E7, E8 costruita dalle due; ciascuna confrontata con le viste precedenti.'
    ],
    page_equations: [
      `Oltre a Maxwell, ${numWord('it', stepCount('eq'))} passi di equazioni, ciascuno disegnato dalla stessa regola e controllato da uno script. Gli ultimi tre sono l’articolo di qualcun altro sulle spinte, un articolo e una lezione sugli spin, e una molla sul cubo, scritti in modo che chiunque possa controllarli.`,
      `${capital(numWord('it', stepCount('eq')))} passi in più (${STEP_GROUPS.eq.map(id => NAV_NAMES.it[id]).join(', ')}), ciascuno un quadro di incidenze controllato da script. I passi 10 e 11 traducono il lavoro di altri (dinamica del forque; spinori) in matrici; il passo 12 è la nostra rete di molle risolta esattamente.`
    ],
    page_map: [
      'Una pagina per tutto il progetto: che cosa è finito, un albero di tutto ciò che abbiamo imparato con un pulsante per saltare a ogni parte, e che cosa fare dopo. In fondo dice chi ha fatto tutto questo e in che cosa può sbagliare.',
      'Stato di ogni parte, un albero della conoscenza i cui rami rimandano alla pagina e allo script che li sostiene (filtro per lente o filone), che cosa prendere da altri ricercatori per la dinamica, i prossimi passi previsti e il riconoscimento a Claude, che ha scritto il codice e i controlli.'
    ],
    page_ask: [
      'Chiedi qualsiasi cosa sul modello. Ogni risposta dice quanto è sicura, e dice «aperto» quando nessuno lo sa.',
      'La guida risponde dagli stessi assiomi e dallo stesso audit, etichetta ogni affermazione con uno stato, e dice «aperto» dove è la risposta onesta.'
    ],
    forque: [
      'Una spinta fa muovere e girare un oggetto. Due matematici hanno trovato come scrivere le due cose in una sola riga. Qui prendiamo le loro equazioni una per volta, le scriviamo sulla nostra regola dei bit e le controlliamo con aritmetica esatta. Puoi rifare ogni controllo. Alcune righe stampate escono diverse, e diciamo quali.',
      `PGA di Dorst e De Keninck: motore M, bivettore di velocità B, P = I[B], forza e coppia come un’unica retta F, e Ṗ = F, cioè Ḃ = I⁻¹[B×I[B]+F] (Newton ed Eulero). Una matrice di traduzione: ${FC.rows} equazioni dell’articolo accanto alla forma sulla regola dei bit, un controllo di una riga ciascuna, serie di potenze esatte (${FC.ok} tornano, ${FC.note} dopo una correzione annotata, ${FC.not_checked} non verificate), controllo numpy con Newton–Eulero, la racchetta. Letto solo questo articolo.`
    ],
    spin: [
      'Uno spinore ha bisogno di due giri interi per tornare uguale a sé. Un articolo e una lezione dicono come costruirlo. Affianchiamo ciò che dice ciascuno, argomento per argomento, e lo controlliamo. La domanda che lega tutto: che cos’è i? Dietro ci sono quattro cose diverse. Apri una riga e rifai il controllo.',
      `Decomposizione invariante di Roelfs–Eelbode–De Keninck (fattori b_j, etichette, idempotente maestro ⊞, pointor ψOψ̃ = ρO) e lezione di Eelbode (B = uv, ⊞ = B + i) sulla regola dei bit: ${SC.rows} affermazioni in sei fili, ${SC.ok} tornano, ${SC.note} dopo una correzione annotata, ${SC.not_checked} non verificate. Quattro tipi di i. Lezione letta solo dalle diapositive.`
    ],
    spring: [
      'Metti un peso su ogni angolo del cubo e una molla su ogni spigolo, poi pizzica un angolo. I pesi suonano in pochi toni puri, e possiamo dire esattamente quali. La stessa rotazione che usavamo per i piani fa oscillare anche una sola molla, e cambiare un segno trasforma l’oscillazione in una fuga o in una retta.',
      `Una massa unitaria su ogni vertice dell’n-cubo, una molla di Hooke su ogni spigolo: x″ = −Lx, L = n·I − adiacenza, modi i vettori di Walsh con ω² = 2j e molteplicità C(n,j). L’oscillatore è il flusso del rotore s′ = ωBs con B² = −1 (+1: invertito, 0: libero). Con il segno del generatore su ogni molla il flusso su ogni faccia è π e restano due livelli n ± √n. ${SR.summary.ok} affermazioni esatte. Solo spostamenti scalari.`
    ],
    rigid: [
      'Ora il cubo non è un mucchio di pesi ma una sola cosa solida che si muove. Parti da un bastoncino che scivola, poi un quadrato che gira, il cubo e il cubo 4D. Appendine uno a una molla, fai girare un libro in aria, manda la Luna attorno alla Terra. Uno script controlla ogni passo; la velocità è misurata, non dimostrata.',
      `Un corpo rigido nell’algebra proiettiva R(n,0,1) sulla regola dei bit: M′ = −½MB, B′ = A⁻¹(F + ½[B, A(B)]), i 2ⁿ coefficienti del motore sui 2ⁿ vertici del cubo. Dal segmento al tesseratto, un corpo appeso (Hooke, gravità, smorzamento come rette), la trottola libera (oscillatore invertito), la Luna e cinque pianeti. ${PG.ok} affermazioni esatte, confrontate con ganja.js; i guadagni di velocità delle etichette sono misurati, non dimostrati.`
    ]
  }
};
