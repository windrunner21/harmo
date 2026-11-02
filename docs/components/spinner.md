# Spinner

A loading indicator, sized to match what is loading. For a value on a scale,
use a [Meter](meter.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `spinner.css` |
| Element | `<span class="hspinner">` |
| Parts | `.hspinner-label`, visually hidden text, when it stands alone |
| Required | Alone: `role="status"` and a `.hspinner-label`; inside a control whose label explains the wait: `aria-hidden="true"` |
| Unique | None |
| Script | None |

## Markup

On its own, announce it:

```html
<span class="hspinner" role="status">
  <span class="hspinner-label">Loading</span>
</span>
```

Inside a control whose label already explains the wait, hide it:

```html
<span class="hspinner" aria-hidden="true"></span>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-size="small"` | 16px, for buttons, table cells, and inline |
| (default) | 24px, for a section while the rest of the page shows |
| `data-size="large"` | 40px with a 3px ring, for a whole page or tab |
| `data-delay` | Stays hidden for 300ms, so quick loads never flash a spinner |
| `--hspinner-size`, `--hspinner-stroke` | The size and the ring width |
| `color` | The arc's color |

## Appearance and states

- The arc uses the element's `color` (default `--harmo-color-primary`); the
  track uses `--harmo-color-border`.
- One turn per second, `linear`. Under reduced motion it stops rotating and
  fades slowly between full and 40% opacity, so it still signals work without
  moving.
- In forced colors (Windows contrast themes) the track turns the system gray
  and the arc the text color, so it still visibly turns.
- Inside a [Button](button.md), the button shrinks its spinner to 16px and
  draws it in the button's text color.

## Accessibility

A standalone spinner takes `role="status"` with a visually hidden
`.hspinner-label`, so screen readers announce what is loading. Inside a control
whose label explains the wait, it is `aria-hidden`.

## What a script does

None. Render it while something loads and remove it when done.

## React

`<Spinner>` renders the spinner with `role="status"`; its children, which
are required, are the label screen readers announce, such as "Loading". With
`aria-hidden="true"`, it's decorative and has neither. A
[Button](button.md#react)'s `loading` renders one for you. Other props are
the `<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `size` | `small` or `large` |
| `delay` | Keeps it hidden for its first 300ms |

```tsx
<Spinner size="large">Loading</Spinner>
<Spinner delay>Loading conversations</Spinner>
```

## Tokens

`--harmo-color-border`, `--harmo-color-primary`.
