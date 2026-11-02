import { useState, useEffect } from "react";
export default function Typewriter({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => Math.min(text.length, v + 1)), 32);
    return () => clearInterval(id);
  }, [text]);
  return (
    <p
      className="typed"
      onClick={() => {
        if (n < text.length) setN(text.length);
        else onDone?.();
      }}
    >
      {text.slice(0, n)}
      <span className="caret">{n < text.length ? "▎" : ""}</span>
    </p>
  );
}
