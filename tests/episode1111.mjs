import { chromium, expect as baseExpect } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import {
  episode,
  specialLetter,
  EPISODE_SAVE_KEY,
} from "../src/episodes/1111/content.ts";
const expect = baseExpect.configure({ timeout: 60000 }),
  baseURL = process.env.EPISODE_BASE_URL ?? "http://127.0.0.1:5173";
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
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const mainSave = JSON.stringify({
    state: {
      stage: 0,
      hearts: [],
      album: [],
      completed: [],
      started: true,
      muted: true,
    },
    version: 0,
  });
  await page.addInitScript((main) => {
    if (!localStorage.getItem("doyeon-love-v1"))
      localStorage.setItem("doyeon-love-v1", main);
    if (!localStorage.getItem("doyeon-content-editor-v1"))
      localStorage.setItem("doyeon-content-editor-v1", "editor-sentinel");
  }, mainSave);
  const reload = async () => {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    await page.locator('[data-episode="1111"]').waitFor();
  };
  async function dialogue(index) {
    for (let i = 0; i < episode.chapters[index].lines.length; i++)
      await page
        .getByRole("button", { name: "대사 눌러 다음으로", exact: true })
        .tap();
  }
  async function stage(index) {
    await expect(page.locator(".eleven-stage-heading h2")).toHaveText(
      episode.chapters[index].title,
    );
  }
  await page.goto(baseURL + "/special/1111", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.getByRole("button", { name: "11:11에 만나러 가기 ♡" }).tap();
  await stage(0);
  await dialogue(0);
  await page
    .getByRole("button", { name: "다음 이야기로 →", exact: true })
    .tap();
  await stage(1);
  await dialogue(1);
  await page.getByRole("button", { name: "3일", exact: true }).tap();
  await expect(
    page.getByText(episode.chapters[1].quiz[0].retry, { exact: false }),
  ).toBeVisible();
  assert.equal(await page.locator(".eleven-next").count(), 0);
  await page.getByRole("button", { name: "하루", exact: true }).tap();
  await expect(page.locator(".eleven-feedback.correct")).toContainText("열흘");
  for (const item of episode.chapters[1].reflections)
    await page.getByRole("button", { name: new RegExp(item.title) }).tap();
  await expect(page.locator(".eleven-memory-sky")).toBeVisible();
  await page.screenshot({ path: "/tmp/doyeon-1111-sea.png", timeout: 120000 });
  await page
    .getByRole("button", { name: "다음 이야기로 →", exact: true })
    .tap();
  await stage(2);
  await dialogue(2);
  await page.getByRole("button", { name: "샐러드", exact: true }).tap();
  await page.getByRole("button", { name: "엽떡", exact: true }).tap();
  await page.getByRole("button", { name: "구름탕", exact: true }).tap();
  await page.getByRole("button", { name: "섹스탕(명상탕)", exact: true }).tap();
  await expect(page.locator(".eleven-feedback.correct")).toHaveCount(2);
  await page
    .getByRole("button", { name: "다음 이야기로 →", exact: true })
    .tap();
  await stage(3);
  await dialogue(3);
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: `하트 ${i} 받기`, exact: true })
      .tap();
  await expect(
    page.getByRole("progressbar", { name: "하트 수집 진행" }),
  ).toHaveAttribute("aria-valuenow", "3");
  await reload();
  await stage(3);
  await expect(
    page.getByRole("progressbar", { name: "하트 수집 진행" }),
  ).toHaveAttribute("aria-valuenow", "3");
  for (let i = 4; i <= 11; i++)
    await page
      .getByRole("button", { name: `하트 ${i} 받기`, exact: true })
      .tap();
  await expect(
    page.getByRole("progressbar", { name: "하트 수집 진행" }),
  ).toHaveAttribute("aria-valuenow", "11");
  await expect(
    page.getByRole("button", { name: "뽀뽀로 답장하기 ♡", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "꼭 안아주기 ♡", exact: true }).tap();
  await page
    .getByRole("button", { name: "뽀뽀로 답장하기 ♡", exact: true })
    .tap();
  await page.screenshot({
    path: "/tmp/doyeon-1111-hearts.png",
    timeout: 120000,
  });
  await page
    .getByRole("button", { name: "다음 이야기로 →", exact: true })
    .tap();
  await stage(4);
  await dialogue(4);
  for (const choice of episode.chapters[4].choices) {
    await page
      .getByRole("button", { name: new RegExp("^" + choice.text) })
      .tap();
    await expect(page.locator(".eleven-date-reply p")).toHaveText(choice.reply);
  }
  await reload();
  await stage(4);
  const selected = episode.chapters[4].choices.at(-1);
  await expect(page.locator(".eleven-dates>button.selected")).toContainText(
    selected.text,
  );
  await page
    .getByRole("button", { name: "마지막 편지 만나러 가기 ♡", exact: true })
    .tap();
  await stage(5);
  await dialogue(5);
  await page.locator(".eleven-envelope").tap();
  await expect(page.locator(".eleven-love-letter")).toBeVisible();
  const text = await page
    .locator(".eleven-love-letter p")
    .evaluateAll((nodes) =>
      nodes
        .map((n) => (n.textContent === "\u00a0" ? "" : n.textContent))
        .join("\n"),
    );
  assert.equal(text, specialLetter);
  await expect(page.locator(".eleven-date-promise p")).toHaveText(
    selected.ending,
  );
  await reload();
  await expect(page.locator(".eleven-love-letter")).toBeVisible();
  await page
    .getByRole("button", { name: "다 읽었어. 꼭 안아줘 ♡", exact: true })
    .tap();
  await expect(page.locator(".eleven-finale")).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    EPISODE_SAVE_KEY,
  );
  assert.equal(saved.screen, "ending");
  assert.equal(saved.hearts.length, 11);
  assert.equal(saved.ceremony, 2);
  assert.equal(saved.dateChoice, selected.id);
  assert.equal(saved.envelopeOpen, true);
  assert.equal(
    await page.evaluate(
      () => document.querySelector(".eleven-app").scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "/tmp/doyeon-1111-ending.png",
    timeout: 120000,
  });
  await page
    .getByRole("button", { name: "스페셜 처음으로", exact: true })
    .click();
  await page
    .getByRole("button", { name: "스페셜 처음부터", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "11:11에 만나러 가기 ♡" }),
  ).toBeVisible();
  assert.deepEqual(
    await page.evaluate(() => [
      localStorage.getItem("doyeon-love-v1"),
      localStorage.getItem("doyeon-content-editor-v1"),
    ]),
    [mainSave, "editor-sentinel"],
  );
  await page.getByRole("link", { name: "← 우리의 본편" }).click();
  await expect(
    page.getByRole("button", { name: "이어서 만나러 가기 ♡" }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: full touch journey; all quizzes including wrong-answer retries; 11 hearts; reload checkpoints; hug/kiss; all date responses; exact full letter; ending; isolated reset and main-game return. No browser errors.",
  );
} finally {
  await browser.close();
}
