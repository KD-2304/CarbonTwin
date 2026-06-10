import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ─── TREE ON GLOBE ──────────────────────────────────────────────
function GlobeTree({ rotation, scale }) {
  return (
    <group rotation={rotation} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.15, 5]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[0.09, 0.22, 5]} />
        <meshStandardMaterial color="#10b981" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.07, 0.16, 5]} />
        <meshStandardMaterial color="#34d399" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// ─── SMOKESTACK ON GLOBE ────────────────────────────────────────
function GlobeSmokestack({ rotation, scale }) {
  return (
    <group rotation={rotation} scale={scale}>
      {/* Main tower */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.8} />
      </mesh>
      {/* Top red rim */}
      <mesh position={[0, 1.66, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 6]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>
      {/* Smoke particles (simple stationary preview meshes) */}
      <mesh position={[0.02, 1.75, 0]} scale={0.03}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#6b7280" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.01, 1.83, 0.02]} scale={0.05}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#4b5563" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ─── GLOBE SCENE ────────────────────────────────────────────────
function GlobeScene({ value = 3500 }) {
  const globeRef = useRef();
  const particleGroupRef = useRef();
  const ringsRef = useRef();

  // Normalize carbon value from 1500 to 6500 for color interpolation
  const factor = useMemo(() => {
    return Math.min(1, Math.max(0, (value - 1800) / 4000));
  }, [value]);

  // Interpolate globe colors
  const { planetColor, emissiveColor, skyBg } = useMemo(() => {
    // 0: Clean (greenish blue), 0.5: Moderate (dusty orange-green), 1.0: Polluted (charcoal red)
    const cClean = new THREE.Color('#0f2d4a');
    const cMod = new THREE.Color('#383528');
    const cPolluted = new THREE.Color('#241515');

    const eClean = new THREE.Color('#10b981');
    const eMod = new THREE.Color('#eab308');
    const ePolluted = new THREE.Color('#ef4444');

    const resColor = cClean.clone().lerp(cMod, Math.min(factor * 2, 1)).lerp(cPolluted, Math.max(0, (factor - 0.5) * 2));
    const resEmissive = eClean.clone().lerp(eMod, Math.min(factor * 2, 1)).lerp(ePolluted, Math.max(0, (factor - 0.5) * 2));
    
    // Ambient background matching environment
    const bgClean = '#070b14';
    const bgPolluted = '#160a0a';
    const resBg = factor < 0.5 ? bgClean : bgPolluted;

    return { planetColor: resColor, emissiveColor: resEmissive, skyBg: resBg };
  }, [factor]);

  // Scaling trees and smokestacks dynamically
  const treeScale = useMemo(() => {
    return Math.max(0, 1 - factor * 1.5);
  }, [factor]);

  const smokestackScale = useMemo(() => {
    return Math.max(0, (factor - 0.25) * 1.33);
  }, [factor]);

  // Deterministic tree/smokestack locations
  const locations = useMemo(() => {
    return {
      trees: [
        [0.2, 0.4, 0.1],
        [-0.5, -0.2, 0.8],
        [0.8, -0.5, -0.3],
        [-0.3, 0.7, -0.5],
        [0.6, 0.3, 0.9],
        [-0.7, 0.5, 0.2]
      ],
      stacks: [
        [0.1, -0.6, 0.3],
        [-0.4, 0.3, -0.7],
        [0.5, 0.8, -0.2],
        [-0.8, -0.4, -0.3]
      ]
    };
  }, []);

  // Set particle positions
  const { positions, pColor } = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 1.8 + Math.random() * 1.2; // orbit distance
      pos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = dist * Math.cos(phi);
    }
    const color = factor < 0.4 ? '#34d399' : factor < 0.7 ? '#fbbf24' : '#ef4444';
    return { positions: pos, pColor: color };
  }, [factor]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Slow rotate globe
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.07;
    }

    // Spin particles
    if (particleGroupRef.current) {
      particleGroupRef.current.rotation.y = -t * 0.04;
      particleGroupRef.current.rotation.x = t * 0.02;
    }

    // Wobble orbit rings
    if (ringsRef.current) {
      ringsRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
      ringsRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={factor < 0.5 ? 0.6 : 0.4} />
      <directionalLight position={[8, 10, 8]} intensity={1.2} color={factor < 0.5 ? '#ffffff' : '#ffd5bb'} />
      <directionalLight position={[-8, -5, -8]} intensity={0.3} color={factor < 0.5 ? '#10b981' : '#ef4444'} />

      {/* Orbit Rings (Tech/Eco decoration) */}
      <group ref={ringsRef} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.9, 1.93, 64]} />
          <meshBasicMaterial color={emissiveColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 6, Math.PI / 4, 0]}>
          <ringGeometry args={[2.2, 2.22, 64]} />
          <meshBasicMaterial color={factor < 0.5 ? '#06b6d4' : '#f59e0b'} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Particles Atmosphere */}
      <group ref={particleGroupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color={pColor} size={0.06} transparent opacity={0.6} sizeAttenuation />
        </points>
      </group>

      {/* Rotating Globe Group */}
      <group ref={globeRef}>
        {/* Main Planet Sphere */}
        <mesh>
          <sphereGeometry args={[1.45, 32, 32]} />
          <meshStandardMaterial
            color={planetColor}
            emissive={emissiveColor}
            emissiveIntensity={0.25}
            roughness={0.7}
            metalness={0.3}
            flatShading
          />
        </mesh>

        {/* Wireframe overlay for high-tech premium look */}
        <mesh scale={1.005}>
          <sphereGeometry args={[1.45, 16, 16]} />
          <meshBasicMaterial
            color={emissiveColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Trees */}
        {locations.trees.map((rot, i) => (
          <GlobeTree key={`tree-${i}`} rotation={rot} scale={treeScale} />
        ))}

        {/* Smokestacks */}
        {locations.stacks.map((rot, i) => (
          <GlobeSmokestack key={`stack-${i}`} rotation={rot} scale={smokestackScale} />
        ))}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  );
}

// ─── CONTAINER COMPONENT ───────────────────────────────────────
export default function InteractiveEcoGlobe({ value = 3500 }) {
  return (
    <div className="w-full h-full min-h-[350px] relative select-none">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }}>
        <GlobeScene value={value} />
      </Canvas>

      {/* Futuristic overlay elements */}
      <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none bg-gradient-to-t from-emerald-500/5 via-transparent to-cyan-500/5" />
    </div>
  );
}
