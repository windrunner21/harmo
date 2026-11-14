# Field

Arranges and connects a label, optional marker, description, control, and error
message. The application owns validation and values.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `field.css`, plus the control's CSS, such as `input.css` or `checkbox.css` |
| Element | `<div class="hfield">`; with `data-orientation="horizontal"` for a checkbox, radio, or switch |
| Parts | `.hlabel`, `.hfield-label-row`, `.hfield-optional`, `.hdescription`, `.herror`, `.hfield-content` |
| Required | A name for the control: a `<label for>` matching its `id`, or, for a group or a button-based control, `aria-labelledby` pointing to the label's `id`; the control's `aria-describedby` lists the description, Optional marker, and error ids; `aria-live="polite"` on the `.herror` |
| Unique | Every id |
| Script | Only for validation: set `aria-invalid`, the error's text, and `hidden` to close it; see [What a script does](#what-a-script-does) |

## Markup

Stacked, for inputs, selects, and textareas:

```html
<div class="hfield">
  <div class="hfield-label-row">
    <label class="hlabel" for="email">Email address</label>
    <span class="hfield-optional" id="email-optional">Optional</span>
  </div>
  <p class="hdescription" id="email-description">We'll send your receipt here.</p>
  <input class="hinput" id="email" type="email"
    aria-describedby="email-optional email-description email-error"
    aria-invalid="true" />
  <p class="herror" id="email-error" aria-live="polite">Enter a valid email address.</p>
</div>
```

Render the `.herror` element even when there is no error, with no text or
whitespace inside it, so it's a live region before its first message. Setting
its text reveals it. To hide it, add `hidden`, which animates it closed, then
clear the text once that exit has finished, so screen readers don't read a
stale message; remove `hidden` before showing the next error. Clearing the
text alone also hides it, at once.

Without anything beside the label, the `.hlabel` can be a direct child; wrap it
in `.hfield-label-row` only to place something next to it, such as the Optional
marker or a [Password Input](password.md)'s strength.

Horizontal, for checkboxes, radios, and switches:

```html
<div class="hfield" data-orientation="horizontal">
  <input class="hcheckbox" type="checkbox" id="updates" />
  <label class="hlabel" for="updates">Email me updates</label>
</div>

<div class="hfield" data-orientation="horizontal">
  <input class="hcheckbox" type="checkbox" id="summary" aria-describedby="summary-description" />
  <div class="hfield-content">
    <label class="hlabel" for="summary">Send a weekly summary</label>
    <p class="hdescription" id="summary-description">You can change this at any time.</p>
  </div>
</div>
```

The same layout holds a [Radio](radio.md) or a [Switch](switch.md). For a
group, nest one horizontal Field per option in a Field with `role="radiogroup"`
(or `role="group"` for checkboxes) and a label; see [Radio](radio.md).

## Options

| Hook | Effect |
| --- | --- |
| (default) | Stacked: a column with 6px gaps |
| `data-orientation="horizontal"` | The control first, then the label, or `.hfield-content` with the label and description |

## Appearance and states

| Part | Appearance |
| --- | --- |
| `.hfield` | Column with 6px (`--harmo-space-2xs`) gaps; a description sits right under the label, and an error with no text takes no room. Horizontal, the control and its label are 6px apart |
| `.hfield-label-row` | Row for the label and whatever sits beside it, 6px (`--harmo-space-2xs`) apart; wraps |
| `.hlabel` | 14px on a 20px line, `--harmo-color-text` |
| `.hfield-optional` | 12px tag with a border and tinted background, as tall as the label's line, so a label row with it is 20px, as a label alone is; the app supplies the wording |
| `.hdescription` | 13px, `--harmo-color-text-tertiary` |
| `.herror` | 12px, `--harmo-color-danger` |
| `.hfield-content` | Column for a horizontal label and description, the description right under the label, as in a stacked Field |

- In a horizontal Field, a checkbox, radio, or switch is centered on the
  label's first line, whatever its size.
- On hover devices, an enabled checkbox's, radio's, or switch's label turns
  `--harmo-color-primary-hover` with a pointer cursor. A disabled one,
  including inside a disabled `<fieldset>`, turns `--harmo-color-text-tertiary`.
- An error opens over 200ms (`--harmo-duration-normal`,
  `--harmo-ease-out-cubic`): it grows to its text's height, fades in, and
  slides down slightly. With `hidden` it closes the way it came in 150ms
  (`--harmo-duration-fast`). An error already present when the page loads
  does not animate.
- Browsers without `interpolate-size`, such as Firefox, can't animate a
  height to or from its natural size, so there the error's line height
  animates instead, to and from 0, which grows and shrinks it the same way.
- Reduced motion: only the fade; a closing error fades in place, then its
  space closes.
- The error clips what it holds, for the collapse, but leaves 4px past its
  edges, so the focus ring of a link in it shows whole. In a browser without
  `overflow-clip-margin`, the ring is cut at the error's top and bottom.

## Accessibility

- Connect the label with `for`/`id`, and the description, Optional marker, and
  error with `aria-describedby`. Mark required fields with `required`.
- Set `aria-invalid="true"` only when the application has validated the value;
  required fields aren't marked invalid on load.
- The error is a polite live region, so its text is announced when it's set,
  even once focus has moved on, as when a field is validated on leaving it.
  It's cleared while hidden, so a closing error says nothing. A submit that
  shows several errors queues one announcement each; pair them with a summary
  of the errors, or move focus to the first invalid field.
- Descriptions use `--harmo-color-text-tertiary` (`#6e7480`), 4.69:1 on white,
  which clears WCAG AA's 4.5:1 for small text.

## What a script does

None for the layout. For validation:

| Change | When |
| --- | --- |
| Set `aria-invalid="true"` on the control and the `.herror` text, and remove `hidden` | After validating a value that fails |
| Remove `aria-invalid`, add `hidden` to the `.herror`, and clear its text once it has closed | When the value is valid again |

`examples/html/src/scripts/field.js` is an example script.
Validation itself stays in the application.

## React

`<Field>` renders these parts around its child, the control, and connects
them: the control gets the generated `id`, and `aria-describedby` and
`aria-invalid` for the parts there are; the error is a polite live region.
Harmo's form controls read these; an id or ARIA attribute you pass a control
yourself wins, and descriptions are combined. A Field holds one control: every Harmo control inside it takes its
id, so two would share one. Give several controls a Field each, inside a Field
with `role="group"`. A control's own `id` also becomes the label's `for` when
the control is the Field's direct child; for one nested deeper, pass the same
id as `htmlFor`. Other props are the wrapper `<div>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The `.hlabel`: a `<label>` for the control |
| `htmlFor` | The control's id, for a control that isn't the Field's direct child; otherwise its own `id`, or a generated one |
| `optional` | The Optional marker, in your wording, such as "Optional" |
| `description` | The `.hdescription` under the label |
| `error` | The `.herror`. Pass it to every field you validate, even while it's `undefined`, so the element is in place when the first error appears; a field without `error` has none. A message sets `aria-invalid` |
| `labelAccessory` | Placed in the label row after the Optional marker, such as a [Password Input](password.md)'s strength |
| `orientation` | `horizontal`, for a checkbox, radio, or switch: the control comes first, and only `label` and `description` apply |
| `control` | `button`, for a control that's a button rather than a form field, such as a `<Button>`: the label is a `<span>` that names it through `aria-labelledby`. `combobox`, for a [Combobox](combobox.md): the label stays a `<label for>` and gets an `id` too, which names the field and its list |
| `role` | `group` or `radiogroup` makes the Field the group, named by its label, for controls that each have their own; see [RadioGroup](radio.md#react) and [CheckboxGroup](checkbox.md#react). The group is then the control: its own `aria-label` or `aria-labelledby` wins over the label, its `aria-invalid` over the error's, and its `aria-describedby` is combined with the Field's |

```tsx
<Field
  label="Email address"
  optional="Optional"
  description="We'll send your receipt here."
  error={errors.email}
>
  <Input name="email" type="email" autoComplete="email" />
</Field>
```

A control of your own, or one from another library, joins a Field through
`useField`. Pass it the control's props; it reads the `id` and ARIA props,
typed `FieldControl`. Spread the props, then what `useField` returns, on the
element that takes focus: the Field's `id`, which its label's `for` names;
your own `aria-label` or `aria-labelledby`, which names the control outside a
Field and wins over a Field's label; `aria-describedby` for the Optional
marker, description, and error; and `aria-invalid` while there's an error.
Yours win, and descriptions are combined. A second argument,
`{ describedBy }`, adds an id of your own after the Field's, such as a
counter's.

```tsx
import type { ComponentPropsWithRef } from "react";
import { Field, useField } from "@harmo-ui/react";

function AmountInput({ currency, ...props }: ComponentPropsWithRef<"input"> & { currency: string }) {
  const field = useField(props);
  return (
    <span className="amount-input">
      <span aria-hidden="true">{currency}</span>
      <input {...props} {...field} inputMode="decimal" />
    </span>
  );
}

<Field label="Amount" description="Before tax." error={errors.amount}>
  <AmountInput currency="€" name="amount" />
</Field>

<AmountInput currency="€" name="price" aria-label="Price" />
```

For an element a `<label>` can't name, such as one with `role="textbox"`,
give the Field `control="button"`: its label is then a `<span>`, and
`useField` returns the `aria-labelledby` that points to it.

## Tokens

`--harmo-border-radius-sm`, `--harmo-checkbox-size`,
`--harmo-color-background-hover`, `--harmo-color-border`,
`--harmo-color-danger`, `--harmo-color-primary-hover`, `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-color-text-tertiary`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-focus-outline-offset`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-2xs`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-font-weight-normal`, `--harmo-space-2xs`,
`--harmo-switch-height`.
