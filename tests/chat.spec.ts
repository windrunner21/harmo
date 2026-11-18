import { expect, type Page } from "@playwright/test";
import { example, onEachPlayground, ready, settled, test } from "./playgrounds.ts";

// What docs/patterns/chat.md says, on the Chat page: Enter sends and
// Shift+Enter starts a new line; a slash lists the commands, which the arrow
// keys, Enter, Tab, and Escape work, with the field naming the highlighted
// one; Attach files lists up to five files of 10 MB each, which go with the
// message, uploading first where the chat uploads; your message shows at
// once, in place of the greeting, then three dots until the reply comes,
// whole or streamed a piece at a time, fading in once; while one's on its
// way nothing else sends, and the send button turns into Stop, which ends
// it, keeping what came; a reply that doesn't come marks your message "Not
// sent", with Try again, which sends it again at the end; a finished reply
// gets Copy, and Try again on the last in an AI chat, or Insert in a
// copilot; quick replies send their words; someone new joining says so and
// takes the header; Jump to latest shows once you've scrolled up; a status
// tells screen readers each whole reply. The support window opens and
// closes with its launcher, its close button, and Escape, moving focus. The
// stand-ins answer after a moment, so the page runs on a paused clock, and
// replies come only as a test moves time on. The layout is CSS's, tested on
// the HTML playground.

// Reloads the page with its clock paused.
const pausedClock = async (page: Page) => {
  await page.clock.install();
  await page.reload();
  await ready(page);
  await page.clock.pauseAt(Date.now() + 1000);
};

// Records what's copied.
const stubClipboard = (page: Page) =>
  page.evaluate(() => {
    const recorded = window as unknown as { copied: string[] };
    recorded.copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => void recorded.copied.push(text) },
    });
  });

const chatIn = async (page: Page, id: string) => {
  await pausedClock(page);
  const container = await example(page, id);
  const chat = container.locator(".hchat");
  return {
    container,
    chat,
    field: chat.getByRole("textbox", { name: "Message" }),
    send: chat.getByRole("button", { name: "Send", exact: true }),
    stop: chat.getByRole("button", { name: "Stop" }),
    // The messages, without the dots that stand for one on its way.
    messages: chat.locator('.hconversation-list > .hmessage:not([aria-hidden], [data-from="system"])'),
    typing: chat.locator(".hmessage-typing"),
    status: chat.locator(".hconversation-status"),
  };
};

// Long enough for any of the stand-ins' replies to come in whole.
const whole = 10_000;

onEachPlayground("chat", () => {
  test("a prompt sends its words in place of the greeting; three dots show, then the reply streams in, and the status reads it once it's whole", async ({ page }) => {
    const { chat, field, messages, typing, status } = await chatIn(page, "chat-ai-chat");
    await expect(chat.locator(".hchat-greeting")).toBeVisible();
    await chat.getByRole("button", { name: "Draft a welcome message" }).click();
    await expect(chat.locator(".hchat-greeting")).toBeHidden();
    await expect(messages).toHaveCount(1);
    await expect(messages.first()).toHaveAttribute("data-from", "user");
    await expect(messages.first().locator(".hmessage-text")).toHaveText("Draft a welcome message");
    await expect(typing).toBeVisible();
    await expect(field).toBeFocused();

    // 700ms to think, then a word every 30ms: three words by 800ms.
    await page.clock.runFor(800);
    await expect(typing).toHaveCount(0);
    const reply = messages.nth(1).locator(".hmessage-text");
    await expect(messages.nth(1)).toHaveAttribute("data-from", "assistant");
    await expect(reply).toHaveAttribute("aria-busy", "true");
    await expect(reply).toHaveText("Here's a welcome");
    await expect(status).toHaveText("");

    await page.clock.runFor(whole);
    await expect(reply).not.toHaveAttribute("aria-busy");
    await expect(reply.locator("p")).toHaveText([
      "Here's a welcome message you could send to new customers:",
      "Hi, and welcome! We're glad you're here. If you ever have a question, reply to this message, and someone from our team will answer within a day.",
      "Want it shorter, or in a different tone?",
    ]);
    expect(await status.textContent()).toBe(
      "Here's a welcome message you could send to new customers:\n\nHi, and welcome! We're glad you're here. If you ever have a question, reply to this message, and someone from our team will answer within a day.\n\nWant it shorter, or in a different tone?",
    );
    await expect(messages.nth(1).getByRole("button", { name: "Copy" })).toBeVisible();
    await expect(messages.nth(1).getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("Enter sends, Shift+Enter starts a new line, and nothing else sends while a reply is on its way", async ({ page }) => {
    const { field, send, stop, messages } = await chatIn(page, "chat-ai-chat");
    await expect(send).toBeDisabled();
    await field.fill("   ");
    await expect(send).toBeDisabled();
    await field.fill("Ideas for a holiday");
    await expect(send).toBeEnabled();
    await field.press("Shift+Enter");
    await field.pressSequentially("campaign");
    await field.press("Enter");
    await expect(messages).toHaveCount(1);
    expect(await messages.first().locator(".hmessage-text").textContent()).toBe("Ideas for a holiday\ncampaign");
    await expect(field).toHaveValue("");

    // Stop takes the send button's place.
    await expect(stop).toBeVisible();
    await expect(send).toBeHidden();
    await field.fill("Another");
    await field.press("Enter");
    await expect(messages).toHaveCount(1);
    await expect(field).toHaveValue("Another");

    await page.clock.runFor(whole);
    await expect(send).toBeVisible();
    await expect(stop).toBeHidden();
    await field.press("Enter");
    await expect(messages).toHaveCount(3);
  });

  test("Stop ends a reply early, keeping what came, with its actions", async ({ page }) => {
    const { chat, field, send, stop, messages, status } = await chatIn(page, "chat-ai-chat");
    await chat.getByRole("button", { name: "Ideas for a holiday campaign" }).click();
    await page.clock.runFor(800);
    const reply = messages.nth(1);
    const sofar = await reply.locator(".hmessage-text").textContent();
    await stop.click();
    await page.clock.runFor(whole);
    expect(await reply.locator(".hmessage-text").textContent()).toBe(sofar);
    await expect(reply.locator(".hmessage-text")).not.toHaveAttribute("aria-busy");
    await expect(reply.getByRole("button", { name: "Copy" })).toBeVisible();
    await expect(status).toHaveText("Stopped.");
    await expect(send).toBeVisible();
    await expect(field).toBeFocused();
  });

  test("a reply that doesn't come marks the message Not sent; Try again sends it again, at the end", async ({ page }) => {
    const { field, messages, typing, status } = await chatIn(page, "chat-ai-chat");
    await field.fill("This one will fail");
    await field.press("Enter");
    await page.clock.runFor(1000);
    const failed = messages.first();
    await expect(failed.locator(".hmessage-failed")).toHaveText("Not sent. Try again");
    await expect(status).toHaveText("Your message didn't send.");
    await expect(typing).toHaveCount(0);

    await field.fill("welcome");
    await field.press("Enter");
    await page.clock.runFor(whole);
    await expect(messages).toHaveCount(3);

    await failed.getByRole("button", { name: "Try again" }).click();
    await expect(messages).toHaveCount(3);
    await expect(messages.last()).toHaveAttribute("data-from", "user");
    await expect(messages.last().locator(".hmessage-text")).toHaveText("This one will fail");
    await expect(messages.last().locator(".hmessage-failed")).toHaveCount(0);
    await expect(typing).toBeVisible();
  });

  test("Try again under the last reply asks for it again, in its place; only the last has it", async ({ page }) => {
    const { chat, field, messages, typing } = await chatIn(page, "chat-ai-chat");
    await chat.getByRole("button", { name: "Ideas for a holiday campaign" }).click();
    await page.clock.runFor(whole);
    const first = await messages.nth(1).locator(".hmessage-text").textContent();
    await messages.nth(1).getByRole("button", { name: "Try again" }).click();
    await expect(messages).toHaveCount(1);
    await expect(typing).toBeVisible();
    await page.clock.runFor(whole);
    await expect(messages).toHaveCount(2);
    expect(await messages.nth(1).locator(".hmessage-text").textContent()).toBe(first);

    await field.fill("welcome");
    await field.press("Enter");
    await page.clock.runFor(whole);
    await expect(messages.nth(1).getByRole("button", { name: "Try again" })).toBeHidden();
    await expect(messages.nth(3).getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("Copy copies the reply", async ({ page }) => {
    const { chat, messages } = await chatIn(page, "chat-ai-chat");
    await stubClipboard(page);
    await chat.getByRole("button", { name: "Summarize last week's conversations" }).click();
    await page.clock.runFor(whole);
    await messages.nth(1).getByRole("button", { name: "Copy" }).click();
    // The reply as it was written, its marks and all.
    const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatch(/^Last week you had \*\*1,284 conversations\*\*, .*\n\n• Most were about delivery times/s);
  });

  test("Jump to latest shows once you've scrolled up, and goes back to the latest message", async ({ page }) => {
    const { chat, field } = await chatIn(page, "chat-ai-chat");
    const conversation = chat.locator(".hconversation");
    const jump = chat.getByRole("button", { name: "Jump to latest" });
    for (const words of ["welcome", "summarize", "holiday"]) {
      await field.fill(words);
      await field.press("Enter");
      await page.clock.runFor(whole);
    }
    const fromEnd = () => conversation.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight);
    // It kept to the latest message as the replies came in.
    expect(await fromEnd()).toBeLessThan(2);
    await expect(jump).toBeHidden();

    await conversation.evaluate((node) => node.scrollTo(0, 0));
    await expect(jump).toBeVisible();
    // Where it's drawn, as a person would: Playwright would first scroll it
    // into view, which, for a button pinned to the foot of what scrolls,
    // scrolls the conversation, and in Firefox lands the click on a message.
    // By its box, as the page's clock is paused, so no frame comes to wait
    // for.
    const box = (await jump.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(fromEnd).toBeLessThan(2);
    await expect(jump).toBeHidden();
    await expect(field).toBeFocused();
  });

  test("a copilot shows what it knows about, and Insert puts a reply into the ticket's field", async ({ page }) => {
    const { container, chat } = await chatIn(page, "chat-copilot");
    await expect(chat.locator(".hcomposer-context")).toHaveText("Ticket #1042");
    await chat.getByRole("button", { name: "Draft a reply" }).click();
    await page.clock.runFor(whole);
    await chat.getByRole("button", { name: "Insert" }).click();
    const reply = container.getByRole("textbox", { name: "Reply" });
    await expect(reply).toHaveValue(/^Hi Maya, I'm sorry your mug arrived damaged\./);
    await expect(reply).toBeFocused();
  });

  test("New chat starts the copilot over; its close button hides it, and the ticket's button brings it back", async ({ page }) => {
    const { container, chat, field, messages } = await chatIn(page, "chat-copilot");
    const newChat = chat.getByRole("button", { name: "New chat" });
    await expect(newChat).toBeDisabled();
    await chat.getByRole("button", { name: "Summarize this ticket" }).click();
    await expect(newChat).toBeEnabled();
    await page.clock.runFor(whole);
    await newChat.click();
    await expect(messages).toHaveCount(0);
    await expect(chat.locator(".hchat-greeting")).toBeVisible();
    await expect(newChat).toBeDisabled();
    await expect(field).toBeFocused();

    await field.fill("Summarize it");
    await field.press("Enter");
    await chat.getByRole("button", { name: "Close" }).click();
    await expect(chat).toBeHidden();
    const opener = container.getByRole("button", { name: "Open Copilot" });
    await expect(opener).toBeFocused();
    await opener.click();
    await expect(chat).toBeVisible();
    await expect(opener).toBeHidden();
    await expect(field).toBeFocused();
    // The conversation is where it was left.
    await expect(messages.first().locator(".hmessage-text")).toHaveText("Summarize it");
  });

  test("the launcher opens and closes the support window, as its close button and Escape do, moving focus", async ({ page }) => {
    const { container, chat, field } = await chatIn(page, "chat-support-chat");
    const launcher = container.locator(".hlauncher-button");
    const panel = container.getByRole("dialog", { name: "Chat with Speedwagon" });
    await expect(panel).toBeVisible();
    await expect(launcher).toHaveAccessibleName("Chat with Speedwagon");
    await expect(launcher).toHaveAttribute("aria-expanded", "true");

    await launcher.click();
    await expect(chat).toBeHidden();
    await expect(launcher).toHaveAttribute("aria-expanded", "false");
    await expect(launcher).toBeFocused();

    await launcher.click();
    await expect(chat).toBeVisible();
    await expect(field).toBeFocused();
    await field.press("Escape");
    await expect(chat).toBeHidden();
    await expect(launcher).toBeFocused();

    await launcher.click();
    await chat.getByRole("button", { name: "Close" }).click();
    await expect(chat).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test("quick replies send their words and go once another message is sent; asking for a person hands the conversation to Imran", async ({ page }) => {
    const { chat, messages, status } = await chatIn(page, "chat-support-chat");
    const quickReplies = chat.getByRole("group", { name: "Suggested replies" });
    await expect(quickReplies.getByRole("button")).toHaveText(["Where's my order?", "Start a return", "Talk to a person"]);
    await quickReplies.getByRole("button", { name: "Where's my order?" }).click();
    await expect(quickReplies).toHaveCount(0);
    await expect(messages.last().locator(".hmessage-text")).toHaveText("Where's my order?");
    await page.clock.runFor(1000);
    await expect(messages.last()).toContainText("Order #58213 left our warehouse yesterday");
    await expect(quickReplies.getByRole("button")).toHaveText(["Start a return", "Talk to a person"]);

    await quickReplies.getByRole("button", { name: "Talk to a person" }).click();
    await page.clock.runFor(1000);
    await expect(chat.locator('.hmessage[data-from="system"]')).toHaveText("Imran joined the conversation");
    await expect(chat.locator(".hchat-header .hchat-title")).toHaveText("Imran");
    await expect(chat.locator(".hchat-header .hchat-subtitle")).toHaveText("Support team");
    await expect(chat.locator(".hchat-header img.havatar")).toHaveAttribute("src", /imran\.webp$/);
    await expect(messages.last().locator("img.havatar")).toHaveAttribute("src", /imran\.webp$/);
    await expect(status).toHaveText(
      "Imran joined the conversation. Imran: Hi, I'm Imran from the support team. I've read your conversation so far. How can I help?",
    );
  });

  test("a slash at the start lists the commands that have what follows it; the arrow keys, Enter, Tab, and Escape work them, focus staying in the field", async ({ page }) => {
    const { chat, field } = await chatIn(page, "chat-ai-chat");
    const commands = page.locator(".hmentions > .hpopup:popover-open").getByRole("option");
    await field.pressSequentially("/");
    await expect(commands).toHaveText([
      "/welcome Draft a welcome message",
      "/summarize Summarize last week's conversations",
      "/embed Show the code to embed the chat",
      "/campaign Ideas for a holiday campaign",
    ]);
    await expect(field).toHaveAttribute("aria-activedescendant", (await commands.first().getAttribute("id"))!);
    await field.press("ArrowDown");
    await expect(field).toHaveAttribute("aria-activedescendant", (await commands.nth(1).getAttribute("id"))!);
    await expect(commands.nth(1)).toHaveAttribute("data-active", "");
    await field.press("ArrowDown");
    await field.press("ArrowDown");
    await expect(commands.nth(3)).toHaveAttribute("data-active", "");
    await expect(chat.locator('.hoption[aria-selected="true"]')).toHaveCount(0);
    await field.press("Enter");
    await expect(field).toHaveValue("/campaign ");
    await expect(commands).toHaveCount(0);
    await expect(field).not.toHaveAttribute("aria-activedescendant");
    await expect(field).toBeFocused();
    await expect(chat.locator(".hconversation-list > .hmessage")).toHaveCount(0);

    await field.fill("/su");
    await expect(commands).toHaveText(["/summarize Summarize last week's conversations"]);
    await field.press("Tab");
    await expect(field).toHaveValue("/summarize ");
    await field.fill("/w");
    await field.press("Escape");
    await expect(commands).toHaveCount(0);
    await expect(field).toHaveValue("/w");
    await field.fill("/x");
    await expect(commands).toHaveCount(0);
    await field.fill("/");
    await commands.nth(1).click();
    await expect(field).toHaveValue("/summarize ");
    await expect(field).toBeFocused();
  });

  test("files attached go with the message, above its text, and the reply knows of them; one too large, or a sixth, is turned down", async ({ page }) => {
    const { chat, field, send, messages } = await chatIn(page, "chat-ai-chat");
    const attached = chat.locator(".hcomposer-box > .hfile-list");
    const picker = chat.locator('input[type="file"]');
    await expect(attached).toBeHidden();
    await picker.setInputFiles([
      { name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.from("brief") },
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("notes") },
    ]);
    await expect(attached.locator(".hfile-list-name")).toHaveText(["brief.pdf", "notes.txt"]);
    await expect(send).toBeEnabled();
    await attached.getByRole("button", { name: "Remove notes.txt" }).click();
    await expect(attached.locator(".hfile-list-item:not([data-leaving])")).toHaveCount(1);

    await picker.setInputFiles([{ name: "huge.mov", mimeType: "video/quicktime", buffer: Buffer.alloc(10_000_001) }]);
    await expect(chat.locator(".hcomposer > .herror")).toHaveText("huge.mov is over 10 MB.");
    await picker.setInputFiles(
      ["a", "b", "c", "d", "e"].map((name) => ({ name: `${name}.txt`, mimeType: "text/plain", buffer: Buffer.from(name) })),
    );
    await expect(chat.locator(".hcomposer > .herror")).toHaveText("Attach up to 5 files.");
    await expect(attached.locator(".hfile-list-item:not([data-leaving])")).toHaveCount(5);

    await field.press("Enter");
    await expect(attached).toBeHidden();
    const sent = messages.first();
    await expect(sent.getByRole("list", { name: "Attachments" }).locator(".hfile-list-name")).toHaveText(["brief.pdf", "a.txt", "b.txt", "c.txt", "d.txt"]);
    await expect(sent.locator(".hmessage-text")).toHaveCount(0);
    await expect(sent.getByRole("button")).toHaveCount(0);
    await page.clock.runFor(whole);
    await expect(messages.nth(1)).toContainText("Your 5 files came with your message.");
  });

  test("where the chat uploads, each file uploads as it's added; one that fails can be tried again, and sending waits for them", async ({ page }) => {
    const { chat, field, messages } = await chatIn(page, "chat-support-chat");
    const attached = chat.locator(".hcomposer-box > .hfile-list");
    await chat.locator('input[type="file"]').setInputFiles([
      { name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("receipt") },
      { name: "fail.png", mimeType: "image/png", buffer: Buffer.from("fail") },
    ]);
    const [receipt, failing] = [attached.locator(".hfile-list-item").first(), attached.locator(".hfile-list-item").nth(1)];
    await expect(receipt).toHaveAttribute("data-status", "uploading");
    await page.clock.runFor(1500);
    await expect(receipt).toHaveAttribute("data-status", "done");
    await expect(failing).toHaveAttribute("data-status", "error");
    await expect(failing.locator(".hfile-list-error")).toHaveText("That didn't upload. Check your connection.");

    await field.press("Enter");
    await expect(chat.locator(".hcomposer > .herror")).toHaveText("Some files didn't upload. Try them again, or remove them.");
    await expect(messages).toHaveCount(1);

    await failing.getByRole("button", { name: "Try again" }).click();
    await expect(failing).toHaveAttribute("data-status", "uploading");
    await field.press("Enter");
    await page.clock.runFor(1500);
    await expect(messages).toHaveCount(2);
    await expect(messages.last().locator(".hfile-list-name")).toHaveText(["receipt.pdf", "fail.png"]);
    await page.clock.runFor(1000);
    await expect(messages.last().locator(".hmessage-text")).toHaveText("Thanks, all 2 files came through. I've added them to your order's notes.");
  });

  test("a reply's text is formatted: paragraphs, lists, code, bold, and links; the status reads it without the marks", async ({ page }) => {
    const { field, messages, status } = await chatIn(page, "chat-ai-chat");
    await field.fill("summarize");
    await field.press("Enter");
    await page.clock.runFor(whole);
    const summary = messages.nth(1).locator(".hmessage-text");
    await expect(summary.locator("strong")).toHaveText("1,284 conversations");
    await expect(summary.locator("ul > li")).toHaveText([
      "Most were about delivery times, then returns.",
      "Replies took 4 minutes on average, down from 6.",
      "38 conversations are still waiting for an answer.",
    ]);
    await expect(status).toContainText("Last week you had 1,284 conversations, 12% more");

    await field.fill("embed");
    await field.press("Enter");
    await page.clock.runFor(whole);
    const embed = messages.nth(3).locator(".hmessage-text");
    await expect(embed.locator("p > code")).toHaveText("</body>");
    await expect(embed.locator(".hprose > pre > code")).toHaveText('<script src="https://example.com/chat.js" defer></script>');
    // Code is shown as text, never as markup.
    await expect(embed.locator("script")).toHaveCount(0);

    await field.fill("holiday");
    await field.press("Enter");
    await page.clock.runFor(whole);
    await expect(messages.nth(5).locator(".hmessage-text .hprose > ol > li")).toHaveCount(3);
  });

  test("a link in a reply opens in a new tab; only web and email addresses become links", async ({ page }) => {
    const { chat, messages } = await chatIn(page, "chat-support-chat");
    await chat.getByRole("button", { name: "Where's my order?" }).click();
    await page.clock.runFor(1000);
    const link = messages.last().getByRole("link", { name: "https://example.com/track/58213" });
    await expect(link).toHaveAttribute("href", "https://example.com/track/58213");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
    await expect(link).toHaveAttribute("data-underlined", "");
  });

  test("files dropped on the chat, its field included, show a frame while they're over it, and attach; files pasted in the field attach", async ({ page }) => {
    const { chat, field } = await chatIn(page, "chat-ai-chat");
    const frame = chat.locator(".hdrop-zone-overlay");
    const drag = (type: string) =>
      chat.evaluate((node, type) => {
        const data = new DataTransfer();
        data.items.add(new File(["notes"], "dropped.txt", { type: "text/plain" }));
        node.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
      }, type);
    await expect(frame).toBeHidden();
    await drag("dragenter");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveText("Drop files to attach");
    await drag("dragleave");
    await expect(frame).toBeHidden();
    await drag("dragenter");
    await drag("drop");
    await expect(frame).toBeHidden();
    await expect(field).toBeFocused();
    // Firefox's ClipboardEvent takes no clipboardData of its own, so it's
    // given one, as in the OTP Input's paste.
    await field.evaluate((node) => {
      const data = new DataTransfer();
      data.items.add(new File(["png"], "screenshot.png", { type: "image/png" }));
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data });
      if (event.clipboardData?.files.length !== 1) Object.defineProperty(event, "clipboardData", { value: data });
      node.dispatchEvent(event);
    });
    await expect(chat.locator(".hcomposer-box > .hfile-list .hfile-list-name")).toHaveText(["dropped.txt", "screenshot.png"]);
    // On the chat's own field too, though a field elsewhere keeps its drop.
    await field.evaluate((node) => {
      const data = new DataTransfer();
      data.items.add(new File(["log"], "on-field.txt", { type: "text/plain" }));
      for (const type of ["dragenter", "drop"]) node.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
    });
    await expect(chat.locator(".hcomposer-box > .hfile-list .hfile-list-name")).toHaveText(["dropped.txt", "screenshot.png", "on-field.txt"]);
  });

  test("a message your server sends on its own shows as a reply; while the window is closed, the launcher counts them, and a status says from whom", async ({ page }) => {
    const { container, chat, messages } = await chatIn(page, "chat-support-chat");
    const launcher = container.locator(".hlauncher-button");
    const count = container.locator(".hlauncher-button > .hbadge");
    const notice = container.locator(".hlauncher-status");
    await chat.getByRole("button", { name: "Talk to a person" }).click();
    await page.clock.runFor(1500);
    await launcher.click();
    await expect(count).toHaveCount(0);
    await page.clock.runFor(6000);
    await expect(count).toHaveText("1");
    await expect(launcher).toHaveAccessibleName("Chat with Speedwagon, 1 new");
    await expect(notice).toHaveText("New message from Imran");

    await launcher.click();
    await expect(count).toHaveCount(0);
    await expect(launcher).toHaveAccessibleName("Chat with Speedwagon");
    await expect(messages.last().locator(".hmessage-text")).toHaveText(
      "I've found your order. A replacement is on its way, and you'll get its tracking link by email.",
    );
  });

  test("on a phone, the support window takes the whole screen, and the launcher hides behind it", { tag: "@css" }, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const support = await example(page, "chat-support-chat");
    const box = support.locator(".play-demo > div");
    await settled(support.locator(".hlauncher-panel"));
    const [outer, window] = await Promise.all([box.boundingBox(), support.locator(".hlauncher-panel").boundingBox()]);
    // Inside the box's 1px border, as it fills the screen in a page.
    expect(window).toEqual({ x: outer!.x + 1, y: outer!.y + 1, width: outer!.width - 2, height: outer!.height - 2 });
    await expect(support.locator(".hlauncher-button")).toBeHidden();
  });

  test("a reply can be rated good or bad, one at a time, and a second press takes it back", async ({ page }) => {
    const { chat, messages } = await chatIn(page, "chat-ai-chat");
    await chat.getByRole("button", { name: "Ideas for a holiday campaign" }).click();
    await page.clock.runFor(whole);
    const [good, bad] = [messages.nth(1).getByRole("button", { name: "Good reply" }), messages.nth(1).getByRole("button", { name: "Bad reply" })];
    await expect(good).toHaveAttribute("aria-pressed", "false");
    await good.click();
    await expect(good).toHaveAttribute("aria-pressed", "true");
    await bad.click();
    await expect(good).toHaveAttribute("aria-pressed", "false");
    await expect(bad).toHaveAttribute("aria-pressed", "true");
    await bad.click();
    await expect(bad).toHaveAttribute("aria-pressed", "false");
  });

  test("your last message can be edited in the field, by Edit or the up arrow, under a bar that quotes it; Escape puts back what you'd typed, and sending asks again from there", async ({ page }) => {
    const { chat, field, messages, typing } = await chatIn(page, "chat-ai-chat");
    const edit = chat.getByRole("button", { name: "Edit", exact: true });
    const bar = chat.locator(".hcomposer-editing");
    await field.fill("welcome");
    await field.press("Enter");
    await expect(edit).toHaveCount(0);
    await page.clock.runFor(whole);
    await field.fill("summarize");
    await field.press("Enter");
    await page.clock.runFor(whole);
    // Only under the last of yours.
    await expect(edit).toHaveCount(1);
    await expect(messages.nth(2).getByRole("button", { name: "Edit", exact: true })).toBeVisible();

    await field.fill("a draft");
    await edit.click();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("summarize");
    await expect(bar.locator("p")).toHaveText(["Editing your message", "summarize"]);
    await expect(field).toHaveAccessibleDescription("Editing your message summarize");
    await expect(edit).toHaveCount(0);
    await expect(chat.getByRole("button", { name: "Attach files" })).toBeHidden();
    await field.press("Escape");
    await expect(bar).toHaveCount(0);
    await expect(field).toHaveValue("a draft");
    await expect(edit).toHaveCount(1);

    await field.fill("");
    await field.press("ArrowUp");
    await expect(field).toHaveValue("summarize");
    await chat.getByRole("button", { name: "Cancel editing" }).click();
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();

    await edit.click();
    await field.fill("Ideas for a holiday campaign");
    await field.press("Enter");
    await expect(bar).toHaveCount(0);
    await expect(messages).toHaveCount(3);
    await expect(messages.nth(2).locator(".hmessage-text")).toHaveText("Ideas for a holiday campaign");
    await expect(typing).toBeVisible();
    await expect(field).toBeFocused();
    await page.clock.runFor(whole);
    await expect(messages.nth(3)).toContainText("A few ideas for the holidays");
  });

  test("the chat list opens a kept conversation; New chat starts one, listed under Today once its reply has come", async ({ page }) => {
    const { container, chat, field, messages } = await chatIn(page, "chat-ai-chat");
    const list = container.getByRole("navigation", { name: "Chats" });
    const kept = list.getByRole("link", { name: "Welcome message draft" });
    await kept.click();
    await expect(kept).toHaveAttribute("aria-current", "page");
    await expect(chat.locator(".hchat-greeting")).toBeHidden();
    await expect(messages).toHaveCount(2);
    await expect(messages.first().locator(".hmessage-text")).toHaveText("Draft a welcome message");
    // What's kept shows as it is, without fading in.
    expect(await messages.nth(1).evaluate((node) => [node.hasAttribute("data-new"), node.getAnimations().length])).toEqual([false, 0]);

    await container.getByRole("button", { name: "New chat" }).click();
    await expect(messages).toHaveCount(0);
    await expect(chat.locator(".hchat-greeting")).toBeVisible();
    await expect(list.locator('[aria-current="page"]')).toHaveCount(0);
    await field.fill("How do I embed the chat?");
    await field.press("Enter");
    await expect(list.getByRole("link")).toHaveCount(3);
    await page.clock.runFor(whole);
    const today = list.getByRole("list", { name: "Today" }).getByRole("link");
    await expect(today.first()).toHaveText("How do I embed the chat?");
    await expect(today.first()).toHaveAttribute("aria-current", "page");

    await kept.click();
    await expect(messages.first().locator(".hmessage-text")).toHaveText("Draft a welcome message");
    await today.first().click();
    await expect(messages.first().locator(".hmessage-text")).toHaveText("How do I embed the chat?");
  });

  test("a support chat shows when each message was sent, under the last of a run", async ({ page }) => {
    const { chat, messages } = await chatIn(page, "chat-support-chat");
    await expect(chat.locator(".hmessage-time")).toHaveCount(0);
    await chat.getByRole("button", { name: "Where's my order?" }).click();
    const time = messages.last().locator("time.hmessage-time");
    await expect(time).toHaveText(/^\d{1,2}[:.]\d{2}/);
    await expect(time).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
    await page.clock.runFor(1000);
    await expect(chat.locator(".hmessage-time")).toHaveCount(2);
    await expect(messages.last().locator("time.hmessage-time")).toBeVisible();
  });

  test("the send button turns into Stop while a reply comes, its icons crossfading, and back", { tag: "@css" }, async ({ page }) => {
    const send = (await example(page, "chat-ai-chat")).locator(".hcomposer-box .hbutton[type]").last();
    const icons = { send: send.locator(".hcomposer-send-icon"), stop: send.locator(".hcomposer-stop-icon") };
    await expect(icons.send).toHaveCSS("opacity", "1");
    await expect(icons.stop).toHaveCSS("opacity", "0");
    await send.evaluate((button) => button.setAttribute("data-stopping", ""));
    await expect(icons.send).toHaveCSS("opacity", "0");
    await expect(icons.stop).toHaveCSS("opacity", "1");
  });

  test("a reply fades in as it arrives, once: not again as a closed window opens", async ({ page }) => {
    const { container, chat, messages } = await chatIn(page, "chat-support-chat");
    const greeting = messages.first();
    await expect(greeting).not.toHaveAttribute("data-new");
    await chat.getByRole("button", { name: "Start a return" }).click();
    await page.clock.runFor(1000);
    const reply = messages.last();
    await expect(reply).toContainText("You can return anything within 30 days");
    await expect(reply).not.toHaveAttribute("data-new");
    const launcher = container.locator(".hlauncher-button");
    await launcher.click();
    await expect(chat).toBeHidden();
    await launcher.click();
    await expect(chat).toBeVisible();
    for (const message of [greeting, reply]) expect(await message.evaluate((node) => node.getAnimations().length)).toBe(0);
  });

  test("the AI chat's column is at most 720px wide; the support window sits above its 48px launcher, in the corner", { tag: "@css" }, async ({ page }) => {
    // The playground's column is narrower, so the cap is read rather than
    // measured.
    const ai = await example(page, "chat-ai-chat");
    for (const part of [ai.locator(".hconversation-list"), ai.locator(".hcomposer-box")]) {
      await expect(part).toHaveCSS("max-width", "720px");
    }

    const support = await example(page, "chat-support-chat");
    // Open as the page loads, it grows from its corner first.
    await settled(support.locator(".hlauncher-panel"));
    const [box, window, launcher] = await Promise.all(
      [support.locator(".play-demo > div"), support.locator(".hlauncher-panel"), support.locator(".hlauncher-button")].map((part) => part.boundingBox()),
    );
    expect(launcher!.width).toBe(48);
    expect(launcher!.height).toBe(48);
    // 16px inside the box's 1px border.
    expect(box!.x + box!.width - (launcher!.x + launcher!.width)).toBe(17);
    expect(box!.y + box!.height - (launcher!.y + launcher!.height)).toBe(17);
    expect(window!.x + window!.width).toBe(launcher!.x + launcher!.width);
    expect(launcher!.y - (window!.y + window!.height)).toBe(10);
    expect(window!.width).toBe(384);
  });

  test("a chat opened again keeps its messages as they were as more is sent", async ({ page }) => {
    const { container, field, messages } = await chatIn(page, "chat-ai-chat");
    const list = container.getByRole("navigation", { name: "Chats" });
    await field.fill("Ideas for a holiday campaign");
    await field.press("Enter");
    await page.clock.runFor(whole);
    const reply = await messages.nth(1).locator(".hmessage-text").textContent();
    await list.getByRole("link", { name: "Welcome message draft" }).click();
    await list.getByRole("link", { name: "Ideas for a holiday campaign" }).click();
    await expect(messages).toHaveCount(2);
    await field.fill("Summarize last week's conversations");
    await field.press("Enter");
    await page.clock.runFor(whole);
    await expect(messages).toHaveCount(4);
    expect(await messages.nth(1).locator(".hmessage-text").textContent()).toBe(reply);
  });

  test("what's typed while files upload goes with the message", async ({ page }) => {
    const { chat, field } = await chatIn(page, "chat-support-chat");
    const chooser = page.waitForEvent("filechooser");
    await chat.getByRole("button", { name: "Attach files" }).click();
    await (await chooser).setFiles({ name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("receipt") });
    await field.fill("Here it is");
    await field.press("Enter");
    await field.pressSequentially(", thanks");
    await page.clock.runFor(3000);
    await expect(chat.locator('.hmessage[data-from="user"] .hmessage-text').last()).toHaveText("Here it is, thanks");
    await expect(field).toHaveValue("");
  });
});
