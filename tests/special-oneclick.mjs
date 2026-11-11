import { chromium, expect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { snapshotSpecial } from "../src/editor/publishing.ts";
const file = new URL("../src/episodes/1111/published.json", import.meta.url),
  before = await readFile(file),
  main = new URL("../src/content/published.json", import.meta.url),
  originalMain = await readFile(main);
const browser = await chromium.launch({
  executablePath: await slim.executablePath(),
  args: [
    ...slim.args,
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  headless: true,
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  let pushed = false,
    checked = false;
  // Publication transport is deliberately intercepted; this browser test cannot publish to GitHub.
  await page.route("**/__special/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/__special/apply") return route.continue();
    if (pathname === "/__special/publish") {
      const data = route.request().postDataJSON();
      const snapshot = await snapshotSpecial(
        new URL("../", import.meta.url).pathname,
      );
      assert.equal(data.expectedDigest, snapshot.digest);
      assert.equal(snapshot.content.title, "한 번에 게시한 이벤트 ♡");
      assert.equal(snapshot.content.chapters[0].title, "한 번에 게시한 제목 ♡");
      assert.equal(
        snapshot.content.chapters[0].description,
        "안내도 함께 반영\n두 번째 줄",
      );
      pushed = true;
      return route.fulfill({
        json: {
          commit: "a".repeat(40),
          digest: snapshot.digest,
          state: "pushed",
          url: "https://dylove-wheat.vercel.app/special/1111",
        },
      });
    }
    if (pathname === "/__special/publish/status") {
      assert.ok(pushed);
      checked = true;
      return route.fulfill({ json: { verified: true, state: "verified" } });
    }
    throw Error("Unexpected publication endpoint");
  });
  await page.goto("http://127.0.0.1:5174/__editor");
  await page
    .getByRole("button", { name: "♡ 11:11 SPECIAL", exact: true })
    .click();
  await page
    .getByLabel("이벤트 제목", { exact: true })
    .fill("한 번에 게시한 이벤트 ♡");
  await page
    .getByLabel("스테이지 제목", { exact: true })
    .fill("한 번에 게시한 제목 ♡");
  await page
    .getByLabel("스테이지 안내", { exact: true })
    .fill("안내도 함께 반영\n두 번째 줄");
  await page
    .getByRole("button", { name: "GitHub·Vercel에 게시 ♡", exact: true })
    .click();
  await expect(page.getByRole("note")).toContainText("같은 대사·사진 버전");
  assert.ok(pushed && checked);
  assert.equal(
    JSON.parse(
      await page.evaluate(() =>
        localStorage.getItem("doyeon-special-editor-v1"),
      ),
    ).chapters[0].title,
    "한 번에 게시한 제목 ♡",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "♡ 11:11 SPECIAL", exact: true })
    .click();
  await expect(page.getByLabel("스테이지 제목", { exact: true })).toHaveValue(
    "한 번에 게시한 제목 ♡",
  );
  await expect(page.getByLabel("마지막 게시 결과")).toContainText("aaaaaaaa");
  await page.screenshot({ path: "/tmp/doyeon-oneclick-editor.png" });
  const game = await browser.newPage();
  game.setDefaultTimeout(120000);
  await game.goto("http://127.0.0.1:5173/special/1111");
  await expect(game.locator(".eleven-story h1 > span")).toHaveText(
    "한 번에 게시한 이벤트 ♡",
  );
  await expect(game).toHaveTitle("한 번에 게시한 이벤트 ♡");
  await game.getByRole("button", { name: "11:11에 만나러 가기 ♡" }).click();
  await game.waitForFunction(
    () => !!localStorage.getItem("doyeon-special-exploration-v1"),
  );
  await game.keyboard.down("w");
  await game.locator(".explore-interact:not(:disabled)").waitFor();
  await game.keyboard.up("w");
  await game.keyboard.press("e");
  await expect(game.locator(".eleven-stage-heading h2")).toHaveText(
    "한 번에 게시한 제목 ♡",
  );
  await expect(game.locator(".eleven-stage-heading")).toContainText(
    "안내도 함께 반영",
  );
  for (const endpoint of ["publish", "publish/status"]) {
    const rejected = await page.request.post(
      `http://127.0.0.1:5174/__special/${endpoint}`,
      {
        headers: { Origin: "https://evil.example", "X-Local-Editor": "1111" },
        data: { expectedDigest: "a".repeat(64), digest: "a".repeat(64) },
      },
    );
    assert.equal(rejected.status(), 403);
    const disabled = await page.request.post(
      `http://127.0.0.1:5173/__special/${endpoint}`,
      {
        headers: { Origin: "http://127.0.0.1:5173", "X-Local-Editor": "1111" },
        data: {},
      },
    );
    assert.equal(disabled.status(), 403);
  }
  assert.deepEqual(await readFile(main), originalMain);
  console.log(
    "PASS: one click auto-applies unsaved Korean title/instructions, saves draft, submits snapshot, displays distinct GitHub/deploy results, survives reload, reflects edits in actual 3D game; local API origin and disabled-server guards. GitHub/deploy transport mocked.",
  );
} finally {
  await browser.close();
  await writeFile(file, before);
}
