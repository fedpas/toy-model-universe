// One list per group of steps, and every "STEP k OF N" label is derived from it, so adding a step can never leave a stale number or total.
// Groups: the shapes page (3 steps) and the equations page (13 steps; the tally is the wrap-up and has no number).
export const STEP_GROUPS = {
  shapes: ['orth', 'demi', 'gosset'],
  eq: ['comm', 'dirac', 'coupling', 'ym', 'matter', 'grav1', 'grav2', 'mirrors', 'projective', 'forque', 'spin', 'spring', 'rigid'],
};
export const WORDS = {
  en: { step: 'STEP', of: 'OF', page: 'PAGE', Step: 'Step', steps: 'steps' },
  it: { step: 'PASSO', of: 'DI', page: 'PAGINA', Step: 'Passo', steps: 'passi' },
};
export const STEP_NAMES = {
  en: { orth: 'THE ORTHOPLEX', demi: 'THE DEMICUBE', gosset: 'THE GOSSET SERIES', comm: 'COMMUTATORS', dirac: 'THE DIRAC EQUATION', coupling: 'MAXWELL MEETS DIRAC', ym: 'YANG–MILLS', matter: 'MATTER CHARGED UNDER so(m)', grav1: 'GRAVITY I: CONNECTION, CURVATURE, TORSION', grav2: 'GRAVITY II: THE EINSTEIN FORM', mirrors: 'MIRRORS: VERSORS, CARTAN–DIEUDONNÉ, THE CUBE AS A GROUP', projective: 'ONE MORE GENERATOR, AND A NULL PAIR', forque: 'FORQUE: FORCE AND TORQUE AS ONE LINE', spin: 'POINTORS AND THE THREE KINDS OF i', spring: 'A SPRING ON THE CUBE: VERTICES, EDGES, FACES', rigid: 'A RIGID BODY: FROM THE SEGMENT TO THE TESSERACT' },
  it: { orth: 'L’ORTOPLESSO', demi: 'IL DEMICUBO', gosset: 'LA SERIE DI GOSSET', comm: 'COMMUTATORI', dirac: 'L’EQUAZIONE DI DIRAC', coupling: 'MAXWELL INCONTRA DIRAC', ym: 'YANG–MILLS', matter: 'MATERIA CARICA SOTTO so(m)', grav1: 'GRAVITÀ I: CONNESSIONE, CURVATURA, TORSIONE', grav2: 'GRAVITÀ II: LA FORMA DI EINSTEIN', mirrors: 'SPECCHI: VERSORI, CARTAN–DIEUDONNÉ, IL CUBO COME GRUPPO', projective: 'UN GENERATORE IN PIÙ, E UNA COPPIA NULLA', forque: 'FORQUE: FORZA E COPPIA COME UNA SOLA RIGA', spin: 'POINTOR E I TRE TIPI DI i', spring: 'UNA MOLLA SUL CUBO: VERTICI, SPIGOLI, FACCE', rigid: 'UN CORPO RIGIDO: DAL SEGMENTO AL TESSERATTO' },
};
// short names for the in-page navigation of the equations page (the tally is last and has no step number)
export const NAV_NAMES = {
  en: { orth: 'The orthoplex', demi: 'The demicube', gosset: 'Gosset series', comm: 'Commutators', dirac: 'Dirac', coupling: 'Coupling', ym: 'Yang–Mills', matter: 'Charged matter', grav1: 'Gravity I', grav2: 'Gravity II', mirrors: 'Mirrors', projective: 'One more generator', forque: 'Forque dynamics', spin: 'Pointors and spin', spring: 'A spring on the cube', rigid: 'A rigid body', tally: 'Tally' },
  it: { orth: 'L’ortoplesso', demi: 'Il demicubo', gosset: 'Serie di Gosset', comm: 'Commutatori', dirac: 'Dirac', coupling: 'Accoppiamento', ym: 'Yang–Mills', matter: 'Materia carica', grav1: 'Gravità I', grav2: 'Gravità II', mirrors: 'Specchi', projective: 'Un generatore in più', forque: 'Dinamica del forque', spin: 'Pointor e spin', spring: 'Una molla sul cubo', rigid: 'Un corpo rigido', tally: 'Bilancio' },
};
export const stepCount = group => STEP_GROUPS[group].length;
export const stepNo = (group, id) => { const k = STEP_GROUPS[group].indexOf(id); if (k < 0) throw new Error(`unknown step ${group}/${id}`); return k + 1; };
const W = lang => WORDS[lang] || WORDS.en, N = lang => STEP_NAMES[lang] || STEP_NAMES.en;
// "STEP 4 OF 10 · YANG–MILLS"; a section may pass its own name, otherwise the shared one is used
export const stepEyebrow = (lang, group, id, name) => `${W(lang).step} ${stepNo(group, id)} ${W(lang).of} ${stepCount(group)} · ${name || N(lang)[id]}`;
// "Step 4 · Yang–Mills" for the navigation chips
export const navLabel = (lang, group, id) => (STEP_GROUPS[group].includes(id) ? `${W(lang).Step} ${stepNo(group, id)} · ` : '') + (NAV_NAMES[lang] || NAV_NAMES.en)[id];
export const eqNavIds = () => [...STEP_GROUPS.eq, 'tally'];
// "PAGE 6 OF 7" for the story pages (the word "step" is kept for the numbered steps inside a page)
export const pageEyebrow = (lang, i, total) => `${W(lang).page} ${i} ${W(lang).of} ${total}`;

// number words, so that prose such as "ten steps" is written from the lists above and cannot go stale
export const NUMW = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'],
  it: ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici'],
};
export const numWord = (lang, n) => (NUMW[lang] || NUMW.en)[n];
export const capital = w => w.charAt(0).toUpperCase() + w.slice(1);
