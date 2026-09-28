export const DIRECTORY = {
  electroweak: {
    id: 'electroweak', category: 'Structural Realignments',
    coordinate_8bit: { base_string: '-1LG', fiber_string: '110ν' },
    telemetry: { view_clifford: 'Grade 2/4 ideal intersection', view_prime: 'Neutral-channel packing: 4 of 17', view_simplex: 'Highlighted edges in K₈', view_cube: 'Chiral edge-hop projection' },
    translations: {
      en: { 'Young Learner': { title: 'The Gold Bridges', desc: 'Four glowing bridges in a set of seventeen are the portal’s rule for sorting its light paths.' }, Physicist: { title: 'Electroweak packing diagram', desc: 'An illustrative toy-model encoding of a 4/17 neutral-channel fraction.' }, Mathematician: { title: 'Combinatorial packing statement', desc: 'A visual convention for a selected four-edge subset of a seventeen-element set.' } },
      it: { 'Young Learner': { title: 'I ponti dorati', desc: 'Quattro ponti luminosi in un gruppo di diciassette mostrano la regola del portale per ordinare i percorsi della luce.' }, Physicist: { title: 'Diagramma di impacchettamento elettrodebole', desc: 'Una codifica illustrativa del modello giocattolo della frazione 4/17.' }, Mathematician: { title: 'Enunciato di impacchettamento combinatorio', desc: 'Una convenzione visiva per un sottoinsieme di quattro archi in un insieme di diciassette elementi.' } }
    }
  }
};

export const WAYPOINTS = [
  { percent: '0–20%', title: 'The Silent Horizon', it: 'L’Orizzonte Silenzioso', camera: '[0, 0, 10]', cue: 'Hover a cyan switch to send a ripple across the sky.', state: 'Eight quiet cyan switches; no connecting lines.', tone: 'horizon' },
  { percent: '21–45%', title: 'Space or Time?', it: 'Spazio o Tempo?', camera: '[5, 3, 8]', cue: 'Tap a blue point or a red time loop to compare their paths.', state: 'Four switches build a grid; four descend into crimson loops.', tone: 'split' },
  { percent: '46–70%', title: 'Sandbox or Wheel?', it: 'Recinto o Ruota?', camera: '[0, 6, 4]', cue: 'Select the floor or the wheel to reveal its role.', state: 'A transparent sandbox separates from a spinning fiber wheel.', tone: 'sieve' },
  { percent: '71–100%', title: 'The Gold Bridges', it: 'I Ponti d’Oro', camera: '[2, 1, 5]', cue: 'Hover gold paths to count the active four of seventeen.', state: 'The complete web opens; four highlighted bridges anchor the view.', tone: 'gate' }
];
