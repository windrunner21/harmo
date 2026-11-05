# Avatar

A round user image, or a placeholder with an icon or initials when there is
none.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `avatar.css` |
| Element | `<img class="havatar">`, or `<span class="havatar" role="img">` for a placeholder |
| Parts | None; a placeholder holds a direct `<svg>` or initials |
| Required | `alt` on an image; `aria-label` on a placeholder |
| Unique | None |
| Script | None |

## Markup

```html
<img class="havatar" src="/users/jane.jpg" alt="Jane Smith" />

<span class="havatar" role="img" aria-label="Jane Smith">
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">…</svg>
</span>

<span class="havatar" role="img" aria-label="Jane Smith">JS</span>
```

## Options

| Hook | Effect |
| --- | --- |
| `--harmo-avatar-size` on the element | Size (default 2.5rem); text and icon scale with it |

## Appearance and states

- A `--harmo-avatar-size` (40px) circle with a 1px `--harmo-color-border`
  border; an image covers it.
- A placeholder centers its content on `--harmo-avatar-color-background`
  (light gray at 40%), in `--harmo-color-text-secondary`. Initials are 40% of
  the size, and a direct-child SVG 62.5% of the space inside the border.

## Accessibility

- An image needs `alt` with the person's name; a placeholder takes
  `role="img"` and `aria-label`.
- When the name already appears next to the avatar, use `alt=""` (or
  `aria-hidden="true"` on a placeholder) so it isn't read twice.

## What a script does

None.

## React

`<Avatar>` renders this markup: the image with `src`, otherwise the
placeholder, holding its children. Other props go to the image or the
placeholder.

| Prop | Effect |
| --- | --- |
| `src` | Renders the image, through `HarmoProvider`'s `imageComponent` (an `<img>` by default) |
| `alt` | Names it: the image's `alt`, or the placeholder's `role="img"` and `aria-label`. `alt=""` hides either from screen readers, for an avatar next to its name |
| `children` | The placeholder's initials or icon |

```tsx
<Avatar src="images/jane.svg" alt="Jane Smith" />
<Avatar alt="Jane Smith">JS</Avatar>
<Avatar alt="Jane Smith" style={{ "--harmo-avatar-size": "4rem" } as CSSProperties}>
  JS
</Avatar>
```

## Tokens

`--harmo-avatar-color-background`, `--harmo-avatar-size`, `--harmo-color-border`,
`--harmo-color-text-secondary`, `--harmo-font-family`, `--harmo-font-line-height`.
