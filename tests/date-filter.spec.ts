import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/date-filter.md says: a chip that opens a panel of a
// condition and the fields it needs; Apply off until they're complete; a value
// of gte and lte, in Unix seconds, on the viewer's days; a panel that reopens
// on the condition the value describes; and Clear.
test.use({ timezoneId: "Asia/Baku" });

// Seconds for a moment in Baku, which is UTC+4 all year.
const baku = (month: number, day: number, hours = 0, minutes = 0, seconds = 0, year = 2026) =>
  Date.UTC(year, month - 1, day, hours - 4, minutes, seconds) / 1000;

const parts = (container: Locator) => {
  const panel = container.getByRole("dialog", { name: "Due date" });
  return {
    chip: container.locator(".hfilter-chip"),
    value: container.locator(".hfilter-chip-value"),
    panel,
    condition: panel.getByRole("combobox", { name: "Condition" }),
    amount: panel.getByRole("textbox", { name: "How many" }),
    unit: panel.getByRole("combobox", { name: "Unit" }),
    date: panel.getByRole("textbox", { name: "Date", exact: true }),
    start: panel.getByRole("textbox", { name: "Start date" }),
    end: panel.getByRole("textbox", { name: "End date" }),
    and: panel.locator(".hdate-filter-and"),
    apply: panel.getByRole("button", { name: "Apply" }),
    clear: panel.getByRole("button", { name: "Clear" }),
    query: container.locator("[data-example-query]"),
  };
};

const open = async (page: Page, id: string) => {
  const container = await example(page, id);
  const all = parts(container);
  await all.chip.click();
  await expect(all.panel).toBeVisible();
  await settled(all.panel);
  await expect(all.condition).toBeFocused();
  return all;
};

const choose = async (select: Locator, panel: Locator, name: string) => {
  await select.click();
  const option = panel.getByRole("option", { name, exact: true });
  await expect(option).toBeVisible();
  await settled(panel.locator(".hpopup:popover-open"));
  await option.click();
  await expect(select).toContainText(name);
};

const type = async (field: Locator, digits: string) => {
  await field.fill("");
  await field.pressSequentially(digits);
};

const url = "date-filter-kept-in-the-url";

onEachPlayground("date-filter", () => {
  test("the chip opens a named dialog, on the condition, with the amount and unit showing", async ({ page }) => {
    const container = await example(page, "date-filter-default");
    const { chip, panel } = parts(container);
    await expect(chip).toHaveAttribute("aria-haspopup", "dialog");
    await expect(chip).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    const { condition, amount, unit, date, apply, clear } = await open(page, "date-filter-default");
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(condition).toContainText("is in the last");
    await expect(amount).toBeVisible();
    await expect(amount).toHaveAttribute("inputmode", "numeric");
    await expect(unit).toContainText("days");
    await expect(date).toBeHidden();
    await expect(apply).toHaveAttribute("aria-disabled", "true");
    await expect(clear).toBeHidden();
  });

  test("each condition shows only the fields it needs", async ({ page }) => {
    const { panel, condition, amount, unit, date, start, end, and } = await open(page, "date-filter-default");

    await choose(condition, panel, "is equal to");
    await expect(date).toBeVisible();
    await expect(amount).toBeHidden();
    await expect(unit).toBeHidden();
    await expect(end).toBeHidden();
    await expect(and).toBeHidden();

    await choose(condition, panel, "is between");
    await expect(start).toBeVisible();
    await expect(end).toBeVisible();
    await expect(and).toHaveText("and");
    await expect(date).toBeHidden();

    for (const name of ["is after", "is before"]) {
      await choose(condition, panel, name);
      await expect(date).toBeVisible();
      await expect(end).toBeHidden();
      await expect(and).toBeHidden();
    }

    await choose(condition, panel, "is in the last");
    await expect(amount).toBeVisible();
    await expect(date).toBeHidden();
  });

  test("Apply is off until the fields are complete, and does nothing while it is", async ({ page }) => {
    const { panel, chip, condition, amount, start, end, apply } = await open(page, "date-filter-default");
    await apply.click({ force: true });
    await expect(panel).toBeVisible();

    for (const text of ["abc", "0", "1.5", "-2", "99999999999999"]) {
      await amount.fill(text);
      await expect(apply, text).toHaveAttribute("aria-disabled", "true");
    }
    await amount.fill("7");
    await expect(apply).not.toHaveAttribute("aria-disabled");

    await choose(condition, panel, "is between");
    await expect(apply).toHaveAttribute("aria-disabled", "true");
    await type(start, "11012026");
    await start.press("Tab");
    await expect(apply).toHaveAttribute("aria-disabled", "true");
    await type(end, "11092026");
    await end.press("Tab");
    await expect(apply).not.toHaveAttribute("aria-disabled");
    await expect(chip).toHaveAttribute("aria-expanded", "true");
  });

  test("in the last few days writes absolute times, so a link shows the window that was seen", async ({ page }) => {
    await page.clock.setFixedTime(new Date(baku(11, 9, 12) * 1000));
    const { panel, chip, value, amount, apply, clear, query, condition } = await open(page, url);
    await clear.click();
    await expect(query).toHaveText("?");
    await expect(value).toHaveCount(0);

    await expect(condition).toContainText("is in the last");
    await amount.fill("7");
    await apply.click();
    await expect(panel).toBeHidden();
    await expect(chip).toBeFocused();
    await expect(query).toHaveText(`?due[gte]=${baku(11, 9, 12) - 7 * 86400}&due[lte]=${baku(11, 9, 12)}`);
    await expect(value).toHaveText(/Nov\s*2\s*[–-]\s*9,\s*2026/);
  });

  test("minutes show the time in the chip, and months are calendar months", async ({ page }) => {
    await page.clock.setFixedTime(new Date(baku(3, 31, 14, 30) * 1000));
    const { panel, chip, value, amount, unit, apply, query } = await open(page, url);
    await panel.getByRole("combobox", { name: "Condition" }).click();
    await panel.getByRole("option", { name: "is in the last" }).click();
    await amount.fill("30");
    await choose(unit, panel, "minutes");
    await apply.click();
    await expect(query).toHaveText(`?due[gte]=${baku(3, 31, 14)}&due[lte]=${baku(3, 31, 14, 30)}`);
    await expect(value).toContainText(/2:00\s*[–-]\s*2:30/);

    await chip.click();
    await expect(panel).toBeVisible();
    await settled(panel);
    await panel.getByRole("combobox", { name: "Condition" }).click();
    await panel.getByRole("option", { name: "is in the last" }).click();
    await amount.fill("1");
    await choose(unit, panel, "months");
    await apply.click();
    await expect(query).toHaveText(`?due[gte]=${baku(2, 28, 14, 30)}&due[lte]=${baku(3, 31, 14, 30)}`);
  });

  test("a date condition writes the bounds of the viewer's days", async ({ page }) => {
    const { panel, chip, value, condition, date, start, end, apply, query } = await open(page, url);
    const reopen = async () => {
      await chip.click();
      await expect(panel).toBeVisible();
      await settled(panel);
    };

    await choose(condition, panel, "is equal to");
    await type(date, "11182026");
    await apply.click();
    await expect(query).toHaveText(`?due[gte]=${baku(11, 18)}&due[lte]=${baku(11, 18, 23, 59, 59)}`);
    await expect(value).toHaveText(/Nov\s*18,\s*2026/);

    await reopen();
    await choose(condition, panel, "is after");
    await type(date, "11182026");
    await apply.click();
    await expect(query).toHaveText(`?due[gte]=${baku(11, 18)}`);
    await expect(value).toContainText("is after");

    await reopen();
    await choose(condition, panel, "is before");
    await type(date, "11182026");
    await apply.click();
    await expect(query).toHaveText(`?due[lte]=${baku(11, 18, 23, 59, 59)}`);
    await expect(value).toContainText("is before");

    await reopen();
    await choose(condition, panel, "is between");
    await type(start, "11012026");
    await type(end, "11092026");
    await end.press("Tab");
    await apply.click();
    await expect(query).toHaveText(`?due[gte]=${baku(11, 1)}&due[lte]=${baku(11, 9, 23, 59, 59)}`);
    await expect(value).toHaveText(/Nov\s*1\s*[–-]\s*9,\s*2026/);
  });

  test("a link's value shows at once, and the panel opens on the condition it describes", async ({ page }) => {
    const container = await example(page, url);
    const { value, query } = parts(container);
    await expect(query).toHaveText("?due[gte]=1793491200&due[lte]=1794268799");
    await expect(value).toHaveText(/Nov\s*1\s*[–-]\s*10,\s*2026/);

    const { panel, chip, condition, start, end, date, apply, clear } = await open(page, url);
    await expect(condition).toContainText("is between");
    await expect(start).toHaveValue("11/01/2026");
    await expect(end).toHaveValue("11/10/2026");
    await expect(clear).toBeVisible();
    await expect(apply).not.toHaveAttribute("aria-disabled");

    const reopened = async (name: string, field: Locator, shown: string) => {
      await apply.click();
      await expect(panel).toBeHidden();
      await chip.click();
      await expect(panel).toBeVisible();
      await settled(panel);
      await expect(condition).toContainText(name);
      await expect(field).toHaveValue(shown);
    };

    await choose(condition, panel, "is after");
    await type(date, "11182026");
    await reopened("is after", date, "11/18/2026");
    await expect(end).toBeHidden();

    await choose(condition, panel, "is before");
    await type(date, "11202026");
    await reopened("is before", date, "11/20/2026");

    await choose(condition, panel, "is equal to");
    await type(date, "11222026");
    await reopened("is equal to", date, "11/22/2026");
  });

  test("what was changed and not applied is gone when it reopens", async ({ page }) => {
    const { panel, chip, condition, date, start, end, query } = await open(page, url);
    await choose(condition, panel, "is equal to");
    await type(date, "12252026");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(query).toHaveText("?due[gte]=1793491200&due[lte]=1794268799");

    await chip.click();
    await expect(panel).toBeVisible();
    await settled(panel);
    await expect(condition).toContainText("is between");
    await expect(start).toHaveValue("11/01/2026");
    await expect(end).toHaveValue("11/10/2026");
  });

  test("Clear empties the filter and the fields, leaves the panel open, and goes until it's needed", async ({ page }) => {
    const { panel, chip, value, condition, clear, query, amount, start, end, apply } = await open(page, url);
    await expect(start).toHaveValue("11/01/2026");
    await clear.click();
    await expect(panel).toBeVisible();
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(condition).toBeFocused();
    await expect(clear).toBeHidden();
    await expect(value).toHaveCount(0);
    await expect(query).toHaveText("?");
    await expect(condition).toContainText("is in the last");
    await expect(amount).toHaveValue("");
    await expect(apply).toHaveAttribute("aria-disabled", "true");

    await choose(condition, panel, "is between");
    await expect(start).toHaveValue("");
    await expect(end).toHaveValue("");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await chip.click();
    await expect(panel).toBeVisible();
    await settled(panel);
    await expect(clear).toBeHidden();
    await expect(condition).toContainText("is in the last");
  });

  test("a date typed and Apply pressed in one click both count", async ({ page }) => {
    const { panel, condition, date, apply, query } = await open(page, url);
    await choose(condition, panel, "is after");
    await date.fill("");
    await date.press("Tab");
    await expect(apply).toHaveAttribute("aria-disabled", "true");
    await date.pressSequentially("12012026");
    await expect(date).toBeFocused();
    // Forced, so nothing waits for the list above Apply to finish fading.
    await settled(panel.locator(".hpopup").first());
    await apply.click({ force: true });
    await expect(panel).toBeHidden();
    await expect(query).toHaveText(`?due[gte]=${baku(12, 1)}`);
  });

  test("Enter in the amount applies", async ({ page }) => {
    await page.clock.setFixedTime(new Date(baku(11, 9, 12) * 1000));
    const { panel, chip, condition, amount, query } = await open(page, url);
    await choose(condition, panel, "is in the last");
    await amount.fill("2");
    await amount.press("Enter");
    await expect(panel).toBeHidden();
    await expect(chip).toBeFocused();
    await expect(query).toHaveText(`?due[gte]=${baku(11, 9, 12) - 2 * 86400}&due[lte]=${baku(11, 9, 12)}`);
  });

  test("two dates out of order aren't accepted, whichever was typed last", async ({ page }) => {
    const { panel, condition, start, end, apply } = await open(page, "date-filter-default");
    await choose(condition, panel, "is between");
    await type(start, "11102026");
    await start.press("Tab");
    await type(end, "11012026");
    await end.press("Tab");
    await expect(end).toHaveAttribute("aria-invalid", "true");
    await expect(apply).toHaveAttribute("aria-disabled", "true");

    await type(end, "11152026");
    await end.press("Tab");
    await expect(end).not.toHaveAttribute("aria-invalid");
    await expect(apply).not.toHaveAttribute("aria-disabled");

    await type(start, "11202026");
    await start.press("Tab");
    await expect(start).toHaveAttribute("aria-invalid", "true");
    await expect(apply).toHaveAttribute("aria-disabled", "true");
  });

  test("a list or a calendar opens over the panel, and Escape closes only that first", async ({ page }) => {
    const { panel, chip, condition, date } = await open(page, "date-filter-default");
    await condition.click();
    const list = panel.getByRole("listbox", { name: "Condition" });
    await expect(list).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(panel).toBeVisible();

    await choose(condition, panel, "is equal to");
    const button = panel.getByRole("button", { name: "Choose a date" }).first();
    const calendar = panel.getByRole("dialog", { name: "Choose a date" }).first();
    await button.click();
    await expect(calendar).toBeVisible();
    await settled(calendar);
    await page.keyboard.press("Escape");
    await expect(calendar).toBeHidden();
    await expect(panel).toBeVisible();
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(button).toBeFocused();

    await button.click();
    await expect(calendar).toBeVisible();
    await settled(calendar);
    await calendar.locator('[data-date="2026-11-18"]').click();
    await expect(calendar).toBeHidden();
    await expect(panel).toBeVisible();
    await expect(date).toHaveValue("11/18/2026");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("right to left, the amount is on the right of its unit, and the panel is by its chip", async ({ page }) => {
    const container = await example(page, "date-filter-right-to-left");
    await container.locator(".hfilter-chip").click();
    const panel = container.getByRole("dialog");
    await expect(panel).toBeVisible();
    await settled(panel);
    const [amount, unit] = await boxes(
      panel.locator(".hdate-filter-amount"),
      panel.getByRole("combobox", { name: "الوحدة" }),
    );
    expect(amount.x).toBeGreaterThan(unit.x);
    await expect(panel.getByRole("button", { name: "تطبيق" })).toBeVisible();

    const [chip, box] = await boxes(container.locator(".hfilter-chip"), panel);
    expect(box.x).toBeLessThan(chip.x + chip.width);
    expect(box.x + box.width).toBeGreaterThan(chip.x);

    await choose(panel.getByRole("combobox", { name: "الشرط" }), panel, "بين");
    await expect(panel.getByRole("textbox", { name: "تاريخ البداية" })).toBeVisible();
    await expect(panel.getByRole("textbox", { name: "تاريخ النهاية" })).toBeVisible();
  });

  test("on a narrow screen, two dates wrap inside the window", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const { panel, condition, start, end } = await open(page, "date-filter-default");
    await choose(condition, panel, "is between");
    const [box, first, second] = await boxes(panel, start, end);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(second.y).toBeGreaterThan(first.y);
    expect(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });
});

test.describe("where clocks go back at midnight", () => {
  test.use({ timezoneId: "Asia/Beirut" });

  onEachPlayground("date-filter", () => {
    test("a day runs to its true end, the repeated hour included, and reopens as that day", async ({ page }) => {
      const { panel, chip, condition, date, apply, query } = await open(page, url);
      await choose(condition, panel, "is equal to");
      await type(date, "10242026");
      await date.press("Tab");
      await apply.click();
      await expect(query).toHaveText(
        `?due[gte]=${Date.UTC(2026, 9, 23, 21) / 1000}&due[lte]=${Date.UTC(2026, 9, 24, 21, 59, 59) / 1000}`,
      );

      await chip.click();
      await expect(panel).toBeVisible();
      await settled(panel);
      await expect(condition).toContainText("is equal to");
      await expect(date).toHaveValue("10/24/2026");
    });
  });
});
