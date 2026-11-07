# Select

A form field that picks one or more options from a list: a trigger that looks
like an [Input](input.md), a [Popup](popup.md), and a [Listbox](listbox.md).
For a few short options always in view, use a [Segmented Control](segmented.md)
or a [Radio](radio.md) group; to filter a list or table, use a
[Filter Chip](filter-chip.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `field.css`, `select.css`, `popup.css`, `listbox.css`, `expand-chevron.css` |
| Element | `<button class="hselect" type="button" role="combobox">`, followed by a `.hpopup[popover]` holding a `.hlistbox` |
| Parts | `.hselect-value` and `.hexpand-chevron` in the trigger; `.hoption`, `.hoption-label`, and `.hoption-check` in the list |
| Required | On the trigger: `aria-labelledby` or `aria-label`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (the list's id), `popovertarget` (the popup's id), and `style="anchor-name: --…"` matching the popup's `position-anchor`. On each option: `role="option"`, an `id`, and `aria-selected`. In a form: `data-name` on the trigger, `data-value` on each option, and the hidden inputs |
| Unique | Every id, and each anchor name |
| Script | Required: keyboard, selection, the shown value, and the form value; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <span class="hlabel" id="channel-label">Channel</span>
  <button class="hselect" id="channel" type="button" data-name="channel" role="combobox"
    aria-labelledby="channel-label" aria-haspopup="listbox" aria-expanded="false"
    aria-controls="channel-listbox" popovertarget="channel-popup" style="anchor-name: --channel">
    <span class="hselect-value">WhatsApp</span>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
      <g class="hexpand-chevron-head">
        <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
        <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
      </g>
    </svg>
  </button>
  <div class="hpopup" id="channel-popup" popover style="position-anchor: --channel">
    <ul class="hlistbox" id="channel-listbox" role="listbox" aria-labelledby="channel-label">
      <li class="hoption" id="channel-whatsapp" role="option" data-value="whatsapp" aria-selected="true">
        <span class="hoption-label">WhatsApp</span>
        <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
          <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" />
        </svg>
      </li>
      <li class="hoption" id="channel-telegram" role="option" data-value="telegram" aria-selected="false">
        <span class="hoption-label">Telegram</span>
      </li>
    </ul>
  </div>
  <input type="hidden" name="channel" value="whatsapp" />
</div>
```

For several values, set `aria-multiselectable="true"` on the list and use
`.hoption-checkbox` as [Listbox](listbox.md) describes; the value shows the
chosen labels, separated by commas.

The trigger is a button, so in a form it submits nothing. Hidden inputs carry
the value instead, as a native `<select>` would send it:

- `data-name` on the trigger is their name, and each option's `data-value` is
  what it sends.
- One `<input type="hidden">` per chosen value follows the popup. A single
  select always has one, empty while nothing is chosen. A multi-select has
  none while nothing is chosen, so the form leaves its name out, like
  `<select multiple>`.
- Disable the hidden inputs with the trigger, so a disabled select sends
  nothing; a disabled `<fieldset>` disables both.
- Resetting the form leaves hidden inputs as they are, so a script restores
  them along with the selection.
- Browsers don't validate hidden inputs, so `required` does nothing on them:
  check that something is chosen yourself, and say so in the Field's
  [Error](field.md).

## Options

| Hook | Effect |
| --- | --- |
| `data-placeholder` on `.hselect-value` | Placeholder text, such as "Select a channel" |
| `aria-expanded="true"` | Open: focus border and ring, and the chevron folds up |
| `aria-invalid="true"` | Red border, as for [Input](input.md) |
| `disabled` | Disabled, as for Input; the chevron follows the disabled text color |
| `data-name` on the trigger | In a form, the name its hidden inputs send |
| `data-value` on an option | In a form, the value that option sends |

## Appearance and states

- The same box and states as [Input](input.md), so a select and an input are
  the same 34px height side by side.
- The value is one line and ends with an ellipsis when it doesn't fit,
  including several chosen labels.
- The chevron is an [Expand Chevron](expand-chevron.md) in
  `--harmo-color-text-secondary`, 20px from the end. It folds up in 200ms
  (`--harmo-ease-in-out-cubic`) while open, and flips without motion under
  reduced motion.

## Accessibility

- `<button role="combobox">` gets native focus and `disabled`, and
  `aria-labelledby` names it from the Field's label.
- Focus stays on the trigger while the list is open (the WAI-ARIA select-only
  combobox pattern); the trigger's `aria-activedescendant` names the
  highlighted option.
- Keys: Down and Up move the highlight, Home and End go to the first and last
  option, typing jumps to the option whose label starts with the typed
  letters, Enter or Space chooses, Escape closes. Disabled options are
  skipped.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` on the trigger | On every open and close (see [Popup](popup.md)) |
| The [Listbox](listbox.md) behavior: highlight, `aria-activedescendant`, selection, and closing after a single-select choice | While open |
| The value text, or `data-placeholder` when nothing is chosen | When the selection changes |
| The hidden inputs: one per chosen `data-value`, named by `data-name` | When the selection changes |
| The selection, value text, and hidden inputs as the page loaded them | On the form's `reset` |
| `disabled` on the hidden inputs | When the trigger is disabled or enabled |

`examples/html/src/scripts/select.js` and `listbox.js` are example scripts
that do all of this.

## React

`<Select>` renders this markup and does all of the above. With `label`, it
renders the Field too; without one, name it with `aria-label`, or place it in
a [Setting](settings.md#react), which names it. A disabled Select
has no popup. Its children are `<Option>`s and `<OptionGroup>`s, as in a
[Listbox](listbox.md#react). Other props are the trigger `<button>`'s
attributes.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react); the last three need a `label` |
| `multiple` | Lets several options be chosen; the popup stays open |
| `value` or `defaultValue` | The chosen value, or an array of them with `multiple` |
| `onValueChange` | Called with the new value or array |
| `name` | Adds the hidden inputs a form submits; a form reset restores `defaultValue` |
| `placeholder` | Shown, grayed, while nothing is chosen |
| `searchLabel` | Adds a search row, with this as its placeholder and name |
| `emptyMessage` | Required with `searchLabel`: shown when the search matches nothing, such as "No agents found" |

```tsx
<Select label="Channel" name="channel" defaultValue="whatsapp">
  <Option value="whatsapp">WhatsApp</Option>
  <Option value="telegram">Telegram</Option>
  <Option value="viber">Viber</Option>
</Select>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-control-height`, `--harmo-duration-fast`, `--harmo-font-family`,
`--harmo-font-size-sm`, `--harmo-font-weight-normal`,
`--harmo-input-box-shadow`, `--harmo-input-color-background`,
`--harmo-input-color-border`.
