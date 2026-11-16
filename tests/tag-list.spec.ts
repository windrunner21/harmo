import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, open, test } from "./playgrounds.ts";

// What docs/components/tag-list.md says, on the Tag List page: one row that
// never wraps, cut at its end until it's counted, the tags that fit, 6px
// apart, then "+N", written and named by the app and measured as it writes
// each count, whose tooltip shows copies of the rest, with nothing to press
// in them, on hover and keyboard focus; counted again as the width changes,
// but kept while "+N" has focus. That it's a list, which only the markup
// decides, is tested on the HTML playground.
const shown = (list: Locator) => list.locator(":scope > li:not(.htag-list-more):visible");

const resizer = (list: Locator) => (width: string) =>
  list.evaluate((node, width) => ((node.parentElement as HTMLElement).style.inlineSize = width), width);

// The list's own width, in pixels, set through its frame.
const fitter = (list: Locator) => (width: number) =>
  list.evaluate((node, width) => {
    const frame = node.parentElement as HTMLElement;
    const around = frame.getBoundingClientRect().width - node.getBoundingClientRect().width;
    frame.style.inlineSize = `${around + width}px`;
  }, width);

onEachPlayground("tag-list", () => {
  test("the tags that fit, in one row, then +N for the rest, named by the app", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    const fitting = await shown(list).count();
    expect(fitting).toBeGreaterThan(0);
    expect(fitting).toBeLessThan(5);
    await expect(count).toHaveText(`+${5 - fitting}`);
    await expect(count).toHaveAccessibleName(`${5 - fitting} more`);
    await expect(list).toHaveCSS("column-gap", "6px");

    const [row, first, more] = await boxes(list, shown(list).first(), count);
    expect(first.y).toBeCloseTo(more.y, 0);
    expect(more.x + more.width).toBeLessThanOrEqual(row.x + row.width + 0.5);
  });

  test("right to left, the tags start at the right and +N ends the row at the left, written by the app in its own digits", async ({ page }) => {
    const list = (await example(page, "tag-list-right-to-left")).locator(".htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    const rest = 4 - (await shown(list).count());
    expect(rest).toBeGreaterThan(0);
    const digits = await page.evaluate((rest) => rest.toLocaleString("ar"), rest);
    await expect(count).toHaveText(`+${digits}`);
    await expect(count).toHaveAccessibleName(`${digits} أخرى`);

    const [row, first, more] = await boxes(list, shown(list).first(), count);
    expect(first.x + first.width).toBeCloseTo(row.x + row.width, 0);
    expect(more.x).toBeGreaterThanOrEqual(row.x - 0.5);
  });

  test("+N is measured with the app's text for each count it could show, as a smaller one can be wider, so the row fits", async ({ page }) => {
    const list = (await example(page, "tag-list-count-in-words")).locator(".htag-list");
    const more = list.locator(".htag-list-more");
    const count = list.locator(".htag-list-count");
    const resize = resizer(list);
    const fit = fitter(list);

    // With room for no tag, "+N" holds them all, as "4 others".
    await resize("1rem");
    await expect(shown(list)).toHaveCount(0);
    await expect(count).toHaveText("4 others");
    await expect(count).toHaveAccessibleName("4 others");
    const [four] = await boxes(more);

    await resize("60rem");
    await expect(shown(list)).toHaveCount(4);
    const [row, last] = await boxes(list, shown(list).last());
    const lastStart = last.x - row.x;

    // Just short of room for every tag: three, and the one left as "one
    // other", in the form the app writes for one.
    await fit(lastStart + last.width - 1);
    await expect(shown(list)).toHaveCount(3);
    await expect(count).toHaveText("one other");
    await expect(count).toHaveAccessibleName("one other");

    // Room for three tags beside "4 others", but not beside the wider "one
    // other": two, and "2 others", within the row.
    await fit(lastStart + four.width + 1);
    await expect(count).toHaveText("2 others");
    await expect(shown(list)).toHaveCount(2);
    const [fitted, end] = await boxes(list, more);
    expect(end.x + end.width).toBeLessThanOrEqual(fitted.x + fitted.width + 0.5);
  });

  test("+N shows the rest on hover and on keyboard focus, and describes itself with them", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const fitting = await shown(list).count();
    const rest = ["Billing", "Onboarding", "Refund", "Partner", "Urgent"].slice(fitting);
    const count = list.locator(".htag-list-count");
    const tooltip = list.getByRole("tooltip");

    await count.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator(".htag")).toHaveText(rest);
    await expect(count).toHaveAccessibleDescription(rest.join(" "));

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
    await count.focus();
    await expect(tooltip).toBeVisible();
  });

  test("it counts again as the width changes, and shows every tag once they fit", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const before = await shown(list).count();
    const frame = await list.evaluate((node) => (node.parentElement as HTMLElement).style.inlineSize);
    const resize = resizer(list);
    await resize("60rem");
    await expect(shown(list)).toHaveCount(5);
    await expect(list.locator(".htag-list-more")).toBeHidden();
    await resize(frame);
    await expect(shown(list)).toHaveCount(before);
  });

  test("while +N has focus, it stays, however wide the list grows; once focus leaves, every tag that fits shows", async ({ page }) => {
    const list = (await example(page, "tag-list-default")).locator(".htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    await count.focus();
    await resizer(list)("60rem");
    // Counted again, with room for +N kept: four shown, and one in +N.
    await expect(shown(list)).toHaveCount(4);
    await expect(count).toHaveText("+1");
    await expect(count).toBeFocused();

    await count.blur();
    await expect(shown(list)).toHaveCount(5);
    await expect(list.locator(".htag-list-more")).toBeHidden();
  });

  test("before it's counted, the row is cut at its end rather than running into what's beside it; while +N shows, nothing is cut", async ({ page }) => {
    const list = (await example(page, "tag-list-default")).locator(".htag-list");
    await expect(list.locator(".htag-list-count")).toBeVisible();
    await expect(list).toHaveCSS("overflow-x", "visible");

    // A copy as the page first draws it, before a script counts it: every
    // tag shown, and +N hidden.
    const uncounted = await list.evaluate((node) => {
      const copy = node.cloneNode(true) as HTMLElement;
      for (const item of copy.children) (item as HTMLElement).hidden = item.classList.contains("htag-list-more");
      node.after(copy);
      const style = getComputedStyle(copy);
      const last = [...copy.querySelectorAll(":scope > li:not(.htag-list-more)")].at(-1)!.getBoundingClientRect();
      const result = {
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        // Room for a focus ring, where the browser supports it.
        margin: CSS.supports("overflow-clip-margin", "4px") ? style.getPropertyValue("overflow-clip-margin") : "4px",
        spills: last.right > copy.getBoundingClientRect().right,
      };
      copy.remove();
      return result;
    });
    expect(uncounted).toEqual({ overflowX: "clip", overflowY: "clip", margin: "4px", spills: true });
  });

  test("in a Combobox, the copies in +N's tooltip have no remove buttons, so its description is only the choices", async ({ page }, info) => {
    await open(page, info.titlePath.includes("html") ? "html" : "react", "combobox");
    const list = (await example(page, "combobox-several-with-free-text")).locator(".hcombobox > .htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    const rest = ["Ana Lopez", "Sam Rivera", "lee@partner.org", "kim@partner.org"].slice(await shown(list).count());
    await expect(list.locator(".htag-list-rest > .htag")).toHaveText(rest);
    await expect(list.locator(".htag-list-rest .htag-remove")).toHaveCount(0);
    await expect(count).toHaveAccessibleDescription(rest.join(" "));
  });

  test("a press pins the tooltip open, as on a touch screen, until a press again, a press elsewhere, or Escape", async ({ page }) => {
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const count = list.locator(".htag-list-count");
    const trigger = list.locator(".htag-list-more > .htooltip-trigger");
    const tooltip = list.getByRole("tooltip");
    // Pinned: shown, though the pointer has left and a press shows no
    // keyboard focus.
    await count.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await container.getByRole("heading").first().click();
    await expect(tooltip).toBeHidden();
    await expect(trigger).not.toHaveAttribute("data-open");

    await count.click();
    await expect(trigger).toHaveAttribute("data-open");
    await count.click();
    await expect(trigger).not.toHaveAttribute("data-open");

    // Escape unpins it, not only hides it, so it doesn't come back as the
    // pointer leaves.
    await count.click();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(trigger).not.toHaveAttribute("data-open");
  });

  test("a hidden tag whose text or color changes shows it in the tooltip", async ({ page }, info) => {
    // In React, a tag changes by rendering, which counts again anyway.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const hidden = list.locator(":scope > li:not(.htag-list-more)").last().locator(".htag");
    const copy = list.locator(".htag-list-rest > .htag").last();
    await hidden.evaluate((tag) => (tag.lastChild!.textContent = "Escalated"));
    await expect(copy).toHaveText("Escalated");
    await hidden.evaluate((tag) => (tag as HTMLElement).style.setProperty("--htag-color", "var(--harmo-red)"));
    await expect(copy).toHaveAttribute("style", /--htag-color: var\(--harmo-red\)/);
  });

  test("a hidden tag's copy has no id and no remove button, so neither is on the page twice", async ({ page }, info) => {
    // In React, a tag in a Tag List takes no id, and a TagRemove in a copy
    // renders nothing, as the Combobox test above shows.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const container = await example(page, "tag-list-default");
    const list = container.locator(".htag-list");
    const hidden = list.locator(":scope > li:not(.htag-list-more)").last().locator(".htag");
    await hidden.evaluate((tag) => {
      tag.id = "urgent-tag";
      const remove = document.createElement("button");
      remove.className = "htag-remove";
      remove.type = "button";
      remove.id = "remove-urgent";
      remove.setAttribute("aria-label", "Remove Urgent");
      tag.lastChild!.textContent = "Escalated";
      tag.append(remove);
    });
    const copy = list.locator(".htag-list-rest > .htag").last();
    await expect(copy).toHaveText("Escalated");
    await expect(copy).not.toHaveAttribute("id");
    await expect(list.locator(".htag-list-rest .htag-remove")).toHaveCount(0);
    await expect(page.locator("#urgent-tag")).toHaveCount(1);
    await expect(list.locator(".htag-list-count")).toHaveAccessibleDescription(/Escalated$/);
  });

  test("it's a list, which Safari keeps as one though it has no bullets", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "tag-list-default");
    await expect(container.locator(".htag-list")).toHaveAttribute("role", "list");
  });

  test("where even the first tag doesn't fit beside +N, only +N shows", async ({ page }) => {
    const container = await example(page, "tag-list-narrow");
    const list = container.locator(".htag-list");
    await expect(shown(list)).toHaveCount(0);
    await expect(list.locator(".htag-list-count")).toHaveText("+2");
  });
});
