import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, rendered, test } from "./playgrounds.ts";

// What docs/patterns/globe.md says: named, the picture is an image by its
// name, and unnamed, hidden from screen readers, its controls reached either
// way; it's square, as wide as its container, its canvas drawn at the
// screen's pixel density within its budget; it moves on its own, and Pause
// stops all of it, as reduced motion does from the start; the arrows turn
// it, by a press or the keys, as a drag does; not turning on its own and
// without routes, it's still, without Pause; without controls, it still
// moves on its own, and a drag still turns it; on a touch screen, a swipe up or down scrolls the
// page. Firefox in CI's headless image has no WebGL 2, so the globe isn't
// drawn there: only its markup is checked.
const noWebGl = "Firefox in CI's headless image has no WebGL 2, so nothing is drawn";

// The globe's picture, without its controls, which sit over it and change
// as they're pressed.
const shot = (globe: Locator) => globe.locator(".hglobe-view").screenshot({ mask: [globe.locator(".hglobe-controls")] });

const moves = async (globe: Locator) => {
  const before = await shot(globe);
  await globe.page().waitForTimeout(400);
  return !(await shot(globe)).equals(before);
};

onEachPlayground("globe", () => {
  test("named, the picture is an image by its name; unnamed, screen readers skip it; its controls are there either way", async ({ page, browserName }) => {
    const routes = await example(page, "globe-routes");
    await expect(routes.getByRole("img", { name: "Produce shipped to London from Valencia, Nairobi, Lima, and Auckland" })).toBeVisible();
    const hero = await example(page, "globe-beside-a-heading");
    await expect(hero.locator(".hglobe-view")).toHaveAttribute("aria-hidden", "true");
    await expect(hero.getByRole("img")).toHaveCount(0);
    // Without WebGL, its controls are gone, as they'd do nothing.
    test.skip(browserName === "firefox", noWebGl);
    await expect(routes.getByRole("group", { name: "Globe" }).getByRole("button")).toHaveCount(3);
    await expect(hero.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("it's square, as wide as its container, its canvas drawn at the screen's pixel density, within its budget", async ({ page, browserName }) => {
    const globe = (await example(page, "globe-routes")).locator(".hglobe");
    const box = await globe.boundingBox();
    const width = box?.width ?? 0;
    expect(width).toBeGreaterThan(200);
    expect(box?.height).toBeCloseTo(width, 0);
    test.skip(browserName === "firefox", noWebGl);
    const density = await page.evaluate((width) => Math.min(window.devicePixelRatio, 2, Math.sqrt((1024 * 1024) / (width * width))), width);
    await expect.poll(() => globe.locator("canvas").evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBe(Math.round(width * density));
  });

  test("it moves on its own; Pause stops all of it, and starts it again", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", noWebGl);
    const routes = await example(page, "globe-routes");
    const globe = routes.locator(".hglobe");
    const pause = routes.getByRole("button", { name: "Pause" });
    await expect(pause).toHaveAttribute("aria-pressed", "false");
    expect(await moves(globe), "it moves").toBe(true);
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await rendered(page);
    expect(await moves(globe), "paused, it's still").toBe(false);
    await pause.click();
    expect(await moves(globe), "it moves again").toBe(true);
  });

  test("with reduced motion, it starts paused", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", noWebGl);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const routes = await example(page, "globe-routes");
    await expect(routes.getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the arrows turn it, by a press or from the keys, as a drag does", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", noWebGl);
    const routes = await example(page, "globe-routes");
    const globe = routes.locator(".hglobe");
    await routes.getByRole("button", { name: "Pause" }).click();
    await rendered(page);
    const still = await shot(globe);

    await routes.getByRole("button", { name: "Turn left" }).click();
    await expect.poll(async () => (await shot(globe)).equals(still), { message: "Turn left turns it" }).toBe(false);
    const turned = await shot(globe);
    await routes.getByRole("button", { name: "Turn right" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await shot(globe)).equals(turned), { message: "Turn right turns it" }).toBe(false);

    const dragged = await shot(globe);
    const box = await globe.locator(".hglobe-canvas").boundingBox();
    if (!box) throw new Error("the globe isn't shown");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await shot(globe)).equals(dragged), { message: "a drag turns it" }).toBe(false);
  });

  test("not turning on its own, and without routes, it's still: it has the arrows, and no Pause", async ({ page, browserName }) => {
    const centered = await example(page, "globe-centered-on-a-place");
    test.skip(browserName === "firefox", noWebGl);
    await expect(centered.getByRole("group", { name: "Globe" }).getByRole("button")).toHaveCount(2);
    await expect(centered.getByRole("button", { name: "Pause" })).toHaveCount(0);
    const globe = centered.locator(".hglobe");
    await expect(centered.locator(".hglobe-canvas")).toHaveCSS("cursor", "grab");
    expect(await moves(globe), "it's still").toBe(false);
    const still = await shot(globe);
    await centered.getByRole("button", { name: "Turn right" }).click();
    await expect.poll(async () => (await shot(globe)).equals(still), { message: "Turn right turns it" }).toBe(false);
  });

  test("without controls, it still moves on its own, and a drag still turns it", async ({ page, browserName }) => {
    const plain = await example(page, "globe-without-controls");
    await expect(plain.getByRole("button")).toHaveCount(0);
    test.skip(browserName === "firefox", noWebGl);
    const canvas = plain.locator(".hglobe-canvas");
    expect(await moves(plain.locator(".hglobe"))).toBe(true);
    await expect(canvas).toHaveCSS("cursor", "grab");
    await expect(canvas).toHaveCSS("touch-action", "pan-y");
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("a swipe up or down over it scrolls the page", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Only Chromium can send a touch that moves");
      const canvas = (await example(page, "globe-routes")).locator(".hglobe-canvas");
      await expect(canvas).toHaveCSS("touch-action", "pan-y");
      const box = await canvas.boundingBox();
      if (!box) throw new Error("the globe isn't shown");
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", y = 0) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: box.x + box.width / 2, y }] });
      const before = await page.evaluate(() => scrollY);
      await touch("touchStart", box.y + box.height * 0.7);
      for (let step = 1; step <= 8; step++) await touch("touchMove", box.y + box.height * 0.7 - step * 15);
      await touch("touchEnd");
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
    });
  });
});
