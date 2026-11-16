import { expect, type Locator, type Page } from "@playwright/test";
import { axe } from "./axe.ts";
import { boxes, example, onEachPlayground, ready, rendered, settled, test } from "./playgrounds.ts";

// What docs/components/toast.md says, on the Toast page: a toast comes in at
// the bottom center, above everything, and leaves after 4 seconds; toasts
// stack and leave one at a time; hover, a tap, or F8 spreads them out and
// holds them, as a hidden page does, but focus a mouse press put there
// doesn't, unless F8 is pressed with it there; F8 rings the front toast; spread out taller than the window, the
// stack scrolls; at the top, the newest comes first in the page; an action
// closes its toast unless its handler prevents it; the same id changes a
// toast in place; over an open Drawer, toasts move inside it, where they can
// be used.
const region = (page: Page) => page.locator(".htoaster");
const live = (page: Page) => page.locator(".htoast:not([data-removed])");

const send = async (page: Page, id: string, button: string) => {
  const container = await example(page, id);
  await container.getByRole("button", { name: button, exact: true }).click();
};

// When each toast started to leave, in ms from now, with its title.
const watchExits = (page: Page) =>
  page.evaluate(() => {
    const exits: [string, number][] = [];
    const start = performance.now();
    new MutationObserver((records) => {
      for (const { target } of records) {
        const item = target as HTMLElement;
        if (item.hasAttribute("data-removed")) {
          exits.push([item.querySelector(".htoast-title")?.textContent ?? "", performance.now() - start]);
        }
      }
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-removed"] });
    (window as unknown as { exits: typeof exits }).exits = exits;
  });
const exits = (page: Page) => page.evaluate(() => (window as unknown as { exits: [string, number][] }).exits);

// Whether any toast's text takes more lines than its box was measured for.
const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".htoast:not([data-removed])")]
      .filter((item) => {
        const body = item.querySelector<HTMLElement>(":scope > .htoast-body:not([data-leaving])");
        const measured = parseFloat(item.style.getPropertyValue("--htoast-height")) - 2;
        return body && parseFloat(getComputedStyle(body).height) > measured + 0.5;
      })
      .map((item) => item.querySelector(".htoast-title")?.textContent),
  );

const front = (page: Page) => page.locator(".htoast[data-front]:not([data-removed])");

// Playwright's clock, running as time does, so a test can skip the seconds a
// toast waits before it leaves with fastForward, rather than wait them out.
// Its fake timers must be in place before the page's scripts run. Only for
// the tests that wait those seconds: the others are about frames and
// transitions, which stay the browser's own.
const fakeClock = async (page: Page) => {
  await page.clock.install();
  await page.reload();
  await ready(page);
};
const announcer = (page: Page, role: "status" | "alert") => page.locator(`.htoaster-announce[role="${role}"]`);

// As if the page were hidden, or shown again, then two frames, so what that
// changes has happened.
const setHidden = async (page: Page, hidden: boolean) => {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
  await rendered(page);
};

// What axe finds wrong with the contrast of the toasts' text, once nothing in
// the region is moving: while they fade in or out, they're faint on purpose.
const contrast = (page: Page) =>
  page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    const moving = document.querySelector(".htoaster")!.getAnimations({ subtree: true });
    await Promise.all(moving.map((animation) => animation.finished.catch(() => {})));
    const { axe } = window as unknown as { axe: typeof import("axe-core") };
    const { violations } = await axe.run(document.querySelector(".htoaster-list")!, {
      runOnly: { type: "rule", values: ["color-contrast"] },
      resultTypes: ["violations"],
      preload: false,
    });
    return violations.flatMap(({ nodes }) => nodes.map((node) => node.target.join(" ")));
  });

// Where the first toast to come in, and the first to leave, are 100ms into
// their transitions: how far below their place, and how opaque. Their
// transitions are held there to read them, then go on, so it doesn't depend
// on how fast the browser draws frames, which a browser that has just started
// does slowly.
const recordMotion = (page: Page) =>
  page.evaluate(() => {
    const seen: Record<string, { y: number; opacity: number }> = {};
    const sample = (node: HTMLElement, name: string) => {
      void getComputedStyle(node).transform;
      const running = node.getAnimations();
      for (const animation of running) {
        animation.pause();
        animation.currentTime = 100;
      }
      const style = getComputedStyle(node);
      seen[name] = {
        y: new DOMMatrix(style.transform === "none" ? undefined : style.transform).m42,
        opacity: Number(style.opacity),
      };
      for (const animation of running) animation.play();
    };
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") {
          for (const node of record.addedNodes) {
            if ((node as HTMLElement).classList?.contains("htoast") && !seen.entering) sample(node as HTMLElement, "entering");
          }
        } else if ((record.target as HTMLElement).hasAttribute("data-removed") && !seen.leaving) {
          sample(record.target as HTMLElement, "leaving");
        }
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-removed"] });
    (window as unknown as { motion: typeof seen }).motion = seen;
  });
const motion = (page: Page) =>
  page.evaluate(() => (window as unknown as { motion: Record<string, { y: number; opacity: number }> }).motion);

const centerX = async (element: Locator) => {
  const [box] = await boxes(element);
  return box.x + box.width / 2;
};

// A color as the page computes it, such as a token's.
const computed = (page: Page, color: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, color);

// Presses an example's button as the app would, without the pointer, which
// would spread the stack out as it passes, or moving focus.
const press = async (page: Page, id: string, button: string) => {
  const container = await example(page, id);
  await container.getByRole("button", { name: button, exact: true }).evaluate((node) => (node as HTMLElement).click());
};

onEachPlayground("toast", () => {
  test("a button sends a toast: above the page at the bottom center, with its title and description, read when the screen reader is free", async ({ page }) => {
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(1);
    expect(await region(page).evaluate((node) => node.matches(":popover-open"))).toBe(true);
    const toast = live(page).first();
    await expect(announcer(page, "status")).toContainText("Quick reply saved");
    await expect(announcer(page, "status")).toContainText("Type /ship in a chat to use it.");
    await expect(announcer(page, "alert")).toBeEmpty();
    await expect(toast.locator(".htoast-title")).toHaveText("Quick reply saved");
    await expect(toast.locator(".htoast-description")).toHaveText("Type /ship in a chat to use it.");
    await settled(toast);
    const { width, height } = page.viewportSize()!;
    expect(await centerX(toast)).toBeCloseTo(width / 2, 0);
    const [box] = await boxes(toast);
    expect(box.y + box.height).toBeCloseTo(height - 24, 0);
  });

  test("warnings and errors are read at once, and a status colors the icon", async ({ page }) => {
    await send(page, "toast-each-status", "Error");
    const toast = live(page).first();
    await expect(announcer(page, "alert")).toContainText("Couldn't send the campaign");
    await expect(announcer(page, "status")).toBeEmpty();
    await expect(toast).toHaveAttribute("data-status", "error");
    const colors = await toast.evaluate((node) => [
      getComputedStyle(node.querySelector(".htoast-icon")!).color,
      getComputedStyle(document.documentElement).getPropertyValue("--harmo-status-color-error").trim(),
    ]);
    const probe = await page.evaluate((color) => {
      const element = document.createElement("i");
      element.style.color = color;
      document.body.append(element);
      const value = getComputedStyle(element).color;
      element.remove();
      return value;
    }, colors[1]!);
    expect(colors[0]).toBe(probe);
  });

  test("a warning is read at once too; success and info when the screen reader is free", async ({ page }) => {
    await send(page, "toast-each-status", "Success");
    await expect(announcer(page, "status")).toContainText("Contact added");
    await expect(announcer(page, "alert")).toBeEmpty();
    await send(page, "toast-each-status", "Info");
    await expect(announcer(page, "status")).toContainText("Export started");
    await expect(announcer(page, "alert")).toBeEmpty();
    await send(page, "toast-each-status", "Warning");
    await expect(announcer(page, "alert")).toContainText("3 contacts weren't imported");
    await expect(announcer(page, "status")).not.toContainText("3 contacts weren't imported");
  });

  test("with toasts showing, one with an action and one changed in place, axe finds nothing wrong in the region", async ({ page }) => {
    await page.addScriptTag({ path: axe });
    // What it showed fades out for 100 seconds, so it's still there to check.
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-with-an-action", "Archive conversation");
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect(live(page)).toHaveCount(2);
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(1);
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as { axe: typeof import("axe-core") };
      // Its structure, names, and roles: not contrast, since toasts that are
      // fading in or out are faint on purpose; the next test checks contrast
      // once they've settled.
      const { violations } = await axe.run(document.querySelector(".htoaster")!, {
        resultTypes: ["violations"],
        preload: false,
        rules: { "color-contrast": { enabled: false } },
      });
      return violations.map(({ id, nodes }) => `${id}: ${nodes.length}`);
    });
    expect(violations).toEqual([]);
  });

  test("settled, collapsed and spread out, in light and dark, the toasts' text has enough contrast", async ({ page }) => {
    await page.addScriptTag({ path: axe });
    // Held, as while the page is hidden, so none leaves while it's checked.
    await setHidden(page, true);
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    await page.mouse.move(5, 5);
    expect(await contrast(page), "collapsed, in light mode").toEqual([]);

    await page.keyboard.press("F8");
    await expect(region(page)).toHaveAttribute("data-expanded");
    expect(await contrast(page), "spread out, in light mode").toEqual([]);

    await page.evaluate(() => (document.documentElement.style.colorScheme = "dark"));
    expect(await contrast(page), "spread out, in dark mode").toEqual([]);

    await page.keyboard.press("Escape");
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    expect(await contrast(page), "collapsed, in dark mode").toEqual([]);
  });

  test("hidden hides any part of a toast, as it does any component's", async ({ page }) => {
    await send(page, "toast-with-an-action", "Archive conversation");
    const toast = live(page).first();
    await expect(toast).toBeVisible();
    // Browsers ignore hidden on SVG, such as the icon.
    const shown = await toast.evaluate((node) =>
      [node, ...node.querySelectorAll("*")]
        .filter((element): element is HTMLElement => element instanceof HTMLElement)
        .filter((element) => {
          element.hidden = true;
          const { display } = getComputedStyle(element);
          element.hidden = false;
          return display !== "none";
        })
        .map((element) => element.className),
    );
    expect(shown).toEqual([]);
  });

  test("it comes in from below, fading in, and after 4 seconds slides back down, fading out, and goes", async ({ page }) => {
    await fakeClock(page);
    await watchExits(page);
    await recordMotion(page);
    await send(page, "toast-default", "Save quick reply");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    const { entering } = await motion(page);
    expect(entering!.y).toBeGreaterThan(1);
    expect(entering!.opacity).toBeLessThan(1);
    await page.clock.fastForward(3500);
    await expect(live(page)).toHaveCount(1);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 3000 });
    const [[, at] = ["", 0]] = await exits(page);
    expect(at).toBeGreaterThan(3900);
    expect(at).toBeLessThan(4800);
    const { leaving } = await motion(page);
    expect(leaving!.y).toBeGreaterThan(1);
    expect(leaving!.opacity).toBeLessThan(1);
  });

  test("a stack: newest in front, the others behind in its shape; they leave one at a time, oldest first", async ({ page }) => {
    await fakeClock(page);
    await watchExits(page);
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    await expect(front(page).locator(".htoast-title")).toHaveText("Chat assigned to you");
    const [frontBox, middle, back] = await boxes(
      front(page),
      live(page).nth(1),
      live(page).nth(0),
    );
    // Behind it, at its width (each one back 5% smaller), and higher.
    expect(middle.width).toBeCloseTo(frontBox.width * 0.95, 0);
    expect(back.width).toBeCloseTo(frontBox.width * 0.9, 0);
    expect(middle.y).toBeLessThan(frontBox.y);
    expect(back.y).toBeLessThan(middle.y);

    // To just before the first leaves; then each in its turn, as time does.
    await page.clock.fastForward(2800);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 5000 });
    const left = await exits(page);
    expect(left.map(([title]) => title)).toEqual([
      "Contact added",
      "2 contacts were already in the list",
      "Chat assigned to you",
    ]);
    expect(left[1]![1] - left[0]![1]).toBeGreaterThan(600);
    expect(left[2]![1] - left[1]![1]).toBeGreaterThan(600);
  });

  test("toasts of different widths stay centered on every frame as they come and change shape", async ({ page }) => {
    await page.mouse.move(5, 5);
    const drift = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const middle = document.documentElement.clientWidth / 2;
          let worst = 0;
          const start = performance.now();
          const frame = () => {
            for (const item of document.querySelectorAll(".htoast")) {
              const box = item.getBoundingClientRect();
              worst = Math.max(worst, Math.abs(box.left + box.width / 2 - middle));
            }
            if (performance.now() - start < 2200) requestAnimationFrame(frame);
            else resolve(worst);
          };
          requestAnimationFrame(frame);
        }),
    );
    // Each once the one before has come in and changed the stack's shape.
    await send(page, "toast-each-status", "Info");
    await page.mouse.move(5, 5);
    await expect(live(page)).toHaveCount(1);
    await settled(front(page));
    await send(page, "toast-each-status", "Warning");
    await page.mouse.move(5, 5);
    await expect(live(page)).toHaveCount(2);
    await settled(front(page));
    await send(page, "toast-each-status", "Success");
    await page.mouse.move(5, 5);
    expect(await drift).toBeLessThan(0.5);
  });

  test("hovered, the stack spreads out, each toast at its own size, and none leaves until the pointer does", async ({ page, isMobile }) => {
    test.skip(isMobile, "a tap spreads it on touch");
    await fakeClock(page);
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    const [box] = await boxes(front(page));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(region(page)).toHaveAttribute("data-expanded");
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    const [newest, middle, oldest] = await boxes(live(page).nth(2), live(page).nth(1), live(page).nth(0));
    // 10px apart, the list's row-gap, --harmo-space-xs.
    expect(newest.y - (middle.y + middle.height)).toBeCloseTo(10, 0);
    expect(middle.y - (oldest.y + oldest.height)).toBeCloseTo(10, 0);
    expect(middle.width).toBeGreaterThan(newest.width);

    // Moving up the list, over the gaps, keeps it spread out.
    await page.mouse.move(oldest.x + oldest.width / 2, oldest.y + oldest.height / 2, { steps: 8 });
    // Longer than a toast lasts.
    await page.clock.fastForward(4000);
    await expect(live(page)).toHaveCount(3);
    await expect(region(page)).toHaveAttribute("data-expanded");

    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    await page.clock.fastForward(3000);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 5000 });
  });

  test("focus a mouse press put on the region, on a toast's text or by an action that closed its toast, doesn't hold the stack once the pointer has gone", async ({ page }) => {
    await fakeClock(page);
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(1);
    await settled(front(page));
    // Its text can't take focus, so the region, with tabindex="-1", does.
    await front(page).locator(".htoast-title").click();
    await expect(region(page)).toBeFocused();
    await expect(region(page)).toHaveAttribute("data-expanded");
    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    await expect(region(page)).toBeFocused();
    // Longer than a toast lasts: it left all the same.
    await page.clock.fastForward(4500);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 3000 });

    // Undo closes its toast and puts focus on the region, with one left.
    await send(page, "toast-default", "Save quick reply");
    await send(page, "toast-with-an-action", "Archive conversation");
    await expect(live(page)).toHaveCount(2);
    await settled(front(page));
    await front(page).getByRole("button", { name: "Undo" }).click();
    await expect(live(page)).toHaveCount(1);
    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    await page.clock.fastForward(4500);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 3000 });
  });

  test("F8 spreads the stack out and holds it when a mouse press had already put focus on the region, where focus doesn't move", async ({ page }) => {
    await fakeClock(page);
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(1);
    await settled(front(page));
    await front(page).locator(".htoast-title").click();
    await expect(region(page)).toBeFocused();
    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");

    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();
    await expect(region(page)).toHaveAttribute("data-expanded");
    // Longer than a toast lasts: it's held.
    await page.clock.fastForward(4500);
    await expect(live(page)).toHaveCount(1);

    // Escape takes focus out of the toasts, and lets them go.
    await page.keyboard.press("Escape");
    await expect(region(page)).not.toBeFocused();
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    await page.clock.fastForward(4500);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 3000 });
  });

  test("F8 draws the focus ring on the front toast, even when it's the only one; a mouse press on it doesn't", async ({ page }) => {
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(1);
    await settled(front(page));
    await expect(front(page)).toHaveCSS("outline-style", "none");
    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();
    const ring = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.outline = "var(--harmo-focus-outline)";
      probe.style.outlineOffset = "var(--harmo-focus-outline-offset)";
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const ring = [style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset];
      probe.remove();
      return ring;
    });
    await expect(front(page)).toHaveCSS("outline-style", ring[0]!);
    await expect(front(page)).toHaveCSS("outline-width", ring[1]!);
    await expect(front(page)).toHaveCSS("outline-color", ring[2]!);
    await expect(front(page)).toHaveCSS("outline-offset", ring[3]!);

    await page.keyboard.press("Escape");
    await expect(region(page)).not.toBeFocused();
    await front(page).locator(".htoast-title").click();
    await expect(region(page)).toBeFocused();
    await expect(front(page)).toHaveCSS("outline-style", "none");
  });

  test("spread out taller than the window, the stack scrolls, kept in the window with the newest at its edge, and every toast can be reached", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 360 });
    // Held, as while the page is hidden, so none leaves meanwhile.
    await setHidden(page, true);
    for (const name of ["Success", "Error", "Warning", "Info"]) await press(page, "toast-each-status", name);
    await press(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(7);
    await expect(region(page)).not.toHaveAttribute("data-overflowing");

    await page.keyboard.press("F8");
    await expect(region(page)).toHaveAttribute("data-expanded");
    await expect(region(page)).toHaveAttribute("data-overflowing");
    for (let index = 0; index < 7; index++) await settled(live(page).nth(index));
    const [scrolled, shown] = await region(page).evaluate((node) => [node.scrollHeight, node.clientHeight]);
    expect(scrolled).toBeGreaterThan(shown! + 1);
    const [box, newest] = await boxes(region(page), front(page));
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(360);
    // The newest where it was, 24px above the bottom of the window.
    expect(newest.y + newest.height).toBeCloseTo(360 - 24, 0);

    // Scrolled all the way, the oldest shows, inside the region.
    await region(page).evaluate((node) => node.scrollBy(0, -node.scrollHeight));
    const [oldest] = await boxes(live(page).first());
    expect(oldest.y).toBeGreaterThanOrEqual(box.y);
    expect(oldest.y + oldest.height).toBeLessThanOrEqual(box.y + box.height);

    await page.keyboard.press("Escape");
    await expect(region(page)).not.toHaveAttribute("data-overflowing");
  });

  test("a toast that comes while the stack is spread out comes in from below too, rather than only fading in", async ({ page }) => {
    await setHidden(page, true);
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    await page.keyboard.press("F8");
    await expect(region(page)).toHaveAttribute("data-expanded");
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    await recordMotion(page);
    // Sent by the app, so focus stays on the region, which stays spread out.
    await press(page, "toast-default", "Save quick reply");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    const { entering } = await motion(page);
    expect(entering!.y).toBeGreaterThan(1);
    expect(entering!.opacity).toBeLessThan(1);
    await expect(region(page)).toHaveAttribute("data-expanded");
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("a tap spreads the stack out and holds it; a tap elsewhere puts it back", async ({ page }) => {
      await fakeClock(page);
      const container = await example(page, "toast-a-stack");
      await container.getByRole("button", { name: "Send three" }).click();
      await expect(live(page)).toHaveCount(3);
      for (const index of [0, 1, 2]) await settled(live(page).nth(index));
      await front(page).tap();
      await expect(region(page)).toHaveAttribute("data-expanded");
      // Longer than a toast lasts.
      await page.clock.fastForward(4000);
      await expect(live(page)).toHaveCount(3);

      await container.locator(".play-demo").tap({ position: { x: 5, y: 5 } });
      await expect(region(page)).not.toHaveAttribute("data-expanded");
      await page.clock.fastForward(3000);
      await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 5000 });
    });
  });

  test("while the page is hidden, a toast's time is held, and goes on once it's shown again", async ({ page }) => {
    await fakeClock(page);
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(1);
    await page.clock.fastForward(1000);
    await setHidden(page, true);
    // Longer than a toast lasts.
    await page.clock.fastForward(5000);
    await expect(live(page)).toHaveCount(1);

    await setHidden(page, false);
    await page.clock.fastForward(3500);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 3000 });
  });

  test("past three back, collapsed, a toast is hidden; spread out, it shows", async ({ page }) => {
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(4);
    await page.mouse.move(5, 5);
    const oldest = live(page).first();
    await expect(oldest).toHaveAttribute("data-beyond");
    await expect(oldest).toHaveCSS("opacity", "0");
    await expect(live(page).nth(1)).not.toHaveAttribute("data-beyond");
    await expect(live(page).nth(1)).toHaveCSS("opacity", "1");

    await page.keyboard.press("F8");
    await expect(region(page)).toHaveAttribute("data-expanded");
    await expect(oldest).toHaveCSS("opacity", "1");
  });

  test("F8 moves focus to the toasts and holds them; Tab reaches the action, which works; Escape goes back", async ({ page }) => {
    const container = await example(page, "toast-with-an-action");
    const button = container.getByRole("button", { name: "Archive conversation" });
    await button.click();
    await expect(live(page)).toHaveCount(1);
    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();
    await expect(region(page)).toHaveAttribute("data-expanded");
    await page.keyboard.press("Tab");
    const action = live(page).getByRole("button", { name: "Undo" });
    await expect(action).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    await expect(region(page)).not.toHaveAttribute("data-expanded");

    // Twice: the second press doesn't forget where focus came from.
    await page.keyboard.press("F8");
    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();

    // The action sends its toast out; it can't run again as it leaves, and
    // focus goes back.
    await page.keyboard.press("F8");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(live(page)).toHaveCount(0);
    expect(await page.locator(".htoast[data-removed]").evaluate((node) => (node as HTMLElement).inert)).toBe(true);
    await expect(button).toBeFocused();
  });

  test("with focus on the region itself, when the last toast leaves, focus goes back where it was before F8", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    const container = await example(page, "toast-with-an-action");
    const button = container.getByRole("button", { name: "Archive conversation" });
    await button.click();
    await expect(live(page)).toHaveCount(2);
    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();

    // An action sends its toast out, with another left: focus moves to the
    // region.
    await page.keyboard.press("Tab");
    await expect(live(page).getByRole("button", { name: "Try again" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(live(page)).toHaveCount(1);
    await expect(region(page)).toBeFocused();

    // The app sends the last one out, without moving focus first.
    await live(page).getByRole("button", { name: "Undo" }).evaluate((node) => (node as HTMLElement).click());
    await expect(live(page)).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("when the window narrows, a toast kept open is measured again, and fits, its action moving under its text rather than squeezing it", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect(live(page)).toHaveCount(1);
    await settled(live(page).first());
    const parts = () => {
      const body = front(page).locator(".htoast-body:not([data-leaving])");
      return boxes(body, body.locator(".htoast-content"), body.getByRole("button", { name: "Try again" }));
    };
    const [, wideContent, wideAction] = await parts();
    expect(wideAction.y).toBeLessThan(wideContent.y + wideContent.height);

    await page.setViewportSize({ width: 300, height: 700 });
    // Once it's measured again, and has changed to that size.
    await expect.poll(async () => (await boxes(front(page)))[0].width).toBeLessThanOrEqual(300 - 32 + 1);
    await settled(front(page));
    expect(await overflowing(page)).toEqual([]);
    const [box] = await boxes(front(page));
    expect(box.width).toBeLessThanOrEqual(300 - 32 + 1);
    expect(box.x).toBeGreaterThanOrEqual(15);
    const [body, content, action] = await parts();
    expect(action.y).toBeGreaterThanOrEqual(content.y + content.height - 0.5);
    // At the end: 16px in from the content's edge.
    expect(action.x + action.width).toBeCloseTo(body.x + body.width - 16, 0);
    // The text takes the rest of the row beside the icon, at least 12em.
    expect(content.width).toBeGreaterThanOrEqual(12 * 14 - 0.5);
  });

  test("on a right-to-left page, a changed toast's old content fades out over the middle of it", async ({ page }) => {
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    const old = page.locator(".htoast-body[data-leaving]");
    await expect(old).toHaveCount(1);
    await settled(live(page).first());
    const [toast, leaving] = await boxes(live(page).first(), old);
    // Within a pixel and a half: misplaced, it was off by a toast's width.
    expect(Math.abs(leaving.x + leaving.width / 2 - (toast.x + toast.width / 2))).toBeLessThanOrEqual(1.5);
  });

  test("changed while one of its buttons has focus, focus stays with the toasts", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect(live(page)).toHaveCount(1);
    await page.keyboard.press("F8");
    await page.keyboard.press("Tab");
    await expect(live(page).getByRole("button", { name: "Try again" })).toBeFocused();
    // Changed by the app, not by the person, so focus doesn't move first.
    const container = await example(page, "toast-kept-open-then-changed");
    await container.getByRole("button", { name: "Reconnect" }).evaluate((button) => (button as HTMLElement).click());
    await expect(region(page)).toBeFocused();
    await expect(region(page)).toHaveAttribute("data-expanded");
  });

  test("its exit lasts as long as the tokens say, before it goes", async ({ page }) => {
    await page.addStyleTag({ content: ":root { --harmo-toast-duration: 1s; }" });
    await send(page, "toast-with-an-action", "Archive conversation");
    await settled(front(page));
    // How long a toast stays once one starts to leave, as the page times it,
    // so a busy machine can't make a late check miss it.
    await page.evaluate(() => {
      const exit: { start?: number; stayed?: number } = {};
      (window as unknown as { exit: typeof exit }).exit = exit;
      new MutationObserver(() => {
        if (exit.start === undefined && document.querySelector(".htoast[data-removed]")) exit.start = performance.now();
        if (exit.start !== undefined && exit.stayed === undefined && !document.querySelector(".htoast")) {
          exit.stayed = performance.now() - exit.start;
        }
      }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-removed"] });
    });
    await live(page).getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 2800 });
    expect(await page.evaluate(() => (window as unknown as { exit: { stayed?: number } }).exit.stayed)).toBeGreaterThan(800);
  });

  test("what a changed toast showed fades out in --htoast-leave-duration, and one further back sinks in 1.25 times the toast's duration, so --harmo-toast-duration: 0ms turns both off", async ({ page }) => {
    await page.evaluate(() => {
      const seen: string[] = [];
      new MutationObserver((records) => {
        for (const { target } of records) {
          const node = target as HTMLElement;
          if (node.hasAttribute("data-leaving")) seen.push(getComputedStyle(node).animationDuration);
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-leaving"] });
      (window as unknown as { leaving: string[] }).leaving = seen;
    });
    const leaving = () => page.evaluate(() => (window as unknown as { leaving: string[] }).leaving);
    // How long one further back takes to sink, were it leaving now.
    const sinking = () =>
      live(page)
        .first()
        .evaluate((node) => {
          node.setAttribute("data-removed", "");
          const [transform] = getComputedStyle(node).transitionDuration.split(",");
          node.removeAttribute("data-removed");
          return transform!.trim();
        });
    // Held, as while the page is hidden, so none leaves meanwhile.
    await setHidden(page, true);
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect.poll(leaving).toEqual(["0.25s"]);
    await send(page, "toast-default", "Save quick reply");
    await expect(live(page)).toHaveCount(2);
    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    expect(await sinking()).toBe("0.5s");

    await page.addStyleTag({ content: ":root { --harmo-toast-duration: 0ms; }" });
    expect(await sinking()).toBe("0s");
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect.poll(leaving).toEqual(["0.25s", "0s"]);
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
  });

  test("pressing an action closes its toast, after the action's own handler, unless that calls preventDefault()", async ({ page }) => {
    await send(page, "toast-with-an-action", "Archive conversation");
    await expect(live(page)).toHaveCount(1);
    await settled(front(page));
    // A listener that runs before the toast's own, as the action's handler
    // would, and keeps it.
    await page.evaluate(() =>
      document.addEventListener(
        "click",
        (event) => {
          if ((event.target as Element).closest(".htoast .hbutton")) event.preventDefault();
        },
        { capture: true, once: true },
      ),
    );
    const undo = front(page).getByRole("button", { name: "Undo" });
    await undo.click();
    await rendered(page);
    await expect(live(page)).toHaveCount(1);

    await undo.click();
    await expect(live(page)).toHaveCount(0);
  });

  test("10px 16px of padding and 10px gaps, a 20px icon, and its action fills on hover, and a step more pressed, as in a Banner, with its border kept", async ({ page }) => {
    await send(page, "toast-with-an-action", "Archive conversation");
    await settled(front(page));
    const body = front(page).locator(".htoast-body:not([data-leaving])");
    await expect(body).toHaveCSS("padding-top", "10px");
    await expect(body).toHaveCSS("padding-left", "16px");
    await expect(body).toHaveCSS("column-gap", "10px");
    await expect(body.locator(".htoast-icon")).toHaveCSS("width", "20px");
    await expect(body.locator(".htoast-icon")).toHaveCSS("height", "20px");

    const action = body.getByRole("button", { name: "Undo" });
    const border = await computed(page, "var(--harmo-button-secondary-color-border)");
    await action.hover();
    await expect(action).toHaveCSS("background-color", await computed(page, "var(--harmo-color-background-hover)"));
    await settled(action);
    await expect(action).toHaveCSS("border-top-color", border);
    await page.mouse.down();
    await expect(action).toHaveCSS("background-color", await computed(page, "var(--harmo-color-background-active)"));
    await settled(action);
    await expect(action).toHaveCSS("border-top-color", border);
    // Let go elsewhere, so it isn't pressed.
    await page.mouse.move(5, 5);
    await page.mouse.up();
  });

  test("moved into a drawer partway through changing, its old content's fade carries on rather than starting again", async ({ page }) => {
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    const old = page.locator(".htoast-body[data-leaving]");
    await expect(old).toHaveCount(1);
    const fadeOf = (body: Locator) =>
      body.evaluate((node) => {
        const animations = node.getAnimations();
        const fade = animations.find((animation) => (animation as CSSAnimation).animationName === "htoast-leave");
        return [(fade?.effect?.getComputedTiming().progress ?? 0) * 100_000, animations.length - 1];
      });
    // Once its fade has played 0.6 seconds.
    await expect.poll(async () => (await fadeOf(old))[0]).toBeGreaterThan(600);
    const container = await example(page, "toast-over-a-drawer");
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => region(page).evaluate((node) => !!node.closest("dialog"))).toBe(true);
    // How far through its 100 seconds the fade is: begun again, it would be
    // a few frames in; carried on, past the 0.6 seconds it had played.
    const [played, others] = await fadeOf(old);
    expect(played).toBeGreaterThan(500);
    // And nothing else, such as the content's way in, plays over it.
    expect(others).toBe(0);
  });

  test("a changed toast's old content, once gone, doesn't come back when the toasts move into a drawer", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
    const container = await example(page, "toast-over-a-drawer");
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => region(page).evaluate((node) => !!node.closest("dialog"))).toBe(true);
    // Once what the move starts has happened.
    await rendered(page);
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
    await expect(live(page)).toHaveCount(1);
  });

  test("with its fade turned off by a stylesheet, a changed toast's old content still goes", async ({ page }) => {
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation: none !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(live(page).locator(".htoast-body:not([data-leaving]) .htoast-title")).toHaveText("Back online");
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
  });

  test("changed twice in a moment, what it showed each time fades out on its own, at the width it had", async ({ page }) => {
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await settled(front(page));
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await send(page, "toast-kept-open-then-changed", "Go offline");
    const old = page.locator(".htoast-body[data-leaving]");
    await expect(old).toHaveCount(2);
    await expect(old.locator(".htoast-title")).toHaveText(["You're offline", "Back online"]);
    expect(await old.evaluateAll((bodies) => bodies.map((body) => (body as HTMLElement).style.inlineSize !== ""))).toEqual([
      true,
      true,
    ]);
  });

  test("when its text takes more room while it shows, such as with wider text spacing, it's measured again, and fits", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect(live(page)).toHaveCount(1);
    const toast = live(page).first();
    await settled(toast);
    const width = () => toast.evaluate((node) => parseFloat((node as HTMLElement).style.getPropertyValue("--htoast-width")));
    const before = await width();
    // WCAG's text spacing, as a reader's own stylesheet sets it.
    await page.addStyleTag({ content: ".htoast-content { line-height: 1.5; letter-spacing: 0.12em; word-spacing: 0.16em; }" });
    await expect.poll(width).toBeGreaterThan(before);
    await settled(toast);
    expect(await overflowing(page)).toEqual([]);
  });

  test("with no time limit it stays; the same id changes it in place, and its box takes the new size", async ({ page }) => {
    await fakeClock(page);
    await send(page, "toast-kept-open-then-changed", "Go offline");
    const toast = live(page).first();
    await expect(announcer(page, "alert")).toContainText("You're offline");
    // Longer than a toast with a limit lasts.
    await page.clock.fastForward(4500);
    await expect(live(page)).toHaveCount(1);
    const before = await toast.evaluate((node) => (node as HTMLElement).offsetWidth);
    const handle = await toast.elementHandle();

    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(live(page)).toHaveCount(1);
    await expect(toast.locator(".htoast-body:not([data-leaving]) .htoast-title")).toHaveText("Back online");
    await expect(announcer(page, "status")).toContainText("Back online");
    expect(await handle!.evaluate((node) => node.isConnected && node.classList.contains("htoast"))).toBe(true);
    await settled(toast);
    const after = await toast.evaluate((node) => [
      (node as HTMLElement).offsetWidth,
      parseFloat((node as HTMLElement).style.getPropertyValue("--htoast-width")),
    ]);
    expect(after[0]).toBeLessThan(before);
    expect(after[0]).toBeCloseTo(after[1]!, 0);
    await expect(toast.locator(".htoast-body[data-leaving]")).toHaveCount(0);
    await page.clock.fastForward(4000);
    await expect(page.locator(".htoast")).toHaveCount(0);
  });

  test("over an open drawer, a toast moves inside it, where it can be used; as the drawer closes, it moves back out", async ({ page }) => {
    const container = await example(page, "toast-over-a-drawer");
    await container.getByRole("button", { name: "New quick reply" }).click();
    const drawer = container.locator("dialog");
    await expect.poll(() => drawer.evaluate((node) => (node as HTMLDialogElement).open)).toBe(true);
    await settled(drawer);
    await drawer.getByRole("button", { name: "Save", exact: true }).click();
    const error = live(page).first();
    await expect(error).toHaveAttribute("data-status", "error");
    expect(await region(page).evaluate((node) => node.closest("dialog")?.id)).toBe("toast-reply-drawer");
    expect(await drawer.evaluate((node) => (node as HTMLDialogElement).open)).toBe(true);
    await settled(error);
    // Hit where it shows: the toast, not the drawer or what's behind it.
    const [box] = await boxes(error);
    expect(
      await page.evaluate(([x, y]) => !!document.elementFromPoint(x!, y!)?.closest(".htoast"), [box.x + box.width / 2, box.y + box.height / 2]),
    ).toBe(true);

    await drawer.getByLabel("Shortcut").fill("/shipped");
    // A slower change of shape, so the drawer closes, and the toasts move,
    // early in it.
    await page.addStyleTag({ content: ":root { --harmo-toast-morph-duration: 1.5s; }" });
    const before = await error.evaluate((node) => (node as HTMLElement).offsetWidth);
    // Where the region is when the new toast is announced: inside the drawer
    // while it's still modal, since outside it would be inert and unread.
    await page.evaluate(() => {
      const announcer = document.querySelector('.htoaster-announce[role="status"]')!;
      new MutationObserver(() => {
        const open = document.querySelector("dialog:modal");
        (window as unknown as { heard: boolean[] }).heard ??= [];
        (window as unknown as { heard: boolean[] }).heard.push(!open || open.contains(announcer));
      }).observe(announcer, { childList: true });
    });
    await drawer.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => region(page).evaluate((node) => !!node.closest("dialog"))).toBe(false);
    // Moved out as the new one came in front, it changes shape into it from
    // where it was, rather than jumping: held 150ms in, it's partway.
    const partway = await error.evaluate((node) => {
      const running = node.getAnimations();
      for (const animation of running) {
        animation.pause();
        animation.currentTime = 150;
      }
      const width = parseFloat(getComputedStyle(node).width);
      for (const animation of running) animation.play();
      return width;
    });
    await settled(error);
    const after = await error.evaluate((node) => (node as HTMLElement).offsetWidth);
    expect(after).not.toBe(before);
    expect(partway).toBeGreaterThan(Math.min(before, after) + 1);
    expect(partway).toBeLessThan(Math.max(before, after) - 1);
    await expect.poll(() => drawer.evaluate((node) => (node as HTMLDialogElement).open)).toBe(false);
    expect(await region(page).evaluate((node) => !!node.closest("dialog"))).toBe(false);
    expect(await region(page).evaluate((node) => node.matches(":popover-open"))).toBe(true);
    await expect(front(page).locator(".htoast-title")).toHaveText("Quick reply saved");
    await expect.poll(() => page.evaluate(() => (window as unknown as { heard?: boolean[] }).heard?.length ?? 0)).toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { heard: boolean[] }).heard.every(Boolean))).toBe(true);
    await settled(front(page));
    const [saved] = await boxes(front(page));
    expect(saved.y + saved.height).toBeCloseTo(page.viewportSize()!.height - 24, 0);
  });

  test("at the top start: 24px in from the top and the start; it comes in from above, and the stack goes down", async ({ page }) => {
    await page.mouse.move(5, 700);
    await recordMotion(page);
    await send(page, "toast-positions", "Top start");
    await expect(region(page)).toHaveAttribute("data-position", "top-start");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    expect((await motion(page)).entering!.y).toBeLessThan(-1);
    await send(page, "toast-positions", "Top start");
    await page.mouse.move(5, 700);
    await expect(live(page)).toHaveCount(2);
    for (const index of [0, 1]) await settled(live(page).nth(index));
    // At the top, the newest comes first in the page.
    const [newest, older] = await boxes(front(page), live(page).nth(1));
    expect(newest.x).toBeCloseTo(24, 0);
    expect(newest.y).toBeCloseTo(24, 0);
    expect(older.y + older.height).toBeGreaterThan(newest.y + newest.height);
  });

  test("at the top, the newest comes first in the page, as on screen, and the front one still covers the others; back at the bottom, the oldest comes first again", async ({ page }) => {
    await page.mouse.move(5, 700);
    // Held, as while the page is hidden, so none leaves meanwhile.
    await setHidden(page, true);
    for (const button of ["Top start", "Top center", "Top end"]) await send(page, "toast-positions", button);
    await page.mouse.move(5, 700);
    await expect(live(page)).toHaveCount(3);
    await expect(live(page).locator(".htoast-title")).toHaveText([
      "Shown at the top end",
      "Shown at the top center",
      "Shown at the top start",
    ]);
    await expect(live(page).first()).toHaveAttribute("data-front");
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    // Collapsed, where all three overlap, the front one is what's there.
    const [box] = await boxes(front(page));
    expect(
      await page.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.closest(".htoast")?.hasAttribute("data-front"),
        [box.x + box.width / 2, box.y + box.height / 2],
      ),
    ).toBe(true);

    // Spread out, the page's order runs down the screen.
    await page.keyboard.press("F8");
    await expect(region(page)).toHaveAttribute("data-expanded");
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    const tops = await live(page).evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    await page.keyboard.press("Escape");

    await send(page, "toast-positions", "Bottom center");
    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-position");
    await expect(live(page).locator(".htoast-title")).toHaveText([
      "Shown at the top start",
      "Shown at the top center",
      "Shown at the top end",
      "Shown at the bottom center",
    ]);
    await expect(live(page).last()).toHaveAttribute("data-front");
  });

  test("at the top center, and at the bottom end", async ({ page }) => {
    await page.mouse.move(5, 400);
    await send(page, "toast-positions", "Top center");
    await settled(front(page));
    const { width, height } = page.viewportSize()!;
    const [top] = await boxes(front(page));
    expect(top.y).toBeCloseTo(24, 0);
    expect(top.x + top.width / 2).toBeCloseTo(width / 2, 0);

    await send(page, "toast-positions", "Bottom end");
    await page.mouse.move(5, 400);
    await expect(region(page)).toHaveAttribute("data-position", "bottom-end");
    await settled(front(page));
    const [corner] = await boxes(front(page));
    expect(corner.x + corner.width).toBeCloseTo(width - 24, 0);
    expect(corner.y + corner.height).toBeCloseTo(height - 24, 0);
  });

  test("with reduced motion, it fades in and out where it is, without sliding", async ({ page }) => {
    await fakeClock(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await recordMotion(page);
    await send(page, "toast-default", "Save quick reply");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    const { entering } = await motion(page);
    expect(entering!.y).toBeCloseTo(0, 1);
    expect(entering!.opacity).toBeLessThan(1);
    await page.clock.fastForward(3800);
    await expect.poll(async () => (await motion(page)).leaving).toBeTruthy();
    const { leaving } = await motion(page);
    expect(leaving!.y).toBeCloseTo(0, 1);
    expect(leaving!.opacity).toBeLessThan(1);
  });

  test.describe("at a fractional scale", () => {
    test.use({ deviceScaleFactor: 1.5 });

    test("no toast's text wraps more than its box was measured for", async ({ page }) => {
      for (const name of ["Success", "Error", "Warning", "Info"]) {
        await send(page, "toast-each-status", name);
        await rendered(page);
      }
      await send(page, "toast-default", "Save quick reply");
      await send(page, "toast-with-an-action", "Archive conversation");
      // Once each has changed to the size it was measured for.
      for (const toast of await live(page).all()) await settled(toast);
      expect(await overflowing(page)).toEqual([]);
    });
  });
});
