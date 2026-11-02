# Radio

A native radio with Harmo's appearance, the sibling of [Checkbox](checkbox.md).
For a few short options side by side, use a [segmented control](segmented.md)
instead.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `radio.css`; `field.css` for the group and labels |
| Element | `<input class="hradio" type="radio">` |
| Parts | None |
| Required | A `<label for>` per radio; the same `name` on every radio in a group; `role="radiogroup"` and `aria-labelledby` on the group's Field |
| Unique | Every id, and each group's `name` |
| Script | None |

## Markup

A group is a [Field](field.md) with `role="radiogroup"`, labelled by its
`.hlabel`, holding one horizontal Field per option:

```html
<div class="hfield" role="radiogroup" aria-labelledby="format-label">
  <span class="hlabel" id="format-label">Export format</span>
  <div class="hfield" data-orientation="horizontal">
    <input class="hradio" type="radio" name="format" id="format-csv" value="csv" checked />
    <label class="hlabel" for="format-csv">CSV</label>
  </div>
  <div class="hfield" data-orientation="horizontal">
    <input class="hradio" type="radio" name="format" id="format-xlsx" value="xlsx" />
    <label class="hlabel" for="format-xlsx">Excel workbook</label>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `checked` | Chosen |
| `disabled` | Dimmed, not-allowed cursor; its Field label turns gray |
| `required` | On the radios, when an answer is required |

## Appearance and states

- A `--harmo-checkbox-size` (20px) circle with a `--harmo-color-border-control`
  border. On hover devices, an enabled unchecked radio's border turns
  `--harmo-color-primary-hover`, like Checkbox.
- Checked: `--harmo-color-primary-tint` fill, `--harmo-color-primary` border,
  and a 6px dot in the same color. The dot is a centered gradient, so it stays
  centered at any display scaling.
- Like Checkbox, the fill and border fade in 150ms and the dot appears at once.
  Nothing moves, so reduced motion keeps the fade.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).
- In forced-colors mode the browser draws its own radio.

## Accessibility

Radios that share a `name` form one group: Tab reaches the chosen one, and the
arrow keys move the choice. The `role="radiogroup"` Field names the group.

## What a script does

None.

## React

`<RadioGroup>` renders the group: a Field with `role="radiogroup"`, named by
its label, that gives its radios one `name`. `<Radio>` renders the
`<input type="radio">`; put each in a horizontal [Field](field.md#react) for
its label and description. Other props are the group `<div>`'s, or the
input's.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react) |
| `name` | The name its radios submit under; generated when left out |
| `value` or `defaultValue` | The chosen radio's value; a controlled `value` is `null` while none is chosen |
| `onValueChange` | Called with the newly chosen value |
| `required`, `disabled` | Set on every radio in it |

```tsx
<RadioGroup label="Export format" name="export-format" defaultValue="csv">
  <Field orientation="horizontal" label="CSV">
    <Radio value="csv" />
  </Field>
  <Field orientation="horizontal" label="Excel workbook">
    <Radio value="xlsx" />
  </Field>
  <Field orientation="horizontal" label="PDF report">
    <Radio value="pdf" />
  </Field>
</RadioGroup>
```

## Tokens

`--harmo-checkbox-size`, `--harmo-color-border-control`,
`--harmo-color-primary`, `--harmo-color-primary-hover`,
`--harmo-color-primary-tint`, `--harmo-duration-fast`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-opacity-disabled`.
