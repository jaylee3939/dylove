import { chromium } from "@playwright/test";
import slim from "@sparticuz/chromium";
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
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(process.env.GAME_BASE_URL ?? "http://localhost:5173");
await page.getByRole("button", { name: "만나러 가기 ♡", exact: true }).click();
async function dismiss() {
  for (let i = 0; i < 5; i++) {
    const b = page.locator(".dialog-next");
    if (!(await b.count())) break;
    await b.click();
  }
}
await dismiss();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/doyeon-mobile.png" });
console.log(
  "canvas",
  await page.locator("canvas").count(),
  "mobile overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
await page.keyboard.down("w");
await page.waitForFunction(
  () =>
    document.querySelector("#interact")?.textContent.includes("사진 남기기"),
  {},
  { timeout: 120000 },
);
await page.keyboard.up("w");
await page.waitForTimeout(200);
console.log("interaction", await page.locator("#interact").innerText());
await page.locator("#interact").click();
await dismiss();
await page.getByRole("button", { name: "다시 걸어가기", exact: true }).click();
await page.locator("#interact").click();
await page.getByRole("button", { name: "다음 추억으로 →" }).click();
await dismiss();
console.log("stage 2", await page.locator(".hud h2").innerText());
await page.keyboard.down("w");
await page.waitForFunction(
  () =>
    document.querySelector("#interact")?.textContent.includes("재영이와 식사"),
  {},
  { timeout: 120000 },
);
await page.keyboard.up("w");
await page.waitForTimeout(200);
await page.locator("#interact").click();
await page.locator(".dialog-next").click();
await page
  .getByRole("button", { name: "일단 너부터 볼래 ㅎㅎ", exact: true })
  .click();
await page.locator(".dialog-next").click();
await page.getByRole("button", { name: "다시 걸어가기", exact: true }).click();
await page.locator("#interact").click();
console.log("progress", await page.locator(".progress").innerText());
await page.reload();
await page.getByRole("button", { name: "이어서 만나러 가기 ♡" }).click();
await dismiss();
console.log("saved", await page.locator(".progress").innerText());
await page.screenshot({ path: "/tmp/doyeon-stage2.png" });
async function walkTo(label) {
  await page.keyboard.down("w");
  await page.waitForFunction(
    (label) => document.querySelector("#interact")?.textContent.includes(label),
    label,
    { timeout: 120000 },
  );
  await page.keyboard.up("w");
}
async function finishChoice(label) {
  await page.locator("#interact").click();
  await dismiss();
  await page.getByRole("button", { name: label, exact: true }).click();
  await dismiss();
  await page
    .getByRole("button", { name: "다시 걸어가기", exact: true })
    .click();
  await page.locator("#interact").click();
}
await page.getByRole("button", { name: "다음 추억으로 →" }).click();
await dismiss();
await walkTo("커플링 고르기");
await finishChoice("따뜻한 골드 링");
console.log("rings complete");
await page.getByRole("button", { name: "다음 추억으로 →" }).click();
await dismiss();
await walkTo("재영이 부르기");
await finishChoice("안아주기");
console.log("office complete");
await page.getByRole("button", { name: "다음 추억으로 →" }).click();
await dismiss();
await walkTo("재영이에게 가기");
await page.locator("#interact").click();
await dismiss();
await page.locator("#interact").click();
await page.getByRole("button", { name: "다음 추억 ♡" }).click();
await page.getByRole("button", { name: "다음 추억 ♡" }).click();
await page.getByRole("button", { name: "마음속에 간직하기 ♡" }).click();
console.log("ending", await page.locator(".letter-body").innerText());
await page.screenshot({ path: "/tmp/doyeon-ending.png" });
await page
  .getByRole("button", { name: "우리의 추억 다시 보기 ♡", exact: true })
  .click();
console.log(
  "album unlocked",
  await page.locator(".album-grid button:enabled").count(),
);
await page.getByRole("button", { name: "닫기", exact: true }).click();
await page.getByRole("button", { name: "여행 메뉴" }).click();
await page.getByRole("button", { name: "둘만의 밤", exact: false }).click();
await dismiss();
await walkTo("재영이에게 다가가기");
await page.locator("#interact").click();
await dismiss();
await page.getByRole("button", { name: "불 끌까? ㅎㅎ", exact: true }).click();
await dismiss();
await page.getByRole("button", { name: "우리의 추억으로 돌아가기" }).click();
await dismiss();
await page.setViewportSize({ width: 1440, height: 900 });
await page.screenshot({ path: "/tmp/doyeon-desktop.png" });
console.log("all six stages complete, errors", errors);
if (errors.length) throw new Error(errors.join("\n"));
await browser.close();
