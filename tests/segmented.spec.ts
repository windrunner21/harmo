import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/segmented.md says, on the Segmented Control page: each
// option is a native radio, so a click chooses it and the arrow keys move the
// choice, past a disabled option.
onEachPlayground("segmented", () => {
  test("the group is named by its label, and clicking an option chooses it", async ({ page }) => {
    const container = await example(page, "segmented-options");
    const group = container.getByRole("radiogroup", { name: "Message header" });
    await expect(group.getByRole("radio", { name: "No header" })).toBeChecked();

    await group.getByText("Media").click();
    await expect(group.getByRole("radio", { name: "Media" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "No header" })).not.toBeChecked();
  });

  test("the arrow keys move the choice, skipping a disabled option", async ({ page }) => {
    const container = await example(page, "segmented-disabled-option");
    const team = container.getByRole("radio", { name: "Team" });
    const agent = container.getByRole("radio", { name: "Agent", exact: true });
    const ai = container.getByRole("radio", { name: "AI agent" });
    await expect(team).toBeChecked();
    await expect(ai).toBeDisabled();

    await team.focus();
    await page.keyboard.press("ArrowRight");
    await expect(agent).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(team).toBeChecked();
    await expect(ai).not.toBeChecked();
  });
});
