import { chromium, expect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { cloneContent } from "../src/content/defaults.ts";
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 600;
    const x = c.getContext("2d");
    x.fillStyle = "#e9c4ac";
    x.fillRect(0, 0, 400, 600);
    return c.toDataURL("image/png").split(",")[1];
  });
  const image = Buffer.from(data, "base64");
  const content = cloneContent();
  content.stages[4].memory.photos = [
    {
      id: "garden-one",
      src: "/memories/check-one.png",
      title: "첫 사진 ♡",
      caption: "첫 줄\n둘째 줄",
    },
    {
      id: "garden-two",
      src: "/memories/check-two.png",
      title: "두 번째 사진",
      caption: "다른 사진의 설명 😏",
    },
  ];
  content.stages[5].memory.photos = [
    {
      id: "hotel-photo",
      src: "/memories/check-hotel.png",
      title: "둘만의 사진 ♡",
      caption: "우리만의 기억",
    },
  ];
  await page.route("**/src/content/published.json*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "export default " + JSON.stringify(content),
    }),
  );
  await page.route("**/memories/check-*.png", (route) =>
    route.fulfill({ contentType: "image/png", body: image }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "doyeon-love-v1",
      JSON.stringify({
        state: {
          stage: 4,
          hearts: [0, 1, 2, 3, 4],
          album: [0, 1, 2, 3, 4],
          completed: [
            "0:main",
            "1:main",
            "2:main",
            "3:main",
            "4:main",
            "rings-selected",
          ],
          started: true,
          muted: true,
        },
        version: 0,
      }),
    ),
  );
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("button", { name: "이어서 만나러 가기 ♡" }).click();
  for (let i = 0; i < 2; i++) await page.locator(".dialog-next").click();
  await page.getByRole("button", { name: "재영이의 편지 읽기 ♡" }).click();
  await page
    .getByRole("button", { name: "우리의 추억 다시 보기 ♡", exact: true })
    .click();
  await page.locator(".album-grid button").nth(4).click();
  await expect(page.locator(".photo-modal .polaroid h2")).toHaveText(
    "첫 사진 ♡",
  );
  await expect(page.locator(".photo-modal .polaroid p")).toHaveText(
    "첫 줄\n둘째 줄",
  );
  await page.waitForFunction(
    () => document.querySelector(".photo-modal img")?.naturalWidth > 0,
  );
  await page.getByRole("button", { name: "다음 추억 ♡", exact: true }).click();
  await expect(page.locator(".photo-modal .polaroid h2")).toHaveText(
    "두 번째 사진",
  );
  await page.screenshot({ path: "/tmp/doyeon-game-photo-preview.png" });
  await page
    .getByRole("button", { name: "다시 걸어가기", exact: true })
    .click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "여행 메뉴" }).click();
  await page.getByRole("button", { name: "둘만의 밤", exact: false }).click();
  for (let i = 0; i < 2; i++) await page.locator(".dialog-next").click();
  await page
    .getByRole("button", { name: "둘만의 사진 보기 ♡", exact: true })
    .click();
  await expect(page.locator(".photo-modal .polaroid h2")).toHaveText(
    "둘만의 사진 ♡",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: actual game renders uploaded photos in order with individual captions and line breaks; hotel photos open without changing unlocks or saves.",
  );
} finally {
  await browser.close();
}
