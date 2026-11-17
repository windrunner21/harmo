# Segmented Control

One choice from a few short options shown side by side, such as a message
header type (No header / Text / Media / Location). For more options or longer
labels, use a [Radio](radio.md) group or a [Select](select.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `segmented.css`; `field.css` for the label |
| Element | `<div class="hsegmented" role="radiogroup">` |
| Parts | `.hsegmented-option`: a `<label>` wrapping an `<input type="radio">` and its text |
| Required | `aria-labelledby` or `aria-label` on the group; the same `name` on every radio in it; with a description or error, `aria-describedby` on the group pointing to them |
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

Small, with options that show only an icon, each named by its radio's
`aria-label`:

```html
<div class="hsegmented" role="radiogroup" aria-label="Show" data-size="small">
  <label class="hsegmented-option">
    <input type="radio" name="inbox-view" value="messages" aria-label="Messages" checked />
    <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  </label>
  <label class="hsegmented-option">
    <input type="radio" name="inbox-view" value="tickets" aria-label="Tickets" />
    <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  </label>
</div>
```

The label is a `<span>` with an id, since a `<label>` can't name a group. A
description, the Optional marker, and an error are a [Field](field.md)'s, as
for any control: connect them with `aria-describedby` on the group, and set
`aria-invalid="true"` on it while there's an error:

```html
<div class="hfield">
  <span class="hlabel" id="reply-tone-label">Reply tone</span>
  <p class="hdescription" id="reply-tone-description">Used for suggested replies.</p>
  <div class="hsegmented" role="radiogroup" aria-labelledby="reply-tone-label"
    aria-describedby="reply-tone-description reply-tone-error" aria-invalid="true">
    …
  </div>
  <p class="herror" id="reply-tone-error" aria-live="polite">Choose a tone.</p>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `checked` on a radio | The chosen option |
| `disabled` on a radio | That option dimmed, not-allowed cursor |
| `data-size="small"` on the group | Compact: `--harmo-control-height-small` (29px), 13px text, 6px radius, as a small [Button](button.md), for a row of small controls such as a toolbar's |
| `aria-label` or `aria-labelledby` on a radio | Its option shows only its icon, a `.hicon`: a square, 34px, or 29px when small, that keeps its size rather than sharing the row |

## Appearance and states

- Options 6px (`--harmo-space-2xs`) apart, `--harmo-control-height` tall, 14px
  `--harmo-color-text-secondary` text 10px (`--harmo-space-xs`) in from
  their sides, as an Input's is, 8px radius, and a
  `--harmo-input-color-border` border like [inputs](input.md).
- Options share the row equally; one with a longer label takes the room it
  needs, and options move to a new row only when they can't all fit on one.
  A label stays on one line, unless it's wider than the whole group: that
  option then takes a row of its own and its label wraps, with 6px
  (`--harmo-space-2xs`) above and below it.
- Hover (hover devices): `--harmo-color-primary` border. It weighs no more
  than the checked state, so an app's own rule for the checked option, such
  as `.hsegmented-option:has(:checked)`, loaded after Harmo, applies on hover
  too.
- Checked: border and text in `--harmo-color-primary`.
- Keyboard focus: the standard ring around the option. WebKit, Safari's
  engine, doesn't count the arrow keys' move as keyboard focus, so there the
  ring goes once they move the choice, until Tab.
- Disabled: `--harmo-opacity-disabled` (50%).
- Small: options 29px (`--harmo-control-height-small`) tall, with 13px
  (`--harmo-font-size-xs`) text and a 6px radius; the gap and the focus ring
  stay as they are.
- Icons: a `.hicon` in an option is drawn at 20px, whatever size its SVG
  declares. An option named by its radio, rather than by its text, is a
  square with its icon centered.
- No animation.
- Forced colors (Windows contrast themes): the chosen option is filled with
  the system highlight color, like a selected item.

## Accessibility

Each option wraps a native radio, so the group works in forms, Tab reaches the
chosen option, and the arrow keys move the choice. The radios are invisible but
stay focusable, and `role="radiogroup"` with `aria-labelledby` names the group.
Its description and error are read with its name, from `aria-describedby`.

An option that shows only an icon has no text to name it, so its radio needs
`aria-label`, or a [Tooltip](tooltip.md)'s label, which also shows the name
on hover and focus. A small option is 29px tall, under the 44px a touch target
should be, as a small Button is: keep it to rows of small controls, with room
around them.

## What a script does

None.

## React

`<Segmented>` renders the group, with a `<SegmentedOption>` for each option;
with `label`, it also renders its Field, with the label above it, and the
group takes the Field's description and error. An `aria-labelledby` of your
own wins over the label. Without `label`, name it with `aria-label`, or place
it in a [Setting](settings.md#react), which names it. Inside a `<Field>` of
your own, give that Field `control="button"`, so its label can name the
group. Other props are the group `<div>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The label above it |
| `optional`, `description`, `error` | As for a [Field](field.md#react), with `label`. Pass `error` to a group you validate, even while it's `undefined`; a message sets `aria-invalid` on the group |
| `name` | The name its options submit under; generated when left out |
| `value` or `defaultValue` | The chosen option's value |
| `onValueChange` | Called with the newly chosen value |
| `required`, `disabled` | Set on every option |
| `size` | `small` |

`<SegmentedOption>` takes its `value`, its text as children, and optionally
`disabled`. Its `className` and `style` go to the option's `<label>`, and its
other props to the radio inside, so `aria-label` names an option that shows
only an icon, as does a Tooltip around it:

```tsx
<Segmented aria-label="Show" defaultValue="messages" size="small">
  <Tooltip label="Messages">
    <SegmentedOption value="messages">
      <MessagesIcon className="hicon" />
    </SegmentedOption>
  </Tooltip>
  <Tooltip label="Tickets">
    <SegmentedOption value="tickets">
      <TicketsIcon className="hicon" />
    </SegmentedOption>
  </Tooltip>
</Segmented>
```

```tsx
<Segmented label="Message header" name="header-type" defaultValue="none">
  <SegmentedOption value="none">No header</SegmentedOption>
  <SegmentedOption value="text">Text</SegmentedOption>
  <SegmentedOption value="media">Media</SegmentedOption>
  <SegmentedOption value="location">Location</SegmentedOption>
</Segmented>
```

## Tokens

`--harmo-border-radius`, `--harmo-border-radius-sm`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-control-height`,
`--harmo-control-height-small`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-input-color-border`,
`--harmo-opacity-disabled`, `--harmo-space-2xs`, `--harmo-space-xs`.
