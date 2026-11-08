import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/accordion.md says, on the Accordion page: each item is
// a <details> that opens and closes with no script; items that share a name
// open one at a time; the content grows as it opens and shrinks as it closes,
// with the chevron folding; and a closed item is only its summary.
// In the demo: each example's code panel below it is an Accordion item too.
const items = async (page: Page, id: string) => (await example(page, id)).locator(".play-demo .haccordion-item");
const isOpen = (item: Locator) => item.evaluate((node) => (node as HTMLDetailsElement).open);
const height = (element: Locator) => element.evaluate((node) => node.getBoundingClientRect().height);
// An open item's height once its content has grown: its summary and all of
// its content.
const natural = (item: Locator) =>
  item.evaluate((node) => {
    const summary = node.querySelector("summary") as HTMLElement;
    const content = node.querySelector(".haccordion-content") as HTMLElement;
    return summary.getBoundingClientRect().height + content.scrollHeight;
  });

// Makes the content's transitions last 4 seconds, so a check sees them
// partway on any machine.
const slowDown = (page: Page) =>
  page.addStyleTag({ content: ".haccordion-item::details-content { transition-duration: 4s !important; }" });

onEachPlayground("accordion", () => {
  test("items that share a name open one at a time, by a click, Enter, or Space", async ({ page }) => {
    const [first, second, third] = await (await items(page, "accordion-default")).all();
    await first.locator("summary").click();
    expect(await isOpen(first)).toBe(true);
    await second.locator("summary").click();
    expect(await isOpen(second)).toBe(true);
    expect(await isOpen(first)).toBe(false);

    await third.locator("summary").focus();
    await page.keyboard.press("Enter");
    expect(await isOpen(third)).toBe(true);
    expect(await isOpen(second)).toBe(false);
    await page.keyboard.press(" ");
    expect(await isOpen(third)).toBe(false);
  });

  test("without a name, several open at once, and open opens one from the start", async ({ page }) => {
    const [customer, tickets, notes] = await (await items(page, "accordion-several-open-at-once")).all();
    expect(await isOpen(customer)).toBe(true);
    await tickets.locator("summary").click();
    await notes.locator("summary").click();
    expect([await isOpen(customer), await isOpen(tickets), await isOpen(notes)]).toEqual([true, true, true]);
  });

  test("a closed item is only its summary, and its content shows once it's open", async ({ page }) => {
    const [item] = await (await items(page, "accordion-default")).all();
    const summary = item.locator("summary");
    const content = item.locator(".haccordion-content");
    expect(await height(item)).toBeCloseTo(await height(summary), 0);
    await expect(content).toBeHidden();
    await summary.click();
    await expect(content).toBeVisible();
    const full = await natural(item);
    await expect.poll(() => height(item)).toBeCloseTo(full, 0);
  });

  test("the summary is named by its label, and its chevron folds up while it's open", async ({ page }) => {
    const [item] = await (await items(page, "accordion-default")).all();
    const summary = item.locator("summary");
    await expect(summary).toHaveAccessibleName("How am I billed?");
    const left = summary.locator(".hexpand-chevron-left");
    const closed = await left.evaluate((node) => getComputedStyle(node).transform);
    await summary.click();
    await expect.poll(() => left.evaluate((node) => getComputedStyle(node).transform)).not.toBe(closed);
  });

  test("the content grows as it opens, and shrinks as it closes; WebKit may close it at once", async ({ page, browserName }) => {
    const [item] = await (await items(page, "accordion-default")).all();
    const summary = item.locator("summary");
    await summary.click();
    const full = await natural(item);
    await expect.poll(() => height(item)).toBeCloseTo(full, 0);
    await summary.click();
    await expect.poll(() => isOpen(item)).toBe(false);
    const closed = await height(summary);
    await expect.poll(() => height(item)).toBeCloseTo(closed, 0);

    await slowDown(page);
    await summary.click();
    await page.waitForTimeout(600);
    const opening = await height(item);
    expect(opening).toBeGreaterThan(closed + 1);
    expect(opening).toBeLessThan(full - 1);

    await expect.poll(() => height(item), { timeout: 8000 }).toBeCloseTo(full, 0);
    await summary.click();
    await page.waitForTimeout(600);
    const closing = await height(item);
    expect(closing).toBeLessThan(full - 1);
    if (browserName !== "webkit") expect(closing).toBeGreaterThan(closed + 1);
  });

  test("with reduced motion, it opens and closes at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const [item] = await (await items(page, "accordion-default")).all();
    const summary = item.locator("summary");
    await summary.click();
    expect(await height(item)).toBeCloseTo(await natural(item), 0);
    await summary.click();
    expect(await height(item)).toBeCloseTo(await height(summary), 0);
  });

  test("small: 14px text with 8px above and below, and 13px content with 8px under it", async ({ page }) => {
    const [item] = await (await items(page, "accordion-small")).all();
    const summary = item.locator("summary");
    await expect(summary).toHaveCSS("font-size", "14px");
    await expect(summary).toHaveCSS("padding-top", "8px");
    await expect(summary).toHaveCSS("padding-bottom", "8px");
    await summary.click();
    const content = item.locator(".haccordion-content");
    await expect(content).toHaveCSS("font-size", "13px");
    expect(await content.evaluate((node) => getComputedStyle(node, "::after").height)).toBe("8px");
    // The code under each example is a small item too.
    const code = (await example(page, "accordion-small")).locator(".play-code > summary");
    await expect(code).toHaveCSS("font-size", "14px");
  });

  test("Tab reaches what's inside as soon as it opens, while it grows", async ({ page }) => {
    const [item] = await (await items(page, "accordion-on-its-own")).all();
    const summary = item.locator("summary");
    const closed = await height(item);
    await slowDown(page);
    await summary.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(item.getByRole("switch", { name: "Retry failed webhooks" })).toBeFocused();
    // Reached before it had opened all the way, and it goes on growing.
    expect(await height(item)).toBeLessThan((await natural(item)) - 1);
    await expect.poll(() => height(item)).toBeGreaterThan(closed + 1);
  });

  test("a control inside keeps its whole focus ring, on every side", async ({ page }) => {
    const [item] = await (await items(page, "accordion-on-its-own")).all();
    const summary = item.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => height(item)).toBeCloseTo(await natural(item), 0);
    await page.keyboard.press("Tab");
    const control = item.getByRole("switch", { name: "Retry failed webhooks" });
    await expect(control).toBeFocused();
    // The ring, by the switch's outline, inside the box that clips the
    // content: the item's, reaching past it as ::details-content's margins
    // say, from the summary's end down.
    const { ring, clip } = await item.evaluate((node) => {
      const control = node.querySelector('[role="switch"]') as HTMLElement;
      const box = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const content = getComputedStyle(node, "::details-content");
      const item = node.getBoundingClientRect();
      const summary = (node.querySelector("summary") as HTMLElement).getBoundingClientRect();
      return {
        ring: { top: box.top - reach, left: box.left - reach, right: box.right + reach, bottom: box.bottom + reach },
        clip: {
          top: summary.bottom + parseFloat(content.marginTop),
          left: item.left + parseFloat(content.marginLeft),
          right: item.right - parseFloat(content.marginRight),
          bottom: item.bottom,
        },
      };
    });
    expect(ring.top).toBeGreaterThanOrEqual(clip.top);
    expect(ring.left).toBeGreaterThanOrEqual(clip.left);
    expect(ring.right).toBeLessThanOrEqual(clip.right);
    expect(ring.bottom).toBeLessThanOrEqual(clip.bottom);
  });

  test("a click at the bottom of an open item's summary still closes it", async ({ page }) => {
    const [item] = await (await items(page, "accordion-default")).all();
    const summary = item.locator("summary");
    await summary.click();
    await expect.poll(() => height(item)).toBeCloseTo(await natural(item), 0);
    const [box] = await boxes(summary);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 3);
    await expect.poll(() => isOpen(item)).toBe(false);
  });

  test("a hidden first item leaves no line above the next", async ({ page }) => {
    const [first, second, third] = await (await items(page, "accordion-default")).all();
    await expect(second).toHaveCSS("border-top-width", "1px");
    await first.evaluate((node) => ((node as HTMLElement).hidden = true));
    await expect(second).toHaveCSS("border-top-width", "0px");
    await expect(third).toHaveCSS("border-top-width", "1px");
  });
});
