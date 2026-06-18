import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { getAvatarHSL } from '../../utils/scoreCalculator';

// ─── TIER CONFIGURATION METRICS ─────────────────────────────────
const TIER_THEMES = {
  PRISTINE: { label: 'PRISTINE', color: '#10b981', sky: '#022c22', ground: '#064e3b', glow: '#34d399', metalness: 0.9, roughness: 0.1, clearcoat: 1.0 },
  MODERATE: { label: 'MODERATE', color: '#fbbf24', sky: '#1e1b4b', ground: '#1f2937', glow: '#fbbf24', metalness: 0.6, roughness: 0.3, clearcoat: 0.5 },
  WARNING:  { label: 'WARNING',  color: '#f97316', sky: '#2d1a10', ground: '#1c1917', glow: '#ea580c', metalness: 0.4, roughness: 0.6, clearcoat: 0.1 },
  CRITICAL: { label: 'CRITICAL', color: '#ef4444', sky: '#1a0505', ground: '#111111', glow: '#dc2626', metalness: 0.1, roughness: 0.9, clearcoat: 0.0 }
};

function createSeededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getTierTheme(score) {
  if (score < 2000) return TIER_THEMES.PRISTINE;
  if (score < 3000) return TIER_THEMES.MODERATE;
  if (score < 4000) return TIER_THEMES.WARNING;
  return TIER_THEMES.CRITICAL;
}

// ─── HIGH-REALISM CELESTIAL BODY ────────────────────────────────
function CelestialBody({ score }) {
  const ref = useRef();
  const theme = getTierTheme(score);
  const isPristine = score < 2000;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = 3.8 + Math.sin(t * 0.5) * 0.1;
      ref.current.rotation.y = t * 0.1;
    }
  });

  return (
    <group ref={ref} position={[-3.5, 3.8, -4.5]}>
      {/* Core Glowing Orb */}
      <mesh castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={theme.glow}
          emissive={theme.glow}
          emissiveIntensity={isPristine ? 2.5 : 0.5}
          roughness={0.1}
        />
      </mesh>
      {/* Volumetric Atmospheric Atmosphere Layer */}
      <mesh scale={1.3}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial
          color={theme.glow}
          transparent
          opacity={0.15}
          transmission={0.6}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── CRACKED OR ORGANIC SURFACE TRAILS ──────────────────────────
function GroundCracks({ score }) {
  const visible = score >= 3000;
  const intensity = Math.min(1, (score - 3000) / 1500);

  const crackSegments = useMemo(() => {
    if (!visible) return [];
    const segments = [];
    const count = 12 + Math.floor(intensity * 10);
    const rand = createSeededRandom(3000 + Math.round(score));
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.4;
      const radiusInner = 0.3 + rand() * 0.3;
      const radiusOuter = 1.2 + rand() * 0.8 * intensity;
      
      const x1 = Math.cos(angle) * radiusInner;
      const z1 = Math.sin(angle) * radiusInner;
      const x2 = Math.cos(angle + (rand() - 0.5) * 0.2) * radiusOuter;
      const z2 = Math.sin(angle + (rand() - 0.5) * 0.2) * radiusOuter;
      
      segments.push(new THREE.Vector3(x1, 0.002, z1), new THREE.Vector3(x2, 0.002, z2));
    }
    return segments;
  }, [visible, intensity, score]);

  if (!visible || crackSegments.length === 0) return null;

  return (
    <group position={[0, -0.59, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={crackSegments.length}
            array={new Float32Array(crackSegments.flatMap(v => [v.x, v.y, v.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={score >= 4000 ? '#ef4444' : '#ea580c'}
          linewidth={2} // Note: WebGL implementation dependent
          transparent
          opacity={0.6 + intensity * 0.4}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// ─── DETAILED POLISHED TREES ────────────────────────────────────
function HighFiTree({ position, scale = 1, wilting = false }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const sway = wilting ? 0.08 : 0.03;
    const freq = wilting ? 1.5 : 0.8;
    ref.current.rotation.z = Math.sin(t * freq) * sway + (wilting ? 0.12 : 0);
    ref.current.rotation.x = Math.cos(t * freq * 0.9) * sway;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Trunk with better shading geometry */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.4, 12]} />
        <meshStandardMaterial 
          color={wilting ? '#451a03' : '#27160c'} 
          roughness={0.9} 
          metalness={0.1}
        />
      </mesh>
      {/* Layered Foliage using Physical Materials */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[0.16, 0.35, 16]} />
        <meshPhysicalMaterial
          color={wilting ? '#1e293b' : '#047857'}
          roughness={0.6}
          flatShading={wilting}
          clearcoat={wilting ? 0 : 0.2}
        />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.12, 0.25, 16]} />
        <meshPhysicalMaterial
          color={wilting ? '#334155' : '#10b981'}
          roughness={0.5}
          flatShading={wilting}
        />
      </mesh>
    </group>
  );
}

// ─── REALISTIC SMOKESTACK & DYNAMIC SMOKE PARTICLES ─────────────
function Smokestack({ position }) {
  const smokeRef = useRef();
  const particleCount = 30;

  const [positions, velocities] = useMemo(() => {
    const rand = createSeededRandom(
      Math.round((position[0] + 10) * 1000)
      + Math.round((position[1] + 10) * 100)
      + Math.round((position[2] + 10) * 10)
    );
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0] + (rand() - 0.5) * 0.02;
      pos[i * 3 + 1] = position[1] + 0.5 + (rand() * 0.5);
      pos[i * 3 + 2] = position[2] + (rand() - 0.5) * 0.02;
      
      vel[i * 3] = (rand() - 0.5) * 0.01;
      vel[i * 3 + 1] = 0.015 + rand() * 0.015;
      vel[i * 3 + 2] = (rand() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, [particleCount, position]);

  useFrame(() => {
    if (!smokeRef.current) return;
    const geoPos = smokeRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      geoPos[i * 3] += velocities[i * 3];
      geoPos[i * 3 + 1] += velocities[i * 3 + 1];
      geoPos[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Expand puff sizes relative to upward drift
      if (geoPos[i * 3 + 1] > position[1] + 2.0) {
        geoPos[i * 3] = position[0] + (Math.random() - 0.5) * 0.02;
        geoPos[i * 3 + 1] = position[1] + 0.5;
        geoPos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.02;
      }
    }
    smokeRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Industrial Metallic Stack */}
      <mesh position={[position[0], position[1] + 0.25, position[2]]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[position[0], position[1] + 0.5, position[2]]}>
        <torusGeometry args={[0.04, 0.01, 8, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#1f2937" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Volumetric Smoke Particles */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#4b5563" size={0.15} transparent opacity={0.3} blending={THREE.NormalBlending} />
      </points>
    </group>
  );
}

// ─── HIGH-REALISM PBR SCI-FI AVATAR BODY ───────────────────────
function AvatarBody({ score, animating }) {
  const groupRef = useRef();
  const { h, s, l } = useMemo(() => getAvatarHSL(score), [score]);
  
  const theme = getTierTheme(score);
  const baseColor = useMemo(() => new THREE.Color().setHSL(h, s, l), [h, s, l]);
  const emissiveColor = useMemo(() => new THREE.Color().setHSL(h, s, Math.min(1, l + 0.3)), [h, s, l]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(t * 1.5) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.05;
    }
  });

  // Physically Based Architectural Material Settings for Chassis Realism
  const armorMaterialProps = {
    color: baseColor,
    metalness: theme.metalness,
    roughness: theme.roughness,
    clearcoat: theme.clearcoat,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5
  };

  return (
    <group ref={groupRef}>
      {/* Head Capsule */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>

      {/* Cybernetic High-Glow Visor */}
      <mesh position={[0, 1.63, 0.14]}>
        <boxGeometry args={[0.3, 0.06, 0.16]} />
        <meshPhysicalMaterial
          color="#090d16"
          emissive={emissiveColor}
          emissiveIntensity={animating ? 4.0 : 2.0}
          roughness={0.05}
          metalness={0.95}
        />
      </mesh>

      {/* Torso Shell Assembly */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.6, 0.28]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>

      {/* Power Core Conduit (Chest Center) */}
      <mesh position={[0, 1.05, 0.15]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={3} />
      </mesh>

      {/* Articulated Limbs Setup */}
      {/* Left Arm */}
      <mesh position={[-0.36, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[-0.4, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.4, 16]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.36, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0.4, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.4, 16]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>

      {/* Kinetic Propulsion Thrusters / Legs Assembly */}
      <mesh position={[-0.14, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.5, 16]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>
      <mesh position={[0.14, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.5, 16]} />
        <meshPhysicalMaterial {...armorMaterialProps} />
      </mesh>
    </group>
  );
}

// ─── GLASS CRYSTALLINE AURA SHELL ───────────────────────────────
function HighRealismAura({ score }) {
  const auraRef = useRef();
  const theme = getTierTheme(score);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (auraRef.current) {
      const pulse = 1.45 + Math.sin(t * (score >= 4000 ? 4 : 1.5)) * 0.04;
      auraRef.current.scale.setScalar(pulse);
      auraRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <mesh ref={auraRef} position={[0, 0.5, 0]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshPhysicalMaterial
        color={theme.glow}
        transparent
        opacity={score >= 4000 ? 0.25 : 0.12}
        roughness={0.1}
        transmission={0.9} // Glass structural refraction look
        thickness={0.5}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── PROCEDURAL ECOSYSTEM LAYOUT MANAGER ────────────────────────
function EcosystemManager({ score }) {
  const isPristine = score < 2000;
  const isModerate = score >= 2000 && score < 3000;
  const isWarning = score >= 3000 && score < 4000;

  if (score >= 4000) {
    // Critical Tier Industry Wasteland Landscape
    return (
      <>
        <Smokestack position={[1.2, -0.6, -0.5]} />
        <Smokestack position={[-1.3, -0.6, -0.8]} />
        <Smokestack position={[0.9, -0.6, 1.0]} />
        <Smokestack position={[-1.1, -0.6, 0.7]} />
      </>
    );
  }

  return (
    <>
      {isPristine && (
        <>
          <HighFiTree position={[-1.2, -0.6, -0.5]} scale={1.1} />
          <HighFiTree position={[1.3, -0.6, -0.3]} scale={0.95} />
          <HighFiTree position={[-0.8, -0.6, 0.8]} scale={1.0} />
          <HighFiTree position={[1.0, -0.6, 0.9]} scale={1.05} />
          <HighFiTree position={[-1.5, -0.6, 0.2]} scale={0.85} />
          <Sparkles count={40} scale={2.5} size={2.5} speed={0.4} color="#34d399" />
        </>
      )}
      {isModerate && (
        <>
          <HighFiTree position={[-1.1, -0.6, -0.4]} scale={0.9} />
          <HighFiTree position={[1.1, -0.6, 0.5]} scale={0.85} />
          <Sparkles count={15} scale={2.5} size={1.5} speed={0.2} color="#fbbf24" />
        </>
      )}
      {isWarning && (
        <>
          <HighFiTree position={[-1.0, -0.6, 0.4]} scale={0.85} wilting />
          <Smokestack position={[1.2, -0.6, -0.4]} />
          <Smokestack position={[-1.3, -0.6, -0.6]} />
        </>
      )}
    </>
  );
}

// ─── CINEMATIC 3D GRID & LIGHT ENVIRONMENT ─────────────────────
function EnvironmentStage({ score }) {
  const theme = getTierTheme(score);

  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, 4.5, 11]} />
      
      {/* Primary Key light with High Res Shadows */}
      <directionalLight
        position={[4, 7, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      {/* Mood Rim Lighting fill */}
      <directionalLight position={[-4, 3, -4]} intensity={0.6} color={theme.glow} />
      <ambientLight intensity={0.4} />

      {/* Highly Textured Metallic/Glossy Floor Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <circleGeometry args={[2.5, 48]} />
        <meshPhysicalMaterial 
          color={theme.ground} 
          roughness={0.4} 
          metalness={0.7}
          clearcoat={0.3}
        />
      </mesh>

      {/* Cybernetic Interactive Grid Layer */}
      <gridHelper args={[6, 24, '#374151', '#262626']} position={[0, -0.595, 0]} />
    </>
  );
}

// ─── 3D DIEGETIC HEADS UP DISPLAY ─────────────────────────────
function HUDDisplay({ score }) {
  const theme = getTierTheme(score);

  return (
    <Float speed={2.5} floatIntensity={0.05}>
      <group position={[0, 1.5, 0.4]}>
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.14}
          color="#ffffff"
          font="https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5.0.19/files/orbitron-latin-400-normal.woff" // Sci-Fi styling font loaded dynamically
          anchorX="center"
        >
          {`${score.toLocaleString()} kg`}
        </Text>
        <Text
          position={[0, 0.02, 0]}
          fontSize={0.05}
          color={theme.color}
          letterSpacing={0.2}
          font="https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5.0.19/files/orbitron-latin-400-normal.woff"
          anchorX="center"
        >
          {theme.label}
        </Text>
      </group>
    </Float>
  );
}

// ─── COMPONENT CORE DEFINITION ──────────────────────────────────
export default function CarbonTwin({ score = 1500, animating = false }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative bg-black shadow-inner">
      <Canvas
        camera={{ position: [0, 1.2, 4.2], fov: 45 }}
        dpr={[1, 2]}
        shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        role="img"
        aria-label={`Interactive 3D carbon twin avatar. Currently indicating ${score.toLocaleString()} kg CO2/year footprint, rating as ${getTierTheme(score).label}.`}
      >
        <EnvironmentStage score={score} />
        <CelestialBody score={score} />
        <AvatarBody score={score} animating={animating} />
        <HighRealismAura score={score} />
        <EcosystemManager score={score} />
        <GroundCracks score={score} />
        <HUDDisplay score={score} />

        <ContactShadows
          position={[0, -0.599, 0]}
          opacity={0.6}
          scale={3.5}
          blur={2.2}
          far={1.2}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={7}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
