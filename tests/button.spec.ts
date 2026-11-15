import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, test } from "./playgrounds.ts";

// What docs/components/button.md says a script does, on the Button page's
// Loading example, whose last button loads for two seconds. The page runs on
// a paused clock, so those seconds pass only when a test says.
onEachPlayground("button", () => {
  test("loading marks the button busy, shows a spinner, and keeps focus", async ({ page }) => {
    const button = await loadingButton(page);
    await button.click();

    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect(button).toBeFocused();

    await page.clock.runFor(2000);
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(button).not.toHaveAttribute("aria-disabled");
    await expect(button.locator(".hspinner")).toHaveCount(0);
  });

  test("a press while it loads is ignored", async ({ page }) => {
    const button = await loadingButton(page);
    const spinners = button.locator(".hspinner");
    await button.click();
    await page.clock.runFor(1000);
    // Forced: Playwright waits for an aria-disabled button to be enabled.
    await button.click({ force: true });
    expect(await spinners.count(), "spinners after the second press").toBe(1);

    // Done when the first press's two seconds are up, with nothing left
    // over: the second didn't start loading again. In React, a second press
    // would also call the app's onClick again, which this example doesn't
    // show.
    await page.clock.runFor(1000);
    await expect(button).not.toHaveAttribute("aria-busy");
    expect(await spinners.count(), "spinners once done").toBe(0);
  });

  test("while aria-disabled, a press is ignored: a submit button doesn't send its form", async ({ page }) => {
    const button = (await example(page, "button-disabled")).getByRole("button", { name: "Publish" });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    // Its own form, around it, and a submit button's type.
    await button.evaluate((node) => {
      const form = document.createElement("form");
      (window as unknown as { submitted: boolean }).submitted = false;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        (window as unknown as { submitted: boolean }).submitted = true;
      });
      node.parentElement!.append(form);
      form.append(node);
      (node as HTMLButtonElement).type = "submit";
    });
    // Forced: Playwright won't click what's aria-disabled, as a person can.
    await button.click({ force: true });
    await button.press("Enter");
    expect(await page.evaluate(() => (window as unknown as { submitted: boolean }).submitted)).toBe(false);
  });

  test("while aria-disabled, a link's middle click is ignored too, which would open it in a new tab", async ({ page }) => {
    // React's Button ignores it from its aria-disabled prop, which
    // examples/react/test/button.test.tsx checks.
    test.skip(!inHtml(), "sets aria-disabled on the example's link, which React's props set");
    const link = (await example(page, "button-links")).getByRole("link", { name: "View reports" });
    // Whether the example script prevented it, read on the window, after
    // every other listener. The test then prevents it itself, or WebKit would
    // follow the link.
    const middleClick = () =>
      link.evaluate((node) => {
        let prevented = false;
        const read = (event: Event) => {
          prevented = event.defaultPrevented;
          event.preventDefault();
        };
        window.addEventListener("auxclick", read, { once: true });
        node.dispatchEvent(new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }));
        return prevented;
      });
    expect(await middleClick(), "enabled").toBe(false);
    await link.evaluate((node) => node.setAttribute("aria-disabled", "true"));
    expect(await middleClick(), "aria-disabled").toBe(true);
  });

  test("loading, the spinner follows the label, before an icon after it", async ({ page }) => {
    test.skip(!inHtml(), "adds an icon to the example's markup, which React's own rendering covers");
    const button = await loadingButton(page);
    await button.evaluate((node) => {
      node.insertAdjacentHTML("beforeend", '<svg class="hicon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6L15 12L9 18" /></svg>');
    });
    await button.click();
    const order = await button.evaluate((node) => [...node.children].map((child) => child.getAttribute("class")));
    expect(order).toEqual(["hbutton-label", "hspinner", "hicon"]);
  });
});

// The Loading example's last button, on the page reloaded with a paused
// clock: fake timers must be in place before the page's scripts run.
const loadingButton = async (page: Page) => {
  await pausedClock(page);
  const container = await example(page, "button-loading");
  return container.getByRole("button", { name: "Save changes" });
};

const pausedClock = async (page: Page) => {
  await page.clock.install();
  await page.reload();
  await ready(page);
  await page.clock.pauseAt(Date.now() + 1000);
};

// A Hold to confirm example's button, on a paused clock, so its 1.5 seconds
// pass only when a test says: the destructive "Hold to delete", or the
// accent "Hold to send".
const holdButton = async (page: Page, which: "delete" | "send" = "delete") => {
  await pausedClock(page);
  const container = await example(page, "button-hold-to-confirm");
  const button = container.locator(".hbutton[data-hold]").nth(which === "delete" ? 0 : 1);
  return { button, fill: button.locator(".hbutton-hold"), labels: button.locator(".hbutton-label") };
};

const press = async (page: Page, button: Locator) => {
  const box = await button.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
};

const transitionOf = (element: Locator) =>
  element.evaluate((node) => {
    const style = getComputedStyle(node);
    return { property: style.transitionProperty, duration: style.transitionDuration, easing: style.transitionTimingFunction };
  });

const styleOf = (element: Locator, property: string) =>
  element.evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);

// The color a token resolves to, as a computed color, to compare with one.
const token = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

// A color's sRGB channels, 0 to 1, whatever space it's written in.
const srgb = (page: Page, color: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.color = `color-mix(in srgb, ${color} 100%, transparent)`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    const numbers = (value.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    return value.startsWith("rgb") ? numbers.slice(0, 3).map((n) => n / 255) : numbers.slice(0, 3);
  }, color);

const luminance = ([r, g, b]: number[]) => {
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!);
};

const inHtml = () => test.info().titlePath.includes("html");

// A button whose width changes are caught, paused, as they begin, so a test
// sees one however slow the machine: a 200ms change can end before a test's
// next step reaches the page.
type WithChanges = HTMLElement & { changes: Animation[] };
const catchWidthChanges = (button: Locator) =>
  button.evaluate((node) => {
    const caught = node as WithChanges;
    const animate = node.animate.bind(node);
    caught.changes = [];
    caught.animate = (...args: Parameters<Element["animate"]>) => {
      const animation = animate(...args);
      animation.pause();
      caught.changes.push(animation);
      return animation;
    };
  });

// What docs/components/button.md says about destructive buttons, holding to
// confirm, and its icons.
onEachPlayground("button", () => {
  test("destructive: filled red with white text, outlined with red text, or red text alone", async ({ page }) => {
    const container = await example(page, "button-destructive");
    const [filled, outlined, text] = ["Delete workspace", "Remove members", "Clear history"].map((name) =>
      container.getByRole("button", { name }),
    );
    expect(await styleOf(filled, "background-color")).toBe(await token(page, "--harmo-color-danger-fill"));
    expect(await styleOf(filled, "color")).toBe(await token(page, "--harmo-color-on-danger"));
    expect(await styleOf(outlined, "color")).toBe(await token(page, "--harmo-color-danger"));
    expect(await styleOf(outlined, "background-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await styleOf(text, "color")).toBe(await token(page, "--harmo-color-danger"));
  });

  test("held for 1.5 seconds, its fill wipes across, evenly; full, it stays so a moment, even let go, then the action starts", async ({ page }) => {
    const { button, fill, labels } = await holdButton(page);
    await press(page, button);
    await expect(button).toHaveAttribute("data-holding");
    expect(await transitionOf(fill)).toEqual({ property: "clip-path", duration: "1.5s", easing: "linear" });
    await page.clock.runFor(1500);
    await expect(button).toHaveAttribute("data-held");
    await expect(button).not.toHaveAttribute("aria-busy");
    // Let go now: it's already held all the way.
    await page.mouse.up();
    await page.clock.runFor(200);
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("data-held");
    await expect(fill.locator(".hspinner")).toHaveCount(1);
    // Working, it says so, in the app's words, at full strength.
    await expect(labels).toHaveText(["Deleting", "Deleting"]);
    expect(await styleOf(button, "opacity")).toBe("1");
  });

  test("let go early, it snaps back fast, and nothing else happens; a quick click does nothing either", async ({ page }) => {
    const { button, fill, labels } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(600);
    await page.mouse.up();
    await expect(button).not.toHaveAttribute("data-holding");
    expect(await transitionOf(fill)).toEqual({ property: "clip-path", duration: "0.2s", easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" });
    await page.clock.runFor(2000);
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(labels).toHaveText(["Hold to delete", "Hold to delete"]);

    await button.click();
    await button.click();
    await page.clock.runFor(2000);
    await expect(button).not.toHaveAttribute("aria-busy");
  });

  test("pressed, it shrinks to 0.97, the course's press, and keeps its resting colors, so the fill shows", async ({ page }) => {
    const { button } = await holdButton(page, "send");
    const resting = await styleOf(button, "background-color");
    await press(page, button);
    await expect
      .poll(() => button.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a))
      .toBeCloseTo(0.97, 3);
    // Once the hover's fade has settled.
    await expect.poll(() => styleOf(button, "background-color")).toBe(resting);
    await page.mouse.up();
  });

  test("the fill: a destructive outlined button's is its red tint and border; a filled one's is a clear step darker", async ({ page }) => {
    const remove = await holdButton(page, "delete");
    expect(await styleOf(remove.fill, "background-color")).toBe(await token(page, "--harmo-color-danger-background"));
    expect(await styleOf(remove.fill, "border-top-color")).toBe(await token(page, "--harmo-color-danger-border"));
    // Over the whole button, its border too (within a pixel: it's pressed,
    // so scaled, and its fractions round either way).
    await press(page, remove.button);
    await page.clock.runFor(1500);
    const [fillBox, buttonBox] = await Promise.all([remove.fill.boundingBox(), remove.button.boundingBox()]);
    for (const side of ["x", "y", "width", "height"] as const) {
      expect(Math.abs(fillBox![side] - buttonBox![side]), side).toBeLessThanOrEqual(1);
    }
    await page.mouse.up();

    const send = await holdButton(page, "send");
    const filled = luminance(await srgb(page, await styleOf(send.button, "background-color")));
    const deeper = luminance(await srgb(page, await styleOf(send.fill, "background-color")));
    const text = luminance(await srgb(page, await styleOf(send.fill, "color")));
    // Clearly darker, and its white text readable on it.
    expect(deeper).toBeLessThan(filled * 0.7);
    expect((text + 0.05) / (deeper + 0.05)).toBeGreaterThan(4.5);
  });

  test("held with Enter or Space, it acts; a quick key press does nothing; a held key's repeats don't count", async ({ page }) => {
    const { button } = await holdButton(page);
    await button.focus();
    await page.keyboard.down(" ");
    await expect(button).toHaveAttribute("data-holding");
    await page.clock.runFor(1700);
    await expect(button).toHaveAttribute("aria-busy", "true");
    await page.keyboard.up(" ");
    await page.clock.runFor(1500);
    await expect(button).not.toHaveAttribute("aria-busy");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.clock.runFor(2000);
    await expect(button).not.toHaveAttribute("aria-busy");

    // Down twice is a key held long enough to repeat: still one hold.
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.clock.runFor(1700);
    await expect(button).toHaveAttribute("aria-busy", "true");
    await page.keyboard.up("Enter");
  });

  test("a screen reader's press, a click with no press behind it, acts at once", async ({ page }) => {
    const { button } = await holdButton(page);
    await button.evaluate((node) => (node as HTMLElement).click());
    await expect(button).toHaveAttribute("aria-busy", "true");
  });

  test("its click never does what a button's click does natively: a quick click doesn't send its form", async ({ page }) => {
    const { button } = await holdButton(page);
    // Its own form, around it, and a submit button's type.
    await button.evaluate((node) => {
      const form = document.createElement("form");
      (window as unknown as { submitted: boolean }).submitted = false;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        (window as unknown as { submitted: boolean }).submitted = true;
      });
      node.parentElement!.append(form);
      form.append(node);
      (node as HTMLButtonElement).type = "submit";
    });
    await button.click();
    await page.clock.runFor(500);
    expect(await page.evaluate(() => (window as unknown as { submitted: boolean }).submitted)).toBe(false);
  });

  test("disabled during the moment after a full hold, it doesn't act, and holds again once enabled", async ({ page }) => {
    test.skip(!inHtml(), "the React Button's state comes from its props");
    const { button } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(1500);
    await expect(button).toHaveAttribute("data-held");
    await button.evaluate((node) => node.setAttribute("aria-disabled", "true"));
    await page.mouse.up();
    await page.clock.runFor(200);
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(button).not.toHaveAttribute("data-held");
    await button.evaluate((node) => node.removeAttribute("aria-disabled"));
    await press(page, button);
    await page.clock.runFor(1700);
    await page.mouse.up();
    await expect(button).toHaveAttribute("aria-busy", "true");
  });

  test("disabled while it's held, it lets go at once, and doesn't act", async ({ page }) => {
    test.skip(!inHtml(), "the React Button's state comes from its props");
    const { button } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(600);
    await expect(button).toHaveAttribute("data-holding");
    await button.evaluate((node) => node.setAttribute("aria-disabled", "true"));
    await expect(button).not.toHaveAttribute("data-holding");
    await page.clock.runFor(1500);
    await page.mouse.up();
    await expect(button).not.toHaveAttribute("data-held");
    await expect(button).not.toHaveAttribute("aria-busy");
  });

  // A fieldset around it, which disables it without changing the button itself.
  const inFieldset = (button: Locator) =>
    button.evaluateHandle((node) => {
      const fieldset = document.createElement("fieldset");
      node.parentElement!.append(fieldset);
      fieldset.append(node);
      return fieldset;
    });

  test("disabled through its fieldset while it's held, it doesn't act", async ({ page }) => {
    const { button } = await holdButton(page);
    const fieldset = await inFieldset(button);
    await press(page, button);
    await page.clock.runFor(600);
    await fieldset.evaluate((node) => ((node as HTMLFieldSetElement).disabled = true));
    await page.clock.runFor(1500);
    await page.mouse.up();
    await expect(button).not.toHaveAttribute("data-held");
    await expect(button).not.toHaveAttribute("aria-busy");
  });

  test("disabled through its fieldset in the moment after a full hold, it doesn't act", async ({ page }) => {
    const { button } = await holdButton(page);
    const fieldset = await inFieldset(button);
    await press(page, button);
    await page.clock.runFor(1500);
    await expect(button).toHaveAttribute("data-held");
    await fieldset.evaluate((node) => ((node as HTMLFieldSetElement).disabled = true));
    await page.mouse.up();
    await page.clock.runFor(200);
    await expect(button).not.toHaveAttribute("aria-busy");
  });

  test("leaving the button lets go, and it doesn't act", async ({ page }) => {
    const { button } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(500);
    await page.mouse.move(5, 5);
    await expect(button).not.toHaveAttribute("data-holding");
    await page.clock.runFor(2000);
    await page.mouse.up();
    await expect(button).not.toHaveAttribute("aria-busy");
  });

  test("working, holding it does nothing", async ({ page }) => {
    const { button } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(1700);
    await page.mouse.up();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await press(page, button);
    await expect(button).not.toHaveAttribute("data-holding");
    await page.mouse.up();
  });

  test("--hbutton-hold-duration sets how long it's held", async ({ page }) => {
    const { button, fill } = await holdButton(page);
    await button.evaluate((node) => (node as HTMLElement).style.setProperty("--hbutton-hold-duration", "3s"));
    await press(page, button);
    expect((await transitionOf(fill)).duration).toBe("3s");
    await page.clock.runFor(1500);
    await expect(button).not.toHaveAttribute("data-held");
    await page.clock.runFor(1500);
    await expect(button).toHaveAttribute("data-held");
    await page.mouse.up();
  });

  test("its border doesn't flash as it starts working: its own border takes the fill's color", async ({ page }) => {
    const { button } = await holdButton(page);
    await press(page, button);
    await page.clock.runFor(1500);
    await page.mouse.up();
    await page.clock.runFor(200);
    await expect(button).toHaveAttribute("aria-busy", "true");
    // Once its own 150ms color change, which runs on real time, lands.
    const red = await token(page, "--harmo-color-danger-border");
    await expect.poll(() => styleOf(button, "border-top-color")).toBe(red);
  });

  test("the fill's snap-back and the spinner's fade take --harmo-duration-normal and --harmo-ease-out-cubic, so a theme's reach them, with reduced motion too", async ({ page }) => {
    const theme = (node: Element) => {
      const parent = node.parentElement!;
      parent.style.setProperty("--harmo-duration-normal", "300ms");
      parent.style.setProperty("--harmo-ease-out-cubic", "cubic-bezier(0.1, 0.9, 0.2, 1)");
      const style = getComputedStyle(node);
      return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
    };
    const themed = { duration: "0.3s", easing: "cubic-bezier(0.1, 0.9, 0.2, 1)" };
    const fill = (await example(page, "button-hold-to-confirm")).locator(".hbutton-hold").first();
    const spinner = (await example(page, "button-loading")).locator(".hbutton > .hspinner").first();
    for (const part of [fill, spinner]) expect(await part.evaluate(theme)).toEqual(themed);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await fill.evaluate(theme)).toEqual(themed);
  });

  test("--hbutton-press-duration sets how long a hold button takes to shrink as it's pressed: 160ms by default", async ({ page }) => {
    const { button } = await holdButton(page, "send");
    const pressOf = () =>
      button.evaluate((node) => {
        const style = getComputedStyle(node);
        const index = style.transitionProperty.split(", ").indexOf("transform");
        return style.transitionDuration.split(", ")[index];
      });
    expect(await pressOf()).toBe("0.16s");
    await button.evaluate((node) => (node as HTMLElement).style.setProperty("--hbutton-press-duration", "100ms"));
    expect(await pressOf()).toBe("0.1s");
  });

  test("with reduced motion, the fill fades in over the hold instead of wiping across", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { button, fill } = await holdButton(page);
    expect(await styleOf(fill, "clip-path")).toBe("none");
    await press(page, button);
    expect(await transitionOf(fill)).toEqual({ property: "opacity", duration: "1.5s", easing: "linear" });
    await page.mouse.up();
  });

  test("on a right-to-left page, the fill comes in from the right", async ({ page }) => {
    const container = await example(page, "button-hold-to-confirm");
    const fill = container.locator(".hbutton-hold").first();
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    // Turned around, it moves to its new place in its own 200ms.
    await expect.poll(() => styleOf(fill, "clip-path")).toBe("inset(0px 0px 0px 100%)");
  });

  test("when a button's content changes, its width goes from the old to the new, rather than jumping; with reduced motion, at once", async ({ page }) => {
    const container = await example(page, "button-loading");
    const button = container.getByRole("button", { name: "Save changes" });
    const before = await button.evaluate((node) => (node as HTMLElement).offsetWidth);
    await catchWidthChanges(button);
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    // Caught as it began, then 100ms into its 200ms: partway.
    const { count, partway } = await button.evaluate((node) => {
      const [change] = (node as WithChanges).changes;
      if (!change) return { count: 0, partway: null };
      change.currentTime = 100;
      const partway = node.getBoundingClientRect().width;
      change.finish();
      return { count: (node as WithChanges).changes.length, partway };
    });
    expect(count).toBe(1);
    await expect.poll(() => button.evaluate((node) => (node as HTMLElement).style.overflow)).toBe("");
    const after = await button.evaluate((node) => (node as HTMLElement).offsetWidth);
    expect(after).toBeGreaterThan(before + 5);
    expect(partway).toBeGreaterThan(before + 1);
    expect(partway).toBeLessThan(after - 1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const again = (await example(page, "button-loading")).getByRole("button", { name: "Save changes" });
    await catchWidthChanges(again);
    await again.click();
    await expect(again).toHaveAttribute("aria-busy", "true");
    expect(await again.evaluate((node) => (node as WithChanges).changes.length)).toBe(0);
  });

  test("with data-instant, for text that changes often, its width changes at once", async ({ page }) => {
    const container = await example(page, "button-loading");
    const button = container.getByRole("button", { name: "Save changes" });
    // As an app puts it on a countdown's button; React leaves an attribute it
    // doesn't render alone, as <Button instant> renders this one.
    await button.evaluate((node) => node.setAttribute("data-instant", ""));
    const before = await button.evaluate((node) => (node as HTMLElement).offsetWidth);
    await catchWidthChanges(button);
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    expect(await button.evaluate((node) => (node as WithChanges).changes.length)).toBe(0);
    expect(await button.evaluate((node) => (node as HTMLElement).offsetWidth)).toBeGreaterThan(before + 5);
  });

  test("changed again while its width changes, it carries on toward the newest width, and keeps its own inline styles", async ({ page }) => {
    test.skip(!inHtml(), "drives the example script's width change directly");
    const container = await example(page, "button-loading");
    const button = container.getByRole("button", { name: "Save changes" });
    await button.evaluate((node) => (node as HTMLElement).style.setProperty("white-space", "pre"));
    const ends = await button.evaluate(async (node) => {
      // A top-level const of the script: reachable by name, not on window.
      const change = (0, eval)("changeButtonWidth") as (button: HTMLElement, change: () => void) => void;
      const label = node.querySelector(".hbutton-label")!;
      change(node as HTMLElement, () => (label.textContent = "Save every change to every conversation"));
      await new Promise((resolve) => setTimeout(resolve, 60));
      change(node as HTMLElement, () => (label.textContent = "Save it"));
      const [playing] = node.getAnimations().filter((animation) => !(animation instanceof CSSTransition));
      const keyframes = (playing?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
      await playing?.finished;
      return { to: parseFloat(String(keyframes.at(-1)?.width)), natural: (node as HTMLElement).offsetWidth, whiteSpace: (node as HTMLElement).style.whiteSpace };
    });
    expect(ends.to).toBeCloseTo(ends.natural, 0);
    expect(ends.whiteSpace).toBe("pre");
  });

  test("its fill places its content as the button does: beside a ChevronToArrow, and icon only", async ({ page }) => {
    const container = await example(page, "button-hold-to-confirm");
    const offsets = await container.locator(".play-demo").evaluate((demo) => {
      const arrow = '<svg class="hicon hchevron-to-arrow" data-direction="back" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg>';
      const icon = '<svg class="hicon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12H19" /></svg>';
      const make = (content: string, label?: string) => {
        const button = document.createElement("button");
        button.className = "hbutton";
        button.dataset.variant = "secondary";
        button.setAttribute("data-hold", "");
        if (label) button.setAttribute("aria-label", label);
        button.innerHTML = `${content}<span class="hbutton-hold" aria-hidden="true">${content}</span>`;
        demo.append(button);
        return button;
      };
      const withArrow = make(`${arrow}<span class="hbutton-label">Go back</span>`);
      const iconOnly = make(icon, "Remove");
      const delta = (button: HTMLElement, selector: string) => {
        const [own, copy] = [button.querySelector(`:scope > ${selector}`)!, button.querySelector(`:scope > .hbutton-hold > ${selector}`)!].map((node) => node.getBoundingClientRect());
        return [Math.abs(own.x - copy.x), Math.abs(own.width - copy.width)];
      };
      return [...delta(withArrow, ".hbutton-label"), ...delta(iconOnly, ".hicon")];
    });
    for (const offset of offsets) expect(offset).toBeLessThan(0.5);
  });

  test("a ChevronToArrow keeps its 24px beside a label, and alone in an icon-only button is drawn at 20px, as every icon there", async ({ page }) => {
    const container = await example(page, "button-with-an-arrow");
    const sizes = await container.locator(".play-demo").evaluate((demo) => {
      const labelled = demo.querySelector(".hbutton:has(> .hchevron-to-arrow)")!;
      const alone = labelled.cloneNode(true) as HTMLElement;
      alone.querySelector(".hbutton-label")!.remove();
      alone.setAttribute("aria-label", "Go back");
      demo.append(alone);
      const size = (button: Element) => {
        const box = button.querySelector(".hchevron-to-arrow")!.getBoundingClientRect();
        return { width: box.width, height: box.height };
      };
      const sizes = { labelled: size(labelled), alone: size(alone) };
      alone.remove();
      return sizes;
    });
    expect(sizes.labelled.width).toBeCloseTo(24, 1);
    expect(sizes.labelled.height).toBeCloseTo(24, 1);
    expect(sizes.alone.width).toBeCloseTo(20, 1);
    expect(sizes.alone.height).toBeCloseTo(20, 1);
  });

  test("an app's rule of the same weight, loaded after Harmo's, sizes and spaces an icon beside the label", async ({ page }) => {
    const icon = (await example(page, "button-hold-to-confirm")).locator(".hbutton[data-hold] > .hicon").first();
    await page.addStyleTag({ content: ".hbutton > .hicon { inline-size: 16px; block-size: 16px; margin-inline-start: 0; }" });
    const [box] = await boxes(icon);
    expect(box.width).toBeCloseTo(16, 0);
    expect(await styleOf(icon, "margin-inline-start")).toBe("0px");
  });

  test("an icon beside the label looks as far from the border as the label's text", async ({ page }) => {
    const container = await example(page, "button-hold-to-confirm");
    const button = container.locator(".hbutton[data-hold]").first();
    const [icon, label, box] = await Promise.all([
      button.locator(":scope > .hicon").boundingBox(),
      button.locator(":scope > .hbutton-label").boundingBox(),
      button.boundingBox(),
    ]);
    // The icon's box starts 3px in; the label's text ends 6px from the end.
    expect(icon!.x - box!.x).toBeCloseTo(1 + 3, 0);
    expect(box!.x + box!.width - (label!.x + label!.width)).toBeCloseTo(1, 0);
  });
});
