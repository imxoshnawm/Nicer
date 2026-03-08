"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Animated floating particles
function Particles({ count = 200 }: { count?: number }) {
    const mesh = useRef<THREE.Points>(null!);
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return pos;
    }, [count]);

    const sizes = useMemo(() => {
        const s = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            s[i] = Math.random() * 2 + 0.5;
        }
        return s;
    }, [count]);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
            mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#00A8E8"
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

// Animated glowing orb
function GlowOrb({ position, color, speed = 1, distort = 0.4, size = 1 }: {
    position: [number, number, number];
    color: string;
    speed?: number;
    distort?: number;
    size?: number;
}) {
    const mesh = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
        }
    });

    return (
        <Float speed={speed} rotationIntensity={0.2} floatIntensity={0.5}>
            <Sphere ref={mesh} args={[size, 64, 64]} position={position}>
                <MeshDistortMaterial
                    color={color}
                    attach="material"
                    distort={distort}
                    speed={speed * 2}
                    roughness={0.1}
                    metalness={0.8}
                    transparent
                    opacity={0.15}
                />
            </Sphere>
        </Float>
    );
}

// Rotating wireframe torus
function WireframeTorus({ position, color }: {
    position: [number, number, number];
    color: string;
}) {
    const mesh = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x = state.clock.elapsedTime * 0.15;
            mesh.current.rotation.y = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <mesh ref={mesh} position={position}>
            <torusGeometry args={[1.5, 0.02, 16, 100]} />
            <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
    );
}

// Grid plane
function GridPlane() {
    const mesh = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x = -Math.PI / 2;
            mesh.current.position.y = -3 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <mesh ref={mesh} position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[40, 40, 40, 40]} />
            <meshBasicMaterial
                color="#00A8E8"
                wireframe
                transparent
                opacity={0.04}
            />
        </mesh>
    );
}

// Main 3D Scene
function Scene({ variant = "hero" }: { variant?: "hero" | "about" | "contact" | "news" | "activities" }) {
    return (
        <>
            <ambientLight intensity={0.1} />
            <pointLight position={[10, 10, 10]} intensity={0.3} color="#00A8E8" />
            <pointLight position={[-10, -10, -10]} intensity={0.2} color="#003459" />

            <Particles count={variant === "hero" ? 300 : 150} />
            <GridPlane />

            {variant === "hero" && (
                <>
                    <GlowOrb position={[-3, 1, -2]} color="#00A8E8" speed={0.8} distort={0.5} size={1.5} />
                    <GlowOrb position={[3, -1, -3]} color="#003459" speed={0.6} distort={0.3} size={1.2} />
                    <GlowOrb position={[0, 2, -4]} color="#007EA7" speed={1} distort={0.4} size={0.8} />
                    <WireframeTorus position={[4, 2, -5]} color="#00A8E8" />
                    <WireframeTorus position={[-4, -2, -6]} color="#003459" />
                </>
            )}

            {variant === "about" && (
                <>
                    <GlowOrb position={[-2, 0, -3]} color="#00A8E8" speed={0.5} distort={0.6} size={1.8} />
                    <GlowOrb position={[3, 1, -4]} color="#003459" speed={0.7} distort={0.3} size={1} />
                    <WireframeTorus position={[0, 0, -5]} color="#007EA7" />
                </>
            )}

            {variant === "contact" && (
                <>
                    <GlowOrb position={[2, 0, -2]} color="#007EA7" speed={0.6} distort={0.4} size={1.3} />
                    <GlowOrb position={[-3, 1, -4]} color="#00A8E8" speed={0.8} distort={0.5} size={1} />
                </>
            )}

            {variant === "news" && (
                <>
                    <GlowOrb position={[-3, 2, -3]} color="#00A8E8" speed={0.4} distort={0.3} size={1.2} />
                    <GlowOrb position={[4, -1, -5]} color="#003459" speed={0.9} distort={0.5} size={1.5} />
                    <WireframeTorus position={[0, 1, -6]} color="#007EA7" />
                </>
            )}

            {variant === "activities" && (
                <>
                    <GlowOrb position={[0, 0, -3]} color="#007EA7" speed={0.7} distort={0.6} size={2} />
                    <WireframeTorus position={[-3, 2, -5]} color="#00A8E8" />
                    <WireframeTorus position={[3, -1, -4]} color="#003459" />
                </>
            )}
        </>
    );
}

export default function Background3D({ variant = "hero" }: { variant?: "hero" | "about" | "contact" | "news" | "activities" }) {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            {/* CSS gradient base layer */}
            <div className="absolute inset-0 bg-nicer-dark" />
            <div className="absolute inset-0 bg-gradient-to-b from-nicer-dark via-slate-900/50 to-nicer-dark" />

            {/* Radial glow effects */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-nicer-blue/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-nicer-blue-dark/10 rounded-full blur-[120px]" />

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                dpr={[1, 1.5]}
                gl={{ 
                    antialias: true, 
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
            >
                <Scene variant={variant} />
            </Canvas>
        </div>
    );
}
