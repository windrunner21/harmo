import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/calendar.md says: a month's name with its year, always
// six rows, today and the chosen date marked; one day in the Tab order, moved
// by the WAI-ARIA date grid's keys; min and max; the week and the language from
// the locale; and right to left, mirrored.
const day = (calendar: Locator, date: string) => calendar.locator(`[data-date="${date}"]`);
const title = (calendar: Locator) => calendar.locator(".hcalendar-title");
const chosen = (calendar: Locator) => calendar.locator('[aria-selected="true"] > .hcalendar-day');
const tabStops = (calendar: Locator) => calendar.locator('.hcalendar-day[tabindex="0"]');
const previous = (calendar: Locator) => calendar.locator(".hcalendar-header > .hbutton").first();
const next = (calendar: Locator) => calendar.locator(".hcalendar-header > .hbutton").last();

const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.backgroundColor = `var(${name})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);

onEachPlayground("calendar", () => {
  test("a month: its name and year, the weekdays, six rows of seven, with today and the chosen date marked", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await expect(calendar.getByRole("grid", { name: "November 2026" })).toBeVisible();
    await expect(title(calendar)).toHaveAttribute("aria-live", "polite");

    const headers = calendar.getByRole("columnheader");
    await expect(headers).toHaveCount(7);
    await expect(headers.first()).toHaveText("Sun");
    await expect(headers.first()).toHaveAttribute("abbr", "Sunday");

    const rows = calendar.locator("tbody tr");
    await expect(rows).toHaveCount(6);
    for (const row of await rows.all()) await expect(row.locator("td")).toHaveCount(7);

    // November 2026 starts on a Sunday: no empty row before it.
    await expect(rows.first().locator("td").first().locator("button")).toHaveAttribute("data-date", "2026-11-01");

    const today = calendar.getByRole("button", { name: "Monday, November 9, 2026" });
    await expect(today).toHaveAttribute("aria-current", "date");
    await expect(today).toHaveCSS("background-color", await color(page, "--harmo-color-background-secondary"));

    const picked = calendar.getByRole("button", { name: "Wednesday, November 18, 2026" });
    await expect(picked.locator("xpath=..")).toHaveAttribute("aria-selected", "true");
    await expect(picked).toHaveCSS("background-color", await color(page, "--harmo-color-primary-fill"));
  });

  test("Previous and Next change the month and year, and nothing moves: the size stays, and so do the buttons", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    const before = await boxes(calendar, previous(calendar), next(calendar));

    await next(calendar).click();
    await expect(title(calendar)).toHaveText("December 2026");
    await expect(chosen(calendar)).toHaveCount(0);
    await next(calendar).click();
    await expect(title(calendar)).toHaveText("January 2027");

    // February 2026 fits in the fewest rows of any month near here.
    for (let months = 0; months < 11; months++) await previous(calendar).click();
    await expect(title(calendar)).toHaveText("February 2026");

    // In the same place on screen first: a retried click may have scrolled the page.
    await example(page, "calendar-default");
    const after = await boxes(calendar, previous(calendar), next(calendar));
    for (const [index, box] of before.entries()) {
      expect(after[index]!.x).toBeCloseTo(box.x, 0);
      expect(after[index]!.y).toBeCloseTo(box.y, 0);
      expect(after[index]!.width).toBeCloseTo(box.width, 0);
      expect(after[index]!.height).toBeCloseTo(box.height, 0);
    }
  });

  test("a click chooses a date, and only one is chosen", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await day(calendar, "2026-11-20").click();
    await expect(chosen(calendar)).toHaveCount(1);
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2026-11-20");
    await next(calendar).click();
    await previous(calendar).click();
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2026-11-20");
  });

  test("one day is in the Tab order: the chosen date, then today, then the month's first day", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await expect(tabStops(calendar)).toHaveCount(1);
    await expect(tabStops(calendar)).toHaveAttribute("data-date", "2026-11-18");

    await next(calendar).click();
    await expect(tabStops(calendar)).toHaveCount(1);
    await expect(tabStops(calendar)).toHaveAttribute("data-date", "2026-12-01");

    const limited = (await example(page, "calendar-with-a-minimum-and-maximum")).locator(".hcalendar");
    await expect(tabStops(limited)).toHaveAttribute("data-date", "2026-11-09");
  });

  test("the arrow keys move by a day and a week, and the Tab order follows", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await day(calendar, "2026-11-18").focus();

    await page.keyboard.press("ArrowRight");
    await expect(day(calendar, "2026-11-19")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(day(calendar, "2026-11-26")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(day(calendar, "2026-11-25")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(day(calendar, "2026-11-18")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(tabStops(calendar)).toHaveCount(1);
    await expect(tabStops(calendar)).toHaveAttribute("data-date", "2026-11-19");
  });

  test("past the month's edge, the next month shows and the day keeps focus", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await day(calendar, "2026-11-18").focus();
    await page.keyboard.press("Home");
    await expect(day(calendar, "2026-11-15")).toBeFocused();
    for (const date of ["2026-11-08", "2026-11-01"]) {
      await page.keyboard.press("ArrowUp");
      await expect(day(calendar, date)).toBeFocused();
    }
    await page.keyboard.press("ArrowLeft");
    await expect(title(calendar)).toHaveText("October 2026");
    await expect(day(calendar, "2026-10-31")).toBeFocused();
  });

  test("Home and End stay in the month, Page Up and Down go by a month, with Shift by a year, and a short month takes its last day", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await day(calendar, "2026-11-18").focus();

    await page.keyboard.press("End");
    await expect(day(calendar, "2026-11-21")).toBeFocused();

    // The month ends on a Monday, in the middle of its week.
    await day(calendar, "2026-11-29").focus();
    await page.keyboard.press("End");
    await expect(day(calendar, "2026-11-30")).toBeFocused();

    await page.keyboard.press("PageUp");
    await expect(title(calendar)).toHaveText("October 2026");
    await expect(day(calendar, "2026-10-30")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(day(calendar, "2026-10-31")).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect(title(calendar)).toHaveText("November 2026");
    await expect(day(calendar, "2026-11-30")).toBeFocused();

    await page.keyboard.press("Shift+PageDown");
    await expect(title(calendar)).toHaveText("November 2027");
    await expect(day(calendar, "2027-11-30")).toBeFocused();
  });

  test("Enter and Space choose the day the keyboard is on", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await day(calendar, "2026-11-18").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2026-11-19");
    await expect(day(calendar, "2026-11-19")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2026-11-20");
  });

  test("days outside min and max are faded and can't be chosen, and Previous and Next stop at those months", async ({ page }) => {
    const calendar = (await example(page, "calendar-with-a-minimum-and-maximum")).locator(".hcalendar");
    await expect(day(calendar, "2026-11-04")).toBeDisabled();
    await expect(day(calendar, "2026-11-05")).toBeEnabled();
    expect(Number(await day(calendar, "2026-11-04").evaluate((node) => getComputedStyle(node).opacity))).toBeLessThan(1);

    await expect(previous(calendar)).toHaveAttribute("aria-disabled", "true");
    // Forced: Playwright won't click what's aria-disabled, as a person can.
    await previous(calendar).click({ force: true });
    await expect(title(calendar)).toHaveText("November 2026");

    await expect(next(calendar)).not.toHaveAttribute("aria-disabled");
    await next(calendar).click();
    await expect(title(calendar)).toHaveText("December 2026");
    await expect(day(calendar, "2026-12-15")).toBeEnabled();
    await expect(day(calendar, "2026-12-16")).toBeDisabled();
    await expect(next(calendar)).toHaveAttribute("aria-disabled", "true");
    await next(calendar).click({ force: true });
    await expect(title(calendar)).toHaveText("December 2026");
  });

  test("the keyboard stops at min and max", async ({ page }) => {
    const calendar = (await example(page, "calendar-with-a-minimum-and-maximum")).locator(".hcalendar");
    await day(calendar, "2026-11-05").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(day(calendar, "2026-11-05")).toBeFocused();
    await page.keyboard.press("PageUp");
    await expect(title(calendar)).toHaveText("November 2026");
    await expect(day(calendar, "2026-11-05")).toBeFocused();

    await day(calendar, "2026-11-20").focus();
    await page.keyboard.press("PageDown");
    await expect(title(calendar)).toHaveText("December 2026");
    await expect(day(calendar, "2026-12-15")).toBeFocused();
  });

  test("in forced colors, the chosen date is in the system's highlight, hovered too", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await page.emulateMedia({ forcedColors: "active" });
    const highlight = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.forcedColorAdjust = "none";
      probe.style.backgroundColor = "Highlight";
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    await expect(chosen(calendar)).toHaveCSS("background-color", highlight);
    await chosen(calendar).hover();
    await expect(chosen(calendar)).toHaveCSS("background-color", highlight);
  });

  test("a date your app sets is chosen, and the month follows it", async ({ page }) => {
    const container = await example(page, "calendar-set-by-the-app");
    const calendar = container.locator(".hcalendar");
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2026-11-18");

    await container.getByRole("button", { name: "Choose January 15, 2027" }).click();
    await expect(title(calendar)).toHaveText("January 2027");
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2027-01-15");
    await expect(tabStops(calendar)).toHaveAttribute("data-date", "2027-01-15");

    await day(calendar, "2027-01-20").click();
    await expect(chosen(calendar)).toHaveAttribute("data-date", "2027-01-20");
  });

  test("a narrower container can set a smaller day", async ({ page }) => {
    const calendar = (await example(page, "calendar-default")).locator(".hcalendar");
    await calendar.evaluate((node) => node.style.setProperty("--hcalendar-day-size", "2rem"));
    const [box, cell] = await boxes(calendar, day(calendar, "2026-11-18"));
    expect(box.width).toBeCloseTo(224, 0);
    expect(cell.width).toBeCloseTo(32, 0);
  });

  test("the week starts where the locale says", async ({ page }) => {
    const calendar = (await example(page, "calendar-a-week-starting-on-monday")).locator(".hcalendar");
    await expect(calendar.getByRole("columnheader").first()).toHaveAttribute("abbr", "Monday");
    await expect(title(calendar)).toHaveText("February 2026");
    // The 1st is a Sunday: the end of the first row.
    await expect(calendar.locator("tbody tr").first().locator("td").last().locator("button")).toHaveAttribute("data-date", "2026-02-01");
    await expect(calendar.locator("tbody tr").first().locator("td").first().locator("button")).toHaveCount(0);
  });

  test("right to left, the sides swap, the arrow keys follow what you see, and the digits are the language's", async ({ page }) => {
    const calendar = (await example(page, "calendar-right-to-left")).locator(".hcalendar");
    const [first, last] = await boxes(previous(calendar), next(calendar));
    expect(first.x).toBeGreaterThan(last.x);
    await expect(day(calendar, "2026-11-18")).toHaveText("١٨");

    const [earlier, later] = await boxes(day(calendar, "2026-11-18"), day(calendar, "2026-11-19"));
    expect(later.x).toBeLessThan(earlier.x);

    await day(calendar, "2026-11-18").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(day(calendar, "2026-11-19")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(day(calendar, "2026-11-18")).toBeFocused();
  });

  test("it fits a 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const container = await example(page, "calendar-default");
    const [calendar] = await boxes(container.locator(".hcalendar"));
    expect(calendar.x).toBeGreaterThanOrEqual(0);
    expect(calendar.x + calendar.width).toBeLessThanOrEqual(320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
