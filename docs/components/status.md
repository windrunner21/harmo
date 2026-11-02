# Status

What state something is in: a ticket, chat, campaign run, or account. For what
something is, use [Tag](tag.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `status.css` |
| Element | `<span class="hstatus">` with the state as its text |
| Parts | None; the dot is drawn by the element itself |
| Required | None |
| Unique | None |
| Script | None |

## Markup

```html
<span class="hstatus" data-status="success">Active</span>
<span class="hstatus" data-status="warning" data-variant="bordered">Pending review</span>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-status="success"` | Green dot (`--harmo-status-color-success`) |
| `data-status="warning"` | Amber dot (`--harmo-status-color-warning`) |
| `data-status="info"` | Cyan dot (`--harmo-status-color-info`) |
| `data-status="error"` | Red dot (`--harmo-status-color-error`) |
| No `data-status` | Gray dot (`--harmo-color-border-control`) |
| `data-variant="bordered"` | A pill, for headers and summaries |

There is no custom color: the app maps its own states, such as a campaign run's
"sending", to these four.

## Appearance and states

- An 8px dot, then 6px, then text in `--harmo-color-text-secondary`.
- Default: no border, and the font size and line height of the surrounding
  text, so it fits a 15px settings section or a 14px table alike.
- Bordered: 13px text, 4px 10px padding, a 1px `--harmo-color-border` border,
  fully rounded.
- The dot colors are brighter than `--harmo-color-success`,
  `--harmo-color-warning`, and `--harmo-color-danger`, which are meant for
  text.
- In forced-colors mode the dot uses the text color.

## Accessibility

The text carries the meaning; the dot's color only supports it, so a status
never relies on color alone.

## What a script does

None.

## React

`<Status>` renders the status, with its children as the text. Other props are
the `<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `status` | `success`, `warning`, `info`, or `error`; gray when left out |
| `variant` | `bordered` |

```tsx
<Status status="success">Active</Status>
<Status status="warning" variant="bordered">
  Pending review
</Status>
```

## Tokens

`--harmo-border-radius-full`, `--harmo-color-border`,
`--harmo-color-border-control`, `--harmo-color-text-secondary`,
`--harmo-font-family`, `--harmo-font-size-xs`, `--harmo-status-color-error`,
`--harmo-status-color-info`, `--harmo-status-color-success`,
`--harmo-status-color-warning`.
