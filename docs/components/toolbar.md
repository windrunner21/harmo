# Toolbar

A row above a list: filters at the start and controls at the end. It only lays
them out. While rows are selected, a [Selection Bar](selection-bar.md) can take
the place of the controls.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `toolbar.css`, and those of what's in it |
| Element | `<div class="htoolbar">` |
| Parts | One element at the start, such as a [Filters](filters.md) row, then `<div class="htoolbar-controls">` |
| Required | None |
| Unique | None |
| Script | None |

## Markup

```html
<div class="htoolbar">
  <div class="hfilters" role="group" aria-label="Filter tasks">
    <!-- Filter Chips, each with its Popup, as on the Filter Chip page -->
    <button class="hfilters-reset" type="button" hidden>Reset filters</button>
  </div>
  <div class="htoolbar-controls">
    <button class="hbutton" data-variant="secondary" data-size="small" type="button">
      <span class="hbutton-label">Columns</span>
    </button>
    <button class="hbutton" data-variant="secondary" data-size="small" type="button">
      <span class="hbutton-label">Board view</span>
    </button>
  </div>
</div>
```

The filters are a [Filters](filters.md) row of [Filter Chips](filter-chip.md),
marked up as their pages show. Without filters, leave them out and the controls
stay at the end.

## Options

None of its own: it takes its look from what's in it. Small secondary
[Buttons](button.md) suit the controls.

## Appearance and states

- Filters and controls in one row, vertically centered, at least 42px
  (`--harmo-space-lg`) apart.
- The controls are 10px (`--harmo-space-xs`) apart, and stay at the end.
- Filters that don't fit wrap on their own side. The controls go below them, 10px
  down, only when they and the widest filter can't share a row.
- Right-to-left, the filters start on the right and the controls end on the left.

## Accessibility

- It's a plain `<div>`, not `role="toolbar"`. That role promises that the arrow
  keys move between the controls, which doesn't suit a row of filters and popups:
  each control is its own stop in the Tab order.
- Name what's in it: a Filters row takes an `aria-label`.

## What a script does

Nothing: it has no behavior.

## React

`<Toolbar>` renders its children at the start, and `controls` in
`.htoolbar-controls` at the end. Other props are the element's attributes.

| Prop | Effect |
| --- | --- |
| `controls` | What goes at the end. Left out, or nothing to show, there's no `.htoolbar-controls` |

```tsx
<Toolbar controls={<Button variant="secondary" size="small">Export</Button>}>
  <Filters aria-label="Filter tasks" resetLabel="Reset filters">
    <FilterChip label="Status" value={status} onValueChange={setStatus}>…</FilterChip>
  </Filters>
</Toolbar>
```

## Tokens

`--harmo-space-xs`, `--harmo-space-lg`, and those of what's in it.
