import { expect, type Page } from "@playwright/test";
import { axe, checkAccessibility } from "./axe.ts";
import { open, pages, playgrounds, test } from "./playgrounds.ts";

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

        // Dark mode changes only colors, so only contrast is checked again.
        // Waits for the color transitions it starts; other animations, such as
        // a paused spinner's, may never finish.
        await page.evaluate(async () => {
          document.documentElement.style.colorScheme = "dark";
          await new Promise(requestAnimationFrame);
          const fading = document.getAnimations().filter((animation) => animation instanceof CSSTransition);
          await Promise.race([
            Promise.all(fading.map((animation) => animation.finished.catch(() => {}))),
            new Promise((resolve) => setTimeout(resolve, 1000)),
          ]);
        });
        const dark = await checkAccessibility(page, ["color-contrast"]);
        expect.soft(dark.loaded, "contrast in dark mode").toEqual([]);
        for (const { trigger, violations } of dark.popups) {
          expect.soft(violations, `contrast in dark mode with ${trigger} open`).toEqual([]);
        }
        // Last, as this restarts what's animating on the page.
        expect.soft(await stillShownWhenHidden(page), "elements that stay rendered with hidden").toEqual([]);
      });
    }
  });
}

// docs/components/README.md: hidden hides any part of any component, at once.
// Field's error and the password details are the exceptions: they stay rendered
// and collapse, which is how they animate closed. Browsers ignore hidden on SVG.
// The examples' own layout around and inside components isn't Harmo's.
// A closed dialog isn't rendered, and WebKit doesn't apply [hidden] inside one,
// so each is shown, not as a modal, while its parts are checked.
const stillShownWhenHidden = (page: Page) =>
  page.evaluate(() => {
    const closed = [...document.querySelectorAll<HTMLDialogElement>(".play-demo dialog:not([open])")];
    for (const dialog of closed) dialog.show();
    const elements = [...document.querySelectorAll(".play-demo *")].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        Boolean(element.closest('[class^="h"], [class*=" h"]')) &&
        !element.matches('.herror, .hpassword-details, [class*="play-"], [style*="display"]'),
    );
    const shown = elements.flatMap((element) => {
      const before = element.hidden;
      element.hidden = true;
      const { display } = getComputedStyle(element);
      element.hidden = before;
      return display === "none" ? [] : [(element.cloneNode(false) as Element).outerHTML];
    });
    for (const dialog of closed) {
      dialog.close();
      for (const animation of dialog.getAnimations()) animation.finish();
    }
    return shown;
  });
