# ChevronToArrow

A chevron that turns into an arrow while its link or button is hovered or
focused from the keyboard. For a chevron that doesn't animate, use the static
[chevron icon](icons.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `chevron-to-arrow.css` |
| Element | `<svg class="hicon hchevron-to-arrow" width="24" height="24" viewBox="0 0 24 24">` inside an enabled `<a href>` or `<button>` |
| Parts | `.hchevron-to-arrow-head` holding `.hchevron-to-arrow-upper` and `.hchevron-to-arrow-lower`; `.hchevron-to-arrow-shaft` |
| Required | A `width` and `height`, which size it, since its CSS doesn't: `24`, the size it's drawn for; `aria-hidden="true"` and `focusable="false"` |
| Unique | None |
| Script | None |

## Markup

```html
<svg class="hicon hchevron-to-arrow" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <g class="hchevron-to-arrow-head">
    <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" />
    <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" />
  </g>
  <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" />
</svg>
```

The head group slides; the shaft fades in.

## Options

| Hook | Effect |
| --- | --- |
| (default) | Points forward |
| `data-direction="back"` | Points back, such as for "Go back" |

Back mirrors the whole drawing, so both directions draw and animate the same
way. In right-to-left text both mirror again, as SF Symbols'
`chevron.backward` and `chevron.forward` do: back points toward the start of
the line, forward toward its end.

## Appearance and states

- 24px, from its `width` and `height`, whatever the font size, unlike other
  icons, which scale with the text. Its 8px slide and 2px strokes are drawn
  for that size. Like any icon, it takes another size: give it a different
  `width` and `height`, and an icon-only [Button](button.md) draws it at
  20px, as it does every icon. Beside a button's label, it keeps its own.
- On hover-capable devices it rests as a chevron. Hovering the container or
  focusing it from the keyboard slides the chevron 8px outward and reveals the
  shaft, in 150ms (`--harmo-chevron-to-arrow-duration`,
  `--harmo-ease-out-cubic`).
- Keyboard focus shows the arrow at once.
- Touch devices, reduced motion, and disabled containers show the finished
  arrow without animating.
- Inside `.hbutton`, the button adds space on the label's other side so the
  resting button looks balanced; see [Button](button.md). Back arrows lead the
  label and forward arrows follow it.

## Accessibility

Decorative: `aria-hidden="true"`, with the link's or button's text naming it.

## What a script does

None.

## React

`<ChevronToArrow>` draws this SVG. Put it in a `<Button>`, before the text for
back and after it for forward, or after a `<Link>`'s text, for forward: a link
with an icon lines up with its first item, so an arrow before its text would
sit slightly high (see [Link](link.md)). For a back link, use a `<Button>`
with `href`. Other props are the `<svg>`'s attributes.

| Prop | Effect |
| --- | --- |
| `direction` | `back` mirrors it; `forward` when left out |
| `width`, `height` | Its size: `24` when left out, the size it's drawn for |

```tsx
<Button>
  Continue
  <ChevronToArrow />
</Button>
```

## Tokens

`--harmo-chevron-to-arrow-duration`, `--harmo-ease-out-cubic`.
