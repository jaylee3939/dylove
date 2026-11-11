import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { episode } from "./content";
import {
  freshProgress,
  loadProgress,
  saveProgress,
  chapterReady,
  collectHeart,
  nextChapter,
  type EpisodeProgress,
} from "./progress";
import { audioStart, mute, chime, tone } from "../../systems/audio";
import { memories, characters } from "../../content/gameContent";
import { stageIds } from "../../content/defaults";
import type { Action } from "../../data/story";
import ExploreWorld from "./ExploreWorld";
import { EXPLORE_SAVE_KEY } from "./exploration";
import Gallery from "./Gallery";
import "./episode.css";
const Scene = lazy(() => import("./EpisodeScene"));
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="eleven-scene-fallback">
        ♡<small>너와 나의 이야기는 계속돼.</small>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Episode() {
  const [progress, setProgress] = useState(loadProgress),
    [action, setAction] = useState<Action>("idle"),
    [reaction, setReaction] = useState(""),
    [confirmReset, setConfirmReset] = useState(false),
    [storageError, setStorageError] = useState(false),
    [celebration, setCelebration] = useState(false),
    [wrong, setWrong] = useState<Record<string, string>>({}),
    [openMemories, setOpenMemories] = useState<string[]>([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [travelMenu, setTravelMenu] = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const cinematicTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [activeMission, setActiveMission] = useState("");
  const current = useRef(progress),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    panel = useRef<HTMLElement>(null);
  const chapter = episode.chapters[progress.chapter],
    line = chapter.lines[progress.line],
    talking = progress.line < chapter.lines.length;
  const date = episode.chapters[4].choices?.find(
    (c) => c.id === progress.dateChoice,
  );
  const cover =
    memories[stageIds.findIndex((id) => id === episode.coverMemory.stageId)]
      ?.photos[episode.coverMemory.photoIndex] ?? null;
  useEffect(() => {
    const previous = document.title;
    document.title = episode.title;
    return () => {
      document.title = previous;
      clearTimeout(timer.current);
      clearTimeout(burstTimer.current);
      clearTimeout(cinematicTimer.current);
    };
  }, []);
  useEffect(() => {
    setWrong({});
    setOpenMemories([]);
    clearTimeout(cinematicTimer.current);
    setCinematic(false);
    setEventOpen(progress.screen === "ending");
    setReaction("");
    setAction(progress.screen === "ending" ? "hug" : "idle");
    setCelebration(progress.screen === "ending");
    panel.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [progress.chapter, progress.screen]);
  function update(change: (p: EpisodeProgress) => EpisodeProgress) {
    const next = change(current.current);
    if (next === current.current) return;
    current.current = next;
    setProgress(next);
    setStorageError(!saveProgress(next));
  }
  function burst() {
    setCelebration(true);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setCelebration(false), 1600);
  }
  function pose(next: Action, text = "", duration = 3200) {
    audioStart(current.current.muted);
    setAction(next);
    setReaction(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAction("idle");
      setReaction("");
    }, duration);
  }
  function start() {
    audioStart(progress.muted);
    update((p) => ({ ...p, screen: "play" }));
    pose("wave");
  }
  function nextLine() {
    update((p) => ({
      ...p,
      line: Math.min(p.line + 1, episode.chapters[p.chapter].lines.length),
    }));
    tone(440, 0.08, 0.018);
  }
  function answer(id: string, choice: string) {
    const q = chapter.quiz.find((q) => q.id === id);
    if (!q || current.current.answers[id]) return;
    audioStart(progress.muted);
    if (choice === q.correctChoiceId) {
      update((p) => ({ ...p, answers: { ...p.answers, [id]: choice } }));
      setWrong((v) => ({ ...v, [id]: "" }));
      pose("wave", q.correct);
      burst();
      chime();
    } else {
      setWrong((v) => ({ ...v, [id]: q.retry }));
      tone(330, 0.14, 0.025);
    }
  }
  function heart(id: number) {
    const before = current.current.hearts.length;
    update((p) => collectHeart(p, id));
    if (current.current.hearts.length > before) {
      tone(520 + id * 32, 0.25, 0.035);
      burst();
    }
  }
  function showCouple() {
    setEventOpen(false);
    setCinematic(true);
    clearTimeout(cinematicTimer.current);
    cinematicTimer.current = setTimeout(() => {
      setCinematic(false);
      setEventOpen(true);
    }, 3200);
  }
  function ceremony(step: number) {
    if (
      current.current.hearts.length !== 11 ||
      current.current.ceremony !== step
    )
      return;
    pose(
      step === 0 ? "hug" : "kiss",
      step === 0
        ? "열한 번의 마음, 이번엔 내가 꼭 안아줄게 ♡"
        : "이 마음은 뽀뽀로 답장할게 ♡",
      3500,
    );
    burst();
    update((p) => ({ ...p, ceremony: step + 1 }));
    showCouple();
  }
  function choose(id: string) {
    const choice = chapter.choices?.find((c) => c.id === id);
    if (!choice) return;
    update((p) => ({ ...p, dateChoice: id }));
    pose(choice.action, choice.reply, 4200);
    burst();
    showCouple();
  }
  function advance() {
    update(nextChapter);
    clearTimeout(timer.current);
    setAction("idle");
  }
  const ready = chapterReady(progress);
  if (episode.enabled === false)
    return (
      <main className="eleven-app">
        <h1>아직 준비 중인 선물이에요 ♡</h1>
        <a href="/">우리의 본편으로 돌아가기</a>
      </main>
    );
  return (
    <>
      {cinematic && (
        <p className="explore-cinematic-message" role="status">
          {reaction || "조금 더 가까이 ♡"}
        </p>
      )}
      {travelMenu && (
        <div
          className="eleven-modal"
          style={{ zIndex: 70 }}
          role="dialog"
          aria-label="스페셜 여행 메뉴"
        >
          <section>
            <h2>잠깐 쉬어 갈까? ♡</h2>
            <button
              className="eleven-primary"
              onClick={() => setTravelMenu(false)}
            >
              계속 탐험하기
            </button>
            {progress.screen === "ending" && (
              <button
                className="eleven-secondary"
                onClick={() => {
                  setTravelMenu(false);
                  setEventOpen(true);
                }}
              >
                편지와 엔딩 다시 보기 ♡
              </button>
            )}
            <button
              className="eleven-secondary"
              onClick={() => {
                const next = !current.current.muted;
                audioStart(next);
                mute(next);
                update((p) => ({ ...p, muted: next }));
              }}
            >
              {progress.muted ? "소리 켜기" : "소리 끄기"}
            </button>
            <button
              className="eleven-secondary"
              onClick={() => {
                if (
                  window.confirm(
                    "스페셜만 처음부터 시작할까요? 본편과 관리자 데이터는 유지돼요.",
                  )
                ) {
                  try {
                    localStorage.removeItem(EXPLORE_SAVE_KEY);
                  } catch {}
                  update(() => ({
                    ...freshProgress(),
                    muted: current.current.muted,
                  }));
                  setTravelMenu(false);
                  setEventOpen(false);
                }
              }}
            >
              스페셜 처음부터
            </button>
            <a href="/">우리의 본편으로</a>
          </section>
        </div>
      )}
      {progress.screen !== "title" && (
        <ExploreWorld
          chapter={progress.chapter}
          ending={progress.screen === "ending"}
          blocked={
            eventOpen || travelMenu || cinematic || progress.screen === "ending"
          }
          action={progress.screen === "ending" ? "hug" : action}
          hearts={progress.hearts}
          celebration={celebration || progress.screen === "ending"}
          onHeart={heart}
          onMission={(id) => {
            setActiveMission(id);
            setEventOpen(true);
          }}
          onMenu={() => {
            if (!cinematic) setTravelMenu(true);
          }}
        />
      )}
      <div
        className={
          progress.screen === "title"
            ? "special-title-wrap"
            : "special-event-wrap"
        }
        hidden={progress.screen !== "title" && !eventOpen}
      >
        {progress.screen !== "title" && (
          <button
            className="special-close-event"
            onClick={() => setEventOpen(false)}
          >
            공간으로 돌아가기 ♡
          </button>
        )}
        <main
          className={
            "eleven-app " +
            (progress.screen !== "title" ? "eleven-playing " : "") +
            (progress.screen === "ending" ? "eleven-ended" : "")
          }
          style={
            chapter.background
              ? {
                  backgroundImage: `linear-gradient(#221529b8,#221529ed), url("${chapter.background}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundAttachment: "fixed",
                }
              : undefined
          }
          data-episode="1111"
        >
          <div className="eleven-stars" aria-hidden="true" />
          <header className="eleven-header">
            <a href="/" className="eleven-back">
              ← 우리의 본편
            </a>
            <span>
              {progress.screen === "title"
                ? "11.11 · SPECIAL EPISODE"
                : `${progress.chapter + 1} / 6 · ♡ ${progress.hearts.length} / 11`}
            </span>
            <button
              aria-label={progress.muted ? "소리 켜기" : "소리 끄기"}
              onClick={() => {
                const muted = !current.current.muted;
                audioStart(muted);
                mute(muted);
                update((p) => ({ ...p, muted }));
              }}
            >
              {progress.muted ? "♪ 꺼짐" : "♫ 켜짐"}
            </button>
          </header>
          <div className="eleven-layout">
            <section className="eleven-story" ref={panel}>
              <p className="eleven-eyebrow">{episode.tagline}</p>
              <h1 aria-label={episode.title}>
                <span>LOVE YOU, DOYEON</span>
                <strong>
                  11<span>:</span>11<em>♡</em>
                </strong>
              </h1>
              <p className="eleven-subtitle">{episode.subtitle}</p>
              {progress.screen === "title" ? (
                <>
                  <div className="eleven-rule">
                    <i />
                    <span>너에게 멈춘 시간</span>
                    <i />
                  </div>
                  <h2>{episode.chapters[0].title}</h2>
                  <p className="eleven-intro">{episode.intro}</p>
                  <button className="eleven-primary" onClick={start}>
                    11:11에 만나러 가기 ♡
                  </button>
                  <p className="eleven-small">
                    천천히 즐기는 둘만의 모험 · 대략 10분의 마음 여행
                  </p>
                </>
              ) : (
                <>
                  <nav
                    className="eleven-chapter-progress"
                    aria-label="스페셜 진행 상태"
                  >
                    {episode.chapters.map((c, i) => (
                      <span
                        key={c.id}
                        className={
                          i === progress.chapter
                            ? "current"
                            : i < progress.chapter ||
                                progress.screen === "ending"
                              ? "done"
                              : ""
                        }
                        aria-current={
                          i === progress.chapter ? "step" : undefined
                        }
                      >
                        {i < progress.chapter || progress.screen === "ending"
                          ? "♥"
                          : String(i + 1).padStart(2, "0")}
                        <small>{c.title}</small>
                      </span>
                    ))}
                  </nav>
                  <div className="eleven-stage-heading">
                    <small>
                      {progress.screen === "ending"
                        ? "우리의 11:11, 완성"
                        : `${progress.chapter + 1} / ${episode.chapters.length}`}
                    </small>
                    <h2>{chapter.title}</h2>
                    <p>{chapter.description}</p>
                  </div>
                  {progress.screen === "ending" ? (
                    <section className="eleven-finale">
                      <span>♡</span>
                      <h2>
                        빼빼로는 없지만,
                        <br />내 사랑은 무제한이야.
                      </h2>
                      <p>{date?.ending}</p>
                      <p>
                        열한 개의 하트와 오늘의 마음을 전부 간직했어.
                        <br />
                        사랑해, 도연아. ❤️
                      </p>
                      <button
                        className="eleven-primary"
                        onClick={() =>
                          update((p) => ({ ...p, screen: "play" }))
                        }
                      >
                        편지 다시 읽기 ♡
                      </button>
                      <a className="eleven-main-link" href="/">
                        우리의 본편으로 돌아가기 →
                      </a>
                    </section>
                  ) : talking ? (
                    <section className="eleven-dialog" aria-label="스페셜 대화">
                      <div>
                        <span>
                          {line.speaker === "jaeyeong"
                            ? characters.jaeyeong
                            : characters.doyeon}
                        </span>
                        <small>
                          {progress.line + 1} / {chapter.lines.length}
                        </small>
                      </div>
                      <button
                        className="eleven-dialog-tap"
                        onClick={nextLine}
                        aria-label="대사 눌러 다음으로"
                      >
                        <span>{line.text}</span>
                        <small>눌러서 계속 듣기</small>
                      </button>
                      <button className="eleven-primary" onClick={nextLine}>
                        계속 듣기 →
                      </button>
                    </section>
                  ) : (
                    <>
                      {chapter.kind === "prologue" && (
                        <section className="eleven-note">
                          <h3>우리의 시간이 시작돼</h3>
                          <p>
                            바다를 보고, 서로를 알아보고, 열한 번 마음을 받아줘.
                            <br />
                            정답보다 중요한 건 함께 웃는 시간이니까.
                          </p>
                        </section>
                      )}
                      {chapter.kind === "quiz" && (
                        <>
                          <div className="eleven-quizzes">
                            {chapter.quiz.map((q, index) => {
                              if (
                                progress.chapter === 2 &&
                                activeMission &&
                                q.id !== activeMission
                              )
                                return null;
                              const unlocked = chapter.quiz
                                .slice(0, index)
                                .every(
                                  (previous) => progress.answers[previous.id],
                                );
                              return (
                                <section
                                  className="eleven-quiz"
                                  key={q.id}
                                  aria-label={`퀴즈 ${index + 1}`}
                                >
                                  <span className="eleven-quiz-number">
                                    우리만의 문제 {index + 1} /{" "}
                                    {chapter.quiz.length}
                                  </span>
                                  <h3>{q.question}</h3>
                                  {unlocked ? (
                                    <>
                                      <div className="eleven-quiz-choices">
                                        {q.choices.map((choice) => (
                                          <button
                                            key={choice.id}
                                            disabled={!!progress.answers[q.id]}
                                            className={
                                              progress.answers[q.id] ===
                                              choice.id
                                                ? "correct"
                                                : ""
                                            }
                                            onClick={() =>
                                              answer(q.id, choice.id)
                                            }
                                          >
                                            {choice.text}
                                          </button>
                                        ))}
                                      </div>
                                      {progress.answers[q.id] ? (
                                        <p
                                          className="eleven-feedback correct"
                                          role="status"
                                        >
                                          ♡ {q.correct}
                                        </p>
                                      ) : wrong[q.id] ? (
                                        <p
                                          className="eleven-feedback"
                                          role="status"
                                        >
                                          {wrong[q.id]}
                                          <small>다시 골라도 괜찮아 ♡</small>
                                        </p>
                                      ) : null}
                                    </>
                                  ) : (
                                    <p className="eleven-locked-question">
                                      앞의 문제를 먼저 함께 풀어보자 ♡
                                    </p>
                                  )}
                                </section>
                              );
                            })}
                          </div>
                          <Gallery key={chapter.id} photos={chapter.photos} />
                          {chapter.reflections && (
                            <div className="eleven-reflections">
                              {chapter.reflections.map((memory) => (
                                <button
                                  key={memory.title}
                                  className={
                                    openMemories.includes(memory.title)
                                      ? "opened"
                                      : ""
                                  }
                                  onClick={() =>
                                    setOpenMemories((previous) =>
                                      previous.includes(memory.title)
                                        ? previous.filter(
                                            (v) => v !== memory.title,
                                          )
                                        : [...previous, memory.title],
                                    )
                                  }
                                >
                                  <span>{memory.title} ♡</span>
                                  {openMemories.includes(memory.title) ? (
                                    <p>{memory.text}</p>
                                  ) : (
                                    <small>눌러서 기억 펼치기</small>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {chapter.kind === "collect" && (
                        <>
                          <section className="eleven-ceremony">
                            <h3>
                              정원에서 모은 마음 ♡ {progress.hearts.length}/11
                            </h3>
                            <p>
                              공간으로 돌아가 분홍 하트까지 직접 걸어가 봐. 열한
                              개를 모으면 재영이에게 돌아와 줘 ♡
                            </p>
                            <button
                              className="eleven-primary"
                              onClick={() => setEventOpen(false)}
                            >
                              정원 탐험하기 ♡
                            </button>
                          </section>
                          {progress.hearts.length === 11 && (
                            <section className="eleven-ceremony">
                              <h3>다 모은 마음에 답장하기 ♡</h3>
                              <p>하나씩 눌러서 우리 둘을 조금 더 가까이.</p>
                              <button
                                className="eleven-primary"
                                disabled={progress.ceremony !== 0}
                                onClick={() => ceremony(0)}
                              >
                                꼭 안아주기 ♡{progress.ceremony > 0 ? " ✓" : ""}
                              </button>
                              <button
                                className="eleven-secondary"
                                disabled={progress.ceremony !== 1}
                                onClick={() => ceremony(1)}
                              >
                                뽀뽀로 답장하기 ♡
                                {progress.ceremony > 1 ? " ✓" : ""}
                              </button>
                              {progress.ceremony === 2 && (
                                <p>포옹도, 뽀뽀도 잘 받았어 ♡</p>
                              )}
                            </section>
                          )}
                        </>
                      )}
                      {chapter.kind === "date" && (
                        <div className="eleven-dates">
                          {chapter.choices?.map((choice) => (
                            <button
                              key={choice.id}
                              className={
                                progress.dateChoice === choice.id
                                  ? "selected"
                                  : ""
                              }
                              onClick={() => choose(choice.id)}
                            >
                              {choice.text}
                              <span>
                                {progress.dateChoice === choice.id ? "♡" : "→"}
                              </span>
                            </button>
                          ))}
                          {date && (
                            <div className="eleven-date-reply" role="status">
                              <small>재영이의 대답</small>
                              <p>{date.reply}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {chapter.kind === "letter" && (
                        <section className="eleven-letter-stage">
                          {progress.hearts.length === 11 ? (
                            <>
                              {!progress.envelopeOpen ? (
                                <button
                                  className="eleven-envelope"
                                  onClick={() => {
                                    update((p) => ({
                                      ...p,
                                      envelopeOpen: true,
                                    }));
                                    chime();
                                    burst();
                                    pose("hands");
                                  }}
                                >
                                  <span>✉</span>
                                  <strong>도연이에게</strong>
                                  <small>11개의 하트로 봉투 열기 ♡</small>
                                </button>
                              ) : (
                                <>
                                  <div className="eleven-date-promise">
                                    <small>우리가 고른 다음 약속</small>
                                    <p>{date?.ending}</p>
                                  </div>
                                  <article
                                    className="eleven-love-letter"
                                    aria-label="11:11 마지막 편지"
                                  >
                                    {chapter.letter
                                      ?.split("\n")
                                      .map((text, i) => (
                                        <p key={i}>{text || "\u00a0"}</p>
                                      ))}
                                  </article>
                                  <button
                                    className="eleven-primary"
                                    onClick={() => {
                                      update((p) => ({
                                        ...p,
                                        screen: "ending",
                                      }));
                                      pose("hug", "사랑해, 도연아. ❤️", 10000);
                                      setCelebration(true);
                                    }}
                                  >
                                    다 읽었어. 꼭 안아줘 ♡
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <p>열한 개의 마음을 먼저 모아줘 ♡</p>
                          )}
                        </section>
                      )}
                      {ready && (
                        <button
                          className="eleven-primary eleven-next"
                          onClick={advance}
                        >
                          {progress.chapter === 4
                            ? "마지막 편지 만나러 가기 ♡"
                            : "다음 이야기로 →"}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {storageError && (
                <p className="eleven-storage" role="status">
                  이 브라우저에서는 진행을 저장하지 못했어. 지금은 계속 플레이할
                  수 있어.
                </p>
              )}
              <button
                className="eleven-reset"
                onClick={() => setConfirmReset(true)}
              >
                스페셜 처음으로
              </button>
            </section>
            {progress.screen === "title" && (
              <aside className="eleven-visual">
                <div className="eleven-scene">
                  <Suspense
                    fallback={
                      <div className="eleven-scene-fallback">
                        ♡<small>두 사람을 기다리는 중</small>
                      </div>
                    }
                  >
                    <SceneBoundary>
                      <Scene
                        action={action}
                        scene={
                          progress.screen === "title" ? "room" : chapter.scene
                        }
                        celebration={celebration}
                      />
                    </SceneBoundary>
                  </Suspense>
                  <div className="eleven-scene-caption">
                    {progress.screen === "title"
                      ? "오늘은 조금 더 가까이."
                      : chapter.title}
                  </div>
                </div>
                <div className="eleven-reactions">
                  {episode.reactions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => pose(item.action, item.text)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="eleven-reaction" aria-live="polite">
                  {reaction || "손끝이 닿는 만큼, 마음도 가까이 ♡"}
                </p>
                {progress.screen === "title" && cover && (
                  <figure className="eleven-keepsake">
                    <img
                      src={cover}
                      alt="기존 게임에 담아 둔 우리 두 사람의 추억"
                    />
                    <figcaption>우리가 함께한 순간 중 한 장 ♡</figcaption>
                  </figure>
                )}
                <div className="eleven-side-progress">
                  <span>우리의 마음</span>
                  <strong>{progress.hearts.length} / 11 ♡</strong>
                  <p>
                    {progress.dateChoice
                      ? "다음 데이트 약속도 간직했어."
                      : "천천히 와도 괜찮아. 여기서 기다릴게."}
                  </p>
                </div>
              </aside>
            )}
          </div>
          <footer className="eleven-footer">
            <span>재영이가, 사랑을 담아 ♡</span>
            <p>스페셜의 진행은 본편과 따로 간직해요.</p>
          </footer>
          {confirmReset && (
            <div className="eleven-modal">
              <section
                role="dialog"
                aria-modal="true"
                aria-label="스페셜 초기화 확인"
              >
                <h2>11:11을 처음부터 만날까?</h2>
                <p>
                  스페셜의 하트와 진행만 처음으로 돌아가요.
                  <br />
                  본편 진행과 편집기 초안은 그대로예요.
                </p>
                <button
                  autoFocus
                  className="eleven-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  계속 간직할래
                </button>
                <button
                  className="eleven-primary"
                  onClick={() => {
                    update(() => ({
                      ...freshProgress(),
                      muted: current.current.muted,
                    }));
                    setAction("idle");
                    setCelebration(false);
                    setReaction("");
                    clearTimeout(timer.current);
                    clearTimeout(burstTimer.current);
                    try {
                      localStorage.removeItem(EXPLORE_SAVE_KEY);
                    } catch {}
                    setConfirmReset(false);
                  }}
                >
                  스페셜 처음부터
                </button>
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
