import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/search.md says, on the Search page: a gray field with a
// magnifier, Input's border and ring once hovered or focused, a clear button
// that shows with text and empties the field, and Escape doing the same.
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
    expect(icon.x - field.x).toBeCloseTo(12, 0);
    // Drawn over the field, not under it: what's on top at its middle, once
    // it can be hit, is the magnifier.
    const onTop = await magnifier.evaluate((node, [x, y]) => {
      (node as SVGElement).style.pointerEvents = "auto";
      const hit = document.elementFromPoint(x!, y!);
      (node as SVGElement).style.pointerEvents = "";
      return !!hit?.closest(".hsearch > .hicon");
    }, [icon.x + icon.width / 2, icon.y + icon.height / 2]);
    expect(onTop).toBe(true);
    expect(await styleOf(input, "padding-left")).toBe("38px");

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
    expect(await styleOf(input, "padding-right")).toBe("40px");

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

  test("in a Field, its label names it", async ({ page }) => {
    const container = await example(page, "search-with-a-label");
    await expect(container.getByRole("searchbox", { name: "Find a template" })).toBeVisible();
  });

  test("on a right-to-left page, the magnifier is at the right and the clear button at the left", async ({ page }) => {
    const container = await example(page, "search-default");
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    const input = container.getByRole("searchbox");
    await input.fill("ship");
    const [field, icon, clear] = await boxes(input, container.locator(".hsearch > .hicon"), container.locator(".hsearch-clear"));
    expect(field.x + field.width - (icon.x + icon.width)).toBeCloseTo(12, 0);
    expect(clear.x - field.x).toBeCloseTo(8, 0);
  });
});
