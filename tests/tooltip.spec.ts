import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, pointAt, release, rendered, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/tooltip.md says, on the Tooltip page: CSS shows a
// tooltip on hover after a delay and at once on keyboard focus, and a script
// hides it on Escape and skips the delay right after another closes. What it
// names or describes, which only the markup decides, is tested on the HTML
// playground.
onEachPlayground("tooltip", () => {
  test("it names or describes its control", { tag: "@css" }, async ({ page }) => {
    const describing = await example(page, "tooltip-describing-a-control");
    await expect(describing.getByRole("button", { name: "Export" })).toHaveAccessibleDescription(
      "Download the current view as a CSV file",
    );
    const naming = await example(page, "tooltip-naming-an-icon-button");
    await expect(naming.getByRole("button", { name: "Close", exact: true })).toHaveAccessibleDescription("");
  });

  test("keyboard focus shows it at once, without its fade, and it hides at once as focus moves on", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    // A fade that ran would take 100 seconds.
    await slowDown(tooltip);
    await tabTo(page, container.getByRole("button", { name: "Archive" }));
    expect(await shown(tooltip)).toBe(true);
    expect(await opacityOf(tooltip)).toBe(1);
    expect(await scaleOf(tooltip)).toBe(1);

    await page.keyboard.press("Shift+Tab");
    expect(await shown(tooltip)).toBe(false);
  });

  test("hovering shows it after the delay", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    expect(await delayOf(tooltip)).toBe("0.3s");
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("right after one closes, the next shows without the delay, until a pause", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(tooltipOf(container, "Export"))).toBe(true);

    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    const next = tooltipOf(container, "Archive");
    await expect(next).toHaveCSS("--htooltip-delay", "0ms");
    await expect.poll(() => shown(next)).toBe(true);

    // Longer than the 400ms that counts as right after, so it can't end early.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    expect(await delayOf(tooltipOf(container, "Export"))).toBe("0.3s");
    await expect(triggerOf(container, "Export")).not.toHaveAttribute("data-instant");
  });

  test("right after one closes, the next swaps in at once, and the one it replaces goes at once, without a fade", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const first = tooltipOf(container, "Export");
    const next = tooltipOf(container, "Archive");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(first)).toBe(true);
    await settled(first);

    // A fade that ran would take 100 seconds.
    await slowDown(first);
    await slowDown(next);
    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    await expect.poll(() => shown(next)).toBe(true);
    await expect(triggerOf(container, "Archive")).toHaveAttribute("data-instant", "");
    expect(await opacityOf(next)).toBe(1);
    expect(await scaleOf(next)).toBe(1);
    expect(await shown(first)).toBe(false);

    await page.mouse.move(0, 0);
    expect(await shown(next)).toBe(false);
  });

  test("the pointer can move onto the tooltip", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    await settled(tooltip);

    // In small steps, across the gap between them.
    const [box] = await boxes(tooltip);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    expect(await shown(tooltip)).toBe(true);
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
  });

  test("Escape hides it until the pointer leaves", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const button = container.getByRole("button", { name: "Export" });
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, button);
    await expect.poll(() => shown(tooltip)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveAttribute("data-dismissed", "");
    await expect.poll(() => shown(tooltip)).toBe(false);

    await page.mouse.move(0, 0);
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
    await pointAt(page, button);
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  test("Escape hides it until focus leaves", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    await tabTo(page, container.getByRole("button", { name: "Archive" }));
    await page.keyboard.press("Escape");
    await expect.poll(() => shown(tooltip)).toBe(false);

    await page.keyboard.press("Shift+Tab");
    await expect(tooltip).not.toHaveAttribute("data-dismissed");
    await page.keyboard.press("Tab");
    await expect.poll(() => shown(tooltip)).toBe(true);
  });

  // In a dialog or a popup of the test's own, as no Dialog or Popup example
  // holds a tooltip: the browser closes both on Escape, unless that Escape's
  // keydown was cancelled. A manual popover open elsewhere, as a Toaster's
  // region is, stays open on Escape, so it isn't a layer over the tooltip.
  for (const layer of ["modal dialog", "popup"] as const) {
    test(`an Escape that hides a tooltip in a ${layer} hides only that, and the next one closes the ${layer}`, async ({ page }) => {
      const container = await example(page, "tooltip-describing-a-control");
      const trigger = triggerOf(container, "Archive");
      const around = await trigger.evaluateHandle((node, layer) => {
        const manual = document.createElement("div");
        manual.popover = "manual";
        manual.style.cssText = "inset: auto 0 0 auto; margin: 0";
        document.body.append(manual);
        manual.showPopover();
        const around = document.createElement(layer === "popup" ? "div" : "dialog");
        if (layer === "popup") around.popover = "auto";
        node.before(around);
        around.append(node);
        if (around instanceof HTMLDialogElement) around.showModal();
        else around.showPopover();
        return around;
      }, layer);
      const isOpen = () => around.evaluate((node) => (node instanceof HTMLDialogElement ? node.open : node.matches(":popover-open")));
      const tooltip = tooltipOf(container, "Archive");
      await pointAt(page, container.getByRole("button", { name: "Archive" }));
      await expect.poll(() => shown(tooltip)).toBe(true);

      await page.keyboard.press("Escape");
      await expect.poll(() => shown(tooltip)).toBe(false);
      // Once the page has rendered what the Escape did, which would have
      // closed it by then.
      await rendered(page);
      expect(await isOpen()).toBe(true);

      await page.keyboard.press("Escape");
      await expect.poll(isOpen).toBe(false);
    });
  }

  // Two dialogs side by side, neither inside the other, as when a second one
  // asks before the first closes, as in Dialog's "Unsaved changes": Escape
  // closes the one that opened last, so a tooltip in that one takes the first
  // Escape, though the dialog under it doesn't hold the tooltip. The second
  // opens from a click, as a person opens it, so the browser lets one Escape
  // close only it.
  test("with a dialog open over another, an Escape that hides a tooltip in the upper one hides only that, and the next one closes only that dialog", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    await triggerOf(container, "Archive").evaluate((node) => {
      const under = document.createElement("dialog");
      under.dataset.testLayer = "under";
      const opener = document.createElement("button");
      opener.textContent = "Open the other dialog";
      under.append(opener);
      document.body.append(under);
      const over = document.createElement("dialog");
      over.dataset.testLayer = "over";
      node.before(over);
      over.append(node);
      opener.addEventListener("click", () => over.showModal());
      under.showModal();
    });
    const isOpen = (layer: string) => page.locator(`dialog[data-test-layer="${layer}"]`).evaluate((node) => (node as HTMLDialogElement).open);
    await page.getByRole("button", { name: "Open the other dialog" }).click();
    await expect.poll(() => isOpen("over")).toBe(true);
    const tooltip = tooltipOf(container, "Archive");
    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    await expect.poll(() => shown(tooltip)).toBe(true);

    await page.keyboard.press("Escape");
    await expect.poll(() => shown(tooltip)).toBe(false);
    await rendered(page);
    expect(await isOpen("over"), "the upper dialog").toBe(true);
    expect(await isOpen("under"), "the dialog under it").toBe(true);

    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen("over")).toBe(false);
    expect(await isOpen("under"), "the dialog under it").toBe(true);
  });

  test("with a popup open over it, such as a list opened from its control, Escape closes that and hides the tooltip together", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await pointAt(page, container.getByRole("button", { name: "Export" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    // In a corner, away from the pointer, which stays over Export.
    const popup = await page.evaluateHandle(() => {
      const popup = document.createElement("div");
      popup.popover = "auto";
      popup.textContent = "List";
      popup.style.cssText = "inset: auto 0 0 auto; margin: 0";
      document.body.append(popup);
      popup.showPopover();
      return popup;
    });

    await page.keyboard.press("Escape");
    await expect.poll(() => popup.evaluate((node) => node.matches(":popover-open"))).toBe(false);
    await expect.poll(() => shown(tooltip)).toBe(false);
  });

  test("data-open on its trigger shows it at once, without hover or focus, and Escape still hides it", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Export");
    await tooltip.evaluate((node) => node.parentElement!.setAttribute("data-open", ""));
    expect(await delayOf(tooltip)).toBe("0s");
    await expect.poll(() => shown(tooltip)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => shown(tooltip)).toBe(false);
  });

  test("hidden keeps it hidden on hover, on keyboard focus, and with data-open", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const button = container.getByRole("button", { name: "Export" });
    const tooltip = tooltipOf(container, "Export");
    const display = () => tooltip.evaluate((node) => getComputedStyle(node).display);
    await tooltip.evaluate((node) => ((node as HTMLElement).hidden = true));

    await pointAt(page, button);
    expect(await display(), "hovered").toBe("none");
    await page.mouse.move(0, 0);
    await tabTo(page, button);
    expect(await display(), "focused").toBe("none");
    await tooltip.evaluate((node) => node.parentElement!.setAttribute("data-open", ""));
    expect(await display(), "pinned").toBe("none");
  });

  test("after its delay, it fades in and grows from 95% in 150ms, and fades out in 100ms", async ({ page }) => {
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    await slowDown(tooltip);
    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    expect(await scaleOf(tooltip)).toBeCloseTo(0.95, 2);
    expect(await opacityOf(tooltip)).toBeLessThan(0.5);
    await release(tooltip);
    await tooltip.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    expect(await scaleOf(tooltip)).toBe(1);
    expect(await durationOf(tooltip, "opacity")).toBe("0.15s");

    await page.mouse.move(0, 0);
    expect(await durationOf(tooltip, "opacity")).toBe("0.1s");
  });

  test("with reduced motion, it fades without growing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const container = await example(page, "tooltip-describing-a-control");
    const tooltip = tooltipOf(container, "Archive");
    await slowDown(tooltip);
    await pointAt(page, container.getByRole("button", { name: "Archive" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    expect(await tooltip.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
    expect(await opacityOf(tooltip)).toBeLessThan(0.5);
    await release(tooltip);
  });

  test("a hint is a card in the page's background color, up to 280px wide, with start-aligned text", async ({ page }) => {
    const container = await example(page, "tooltip-hint");
    const tooltip = tooltipOf(container, "What is CSAT?");
    await tabTo(page, container.getByRole("button", { name: "What is CSAT?" }));
    await expect.poll(() => shown(tooltip)).toBe(true);
    const style = await tooltip.evaluate((node) => {
      // The page's background color where the tooltip is.
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--harmo-color-background)";
      node.parentElement!.append(probe);
      const page = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const { backgroundColor, maxInlineSize, textAlign } = getComputedStyle(node);
      return { page, backgroundColor, maxInlineSize, textAlign };
    });
    expect(style.backgroundColor).toBe(style.page);
    expect(style.maxInlineSize).toBe("280px");
    expect(style.textAlign).toBe("start");
  });

  test("an unavailable action's tooltip shows on keyboard focus", async ({ page }) => {
    const container = await example(page, "tooltip-explaining-an-unavailable-action");
    await tabTo(page, container.getByRole("button", { name: "Analyze" }));
    await expect.poll(() => shown(tooltipOf(container, "Analyze"))).toBe(true);
  });

  test("it shows 8px from the side it asks for", async ({ page }) => {
    const container = await example(page, "tooltip-sides");
    for (const name of ["Top", "Bottom", "Left", "Right", "Start", "End"]) {
      const button = container.getByRole("button", { name, exact: true });
      const tooltip = tooltipOf(container, name);
      await tabTo(page, button);
      await expect.poll(() => shown(tooltip)).toBe(true);
      await settled(tooltip);
      const [b, t] = await boxes(button, tooltip);
      const gap = {
        Top: b.y - (t.y + t.height),
        Bottom: t.y - (b.y + b.height),
        Left: b.x - (t.x + t.width),
        Right: t.x - (b.x + b.width),
        Start: b.x - (t.x + t.width),
        End: t.x - (b.x + b.width),
      }[name];
      expect(gap, `${name}'s gap`).toBeCloseTo(8, 0);
    }
  });

  test("inline-start and inline-end follow the text: in right-to-left text, the end is the left, and the tooltip grows from its side", async ({ page }) => {
    const container = await example(page, "tooltip-sides");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));
    const sideOf = async (name: string) => {
      const button = container.getByRole("button", { name, exact: true });
      const tooltip = tooltipOf(container, name);
      await tabTo(page, button);
      await expect.poll(() => shown(tooltip)).toBe(true);
      await settled(tooltip);
      const [b, t] = await boxes(button, tooltip);
      const origin = parseFloat(await tooltip.evaluate((element) => getComputedStyle(element).transformOrigin));
      const side = t.x + t.width <= b.x ? "left" : t.x >= b.x + b.width ? "right" : "neither";
      return { side, origin: origin < 1 ? "left" : Math.abs(origin - t.width) < 1 ? "right" : `${origin}px` };
    };
    expect(await sideOf("End")).toEqual({ side: "left", origin: "right" });
    expect(await sideOf("Start")).toEqual({ side: "right", origin: "left" });
    // Physical sides stay.
    expect((await sideOf("Right")).side).toBe("right");
  });

  test("it shows outside a clipping container, above everything", async ({ page }) => {
    const container = await example(page, "tooltip-inside-a-clipping-container");
    const tooltip = tooltipOf(container, "Hover me");
    await tabTo(page, container.getByRole("button", { name: "Hover me" }));
    // Every corner of the tooltip is the tooltip itself, not clipped away or
    // covered.
    await expect
      .poll(() =>
        tooltip.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return [
            [box.left + 2, box.top + 2],
            [box.right - 2, box.top + 2],
            [box.left + 2, box.bottom - 2],
            [box.right - 2, box.bottom - 2],
          ].every(([x, y]) => element.contains(document.elementFromPoint(x, y)));
        }),
      )
      .toBe(true);
  });
});

// A tooltip a press pins open, as on a touch screen: after Escape hides it,
// the next press, from the keyboard or the pointer still over its control,
// pins it open again.
const pinnedBy = [
  { slug: "stat", where: "a Stat's hint", id: "stat-with-a-hint-and-an-action", control: ".hstat-hint" },
  { slug: "tag-list", where: "a Tag List's count", id: "tag-list-default", control: ".htag-list-count" },
];
for (const { slug, where, id, control } of pinnedBy) {
  onEachPlayground(slug, () => {
    test(`on ${where}, after Escape, the next press pins the tooltip open again`, async ({ page }) => {
      const container = await example(page, id);
      const button = container.locator(control);
      const tooltip = container.locator(`.htooltip-trigger:has(> ${control}) > .htooltip`);

      await tabTo(page, button);
      await expect(tooltip).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(tooltip).toBeHidden();
      await page.keyboard.press("Enter");
      await expect(tooltip).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(tooltip).toBeHidden();
      await pointAt(page, button);
      await page.mouse.down();
      await page.mouse.up();
      await expect(tooltip).toBeVisible();
    });
  });
}

// The trigger around the button with this name, and its tooltip.
const triggerOf = (container: Locator, name: string) =>
  container.locator(".htooltip-trigger").filter({ has: container.page().getByRole("button", { name, exact: true }) });
const tooltipOf = (container: Locator, name: string) => triggerOf(container, name).locator(".htooltip");

// Whether CSS shows a tooltip.
const shown = (tooltip: Locator) => tooltip.evaluate((element) => getComputedStyle(element).visibility === "visible");

// How long CSS waits before showing a tooltip, as things are: the delay of
// its visibility transition.
const delayOf = (tooltip: Locator) =>
  tooltip.evaluate((element) => {
    const style = getComputedStyle(element);
    const properties = style.transitionProperty.split(", ");
    const delays = style.transitionDelay.split(", ");
    return delays[properties.indexOf("visibility") % delays.length];
  });

// How long a tooltip's transition of `property` takes, as things are.
const durationOf = (tooltip: Locator, property: string) =>
  tooltip.evaluate((element, property) => {
    const style = getComputedStyle(element);
    const properties = style.transitionProperty.split(", ");
    const durations = style.transitionDuration.split(", ");
    return durations[properties.indexOf(property) % durations.length];
  }, property);

const scaleOf = (tooltip: Locator) =>
  tooltip.evaluate((element) => {
    const { transform } = getComputedStyle(element);
    return new DOMMatrixReadOnly(transform === "none" ? undefined : transform).a;
  });

const opacityOf = (tooltip: Locator) => tooltip.evaluate((element) => Number(getComputedStyle(element).opacity));

// Focuses an element from the keyboard, so it matches :focus-visible: focus
// it, then Tab away and back.
const tabTo = async (page: Page, element: Locator) => {
  await element.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(element).toBeFocused();
};
