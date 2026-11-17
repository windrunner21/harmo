import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/drop-zone.md says: while files are dragged over the
// area, a frame covers it, counted in and out, so moving over what's inside
// doesn't hide it; dropping them hands them over, here to its File List;
// dragging anything else does nothing. The frame's look is CSS's, tested on
// the HTML playground.
const drag = (zone: Locator, type: string, files = true) =>
  zone.evaluate(
    (node, { type, files }) => {
      const data = new DataTransfer();
      if (files) data.items.add(new File(["notes"], "notes.txt", { type: "text/plain" }));
      else data.setData("text/plain", "words");
      const target = type === "dragleave-inner" ? node.querySelector("p")! : node;
      target.dispatchEvent(new DragEvent(type.replace("-inner", ""), { bubbles: true, cancelable: true, dataTransfer: data }));
    },
    { type, files },
  );

onEachPlayground("drop-zone", () => {
  test("files dragged over show the frame, until they leave; dropped, they're added", async ({ page }) => {
    const zone = (await example(page, "drop-zone-default")).locator(".hdrop-zone");
    const frame = zone.locator(".hdrop-zone-overlay");
    await expect(frame).toBeHidden();
    await drag(zone, "dragenter");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveText("Drop files to share them");
    // Over what's inside: in and out again, still over the area.
    await drag(zone, "dragenter");
    await drag(zone, "dragleave-inner");
    await expect(frame).toBeVisible();
    await drag(zone, "dragleave");
    await expect(frame).toBeHidden();

    await drag(zone, "dragenter");
    await drag(zone, "drop");
    await expect(frame).toBeHidden();
    await expect(zone.locator(".hfile-list-name")).toHaveText(["project-brief.pdf", "notes.txt"]);
  });

  test("dragging anything but files does nothing", async ({ page }) => {
    const zone = (await example(page, "drop-zone-default")).locator(".hdrop-zone");
    await drag(zone, "dragenter", false);
    await expect(zone.locator(".hdrop-zone-overlay")).toBeHidden();
  });

  test("the frame covers the area to its edges and corners: dashed, in the accent", { tag: "@css" }, async ({ page }) => {
    const zone = (await example(page, "drop-zone-default")).locator(".hdrop-zone");
    await drag(zone, "dragenter");
    const frame = zone.locator(".hdrop-zone-overlay");
    const [area, covered] = await Promise.all([zone.boundingBox(), frame.boundingBox()]);
    expect(covered).toEqual(area);
    await expect(frame).toHaveCSS("border-top-style", "dashed");
    await expect(frame).toHaveCSS("border-top-width", "2px");
    await expect(frame).toHaveCSS("border-radius", "8px");
    await expect(frame).toHaveCSS("pointer-events", "none");
    await expect(frame).toHaveAttribute("aria-hidden", "true");
  });

  test("Add files does what a drop does, from the keyboard", async ({ page }) => {
    const zone = (await example(page, "drop-zone-default")).locator(".hdrop-zone");
    const chooser = page.waitForEvent("filechooser");
    await zone.getByRole("button", { name: "Add files" }).press("Enter");
    await (await chooser).setFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("notes") });
    await expect(zone.locator(".hfile-list-name")).toHaveText(["project-brief.pdf", "notes.txt"]);
  });
});
