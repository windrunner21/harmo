import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// docs/components/checkbox.md: the mixed state is the indeterminate property,
// which a script sets; checking the box clears it, as the browser does.
onEachPlayground("checkbox", () => {
  test("a mixed checkbox is indeterminate until it's checked", async ({ page }) => {
    const container = await example(page, "checkbox-states");
    const checkbox = container.getByLabel("Select all reports");
    await expect(checkbox).toBeChecked({ indeterminate: true });

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).not.toBeChecked({ indeterminate: true });
  });
});
