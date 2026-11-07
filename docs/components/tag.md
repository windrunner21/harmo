# Tag

What something is: a label such as a ticket tag, "Default", "Test run", or an
email address in a list. For the state something is in, use
[Status](status.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tag.css` |
| Element | `<span class="htag">` with the label as its text |
| Parts | `.htag-dot`, optional, before the text; `.htag-remove`, optional, a `<button type="button">` after it |
| Required | `aria-hidden="true"` on `.htag-dot`; `aria-label` on `.htag-remove`, in the app's language, such as "Remove Billing" |
| Unique | None |
| Script | None; removing a tag is your app's, see [What a script does](#what-a-script-does) |

## Markup

```html
<span class="htag">Default</span>

<span class="htag" style="--htag-color: #c08600">
  <span class="htag-dot" aria-hidden="true"></span>Billing
</span>

<span class="htag" data-variant="accent">Unread</span>

<span class="htag">
  Billing
  <button class="htag-remove" type="button" aria-label="Remove Billing">
    <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
      <path d="M18.1183 18.5318L6.80463 7.21814" />
      <path d="M18.1183 7.21814L6.80463 18.5318" />
    </svg>
  </button>
</span>
```

## Options

| Hook | Effect |
| --- | --- |
| `--htag-color` with a `.htag-dot` | The tag's own color, on the dot and the border; any color works |
| `data-variant="accent"` | Border and text in `--harmo-color-primary`, for emphasis such as "Unread" |
| `.htag-remove` | A button that removes the tag, such as a filter, or a choice in a [Combobox](combobox.md) |
| `disabled` on `.htag-remove` | Disabled, in `--harmo-color-text-tertiary` |

## Appearance and states

- Always a rectangle: 4px radius, 1px `--harmo-color-border` border, 2px 6px
  padding, 13px `--harmo-color-text-secondary` text that wraps rather than
  overflowing.
- A tag with its own color shows `.htag-dot` (6px) in `--htag-color`; without
  one, it has no dot.
- Unlike a Status, a tag's color carries no meaning, and it is never a pill.
- A remove button is 16px, 2px after the text, with a 12px cross in
  `--harmo-icon-color`, darkening to `--harmo-icon-hover-color` on hover;
  the tag ends 2px after it. Its target reaches 4px past it on every side,
  to 24px, the size WCAG 2.5.8 asks of a pointer target.

## Accessibility

The text carries the meaning; the dot is decorative (`aria-hidden`). A remove
button's name says what it removes, such as "Remove Billing", since a cross
alone says nothing to a screen reader; it's in the Tab order, with
`--harmo-focus-outline` around it, unless something else moves focus to it,
as a Combobox does with the arrow keys.

## What a script does

| Change | When |
| --- | --- |
| Remove the tag, and move focus to the next tag's remove button, or the one before, so the keyboard keeps its place | On a click of its remove button |

`examples/html/src/scripts/tag.js` is an example script for it.

## React

`<Tag>` renders the tag, with its children as the text. Other props are the
`<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `color` | Any CSS color: sets `--htag-color` and adds the dot |
| `variant` | `accent` |

`<TagRemove>` renders the remove button, with its cross; put it in the tag,
after the text. Its props are the button's attributes, and `aria-label` is
required. Removing the tag, and moving focus on, is yours.

```tsx
<Tag color="var(--harmo-amber)">Billing</Tag>
<Tag variant="accent">Unread</Tag>
<Tag>
  Billing
  <TagRemove aria-label="Remove Billing" onClick={() => removeFilter("billing")} />
</Tag>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-border`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-duration-fast`, `--harmo-focus-outline`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-xs`, `--harmo-icon-color`,
`--harmo-icon-hover-color`.
