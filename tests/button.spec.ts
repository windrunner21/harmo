import { expect, type Page } from "@playwright/test";
import { example, onEachPlayground, ready, test } from "./playgrounds.ts";

// What docs/components/button.md says a script does, on the Button page's
// Loading example, whose last button loads for two seconds. The page runs on
// a paused clock, so those seconds pass only when a test says.
onEachPlayground("button", () => {
  test("loading marks the button busy, shows a spinner, and keeps focus", async ({ page }) => {
    const button = await loadingButton(page);
    await button.click();

    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect(button).toBeFocused();

    await page.clock.runFor(2000);
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(button).not.toHaveAttribute("aria-disabled");
    await expect(button.locator(".hspinner")).toHaveCount(0);
  });

  test("a press while it loads is ignored", async ({ page }) => {
    const button = await loadingButton(page);
    const spinners = button.locator(".hspinner");
    await button.click();
    await page.clock.runFor(1000);
    // Forced: Playwright waits for an aria-disabled button to be enabled.
    await button.click({ force: true });
    expect(await spinners.count(), "spinners after the second press").toBe(1);

    // Done when the first press's two seconds are up, with nothing left
    // over: the second didn't start loading again. In React, a second press
    // would also call the app's onClick again, which this example doesn't
    // show.
    await page.clock.runFor(1000);
    await expect(button).not.toHaveAttribute("aria-busy");
    expect(await spinners.count(), "spinners once done").toBe(0);
  });
});

// The Loading example's last button, on the page reloaded with a paused
// clock: fake timers must be in place before the page's scripts run.
const loadingButton = async (page: Page) => {
  await page.clock.install();
  await page.reload();
  await ready(page);
  await page.clock.pauseAt(Date.now() + 1000);
  const container = await example(page, "button-loading");
  return container.getByRole("button", { name: "Save changes" });
};
