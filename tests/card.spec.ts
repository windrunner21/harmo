import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/card.md says about a card's parts: an icon at the
// start, the title and a description beside it, a chevron at the end, each
// but the title left out without leaving room; the title in the accent in a
// card that's a link; a link card a step darker while pressed; and right to
// left, mirrored. Only CSS and the markup decide these, so they're tested on
// the HTML playground.
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
  test("a link with an icon: the icon at the start, 16px from the title, with the description 6px under it, the whole card named by both", { tag: "@css" }, async ({ page }) => {
    const nav = (await example(page, "card-links-with-icons")).getByRole("navigation", { name: "Settings" });
    const card = nav.getByRole("link", { name: /^Personal/ });
    await expect(card).toHaveAttribute("href", "/settings/personal");
    await expect(card).toHaveAccessibleName("Personal Your name, email address, language, and password.");
    await expect(card.getByRole("heading", { level: 4, name: "Personal" })).toBeVisible();
    await expect(card.locator(".hcard-icon")).toHaveAttribute("aria-hidden", "true");

    const [icon, title, description] = await boxes(card.locator(".hcard-icon"), card.locator(".hcard-title"), card.locator(".hcard-description"));
    expect(icon.width).toBeCloseTo(40, 0);
    expect(icon.y).toBeCloseTo(title.y, 0);
    expect(title.x - (icon.x + icon.width)).toBeCloseTo(16, 0);
    expect(description.x).toBeCloseTo(title.x, 0);
    expect(description.y - (title.y + title.height)).toBeCloseTo(6, 0);

    await expect(card.locator(".hcard-title")).toHaveCSS("color", await color(page, "--harmo-color-primary"));
    await expect(card.locator(".hcard-icon")).toHaveCSS("color", await color(page, "--harmo-color-primary"));
  });

  test("a link with a chevron and no icon: the title at the card's start, the chevron at its end, centered, turning into an arrow on hover", { tag: "@css" }, async ({ page }) => {
    const list = await example(page, "card-links-with-a-chevron");
    const card = list.getByRole("link", { name: /^Talk to us/ });
    const [box, title, chevron] = await boxes(card, card.locator(".hcard-title"), card.locator(".hcard-chevron"));
    // 10px of padding, --harmo-space-xs, and the 1px border.
    expect(title.x - box.x).toBeCloseTo(11, 0);
    expect(box.x + box.width - (chevron.x + chevron.width)).toBeCloseTo(11, 0);
    expect(chevron.y + chevron.height / 2).toBeCloseTo(box.y + box.height / 2, 0);

    const shaft = card.locator(".hchevron-to-arrow-shaft");
    await page.mouse.move(0, 0);
    await expect(shaft).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(shaft).toHaveCSS("opacity", "1");
  });

  test("pressed, a link card is a step darker, whatever its variant, as a tap on a touch screen shows", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "card-ghost")).getByRole("link", { name: "Team members" });
    const background = (token: string) =>
      page.evaluate((token) => {
        const probe = document.createElement("span");
        document.body.append(probe);
        probe.style.backgroundColor = `var(${token})`;
        const value = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return value;
      }, token);
    const variants: [string | null, string][] = [
      ["ghost", "--harmo-color-background-active"],
      [null, "--harmo-color-background-active"],
      ["raised", "--harmo-color-background-hover"],
    ];
    for (const [variant, pressed] of variants) {
      await card.evaluate((node, variant) => (variant ? node.setAttribute("data-variant", variant) : node.removeAttribute("data-variant")), variant);
      await card.hover();
      await page.mouse.down();
      await expect(card, `${variant ?? "tinted"}, pressed`).toHaveCSS("background-color", await background(pressed));
      // Let go away from it, so it isn't followed.
      await page.mouse.move(0, 0);
      await page.mouse.up();
    }
  });

  test("in a card that isn't a link, the title is in the text color, and the icon's tile in the page's", { tag: "@css" }, async ({ page }) => {
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

  test("its padding is --harmo-space-sm by default, so a theme that changes the space scale on :root changes it too", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "card-links-with-icons")).locator(".hcard").first();
    await expect(card).toHaveCSS("padding-top", "16px");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-space-sm", "20px"));
    await expect(card).toHaveCSS("padding-top", "20px");
  });

  test("a long word or address breaks, rather than running into the chevron or out of the card", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "card-links-with-a-chevron")).getByRole("link").first();
    await card.locator(".hcard-description").evaluate((description) => (description.textContent = "https://help.example.com/articles/activate-your-account-with-an-invitation"));
    const [box, description, chevron] = await boxes(card, card.locator(".hcard-description"), card.locator(".hcard-chevron"));
    expect(description.x + description.width).toBeLessThanOrEqual(chevron.x);
    expect(chevron.x + chevron.width).toBeLessThanOrEqual(box.x + box.width);
    expect(await card.locator(".hcard-description").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("right to left, the icon is at the right and the chevron at the left", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "card-right-to-left")).getByRole("link");
    const [icon, title, chevron] = await boxes(card.locator(".hcard-icon"), card.locator(".hcard-title"), card.locator(".hcard-chevron"));
    expect(icon.x).toBeGreaterThan(title.x + title.width);
    expect(chevron.x + chevron.width).toBeLessThan(title.x);
  });

  test("a ghost list's frames line up with the section's sides, its first row a step under the header's line", { tag: "@css" }, async ({ page }) => {
    const ghost = await example(page, "card-ghost");
    const [header, first] = await boxes(ghost.locator(".hsection-header"), ghost.getByRole("link", { name: "Team members" }));
    expect(first!.x).toBeCloseTo(header!.x, 0);
    expect(first!.x + first!.width).toBeCloseTo(header!.x + header!.width, 0);
    // The section's 26px gap, less the 16px padding and 1px border pulled up.
    expect(first!.y - (header!.y + header!.height)).toBeCloseTo(9, 0);

    const settings = await example(page, "card-links-with-icons");
    const cards = settings.locator(".hcard");
    const [line, start, end] = await boxes(settings.locator(".hsection-header"), cards.first(), cards.nth(1));
    expect(start!.x).toBeCloseTo(line!.x, 0);
    expect(end!.x + end!.width).toBeCloseTo(line!.x + line!.width, 0);
  });
});
