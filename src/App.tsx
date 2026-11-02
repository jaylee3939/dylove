import { ui, characters } from "./content/gameContent";
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
} from "./content/gameContent";
import type { Spot } from "./data/story";
import { memories } from "./content/gameContent";
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
        {ui.text01}
        <br />
        {ui.text02}
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
      notify(ui.text03);
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
      <div className="stage-transition" key={`transition-${game.stage}`} />
      {!playing ? (
        <div className="title-screen">
          <div className="title-note">{ui.text04}</div>
          <div className="title-heart">♡</div>
          <p className="eyebrow">{ui.text05}</p>
          <h1>
            {ui.text06}
            <br />
            <em>{ui.text07}</em>
            <span>♡</span>
          </h1>
          <p className="subtitle">{ui.text08}</p>
          <div className="title-divider">✦</div>
          <button className="primary" onClick={() => start()}>
            {game.started ? ui.text09 : ui.text10}
          </button>
          {game.started && (
            <button
              className="text-button"
              onClick={() => setConfirmReset(true)}
            >
              {ui.text11}
            </button>
          )}
          <small className="title-foot">{ui.text12}</small>
        </div>
      ) : (
        <>
          <header className="hud">
            <div>
              <p className="eyebrow">{ui.text13}</p>
              <h2>{stage.name}</h2>
              <span className="stage-sub">{stage.subtitle}</span>
            </div>
            <div className="hud-actions">
              <button
                onClick={() => {
                  audioStart(!game.muted);
                  game.toggleMute();
                }}
                aria-label={game.muted ? ui.text14 : ui.text15}
              >
                {game.muted ? ui.text16 : ui.text17}
              </button>
              <button onClick={() => setPanel("menu")} aria-label={ui.text18}>
                ☰
              </button>
            </div>
          </header>
          <div className="progress">
            <span>
              {ui.text19} {game.hearts.length}/5
            </span>
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
                  ? ui.text20
                  : game.hearts.includes(game.stage)
                    ? ui.text21
                    : ready
                      ? ui.text22
                      : ui.text23}
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
                      ? ui.text24
                      : nearest.label
                    : ui.text25}
                  <small>{ui.text26}</small>
                </button>
              </div>
              <p className="keyboard-hint">{ui.text27}</p>
              {game.hearts.includes(game.stage) && game.stage < 4 && (
                <button
                  className="next-stage primary"
                  onClick={() => visit(game.stage + 1)}
                >
                  {ui.text28}
                </button>
              )}
              {game.hearts.includes(4) && game.stage === 4 && (
                <button
                  className="next-stage primary"
                  onClick={() => setPanel("letter")}
                >
                  {ui.text29}
                </button>
              )}
            </>
          )}
          {dialog && (
            <div className="dialog-wrap">
              <div className="dialog-card">
                <span className="eyebrow">
                  {dialog.lines[dialog.at].startsWith(characters.jaeyeong)
                    ? ui.text30
                    : ui.text31}
                </span>
                <Typewriter
                  key={dialog.lines[dialog.at]}
                  text={dialog.lines[dialog.at]}
                  onDone={next}
                />
                {choices ? (
                  <div className="choices">
                    {stage.choices!.map((c, i) => (
                      <button key={`choice-${i}`} onClick={() => choose(i)}>
                        {c.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="dialog-next" onClick={next}>
                    {dialog.at < dialog.lines.length - 1
                      ? ui.text32
                      : ui.text33}{" "}
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
          key={`photo-${photo}`}
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
              aria-label={ui.text34}
              onClick={() => setPanel(null)}
            >
              ×
            </button>
            {panel === "letter" ? (
              <>
                <span className="eyebrow">{ui.text35}</span>
                <h2>{ui.text36}</h2>
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
                  {ui.text37}
                </button>
                <button className="secret-door" onClick={() => visit(5)}>
                  {ui.text38}
                  <small>{ui.text39}</small>
                </button>
              </>
            ) : panel === "album" ? (
              <>
                <span className="eyebrow">{ui.text40}</span>
                <h2>{ui.text41}</h2>
                <div className="album-grid">
                  {memories.slice(0, 5).map((m, i) => (
                    <button
                      key={`memory-${i}`}
                      disabled={!game.album.includes(i)}
                      onClick={() => setPhoto(i)}
                    >
                      <span>{game.album.includes(i) ? "♡" : "🔒"}</span>
                      {m.title}
                      <small>
                        {game.album.includes(i) ? ui.text42 : ui.text43}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">{ui.text44}</span>
                <h2>{ui.text45}</h2>
                <button className="primary" onClick={() => setPanel(null)}>
                  {ui.text46}
                </button>
                <div className="stage-list">
                  {stages.map((s, i) => (
                    <button
                      key={`stage-${i}`}
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
                  <button onClick={() => setPanel("album")}>{ui.text47}</button>
                )}
                <button
                  className="text-button"
                  onClick={() => setConfirmReset(true)}
                >
                  {ui.text11}
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
            {ui.text48}
            <br />
            {ui.text49}
          </h2>
          <button className="primary" onClick={() => visit(4)}>
            {ui.text50}
          </button>
        </div>
      )}
      {confirmReset && (
        <div className="veil">
          <section className="panel">
            <h2>{ui.text51}</h2>
            <p>{ui.text52}</p>
            <button
              className="primary"
              onClick={() => {
                setConfirmReset(false);
                start(true);
              }}
            >
              {ui.text53}
            </button>
            <button onClick={() => setConfirmReset(false)}>{ui.text54}</button>
          </section>
        </div>
      )}
    </main>
  );
}
