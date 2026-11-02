import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/button.md says a script does, on the Button page's
// Loading example, whose last button loads for two seconds.
onEachPlayground("button", () => {
  test("loading marks the button busy, shows a spinner, and keeps focus", async ({ page }) => {
    const container = await example(page, "button-loading");
    const button = container.getByRole("button", { name: "Save changes" });
    await button.click();

    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect(button).toBeFocused();

    await expect(button).not.toHaveAttribute("aria-busy", { timeout: 4000 });
    await expect(button).not.toHaveAttribute("aria-disabled");
    await expect(button.locator(".hspinner")).toHaveCount(0);
  });

  test("a press while it loads is ignored", async ({ page }) => {
    const container = await example(page, "button-loading");
    const button = container.getByRole("button", { name: "Save changes" });
    const spinners = button.locator(".hspinner");
    await button.click();
    // At once, while it loads. Forced: Playwright waits for an aria-disabled
    // button to be enabled.
    await button.click({ force: true });
    expect(await spinners.count(), "spinners right after the second press").toBe(1);

    // Done when the first press's loading ends, with nothing left over. In
    // React, a second press would also call the app's onClick again, which
    // this example doesn't show.
    await expect(button).not.toHaveAttribute("aria-busy", { timeout: 4000 });
    expect(await spinners.count(), "spinners once done").toBe(0);
  });
});
