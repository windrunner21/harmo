# Input

Text-like native inputs: `text`, `email`, `search`, `tel`, `url`, and similar.
Labels and messages belong to [Field](field.md). For several lines, use
[TextArea](textarea.md); for passwords, [Password input](password.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `input.css`; `field.css` for a label and messages |
| Element | `<input class="hinput" type="…">` with a text-like type |
| Parts | None |
| Required | A name: a `<label for>` matching its `id`, or `aria-label` |
| Unique | Its `id` |
| Script | None |

## Markup

```html
<input class="hinput" id="company" name="company" type="text" placeholder="Acme Inc." aria-label="Company" />
```

## Options

| Hook | Effect |
| --- | --- |
| `placeholder` | Shown in `--harmo-color-text-tertiary` |
| `aria-invalid="true"` | `--harmo-color-danger` border, and a red ring when focused |
| `readonly` | Secondary background; still focusable and copyable |
| `disabled` | Secondary background, no shadow, and `--harmo-color-text-tertiary` text |

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

## What a script does

None.

## React

`<Input>` renders the `<input>`. In a [Field](field.md#react), it takes the
field's id and descriptions. Its props are the input's attributes.

```tsx
<Field label="Billing email" error="Enter a valid email address.">
  <Input name="billing-email" type="email" autoComplete="email" />
</Field>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-control-height`,
`--harmo-duration-fast`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-weight-normal`, `--harmo-input-box-shadow`,
`--harmo-input-color-background`, `--harmo-input-color-border`.
