import { expect, type Locator } from "@playwright/test";

// Checks shared by the components built on Listbox: Listbox, Select, and
// Filter Chip.

// The highlighted option: `data-active` on it, and its id in the focused
// element's aria-activedescendant: the list, its search field, or a select's
// trigger.
export const expectActive = async (owner: Locator, option: Locator) => {
  await expect(option).toHaveAttribute("data-active", "");
  await expect(owner).toHaveAttribute("aria-activedescendant", (await option.getAttribute("id")) ?? "");
};

// The labels of an example's chosen options, and in a single-select one check
// mark, on the chosen option.
export const expectChosen = async (container: Locator, labels: string[]) => {
  const listbox = container.getByRole("listbox", { includeHidden: true });
  const chosen = listbox.locator('[role="option"][aria-selected="true"]');
  await expect(chosen.locator(".hoption-label")).toHaveText(labels);
  if ((await listbox.getAttribute("aria-multiselectable")) !== "true") {
    await expect(listbox.locator(".hoption-check")).toHaveCount(labels.length);
    await expect(chosen.locator(".hoption-check")).toHaveCount(labels.length);
  }
};
