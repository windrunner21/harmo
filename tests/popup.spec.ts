import { expect, type Locator } from "@playwright/test";
import { boxes, clickAt, example, onEachPlayground, openPopup, release, rendered, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/popup.md says, on the Popup page: the browser opens
// and closes it, a script keeps aria-expanded and data-side and makes each
// opening find its place afresh, and CSS places it.
onEachPlayground("popup", () => {
  test("aria-expanded follows every way it opens and closes", async ({ page }) => {
    const container = await example(page, "popup-panel");
    const trigger = container.locator(".hfilter-chip");
    const expectOpen = async (open: boolean) => {
      await expect(openPopup(container)).toHaveCount(open ? 1 : 0);
      await expect(trigger).toHaveAttribute("aria-expanded", String(open));
    };

    // Its trigger.
    await trigger.click();
    await expectOpen(true);
    await trigger.click();
    await expectOpen(false);

    // Escape, from inside, which also returns focus to the trigger.
    await trigger.click();
    await clickAt(page, container.getByLabel("Name contains"));
    await page.keyboard.press("Escape");
    await expectOpen(false);
    await expect(trigger).toBeFocused();

    // A click outside.
    await trigger.click();
    await expectOpen(true);
    await container.locator(".play-example-title").click();
    await expectOpen(false);
  });

  test("it opens 8px below its trigger, aligned to its start, and at least as wide", async ({ page }) => {
    const container = await example(page, "popup-placement");
    const { trigger, popup } = await openPlacement(container);
    await expect(popup).not.toHaveAttribute("data-side", "top");
    const [t, p] = await boxes(trigger, popup);
    expect(p.y - (t.y + t.height)).toBeCloseTo(8, 0);
    expect(p.x).toBeCloseTo(t.x, 0);
    expect(p.width).toBeGreaterThanOrEqual(t.width - 0.5);
  });

  test("without room at the end, it aligns to the trigger's other edge", async ({ page }) => {
    const container = await example(page, "popup-placement");
    const trigger = container.getByRole("button", { name: "Last 30 days" });
    // Move the trigger to 24px from the window's end.
    await trigger.evaluate((element) => {
      const room = document.documentElement.clientWidth - element.getBoundingClientRect().right;
      Object.assign(element.style, { position: "relative", left: `${room - 24}px` });
    });
    const { popup } = await openPlacement(container);
    // Shown, not left at its closing opacity, as Firefox would at a fallback
    // position without its fallbacks changing once it's open.
    await expect(popup).toHaveCSS("opacity", "1");
    const [t, p] = await boxes(trigger, popup);
    expect(p.x + p.width).toBeCloseTo(t.x + t.width, 0);
  });

  test("aligned to its end, it opens 8px below its trigger, lined up with its end, and stays there as it closes", async ({ page }) => {
    const container = await example(page, "popup-aligned-to-its-end");
    const trigger = container.getByRole("button", { name: "Newest first" });
    const popup = container.locator(".hpopup");
    await expect(popup).toHaveAttribute("data-align", "end");
    await trigger.click();
    await expect(popup).toHaveCSS("opacity", "1");
    const [t, p] = await boxes(trigger, popup);
    expect(p.y - (t.y + t.height)).toBeCloseTo(8, 0);
    expect(p.x + p.width).toBeCloseTo(t.x + t.width, 0);
    expect(p.width).toBeGreaterThan(t.width);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveAttribute("data-pinned");
    const closing = await popup.boundingBox();
    expect(closing!.x + closing!.width).toBeCloseTo(t.x + t.width, 0);
  });

  test("aligned to its end, without room at the start, it aligns to the trigger's start", async ({ page }) => {
    const container = await example(page, "popup-aligned-to-its-end");
    const trigger = container.getByRole("button", { name: "Newest first" });
    // Move the trigger to 24px from the window's start.
    await trigger.evaluate((element) => {
      const room = element.getBoundingClientRect().left;
      Object.assign(element.style, { position: "relative", left: `${24 - room}px` });
    });
    const popup = container.locator(".hpopup");
    await trigger.click();
    await expect(popup).toHaveCSS("opacity", "1");
    const [t, p] = await boxes(trigger, popup);
    expect(p.x).toBeCloseTo(t.x, 0);
  });

  test("preferring the top, it opens 8px above its trigger, and below it without room above", async ({ page }) => {
    const container = await example(page, "popup-above-its-trigger");
    const trigger = container.getByRole("button", { name: "Spaces: 2" });
    const popup = container.locator(".hpopup");
    await expect(popup).toHaveAttribute("data-preferred-side", "top");
    await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await trigger.click();
    await settled(popup);
    await expect(popup).toHaveAttribute("data-side", "top");
    const [t, p] = await boxes(trigger, popup);
    expect(t.y - (p.y + p.height)).toBeCloseTo(8, 0);
    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);

    // Move the trigger to 70px from the window's top, under the playground's
    // header, where there's no room above for its three options. The page
    // ends too soon to scroll it there.
    await trigger.evaluate((element) => {
      const top = element.getBoundingClientRect().top;
      Object.assign(element.style, { position: "relative", top: `${70 - top}px` });
    });
    // Where it's drawn: Playwright's click in Firefox would scroll it back to
    // the middle of the window first, where there's room above.
    await clickAt(page, trigger);
    await settled(popup);
    await expect(popup).not.toHaveAttribute("data-side", "top");
    const [below, opened] = await boxes(trigger, popup);
    expect(opened.y - (below.y + below.height)).toBeCloseTo(8, 0);
  });

  test("without room below, it opens above", async ({ page }) => {
    const container = page.locator('[id="popup-placement"]');
    const trigger = container.getByRole("button", { name: "Last 30 days" });
    await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
    const { popup } = await openPlacement(container);
    await expect(popup).toHaveAttribute("data-side", "top");
    const [t, p] = await boxes(trigger, popup);
    expect(t.y - (p.y + p.height)).toBeCloseTo(8, 0);
  });

  test("once there's room below again, it opens below", async ({ page }) => {
    // A browser keeps the last position that fit, so each opening must start
    // afresh. Here the closed popup sits where only above fits, long enough
    // for the browser to record it, and then the page scrolls.
    const container = page.locator('[id="popup-placement"]');
    const trigger = container.getByRole("button", { name: "Last 30 days" });
    await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
    await rendered(page);
    await example(page, "popup-placement");
    const { popup } = await openPlacement(container);
    await expect(popup).not.toHaveAttribute("data-side", "top");
    const [t, p] = await boxes(trigger, popup);
    expect(p.y).toBeGreaterThan(t.y);
  });

  test("squeezed while closed, it still opens on the side its whole height fits", async ({ page }) => {
    const container = page.locator('[id="popup-placement"]');
    const trigger = container.getByRole("button", { name: "Last 30 days" });
    const popup = container.locator(".hpopup");
    // A window too short for it on either side: the closed popup shrinks to
    // fit below, long enough for the browser to record that.
    await page.setViewportSize({ width: 1280, height: 220 });
    await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await rendered(page);

    // Back to a full window, with room below for the shrunk popup but not
    // the whole one, which must open above, and slide from there.
    await page.setViewportSize({ width: 1280, height: 720 });
    await trigger.evaluate((element) => {
      element.scrollIntoView({ block: "end" });
      scrollBy(0, 110);
    });
    await rendered(page);
    await openPlacement(container);
    const [t, p] = await boxes(trigger, popup);
    expect(p.y + p.height, "the popup's bottom").toBeLessThanOrEqual(t.y);
    await expect(popup).toHaveAttribute("data-side", "top");
  });

  test("closing leaves it where it is, and slides it back toward its trigger", async ({ page }) => {
    const container = await example(page, "popup-placement");
    const trigger = container.getByRole("button", { name: "Last 30 days" });
    const { popup } = await openPlacement(container);

    // Scrolled to where only above fits and back, an open popup may stay
    // above: browsers keep the last position that fit, while it fits.
    await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
    await expect.poll(async () => (await sides(trigger, popup)).above).toBe(true);
    await example(page, "popup-placement");
    await rendered(page);
    const before = await sides(trigger, popup);

    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);
    // At the end of its closing slide, while it's still laid out for its
    // fade: once that ends, a closed popup isn't laid out.
    await popup.evaluate((node) => {
      for (const animation of node.getAnimations()) {
        animation.pause();
        animation.currentTime = Number(animation.effect?.getComputedTiming().endTime ?? 1) - 1;
      }
    });
    const after = await sides(trigger, popup);
    // Its 12px slide, toward the trigger, and no other move.
    expect(after.top - before.top).toBeCloseTo(before.above ? 12 : -12, 0);
    await expect(popup).toHaveAttribute("data-side", before.above ? "top" : "bottom");
  });

  test("closed as it slides in, it fades from where it is, without a jump", async ({ page }) => {
    const container = await example(page, "popup-placement");
    const popup = container.locator(".hpopup");
    await slowOpening(popup);
    await container.getByRole("button", { name: "Last 30 days" }).click();
    await expect(openPopup(container)).toHaveCount(1);
    await rendered(page);
    expect(Math.abs((await motionOf(popup)).slide), "still sliding").toBeGreaterThan(6);

    const [before, after] = await popup.evaluate((node) => {
      const before = node.getBoundingClientRect().top;
      (node as HTMLElement).hidePopover();
      return [before, node.getBoundingClientRect().top];
    });
    expect(after).toBeCloseTo(before, 0);
    await release(popup);
  });

  test("it slides 12px away from its trigger and fades in, in 200ms, and fades out in 150ms", async ({ page }) => {
    const container = await example(page, "popup-placement");
    const popup = container.locator(".hpopup");
    await slowOpening(popup);
    await container.getByRole("button", { name: "Last 30 days" }).click();
    await expect(openPopup(container)).toHaveCount(1);
    await expect(popup).not.toHaveAttribute("data-side", "top");
    // Below its trigger, it starts 12px up, toward it.
    const opening = await motionOf(popup);
    expect(opening.slide).toBeCloseTo(-12, 0);
    expect(opening.opacity).toBeLessThan(0.5);
    await release(popup);
    await popup.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    await settled(popup);
    expect((await motionOf(popup)).slide).toBe(0);
    expect(await durationOf(popup, "opacity")).toBe("0.2s");

    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);
    expect(await durationOf(popup, "opacity")).toBe("0.15s");
  });

  test("with reduced motion, it fades without sliding", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const container = await example(page, "popup-placement");
    const popup = container.locator(".hpopup");
    await slowDown(popup);
    await container.getByRole("button", { name: "Last 30 days" }).click();
    await expect(openPopup(container)).toHaveCount(1);
    const { slide, opacity } = await motionOf(popup);
    expect(slide).toBeCloseTo(0, 1);
    expect(opacity).toBeLessThan(0.5);
    await release(popup);
  });

  test("closed and opened again at once, with focus inside, it leaves focus there", async ({ page }) => {
    const container = await example(page, "popup-panel");
    const input = container.getByLabel("Name contains");
    await container.locator(".hfilter-chip").click();
    await clickAt(page, input);
    await expect(input).toBeFocused();

    // Focused again as it opens, as a list's search is; then after every
    // listener has run.
    await container.locator(".hpopup").evaluate(
      (node) =>
        new Promise<void>((resolve) => {
          const field = node.querySelector("input")!;
          node.addEventListener("toggle", (event) => {
            if ((event as ToggleEvent).newState !== "open") return;
            field.focus();
            setTimeout(resolve);
          });
          (node as HTMLElement).hidePopover();
          (node as HTMLElement).showPopover();
        }),
    );
    await expect(input).toBeFocused();
  });
});

// How far a popup is moved by its slide, and how opaque it is, as things are.
// Slows a popup's opening below its trigger. Its side is set first: a script that
// finds the side changed resets the transition, which would undo the slowing.
const slowOpening = async (popup: Locator) => {
  await popup.evaluate((node) => ((node as HTMLElement).dataset.side = "bottom"));
  await slowDown(popup);
};

const motionOf = (popup: Locator) =>
  popup.evaluate((node) => {
    const { transform, opacity } = getComputedStyle(node);
    return { slide: new DOMMatrixReadOnly(transform === "none" ? undefined : transform).m42, opacity: Number(opacity) };
  });

// How long a popup's transition of `property` takes, as things are.
const durationOf = (popup: Locator, property: string) =>
  popup.evaluate((node, property) => {
    const style = getComputedStyle(node);
    const properties = style.transitionProperty.split(", ");
    const durations = style.transitionDuration.split(", ");
    return durations[properties.indexOf(property) % durations.length];
  }, property);

// Opens the Placement example's popup, and waits for it to settle.
const openPlacement = async (container: Locator) => {
  const trigger = container.getByRole("button", { name: "Last 30 days" });
  const popup = container.locator(".hpopup");
  await trigger.click();
  await expect(openPopup(container)).toHaveCount(1);
  await settled(popup);
  return { trigger, popup };
};

// Where a popup is, open or closed (a closed one stays rendered, hidden):
// its top, and whether it's above its trigger.
const sides = async (trigger: Locator, popup: Locator) => {
  const [t, p] = await Promise.all([trigger, popup].map((element) => element.evaluate((node) => node.getBoundingClientRect().toJSON())));
  return { top: p.top as number, above: (p.bottom as number) <= (t.top as number) };
};
