import { chromium } from "@playwright/test";
import slim from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: await slim.executablePath(),
  args: slim.args,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("doyeon-love-v1"))
      localStorage.setItem(
        "doyeon-love-v1",
        '{"state":{"stage":2,"hearts":[0,1]},"version":0}',
      );
  });
  await page.goto("http://127.0.0.1:5174/__editor");
  await page.getByRole("heading", { name: "도쿄", exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("장소 선택").getByRole("button").count(),
    6,
  );
  const oldSave = await page.evaluate(() =>
    localStorage.getItem("doyeon-love-v1"),
  );
  const text = '도연아 ♡\n\n"반가워!" 😏';
  await page.getByLabel("대사 1", { exact: true }).first().fill(text);
  await page.getByText("● 저장하지 않은 변경", { exact: true }).waitFor();
  assert.equal(await page.locator(".ed-focused-preview p").innerText(), text);
  await page
    .getByRole("button", { name: "러브이즈호텔", exact: false })
    .click();
  await page
    .getByLabel("선택지 문구", { exact: true })
    .first()
    .fill("오래 안아줘 ♡");
  await page
    .getByRole("button", { name: "도쿄", exact: false })
    .first()
    .click();
  await page.getByLabel("장소 제목", { exact: true }).fill("우리의 도쿄 ♡");
  await page.getByLabel("안내 문구 1", { exact: true }).fill("함께 걸어가자 ♡");
  await page
    .getByLabel("사진 아래 설명", { exact: true })
    .fill("사진 속 우리, 참 예쁘다 ♡");
  await page
    .getByRole("button", { name: "이름과 공통 문구", exact: false })
    .click();
  await page.getByLabel("도연이 이름", { exact: true }).fill("도연공주");
  await page.getByLabel("재영이 이름", { exact: true }).fill("재영왕자");
  await page.getByLabel("공통 문구 검색").fill("만나러 가기");
  await page
    .getByLabel("만나러 가기 ♡", { exact: true })
    .fill("우리의 모험 시작 ♡");
  await page
    .getByRole("button", { name: "마지막 사랑 편지", exact: false })
    .click();
  await page
    .getByLabel("마지막 사랑 편지", { exact: true })
    .fill("첫 번째 줄 ♡\n\n두 번째 줄 😏");
  assert.equal(
    await page.locator(".ed-letter p").innerText(),
    "첫 번째 줄 ♡\n\n두 번째 줄 😏",
  );
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.reload();
  await page.getByText("✓ 저장된 초안", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "마지막 사랑 편지", exact: false })
    .click();
  assert.equal(
    await page.getByLabel("마지막 사랑 편지", { exact: true }).inputValue(),
    "첫 번째 줄 ♡\n\n두 번째 줄 😏",
  );
  await page.screenshot({ path: "/tmp/doyeon-editor-letter.png" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON 내보내기 ↗" }).click();
  const download = await downloadPromise;
  const raw = await readFile(await download.path(), "utf8"),
    content = JSON.parse(raw);
  assert.equal(content.stages.length, 6);
  assert.equal(content.stages[0].name, "우리의 도쿄 ♡");
  assert.equal(content.stages[0].intro[0], "함께 걸어가자 ♡");
  assert.equal(content.stages[0].memory.caption, "사진 속 우리, 참 예쁘다 ♡");
  assert.deepEqual(content.characters, {
    doyeon: "도연공주",
    jaeyeong: "재영왕자",
  });
  assert.equal(content.ui.text10, "우리의 모험 시작 ♡");
  assert.equal(content.stages[0].spots[0].lines[0], text);
  assert.equal(content.stages[5].choices[0].text, "오래 안아줘 ♡");
  assert.equal(content.letter, "첫 번째 줄 ♡\n\n두 번째 줄 😏");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await page
    .getByRole("button", { name: "계속 편집하기", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("마지막 사랑 편지", { exact: true }).inputValue(),
    content.letter,
  );
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await page
    .getByRole("button", { name: "전체 문구 초기화", exact: true })
    .click();
  assert.notEqual(
    await page.getByLabel("마지막 사랑 편지", { exact: true }).inputValue(),
    content.letter,
  );
  await page.getByLabel("JSON 파일 가져오기").setInputFiles({
    name: "story.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await page.getByText(/전체 내용을 가져왔어요/).waitFor();
  assert.equal(
    await page.getByLabel("마지막 사랑 편지", { exact: true }).inputValue(),
    content.letter,
  );
  await page.getByLabel("JSON 파일 가져오기").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await page.getByText(/가져오지 못했어요/).waitFor();
  assert.equal(
    await page.getByLabel("마지막 사랑 편지", { exact: true }).inputValue(),
    content.letter,
  );
  await page.getByLabel("JSON 파일 가져오기").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await page.getByText(/JSON 파일 형식이 올바르지 않아요/).waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("doyeon-love-v1")),
    oldSave,
  );
  await page
    .getByRole("button", { name: "도쿄", exact: false })
    .first()
    .click();
  await page.screenshot({ path: "/tmp/doyeon-editor.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all six stages, immediate preview, multi-stage edits, save/reload, UTF-8 JSON export/import, invalid imports, reset confirmation, and untouched game save.",
  );
  const forbidden = await page.request.get("http://127.0.0.1:5174/__editor", {
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(forbidden.status(), 403);
  const normalDev = await page.request.get("http://127.0.0.1:5173/__editor");
  assert.equal(normalDev.status(), 404);
  console.log(
    "PASS: editor disabled on normal game server; cross-origin editor request rejected.",
  );
} finally {
  await browser.close();
}
