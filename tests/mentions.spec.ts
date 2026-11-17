import { expect } from "@playwright/test";
import { example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/mentions.md says: typing the trigger and a few
// letters lists the options that have them, the first highlighted and named
// by the field's aria-activedescendant; the arrow keys move through them
// while the list is open, and the caret otherwise; Enter or Tab puts the
// trigger, the value, and a space in the text, the caret after it; Escape
// closes the list until the text changes, and in an Input ↓ opens it again;
// with the trigger at the start only, a slash elsewhere opens nothing;
// nothing is ever marked chosen.
onEachPlayground("mentions", () => {
  test("@ and letters list who has them, the first highlighted; Enter puts the handle in, with a space, the caret after it", async ({ page }) => {
    const container = await example(page, "mentions-default");
    const field = container.getByRole("textbox", { name: "Internal note" });
    const list = page.locator(".hpopup:popover-open").getByRole("listbox", { name: "People" });
    await field.pressSequentially("Ask ");
    await expect(list).toHaveCount(0);
    await field.pressSequentially("@a");
    await expect(list.getByRole("option")).toHaveText(["Sam Rivera @sam", "Ana Lopez @ana", "Maya Chen @maya"]);
    await field.pressSequentially("n");
    await expect(list.getByRole("option")).toHaveText(["Ana Lopez @ana"]);
    await expect(field).toHaveAttribute("aria-activedescendant", (await list.getByRole("option").first().getAttribute("id"))!);
    await field.press("Enter");
    await expect(list).toHaveCount(0);
    await expect(field).toHaveValue("Ask @ana ");
    await expect(field).toBeFocused();
    expect(await field.evaluate((node: HTMLTextAreaElement) => node.selectionStart)).toBe(9);
    await expect(container.locator('.hoption[aria-selected="true"]')).toHaveCount(0);
  });

  test("the arrows move through the list while it's open, and the caret while it's closed; Tab chooses; Escape closes it", async ({ page }) => {
    const container = await example(page, "mentions-default");
    const field = container.getByRole("textbox", { name: "Internal note" });
    const list = page.locator(".hpopup:popover-open").getByRole("listbox", { name: "People" });
    await field.pressSequentially("@");
    await field.press("ArrowDown");
    await expect(field).toHaveAttribute("aria-activedescendant", (await list.getByRole("option").nth(1).getAttribute("id"))!);
    await field.press("Tab");
    await expect(field).toHaveValue("@ana ");
    await expect(field).toBeFocused();

    await field.pressSequentially("@m");
    await field.press("Escape");
    await expect(list).toHaveCount(0);
    await expect(field).toHaveValue("@ana @m");
    await field.press("ArrowLeft");
    await expect(list).toHaveCount(0);
    expect(await field.evaluate((node: HTMLTextAreaElement) => node.selectionStart)).toBe(6);
    await field.press("End");
    await field.pressSequentially("a");
    await expect(list.getByRole("option")).toHaveText(["Maya Chen @maya"]);
    await list.getByRole("option").click();
    await expect(field).toHaveValue("@ana @maya ");
    await expect(field).toBeFocused();
  });

  test("in an Input, ↓ opens the list again after Escape closed it, and Enter puts the handle in", async ({ page }) => {
    const container = await example(page, "mentions-one-line");
    const field = container.getByRole("textbox", { name: "Task" });
    const list = page.locator(".hpopup:popover-open").getByRole("listbox", { name: "People" });
    await expect(field).toHaveJSProperty("localName", "input");
    await field.pressSequentially("Call @ma");
    await expect(list.getByRole("option")).toHaveText(["Maya Chen @maya"]);
    await field.press("Escape");
    await expect(list).toHaveCount(0);
    await field.press("ArrowDown");
    await expect(list.getByRole("option")).toHaveText(["Maya Chen @maya"]);
    await expect(field).toHaveAttribute("aria-activedescendant", (await list.getByRole("option").first().getAttribute("id"))!);
    await field.press("Enter");
    await expect(field).toHaveValue("Call @maya ");
    await expect(list).toHaveCount(0);
  });

  test("with the trigger at the start only, a slash elsewhere opens nothing", async ({ page }) => {
    const container = await example(page, "mentions-commands");
    const field = container.getByRole("textbox", { name: "Message" });
    const list = page.locator(".hpopup:popover-open").getByRole("listbox", { name: "Commands" });
    await field.pressSequentially("and/or ");
    await expect(list).toHaveCount(0);
    await field.fill("");
    await field.pressSequentially("/d");
    await expect(list.getByRole("option")).toHaveText(["/draft Draft a reply"]);
    await field.press("Enter");
    await expect(field).toHaveValue("/draft ");
  });

  test("a command list opens over the field", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "mentions-commands");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.pressSequentially("/");
    const popup = page.locator(".hpopup:popover-open");
    await settled(popup);
    const [area, list] = await Promise.all([field.boundingBox(), popup.boundingBox()]);
    expect(list!.y + list!.height, `list ${JSON.stringify(list)}, field ${JSON.stringify(area)}`).toBeLessThanOrEqual(area!.y);
  });

  test("moving the caret off what was typed closes the list; back on it, a choice goes where the caret is", async ({ page }) => {
    const container = await example(page, "mentions-default");
    const field = container.getByRole("textbox", { name: "Internal note" });
    const list = page.locator(".hpopup:popover-open").getByRole("listbox", { name: "People" });
    await field.pressSequentially("Hello @sa");
    await expect(list.getByRole("option")).toHaveText(["Sam Rivera @sam"]);
    await field.click({ position: { x: 8, y: 8 } });
    await expect(list).toHaveCount(0);
    await field.press("End");
    await expect(list.getByRole("option")).toHaveText(["Sam Rivera @sam"]);
    await field.press("Enter");
    await expect(field).toHaveValue("Hello @sam ");
  });
});
