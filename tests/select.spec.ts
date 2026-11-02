import { expect, type Locator, type Page } from "@playwright/test";
import { expectActive, expectChosen } from "./lists.ts";
import { clickAt, example, onEachPlayground, openPopup, test } from "./playgrounds.ts";

// What docs/components/select.md says a script does, on the Select page.
onEachPlayground("select", () => {
  test("focus stays on the trigger while the highlight moves", async ({ page }) => {
    const { trigger, listbox } = await select(page, "select-default", "Channel");
    await trigger.click();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expectActive(trigger, listbox.getByRole("option", { name: "WhatsApp" }));
    await page.keyboard.press("ArrowDown");
    await expect(trigger).toBeFocused();
    await expectActive(trigger, listbox.getByRole("option", { name: "Telegram" }));
  });

  test("Down, Up, Home, End, and typing open a closed select", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-default", "Channel");
    const option = (name: string) => listbox.getByRole("option", { name });
    await trigger.focus();

    // Down keeps the selected option, here the first; Up and Home go to the
    // first, End to the last, and a letter to its match.
    for (const [key, highlighted] of [
      ["ArrowDown", "WhatsApp"],
      ["ArrowUp", "WhatsApp"],
      ["End", "Viber"],
      ["Home", "WhatsApp"],
      ["t", "Telegram"],
    ]) {
      await page.keyboard.press(key);
      await expect(openPopup(container), `${key} opens it`).toHaveCount(1);
      await expectActive(trigger, option(highlighted));
      await page.keyboard.press("Escape");
      await expect(openPopup(container)).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });

  test("Enter chooses, updates the value and the hidden input, and closes", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-default", "Channel");
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expectActive(trigger, listbox.getByRole("option", { name: "WhatsApp" }));
    await page.keyboard.press("ArrowDown");
    await expectActive(trigger, listbox.getByRole("option", { name: "Telegram" }));
    await page.keyboard.press("Enter");

    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger.locator(".hselect-value")).toHaveText("Telegram");
    await expectSubmitted(container, "channel", ["telegram"]);
  });

  test("keys pressed straight after one another all count", async ({ page }) => {
    const { trigger } = await select(page, "select-default", "Channel");
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(trigger.locator(".hselect-value")).toHaveText("Viber");
  });

  test("keys sent before the opening is announced all count", async ({ page }) => {
    const { trigger } = await select(page, "select-default", "Channel");
    await trigger.focus();
    // In one task, so they all arrive before the popup's toggle event, and
    // before React renders.
    await trigger.evaluate((element) => {
      for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "Enter"]) {
        element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      }
    });
    await expect(trigger.locator(".hselect-value")).toHaveText("Viber");
  });

  test("Space chooses without opening the list again", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-default", "Channel");
    await trigger.focus();
    await page.keyboard.press("End");
    await expectActive(trigger, listbox.getByRole("option", { name: "Viber" }));
    await page.keyboard.press(" ");

    await expect(trigger.locator(".hselect-value")).toHaveText("Viber");
    await expect(openPopup(container)).toHaveCount(0);
  });

  test("Tab closes the list and moves on", async ({ page }) => {
    const { container, trigger } = await select(page, "select-default", "Channel");
    await trigger.click();
    await page.keyboard.press("Tab");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).not.toBeFocused();
  });

  test("choosing replaces the placeholder", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-placeholder", "Fallback channel");
    const value = trigger.locator(".hselect-value");
    await expect(value).toHaveAttribute("data-placeholder");
    await expectSubmitted(container, "fallback", [""]);

    await trigger.click();
    await clickAt(page, listbox.getByRole("option", { name: "Email" }));
    await expect(value).toHaveText("Email");
    await expect(value).not.toHaveAttribute("data-placeholder");
    await expectSubmitted(container, "fallback", ["email"]);
  });

  test("a multiple select stays open, lists its values, and submits each", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-multiple", "Message statuses");
    const value = trigger.locator(".hselect-value");
    await trigger.click();

    await clickAt(page, listbox.getByRole("option", { name: "Failed" }));
    await expect(openPopup(container)).toHaveCount(1);
    await expect(value).toHaveText("Delivered, Read, Failed");
    await expectSubmitted(container, "statuses", ["delivered", "read", "failed"]);

    for (const name of ["Delivered", "Read", "Failed"]) {
      await clickAt(page, listbox.getByRole("option", { name }));
    }
    await expect(value).toHaveText("Any status");
    await expect(value).toHaveAttribute("data-placeholder");
    await expectSubmitted(container, "statuses", []);
  });

  test("disabling it disables its hidden input, and enabling it brings it back", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-disabling", "Reminder channel");
    const reminding = container.getByLabel("Send a reminder");
    const input = hiddenInputs(container, "reminder-channel");
    await trigger.click();
    await clickAt(page, listbox.getByRole("option", { name: "Email" }));

    await reminding.uncheck();
    await expect(trigger).toBeDisabled();
    await expect(input).toBeDisabled();

    await reminding.check();
    await expect(trigger).toBeEnabled();
    await expect(input).toBeEnabled();
    await expect(trigger.locator(".hselect-value")).toHaveText("Email");
    await expectSubmitted(container, "reminder-channel", ["email"]);
    await trigger.click();
    await expect(openPopup(container)).toHaveCount(1);
  });

  test("in a form, it submits its values and resets to its first ones", async ({ page }) => {
    const container = await example(page, "select-in-a-form");
    const channel = container.getByRole("combobox", { name: "Channel" });
    const statuses = container.getByRole("combobox", { name: "Notify me about" });
    const sent = container.locator("output");
    const save = container.getByRole("button", { name: "Save" });

    await save.click();
    await expect(sent).toHaveText("Sends channel=whatsapp&statuses=failed");

    await channel.click();
    await clickAt(page, container.getByRole("option", { name: "Viber" }));
    await statuses.click();
    await clickAt(page, container.getByRole("option", { name: "Read" }));
    await page.keyboard.press("Escape");
    await save.click();
    await expect(sent).toHaveText("Sends channel=viber&statuses=read&statuses=failed");

    await container.getByRole("button", { name: "Reset" }).click();
    await expect(channel.locator(".hselect-value")).toHaveText("WhatsApp");
    await expect(statuses.locator(".hselect-value")).toHaveText("Failed");
    await save.click();
    await expect(sent).toHaveText("Sends channel=whatsapp&statuses=failed");
    // The lists are back to their first choices too, check mark included.
    const fieldOf = (name: string) =>
      container.locator(".hfield").filter({ has: page.getByRole("combobox", { name, exact: true }) });
    await expectChosen(fieldOf("Channel"), ["WhatsApp"]);
    await expectChosen(fieldOf("Notify me about"), ["Failed"]);
  });
});

// An example's select, found by its label, and its list.
const select = async (page: Page, id: string, label: string) => {
  const container = await example(page, id);
  const trigger = container.getByRole("combobox", { name: label });
  const listbox = container.getByRole("listbox", { includeHidden: true });
  return { container, trigger, listbox };
};

// The hidden inputs a select adds for a form.
const hiddenInputs = (container: Locator, name: string) => container.locator(`input[type="hidden"][name="${name}"]`);

// The values of those inputs, in order.
const expectSubmitted = (container: Locator, name: string, values: string[]) =>
  expect
    .poll(() => hiddenInputs(container, name).evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
    .toEqual(values);
