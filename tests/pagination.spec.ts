import { expect, type Locator } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/pagination.md says, on the Pagination page: Previous
// and Next, disabled in place at either end; the numbers, seven at most, the
// current one marked; buttons where the app holds the page; and on a phone,
// Previous and Next only.
const numbers = (nav: Locator) => nav.locator(".hpagination-pages > li");

onEachPlayground("pagination", () => {
  test("Previous and Next are links; on the first page Previous is disabled in place and links to that page", async ({ page }) => {
    const nav = (await example(page, "pagination-previous-and-next")).getByRole("navigation", { name: "Pages" });
    const previous = nav.getByRole("link", { name: "Previous" });
    const next = nav.getByRole("link", { name: "Next" });
    await expect(previous).toHaveAttribute("href", "?page=1");
    await expect(previous).toHaveAttribute("rel", "prev");
    await expect(next).toHaveAttribute("href", "?page=3");
    await expect(next).toHaveAttribute("rel", "next");
    const url = page.url();

    await previous.click();
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).toHaveAttribute("href", "?page=1");
    await expect(previous).not.toHaveAttribute("rel");
    await expect(next).toHaveAttribute("href", "?page=2");

    // A disabled Previous does nothing, and keeps focus.
    await previous.focus();
    await page.keyboard.press("Enter");
    await expect(previous).toBeFocused();
    await expect(next).toHaveAttribute("href", "?page=2");
    expect(page.url()).toBe(url);
  });

  test("a click with a modifier key on a link is left to the browser, but not on a disabled one", async ({ page }) => {
    const nav = (await example(page, "pagination-previous-and-next")).getByRole("navigation", { name: "Pages" });
    const previous = nav.getByRole("link", { name: "Previous" });
    const next = nav.getByRole("link", { name: "Next" });

    // Whether Pagination handled each click, seen on the body, after it has
    // and before the playground's own handler on the document stops every
    // example link from leaving the page.
    type Recorded = Window & { handled?: boolean[] };
    await page.evaluate(() => {
      const recorded = window as Recorded;
      recorded.handled = [];
      document.body.addEventListener("click", (event) => {
        recorded.handled?.push(event.defaultPrevented);
        event.preventDefault();
      });
    });
    const handled = () => page.evaluate(() => (window as Recorded).handled?.pop());

    await next.click({ modifiers: ["ControlOrMeta"] });
    expect(await handled(), "Next handled a click with a modifier key").toBe(false);
    await expect(next).toHaveAttribute("href", "?page=3");

    await previous.click();
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    // Forced: Playwright won't click what's aria-disabled, as a person can.
    await previous.click({ modifiers: ["ControlOrMeta"], force: true });
    expect(await handled(), "a disabled Previous ignored a click with a modifier key").toBe(true);
    await expect(next).toHaveAttribute("href", "?page=2");
  });

  test("numbered: the first and last pages and the current one with its neighbors, always seven, the row keeping its width", async ({ page }) => {
    const nav = (await example(page, "pagination-numbered")).getByRole("navigation", { name: "Pages" });
    await expect(numbers(nav)).toHaveText(["1", "…", "4", "5", "6", "…", "12"]);
    const current = nav.getByRole("link", { name: "Page 5", exact: true });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    for (const gap of await nav.locator(".hpagination-ellipsis").all()) {
      await expect(gap).toHaveAttribute("aria-hidden", "true");
    }
    const [before] = await boxes(nav.locator(".hpagination-pages"));

    // Focus stays on the number you chose.
    await nav.getByRole("link", { name: "Page 4", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(numbers(nav)).toHaveText(["1", "2", "3", "4", "5", "…", "12"]);
    await expect(nav.getByRole("link", { name: "Page 4", exact: true })).toBeFocused();
    await expect(nav.getByRole("link", { name: "Page 4", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "?page=3");

    await nav.getByRole("link", { name: "Page 12", exact: true }).click();
    await expect(numbers(nav)).toHaveText(["1", "…", "8", "9", "10", "11", "12"]);
    await expect(nav.getByRole("link", { name: "Next" })).toHaveAttribute("aria-disabled", "true");
    const [after] = await boxes(nav.locator(".hpagination-pages"));
    expect(after.width).toBeCloseTo(before.width, 0);
  });

  test("the current page is in the accent on its tint, with a line around it that stays in forced colors", async ({ page, browserName }) => {
    const nav = (await example(page, "pagination-numbered")).getByRole("navigation", { name: "Pages" });
    const current = nav.getByRole("link", { name: "Page 5", exact: true });
    const other = nav.getByRole("link", { name: "Page 4", exact: true });
    const colors = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      const resolve = (name: string) => {
        probe.style.color = `var(${name})`;
        return getComputedStyle(probe).color;
      };
      const values = { primary: resolve("--harmo-color-primary"), tint: resolve("--harmo-color-primary-tint") };
      probe.remove();
      return values;
    });
    await expect(current).toHaveCSS("color", colors.primary);
    await expect(current).toHaveCSS("background-color", colors.tint);
    await expect(current).toHaveCSS("outline-style", "solid");
    await expect(current).toHaveCSS("outline-width", "1px");
    await expect(current).toHaveCSS("outline-color", colors.primary);
    await expect(other).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(other).toHaveCSS("outline-style", "none");
    const [currentBox, otherBox] = await boxes(current, other);
    expect(currentBox.width).toBeCloseTo(otherBox.width, 0);
    expect(currentBox.height).toBeCloseTo(otherBox.height, 0);

    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    await page.emulateMedia({ forcedColors: "active" });
    await expect(current).toHaveCSS("outline-style", "solid");
    await expect(current).not.toHaveCSS("outline-color", "rgba(0, 0, 0, 0)");
    await expect(other).toHaveCSS("outline-style", "none");
  });

  test("numbers up to 999 fit their square; a longer one widens it, the current page as much as the others", async ({ page }) => {
    const nav = (await example(page, "pagination-numbered")).getByRole("navigation", { name: "Pages" });
    const [three, current, other] = [4, 5, 6].map((number) => nav.getByRole("link", { name: `Page ${number}`, exact: true }));
    await three.evaluate((link) => (link.textContent = "999"));
    await current.evaluate((link) => (link.textContent = "1000"));
    await other.evaluate((link) => (link.textContent = "1000"));
    const [threeBox, currentBox, otherBox] = await boxes(three, current, other);
    expect(threeBox.width).toBeCloseTo(34, 0);
    expect(otherBox.width).toBeGreaterThan(34);
    expect(currentBox.width).toBeCloseTo(otherBox.width, 1);
  });

  test("in a container too narrow for them, the numbers wrap rather than spill out of it", async ({ page }) => {
    const nav = (await example(page, "pagination-numbered")).getByRole("navigation", { name: "Pages" });
    await nav.evaluate((element) => {
      const box = document.createElement("div");
      box.id = "narrow";
      box.style.inlineSize = "240px";
      element.before(box);
      box.append(element);
    });
    const [box, navBox, list] = await boxes(page.locator("#narrow"), nav, nav.locator(".hpagination-pages"));
    expect(navBox.x + navBox.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    expect(list.x + list.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    await expect(nav.locator(".hpagination-page").first()).toBeVisible();
  });

  test("on a phone, only Previous and Next show", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const nav = (await example(page, "pagination-numbered")).getByRole("navigation", { name: "Pages" });
    await expect(nav.locator(".hpagination-pages")).toBeHidden();
    await expect(nav.getByRole("link", { name: "Previous" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Next" })).toBeVisible();
  });

  test("right to left, the first page is on the right, and Previous is at the start", async ({ page }) => {
    const nav = (await example(page, "pagination-right-to-left")).getByRole("navigation", { name: "الصفحات" });
    const [previous, first, last, next] = await boxes(
      nav.getByRole("link", { name: "السابق" }),
      nav.getByRole("link", { name: "الصفحة 1", exact: true }),
      nav.getByRole("link", { name: "الصفحة 12", exact: true }),
      nav.getByRole("link", { name: "التالي" }),
    );
    expect(previous.x).toBeGreaterThan(first.x);
    expect(first.x).toBeGreaterThan(last.x);
    expect(last.x).toBeGreaterThan(next.x);
  });

  test("in a table footer: buttons, the rows shown, the page read from a status, and more rows to a page starting again from the first", async ({ page }) => {
    const container = await example(page, "pagination-in-a-table-footer");
    const nav = container.getByRole("navigation", { name: "Pages" });
    const previous = nav.getByRole("button", { name: "Previous" });
    const next = nav.getByRole("button", { name: "Next" });
    const status = container.getByRole("status");
    const range = container.getByText(/ of 115 results$/);
    await expect(status).toHaveText("Page 2 of 12");
    await expect(range).toHaveText("11–20 of 115 results");

    // The rows shown at the start of the row, the rest at its end.
    const [box, rangeBox, navBox] = await boxes(container.locator(".play-demo > div"), range, nav);
    expect(rangeBox.x).toBeCloseTo(box.x, 0);
    expect(navBox.x + navBox.width).toBeCloseTo(box.x + box.width, 0);

    // A button has no new tab to open: a click with a modifier key moves too.
    await next.click({ modifiers: ["Shift"] });
    await expect(status).toHaveText("Page 3 of 12");
    await expect(range).toHaveText("21–30 of 115 results");

    await container.getByRole("combobox", { name: "Rows per page" }).click();
    await container.getByRole("option", { name: "50" }).click();
    await expect(status).toHaveText("Page 1 of 3");
    await expect(range).toHaveText("1–50 of 115 results");
    await expect(previous).toHaveAttribute("aria-disabled", "true");

    // Next stays focused as it's disabled on the last page.
    await next.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(status).toHaveText("Page 3 of 3");
    await expect(range).toHaveText("101–115 of 115 results");
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText("Page 3 of 3");
  });
});
