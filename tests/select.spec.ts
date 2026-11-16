import { expect, type Browser, type Locator, type Page } from "@playwright/test";
import { expectActive, expectChosen } from "./lists.ts";
import {
  boxes,
  clickAt,
  example,
  onEachPlayground,
  open,
  openPopup,
  playgrounds,
  ready,
  settled,
  test,
  url,
  type Playground,
} from "./playgrounds.ts";

// What docs/components/select.md says a script does, on the Select page. The
// trigger's insets and hover only CSS decides, so those tests run on the HTML
// playground.
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

  test("Enter chooses, updates the value and the select the form sends, and closes", async ({ page }) => {
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
    // Its placeholder is chosen, which is disabled, so the form leaves it out.
    await expectSubmitted(container, "fallback", []);

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

  test("disabling it disables its select, and enabling it brings it back", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-disabling", "Reminder channel");
    const reminding = container.getByLabel("Send a reminder");
    const input = fallbackOf(container, "reminder-channel");
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
    await expect(sent).toHaveText("Save to see what the form sends.");
    await statuses.click();
    await clickAt(page, container.getByRole("option", { name: "Read" }));
    await page.keyboard.press("Escape");
    await save.click();
    await expect(sent).toHaveText("Sends channel=viber&statuses=read&statuses=failed");

    // A reset changes the choices back, so what was sent no longer shows:
    // React calls onValueChange for it.
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(channel.locator(".hselect-value")).toHaveText("WhatsApp");
    await expect(statuses.locator(".hselect-value")).toHaveText("Failed");
    await expect(sent).toHaveText("Save to see what the form sends.");
    await save.click();
    await expect(sent).toHaveText("Sends channel=whatsapp&statuses=failed");
    // The lists are back to their first choices too, check mark included. In
    // the popup, as the field also holds the fallback, a list of its own.
    const popupOf = (name: string) =>
      container.locator(".hfield").filter({ has: page.getByRole("combobox", { name, exact: true }) }).locator(".hpopup");
    await expectChosen(popupOf("Channel"), ["WhatsApp"]);
    await expectChosen(popupOf("Notify me about"), ["Failed"]);
  });

  test("the trigger has Select's insets: its text 10px from the start, its chevron 16px from the end", { tag: "@css" }, async ({ page }) => {
    const { trigger } = await select(page, "select-default", "Channel");
    const [box, value, chevron] = await boxes(trigger, trigger.locator(".hselect-value"), trigger.locator(".hexpand-chevron"));
    expect(value.x - box.x).toBeCloseTo(11, 0);
    expect(box.x + box.width - (chevron.x + chevron.width)).toBeCloseTo(17, 0);
  });

  test("its label isn't the trigger's, so the pointer on it doesn't light the trigger's border", { tag: "@css" }, async ({ page }) => {
    const { container, trigger } = await select(page, "select-default", "Channel");
    const border = () => trigger.evaluate((node) => getComputedStyle(node).borderTopColor);
    const rest = await border();
    await container.locator(".play-demo .hlabel").hover();
    await settled(trigger);
    expect(await border()).toBe(rest);
    await trigger.hover();
    await settled(trigger);
    expect(await border()).not.toBe(rest);
  });

  test("outside its form, it still sends its value once it's changed", async ({ page }) => {
    const { container, trigger, listbox } = await select(page, "select-outside-its-form", "Channel");
    const sent = container.locator("output");
    const save = container.getByRole("button", { name: "Save" });
    await save.click();
    await expect(sent).toHaveText("Sends outside-channel=whatsapp");

    await trigger.click();
    await clickAt(page, listbox.getByRole("option", { name: "Telegram" }));
    await expect(fallbackOf(container, "outside-channel")).toHaveAttribute("form", "outside-form");
    await save.click();
    await expect(sent).toHaveText("Sends outside-channel=telegram");
  });

  test("with its script, the fallback is out of sight and out of the accessibility tree, and still what the form sends, once", async ({ page }) => {
    const container = await example(page, "select-in-a-form");
    const fallbacks = container.locator(".hselect-fallback");
    await expect(fallbacks).toHaveCount(2);
    for (const fallback of await fallbacks.all()) {
      await expect(fallback).toBeHidden();
      await expect(fallback).toHaveAttribute("hidden", "");
    }
    // The trigger is the only control the label names, and no hidden input
    // sends the value beside the <select>.
    const channel = container.getByRole("combobox", { name: "Channel" });
    await expect(channel).toHaveCount(1);
    await expect(channel).toHaveJSProperty("tagName", "BUTTON");
    await expect(container.getByRole("listbox", { name: "Notify me about" })).toHaveCount(0);
    for (const name of ["channel", "statuses"]) {
      await expect(container.locator(`[name="${name}"]`)).toHaveCount(1);
      await expect(container.locator(`[name="${name}"]`)).toHaveJSProperty("tagName", "SELECT");
    }
    await expect(container.locator('input[type="hidden"]')).toHaveCount(0);
    expect(await sentBy(container.locator("form"))).toEqual([
      ["channel", "whatsapp"],
      ["statuses", "failed"],
    ]);
  });

  test("a choice made in the fallback before the script runs, or put back by the browser, carries over to the trigger and the list", async ({ page }) => {
    // Once the page is parsed, before deferred scripts and React run.
    await page.addInitScript(() =>
      document.addEventListener("readystatechange", () => {
        if (document.readyState !== "interactive") return;
        const fallback = document.querySelector<HTMLSelectElement>('[id="select-default"] select[name="channel"]');
        if (fallback) fallback.value = "viber";
      }),
    );
    await page.reload();
    await ready(page);
    const { container, trigger } = await select(page, "select-default", "Channel");
    await expect(trigger.locator(".hselect-value")).toHaveText("Viber");
    await expectChosen(container.locator(".hpopup"), ["Viber"]);
    await expectSubmitted(container, "channel", ["viber"]);
    await expect(container.locator(".hselect-fallback")).toBeHidden();
  });

  test("a select without a name has no fallback, and no other control", async ({ page }) => {
    const { container, trigger } = await select(page, "select-next-to-an-input", "Status");
    await expect(trigger).toBeVisible();
    await expect(container.locator(".hselect-fallback, select, input[type=hidden]")).toHaveCount(0);
  });
});

// Without JavaScript, or before it runs: a select with a name shows its
// fallback, the native <select> that docs/components/select.md describes, in
// the trigger's place, and a form sends it.
for (const playground of playgrounds) {
  test.describe(`${playground} without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("a named select is a native select, in the trigger's place and as big, with its chevron where the trigger's is", async ({ page, browser }) => {
      await page.goto(url(playground, "select"));
      const enhanced = await withScript(browser, page, playground);
      for (const [id, label] of [
        ["select-default", "Channel"],
        ["select-placeholder", "Fallback channel"],
        ["select-long-value", "Sender number"],
      ]) {
        const container = await example(page, id);
        const field = container.locator(".play-demo .hfield");
        // By selectors, as Firefox reads no property of an element in a page
        // without JavaScript.
        const native = container.locator("select").and(container.getByRole("combobox", { name: label }));
        await expect(native).toBeVisible();
        await expect(container.locator("button.hselect")).toBeHidden();

        const shown = await example(enhanced, id);
        const trigger = shown.getByRole("combobox", { name: label });
        expect(await placesIn(field, native, container.locator(".hselect-fallback > .hexpand-chevron")), id).toEqual(
          await placesIn(shown.locator(".play-demo .hfield"), trigger, trigger.locator(".hexpand-chevron")),
        );
      }

      // Several: a list of options, one row of it in view, as tall as the
      // trigger.
      const container = await example(page, "select-multiple");
      const list = container.getByRole("listbox", { name: "Message statuses" });
      await expect(list).toHaveAttribute("multiple");
      const trigger = (await example(enhanced, "select-multiple")).getByRole("combobox", { name: "Message statuses" });
      const [native, shown] = await boxes(list, trigger);
      expect([native.width, native.height]).toEqual([shown.width, shown.height]);
      await enhanced.close();
    });

    test("it looks as the trigger does: its text, the placeholder's gray, an error's border, and disabled", async ({ page, browser }) => {
      await page.goto(url(playground, "select"));
      const enhanced = await withScript(browser, page, playground);
      for (const [id, label] of [
        ["select-default", "Channel"],
        ["select-placeholder", "Fallback channel"],
        ["select-invalid", "Template language"],
        ["select-disabled", "Region"],
      ]) {
        const native = (await example(page, id)).getByRole("combobox", { name: label });
        const trigger = (await example(enhanced, id)).getByRole("combobox", { name: label });
        const value = trigger.locator(".hselect-value");
        const [box, text] = await boxes(trigger, value);
        expect(await looksOf(native), id).toEqual({
          ...(await looksOf(trigger)),
          // The trigger's text is its value's, which ends where the chevron's
          // room starts, inside its 1px border.
          color: await value.evaluate((element) => getComputedStyle(element).color),
          paddingInlineEnd: `${box.x + box.width - 1 - (text.x + text.width)}px`,
        });
      }
      await enhanced.close();
    });

    test("it's named by the Field's label, described by its description and error, and marked invalid", async ({ page }) => {
      await page.goto(url(playground, "select"));
      const placeholder = (await example(page, "select-placeholder")).getByRole("combobox", { name: "Fallback channel" });
      await expect(placeholder).toHaveAccessibleDescription("Optional Used when a message can't be delivered on the main channel.");
      const invalid = (await example(page, "select-invalid")).getByRole("combobox", { name: "Template language" });
      await expect(invalid).toHaveAccessibleDescription("Choose a language for the template.");
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      await expect((await example(page, "select-disabled")).getByRole("combobox", { name: "Region" })).toBeDisabled();
    });

    test("it's chosen as a native select is, a form sends each name once, and a reset puts the first choices back", async ({ page }) => {
      await page.goto(url(playground, "select"));
      const container = await example(page, "select-in-a-form");
      const channel = container.getByRole("combobox", { name: "Channel" });
      const statuses = container.getByRole("listbox", { name: "Notify me about" });
      await channel.selectOption("telegram");
      await expect(channel).toHaveValue("telegram");
      await container.getByRole("button", { name: "Reset" }).click();
      await expect(channel).toHaveValue("whatsapp");

      await channel.selectOption("viber");
      await statuses.selectOption(["read", "failed"]);
      await container.getByRole("button", { name: "Save" }).click();
      await page.waitForURL(/\?/);
      expect([...new URL(page.url()).searchParams]).toEqual([
        ["channel", "viber"],
        ["statuses", "read"],
        ["statuses", "failed"],
      ]);
    });

    test("a select without a name has no fallback: its trigger shows, as it always has", async ({ page }) => {
      await page.goto(url(playground, "select"));
      const container = await example(page, "select-next-to-an-input");
      await expect(container.locator("button").and(container.getByRole("combobox", { name: "Status" }))).toBeVisible();
      await expect(container.locator(".hselect-fallback, select")).toHaveCount(0);
    });
  });
}

// An example's select, found by its label, and its list.
const select = async (page: Page, id: string, label: string) => {
  const container = await example(page, id);
  const trigger = container.getByRole("combobox", { name: label });
  const listbox = container.getByRole("listbox", { includeHidden: true });
  return { container, trigger, listbox };
};

// The native <select> a select with a name keeps for its form.
const fallbackOf = (container: Locator, name: string) => container.locator(`.hselect-fallback > select[name="${name}"]`);

// What it sends, in order: its enabled options that are selected, none while
// it's disabled.
const expectSubmitted = (container: Locator, name: string, values: string[]) =>
  expect
    .poll(() =>
      fallbackOf(container, name).evaluate((select: HTMLSelectElement) =>
        select.disabled ? [] : [...select.selectedOptions].filter((option) => !option.disabled).map((option) => option.value),
      ),
    )
    .toEqual(values);

// What a form sends, name and value.
const sentBy = (form: Locator) =>
  form.evaluate((form: HTMLFormElement) => [...new FormData(form)].map(([name, value]) => [name, String(value)]));

// The same page in a new one with JavaScript, ready, at the same size. A new
// page takes the describe's options, so JavaScript is turned back on.
const withScript = async (browser: Browser, page: Page, playground: Playground) => {
  const enhanced = await browser.newPage({ viewport: page.viewportSize(), javaScriptEnabled: true });
  await open(enhanced, playground, "select");
  return enhanced;
};

// Where each part is in its field, and its size, to a tenth of a pixel.
const placesIn = async (field: Locator, ...parts: Locator[]) => {
  const [box, ...inner] = await boxes(field, ...parts);
  const tenth = (value: number) => Math.round(value * 10) / 10;
  return inner.map((part) => [part.x - box!.x, part.y - box!.y, part.width, part.height].map(tenth));
};

// What a closed select looks like: its box, colors, and type.
const looksOf = (control: Locator) =>
  control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderRadius: style.borderTopLeftRadius,
      boxShadow: style.boxShadow,
      font: `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`,
      paddingInlineStart: style.paddingInlineStart,
      paddingInlineEnd: style.paddingInlineEnd,
      cursor: style.cursor,
    };
  });
