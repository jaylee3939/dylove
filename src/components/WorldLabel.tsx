import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
// Simple projected DOM labels avoid nested React roots inside the Three renderer.
export default function WorldLabel({
  position,
  text,
  className = "spot-label",
  distanceFactor = 12,
  onClick,
}: {
  position: [number, number, number];
  text: string;
  className?: string;
  distanceFactor?: number;
  onClick?: () => void;
}) {
  const group = useRef<THREE.Group>(null),
    element = useRef<HTMLElement | null>(null);
  const { gl } = useThree();
  const point = useRef(new THREE.Vector3());
  useEffect(() => {
    const el = document.createElement(onClick ? "button" : "div");
    el.textContent = text;
    el.className = className;
    Object.assign(el.style, {
      position: "absolute",
      top: "0",
      left: "0",
      pointerEvents: onClick ? "auto" : "none",
      transformOrigin: "center",
      zIndex: "2",
    });
    if (onClick) el.addEventListener("click", onClick);
    gl.domElement.parentElement?.append(el);
    element.current = el;
    return () => {
      el.remove();
      element.current = null;
    };
  }, [gl, text, className, onClick]);
  useFrame(({ camera, size }) => {
    if (!group.current || !element.current) return;
    group.current.getWorldPosition(point.current);
    const distance = point.current.distanceTo(camera.position);
    point.current.project(camera);
    const p = point.current,
      el = element.current;
    el.style.display =
      p.z > 1 || Math.abs(p.x) > 1.3 || Math.abs(p.y) > 1.3 ? "none" : "block";
    el.style.left = `${(p.x * 0.5 + 0.5) * size.width}px`;
    el.style.top = `${(-p.y * 0.5 + 0.5) * size.height}px`;
    el.style.transform = `translate(-50%,-50%) scale(${THREE.MathUtils.clamp(distanceFactor / distance, 0.55, 1.2)})`;
  });
  return <group ref={group} position={position} />;
}
