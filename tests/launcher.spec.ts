import { expect } from "@playwright/test";
import { example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/launcher.md says: the button opens its panel above
// it, aria-expanded in step, focus moving to what's marked data-autofocus;
// Escape, the button, or the panel's Close closes it, focus back on the
// button; the page stays usable; what comes while it's closed is counted on
// a Badge, in the button's name and the status, and opening clears it.
onEachPlayground("launcher", () => {
  test("the button opens the panel, focus moving in; Escape closes it, focus back on the button", async ({ page }) => {
    const container = await example(page, "launcher-default");
    const button = container.getByRole("button", { name: "Help" });
    const panel = container.getByRole("dialog", { name: "Help" });
    await expect(panel).toBeHidden();
    await button.click();
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByRole("link", { name: "Track an order" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();

    await button.click();
    await panel.getByRole("button", { name: "Close" }).click();
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await button.click();
    await expect(panel).toBeHidden();
  });

  test("what comes while it's closed is counted, and opening clears it", async ({ page }) => {
    const container = await example(page, "launcher-with-new-messages");
    const arrive = container.getByRole("button", { name: "A message comes" });
    await arrive.click();
    const button = container.getByRole("button", { name: "Chat with Imran, 1 new" });
    await expect(button.locator(".hbadge")).toHaveText("1");
    await expect(container.locator(".hlauncher-status")).toHaveText("New message from Imran");
    await arrive.click();
    await expect(container.getByRole("button", { name: "Chat with Imran, 2 new" }).locator(".hbadge")).toHaveText("2");
    await expect(container.locator(".hlauncher-status")).toHaveText("2 new messages");
    await container.getByRole("button", { name: "Chat with Imran, 2 new" }).click();
    const panel = container.getByRole("dialog", { name: "Chat with Imran" });
    await expect(panel.locator(".hmessage")).toHaveCount(3);
    await expect(container.getByRole("button", { name: "Chat with Imran", exact: true })).toBeVisible();
    await expect(container.locator(".hlauncher-button .hbadge")).toHaveCount(0);
    await expect(container.locator(".hlauncher-status")).toHaveText("");
    await arrive.click();
    await expect(panel.locator(".hmessage")).toHaveCount(4);
    await expect(container.locator(".hlauncher-button .hbadge")).toHaveCount(0);
  });

  test("the panel sits above the button, in the corner, and the page stays usable", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "launcher-with-new-messages");
    const button = container.locator(".hlauncher-button");
    await button.click();
    const panel = container.getByRole("dialog", { name: "Chat with Imran" });
    await settled(panel);
    const [box, area, frame] = await Promise.all([button.boundingBox(), panel.boundingBox(), container.locator('[style*="contain"]').boundingBox()]);
    expect(Math.round(frame!.x + frame!.width - (box!.x + box!.width))).toBe(17);
    expect(Math.round(box!.y - (area!.y + area!.height))).toBe(10);
    expect(Math.round(area!.x + area!.width)).toBe(Math.round(box!.x + box!.width));
    await container.getByRole("button", { name: "A message comes" }).click();
    await expect(panel.locator(".hmessage")).toHaveCount(2);
    await expect(panel).toBeVisible();
  });
});
