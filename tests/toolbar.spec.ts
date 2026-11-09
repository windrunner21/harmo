import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/toolbar.md says: filters at the start and controls at the
// end, in one row; filters that don't fit wrap on their own side; on a narrow
// screen the controls go below them; and right to left, mirrored.
onEachPlayground("toolbar", () => {
  test("filters at the start and controls at the end, in one row, with no toolbar role", async ({ page }) => {
    const container = await example(page, "toolbar-default");
    const toolbar = container.locator(".htoolbar");
    const controls = toolbar.locator(".htoolbar-controls");
    const [bar, start, end] = await boxes(toolbar, toolbar.locator(".hfilters"), controls);
    expect(start!.x).toBeCloseTo(bar!.x, 0);
    expect(end!.x + end!.width).toBeCloseTo(bar!.x + bar!.width, 0);
    expect(start!.y + start!.height / 2).toBeCloseTo(end!.y + end!.height / 2, 0);
    await expect(container.getByRole("toolbar")).toHaveCount(0);

    const [first, second] = await boxes(controls.locator(".hbutton").first(), controls.locator(".hbutton").last());
    expect(second!.x - (first!.x + first!.width)).toBeCloseTo(8, 0);
  });

  test("filters that don't fit wrap on their own side, and the controls stay at the end", async ({ page }) => {
    const container = await example(page, "toolbar-default");
    const toolbar = container.locator(".htoolbar");
    const filters = toolbar.locator(".hfilters");
    await filters.evaluate((node) => {
      const chip = node.querySelector(".hfilter-chip")!;
      for (let index = 0; index < 12; index++) node.prepend(chip.cloneNode(true));
    });
    const [bar, start, end] = await boxes(toolbar, filters, toolbar.locator(".htoolbar-controls"));
    expect(start!.height).toBeGreaterThan(40);
    expect(end!.x + end!.width).toBeCloseTo(bar!.x + bar!.width, 0);
    expect(end!.x).toBeGreaterThanOrEqual(start!.x + start!.width + 39);
  });

  test("on a narrow screen the controls go below the filters, with nothing overflowing", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const container = await example(page, "toolbar-default");
    const toolbar = container.locator(".htoolbar");
    const [start, end] = await boxes(toolbar.locator(".hfilters"), toolbar.locator(".htoolbar-controls"));
    expect(end!.y).toBeGreaterThanOrEqual(start!.y + start!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test("controls alone stay at the end", async ({ page }) => {
    const container = await example(page, "toolbar-controls-only");
    const toolbar = container.locator(".htoolbar");
    const [bar, end] = await boxes(toolbar, toolbar.locator(".htoolbar-controls"));
    expect(end!.x + end!.width).toBeCloseTo(bar!.x + bar!.width, 0);
  });

  test("a popup placed directly in it stays as wide as its trigger", async ({ page }) => {
    const container = await example(page, "toolbar-controls-only");
    const toolbar = container.locator(".htoolbar");
    await toolbar.evaluate((node) => {
      node.insertAdjacentHTML(
        "afterbegin",
        `<button type="button" data-test-trigger popovertarget="toolbar-test-popup" style="anchor-name: --toolbar-test">Open</button>
        <div class="hpopup" id="toolbar-test-popup" popover style="position-anchor: --toolbar-test">A</div>`,
      );
    });
    const trigger = toolbar.locator("[data-test-trigger]");
    const popup = toolbar.locator(".hpopup");
    await trigger.click();
    await expect(popup).toBeVisible();
    await settled(popup);
    const [button, box] = await boxes(trigger, popup);
    expect(box!.width).toBeCloseTo(button!.width, 0);
  });

  test("right to left, the filters start on the right and the controls end on the left", async ({ page }) => {
    const container = await example(page, "toolbar-right-to-left");
    const toolbar = container.locator(".htoolbar");
    const [bar, start, end] = await boxes(toolbar, toolbar.locator(".hfilters"), toolbar.locator(".htoolbar-controls"));
    expect(start!.x + start!.width).toBeCloseTo(bar!.x + bar!.width, 0);
    expect(end!.x).toBeCloseTo(bar!.x, 0);
  });
});
