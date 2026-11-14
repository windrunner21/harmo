import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, open, playgrounds, ready, settled, test } from "./playgrounds.ts";

// What docs/components/search.md says, on the Search page: a gray field with a
// magnifier, Input's border and ring once hovered or focused, a clear button
// that shows with text and empties the field, and Escape doing the same; a
// shortcut's Kbd that gives way to the clear button; and a disabled field's
// quieter placeholder and magnifier.
const styleOf = (element: Locator, property: string, pseudo?: string) =>
  element.evaluate(
    (node, [property, pseudo]) => getComputedStyle(node, pseudo).getPropertyValue(property!),
    [property, pseudo] as const,
  );

const color = (page: Page, token: string) =>
  page.evaluate((token) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);

// How many input events the field has sent, from now on.
const countInputs = (input: Locator) =>
  input.evaluate((node) => {
    (node as HTMLInputElement & { inputs: number }).inputs = 0;
    node.addEventListener("input", () => (node as HTMLInputElement & { inputs: number }).inputs++);
  });
const inputs = (input: Locator) => input.evaluate((node) => (node as HTMLInputElement & { inputs: number }).inputs);

// An Apple device, as the examples read it, from the next page load on.
const onApple = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "platform", { get: () => "MacIntel" });
    Object.defineProperty(navigator, "userAgentData", { get: () => ({ platform: "macOS" }) });
  });

onEachPlayground("search", () => {
  test("a gray field with a magnifier at its start, and Input's border and ring once focused", async ({ page }) => {
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox", { name: "Search conversations" });
    expect(await styleOf(input, "background-color")).toBe(await color(page, "--harmo-color-background-secondary"));
    expect(await styleOf(input, "border-top-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await styleOf(input, "box-shadow")).toBe("none");
    expect(await styleOf(input, "color", "::placeholder")).toBe(await color(page, "--harmo-color-text-secondary"));

    const magnifier = container.locator(".hsearch > .hicon");
    const [field, icon] = await boxes(input, magnifier);
    expect(icon.x - field.x).toBeCloseTo(10, 0);
    // Drawn over the field, not under it: what's on top at its middle, once
    // it can be hit, is the magnifier.
    const onTop = await magnifier.evaluate((node, [x, y]) => {
      (node as SVGElement).style.pointerEvents = "auto";
      const hit = document.elementFromPoint(x!, y!);
      (node as SVGElement).style.pointerEvents = "";
      return !!hit?.closest(".hsearch > .hicon");
    }, [icon.x + icon.width / 2, icon.y + icon.height / 2]);
    expect(onTop).toBe(true);
    expect(await styleOf(input, "padding-left")).toBe("34px");

    await input.focus();
    expect(await styleOf(input, "border-top-color")).toBe(await color(page, "--harmo-color-focus"));
    expect(await styleOf(input, "outline-width")).toBe("3px");
  });

  test("the clear button shows once there's text, and empties the field, keeping focus and telling the app", async ({ page }) => {
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    const clear = container.locator(".hsearch-clear");
    await expect(clear).toBeHidden();
    await input.fill("ship");
    await expect(clear).toBeVisible();
    await expect(clear).toHaveAttribute("tabindex", "-1");
    await expect(clear).toHaveAccessibleName("Clear");
    expect(await styleOf(input, "padding-right")).toBe("36px");
    // The cross is as far in from the end as the magnifier is from the start.
    const [field, cross] = await boxes(input, clear.locator("svg"));
    expect(field.x + field.width - (cross.x + cross.width)).toBeCloseTo(10, 0);

    await countInputs(input);
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    expect(await inputs(input)).toBe(1);
    await expect(clear).toBeHidden();
  });

  test("Escape empties a field with text and stops there; on an empty field, it's left to what's around it", async ({ page }) => {
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    const stopped = await page.evaluateHandle(() => {
      const seen: boolean[] = [];
      document.addEventListener("keydown", (event) => event.key === "Escape" && seen.push(event.defaultPrevented));
      return seen;
    });
    await input.fill("ship");
    await countInputs(input);
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    expect(await inputs(input)).toBe(1);
    await page.keyboard.press("Escape");
    expect(await stopped.evaluate((seen) => seen)).toEqual([true, false]);
  });

  test("filtering a list: typing narrows it, and the clear button and Escape bring every row back", async ({ page }) => {
    const container = await example(page, "search-filtering-a-list");
    const input = container.getByRole("searchbox", { name: "Search quick replies" });
    const rows = container.getByRole("navigation", { name: "Quick replies" }).getByRole("link");
    await expect(rows).toHaveCount(4);
    await input.fill("order");
    await expect(rows).toHaveText(["Order shipped", "Order delayed"]);
    await container.locator(".hsearch-clear").click();
    await expect(rows).toHaveCount(4);
    await input.fill("hours");
    await expect(rows).toHaveText(["Opening hours"]);
    await page.keyboard.press("Escape");
    await expect(rows).toHaveCount(4);
  });

  test("a read-only field stays as it is: Escape and the clear button leave it", async ({ page }) => {
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    await input.fill("ship");
    await input.evaluate((node) => (node as HTMLInputElement).setAttribute("readonly", ""));
    await countInputs(input);
    await input.focus();
    await page.keyboard.press("Escape");
    await container.locator(".hsearch-clear").evaluate((node) => (node as HTMLButtonElement).click());
    await expect(input).toHaveValue("ship");
    expect(await inputs(input)).toBe(0);
  });

  test("made read-only or disabled after typing, the clear button follows", async ({ page }, info) => {
    // React's Search follows its readOnly and disabled props, which
    // examples/react/test/search.test.tsx checks.
    test.skip(!info.titlePath.includes("html"), "sets the attributes directly, as an app's own script would");
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    const clear = container.locator(".hsearch-clear");
    await input.fill("ship");
    await expect(clear).toBeVisible();

    await input.evaluate((node) => node.setAttribute("readonly", ""));
    await expect(clear).toBeHidden();
    await input.evaluate((node) => node.removeAttribute("readonly"));
    await expect(clear).toBeVisible();

    await input.evaluate((node) => node.setAttribute("disabled", ""));
    await expect(clear).toBeDisabled();
    await input.evaluate((node) => node.removeAttribute("disabled"));
    await expect(clear).toBeEnabled();
  });

  test("in a form, a reset puts back the first text, and the clear button follows", async ({ page }) => {
    const container = await example(page, "search-in-a-form");
    const input = container.getByRole("searchbox", { name: "Search orders" });
    const clear = container.locator(".hsearch-clear");
    await expect(input).toHaveValue("refund");
    await expect(clear).toBeVisible();

    await clear.click();
    await expect(input).toHaveValue("");
    await expect(clear).toBeHidden();
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(input).toHaveValue("refund");
    await expect(clear).toBeVisible();
  });

  test("at a larger font size, the text still starts after the magnifier and stops before the clear button", async ({ page }) => {
    await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    await input.fill("ship");
    const [field, icon, clear] = await boxes(input, container.locator(".hsearch > .hicon"), container.locator(".hsearch-clear"));
    const start = parseFloat(await styleOf(input, "padding-left"));
    const end = parseFloat(await styleOf(input, "padding-right"));
    expect(icon.width).toBeCloseTo(27, 0);
    expect(icon.x + icon.width - field.x).toBeLessThan(start);
    expect(field.x + field.width - clear.x).toBeLessThan(end);
    // The cross fits its button.
    const cross = await container.locator(".hsearch-clear > svg").boundingBox();
    expect(cross!.width).toBeLessThanOrEqual(clear.width);
  });

  test("while an IME is composing, Escape is left to it", async ({ page }) => {
    const container = await example(page, "search-default");
    const input = container.getByRole("searchbox");
    await input.fill("にほ");
    const prevented = await input.evaluate((node) => {
      const event = new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true, cancelable: true });
      node.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(false);
    await expect(input).toHaveValue("にほ");
  });

  for (const around of ["dialog", "popover"] as const) {
    test(`in a ${around === "dialog" ? "modal dialog" : "popover"}, the first Escape empties the field and it stays open; the next closes it`, async ({ page }) => {
      const container = await example(page, "search-default");
      // The field, moved into a modal dialog or a popover of its own, inside
      // the example, so React still hears its events.
      await container.locator(".hsearch").evaluate((search, around) => {
        const holder = document.createElement(around === "dialog" ? "dialog" : "div");
        holder.id = "around";
        if (around === "popover") holder.popover = "auto";
        search.parentElement!.append(holder);
        holder.append(search);
        if (holder instanceof HTMLDialogElement) holder.showModal();
        else holder.showPopover();
      }, around);
      const isOpen = () =>
        page.locator("#around").evaluate((node) => (node instanceof HTMLDialogElement ? node.open : node.matches(":popover-open")));
      const input = page.locator("#around").getByRole("searchbox");
      await input.fill("ship");
      await page.keyboard.press("Escape");
      await expect(input).toHaveValue("");
      await page.waitForTimeout(100);
      expect(await isOpen()).toBe(true);
      await page.keyboard.press("Escape");
      await expect.poll(isOpen).toBe(false);
    });
  }

  test("without a clear button, Escape still empties it", async ({ page }) => {
    const container = await example(page, "search-without-a-clear-button");
    await expect(container.locator(".hsearch-clear")).toHaveCount(0);
    const input = container.getByRole("searchbox", { name: "Search contacts" });
    await input.fill("Sam");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("a shortcut's Kbd shows on an empty field, hidden from screen readers, and gives way to the clear button once there's text", async ({ page }) => {
    const container = await example(page, "search-with-a-shortcut");
    const input = container.getByRole("searchbox", { name: "Search templates" });
    const kbd = container.locator(".hsearch > .hkbd");
    await expect(input).toHaveAttribute("aria-keyshortcuts", "Control+K");
    await expect(kbd).toHaveAttribute("aria-hidden", "true");
    await expect(kbd).toHaveText("Ctrl K");
    await expect(kbd).toBeVisible();
    expect(await styleOf(input, "padding-right")).toBe("72px");

    await input.fill("ship");
    await expect(container.locator(".hsearch-clear")).toBeVisible();
    await expect(kbd).toBeHidden();
    expect(await styleOf(input, "padding-right")).toBe("36px");
    await page.keyboard.press("Escape");
    await expect(kbd).toBeVisible();
  });

  test("the example's shortcut reaches the field", async ({ page }) => {
    const container = await example(page, "search-with-a-shortcut");
    const input = container.getByRole("searchbox", { name: "Search templates" });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(input).not.toBeFocused();
    await page.keyboard.press("Control+k");
    await expect(input).toBeFocused();
  });

  test("on an Apple device, the example's shortcut is ⌘K, and it reaches the field", async ({ page }) => {
    await onApple(page);
    await page.reload();
    await ready(page);
    const container = await example(page, "search-with-a-shortcut");
    const input = container.getByRole("searchbox", { name: "Search templates" });
    await expect(input).toHaveAttribute("aria-keyshortcuts", "Meta+K");
    await expect(container.locator(".hsearch > .hkbd")).toHaveText("⌘K");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(input).not.toBeFocused();
    await page.keyboard.press("Meta+k");
    await expect(input).toBeFocused();
  });

  test("disabled, the placeholder is tertiary and the magnifier dims", async ({ page }) => {
    const container = await example(page, "search-disabled");
    const input = container.getByRole("searchbox", { name: "Search archived conversations" });
    await expect(input).toBeDisabled();
    await expect(container.locator(".hsearch-clear")).toBeDisabled();
    expect(await styleOf(input, "color", "::placeholder")).toBe(await color(page, "--harmo-color-text-tertiary"));
    const opacity = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--harmo-opacity-disabled").trim());
    expect(await styleOf(container.locator(".hsearch > .hicon"), "opacity")).toBe(opacity);
    // An enabled field's magnifier doesn't dim.
    expect(await styleOf((await example(page, "search-default")).locator(".hsearch > .hicon"), "opacity")).toBe("1");
  });

  test("in a Field, its label names it", async ({ page }) => {
    const container = await example(page, "search-with-a-label");
    await expect(container.getByRole("searchbox", { name: "Find a template" })).toBeVisible();
  });

  test("in a Field, only the pointer on the field shows its border, not the pointer on its label", async ({ page }) => {
    const container = await example(page, "search-with-a-label");
    const input = container.getByRole("searchbox", { name: "Find a template" });
    await container.locator(".hlabel").hover();
    await settled(input);
    expect(await styleOf(input, "border-top-color")).toBe("rgba(0, 0, 0, 0)");
    await input.hover();
    await settled(input);
    expect(await styleOf(input, "border-top-color")).toBe(await color(page, "--harmo-color-focus"));
  });

  test("on a right-to-left page, the magnifier is at the right and the clear button at the left", async ({ page }) => {
    const container = await example(page, "search-default");
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    const input = container.getByRole("searchbox");
    await input.fill("ship");
    const [field, icon, clear] = await boxes(input, container.locator(".hsearch > .hicon"), container.locator(".hsearch-clear"));
    expect(field.x + field.width - (icon.x + icon.width)).toBeCloseTo(10, 0);
    expect(clear.x - field.x).toBeCloseTo(6, 0);
  });
});

// Every HTML page runs Search's script. On the Command Menu page, whose fields
// and trigger have shortcuts of their own, it leaves them as they are, on an
// Apple device too.
for (const playground of playgrounds) {
  test.describe(playground, () => {
    test("on an Apple device, the Command Menu page keeps its own shortcuts", async ({ page }) => {
      await onApple(page);
      await open(page, playground, "command-menu");
      const field = await example(page, "command-menu-default");
      await expect(field.getByRole("combobox")).toHaveAttribute("aria-keyshortcuts", "/");
      await expect(field.locator(".hsearch > .hkbd")).toHaveText("/");
      const trigger = (await example(page, "command-menu-in-a-dialog")).locator(".hcommand-menu-trigger");
      await expect(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+K");
      await expect(trigger.locator(".hkbd")).toHaveText("⌘K");
    });
  });
}
