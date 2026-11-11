import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  publishSpecial,
  snapshotSpecial,
  validOrigin,
  findRepository,
  inspectDeployment,
  checkDeployment,
} from "../src/editor/publishing.ts";
import { defaultEpisode } from "../src/episodes/1111/defaults.ts";
const git = (dir, ...args) =>
  execFileSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
async function fixture() {
  const base = await mkdtemp(path.join(tmpdir(), "doyeon-publisher-test-")),
    remote = path.join(base, "remote.git"),
    repo = path.join(base, "desktop"),
    source = path.join(base, "edited-zip");
  await mkdir(repo);
  await mkdir(source);
  git(base, "init", "--bare", "--initial-branch=main", remote);
  git(repo, "init", "--initial-branch=main");
  git(repo, "config", "user.name", "Local publishing test");
  git(repo, "config", "user.email", "test@example.invalid");
  await mkdir(path.join(repo, "src/episodes/1111"), { recursive: true });
  await mkdir(path.join(repo, "public/memories"), { recursive: true });
  await mkdir(path.join(repo, "src/content"), { recursive: true });
  await writeFile(
    path.join(repo, "src/episodes/1111/published.json"),
    "null\n",
  );
  await writeFile(
    path.join(repo, "src/content/published.json"),
    "main-original",
  );
  await writeFile(path.join(repo, "protected.txt"), "keep original");
  await writeFile(path.join(repo, "public/memories/.gitkeep"), "");
  const packageData = JSON.stringify({
      type: "module",
      scripts: { build: "node build.mjs" },
    }),
    lockData = '{"lockfileVersion":3}';
  await writeFile(path.join(repo, "package.json"), packageData);
  await writeFile(path.join(repo, "package-lock.json"), lockData);
  const module = fileURLToPath(
    new URL("../src/editor/publishing.ts", import.meta.url),
  );
  await writeFile(
    path.join(repo, "build.mjs"),
    `import {snapshotSpecial} from ${JSON.stringify(module)};import {mkdir,writeFile}from'node:fs/promises';const s=await snapshotSpecial(process.cwd());await mkdir('dist',{recursive:true});await writeFile('dist/special-1111-version.json',JSON.stringify({digest:s.digest}));`,
  );
  git(repo, "add", ".");
  git(repo, "commit", "-m", "Original project");
  git(repo, "remote", "add", "origin", remote);
  git(repo, "push", "origin", "main");
  await mkdir(path.join(source, "src/episodes/1111"), { recursive: true });
  await mkdir(path.join(source, "public/memories"), { recursive: true });
  await writeFile(path.join(source, "package-lock.json"), lockData);
  const content = structuredClone(defaultEpisode);
  content.chapters[0].title = "맥북에서 바꾼 제목 ♡";
  content.chapters[0].description = "줄바꿈\n안내 😏";
  content.chapters[1].photos = [
    {
      id: "local-one",
      src: "/memories/local-one.png",
      title: "부산 ♡",
      caption: "우리의 추억",
    },
  ];
  await writeFile(
    path.join(source, "src/episodes/1111/published.json"),
    JSON.stringify(content),
  );
  await writeFile(
    path.join(source, "public/memories/local-one.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  await writeFile(path.join(repo, "protected.txt"), "uncommitted desktop work");
  await writeFile(path.join(repo, "staged.txt"), "staged work");
  git(repo, "add", "staged.txt");
  return {
    base,
    remote,
    repo,
    source,
    content,
    options: { source, repositoryResolver: async () => repo },
  };
}
test("only the intended GitHub repository is eligible; credential-bearing URLs are refused", () => {
  assert.ok(validOrigin("https://github.com/jaylee3939/dylove.git"));
  assert.ok(validOrigin("git@github.com:jaylee3939/dylove.git"));
  for (const url of [
    "https://token@github.com/jaylee3939/dylove.git",
    "https://github.com/other/dylove.git",
    "https://evil.example/jaylee3939/dylove.git",
    "file:///tmp/repo",
  ])
    assert.equal(validOrigin(url), false);
});
test("real isolated worktree commit/push preserves Desktop edits, index, main content and source ZIP", async () => {
  const f = await fixture();
  try {
    const originalHead = git(f.repo, "rev-parse", "HEAD"),
      status = git(f.repo, "status", "--porcelain"),
      index = git(f.repo, "diff", "--cached");
    const expected = await snapshotSpecial(f.source, true),
      result = await publishSpecial({
        ...f.options,
        expectedDigest: expected.digest,
      });
    assert.equal(result.state, "pushed");
    assert.equal(result.digest, expected.digest);
    assert.equal(git(f.remote, "rev-parse", "main"), result.commit);
    assert.equal(git(f.repo, "rev-parse", "HEAD"), originalHead);
    assert.equal(git(f.repo, "status", "--porcelain"), status);
    assert.equal(git(f.repo, "diff", "--cached"), index);
    assert.deepEqual(
      JSON.parse(
        git(f.remote, "show", "main:src/episodes/1111/published.json"),
      ),
      f.content,
    );
    assert.equal(
      git(f.remote, "show", "main:src/content/published.json"),
      "main-original",
    );
    assert.equal(git(f.remote, "show", "main:protected.txt"), "keep original");
    assert.equal(
      git(f.remote, "ls-tree", "--name-only", "main", "staged.txt"),
      "",
    );
    assert.ok(
      git(
        f.remote,
        "ls-tree",
        "--name-only",
        "main",
        "public/memories/local-one.png",
      ),
    );
    assert.deepEqual(
      JSON.parse(
        await readFile(
          path.join(f.source, "src/episodes/1111/published.json"),
          "utf8",
        ),
      ),
      f.content,
    );
    const again = await publishSpecial(f.options);
    assert.equal(again.state, "unchanged");
    assert.equal(again.commit, result.commit);
    assert.equal(
      git(f.repo, "worktree", "list", "--porcelain").match(/worktree /g).length,
      1,
    );
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});
test("build failure never pushes or consumes local edits", async () => {
  const f = await fixture();
  try {
    git(f.repo, "reset", "--hard");
    await writeFile(path.join(f.repo, "build.mjs"), "process.exit(1)");
    git(f.repo, "add", "build.mjs");
    git(f.repo, "commit", "-m", "Failing build");
    git(f.repo, "push", "origin", "main");
    const before = git(f.remote, "rev-parse", "main");
    await assert.rejects(publishSpecial(f.options), /빌드/);
    assert.equal(git(f.remote, "rev-parse", "main"), before);
    assert.equal(
      git(f.repo, "worktree", "list", "--porcelain").match(/worktree /g).length,
      1,
    );
    assert.ok(
      await readFile(path.join(f.source, "src/episodes/1111/published.json")),
    );
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});
test("rejected push redacts diagnostics and retains recoverable commit without force push", async () => {
  const f = await fixture();
  try {
    const hook = path.join(f.remote, "hooks/pre-receive");
    await writeFile(hook, '#!/bin/sh\necho "SECRET_TEST_TOKEN" >&2\nexit 1\n', {
      mode: 0o755,
    });
    const before = git(f.remote, "rev-parse", "main");
    await assert.rejects(publishSpecial(f.options), (e) => {
      assert.ok(!e.message.includes("SECRET_TEST_TOKEN"));
      return /푸시/.test(e.message);
    });
    assert.equal(git(f.remote, "rev-parse", "main"), before);
    assert.ok(
      git(
        f.repo,
        "for-each-ref",
        "--format=%(refname)",
        "refs/doyeon-publish/",
      ),
    );
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});
test("stale snapshots and incorrect Desktop remotes are rejected before publication", async () => {
  const f = await fixture();
  try {
    const before = git(f.remote, "rev-parse", "main");
    await assert.rejects(
      publishSpecial({ ...f.options, expectedDigest: "0".repeat(64) }),
      /바뀌/,
    );
    await assert.rejects(findRepository(f.source, f.repo), /복제 폴더/);
    assert.equal(git(f.remote, "rev-parse", "main"), before);
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});

test("deployment proof requires matching published content and image digest; missing or protected deployments are never called successful", async () => {
  const digest = "a".repeat(64);
  assert.equal(
    inspectDeployment("200", JSON.stringify({ version: 1, digest }), digest)
      .verified,
    true,
  );
  assert.equal(
    inspectDeployment(
      "200",
      JSON.stringify({ version: 1, digest: "b".repeat(64) }),
      digest,
    ).state,
    "pending",
  );
  assert.equal(
    inspectDeployment("404", "not deployed", digest).state,
    "pending",
  );
  assert.equal(inspectDeployment("403", "protected", digest).verified, false);
  assert.equal(
    inspectDeployment("200", "<html>Login</html>", digest).verified,
    false,
  );
  assert.equal(
    inspectDeployment("200", JSON.stringify({ version: 99, digest }), digest)
      .verified,
    false,
  );
  await assert.rejects(checkDeployment("../../elsewhere"), /버전/);
});

test("an unapplied ZIP never publishes fallback default content", async () => {
  const f = await fixture();
  try {
    const before = git(f.remote, "rev-parse", "main");
    await writeFile(
      path.join(f.source, "src/episodes/1111/published.json"),
      "null",
    );
    await assert.rejects(publishSpecial(f.options), /수정본이 없어요/);
    assert.equal(git(f.remote, "rev-parse", "main"), before);
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});

test("a stray null followed by JSON is rejected without erasing the edited document", async () => {
  const f = await fixture();
  try {
    const before = git(f.remote, "rev-parse", "main"),
      bad = "null\n" + JSON.stringify(f.content);
    await writeFile(
      path.join(f.source, "src/episodes/1111/published.json"),
      bad,
    );
    await assert.rejects(publishSpecial(f.options), /JSON/);
    assert.equal(
      await readFile(
        path.join(f.source, "src/episodes/1111/published.json"),
        "utf8",
      ),
      bad,
    );
    assert.equal(git(f.remote, "rev-parse", "main"), before);
  } finally {
    await rm(f.base, { recursive: true, force: true });
  }
});
