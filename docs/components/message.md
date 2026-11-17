# Message

One message in a conversation. Yours sits at the end, in a bubble; the
assistant's at the start, as plain text across the conversation, or in a
bubble beside its avatar; a line from the conversation itself, such as
someone joining, in the middle. Under its text, it can have its time, its
actions, quick replies, or "Not sent" with a way to try again; above it, its
files. Messages go in a [Conversation](conversation.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `message.css`; `link.css` for "Not sent"; `avatar.css`, `button.css`, `file-list.css`, `prose.css` for what's in it |
| Element | `<li class="hmessage" data-from="user">`, `"assistant"`, or `"system"`, in a Conversation's list |
| Parts | An optional `<span class="hmessage-avatar">`, then `<div class="hmessage-body">` holding, in order, its files (a `.hfile-list`), `.hmessage-text`, `<time class="hmessage-time">`, `.hmessage-actions`, `.hmessage-failed`, and `.hmessage-suggestions`. A system line holds only its text |
| Required | Each icon-only action's name; quick replies' group name, such as `aria-label="Suggested replies"`; the failed line's words, in your app's language |
| Unique | Each Tooltip's id |
| Script | None; adding messages and what changes in them is your app's, see [What a script does](#what-a-script-does) |

## Markup

```html
<ol class="hconversation-list">
  <li class="hmessage" data-from="user">
    <div class="hmessage-body">
      <div class="hmessage-text">Summarize last week's conversations</div>
    </div>
  </li>
  <li class="hmessage" data-from="assistant">
    <div class="hmessage-body">
      <div class="hmessage-text"><div class="hprose">…</div></div>
      <div class="hmessage-actions">…</div>
    </div>
  </li>
  <li class="hmessage" data-from="system">Imran joined the conversation</li>
</ol>
```

A reply in a bubble, beside an avatar:

```html
<li class="hmessage" data-from="assistant" data-bubble>
  <span class="hmessage-avatar"><img class="havatar" src="/imran.webp" alt="" /></span>
  <div class="hmessage-body">
    <div class="hmessage-text">Hi, I'm Imran from the support team.</div>
    <time class="hmessage-time" datetime="2026-11-18T09:42:00Z">9:42 AM</time>
  </div>
</li>
```

While a reply is on its way:

```html
<li class="hmessage" data-from="assistant" aria-hidden="true">
  <div class="hmessage-body">
    <p class="hmessage-text hmessage-typing"><span></span><span></span><span></span></p>
  </div>
</li>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-from` | `"user"`: at the end, in a bubble, its line breaks kept. `"assistant"`: at the start. `"system"`: a line in the middle |
| `data-bubble` | The assistant's text in a bubble too |
| `data-accent` | Yours in `--harmo-color-primary-fill`, with `--harmo-color-on-primary` text, as in a support chat |
| `.hmessage-avatar` | An avatar column: its avatar on the first of a run; an empty one, `aria-hidden="true"`, keeps the later ones in line |
| `data-new` | It fades in, as it arrives. Leave it off what's there as the page loads, and remove it at its own `animationend` |
| `aria-busy="true"` on `.hmessage-text` | A reply still coming in |
| `--hmessage-bubble-color` | The bubbles: `--harmo-color-background-secondary`, or `--harmo-color-background-active` in dark mode |
| `--hmessage-bubble-radius` | Their corners: 16px |

## Appearance and states

- Its text takes the conversation's size and line height. A long word or
  address breaks rather than widening it.
- Its parts are 6px (`--harmo-space-2xs`) apart.
- A bubble is at most 85% of the conversation's width, or of what's beside
  its avatar, and 576px, with 6px by 10px of padding and 16px corners.
- The files sent with it are 288px wide, or less where there isn't room.
- An avatar is 32px, 6px from its bubble.
- The time is 12px, in `--harmo-color-text-tertiary`, in the reader's own
  format and time zone.
- Actions sit 2px apart; quick replies, secondary small Buttons, 6px apart.
- "Not sent." is 13px, in `--harmo-color-danger`, its button a Link.
- A system line is 13px, in `--harmo-color-text-tertiary`, centered.
- The typing dots are 6px, in `--harmo-color-text-secondary`, each rising 2px
  in turn, 150ms after the last, over 1.2 seconds.
- With `data-new`, a reply fades in over 200ms (`--harmo-duration-normal`).
  Yours never does: you just sent it.
- With reduced motion, the dots hold still; the fade stays.
- In forced-colors mode, a bubble has a border.

## Accessibility

- The typing message is hidden from screen readers; the conversation's status
  says when the reply is whole.
- Each icon-only action, such as Copy or a rating, is named, by `aria-label`
  or a Tooltip; a rating is a toggle, with `aria-pressed`.
- An avatar that repeats the author's name has `alt=""`.
- The time is a `<time>` with `datetime`, so it's read as a time.
- Quick replies are a group, named, so a screen reader says what they are.

## What a script does

| Change | When |
| --- | --- |
| Add the message, with `data-new` if it's a reply | It's sent, or a reply comes |
| Remove `data-new` | At its own `animationend` |
| Its text, piece by piece, with `aria-busy="true"` until it's whole | A reply streams in |
| Add `.hmessage-failed` | It didn't send |
| Toggle a rating's `aria-pressed`, and the other's off | A rating is pressed |

`examples/html/src/scripts/message.js` is an example, with `button.js` for
the toggles.

## React

`<Message>` renders the item, a reply settling in as it arrives: not one
that was there as the page loaded, or as its Conversation opened, such as a
kept conversation. What it
holds is its text: a string, or [Prose](prose.md) for a reply. Other props
are the item's.

| Prop | Effect |
| --- | --- |
| `from` | Required. `"user"`, `"assistant"`, or `"system"` |
| `bubble` | The assistant's text in a bubble |
| `accent` | Yours in the accent |
| `avatar` | The avatar column, with this avatar; `null` keeps the column empty, for a run's later messages |
| `time` | A `Date`, shown in the person's own time format and time zone, which only the browser knows: on the server, the `<time>` has its `datetime` and no words |
| `files` | Above the text, such as a [File List](file-list.md) with nothing to press |
| `actions` | Under it, such as a Copy Button |
| `suggestions`, `suggestionsLabel` | Quick replies, such as small secondary Buttons, and their group's name |
| `failed` | `{ message, retryLabel, onRetry }`: "Not sent." and its button |
| `typing` | The three dots, in place of text; hidden from screen readers |
| `busy` | A reply still coming in: `aria-busy` on its text |

```tsx
<Message from="user">Summarize last week's conversations</Message>
<Message from="assistant" actions={<CopyButton value={reply} label="Copy" copiedLabel="Copied" size="small" />}>
  <Prose text={reply} />
</Message>
```

## Tokens

`--harmo-avatar-size`, `--harmo-border-radius`,
`--harmo-color-background-active`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-on-primary`,
`--harmo-color-primary-fill`, `--harmo-color-text-secondary`,
`--harmo-color-text-tertiary`, `--harmo-duration-normal`,
`--harmo-ease-out-cubic`, `--harmo-font-family`, `--harmo-font-size-2xs`,
`--harmo-font-size-xs`, `--harmo-space-2xs`, `--harmo-space-xs`
