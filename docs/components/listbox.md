# Listbox

The option list inside a [Popup](popup.md), with optional groups, search, and
multiple selection. [Select](select.md) and [Filter Chip](filter-chip.md) use
it. Scripts own the behavior; CSS styles the state they set.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `listbox.css`, `popup.css`; `button.css` for a footer or a button that opens it |
| Element | `<ul class="hlistbox" role="listbox">` inside a `.hpopup` |
| Parts | `.hoption`, `.hoption-label`, `.hoption-text`, `.hoption-description`, `.hoption-match`, `.hoption-check`, `.hoption-checkbox`, `.hoption-badge`, `.hoption-group`, `.hoption-group-label`, `.hlistbox-search`, `.hlistbox-search-input`, `.hlistbox-empty`, `.hlistbox-footer` |
| Required | `aria-label` or `aria-labelledby` on the list, and `tabindex="-1"` when the list takes focus itself (no search row, and not a [Select](select.md)'s); `role="option"`, an `id`, and `aria-selected` on each option; `role="group"` and `aria-labelledby` (its label's id) on each group |
| Unique | Every id |
| Script | Required: highlight, keyboard, selection, and search; see [What a script does](#what-a-script-does) |

## Markup

A button opens the popup; see [Popup](popup.md) for the trigger.

```html
<button class="hbutton" data-variant="secondary" type="button" aria-haspopup="listbox"
  aria-expanded="false" popovertarget="channel-popup" style="anchor-name: --channel">
  <span class="hbutton-label">Channel</span>
</button>
<div class="hpopup" id="channel-popup" popover style="position-anchor: --channel">
  <div class="hlistbox-search">
    <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">…</svg>
    <input class="hlistbox-search-input" type="text" role="combobox"
      placeholder="Search channels" aria-label="Search channels" aria-expanded="true"
      aria-controls="channel-listbox" aria-autocomplete="list" />
  </div>

  <ul class="hlistbox" id="channel-listbox" role="listbox" aria-label="Channel">
    <li class="hoption" id="channel-all" role="option" aria-selected="false">
      <span class="hoption-label">All channels</span>
    </li>
    <li class="hoption-group" role="presentation">
      <span class="hoption-group-label" id="channel-messaging">Messaging</span>
      <ul role="group" aria-labelledby="channel-messaging">
        <li class="hoption" id="channel-whatsapp" role="option" aria-selected="true">
          <span class="hoption-label">WhatsApp</span>
          <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
            <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" />
          </svg>
        </li>
        <li class="hoption" id="channel-viber" role="option" aria-selected="false" aria-disabled="true">
          <span class="hoption-label">Viber</span> <span class="hoption-badge">Soon</span>
        </li>
      </ul>
    </li>
  </ul>

  <div class="hlistbox-footer">
    <button class="hbutton" data-variant="tertiary" type="button">
      <span class="hbutton-label">Clear filters</span>
    </button>
  </div>
</div>
```

To filter, set `hidden` on each option that doesn't match, and on a group
left with none; the options stay in the page, selection included. After the
list, a `<p class="hlistbox-empty" role="status">` is in the page from the
start, empty, taking no room; when nothing matches, put the message in it,
and take it out again once something does. A screen reader reads a status
as its text changes, but not always one added with its text already in it.
A list with every option hidden, or with nothing inside it (not even
whitespace), loses its padding and collapses:

```html
<ul class="hlistbox" id="channel-listbox" role="listbox" aria-label="Channel"></ul>
<p class="hlistbox-empty" role="status">No channels found</p>
```

Put each option's text in `.hoption-label`. The check mark goes only in the
selected option.

An option can say more under its label, such as where a page is: put the
label and a `.hoption-description` in a `.hoption-text`, with a space between
them, so the option is read "Plans, Settings". A search can mark what it
found in either with `<mark class="hoption-match">`, as a
[Command Menu](command-menu.md) does:

```html
<li class="hoption" id="search-plans" role="option" aria-selected="false">
  <span class="hoption-text">
    <span class="hoption-label">Pl<mark class="hoption-match">an</mark>s</span>
    <span class="hoption-description">Settings</span>
  </span>
</li>
```

For multi-select, set `aria-multiselectable="true"` on the list and start each
option with `<span class="hoption-checkbox" aria-hidden="true"></span>`. It is
drawn like `.hcheckbox` but is not an input, so nothing inside the list takes
focus.

## Options

| Hook | Effect |
| --- | --- |
| `data-active` on an option | Highlighted; follows the keyboard and pointer, instantly; never on a disabled option |
| `aria-selected="true"` on an option | Shows `.hoption-check` (single) or the ticked `.hoption-checkbox` (multiple) |
| `aria-disabled="true"` on an option | Gray text, not-allowed cursor, no check |
| `aria-multiselectable="true"` on the list | Multi-select: `.hoption-checkbox` and no check mark |
| `hidden` on an option or group | Hidden, such as by a search; skipped by the keyboard, with the options of a hidden group |
| `data-value` on an option | No style: the value it stands for, which a script reports or a [Select](select.md) submits |

## Appearance and states

| Part | Appearance |
| --- | --- |
| `.hlistbox` | 4px padding, at most 300px tall and `min(32rem, 100vw - 18px)` wide unless its popup is wider, which it then fills, scrolls with a hidden scrollbar |
| `.hoption` | 8px 12px padding, 14px `--harmo-color-text-secondary`, one line |
| `.hoption-label` | The option text; ends with an ellipsis rather than wrapping, so rows keep one height |
| `.hoption-text` | The label in `--harmo-color-text` over its description, 2px apart |
| `.hoption-description` | 13px, in the option's color; ends with an ellipsis, as the label does |
| `.hoption-match` | `--harmo-color-primary-tint` behind the text, with 2px corners; in forced-colors mode, the system's mark colors |
| `.hoption-badge` | Uppercase 11px pill, 20px after the label |
| `.hoption-check` | A check mark at `1em` in `--harmo-color-primary` |
| `.hoption-checkbox` | A 16px checkbox drawing; its mark uses Checkbox's fractions of the box; fill and border fade in 150ms |
| `.hoption-group-label` | Uppercase 11px bold `--harmo-color-primary`; a divider above it unless its group is the list's first child |
| `.hlistbox-search` | Search icon and borderless input above a divider |
| `.hlistbox-empty` | The status for no matches, `role="status"`, in the page from the start and empty until nothing matches; empty, it takes no room |
| `.hlistbox-footer` | Divider and a full-width button |

- With nothing highlighted, a single-select keeps its selected option
  highlighted.
- In a single-select, every option keeps room at its end for the check, so
  the list is as wide as its longest option whichever one is selected.
- In forced-colors mode the highlighted option is outlined in the system
  highlight color, since backgrounds are removed.

## Accessibility

- `role="listbox"` with `role="option"` items; groups are `role="group"`
  labelled by their `.hoption-group-label`.
- Focus stays on one element while the list is open, and its
  `aria-activedescendant` names the highlighted option, so screen readers
  announce it as the highlight moves: a [Select](select.md) trigger keeps
  focus; a list with a search row moves it to the search field; otherwise the
  list itself takes focus (with `tabindex="-1"`). It has no focus ring of its
  own, since the highlighted option shows where focus is. With keyboard focus
  on the list and no option highlighted, such as after the pointer leaves it,
  its popup shows the focus ring.
- Keys: Down and Up move the highlight, Home and End go to the first and last
  option, and typing jumps to the next option whose label starts with the
  typed letters (except in a search field), leaving out what's `aria-hidden` in
  it, such as a flag. Enter chooses; in a multi-select,
  Space toggles. Disabled options are skipped. With nothing to choose, Enter in
  the search field does nothing, so it can't submit the form around it.
- The search field needs no focus ring: its caret shows focus.

## What a script does

| Change | When |
| --- | --- |
| Highlight the option a key asked for, else the selected one, else the first enabled one | As the list opens (`beforetoggle`), so a key pressed straight after moves on from it |
| Move `data-active` and the focused element's `aria-activedescendant` | Arrow keys, Home, End, type-to-jump, and pointer movement |
| Toggle `aria-selected` and move the check mark | Enter, Space in a multi-select, or a click |
| Close the popup, which returns focus to what opened it; a multi-select stays open | After a single-select choice, even of the selected option |
| Move focus to the search field | When a list with a search row opens |
| Clear the search field and show every option | Before the list opens (`beforetoggle`, in the capture phase, so before anything measures the popup), so each opening starts from the whole list |
| Set `hidden` on the options and groups that don't match, by their label, description, or keywords, and put the message in `.hlistbox-empty` when none do, emptying it once some do | As the search text changes |
| Set a truncated `.hoption-label`'s `title` to its full text, and remove it when it fits | When the list opens or resizes, so hovering shows the whole option |

`examples/html/src/scripts/listbox.js` is an example script that does all of
this; its search hides the options whose label, description, and keywords
(`data-example-keywords`) don't contain the typed text. An app with a long or remote list may filter on its server and render
only the matches instead.

## React

`<Listbox>` renders the list, with `<Option>` and `<OptionGroup>` children,
and does all of the above. Put it in a [Popup](popup.md#react), and name it
with `aria-label` or `aria-labelledby`. Other props are the `<ul>`'s
attributes.

| Prop | Effect |
| --- | --- |
| `multiple` | Lets several options be chosen; the popup stays open |
| `value` or `defaultValue` | The chosen value, or an array of them with `multiple` |
| `onValueChange` | Called with the new value or array |
| `searchLabel` | Adds the search row, with this as its placeholder and name |
| `emptyMessage` | Required with `searchLabel`: shown when the search matches nothing, such as "No agents found" |
| `footer` | Placed in the footer, such as a tertiary `<Button>` |

`<Option>` takes its `value`, its label as children, and optionally
`disabled`, a `badge`, such as "Soon", a `description` under its label, and
`keywords`, words a search finds it by that it doesn't show, such as
`["billing"]` for Plans. A search finds an option by its label, description,
and keywords. `<OptionGroup>` takes a `label`, and `filter={false}` for
options a search shouldn't hide, such as results your app found for it.
Other props are the `<li>`'s attributes: an `id` replaces the generated one,
and `hidden` hides the option, or a group with its options, as a search does.
A group inside another takes its `hidden` and `filter={false}` too.

```tsx
<Popup
  trigger={
    <Button variant="secondary" aria-haspopup="listbox">
      Period
      <ExpandChevron />
    </Button>
  }
>
  <Listbox aria-label="Period" defaultValue="30">
    <Option value="7">Last 7 days</Option>
    <Option value="30">Last 30 days</Option>
    <Option value="90">Last 90 days</Option>
  </Listbox>
</Popup>
```

## Tokens

`--harmo-border-radius-full`, `--harmo-border-radius-sm`,
`--harmo-color-background`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-color-border-control`,
`--harmo-color-primary`, `--harmo-color-primary-tint`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-duration-fast`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-3xs`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-font-weight-bold`.
