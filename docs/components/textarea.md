# TextArea

Multi-line text that grows as you type. Labels, descriptions, and errors belong
to [Field](field.md). For a single line, use [Input](input.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `textarea.css`; `field.css` for its label and messages |
| Element | `<textarea class="htextarea">` |
| Parts | `.htextarea-counter`, optional, right after the textarea |
| Required | A name from a `<label for>`; `aria-describedby` pointing at the counter when there is one |
| Unique | The textarea's and the counter's ids |
| Script | Only for the counter's text; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="message">Message</label>
  <textarea class="htextarea" id="message" name="message" maxlength="500"
    aria-describedby="message-counter"></textarea>
  <p class="htextarea-counter" id="message-counter">0/500</p>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `aria-invalid="true"`, `readonly`, `disabled`, `placeholder` | As for [Input](input.md) |
| `.htextarea-counter` | A character count under the box |
| `--htextarea-max-height` | How tall dragging can make it; default `min(400px, 50dvh)` |

## Appearance and states

- The same box and states as [Input](input.md): border, 8px radius, 14px text
  on a 20px line, the focus border, and a ring on keyboard focus.
- 8px 12px padding. It starts one line tall (38px) and grows with its text up
  to 150px, or to `--htextarea-max-height` if that's smaller, then
  scrolls (`field-sizing: content`).
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
`aria-describedby`, so screen readers read it on focus.

## What a script does

| Change | When |
| --- | --- |
| The counter's text | As the text changes |

`examples/html/src/scripts/textarea.js` is an example script.

## React

`<TextArea>` renders the `<textarea>`, and with `maxLength` the counter,
connected through `aria-describedby` and kept current as you type and after
a form reset. In a [Field](field.md#react), it takes the field's id and
descriptions. Its props are the textarea's attributes, with `value` or
`defaultValue`.

```tsx
<Field label="Message">
  <TextArea name="message" maxLength={500} placeholder="Hello, your order has shipped…" />
</Field>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-duration-fast`, `--harmo-font-family`,
`--harmo-font-size-2xs`, `--harmo-font-size-sm`, `--harmo-font-weight-normal`,
`--harmo-input-box-shadow`, `--harmo-input-color-background`,
`--harmo-input-color-border`.
