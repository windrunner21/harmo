import { expect, type Locator, type Page } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/meter.md says, on the Meter page: one segment per step
// of the scale, 10px apart, the filled ones first, in the status's color, or
// gray without one; the others in the control border color at half strength.

// Each of a meter's segments' colors.
const colors = (meter: Locator) =>
  meter.locator(".hmeter-segment").evaluateAll((segments) => segments.map((segment) => getComputedStyle(segment).backgroundColor));

// A color as the page computes it, such as a token's.
const computed = (page: Page, color: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, color);

const unfilled = (page: Page) => computed(page, "color-mix(in srgb, var(--harmo-color-border-control) 50%, transparent)");

onEachPlayground("meter", () => {
  test("password strength: a segment per step, the filled ones in the status's color, or gray without one", async ({ page }) => {
    const meters = (await example(page, "meter-password-strength")).getByRole("meter", { name: "Password strength" });
    await expect(meters).toHaveCount(3);
    const [weak, medium, strong] = await meters.all();
    await expect(weak).toHaveAttribute("aria-valuenow", "1");
    await expect(weak).toHaveAttribute("aria-valuemax", "3");
    await expect(weak).toHaveAttribute("aria-valuetext", "Too weak");
    const empty = await unfilled(page);
    const error = await computed(page, "var(--harmo-status-color-error)");
    const gray = await computed(page, "var(--harmo-color-text-tertiary)");
    const success = await computed(page, "var(--harmo-status-color-success)");
    expect(await colors(weak)).toEqual([error, empty, empty]);
    expect(await colors(medium)).toEqual([gray, gray, empty]);
    expect(await colors(strong)).toEqual([success, success, success]);
  });

  test("other scales: as many segments as the scale has steps, in info's and warning's colors", async ({ page }) => {
    const container = await example(page, "meter-other-scales");
    const completeness = container.getByRole("meter", { name: "Profile completeness" });
    const quality = container.getByRole("meter", { name: "Message quality" });
    await expect(completeness).toHaveAttribute("aria-valuemax", "5");
    await expect(quality).toHaveAttribute("aria-valuemax", "4");
    const empty = await unfilled(page);
    const info = await computed(page, "var(--harmo-status-color-info)");
    const warning = await computed(page, "var(--harmo-status-color-warning)");
    expect(await colors(completeness)).toEqual([info, info, info, empty, empty]);
    expect(await colors(quality)).toEqual([warning, empty, empty, empty]);
  });

  test("its segments are 10px apart", async ({ page }) => {
    const meter = (await example(page, "meter-other-scales")).getByRole("meter", { name: "Profile completeness" });
    await expect(meter).toHaveCSS("column-gap", "10px");
    const [first, second] = await meter.locator(".hmeter-segment").evaluateAll((segments) =>
      segments.slice(0, 2).map((segment) => {
        const { left, right } = segment.getBoundingClientRect();
        return { left, right };
      }),
    );
    expect(second!.left - first!.right).toBeCloseTo(10, 0);
  });
});
