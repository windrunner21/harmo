import { expect, type Locator, type Page } from "@playwright/test";
import { expectActive, expectChosen } from "./lists.ts";
import { animations, boxes, clickAt, example, onEachPlayground, openPopup, pointAt, release, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/listbox.md says a script does, on the Listbox page.
onEachPlayground("listbox", () => {
  test("opening moves focus to the list and highlights the selected option", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    await expectActive(listbox, listbox.getByRole("option", { name: "Last 30 days" }));
  });

  test("Down, Up, Home, and End move the highlight", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    const option = (name: string) => listbox.getByRole("option", { name });

    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, option("Last 90 days"));
    await page.keyboard.press("End");
    await expectActive(listbox, option("This year"));
    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, option("This year"));
    await page.keyboard.press("Home");
    await expectActive(listbox, option("Last 7 days"));
    await page.keyboard.press("ArrowUp");
    await expectActive(listbox, option("Last 7 days"));
  });

  test("the highlight scrolls into view", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single-grouped", "Channel");
    // Shorter than its options, so it scrolls whatever the fonts.
    await listbox.evaluate((element) => (element.style.maxBlockSize = "100px"));
    const option = (name: string) => listbox.getByRole("option", { name });

    await page.keyboard.press("End");
    await expectActive(listbox, option("Outlook"));
    await expectInView(listbox, option("Outlook"));
    await page.keyboard.press("Home");
    await expectActive(listbox, option("All channels"));
    await expectInView(listbox, option("All channels"));
  });

  test("typing jumps to the next option starting with the letter", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    const option = (name: string) => listbox.getByRole("option", { name });
    await page.keyboard.press("t");
    await expectActive(listbox, option("This year"));
    await page.keyboard.press("Escape");

    // Repeating a letter cycles through the options that start with it.
    await openList(page, "listbox-single", "Period");
    await page.keyboard.press("l");
    await expectActive(listbox, option("Last 90 days"));
    await page.keyboard.press("l");
    await expectActive(listbox, option("Last 7 days"));
    await page.keyboard.press("l");
    await expectActive(listbox, option("Last 30 days"));
  });

  test("letters typed together search as one, and a pause starts over", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-long-options", "Sender number");
    const option = (start: string) => listbox.getByRole("option", { name: new RegExp(`^\\${start}`) });
    // From +49: "+" moves on to +41, "+4" stays there, and "+44" finds +44.
    await page.keyboard.type("+44");
    await expectActive(listbox, option("+44"));

    // Longer than the half-second pause, so it can't end early.
    await page.waitForTimeout(600);
    await page.keyboard.press("+");
    await expectActive(listbox, option("+49"));
  });

  test("Enter chooses, closes the popup, and returns focus to the trigger", async ({ page }) => {
    const { container, trigger } = await openList(page, "listbox-single", "Period");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expectChosen(container, ["Last 90 days"]);
  });

  test("Space chooses in a single-select", async ({ page }) => {
    const { container } = await openList(page, "listbox-single", "Period");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press(" ");

    await expect(openPopup(container)).toHaveCount(0);
    await expectChosen(container, ["Last 7 days"]);
  });

  test("a click chooses and closes, even on the chosen option", async ({ page }) => {
    for (let time = 0; time < 2; time++) {
      const { container, listbox } = await openList(page, "listbox-single-grouped", "Channel");
      await clickAt(page, listbox.getByRole("option", { name: "Telegram" }));
      await expect(openPopup(container)).toHaveCount(0);
      await expectChosen(container, ["Telegram"]);
    }
  });

  test("the pointer highlights the option under it, and leaving clears it", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    await pointAt(page, listbox.getByRole("option", { name: "This year" }));
    await expectActive(listbox, listbox.getByRole("option", { name: "This year" }));
    await page.mouse.move(0, 0);
    await expect(listbox.locator("[data-active]")).toHaveCount(0);
    await expect(listbox).not.toHaveAttribute("aria-activedescendant");
  });

  test("disabled options are skipped and can't be chosen", async ({ page }) => {
    const { container, listbox } = await openList(page, "listbox-disabled-options", "Source");
    const option = (name: string) => listbox.getByRole("option", { name });

    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, option("Instagram"));
    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, option("Instagram"));
    await page.keyboard.press("End");
    await expectActive(listbox, option("Instagram"));

    await pointAt(page, option("SMS"));
    await expect(listbox.locator("[data-active]")).toHaveCount(0);
    // Playwright's click won't press an aria-disabled element.
    await page.mouse.down();
    await page.mouse.up();
    await expect(openPopup(container)).toHaveCount(1);
    await expectChosen(container, ["WhatsApp"]);
  });

  test("a multi-select toggles with Space, Enter, and clicks, and stays open", async ({ page }) => {
    const { container, listbox } = await openList(page, "listbox-multiple", "Status");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(" ");
    await expectChosen(container, ["Delivered"]);
    await page.keyboard.press("Enter");
    await expectChosen(container, ["Delivered", "Read"]);
    await clickAt(page, listbox.getByRole("option", { name: "Pending" }));
    await expectChosen(container, ["Delivered", "Read", "Pending"]);
    await expect(openPopup(container)).toHaveCount(1);
    await expect(listbox).toBeFocused();
  });

  test("in a multi-select, a disabled option's checkbox dims, as a disabled Checkbox does", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-multiple", "Status");
    const option = listbox.getByRole("option", { name: "Pending" });
    const opacity = () => option.locator(".hoption-checkbox").evaluate((node) => Number(getComputedStyle(node).opacity));
    expect(await opacity()).toBe(1);
    await option.evaluate((node) => node.setAttribute("aria-disabled", "true"));
    const dimmed = await page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--harmo-opacity-disabled")));
    expect(dimmed).toBeLessThan(1);
    expect(await opacity()).toBe(dimmed);
  });

  test("an option has 8px 10px padding and 10px between its parts, and one without the check keeps 10px and 1em more for it", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    const spacing = (name: string) =>
      listbox.getByRole("option", { name }).evaluate((node) => {
        const { paddingTop, paddingBottom, paddingLeft, paddingRight, columnGap, fontSize } = getComputedStyle(node);
        return { paddingTop, paddingBottom, paddingLeft, paddingRight, columnGap, check: `${10 + 10 + parseFloat(fontSize)}px` };
      });
    const chosen = await spacing("Last 30 days");
    expect(chosen).toMatchObject({ paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", paddingRight: "10px", columnGap: "10px" });
    const other = await spacing("Last 7 days");
    expect(other.paddingRight).toBe(other.check);
  });

  test("a badge sits 16px after its label, and a search row's field 6px after its icon", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-disabled-options", "Source");
    const viber = listbox.getByRole("option", { name: /^Viber/ });
    const [label, badge] = await boxes(viber.locator(".hoption-label"), viber.locator(".hoption-badge"));
    expect(badge.x - (label.x + label.width)).toBeCloseTo(16, 0);
    await page.keyboard.press("Escape");

    const { container, search } = await openList(page, "listbox-single-with-search", "Assignee");
    const [icon, field] = await boxes(container.locator(".hlistbox-search > .hicon"), search);
    expect(field.x - (icon.x + icon.width)).toBeCloseTo(6, 0);
  });

  test("a click the app stops, with preventDefault() in its own handler on the option, chooses nothing", async ({ page }) => {
    const { container, listbox } = await openList(page, "listbox-single", "Period");
    const option = listbox.getByRole("option", { name: "Last 7 days" });
    // On the option, so before the list's own handling, as an Option's
    // onClick is in React.
    await option.evaluate((node) => node.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await clickAt(page, option);
    await expect(openPopup(container)).toHaveCount(1);
    await expectChosen(container, ["Last 30 days"]);

    await clickAt(page, option);
    await expectChosen(container, ["Last 7 days"]);
  });

  test("a key the app stops, with preventDefault() in the list's onKeyDown, doesn't move the highlight", async ({ page }) => {
    test.skip(!test.info().titlePath.includes("react"), "onKeyDown is a React prop; in HTML, the app's own listener on the list comes after the example script's");
    const { listbox } = await openList(page, "listbox-single", "Period");
    // On the list itself, so before React hands the key to the Listbox.
    await listbox.evaluate((node) => node.addEventListener("keydown", (event) => event.preventDefault(), { once: true }));
    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, listbox.getByRole("option", { name: "Last 30 days" }));
    await page.keyboard.press("ArrowDown");
    await expectActive(listbox, listbox.getByRole("option", { name: "Last 90 days" }));
  });

  test("Tab moves focus on, to its footer, and closes the popup once focus has left it", async ({ page }) => {
    const { container } = await openList(page, "listbox-multiple-with-a-footer", "Language");
    const popup = container.locator(".hpopup");
    await page.keyboard.press("Tab");
    await expect(container.getByRole("button", { name: "Clear filters" })).toBeFocused();
    await expect(openPopup(container)).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(openPopup(container)).toHaveCount(0);
    expect(await popup.evaluate((node) => node.contains(document.activeElement))).toBe(false);
  });

  test("Tab and Shift+Tab from the list close its popup", async ({ page }) => {
    const { container, trigger } = await openList(page, "listbox-single", "Period");
    await page.keyboard.press("Shift+Tab");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await openList(page, "listbox-single", "Period");
    await page.keyboard.press("Tab");
    await expect(openPopup(container)).toHaveCount(0);
    expect(await container.locator(".hpopup").evaluate((node) => node.contains(document.activeElement))).toBe(false);
  });

  test("a multi-select's checkbox fades its fill and border in 150ms", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-multiple", "Status");
    const checkbox = listbox.getByRole("option", { name: "Delivered" }).locator(".hoption-checkbox");
    const style = await checkbox.evaluate((node) => {
      const { transitionProperty, transitionDuration } = getComputedStyle(node);
      return { transitionProperty, transitionDuration };
    });
    expect(style).toEqual({ transitionProperty: "background-color, border-color", transitionDuration: "0.15s, 0.15s" });

    await slowDown(checkbox);
    await page.keyboard.press(" ");
    expect(await animations(checkbox), "fading").toBeGreaterThan(0);
    await release(checkbox);
  });

  test("a footer's Clear filters clears the selection", async ({ page }) => {
    const { container } = await openList(page, "listbox-multiple-with-a-footer", "Language");
    await clickAt(page, container.getByRole("button", { name: "Clear filters" }));
    await expectChosen(container, []);
  });

  test("a truncated option's title shows its whole text, until it fits", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-long-options", "Sender number");
    const label = (start: string) =>
      listbox.getByRole("option", { name: new RegExp(`^\\${start}`) }).locator(".hoption-label");
    await expect(label("+41")).toHaveAttribute(
      "title",
      "+41 44 7654321 · Customer support for Germany, Austria, Switzerland, Liechtenstein, and Luxembourg",
    );
    await expect(label("+49")).not.toHaveAttribute("title");

    // A narrow window truncates the short labels too; a wide one again fits
    // them.
    await page.setViewportSize({ width: 200, height: 720 });
    await expect(label("+49")).toHaveAttribute("title", "+49 30 1234567 · Support");
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(label("+49")).not.toHaveAttribute("title");
  });

  test("a label cut short as its list narrows, with the window as it was, gets its whole text as a title", async ({ page }) => {
    const { container, listbox } = await openList(page, "listbox-long-options", "Sender number");
    const label = listbox.getByRole("option", { name: /^\+49/ }).locator(".hoption-label");
    await expect(label).not.toHaveAttribute("title");
    await openPopup(container).evaluate((popup) => Object.assign((popup as HTMLElement).style, { minInlineSize: "0", inlineSize: "120px" }));
    await expect(label).toHaveAttribute("title", "+49 30 1234567 · Support");
  });

  test("the pointer over a group's label, between options, clears the highlight", async ({ page }) => {
    const { listbox, search } = await openList(page, "listbox-single-grouped-with-search", "Inbox");
    const whatsApp = listbox.getByRole("option", { name: "WhatsApp" });
    await pointAt(page, whatsApp);
    await expectActive(search, whatsApp);
    await pointAt(page, listbox.getByText("Email", { exact: true }));
    await expect(listbox.locator("[data-active]")).toHaveCount(0);
    await expect(search).not.toHaveAttribute("aria-activedescendant");
  });

  test("a focused list has no ring of its own", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single", "Period");
    await expect(listbox).toHaveCSS("outline-style", "none");
  });

  test("with keyboard focus on the list and nothing highlighted, its popup shows the focus ring", async ({ page }) => {
    const container = await example(page, "listbox-single");
    const listbox = container.getByRole("listbox", { includeHidden: true });
    const popup = container.locator(".hpopup");
    await container.getByRole("button", { name: "Period" }).focus();
    await page.keyboard.press("Enter");
    await expect(listbox).toBeFocused();
    await expect(popup).toHaveCSS("outline-style", "none");

    await pointAt(page, listbox.getByRole("option", { name: "This year" }));
    await page.mouse.move(0, 0);
    await expect(listbox.locator("[data-active]")).toHaveCount(0);
    await expect(popup).toHaveCSS("outline-style", "solid");

    await page.keyboard.press("ArrowDown");
    await expect(popup).toHaveCSS("outline-style", "none");
  });

  test("a list fills a popup wider than its cap", async ({ page }) => {
    const { container, trigger, listbox } = await openList(page, "listbox-long-options", "Sender number");
    await trigger.evaluate((button) => {
      button.style.inlineSize = "40rem";
    });
    const popup = openPopup(container);
    await expect.poll(async () => (await boxes(popup))[0].width).toBeCloseTo(640, 0);
    const [{ width: popupWidth }, { width: listWidth }] = await boxes(popup, listbox);
    expect(listWidth).toBeCloseTo(popupWidth - 2, 0);
  });

  test("on a phone, a long list stays 8px from each edge of the window", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    const { container } = await openList(page, "listbox-long-options", "Sender number");
    const [popup] = await boxes(openPopup(container));
    expect(popup.x).toBeCloseTo(8, 0);
    expect(popup.x + popup.width).toBeCloseTo(382, 0);
  });

  test("a search row takes focus, filters, and highlights the first match", async ({ page }) => {
    const { container, trigger, listbox, search } = await openList(page, "listbox-single-with-search", "Assignee");
    await expectActive(search, listbox.getByRole("option", { name: "Jane Smith" }));

    await page.keyboard.type("an");
    await expect(listbox.getByRole("option")).toHaveText(["Jane Smith", "Ana Souza"]);
    await expectActive(search, listbox.getByRole("option", { name: "Jane Smith" }));
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expectChosen(container, ["Ana Souza"]);
  });

  test("a search hides the groups it leaves empty", async ({ page }) => {
    const { listbox } = await openList(page, "listbox-single-grouped-with-search", "Inbox");
    await page.keyboard.type("gm");
    await expect(listbox.getByRole("option")).toHaveText(["Gmail"]);
    await expect(listbox.getByRole("group")).toHaveCount(1);
    await expect(listbox.getByRole("group", { name: "Email" })).toBeVisible();
    await expect(listbox.getByText("Messaging")).toBeHidden();
  });

  test("with no match, the empty message shows and Enter does nothing", async ({ page }) => {
    const { container, listbox } = await openList(page, "listbox-single-with-search", "Assignee");
    await page.keyboard.type("zzz");
    await expect(listbox.getByRole("option")).toHaveCount(0);
    await expect(container.locator(".hlistbox-empty")).toHaveText("No agents found");

    await page.evaluate(() =>
      addEventListener("keydown", (event) => ((window as { entered?: boolean }).entered = event.defaultPrevented), { once: true }),
    );
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => (window as { entered?: boolean }).entered), "Enter prevented").toBe(true);
    await expect(openPopup(container)).toHaveCount(1);
    await expectChosen(container, ["Jane Smith"]);
  });

  test("each opening starts from the whole list", async ({ page }) => {
    const { container } = await openList(page, "listbox-single-with-search", "Assignee");
    await page.keyboard.type("zzz");
    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);

    const { listbox, search } = await openList(page, "listbox-single-with-search", "Assignee");
    await expect(search).toHaveValue("");
    await expect(listbox.getByRole("option")).toHaveCount(5);
    // The status for no matches stays in the page, empty.
    await expect(container.locator(".hlistbox-empty")).toHaveText("");
  });

  test("a popover opening and closing inside its popup leaves the search and the highlight as they are", async ({ page }) => {
    const { container, listbox, search } = await openList(page, "listbox-single-with-search", "Assignee");
    const ana = listbox.getByRole("option", { name: "Ana Souza" });
    await page.keyboard.type("an");
    await page.keyboard.press("ArrowDown");
    await expectActive(search, ana);

    await openPopup(container).evaluate((popup) => {
      const inner = document.createElement("div");
      inner.popover = "manual";
      popup.append(inner);
      inner.showPopover();
      inner.hidePopover();
      inner.remove();
    });
    await expect(search).toHaveValue("an");
    await expect(listbox.getByRole("option")).toHaveText(["Jane Smith", "Ana Souza"]);
    await expectActive(search, ana);
  });

  test("a search leaves hidden the options and groups the app hid", async ({ page }, info) => {
    // In React, an Option's or OptionGroup's hidden is a prop, which a search
    // never changes.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const assignees = await example(page, "listbox-single-with-search");
    await assignees.locator("#assignee-ana").evaluate((option) => ((option as HTMLElement).hidden = true));
    const { listbox } = await openList(page, "listbox-single-with-search", "Assignee");
    await page.keyboard.type("an");
    await expect(listbox.getByRole("option")).toHaveText(["Jane Smith"]);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await expect(listbox.getByRole("option")).toHaveCount(4);
    await page.keyboard.press("Escape");

    // Its options too, which count as hidden.
    const inboxes = await example(page, "listbox-single-grouped-with-search");
    await inboxes.locator(".hoption-group").filter({ hasText: "Messaging" }).evaluate((group) => ((group as HTMLElement).hidden = true));
    const { container, listbox: grouped } = await openList(page, "listbox-single-grouped-with-search", "Inbox");
    await page.keyboard.type("tel");
    await expect(grouped.getByRole("option")).toHaveCount(0);
    await expect(grouped.getByRole("group")).toHaveCount(0);
    await expect(container.locator(".hlistbox-empty")).toHaveText("No inboxes found");
  });

  test("with no message from the app, a search with no match shows no text of its own", async ({ page }, info) => {
    // The React Listbox requires emptyMessage with searchLabel.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    const container = await example(page, "listbox-single-with-search");
    await container.locator("[data-example-empty]").evaluate((search) => search.removeAttribute("data-example-empty"));
    const { listbox } = await openList(page, "listbox-single-with-search", "Assignee");
    await page.keyboard.type("zzz");
    await expect(listbox.getByRole("option")).toHaveCount(0);
    await expect(container.locator(".hlistbox-empty")).toHaveText("");
  });

  test("after a search, it opens on the side the whole list fits", async ({ page }) => {
    const { container, trigger } = await openList(page, "listbox-single-with-search", "Assignee");
    const popup = container.locator(".hpopup");
    await settled(popup);
    const [whole] = await boxes(popup);
    await page.keyboard.type("zzz");
    await expect(container.locator(".hlistbox-empty")).toBeVisible();
    const [filtered] = await boxes(popup);
    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);

    // Room below the trigger for the filtered list but not the whole one, so
    // the whole list must open above, and slide from there.
    const room = (whole.height + filtered.height) / 2 + 16;
    await trigger.evaluate((element, room) => {
      element.scrollIntoView({ block: "end" });
      scrollBy(0, room);
    }, room);
    await trigger.click();
    await expect(openPopup(container)).toHaveCount(1);
    await settled(popup);
    const [t, p] = await boxes(trigger, popup);
    expect(p.y + p.height, "the popup's bottom").toBeLessThanOrEqual(t.y);
    await expect(popup).toHaveAttribute("data-side", "top");
  });
});

// A Select with a search row, as Phone Input's country is, opens on the keys
// a plain one does.
onEachPlayground("phone-input", () => {
  test("a Select with a search row opens on Down and Up, as a plain one does, then moves focus to its search", async ({ page }) => {
    const container = await example(page, "phone-input-default");
    const trigger = container.getByRole("combobox", { name: "Country code" });
    const search = container.getByRole("combobox", { name: "Search countries", includeHidden: true });
    const listbox = container.getByRole("listbox", { includeHidden: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(openPopup(container)).toHaveCount(1);
    await expect(search).toBeFocused();
    await expectActive(search, listbox.locator('.hoption[aria-selected="true"]'));

    await page.keyboard.press("Escape");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(search).toBeFocused();
    await expectActive(search, listbox.locator(".hoption").first());
  });

  test("a Down the app stops on the trigger of a Select with a search row, with preventDefault() in its own handler, doesn't open it", async ({ page }) => {
    const container = await example(page, "phone-input-default");
    const trigger = container.getByRole("combobox", { name: "Country code" });
    await trigger.focus();
    await stopNextKey(trigger);
    await page.keyboard.press("ArrowDown");
    await expect(openPopup(container)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(openPopup(container)).toHaveCount(1);
  });
});

// The keys on a plain Select's trigger, which keeps focus while its list is
// open.
onEachPlayground("select", () => {
  test("a key the app stops on a Select's trigger, with preventDefault() in its own handler, doesn't open it or move its highlight", async ({ page }) => {
    const container = await example(page, "select-default");
    const trigger = container.getByRole("combobox", { name: "Channel" });
    const listbox = container.getByRole("listbox", { includeHidden: true });
    await trigger.focus();
    await stopNextKey(trigger);
    await page.keyboard.press("ArrowDown");
    await expect(openPopup(container)).toHaveCount(0);

    await page.keyboard.press("ArrowDown");
    await expect(openPopup(container)).toHaveCount(1);
    await expectActive(trigger, listbox.getByRole("option", { name: "WhatsApp" }));
    await stopNextKey(trigger);
    await page.keyboard.press("ArrowDown");
    await expectActive(trigger, listbox.getByRole("option", { name: "WhatsApp" }));
    await page.keyboard.press("ArrowDown");
    await expectActive(trigger, listbox.getByRole("option", { name: "Telegram" }));
  });
});

// Stands in for the app's own handler on a Select's trigger, stopping the
// next key with preventDefault() before the Select's own handling. In React,
// a listener on the trigger itself, which runs before React calls the
// trigger's onKeyDown, where the app's runs first; in HTML, one on the way
// down to the trigger, before the example script's on it.
const stopNextKey = (trigger: Locator) =>
  trigger.evaluate(
    (node, react) => {
      const stop = (event: Event) => event.preventDefault();
      if (react) node.addEventListener("keydown", stop, { once: true });
      else node.parentElement?.addEventListener("keydown", stop, { capture: true, once: true });
    },
    test.info().titlePath.includes("react"),
  );

// Opens an example's list with a click, as a person would, and waits until
// it's ready for keys, as a person sees it: focus in the search field if it
// has one, else the list, and an option highlighted.
const openList = async (page: Page, id: string, name: string) => {
  const container = await example(page, id);
  const trigger = container.getByRole("button", { name });
  const listbox = container.getByRole("listbox", { includeHidden: true });
  const search = container.getByRole("combobox", { includeHidden: true });
  await trigger.click();
  await expect((await search.count()) ? search : listbox).toBeFocused();
  await expect(listbox.locator(".hoption[data-active]")).toHaveCount(1);
  return { container, trigger, listbox, search };
};

// The option is wholly inside the list's scrolled box.
const expectInView = async (listbox: Locator, option: Locator) => {
  await expect
    .poll(async () => {
      const [list, item] = [await listbox.boundingBox(), await option.boundingBox()];
      return Boolean(list && item && item.y >= list.y - 1 && item.y + item.height <= list.y + list.height + 1);
    })
    .toBe(true);
};
