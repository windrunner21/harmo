# Mentions

A [TextArea](textarea.md), or an [Input](input.md) for one line, that lists
suggestions as a trigger is typed, such as `@` for people, `#` for tags, or
`/` at the start for a chat's commands. The
list is a [Listbox](listbox.md) in a [Popup](popup.md), as a
[Combobox](combobox.md)'s is, and focus stays in the field. Choosing one puts
it in the text, with the trigger and a space. One field can have a list for
each trigger, such as a chat's message box with `@` for people, `#` for
channels, and `/` for commands; and each mention of someone or something in
a list is highlighted in the text as it's typed.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `mentions.css`, `textarea.css` or `input.css`, `popup.css`, `listbox.css`; `field.css` for a label |
| Element | `<div class="hmentions" style="anchor-name: --name">` |
| Parts | The `<textarea class="htextarea">`, or for one line an `<input class="hinput" autocomplete="off">`, inside its highlight, `.htextarea-highlight` or `.hinput-highlight`, as a [TextArea](textarea.md)'s or an [Input](input.md)'s, which marks the mentions; then, for each trigger, `<div class="hpopup" popover="manual" style="position-anchor: --name">` with a `.hlistbox` of `.hoption`s |
| Required | On the field, `aria-autocomplete="list"` and `aria-controls` naming the list in use, and `spellcheck="false"`, as a handle isn't a word; a name for each list, such as `aria-label="People"`; a name for the field, from its label |
| Unique | Every id, and the anchor name |
| Script | Required: to find the trigger, filter and open its list, put a choice in the text, and mark the mentions; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="note">Internal note</label>
  <div class="hmentions" style="anchor-name: --note">
    <div class="htextarea-highlight">
      <textarea class="htextarea" id="note" spellcheck="false" aria-autocomplete="list"
        aria-controls="note-people" placeholder="Type @ to mention someone"></textarea>
      <div class="htextarea-highlight-backdrop" aria-hidden="true"><span>
</span></div>
    </div>
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

For one line, such as a task's title, an Input in the text area's place, in
`.hinput-highlight` with its `.hinput-highlight-backdrop`:

```html
<input class="hinput" id="task" autocomplete="off" aria-autocomplete="list" aria-controls="task-people"
  placeholder="Type @ to assign someone" />
```

For several triggers, a popup for each, after the field, each list with its
own id and name; the field's `aria-controls` names the one in use. Without
the highlight, the field is the `.hmentions`' own child, and nothing is
marked.

The field's text is see-through inside the highlight: your script draws it
in the backdrop, with the mentions marked, as [What a script does](#what-a-script-does)
says. Without that script, the text doesn't show. The example scripts read
what they need from `data-example-*` hooks: each option's value from
`data-example-value`, each popup's trigger from `data-example-trigger` and
`data-example-at-start`, and the backdrop's pattern from
`data-example-pattern` and `data-example-flags`.

## Options

| Hook | Effect |
| --- | --- |
| `data-side="top"` on the popup | Opens over the field first, as for a composer at the bottom of a chat; below where there's no room above |
| `data-side="bottom"` | Opens under the field first, as a Combobox's list does |

Each list's trigger, and whether it counts only at the start, are your
script's.

## Appearance and states

- The field is a TextArea, or an Input, as it looks anywhere.
- Each mention, a trigger and a value from its list, is marked as a
  TextArea's highlight is: in `--harmo-color-primary`, on a 14% tint of it.
  A mention starts the text or follows a space, and ends at a space, the
  end, or any punctuation or symbol but `_` and `-`, which a handle can hold,
  so `@sam` is marked in `@sam…` but not in `@samuel`, `@sam_lee`, or an
  email address. Any case counts, `@Sam` too, in any script. A command, with
  its trigger at the start only, is marked only there.
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
- The marks are drawn for the eye only, `aria-hidden`: a screen reader reads
  the field's text, with the mentions as typed.
- Spellcheck is off, `spellcheck="false"`, so a handle such as `@sam` isn't
  underlined as a misspelling. A browser checks a whole field or none of it,
  so it's off for the whole text; pass `spellCheck` in React, or leave the
  attribute out in HTML, to have it back.

## What a script does

| Change | When |
| --- | --- |
| Find the trigger before the caret, with only letters between them, and at the start of the field if the trigger counts only there; with several, the one nearest the caret | The field's text changes |
| Hide the options whose label or description doesn't have what's typed after that trigger, open its list with `showPopover()` if any show, naming it in the field's `aria-controls`, and close it if none do; highlight the first | The same |
| Mark each mention in the highlight's backdrop, and keep it lined up with the field, as a TextArea's highlight does | The text changes, the field scrolls, or it changes size |
| Highlight with `data-active`, naming it in the field's `aria-activedescendant`; move it with the arrow keys | The list is open |
| Replace the trigger and what's typed after it with the trigger, the option's value, and a space; put the caret after it; close the list | An option is clicked, or Enter or Tab is pressed with one highlighted |
| Close the list, until the text changes | Escape, or leaving the field |
| Find the trigger again, and open or close the list | The caret moves without the text changing, by a key or a click |
| Insert where the caret is now, if it's still after the trigger | An option is chosen |
| Nothing | A key while an input method is composing text, marked by `isComposing`, or in Safari only by `keyCode` 229 |
| Open it again | ↓ or ↑ in an Input, with the trigger typed |
| Call `preventDefault()` on the popup's `mousedown` | So clicking an option keeps focus in the field |

`examples/html/src/scripts/mentions.js` is an example, with `listbox.js`
moving through each list and `highlight.js` marking the mentions, from the
pattern on the backdrop.

## React

`<Mentions>` renders the field, a [TextArea](textarea.md), or with
`singleLine` an [Input](input.md), and its list; give it
[Options](listbox.md#react), each with the `value` that goes into the text. In
a [Field](field.md), the label names the field. Other props are the field's. Its text is yours with `value` and `onValueChange`, or its own
with `defaultValue`.

| Prop | Effect |
| --- | --- |
| `listLabel` | Required with one trigger: the list's name, such as `"People"`, without which a screen reader hears a list with no name. TypeScript can't tell Options from `MentionsTrigger`s among the children, so it can't require it |
| `trigger` | What opens the list: `"@"` by default |
| `atStart` | The trigger counts only at the start of the field, as for commands |
| `highlight` | Marks the mentions by default; `false` leaves them unmarked, and a RegExp of your own marks what it matches instead |
| `spellCheck` | `false` by default, so handles aren't underlined; `true` checks the whole text |
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

For several triggers, give it a `<MentionsTrigger>` for each, in place of
the Options, with its `trigger`, `listLabel`, and `atStart`, and its Options
as children. Use each trigger once; where one starts another, such as `@`
and `@@`, the longer one wins:

```tsx
<Field label="Message">
  <Mentions placeholder="Type @ for people, # for channels, or / for a command">
    <MentionsTrigger trigger="@" listLabel="People">
      {members.map((member) => <Option key={member.id} value={member.handle}>{member.name}</Option>)}
    </MentionsTrigger>
    <MentionsTrigger trigger="#" listLabel="Channels">
      {channels.map((channel) => <Option key={channel.id} value={channel.slug}>#{channel.slug}</Option>)}
    </MentionsTrigger>
    <MentionsTrigger trigger="/" listLabel="Commands" atStart>
      <Option value="remind">/remind</Option>
    </MentionsTrigger>
  </Mentions>
</Field>
```

`mentionsIn(text, lists)` finds the mentions in a text, as the highlight
does, such as when your app sends it, in a server action too: given each
trigger's values, or `{ values, atStart }` for one that counts only at the
start, it returns each mention's `trigger`, its `value` as the list spells
it, and where it is, `start` and `end`:

```ts
mentionsIn("Thanks @Sam! See #releases.", { "@": ["sam", "ana"], "#": ["releases"] });
// [{ trigger: "@", value: "sam", start: 7, end: 11 }, { trigger: "#", value: "releases", start: 17, end: 26 }]

mentionsIn("/remind me, not /poll", { "/": { values: ["remind", "poll"], atStart: true } });
// [{ trigger: "/", value: "remind", start: 0, end: 7 }]
```

## Tokens

None of its own: the TextArea's, the Popup's, and the Listbox's.
