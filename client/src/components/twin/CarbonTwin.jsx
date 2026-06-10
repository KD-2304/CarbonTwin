import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getAvatarHSL } from '../../utils/scoreCalculator';

// ─── AVATAR BODY ────────────────────────────────────────────────
function AvatarBody({ score, animating }) {
  const groupRef = useRef();
  const torsoRef = useRef();
  const glowRef = useRef();
  const { h, s, l } = useMemo(() => getAvatarHSL(score), [score]);
  const avatarColor = useMemo(() => new THREE.Color().setHSL(h, s, l), [h, s, l]);
  const emissiveColor = useMemo(() => new THREE.Color().setHSL(h, s, l + 0.2), [h, s, l]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

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
        <meshStandardMaterial color={avatarColor} emissive={emissiveColor} emissiveIntensity={0.3} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.08, 1.7, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.08, 1.7, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.55, 0.65, 0.3]} />
        <meshStandardMaterial color={avatarColor} emissive={emissiveColor} emissiveIntensity={0.15} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.4, 1.0, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.4, 1.0, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.45, 0.2, 0.28]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.13, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.55, 8]} />
        <meshStandardMaterial color={avatarColor} roughness={0.5} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.13, -0.08, 0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.13, -0.08, 0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
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

      // Reset particles that go too high
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
      <bufferGeometry>
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
  const skyColor = useMemo(() => {
    if (score < 2000) return '#1a3a5c';    // Clean blue
    if (score < 3000) return '#2a3a4c';    // Slight haze
    if (score < 4000) return '#3a3530';    // Smoggy
    return '#2a2018';                       // Heavy smog
  }, [score]);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 5, 15]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} color={score < 3000 ? '#88ccff' : '#aa8866'} />
      <pointLight position={[0, 2, 2]} intensity={0.5} color={score < 3000 ? '#10b981' : '#f59e0b'} distance={5} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial
          color={score < 2500 ? '#1a2a1a' : '#1a1a1a'}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────
export default function CarbonTwin({ score = 3000, animating = false }) {
  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.2, 3.5], fov: 45 }}>
        <Environment score={score} />
        <AvatarBody score={score} animating={animating} />
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
