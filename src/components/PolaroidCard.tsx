import { useEffect, useState } from "react";
export default function PolaroidCard({
  src,
  title,
  caption,
  empty,
}: {
  src: string | null;
  title: string;
  caption: string;
  empty: { first: string; second: string; note: string };
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  return (
    <div className="polaroid">
      {src && !broken ? (
        <img
          src={src}
          alt={title}
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="empty-photo">
          <span>♡</span>
          <p>
            {empty.first}
            <br />
            {empty.second}
          </p>
          <small>{empty.note}</small>
        </div>
      )}
      <h2>{title}</h2>
      <p>{caption}</p>
    </div>
  );
}
