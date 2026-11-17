# Launcher

A round button in the page's corner that opens a panel above it, such as a
support chat or help. The panel is a dialog that isn't modal, so the page
stays usable around it. It grows from the corner as it opens, and the
button's icon turns into a close icon. On a phone, the panel takes the whole
screen. A [Badge](badge.md) on the button can count what came while it was
closed.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `launcher.css`, `button.css`; `badge.css` for a count |
| Element | `<div class="hlauncher">` |
| Parts | In order: `<div class="hlauncher-panel" role="dialog" tabindex="-1">`, holding what's yours; `<button class="hbutton hlauncher-button" aria-expanded aria-controls>`, holding `<span class="hicon hlauncher-icons" aria-hidden="true">` with the closed icon, then the close icon, and a `.hbadge` after it for a count; and `<p class="hlauncher-status" aria-live="polite">` |
| Required | The panel's name, `aria-label`; the button's name, the same or saying how many are new; a Close button in the panel, as on a phone the button is behind it |
| Unique | The panel's id |
| Script | Required: to open and close it; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hlauncher">
  <div class="hlauncher-panel" id="help" role="dialog" aria-label="Help" tabindex="-1">
    …
  </div>
  <button class="hbutton hlauncher-button" type="button" aria-label="Help" aria-expanded="false" aria-controls="help">
    <span class="hicon hlauncher-icons" aria-hidden="true">
      <svg class="hicon" viewBox="0 0 24 24">…</svg>
      <svg class="hicon" viewBox="0 0 25 25">…</svg>
    </span>
  </button>
  <p class="hlauncher-status" aria-live="polite"></p>
</div>
```

With a count, the button's name says it too:

```html
<button class="hbutton hlauncher-button" type="button" aria-label="Chat with Imran, 2 new" aria-expanded="false" aria-controls="chat">
  <span class="hicon hlauncher-icons" aria-hidden="true">…</span>
  <span class="hbadge" aria-hidden="true">2</span>
</button>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-open` on the panel | It's open |
| `data-autofocus` in the panel | What takes focus as it opens from the button, such as the field to write in; without one, the panel |
| `--hlauncher-offset` | The button's distance from the corner: 16px |
| `--hlauncher-size` | The button's size: 48px |

They're `position: fixed`: in the page's corner, or the corner of an
ancestor with `contain: layout`, as in a preview.

## Appearance and states

- The button is a primary Button, round, 48px, with a small shadow, 16px
  from the corner, its icon 24px. As the panel opens, the icon turns 45° away
  and fades, as the close icon turns in, in 200ms; with reduced motion, they
  only fade.
- A count sits on the circle's edge, at its top end.
- The panel is 8px above the button, at most 384px wide and 600px tall, and
  less on a small screen, with room for the button. It has
  `--harmo-color-background`, a border, 16px corners, and a small shadow.
- It grows from the corner, from 95%, as it opens, in 200ms
  (`--harmo-duration-normal`), and shrinks back in 150ms
  (`--harmo-duration-fast`); with reduced motion, it only fades.
- At 480px wide or less, the panel takes the whole screen, without its
  border, corners or shadow, and the button hides behind it.
- What's in the panel is yours; it's one grid row, so a grid inside it can
  fill it, with a Conversation scrolling.

## Accessibility

- The button says whether the panel is open with `aria-expanded`, and which
  it is with `aria-controls`; name it what it opens, and say how many are new
  in its name, as the Badge is hidden from screen readers.
- The panel is a dialog, named, but not modal: focus can leave it, and the
  page stays usable.
- Opened from the button, focus moves into the panel. Escape in it closes
  it, and closing it with focus inside puts focus back on the button, even
  if what had focus was removed as it closed.
- Say what came while it was closed in the status, such as "New message
  from Imran", as a screen reader doesn't see the Badge appear.

## What a script does

| Change | When |
| --- | --- |
| Add `data-open` to the panel, set `aria-expanded="true"`, and focus what's marked `data-autofocus`, or the panel | The button is pressed while it's closed |
| Remove `data-open`, set `aria-expanded="false"`, and focus the button if focus was in the panel | The button, Escape in the panel, or its Close |
| Add or update the `.hbadge`, the button's name, and the status | Something comes while it's closed |
| Remove them | It opens |

`examples/html/src/scripts/launcher.js` is an example.

## React

`<Launcher>` renders the panel, with its children, the button, and the
status. Other props are the panel's; `ref` is the panel. It's open as you
say with `open` and `onOpenChange`, or its own with `defaultOpen`. Closing
it from inside, such as from its Close, returns focus to the button.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required. The panel's name, and the button's unless `buttonLabel` is given |
| `icon` | Required. The button's icon while it's closed, with `className="hicon"` |
| `buttonLabel` | The button's name, such as `"Chat with Imran, 2 new"` |
| `badge` | On the button, as a [Button](button.md)'s `badge`: a number for a Badge |
| `status` | What came, said by screen readers |
| `open`, `onOpenChange` | Whether it's open, and a change to it |
| `defaultOpen` | Whether it starts open, when it keeps its own |

```tsx
<Launcher
  aria-label="Chat with Imran"
  buttonLabel={unread > 0 ? `Chat with Imran, ${unread} new` : "Chat with Imran"}
  icon={<ChatIcon className="hicon" />}
  badge={unread || undefined}
  status={unread > 0 ? "New message from Imran" : ""}
  open={open}
  onOpenChange={setOpen}
>
  …
</Launcher>
```

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-color-background`,
`--harmo-color-border`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-duration-fast`, `--harmo-duration-normal`,
`--harmo-ease-out-cubic`, `--harmo-space-sm`, `--harmo-space-xs`
