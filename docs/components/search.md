# Search

A field for searching, such as above a list of conversations: an
[Input](input.md) filled in gray, with a magnifier at its start and, once
there's text, an optional clear button at its end. For a search inside a
list of options, a [Listbox](listbox.md) has its own.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `search.css` and `input.css`; `field.css` for a label |
| Element | `<div class="hsearch">` holding the magnifier (`.hicon`), `<input class="hinput" type="search">`, and an optional clear button |
| Parts | `.hsearch-clear`, a `<button type="button">` after the input |
| Required | A name for the input: `aria-label`, or a `<label for>` in a [Field](field.md); `aria-label` on the clear button, in the app's language; `aria-hidden="true"` on the magnifier |
| Unique | The input's `id`, when a label names it |
| Script | For the clear button and Escape; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hsearch">
  <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  <input class="hinput" type="search" placeholder="Search conversations" aria-label="Search conversations" />
  <button class="hsearch-clear" type="button" tabindex="-1" aria-label="Clear" hidden>
    <svg class="hicon" viewBox="0 0 25 25" aria-hidden="true" focusable="false">…</svg>
  </button>
</div>
```

Draw the icons with `fill="currentColor"` or `stroke="currentColor"`; the
field colors them.

## Options

| Hook | Effect |
| --- | --- |
| `.hsearch-clear` | The clear button; leave it out where the field doesn't need one |
| `hidden` on `.hsearch-clear` | Hides it, while the field is empty |
| `disabled` on the input and the clear button | Disabled, as for an Input; disable both together |
| `readonly` on the input | Read-only, as for an Input: no clear button, and Escape leaves it as it is |
| `aria-invalid="true"` on the input | Invalid, as for an Input |

## Appearance and states

- An [Input](input.md), 34px tall, filled with
  `--harmo-color-background-secondary`, with no border or shadow until it's
  hovered or focused, when it shows Input's border and focus ring. It sets
  Input's own tokens inside `.hsearch` for this, so its other states stay
  Input's.
- The magnifier, 18px in `--harmo-icon-color`, sits 12px in from its start,
  and the text starts after it. The placeholder is
  `--harmo-color-text-secondary`, since tertiary text is 4.4:1 on the fill.
- The clear button, 24px with a 16px cross in `--harmo-icon-color`, sits 8px
  in from its end, darkening to `--harmo-icon-hover-color` on hover. While it
  shows, the text stops before it.
- The browsers' own clear buttons and decorations for `type="search"` are
  hidden, so every browser shows the same field.
- On a right-to-left page, the magnifier is at the right and the clear button
  at the left.

## Accessibility

- `type="search"` makes it a search box for screen readers. Name it with
  `aria-label`, or with a visible label in a Field; a placeholder isn't a
  name.
- Escape empties a field that has text, so the clear button needs no place
  in the Tab order (`tabindex="-1"`): a screen reader still reaches it, and a
  pointer uses it. On an empty field, Escape is left to what's around it,
  such as a dialog, which closes; and while an IME is composing, to the IME,
  which cancels what it's composing.
- Emptying it keeps focus in the field, so typing can go on.

## What a script does

| Change | When |
| --- | --- |
| Remove `hidden` from the clear button; add it back | When the field gets text; when it's empty again, or read-only |
| Empty the field, keep focus in it, and send an `input` event, as typing does | On a click of the clear button, unless the field is read-only |
| The same, and stop the key (`preventDefault()`), so a dialog or popup around it stays open | On Escape, while the field has text, unless it's read-only or an IME is composing |

A script follows the field through its `input` events. Code that sets the
value sends one too, as the clear button does, or the button can't follow it:
setting `value` sends no event.

`examples/html/src/scripts/search.js` is an example script for all of it.

## React

`<Search>` renders the field. Its props are the input's attributes, such as
`value`, `defaultValue`, `onChange`, `placeholder`, and `aria-label`; inside a
[Field](field.md#react), the Field names it.

| Prop | Effect |
| --- | --- |
| `clearLabel` | The clear button's `aria-label`, such as "Clear", in your app's language; without it, there's no clear button |

Clearing, by the button or Escape, calls `onChange` with an empty value, as
typing does, so a list filtered by the value follows it, as in the "Filtering
a list" example. A `readOnly` field has no clear button.

```tsx
const [query, setQuery] = useState("");

<Search
  aria-label="Search conversations"
  placeholder="Search conversations"
  clearLabel="Clear"
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background-secondary`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-duration-fast`, `--harmo-focus-outline`, `--harmo-icon-color`,
`--harmo-icon-hover-color`, and Input's.
