# Segmented control

One choice from a few short options shown side by side, such as a message
header type (No header / Text / Media / Location). For more options or longer
labels, use a [Radio](radio.md) group or a [Select](select.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `segmented.css`; `field.css` for the label |
| Element | `<div class="hsegmented" role="radiogroup">` |
| Parts | `.hsegmented-option`: a `<label>` wrapping an `<input type="radio">` and its text |
| Required | `aria-labelledby` or `aria-label` on the group; the same `name` on every radio in it |
| Unique | Every id, and each group's `name` |
| Script | None |

## Markup

```html
<div class="hfield">
  <span class="hlabel" id="header-type-label">Message header</span>
  <div class="hsegmented" role="radiogroup" aria-labelledby="header-type-label">
    <label class="hsegmented-option">
      <input type="radio" name="header-type" value="none" checked />No header
    </label>
    <label class="hsegmented-option">
      <input type="radio" name="header-type" value="text" />Text
    </label>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `checked` on a radio | The chosen option |
| `disabled` on a radio | That option dimmed, not-allowed cursor |

## Appearance and states

- Options 8px apart, `--harmo-control-height` tall, 14px
  `--harmo-color-text-secondary` text, 8px radius, and a
  `--harmo-input-color-border` border like [inputs](input.md).
- Labels never wrap. Options share the row equally; one with a longer label
  takes the room it needs, and options move to a new row only when they can't
  all fit on one.
- Hover (hover devices): `--harmo-color-primary` border.
- Checked: border and text in `--harmo-color-primary`.
- Keyboard focus: the standard ring around the option.
- Disabled: `--harmo-opacity-disabled` (50%).
- No animation.
- Forced colors (Windows contrast themes): the chosen option is filled with
  the system highlight color, like a selected item.

## Accessibility

Each option wraps a native radio, so the group works in forms, Tab reaches the
chosen option, and the arrow keys move the choice. The radios are invisible but
stay focusable, and `role="radiogroup"` with `aria-labelledby` names the group.

## What a script does

None.

## React

`<Segmented>` renders the group, with a `<SegmentedOption>` for each option;
with `label`, it also renders the Field and label above it. Without `label`,
name it with `aria-label`, or place it in a
[Setting](../patterns/settings.md#react), which names it. Other props are the
group `<div>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The label above it |
| `name` | The name its options submit under; generated when left out |
| `value` or `defaultValue` | The chosen option's value |
| `onValueChange` | Called with the newly chosen value |
| `required`, `disabled` | Set on every option |

`<SegmentedOption>` takes its `value`, its text as children, and optionally
`disabled`. Its `className` and `style` go to the option's `<label>`, and its
other props to the radio inside.

```tsx
<Segmented label="Message header" name="header-type" defaultValue="none">
  <SegmentedOption value="none">No header</SegmentedOption>
  <SegmentedOption value="text">Text</SegmentedOption>
  <SegmentedOption value="media">Media</SegmentedOption>
  <SegmentedOption value="location">Location</SegmentedOption>
</Segmented>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-control-height`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`, `--harmo-font-family`,
`--harmo-font-size-sm`, `--harmo-input-color-border`,
`--harmo-opacity-disabled`.
