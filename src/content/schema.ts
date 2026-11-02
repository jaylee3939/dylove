import { defaultContent, type Content } from "./defaults.ts";
export function validateContent(value: unknown): Content {
  function inspect(v: unknown, base: unknown, path: string): void {
    if (typeof base === "string") {
      if (typeof v !== "string" || v.length > 30000)
        throw Error(`${path}: 글자 형식이나 길이를 확인해 주세요.`);
      return;
    }
    if (base === null) {
      if (
        v !== null &&
        (typeof v !== "string" ||
          !/^\/memories\/[^\s]+\.(jpg|jpeg|png|webp)$/i.test(v))
      )
        throw Error(`${path}: 사진 경로는 /memories/ 안의 이미지여야 해요.`);
      return;
    }
    if (Array.isArray(base)) {
      if (!Array.isArray(v)) throw Error(`${path}: 목록 형식이 아니에요.`);
      const flexible = /\.(intro|lines|photos)$/.test(path);
      if (
        (flexible && (v.length < 1 || v.length > 100)) ||
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
        inspect(
          (v as Record<string, unknown>)[k],
          (base as Record<string, unknown>)[k],
          `${path}.${k}`,
        );
      return;
    }
    if (v !== base) throw Error(`${path}: 지원하지 않는 문서 버전이에요.`);
  }
  if (
    new TextEncoder().encode(JSON.stringify(value, null, 2)).length > 1_999_000
  )
    throw Error("문서가 너무 커요. 2MB 이하로 줄여 주세요.");
  inspect(value, defaultContent, "내용");
  const content = value as Content;
  content.stages.forEach((s, i) => {
    if (
      s.id !== defaultContent.stages[i].id ||
      s.spots.some(
        (spot, j) => spot.id !== defaultContent.stages[i].spots[j].id,
      )
    )
      throw Error("장소와 상호작용의 식별자는 바꿀 수 없어요.");
  });
  if (!content.characters.doyeon.trim() || !content.characters.jaeyeong.trim())
    throw Error("캐릭터 이름을 입력해 주세요.");
  return JSON.parse(JSON.stringify(content));
}
