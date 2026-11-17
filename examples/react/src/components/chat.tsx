import { Avatar, Button, Field, Sidebar, SidebarGroup, SidebarItem, TextArea, Tooltip } from "@harmo-ui/react";
import { useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { AiChat } from "../patterns/chat/AiChat.tsx";
import { Copilot } from "../patterns/chat/Copilot.tsx";
import { AssistantIcon, NewChatIcon } from "../patterns/chat/icons.tsx";
import { SupportChat } from "../patterns/chat/SupportChat.tsx";
import type { Upload } from "../patterns/attachments/attachments.ts";
import type { ChatAuthor, ChatMessage, ChatReply, ChatTurn, Respond } from "../patterns/chat/useChat.ts";

// Stand-ins for your AI service and your support bot, which answer after a
// moment, by what the last message says, or the files it brings. A message
// with "fail" in it gets no answer, as when the service can't be reached.
const wait = (time: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
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

// A reply streamed a word at a time, after a moment's thought, as an AI
// service sends one.
async function* stream(text: string, signal: AbortSignal) {
  await wait(700, signal);
  for (const word of text.split(/(?<= )/)) {
    await wait(30, signal);
    yield word;
  }
}

const lastTurn = (conversation: ChatTurn[]) => [...conversation].reverse().find((turn) => turn.role === "user");

const lastOf = (conversation: ChatTurn[]) => lastTurn(conversation)?.text ?? "";

const filesIn = (conversation: ChatTurn[]) => lastTurn(conversation)?.files?.length ?? 0;

const answerOf = (text: string, answers: [RegExp, string][], otherwise: string) =>
  answers.find(([words]) => words.test(text))?.[1] ?? otherwise;

const failing = async (signal: AbortSignal) => {
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

const askAi: Respond = (conversation, { signal }) => {
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
};

const askCopilot: Respond = (conversation, { signal }) => {
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
};

const bot: ChatAuthor = {
  name: "Fernhill Market",
  role: "AI assistant · Replies right away",
  avatar: (
    <Avatar alt="">
      <AssistantIcon className="hicon" />
    </Avatar>
  ),
};

const imran: ChatAuthor = {
  name: "Imran",
  role: "Support team",
  avatar: <Avatar src="images/imran.webp" alt="" />,
};

const topics = ["Where's my order?", "Start a return", "Talk to a person"];

// Stands in for uploading to your storage: it reports progress over a second
// or so, then gives back the key the file is stored under, which the chat
// sends in the file's place. A file whose name starts with "fail" stops
// halfway the first time, so it can be tried again.
const failedOnce = new Set<string>();
let keys = 0;

const upload: Upload = (file, { progress, signal }) =>
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

// Messages your server sends on its own, such as a person's who's answering:
// here, once Imran has joined, a follow-up a few seconds later, which counts
// on the launcher if the window is closed by then.
const listeners = new Set<(reply: ChatReply) => void>();

const subscribe = (receive: (reply: ChatReply) => void) => {
  listeners.add(receive);
  return () => {
    listeners.delete(receive);
  };
};

// Once Imran has joined, every reply that follows is from Imran.
const askSupport: Respond = async (conversation, { signal }): Promise<ChatReply> => {
  const text = lastOf(conversation);
  const withImran = conversation.some((turn) => turn.role === "assistant" && turn.text.startsWith("Hi, I'm Imran"));
  await wait(withImran ? 1500 : 900, signal);
  if (/fail/i.test(text)) throw new Error("The service can't be reached.");
  const files = filesIn(conversation);
  if (files > 0) {
    return {
      text: `Thanks, ${files === 1 ? "your file came" : `all ${files} files came`} through. I've added ${files === 1 ? "it" : "them"} to your order's notes.`,
      ...(withImran && { from: imran }),
    };
  }
  if (withImran) return { text: "Thanks, let me check that for you. It'll take a minute.", from: imran };
  if (/person|human|someone|agent/i.test(text)) {
    setTimeout(() => {
      for (const receive of listeners) {
        receive({ text: "I've found your order. A replacement is on its way, and you'll get its tracking link by email.", from: imran });
      }
    }, 6000);
    return {
      text: "Hi, I'm Imran from the support team. I've read your conversation so far. How can I help?",
      from: imran,
    };
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
};

// Conversations your app has kept, each with a title and the group it's
// listed under, such as "Today". Your app groups them by when they were last
// used, in the person's own time zone.
interface Kept {
  id: string;
  title: string;
  group: string;
  messages: ChatMessage[];
}

const kept = (id: string, title: string, group: string, question: string, answer: string): Kept => ({
  id,
  title,
  group,
  messages: [
    { id: `${id}-question`, role: "user", text: question },
    { id: `${id}-answer`, role: "assistant", text: answer },
  ],
});

const keptChats = [
  kept("holiday", "Holiday campaign ideas", "Today", "Ideas for a holiday campaign", holidayText),
  kept("welcome", "Welcome message draft", "Previous 7 days", "Draft a welcome message", welcomeText),
  kept("embed", "Embed code for the website", "Previous 7 days", "/embed", embedText),
];

// A click on a chat opens it here; one with a modifier key is left to the
// browser, as your router does.
const opens = (open: () => void) => (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  open();
};

export const examples = {
  "AI chat": () => {
    const [chats, setChats] = useState(keptChats);
    const [current, setCurrent] = useState("new-1");
    const [made, setMade] = useState(1);
    const open = chats.find((chat) => chat.id === current);
    const groups = ["Today", "Previous 7 days"].flatMap((label) => {
      const listed = chats.filter((chat) => chat.group === label);
      return listed.length > 0 ? [{ label, listed }] : [];
    });

    // A new conversation is kept once something's sent in it, titled by its
    // first message.
    const save = (messages: ChatMessage[]) =>
      setChats((all) => {
        if (all.some((chat) => chat.id === current)) {
          return all.map((chat) => (chat.id === current ? { ...chat, messages } : chat));
        }
        const first = messages.find((message) => message.role === "user")?.text || "Files";
        const title = first.length > 40 ? `${first.slice(0, 39)}…` : first;
        return [{ id: current, title, group: "Today", messages }, ...all];
      });

    const startNew = () => {
      if (!open) return;
      setMade(made + 1);
      setCurrent(`new-${made + 1}`);
    };

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1px",
          overflow: "hidden",
          background: "var(--harmo-color-border)",
          border: "1px solid var(--harmo-color-border)",
          borderRadius: "var(--harmo-border-radius)",
        }}
      >
        <div style={{ flex: "1 1 13rem", background: "var(--harmo-color-background)" }}>
          <Sidebar
            aria-label="Chats"
            header={
              <Button variant="secondary" onClick={startNew}>
                <NewChatIcon className="hicon" />
                New chat
              </Button>
            }
          >
            {groups.map(({ label, listed }) => (
              <SidebarGroup key={label} label={label}>
                {listed.map((chat) => (
                  <SidebarItem key={chat.id} href={`#${chat.id}`} current={chat.id === current} onClick={opens(() => setCurrent(chat.id))}>
                    {chat.title}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            ))}
          </Sidebar>
        </div>
        <div style={{ flex: "999 1 22rem", blockSize: "38rem", background: "var(--harmo-color-background)" }}>
          <AiChat
            key={current}
            messages={open?.messages}
            onSave={save}
            onFeedback={() => {}}
            respond={askAi}
            suggestions={["Draft a welcome message", "Summarize last week's conversations", "Ideas for a holiday campaign"]}
            commands={[
              { name: "welcome", description: "Draft a welcome message" },
              { name: "summarize", description: "Summarize last week's conversations" },
              { name: "embed", description: "Show the code to embed the chat" },
              { name: "campaign", description: "Ideas for a holiday campaign" },
            ]}
            attach
          />
        </div>
      </div>
    );
  },

  Copilot: () => {
    const [open, setOpen] = useState(true);
    const [reply, setReply] = useState("");
    const replyField = useRef<HTMLTextAreaElement>(null);
    const opener = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1px",
          overflow: "hidden",
          background: "var(--harmo-color-border)",
          border: "1px solid var(--harmo-color-border)",
          borderRadius: "var(--harmo-border-radius)",
        }}
      >
        <section
          aria-labelledby="copilot-ticket-title"
          style={{
            flex: "999 1 20rem",
            display: "grid",
            alignContent: "start",
            gap: "var(--harmo-space-md)",
            padding: "var(--harmo-space-md)",
            background: "var(--harmo-color-background)",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: "var(--harmo-space-xs)" }}>
            <div style={{ display: "grid", flex: 1, gap: "var(--harmo-space-2xs)" }}>
              <h2 id="copilot-ticket-title" style={{ margin: 0, fontSize: "var(--harmo-font-size-lg)", fontWeight: "var(--harmo-font-weight-medium)", lineHeight: 1.4 }}>
                Mug arrived cracked
              </h2>
              <p style={{ margin: 0, fontSize: "var(--harmo-font-size-sm)", color: "var(--harmo-color-text-secondary)" }}>
                Ticket #1042 · Maya Chen
              </p>
            </div>
            <Tooltip label="Open Copilot" hidden={open}>
              <Button
                ref={opener}
                variant="tertiary"
                size="small"
                onClick={() => {
                  flushSync(() => setOpen(true));
                  panel.current?.querySelector("textarea")?.focus();
                }}
              >
                <AssistantIcon className="hicon" />
              </Button>
            </Tooltip>
          </div>
          <p style={{ margin: 0, fontSize: "var(--harmo-font-size-sm)", lineHeight: "1.25rem" }}>
            Hi, my order #58213 came today and the lid of the travel mug is cracked. Could you send me a new one? I'd rather not have a refund. I wrote about this two days ago too.
          </p>
          <Field label="Reply">
            <TextArea ref={replyField} value={reply} placeholder="Write your reply" onChange={(event) => setReply(event.target.value)} />
          </Field>
          <Button style={{ justifySelf: "end" }}>Send reply</Button>
        </section>
        <div ref={panel} hidden={!open} style={{ flex: "1 1 20rem", blockSize: "34rem", background: "var(--harmo-color-background)" }}>
          <Copilot
            respond={askCopilot}
            context="Ticket #1042"
            suggestions={["Summarize this ticket", "Draft a reply"]}
            commands={[
              { name: "summarize", description: "Summarize this ticket" },
              { name: "draft", description: "Draft a reply" },
            ]}
            onFeedback={() => {}}
            onInsert={(text) => {
              setReply(text);
              replyField.current?.focus();
            }}
            onClose={() => {
              flushSync(() => setOpen(false));
              opener.current?.focus();
            }}
          />
        </div>
      </div>
    );
  },

  "Support chat": () => (
    <div
      style={{
        contain: "layout",
        blockSize: "40rem",
        background: "var(--harmo-color-background-secondary)",
        border: "1px solid var(--harmo-color-border)",
        borderRadius: "var(--harmo-border-radius)",
      }}
    >
      <SupportChat
        respond={askSupport}
        assistant={bot}
        greeting="Hi! I'm Fernhill Market's assistant. I can track an order or start a return, or find you a person to talk to."
        suggestions={topics}
        upload={upload}
        subscribe={subscribe}
        defaultOpen
      />
    </div>
  ),
};
