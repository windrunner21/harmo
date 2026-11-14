import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/settings.md says, on the Settings List page: a control
// under the text sits 16px below the description, and so does one that wraps
// its field; a disabled control, or a wrapper's disabled field, grays the
// row's text; and the title's size is a token.
const style = (element: Locator, property: string) =>
  element.evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);

const color = (page: Page, token: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);

onEachPlayground("settings", () => {
  test("a control that wraps its field sits under the description as a field does, and its disabled field grays the row", async ({ page }) => {
    const container = await example(page, "settings-other-controls");
    const row = container.locator(".hsetting").filter({ hasText: "Default language" });
    const title = row.locator(".hsetting-title");
    expect(await style(row.locator(".hselect"), "margin-top")).toBe("10px");
    expect(await style(title, "color")).toBe(await color(page, "--harmo-color-text"));

    // A highlighted Input under the description, where a Setting with
    // placement="below" puts its control.
    await row.locator(".hsetting-text").evaluate((text) => {
      const wrapper = document.createElement("div");
      wrapper.className = "hinput-highlight";
      wrapper.innerHTML = '<input class="hinput" aria-label="Greeting" />';
      text.append(wrapper);
    });
    const wrapper = row.locator(".hinput-highlight");
    expect(await style(wrapper, "margin-top")).toBe("10px");

    await wrapper.locator("input").evaluate((input) => ((input as HTMLInputElement).disabled = true));
    expect(await style(title, "color")).toBe(await color(page, "--harmo-color-text-tertiary"));
  });

  test("the description sits 6px under the title, and a control under the text 16px under the description", async ({ page }) => {
    const row = (await example(page, "settings-other-controls")).locator(".hsetting").filter({ hasText: "Default language" });
    const [title, description, control] = await boxes(row.locator(".hsetting-title"), row.locator(".hsetting-description"), row.locator(".hselect"));
    expect(description.y - (title.y + title.height)).toBeCloseTo(6, 0);
    expect(control.y - (description.y + description.height)).toBeCloseTo(16, 0);
  });

  test("the title is 15px, from --harmo-font-size-md, so a theme's type scale reaches it", async ({ page }) => {
    const title = (await example(page, "settings-switches")).locator(".hsetting-title").first();
    expect(await style(title, "font-size")).toBe("15px");
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-font-size-md", "17px"));
    expect(await style(title, "font-size")).toBe("17px");
  });
});
