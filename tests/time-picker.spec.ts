import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/time-picker.md says: the time on the locale's clock, its
// value in a hidden input; columns that stay open as you choose, and their
// keys; the minutes offered; and right to left, mirrored.
const parts = (container: Locator) => ({
  button: container.locator(".htime-picker"),
  hidden: container.locator('input[type="hidden"]'),
  popup: container.locator(".hpopup"),
  column: (name: string) => container.getByRole("listbox", { name }),
  option: (column: string, text: string) =>
    container.getByRole("listbox", { name: column }).getByRole("option", { name: text, exact: true }),
});

const open = async ({ button, popup }: ReturnType<typeof parts>) => {
  await button.click();
  await expect(popup).toBeVisible();
  await settled(popup);
};

const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.backgroundColor = `var(${name})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);

onEachPlayground("time-picker", () => {
  test("it shows the time on the locale's clock, is named with it, and holds the value as 14:30", async ({ page }) => {
    const container = await example(page, "time-picker-default");
    const { button, hidden, popup } = parts(container);
    await expect(button).toHaveText(/02:30\sPM/);
    await expect(container.getByRole("button", { name: /^Start time 02:30\sPM$/ })).toBeVisible();
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(hidden).toHaveValue("14:30");
    await expect(popup).toBeHidden();
  });

  test("it opens a dialog of three columns, with focus in the first and the time marked", async ({ page }) => {
    const container = await example(page, "time-picker-default");
    const all = parts(container);
    await open(all);
    await expect(all.button).toHaveAttribute("aria-expanded", "true");
    await expect(container.getByRole("dialog", { name: "Start time" })).toBeVisible();
    await expect(container.getByRole("listbox")).toHaveCount(3);
    await expect(all.column("Hour")).toBeFocused();
    await expect(all.option("Hour", "02")).toHaveAttribute("aria-selected", "true");
    await expect(all.option("Minute", "30")).toHaveAttribute("aria-selected", "true");
    await expect(all.option("AM or PM", "PM")).toHaveAttribute("aria-selected", "true");
    await expect(all.option("Hour", "02")).toHaveCSS("background-color", await color(page, "--harmo-color-primary-fill"));
    await expect(all.column("Minute").getByRole("option")).toHaveCount(4);
  });

  test("choosing changes the time and keeps it open", async ({ page }) => {
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    await all.option("Hour", "05").click();
    await expect(all.hidden).toHaveValue("17:30");
    await expect(all.button).toHaveText(/05:30\sPM/);
    await all.option("Minute", "45").click();
    await expect(all.hidden).toHaveValue("17:45");
    await all.option("AM or PM", "AM").click();
    await expect(all.hidden).toHaveValue("05:45");
    await expect(all.popup).toBeVisible();
  });

  test("12 AM is midnight and 12 PM is noon", async ({ page }) => {
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    await all.option("Hour", "12").click();
    await expect(all.hidden).toHaveValue("12:30");
    await all.option("AM or PM", "AM").click();
    await expect(all.hidden).toHaveValue("00:30");
    await expect(all.button).toHaveText(/12:30\sAM/);
  });

  test("Up and Down move through a column and wrap, Home and End go to its ends, and Left and Right change column", async ({ page }) => {
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    await page.keyboard.press("ArrowDown");
    await expect(all.hidden).toHaveValue("15:30");
    const chosen = await all.option("Hour", "03").getAttribute("id");
    await expect(all.column("Hour")).toHaveAttribute("aria-activedescendant", chosen as string);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(all.hidden).toHaveValue("13:30");
    await page.keyboard.press("Home");
    await expect(all.option("Hour", "12")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await expect(all.option("Hour", "11")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(all.option("Hour", "12")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(all.option("Hour", "11")).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    await expect(all.column("Minute")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(all.option("Minute", "45")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowRight");
    await expect(all.column("AM or PM")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(all.column("Minute")).toBeFocused();
  });

  test("Enter and Escape close it and focus returns; Tab goes through the columns and past them closes it", async ({ page }) => {
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    await page.keyboard.press("Enter");
    await expect(all.popup).toBeHidden();
    await expect(all.button).toBeFocused();

    await open(all);
    await page.keyboard.press("Escape");
    await expect(all.popup).toBeHidden();
    await expect(all.button).toBeFocused();

    await open(all);
    await page.keyboard.press("Tab");
    await expect(all.column("Minute")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(all.column("AM or PM")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(all.popup).toBeHidden();
  });

  test("Shift+Tab from the first column closes it, and a press on the trigger still toggles it shut", async ({ page }) => {
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    await page.keyboard.press("Shift+Tab");
    await expect(all.popup).toBeHidden();
    await expect(all.button).toBeFocused();

    await open(all);
    await all.button.click();
    await expect(all.popup).toBeHidden();
  });

  test("in a form: it sends the time, and Reset goes back", async ({ page }) => {
    const container = await example(page, "time-picker-in-a-form");
    const all = parts(container);
    await open(all);
    await all.option("Hour", "05").click();
    await page.keyboard.press("Escape");
    await expect(all.popup).toBeHidden();
    await container.getByRole("button", { name: "Save" }).click();
    await expect(container.getByRole("status")).toHaveText("Sent 17:30");

    await container.getByRole("button", { name: "Reset" }).click();
    await expect(all.button).toHaveText(/02:30\sPM/);
    await expect(all.hidden).toHaveValue("14:30");
    await open(all);
    await expect(all.option("Hour", "02")).toHaveAttribute("aria-selected", "true");
    await expect(all.option("Hour", "05")).toHaveAttribute("aria-selected", "false");
  });

  test("on a 24-hour clock there's no AM or PM, and the time is scrolled into view", async ({ page }) => {
    const all = parts(await example(page, "time-picker-on-a-24-hour-clock"));
    await expect(all.button).toHaveText("09:00");
    await open(all);
    await expect(all.popup.getByRole("listbox")).toHaveCount(2);
    await expect(all.column("Hour").getByRole("option")).toHaveCount(24);
    await all.option("Hour", "22").click();
    await page.keyboard.press("Escape");
    await open(all);
    const [column, option] = await boxes(all.column("Hour"), all.option("Hour", "22"));
    expect(option.y).toBeGreaterThanOrEqual(column.y);
    expect(option.y + option.height).toBeLessThanOrEqual(column.y + column.height);
  });

  test("minuteStep sets the minutes, and a time between them is still offered", async ({ page }) => {
    const all = parts(await example(page, "time-picker-every-5-minutes"));
    await open(all);
    await expect(all.column("Minute").getByRole("option")).toHaveCount(13);
    await expect(all.option("Minute", "07")).toHaveAttribute("aria-selected", "true");
    await expect(all.option("Minute", "10")).toBeVisible();

    // It stays offered as you move off it.
    await all.column("Minute").focus();
    await page.keyboard.press("ArrowDown");
    await expect(all.hidden).toHaveValue("17:10");
    await page.keyboard.press("ArrowUp");
    await expect(all.hidden).toHaveValue("17:07");
  });

  test("with nothing chosen, the placeholder shows, and the first choice makes a whole time", async ({ page }) => {
    const all = parts(await example(page, "time-picker-with-nothing-chosen"));
    await expect(all.button).toHaveText("Choose a time");
    await expect(all.hidden).toHaveValue("");
    await open(all);
    await expect(all.popup.locator('[aria-selected="true"]')).toHaveCount(0);
    await all.option("Minute", "15").click();
    await expect(all.hidden).toHaveValue("00:15");
    await expect(all.button).toHaveText(/12:15\sAM/);
  });

  test("beside a Date Picker, on one row", async ({ page }) => {
    const container = await example(page, "time-picker-beside-a-date");
    const [date, time] = await boxes(container.locator(".hdate-picker"), container.locator(".htime-picker"));
    expect(time.x).toBeGreaterThan(date.x + date.width - 1);
    expect(time.y).toBeCloseTo(date.y, 0);
    await expect(container.locator('input[name="send-date"]')).toHaveValue("2026-11-18");
    await expect(container.locator('input[name="send-time"]')).toHaveValue("14:00");
  });

  test("disabled, it can't be opened and sends nothing", async ({ page }) => {
    const all = parts(await example(page, "time-picker-disabled"));
    await expect(all.button).toBeDisabled();
    await expect(all.hidden).toBeDisabled();
    await expect(all.popup).toHaveCount(0);
  });

  test("right to left, the arrow keys follow what you see", async ({ page }) => {
    const all = parts(await example(page, "time-picker-right-to-left"));
    await open(all);
    const [hour, minute] = await boxes(all.column("الساعة"), all.column("الدقيقة"));
    expect(minute.x).toBeLessThan(hour.x);
    await expect(all.column("الساعة")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(all.column("الدقيقة")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(all.column("الساعة")).toBeFocused();
  });

  test("in forced colors, the choice is in the system's highlight, hovered too", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
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
    await expect(all.option("Hour", "02")).toHaveCSS("background-color", highlight);
    await all.option("Hour", "02").hover();
    await expect(all.option("Hour", "02")).toHaveCSS("background-color", highlight);
  });

  test("on a 320px screen, the open popup stays on screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const all = parts(await example(page, "time-picker-default"));
    await open(all);
    const [popup] = await boxes(all.popup);
    expect(popup.x).toBeGreaterThanOrEqual(0);
    expect(popup.x + popup.width).toBeLessThanOrEqual(320);
  });
});
