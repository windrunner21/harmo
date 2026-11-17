import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/message.md says: yours sits at the end, the
// assistant's at the start, a system line in the middle; a bubble is at most
// 85% of the conversation's width; an avatar column keeps a run's later
// messages in line; a rating is a toggle, one turning the other off; the
// typing dots are hidden from screen readers; "Not sent." has a button.
onEachPlayground("message", () => {
  test("yours at the end, the assistant's at the start, a system line in the middle", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "message-bubbles");
    const list = await container.locator("ol").boundingBox();
    const yours = await container.locator('.hmessage[data-from="user"] .hmessage-text').boundingBox();
    const reply = await container.locator('.hmessage[data-from="assistant"] .hmessage-text').first().boundingBox();
    const system = await container.locator('.hmessage[data-from="system"]').boundingBox();
    expect(Math.abs(yours!.x + yours!.width - (list!.x + list!.width))).toBeLessThan(1);
    expect(reply!.x).toBeLessThan(list!.x + 48);
    const text = await container.locator('.hmessage[data-from="system"]').evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    });
    expect(Math.abs(text.x + text.width / 2 - (system!.x + system!.width / 2))).toBeLessThan(1);
  });

  test("a run's later message lines up with the first, beside the avatar", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "message-bubbles");
    const [first, second] = await container.locator('.hmessage[data-from="assistant"] .hmessage-text').all();
    expect((await first!.boundingBox())!.x).toBe((await second!.boundingBox())!.x);
    await expect(container.locator(".hmessage-avatar").nth(1)).toHaveAttribute("aria-hidden", "true");
  });

  test("a rating is a toggle, and one turning on turns the other off", async ({ page }) => {
    const container = await example(page, "message-default");
    const good = container.getByRole("button", { name: "Good reply" });
    const bad = container.getByRole("button", { name: "Bad reply" });
    await good.click();
    await expect(good).toHaveAttribute("aria-pressed", "true");
    await bad.click();
    await expect(bad).toHaveAttribute("aria-pressed", "true");
    await expect(good).toHaveAttribute("aria-pressed", "false");
    await bad.click();
    await expect(bad).toHaveAttribute("aria-pressed", "false");
  });

  test("the typing dots are hidden from screen readers; Not sent has a way to try again", async ({ page }) => {
    const container = await example(page, "message-states");
    await expect(container.locator(".hmessage-typing")).toBeVisible();
    await expect(container.locator(".hmessage:has(.hmessage-typing)")).toHaveAttribute("aria-hidden", "true");
    await expect(container.locator(".hmessage-failed")).toHaveText("Not sent. Try again");
    await expect(container.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("its files sit above its text", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "message-with-files");
    const files = await container.getByRole("list", { name: "Attachments" }).boundingBox();
    const text = await container.locator(".hmessage-text").boundingBox();
    expect(files!.y + files!.height).toBeLessThanOrEqual(text!.y);
  });
});
