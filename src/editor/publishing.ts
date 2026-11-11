// Node-only publication service. Never imported by editor React components.
import { promises as fs } from "node:fs";
import path from "node:path";
import { homedir, tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { defaultEpisode } from "../episodes/1111/defaults.ts";
import { validateSpecial, safePath } from "../episodes/1111/schema.ts";
const execute = promisify(execFile);
export const GAME_URL = "https://dylove-wheat.vercel.app/special/1111";
export const MANIFEST_PATH = "/special-1111-version.json";
const CONTENT_PATH = "src/episodes/1111/published.json";
const sha = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
export type Publication = {
  commit: string;
  digest: string;
  url: string;
  state: "pushed" | "unchanged";
};
type Options = {
  source: string;
  repository?: string;
  expectedDigest?: string;
  progress?: (message: string) => void;
  repositoryResolver?: typeof findRepository;
};
let gitBinary: Promise<string> | undefined;
async function executableGit() {
  if (!gitBinary)
    gitBinary = (async () => {
      const desktop =
        "/Applications/GitHub Desktop.app/Contents/Resources/app/git/bin/git";
      if (process.platform === "darwin") {
        try {
          await fs.access(desktop);
          return desktop;
        } catch {}
      }
      return "git";
    })();
  return gitBinary;
}
function childEnvironment() {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  for (const name of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
  ])
    delete (env as NodeJS.ProcessEnv)[name];
  return env;
}
async function git(cwd: string, args: string[]) {
  return (
    await execute(
      await executableGit(),
      ["-c", "core.hooksPath=/dev/null", ...args],
      {
        cwd,
        encoding: "utf8",
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        env: childEnvironment(),
      },
    )
  ).stdout.trim();
}
export function validOrigin(value: string) {
  return /^(https:\/\/github\.com\/jaylee3939\/dylove(?:\.git)?|git@github\.com:jaylee3939\/dylove(?:\.git)?)$/.test(
    value,
  );
}
async function readAsset(root: string, name: string) {
  if (!safePath(name)) throw Error("사진 경로가 올바르지 않아요.");
  const base = await fs.realpath(path.join(root, "public")),
    target = await fs.realpath(path.join(root, "public", name));
  if (!target.startsWith(base + path.sep))
    throw Error("프로젝트 밖의 사진은 게시할 수 없어요.");
  const bytes = await fs.readFile(target);
  const magic = bytes.subarray(0, 12);
  if (
    bytes.length > 3 * 1024 * 1024 ||
    !(
      magic.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
      magic
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      (magic.toString("ascii", 0, 4) === "RIFF" &&
        magic.toString("ascii", 8, 12) === "WEBP")
    )
  )
    throw Error("게시할 사진을 읽지 못했어요. 편집기에서 다시 선택해 주세요.");
  return bytes;
}
export async function snapshotSpecial(root: string, requireEdits = false) {
  let raw: unknown;
  try {
    raw = JSON.parse(await fs.readFile(path.join(root, CONTENT_PATH), "utf8"));
  } catch {
    throw Error(
      "스페셜 파일이 올바른 JSON이 아니에요. 편집기에서 로컬 게임 파일에 반영을 다시 눌러 주세요.",
    );
  }
  if (raw === null && requireEdits)
    throw Error(
      "반영된 수정본이 없어요. 편집기에서 로컬 게임 파일에 반영하거나 수정한 ZIP 폴더를 선택해 주세요.",
    );
  const content = validateSpecial(raw ?? defaultEpisode, defaultEpisode);
  const names = [
    ...new Set(
      content.chapters.flatMap((c) =>
        [...c.photos.map((p) => p.src), c.background].filter(
          (p): p is string => !!p,
        ),
      ),
    ),
  ].sort();
  const assets = new Map<string, Buffer>(),
    hashes: Record<string, string> = {};
  let total = 0;
  for (const name of names) {
    const bytes = await readAsset(root, name);
    total += bytes.length;
    if (total > 40 * 1024 * 1024)
      throw Error("사진 묶음은 40MB 이하여야 해요.");
    assets.set(name, bytes);
    hashes[name] = sha(bytes);
  }
  return {
    content,
    assets,
    digest: sha(JSON.stringify({ content, assets: hashes })),
  };
}
export async function findRepository(source: string, explicit?: string) {
  for (const candidate of explicit
    ? [explicit]
    : [source, path.join(homedir(), "Documents/GitHub/dylove")]) {
    try {
      const root = await git(candidate, ["rev-parse", "--show-toplevel"]);
      const origin = await git(root, ["remote", "get-url", "origin"]);
      if (
        !validOrigin(origin) ||
        !validOrigin(await git(root, ["remote", "get-url", "--push", "origin"]))
      )
        continue;
      return root;
    } catch {}
  }
  throw Error(
    "GitHub 복제 폴더를 찾지 못했어요. GitHub Desktop에서 jaylee3939/dylove를 Documents/GitHub/dylove에 Clone해 주세요.",
  );
}
export function inspectDeployment(code: string, body: string, digest: string) {
  const result = { url: GAME_URL, digest, verified: false };
  if (code === "404") return { ...result, state: "pending" as const };
  if (code !== "200") return { ...result, state: "unreachable" as const };
  try {
    const data = JSON.parse(body);
    const verified = data.version === 1 && data.digest === digest;
    return {
      ...result,
      verified,
      state: verified ? ("verified" as const) : ("pending" as const),
    };
  } catch {
    return { ...result, state: "unreachable" as const };
  }
}
export async function checkDeployment(digest: string) {
  if (!/^[a-f0-9]{64}$/.test(digest))
    throw Error("게시 버전 번호가 올바르지 않아요.");
  try {
    const url = `https://dylove-wheat.vercel.app${MANIFEST_PATH}?version=${digest}&t=${Date.now()}`;
    const { stdout } = await execute(
      "curl",
      [
        "--silent",
        "--show-error",
        "--proto",
        "=https",
        "--max-time",
        "12",
        "--write-out",
        "\n%{http_code}",
        url,
      ],
      { encoding: "utf8", timeout: 15000, maxBuffer: 65536 },
    );
    const cut = stdout.lastIndexOf("\n");
    return inspectDeployment(
      stdout.slice(cut + 1).trim(),
      stdout.slice(0, cut),
      digest,
    );
  } catch {
    return {
      state: "unreachable" as const,
      url: GAME_URL,
      digest,
      verified: false,
    };
  }
}
export async function publishSpecial(options: Options): Promise<Publication> {
  const source = await fs.realpath(options.source),
    cache = path.join(source, "node_modules/.cache/doyeon-publisher");
  await fs.mkdir(cache, { recursive: true });
  const lockPath = path.join(cache, "publish.lock");
  let lock;
  try {
    lock = await fs.open(lockPath, "wx");
    await lock.writeFile(String(process.pid));
  } catch {
    throw Error(
      "이미 게시 중이에요. 완료를 기다려 주세요. 비정상 종료했다면 node_modules/.cache/doyeon-publisher/publish.lock 파일을 지운 뒤 다시 시도해 주세요.",
    );
  }
  let worktree = "",
    repo = "",
    folder = "",
    phase = "준비";
  const report = (s: string) => {
    phase = s;
    options.progress?.(s);
  };
  try {
    const snapshot = await snapshotSpecial(source, true);
    if (options.expectedDigest && options.expectedDigest !== snapshot.digest)
      throw Error("로컬 수정본이 바뀌었어요. 게시 버튼을 다시 눌러 주세요.");
    repo = await (options.repositoryResolver ?? findRepository)(
      source,
      options.repository,
    );
    report("GitHub 최신 main 확인");
    await git(repo, ["fetch", "origin", "main"]);
    const base = await git(repo, ["rev-parse", "FETCH_HEAD"]);
    folder = await fs.mkdtemp(path.join(tmpdir(), "doyeon-special-publish-"));
    worktree = path.join(folder, "project");
    await git(repo, ["worktree", "add", "--detach", worktree, base]);
    report("로컬 수정본과 사진 검증");
    const sourceLock = await fs.readFile(
        path.join(source, "package-lock.json"),
      ),
      remoteLock = await fs.readFile(path.join(worktree, "package-lock.json"));
    if (!sourceLock.equals(remoteLock))
      throw Error(
        "라이브러리 버전이 달라요. 최신 프로젝트에서 npm ci를 한 번 실행한 뒤 다시 게시해 주세요.",
      );
    const target = path.join(worktree, CONTENT_PATH);
    if (!(await fs.lstat(target)).isFile())
      throw Error("게시 데이터 경로가 일반 파일이 아니에요.");
    const previous = await fs.readFile(target);
    await fs.mkdir(path.join(cache, "backups"), { recursive: true });
    await fs.writeFile(
      path.join(cache, "backups", `${Date.now()}-${base.slice(0, 8)}.json`),
      previous,
    );
    const selected = [CONTENT_PATH];
    for (const [name, bytes] of snapshot.assets) {
      const destination = path.join(worktree, "public", name);
      try {
        const old = await fs.readFile(destination);
        if (!old.equals(bytes))
          throw Error(
            "기존 공개 사진과 이름이 겹쳐요. 편집기에서 사진을 새로 업로드해 주세요.",
          );
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        const publicRoot = await fs.realpath(path.join(worktree, "public"));
        await fs.mkdir(path.dirname(destination), { recursive: true });
        const realParent = await fs.realpath(path.dirname(destination));
        if (!realParent.startsWith(publicRoot + path.sep))
          throw Error("프로젝트 밖의 사진 경로예요.");
        await fs.writeFile(destination, bytes, { flag: "wx" });
      }
      selected.push("public" + name);
    }
    await fs.writeFile(
      target,
      JSON.stringify(snapshot.content, null, 2) + "\n",
    );
    await git(worktree, ["add", "--", ...selected]);
    const staged = (await git(worktree, ["diff", "--cached", "--name-only"]))
      .split("\n")
      .filter(Boolean);
    if (staged.some((name) => !selected.includes(name)))
      throw Error("선택하지 않은 파일이 포함되어 게시를 중단했어요.");
    if (!staged.length) {
      const result: Publication = {
        commit: base,
        digest: snapshot.digest,
        url: GAME_URL,
        state: "unchanged",
      };
      await fs
        .writeFile(
          path.join(cache, "last-publication.json"),
          JSON.stringify(result),
        )
        .catch(() => {});
      return result;
    }
    report("수정본과 사진 프로덕션 빌드");
    await fs.symlink(
      path.join(source, "node_modules"),
      path.join(worktree, "node_modules"),
      "dir",
    );
    await execute(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "build"],
      {
        cwd: worktree,
        timeout: 240000,
        maxBuffer: 2 * 1024 * 1024,
        env: childEnvironment(),
      },
    );
    const manifest = JSON.parse(
      await fs.readFile(path.join(worktree, "dist", MANIFEST_PATH), "utf8"),
    );
    if (manifest.digest !== snapshot.digest)
      throw Error("빌드된 게시 버전이 수정본과 달라요. 게시하지 않았어요.");
    const afterBuild = (
      await git(worktree, ["diff", "--cached", "--name-only"])
    )
      .split("\n")
      .filter(Boolean);
    if (afterBuild.some((name) => !selected.includes(name)))
      throw Error("빌드 중 선택하지 않은 파일이 추가되어 게시를 중단했어요.");
    report("스페셜 변경만 GitHub에 커밋");
    await git(worktree, [
      "commit",
      "-m",
      "Publish edited 11:11 special content and memory photos",
    ]);
    const commit = await git(worktree, ["rev-parse", "HEAD"]);
    // Keep a local recovery ref if authentication or a concurrent push rejects publication.
    await git(repo, ["update-ref", `refs/doyeon-publish/${commit}`, commit]);
    report("GitHub main에 푸시");
    await git(worktree, ["push", "origin", "HEAD:refs/heads/main"]);
    const result: Publication = {
      commit,
      digest: snapshot.digest,
      url: GAME_URL,
      state: "pushed",
    };
    await fs
      .writeFile(
        path.join(cache, "last-publication.json"),
        JSON.stringify(result),
      )
      .catch(() => {});
    return result;
  } catch (error) {
    if (error instanceof Error && !("code" in error) && !("cmd" in error))
      throw error;
    // Never return subprocess output: credential helpers may include secrets in diagnostics.
    throw Error(
      `${phase} 단계에서 멈췄어요. 강제 푸시는 하지 않았어요. 푸시 단계에서 연결이 끊겼다면 실제 반영 여부를 확인해 주세요. GitHub 인증·인터넷 연결·최신 코드와 빌드를 확인해 주세요. 로컬 수정본은 그대로 있어요.`,
    );
  } finally {
    if (worktree && repo)
      await git(repo, ["worktree", "remove", "--force", worktree]).catch(
        () => {},
      );
    if (folder)
      await fs.rm(folder, { recursive: true, force: true }).catch(() => {});
    await lock.close().catch(() => {});
    await fs.rm(lockPath, { force: true }).catch(() => {});
  }
}
