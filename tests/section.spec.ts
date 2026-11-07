import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/section.md says, on the Section page: a region named by
// its title, a line under its header, actions at its end that wrap under the
// text in a narrow space, and its content stacked, styled by nothing of its own.
const styleOf = (element: Locator, property: string) =>
  element.evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);

// A token's value as the browser computes a color from it.
const color = (page: Page, token: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);

onEachPlayground("section", () => {
  test("it's a region named by its title, with its description under it and a line under its header", async ({ page }) => {
    const container = await example(page, "section-default");
    const section = container.getByRole("region", { name: "Notifications" });
    await expect(section).toBeVisible();
    const title = section.getByRole("heading", { level: 2, name: "Notifications" });
    await expect(title).toBeVisible();
    expect(await styleOf(title, "font-size")).toBe("20px");
    const description = section.locator(".hsection-description");
    expect(await styleOf(description, "color")).toBe(await color(page, "--harmo-color-text-secondary"));
    const [titleBox, descriptionBox] = await boxes(title, description);
    expect(descriptionBox.y - (titleBox.y + titleBox.height)).toBeCloseTo(4, 0);

    const header = section.locator(".hsection-header");
    expect(await styleOf(header, "border-bottom-width")).toBe("1px");
    expect(await styleOf(header, "border-bottom-color")).toBe(await color(page, "--harmo-color-border"));
    const [text, line] = await boxes(section.locator(".hsection-text"), header);
    expect(line.y + line.height - (text.y + text.height)).toBeCloseTo(12 + 1, 0);
  });

  test("its content starts 24px below the line, stacked 20px apart", async ({ page }) => {
    const container = await example(page, "section-with-actions");
    const section = container.locator(".hsection");
    const [header, first, second] = await boxes(
      section.locator(".hsection-header"),
      section.locator(".hfield").nth(0),
      section.locator(".hfield").nth(1),
    );
    expect(first.y - (header.y + header.height)).toBeCloseTo(24, 0);
    expect(second.y - (first.y + first.height)).toBeCloseTo(20, 0);
  });

  test("its actions sit at the header's end, after the text and centered on it; in a narrow space they wrap under it", async ({ page }) => {
    const wide = (await example(page, "section-with-actions")).locator(".hsection");
    const [header, text, actions] = await boxes(
      wide.locator(".hsection-header"),
      wide.locator(".hsection-text"),
      wide.locator(".hsection-actions"),
    );
    expect(actions.x + actions.width).toBeCloseTo(header.x + header.width, 0);
    expect(actions.x).toBeGreaterThanOrEqual(text.x + text.width);
    expect(actions.y + actions.height / 2).toBeCloseTo(text.y + text.height / 2, 0);

    const narrow = (await example(page, "section-in-a-narrow-space")).locator(".hsection");
    const [narrowText, narrowActions] = await boxes(narrow.locator(".hsection-text"), narrow.locator(".hsection-actions"));
    expect(narrowActions.y).toBeGreaterThanOrEqual(narrowText.y + narrowText.height);
  });

  test("on a right-to-left page, its actions sit at the left end", async ({ page }) => {
    const section = (await example(page, "section-with-actions")).locator(".hsection");
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    const [header, text, actions] = await boxes(
      section.locator(".hsection-header"),
      section.locator(".hsection-text"),
      section.locator(".hsection-actions"),
    );
    expect(actions.x).toBeCloseTo(header.x, 0);
    expect(actions.x + actions.width).toBeLessThanOrEqual(text.x);
  });

  test("a long unbroken title wraps rather than overflowing", async ({ page }) => {
    const section = (await example(page, "section-in-a-narrow-space")).locator(".hsection");
    const title = section.locator(".hsection-title");
    await title.evaluate((node) => (node.textContent = "Teammembersandinvitations".repeat(4)));
    expect(await title.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await section.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("it styles nothing inside it: a Settings List in it looks as one outside it does", async ({ page }) => {
    const container = await example(page, "section-default");
    // The same list, outside the section, beside it: each element's look
    // should match, apart from where it lands.
    const differences = await container.locator(".hsettings").evaluate((list) => {
      const outside = list.cloneNode(true) as HTMLElement;
      list.closest(".hsection")!.after(outside);
      const properties = [
        "color", "background-color", "font-family", "font-size", "font-weight", "line-height",
        "margin-top", "margin-bottom", "padding-top", "padding-bottom", "padding-left",
        "border-top-width", "border-bottom-width", "border-bottom-color", "display", "gap",
        "flex-direction", "inline-size", "block-size",
      ];
      const [inside, copy] = [list, outside].map((root) => [root, ...root.querySelectorAll("*")]);
      const found: string[] = [];
      inside.forEach((node, index) => {
        const [a, b] = [getComputedStyle(node), getComputedStyle(copy[index]!)];
        for (const property of properties) {
          if (property === "inline-size" && node === list) continue;
          if (a.getPropertyValue(property) !== b.getPropertyValue(property)) {
            found.push(`${(node as HTMLElement).className || node.tagName} ${property}`);
          }
        }
      });
      outside.remove();
      return found;
    });
    expect(differences).toEqual([]);
  });
});
