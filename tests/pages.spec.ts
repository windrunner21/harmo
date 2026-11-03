import { expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { open, pages, playgrounds, test } from "./playgrounds.ts";

// axe, loaded into each page once and then run for each check. Loading it for
// every check made each one about three times slower.
const axe = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

// Every page of both playgrounds loads without an error, gets ready (React),
// passes axe's automated WCAG 2.2 A and AA checks, as it loads and with each
// example's popup open, and hides any part of a component that gets hidden.
for (const playground of playgrounds) {
  test.describe(playground, () => {
    for (const slug of pages(playground)) {
      test(slug, async ({ page }) => {
        await open(page, playground, slug);
        await page.addScriptTag({ path: axe });
        const { loaded, popups } = await checkAccessibility(page);

        expect.soft(loaded, "accessibility violations").toEqual([]);
        for (const { trigger, violations } of popups) {
          expect.soft(violations, `accessibility violations with ${trigger} open`).toEqual([]);
        }
        // Last, as this restarts what's animating on the page.
        expect.soft(await stillShownWhenHidden(page), "elements that stay rendered with hidden").toEqual([]);
      });
    }
  });
}

// Runs axe on the page as it loads, then on each example with its popup open,
// trigger included: each popup is opened as a click opens it, and checked
// once it has finished opening. All in one call to the page, since in WebKit
// each call takes about a tenth of a second.
const checkAccessibility = (page: Page) =>
  page.evaluate(async () => {
    const { axe } = window as unknown as { axe: typeof import("axe-core") };

    // axe's WCAG 2.2 A and AA rules, less any named. Without preloading: axe
    // would fetch the stylesheets again, which a page opened from disk isn't
    // allowed to.
    const run = async (context: import("axe-core").ElementContext, except: string[] = []) => {
      const { violations } = await axe.run(context, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        rules: Object.fromEntries(except.map((rule) => [rule, { enabled: false }])),
        resultTypes: ["violations"],
        preload: false,
      });
      return violations.map(({ id, help, nodes }) => ({
        rule: `${id}: ${help}`,
        elements: nodes.map((node) => node.target.join(" ")),
      }));
    };

    const loaded = await run(document);
    const popups = [];
    const triggers = document.querySelectorAll<HTMLElement>(".play-demo [popovertarget]:not(.hpopup [popovertarget]):enabled");
    for (const trigger of triggers) {
      const popup = document.getElementById(trigger.getAttribute("popovertarget") ?? "");
      const example = trigger.closest(".play-example");
      if (!popup || !example) continue;
      trigger.scrollIntoView({ block: "center" });
      trigger.click();
      // Checked once it's fully open: mid-fade, its text would fail on
      // contrast. Watched frame by frame, since WebKit may start the fade a
      // frame or more after the click.
      for (let frame = 0; frame < 120; frame++) {
        await new Promise(requestAnimationFrame);
        const moving = popup.getAnimations().some((animation) => animation.playState !== "finished");
        if (!moving && getComputedStyle(popup).opacity === "1") break;
      }
      // A list that scrolls must be reachable with the keyboard. A listbox
      // is: it, or its select's trigger, takes focus when it opens, and the
      // arrow keys scroll it (see listbox.spec.ts). axe only sees that the
      // list itself isn't in the Tab order.
      const listbox = popup.querySelector('[role="listbox"]') !== null;
      const violations = await run({ include: [[`[id="${example.id}"]`]] }, listbox ? ["scrollable-region-focusable"] : []);
      popups.push({ trigger: trigger.innerText.trim(), violations });
      popup.hidePopover();
    }
    return { loaded, popups };
  });

// docs/components/README.md: hidden hides any part of any component, at once.
// Field's error and the password details are the exceptions: they stay rendered
// and collapse, which is how they animate closed. Browsers ignore hidden on SVG.
// The examples' own layout around and inside components isn't Harmo's.
const stillShownWhenHidden = (page: Page) =>
  page.evaluate(() => {
    const elements = [...document.querySelectorAll(".play-demo *")].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        Boolean(element.closest('[class^="h"], [class*=" h"]')) &&
        !element.matches('.herror, .hpassword-details, [class*="play-"], [style*="display"]'),
    );
    return elements.flatMap((element) => {
      const before = element.hidden;
      element.hidden = true;
      const { display } = getComputedStyle(element);
      element.hidden = before;
      return display === "none" ? [] : [(element.cloneNode(false) as Element).outerHTML];
    });
  });
