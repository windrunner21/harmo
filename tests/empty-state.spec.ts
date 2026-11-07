import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/empty-state.md says, on the Empty State page: a title
// that's a heading, an icon hidden from screen readers, centered or at the
// start; small and dashed; and after a search, read out as it appears.
onEachPlayground("empty-state", () => {
  test("a title that's a heading, what it's for, and its action, centered; the icon is hidden from screen readers", async ({ page }) => {
    const container = await example(page, "empty-state-default");
    const state = container.locator(".hempty-state");
    await expect(state.getByRole("heading", { level: 2, name: "No quick replies yet" })).toBeVisible();
    await expect(state.locator(".hempty-state-icon")).toHaveAttribute("aria-hidden", "true");
    await expect(state.getByRole("button", { name: "Add quick reply" })).toBeVisible();
    await expect(state).toHaveCSS("text-align", "center");
    const [box, title, action] = await boxes(state, state.locator(".hempty-state-title"), state.getByRole("button"));
    const middle = box.x + box.width / 2;
    expect(title.x + title.width / 2).toBeCloseTo(middle, 0);
    expect(action.x + action.width / 2).toBeCloseTo(middle, 0);
    await expect(state.locator(".hempty-state-description")).toHaveCSS("max-width", "400px");
  });

  test("at the start, its parts and actions line up at the start", async ({ page }) => {
    const container = await example(page, "empty-state-at-the-start");
    const state = container.locator(".hempty-state");
    await expect(state).toHaveCSS("text-align", "start");
    const [icon, title, action] = await boxes(
      state.locator(".hempty-state-icon"),
      state.locator(".hempty-state-title"),
      state.getByRole("button", { name: "Create campaign" }),
    );
    expect(title.x).toBeCloseTo(icon.x, 0);
    expect(action.x).toBeCloseTo(icon.x, 0);
  });

  test("a page you're not allowed to see links back", async ({ page }) => {
    const container = await example(page, "empty-state-not-allowed");
    await expect(container.getByRole("heading", { name: "You don't have access to Billing" })).toBeVisible();
    await expect(container.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  test("after a search that leaves nothing, it shows in a status in place of the results; Clear search brings them back", async ({ page }) => {
    const container = await example(page, "empty-state-after-a-search");
    const field = container.getByRole("searchbox", { name: "Search quick replies" });
    const results = container.locator("#reply-results");
    const status = container.getByRole("status");
    await expect(status.locator(".hempty-state")).toBeHidden();

    await field.fill("refund");
    await expect(results.locator("li:not([hidden])")).toHaveText(["Refund policy"]);
    await expect(status.locator(".hempty-state")).toBeHidden();

    await field.fill("invoice");
    await expect(results).toBeHidden();
    await expect(status.getByRole("heading", { level: 3, name: "No quick replies found" })).toBeVisible();

    await status.getByRole("button", { name: "Clear search" }).click();
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
    await expect(results).toBeVisible();
    await expect(results.locator("li:not([hidden])")).toHaveCount(3);
    await expect(status.locator(".hempty-state")).toBeHidden();
  });

  test("small and dashed: smaller text, less room, and a dashed border", async ({ page }) => {
    const container = await example(page, "empty-state-small-and-dashed");
    const [column, files] = await container.locator(".hempty-state").all();
    await expect(column).toHaveCSS("border-top-style", "dashed");
    await expect(column).toHaveCSS("padding-top", "24px");
    await expect(column.locator(".hempty-state-description")).toHaveCSS("font-size", "13px");
    await expect(files.getByRole("heading", { level: 3, name: "No files yet" })).toHaveCSS("font-size", "14px");
  });
});
