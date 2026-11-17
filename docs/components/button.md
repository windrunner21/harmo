# Button

An action. Use a `<button>`, or an `<a href>` styled as a button when the
action is navigation. For navigation inside text, use [Link](link.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `button.css`; `spinner.css` for loading; `chevron-to-arrow.css`, `expand-chevron.css`, `kbd.css`, or `tooltip.css` when used |
| Element | `<button class="hbutton" type="…">`, or `<a class="hbutton" href="…">` |
| Parts | `.hbutton-label` for the text, which may end with a [`.hkbd`](kbd.md) for a shortcut; optional direct `.hicon`, `.hspinner`, `.hexpand-chevron`; to hold to confirm, a `.hbutton-hold` fill last inside it |
| Required | `type` on a `<button>`; an icon-only button needs `aria-label` or `aria-labelledby` |
| Unique | Ids that `aria-labelledby` or `aria-describedby` point to |
| Script | Only for `aria-disabled`, loading, and holding to confirm; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>

<button class="hbutton" data-variant="secondary" type="button">
  <span class="hbutton-label">Cancel</span>
</button>

<a class="hbutton" data-variant="tertiary" href="/reports">
  <span class="hbutton-label">Read more</span>
</a>
```

With a ChevronToArrow:

```html
<button class="hbutton" data-variant="secondary" type="button">
  <svg class="hicon hchevron-to-arrow" data-direction="back" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g class="hchevron-to-arrow-head">
      <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" />
      <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" />
    </g>
    <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" />
  </svg>
  <span class="hbutton-label">Go back</span>
</button>
```

Icon only, named with `aria-label` (any SVG drawn in `currentColor`):

```html
<button class="hbutton" data-variant="tertiary" type="button" aria-label="Close">
  <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
</button>
```

Loading:

```html
<button class="hbutton" type="submit" aria-busy="true" aria-disabled="true">
  <span class="hbutton-label">Saving changes</span>
  <span class="hspinner" aria-hidden="true"></span>
</button>
```

Destructive, for an action that destroys something:

```html
<button class="hbutton" data-variant="secondary" data-destructive type="button">
  <span class="hbutton-label">Remove member</span>
</button>
```

Hold to confirm, for an action that's hard to undo: `data-hold`, with a copy
of its content in `.hbutton-hold`:

```html
<button class="hbutton" data-variant="secondary" data-size="small" data-destructive type="button" data-hold>
  <svg class="hicon" …></svg>
  <span class="hbutton-label">Hold to delete</span>
  <span class="hbutton-hold" aria-hidden="true">
    <svg class="hicon" …></svg>
    <span class="hbutton-label">Hold to delete</span>
  </span>
</button>
```

## Options

| Hook | Effect |
| --- | --- |
| (default) | Primary: filled `--harmo-color-primary-fill` |
| `data-variant="secondary"` | Outlined, lightly raised |
| `data-variant="tertiary"` | Text only; tinted background on hover |
| `data-size="small"` | Compact: `--harmo-control-height-small` (29px), 13px text, 6px radius, for notices, rows, and cards |
| `.hbutton-label` | Spaces the text 6px from the border and from icons; long labels wrap |
| No `.hbutton-label` | Icon only: a square as wide as it is tall |
| A direct `.hicon` | Drawn at 20px, whatever size the SVG declares, so icons from different sets match; beside a label, ChevronToArrow and the Expand Chevron keep their own |
| A trailing `.hexpand-chevron` | Kept 6px (`--harmo-icon-gap`) from the border, like the label's text |
| `disabled` | Dimmed, not-allowed cursor (`<button>` only) |
| `aria-disabled="true"` | Looks disabled but stays focusable; a script must ignore activation |
| `aria-busy="true"` | Loading, with `aria-disabled="true"` and a `.hspinner` |
| `aria-pressed` | A toggle, on with `"true"`, such as a rating or a filter: a secondary or tertiary one that's on is in `--harmo-color-primary`, and a secondary one on `--harmo-color-primary-tint` with a `--harmo-color-primary` border. Its name stays the same, on or off |
| `data-destructive` | Destructive, in any variant: filled red, outlined with red text, or red text alone; the focus ring keeps the accent |
| `data-hold` | Hold to confirm: the action runs once the button is held; see [Hold to confirm](#hold-to-confirm) |
| `--hbutton-hold-duration` | How long it's held: `1.5s` by default |
| `--hbutton-press-duration` | How long a hold button takes to shrink as it's pressed: `160ms` by default |
| A `.hbadge` after its content | A [Badge](badge.md) on its top corner, such as a count of unread messages. Say the count in the button's name |
| `data-instant` | Its width follows a change of its text at once, for text that changes often, such as a countdown or a live count; read by the script |

## Appearance and states

- `--harmo-control-height` (34px) tall; a long label wraps and the button grows
  instead of overflowing. Text is 14px medium on a 20px line. The button itself
  has no padding; the label spaces its text.
- `flex-shrink: 0`: in a row, a full-width neighbor such as an input shrinks
  instead of the button. `vertical-align: middle`, so icon-first and
  text-first buttons line up.
- Icon only: a 34px square (29px when small) with the icon centered and drawn
  at 20px, whatever size the SVG declares, a ChevronToArrow too. While
  loading, a `.hspinner` takes the icon's place.
- Loading: the spinner follows the label and the button grows to fit it. The
  spinner is 16px, drawn in the button's text color with a gap, 9px after the
  text and 6px from the border. The button looks disabled and shows a progress
  cursor.
- A ChevronToArrow rests 15px from the border to leave room for its slide. The
  button adds matching space on the label's other side: after the label for a
  leading back arrow, before it for a trailing forward arrow.
- Hover and press colors apply to enabled buttons and to links with `href`.
  Press scales to 0.98 (`--harmo-ease-out-quad`); reduced motion keeps only
  the color change.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).
- Disabled: `--harmo-opacity-disabled` (50%).
- When what it shows changes, its text or whether it's loading, its width
  goes from the old to the new over 200ms (`--harmo-duration-normal`,
  `--harmo-ease-out-cubic`) rather than jumping, its content on one line and
  clipped to it meanwhile, then its own inline `overflow` and `white-space`
  back. A change while one plays carries on from where that one had got to.
  With reduced motion, or `data-instant`, the width changes at once; a
  loading spinner still fades in, in 200ms (`--harmo-duration-normal`,
  `--harmo-ease-out-cubic`).
- An icon beside the label sits 3px from the border, so with the space drawn
  around it, it looks as far in as the label's text.

### Destructive

- Primary: `--harmo-color-danger-fill`, darker on hover and press
  (`-hover`, `-active`), with `--harmo-color-on-danger` text.
- Secondary: `--harmo-color-danger` text; the border turns
  `--harmo-color-danger-border` on hover, on a
  `--harmo-color-danger-background` tint when pressed.
- Tertiary: `--harmo-color-danger` text, on the tint on hover and press.

### Hold to confirm

- While it's held (`data-holding`), its fill, a copy of its content a clear
  step into the button's color, wipes across from its start edge over
  `--hbutton-hold-duration`, `linear`, as it shows time passing, its border
  too. Let go early, it snaps back in 200ms (`--harmo-duration-normal`,
  `--harmo-ease-out-cubic`): the hold slow and even, the release fast, as the
  animations.dev course's hold to delete does. Pressed, it shrinks to 0.97
  in 160ms (`--hbutton-press-duration`, `--harmo-ease-out-quad`), as in the
  course, and keeps its resting colors, since the fill is its feedback.
- The fill on an outlined or text button, as in the course's recipe, is its
  color's tint with that color's text and border: `--harmo-color-primary` on
  `--harmo-color-primary-tint`, or, destructive, `--harmo-color-danger` on
  `--harmo-color-danger-background` with a `--harmo-color-danger-border`
  border. A filled button deepens instead, to 62% of its fill
  (`--harmo-color-primary-fill`, or `--harmo-color-danger-fill`) mixed with
  black, keeping its white text: a clear step darker, in light and dark.
- Held all the way (`data-held`), it stays full for 200ms, whatever the
  pointer or key does, then the action starts.
- Working (`aria-busy="true"`): the fill stays whole, with the spinner, at
  full strength rather than dimmed, so it reads as the action, such as
  "Deleting", under way.
- On a right-to-left page, the fill comes in from the right.
- With reduced motion, the fill fades in over the hold instead of wiping
  across, so the hold still shows its time passing without anything sweeping
  across the screen, and fades out in 200ms when let go.
- A long press doesn't select its text or open the touch screen's menu.

## Accessibility

- `aria-disabled="true"` instead of `disabled` keeps the button focusable, so a
  tooltip can explain why it's unavailable.
- A loading button keeps focus, so a keyboard user who submitted with Enter
  doesn't lose their place.
- An icon-only button needs a name: `aria-label`, or a [Tooltip](tooltip.md)
  referenced with `aria-labelledby`. A naming tooltip uses `aria-labelledby`
  rather than `aria-describedby`, so screen readers say "Close, button" once,
  not twice.
- Hold to confirm works with a pointer, or by holding Enter or Space. A
  screen reader presses a button with a click, which can't hold, so a click
  with no press behind it runs the action at once: its press is already
  deliberate. Holding a key is a timing a keyboard user has to meet, which
  WCAG 2.1.1 asks to avoid; keep hold to confirm for actions whose cost of an
  accident outweighs that. The fill is `aria-hidden`, so the name isn't read
  twice.

## What a script does

| Change | When |
| --- | --- |
| Toggle `aria-pressed` between `"true"` and `"false"` | On a toggle's click |
| Ignore activation: prevent the click's default, so it sends no form, follows no link, and runs no command, and don't act; prevent a middle click's (`auxclick`) default too, which would open a link in a new tab | While `aria-disabled="true"` |
| Add `aria-busy="true"`, `aria-disabled="true"`, and a `.hspinner` right after the `.hbutton-label`, before any icon that follows it; remove them when done | While an action is in progress |
| The width, from the old to the new, over 200ms | When what it shows changes, its text or whether it's loading, unless it's appearing or disappearing, as when `hidden` changes too, or it has `data-instant` |
| `data-holding`, for `--hbutton-hold-duration`, then `data-held` for 200ms, then the action | While a `data-hold` button is held by the primary pointer, or by Enter or Space; leaving it, a second finger, or letting go early stops it, and a held key's repeats are ignored |
| Stop the hold, and the moment after a full one, at once | When a `data-hold` button turns `disabled` or `aria-disabled="true"` meanwhile |
| No action when the hold, or the moment after it, ends | When a `data-hold` button is disabled through its `<fieldset disabled>` meanwhile, which changes nothing on the button itself |
| The action, at once | On a `data-hold` button's click with no press behind it, such as a screen reader's |
| Nothing native: the click's default is prevented | On every `data-hold` button's click, so it never sends a form or runs a command on its own; the action does that |
| A finger's pointer capture, released | As a hold starts by touch or pen, so moving off the button lets go |

An `aria-disabled` link keeps its `href`, so its context menu, with Open in
new tab, and dragging it to another tab still go to it; only removing the
`href` would stop those.

`examples/html/src/scripts/button.js` is an example script for all of it.

## React

`<Button>` renders a `<button type="button">`, or with `href` a link, with its
text in `.hbutton-label`. An icon as its first or last child stays outside
the label: Harmo's `<ChevronToArrow>`, `<Chevron>`, or `<ExpandChevron>`, or
any element with the `hicon` class, inside a fragment too. A child that draws
nothing, such as an empty fragment, isn't a label, so an icon-only button
stays square. Other props are the button's or the link's attributes, so
`type="submit"` makes a submit button, and an `aria-busy` you pass is kept.

| Prop | Effect |
| --- | --- |
| `variant` | `secondary` or `tertiary`; primary when left out |
| `size` | `small` |
| `loading` | Shows the spinner after the label, sets `aria-busy` and `aria-disabled`, and ignores clicks and middle clicks |
| `href` | Renders a link, through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |
| `aria-disabled` | `"true"` keeps it focusable but ignores clicks and middle clicks, so a [Tooltip](tooltip.md) can explain why; a link's context menu and dragging it still work |
| `commandfor`, `command` | The button's command for another element, such as `command="show-modal"` to open the [Dialog](dialog.md) whose id `commandfor` names |
| `destructive` | For an action that destroys something: red, in any variant |
| `instant` | Sets `data-instant`: its width follows a change of its text at once, for text that changes often, such as a countdown's "Resend code in 30s" |
| `onHold` | Makes it a hold button, and runs once it's held, as React Native's `onLongPress` does; `onClick` still runs on every click. Its click doesn't do what a button's click does natively, so a `type="submit"` hold button doesn't send its form; send it from `onHold`, such as with `form.requestSubmit()` |
| `holdDuration` | How long it's held, in milliseconds: 1500 by default |

```tsx
<Button loading>Saving changes</Button>
<Button variant="secondary">
  <ChevronToArrow direction="back" />
  Go back
</Button>
<Button variant="tertiary" aria-label="Close">
  <CloseIcon className="hicon" />
</Button>
<Button variant="secondary" destructive>
  Remove member
</Button>
<Button variant="secondary" size="small" destructive loading={deleting} onHold={remove}>
  <TrashIcon className="hicon" />
  {deleting ? "Deleting" : "Hold to delete"}
</Button>
```

## Tokens

`--harmo-border-radius`, `--harmo-border-radius-sm`, `--harmo-button-duration`,
`--harmo-button-font-line-height`, `--harmo-button-font-weight`,
`--harmo-button-secondary-box-shadow`, `--harmo-button-secondary-color-border`,
`--harmo-button-secondary-color-text`,
`--harmo-button-secondary-hover-color-border`, `--harmo-color-background-hover`,
`--harmo-color-danger`, `--harmo-color-danger-background`,
`--harmo-color-danger-border`, `--harmo-color-danger-fill`,
`--harmo-color-danger-fill-active`, `--harmo-color-danger-fill-hover`,
`--harmo-color-on-danger`, `--harmo-color-primary`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-color-on-primary`, `--harmo-color-primary-fill`,
`--harmo-color-primary-fill-active`, `--harmo-color-primary-fill-hover`,
`--harmo-color-primary-tint`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-control-height`,
`--harmo-control-height-small`, `--harmo-ease-out-quad`,
`--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-icon-gap`, `--harmo-opacity-disabled`.
