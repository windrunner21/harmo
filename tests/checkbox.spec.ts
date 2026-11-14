import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// docs/components/checkbox.md: the mixed state is the indeterminate property,
// which a script sets; checking the box clears it, as the browser does. A
// group's checkboxes share its name; a disabled box can't be changed; and a
// larger box stays centered on its label's first line.
onEachPlayground("checkbox", () => {
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

  test("a larger checkbox is centered on its label's first line", async ({ page }) => {
    const container = await example(page, "checkbox-custom-size");
    const [checkbox, label] = await boxes(
      container.getByRole("checkbox", { name: "Send a weekly summary" }),
      container.getByText("Send a weekly summary"),
    );
    expect(checkbox.height).toBeCloseTo(24, 0);
    // The label's line is 20px tall.
    expect(checkbox.y + checkbox.height / 2).toBeCloseTo(label.y + 10, 0);
  });
});
