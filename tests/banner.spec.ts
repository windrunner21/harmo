import { expect, type Page } from "@playwright/test";
import { example, onEachPlayground, settled, test } from "./playgrounds.ts";

// docs/components/banner.md: an app keeps a banner it shows later in the page
// with hidden, which .hbanner's own display mustn't override, and gives it a
// role, so screen readers announce it. Hovered, its action's background fills
// and its border stays put.

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

  test("hovered, its action's background fills, and its border stays as it was", async ({ page }) => {
    const action = (await example(page, "banner-with-an-action")).getByRole("button", { name: "Send template" });
    const border = await computed(page, "var(--harmo-button-secondary-color-border)");
    await expect(action).toHaveCSS("border-top-color", border);
    await action.hover();
    await expect(action).toHaveCSS("background-color", await computed(page, "var(--harmo-color-background-secondary)"));
    await settled(action);
    await expect(action).toHaveCSS("border-top-color", border);
  });
});
