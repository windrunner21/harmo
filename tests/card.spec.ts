import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/card.md says about a card's parts: an icon at the
// start, the title and a description beside it, a chevron at the end, each
// but the title left out without leaving room; the title in the accent in a
// card that's a link; and right to left, mirrored.
const color = (page: import("@playwright/test").Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

onEachPlayground("card", () => {
  test("a link with an icon: the icon at the start, 16px from the title, with the description 4px under it, the whole card named by both", async ({ page }) => {
    const nav = (await example(page, "card-links-with-icons")).getByRole("navigation", { name: "Settings" });
    const card = nav.getByRole("link", { name: /^Personal/ });
    await expect(card).toHaveAttribute("href", "/settings/personal");
    await expect(card).toHaveAccessibleName("Personal Your name, email address, language, and password.");
    await expect(card.getByRole("heading", { level: 3, name: "Personal" })).toBeVisible();
    await expect(card.locator(".hcard-icon")).toHaveAttribute("aria-hidden", "true");

    const [icon, title, description] = await boxes(card.locator(".hcard-icon"), card.locator(".hcard-title"), card.locator(".hcard-description"));
    expect(icon.width).toBeCloseTo(40, 0);
    expect(icon.y).toBeCloseTo(title.y, 0);
    expect(title.x - (icon.x + icon.width)).toBeCloseTo(16, 0);
    expect(description.x).toBeCloseTo(title.x, 0);
    expect(description.y - (title.y + title.height)).toBeCloseTo(4, 0);

    await expect(card.locator(".hcard-title")).toHaveCSS("color", await color(page, "--harmo-color-primary"));
    await expect(card.locator(".hcard-icon")).toHaveCSS("color", await color(page, "--harmo-color-primary"));
  });

  test("a link with a chevron and no icon: the title at the card's start, the chevron at its end, centered, turning into an arrow on hover", async ({ page }) => {
    const list = await example(page, "card-links-with-a-chevron");
    const card = list.getByRole("link", { name: /^Talk to us/ });
    const [box, title, chevron] = await boxes(card, card.locator(".hcard-title"), card.locator(".hcard-chevron"));
    // 12px of padding and the 1px border.
    expect(title.x - box.x).toBeCloseTo(13, 0);
    expect(box.x + box.width - (chevron.x + chevron.width)).toBeCloseTo(13, 0);
    expect(chevron.y + chevron.height / 2).toBeCloseTo(box.y + box.height / 2, 0);

    const shaft = card.locator(".hchevron-to-arrow-shaft");
    await page.mouse.move(0, 0);
    await expect(shaft).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(shaft).toHaveCSS("opacity", "1");
  });

  test("in a card that isn't a link, the title is in the text color, and the icon's tile in the page's", async ({ page }) => {
    const card = (await example(page, "card-not-a-link")).locator(".hcard");
    await expect(card.locator(".hcard-title")).toHaveCSS("color", await color(page, "--harmo-color-text"));
    const background = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.backgroundColor = "var(--harmo-color-background)";
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    await expect(card.locator(".hcard-icon")).toHaveCSS("background-color", background);
  });

  test("a long word or address breaks, rather than running into the chevron or out of the card", async ({ page }) => {
    const card = (await example(page, "card-links-with-a-chevron")).getByRole("link").first();
    await card.locator(".hcard-description").evaluate((description) => (description.textContent = "https://help.example.com/articles/activate-your-account-with-an-invitation"));
    const [box, description, chevron] = await boxes(card, card.locator(".hcard-description"), card.locator(".hcard-chevron"));
    expect(description.x + description.width).toBeLessThanOrEqual(chevron.x);
    expect(chevron.x + chevron.width).toBeLessThanOrEqual(box.x + box.width);
    expect(await card.locator(".hcard-description").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("the settings grid fits a 320px screen, one card to a row", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const container = await example(page, "card-links-with-icons");
    const [demo, nav] = await boxes(container.locator(".play-demo"), container.getByRole("navigation"));
    expect(nav.x + nav.width).toBeLessThanOrEqual(demo.x + demo.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const cards = await boxes(...(await container.getByRole("link").all()));
    for (const card of cards) expect(card.x).toBeCloseTo(cards[0]!.x, 0);
  });

  test("right to left, the icon is at the right and the chevron at the left", async ({ page }) => {
    const card = (await example(page, "card-right-to-left")).getByRole("link");
    const [icon, title, chevron] = await boxes(card.locator(".hcard-icon"), card.locator(".hcard-title"), card.locator(".hcard-chevron"));
    expect(icon.x).toBeGreaterThan(title.x + title.width);
    expect(chevron.x + chevron.width).toBeLessThan(title.x);
  });
});
