import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── TEXTURE GENERATOR AND CACHE ───────────────────────────────
const emissiveTextureCache = {};

function getEmissiveTexture(glowColor) {
  if (emissiveTextureCache[glowColor]) return emissiveTextureCache[glowColor];

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep matte backdrop representing structural backing
  ctx.fillStyle = '#080c10';
  ctx.fillRect(0, 0, 128, 256);

  // High fidelity glowing windows
  ctx.fillStyle = glowColor;
  for (let y = 12; y < 240; y += 18) {
    for (let x = 12; x < 116; x += 22) {
      ctx.fillRect(x, y, 10, 12);
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
    <group position={position} rotation={[0.08, 0.3, 0]}>
      {/* Stand Support */}
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.04, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Photovoltaic Layer */}
      <mesh rotation={[-Math.PI / 6, 0, 0]} castShadow>
        <boxGeometry args={[0.22, 0.01, 0.14]} />
        <meshPhysicalMaterial 
          color="#0f172a" 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
    </group>
  );
}

// ─── WIND TURBINE ───────────────────────────────────────────────
function WindTurbine({ position }) {
  const rotorRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (rotorRef.current) {
      rotorRef.current.rotation.z = t * 2.5;
    }
  });

  return (
    <group position={position}>
      {/* Tapered Structural Mast */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.018, 0.4, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Generator Nacelle */}
      <group position={[0, 0.4, 0.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.018, 0.05, 12]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.5} />
        </mesh>
        {/* Spinner Hub and Blades */}
        <group ref={rotorRef} position={[0, 0, 0.03]}>
          <mesh castShadow>
            <sphereGeometry args={[0.016, 16, 16]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.2} />
          </mesh>
          {[0, 120, 240].map((deg, i) => (
            <group key={i} rotation={[0, 0, (deg * Math.PI) / 180]}>
              <mesh position={[0, 0.14, 0]} castShadow>
                <boxGeometry args={[0.012, 0.26, 0.003]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

// ─── WARNING BEACON ─────────────────────────────────────────────
function WarningBeacon({ position }) {
  const lightRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.material.emissiveIntensity = 2.0 + Math.sin(t * 10) * 1.5;
    }
  });

  return (
    <mesh position={position} ref={lightRef}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
    </mesh>
  );
}

// ─── BUILDING ───────────────────────────────────────────────────
function Building({ position, height, width, depth, score, index, onHover, onUnhover }) {
  const [hovered, setHovered] = useState(false);
  const style = useMemo(() => index % 3, [index]);

  const windowGlow = useMemo(() => {
    if (score < 2000) return '#a7f3d0'; // High efficiency vibrant emerald glow
    if (score < 3000) return '#fef08a'; // Muted classic amber
    if (score < 4000) return '#f97316'; // Dull warning orange
    return '#7f1d1d';                  // Burned out suffocated red
  }, [score]);

  const buildingColor = useMemo(() => {
    if (score < 2000) return '#475569'; // Pristine clean metallic steel
    if (score < 3000) return '#334155'; // Standard grey slate
    if (score < 4000) return '#1e293b'; // Grimy industrial composite
    return '#0f172a';                  // Carbon-stained deep carbon slate
  }, [score]);

  const emissiveTexture = useMemo(() => {
    const tex = getEmissiveTexture(windowGlow);
    const cloned = tex.clone();
    cloned.repeat.set(Math.max(1, Math.round(width * 3.5)), Math.max(1, Math.round(height * 2.5)));
    cloned.needsUpdate = true;
    return cloned;
  }, [windowGlow, width, height]);

  useEffect(() => {
    return () => {
      emissiveTexture.dispose();
    };
  }, [emissiveTexture]);

  // High structural glass PBR configurations
  const structuralMaterial = (
    <meshPhysicalMaterial
      color={buildingColor}
      roughness={score >= 3000 ? 0.6 : 0.15}
      metalness={score >= 3000 ? 0.3 : 0.85}
      clearcoat={hovered ? 1.0 : (score >= 3000 ? 0.1 : 1.0)}
      clearcoatRoughness={0.1}
      emissiveMap={emissiveTexture}
      emissive={new THREE.Color('#ffffff')}
      emissiveIntensity={hovered ? 2.8 : (score < 2000 ? 1.8 : score < 3000 ? 1.0 : 0.4)}
    />
  );

  const isClean = score < 2500;
  const isCritical = score > 3500;

  return (
    <group 
      position={position}
      scale={hovered ? [1.04, 1.04, 1.04] : [1, 1, 1]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        onHover();
      }}
      onPointerOut={(e) => {
        setHovered(false);
        document.body.style.cursor = 'auto';
        onUnhover();
      }}
    >
      {style === 0 && (
        <>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            {structuralMaterial}
          </mesh>
          {isClean && index % 4 === 0 && <WindTurbine position={[0, height, 0]} />}
          {isClean && index % 4 === 2 && (
            <>
              <SolarPanel position={[-width / 4, height, -depth / 4]} />
              <SolarPanel position={[width / 4, height, depth / 4]} />
            </>
          )}
          {isCritical && index % 3 === 0 && height > 2.0 && (
            <WarningBeacon position={[0, height + 0.04, 0]} />
          )}
        </>
      )}

      {style === 1 && (
        <>
          {/* Base Mass */}
          <mesh position={[0, (height * 0.5) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.5, depth]} />
            {structuralMaterial}
          </mesh>
          {/* Inset Tier Block */}
          <mesh position={[0, height * 0.5 + (height * 0.5) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.78, height * 0.5, depth * 0.78]} />
            {structuralMaterial}
          </mesh>
          {isClean && index % 3 === 0 && <WindTurbine position={[0, height, 0]} />}
          {isCritical && index % 2 === 0 && height > 1.8 && (
            <WarningBeacon position={[0, height + 0.04, 0]} />
          )}
        </>
      )}

      {style === 2 && (
        <>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            {structuralMaterial}
          </mesh>
          {/* Obelisk/Pyramid Cap Spire */}
          <mesh position={[0, height + 0.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[width * 0.62, 0.3, 4]} />
            <meshStandardMaterial color={buildingColor} roughness={0.3} metalness={0.6} />
          </mesh>
          {isCritical && height > 2.0 && (
            <WarningBeacon position={[0, height + 0.3, 0]} />
          )}
        </>
      )}
    </group>
  );
}

// ─── HIGH FI BIOMASS TREE ───────────────────────────────────────
function HighFiTree({ position }) {
  return (
    <group position={position}>
      {/* Solid Trunk */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.035, 0.24, 8]} />
        <meshStandardMaterial color="#2d1a10" roughness={0.95} />
      </mesh>
      {/* Multi-layered Canopy Shading */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.16, 0.32, 10]} />
        <meshPhysicalMaterial color="#065f46" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <coneGeometry args={[0.12, 0.22, 10]} />
        <meshPhysicalMaterial color="#059669" roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}

// ─── EXTENDED SMOG VELOCITY SYSTEM ──────────────────────────────
function SmogParticles({ score }) {
  const particlesRef = useRef();
  const density = useMemo(() => {
    if (score < 2000) return 0;
    if (score < 3000) return 30;
    if (score < 4000) return 85;
    return 180;
  }, [score]);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(density * 3);
    const scl = new Float32Array(density);
    for (let i = 0; i < density; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 4 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      scl[i] = 0.1 + Math.random() * 0.25;
    }
    return [pos, scl];
  }, [density]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!particlesRef.current || density === 0) return;
    const arr = particlesRef.current.geometry.attributes.position.array;
    for (let i = 0; i < density; i++) {
      arr[i * 3 + 1] += 0.004; // Drifting pace upward
      arr[i * 3] += Math.sin(t * 0.5 + i) * 0.002;
      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = 0.5;
        arr[i * 3] = (Math.random() - 0.5) * 16;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
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
      <pointsMaterial 
        color={score > 4000 ? '#451a03' : '#64748b'} 
        size={0.28} 
        transparent 
        opacity={score > 4000 ? 0.45 : 0.25} 
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// ─── DEFAULT USERS FALLBACK ─────────────────────────────────────
const DEFAULT_USERS = [
  { name: 'Maya Green', currentScore: 1650 },
  { name: 'Alex Chen', currentScore: 5200 },
  { name: 'Priya Sharma', currentScore: 3400 },
  { name: 'Lars Johansson', currentScore: 4600 },
  { name: 'Emma Wilson', currentScore: 2900 },
  { name: 'Demo User', currentScore: 4800 },
];

// ─── CITY SCENE LAYOUT ──────────────────────────────────────────
function CityScene({ communityScore = 3500, users = [] }) {
  const groupRef = useRef();
  const [hoveredBuilding, setHoveredBuilding] = useState(null);

  const buildings = useMemo(() => {
    const activeUsers = users && users.length > 0 ? users : DEFAULT_USERS;
    const result = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(555);

    activeUsers.forEach((user, i) => {
      // Golden ratio spiral distribution for realistic deterministic city layout
      const angle = i * 2.39996323 + rand() * 0.2;
      const maxUsers = Math.max(activeUsers.length, 12);
      const dist = 2.2 + (i / maxUsers) * 5.8 + rand() * 0.4;
      
      let x = Math.cos(angle) * dist;
      let z = Math.sin(angle) * dist;

      // Adjust slightly if it falls on the X or Z road axes
      if (Math.abs(x) < 0.35) x += x >= 0 ? 0.3 : -0.3;
      if (Math.abs(z) < 0.35) z += z >= 0 ? 0.3 : -0.3;

      const score = user.currentScore || 2000;
      // Map user score to height range [0.8, 5.5]
      const height = Math.max(0.8, Math.min(5.5, score * 0.00075 + 0.2));
      const width = 0.5 + rand() * 0.3;
      const depth = 0.5 + rand() * 0.3;

      result.push({
        position: [x, 0, z],
        height,
        width,
        depth,
        score,
        name: user.name || 'Anonymous User',
        id: user.id || `user-${i}`
      });
    });

    return result;
  }, [users]);

  const trees = useMemo(() => {
    const treeCount = communityScore < 2000 ? 35 : communityScore < 3000 ? 20 : communityScore < 4000 ? 8 : 1;
    const result = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(888);

    for (let i = 0; i < treeCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 1.5 + rand() * 6.5;
      result.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist]);
    }
    return result;
  }, [communityScore]);

  // Color theme logic mapping to metrics
  const themes = useMemo(() => {
    if (communityScore < 2000) return { sky: '#020617', sun: '#f0fdf4', floor: '#064e3b', line: '#10b981', ringOpacity: 0.15 };
    if (communityScore < 3000) return { sky: '#0f172a', sun: '#fef9c3', floor: '#1e293b', line: '#eab308', ringOpacity: 0.08 };
    if (communityScore < 4000) return { sky: '#1c1917', sun: '#ffedd5', floor: '#1c1917', line: '#f97316', ringOpacity: 0.05 };
    return { sky: '#180505', sun: '#fecdd3', floor: '#0f0505', line: '#ef4444', ringOpacity: 0.1 };
  }, [communityScore]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.015;
    }
  });

  return (
    <>
      <color attach="background" args={[themes.sky]} />
      <fog attach="fog" args={[themes.sky, 8, 18]} />

      {/* Atmospheric Soft Lighting setup */}
      <ambientLight intensity={communityScore < 3000 ? 0.5 : 0.35} />
      <directionalLight 
        position={[12, 18, 8]} 
        intensity={1.6} 
        color={themes.sun} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-10, 6, -10]} intensity={0.4} color={communityScore < 3000 ? '#38bdf8' : '#7f1d1d'} />

      <group ref={groupRef}>
        {/* Ground Platform Base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[9.5, 48]} />
          <meshPhysicalMaterial 
            color={themes.floor} 
            roughness={0.7} 
            metalness={0.4}
            clearcoat={0.2} 
          />
        </mesh>

        {/* Structural Engineering Ground Grid Map */}
        <gridHelper args={[20, 40, themes.line, '#334155']} position={[0, 0.002, 0]} opacity={themes.ringOpacity} transparent />

        {/* Roads Axis Infrastructure */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
          <planeGeometry args={[0.4, 19]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0.005, 0]} receiveShadow>
          <planeGeometry args={[0.4, 19]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
        </mesh>

        {/* Dynamic Architectural Models mapping loop */}
        {buildings.map((b, i) => (
          <Building
            key={`build-${b.id}`}
            index={i}
            position={b.position}
            height={b.height}
            width={b.width}
            depth={b.depth}
            score={b.score}
            onHover={() => setHoveredBuilding(b)}
            onUnhover={() => setHoveredBuilding(curr => curr?.id === b.id ? null : curr)}
          />
        ))}

        {/* Organic Ecosystem Scatter mapping */}
        {trees.map((pos, i) => (
          <HighFiTree key={`tree-${i}`} position={pos} />
        ))}

        {/* Sparkles / Ambient Flair when metrics are optimized */}
        {communityScore < 2000 && (
          <Sparkles count={50} scale={12} size={2.0} speed={0.3} color="#34d399" />
        )}

        {/* Particulate Matter / Smog Layers */}
        <SmogParticles score={communityScore} />

        {/* Industrial Atmospheric Blanket Overlays */}
        {communityScore > 3000 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.2, 0]}>
            <planeGeometry args={[22, 22]} />
            <meshPhysicalMaterial
              color={communityScore > 4000 ? '#2d0f0f' : '#292524'}
              transparent
              opacity={communityScore > 4000 ? 0.4 : 0.2}
              transmission={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Floating Glassmorphic Tooltip */}
        {hoveredBuilding && (
          <Html
            position={[
              hoveredBuilding.position[0],
              hoveredBuilding.height + 0.6,
              hoveredBuilding.position[2]
            ]}
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <div className="w-56 p-3 rounded-xl border border-white/10 bg-slate-950/85 backdrop-blur-md shadow-2xl text-left select-none relative flex flex-col gap-1.5 font-sans">
              {/* Arrow pointer */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950/85 border-r border-b border-white/10 rotate-45" />
              
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider truncate">
                  {hoveredBuilding.name}
                </p>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  hoveredBuilding.score < 2000
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : hoveredBuilding.score < 3000
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : hoveredBuilding.score < 4000
                    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {hoveredBuilding.score < 2000 ? 'Eco Hero' : hoveredBuilding.score < 3000 ? 'Moderate' : hoveredBuilding.score < 4000 ? 'Warning' : 'Critical'}
                </span>
              </div>
              
              <div className="mt-0.5">
                <p className="text-[10px] text-slate-400 font-medium">Carbon Footprint</p>
                <p className={`text-base font-extrabold tracking-tight mt-0.5 ${
                  hoveredBuilding.score < 2000
                    ? 'text-emerald-400'
                    : hoveredBuilding.score < 3000
                    ? 'text-amber-400'
                    : hoveredBuilding.score < 4000
                    ? 'text-orange-400'
                    : 'text-red-400'
                }`}>
                  {hoveredBuilding.score.toLocaleString()} <span className="text-xs font-medium text-slate-400">kg/yr</span>
                </p>
              </div>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// ─── CORE WRAPPER LAYER ENTRYPOINT ──────────────────────────────
export default function CarbonCity({ communityScore = 2200, users = [] }) {
  const controlsRef = useRef();

  return (
    <div className="w-full h-full min-h-[450px] rounded-2xl overflow-hidden relative bg-slate-950 shadow-2xl">
      <Canvas 
        camera={{ position: [10, 7, 10], fov: 42 }} 
        shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <CityScene communityScore={communityScore} users={users} />
        
        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.7}
          scale={18}
          blur={2.5}
          far={1.5}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={6}
          maxDistance={16}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
          makeDefault
        />
      </Canvas>
    </div>
  );
}