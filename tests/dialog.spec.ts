import { expect, type Locator, type Page } from "@playwright/test";
import { animations, boxes, example, onEachPlayground, ready, release, rendered, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/dialog.md says, on the Dialog page: the browser opens,
// closes, and focuses it, CSS places and animates it and keeps the page still,
// on the "Opened from a link" example, the URL says whether it's open, and on
// "Unsaved changes", the app keeps it open to ask first, with onCancel and
// onBeforeToggle in React and its own listeners in HTML.
const isOpen = (dialog: Locator) => dialog.evaluate((node) => (node as HTMLDialogElement).open);

const openFrom = async (page: Page, id: string, trigger: string) => {
  const container = await example(page, id);
  const dialog = container.locator("dialog");
  await container.getByRole("button", { name: trigger }).click();
  await expect.poll(() => isOpen(dialog)).toBe(true);
  await settled(dialog);
  return { container, dialog };
};

// The "Unsaved changes" example's settings, opened, and the dialog that asks.
const openSettings = async (page: Page) => {
  const container = await example(page, "dialog-unsaved-changes");
  const settings = container.locator("#workspace-dialog");
  const asking = container.locator("#discard-changes-dialog");
  const trigger = container.getByRole("button", { name: "Workspace settings" });
  await trigger.click();
  await expect.poll(() => isOpen(settings)).toBe(true);
  await settled(settings);
  return { settings, asking, trigger, name: settings.getByLabel("Workspace name") };
};

const hasFocus = (dialog: Locator) => dialog.evaluate((node) => node.contains(document.activeElement));

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

  test("a request-close button's value is its returnValue once it has closed, and Escape later doesn't reuse it", async ({ page }) => {
    const { container, dialog } = await openFrom(page, "dialog-default", "Invite people");
    const cancel = dialog.getByRole("button", { name: "Cancel" });
    await cancel.evaluate((node) => node.setAttribute("value", "discard"));
    await cancel.click();
    await expect.poll(() => isOpen(dialog)).toBe(false);
    expect(await dialog.evaluate((node) => (node as HTMLDialogElement).returnValue)).toBe("discard");
    await settled(dialog);

    await dialog.evaluate((node) => ((node as HTMLDialogElement).returnValue = ""));
    await container.getByRole("button", { name: "Invite people" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    await settled(dialog);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
    expect(await dialog.evaluate((node) => (node as HTMLDialogElement).returnValue)).toBe("");
  });

  test("an app that stops the close, such as to confirm unsaved changes, keeps it open", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    // Before the dialog's own handlers, as React runs an app's onCancel.
    const stopped = await page.evaluateHandle(() => {
      const seen = { stopped: false };
      addEventListener("cancel", (event) => (event.preventDefault(), (seen.stopped = true)), { capture: true, once: true });
      return seen;
    });
    await page.keyboard.press("Escape");
    // Once the cancel has been stopped, and the page has rendered what its
    // handlers then did, such as start a fade with data-closing.
    await expect.poll(() => stopped.evaluate((seen) => seen.stopped)).toBe(true);
    await rendered(page);
    expect(await isOpen(dialog)).toBe(true);
    await expect(dialog).not.toHaveAttribute("data-closing");
  });

  test("an app that stops its form being sent keeps it open", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    // On the form, so before the dialog's own handler on the document, as an
    // app's onSubmit is.
    await dialog.locator("form").evaluate((form) => form.addEventListener("submit", (event) => event.preventDefault(), { once: true }));
    await dialog.getByRole("button", { name: "Send invite" }).click();
    // The click sends the form at once; then the page renders what its
    // handlers did, such as start a fade with data-closing.
    await rendered(page);
    expect(await isOpen(dialog)).toBe(true);
    await expect(dialog).not.toHaveAttribute("data-closing");
  });

  test("with unsaved changes, Escape, its close button, and a click outside each ask first, and Keep editing goes back to it, with focus inside", async ({ page }) => {
    const { settings, asking, name } = await openSettings(page);
    await name.fill("Acme Help");
    const ways: [string, () => Promise<void>][] = [
      ["Escape", () => page.keyboard.press("Escape")],
      ["its close button", () => settings.getByRole("button", { name: "Close" }).click()],
      ["a click outside", () => page.mouse.click(8, 8)],
    ];
    for (const [way, close] of ways) {
      await close();
      await expect.poll(() => isOpen(asking), way).toBe(true);
      await settled(asking);
      expect(await isOpen(settings), way).toBe(true);
      await expect(settings, way).not.toHaveAttribute("data-closing");
      await expect(page.getByRole("dialog", { name: "Discard unsaved changes?" }), way).toHaveAccessibleDescription(
        "Your changes to the workspace settings haven't been saved.",
      );

      await asking.getByRole("button", { name: "Keep editing" }).click();
      await expect.poll(() => isOpen(asking), way).toBe(false);
      await expect.poll(() => hasFocus(settings), way).toBe(true);
      expect(await isOpen(settings), way).toBe(true);
      await expect(settings, way).not.toHaveAttribute("data-closing");
      await expect(name, way).toHaveValue("Acme Help");
    }
  });

  test("Discard fades both out together, closes them, returns focus to the settings' button, and they open again with what was saved", async ({ page }) => {
    const { settings, asking, trigger, name } = await openSettings(page);
    await name.fill("Acme Help");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(asking)).toBe(true);
    await settled(asking);
    await slowDown(settings);
    await slowDown(asking);
    await asking.getByRole("button", { name: "Discard" }).click();

    // Both held open, fading, from the same moment.
    for (const dialog of [settings, asking]) {
      await expect(dialog).toHaveAttribute("data-closing");
      await expect.poll(() => animations(dialog)).toBeGreaterThan(0);
      expect(await isOpen(dialog)).toBe(true);
    }
    const started = (dialog: Locator) =>
      dialog.evaluate(async (node) => {
        await Promise.all(node.getAnimations().map((animation) => animation.ready));
        return Math.min(...node.getAnimations().map((animation) => Number(animation.startTime)));
      });
    expect(Math.abs((await started(settings)) - (await started(asking)))).toBeLessThan(20);

    // The settings' fade ending first still closes the dialog that asks first,
    // so focus goes back through the settings to their button.
    for (const dialog of [settings, asking]) {
      await dialog.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    }
    await release(settings);
    await release(asking);
    await expect.poll(() => isOpen(asking)).toBe(false);
    await expect.poll(() => isOpen(settings)).toBe(false);
    await expect(trigger).toBeFocused();
    await settled(settings);

    await trigger.click();
    await expect.poll(() => isOpen(settings)).toBe(true);
    await expect(name).toHaveValue("Acme Support");
  });

  test("without changes, or once they're saved, the settings close without asking", async ({ page }) => {
    const { settings, asking, trigger, name } = await openSettings(page);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(settings)).toBe(false);
    expect(await isOpen(asking)).toBe(false);
    await settled(settings);

    await trigger.click();
    await expect.poll(() => isOpen(settings)).toBe(true);
    await settled(settings);
    await name.fill("Acme Help");
    await settings.getByRole("button", { name: "Save changes" }).click();
    await expect.poll(() => isOpen(settings)).toBe(false);
    expect(await isOpen(asking)).toBe(false);
    await settled(settings);

    await trigger.click();
    await expect.poll(() => isOpen(settings)).toBe(true);
    await settled(settings);
    await expect(name).toHaveValue("Acme Help");
    await settings.getByRole("button", { name: "Cancel" }).click();
    await expect.poll(() => isOpen(settings)).toBe(false);
    expect(await isOpen(asking)).toBe(false);
  });

  test("a long word in its description or body breaks, rather than running under the close button or scrolling sideways", async ({ page }) => {
    const key = `sk_live_${"51HqT9xKZ4mBvR2cWnPq8sLdYfE3aGhJ".repeat(3)}`;
    const container = await example(page, "dialog-default");
    await container.locator(".hdialog-description").evaluate((node, key) => node.append(` ${key}`), key);
    await container.locator(".hdialog-body").evaluate((node, key) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = key;
      node.append(paragraph);
    }, key);
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    const description = dialog.locator(".hdialog-description");
    const body = dialog.locator(".hdialog-body");
    const [text, close] = await boxes(description, dialog.locator(".hdialog-close"));
    expect(text.x + text.width).toBeLessThanOrEqual(close.x);
    expect(await description.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await body.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  });

  test("a click outside closes it, and a click inside doesn't", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    await dialog.locator(".hdialog-description").click();
    expect(await isOpen(dialog)).toBe(true);
    await page.mouse.click(8, 8);
    await expect.poll(() => isOpen(dialog)).toBe(false);
  });

  test('with closedby="closerequest", a click outside doesn\'t close it, but Escape does', async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-confirm-before-deleting", "Delete campaign");
    await page.mouse.click(8, 8);
    // Until a fade the click started would have ended, and closed it.
    await settled(dialog);
    expect(await isOpen(dialog)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(dialog)).toBe(false);
  });

  test("a Select inside opens above it, choosing keeps it open, and Escape closes the list first", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    const select = dialog.getByRole("combobox", { name: "Role" });
    const popup = dialog.locator(".hpopup");
    await select.click();
    await expect.poll(() => popup.evaluate((node) => node.matches(":popover-open"))).toBe(true);
    await settled(popup);
    await dialog.getByRole("option", { name: "Admin" }).click();
    await expect(select).toHaveText(/Admin/);
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
    expect(box.y).toBeCloseTo(26, 0);
    expect(box.y + box.height).toBeCloseTo(600 - 26, 0);
    expect(header.y).toBeGreaterThanOrEqual(box.y);
    expect(footer.y + footer.height).toBeLessThanOrEqual(box.y + box.height);
    await body.focus();
    await page.keyboard.press("End");
    await expect.poll(() => body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  });

  test("it has 26px padding, its description sits 6px under its title, and its actions sit 10px apart", async ({ page }) => {
    const { dialog } = await openFrom(page, "dialog-default", "Invite people");
    const spacing = await dialog.evaluate((node) => {
      const style = (part: string) => getComputedStyle(node.querySelector(part)!);
      return {
        padding: getComputedStyle(node).padding,
        description: style(".hdialog-description").marginTop,
        header: style(".hdialog-header").columnGap,
        actions: style(".hdialog-footer").columnGap,
        footer: style(".hdialog-footer").marginTop,
      };
    });
    expect(spacing).toEqual({ padding: "26px", description: "6px", header: "16px", actions: "10px", footer: "16px" });
  });

  test("on a phone, it has 16px padding and keeps 10px from the window's edges", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    const { dialog } = await openFrom(page, "dialog-long-content", "Read the terms");
    const [box] = await boxes(dialog);
    expect(box.x).toBeCloseTo(10, 0);
    expect(box.x + box.width).toBeCloseTo(390 - 10, 0);
    expect(box.y).toBeCloseTo(10, 0);
    expect(await dialog.evaluate((node) => getComputedStyle(node).padding)).toBe("16px");
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
    // Closed once its fade has ended, which in React starts as the URL
    // changes, and still closed once the page has rendered what followed.
    await expect.poll(() => isOpen(dialog)).toBe(false);
    await rendered(page);
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

  test("with open held by the app and false, a button that would open it asks instead, and it opens once open is true", async ({ page }) => {
    test.skip(!test.info().titlePath.includes("react"), "open is a React prop");
    const container = await example(page, "dialog-opened-from-a-link");
    const dialog = container.locator("dialog");
    // A button of the app's own, outside the example. Its app opens the dialog
    // from the URL only, so it doesn't take up the request.
    await page.evaluate(() => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Open shortcuts";
      button.setAttribute("commandfor", "shortcuts-dialog");
      button.setAttribute("command", "show-modal");
      document.body.append(button);
    });
    await page.getByRole("button", { name: "Open shortcuts" }).click();
    // The click asks at once; then the page renders what that did.
    await rendered(page);
    expect(await isOpen(dialog)).toBe(false);
    expect(new URL(page.url()).search).toBe("");

    await container.getByRole("link", { name: "Keyboard shortcuts" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
  });

  test("from a link: the link opens it, Back closes it, a reload with ?dialog opens it, and closing takes it off the URL", async ({ page }) => {
    const container = await example(page, "dialog-opened-from-a-link");
    const dialog = container.locator("dialog");
    await container.getByRole("link", { name: "Keyboard shortcuts" }).click();
    await expect.poll(() => isOpen(dialog)).toBe(true);
    expect(new URL(page.url()).searchParams.get("dialog")).toBe("shortcuts-dialog");

    await page.goBack();
    await expect.poll(() => isOpen(dialog)).toBe(false);
    await expect.poll(() => new URL(page.url()).search).toBe("");

    await page.goto(`${page.url()}?dialog=shortcuts-dialog`);
    await ready(page);
    await expect.poll(() => isOpen(page.locator("#shortcuts-dialog"))).toBe(true);
    await page.locator("#shortcuts-dialog").getByRole("button", { name: "Close" }).click();
    await expect.poll(() => isOpen(page.locator("#shortcuts-dialog"))).toBe(false);
    // Taken off the URL as it closes: a moment after it's closed.
    await expect.poll(() => new URL(page.url()).search).toBe("");
  });
});
