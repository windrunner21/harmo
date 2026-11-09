import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/filters.md says: the first filters in a named row and
// the rest behind a chip; a count of those in force behind it; Reset, while
// anything is in force, emptying them all; and right to left, from the right.
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
    await expect(row.locator(":scope > .hfilter-chip")).toHaveText(["Status", "Assignee", "More filters"], {
      useInnerText: true,
    });
    await expect(moreChip).toHaveAttribute("aria-haspopup", "dialog");
    await expect(moreChip).toHaveAttribute("aria-expanded", "false");
    await expect(more).toBeHidden();
    await expect(count).toBeHidden();
    await expect(reset).toBeHidden();
  });

  test("the chip opens a named dialog of the rest, with focus on the first", async ({ page }) => {
    const container = await example(page, "filters-default");
    const all = parts(container);
    await openMore(all);
    await expect(all.moreChip).toHaveAttribute("aria-expanded", "true");
    await expect(all.more.locator(".hfilter-chip")).toHaveText(["Due date", "Priority", "Project"]);
    await expect(all.more.locator(".hfilter-chip").first()).toBeFocused();

    await container.getByRole("heading", { name: "Default" }).click();
    await expect(all.more).toBeHidden();
  });

  test("opening the panel skips a first filter that can't take focus", async ({ page }) => {
    const container = await example(page, "filters-default");
    const all = parts(container);
    await container.locator(".hfilters-more .hfilter-chip").first().evaluate((node: HTMLButtonElement) => (node.disabled = true));
    await openMore(all);
    await expect(all.more.locator(".hfilter-chip", { hasText: "Priority" })).toBeFocused();
  });

  test("three popups deep, Escape closes one at a time and hands focus back", async ({ page }) => {
    const c = await example(page, "filters-default");
    const all = parts(c);
    await openMore(all);
    const due = all.more.locator(".hfilter-chip", { hasText: "Due date" });
    const panel = c.getByRole("dialog", { name: "Due date" });
    await due.click();
    await expect(panel).toBeVisible();
    await settled(panel);
    const condition = panel.getByRole("combobox", { name: "Condition" });
    await expect(condition).toBeFocused();
    await condition.click();
    const list = panel.getByRole("listbox", { name: "Condition" });
    await expect(list).toBeVisible();
    await settled(panel.locator(".hpopup:popover-open").last());

    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(panel).toBeVisible();
    await expect(all.more).toBeVisible();
    await expect(condition).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(all.more).toBeVisible();
    await expect(due).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(all.more).toBeHidden();
    await expect(all.moreChip).toBeFocused();
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
    const due = all.more.locator(".hfilter-chip", { hasText: "Due date" });
    const panel = container.getByRole("dialog", { name: "Due date" });
    const reopen = async () => {
      await due.click();
      await expect(panel).toBeVisible();
      await settled(panel);
    };
    await openMore(all);
    await reopen();
    await panel.getByRole("textbox", { name: "How many" }).fill("7");
    await panel.getByRole("button", { name: "Apply" }).click();
    await expect(all.values).toHaveCount(1);
    await expect(all.count).toHaveText("1");
    await expect(all.reset).toBeVisible();
    await expect(all.more).toBeVisible();

    await reopen();
    await expect(panel.getByRole("button", { name: "Clear" })).toBeVisible();

    await all.reset.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toBeHidden();
    await expect(all.more).toBeHidden();
    await expect(all.values).toHaveCount(0);
    await expect(all.reset).toBeHidden();
    await expect(all.chip("Status")).toBeFocused();

    await openMore(all);
    await reopen();
    await expect(panel.getByRole("button", { name: "Clear" })).toBeHidden();
    await expect(panel.getByRole("button", { name: "Apply" })).toHaveAttribute("aria-disabled", "true");
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
    await expect(all.count).toHaveCSS("background-color", await color(page, "--harmo-color-border"));
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

  test("a long Reset wraps inside the row on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const { row } = parts(await example(page, "filters-with-filters-in-force"));
    const reset = row.locator(".hfilters-reset");
    await reset.evaluate((node) => {
      node.textContent = "Reset every one of the filters on this list back to how they were to begin with";
    });
    const [rowBox, resetBox] = await boxes(row, reset);
    expect(resetBox!.x + resetBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 0.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
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
