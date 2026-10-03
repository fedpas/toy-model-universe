// Copy for the five-page story. Status vocabulary: checked, standard, ours, open.
export const PAGES = ['rule', 'atlas', 'maxwell', 'furey', 'ask'];

export const STORY = {
  en: {
    nav: { rule: 'The rule', atlas: 'The atlas', maxwell: 'Test 1 · Maxwell', furey: 'Test 2 · Furey', ask: 'Ask' },
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
        after: 'What remains is listed as questions, and you can put them to the model.',
        tags: [['checked', 'the 16-dimensional model, the Cartan ledger, the 28 edges in 7 channels'], ['standard', 'Furey’s construction (arXiv 2607.18450)'], ['open', 'top quark, 210, mass scale, replica edges, further generations']]
      },
      ask: {
        h: 'Ask the model',
        does: 'The guide answers from the same axioms and the same audit. It states a status for each claim and says “open” where that is the honest answer.',
        before: 'You have seen the rule, the atlas and two tests.',
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
    nav: { rule: 'La regola', atlas: 'L’atlante', maxwell: 'Prova 1 · Maxwell', furey: 'Prova 2 · Furey', ask: 'Chiedi' },
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
        after: 'Ciò che resta è elencato come domande, e puoi rivolgerle al modello.',
        tags: [['checked', 'il modello a 16 dimensioni, il registro di Cartan, i 28 spigoli in 7 canali'], ['standard', 'costruzione di Furey (arXiv 2607.18450)'], ['open', 'quark top, 210, scala di massa, spigoli di replica, altre generazioni']]
      },
      ask: {
        h: 'Chiedi al modello',
        does: 'La guida risponde dagli stessi assiomi e dallo stesso audit. Dichiara lo stato di ogni affermazione e dice “aperto” dove è la risposta onesta.',
        before: 'Hai visto la regola, l’atlante e due prove.',
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

