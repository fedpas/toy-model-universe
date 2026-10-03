// Short readings of each equation step for the three audiences (Learner, Physics, Math). The full text stays on the page, folded.
// Level 0 = Young Learner, 1 = Physicist, 2 = Mathematician (the mathematician reads the full introduction, so no short text is needed).
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
    ]
  }
};
