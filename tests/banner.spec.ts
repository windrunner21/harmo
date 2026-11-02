import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// docs/components/banner.md: an app keeps a banner it shows later in the page
// with hidden, which .hbanner's own display mustn't override, and gives it a
// role, so screen readers announce it.
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
});
