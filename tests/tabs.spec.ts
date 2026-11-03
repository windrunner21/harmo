import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, pointAt, settled, test, watchTransitions } from "./playgrounds.ts";

// What docs/components/tabs.md says a script does, on the Tabs page.
onEachPlayground("tabs", () => {
  test("a click selects a tab and shows its panel", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    await tab(container, "Private").click();
    await expectSelected(container, "Private");
    await expect(container.getByRole("tabpanel")).toHaveText("Replies only you can see.");
  });

  test("the arrow keys select the next tab and wrap; Home and End go to the ends", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    await tab(container, "All").click();

    for (const [key, name] of [
      ["ArrowRight", "Private"],
      ["ArrowLeft", "All"],
      ["ArrowLeft", "Account"],
      ["ArrowRight", "All"],
      ["End", "Account"],
      ["Home", "All"],
    ]) {
      await page.keyboard.press(key);
      await expect(tab(container, name), `${key} focuses ${name}`).toBeFocused();
      await expectSelected(container, name);
    }
  });

  test("right to left, the arrow keys follow the reading direction", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));
    await tab(container, "All").click();
    await page.keyboard.press("ArrowLeft");
    await expectSelected(container, "Private");
    await page.keyboard.press("ArrowRight");
    await expectSelected(container, "All");
  });

  test("the arrow keys skip a disabled tab", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    // Set directly, as an app's disabled would render it: both scripts read
    // which tabs are disabled from the page.
    await tab(container, "Private").evaluate((element) => ((element as HTMLButtonElement).disabled = true));
    await tab(container, "All").click();
    await page.keyboard.press("ArrowRight");
    await expect(tab(container, "Team")).toBeFocused();
    await expectSelected(container, "Team");
  });

  test("Tab moves from the selected tab into its panel", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    await tab(container, "Team").click();
    await page.keyboard.press("Tab");
    await expect(await panelOf(container, tab(container, "Team"))).toBeFocused();
  });

  test("a click slides the underline to the tab; a key moves it at once", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    const indicator = container.locator(".htabs-indicator");

    let slides = await watchTransitions(indicator, "clip-path");
    await tab(container, "Account").click();
    expect(await slides(), "slides after a click").toBeGreaterThan(0);
    await settled(indicator);
    await expectUnderline(container, "Account");

    slides = await watchTransitions(indicator, "clip-path");
    await page.keyboard.press("ArrowLeft");
    await expectUnderline(container, "Team");
    expect(await slides(), "slides after a key").toBe(0);
  });

  test("after a resize, the underline moves at once", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    const indicator = container.locator(".htabs-indicator");
    await tab(container, "Team").click();
    await settled(indicator);

    // A wider tab before it moves Team, as a web font loading would.
    const slides = await watchTransitions(indicator, "clip-path");
    await tab(container, "All").evaluate((element) => ((element as HTMLElement).style.paddingInline = "40px"));
    await expectUnderline(container, "Team");
    expect(await slides(), "slides after a resize").toBe(0);
  });

  test("a link moves the current page and the underline", async ({ page }) => {
    const container = await example(page, "tabs-tabs");
    const campaigns = container.getByRole("link", { name: "Campaigns" });
    await campaigns.click();

    await expect(campaigns).toHaveAttribute("aria-current", "page");
    await expect(container.locator('[aria-current="page"]')).toHaveCount(1);
    await settled(container.locator(".htabs-indicator"));
    await expectUnderline(container, "Campaigns");
  });

  test("with no current tab, the underline has no width", async ({ page }) => {
    const container = await example(page, "tabs-tabs");
    // Both scripts find the current tab in the page when they measure, here
    // after a resize.
    await container.locator('[aria-current="page"]').evaluate((link) => link.removeAttribute("aria-current"));
    await container.getByRole("link", { name: "Campaigns" }).evaluate((link) => ((link as HTMLElement).style.paddingInline = "40px"));
    await expect(container.locator(".htabs")).toHaveCSS("--htabs-indicator-width", "0px");
  });

  test("the pill follows the pointer and marks the current tab", async ({ page }) => {
    const container = await example(page, "tabs-tabs");
    const tabs = container.locator(".htabs");
    const pill = container.locator(".htabs-highlight");

    await pointAt(page, container.getByRole("link", { name: "Campaigns" }));
    await expect(tabs).toHaveCSS("--htabs-highlight-opacity", "1");
    await expectPlaced(tabs, "highlight", container.getByRole("link", { name: "Campaigns" }));
    await expect(pill).not.toHaveAttribute("data-on-current");

    await pointAt(page, container.getByRole("link", { name: "Tickets" }));
    await expect(pill).toHaveAttribute("data-on-current", "");

    await page.mouse.move(0, 0);
    await expect(tabs).toHaveCSS("--htabs-highlight-opacity", "0");
  });

  test("tabs that don't fit stay on one line, and only the strip scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const container = await example(page, "tabs-many-tabs");
    const tabs = container.locator(".htabs");
    const heights = await container.getByRole("link").evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
    expect(new Set(heights).size, "tab heights").toBe(1);
    expect(await tabs.evaluate((strip) => strip.scrollWidth > strip.clientWidth), "the strip scrolls").toBe(true);

    const pageWidth = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(pageWidth[0], "the page's width").toBeLessThanOrEqual(pageWidth[1] as number);
  });

  test("on load, the current tab is in view, and the page hasn't moved", async ({ page }) => {
    const tabs = page.locator('[id="tabs-many-tabs"] .htabs');
    const current = tabs.locator('[aria-current="page"]');
    const { start, end } = await room(tabs, current);
    expect(start, "before it").toBeGreaterThan(0);
    expect(end, "after it").toBeGreaterThan(0);
    await expectPlaced(tabs, "indicator", current);
    expect(await page.evaluate(() => [window.scrollX, window.scrollY]), "the page's scroll").toEqual([0, 0]);
  });

  test("a click slides the tab to the middle of the strip, with the underline under it", async ({ page }) => {
    const container = await example(page, "tabs-many-tabs");
    const tabs = container.locator(".htabs");
    const link = container.getByRole("link", { name: "Notifications" });

    expect(await movedAtOnce(tabs, link), "moved before drawing").toBe(0);
    await expect.poll(() => offCenter(tabs, link), "off the middle").toBeLessThan(2);
    await settled(container.locator(".htabs-indicator"));
    await expectUnderline(container, "Notifications");
  });

  test("a key press, or reduced motion, moves the strip at once", async ({ page }) => {
    const container = await example(page, "tabs-many-tabs");
    const tabs = container.locator(".htabs");
    expect(await movedAtOnce(tabs, container.getByRole("link", { name: "Notifications" }), { key: true }), "after a key").toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await movedAtOnce(tabs, container.getByRole("link", { name: "Team members" })), "with reduced motion").toBeGreaterThan(0);
  });

  test("a tab's focus ring has room at both ends of the strip", async ({ page }) => {
    const container = await example(page, "tabs-many-tabs");
    const tabs = container.locator(".htabs");
    await page.emulateMedia({ reducedMotion: "reduce" });

    const first = container.getByRole("link", { name: "Account details" });
    await first.click();
    const start = await room(tabs, first);
    expect(start.start, "before the first tab").toBeGreaterThanOrEqual(4);
    expect(start.top, "above it").toBeGreaterThanOrEqual(4);
    expect(start.bottom, "below it").toBeGreaterThanOrEqual(4);

    const last = container.getByRole("link", { name: "Developers" });
    await last.click();
    // Less a fraction: a browser may round where a strip's scrolling ends.
    expect((await room(tabs, last)).end, "after the last tab").toBeGreaterThan(3);
  });

  test("the pill stays over its tab once the strip has scrolled", async ({ page }) => {
    const container = await example(page, "tabs-many-tabs");
    const link = container.getByRole("link", { name: "Team members" });
    await expect.poll(() => container.locator(".htabs").evaluate((strip) => strip.scrollLeft), "scrolled on load").toBeGreaterThan(0);
    await pointAt(page, link);
    await expectPlaced(container.locator(".htabs"), "highlight", link);
  });

  test("right to left, a tab past the edge slides to the middle, with the underline under it", async ({ page }) => {
    const container = await example(page, "tabs-many-tabs");
    const tabs = container.locator(".htabs");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));

    const link = container.getByRole("link", { name: "Team members" });
    await link.evaluate((element) => (element as HTMLElement).click());
    await expect.poll(() => offCenter(tabs, link), "off the middle").toBeLessThan(2);
    await settled(container.locator(".htabs-indicator"));
    await expectUnderline(container, "Team members");
  });

  test("when the tabs fit, the strip doesn't scroll, and lines up with what's around it", async ({ page }) => {
    const container = await example(page, "tabs-tabs");
    const tabs = container.locator(".htabs");
    const lines = await tabs.evaluate((strip) => {
      const box = strip.getBoundingClientRect();
      const parent = strip.parentElement as Element;
      const edges = parent.getBoundingClientRect();
      const style = getComputedStyle(parent);
      return {
        scrolls: strip.scrollWidth > strip.clientWidth,
        start: box.left - (edges.left + parseFloat(style.paddingLeft)),
        end: edges.right - parseFloat(style.paddingRight) - box.right,
        firstTab: (strip.querySelector("a") as Element).getBoundingClientRect().left - (edges.left + parseFloat(style.paddingLeft)),
        underline: box.bottom - (strip.querySelector(".htabs-indicator") as Element).getBoundingClientRect().bottom,
      };
    });
    expect(lines).toEqual({ scrolls: false, start: -4, end: 0, firstTab: 0, underline: 0 });
  });

  test("in forced colors, the divider is a border, with the underline above it", async ({ page }) => {
    const container = await example(page, "tabs-tabs");
    const tabs = container.locator(".htabs");
    await page.emulateMedia({ forcedColors: "active" });
    await expect(tabs).toHaveCSS("border-block-end-style", "solid");
    await expect(tabs).toHaveCSS("background-image", "none");
    await expect(container.locator(".htabs-indicator")).toHaveCSS("bottom", "-4px");
  });

  test("right to left, the underline sits under the current link", async ({ page }) => {
    const container = await example(page, "tabs-right-to-left");
    await expectPlaced(container.locator(".htabs"), "indicator", container.locator('[aria-current="page"]'));
  });
});

const tab = (container: Locator, name: string) => container.getByRole("tab", { name, exact: true });

// The panel a tab controls.
const panelOf = async (container: Locator, tab: Locator) =>
  container.locator(`[id="${await tab.getAttribute("aria-controls")}"]`);

// The selected tab: aria-selected, the only tab in the Tab order, and its own
// panel the only one shown.
const expectSelected = async (container: Locator, name: string) => {
  for (const each of await container.getByRole("tab").all()) {
    const selected = (await each.textContent())?.trim() === name;
    const panel = await panelOf(container, each);
    await expect(each).toHaveAttribute("aria-selected", String(selected));
    await expect(each).toHaveJSProperty("tabIndex", selected ? 0 : -1);
    if (selected) await expect(panel).toBeVisible();
    else await expect(panel).toBeHidden();
  }
};

// The underline under the current tab or link.
const expectUnderline = (container: Locator, name: string) =>
  expectPlaced(
    container.locator(".htabs"),
    "indicator",
    container.locator('[aria-current="page"], [aria-selected="true"]').filter({ hasText: name }),
  );

// The pill or underline over an item: the --htabs-* position and width the
// script sets, measured from the part's own left edge, like its clip, within a
// pixel, and inside the part, which draws nothing outside itself. Both are
// measured each time, in case layout is still settling.
const expectPlaced = async (tabs: Locator, part: "highlight" | "indicator", item: Locator) => {
  const target = await item.elementHandle();
  await expect
    .poll(() =>
      tabs.evaluate(
        (root, [part, target]) => {
          const style = getComputedStyle(root);
          const box = (target as Element).getBoundingClientRect();
          const own = (root.querySelector(`.htabs-${part}`) as Element).getBoundingClientRect();
          const x = parseFloat(style.getPropertyValue(`--htabs-${part}-x`));
          const width = parseFloat(style.getPropertyValue(`--htabs-${part}-width`));
          return Math.max(Math.abs(x - (box.left - own.left)), Math.abs(width - box.width), x + width - own.width);
        },
        [part, target] as const,
      ),
    )
    .toBeLessThan(1);
};

// How far a tab's middle is from the strip's.
const offCenter = async (tabs: Locator, item: Locator) =>
  tabs.evaluate((strip, element) => {
    const box = element.getBoundingClientRect();
    const { left, width } = strip.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - (left + width / 2));
  }, await item.elementHandle());

// A tab's distance from each of the strip's edges, negative where it's cut off.
const room = async (tabs: Locator, item: Locator) =>
  tabs.evaluate((strip, element) => {
    const box = element.getBoundingClientRect();
    const edges = strip.getBoundingClientRect();
    return {
      start: box.left - edges.left,
      end: edges.right - box.right,
      top: box.top - edges.top,
      bottom: edges.bottom - box.bottom,
    };
  }, await item.elementHandle());

// Clicks a link from the page's script, then says how far the strip had moved
// before the browser could draw: nothing if it's sliding. A key press first, if
// asked, as that makes the next move immediate.
const movedAtOnce = async (tabs: Locator, item: Locator, { key = false } = {}) =>
  tabs.evaluate(
    async (strip, [element, key]) => {
      const before = strip.scrollLeft;
      if (key) element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
      (element as HTMLElement).click();
      // React updates the page straight after the event.
      await Promise.resolve();
      return Math.abs(strip.scrollLeft - before);
    },
    [await item.elementHandle(), key] as const,
  );
