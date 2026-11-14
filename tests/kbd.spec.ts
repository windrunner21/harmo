import { expect, type Page } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/kbd.md says, on the Kbd page: on a filled button, the
// key is an outline in the label's color, on the button's own fill; on any
// other button, it keeps its own background.
const background = (page: Page, token: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);

onEachPlayground("kbd", () => {
  test("on a filled button, the key is an outline in the label's color; on a secondary one, it keeps its background", async ({ page }) => {
    const container = await example(page, "kbd-on-a-button");
    const create = container.getByRole("button", { name: "Create" });
    const filled = create.locator(".hkbd");
    await expect(filled).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(filled).toHaveCSS("color", await create.locator(".hbutton-label").evaluate((node) => getComputedStyle(node).color));

    const secondary = container.getByRole("button", { name: "Export" }).locator(".hkbd");
    await expect(secondary).toHaveCSS("background-color", await background(page, "--harmo-color-background"));
  });
});
