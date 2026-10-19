import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = { e1: 18, e2: -18, r1: 4, r2: 6, rs: 5 };
type Parameters = typeof base;
const labels = {
  e1: "Source ε₁",
  e2: "Source ε₂ (signed)",
  r1: "Resistance R₁",
  r2: "Resistance R₂",
  rs: "Shared resistance Rₛ",
};
const names = ["I₁", "I₂", "I₃"];
const text = (value: number) =>
  Math.abs(value) < 1e-9
    ? "0.000"
    : `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
// Independent nodal solution; do not import the production mesh/branch model.
function nodal(p: Parameters) {
  const voltage =
    (p.e1 / p.r1 - p.e2 / p.r2) / (1 / p.r1 + 1 / p.r2 + 1 / p.rs);
  return [(p.e1 - voltage) / p.r1, (voltage + p.e2) / p.r2, voltage / p.rs];
}
async function open(page: Page) {
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Kirchhoff’s Rules", exact: true })
    .click();
  await expect(page.locator(".branch-meter")).toHaveCount(3);
}
async function set(page: Page, key: keyof Parameters, value: number) {
  await page
    .getByRole("spinbutton", {
      name: `${labels[key]} exact value`,
      exact: true,
    })
    .fill(String(value));
}
async function checkCurrents(
  page: Page,
  expected: number[],
  signs = [1, 1, 1],
) {
  for (let index = 0; index < 3; index++) {
    const card = page.locator(".branch-meter").nth(index);
    await expect(card.locator("strong")).toHaveText(
      `${text(expected[index] * signs[index])}A`,
    );
    expect(Number(await card.getAttribute("data-current"))).toBeCloseTo(
      expected[index],
      10,
    );
    const indicator = page.locator(
      `.stage .branch-indicator[data-branch="${index + 1}"]`,
    );
    if (await indicator.count()) {
      await expect(indicator).toHaveAttribute(
        "data-direction",
        Math.abs(expected[index]) < 1e-9
          ? "zero"
          : expected[index] > 0
            ? "forward"
            : "reverse",
      );
      expect(
        Number(await indicator.getAttribute("data-reference-current")),
      ).toBeCloseTo(expected[index] * signs[index], 10);
    }
  }
  expect(
    Math.abs(
      Number(await page.getByTestId("kcl-residual").getAttribute("data-value")),
    ),
  ).toBeLessThan(1e-9);
  expect(
    Math.abs(
      Number(await page.getByTestId("kvl-residual").getAttribute("data-value")),
    ),
  ).toBeLessThan(1e-9);
  const power = page.locator(".power-balance");
  expect(Number(await power.getAttribute("data-source-power"))).toBeCloseTo(
    Number(await power.getAttribute("data-dissipated")),
    9,
  );
}
async function coefficients(page: Page, values: number[]) {
  for (const [index, label] of [
    "Loop I₁ coefficient",
    "Loop I₂ coefficient",
    "Loop I₃ coefficient",
    "Loop source term",
  ].entries())
    await page.getByLabel(label, { exact: true }).fill(String(values[index]));
}

test("default three-current diagram, cards, signed equations, source polarity and actual junction flow agree", async ({
  page,
}) => {
  await open(page);
  await checkCurrents(page, [54 / 37, -36 / 37, 90 / 37]);
  await expect(page.locator(".branch-meter > span")).toHaveText([
    "I₁ — Left Branch Current",
    "I₂ — Right Branch Current",
    "I₃ — Shared Branch Current",
  ]);
  await expect(page.locator(".branch-meter").nth(1)).toContainText(
    "Actual flow: right → upper junction",
  );
  await expect(page.locator(".stage .branch-indicator")).toHaveCount(3);
  await expect(
    page.locator('.stage .branch-indicator[data-branch="2"] .current-arrow'),
  ).toHaveAttribute("marker-start", /url/);
  await expect(
    page.locator('.stage .branch-indicator[data-branch="2"] .flow'),
  ).toHaveClass(/reverse/);
  // A vertical SVG path has zero geometric width; inspect its stroke/animation
  // rather than Playwright's rectangular visibility heuristic.
  await expect(
    page.locator('.stage .branch-indicator[data-branch="3"] .flow'),
  ).toHaveCount(1);
  await expect(page.locator(".signed-kcl")).toHaveText("I₁ − I₂ − I₃ = 0");
  await expect(page.locator(".signed-kvl")).toHaveText("4I₁ + 5I₃ = 18");
  await expect(page.locator(".kcl-substitution")).toHaveText(
    "(+1.459) − (−0.973) − (+2.432) ≈ 0 A.",
  );
  await expect(page.locator(".junction-totals")).toContainText(
    "I₁: 1.459 A + I₂: 0.973 A",
  );
  await expect(page.locator(".junction-totals")).toContainText(
    "1.459 + 0.973 ≈ 2.432 A",
  );
  const source = page
    .locator(".stage .tiny-label")
    .filter({ hasText: /^ε₂$/ })
    .locator("..");
  await expect(source).toContainText("18 V");
  await expect(source).not.toContainText("−18 V");
  await page
    .getByLabel("Loop to analyse", { exact: true })
    .selectOption("right");
  await expect(page.locator(".signed-kvl")).toHaveText("6I₂ − 5I₃ = -18");
  await page.getByLabel("Selected junction").selectOption("lower");
  await expect(page.locator(".junction-totals")).toContainText(
    "Incoming: I₃: 2.432 A",
  );
  await expect(page.locator(".junction-totals")).toContainText(
    "Outgoing: I₁: 1.459 A + I₂: 0.973 A",
  );
});

test("reference reversals, traversal and playback change representation while physical flow and power stay fixed", async ({
  page,
}) => {
  await open(page);
  const expected = nodal(base);
  for (const signs of [
    [-1, 1, 1],
    [-1, -1, 1],
    [-1, -1, -1],
  ]) {
    for (let index = 0; index < 3; index++)
      await page
        .getByLabel(`${names[index]} reference direction`, { exact: true })
        .selectOption(signs[index] > 0 ? "forward" : "reverse");
    await checkCurrents(page, expected, signs);
  }
  await expect(page.locator(".signed-kcl")).toHaveText("−I₁ + I₂ + I₃ = 0");
  await expect(page.locator(".signed-kvl")).toHaveText("−4I₁ − 5I₃ = 18");
  await page
    .getByRole("switch", { name: "Clockwise traversal", exact: true })
    .click();
  await expect(page.locator(".signed-kvl")).toHaveText("4I₁ + 5I₃ = -18");
  await checkCurrents(page, expected, [-1, -1, -1]);
  await page
    .getByLabel("Loop to analyse", { exact: true })
    .selectOption("right");
  await expect(page.locator(".signed-kvl")).toHaveText("6I₂ − 5I₃ = 18");
  await page
    .getByRole("button", {
      name: "Show assumed reference direction",
      exact: true,
    })
    .click();
  await expect(page.locator(".stage .flow")).toHaveCount(0);
  await expect(
    page.locator('.stage .branch-indicator[data-branch="1"]'),
  ).toHaveAttribute("data-direction", "reverse");
  await expect(page.locator(".visual-caption")).toContainText(
    "assumed reference",
  );
  await page
    .getByRole("button", { name: "Show actual current direction", exact: true })
    .click();
  const beforeSpeed = await page
    .locator(".stage .flow")
    .first()
    .evaluate((e) => getComputedStyle(e).animationDuration);
  await page
    .getByRole("spinbutton", {
      name: "Animation speed exact value",
      exact: true,
    })
    .fill("3");
  expect(
    await page
      .locator(".stage .flow")
      .first()
      .evaluate((e) => getComputedStyle(e).animationDuration),
  ).not.toBe(beforeSpeed);
  await checkCurrents(page, expected, [-1, -1, -1]);
});

test("negative, positive and zero currents remove or reverse every actual indicator correctly", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  for (const p of [
    { ...base, e1: 18, e2: 18 },
    { ...base, e1: -18, e2: 18 },
    { ...base, e1: 12, e2: 18 },
    { ...base, e1: 5, e2: -11 },
    { ...base, e1: 9, e2: -5 },
    { ...base, e1: 0, e2: 0 },
  ]) {
    await set(page, "e1", p.e1);
    await set(page, "e2", p.e2);
    const expected = nodal(p);
    await checkCurrents(page, expected);
    for (const [index, value] of expected.entries())
      if (Math.abs(value) < 1e-9) {
        const indicator = page.locator(
          `.stage .branch-indicator[data-branch="${index + 1}"]`,
        );
        await expect(indicator.locator(".flow")).toHaveCount(0);
        expect(
          await indicator
            .locator(".current-arrow")
            .getAttribute("marker-start"),
        ).toBeNull();
        expect(
          await indicator.locator(".current-arrow").getAttribute("marker-end"),
        ).toBeNull();
        await expect(page.locator(".branch-meter").nth(index)).toContainText(
          "no current",
        );
      }
  }
  await expect(page.locator(".kirchhoff-lab .flow")).toHaveCount(0);
});

test("parameter changes and batched rapid changes synchronize diagrams, cards, both laws and power", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  let p = { ...base };
  for (const [key, value] of [
    ["rs", 20],
    ["r1", 1],
    ["r2", 20],
    ["e1", 9],
    ["e2", 12],
  ] as const) {
    p = { ...p, [key]: value };
    await set(page, key, value);
    await checkCurrents(page, nodal(p));
    await expect(page.locator(".signed-kvl")).toHaveText(
      `${p.r1 === 1 ? "" : p.r1}I₁ + ${p.rs}I₃ = ${p.e1}`,
    );
  }
  p = { e1: -12, e2: 7, r1: 13, r2: 3, rs: 8 };
  await page.evaluate(
    ({ parameters, inputLabels }) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!;
      for (const [key, value] of Object.entries(parameters)) {
        const input = document.querySelector(
          `input[aria-label="${inputLabels[key as keyof typeof inputLabels]} exact value"]`,
        )!;
        setter.call(input, String(value));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    { parameters: p, inputLabels: labels },
  );
  await checkCurrents(page, nodal(p));
  await expect(page.locator(".signed-kvl")).toHaveText("13I₁ + 8I₃ = -12");
  await page.getByRole("tab").nth(0).click();
  await page
    .getByRole("tab", { name: "Kirchhoff’s Rules", exact: true })
    .click();
  await checkCurrents(page, nodal(p));
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await checkCurrents(page, nodal(base));
});

test("junction and loop exercises accept equivalent equations, provide hints and reveal solutions only on request", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await expect(page.locator(".calculation-steps")).toBeHidden();
  await page.getByText("Build a junction equation", { exact: true }).click();
  const equation = page.getByLabel("Construct the junction equation", {
    exact: false,
  });
  await equation.fill("i1=i2-i3");
  await page
    .getByRole("button", { name: "Check equation", exact: true })
    .click();
  await expect(page.locator(".junction-equation-feedback")).toHaveClass(
    /incorrect/,
  );
  await page.getByRole("button", { name: /^Junction hint/ }).click();
  await expect(
    page.locator(".conservation-exercise").first().locator(".hint p"),
  ).toHaveCount(1);
  for (const expression of ["i3=i1-i2", "2(i2+i3)=2i1", "0=I₁−I₂−I₃"]) {
    await equation.fill(expression);
    await page
      .getByRole("button", { name: "Check equation", exact: true })
      .click();
    await expect(page.locator(".junction-equation-feedback")).toHaveClass(
      /(?:^|\s)correct(?:\s|$)/,
    );
  }
  await equation.fill("window.alert(1)");
  await page
    .getByRole("button", { name: "Check equation", exact: true })
    .click();
  await expect(page.locator(".junction-equation-feedback")).toHaveClass(
    /incorrect/,
  );
  await page
    .getByRole("button", { name: "Reveal junction solution", exact: true })
    .click();
  await expect(
    page.locator(".conservation-exercise").first().locator(".solution"),
  ).toContainText("I₁ − I₂ − I₃ = 0");
  await page
    .getByText("Predict an unknown branch current", { exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reveal current solution" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Unknown branch current", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Unknown current prediction (A)", { exact: true })
    .fill("0.973");
  await page
    .getByRole("button", { name: "Check current prediction", exact: true })
    .click();
  await expect(page.locator(".current-prediction-feedback")).toHaveClass(
    /incorrect/,
  );
  await page
    .getByLabel("Unknown current prediction (A)", { exact: true })
    .fill("-0.973");
  await page
    .getByRole("button", { name: "Check current prediction", exact: true })
    .click();
  await expect(page.locator(".current-prediction-feedback")).toHaveClass(
    /(?:^|\s)correct(?:\s|$)/,
  );
  await page
    .getByRole("button", { name: "Reveal current solution", exact: true })
    .click();
  await expect(
    page.locator(".conservation-exercise").nth(1).locator(".solution"),
  ).toContainText("I₂ = −0.973 A");
  await page.getByText("Build a loop equation", { exact: true }).click();
  await coefficients(page, [4, 0, -5, 18]);
  await page
    .getByRole("button", { name: "Check loop equation", exact: true })
    .click();
  await expect(page.locator(".loop-equation-feedback")).toHaveClass(
    /incorrect/,
  );
  await coefficients(page, [8, 0, 10, 36]);
  await page
    .getByRole("button", { name: "Check loop equation", exact: true })
    .click();
  await expect(page.locator(".loop-equation-feedback")).toHaveClass(
    /(?:^|\s)correct(?:\s|$)/,
  );
  await page
    .getByLabel("Loop to analyse", { exact: true })
    .selectOption("right");
  await expect(page.locator(".loop-equation-feedback")).toHaveCount(0);
  await page
    .getByRole("switch", { name: "Clockwise traversal", exact: true })
    .click();
  await coefficients(page, [0, -6, 5, 18]);
  await page
    .getByRole("button", { name: "Check loop equation", exact: true })
    .click();
  await expect(page.locator(".loop-equation-feedback")).toHaveClass(
    /(?:^|\s)correct(?:\s|$)/,
  );
  await page
    .getByRole("button", { name: "Reveal loop solution", exact: true })
    .click();
  await expect(
    page.locator(".conservation-exercise").nth(2).locator(".solution"),
  ).toContainText("−6I₂ + 5I₃ = 18");
  await page
    .getByText("How I₁, I₂ and I₃ Are Calculated", { exact: true })
    .click();
  await expect(page.locator(".calculation-steps > ol > li")).toHaveCount(7);
  await page
    .getByLabel("Selected junction", { exact: true })
    .selectOption("lower");
  await expect(page.locator(".current-prediction-feedback")).toHaveCount(0);
});

test("single-loop, junction view, experiment and challenge modes use the displayed branch solution", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByRole("button", { name: "Challenge", exact: true }).click();
  await page.getByPlaceholder("Enter your prediction").fill(String(90 / 37));
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".feedback.correct")).toBeVisible();
  await page
    .getByLabel("Circuit structure", { exact: true })
    .selectOption("single");
  await checkCurrents(page, [2, 0, 2]);
  await expect(page.getByPlaceholder("Enter your prediction")).toHaveValue("");
  await expect(page.getByLabel("Loop to analyse", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByLabel("I₃ reference direction", { exact: true })
    .selectOption("reverse");
  await page.getByPlaceholder("Enter your prediction").fill("-2");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".feedback.correct")).toBeVisible();
  await page.getByRole("button", { name: "Experiment", exact: true }).click();
  await expect(page.locator(".procedure")).toContainText("I₃");
  await page
    .getByLabel("Circuit structure", { exact: true })
    .selectOption("junction");
  await expect(page.locator(".stage")).toHaveCount(0);
  await expect(page.locator(".junction-diagram")).toHaveCount(2);
  await checkCurrents(page, nodal(base), [1, 1, -1]);
  await page
    .getByLabel("Selected junction", { exact: true })
    .selectOption("lower");
  await expect(page.locator(".junction-diagram").first()).toHaveAttribute(
    "aria-label",
    /B, lower/,
  );
});

test("phone and desktop layouts show all three currents in both themes and reversed-flow screenshots", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
      await page
        .getByRole("button", { name: "Switch to light theme", exact: true })
        .click();
    for (const width of [320, 390, 430, 768, 1280]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${theme} ${width}: page overflow`,
      ).toBe(true);
      expect(
        await page
          .locator(".equation > div")
          .evaluateAll(
            (elements) =>
              elements.filter((e) => e.scrollWidth > e.clientWidth + 2).length,
          ),
        `${theme} ${width}: equation overflow`,
      ).toBe(0);
      await expect(page.locator(".katex-error")).toHaveCount(0);
      for (const card of await page.locator(".branch-meter").all())
        expect(
          await card.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
        ).toBe(true);
      if (width === 390 || width === 1280) {
        for (const reversed of [false, true]) {
          await set(page, "e1", reversed ? -18 : 18);
          await set(page, "e2", reversed ? 18 : -18);
          await page.locator(".bench").scrollIntoViewIfNeeded();
          await page.locator(".bench").screenshot({
            path: `.tools/kirchhoff/${info.project.name}-${theme}-${width}-${reversed ? "reversed" : "default"}-circuit.png`,
            // Omit the offscreen skip link from beyond-viewport element captures.
            style: ".skip:not(:focus-visible) { visibility: hidden; }",
          });
          await page.locator(".kirchhoff-workbench").screenshot({
            path: `.tools/kirchhoff/${info.project.name}-${theme}-${width}-${reversed ? "reversed" : "default"}-workbench.png`,
            style: ".skip:not(:focus-visible) { visibility: hidden; }",
          });
        }
        await set(page, "e1", 18);
        await set(page, "e2", -18);
      }
    }
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
