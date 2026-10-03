// Final wording for nodes whose text still claimed more than the audit supports.
// Applied last (see matrixData.js). Each entry: id -> lang -> profile -> { Spatial: {...}, Temporal: {...} }.
// A field given under Spatial and also needed in the Temporal reading is repeated explicitly; unspecified fields are kept.
const same = (o) => ({ Spatial: o, Temporal: { title: o.title, subtitle: o.subtitle } });
export const STORY_OVERRIDES = {
  Sector_Vacuum_Mass_Generation: {
    en: {
      'Young Learner': same({ title: 'The Invisible Origin Key', subtitle: 'A quiet starting point, and a guess about what it might become.', desc: 'Multiplying by the number 1 changes nothing, so it can sit quietly in the background. One idea in the toy model reads that quiet 1 as a sterile neutrino, and, when it acts, as the Higgs field that gives matter weight. That is only a reading: the rules do not produce either one, and they do not tell us any weights. Open.' }),
      Physicist: same({ title: 'The scalar identity, read as Higgs and sterile neutrino', subtitle: 'An interpretation, not a derivation.', desc: 'Cl(0,0) = ℝ holds only the scalar identity. Reading its passive role as a sterile-neutrino state and its active role as the Higgs VEV operator is our interpretation. Neither is derived from the algebra, and no mass scale comes out of it. Open.' }),
      Mathematician: same({ title: 'The identity scalar, Cl(0,0) = ℝ', subtitle: 'The Grade-0 identity as passive ideal and as active multiplier.', desc: 'Cl(0,0) = ℝ has one basis element, the unit. Passively it generates the trivial column ideal; actively it acts by left multiplication. Identifying these two roles with a sterile neutrino and a Higgs VEV is interpretive, and nothing in the algebra fixes a mass scale. Open.' })
    },
    it: {
      'Young Learner': same({ title: 'La Chiave d’Origine Invisibile', subtitle: 'Un punto di partenza silenzioso e un’ipotesi su ciò che potrebbe diventare.', desc: 'Moltiplicare per il numero 1 non cambia nulla, quindi può restare tranquillo sullo sfondo. Un’idea del modello giocattolo legge quell’1 silenzioso come un neutrino sterile e, quando agisce, come il campo di Higgs che dà peso alla materia. È solo una lettura: le regole non producono né l’uno né l’altro e non ci dicono nessun peso. Aperto.' }),
      Physicist: same({ title: 'L’identità scalare, letta come Higgs e neutrino sterile', subtitle: 'Un’interpretazione, non una derivazione.', desc: 'Cl(0,0) = ℝ contiene solo l’identità scalare. Leggere il suo ruolo passivo come stato di neutrino sterile e quello attivo come operatore del VEV di Higgs è una nostra interpretazione. Nessuno dei due deriva dall’algebra e non ne esce nessuna scala di massa. Aperto.' }),
      Mathematician: same({ title: 'L’identità scalare, Cl(0,0) = ℝ', subtitle: 'L’identità di Grado 0 come ideale passivo e come moltiplicatore attivo.', desc: 'Cl(0,0) = ℝ ha un solo elemento di base, l’unità. In modo passivo genera l’ideale colonna banale; in modo attivo agisce per moltiplicazione a sinistra. Identificare questi due ruoli con un neutrino sterile e un VEV di Higgs è interpretativo, e nulla nell’algebra fissa una scala di massa. Aperto.' })
    }
  },
  Sector_Cosmic_Horizon: {
    en: {
      'Young Learner': same({ title: 'The Last Switch', subtitle: 'All eight switches on, and then the pattern starts again.', desc: 'Turn all eight switches on and you reach the biggest block, with 256 pieces. It is not a wall. The same kinds of box simply come around again: eight more switches give the old box, made sixteen times bigger.' }),
      Physicist: same({ title: 'The maximal pseudoscalar of Cl(0,8)', subtitle: 'Where the algebra types repeat.', desc: 'The product of all eight generators squares to +1, and the cell is Cl(0,8) ≅ Cl(4,4) ≅ Cl(8,0) ≅ M₁₆(ℝ). It is not a boundary: Cl(n+8) = Cl(n) ⊗ M₁₆(ℝ), so the types repeat with matrices sixteen times larger. Reading it as a reset of the universe is a metaphor, not a result.' }),
      Mathematician: same({ title: 'The saturated pseudoscalar and period 8', subtitle: 'I₈² = +1 and Cl(n+8) = Cl(n) ⊗ M₁₆(ℝ).', desc: 'The top blade e₁…e₈ squares to +1 and gives Cl(0,8) ≅ Cl(4,4) ≅ Cl(8,0) ≅ M₁₆(ℝ). Periodicity says the cell types repeat every 8 generators with matrices sixteen times larger (checked in the Maxwell test along the time ladder up to eleven time dimensions). Nothing is reset.' })
    },
    it: {
      'Young Learner': same({ title: 'L’Ultimo Interruttore', subtitle: 'Tutti gli otto interruttori accesi, e poi lo schema ricomincia.', desc: 'Accendi tutti e otto gli interruttori e arrivi al blocco più grande, con 256 pezzi. Non è un muro. Gli stessi tipi di scatola tornano semplicemente: otto interruttori in più danno la vecchia scatola, sedici volte più grande.' }),
      Physicist: same({ title: 'Lo pseudoscalare massimo di Cl(0,8)', subtitle: 'Dove i tipi di algebra si ripetono.', desc: 'Il prodotto di tutti e otto i generatori ha quadrato +1 e la cella è Cl(0,8) ≅ Cl(4,4) ≅ Cl(8,0) ≅ M₁₆(ℝ). Non è un confine: Cl(n+8) = Cl(n) ⊗ M₁₆(ℝ), quindi i tipi si ripetono con matrici sedici volte più grandi. Leggerlo come un reset dell’universo è una metafora, non un risultato.' }),
      Mathematician: same({ title: 'Lo pseudoscalare saturo e il periodo 8', subtitle: 'I₈² = +1 e Cl(n+8) = Cl(n) ⊗ M₁₆(ℝ).', desc: 'La lama massima e₁…e₈ ha quadrato +1 e dà Cl(0,8) ≅ Cl(4,4) ≅ Cl(8,0) ≅ M₁₆(ℝ). La periodicità dice che i tipi di cella si ripetono ogni 8 generatori con matrici sedici volte più grandi (verificato nel test di Maxwell lungo la scala temporale fino a undici dimensioni temporali). Nulla viene azzerato.' })
    }
  },
  Sector_GUT_Junction: {
    en: {
      'Young Learner': { Spatial: { subtitle: 'A number that keeps showing up, and an open question.' }, Temporal: { subtitle: 'The same open question, seen in the mirror.' } },
      Physicist: { Spatial: { subtitle: 'A primorial label: 210 = 2·3·5·7, not derived.' }, Temporal: { subtitle: 'The same open question, seen in the mirror.' } },
      Mathematician: { Spatial: {}, Temporal: {} }
    },
    it: {
      'Young Learner': { Spatial: { subtitle: 'Un numero che ritorna, e una domanda aperta.' }, Temporal: { subtitle: 'La stessa domanda aperta, vista nello specchio.' } },
      Physicist: { Spatial: { subtitle: 'Un’etichetta primoriale: 210 = 2·3·5·7, non derivata.' }, Temporal: { subtitle: 'La stessa domanda aperta, vista nello specchio.' } },
      Mathematician: { Spatial: {}, Temporal: {} }
    }
  },
  Sector_Electroweak_Unified: {
    en: {
      Physicist: { Spatial: { subtitle: 'An internal count of 17 neutral paths; Furey’s 3/8 is a separate computation.', desc: 'The centered 4-base, 4-fiber matrix contains 17 neutral paths, and the fraction 4/17 is an internal counting convention, not a Standard Model prediction. Furey’s 3/8 is a different computation: Tr_ℂ Y = ⅓·3 + ½·2 + 1·1 = 3 over dim_ℂ 𝕍 = 8 (her eqs. 44–45). Cell Cl(4,4) = M₁₆(ℝ) is verified.' } },
      Mathematician: { Spatial: { desc: 'The intersection and complement of the principal sub-ideals generated by Cl(0,1,0) and Cl(0,2,0) in Cl(4,4,0). The count 4/17 is internal to the lattice and is not Furey’s 3/8, which is a trace computation. Cell Cl(4,4) = M₁₆(ℝ) is verified.' } }
    },
    it: {
      Physicist: { Spatial: { subtitle: 'Un conteggio interno di 17 percorsi neutri; il 3/8 di Furey è un calcolo diverso.', desc: 'La matrice centrata 4-base, 4-fibra contiene 17 percorsi neutri, e la frazione 4/17 è una convenzione di conteggio interna, non una previsione del Modello Standard. Il 3/8 di Furey è un calcolo diverso: Tr_ℂ Y = ⅓·3 + ½·2 + 1·1 = 3 su dim_ℂ 𝕍 = 8 (sue eq. 44–45). La cella Cl(4,4) = M₁₆(ℝ) è verificata.' } },
      Mathematician: { Spatial: { desc: 'Intersezione e complemento dei sotto-ideali principali generati da Cl(0,1,0) e Cl(0,2,0) in Cl(4,4,0). Il conteggio 4/17 è interno al reticolo e non è il 3/8 di Furey, che è un calcolo di traccia. La cella Cl(4,4) = M₁₆(ℝ) è verificata.' } }
    }
  },
  Sector_EM_Maxwell: {
    en: {
      'Young Learner': { Spatial: { subtitle: 'Light as one equation, with a push part and a twist part.', desc: 'Light is a wave made of numbers: electric pushes and magnetic twists. With one line of space there is just one push. With three lines of space there are three pushes and three twists. The page “Test 1 · Maxwell” lets you add space and extra time one step at a time and shows every term.' } },
      Physicist: { Spatial: { subtitle: 'One equation, ∇F = J; three space plus time gives six components.', desc: 'F is a grade-2 element of the spacetime algebra: in three space dimensions plus time it has six components (E and B), obeying the single equation ∇F = J. Test 1 rebuilds it in 1 to 4 space and 1 to 4 time dimensions from the bit rule and checks every term exactly. This is standard geometric-algebra electromagnetism. No link to Furey’s model is claimed.' } },
      Mathematician: { Spatial: { desc: 'Grade is blade degree inside the algebra; the cell is the algebra itself. dF = 0 and d⋆F = J are the grade-3 and grade-1 parts of ∇F = J, and the field has C(n,2) components in n generators. Test 1 verifies the incidence structure exactly for every split (k,d) with k+d ≤ 5.' } }
    },
    it: {
      'Young Learner': { Spatial: { subtitle: 'La luce come una sola equazione, con una parte di spinta e una di torsione.', desc: 'La luce è un’onda fatta di numeri: spinte elettriche e torsioni magnetiche. Con una sola linea di spazio c’è una sola spinta. Con tre linee di spazio ci sono tre spinte e tre torsioni. La pagina «Prova 1 · Maxwell» ti fa aggiungere spazio e tempo extra un passo alla volta e mostra ogni termine.' } },
      Physicist: { Spatial: { subtitle: 'Una sola equazione, ∇F = J; tre dimensioni spaziali più il tempo danno sei componenti.', desc: 'F è un elemento di grado 2 dell’algebra dello spaziotempo: in tre dimensioni spaziali più il tempo ha sei componenti (E e B) e obbedisce all’unica equazione ∇F = J. La Prova 1 la ricostruisce da 1 a 4 dimensioni spaziali e da 1 a 4 temporali con la regola dei bit e verifica ogni termine in modo esatto. È elettromagnetismo standard in algebra geometrica. Non si afferma alcun legame con il modello di Furey.' } },
      Mathematician: { Spatial: { desc: 'Il grado è il grado della lama dentro l’algebra; la cella è l’algebra stessa. dF = 0 e d⋆F = J sono le parti di grado 3 e di grado 1 di ∇F = J, e il campo ha C(n,2) componenti con n generatori. La Prova 1 verifica in modo esatto la struttura di incidenza per ogni suddivisione (k,d) con k+d ≤ 5.' } }
    }
  }
};
export function applyStory(id, lang, profile, metricMode, rec) {
  const o = STORY_OVERRIDES[id]?.[lang]?.[profile]?.[metricMode];
  return o && Object.keys(o).length ? { ...rec, ...o } : rec;
}
