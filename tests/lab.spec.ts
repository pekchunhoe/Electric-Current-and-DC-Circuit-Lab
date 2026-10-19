import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const tabs = (p: Page) => p.getByRole("tab");
async function open(p: Page, n = 0) {
  await p.goto("/");
  await tabs(p).nth(n).click();
  await expect(p.locator(".lab-grid")).toBeVisible();
}
async function set(p: Page, label: string, value: number) {
  await p
    .getByRole("spinbutton", { name: `${label} exact value`, exact: true })
    .fill(String(value));
}
const meter = (p: Page, n: number) => p.locator(".meters .meter strong").nth(n);
async function pauseClock(p: Page) {
  const start = new Date("2026-01-01T00:00:00Z");
  await p.clock.install({ time: start });
  // A fixed future target avoids racing the browser against the host clock.
  await p.clock.pauseAt(new Date(start.getTime() + 1000));
}
test("numeric fields allow decimal and signed typing while rejecting invalid physical values", async ({
  page,
}) => {
  await open(page, 7);
  const input = page.getByRole("spinbutton", {
    name: "Divider R1 exact value",
  });
  await input.fill("");
  await input.pressSequentially("0.5");
  await input.blur();
  await expect(input).toHaveValue("0.5");
  await expect(meter(page, 2)).toHaveText("4.5kΩ");
  await input.fill("99");
  await input.blur();
  await expect(input).toHaveValue("0.5");
  await expect(meter(page, 2)).toHaveText("4.5kΩ");
  await tabs(page).nth(5).click();
  const signed = page.getByRole("spinbutton", {
    name: "Source ε₁ exact value",
  });
  await signed.fill("");
  await signed.pressSequentially("-12");
  await signed.blur();
  await expect(signed).toHaveValue("-12");
  const ids = await page
    .locator("input[id]")
    .evaluateAll((es) => es.map((e) => e.id));
  expect(new Set(ids).size).toBe(ids.length);
});
test("all nine tabs: phone and desktop layout, equations and accessible navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [375, 812],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1280, 800],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    for (let n = 0; n < 9; n++) {
      await tabs(page).nth(n).click();
      await expect(page.locator(".lab-grid")).toBeVisible();
      await expect(page.locator(".katex-error")).toHaveCount(0);
      await expect(page.locator(".katex")).not.toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow at ${width}, tab ${n + 1}`,
      ).toBe(true);
      const clipped = await page
        .locator(".equation>div")
        .evaluateAll(
          (es) => es.filter((e) => e.scrollWidth > e.clientWidth + 2).length,
        );
      expect(clipped, `equation overflow ${width} tab ${n + 1}`).toBe(0);
      if (width === 390 || width === 1280) {
        await page.screenshot({
          path: `test-results/${info.project.name}-${width}-tab-${n + 1}.png`,
          fullPage: true,
        });
      }
    }
  }
  expect(errors).toEqual([]);
  await tabs(page).nth(8).focus();
  await page.keyboard.press("Home");
  await expect(tabs(page).nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(tabs(page).nth(1)).toHaveAttribute("aria-selected", "true");
});
test("physical controls, state preservation and reset", async ({ page }) => {
  await open(page);
  await set(page, "Applied voltage", 0.068);
  await expect(meter(page, 0)).toHaveText("2A");
  await set(page, "Animation speed", 3);
  await expect(meter(page, 0)).toHaveText("2A");
  await tabs(page).nth(1).click();
  await tabs(page).nth(0).click();
  await expect(meter(page, 0)).toHaveText("2A");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(meter(page, 0)).toHaveText("1A");
  await tabs(page).nth(1).click();
  await set(page, "Supply voltage", 6);
  await expect(meter(page, 0)).toHaveText("1A");
  await page
    .getByRole("switch", { name: "Circuit switch · closed", exact: true })
    .click();
  await expect(meter(page, 0)).toHaveText("0A");
  await page.getByLabel("Test component", { exact: true }).selectOption("wire");
  await expect(meter(page, 2)).toHaveText("0.034Ω");
  await set(page, "Conductor length", 4);
  await expect(meter(page, 2)).toHaveText("0.068Ω");
  await set(page, "Cross-sectional area", 2);
  await expect(meter(page, 2)).toHaveText("0.034Ω");
  await tabs(page).nth(2).click();
  await set(page, "Temperature", 20);
  await expect(meter(page, 1)).toHaveText("10Ω");
  await set(page, "Temperature", 70);
  await expect(meter(page, 1)).toHaveText("12Ω");
  await tabs(page).nth(3).click();
  await expect(meter(page, 1)).toHaveText("10V");
  await page
    .getByRole("switch", { name: "Circuit switch · closed", exact: true })
    .click();
  await expect(meter(page, 0)).toHaveText("0A");
  await expect(meter(page, 1)).toHaveText("12V");
});
test("Ohm experiment records five distinct points and fits resistance", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Experiment", exact: true }).click();
  for (const v of [3, 6, 9, 12, 15]) {
    await set(page, "Supply voltage", v);
    await page.getByRole("button", { name: "Record reading" }).click();
  }
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(
    page.getByText("Least-squares fit of your recorded points:", {
      exact: false,
    }),
  ).toContainText("gradient 6, intercept 0");
  await page.getByRole("button", { name: "Clear data" }).click();
  await expect(page.getByText("0 readings")).toBeVisible();
});
test("series, parallel and mixed configurations inspect real branch values", async ({
  page,
}) => {
  await open(page, 4);
  await expect(meter(page, 0)).toHaveText("1.2A");
  await page.getByLabel("Circuit configuration").selectOption("parallel2");
  await expect(meter(page, 0)).toHaveText("5A");
  await page.getByLabel("Inspect component").selectOption("1");
  await expect(meter(page, 1)).toHaveText("12V");
  await expect(meter(page, 2)).toHaveText("24W");
  for (const config of ["series3", "parallel3", "mixed"]) {
    await page.getByLabel("Circuit configuration").selectOption(config);
    await expect(page.locator(".stage")).toBeVisible();
    await expect(page.locator(".katex-error")).toHaveCount(0);
  }
  await page
    .getByRole("switch", { name: "Circuit switch", exact: true })
    .click();
  await expect(meter(page, 0)).toHaveText("0A");
});
test("Kirchhoff signed currents, equation activity and two loop conservation", async ({
  page,
}) => {
  await open(page, 5);
  await set(page, "Source ε₂ (signed)", -18);
  await expect(meter(page, 1)).toContainText("-1.91");
  await page
    .getByRole("switch", { name: "Assume I₂ clockwise", exact: true })
    .click();
  await expect(meter(page, 1)).toHaveText("1.91A");
  await page
    .getByLabel("Construct the junction equation", { exact: false })
    .fill("i1 = i2 + is");
  await page.getByRole("button", { name: "Check equation" }).click();
  await expect(page.getByRole("status")).toContainText("Correct");
  await page.getByLabel("Loop I₁ coefficient", { exact: true }).fill("6");
  await page.getByLabel("Loop I₂ coefficient", { exact: true }).fill("2");
  await page.getByLabel("Loop source term", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Check loop equation" }).click();
  await expect(page.getByRole("status").last()).toContainText("Correct");
  await page.getByLabel("Loop to analyse").selectOption("right");
  await page
    .getByRole("switch", { name: "Clockwise traversal", exact: true })
    .click();
  await expect(page.getByText("KVL residual:", { exact: false })).toContainText(
    "0",
  );
  await page
    .getByRole("button", { name: "Reveal simultaneous solution" })
    .click();
  await expect(page.locator(".solution")).toContainText("Determinant");
  await page.getByLabel("Circuit structure").selectOption("single");
  await expect(meter(page, 0)).toHaveText("2A");
});
test("energy integration uses elapsed time and piecewise power", async ({
  page,
}) => {
  await open(page, 6);
  await pauseClock(page);
  await page.getByRole("button", { name: "Run stopwatch" }).click();
  await page.clock.runFor(10000);
  await expect(meter(page, 1)).toHaveText("240J");
  await expect(meter(page, 2)).toHaveText("10s");
  await set(page, "Applied voltage", 24);
  await page.clock.runFor(5000);
  await expect(meter(page, 1)).toHaveText("720J");
  await page.getByRole("button", { name: "Pause stopwatch" }).click();
  await page.clock.runFor(5000);
  await expect(meter(page, 1)).toHaveText("720J");
  await page.getByRole("button", { name: "Reset energy", exact: true }).click();
  await expect(meter(page, 1)).toHaveText("0J");
});
test("divider signed probe selection, third resistor and pointer drag", async ({
  page,
}) => {
  await open(page, 7);
  await expect(meter(page, 0)).toHaveText("8V");
  await page.getByLabel("Positive output terminal").selectOption("0");
  await page.getByLabel("Negative output terminal").selectOption("1");
  await expect(meter(page, 0)).toHaveText("4V");
  await page.getByRole("switch", { name: "Include third resistor" }).click();
  await expect(meter(page, 2)).toHaveText("9kΩ");
  const rect = await page.locator(".stage").boundingBox();
  if (!rect) throw Error("Missing divider");
  const x = rect.x + (180 / 600) * rect.width,
    y = rect.y + (220 / 360) * rect.height;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(rect.x + (400 / 600) * rect.width, y, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByLabel("Positive output terminal")).toHaveValue("2");
});
test("potentiometer null experiment, cell comparison and unattainable balance", async ({
  page,
}) => {
  await open(page, 8);
  await expect(page.locator(".galvanometer strong")).toHaveText("NULL");
  await page.getByRole("button", { name: "Record null balance" }).click();
  await page.getByRole("switch", { name: "Connect cell load" }).click();
  await set(page, "Jockey position", 64);
  await expect(page.locator(".galvanometer strong")).toHaveText("NULL");
  await page.getByRole("button", { name: "Record null balance" }).click();
  await expect(page.locator(".result-callout")).toContainText("1 Ω");
  await page.getByRole("switch", { name: "Connect cell load" }).click();
  await page.getByLabel("Test cell", { exact: true }).selectOption("2");
  await set(page, "Jockey position", 60);
  await page.getByRole("button", { name: "Record null balance" }).click();
  await expect(page.locator(".result-callout").last()).toContainText("1.33");
  await page.locator(".stage").scrollIntoViewIfNeeded();
  const rect = await page.locator(".stage").boundingBox();
  if (!rect) throw Error("Missing potentiometer");
  const y = rect.y + (170 / 360) * rect.height;
  await page.mouse.move(rect.x + ((70 + 60 * 4.6) / 600) * rect.width, y);
  await page.mouse.down();
  await page.mouse.move(rect.x + ((70 + 50 * 4.6) / 600) * rect.width, y, {
    steps: 10,
  });
  await page.mouse.up();
  // Firefox rounds native mouse coordinates to CSS pixels; allow the corresponding 0.2 cm.
  expect(
    Math.abs(
      Number(
        await page
          .getByRole("spinbutton", { name: "Jockey position exact value" })
          .inputValue(),
      ) - 50,
    ),
  ).toBeLessThanOrEqual(0.2);
  await set(page, "Primary supply", 1);
  await expect(page.locator(".status-warning")).toContainText("No null exists");
  await expect(page.locator("tbody tr")).toHaveCount(0);
});
test("all nine challenges: attempts, progressive hints, correct answers and worked solutions", async ({
  page,
}) => {
  await page.goto("/");
  for (const [n, answer] of [1, 2, 12, 10, 10, 12 / 11, 240, 4, 1].entries()) {
    await tabs(page).nth(n).click();
    await page.getByRole("button", { name: "Challenge", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Show worked solution" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: /^Hint/ }).click();
    await expect(page.locator(".hint p")).toHaveCount(1);
    await page.getByPlaceholder("Enter your prediction").fill("9999");
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.locator(".feedback.incorrect")).toBeVisible();
    await page.getByPlaceholder("Enter your prediction").fill(String(answer));
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.locator(".feedback.correct")).toBeVisible();
    await page.getByRole("button", { name: "Show worked solution" }).click();
    await expect(page.locator(".solution")).toBeVisible();
  }
});
test("light theme, reduced motion, local requests and performance evidence", async ({
  page,
}, info) => {
  const outbound: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:")
    )
      outbound.push(r.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 3);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator(".app")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: `test-results/${info.project.name}-light.png`,
    fullPage: true,
  });
  await tabs(page).nth(5).click();
  expect(
    await page
      .locator(".flow")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  expect(outbound).toEqual([]);
  const timings = await page.evaluate(() => {
    const n = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: n.domContentLoadedEventEnd,
      load: n.loadEventEnd,
      resources: performance.getEntriesByType("resource").length,
    };
  });
  await info.attach("performance.json", {
    body: JSON.stringify(timings),
    contentType: "application/json",
  });
});
test("accessibility audit of all nine experiments in both themes", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
      await page.getByRole("button", { name: "Switch to light theme" }).click();
    for (let j = 0; j < 9; j++) {
      await tabs(page).nth(j).click();
      await expect(page.locator(".lab-grid")).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        `${theme} tab ${j + 1}`,
      ).toEqual([]);
    }
  }
});
test("touch jockey drag and keyboard fine adjustment on a phone", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "CDP touch injection is Chromium-specific; pointer and keyboard tests cover all engines.",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page, 8);
  await page.locator(".stage").scrollIntoViewIfNeeded();
  const box = (await page.locator(".stage").boundingBox())!;
  const client = await context.newCDPSession(page);
  const y = box.y + (170 / 360) * box.height,
    x = box.x + ((70 + 80 * 4.6) / 600) * box.width;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let j = 1; j <= 10; j++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - ((j * 4.6) / 600) * box.width, y }],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByRole("spinbutton", { name: "Jockey position exact value" }),
  ).toHaveValue("70");
  await page
    .getByRole("slider", { name: "Jockey position", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("spinbutton", { name: "Jockey position exact value" }),
  ).toHaveValue("70.1");
  await context.close();
});
test("charge counter integrates independent of animation speed", async ({
  page,
}) => {
  await open(page);
  await pauseClock(page);
  await set(page, "Animation speed", 3);
  await page.getByRole("button", { name: "Start charge count" }).click();
  await page.clock.runFor(1000);
  await expect(meter(page, 2)).toHaveText("1C");
  await set(page, "Applied voltage", 0.068);
  await page.clock.runFor(1000);
  await expect(meter(page, 2)).toHaveText("3C");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(meter(page, 2)).toHaveText("0C");
});
test("material, reference, battery, divider and cell controls recompute correctly", async ({
  page,
}) => {
  await open(page, 2);
  await set(page, "Reference resistance at 20°C", 20);
  await expect(meter(page, 1)).toHaveText("24Ω");
  await set(page, "Temperature coefficient α", 0.002);
  await expect(meter(page, 1)).toHaveText("22Ω");
  await set(page, "Fixed voltage", 22);
  await expect(meter(page, 2)).toHaveText("1A");
  await tabs(page).nth(3).click();
  await set(page, "Battery emf ε", 6);
  await expect(meter(page, 0)).toHaveText("1A");
  await set(page, "Internal resistance r", 2);
  await set(page, "External load R", 4);
  await expect(meter(page, 1)).toHaveText("4V");
  await tabs(page).nth(7).click();
  await set(page, "Supply voltage", 18);
  await expect(meter(page, 0)).toHaveText("12V");
  await set(page, "Divider R1", 4);
  await expect(meter(page, 0)).toHaveText("9V");
  await set(page, "Divider R2", 8);
  await expect(meter(page, 0)).toHaveText("12V");
  await page.getByRole("switch", { name: "Include third resistor" }).click();
  await set(page, "Divider R3", 6);
  await expect(meter(page, 0)).toHaveText("8V");
  await page.getByRole("switch", { name: "Supply switch" }).click();
  await expect(meter(page, 0)).toHaveText("0V");
  await tabs(page).nth(8).click();
  await set(page, "Rheostat", 0);
  await expect(meter(page, 0)).toHaveText("0.04V/cm");
  await set(page, "Cell 1 emf", 2);
  await expect(meter(page, 2)).toHaveText("2V");
  await page.getByRole("switch", { name: "Connect cell load" }).click();
  await set(page, "Cell internal resistance", 2);
  await set(page, "Known external load", 2);
  await expect(meter(page, 2)).toHaveText("1V");
});
test("graph point inspection and challenge scoring survive navigation without stale answers", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Record reading" }).click();
  await page
    .getByRole("combobox", { name: "Inspect recorded graph point" })
    .selectOption("0");
  await expect(
    page.getByRole("combobox", { name: "Inspect recorded graph point" }),
  ).toHaveValue("0");
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.getByPlaceholder("Enter your prediction").fill("2");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("1 correct", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Enter your prediction").fill("2");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("1 correct", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await set(page, "Supply voltage", 6);
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await expect(page.getByPlaceholder("Enter your prediction")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Show worked solution" }),
  ).toHaveCount(0);
});
test("capture graph, switching and feedback states for visual review", async ({
  page,
}, info) => {
  await open(page, 3);
  await page
    .getByRole("switch", { name: "Circuit switch · closed", exact: true })
    .click();
  await page
    .locator(".bench")
    .screenshot({ path: `test-results/${info.project.name}-open-circuit.png` });
  await tabs(page).nth(1).click();
  for (const v of [3, 6, 9, 12, 15]) {
    await set(page, "Supply voltage", v);
    await page.getByRole("button", { name: "Record reading" }).click();
  }
  await page.locator(".notebook").screenshot({
    path: `test-results/${info.project.name}-graph-five-readings.png`,
  });
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.getByPlaceholder("Enter your prediction").fill("999");
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.locator(".feedback").screenshot({
    path: `test-results/${info.project.name}-incorrect-feedback.png`,
  });
  await page.getByPlaceholder("Enter your prediction").fill("2.5");
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.locator(".feedback").screenshot({
    path: `test-results/${info.project.name}-correct-feedback.png`,
  });
});
