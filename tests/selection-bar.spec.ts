import { expect, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/selection-bar.md says: a count that's read out, a way to
// deselect, and the actions after; taking the place of a toolbar's controls; an
// action that's blocked, with a reason the keyboard can reach; and right to left.
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

onEachPlayground("selection-bar", () => {
  test("a count that's a status, a divider, an underlined Deselect, and the actions", async ({ page }) => {
    const container = await example(page, "selection-bar-default");
    const count = container.getByRole("status");
    const deselect = container.getByRole("button", { name: "Deselect" });
    const secondary = await color(page, "--harmo-color-text-secondary");
    await expect(count).toHaveText("3 selected");
    await expect(count).toHaveCSS("font-size", "14px");
    await expect(count).toHaveCSS("color", secondary);
    await expect(count).toHaveCSS("border-right-width", "1px");
    await expect(count).toHaveCSS("border-right-color", await color(page, "--harmo-color-border"));
    expect((await count.boundingBox())!.height).toBeCloseTo(28, 0);

    await expect(deselect).toHaveCSS("text-decoration-line", "underline");
    await expect(deselect).toHaveCSS("color", secondary);
    expect((await deselect.boundingBox())!.height).toBeGreaterThanOrEqual(24);

    await expect(container.locator(".hselection-bar > *")).toHaveText(["3 selected", "Deselect", "Assign", "Delete"]);
    await expect(container.getByRole("button", { name: "Delete" })).toHaveAttribute("data-size", "small");

    const [first, second] = await boxes(count, deselect);
    expect(second!.x - (first!.x + first!.width)).toBeCloseTo(8, 0);
  });

  test("hovered, Deselect darkens; focused, it shows the ring", async ({ page }) => {
    const container = await example(page, "selection-bar-default");
    const deselect = container.getByRole("button", { name: "Deselect" });
    await deselect.hover();
    await expect(deselect).toHaveCSS("color", await color(page, "--harmo-color-text"));
    await deselect.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(deselect).toBeFocused();
    await expect(deselect).toHaveCSS("outline-style", "solid");
  });

  test("it takes the place of a toolbar's controls, and the filters stay", async ({ page }) => {
    const container = await example(page, "selection-bar-in-a-toolbar");
    const controls = container.locator(".htoolbar-controls");
    const first = container.getByRole("checkbox", { name: "Write the brief" });
    const second = container.getByRole("checkbox", { name: "Review the designs" });
    await expect(controls.getByRole("button", { name: "Export" })).toBeVisible();
    await expect(container.getByRole("status")).toHaveCount(0);

    await first.check();
    await expect(container.getByRole("status")).toHaveText("1 selected");
    await expect(controls.getByRole("button", { name: "Export" })).toHaveCount(0);
    await expect(container.locator(".hfilters")).toBeVisible();
    // The same element, so that its new text is read out.
    await container.getByRole("status").evaluate((node) => node.setAttribute("data-test-same", ""));
    await second.check();
    await expect(container.getByRole("status")).toHaveText("2 selected");
    await expect(container.getByRole("status")).toHaveAttribute("data-test-same", "");

    await controls.getByRole("button", { name: "Deselect" }).focus();
    await page.keyboard.press("Enter");
    await expect(container.getByRole("status")).toHaveCount(0);
    await expect(controls.getByRole("button", { name: "Export" })).toBeVisible();
    await expect(first).not.toBeChecked();
    await expect(second).not.toBeChecked();
    await expect(first).toBeFocused();
  });

  test("a blocked action stays reachable, and its reason shows on keyboard focus", async ({ page }) => {
    const container = await example(page, "selection-bar-an-action-that-s-blocked");
    const remove = container.getByRole("button", { name: "Delete" });
    await expect(remove).toHaveAttribute("aria-disabled", "true");
    await expect(remove).toHaveAccessibleDescription("Only a project's owner can delete its tasks.");
    await container.getByRole("button", { name: "Assign" }).focus();
    await page.keyboard.press("Tab");
    await expect(remove).toBeFocused();
    await expect(container.getByRole("tooltip")).toBeVisible();
  });

  test("right to left, the count starts on the right, with its divider on its left", async ({ page }) => {
    const container = await example(page, "selection-bar-right-to-left");
    const count = container.getByRole("status");
    const [first, second] = await boxes(count, container.locator(".hselection-bar-deselect"));
    expect(first!.x).toBeGreaterThan(second!.x);
    await expect(count).toHaveCSS("border-left-width", "1px");
  });

  test("a long count wraps inside a narrow container", async ({ page }) => {
    const container = await example(page, "selection-bar-default");
    const bar = container.locator(".hselection-bar");
    await bar.evaluate((node: HTMLElement) => (node.style.inlineSize = "160px"));
    const count = container.getByRole("status");
    await count.evaluate((node) => (node.textContent = "3 Projektverantwortlichkeitszuordnungen ausgewählt"));
    const [box, text] = await boxes(bar, count);
    expect(text!.x + text!.width).toBeLessThanOrEqual(box!.x + box!.width + 0.5);
    expect(await bar.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("on a narrow screen it wraps, and long words stay inside", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const container = await example(page, "selection-bar-default");
    await container.locator(".hselection-bar-deselect").evaluate((node) => {
      node.textContent = "Clear every one of the tasks chosen on this list so far";
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
