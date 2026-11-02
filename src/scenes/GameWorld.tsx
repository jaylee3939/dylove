import WorldLabel from "../components/WorldLabel";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Character from "../characters/Character";
import Environment, { Heart } from "./Environment";
import { controls, useGame } from "../systems/store";
import { stages, reactionBubbles } from "../data/story";
import { tone } from "../systems/audio";
function Actors({
  ready,
  nearest,
}: {
  ready: boolean;
  nearest: string | null;
}) {
  const collected = useGame((s) => s.hearts.includes(s.stage));
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    if (!collected) return;
    setBurst(true);
    const id = setTimeout(() => setBurst(false), 1200);
    return () => clearTimeout(id);
  }, [collected]);
  const stage = useGame((s) => s.stage),
    action = useGame((s) => s.action),
    rings = useGame(
      (s) => s.hearts.includes(2) || s.completed.includes("rings-selected"),
    );
  const player = useRef<THREE.Group>(null),
    npc = useRef<THREE.Group>(null);
  const walking = useRef(false),
    lastStep = useRef(0);
  const cameraTarget = useRef(new THREE.Vector3());
  useEffect(() => {
    controls.position = { x: 0, z: 4 };
    if (player.current) player.current.position.set(0, 0, 4);
  }, [stage]);
  useFrame(({ camera, clock }, dt) => {
    dt = Math.min(dt, 0.05);
    const p = player.current;
    if (!p) return;
    let x =
        controls.x +
        (controls.keys.has("d") || controls.keys.has("arrowright") ? 1 : 0) -
        (controls.keys.has("a") || controls.keys.has("arrowleft") ? 1 : 0),
      z =
        controls.z +
        (controls.keys.has("s") || controls.keys.has("arrowdown") ? 1 : 0) -
        (controls.keys.has("w") || controls.keys.has("arrowup") ? 1 : 0);
    if (controls.blocked) x = z = 0;
    const len = Math.hypot(x, z);
    walking.current = len > 0.1;
    if (len > 0) {
      x /= Math.max(1, len);
      z /= Math.max(1, len);
      const nx = THREE.MathUtils.clamp(
          p.position.x + x * dt * 2.7,
          -2.65,
          2.65,
        ),
        nz = THREE.MathUtils.clamp(p.position.z + z * dt * 2.7, -5.5, 5.4);
      p.position.set(nx, 0, nz);
      const target = Math.atan2(x, z);
      p.rotation.y +=
        Math.atan2(
          Math.sin(target - p.rotation.y),
          Math.cos(target - p.rotation.y),
        ) * Math.min(1, dt * 12);
      if (clock.elapsedTime - lastStep.current > 0.34) {
        tone(135, 0.045, 0.012);
        lastStep.current = clock.elapsedTime;
      }
    }
    controls.position = { x: p.position.x, z: p.position.z };
    const close = ["hug", "kiss", "hands", "pat"].includes(action);
    if (npc.current) {
      const target = new THREE.Vector3(
        close ? p.position.x + (action === "kiss" ? 0.72 : 0.55) : 1,
        0,
        close ? p.position.z + 0.12 : stage === 4 ? -5.1 : -4.4,
      );
      npc.current.position.lerp(
        target,
        1 - Math.exp(-dt * (stage === 4 ? 2 : 4)),
      );
      npc.current.rotation.y = close ? -Math.PI / 2 : 0;
      if (close) p.rotation.y = Math.PI / 2;
    }
    const zoom = close ? 0.76 : 1;
    const portrait =
      (camera as THREE.PerspectiveCamera).aspect < 0.8 ? 1.18 : 1;
    cameraTarget.current.set(
      p.position.x + 5.8 * zoom * portrait,
      7.3 * zoom * portrait,
      p.position.z + 8 * zoom * portrait,
    );
    camera.position.lerp(cameraTarget.current, 1 - Math.exp(-dt * 3));
    camera.lookAt(p.position.x, 0.8, p.position.z - 0.9);
  });
  return (
    <>
      <group ref={player} position={[0, 0, 4]}>
        <AnimatedPlayer walking={walking} rings={rings} />
      </group>
      {stage > 0 && (
        <group ref={npc} position={[1, 0, -4.4]}>
          <Character kind="jae" action={action} rings={rings} />
          {action !== "idle" && (
            <WorldLabel
              position={[0, 2.4, 0]}
              className="bubble"
              text={
                action === "wave"
                  ? reactionBubbles.wave
                  : action === "hands"
                    ? reactionBubbles.hands
                    : reactionBubbles.love
              }
            />
          )}
        </group>
      )}
      {stages[stage].spots.map((s) => (
        <group key={s.id} position={[s.position[0], 0, s.position[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
            <ringGeometry args={[0.35, 0.42, 32]} />
            <meshBasicMaterial
              color={s.id === nearest ? "#fff8cf" : "#d78d9e"}
              transparent
              opacity={0.8}
            />
          </mesh>
          <WorldLabel
            position={[0, s.main ? 2.7 : 1.7, 0]}
            className={"spot-label " + (s.id === nearest ? "near" : "")}
            text={(s.main ? "♡ " : "") + s.label}
          />
          {s.main && ready && !collected && stage < 5 && (
            <Heart position={[0, 1.4, 0]} scale={0.28} />
          )}
        </group>
      ))}
      {burst && (
        <CollectionBurst
          position={[controls.position.x, 1.8, controls.position.z]}
        />
      )}
      {["hug", "kiss", "hands", "pat"].includes(action) &&
        Array.from({ length: 7 }, (_, i) => (
          <Heart
            key={i}
            position={[
              controls.position.x + Math.sin(i * 3) * 0.9,
              2 + i * 0.15,
              controls.position.z + Math.cos(i * 3) * 0.7,
            ]}
            scale={0.09}
          />
        ))}
    </>
  );
}
function CollectionBurst({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null),
    time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (ref.current) {
      ref.current.position.y = position[1] + time.current;
      ref.current.scale.setScalar(
        Math.max(0.01, 1 + Math.sin(time.current * 3) * 0.8),
      );
    }
  });
  return (
    <group ref={ref} position={position}>
      <Heart position={[0, 0, 0]} scale={0.3} />
    </group>
  );
}
function AnimatedPlayer({
  walking,
  rings,
}: {
  walking: React.RefObject<boolean>;
  rings: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const action = useGame((s) => s.action);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.rotation.z = walking.current
        ? Math.sin(clock.elapsedTime * 11) * 0.035
        : 0;
  });
  return (
    <group ref={ref}>
      <Character moving={walking.current} action={action} rings={rings} />
    </group>
  );
}
export default function GameWorld({
  ready,
  nearest,
  dim,
  onDoor,
}: {
  ready: boolean;
  nearest: string | null;
  dim: boolean;
  onDoor: () => void;
}) {
  const stage = useGame((s) => s.stage);
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [6, 7, 10], fov: 43 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[stages[stage].sky]} />
      <fog attach="fog" args={[stages[stage].sky, 16, 35]} />
      <ambientLight intensity={dim ? 0.25 : 1.5} />
      <hemisphereLight args={["#fff1d7", "#a58478", 1.5]} />
      <directionalLight
        position={[-4, 9, 5]}
        intensity={dim ? 0.3 : 2.8}
        color="#ffe2b2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <Suspense fallback={null}>
        <Environment stage={stage} dim={dim} onDoor={onDoor} />
        <Actors ready={ready} nearest={nearest} />
        <ContactShadows
          frames={1}
          position={[0, 0.005, 0]}
          opacity={0.3}
          scale={22}
          blur={2.5}
          far={5}
          resolution={256}
        />
      </Suspense>
    </Canvas>
  );
}
