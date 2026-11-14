import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/spinner.md says, on the Spinner page: it turns; with
// data-delay it's hidden for its first 300ms; with reduced motion it fades
// where it is instead of turning, on the in-out curve; its turn and its delay
// are properties of its own; and in forced colors its track and arc are the
// system's colors.

// What moves it: the first of its animations, the second being its delay.
const motion = (spinner: Locator) =>
  spinner.evaluate((node) => getComputedStyle(node).animationName.split(",")[0]!.trim());

onEachPlayground("spinner", () => {
  test("it turns; with reduced motion, it fades toward 40% opacity and back, each way in --hspinner-duration, without turning", async ({ page }) => {
    const spinner = (await example(page, "spinner-sizes")).locator(".hspinner").nth(1);
    expect(await motion(spinner)).toBe("hspinner-rotate");

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await motion(spinner)).toBe("hspinner-pulse");
    // Held halfway through the fade out, at its end, and halfway back:
    // partway to 40%, at 40%, and partway back, and not turned.
    const seen = await spinner.evaluate((node) => {
      const pulse = node.getAnimations().find((animation) => (animation as CSSAnimation).animationName === "hspinner-pulse")!;
      pulse.pause();
      return [500, 1000, 1500].map((time) => {
        pulse.currentTime = time;
        const { opacity, transform } = getComputedStyle(node);
        return { opacity: Number(opacity), transform };
      });
    });
    expect(seen.map(({ opacity }) => opacity)).toEqual([
      expect.closeTo(0.7, 1),
      expect.closeTo(0.4, 1),
      expect.closeTo(0.7, 1),
    ]);
    expect(seen.every(({ transform }) => transform === "none")).toBe(true);
    const curve = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.animationTimingFunction = "var(--harmo-ease-in-out-cubic)";
      document.body.append(probe);
      const value = getComputedStyle(probe).animationTimingFunction;
      probe.remove();
      return value;
    });
    // The pulse's curve comes first, its delay's after it.
    const timingFunctions = await spinner.evaluate((node) => getComputedStyle(node).animationTimingFunction);
    expect(timingFunctions.startsWith(`${curve},`)).toBe(true);
  });

  test("its turn takes --hspinner-duration, 1s, and data-delay waits --hspinner-delay, 300ms", async ({ page }) => {
    const spinner = (await example(page, "spinner-sizes")).locator(".hspinner").nth(1);
    const delayed = (await example(page, "spinner-delayed")).locator(".hspinner");
    const timing = (node: Element) => {
      const { animationDuration, animationDelay } = getComputedStyle(node);
      return [animationDuration.split(",")[0]!.trim(), animationDelay.split(",")[1]?.trim()];
    };
    expect(await spinner.evaluate(timing)).toEqual(["1s", "0s"]);
    expect(await delayed.evaluate(timing)).toEqual(["1s", "0.3s"]);

    await spinner.evaluate((node) => (node as HTMLElement).style.setProperty("--hspinner-duration", "2s"));
    await delayed.evaluate((node) => (node as HTMLElement).style.setProperty("--hspinner-delay", "1s"));
    expect((await spinner.evaluate(timing))[0]).toBe("2s");
    expect((await delayed.evaluate(timing))[1]).toBe("1s");
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
