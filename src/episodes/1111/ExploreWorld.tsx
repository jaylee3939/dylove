import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import Character from "../../characters/Character";
import Joystick from "../../components/Joystick";
import WorldLabel from "../../components/WorldLabel";
import { controls } from "../../systems/store";
import { Heart, Box } from "../../scenes/Environment";
import { tone } from "../../systems/audio";
import { Sea, PinkGarden, Room } from "./EpisodeScene";
import type { Action } from "../../data/story";
import {
  EXPLORE_SAVE_KEY,
  mapForChapter,
  mapNames,
  heartPositions,
  missionsForChapter,
  loadPosition,
  type Mission,
  walkable,
} from "./exploration";
import "./explore.css";
type Props = {
  chapter: number;
  ending?: boolean;
  blocked: boolean;
  action: Action;
  hearts: number[];
  celebration: boolean;
  onHeart: (id: number) => void;
  onMission: (id: string) => void;
  onMenu: () => void;
};
function Scenery({ map }: { map: number }) {
  return (
    <>
      <Box
        p={[0, -0.13, 0]}
        s={[10, 0.25, 12]}
        c={["#bcaaa2", "#e1c4b5", "#c3b59e", "#b68495"][map]}
      />
      {map === 0 ? (
        <>
          <group position={[0, 0, -3]}>
            <Sea />
          </group>
          {[-4.5, 4.5].map((x) => (
            <group key={x}>
              {[-4, -1, 2, 5].map((z) => (
                <group key={z}>
                  <Box p={[x, 0.7, z]} s={[0.09, 1.4, 0.09]} c="#80605c" />
                  <mesh position={[x, 1.55, z]}>
                    <sphereGeometry args={[0.18, 10, 8]} />
                    <meshStandardMaterial
                      color="#ffe3a3"
                      emissive="#ffbd63"
                      emissiveIntensity={1.4}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
          {[-4, -2, 0, 2, 4].map((x, i) => (
            <Box
              key={x}
              p={[x, 1.2 + (i % 3) * 0.3, -8]}
              s={[1.2, 2.5 + (i % 3) * 0.6, 0.9]}
              c="#3b526b"
            />
          ))}
        </>
      ) : map === 1 ? (
        <>
          <group position={[-2.7, 0, -2.6]}>
            <Box p={[0, 0.6, 0]} s={[2, 1.2, 1.2]} c="#8f655c" />
            <mesh position={[0, 1.28, 0]}>
              <cylinderGeometry args={[0.6, 0.45, 0.18, 20]} />
              <meshStandardMaterial color="#c75049" />
            </mesh>
            {[-0.3, 0, 0.3].map((x) => (
              <Box key={x} p={[x, 1.4, 0]} s={[0.14, 0.1, 0.45]} c="#ffe3b0" />
            ))}
          </group>
          <group position={[2.8, 0, -3]}>
            <Box p={[0, 0.3, 0]} s={[2.4, 0.6, 2]} c="#c9b1b6" />
            <Box p={[0, 0.65, 0]} s={[2, 0.1, 1.6]} c="#7eacb1" />
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[(i - 1) * 0.5, 1 + i * 0.2, 0]}>
                <sphereGeometry args={[0.23, 10, 8]} />
                <meshStandardMaterial
                  color="#f9e2da"
                  transparent
                  opacity={0.22}
                />
              </mesh>
            ))}
          </group>
          <group position={[0, 0, -5]}>
            <PinkGarden garden={false} />
          </group>
        </>
      ) : map === 2 ? (
        <>
          {[-4, 4].map((x) => (
            <group key={x} position={[x, 0, -1]}>
              <PinkGarden garden />
            </group>
          ))}
          {[-4, -2, 0, 2, 4].map((x) => (
            <Box key={x} p={[x, 0, 1]} s={[0.6, 0.04, 0.65]} c="#f6dfc8" />
          ))}
        </>
      ) : (
        <>
          <group position={[0, 0, -4.5]} scale={1.4}>
            <Room />
          </group>
          <Box p={[2, 0.45, -3.4]} s={[0.9, 0.9, 0.75]} c="#986b7c" />
          <Box p={[2, 0.94, -3.4]} s={[0.75, 0.07, 0.5]} c="#fff4e8" />
          <mesh position={[2, 0.985, -3.4]} rotation={[0, Math.PI, 0]}>
            <coneGeometry args={[0.3, 0.025, 3]} />
            <meshStandardMaterial color="#f5b8c8" />
          </mesh>
          <Heart position={[2, 1.2, -3.4]} scale={0.08} />
          <pointLight
            position={[-2.5, 2, -4.5]}
            color="#ffbd91"
            intensity={2}
            distance={7}
          />
        </>
      )}
      {map === 2 && (
        <>
          <Box p={[0, -0.35, 0]} s={[30, 0.1, 30]} c="#acae98" />
          {[-8, -4, 0, 4, 8].map((x, i) => (
            <group key={x} position={[x, 0, -8]}>
              <Box p={[0, 1, 0]} s={[0.22, 2, 0.22]} c="#87685c" />
              <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[1.1, 12, 10]} />
                <meshStandardMaterial color={i % 2 ? "#c494ac" : "#dda7b9"} />
              </mesh>
            </group>
          ))}
          <Box p={[0, 3.1, -6]} s={[11, 0.025, 0.025]} c="#836b79" />
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[-5 + i * 0.9, 3.05, -6]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshBasicMaterial color="#ffe3a3" />
            </mesh>
          ))}
        </>
      )}
      {[-4.8, 4.8].map((x) => (
        <Box key={x} p={[x, 0.2, 0]} s={[0.12, 0.4, 12]} c="#aa7d89" />
      ))}
    </>
  );
}
function Actors({
  chapter,
  blocked,
  action,
  hearts,
  celebration,
  onHeart,
  onNear,
}: {
  chapter: number;
  blocked: boolean;
  action: Action;
  hearts: number[];
  celebration: boolean;
  onHeart: (id: number) => void;
  onNear: (m: Mission | null) => void;
}) {
  const map = mapForChapter(chapter),
    spawn = useRef(loadPosition(map)),
    player = useRef<THREE.Group>(null),
    npc = useRef<THREE.Group>(null),
    [walking, setWalking] = useState(false),
    moving = useRef(false),
    lastNear = useRef(""),
    saveAt = useRef(0),
    stepAt = useRef(0),
    seen = useRef(new Set(hearts));
  useEffect(() => {
    seen.current = new Set(hearts);
  }, [hearts]);
  useFrame(({ camera, clock }, delta) => {
    const p = player.current;
    if (!p) return;
    const dt = Math.min(delta, 0.05);
    let x =
        controls.x +
        (controls.keys.has("d") || controls.keys.has("arrowright") ? 1 : 0) -
        (controls.keys.has("a") || controls.keys.has("arrowleft") ? 1 : 0),
      z =
        controls.z +
        (controls.keys.has("s") || controls.keys.has("arrowdown") ? 1 : 0) -
        (controls.keys.has("w") || controls.keys.has("arrowup") ? 1 : 0);
    if (blocked) x = z = 0;
    const len = Math.hypot(x, z),
      walk = len > 0.1;
    if (walk !== moving.current) {
      moving.current = walk;
      setWalking(walk);
    }
    if (walk) {
      x /= Math.max(1, len);
      z /= Math.max(1, len);
      const nx = THREE.MathUtils.clamp(p.position.x + x * dt * 2.7, -4.5, 4.5);
      const nz = THREE.MathUtils.clamp(p.position.z + z * dt * 2.7, -5.3, 5.5);
      if (walkable(map, nx, p.position.z)) p.position.x = nx;
      if (walkable(map, p.position.x, nz)) p.position.z = nz;
      const angle = Math.atan2(x, z);
      p.rotation.y +=
        Math.atan2(
          Math.sin(angle - p.rotation.y),
          Math.cos(angle - p.rotation.y),
        ) * Math.min(1, dt * 12);
      if (clock.elapsedTime - stepAt.current > 0.34) {
        tone(135, 0.045, 0.012);
        stepAt.current = clock.elapsedTime;
      }
    }
    controls.position = { x: p.position.x, z: p.position.z };
    if (clock.elapsedTime - saveAt.current > 0.5) {
      try {
        localStorage.setItem(
          EXPLORE_SAVE_KEY,
          JSON.stringify({ map, x: p.position.x, z: p.position.z }),
        );
      } catch {}
      saveAt.current = clock.elapsedTime;
    }
    const nearest =
      missionsForChapter(chapter).find(
        (m) => Math.hypot(m.x - p.position.x, m.z - p.position.z) < 1.3,
      ) ?? null;
    if ((nearest?.id ?? "") !== lastNear.current) {
      lastNear.current = nearest?.id ?? "";
      onNear(nearest);
    }
    if (chapter === 3 && !blocked)
      heartPositions.forEach(([hx, hz], id) => {
        if (
          !seen.current.has(id) &&
          Math.hypot(hx - p.position.x, hz - p.position.z) < 0.7
        ) {
          seen.current.add(id);
          onHeart(id);
        }
      });
    const close = ["hug", "kiss", "hands", "pat"].includes(action);
    if (npc.current) {
      npc.current.position.lerp(
        new THREE.Vector3(
          close ? p.position.x + 0.58 : 0,
          0,
          close ? p.position.z + 0.08 : chapter === 0 ? 2 : 3,
        ),
        1 - Math.exp(-dt * 4),
      );
      npc.current.rotation.y = close ? -Math.PI / 2 : 0;
      if (close) p.rotation.y = Math.PI / 2;
    }
    const zoom = close ? 0.8 : 1,
      portrait = (camera as THREE.PerspectiveCamera).aspect < 0.8 ? 1.18 : 1;
    camera.position.lerp(
      new THREE.Vector3(
        p.position.x + 5.8 * zoom * portrait,
        7.3 * zoom * portrait,
        p.position.z + 8 * zoom * portrait,
      ),
      1 - Math.exp(-dt * 3),
    );
    camera.lookAt(p.position.x, 0.8, p.position.z - 0.9);
  });
  return (
    <>
      <group ref={player} position={[spawn.current.x, 0, spawn.current.z]}>
        <Character moving={walking} action={action} rings />
      </group>
      <group ref={npc} position={[0, 0, chapter === 0 ? 2 : 3]}>
        <Character kind="jae" action={action} rings />
      </group>
      {missionsForChapter(chapter).map((m) => (
        <group key={m.id} position={[m.x, 0, m.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.45, 0.58, 28]} />
            <meshBasicMaterial color="#ff90c0" side={THREE.DoubleSide} />
          </mesh>
          <Heart position={[0, 2.7, 0]} scale={0.18} />
          <WorldLabel position={[0, 3.2, 0]} text={m.title} />
        </group>
      ))}
      {chapter === 3 &&
        heartPositions.map(
          ([x, z], id) =>
            !hearts.includes(id) && (
              <Heart key={id} position={[x, 1, z]} scale={0.28} />
            ),
        )}
      {celebration &&
        Array.from({ length: 12 }, (_, i) => (
          <Heart
            key={i}
            position={[
              controls.position.x + Math.sin(i * 2.4) * 0.9,
              1.5 + (i % 4) * 0.3,
              controls.position.z + Math.cos(i * 2.4) * 0.8,
            ]}
            scale={0.12}
          />
        ))}
    </>
  );
}
export default function ExploreWorld(props: Props) {
  const [near, setNear] = useState<Mission | null>(null);
  const trigger = useRef(() => {});
  trigger.current = () => {
    if (
      near &&
      !props.blocked &&
      missionsForChapter(props.chapter).some(
        (m) =>
          m.id === near.id &&
          Math.hypot(m.x - controls.position.x, m.z - controls.position.z) <
            1.3,
      )
    )
      props.onMission(near.id);
  };
  const blockedRef = useRef(props.blocked);
  blockedRef.current = props.blocked;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "e",
        ].includes(k) &&
        !blockedRef.current
      ) {
        e.preventDefault();
        controls.keys.add(k);
        if (k === "e" && !e.repeat) trigger.current();
      }
    };
    const up = (e: KeyboardEvent) => controls.keys.delete(e.key.toLowerCase());
    const clear = () => {
      controls.keys.clear();
      controls.x = controls.z = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    clear();
    controls.blocked = blockedRef.current;
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      clear();
      controls.blocked = true;
    };
  }, []);
  useEffect(() => {
    controls.blocked = props.blocked;
    if (props.blocked) {
      controls.keys.clear();
      controls.x = controls.z = 0;
    }
  }, [props.blocked]);
  useEffect(() => setNear(null), [props.chapter]);
  const map = mapForChapter(props.chapter);
  return (
    <section
      className={"special-explore" + (props.ending ? " explore-finale" : "")}
      aria-label="스페셜 3D 탐험"
    >
      <Canvas
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [6, 8, 13], fov: 43 }}
        gl={{ antialias: true }}
      >
        <color
          attach="background"
          args={[map === 0 ? "#21374f" : map === 3 ? "#38273b" : "#80617b"]}
        />
        <ambientLight intensity={1.3} />
        <hemisphereLight args={["#ffe5d4", "#765174", 1.3]} />
        <directionalLight
          position={[-4, 9, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <Suspense fallback={null}>
          <Scenery map={map} />
          <Actors key={map} {...props} onNear={setNear} />
        </Suspense>
      </Canvas>
      <header className="explore-hud">
        <a href="/">← 본편</a>
        <strong>{mapNames[map]}</strong>
        <span>♡ {props.hearts.length}/11</span>
        <button onClick={props.onMenu}>여행 메뉴</button>
      </header>
      <p className="explore-hint">
        {props.ending
          ? "열한 개의 마음, 전부 너에게 ♡"
          : props.chapter === 3
            ? "분홍 하트까지 걸어가서 마음을 모아줘 ♡"
            : "분홍 표시까지 걸어가서 이야기를 열어줘 ♡"}
      </p>
      {!props.blocked && (
        <>
          <Joystick />
          <button
            className="explore-interact"
            disabled={!near}
            onClick={() => trigger.current()}
          >
            {near ? `${near.title} ♡` : "분홍 표시를 찾아가 봐"}
            <small>이야기 · E</small>
          </button>
        </>
      )}
    </section>
  );
}
