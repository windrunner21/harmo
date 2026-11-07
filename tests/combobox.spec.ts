import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/combobox.md says, on the Combobox page: typing in the
// field filters the list, the arrow keys move through it with focus staying
// in the field, Enter picks, leaving the field settles it, and with free text
// what's typed is the value.
const isOpen = (popup: Locator) => popup.evaluate((node) => node.matches(":popover-open"));

const parts = async (page: Page, id: string) => {
  const container = await example(page, id);
  const input = container.getByRole("combobox");
  const listbox = container.getByRole("listbox", { includeHidden: true });
  return {
    container,
    input,
    listbox,
    popup: container.locator(".hpopup"),
    shown: listbox.locator(".hoption:not([hidden])").locator(".hoption-label"),
    hidden: container.locator('input[type="hidden"]'),
  };
};

// The option the field names as active, by its label.
const activeLabel = (input: Locator) =>
  input.evaluate((node) => {
    const id = node.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.querySelector(".hoption-label")?.textContent?.trim() ?? null) : null;
  });

// Choosing several: the tags in the field, and what a form around the field
// sends: its named inputs join a form for as long as it takes to read it.
const chips = (container: Locator) => container.locator(".hcombobox > .htag-list > li:not(.htag-list-more) > .htag");
const sent = (container: Locator) =>
  container.locator(".hfield").evaluate((field) => {
    const form = document.createElement("form");
    form.id = "sent-probe";
    document.body.append(form);
    const named = [...field.querySelectorAll("input[name]")];
    for (const input of named) input.setAttribute("form", form.id);
    const values = [...new FormData(form).values()].map(String);
    for (const input of named) input.removeAttribute("form");
    form.remove();
    return values;
  });

onEachPlayground("combobox", () => {
  test("typing filters the list, hides a group left empty, and highlights the first match; Enter picks it", async ({ page }) => {
    const { input, popup, listbox, shown, hidden } = await parts(page, "combobox-default");
    // The label names the field, and its list once it shows.
    await expect(input).toHaveAccessibleName("Assign to");
    await input.click();
    await expect(listbox).toHaveAccessibleName("Assign to");
    await page.keyboard.type("an");
    expect(await isOpen(popup)).toBe(true);
    await expect(shown).toHaveText(["Ana Lopez"]);
    await expect(listbox.locator(".hoption-group:not([hidden]) .hoption-group-label")).toHaveText(["Support"]);
    expect(await activeLabel(input)).toBe("Ana Lopez");
    await expect(input).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Ana Lopez");
    await expect.poll(() => isOpen(popup)).toBe(false);
    await expect(hidden).toHaveValue("ana");
    await expect(listbox.getByRole("option", { name: "Ana Lopez", includeHidden: true })).toHaveAttribute("aria-selected", "true");
  });

  test("Down opens at the first option, the arrows move, and Up opens at the last enabled one; Escape closes, then empties", async ({ page }) => {
    const { input, popup } = await parts(page, "combobox-default");
    await input.focus();
    await page.keyboard.press("ArrowDown");
    expect(await isOpen(popup)).toBe(true);
    expect(await activeLabel(input)).toBe("Sam Rivera");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect(await activeLabel(input)).toBe("Lee Chen");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Lee Chen");

    // Priya Shah is away: disabled, so never highlighted.
    await page.keyboard.press("ArrowUp");
    expect(await activeLabel(input)).toBe("Lee Chen");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(popup)).toBe(false);
    await expect(input).toHaveValue("Lee Chen");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("leaving the field: text naming an option picks it, not a disabled one; other text goes back, and an empty field clears the pick", async ({ page }) => {
    const { input, hidden } = await parts(page, "combobox-default");
    await input.fill("lee chen");
    await input.blur();
    await expect(input).toHaveValue("Lee Chen");
    await expect(hidden).toHaveValue("lee");

    await input.fill("Priya Shah");
    await input.blur();
    await expect(input).toHaveValue("Lee Chen");
    await expect(hidden).toHaveValue("lee");

    await input.fill("Someone else");
    await input.blur();
    await expect(input).toHaveValue("Lee Chen");
    await expect(hidden).toHaveValue("lee");

    await input.fill("");
    await input.blur();
    await expect(input).toHaveValue("");
    await expect(hidden).toHaveValue("");
  });

  test("opening on a chosen option shows the whole list; a click picks, with focus kept in the field", async ({ page }) => {
    const { input, popup, listbox, shown } = await parts(page, "combobox-default");
    await input.fill("sam");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Sam Rivera");
    await input.click();
    expect(await isOpen(popup)).toBe(true);
    await expect(shown).toHaveText(["Sam Rivera", "Ana Lopez", "Lee Chen", "Priya Shah"]);
    await listbox.getByRole("option", { name: "Lee Chen" }).click();
    await expect(input).toHaveValue("Lee Chen");
    await expect(input).toBeFocused();
    await expect.poll(() => isOpen(popup)).toBe(false);
  });

  test("the list opens below the field, at least as wide as it; with nothing matching, its status says so", async ({ page }) => {
    const { container, input, popup } = await parts(page, "combobox-default");
    await input.click();
    await settled(popup);
    const [field, list] = await boxes(container.locator(".hcombobox"), popup);
    expect(list.y).toBeGreaterThan(field.y + field.height);
    expect(list.width).toBeGreaterThanOrEqual(field.width - 1);
    expect(list.x).toBeCloseTo(field.x, 0);
    await expect(input).toHaveAttribute("aria-expanded", "true");

    // The status is in the page from the start, empty while there are
    // matches, so a screen reader reads it as it fills.
    const status = container.getByRole("status", { includeHidden: true });
    await expect(status).toHaveText("");
    await page.keyboard.type("zz");
    await expect(status).toHaveText("No agents found");
    expect(await activeLabel(input)).toBe(null);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await expect(status).toHaveText("");
  });

  test("one option at most is highlighted, however the list was left", async ({ page }) => {
    const { input, listbox } = await parts(page, "combobox-default");
    await input.click();
    await page.keyboard.type("an");
    await input.blur();
    await input.click();
    await expect(listbox.locator(".hoption[data-active]")).toHaveCount(1);
  });

  test("the app's pick shows at once and stays when the field is left", async ({ page }) => {
    const container = await example(page, "combobox-picked-by-the-app");
    const input = container.getByRole("combobox");
    const hidden = container.locator('input[type="hidden"]');
    await input.focus();
    // Picked while the field has focus, as a shortcut key would.
    await container.getByRole("button", { name: "Assign to me" }).evaluate((node) => (node as HTMLButtonElement).click());
    await expect(input).toHaveValue("Sam Rivera");
    await input.blur();
    await expect(input).toHaveValue("Sam Rivera");
    await expect(hidden).toHaveValue("sam");
  });

  test("free text: what's typed is the value, nothing is highlighted until Down, and a pick fills it in", async ({ page }) => {
    const { container, input, popup, listbox, shown } = await parts(page, "combobox-free-text");
    await expect(input).toHaveAttribute("name", "copy-to");
    await input.click();
    await page.keyboard.type("sam");
    await expect(shown).toHaveText(["sam@example.com"]);
    expect(await activeLabel(input)).toBe(null);
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("sam");
    await expect.poll(() => isOpen(popup)).toBe(false);

    await page.keyboard.press("ArrowDown");
    expect(await activeLabel(input)).toBe("sam@example.com");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("sam@example.com");
    await expect(listbox.locator('.hoption[aria-selected="true"]')).toHaveCount(0);

    // Nothing to suggest: the list closes rather than show nothing, and a
    // click or Down doesn't open it empty either.
    await input.fill("someone@elsewhere.org");
    await expect.poll(() => isOpen(popup)).toBe(false);
    await input.click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    expect(await isOpen(popup)).toBe(false);
    await input.blur();
    await expect(input).toHaveValue("someone@elsewhere.org");
    await expect(container.locator('input[type="hidden"]')).toHaveCount(0);
  });

  test("the chevron is Select's size, whatever the text around it", async ({ page }) => {
    const container = await example(page, "combobox-default");
    // The demo's: the code panel under it has one too.
    const [chevron] = await boxes(container.locator(".play-demo .hexpand-chevron"));
    expect(chevron.width).toBeCloseTo(14, 0);
    expect(chevron.height).toBeCloseTo(10.5, 0);
  });

  test("several: each choice is a tag in the field, named to remove it, and a form sends each", async ({ page }) => {
    const { container, input, popup, listbox } = await parts(page, "combobox-several");
    await expect(chips(container)).toHaveText(["Ana Lopez"]);
    await expect(container.getByRole("button", { name: "Remove Ana Lopez" })).toHaveAttribute("tabindex", "-1");
    expect(await sent(container)).toEqual(["ana"]);
    await input.click();
    await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    await expect(listbox.getByRole("option", { name: "Ana Lopez" })).toHaveAttribute("aria-selected", "true");

    // A pick adds the option, empties the text, and leaves the list open on
    // all of them, with the pick still highlighted.
    await page.keyboard.type("lee");
    await page.keyboard.press("Enter");
    await expect(chips(container)).toHaveText(["Ana Lopez", "Lee Chen"]);
    await expect(input).toHaveValue("");
    expect(await isOpen(popup)).toBe(true);
    await expect(listbox.locator(".hoption:not([hidden])")).toHaveCount(4);
    expect(await activeLabel(input)).toBe("Lee Chen");
    expect(await sent(container)).toEqual(["ana", "lee"]);

    // A click on a chosen option takes it away; focus stays in the field.
    await listbox.getByRole("option", { name: "Ana Lopez" }).click();
    await expect(chips(container)).toHaveText(["Lee Chen"]);
    await expect(input).toBeFocused();
    expect(await isOpen(popup)).toBe(true);
    expect(await sent(container)).toEqual(["lee"]);
  });

  test("several: Backspace in an empty field takes the last choice away, but a held one stops at the text", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several");
    await input.click();
    await page.keyboard.type("sam");
    await page.keyboard.press("Enter");
    await expect(chips(container)).toHaveText(["Ana Lopez", "Sam Rivera"]);
    await page.keyboard.press("Escape");
    await input.dispatchEvent("keydown", { key: "Backspace", repeat: true });
    await expect(chips(container)).toHaveCount(2);
    await page.keyboard.press("Backspace");
    await expect(chips(container)).toHaveText(["Ana Lopez"]);
    expect(await sent(container)).toEqual(["ana"]);
  });

  test("several: the arrow toward the start reaches the remove buttons, which move, remove, and go back", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several");
    await input.click();
    for (const name of ["sam", "lee"]) {
      await page.keyboard.type(name);
      await page.keyboard.press("Enter");
    }
    await expect(chips(container)).toHaveText(["Ana Lopez", "Sam Rivera", "Lee Chen"]);
    const remove = (label: string) => container.getByRole("button", { name: `Remove ${label}` });

    await page.keyboard.press("ArrowLeft");
    await expect(remove("Lee Chen")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(remove("Sam Rivera")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(input).toBeFocused();

    // Backspace takes the choice away, and focus goes to the one before;
    // Delete, to the one after.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Backspace");
    await expect(chips(container)).toHaveText(["Ana Lopez", "Lee Chen"]);
    await expect(remove("Ana Lopez")).toBeFocused();
    await page.keyboard.press("Delete");
    await expect(chips(container)).toHaveText(["Lee Chen"]);
    await expect(remove("Lee Chen")).toBeFocused();
    // Enter presses the button, and focus moves on to the field.
    await page.keyboard.press("Enter");
    await expect(chips(container)).toHaveCount(0);
    await expect(input).toBeFocused();
    expect(await sent(container)).toEqual([]);

    // On a right-to-left page, the start is at the right.
    await page.keyboard.type("sam");
    await page.keyboard.press("Enter");
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await page.keyboard.press("ArrowRight");
    await expect(remove("Sam Rivera")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).toBeFocused();
  });

  test("several: a click on a remove button takes its choice away without opening the list", async ({ page }) => {
    const { container, input, popup } = await parts(page, "combobox-several");
    await container.getByRole("button", { name: "Remove Ana Lopez" }).click();
    await expect(chips(container)).toHaveCount(0);
    await page.waitForTimeout(100);
    expect(await isOpen(popup)).toBe(false);
    await expect(input).not.toBeFocused();
    expect(await sent(container)).toEqual([]);
  });

  test("several: leaving the field, text naming an option adds it, not a disabled one, and other text empties", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several");
    await input.fill("lee chen");
    await input.blur();
    await expect(chips(container)).toHaveText(["Ana Lopez", "Lee Chen"]);
    await expect(input).toHaveValue("");
    await input.fill("Priya Shah");
    await input.blur();
    await input.fill("someone");
    await input.blur();
    await expect(chips(container)).toHaveText(["Ana Lopez", "Lee Chen"]);
    await expect(input).toHaveValue("");
  });

  test("several: the field is the box around the tags, Input's ring included, and one row high however many there are", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several");
    const field = container.locator(".hcombobox");
    const [box, tag, chevron] = await boxes(field, chips(container).first(), field.locator(".hexpand-chevron"));
    expect(box.height).toBeCloseTo(34, 0);
    expect(tag.x - box.x).toBeCloseTo(5, 0);
    expect(chevron.y + chevron.height / 2).toBeCloseTo(box.y + box.height / 2, 0);
    expect(await input.evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe("0px");

    // Focused, the box has Input's ring.
    await input.focus();
    expect(await field.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe("3px");

    for (const name of ["sam", "lee"]) {
      await page.keyboard.type(name);
      await page.keyboard.press("Enter");
    }
    await field.evaluate((node) => ((node as HTMLElement).style.inlineSize = "16rem"));
    const [focused] = await boxes(field);
    expect(focused.height).toBeCloseTo(34, 0);
    await input.blur();
    const [rest] = await boxes(field);
    expect(rest.height).toBeCloseTo(34, 0);
  });

  test("several, at rest: the tags that fit, then +N, which shows the rest on hover", async ({ page }) => {
    const { container } = await parts(page, "combobox-several-with-free-text");
    const labels = ["Ana Lopez", "Sam Rivera", "lee@partner.org", "kim@partner.org"];
    const list = container.locator(".hcombobox > .htag-list");
    const count = list.locator(".htag-list-count");
    await expect(count).toBeVisible();
    const shown = await list.locator(":scope > li:not(.htag-list-more):visible").count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(4);
    await expect(count).toHaveText(`+${4 - shown}`);
    await expect(count).toHaveAccessibleName(`${4 - shown} more`);
    // Out of the Tab order: Tab reaches the field's text in one step.
    await expect(count).toHaveAttribute("tabindex", "-1");

    // Everything in one row, inside the list.
    const [row, last, more] = await boxes(list, list.locator(":scope > li:not(.htag-list-more):visible").last(), count);
    expect(last.y).toBeCloseTo(more.y, 0);
    expect(more.x + more.width).toBeLessThanOrEqual(row.x + row.width + 0.5);

    await count.hover();
    const tooltip = list.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator(".htag")).toHaveText(labels.slice(shown));
    await expect(tooltip.locator(".htag-remove").first()).toBeHidden();
  });

  test("several, in the field: every tag shows, in a row that scrolls to its end as tags are added, and +N comes back on leaving", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several-with-free-text");
    const list = container.locator(".hcombobox > .htag-list");
    await input.click();
    await expect(list.locator(".htag-list-more")).toBeHidden();
    await expect(list.locator(":scope > li:not(.htag-list-more):visible")).toHaveCount(4);
    expect(await list.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);

    await page.keyboard.type("jo@partner.org");
    await page.keyboard.press("Enter");
    const [row, added] = await boxes(list, chips(container).last());
    await expect(chips(container).last()).toHaveText("jo@partner.org");
    expect(added.x + added.width).toBeLessThanOrEqual(row.x + row.width + 1);
    expect(added.x).toBeGreaterThanOrEqual(row.x - 1);

    // ← reaches a tag scrolled out of view, scrolling it in.
    for (let step = 0; step < 5; step++) await page.keyboard.press("ArrowLeft");
    await expect(container.getByRole("button", { name: "Remove Ana Lopez" })).toBeFocused();
    const [start, first] = await boxes(list, chips(container).first());
    expect(first.x).toBeGreaterThanOrEqual(start.x - 1);

    await page.keyboard.press("Escape");
    await input.blur();
    await expect(list.locator(".htag-list-count")).toBeVisible();
  });

  test("several, at rest: narrowed, fewer tags show, and widened again, as many as before", async ({ page }) => {
    const { container } = await parts(page, "combobox-several-with-free-text");
    const field = container.locator(".hcombobox");
    const shown = field.locator(".htag-list > li:not(.htag-list-more):visible");
    const before = await shown.count();
    await field.evaluate((node) => ((node as HTMLElement).style.inlineSize = "12rem"));
    await expect.poll(() => shown.count()).toBeLessThan(before);
    await field.evaluate((node) => ((node as HTMLElement).style.inlineSize = ""));
    await expect(shown).toHaveCount(before);
  });

  test("several, required: the field is valid while there's a choice, and its input is required only while there's none", async ({ page }) => {
    const { container, input } = await parts(page, "combobox-several");
    const valid = () => input.evaluate((node) => (node as HTMLInputElement).checkValidity());
    await expect(input).toHaveAttribute("aria-required", "true");
    expect(await valid()).toBe(true);
    await container.getByRole("button", { name: "Remove Ana Lopez" }).click();
    await expect.poll(valid).toBe(false);
    await expect(input).toHaveAttribute("aria-required", "true");
    await input.click();
    await page.keyboard.type("sam");
    await page.keyboard.press("Enter");
    await expect.poll(valid).toBe(true);
  });

  for (const [id, kind] of [
    ["combobox-default", "picking one"],
    ["combobox-several", "choosing several"],
  ] as const) {
    test(`read-only, ${kind}: the list stays closed, by a click or Down, so nothing can be picked`, async ({ page }) => {
      const { input, popup } = await parts(page, id);
      await input.evaluate((node) => ((node as HTMLInputElement).readOnly = true));
      await input.click();
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
      expect(await isOpen(popup)).toBe(false);
    });
  }

  test("several, with free text: Enter, a comma, and leaving the field make the text a choice; a pick, or an option's name typed, adds the option's value", async ({ page }) => {
    const { container, input, popup, listbox } = await parts(page, "combobox-several-with-free-text");
    // The tags show people's names; a form sends their addresses.
    await expect(chips(container)).toHaveText(["Ana Lopez", "Sam Rivera", "lee@partner.org", "kim@partner.org"]);
    const loaded = ["ana@example.com", "sam@example.com", "lee@partner.org", "kim@partner.org"];
    expect(await sent(container)).toEqual(loaded);
    await expect(input).not.toHaveAttribute("name");
    await input.click();
    await page.keyboard.type("jo@partner.org");
    await page.keyboard.press("Enter");
    await expect(chips(container).last()).toHaveText("jo@partner.org");
    await expect(input).toHaveValue("");
    await expect.poll(() => isOpen(popup)).toBe(false);

    // Pasted with commas between them, each address is a choice.
    await page.keyboard.insertText("max@partner.org, ray@partner.org, ");
    await expect(chips(container)).toHaveCount(7);
    await expect(input).toHaveValue("");

    // An address already chosen, through its option, isn't chosen twice.
    await page.keyboard.type("sam@example.com");
    await page.keyboard.press("Enter");
    await expect(chips(container)).toHaveCount(7);

    await input.fill("zoe@partner.org");
    await input.blur();
    await expect(chips(container)).toHaveCount(8);

    // Nothing is highlighted until Down; a pick adds the option's value,
    // shown by its name, and keeps the list open.
    await input.click();
    await page.keyboard.type("bill");
    expect(await activeLabel(input)).toBe(null);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(chips(container).last()).toHaveText("Billing team");
    expect(await isOpen(popup)).toBe(true);
    await expect(listbox.getByRole("option", { name: "Billing team" })).toHaveAttribute("aria-selected", "true");
    const all = [...loaded, "jo@partner.org", "max@partner.org", "ray@partner.org", "zoe@partner.org", "billing@example.com"];
    expect(await sent(container)).toEqual(all);

    // Typing an option's name, then Enter, is the same as picking it.
    await page.keyboard.press("Backspace");
    await expect(chips(container)).toHaveCount(8);
    await page.keyboard.type("billing team");
    await page.keyboard.press("Enter");
    await expect(chips(container).last()).toHaveText("Billing team");
    expect(await sent(container)).toEqual(all);
  });

  test("in a modal dialog, Escape closes the list, then empties the field, before the dialog closes", async ({ page }) => {
    const container = await example(page, "combobox-default");
    await container.locator(".play-demo").evaluate((demo) => {
      const field = [...demo.children];
      const dialog = document.createElement("dialog");
      dialog.id = "around";
      demo.append(dialog);
      dialog.append(...field);
      dialog.showModal();
    });
    const dialog = page.locator("#around");
    const input = dialog.getByRole("combobox");
    await input.click();
    await page.keyboard.type("lee");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    expect(await dialog.evaluate((node) => (node as HTMLDialogElement).open)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => dialog.evaluate((node) => (node as HTMLDialogElement).open)).toBe(false);
  });
});
