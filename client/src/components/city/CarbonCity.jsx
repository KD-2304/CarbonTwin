import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ─── BUILDING ───────────────────────────────────────────────────
function Building({ position, height, width, depth, score }) {
  const meshRef = useRef();
  const windowGlow = useMemo(() => {
    if (score < 2000) return '#88ddff';
    if (score < 3000) return '#cccc88';
    if (score < 4000) return '#aa8855';
    return '#553322';
  }, [score]);

  const buildingColor = useMemo(() => {
    if (score < 2000) return '#c8d8e8';
    if (score < 3000) return '#aab8c0';
    if (score < 4000) return '#808080';
    return '#404040';
  }, [score]);

  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, height / 2, 0]} ref={meshRef}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={buildingColor} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Window strips */}
      {Array.from({ length: Math.floor(height / 0.6) }).map((_, i) => (
        <mesh key={i} position={[width / 2 + 0.01, 0.4 + i * 0.6, 0]}>
          <planeGeometry args={[0.02, 0.2]} />
          <meshBasicMaterial color={windowGlow} transparent opacity={0.8} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(height / 0.6) }).map((_, i) => (
        <mesh key={`b${i}`} position={[-width / 2 - 0.01, 0.4 + i * 0.6, 0]}>
          <planeGeometry args={[0.02, 0.2]} />
          <meshBasicMaterial color={windowGlow} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── TREE ───────────────────────────────────────────────────────
function Tree({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.2, 0.5, 6]} />
        <meshStandardMaterial color="#228b22" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <coneGeometry args={[0.15, 0.35, 6]} />
        <meshStandardMaterial color="#2d9b2d" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── SMOG PARTICLES ─────────────────────────────────────────────
function SmogParticles({ score }) {
  const particlesRef = useRef();
  const density = useMemo(() => {
    if (score < 2000) return 0;
    if (score < 3000) return 30;
    if (score < 4000) return 80;
    return 150;
  }, [score]);

  const positions = useMemo(() => {
    const pos = new Float32Array(density * 3);
    for (let i = 0; i < density; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 6 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [density]);

  useFrame((state) => {
    if (!particlesRef.current || density === 0) return;
    const arr = particlesRef.current.geometry.attributes.position.array;
    for (let i = 0; i < density; i++) {
      arr[i * 3 + 1] += 0.003;
      arr[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      if (arr[i * 3 + 1] > 8) {
        arr[i * 3 + 1] = 1;
        arr[i * 3] = (Math.random() - 0.5) * 20;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (density === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={density} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#888888" size={0.15} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// ─── CITY SCENE ─────────────────────────────────────────────────
function CityScene({ communityScore = 3500 }) {
  const groupRef = useRef();

  // Generate building positions deterministically
  const buildings = useMemo(() => {
    const result = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + rand() * 0.5;
      const dist = 2 + rand() * 6;
      result.push({
        position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        height: 1 + rand() * 4,
        width: 0.4 + rand() * 0.8,
        depth: 0.4 + rand() * 0.8,
      });
    }
    return result;
  }, []);

  // Trees — count based on score
  const trees = useMemo(() => {
    const treeCount = communityScore < 2000 ? 25 : communityScore < 3000 ? 15 : communityScore < 4000 ? 5 : 1;
    const result = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(123);

    for (let i = 0; i < treeCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 1.5 + rand() * 7;
      result.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist]);
    }
    return result;
  }, [communityScore]);

  // Sky color
  const skyColor = useMemo(() => {
    if (communityScore < 2000) return '#1a3a5c';
    if (communityScore < 3000) return '#3a3a3c';
    if (communityScore < 4000) return '#4a3a2a';
    return '#3a1a1a';
  }, [communityScore]);

  const sunColor = useMemo(() => {
    if (communityScore < 2000) return '#ffffff';
    if (communityScore < 3000) return '#ffee88';
    return '#ffaa44';
  }, [communityScore]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 8, 25]} />

      <ambientLight intensity={communityScore < 3000 ? 0.5 : 0.3} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} color={sunColor} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.2} color="#8888cc" />

      <group ref={groupRef}>
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color={communityScore < 2500 ? '#1a2818' : '#1a1a18'} roughness={1} />
        </mesh>

        {/* Roads (cross pattern) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.5, 24]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.5, 24]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>

        {/* Buildings */}
        {buildings.map((b, i) => (
          <Building key={i} position={b.position} height={b.height} width={b.width} depth={b.depth} score={communityScore} />
        ))}

        {/* Trees */}
        {trees.map((pos, i) => <Tree key={i} position={pos} />)}

        {/* Smog */}
        <SmogParticles score={communityScore} />

        {/* Smog layer plane */}
        {communityScore > 3000 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
            <planeGeometry args={[25, 25]} />
            <meshBasicMaterial
              color={communityScore > 4000 ? '#553322' : '#777766'}
              transparent
              opacity={communityScore > 4000 ? 0.25 : 0.12}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={18}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function CarbonCity({ communityScore = 3500 }) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas camera={{ position: [8, 6, 8], fov: 50 }} shadows>
        <CityScene communityScore={communityScore} />
      </Canvas>
    </div>
  );
}
