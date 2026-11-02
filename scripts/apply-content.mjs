import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateContent } from "../src/content/schema.ts";
const input = process.argv[2];
if (!input) {
  console.error("사용법: npm run content:apply -- 내보낸파일.json");
  process.exit(1);
}
try {
  const raw = readFileSync(input, "utf8");
  if (Buffer.byteLength(raw) > 2_000_000) throw Error("파일이 너무 커요.");
  const content = validateContent(JSON.parse(raw));
  writeFileSync(
    fileURLToPath(new URL("../src/content/published.json", import.meta.url)),
    JSON.stringify(content, null, 2) + "\n",
  );
  console.log(
    "검증한 문구를 적용했어요. 빌드와 검토 후 커밋해야 공개 게임에 반영돼요.",
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
