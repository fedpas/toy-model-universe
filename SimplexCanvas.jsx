import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SimplexCanvas({ activeView }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 500;
    const height = 350;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const vertexCount = 8;
    const radius = 3.3;
    const vertices = [];

    // Calculate regular Petrie coordinates on the boundary ring
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i * 2 * Math.PI) / vertexCount;
      vertices.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }

    const group = new THREE.Group();

    // DYNAMIC FILTER ENGINE: Adjusts colors and line thickness based on active framework view
    const getLayerColor = () => {
      if (activeView === 'Prime') return '#34d399';     // Arithmetic Emerald
      if (activeView === 'Simplex') return '#fbbf24';   // Polyhedral Amber
      if (activeView === 'Cube') return '#f472b6';      // Lattice Pink
      return '#818cf8';                                 // Clifford Indigo
    };

    // Draw the 28 structural cross-connecting edges
    for (let i = 0; i < vertexCount; i++) {
      for (let j = i + 1; j < vertexCount; j++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([vertices[i], vertices[j]]);
        
        // Electroweak channel edges (1-2 and 2-3 links) glow with intense opacity
        const isElectroweakEdge = (i === 1 && j === 2) || (i === 2 && j === 3);
        const edgeOpacity = isElectroweakEdge ? 0.90 : 0.20;
        const edgeWidth = isElectroweakEdge ? 2.5 : 1.0;

        const lineMaterial = new THREE.LineBasicMaterial({
          color: getLayerColor(),
          transparent: true,
          opacity: edgeOpacity,
          linewidth: edgeWidth // Note: linewidth > 1 depends on hardware drivers
        });

        const line = new THREE.Line(geometry, lineMaterial);
        group.add(line);
      }
    }

    // Draw the 8 base vertex coordinate landmarks
    const sphereGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({ color: '#22d3ee' });
    
    vertices.forEach(pos => {
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pos);
      group.add(sphere);
    });

    scene.add(group);

    // Continuous parallel transport animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.z += 0.002; // Steady, calculated rotation speed
      renderer.render(scene, camera);
    };
    animate();

    // Clean browser window contexts on hot-reload or unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [activeView]);

  return <div ref={containerRef} style={{ width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden' }} />;
}