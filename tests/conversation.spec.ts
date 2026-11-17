import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

const fromEnd = (conversation: Locator) =>
  conversation.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight);

// What docs/components/conversation.md says: it opens at the latest and
// stays there as messages come; scrolled up, it stays put, with Jump to
// latest, which brings it back; a message of yours brings it back however
// far up; the status says the reply; before the first message, what you
// gave it shows instead of the list.
onEachPlayground("conversation", () => {
  test("it opens at the latest, and stays there as a reply comes", async ({ page }) => {
    const container = await example(page, "conversation-default");
    const conversation = container.getByRole("region", { name: "Conversation" });
    expect(await fromEnd(conversation)).toBeLessThan(1);
    await container.getByRole("textbox", { name: "Message" }).fill("Thanks");
    await container.getByRole("button", { name: "Send" }).click();
    await expect(conversation.locator(".hmessage").last()).toHaveText(`On it: "Thanks".`);
    await expect(conversation.locator(".hconversation-status")).toHaveText(`On it: "Thanks".`);
    expect(await fromEnd(conversation)).toBeLessThan(1);
  });

  test("scrolled up, it stays put, with Jump to latest; sending brings it back", async ({ page }) => {
    const container = await example(page, "conversation-default");
    const conversation = container.getByRole("region", { name: "Conversation" });
    const latest = container.getByRole("button", { name: "Jump to latest" });
    await expect(latest).toBeHidden();
    await conversation.evaluate((node) => node.scrollTo({ top: 0 }));
    await expect(latest).toBeVisible();
    await latest.click();
    await expect.poll(() => fromEnd(conversation)).toBeLessThan(1);
    await expect(latest).toBeHidden();
    await expect(container.getByRole("textbox", { name: "Message" })).toBeFocused();

    await conversation.evaluate((node) => node.scrollTo({ top: 0 }));
    await expect(latest).toBeVisible();
    await container.getByRole("textbox", { name: "Message" }).fill("Thanks");
    await container.getByRole("button", { name: "Send" }).click();
    await expect.poll(() => fromEnd(conversation)).toBeLessThan(1);
    await expect(latest).toBeHidden();
  });

  test("before the first message, what you gave it shows; the first takes its place", async ({ page }) => {
    const container = await example(page, "conversation-before-the-first-message");
    const conversation = container.getByRole("region", { name: "Conversation" });
    await expect(conversation.getByText("No messages yet")).toBeVisible();
    await expect(conversation.getByRole("list")).toBeHidden();
    await container.getByRole("textbox", { name: "Message" }).fill("Hi");
    await container.getByRole("button", { name: "Send" }).click();
    await expect(conversation.getByText("No messages yet")).toHaveCount(0);
    await expect(conversation.getByRole("listitem")).toHaveText(["Hi"]);
  });

  test("gathered at the foot, a short conversation ends at its padding, nearest the field", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "conversation-gathered-at-the-foot");
    const conversation = await container.getByRole("region", { name: "Conversation" }).boundingBox();
    const list = await container.getByRole("list").boundingBox();
    expect(Math.round(conversation!.y + conversation!.height - (list!.y + list!.height))).toBe(16);
  });

  test("Jump to latest follows a reply that grows on the way", async ({ page }) => {
    const container = await example(page, "conversation-default");
    const conversation = container.getByRole("region", { name: "Conversation" });
    const latest = container.getByRole("button", { name: "Jump to latest" });
    await conversation.evaluate((node) => node.scrollTo({ top: 0 }));
    await expect(latest).toBeVisible();
    await latest.click();
    await conversation.evaluate((node) => {
      const reply = node.querySelector(".hmessage:last-child .hmessage-text")!;
      reply.append(document.createElement("br"), "And more, ".repeat(150));
    });
    await expect.poll(() => fromEnd(conversation)).toBeLessThan(2);
    await expect(latest).toBeHidden();
  });
});
