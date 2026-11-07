import { expect, type Page } from "@playwright/test";
import { clickAt, example, onEachPlayground, openPopup, test } from "./playgrounds.ts";

// What docs/components/filter-chip.md says a script does, on the Filter Chip
// page.
onEachPlayground("filter-chip", () => {
  test("a multi-select chip shows two values, then a count, and stays open", async ({ page }) => {
    const { container, chip } = await openChip(page, "filter-chip-nothing-chosen");
    const values = chip.locator(".hfilter-chip-value");
    const clear = container.getByRole("button", { name: "Clear filters" });
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(clear).toHaveCount(0);

    await clickAt(page, container.getByRole("option", { name: "Delivered" }));
    await expect(values).toHaveText(["Delivered"]);
    await expect(clear).toBeVisible();
    await clickAt(page, container.getByRole("option", { name: "Read" }));
    await expect(values).toHaveText(["Delivered", "Read"]);
    await clickAt(page, container.getByRole("option", { name: "Failed" }));
    await expect(values).toHaveText(["3 selected"]);
    await expect(openPopup(container)).toHaveCount(1);
  });

  test("the values are part of the chip's name", async ({ page }) => {
    const container = await example(page, "filter-chip-two-values");
    await expect(container.locator(".hfilter-chip")).toHaveAccessibleName("Priority High Urgent");
  });

  test("Clear filters clears the values, goes away, and keeps focus in the popup", async ({ page }) => {
    const { container, chip } = await openChip(page, "filter-chip-two-values");
    await clickAt(page, container.getByRole("button", { name: "Clear filters" }));

    await expect(chip.locator(".hfilter-chip-value")).toHaveCount(0);
    await expect(container.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
    await expect(container.getByRole("option", { selected: true })).toHaveCount(0);
    await expect(openPopup(container)).toHaveCount(1);
    await expect(container.getByRole("listbox")).toBeFocused();
  });

  test("a single-select chip closes on a choice and takes focus back", async ({ page }) => {
    const { container, chip } = await openChip(page, "filter-chip-one-value");
    await clickAt(page, container.getByRole("option", { name: "Telegram" }));

    await expect(chip.locator(".hfilter-chip-value")).toHaveText(["Telegram"]);
    await expect(openPopup(container)).toHaveCount(0);
    await expect(chip).toBeFocused();
    await expect(chip).toHaveAttribute("aria-expanded", "false");
  });

  test("a text filter applies on Enter, closes, and doesn't open again", async ({ page }) => {
    const container = await example(page, "filter-chip-text-filter");
    const chip = container.locator(".hfilter-chip");
    await chip.click();
    await container.getByLabel("Name contains").fill("Jane");
    await page.keyboard.press("Enter");

    // The chip takes focus back as the popup closes, and the Enter mustn't go
    // on to press it and open the popup again.
    await expect(chip.locator(".hfilter-chip-value")).toHaveText(["Jane"]);
    await expect(chip).toBeFocused();
    await expect(openPopup(container)).toHaveCount(0);
  });

  test("a text filter applies on Apply, and an empty one shows nothing", async ({ page }) => {
    const container = await example(page, "filter-chip-text-filter");
    const chip = container.locator(".hfilter-chip");
    const input = container.getByLabel("Name contains");
    const apply = container.getByRole("button", { name: "Apply" });

    await chip.click();
    await input.fill("Ana");
    await clickAt(page, apply);
    await expect(chip.locator(".hfilter-chip-value")).toHaveText(["Ana"]);
    await expect(openPopup(container)).toHaveCount(0);

    await chip.click();
    await input.fill("");
    await clickAt(page, apply);
    await expect(chip.locator(".hfilter-chip-value")).toHaveCount(0);
  });
});

// Opens an example's chip with a click, and waits until its list has focus
// and a highlight, as a person sees it.
const openChip = async (page: Page, id: string) => {
  const container = await example(page, id);
  const chip = container.locator(".hfilter-chip");
  await chip.click();
  const listbox = container.getByRole("listbox");
  await expect(listbox).toBeFocused();
  await expect(listbox.locator(".hoption[data-active]")).toHaveCount(1);
  return { container, chip };
};
