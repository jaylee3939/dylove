import { useRef, useState } from "react";
import {
  resolveNames,
  type Content,
  type MemoryPhoto,
} from "../../content/defaults";
import PolaroidCard from "../../components/PolaroidCard";
import { optimizePhoto } from "./optimize";
import { putAssets, type PhotoAsset } from "./storage";
import { usePhotoURL } from "./usePhotoURL";
function Thumb({ path, title }: { path: string; title: string }) {
  const url = usePhotoURL(path);
  return url ? <img src={url} alt={title} loading="lazy" /> : <span>♡</span>;
}
export function LocalPolaroid({
  photo,
  ui,
}: {
  photo: MemoryPhoto;
  ui: Content["ui"];
}) {
  const src = usePhotoURL(photo.src);
  return (
    <PolaroidCard
      src={src}
      title={photo.title}
      caption={photo.caption}
      empty={{ first: ui.text56, second: ui.text57, note: ui.text58 }}
    />
  );
}
export default function PhotoManager({
  stage,
  photos,
  title,
  caption,
  ui,
  characters,
  onChange,
  onNotice,
  onBusy,
}: {
  stage: string;
  photos: MemoryPhoto[];
  title: string;
  caption: string;
  ui: Content["ui"];
  characters: Content["characters"];
  onChange: (photos: MemoryPhoto[]) => void;
  onNotice: (message: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [working, setWorking] = useState(false),
    [deleting, setDeleting] = useState<string | null>(null);
  const upload = useRef<HTMLInputElement>(null),
    replace = useRef<HTMLInputElement>(null),
    replaceID = useRef<string | null>(null);
  const actual = photos.filter((p) => p.src !== null);
  const current = actual.find((p) => p.id === selected) ?? actual[0];
  async function process(files: FileList | null, replacing?: string) {
    if (!files?.length) return;
    const chosen = Array.from(files);
    if (actual.length + chosen.length - (replacing ? 1 : 0) > 30) {
      onNotice("한 장소에 사진은 30장까지 넣을 수 있어요.");
      if (upload.current) upload.current.value = "";
      if (replace.current) replace.current.value = "";
      return;
    }
    setWorking(true);
    onBusy(true);
    try {
      const assets: PhotoAsset[] = [];
      for (const file of chosen) assets.push(await optimizePhoto(file));
      await putAssets(assets);
      let next: MemoryPhoto[];
      if (replacing) {
        next = photos.map((p) =>
          p.id === replacing ? { ...p, src: assets[0].path } : p,
        );
        setSelected(replacing);
      } else {
        const added = assets.map((asset) => ({
          id: `${stage}-${crypto.randomUUID()}`,
          src: asset.path,
          title,
          caption,
        }));
        next = [...actual, ...added];
        setSelected(added[0].id);
      }
      onChange(next);
      onNotice(
        "사진을 모바일용으로 줄여 이 브라우저에 보관했어요. 공개 서버에는 전송하지 않았어요. 저장 후 ZIP으로 내보내 주세요.",
      );
    } catch (error) {
      onNotice(
        (error as Error).message ||
          "사진을 추가하지 못했어요. 기존 내용은 그대로예요.",
      );
    } finally {
      setWorking(false);
      onBusy(false);
      if (upload.current) upload.current.value = "";
      if (replace.current) replace.current.value = "";
    }
  }
  function move(id: string, direction: number) {
    const index = actual.findIndex((p) => p.id === id),
      target = index + direction;
    if (target < 0 || target >= actual.length) return;
    const next = [...actual];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setSelected(id);
  }
  function update(id: string, key: "title" | "caption", value: string) {
    onChange(photos.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }
  return (
    <article className="ed-card ed-photo-manager">
      <div className="ed-photo-heading">
        <div>
          <h2>
            추억 사진 관리 <span>♡ {actual.length}장</span>
          </h2>
          <p>여기에 넣은 사진은 이 브라우저에만 보관돼요.</p>
        </div>
        <button
          className="ed-primary"
          disabled={working}
          onClick={() => upload.current?.click()}
        >
          {working ? "사진을 다듬는 중…" : "＋ 사진 추가"}
        </button>
      </div>
      <input
        type="file"
        ref={upload}
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-label="추억 사진 업로드"
        hidden
        onChange={(e) => void process(e.target.files)}
      />
      <input
        type="file"
        ref={replace}
        accept="image/jpeg,image/png,image/webp"
        aria-label="추억 사진 교체"
        hidden
        onChange={(e) =>
          void process(e.target.files, replaceID.current ?? undefined)
        }
      />
      <p className="ed-photo-help">
        JPG·PNG·WebP · 여러 장 선택 가능 · 긴 쪽 최대 1,600px · 업로드할 때 촬영
        위치 등 원본 메타데이터를 제거해요.
      </p>
      {!actual.length ? (
        <button
          disabled={working}
          className="ed-photo-empty"
          onClick={() => upload.current?.click()}
        >
          <span>▧</span>
          <b>우리 사진을 넣어볼까?</b>
          <small>
            눌러서 사진을 골라 주세요. 대사와 다른 편집 내용은 그대로예요.
          </small>
        </button>
      ) : (
        <div className="ed-photo-list">
          {actual.map((photo, i) => (
            <section
              key={photo.id}
              className={
                "ed-photo-item " + (current?.id === photo.id ? "selected" : "")
              }
            >
              <button
                className="ed-photo-thumb"
                onClick={() => setSelected(photo.id)}
                aria-label={`사진 ${i + 1} 미리보기`}
              >
                <Thumb path={photo.src!} title={photo.title} />
                <span>{String(i + 1).padStart(2, "0")}</span>
              </button>
              <div className="ed-photo-item-fields">
                <label>
                  사진 {i + 1} 제목
                  <textarea
                    aria-label={`사진 ${i + 1} 제목`}
                    value={photo.title}
                    disabled={working}
                    onFocus={() => setSelected(photo.id)}
                    onChange={(e) => update(photo.id, "title", e.target.value)}
                  />
                </label>
                <label>
                  사진 {i + 1} 설명
                  <textarea
                    aria-label={`사진 ${i + 1} 설명`}
                    value={photo.caption}
                    disabled={working}
                    onFocus={() => setSelected(photo.id)}
                    onChange={(e) =>
                      update(photo.id, "caption", e.target.value)
                    }
                  />
                </label>
                <div className="ed-photo-buttons">
                  <button
                    disabled={working || i === 0}
                    aria-label={`사진 ${i + 1} 앞으로`}
                    onClick={() => move(photo.id, -1)}
                  >
                    ← 앞으로
                  </button>
                  <button
                    disabled={working || i === actual.length - 1}
                    aria-label={`사진 ${i + 1} 뒤로`}
                    onClick={() => move(photo.id, 1)}
                  >
                    뒤로 →
                  </button>
                  <button
                    disabled={working}
                    onClick={() => {
                      replaceID.current = photo.id;
                      replace.current?.click();
                      setSelected(photo.id);
                    }}
                    aria-label={`사진 ${i + 1} 교체`}
                  >
                    교체
                  </button>
                  <button
                    disabled={working}
                    onClick={() => setDeleting(photo.id)}
                    aria-label={`사진 ${i + 1} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
      {current && (
        <div className="ed-photo-preview">
          <div className="ed-photo-preview-label">
            <span>실제 게임과 같은 폴라로이드</span>
            <small>
              {actual.indexOf(current) + 1} / {actual.length}
            </small>
          </div>
          <LocalPolaroid
            photo={{
              ...current,
              title: resolveNames(current.title, characters),
              caption: resolveNames(current.caption, characters),
            }}
            ui={ui}
          />
          <p>
            게임에서는 이 순서대로 사진을 넘겨봐요. 썸네일을 눌러 다른 사진도
            확인해 주세요.
          </p>
        </div>
      )}
      {deleting && (
        <div
          className="ed-photo-confirm"
          role="dialog"
          aria-label="사진 삭제 확인"
        >
          <p>
            이 사진을 이야기에서 뺄까요?
            <br />
            컴퓨터의 원본 사진과 기존 공개 게임은 그대로예요.
          </p>
          <button onClick={() => setDeleting(null)}>간직할래</button>
          <button
            onClick={() => {
              onChange(photos.filter((p) => p.id !== deleting));
              setDeleting(null);
            }}
          >
            사진 삭제하기
          </button>
        </div>
      )}
    </article>
  );
}
