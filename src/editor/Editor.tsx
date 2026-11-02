import { useEffect, useRef, useState } from "react";
import {
  cloneContent,
  defaultContent,
  resolveNames,
  stageLabels,
  type Content,
} from "../content/defaults";
import { validateContent } from "../content/schema";
import published from "../content/published.json";
const DRAFT_KEY = "doyeon-content-editor-v1";
const currentContent = () =>
  published === null ? cloneContent() : validateContent(published);
const copy = (value: Content): Content => JSON.parse(JSON.stringify(value));
function Field({
  label,
  value,
  onChange,
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  onFocus: (s: string) => void;
}) {
  return (
    <label className="ed-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocus(value)}
        spellCheck={false}
      />
    </label>
  );
}
export default function Editor() {
  const [initial] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return {
        content: saved ? validateContent(JSON.parse(saved)) : currentContent(),
        error: "",
      };
    } catch {
      return {
        content: currentContent(),
        error:
          "저장된 초안을 읽지 못했어요. 기존 초안은 덮어쓰지 않았어요. 내보낸 파일이 있다면 가져와 주세요.",
      };
    }
  });
  const [draft, setDraft] = useState<Content>(initial.content),
    [saved, setSaved] = useState(JSON.stringify(initial.content)),
    [selected, setSelected] = useState<number | "shared" | "letter">(0),
    [message, setMessage] = useState(initial.error),
    [dialog, setDialog] = useState<"reset" | null>(null),
    [focus, setFocus] = useState(""),
    [previewSpot, setPreviewSpot] = useState(0),
    [search, setSearch] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== saved;
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function save() {
    try {
      const checked = validateContent(draft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(checked));
      setSaved(JSON.stringify(checked));
      setMessage("이 브라우저에 초안을 저장했어요. 공개 게임은 바뀌지 않아요.");
    } catch (error) {
      setMessage(
        `저장하지 못했어요. ${error instanceof Error ? error.message : "브라우저 저장 공간을 확인해 주세요."}`,
      );
    }
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  function edit(path: (string | number)[], value: unknown) {
    setDraft((previous) => {
      const next = copy(previous);
      let node: any = next;
      for (const key of path.slice(0, -1)) node = node[key];
      node[path[path.length - 1]] = value;
      return next;
    });
    if (typeof value === "string") setFocus(value);
  }
  function field(label: string, path: (string | number)[], value: string) {
    return (
      <Field
        key={path.join(".")}
        label={label}
        value={value}
        onChange={(value) => edit(path, value)}
        onFocus={setFocus}
      />
    );
  }
  function exportJSON() {
    try {
      const checked = validateContent(draft);
      const blob = new Blob([JSON.stringify(checked, null, 2) + "\n"], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `doyeon-story-${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date())}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "여섯 장소와 편지를 한 파일로 내보냈어요. 이 파일을 Codex 채팅에 첨부해 주세요.",
      );
    } catch (error) {
      setMessage(`내보내지 못했어요. ${(error as Error).message}`);
    }
  }
  async function importJSON(input: File) {
    try {
      if (input.size > 2_000_000) throw Error("파일은 2MB 이하여야 해요.");
      const checked = validateContent(JSON.parse(await input.text()));
      setDraft(checked);
      setFocus("");
      setMessage(
        "전체 내용을 가져왔어요. 확인한 뒤 저장해 주세요. 공개 게임에는 아직 반영되지 않아요.",
      );
    } catch (error) {
      setMessage(
        `가져오지 못했어요. 기존 내용은 그대로예요. ${error instanceof SyntaxError ? "JSON 파일 형식이 올바르지 않아요." : (error as Error).message}`,
      );
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  const stage = typeof selected === "number" ? draft.stages[selected] : null;
  const preview = stage?.spots[Math.min(previewSpot, stage.spots.length - 1)];
  const names = (text: string) => resolveNames(text, draft.characters);
  return (
    <main className="ed-app">
      <aside className="ed-sidebar">
        <a className="ed-brand" href="/__editor">
          ♡
          <span>
            우리의 이야기<small>도연이를 위한 작은 작업실</small>
          </span>
        </a>
        <div className="ed-local">● 내 컴퓨터 전용</div>
        <p className="ed-nav-label">여섯 번의 만남</p>
        <nav aria-label="장소 선택">
          {stageLabels.map((label, i) => (
            <button
              key={label}
              className={selected === i ? "active" : ""}
              onClick={() => {
                setSelected(i);
                setPreviewSpot(0);
                setFocus("");
              }}
            >
              <span>0{i + 1}</span>
              {label}
              <b>{["✿", "☕", "◇", "☁", "❀", "⚿"][i]}</b>
            </button>
          ))}
        </nav>
        <div className="ed-nav-divider" />
        <button
          className={"ed-extra " + (selected === "shared" ? "active" : "")}
          onClick={() => {
            setSelected("shared");
            setFocus("");
          }}
        >
          ✦ 이름과 공통 문구
        </button>
        <button
          className={"ed-extra " + (selected === "letter" ? "active" : "")}
          onClick={() => {
            setSelected("letter");
            setFocus("");
          }}
        >
          ♡ 마지막 사랑 편지
        </button>
        <div className="ed-sidebar-note">
          <b>마음껏 고쳐도 괜찮아.</b>
          <p>여기서 저장해도 공개 게임과 플레이 기록은 바뀌지 않아요.</p>
        </div>
      </aside>
      <div className="ed-workspace">
        <header className="ed-toolbar">
          <div>
            <span
              className={"ed-status " + (dirty ? "dirty" : "")}
              aria-live="polite"
            >
              {dirty ? "● 저장하지 않은 변경" : "✓ 저장된 초안"}
            </span>
            <small>공개 게임에 자동 반영되지 않아요</small>
          </div>
          <div className="ed-actions">
            <button onClick={() => setDialog("reset")}>초기화</button>
            <button onClick={() => file.current?.click()}>가져오기</button>
            <button onClick={save}>저장</button>
            <button className="ed-primary" onClick={exportJSON}>
              JSON 내보내기 ↗
            </button>
            <input
              ref={file}
              type="file"
              accept=".json,application/json"
              aria-label="JSON 파일 가져오기"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) void importJSON(e.target.files[0]);
              }}
            />
          </div>
        </header>
        {message && (
          <div className="ed-notice" role="status">
            <span>{message}</span>
            <button aria-label="알림 닫기" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}
        <div className="ed-page-heading">
          <span className="ed-eyebrow">작은 문장이 큰 마음이 되도록</span>
          <h1>
            {stage
              ? stageLabels[selected as number]
              : selected === "letter"
                ? "마지막 사랑 편지"
                : "이름과 공통 문구"}
          </h1>
          <p>글을 누르고 고쳐 보세요. 오른쪽 미리보기에 바로 보여요.</p>
        </div>
        <div className="ed-columns">
          <section className="ed-fields" aria-label="내용 편집">
            {stage && typeof selected === "number" && (
              <>
                <article className="ed-card">
                  <h2>
                    장소의 첫인상 <span>01</span>
                  </h2>
                  {field("장소 제목", ["stages", selected, "name"], stage.name)}
                  {field(
                    "짧은 소개",
                    ["stages", selected, "subtitle"],
                    stage.subtitle,
                  )}
                  <h3>처음 도착했을 때</h3>
                  {stage.intro.map((line, i) =>
                    field(
                      `안내 문구 ${i + 1}`,
                      ["stages", selected, "intro", i],
                      line,
                    ),
                  )}
                </article>
                {stage.spots.map((spot, i) => (
                  <article className="ed-card" key={spot.id}>
                    <h2>
                      {defaultContent.stages[selected].spots[i].label}
                      <span>{i === previewSpot ? "미리보는 중" : ""}</span>
                    </h2>
                    <button
                      className="ed-link"
                      onClick={() => setPreviewSpot(i)}
                    >
                      이 장면 미리보기 →
                    </button>
                    {field(
                      "상호작용 이름",
                      ["stages", selected, "spots", i, "label"],
                      spot.label,
                    )}
                    {spot.lines.map((line, j) =>
                      field(
                        `대사 ${j + 1}`,
                        ["stages", selected, "spots", i, "lines", j],
                        line,
                      ),
                    )}
                    <div className="ed-inline">
                      <button
                        onClick={() =>
                          edit(
                            ["stages", selected, "spots", i, "lines"],
                            [...spot.lines, ""],
                          )
                        }
                      >
                        ＋ 대사 추가
                      </button>
                      {spot.lines.length > 1 && (
                        <button
                          onClick={() =>
                            edit(
                              ["stages", selected, "spots", i, "lines"],
                              spot.lines.slice(0, -1),
                            )
                          }
                        >
                          마지막 대사 삭제
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {stage.choices.length > 0 && (
                  <article className="ed-card">
                    <h2>
                      선택과 대답 <span>♡</span>
                    </h2>
                    <p>기존 캐릭터 동작은 그대로 유지돼요.</p>
                    {stage.choices.map((choice, i) => (
                      <div className="ed-choice-fields" key={i}>
                        <h3>선택 {i + 1}</h3>
                        {field(
                          "선택지 문구",
                          ["stages", selected, "choices", i, "text"],
                          choice.text,
                        )}
                        {field(
                          "재영이의 대답",
                          ["stages", selected, "choices", i, "reply"],
                          choice.reply,
                        )}
                      </div>
                    ))}
                  </article>
                )}
                <article className="ed-card">
                  <h2>
                    폴라로이드 속 추억 <span>✧</span>
                  </h2>
                  {field(
                    "사진 제목",
                    ["stages", selected, "memory", "title"],
                    stage.memory.title,
                  )}
                  {field(
                    "사진 아래 설명",
                    ["stages", selected, "memory", "caption"],
                    stage.memory.caption,
                  )}
                  <p>
                    기존 사진 {stage.memory.photos.length}장의 연결은 내보낼
                    때도 유지돼요.
                  </p>
                </article>
                {selected < 5 && (
                  <article className="ed-card">
                    <h2>하트를 받았을 때</h2>
                    {field(
                      "하트 획득 문구",
                      ["heartMessages", selected],
                      draft.heartMessages[selected],
                    )}
                  </article>
                )}
                {selected === 3 && (
                  <article className="ed-card">
                    <h2>커피 머신의 비밀</h2>
                    {field("숨겨진 대사", ["easterEgg"], draft.easterEgg)}
                  </article>
                )}
              </>
            )}
            {selected === "shared" && (
              <>
                <article className="ed-card">
                  <h2>두 사람의 이름</h2>
                  {field(
                    "도연이 이름",
                    ["characters", "doyeon"],
                    draft.characters.doyeon,
                  )}
                  {field(
                    "재영이 이름",
                    ["characters", "jaeyeong"],
                    draft.characters.jaeyeong,
                  )}
                  <p>
                    이름을 바꾸면 대사와 공통 문구의 기존 이름도 미리보기와 게시
                    시 함께 바뀌어요.
                  </p>
                </article>
                <article className="ed-card">
                  <h2>캐릭터의 말풍선</h2>
                  {Object.entries(draft.reactionBubbles).map(([key, value]) =>
                    field(
                      key === "wave"
                        ? "손 흔들 때"
                        : key === "hands"
                          ? "손잡을 때"
                          : "사랑을 표현할 때",
                      ["reactionBubbles", key],
                      value,
                    ),
                  )}
                </article>
                <article className="ed-card">
                  <h2>게임에 쓰이는 모든 공통 문구</h2>
                  <input
                    className="ed-search"
                    aria-label="공통 문구 검색"
                    placeholder="찾고 싶은 문구를 입력해 주세요"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {Object.entries(draft.ui)
                    .filter(
                      ([key, value]) =>
                        value.includes(search) ||
                        defaultContent.ui[
                          key as keyof typeof defaultContent.ui
                        ].includes(search),
                    )
                    .map(([key, value]) =>
                      field(
                        defaultContent.ui[
                          key as keyof typeof defaultContent.ui
                        ],
                        ["ui", key],
                        value,
                      ),
                    )}
                </article>
              </>
            )}
            {selected === "letter" && (
              <article className="ed-card">
                <h2>
                  도연이에게 보내는 마음 <span>♡</span>
                </h2>
                <p>줄바꿈과 빈 줄도 그대로 간직해요.</p>
                {field("마지막 사랑 편지", ["letter"], draft.letter)}
              </article>
            )}
          </section>
          <aside className="ed-preview">
            <div className="ed-preview-heading">
              <span>실시간 글 미리보기</span>
              <i>● 바로 반영 중</i>
            </div>
            <div className="ed-preview-canvas">
              {selected === "letter" ? (
                <div className="ed-letter">
                  <span>♡</span>
                  <h2>{names(draft.ui.text36)}</h2>
                  <p>{names(draft.letter)}</p>
                </div>
              ) : stage ? (
                <>
                  <div className="ed-preview-title">
                    <small>{names(stage.subtitle)}</small>
                    <h2>{names(stage.name)}</h2>
                  </div>
                  <div className="ed-preview-scene">
                    <span>♡</span>
                    <p>{names(stage.intro.join("\n"))}</p>
                  </div>
                  <div className="ed-speech">
                    <small>{names(preview?.label ?? "우리의 이야기")}</small>
                    {preview?.lines.map((line, i) => (
                      <p key={i}>{names(line)}</p>
                    ))}
                    {stage.choices.map((choice, i) => (
                      <div key={i} className="ed-preview-choice">
                        <b>{names(choice.text)}</b>
                        <p>{names(choice.reply)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="ed-polaroid">
                    <div>
                      ♡<small>기존 사진은 그대로</small>
                    </div>
                    <h3>{names(stage.memory.title)}</h3>
                    <p>{names(stage.memory.caption)}</p>
                  </div>
                </>
              ) : (
                <div className="ed-shared-preview">
                  <span>♡</span>
                  <h2>{names(draft.ui.text13)}</h2>
                  <p>{names(focus || "왼쪽 문구를 눌러 미리보기 해보세요.")}</p>
                </div>
              )}
            </div>
            {focus && selected !== "letter" && (
              <div className="ed-focused-preview">
                <small>지금 고치는 문장</small>
                <p>{names(focus)}</p>
              </div>
            )}
            <p className="ed-preview-note">
              문구를 확인하는 미리보기예요.
              <br />
              실제 3D 장면·캐릭터·저장 기록은 건드리지 않아요.
            </p>
          </aside>
        </div>
        <footer className="ed-footer">
          저장 = 이 브라우저의 초안 · 내보내기 = 여섯 장소를 담은 JSON · 게시 =
          Codex에 파일을 전달한 뒤 별도로 요청
        </footer>
      </div>
      {dialog && (
        <div className="ed-modal-backdrop">
          <section
            className="ed-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-heading"
          >
            <span>↺</span>
            <h2 id="reset-heading">현재 게임 문구로 되돌릴까요?</h2>
            <p>
              여섯 장소와 편집 중인 문구가 모두 초기화돼요. 게임 플레이 기록과
              공개 게임은 그대로예요. 저장된 초안은 다시 저장하기 전까지 남아
              있어요.
            </p>
            <button onClick={() => setDialog(null)}>계속 편집하기</button>
            <button
              className="ed-primary"
              onClick={() => {
                setDraft(currentContent());
                setFocus("");
                setDialog(null);
                setMessage(
                  "현재 게임의 문구로 되돌렸어요. 원하면 저장해 주세요.",
                );
              }}
            >
              전체 문구 초기화
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
