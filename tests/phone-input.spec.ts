import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, clickAt, example, onEachPlayground, openPopup, ready, settled, test } from "./playgrounds.ts";

// What docs/components/phone-input.md says: a searchable country code, a number
// formatted as it's typed with the caret kept among the digits, a full number
// that's pasted setting the country, the digits going when the country changes,
// and the number in E.164 for your app and a form. What the markup and CSS
// alone decide, such as its names, a number it starts with, and where its parts
// sit, is tested on the HTML playground.
onEachPlayground("phone-input", () => {
  const parts = async (page: Page, id: string) => {
    const container = await example(page, `phone-input-${id}`);
    return {
      container,
      field: container.locator('input[type="tel"]'),
      country: container.locator(".hphone-input-country"),
      list: container.locator(".hlistbox"),
      hidden: container.locator('input[type="hidden"]'),
    };
  };

  const caret = (page: Page) =>
    page.evaluate(() => (document.activeElement as HTMLInputElement).selectionStart);

  test("the field is named by the Field's label, and the Select by its own", { tag: "@css" }, async ({ page }) => {
    const { field, country } = await parts(page, "default");
    await expect(field).toHaveAccessibleName("Phone");
    await expect(country).toHaveAccessibleName("Country code");
    await expect(country).toContainText("+1");
    await expect(field).toHaveAttribute("dir", "ltr");
    await expect(field).toHaveAttribute("autocomplete", "tel-national");
  });

  // Sets the field's text and sends the event a browser would.
  const edit = (field: Locator, value: string, caretAt: number, init: InputEventInit) =>
    field.evaluate(
      (node: HTMLInputElement, [value, caretAt, init]) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(node, value);
        node.setSelectionRange(caretAt as number, caretAt as number);
        node.dispatchEvent(new InputEvent("input", { bubbles: true, ...(init as InputEventInit) }));
      },
      [value, caretAt, init] as const,
    );

  test("the closed button names its country for a screen reader", { tag: "@css" }, async ({ page }) => {
    const { country } = await parts(page, "with-a-number-already");
    const name = country.locator(".hphone-input-name");
    await expect(name).toHaveText("Azerbaijan");
    const box = await name.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1);
    await expect(country).toMatchAriaSnapshot(`- combobox "Country code": /\\+994\\s*Azerbaijan/`);
  });

  test("a number is formatted as it's typed", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.click();
    await page.keyboard.type("4155552671");
    await expect(field).toHaveValue("(415) 555-2671");
  });

  test("the caret stays among the digits when one in the middle goes", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.click();
    await page.keyboard.type("4155552671");
    await field.evaluate((n: HTMLInputElement) => n.setSelectionRange(7, 7));
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("(415) 552-671");
    expect(await caret(page)).toBe(4);
  });

  test("deleting a space takes the digit before it, instead of doing nothing", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.click();
    await page.keyboard.type("4155552671");
    await field.evaluate((n: HTMLInputElement) => n.setSelectionRange(6, 6));
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("(415) 552-671");
  });

  test("what's shown and what's sent come from the same number", async ({ page }) => {
    const { field, hidden } = await parts(page, "in-a-form");
    await field.fill("4155552671q2");
    await expect(field).not.toHaveValue(/q/);
    await expect(hidden).toHaveValue("");
  });

  test("a stray character is dropped, and doesn't cut off what follows", async ({ page }) => {
    const { field, hidden } = await parts(page, "in-a-form");
    await field.fill("415q5552671");
    await expect(field).toHaveValue("(415) 555-2671");
    await expect(hidden).toHaveValue("+14155552671");
  });

  test("Arabic digits count, and the caret stays after them", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.click();
    await page.keyboard.insertText("٤");
    await page.keyboard.insertText("١");
    await expect(field).toHaveValue(/^\(?41/);
  });

  test("an edit the browser doesn't name counts as deleting backward", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.fill("4155552671");
    await edit(field, "(415)555-2671", 5, {});
    await expect(field).toHaveValue("(415) 552-671");
  });

  test("replacing a number with the same digits keeps every digit", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.fill("4155552671");
    await edit(field, "4155552671", 10, {});
    await expect(field).toHaveValue("(415) 555-2671");
  });

  test("cutting only a space changes nothing", async ({ page }) => {
    const { field } = await parts(page, "default");
    await field.fill("4155552671");
    await edit(field, "(415)555-2671", 5, { inputType: "deleteByCut" });
    await expect(field).toHaveValue("(415) 555-2671");
  });

  test("nothing is formatted until composing has finished", async ({ page }) => {
    const { field } = await parts(page, "default");
    await edit(field, "１", 1, { isComposing: true });
    await expect(field).toHaveValue("１");
    await field.evaluate((node) => node.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })));
    await expect(field).toHaveValue("1");
  });

  test("an international number typed key by key ends up national", async ({ page }) => {
    const { field, country } = await parts(page, "default");
    await field.click();
    await page.keyboard.type("+33612345678");
    await expect(country).toContainText("+33");
    await expect(field).toHaveValue("06 12 34 56 78");
  });

  test("an unfinished international number sends nothing", async ({ page }) => {
    const { field, hidden } = await parts(page, "in-a-form");
    await field.fill("+1415555267");
    await expect(hidden).toHaveValue("");
  });

  test("a number from a country that isn't listed doesn't blank the button", async ({ page }) => {
    test.skip((await page.locator("[data-play-root]").count()) === 0, "The HTML page's stand-in only knows its six");
    const { field, country, hidden } = await parts(page, "in-a-form");
    await field.fill("+14165550123");
    await expect(country).toContainText("+1");
    await expect(country.locator(".hphone-input-name")).toHaveText("United States");
    await expect(hidden).toHaveValue("");
  });

  test("a full number that's pasted sets the country, with the check mark following it, and shows nationally", async ({ page }) => {
    const { field, country, list } = await parts(page, "default");
    await field.fill("+994501234567");
    await expect(country).toContainText("+994");
    await expect(field).toHaveValue("050 123 45 67");
    await expect(list.locator(".hoption-check")).toHaveCount(1);
    await expect(list.locator('.hoption[aria-selected="true"] .hoption-check')).toHaveCount(1);
    await expect(list.locator('.hoption[aria-selected="true"]')).toContainText("Azerbaijan");
  });

  test("the list can be searched by name and by code", async ({ page }) => {
    const { country, list } = await parts(page, "default");
    await country.click();
    const search = list.locator("xpath=..").locator(".hlistbox-search-input");
    const shown = list.locator(".hoption:not([hidden])");
    await expect(shown).toHaveCount(6);
    await search.fill("azer");
    await expect(shown).toHaveCount(1);
    await expect(shown.first()).toContainText("Azerbaijan");
    await search.fill("+49");
    await expect(shown).toHaveCount(1);
    await expect(shown.first()).toContainText("Germany");
  });

  test("choosing a country empties the field and moves focus to it", async ({ page }) => {
    const { field, country, list } = await parts(page, "default");
    await field.fill("4155552671");
    await country.click();
    // Once the list has opened and settled, so the click lands on the option.
    await clickAt(page, list.locator('.hoption:has-text("Azerbaijan")'));
    await expect(country).toContainText("+994");
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
  });

  test("a click the app stops, with preventDefault() in its own handler on a country, changes nothing", async ({ page }) => {
    const { field, country, list } = await parts(page, "default");
    await field.fill("4155552671");
    await country.click();
    // Once the list has opened and settled, so the click lands on the option.
    await expect(list).toBeVisible();
    await settled(list, ".hpopup");
    const option = list.locator('.hoption:has-text("Azerbaijan")');
    // On the option, so before the list's own handling, as an Option's
    // onClick is in React.
    await option.evaluate((node) => node.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await option.click();
    await expect(option).toHaveAttribute("aria-selected", "false");
    await expect(country).toContainText("+1");
    await expect(field).toHaveValue("(415) 555-2671");
  });

  test("a number to start with sets the country", { tag: "@css" }, async ({ page }) => {
    const { field, country } = await parts(page, "with-a-number-already");
    await expect(field).toHaveValue("050 123 45 67");
    await expect(country).toContainText("+994");
  });

  test("your app hears the number, and whether it's valid", async ({ page }) => {
    const { container, field } = await parts(page, "checking-the-number");
    const status = container.locator(".hstatus");
    await expect(status).toHaveText("Not a complete number yet");
    await field.fill("4155552671");
    await expect(status).toHaveText("+14155552671");
    await field.fill("415");
    await expect(status).toHaveText("Not a complete number yet");

    // A reset that changes the number tells the app too.
    await field.fill("4155552671");
    await expect(status).toHaveText("+14155552671");
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(field).toHaveValue("");
    await expect(status).toHaveText("Not a complete number yet");
  });

  test("the country's button has a Select's insets, so it lines up with one", { tag: "@css" }, async ({ page }) => {
    const { country } = await parts(page, "default");
    const [box, value, chevron] = await boxes(country, country.locator(".hselect-value"), country.locator(".hexpand-chevron"));
    expect(value.x - box.x).toBeCloseTo(11, 0);
    expect(box.x + box.width - (chevron.x + chevron.width)).toBeCloseTo(17, 0);
  });

  test("only the pointer on the field lights its border, not the pointer on its label", { tag: "@css" }, async ({ page }) => {
    const { container, field } = await parts(page, "default");
    const border = () => field.evaluate((node) => getComputedStyle(node).borderTopColor);
    const rest = await border();
    await container.locator(".play-demo .hlabel").hover();
    await settled(field);
    expect(await border()).toBe(rest);
    await field.hover();
    await settled(field);
    expect(await border()).not.toBe(rest);
  });

  test("an example number can be the placeholder", { tag: "@css" }, async ({ page }) => {
    const { field } = await parts(page, "an-example-as-the-placeholder");
    await expect(field).toHaveAttribute("placeholder", /\(\d{3}\) \d{3}-\d{4}/);
  });

  test("your own flags replace the emoji", { tag: "@css" }, async ({ page }) => {
    const { country } = await parts(page, "your-own-flags");
    await expect(country.locator(".hphone-input-flag")).toHaveText("US");
  });

  test("right to left, the number still reads left to right, at the end", { tag: "@css" }, async ({ page }) => {
    const { field, country } = await parts(page, "right-to-left");
    await expect(field).toHaveCSS("direction", "ltr");
    await expect(field).toHaveCSS("text-align", "end");
    const [control, phone] = [await country.boundingBox(), await field.boundingBox()];
    expect(control!.x).toBeGreaterThan(phone!.x);
  });

  test("disabled, nothing can be chosen or typed", { tag: "@css" }, async ({ page }) => {
    const { field, country } = await parts(page, "disabled");
    await expect(field).toBeDisabled();
    await expect(country).toBeDisabled();
  });

  test("read-only, the country can't be changed, and a form still sends the number", async ({ page }) => {
    const { container, field, country, hidden } = await parts(page, "read-only");
    await expect(field).toHaveAttribute("readonly", "");
    await expect(field).toBeEnabled();
    await expect(country).toBeDisabled();
    await expect(country).not.toHaveAttribute("aria-controls");
    await expect(container.locator(".hlistbox")).toHaveCount(0);
    await field.press("End");
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("(415) 555-2671");
    await expect(hidden).toBeEnabled();
    await expect(hidden).toHaveValue("+14155552671");
  });

  test("a form sends the number in E.164, and a reset brings the first one back", async ({ page }) => {
    const { container, field, hidden, country, list } = await parts(page, "in-a-form");
    await expect(hidden).toHaveValue("+14155552671");
    await country.click();
    await clickAt(page, list.locator('.hoption:has-text("Azerbaijan")'));
    await expect(hidden).toHaveValue("");
    await field.fill("0501234567");
    await expect(hidden).toHaveValue("+994501234567");
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(field).toHaveValue("(415) 555-2671");
    await expect(country).toContainText("+1");
    await expect(hidden).toHaveValue("+14155552671");
  });

  // Country names come from Intl, whose data can differ between the server
  // that rendered the page and the browser. Here every name the browser gives
  // has a mark the build's didn't, in the same order, as a newer Intl might
  // rename a country. The options' labels keep the server's text rather than
  // failing the hydration, which the test's page fixture would see as an
  // error in the console.
  test("country names that differ from the server's, as Intl's data can, hydrate without a mismatch", async ({ page }) => {
    test.skip(!test.info().titlePath.includes("react"), "only the React playground hydrates");
    await page.addInitScript(() => {
      const of = Intl.DisplayNames.prototype.of;
      Intl.DisplayNames.prototype.of = function (code) {
        const name = of.call(this, code);
        return name && `·${name}`;
      };
    });
    await page.reload();
    await ready(page);
    const container = await example(page, "phone-input-default");
    const listbox = container.getByRole("listbox", { includeHidden: true });
    // The example's six countries, each with the server's name.
    const names = await listbox.locator(".hoption-label").allTextContents();
    expect(names).toHaveLength(6);
    expect(names.filter((name) => name.includes("·"))).toEqual([]);
    await container.getByRole("combobox", { name: "Country code" }).click();
    await expect(openPopup(container)).toHaveCount(1);
  });
});
