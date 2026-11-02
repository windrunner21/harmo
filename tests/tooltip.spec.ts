import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, pointAt, settled, test } from "./playgrounds.ts";

// What docs/components/tooltip.md says, on the Tooltip page: CSS shows a
// tooltip on hover after a delay and at once on keyboard focus, and a script
// hides it on Escape and skips the delay right after another closes.
onEachPlayground("tooltip", () => {
  test("it names or describes its control", async ({ page }) => {
    const describing = await example(page, "tooltip-describing-a-control");
    await expect(describing.getByRole("button", { name: "Export" })).toHaveAccessibleDescription(
      "Download the current view as a CSV file",
    );
    const naming = await example(page, "tooltip-naming-an-icon-button");
    await expect(naming.getByRole("button", { name: "Close", exact: true })).toHaveAccessibleDescription("");
  });

  test("keyboard focus shows it at once", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    await tabTo(page, container.getByRole("button", { name: "Archive" }));
    expect(await delayOf(tooltip)).toBe("0s");
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("hovering shows it after the delay", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    expect(await delayOf(tooltip)).toBe("0.3s");
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("right after one closes, the next shows without the delay, until a pause", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(tooltipOf(container, "Export"))).toBe(true);

    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    const next = tooltipOf(container, "Archive");
    await expect(next).toHaveCSS("--htooltip-delay", "0ms");
    expect(await delayOf(next)).toBe("0s");
    await expect.poll(() => shown(next)).toBe(true);

    // Longer than the 400ms that counts as right after, so it can't end early.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    expect(await delayOf(tooltipOf(container, "Export"))).toBe("0.3s");
  });

  test("the pointer can move onto the tooltip", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    await settled(tooltip);

    // In small steps, across the gap between them.
    const [box] = await boxes(tooltip);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    expect(await shown(tooltip)).toBe(true);
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
  });

  test("Escape hides it until the pointer leaves", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const button = container.getByRole("button", { name: "Export" });
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, button);
    await expect.poll(() => shown(tooltip)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveAttribute("data-dismissed", "");
    await expect.poll(() => shown(tooltip)).toBe(false);

    await page.mouse.move(0, 0);
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
    await pointAt(page, button);
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("Escape hides it until focus leaves", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    await tabTo(page, container.getByRole("button", { name: "Archive" }));
    await page.keyboard.press("Escape");
    await expect.poll(() => shown(tooltip)).toBe(false);

    await page.keyboard.press("Shift+Tab");
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
    await page.keyboard.press("Tab");
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("an unavailable action's tooltip shows on keyboard focus", async ({ page }) => {
    const container = await example(page, "tooltip-explaining-an-unavailable-action");
    await tabTo(page, container.getByRole("button", { name: "Analyze" }));
    await expect.poll(() => shown(tooltipOf(container, "Analyze"))).toBe(true);
  });

  test("it shows 8px from the side it asks for", async ({ page }) => {
    const container = await example(page, "tooltip-sides");
    for (const name of ["Top", "Bottom", "Left", "Right"]) {
      const button = container.getByRole("button", { name, exact: true });
      const tooltip = tooltipOf(container, name);
      await tabTo(page, button);
      await expect.poll(() => shown(tooltip)).toBe(true);
      await settled(tooltip);
      const [b, t] = await boxes(button, tooltip);
      const gap = {
        Top: b.y - (t.y + t.height),
        Bottom: t.y - (b.y + b.height),
        Left: b.x - (t.x + t.width),
        Right: t.x - (b.x + b.width),
      }[name];
      expect(gap, `${name}'s gap`).toBeCloseTo(8, 0);
    }
  });

  test("it shows outside a clipping container, above everything", async ({ page }) => {
    const container = await example(page, "tooltip-inside-a-clipping-container");
    const tooltip = tooltipOf(container, "Hover me");
    await tabTo(page, container.getByRole("button", { name: "Hover me" }));
    // Every corner of the tooltip is the tooltip itself, not clipped away or
    // covered.
    await expect
      .poll(() =>
        tooltip.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return [
            [box.left + 2, box.top + 2],
            [box.right - 2, box.top + 2],
            [box.left + 2, box.bottom - 2],
            [box.right - 2, box.bottom - 2],
          ].every(([x, y]) => element.contains(document.elementFromPoint(x, y)));
        }),
      )
      .toBe(true);
  });
});

// The tooltip in the same trigger as the button with this name.
const tooltipOf = (container: Locator, name: string) =>
  container.locator(".htooltip-trigger").filter({ has: container.page().getByRole("button", { name, exact: true }) }).locator(".htooltip");

// Whether CSS shows a tooltip.
const shown = (tooltip: Locator) => tooltip.evaluate((element) => getComputedStyle(element).visibility === "visible");

// How long CSS waits before showing a tooltip, as things are: the delay of
// its visibility transition.
const delayOf = (tooltip: Locator) =>
  tooltip.evaluate((element) => {
    const style = getComputedStyle(element);
    const properties = style.transitionProperty.split(", ");
    const delays = style.transitionDelay.split(", ");
    return delays[properties.indexOf("visibility") % delays.length];
  });

// Focuses an element from the keyboard, so it matches :focus-visible: focus
// it, then Tab away and back.
const tabTo = async (page: Page, element: Locator) => {
  await element.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(element).toBeFocused();
};
