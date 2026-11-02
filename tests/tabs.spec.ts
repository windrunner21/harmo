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
// script sets, measured from the bar's left edge, within a pixel. Both are
// measured each time, in case layout is still settling.
const expectPlaced = async (tabs: Locator, part: "highlight" | "indicator", item: Locator) => {
  const target = await item.elementHandle();
  await expect
    .poll(() =>
      tabs.evaluate(
        (root, [part, target]) => {
          const style = getComputedStyle(root);
          const box = (target as Element).getBoundingClientRect();
          const left = box.left - root.getBoundingClientRect().left - root.clientLeft;
          return Math.max(
            Math.abs(parseFloat(style.getPropertyValue(`--htabs-${part}-x`)) - left),
            Math.abs(parseFloat(style.getPropertyValue(`--htabs-${part}-width`)) - box.width),
          );
        },
        [part, target] as const,
      ),
    )
    .toBeLessThan(1);
};
