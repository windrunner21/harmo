# Expand Chevron

A chevron that folds from pointing down to pointing up while its control is
expanded, as in Select, popup triggers, and menu buttons. For a chevron that
turns into an arrow, use [ChevronToArrow](chevron-to-arrow.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `expand-chevron.css`, and the containing control's CSS (`button.css` for the button below) |
| Element | `<svg class="hexpand-chevron" viewBox="0 0 16 12">`, a direct child of the element with `aria-expanded` |
| Parts | `.hexpand-chevron-head` holding `.hexpand-chevron-left` and `.hexpand-chevron-right` |
| Required | `aria-hidden="true"` and `focusable="false"`; `aria-expanded` on its parent |
| Unique | None |
| Script | The control's script keeps `aria-expanded` current |

## Markup

```html
<button class="hbutton" data-variant="secondary" type="button" aria-expanded="false">
  <span class="hbutton-label">More options</span>
  <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
    <g class="hexpand-chevron-head">
      <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
      <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
    </g>
  </svg>
</button>
```

The two strokes fold while the head group shifts.

## Options

| Hook | Effect |
| --- | --- |
| `aria-expanded="false"` on the parent | Points down |
| `aria-expanded="true"` on the parent | Points up |

## Appearance and states

- 14×10.5 at 14px text (`1em` wide), so it scales with the text and its
  strokes come out about as heavy as the letters. The viewBox is cropped to
  the drawing, so it never makes a control taller.
- Takes the text color. Select sets it to `--harmo-color-text-secondary`, and
  to the disabled text color when disabled.
- Expanding and collapsing: the two strokes fold through flat while the head
  shifts about 5px, in 200ms (`--harmo-duration-normal`,
  `--harmo-ease-in-out-cubic`). Reduced motion: it flips without moving.
- Pointing down or up, it sits at the same height, centered on the text's
  lowercase letters, which sit about 1px below the middle of a 14px line.
- As the last thing in a [Button](button.md), such as a menu button, it keeps
  the label's 6px spacing from the border.

## Accessibility

Decorative: `aria-hidden="true"`. The control's `aria-expanded` already tells
screen readers whether it's open.

## What a script does

None of its own; it follows the `aria-expanded` that the control's script keeps
current.

`examples/html/src/scripts/expand-chevron.js` is an example script that toggles
`aria-expanded`.

## React

`<ExpandChevron>` draws this SVG. Put it in the control whose `aria-expanded`
it follows, as a direct child; a `<Popup>` keeps its trigger's
`aria-expanded` current, and a `<Select>` its own. Other props are the
`<svg>`'s attributes.

```tsx
<Button variant="tertiary" aria-expanded={false}>
  Filters
  <ExpandChevron />
</Button>
```

## Tokens

`--harmo-duration-normal`, `--harmo-ease-in-out-cubic`.
