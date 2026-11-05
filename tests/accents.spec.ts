import { expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { example, onEachPlayground, pointAt, ready, test } from "./playgrounds.ts";

const accents = ["purple", "blue", "green", "red", "amber", "teal", "pink", "mono"] as const;
const axe = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

// The playground sets color-scheme itself; these tests set it and the accent.
const use = (page: Page, accent: string, scheme: "light" | "dark") =>
  page.evaluate(
    ([accent, scheme]) => {
      document.documentElement.dataset.harmoAccent = accent;
      document.documentElement.style.colorScheme = scheme;
    },
    [accent, scheme] as const,
  );

// Each color role as the browser resolves it, in sRGB, with WCAG contrast
// worked out on the page.
const roles = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgb = (token: string) => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.backgroundColor = `var(${token})`;
      const css = getComputedStyle(probe).backgroundColor;
      probe.remove();
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = css;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const luminance = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const ratio = (a: number[], b: number[]) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
      return (x! + 0.05) / (y! + 0.05);
    };
    const page = rgb("--harmo-color-background");
    const white = rgb("--harmo-color-on-primary");
    const primary = rgb("--harmo-color-primary");
    return {
      text: ratio(primary, page),
      hover: ratio(rgb("--harmo-color-primary-hover"), page),
      marksOnTint: ratio(primary, rgb("--harmo-color-primary-tint")),
      label: ratio(white, rgb("--harmo-color-primary-fill")),
      labelHover: ratio(white, rgb("--harmo-color-primary-fill-hover")),
      labelPressed: ratio(white, rgb("--harmo-color-primary-fill-active")),
      track: ratio(rgb("--harmo-color-primary-fill"), page),
      thumb: ratio(rgb("--harmo-switch-thumb-color-background"), rgb("--harmo-color-primary-fill")),
      focus: ratio(rgb("--harmo-color-focus"), page),
      link: rgb("--harmo-link-color-text").join() === primary.join(),
      linkHover: ratio(rgb("--harmo-link-hover-color-text"), page),
      // A hovered link changes color, or else it's underlined.
      linkHoverChanges:
        rgb("--harmo-link-hover-color-text").join() !== rgb("--harmo-link-color-text").join() ||
        getComputedStyle(document.documentElement).getPropertyValue("--harmo-link-hover-text-decoration").trim() === "underline",
    };
  });

// What docs/components/README.md promises for every accent, in both modes.
onEachPlayground("button", () => {
  for (const accent of accents) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${accent}, ${scheme}: every role reaches WCAG AA`, async ({ page }) => {
        await use(page, accent, scheme);
        const r = await roles(page);
        expect(r.text, "primary text on the page").toBeGreaterThanOrEqual(4.5);
        expect(r.hover, "hovered text on the page").toBeGreaterThanOrEqual(4.5);
        expect(r.marksOnTint, "marks on the tint").toBeGreaterThanOrEqual(3);
        expect(r.label, "the text on a button").toBeGreaterThanOrEqual(4.5);
        expect(r.labelHover, "the text on a hovered button").toBeGreaterThanOrEqual(4.5);
        expect(r.labelPressed, "the text on a pressed button").toBeGreaterThanOrEqual(4.5);
        expect(r.thumb, "a switch's thumb on its track").toBeGreaterThanOrEqual(3);
        expect(r.track, "a switch's track on the page").toBeGreaterThanOrEqual(3);
        expect(r.focus, "the focus ring on the page").toBeGreaterThanOrEqual(3);
        expect(r.link, "links follow the primary").toBe(true);
        expect(r.linkHoverChanges, "a hovered link changes color, or is underlined").toBe(true);
        expect(r.linkHover, "a hovered link on the page").toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  test("an accent on a section recolors only that section", async ({ page }) => {
    const section = await example(page, "button-variants");
    const inside = section.locator(".hbutton").first();
    const outside = (await example(page, "button-small")).locator(".hbutton").first();
    await section.evaluate((element) => {
      element.dataset.harmoAccent = "green";
    });
    await expect(inside).toHaveCSS("background-color", "rgb(36, 109, 30)");
    await expect(outside).toHaveCSS("background-color", "rgb(94, 61, 232)");
  });

  test("an app's own value beats the accent", async ({ page }) => {
    await page.addStyleTag({ content: ":root { --harmo-color-primary-fill: rgb(1, 2, 3); }" });
    await use(page, "blue", "light");
    const button = (await example(page, "button-variants")).locator(".hbutton").first();
    await expect(button).toHaveCSS("background-color", "rgb(1, 2, 3)");
  });

  test("a button gets one step darker on hover in light, and lighter in dark, mono too", async ({ page }) => {
    const button = (await example(page, "button-variants")).locator(".hbutton").first();
    const lightness = () =>
      button.evaluate((element) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        context.fillStyle = getComputedStyle(element).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        return r! + g! + b!;
      });
    for (const [accent, scheme] of [["teal", "light"], ["teal", "dark"], ["mono", "light"], ["mono", "dark"]] as const) {
      await use(page, accent, scheme);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(250);
      const rest = await lightness();
      await pointAt(page, button);
      await page.waitForTimeout(250);
      const hover = await lightness();
      if (scheme === "light") expect(hover).toBeLessThan(rest);
      else expect(hover).toBeGreaterThan(rest);
    }
  });
});

// Mono's links are already the heading color, so they're underlined on hover;
// other accents' aren't, and an underlined link keeps its underline.
onEachPlayground("link", () => {
  const decoration = (page: Page, id: string) =>
    page.locator(`[id="${id}"] .hlink`).first().evaluate((link) => getComputedStyle(link).textDecorationLine);

  for (const scheme of ["light", "dark"] as const) {
    test(`mono, ${scheme}: a link is underlined on hover`, async ({ page }) => {
      await use(page, "mono", scheme);
      const link = (await example(page, "link-standalone")).locator(".hlink").first();
      expect(await decoration(page, "link-standalone")).toBe("none");
      await pointAt(page, link);
      await expect.poll(() => decoration(page, "link-standalone")).toBe("underline");
    });
  }

  test("purple's links change color on hover, without an underline", async ({ page }) => {
    const link = (await example(page, "link-standalone")).locator(".hlink").first();
    await pointAt(page, link);
    await expect(link).toHaveCSS("color", "rgb(48, 49, 61)");
    expect(await decoration(page, "link-standalone")).toBe("none");
  });

  test("a link in running text keeps its underline on hover, mono or not", async ({ page }) => {
    const link = (await example(page, "link-in-running-text")).locator(".hlink").first();
    for (const accent of ["purple", "mono"]) {
      await use(page, accent, "light");
      await pointAt(page, link);
      await expect.poll(() => decoration(page, "link-in-running-text")).toBe("underline");
      await page.mouse.move(0, 0);
      await expect.poll(() => decoration(page, "link-in-running-text")).toBe("underline");
    }
  });
});

// The playgrounds' own Accent picker, at the top of the sidebar.
onEachPlayground("index", () => {
  test("the Accent picker recolors the playground, and the choice is remembered", async ({ page }) => {
    const root = page.locator("html");
    const picker = page.getByRole("combobox", { name: "Accent" });
    await expect(picker).toHaveText(/Purple/);

    await picker.click();
    await page.getByRole("option", { name: "Teal" }).click();
    await expect(root).toHaveAttribute("data-harmo-accent", "teal");

    await page.reload();
    await ready(page);
    await expect(root).toHaveAttribute("data-harmo-accent", "teal");
    await expect(picker).toHaveText(/Teal/);

    await picker.click();
    await page.getByRole("option", { name: "Purple" }).click();
    await expect(root).not.toHaveAttribute("data-harmo-accent");
  });
});

// axe's contrast check on pages full of accented components, for every accent
// in both modes. One playground is enough: both use the same CSS.
for (const slug of ["button", "checkbox", "tabs", "listbox"]) {
  test(`axe finds no contrast problems on ${slug} with any accent`, async ({ page }) => {
    await page.goto(`file://${import.meta.dirname}/../examples/html/dist/${slug}.html`);
    await page.addScriptTag({ path: axe });
    const failures: string[] = [];
    for (const accent of accents) {
      for (const scheme of ["light", "dark"] as const) {
        await use(page, accent, scheme);
        const violations = await page.evaluate(async () => {
          await new Promise((resolve) => setTimeout(resolve, 260));
          const { axe } = window as unknown as { axe: typeof import("axe-core") };
          const result = await axe.run(document, {
            runOnly: { type: "rule", values: ["color-contrast"] },
            resultTypes: ["violations"],
            preload: false,
          });
          return result.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" ")));
        });
        failures.push(...violations.map((target) => `${accent} ${scheme}: ${target}`));
      }
    }
    expect(failures).toEqual([]);
  });
}
