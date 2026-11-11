import { chromium, expect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { defaultEpisode } from "../src/episodes/1111/content.ts";
import { validateSpecial } from "../src/episodes/1111/schema.ts";
const published = new URL(
  "../src/episodes/1111/published.json",
  import.meta.url,
);
const before = await readFile(published);
const { readdir, unlink } = await import("node:fs/promises");
const publicDir = new URL("../public/memories/", import.meta.url);
const existingImages = new Set(await readdir(publicDir));
const browser = await chromium.launch({
  executablePath: await slim.executablePath(),
  args: slim.args,
  headless: true,
});
try {
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5174/__editor");
  await page.evaluate(() =>
    localStorage.setItem("doyeon-love-v1", "main-save-sentinel"),
  );
  await page
    .getByRole("button", { name: "♡ 11:11 SPECIAL", exact: true })
    .click();
  await page
    .getByLabel("스페셜 대사 1", { exact: true })
    .fill("테스트 대사 ♡\n두 번째 줄");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "♡ 11:11 SPECIAL", exact: true })
    .click();
  await expect(page.getByLabel("스페셜 대사 1", { exact: true })).toHaveValue(
    "테스트 대사 ♡\n두 번째 줄",
  );
  await page.getByRole("button", { name: /2\. 부산/ }).click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("스페셜 사진 추가", { exact: true })
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png });
  await expect(page.getByLabel("사진 제목", { exact: true })).toBeVisible();
  await page.getByLabel("사진 제목", { exact: true }).fill("부산의 우리 ♡");
  await page.getByLabel("스페셜 배경 이미지", { exact: true }).setInputFiles({
    name: "background.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByRole("status")).toContainText("사진을 최적화");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  const draft = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("doyeon-special-editor-v1")),
  );
  assert.equal(
    validateSpecial(draft, defaultEpisode).chapters[1].photos.length,
    1,
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "사진 포함 ZIP 내보내기", exact: true })
    .click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "doyeon-special-1111.zip");
  await page
    .getByLabel("사진 제목", { exact: true })
    .fill("가져오기 전 임시 제목");
  await page
    .getByLabel("ZIP 가져오기", { exact: true })
    .setInputFiles(await download.path());
  await expect(page.getByLabel("사진 제목", { exact: true })).toHaveValue(
    "부산의 우리 ♡",
  );
  await page
    .getByRole("button", { name: "로컬 게임 파일에 반영", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "로컬 프로젝트 파일에 반영",
  );
  const disk = JSON.parse(await readFile(published, "utf8"));
  assert.equal(disk.chapters[0].lines[0].text, "테스트 대사 ♡\n두 번째 줄");
  assert.equal(disk.chapters[1].photos[0].title, "부산의 우리 ♡");
  const game = await browser.newPage();
  await game.goto("http://127.0.0.1:5173/special/1111");
  await game.getByRole("button", { name: "11:11에 만나러 가기 ♡" }).click();
  game.setDefaultTimeout(120000);
  await game.waitForFunction(
    () => !!localStorage.getItem("doyeon-special-exploration-v1"),
  );
  await game.keyboard.down("w");
  await game.locator(".explore-interact:not(:disabled)").waitFor();
  await game.keyboard.up("w");
  await game.keyboard.press("e");
  await expect(game.locator(".eleven-dialog")).toContainText("테스트 대사 ♡");
  const forbidden = await page.request.post(
    "http://127.0.0.1:5174/__special/apply",
    {
      headers: { Origin: "https://evil.example" },
      data: { content: draft, images: {} },
    },
  );
  assert.equal(forbidden.status(), 403);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("doyeon-love-v1")),
    "main-save-sentinel",
  );
  const hidden = structuredClone(draft);
  hidden.enabled = false;
  const hideResponse = await page.request.post(
    "http://127.0.0.1:5174/__special/apply",
    {
      headers: { Origin: "http://127.0.0.1:5174", "X-Local-Editor": "1111" },
      data: { content: hidden, images: {} },
    },
  );
  assert.equal(hideResponse.status(), 200);
  await game.reload();
  await expect(game.getByText("아직 준비 중인 선물이에요 ♡")).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: special draft reload, optimized photo/background uploads, ZIP export/import, publication toggle, validated local file apply, actual game content reflection, origin rejection, main save preservation.",
  );
  // Remove only synthetic assets created by this test, never existing user assets.
  const { unlink } = await import("node:fs/promises");
  for (const path of [
    draft.chapters[1].photos[0].src,
    disk.chapters[1].background,
  ])
    if (path)
      await unlink(new URL("../public" + path, import.meta.url)).catch(
        () => {},
      );
} finally {
  for (const file of await readdir(publicDir))
    if (!existingImages.has(file)) await unlink(new URL(file, publicDir));
  await writeFile(published, before);
  await browser.close();
}
