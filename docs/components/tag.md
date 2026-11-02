# Tag

What something is: a label such as a ticket tag, "Default", "Test run", or an
email address in a list. For the state something is in, use
[Status](status.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tag.css` |
| Element | `<span class="htag">` with the label as its text |
| Parts | `.htag-dot`, optional, before the text |
| Required | `aria-hidden="true"` on `.htag-dot` |
| Unique | None |
| Script | None |

## Markup

```html
<span class="htag">Default</span>

<span class="htag" style="--htag-color: #c08600">
  <span class="htag-dot" aria-hidden="true"></span>Billing
</span>

<span class="htag" data-variant="accent">Unread</span>
```

## Options

| Hook | Effect |
| --- | --- |
| `--htag-color` with a `.htag-dot` | The tag's own color, on the dot and the border; any color works |
| `data-variant="accent"` | Border and text in `--harmo-color-primary`, for emphasis such as "Unread" |

## Appearance and states

- Always a rectangle: 4px radius, 1px `--harmo-color-border` border, 2px 6px
  padding, 13px `--harmo-color-text-secondary` text that wraps rather than
  overflowing.
- A tag with its own color shows `.htag-dot` (6px) in `--htag-color`; without
  one, it has no dot.
- Unlike a Status, a tag's color carries no meaning, and it is never a pill.

## Accessibility

The text carries the meaning; the dot is decorative (`aria-hidden`).

## What a script does

None.

## React

`<Tag>` renders the tag, with its children as the text. Other props are the
`<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `color` | Any CSS color: sets `--htag-color` and adds the dot |
| `variant` | `accent` |

```tsx
<Tag color="var(--harmo-amber)">Billing</Tag>
<Tag variant="accent">Unread</Tag>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-border`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-xs`.
