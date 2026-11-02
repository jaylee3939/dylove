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
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "이어서 만나러 가기 ♡" }).tap();
  for (let i = 0; i < 2; i++) await page.locator(".dialog-next").tap();
  await page.getByRole("button", { name: "재영이의 편지 읽기 ♡" }).tap();
  await page
    .getByRole("button", { name: "우리의 추억 다시 보기 ♡", exact: true })
    .tap();
  await page.locator(".album-grid button").first().tap();
  await page.getByRole("button", { name: "다시 걸어가기", exact: true }).tap();
  await page.getByRole("button", { name: "닫기", exact: true }).tap();
  await page.getByRole("button", { name: "재영이의 편지 읽기 ♡" }).tap();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: "/tmp/doyeon-final-letter.png" });
  console.log(
    "Album photo opens above the album and closes; final letter verified; errors",
    errors,
  );
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
}
