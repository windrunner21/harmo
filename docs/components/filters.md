# Filters

A row of [Filter Chips](filter-chip.md) above a list: the first few in the row,
the rest behind a chip that opens them, and a way to reset them all. It lays
them out and says which are in force. What's chosen stays in your app or your
URL.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `filters.css`, `filter-chip.css`, `popup.css`, and those of the filters in it |
| Element | `<div class="hfilters" role="group">` |
| Parts | Filter Chips, with their popups. With filters behind a chip: `<button class="hfilter-chip" aria-haspopup="dialog">` holding `.hfilters-count`, opening `<div class="hpopup hfilters-more" popover role="dialog">`, which holds them. Last, `<button class="hfilters-reset" type="button">` |
| Required | An `aria-label` on the row and on the panel, in the page's language. `popovertarget` and anchor names, as each popup needs |
| Unique | The `id`s of the popups, lists, and options, and the anchor names |
| Script | Required: for the count and Reset. Opening and closing are the browser's, from `popover`. See What a script does |

## Markup

```html
<div class="hfilters" role="group" aria-label="Filter tasks">
  <button class="hfilter-chip" type="button" aria-haspopup="listbox" popovertarget="applied-status" aria-expanded="false" style="anchor-name:--applied-status">
    <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
    <span class="hfilter-chip-label">Status</span>
    <span class="hfilter-chip-values">
      <span class="hfilter-chip-value">Active</span>
    </span>
  </button>
  <div class="hpopup" id="applied-status" popover style="position-anchor:--applied-status">
    <ul class="hlistbox" role="listbox" aria-label="Status" tabindex="-1">
      <li class="hoption" id="applied-status-2" role="option" aria-selected="true">
        <span class="hoption-label">Active</span>
        <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
<path
  d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z"
  fill="currentColor"
/>
</svg>
      </li>
      <li class="hoption" id="applied-status-3" role="option" aria-selected="false">
        <span class="hoption-label">Done</span>
      </li>
    </ul>
  </div>
  <button class="hfilter-chip" type="button" aria-haspopup="dialog" popovertarget="applied-more-filters" aria-expanded="false" style="anchor-name:--applied-more-filters">
    <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
    <span class="hfilter-chip-label">More filters</span>
    <span class="hfilters-count" hidden>0</span>
  </button>
  <div class="hpopup hfilters-more" id="applied-more-filters" role="dialog" aria-label="More filters" popover style="position-anchor:--applied-more-filters">
    <button class="hfilter-chip" type="button" aria-haspopup="listbox" popovertarget="applied-priority" aria-expanded="false" style="anchor-name:--applied-priority">
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
      <span class="hfilter-chip-label">Priority</span>
      <span class="hfilter-chip-values">
        <span class="hfilter-chip-value">High</span>
      </span>
    </button>
    <div class="hpopup" id="applied-priority" popover style="position-anchor:--applied-priority">
      <ul class="hlistbox" role="listbox" aria-label="Priority" aria-multiselectable="true" tabindex="-1">
        <li class="hoption" id="applied-priority-2" role="option" aria-selected="true">
          <span class="hoption-checkbox" aria-hidden="true"></span>
          <span class="hoption-label">High</span>
        </li>
        <li class="hoption" id="applied-priority-3" role="option" aria-selected="false">
          <span class="hoption-checkbox" aria-hidden="true"></span>
          <span class="hoption-label">Low</span>
        </li>
      </ul>
      <div class="hlistbox-footer">
        <button class="hbutton" data-variant="tertiary" type="button">
          <span class="hbutton-label">Clear filters</span>
        </button>
      </div>
    </div>
  </div>
  <button class="hfilters-reset" type="button" hidden>Reset filters</button>
</div>
```

Without filters behind a chip, leave out that chip and its panel.

## Options

| Hook | Effect |
| --- | --- |
| `hidden` on `.hfilters-count` | None of the filters behind the chip are in force |
| `hidden` on `.hfilters-reset` | There's nothing to reset |

## Appearance and states

- Filters in a row 8px apart, which wraps when they don't fit.
- The chip that opens the rest is a Filter Chip. Its count is 11px in
  `--harmo-color-text-secondary` on `--harmo-color-background-hover`, or
  `--harmo-color-border` while the chip is hovered or open, fully rounded and at
  least 18px wide, with digits of one width.
- The panel is a Popup as wide as its widest filter, and never narrower than the
  chip, with 12px of padding and its filters in a column 8px apart. It grows as a
  filter gains values.
- Reset is 14px and medium weight in `--harmo-color-primary`, with no background,
  and 25px tall. It darkens on hover and press, and long text wraps.
- Right-to-left, the first filter is on the right.

## Accessibility

- The row is a named group.
- The chip that opens the rest has `aria-haspopup="dialog"` and `aria-expanded`,
  and the count is part of its text.
- The panel is a named dialog. Opening moves focus to its first filter that can
  take it. A filter's list or panel opens over it: Escape closes that first, then
  the panel, and a press inside it leaves the panel open.
- Reset goes once nothing is in force, so pressing it moves focus to the first
  filter that can take it.
- Text comes from your app, in its language.

## What a script does

A filter is in force when its chip shows a value: a `.hfilter-chip-values` with
something in it. So a Filter Chip, a [Date Filter](date-filter.md), and a filter
of your own that draws the same parts all count, with nothing to tell the row.

| Change | When |
| --- | --- |
| The text and `hidden` of `.hfilters-count` | A filter behind the chip gains or loses its value |
| `hidden` on Reset | Any filter gains or loses its value |
| Move focus to the panel's first filter that can take it | The panel opens |
| Put every filter back as it started, close anything left open, and move focus to the first that can take it | Reset is pressed |

The playground's example script, `examples/html/src/scripts/filters.js`, does
all of this.

## React

`<Filters>` renders the row, and does what the script above does. Each child is
one filter: fragments are looked through, and a component of yours counts as one.
Other props go to the row.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required: the row's name, such as "Filter tasks" |
| `visibleCount` | How many filters stay in the row; the rest go behind a chip. Without it, all stay |
| `moreLabel` | Required with `visibleCount`: the chip's text, and the panel's name |
| `resetLabel` | Required: Reset's text |
| `onReset` | Called when Reset is pressed. Clear what your app holds here |
| `showReset` | Shows Reset with no filter in force, for filters outside the row, such as a search field |

The row holds no filter state. Filters given a `defaultValue` go back to it on
Reset. Those given a `value` show what your app sets in `onReset`. A filter that
moves between the row and the panel, because `visibleCount` or the children
changed, starts again, so give it a `value` if that can happen:

```tsx
<Filters
  aria-label="Filter tasks"
  visibleCount={2}
  moreLabel="More filters"
  resetLabel="Reset filters"
  onReset={() => {
    setStatus(null);
    setPriority([]);
    setDue({ gte: null, lte: null });
  }}
>
  <FilterChip label="Status" value={status} onValueChange={setStatus}>…</FilterChip>
  <DateFilter label="Due date" value={due} onValueChange={setDue} … />
  <FilterChip label="Priority" multiple value={priority} onValueChange={setPriority} …>…</FilterChip>
</Filters>
```

To keep filters in the URL, read each `value` from it and write on a change, as
[Date Filter](date-filter.md) shows, and remove them all in `onReset`.

Rendered on a server, the count and Reset wait until the page is ready in the
browser, since they're read from the chips. Use `showReset` where Reset must be
there from the start.

## Tokens

`--harmo-font-family`, `--harmo-font-size-sm`, `--harmo-font-size-3xs`,
`--harmo-font-weight-medium`, `--harmo-color-text-secondary`,
`--harmo-color-background-hover`, `--harmo-color-border`,
`--harmo-color-primary`, `--harmo-color-primary-hover`,
`--harmo-color-primary-active`, `--harmo-border-radius-full`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-duration-fast`, and those of the filters in it.
