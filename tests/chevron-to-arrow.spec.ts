import { expect, type Locator, type Page } from "@playwright/test";
import { example, onEachPlayground, ready, test } from "./playgrounds.ts";

// What docs/components/chevron-to-arrow.md says: on a device that hovers, it
// rests as a chevron, and hovering its control slides the head 8px outward
// and shows the shaft; keyboard focus shows the arrow at once; on a touch
// screen, with reduced motion, and in a disabled control, it's the finished
// arrow, not moving. Back mirrors it, and right-to-left text mirrors both.
// Only CSS decides it, so it's tested on the HTML playground, all but
// keyboard focus, which takes a key press.
const resting = "matrix(1, 0, 0, 1, -4, 0)";
const finished = "matrix(1, 0, 0, 1, 4, 0)";

const partsOf = (control: Locator) => ({
  svg: control.locator(".hchevron-to-arrow"),
  head: control.locator(".hchevron-to-arrow-head"),
  shaft: control.locator(".hchevron-to-arrow-shaft"),
});

const transformOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).transform);
const opacityOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).opacity);
const running = (element: Locator) => element.evaluate((node) => node.getAnimations().length);

// Whether the drawn arrow points right: its head is right of its middle.
const pointsRight = (control: Locator) =>
  control.locator(".hchevron-to-arrow").evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const head = svg.querySelector(".hchevron-to-arrow-head")!.getBoundingClientRect();
    return head.x + head.width / 2 > box.x + box.width / 2;
  });

const continueButton = async (page: Page) =>
  (await example(page, "chevron-to-arrow-forward-and-back")).getByRole("button", { name: "Continue" });

onEachPlayground("chevron-to-arrow", () => {
  test("at rest it's a chevron; hovered, its head slides 8px outward and the shaft shows, in 150ms", { tag: "@css" }, async ({ page }) => {
    const button = await continueButton(page);
    const { head, shaft } = partsOf(button);
    await page.mouse.move(0, 0);
    expect(await transformOf(head)).toBe(resting);
    expect(await opacityOf(shaft)).toBe("0");
    expect(await head.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0.15s");

    await button.hover();
    await expect.poll(() => transformOf(head)).toBe(finished);
    await expect.poll(() => opacityOf(shaft)).toBe("1");
  });

  test("keyboard focus shows the arrow at once", async ({ page }) => {
    const container = await example(page, "chevron-to-arrow-forward-and-back");
    const button = container.getByRole("button", { name: "Continue" });
    const { head, shaft } = partsOf(button);
    await page.mouse.move(0, 0);
    await container.getByRole("button", { name: "Go back" }).focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    expect(await running(head), "the head's transitions").toBe(0);
    expect(await running(shaft), "the shaft's transitions").toBe(0);
    expect(await transformOf(head)).toBe(finished);
    expect(await opacityOf(shaft)).toBe("1");
  });

  test("in a disabled control, it's the finished arrow, and hovering moves nothing", { tag: "@css" }, async ({ page }) => {
    const button = (await example(page, "chevron-to-arrow-without-animation")).getByRole("button", { name: "Continue" });
    const { head, shaft } = partsOf(button);
    await page.mouse.move(0, 0);
    expect(await transformOf(head)).toBe(finished);
    expect(await opacityOf(shaft)).toBe("1");
    await button.hover({ force: true });
    expect(await running(head)).toBe(0);
    expect(await transformOf(head)).toBe(finished);
  });

  test("with reduced motion, it's the finished arrow", { tag: "@css" }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { head, shaft } = partsOf(await continueButton(page));
    await page.mouse.move(0, 0);
    expect(await transformOf(head)).toBe(finished);
    expect(await opacityOf(shaft)).toBe("1");
  });

  test("on a touch screen, it's the finished arrow", { tag: "@css" }, async ({ page, browserName, browser }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates a touch screen");
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    try {
      const touch = await context.newPage();
      await touch.goto(page.url());
      await ready(touch);
      const { head, shaft } = partsOf(await continueButton(touch));
      expect(await transformOf(head)).toBe(finished);
      expect(await opacityOf(shaft)).toBe("1");
    } finally {
      await context.close();
    }
  });

  test("forward points toward the end of the line and back toward its start, in left-to-right and right-to-left text", { tag: "@css" }, async ({ page }) => {
    // The finished arrow, so where the head is shows which way it points.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const ltr = await example(page, "chevron-to-arrow-forward-and-back");
    expect(await pointsRight(ltr.getByRole("button", { name: "Continue" })), "forward").toBe(true);
    expect(await pointsRight(ltr.getByRole("button", { name: "Go back" })), "back").toBe(false);

    const rtl = await example(page, "chevron-to-arrow-right-to-left");
    expect(await pointsRight(rtl.getByRole("button", { name: "متابعة" })), "forward, right to left").toBe(false);
    expect(await pointsRight(rtl.getByRole("button", { name: "رجوع" })), "back, right to left").toBe(true);
  });

  test("an app's rule of the same weight, loaded after Harmo's, overrides the resting chevron", { tag: "@css" }, async ({ page }) => {
    const { shaft } = partsOf(await continueButton(page));
    await page.mouse.move(0, 0);
    await page.addStyleTag({ content: ".hchevron-to-arrow .hchevron-to-arrow-shaft { opacity: 0.5; }" });
    // Once its fade to the new opacity lands.
    await expect.poll(() => opacityOf(shaft)).toBe("0.5");
  });
});
