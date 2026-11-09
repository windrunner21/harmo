# Filter Chip

A filter in a toolbar above a list or table, such as Status or Channel: a
dashed chip with a plus that opens a [Popup](popup.md) holding a
[Listbox](listbox.md) or a small panel, and shows what's chosen. For picking a
value in a form, use a [Select](select.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `filter-chip.css`, `popup.css`; `listbox.css` for a list; `button.css` for a footer or a panel's action; `field.css` and `input.css` for a text panel |
| Element | `<button class="hfilter-chip" type="button">`, followed by a `.hpopup[popover]` |
| Parts | The plus as a direct `.hicon`, `.hfilter-chip-label`, `.hfilter-chip-values`, `.hfilter-chip-value` |
| Required | `aria-expanded`, `popovertarget` (the popup's id), and `style="anchor-name: --…"` matching the popup's `position-anchor`; `aria-haspopup="listbox"` when it opens a list |
| Unique | Every id, and each anchor name |
| Script | Required: the shown values, the Clear filters footer, and closing; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hfilter-chip" type="button" aria-haspopup="listbox" aria-expanded="false"
  popovertarget="status-filter" style="anchor-name: --status-filter">
  <svg class="hicon" viewBox="0 0 24 25" aria-hidden="true" focusable="false">…</svg>
  <span class="hfilter-chip-label">Status</span>
  <span class="hfilter-chip-values">
    <span class="hfilter-chip-value">Delivered</span>
    <span class="hfilter-chip-value">Read</span>
  </span>
</button>
<div class="hpopup" id="status-filter" popover style="position-anchor: --status-filter">
  <ul class="hlistbox" role="listbox" aria-label="Status" aria-multiselectable="true" tabindex="-1">
    <li class="hoption" id="status-delivered" role="option" data-value="delivered" aria-selected="true">
      <span class="hoption-checkbox" aria-hidden="true"></span>
      <span class="hoption-label">Delivered</span>
    </li>
    <li class="hoption" id="status-read" role="option" data-value="read" aria-selected="true">
      <span class="hoption-checkbox" aria-hidden="true"></span>
      <span class="hoption-label">Read</span>
    </li>
    <li class="hoption" id="status-failed" role="option" data-value="failed" aria-selected="false">
      <span class="hoption-checkbox" aria-hidden="true"></span>
      <span class="hoption-label">Failed</span>
    </li>
  </ul>
  <div class="hlistbox-footer">
    <button class="hbutton" data-variant="tertiary" type="button">
      <span class="hbutton-label">Clear filters</span>
    </button>
  </div>
</div>
```

- Leave out `.hfilter-chip-values` until something is chosen, or leave it
  empty with no whitespace inside, which hides it.
- Show up to two values; beyond that, one value with a count such as
  "3 selected". The app supplies the wording.
- While a multi-select chip has values, end its list with a Clear filters
  button in a `.hlistbox-footer`, so the values don't have to be removed one by
  one. Render the footer only then.
- Resetting every chip at once is what a [Filters](filters.md) row is for.

A chip can open a panel instead of a list, such as a text filter. The popup has
no padding, so the panel lays out its own content:

```html
<button class="hfilter-chip" type="button" aria-expanded="false"
  popovertarget="name-filter" style="anchor-name: --name-filter">
  <svg class="hicon" viewBox="0 0 24 25" aria-hidden="true" focusable="false">…</svg>
  <span class="hfilter-chip-label">Name contains</span>
</button>
<div class="hpopup" id="name-filter" popover style="position-anchor: --name-filter">
  <div style="display: grid; gap: 16px; padding: 12px">
    <div class="hfield">
      <label class="hlabel" for="name-filter-value">Name contains</label>
      <input class="hinput" id="name-filter-value" name="name" type="text" />
    </div>
    <button class="hbutton" type="button" popovertarget="name-filter" popovertargetaction="hide">
      <span class="hbutton-label">Apply</span>
    </button>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `.hfilter-chip-values` with values | A divider, then each `.hfilter-chip-value` as a small gray pill |
| `aria-expanded="true"` | Open: the hover background stays |
| `disabled` | Dimmed, not-allowed cursor; it can't open |

## Appearance and states

- 27px tall: 2px 8px padding, 14px `--harmo-color-text-secondary` text on a
  1.5 line, a 1px dashed `--harmo-color-border` border, fully rounded, 4px
  between its parts.
- The plus is an `.hicon`, 18px at 14px text.
- Hover (hover devices) and open: `--harmo-color-background-hover`, fading in
  over 150ms (`--harmo-duration-fast`).
- Values: a 1px `--harmo-color-border` divider and 4px before them; each is
  11px on `--harmo-color-background-hover`, or `--harmo-color-border` while the
  chip is hovered or open, with a 4px radius, 2px 4px padding, and ends with an
  ellipsis past 12rem. The chip itself never wraps.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).

## Accessibility

- A `<button>` with `aria-expanded`, and `aria-haspopup="listbox"` when it
  opens a list. The plus is decorative.
- The chosen values are part of the button's text, so screen readers hear
  them with its name: "Status Delivered Read, button, collapsed".

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` on the chip | On every open and close (see [Popup](popup.md)) |
| The values in `.hfilter-chip-values` | When the selection changes or a panel is applied |
| Render or remove the Clear filters footer, and clear the selection when it's pressed | While a multi-select chip has values |
| Close the popup | After Apply; a single-select list closes itself (see [Listbox](listbox.md)) |

`examples/html/src/scripts/filter-chip.js` is an example script.

## React

`<FilterChip>` renders the chip. Given options as children, it also renders
the popup and list, shows the chosen labels, and shows Clear filters while a
multi-select has values; a single choice closes it. Without children, it's
the chip alone, to give a [Popup](popup.md#react) of your own, such as a text
filter. Other props are the chip `<button>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The chip's label, and the list's name |
| `values` | Without children: the values to show |
| `formatCount` | The text shown for more than two values, such as ``(count) => `${count} selected` ``. Required with `multiple`; with `values`, every value shows without it |
| `multiple` | Lets several options be chosen |
| `value` or `defaultValue` | The chosen value, or an array of them with `multiple` |
| `onValueChange` | Called with the new value or array |
| `searchLabel` | Adds a search row, with this as its placeholder and name |
| `emptyMessage` | Required with `searchLabel`: shown when the search matches nothing, such as "No channels found" |
| `clearLabel` | Required with `multiple`: the footer button's text, such as "Clear filters" |

```tsx
<FilterChip
  label="Priority"
  multiple
  defaultValue={["high", "urgent"]}
  clearLabel="Clear filters"
  formatCount={(count) => `${count} selected`}
>
  <Option value="low">Low</Option>
  <Option value="medium">Medium</Option>
  <Option value="high">High</Option>
  <Option value="urgent">Urgent</Option>
</FilterChip>
```

## Tokens

`--harmo-border-radius-full`, `--harmo-border-radius-sm`,
`--harmo-color-background-hover`, `--harmo-color-border`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-3xs`,
`--harmo-font-size-sm`, `--harmo-opacity-disabled`.
