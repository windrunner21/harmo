import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/radio.md says, on the Radio page: radios that share a
// name are one group, which the arrow keys move through; disabled and
// required are on the radios themselves; a larger radio stays centered on
// its label's first line.
const valueMissing = (radio: Locator) => radio.evaluate((node) => (node as HTMLInputElement).validity.valueMissing);

onEachPlayground("radio", () => {
  test("clicking a label chooses its radio, and the arrow keys move the choice", async ({ page }) => {
    const container = await example(page, "radio-group");
    const csv = container.getByRole("radio", { name: "CSV" });
    const excel = container.getByRole("radio", { name: "Excel workbook" });
    const pdf = container.getByRole("radio", { name: "PDF report" });
    await expect(csv).toBeChecked();

    await container.getByText("PDF report").click();
    await expect(pdf).toBeChecked();
    await expect(csv).not.toBeChecked();

    await csv.focus();
    await page.keyboard.press("ArrowDown");
    await expect(excel).toBeChecked();
    await expect(excel).toBeFocused();
    await expect(pdf).not.toBeChecked();
  });

  test("a disabled radio is disabled alone, and a disabled group disables every radio in it", async ({ page }) => {
    const container = await example(page, "radio-disabled");
    const category = container.getByRole("radiogroup", { name: "Template category" });
    await expect(category.getByRole("radio", { name: "Authentication" })).toBeDisabled();
    await expect(category.getByRole("radio", { name: "Utility" })).toBeEnabled();
    const group = container.getByRole("radiogroup", { name: "Data region, set by your administrator" });
    await expect(group.getByRole("radio")).toHaveCount(2);
    for (const radio of await group.getByRole("radio").all()) await expect(radio).toBeDisabled();
    await expect(group.getByRole("radio", { name: "European Union" })).toBeChecked();
  });

  test("a required group asks for an answer until one is chosen", async ({ page }) => {
    const container = await example(page, "radio-required");
    const radios = await container.getByRole("radio").all();
    expect(radios).toHaveLength(3);
    for (const radio of radios) {
      await expect(radio).toHaveAttribute("required", "");
      expect(await valueMissing(radio)).toBe(true);
    }

    await container.getByText("Something else").click();
    for (const radio of radios) expect(await valueMissing(radio)).toBe(false);
  });

  test("a larger radio is centered on its label's first line", async ({ page }) => {
    const container = await example(page, "radio-group");
    const csv = container.getByRole("radio", { name: "CSV" });
    await csv.evaluate((node) => (node as HTMLElement).style.setProperty("--harmo-checkbox-size", "24px"));
    const [radio, label] = await boxes(csv, container.getByText("CSV", { exact: true }));
    expect(radio.height).toBeCloseTo(24, 0);
    // The label's line is 20px tall.
    expect(radio.y + radio.height / 2).toBeCloseTo(label.y + 10, 0);
  });
});
