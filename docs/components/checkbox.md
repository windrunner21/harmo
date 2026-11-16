# Checkbox

A native checkbox with Harmo's appearance. Pair it with a label in a horizontal
[Field](field.md). For a setting that applies at once, use a
[Switch](switch.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `checkbox.css`; `field.css` for its label |
| Element | `<input class="hcheckbox" type="checkbox">` |
| Parts | None |
| Required | An `id` that its `<label for>` points to, or `aria-labelledby` |
| Unique | The `id` |
| Script | Only for the mixed state; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield" data-orientation="horizontal">
  <input class="hcheckbox" type="checkbox" id="updates" name="updates" />
  <label class="hlabel" for="updates">Email me updates</label>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `checked` | Checked |
| `indeterminate` (DOM property) | Mixed, shown as a dash; wins over checked |
| `disabled` | Dimmed, not-allowed cursor; its Field label turns gray |
| `--harmo-checkbox-size` on the element | Size (default 20px); the marks scale with it |
| `data-size="small"` on its horizontal [Field](field.md) | A 16px box and a 13px label, for fine print, such as agreeing to terms |
| `data-variant="card"` on its horizontal [Field](field.md#choice-cards) | A choice card: the checkbox and its label as a bordered tile, checked by a click anywhere on it, with the checkbox's colors once checked |

## Appearance and states

- A `--harmo-checkbox-size` (20px) square with a 4px radius and a
  `--harmo-color-border-control` border.
- On hover, an unchecked box's border turns `--harmo-color-primary-hover`.
- Checked and mixed: `--harmo-color-primary-tint` fill and
  `--harmo-color-primary` border, with a check mark or dash in the same color.
- Toggled with the pointer, the fill and border fade in 150ms; the marks
  appear at once. Toggled from the keyboard, with its focus ring showing, it
  changes at once, as what's done from the keyboard does. Nothing moves, so
  reduced motion keeps the fade.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).
- In a horizontal Field the checkbox is centered on the label's first line,
  at any size.
- In forced-colors mode the browser draws its own checkbox.

## Accessibility

- A native checkbox: Space toggles it, and its `<label>` names it. A group of
  checkboxes goes in a Field with `role="group"` labelled by its `.hlabel`.
- In a choice card, the label still names the checkbox, and the description is
  tied to it by `aria-describedby`, so a screen reader reads both as the
  checkbox takes focus. The label only stretches over the card for the
  pointer; the checkbox, its focus ring, and Space work as they do outside one.

## What a script does

| Change | When |
| --- | --- |
| Set the `indeterminate` property | For a mixed state, such as "select all" over a partial selection; it has no HTML attribute |

`examples/html/src/scripts/checkbox.js` is an example script.

## React

`<Checkbox>` renders the `<input type="checkbox">`. Put it in a horizontal
[Field](field.md) for its label and description. Other props are the input's
attributes.

| Prop | Effect |
| --- | --- |
| `indeterminate` | Shows the mixed state |

`<CheckboxGroup>` renders a Field that is the group, named by its label, and
gives its checkboxes one `name`. Each checkbox in it takes a `value`.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react) |
| `name` | The name its checkboxes submit under; generated when left out |
| `value` or `defaultValue` | The checked checkboxes' values, as an array |
| `onValueChange` | Called with the checked values, in the checkboxes' order, when one changes |
| `disabled` | Disables every checkbox in it |

```tsx
<CheckboxGroup label="Notify me about" name="notify" defaultValue={["messages", "mentions"]}>
  <Field orientation="horizontal" label="New messages">
    <Checkbox value="messages" />
  </Field>
  <Field orientation="horizontal" label="Mentions">
    <Checkbox value="mentions" />
  </Field>
  <Field orientation="horizontal" label="Failed campaigns">
    <Checkbox value="failures" />
  </Field>
</CheckboxGroup>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-checkbox-size`,
`--harmo-color-border-control`, `--harmo-color-primary`,
`--harmo-color-primary-hover`, `--harmo-color-primary-tint`,
`--harmo-duration-fast`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-opacity-disabled`.
