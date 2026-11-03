import { expect, type Locator } from "@playwright/test";
import { animations, example, onEachPlayground, release, settled, slowDown, test } from "./playgrounds.ts";

// What hidden does beyond hiding an element, which pages.spec.ts checks on every
// page. The closes that stay animated, whichever way hidden is handled elsewhere.
onEachPlayground("password", () => {
  test("the strength details animate closed, then take no space", async ({ page }) => {
    const container = await example(page, "password-new-password");
    const input = container.getByLabel("New password");
    const details = container.locator(".hpassword-details");
    await input.fill("short");
    await expect(details).toBeVisible();
    await settled(details);
    await slowDown(details);

    await input.fill("");
    await expect(details).toHaveAttribute("hidden");
    expect(await details.evaluate((element) => getComputedStyle(element).display), "kept rendered").toBe("grid");
    expect(await animations(details), "closing animations").toBeGreaterThan(0);

    await release(details);
    await expect(details).toBeHidden();
  });
});

onEachPlayground("settings", () => {
  test("the rows still shown take the first and last row's look", async ({ page }) => {
    const rows = (await example(page, "settings-switches")).locator(".hsetting");
    const first = rows.first();
    const second = rows.nth(1);
    const last = rows.last();
    const beforeLast = rows.nth((await rows.count()) - 2);

    await hide(first);
    await expect(second).toHaveCSS("padding-block-start", "0px");

    await hide(last);
    await expect(beforeLast).toHaveCSS("padding-block-end", "0px");
    await expect(beforeLast).toHaveCSS("border-block-end-style", "none");
  });
});

onEachPlayground("breadcrumb", () => {
  test("the first item still shown has no separator before it", async ({ page }) => {
    const items = (await example(page, "breadcrumb-trail")).locator("ol > li");
    const separator = items.nth(1).locator(".hbreadcrumb-separator");
    await expect(separator).toBeVisible();

    await hide(items.first());
    await expect(separator).toBeHidden();
  });
});

onEachPlayground("tabs", () => {
  test("the arrow keys skip a hidden tab", async ({ page }) => {
    const container = await example(page, "tabs-switching-panels");
    const all = container.getByRole("tab", { name: "All" });
    await hide(container.getByRole("tab", { name: "Private" }));

    await all.focus();
    await page.keyboard.press("ArrowRight");
    await expect(container.getByRole("tab", { name: "Team" })).toBeFocused();
    await expect(container.getByRole("tab", { name: "Team" })).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(all).toBeFocused();
  });
});

const hide = (element: Locator) => element.evaluate((node) => ((node as HTMLElement).hidden = true));
