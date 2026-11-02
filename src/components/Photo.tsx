import PolaroidCard from "./PolaroidCard";
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
  const [page, setPage] = useState(0);
  const m = memories[index],
    src = m.photos[page],
    details = m.photoDetails[page] ?? m;
  return (
    <div className="veil photo-veil">
      <section className="photo-modal">
        <button className="close" onClick={onClose} aria-label={ui.text55}>
          ×
        </button>
        <PolaroidCard
          src={src}
          title={details.title}
          caption={details.caption}
          empty={{ first: ui.text56, second: ui.text57, note: ui.text58 }}
        />
        <p className="eyebrow">
          {ui.text59} {page + 1} / {m.photos.length}
        </p>
        {page < m.photos.length - 1 ? (
          <button
            className="primary"
            onClick={() => {
              setPage(page + 1);
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
