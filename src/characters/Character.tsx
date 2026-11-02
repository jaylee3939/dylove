import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Action } from "../data/story";
import { controls } from "../systems/store";
import { characterPalette } from "../data/characters";
function Ball({
  p,
  s,
  c,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
}) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={c} roughness={0.85} />
    </mesh>
  );
}
export default function Character({
  kind = "doyeon",
  moving = false,
  action = "idle",
  rings = false,
}: {
  kind?: "doyeon" | "jae";
  moving?: boolean;
  action?: Action;
  rings?: boolean;
}) {
  const body = useRef<THREE.Group>(null),
    left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null),
    legL = useRef<THREE.Group>(null),
    legR = useRef<THREE.Group>(null);
  const girl = kind === "doyeon";
  const { skin, hair, cream, dress, cap } = characterPalette;
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const isMoving =
      moving ||
      action === "run" ||
      (girl &&
        !controls.blocked &&
        (Math.hypot(controls.x, controls.z) > 0.1 ||
          [
            "w",
            "a",
            "s",
            "d",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
          ].some((k) => controls.keys.has(k))));
    const walk = isMoving ? Math.sin(t * 11) * 0.55 : 0;
    const romantic = ["hug", "kiss", "hands", "pat"].includes(action);
    if (body.current) {
      body.current.position.y =
        Math.sin(t * (isMoving ? 11 : 2)) * (isMoving ? 0.035 : 0.012) +
        (action === "wave" ? Math.max(0, Math.sin(t * 6)) * 0.08 : 0);
      body.current.rotation.x = THREE.MathUtils.damp(
        body.current.rotation.x,
        action === "kiss" ? 0.12 : 0,
        8,
        dt,
      );
    }
    if (left.current)
      left.current.rotation.x = THREE.MathUtils.damp(
        left.current.rotation.x,
        romantic ? -1.1 : walk,
        8,
        dt,
      );
    if (right.current) {
      right.current.rotation.x = THREE.MathUtils.damp(
        right.current.rotation.x,
        romantic ? -1.1 : -walk,
        8,
        dt,
      );
      right.current.rotation.z = THREE.MathUtils.damp(
        right.current.rotation.z,
        action === "wave"
          ? -2.3 + Math.sin(t * 7) * 0.35
          : action === "pat"
            ? -1.4
            : 0,
        8,
        dt,
      );
    }
    if (legL.current) legL.current.rotation.x = action === "sit" ? -1.2 : -walk;
    if (legR.current) legR.current.rotation.x = action === "sit" ? -1.2 : walk;
  });
  return (
    <group ref={body}>
      <Ball p={[0, 1.58, -0.055]} s={[0.39, 0.42, 0.33]} c={hair} />
      {girl &&
        Array.from({ length: 9 }, (_, i) => (
          <Ball
            key={i}
            p={[(i - 4) * 0.084, 1.15 + Math.abs(i - 4) * 0.015, -0.21]}
            s={[0.105, 0.48 + (i % 2) * 0.04, 0.15]}
            c={i % 2 ? hair : "#54382b"}
          />
        ))}
      <Ball p={[0, 1.54, 0.08]} s={[0.335, 0.34, 0.29]} c={skin} />
      <Ball p={[-0.335, 1.5, 0.04]} s={[0.065, 0.09, 0.065]} c={skin} />
      <Ball p={[0.335, 1.5, 0.04]} s={[0.065, 0.09, 0.065]} c={skin} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Ball
            p={[side * 0.125, 1.56, 0.343]}
            s={[0.045, 0.062, 0.022]}
            c="#352922"
          />
          <Ball
            p={[side * 0.111, 1.582, 0.361]}
            s={[0.012, 0.017, 0.008]}
            c="#fff7ea"
          />
          <Ball
            p={[side * 0.207, 1.46, 0.302]}
            s={[0.063, 0.027, 0.014]}
            c={action === "idle" ? "#eaa899" : "#ed8d94"}
          />
          <Ball
            p={[side * 0.125, 1.65, 0.323]}
            s={[0.06, 0.013, 0.016]}
            c={hair}
          />
        </group>
      ))}
      <Ball p={[0, 1.49, 0.375]} s={[0.027, 0.032, 0.025]} c={skin} />
      <mesh position={[0, 1.42, 0.352]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.045, 0.009, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#a15d53" />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <Ball
          key={i}
          p={[(i - 3) * 0.085, 1.79 - Math.abs(i - 3) * 0.022, 0.23]}
          s={[0.066, 0.16, 0.085]}
          c={hair}
        />
      ))}
      {girl ? (
        <>
          <Ball p={[0.22, 1.75, -0.25]} s={[0.16, 0.16, 0.15]} c={hair} />
          <mesh position={[0.24, 1.75, -0.36]}>
            <torusGeometry args={[0.095, 0.018, 6, 18]} />
            <meshStandardMaterial color="#99714e" />
          </mesh>
        </>
      ) : (
        <>
          <Ball p={[0, 1.86, -0.015]} s={[0.395, 0.26, 0.34]} c={cap} />
          <Ball p={[0, 1.8, 0.3]} s={[0.4, 0.045, 0.25]} c={cap} />
          {[-1, 1].map((s) => (
            <group
              key={s}
              position={[s * 0.14, 2.015, 0.18]}
              rotation={[-0.45, 0, 0]}
            >
              <Ball p={[0, 0, 0]} s={[0.13, 0.075, 0.025]} c="#343340" />
              <Ball
                p={[0, 0.005, 0.025]}
                s={[0.105, 0.052, 0.012]}
                c="#6f7890"
              />
            </group>
          ))}
          <Ball p={[0, 2.02, 0.17]} s={[0.06, 0.014, 0.02]} c="#343340" />
        </>
      )}
      <mesh position={[0, 0.94, 0]} castShadow>
        <cylinderGeometry args={[0.22, girl ? 0.32 : 0.25, 0.63, 16]} />
        <meshStandardMaterial color={girl ? dress : "#f8f1e6"} />
      </mesh>
      {girl &&
        [-1, 1].map((s) => (
          <Ball
            key={s}
            p={[s * 0.18, 1.02, 0.03]}
            s={[0.105, 0.32, 0.19]}
            c={cream}
          />
        ))}
      {[1.15, 1.02, 0.9].map((y) => (
        <Ball
          key={y}
          p={[girl ? 0.19 : 0, y, 0.207]}
          s={[0.018, 0.018, 0.012]}
          c="#bd9b72"
        />
      ))}
      {[-1, 1].map((s, i) => (
        <group
          key={s}
          position={[s * 0.285, 1.18, 0]}
          ref={i === 0 ? left : right}
        >
          <Ball
            p={[0, -0.19, 0]}
            s={[0.1, 0.26, 0.1]}
            c={girl ? cream : "#f8f1e6"}
          />
          <Ball p={[0, -0.43, 0.01]} s={[0.075, 0.09, 0.075]} c={skin} />
          {rings && (
            <mesh position={[0, -0.45, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.038, 0.012, 6, 16]} />
              <meshStandardMaterial
                color="#e5c16e"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          )}
        </group>
      ))}
      {[-1, 1].map((s, i) => (
        <group
          key={s}
          position={[s * 0.13, 0.65, 0]}
          ref={i === 0 ? legL : legR}
        >
          <Ball p={[0, -0.22, 0]} s={[0.09, 0.27, 0.09]} c={skin} />
          {!girl && (
            <mesh position={[0, -0.07, 0]} castShadow>
              <cylinderGeometry args={[0.135, 0.125, 0.32, 12]} />
              <meshStandardMaterial color="#35343a" />
            </mesh>
          )}
          <Ball p={[0, -0.4, 0]} s={[0.095, 0.12, 0.1]} c="#f6e9d5" />
          <Ball
            p={[0, -0.51, 0.05]}
            s={[0.13, 0.085, 0.19]}
            c={girl ? "#383334" : "#faf0df"}
          />
          <Ball
            p={[0, -0.56, 0.05]}
            s={[0.133, 0.025, 0.19]}
            c={girl ? "#262528" : "#d3c3b0"}
          />
        </group>
      ))}
    </group>
  );
}
