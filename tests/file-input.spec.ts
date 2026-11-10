import { expect, type Locator, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { boxes, example, onEachPlayground, ready, settled, test } from "./playgrounds.ts";

// What docs/components/file-input.md says: a button that opens the picker, then
// shows the file with a way to remove it; a real input the keyboard reaches;
// refusing a file and saying why; a file already attached; and a form's reset.
const csv = (name = "tasks.csv", size = 10) => ({ name, mimeType: "text/csv", buffer: Buffer.alloc(size, "a") });

// Sends a drag event carrying files, as the browser would. Returns whether the
// page let the browser's own handling go ahead.
const drag = (target: Locator, type: string, names = ["tasks.csv"]) =>
  target.evaluate(
    (node, [type, names]) => {
      const dataTransfer = new DataTransfer();
      for (const name of names as string[]) dataTransfer.items.add(new File(["a"], name, { type: "text/csv" }));
      return node.dispatchEvent(new DragEvent(type as string, { bubbles: true, cancelable: true, dataTransfer }));
    },
    [type, names] as const,
  );

onEachPlayground("file-input", () => {
  const parts = async (page: Page, id: string) => {
    const container = await example(page, id);
    const root = container.locator(".hfile-input").first();
    return {
      container,
      root,
      input: root.locator(".hfile-input-control"),
      button: root.locator("label.hbutton"),
      text: root.locator("label.hbutton .hbutton-label"),
      path: root.locator("label.hbutton .hicon path").last(),
      remove: root.locator("button.hbutton"),
      error: container.locator(".herror"),
      drop: root.locator(".hfile-input-drop"),
    };
  };
  const fileCount = (input: Locator) => input.evaluate((n: HTMLInputElement) => n.files!.length);

  test("the button opens the picker, then shows the file with a way to remove it", async ({ page }) => {
    const { input, button, text, path, remove } = await parts(page, "file-input-default");
    await expect(text).toHaveText("Choose file");
    await expect(remove).toBeHidden();
    const before = await path.getAttribute("d");
    const chooser = page.waitForEvent("filechooser");
    await button.click();
    await (await chooser).setFiles(csv());
    await expect(text).toHaveText("tasks.csv");
    await expect(remove).toBeVisible();
    expect(await path.getAttribute("d")).not.toBe(before);
    expect(await fileCount(input)).toBe(1);
  });

  test("the input is out of sight, but still reached by the keyboard", async ({ page }) => {
    const { input, button } = await parts(page, "file-input-default");
    await expect(input).not.toHaveAttribute("hidden");
    const [box] = await boxes(input);
    expect(box!.width).toBeLessThanOrEqual(1);
    await page.keyboard.press("Shift");
    await input.focus();
    await expect(button).toHaveCSS("outline-style", "solid");
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Space");
    await chooser;
  });

  test("it's named by the field's label and what the button says", async ({ page }) => {
    const { input } = await parts(page, "file-input-default");
    await expect(input).toHaveAccessibleName("Attachment Choose file");
    await input.setInputFiles(csv());
    await expect(input).toHaveAccessibleName("Attachment tasks.csv");
  });

  test("the button hovers as a Button does", async ({ page }) => {
    const { button } = await parts(page, "file-input-default");
    const rest = await button.evaluate((n) => getComputedStyle(n).borderTopColor);
    await button.hover();
    await expect.poll(() => button.evaluate((n) => getComputedStyle(n).borderTopColor)).not.toBe(rest);
  });

  test("removing a file empties the input and moves focus to it", async ({ page }) => {
    const { input, text, remove } = await parts(page, "file-input-default");
    await input.setInputFiles(csv());
    await remove.click();
    await expect(text).toHaveText("Choose file");
    await expect(remove).toBeHidden();
    await expect(input).toBeFocused();
    expect(await fileCount(input)).toBe(0);
  });

  test("a refused file says why and isn't kept", async ({ page }) => {
    const { input, text, remove, error } = await parts(page, "file-input-limited-to-a-type-and-size");
    await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("a") });
    await expect(error).toHaveText("Use a CSV file.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("A CSV file, up to 1 MB. Use a CSV file.");
    await expect(text).toHaveText("Choose file");
    await expect(remove).toBeHidden();
    expect(await fileCount(input)).toBe(0);

    await input.setInputFiles(csv("big.csv", 1024 * 1024 + 1));
    await expect(error).toHaveText("Use a file of 1 MB or less.");
    expect(await fileCount(input)).toBe(0);
  });

  test("a good file after a refused one clears the message", async ({ page }) => {
    const { input, text, error } = await parts(page, "file-input-limited-to-a-type-and-size");
    await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("a") });
    await expect(error).toHaveText("Use a CSV file.");
    await input.setInputFiles(csv());
    await expect(text).toHaveText("tasks.csv");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(error).toHaveText("");
    expect(await fileCount(input)).toBe(1);
  });

  test("removing also clears a message", async ({ page }) => {
    const { input, remove, error } = await parts(page, "file-input-limited-to-a-type-and-size");
    await input.setInputFiles(csv());
    await remove.click();
    await expect(error).toHaveText("");
  });

  test("a file already attached shows, and can be replaced or removed", async ({ page }) => {
    const { input, text, remove } = await parts(page, "file-input-with-a-file-already-attached");
    await expect(text).toHaveText("project-brief.pdf");
    await expect(remove).toBeVisible();
    await expect(remove).toHaveAccessibleName("Remove project brief");
    expect(await fileCount(input)).toBe(0);
    await input.setInputFiles(csv());
    await expect(text).toHaveText("tasks.csv");
    await remove.click();
    await expect(text).toHaveText("Choose file");
    await expect(remove).toBeHidden();
  });

  test("a long name ends in an ellipsis, with the whole of it in its title and the remove button beside it", async ({ page }) => {
    const { root, button, text, remove } = await parts(page, "file-input-long-file-name");
    const whole = await text.textContent();
    await expect(text).toHaveAttribute("title", whole!);
    await expect(text).toHaveCSS("text-overflow", "ellipsis");
    expect(await text.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeGreaterThan(0);
    const [around, drawn, removing] = await boxes(root, button, remove);
    expect(drawn!.height).toBeCloseTo(34, 0);
    expect(drawn!.x + drawn!.width).toBeLessThanOrEqual(removing!.x);
    expect(removing!.x + removing!.width).toBeLessThanOrEqual(around!.x + around!.width + 0.5);
    expect(await root.evaluate((n) => n.scrollWidth - n.clientWidth)).toBe(0);
  });

  test("the button's own text wraps instead, and loses the file's title with the file", async ({ page }) => {
    const { input, text, remove } = await parts(page, "file-input-default");
    await expect(text).not.toHaveCSS("text-overflow", "ellipsis");
    await input.setInputFiles(csv());
    await expect(text).toHaveAttribute("title", "tasks.csv");
    await remove.click();
    await expect(text).not.toHaveAttribute("title");
  });

  test("disabled, nothing can be chosen or removed", async ({ page }) => {
    const container = await example(page, "file-input-disabled");
    const inputs = container.locator(".hfile-input-control");
    await expect(inputs.nth(0)).toBeDisabled();
    await expect(inputs.nth(1)).toBeDisabled();
    const button = container.locator("label.hbutton").first();
    await expect(button).toHaveCSS("cursor", "not-allowed");
    await expect(button).toHaveCSS("opacity", await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.opacity = "var(--harmo-opacity-disabled)";
      const value = getComputedStyle(probe).opacity;
      probe.remove();
      return value;
    }));
    await expect(container.locator(".hfile-input button.hbutton:not([hidden])")).toBeDisabled();
  });

  test("resetting the form brings back the attached file", async ({ page }) => {
    const { container, input, text } = await parts(page, "file-input-in-a-form");
    await input.setInputFiles(csv());
    await expect(text).toHaveText("tasks.csv");
    expect(await container.locator("form").evaluate((form: HTMLFormElement) => (new FormData(form).get("timeline") as File).name)).toBe("tasks.csv");
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(text).toHaveText("timeline.pdf");
    expect(await fileCount(input)).toBe(0);
  });

  test("a drop area lights up in two stages as a file is dragged", async ({ page }) => {
    const { root } = await parts(page, "file-input-compact-drop-area");
    const rest = await root.evaluate((n) => getComputedStyle(n).backgroundColor);
    await drag(page.locator("body"), "dragenter");
    await expect(root).toHaveAttribute("data-dragging", "page");
    await expect(root).toHaveCSS("background-color", rest);
    await drag(root, "dragenter");
    await drag(root, "dragover");
    await expect(root).toHaveAttribute("data-dragging", "over");
    await expect.poll(() => root.evaluate((n) => getComputedStyle(n).backgroundColor)).not.toBe(rest);
    await drag(root, "dragleave");
    await drag(page.locator("body"), "dragleave");
    await expect(root).not.toHaveAttribute("data-dragging");
  });

  test("with several on a page, each one allows a drop, and only they do", async ({ page }) => {
    const effect = (target: Locator) =>
      target.evaluate((node) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File(["a"], "tasks.csv", { type: "text/csv" }));
        // A made-up event's dropEffect can't be set, so this keeps the last one
        // the page gave, which is the one a browser would obey.
        let last = "";
        Object.defineProperty(dataTransfer, "dropEffect", { set: (value) => (last = value), get: () => last });
        node.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }));
        return last;
      });
    for (const id of ["compact-drop-area", "large-drop-area", "avatar", "avatar-with-a-picture"]) {
      expect(await effect(page.locator(`[id="file-input-${id}"] .hfile-input`).first()), id).toBe("copy");
    }
    expect(await effect(page.locator("body"))).toBe("none");
    expect(await effect(page.locator('[id="file-input-disabled"] .hfile-input[data-variant="strip"]'))).toBe("none");
  });

  test("a real drag and drop reaches every area on the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium can send a drag from outside the page");
    const path = test.info().outputPath("tasks.csv");
    writeFileSync(path, "a,b");
    const browser = await page.context().newCDPSession(page);
    for (const id of ["compact-drop-area", "large-drop-area", "avatar-with-a-picture"]) {
      const root = page.locator(`[id="file-input-${id}"] .hfile-input`).first();
      await root.evaluate((node) => node.scrollIntoView({ block: "center" }));
      const [box] = await boxes(root);
      const at = {
        x: box!.x + box!.width / 2,
        y: box!.y + box!.height / 2,
        data: { items: [], files: [path], dragOperationsMask: 1 },
      };
      for (const type of ["dragEnter", "dragOver", "drop"] as const) {
        await browser.send("Input.dispatchDragEvent", { type, ...at });
      }
      await expect
        .poll(() => root.locator(".hfile-input-control").evaluate((n: HTMLInputElement) => n.files!.length), id)
        .toBe(1);
    }
  });

  test("a compact area is only as wide as what's in it", async ({ page }) => {
    const { container, root, button, drop } = await parts(page, "file-input-compact-drop-area");
    const [area, picked, words, column] = await boxes(root, button, drop, container.locator(".hfield"));
    expect(area!.width).toBeLessThan(column!.width);
    expect(area!.width).toBeCloseTo(picked!.width + 10 + words!.width + 2 * 16 + 2, 0);
  });

  test("a compact area keeps a long name and the remove button on one line", async ({ page }) => {
    const { container, root, input, button, remove } = await parts(page, "file-input-compact-drop-area");
    await input.setInputFiles(csv(`${"a-very-long-name-".repeat(12)}.csv`));
    await expect(remove).toBeVisible();
    await settled(button);
    const [drawn, removing] = await boxes(button, remove);
    expect(Math.abs(drawn!.y + drawn!.height / 2 - (removing!.y + removing!.height / 2))).toBeLessThan(1);
    const [area, column] = await boxes(root, container.locator(".hfield"));
    expect(area!.width).toBeLessThanOrEqual(column!.width + 0.5);
  });

  test("a large area's parts sit on the spacing scale", async ({ page }) => {
    const { root, button } = await parts(page, "file-input-large-drop-area");
    const [area, icon, heading, drop, hint, picked] = await boxes(
      root,
      root.locator(".hfile-input-icon"),
      root.locator(".hfile-input-heading"),
      root.locator(".hfile-input-drop"),
      root.locator(".hfile-input-hint"),
      button,
    );
    const gap = (above: { y: number; height: number }, below: { y: number }) => below.y - (above.y + above.height);
    expect(icon!.y - area!.y).toBeCloseTo(1 + 42, 0);
    expect(gap(icon!, heading!)).toBeCloseTo(16, 0);
    expect(gap(heading!, drop!)).toBeCloseTo(6, 0);
    expect(gap(drop!, hint!)).toBeCloseTo(10, 0);
    expect(gap(hint!, picked!)).toBeCloseTo(26, 0);
    expect(area!.y + area!.height - (picked!.y + picked!.height)).toBeCloseTo(42 + 1, 0);
    await expect(root.locator(".hfile-input-heading")).toHaveCSS("line-height", "26px");
  });

  test("dragging something that isn't a file doesn't light it up", async ({ page }) => {
    const { root } = await parts(page, "file-input-compact-drop-area");
    await drag(root, "dragenter", []);
    await expect(root).not.toHaveAttribute("data-dragging");
  });

  test("a dropped file goes into the real input, and shows", async ({ page }) => {
    const { root, input, text, remove } = await parts(page, "file-input-compact-drop-area");
    await drag(root, "dragenter");
    await drag(root, "drop");
    await expect(text).toHaveText("tasks.csv");
    await expect(remove).toBeVisible();
    await expect(root).not.toHaveAttribute("data-dragging");
    expect(await input.evaluate((n: HTMLInputElement) => n.files![0].name)).toBe("tasks.csv");
  });

  test("of several dropped, it takes the first", async ({ page }) => {
    const { root, input, text } = await parts(page, "file-input-compact-drop-area");
    await drag(root, "drop", ["one.csv", "two.csv"]);
    await expect(text).toHaveText("one.csv");
    expect(await fileCount(input)).toBe(1);
  });

  test("a drop that misses is stopped from opening the file, and isn't taken", async ({ page }) => {
    const { input, text } = await parts(page, "file-input-compact-drop-area");
    expect(await drag(page.locator("body"), "dragover")).toBe(false);
    expect(await drag(page.locator("body"), "drop")).toBe(false);
    await expect(text).toHaveText("Choose file");
    expect(await fileCount(input)).toBe(0);
  });

  test("a dropped file is checked as a chosen one is", async ({ page }) => {
    const { root, input, text, error } = await parts(page, "file-input-large-drop-area");
    await drag(root, "drop", ["notes.txt"]);
    await expect(error).toHaveText("Use a CSV file.");
    await expect(text).toHaveText("Choose file");
    expect(await fileCount(input)).toBe(0);
  });

  test("a disabled drop area ignores a drag", async ({ page }) => {
    const container = await example(page, "file-input-disabled");
    const root = container.locator('.hfile-input[data-variant="strip"]');
    await drag(root, "dragenter");
    await expect(root).not.toHaveAttribute("data-dragging");
  });

  test("a strip's text follows the button, and its own text isn't part of its name", async ({ page }) => {
    const { input, button, drop } = await parts(page, "file-input-compact-drop-area");
    const [picked, words] = await boxes(button, drop);
    expect(words!.x).toBeGreaterThan(picked!.x + picked!.width);
    await expect(input).toHaveAccessibleName("Attachment Choose file");
  });

  test("a large area keeps a long name and the remove button on one line", async ({ page }) => {
    const { root, input, button, remove } = await parts(page, "file-input-large-drop-area");
    await input.setInputFiles(csv(`${"a-very-long-name-".repeat(12)}.csv`));
    await expect(remove).toBeVisible();
    await settled(button);
    const [drawn, removing] = await boxes(button, remove);
    expect(Math.abs(drawn!.y + drawn!.height / 2 - (removing!.y + removing!.height / 2))).toBeLessThan(1);
    expect(await root.evaluate((n) => n.scrollWidth - n.clientWidth)).toBe(0);
  });

  test("the check appears once there's a file, and the arrow comes back without one", async ({ page }) => {
    const { root, input, remove } = await parts(page, "file-input-compact-drop-area");
    await expect(root.locator(".hfile-input-arrow")).toHaveCount(1);
    const arrow = await root.locator(".hfile-input-arrow").elementHandle();
    await input.setInputFiles(csv());
    await expect(root.locator(".hfile-input-check")).toHaveCount(1);
    await expect(root.locator(".hfile-input-arrow")).toHaveCount(0);
    // A new element, not the arrow changed, or the check wouldn't draw itself.
    expect(await arrow!.evaluate((node) => node.isConnected)).toBe(false);
    await remove.click();
    await expect(root.locator(".hfile-input-arrow")).toHaveCount(1);
  });

  test("with reduced motion, nothing moves while a file is over the area", async ({ page }) => {
    const { root } = await parts(page, "file-input-large-drop-area");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await drag(root, "dragenter");
    await drag(root, "dragover");
    await expect(root).toHaveAttribute("data-dragging", "over");
    await expect(root.locator(".hfile-input-icon")).toHaveCSS("transform", "none");
  });

  test("the whole of an avatar opens the picker", async ({ page }) => {
    const { root, input } = await parts(page, "file-input-avatar");
    const chooser = page.waitForEvent("filechooser");
    await root.locator(".hfile-input-heading").click();
    await (await chooser).setFiles({ name: "me.png", mimeType: "image/png", buffer: Buffer.from("a") });
    expect(await fileCount(input)).toBe(1);
  });

  test("an avatar shows the picture chosen, and it can be removed", async ({ page }) => {
    const { root, input, remove } = await parts(page, "file-input-avatar");
    const heading = root.locator(".hfile-input-heading > :not([data-inactive])");
    const picture = root.locator(".hfile-input-preview");
    await expect(picture).toHaveCount(0);
    await expect(remove).toBeHidden();
    await input.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: Buffer.from("a") });
    await expect(picture).toHaveAttribute("src", /^blob:/);
    await expect(heading).toHaveText("Change picture");
    await expect(remove).toBeVisible();
    await remove.click();
    await expect(picture).toHaveCount(0);
    await expect(heading).toHaveText("Upload picture");
    await expect(remove).toBeHidden();
    await expect(input).toBeFocused();
    expect(await fileCount(input)).toBe(0);
  });

  test("changing its text can't move the circle, however wide the text is", async ({ page }) => {
    const { root, input, remove } = await parts(page, "file-input-avatar");
    await root.locator(".hfile-input-heading").evaluate((n: HTMLElement) => (n.style.fontSize = "20px"));
    const circle = root.locator(".havatar");
    const [empty] = await boxes(circle);
    await input.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: Buffer.from("a") });
    await expect(remove).toBeVisible();
    const [picked] = await boxes(circle);
    expect(picked!.x).toBe(empty!.x);
    await remove.click();
    await expect(remove).toBeHidden();
    const [removed] = await boxes(circle);
    expect(removed!.x).toBe(empty!.x);
  });

  test("an avatar is named by the text that's showing", async ({ page }) => {
    const { input } = await parts(page, "file-input-avatar");
    await expect(input).toHaveAccessibleName("Upload picture PNG or JPG");
    await input.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: Buffer.from("a") });
    await expect(input).toHaveAccessibleName("Change picture PNG or JPG");
  });

  test("the remove button sits the same distance from the button in every variant", async ({ page }) => {
    for (const id of ["file-input-default", "file-input-compact-drop-area", "file-input-large-drop-area"]) {
      const { input, button, remove } = await parts(page, id);
      await input.setInputFiles(csv());
      await expect(remove).toBeVisible();
      await settled(button);
      await settled(remove);
      const [picked, removing] = await boxes(button, remove);
      expect(removing!.x - (picked!.x + picked!.width), id).toBeCloseTo(6, 0);
    }
  });

  test("a compact area's text follows the remove button at its own distance", async ({ page }) => {
    const { input, remove, drop } = await parts(page, "file-input-compact-drop-area");
    await input.setInputFiles(csv());
    await expect(remove).toBeVisible();
    await settled(remove);
    const [removing, words] = await boxes(remove, drop);
    expect(words!.x - (removing!.x + removing!.width)).toBeCloseTo(10, 0);
  });

  test("an avatar refuses a drop that isn't a picture", async ({ page }) => {
    const { root, input, error } = await parts(page, "file-input-avatar");
    await drag(root, "drop", ["notes.txt"]);
    await expect(error).toHaveText("Use an image.");
    expect(await fileCount(input)).toBe(0);
  });

  test("an avatar shows its focus on the circle", async ({ page }) => {
    const { root, input } = await parts(page, "file-input-avatar");
    await page.keyboard.press("Shift");
    await input.focus();
    await expect(root.locator(".havatar")).toHaveCSS("outline-style", "solid");
  });

  test("a picture already attached shows, on a solid circle, and can be removed", async ({ page }) => {
    const { root, remove } = await parts(page, "file-input-avatar-with-a-picture");
    const circle = root.locator(".havatar");
    await expect(root.locator(".hfile-input-preview")).toHaveAttribute("src", /imran\.webp$/);
    await expect(circle).toHaveCSS("border-top-style", "solid");
    await expect(remove).toBeVisible();
    await settled(remove);
    const [around, beside] = await boxes(circle, remove);
    expect(beside!.x - (around!.x + around!.width)).toBeCloseTo(6, 0);
    expect(beside!.y + beside!.height / 2).toBeCloseTo(around!.y + around!.height / 2, 0);
    await expect(remove).toHaveAttribute("data-variant", "tertiary");
    await remove.click();
    await expect(circle).toHaveCSS("border-top-style", "dashed");
  });

  test("in forced colors, a file over the area shows in the system's highlight", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const { root } = await parts(page, "file-input-compact-drop-area");
    await page.emulateMedia({ forcedColors: "active" });
    await drag(root, "dragenter");
    await expect(root).toHaveCSS("border-top-style", "solid");
  });

  test("on a touch screen, it's only the button", async ({ page, browserName, browser }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates a touch screen");
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 400, height: 800 } });
    try {
      const touch = await context.newPage();
      await touch.goto(page.url());
      await ready(touch);
      const { root, drop } = await parts(touch, "file-input-compact-drop-area");
      await expect(drop).toBeHidden();
      await expect(root).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    } finally {
      await context.close();
    }
  });

  test("right to left, the remove button is on the left", async ({ page }) => {
    const { root, button, remove } = await parts(page, "file-input-with-a-file-already-attached");
    await root.evaluate((n: HTMLElement) => (n.dir = "rtl"));
    const [drawn, removing] = await boxes(button, remove);
    expect(removing!.x + removing!.width).toBeLessThanOrEqual(drawn!.x);
  });
});
