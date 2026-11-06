import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, release, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/dialog.md says, on the Dialog page: the browser opens,
// closes, and focuses it, CSS places and animates it and keeps the page still,
// and on the "Opened from a link" example, the URL says whether it's open.
const isOpen = (dialog: Locator) => dialog.evaluate((node) => (node as HTMLDialogElement).open);

const openFrom = async (page: Page, id: string, trigger: string) => {
  const container = await example(page, id);
  const dialog = container.locator("dialog");
  await container.getByRole("button", { name: trigger }).click();
  await expect.poll(() => isOpen(dialog)).toBe(true);
  await settled(dialog);
  return { container, dialog };
};

onEachPlayground("dialog", () => {
  test("its button opens it as a modal, named by its title, with focus on the field with autofocus", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(page.getByRole("dialog", { name: "Invite people" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Invite people" })).toHaveAccessibleDescription(
      "They get an email with a link to join this workspace.",
    );
    await expect(dialog.getByLabel("Email")).toBeFocused();
  });

  test("Escape closes it and returns focus to its button", async ({ page }) => {
    const { container, dialog } = await openFrom(page, "dialog-default", "Invite people");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
    await expect(container.getByRole("button", { name: "Invite people" })).toBeFocused();
  });

  test("its close button, Cancel, and sending its form each close it", async ({ page }) => {
    for (const close of [
      (dialog: Locator) => dialog.getByRole("button", { name: "Close" }).click(),
      (dialog: Locator) => dialog.getByRole("button", { name: "Cancel" }).click(),
      (dialog: Locator) => dialog.getByRole("button", { name: "Send invite" }).click(),
    ]) {
      const { dialog } = await openFrom(page, "dialog-default", "Invite people");
      await close(dialog);
      await expect.poll(() => isOpen(dialog)).toBe(false);
      await settled(dialog);
    }
  });

  test("a click outside closes it, and a click inside doesn't", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    await dialog.locator(".hdialog-description").click();
    expect(await isOpen(dialog)).toBe(true);
    await page.mouse.click(8, 8);
    await expect.poll(() => isOpen(dialog)).toBe(false);
  });

  test('with closedby="closerequest", a click outside doesn\'t close it, but Escape does', async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-closing-only-on-purpose", "New team");
    await page.mouse.click(8, 8);
    await page.waitForTimeout(200);
    expect(await isOpen(dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
  });

  test("a Select inside opens above it, choosing keeps it open, and Escape closes the list first", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-closing-only-on-purpose", "New team");
    const select = dialog.getByRole("combobox", { name: "Visibility" });
    const popup = dialog.locator(".hpopup");
    await select.click();
    await expect.poll(() => popup.evaluate((node) => node.matches(":popover-open"))).toBe(true);
    await settled(popup);
    await dialog.getByRole("option", { name: "Its members only" }).click();
    await expect(select).toHaveText(/Its members only/);
    expect(await isOpen(dialog)).toBe(true);

    await select.click();
    await expect.poll(() => popup.evaluate((node) => node.matches(":popover-open"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => popup.evaluate((node) => node.matches(":popover-open"))).toBe(false);
    expect(await isOpen(dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
  });

  test("the page behind doesn't scroll while it's open", async ({ page }) => {
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    expect(await overflow()).not.toBe("hidden");
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    expect(await overflow()).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
    expect(await overflow()).not.toBe("hidden");
  });

  test("a long body scrolls inside it, with its header and footer in view", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    const { dialog } = await openFrom(page, "dialog-long-content", "Read the terms");
    const body = dialog.locator(".hdialog-body");
    expect(await body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const [box, header, footer] = await boxes(dialog, dialog.locator(".hdialog-header"), dialog.locator(".hdialog-footer"));
    expect(box.y).toBeCloseTo(24, 0);
    expect(box.y + box.height).toBeCloseTo(600 - 24, 0);
    expect(header.y).toBeGreaterThanOrEqual(box.y);
    expect(footer.y + footer.height).toBeLessThanOrEqual(box.y + box.height);
    await body.focus();
    await page.keyboard.press("End");
    await expect.poll(() => body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  });

  test("it grows from 95% as it opens in 200ms, and fades out where it is in 150ms before it closes", async ({ page }) => {
    const container = await example(page, "dialog-default");
    const dialog = container.locator("dialog");
    await slowDown(dialog);
    await container.getByRole("button", { name: "Invite people" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    const scale = () => dialog.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
    expect(await scale()).toBeCloseTo(0.95, 2);
    await release(dialog);
    await dialog.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    await settled(dialog);
    expect(await dialog.evaluate((node) => getComputedStyle(node).transitionDuration)).toMatch(/^0\.2s/);
    const [open] = await boxes(dialog);

    // Held open while it fades, in every browser.
    await slowDown(dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-closing");
    expect(await isOpen(dialog)).toBe(true);
    const [closing] = await boxes(dialog);
    expect(closing.x).toBeCloseTo(open.x, 0);
    expect(closing.y).toBeCloseTo(open.y, 0);
    await dialog.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    expect(await dialog.evaluate((node) => getComputedStyle(node).transitionDuration)).toMatch(/^0\.15s/);
    // The fade it started still runs for 100s, so end it, and the dialog closes.
    await release(dialog);
    await expect.poll(() => isOpen(dialog)).toBe(false);
    await expect(dialog).not.toHaveAttribute("data-closing");
    await expect(container.getByRole("button", { name: "Invite people" })).toBeFocused();
  });

  test("every way of closing it fades it out first", async ({ page }) => {
    const ways: [string, (dialog: Locator) => Promise<void>][] = [
      ["its close button", (dialog) => dialog.getByRole("button", { name: "Close" }).click()],
      ["Cancel", (dialog) => dialog.getByRole("button", { name: "Cancel" }).click()],
      ["sending its form", (dialog) => dialog.getByRole("button", { name: "Send invite" }).click()],
      ["Escape", () => page.keyboard.press("Escape")],
      ["a click outside", () => page.mouse.click(8, 8)],
    ];
    for (const [way, close] of ways) {
      const { dialog } = await openFrom(page, "dialog-default", "Invite people");
      await dialog.evaluate((node) => {
        const seen = { faded: false };
        new MutationObserver(() => {
          if (node.hasAttribute("data-closing")) seen.faded = true;
        }).observe(node, { attributes: true, attributeFilter: ["data-closing"] });
        (node as HTMLElement & { seen?: typeof seen }).seen = seen;
      });
      await close(dialog);
      await expect.poll(() => isOpen(dialog), way).toBe(false);
      expect(await dialog.evaluate((node) => (node as HTMLElement & { seen?: { faded: boolean } }).seen?.faded), way).toBe(true);
      await settled(dialog);
    }
  });

  test("with reduced motion, it fades without growing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const container = await example(page, "dialog-default");
    const dialog = container.locator("dialog");
    await slowDown(dialog);
    await container.getByRole("button", { name: "Invite people" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    expect(await dialog.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a)).toBeGreaterThan(0.99);
    expect(Number(await dialog.evaluate((node) => getComputedStyle(node).opacity))).toBeLessThan(0.5);
    await release(dialog);
  });

  test("hidden hides an open dialog at once, without fading", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    const display = await dialog.evaluate((node) => {
      (node as HTMLElement).hidden = true;
      return getComputedStyle(node).display;
    });
    expect(display).toBe("none");
  });

  test("from a link: closing it with its button goes back, and it stays closed while the URL catches up", async ({ page }) => {
    const container = await example(page, "dialog-opened-from-a-link");
    const dialog = container.locator("dialog");
    await container.getByRole("link", { name: "Keyboard shortcuts" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    await settled(dialog);
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await page.waitForTimeout(300);
    expect(await isOpen(dialog)).toBe(false);
  });

  test("from a link: other parameters in the URL stay, and a click with Ctrl or Cmd is left to the browser", async ({ page }) => {
    await page.goto(`${page.url()}?tab=members`);
    await ready(page);
    const container = await example(page, "dialog-opened-from-a-link");
    const dialog = container.locator("dialog");
    const link = container.getByRole("link", { name: "Keyboard shortcuts" });

    const opened = page.context().waitForEvent("page", { timeout: 2000 }).catch(() => undefined);
    await link.click({ modifiers: ["ControlOrMeta"] });
    await (await opened)?.close();
    expect(await isOpen(dialog)).toBe(false);
    expect(new URL(page.url()).searchParams.get("dialog")).toBeNull();

    await link.click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    const params = new URL(page.url()).searchParams;
    expect([params.get("tab"), params.get("dialog")]).toEqual(["members", "shortcuts-dialog"]);
    await page.keyboard.press("Escape");
    await expect.poll(() => new URL(page.url()).search).toBe("?tab=members");
  });

  test("from a link: the link opens it, Back closes it, a reload with ?dialog opens it, and closing takes it off the URL", async ({ page }) => {
    const container = await example(page, "dialog-opened-from-a-link");
    const dialog = container.locator("dialog");
    await container.getByRole("link", { name: "Keyboard shortcuts" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    expect(new URL(page.url()).searchParams.get("dialog")).toBe("shortcuts-dialog");

    await page.goBack();
    await expect.poll(() => isOpen(dialog)).toBe(false);
    expect(new URL(page.url()).search).toBe("");

    await page.goto(`${page.url()}?dialog=shortcuts-dialog`);
    await ready(page);
    await expect.poll(() => isOpen(page.locator("#shortcuts-dialog"))).toBe(true);
    await page.locator("#shortcuts-dialog").getByRole("button", { name: "Close" }).click();
    await expect.poll(() => isOpen(page.locator("#shortcuts-dialog"))).toBe(false);
    expect(new URL(page.url()).search).toBe("");
  });
});
