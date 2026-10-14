import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MedicalScene() {
    const mountRef = useRef(null);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Ambient Lights & Green Point Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x0B4F47, 3.5, 50);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x16A085, 2.5, 50);
        pointLight2.position.set(-10, -10, 10);
        scene.add(pointLight2);

        // Group for rotation
        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // Create 3D Capsule Pill Mesh with Medical Green Tint
        const geometry = new THREE.CapsuleGeometry(2.0, 3.8, 16, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0B4F47,
            emissive: 0x16A085,
            emissiveIntensity: 0.25,
            shininess: 95,
            transparent: true,
            opacity: 0.75,
            wireframe: false
        });

        const pillMesh = new THREE.Mesh(geometry, material);
        pillMesh.rotation.z = Math.PI / 4;
        pillMesh.position.set(8.5, 2.5, -2);
        mainGroup.add(pillMesh);

        // Orbiting Ring in Light Green
        const ringGeo = new THREE.TorusGeometry(4.2, 0.07, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x16A085, transparent: true, opacity: 0.35 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3;
        pillMesh.add(ringMesh);

        // Particle field around scene
        const particleCount = 60;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 30;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 15;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x16A085,
            size: 0.18,
            transparent: true,
            opacity: 0.5
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // Mouse Interaction
        let mouseX = 0;
        let mouseY = 0;

        const onMouseMove = (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        window.addEventListener('mousemove', onMouseMove);

        // Resize handler
        const onResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', onResize);

        // Animation Loop
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            pillMesh.rotation.x += 0.004;
            pillMesh.rotation.y += 0.006;

            mainGroup.rotation.y += (mouseX * 0.25 - mainGroup.rotation.y) * 0.05;
            mainGroup.rotation.x += (-mouseY * 0.25 - mainGroup.rotation.x) * 0.05;

            particles.rotation.y += 0.0008;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationFrameId);
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-25 overflow-hidden"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
}
