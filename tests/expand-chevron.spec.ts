import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, settled, test, watchTransitions } from "./playgrounds.ts";

// docs/components/expand-chevron.md: the chevron follows its control's
// aria-expanded, folding its two strokes through flat over 200ms, so it
// points the other way.
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
});

const transformOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).transform);

// The rotation, in degrees, of a computed transform: "matrix(a, b, …)", or
// "none".
const angleOf = (transform: string) => {
  const [a = 1, b = 0] = transform.match(/matrix\(([^)]*)\)/)?.[1]?.split(",").map(Number) ?? [];
  return (Math.atan2(b, a) * 180) / Math.PI;
};
