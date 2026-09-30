import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const cameras = [[0,0,10],[5,3,8],[0,6,4],[2,1,5]];
const palette = { Clifford:0x817cf8, Prime:0x34d399, Simplex:0xfbbf24, Cube:0xf472b6 };
const sectorProfiles = {
  Sector_Trivector_Base:{nodes:5,ring:3,accent:0x5bbcff,strain:false},
  Sector_Trivector_Quark:{nodes:5,ring:3,accent:0xff9c55,strain:false},
  Sector_Trivector_Lepton:{nodes:5,ring:2,accent:0x78d8ff,strain:false},
  Sector_STA_Euclidean_Base:{nodes:6,ring:4,accent:0xd8e2ff,strain:false},
  Sector_STA_Minkowski:{nodes:6,ring:4,accent:0x72c6ff,strain:false},
  Sector_STA_Symmetric_Core:{nodes:6,ring:4,accent:0xffcd68,strain:false},
  Sector_STA_Fiber_Frame:{nodes:6,ring:3,accent:0xb58cff,strain:false},
  Sector_Row5_Base:{nodes:7,ring:5,accent:0xff7b9f,strain:false},
  Sector_Row6_Confinement:{nodes:6,ring:3,accent:0x4fd18b,strain:false},
  Sector_Row7_Mirror:{nodes:7,ring:4,accent:0xe59aff,strain:false},
  Sector_Open_Questions:{nodes:8,ring:4,accent:0xef4444,strain:true},
  Sector_Furey_Ledger:{nodes:8,ring:6,accent:0x6366f1,strain:false},
  Sector_Vacuum_Origin:{nodes:1,ring:1,accent:0xd6d6ff,strain:false},
  Sector_Inject_Base_Real:{nodes:2,ring:1,accent:0x58d2ff,strain:false},
  Sector_Inject_Fiber_Clock:{nodes:2,ring:2,accent:0xa382ff,strain:false},
  Sector_Quaternionic_Base:{nodes:4,ring:2,accent:0x5be6c0,strain:false},
  Sector_Quaternionic_Fiber:{nodes:4,ring:2,accent:0x8c8cff,strain:false},
  Sector_EM_Maxwell:{nodes:6,ring:2,accent:0x35d9ff,strain:false},
  Sector_Color_Strong:{nodes:8,ring:3,accent:0x34d399,strain:false},
  Sector_Gravity_Strain:{nodes:8,ring:6,accent:0xff4772,strain:true},
  Sector_Baryon_Conservation:{nodes:3,ring:3,accent:0x4fd18b,strain:false},
  Sector_Chiral_Parity:{nodes:5,ring:1,accent:0xff7b9f,strain:false},
  Sector_Cosmic_Horizon:{nodes:8,ring:8,accent:0xffffff,strain:false},
  Sector_GUT_Junction:{nodes:8,ring:4,accent:0xd995ff,strain:false},
  Sector_Electroweak_Unified:{nodes:8,ring:4,accent:0xffcd68,strain:false},
  Sector_Vacuum_Mass_Generation:{nodes:2,ring:1,accent:0xe59aff,strain:false},
};
export default function SimplexCanvas({step,activeView,sector,metricMode='Spatial'}){
 const ref=useRef(null); useEffect(()=>{const host=ref.current;if(!host)return undefined;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,host.clientWidth/440,.1,100),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  camera.position.set(...cameras[step]);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,440);host.appendChild(renderer.domElement);
  const root=new THREE.Group();scene.add(root);const profile=sectorProfiles[sector]||sectorProfiles.Sector_EM_Maxwell,tint=palette[activeView];
  const sx=metricMode==='Temporal' ? (profile.strain?.5:.78) : (profile.strain?.65:1),sy=metricMode==='Temporal' ? (profile.strain?1.4:1.14) : (profile.strain?1.25:1);
  const points=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return new THREE.Vector3(Math.cos(a)*3*sx,Math.sin(a)*3*sy,0)});
  const nodeMat=new THREE.MeshBasicMaterial({color:profile.accent}),ghostMat=new THREE.MeshBasicMaterial({color:0x34425f});
  const line=(a,b,color=tint,opacity=.65)=>root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color,transparent:true,opacity})));
  if((sector==='Sector_Color_Strong'||sector==='Sector_Baryon_Conservation')&&activeView==='Simplex'){[0,2,5].forEach(i=>{const node=new THREE.Mesh(new THREE.SphereGeometry(.2,20,20),nodeMat);node.position.copy(points[i]);root.add(node)});line(points[0],points[2],profile.accent,1);line(points[2],points[5],profile.accent,1);line(points[5],points[0],profile.accent,1);
  }else if(activeView==='Clifford'){const frame=new THREE.Group();[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,y],i)=>{const cube=new THREE.Mesh(new THREE.BoxGeometry(.36,.36,.36),i<profile.ring?nodeMat:ghostMat);cube.position.set(x*1.75*(profile.strain?.7:1),y*1.75,i%2?.7:-.7);frame.add(cube)});line(new THREE.Vector3(-2.2*(profile.strain?.6:1),0,0),new THREE.Vector3(2.2*(profile.strain?.6:1),0,0),profile.accent,1);line(new THREE.Vector3(0,-2.2,0),new THREE.Vector3(0,2.2,0),profile.accent,1);root.add(frame);
  }else if(activeView==='Prime'){[3,5,7,11,13,17,19,23].forEach((prime,i)=>{const a=i*Math.PI/4,r=(1.1+(prime%5)*.3)*(profile.strain?.8:1),sphere=new THREE.Mesh(new THREE.SphereGeometry(.1,18,18),i<profile.ring?nodeMat:ghostMat);sphere.position.set(Math.cos(a)*r*sx,Math.sin(a)*r*sy,0);root.add(sphere);if(i<profile.ring)line(new THREE.Vector3(),sphere.position,profile.accent,.9)});
  }else if(activeView==='Simplex'){points.forEach((p,i)=>{const node=new THREE.Mesh(new THREE.SphereGeometry(.14,18,18),i<profile.nodes?nodeMat:ghostMat);node.position.copy(p);root.add(node)});for(let i=0;i<profile.nodes;i++)for(let j=i+1;j<profile.nodes;j++)line(points[i],points[j],i<profile.ring&&j<profile.ring?profile.accent:tint,i<profile.ring&&j<profile.ring?1:.23);
  }else{const bit=new THREE.BoxGeometry(.24,.24,.24);for(let i=0;i<16;i++){const x=(i%4-1.5)*1.25*(profile.strain?.7:1),y=(Math.floor(i/4)-1.5)*1.25;const node=new THREE.Mesh(bit,i<profile.nodes?nodeMat:ghostMat);node.position.set(x,y,i%2?.35:-.35);root.add(node);if(i%4)line(new THREE.Vector3(x-1.25*(profile.strain?.7:1),y,(i-1)%2?.35:-.35),node.position,i<profile.ring?profile.accent:tint,i<profile.ring?1:.28)}}
  if(step>1){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.8,.045,10,32),new THREE.MeshBasicMaterial({color:tint}));wheel.rotation.x=Math.PI/2;if(profile.strain)wheel.scale.set(.65,1.25,1);root.add(wheel)}
  const target=new THREE.Vector3();
  const fitCamera=()=>{root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);const sphere=bounds.getBoundingSphere(new THREE.Sphere());target.copy(sphere.center);const verticalHalf=THREE.MathUtils.degToRad(camera.fov/2);const horizontalHalf=Math.atan(Math.tan(verticalHalf)*camera.aspect);const distance=Math.max(sphere.radius/Math.sin(verticalHalf),sphere.radius/Math.sin(horizontalHalf))*1.22;camera.position.copy(new THREE.Vector3(...cameras[step]).normalize().multiplyScalar(distance).add(target));camera.lookAt(target);};
  fitCamera();let frame;const draw=()=>{root.rotation.z+=.002;camera.lookAt(target);renderer.render(scene,camera);frame=requestAnimationFrame(draw)};draw();const resize=()=>{camera.aspect=host.clientWidth/440;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,440);fitCamera()};addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);renderer.dispose();host.replaceChildren()};
 },[step,activeView,sector,metricMode]);return <div className="canvas" ref={ref} aria-label={`${activeView} visualization`}/>;
}
