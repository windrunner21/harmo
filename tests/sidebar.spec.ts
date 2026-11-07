import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/sidebar.md says, on the Sidebar page: links in named
// groups, with the current page marked; a group of links opens under its
// row, each on its own; the toggle, just past the edge, collapses it to its
// icons, each naming itself in a tooltip, and its groups then open beside
// it, one at a time, by a click, Enter, or hover, until Escape, a press
// elsewhere, focus moving on, or a pick.
const parts = async (page: Page, id: string) => {
  const container = await example(page, id);
  const sidebar = container.locator(".hsidebar");
  return {
    container,
    sidebar,
    nav: sidebar.getByRole("navigation", { name: "Main" }),
    toggle: sidebar.locator(".hsidebar-toggle-button"),
    group: (name: string) => sidebar.locator(".hsidebar-sub").filter({ has: page.locator(`summary:has-text("${name}")`) }),
    tooltipOf: (link: Locator) => link.locator("xpath=..").locator(".hsidebar-tooltip"),
  };
};
const isOpen = (details: Locator) => details.evaluate((node) => (node as HTMLDetailsElement).open);
const width = (element: Locator) => element.evaluate((node) => node.getBoundingClientRect().width);

onEachPlayground("sidebar", () => {
  test("links in named groups, the current page marked; a click moves it, as the example's router does", async ({ page }) => {
    const { nav } = await parts(page, "sidebar-default");
    await expect(nav.getByRole("list", { name: "Tools" })).toBeVisible();
    const tickets = nav.getByRole("link", { name: "Tickets" });
    await expect(tickets).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Messages 3 unread" })).toContainText("3");
    await nav.getByRole("link", { name: "Home" }).click();
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect(tickets).not.toHaveAttribute("aria-current");
  });

  test("a group's links open under it, each group on its own", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-default");
    const campaigns = group("Campaigns");
    const more = group("More");
    await campaigns.locator("summary").click();
    expect(await isOpen(campaigns)).toBe(true);
    await expect(nav.getByRole("link", { name: "Runs" })).toBeVisible();
    // The flyout's heading is for the collapsed sidebar only.
    await expect(campaigns.locator(".hsidebar-sub-heading")).toBeHidden();
    await more.locator("summary").click();
    expect([await isOpen(campaigns), await isOpen(more)]).toEqual([true, true]);
    await campaigns.locator("summary").click();
    expect([await isOpen(campaigns), await isOpen(more)]).toEqual([false, true]);
  });

  test("the toggle collapses it to its icons and back, saying which, and closes an open group", async ({ page }) => {
    const { sidebar, nav, toggle, group } = await parts(page, "sidebar-default");
    await expect(toggle).toHaveAccessibleName("Collapse");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await group("Campaigns").locator("summary").click();

    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "");
    await expect(toggle).toHaveAccessibleName("Expand");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(await isOpen(group("Campaigns"))).toBe(false);
    await settled(sidebar);
    expect(await width(sidebar)).toBeCloseTo(60, 0);
    // The labels are hidden, but still name the links.
    const home = nav.getByRole("link", { name: "Home" });
    await expect(home.locator(".hsidebar-label")).toHaveCSS("clip-path", "inset(50%)");
    await expect(home).toBeVisible();

    await toggle.click();
    await expect(sidebar).not.toHaveAttribute("data-collapsed");
    await settled(sidebar);
    expect(await width(sidebar)).toBeCloseTo(240, 0);
  });

  test("the toggle's line stands 8px past the edge, and on hover bends into a chevron at where the edge was, as the edge moves", async ({ page }) => {
    const { sidebar, toggle } = await parts(page, "sidebar-default");
    const lineX = () =>
      toggle.locator(".hsidebar-toggle-start").evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.left + box.width / 2;
      });
    const [edge] = await boxes(sidebar);
    const right = edge.x + edge.width;
    expect(Math.abs((await lineX()) - (right + 8))).toBeLessThan(1);

    await toggle.hover();
    await expect.poll(() => sidebar.evaluate((node) => getComputedStyle(node, "::after").translate)).toBe("-8px");
    await settled(toggle.locator(".hsidebar-toggle-start"));
    await expect(toggle.locator(".hsidebar-toggle-start")).not.toHaveCSS("transform", "none");
    // The chevron's tip, where its two strokes meet, is where the edge was.
    const tip = await toggle.locator(".hsidebar-toggle-start").evaluate((node) => {
      const box = node.getBoundingClientRect();
      return box.left;
    });
    expect(Math.abs(tip - right)).toBeLessThan(1.5);
  });

  test("collapsed, a link's tooltip names it on hover and on keyboard focus; expanded, there's none", async ({ page }) => {
    const { nav, tooltipOf } = await parts(page, "sidebar-collapsed");
    const home = nav.getByRole("link", { name: "Home" });
    await home.hover();
    await expect(tooltipOf(home)).toBeVisible();
    await expect(tooltipOf(home)).toHaveText("Home");
    // At once, with no delay: in a row of icons, the name is what you're
    // looking for.
    expect(await tooltipOf(home).evaluate((node) => getComputedStyle(node).transitionDelay)).toMatch(/^0s(, 0s)*$/);
    await settled(tooltipOf(home));
    const [row, tip] = await boxes(home.locator("xpath=.."), tooltipOf(home));
    expect(tip.x - (row.x + row.width)).toBeCloseTo(12, 0);
    await page.mouse.move(0, 0);
    await home.focus();
    await page.keyboard.press("Tab");
    const analytics = nav.getByRole("link", { name: "Analytics" });
    await expect(analytics).toBeFocused();
    await expect(tooltipOf(analytics)).toBeVisible();

    const expanded = await parts(page, "sidebar-default");
    const homeExpanded = expanded.nav.getByRole("link", { name: "Home" });
    await homeExpanded.hover();
    await page.waitForTimeout(400);
    await expect(expanded.tooltipOf(homeExpanded)).toBeHidden();
  });

  test("a count is in the current page's color; collapsed, it's a dot on its icon", async ({ page }) => {
    const expanded = await parts(page, "sidebar-default");
    const pill = expanded.nav.getByRole("link", { name: "Messages 3 unread" }).locator(".hsidebar-badge");
    const current = await expanded.nav.getByRole("link", { name: "Tickets" }).evaluate((node) => getComputedStyle(node).color);
    await expect(pill).toHaveCSS("background-color", current);

    const { nav } = await parts(page, "sidebar-collapsed");
    const badge = nav.getByRole("link", { name: "Messages 3 unread" }).locator(".hsidebar-badge");
    const [box] = await boxes(badge);
    expect([box.width, box.height]).toEqual([10, 10]);
  });

  test("collapsed, one group's links show at a time", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    await group("Campaigns").locator("summary").click();
    await group("More").locator("summary").click();
    expect([await isOpen(group("Campaigns")), await isOpen(group("More"))]).toEqual([false, true]);
  });

  test("collapsed, a click opens a group beside its icon; Escape closes it and returns to it", async ({ page }) => {
    const { sidebar, nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    const summary = campaigns.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    expect(await isOpen(campaigns)).toBe(true);
    const runs = nav.getByRole("link", { name: "Runs" });
    await expect(runs).toBeVisible();
    await expect(campaigns.locator(".hsidebar-sub-heading")).toHaveText("Campaigns");
    // The panel, 12px past the icon's row, so 4px clear of the edge, as its
    // tooltip is.
    const panel = await campaigns.evaluate((node) => ({
      row: (node.parentElement as HTMLElement).getBoundingClientRect().right,
      start: (node.querySelector(".hsidebar-sub-list") as HTMLElement).getBoundingClientRect().left,
    }));
    expect(panel.start - panel.row).toBeCloseTo(12, 0);
    const [rail] = await boxes(sidebar);
    expect(panel.start - (rail.x + rail.width)).toBeCloseTo(4, 0);

    await page.keyboard.press("Tab");
    await expect(runs).toBeFocused();
    await page.keyboard.press("Escape");
    expect(await isOpen(campaigns)).toBe(false);
    await expect(summary).toBeFocused();
  });

  test("collapsed, a press elsewhere, focus moving on, or a pick closes an open group", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    const summary = campaigns.locator("summary");

    await summary.click();
    expect(await isOpen(campaigns)).toBe(true);
    await page.mouse.click(5, 5);
    expect(await isOpen(campaigns)).toBe(false);

    await summary.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Shift+Tab");
    expect(await isOpen(campaigns)).toBe(false);

    await summary.click();
    await nav.getByRole("link", { name: "Templates" }).click();
    expect(await isOpen(campaigns)).toBe(false);
    // The group holding the current page shows it on its icon.
    await expect(summary).toHaveCSS("font-weight", "500");
  });

  test("collapsed, a click alone, as on a touch screen, opens a group, and another closes it", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    // A click with no pointer moving over it first.
    await campaigns.locator("summary").dispatchEvent("click");
    expect(await isOpen(campaigns)).toBe(true);
    await campaigns.locator("summary").dispatchEvent("click");
    expect(await isOpen(campaigns)).toBe(false);
  });

  test("collapsed, Escape closes a group a hover opened, wherever focus is, and leaves focus there", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await campaigns.locator("summary").hover();
    expect(await isOpen(campaigns)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await isOpen(campaigns)).toBe(false);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  test("collapsed, after Escape closes a hovered group, the next click opens it again", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    const summary = campaigns.locator("summary");
    await summary.hover();
    expect(await isOpen(campaigns)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await isOpen(campaigns)).toBe(false);
    await summary.click();
    expect(await isOpen(campaigns)).toBe(true);
  });

  test("collapsed, a group a hover opened stays open when focus is inside and the pointer leaves", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    await campaigns.locator("summary").hover();
    expect(await isOpen(campaigns)).toBe(true);
    await nav.getByRole("link", { name: "Runs" }).focus();
    await page.mouse.move(5, 5);
    expect(await isOpen(campaigns)).toBe(true);
  });

  test("collapsed, the nav still scrolls, and a group's links beside it aren't cut off", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    await expect(nav).toHaveCSS("overflow-y", "auto");
    await group("More").locator("summary").click();
    const snippets = nav.getByRole("link", { name: "Snippets" });
    await expect(snippets).toBeVisible();
    const [box, links] = await boxes(nav, snippets);
    expect(links.x).toBeGreaterThan(box.x + box.width);
    // It's what's at that point, not hidden under the nav's clipping.
    expect(
      await snippets.evaluate((node) => {
        const r = node.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === node;
      }),
    ).toBe(true);
  });

  test("on a right-to-left page, a collapsed icon's tooltip opens to its left", async ({ page }) => {
    const { container, nav, tooltipOf } = await parts(page, "sidebar-collapsed");
    await container.locator(".hsidebar").evaluate((node) => node.parentElement?.setAttribute("dir", "rtl"));
    const home = nav.getByRole("link", { name: "Home" });
    await home.hover();
    await expect(tooltipOf(home)).toBeVisible();
    await settled(tooltipOf(home));
    const [row, tip] = await boxes(home.locator("xpath=.."), tooltipOf(home));
    expect(tip.x + tip.width).toBeLessThanOrEqual(row.x);
  });

  test("becoming collapsed however it happens closes the groups that were open", async ({ page }, info) => {
    test.skip(!info.titlePath.includes("html"), "sets data-collapsed directly, as an app's own script would");
    const { sidebar, group } = await parts(page, "sidebar-default");
    await group("Campaigns").locator("summary").click();
    expect(await isOpen(group("Campaigns"))).toBe(true);
    await sidebar.evaluate((node) => node.setAttribute("data-collapsed", ""));
    await expect.poll(() => isOpen(group("Campaigns"))).toBe(false);
  });

  test("collapsed, moving from one group's icon to another's switches at once", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    await group("Campaigns").locator("summary").hover();
    expect(await isOpen(group("Campaigns"))).toBe(true);
    await group("More").locator("summary").hover();
    expect([await isOpen(group("Campaigns")), await isOpen(group("More"))]).toEqual([false, true]);
  });

  test("collapsed, hovering a group opens it, the pointer can cross to its links, and it closes as the pointer leaves; a click keeps it open", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    const summary = campaigns.locator("summary");
    await summary.hover();
    await expect.poll(() => isOpen(campaigns)).toBe(true);
    // Across the gap to the last link, diagonally.
    const templates = nav.getByRole("link", { name: "Templates" });
    const [from, to] = await boxes(summary, templates);
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    expect(await isOpen(campaigns)).toBe(true);
    expect(from.x).toBeLessThan(to.x);
    await page.mouse.move(5, 5);
    expect(await isOpen(campaigns)).toBe(false);

    await summary.hover();
    await expect.poll(() => isOpen(campaigns)).toBe(true);
    await summary.click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(100);
    expect(await isOpen(campaigns)).toBe(true);
    await expect(nav.getByRole("link", { name: "Runs" })).toBeVisible();
  });

  test("groups that share a name open one at a time", async ({ page }) => {
    const { group } = await parts(page, "sidebar-one-group-at-a-time");
    await group("Campaigns").locator("summary").click();
    expect(await isOpen(group("Campaigns"))).toBe(true);
    await group("More").locator("summary").click();
    expect([await isOpen(group("Campaigns")), await isOpen(group("More"))]).toEqual([false, true]);
  });

  test("in a drawer, it fills the drawer, without the toggle or an edge", async ({ page }) => {
    const { container } = await parts(page, "sidebar-in-a-drawer");
    await container.getByRole("button", { name: "Menu" }).click();
    const dialog = container.locator("dialog");
    await expect(dialog).toHaveJSProperty("open", true);
    const sidebar = dialog.locator(".hsidebar");
    await expect(sidebar.locator(".hsidebar-toggle")).toHaveCount(0);
    await expect(sidebar).toHaveCSS("padding-left", "0px");
    expect(await sidebar.evaluate((node) => getComputedStyle(node, "::after").display)).toBe("none");
    const [body, box] = await boxes(dialog.locator(".hdrawer-body"), sidebar);
    expect(box.width).toBeCloseTo(body.width - 40, 0);
  });

  test("with reduced motion, it collapses at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { sidebar, toggle } = await parts(page, "sidebar-default");
    await toggle.click();
    expect(await width(sidebar)).toBeCloseTo(60, 0);
  });
});
