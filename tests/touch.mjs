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
await page.goto("http://localhost:5173");
await page.getByRole("button", { name: "만나러 가기 ♡", exact: true }).tap();
for (let i = 0; i < 2; i++) await page.locator(".dialog-next").tap();
const b = await page.locator(".joystick").boundingBox(),
  client = await page.context().newCDPSession(page);
const x = b.x + b.width / 2,
  y = b.y + b.height / 2;
await client.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x, y }],
});
await client.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [{ x, y: y - 34 }],
});
await page.waitForFunction(
  () =>
    document.querySelector("#interact")?.textContent.includes("사진 남기기"),
  {},
  { timeout: 120000 },
);
await client.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await page.locator("#interact").tap();
await page.locator(".dialog-next").tap();
await page.getByRole("button", { name: "다시 걸어가기", exact: true }).tap();
await page.locator("#interact").tap();
console.log("TOUCH", await page.locator(".progress").innerText());
await browser.close();
