import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/composer.md says: Send can't be pressed until
// something's written or attached; Enter sends, Shift+Enter starts a new
// line; Send turns into Stop while a reply comes, which stops it; files
// picked are listed above the field and go with the message; Enter picks a
// command while the list is open; ↑ in the empty field edits your last
// message, Escape cancels, and sending puts the new words in its place.
onEachPlayground("composer", () => {
  test("Enter sends, Shift+Enter starts a new line; Send can't be pressed with nothing written", async ({ page }) => {
    const container = await example(page, "composer-default");
    const field = container.getByRole("textbox", { name: "Message" });
    const send = container.getByRole("button", { name: "Send" });
    await expect(send).toBeDisabled();
    await field.pressSequentially("Hello");
    await expect(send).toBeEnabled();
    await field.press("Shift+Enter");
    await field.pressSequentially("there");
    await expect(field).toHaveValue("Hello\nthere");
    await field.press("Enter");
    await expect(field).toHaveValue("");
    await expect(container.locator('.hmessage[data-from="user"]')).toHaveText("Hello\nthere");
    await expect(field).toBeFocused();
  });

  test("Send turns into Stop while a reply comes, and Stop stops it", async ({ page }) => {
    await page.clock.install();
    await page.reload();
    const container = await example(page, "composer-default");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.fill("Hello");
    await field.press("Enter");
    const stop = container.getByRole("button", { name: "Stop" });
    await expect(stop).toBeEnabled();
    await expect(stop).toHaveAttribute("data-stopping", "");
    await stop.click();
    await expect(container.getByRole("button", { name: "Send" })).toBeDisabled();
    await page.clock.runFor(2000);
    await expect(container.locator(".hmessage")).toHaveCount(1);

    await field.fill("Again");
    await field.press("Enter");
    await page.clock.runFor(2000);
    await expect(container.locator('.hmessage[data-from="assistant"]')).toHaveText(`On it: "Again".`);
    await expect(container.getByRole("button", { name: "Send" })).toBeVisible();
  });

  test("files picked are listed above the field, and go with the message", async ({ page }) => {
    const container = await example(page, "composer-default");
    const attachments = container.locator(".hcomposer-box > .hfile-list");
    await expect(attachments).toBeHidden();
    const chooser = page.waitForEvent("filechooser");
    await container.getByRole("button", { name: "Attach files" }).click();
    await (await chooser).setFiles({ name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("receipt") });
    await expect(attachments.getByText("receipt.pdf")).toBeVisible();
    await expect(container.getByRole("button", { name: "Send" })).toBeEnabled();
    await container.getByRole("button", { name: "Send" }).click();
    await expect(attachments).toBeHidden();
    await expect(container.locator('.hmessage[data-from="user"]').getByText("receipt.pdf")).toBeVisible();
    await expect(container.locator('.hmessage[data-from="user"]').getByRole("button")).toHaveCount(0);
  });

  test("Enter picks a command while the list is open, and sends once it's closed", async ({ page }) => {
    const container = await example(page, "composer-commands");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.pressSequentially("/su");
    await expect(page.locator(".hpopup:popover-open").getByRole("option")).toHaveText(["/summarize Summarize this ticket"]);
    await field.press("Enter");
    await expect(field).toHaveValue("/summarize ");
    await expect(container.locator(".hmessage")).toHaveCount(0);
    await field.press("Enter");
    await expect(container.locator('.hmessage[data-from="user"]')).toHaveText("/summarize");
  });

  test("with a second trigger, Enter picks a teammate from its list rather than sending, and the sent text is drawn again", async ({ page }) => {
    const container = await example(page, "composer-commands");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.pressSequentially("Ask @sa");
    await expect(page.locator(".hpopup:popover-open").getByRole("listbox")).toHaveAccessibleName("Teammates");
    await field.press("Enter");
    await expect(field).toHaveValue("Ask @sam ");
    await expect(container.locator(".hmessage")).toHaveCount(0);
    await expect(container.locator(".htextarea-highlight-backdrop mark")).toHaveText(["@sam"]);
    await field.press("Enter");
    await expect(container.locator('.hmessage[data-from="user"]')).toHaveText("Ask @sam");
    // Sent, the field is empty, and so is the text drawn over it.
    await expect(field).toHaveValue("");
    await expect(container.locator(".htextarea-highlight-backdrop")).toHaveText("");
  });

  test("↑ in the empty field edits your last message; Escape cancels; sending replaces it", async ({ page }) => {
    const container = await example(page, "composer-editing");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.focus();
    await field.press("ArrowUp");
    await expect(container.locator(".hcomposer-editing-quote")).toHaveText("Where's my order?");
    await expect(field).toHaveValue("Where's my order?");
    await expect(field).toHaveAccessibleDescription("Editing your message Where's my order?");
    expect(await field.evaluate((node: HTMLTextAreaElement) => node.selectionStart)).toBe(17);
    await field.press("Escape");
    await expect(container.locator(".hcomposer-editing")).toHaveCount(0);
    await expect(field).toHaveValue("");

    await field.press("ArrowUp");
    await field.fill("Where's order #4821?");
    await field.press("Enter");
    await expect(container.locator('.hmessage[data-from="user"]')).toHaveText("Where's order #4821?");
    await expect(container.locator(".hcomposer-editing")).toHaveCount(0);
    await expect(container.locator(".hmessage")).toHaveCount(2);
  });

  test("the field grows with what's written", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "composer-default");
    const field = container.getByRole("textbox", { name: "Message" });
    const one = (await field.boundingBox())!.height;
    await field.fill("One\nTwo\nThree");
    expect((await field.boundingBox())!.height).toBeGreaterThan(one + 30);
  });

  test("an Enter that ends an input method's text doesn't send, though Safari marks it only with keyCode 229", async ({ page }) => {
    const container = await example(page, "composer-default");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.fill("こんにちは");
    await field.evaluate((node) =>
      node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true })),
    );
    await expect(field).toHaveValue("こんにちは");
    await expect(container.locator(".hmessage")).toHaveCount(0);
  });

  test("sending with the Send button puts focus back in the field", async ({ page }) => {
    const container = await example(page, "composer-commands");
    const field = container.getByRole("textbox", { name: "Message" });
    await field.fill("Is this a refund?");
    await container.getByRole("button", { name: "Send" }).click();
    await expect(container.locator('.hmessage[data-from="user"]')).toHaveText("Is this a refund?");
    await expect(field).toBeFocused();
  });
});
