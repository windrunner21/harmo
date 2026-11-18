// Example only: what an app's script does for a Chat, as the React pattern
// does, with Harmo's components: conversation.js keeps the Conversation at
// its latest message and shows Jump to latest; mentions.js and listbox.js
// list the commands a slash at the start of the field brings up, and
// highlight.js marks them, drawn again with example-redraw as this script
// sets the field's text;
// drop-zone.js frames files dragged over the chat; launcher.js opens and
// closes a support chat's panel, and counts what came while it was closed.
//
// The rest is here. Enter or the send button sends what's typed, with the
// files attached; Shift+Enter starts a new line, and Enter while an input
// method is composing, or while the commands are listed, doesn't send.
// Attach files opens the file picker; the files show in the Composer's File
// List, up to five of 10 MB each, as do files dropped on the chat and files
// pasted in the field; with data-example-upload, each uploads as it's added,
// and what's sent waits for them. Your message shows at once, in place of
// the greeting, and the stand-in for your service gets the conversation so
// far: three dots show until its reply comes, whole or a piece at a time,
// fading in as it arrives. While one's on its way, nothing else sends, and in
// an AI chat or a copilot, Send turns into Stop, which ends it, keeping what
// came. A reply that doesn't come marks your message "Not sent", with Try
// again, which sends it again at the end. Each reply, once whole, gets the
// chat's actions from its template, a Copy Button and, on the last, Try
// again, which asks for it again; or Insert, which puts it into the field
// data-example-insert-into names. A reply's quick replies show while it's
// the last message, and send their words. A reply from someone new, such as
// a person taking over from a bot, says they joined, and puts their name,
// role, and avatar, from the template data-example-author names, in the
// header. The status tells screen readers each reply once it's whole, who
// joined, and a message that didn't send. A reply's text is formatted as
// Prose as it's shown: paragraphs, lists, code, bold, and links, built as
// elements, never as HTML from the text. A message your server sends on its
// own shows as a reply does. A reply can be rated, good or bad, a second
// press taking it back; your last message, once its reply has come, can be
// edited in the field, by Edit or the up arrow in an empty field, under a bar
// that quotes it: sending asks again from there, and Escape or the bar's
// close puts back what you'd typed. A support chat shows when each message
// was sent, under the last of a run. An AI chat's list of kept conversations
// opens each, and New chat starts one, listed once something's sent in it. A
// copilot's New chat starts over, and its close button hides it until the
// ticket's button brings it back.
{
  const wait = (time, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, time);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason);
        },
        { once: true },
      );
    });

  // Stand-ins for your AI service and your support bot, which answer after
  // a moment, by what the last message says, as the React playground's do.
  // A message with "fail" in it gets no answer, as when the service can't be
  // reached. An AI service's reply streams in a word at a time.
  async function* stream(text, signal) {
    await wait(700, signal);
    for (const word of text.split(/(?<= )/)) {
      await wait(30, signal);
      yield word;
    }
  }

  const lastTurn = (conversation) => [...conversation].reverse().find((turn) => turn.role === "user");

  const lastOf = (conversation) => lastTurn(conversation)?.text ?? "";

  const filesIn = (conversation) => lastTurn(conversation)?.files?.length ?? 0;

  const answerOf = (text, answers, otherwise) => answers.find(([words]) => words.test(text))?.[1] ?? otherwise;

  const failing = async (signal) => {
    await wait(900, signal);
    throw new Error("The service can't be reached.");
  };

  const welcomeText =
    "Here's a welcome message you could send to new customers:\n\nHi, and welcome! We're glad you're here. If you ever have a question, reply to this message, and someone from our team will answer within a day.\n\nWant it shorter, or in a different tone?";

  const summaryText =
    "Last week you had **1,284 conversations**, 12% more than the week before.\n\n• Most were about delivery times, then returns.\n• Replies took 4 minutes on average, down from 6.\n• 38 conversations are still waiting for an answer.\n\nWant me to list the ones that have waited longest?";

  const embedText =
    "Add this before `</body>` on every page where the chat should show:\n\n```html\n<script src=\"https://example.com/chat.js\" defer></script>\n```\n\nIt loads after the page, so the page doesn't wait for it.";

  const holidayText =
    "A few ideas for the holidays:\n\n1. A gift guide, sent in the first week of December, sorted by budget.\n2. A reminder of the last day to order, two days before your shipping cutoff.\n3. A thank-you after the holidays, with a discount for the new year.\n\nShould I draft the first one?";

  // Conversations the app has kept, which its chat list opens.
  const keptChats = {
    holiday: [
      ["user", "Ideas for a holiday campaign"],
      ["assistant", holidayText],
    ],
    welcome: [
      ["user", "Draft a welcome message"],
      ["assistant", welcomeText],
    ],
    embed: [
      ["user", "/embed"],
      ["assistant", embedText],
    ],
  };

  const topics = ["Where's my order?", "Start a return", "Talk to a person"];

  // Where messages your server sends on its own arrive: each support chat's.
  const listeners = new Set();

  const respondFor = {
    ai: (conversation, { signal }) => {
      const text = lastOf(conversation);
      if (/fail/i.test(text)) return failing(signal);
      const files = filesIn(conversation);
      if (files > 0 && !/welcome|summar|embed|holiday|campaign/i.test(text)) {
        return stream(
          `Your ${files === 1 ? "file came" : `${files} files came`} with your message. I'm a stand-in, so I can't read ${files === 1 ? "it" : "them"}, but your AI service would get ${files === 1 ? "it" : "them"} with what you asked.`,
          signal,
        );
      }
      return stream(
        answerOf(
          text,
          [
            [/welcome/i, welcomeText],
            [/summar/i, summaryText],
            [/embed/i, embedText],
            [/holiday|campaign/i, holidayText],
          ],
          "I'm a stand-in for your AI service, so I can only answer a few things. Ask me to draft a welcome message, summarize last week's conversations, show the code to embed the chat, or suggest ideas for a holiday campaign.",
        ),
        signal,
      );
    },

    copilot: (conversation, { signal }) => {
      const text = lastOf(conversation);
      if (/fail/i.test(text)) return failing(signal);
      return stream(
        answerOf(
          text,
          [
            [
              /summar/i,
              "Maya's order #58213 arrived with a cracked lid on the travel mug. Maya wants a replacement, not a refund, and first wrote about it two days ago.",
            ],
            [
              /draft|reply|write/i,
              "Hi Maya, I'm sorry your mug arrived damaged. I've sent a replacement today, at no cost, and you'll get a tracking link by email. There's no need to send the broken one back.",
            ],
          ],
          "I'm a stand-in, so I can only summarize this ticket or draft a reply to it.",
        ),
        signal,
      );
    },

    // Once Imran has joined, every reply that follows is from Imran, and a
    // follow-up comes on its own a few seconds later.
    support: async (conversation, { signal }) => {
      const text = lastOf(conversation);
      const withImran = conversation.some((turn) => turn.role === "assistant" && turn.text.startsWith("Hi, I'm Imran"));
      await wait(withImran ? 1500 : 900, signal);
      if (/fail/i.test(text)) throw new Error("The service can't be reached.");
      const files = filesIn(conversation);
      if (files > 0) {
        return {
          text: `Thanks, ${files === 1 ? "your file came" : `all ${files} files came`} through. I've added ${files === 1 ? "it" : "them"} to your order's notes.`,
          ...(withImran && { from: "Imran" }),
        };
      }
      if (withImran) return { text: "Thanks, let me check that for you. It'll take a minute.", from: "Imran" };
      if (/person|human|someone|agent/i.test(text)) {
        setTimeout(() => {
          for (const receive of listeners) {
            receive({ text: "I've found your order. A replacement is on its way, and you'll get its tracking link by email.", from: "Imran" });
          }
        }, 6000);
        return { text: "Hi, I'm Imran from the support team. I've read your conversation so far. How can I help?", from: "Imran" };
      }
      if (/order|where/i.test(text)) {
        return {
          text: "Order #58213 left our warehouse yesterday, and should reach you on Thursday. You can follow it at https://example.com/track/58213.",
          suggestions: ["Start a return", "Talk to a person"],
        };
      }
      if (/return/i.test(text)) {
        return {
          text: "You can return anything within 30 days, for free. Which order is it? Its number is in your confirmation email, such as #58213.",
          suggestions: ["Talk to a person"],
        };
      }
      return { text: "I can track an order or start a return, or find you a person to talk to.", suggestions: topics };
    },
  };

  // Stands in for uploading to your storage: it reports progress over a
  // second or so, then gives back the key the file is stored under, which is
  // sent in the file's place. A file whose name starts with "fail" stops
  // halfway the first time, so it can be tried again.
  const failedOnce = new Set();
  let keys = 0;
  const upload = (file, { progress, signal }) =>
    new Promise((resolve, reject) => {
      let done = 0;
      const timer = setInterval(() => {
        done += 20;
        if (file.name.startsWith("fail") && done === 60 && !failedOnce.has(file.name)) {
          failedOnce.add(file.name);
          clearInterval(timer);
          return reject(new Error("The upload failed."));
        }
        if (done < 100) return progress(done);
        clearInterval(timer);
        resolve(`uploads/${(keys += 1)}`);
      }, 250);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(signal.reason);
      });
    });

  const most = 5;
  const largest = 10_000_000;
  const didntUpload = "That didn't upload. Check your connection.";
  const notUploaded = "Some files didn't upload. Try them again, or remove them.";
  const doneIcon =
    '<svg class="hicon hfile-list-done" data-new width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5L10 17.5L19 7.5" pathLength="1" /></svg>';

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // A reply's text, as elements: paragraphs, with their line breaks; lists,
  // bulleted or numbered; blocks of code between ``` lines; and in them,
  // **bold**, `code`, and links, written out or as [text](address). Only
  // http, https, and mailto addresses become links.
  const fence = /^\s*```/;
  const bullet = /^\s*[-*•]\s+(.*)$/;
  const numbered = /^\s*(\d+)[.)]\s+(.*)$/;
  const inline =
    /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]*[^\s<.,:;"')\]!?])/g;

  const inlineInto = (parent, text) => {
    let last = 0;
    for (const match of text.matchAll(inline)) {
      const [whole, bold, code, label, href, address] = match;
      parent.append(text.slice(last, match.index));
      if (bold) parent.append(element("strong", "", bold));
      else if (code) parent.append(element("code", "", code));
      else {
        const link = element("a", "hlink", label ?? address);
        link.href = href ?? (address.startsWith("www.") ? `https://${address}` : address);
        link.target = "_blank";
        link.rel = "noreferrer";
        link.setAttribute("data-underlined", "");
        parent.append(link);
      }
      last = match.index + whole.length;
    }
    parent.append(text.slice(last));
  };

  const formatInto = (container, text) => {
    const lines = text.split("\n");
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (fence.test(line)) {
        const code = [];
        index += 1;
        while (index < lines.length && !fence.test(lines[index])) code.push(lines[index++]);
        index += 1;
        const block = element("pre");
        block.append(element("code", "", code.join("\n")));
        blocks.push(block);
      } else if (bullet.test(line) || numbered.test(line)) {
        const ordered = !bullet.test(line);
        const list = element(ordered ? "ol" : "ul");
        const start = Number(numbered.exec(line)?.[1]);
        if (ordered && start !== 1) list.start = start;
        for (let match; (match = (ordered ? numbered : bullet).exec(lines[index] ?? "")); index += 1) {
          const item = element("li");
          inlineInto(item, ordered ? match[2] : match[1]);
          list.append(item);
        }
        blocks.push(list);
      } else if (!line.trim()) {
        index += 1;
      } else {
        const paragraph = element("p");
        let first = true;
        while (index < lines.length && lines[index].trim() && ![fence, bullet, numbered].some((rule) => rule.test(lines[index]))) {
          if (!first) paragraph.append(element("br"));
          inlineInto(paragraph, lines[index++]);
          first = false;
        }
        blocks.push(paragraph);
      }
    }
    container.replaceChildren(...blocks);
  };

  // What a screen reader hears of it: the text, without the marks.
  const plainText = (text) =>
    text
      .replace(/^\s*```.*$/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

  const suggestionsOf = (words, label) => {
    const group = element("div", "hmessage-suggestions");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    for (const word of words) {
      const button = element("button", "hbutton");
      button.type = "button";
      button.dataset.variant = "secondary";
      button.dataset.size = "small";
      button.append(element("span", "hbutton-label", word));
      group.append(button);
    }
    return group;
  };

  // The tooltips in what's cloned, each with an id of its own that its button
  // is named by.
  let tooltips = 0;
  const nameByTooltips = (fragment) => {
    for (const tooltip of fragment.querySelectorAll(".htooltip")) {
      tooltip.id = `chat-tooltip-${(tooltips += 1)}`;
      tooltip.parentElement.querySelector(":scope > button").setAttribute("aria-labelledby", tooltip.id);
    }
  };

  const clock = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

  const streamed = (answer) => typeof answer === "object" && answer !== null && Symbol.asyncIterator in answer;

  for (const chat of document.querySelectorAll("[data-example-chat]")) {
    const respond = respondFor[chat.dataset.exampleChat];
    const header = chat.querySelector(".hchat-header");
    const conversation = chat.querySelector(".hconversation");
    const list = conversation.querySelector(".hconversation-list");
    const greeting = conversation.querySelector(".hconversation-empty");
    const status = conversation.querySelector(".hconversation-status");
    const form = chat.querySelector(".hcomposer");
    const field = form.querySelector(".htextarea");
    const box = form.querySelector(".hcomposer-box");
    const send = form.querySelector('[type="submit"]');
    const sendTip = document.getElementById(send.getAttribute("aria-labelledby"));
    const stoppable = send.querySelector(".hcomposer-send-icons") !== null;
    const files = box.querySelector(":scope > .hfile-list");
    const picker = form.querySelector('input[type="file"]');
    const error = form.querySelector(":scope > .herror");
    const uploads = box.hasAttribute("data-example-upload");
    const actions = chat.querySelector("template[data-example-actions]");
    const newChat = chat.querySelector("[data-example-new-chat]");
    const support = chat.dataset.variant === "support";
    const authors = new Map([...chat.querySelectorAll("template[data-example-author]")].map((template) => [template.dataset.exampleAuthor, template]));

    // The conversation so far, each message with its element.
    let messages = [...list.querySelectorAll('.hmessage:not([data-from="system"])')].map((item) => ({
      role: item.dataset.from,
      text: item.querySelector(".hmessage-text").textContent.trim(),
      item,
    }));
    let speaker = header?.querySelector(".hchat-title")?.textContent;
    let asking = null;
    let typing = null;
    let streaming = null;

    // Jump to latest puts you back in the field.
    conversation.querySelector(".hconversation-latest .hbutton").addEventListener("click", () => field.focus());

    // The files to send: the File List's rows, but those leaving.
    const rows = () => (files ? [...files.children].filter((row) => !row.hasAttribute("data-leaving")) : []);
    const empty = () => !field.value.trim() && (editing ? !editing.attached : rows().length === 0);

    // Where it can stop a reply, the send button turns into Stop while one
    // comes, and back, its icons crossfading.
    const setReplying = (on) => {
      if (stoppable) {
        send.type = on ? "button" : "submit";
        send.toggleAttribute("data-stopping", on);
        sendTip.textContent = on ? "Stop" : "Send";
      }
      send.disabled = on ? !stoppable : empty();
      placeEdit();
    };
    const refresh = () => {
      if (!asking) send.disabled = empty();
    };

    // A support chat's times: under the last message of each run, from you
    // or from one person.
    const placeTimes = () => {
      if (!support) return;
      for (const time of list.querySelectorAll(".hmessage-time")) time.remove();
      for (const [index, message] of messages.entries()) {
        const next = messages[index + 1];
        const ends = !next || next.role !== message.role || (next.from !== undefined && next.from !== message.from);
        if (!message.time || message.failed || message === streaming || !ends) continue;
        const time = element("time", "hmessage-time", clock.format(message.time));
        time.dateTime = message.time.toISOString();
        (message.item.querySelector(".hmessage-text") ?? message.item.querySelector(".hmessage-body > .hfile-list")).after(time);
      }
    };

    // Edit, under your last message, while no reply is on its way.
    const editTemplate = chat.querySelector("template[data-example-edit]");
    const placeEdit = () => {
      if (!editTemplate) return;
      for (const row of list.querySelectorAll("[data-example-edit-row]")) row.remove();
      const last = [...messages].reverse().find((message) => message.role === "user");
      if (asking || !last || last === editing) return;
      const row = editTemplate.content.firstElementChild.cloneNode(true);
      row.dataset.exampleEditRow = "";
      nameByTooltips(row);
      const failed = last.item.querySelector(".hmessage-failed");
      if (failed) failed.before(row);
      else last.item.querySelector(".hmessage-body").append(row);
    };

    // Your last message, being edited in the field: a bar above it quotes
    // it, Attach files and the files to send stand aside, as an edit keeps
    // the message's own, and what you'd typed waits until it's done.
    const editingTemplate = chat.querySelector("template[data-example-editing]");
    let editing = null;
    let editingBar = null;
    let draft = "";
    let bars = 0;
    const startEditing = () => {
      const last = [...messages].reverse().find((message) => message.role === "user");
      if (!editingTemplate || !last || asking || editing) return false;
      editing = last;
      draft = field.value;
      editingBar = editingTemplate.content.firstElementChild.cloneNode(true);
      nameByTooltips(editingBar);
      const quoted = editingBar.querySelector(".hcomposer-editing-text");
      quoted.id = `chat-editing-${(bars += 1)}`;
      editingBar.querySelector(".hcomposer-editing-quote").textContent = last.text;
      editingBar.querySelector(".hbutton").addEventListener("click", () => {
        stopEditing();
        field.focus();
      });
      const context = box.querySelector(":scope > .hcomposer-context");
      if (context) context.after(editingBar);
      else box.prepend(editingBar);
      field.setAttribute("aria-describedby", quoted.id);
      const attachButton = box.querySelector(":scope > .hcomposer-attach");
      if (attachButton) attachButton.hidden = true;
      if (files) files.hidden = true;
      field.value = last.text;
      field.dispatchEvent(new CustomEvent("example-redraw"));
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
      refresh();
      placeEdit();
      return true;
    };
    const stopEditing = () => {
      if (!editing) return;
      editingBar.remove();
      editingBar = null;
      editing = null;
      field.removeAttribute("aria-describedby");
      const attachButton = box.querySelector(":scope > .hcomposer-attach");
      if (attachButton) attachButton.hidden = false;
      if (files) files.hidden = rows().length === 0;
      field.value = draft;
      field.dispatchEvent(new CustomEvent("example-redraw"));
      draft = "";
      refresh();
      placeEdit();
    };

    // Try again shows only under the last message, and the quick replies
    // only while theirs is the last.
    const markLast = () => {
      const last = messages.at(-1)?.item;
      for (const trigger of list.querySelectorAll("[data-example-last]")) {
        trigger.hidden = trigger.closest(".hmessage") !== last;
      }
      for (const group of list.querySelectorAll(".hmessage-suggestions")) {
        if (group.closest(".hmessage") !== last) group.remove();
      }
      placeTimes();
      placeEdit();
    };

    // A reply arriving fades in, once: not again as a closed window opens.
    list.addEventListener("animationend", (event) => {
      if (event.target.parentElement === list) event.target.removeAttribute("data-new");
    });

    // A support chat's replies are in bubbles, beside the avatar of whoever
    // wrote the first of a run; the rest keep its column, empty.
    const assistantItem = (from, opens) => {
      const item = element("li", "hmessage");
      item.dataset.from = "assistant";
      item.dataset.new = "";
      if (support) {
        item.dataset.bubble = "";
        const avatar = element("span", "hmessage-avatar");
        if (opens) avatar.append(authors.get(from).content.cloneNode(true));
        else avatar.setAttribute("aria-hidden", "true");
        item.append(avatar);
      }
      const body = element("div", "hmessage-body");
      item.append(body);
      return { item, body };
    };

    const showTyping = () => {
      const { item, body } = assistantItem(speaker, messages.at(-1)?.role !== "assistant");
      item.setAttribute("aria-hidden", "true");
      const dots = element("p", "hmessage-text hmessage-typing");
      dots.append(element("span"), element("span"), element("span"));
      body.append(dots);
      list.append(item);
      typing = item;
    };

    const hideTyping = () => {
      typing?.remove();
      typing = null;
    };

    // Someone new in the conversation: a line that says so, and their name,
    // role, and avatar in the header.
    const join = (name) => {
      const template = authors.get(name);
      header.querySelector(".havatar").replaceWith(template.content.cloneNode(true));
      header.querySelector(".hchat-title").textContent = name;
      const subtitle = header.querySelector(".hchat-subtitle");
      subtitle.textContent = template.dataset.exampleRole ?? "";
      subtitle.hidden = !template.dataset.exampleRole;
      const line = element("li", "hmessage", `${name} joined the conversation`);
      line.dataset.from = "system";
      list.append(line);
      speaker = name;
    };

    const addReply = (reply, kept = false) => {
      const joined = support && reply.from && reply.from !== speaker;
      if (joined) join(reply.from);
      const { item, body } = assistantItem(speaker, joined || messages.at(-1)?.role !== "assistant");
      if (kept) delete item.dataset.new;
      const text = element("div", "hmessage-text");
      const prose = element("div", "hprose");
      formatInto(prose, reply.text);
      text.append(prose);
      body.append(text);
      list.append(item);
      const message = { role: "assistant", text: reply.text, from: speaker, item, body, textElement: text, proseElement: prose, ...(!kept && { time: new Date() }) };
      messages.push(message);
      markLast();
      return message;
    };

    const finish = (message, suggestions) => {
      message.textElement.removeAttribute("aria-busy");
      if (actions) {
        const row = actions.content.cloneNode(true);
        nameByTooltips(row);
        for (const button of row.querySelectorAll(".hcopy")) {
          button.dataset.exampleCopy = message.text;
          if (typeof setUpCopyButton === "function") setUpCopyButton(button);
        }
        message.body.append(row);
      }
      if (suggestions?.length) message.body.append(suggestionsOf(suggestions, "Suggested replies"));
      markLast();
    };

    // A whole reply, or a message your server sent on its own, read out with
    // who it's from, and who joined.
    const showReply = (reply) => {
      const joined = support && reply.from && reply.from !== speaker;
      finish(addReply(reply), reply.suggestions);
      status.textContent = `${joined ? `${reply.from} joined the conversation. ` : ""}${reply.from ? `${reply.from}: ` : ""}${plainText(reply.text)}`;
    };

    const fail = (asker) => {
      asker.failed = true;
      const line = element("p", "hmessage-failed", "Not sent. ");
      const again = element("button", "hlink", "Try again");
      again.type = "button";
      line.append(again);
      asker.item.querySelector(".hmessage-body").append(line);
      placeTimes();
    };

    // Whatever must follow a reply's end, whole, stopped, or failed, such as
    // listing a new conversation.
    let settled = () => {};

    const ask = async (asker) => {
      const controller = new AbortController();
      asking = controller;
      setReplying(true);
      showTyping();
      const turns = messages
        .filter((message) => !message.failed)
        .map(({ role, text, files }) => ({ role, text, ...(files && { files }) }));
      try {
        const answer = await respond(turns, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (streamed(answer)) {
          for await (const piece of answer) {
            if (controller.signal.aborted) return;
            if (!piece) continue;
            if (!streaming) {
              hideTyping();
              streaming = addReply({ text: "" });
              streaming.textElement.setAttribute("aria-busy", "true");
            }
            streaming.text += piece;
            formatInto(streaming.proseElement, streaming.text);
          }
          if (controller.signal.aborted || !streaming) return;
          const done = streaming;
          streaming = null;
          finish(done);
          status.textContent = plainText(done.text);
        } else {
          hideTyping();
          const reply = typeof answer === "string" ? { text: answer } : answer;
          showReply(reply);
        }
      } catch {
        if (controller.signal.aborted) return;
        if (streaming) {
          streaming.item.remove();
          messages = messages.filter((message) => message !== streaming);
          streaming = null;
        }
        fail(asker);
        markLast();
        status.textContent = "Your message didn't send.";
      } finally {
        if (asking === controller) {
          hideTyping();
          asking = null;
          setReplying(false);
          settled();
        }
      }
    };

    // A message, with the files sent with it above its text, in a File List
    // of their own.
    const addMessage = (text, attached, kept = false) => {
      const item = element("li", "hmessage");
      item.dataset.from = "user";
      if (support) item.dataset.accent = "";
      const body = element("div", "hmessage-body");
      if (attached) body.append(attached.list);
      if (text) body.append(element("div", "hmessage-text", text));
      item.append(body);
      const message = { role: "user", text, item, ...(!kept && { time: new Date() }), ...(attached && { files: attached.entries, attached }) };
      if (greeting) greeting.hidden = true;
      list.hidden = false;
      list.append(item);
      messages.push(message);
      return message;
    };

    const start = (text, attached) => {
      const message = addMessage(text, attached);
      markLast();
      if (newChat) newChat.disabled = false;
      void ask(message);
    };

    const sendText = (text) => {
      const trimmed = text.trim();
      if (!trimmed || asking) return false;
      start(trimmed);
      return true;
    };

    // The files being sent, as the message shows them: their rows, with
    // nothing to press.
    const sentList = (sent) => {
      const sentFiles = element("ul", "hfile-list");
      sentFiles.setAttribute("role", "list");
      sentFiles.setAttribute("aria-label", "Attachments");
      sentFiles.tabIndex = -1;
      for (const row of sent) {
        const copy = row.cloneNode(true);
        copy.removeAttribute("data-status");
        copy.removeAttribute("data-new");
        copy.querySelector(".hfile-list-name").removeAttribute("id");
        copy.querySelector(".hfile-list-progress")?.remove();
        copy.querySelector(".hfile-list-actions").replaceChildren();
        sentFiles.append(copy);
      }
      return sentFiles;
    };

    // With uploads, each row's file, its key once stored, and its upload
    // while it runs.
    const held = new WeakMap();
    const keyOf = new WeakMap();
    const running = new Map();

    const setProgress = (row, value) => {
      let bar = row.querySelector(":scope > .hfile-list-progress");
      if (!bar) {
        bar = element("div", "hfile-list-progress");
        bar.role = "progressbar";
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-labelledby", row.querySelector(".hfile-list-name").id);
        row.append(bar);
      }
      bar.style.setProperty("--hfile-list-progress", value / 100);
      bar.setAttribute("aria-valuenow", String(value));
    };

    // Uploads a row's file: its progress while it runs; once stored, a check;
    // if it fails, an error in place of its size, and a button to try again.
    const startUpload = (row) => {
      running.get(row)?.controller.abort();
      const controller = new AbortController();
      const live = () => !controller.signal.aborted && row.isConnected;
      keyOf.delete(row);
      row.dataset.status = "uploading";
      setProgress(row, 0);
      const progress = (value) => {
        if (live()) setProgress(row, Math.min(99, Math.max(0, value)));
      };
      const done = upload(held.get(row), { progress, signal: controller.signal })
        .then(
          (key) => {
            if (!live()) return;
            keyOf.set(row, key);
            row.dataset.status = "done";
            setProgress(row, 100);
            row.querySelector(".hfile-list-actions").insertAdjacentHTML("afterbegin", doneIcon);
          },
          () => {
            if (!live()) return;
            row.dataset.status = "error";
            row.querySelector(":scope > .hfile-list-progress")?.remove();
            const failure = element("p", "hfile-list-error", didntUpload);
            failure.role = "alert";
            row.querySelector(".hfile-list-detail").hidden = true;
            row.querySelector(".hfile-list-text").append(failure);
            const retry = element("button", "hbutton");
            retry.dataset.variant = "tertiary";
            retry.type = "button";
            retry.setAttribute("aria-describedby", row.querySelector(".hfile-list-name").id);
            retry.append(element("span", "hbutton-label", "Try again"));
            row.querySelector(".hfile-list-remove").before(retry);
          },
        )
        .finally(() => {
          if (running.get(row)?.controller === controller) running.delete(row);
        });
      running.set(row, { controller, done });
    };

    // Waits for the uploads still running, those started meanwhile too; then
    // says if any didn't upload.
    const settle = async () => {
      while (running.size > 0) await Promise.all([...running.values()].map(({ done }) => done));
      return files?.querySelector(':scope > [data-status="error"]:not([data-leaving])') ? notUploaded : undefined;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (empty() || asking) return;
      // An edit removes your message and all after it, and sends it again.
      if (editing) {
        const message = editing;
        const value = field.value.trim();
        stopEditing();
        const index = messages.indexOf(message);
        for (let node = message.item; node; ) {
          const next = node.nextElementSibling;
          node.remove();
          node = next;
        }
        messages = messages.slice(0, index);
        start(value, message.attached);
        field.focus();
        return;
      }
      const failed = await settle();
      if (failed) {
        error.textContent = failed;
        return;
      }
      if (asking) return;
      const sent = rows();
      const attached = sent.length
        ? { entries: sent.map((row) => (uploads ? keyOf.get(row) : held.get(row))), list: sentList(sent) }
        : undefined;
      for (const row of sent) row.remove();
      start(field.value.trim(), attached);
      field.value = "";
      field.dispatchEvent(new CustomEvent("example-redraw"));
      if (error) error.textContent = "";
      field.focus();
    });

    // Attach files: up to five, 10 MB each, which file-list.js lists, on the
    // composer's box; then, on the form, after it, each row's file, and its
    // upload.
    box.querySelector(".hcomposer-attach > .hbutton")?.addEventListener("click", () => picker.click());
    picker?.addEventListener("change", () => {
      const chosen = [...picker.files];
      picker.value = "";
      attachFiles(chosen);
    });
    // Files dropped on the chat, or pasted in the field, are attached as
    // chosen ones are.
    const attachFiles = (chosen) => {
      const room = most - rows().length;
      const fitting = chosen.filter((file) => file.size <= largest);
      const tooLarge = chosen.find((file) => file.size > largest);
      error.textContent = tooLarge ? `${tooLarge.name} is over 10 MB.` : fitting.length > room ? `Attach up to ${most} files.` : "";
      const adding = fitting.slice(0, Math.max(0, room));
      if (adding.length > 0) box.dispatchEvent(new CustomEvent("example-files-add", { bubbles: true, detail: adding }));
    };
    // Files dropped on the chat come from drop-zone.js, on the chat itself.
    chat.addEventListener("example-files-add", (event) => {
      if (event.target !== chat) return;
      if (!editing) attachFiles(event.detail);
      field.focus();
    });
    if (files) {
      field.addEventListener("paste", (event) => {
        const pasted = [...(event.clipboardData?.files ?? [])];
        if (pasted.length === 0 || editing) return;
        event.preventDefault();
        attachFiles(pasted);
      });
    }
    form.addEventListener("example-files-add", (event) => {
      const added = [...files.children].slice(-event.detail.length);
      added.forEach((row, index) => held.set(row, event.detail[index]));
      if (uploads) for (const row of added) startUpload(row);
    });
    files?.addEventListener("click", (event) => {
      const row = event.target.closest(".hfile-list-item");
      if (!uploads || !row || !event.target.closest(".hfile-list-actions .hbutton:not(.hfile-list-remove)")) return;
      const focused = row.contains(document.activeElement);
      row.querySelector(".hfile-list-error").remove();
      row.querySelector(".hfile-list-detail").hidden = false;
      event.target.closest(".hbutton").remove();
      startUpload(row);
      if (focused) row.querySelector(".hfile-list-remove").focus();
    });
    // The list shows while it has files; once the last goes, focus goes back
    // to the field.
    if (files) {
      new MutationObserver(() => {
        const holding = rows().length > 0;
        files.hidden = !holding || editing !== null;
        if (!holding && files.contains(document.activeElement)) field.focus();
        if (!holding && document.activeElement === files) field.focus();
        refresh();
      }).observe(files, { childList: true, subtree: true, attributeFilter: ["data-leaving"] });
    }

    field.addEventListener("input", refresh);
    // While the commands are listed, their keys are the list's.
    // Not while an input method composes text: Safari's Enter that ends it
    // says so only with keyCode 229.
    field.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (form.querySelector(".hpopup:popover-open")) return;
      if (event.key === "ArrowUp" && !field.value && startEditing()) {
        event.preventDefault();
        return;
      }
      if (event.key === "Escape" && editing) {
        event.preventDefault();
        stopEditing();
        return;
      }
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      form.requestSubmit();
    });

    send.addEventListener("click", () => {
      if (!asking || !stoppable) return;
      asking.abort();
      asking = null;
      hideTyping();
      if (streaming) {
        const done = streaming;
        streaming = null;
        finish(done);
      }
      setReplying(false);
      settled();
      status.textContent = "Stopped.";
      field.focus();
    });

    const messageOf = (node) => messages.find((message) => message.item === node.closest(".hmessage"));

    conversation.addEventListener("click", (event) => {
      const rating = event.target.closest("[data-example-feedback]");
      if (rating) {
        const on = rating.getAttribute("aria-pressed") !== "true";
        for (const other of rating.closest(".hmessage-actions").querySelectorAll("[data-example-feedback]")) {
          other.setAttribute("aria-pressed", String(on && other === rating));
        }
        messageOf(rating).feedback = on ? rating.dataset.exampleFeedback : undefined;
        return;
      }
      if (event.target.closest("[data-example-edit-row] .hbutton")) {
        startEditing();
        return;
      }
      const suggestion = event.target.closest(":is(.hchat-suggestions, .hmessage-suggestions) > .hbutton");
      if (suggestion) {
        sendText(suggestion.textContent);
        field.focus();
        return;
      }
      const again = event.target.closest(".hmessage-failed > .hlink");
      if (again && !asking) {
        const failed = messages.find((message) => message.item === again.closest(".hmessage"));
        failed.item.remove();
        messages = messages.filter((message) => message !== failed);
        start(failed.text, failed.attached);
        return;
      }
      if (event.target.closest("[data-example-regenerate]") && !asking) {
        const last = messages.at(-1);
        const asker = [...messages].reverse().find((message) => message.role === "user");
        if (last?.role !== "assistant" || !asker) return;
        last.item.remove();
        messages = messages.slice(0, -1);
        markLast();
        void ask(asker);
        field.focus();
        return;
      }
      const insert = event.target.closest("[data-example-insert]");
      if (insert) {
        const reply = messages.find((message) => message.item === insert.closest(".hmessage"));
        const target = document.getElementById(chat.dataset.exampleInsertInto);
        target.value = reply.text;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.focus();
      }
    });

    // An AI chat's list of kept conversations: each opens in its place, New
    // chat starts one, and one started is listed under Today, titled by its
    // first message, once its first reply has come.
    const layout = chat.closest("[data-example-chats]");
    if (layout) {
      const sidebar = layout.querySelector(".hsidebar");
      const conversations = new Map();
      let current = "new-1";
      let made = 1;
      const linkTo = (id) => sidebar.querySelector(`.hsidebar-item[href="#${id}"]`);
      const markCurrent = () => {
        for (const link of sidebar.querySelectorAll(".hsidebar-item")) {
          if (link === linkTo(current)) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
      };
      const open = (id) => {
        stopEditing();
        asking?.abort();
        asking = null;
        streaming = null;
        hideTyping();
        setReplying(false);
        conversations.set(current, { messages, items: [...list.children] });
        current = id;
        const kept = conversations.get(id);
        messages = kept?.messages ?? [];
        list.replaceChildren(...(kept?.items ?? []));
        if (!kept) {
          for (const [role, text] of keptChats[id] ?? []) {
            if (role === "user") addMessage(text, undefined, true);
            else finish(addReply({ text }, true));
          }
        }
        greeting.hidden = messages.length > 0;
        list.hidden = messages.length === 0;
        field.value = "";
        field.dispatchEvent(new CustomEvent("example-redraw"));
        for (const row of rows()) row.remove();
        error.textContent = "";
        status.textContent = "";
        markLast();
        refresh();
        markCurrent();
      };
      // Listed once its first reply has come, or it stopped or failed.
      settled = () => {
        if (linkTo(current) || messages.length === 0) return;
        const first = messages.find((message) => message.role === "user")?.text || "Files";
        const title = first.length > 40 ? `${first.slice(0, 39)}…` : first;
        const today = sidebar.querySelector(".hsidebar-list");
        const entry = today.firstElementChild.cloneNode(true);
        const link = entry.querySelector(".hsidebar-item");
        link.href = `#${current}`;
        link.querySelector(".hsidebar-label").textContent = title;
        entry.querySelector(".hsidebar-tooltip").textContent = title;
        today.prepend(entry);
        markCurrent();
      };
      sidebar.addEventListener("click", (event) => {
        const link = event.target.closest(".hsidebar-item");
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const id = link.getAttribute("href").slice(1);
        if (id !== current) open(id);
      });
      sidebar.querySelector("[data-example-start]").addEventListener("click", () => {
        if (messages.length > 0) {
          made += 1;
          open(`new-${made}`);
        }
        field.focus();
      });
    }

    // A copilot starts over with New chat; its close button hides it, and the
    // ticket's button brings it back.
    newChat?.addEventListener("click", () => {
      stopEditing();
      asking?.abort();
      asking = null;
      streaming = null;
      hideTyping();
      list.replaceChildren();
      messages = [];
      list.hidden = true;
      if (greeting) greeting.hidden = false;
      newChat.disabled = true;
      setReplying(false);
      status.textContent = "";
      field.focus();
    });
    const panel = chat.closest("[data-example-copilot]");
    const opener = panel?.parentElement.querySelector("[data-example-open-copilot]");
    chat.querySelector("[data-example-close-copilot]")?.addEventListener("click", () => {
      panel.hidden = true;
      opener.parentElement.hidden = false;
      opener.focus();
    });
    opener?.addEventListener("click", () => {
      panel.hidden = false;
      opener.parentElement.hidden = true;
      field.focus();
    });

    // A support chat's replies that come while its Launcher's panel is
    // closed, launcher.js counts, with who they're from.
    const launcher = chat.closest(".hlauncher");
    if (launcher) {
      const panel = launcher.querySelector(":scope > .hlauncher-panel");
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!node.matches?.('.hmessage[data-from="assistant"]:not([aria-hidden])') || panel.hasAttribute("data-open")) continue;
            launcher.dispatchEvent(new CustomEvent("example-unread", { detail: { name: speaker } }));
          }
        }
      }).observe(list, { childList: true });
      listeners.add((reply) => showReply(reply));
    }
  }
}
