import { expect, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/copy.md says: a Copy Button copies, then says so for
// two seconds, in its icon, its tooltip or text, and a status; a field copies
// what's in it; a failure changes nothing; and a Share Button shares where
// the browser can, and elsewhere copies the link.
type Recorded = Window & { copied: string[]; shared: ShareData[]; widths: number };

// Records what's copied or shared, or, with `fail`, fails to copy.
const stubClipboard = (page: Page, { fail = false } = {}) =>
  page.evaluate((fail) => {
    const recorded = window as unknown as Recorded;
    recorded.copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (fail) throw new Error("Denied");
          recorded.copied.push(text);
        },
      },
    });
  }, fail);

const stubShare = (page: Page, outcome: "shared" | "cancelled" | "none") =>
  page.evaluate((outcome) => {
    const recorded = window as unknown as Recorded;
    recorded.shared = [];
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value:
        outcome === "none"
          ? undefined
          : async (data: ShareData) => {
              if (outcome === "cancelled") throw new DOMException("Cancelled", "AbortError");
              recorded.shared.push(data);
            },
    });
  }, outcome);

const copied = (page: Page) => page.evaluate(() => (window as unknown as Recorded).copied);
const shared = (page: Page) => page.evaluate(() => (window as unknown as Recorded).shared);

onEachPlayground("copy", () => {
  test("it copies, then for two seconds its icon is a check and its tooltip and a status say so, even with no pointer over it", async ({ page }) => {
    await stubClipboard(page);
    const container = await example(page, "copy-copy-a-link");
    // While it confirms, the tooltip that names it says "Copied".
    const button = container.locator(".hcopy");
    await expect(button).toHaveAccessibleName("Copy link");
    const status = container.getByRole("status");
    const tooltip = container.getByRole("tooltip");
    const [done, icon] = [button.locator(".hcopy-done"), button.locator(".hcopy-icon")];
    await expect(done).toHaveCSS("opacity", "0");
    await expect(status).toBeEmpty();

    await button.click();
    await page.mouse.move(0, 0);
    expect(await copied(page)).toEqual(["https://example.com/blog/first-response-time"]);
    await expect(done).toHaveCSS("opacity", "1");
    await expect(icon).toHaveCSS("opacity", "0");
    await expect(status).toHaveText("Copied");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("Copied");
    await expect(button).toHaveAccessibleName("Copied");

    await expect(status).toBeEmpty({ timeout: 3000 });
    await expect(icon).toHaveCSS("opacity", "1");
    await expect(tooltip).toBeHidden();
    await expect(button).toHaveAccessibleName("Copy link");
  });

  test("with reduced motion, the icons only fade, both ways", async ({ page }) => {
    await stubClipboard(page);
    const button = (await example(page, "copy-copy-a-link")).locator(".hcopy");
    const [icon, done] = [button.locator(".hcopy-icon"), button.locator(".hcopy-done")];
    await expect(done).toHaveCSS("scale", "0.8");

    // Switching here is itself a change, which the check's transition plays.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settled(done);
    const unscaled = async () => {
      for (const part of [icon, done]) {
        expect(["none", "1"]).toContain(await part.evaluate((node) => getComputedStyle(node).scale));
      }
    };
    await unscaled();
    await button.click();
    await expect(done).toHaveCSS("opacity", "1");
    await expect(icon).toHaveCSS("opacity", "0");
    await unscaled();
    await expect(button).not.toHaveAttribute("data-copied", "", { timeout: 3000 });
    await expect(icon).toHaveCSS("opacity", "1");
    await unscaled();
  });

  test("it confirms for two seconds", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00") });
    await page.clock.pauseAt(new Date("2026-01-01T00:00:10"));
    await stubClipboard(page);
    const button = (await example(page, "copy-copy-a-link")).locator(".hcopy");
    await button.click();
    await expect(button).toHaveAttribute("data-copied");
    await page.clock.fastForward(1900);
    await expect(button).toHaveAttribute("data-copied");
    await page.clock.fastForward(200);
    await expect(button).not.toHaveAttribute("data-copied");
  });

  test("copying again while it confirms is read again", async ({ page }) => {
    await stubClipboard(page);
    const container = await example(page, "copy-copy-a-link");
    const button = container.locator(".hcopy");
    const status = container.getByRole("status");
    const said = () => status.evaluate((node) => node.textContent);
    await button.click();
    await expect(status).toHaveText("Copied");
    const first = await said();
    await button.click();
    await expect.poll(said).not.toBe(first);
    await expect(status).toHaveText("Copied");
    expect(await copied(page)).toHaveLength(2);
  });

  test("a disabled one copies nothing", async ({ page }, info) => {
    // React's Button ignores the click, from its aria-disabled prop.
    test.skip(!info.titlePath.includes("html"), "HTML only");
    await stubClipboard(page);
    const container = await example(page, "copy-copy-a-link");
    const button = container.locator(".hcopy");
    await button.evaluate((node) => node.setAttribute("aria-disabled", "true"));
    // Forced: Playwright won't click what's aria-disabled, as a person can.
    await button.click({ force: true });
    expect(await copied(page)).toEqual([]);
    await expect(button).not.toHaveAttribute("data-copied");
  });

  test("with its text, it's spaced as any Button, and Copy turns into Copied with its width following", async ({ page }) => {
    await stubClipboard(page);
    const container = await example(page, "copy-with-its-text");
    const button = container.getByRole("button", { name: "Copy", exact: true });
    await expect(button.locator(".hbutton-label")).toHaveText("Copy");

    // The label's 6px and the 1px border, with no room kept for "Copied".
    const textToBorder = await button.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node.querySelector(".hbutton-label")!);
      return node.getBoundingClientRect().right - range.getBoundingClientRect().right;
    });
    expect(textToBorder).toBeCloseTo(7, 0);

    // Whether the width is animated, recorded as it starts.
    await page.evaluate(() => {
      const recorded = window as unknown as Recorded;
      recorded.widths = 0;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        if (JSON.stringify(keyframes).includes("width")) recorded.widths += 1;
        return animate.call(this, keyframes, options);
      };
    });

    const [before] = await boxes(button);
    await button.click();
    const copiedButton = container.getByRole("button", { name: "Copied", exact: true });
    expect(await copied(page)).toEqual(["npm install @harmo-ui/css"]);
    await expect(copiedButton).toBeVisible();
    await expect(container.getByRole("status")).toHaveText("Copied");
    await expect.poll(() => page.evaluate(() => (window as unknown as Recorded).widths)).toBe(1);

    // Once the press and the width have settled.
    await settled(copiedButton);
    const [after] = await boxes(copiedButton);
    expect(after.width).toBeGreaterThan(before.width);

    const again = container.getByRole("button", { name: "Copy", exact: true });
    await expect(again).toBeVisible({ timeout: 3000 });
    await settled(again);
    const [back] = await boxes(again);
    expect(back.width).toBeCloseTo(before.width, 0);
  });

  test("the copy icon is drawn at the center of its box", async ({ page }) => {
    const icon = (await example(page, "copy-copy-a-link")).locator(".hcopy-icon");
    const { x, y, width, height } = await icon.evaluate((svg) => {
      const box = (svg as SVGSVGElement).getBBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });
    expect(x + width / 2).toBeCloseTo(12, 1);
    expect(y + height / 2).toBeCloseTo(12, 1);
  });

  test("a field is a read-only input, named by its label, with the button inside its end, which copies what's in it", async ({ page }) => {
    await stubClipboard(page);
    const container = await example(page, "copy-in-a-field");
    const input = container.getByRole("textbox", { name: "Account ID" });
    await expect(input).toHaveAttribute("readonly");
    await expect(input).toHaveValue("acc_7Hq2vX9pLm4");
    await expect(input).toHaveAccessibleDescription("Support asks for it when you write to them.");

    // The field's description is the input's, not the button's.
    const button = container.getByRole("button", { name: "Copy account ID" });
    await expect(button).not.toHaveAttribute("aria-describedby");

    const [field, target] = await boxes(input, button);
    expect(field.x + field.width - (target.x + target.width)).toBeLessThanOrEqual(4);
    expect(target.y).toBeGreaterThanOrEqual(field.y);
    expect(target.y + target.height).toBeLessThanOrEqual(field.y + field.height);

    await button.click();
    expect(await copied(page)).toEqual(["acc_7Hq2vX9pLm4"]);
  });

  test("with enlarged text, a long value stops short of the button", async ({ page }) => {
    const container = await example(page, "copy-in-a-field");
    await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
    const input = container.getByRole("textbox");
    const end = await input.evaluate((node) => {
      const style = getComputedStyle(node);
      return node.getBoundingClientRect().right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
    });
    const [target] = await boxes(container.getByRole("button"));
    expect(end).toBeLessThanOrEqual(target.x);
  });

  test("if copying fails, nothing changes", async ({ page }) => {
    await stubClipboard(page, { fail: true });
    const container = await example(page, "copy-copy-a-link");
    const button = container.getByRole("button", { name: "Copy link" });
    await button.click();
    await page.mouse.move(0, 0);
    await expect(button).not.toHaveAttribute("data-copied");
    await expect(container.getByRole("status")).toBeEmpty();
    await expect(container.getByRole("tooltip")).toBeHidden();
  });

  test("the share links open in a new tab, each named for its site", async ({ page }) => {
    await page.context().route(/x\.com|linkedin\.com|facebook\.com/, (route) => route.fulfill({ contentType: "text/html", body: "" }));
    const container = await example(page, "copy-share");
    const encoded = "https%3A%2F%2Fexample.com%2Fblog%2Ffirst-response-time";
    const links: [string, string][] = [
      ["Share on X", `https://x.com/intent/post?url=${encoded}&text=First%20response%20time%2C%20explained`],
      ["Share on LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`],
      ["Share on Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encoded}`],
    ];
    const here = page.url();
    for (const [name, href] of links) {
      const link = container.getByRole("link", { name });
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const [tab] = await Promise.all([page.context().waitForEvent("page"), link.click()]);
      await tab.waitForLoadState();
      expect(tab.url()).toBe(href);
      await tab.close();
      expect(page.url()).toBe(here);
    }
  });

  test("the Share Button opens the share sheet where the browser has one, and says nothing", async ({ page }) => {
    await stubClipboard(page);
    await stubShare(page, "shared");
    const container = await example(page, "copy-share");
    const button = container.getByRole("button", { name: "Share" });
    await button.click();
    await expect.poll(() => shared(page)).toEqual([
      { url: "https://example.com/blog/first-response-time", title: "First response time, explained" },
    ]);
    expect(await copied(page)).toEqual([]);
    await expect(button).not.toHaveAttribute("data-copied");
  });

  test("cancelling the share sheet changes nothing", async ({ page }) => {
    await stubClipboard(page);
    await stubShare(page, "cancelled");
    const container = await example(page, "copy-share");
    const button = container.getByRole("button", { name: "Share" });
    await button.click();
    await expect(button).not.toHaveAttribute("data-copied");
    expect(await copied(page)).toEqual([]);
  });

  test("where the browser has no share sheet, the Share Button copies the link and says so", async ({ page }) => {
    await stubClipboard(page);
    await stubShare(page, "none");
    const container = await example(page, "copy-share");
    await container.getByRole("button", { name: "Share" }).click();
    await page.mouse.move(0, 0);
    expect(await copied(page)).toEqual(["https://example.com/blog/first-response-time"]);
    await expect(container.getByRole("status")).toHaveText("Link copied");
    await expect(container.getByRole("tooltip").filter({ hasText: "Link copied" })).toBeVisible();
  });

  test("right to left, the button is at the field's left end", async ({ page }) => {
    const container = await example(page, "copy-right-to-left");
    const [field, target] = await boxes(container.getByRole("textbox"), container.getByRole("button"));
    expect(target.x - field.x).toBeLessThanOrEqual(4);
  });
});
