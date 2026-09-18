import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Dimensões do container
    const width = currentMount.clientWidth || window.innerWidth;
    const height = currentMount.clientHeight || 500;

    // Cena, Câmera e Renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Grupo principal para rotação
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Esfera de Partículas (Rede Global)
    const particleCount = 650;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color('#10b981'); // Emerald
    const color2 = new THREE.Color('#06b6d4'); // Cyan
    const color3 = new THREE.Color('#6366f1'); // Indigo

    for (let i = 0; i < particleCount; i++) {
      // Distribuição esférica de Fibonacci
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 7.5 + (Math.random() - 0.5) * 0.5;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixedColor = color1.clone().lerp(i % 2 === 0 ? color2 : color3, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    globeGroup.add(particles);

    // 2. Anéis Orbitais de Moedas (Representando BRL, USD, ARS, EUR)
    const rings: THREE.Line[] = [];
    const ringRadii = [8.2, 9.4, 10.6];
    const ringColors = ['#10b981', '#38bdf8', '#818cf8'];

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.04, 64);
      const edges = new THREE.EdgesGeometry(ringGeo);
      const ringMat = new THREE.LineBasicMaterial({
        color: ringColors[idx],
        transparent: true,
        opacity: 0.35,
      });
      const ring = new THREE.Line(edges, ringMat);
      ring.rotation.x = Math.PI / (2 + idx * 0.4);
      ring.rotation.y = idx * 0.6;
      globeGroup.add(ring);
      rings.push(ring);
    });

    // 3. Nós Orbitais Destaque (Moedas em Trânsito)
    const nodeGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: '#34d399' });
    const orbitNodes: THREE.Mesh[] = [];

    for (let i = 0; i < 4; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      globeGroup.add(node);
      orbitNodes.push(node);
    }

    // Interação com o Mouse
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 1.5;
      mouseY = (y / rect.height) * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Redimensionamento responsivo
    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight || 500;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Loop de Animação
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotação suave baseada no mouse com atenuação (damping)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      globeGroup.rotation.y = elapsedTime * 0.08 + targetX * 0.5;
      globeGroup.rotation.x = targetY * 0.4;

      // Animação individual dos anéis
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsedTime * (0.05 + idx * 0.02);
      });

      // Animação dos nós orbitais de moedas
      orbitNodes.forEach((node, idx) => {
        const radius = ringRadii[idx % ringRadii.length];
        const speed = 0.5 + idx * 0.2;
        const angle = elapsedTime * speed + (idx * Math.PI) / 2;
        node.position.x = Math.cos(angle) * radius;
        node.position.y = Math.sin(angle) * Math.sin(rings[idx % rings.length].rotation.x) * radius;
        node.position.z = Math.sin(angle) * Math.cos(rings[idx % rings.length].rotation.x) * radius;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Limpeza de memória ao desmontar
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80 overflow-hidden" 
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};
