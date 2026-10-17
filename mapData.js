// The tree of knowledge: one node per part of the app. `go` = [page, anchor] is where the part lives; `script` is the file that checks it
// (selfcheck/ unless a path is given); `lens` and `th` are the lenses and threads the branch belongs to. The text of each node is in mapCopy.js.
export const LENSES = ['clifford', 'cube', 'simplex', 'mirror', 'spinor', 'null', 'flow'];
export const MTHREADS = ['cube', 'mirror', 'i', 'eight', 'three', 'spring'];
const n = (id, go, script, tags, lens, th, kids = [], extra = {}) => ({ id, go, script, tags, lens, th, kids, ...extra });
export const TREE = [
  n('rule', ['rule', 'top'], 'model.py, genesis_audit_v3.js', ['standard', 'ours'], ['clifford', 'cube', 'simplex'], ['cube', 'eight'], [
    n('atlas', ['atlas', null], 'genesis audit (JS), family_test.py', ['checked', 'standard'], ['clifford', 'cube', 'simplex'], ['eight', 'cube'])]),
  n('maxwell', ['maxwell', 'maxwell'], 'maxwell_selfcheck.py', ['checked', 'standard'], ['clifford', 'cube', 'simplex'], ['cube', 'eight']),
  n('furey', ['furey', 'dictionary'], 'dictionary_selfcheck.py, threegen_selfcheck.py, family_test.py, peirce_test.py, witt_test.py, z2_test.py', ['checked', 'open'], ['clifford', 'spinor'], ['three', 'i'], [
    n('dictionary', ['furey', 'dictionary'], 'dictionary_selfcheck.py', ['checked'], ['clifford', 'cube'], ['cube']),
    n('threegen', ['furey', 'tg-h'], 'threegen_selfcheck.py', ['checked', 'open'], ['clifford', 'spinor'], ['three']),
    n('findings', ['furey', 'findings'], 'family_test.py, peirce_test.py, witt_test.py, z2_test.py', ['checked', 'open'], ['clifford', 'spinor'], ['three', 'i'])]),
  n('shapes', ['shapes', 'sh-orth'], 'shapes_selfcheck.py, gosset_selfcheck.py', ['checked', 'standard', 'ours'], ['cube', 'simplex'], ['cube', 'eight', 'three'], [
    n('orth', ['shapes', 'sh-orth'], 'shapes_selfcheck.py', ['checked', 'ours'], ['cube', 'simplex'], ['cube', 'three']),
    n('demi', ['shapes', 'sh-demi'], 'shapes_selfcheck.py', ['checked'], ['cube', 'clifford'], ['cube']),
    n('gosset', ['shapes', 'sh-gosset'], 'gosset_selfcheck.py', ['checked', 'standard', 'open'], ['cube', 'mirror'], ['eight', 'mirror'])]),
  n('equations', ['equations', 'eq-comm'], 'one script per step', ['checked', 'standard', 'ours'], ['clifford'], [], [
    n('comm', ['equations', 'eq-comm'], 'equations_selfcheck.py', ['checked', 'standard'], ['clifford', 'cube'], ['cube']),
    n('dirac', ['equations', 'eq-dirac'], 'equations_selfcheck.py, dirac_matrix_check.py', ['checked', 'standard'], ['clifford', 'cube', 'spinor'], ['cube', 'i']),
    n('coupling', ['equations', 'eq-coupling'], 'coupling_selfcheck.py, coupling_matrix_check.py', ['checked', 'standard', 'open'], ['clifford', 'cube'], ['i', 'cube']),
    n('ym', ['equations', 'eq-ym'], 'yangmills_selfcheck.py, yangmills_matrix_check.py', ['checked', 'standard', 'open'], ['clifford', 'cube'], ['cube']),
    n('matter', ['equations', 'eq-matter'], 'matter_selfcheck.py, matter_matrix_check.py', ['checked', 'standard', 'open'], ['clifford', 'spinor'], ['i', 'cube']),
    n('grav', ['equations', 'eq-grav1'], 'gravity_selfcheck.py, gravity_matrix_check.py', ['checked', 'standard', 'open'], ['clifford', 'cube'], ['cube']),
    n('mirrors', ['equations', 'eq-mirrors'], 'mirrors_selfcheck.py, mirrors_matrix_check.py', ['checked', 'standard', 'ours'], ['mirror', 'cube'], ['mirror', 'cube']),
    n('projective', ['equations', 'eq-projective'], 'projective_selfcheck.py, projective_matrix_check.py', ['checked', 'standard'], ['null', 'mirror'], ['mirror', 'i']),
    n('forque', ['equations', 'eq-forque'], 'forque_selfcheck.py, forque_matrix_check.py', ['checked', 'standard', 'open'], ['flow', 'null', 'mirror'], ['mirror']),
    n('spin', ['equations', 'eq-spin'], 'spin_selfcheck.py', ['checked', 'standard', 'ours', 'open'], ['spinor', 'mirror', 'clifford', 'flow'], ['i', 'mirror', 'cube']),
    n('spring', ['equations', 'eq-spring'], 'spring_selfcheck.py', ['checked', 'standard', 'ours', 'open'], ['flow', 'cube', 'spinor', 'clifford'], ['spring', 'cube', 'i', 'mirror']),
    n('rigid', ['equations', 'eq-rigid'], 'pgadyn_selfcheck.py, bench_labels.mjs', ['checked', 'standard', 'ours', 'open'], ['flow', 'cube', 'null', 'mirror', 'clifford'], ['spring', 'cube', 'mirror', 'i'], [], {}),
    n('tally', ['equations', 'eq-tally'], '—', ['checked'], [], [])]),
  n('map', ['map', 'map-top'], 'test_map.mjs', ['checked', 'ours'], [], []),
  n('ask', ['ask', null], 'lib/chatPersona.js, test_persona.mjs', ['standard'], [], []),
  n('next', ['map', 'map-next'], '—', ['open'], ['flow'], ['spring'], [
    n('next_network', ['map', 'map-next'], 'spring_selfcheck.py, pgadyn_selfcheck.py (to extend)', ['open'], ['flow', 'cube', 'null', 'mirror'], ['spring', 'mirror'], [], { planned: true }),
    n('next_action', ['map', 'map-next'], '—', ['open'], ['flow', 'cube', 'clifford'], ['spring', 'i'], [], { planned: true }),
    n('next_read', ['map', 'map-research'], '—', ['open'], ['flow', 'mirror', 'null'], ['mirror'], [], { planned: true })]),
];
export const flat = (nodes = TREE) => nodes.flatMap(x => [x, ...flat(x.kids)]);
export const ALL_IDS = flat().map(x => x.id);

// the scripts of the project, counted from the files (test_map.mjs compares these lists with selfcheck/ and with what each file imports)
export const SCRIPTS = {
  stdlib: ['coupling', 'equations', 'forque', 'gosset', 'gravity', 'matter', 'maxwell', 'mirrors', 'pgadyn', 'projective', 'shapes', 'spin', 'spring', 'threegen', 'yangmills'].map(x => x + '_selfcheck.py'),
  numpy: ['coupling_matrix', 'dirac_matrix', 'forque_matrix', 'gravity_matrix', 'matter_matrix', 'mirrors_matrix', 'projective_matrix', 'yangmills_matrix'].map(x => x + '_check.py').concat(['dictionary_selfcheck.py']),
};

// the researchers' table: source, status of our reading of it (read / slides / partly / not read), and the tags
export const RESEARCH = [
  { id: 'forque', read: 'read', tags: ['checked', 'standard'] },
  { id: 'roelfs', read: 'read', tags: ['checked', 'ours'] },
  { id: 'eelbode', read: 'slides', tags: ['checked'] },
  { id: 'hestenes', read: 'standard', tags: ['standard'] },
  { id: 'doran', read: 'not', tags: ['open'] },
  { id: 'exp', read: 'not', tags: ['open'] },
  { id: 'visual', read: 'not', tags: ['open'] },
  { id: 'huang', read: 'standard', tags: ['standard', 'checked'] },
];
