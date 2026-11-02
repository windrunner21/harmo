# Meter

How much of something on a fixed scale, such as password strength. Not a
loading or step indicator: for loading, use a [Spinner](spinner.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `meter.css` |
| Element | `<div class="hmeter" role="meter">` |
| Parts | One `.hmeter-segment` per step of the scale |
| Required | `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`; `aria-valuetext` when the number alone means little |
| Unique | None |
| Script | Required to change the value; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hmeter" role="meter" aria-label="Password strength"
  aria-valuemin="0" aria-valuemax="3" aria-valuenow="2" aria-valuetext="Medium">
  <span class="hmeter-segment" data-filled></span>
  <span class="hmeter-segment" data-filled></span>
  <span class="hmeter-segment"></span>
</div>
```

The meter is only the bar. Words such as "Too weak", hints, and when to show
it belong to the component using it, such as [Password input](password.md).

## Options

| Hook | Effect |
| --- | --- |
| `data-filled` on a segment | Filled |
| (no `data-status`) | Filled segments in `--harmo-color-text-tertiary` (gray) |
| `data-status="success"` | Filled segments in `--harmo-status-color-success` (green) |
| `data-status="warning"` | Filled segments in `--harmo-status-color-warning` (amber) |
| `data-status="info"` | Filled segments in `--harmo-status-color-info` (cyan) |
| `data-status="error"` | Filled segments in `--harmo-status-color-error` (red) |
| `hidden` | Hides the meter, for example until a password has been typed |

## Appearance and states

- 4px rounded segments share the width with 12px gaps; unfilled segments are
  `--harmo-color-border-control` at 50%.
- Filling and color changes fade over 150ms. Reduced motion keeps the fade,
  since nothing moves.
- In forced-colors mode every segment is outlined and filled ones are solid.

## Accessibility

`role="meter"` and its `aria-value*` attributes give screen readers the value,
for example "Password strength, Medium".

## What a script does

| Change | When |
| --- | --- |
| Set `aria-valuenow`, `aria-valuetext`, `data-filled`, and `data-status` | As the value changes |

`examples/html/src/scripts/password.js` is an example script that drives a
meter.

## React

`<Meter>` renders the meter, one segment per step, and sets `role` and the
`aria-value*` attributes from its value. Name it with `aria-label`, and put
the value in words with `aria-valuetext`. Other props are the `<div>`'s
attributes.

| Prop | Effect |
| --- | --- |
| `value` | How many segments are filled |
| `max` | How many segments there are |
| `status` | `success`, `warning`, `info`, or `error`; gray when left out |

```tsx
<Meter value={1} max={3} status="error" aria-label="Password strength" aria-valuetext="Too weak" />
```

## Tokens

`--harmo-border-radius-full`, `--harmo-color-border-control`,
`--harmo-color-text-tertiary`, `--harmo-duration-fast`,
`--harmo-status-color-error`, `--harmo-status-color-info`,
`--harmo-status-color-success`, `--harmo-status-color-warning`.
