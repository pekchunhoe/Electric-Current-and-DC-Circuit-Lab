import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const policy = (await readFile("public/_headers", "utf8"))
  .split("\n")
  .find((l) => l.includes("Content-Security-Policy:"))
  .split("Content-Security-Policy: ")[1]
  .trim();
const browser = await chromium.launch();
const page = await browser.newPage();
const violations = [];
page.on("console", (m) => {
  if (
    m.type() === "error" &&
    /Content Security Policy|Refused|violates/.test(m.text())
  )
    violations.push(m.text());
});
await page.route("**/*", async (route) => {
  const response = await route.fetch();
  await route.fulfill({
    response,
    headers: { ...response.headers(), "content-security-policy": policy },
  });
});
await page.goto("http://127.0.0.1:4173");
for (let j = 0; j < 9; j++) {
  await page.getByRole("tab").nth(j).click();
  await page.locator(".lab-grid").waitFor();
  if (await page.locator(".katex-error").count()) throw Error("Equation error");
}
await page.getByRole("button", { name: "Challenge", exact: true }).click();
await page.getByPlaceholder("Enter your prediction").fill("1");
await page.getByRole("button", { name: "Check answer" }).click();
await page.locator(".feedback.correct").waitFor();
const result = { policy, tabsLoaded: 9, challengeSubmission: true, violations };
await mkdir("test-results", { recursive: true });
await writeFile("test-results/security.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (violations.length) process.exitCode = 1;
