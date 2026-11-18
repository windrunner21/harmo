# Composer

Where a chat's message is written and sent, under a
[Conversation](conversation.md). The field and its buttons sit in one box,
which takes the field's border and focus ring, and the field grows with
what's written. Enter sends; Shift+Enter starts a new line. Send turns into
Stop while a reply comes, if it can be stopped. Above the field, the box can
hold what the assistant knows about, the message being edited, or the files
to send; under it, a note.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `composer.css`, `textarea.css`, `button.css`, `tooltip.css`; `file-list.css` to attach; `mentions.css`, `popup.css`, `listbox.css` for commands or mentions; `field.css` for an error |
| Element | `<form class="hcomposer">` |
| Parts | `<div class="hcomposer-box">` holding, in order, any of `.hcomposer-context`, `.hcomposer-editing`, a `.hfile-list`, and the attach Button in a Tooltip with `.hcomposer-attach`; then the `<textarea class="htextarea" rows="1">`, alone or in a `.hmentions`; then Send, in a Tooltip. After the box, an optional `<input type="file" hidden>`, `.herror`, and `.hcomposer-note` |
| Required | The field's name, such as `aria-label="Message"`; Send's, and Stop's and the attach Button's if it has them, from their Tooltips; the editing bar's words |
| Unique | Every id, and a Mentions' anchor name |
| Script | Required: to send, and for what changes; see [What a script does](#what-a-script-does) |

## Markup

```html
<form class="hcomposer">
  <div class="hcomposer-box">
    <textarea class="htextarea" aria-label="Message" placeholder="Ask anything" rows="1"></textarea>
    <span class="htooltip-trigger">
      <button class="hbutton" type="submit" disabled aria-labelledby="send-tip">
        <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true">…</svg>
      </button>
      <span class="htooltip" role="tooltip" id="send-tip">Send</span>
    </span>
  </div>
  <p class="hcomposer-note">Replies can be wrong. Check what matters.</p>
</form>
```

Send that turns into Stop holds both icons:

```html
<button class="hbutton" type="submit" aria-labelledby="send-tip">
  <span class="hicon hcomposer-send-icons" aria-hidden="true">
    <svg class="hcomposer-send-icon" viewBox="0 0 24 24">…</svg>
    <svg class="hcomposer-stop-icon" viewBox="0 0 24 24">…</svg>
  </span>
</button>
```

To attach files, the paperclip before the field, the files above it, and a
hidden file input and an error after the box:

```html
<div class="hcomposer-box">
  <ul class="hfile-list" role="list" aria-label="Attachments" tabindex="-1" hidden></ul>
  <span class="htooltip-trigger hcomposer-attach">
    <button class="hbutton" data-variant="tertiary" type="button" aria-labelledby="attach-tip">…</button>
    <span class="htooltip" role="tooltip" id="attach-tip">Attach files</span>
  </span>
  <textarea class="htextarea" …></textarea>
  …
</div>
<input type="file" multiple hidden />
<p class="herror" aria-live="polite"></p>
```

Editing a sent message, in the field, with a bar above it naming it:

```html
<div class="hcomposer-editing">
  <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true">…</svg>
  <div class="hcomposer-editing-text" id="editing">
    <p class="hcomposer-editing-title">Editing your message</p>
    <p class="hcomposer-editing-quote">Where's my order?</p>
  </div>
  <span class="htooltip-trigger">
    <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-labelledby="cancel-tip">…</button>
    <span class="htooltip" role="tooltip" id="cancel-tip">Cancel editing</span>
  </span>
</div>
<textarea class="htextarea" aria-label="Message" aria-describedby="editing" rows="1">Where's my order?</textarea>
```

For commands or mentions, the field is a [Mentions](mentions.md), its list
with `data-side="top"`.

## Options

| Hook | Effect |
| --- | --- |
| `.hcomposer-context` | What the assistant knows about, such as a [Tag](tag.md) naming the open ticket, above the field |
| `data-stopping` on Send | It shows Stop |
| `--hcomposer-column` | Its column, centered: `none`, the whole width, by default; `45rem`, as a Conversation's |

## Appearance and states

- The box is an input's: its background, border, and shadow, with corners
  6px rounder than a field's, as its buttons sit 6px inside. Focused from
  the keyboard, it takes the focus ring, at once.
- The field has no border of its own, its text 10px from the box's edge, and
  grows with what's written, to 200px, then scrolls.
- Send is a primary Button, icon only, at the foot of the box, and can't be
  pressed until something's written or attached. Turning into Stop and back,
  the icon leaving fades and shrinks in 150ms, the one arriving in 200ms;
  with reduced motion, they only fade.
- The attach Button is tertiary, before the field.
- The editing bar is 13px: its title in `--harmo-color-primary`, the quote
  in `--harmo-color-text-secondary`, each on one line, after a pencil and a
  2px line in the primary color.
- The note is 13px, in `--harmo-color-text-tertiary`, centered.

## Accessibility

- The field is named, and while editing, described by the bar, so a screen
  reader says what's being edited.
- Send's and Stop's names change with the button, from its Tooltip.
- A list that's open takes Enter, the arrows, and Escape first, so Enter
  picks a command rather than sending it.
- Sending, Stop, and the editing bar's button put focus back in the field,
  so the keyboard carries on: Send can't be pressed once the field is empty.
- Say what was wrong with a file in the `.herror`, a live region, as a File
  Input does.

## What a script does

| Change | When |
| --- | --- |
| Send, and focus the field | Enter in the field, without Shift, while no list is open and no input method is composing text, which Safari marks only with `keyCode` 229; or Send is pressed, as it can't be once the field is empty |
| Remove `disabled` from Send, or add it back | Something's written or attached, or it's cleared; Send can't be pressed while a reply comes unless it's Stop |
| Add `data-stopping` and `type="button"` to Send, and its Tooltip says Stop | A reply starts coming, if it can be stopped |
| Open the file input | The attach Button is pressed |
| Take the files | They're picked, or pasted into the field |
| Show the File List, or hide it with `hidden` | It has a file, or none |
| Add the editing bar and `aria-describedby`, and put the message in the field, the caret at its end | Your app edits a message, such as on ↑ in the empty field |
| Remove the bar and empty the field | Escape, or the bar's button |

`examples/html/src/scripts/composer.js` is an example.

## React

`<Composer>` renders the form, its box, and Send. Other props are the
field's, a [TextArea](textarea.md); `ref` is the field, and `className` and
`style` go on the form. Its text is yours with `value` and `onValueChange`,
or its own with `defaultValue`, which empties after sending.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required. The field's name |
| `onSend` | Required. Called with the text, on Enter or Send |
| `sendLabel` | Required. Send's name |
| `canSend` | Whether there's something to send: by default, whether something's written; give it `true` when files are attached |
| `replying` | A reply is coming: Send can't be pressed, or it's Stop |
| `stopLabel`, `onStop` | Send turns into Stop while `replying` |
| `attachLabel`, `onFiles`, `accept` | The attach Button, and the files picked or pasted |
| `files` | The files to send, such as a [File List](file-list.md) with `onRemove`, `hidden` when it has none |
| `context` | What the assistant knows about, above the field |
| `editing` | `{ title, text, cancelLabel, onCancel }`: the editing bar, with the message's text; Escape calls `onCancel` too |
| `onEditLast` | Called on ↑ in the empty field; return `true` if you've started editing, and the caret goes to the end |
| `error` | What was wrong, such as with a file |
| `note` | The line under it |
| `listLabel`, `trigger`, `atStart`, and [Options](listbox.md#react) as children | The field is a [Mentions](mentions.md), its list over the field; or a `MentionsTrigger` for each trigger as children, for several, such as `@` and `/` |

```tsx
<Composer
  aria-label="Message"
  placeholder="Ask anything"
  sendLabel="Send"
  stopLabel="Stop"
  replying={replying}
  onStop={stop}
  onSend={send}
  note="Replies can be wrong. Check what matters."
/>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-focus`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-duration-fast`, `--harmo-duration-normal`,
`--harmo-ease-out-cubic`, `--harmo-font-family`, `--harmo-font-size-xs`,
`--harmo-font-weight-medium`, `--harmo-input-box-shadow`,
`--harmo-input-color-background`, `--harmo-input-color-border`,
`--harmo-space-2xs`, `--harmo-space-xs`
