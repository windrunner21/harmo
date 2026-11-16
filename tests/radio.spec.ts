import { expect, type Locator } from "@playwright/test";
import { boxes, clickAt, colorOf, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/radio.md says, on the Radio page: radios that share a
// name are one group, which the arrow keys move through; disabled and
// required are on the radios themselves; a larger radio stays centered on
// its label's first line. As choice cards, per docs/components/field.md, each
// option is a bordered tile, chosen by a click anywhere on it, with the
// radio's colors once chosen. Tests of how they look, and of what the markup
// alone says, run on the HTML playground.
const valueMissing = (radio: Locator) => radio.evaluate((node) => (node as HTMLInputElement).validity.valueMissing);

onEachPlayground("radio", () => {
  test("as cards: a bordered tile, the radio first, with a medium label and its description", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "radio-cards");
    const cards = container.locator('.hfield[data-variant="card"]');
    await expect(cards).toHaveCount(3);
    const starter = cards.first();
    const radio = starter.getByRole("radio", { name: "Starter" });
    await expect(starter).toHaveCSS("border-top-width", "1px");
    await expect(starter).toHaveCSS("border-top-color", await colorOf(page, "var(--harmo-color-border)"));
    await expect(starter).toHaveCSS("border-top-left-radius", "8px");
    await expect(starter).toHaveCSS("padding-top", "16px");
    await expect(starter).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(starter.locator(".hlabel")).toHaveCSS("font-weight", "500");
    await expect(radio).toHaveAccessibleDescription("For one person, with up to 3 projects.");
    const [card, control, label] = await boxes(starter, radio, starter.locator(".hlabel"));
    expect(control!.x - card!.x).toBeCloseTo(17, 0);
    expect(label!.x).toBeGreaterThan(control!.x + control!.width);
  });

  test("as cards, the chosen one has the primary border on the tint, and its description reads on it", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "radio-cards");
    const team = container.locator('.hfield[data-variant="card"]').nth(1);
    await expect(team.getByRole("radio", { name: "Team" })).toBeChecked();
    await settled(team);
    await expect(team).toHaveCSS("border-top-color", await colorOf(page, "var(--harmo-color-primary)"));
    await expect(team).toHaveCSS("background-color", await colorOf(page, "var(--harmo-color-primary-tint)"));
    await expect(team.locator(".hdescription")).toHaveCSS("color", await colorOf(page, "var(--harmo-color-text-secondary)"));
  });

  test("as cards, hovered, the border turns the control's border color, and the label keeps its color", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "radio-cards");
    const starter = container.locator('.hfield[data-variant="card"]').first();
    await starter.hover();
    await expect(starter).toHaveCSS("border-top-color", await colorOf(page, "var(--harmo-color-border-control)"));
    await expect(starter.locator(".hlabel")).toHaveCSS("color", await colorOf(page, "var(--harmo-color-text)"));
  });

  test("as cards, a click on a card's padding or its description chooses it", async ({ page }) => {
    const container = await example(page, "radio-cards");
    const cards = container.locator('.hfield[data-variant="card"]');
    const starter = cards.first();
    const business = cards.nth(2);
    const [card] = await boxes(starter);
    await starter.click({ position: { x: card!.width - 6, y: card!.height / 2 } });
    await expect(starter.getByRole("radio")).toBeChecked();
    await clickAt(page, business.locator(".hdescription"));
    await expect(business.getByRole("radio")).toBeChecked();
    await expect(starter.getByRole("radio")).not.toBeChecked();
  });

  test("as cards, a button in a description sits above the stretched label, so a click lands on it rather than choosing the card", async ({ page }) => {
    const container = await example(page, "radio-cards");
    const business = container.locator('.hfield[data-variant="card"]').nth(2);
    await business.locator(".hdescription").evaluate((description) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Compare plans";
      button.addEventListener("click", () => button.setAttribute("data-clicked", ""));
      description.append(" ", button);
    });
    const button = business.getByRole("button", { name: "Compare plans" });
    await clickAt(page, button);
    await expect(button).toHaveAttribute("data-clicked");
    await expect(business.getByRole("radio")).not.toBeChecked();
  });

  test("chosen with the pointer, it fades in 150ms; with the arrow keys, the one they reach changes at once", async ({ page, browserName }) => {
    const container = await example(page, "radio-group");
    const radio = container.getByRole("radio").first();
    const durations = () => radio.evaluate((node) => [...new Set(getComputedStyle(node).transitionDuration.split(", "))]);
    await radio.click();
    expect(await durations()).toEqual(["0.15s"]);
    // Out of the group and back with the keyboard, as someone using one
    // reaches it: after a click, WebKit doesn't count the arrow keys as
    // keyboard focus, so the change would fade there.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(radio).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await expect(radio).toBeChecked();
    await expect(radio).toBeFocused();
    // WebKit doesn't count the arrow keys' move as keyboard focus, so there
    // the radio they reach has no focus ring and fades, as radio.md says.
    if (browserName === "webkit") return;
    expect(await radio.evaluate((node) => node.matches(":focus-visible"))).toBe(true);
    expect(await durations()).toEqual(["0s"]);
  });

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

  test("a disabled radio is disabled alone, and a disabled group disables every radio in it", { tag: "@css" }, async ({ page }) => {
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

  test("a larger radio is centered on its label's first line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "radio-group");
    const csv = container.getByRole("radio", { name: "CSV" });
    await csv.evaluate((node) => (node as HTMLElement).style.setProperty("--harmo-checkbox-size", "24px"));
    const [radio, label] = await boxes(csv, container.getByText("CSV", { exact: true }));
    expect(radio.height).toBeCloseTo(24, 0);
    // The label's line is 20px tall.
    expect(radio.y + radio.height / 2).toBeCloseTo(label.y + 10, 0);
  });
});
