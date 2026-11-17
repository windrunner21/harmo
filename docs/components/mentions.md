# Mentions

A [TextArea](textarea.md), or an [Input](input.md) for one line, that lists
suggestions as a trigger is typed, such as `@` for people, `#` for tags, or
`/` at the start for a chat's commands. The
list is a [Listbox](listbox.md) in a [Popup](popup.md), as a
[Combobox](combobox.md)'s is, and focus stays in the field. Choosing one puts
it in the text, with the trigger and a space.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `mentions.css`, `textarea.css` or `input.css`, `popup.css`, `listbox.css`; `field.css` for a label |
| Element | `<div class="hmentions" style="anchor-name: --name">` |
| Parts | The `<textarea class="htextarea">`, or for one line an `<input class="hinput" autocomplete="off">`; then `<div class="hpopup" popover="manual" style="position-anchor: --name">` with a `.hlistbox` of `.hoption`s |
| Required | On the field, `aria-autocomplete="list"` and `aria-controls` naming the list; a name for the list, such as `aria-label="People"`; a name for the field, from its label |
| Unique | Every id, and the anchor name |
| Script | Required: to find the trigger, filter and open the list, and put a choice in the text; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="note">Internal note</label>
  <div class="hmentions" style="anchor-name: --note">
    <textarea class="htextarea" id="note" aria-autocomplete="list" aria-controls="note-people"
      placeholder="Type @ to mention someone"></textarea>
    <div class="hpopup" popover="manual" data-side="bottom" style="position-anchor: --note">
      <ul class="hlistbox" id="note-people" role="listbox" aria-label="People">
        <li class="hoption" id="note-sam" role="option" aria-selected="false">
          <span class="hoption-text">
            <span class="hoption-label">Sam Rivera</span>
            <span class="hoption-description">@sam</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</div>
```

For one line, such as a task's title, an Input in the text area's place:

```html
<input class="hinput" id="task" autocomplete="off" aria-autocomplete="list" aria-controls="task-people"
  placeholder="Type @ to assign someone" />
```

## Options

| Hook | Effect |
| --- | --- |
| `data-side="top"` on the popup | Opens over the field first, as for a composer at the bottom of a chat; below where there's no room above |
| `data-side="bottom"` | Opens under the field first, as a Combobox's list does |

The trigger, and whether it counts only at the start, are your script's.

## Appearance and states

- The field is a TextArea, or an Input, as it looks anywhere.
- The list is a Popup's: 8px from the field, at least 240px wide, or the
  field's width if that's less, and at most 384px, as suggestions are short.
- Its options are a Listbox's: a label, with a description after it, the one
  highlighted tinted. Nothing is ever marked chosen, as a choice goes into
  the text.

## Accessibility

- Focus stays in the field. Its `aria-activedescendant` names the highlighted
  option, so a screen reader reads each as the arrow keys reach it, and
  `aria-controls` names the list.
- The arrow keys move through the list only while it's open; closed, they
  move the caret, as in any text area. In an Input, which has no lines for
  them to move between, ↓ or ↑ opens the list again with the trigger typed. Enter or Tab puts the highlighted
  option in, and Escape closes the list, leaving the text as it was.
- Clicking an option keeps focus in the field.
- Say what the trigger does in the field's placeholder or description, such
  as "Type @ to mention someone", as nothing else shows it.

## What a script does

| Change | When |
| --- | --- |
| Find the trigger before the caret, with only letters between them, and at the start of the field if the trigger counts only there | The field's text changes |
| Hide the options whose label or description doesn't have what's typed after the trigger, open the list with `showPopover()` if any show, and close it if none do; highlight the first | The same |
| Highlight with `data-active`, naming it in the field's `aria-activedescendant`; move it with the arrow keys | The list is open |
| Replace the trigger and what's typed after it with the trigger, the option's value, and a space; put the caret after it; close the list | An option is clicked, or Enter or Tab is pressed with one highlighted |
| Close the list, until the text changes | Escape, or leaving the field |
| Find the trigger again, and open or close the list | The caret moves without the text changing, by a key or a click |
| Insert where the caret is now, if it's still after the trigger | An option is chosen |
| Nothing | A key while an input method is composing text, marked by `isComposing`, or in Safari only by `keyCode` 229 |
| Open it again | ↓ or ↑ in an Input, with the trigger typed |
| Call `preventDefault()` on the popup's `mousedown` | So clicking an option keeps focus in the field |

`examples/html/src/scripts/mentions.js` is an example, with `listbox.js`
moving through the list.

## React

`<Mentions>` renders the field, a [TextArea](textarea.md), or with
`singleLine` an [Input](input.md), and its list; give it
[Options](listbox.md#react), each with the `value` that goes into the text. In
a [Field](field.md), the label names the field. Other props are the field's. Its text is yours with `value` and `onValueChange`, or its own
with `defaultValue`.

| Prop | Effect |
| --- | --- |
| `listLabel` | Required. The list's name, such as `"People"` |
| `trigger` | What opens the list: `"@"` by default |
| `atStart` | The trigger counts only at the start of the field, as for commands |
| `singleLine` | The field is an Input, for one line |
| `side` | `"top"` opens the list over the field first; `"bottom"` by default |
| `value`, `onValueChange` | The text, and a change to it, a choice included |
| `defaultValue` | The text it starts with, when it keeps its own |

```tsx
<Field label="Internal note">
  <Mentions listLabel="People" placeholder="Type @ to mention someone">
    <Option value="sam" description="@sam">Sam Rivera</Option>
    <Option value="ana" description="@ana">Ana Lopez</Option>
  </Mentions>
</Field>
```

## Tokens

None of its own: the TextArea's, the Popup's, and the Listbox's.
