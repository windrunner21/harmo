import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/spinner.md says, on the Spinner page: it turns; with
// data-delay it's hidden for its first 300ms; with reduced motion it fades
// where it is instead of turning; and in forced colors its track and arc are
// the system's colors.

// What moves it: the first of its animations, the second being its delay.
const motion = (spinner: Locator) =>
  spinner.evaluate((node) => getComputedStyle(node).animationName.split(",")[0]!.trim());

onEachPlayground("spinner", () => {
  test("it turns; with reduced motion, it fades toward 40% opacity and back, without turning", async ({ page }) => {
    const spinner = (await example(page, "spinner-sizes")).locator(".hspinner").nth(1);
    expect(await motion(spinner)).toBe("hspinner-rotate");

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await motion(spinner)).toBe("hspinner-pulse");
    // Held halfway through a fade: partway to 40%, and not turned.
    const halfway = await spinner.evaluate((node) => {
      const pulse = node.getAnimations().find((animation) => (animation as CSSAnimation).animationName === "hspinner-pulse")!;
      pulse.pause();
      pulse.currentTime = 500;
      const { opacity, transform } = getComputedStyle(node);
      return { opacity: Number(opacity), transform };
    });
    expect(halfway.opacity).toBeCloseTo(0.7, 1);
    expect(halfway.transform).toBe("none");
  });

  test("with data-delay, it's hidden for its first 300ms, then shows", async ({ page }) => {
    const spinner = (await example(page, "spinner-delayed")).locator(".hspinner");
    // Its delay held at moments of it, so it doesn't depend on when the
    // page got here.
    const seen = await spinner.evaluate((node) => {
      const appear = node.getAnimations().find((animation) => (animation as CSSAnimation).animationName === "hspinner-appear")!;
      appear.pause();
      return [0, 290, 310].map((time) => {
        appear.currentTime = time;
        return getComputedStyle(node).visibility;
      });
    });
    expect(seen).toEqual(["hidden", "hidden", "visible"]);
  });

  test("in forced colors, its track is the system's gray and its arc the text color", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const spinner = (await example(page, "spinner-sizes")).locator(".hspinner").nth(1);
    await page.emulateMedia({ forcedColors: "active" });
    const [gray, text] = await page.evaluate(() =>
      ["GrayText", "CanvasText"].map((color) => {
        const probe = document.createElement("span");
        probe.style.forcedColorAdjust = "none";
        probe.style.color = color;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      }),
    );
    await expect(spinner).toHaveCSS("border-top-color", gray!);
    await expect(spinner).toHaveCSS("border-bottom-color", text!);
  });
});
