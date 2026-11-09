import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/filters.md says: the first filters in a named row and
// the rest behind a chip; a count of those in force behind it; Reset, while
// anything is in force, emptying them all; and right to left, from the right.
// CI records a trace of every test, which on a page this long takes WebKit
// about two seconds a step.
test.slow(({ browserName }) => browserName === "webkit", "A long page in WebKit");

const parts = (container: Locator) => {
  const row = container.getByRole("group", { name: "Filter tasks" });
  const moreChip = row.locator(":scope > .hfilter-chip", { hasText: "More filters" });
  return {
    row,
    moreChip,
    count: moreChip.locator(".hfilters-count"),
    more: container.getByRole("dialog", { name: "More filters" }),
    reset: row.getByRole("button", { name: "Reset filters" }),
    values: row.locator(".hfilter-chip-value"),
    chip: (name: string) => row.locator(".hfilter-chip", { hasText: name }),
  };
};

const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

const choose = async (chip: Locator, scope: Locator, option: string) => {
  await chip.click();
  const item = scope.getByRole("option", { name: option, exact: true });
  await expect(item).toBeVisible();
  await settled(scope.locator(".hpopup:popover-open").last());
  await item.click();
};

const openMore = async ({ moreChip, more }: ReturnType<typeof parts>) => {
  await moreChip.click();
  await expect(more).toBeVisible();
  await settled(more);
};

onEachPlayground("filters", () => {
  test("the first filters in a named row, the rest behind a chip, and nothing to count or reset", async ({ page }) => {
    const { row, moreChip, more, count, reset } = parts(await example(page, "filters-default"));
    await expect(row.locator(":scope > .hfilter-chip")).toHaveText(["Status", "Assignee", "Due date", "More filters"], {
      useInnerText: true,
    });
    await expect(moreChip).toHaveAttribute("aria-haspopup", "dialog");
    await expect(moreChip).toHaveAttribute("aria-expanded", "false");
    await expect(more).toBeHidden();
    await expect(count).toBeHidden();
    await expect(reset).toBeHidden();
  });

  test("the chip opens a named dialog of the rest, with focus on the first", async ({ page }) => {
    const all = parts(await example(page, "filters-default"));
    await openMore(all);
    await expect(all.moreChip).toHaveAttribute("aria-expanded", "true");
    await expect(all.more.locator(".hfilter-chip")).toHaveText(["Priority", "Project"]);
    await expect(all.more.locator(".hfilter-chip").first()).toBeFocused();
  });

  test("a filter chosen in the row shows Reset and isn't counted", async ({ page }) => {
    const container = await example(page, "filters-default");
    const { chip, count, reset, row } = parts(container);
    await choose(chip("Status"), container, "Active");
    await expect(row.getByRole("button", { name: "Status Active" })).toBeVisible();
    await expect(reset).toBeVisible();
    await expect(count).toBeHidden();
  });

  test("filters chosen behind the chip are counted, and the panel stays open over their lists", async ({ page }) => {
    const container = await example(page, "filters-default");
    const all = parts(container);
    await openMore(all);
    await choose(all.more.locator(".hfilter-chip", { hasText: "Project" }), all.more, "Website");
    await expect(all.more).toBeVisible();
    await expect(all.moreChip).toHaveAttribute("aria-expanded", "true");
    await expect(all.count).toHaveText("1");
    await expect(all.reset).toBeVisible();

    await choose(all.more.locator(".hfilter-chip", { hasText: "Priority" }), all.more, "High");
    await expect(all.count).toHaveText("2");
    await all.more.getByRole("option", { name: "High", exact: true }).click();
    await expect(all.count).toHaveText("1");

    await page.keyboard.press("Escape");
    await expect(all.more.getByRole("listbox", { name: "Priority" })).toBeHidden();
    await expect(all.more).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(all.more).toBeHidden();
  });

  test("Reset empties every filter, goes, and moves focus to the first", async ({ page }) => {
    const container = await example(page, "filters-default");
    const all = parts(container);
    await choose(all.chip("Status"), container, "Active");
    await openMore(all);
    await choose(all.more.locator(".hfilter-chip", { hasText: "Project" }), all.more, "Website");
    await page.keyboard.press("Escape");
    await expect(all.more).toBeHidden();
    await expect(all.values).toHaveCount(2);

    await all.reset.click();
    await expect(all.values).toHaveCount(0);
    await expect(all.count).toBeHidden();
    await expect(all.reset).toBeHidden();
    await expect(all.chip("Status")).toBeFocused();

    await all.chip("Status").click();
    await expect(container.getByRole("option", { name: "Active", exact: true })).toHaveAttribute("aria-selected", "false");
  });

  test("a Date Filter counts as a filter, and Reset empties it", async ({ page }) => {
    const container = await example(page, "filters-default");
    const all = parts(container);
    await all.chip("Due date").click();
    const panel = container.getByRole("dialog", { name: "Due date" });
    await expect(panel).toBeVisible();
    await settled(panel);
    await panel.getByRole("textbox", { name: "How many" }).fill("7");
    await panel.getByRole("button", { name: "Apply" }).click();
    await expect(all.values).toHaveCount(1);
    await expect(all.reset).toBeVisible();

    await all.reset.click();
    await expect(all.values).toHaveCount(0);
    await expect(all.reset).toBeHidden();

    await all.chip("Due date").click();
    await expect(panel).toBeVisible();
    await settled(panel);
    await expect(panel.getByRole("button", { name: "Clear" })).toBeHidden();
  });

  test("filters already in force are counted at once, and Reset empties those too", async ({ page }) => {
    const container = await example(page, "filters-with-filters-in-force");
    const all = parts(container);
    await expect(all.chip("Status")).toContainText("Active");
    await expect(all.count).toHaveText("1");
    await expect(all.moreChip).toContainText("1");
    await expect(all.reset).toBeVisible();

    await all.reset.click();
    await expect(all.values).toHaveCount(0);
    await expect(all.count).toBeHidden();
    await expect(all.reset).toBeHidden();
    await expect(all.chip("Status")).toBeFocused();
  });

  test("the row's spacing, the count, the panel, and Reset", async ({ page }) => {
    const container = await example(page, "filters-with-filters-in-force");
    const all = parts(container);
    await expect(all.row).toHaveCSS("display", "flex");
    await expect(all.row).toHaveCSS("gap", "8px");
    await expect(all.count).toHaveCSS("font-size", "11px");
    expect((await all.count.boundingBox())!.width).toBeGreaterThanOrEqual(18);

    await expect(all.reset).toHaveCSS("font-size", "14px");
    await expect(all.reset).toHaveCSS("font-weight", "500");
    await expect(all.reset).toHaveCSS("color", await color(page, "--harmo-color-primary"));
    expect((await all.reset.boundingBox())!.height).toBeGreaterThanOrEqual(24);

    await openMore(all);
    await expect(all.more).toHaveCSS("padding-top", "12px");
    await expect(all.more).toHaveCSS("row-gap", "8px");
    expect((await all.more.boundingBox())!.width).toBeGreaterThanOrEqual(220);
  });

  test("right to left, the first filter is on the right", async ({ page }) => {
    const container = await example(page, "filters-right-to-left");
    const row = container.getByRole("group", { name: "تصفية المهام" });
    const [first, second] = await boxes(row.locator(":scope > .hfilter-chip").first(), row.locator(":scope > .hfilter-chip").last());
    expect(first!.x).toBeGreaterThan(second!.x);
  });

  test("on a narrow screen the row wraps, and the panel stays inside the window", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const container = await example(page, "filters-default");
    const all = parts(container);
    const chips = await boxes(...(await all.row.locator(":scope > .hfilter-chip").all()));
    expect(chips[chips.length - 1]!.y).toBeGreaterThan(chips[0]!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await openMore(all);
    const [panel] = await boxes(all.more);
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(320);
  });
});
