import { expect, type Page } from "@playwright/test";
import { expectActive } from "./lists.ts";
import { boxes, example, onEachPlayground, openPopup, settled, test } from "./playgrounds.ts";

// What docs/components/language-picker.md says a script does, on the Language
// Picker page.
onEachPlayground("language-picker", () => {
  test("a button named by its label, showing the language in use in its own", async ({ page }) => {
    const { trigger } = await picker(page, "language-picker-default", "Language");
    await expect(trigger).toHaveAttribute("data-variant", "tertiary");
    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await expect(trigger.locator('.hbutton-label > [lang="en"]')).toHaveText("English");
  });

  test("choosing a language shows it in the button, in its own language, and closes", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-default", "Language");
    await trigger.click();
    await listbox.getByRole("option", { name: "Français" }).click();
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger.locator(".hbutton-label > [lang]")).toHaveAttribute("lang", "fr");
    await expect(trigger.locator(".hbutton-label")).toHaveText("Français");
    await expect(listbox.getByRole("option", { name: "Français" })).toHaveAttribute("aria-selected", "true");
  });

  // In React, the example's value is its own state, which only onValueChange sets,
  // so the button shows a choice only if your app was told of it.
  test("your app is told of the language chosen, and the button follows its value", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-default", "Language");
    await trigger.click();
    await settled(openPopup(container));
    await listbox.getByRole("option", { name: "Español" }).click();
    await expect(trigger.locator('.hbutton-label > [lang="es"]')).toHaveText("Español");
    await trigger.click();
    await expect(listbox.getByRole("option", { name: "Español" })).toHaveAttribute("aria-selected", "true");
    await expect(listbox.getByRole("option", { name: "English" })).toHaveAttribute("aria-selected", "false");
  });

  test("names too long for the button end with an ellipsis, inside it", async ({ page }) => {
    const { trigger } = await picker(page, "language-picker-by-region", "Region and language");
    await trigger.evaluate((n) => ((n as HTMLElement).style.maxInlineSize = "8rem"));
    const [button, chevron] = await boxes(trigger, trigger.locator(".hexpand-chevron"));
    expect(chevron!.x + chevron!.width).toBeLessThanOrEqual(button!.x + button!.width);
    const label = trigger.locator(".hbutton-label");
    await expect(label).toHaveCSS("text-overflow", "ellipsis");
    expect(await label.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true);
  });

  test("keys open it, typing jumps to a language by its own name, and Enter chooses", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-default", "Language");
    await trigger.focus();
    await page.keyboard.press("d");
    await expect(openPopup(container)).toHaveCount(1);
    await expectActive(trigger, listbox.getByRole("option", { name: "Deutsch" }));
    await page.keyboard.press("Enter");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger.locator(".hbutton-label")).toHaveText("Deutsch");
  });

  test("each name is marked with its language, and a description with the page's", async ({ page }) => {
    const { trigger, listbox } = await picker(page, "language-picker-names-in-the-page-s-language", "Language");
    await trigger.click();
    const option = listbox.getByRole("option", { name: "Deutsch German" });
    await expect(option.locator('.hoption-label > [lang="de"]')).toHaveText("Deutsch");
    expect(await option.locator(".hoption-description").evaluate((node) => node.closest("[lang]")?.getAttribute("lang"))).not.toBe("de");
  });

  test("by region, the button shows the region, then the language in parentheses", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    const region = trigger.locator(".hlanguage-picker-region");
    const language = trigger.locator(".hbutton-label > [lang]");
    await expect(region).toHaveText("United States");
    await expect(language).toHaveAttribute("lang", "en-US");
    // What a screen reader hears as its value, with the parentheses CSS draws.
    await expect(trigger).toMatchAriaSnapshot('- combobox "Region and language": United States (English)');

    await trigger.click();
    await listbox.getByRole("group", { name: "Spain" }).getByRole("option", { name: "English" }).click();
    await expect(openPopup(container)).toHaveCount(0);
    await expect(region).toHaveText("Spain");
    await expect(language).toHaveAttribute("lang", "en-ES");
    await expect(language).toHaveText("English");
  });

  test("with regions, a panel: regions in columns, and their languages side by side", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    await trigger.click();
    await settled(openPopup(container));
    const groups = listbox.getByRole("group");
    await expect(groups).toHaveCount(8);
    const firstRow = await Promise.all([0, 1, 2, 3].map((index) => groups.nth(index).boundingBox()));
    expect(new Set(firstRow.map((box) => Math.round(box!.y))).size).toBe(1);
    // The panel keeps its width, moving to where it fits, so Switzerland's four
    // languages stay on one line, and nothing overflows.
    const swiss = await Promise.all([0, 1, 2, 3].map((index) => groups.nth(5).getByRole("option").nth(index).boundingBox()));
    expect(new Set(swiss.map((box) => Math.round(box!.y))).size).toBe(1);
    expect(await listbox.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(true);
    const popup = await openPopup(container).boundingBox();
    expect(popup!.x).toBeGreaterThanOrEqual(0);
    expect(popup!.x + popup!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test("the panel opens above, in the middle, when there's no room below", async ({ page }) => {
    const { container, trigger } = await picker(page, "language-picker-by-region", "Region and language");
    await trigger.evaluate((n) => n.scrollIntoView({ block: "end" }));
    await trigger.click();
    await settled(openPopup(container));
    const [button, panel] = await boxes(trigger, openPopup(container));
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(button!.y);
    expect(panel!.y).toBeGreaterThanOrEqual(0);
    const width = page.viewportSize()!.width;
    expect(Math.abs(panel!.x + panel!.width / 2 - width / 2)).toBeLessThan(2);
  });

  test("the region in use has a check in its flag's place", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    await trigger.click();
    await settled(openPopup(container));
    const region = (name: string) =>
      listbox.locator(".hoption-group").filter({ has: page.locator(".hoption-group-label", { hasText: name }) });
    const flag = (name: string) => region(name).locator(".hlanguage-picker-icon");
    const check = listbox.locator(".hoption-check:visible");
    await expect(check).toHaveCount(1);
    await expect(flag("United States")).toHaveCSS("visibility", "hidden");
    await expect(flag("Spain")).toHaveCSS("visibility", "visible");
    const [mark, place] = await boxes(check, flag("United States"));
    expect(Math.abs(mark!.x + mark!.width / 2 - (place!.x + place!.width / 2))).toBeLessThan(1);

    await listbox.getByRole("group", { name: "Spain" }).getByRole("option", { name: "English" }).click();
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger.locator(".hlanguage-picker-region")).toHaveText("Spain");
    await trigger.click();
    await expect(flag("Spain")).toHaveCSS("visibility", "hidden");
    await expect(flag("United States")).toHaveCSS("visibility", "visible");
    await expect(region("Spain").locator(".hoption-check:visible")).toHaveCount(1);
  });

  test("Left and Right move between languages in the panel", async ({ page }) => {
    const { trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    const unitedStates = listbox.getByRole("group", { name: "United States" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expectActive(trigger, unitedStates.getByRole("option", { name: "English" }));
    await page.keyboard.press("ArrowRight");
    await expectActive(trigger, unitedStates.getByRole("option", { name: "Español" }));
    await page.keyboard.press("ArrowLeft");
    await expectActive(trigger, unitedStates.getByRole("option", { name: "English" }));
    await page.keyboard.press("ArrowLeft");
    await expectActive(trigger, listbox.getByRole("group", { name: "United Kingdom" }).getByRole("option", { name: "English" }));
  });

  test("Left and Right with nothing highlighted go to the last and the first", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    await trigger.click();
    await settled(openPopup(container));
    const options = listbox.getByRole("option");
    // The pointer passes over an option and leaves the panel, taking the highlight.
    await options.first().hover();
    await page.mouse.move(1, 1);
    await expect(listbox.locator(".hoption[data-active]")).toHaveCount(0);
    await page.keyboard.press("ArrowLeft");
    await expectActive(trigger, options.last());
    await options.first().hover();
    await page.mouse.move(1, 1);
    await expect(listbox.locator(".hoption[data-active]")).toHaveCount(0);
    await page.keyboard.press("ArrowRight");
    await expectActive(trigger, options.first());
  });

  test("right to left, the check is on the right, and Left moves on", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await settled(openPopup(container));
    const unitedStates = listbox.getByRole("group", { name: "United States" });
    const region = listbox.locator(".hoption-group").filter({ has: page.getByRole("group", { name: "United States" }) });
    const [group, check] = await boxes(region, listbox.locator(".hoption-check:visible"));
    expect(group!.x + group!.width - (check!.x + check!.width)).toBeLessThan(4);
    await expectActive(trigger, unitedStates.getByRole("option", { name: "English" }));
    await page.keyboard.press("ArrowLeft");
    await expectActive(trigger, unitedStates.getByRole("option", { name: "Español" }));
    await page.keyboard.press("ArrowRight");
    await expectActive(trigger, unitedStates.getByRole("option", { name: "English" }));
  });

  test("a search finds languages by their region, and a hidden language in use gives back its flag", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-regions-with-search", "Region and language");
    await trigger.click();
    const search = container.getByRole("combobox", { name: "Search regions and languages" });
    await expect(search).toBeFocused();
    const flag = listbox.locator(".hoption-group").filter({ hasText: "United States" }).locator(".hlanguage-picker-icon");
    await expect(flag).toHaveCSS("visibility", "hidden");
    await search.fill("spain");
    await expect(listbox.getByRole("option")).toHaveText(["Español", "English"]);
    await expect(listbox.getByRole("group")).toHaveCount(1);

    // English, the language in use, doesn't match; Español does.
    await search.fill("españ");
    await expect(listbox.getByRole("group", { name: "United States" }).getByRole("option")).toHaveText(["Español"]);
    await expect(flag).toHaveCSS("visibility", "visible");
    await expect(listbox.locator(".hoption-check:visible")).toHaveCount(0);
    await search.fill("");
    await expect(flag).toHaveCSS("visibility", "hidden");
  });

  test("the check's circle keeps white readable, in light and dark", async ({ page }) => {
    const { trigger, listbox } = await picker(page, "language-picker-by-region", "Region and language");
    const fill = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-primary-fill)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await trigger.click();
    await expect(listbox.locator(".hoption-check:visible")).toHaveCSS("background-color", fill);
  });

  test("typing finds a name, not a flag put before it", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-default", "Language");
    await listbox.locator('[lang="fr"]').evaluate((name) =>
      name.before(Object.assign(document.createElement("span"), { textContent: "🇫🇷", ariaHidden: "true" })),
    );
    await trigger.focus();
    await page.keyboard.press("f");
    await expect(openPopup(container)).toHaveCount(1);
    await expectActive(trigger, listbox.getByRole("option", { name: "Français" }));
  });

  test("a search finds a language by its name in the page's language", async ({ page }) => {
    const { container, trigger, listbox } = await picker(page, "language-picker-with-search", "Language");
    await trigger.click();
    const search = container.getByRole("combobox", { name: "Search languages" });
    await expect(search).toBeFocused();
    await search.fill("日本");
    await expect(listbox.getByRole("option")).toHaveCount(1);
    await search.fill("japan");
    await expect(listbox.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger.locator('.hbutton-label > [lang="ja"]')).toHaveText("日本語");
  });

  test("open, it keeps the hover background", async ({ page }) => {
    const { trigger } = await picker(page, "language-picker-default", "Language");
    const hover = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-background-hover)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveCSS("background-color", hover);
  });

  test("right to left, the globe and the chevron swap sides", async ({ page }) => {
    const { trigger } = await picker(page, "language-picker-right-to-left", "اللغة");
    const [globe, label, chevron] = await boxes(trigger.locator(".hicon"), trigger.locator(".hbutton-label"), trigger.locator(".hexpand-chevron"));
    expect(globe!.x).toBeGreaterThan(label!.x);
    expect(chevron!.x).toBeLessThan(label!.x);
  });
});

const picker = async (page: Page, id: string, label: string) => {
  const container = await example(page, id);
  const trigger = container.getByRole("combobox", { name: label, exact: true });
  const listbox = container.getByRole("listbox", { includeHidden: true });
  return { container, trigger, listbox };
};
