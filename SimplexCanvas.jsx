import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const cameras = [[0, 0, 10], [5, 3, 8], [0, 6, 4], [2, 1, 5]];
const palette = { Clifford: 0x817cf8, Prime: 0x34d399, Simplex: 0xfbbf24, Cube: 0xf472b6 };
const sectorProfiles = {
  Sector_EM_Maxwell: { nodes: 6, ring: 2, accent: 0x35d9ff },
  Sector_Electroweak_Unified: { nodes: 8, ring: 4, accent: 0xffca62 },
  Sector_Color_Strong: { nodes: 3, ring: 3, accent: 0x58d68d },
  Sector_Vacuum_Mass_Generation: { nodes: 2, ring: 1, accent: 0xe59aff },
};

export default function SimplexCanvas({ step, activeView, sector }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current; if (!host) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / 440, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    camera.position.set(...cameras[step]); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(host.clientWidth, 440); host.appendChild(renderer.domElement);
    const root = new THREE.Group(); scene.add(root);
    const profile = sectorProfiles[sector]; const tint = palette[activeView];
    const points = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return new THREE.Vector3(Math.cos(a) * 3, Math.sin(a) * 3, 0); });
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: profile.accent });
    const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0x34425f });
    const addLine = (a, b, color = tint, opacity = .65) => root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, transparent: true, opacity })));

    if (sector === 'Sector_Color_Strong' && activeView === 'Simplex') {
      [0, 2, 5].forEach((index) => { const node = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 20), nodeMaterial); node.position.copy(points[index]); root.add(node); });
      addLine(points[0], points[2], profile.accent, 1); addLine(points[2], points[5], profile.accent, 1); addLine(points[5], points[0], profile.accent, 1);
    } else if (activeView === 'Clifford') {
      const frame = new THREE.Group();
      [[-1,-1], [1,-1], [1,1], [-1,1]].forEach(([x,y],i) => { const cube = new THREE.Mesh(new THREE.BoxGeometry(.36,.36,.36), i < profile.ring ? nodeMaterial : ghostMaterial); cube.position.set(x * 1.75, y * 1.75, i % 2 ? .7 : -.7); frame.add(cube); });
      addLine(new THREE.Vector3(-2.2,0,0),new THREE.Vector3(2.2,0,0),profile.accent,1); addLine(new THREE.Vector3(0,-2.2,0),new THREE.Vector3(0,2.2,0),profile.accent,1); root.add(frame);
    } else if (activeView === 'Prime') {
      [3,5,7,11,13,17,19,23].forEach((prime,i) => { const a=i*Math.PI/4; const radius=1.1+(prime%5)*.3; const sphere=new THREE.Mesh(new THREE.SphereGeometry(.1+(i<profile.ring?.04:0),18,18),i<profile.ring?nodeMaterial:ghostMaterial); sphere.position.set(Math.cos(a)*radius,Math.sin(a)*radius,0); root.add(sphere); if(i<profile.ring)addLine(new THREE.Vector3(),sphere.position,profile.accent,.9); });
    } else if (activeView === 'Simplex') {
      points.forEach((p,i)=>{const node=new THREE.Mesh(new THREE.SphereGeometry(.14,18,18),i<profile.nodes?nodeMaterial:ghostMaterial);node.position.copy(p);root.add(node)});
      for(let i=0;i<profile.nodes;i++) for(let j=i+1;j<profile.nodes;j++) addLine(points[i],points[j],i<profile.ring&&j<profile.ring?profile.accent:tint,i<profile.ring&&j<profile.ring?1:.23);
    } else {
      const bit = new THREE.BoxGeometry(.24,.24,.24);
      for(let i=0;i<16;i++){const x=(i%4-1.5)*1.25,y=(Math.floor(i/4)-1.5)*1.25;const node=new THREE.Mesh(bit,i<profile.nodes?nodeMaterial:ghostMaterial);node.position.set(x,y,(i%2?.35:-.35));root.add(node);if(i%4)addLine(new THREE.Vector3(x-1.25,y,(i-1)%2?.35:-.35),node.position,i<profile.ring?profile.accent:tint,i<profile.ring?1:.28)}
    }
    if (step > 1) { const wheel = new THREE.Mesh(new THREE.TorusGeometry(.8,.045,10,32), new THREE.MeshBasicMaterial({ color: tint })); wheel.rotation.x = Math.PI / 2; root.add(wheel); }
    const target = new THREE.Vector3(); let frame; const draw = () => { root.rotation.z += .002; camera.lookAt(target); renderer.render(scene, camera); frame = requestAnimationFrame(draw); }; draw();
    const resize = () => { camera.aspect = host.clientWidth / 440; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, 440); }; addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); renderer.dispose(); host.replaceChildren(); };
  }, [step, activeView, sector]);
  return <div className="canvas" ref={ref} aria-label={`${activeView} visualization`} />;
}
