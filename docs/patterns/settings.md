# Settings list

A list of settings on a settings screen: each row has a title and a
description, with its control on the right or under the text. Inside a form,
use [Field](../components/field.md) instead.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `settings.css`, plus the controls' own, such as `switch.css` |
| Element | `<div class="hsettings">` holding one `<div class="hsetting">` per setting |
| Parts | `.hsetting-text` holding `.hsetting-title` and `.hsetting-description`; the control |
| Required | On the control: `aria-labelledby` (the title's id) and `aria-describedby` (the description's id) |
| Unique | Each row's title and description ids |
| Script | None |

## Markup

```html
<div class="hsettings">
  <div class="hsetting">
    <div class="hsetting-text">
      <h3 class="hsetting-title" id="recap-title">Recap emails</h3>
      <p class="hsetting-description" id="recap-description">
        Send account recap emails to the recipients below.
      </p>
    </div>
    <input class="hswitch" type="checkbox" role="switch"
      aria-labelledby="recap-title" aria-describedby="recap-description" />
  </div>
</div>
```

A compact control, such as a Switch, Checkbox, or Button, sits on the right as
the row's last child. A control that fills its container, such as an Input,
Select, TextArea, or segmented control, goes inside `.hsetting-text` after the
description and spans the text:

```html
<div class="hsetting">
  <div class="hsetting-text">
    <h3 class="hsetting-title" id="reply-to-title">Reply-to address</h3>
    <p class="hsetting-description" id="reply-to-description">Where customers' email replies go.</p>
    <input class="hinput" name="reply-to" type="email" autocomplete="email"
      aria-labelledby="reply-to-title" aria-describedby="reply-to-description" />
  </div>
</div>
```

Use whichever heading level fits the page, or a `<p>`, for the title.

## Appearance and states

- Rows are separated by a 1px `--harmo-color-border` divider and padded 16px
  above and below; the first row has no top padding and the last no bottom
  padding or divider.
- The text takes the row's free width, with 16px between it and a control on
  the right, which is vertically centered and keeps its size.
- Title: 15px bold, 1.3 line height, `--harmo-color-text`. Description: 14px,
  4px below, `--harmo-color-text-tertiary`.
- A control under the text sits 12px below the description, as wide as the
  text.
- A disabled control that is a direct child of the row or of `.hsetting-text`
  turns the title and description `--harmo-color-text-tertiary`. One nested
  deeper, such as a segmented control's radios, doesn't.

## Accessibility

Only the control responds to clicks; the text isn't a `<label>`. The control
takes its name from the title with `aria-labelledby` and its description with
`aria-describedby`.

## What a script does

None.

## React

`<Settings>` renders the list, and `<Setting>` each row. A Setting's children
are its control, named by the row's title and described by its description;
a [Button](../components/button.md#react) keeps its own label and takes only
the description, and so does a control given its own `aria-label` or
`aria-labelledby`. Other props are the `<div>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The row's title |
| `description` | The text under it |
| `labelAs` | The title's element: `h2` to `h6`, or `p`; `h3` by default |
| `placement` | `below` puts the control under the text, for one that fills its container |

```tsx
<Settings>
  <Setting
    label="Recap emails"
    description="Send account recap emails to the recipients below."
  >
    <Switch />
  </Setting>
  <Setting
    label="Default language"
    description="Used for new templates and automated replies."
    placement="below"
  >
    <Select defaultValue="en">
      <Option value="en">English</Option>
      <Option value="es">Spanish</Option>
    </Select>
  </Setting>
</Settings>
```

## Tokens

`--harmo-color-border`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-sm`, `--harmo-font-weight-bold`.
