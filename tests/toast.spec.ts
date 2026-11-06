import { expect, type Locator, type Page } from "@playwright/test";
import { axe } from "./axe.ts";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/toast.md says, on the Toast page: a toast comes in at
// the bottom center, above everything, and leaves after 4 seconds; toasts
// stack and leave one at a time; hover, a tap, or F8 spreads them out and
// holds them; the same id changes a toast in place; over an open Drawer,
// toasts move inside it, where they can be used.
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
const announcer = (page: Page, role: "status" | "alert") => page.locator(`.htoaster-announce[role="${role}"]`);

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

  test("with toasts showing, one with an action and one changed in place, axe finds nothing wrong in the region", async ({ page }) => {
    await page.addScriptTag({ path: axe });
    await send(page, "toast-with-an-action", "Schedule a campaign run");
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await page.waitForTimeout(300);
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(1);
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as { axe: typeof import("axe-core") };
      // Its structure, names, and roles: not contrast, since toasts that are
      // fading in or out are faint on purpose; pages.spec.ts checks contrast
      // with nothing moving.
      const { violations } = await axe.run(document.querySelector(".htoaster")!, {
        resultTypes: ["violations"],
        preload: false,
        rules: { "color-contrast": { enabled: false } },
      });
      return violations.map(({ id, nodes }) => `${id}: ${nodes.length}`);
    });
    expect(violations).toEqual([]);
  });

  test("it comes in from below, fading in, and after 4 seconds slides back down, fading out, and goes", async ({ page }) => {
    await watchExits(page);
    await recordMotion(page);
    await send(page, "toast-default", "Save quick reply");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    const { entering } = await motion(page);
    expect(entering!.y).toBeGreaterThan(1);
    expect(entering!.opacity).toBeLessThan(1);
    await page.waitForTimeout(3500);
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
    await watchExits(page);
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    await page.waitForTimeout(900);
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

    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 8000 });
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
    await send(page, "toast-each-status", "Info");
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    await send(page, "toast-each-status", "Warning");
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    await send(page, "toast-each-status", "Success");
    await page.mouse.move(5, 5);
    expect(await drift).toBeLessThan(0.5);
  });

  test("hovered, the stack spreads out, each toast at its own size, and none leaves until the pointer does", async ({ page, isMobile }) => {
    test.skip(isMobile, "a tap spreads it on touch");
    await send(page, "toast-a-stack", "Send three");
    await expect(live(page)).toHaveCount(3);
    await page.waitForTimeout(900);
    const [box] = await boxes(front(page));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(region(page)).toHaveAttribute("data-expanded");
    for (const index of [0, 1, 2]) await settled(live(page).nth(index));
    const [newest, middle, oldest] = await boxes(live(page).nth(2), live(page).nth(1), live(page).nth(0));
    expect(middle.y + middle.height).toBeLessThanOrEqual(newest.y - 11);
    expect(oldest.y + oldest.height).toBeLessThanOrEqual(middle.y - 11);
    expect(middle.width).toBeGreaterThan(newest.width);

    // Moving up the list, over the gaps, keeps it spread out.
    await page.mouse.move(oldest.x + oldest.width / 2, oldest.y + oldest.height / 2, { steps: 8 });
    await page.waitForTimeout(4000);
    await expect(live(page)).toHaveCount(3);
    await expect(region(page)).toHaveAttribute("data-expanded");

    await page.mouse.move(5, 5);
    await expect(region(page)).not.toHaveAttribute("data-expanded");
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 7000 });
  });

  test("F8 moves focus to the toasts and holds them; Tab reaches the action, which works; Escape goes back", async ({ page }) => {
    const container = await example(page, "toast-with-an-action");
    const button = container.getByRole("button", { name: "Schedule a campaign run" });
    await button.click();
    await expect(live(page)).toHaveCount(1);
    await page.keyboard.press("F8");
    await expect(region(page)).toBeFocused();
    await expect(region(page)).toHaveAttribute("data-expanded");
    await page.keyboard.press("Tab");
    const action = live(page).getByRole("button", { name: "View run" });
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

  test("when the window narrows, a toast kept open is measured again, and fits", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await expect(live(page)).toHaveCount(1);
    await settled(live(page).first());
    await page.setViewportSize({ width: 300, height: 700 });
    await page.waitForTimeout(700);
    expect(await overflowing(page)).toEqual([]);
    const [box] = await boxes(front(page));
    expect(box.width).toBeLessThanOrEqual(300 - 32 + 1);
    expect(box.x).toBeGreaterThanOrEqual(15);
  });

  test("on a right-to-left page, a changed toast's old content fades out over the middle of it", async ({ page }) => {
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await page.waitForTimeout(500);
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
    await send(page, "toast-with-an-action", "Schedule a campaign run");
    await live(page).getByRole("button", { name: "View run" }).click();
    await page.waitForTimeout(800);
    await expect(page.locator(".htoast[data-removed]")).toHaveCount(1);
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 2000 });
  });

  test("moved into a drawer partway through changing, its old content's fade carries on rather than starting again", async ({ page }) => {
    await page.addStyleTag({ content: ".htoast-body[data-leaving] { animation-duration: 100s !important; }" });
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await page.waitForTimeout(400);
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    const old = page.locator(".htoast-body[data-leaving]");
    await expect(old).toHaveCount(1);
    await page.waitForTimeout(600);
    const container = await example(page, "toast-over-a-drawer");
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => region(page).evaluate((node) => !!node.closest("dialog"))).toBe(true);
    // How far through its 100 seconds the fade is: begun again, it would be
    // a few frames in; carried on, past the 0.6 seconds it had played.
    const [played, others] = await old.evaluate((node) => {
      const animations = node.getAnimations();
      const fade = animations.find((animation) => (animation as CSSAnimation).animationName === "htoast-leave");
      return [(fade?.effect?.getComputedTiming().progress ?? 0) * 100_000, animations.length - 1];
    });
    expect(played).toBeGreaterThan(500);
    // And nothing else, such as the content's way in, plays over it.
    expect(others).toBe(0);
  });

  test("a changed toast's old content, once gone, doesn't come back when the toasts move into a drawer", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    await page.waitForTimeout(500);
    await send(page, "toast-kept-open-then-changed", "Reconnect");
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
    const container = await example(page, "toast-over-a-drawer");
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => region(page).evaluate((node) => !!node.closest("dialog"))).toBe(true);
    await page.waitForTimeout(100);
    await expect(page.locator(".htoast-body[data-leaving]")).toHaveCount(0);
    await expect(live(page)).toHaveCount(1);
  });

  test("with no time limit it stays; the same id changes it in place, and its box takes the new size", async ({ page }) => {
    await send(page, "toast-kept-open-then-changed", "Go offline");
    const toast = live(page).first();
    await expect(announcer(page, "alert")).toContainText("You're offline");
    await page.waitForTimeout(4500);
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
    await expect(page.locator(".htoast")).toHaveCount(0, { timeout: 4000 });
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
    const [newest, older] = await boxes(front(page), live(page).nth(0));
    expect(newest.x).toBeCloseTo(24, 0);
    expect(newest.y).toBeCloseTo(24, 0);
    expect(older.y + older.height).toBeGreaterThan(newest.y + newest.height);
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
    await page.emulateMedia({ reducedMotion: "reduce" });
    await recordMotion(page);
    await send(page, "toast-default", "Save quick reply");
    await expect.poll(async () => (await motion(page)).entering).toBeTruthy();
    const { entering } = await motion(page);
    expect(entering!.y).toBeCloseTo(0, 1);
    expect(entering!.opacity).toBeLessThan(1);
    await expect.poll(async () => (await motion(page)).leaving, { timeout: 6000 }).toBeTruthy();
    const { leaving } = await motion(page);
    expect(leaving!.y).toBeCloseTo(0, 1);
    expect(leaving!.opacity).toBeLessThan(1);
  });

  test.describe("at a fractional scale", () => {
    test.use({ deviceScaleFactor: 1.5 });

    test("no toast's text wraps more than its box was measured for", async ({ page }) => {
      for (const name of ["Success", "Error", "Warning", "Info"]) {
        await send(page, "toast-each-status", name);
        await page.waitForTimeout(100);
      }
      await send(page, "toast-default", "Save quick reply");
      await send(page, "toast-with-an-action", "Schedule a campaign run");
      await page.waitForTimeout(600);
      expect(await overflowing(page)).toEqual([]);
    });
  });
});
