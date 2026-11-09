import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/date-picker.md says: a date in the locale's order, with
// its value in a hidden input; a button that opens the Calendar in a Popup, on
// the date chosen; typing with the separators added for you; a date that
// doesn't exist kept, and marked invalid; and right to left, mirrored.
const parts = (container: Locator) => ({
  field: container.locator(".hdate-picker .hinput"),
  button: container.locator(".hdate-picker .hbutton"),
  hidden: container.locator('.hdate-picker input[type="hidden"]'),
  popup: container.locator(".hpopup"),
  title: container.locator(".hcalendar-title"),
  day: (date: string) => container.locator(`[data-date="${date}"]`),
});

const open = async ({ button, popup }: ReturnType<typeof parts>) => {
  await button.click();
  await expect(popup).toBeVisible();
  await settled(popup);
};

const retype = async (field: Locator, digits: string) => {
  await field.fill("");
  await field.pressSequentially(digits);
};

onEachPlayground("date-picker", () => {
  test("a date in the locale's order, its value in a hidden input, and a named button", async ({ page }) => {
    const container = await example(page, "date-picker-default");
    const { field, button, hidden, popup } = parts(container);
    await expect(container.getByLabel("Due date")).toHaveValue("11/18/2026");
    await expect(hidden).toHaveValue("2026-11-18");
    await expect(hidden).toHaveAttribute("name", "due");
    await expect(field).toHaveAttribute("inputmode", "numeric");
    await expect(container.getByRole("button", { name: "Choose a date" })).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    await expect(popup).toBeHidden();
  });

  test("the button opens the Calendar under the field's start, as wide as the Calendar, with focus on the chosen date", async ({ page }) => {
    // Room below, or it opens above, as any Popup does.
    await page.setViewportSize({ width: 1280, height: 1200 });
    const container = await example(page, "date-picker-default");
    const all = parts(container);
    await open(all);
    await expect(all.button).toHaveAttribute("aria-expanded", "true");
    await expect(container.getByRole("dialog", { name: "Choose a date" })).toBeVisible();
    await expect(all.day("2026-11-18")).toBeFocused();

    const [field, popup, calendar] = await boxes(all.field, all.popup, container.locator(".hcalendar"));
    expect(popup.x).toBeCloseTo(field.x, 0);
    expect(popup.y).toBeGreaterThanOrEqual(field.y + field.height);
    expect(calendar.x - popup.x).toBeGreaterThanOrEqual(16);
    expect(popup.width).toBeLessThan(calendar.width + 40);
  });

  test("picking a day closes it, fills the field, and returns focus to the button", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await open(all);
    await all.day("2026-11-20").click();
    await expect(all.popup).toBeHidden();
    await expect(all.field).toHaveValue("11/20/2026");
    await expect(all.hidden).toHaveValue("2026-11-20");
    await expect(all.button).toBeFocused();
  });

  test("it reopens on the chosen date's month, not the month you paged to", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await open(all);
    await page.keyboard.press("PageDown");
    await expect(all.title).toHaveText("December 2026");
    await page.keyboard.press("Escape");
    await expect(all.popup).toBeHidden();
    await open(all);
    await expect(all.title).toHaveText("November 2026");
    await expect(all.day("2026-11-18")).toBeFocused();
  });

  test("Escape closes it and focus returns to the button; leaving it with Tab closes it", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await open(all);
    await page.keyboard.press("Escape");
    await expect(all.popup).toBeHidden();
    await expect(all.button).toBeFocused();

    await open(all);
    await page.keyboard.press("Tab");
    await expect(all.popup).toBeHidden();
    await expect(all.button).not.toBeFocused();
  });

  test("Shift+Tab back to the button closes it, and a press on the button still toggles it shut", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await open(all);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(all.popup).toBeHidden();
    await expect(all.button).toBeFocused();

    await open(all);
    await all.button.click();
    await expect(all.popup).toBeHidden();
  });

  test("in a form: Enter settles a changed date, again sends it, and Reset goes back", async ({ page }) => {
    const container = await example(page, "date-picker-in-a-form");
    const all = parts(container);
    const status = container.getByRole("status");
    await retype(all.field, "12252026");
    await page.keyboard.press("Enter");
    await expect(all.hidden).toHaveValue("2026-12-25");
    await expect(status).toBeHidden();

    await page.keyboard.press("Enter");
    await expect(status).toHaveText("Sent 2026-12-25");

    await retype(all.field, "02312026");
    await all.field.blur();
    await expect(all.field).toHaveAttribute("aria-invalid", "true");
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(all.field).toHaveValue("11/18/2026");
    await expect(all.hidden).toHaveValue("2026-11-18");
    await expect(all.field).not.toHaveAttribute("aria-invalid");
  });

  test("the HTML script keeps the month within the limits, as React does", async ({ page }, info) => {
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const all = parts(await example(page, "date-picker-with-a-minimum-and-maximum"));
    await all.popup.locator(".hcalendar").evaluate((calendar) =>
      calendar.dispatchEvent(new CustomEvent("example-calendar-show", { detail: "2026-01-20" })),
    );
    await expect(all.title).toHaveText("November 2026");
  });

  test.describe("far east of the date line", () => {
    test.use({ timezoneId: "Pacific/Kiritimati" });

    test("a typed date and time mean the same day", async ({ page }) => {
      const all = parts(await example(page, "date-picker-with-a-time"));
      await all.field.fill("tomorrow at 11pm");
      await all.field.blur();
      await expect(all.hidden).toHaveValue("2026-11-10T23:00");
    });
  });

  test.describe("far west of the date line", () => {
    test.use({ timezoneId: "Pacific/Pago_Pago" });

    test("a typed date and time mean the same day", async ({ page }) => {
      const all = parts(await example(page, "date-picker-with-a-time"));
      await all.field.fill("tomorrow at 1am");
      await all.field.blur();
      await expect(all.hidden).toHaveValue("2026-11-10T01:00");
    });
  });

  test("digits take the locale's order and separators, and the date settles when you leave", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await retype(all.field, "1225");
    await expect(all.field).toHaveValue("12/25");
    await all.field.pressSequentially("2026");
    await expect(all.field).toHaveValue("12/25/2026");
    await expect(all.hidden).toHaveValue("2026-11-18");

    await all.field.blur();
    await expect(all.hidden).toHaveValue("2026-12-25");
    await open(all);
    await expect(all.title).toHaveText("December 2026");
    await expect(all.day("2026-12-25")).toBeFocused();
  });

  test("Enter settles the date, and letters and extra digits are ignored", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await retype(all.field, "1a2b0c120277");
    await expect(all.field).toHaveValue("12/01/2027");
    await page.keyboard.press("Enter");
    await expect(all.hidden).toHaveValue("2027-12-01");
    await expect(all.field).toBeFocused();
  });

  test("editing in the middle keeps the caret where you are", async ({ page }) => {
    const { field } = parts(await example(page, "date-picker-default"));
    const caret = () => field.evaluate((node: HTMLInputElement) => node.selectionStart);
    await field.focus();
    await field.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 4));
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("11/82/026");
    expect(await caret()).toBe(2);
    await page.keyboard.type("5");
    await expect(field).toHaveValue("11/58/2026");
    expect(await caret()).toBe(4);
  });

  test("an edit that changes nothing keeps the caret: a deleted separator, or a letter in the middle", async ({ page }) => {
    const { field } = parts(await example(page, "date-picker-default"));
    const caret = () => field.evaluate((node: HTMLInputElement) => node.selectionStart);
    await field.focus();
    await field.evaluate((node: HTMLInputElement) => node.setSelectionRange(3, 3));
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("11/18/2026");
    expect(await caret()).toBe(2);

    await field.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 4));
    await page.keyboard.type("x");
    await expect(field).toHaveValue("11/18/2026");
    expect(await caret()).toBe(4);
  });

  test("a date that doesn't exist stays in the field, marked invalid, with no value; a real one clears it", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await retype(all.field, "02312026");
    await all.field.blur();
    await expect(all.field).toHaveValue("02/31/2026");
    await expect(all.field).toHaveAttribute("aria-invalid", "true");
    await expect(all.hidden).toHaveValue("");

    await retype(all.field, "02282026");
    await all.field.blur();
    await expect(all.field).not.toHaveAttribute("aria-invalid");
    await expect(all.hidden).toHaveValue("2026-02-28");
  });

  test("a half-typed date is invalid, and an empty field is simply empty", async ({ page }) => {
    const all = parts(await example(page, "date-picker-default"));
    await retype(all.field, "1225");
    await all.field.blur();
    await expect(all.field).toHaveAttribute("aria-invalid", "true");

    await all.field.fill("");
    await all.field.blur();
    await expect(all.field).not.toHaveAttribute("aria-invalid");
    await expect(all.hidden).toHaveValue("");
  });

  test("a date outside min and max is invalid, and those days can't be picked", async ({ page }) => {
    const all = parts(await example(page, "date-picker-with-a-minimum-and-maximum"));
    await retype(all.field, "11042026");
    await all.field.blur();
    await expect(all.field).toHaveAttribute("aria-invalid", "true");
    await expect(all.hidden).toHaveValue("");

    await retype(all.field, "11052026");
    await all.field.blur();
    await expect(all.field).not.toHaveAttribute("aria-invalid");
    await expect(all.hidden).toHaveValue("2026-11-05");

    await open(all);
    await expect(all.day("2026-11-04")).toBeDisabled();
  });

  test("your app can say why: the message comes and goes with the invalid date", async ({ page }) => {
    const container = await example(page, "date-picker-with-an-error");
    const all = parts(container);
    const error = container.locator(".herror");
    await retype(all.field, "02312026");
    await all.field.blur();
    await expect(error).toHaveText("Enter a date as mm/dd/yyyy.");
    await expect(error).toBeVisible();
    const id = await error.getAttribute("id");
    await expect(all.field).toHaveAttribute("aria-describedby", new RegExp(id as string));

    await retype(all.field, "02282026");
    await all.field.blur();
    await expect(error).toBeHidden();
  });

  test("natural reads the words and writes the date in full", async ({ page }) => {
    const all = parts(await example(page, "date-picker-typed-in-words"));
    await expect(all.field).not.toHaveAttribute("inputmode");
    await all.field.fill("tomorrow");
    await all.field.blur();
    await expect(all.field).toHaveValue("November 10, 2026");
    await expect(all.hidden).toHaveValue("2026-11-10");

    await all.field.fill("someday");
    await all.field.blur();
    await expect(all.field).toHaveValue("someday");
    await expect(all.field).toHaveAttribute("aria-invalid", "true");
    await expect(all.hidden).toHaveValue("");

    await open(all);
    await all.day("2026-11-20").click();
    await expect(all.field).toHaveValue("November 20, 2026");
    await expect(all.field).not.toHaveAttribute("aria-invalid");
  });

  test("a real parser understands far more than the HTML stand-in", async ({ page }, info) => {
    test.skip(!info.titlePath.includes("react"), "chrono-node is only in the React playground");
    const all = parts(await example(page, "date-picker-typed-in-words"));
    await all.field.fill("in 2 days");
    await all.field.blur();
    await expect(all.field).toHaveValue("November 11, 2026");
    await expect(all.hidden).toHaveValue("2026-11-11");
  });

  test("with a time, the value keeps it, and picking a day doesn't lose it", async ({ page }) => {
    const all = parts(await example(page, "date-picker-with-a-time"));
    await expect(all.hidden).toHaveValue("2026-11-18T14:00");
    await expect(all.field).toHaveValue(/^November 18, 2026.*2:00\sPM$/);

    await all.field.fill("tomorrow at 9am");
    await all.field.blur();
    await expect(all.hidden).toHaveValue("2026-11-10T09:00");
    await expect(all.field).toHaveValue(/^November 10, 2026.*9:00\sAM$/);

    await open(all);
    await expect(all.day("2026-11-10")).toBeFocused();
    await all.day("2026-11-20").click();
    await expect(all.hidden).toHaveValue("2026-11-20T09:00");
    await expect(all.field).toHaveValue(/^November 20, 2026.*9:00\sAM$/);
  });

  test("disabled, the field and its button can't be used", async ({ page }) => {
    const all = parts(await example(page, "date-picker-disabled"));
    await expect(all.field).toBeDisabled();
    await expect(all.button).toBeDisabled();
    await expect(all.hidden).toBeDisabled();
  });

  test("right to left, the button is at the left end, and the date is in the locale's digits", async ({ page }) => {
    const all = parts(await example(page, "date-picker-right-to-left"));
    await expect(all.field).toHaveValue(/١٨.*١١.*٢٠٢٦/);
    const [field, button] = await boxes(all.field, all.button);
    expect(button.x - field.x).toBeLessThan(8);

    await retype(all.field, "20112026");
    await all.field.blur();
    await expect(all.hidden).toHaveValue("2026-11-20");
    await expect(all.field).toHaveValue(/٢٠.*١١.*٢٠٢٦/);
  });

  test("on a 320px screen, the open Calendar stays on screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const all = parts(await example(page, "date-picker-default"));
    await open(all);
    const [popup] = await boxes(all.popup);
    expect(popup.x).toBeGreaterThanOrEqual(0);
    expect(popup.x + popup.width).toBeLessThanOrEqual(320);
  });
});
