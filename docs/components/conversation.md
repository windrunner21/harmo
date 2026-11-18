# Conversation

The scrolling log a chat's [Messages](message.md) are in. It opens at the
latest and stays there as messages come and grow, unless you've scrolled up
to read; then Jump to latest shows at its foot. Sending a message brings it
back to the latest. A visually hidden status says what arrived, for screen
readers.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `conversation.css`, `message.css`, `button.css`, `tooltip.css`; `empty-state.css` for what shows before the first message |
| Element | `<div class="hconversation" role="region" aria-label="…" tabindex="0">` |
| Parts | In order: `<p class="hconversation-status" aria-live="polite">`; an optional `.hconversation-empty`; `<ol class="hconversation-list">` of `.hmessage`s; and `.hconversation-latest`, holding Jump to latest, a Button in a Tooltip |
| Required | The region's name, such as `aria-label="Conversation"`; Jump to latest's name, from its Tooltip; a height, from its layout or your own |
| Unique | Jump to latest's Tooltip id |
| Script | Required: to stay at the latest and show Jump to latest; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hconversation" role="region" aria-label="Conversation" tabindex="0">
  <p class="hconversation-status" aria-live="polite"></p>
  <ol class="hconversation-list">
    <li class="hmessage" data-from="user">…</li>
    <li class="hmessage" data-from="assistant">…</li>
  </ol>
  <div class="hconversation-latest">
    <span class="htooltip-trigger">
      <button class="hbutton" data-variant="secondary" type="button" aria-labelledby="latest-tip">
        <svg class="hicon" viewBox="0 0 25 25" aria-hidden="true">…</svg>
      </button>
      <span class="htooltip" role="tooltip" id="latest-tip">Jump to latest</span>
    </span>
  </div>
</div>
```

Before the first message, what shows goes in `.hconversation-empty`, and the
list is `hidden`:

```html
<div class="hconversation-empty">
  <div class="hempty-state" data-size="small">…</div>
</div>
<ol class="hconversation-list" hidden></ol>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-align="end"` | A short conversation sits at the foot, nearest the field, as in a messenger |
| `data-size="large"` | 15px text on 24px lines, for an assistant's long replies |
| `--hconversation-column` | The messages' column, centered: `none`, the whole width, by default; `45rem` reads well across a page |

## Appearance and states

- 14px text on 20px lines, `--harmo-color-text`, which its Messages take, a
  reply's [Prose](prose.md) too, whatever its line height is set to.
- 16px of padding (`--harmo-space-sm`), and its messages 16px apart.
- What shows before the first message is centered.
- Jump to latest is a round secondary Button, opaque, with a small shadow,
  sticking to the foot over the messages. It rises in over 200ms
  (`--harmo-duration-normal`) and drops away over 150ms
  (`--harmo-duration-fast`); with reduced motion, it only fades.
- Focused from the keyboard, the region has a 2px inset focus ring.
- Scrolling stops at its edges, rather than scrolling the page.

## Accessibility

- It's a named region, focusable, so the keyboard can scroll it.
- The list of messages isn't a live region, as a reply streaming in would be
  read word by word. Put what arrived, whole, in the status: a reply as text
  once it's done, or "Imran joined the conversation".
- Jump to latest is named by its Tooltip, and hidden when you're at the
  latest. In the React Conversation, `onJump` is where to put focus back in
  the composer.

## What a script does

| Change | When |
| --- | --- |
| Scroll to the end | It's shown, and whenever its messages change, such as a reply's words streaming in, or it or its list changes size, while you're within 32px of the end |
| Scroll to the end, and count you as there | A message of yours is added |
| Add `data-open` to `.hconversation-latest`, or remove it | You scroll more than 32px from the end, or back |
| Scroll to the end, smoothly unless motion is reduced, and keep following it there as messages grow on the way, until you scroll yourself, the scrolling ends (`scrollend`), or the list moves back up; a browser may not report the last step of a smooth scroll, so the jump doesn't wait for it | Jump to latest is pressed |
| Remove `.hconversation-empty` and `hidden` from the list | The first message is added |
| Put what arrived in the status | A reply is whole, or someone joins |

`examples/html/src/scripts/conversation.js` is an example.

## React

`<Conversation>` renders the region, the list, the status and Jump to
latest. Give it [Messages](message.md); other props are the region's.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required. The region's name |
| `latestLabel` | Required. Jump to latest's name |
| `status` | What arrived, said by screen readers |
| `empty` | What shows before the first message, such as an [Empty State](empty-state.md) |
| `align` | `"end"` gathers a short conversation at the foot |
| `size` | `"large"`: larger text |
| `onJump` | Called as Jump to latest is pressed, to put focus back in the composer |

```tsx
<Conversation aria-label="Conversation" latestLabel="Jump to latest" status={announcement}>
  {messages.map((message) => (
    <Message key={message.id} from={message.from}>{message.text}</Message>
  ))}
</Conversation>
```

## Tokens

`--harmo-box-shadow-sm`, `--harmo-color-background`, `--harmo-color-focus`,
`--harmo-color-text`, `--harmo-control-height`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-font-family`,
`--harmo-font-size-md`, `--harmo-font-size-sm`, `--harmo-space-sm`
