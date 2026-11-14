import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, settled, test, watchTransitions } from "./playgrounds.ts";

// docs/components/expand-chevron.md: the chevron follows its control's
// aria-expanded, folding its two strokes through flat, up over 200ms and back
// down over 150ms, so it points the other way.
onEachPlayground("expand-chevron", () => {
  test("the chevron folds with aria-expanded, and back", async ({ page }) => {
    const container = await example(page, "expand-chevron-toggling");
    const button = container.getByRole("button", { name: "More options" });
    // The demo's: the code panel under it has one too.
    const parts = ["head", "left", "right"].map((name) => container.locator(`.play-demo .hexpand-chevron-${name}`));
    const collapsed = await Promise.all(parts.map(transformOf));

    const folds = await Promise.all(parts.map((part) => watchTransitions(part, "transform")));
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    for (const [index, folded] of folds.entries()) {
      expect(await folded(), `part ${index} folds`).toBeGreaterThan(0);
    }
    await Promise.all(parts.map((part) => settled(part)));
    const expanded = await Promise.all(parts.map(transformOf));

    // Each stroke turns to the opposite angle, and the head moves.
    for (const index of [1, 2]) {
      expect(angleOf(expanded[index]), `part ${index}'s angle`).toBeCloseTo(-angleOf(collapsed[index]), 1);
      expect(angleOf(expanded[index])).not.toBeCloseTo(0, 1);
    }
    expect(expanded[0]).not.toBe(collapsed[0]);

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await Promise.all(parts.map((part) => settled(part)));
    expect(await Promise.all(parts.map(transformOf))).toEqual(collapsed);
  });

  test("it folds up over 200ms and back down over 150ms, as what it opens closes; with reduced motion, it flips without moving", async ({ page }) => {
    const container = await example(page, "expand-chevron-toggling");
    const button = container.getByRole("button", { name: "More options" });
    const parts = ["head", "left", "right"].map((name) => container.locator(`.play-demo .hexpand-chevron-${name}`));
    // A transition takes the duration of the state it goes to: collapsed for
    // folding back down, expanded for folding up.
    for (const part of parts) expect(await durationOf(part)).toBe("0.15s");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    for (const part of parts) expect(await durationOf(part)).toBe("0.2s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const part of parts) expect(await durationOf(part)).toBe("0s");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    for (const part of parts) expect(await durationOf(part)).toBe("0s");
  });

  test("it points up after the control it follows, as beside a Combobox's field, and in an open <details> element's summary", async ({ page }) => {
    const container = await example(page, "expand-chevron-toggling");
    // The example's chevron, in each place, with its control open and closed.
    const angles = await container.locator(".play-demo .hexpand-chevron").evaluate((chevron) => {
      const svg = chevron.outerHTML;
      const host = document.createElement("div");
      host.innerHTML = [
        `<div><button aria-expanded="true">Open</button>${svg}</div>`,
        `<div><button aria-expanded="false">Closed</button>${svg}</div>`,
        `<details open><summary>Open${svg}</summary></details>`,
        `<details><summary>Closed${svg}</summary></details>`,
      ].join("");
      document.body.append(host);
      const angles = [...host.querySelectorAll(".hexpand-chevron-left")].map((left) => {
        const [a = 1, b = 0] = getComputedStyle(left).transform.match(/matrix\(([^)]*)\)/)?.[1]?.split(",").map(Number) ?? [];
        return Math.round((Math.atan2(b, a) * 180) / Math.PI);
      });
      host.remove();
      return angles;
    });
    expect(angles).toEqual([-40, 40, -40, 40]);
  });

  test("an app's rule of the same weight, loaded after Harmo's, overrides an expanded one", async ({ page }) => {
    const container = await example(page, "expand-chevron-collapsed-and-expanded");
    await page.addStyleTag({ content: ".hexpand-chevron .hexpand-chevron-left { transform: rotate(10deg); transition: none; }" });
    const expanded = container.locator('.play-demo [aria-expanded="true"] .hexpand-chevron-left');
    expect(angleOf(await transformOf(expanded))).toBeCloseTo(10, 1);
  });
});

const durationOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).transitionDuration);

const transformOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).transform);

// The rotation, in degrees, of a computed transform: "matrix(a, b, …)", or
// "none".
const angleOf = (transform: string) => {
  const [a = 1, b = 0] = transform.match(/matrix\(([^)]*)\)/)?.[1]?.split(",").map(Number) ?? [];
  return (Math.atan2(b, a) * 180) / Math.PI;
};
