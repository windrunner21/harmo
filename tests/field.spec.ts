import { expect, type Locator, type Page } from "@playwright/test";
import { animations, boxes, example, onEachPlayground, release, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/field.md says: how a Field's parts sit and look, which
// only CSS decides, so it's tested on the HTML playground; and what a
// validating script does, on the Field page's Validating example, where
// SPRING25 is the valid code. The example validates when the field is left.
onEachPlayground("field", () => {
  test("only the pointer on the control lights its border, not the pointer on its label", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "field-label-and-control");
    const label = container.locator(".hlabel").first();
    const control = container.locator(".hinput").first();
    const border = () => control.evaluate((node) => getComputedStyle(node).borderTopColor);
    const rest = await border();
    await label.hover();
    await settled(control);
    expect(await border()).toBe(rest);
    await control.hover();
    await settled(control);
    expect(await border()).not.toBe(rest);
  });

  test("the error is a polite live region from the start, so a message set after focus has moved on is announced", async ({ page }) => {
    const { input, error } = await couponField(page);
    await expect(error).toHaveAttribute("aria-live", "polite");
    await expect(error).toHaveText("");
    await enter(input, "WINTER10");
    await expect(error).toHaveAttribute("aria-live", "polite");
    await expect(input).not.toBeFocused();
  });

  test("an error opens over 200ms and closes in 150ms", async ({ page }) => {
    const { input, error } = await couponField(page);
    const durations = () => error.evaluate((node) => [...new Set(getComputedStyle(node).transitionDuration.split(", "))]);
    expect(await durations()).toEqual(["0.15s"]);
    await enter(input, "WINTER10");
    expect(await durations()).toEqual(["0.2s"]);
  });

  test("an error leaves room past its edges for a focus ring inside it", { tag: "@css" }, async ({ page }) => {
    const error = (await example(page, "field-with-an-error")).locator(".herror");
    expect(await error.evaluate((node) => getComputedStyle(node).overflow)).toBe("clip");
    const margin = await error.evaluate((node) =>
      CSS.supports("overflow-clip-margin", "1px") ? getComputedStyle(node).getPropertyValue("overflow-clip-margin") : null,
    );
    if (margin !== null) expect(margin).toContain("4px");
  });

  test("a label row with the Optional marker is as tall as a label alone", { tag: "@css" }, async ({ page }) => {
    const optional = (await example(page, "field-optional")).locator(".hfield-label-row");
    const plain = (await example(page, "field-label-and-control")).locator(".hlabel");
    expect((await optional.boundingBox())!.height).toBeCloseTo(20, 0);
    expect((await plain.boundingBox())!.height).toBeCloseTo(20, 0);
  });

  test("its parts are 6px apart, the description right under its label, and an error with no text takes no room", { tag: "@css" }, async ({ page }) => {
    const field = (await example(page, "field-with-an-error")).locator(".hfield");
    const [label, optional, description, control, error] = await boxes(
      field.locator(".hlabel"),
      field.locator(".hfield-optional"),
      field.locator(".hdescription"),
      field.locator(".hinput"),
      field.locator(".herror"),
    );
    expect(optional.x - (label.x + label.width)).toBeCloseTo(6, 0);
    expect(description.y - (label.y + label.height)).toBeCloseTo(0, 0);
    expect(control.y - (description.y + description.height)).toBeCloseTo(6, 0);
    expect(error.y - (control.y + control.height)).toBeCloseTo(6, 0);

    const validating = (await example(page, "field-validating")).locator(".hfield");
    const [whole, input] = await boxes(validating, validating.locator(".hinput"));
    expect(whole.y + whole.height).toBeCloseTo(input.y + input.height, 0);
  });

  test("in a horizontal Field, the description sits right under the label, as in a stacked one", { tag: "@css" }, async ({ page }) => {
    const under = async (id: string) => {
      const field = (await example(page, id)).locator(".hfield").first();
      const [label, description] = await Promise.all(
        [field.locator(".hlabel"), field.locator(".hdescription")].map(async (part) => (await part.boundingBox())!),
      );
      return description!.y - (label!.y + label!.height);
    };
    expect(await under("field-horizontal")).toBeCloseTo(0, 0);
    expect(await under("field-horizontal")).toBeCloseTo(await under("field-with-a-description"), 0);
  });

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
    await slowDown(error);

    await enter(input, "SPRING25");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(error).toHaveAttribute("hidden");
    // Mid-close, it still says what it said.
    expect(await animations(error), "closing animations").toBeGreaterThan(0);
    await expect(error).toHaveText("This coupon code is not valid.");

    await release(error);
    await expect(error).toHaveText("");
    await expect(input).toHaveAccessibleDescription("");
  });

  test("an error shown again while it closes keeps its text", async ({ page }) => {
    const { input, error } = await couponField(page);
    await enter(input, "WINTER10");
    await settled(error);
    await slowDown(error);
    await enter(input, "SPRING25");
    await expect(error).toHaveAttribute("hidden");

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

  test("a closing error cut short, as when the field stops showing, still clears its text", async ({ page }) => {
    const { input, error } = await couponField(page);
    await enter(input, "WINTER10");
    await settled(error);
    await slowDown(error);
    await enter(input, "SPRING25");
    await expect(error).toHaveAttribute("hidden");
    expect(await animations(error), "closing animations").toBeGreaterThan(0);

    // Cancelled rather than finished, as the browser does to a transition on
    // an element that stops rendering.
    await error.evaluate((node) => {
      for (const animation of node.getAnimations()) animation.cancel();
    });
    await expect(error).toHaveText("");
    await expect(input).toHaveAccessibleDescription("");
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
