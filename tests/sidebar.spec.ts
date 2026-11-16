import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, rendered, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/sidebar.md says, on the Sidebar page: links in named
// groups, with the current page marked; a group of links opens under its
// row, each on its own; the toggle, just past the edge, collapses it to its
// icons, its width gliding with the page beside it, each icon
// naming itself in a tooltip, and its groups then open beside it, one at a
// time, by a click, Enter, or hover, until Escape, a press elsewhere, focus
// moving on, or a pick. How it looks, which only CSS and the markup decide,
// such as its spacing, its colors, and the toggle's hover, is tested on the
// HTML playground.
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

// A stand-in for the page beside the sidebar, as an app's layout has it,
// positioned, as many are, so it would paint over the sidebar's surface if
// the sidebar weren't lifted above it.
const pageBeside = async (sidebar: Locator) => {
  await sidebar.evaluate((node) => {
    const row = node.parentElement as HTMLElement;
    row.style.display = "flex";
    const beside = Object.assign(document.createElement("div"), { className: "test-page" });
    beside.style.cssText = "position: relative; flex: 1; align-self: stretch;";
    row.append(beside);
  });
  return sidebar.locator("xpath=following-sibling::div[@class='test-page']");
};

const token = (page: Page, name: string) =>
  page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim().replaceAll(" ", ""), name);
// A transition's duration, delay, and curve for one property, as an element
// has them now.
const transitionOf = (element: Locator, property: string) =>
  element.evaluate((node, property) => {
    const style = getComputedStyle(node);
    const index = style.transitionProperty.split(", ").indexOf(property);
    const pick = (list: string) => {
      const items = list.split(/,\s*(?![^()]*\))/);
      return items[index % items.length]!.replaceAll(" ", "");
    };
    return index < 0 ? null : { duration: pick(style.transitionDuration), delay: pick(style.transitionDelay), easing: pick(style.transitionTimingFunction) };
  }, property);

// The sidebar's width transition, held halfway; returns the width there.
const holdHalfway = (sidebar: Locator) =>
  sidebar.evaluate((node) => {
    const glide = node
      .getAnimations()
      // Chromium names a logical property's transition by its physical one.
      .find((animation) => animation instanceof CSSTransition && ["inline-size", "width"].includes(animation.transitionProperty));
    if (!glide) return null;
    glide.pause();
    glide.currentTime = Number(glide.effect!.getTiming().duration) / 2;
    return node.getBoundingClientRect().width;
  });
const finish = (sidebar: Locator) =>
  sidebar.evaluate((node) => {
    for (const animation of node.getAnimations({ subtree: true })) animation.finish();
  });

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

  test("the toggle collapses it to its icons and back, named by what it does, and closes an open group", async ({ page }) => {
    const { sidebar, nav, toggle, group } = await parts(page, "sidebar-default");
    await expect(toggle).toHaveAccessibleName("Collapse");
    // The name says what pressing it does; aria-expanded would say the state
    // again, in the opposite word.
    await expect(toggle).not.toHaveAttribute("aria-expanded");
    await expect(toggle).not.toHaveAttribute("aria-controls");
    await group("Campaigns").locator("summary").click();

    await toggle.click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "");
    await expect(toggle).toHaveAccessibleName("Expand");
    await expect(toggle).not.toHaveAttribute("aria-expanded");
    expect(await isOpen(group("Campaigns"))).toBe(false);
    await settled(sidebar);
    expect(await width(sidebar)).toBeCloseTo(60, 0);
    // The labels are faded out, but still name the links.
    const home = nav.getByRole("link", { name: "Home" });
    await expect(home.locator(".hsidebar-label")).toHaveCSS("opacity", "0");
    await expect(home).toBeVisible();

    await toggle.click();
    await expect(sidebar).not.toHaveAttribute("data-collapsed");
    await settled(sidebar);
    expect(await width(sidebar)).toBeCloseTo(240, 0);
  });

  test("the toggle's line stands 8px past the edge, and on hover bends into a chevron at where the edge was, as the edge moves", { tag: "@css" }, async ({ page }) => {
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
    expect(tip.x - (row.x + row.width)).toBeCloseTo(10, 0);
    await page.mouse.move(0, 0);
    await home.focus();
    await page.keyboard.press("Tab");
    const analytics = nav.getByRole("link", { name: "Analytics" });
    await expect(analytics).toBeFocused();
    await expect(tooltipOf(analytics)).toBeVisible();

    const expanded = await parts(page, "sidebar-default");
    const homeExpanded = expanded.nav.getByRole("link", { name: "Home" });
    await homeExpanded.hover();
    // Once any fade a hover started has ended.
    await settled(expanded.tooltipOf(homeExpanded));
    await expect(expanded.tooltipOf(homeExpanded)).toBeHidden();
  });

  test("collapsed, a link's tooltip swaps in and out at once, without a fade, so two never overlap down the rail", async ({ page }) => {
    const { nav, tooltipOf } = await parts(page, "sidebar-collapsed");
    const home = nav.getByRole("link", { name: "Home" });
    const analytics = nav.getByRole("link", { name: "Analytics" });
    // A fade that ran would take 100 seconds.
    await slowDown(tooltipOf(home));
    await slowDown(tooltipOf(analytics));
    await home.hover();
    expect(await tooltipOf(home).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
    await analytics.hover();
    expect(await tooltipOf(analytics).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
    expect(await tooltipOf(home).evaluate((node) => getComputedStyle(node).visibility)).toBe("hidden");
  });

  test("a count is in the current page's color; collapsed, it's a dot on its icon", { tag: "@css" }, async ({ page }) => {
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
    // The panel, --harmo-space-xs past the icon's row, so 2px clear of the
    // edge, as its tooltip is.
    const panel = await campaigns.evaluate((node) => ({
      row: (node.parentElement as HTMLElement).getBoundingClientRect().right,
      start: (node.querySelector(".hsidebar-sub-list") as HTMLElement).getBoundingClientRect().left,
    }));
    expect(panel.start - panel.row).toBeCloseTo(10, 0);
    const [rail] = await boxes(sidebar);
    expect(panel.start - (rail.x + rail.width)).toBeCloseTo(2, 0);

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

  test("on a right-to-left page, a collapsed icon's tooltip opens to its left", { tag: "@css" }, async ({ page }) => {
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
    await rendered(page);
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
    const drawerBody = dialog.locator(".hdrawer-body");
    const [body, box] = await boxes(drawerBody, sidebar);
    const padding = await drawerBody.evaluate((node) => {
      const style = getComputedStyle(node);
      return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    });
    expect(box.width).toBeCloseTo(body.width - padding, 0);
  });

  test("with reduced motion, it collapses at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { sidebar, toggle } = await parts(page, "sidebar-default");
    await toggle.click();
    expect(await sidebar.evaluate((node) => node.getAnimations().length)).toBe(0);
    expect(await width(sidebar)).toBeCloseTo(60, 0);
  });

  test("collapsing, its width glides in 200ms on the ease-in-out curve, and the page beside it moves with it", async ({ page }) => {
    const { sidebar, toggle } = await parts(page, "sidebar-default");
    const curve = await token(page, "--harmo-ease-in-out-cubic");
    expect(await transitionOf(sidebar, "inline-size")).toEqual({ duration: "0.2s", delay: "0s", easing: curve });
    const beside = await pageBeside(sidebar);
    const open = await width(sidebar);
    await toggle.click();
    const halfway = await holdHalfway(sidebar);
    expect(halfway).not.toBeNull();
    expect(halfway!).toBeLessThan(open - 20);
    expect(halfway!).toBeGreaterThan(60 + 20);
    const [rail, next] = await boxes(sidebar, beside);
    expect(next!.x).toBeCloseTo(rail!.x + rail!.width, 0);
    await finish(sidebar);
    expect(await width(sidebar)).toBeCloseTo(60, 0);
  });

  test("its labels fade out quickly as it narrows, and back in as it finishes widening; faded, they still name the links", async ({ page }) => {
    const { sidebar, toggle, nav } = await parts(page, "sidebar-default");
    const label = nav.locator(".hsidebar-item > .hsidebar-label").first();
    expect(await transitionOf(label, "opacity")).toMatchObject({ duration: "0.15s", delay: "0.1s" });
    await toggle.click();
    expect(await transitionOf(label, "opacity")).toMatchObject({ duration: "0.1s", delay: "0s" });
    await expect(label).toHaveCSS("opacity", "0");
    await finish(sidebar);
    await expect(nav.getByRole("link", { name: "Home" })).toHaveCount(1);
  });

  test("its icons stay where they were as it collapses and expands", async ({ page }) => {
    const { sidebar, toggle, nav } = await parts(page, "sidebar-default");
    const icon = nav.locator(".hsidebar-item > .hicon").first();
    const [before] = await boxes(icon);
    await toggle.click();
    await finish(sidebar);
    const [after] = await boxes(icon);
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(4.5);
  });

  test("changed midway, it turns around from where it had got to, without a jump", async ({ page }) => {
    const { sidebar, toggle } = await parts(page, "sidebar-default");
    const [expanded] = await boxes(sidebar);
    // Slowed down and even, so it's well on its way after half a second on
    // any machine, and barely moves in two frames. Toggled back by the clock,
    // as a person would: Firefox and WebKit turn a transition around from
    // where its time says it is, not from where a paused one was held.
    await sidebar.evaluate((node) =>
      Object.assign((node as HTMLElement).style, { transitionDuration: "2s", transitionTimingFunction: "linear" }),
    );
    await toggle.click();
    const [halfway, turned] = await sidebar.evaluate(async (node) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const halfway = node.getBoundingClientRect().width;
      (node.querySelector(".hsidebar-toggle-button") as HTMLElement).click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return [halfway, node.getBoundingClientRect().width];
    });
    expect(halfway).toBeLessThan(expanded!.width - 20);
    expect(Math.abs(turned! - halfway!)).toBeLessThan(20);
  });

  test("collapsed, a group's label takes no room but still names its list; its room moves with the width, and its text fades as the links' labels do", async ({ page }) => {
    const { sidebar, nav, toggle } = await parts(page, "sidebar-default");
    const label = nav.locator(".hsidebar-group-label").first();
    await expect(label).toHaveCSS("transition-property", "block-size, margin-block-end, opacity");
    await expect(label).toHaveCSS("transition-duration", "0.2s, 0.2s, 0.15s");
    await expect(label).toHaveCSS("transition-delay", "0s, 0s, 0.1s");
    await toggle.click();
    await finish(sidebar);
    await expect(label).toHaveCSS("transition-duration", "0.2s, 0.2s, 0.1s");
    await expect(label).toHaveCSS("height", "0px");
    await expect(label).toHaveCSS("margin-bottom", "0px");
    await expect(label).toHaveCSS("opacity", "0");
    await expect(nav.getByRole("list", { name: "Tools" })).toBeVisible();
  });

  test("a link's icon is 10px before its label, groups are 26px apart, and a group's label is 6px above its links", { tag: "@css" }, async ({ page }) => {
    const { nav } = await parts(page, "sidebar-default");
    const home = nav.getByRole("link", { name: "Home" });
    const [icon, label] = await boxes(home.locator(".hicon"), home.locator(".hsidebar-label"));
    expect(label.x - (icon.x + icon.width)).toBeCloseTo(10, 0);
    const groups = nav.locator(".hsidebar-group");
    const [first, second, tools, list] = await boxes(
      groups.nth(0),
      groups.nth(1),
      groups.nth(1).locator(".hsidebar-group-label"),
      groups.nth(1).locator(".hsidebar-list"),
    );
    expect(second.y - (first.y + first.height)).toBeCloseTo(26, 0);
    expect(list.y - (tools.y + tools.height)).toBeCloseTo(6, 0);
  });

  test("its background takes --hsidebar-color-background, and a collapsed count's ring with it", { tag: "@css" }, async ({ page }) => {
    const { sidebar, nav } = await parts(page, "sidebar-collapsed");
    await sidebar.evaluate((node) => (node as HTMLElement).style.setProperty("--hsidebar-color-background", "rgb(200, 0, 0)"));
    await expect(sidebar).toHaveCSS("background-color", "rgb(200, 0, 0)");
    await expect(nav.getByRole("link", { name: "Messages 3 unread" }).locator(".hsidebar-badge")).toHaveCSS("border-top-color", "rgb(200, 0, 0)");
  });

  test("icons follow the text size", { tag: "@css" }, async ({ page }) => {
    const { nav } = await parts(page, "sidebar-default");
    await page.evaluate(() => (document.documentElement.style.fontSize = "20px"));
    const [icon] = await boxes(nav.getByRole("link", { name: "Home" }).locator(".hicon"));
    expect([icon.width, icon.height]).toEqual([25, 25]);
  });

  test("in forced colors, the edge and a collapsed count's dot are drawn in the system's colors", { tag: "@css" }, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    await page.emulateMedia({ forcedColors: "active" });
    const expanded = await parts(page, "sidebar-default");
    expect(await expanded.sidebar.evaluate((node) => getComputedStyle(node, "::after").forcedColorAdjust)).toBe("none");
    const { nav } = await parts(page, "sidebar-collapsed");
    await expect(nav.getByRole("link", { name: "Messages 3 unread" }).locator(".hsidebar-badge")).toHaveCSS("forced-color-adjust", "none");
  });

  test("collapsed, while focus is in a group's links, hovering another group's icon leaves it open", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    await campaigns.locator("summary").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: "Runs" })).toBeFocused();
    await group("More").locator("summary").hover();
    expect([await isOpen(campaigns), await isOpen(group("More"))]).toEqual([true, false]);
    await expect(nav.getByRole("link", { name: "Runs" })).toBeFocused();
  });

  test("collapsed, picking a link from the keyboard closes its group and returns focus to its icon", async ({ page }) => {
    const { nav, group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    const summary = campaigns.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    // Found even once its group has closed around it.
    const runs = nav.getByRole("link", { name: "Runs", includeHidden: true });
    await expect(runs).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await isOpen(campaigns)).toBe(false);
    await expect(summary).toBeFocused();
    await expect(runs).toHaveAttribute("aria-current", "page");
  });

  test("collapsed, an Escape in a popup over the page is the popup's, and the open group stays", async ({ page }) => {
    const { group } = await parts(page, "sidebar-collapsed");
    const campaigns = group("Campaigns");
    // Opened with no pointer or focus on it, so no tooltip takes the Escape.
    await campaigns.evaluate((node) => ((node as HTMLDetailsElement).open = true));
    expect(await isOpen(campaigns)).toBe(true);
    const prevented = await page.evaluate(() => {
      const layer = Object.assign(document.createElement("div"), { popover: "manual" });
      const button = document.createElement("button");
      layer.append(button);
      document.body.append(layer);
      layer.showPopover();
      const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      button.dispatchEvent(escape);
      layer.remove();
      return escape.defaultPrevented;
    });
    expect(prevented).toBe(false);
    expect(await isOpen(campaigns)).toBe(true);
  });
});
