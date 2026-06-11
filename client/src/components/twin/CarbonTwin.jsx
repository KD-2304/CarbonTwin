import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { getAvatarHSL } from '../../utils/scoreCalculator';

// ─── LOW-POLY TREE (spawns around green avatars) ────────────────
function MiniTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.24, 5]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.1, 0.22, 5]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.07, 0.16, 5]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// ─── FLOWER (spawns at very low scores) ─────────────────────────
function Flower({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ─── BUTTERFLY (orbits around pristine avatars) ─────────────────
function Butterfly({ offset = 0 }) {
  const ref = useRef();
  const wingRef = useRef();
  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    const t = timer.current.getElapsed();
    if (ref.current) {
      const angle = t * 0.8 + offset;
      ref.current.position.x = Math.cos(angle) * 0.7;
      ref.current.position.z = Math.sin(angle) * 0.7;
      ref.current.position.y = 1.8 + Math.sin(t * 2 + offset) * 0.15;
      ref.current.rotation.y = angle + Math.PI / 2;
    }
    if (wingRef.current) {
      wingRef.current.scale.x = 1 + Math.sin(t * 12 + offset) * 0.6;
    }
  });

  return (
    <group ref={ref}>
      <group ref={wingRef}>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, 0.3]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, -0.3]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ─── FACTORY SMOKESTACK (spawns around polluted avatars) ────────
function Smokestack({ position }) {
  const smokeRef = useRef();
  const timer = useRef(new THREE.Timer());

  const smokeParticles = useMemo(() => {
    const count = 15;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      vel[i * 3] = (Math.random() - 0.5) * 0.001;
      vel[i * 3 + 1] = Math.random() * 0.004 + 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return { positions: pos, velocities: vel, count };
  }, []);

  useFrame(() => {
    timer.current.update();
    if (!smokeRef.current) return;
    const arr = smokeRef.current.geometry.attributes.position.array;
    for (let i = 0; i < smokeParticles.count; i++) {
      arr[i * 3] += smokeParticles.velocities[i * 3];
      arr[i * 3 + 1] += smokeParticles.velocities[i * 3 + 1];
      arr[i * 3 + 2] += smokeParticles.velocities[i * 3 + 2];
      if (arr[i * 3 + 1] > 1.0) {
        arr[i * 3] = (Math.random() - 0.5) * 0.05;
        arr[i * 3 + 1] = 0.4;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      }
    }
    smokeRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={position}>
      {/* Chimney body */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.36, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Chimney rim */}
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.03, 6]} />
        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Smoke particles */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={smokeParticles.count}
            array={smokeParticles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#6b7280" size={0.06} transparent opacity={0.35} sizeAttenuation />
      </points>
    </group>
  );
}

// ─── STREAK FLAME (visible at streak > 0, grows with days) ──────
function StreakFlame({ streak = 0 }) {
  const flameRef = useRef();
  const timer = useRef(new THREE.Timer());
  const intensity = Math.min(1, streak / 14); // Full intensity at 14-day streak
  const flameHeight = 0.1 + intensity * 0.25;

  useFrame(() => {
    timer.current.update();
    const t = timer.current.getElapsed();
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 10) * 0.2;
      flameRef.current.scale.x = 1 + Math.sin(t * 8 + 0.5) * 0.15;
      flameRef.current.rotation.z = Math.sin(t * 6) * 0.1;
    }
  });

  if (streak <= 0) return null;

  return (
    <group position={[0.22, 0.7, 0]}>
      {/* Inner flame */}
      <mesh ref={flameRef} position={[0, flameHeight / 2, 0]}>
        <coneGeometry args={[0.04 + intensity * 0.02, flameHeight, 6]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
      </mesh>
      {/* Outer glow */}
      <mesh position={[0, flameHeight / 2 - 0.02, 0]}>
        <coneGeometry args={[0.06 + intensity * 0.03, flameHeight * 0.8, 6]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.35} />
      </mesh>
      {/* Streak count badge */}
      <Float speed={2} floatIntensity={0.1}>
        <Text
          position={[0, flameHeight + 0.1, 0]}
          fontSize={0.06}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"

          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {streak}🔥
        </Text>
      </Float>
    </group>
  );
}

// ─── FLOATING HUD ───────────────────────────────────────────────
function HUDDisplay({ score }) {
  const label = score < 2000 ? 'PRISTINE' : score < 3000 ? 'MODERATE' : score < 4000 ? 'WARNING' : 'CRITICAL';
  const labelColor = score < 2000 ? '#34d399' : score < 3000 ? '#fbbf24' : score < 4000 ? '#f97316' : '#ef4444';

  return (
    <Float speed={1.5} floatIntensity={0.08}>
      <group position={[0, 1.55, 0]}>
        {/* Score number */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.16}
          color="#f0ece4"
          anchorX="center"
          anchorY="bottom"

          outlineWidth={0.006}
          outlineColor="#000000"
        >
          {score.toLocaleString()} kg
        </Text>
        {/* Status label */}
        <Text
          position={[0, -0.06, 0]}
          fontSize={0.055}
          color={labelColor}
          anchorX="center"
          anchorY="top"
          letterSpacing={0.15}

          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {label}
        </Text>
      </group>
    </Float>
  );
}

// ─── ECOSYSTEM (Nature vs Industry around the avatar) ───────────
function Ecosystem({ score }) {
  const elements = useMemo(() => {
    const items = { trees: [], flowers: [], smokestacks: [], butterflies: 0 };

    if (score < 2000) {
      // Pristine: lots of trees, flowers, butterflies
      items.trees = [
        [-1.2, -0.6, -0.5], [1.3, -0.6, -0.3], [-0.8, -0.6, 0.8],
        [1.0, -0.6, 0.9], [-1.5, -0.6, 0.2], [0.6, -0.6, -1.1],
      ];
      items.flowers = [
        [-0.5, -0.6, 0.4], [0.4, -0.6, -0.6], [-0.3, -0.6, -0.8],
        [0.7, -0.6, 0.5], [-1.0, -0.6, -0.3], [0.9, -0.6, -0.7],
      ];
      items.butterflies = 2;
    } else if (score < 3000) {
      // Moderate: some trees, no flowers
      items.trees = [
        [-1.2, -0.6, -0.4], [1.1, -0.6, 0.6], [-0.7, -0.6, 0.9],
      ];
      items.flowers = [
        [-0.4, -0.6, 0.5], [0.5, -0.6, -0.5],
      ];
    } else if (score < 4000) {
      // Polluted: one struggling tree, smokestacks appear
      items.trees = [[-1.0, -0.6, 0.5]];
      items.smokestacks = [
        [1.2, -0.6, -0.4], [-1.3, -0.6, -0.6],
      ];
    } else {
      // Critical: no trees, all smokestacks
      items.smokestacks = [
        [1.0, -0.6, -0.3], [-1.1, -0.6, -0.5],
        [1.3, -0.6, 0.6], [-0.8, -0.6, 0.8],
      ];
    }

    return items;
  }, [score]);

  return (
    <>
      {elements.trees.map((pos, i) => (
        <MiniTree key={`tree-${i}`} position={pos} scale={0.8 + Math.random() * 0.4} />
      ))}
      {elements.flowers.map((pos, i) => (
        <Flower key={`flower-${i}`} position={pos} />
      ))}
      {elements.smokestacks.map((pos, i) => (
        <Smokestack key={`stack-${i}`} position={pos} />
      ))}
      {[...Array(elements.butterflies)].map((_, i) => (
        <Butterfly key={`butterfly-${i}`} offset={i * Math.PI} />
      ))}
    </>
  );
}

// ─── AURA SHELL ─────────────────────────────────────────────────
function AuraShell({ score }) {
  const auraRef = useRef();
  const timer = useRef(new THREE.Timer());

  const auraConfig = useMemo(() => {
    if (score < 2000) return { color: '#34d399', pulseSpeed: 1.5, opacity: 0.06, scale: 1.8 };
    if (score < 3000) return { color: '#fbbf24', pulseSpeed: 2, opacity: 0.05, scale: 1.6 };
    if (score < 4000) return { color: '#f97316', pulseSpeed: 3, opacity: 0.07, scale: 1.5 };
    return { color: '#ef4444', pulseSpeed: 5, opacity: 0.1, scale: 1.4 };
  }, [score]);

  useFrame(() => {
    timer.current.update();
    const t = timer.current.getElapsed();
    if (auraRef.current) {
      const pulse = 1 + Math.sin(t * auraConfig.pulseSpeed) * 0.08;
      auraRef.current.scale.setScalar(auraConfig.scale * pulse);
      // Glitchy effect for critical scores
      if (score > 4000) {
        auraRef.current.material.opacity = auraConfig.opacity + Math.random() * 0.05;
      } else {
        auraRef.current.material.opacity = auraConfig.opacity + Math.sin(t * auraConfig.pulseSpeed) * 0.02;
      }
    }
  });

  return (
    <mesh ref={auraRef} position={[0, 0.5, 0]} scale={auraConfig.scale}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshBasicMaterial
        color={auraConfig.color}
        transparent
        opacity={auraConfig.opacity}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ─── AVATAR BODY ────────────────────────────────────────────────
function AvatarBody({ score, animating }) {
  const groupRef = useRef();
  const torsoRef = useRef();
  const glowRef = useRef();
  const { h, s, l } = useMemo(() => getAvatarHSL(score), [score]);
  const avatarColor = useMemo(() => new THREE.Color().setHSL(h, s, l), [h, s, l]);
  const emissiveColor = useMemo(() => new THREE.Color().setHSL(h, s, l + 0.2), [h, s, l]);

  const timer = useRef(new THREE.Timer());

  useFrame(() => {
    timer.current.update();
    const t = timer.current.getElapsed();

    // Breathing animation on torso
    if (torsoRef.current) {
      torsoRef.current.scale.x = 1 + Math.sin(t * 2.1) * 0.03;
      torsoRef.current.scale.z = 1 + Math.sin(t * 2.1) * 0.03;
    }

    // Gentle idle sway
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.03;
    }

    // Glow burst animation when score changes
    if (glowRef.current) {
      if (animating) {
        glowRef.current.scale.setScalar(1 + Math.sin(t * 8) * 0.3);
        glowRef.current.material.opacity = 0.4 + Math.sin(t * 8) * 0.2;
      } else {
        glowRef.current.scale.setScalar(1);
        glowRef.current.material.opacity = 0.05;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Glow sphere */}
      <mesh ref={glowRef} scale={2.5}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={avatarColor} transparent opacity={0.05} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={avatarColor} emissive={emissiveColor} emissiveIntensity={0.25} roughness={0.15} metalness={0.8} />
      </mesh>

      {/* Visor */}
      <mesh position={[0, 1.7, 0.15]}>
        <boxGeometry args={[0.32, 0.07, 0.18]} />
        <meshStandardMaterial color="#0b0f19" emissive={emissiveColor} emissiveIntensity={1.8} roughness={0.1} metalness={0.95} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.55, 0.65, 0.3]} />
        <meshStandardMaterial color={avatarColor} emissive={emissiveColor} emissiveIntensity={0.15} roughness={0.15} metalness={0.8} />
      </mesh>

      {/* Glowing chest core */}
      <mesh position={[0, 0.95, 0.16]} scale={0.05}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={emissiveColor} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.4, 1.0, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.4, 1.0, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.45, 0.2, 0.28]} />
        <meshStandardMaterial color={avatarColor} roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.13, -0.08, 0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color={avatarColor} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.13, -0.08, 0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color={avatarColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ─── PARTICLE SYSTEM ────────────────────────────────────────────
function ParticleSystem({ score }) {
  const particlesRef = useRef();
  const count = useMemo(() => Math.floor(50 + Math.min(150, score / 30)), [score]);
  const isGreen = score < 3000;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 3 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = isGreen ? Math.random() * 0.003 + 0.001 : Math.random() * 0.008 + 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    return { positions: pos, velocities: vel };
  }, [count, isGreen]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const posArr = particlesRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocities[i * 3];
      posArr[i * 3 + 1] += velocities[i * 3 + 1];
      posArr[i * 3 + 2] += velocities[i * 3 + 2];
      if (posArr[i * 3 + 1] > 3) {
        posArr[i * 3] = (Math.random() - 0.5) * 4;
        posArr[i * 3 + 1] = -0.5;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const particleColor = isGreen ? '#34d399' : '#9ca3af';

  return (
    <points ref={particlesRef}>
      <bufferGeometry key={count}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={isGreen ? 0.04 : 0.06}
        transparent
        opacity={isGreen ? 0.7 : 0.4}
        sizeAttenuation
      />
    </points>
  );
}

// ─── ENVIRONMENT ────────────────────────────────────────────────
function Environment({ score }) {
  const { skyColor, avatarHSL } = useMemo(() => {
    const sColor = score < 2000 ? '#070b13' :
                   score < 3000 ? '#121824' :
                   score < 4000 ? '#221b14' : '#180d0d';
    const { h, s, l } = getAvatarHSL(score);
    return { skyColor: sColor, avatarHSL: new THREE.Color().setHSL(h, s, l) };
  }, [score]);

  // Ground color transitions from green earth to cracked concrete
  const groundColor = useMemo(() => {
    if (score < 2000) return '#0f1f14';  // Dark green earth
    if (score < 3000) return '#141a13';  // Fading green
    if (score < 4000) return '#1a1612';  // Dusty brown
    return '#151515';                    // Concrete gray
  }, [score]);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 5, 12]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 4, -5]} intensity={0.3} color={score < 3000 ? '#38bdf8' : '#ef4444'} />
      <pointLight position={[0, 1.8, 1.5]} intensity={0.8} color={score < 3000 ? '#10b981' : '#f59e0b'} distance={4} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Scanning ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.59, 0]}>
        <ringGeometry args={[1.0, 1.05, 32]} />
        <meshBasicMaterial color={avatarHSL} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.595, 0]}>
        <circleGeometry args={[1.0, 16]} />
        <meshBasicMaterial color={avatarHSL} wireframe transparent opacity={0.08} />
      </mesh>
    </>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────
export default function CarbonTwin({ score = 3000, animating = false, streak = 0 }) {
  return (
    <div className="w-full h-full min-h-0 rounded-lg overflow-hidden relative">
      <Canvas camera={{ position: [0, 1.0, 5], fov: 46 }}>
        <Environment score={score} />
        <AvatarBody score={score} animating={animating} />
        <AuraShell score={score} />
        <Ecosystem score={score} />
        <StreakFlame streak={streak} />
        <HUDDisplay score={score} />
        <ParticleSystem score={score} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
