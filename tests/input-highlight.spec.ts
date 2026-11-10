import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, test } from "./playgrounds.ts";

// What docs/components/input.md and textarea.md say: what matches is marked as
// you type, drawn over a field whose own text is see-through and lined up with
// it, following its scrolling; and it's still a plain field.
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = `var(${name})`;
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

const scrolled = (node: Locator) => node.evaluate((n) => [n.scrollLeft, n.scrollTop]);

// Where the first character of what's drawn really is.
const firstCharacter = (text: Locator) =>
  text.evaluate((node) => {
    const first = document.createTreeWalker(node, NodeFilter.SHOW_TEXT).nextNode()!;
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(first, 1);
    return range.getBoundingClientRect().left;
  });

const alpha = (color: string) => Number(/[/,] *([\d.]+)\)$/.exec(color)?.[1] ?? 1);
const styled = (node: Locator, property: string) =>
  node.evaluate((n, property) => getComputedStyle(n).getPropertyValue(property), property);

onEachPlayground("input", () => {
  const parts = async (page: Page) => {
    const container = await example(page, "input-with-highlights");
    return {
      field: container.getByLabel("Subject"),
      backdrop: container.locator(".hinput-highlight-backdrop"),
      marks: container.locator(".hinput-highlight-backdrop mark"),
      text: container.locator(".hinput-highlight-backdrop > span"),
      wrapper: container.locator(".hinput-highlight"),
      column: container.locator(".hfield"),
    };
  };

  test("what matches is marked, in the accent, and the field's own text is see-through", async ({ page }) => {
    const { field, backdrop, marks } = await parts(page);
    await expect(marks).toHaveText(["{{1}}", "{{2}}"]);
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    await expect(field).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(field).toHaveCSS("caret-color", await color(page, "--harmo-color-text"));
    await expect(backdrop).toHaveCSS("color", await color(page, "--harmo-color-text"));
    await expect(marks.first()).toHaveCSS("color", await color(page, "--harmo-color-primary"));
  });

  test("marks follow what's typed, and the field keeps its value", async ({ page }) => {
    const { field, marks } = await parts(page);
    await field.fill("Just text");
    await expect(marks).toHaveCount(0);
    await field.fill("{{3}} and {{10}}");
    await expect(marks).toHaveText(["{{3}}", "{{10}}"]);
    await expect(field).toHaveValue("{{3}} and {{10}}");
  });

  test("the drawn text lines up with the field, and a press reaches the field", async ({ page }) => {
    const { field, text } = await parts(page);
    const [box, drawn] = await boxes(field, text);
    expect(await firstCharacter(text)).toBeCloseTo(box!.x + 13, 0);
    expect(drawn!.y + drawn!.height / 2).toBeCloseTo(box!.y + box!.height / 2, 0);
    await text.click({ force: true });
    await expect(field).toBeFocused();
  });

  test("the wrapper is as wide as an input would be", async ({ page }) => {
    const { field, wrapper, column } = await parts(page);
    const [box, around, width] = await boxes(field, wrapper, column);
    expect(around!.width).toBeCloseTo(width!.width, 0);
    expect(box!.width).toBeCloseTo(width!.width, 0);
    expect(around!.height).toBeCloseTo(box!.height, 0);
  });

  test("the drawn text follows how the field is styled", async ({ page }) => {
    const { field, backdrop, text } = await parts(page);
    await field.evaluate((n: HTMLInputElement) => {
      n.style.paddingInline = "24px";
      n.style.letterSpacing = "1px";
      n.style.fontFamily = "monospace";
      n.style.width = "240px";
    });
    await field.fill("{{1}} and more");
    const [box, drawn] = await boxes(field, backdrop);
    expect(drawn!.width).toBeCloseTo(box!.width, 0);
    expect(drawn!.x).toBeCloseTo(box!.x, 0);
    expect(await firstCharacter(text)).toBeCloseTo(box!.x + 25, 0);
    expect(await styled(backdrop, "letter-spacing")).toBe("1px");
    expect(await styled(backdrop, "font-family")).toContain("monospace");

    await field.evaluate((n: HTMLInputElement) => (n.dir = "rtl"));
    await field.fill("{{1}}");
    expect(await styled(backdrop, "direction")).toBe("rtl");
  });

  test("a selection shows through the marks", async ({ page }) => {
    const { field, marks } = await parts(page);
    const selection = await field.evaluate((n) => getComputedStyle(n, "::selection").backgroundColor);
    expect(alpha(selection)).toBeGreaterThan(0);
    expect(alpha(selection)).toBeLessThan(1);
    expect(alpha(await styled(marks.first(), "background-color"))).toBeLessThan(1);
  });

  test("disabled, the drawn text and marks are dimmed, and the field's text stays see-through", async ({ page }) => {
    const { field, backdrop, marks } = await parts(page);
    await field.evaluate((n: HTMLInputElement) => (n.disabled = true));
    const tertiary = await color(page, "--harmo-color-text-tertiary");
    await expect(field).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(backdrop).toHaveCSS("color", tertiary);
    await expect(marks.first()).toHaveCSS("color", tertiary);
  });

  test("a hidden field takes what's drawn over it along", async ({ page }) => {
    const { field, backdrop } = await parts(page);
    await field.evaluate((n: HTMLInputElement) => (n.hidden = true));
    await expect(backdrop).toBeHidden();
  });

  test("a long value scrolls with the field", async ({ page }) => {
    const { field, text } = await parts(page);
    await field.fill(`{{1}} ${"a long run of words ".repeat(20)}`);
    // Safari doesn't scroll to a caret that's already at the end.
    await field.press("Home");
    await field.press("End");
    await expect.poll(() => field.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
    await expect.poll(() => scrolled(text)).toEqual(await scrolled(field));
    await field.press("Home");
    await expect.poll(() => text.evaluate((n) => n.scrollLeft)).toBe(0);
  });

  test("in forced colors, a mark is the system's highlight", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const { backdrop, marks } = await parts(page);
    await page.emulateMedia({ forcedColors: "active" });
    await expect(marks.first()).toHaveCSS("forced-color-adjust", "none");
    await expect(backdrop).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  });
});

onEachPlayground("textarea", () => {
  const parts = async (page: Page) => {
    const container = await example(page, "textarea-with-highlights");
    return {
      field: container.getByLabel("Message"),
      backdrop: container.locator(".htextarea-highlight-backdrop"),
      marks: container.locator(".htextarea-highlight-backdrop mark"),
    };
  };

  test("what matches is marked across lines, and it lines up", async ({ page }) => {
    const { field, backdrop, marks } = await parts(page);
    await expect(marks).toHaveText(["{{1}}", "{{2}}"]);
    await expect(backdrop).toHaveCSS("white-space", "pre-wrap");
    const [box, drawn] = await boxes(field, backdrop);
    expect(drawn!.width).toBeCloseTo(box!.width, 0);
    expect(drawn!.height).toBeCloseTo(box!.height, 0);
    expect(await firstCharacter(backdrop)).toBeCloseTo(box!.x + 13, 0);
  });

  test("a value that ends in a line break is as tall as the field's", async ({ page }) => {
    const { field, backdrop } = await parts(page);
    await field.fill("One\n\n");
    expect(await backdrop.evaluate((n) => n.scrollHeight)).toBe(await field.evaluate((n) => n.scrollHeight));
  });

  const sentences = Array.from({ length: 40 }, (_, n) => `Your order number {{${n}}} has been packed and shipped to you.`);

  test("long lines wrap where the field's do", async ({ page }) => {
    const { field, backdrop, marks } = await parts(page);
    await field.fill(sentences.join(" "));
    await expect(marks).toHaveCount(40);
    const height = await field.evaluate((n) => n.scrollHeight);
    expect(Math.abs((await backdrop.evaluate((n) => n.scrollHeight)) - height)).toBeLessThanOrEqual(1);
  });

  test("beside a scrollbar that takes up room, lines wrap where the field's do", async ({ page, browserName, playwright }) => {
    test.skip(browserName !== "chromium", "Needs a browser launched to show scrollbars, which headless ones hide");
    const browser = await playwright.chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
    try {
      const shown = await browser.newPage();
      await shown.goto(page.url());
      await ready(shown);
      const { field, backdrop, marks } = await parts(shown);
      await field.fill(sentences.join(" "));
      await expect(marks).toHaveCount(40);
      const bar = await field.evaluate((n: HTMLTextAreaElement) => n.offsetWidth - n.clientWidth - 2);
      expect(bar).toBeGreaterThan(0);
      expect(await styled(backdrop, "padding-right")).toBe(`${12 + bar}px`);
      const height = await field.evaluate((n) => n.scrollHeight);
      expect(Math.abs((await backdrop.evaluate((n) => n.scrollHeight)) - height)).toBeLessThanOrEqual(1);
    } finally {
      await browser.close();
    }
  });

  test("with wrapping off, the drawn text doesn't wrap either", async ({ page }) => {
    const { field, backdrop } = await parts(page);
    await field.evaluate((n: HTMLTextAreaElement) => (n.wrap = "off"));
    await field.fill("A line ".repeat(40));
    await expect(backdrop).toHaveCSS("white-space", "pre");
  });

  test("a hidden textarea takes what's drawn over it along", async ({ page }) => {
    const { field, backdrop } = await parts(page);
    await field.evaluate((n: HTMLTextAreaElement) => (n.hidden = true));
    await expect(backdrop).toBeHidden();
  });

  test("long text scrolls with the field, and wraps at the same width with a scrollbar", async ({ page }) => {
    const { field, backdrop, marks } = await parts(page);
    await field.fill(Array.from({ length: 30 }, (_, line) => `Line ${line} {{${line}}}`).join("\n"));
    await expect(marks).toHaveCount(30);
    await field.evaluate((n) => (n.scrollTop = n.scrollHeight));
    await expect.poll(() => field.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => scrolled(backdrop)).toEqual(await scrolled(field));
    const content = await backdrop.evaluate((n) => n.scrollHeight);
    const own = await field.evaluate((n) => n.scrollHeight);
    expect(Math.abs(content - own)).toBeLessThanOrEqual(1);
  });
});
