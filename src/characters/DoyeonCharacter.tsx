import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Action } from "../data/story";
import { controls } from "../systems/store";

type Point = [number, number, number];
const colors = {
  skin: "#f5cbb0",
  hair: "#473027",
  highlight: "#5a3a2c",
  cream: "#f3e4cd",
  rib: "#dfcdb2",
  navy: "#303343",
};
// Shared low-resolution geometry keeps the small fabric details inexpensive.
const sphere = new THREE.SphereGeometry(1, 16, 12);
const stitchGeometry = new THREE.SphereGeometry(1, 6, 4);
function Soft({
  p,
  s,
  c,
  rotation,
  detail = false,
}: {
  p: Point;
  s: Point;
  c: string;
  rotation?: Point;
  detail?: boolean;
}) {
  return (
    <mesh
      geometry={detail ? stitchGeometry : sphere}
      position={p}
      scale={s}
      rotation={rotation}
      castShadow={!detail}
    >
      <meshStandardMaterial color={c} roughness={0.88} />
    </mesh>
  );
}
// A tapered, elliptical sweep gives hair actual flowing volume in every view.
function Lock({
  points,
  radius = 0.06,
  color = colors.hair,
  flatten = 0.75,
}: {
  points: Point[];
  radius?: number;
  color?: string;
  flatten?: number;
}) {
  const pointsKey = JSON.stringify(points);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const g = new THREE.TubeGeometry(curve, 18, radius, 7, false);
    const positions = g.attributes.position;
    for (let i = 0; i <= 18; i++) {
      const center = curve.getPointAt(i / 18);
      const taper = Math.max(
        0.12,
        Math.sin(Math.PI * (0.1 + (0.9 * i) / 18)) ** 0.38,
      );
      for (let j = 0; j <= 7; j++) {
        const index = i * 8 + j;
        positions.setXYZ(
          index,
          center.x + (positions.getX(index) - center.x) * taper,
          center.y + (positions.getY(index) - center.y) * taper,
          center.z + (positions.getZ(index) - center.z) * taper * flatten,
        );
      }
    }
    g.computeVertexNormals();
    return g;
  }, [pointsKey, radius, flatten]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={color} roughness={0.76} />
    </mesh>
  );
}
const Hair = memo(function Hair() {
  return (
    <>
      <Soft p={[0, 1.66, -0.065]} s={[0.391, 0.383, 0.316]} c={colors.hair} />
      {/* A full back curtain with overlapping S-shaped locks, not straight rods. */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i - 4) * 0.074;
        return (
          <Lock
            key={i}
            points={[
              [x * 0.8, 1.76, -0.22],
              [x, 1.43, -0.315],
              [x + Math.sin(i) * 0.025, 1.16, -0.325],
              [x - Math.sin(i + 1) * 0.04, 0.93, -0.28],
              [
                x + Math.sin(i + 2) * 0.025,
                0.71 + Math.abs(i - 4) * 0.018,
                -0.18,
              ],
            ]}
            radius={0.078}
            flatten={1}
            color={i % 3 === 0 ? colors.highlight : colors.hair}
          />
        );
      })}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Lock
            points={[
              [side * 0.25, 1.91, 0.02],
              [side * 0.35, 1.69, 0.06],
              [side * 0.34, 1.48, 0.12],
              [side * 0.39, 1.24, 0.07],
              [side * 0.34, 1.03, 0.11],
              [side * 0.39, 0.84, 0.035],
            ]}
            radius={0.073}
            flatten={0.85}
          />
          <Lock
            points={[
              [side * 0.32, 1.64, 0.12],
              [side * 0.31, 1.46, 0.19],
              [side * 0.36, 1.29, 0.16],
              [side * 0.32, 1.09, 0.2],
            ]}
            radius={0.042}
            color={colors.highlight}
          />
          {/* Swept half-up sections connect the temples to the centered rear bun. */}
          {[0, 1, 2].map((i) => (
            <Lock
              key={i}
              points={[
                [side * (0.28 + i * 0.018), 1.83 - i * 0.05, 0.05],
                [side * 0.34, 1.78 - i * 0.04, -0.12],
                [side * 0.23, 1.75 - i * 0.035, -0.29],
                [side * 0.075, 1.76 - i * 0.02, -0.36],
              ]}
              radius={0.045}
              flatten={0.65}
              color={i === 1 ? colors.highlight : colors.hair}
            />
          ))}
        </group>
      ))}
      <Soft p={[0, 1.77, -0.378]} s={[0.174, 0.151, 0.125]} c={colors.hair} />
      {[-1, 1].map((side) => (
        <Lock
          key={side}
          points={[
            [side * 0.12, 1.79, -0.43],
            [side * 0.075, 1.88, -0.46],
            [0, 1.88, -0.49],
            [-side * 0.07, 1.78, -0.49],
            [0, 1.7, -0.46],
            [side * 0.1, 1.76, -0.44],
          ]}
          radius={0.032}
          color={colors.highlight}
        />
      ))}
      <mesh position={[0, 1.755, -0.48]} rotation={[0.12, 0, 0]}>
        <torusGeometry args={[0.105, 0.012, 6, 20]} />
        <meshStandardMaterial color="#a77a50" roughness={0.7} />
      </mesh>
      {/* Fine curved bangs leave a little forehead visible between locks. */}
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <Lock
          key={i}
          points={[
            [i * 0.064, 1.904 - Math.abs(i) * 0.009, 0.15],
            [i * 0.067, 1.82, 0.265],
            [
              i * 0.072 + (i >= 0 ? 0.018 : -0.018),
              1.705 + Math.abs(i) * 0.012,
              0.321 - Math.abs(i) * 0.014,
            ],
          ]}
          radius={i === 0 ? 0.029 : 0.036}
          flatten={0.48}
          color={i % 3 === 0 ? colors.highlight : colors.hair}
        />
      ))}
    </>
  );
});
function PleatedSkirt() {
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.206, 0.306, 0.29, 48, 1);
    const positions = g.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i),
        r = Math.hypot(x, z);
      if (r < 0.01) continue;
      const angle = Math.atan2(x, z);
      const pleat = Math.cos(angle * 12) * 0.008;
      positions.setX(i, x * (1 + pleat / r));
      positions.setZ(i, z * (1 + pleat / r));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} position={[0, 0.704, 0.012]} castShadow>
      <meshStandardMaterial color={colors.navy} roughness={0.9} />
    </mesh>
  );
}
function KnitDetails() {
  // One instanced draw call for the knitted chevrons on the cardigan fronts.
  const ref = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => {
    const result: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion(),
      e = new THREE.Euler(),
      v = new THREE.Vector3();
    for (const side of [-1, 1])
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 3; col++)
          for (const direction of [-1, 1]) {
            e.set(0, 0, direction * 0.43);
            q.setFromEuler(e);
            result.push(
              new THREE.Matrix4().compose(
                v.set(
                  side * (0.115 + col * 0.052) + direction * 0.009,
                  0.79 + row * 0.043,
                  0.197 - Math.abs(col - 1) * 0.012,
                ),
                q,
                new THREE.Vector3(0.006, 0.017, 0.004),
              ),
            );
          }
    return result;
  }, []);
  return (
    <instancedMesh
      ref={ref}
      args={[stitchGeometry, undefined, matrices.length]}
      onUpdate={(mesh) => {
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
      }}
    >
      <meshStandardMaterial color={colors.rib} roughness={1} />
    </instancedMesh>
  );
}
export default function DoyeonCharacter({
  moving = false,
  action = "idle",
  rings = false,
}: {
  moving?: boolean;
  action?: Action;
  rings?: boolean;
}) {
  const body = useRef<THREE.Group>(null),
    head = useRef<THREE.Group>(null),
    hair = useRef<THREE.Group>(null),
    left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null),
    legL = useRef<THREE.Group>(null),
    legR = useRef<THREE.Group>(null),
    eyes = useRef<THREE.Group>(null),
    smile = useRef<THREE.Group>(null);
  const blend = useRef(0);
  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    const walking =
      moving ||
      action === "run" ||
      (!controls.blocked &&
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
    blend.current = THREE.MathUtils.damp(blend.current, walking ? 1 : 0, 9, dt);
    const walk = Math.sin(t * 10) * 0.46 * blend.current,
      romantic = ["hug", "kiss", "hands", "pat"].includes(action),
      hug = action === "hug";
    if (body.current) {
      body.current.position.y =
        Math.sin(t * 2) * 0.009 +
        Math.abs(Math.sin(t * 10)) * 0.024 * blend.current;
      body.current.rotation.x = THREE.MathUtils.damp(
        body.current.rotation.x,
        action === "kiss" ? 0.1 : hug ? 0.045 : 0,
        7,
        dt,
      );
    }
    if (head.current)
      head.current.rotation.z = THREE.MathUtils.damp(
        head.current.rotation.z,
        romantic ? -0.065 : Math.sin(t * 1.3) * 0.018,
        5,
        dt,
      );
    if (hair.current) {
      hair.current.rotation.x = Math.sin(t * 10 + 0.6) * 0.025 * blend.current;
      hair.current.rotation.z = Math.sin(t * 2) * 0.012;
    }
    for (const [arm, side] of [
      [left, 1],
      [right, -1],
    ] as const) {
      if (!arm.current) continue;
      arm.current.rotation.x = THREE.MathUtils.damp(
        arm.current.rotation.x,
        romantic ? (hug ? -1.3 : -1.12) : walk * side,
        8,
        dt,
      );
      arm.current.rotation.z = THREE.MathUtils.damp(
        arm.current.rotation.z,
        action === "wave" && side === -1
          ? -2.25 + Math.sin(t * 7) * 0.25
          : action === "pat" && side === -1
            ? -1.25
            : hug
              ? side * 0.3
              : side * 0.045,
        8,
        dt,
      );
    }
    for (const [leg, side] of [
      [legL, -1],
      [legR, 1],
    ] as const)
      if (leg.current)
        leg.current.rotation.x = THREE.MathUtils.damp(
          leg.current.rotation.x,
          action === "sit" ? -1.2 : walk * side,
          10,
          dt,
        );
    if (eyes.current) {
      const blink = t % 4.8;
      eyes.current.scale.y = blink < 0.14 ? 0.12 : 1;
    }
    if (smile.current)
      smile.current.scale.x = THREE.MathUtils.damp(
        smile.current.scale.x,
        romantic || action === "wave" ? 1.25 : 1,
        7,
        dt,
      );
  });
  return (
    <group ref={body} name="doyeon-refined">
      <group ref={head} position={[0, 1.55, 0]}>
        <group position={[0, -1.55, 0]}>
          <group ref={hair}>
            <Hair />
          </group>
          <Soft
            p={[0, 1.55, 0.091]}
            s={[0.332, 0.326, 0.291]}
            c={colors.skin}
          />
          {[-1, 1].map((side) => (
            <Soft
              key={side}
              p={[side * 0.326, 1.52, 0.075]}
              s={[0.058, 0.078, 0.055]}
              c={colors.skin}
            />
          ))}
          <group ref={eyes} position={[0, 1.565, 0]}>
            {[-1, 1].map((side) => (
              <group key={side}>
                <Soft
                  p={[side * 0.124, 0, 0.351]}
                  s={[0.059, 0.077, 0.022]}
                  c="#3a2822"
                />
                <Soft
                  p={[side * 0.124, -0.012, 0.369]}
                  s={[0.044, 0.054, 0.01]}
                  c="#76503a"
                />
                <Soft
                  p={[side * 0.124, 0.007, 0.378]}
                  s={[0.025, 0.042, 0.008]}
                  c="#2d2422"
                />
                <Soft
                  p={[side * 0.11, 0.028, 0.383]}
                  s={[0.017, 0.021, 0.006]}
                  c="#fff8ee"
                />
                <Soft
                  p={[side * 0.141, -0.025, 0.382]}
                  s={[0.007, 0.009, 0.005]}
                  c="#f4d6b0"
                />
                <Soft
                  p={[side * 0.126, 0.069, 0.349]}
                  s={[0.062, 0.012, 0.016]}
                  c="#493127"
                  rotation={[0, 0, side * -0.1]}
                />
              </group>
            ))}
          </group>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Soft
                p={[side * 0.207, 1.474, 0.316]}
                s={[0.062, 0.026, 0.009]}
                c={romanticColor(action)}
              />
              <Soft
                p={[side * 0.127, 1.683, 0.324]}
                s={[0.052, 0.009, 0.01]}
                c="#78513d"
                rotation={[0, 0, side * -0.08]}
              />
            </group>
          ))}
          <Soft
            p={[0, 1.502, 0.384]}
            s={[0.022, 0.025, 0.019]}
            c={colors.skin}
          />
          <group ref={smile} position={[0, 1.438, 0.365]}>
            <mesh rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.041, 0.008, 6, 18, Math.PI]} />
              <meshStandardMaterial color="#a15f59" />
            </mesh>
          </group>
        </group>
      </group>
      <Soft p={[0, 1.262, 0.01]} s={[0.075, 0.09, 0.075]} c={colors.skin} />
      {/* A fitted bodice and gently flared, geometrically pleated navy skirt. */}
      <mesh position={[0, 1.01, 0.012]} castShadow>
        <cylinderGeometry args={[0.176, 0.211, 0.44, 20]} />
        <meshStandardMaterial color={colors.navy} roughness={0.9} />
      </mesh>
      <PleatedSkirt />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Soft
            p={[side * 0.176, 1.027, 0.025]}
            s={[0.106, 0.265, 0.173]}
            c={colors.cream}
          />
          <Soft
            p={[side * 0.09, 1.105, 0.174]}
            s={[0.025, 0.17, 0.028]}
            c="#f9edda"
            rotation={[0, 0, side * -0.13]}
          />
          <Soft
            p={[side * 0.177, 0.79, 0.034]}
            s={[0.109, 0.045, 0.176]}
            c="#e8d7bd"
          />
          {[0, 1, 2, 3].map((i) => (
            <Soft
              key={i}
              p={[side * (0.1 + i * 0.044), 0.79, 0.203]}
              s={[0.006, 0.033, 0.005]}
              c={colors.rib}
              detail
            />
          ))}
        </group>
      ))}
      <Soft p={[0, 1.045, -0.07]} s={[0.25, 0.245, 0.14]} c={colors.cream} />
      <KnitDetails />
      {[1.17, 1.065, 0.96, 0.855].map((y) => (
        <Soft
          key={y}
          p={[0.095, y, 0.21]}
          s={[0.016, 0.016, 0.008]}
          c="#b9936b"
        />
      ))}
      <mesh position={[0, 1.188, 0.193]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.005, 5, 16, Math.PI]} />
        <meshStandardMaterial
          color="#cda76b"
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
      {[-1, 1].map((side, i) => (
        <group
          key={side}
          ref={i === 0 ? left : right}
          position={[side * 0.28, 1.19, 0]}
        >
          <Soft p={[0, -0.175, 0]} s={[0.112, 0.235, 0.117]} c={colors.cream} />
          <Soft p={[0, -0.355, 0.006]} s={[0.103, 0.052, 0.111]} c="#e7d5b9" />
          {[-2, -1, 0, 1, 2].map((x) => (
            <Soft
              key={x}
              p={[x * 0.032, -0.355, 0.108]}
              s={[0.005, 0.04, 0.004]}
              c={colors.rib}
              detail
            />
          ))}
          <Soft
            p={[0, -0.431, 0.016]}
            s={[0.067, 0.084, 0.065]}
            c={colors.skin}
          />
          <Soft
            p={[side * -0.05, -0.41, 0.048]}
            s={[0.03, 0.045, 0.028]}
            c={colors.skin}
          />
          {rings && (
            <mesh position={[0, -0.451, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.032, 0.01, 6, 16]} />
              <meshStandardMaterial
                color="#e5c16e"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          )}
        </group>
      ))}
      {[-1, 1].map((side, i) => (
        <group
          key={side}
          ref={i === 0 ? legL : legR}
          position={[side * 0.124, 0.61, 0]}
        >
          <Soft p={[0, -0.19, 0]} s={[0.083, 0.235, 0.086]} c={colors.skin} />
          <Soft p={[0, -0.385, 0.008]} s={[0.087, 0.113, 0.093]} c="#f6ebd9" />
          <Soft p={[0, -0.48, 0.052]} s={[0.119, 0.078, 0.17]} c="#373135" />
          <Soft p={[0, -0.524, 0.052]} s={[0.12, 0.026, 0.172]} c="#262429" />
          <Soft p={[0, -0.443, 0.041]} s={[0.117, 0.021, 0.064]} c="#4c4140" />
        </group>
      ))}
    </group>
  );
}
function romanticColor(action: Action) {
  return ["hug", "kiss", "hands", "pat"].includes(action)
    ? "#eaa3a0"
    : "#eab2a5";
}
