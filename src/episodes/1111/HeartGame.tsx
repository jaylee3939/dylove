const points = [
  [10, 5],
  [41, 8],
  [73, 4],
  [18, 28],
  [59, 29],
  [4, 51],
  [39, 53],
  [76, 51],
  [15, 76],
  [48, 77],
  [77, 77],
];
export default function HeartGame({
  collected,
  onCollect,
}: {
  collected: number[];
  onCollect: (id: number) => void;
}) {
  return (
    <section className="eleven-heart-game" aria-label="11개 하트 수집 미니게임">
      <div className="eleven-heart-count">
        <span>받아준 내 마음</span>
        <strong aria-live="polite">{collected.length} / 11 ♡</strong>
      </div>
      <div
        className="eleven-heart-meter"
        role="progressbar"
        aria-label="하트 수집 진행"
        aria-valuenow={collected.length}
        aria-valuemin={0}
        aria-valuemax={11}
      >
        <span style={{ width: `${(collected.length / 11) * 100}%` }} />
      </div>
      <p>떠 있는 하트를 눌러줘. 천천히, 하나씩 받아도 괜찮아 ♡</p>
      <div className="eleven-heart-board">
        {points.map(([x, y], id) => (
          <button
            key={id}
            aria-label={`하트 ${id + 1} 받기`}
            disabled={collected.includes(id)}
            className={
              "eleven-heart " + (collected.includes(id) ? "collected" : "")
            }
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: collected.includes(id) ? "0s" : `${id * 0.08}s`,
            }}
            onClick={() => onCollect(id)}
          >
            <span>♥</span>
          </button>
        ))}
        {collected.length === 11 && (
          <div className="eleven-all-hearts" role="status">
            열한 개 전부, 네 마음에 도착했어 ♡
          </div>
        )}
      </div>
    </section>
  );
}
