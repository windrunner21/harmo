import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The tests open the built playgrounds straight from disk, as people do.
// Each test runs on both: the React components must behave like the HTML
// examples' scripts.
export const playgrounds = ["html", "react"] as const;
export type Playground = (typeof playgrounds)[number];

const dist = (playground: Playground) => {
  const folder = join(import.meta.dirname, "..", "examples", playground, "dist");
  if (!existsSync(folder)) {
    throw new Error(`examples/${playground}/dist is missing; run the tests with mise run test:browser, which builds it`);
  }
  return folder;
};

// The slug of every page: "index", "avatar", "banner", and so on.
export const pages = (playground: Playground) =>
  readdirSync(dist(playground))
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.slice(0, -".html".length))
    .sort();

export const url = (playground: Playground, slug: string) =>
  pathToFileURL(join(dist(playground), `${slug}.html`)).href;

// Playwright's test, failing any test during which the page logs a console
// error or throws.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors, "console errors").toEqual([]);
  },
});

// Opens a page, and waits until it's ready.
export const open = async (page: Page, playground: Playground, slug: string) => {
  await page.goto(url(playground, slug));
  await ready(page);
};

// Waits until every React example on the page is ready: hydrated, with the
// effects inside run, which add listeners such as Listbox's keys.
// examples/react/src/client.tsx marks each data-play-ready. An HTML page has
// none to wait for.
export const ready = (page: Page) =>
  expect(page.locator("[data-play-root]:not([data-play-ready])"), "examples not ready").toHaveCount(0);

// Runs the tests that `tests` declares on one page of each playground.
export const onEachPlayground = (slug: string, tests: () => void) => {
  for (const playground of playgrounds) {
    test.describe(playground, () => {
      test.beforeEach(({ page }) => open(page, playground, slug));
      tests();
    });
  }
};

// An example by its id, such as "listbox-single", with its demo scrolled to
// the middle of the window first, so a popup it opens has room.
export const example = async (page: Page, id: string) => {
  const container = page.locator(`[id="${id}"]`);
  await container.locator(".play-demo").evaluate((demo) => demo.scrollIntoView({ block: "center" }));
  return container;
};

// The open popup in a part of the page, if any.
export const openPopup = (scope: Locator) => scope.locator(".hpopup:popover-open");

// Waits for an element's animations and transitions to finish, so a check
// sees where it ends up; with `closest`, those of the nearest ancestor that
// matches it, if there is one. A frame first, since WebKit may start a
// transition only then. Endless ones, such as a spinner's, don't count.
export const settled = (element: Locator, closest?: string) =>
  element.evaluate(async (node, closest) => {
    await new Promise(requestAnimationFrame);
    const target = (closest && node.closest(closest)) || node;
    return Promise.all(
      target
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    );
  }, closest);

// Makes an element's transitions last 100 seconds, so a test sees them
// halfway on any machine, then ends them with release.
export const slowDown = (element: Locator) =>
  element.evaluate((node) => ((node as HTMLElement).style.transitionDuration = "100s"));

// How many animations and transitions an element is running.
export const animations = (element: Locator) => element.evaluate((node) => node.getAnimations().length);

// Finishes an element's animations and transitions.
export const release = (element: Locator) =>
  element.evaluate((node) => {
    for (const animation of node.getAnimations()) animation.finish();
  });

// Moves the mouse to the middle of an element, without scrolling, once the
// popup it's in has stopped sliding. Playwright's own hover and click scroll
// the page first, even for an element in an open popup that's already in
// view, and the popup follows its trigger a frame later, away from the
// pointer.
export const pointAt = async (page: Page, element: Locator) => {
  await settled(element, ".hpopup");
  const box = await element.boundingBox();
  if (!box) throw new Error("pointAt: the element isn't shown");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};

// Clicks the middle of an element, as pointAt moves to it. A Playwright click
// that lands outside a popup, as pointAt explains, closes it: the browser does
// that on pointer down, before any script can stop it.
export const clickAt = async (page: Page, element: Locator) => {
  await expect(element).toBeVisible();
  await pointAt(page, element);
  await page.mouse.down();
  await page.mouse.up();
};

// Elements' boxes on the page, as Playwright measures them.
export const boxes = (...elements: Locator[]) =>
  Promise.all(
    elements.map(async (element) => {
      const box = await element.boundingBox();
      if (!box) throw new Error("boxes: an element isn't shown");
      return box;
    }),
  );

// Waits until the browser has rendered twice, so what a change starts, such
// as a transition and its events, has happened.
export const rendered = (page: Page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

// Starts counting the transitions of `property` that begin on an element
// itself, from its transitionrun events, which a transition sends however
// short it is. The function it returns waits for the browser to render, then
// gives the count so far.
export const watchTransitions = async (element: Locator, property: string) => {
  const counter = await element.evaluateHandle((node, property) => {
    const started = { count: 0 };
    node.addEventListener("transitionrun", (event) => {
      if (event.target === node && (event as TransitionEvent).propertyName === property) started.count++;
    });
    return started;
  }, property);
  return async () => {
    await rendered(element.page());
    return counter.evaluate((started) => started.count);
  };
};
