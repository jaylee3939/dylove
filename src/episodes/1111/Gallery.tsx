import { useState } from "react";
import PolaroidCard from "../../components/PolaroidCard";
import type { MemoryPhoto } from "../../content/defaults";
export default function Gallery({ photos }: { photos: MemoryPhoto[] }) {
  const [index, setIndex] = useState(0);
  const actual = photos.filter((p) => p.src);
  const photo = actual[Math.min(index, actual.length - 1)];
  return (
    <section className="eleven-gallery" aria-label="스페셜 추억 사진">
      {photo ? (
        <>
          <PolaroidCard
            src={photo.src}
            title={photo.title}
            caption={photo.caption}
            empty={{
              first: "사진 대신 남은",
              second: "우리의 마음",
              note: "함께여서 빛나던 순간",
            }}
          />
          <div className="eleven-gallery-controls">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ← 이전 사진
            </button>
            <span>
              {index + 1} / {actual.length}
            </span>
            <button
              disabled={index >= actual.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              다음 사진 →
            </button>
          </div>
        </>
      ) : (
        <div className="eleven-memory-sky">
          <span>≈ ♡ ≈</span>
          <p>
            사진이 없어도 선명한 순간.
            <br />
            너와 함께였다는 기억만으로 충분해.
          </p>
        </div>
      )}
    </section>
  );
}
