import { ui } from "../content/gameContent";
import WorldLabel from "../components/WorldLabel";
import { useGame } from "../systems/store";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useLayoutEffect } from "react";
import * as THREE from "three";
export function Box({
  p,
  s,
  c,
  r = 0,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
  r?: number;
}) {
  return (
    <RoundedBox
      args={s}
      radius={0.06}
      smoothness={2}
      position={p}
      rotation={[0, r, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={c} roughness={0.85} />
    </RoundedBox>
  );
}
function Plant({
  x,
  z,
  flower = false,
}: {
  x: number;
  z: number;
  flower?: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.17, 0.36, 8]} />
        <meshStandardMaterial color="#bd8265" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, i * 2.1, 0]}>
          <mesh
            position={[0.12, 0.57, 0]}
            rotation={[0, 0, -0.4]}
            scale={[0.18, 0.35, 0.1]}
            castShadow
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color={flower ? "#e7a4b2" : "#73896a"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Table({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.8, 0]} s={[1.65, 0.15, 1.1]} c="#ae7959" />
      {[-0.6, 0.6].map((a) => (
        <Box key={a} p={[a, 0.4, 0]} s={[0.12, 0.8, 0.7]} c="#795548" />
      ))}
      {[-0.48, 0.48].map((a) => (
        <group key={a}>
          <mesh position={[a, 0.92, 0]}>
            <cylinderGeometry args={[0.25, 0.17, 0.12, 16]} />
            <meshStandardMaterial color="#faf0d7" />
          </mesh>
          <mesh position={[a, 0.99, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.015, 16]} />
            <meshStandardMaterial color="#a95f32" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Tree({
  x,
  z,
  pink = false,
}: {
  x: number;
  z: number;
  pink?: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.9, 0]} s={[0.25, 1.8, 0.25]} c="#86644d" />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 3) * 0.35,
            2.1 + i * 0.3,
            Math.cos(i * 3) * 0.25,
          ]}
          castShadow
        >
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color={pink ? "#e9acbb" : "#8c9c77"} />
        </mesh>
      ))}
    </group>
  );
}
export function Heart({
  position,
  scale = 0.22,
  color = "#d77792",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y =
        position[1] + Math.sin(clock.elapsedTime * 2) * 0.1;
      ref.current.rotation.y = clock.elapsedTime * 0.6;
    }
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1, 1, 0.38]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
      {[
        [-0.35, 0.35],
        [0.35, 0.35],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[0.51, 12, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 1.3, 0]} s={[0.08, 2.6, 0.08]} c="#675e52" />
      <Box p={[0, 2.6, 0]} s={[0.4, 0.5, 0.4]} c="#ffe2a3" />
      <pointLight
        position={[0, 2.5, 0]}
        intensity={2}
        color="#ffd39c"
        distance={4}
      />
    </group>
  );
}
function Paving({ stage }: { stage: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 240; i++) {
      const row = Math.floor(i / 10),
        col = i % 10;
      matrix.makeTranslation(
        (col - 4.5) * 0.48 + (row % 2) * 0.12,
        0.012,
        5.4 - row * 0.48,
      );
      ref.current.setMatrixAt(i, matrix);
      ref.current.setColorAt(
        i,
        new THREE.Color(
          i % 3 === 0 ? "#d4b9a2" : i % 3 === 1 ? "#dfc6b0" : "#e5ceb9",
        ),
      );
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [stage]);
  return stage === 0 ? (
    <instancedMesh ref={ref} args={[undefined, undefined, 240]} receiveShadow>
      <boxGeometry args={[0.455, 0.024, 0.455]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  ) : null;
}
function Sign({ p, text }: { p: [number, number, number]; text: string }) {
  return (
    <WorldLabel
      position={p}
      text={text}
      className="world-sign"
      distanceFactor={10}
    />
  );
}
export default function Environment({
  stage,
  dim,
  onDoor,
}: {
  stage: number;
  dim: boolean;
  onDoor: () => void;
}) {
  const unlocked = useGame((s) => s.hearts.length === 5);
  const floor = [
    "#d6b59e",
    "#bd9476",
    "#cdb5a0",
    "#c4c0b2",
    "#a5b58c",
    "#8b5260",
  ][stage];
  return (
    <group>
      <Paving stage={stage} />
      <Box p={[0, -0.23, -0.4]} s={[10, 0.45, 14]} c={floor} />
      <Box p={[0, -0.5, -0.4]} s={[10.2, 0.2, 14.2]} c="#a68068" />
      {stage === 0 && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              {[-4.6, -1.5, 2].map((z, i) => (
                <group key={z}>
                  <Box
                    p={[side * 4, 1.6, z]}
                    s={[1.9, 3.2, 2.7]}
                    c={["#e4bb9c", "#d5a68f", "#d9c8aa"][i]}
                  />
                  <Box
                    p={[side * 3.0, 2.35, z]}
                    s={[0.15, 0.22, 2.9]}
                    c="#8e4058"
                  />
                  {[-0.65, 0.65].map((a) => (
                    <Box
                      key={a}
                      p={[side * 2.99, 1.5, z + a]}
                      s={[0.06, 1.05, 0.8]}
                      c="#726657"
                    />
                  ))}
                  {Array.from({ length: 7 }, (_, a) => (
                    <Box
                      key={a}
                      p={[side * 2.88, 2.12, z + (a - 3) * 0.39]}
                      s={[0.55, 0.08, 0.38]}
                      c={a % 2 ? "#f8e6ce" : "#a9616d"}
                    />
                  ))}
                  <Box
                    p={[side * 3, 2.05, z]}
                    s={[0.38, 0.12, 2.8]}
                    c="#f2d5bc"
                  />
                </group>
              ))}
            </group>
          ))}
          <Sign p={[-2.85, 2.65, -3]} text={ui.text65} />
          <Sign p={[2.85, 2.65, -1.5]} text={ui.text66} />
          <Box p={[-3, 0.8, 1]} s={[0.8, 1.6, 0.65]} c="#ab6470" />
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              p={[-3, 1.25 - i * 0.23, 1.34]}
              s={[0.6, 0.15, 0.04]}
              c="#ffe7b3"
            />
          ))}
          {[-3, -1, 1, 3].map((z) => (
            <group key={z}>
              <Box p={[0, 0.015, z]} s={[1.7, 0.02, 0.8]} c="#e5c9af" />
              <Lamp x={2.65} z={z - 0.5} />
              <Plant x={-2.6} z={z - 0.7} />
            </group>
          ))}
        </>
      )}
      {[1, 2, 3, 5].includes(stage) && (
        <>
          <Box
            p={[0, 1.55, -6.3]}
            s={[10, 3.1, 0.2]}
            c={stage === 5 ? "#743449" : "#e8d7bd"}
          />
          <Box
            p={[-4.8, 1.3, -1]}
            s={[0.2, 2.6, 10.4]}
            c={stage === 5 ? "#874659" : "#ddc5a9"}
          />
          {[-3, 0, 3].map((x) => (
            <group key={x}>
              <Box p={[x, 2.6, -2]} s={[0.7, 0.1, 0.7]} c="#9c7356" />
              <mesh position={[x, 2.47, -2]}>
                <sphereGeometry args={[0.22, 12, 8]} />
                <meshStandardMaterial
                  color="#ffe2a3"
                  emissive="#ffcb83"
                  emissiveIntensity={dim ? 0.1 : 1}
                />
              </mesh>
            </group>
          ))}
        </>
      )}
      {stage === 1 && (
        <>
          <Sign p={[0, 2.1, -6.05]} text={ui.text67} />
          <Table x={0} z={-4.7} />
          <Table x={-3} z={-1.5} />
          <Table x={3} z={1.5} />
          {[-1, 1].map((s) => (
            <Box
              key={s}
              p={[s * 1.3, 0.4, -4.7]}
              s={[0.55, 0.8, 0.6]}
              c="#885e4c"
            />
          ))}
          <Box p={[-3, 1.1, 1]} s={[1.4, 2.2, 0.25]} c="#6e7059" />
        </>
      )}
      {stage === 2 && (
        <>
          <Sign p={[0, 2.1, -6.05]} text={ui.text68} />
          {[-3, 0, 3].map((x) => (
            <group key={x}>
              <Box p={[x, 0.65, -5.2]} s={[2.3, 1.3, 1.4]} c="#9f7e69" />
              <Box p={[x, 1.34, -5.2]} s={[2.15, 0.07, 1.3]} c="#c7d7d0" />
              {[-0.5, 0, 0.5].map((a, i) => (
                <mesh
                  key={i}
                  position={[x + a, 1.4, -5.1]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <torusGeometry args={[0.13, 0.035, 8, 24]} />
                  <meshStandardMaterial
                    color={i === 2 ? "#dfbe72" : "#eeeeeb"}
                    metalness={0.9}
                    roughness={0.18}
                  />
                </mesh>
              ))}
            </group>
          ))}
          <Box p={[3, 0.65, 1]} s={[1.4, 1.3, 1.4]} c="#bb9a82" />
        </>
      )}
      {stage === 3 && (
        <>
          <Sign p={[0, 2.1, -6.05]} text={ui.text69} />
          <Box p={[-3, 0.55, -2]} s={[1.4, 1.1, 3]} c="#a99178" />
          <Box p={[-3, 1.45, -1]} s={[0.8, 0.75, 0.65]} c="#655d56" />
          <Box p={[-3, 1.43, -0.66]} s={[0.45, 0.35, 0.03]} c="#d8bd8e" />
          <Box p={[3, 1.1, -3]} s={[1.2, 2.2, 1.1]} c="#deded2" />
          <Box p={[2.5, 1.6, -2.42]} s={[0.06, 0.4, 0.06]} c="#817970" />
          <Table x={2} z={1.5} />
        </>
      )}
      {stage === 4 && (
        <>
          {[-4, -2, 0, 2, 4].map((z) => (
            <group key={z}>
              <Box p={[0, 0.02, z]} s={[1.5, 0.05, 0.8]} c="#e7d7b2" />
              {[-1, 1].map((s) => (
                <group key={s}>
                  <Plant x={s * 1.55} z={z} flower />
                  <Tree x={s * 3.6} z={z - 1} pink />
                </group>
              ))}
            </group>
          ))}
          <Box p={[-3, 0.55, 0]} s={[1.8, 0.15, 0.6]} c="#a98465" />
          <Box p={[-3, 1, 0.25]} s={[1.8, 0.7, 0.12]} c="#a98465" />
          {Array.from({ length: 15 }, (_, i) => (
            <mesh
              key={i}
              position={[
                -4 + i * 0.57,
                3.1 - Math.sin((i / 14) * Math.PI) * 0.6,
                -5.8,
              ]}
            >
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshStandardMaterial
                color="#ffe9aa"
                emissive="#ffe9aa"
                emissiveIntensity={2}
              />
            </mesh>
          ))}
        </>
      )}
      {stage === 5 && (
        <>
          <Sign p={[0, 2.9, -6.05]} text={ui.text70} />
          <Box p={[0, 0.35, -4.8]} s={[3.7, 0.7, 2.8]} c="#563743" />
          <Box p={[0, 0.8, -4.8]} s={[3.6, 0.3, 2.7]} c="#f2d6cc" />
          <Box p={[0, 1.03, -4.1]} s={[3.65, 0.15, 1.2]} c="#b15d75" />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Box p={[s * 0.9, 1, -5.5]} s={[1.2, 0.25, 0.55]} c="#fff0df" />
              <Box p={[s * 2.5, 0.5, -5]} s={[0.7, 1, 0.8]} c="#91624d" />
              <Lamp x={s * 2.5} z={-5} />
            </group>
          ))}
          <Heart position={[0, 2.4, -6.05]} scale={0.55} />
        </>
      )}
      {stage === 4 && unlocked && (
        <group position={[2.8, 0, -5.7]}>
          <Box p={[0, 1.25, 0]} s={[1.3, 2.5, 0.25]} c="#8e4058" />
          <Box p={[0, 2.6, 0]} s={[1.5, 0.15, 0.35]} c="#d9b977" />
          <mesh position={[0.42, 1.1, 0.2]}>
            <sphereGeometry args={[0.065, 12, 8]} />
            <meshStandardMaterial
              color="#e5be69"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <group position={[0, 1.5, 0.25]}>
            <mesh>
              <torusGeometry args={[0.18, 0.04, 8, 24]} />
              <meshStandardMaterial
                color="#e5be69"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <Box p={[0, -0.35, 0]} s={[0.06, 0.4, 0.06]} c="#e5be69" />
            <Box p={[0.08, -0.48, 0]} s={[0.2, 0.07, 0.06]} c="#e5be69" />
          </group>
          <WorldLabel
            position={[0, 3, 0]}
            text={ui.text71}
            className="secret-door world-door"
            onClick={onDoor}
          />
        </group>
      )}
      {stage !== 4 && [-4, 4].map((x) => <Plant key={x} x={x} z={3} flower />)}
    </group>
  );
}
