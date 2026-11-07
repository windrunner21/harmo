import { expect, type Locator, type Page } from "@playwright/test";
import { expectActive, expectChosen } from "./lists.ts";
import { boxes, clickAt, example, onEachPlayground, openPopup, pointAt, settled, test } from "./playgrounds.ts";

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
