import { expect, type Page } from "@playwright/test";
import { example, onEachPlayground, pointAt, test } from "./playgrounds.ts";

const LIGHT = "rgb(48, 49, 61)";
const DARK = "rgb(241, 242, 246)";

// What a token resolves to on an element, inside a parent with this style.
const resolved = (page: Page, token: string, property: "color" | "boxShadow" = "color", parentStyle = "") =>
  page.evaluate(
    ([token, property, parentStyle]) => {
      const parent = document.body.appendChild(document.createElement("div"));
      parent.style.cssText = parentStyle;
      const probe = parent.appendChild(document.createElement("div"));
      probe.style.setProperty(property === "color" ? "color" : "box-shadow", `var(${token})`);
      const value = getComputedStyle(probe)[property];
      parent.remove();
      return value;
    },
    [token, property, parentStyle] as const,
  );

const textColor = (page: Page, parentStyle?: string) => resolved(page, "--harmo-color-text", "color", parentStyle);

// The playground sets color-scheme itself, from its Dark switch; these tests
// start from Harmo alone.
const withoutPlaygroundScheme = (page: Page) =>
  page.evaluate(() => document.documentElement.style.removeProperty("color-scheme"));

// Dark mode is the browser's: color-scheme picks a side of each token's light-dark().
onEachPlayground("button", () => {
  test.beforeEach(({ page }) => withoutPlaygroundScheme(page));

  test("without color-scheme, it stays light, even on a dark system", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await textColor(page)).toBe(LIGHT);
  });

  test("color-scheme: dark turns dark on", async ({ page }) => {
    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    expect(await textColor(page)).toBe(DARK);
  });

  test("color-scheme: light dark follows the system", async ({ page }) => {
    await page.addStyleTag({ content: ":root { color-scheme: light dark; }" });
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await textColor(page)).toBe(DARK);
    await page.emulateMedia({ colorScheme: "light" });
    expect(await textColor(page)).toBe(LIGHT);
  });

  test("one section can differ from the page", async ({ page }) => {
    expect(await textColor(page, "color-scheme: dark")).toBe(DARK);
    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    expect(await textColor(page, "color-scheme: light")).toBe(LIGHT);
  });

  test("a token built from another follows it", async ({ page }) => {
    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    expect(await resolved(page, "--harmo-link-hover-color-text")).toBe(DARK);
  });

  test("a color inside a shadow changes too", async ({ page }) => {
    const light = await resolved(page, "--harmo-box-shadow-sm", "boxShadow");
    expect(light).toContain("0.08");
    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    expect(await resolved(page, "--harmo-box-shadow-sm", "boxShadow")).toContain("0.4");
  });

  test("an app's own value applies in both", async ({ page }) => {
    await page.addStyleTag({ content: ":root { --harmo-color-text: rgb(1, 2, 3); }" });
    expect(await textColor(page)).toBe("rgb(1, 2, 3)");
    expect(await textColor(page, "color-scheme: dark")).toBe("rgb(1, 2, 3)");
  });

  test("a filled button is deeper in dark, so white reads on it", async ({ page }) => {
    const button = (await example(page, "button-variants")).locator(".hbutton").first();
    await expect(button).toHaveCSS("background-color", "rgb(94, 61, 232)");

    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    await expect(button).toHaveCSS("background-color", "rgb(122, 92, 240)");
    await expect(button).toHaveCSS("border-block-start-color", "rgb(122, 92, 240)");
    await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");

    await pointAt(page, button);
    await expect(button).toHaveCSS("background-color", "rgb(107, 77, 230)");
  });

  test("a light theme's primary still reaches a filled button", async ({ page }) => {
    await page.addStyleTag({ content: ":root { --harmo-color-primary: rgb(1, 2, 3); }" });
    const button = (await example(page, "button-variants")).locator(".hbutton").first();
    await expect(button).toHaveCSS("background-color", "rgb(1, 2, 3)");
  });

  test("a theme sets the fill for dark itself", async ({ page }) => {
    await page.addStyleTag({
      content: ":root { color-scheme: dark; --harmo-color-primary-fill: light-dark(rgb(1, 2, 3), rgb(4, 5, 6)); }",
    });
    const button = (await example(page, "button-variants")).locator(".hbutton").first();
    await expect(button).toHaveCSS("background-color", "rgb(4, 5, 6)");
  });
});

onEachPlayground("switch", () => {
  test.beforeEach(({ page }) => withoutPlaygroundScheme(page));

  test("a switch that's on uses the same fill", async ({ page }) => {
    const on = (await example(page, "switch-off-and-on")).locator(".hswitch:checked").first();
    await expect(on).toHaveCSS("background-color", "rgb(94, 61, 232)");
    await page.addStyleTag({ content: ":root { color-scheme: dark; }" });
    await expect(on).toHaveCSS("background-color", "rgb(122, 92, 240)");
  });
});

// The playground's own Dark switch, in its header.
onEachPlayground("index", () => {
  const scheme = (page: Page) => page.evaluate(() => document.documentElement.style.colorScheme);

  test("it starts from the system's setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    expect(await scheme(page)).toBe("dark");
    await expect(page.getByRole("switch", { name: "Dark" })).toBeChecked();
  });

  test("the Dark switch changes it, and the choice is remembered", async ({ page }) => {
    const toggle = page.getByRole("switch", { name: "Dark" });
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    expect(await scheme(page)).toBe("dark");
    expect(await textColor(page)).toBe(DARK);

    await page.reload();
    expect(await scheme(page)).toBe("dark");
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await page.reload();
    expect(await scheme(page)).toBe("light");
  });
});
