# Input

Text-like native inputs: `text`, `email`, `search`, `tel`, `url`, and similar.
Labels and messages belong to [Field](field.md). For several lines, use
[TextArea](textarea.md); for passwords, [Password Input](password.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `input.css`; `field.css` for a label and messages |
| Element | `<input class="hinput" type="…">` with a text-like type |
| Parts | None. To mark parts of the text, on a `text`, `email`, `tel`, or `url` field: `.hinput-highlight` around it, and `.hinput-highlight-backdrop` after it, `aria-hidden`, holding a `<span>` with the text |
| Required | A name: a `<label for>` matching its `id`, or `aria-label` |
| Unique | Its `id` |
| Script | Only to mark parts of the text; see [What a script does](#what-a-script-does) |

## Markup

```html
<input class="hinput" id="company" name="company" type="text" placeholder="Acme Inc." aria-label="Company" />
```

To mark parts of the text, such as the variables in a template:

```html
<div class="hinput-highlight">
  <input class="hinput" id="subject" name="subject" value="Hello {{1}}" aria-label="Subject" />
  <div class="hinput-highlight-backdrop" aria-hidden="true"><span>Hello <mark>{{1}}</mark></span></div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `placeholder` | Shown in `--harmo-color-text-tertiary` |
| `aria-invalid="true"` | `--harmo-color-danger` border, and a red ring when focused |
| `readonly` | Secondary background; still focusable and copyable |
| `disabled` | Secondary background, no shadow, and `--harmo-color-text-tertiary` text |
| `.hinput-highlight` | Marks parts of the text, drawn over the field |

## Appearance and states

- `--harmo-control-height` (34px) tall, 12px inline padding, 14px text on a
  fixed 20px line, so the height doesn't depend on the font.
- Fills its container (`inline-size: 100%`) and can shrink to any width. Next to
  a button in a flex row, the input takes the room the button leaves.
- Border: 1px `--harmo-input-color-border` (`#e3e8ee`) with
  `--harmo-input-box-shadow`, a faint layered shadow.
- Hover (hover devices): the border turns `--harmo-color-focus` over 150ms
  (`--harmo-duration-fast`), except on disabled, read-only, and invalid
  controls.
- Focus: the border turns `--harmo-color-focus`. With `:focus-visible`, which
  browsers match whenever a text field is focused, a 3px ring of the same color
  at 20% appears, starting at the border.
- Selects and textareas share this box and these states, so they always match;
  segmented options share the border.
- Marked text is `--harmo-color-primary` on a see-through 14% of it, with 2px
  corners. The field's own text is see-through, with the text drawn over it
  taking its place; the caret, selection, and placeholder are still the field's,
  and presses reach it. A selection is a see-through
  `--harmo-color-focus`, so the text over it stays readable.
- In forced-colors mode, the field shows its own text and only the marks are
  drawn, in the system's `Highlight`.

## Accessibility

- Name it with a `<label for>` in a [Field](field.md), and connect a
  description and error with `aria-describedby`.
- Set `aria-invalid="true"` only after the application has validated the
  value, and give fields an `autocomplete` value where one fits.
- The default border is 1.23:1 on white, a deliberately light look below
  WCAG 1.4.11's 3:1 for a field's edge; the faint shadow doesn't make up the
  difference. For 3.42:1, set `--harmo-input-color-border:
  var(--harmo-color-border-control)` on `:root`. Selects and textareas follow,
  since they share the token.
- Marks are only seen: a screen reader reads the field's value. If they mean
  something, such as a variable that must be filled in, say so in its label or
  description.

## What a script does

None, unless it marks parts of the text:

| Change | When |
| --- | --- |
| The text and `<mark>`s in the backdrop | As the value changes |
| The backdrop's size, type, padding, and direction, copied from the field | As the value changes or the field resizes |
| The `scrollLeft` of the backdrop's `<span>` | As the field scrolls |

`examples/html/src/scripts/highlight.js` is an example script.

## React

`<Input>` renders the `<input>`. In a [Field](field.md#react), it takes the
field's id and descriptions. Its props are the input's attributes, and:

| Prop | Effect |
| --- | --- |
| `highlight` | A regular expression: what it matches in the text is marked as you type, with or without its `g` flag. Only on a `text`, `email`, `tel`, or `url` field; on any other type it's ignored, so a password stays hidden |

With `highlight`, the `<input>` is inside `.hinput-highlight`, which fills its
container as an input does. Other props stay on the `<input>`, so layout such as
`flex` or `gridColumn` needs an element of your own around it.

Adding or removing `highlight` on a field already showing replaces the
`<input>`, so it loses focus and any text not held in `value`. To turn marks off
and on in place, keep the prop and pass a pattern that matches nothing, such as
`/$^/`.

```tsx
<Field label="Billing email" error="Enter a valid email address.">
  <Input name="billing-email" type="email" autoComplete="email" />
</Field>
<Field label="Subject">
  <Input name="subject" highlight={/\{\{\d+\}\}/g} />
</Field>
```

## Tokens

`--harmo-color-primary`, `--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-control-height`,
`--harmo-duration-fast`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-weight-normal`, `--harmo-input-box-shadow`,
`--harmo-input-color-background`, `--harmo-input-color-border`.
