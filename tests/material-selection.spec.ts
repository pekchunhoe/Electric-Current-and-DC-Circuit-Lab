import { test, expect, type Page } from "@playwright/test";

// Independent fixtures: do not import the production preset table or formatter.
const materials = {
  copper: {
    label: "Copper · 1.7 × 10⁻⁸ Ω m",
    rho: "1.7 × 10⁻⁸",
    r: "0.00283",
    i: "8,470",
    wire: "1.70e-8",
  },
  aluminium: {
    label: "Aluminium · 2.82 × 10⁻⁸ Ω m",
    rho: "2.82 × 10⁻⁸",
    r: "0.0047",
    i: "5,110",
    wire: "2.82e-8",
  },
  nichrome: {
    label: "Nichrome · 1.1 × 10⁻⁶ Ω m",
    rho: "1.1 × 10⁻⁶",
    r: "0.183",
    i: "131",
    wire: "1.10e-6",
  },
} as const;
type Material = keyof typeof materials;
const materialSelect = (p: Page) => p.getByLabel("Material", { exact: true });
const meter = (p: Page, n: number) => p.locator(".meters .meter strong").nth(n);
async function set(p: Page, label: string, value: number) {
  await p
    .getByRole("spinbutton", { name: `${label} exact value`, exact: true })
    .fill(String(value));
}
async function openWire(p: Page) {
  await p.goto("/");
  await p.getByRole("tab").nth(1).click();
  await p.getByLabel("Test component", { exact: true }).selectOption("wire");
  await set(p, "Supply voltage", 24);
  await set(p, "Conductor length", 0.5);
  await set(p, "Cross-sectional area", 3);
}
async function expectSelection(p: Page, id: Material) {
  const fixture = materials[id];
  const select = materialSelect(p);
  // selectedOptions drives both the native closed label and menu indicator.
  await expect(select.locator("option:checked")).toHaveText(fixture.label);
  await expect(select).toHaveValue(id);
  await expect(select.locator("option:checked")).toHaveCount(1);
  await expect(
    p.getByText(`Resistivity ρ = ${fixture.rho} Ω m.`, { exact: true }),
  ).toBeVisible();
  await expect(meter(p, 0)).toHaveText(`${fixture.i}A`);
  await expect(meter(p, 1)).toHaveText("24V");
  await expect(meter(p, 2)).toHaveText(`${fixture.r}Ω`);
  await expect(p.locator(".equation")).toContainText(
    `I = 24 / ${fixture.r} = ${fixture.i} A.`,
  );
  await expect(
    p.getByText(
      `A = 3.00e-6 m². R_wire = ${fixture.wire} × 0.5 / 3.00e-6 = ${fixture.r} Ω.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(p.locator(".stage")).toHaveAttribute(
    "aria-label",
    `DC circuit. Source 24 volts. Load ${fixture.r} ohms, current ${fixture.i} amperes. Switch closed.`,
  );
  await expect(
    p.locator(".stage .instrument").first().locator(".."),
  ).toContainText(`${fixture.i} A`);
  await expect(
    p.getByRole("img", { name: /Voltage V.*against Current/ }),
  ).toHaveAttribute(
    "aria-label",
    new RegExp(`theoretical gradient = ${fixture.r.replace(".", "\\.")} Ω`),
  );
  await expect(p.locator(".wire-sample")).toContainText(
    fixture.label.split(" · ")[0],
  );
}

test("material label, selected option and physics remain synchronized through repeated changes", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await openWire(page);
  await page.getByRole("button", { name: "Experiment", exact: true }).click();
  for (const id of [
    "copper",
    "nichrome",
    "aluminium",
    "copper",
    "nichrome",
    "aluminium",
    "copper",
  ] as const) {
    await materialSelect(page).selectOption({ label: materials[id].label });
    await expectSelection(page, id);
    await expect(page.getByText("0 readings", { exact: true })).toBeVisible();
    await expect(page.locator(".data-point")).toHaveCount(0);
    await page.getByRole("button", { name: "Record reading" }).click();
    await expect(page.locator("tbody tr td")).toHaveText([
      "1",
      materials[id].i,
      "24",
      materials[id].r,
    ]);
    await expect(page.locator(".data-point title")).toHaveText(
      `Current I (A): ${materials[id].i}; Voltage V (V): 24 `,
    );
    if (id === "nichrome") {
      // The desktop bench is sticky; return above it before an element capture.
      await page
        .getByRole("heading", {
          name: "Ohm’s Law and Resistivity",
          exact: true,
        })
        .click();
      await page.locator(".lab-grid").screenshot({
        path: `.tools/material-selection/${info.project.name}-after.png`,
      });
    }
  }
  // Native popup opening/cancellation must not change selection or calculations.
  await materialSelect(page).click();
  await page.keyboard.press("Escape");
  await expectSelection(page, "copper");
  expect(errors).toEqual([]);
});

test("rapid material changes, tab restoration, reset and reload use the same authoritative selection", async ({
  page,
}) => {
  await openWire(page);
  // One JS task deliberately batches React updates, exercising functional state merges.
  await materialSelect(page).evaluate((select: HTMLSelectElement) => {
    for (const value of ["nichrome", "aluminium", "copper", "nichrome"]) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await expectSelection(page, "nichrome");
  await page.getByRole("tab").nth(2).click();
  await page.getByRole("tab").nth(1).click();
  await expectSelection(page, "nichrome");
  await page
    .getByLabel("Test component", { exact: true })
    .selectOption("resistor");
  await page.getByLabel("Test component", { exact: true }).selectOption("wire");
  await expectSelection(page, "nichrome");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByLabel("Test component", { exact: true })).toHaveValue(
    "resistor",
  );
  await expect(meter(page, 0)).toHaveText("2A");
  await expect(meter(page, 2)).toHaveText("6Ω");
  await page.getByLabel("Test component", { exact: true }).selectOption("wire");
  await expect(materialSelect(page)).toHaveValue("copper");
  await expect(meter(page, 2)).toHaveText("0.034Ω");
  await materialSelect(page).selectOption("nichrome");
  await page.reload();
  // Simulation cache is memory-only by design: a reload restores defaults.
  await page.getByRole("tab").nth(1).click();
  await expect(page.getByLabel("Test component", { exact: true })).toHaveValue(
    "resistor",
  );
  await page.getByLabel("Test component", { exact: true }).selectOption("wire");
  await expect(materialSelect(page)).toHaveValue("copper");
  await expect(meter(page, 2)).toHaveText("0.034Ω");
});

test("temperature presets and custom coefficient have unique values and stay synchronized", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.getByRole("tab").nth(2).click();
  const select = page.getByLabel("Metal coefficient preset");
  for (const [value, label, resistance, current] of [
    ["0.004", "Reference metal", "12", "1"],
    ["0.0004", "Nichrome", "10.2", "1.18"],
    ["0.00393", "Copper", "12", "1"],
    ["0.00429", "Aluminium", "12.1", "0.988"],
  ]) {
    await select.selectOption(value);
    await expect(select.locator("option:checked")).toContainText(label);
    await expect(select.locator("option:checked")).toHaveCount(1);
    const values = await select
      .locator("option")
      .evaluateAll((es) => es.map((e) => (e as HTMLOptionElement).value));
    expect(new Set(values).size).toBe(values.length);
    await expect(meter(page, 1)).toHaveText(`${resistance}Ω`);
    await expect(meter(page, 2)).toHaveText(`${current}A`);
  }
  await set(page, "Temperature coefficient α", 0.002);
  await expect(select).toHaveValue("0.002");
  await expect(select.locator("option:checked")).toHaveText(
    "Current coefficient",
  );
  await expect(meter(page, 1)).toHaveText("11Ω");
  await select.selectOption("0.004");
  await expect(
    select.getByRole("option", { name: "Current coefficient" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(select.locator("option:checked")).toContainText(
    "Reference metal",
  );
  expect(errors).toEqual([]);
});

test("selection audit across all nine tabs keeps option values unique and valid after topology changes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  for (let tab = 0; tab < 9; tab++) {
    await page.getByRole("tab").nth(tab).click();
    await expect(page.locator(".lab-grid")).toBeVisible();
    for (const select of await page.locator("select").all()) {
      const snapshot = await select.evaluate((e: HTMLSelectElement) => ({
        values: [...e.options].map((o) => o.value),
        selected: [...e.selectedOptions].map((o) => o.value),
        value: e.value,
      }));
      expect(new Set(snapshot.values).size).toBe(snapshot.values.length);
      expect(snapshot.selected).toEqual([snapshot.value]);
      expect(snapshot.values).toContain(snapshot.value);
    }
  }
  await page.getByRole("tab").nth(4).click();
  await page.getByLabel("Circuit configuration").selectOption("series3");
  await page.getByLabel("Inspect component").selectOption("2");
  await page.getByLabel("Circuit configuration").selectOption("series2");
  await expect(page.getByLabel("Inspect component")).toHaveValue("0");
  await expect(meter(page, 1)).toHaveText("4.8V");
  await page.getByRole("tab").nth(7).click();
  await page.getByRole("switch", { name: "Include third resistor" }).click();
  await page.getByLabel("Positive output terminal").selectOption("3");
  await page.getByLabel("Negative output terminal").selectOption("0");
  await page.getByRole("switch", { name: "Include third resistor" }).click();
  await expect(page.getByLabel("Positive output terminal")).toHaveValue("2");
  await expect(page.getByLabel("Negative output terminal")).toHaveValue("0");
  await expect(meter(page, 0)).toHaveText("-12V");
  expect(errors).toEqual([]);
});
