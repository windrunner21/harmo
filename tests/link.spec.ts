import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/link.md says: no underline by default, and one with
// data-underlined; data-visited changes color without a transition; the
// standard focus ring; and with an icon, the link is no wider than its
// container, its words breaking if they must, the icon beside them.
const styleOf = (element: Locator, property: string) =>
  element.evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);

onEachPlayground("link", () => {
  test("not underlined, unless it has data-underlined, as in running text", async ({ page }) => {
    const standalone = (await example(page, "link-standalone")).getByRole("link", { name: "Settings" });
    expect(await styleOf(standalone, "text-decoration-line")).toBe("none");
    const inText = (await example(page, "link-in-running-text")).getByRole("link", { name: "unsubscribe policy" });
    expect(await styleOf(inText, "text-decoration-line")).toBe("underline");
  });

  test("with data-visited, its color changes without a transition, and the example's first link is this page, so it shows visited", async ({ page }) => {
    const container = await example(page, "link-visited");
    const [first, second] = [container.getByRole("link", { name: "Getting started" }), container.getByRole("link", { name: "Release notes" })];
    // Once React has hydrated it, as the HTML playground's script sets it.
    await expect(first).toHaveAttribute("href", "");
    for (const link of [first, second]) {
      await expect(link).toHaveAttribute("data-visited", "");
      expect(await styleOf(link, "transition-duration")).toBe("0s");
    }
    const standalone = (await example(page, "link-standalone")).getByRole("link", { name: "Settings" });
    expect(await styleOf(standalone, "transition-duration")).toBe("0.15s");
  });

  test("focused from the keyboard, it has the standard ring", async ({ page }) => {
    const container = await example(page, "link-standalone");
    await container.getByRole("link", { name: "Settings" }).focus();
    await page.keyboard.press("Tab");
    const link = container.getByRole("link", { name: "All campaigns" });
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-width", "2px");
    await expect(link).toHaveCSS("outline-offset", "2px");
  });

  test("with an icon, a word too long for the line breaks, and the icon stays beside it, inside the container", async ({ page }) => {
    const container = await example(page, "link-long-text");
    const link = container.getByRole("link", { name: "help.example.com/automations/first-campaign" });
    const frame = container.locator(".play-frame");
    const [outer, box, icon] = await boxes(frame, link, link.locator(".hicon"));
    expect(box.x + box.width).toBeLessThanOrEqual(outer.x + outer.width);
    expect(icon.x + icon.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    expect(await link.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    // Broken onto more than one line.
    expect(box.height).toBeGreaterThan(icon.height + 1);
  });
});
