# Table

Rows and columns of data. `.htable` styles a normal `<table>` and needs no script;
in React, `<DataTable>` adds selecting rows, links across a row, choosing columns,
and a footer of pages.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `table.css`; `checkbox.css` to select rows; for a footer, `select.css`, `listbox.css`, `popup.css`, `expand-chevron.css`, `pagination.css`, `button.css`, `chevron.css` |
| Element | `<table class="htable">` |
| Parts | Optional: `.htable-container` around it all, `.htable-scroll` around the table, `.htable-row-link` in a row, `.htable-truncate` in a cell, and `.htable-footer` after `.htable-scroll` |
| Required | A name: `aria-label` or `aria-labelledby` on the table, in the page's language. `<th scope="col">` for the columns, and `<th scope="row">` for the cell that names each row |
| Unique | Those of its footer's Select |
| Script | None for the table. Yours for selecting rows, choosing columns, and pages. See What a script does |

## Markup

```html
<div class="htable-container">
  <div class="htable-scroll">
    <table class="htable" aria-label="Tasks">
      <thead>
        <tr>
          <th scope="col">Task</th>
          <th scope="col">Status</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Write the brief</th>
          <td>Active</td>
          <td>Nov 18</td>
        </tr>
        <tr>
          <th scope="row">Review the designs</th>
          <td>Blocked</td>
          <td>Nov 20</td>
        </tr>
        <tr>
          <th scope="row">Ship the release</th>
          <td>Done</td>
          <td>Nov 9</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

A row that goes somewhere has its link, or a button, in the cell that names it:

```html
<tr>
  <th scope="row"><a class="htable-row-link" href="/tasks/brief">Write the brief</a></th>
  <td>Active</td>
</tr>
```

To select rows, add a first column of checkboxes:

```html
<th scope="col" class="htable-select">
  <input class="hcheckbox" type="checkbox" aria-label="Select all tasks" />
</th>
<!-- and in each row -->
<td class="htable-select">
  <input class="hcheckbox" type="checkbox" aria-label="Select Write the brief" />
</td>
```

A footer goes after `.htable-scroll`, inside `.htable-container`:

```html
<div class="htable-footer">
  <p class="htable-footer-summary">11–20 of 115 results</p>
  <div class="htable-footer-controls">
    <div class="htable-footer-rows">
      <span class="htable-footer-label" id="t-pages-1">Rows per page</span>
      <button class="hselect" type="button" role="combobox" aria-labelledby="t-pages-1" aria-haspopup="listbox" aria-expanded="false" aria-controls="t-pages-2" popovertarget="t-pages-3" style="anchor-name:--t-pages-3">
        <span class="hselect-value">10</span>
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
<g class="hexpand-chevron-head">
<line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
<line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
</g>
</svg>
      </button>
      <div class="hpopup" id="t-pages-3" popover style="position-anchor:--t-pages-3">
        <ul class="hlistbox" id="t-pages-2" role="listbox" aria-labelledby="t-pages-1">
          <li class="hoption" id="t-pages-4" role="option" aria-selected="true">
            <span class="hoption-label">10</span>
            <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
<path
d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z"
fill="currentColor"
/>
</svg>
          </li>
          <li class="hoption" id="t-pages-5" role="option" aria-selected="false">
            <span class="hoption-label">20</span>
          </li>
          <li class="hoption" id="t-pages-6" role="option" aria-selected="false">
            <span class="hoption-label">50</span>
          </li>
        </ul>
      </div>
    </div>
    <p class="htable-footer-status" role="status">Page 2 of 12</p>
    <nav class="hpagination" aria-label="Pages">
      <button class="hbutton" data-variant="secondary" type="button">
        <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
fill="currentColor"
/>
</svg>
        <span class="hbutton-label">Previous</span>
      </button>
      <button class="hbutton" data-variant="secondary" type="button">
        <span class="hbutton-label">Next</span>
        <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
fill="currentColor"
/>
</svg>
      </button>
    </nav>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `.htable-scroll` | Scrolls a table too wide for its place, in its own space. While it overflows, add `tabindex="0"`, `role="region"`, and an `aria-label` |
| `.htable-row-link` | The row is a link or a button all the way across, with a hover background |
| `data-emphasis` on a `<td>` | The cell stands out, as the cell that names its row does |
| `.htable-truncate` | A span in a cell: ends with an ellipsis past 360px |
| `.htable-footer` | The range, rows per page, the page, and Previous and Next. Stays at the bottom of the window while the table runs past it |
| `data-footer="static"` on `.htable-container` | The footer stays under the table instead |

## Appearance and states

- The columns fit their content and the last takes what's left. Text stays on one
  line: a table too wide for its place scrolls.
- Headers are 12px and medium weight in `--harmo-color-text`, with 16px either side
  and 12px under them. In a `.htable-scroll` with a height, they stay in view.
- Cells are 14px in `--harmo-color-text-secondary`, with 12px by 16px of padding and
  a 1px `--harmo-color-border` line above. The cell that names its row, and any
  with `data-emphasis`, is medium weight in `--harmo-color-text`.
- A row that goes somewhere has `--harmo-color-background-hover` when hovered, and
  the focus ring around the whole row. Anything else in it that can be used, such
  as a checkbox or a link, sits above that and works on its own.
- The footer has 12px of padding above and below, a line above, and its background.
  Its two sides are at least 48px apart, and wrap on a narrow screen.
- Right-to-left, the first column is on the right.

## Accessibility

- A native `<table>`: name it, and use `scope` on its header cells, so a screen
  reader can say which row and column a cell is in.
- The link or button that makes a row go somewhere is a real one, in the cell that
  names the row, so it works from the keyboard and can open in a new tab. Its text
  is the row's name. Don't put another link or button in that cell, and where rows
  go somewhere, keep that column from being hidden.
- That link or button covers the row, so hovering text in another cell finds it
  instead. A `title` on that text won't show, as on a truncated cell in a row that
  links. A control in the cell, such as a Tooltip's button, sits above it and works.
- Give each checkbox a name that says which row it's for.
- When the selection empties and focus has nowhere to be, such as after Deselect
  goes, move it to the checkbox in the header.
- The page in the footer is a status, so a change is read out.
- While a table overflows, its scroll area can take focus, with the ring, so it can
  be scrolled from the keyboard even with nothing else in it to focus. It's named
  as the table is.

## What a script does

Nothing, for a table on its own. Your app:

| Change | When |
| --- | --- |
| `checked`, and `indeterminate` on the checkbox in the header | Rows are selected |
| Leaves out, or sets `hidden` on, a column's cells | Columns are chosen |
| The rows, the range, and the page | The page or rows per page changes |

The playground's example script, `examples/html/src/scripts/table.js`, does this.

## React

`<DataTable>` renders the table from `columns` and `rows`. Other props go to its
outer element.

| Prop | Effect |
| --- | --- |
| `aria-label` or `aria-labelledby` | Required: the table's name |
| `columns` | Required: an array of columns, below |
| `rows` | Required: the rows to show |
| `getRowId` | Each row's id, as a string, which must be unique. Required unless rows have an `id`, which it uses by default |
| `hiddenColumns` | The ids of columns to leave out |
| `rowHref` | Makes each row a link, through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |
| `onRowClick` | Makes each row a button. With `rowHref`, it's called as the link is followed |
| `selection` | From `useRowSelection`: adds a column of checkboxes. Needs `selectAllLabel` and `selectRowLabel` |
| `selectAllLabel` | The name of the checkbox in the header |
| `selectRowLabel` | Each row's checkbox's name, such as ``(row) => `Select ${row.name}` `` |
| `empty` | What stands in for the table when there are no rows, such as an [Empty State](empty-state.md) |
| `footer` | What goes under the table while there are rows, such as a `<DataTableFooter>` |
| `stickyFooter` | `false`: the footer stays under the table |

| Column | Effect |
| --- | --- |
| `id` | Required: its id |
| `header` | Required: its header |
| `cell` | Required: what a row shows in it, as ``(row) => row.name`` |
| `primary` | This column names the row. By default, the first one shown does |
| `emphasis` | Its cells stand out, as the cell that names the row does, for a column that matters as much |
| `truncate` | Ends with an ellipsis past 360px, with the whole text in a `title` if it's a string |

When the selection empties and focus has nowhere to be, it goes to the checkbox in
the header. With `rowHref` or `onRowClick`, pin the column that names the row, so
that hiding it can't put the link around another column's own.

Its `cell` functions can't cross from a Server Component to a Client Component, so
define the columns in a Client Component, which is still rendered on the server, and
give it plain rows:

```tsx
"use client";

import { DataTable, type DataTableColumn } from "@harmo-ui/react";

const columns: DataTableColumn<Task>[] = [
  { id: "task", header: "Task", cell: (row) => row.task },
  { id: "status", header: "Status", cell: (row) => row.status },
];

export function TasksTable({ rows }: { rows: Task[] }) {
  return <DataTable aria-label="Tasks" columns={columns} rows={rows} />;
}
```

`useRowSelection()` holds which rows are selected, and returns `selectedIds`,
`count`, `toggle(id)`, `toggleAll(ids)`, `clear()`, `isSelected(id)`, and
`isAllSelected(ids)`. `toggleAll` selects just those ids, or none if they're all
selected. Pair it with a [Selection Bar](selection-bar.md):

```tsx
const selection = useRowSelection();

<Toolbar
  controls={
    selection.count > 0 ? (
      <SelectionBar
        label={`${selection.count} selected`}
        deselectLabel="Deselect"
        onDeselect={selection.clear}
      >
        <Button variant="secondary" size="small">Assign</Button>
      </SelectionBar>
    ) : (
      <Button variant="secondary" size="small">Export</Button>
    )
  }
>
  …
</Toolbar>
<DataTable
  aria-label="Tasks"
  selection={selection}
  selectAllLabel="Select all tasks"
  selectRowLabel={(row) => `Select ${row.name}`}
  columns={columns}
  rows={rows}
/>
```

`useColumnVisibility({ columns, pinned, defaultVisible, storageKey })` holds which
columns show. `pinned` columns always do. With a `storageKey`, the choice is kept in
`localStorage`, and read once the page is ready, so a server and a browser agree; a
different key starts from its own choice, or the defaults. Until a choice is made,
columns that arrive later follow the defaults; after one, a new column stays hidden
until it's chosen. It returns `visible`, `hidden`, `toggleable`, `setVisible(ids)`,
and `toggle(id)`, which stay the same from render to render while nothing changes.
There's no component for choosing columns: it's a Button, a [Popup](popup.md), and a
[Listbox](listbox.md):

```tsx
const visibility = useColumnVisibility({
  columns: ["task", "status", "due"],
  pinned: ["task"],
  storageKey: "tasks-columns",
});

<Popup trigger={<Button variant="secondary" size="small">Edit columns</Button>}>
  <Listbox
    aria-label="Columns"
    multiple
    value={visibility.visible.filter((id) => visibility.toggleable.includes(id))}
    onValueChange={visibility.setVisible}
  >
    <Option value="status">Status</Option>
    <Option value="due">Due</Option>
  </Listbox>
</Popup>
<DataTable aria-label="Tasks" hiddenColumns={visibility.hidden} columns={columns} rows={rows} />
```

`<DataTableFooter>` is the footer, around a [Pagination](pagination.md):

| Prop | Effect |
| --- | --- |
| `summary` | Required: the range, such as "11–20 of 115 results" |
| `status` | The page, such as "Page 2 of 12", in a status |
| `rowsPerPageLabel`, `rowsPerPage`, `rowsPerPageOptions`, `onRowsPerPageChange` | Together, a Select of rows per page |

## Tokens

`--harmo-font-family`, `--harmo-font-size-sm`, `--harmo-font-size-2xs`,
`--harmo-font-weight-normal`, `--harmo-font-weight-medium`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-border`, `--harmo-color-background`,
`--harmo-color-background-hover`, `--harmo-focus-outline`, `--harmo-duration-fast`.
