# Combobox

A text field that filters a list as you type: to pick one of its options, such
as an agent to assign, or, with free text, to be helped by it, such as an
email address to send to. Choosing several, each choice is a
[Tag](tag.md) in the field, as in an email's To field, in a
[Tag List](tag-list.md) that keeps the field one row high. It's the WAI-ARIA
editable combobox with list autocomplete. For a choice from a list without typing, use a
[Select](select.md); a Select with `searchLabel` searches inside its list
instead.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `combobox.css`, `input.css`, `popup.css`, `listbox.css`, `expand-chevron.css`; `field.css` for a label; `tag-list.css`, `tag.css`, and `tooltip.css` to choose several |
| Element | `<div class="hcombobox">` holding `<input class="hinput" type="text" role="combobox">` and an [Expand Chevron](expand-chevron.md); a `<div class="hpopup" popover="manual">` holding a [Listbox](listbox.md) |
| Parts | On the input: `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` naming the list, and `autocomplete="off"`; `anchor-name` on `.hcombobox`, and the same name as the popup's `position-anchor`; a hidden input after the popup for the value a form sends, in pick mode |
| Required | A name for the field: a `<label for>` with an `id`, which `aria-labelledby` on the field and the list both point to, or `aria-label` on each |
| Unique | Every id, and each anchor name |
| Script | Required: opening, filtering, the keyboard, and picking; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="assignee" id="assignee-label">Assign to</label>
  <div class="hcombobox" style="anchor-name: --assignee">
    <input class="hinput" id="assignee" type="text" role="combobox" autocomplete="off"
      aria-autocomplete="list" aria-expanded="false" aria-controls="assignee-listbox"
      aria-labelledby="assignee-label" placeholder="Search agents" value="" />
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
      <g class="hexpand-chevron-head">
        <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
        <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
      </g>
    </svg>
  </div>
  <div class="hpopup" id="assignee-popup" popover="manual" style="position-anchor: --assignee">
    <ul class="hlistbox" id="assignee-listbox" role="listbox" aria-labelledby="assignee-label">
      <li class="hoption" id="assignee-sam" role="option" data-value="sam" aria-selected="false">
        <span class="hoption-label">Sam Rivera</span>
      </li>
      …
    </ul>
    <p class="hlistbox-empty" role="status"></p>
  </div>
  <input type="hidden" name="assignee" value="" />
</div>
```

The list takes a [Listbox](listbox.md)'s options and groups, and its status
for no matches. Its popup has no button to open it, so it's
`popover="manual"`, and anchored to the field itself, so it's at least as
wide as the field.

### Choosing several

```html
<div class="hfield">
  <label class="hlabel" for="notify" id="notify-label">Notify</label>
  <div class="hcombobox" data-multiple style="anchor-name: --notify">
    <ul class="htag-list">
      <li>
        <span class="htag">
          Ana Lopez
          <button class="htag-remove" type="button" tabindex="-1" aria-label="Remove Ana Lopez">…</button>
        </span>
      </li>
      <li class="htag-list-more" hidden>
        <span class="htooltip-trigger">
          <button class="htag-list-count" type="button" tabindex="-1" aria-describedby="notify-more"></button>
          <span class="htooltip" data-variant="hint" role="tooltip" id="notify-more">
            <span class="htag-list-rest"></span>
          </span>
        </span>
      </li>
    </ul>
    <input class="hinput" id="notify" type="text" role="combobox" autocomplete="off"
      aria-autocomplete="list" aria-expanded="false" aria-controls="notify-listbox"
      aria-labelledby="notify-label" placeholder="Search agents" value="" />
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">…</svg>
  </div>
  <div class="hpopup" id="notify-popup" popover="manual" style="position-anchor: --notify">
    <ul class="hlistbox" id="notify-listbox" role="listbox" aria-labelledby="notify-label"
      aria-multiselectable="true">
      <li class="hoption" id="notify-ana" role="option" data-value="ana" aria-selected="true">
        <span class="hoption-checkbox" aria-hidden="true"></span>
        <span class="hoption-label">Ana Lopez</span>
      </li>
      …
    </ul>
    <p class="hlistbox-empty" role="status"></p>
  </div>
  <input type="hidden" name="notify" value="ana" />
</div>
```

Each choice is a [Tag](tag.md) with a remove button, in a
[Tag List](tag-list.md) before the text, and a hidden input after the popup; the list is a Listbox choosing several, with a
checkbox in each option. With free text too, a choice can be text that isn't
an option, such as an address: its tag shows the text, and its hidden input
sends it.

## Options

| Hook | Effect |
| --- | --- |
| Pick mode (default) | The value is an option: its `data-value` goes in the hidden input, and the field shows its label |
| `data-free-text` on the input | Free text: what's typed is the value, so the input itself has the `name`, and the list suggests; there's no hidden input |
| `.hlistbox-empty` after the list | The status for no matches, `role="status"`, in the page from the start and empty; the script puts the app's message in it, such as "No agents found", when nothing matches. Without one, the list closes when nothing matches |
| `data-multiple` on `.hcombobox` | Choosing several: the choices are `.htag`s in a `.htag-list` before the input, each with a `.htag-remove` button, `tabindex="-1"`, named in the app's language, such as "Remove Ana Lopez"; its "+N" button has `tabindex="-1"` too, so the field is one Tab stop. One hidden input for each choice, all with the `name`; `aria-multiselectable="true"` on the list. The input has no `name`, even with free text |
| `aria-disabled="true"` on an option | Shown, but can't be picked, not even by typing its label and leaving the field |
| `disabled` on the input | Disabled, as for an Input; leave out its `aria-controls` |
| `readonly` on the input | Read-only: the list stays closed, however it's asked for, so nothing can be picked |
| Choosing several, `aria-required="true"` on the input | Required: the choices satisfy it, not the text, so the input is `required` only while no choice is made, and `aria-required` says so throughout |
| `hidden` on an option or a group | Stays hidden, whatever is typed, and isn't counted as something to show; typing its label doesn't pick it |

## Appearance and states

- An [Input](input.md), with [Select](select.md)'s Expand Chevron 21px in from
  its end, drawn over the field and letting clicks through to it. The
  chevron folds while the list is open.
- The list opens below the field, or above where there's more room, at
  least as wide as the field, and wider for a long option, as a
  [Popup](popup.md) does.
- The highlighted option is shown as in any [Listbox](listbox.md); a picked
  option has its check mark in pick mode, and none with free text.
- Choosing several, the box is Input's, one row high however many choices
  there are, around the tags and the text, which has no box of its own; it
  takes the text's states, such as its focus ring and its error border. The
  tags sit 4px in from its border, so their 4px corners follow its 8px ones.
  The placeholder shows only with no choice made.
- At rest, the tags that fit show, then "+N", whose tooltip shows the rest on
  hover, as in a [Tag List](tag-list.md); the text gives its room to them.
- While focus is in the field, on the text or a remove button, every tag
  shows, in a row that scrolls sideways, without a scrollbar, and stays
  scrolled to its end as choices are added; the text keeps 4rem to itself.
  A remove button the arrow keys reach scrolls into view.

## Accessibility

- The field is a `combobox`: focus stays in it the whole time, and
  `aria-activedescendant` names the highlighted option, so a screen reader
  reads it as the arrow keys move.
- The field and its list share the label's name.
- Keys, as in the WAI-ARIA editable combobox:

  | Key | Does |
  | --- | --- |
  | Typing | Opens the list and filters it; in pick mode, the first match is highlighted |
  | ↓ / ↑ | Open the list at the chosen option or the first, or at the last; move through it |
  | Enter | Picks the highlighted option; with none, closes the list, and in pick mode doesn't send the form |
  | Escape | Closes the list; closed, empties the field, and stops there, so a dialog around it stays open. On an empty field with the list closed, it's left to what's around it, such as a dialog, which closes |
  | Tab | Leaves without picking |
  | Home / End | Move the caret, as in any field |

- Choosing several:

  | Key | Does |
  | --- | --- |
  | Enter | Picks the highlighted option, or takes it away when it's chosen, and the list stays open; with none, makes the text a choice, if it names an option, or with free text; it doesn't send the form while there's text or the list is open |
  | , | With free text, makes the text before it a choice, so pasted addresses each become one |
  | Escape | As above, but emptying the field takes only the text, never the choices |
  | Backspace | In an empty field, takes the last choice away; held down, it stops at the text |
  | ← | In an empty field, moves to the last choice's remove button (→ on a right-to-left page) |

  On a remove button, ← and → move between them and back to the field,
  Backspace and Delete take its choice away, as Enter and Space do, and
  Escape goes back to the field. Focus moves to the next choice, or the one
  before with Backspace, or the field. The remove buttons are out of the
  Tab order, so Tab moves past the field in one step, and a screen reader
  still reaches them.
- While an IME is composing, its keys are left to it.
- When nothing matches, the status after the list says so, such as "No
  agents found", and a screen reader reads it as it appears.

## What a script does

| Change | When |
| --- | --- |
| Show the popup, set `aria-expanded`, and hide the options whose label, description, and keywords don't hold the text, and the groups left with none; put the message in the status when there are none, and empty it otherwise | On typing; the list stays closed when nothing matches and there's no status, however it's opened: typing, a click, or Down |
| Highlight the first match (`data-active`, and `aria-activedescendant` on the field) | On typing, in pick mode |
| Show the option's label in the field; in pick mode, select it and put its `data-value` in the hidden input | On a pick, by Enter or a click |
| Text naming an option that isn't disabled picks it; an empty field clears the pick; other text goes back to the picked label | On leaving the field after typing, in pick mode |
| Keep the pointer from taking focus from the field | On a press in the list |
| Choosing several: add a tag and a hidden input, check the option (`aria-selected="true"`), and empty the text; on a pick of a chosen option, take them away. The list stays open. Required, set `required` on the input while there's no choice, and take it away while there is | On a pick, by Enter or a click |
| Choosing several: make the text a choice, if it names an option that isn't disabled, or with free text, and empty it | On Enter with nothing highlighted, on leaving the field, and, with free text, on a comma |
| Choosing several: take a choice's tag and hidden input away, uncheck its option, and move focus on as the keys above say | On its remove button, or Backspace in an empty field |
| Keep the pointer from taking focus from the field, and open the list on a click anywhere in the box | On a press in the box, choosing several |
| Show every tag, and scroll the list to its end; count again for "+N" | When focus comes into the field, and leaves it; `tag-list.js` does this for a list in a Combobox |
| Restore the value the page loaded with | On a form reset |

`examples/html/src/scripts/combobox.js` is an example script for it, with
`listbox.js` for the list and `popup.js` for where it opens.

## React

`<Combobox>` renders the field, the list, and, with a `name` in pick mode, the
hidden input. Its children are [Listbox](listbox.md#react) `<Option>`s and
`<OptionGroup>`s. Other props are the input's attributes.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react); the last three need a `label` |
| `value` or `defaultValue` | In pick mode, the picked option's value, or `null`: the field shows its label, except while it's typed in, so a value you change shows at once; with free text, the text; choosing several, the choices, in the order they were made |
| `onValueChange` | Called with the new value: an option's value or `null` in pick mode, the text with free text, the choices choosing several |
| `freeText` | Free text: what's typed is the value, and the options suggest; choosing several, typed text can be a choice of its own |
| `multiple` | Choosing several, as tags in the field |
| `required` | Choosing several, the choices satisfy it, not the text: the input is `required` only while no choice is made, with `aria-required` throughout |
| `readOnly` | The list stays closed, so nothing can be picked |
| `removeLabel` | Choosing several, required: names each tag's remove button from its label, in your app's language, such as ``(label) => `Remove ${label}` `` |
| `moreLabel` | Choosing several, required: names "+N" from the count, such as ``(count) => `${count} more` `` |
| `inputValue`, `onInputChange` | The field's text, held by you, such as to fetch options as it changes |
| `filter` | `false` leaves the filtering to you: every option you render shows |
| `name` | The name a form sends the value under |
| `emptyMessage` | The status shown, and read, when nothing matches, such as "No agents found"; without it, the list closes |

```tsx
<Combobox
  label="Assign to"
  name="assignee"
  placeholder="Search agents"
  emptyMessage="No agents found"
  value={agent}
  onValueChange={setAgent}
>
  <Option value="sam">Sam Rivera</Option>
  <Option value="ana">Ana Lopez</Option>
</Combobox>

<Combobox
  label="Send to"
  multiple
  freeText
  name="send-to"
  placeholder="Email addresses"
  removeLabel={(label) => `Remove ${label}`}
  moreLabel={(count) => `${count} more`}
  value={recipients}
  onValueChange={setRecipients}
>
  <Option value="sam@example.com">sam@example.com</Option>
</Combobox>
```

A choice keeps its option's label once seen, so its tag, or the field in pick
mode, still shows it when its option is no longer among the children, such
as after a new search with `filter={false}`.

## Tokens

`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`, and those of
Input, Popup, Listbox, and, choosing several, Tag List.
