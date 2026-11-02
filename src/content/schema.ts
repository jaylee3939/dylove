import { defaultContent, type Content } from "./defaults.ts";
export function isMemoryPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/memories/") &&
    !path.includes("..") &&
    /^[\p{L}\p{N}._-]{1,160}\.(jpg|jpeg|png|webp)$/iu.test(
      path.slice("/memories/".length),
    )
  );
}
export function validateContent(value: unknown): Content {
  if (
    new TextEncoder().encode(JSON.stringify(value, null, 2)).length > 1_999_000
  )
    throw Error("문서가 너무 커요. 2MB 이하로 줄여 주세요.");
  // Migrate old text-only exports and existing browser drafts without changing copy.
  const input: unknown = JSON.parse(JSON.stringify(value ?? null));
  if (input && typeof input === "object" && (input as any).version === 1) {
    const old = input as any;
    old.version = 2;
    if (
      old.ui &&
      typeof old.ui === "object" &&
      !Object.hasOwn(old.ui, "text72")
    )
      old.ui.text72 = defaultContent.ui.text72;
    if (Array.isArray(old.stages))
      old.stages.forEach((stage: any, i: number) => {
        if (stage?.memory && Array.isArray(stage.memory.photos))
          stage.memory.photos = stage.memory.photos.map(
            (src: unknown, index: number) => ({
              id: `${defaultContent.stages[i]?.id ?? "unknown"}-photo-${index}`,
              src,
              title: stage.memory.title,
              caption: stage.memory.caption,
            }),
          );
      });
  }
  function inspect(v: unknown, base: unknown, path: string): void {
    if (path.endsWith(".src")) {
      if (v !== null && !isMemoryPath(v))
        throw Error("사진 경로는 추억 사진 폴더의 이미지여야 해요.");
      return;
    }
    if (typeof base === "string") {
      if (typeof v !== "string" || v.length > 30000)
        throw Error(`${path}: 글자 형식이나 길이를 확인해 주세요.`);
      return;
    }
    if (Array.isArray(base)) {
      if (!Array.isArray(v)) throw Error(`${path}: 목록 형식이 아니에요.`);
      const photos = path.endsWith(".photos"),
        flexible = photos || /\.(intro|lines)$/.test(path);
      if (
        (flexible && (v.length < (photos ? 0 : 1) || v.length > 100)) ||
        (!flexible && v.length !== base.length)
      )
        throw Error(`${path}: 항목 개수를 확인해 주세요.`);
      v.forEach((item, i) =>
        inspect(item, base[flexible ? 0 : i], `${path}.${i}`),
      );
      return;
    }
    if (base && typeof base === "object") {
      if (
        !v ||
        typeof v !== "object" ||
        Array.isArray(v) ||
        Object.keys(v).length !== Object.keys(base).length ||
        !Object.keys(base).every((k) => Object.hasOwn(v, k))
      )
        throw Error(`${path}: 누락되거나 알 수 없는 항목이 있어요.`);
      for (const k of Object.keys(base))
        inspect((v as any)[k], (base as any)[k], `${path}.${k}`);
      return;
    }
    if (v !== base) throw Error(`${path}: 지원하지 않는 문서 버전이에요.`);
  }
  inspect(input, defaultContent, "내용");
  const content = input as Content;
  const photoIds = new Set<string>();
  content.stages.forEach((stage, i) => {
    if (
      stage.id !== defaultContent.stages[i].id ||
      stage.spots.some(
        (spot, j) => spot.id !== defaultContent.stages[i].spots[j].id,
      )
    )
      throw Error("장소와 상호작용의 식별자는 바꿀 수 없어요.");
    stage.memory.photos.forEach((photo) => {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(photo.id) || photoIds.has(photo.id))
        throw Error("사진 식별자가 중복되거나 올바르지 않아요.");
      photoIds.add(photo.id);
    });
  });
  if (!content.characters.doyeon.trim() || !content.characters.jaeyeong.trim())
    throw Error("캐릭터 이름을 입력해 주세요.");
  return content;
}
