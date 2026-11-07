# Switch

An on/off switch for a setting that applies at once. On settings screens, put
it in a [Settings List](settings.md); in a form, pair it with a
label in a horizontal [Field](field.md). For a choice that applies on submit,
use a [Checkbox](checkbox.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `switch.css`; `field.css` for its label |
| Element | `<input class="hswitch" type="checkbox" role="switch">` |
| Parts | None; the input is the track and its `::before` the thumb |
| Required | `role="switch"`; a name from a `<label for>` or `aria-labelledby` |
| Unique | The input's `id` |
| Script | None |

## Markup

```html
<div class="hfield" data-orientation="horizontal">
  <input class="hswitch" type="checkbox" role="switch" id="away" />
  <label class="hlabel" for="away">Set me as away</label>
</div>
```

With a description, put the label and description in `.hfield-content`, as
[Field](field.md) shows.

## Options

| Hook | Effect |
| --- | --- |
| `checked` | On |
| `disabled` | Dimmed; the Field label turns gray |
| `--hswitch-width`, `--hswitch-thumb`, `--hswitch-inset` on the input | Track width (44px), thumb size (20px), and the thumb's inset (2px) |
| `--harmo-switch-height` | Track height (24px); a horizontal Field centers the switch by it |

## Appearance and states

- 44×24 track with a 20px white thumb and a soft shadow
  (`--harmo-switch-thumb-color-background`, `--harmo-switch-thumb-box-shadow`).
- Off: `--harmo-switch-color-background`, the control border gray, so the
  track stands out from white at 3.42:1. On: `--harmo-color-primary-fill`, with
  the thumb 20px toward the end of the line (to the left in right-to-left text).
- The thumb slides in 200ms (`--harmo-ease-in-out-cubic`) while the color fades
  in 200ms. Under reduced motion the thumb jumps; the color change stays.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).
- In a horizontal Field the switch is centered on the label's first line.
- In forced-colors mode the browser draws its own control.

## Accessibility

A native checkbox with `role="switch"`: screen readers announce "switch, on" or
"off", and Space toggles it. Its `<label>` names it, or in a Settings List the
setting's title through `aria-labelledby`.

## What a script does

None.

## React

`<Switch>` renders the `<input type="checkbox" role="switch">`. Put it in a
horizontal [Field](field.md#react) for its label and description, or in a
[Setting](settings.md#react). Its props are the input's
attributes, such as `checked`, `defaultChecked`, and `onChange`.

```tsx
<Field orientation="horizontal" label="Play a sound for new messages">
  <Switch defaultChecked />
</Field>
```

## Tokens

`--harmo-border-radius-full`, `--harmo-color-primary-fill`,
`--harmo-duration-normal`, `--harmo-ease-in-out-cubic`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-opacity-disabled`, `--harmo-switch-color-background`,
`--harmo-switch-height`, `--harmo-switch-thumb-box-shadow`,
`--harmo-switch-thumb-color-background`.
