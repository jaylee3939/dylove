import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  lstatSync,
  existsSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { validateContent } from "../src/content/schema.ts";
import {
  readPhotoBundle,
  photoPaths,
  imageMatches,
  MAX_BUNDLE_BYTES,
} from "../src/content/photoBundle.ts";
const input = process.argv[2],
  root = fileURLToPath(new URL("../", import.meta.url));
if (!input) {
  console.error(
    "사용법: npm run content:apply -- 내보낸파일.json 또는 사진묶음.zip",
  );
  process.exit(1);
}
const created = [];
let temporary,
  committed = false;
try {
  const raw = readFileSync(input);
  if (raw.length > MAX_BUNDLE_BYTES) throw Error("파일은 30MB 이하여야 해요.");
  let content,
    images = new Map();
  if (/\.zip$/i.test(input)) {
    ({ content, images } = readPhotoBundle(new Uint8Array(raw)));
  } else {
    if (raw.length > 2_000_000) throw Error("JSON 파일은 2MB 이하여야 해요.");
    content = validateContent(JSON.parse(raw.toString("utf8")));
  }
  const publicRoot = join(root, "public"),
    memoriesRoot = join(publicRoot, "memories"),
    published = join(root, "src/content/published.json");
  for (const folder of [publicRoot, memoriesRoot]) {
    if (existsSync(folder) && lstatSync(folder).isSymbolicLink())
      throw Error("사진 폴더는 심볼릭 링크일 수 없어요.");
  }
  if (existsSync(published) && lstatSync(published).isSymbolicLink())
    throw Error("게시 파일은 심볼릭 링크일 수 없어요.");
  const plan = [];
  for (const path of photoPaths(content)) {
    const target = resolve(publicRoot, "." + path);
    if (dirname(target) !== resolve(memoriesRoot))
      throw Error("사진 경로를 확인해 주세요.");
    if (existsSync(target) && lstatSync(target).isSymbolicLink())
      throw Error("사진 파일은 심볼릭 링크일 수 없어요.");
    const packed = images.get(path),
      existing = existsSync(target) ? readFileSync(target) : undefined;
    if (!packed && !existing)
      throw Error(
        "사진 파일이 빠졌어요. 사진·이야기 ZIP으로 내보낸 파일을 전달해 주세요.",
      );
    const bytes = packed ?? new Uint8Array(existing);
    if (!imageMatches(path, bytes))
      throw Error("사진 파일 형식이 올바르지 않아요.");
    if (existing && packed && !Buffer.from(packed).equals(existing))
      throw Error(
        "같은 이름의 다른 사진이 있어요. 편집기에서 사진 교체 후 다시 내보내 주세요.",
      );
    if (packed && !existing) plan.push({ target, bytes: packed });
  }
  mkdirSync(memoriesRoot, { recursive: true });
  for (const file of plan) {
    writeFileSync(file.target, file.bytes, { flag: "wx" });
    created.push(file.target);
  }
  temporary = join(dirname(published), `.published-${randomUUID()}.tmp`);
  writeFileSync(temporary, JSON.stringify(content, null, 2) + "\n", {
    flag: "wx",
  });
  renameSync(temporary, published);
  temporary = undefined;
  committed = true;
  console.log(
    `이야기 전체와 사진 ${photoPaths(content).length}장을 검증해 적용했어요. 빌드와 검토 후 main에 커밋·푸시해야 기존 Vercel 게임에 반영돼요. 기존의 다른 사진은 삭제하지 않았어요.`,
  );
} catch (error) {
  if (!committed)
    for (const path of created)
      try {
        unlinkSync(path);
      } catch {}
  if (temporary)
    try {
      unlinkSync(temporary);
    } catch {}
  console.error(error.message);
  process.exit(1);
}
