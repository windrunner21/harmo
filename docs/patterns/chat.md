# Chat

A conversation with an assistant, ready to copy into your app. There are three,
one for each place a chat sits:

| Use case | React | What it is |
| --- | --- | --- |
| An AI chat | `AiChat` | The whole page: a greeting and prompts to start with, then replies that stream in, with Copy, feedback, Try again, and Stop, beside a list of past chats if you keep them |
| A copilot | `Copilot` | A panel beside your app's content, which knows what's open there, and puts a reply into it with Insert |
| A support chat | `SupportChat` | A window over a corner of the page, opened by its launcher, with quick replies, a handoff to a person, and the time of each message |

All three share the conversation and the composer you write in, with `/`
commands and attached files, in React and in HTML. They're built from Harmo's
[Conversation](../components/conversation.md),
[Message](../components/message.md), [Composer](../components/composer.md),
and, for the support chat, [Launcher](../components/launcher.md), as
[Built with](#built-with) lists.

## Try the demo

The playground's chats answer as your service would, after a moment. Type
these to see each answer:

| Chat | Type | You see |
| --- | --- | --- |
| AI chat | One of the prompts, or `/` and a command | A reply that streams in, a word at a time, with lists and bold |
| AI chat | `/embed` | A reply with a block of code |
| AI chat | Anything else | A reply saying what it can answer |
| AI chat | Attach, drop, or paste files, then send | A reply that counts them |
| AI chat | A chat in the list | That conversation; New chat starts another, listed once it has a reply |
| Copilot | `Summarize this ticket`, or `Draft a reply` | A reply; Insert puts a draft into the ticket's reply |
| Support chat | `Where's my order?` or `Start a return` | A reply, with a link, and quick replies under it |
| Support chat | `Talk to a person`, then close the window | Imran joins; a few seconds later, a follow-up from Imran shows as a count on the launcher |
| Support chat | Attach a file whose name starts with `fail` | Its upload stops halfway, with Try again; it uploads the second time |
| Any | Anything with `fail` in it | "Not sent." under your message, with Try again |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| Your server | An endpoint that answers: your AI service, called from your server so its key stays there, or your support bot and help desk. And a rate limit |
| Files | Only if people attach them: storage the browser uploads to, such as Amazon S3 or Cloudflare R2, or an endpoint that takes them with the message |
| A person answering | Only for a handoff: a way to push their messages to the page, such as server-sent events or a WebSocket |
| Conversations | Only if you keep them: somewhere to store each one, such as your database |

[Security](#security) says what your server must do.

## React

### Install

```sh
npx harmo-ui add chat
```

It copies into `components/harmo/patterns/`:

- `chat/`, the three chats; `Messages.tsx` and `Composer.tsx`, which fill
  Harmo's Conversation and Composer for them; `useChat.ts`, which holds the
  conversation and asks for each reply; `icons.tsx`; and `chat.css`, which
  lays them out;
- `attachments/attachments.ts`, which holds and uploads the files, as the
  [Contact Form](contact-form.md) does too.

It also copies the Harmo components they use, and adds the stylesheet to
`harmo.css`. Delete the chats you don't need. Without the CLI, copy the same
files from [examples/react/src/patterns](../../examples/react/src/patterns),
and set them up as [Patterns](README.md#install) says.

### Use it

Each chat takes `respond`: a function that gets the conversation so far and
returns the reply. To stream an AI service's reply, as it writes it, return
its text as it comes:

```tsx
// app/assistant/Assistant.tsx
"use client";

import { AiChat } from "@/components/harmo/patterns/chat/AiChat";
import type { Respond } from "@/components/harmo/patterns/chat/useChat";

// The response's text, a piece at a time.
async function* textOf(response: Response) {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    yield value;
  }
}

const respond: Respond = async (conversation, { signal }) => {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation }),
    signal,
  });
  if (!response.ok) throw new Error(`The assistant answered ${response.status}.`);
  return textOf(response);
};

export function Assistant() {
  return <AiChat respond={respond} suggestions={["Summarize last week's conversations"]} />;
}
```

Your endpoint checks who's asking, then passes the conversation to your AI
service, and its reply's text on as it comes:

```ts
// app/api/assistant/route.ts
export async function POST(request: Request) {
  const user = await signedInUser(request);
  if (!user) return new Response(null, { status: 401 });
  if (await tooMany(user)) return new Response(null, { status: 429 });

  const { conversation } = await request.json();
  return new Response(await replyStream(conversation, { signal: request.signal }));
}
```

`signedInUser`, `tooMany`, and `replyStream` stand for your app's own:
`replyStream` asks your AI service, with its key, and returns a
`ReadableStream` of the reply's text. A chat fills its parent's height, so
give it one, such as the page's height under its header. Before you ship it,
go through [Security](#security).

A support bot that answers whole messages returns a [reply](#answers) instead:

```tsx
<SupportChat
  assistant={{ name: "Speedwagon", role: "AI assistant" }}
  greeting="Hi! How can I help?"
  suggestions={["Where's my order?", "Talk to a person"]}
  respond={async (conversation, { signal }) => {
    const response = await fetch("/api/support", { method: "POST", body: JSON.stringify({ conversation }), signal });
    if (!response.ok) throw new Error(`Support answered ${response.status}.`);
    return response.json();
  }}
/>
```

### Commands

Give the AI chat or the copilot `commands`. Typing `/` at the start of a
message lists those whose name or description has what follows it, in a
[Mentions](../components/mentions.md). Choosing one puts it in the field, such
as `/summarize `, to send as it is or with more after it:

```tsx
<Copilot
  respond={respond}
  commands={[
    { name: "summarize", description: "Summarize this ticket" },
    { name: "draft", description: "Draft a reply" },
  ]}
/>
```

A command is only text: your service reads `/summarize` at the start of a
message and does what it means.

### Files

Give the AI chat or the support chat `attach`. Files come from its Attach
files button, dropped anywhere on the chat, or pasted in the field, such as a
screenshot. They show above the field, up to five of 10 MB each, and go with
the message. `respond` gets them on each of your turns, as `files`.

Give it `upload` instead, and each file uploads to your storage as it's
added, with its progress, and a way to try again if it fails. Sending waits
for the uploads, and `files` holds the keys they're stored under. It's the
same `upload` as the Contact Form's, so
[Upload to storage](contact-form.md#upload-to-storage) shows how to sign an
upload, and `putFile`, from `attachments/attachments.ts`, puts the file
there:

```tsx
<SupportChat
  respond={respond}
  upload={async (file, report) => {
    const { url, key } = await signUpload({ name: file.name, type: file.type, size: file.size });
    await putFile(url, file, report);
    return key;
  }}
  assistant={{ name: "Speedwagon" }}
  greeting="Hi! How can I help?"
/>
```

### Messages your server sends

A person who's taken over a support chat writes whenever they like, not only
in answer. Give `SupportChat` `subscribe`: it gets a `receive` function to
call with each such message, as a [reply](#answers), and returns what stops
it:

```tsx
<SupportChat
  respond={respond}
  subscribe={(receive) => {
    const events = new EventSource("/api/support/events");
    events.addEventListener("message", (event) => receive(JSON.parse(event.data)));
    return () => events.close();
  }}
  assistant={{ name: "Speedwagon" }}
  greeting="Hi! How can I help?"
/>
```

While the window is closed, the launcher counts what came, and a screen
reader hears who it's from.

### Past chats

To let people come back to a conversation, keep each one, and list them in a
[Sidebar](../components/sidebar.md) beside the AI chat. `messages` opens a
kept conversation, and `onSave` gets it each time a reply ends, to keep. Give
each conversation its own `key`, so opening another starts afresh:

```tsx
<Sidebar aria-label="Chats" header={<Button onClick={startNew}>New chat</Button>}>
  <SidebarGroup label="Today">
    {today.map((chat) => (
      <SidebarItem key={chat.id} href={`/chats/${chat.id}`} current={chat.id === current}>
        {chat.title}
      </SidebarItem>
    ))}
  </SidebarGroup>
</Sidebar>
<AiChat key={current} messages={open?.messages} onSave={(messages) => keep(current, messages)} respond={respond} />
```

Group them by when they were last used, in the person's own time zone, such
as "Today" and "Previous 7 days", and title each by its first message, or ask
your AI service for a title.

### Feedback, editing, and times

- **Feedback**: give the AI chat or the copilot `onFeedback`, and each reply
  has Good reply and Bad reply under it. It's called with the reply and
  `"good"`, `"bad"`, or `undefined` when a second press takes it back. Keep it
  with the reply on your server.
- **Editing**: in the AI chat and the copilot, your last message has Edit
  under it once its reply has come, and the up arrow in an empty field does
  the same. Your message goes back in the field, under a bar that quotes it,
  as in a messenger. Sending removes the message and its reply, and asks
  again from there; Escape, or the bar's close button, puts back what you'd
  typed.
- **Times**: the support chat shows when each message was sent, under the last
  of each run, in the person's own time format.

### Props

Every chat takes:

| Prop | |
| --- | --- |
| `respond` | Required. A function that gets the conversation so far and `{ signal }`, and returns the [reply](#answers). `signal` aborts when the reply is stopped |

Then each takes its own:

| Prop | On | |
| --- | --- | --- |
| `suggestions` | All three | Prompts to start with, under the greeting; for a support chat, quick replies under its greeting |
| `commands` | `AiChat`, `Copilot` | The `/` commands, each `{ name, description }` |
| `onFeedback` | `AiChat`, `Copilot` | Called when a reply is rated, as [Feedback](#feedback-editing-and-times) says. Without it, there's no rating |
| `attach` | `AiChat`, `SupportChat` | Files, from the Attach files button, dropped, or pasted, which go with the message |
| `upload` | `AiChat`, `SupportChat` | Uploads each file as it's added, and returns its key, as [Files](#files) says. It also turns on `attach` |
| `messages` | `AiChat` | A kept conversation to open, as [Past chats](#past-chats) says |
| `onSave` | `AiChat` | Called with the conversation each time a reply ends |
| `titleAs` | `AiChat`, `Copilot` | The tag of the greeting, or of the copilot's title: `"h2"` by default |
| `context` | `Copilot` | What it knows about, such as `"Ticket #1042"`, as a Tag above the field |
| `onInsert` | `Copilot` | Called with a reply's text when Insert under it is pressed. Without it, there's no Insert |
| `onClose` | `Copilot` | Called when its close button is pressed. Without it, there's no close button |
| `assistant` | `SupportChat` | Required. Who answers: `{ name, role, avatar }`. `role` is the line under the name, and `avatar` an [Avatar](../components/avatar.md); without one, the name's initials |
| `greeting` | `SupportChat` | Required. The first message, there as the window opens |
| `subscribe` | `SupportChat` | Takes messages your server sends on its own, as [Messages your server sends](#messages-your-server-sends) says |
| `defaultOpen` | `SupportChat` | Whether the window is open as the page loads. Closed by default |

### Answers

`respond` returns one of these, or a promise of one:

| Return | The chat |
| --- | --- |
| A string | Shows it as the reply |
| `{ text, suggestions?, from? }` | Shows `text`, with `suggestions` as quick replies under it while it's the last message. `from`, `{ name, role, avatar }`, is someone new answering, such as a person taking over: the chat says they joined, and their name, role, and avatar take the header |
| An async iterable of strings | Shows each piece as it comes, such as an AI service's reply as it's written |

A reply's text can have paragraphs, lists starting with `-` or `1.`, blocks
of code between lines of three backticks, and in them `**bold**`, `` `code` ``,
and links, written out or as `[text](address)`. Anything else shows as it's
written.

If it throws, or a stream breaks, your message says "Not sent.", with Try
again. Stop aborts `signal` and keeps what came. A reply without `from` comes
from whoever answered last.

The conversation `respond` gets is each message's `role`, `"user"` or
`"assistant"`, its `text`, and with files, `files`: the files, or with
`upload`, their keys. Messages that didn't send are left out.

### Without JavaScript

A chat needs JavaScript: before its script runs, the composer shows, but
nothing sends. Link to another way to reach you, such as a
[Contact Form](contact-form.md), where it matters.

## HTML

### Markup

A chat is a grid of a header, a [Conversation](../components/conversation.md),
and a [Composer](../components/composer.md). The playground shows each chat's
whole markup; these are the chat's own parts, and the components' docs say
the rest.

```html
<div class="hchat hdrop-zone" data-variant="ai">
  <!-- Copilot and support only -->
  <header class="hchat-header">
    <span class="havatar" aria-hidden="true">…</span>
    <div class="hchat-header-text">
      <p class="hchat-title">Speedwagon</p>
      <p class="hchat-subtitle">AI assistant · Replies right away</p>
    </div>
    <div class="hchat-header-actions">…Close…</div>
  </header>

  <div class="hconversation hchat-conversation" role="region" aria-label="Conversation" tabindex="0" data-size="large">
    <p class="hconversation-status" aria-live="polite"></p>
    <div class="hconversation-empty">
      <div class="hchat-greeting">
        <h2 class="hchat-greeting-title">What can I help with?</h2>
        <div class="hchat-suggestions" role="group" aria-label="Suggestions">…</div>
      </div>
    </div>
    <ol class="hconversation-list" hidden></ol>
    <div class="hconversation-latest">…Jump to latest…</div>
  </div>

  <form class="hcomposer hchat-composer">…</form>

  <!-- Where files can be attached -->
  <div class="hdrop-zone-overlay" aria-hidden="true">
    <p class="hdrop-zone-label">Drop files to attach</p>
  </div>
</div>
```

Each message is a [Message](../components/message.md), a reply's text a
[Prose](../components/prose.md):

```html
<li class="hmessage" data-from="assistant" data-new>
  <div class="hmessage-body">
    <div class="hmessage-text"><div class="hprose">…</div></div>
    <div class="hmessage-actions">…Copy, Good reply, Bad reply, Try again…</div>
  </div>
</li>
```

With commands, the Composer's field is a [Mentions](../components/mentions.md),
its list over the field. A support chat goes in a
[Launcher](../components/launcher.md)'s panel, its field marked
`data-autofocus`; its Conversation has `data-align="end"`, its replies
`data-bubble` beside an `.hmessage-avatar`, and yours `data-accent`.

Past chats are a [Sidebar](../components/sidebar.md) beside the chat, named
"Chats", its current link with `aria-current="page"`.

### Built with

| Part | Harmo component |
| --- | --- |
| The conversation, Jump to latest, and the status | [Conversation](../components/conversation.md) |
| Each message, its time, actions, quick replies, and "Not sent" | [Message](../components/message.md) |
| A reply's text | [Prose](../components/prose.md) |
| The composer, Send and Stop, attaching, and editing | [Composer](../components/composer.md) |
| The commands | [Mentions](../components/mentions.md) |
| The files, to send and sent | [File List](../components/file-list.md) |
| Files dragged over the chat | [Drop Zone](../components/drop-zone.md) |
| The support chat's window, and its count | [Launcher](../components/launcher.md), [Badge](../components/badge.md) |
| Copy, the ratings, and the other buttons | [Copy Button](../components/copy.md), [Button](../components/button.md) with `aria-pressed`, [Tooltip](../components/tooltip.md) |
| Avatars, a copilot's context, and past chats | [Avatar](../components/avatar.md), [Tag](../components/tag.md), [Sidebar](../components/sidebar.md) |

### Classes

The chat's own, in `chat.css`:

| Class or attribute | What it's for |
| --- | --- |
| `.hchat` | The chat: its header, conversation, and composer, filling its parent's height. Where files can be attached, it's the Drop Zone too |
| `data-variant` on `.hchat` | `"ai"`: the conversation and composer in a 720px column. `"copilot"`: a panel. `"support"`: a Launcher's panel, its corners inside the panel's border |
| `.hchat-header`, `.hchat-header-text`, `.hchat-title`, `.hchat-subtitle`, `.hchat-header-actions` | Who's answering, and the buttons at the end. An icon or an `.havatar` goes first |
| `.hchat-conversation` | Its Conversation, in the grid |
| `.hchat-composer` | Its Composer, 16px from the sides and the foot |
| `.hchat-greeting`, `.hchat-greeting-title` | What shows before anything's sent, in the Conversation's `.hconversation-empty` |
| `.hchat-suggestions` | The prompts to start with |

### What your script does

[chat.js](../../examples/html/src/scripts/chat.js) is an example. The
components' own example scripts do their parts, as their docs say:
`conversation.js` keeps the conversation at its latest message and shows Jump
to latest; `mentions.js` and `listbox.js` list the commands; `drop-zone.js`
frames files dragged over the chat; `launcher.js` opens and closes the
support chat and counts what came while it was closed; `copy.js`,
`file-list.js`, and `sidebar.js` do the rest.

**On send**, by Enter or the send button: call `preventDefault()`, and stop if
there's nothing to send, a reply is on its way, or the commands are listed.
Shift+Enter starts a new line, and Enter while an input method is composing,
such as for Japanese, doesn't send.

1. With uploads, wait for those still running. If a file didn't upload, put
   "Some files didn't upload. Try them again, or remove them." in the
   Composer's `.herror`, and stop.
2. Add your message, with its files' rows copied into a File List with
   nothing to press. Hide `.hconversation-empty`, show the list, empty the
   field and the files, and keep focus in the field.
3. Add the typing dots.
4. Send the conversation to your service: each message's role, text, and
   files, but those that didn't send.
5. Turn Send into Stop, where a reply can be stopped, as the Composer's docs
   say. Elsewhere, disable it.

**As the reply comes**: take the dots away, and add the reply with
`data-new`. Build its Prose as elements, setting `textContent`, never
`innerHTML`: only `http`, `https`, and `mailto` addresses become links, each
with `target="_blank"` and `rel="noreferrer"`. Streamed, build it again with
each piece, with `aria-busy="true"` on its `.hmessage-text` until it's whole.
Once whole, take `aria-busy` off, add its actions and its quick replies, put
its text, without the formatting's marks, in the Conversation's status, and
turn Stop back into Send. From someone new, add a `data-from="system"`
Message saying they joined, and put their name, role, and avatar in the
header. A message your server sends on its own shows the same way.

**If it fails**: take the dots and any part of the reply away, add
`.hmessage-failed` to your message, and put "Your message didn't send." in
the status. Its Try again removes the message and sends it again, at the
end. **Stop** aborts the request and keeps what came. **Try again** under the
last reply removes it and asks again.

**Ratings**: a press sets that button's `aria-pressed="true"`, and the other's
`false`; a second press sets both `false`.

**Editing**: while no reply is on its way, put Edit under your last message.
It, or the up arrow in an empty field, keeps what's in the field, puts the
message there, with the caret at its end, and adds the Composer's editing
bar. Hide Attach files and the files to send meanwhile: an edit keeps the
message's own. Escape, or the bar's close button, takes the bar away and puts
back what was kept. Sending removes the message and all after it, and sends
the edit as a new one.

**Files**: Attach files clicks the hidden input; files dropped on the chat,
or pasted in the field, are attached as chosen ones are. Turn down a file
over 10 MB, or more than five, with a message in the Composer's `.herror`.
List the rest as [File List](../components/file-list.md) describes, and show
the list. With uploads, upload each as it's added, as the
[Contact Form](contact-form.md#what-your-script-does) does. Once the last file
is removed, hide the list, and move focus to the field.

**Times**: in a support chat, put a `.hmessage-time` under the last message
of each run: yours, or one person's.

**A support chat's count**: while its Launcher's panel is closed, count each
message that comes on the Launcher, as its docs say, with who it's from.

**Past chats**: a chat in the list opens its conversation in place, moving
`aria-current="page"` to it. New chat starts an empty one. Once its first
reply has come, list it first under Today, titled by its first message.

## Security

What the browser sends is never trusted: anyone can send your endpoint
anything. Your server must:

- **Keep your AI service's key on your server.** The browser calls your
  endpoint, never the service itself.
- **Check who's asking, and limit how often**, by account, or by network
  address for someone signed out, before you call a service that costs. Cap
  how long a message, and a conversation, can be.
- **Not trust the conversation it's sent.** Anyone can change it, writing the
  assistant's turns as well as their own. Where it matters, keep the
  conversation on your server and send only the new message. A copilot's
  context, such as the ticket, comes from your server too, checked against
  what the person may see.
- **Treat a reply as untrusted text.** An AI service can be talked into
  writing anything. The chats show its formatting as elements, never as HTML,
  and link only to web and email addresses. If you swap in a Markdown library,
  sanitize the HTML it makes, and never add a reply's text with `innerHTML`.
- **Do only what the person may do.** A command, or a reply, is text: your
  server checks permissions before it acts on one.
- **Check files on the server**, as the
  [Contact Form's Security](contact-form.md#security) says, and with `upload`,
  take only keys you made.
- **Keep each person's conversations their own.** Look up a kept chat, and
  the messages your server pushes, by the signed-in account, never by an id
  the browser sends alone.

## Customize

- **Words**: they're written in, in English, such as the greeting and the
  placeholders. Change them in your copy, or put your app's translation calls
  in their place.
- **Formatting**: a reply is a [Prose](../components/prose.md), which shows
  paragraphs, lists, code, bold, and links. For more, such as tables, render
  a reply's text in `Messages.tsx` with your Markdown library instead, and
  sanitize what it makes.
- **Icons**: the chat's own are in `icons.tsx`. Use your app's, with
  `className="hicon"` on each, so Buttons size them. Send, Stop, Attach
  files, Jump to latest, and the Launcher's close icon are the components'.
- **Where files come from**: Attach files opens the file picker. If your app
  has other sources, such as Google Drive or a camera, put a
  [Menu Button](../components/menu-button.md) in its place, with an item for
  each.
- **File limits**: `most` and `largest`, at the top of `Composer.tsx`. Check
  them again on your server.
- **The look**: the components' custom properties, such as
  `--hmessage-bubble-color` on `.hmessage` for the bubbles,
  `--hconversation-column` and `--hcomposer-column` for the AI chat's column,
  which `chat.css` sets to 720px, and `--hlauncher-offset` and
  `--hlauncher-size` on `.hlauncher` for the support chat's corner.

## Accessibility

- The conversation is a region named "Conversation", which takes focus, so
  the keyboard can scroll it.
- A screen reader hears each reply once, when it's whole, through the
  Conversation's status, without the formatting's marks: not each piece as it
  streams in. It also hears someone joining, "Stopped.", and a message that
  didn't send. The dots are hidden from it, and a reply still coming has
  `aria-busy`.
- The field is named "Message". Focus stays in it as you send, and comes back
  to it from Stop, a suggestion, a command, a drop, Edit, and Jump to
  latest.
- The commands are a Mentions: the arrow keys move through them while focus
  stays in the field, whose `aria-activedescendant` names the one
  highlighted, so a screen reader reads it.
- Every icon-only button, Send, Stop, Attach files, Copy, Good reply, Bad
  reply, Try again, Edit, New chat, Close, and Jump to latest, is named by its
  tooltip. A rating says whether it's pressed, with `aria-pressed`.
- Dropping files is an extra for a pointer: Attach files and pasting do the
  same from the keyboard, so the frame is hidden from screen readers.
- Links in a reply are underlined, so color isn't the only thing that marks
  them, and open in a new tab, leaving the conversation where it was.
- Editing keeps focus in the field, which the bar describes, so a screen
  reader says it's your message being edited. Escape cancels.
- A support chat is a Launcher's panel, a dialog that isn't modal: the page
  stays usable while it's open, and Escape inside it closes it, moving focus
  to the Launcher's button. While it's closed, the button's name says how
  many came, and the Launcher's status says who from.
- Each time is a `<time>` with `datetime`.
- The chat list is a navigation named "Chats", its open conversation marked
  `aria-current="page"`.
- Each upload's progress bar is named by its file, and a failed upload's
  "Try again" is described by it. Once the last file is removed, focus moves
  to the field.
- With reduced motion, nothing moves: the window, Jump to latest, and the
  launcher's count only fade, and the dots hold still.

## Design details

The components' docs give their own: the [Conversation](../components/conversation.md),
each [Message](../components/message.md), the
[Composer](../components/composer.md), and the
[Launcher](../components/launcher.md). The chat adds:

- A grid of the header, the conversation, and the composer; only the
  conversation scrolls. The composer is 16px (`--harmo-space-sm`) from the
  sides and the foot.
- The header: 10px of padding, 16px at the start, and a 1px border under
  it; the title 14px medium, the subtitle 13px in
  `--harmo-color-text-secondary`, each on one line.
- The greeting, 20px medium, and its prompts sit in the middle until
  something's sent.

**The AI chat**, `AiChat`: 15px text on 24px lines, for reading long replies,
the conversation and the composer in a column at most 720px wide. Replies are
plain text across the column, with Copy, Good reply, Bad reply, and Try again
on the last. A line under the composer says AI can make mistakes.

**The copilot**, `Copilot`: 14px text, in a panel. Its header has an icon in
`--harmo-color-primary`, the title, and New chat and close. Replies have
Insert, a small secondary Button, then Copy and the ratings.

**The support chat**, `SupportChat`: in a Launcher's panel, 384px wide and
600px tall at most, the whole screen on a phone. Messages gather at the
bottom, nearest the field. Replies are bubbles too, beside an avatar on the
first of each run; yours are in the accent. Each run's last message shows
its time.
