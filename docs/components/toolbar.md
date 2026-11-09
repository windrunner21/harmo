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
    <button class="hfilter-chip" type="button">
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
      <span class="hfilter-chip-label">Status</span>
    </button>
    <button class="hfilter-chip" type="button">
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
      <span class="hfilter-chip-label">Assignee</span>
    </button>
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

Without filters, leave them out and the controls stay at the end.

## Options

None of its own: it takes its look from what's in it. Small secondary
[Buttons](button.md) suit the controls.

## Appearance and states

- Filters and controls in one row, vertically centered, at least 40px apart.
- The controls are 8px apart, and stay at the end.
- Filters that don't fit wrap on their own side. The start is at least 20rem wide
  unless the row is narrower, so on a narrow screen the controls go below the
  filters, 8px down.
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
    <FilterChip label="Status" />
  </Filters>
</Toolbar>
```

## Tokens

None of its own.
