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

## Appearance and states

- A `--harmo-checkbox-size` (20px) square with a 4px radius and a
  `--harmo-color-border-control` border.
- On hover, an unchecked box's border turns `--harmo-color-primary-hover`.
- Checked and mixed: `--harmo-color-primary-tint` fill and
  `--harmo-color-primary` border, with a check mark or dash in the same color.
- The fill and border fade in 150ms; the marks appear at once. Nothing moves,
  so reduced motion keeps the fade.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).
- In forced-colors mode the browser draws its own checkbox.

## Accessibility

A native checkbox: Space toggles it, and its `<label>` names it. A group of
checkboxes goes in a Field with `role="group"` labelled by its `.hlabel`.

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
