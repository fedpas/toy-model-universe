import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const cameraPoints = [[0, 0, 10], [5, 3, 8], [0, 6, 4], [2, 1, 5]];
export default function SimplexCanvas({ step, onSelect }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current; if (!host) return undefined;
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x070916, 0.06);
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / 480, 0.1, 100); camera.position.set(...cameraPoints[step]);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(host.clientWidth, 480); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); host.appendChild(renderer.domElement);
    const root = new THREE.Group(); scene.add(root);
    const stars = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 120 }, () => new THREE.Vector3((Math.random()-.5)*18,(Math.random()-.5)*12,(Math.random()-.5)*6))), new THREE.PointsMaterial({color:0x925cff,size:.025})); scene.add(stars);
    const points = Array.from({length:8}, (_, i) => { const a=i*Math.PI/4; return new THREE.Vector3(Math.cos(a)*3, Math.sin(a)*3, 0); });
    const cyan = new THREE.MeshBasicMaterial({color:0x32d7ff}); const red = new THREE.MeshBasicMaterial({color:0xff4d73}); const gold = new THREE.LineBasicMaterial({color:0xffcc67, transparent:true, opacity:1});
    points.forEach((p,i) => { const node = new THREE.Mesh(new THREE.SphereGeometry(.17,24,24), i < 4 && step > 0 ? cyan : step > 0 ? red : cyan); node.position.copy(p); if(step>0 && i>=4) node.position.z=-1.6; root.add(node); });
    if(step>=1) { const grid = new THREE.GridHelper(8, 8, 0x298bd0, 0x18354e); grid.rotation.x=Math.PI/2; grid.position.z=-.4; root.add(grid); for(let i=4;i<8;i++){ const ring = new THREE.Mesh(new THREE.TorusGeometry(.42,.035,10,36),red); ring.position.copy(points[i]); ring.position.z=-1.5; root.add(ring); } }
    if(step>=2) { const floor = new THREE.Mesh(new THREE.PlaneGeometry(7,7), new THREE.MeshBasicMaterial({color:0x47d9d2,transparent:true,opacity:.10,side:THREE.DoubleSide})); floor.rotation.x=-Math.PI/2; floor.position.z=-.45; root.add(floor); const wheel=new THREE.Mesh(new THREE.TorusGeometry(.85,.06,12,42),cyan); wheel.rotation.x=Math.PI/2; wheel.position.z=.4; root.add(wheel); }
    if(step>=3) { let n=0; for(let i=0;i<8;i++) for(let j=i+1;j<8;j++){ const active=n++<4; root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[i],points[j]]), active ? gold : new THREE.LineBasicMaterial({color:0x50719a,transparent:true,opacity:.32}))); } }
    const target = new THREE.Vector3(0,0,0); let frame; const animate=()=>{ root.rotation.z += .002; camera.lookAt(target); renderer.render(scene,camera); frame=requestAnimationFrame(animate); }; animate();
    const resize=()=>{camera.aspect=host.clientWidth/480;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,480)}; window.addEventListener('resize',resize);
    renderer.domElement.onclick=()=>onSelect?.();
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.dispose();host.replaceChildren();};
  },[step,onSelect]);
  return <div className="canvas" ref={ref} aria-label="Interactive toy-model diagram" />;
}
