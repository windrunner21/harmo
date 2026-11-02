import { expect, type Locator, type Page } from "@playwright/test";
import { example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/field.md says a validating script does, on the Field
// page's Validating example, where SPRING25 is the valid code. The example
// validates when the field is left.
onEachPlayground("field", () => {
  test("an invalid value shows the error and marks the control", async ({ page }) => {
    const { input, error } = await couponField(page);
    await expect(error).toBeHidden();

    await enter(input, "WINTER10");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(error).toHaveText("This coupon code is not valid.");
    await expect(error).toBeVisible();
    await expect(input).toHaveAccessibleDescription("This coupon code is not valid.");
  });

  test("a valid value closes the error, and clears its text only once it has closed", async ({ page }) => {
    const { input, error } = await couponField(page);
    await enter(input, "WINTER10");
    await settled(error);

    await enter(input, "SPRING25");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(error).toHaveAttribute("hidden");
    // Held mid-close, it still says what it said.
    expect(await hold(error), "closing animations").toBeGreaterThan(0);
    await expect(error).toHaveText("This coupon code is not valid.");

    await release(error);
    await expect(error).toHaveText("");
    await expect(input).toHaveAccessibleDescription("");
  });

  test("an error shown again while it closes keeps its text", async ({ page }) => {
    const { input, error } = await couponField(page);
    await enter(input, "WINTER10");
    await settled(error);
    await enter(input, "SPRING25");
    await expect(error).toHaveAttribute("hidden");
    await hold(error);

    await enter(input, "WINTER10");
    await expect(error).not.toHaveAttribute("hidden");
    await release(error);
    await settled(error);
    // Longer than the closing would have taken, so a clearing that missed the
    // reopening has happened by now.
    await page.waitForTimeout(500);
    expect(await error.textContent()).toBe("This coupon code is not valid.");
    await expect(error).toBeVisible();
  });
});

const couponField = async (page: Page) => {
  const container = await example(page, "field-validating");
  return { input: container.getByLabel("Coupon code"), error: container.locator(".herror") };
};

// Types a code and leaves the field, which validates it.
const enter = async (input: Locator, code: string) => {
  await input.fill(code);
  await input.press("Tab");
};

// Pauses an element's animations, and says how many there are.
const hold = (element: Locator) =>
  element.evaluate((node) => {
    const animations = node.getAnimations();
    for (const animation of animations) animation.pause();
    return animations.length;
  });

// Finishes an element's animations, held or not.
const release = (element: Locator) =>
  element.evaluate((node) => {
    for (const animation of node.getAnimations()) animation.finish();
  });
