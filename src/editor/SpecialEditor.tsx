import { useEffect, useState } from "react";
import {
  defaultEpisode,
  episode,
  type EpisodeContent,
} from "../episodes/1111/content";
import { validateSpecial } from "../episodes/1111/schema";
import { optimizePhoto } from "./photos/optimize";
import { getAsset, putAssets } from "./photos/storage";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
const KEY = "doyeon-special-editor-v1";
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
function ImagePreview({ path }: { path: string }) {
  const [url, setURL] = useState(path);
  useEffect(() => {
    let alive = true,
      temporary = "";
    setURL(path);
    void getAsset(path).then((a) => {
      if (a && alive) {
        temporary = URL.createObjectURL(a.blob);
        setURL(temporary);
      }
    });
    return () => {
      alive = false;
      if (temporary) URL.revokeObjectURL(temporary);
    };
  }, [path]);
  return (
    <img
      src={url}
      alt="추억 사진 미리보기"
      style={{ width: "100%", maxHeight: 260, objectFit: "contain" }}
    />
  );
}
export default function SpecialEditor({ onBack }: { onBack: () => void }) {
  const [draft, setDraft] = useState<EpisodeContent>(() => {
    try {
      return validateSpecial(
        JSON.parse(localStorage.getItem(KEY) || "null"),
        defaultEpisode,
      );
    } catch {
      return clone(episode);
    }
  });
  const [saved, setSaved] = useState(JSON.stringify(draft)),
    [index, setIndex] = useState(0),
    [message, setMessage] = useState(
      "저장은 이 브라우저의 초안입니다. 파일 반영 후 GitHub 게시가 필요해요.",
    ),
    [busy, setBusy] = useState(false);
  const chapter = draft.chapters[index],
    dirty = JSON.stringify(draft) !== saved;
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty || busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, busy]);
  function edit(fn: (d: EpisodeContent) => void) {
    setDraft((d) => {
      const next = clone(d);
      fn(next);
      return next;
    });
  }
  function field(label: string, value: string, change: (v: string) => void) {
    return (
      <label className="ed-field">
        <span>{label}</span>
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => change(e.target.value)}
        />
      </label>
    );
  }
  async function run(fn: () => Promise<void> | void) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  function save() {
    const checked = validateSpecial(draft, defaultEpisode);
    localStorage.setItem(KEY, JSON.stringify(checked));
    setSaved(JSON.stringify(checked));
    setMessage(
      "초안 저장 완료 ♡ 새로고침해도 유지돼요. 공개 게임은 아직 바뀌지 않았어요.",
    );
  }
  async function upload(
    files: FileList | null,
    replace?: number,
    background = false,
  ) {
    if (!files) return;
    await run(async () => {
      for (const file of Array.from(files)) {
        const asset = await optimizePhoto(file);
        await putAssets([asset]);
        edit((d) => {
          const c = d.chapters[index];
          if (background) c.background = asset.path;
          else {
            const p = {
              id: crypto.randomUUID(),
              src: asset.path,
              title: "우리의 추억",
              caption: "함께여서 행복했던 순간 ♡",
            };
            if (replace !== undefined)
              c.photos[replace] = { ...c.photos[replace], src: asset.path };
            else c.photos.push(p);
          }
        });
      }
      setMessage(
        "사진을 최적화해 내 컴퓨터에 보관했어요. 초안 저장을 눌러 주세요.",
      );
    });
  }
  async function exportZIP() {
    await run(async () => {
      const checked = validateSpecial(draft, defaultEpisode);
      const files: Record<string, Uint8Array> = {
        "special-1111.json": strToU8(JSON.stringify(checked, null, 2)),
      };
      const paths = new Set(
        checked.chapters.flatMap((c) =>
          [...c.photos.map((p) => p.src), c.background].filter(
            (v): v is string => !!v,
          ),
        ),
      );
      for (const path of paths) {
        const asset = await getAsset(path);
        let blob: Blob;
        if (asset) blob = asset.blob;
        else {
          const r = await fetch(path);
          if (!r.ok || !r.headers.get("content-type")?.startsWith("image/"))
            throw Error("사진을 찾지 못했어요. 다시 업로드해 주세요.");
          blob = await r.blob();
        }
        files["public" + path] = new Uint8Array(await blob.arrayBuffer());
      }
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(zipSync(files)).buffer], {
          type: "application/zip",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "doyeon-special-1111.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "사진과 전체 스페셜 콘텐츠를 ZIP으로 내보냈어요. Codex에 전달하면 기존 본편을 보존하며 게시할 수 있어요.",
      );
    });
  }
  async function apply() {
    await run(async () => {
      const checked = validateSpecial(draft, defaultEpisode);
      const images: Record<string, string> = {};
      for (const path of new Set(
        checked.chapters.flatMap((c) =>
          [...c.photos.map((p) => p.src), c.background].filter(
            (v): v is string => !!v,
          ),
        ),
      )) {
        const a = await getAsset(path);
        if (a) {
          images[path] = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(",")[1]);
            r.onerror = reject;
            r.readAsDataURL(a.blob);
          });
        }
      }
      const response = await fetch("/__special/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Local-Editor": "1111",
        },
        body: JSON.stringify({ content: checked, images }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "반영 실패");
      save();
      setMessage(
        "로컬 프로젝트 파일에 반영했어요! 스페셜 미리보기에서 확인하세요. 공개 반영은 GitHub 커밋·푸시 후에만 이루어져요.",
      );
    });
  }
  async function importZIP(file: File) {
    await run(async () => {
      if (file.size > 30 * 1024 * 1024)
        throw Error("ZIP은 30MB 이하로 골라 주세요.");
      let expanded = 0;
      const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
        filter: (entry) => {
          expanded += entry.originalSize;
          if (
            expanded > 40 * 1024 * 1024 ||
            entry.originalSize > 3 * 1024 * 1024
          )
            throw Error("ZIP의 압축 해제 크기가 너무 커요.");
          return (
            entry.name === "special-1111.json" ||
            /^public\/memories\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/.test(
              entry.name,
            )
          );
        },
      });
      const checked = validateSpecial(
        JSON.parse(strFromU8(files["special-1111.json"])),
        defaultEpisode,
      );
      const assets = [];
      for (const path of new Set(
        checked.chapters.flatMap((c) =>
          [...c.photos.map((p) => p.src), c.background].filter(
            (v): v is string => !!v,
          ),
        ),
      )) {
        const bytes = files["public" + path];
        if (!bytes) throw Error("사진이 빠진 ZIP이에요.");
        const blob = new Blob([new Uint8Array(bytes).buffer], {
          type: path.endsWith(".webp")
            ? "image/webp"
            : path.endsWith(".png")
              ? "image/png"
              : "image/jpeg",
        });
        const image = await createImageBitmap(blob);
        assets.push({
          path,
          blob,
          width: image.width,
          height: image.height,
          originalName: path,
        });
        image.close();
      }
      await putAssets(assets);
      setDraft(checked);
      setMessage("스페셜 전체 콘텐츠를 가져왔어요. 초안 저장을 눌러 주세요.");
    });
  }
  return (
    <main className="ed-app">
      <aside className="ed-sidebar">
        <h1>11:11 SPECIAL</h1>
        <button
          disabled={busy}
          onClick={() => {
            if (
              !dirty ||
              confirm("저장하지 않은 스페셜 변경을 두고 돌아갈까요?")
            )
              onBack();
          }}
        >
          ← 본편 편집기
        </button>
        <nav aria-label="스페셜 장 선택">
          {draft.chapters.map((c, i) => (
            <button
              key={c.id}
              className={index === i ? "active" : ""}
              onClick={() => setIndex(i)}
            >
              {i + 1}. {c.title}
            </button>
          ))}
        </nav>
        <p>● 내 컴퓨터 전용</p>
        <a href="/special/1111" target="_blank" rel="noreferrer">
          로컬 게임 미리보기 ↗
        </a>
      </aside>
      <section style={{ padding: "24px", maxWidth: 1000, width: "100%" }}>
        <h2>우리의 11:11 작업실 ♡</h2>
        <p role="status">
          {dirty ? "● 저장하지 않은 변경" : "✓ 저장된 초안"} · {message}
        </p>
        <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => void run(save)}>초안 저장</button>
            <button onClick={() => void apply()}>로컬 게임 파일에 반영</button>
            <button onClick={() => void exportZIP()}>
              사진 포함 ZIP 내보내기
            </button>
            <label>
              ZIP 가져오기
              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  if (e.target.files?.[0]) void importZIP(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => {
                if (
                  confirm(
                    "스페셜 초안을 기본 내용으로 초기화할까요? 본편은 바뀌지 않아요.",
                  )
                )
                  setDraft(clone(defaultEpisode));
              }}
            >
              스페셜 초기화
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={draft.enabled !== false}
              onChange={(e) =>
                edit((d) => {
                  d.enabled = e.target.checked;
                })
              }
            />
            스페셜 공개 (파일 반영·게시 후 적용)
          </label>
          {field("이벤트 제목", draft.title, (v) =>
            edit((d) => {
              d.title = v;
            }),
          )}
          {field("스테이지 제목", chapter.title, (v) =>
            edit((d) => {
              d.chapters[index].title = v;
            }),
          )}
          {field("스테이지 안내", chapter.description, (v) =>
            edit((d) => {
              d.chapters[index].description = v;
            }),
          )}
          <h3>대사</h3>
          {chapter.lines.map((l, j) => (
            <div key={j}>
              <label>
                말하는 사람
                <select
                  aria-label={`대사 ${j + 1} 인물`}
                  value={l.speaker}
                  onChange={(e) =>
                    edit((d) => {
                      d.chapters[index].lines[j].speaker = e.target
                        .value as typeof l.speaker;
                    })
                  }
                >
                  <option value="jaeyeong">재영</option>
                  <option value="doyeon">도연</option>
                </select>
              </label>
              {field(`스페셜 대사 ${j + 1}`, l.text, (v) =>
                edit((d) => {
                  d.chapters[index].lines[j].text = v;
                }),
              )}
            </div>
          ))}
          {chapter.quiz.map((q, j) => (
            <section key={q.id}>
              <h3>퀴즈 {j + 1}</h3>
              {field("퀴즈 질문", q.question, (v) =>
                edit((d) => {
                  d.chapters[index].quiz[j].question = v;
                }),
              )}
              {q.choices.map((c, k) =>
                field(`퀴즈 선택지 ${k + 1}`, c.text, (v) =>
                  edit((d) => {
                    d.chapters[index].quiz[j].choices[k].text = v;
                  }),
                ),
              )}
              <label>
                정답
                <select
                  aria-label="퀴즈 정답"
                  value={q.correctChoiceId}
                  onChange={(e) =>
                    edit((d) => {
                      d.chapters[index].quiz[j].correctChoiceId =
                        e.target.value;
                    })
                  }
                >
                  {q.choices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.text}
                    </option>
                  ))}
                </select>
              </label>
              {field("정답 반응", q.correct, (v) =>
                edit((d) => {
                  d.chapters[index].quiz[j].correct = v;
                }),
              )}
              {field("오답 반응", q.retry, (v) =>
                edit((d) => {
                  d.chapters[index].quiz[j].retry = v;
                }),
              )}
            </section>
          ))}
          {chapter.choices?.map((c, j) => (
            <section key={c.id}>
              <h3>데이트 {j + 1}</h3>
              {field("데이트 선택지", c.text, (v) =>
                edit((d) => {
                  d.chapters[index].choices![j].text = v;
                }),
              )}
              {field("데이트 반응", c.reply, (v) =>
                edit((d) => {
                  d.chapters[index].choices![j].reply = v;
                }),
              )}
              {field("엔딩 약속", c.ending, (v) =>
                edit((d) => {
                  d.chapters[index].choices![j].ending = v;
                }),
              )}
            </section>
          ))}
          {chapter.letter !== undefined &&
            field("엔딩 편지 전체", chapter.letter, (v) =>
              edit((d) => {
                d.chapters[index].letter = v;
              }),
            )}
          <h3>추억 사진 관리</h3>
          <label>
            사진 추가 (여러 장 가능)
            <input
              aria-label="스페셜 사진 추가"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {chapter.photos.map((p, j) => (
            <article
              key={p.id}
              style={{
                background: "#fff4e8",
                padding: 18,
                margin: "18px 0",
                color: "#795548",
                maxWidth: 400,
              }}
            >
              <ImagePreview path={p.src!} />
              {field("사진 제목", p.title, (v) =>
                edit((d) => {
                  d.chapters[index].photos[j].title = v;
                }),
              )}
              {field("사진 설명", p.caption, (v) =>
                edit((d) => {
                  d.chapters[index].photos[j].caption = v;
                }),
              )}
              <button
                disabled={j === 0}
                onClick={() =>
                  edit((d) => {
                    const a = d.chapters[index].photos;
                    [a[j - 1], a[j]] = [a[j], a[j - 1]];
                  })
                }
              >
                앞으로
              </button>
              <button
                disabled={j === chapter.photos.length - 1}
                onClick={() =>
                  edit((d) => {
                    const a = d.chapters[index].photos;
                    [a[j + 1], a[j]] = [a[j], a[j + 1]];
                  })
                }
              >
                뒤로
              </button>
              <button
                onClick={() =>
                  edit((d) => {
                    d.chapters[index].photos.splice(j, 1);
                  })
                }
              >
                사진 삭제
              </button>
              <label>
                사진 교체
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    void upload(e.target.files, j);
                    e.target.value = "";
                  }}
                />
              </label>
            </article>
          ))}
          <h3>배경 이미지</h3>
          <p>이미지를 추가해도 기존 3D 배경과 캐릭터는 유지돼요.</p>
          {chapter.background && <ImagePreview path={chapter.background} />}
          <input
            aria-label="스페셜 배경 이미지"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              void upload(e.target.files, undefined, true);
              e.target.value = "";
            }}
          />
          <button
            onClick={() =>
              edit((d) => {
                delete d.chapters[index].background;
              })
            }
          >
            기본 배경으로
          </button>
          <section
            aria-label="대사 실시간 미리보기"
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5b8c822",
              padding: 24,
              marginTop: 30,
            }}
          >
            <h2>{chapter.title}</h2>
            {chapter.lines.map((l, i) => (
              <p key={i}>
                {l.speaker === "jaeyeong" ? "재영" : "도연"}: {l.text}
              </p>
            ))}
            {chapter.letter}
          </section>
        </fieldset>
      </section>
    </main>
  );
}
