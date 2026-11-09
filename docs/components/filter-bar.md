# Filter Bar

Quick filters above a list, as a row of cards that each show how many items
they'd leave, such as All, Active, and Done. For a filter with choices of its
own, use a [Filter Chip](filter-chip.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `filter-bar.css` |
| Element | `<nav class="hfilter-bar">` around links, or `<div class="hfilter-bar" role="group">` around buttons |
| Parts | `<a class="hfilter-bar-item">` or `<button class="hfilter-bar-item" type="button">`, each holding `.hfilter-bar-label` and `.hfilter-bar-count` |
| Required | An `aria-label` on the bar, in the page's language. On the filter in force: `aria-current="true"` on a link, or `aria-pressed="true"` on a button, whose siblings have `aria-pressed="false"` |
| Unique | None |
| Script | Only where your app holds the filter, to move `aria-pressed`. With links, your router renders the one in force |

## Markup

Links, so that a filter is in the URL and a link can be shared:

```html
<nav class="hfilter-bar" aria-label="Task status">
  <a class="hfilter-bar-item" href="?" aria-current="true">
    <span class="hfilter-bar-label">All</span>
    <span class="hfilter-bar-count">128</span>
  </a>
  <a class="hfilter-bar-item" href="?status=active">
    <span class="hfilter-bar-label">Active</span>
    <span class="hfilter-bar-count">37</span>
  </a>
  <a class="hfilter-bar-item" href="?status=done">
    <span class="hfilter-bar-label">Done</span>
    <span class="hfilter-bar-count">85</span>
  </a>
</nav>
```

Buttons, where your app holds the filter:

```html
<div class="hfilter-bar" role="group" aria-label="Whose tasks">
  <button class="hfilter-bar-item" type="button" aria-pressed="true">
    <span class="hfilter-bar-label">Mine</span>
    <span class="hfilter-bar-count">12</span>
  </button>
  <button class="hfilter-bar-item" type="button" aria-pressed="false">
    <span class="hfilter-bar-label">My team's</span>
    <span class="hfilter-bar-count">41</span>
  </button>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="true"` on a link, or `aria-pressed="true"` on a button | The filter in force |
| `disabled` on a button | It can't be used: faded, with no hover |

## Appearance and states

- As many cards to a row as fit, 120px wide at least, or the whole width of a
  narrower container, all the same width, 8px apart, filling the row. On a
  narrow screen they wrap.
- A card: 12px by 16px of padding, a 1px `--harmo-color-border` border, and
  `--harmo-border-radius` corners. The label is 14px in
  `--harmo-color-text-secondary`, over the count at `--harmo-font-size-lg` and
  medium weight in `--harmo-color-text`, with digits of one width. Long text
  wraps.
- Hovered, the border is `--harmo-color-primary`; pressed, it shrinks slightly,
  as a Button does.
- The filter in force: the border, the label, and the count in
  `--harmo-color-primary`, with the label at medium weight, so it's told apart
  without its color. In forced-colors mode, a 2px line just inside its edge.
- Right-to-left, the first filter is on the right and the text starts there.

## Accessibility

- With links it's a `<nav>`, found among the page's landmarks by its name; with
  buttons, a named group.
- Each card's name is its label and count, such as "Active 37".
- `aria-current` or `aria-pressed` says which filter is in force.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| Move `aria-pressed` | When a button is pressed, where your app holds the filter |

With links, your app or its router renders the one in force. The playground's
example script, `examples/html/src/scripts/filter-bar.js`, stands in for both.

## React

`<FilterBar>` renders the bar, a `<nav>` by default, and `<FilterBarItem>` each
card: a link with an `href`, and a button without one. Other props are the
element's attributes. For buttons, make the bar a group with `as="div"`.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required on `<FilterBar>`: its name, such as "Task status" |
| `as` | On `<FilterBar>`: `"div"` for a group, around buttons |
| `label` | The card's label |
| `count` | How many items it would leave; `0` shows |
| `current` | Whether this filter is in force |
| `href` | Makes it a link, through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |

```tsx
<FilterBar aria-label="Task status">
  <FilterBarItem href="?" label="All" count={128} current={!status} />
  <FilterBarItem href="?status=active" label="Active" count={37} current={status === "active"} />
  <FilterBarItem href="?status=done" label="Done" count={85} current={status === "done"} />
</FilterBar>
```

## Tokens

`--harmo-font-family`, `--harmo-font-size-sm`, `--harmo-font-size-lg`,
`--harmo-font-weight-normal`, `--harmo-font-weight-medium`,
`--harmo-opacity-disabled`,
`--harmo-color-text`, `--harmo-color-text-secondary`, `--harmo-color-border`,
`--harmo-color-primary`, `--harmo-border-radius`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-button-duration`,
`--harmo-ease-out-quad`.
