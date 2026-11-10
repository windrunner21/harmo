import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/file-list.md says: each file with its name, detail, and a
// way to remove it; progress that can't move the row; a check when it's done; a
// failure that says why and can be tried again; a grid whose tiles slide into
// place; and files arriving from a File Input.
const png = { name: "me.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64") };
const csv = (name = "tasks.csv") => ({ name, mimeType: "text/csv", buffer: Buffer.from("a,b") });

const drag = (target: Locator, type: string, names: string[]) =>
  target.evaluate(
    (node, [type, names]) => {
      const dataTransfer = new DataTransfer();
      for (const name of names as string[]) dataTransfer.items.add(new File(["a"], name, { type: "text/csv" }));
      return node.dispatchEvent(new DragEvent(type as string, { bubbles: true, cancelable: true, dataTransfer }));
    },
    [type, names] as const,
  );

onEachPlayground("file-list", () => {
  const parts = async (page: Page, id: string) => {
    const container = await example(page, `file-list-${id}`);
    return {
      container,
      list: container.locator(".hfile-list"),
      rows: container.locator(".hfile-list-item:not([data-leaving])"),
      input: container.locator(".hfile-input-control"),
      drop: container.locator(".hfile-input"),
      error: container.locator(".herror"),
    };
  };

  test("each file shows its name, its detail, and a way to remove it", async ({ page }) => {
    const { list, rows } = await parts(page, "default");
    await expect(list).toHaveAccessibleName("Attachments");
    await expect(rows).toHaveCount(3);
    const first = rows.first();
    await expect(first.locator(".hfile-list-name")).toHaveText("project-brief.pdf");
    await expect(first.locator(".hfile-list-detail")).toHaveText("412 kB");
    await expect(first.locator(".hfile-list-remove")).toHaveAccessibleName("Remove project-brief.pdf");
  });

  test("it stays a list for Safari", async ({ page }) => {
    const { list } = await parts(page, "default");
    await expect(list).toHaveAttribute("role", "list");
  });

  test("files there as the page loads don't settle in, and new ones do", async ({ page }) => {
    const { rows } = await parts(page, "default");
    await expect(rows.first()).not.toHaveAttribute("data-new");
    const added = await parts(page, "compact-drop-area");
    await added.input.setInputFiles(csv());
    await expect(added.rows.first()).toHaveAttribute("data-new");
  });

  test("removing a file by keyboard closes its row and moves focus to the next", async ({ page }) => {
    const { rows } = await parts(page, "default");
    await rows.first().locator(".hfile-list-remove").focus();
    await page.keyboard.press("Enter");
    await expect(rows).toHaveCount(2);
    await expect(page.locator(":focus")).toHaveAccessibleName("Remove timeline.xlsx");
  });

  test("after the last file goes, focus is on the list", async ({ page }) => {
    const { list, rows } = await parts(page, "default");
    for (let left = 3; left > 0; left -= 1) {
      await rows.first().locator(".hfile-list-remove").focus();
      await page.keyboard.press("Enter");
      await expect(rows).toHaveCount(left - 1);
    }
    await expect(list).toBeFocused();
  });

  test("a file that goes another way takes focus out with it", async ({ page }) => {
    const { container, list, rows } = await parts(page, "gallery");
    await rows.first().locator(".hfile-list-remove").focus();
    await container.getByRole("button", { name: "Clear all" }).evaluate((button: HTMLElement) => button.click());
    await expect(rows).toHaveCount(0);
    await expect(list).toBeFocused();
  });

  test("after a retry, focus moves to the file's remove button", async ({ page }) => {
    const { rows } = await parts(page, "upload-progress");
    await rows.nth(2).getByRole("button", { name: "Try again" }).focus();
    await page.keyboard.press("Enter");
    await expect(rows.nth(2)).toHaveAttribute("data-status", "done");
    await expect(page.locator(":focus")).toHaveAccessibleName("Remove kickoff-notes.docx");
  });

  test("a row that's going is gone from the page once it has closed", async ({ page }) => {
    const { list, rows } = await parts(page, "default");
    await rows.first().locator(".hfile-list-remove").click();
    await expect(list.locator(".hfile-list-item")).toHaveCount(2);
  });

  test("progress is named by its file, and can't change the row's height", async ({ page }) => {
    const { rows } = await parts(page, "upload-progress");
    const sending = rows.nth(1);
    const bar = sending.getByRole("progressbar");
    await expect(sending).toHaveAttribute("data-status", "uploading");
    await expect(bar).toHaveAttribute("aria-valuenow", "40");
    await expect(bar).toHaveAccessibleName("timeline.xlsx");
    await expect(bar).toHaveCSS("position", "absolute");
    const [done, moving] = await boxes(rows.first(), sending);
    expect(moving!.height).toBe(done!.height);
  });

  test("a finished file shows a check, and its bar fades", async ({ page }) => {
    const { rows } = await parts(page, "upload-progress");
    const done = rows.first();
    await expect(done).toHaveAttribute("data-status", "done");
    await expect(done.locator(".hfile-list-done")).toBeVisible();
    await expect(done.locator(".hfile-list-progress")).toHaveCSS("opacity", "0");
  });

  test("a failed file says why, and can be tried again", async ({ page }) => {
    const { rows } = await parts(page, "upload-progress");
    const failed = rows.nth(2);
    await expect(failed).toHaveAttribute("data-status", "error");
    await expect(failed.getByRole("alert")).toHaveText("That didn't upload. Check your connection.");
    await expect(failed.getByRole("progressbar")).toHaveCount(0);
    await failed.getByRole("button", { name: "Try again" }).click();
    await expect(failed).toHaveAttribute("data-status", "done");
    await expect(failed.getByRole("alert")).toHaveCount(0);
    await expect(failed.locator(".hfile-list-detail")).toHaveText("38 kB");
  });

  test("a long name ends in an ellipsis, with the whole of it in its title", async ({ page }) => {
    const { list, rows } = await parts(page, "long-file-names");
    const name = rows.first().locator(".hfile-list-name");
    await expect(name).toHaveCSS("text-overflow", "ellipsis");
    await expect(name).toHaveAttribute("title", (await name.textContent())!);
    expect(await name.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeGreaterThan(0);
    expect(await list.evaluate((n) => n.scrollWidth - n.clientWidth)).toBe(0);
  });

  test("a grid shows square previews, with the name and the button below", async ({ page }) => {
    const { list, rows } = await parts(page, "a-grid-of-thumbnails");
    const tile = rows.first();
    await settled(tile);
    const [around, whole, thumb, picture, name, detail, remove] = await boxes(
      list,
      tile,
      tile.locator(".hfile-list-thumb"),
      tile.locator("img"),
      tile.locator(".hfile-list-name"),
      tile.locator(".hfile-list-detail"),
      tile.locator(".hfile-list-remove"),
    );
    expect(around!.height).toBeCloseTo(whole!.height, 0);
    expect(thumb!.height).toBeCloseTo(thumb!.width, 0);
    expect(picture!.height).toBeCloseTo(thumb!.height, 0);
    expect(picture!.width).toBeCloseTo(thumb!.width, 0);
    expect(thumb!.y).toBeCloseTo(whole!.y + 1, 0);
    expect(name!.y - (thumb!.y + thumb!.height)).toBeCloseTo(6, 0);
    expect(whole!.y + whole!.height - (detail!.y + detail!.height)).toBeCloseTo(6 + 1, 0);
    expect(remove!.y).toBeGreaterThanOrEqual(thumb!.y + thumb!.height);
  });

  test("when a tile goes, the others slide into its place", async ({ page }) => {
    const { list, rows } = await parts(page, "a-grid-of-thumbnails");
    await page.evaluate(() => {
      const seen: number[] = [];
      (window as unknown as { slides: number[] }).slides = seen;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        const first = (keyframes as Keyframe[])[0] as Keyframe & { translate?: string };
        if (first?.translate) seen.push(parseFloat(first.translate));
        return animate.call(this, keyframes, options);
      };
    });
    await rows.first().locator(".hfile-list-remove").click();
    await expect(list.locator(".hfile-list-item")).toHaveCount(2);
    const slides = () => page.evaluate(() => (window as unknown as { slides: number[] }).slides);
    await expect.poll(slides).toHaveLength(2);
    for (const distance of await slides()) expect(distance).toBeGreaterThan(0);
  });

  test("in a narrow row, the actions keep their place on a line of their own", async ({ page }) => {
    const { list, rows } = await parts(page, "upload-progress");
    await list.evaluate((n: HTMLElement) => (n.style.inlineSize = "220px"));
    const failed = rows.nth(2);
    const [whole, text, actions] = await boxes(failed, failed.locator(".hfile-list-text"), failed.locator(".hfile-list-actions"));
    expect(actions!.y).toBeGreaterThanOrEqual(text!.y + text!.height);
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(whole!.x + whole!.width);
    expect(text!.width).toBeGreaterThan(100);
  });

  test("a tile with only a name leaves room for its button's focus ring", async ({ page }) => {
    const { rows } = await parts(page, "a-grid-of-thumbnails");
    const tile = rows.first();
    await settled(tile);
    await tile.locator(".hfile-list-detail").evaluate((n) => n.remove());
    const [whole, remove] = await boxes(tile, tile.locator(".hfile-list-remove"));
    expect(whole!.y + whole!.height - (remove!.y + remove!.height)).toBeGreaterThanOrEqual(6);
  });

  test("files chosen together are all added, and the input keeps none", async ({ page }) => {
    const { rows, input } = await parts(page, "compact-drop-area");
    await input.setInputFiles([csv("one.csv"), csv("two.csv")]);
    await expect(rows).toHaveCount(2);
    await expect(rows.first().locator(".hfile-list-name")).toHaveText("one.csv");
    expect(await input.evaluate((n: HTMLInputElement) => n.files!.length)).toBe(0);
  });

  test("files dropped together are all added, and a repeat of one is allowed", async ({ page }) => {
    const { rows, drop } = await parts(page, "compact-drop-area");
    await drag(drop, "drop", ["one.csv", "two.csv"]);
    await expect(rows).toHaveCount(2);
    await drag(drop, "drop", ["one.csv"]);
    await expect(rows).toHaveCount(3);
  });

  test("a limit counts what's there and what's coming, and says so", async ({ page }) => {
    const { rows, input, error } = await parts(page, "compact-drop-area");
    await input.setInputFiles([csv("one.csv"), csv("two.csv")]);
    await expect(rows).toHaveCount(2);
    await input.setInputFiles([csv("three.csv"), csv("four.csv")]);
    await expect(rows).toHaveCount(3);
    await expect(error).toHaveText("Add up to 3 files.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("of several, those refused say why and the others are added", async ({ page }) => {
    const { rows, input, error } = await parts(page, "gallery");
    await input.setInputFiles([png, csv("notes.csv")]);
    await expect(rows).toHaveCount(4);
    await expect(error).toHaveText("notes.csv isn't an image.");
    await expect(rows.last().locator("img")).toHaveAttribute("src", /^blob:/);
  });

  test("a new file starts uploading and finishes", async ({ page }) => {
    const { rows, input } = await parts(page, "uploading-as-files-arrive");
    await input.setInputFiles(csv());
    await expect(rows).toHaveCount(3);
    await expect(rows.last().getByRole("progressbar")).toBeAttached();
    await expect(rows.last()).toHaveAttribute("data-status", "done", { timeout: 5000 });
  });

  test("Clear all takes every file away", async ({ page }) => {
    const { container, rows } = await parts(page, "uploading-as-files-arrive");
    await container.getByRole("button", { name: "Clear all" }).click();
    await expect(rows).toHaveCount(0);
    await expect(container.locator(".hfile-list-item")).toHaveCount(0);
  });

  test("the gallery's heading counts its images", async ({ page }) => {
    const { container, rows, input } = await parts(page, "gallery");
    const heading = container.locator(".hsection-title");
    await expect(heading).toHaveText("Gallery (3)");
    await input.setInputFiles(png);
    await expect(heading).toHaveText("Gallery (4)");
    await rows.first().locator(".hfile-list-remove").click();
    await expect(heading).toHaveText("Gallery (3)");
  });

  test("a table takes files too, and can remove them", async ({ page }) => {
    const { container, input } = await parts(page, "table");
    const body = container.locator("tbody tr");
    await expect(body).toHaveCount(2);
    await input.setInputFiles(csv("plan.csv"));
    await expect(body).toHaveCount(3);
    await expect(body.last()).toContainText("plan.csv");
    await expect(body.last().locator(".htag")).toHaveText("CSV");
    await expect(body.last().locator(".htable-truncate")).toHaveAttribute("title", "plan.csv");
    await body.first().getByRole("button", { name: "Remove project-brief.pdf" }).click();
    await expect(container.locator("tbody tr")).toHaveCount(2);
  });

  test("a picture a file made is released when it goes", async ({ page }) => {
    const { rows, input } = await parts(page, "gallery");
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { revoked: string[] }).revoked = seen;
      const revoke = URL.revokeObjectURL;
      URL.revokeObjectURL = (url) => {
        seen.push(url);
        revoke.call(URL, url);
      };
    });
    await input.setInputFiles(png);
    const picture = rows.last().locator("img");
    await expect(picture).toHaveAttribute("src", /^blob:/);
    const url = await picture.getAttribute("src");
    await rows.last().locator(".hfile-list-remove").click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { revoked: string[] }).revoked)).toContain(url);
  });

  test("right to left, the progress bar grows from the right", async ({ page }) => {
    const { list, rows } = await parts(page, "upload-progress");
    await list.evaluate((n: HTMLElement) => (n.dir = "rtl"));
    const origin = await rows.nth(1).locator(".hfile-list-progress").evaluate((n) => getComputedStyle(n, "::before").transformOrigin);
    expect(parseFloat(origin)).toBeGreaterThan(0);
  });

  test("with reduced motion, the progress bar doesn't glide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { rows } = await parts(page, "upload-progress");
    const property = await rows.nth(1).locator(".hfile-list-progress").evaluate((n) => getComputedStyle(n, "::before").transitionProperty);
    expect(property).toBe("none");
  });

  test("right to left, the actions are on the left", async ({ page }) => {
    const { list, rows } = await parts(page, "default");
    await list.evaluate((n: HTMLElement) => (n.dir = "rtl"));
    const [name, remove] = await boxes(rows.first().locator(".hfile-list-name"), rows.first().locator(".hfile-list-remove"));
    expect(remove!.x + remove!.width).toBeLessThanOrEqual(name!.x);
  });

  test("with reduced motion, a row only fades as it goes", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { rows } = await parts(page, "default");
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { keys: string[] }).keys = seen;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (keyframes, options) {
        seen.push(JSON.stringify(keyframes));
        return animate.call(this, keyframes, options);
      };
    });
    await rows.first().locator(".hfile-list-remove").click();
    await expect(rows).toHaveCount(2);
    const keys = await page.evaluate(() => (window as unknown as { keys: string[] }).keys);
    expect(keys.join()).toContain("opacity");
    expect(keys.join()).not.toContain("blockSize");
  });

  test("in forced colors, the bar is drawn in the system's highlight", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Only Chromium emulates forced colors");
    const { rows } = await parts(page, "upload-progress");
    await page.emulateMedia({ forcedColors: "active" });
    const adjust = await rows.nth(1).locator(".hfile-list-progress").evaluate((n) => getComputedStyle(n, "::before").forcedColorAdjust);
    expect(adjust).toBe("none");
  });
});
