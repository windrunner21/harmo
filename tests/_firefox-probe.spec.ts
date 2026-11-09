import { test } from "@playwright/test";
import { join } from "node:path";
import { url } from "./playgrounds.ts";

test("probe", async ({ page, browserName }) => {
  test.setTimeout(170_000);
  const box = (l: import("@playwright/test").Locator) =>
    l.evaluate((n) => { const r = n.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; });
  const css = (l: import("@playwright/test").Locator) =>
    l.evaluate((n) => { const s = getComputedStyle(n); return { area: s.getPropertyValue("position-area"), l: s.left, r: s.right, ml: s.marginLeft, mr: s.marginRight, js: s.justifySelf, dir: s.direction }; });
  const run = async (id: string, label: string, shot?: string) => {
    const c = page.locator(`[id="${id}"]`);
    try {
      await c.locator(".play-demo").evaluate((d) => d.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(120);
      const chip = c.locator(".hfilter-chip").first();
      await chip.click({ timeout: 4000 });
      await page.waitForTimeout(350);
      const panel = c.locator(".hdate-filter");
      const select = panel.locator(".hselect").first();
      const out: Record<string, unknown> = { label, chip: await box(chip), panel: await box(panel), panelCss: await css(panel), select: await box(select) };
      if (shot) await page.screenshot({ path: join(import.meta.dirname, "..", "examples/html/dist", `${shot}-${browserName}.png`) });
      await select.click({ timeout: 4000 });
      await page.waitForTimeout(350);
      const list = panel.locator(".hpopup:popover-open").first();
      out.list = await box(list);
      out.listCss = await css(list);
      console.log("PROBE", browserName, JSON.stringify(out));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    } catch (error) {
      console.log("PROBE", browserName, label, "ERROR", String(error).slice(0, 160));
      await page.reload();
      await page.waitForTimeout(500);
    }
  };

  await page.goto(url("react", "date-filter"));
  await page.waitForTimeout(600);
  await run("date-filter-default", "ltr example");
  await run("date-filter-right-to-left", "rtl example, as is", "_ff-as-is");

  const variants: Record<string, string> = {
    "no fallbacks": ".hpopup { position-try-fallbacks: none !important; }",
    "no inline margin": ".hpopup { margin-inline: 0 !important; }",
    "self-inline-end": ".hpopup { position-area: block-end span-self-inline-end !important; }",
    "physical span-left": ".hpopup { position-area: bottom span-left !important; }",
    "physical span-right": ".hpopup { position-area: bottom span-right !important; }",
    "justify start": ".hpopup { justify-self: start !important; }",
    "justify end": ".hpopup { justify-self: end !important; }",
    "justify anchor-center": ".hpopup { justify-self: anchor-center !important; }",
    "no min width": ".hpopup { min-inline-size: 0 !important; }",
    "direction ltr": ".hpopup { direction: ltr !important; }",
    "physical + no fallbacks": ".hpopup { position-area: bottom span-left !important; position-try-fallbacks: none !important; }",
  };
  for (const [label, rule] of Object.entries(variants)) {
    const style = await page.addStyleTag({ content: rule });
    await run("date-filter-right-to-left", label);
    await style.evaluate((n) => n.remove());
  }

  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await page.waitForTimeout(300);
  await run("date-filter-default", "html dir=rtl, ltr-less example");
  await run("date-filter-right-to-left", "html dir=rtl, rtl example");
  await page.evaluate(() => { document.documentElement.removeAttribute("dir"); });

  await page.goto(url("react", "filter-chip"));
  await page.waitForTimeout(600);
  const single = page.locator('[id$="right-to-left"]').first();
  const id = await single.getAttribute("id");
  await single.locator(".play-demo").evaluate((d) => d.scrollIntoView({ block: "center" }));
  const chip = single.locator(".hfilter-chip").first();
  await chip.click();
  await page.waitForTimeout(350);
  console.log("PROBE", browserName, "one level, filter chip", id, JSON.stringify({ chip: await box(chip), popup: await box(single.locator(".hpopup:popover-open").first()), css: await css(single.locator(".hpopup:popover-open").first()) }));
});
