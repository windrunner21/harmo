import { expect } from "@playwright/test";
import { boxes, clickAt, colorOf, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// docs/components/checkbox.md: the mixed state is the indeterminate property,
// which a script sets; checking the box clears it, as the browser does. A
// group's checkboxes share its name; a disabled box can't be changed; a
// larger box stays centered on its label's first line; and a toggle from the
// keyboard changes at once, while one with the pointer fades. As a choice
// card, per docs/components/field.md, a checkbox and its label are a bordered
// tile, checked by a click anywhere on it, with the checkbox's colors once
// checked. How they look, which only CSS and the markup decide, is tested on
// the HTML playground.
onEachPlayground("checkbox", () => {
  test("as cards: a bordered tile with a medium label, and checked, the primary border on the tint", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "checkbox-cards");
    const cards = container.locator('.hfield[data-variant="card"]');
    await expect(cards).toHaveCount(3);
    const support = cards.first();
    const storage = cards.nth(1);
    await expect(support).toHaveCSS("border-top-width", "1px");
    await expect(support).toHaveCSS("border-top-color", await colorOf(page, "var(--harmo-color-border)"));
    await expect(support).toHaveCSS("border-top-left-radius", "8px");
    await expect(support).toHaveCSS("padding-top", "16px");
    await expect(support.locator(".hlabel")).toHaveCSS("font-weight", "500");
    await expect(support.getByRole("checkbox", { name: "Priority support" })).toHaveAccessibleDescription(
      "Answers within an hour, at any time of day.",
    );
    await expect(storage.getByRole("checkbox")).toBeChecked();
    await settled(storage);
    await expect(storage).toHaveCSS("border-top-color", await colorOf(page, "var(--harmo-color-primary)"));
    await expect(storage).toHaveCSS("background-color", await colorOf(page, "var(--harmo-color-primary-tint)"));
  });

  test("as cards, a click on a card's padding or its description toggles it", async ({ page }) => {
    const container = await example(page, "checkbox-cards");
    const cards = container.locator('.hfield[data-variant="card"]');
    const support = cards.first();
    const storage = cards.nth(1);
    const [card] = await boxes(support);
    await support.click({ position: { x: card!.width - 6, y: card!.height / 2 } });
    await expect(support.getByRole("checkbox")).toBeChecked();
    await clickAt(page, storage.locator(".hdescription"));
    await expect(storage.getByRole("checkbox")).not.toBeChecked();
    await expect(support.getByRole("checkbox")).toBeChecked();
  });

  test("toggled with the pointer, it fades in 150ms; from the keyboard, it changes at once", async ({ page }) => {
    const container = await example(page, "checkbox-group");
    const checkbox = container.getByRole("checkbox").first();
    const durations = () => checkbox.evaluate((node) => [...new Set(getComputedStyle(node).transitionDuration.split(", "))]);
    await checkbox.click();
    expect(await durations()).toEqual(["0.15s"]);
    // Back to it with the keyboard, as someone using one reaches it: after a
    // click, Firefox doesn't count a key pressed on the same box as keyboard
    // focus, so the change would fade there.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(checkbox).toBeFocused();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate((node) => node.matches(":focus-visible"))).toBe(true);
    expect(await durations()).toEqual(["0s"]);
  });

  test("a mixed checkbox is indeterminate until it's checked", async ({ page }) => {
    const container = await example(page, "checkbox-states");
    const checkbox = container.getByLabel("Select all reports");
    await expect(checkbox).toBeChecked({ indeterminate: true });

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).not.toBeChecked({ indeterminate: true });
  });

  test("a group's checkboxes share its name and start with its values, and a click toggles one", async ({ page }) => {
    const container = await example(page, "checkbox-group");
    const group = container.getByRole("group", { name: "Notify me about" });
    const checkboxes = await group.getByRole("checkbox").all();
    expect(checkboxes).toHaveLength(3);
    for (const checkbox of checkboxes) await expect(checkbox).toHaveAttribute("name", "notify");
    await expect(group.getByRole("checkbox", { name: "New messages" })).toBeChecked();
    await expect(group.getByRole("checkbox", { name: "Mentions" })).toBeChecked();
    const failures = group.getByRole("checkbox", { name: "Failed campaigns" });
    await expect(failures).not.toBeChecked();

    await group.getByText("Failed campaigns").click();
    await expect(failures).toBeChecked();
    await group.getByText("Mentions").click();
    await expect(group.getByRole("checkbox", { name: "Mentions" })).not.toBeChecked();
  });

  test("disabled checkboxes stay as they are, checked, mixed, or not", async ({ page }) => {
    const container = await example(page, "checkbox-disabled");
    const checkboxes = await container.getByRole("checkbox").all();
    expect(checkboxes).toHaveLength(3);
    for (const checkbox of checkboxes) await expect(checkbox).toBeDisabled();
    const mixed = container.getByRole("checkbox", { name: "Some reports shared by your administrator" });
    await expect(mixed).toBeChecked({ indeterminate: true });
    await container.getByText("Some reports shared by your administrator").click({ force: true });
    await expect(mixed).toBeChecked({ indeterminate: true });
  });

  test("a larger checkbox is centered on its label's first line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "checkbox-custom-size");
    const [checkbox, label] = await boxes(
      container.getByRole("checkbox", { name: "Send a weekly summary" }),
      container.getByText("Send a weekly summary"),
    );
    expect(checkbox.height).toBeCloseTo(24, 0);
    // The label's line is 20px tall.
    expect(checkbox.y + checkbox.height / 2).toBeCloseTo(label.y + 10, 0);
  });

  test("small, for fine print: a 13px label and a 16px box, beside the label's first line", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "checkbox-small");
    const fields = container.locator(".hfield");
    for (const field of await fields.all()) {
      const box = field.locator(".hcheckbox");
      const label = field.locator(".hlabel");
      await expect(label).toHaveCSS("font-size", "13px");
      const [check, text] = await boxes(box, label);
      expect(check!.width).toBeCloseTo(16, 0);
      // Centered on the label's first 20px line, however many lines it takes.
      expect(check!.y + check!.height / 2).toBeCloseTo(text!.y + 10, 0);
    }
  });
});
