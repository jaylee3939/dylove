import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Character from "../../characters/Character";
import { Heart, Box } from "../../scenes/Environment";
import type { Action } from "../../data/story";
import type { EpisodeChapter } from "./content";
function Couple({ action }: { action: Action }) {
  const girl = useRef<THREE.Group>(null),
    jae = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const close = ["hug", "kiss", "hands"].includes(action);
    for (const [ref, side] of [
      [girl, -1],
      [jae, 1],
    ] as const) {
      if (!ref.current) continue;
      ref.current.position.x = THREE.MathUtils.damp(
        ref.current.position.x,
        side * (close ? (action === "kiss" ? 0.36 : 0.32) : 0.55),
        7,
        Math.min(dt, 0.05),
      );
      ref.current.rotation.y = THREE.MathUtils.damp(
        ref.current.rotation.y,
        close ? (-side * Math.PI) / 2 : -side * 0.15,
        7,
        Math.min(dt, 0.05),
      );
    }
  });
  return (
    <>
      <group ref={girl} position={[-0.55, 0, 0.06]}>
        <Character action={action} />
      </group>
      <group ref={jae} position={[0.55, 0, 0]}>
        <Character kind="jae" action={action} />
      </group>
    </>
  );
}
function Sea() {
  const water = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(16, 12, 28, 20), []);
  useFrame(({ clock }) => {
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++)
      positions.setZ(
        i,
        Math.sin(positions.getX(i) * 1.7 + clock.elapsedTime * 0.7) * 0.055 +
          Math.cos(positions.getY(i) * 1.3 + clock.elapsedTime) * 0.035,
      );
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    if (water.current)
      water.current.rotation.z = Math.sin(clock.elapsedTime * 0.12) * 0.015;
  });
  return (
    <>
      <mesh
        ref={water}
        geometry={geo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.27, -2]}
      >
        <meshStandardMaterial
          color="#367d91"
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[-2.6, 3, -5]}>
        <sphereGeometry args={[0.42, 20, 16]} />
        <meshBasicMaterial color="#ffe6b7" />
      </mesh>
      <group position={[0, 0, -4]}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <Box p={[side * 2.4, 0.8, 0]} s={[0.12, 1.9, 0.12]} c="#e7c59b" />
            {[-2, -1, 0, 1, 2].map((i) => (
              <mesh key={i} position={[side * 2.4, 0.9 + i * 0.12, 0]}>
                <sphereGeometry args={[0.035, 6, 6]} />
                <meshBasicMaterial color="#ffdfaf" />
              </mesh>
            ))}
          </group>
        ))}
        <Box p={[0, 0.5, 0]} s={[6, 0.08, 0.08]} c="#c5a98d" />
        <Box p={[0, 1.2, 0]} s={[6, 0.08, 0.08]} c="#c5a98d" />
      </group>
    </>
  );
}
function PinkGarden({ garden }: { garden: boolean }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-2, -0.6, 1].map((z, i) => (
            <group key={z} position={[side * (1.55 + i * 0.12), 0, z - 0.5]}>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.035, 0.055, 0.9, 7]} />
                <meshStandardMaterial color="#71816a" />
              </mesh>
              {[0, 1, 2, 3, 4].map((p) => (
                <mesh
                  key={p}
                  position={[
                    Math.sin(p * 1.256) * 0.14,
                    0.95 + Math.cos(p * 1.256) * 0.14,
                    0,
                  ]}
                >
                  <sphereGeometry args={[0.16, 9, 6]} />
                  <meshStandardMaterial
                    color={garden ? "#e9ae9c" : "#eda9c5"}
                  />
                </mesh>
              ))}
              <mesh position={[0, 0.95, 0.1]}>
                <sphereGeometry args={[0.1, 9, 6]} />
                <meshStandardMaterial color="#ffe5af" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh
          key={i}
          position={[
            -2.2 + i * 0.44,
            2.7 - Math.sin((i / 10) * Math.PI) * 0.4,
            -1.6,
          ]}
        >
          <sphereGeometry args={[0.035, 7, 5]} />
          <meshBasicMaterial color="#ffe3ac" />
        </mesh>
      ))}
    </>
  );
}
function Room() {
  return (
    <>
      <Box p={[0, 1.3, -2.1]} s={[5, 2.6, 0.14]} c="#753f56" />
      <Box p={[0, 0.25, -1.3]} s={[2.4, 0.5, 1.4]} c="#71434f" />
      <Box p={[0, 0.56, -1.3]} s={[2.35, 0.22, 1.4]} c="#edc4b9" />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * 0.6, 0.72, -1.7]} s={[0.8, 0.18, 0.4]} c="#f6dfcf" />
          <Box p={[side * 1.8, 0.45, -1.6]} s={[0.5, 0.9, 0.6]} c="#a17161" />
          <mesh position={[side * 1.8, 1.08, -1.6]}>
            <coneGeometry args={[0.27, 0.34, 12]} />
            <meshStandardMaterial
              color="#ffe4bd"
              emissive="#e3a270"
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      ))}
      <Heart position={[0, 2, -1.95]} scale={0.3} color="#e8a0b9" />
    </>
  );
}
export default function EpisodeScene({
  action,
  scene = "room",
  celebration = false,
}: {
  action: Action;
  scene?: EpisodeChapter["scene"];
  celebration?: boolean;
}) {
  const sky =
    scene === "sea"
      ? "#1d344f"
      : scene === "pink"
        ? "#77516e"
        : scene === "garden"
          ? "#584955"
          : "#342336";
  return (
    <Canvas
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [2.8, 2.7, 6.4], fov: 38 }}
      onCreated={({ camera }) => camera.lookAt(0, 1, 0)}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[sky]} />
      <ambientLight intensity={1.5} />
      <hemisphereLight args={["#ffe2d2", "#765174", 1.3]} />
      <directionalLight
        position={[-3, 5, 5]}
        color="#ffe3bc"
        intensity={2.3}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[2, 1.85, 0.18, 40]} />
        <meshStandardMaterial
          color={
            scene === "sea"
              ? "#c7ac97"
              : scene === "garden"
                ? "#b2ad8d"
                : "#b77d91"
          }
          roughness={0.85}
        />
      </mesh>
      {scene === "sea" ? (
        <Sea />
      ) : scene === "room" ? (
        <Room />
      ) : (
        <PinkGarden garden={scene === "garden"} />
      )}
      <Couple action={action} />
      {celebration &&
        Array.from({ length: 8 }, (_, i) => (
          <Heart
            key={i}
            position={[
              Math.sin(i * 2.4) * 1.05,
              1.8 + (i % 4) * 0.3,
              Math.cos(i * 2.4) * 0.7,
            ]}
            scale={0.09 + (i % 2) * 0.03}
            color="#f5b0ca"
          />
        ))}
    </Canvas>
  );
}
