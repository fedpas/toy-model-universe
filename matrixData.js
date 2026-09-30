import AUTHOR_TRANSLATIONS from './sector-translations.js';
// Master 2D Clifford lattice matrix directory (B+F vs B-F).
const nodes = [
 ['Sector_Vacuum_Origin','Foundational Symmetries','Grade 0 Pure Scalar','B+F=0, B-F=0','Empty Set Vertex Core (Ø)','[0, 0, 0, 0] ⊗ [0, 0, 0, 0]','The Cl(0,0) Trivial Vacuum Origin Root',"La Radice dell'Origine del Vuoto Banale Cl(0,0)",'Located at the absolute grid origin, this scalar multiplier root carries zero active base or fiber dimensions and acts as the baseline reference field.','Situata all’origine assoluta della griglia, questa radice scalare non ha dimensioni attive di base o fibra e agisce come campo di riferimento.'],
 ['Sector_Inject_Base_Real','Foundational Symmetries','Grade 1 Vector','B+F=1, B-F=+1','0-face Vertex','[+, 0, L, G₀] ⊗ [0, 0, 0, 0]','The Cl(1,0) Macroscopic Base Injector','Iniettore di Base Reale Cl(1,0)','This primary cell injects a real space-like vector onto the base manifold, generating the background coordinates for physical spatial paths.','Questa cella primaria inietta un vettore reale di tipo spazio sulla varietà di base, generando le coordinate di sfondo per i percorsi fisici.'],
 ['Sector_Inject_Fiber_Clock','Foundational Symmetries','Grade 1 Pseudo-Vector','B+F=1, B-F=-1','Internal Face Edge','[0, 1, L, G₀] ⊗ [1, 0, 0, ν]','The Cl(0,1) Internal Complex Fiber Injector','Iniettore della Fibra Complessa Cl(0,1)','This cell injects a complex phase coordinate inside the gauge fiber, functioning as the phase clock for the portal’s electromagnetic mapping.','Questa cella inietta una coordinata di fase complessa nella fibra di gauge, fungendo da orologio di fase per la mappatura elettromagnetica del portale.'],
 ['Sector_EM_Maxwell','Foundational Symmetries','Grade 2 Bivector','B+F=8, B-F=+6','1-face (Edge Segment)','[+, 1, L, G₀] ⊗ [1, 0, 0, ν]','The Maxwell Field Tensor: ∇F = J','Tensore del Campo di Maxwell: ∇F = J','Formed by the tensor composition of the Cl(1,0) and Cl(0,1) building blocks, compiling the portal’s electromagnetic channels into a coordinate-free Clifford statement.','Formulato dal prodotto tensoriale dei blocchi Cl(1,0) e Cl(0,1), compilando i canali elettromagnetici del portale in un enunciato Clifford.'],
 ['Sector_Gravity_Strain','Foundational Symmetries','Grade 6 Hexvector Connection','B+F=8, B-F=+4','5-face (Boundary Flank)','[±, 0/1, L/R, G₀/₁] ⊗ [Lattice Strain Field]','Gauge Theory Gravity & Elastic Strain Connection','Gravità della Teoria di Gauge e Sforzo Elastico','Gravity replaces Riemann metric tensors with a localized translation gradient that skews 8-cube lattice axes under local mass-energy density.','La gravità sostituisce i tensori metrici di Riemann con un gradiente di traslazione localizzato che inclina gli assi del reticolo a 8 cubi.'],
 ['Sector_Quaternionic_Base','Structural Realignments','Grade 2 Bivector Operator','B+F=2, B-F=+2','2-face (Triangle Surface Canvas)','[+, 1, L, G₀] ⊗ [0, 0, 0, 0]','The Cl(2,0) Macroscopic Quaternionic Base Cell','La Cella di Base Quaternionica Cl(2,0)','This cell maps two space-like vector choices onto the manifold, regenerating Hamilton’s real quaternionic spin algebra and its rotational constraints.','Questa cella mappa due scelte vettoriali di tipo spazio sulla varietà, rigenerando l’algebra quaternionica reale di Hamilton e i suoi vincoli rotazionali.'],
 ['Sector_Quaternionic_Fiber','Structural Realignments','Grade 2 Fiber Rotor','B+F=2, B-F=-2','2-face (Hidden Gauge Cluster)','[0, 1, L, G₀] ⊗ [0, 1, 0, ν]','The Cl(0,2) Electroweak Gauge Fiber Ring',"L'Anello della Fibra di Gauge Elettrodebole Cl(0,2)",'This cell locks two negative-squaring vectors inside the quantum fiber, creating the portal’s compact quaternionic phase space for internal SU(2) weak isospin mappings.','Questa cella blocca due vettori a quadratura negativa nella fibra quantistica, creando lo spazio di fase quaternionico compatto per le mappature di isospin debole SU(2).'],
 ['Sector_Baryon_Conservation','Structural Realignments','Grade 3 Trivector Loop','B+F=8, B-F=+2','2-face Triangular Boundary','[±, 0, L, G₀] ⊗ [0, 0, 1, ν]','Topological Baryon Stability & 7-Prime Core','Stabilità Barionica Topologica e Core a 7-Primi','Baryon number conservation is a rigid topological winding across cyclic loops of an embedded Fano plane in this toy model.','La conservazione del numero barionico è un avvolgimento topologico rigido attraverso i cicli di un piano di Fano incorporato in questo modello giocattolo.'],
 ['Sector_Electroweak_Unified','Structural Realignments','Grade 2/4 Ideal Intersection','B+F=8, B-F=0','Unified Edge Connectivity Graph K₈','[-, 1, L, G₀↔G₁] ⊗ [1, 1, 0, ν]','The Saturated Electroweak Gauge Sector','Il Settore di Gauge Elettrodebole Saturato','The centered 4-base, 4-fiber mesh contains 17 neutral paths; its 4/17 fraction is an internal packing convention, not a Standard Model prediction.','La rete centrata di 4 basi e 4 fibre contiene 17 percorsi neutri; la sua frazione 4/17 è una convenzione interna di impacchettamento, non una previsione del Modello Standard.'],
 ['Sector_Vacuum_Mass_Generation','Speculative Frontiers','Grade 0 Identity / Grade 7 Inversion','B+F=0, B-F=0','The Empty Face (Ø) & 6-face Envelopes','[+, 0, R, G₀] ⊗ [0, 0, 0, 0]','The Higgs VEV, Sterile Neutrino & Charge Conjugation','Il VEV di Higgs, il Neutrino Sterile e la Coniugazione di Carica','The passive identity is mapped to a sterile-neutrino state; active matrix actions map it to the portal’s mass-generation convention.','L’identità passiva è mappata a uno stato di neutrino sterile; azioni matriciali attive la mappano alla convenzione di generazione della massa del portale.'],
 ['Sector_GUT_Junction','Speculative Frontiers','Grade 4 Quadrivector','B+F=8, B-F=-4','3-face (Internal Cell Cluster)','[-, 1, R, G₁] ⊗ [1, 1, 1, 1]','The Primorial Saturation Checkpoint','Il Checkpoint di Saturazione Primorale','Grand Unification is represented as an arithmetic saturation checkpoint at the primorial product 210, where gauge tracks overlap in one matrix block.','La Grande Unificazione è rappresentata come checkpoint di saturazione aritmetica al prodotto primorale 210, dove i canali di gauge si sovrappongono in un blocco di matrice.'],
 ['Sector_Cosmic_Horizon','Speculative Frontiers','Grade 8 Pseudoscalar Volume','B+F=8, B-F=-8','1 Whole 7-face Simplex','[1, 1, 1, 1] ⊗ [1, 1, 1, 1]','The Maximal Pseudoscalar Horizon Boundary',"L'Orizzonte Pseudoscalare Massimo di Confine",'The 256-multiplicity element maps to the global pseudoscalar volume and the anti-podal vertex in the portal’s boundary-reset convention.','L’elemento a molteplicità 256 si mappa sul volume pseudoscalare globale e sul vertice antipodale nella convenzione di reset del confine del portale.'],
];
export const KNOWLEDGE_BASE_DIRECTORY = {};
for (const [id,category,grade,coordinate,simplex,cube,enTitle,itTitle,enDesc,itDesc] of nodes) {
 const base={id,category,grade,coordinate,simplex,cube};
 for (const [lang,title,desc] of [['en',enTitle,enDesc],['it',itTitle,itDesc]]) {
  KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_Physicist`]={...base,title,desc};
  KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_Mathematician`]={...base,title,desc};
  KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_Young Learner`]={...base,title,desc};
 }
}
export let MENU_SECTOR_LIST = nodes.map(([id,category])=>({id,category}));
const tour={en:{'Young Learner':['Eight quiet switches wait in a sandbox.','Choose space or time paths.','Choose the sandbox or a wheel.','Choose the final left or right path.'],Physicist:['Isotropic ground state.','Witt signature split.','Base-fiber grading.','Chiral orientation.'],Mathematician:['Isotropic radical root.','Quadratic-form split.','Grade filtration.','Minimal ideal involution.']},it:{'Young Learner':['Otto interruttori tranquilli attendono nel recinto.','Scegli percorsi di spazio o tempo.','Scegli il recinto o una ruota.','Scegli il percorso finale sinistro o destro.'],Physicist:['Stato fondamentale isotropo.','Scissione della segnatura di Witt.','Gradazione base-fibra.','Orientamento chirale.'],Mathematician:['Radice isotropa radicale.','Scissione della forma quadratica.','Filtrazione del grado.','Involuzione dell’ideale minimo.']}};
export const TUTORIAL_SLIDER_CONFIG=Object.fromEntries(Object.entries(tour).map(([lang,profiles])=>[lang,Object.fromEntries(Object.entries(profiles).map(([profile,items])=>[profile,items.map((desc,i)=>({step:i+1,title:`${lang==='it'?'Passo':'Step'} ${i+1}`,desc}))]))]));


const extensionNodes = [
 ['Sector_Trivector_Base','Foundational Symmetries','Grade 3 Trivector / Pseudoscalar','B+F=3, B-F=+3','3-face (Volumetric Tetrahedron)','Cl(3,0) Real Volume Mesh','The Cl(3,0) Macroscopic Spatial Volume Cell','La Cella del Volume Spaziale Macroscopico Cl(3,0)','This cell maps three real space-like vectors onto the manifold, generating the 3D spatial volume element that anchors distance parameters.','Questa cella mappa tre vettori reali di tipo spazio sulla varietà, generando l’elemento di volume spaziale 3D che ancora i parametri di distanza.'],
 ['Sector_Trivector_Quark','Structural Realignments','Grade 3 Mixed Trivector','B+F=3, B-F=+1','Asymmetric Edge-Face Intersection','Cl(2,1) Mixed Quark Core','The Mixed Quark Core Interaction Channel','Il Canale di Interazione del Core Quark Misto','This asymmetric two-base, one-fiber configuration serves as the portal’s seed for the Chiral Quark-Gluon Vertex and factor-7 color loops.','Questa configurazione asimmetrica di due basi e una fibra funge da seme del portale per il vertice quark-gluone chirale e i loop di colore del fattore 7.'],
 ['Sector_Trivector_Lepton','Structural Realignments','Grade 3 Mixed Rotor','B+F=3, B-F=-1','Unified Leptonic Edge Cross','Cl(1,2) Lepton Frame','The Cl(1,2) Leptonic Current Frame','Il Frame della Corrente Leptonica Cl(1,2)','One space-like bit remains on the base manifold while two time-like bits enter the fiber, building the portal’s leptonic phase geometry.','Un bit di tipo spazio resta sulla varietà di base mentre due bit di tipo tempo entrano nella fibra, costruendo la geometria di fase leptonica del portale.'],
 ['Sector_STA_Euclidean_Base','Foundational Symmetries','Grade 4 Quadrivector','B+F=4, B-F=+4','4-face (Hyper-volume Cell)','Cl(4,0) Euclidean Base','The Cl(4,0) Pure Euclidean Base Cell','La Cella di Base Euclidea Pura Cl(4,0)','This cell maps four real space-like vectors onto a flat 4D spatial container.','Questa cella mappa quattro vettori reali di tipo spazio in un contenitore spaziale 4D piatto.'],
 ['Sector_STA_Minkowski','Foundational Symmetries','Grade 1-4 Multivector Frame','B+F=4, B-F=+2','Minkowski Spacetime Vector Intersect','Cl(3,1) Physical Vector Frame','The Cl(3,1) Minkowski Physical Vector Frame','Il Frame Vettoriale Fisico Minkowski Cl(3,1)','Three base dimensions and one fiber dimension generate the portal’s special-relativity vector frame.','Tre dimensioni di base e una dimensione di fibra generano il frame vettoriale di relatività speciale del portale.'],
 ['Sector_STA_Symmetric_Core','Structural Realignments','Grade 2 Balanced Bivector Mesh','B+F=4, B-F=0','Symmetric 4-Bit Cross-Talk Node','Cl(2,2) Split Electroweak Core','The Cl(2,2) Balanced Electroweak Core Cell','La Cella del Core Elettrodebole Bilanciato Cl(2,2)','A symmetric split of two base and two fiber dimensions creates the portal’s electroweak mixing lane.','Una scissione simmetrica di due dimensioni di base e due di fibra crea il canale di mescolamento elettrodebole del portale.'],
 ['Sector_STA_Fiber_Frame','Structural Realignments','Grade 3/4 Fiber Invariant Operator','B+F=4, B-F=-2','Chirality-Locked Fiber Cluster','Cl(1,3) Weak Gauge Fiber Frame','The Cl(1,3) Weak Gauge Fiber Frame Cell','La Cella del Frame della Fibra di Gauge Debole Cl(1,3)','One base bit and three fiber bits generate the signature for the portal’s chirality-locked weak gauge couplings.','Un bit di base e tre bit di fibra generano la segnatura per gli accoppiamenti di gauge deboli chirali del portale.'],
 ['Sector_Row5_Base','Structural Realignments','Grade 5 Pentavector','B+F=5, B-F=+3','4-face Spacetime Edge Flank','Cl(4,1) Complexified Base','The Cl(4,1) Complexified Spacetime Spinor Cell','La Cella Spinoriale Spazio-Temporale Complessificata Cl(4,1)','This fifth pseudoscalar axis is the portal’s structural convention for maximal parity violation.','Questo quinto asse pseudoscalare è la convenzione strutturale del portale per la violazione massima della parità.'],
 ['Sector_Row6_Confinement','Structural Realignments','Grade 6 Hexvector Connection','B+F=6, B-F=+2','5-face Boundary Polytope Flank','Cl(5,1) Confinement Mesh','The Cl(5,1) Color Confinement Mesh Cell','La Cella Mesh di Confinamento del Colore Cl(5,1)','This grid constraint maps embedded Fano-plane loops and closed triangular color faces.','Questo vincolo di griglia mappa i loop del piano di Fano incorporato e le facce triangolari di colore chiuse.'],
 ['Sector_Row7_Mirror','Speculative Frontiers','Grade 7 Septvector','B+F=7, B-F=+1','6-face Hyper-surface Envelope','Cl(4,3) Chiral Half-Pool','The Cl(4,3) Chiral Mirror Half-Pool Threshold','Il Semipool Chirale Cl(4,3) di Confine','This threshold represents a single polarized matter sector and the portal’s anti-podal complement convention.','Questa soglia rappresenta un singolo settore di materia polarizzata e la convenzione del portale per il complemento antipodale.'],
 ['Sector_Open_Questions','Speculative Frontiers','Non-Commutative Bimodule Operator','L_a R_b Framework Boundaries','The Unclosed Scaffold Network','Limitations & Numerological Traps','Open Structural Anomalies & The Furey Lens','Anomalie Strutturali Aperte e la Lente di Furey','A reality check: mass scaling, running constants, CKM precision drift, and the continuum limit remain unresolved limitations of this toy model.','Un controllo di realtà: scala di massa, running delle costanti, scostamento CKM e limite del continuo restano limiti irrisolti di questo modello giocattolo.'],
 ['Sector_Furey_Ledger','Speculative Frontiers','Regular Bimodule Representation','Row B+F=6, Column B-F=+2','Peirce Idempotent Vertex Projector','Cl(6,0) ⊗ Cl(2,0) Operator Matrix','Chapter I: The Furey Regular Representation Ledger','Capitolo I: Il Registro della Rappresentazione Regolare di Furey','A dedicated research chapter connecting complex octonionic left-multiplication chains and Peirce idempotents to the portal’s lattice coordinates.','Un capitolo di ricerca che collega catene di moltiplicazione sinistra octonioniche complesse e idempotenti di Peirce alle coordinate del reticolo del portale.'],
];
for (const [id,category,grade,coordinate,simplex,cube,enTitle,itTitle,enDesc,itDesc] of extensionNodes) {
 const base={id,category,grade,coordinate,simplex,cube};
 for (const [lang,title,desc] of [['en',enTitle,enDesc],['it',itTitle,itDesc]]) for (const profile of ['Physicist','Mathematician','Young Learner']) KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_${profile}`]={...base,title,desc};
}
const extensionMenu=extensionNodes.map(([id,category])=>({id,category}));
const menuOrder=['Sector_Inject_Base_Real','Sector_Inject_Fiber_Clock','Sector_Quaternionic_Base','Sector_Quaternionic_Fiber','Sector_Trivector_Base','Sector_Trivector_Quark','Sector_Trivector_Lepton','Sector_STA_Euclidean_Base','Sector_STA_Minkowski','Sector_STA_Symmetric_Core','Sector_STA_Fiber_Frame','Sector_Row5_Base','Sector_Row6_Confinement','Sector_Row7_Mirror','Sector_EM_Maxwell','Sector_Electroweak_Unified','Sector_Vacuum_Mass_Generation','Sector_GUT_Junction','Sector_Cosmic_Horizon','Sector_Open_Questions','Sector_Furey_Ledger'];
const allMenu=[...MENU_SECTOR_LIST,...extensionMenu];
MENU_SECTOR_LIST=menuOrder.map(id=>allMenu.find(item=>item.id===id));

// Authored audience tracks: these override compatibility copies generated above.
const authoredTracks={
 'Young Learner':{
  en:{
   Sector_Inject_Base_Real:['The Sandbox Line Painter','This magic switch paints the first straight line on the outer sandbox so objects have a place to sit and move.'],
   Sector_Inject_Fiber_Clock:['The Invisible Timing Wheel','This hidden switch builds a secret spinning clock that keeps electrical flashes and light rays in time.'],
   Sector_Quaternionic_Base:['The Spinning Top Sandbox Floor','Two space switches make a spinning-top floor tile that gives every toy a double-turn twist.'],
   Sector_Quaternionic_Fiber:['The Locked Weak Force Switchboard','Two hidden timing wheels lock inside a compact control box that steers the weak-force channels.'],
   Sector_Trivector_Base:['The Magic 3D Toy Box','Three flat line switches pop outward into a solid toy box with height, width, and depth.'],
   Sector_Trivector_Quark:['The Fractional Quark Puzzle Piece','Two sandbox steps and one hidden gear make a lopsided piece that can lock into triangles.'],
   Sector_Trivector_Lepton:["The Electron's Spinning Dance Floor",'One sandbox track and two hidden timing gears make the rolling dance floor used by light particles.'],
   Sector_STA_Euclidean_Base:['The Four-Dimensional Solid Castle','Four space pieces make a giant frozen castle block before the moving movie of time begins.'],
   Sector_STA_Minkowski:['The Cosmic Movie Projector','Three outer paths and one clock gear make the light-cone movie that keeps moving objects on time.'],
   Sector_STA_Symmetric_Core:['The Crossroads Control Station','Two sandbox channels and two clock gears balance at the middle crossroads.'],
   Sector_STA_Fiber_Frame:['The Left-Handed Magic Box','One outer track and three hidden gears make a box that catches left-handed weak-force paths.'],
   Sector_Row5_Base:['The One-Way Mirror Duel','An extra tracking line turns the playground into a mirror maze where left and right paths behave differently.'],
   Sector_Row6_Confinement:['The Closed Triangle Locking Trap','Six switches build a locking grid where three puzzle pieces must join into a stable triangle.'],
   Sector_Row7_Mirror:['The Mirror World Gate','This 128-piece gate can flip an ordinary state into its opposite mirror twin.'],
   Sector_EM_Maxwell:['The Flash of Light & Maxwell’s Clock','Light and electricity are ripples of one hidden switch tipping between sandbox space and a clock face.'],
   Sector_Electroweak_Unified:['The Electro-Weak Gearbox','Light gears and time gears join at a switchboard with neutral and charged paths.'],
   Sector_Vacuum_Mass_Generation:['The Invisible Origin Key','The number one can rest quietly like an invisible guest or become an active key that gives matter weight.'],
   Sector_GUT_Junction:['The Ultimate Overlap Knot','At 210, space, light, weak force, and color all meet because the puzzle runs out of room.'],
   Sector_Cosmic_Horizon:['The Big Cosmic Reset Wall','When all eight switches turn on, the toy universe reaches its outer mirror wall.'],
   Sector_Open_Questions:['Cracks in the Toy Box Construction','This is where the toy box admits its leaks: it cannot yet measure exact weights or make instant switches flow smoothly.'],
   Sector_Furey_Ledger:["Professor Cohl’s Secret Blueprint",'A special research letter connects magic algebra boxes, three generations, and gravity-squeezing lines.']
  },
  it:{
   Sector_Inject_Base_Real:['Il Pittore di Linee del Recinto','Questo interruttore magico dipinge la prima linea sul recinto di sabbia affinché gli oggetti possano stare e muoversi.'],
   Sector_Inject_Fiber_Clock:['La Ruota del Tempo Invisibile','Questo interruttore nascosto costruisce un orologio segreto che tiene in tempo luce e segnali elettrici.'],
   Sector_Quaternionic_Base:['Il Pavimento a Trottola del Recinto','Due interruttori dello spazio creano una piastrella a trottola che fa girare i giocattoli due volte.'],
   Sector_Quaternionic_Fiber:['Il Centralino Chiuso della Forza Debole','Due ruote nascoste si bloccano in una scatola compatta che guida i canali della forza debole.'],
   Sector_Trivector_Base:['La Scatola Magica 3D dei Giocattoli','Tre interruttori piatti si espandono in una scatola solida con altezza, larghezza e profondità.'],
   Sector_Trivector_Quark:['Il Pezzo di Puzzle Frazionario dei Quark','Due passi nel recinto e un ingranaggio segreto creano un pezzo sbilanciato che si incastra a triangolo.'],
   Sector_Trivector_Lepton:["La Pista da Ballo dell'Elettrone",'Un binario del recinto e due ingranaggi nascosti creano la pista delle particelle leggere.'],
   Sector_STA_Euclidean_Base:['Il Castello Solido a Quattro Dimensioni','Quattro pezzi spaziali costruiscono un grande castello fermo prima che inizi il film del tempo.'],
   Sector_STA_Minkowski:['Il Proiettore Cinematografico Cosmico','Tre percorsi esterni e un ingranaggio interno creano il film dei coni di luce.'],
   Sector_STA_Symmetric_Core:['La Stazione di Controllo del Bivio','Due canali esterni e due ingranaggi del tempo si bilanciano al bivio centrale.'],
   Sector_STA_Fiber_Frame:['La Scatola Magica della Mano Sinistra','Un binario esterno e tre ingranaggi nascosti creano una scatola che cattura i percorsi mancini.'],
   Sector_Row5_Base:['Lo Specchio Magico Unidirezionale','Una linea in più trasforma il parco giochi in un labirinto di specchi per percorsi sinistri e destri.'],
   Sector_Row6_Confinement:['La Trappola a Triangolo Chiuso','Sei interruttori costruiscono una griglia che costringe tre pezzi a formare un triangolo stabile.'],
   Sector_Row7_Mirror:['Il Cancello del Mondo Specchio','Questo cancello di 128 pezzi può capovolgere uno stato nel suo gemello speculare.'],
   Sector_EM_Maxwell:['Il Lampo di Luce e l’Orologio di Maxwell','Luce ed elettricità sono onde di un interruttore nascosto tra spazio e orologio.'],
   Sector_Electroweak_Unified:["L’Ingranaggio Elettrodebole",'Gli ingranaggi della luce e del tempo si uniscono in un centralino di percorsi neutri e carichi.'],
   Sector_Vacuum_Mass_Generation:["La Chiave d’Origine Invisibile",'Il numero uno può riposare come ospite invisibile o diventare una chiave che dà peso alla materia.'],
   Sector_GUT_Junction:['Il Nodo di Sovrapposizione Assoluto','A 210, spazio, luce, forza debole e colore si incontrano perché il puzzle esaurisce lo spazio.'],
   Sector_Cosmic_Horizon:['Il Grande Muro del Reset Cosmico','Quando tutti gli otto interruttori sono accesi, l’universo giocattolo raggiunge il suo muro specchio.'],
   Sector_Open_Questions:['Crepe nella Costruzione della Scatola','Qui la scatola ammette i suoi limiti: non misura ancora pesi esatti né rende fluidi gli interruttori.'],
   Sector_Furey_Ledger:['Il Progetto Segreto della Professoressa Cohl','Una lettera di ricerca collega scatole algebriche, tre generazioni e linee di gravità.']
  }
 },
 Mathematician:{
  en:{
   Sector_Vacuum_Origin:['The Multiplicative Identity Scalar Field','The Grade-0 scalar identity is the radical origin from which principal ideals and nested filtrations branch.'],
   Sector_Inject_Base_Real:['The Cl(1,0) Real Division Line Algebra','A positive-squaring exterior generator defines a discrete grading filtration over the real division line.'],
   Sector_Inject_Fiber_Clock:['The Cl(0,1) Complex Phase Ring Generator','A negative-squaring generator isolates a complex phase field within the principal fiber ideal.'],
   Sector_Quaternionic_Base:['The Cl(2,0) Real Matrix Ring M₂(R)','Two positive generators compile into a real matrix algebra with non-trivial zero divisors.'],
   Sector_Quaternionic_Fiber:['The Cl(0,2) Compact Quaternion Division Ring','Two negative fiber generators form the compact quaternion division algebra governing weak-isospin ideals.'],
   Sector_Trivector_Base:['The Cl(3,0) Oriented Volume Pseudoscalar','The antisymmetric product of three base generators defines the oriented volume invariant.'],
   Sector_Trivector_Quark:['The Cl(2,1) Non-Commutative Quotient Sub-Space','A mixed trivector quotient projects asymmetric base-fiber grading into Fano-plane loops.'],
   Sector_Trivector_Lepton:['The Cl(1,2) Complex Linear Isomorphism M₂(C)','One base generator acting on a dual negative fiber ring coordinates leptonic spinors.'],
   Sector_STA_Euclidean_Base:['The Cl(4,0) Exterior Quotient Algebra','Four real basis elements generate a closed exterior boundary filtration.'],
   Sector_STA_Minkowski:['The Cl(3,1) Real Space-Time Algebra Ring','Three base coordinates and one fiber metric generate the 16-dimensional space-time algebra.'],
   Sector_STA_Symmetric_Core:['The Cl(2,2) Split Hyperbolic Matrix Ring','A symmetric base-fiber division creates the central lane for ideal intersection mixing.'],
   Sector_STA_Fiber_Frame:['The Cl(1,3) Biquaternionic Clifford Ring','One base generator and three fiber dimensions isolate chirality-locked minimal left ideals.'],
   Sector_Row5_Base:['The Cl(4,1) Complexified Ideals Mapping','A fifth pseudoscalar axis breaks the symmetry of Clifford grading involutions.'],
   Sector_Row6_Confinement:['The Cl(5,1) Hexvector Boundary Holonomy','A closed boundary holonomy restricts trivector ideals to a color-singlet subspace.'],
   Sector_Row7_Mirror:['The Cl(4,3) Direct Sum Split Semipool','A 128-dimensional semisimple algebra tracks hyperplane coordinates for NOT involutions.'],
   Sector_EM_Maxwell:['The Invariant De Rham Cohomology Flux','An exterior derivative maps vector currents into curvature bivectors within the principal ideals of the Maxwell cell.'],
   Sector_Electroweak_Unified:['The Non-Commutative Ideals of Cl(4,4,0)','Principal sub-ideal intersections encode the toy model’s left-handed packing fraction.'],
   Sector_Vacuum_Mass_Generation:['The Identity Scalar Multiplier Field','The scalar identity maps to passive column ideals and active symmetry-breaking operators.'],
   Sector_GUT_Junction:['The Supersymmetric Quadrivector Domain','A Grade-4 blade links simplex faces to octeract sub-block partitions.'],
   Sector_Cosmic_Horizon:['The Saturated Pseudoscalar Volume Reset','The maximal element saturates base and fiber products, forcing an involutionary boundary reset.'],
   Sector_Open_Questions:['The Scaffold Incompleteness Invariant','No native mechanism derives continuous RGE curves or absolute mass metrics without imported scales.'],
   Sector_Furey_Ledger:['The Regular Bimodule Representation','Octonionic left chains and Peirce idempotents map into the 8-bit lattice to extend minimal ideals across families.']
  },
  it:{
   Sector_Vacuum_Origin:["Il Campo Scalare dell’Identità Moltiplicativa",'L’identità scalare di Grado 0 è l’origine radicale da cui si ramificano ideali principali e filtrazioni.'],
   Sector_Inject_Base_Real:['L’Algebra della Linea di Divisione Reale Cl(1,0)','Un generatore a quadratura positiva definisce una filtrazione discreta della linea reale.'],
   Sector_Inject_Fiber_Clock:['Il Generatore dell’Anello di Fase Complesso Cl(0,1)','Un generatore a quadratura negativa isola un campo di fase complesso nell’ideale della fibra.'],
   Sector_Quaternionic_Base:['L’Anello Matriziale Reale M₂(R) Cl(2,0)','Due generatori positivi si compilano in un’algebra matriciale reale con divisori dello zero.'],
   Sector_Quaternionic_Fiber:['L’Anello di Divisione dei Quaternioni Compatti Cl(0,2)','Due generatori negativi formano l’algebra di divisione quaternionica per gli ideali di isospin debole.'],
   Sector_Trivector_Base:['Lo Pseudoscalare del Volume Orientato Cl(3,0)','Il prodotto antisimmetrico di tre generatori di base definisce l’invariante di volume.'],
   Sector_Trivector_Quark:['Il Sottospazio Quoziente Non Commutativo Cl(2,1)','Un quoziente trirettoriale misto proietta la gradazione asimmetrica nei loop del piano di Fano.'],
   Sector_Trivector_Lepton:['L’Isomorfismo Lineare Complesso M₂(C) Cl(1,2)','Un generatore di base su un doppio anello negativo coordina gli spinori leptonici.'],
   Sector_STA_Euclidean_Base:['L’Algebra Quoziente Esterna Cl(4,0)','Quattro elementi reali generano una filtrazione esterna di confine chiusa.'],
   Sector_STA_Minkowski:['L’Anello dell’Algebra Spazio-Temporale Reale Cl(3,1)','Tre coordinate di base e una metrica di fibra generano l’algebra spazio-temporale a 16 dimensioni.'],
   Sector_STA_Symmetric_Core:['L’Anello Matriziale Iperbolico Split Cl(2,2)','La divisione simmetrica base-fibra crea la corsia centrale per l’intersezione degli ideali.'],
   Sector_STA_Fiber_Frame:['L’Anello Biquaternionico di Clifford Cl(1,3)','Un generatore di base e tre dimensioni di fibra isolano ideali sinistri minimi chirali.'],
   Sector_Row5_Base:['La Mappatura degli Ideali Complessificati Cl(4,1)','Un quinto asse pseudoscalare rompe la simmetria delle involuzioni di gradazione.'],
   Sector_Row6_Confinement:['L’Olonomia del Confine Esavettoriale Cl(5,1)','Un’olonomia chiusa restringe gli ideali trirettoriali a un sottospazio singoletto di colore.'],
   Sector_Row7_Mirror:['La Scissione in Somma Diretta del Semipool Cl(4,3)','Un’algebra semisemplice a 128 dimensioni traccia le coordinate per le involuzioni NOT.'],
   Sector_EM_Maxwell:['Il Flusso Invariante della Cohomologia di De Rham','Una derivata esterna mappa correnti vettoriali in bivettori di curvatura negli ideali principali.'],
   Sector_Electroweak_Unified:['Gli Ideali Non Commutativi di Cl(4,4,0)','Intersezioni di sotto-ideali codificano la frazione di impacchettamento mancina del modello.'],
   Sector_Vacuum_Mass_Generation:['Il Campo del Moltiplicatore Scalare di Identità','L’identità scalare si mappa a ideali di colonna passivi e operatori attivi di rottura della simmetria.'],
   Sector_GUT_Junction:['Il Dominio Quadrivettoriale Supersimmetrico','Una lama di Grado 4 collega facce di simplesso e partizioni dell’otteratto.'],
   Sector_Cosmic_Horizon:['Il Reset Saturato del Volume Pseudoscalare','L’elemento massimo satura base e fibra, imponendo un reset involutivo del confine.'],
   Sector_Open_Questions:['L’Invariante di Incompletezza dello Scaffold','Non esiste un meccanismo nativo per curve RGE continue o metriche di massa assolute.'],
   Sector_Furey_Ledger:['La Rappresentazione Bimodulo Regolare','Catene octonioniche e idempotenti di Peirce si mappano nel reticolo a 8 bit per estendere le famiglie.']
  }
 }
};
for(const [profile,languages] of Object.entries(authoredTracks)) for(const [lang,entries] of Object.entries(languages)) for(const [id,[title,desc]] of Object.entries(entries)) {
 const key=`${id}_${lang}_${profile}`; KNOWLEDGE_BASE_DIRECTORY[key]={...KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_Physicist`],title,desc};
}

// Dual-metric catalog: 12 core nodes + 13 extensions = 25 atlas nodes.
const DUAL_METRIC_ADDITIONS = [
 ['Sector_Chiral_Parity','Structural Realignments','Grade 1 Left Ideal','B+F=5, B-F=-1','Handed Polytope Facet','Cl(4,1) Chiral Parity Matrix','Chiral Parity Matrix','The One-Way Mirror','Left-ideal parity mapping for the portal’s weak interaction convention.','Time-positive one-way mirror for out-of-phase historical paths.'],
];
for (const [id,category,grade,coordinate,simplex,cube,spTitle,tmTitle,spDesc,tmDesc] of DUAL_METRIC_ADDITIONS) {
 const base={id,category,grade,coordinate,simplex,cube};
 for (const lang of ['en','it']) for (const profile of ['Young Learner','Physicist','Mathematician']) KNOWLEDGE_BASE_DIRECTORY[`${id}_${lang}_${profile}`]={...base,title:spTitle,desc:spDesc};
}
const originalMenu=MENU_SECTOR_LIST;
const dualOrder=['Sector_Vacuum_Origin','Sector_Inject_Base_Real','Sector_Inject_Fiber_Clock','Sector_Quaternionic_Base','Sector_Quaternionic_Fiber','Sector_Trivector_Base','Sector_Trivector_Quark','Sector_Trivector_Lepton','Sector_STA_Euclidean_Base','Sector_STA_Minkowski','Sector_STA_Symmetric_Core','Sector_STA_Fiber_Frame','Sector_Row5_Base','Sector_Row6_Confinement','Sector_Row7_Mirror','Sector_Chiral_Parity','Sector_EM_Maxwell','Sector_Gravity_Strain','Sector_Baryon_Conservation','Sector_Electroweak_Unified','Sector_Vacuum_Mass_Generation','Sector_GUT_Junction','Sector_Cosmic_Horizon','Sector_Open_Questions','Sector_Furey_Ledger'];
const categoryById={Sector_Vacuum_Origin:'Foundational Symmetries',Sector_Gravity_Strain:'Foundational Symmetries',Sector_Baryon_Conservation:'Structural Realignments',Sector_Chiral_Parity:'Structural Realignments'};
const dualItems=[...originalMenu,...DUAL_METRIC_ADDITIONS.map(([id,category])=>({id,category}))];
MENU_SECTOR_LIST=dualOrder.map(id=>dualItems.find(item=>item.id===id)||({id,category:categoryById[id]||'Speculative Frontiers'}));
const TEMPORAL_OVERRIDES={
 Sector_Vacuum_Origin:{en:['The Still Point of History','The absolute motionless moment from which the atlas chronicles its paths.'],it:['Il Punto Fermo della Storia','Il momento assolutamente immobile da cui l’atlante racconta i suoi percorsi.']},
 Sector_Inject_Base_Real:{en:['Chronological Line Painter','Injects raw historical progression; spatial lines become the record of what has happened.'],it:['Il Pittore della Linea Cronologica','Inietta la progressione storica: le linee spaziali diventano il registro di ciò che è accaduto.']},
 Sector_Inject_Fiber_Clock:{en:['The Spatial Constraint Seed','Space emerges as a localized frequency loop inside a time-positive account.'],it:['Il Seme del Vincolo Spaziale','Lo spazio emerge come un ciclo di frequenza localizzato in una descrizione a tempo positivo.']},
 Sector_Quaternionic_Base:{en:['Temporal Matrix Canvas','A matrix canvas for temporal rotations and historical recurrence.'],it:['La Tela Matriciale Temporale','Una tela matriciale per rotazioni temporali e ricorrenze storiche.']},
 Sector_Quaternionic_Fiber:{en:['Spatial Rotation Ring','A ring where spatial restrictions rotate around the underlying chronology.'],it:['L’Anello di Rotazione Spaziale','Un anello dove le restrizioni spaziali ruotano attorno alla cronologia sottostante.']},
 Sector_EM_Maxwell:{en:['Temporal Shear Tensor','Light is treated as a ripple of time skewing across spatial restrictions.'],it:['Il Tensore di Taglio Temporale','La luce è trattata come un’increspatura del tempo attraverso vincoli spaziali.']},
 Sector_Gravity_Strain:{en:['Lattice Chrono-Compression','Mass squeezes the duration of local seconds in the time-positive reading.'],it:['La Crono-Compressione del Reticolo','La massa comprime la durata dei secondi locali nella lettura a tempo positivo.']},
 Sector_Electroweak_Unified:{en:['The Balanced Chrono-Intersect','Four timelines cross the portal’s neutral paths in a balanced temporal junction.'],it:['L’Intersezione Cronologica Bilanciata','Quattro linee temporali attraversano i percorsi neutri del portale in una giunzione bilanciata.']},
 Sector_GUT_Junction:{en:['Saturation of the Flux','The primorial junction becomes a saturation point for historical flux.'],it:['La Saturazione del Flusso','La giunzione primoriale diventa un punto di saturazione del flusso storico.']},
 Sector_Cosmic_Horizon:{en:['Pseudoscalar Time Boundary','The horizon is the temporal boundary where the portal resets its chronology.'],it:['Il Confine Temporale Pseudoscalare','L’orizzonte è il confine temporale dove il portale reimposta la propria cronologia.']},
 Sector_Trivector_Base:{en:['Volumetric Time Block','A volumetric block that records temporal thickness rather than spatial extent.'],it:['Il Blocco Temporale Volumetrico','Un blocco volumetrico che registra lo spessore temporale anziché l’estensione spaziale.']},
 Sector_Trivector_Quark:{en:['Asymmetric Time Seed','An asymmetric temporal seed for the portal’s mixed quark channel.'],it:['Il Seme Temporale Asimmetrico','Un seme temporale asimmetrico per il canale quark misto del portale.']},
 Sector_Trivector_Lepton:{en:['Linear Chrono-Track','A linear historical track for the leptonic current frame.'],it:['Il Tracciato Cronologico Lineare','Un tracciato storico lineare per il frame della corrente leptonica.']},
 Sector_STA_Euclidean_Base:{en:['4D Temporal Box','A four-dimensional box that frames temporal possibilities.'],it:['La Scatola Temporale 4D','Una scatola quadridimensionale che inquadra possibilità temporali.']},
 Sector_STA_Minkowski:{en:['The Historical Projector','A projector that casts chronology through a Minkowski frame.'],it:['Il Proiettore Storico','Un proiettore che proietta la cronologia attraverso un frame di Minkowski.']},
 Sector_STA_Symmetric_Core:{en:['Balanced Chrono-Junction','A balanced junction where temporal paths meet the fiber clock.'],it:['La Giunzione Cronologica Bilanciata','Una giunzione bilanciata dove i percorsi temporali incontrano l’orologio della fibra.']},
 Sector_STA_Fiber_Frame:{en:['Spatial Lock-Box','A lock-box that constrains space around the temporal fiber.'],it:['La Scatola di Blocco Spaziale','Una scatola che vincola lo spazio attorno alla fibra temporale.']},
 Sector_Row5_Base:{en:['Chiral Time Mirror','A time mirror that distinguishes the portal’s left and right histories.'],it:['Lo Specchio Temporale Chirale','Uno specchio temporale che distingue le storie sinistre e destre del portale.']},
 Sector_Row6_Confinement:{en:['Absolute Time-Lock','A closed time-lock that preserves the portal’s confined color loop.'],it:['Il Blocco Temporale Assoluto','Un blocco temporale chiuso che conserva il loop di colore confinato del portale.']},
 Sector_Row7_Mirror:{en:['Historical Phase Mirror','A mirror threshold for phase-opposed historical states.'],it:['Lo Specchio di Fase Storica','Una soglia a specchio per stati storici in opposizione di fase.']},
 Sector_Chiral_Parity:{en:['The One-Way Mirror','A time-positive mirror where phase-matched paths pass and opposed paths reflect.'],it:['Lo Specchio Unidirezionale','Uno specchio a tempo positivo dove i percorsi in fase passano e quelli opposti si riflettono.']},
 Sector_Baryon_Conservation:{en:['Topological Time-Lock','A cyclic time-lock preserving the portal’s baryon loop.'],it:['Il Blocco Temporale Topologico','Un blocco temporale ciclico che conserva il loop barionico del portale.']},
 Sector_Vacuum_Mass_Generation:{en:['Identity Clock Inversion','A clock inversion around the scalar identity root.'],it:['L’Inversione dell’Orologio d’Identità','Un’inversione dell’orologio attorno alla radice scalare d’identità.']},
 Sector_Open_Questions:{en:['Paradox of the Now','The open question of how discrete historical steps form a continuous present.'],it:['Il Paradosso dell’Adesso','La questione aperta di come passi storici discreti formino un presente continuo.']},
 Sector_Furey_Ledger:{en:['The Chrono-Bimodule','A bimodule reading of left/right actions across a time-positive atlas.'],it:['Il Crono-Bimodulo','Una lettura bimodulare delle azioni sinistra/destra in un atlante a tempo positivo.']}
};
export function getDisplayData(nodeKey, lang, profile, metricMode='Spatial') {
 const base=KNOWLEDGE_BASE_DIRECTORY[`${nodeKey}_${lang}_${profile}`];
 if(!base || metricMode==='Spatial') return base;
 const override=TEMPORAL_OVERRIDES[nodeKey]?.[lang];
 return override ? {...base,title:override[0],desc:override[1],metricMode:'Temporal'} : {...base,metricMode:'Temporal'};
}

// Centralized dual-metric compiler layer. It augments authored node text instead of replacing it.
export const FULL_25_NODES = MENU_SECTOR_LIST.map(({id,category}) => {
 const record=KNOWLEDGE_BASE_DIRECTORY[`${id}_en_Physicist`];
 return {id,cat:category,coord:record.coordinate,simplex:record.simplex,cube:record.cube};
});
const TEMPORAL_TEXT_PACK={
 en:{'Young Learner':['The Running Cinematic Clock Reel','Time becomes the huge movie canvas while space is a pattern drawn by its moving tracks.'],Physicist:['The Chronological Displacement Field','The metric is re-read as a time-positive lattice, with space emerging as localized imaginary-frequency constraints.'],Mathematician:['The Hypercomplex Chrono-Manifold Core','Regular-representation actions are re-read over non-commutative temporal modules and metric involutions.']},
 it:{'Young Learner':['La Pellicola Cinematografica del Tempo','Il tempo diventa la grande tela del film mentre lo spazio è un disegno dei suoi binari in movimento.'],Physicist:['Il Campo di Spostamento Cronologico','La metrica è riletta come reticolo a tempo positivo, con lo spazio che emerge come vincolo di frequenza immaginario.'],Mathematician:['Il Core del Crono-Manifold Ipercomplesso','Le azioni di rappresentazione regolare sono rilette su moduli temporali non commutativi e involuzioni metriche.']}
};
const TEMPORAL_NODE_OVERRIDES={
 Sector_Inject_Base_Real:{en:'Chronological Line Painter',it:'Il Pittore della Linea Cronologica'},
 Sector_Inject_Fiber_Clock:{en:'The Spatial Constraint Seed',it:'Il Seme del Vincolo Spaziale'},
 Sector_EM_Maxwell:{en:'Temporal Shear Tensor',it:'Il Tensore di Taglio Temporale'},
 Sector_Gravity_Strain:{en:'Lattice Chrono-Compression',it:'La Crono-Compressione del Reticolo'},
 Sector_Electroweak_Unified:{en:'The Balanced Chrono-Intersect',it:'L’Intersezione Cronologica Bilanciata'},
 Sector_Vacuum_Origin:{en:'The Still Point of History',it:'Il Punto Fermo della Storia'},
 Sector_Cosmic_Horizon:{en:'Pseudoscalar Time Boundary',it:'Il Confine Temporale Pseudoscalare'},
 Sector_Furey_Ledger:{en:'The Chrono-Bimodule',it:'Il Crono-Bimodulo'}
};
export function getDualMetricDisplayData(nodeKey,lang,profile,metricMode='Spatial') {
 const base=KNOWLEDGE_BASE_DIRECTORY[`${nodeKey}_${lang}_${profile}`];
 if(!base || metricMode==='Spatial') return {...base,metricMode:'Spatial'};
 const [genericTitle,genericDesc]=TEMPORAL_TEXT_PACK[lang][profile];
 const title=base.title;
 return {...base,title,desc:`${genericDesc} ${base.desc}`,metricMode:'Temporal'};
}

// Final authored dual-metric entries for the two previously uncovered nodes.
const FINAL_METRIC_COPY={
 Sector_Gravity_Strain:{
  Spatial:{en:{'Young Learner':['The Squeeze / The Big Squeeze','Shortening the sandbox walking paths near heavy objects.','Gravity is the squeezing of spatial number boxes near massive objects, shortening local paths and curving toy trajectories.'],Physicist:['Gauge Theory Gravity & Elastic Strain Connection','Position-dependent h-field displacement frames over flat backgrounds.','Gravity replaces Riemann curvature tensors with a localized translation gradient that skews the 8-cube lattice under local mass-energy density.'],Mathematician:['The Localized Translation Manifold Gradient','Covariant derivative commutators measuring field strength bivectors.','Gravity scales metrics via position-dependent translation gradients skewing the lattice axes to calculate strain over 256 vertices.']},it:{'Young Learner':['Lo Strizzo / Il Grande Schiacciamento','Accorciare i percorsi vicino a oggetti pesanti.','La gravità schiaccia geometricamente le scatole numeriche vicino a oggetti enormi, accorciando i percorsi e curvando i giocattoli.'],Physicist:['Gravità della Teoria di Gauge e Sforzo Elastico','Frame di spostamento del campo h dipendenti dalla posizione su sfondi piatti.','La gravità sostituisce i tensori metrici con un gradiente di traslazione localizzato che inclina il reticolo a 8 cubi.'],Mathematician:['Il Gradiente di Traslazione della Varietà Localizzata','Commutatori di derivate covarianti che misurano bivettori di forza.','La gravità scala le metriche tramite gradienti di traslazione che inclinano gli assi del reticolo.']}},
  Temporal:{en:{'Young Learner':['Lattice Chrono-Compression','Squeezed timing wheels slowing down the film reel.','A heavy master state squeezes the clock gears underneath, compressing local seconds and skewing spatial strings through history.'],Physicist:['The Coordinate Position-Dependent Dilation Field','Compressing spatial base parameters while dilating timelike fibers.','Mass-energy density introduces strain that compresses spatial base parameters while dilating timelike fiber configurations.'],Mathematician:['The Non-Commutative Bimodule Metric Displacement','Squeezing translation metrics across Pin(4,4) regular modules.','Gravity acts as an asymmetric bimodule deformation of Chronos-Manifold translation coordinates.']},it:{'Young Learner':['Crono-Compressione del Reticolo','Ingranaggi del tempo schiacciati che rallentano la pellicola.','Uno stato pesante schiaccia gli ingranaggi dell’orologio, comprimendo i secondi locali e deviando le corde spaziali.'],Physicist:['Il Campo di Dilatazione Dipendente dalla Posizione','Comprimere i parametri spaziali dilatando le fibre temporali.','La densità di massa-energia introduce uno sforzo che comprime i parametri spaziali e dilata le fibre temporali.'],Mathematician:['Lo Spostamento Metrico Bimodulo Non Commutativo','Schiacciare le metriche sui moduli regolari Pin(4,4).','La gravità opera come deformazione bimodulare asimmetrica delle coordinate del Crono-Manifold.']}}
 },
 Sector_Row7_Mirror:{
  Spatial:{en:{'Young Learner':['The Mirror Gate / The Mirror World Gate','The 128-element threshold where antimatter reflections hide.','A global mirror gate holds the blueprint for flipping an ordinary state into its antimatter twin.'],Physicist:['The Cl(4,3) Chiral Half-Pool Threshold','Direct sum split subspaces for charge-conjugation mappings.','A 128-dimensional semisimple algebra tracks the hyper-surface envelope and charge-conjugation reflections.'],Mathematician:['The Cl(4,3) Direct Sum Split Semipool M₈(R) ⊕ M₈(R)','Hyperplane reflection equations executing bijective NOT involutions.','The final 128-element direct sum threshold generates invariant hyperplane parameters for Clifford grading inversions.']},it:{'Young Learner':['Il Cancello Specchio / Il Cancello del Mondo Specchio','La soglia a 128 elementi dei riflessi antimaterici.','Un cancello a specchio contiene il progetto per capovolgere uno stato nel suo gemello di antimateria.'],Physicist:['Il Semipool Chirale di Confine Cl(4,3)','Sottospazi split per le mappature di coniugazione di carica.','Un’algebra semisemplice a 128 dimensioni traccia l’involucro di confine e le riflessioni di coniugazione di carica.'],Mathematician:['La Scissione in Somma Diretta M₈(R) ⊕ M₈(R) Cl(4,3)','Equazioni di riflessione per involuzioni NOT biunivoche.','La soglia finale a 128 elementi genera parametri d’iperpiano invarianti per le inversioni di gradazione Clifford.']}},
  Temporal:{en:{'Young Learner':['Historical Phase Mirror','The back-and-forth clock flipping boundary line.','This boundary tracks 128 hidden clock positions and shows how to run a timeline backwards.'],Physicist:['The Direct Sum Chrono-Inversion Frontier','Hyper-surface coordinate matching for time-reversed states.','The 128-element envelope establishes coordinate alignments mapping clock configurations into time-reversed complements.'],Mathematician:['The Direct Sum M₈(R) ⊕ M₈(R) Temporal Involution Limit','Discrete automorphic closures over direct sum modules.','A direct sum module of 128 components enforces closures projecting timeline vectors to anti-podal time-inversion ideals.']},it:{'Young Learner':['Specchio di Fase Storica','La linea di confine per il ribaltamento degli orologi.','Questo confine traccia 128 orologi nascosti e mostra come far scattare una linea temporale al contrario.'],Physicist:['La Frontiera di Crono-Inversione in Somma Diretta','Coordinate d’iperpiano per stati a tempo invertito.','L’involucro a 128 elementi stabilisce allineamenti per mappare gli orologi nei loro complementi invertiti.'],Mathematician:['Il Limite di Involuzione Temporale M₈(R) ⊕ M₈(R)','Chiusure automorfe discrete su moduli in somma diretta.','Un modulo in somma diretta di 128 componenti proietta i vettori temporali sui loro ideali antipodali.']}}
 }
};
for(const [id,metrics] of Object.entries(FINAL_METRIC_COPY)) for(const [metric,languages] of Object.entries(metrics)) for(const [lang,profiles] of Object.entries(languages)) for(const [profile,[title,subtitle,desc]] of Object.entries(profiles)) {
 const key=`${id}_${lang}_${profile}`; const base=KNOWLEDGE_BASE_DIRECTORY[key]; KNOWLEDGE_BASE_DIRECTORY[`${key}_${metric}`]={...base,title,subtitle,desc,metricMode:metric};
}
const previousDualMetric=getDualMetricDisplayData;
export function getCompleteDualMetricDisplayData(nodeKey,lang,profile,metricMode='Spatial') {
 const base=KNOWLEDGE_BASE_DIRECTORY[`${nodeKey}_${lang}_${profile}`];
 const authored=AUTHOR_TRANSLATIONS[nodeKey]?.[metricMode]?.[lang]?.[profile];
 if (authored) return {...base,...authored,metricMode};
 return previousDualMetric(nodeKey,lang,profile,metricMode);
}
