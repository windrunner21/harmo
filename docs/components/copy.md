# Copy Button

A button that copies text, such as a link or an ID, and says so in place: for
two seconds, its icon turns into a check, and its tooltip or its text says
it's copied. In a field, it copies a value such as a key. A Share Button is the
same, with a share icon: it opens the device's share sheet where the browser
has one, and elsewhere copies the link.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `copy.css`, `button.css`; `tooltip.css` for an icon-only one; `input.css` and `field.css` for a field |
| Element | `<button class="hbutton hcopy" type="button">` |
| Parts | `<span class="hicon hcopy-icons" aria-hidden="true">` holding the icon, `.hcopy-icon`, and the check, `.hcopy-done`; after it, or after its Tooltip trigger, `<span class="hcopy-status" role="status">`. In a field, `.hcopy-field` around a read-only `.hinput`, the button's Tooltip trigger, and the status |
| Required | Without its text, a [Tooltip](tooltip.md) trigger around it, naming it with `aria-labelledby`. The status in the page from the start, and empty |
| Unique | The tooltip's `id` |
| Script | Required, since copying needs one; see [What a script does](#what-a-script-does) |

## Markup

```html
<span class="htooltip-trigger">
  <button class="hbutton hcopy" data-variant="tertiary" type="button" aria-labelledby="copy-link">
    <span class="hicon hcopy-icons" aria-hidden="true">
      <svg class="hcopy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M10.5 8.5H17.5C18.6 8.5 19.5 9.4 19.5 10.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H10.5C9.4 19.5 8.5 18.6 8.5 17.5V10.5C8.5 9.4 9.4 8.5 10.5 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M6.5 15.5H6C5.17 15.5 4.5 14.83 4.5 14V6C4.5 5.17 5.17 4.5 6 4.5H14C14.83 4.5 15.5 5.17 15.5 6V6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <svg class="hcopy-done" viewBox="4.85 4.88 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" />
      </svg>
    </span>
  </button>
  <span class="htooltip" role="tooltip" id="copy-link">Copy link</span>
</span>
<span class="hcopy-status" role="status"></span>
```

With its text, there's no tooltip:

```html
<button class="hbutton hcopy" data-variant="secondary" type="button">
  <span class="hicon hcopy-icons" aria-hidden="true">…</span>
  <span class="hbutton-label">Copy</span>
</button>
<span class="hcopy-status" role="status"></span>
```

In a field, for a value such as an ID or a key:

```html
<div class="hfield">
  <label class="hlabel" for="account-id">Account ID</label>
  <div class="hcopy-field">
    <input class="hinput" id="account-id" type="text" readonly value="acc_7Hq2vX9pLm4" />
    <span class="htooltip-trigger">
      <button class="hbutton hcopy" data-variant="tertiary" data-size="small" type="button" aria-labelledby="account-id-copy">
        <span class="hicon hcopy-icons" aria-hidden="true">…</span>
      </button>
      <span class="htooltip" role="tooltip" id="account-id-copy">Copy account ID</span>
    </span>
    <span class="hcopy-status" role="status"></span>
  </div>
</div>
```

A Share Button is the same markup, with this icon as its `.hcopy-icon`:

```html
<svg class="hcopy-icon" viewBox="0 0 25 25" fill="none" aria-hidden="true" focusable="false">
  <path d="M3.57684 23.375H20.5768C20.9868 23.375 21.3268 23.035 21.3268 22.625C21.3268 22.215 20.9868 21.875 20.5768 21.875H3.57684C3.16684 21.875 2.82684 22.215 2.82684 22.625C2.82684 23.035 3.16684 23.375 3.57684 23.375Z" fill="currentColor" />
  <path d="M5.0769 18.875C5.2669 18.875 5.4569 18.805 5.6069 18.655L19.6069 4.655C19.8969 4.365 19.8969 3.885 19.6069 3.595C19.3169 3.305 18.8369 3.305 18.5469 3.595L4.5469 17.595C4.2569 17.885 4.2569 18.365 4.5469 18.655C4.6969 18.805 4.8869 18.875 5.0769 18.875Z" fill="currentColor" />
  <path d="M19.0768 15.145C19.4868 15.145 19.8268 14.805 19.8268 14.395V4.125C19.8268 3.715 19.4868 3.375 19.0768 3.375H8.80684C8.39684 3.375 8.05684 3.715 8.05684 4.125C8.05684 4.535 8.39684 4.875 8.80684 4.875H18.3268V14.395C18.3268 14.805 18.6668 15.145 19.0768 15.145Z" fill="currentColor" />
</svg>
```

### Sharing on a site

To share on a particular site, use a link: an icon-only [Button](button.md)
with `href`, `target="_blank"`, and `rel="noopener noreferrer"`, named by a
Tooltip. The link itself needs no script; its Tooltip does, for Escape to hide
it. Harmo ships no brand logos: use the ones your app is allowed to.

| Site | Address, with the page's address and text encoded |
| --- | --- |
| X | `https://x.com/intent/post?url=…&text=…` |
| LinkedIn | `https://www.linkedin.com/sharing/share-offsite/?url=…` |
| Facebook | `https://www.facebook.com/sharer/sharer.php?u=…` |

```html
<span class="htooltip-trigger">
  <a class="hbutton" data-variant="tertiary" href="https://www.linkedin.com/sharing/share-offsite/?url=…" target="_blank" rel="noopener noreferrer" aria-labelledby="share-linkedin">
    <svg class="hicon" …>…</svg>
  </a>
  <span class="htooltip" role="tooltip" id="share-linkedin">Share on LinkedIn</span>
</span>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-copied` on `.hcopy` | Shows the check in place of the icon |
| `data-variant`, `data-size` | Button's; an icon-only one is usually `tertiary`, one with its text `secondary`, and one in a field `small` |

## Appearance and states

- It's a [Button](button.md), with the icon at 20px.
- Once it has copied, for two seconds: the icon shrinks and fades out in 150ms
  as the check grows and fades in, in 200ms, and back again after. With
  reduced motion, they only fade.
- An icon-only one's tooltip says it's copied, and shows through those two
  seconds, even with no pointer over it, as on a touch screen.
- With its text, the word changes, and the button's width goes from the old
  to the new over 200ms, as a Button's does when its text changes.
- If copying fails, nothing changes: say so in your app, such as with a
  [Toast](toast.md).
- In a field: a read-only [Input](input.md) in `--harmo-font-family-mono`, its
  value ending in an ellipsis when it doesn't fit, and a small button 2px from
  its end, at the left in right-to-left text.

## Accessibility

- It's a real button, reached with Tab and pressed with Enter or Space.
- Without its text, its tooltip names it, so name what it copies, such as
  "Copy link". While it confirms, its name is the tooltip's new text.
- The status is read out once it's copied, so a screen reader hears it
  wherever focus is. It's in the page from the start, as a status has to be.
- In a field, the label and description are the input's, and the value can
  be selected and read.
- A link to a site opens in a new tab: say so in its tooltip if your users
  need to know.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| Ignore activation | While `aria-disabled="true"`, as for a [Button](button.md) |
| Copy the text with `navigator.clipboard.writeText` | On a click |
| Add `data-copied` to `.hcopy`, and `data-open` to its Tooltip trigger; set the status, and the tooltip's text or the `.hbutton-label`'s, to your "Copied" text; two seconds later, undo all of it. Make the status different each time, if only by an invisible space, so copying again is read again | Once it has copied |
| The width, from the old to the new, over 200ms, as [Button](button.md)'s script does | When the `.hbutton-label`'s text changes |
| A Share Button: call `navigator.share` where the browser has it, and confirm nothing, since the share sheet says what happened; ignore an `AbortError`, which is someone closing the sheet. Elsewhere, copy the link | On a click |

The playground's example script, `examples/html/src/scripts/copy.js`, does
this.

## React

`<CopyButton>` and `<ShareButton>` render a Button, with its Tooltip and
status, and do all of this. `<CopyField>` renders the field. Other props are
the `<button>`'s, or for `<CopyField>`, the `<input>`'s; `hidden` hides the
tooltip and the status with the button. Without `href`: it's always a button.

| Prop | Effect |
| --- | --- |
| `value` | `CopyButton`, `CopyField`: what to copy; on `CopyButton`, or a function that returns it |
| `url`, `title`, `text` | `ShareButton`: what to share |
| `label` | `CopyButton`, `ShareButton`: the tooltip, or with `showLabel`, the text. `CopyField`: the field's label |
| `copyLabel` | `CopyField`: the button's tooltip |
| `copiedLabel` | What it says once it has copied |
| `showLabel` | Shows the text, rather than a tooltip |
| `variant`, `size` | Button's: `tertiary`, or with `showLabel`, `secondary` by default |
| `optional`, `description` | `CopyField`: Field's |
| `onCopy` | Called once it has copied, even if the button has gone by then, such as with a menu that closed |
| `onShare` | `ShareButton`: called once it has shared |
| `onError` | Called with the error if it can't copy or share, such as to show a [Toast](toast.md) |

```tsx
<CopyButton value={link} label="Copy link" copiedLabel="Copied" />

<CopyButton value={command} label="Copy" copiedLabel="Copied" showLabel />

<CopyField label="Account ID" value={account.id} copyLabel="Copy account ID" copiedLabel="Copied" />

<ShareButton url={link} title={article.title} label="Share" copiedLabel="Link copied" />
```

## Tokens

`--harmo-font-family-mono`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`; Button's, and Tooltip's
and Input's where they're used.
