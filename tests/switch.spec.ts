import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/switch.md says, on the Switch page: a 44×24 track sized
// in rem, from tokens every switch reads, and a thumb that slides over 200ms
// on ease-out, or jumps under reduced motion.
const thumb = (element: Locator, property: string) =>
  element.evaluate((node, property) => getComputedStyle(node, "::before").getPropertyValue(property), property);

// A curve token as the browser writes a timing function.
const curve = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("i");
    probe.style.transitionTimingFunction = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).transitionTimingFunction;
    probe.remove();
    return value;
  }, name);

onEachPlayground("switch", () => {
  const firstSwitch = async (page: Page) => (await example(page, "switch-off-and-on")).getByRole("switch").first();

  test("44 by 24 with a 20px thumb, growing with the browser's font size", async ({ page }) => {
    const toggle = await firstSwitch(page);
    const [track] = await boxes(toggle);
    expect(track.width).toBeCloseTo(44, 0);
    expect(track.height).toBeCloseTo(24, 0);
    expect(await thumb(toggle, "width")).toBe("20px");

    await page.evaluate(() => (document.documentElement.style.fontSize = "20px"));
    const [larger] = await boxes(toggle);
    expect(larger.width).toBeCloseTo(55, 0);
    expect(larger.height).toBeCloseTo(30, 0);
    expect(await thumb(toggle, "width")).toBe("25px");
  });

  test("--harmo-switch-width and --harmo-switch-thumb-size size every switch", async ({ page }) => {
    const toggle = await firstSwitch(page);
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--harmo-switch-width", "3rem");
      document.documentElement.style.setProperty("--harmo-switch-thumb-size", "1rem");
    });
    const [track] = await boxes(toggle);
    expect(track.width).toBeCloseTo(48, 0);
    expect(await thumb(toggle, "width")).toBe("16px");
  });

  test("the thumb slides over 200ms on ease-out, so it moves at once on a press", async ({ page }) => {
    const toggle = await firstSwitch(page);
    expect(await thumb(toggle, "transition-property")).toBe("transform");
    expect(await thumb(toggle, "transition-duration")).toBe("0.2s");
    expect(await thumb(toggle, "transition-timing-function")).toBe(await curve(page, "--harmo-ease-out-cubic"));
  });

  test("under reduced motion, the thumb jumps", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const toggle = await firstSwitch(page);
    expect(await thumb(toggle, "transition-duration")).toBe("0s");
  });
});
