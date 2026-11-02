import Typewriter from "./components/Typewriter";
import Photo from "./components/Photo";
import Joystick from "./components/Joystick";
import { useEffect, useRef, useState, Component, type ReactNode } from "react";
import GameWorld from "./scenes/GameWorld";
import { controls, useGame } from "./systems/store";
import { audioStart, chime, mute, tone } from "./systems/audio";
import {
  stages,
  letter,
  heartMessages,
  easterEgg,
  type Spot,
} from "./data/story";
import { memories } from "./data/memories";
class WorldBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="gpu-error">
        3D 화면을 시작하지 못했어요.
        <br />
        브라우저의 그래픽 가속을 켜고 다시 열어 주세요.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const game = useGame(),
    stage = stages[game.stage];
  const [playing, setPlaying] = useState(false),
    [dialog, setDialog] = useState<{
      lines: string[];
      at: number;
      spot?: Spot;
      reaction?: boolean;
    } | null>(null),
    [choices, setChoices] = useState(false),
    [photo, setPhoto] = useState<number | null>(null),
    [photoFinish, setPhotoFinish] = useState(false),
    [nearest, setNearest] = useState<Spot | null>(null),
    [toast, setToast] = useState(""),
    [panel, setPanel] = useState<"album" | "menu" | "letter" | null>(null),
    [dim, setDim] = useState(false),
    [secret, setSecret] = useState(false),
    [confirmReset, setConfirmReset] = useState(false);
  const coffee = useRef(0);
  const ready = game.completed.includes(`${game.stage}:main`);
  const busy = !!dialog || photo !== null || !!panel || !playing || secret;
  useEffect(() => {
    controls.blocked = busy;
    return () => {
      controls.blocked = true;
    };
  }, [busy]);
  useEffect(() => {
    const id = setInterval(() => {
      const p = controls.position;
      const n = stage.spots.find(
        (s) => Math.hypot(p.x - s.position[0], p.z - s.position[1]) < 1.9,
      );
      setNearest(n ?? null);
    }, 100);
    return () => clearInterval(id);
  }, [stage]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      controls.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && !e.repeat)
        document.getElementById("interact")?.click();
    };
    const up = (e: KeyboardEvent) => controls.keys.delete(e.key.toLowerCase());
    const blur = () => {
      controls.keys.clear();
      controls.x = controls.z = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    mute(game.muted);
  }, [game.muted]);
  function start(reset = false) {
    audioStart(game.muted);
    if (reset) game.reset();
    else game.start();
    setPlaying(true);
    setPanel(null);
    setSecret(false);
    setDim(false);
    const s = reset ? 0 : game.stage;
    setDialog({ lines: stages[s].intro, at: 0 });
  }
  function visit(n: number) {
    game.setStage(n);
    setPanel(null);
    setDim(false);
    setSecret(false);
    game.setAction("idle");
    setDialog({ lines: stages[n].intro, at: 0 });
  }
  function notify(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 3500);
  }
  function interact() {
    if (busy || !nearest) return;
    tone(523);
    if (
      nearest.main &&
      ready &&
      game.stage < 5 &&
      !game.hearts.includes(game.stage)
    ) {
      game.collect();
      chime();
      notify(heartMessages[game.stage]);
      if (game.stage === 4) {
        setPhoto(4);
        setPhotoFinish(true);
      }
      return;
    }
    if (nearest.id === "coffee") {
      coffee.current++;
      if (coffee.current >= 3) {
        setDialog({ lines: [easterEgg], at: 0 });
        game.complete("coffee-secret");
        return;
      }
    }
    if (game.stage === 5 && nearest.id === "lamp") setDim(!dim);
    if (game.stage === 5 && nearest.id === "bed") game.setAction("sit");
    if (game.stage === 4 && nearest.main) game.setAction("wave");
    setDialog({ lines: nearest.lines, at: 0, spot: nearest });
  }
  function next() {
    if (!dialog) return;
    if (dialog.at < dialog.lines.length - 1) {
      setDialog({ ...dialog, at: dialog.at + 1 });
      if (game.stage === 4) game.setAction(dialog.at === 0 ? "run" : "hug");
      return;
    }
    if (dialog.reaction) {
      setDialog(null);
      if (game.stage === 5) {
        if (game.action === "sit") {
          setDim(true);
          setSecret(true);
        } else setTimeout(() => game.setAction("idle"), 3500);
      } else finishMemory();
      return;
    }
    if (dialog.spot?.main) {
      if (stage.choices) {
        setChoices(true);
        return;
      }
      if (game.stage === 4) game.setAction("hug");
      finishMemory();
    } else {
      setDialog(null);
      game.setAction("idle");
    }
  }
  function finishMemory() {
    game.complete(`${game.stage}:main`);
    setDialog(null);
    setChoices(false);
    if (game.stage < 4) {
      setPhoto(game.stage);
      setPhotoFinish(false);
    } else if (game.stage === 4) {
      notify("우리의 마지막 추억 하트를 받아줘 ♡");
    }
  }
  function choose(i: number) {
    const c = stage.choices![i];
    if (game.stage === 2) game.complete("rings-selected");
    setChoices(false);
    game.setAction(c.action);
    setDialog({ lines: [c.reply], at: 0, reaction: true });
    chime();
  }
  function closePhoto() {
    setPhoto(null);
    if (photoFinish) {
      setToast("");
      setPhotoFinish(false);
      setPanel("letter");
    } else game.setAction("idle");
  }
  return (
    <main className={dim ? "game dim" : "game"}>
      <WorldBoundary>
        <GameWorld
          ready={ready}
          nearest={nearest?.id ?? null}
          dim={dim}
          onDoor={() => visit(5)}
        />
      </WorldBoundary>
      <div className="grain" />
      <div className="stage-transition" key={game.stage} />
      {!playing ? (
        <div className="title-screen">
          <div className="title-note">재영이가 도연이에게</div>
          <div className="title-heart">♡</div>
          <p className="eyebrow">우리 둘의 작은 모험</p>
          <h1>
            도연아,
            <br />
            <em>사랑해</em>
            <span>♡</span>
          </h1>
          <p className="subtitle">도연아, 널 기다리는 사람이 있어.</p>
          <div className="title-divider">✦</div>
          <button className="primary" onClick={() => start()}>
            {game.started ? "이어서 만나러 가기 ♡" : "만나러 가기 ♡"}
          </button>
          {game.started && (
            <button
              className="text-button"
              onClick={() => setConfirmReset(true)}
            >
              처음부터 다시 걷기
            </button>
          )}
          <small className="title-foot">다섯 번의 추억, 하나의 마음</small>
        </div>
      ) : (
        <>
          <header className="hud">
            <div>
              <p className="eyebrow">도연아, 사랑해 ♡</p>
              <h2>{stage.name}</h2>
              <span className="stage-sub">{stage.subtitle}</span>
            </div>
            <div className="hud-actions">
              <button
                onClick={() => {
                  audioStart(!game.muted);
                  game.toggleMute();
                }}
                aria-label={game.muted ? "소리 켜기" : "소리 끄기"}
              >
                {game.muted ? "♪ 꺼짐" : "♫ 켜짐"}
              </button>
              <button onClick={() => setPanel("menu")} aria-label="여행 메뉴">
                ☰
              </button>
            </div>
          </header>
          <div className="progress">
            <span>우리의 추억 ♡ {game.hearts.length}/5</span>
            <div>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={game.hearts.includes(i) ? "filled" : ""}
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
          {!busy && (
            <>
              <div className="objective">
                {game.stage === 5
                  ? "우리만의 밤을 즐겨 봐 ♡"
                  : game.hearts.includes(game.stage)
                    ? "추억을 간직했어 ♡"
                    : ready
                      ? "반짝이는 하트 가까이에서 받아줘 ♡"
                      : "분홍빛 표식을 찾아 걸어가 봐 ♡"}
              </div>
              <div className="controls">
                <Joystick />
                <button
                  id="interact"
                  className={"interact " + (!nearest ? "disabled" : "")}
                  disabled={!nearest}
                  onClick={interact}
                >
                  <span>
                    {ready && nearest?.main && !game.hearts.includes(game.stage)
                      ? "♡"
                      : "✦"}
                  </span>
                  {nearest
                    ? ready &&
                      nearest.main &&
                      !game.hearts.includes(game.stage) &&
                      game.stage < 5
                      ? "하트 받기"
                      : nearest.label
                    : "가까이 가기"}
                  <small>이야기 · E</small>
                </button>
              </div>
              <p className="keyboard-hint">방향키 / WASD로 걷기 · E로 이야기</p>
              {game.hearts.includes(game.stage) && game.stage < 4 && (
                <button
                  className="next-stage primary"
                  onClick={() => visit(game.stage + 1)}
                >
                  다음 추억으로 →
                </button>
              )}
              {game.hearts.includes(4) && game.stage === 4 && (
                <button
                  className="next-stage primary"
                  onClick={() => setPanel("letter")}
                >
                  재영이의 편지 읽기 ♡
                </button>
              )}
            </>
          )}
          {dialog && (
            <div className="dialog-wrap">
              <div className="dialog-card">
                <span className="eyebrow">
                  {dialog.lines[dialog.at].startsWith("재영")
                    ? "재영이의 마음"
                    : "우리의 이야기"}
                </span>
                <Typewriter
                  key={dialog.lines[dialog.at]}
                  text={dialog.lines[dialog.at]}
                  onDone={next}
                />
                {choices ? (
                  <div className="choices">
                    {stage.choices!.map((c, i) => (
                      <button key={c.text} onClick={() => choose(i)}>
                        {c.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="dialog-next" onClick={next}>
                    {dialog.at < dialog.lines.length - 1
                      ? "계속 듣기"
                      : "좋아 ♡"}{" "}
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {photo !== null && (
        <Photo
          key={photo}
          index={photo}
          onClose={closePhoto}
          onFinish={photoFinish ? closePhoto : undefined}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
      {panel && (
        <div className="veil">
          <section className={"panel " + (panel === "letter" ? "letter" : "")}>
            <button
              className="close"
              aria-label="닫기"
              onClick={() => setPanel(null)}
            >
              ×
            </button>
            {panel === "letter" ? (
              <>
                <span className="eyebrow">너에게 닿기를</span>
                <h2>내가 제일 사랑하는 너에게</h2>
                <div className="letter-body">
                  {letter.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className={i >= 10 && i <= 12 ? "slow-line" : ""}
                      style={{
                        animationDelay: `${Math.max(0, i - 10) * 1.8}s`,
                      }}
                    >
                      {line || "\u00a0"}
                    </div>
                  ))}
                </div>
                <button className="primary" onClick={() => setPanel("album")}>
                  우리의 추억 다시 보기 ♡
                </button>
                <button className="secret-door" onClick={() => visit(5)}>
                  ⚿ 황금 열쇠 · 도연이만 입장 가능 ♡
                  <small>
                    어른인 우리 둘만의 다정한 비밀 · 선택해서 들어가기
                  </small>
                </button>
              </>
            ) : panel === "album" ? (
              <>
                <span className="eyebrow">마음에 모아 둔 순간들</span>
                <h2>우리의 추억 앨범</h2>
                <div className="album-grid">
                  {memories.slice(0, 5).map((m, i) => (
                    <button
                      key={m.title}
                      disabled={!game.album.includes(i)}
                      onClick={() => setPhoto(i)}
                    >
                      <span>{game.album.includes(i) ? "♡" : "🔒"}</span>
                      {m.title}
                      <small>
                        {game.album.includes(i)
                          ? "추억 펼치기"
                          : "아직 만나지 않은 추억"}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">잠깐 쉬어 가도 좋아</span>
                <h2>우리의 여행</h2>
                <button className="primary" onClick={() => setPanel(null)}>
                  계속 걸어가기
                </button>
                <div className="stage-list">
                  {stages.map((s, i) => (
                    <button
                      key={s.name}
                      disabled={
                        i === 5
                          ? game.hearts.length < 5
                          : i > 0 && !game.hearts.includes(i - 1)
                      }
                      onClick={() => visit(i)}
                    >
                      <span>{i === 5 ? "⚿" : `0${i + 1}`}</span>
                      {s.name}
                      <b>{game.hearts.includes(i) ? "♥" : "→"}</b>
                    </button>
                  ))}
                </div>
                {game.hearts.length === 5 && (
                  <button onClick={() => setPanel("album")}>
                    추억 앨범 펼치기 ♡
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() => setConfirmReset(true)}
                >
                  처음부터 다시 걷기
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {secret && (
        <div className="secret-ending">
          <span>♡</span>
          <h2>
            그다음 이야기는
            <br />
            우리 둘만 아는 걸로 ♡
          </h2>
          <button className="primary" onClick={() => visit(4)}>
            우리의 추억으로 돌아가기
          </button>
        </div>
      )}
      {confirmReset && (
        <div className="veil">
          <section className="panel">
            <h2>처음부터 다시 걸을까?</h2>
            <p>모아 둔 하트와 추억 기록이 지워져.</p>
            <button
              className="primary"
              onClick={() => {
                setConfirmReset(false);
                start(true);
              }}
            >
              응, 다시 만나러 가기 ♡
            </button>
            <button onClick={() => setConfirmReset(false)}>
              아니, 간직할래
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
