import { useState } from "react";
import { memories } from "../data/memories";
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
        <button className="close" onClick={onClose} aria-label="사진 닫기">
          ×
        </button>
        <div className="polaroid">
          {src && !broken ? (
            <img src={src} onError={() => setBroken(true)} alt={m.title} />
          ) : (
            <div className="empty-photo">
              <span>♡</span>
              <p>
                우리의 사진이
                <br />
                들어올 자리
              </p>
              <small>이 순간을 오래오래</small>
            </div>
          )}
          <h2>{m.title}</h2>
          <p>{m.caption}</p>
        </div>
        <p className="eyebrow">
          추억 한 장 · {page + 1} / {m.photos.length}
        </p>
        {page < m.photos.length - 1 ? (
          <button
            className="primary"
            onClick={() => {
              setPage(page + 1);
              setBroken(false);
            }}
          >
            다음 추억 ♡
          </button>
        ) : (
          <button className="primary" onClick={onFinish ?? onClose}>
            {onFinish ? "마음속에 간직하기 ♡" : "다시 걸어가기"}
          </button>
        )}
      </section>
    </div>
  );
}
