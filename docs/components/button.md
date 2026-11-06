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
| `data-size="small"` | Compact: 29px, 13px text, 6px radius, for notices, rows, and cards |
| `.hbutton-label` | Spaces the text 6px from the border and from icons; long labels wrap |
| No `.hbutton-label` | Icon only: a square as wide as it is tall |
| A direct `.hicon` | Keeps its size |
| A trailing `.hexpand-chevron` | Kept 6px (`--harmo-icon-gap`) from the border, like the label's text |
| `disabled` | Dimmed, not-allowed cursor (`<button>` only) |
| `aria-disabled="true"` | Looks disabled but stays focusable; a script must ignore activation |
| `aria-busy="true"` | Loading, with `aria-disabled="true"` and a `.hspinner` |
| `data-destructive` | Destructive, in any variant: filled red, outlined with red text, or red text alone; the focus ring keeps the accent |
| `data-hold` | Hold to confirm: the action runs once the button is held; see [Hold to confirm](#hold-to-confirm) |
| `--hbutton-hold-duration` | How long it's held: `1.5s` by default |

## Appearance and states

- `--harmo-control-height` (34px) tall; a long label wraps and the button grows
  instead of overflowing. Text is 14px medium on a 20px line. The button itself
  has no padding; the label spaces its text.
- `flex-shrink: 0`: in a row, a full-width neighbor such as an input shrinks
  instead of the button. `vertical-align: middle`, so icon-first and
  text-first buttons line up.
- Icon only: a 34px square (29px when small) with the icon centered and drawn
  at 20px, whatever size the SVG declares. While loading, a `.hspinner` takes
  the icon's place.
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
  A loading spinner fades in. With reduced motion, at once.
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
  too. Let go early, it snaps back in 0.2s, `ease-out`: the hold slow and
  even, the release fast, as the animations.dev course's hold to delete
  does. Pressed, it shrinks to 0.97 in 160ms (`--harmo-ease-out-quad`), as in
  the course, and keeps its resting colors, since the fill is its feedback.
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
  across the screen, and fades out when let go.
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
| Ignore activation | While `aria-disabled="true"` |
| Add `aria-busy="true"`, `aria-disabled="true"`, and a `.hspinner`; remove them when done | While an action is in progress |
| The width, from the old to the new, over 200ms | When what it shows changes, its text or whether it's loading |
| `data-holding`, for `--hbutton-hold-duration`, then `data-held` for 200ms, then the action | While a `data-hold` button is held by the primary pointer, or by Enter or Space; leaving it, a second finger, or letting go early stops it, and a held key's repeats are ignored |
| The action, at once | On a `data-hold` button's click with no press behind it, such as a screen reader's |
| Nothing native: the click's default is prevented | On every `data-hold` button's click, so it never sends a form or runs a command on its own; the action does that |
| A finger's pointer capture, released | As a hold starts by touch or pen, so moving off the button lets go |

`examples/html/src/scripts/button.js` is an example script for all of it.

## React

`<Button>` renders a `<button type="button">`, or with `href` a link, with its
text in `.hbutton-label`. An icon as its first or last child stays outside
the label: Harmo's `<ChevronToArrow>`, `<Chevron>`, or `<ExpandChevron>`, or
any element with the `hicon` class. Other props are the button's or the
link's attributes, so `type="submit"` makes a submit button.

| Prop | Effect |
| --- | --- |
| `variant` | `secondary` or `tertiary`; primary when left out |
| `size` | `small` |
| `loading` | Shows the spinner after the label, sets `aria-busy` and `aria-disabled`, and ignores clicks |
| `href` | Renders a link, through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |
| `aria-disabled` | `"true"` keeps it focusable but ignores clicks, so a [Tooltip](tooltip.md) can explain why |
| `commandfor`, `command` | The button's command for another element, such as `command="show-modal"` to open the [Dialog](dialog.md) whose id `commandfor` names |
| `destructive` | For an action that destroys something: red, in any variant |
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
`--harmo-ease-out-quad`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-icon-gap`, `--harmo-opacity-disabled`.
