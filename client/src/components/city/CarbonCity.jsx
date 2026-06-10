import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ─── TEXTURE GENERATOR AND CACHE ───────────────────────────────
const emissiveTextureCache = {};

function getEmissiveTexture(glowColor) {
  if (emissiveTextureCache[glowColor]) return emissiveTextureCache[glowColor];

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Black background = no emission
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 64, 128);

  // Glowing window columns
  ctx.fillStyle = glowColor;
  for (let y = 8; y < 120; y += 12) {
    for (let x = 6; x < 58; x += 14) {
      ctx.fillRect(x, y, 6, 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  emissiveTextureCache[glowColor] = texture;
  return texture;
}

// ─── SOLAR PANEL ────────────────────────────────────────────────
function SolarPanel({ position }) {
  return (
    <group position={position} rotation={[0.1, 0.4, 0]}>
      {/* Stand */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[0.01, 0.03, 0.03]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Panel */}
      <mesh rotation={[-Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.14, 0.008, 0.08]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} emissive="#0d1527" />
      </mesh>
    </group>
  );
}

// ─── WIND TURBINE ───────────────────────────────────────────────
function WindTurbine({ position }) {
  const rotorRef = useRef();

  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    if (rotorRef.current) {
      rotorRef.current.rotation.z = timer.current.getElapsed() * 3.0;
    }
  });

  return (
    <group position={position}>
      {/* Mast */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.016, 0.3, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Rotor */}
      <group position={[0, 0.3, 0.015]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.015, 0.03, 6]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} />
        </mesh>
        <group ref={rotorRef}>
          {/* Blades */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.01, 0.2, 0.004]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <group rotation={[0, 0, (2 * Math.PI) / 3]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.01, 0.2, 0.004]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
            </mesh>
          </group>
          <group rotation={[0, 0, -(2 * Math.PI) / 3]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.01, 0.2, 0.004]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// ─── WARNING BEACON ─────────────────────────────────────────────
function WarningBeacon({ position }) {
  const lightRef = useRef();

  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    if (lightRef.current) {
      lightRef.current.intensity = 0.3 + Math.sin(timer.current.getElapsed() * 8) * 0.7;
    }
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial ref={lightRef} color="#ef4444" />
    </mesh>
  );
}

// ─── BUILDING ───────────────────────────────────────────────────
function Building({ position, height, width, depth, score, index }) {
  const style = useMemo(() => index % 3, [index]);

  const windowGlow = useMemo(() => {
    if (score < 2000) return '#88ddff';
    if (score < 3000) return '#cccc88';
    if (score < 4000) return '#aa8855';
    return '#553322';
  }, [score]);

  const buildingColor = useMemo(() => {
    if (score < 2000) return '#94a3b8'; // Slate
    if (score < 3000) return '#64748b'; // Muted Slate
    if (score < 4000) return '#475569'; // Grey
    return '#334155';                   // Dark Grey
  }, [score]);

  const emissiveTexture = useMemo(() => {
    const tex = getEmissiveTexture(windowGlow);
    const cloned = tex.clone();
    cloned.repeat.set(Math.max(1, Math.round(width * 2.5)), Math.max(1, Math.round(height * 2.0)));
    cloned.needsUpdate = true;
    return cloned;
  }, [windowGlow, width, height]);

  const isClean = score < 2500;
  const isCritical = score > 4000;

  return (
    <group position={position}>
      {style === 0 && (
        // Standard Building
        <>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={buildingColor}
              roughness={0.25}
              metalness={0.4}
              emissiveMap={emissiveTexture}
              emissive="#ffffff"
              emissiveIntensity={1.2}
            />
          </mesh>
          {isClean && index % 4 === 0 && <WindTurbine position={[0, height, 0]} />}
          {isClean && index % 4 === 2 && (
            <>
              <SolarPanel position={[-width / 4, height, -depth / 4]} />
              <SolarPanel position={[width / 4, height, depth / 4]} />
            </>
          )}
          {isCritical && index % 3 === 0 && height > 2.0 && (
            <WarningBeacon position={[0, height + 0.05, 0]} />
          )}
        </>
      )}

      {style === 1 && (
        // Stepped Building
        <>
          {/* Base */}
          <mesh position={[0, (height * 0.45) / 2, 0]}>
            <boxGeometry args={[width, height * 0.45, depth]} />
            <meshStandardMaterial
              color={buildingColor}
              roughness={0.25}
              metalness={0.4}
              emissiveMap={emissiveTexture}
              emissive="#ffffff"
              emissiveIntensity={1.2}
            />
          </mesh>
          {/* Tower */}
          <mesh position={[0, height * 0.45 + (height * 0.55) / 2, 0]}>
            <boxGeometry args={[width * 0.75, height * 0.55, depth * 0.75]} />
            <meshStandardMaterial
              color={buildingColor}
              roughness={0.25}
              metalness={0.4}
              emissiveMap={emissiveTexture}
              emissive="#ffffff"
              emissiveIntensity={1.2}
            />
          </mesh>
          {isClean && index % 4 === 0 && <WindTurbine position={[0, height, 0]} />}
          {isCritical && index % 3 === 0 && height > 2.0 && (
            <WarningBeacon position={[0, height + 0.05, 0]} />
          )}
        </>
      )}

      {style === 2 && (
        // Pyramid Peak
        <>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={buildingColor}
              roughness={0.25}
              metalness={0.4}
              emissiveMap={emissiveTexture}
              emissive="#ffffff"
              emissiveIntensity={1.2}
            />
          </mesh>
          {/* Roof cone */}
          <mesh position={[0, height + 0.12, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[width * 0.58, 0.24, 4]} />
            <meshStandardMaterial color={buildingColor} roughness={0.4} metalness={0.2} />
          </mesh>
          {isCritical && index % 3 === 0 && height > 2.0 && (
            <WarningBeacon position={[0, height + 0.24, 0]} />
          )}
        </>
      )}
    </group>
  );
}

// ─── TREE ───────────────────────────────────────────────────────
function Tree({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.3, 5]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Canopy Layers */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.18, 0.4, 5]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.14, 0.28, 5]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// ─── SMOG PARTICLES ─────────────────────────────────────────────
function SmogParticles({ score }) {
  const particlesRef = useRef();
  const density = useMemo(() => {
    if (score < 2000) return 0;
    if (score < 3000) return 25;
    if (score < 4000) return 70;
    return 130;
  }, [score]);

  const positions = useMemo(() => {
    const pos = new Float32Array(density * 3);
    for (let i = 0; i < density; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = Math.random() * 5 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return pos;
  }, [density]);

  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    if (!particlesRef.current || density === 0) return;
    const t = timer.current.getElapsed();
    const arr = particlesRef.current.geometry.attributes.position.array;
    for (let i = 0; i < density; i++) {
      arr[i * 3 + 1] += 0.003;
      arr[i * 3] += Math.sin(t + i) * 0.001;
      if (arr[i * 3 + 1] > 6) {
        arr[i * 3 + 1] = 1;
        arr[i * 3] = (Math.random() - 0.5) * 18;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (density === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry key={density}>
        <bufferAttribute attach="attributes-position" count={density} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#94a3b8" size={0.16} transparent opacity={0.3} sizeAttenuation />
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
      const dist = 2.2 + rand() * 5.8;
      result.push({
        position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        height: 1.2 + rand() * 3.6,
        width: 0.45 + rand() * 0.7,
        depth: 0.45 + rand() * 0.7,
      });
    }
    return result;
  }, []);

  // Trees — count based on score
  const trees = useMemo(() => {
    const treeCount = communityScore < 2000 ? 30 : communityScore < 3000 ? 18 : communityScore < 4000 ? 6 : 1;
    const result = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(123);

    for (let i = 0; i < treeCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 1.6 + rand() * 6.5;
      result.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist]);
    }
    return result;
  }, [communityScore]);

  // Premium, deep sky colors
  const skyColor = useMemo(() => {
    if (communityScore < 2000) return '#090e18';    // Clean deep indigo
    if (communityScore < 3000) return '#1b202a';    // Modest gray-navy
    if (communityScore < 4000) return '#29221b';    // Smoggy dark brown
    return '#1a0d0d';                               // Toxic deep charcoal red
  }, [communityScore]);

  const sunColor = useMemo(() => {
    if (communityScore < 2000) return '#e0f2fe';
    if (communityScore < 3000) return '#fef08a';
    return '#f87171';
  }, [communityScore]);

  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    if (groupRef.current) {
      groupRef.current.rotation.y = timer.current.getElapsed() * 0.02;
    }
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 7, 20]} />

      <ambientLight intensity={communityScore < 3000 ? 0.6 : 0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color={sunColor} />
      <directionalLight position={[-8, 8, -8]} intensity={0.25} color={communityScore < 3000 ? '#38bdf8' : '#ef4444'} />

      <group ref={groupRef}>
        {/* Ground circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[10, 32]} />
          <meshStandardMaterial
            color={communityScore < 2500 ? '#142015' : '#141416'}
            roughness={0.95}
            metalness={0.05}
          />
        </mesh>

        {/* High tech wireframe grid on the ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <circleGeometry args={[10, 16]} />
          <meshBasicMaterial
            color={communityScore < 2500 ? '#10b981' : communityScore < 4000 ? '#fbbf24' : '#ef4444'}
            wireframe
            transparent
            opacity={0.06}
          />
        </mesh>

        {/* Roads */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.3, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.3, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>

        {/* Buildings */}
        {buildings.map((b, i) => (
          <Building
            key={i}
            index={i}
            position={b.position}
            height={b.height}
            width={b.width}
            depth={b.depth}
            score={communityScore}
          />
        ))}

        {/* Trees */}
        {trees.map((pos, i) => (
          <Tree key={i} position={pos} />
        ))}

        {/* Smog Particles */}
        <SmogParticles score={communityScore} />

        {/* Smog Plane Layer */}
        {communityScore > 3000 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.5, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshBasicMaterial
              color={communityScore > 4000 ? '#3f1f1f' : '#3f3525'}
              transparent
              opacity={communityScore > 4000 ? 0.3 : 0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function CarbonCity({ communityScore = 3500 }) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas camera={{ position: [8, 5, 8], fov: 48 }} shadows>
        <CityScene communityScore={communityScore} />
      </Canvas>
    </div>
  );
}

