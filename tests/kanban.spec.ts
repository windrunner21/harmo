import { expect, type Locator, type Page } from "@playwright/test";
import { clickAt, example, onEachPlayground, rendered, test } from "./playgrounds.ts";

// What docs/patterns/kanban.md says: each column shows its count, and an
// Empty State while it has no cards; a card is dragged to another column with
// the pointer, by a long press on a touch screen, or from the keys, Escape
// putting it back; each card's menu moves it, focus going to the menu's
// button; a screen reader hears each step; a card that links to its page, or
// opens in place, does when it's pressed, not when it's dragged; an opened
// ticket's Drawer changes its status, assignee, and priority, and resolves
// it; where a card can't go, the column fades, and a Banner says why; a move
// the app turns down comes back; and one it asks about waits for the answer.
const columnNamed = (board: Locator, title: string) =>
  board.getByRole("group", { name: title, exact: true });
const cardsIn = (board: Locator, title: string) => columnNamed(board, title).locator(".hkanban-card-title");
const countOf = (board: Locator, title: string) => columnNamed(board, title).locator(".hkanban-column-header > .hbadge");
const heard = (page: Page, text: string | RegExp) => page.getByRole("status").filter({ hasText: text });

// Drags a card by its title to a column, as a mouse would, from its middle.
const drag = async (page: Page, board: Locator, card: string, to: string, release = true) => {
  const from = await board.locator(".hkanban-item").filter({ hasText: card }).locator(".hkanban-card-title").boundingBox();
  const column = await columnNamed(board, to).boundingBox();
  if (!from || !column) throw new Error("drag: the card or the column isn't shown");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 2 });
  await page.mouse.move(column.x + column.width / 2, column.y + 60, { steps: 10 });
  if (release) await page.mouse.up();
};

// A card's menu, opened, by the card's name, as its button names it.
const openMenu = async (board: Locator, card: string) => {
  await board.getByRole("button", { name: `Actions for ${card}` }).click();
  return board.getByRole("menu", { name: `Actions for ${card}` });
};

onEachPlayground("kanban", () => {
  test("each column has its title, its count, and an Empty State while it has no cards", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    await expect(board.getByRole("heading", { level: 2 })).toHaveText(["To do", "In progress", "Done"]);
    await expect(countOf(board, "To do")).toHaveText("3");
    await expect(countOf(board, "Done")).toHaveText("0");
    await expect(columnNamed(board, "Done").locator(".hempty-state")).toBeVisible();
    await expect(columnNamed(board, "To do").locator(".hempty-state")).toBeHidden();
    await expect(board.getByRole("button", { name: "Move Write the delivery FAQ" })).toHaveAccessibleDescription(/press Space or Enter on its handle/);
  });

  test("dragged with the mouse to another column, a card moves there, and the counts follow", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    await drag(page, board, "Photograph the autumn menu", "Done", false);
    await expect(columnNamed(board, "Done")).toHaveAttribute("data-over", "allowed");
    await expect(board.locator(".hkanban-item[data-dragging]")).toHaveCount(1);
    await page.mouse.up();
    await expect(cardsIn(board, "Done")).toHaveText(["Photograph the autumn menu"]);
    await expect(countOf(board, "To do")).toHaveText("2");
    await expect(countOf(board, "Done")).toHaveText("1");
    await expect(columnNamed(board, "Done").locator(".hempty-state")).toBeHidden();
    await expect(columnNamed(board, "Done")).not.toHaveAttribute("data-over");
    await expect(heard(page, "Dropped Photograph the autumn menu in Done, 1 of 1.")).toHaveCount(1);
  });

  test("Escape, while a card is dragged, puts it back", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    await drag(page, board, "Photograph the autumn menu", "In progress", false);
    await expect(cardsIn(board, "In progress")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(cardsIn(board, "To do")).toHaveText(["Photograph the autumn menu", "Write the delivery FAQ", "Send the October newsletter"]);
    await expect(countOf(board, "In progress")).toHaveText("2");
  });

  test("from the keys, Space picks a card up by its handle, the arrows move it, and Space drops it, focus staying on the handle", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    const handle = board.getByRole("button", { name: "Move Write the delivery FAQ" });
    await handle.focus();
    await page.keyboard.press("Space");
    await expect(heard(page, "Picked up Write the delivery FAQ, in To do, 2 of 3.")).toHaveCount(1);
    // Once the board has rendered the drag, which measures the columns again:
    // a person can't press an arrow sooner.
    await expect(board.locator(".hkanban-overlay")).toBeVisible();
    await rendered(page);
    await page.keyboard.press("ArrowRight");
    await expect(cardsIn(board, "In progress")).toContainText(["Write the delivery FAQ"]);
    await page.keyboard.press("Space");
    await expect(countOf(board, "In progress")).toHaveText("3");
    await expect(countOf(board, "To do")).toHaveText("2");
    await expect(heard(page, /Dropped Write the delivery FAQ in In progress, \d of 3\./)).toHaveCount(1);
    await expect(board.getByRole("button", { name: "Move Write the delivery FAQ" })).toBeFocused();
  });

  test("from the keys, Escape puts the card back", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    await board.getByRole("button", { name: "Move Write the delivery FAQ" }).focus();
    await page.keyboard.press("Space");
    await expect(heard(page, "Picked up Write the delivery FAQ, in To do, 2 of 3.")).toHaveCount(1);
    // Once the board has rendered the drag, which measures the columns again:
    // a person can't press an arrow sooner.
    await expect(board.locator(".hkanban-overlay")).toBeVisible();
    await rendered(page);
    await page.keyboard.press("ArrowRight");
    await expect(countOf(board, "In progress")).toHaveText("3");
    await page.keyboard.press("Escape");
    await expect(cardsIn(board, "To do")).toHaveText(["Photograph the autumn menu", "Write the delivery FAQ", "Send the October newsletter"]);
    await expect(countOf(board, "In progress")).toHaveText("2");
    await expect(heard(page, "Write the delivery FAQ is back in To do, 2 of 3.")).toHaveCount(1);
  });

  test("a card's menu moves it, says so, and focuses its menu's button", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    const menu = await openMenu(board, "Write the delivery FAQ");
    await expect(menu.getByRole("menuitem")).toHaveText(["Delete", "Move up", "Move down", "Move to In progress", "Move to Done"]);
    await clickAt(page, menu.getByRole("menuitem", { name: "Move to Done" }));
    await expect(cardsIn(board, "Done")).toHaveText(["Write the delivery FAQ"]);
    await expect(board.getByRole("button", { name: "Actions for Write the delivery FAQ" })).toBeFocused();
    await expect(board.locator(".hkanban-status")).toHaveText("Moved Write the delivery FAQ to Done, 1 of 1.");

    const menu2 = await openMenu(board, "Send the October newsletter");
    await clickAt(page, menu2.getByRole("menuitem", { name: "Move up" }));
    await expect(cardsIn(board, "To do")).toHaveText(["Send the October newsletter", "Photograph the autumn menu"]);

    const menu3 = await openMenu(board, "Photograph the autumn menu");
    await clickAt(page, menu3.getByRole("menuitem", { name: "Delete" }));
    await expect(cardsIn(board, "To do")).toHaveText(["Send the October newsletter"]);
    await expect(countOf(board, "To do")).toHaveText("1");
  });

  test("a card that opens does when it's pressed, and not when it's dragged", async ({ page }) => {
    const board = (await example(page, "kanban-support-tickets")).getByRole("region", { name: "Support tickets" });
    await board.getByRole("button", { name: "Refund for a missed delivery", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Refund for a missed delivery" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAccessibleDescription("#1031 · Priya Nair");
    await expect(drawer).toContainText("No one came on Monday, and I was home all morning.");
    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer).toBeHidden();

    await drag(page, board, "Gift card code doesn't work", "Waiting on customer");
    await expect(cardsIn(board, "Waiting on customer")).toContainText(["Gift card code doesn't work"]);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  // The playground keeps a demo's links from leaving it, so the link's
  // presses are counted.
  test("a card that links to its page is pressed from anywhere on it, and not when it's dragged", async ({ page }) => {
    const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
    const link = board.getByRole("link", { name: "Write the delivery FAQ" });
    await expect(link).toHaveAttribute("href", "#tasks/faq");
    await link.evaluate((node) => {
      const counted = window as unknown as { pressed: number };
      counted.pressed = 0;
      node.addEventListener("click", () => counted.pressed++);
    });
    const pressed = () => page.evaluate(() => (window as unknown as { pressed: number }).pressed);
    const footer = await board.locator(".hkanban-item").filter({ hasText: "Write the delivery FAQ" }).locator(".hkanban-card-footer").boundingBox();
    if (!footer) throw new Error("the card's footer isn't shown");
    await page.mouse.click(footer.x + footer.width / 2, footer.y + footer.height / 2);
    expect(await pressed()).toBe(1);
    await drag(page, board, "Write the delivery FAQ", "Done");
    await expect(cardsIn(board, "Done")).toHaveText(["Write the delivery FAQ"]);
    expect(await pressed()).toBe(1);
  });

  test("an opened ticket's Drawer changes it, and the card follows; it resolves once it's assigned", async ({ page }) => {
    const board = (await example(page, "kanban-support-tickets")).getByRole("region", { name: "Support tickets" });
    await board.getByRole("button", { name: "Order arrived without the eggs", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Order arrived without the eggs" });
    const status = drawer.getByRole("combobox", { name: "Status" });
    const assignee = drawer.getByRole("combobox", { name: "Assignee" });
    await expect(status).toHaveText("Open");
    await expect(assignee).toHaveText("Unassigned");
    await expect(drawer.getByRole("radio", { name: "High" })).toBeChecked();
    await expect(drawer.getByRole("link", { name: "Open ticket" })).toHaveAttribute("href", "#tickets/1042");

    await drawer.getByRole("button", { name: "Resolve" }).click();
    await expect(status).toHaveAccessibleDescription("Assign ticket 1042 to someone before resolving it.");
    await expect(cardsIn(board, "Open")).toContainText(["Order arrived without the eggs"]);

    await drawer.getByRole("button", { name: "Assign to me" }).click();
    await expect(assignee).toHaveText("Ana Petrova");
    await expect(drawer.getByRole("button", { name: "Assign to me" })).toBeDisabled();
    await expect(status).toHaveAccessibleDescription("");
    await drawer.getByText("Urgent", { exact: true }).click();
    const card = board.locator(".hkanban-item").filter({ hasText: "Order arrived without the eggs" });
    await expect(card.getByRole("img", { name: "Ana Petrova" })).toBeVisible();
    await expect(card.locator(".htag")).toHaveText("Urgent");

    await drawer.getByRole("button", { name: "Resolve" }).click();
    await expect(drawer.getByRole("button", { name: "Resolve" })).toHaveAttribute("aria-busy", "true");
    await expect(drawer).toBeHidden();
    await expect(cardsIn(board, "Resolved")).toContainText(["Order arrived without the eggs"]);
  });

  test("a status chosen in the Drawer that doesn't save comes back, and the field says why", async ({ page }) => {
    const board = (await example(page, "kanban-support-tickets")).getByRole("region", { name: "Support tickets" });
    await board.getByRole("button", { name: "Can't change my delivery window", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Can't change my delivery window" });
    const status = drawer.getByRole("combobox", { name: "Status" });
    await status.click();
    await clickAt(page, drawer.getByRole("option", { name: "Waiting on customer" }));
    await expect(countOf(board, "Waiting on customer")).toHaveText("2");
    await expect(countOf(board, "Waiting on customer")).toHaveText("1");
    await expect(status).toHaveText("Open");
    await expect(status).toHaveAccessibleDescription("Sam is editing ticket 1039. Try again once they're done.");
  });

  test.describe("on a touch screen", () => {
    test.use({ hasTouch: true });

    test("a long press drags a card, and a swipe scrolls the page instead", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Only Chromium can send a touch that moves");
      const board = (await example(page, "kanban-task-board")).getByRole("region", { name: "Website launch" });
      const cdp = await page.context().newCDPSession(page);
      const touch = (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) =>
        cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
      const title = board.locator(".hkanban-item").filter({ hasText: "Photograph the autumn menu" }).locator(".hkanban-card-title");

      const swiped = await title.boundingBox();
      if (!swiped) throw new Error("the card isn't shown");
      const before = await page.evaluate(() => scrollY);
      await touch("touchStart", swiped.x + 30, swiped.y + 10);
      for (let step = 1; step <= 8; step++) await touch("touchMove", swiped.x + 30, swiped.y + 10 - step * 12);
      await touch("touchEnd");
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
      await expect(countOf(board, "To do")).toHaveText("3");
      // Once the page has stopped scrolling: a touch while it coasts can't stop it.
      let last = -1;
      await expect.poll(async () => {
        const now = await page.evaluate(() => scrollY);
        const still = now === last;
        last = now;
        return still;
      }).toBe(true);

      await title.evaluate((node) => node.scrollIntoView({ block: "center" }));
      const pressed = await title.boundingBox();
      const done = await columnNamed(board, "Done").boundingBox();
      if (!pressed || !done) throw new Error("the card or Done isn't shown");
      await touch("touchStart", pressed.x + 30, pressed.y + 10);
      await page.waitForTimeout(400);
      for (let step = 1; step <= 10; step++) {
        await touch("touchMove", pressed.x + 30 + ((done.x + 60 - pressed.x - 30) * step) / 10, pressed.y + 10);
      }
      await expect(columnNamed(board, "Done")).toHaveAttribute("data-over", "allowed");
      await touch("touchEnd");
      await expect(cardsIn(board, "Done")).toHaveText(["Photograph the autumn menu"]);
    });
  });

  test("where a card can't go, the column fades as it's dragged over, and dropped there, it comes back and a Banner says why", async ({ page }) => {
    const board = (await example(page, "kanban-support-tickets")).getByRole("region", { name: "Support tickets" });
    await drag(page, board, "Order arrived without the eggs", "Resolved", false);
    await expect(columnNamed(board, "Resolved")).toHaveAttribute("data-over", "refused");
    await expect(cardsIn(board, "Resolved")).toHaveCount(1);
    await page.mouse.up();
    await expect(cardsIn(board, "Open")).toHaveText(["Order arrived without the eggs", "Can't change my delivery window"]);
    const banner = board.locator(".hbanner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Assign ticket 1042 to someone before resolving it.");
    await banner.getByRole("button", { name: "Dismiss" }).click();
    await expect(banner).toBeHidden();

    const menu = await openMenu(board, "Ticket 1042, Order arrived without the eggs");
    await clickAt(page, menu.getByRole("menuitem", { name: "Move to Resolved" }));
    await expect(banner).toContainText("Assign ticket 1042 to someone before resolving it.");
    await expect(countOf(board, "Resolved")).toHaveText("1");
  });

  test("a move the app turns down comes back, and the Banner says why", async ({ page }) => {
    const board = (await example(page, "kanban-support-tickets")).getByRole("region", { name: "Support tickets" });
    const menu = await openMenu(board, "Ticket 1039, Can't change my delivery window");
    await clickAt(page, menu.getByRole("menuitem", { name: "Move to Waiting on customer" }));
    await expect(countOf(board, "Waiting on customer")).toHaveText("2");
    await expect(countOf(board, "Waiting on customer")).toHaveText("1");
    await expect(cardsIn(board, "Open")).toHaveText(["Order arrived without the eggs", "Can't change my delivery window"]);
    await expect(board.locator(".hbanner")).toContainText("Sam is editing ticket 1039. Try again once they're done.");
    await expect(board.locator(".hkanban-status")).toHaveText(/Sam is editing ticket 1039\. .*is back in Open, 2 of 2\./);

    const menu2 = await openMenu(board, "Ticket 1042, Order arrived without the eggs");
    await clickAt(page, menu2.getByRole("menuitem", { name: "Move to Waiting on customer" }));
    await page.waitForTimeout(800);
    await expect(cardsIn(board, "Waiting on customer")).toHaveText(["Order arrived without the eggs", "Refund for a missed delivery"]);
  });

  test("a move that asks first waits in its new column, and goes back if it's cancelled", async ({ page }) => {
    const container = await example(page, "kanban-confirm-before-done");
    const board = container.getByRole("region", { name: "Website launch" });
    const menu = await openMenu(board, "Photograph the autumn menu");
    await clickAt(page, menu.getByRole("menuitem", { name: "Move to Done" }));
    const dialog = page.getByRole("dialog", { name: "Mark “Photograph the autumn menu” as done?" });
    await expect(dialog).toBeVisible();
    await expect(cardsIn(board, "Done")).toHaveText(["Photograph the autumn menu"]);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(cardsIn(board, "To do")).toHaveText(["Photograph the autumn menu", "Write the delivery FAQ", "Send the October newsletter"]);

    const menu2 = await openMenu(board, "Photograph the autumn menu");
    await clickAt(page, menu2.getByRole("menuitem", { name: "Move to Done" }));
    await dialog.getByRole("button", { name: "Mark as done" }).click();
    await expect(dialog).toBeHidden();
    await expect(cardsIn(board, "Done")).toHaveText(["Photograph the autumn menu"]);
    await expect(countOf(board, "To do")).toHaveText("2");
  });
});
