import { ui } from "../content/gameContent";
import { useState, useRef } from "react";
import { controls } from "../systems/store";
export default function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  function release() {
    controls.x = controls.z = 0;
    setKnob({ x: 0, y: 0 });
  }
  return (
    <div
      className="joystick"
      ref={base}
      role="application"
      aria-label={ui.text63}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <div
        className="joystick-knob"
        style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}
      />
      <span>{ui.text64}</span>
    </div>
  );
  function move(e: React.PointerEvent) {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    const d = Math.hypot(x, y);
    if (d > 34) {
      x *= 34 / d;
      y *= 34 / d;
    }
    setKnob({ x, y });
    controls.x = x / 34;
    controls.z = y / 34;
  }
}
