import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/navigation-menu.md says: triggers open a panel on hover,
// a click, or Enter; one frame resizes as you move between them; Tab goes from
// a trigger into its links, and closed panels are out of the Tab order; Escape,
// a press outside, focus leaving, and choosing a link close it; and vertically
// each panel opens in place.
const parts = async (container: Locator) => {
  const nav = container.getByRole("navigation").first();
  const trigger = (name: string) => nav.getByRole("button", { name, exact: true });
  const panel = async (name: string) => nav.locator(`[id="${await trigger(name).getAttribute("aria-controls")}"]`);
  return { nav, trigger, panel, frame: nav.locator(".hnavigation-menu-frame") };
};

// How many of an element's transitions are resizing it, or sliding it.
const transitioning = (element: Locator, pattern: string) =>
  element.evaluate(
    (node, pattern) =>
      node.getAnimations().filter((animation) => new RegExp(pattern).test((animation as CSSTransition).transitionProperty)).length,
    pattern,
  );
const moves = (element: Locator) => transitioning(element, "width|height|inline-size|block-size");
const slides = (element: Locator) => transitioning(element, "translate");

onEachPlayground("navigation-menu", () => {
  test("closed, its panels are hidden and out of the Tab order", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, panel } = await parts(container);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    await expect(await panel("Solutions")).toBeHidden();

    await nav.getByRole("link", { name: "Product" }).focus();
    await page.keyboard.press("Tab");
    await expect(trigger("Solutions")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(trigger("Resources")).toBeFocused();
  });

  test("the pointer opens a panel on a trigger, the frame wraps its rows, and leaving closes it", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, panel, frame } = await parts(container);
    await trigger("Solutions").hover();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    const solutions = await panel("Solutions");
    await expect(solutions.getByRole("link", { name: /^Commerce/ })).toBeVisible();
    await expect(nav).toHaveAttribute("data-open");
    // From closed, it only fades in: nothing slides or resizes.
    await expect(nav).not.toHaveAttribute("data-moving");

    await settled(frame);
    const [navBox, frameBox, rows] = await boxes(nav, frame, solutions.locator(".hnavigation-menu-rows"));
    expect(frameBox.width).toBeCloseTo(rows.width + 18, 0);
    expect(frameBox.height).toBeCloseTo(rows.height + 18, 0);
    expect(frameBox.x + frameBox.width).toBeCloseTo(navBox.x + navBox.width, 0);
    expect(frameBox.y).toBeCloseTo(navBox.y + navBox.height + 8, 0);

    // Across the gap to the panel, and it stays.
    await solutions.getByRole("link", { name: /^Marketing/ }).hover();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");

    await page.mouse.move(0, 0);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    await expect(solutions).toBeHidden();
  });

  test("moving to another trigger resizes the frame and slides the rows, one panel open at a time", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, panel, frame } = await parts(container);
    await trigger("Solutions").hover();
    await settled(frame);
    const [before] = await boxes(frame);

    // The frame's resizing and the rows' sliding really run.
    const incoming = (await panel("Resources")).locator(".hnavigation-menu-rows");
    await slowDown(frame);
    await slowDown(incoming);
    await trigger("Resources").hover();
    await expect(nav).toHaveAttribute("data-moving");
    expect(await moves(frame)).toBeGreaterThan(0);
    expect(await slides(incoming)).toBe(1);
    for (const part of [frame, incoming]) {
      await part.evaluate((node) => {
        (node as HTMLElement).style.transitionDuration = "";
        for (const animation of node.getAnimations()) animation.finish();
      });
    }
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    await expect(trigger("Resources")).toHaveAttribute("aria-expanded", "true");
    const [solutions, resources] = [await panel("Solutions"), await panel("Resources")];
    await expect(solutions).toHaveAttribute("data-position", "before");
    await expect(resources).not.toHaveAttribute("data-position");

    await settled(frame);
    await settled(resources.locator(".hnavigation-menu-rows"));
    const [after, rows] = await boxes(frame, resources.locator(".hnavigation-menu-rows"));
    expect(after.width).toBeCloseTo(rows.width + 18, 0);
    expect(after.width).not.toBeCloseTo(before.width, 0);
    await expect(solutions).toBeHidden();

    // Hovering a plain link closes it.
    await nav.getByRole("link", { name: "Product" }).hover();
    await expect(trigger("Resources")).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter opens it, Tab goes into its links and on to the next trigger, closing it, and Escape returns focus", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel } = await parts(container);
    await trigger("Solutions").focus();
    await page.keyboard.press("Enter");
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    const solutions = await panel("Solutions");

    for (const name of [/^Commerce/, /^Customer support/, /^Marketing/]) {
      await page.keyboard.press("Tab");
      await expect(solutions.getByRole("link", { name })).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(trigger("Resources")).toBeFocused();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(trigger("Resources")).toHaveAttribute("aria-expanded", "false");
    await expect(trigger("Resources")).toBeFocused();
  });

  test("a click keeps a panel the pointer opened, another closes it, and a press outside or a link closes it too", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel } = await parts(container);
    await trigger("Solutions").hover();
    await trigger("Solutions").click();
    await page.mouse.move(0, 0);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");

    await trigger("Solutions").click();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");

    await page.mouse.move(0, 0);
    await trigger("Solutions").click();
    await page.mouse.move(0, 0);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    await page.mouse.click(1, 1);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");

    await trigger("Solutions").click();
    await (await panel("Solutions")).getByRole("link", { name: /^Commerce/ }).click();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
  });

  test("a row's icon tile fills as it's hovered", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel, frame } = await parts(container);
    await trigger("Solutions").hover();
    await settled(frame);
    const row = (await panel("Solutions")).getByRole("link", { name: /^Commerce/ });
    const tile = row.locator(".hnavigation-menu-icon");
    const resting = await tile.evaluate((node) => getComputedStyle(node).backgroundColor);
    await row.hover();
    await settled(tile);
    await expect(tile).not.toHaveCSS("background-color", resting);
    await expect(row).toHaveAccessibleName("Commerce Drive sales and convert chats");
  });

  test("it grows from just under full size, and with reduced motion it only fades", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, frame, panel } = await parts(container);
    await expect(frame).toHaveCSS("scale", "0.98");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await settled(frame);
    await expect(frame).toHaveCSS("scale", "none");
    await trigger("Solutions").hover();
    await settled(frame);
    await trigger("Resources").hover();
    const transitions = await frame.evaluate((node) => getComputedStyle(node).transitionProperty);
    expect(transitions).not.toMatch(/size|width|height/);
    const rows = (await panel("Resources")).locator(".hnavigation-menu-rows");
    await expect(rows).toHaveCSS("transition-property", "all");
    await expect(rows).toHaveCSS("transition-duration", "0s");
  });

  test("it opens in 200ms and closes in 150ms", async ({ page }) => {
    const { trigger, frame } = await parts(await example(page, "navigation-menu-default"));
    await expect(frame).toHaveCSS("transition-duration", "0.15s, 0.15s");
    await trigger("Solutions").hover();
    await expect(frame).toHaveCSS("transition-duration", "0.2s");
  });

  test('with data-align="start", the panel opens at the menu\'s start', async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, frame } = await parts(container);
    await nav.evaluate((element) => element.setAttribute("data-align", "start"));
    await trigger("Solutions").hover();
    await settled(frame);
    const [navBox, frameBox] = await boxes(nav, frame);
    expect(frameBox.x).toBeCloseTo(navBox.x, 0);
  });

  test("the current page is marked by its color and weight", async ({ page }) => {
    const container = await example(page, "navigation-menu-current-page");
    const link = container.getByRole("link", { name: "Pricing" });
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(link).toHaveCSS("font-weight", "500");
    await expect(container.getByRole("link", { name: "Product" })).not.toHaveAttribute("aria-current");
  });

  test("on a phone, a Menu Button opens the vertical menu, whose panels open in place", async ({ page }) => {
    const container = await example(page, "navigation-menu-on-a-phone");
    const button = container.getByRole("button", { name: "Menu" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    const { nav, trigger, panel } = await parts(container.locator(".hpopup"));
    await expect(nav).toHaveAttribute("data-orientation", "vertical");
    await expect(nav.locator(".hnavigation-menu-frame")).toBeHidden();
    const solutions = await panel("Solutions");
    await expect(solutions).toBeHidden();

    // A pointer over a trigger does nothing here.
    await trigger("Solutions").hover();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");

    // Measured from its trigger, as a Popup that grows may flip to stay on
    // screen.
    const [resourcesBefore, triggerBefore] = await boxes(trigger("Resources"), trigger("Solutions"));
    await trigger("Solutions").click();
    const rows = solutions.locator(".hnavigation-menu-rows");
    await expect(rows.getByRole("link", { name: /^Commerce/ })).toBeVisible();
    await settled(solutions);
    const [solutionsBox, resourcesAfter, triggerBox] = await boxes(solutions, trigger("Resources"), trigger("Solutions"));
    expect(solutionsBox.y).toBeCloseTo(triggerBox.y + triggerBox.height, 0);
    expect(resourcesAfter.y - triggerBox.y).toBeCloseTo(resourcesBefore.y - triggerBefore.y + solutionsBox.height, 0);
  });

  test("right to left, the panel opens at the menu's left end, and earlier panels wait on the right", async ({ page }) => {
    const container = await example(page, "navigation-menu-right-to-left");
    const { nav, trigger, panel, frame } = await parts(container);
    await trigger("الموارد").hover();
    await settled(frame);
    const [navBox, frameBox] = await boxes(nav, frame);
    expect(frameBox.x).toBeCloseTo(navBox.x, 0);

    const before = (await panel("الحلول")).locator(".hnavigation-menu-rows");
    await settled(before);
    const translate = await before.evaluate((node) => parseFloat(getComputedStyle(node).translate));
    expect(translate).toBeGreaterThan(0);
  });

  test("a closing panel is out of the Tab order at once", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel, frame } = await parts(container);
    const solutions = await panel("Solutions");
    await expect(solutions).toHaveAttribute("inert");
    await trigger("Solutions").focus();
    await page.keyboard.press("Enter");
    await expect(solutions).not.toHaveAttribute("inert");
    await settled(frame);

    await page.keyboard.press("Escape");
    await expect(solutions).toHaveAttribute("inert");
    await page.keyboard.press("Tab");
    await expect(trigger("Resources")).toBeFocused();
  });

  test("while the keyboard is in the open item, the pointer leaves it alone", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, panel } = await parts(container);
    await trigger("Solutions").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    const row = (await panel("Solutions")).getByRole("link", { name: /^Commerce/ });
    await expect(row).toBeFocused();

    await trigger("Resources").hover();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    await expect(trigger("Resources")).toHaveAttribute("aria-expanded", "false");
    await expect(row).toBeFocused();
    await page.mouse.move(0, 0);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");

    // Opened by the pointer, with the keyboard on its trigger.
    await nav.getByRole("link", { name: "Product" }).focus();
    await trigger("Solutions").hover();
    await page.keyboard.press("Tab");
    await expect(trigger("Solutions")).toBeFocused();
    await page.mouse.move(0, 0);
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
  });

  test("on a narrow screen, a long panel wraps and stays on it, with more room between its lines", async ({ page }) => {
    const roomy = await example(page, "navigation-menu-default");
    const wide = (await parts(roomy)).nav.locator(".hnavigation-menu-row").first();
    await expect(wide).toHaveCSS("line-height", "14px");

    await page.setViewportSize({ width: 320, height: 800 });
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, panel, frame } = await parts(container);
    const solutions = await panel("Solutions");
    await solutions.locator(".hnavigation-menu-description").first().evaluate((description) => {
      description.textContent = "A description long enough that it has to wrap to fit on a narrow screen";
    });
    await trigger("Solutions").hover();
    await settled(frame);

    const [box, rows] = await boxes(frame, solutions.locator(".hnavigation-menu-rows"));
    expect(box.x).toBeGreaterThanOrEqual(7.5);
    expect(box.x + box.width).toBeLessThanOrEqual(312.5);
    expect(box.width).toBeCloseTo(rows.width + 18, 0);
    await expect(nav.locator(".hnavigation-menu-row").first()).toHaveCSS("line-height", "17.5px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test("a row added while it's open is shown, not clipped", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel, frame } = await parts(container);
    await trigger("Solutions").hover();
    await settled(frame);
    const solutions = await panel("Solutions");
    const rows = solutions.locator(".hnavigation-menu-rows");
    await rows.evaluate((list) => list.append(list.firstElementChild!.cloneNode(true)));
    await expect
      .poll(async () => {
        const [box, inner] = await boxes(solutions, rows);
        return Math.round(box.height - inner.height);
      })
      .toBe(0);
  });

  test("a click with a modifier key leaves it open; choosing a link closes it and returns focus to its trigger", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel } = await parts(container);
    await trigger("Solutions").click();
    const row = (await panel("Solutions")).getByRole("link", { name: /^Commerce/ });
    await row.click({ modifiers: ["ControlOrMeta"] });
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");

    await row.focus();
    await page.keyboard.press("Enter");
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    await expect(trigger("Solutions")).toBeFocused();
  });

  test("a panel takes Escape for itself, leaving a popover around the menu open", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger } = await parts(container);
    await nav.evaluate((element) => {
      const popover = document.createElement("div");
      popover.id = "around";
      popover.popover = "auto";
      element.before(popover);
      popover.append(element);
      popover.showPopover();
    });
    await trigger("Solutions").focus();
    await page.keyboard.press("Enter");
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    expect(await page.locator("#around").evaluate((popover) => popover.matches(":popover-open"))).toBe(true);
  });

  test("a vertical menu leaves Escape to its Popup, stays open through a press on the Popup, and starts closed each time", async ({ page }) => {
    const container = await example(page, "navigation-menu-on-a-phone");
    const button = container.getByRole("button", { name: "Menu" });
    const popup = container.locator(".hpopup");
    await button.click();
    const { trigger } = await parts(popup);
    await trigger("Solutions").click();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");

    // As dragging its scrollbar is.
    await popup.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");

    await trigger("Solutions").focus();
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await settled(popup);

    await button.click();
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
  });

  test("a disabled trigger doesn't open on hover", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger } = await parts(container);
    await trigger("Solutions").evaluate((button: HTMLButtonElement) => (button.disabled = true));
    await trigger("Solutions").hover({ force: true });
    await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
  });

  test("a current row is marked by a line around it as well as its color", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, panel, frame } = await parts(container);
    const row = (await panel("Solutions")).locator(".hnavigation-menu-row").first();
    await row.evaluate((link) => link.setAttribute("aria-current", "page"));
    await trigger("Solutions").click();
    await settled(frame);
    await expect(row).toHaveCSS("outline-style", "solid");
    await expect(row).toHaveCSS("outline-width", "1px");
  });

  test("the whole of an open trigger can be pressed", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { trigger, frame } = await parts(container);
    await trigger("Solutions").hover();
    await settled(frame);
    const hit = await trigger("Solutions").evaluate((button) => {
      const box = button.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.bottom - 3)?.closest("button") === button;
    });
    expect(hit).toBe(true);
  });

  test("closing during a move lets the move finish as it fades", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const { nav, trigger, frame } = await parts(container);
    await trigger("Solutions").hover();
    await settled(frame);
    await slowDown(frame);
    await trigger("Resources").hover();
    await expect(nav).toHaveAttribute("data-moving");
    await page.mouse.move(0, 0);
    await expect(nav).not.toHaveAttribute("data-open");
    await expect(nav).toHaveAttribute("data-moving");
    expect(await moves(frame)).toBeGreaterThan(0);
  });

  test("a hidden icon image stays hidden", async ({ page }) => {
    const container = await example(page, "navigation-menu-default");
    const display = await container.locator(".hnavigation-menu-icon").first().evaluate((tile) => {
      const image = document.createElement("img");
      image.hidden = true;
      tile.append(image);
      return getComputedStyle(image).display;
    });
    expect(display).toBe("none");
  });

  test("the HTML script reads the orientation each time", async ({ page }, info) => {
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const container = await example(page, "navigation-menu-on-a-phone");
    await container.getByRole("button", { name: "Menu" }).click();
    const { nav, trigger } = await parts(container.locator(".hpopup"));
    await nav.evaluate((element) => element.removeAttribute("data-orientation"));
    // The Popup moves as the menu changes shape, so a press aimed at the button
    // could land outside the Popup and close it.
    await trigger("Solutions").dispatchEvent("click");
    await expect.poll(() => nav.evaluate((element) => element.style.getPropertyValue("--hnavigation-menu-width"))).not.toBe("");
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("a tap opens a panel and a second closes it", async ({ page }) => {
      const container = await example(page, "navigation-menu-default");
      const { trigger } = await parts(container);
      await trigger("Solutions").tap();
      await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "true");
      await trigger("Solutions").tap();
      await expect(trigger("Solutions")).toHaveAttribute("aria-expanded", "false");
    });
  });
});

onEachPlayground("menu-button", () => {
  test("three bars turn into a cross while it's expanded, under one name", async ({ page }) => {
    const button = (await example(page, "menu-button-default")).getByRole("button", { name: "Menu" });
    const top = button.locator(".hmenu-button-top");
    const middle = button.locator(".hmenu-button-middle");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(top).toHaveCSS("transform", "none");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await settled(top);
    await expect(top).not.toHaveCSS("transform", "none");
    await expect(middle).toHaveCSS("opacity", "0");
    const bottom = button.locator(".hmenu-button-bottom");
    await settled(bottom);
    await expect(bottom).not.toHaveCSS("transform", "none");
    const transformOf = (bar: Locator) => bar.evaluate((node) => getComputedStyle(node).transform);
    expect(await transformOf(bottom)).not.toBe(await transformOf(top));

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await settled(top);
    await expect(top).toHaveCSS("transform", "none");
  });

  test("it's at least the 24px WCAG asks of a target, its bars hidden from screen readers", async ({ page }) => {
    const button = (await example(page, "menu-button-default")).getByRole("button", { name: "Menu" });
    const [box] = await boxes(button);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
    await expect(button.locator(".hmenu-button-bars")).toHaveAttribute("aria-hidden", "true");
  });
});
