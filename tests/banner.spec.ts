import { expect, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// docs/components/banner.md: an app keeps an urgent banner it shows later in
// the page with hidden, which .hbanner's own display mustn't override, and
// gives it role="alert", so screen readers announce it. It's padded and spaced
// on the scale, with a 20px icon, as in a Toast. Hovered, its action's
// background fills, and pressed, a step more, while its border stays put; in
// a narrow container, the action moves under the message rather than
// squeezing it.

// A color as the page computes it, such as a token's.
const computed = (page: Page, color: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, color);

onEachPlayground("banner", () => {
  test("a hidden banner stays hidden until shown, then reads as an alert", async ({ page }) => {
    const container = await example(page, "banner-added-after-the-page-loads");
    const banner = container.locator(".hbanner");
    await expect(banner).toBeHidden();

    await container.getByRole("button", { name: "Send message" }).click();
    await expect(banner).toBeVisible();
    await expect(container.getByRole("alert")).toHaveText(
      "The message wasn't sent. Check your connection and try again.",
    );
  });

  test("10px 16px of padding, 10px gaps, and a 20px icon", async ({ page }) => {
    const banner = (await example(page, "banner-statuses")).locator(".hbanner").first();
    await expect(banner).toHaveCSS("padding-top", "10px");
    await expect(banner).toHaveCSS("padding-left", "16px");
    await expect(banner).toHaveCSS("column-gap", "10px");
    await expect(banner.locator(".hbanner-icon")).toHaveCSS("width", "20px");
    await expect(banner.locator(".hbanner-icon")).toHaveCSS("height", "20px");
  });

  test("hovered, its action's background fills, pressed a step more, and its border stays as it was", async ({ page }) => {
    const action = (await example(page, "banner-with-an-action")).getByRole("button", { name: "Send template" });
    const border = await computed(page, "var(--harmo-button-secondary-color-border)");
    await expect(action).toHaveCSS("border-top-color", border);
    await action.hover();
    await expect(action).toHaveCSS("background-color", await computed(page, "var(--harmo-color-background-hover)"));
    await settled(action);
    await expect(action).toHaveCSS("border-top-color", border);
    await page.mouse.down();
    await expect(action).toHaveCSS("background-color", await computed(page, "var(--harmo-color-background-active)"));
    await settled(action);
    await expect(action).toHaveCSS("border-top-color", border);
    await page.mouse.up();
  });

  test("with room, the action sits beside the message; in a narrow container, it moves under it, at the end, and nothing overflows", async ({ page }) => {
    const wide = (await example(page, "banner-with-an-action")).locator(".hbanner");
    const [wideMessage, wideAction] = await boxes(wide.locator(".hbanner-message"), wide.getByRole("button"));
    expect(wideAction.y).toBeLessThan(wideMessage.y + wideMessage.height);

    const banner = (await example(page, "banner-long-message")).locator(".hbanner");
    const [box, icon, message, action] = await boxes(
      banner,
      banner.locator(".hbanner-icon"),
      banner.locator(".hbanner-message"),
      banner.getByRole("button", { name: "Send template" }),
    );
    expect(action.y).toBeGreaterThanOrEqual(message.y + message.height - 0.5);
    // At the end: 16px in from the banner's border.
    expect(action.x + action.width).toBeCloseTo(box.x + box.width - 1 - 16, 0);
    // The message takes the rest of the row beside the icon.
    expect(message.x).toBeCloseTo(icon.x + icon.width + 10, 0);
    expect(message.x + message.width).toBeCloseTo(box.x + box.width - 1 - 16, 0);
    expect(await banner.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });
});
