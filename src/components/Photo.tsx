import { ui } from "../content/gameContent";
import { useState } from "react";
import { memories } from "../content/gameContent";
export default function Photo({
  index,
  onClose,
  onFinish,
}: {
  index: number;
  onClose: () => void;
  onFinish?: () => void;
}) {
  const [page, setPage] = useState(0),
    [broken, setBroken] = useState(false);
  const m = memories[index],
    src = m.photos[page];
  return (
    <div className="veil photo-veil">
      <section className="photo-modal">
        <button className="close" onClick={onClose} aria-label={ui.text55}>
          ×
        </button>
        <div className="polaroid">
          {src && !broken ? (
            <img src={src} onError={() => setBroken(true)} alt={m.title} />
          ) : (
            <div className="empty-photo">
              <span>♡</span>
              <p>
                {ui.text56}
                <br />
                {ui.text57}
              </p>
              <small>{ui.text58}</small>
            </div>
          )}
          <h2>{m.title}</h2>
          <p>{m.caption}</p>
        </div>
        <p className="eyebrow">
          {ui.text59} {page + 1} / {m.photos.length}
        </p>
        {page < m.photos.length - 1 ? (
          <button
            className="primary"
            onClick={() => {
              setPage(page + 1);
              setBroken(false);
            }}
          >
            {ui.text60}
          </button>
        ) : (
          <button className="primary" onClick={onFinish ?? onClose}>
            {onFinish ? ui.text61 : ui.text62}
          </button>
        )}
      </section>
    </div>
  );
}
