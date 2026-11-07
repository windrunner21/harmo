# Icons

SVG icons placed next to text in buttons, links, and breadcrumbs. For an
animated chevron, use [ChevronToArrow](chevron-to-arrow.md) or the
[Expand Chevron](expand-chevron.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | No `icons.css`: the container's CSS, such as `button.css` or `link.css`; `chevron.css` for `.hchevron` |
| Element | `<svg class="hicon">`, a direct child of its button, link, or other container |
| Parts | None |
| Required | `aria-hidden="true"` and `focusable="false"`; a `width` and `height` in `em`, unless its container sizes it (an icon-only button draws its icon at 20px); [ChevronToArrow](chevron-to-arrow.md) is the exception, a fixed 24px |
| Unique | None |
| Script | None |

## Markup

The static chevron:

```html
<svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
  <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
</svg>
```

Any other icon, in the link or button it belongs to:

```html
<a class="hlink" href="/settings">
  Settings
  <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">…</svg>
</a>
```

- Size icons in `em` so they follow the text size. `1.125em` puts the chevron at
  about cap height.
- Draw with `fill="currentColor"` or `stroke="currentColor"` so icons follow
  the text color.
- Breadcrumb separators use the static chevron with
  `class="hbreadcrumb-separator hchevron"`.

## Options

| Hook | Effect |
| --- | --- |
| `.hicon` | Marks an icon for its container: buttons, links, and Filter Chips keep it from shrinking, and links switch to an icon layout |
| `.hchevron` | Pulls the static chevron in by `0.1875em` on both sides; leave it off any other glyph |
| `data-direction="back"` on `.hchevron` | Points the static chevron toward the start of the line, as for a previous-month button; it points toward the end when left out |

## Appearance and states

- Containers place `--harmo-icon-gap` (6px) between text and an icon's box.
- The static chevron is drawn in the middle third of its 24-unit box.
  `.hchevron` offsets the blank sides, so the visible gap to text matches other
  icons, about 9px at default sizes.
- In right-to-left text the static chevron mirrors, back included, as
  [ChevronToArrow](chevron-to-arrow.md) does: forward points left, toward the
  end of the line, and back points right.

## Accessibility

Icons next to text are decorative: `aria-hidden="true"` and
`focusable="false"`, with the text carrying the meaning. A control with only an
icon needs its own name; see [Button](button.md)'s icon-only buttons.

## What a script does

None.

## React

`<Chevron>` draws the static chevron, with `.hicon` and `.hchevron`. Give your
own icons `className="hicon"`, `aria-hidden="true"`, and `focusable="false"`.
Other props are the `<svg>`'s attributes.

| Prop | Effect |
| --- | --- |
| `direction` | `back` points it toward the start of the line; `forward` when left out |

```tsx
<Link href="/settings">
  Settings
  <Chevron />
</Link>
```

## Tokens

None.
