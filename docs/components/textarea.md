# TextArea

Multi-line text that grows as you type. Labels, descriptions, and errors belong
to [Field](field.md). For a single line, use [Input](input.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `textarea.css`; `field.css` for its label and messages |
| Element | `<textarea class="htextarea">` |
| Parts | `.htextarea-counter`, optional, right after the textarea. To mark parts of the text, `.htextarea-highlight` around it, and `.htextarea-highlight-backdrop` after it, `aria-hidden`, holding a `<span>` with the text and a final line break |
| Required | A name from a `<label for>`; `aria-describedby` pointing at the counter when there is one |
| Unique | The textarea's and the counter's ids |
| Script | Only for the counter's text and marking parts of the text; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="message">Message</label>
  <textarea class="htextarea" id="message" name="message" maxlength="500"
    aria-describedby="message-counter"></textarea>
  <p class="htextarea-counter" id="message-counter">0/500</p>
</div>
```

The counter's text is the app's, in its words and digits: `0/500`, as the
React TextArea writes it by default, or "500 characters left".

## Options

| Hook | Effect |
| --- | --- |
| `aria-invalid="true"`, `readonly`, `disabled`, `placeholder` | As for [Input](input.md) |
| `.htextarea-counter` | A character count under the box, in the app's words |
| `--htextarea-max-height` | How tall dragging can make it; default `min(400px, 50dvh)` |
| `.htextarea-highlight` | Marks parts of the text, drawn over the field, as for an [Input](input.md) |

## Appearance and states

- The same box and states as [Input](input.md): border, 8px radius, 14px text
  on a 20px line, the focus border, and a ring on keyboard focus.
- 6px padding above and below, and Input's 10px (`--harmo-space-xs`) at the
  sides, so its text lines up with an Input's. It starts one line tall, as
  tall as an Input (`--harmo-control-height`, 34px), and grows with its text up to 150px, or to `--htextarea-max-height`
  if that's smaller, then scrolls (`field-sizing: content`).
- The bottom end corner is squared off (2px), so the native resize handle sits
  inside the border instead of spilling past a rounded corner.
- Dragging the handle can make it taller, up to `--htextarea-max-height`:
  400px or half the visible height, whichever is less. A `height` in the
  `style` attribute, which browsers set while dragging, lifts the 150px growth
  cap; `line-height` or a custom property there doesn't.
- `.htextarea-counter`: 12px `--harmo-color-text-tertiary`, right-aligned under
  the box, with digits that don't shift as they change.

## Accessibility

Name it with a `<label for>` in a [Field](field.md). Connect the counter with
`aria-describedby`, so screen readers read it on focus. Marks are only seen: if
they mean something, say so in its label or description.

The default border is Input's light edge, which meets WCAG 1.4.11 only beside
a visible label or another visible cue. For a textarea with neither, set
`--harmo-input-color-border: var(--harmo-color-border-control)`, as
[Input](input.md#accessibility) explains.

## What a script does

| Change | When |
| --- | --- |
| The counter's text, in the app's words, such as `12/500` | As the text changes, and when its form resets, unless a listener cancels the reset |
| The text and `<mark>`s in the backdrop | As the text changes, if it marks parts of it |
| The backdrop's size, type, padding, direction, and wrapping, copied from the field, with room for its scrollbar | As the text changes or the field resizes |
| The backdrop's `scrollTop` and `scrollLeft` | As the field scrolls |

`examples/html/src/scripts/textarea.js` and `highlight.js` are example scripts.

## React

`<TextArea>` renders the `<textarea>`, and with `maxLength` the counter,
connected through `aria-describedby` and kept current as you type and after
a form reset. In a [Field](field.md#react), it takes the field's id and
descriptions. Its props are the textarea's attributes, with `value` or
`defaultValue`, and:

| Prop | Effect |
| --- | --- |
| `highlight` | A regular expression: what it matches in the text is marked as you type |
| `formatCount` | Writes the counter's text from the text's length and `maxLength`, in your words and digits, such as `` (length, maxLength) => `${maxLength - length} characters left` ``; without it, the counter reads `12/500` |

With `highlight`, the `<textarea>` is inside `.htextarea-highlight`, and adding
or removing the prop while it's showing replaces the `<textarea>`, as for an
[Input](input.md#react).

```tsx
<Field label="Message">
  <TextArea name="message" maxLength={500} placeholder="Hello, your order has shipped…" />
</Field>
```

## Tokens

`--harmo-color-primary`, `--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-control-height`, `--harmo-duration-fast`, `--harmo-font-family`,
`--harmo-font-size-2xs`, `--harmo-font-size-sm`, `--harmo-font-weight-normal`,
`--harmo-input-box-shadow`, `--harmo-input-color-background`,
`--harmo-input-color-border`, `--harmo-space-xs`.
