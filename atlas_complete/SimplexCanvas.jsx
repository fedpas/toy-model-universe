import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { atlasCell, cellFacts, bladeSquare, gradeCounts, addLegend, PLUS, MINUS, GOLD, DIM, LEDGER_BLOCKS, LEDGER_COLORS } from './canvasFacts';
import { signatureLattice } from './genesis_audit_v3.js';

// Every picture is computed from the audited cell Cl(p,q) of the sector (Spatial) or its mirror Cl(q,p) (Temporal).
// Clifford: generators as nodes, bivectors as edges (compact = square -1, boost = square +1).
// Prime:    2^n doubling ladder (only the prime 2 appears).
// Simplex:  n vertices; a grade-k blade is a (k-1)-face.
// Cube:     n-cube, vertices coloured by whether the blade squares to +1.
const cameras = [[0, 0, 10], [5, 3, 8], [0, 6, 4], [2, 1, 5]];
const palette = { Clifford: 0x817cf8, Prime: 0x34d399, Simplex: 0xfbbf24, Cube: 0xf472b6 };
const TXT = {
  en: { bivec: (c, b) => `bivectors: ${c} square −1 (compact), ${b} square +1 (boost)`, i2: (v, central) => `volume element I² = ${v > 0 ? '+1' : '−1'}${central ? ', central' : ''}`, mirror: 'mirror cell (Q → −Q)', prime: (n, d) => `2^${n} = ${d}: each generator doubles the dimension; only the prime 2 appears`, simplex: (n) => `${n} vertices; a grade-k blade is a (k−1)-face. Blades per grade:`, cube: (n, a, t) => `Q${n}: ${t} vertices; ${a} blades square to +1, ${t - a} to −1`, open: 'Open: candidate top-quark cells (red) are not derived', ledger: 'Peirce blocks (2,6,4,2,1,1): diagonal 62 + off-diagonal 194 = 256', ledgerKey: 'End_ℝ(𝕍) = M₁₆(ℝ); coloured = diagonal blocks' },
  it: { bivec: (c, b) => `bivettori: ${c} con quadrato −1 (compatti), ${b} con quadrato +1 (boost)`, i2: (v, central) => `elemento di volume I² = ${v > 0 ? '+1' : '−1'}${central ? ', centrale' : ''}`, mirror: 'cella speculare (Q → −Q)', prime: (n, d) => `2^${n} = ${d}: ogni generatore raddoppia la dimensione; compare solo il primo 2`, simplex: (n) => `${n} vertici; un blade di grado k è una (k−1)-faccia. Blade per grado:`, cube: (n, a, t) => `Q${n}: ${t} vertici; ${a} blade con quadrato +1, ${t - a} con −1`, open: 'Aperto: le celle candidate del quark top (rosso) non sono derivate', ledger: 'Blocchi di Peirce (2,6,4,2,1,1): diagonale 62 + fuori diagonale 194 = 256', ledgerKey: 'End_ℝ(𝕍) = M₁₆(ℝ); colorati = blocchi diagonali' }
};
const accents = { Sector_Furey_Ledger: 0x6366f1, Sector_Gravity_Strain: 0xff4772, Sector_Open_Questions: 0xef4444, Sector_Cosmic_Horizon: 0xffffff };

export default function SimplexCanvas({ step = 3, activeView, sector, metricMode = 'Spatial', lang = 'en' }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current; if (!host) return undefined;
    const T = TXT[lang] || TXT.en, temporal = metricMode === 'Temporal';
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, host.clientWidth / 440, .1, 100), renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(host.clientWidth, 440); host.appendChild(renderer.domElement);
    const root = new THREE.Group(); scene.add(root);
    const tint = palette[activeView] ?? palette.Clifford, accent = accents[sector] ?? tint;
    const mat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o });
    const lineMat = (c, o) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
    const seg = (pairs, c, o) => { if (!pairs.length) return; const g = new THREE.BufferGeometry().setFromPoints(pairs.flat()); root.add(new THREE.LineSegments(g, lineMat(c, o))); };
    const ball = (pos, c, r = .14) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 18), mat(c)); m.position.copy(pos); root.add(m); return m; };
    const ring = (r, c, o = 1, tube = .03) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 64), mat(c, o)); root.add(m); return m; };
    const cell = atlasCell(sector), F = cell ? cellFacts(cell.p, cell.q, temporal) : null;
    const legend = [];
    let budget = null;

    if (!F) {
      // Open_Questions: the lattice itself, with the candidate cells that are NOT derived
      const rows = signatureLattice(8); const cand = new Set(['4,4', '7,1', '7,-1', '3,1']);
      rows.forEach((row) => row.forEach((c) => { const pos = new THREE.Vector3(c.C * .42, (c.R - 4) * .62, 0), hot = cand.has(`${c.R},${c.C}`); const b = ball(pos, hot ? 0xef4444 : DIM, hot ? .16 : .09); if (hot) { const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .025, 8, 28), mat(0xef4444)); r.position.copy(pos); root.add(r); } }));
      legend.push(T.open);
    } else if (activeView === 'Clifford' && sector === 'Sector_Furey_Ledger' && !temporal) {
      // the actual ledger: 16x16 block structure of End_R(V)
      const N = 16, size = .26, geo = new THREE.BoxGeometry(size * .86, size * .86, .05), inst = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ transparent: true }), N * N);
      const blockOf = []; LEDGER_BLOCKS.forEach((n, b) => { for (let i = 0; i < n; i++) blockOf.push(b); });
      const m4 = new THREE.Matrix4(), col = new THREE.Color();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { m4.makeTranslation((j - 7.5) * size, (7.5 - i) * size, 0); inst.setMatrixAt(i * N + j, m4); const same = blockOf[i] === blockOf[j]; col.set(same ? LEDGER_COLORS[blockOf[i]] : 0x26314a); if (!same) col.multiplyScalar(.7); inst.setColorAt(i * N + j, col); }
      root.add(inst); legend.push(T.ledger, T.ledgerKey);
    } else if (activeView === 'Clifford') {
      const R = 2.9, pts = F.signs.map((s, i) => { const a = i * 2 * Math.PI / Math.max(F.n, 1) - Math.PI / 2; return new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0); });
      const compact = [], boost = [];
      for (let i = 0; i < F.n; i++) for (let j = i + 1; j < F.n; j++) (F.signs[i] === F.signs[j] ? compact : boost).push([pts[i], pts[j]]);
      seg(compact, GOLD, .9); seg(boost, 0x7aa2ff, .5);
      pts.forEach((p, i) => ball(p, F.signs[i] > 0 ? PLUS : MINUS, .2));
      if (F.n >= 1) { if (F.central) ball(new THREE.Vector3(), F.I2 > 0 ? 0xffffff : 0xa78bfa, .22); else ring(.55, F.I2 > 0 ? 0xffffff : 0xa78bfa, 1, .05); }
      if (temporal) seg([[new THREE.Vector3(0, -3.5, 0), new THREE.Vector3(0, 3.5, 0)]], 0xffffff, .45);
      legend.push(`${F.name} ≅ ${F.algebra}${temporal ? ' · ' + T.mirror : ''}`, T.bivec(F.compact, F.boost), T.i2(F.I2, F.central));
    } else if (activeView === 'Prime') {
      for (let k = 0; k <= F.n; k++) { const cnt = 2 ** k, r = k === 0 ? 0 : .55 + k * .36, pos = new Float32Array(cnt * 3); for (let i = 0; i < cnt; i++) { const a = i * 2 * Math.PI / cnt + k * .4; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(a) * r; pos[i * 3 + 2] = 0; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); root.add(new THREE.Points(g, new THREE.PointsMaterial({ color: k === 8 ? GOLD : accent, size: k > 6 ? .1 : .17, sizeAttenuation: true }))); if (k > 0) ring(r, 0x26314a, .8, .008); }
      if (F.n === 8) ring(.55 + 8 * .36 + .25, GOLD, .9, .03);
      legend.push(`${F.name} ≅ ${F.algebra}`, T.prime(F.n, F.dim));
    } else if (activeView === 'Simplex') {
      const n = F.n, R = 2.8, pts = Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / Math.max(n, 1) - Math.PI / 2; return new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0); });
      const edges = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([pts[i], pts[j]]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) { const g = new THREE.BufferGeometry().setFromPoints([pts[i], pts[j], pts[k]]); g.setIndex([0, 1, 2]); root.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: n > 6 ? .035 : .07, side: THREE.DoubleSide, depthWrite: false }))); }
      seg(edges, accent, .7); pts.forEach((p) => ball(p, 0xffffff, .16));
      legend.push(`${F.name}${temporal ? ' · ' + T.mirror : ''}`, T.simplex(n), gradeCounts(n).join(' · '));
    } else {
      const n = F.n, vs = Array.from({ length: n }, (_, i) => { const th = i * Math.PI / Math.max(n, 1); return new THREE.Vector3(Math.cos(th), Math.sin(th) * .9, i % 2 ? .35 : -.35).multiplyScalar(n > 5 ? .62 : 1); });
      const center = vs.reduce((a, v) => a.add(v.clone().multiplyScalar(.5)), new THREE.Vector3()), total = 2 ** n;
      const P = (m) => { const v = new THREE.Vector3(); for (let i = 0; i < n; i++) if (m >> i & 1) v.add(vs[i]); return v.sub(center); };
      const edges = []; for (let m = 0; m < total; m++) for (let i = 0; i < n; i++) if (!(m >> i & 1)) edges.push([P(m), P(m | 1 << i)]);
      seg(edges, tint, .22);
      const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(n > 6 ? .06 : .1, 12, 12), new THREE.MeshBasicMaterial(), total), m4 = new THREE.Matrix4(), col = new THREE.Color(); let active = 0;
      for (let m = 0; m < total; m++) { const plus = bladeSquare(m, F.signs) > 0; if (plus) active++; m4.makeTranslation(...P(m).toArray()); inst.setMatrixAt(m, m4); col.set(plus ? accent : DIM); inst.setColorAt(m, col); }
      root.add(inst); legend.push(`${F.name}${temporal ? ' · ' + T.mirror : ''}`, T.cube(n, active, total));
    }
    addLegend(host, legend, budget);

    const target = new THREE.Vector3();
    const fitCamera = () => { root.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(root); if (bounds.isEmpty()) { target.set(0, 0, 0); camera.position.set(...cameras[step]); camera.lookAt(target); return; } const sphere = bounds.getBoundingSphere(new THREE.Sphere()); target.copy(sphere.center); const vh = THREE.MathUtils.degToRad(camera.fov / 2), hh = Math.atan(Math.tan(vh) * camera.aspect), d = Math.max(sphere.radius / Math.sin(vh), sphere.radius / Math.sin(hh)) * 1.22; camera.position.copy(new THREE.Vector3(...cameras[step]).normalize().multiplyScalar(d).add(target)); camera.lookAt(target); };
    fitCamera(); let frame; const draw = () => { root.rotation.z += .002; camera.lookAt(target); renderer.render(scene, camera); frame = requestAnimationFrame(draw); }; draw();
    const resize = () => { camera.aspect = host.clientWidth / 440; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, 440); fitCamera(); };
    addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); renderer.dispose(); host.replaceChildren(); };
  }, [step, activeView, sector, metricMode, lang]);
  return <div className="canvas" ref={ref} aria-label={`${activeView} visualization`} />;
}
