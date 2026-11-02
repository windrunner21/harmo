import { expect, type Locator } from "@playwright/test";
import { boxes, clickAt, example, onEachPlayground, openPopup, rendered, settled, test } from "./playgrounds.ts";

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
    const [t, p] = await boxes(trigger, popup);
    expect(p.x + p.width).toBeCloseTo(t.x + t.width, 0);
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
    await settled(popup);
    const after = await sides(trigger, popup);
    // Its 12px slide, toward the trigger, and no other move.
    expect(after.top - before.top).toBeCloseTo(before.above ? 12 : -12, 0);
    await expect(popup).toHaveAttribute("data-side", before.above ? "top" : "bottom");
  });
});

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
