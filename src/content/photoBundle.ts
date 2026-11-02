import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { validateContent } from "./schema.ts";
import type { Content } from "./defaults.ts";
export const MAX_BUNDLE_BYTES = 30 * 1024 * 1024;
export function imageMatches(path: string, bytes: Uint8Array): boolean {
  if (/\.webp$/i.test(path))
    return (
      bytes.length >= 12 &&
      strFromU8(bytes.slice(0, 4)) === "RIFF" &&
      strFromU8(bytes.slice(8, 12)) === "WEBP"
    );
  if (/\.png$/i.test(path))
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
    );
  return (
    /\.jpe?g$/i.test(path) &&
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  );
}
export function photoPaths(content: Content) {
  return [
    ...new Set(
      content.stages.flatMap((s) =>
        s.memory.photos.flatMap((p) => (p.src ? [p.src] : [])),
      ),
    ),
  ];
}
export function createPhotoBundle(
  document: unknown,
  images: Map<string, Uint8Array>,
): Uint8Array {
  const content = validateContent(document);
  const files: Record<string, Uint8Array> = {
    "content.json": strToU8(JSON.stringify(content, null, 2) + "\n"),
    "README.ko.txt": strToU8(
      "이 ZIP에는 모든 대사·편지와 선택한 사진만 들어 있어요. Codex에 첨부하고 기존 Vercel 게임에 검증 후 반영해 달라고 요청하세요. 공개 게시 전까지 개인 사진은 로컬 파일입니다.\n",
    ),
  };
  let size = 0;
  for (const path of photoPaths(content)) {
    const bytes = images.get(path);
    if (!bytes)
      throw Error(
        "빠진 사진이 있어요. 해당 사진을 다시 선택한 뒤 ZIP으로 내보내 주세요.",
      );
    if (bytes.length > 3 * 1024 * 1024 || !imageMatches(path, bytes))
      throw Error("사진 파일의 형식을 확인해 주세요.");
    size += bytes.length;
    if (size > MAX_BUNDLE_BYTES - 2_000_000)
      throw Error(
        "사진 묶음이 너무 커요. 일부 사진을 줄여 30MB 이하로 내보내 주세요.",
      );
    files["public" + path] = bytes;
  }
  const zip = zipSync(files, { level: 0 });
  if (zip.length > MAX_BUNDLE_BYTES)
    throw Error("ZIP 파일은 30MB 이하여야 해요.");
  return zip;
}
export function readPhotoBundle(bytes: Uint8Array): {
  content: Content;
  images: Map<string, Uint8Array>;
} {
  if (bytes.length > MAX_BUNDLE_BYTES)
    throw Error("ZIP 파일은 30MB 이하여야 해요.");
  let expanded = 0;
  const seen = new Set<string>();
  const files = unzipSync(bytes, {
    filter: (file) => {
      if (seen.has(file.name)) throw Error("중복된 파일이 있는 ZIP이에요.");
      seen.add(file.name);
      if (
        !/^(content\.json|README\.ko\.txt|public\/memories\/[^/\\]+\.(jpg|jpeg|png|webp))$/i.test(
          file.name,
        ) ||
        file.name.includes("..")
      )
        throw Error("허용되지 않은 파일이나 경로가 있어요.");
      expanded += file.originalSize;
      if (
        expanded > 40 * 1024 * 1024 ||
        file.originalSize >
          (file.name === "content.json"
            ? 2_000_000
            : file.name === "README.ko.txt"
              ? 20000
              : 3 * 1024 * 1024)
      )
        throw Error("압축을 푼 파일의 크기가 너무 커요.");
      return true;
    },
  });
  if (!files["content.json"]) throw Error("이야기 데이터가 없는 ZIP이에요.");
  const content = validateContent(JSON.parse(strFromU8(files["content.json"])));
  const images = new Map<string, Uint8Array>();
  const required = photoPaths(content);
  for (const path of required) {
    const image = files["public" + path];
    if (!image || !imageMatches(path, image))
      throw Error("빠지거나 올바르지 않은 사진이 있어요.");
    images.set(path, image);
  }
  for (const path of Object.keys(files))
    if (path.startsWith("public/") && !required.includes(path.slice(6)))
      throw Error("이야기에 연결되지 않은 사진이 포함되어 있어요.");
  return { content, images };
}
