import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Executive3DScene({
  interactive = true,
  opacity = 0.85,
  particleCount = 500,
  showCore = true,
  style = {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Particle Cloud (Procurement Nodes)
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColorA = new THREE.Color("#06b6d4"); // Cyan
    const baseColorB = new THREE.Color("#3b82f6"); // Blue
    const baseColorC = new THREE.Color("#8b5cf6"); // Violet

    for (let i = 0; i < particleCount; i++) {
      const radius = 12 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mixed =
        Math.random() < 0.4
          ? baseColorA
          : Math.random() < 0.8
          ? baseColorB
          : baseColorC;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3D Wireframe Icosahedron Core (Intelligence Nexus)
    let coreGroup = null;
    if (showCore) {
      coreGroup = new THREE.Group();

      const innerGeometry = new THREE.IcosahedronGeometry(7, 1);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const coreWireframe = new THREE.Mesh(innerGeometry, wireframeMaterial);
      coreGroup.add(coreWireframe);

      // Glowing Vertices
      const vertexGeometry = new THREE.BufferGeometry();
      const posAttr = innerGeometry.attributes.position;
      vertexGeometry.setAttribute("position", posAttr);

      const vertexMaterial = new THREE.PointsMaterial({
        size: 0.4,
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const coreVertices = new THREE.Points(vertexGeometry, vertexMaterial);
      coreGroup.add(coreVertices);

      // Outer Torus Ring
      const ringGeo = new THREE.TorusGeometry(10, 0.04, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      coreGroup.add(ring);

      scene.add(coreGroup);
    }

    // Mouse Tracking for Parallax
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = container.clientWidth / 2;
    let windowHalfY = container.clientHeight / 2;

    const onMouseMove = (event) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - windowHalfX;
      const mouseY = event.clientY - rect.top - windowHalfY;
      targetX = (mouseX / windowHalfX) * 2;
      targetY = (mouseY / windowHalfY) * 2;
    };

    if (interactive) {
      window.addEventListener("mousemove", onMouseMove);
    }

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      windowHalfX = w / 2;
      windowHalfY = h / 2;
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow orbital rotation
      particles.rotation.y += delta * 0.04;
      particles.rotation.x += delta * 0.02;

      if (coreGroup) {
        coreGroup.rotation.y += delta * 0.12;
        coreGroup.rotation.x += delta * 0.06;
      }

      // Smooth camera parallax
      camera.position.x += (targetX * 3 - camera.position.x) * 0.05;
      camera.position.y += (-targetY * 3 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [interactive, particleCount, showCore]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: interactive ? "auto" : "none",
        zIndex: 0,
        opacity,
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
