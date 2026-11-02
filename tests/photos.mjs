import { chromium, expect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { cloneContent } from "../src/content/defaults.ts";
import {
  createPhotoBundle,
  readPhotoBundle,
} from "../src/content/photoBundle.ts";
const browser = await chromium.launch({
  executablePath: await slim.executablePath(),
  args: slim.args,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1050 },
    acceptDownloads: true,
  });
  const errors = [],
    writes = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
      writes.push(r.url());
  });
  await page.goto("http://127.0.0.1:5174/__editor");
  await page.getByRole("heading", { name: "도쿄", exact: true }).waitFor();
  await page
    .getByLabel("대사 1", { exact: true })
    .first()
    .fill("사진을 넣어도 남아 있는 대사 ♡\n두 번째 줄");
  const fixtureData = await page.evaluate(() => {
    const result = [];
    for (const [type, w, h, color] of [
      ["image/jpeg", 3200, 2000, "#c89ca4"],
      ["image/png", 1800, 2400, "#9cae8c"],
      ["image/webp", 800, 1200, "#e8c38e"],
    ]) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      x.fillStyle = color;
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#fff4e8";
      x.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
      result.push({ type, data: c.toDataURL(type).split(",")[1] });
    }
    return result;
  });
  const files = fixtureData.map((f, i) => ({
    name: `test-${i}.${i === 0 ? "jpg" : i === 1 ? "png" : "webp"}`,
    mimeType: f.type,
    buffer: Buffer.from(f.data, "base64"),
  }));
  await page
    .locator(".ed-sidebar")
    .getByRole("button", { name: /추억 사진 관리/ })
    .click();
  await page.getByLabel("추억 사진 업로드").setInputFiles(files);
  await expect(page.locator(".ed-photo-item")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "사진·이야기 ZIP 내보내기", exact: true }),
  ).toBeEnabled();
  for (let i = 1; i <= 3; i++) {
    await page
      .getByLabel(`사진 ${i} 제목`, { exact: true })
      .fill(["첫 사진 ♡", "둘째 사진", "셋째 사진"][i - 1]);
    await page
      .getByLabel(`사진 ${i} 설명`, { exact: true })
      .fill(`설명 ${i}\n줄바꿈 ♡`);
  }
  await page
    .getByRole("button", { name: "사진 3 앞으로", exact: true })
    .click();
  await page
    .getByRole("button", { name: "사진 2 앞으로", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("사진 1 제목", { exact: true }).inputValue(),
    "셋째 사진",
  );
  await page.getByRole("button", { name: "사진 2 교체", exact: true }).click();
  await page.getByLabel("추억 사진 교체").setInputFiles(files[2]);
  await expect(
    page.getByRole("button", { name: "사진·이야기 ZIP 내보내기", exact: true }),
  ).toBeEnabled();
  assert.equal(
    await page.getByLabel("사진 2 제목", { exact: true }).inputValue(),
    "첫 사진 ♡",
  );
  await page.getByRole("button", { name: "사진 3 삭제", exact: true }).click();
  await page
    .getByRole("button", { name: "사진 삭제하기", exact: true })
    .click();
  await expect(page.locator(".ed-photo-item")).toHaveCount(2);
  await page
    .getByRole("button", { name: "사진 1 미리보기", exact: true })
    .click();
  await expect(page.locator(".ed-photo-preview .polaroid h2")).toHaveText(
    "셋째 사진",
  );
  await expect(page.locator(".ed-photo-preview .polaroid p")).toHaveText(
    "설명 3\n줄바꿈 ♡",
  );
  const storedDimensions = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("doyeon-private-photo-assets-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
    const assets = await new Promise((resolve, reject) => {
      const request = db
        .transaction("assets", "readonly")
        .objectStore("assets")
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
    db.close();
    return Promise.all(
      assets.map(async (asset) => {
        const image = await createImageBitmap(asset.blob);
        const size = [image.width, image.height];
        image.close();
        return size;
      }),
    );
  });
  assert.ok(storedDimensions.every((size) => Math.max(...size) <= 1600));
  assert.ok(storedDimensions.some((size) => Math.max(...size) === 1600));
  const labels = [
    "옥된장",
    "동대문",
    "회사 탕비실",
    "사랑의 정원",
    "러브이즈호텔",
  ];
  for (const label of labels) {
    await page
      .getByLabel("장소 선택")
      .getByRole("button", { name: new RegExp(label) })
      .click();
    await page.getByLabel("추억 사진 업로드").setInputFiles(files[0]);
    await expect(page.locator(".ed-photo-item")).toHaveCount(1);
    await expect(
      page.getByRole("button", {
        name: "사진·이야기 ZIP 내보내기",
        exact: true,
      }),
    ).toBeEnabled();
  }
  await page.getByRole("button", { name: "저장", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("doyeon-content-editor-v1")),
  );
  assert.equal(
    saved.stages[0].spots[0].lines[0],
    "사진을 넣어도 남아 있는 대사 ♡\n두 번째 줄",
  );
  await page.reload();
  await page
    .locator(".ed-sidebar")
    .getByRole("button", { name: /추억 사진 관리/ })
    .click();
  await expect(page.locator(".ed-photo-item")).toHaveCount(2);
  await expect(page.locator(".ed-photo-thumb img").first()).toBeVisible();
  await page.waitForFunction(
    () => document.querySelector(".ed-photo-thumb img")?.naturalWidth > 0,
  );
  const dimensions = await page
    .locator(".ed-photo-thumb img")
    .evaluateAll((images) =>
      images.map((image) => [image.naturalWidth, image.naturalHeight]),
    );
  assert.ok(dimensions.every((size) => Math.max(...size) <= 1600));
  await page.screenshot({ path: "/tmp/doyeon-photo-editor.png" });
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "사진·이야기 ZIP 내보내기", exact: true })
    .click();
  const download = await downloadPromise;
  const bytes = new Uint8Array(await readFile(await download.path()));
  await writeFile("/tmp/doyeon-photo-test.zip", bytes);
  const bundle = readPhotoBundle(bytes);
  assert.deepEqual(bundle.content, saved);
  assert.equal(bundle.images.size, 7);
  assert.deepEqual(
    bundle.content.stages[0].memory.photos.map((p) => p.title),
    ["셋째 사진", "첫 사진 ♡"],
  );
  assert.ok(
    [...bundle.images.values()].every((image) => image.length <= 600 * 1024),
  );
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
  const fresh = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await fresh.goto("http://127.0.0.1:5174/__editor");
  await fresh.getByLabel("JSON 파일 가져오기").setInputFiles({
    name: "memories.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(bytes),
  });
  await fresh.getByText(/사진과 모든 대사·편지를 ZIP에서 가져왔어요/).waitFor();
  await fresh
    .locator(".ed-sidebar")
    .getByRole("button", { name: /추억 사진 관리/ })
    .click();
  await expect(fresh.locator(".ed-photo-item")).toHaveCount(2);
  await fresh.waitForFunction(
    () => document.querySelector(".ed-photo-thumb img")?.naturalWidth > 0,
  );
  await fresh.getByRole("button", { name: "저장", exact: true }).click();
  assert.deepEqual(
    await fresh.evaluate(() =>
      JSON.parse(localStorage.getItem("doyeon-content-editor-v1")),
    ),
    saved,
  );
  const broken = cloneContent();
  broken.stages[0].memory.photos = [
    {
      id: "broken",
      src: "/memories/broken.png",
      title: "깨진 사진",
      caption: "",
    },
  ];
  const brokenZip = createPhotoBundle(
    broken,
    new Map([
      [
        "/memories/broken.png",
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      ],
    ]),
  );
  await fresh
    .getByLabel("JSON 파일 가져오기")
    .setInputFiles({
      name: "broken.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(brokenZip),
    });
  await fresh.getByText(/묶음 안의 사진을 읽지 못했어요/).waitFor();
  await expect(fresh.locator(".ed-photo-item")).toHaveCount(2);
  const conflicting = new Map(bundle.images),
    firstPath = bundle.content.stages[0].memory.photos[0].src;
  const other = [...bundle.images.entries()].find(
    ([path, image]) =>
      path !== firstPath &&
      !Buffer.from(image).equals(Buffer.from(bundle.images.get(firstPath))),
  );
  conflicting.set(firstPath, other[1]);
  await fresh
    .getByLabel("JSON 파일 가져오기")
    .setInputFiles({
      name: "conflict.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(createPhotoBundle(bundle.content, conflicting)),
    });
  await fresh.getByText(/같은 이름의 다른 사진이 있어요/).waitFor();
  assert.deepEqual(
    await fresh.evaluate(() =>
      JSON.parse(localStorage.getItem("doyeon-content-editor-v1")),
    ),
    saved,
  );
  await expect(fresh.locator(".ed-photo-item")).toHaveCount(2);
  console.log(
    "PASS: JPG/PNG/WebP upload, six stages, resize, per-photo captions, reorder, replacement, deletion, actual Polaroid preview, IndexedDB reload, complete ZIP export/import, dialogue retention, and zero upload requests.",
  );
} finally {
  await browser.close();
}
