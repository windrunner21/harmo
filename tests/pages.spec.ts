import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { open, pages, playgrounds, settled, test } from "./playgrounds.ts";

// axe's WCAG 2.2 A and AA rules. Without preloading: axe would fetch the
// stylesheets again, which a page opened from disk isn't allowed to. The
// options come first, since they replace the tags set before them.
const axe = (page: Page) =>
  new AxeBuilder({ page }).options({ preload: false }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);

// Every page of both playgrounds loads without an error, gets ready (React),
// and passes axe's automated WCAG 2.2 A and AA checks, as it loads and with
// each example's popup open.
for (const playground of playgrounds) {
  test.describe(playground, () => {
    for (const slug of pages(playground)) {
      test(slug, async ({ page }) => {
        await open(page, playground, slug);

        const { violations } = await axe(page).analyze();
        expect.soft(summarize(violations), "accessibility violations").toEqual([]);

        // Popups are hidden as the page loads, so axe checks each example
        // again with its popup open, trigger included.
        const triggers = page.locator(".play-demo [popovertarget]:not(.hpopup [popovertarget]):enabled");
        for (let index = 0; index < (await triggers.count()); index++) {
          const trigger = triggers.nth(index);
          const popup = page.locator(`[id="${await trigger.getAttribute("popovertarget")}"]`);
          const exampleId = await trigger.evaluate((element) => element.closest(".play-example")?.id);
          await trigger.click();
          await expect(popup).toBeVisible();
          await settled(popup);
          // A list that scrolls must be reachable with the keyboard. A
          // listbox is: it, or its select's trigger, takes focus when it
          // opens, and the arrow keys scroll it (see listbox.spec.ts). axe
          // only sees that the list itself isn't in the Tab order.
          const listbox = (await popup.getByRole("listbox").count()) > 0;
          const check = listbox ? axe(page).disableRules(["scrollable-region-focusable"]) : axe(page);
          const { violations } = await check.include(`[id="${exampleId}"]`).analyze();
          expect.soft(summarize(violations), `accessibility violations with ${await trigger.innerText()} open`).toEqual([]);
          await popup.evaluate((element) => (element as HTMLElement).hidePopover());
        }
      });
    }
  });
}

const summarize = (violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) =>
  violations.map(({ id, help, nodes }) => ({
    rule: `${id}: ${help}`,
    elements: nodes.map((node) => node.target.join(" ")),
  }));
