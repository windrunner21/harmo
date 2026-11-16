import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/segmented.md says, on the Segmented Control page: each
// option is a native radio, so a click chooses it and the arrow keys move the
// choice, past a disabled option; a label wider than the group wraps, and only
// then; a description describes the group; and hover weighs no more than the
// checked state. How labels wrap, the description, and hover only the markup
// and CSS decide, so those tests run on the HTML playground.
onEachPlayground("segmented", () => {
  test("the group is named by its label, and clicking an option chooses it", async ({ page }) => {
    const container = await example(page, "segmented-options");
    const group = container.getByRole("radiogroup", { name: "Message header" });
    await expect(group.getByRole("radio", { name: "No header" })).toBeChecked();

    await group.getByText("Media").click();
    await expect(group.getByRole("radio", { name: "Media" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "No header" })).not.toBeChecked();
  });

  test("the arrow keys move the choice, skipping a disabled option", async ({ page, browserName }) => {
    const container = await example(page, "segmented-disabled-option");
    const team = container.getByRole("radio", { name: "Team" });
    const agent = container.getByRole("radio", { name: "Agent", exact: true });
    const ai = container.getByRole("radio", { name: "AI agent" });
    await expect(team).toBeChecked();
    await expect(ai).toBeDisabled();

    await team.focus();
    await page.keyboard.press("ArrowRight");
    await expect(agent).toBeChecked();
    // Past the last option it can reach, the browser's own radios decide:
    // Chromium and Firefox go round to the first, and WebKit stays.
    await page.keyboard.press("ArrowRight");
    await expect(browserName === "webkit" ? agent : team).toBeChecked();
    await expect(ai).not.toBeChecked();
  });

  test("a label wider than the whole group wraps in a row of its own, and labels that fit stay on one line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "segmented-long-label");
    const group = container.locator(".hsegmented");
    const options = container.locator(".hsegmented-option");
    const [area, now, later, long] = await boxes(group, options.nth(0), options.nth(1), options.nth(2));
    expect(long.x + long.width).toBeLessThanOrEqual(area.x + area.width + 0.5);
    expect(await group.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(long.height).toBeGreaterThan(40);
    expect(long.y).toBeGreaterThan(now.y);
    expect(now.height).toBeCloseTo(34, 0);
    expect(later.height).toBeCloseTo(34, 0);
    expect(later.y).toBeCloseTo(now.y, 0);
  });

  test("labels that fit keep one line in a narrow container, moving to a new row instead", { tag: "@css" }, async ({ page }) => {
    const options = (await example(page, "segmented-narrow-container")).locator(".hsegmented-option");
    for (const box of await boxes(...(await options.all()))) expect(box.height).toBeCloseTo(34, 0);
  });

  test("a description describes the group", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "segmented-with-a-description");
    const group = container.getByRole("radiogroup", { name: "Reply tone" });
    await expect(group).toHaveAccessibleDescription("Used for suggested replies.");
  });

  test("an app's own look for the checked option, loaded after Harmo, holds on hover", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "segmented-options");
    await page.addStyleTag({ content: ".hsegmented-option:has(:checked) { border-color: rgb(255, 0, 0); }" });
    const checked = container.locator(".hsegmented-option").filter({ has: page.getByRole("radio", { checked: true }) });
    await checked.hover();
    expect(await checked.evaluate((node) => getComputedStyle(node).borderTopColor)).toBe("rgb(255, 0, 0)");
  });
});
