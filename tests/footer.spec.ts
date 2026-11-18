import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/footer.md says: wide, its groups sit side by side,
// open, their headings plain titles out of the Tab order; 640px wide or less,
// each folds, its heading a control; the groups are a named navigation, their
// headings h2s; and a Footer can be its bottom row alone.
onEachPlayground("footer", () => {
  test("wide, its groups are open, their summaries out of the Tab order, and a click doesn't close them", async ({ page }) => {
    const container = await example(page, "footer-default");
    const nav = container.getByRole("navigation", { name: "Footer" });
    const groups = nav.locator(".hfooter-group");
    await expect(groups).toHaveCount(3);
    for (const group of await groups.all()) {
      await expect(group).toHaveAttribute("open", "");
      await expect(group.locator(".hfooter-summary")).toHaveAttribute("tabindex", "-1");
    }
    await expect(nav.getByRole("heading", { level: 2 })).toHaveText(["Shop", "Company", "Help"]);
    await groups.first().locator(".hfooter-summary").dispatchEvent("click");
    await expect(groups.first()).toHaveAttribute("open", "");
    await expect(nav.getByRole("link", { name: "Delivery" })).toBeVisible();
  });

  test("on a phone, each group folds: closed at first, its summary a control that opens it", async ({ page }) => {
    const container = await example(page, "footer-on-a-phone");
    const groups = container.locator(".hfooter-group");
    for (const group of await groups.all()) {
      await expect(group).not.toHaveAttribute("open");
      await expect(group.locator(".hfooter-summary")).not.toHaveAttribute("tabindex");
    }
    const shop = groups.first();
    await expect(shop.getByRole("link", { name: "Delivery" })).toBeHidden();
    await shop.locator(".hfooter-summary").click();
    await expect(shop).toHaveAttribute("open", "");
    await expect(shop.getByRole("link", { name: "Delivery" })).toBeVisible();
    await shop.locator(".hfooter-summary").press("Enter");
    await expect(shop).not.toHaveAttribute("open");
  });

  test("wide, the groups sit side by side, 26px apart, their links 10px apart; the bottom row is under a line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "footer-default");
    const groups = container.locator(".hfooter-group");
    const [shop, company] = await boxes(groups.nth(0), groups.nth(1));
    expect(Math.round(shop.y)).toBe(Math.round(company.y));
    expect(Math.round(company.x - (shop.x + shop.width))).toBe(26);
    const [first, second] = await boxes(container.getByRole("link", { name: "This week's offers" }), container.getByRole("link", { name: "Delivery" }));
    expect(Math.round(second.y - (first.y + first.height))).toBe(10);
    await expect(container.locator(".hfooter-bottom")).toHaveCSS("border-top-width", "1px");
  });

  test("on a phone, a line between the groups, and their links hidden while closed", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "footer-on-a-phone");
    const groups = container.locator(".hfooter-group");
    await expect(groups.nth(1)).toHaveCSS("border-top-width", "1px");
    await expect(groups.first().locator(".hexpand-chevron")).toBeVisible();
  });

  test("its script follows the CSS at the fold: wide at 641px, folded at 640px, and as the CSS says between", async ({ page }) => {
    const container = await example(page, "footer-default");
    const footer = container.locator("footer.hfooter");
    const nav = container.getByRole("navigation", { name: "Footer" });
    const shop = container.locator(".hfooter-group").first();
    const delivery = shop.getByRole("link", { name: "Delivery" });
    // At 640.25px a browser may round the width either way; the groups must
    // match what its CSS decided.
    for (const width of ["641px", "640.25px", "640px"]) {
      await footer.evaluate((node, width) => (node.style.width = width), width);
      const layout = await nav.evaluate((node) => getComputedStyle(node).getPropertyValue("--hfooter-layout").trim());
      if (width === "641px") expect(layout).toBe("wide");
      if (width === "640px") expect(layout).toBe("folded");
      if (layout === "wide") {
        await expect(shop).toHaveAttribute("open", "");
        await expect(shop.locator(".hfooter-summary")).toHaveAttribute("tabindex", "-1");
        await expect(delivery).toBeVisible();
      } else {
        await expect(shop).not.toHaveAttribute("open");
        await expect(shop.locator(".hfooter-summary")).not.toHaveAttribute("tabindex");
        await expect(delivery).toBeHidden();
      }
    }
  });

  test("a group added later takes the layout: open while it's wide", async ({ page }) => {
    test.skip(page.url().includes("/react/"), "A React group takes it from its Footer, as it renders");
    const container = await example(page, "footer-default");
    const nav = container.getByRole("navigation", { name: "Footer" });
    await nav.evaluate((node) => {
      const group = node.querySelector(".hfooter-group")!.cloneNode(true) as HTMLDetailsElement;
      group.open = false;
      group.querySelector(".hfooter-summary")!.removeAttribute("tabindex");
      group.querySelector(".hfooter-heading")!.textContent = "Later";
      node.append(group);
    });
    const later = nav.locator(".hfooter-group").last();
    await expect(later).toHaveAttribute("open", "");
    await expect(later.locator(".hfooter-summary")).toHaveAttribute("tabindex", "-1");
  });

  test("its bottom row alone, with no groups, has no navigation", async ({ page }) => {
    const container = await example(page, "footer-bottom-row-only");
    await expect(container.locator("footer.hfooter")).toHaveCount(1);
    await expect(container.getByRole("navigation")).toHaveCount(0);
    await expect(container.locator(".hfooter-bottom").getByRole("link")).toHaveText(["Privacy", "Terms", "Help"]);
  });
});
