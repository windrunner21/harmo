import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The tests open the built playgrounds straight from disk, as people do.
// A test of what something does runs on both: the React components must
// behave like the HTML examples' scripts. A test of how it looks, tagged
// @css, runs on the HTML playground only: the markup test shows React
// renders the same markup, which the same CSS styles.
export const playgrounds = ["html", "react"] as const;
export type Playground = (typeof playgrounds)[number];

const dist = (playground: Playground) => {
  const folder = join(import.meta.dirname, "..", "examples", playground, "dist");
  if (!existsSync(folder)) {
    throw new Error(`examples/${playground}/dist is missing; run the tests with mise run test:browser, which builds it`);
  }
  return folder;
};

// The slug of every component in examples/catalog.ts, which both playgrounds
// show, read from its source.
const catalogued = () =>
  [
    ...readFileSync(join(import.meta.dirname, "..", "examples", "catalog.ts"), "utf8").matchAll(
      /^\s*slug: "([a-z0-9-]+)",$/gm,
    ),
  ].map((match) => match[1] as string);

// The slug of every page: "index", "patterns", "avatar", "banner", and so on.
// A component in the catalog without a page, or a page the catalog doesn't
// list, fails, rather than going untested. HARMO_PAGES, which
// tests/affected.ts sets, narrows them to the pages a change touches.
export const pages = (playground: Playground) => {
  const only = process.env.HARMO_PAGES ? process.env.HARMO_PAGES.split(",") : undefined;
  return only ? everyPage(playground).filter((slug) => only.includes(slug)) : everyPage(playground);
};

const everyPage = (playground: Playground) => {
  const built = readdirSync(dist(playground))
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.slice(0, -".html".length))
    .sort();
  const expected = ["index", "patterns", ...catalogued()];
  const missing = expected.filter((slug) => !built.includes(slug));
  const extra = built.filter((slug) => !expected.includes(slug));
  if (missing.length) throw new Error(`examples/${playground}/dist has no page for ${missing.join(", ")}`);
  if (extra.length) throw new Error(`examples/${playground}/dist has pages examples/catalog.ts doesn't list: ${extra.join(", ")}`);
  return built;
};

// How many times a form's shake has started on an element since the page
// loaded. A shake lasts 300ms, so a check after an answer that takes a
// moment can miss the data-shake that starts it; the count stays. None under
// reduced motion, where nothing shakes.
export const shakesOf = (element: Locator) =>
  element.evaluate((node) => (window as unknown as { harmoShakes: WeakMap<Element, number> }).harmoShakes.get(node) ?? 0);

export const url = (playground: Playground, slug: string) =>
  pathToFileURL(join(dist(playground), `${slug}.html`)).href;

// Playwright's test, failing any test during which the page logs a console
// error or throws. Each page counts the shakes a pattern's form starts, as
// shakesOf reads them.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const started = new WeakMap<EventTarget, number>();
      Object.assign(window, { harmoShakes: started });
      addEventListener(
        "animationstart",
        (event) => {
          if (event.target && /-shake$/.test(event.animationName)) started.set(event.target, (started.get(event.target) ?? 0) + 1);
        },
        true,
      );
    });
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
  // The highlighted code under each example, which waits in a template until
  // its panel opens, is most of a long page and isn't what's tested, and CI's
  // trace of every step costs WebKit seconds with it.
  await page.evaluate(() => {
    for (const source of document.querySelectorAll(".play-code-body > template")) source.remove();
  });
};

// Waits until every React example on the page is ready: hydrated, with the
// effects inside run, which add listeners such as Listbox's keys.
// examples/react/src/client.tsx marks each data-play-ready. An HTML page has
// none to wait for.
export const ready = (page: Page) =>
  expect(page.locator("[data-play-root]:not([data-play-ready])"), "examples not ready").toHaveCount(0);

// Runs the tests that `tests` declares on one page of each playground; one
// tagged @css, which only CSS and the markup decide, such as a size, a
// color, or a hover's, on the HTML playground only. One that clicks, types,
// or waits on a script or React isn't @css.
export const onEachPlayground = (slug: string, tests: () => void) => {
  for (const playground of playgrounds) {
    test.describe(playground, () => {
      if (playground === "react") {
        test.beforeEach(({}, testInfo) => test.skip(testInfo.tags.includes("@css"), "@css: tested on the HTML playground"));
      }
      test.beforeEach(({ page }) => open(page, playground, slug));
      tests();
    });
  }
};

// An example by its id, such as "listbox-single", with its demo scrolled to
// the middle of the window first, so a popup it opens has room: the middle
// of what's below the page's scroll padding, as scrollIntoView() centers it.
// To a whole pixel, worked out here: after scrollIntoView(), Firefox lands a
// pixel away from where it first said, a few frames later, moving everything
// by 1px between one check and the next.
export const example = async (page: Page, id: string) => {
  const container = page.locator(`[id="${id}"]`);
  await container.locator(".play-demo").evaluate((demo) => {
    const box = demo.getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0;
    const middle = padding + (window.innerHeight - padding) / 2;
    window.scrollTo({ top: Math.round(window.scrollY + box.top + box.height / 2 - middle), behavior: "instant" });
  });
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

// Makes the motion that scripts time by --harmo-duration-normal, such as a
// pattern's step change, last 100 seconds or more inside an element, so a
// test sees it running; release then ends it, element by element.
export const slowDownSteps = (element: Locator) =>
  element.evaluate((node) => (node as HTMLElement).style.setProperty("--harmo-duration-normal", "100s"));

// The size animation a pattern's step change runs on its card, if it runs
// one: the heights it goes from and to, its easing, and the card's height now.
export const resizing = (card: Locator) =>
  card.evaluate((node) => {
    const effect = node.getAnimations().find((animation) => animation.id === "harmo-step-resize")?.effect;
    if (!(effect instanceof KeyframeEffect)) return undefined;
    const [from = NaN, to = NaN] = effect.getKeyframes().map((frame) => parseFloat(String(frame.height)));
    return { from, to, easing: effect.getTiming().easing, height: parseFloat(getComputedStyle(node).height) };
  });

// Where a step change moves something that stays in the card from, such as
// the band along its bottom, as "x y", if it moves it.
export const movedFrom = (element: Locator) =>
  element.evaluate((node) => {
    const effect = node.getAnimations().find((animation) => animation.id === "harmo-step-move")?.effect;
    return effect instanceof KeyframeEffect ? String(effect.getKeyframes()[0]?.translate) : undefined;
  });

// Checks that a form's shake, which `start` sets off, ends only with its own
// animation: with the shake made to last 100 seconds, an animation inside the
// form ending, as a loading Button's spinner's does as it appears, leaves it
// shaking, and finishing the shake ends it.
export const expectShakeToEndOnItsOwn = async (form: Locator, start: () => Promise<unknown>) => {
  await form.evaluate((node) => (node as HTMLElement).style.setProperty("--harmo-duration-slow", "100s"));
  await start();
  await expect(form).toHaveAttribute("data-shake", "");
  const shaking = await form.evaluate(async (node) => {
    node.firstElementChild?.dispatchEvent(new AnimationEvent("animationend", { bubbles: true, animationName: "hspinner-in" }));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return node.hasAttribute("data-shake");
  });
  expect(shaking, "still shaking once an animation inside it ended").toBe(true);
  await release(form);
  await expect(form).not.toHaveAttribute("data-shake");
};

// Whether an element is fading in from nothing, as a step's new content does.
export const fadingIn = (element: Locator) =>
  element.evaluate((node) =>
    node
      .getAnimations()
      .some(
        (animation) =>
          animation.effect instanceof KeyframeEffect && String(animation.effect.getKeyframes()[0]?.opacity) === "0",
      ),
  );

// Finishes an element's animations and transitions. A frame first, as in
// settled, since WebKit may start a transition only then, and one that starts
// after this would run its slowed-down 100 seconds. WebKit can also start a
// finished transition again, from where it had got to, at the next style
// update, so the style is read at once, and whatever runs then is finished
// too, until nothing does.
export const release = (element: Locator) =>
  element.evaluate(async (node) => {
    await new Promise(requestAnimationFrame);
    for (let round = 0; round < 5; round++) {
      const running = node
        .getAnimations()
        .filter((animation) => animation.playState !== "finished" && animation.effect?.getTiming().iterations !== Infinity);
      if (!running.length) return;
      for (const animation of running) animation.finish();
      getComputedStyle(node).opacity;
    }
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
  // Once a popup it's in has opened, so the click lands where it ends up.
  await settled(element, ".hpopup");
  await pointAt(page, element);
  await page.mouse.down();
  await page.mouse.up();
};

// The color a value, such as a token's var(), resolves to on the page, as a
// computed color, to compare with an element's.
export const colorOf = (page: Page, value: string) =>
  page.evaluate((value) => {
    const probe = document.createElement("i");
    probe.style.color = value;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, value);

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

// What a form sends before its script runs, and what it holds to send. In
// HTML, it posts, so what was typed stays out of the page's address and the
// server's logs. In React, whose action is a function, React's own action
// holds a form sent before the page hydrates, so the browser never sends it
// anywhere, and sends it once it has; a server action renders as a post, as
// examples/react/test/auth-actions.test.tsx checks. Either way, the form's
// data holds these named fields, in order, as the page shows them.
export const expectPosts = async (form: Locator, names?: string[]) => {
  const sent = await form.evaluate((node: HTMLFormElement) => ({
    method: node.getAttribute("method"),
    action: node.getAttribute("action"),
    names: [...new FormData(node).keys()],
  }));
  if (form.page().url().includes("/examples/react/")) {
    expect(sent.action).toMatch(/^javascript:throw new Error\('(A )?React form (was )?unexpectedly submitted\./);
    expect(sent.method).toBeNull();
  } else {
    expect(sent.method).toBe("post");
  }
  if (names) expect(sent.names).toEqual(names);
};

// A submit button that posts its form to an action of its own, such as Verify
// Code's resend, before a script runs too: in HTML, to its formaction, the
// server's endpoint for it; in React, to the one React writes for a function
// action, as a server action's hidden fields would name it.
export const expectPostsElsewhere = async (button: Locator) => {
  const own = await button.getAttribute("formaction");
  if (button.page().url().includes("/examples/react/"))
    expect(own).toMatch(/^javascript:throw new Error\('(A )?React form (was )?unexpectedly submitted\./);
  else expect(own).toMatch(/^\/\S+$/);
};
