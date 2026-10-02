import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { genesisFacts, addLegend, PLUS, MINUS, GOLD, GHOST, DIM } from './canvasFacts';

// Genesis ladder, stage n = n null generators (axiom A). Pairs of nulls polarize into e (+1) and f (-1) (axiom B);
// an odd leftover null stays unpaired. At stage 8 the budget is spent and the types repeat (axiom C).
// Learner: a story in a sandbox. Physicist: the light-cone picture of each pair. Mathematician: the matrix algebra Cl(k,k) = M_{2^k}(R).
// Temporal = mirror Q -> -Q. Every Genesis stage is neutral (p = q), so the mirror gives the same algebra and only swaps the roles of e and f.
const TXT = {
  en: {
    story: ['An empty sandbox with one tile: the number one.', 'One ghost marble: it has no size at all, and nothing to pair with.', 'Two ghost marbles hold hands (a bridge) and wake two lamps: a plus lamp and a minus lamp.', 'Two marbles became lamps; one ghost is still alone.', 'Two pairs, four lamps. Each pair works on its own.', 'Two pairs and one lonely ghost.', 'Three pairs, six lamps.', 'Three pairs and one lonely ghost.', 'Four pairs, eight lamps. The box is full: the pattern starts over.'],
    mirror: 'Mirror gate: swap the plus and minus lamp and the board looks the same.',
    stage: (n, k, r) => `Stage ${n}: ${n === 0 ? 'no generators' : `${k} pair${k === 1 ? '' : 's'}${r ? ' + 1 unpaired null' : ''}`}`, algebra: 'algebra', budget: 'budget', reset: 'budget spent: the types repeat (period 8)',
    phys: 'null n, ñ at ±45°; e = n+ñ (square +1), f = n−ñ (square −1)', physT: 'mirror: the roles of e and f are exchanged (ñ → −ñ)', math: (d, k) => `Cl(${k},${k}) acts on ℝ^${2 ** k}: ${d}×${d} matrix grid, diagonal = ${d} primitive idempotents`, mathR: 'unpaired null adds an exterior factor (second layer)', mathT: 'self-mirror: same algebra'
  },
  it: {
    story: ['Un recinto vuoto con una tessera: il numero uno.', 'Una biglia fantasma: non ha dimensione e non ha nessuno con cui accoppiarsi.', 'Due biglie fantasma si danno la mano (un ponte) e accendono due lampade: una più e una meno.', 'Due biglie sono diventate lampade; un fantasma è ancora solo.', 'Due coppie, quattro lampade. Ogni coppia lavora da sola.', 'Due coppie e un fantasma solitario.', 'Tre coppie, sei lampade.', 'Tre coppie e un fantasma solitario.', 'Quattro coppie, otto lampade. La scatola è piena: lo schema ricomincia.'],
    mirror: 'Cancello a specchio: scambia la lampada più e quella meno e la scacchiera resta uguale.',
    stage: (n, k, r) => `Passo ${n}: ${n === 0 ? 'nessun generatore' : `${k} copp${k === 1 ? 'ia' : 'ie'}${r ? ' + 1 nullo non accoppiato' : ''}`}`, algebra: 'algebra', budget: 'budget', reset: 'budget esaurito: i tipi si ripetono (periodo 8)',
    phys: 'nulli n, ñ a ±45°; e = n+ñ (quadrato +1), f = n−ñ (quadrato −1)', physT: 'specchio: i ruoli di e e f si scambiano (ñ → −ñ)', math: (d, k) => `Cl(${k},${k}) agisce su ℝ^${2 ** k}: griglia di matrici ${d}×${d}, diagonale = ${d} idempotenti primitivi`, mathR: 'il nullo non accoppiato aggiunge un fattore esterno (secondo strato)', mathT: 'auto-speculare: stessa algebra'
  }
};
const mat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, side: THREE.DoubleSide });
const lineMat = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
const seg = (root, a, b, c, o = 1) => root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(c, o)));
const ball = (root, pos, c, r = .16, o = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), mat(c, o)); m.position.copy(pos); root.add(m); return m; };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const arrow = (root, from, to, c) => { seg(root, from, to, c, 1); const d = to.clone().sub(from).normalize(), cone = new THREE.Mesh(new THREE.ConeGeometry(.07, .22, 12), mat(c)); cone.position.copy(to); cone.quaternion.setFromUnitVectors(V(0, 1, 0), d); root.add(cone); };
const goldRing = (root, rx, ry) => { const m = new THREE.Mesh(new THREE.TorusGeometry(rx, .035, 8, 72), mat(GOLD, .95)); m.scale.y = ry / rx; root.add(m); };
const slots = (k, r, g = 2.1) => { const m = k + (r ? 1 : 0), gap = Math.min(g, 6.8 / Math.max(m, 1)); return Array.from({ length: m }, (_, i) => (i - (m - 1) / 2) * gap); };

function learner(root, F, temporal) {
  const { n, k, r } = F;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.4, 9, 6), new THREE.MeshBasicMaterial({ color: 0xf0c987, wireframe: true, transparent: true, opacity: .25 })); sand.position.z = -.4; root.add(sand);
  if (n === 0) { const tile = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .12), mat(GOLD)); root.add(tile); return; }
  const xs = slots(k, r);
  for (let i = 0; i < k; i++) {
    const cx = xs[i], g1 = V(cx - .5, 1.2), g2 = V(cx + .5, 1.2), plusX = temporal ? cx + .5 : cx - .5, minusX = temporal ? cx - .5 : cx + .5;
    ball(root, g1, GHOST, .17, .35); ball(root, g2, GHOST, .17, .35);
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(.5, .018, 6, 24, Math.PI), mat(GOLD, .9)); bridge.position.set(cx, 1.2, 0); root.add(bridge);
    seg(root, g1, V(cx - .5, -.6), GHOST, .35); seg(root, g2, V(cx + .5, -.6), GHOST, .35);
    ball(root, V(plusX, -.6), PLUS, .24); ball(root, V(minusX, -.6), MINUS, .24);
    if (temporal) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.5), mat(0xffffff, .13)); gl.position.set(cx, -.3, 0); root.add(gl); seg(root, V(cx, .45), V(cx, -1.05), 0xffffff, .8); }
  }
  if (r) { const cx = xs[xs.length - 1]; ball(root, V(cx, 1.2), GHOST, .17, .35); const s = .22; seg(root, V(cx - s, -.8 - s), V(cx + s, -.8 + s), 0xff6b6b, .9); seg(root, V(cx - s, -.8 + s), V(cx + s, -.8 - s), 0xff6b6b, .9); seg(root, V(cx, 1.0), V(cx, -.5), GHOST, .2); }
  if (F.reset) { goldRing(root, 3.9, 2.3); const a = new THREE.Mesh(new THREE.ConeGeometry(.16, .4, 12), mat(GOLD)); a.position.set(3.9, 0, 0); root.add(a); }
}
function physicist(root, F, temporal) {
  const { n, k, r } = F, plusC = temporal ? MINUS : PLUS, minusC = temporal ? PLUS : MINUS;
  if (n === 0) { ball(root, V(0, 0), GOLD, .22); return; }
  const xs = slots(k, r, 3.0), L = Math.min(1.25, (6.8 / Math.max(k + r, 1)) * .4);
  for (let i = 0; i < k; i++) {
    const cx = xs[i], c = V(cx, 0);
    const sq = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(cx - L, -L), V(cx + L, -L), V(cx + L, L), V(cx - L, L)]), lineMat(0x34425f, .8)); root.add(sq);
    seg(root, V(cx - L, -L), V(cx + L, L), GHOST, .9); seg(root, V(cx - L, L), V(cx + L, -L), GHOST, .9);
    arrow(root, c, V(cx + L * 1.05, 0), plusC); arrow(root, c, V(cx, L * 1.05), minusC);
    ball(root, c, GOLD, .06);
  }
  if (r) { const cx = xs[xs.length - 1]; seg(root, V(cx - L, -L), V(cx + L, L), GHOST, .9); ball(root, V(cx + L, L), 0xff6b6b, .09); ball(root, V(cx - L, -L), GHOST, .06, .3); }
  if (F.reset) goldRing(root, 3.9, 1.6);
}
function mathematician(root, F, temporal) {
  const { k, r } = F, d = 2 ** k, size = Math.min(.8, 5.2 / d), geo = new THREE.BoxGeometry(size * .86, size * .86, .05);
  const layers = r ? 2 : 1;
  for (let L = 0; L < layers; L++) {
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: L ? .45 : 1 }), d * d), m4 = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) { m4.makeTranslation((j - (d - 1) / 2) * size + L * .5, ((d - 1) / 2 - i) * size + L * .35, L * .5); inst.setMatrixAt(i * d + j, m4); col.set(i === j ? (L ? 0xffd166 : PLUS) : 0x26314a); inst.setColorAt(i * d + j, col); }
    root.add(inst);
  }
  if (temporal) seg(root, V(0, -d * size / 2 - .4, 0), V(0, d * size / 2 + .4, 0), 0xffffff, .45);
  if (F.reset) { const f = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-d * size / 2 - .25, -d * size / 2 - .25), V(d * size / 2 + .25, -d * size / 2 - .25), V(d * size / 2 + .25, d * size / 2 + .25), V(-d * size / 2 - .25, d * size / 2 + .25)]), lineMat(GOLD, 1)); root.add(f); }
}

export default function GenesisCanvas({ stage = 0, metricMode = 'Spatial', profile = 'Young Learner', lang = 'en' }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current; if (!host) return undefined;
    const T = TXT[lang] || TXT.en, temporal = metricMode === 'Temporal', F = genesisFacts(stage);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, host.clientWidth / 440, .1, 100), ren = new THREE.WebGLRenderer({ antialias: true, alpha: true }), root = new THREE.Group();
    ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.setSize(host.clientWidth, 440); host.appendChild(ren.domElement); scene.add(root);
    const lines = [T.stage(F.n, F.k, F.r)];
    if (profile === 'Young Learner') { learner(root, F, temporal); lines.push(T.story[stage]); if (temporal && F.k) lines.push(T.mirror); }
    else if (profile === 'Physicist') { physicist(root, F, temporal); lines.push(`${F.cell} ≅ ${F.algebra}`, T.phys); if (temporal && F.k) lines.push(T.physT); }
    else { mathematician(root, F, temporal); lines.push(`${F.cell} ≅ ${F.algebra}, dim ${F.dim}`); if (F.k) lines.push(T.math(2 ** F.k, F.k)); if (F.r) lines.push(T.mathR); if (temporal && F.k) lines.push(T.mathT); }
    if (F.reset) lines.push(T.reset);
    addLegend(host, lines, F.n);
    cam.position.set(0, 0, 9.2); root.rotation.x = -.35; root.position.y = .45; root.scale.setScalar(F.n >= 6 ? .8 : 1);
    let frame, t = 0; const draw = () => { t += .012; root.rotation.y = Math.sin(t) * .32; cam.lookAt(0, 0, 0); ren.render(scene, cam); frame = requestAnimationFrame(draw); }; draw();
    const resize = () => { cam.aspect = host.clientWidth / 440; cam.updateProjectionMatrix(); ren.setSize(host.clientWidth, 440); };
    addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); ren.dispose(); host.replaceChildren(); };
  }, [stage, metricMode, profile, lang]);
  return <div className="canvas genesis-canvas" ref={ref} aria-label={`Genesis stage ${stage} visual story`} />;
}
