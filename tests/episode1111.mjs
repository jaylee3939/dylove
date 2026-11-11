import { chromium, expect as baseExpect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import {
  episode,
  specialLetter,
  EPISODE_SAVE_KEY,
} from "../src/episodes/1111/content.ts";
import {
  heartPositions,
  EXPLORE_SAVE_KEY,
} from "../src/episodes/1111/exploration.ts";
const expect = baseExpect.configure({ timeout: 120000 }),
  base = process.env.EPISODE_BASE_URL ?? "http://127.0.0.1:5173";
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
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/special/1111", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("doyeon-love-v1", "main-preserved");
    localStorage.setItem("doyeon-content-editor-v1", "editor-preserved");
  });
  await page.getByRole("button", { name: "11:11에 만나러 가기 ♡" }).tap();
  await expect(page.locator(".special-explore canvas")).toBeVisible();
  await expect(page.locator(".explore-interact")).toBeDisabled();
  async function pos() {
    return page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k) || '{"x":0,"z":4.8}'),
      EXPLORE_SAVE_KEY,
    );
  }
  async function walk(x, z) {
    await expect(page.locator(".special-event-wrap")).toBeHidden();
    const held = new Set();
    try {
      for (let i = 0; i < 600; i++) {
        const p = await pos();
        if (Math.hypot(x - p.x, z - p.z) < 0.48) return;
        const wanted = new Set();
        if (Math.abs(x - p.x) > 0.3) wanted.add(x > p.x ? "d" : "a");
        if (Math.abs(z - p.z) > 0.3) wanted.add(z > p.z ? "s" : "w");
        for (const k of held)
          if (!wanted.has(k)) {
            await page.keyboard.up(k);
            held.delete(k);
          }
        for (const k of wanted)
          if (!held.has(k)) {
            await page.keyboard.down(k);
            held.add(k);
          }
        await page.waitForTimeout(180);
      }
      throw Error(
        "Walking target was not reached: " +
          JSON.stringify({ x, z, current: await pos() }),
      );
    } finally {
      for (const k of held) await page.keyboard.up(k);
    }
  }
  async function mission(x, z) {
    await walk(x, z);
    await expect(page.locator(".explore-interact")).toBeEnabled();
    await page.keyboard.press("e");
    await expect(page.locator(".special-event-wrap")).toBeVisible();
  }
  async function lines(chapter) {
    for (let i = 0; i < episode.chapters[chapter].lines.length; i++)
      await page
        .getByRole("button", { name: "대사 눌러 다음으로", exact: true })
        .tap();
  }
  const close = () =>
    page
      .getByRole("button", { name: "공간으로 돌아가기 ♡", exact: true })
      .tap();
  const advance = () =>
    page.getByRole("button", { name: "다음 이야기로 →", exact: true }).tap();
  // Use the actual original touch joystick for the first mission.
  const bounds = await page.locator(".joystick").boundingBox(),
    client = await page.context().newCDPSession(page);
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y - 34 }],
  });
  await expect(page.locator(".explore-interact")).toBeEnabled();
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.ok((await pos()).z < 4.5);
  await page.locator(".explore-interact").tap();
  await lines(0);
  await advance();
  console.log("PASS mobile joystick and prologue");
  await mission(0, -2);
  await lines(1);
  await page.getByRole("button", { name: "3일", exact: true }).tap();
  await expect(page.locator(".eleven-feedback")).toBeVisible();
  await page.getByRole("button", { name: "하루", exact: true }).tap();
  await advance();
  console.log("PASS Busan mission and quiz");
  await mission(-2.7, -1.5);
  await lines(2);
  await page.getByRole("button", { name: "샐러드", exact: true }).tap();
  await page.getByRole("button", { name: "엽떡", exact: true }).tap();
  await close();
  await mission(2.7, -1.5);
  await page.getByRole("button", { name: "섹스탕(명상탕)", exact: true }).tap();
  await advance();
  console.log("PASS both memory object missions");
  await mission(0, 3);
  await lines(3);
  await close();
  for (let i = 0; i < heartPositions.length; i++) {
    await walk(...heartPositions[i]);
    await expect
      .poll(async () =>
        page.evaluate(
          ({ key, id }) =>
            JSON.parse(localStorage.getItem(key)).hearts.includes(id),
          { key: EPISODE_SAVE_KEY, id: i },
        ),
      )
      .toBe(true);
    if (i === 2) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator(".explore-hud")).toContainText("♡ 3/11");
    }
  }
  await page.screenshot({
    path: "/tmp/1111-explore-garden.png",
    timeout: 120000,
  });
  await mission(0, 3);
  await page.getByRole("button", { name: "꼭 안아주기 ♡", exact: true }).tap();
  await page
    .getByRole("button", { name: "뽀뽀로 답장하기 ♡", exact: true })
    .tap();
  await advance();
  await mission(-2, 0);
  await lines(4);
  const choice = episode.chapters[4].choices[0];
  await page.getByRole("button", { name: new RegExp("^" + choice.text) }).tap();
  await page
    .getByRole("button", { name: "마지막 편지 만나러 가기 ♡", exact: true })
    .tap();
  await mission(2, -2.5);
  await lines(5);
  await page.locator(".eleven-envelope").tap();
  assert.equal(
    (await page.locator(".eleven-love-letter p").allTextContents())
      .join("\n")
      .replace(/\u00a0/g, "") === specialLetter,
    true,
  );
  await page
    .getByRole("button", { name: "다 읽었어. 꼭 안아줘 ♡", exact: true })
    .tap();
  await expect(page.locator(".eleven-finale")).toBeVisible();
  await close();
  await page.screenshot({
    path: "/tmp/1111-explore-ending.png",
    timeout: 120000,
  });
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    EPISODE_SAVE_KEY,
  );
  assert.equal(saved.screen, "ending");
  assert.equal(saved.hearts.length, 11);
  assert.equal(saved.ceremony, 2);
  assert.deepEqual(
    await page.evaluate(() => [
      localStorage.getItem("doyeon-love-v1"),
      localStorage.getItem("doyeon-content-editor-v1"),
    ]),
    ["main-preserved", "editor-preserved"],
  );
  await expect(page.locator(".special-explore.explore-finale")).toBeVisible();
  await page.getByRole("button", { name: "여행 메뉴", exact: true }).tap();
  await page
    .getByRole("button", { name: "편지와 엔딩 다시 보기 ♡", exact: true })
    .tap();
  await expect(page.locator(".eleven-finale")).toBeVisible();
  await close();
  await page.getByRole("button", { name: "여행 메뉴", exact: true }).tap();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "스페셜 처음부터", exact: true })
    .tap();
  await expect(
    page.getByRole("button", { name: "11:11에 만나러 가기 ♡", exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.evaluate((k) => localStorage.getItem(k), EXPLORE_SAVE_KEY),
    null,
  );
  assert.deepEqual(
    await page.evaluate(() => [
      localStorage.getItem("doyeon-love-v1"),
      localStorage.getItem("doyeon-content-editor-v1"),
    ]),
    ["main-preserved", "editor-preserved"],
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real mobile joystick, keyboard traversal of four maps, proximity-only mission events, quiz retries, 11 spatial hearts with reload, hug/kiss, date and letter discovery, ending, preserved main/editor saves.",
  );
} catch (error) {
  const pages = browser.contexts().flatMap((c) => c.pages());
  if (pages[0])
    await pages[0]
      .screenshot({ path: "/tmp/1111-explore-error.png", timeout: 120000 })
      .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
