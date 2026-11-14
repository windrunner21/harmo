# Spinner

A loading indicator, sized to match what is loading. For a value on a scale,
use a [Meter](meter.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `spinner.css` |
| Element | `<span class="hspinner">` |
| Parts | `.hspinner-label`, visually hidden text, when it stands alone |
| Required | Alone: `role="status"` and a `.hspinner-label`, and, when it appears after the page loads, a `role="status"` element around it that's in the page from the start; inside a control whose label explains the wait: `aria-hidden="true"` |
| Unique | None |
| Script | None |

## Markup

On its own, announce it:

```html
<span class="hspinner" role="status">
  <span class="hspinner-label">Loading</span>
</span>
```

Shown after the page loads, put it inside an element with `role="status"`
that's in the page from the start, so screen readers read its label as it
appears; a live region added with its text already in it is less often read.
When loading ends, put a few words there in its place, in your app's
language, so the end is read too:

```html
<div role="status">
  <span class="hspinner" role="status">
    <span class="hspinner-label">Loading conversations</span>
  </span>
</div>
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
| `data-delay` | Stays hidden for `--hspinner-delay`, 300ms, so quick loads never flash a spinner |
| `--hspinner-size`, `--hspinner-stroke` | The size and the ring width |
| `--hspinner-duration` | How long a turn takes, or under reduced motion each way of the fade, so a whole pulse takes twice as long: 1s |
| `--hspinner-delay` | How long `data-delay` keeps it hidden: 300ms |
| `color` | The arc's color |

## Appearance and states

- The arc uses the element's `color` (default `--harmo-color-primary`); the
  track uses `--harmo-color-border`.
- One turn per second (`--hspinner-duration`), `linear`. Under reduced
  motion it stops rotating and fades slowly from full to 40% opacity and
  back, with `--harmo-ease-in-out-cubic`, each way as long as a turn, so a
  whole pulse takes 2s. It still signals work without moving.
- In forced colors (Windows contrast themes) the track turns the system gray
  and the arc the text color, so it still visibly turns.
- Inside a [Button](button.md), the button shrinks its spinner to 16px and
  draws it in the button's text color.

## Accessibility

A standalone spinner takes `role="status"` with a visually hidden
`.hspinner-label`, so screen readers announce what is loading. One that appears
after the page loads goes inside a `role="status"` element that's in the page
from the start, as in [Markup](#markup), and your app says there when loading
ends, since a spinner taken away announces nothing. How much each screen reader
reads varies, so check yours. Inside a control whose label explains the wait,
it is `aria-hidden`.

## What a script does

None. Render it while something loads, inside a status that's in the page
from the start, and when loading ends, replace it with what loaded, or with a
few words of your app's saying so.

## React

`<Spinner>` renders the spinner with `role="status"`; its children, which
are required, are the label screen readers announce, such as "Loading". With
`aria-hidden="true"`, it's decorative and has neither. One rendered after the
page loads goes inside a `role="status"` element that's in the page from the
start, as in [Markup](#markup). A [Button](button.md#react)'s `loading`
renders one for you. Other props are the `<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `size` | `small` or `large` |
| `delay` | Keeps it hidden for its first 300ms, or `--hspinner-delay` |

```tsx
<Spinner size="large">Loading</Spinner>
<Spinner delay>Loading conversations</Spinner>
```

```tsx
<div role="status">
  {loading ? <Spinner>Loading conversations</Spinner> : `${count} conversations`}
</div>
```

## Tokens

`--harmo-color-border`, `--harmo-color-primary`,
`--harmo-ease-in-out-cubic`.
