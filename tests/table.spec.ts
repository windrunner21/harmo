import { expect, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, settled, test } from "./playgrounds.ts";

// What docs/components/table.md says: named rows and columns, in Harmo's sizes;
// a row that's a link or a button all the way across; selecting rows, with focus
// looked after; choosing columns, remembered; pages, with a footer that stays in
// view; what shows with no rows; long text; and right to left.
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

onEachPlayground("table", () => {
  test("named rows and columns, in the sizes and colors", async ({ page }) => {
    const container = await example(page, "table-default");
    const table = container.getByRole("table", { name: "Tasks" });
    await expect(table.getByRole("columnheader")).toHaveText(["Task", "Status", "Due"]);
    const name = table.getByRole("rowheader", { name: "Write the brief" });
    const cell = table.getByRole("cell", { name: "Blocked" });
    const header = table.getByRole("columnheader", { name: "Status" });

    await expect(header).toHaveCSS("font-size", "12px");
    await expect(header).toHaveCSS("font-weight", "500");
    await expect(header).toHaveCSS("color", await color(page, "--harmo-color-text"));
    await expect(cell).toHaveCSS("font-size", "14px");
    await expect(cell).toHaveCSS("padding", "12px 16px");
    await expect(cell).toHaveCSS("color", await color(page, "--harmo-color-text-secondary"));
    await expect(cell).toHaveCSS("border-top-width", "1px");
    await expect(cell).toHaveCSS("border-top-color", await color(page, "--harmo-color-border"));
    await expect(name).toHaveCSS("font-weight", "500");
    await expect(name).toHaveCSS("color", await color(page, "--harmo-color-text"));
  });

  test("a column marked to stand out is heavier and darker than the rest", async ({ page }) => {
    const table = (await example(page, "table-a-column-that-stands-out")).getByRole("table");
    const owner = table.getByRole("cell", { name: "Ana" });
    const status = table.getByRole("cell", { name: "Active" });
    await expect(owner).toHaveCSS("font-weight", "500");
    await expect(owner).toHaveCSS("color", await color(page, "--harmo-color-text"));
    await expect(status).toHaveCSS("font-weight", "400");
    await expect(status).toHaveCSS("color", await color(page, "--harmo-color-text-secondary"));
  });

  test("a row that links is a link all the way across", async ({ page }) => {
    const container = await example(page, "table-rows-that-link");
    const link = container.getByRole("link", { name: "Review the designs" });
    await expect(link).toHaveAttribute("href", "?task=designs");
    await link.evaluate((node) =>
      node.addEventListener("click", (event) => {
        event.preventDefault();
        node.setAttribute("data-test-pressed", "");
      }),
    );
    // Forced, since it's the row's link or button that takes the press there.
    await container.getByRole("cell", { name: "Blocked" }).click({ force: true });
    await expect(link).toHaveAttribute("data-test-pressed", "");
  });

  test("hovered, a row that links shows it; focused, its ring goes around the row", async ({ page }) => {
    const container = await example(page, "table-rows-that-link");
    const row = container.getByRole("row", { name: /Write the brief/ });
    await row.hover();
    await expect(row).toHaveCSS("background-color", await color(page, "--harmo-color-background-hover"));

    const links = container.getByRole("link");
    await links.first().focus();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    const ring = await links.nth(1).evaluate((node) => {
      const { outlineStyle, outlineWidth, width, height } = getComputedStyle(node, "::after");
      const row = node.closest("tr")!.getBoundingClientRect();
      return { outlineStyle, outlineWidth, width: parseFloat(width), height: parseFloat(height), row: [row.width, row.height] };
    });
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineWidth).toBe("2px");
    expect(ring.width).toBeCloseTo(ring.row[0]!, 0);
    expect(ring.height).toBeCloseTo(ring.row[1]!, 0);
  });

  test("a row with an action is a button all the way across", async ({ page }) => {
    const container = await example(page, "table-rows-with-an-action");
    const status = container.locator('p[role="status"]');
    // Forced, since it's the row's link or button that takes the press there.
    await container.getByRole("cell", { name: "Blocked" }).click({ force: true });
    await expect(status).toHaveText("Opened Review the designs");
    await container.getByRole("button", { name: "Write the brief" }).focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText("Opened Write the brief");
  });

  test("selecting rows: named checkboxes, above the row's link, and the header follows", async ({ page }) => {
    const container = await example(page, "table-selecting-rows");
    const all = container.getByRole("checkbox", { name: "Select all tasks" });
    const brief = container.getByRole("checkbox", { name: "Select Write the brief" });
    const designs = container.getByRole("checkbox", { name: "Select Review the designs" });
    const release = container.getByRole("checkbox", { name: "Select Ship the release" });
    const indeterminate = () => all.evaluate((node: HTMLInputElement) => node.indeterminate);

    await brief.click();
    await expect(brief).toBeChecked();
    await expect(page).not.toHaveURL(/\?task=/);
    expect(await indeterminate()).toBe(true);
    await expect(all).not.toBeChecked();
    await expect(container.getByRole("status")).toHaveText("1 selected");

    await designs.check();
    await release.check();
    await expect(all).toBeChecked();
    expect(await indeterminate()).toBe(false);
    await expect(container.getByRole("status")).toHaveText("3 selected");

    await all.uncheck();
    await expect(brief).not.toBeChecked();
    await expect(container.getByRole("status")).toHaveCount(0);
    await expect(container.getByRole("button", { name: "Export" })).toBeVisible();

    await all.check();
    await expect(release).toBeChecked();
  });

  test("Deselect clears the rows, and focus goes to the checkbox in the header", async ({ page }) => {
    const container = await example(page, "table-selecting-rows");
    await container.getByRole("checkbox", { name: "Select Write the brief" }).check();
    await container.getByRole("button", { name: "Deselect" }).focus();
    await page.keyboard.press("Enter");
    await expect(container.getByRole("status")).toHaveCount(0);
    await expect(container.getByRole("checkbox", { name: "Select Write the brief" })).not.toBeChecked();
    await expect(container.getByRole("checkbox", { name: "Select all tasks" })).toBeFocused();
  });

  test("choosing columns: a pinned one isn't offered, and the choice is remembered", async ({ page }) => {
    const container = await example(page, "table-choosing-columns");
    const table = container.getByRole("table");
    await expect(table.getByRole("columnheader")).toHaveText(["Task", "Status", "Due"]);

    await container.getByRole("button", { name: "Edit columns" }).click();
    const list = container.getByRole("listbox", { name: "Columns" });
    await expect(list).toBeVisible();
    await settled(container.locator(".hpopup:popover-open"));
    await expect(list.getByRole("option")).toHaveText(["Status", "Due"]);
    await list.getByRole("option", { name: "Status" }).click();
    await expect(table.getByRole("columnheader")).toHaveText(["Task", "Due"]);
    await expect(table.getByRole("cell", { name: "Blocked" })).toHaveCount(0);
    await expect(list).toBeVisible();

    await list.getByRole("option", { name: "Status" }).click();
    await list.getByRole("option", { name: "Due" }).click();
    await expect(table.getByRole("columnheader")).toHaveText(["Task", "Status"]);
    const [whole, last] = await boxes(table, table.getByRole("columnheader", { name: "Status" }));
    expect(last!.x + last!.width).toBeCloseTo(whole!.x + whole!.width, 0);
    expect(last!.width).toBeGreaterThan(200);

    await list.getByRole("option", { name: "Due" }).click();
    await list.getByRole("option", { name: "Status" }).click();
    await expect(table.getByRole("columnheader")).toHaveText(["Task", "Due"]);

    await page.reload();
    await ready(page);
    await expect(page.locator('[id="table-choosing-columns"]').getByRole("columnheader")).toHaveText(["Task", "Due"]);
  });

  test("in pages: the range, the page, its rows, and rows per page", async ({ page }) => {
    const container = await example(page, "table-in-pages");
    const summary = container.locator(".htable-footer-summary");
    const status = container.locator('.htable-footer [role="status"]');
    await expect(summary).toHaveText("11–20 of 115 results");
    await expect(status).toHaveText("Page 2 of 12");
    await expect(container.getByRole("rowheader").first()).toHaveText("Task 11");

    await container.getByRole("button", { name: "Next" }).click();
    await expect(summary).toHaveText("21–30 of 115 results");
    await expect(status).toHaveText("Page 3 of 12");
    await expect(container.getByRole("rowheader").first()).toHaveText("Task 21");

    await container.getByRole("combobox", { name: "Rows per page" }).click();
    const option = container.getByRole("option", { name: "20", exact: true });
    await expect(option).toBeVisible();
    await settled(container.locator(".hpopup:popover-open"));
    await option.click();
    await expect(summary).toHaveText("1–20 of 115 results");
    await expect(status).toHaveText("Page 1 of 6");
    await expect(container.getByRole("rowheader")).toHaveCount(20);
  });

  test("the footer stays at the bottom of the window while the table runs past it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    const container = await example(page, "table-in-pages");
    const footer = container.locator(".htable-footer");
    await container.locator(".htable").evaluate((node) => node.scrollIntoView({ block: "start" }));
    const [box, table] = await boxes(footer, container.locator(".htable"));
    expect(box!.y + box!.height).toBeCloseTo(400, 0);
    expect(table!.y + table!.height).toBeGreaterThan(400);
    await expect(footer).toHaveCSS("border-top-width", "1px");
  });

  test("with nothing to show, what it's given stands in for the table", async ({ page }) => {
    const container = await example(page, "table-with-nothing-to-show");
    await expect(container.getByRole("table")).toHaveCount(0);
    await expect(container.getByRole("heading", { name: "No tasks yet" })).toBeVisible();
  });

  test("a column marked to truncate ends with an ellipsis, with the whole text in its title", async ({ page }) => {
    const container = await example(page, "table-long-text");
    const text = container.locator(".htable-truncate");
    await expect(text).toHaveCSS("text-overflow", "ellipsis");
    await expect(text).toHaveAttribute("title", /^Cover the audience/);
    expect((await text.boundingBox())!.width).toBeLessThanOrEqual(360);
    expect(await text.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  });

  test("right to left, the first column is on the right", async ({ page }) => {
    const container = await example(page, "table-right-to-left");
    const headers = container.getByRole("columnheader");
    const [first, second] = await boxes(headers.first(), headers.last());
    expect(first!.x).toBeGreaterThan(second!.x);
    await expect(headers.first()).toHaveCSS("text-align", "start");
  });

  test("too wide for a narrow screen, it scrolls in its own space", async ({ page }) => {
    const container = await example(page, "table-long-text");
    const scroll = container.locator(".htable-scroll");
    await expect(scroll).not.toHaveAttribute("tabindex");

    await page.setViewportSize({ width: 320, height: 720 });
    expect(await scroll.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expect(container.getByRole("region", { name: "Tasks" })).toHaveAttribute("tabindex", "0");

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(scroll).not.toHaveAttribute("tabindex");
  });
});
