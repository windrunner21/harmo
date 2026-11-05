# Button

An action. Use a `<button>`, or an `<a href>` styled as a button when the
action is navigation. For navigation inside text, use [Link](link.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `button.css`; `spinner.css` for loading; `chevron-to-arrow.css`, `expand-chevron.css`, or `tooltip.css` when used |
| Element | `<button class="hbutton" type="…">`, or `<a class="hbutton" href="…">` |
| Parts | `.hbutton-label` for the text; optional direct `.hicon`, `.hspinner`, `.hexpand-chevron` |
| Required | `type` on a `<button>`; an icon-only button needs `aria-label` or `aria-labelledby` |
| Unique | Ids that `aria-labelledby` or `aria-describedby` point to |
| Script | Only for `aria-disabled` and loading; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>

<button class="hbutton" data-variant="secondary" type="button">
  <span class="hbutton-label">Cancel</span>
</button>

<a class="hbutton" data-variant="tertiary" href="/reports">
  <span class="hbutton-label">Read more</span>
</a>
```

With a ChevronToArrow:

```html
<button class="hbutton" data-variant="secondary" type="button">
  <svg class="hicon hchevron-to-arrow" data-direction="back" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g class="hchevron-to-arrow-head">
      <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" />
      <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" />
    </g>
    <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" />
  </svg>
  <span class="hbutton-label">Go back</span>
</button>
```

Icon only, named with `aria-label` (any SVG drawn in `currentColor`):

```html
<button class="hbutton" data-variant="tertiary" type="button" aria-label="Close">
  <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
</button>
```

Loading:

```html
<button class="hbutton" type="submit" aria-busy="true" aria-disabled="true">
  <span class="hbutton-label">Saving changes</span>
  <span class="hspinner" aria-hidden="true"></span>
</button>
```

## Options

| Hook | Effect |
| --- | --- |
| (default) | Primary: filled `--harmo-color-primary-fill` |
| `data-variant="secondary"` | Outlined, lightly raised |
| `data-variant="tertiary"` | Text only; tinted background on hover |
| `data-size="small"` | Compact: 29px, 13px text, 6px radius, for notices, rows, and cards |
| `.hbutton-label` | Spaces the text 6px from the border and from icons; long labels wrap |
| No `.hbutton-label` | Icon only: a square as wide as it is tall |
| A direct `.hicon` | Keeps its size |
| A trailing `.hexpand-chevron` | Kept 6px (`--harmo-icon-gap`) from the border, like the label's text |
| `disabled` | Dimmed, not-allowed cursor (`<button>` only) |
| `aria-disabled="true"` | Looks disabled but stays focusable; a script must ignore activation |
| `aria-busy="true"` | Loading, with `aria-disabled="true"` and a `.hspinner` |

## Appearance and states

- `--harmo-control-height` (34px) tall; a long label wraps and the button grows
  instead of overflowing. Text is 14px medium on a 20px line. The button itself
  has no padding; the label spaces its text.
- `flex-shrink: 0`: in a row, a full-width neighbor such as an input shrinks
  instead of the button. `vertical-align: middle`, so icon-first and
  text-first buttons line up.
- Icon only: a 34px square (29px when small) with the icon centered and drawn
  at 20px, whatever size the SVG declares. While loading, a `.hspinner` takes
  the icon's place.
- Loading: the spinner follows the label and the button grows to fit it. The
  spinner is 16px, drawn in the button's text color with a gap, 9px after the
  text and 6px from the border. The button looks disabled and shows a progress
  cursor.
- A ChevronToArrow rests 15px from the border to leave room for its slide. The
  button adds matching space on the label's other side: after the label for a
  leading back arrow, before it for a trailing forward arrow.
- Hover and press colors apply to enabled buttons and to links with `href`.
  Press scales to 0.98 (`--harmo-ease-out-quad`); reduced motion keeps only
  the color change.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).

## Accessibility

- `aria-disabled="true"` instead of `disabled` keeps the button focusable, so a
  tooltip can explain why it's unavailable.
- A loading button keeps focus, so a keyboard user who submitted with Enter
  doesn't lose their place.
- An icon-only button needs a name: `aria-label`, or a [Tooltip](tooltip.md)
  referenced with `aria-labelledby`. A naming tooltip uses `aria-labelledby`
  rather than `aria-describedby`, so screen readers say "Close, button" once,
  not twice.

## What a script does

| Change | When |
| --- | --- |
| Ignore activation | While `aria-disabled="true"` |
| Add `aria-busy="true"`, `aria-disabled="true"`, and a `.hspinner`; remove them when done | While an action is in progress |

`examples/html/src/scripts/button.js` is an example script for loading.

## React

`<Button>` renders a `<button type="button">`, or with `href` a link, with its
text in `.hbutton-label`. An icon as its first or last child stays outside
the label: Harmo's `<ChevronToArrow>`, `<Chevron>`, or `<ExpandChevron>`, or
any element with the `hicon` class. Other props are the button's or the
link's attributes, so `type="submit"` makes a submit button.

| Prop | Effect |
| --- | --- |
| `variant` | `secondary` or `tertiary`; primary when left out |
| `size` | `small` |
| `loading` | Shows the spinner after the label, sets `aria-busy` and `aria-disabled`, and ignores clicks |
| `href` | Renders a link, through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |
| `aria-disabled` | `"true"` keeps it focusable but ignores clicks, so a [Tooltip](tooltip.md) can explain why |

```tsx
<Button loading>Saving changes</Button>
<Button variant="secondary">
  <ChevronToArrow direction="back" />
  Go back
</Button>
<Button variant="tertiary" aria-label="Close">
  <CloseIcon className="hicon" />
</Button>
```

## Tokens

`--harmo-border-radius`, `--harmo-border-radius-sm`, `--harmo-button-duration`,
`--harmo-button-font-line-height`, `--harmo-button-font-weight`,
`--harmo-button-secondary-box-shadow`, `--harmo-button-secondary-color-border`,
`--harmo-button-secondary-color-text`,
`--harmo-button-secondary-hover-color-border`, `--harmo-color-background-hover`,
`--harmo-color-on-primary`, `--harmo-color-primary-fill`,
`--harmo-color-primary-fill-active`, `--harmo-color-primary-fill-hover`,
`--harmo-color-primary-tint`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-control-height`,
`--harmo-ease-out-quad`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-icon-gap`, `--harmo-opacity-disabled`.
