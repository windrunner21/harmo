# Popup

A floating surface for option lists ([Listbox](listbox.md)) and small panels,
such as a filter form. For a short description on hover, use a
[Tooltip](tooltip.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `popup.css` |
| Element | `<div class="hpopup" popover>`, opened by a trigger with `popovertarget` |
| Parts | None; the content is a [Listbox](listbox.md) or the app's own panel |
| Required | An `id` on the popup; `popovertarget` and `aria-expanded` on the trigger; `style="anchor-name: --…"` on the trigger matching `style="position-anchor: --…"` on the popup |
| Unique | Every id, and each anchor name |
| Script | Required for `aria-expanded` and `data-side`; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" data-variant="secondary" type="button" aria-expanded="false"
  popovertarget="contains-filter" style="anchor-name: --contains-filter">
  <span class="hbutton-label">Name contains</span>
</button>

<div class="hpopup" id="contains-filter" popover
  style="position-anchor: --contains-filter">
  <div style="display: grid; gap: var(--harmo-space-sm); padding: var(--harmo-space-xs)">
    …
    <button class="hbutton" type="button"
      popovertarget="contains-filter" popovertargetaction="hide">
      <span class="hbutton-label">Apply</span>
    </button>
  </div>
</div>
```

The trigger's `popovertarget` opens and closes the popup, and a button inside
with `popovertargetaction="hide"` closes it. The popup has no padding, so a
panel lays out its own content.

## Options

| Hook | Effect |
| --- | --- |
| `data-align="end"` | Aligned to its trigger's end edge instead of its start, as for a popup from the end of a bar or a row; without room, it aligns to the start edge |
| `data-preferred-side="top"` | Above its trigger by preference, as from a bar at the foot of a page or a footer; without room above, below it |
| `data-side="top"` | The popup opened above its trigger, so it slides from below |

## Appearance and states

- Renders in the top layer: no portal, no `z-index`.
- Placed 8px below the trigger, aligned to its start edge, at least as wide as
  the trigger, and at most 400px tall, ending at least 8px from the window's
  edge.
- Without room, it tries in order: above the trigger; below, aligned to the
  trigger's other edge; above, aligned to the other edge; below, shrunk to the
  window and scrolling; then, if it's too wide for either side of the trigger,
  below and centered in the window.
- With `data-align="end"`, it's aligned to the trigger's end edge, and ends
  at least 8px from the window's start; without room, it tries the same
  order, its other edge being the start.
- Each opening starts from below, or from above with
  `data-preferred-side="top"`, whose fallbacks start from there: below, then
  the other edge, then shrunk below. Browsers keep the last position that fit
  while it still fits, so an open popup doesn't jump as the page scrolls. A
  change to the fallback list makes them forget it, so `data-refit`, which a
  script toggles as each opening starts, switches between two lists that
  behave the same. A closing popup fades where it is: the script pins it to
  its box with `data-pinned`, since Firefox would otherwise place it afresh
  as it leaves the top layer.
- A column layout, so a list inside can shrink and scroll while a search row or
  footer stays put.
- Opens in 200ms: a 12px slide away from the trigger and a fade. Closes in
  150ms. Both use `--harmo-ease-out-cubic`. Reduced motion: fade only. In
  Firefox, at a fallback position, such as aligned to the trigger's other
  edge, it shows once its fade would have ended, without it: Firefox doesn't
  run a transition there.
- A closed popup isn't laid out, `display: none`, so a page of closed
  popups, such as a menu on every row of a table, costs nothing as things on
  it move: laid out, each would be placed again, anchored to its trigger. It
  fades and slides in from `@starting-style` as it opens. As it closes, a
  script keeps it laid out with `data-closing` until its fade ends, which
  Firefox and Safari don't do for a popover themselves. An opening popup
  turns visible at once, so focus can move inside it right away.

## Accessibility

- The browser closes it on outside click and Escape; a popup opened from
  inside another keeps the outer one open. An Escape that hides a
  [Tooltip](tooltip.md) shown inside it hides only that, and the next one
  closes it.
- Hidden content can't be focused or reached by screen readers.
- `aria-expanded` on the trigger tells screen readers whether it's open.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` on the trigger | On every open and close; it also styles open select triggers |
| `data-refit` on the popup, toggled | As each opening starts, so the browser finds its position afresh; again once it's open; and once its opening fade has ended or stopped, only if the popup isn't fully shown, so a popup that's fine doesn't move. At a fallback position, Firefox keeps the styles it worked out when it placed the popup there until its fallbacks change: while it was closed, or partway through its fade, so it would stay unseen or faint. Each opening or closing voids what an earlier one left to do, so opening, closing, and opening again at once refits once. Its value doesn't matter, the change does |
| Focus, back on the trigger | When a popup opened over another closes with focus inside it, once its `toggle` event says it closed, not when it opened again at once; browsers do this only for the first popup open |
| `data-side="top"` on the popup | Before opening, when it will land above its trigger: when it fits there and not below, or, with `data-preferred-side="top"`, whenever it fits there; and before closing, when it's above. Without room on either side, it shrinks below. CSS can't tell which side it landed on |
| `data-measuring` on the popup, set and removed at once | Before opening, around measuring its height for its side: still closed, it isn't laid out otherwise. It stays unseen |
| `data-closing` on the popup | Before closing, so it stays laid out for its fade; removed once its fade has ended, found through `getAnimations()`, a frame later where Safari starts it late, or once it's open again, when it's reopened as it fades |
| `data-pinned` on the popup, with `--hpopup-pinned-top`, `-left`, `-width`, and `-height` from its box, less the slide still under way if it closes as it opens | Before closing, so it fades where it is; removed as it next opens |

In `beforetoggle`, when opening, remove `data-pinned` and toggle `data-refit`
first, then work the side out from the room around the trigger, with
`data-measuring` on the popup while you measure it, as the CSS does: above when the popup fits there but not below, or, with
`data-preferred-side="top"`, whenever it fits there. Wait for its opening
fade through `getAnimations()`, not `transitionend`, which a popup with no
fade never sends. After the toggle, the
popup measures at its whole height, not one it was shrunk to where it last
fit; its position can't tell where it will land. When closing, measure where
it is, since scrolling may have moved it, then pin it there, less its
`transform`: closing during the opening slide, the closing slide carries on
from where that one was, so counting it in the pinned box would move the
popup twice. If the side
changes, apply it without a transition, so the slide starts from the right
side. `examples/html/src/scripts/popup.js` is an example script. Other
listeners that change the popup's contents as it opens, such as a Listbox
restoring its search results, should listen in the capture phase, so they run
first.

## React

`<Popup>` renders its `trigger`, then the popup holding its children, and
connects them: the trigger gets `popovertarget`, `aria-expanded`, and an
anchor name, and the popup's `data-side` follows the side it opens on, so it
slides away from the trigger. A [Listbox](listbox.md) inside takes the keys
pressed on a `role="combobox"` trigger, as a [Select](select.md)'s does,
after the trigger's own `onKeyDown`: `preventDefault()` there keeps a key from
it. Other props, `ref` included, are the popup `<div>`'s.

| Prop | Effect |
| --- | --- |
| `trigger` | The element that opens it, such as a `<Button>` or a `<FilterChip>` |
| `align` | `"start"`, the default, or `"end"`: which of the trigger's edges it's aligned to |
| `side` | `"bottom"`, the default, or `"top"`: the side of the trigger it opens on by preference; without room there, it opens on the other |
| `id` | The popup's id; generated when left out. Pass your own to close it from a button inside, with `popoverTarget` and `popoverTargetAction="hide"` |

```tsx
const id = useId();

<Popup id={id} trigger={<FilterChip label="Name contains" />}>
  <div style={{ display: "grid", gap: "var(--harmo-space-sm)", padding: "var(--harmo-space-xs)" }}>
    <Field label="Name contains">
      <Input name="contains" type="text" />
    </Field>
    <Button popoverTarget={id} popoverTargetAction="hide">
      Apply
    </Button>
  </div>
</Popup>
```

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-color-background`,
`--harmo-color-border`, `--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`.
