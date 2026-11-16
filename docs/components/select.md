# Select

A form field that picks one or more options from a list: a trigger that looks
like an [Input](input.md), a [Popup](popup.md), and a [Listbox](listbox.md).
In a form, a native `<select>` sends its value, and shows in the trigger's
place until a script takes over, so the form can be filled in and sent without
JavaScript. For a few short options always in view, use a
[Segmented Control](segmented.md) or a [Radio](radio.md) group; to filter a
list or table, use a [Filter Chip](filter-chip.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `field.css`, `select.css`, `popup.css`, `listbox.css`, `expand-chevron.css` |
| Element | `<button class="hselect" type="button" role="combobox">`, followed by a `.hpopup[popover]` holding a `.hlistbox`; in a form, after a `<span class="hselect-fallback">` |
| Parts | `.hselect-value` and `.hexpand-chevron` in the trigger; `.hoption`, `.hoption-label`, and `.hoption-check` in the list; in a form, a native `<select>` and a `.hexpand-chevron` in `.hselect-fallback` |
| Required | On the trigger: `aria-labelledby` or `aria-label`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (the list's id), `popovertarget` (the popup's id), and `style="anchor-name: --…"` matching the popup's `position-anchor`. On each option: `role="option"`, an `id`, and `aria-selected`. In a form: `data-name` on the trigger, `data-value` on each option, and the fallback: a `<select>` with the `name`, the trigger's `aria-labelledby` or `aria-label`, `aria-describedby`, and `aria-invalid`, and an `<option>` for each option; see [In a form](#in-a-form) |
| Unique | Every id, and each anchor name |
| Script | Required: keyboard, selection, the shown value, and the form value; in a form, it hides the fallback, which shows until then. See [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <span class="hlabel" id="channel-label">Channel</span>
  <span class="hselect-fallback">
    <select name="channel" aria-labelledby="channel-label">
      <option value="whatsapp" selected>WhatsApp</option>
      <option value="telegram">Telegram</option>
    </select>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
      <g class="hexpand-chevron-head">
        <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
        <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
      </g>
    </svg>
  </span>
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
</div>
```

For several values, set `aria-multiselectable="true"` on the list and use
`.hoption-checkbox` as [Listbox](listbox.md) describes; the value shows the
chosen labels, separated by commas.

A select that no form sends, such as one that sets how many rows a page
shows, leaves out the fallback, `data-name`, and `data-value`: the trigger
and its popup are the whole select, with or without a script.

### In a form

The trigger is a button, so in a form it sends nothing. A native `<select>`
sends the value instead, in a `.hselect-fallback` just before the trigger,
with the Expand Chevron after it. Until a script runs, or if none does, the
fallback shows in the trigger's place, and the trigger is hidden; once one
does, the fallback is hidden, and the trigger shows. Hidden, the `<select>`
still sends the value, and it's the only control that does: there's no hidden
input beside it.

- `name` on the `<select>` is the name the form sends; `data-name` on the
  trigger is the same name, for scripts that look for the trigger by it.
- An `<option>` for each option, in the list's order, with its
  `data-value` as its `value` and its label as its text, and `selected` on
  each chosen one. An option's icon, description, and badge are left out; a
  disabled or hidden option is `disabled` or `hidden` too; an
  [Option Group](listbox.md) is an `<optgroup>` with its label as `label`,
  and a group inside another adds its options to the outer one.
- A single select with a placeholder starts with
  `<option value="" disabled>`, its text the placeholder's, and `selected`
  while nothing is chosen. One with nothing chosen and no placeholder has the
  same option, empty, so the browser doesn't choose the first option itself.
  The option is disabled, so while it's chosen the form leaves the name out,
  as a native select with a placeholder does.
- Several: `multiple` on the `<select>`, with no empty option and no Expand
  Chevron. While nothing is chosen, the form leaves the name out.
- On the `<select>`, the trigger's `aria-labelledby` or `aria-label`,
  `aria-describedby`, and `aria-invalid`, so the Field's label, description,
  and error name and describe it, as they do the trigger; `required` when the
  trigger has `aria-required="true"`; and `disabled` with the trigger, so a
  disabled select sends nothing. A disabled `<fieldset>` disables both.
- Outside its form, give the trigger and the `<select>` the form's id as
  `form`, as for a native control.
- A form reset puts the `<select>` back as the page loaded it; a script then
  puts the list back to match.
- Once a script has hidden it, the browser can't show its message on the
  `<select>`, so the script removes `required`: check that something is
  chosen yourself, and say so in the Field's [Error](field.md).

## Options

| Hook | Effect |
| --- | --- |
| `data-placeholder` on `.hselect-value` | Placeholder text, such as "Select a channel" |
| `aria-expanded="true"` | Open: focus border and ring, and the chevron folds up |
| `aria-invalid="true"` | Red border, as for [Input](input.md) |
| `disabled` | Disabled, as for Input; the chevron follows the disabled text color |
| `data-name` on the trigger | In a form, the name its `<select>` sends |
| `data-value` on an option | In a form, the value that option sends |
| `hidden` on `.hselect-fallback` (script) | The script has taken over: the fallback is hidden, out of the accessibility tree, and the trigger shows. Without it, the fallback shows, and the trigger after it is hidden |

## Appearance and states

- The same box and states as [Input](input.md), so a select and an input are
  the same 34px height side by side, with the text 10px from the start, where
  an Input's starts.
- The value is one line and ends with an ellipsis when it doesn't fit,
  including several chosen labels.
- The chevron is an [Expand Chevron](expand-chevron.md) in
  `--harmo-color-text-secondary`, 16px from the end, and 16px after the value.
  It folds up in 200ms
  (`--harmo-ease-in-out-cubic`) while open, and flips without motion under
  reduced motion.
- Before its script runs, a select in a form shows its fallback, which looks
  as the closed trigger does and is the same size, in the same place: the
  same box, border, radius, shadow, and type, its text 10px from the start and
  ending where the trigger's does, a placeholder grayed in
  `--harmo-color-text-tertiary`, and the chevron drawn over its end, where the
  trigger's is. It takes the trigger's hover, focus, invalid, and disabled
  looks too, so nothing moves or changes as the script takes over. It shows
  the chosen option's label: what `renderValue` shows instead in React comes
  with the trigger. Opened, the list is the browser's own.
- With `multiple`, the fallback is a list of the options as tall as the
  trigger, one row in view, its text where the trigger's is, which scrolls;
  it has no chevron, and its chosen rows are tinted in
  `--harmo-color-primary-tint`. So it isn't the trigger's look, but it takes
  the same room. On a phone, it opens the system's picker.

## Accessibility

- `<button role="combobox">` gets native focus and `disabled`, and
  `aria-labelledby` names it from the Field's label.
- Focus stays on the trigger while the list is open (the WAI-ARIA select-only
  combobox pattern); the trigger's `aria-activedescendant` names the
  highlighted option. With `searchLabel`, focus moves to the search field as
  the list opens, and the search field's `aria-activedescendant` names it
  instead.
- Keys: Down and Up move the highlight, Home and End go to the first and last
  option, typing jumps to the option whose label starts with the typed
  letters, Enter or Space chooses, Escape closes. With a search row, Down and
  Up on the closed trigger open it too, as without one. Disabled options are
  skipped.
- Without a script, before it loads or if it never does, the fallback is a
  native `<select>`: the Field's label names it, its description and error
  describe it, and `aria-invalid` and `required` mark it, as they do the
  trigger. Its keys, and how a screen reader meets it, are the browser's own;
  typing jumps to an option by its first letters, but there's no search row.
  An option's icon, description, and badge don't show, groups are
  `<optgroup>`s, and choosing several is the browser's list: Ctrl- or
  Cmd-click, or Shift with the arrow keys.
- With its script, the fallback is hidden, so it's neither seen nor in the
  accessibility tree, and the trigger is the one control the label names; the
  hidden `<select>` only carries the value.
- The default border is Input's light edge, which meets WCAG 1.4.11 only
  beside a visible label, such as the Field's, or another visible cue. For a
  select with neither, set `--harmo-input-color-border:
  var(--harmo-color-border-control)`, as [Input](input.md#accessibility)
  explains.

## What a script does

| Change | When |
| --- | --- |
| `hidden` on `.hselect-fallback`, and `required` off its `<select>` | As the script starts, a disabled select's too |
| The selection and value text, from what the `<select>` holds, if that's not what the list was given: a choice made before the script ran, or one the browser put back as the page loaded | As the script starts |
| `aria-expanded` on the trigger | On every open and close (see [Popup](popup.md)) |
| The [Listbox](listbox.md) behavior: highlight, `aria-activedescendant`, selection, and closing after a single-select choice | While open |
| The value text, or `data-placeholder` when nothing is chosen | When the selection changes |
| `selected` on the `<select>`'s options: each chosen `data-value`'s, or a single select's empty option when none is | When the selection changes |
| The selection and value text, from the `<select>`, which the browser has put back as the page loaded it; without a fallback, as the page loaded them | On the form's `reset`, once it has happened |
| `disabled` on the `<select>` | When the trigger is disabled or enabled |

`examples/html/src/scripts/select.js` and `listbox.js` are example scripts
that do all of this.

## React

`<Select>` renders this markup and does all of the above. On the server, a
Select with a `name` renders its fallback showing, so a form posts its value
before the page's JavaScript has loaded, or without it, as a React form action
does; once the component has mounted, it hides the fallback and the trigger
shows, taking any choice made in the fallback meanwhile. With `label`, it
renders the Field too; without one, name it with `aria-label`, or place it in
a [Setting](settings.md#react), which names it. A disabled Select
has no popup. Its children are `<Option>`s and `<OptionGroup>`s, as in a
[Listbox](listbox.md#react). Other props are the trigger `<button>`'s
attributes, and `ref` is the trigger. `className` goes on the trigger, its
outer element, and `hidden` on its Field, or on the trigger and the fallback
without a `label`. With a `name`, the fallback takes neither `className` nor
`style`, and is as wide as its container, as the trigger is by default: size a
Select in a form by its container, so the two match.
Your `onKeyDown` runs before its own keys: `preventDefault()` in it keeps a key
from opening the list or moving the highlight, as in a
[Listbox](listbox.md#react).

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react); the last three need a `label` |
| `multiple` | Lets several options be chosen; the popup stays open |
| `value` or `defaultValue` | The chosen value, or an array of them with `multiple` |
| `onValueChange` | Called with the new value or array. A form reset that changes the value calls it too, unless you hold the value, with `""` when a single select goes back to nothing chosen |
| `name` | Adds the fallback, the `<select>` a form sends; a form reset restores `defaultValue`, as it is at the time |
| `form` | The id of the form it belongs to, when it's outside it; the `<select>` takes it too |
| `aria-required` | On the trigger; and, with a `name`, `required` on the fallback's `<select>` until the component has mounted |
| `placeholder` | Shown, grayed, while nothing is chosen |
| `renderValue` | What the button shows for the chosen values, in place of their labels |
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

`--harmo-space-xs`, `--harmo-space-sm`, `--harmo-border-radius`,
`--harmo-color-background-secondary`, `--harmo-color-danger`,
`--harmo-color-focus`, `--harmo-color-primary-tint` (the fallback's chosen
rows, with `multiple`), `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-color-text-tertiary`, `--harmo-control-height`,
`--harmo-duration-fast`, `--harmo-font-family`,
`--harmo-font-size-sm`, `--harmo-font-weight-normal`,
`--harmo-input-box-shadow`, `--harmo-input-color-background`,
`--harmo-input-color-border`.
