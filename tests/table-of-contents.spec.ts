import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, rendered, test } from "./playgrounds.ts";

// What docs/components/table-of-contents.md says: links to each heading that stay in
// view, with the section you've reached marked, the last one at the end, and a
// followed link kept until you scroll yourself. Its name, its place and
// indents, and its marker under reduced motion and forced colors only the
// markup and CSS decide, so those tests run on the HTML playground.
const scrollTo = (scroller: Locator, top: number | "end") =>
  scroller.evaluate((n, top) => (n.scrollTop = top === "end" ? n.scrollHeight : (top as number)), top);

onEachPlayground("table-of-contents", () => {
  const parts = async (page: Page, id = "default") => {
    const container = await example(page, `table-of-contents-${id}`);
    const nav = container.locator(".htable-of-contents");
    return {
      container,
      nav,
      links: nav.locator(".htable-of-contents-link"),
      scroller: nav.locator("xpath=.."),
      content: nav.locator("xpath=following-sibling::div"),
    };
  };

  const marked = (links: Locator) => links.locator('xpath=self::*[@aria-current="location"]');

  test("a named navigation of links to each heading", { tag: "@css" }, async ({ page }) => {
    const { nav, links } = await parts(page);
    await expect(nav).toHaveAccessibleName("On this page");
    await expect(links).toHaveCount(5);
    await expect(links.first()).toHaveAttribute("href", "#overview");
  });

  test("the first section is marked to begin with, and only one at a time", async ({ page }) => {
    const { links } = await parts(page);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(marked(links)).toHaveCount(1);
  });

  test("scrolling marks the section reached", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await scrollTo(scroller, 230);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await expect(marked(links)).toHaveCount(1);
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
  });

  test("following a link scrolls to its section, by mouse or keyboard", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await links.nth(2).click();
    const heading = container.locator("#risks");
    const top = async () => {
      const [view, target] = await boxes(scroller, heading);
      return Math.abs(target!.y - view!.y);
    };
    await expect.poll(top).toBeLessThan(2);
    expect(page.url()).toContain("#risks");
    await links.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await expect.poll(() => boxes(scroller, container.locator("#milestones")).then(([v, t]) => Math.abs(t!.y - v!.y))).toBeLessThan(2);
  });

  test("in a scrolling box, following a link scrolls only the box", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    const before = await page.evaluate(() => window.scrollY);
    await links.nth(3).click();
    await expect.poll(() => boxes(scroller, container.locator("#budget")).then(([v, t]) => Math.abs(t!.y - v!.y))).toBeLessThan(2);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    expect(page.url()).toContain("#budget");
    await page.goBack();
    await expect.poll(() => page.url()).not.toContain("#budget");
    await expect(links.locator('xpath=self::*[@aria-current="location"]')).toHaveCount(1);
  });

  // Where a heading is in the box, measured in the same frame as the click.
  const followNow = (link: Locator, heading: string) =>
    link.evaluate((node, heading) => {
      const box = node.closest(".htable-of-contents")!.parentElement!;
      (node as HTMLElement).click();
      return document.getElementById(heading)!.getBoundingClientRect().top - box.getBoundingClientRect().top;
    }, heading);

  test("following a link in a box glides, and is at once with reduced motion", async ({ page }) => {
    const { links, scroller } = await parts(page);
    // A box that glides by itself must still go at once.
    await scroller.evaluate((n) => ((n as HTMLElement).style.scrollBehavior = "smooth"));
    expect(Math.abs(await followNow(links.nth(3), "budget"))).toBeGreaterThan(50);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(Math.abs(await followNow(links.nth(1), "milestones"))).toBeLessThan(2);
  });

  test("it scrolls to where the browser would, after scroll-margin-top and scroll-padding-top", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await container.locator("#risks").evaluate((n) => ((n as HTMLElement).style.scrollMarginTop = "30px"));
    await scroller.evaluate((n) => ((n as HTMLElement).style.scrollPaddingTop = "12px"));
    expect(await followNow(links.nth(2), "risks")).toBeCloseTo(42, 0);
  });

  test("a followed link moves focus to its heading, so Tab carries on from there", async ({ page }) => {
    const { links, container } = await parts(page);
    const heading = container.locator("#risks");
    await links.nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Tab");
    await expect(heading).not.toBeFocused();
    await expect(heading).not.toHaveAttribute("tabindex");
    expect(await links.evaluateAll((all) => all.includes(document.activeElement as HTMLAnchorElement))).toBe(false);
  });

  test("following the same link again adds no entry to the history", async ({ page }) => {
    const { links } = await parts(page);
    const length = () => page.evaluate(() => history.length);
    await links.nth(2).click();
    const after = await length();
    await links.nth(2).click();
    await links.nth(2).click();
    expect(await length()).toBe(after);
  });

  test("a key that doesn't scroll leaves a followed link marked as the box glides", async ({ page }) => {
    const { links, nav, scroller } = await parts(page);
    await nav.evaluate((n) => {
      const seen: string[] = [];
      (window as unknown as { seen: string[] }).seen = seen;
      new MutationObserver(() => {
        const current = n.querySelector("[aria-current]")?.textContent ?? "";
        if (seen.at(-1) !== current) seen.push(current);
      }).observe(n, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    });
    await links.nth(4).click();
    await page.keyboard.press("Shift");
    // Once the box has stopped gliding, and what that last scroll marks is
    // marked.
    await expect
      .poll(() =>
        scroller.evaluate(async (n) => {
          const top = n.scrollTop;
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          return top > 0 && n.scrollTop === top;
        }),
      )
      .toBe(true);
    expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(["Contacts"]);
  });

  test("the marker is on whichever side the line is", async ({ page }) => {
    for (const id of ["default", "at-the-end"]) {
      const { nav, links } = await parts(page, id);
      await expect(links.first()).toHaveAttribute("aria-current", "location");
      const [link] = await boxes(links.first());
      const marker = await settledBox(nav);
      if (id === "default") expect(marker.x + marker.width).toBeCloseTo(link!.x + link!.width, 0);
      else expect(marker.x).toBeCloseTo(link!.x, 0);
    }
  });

  test("an address with a section marks it, and Back follows along", async ({ page }) => {
    const { links } = await parts(page);
    await page.evaluate(() => (location.hash = "#budget"));
    await expect(links.nth(3)).toHaveAttribute("aria-current", "location");
    await page.evaluate(() => (location.hash = "#risks"));
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await page.goBack();
    await expect(links.nth(3)).toHaveAttribute("aria-current", "location");
  });

  test("a link opened elsewhere doesn't mark its section", async ({ page }) => {
    const { links } = await parts(page);
    const popup = page.context().waitForEvent("page", { timeout: 2000 }).catch(() => null);
    await links.nth(3).click({ modifiers: ["ControlOrMeta"] });
    (await popup)?.close();
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(links.nth(3)).not.toHaveAttribute("aria-current");
  });

  test("it follows the page when the root has its own overflow rule", async ({ page }) => {
    const { links, scroller, container } = await parts(page);
    await page.addStyleTag({ content: "html { overflow-y: scroll; }" });
    await scroller.evaluate((n: HTMLElement) => {
      n.style.blockSize = "auto";
      n.style.overflowY = "visible";
    });
    // The playground has a scroll-padding, so this goes to the top by hand.
    await container.locator("#milestones").evaluate((n) => window.scrollBy(0, n.getBoundingClientRect().top - 2));
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
  });

  test("the marker moves when the content above changes height, without a scroll", async ({ page }) => {
    const { links, scroller, content } = await parts(page);
    await scroller.evaluate((n: HTMLElement) => (n.style.overflowAnchor = "none"));
    await scrollTo(scroller, 230);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await content.locator("section").first().evaluate((n: HTMLElement) => (n.style.minBlockSize = "500px"));
    await expect(links.first()).toHaveAttribute("aria-current", "location");
  });

  test("a long list can be scrolled, and only follows when the section changes", async ({ page }) => {
    const { nav, scroller, links } = await parts(page);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await nav.evaluate((n: HTMLElement) => {
      n.style.maxBlockSize = "60px";
      n.scrollTop = 80;
    });
    await scrollTo(scroller, 3);
    // Once the scroll has been handled.
    await rendered(page);
    expect(await nav.evaluate((n) => n.scrollTop)).toBeGreaterThan(40);
  });

  test("a heading that's gone doesn't stop the others", async ({ page }) => {
    const { container, links, scroller } = await parts(page);
    await container.locator("#overview").evaluate((n) => n.remove());
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
  });

  test("in an HTML page, an offset moves the line", async ({ page }) => {
    test.skip((await page.locator("[data-play-root]").count()) > 0, "React takes it as a prop");
    const { nav, links, scroller } = await parts(page);
    await nav.evaluate((n: HTMLElement) => (n.dataset.exampleOffset = "100"));
    await scrollTo(scroller, 150);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
  });

  test("it's at the start by default, with its line facing the content", { tag: "@css" }, async ({ page }) => {
    const { nav, content, links } = await parts(page);
    const [list, words] = await boxes(nav, content);
    expect(list!.x + list!.width).toBeLessThanOrEqual(words!.x);
    await expect(links.first()).toHaveCSS("border-right-width", "1px");
    await expect(links.first()).toHaveCSS("border-left-width", "0px");
  });

  test("at the end, it's after the content with its line facing it", { tag: "@css" }, async ({ page }) => {
    const { nav, content, links } = await parts(page, "at-the-end");
    const [list, words] = await boxes(nav, content);
    expect(words!.x + words!.width).toBeLessThanOrEqual(list!.x);
    await expect(links.first()).toHaveCSS("border-left-width", "1px");
    await expect(links.first()).toHaveCSS("border-right-width", "0px");
  });

  test("the end marks the last section, which can't reach the top", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await scrollTo(scroller, "end");
    await expect(links.last()).toHaveAttribute("aria-current", "location");
  });

  test("a followed link stays marked until you scroll yourself", async ({ page }) => {
    const { links, scroller } = await parts(page);
    await links.nth(2).click();
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await scrollTo(scroller, 0);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await scroller.evaluate((n) => n.dispatchEvent(new WheelEvent("wheel", { bubbles: true })));
    await scrollTo(scroller, 5);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
  });

  test("a press on a scrollbar lets go of a followed link, and a press in the text doesn't", async ({ page }) => {
    const { links, scroller } = await parts(page);
    // Where the box's scrollbar is, between what it shows and its border, and
    // a point in its text.
    const points = await scroller.evaluate((n) => {
      const box = n.getBoundingClientRect();
      const style = getComputedStyle(n);
      const gutter = (n as HTMLElement).offsetWidth - n.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
      const end = box.left + n.clientLeft + n.clientWidth;
      return {
        gutter,
        bar: { clientX: end + gutter / 2, clientY: box.top + box.height / 2 },
        text: { clientX: box.left + n.clientLeft + n.clientWidth / 2, clientY: box.top + box.height / 2 },
      };
    });
    test.skip(points.gutter < 1, "this browser draws its scrollbars over the content, taking no room");
    const press = (point: { clientX: number; clientY: number }) =>
      scroller.evaluate((n, point) => n.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...point })), point);

    await links.nth(2).click();
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await press(points.text);
    await scrollTo(scroller, 0);
    await expect(links.nth(2), "after a press in the text").toHaveAttribute("aria-current", "location");

    await press(points.bar);
    await scrollTo(scroller, 5);
    await expect(links.first(), "after a press on the scrollbar").toHaveAttribute("aria-current", "location");
  });

  test("following the page, a press on the window's scrollbar lets go, on whichever side it is, and a press in the text beside it doesn't", async ({ page, browserName, playwright }) => {
    test.skip(browserName !== "chromium", "Needs a browser launched to show scrollbars, which headless ones hide");
    const browser = await playwright.chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
    try {
      // Right to left, a browser may put the window's scrollbar on the left.
      for (const dir of ["rtl", "ltr"]) {
        const shown = await browser.newPage();
        await shown.goto(page.url());
        await ready(shown);
        const { links, scroller, container } = await parts(shown);
        await shown.addStyleTag({ content: "html { overflow-y: scroll; }" });
        await shown.evaluate((dir) => (document.documentElement.dir = dir), dir);
        await scroller.evaluate((n: HTMLElement) => {
          n.style.blockSize = "auto";
          n.style.overflowY = "visible";
        });
        // What the window shows, as a fixed box filling it measures, with its
        // scrollbar beside it, and the text at either edge.
        const points = await shown.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.cssText = "position: fixed; inset: 0";
          document.body.append(probe);
          const box = probe.getBoundingClientRect();
          probe.remove();
          const clientY = box.top + box.height / 2;
          return {
            gutter: innerWidth - box.width,
            bar: { clientX: box.left > 0 ? box.left / 2 : (box.right + innerWidth) / 2, clientY },
            text: [
              { clientX: box.left + 1, clientY },
              { clientX: box.right - 1, clientY },
            ],
          };
        });
        expect(points.gutter, "the window's scrollbar takes room").toBeGreaterThan(0);
        const press = (point: { clientX: number; clientY: number }) =>
          shown.evaluate((point) => document.documentElement.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, ...point })), point);
        // The playground has a scroll-padding, so this goes to the top by hand.
        const scrollToMilestones = (by = 0) =>
          container.locator("#milestones").evaluate(async (n, by) => {
            window.scrollBy({ top: n.getBoundingClientRect().top - 2 + by, behavior: "instant" });
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
          }, by);

        // The browser's own jump, as the page scrolls, and its hashchange.
        await links.nth(2).click();
        await expect(shown).toHaveURL(/#risks$/);
        await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
        for (const point of points.text) await press(point);
        await scrollToMilestones();
        await expect(links.nth(2), `${dir}, after a press in the text`).toHaveAttribute("aria-current", "location");

        await press(points.bar);
        await scrollToMilestones(1);
        await expect(links.nth(1), `${dir}, after a press on the scrollbar`).toHaveAttribute("aria-current", "location");
        await shown.close();
      }
    } finally {
      await browser.close();
    }
  });

  test("it stays in view as the page scrolls", async ({ page }) => {
    const { nav, scroller } = await parts(page);
    const [before] = await boxes(nav);
    await scrollTo(scroller, 400);
    await expect.poll(async () => (await boxes(nav))[0]!.y).toBeCloseTo(before!.y, 0);
  });

  // Where the marker is drawn, once it has stopped moving.
  const markerOf = (nav: Locator) => nav.locator(".htable-of-contents-marker");
  const settledBox = async (nav: Locator) => {
    await expect.poll(() => markerOf(nav).evaluate((n) => n.getAnimations().length)).toBe(0);
    return (await boxes(markerOf(nav)))[0]!;
  };

  test("the current link is in the accent, with the marker on the line beside it", async ({ page }) => {
    const { nav, links } = await parts(page);
    const primary = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-primary)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await expect(nav).toHaveAttribute("data-ready");
    await expect(links.first()).toHaveCSS("color", primary);
    await expect(markerOf(nav)).toHaveCSS("background-color", primary);
    await expect(markerOf(nav)).toHaveAttribute("aria-hidden", "true");
    const [link] = await boxes(links.first());
    const marker = await settledBox(nav);
    expect(marker.y).toBeCloseTo(link!.y, 0);
    expect(marker.height).toBeCloseTo(link!.height, 0);
    expect(marker.x + marker.width).toBeCloseTo(link!.x + link!.width, 0);
  });

  test("the marker slides to the section reached, and is placed at once on load", async ({ page }) => {
    const { nav, links, scroller } = await parts(page);
    await expect(nav).toHaveAttribute("data-ready");
    expect(await markerOf(nav).evaluate((n) => n.getAnimations().length)).toBe(0);
    await expect(markerOf(nav)).toHaveCSS("transition-property", "transform");
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    const [link] = await boxes(links.nth(2));
    const marker = await settledBox(nav);
    expect(marker.y).toBeCloseTo(link!.y, 0);

    // Partway there, a moment after the next section is reached: the slide
    // made to last 4 seconds, so a check sees it partway on any machine.
    const top = () => markerOf(nav).evaluate((n) => n.getBoundingClientRect().top);
    await markerOf(nav).evaluate((n) => ((n as HTMLElement).style.transitionDuration = "4s"));
    const [from, to] = await nav.evaluate((n) => {
      const marker = n.querySelector(".htable-of-contents-marker")!;
      const from = marker.getBoundingClientRect().top;
      const link = n.querySelectorAll<HTMLElement>(".htable-of-contents-link")[4]!;
      link.click();
      return [from, link.getBoundingClientRect().top];
    });
    await expect.poll(top).toBeGreaterThan(from + 1);
    expect(await top()).toBeLessThan(to - 1);
  });

  test("the marker follows a link that changes height while the list doesn't", async ({ page }) => {
    const { nav, links, scroller } = await parts(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const long = "A heading long enough to take two lines in the list";
    await links.nth(3).evaluate((n, long) => (n.textContent = long), long);
    await scrollTo(scroller, 450);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    const height = await nav.locator(".htable-of-contents-list").evaluate((n) => (n as HTMLElement).offsetHeight);
    // One above the current link gains a line as one below loses its second.
    await nav.evaluate((n, long) => {
      const all = n.querySelectorAll(".htable-of-contents-link");
      all[0]!.textContent = long;
      all[3]!.textContent = "Budget";
    }, long);
    expect(await nav.locator(".htable-of-contents-list").evaluate((n) => (n as HTMLElement).offsetHeight)).toBe(height);
    await expect.poll(async () => {
      const [link, marker] = await boxes(links.nth(2), markerOf(nav));
      return Math.round(marker!.y - link!.y);
    }).toBe(0);
  });

  test("with reduced motion, the marker moves at once", { tag: "@css" }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { nav } = await parts(page);
    await expect(markerOf(nav)).toHaveCSS("transition-property", "none");
  });

  test("a level indents a heading under another", { tag: "@css" }, async ({ page }) => {
    const { links } = await parts(page, "with-sub-sections");
    const padding = (link: Locator) => link.evaluate((n) => parseFloat(getComputedStyle(n).paddingInlineStart));
    expect(await padding(links.nth(1))).toBeGreaterThan(await padding(links.nth(0)));
    expect(await padding(links.nth(5))).toBeGreaterThan(await padding(links.nth(4)));
  });

  test("right to left, the line and marker are on the right", async ({ page }) => {
    const { links } = await parts(page, "right-to-left");
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    await expect(links.first()).toHaveCSS("border-right-width", "0px");
    await expect(links.first()).toHaveCSS("border-left-width", "1px");
    await expect(links.first()).not.toHaveCSS("border-left-color", "rgba(0, 0, 0, 0)");
  });

  test("a focus ring stays inside the link", async ({ page }) => {
    const { links } = await parts(page);
    await page.keyboard.press("Shift");
    await links.first().focus();
    await expect(links.first()).toHaveCSS("outline-style", "solid");
    await expect(links.first()).toHaveCSS("outline-offset", "-2px");
  });

  test('a link with aria-current="false" isn\'t marked', async ({ page }) => {
    const { links } = await parts(page);
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    const secondary = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--harmo-color-text-secondary)";
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    await links.nth(2).evaluate((node) => node.setAttribute("aria-current", "false"));
    await expect(links.nth(2)).toHaveCSS("color", secondary);
  });

  test("in forced colors, the marker is drawn in the system's colors", { tag: "@css" }, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const { nav } = await parts(page);
    await page.emulateMedia({ forcedColors: "active" });
    await expect(nav.locator(".htable-of-contents-marker")).toHaveCSS("forced-color-adjust", "none");
  });
});
