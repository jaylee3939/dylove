import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  publishSpecial,
  checkDeployment,
  findRepository,
} from "../src/editor/publishing.ts";
const args = process.argv.slice(2),
  root = fileURLToPath(new URL("../", import.meta.url));
function option(name) {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
}
try {
  const source = path.resolve(option("--source") ?? root),
    repository =
      option("--repo") ?? (await findRepository(root).catch(() => undefined));
  console.log(
    "11:11 SPECIAL 간편 게시 — Git 인증은 이 컴퓨터에서만 사용합니다.",
  );
  const result = await publishSpecial({
    source,
    repository,
    progress: (message) => console.log("· " + message),
  });
  console.log(
    `GitHub ${result.state === "pushed" ? "반영 완료" : "이미 같은 수정본입니다"}: ${result.commit.slice(0, 8)}`,
  );
  console.log("Vercel 반영을 확인하는 중…");
  for (let i = 0; i < 24; i++) {
    const checked = await checkDeployment(result.digest);
    if (checked.verified) {
      console.log(
        "실제 공개 게임에 같은 대사·사진 버전이 배포된 것을 확인했어요.\n" +
          result.url,
      );
      process.exit(0);
    }
    if (checked.state === "unreachable") break;
    if (i < 23) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  console.log(
    "GitHub 반영은 완료됐지만 Vercel 배포 성공은 아직 확인하지 못했어요. 기존 Vercel 프로젝트의 Deployments에서 최신 커밋이 Ready인지 확인해 주세요.\n" +
      result.url,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "게시하지 못했어요.");
  process.exitCode = 1;
}
