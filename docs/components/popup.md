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
  <div style="display: grid; gap: 16px; padding: 12px">
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
| `data-side="top"` | The popup opened above its trigger, so it slides from below |

## Appearance and states

- Renders in the top layer: no portal, no `z-index`.
- Placed 8px below the trigger, aligned to its start edge, at least as wide as
  the trigger, and at most 400px tall.
- Without room, it tries in order: above the trigger; below, aligned to the
  trigger's other edge; above, aligned to the other edge; then below, shrunk to
  the window and scrolling.
- Each opening starts from below. Browsers keep the last position that fit
  while it still fits, so an open popup doesn't jump as the page scrolls. A
  change to the fallback list makes them forget it, so `data-refit`, which a
  script toggles as each opening starts, switches between two lists that
  behave the same. Closing changes neither, so a closing popup stays put.
- A column layout, so a list inside can shrink and scroll while a search row or
  footer stays put.
- Opens in 200ms: a 12px slide away from the trigger and a fade. Closes in
  150ms. Both use `--harmo-ease-out-cubic`. Reduced motion: fade only.
- Closed popups stay rendered with `visibility: hidden` instead of
  `display: none`, which Firefox can't animate. An opening popup turns
  visible at once, so focus can move inside it right away; a closing one stays
  visible until its fade ends.

## Accessibility

- The browser closes it on outside click and Escape; a popup opened from
  inside another keeps the outer one open.
- Hidden content can't be focused or reached by screen readers.
- `aria-expanded` on the trigger tells screen readers whether it's open.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` on the trigger | On every open and close; it also styles open select triggers |
| `data-refit` on the popup, toggled | As each opening starts, so the browser finds its position afresh; its value doesn't matter, the change does |
| `data-side="top"` on the popup | Before opening, when it will land above its trigger, and before closing, when it's above; CSS can't tell which side it landed on |

In `beforetoggle`, when opening, toggle `data-refit` first, then work the
side out from the room around the trigger, as the CSS does: above when the
popup fits there but not below. After the toggle, the popup measures at its
whole height, not one it was shrunk to where it last fit; its position can't
tell where it will land. When closing, measure where it is, since scrolling
may have moved it. If the side changes, apply it without a transition, so the
slide starts from the right side. `examples/html/src/scripts/popup.js` is an
example script. Other listeners that change the popup's contents as it opens,
such as a Listbox restoring its search results, should listen in the capture
phase, so they run first.

## React

`<Popup>` renders its `trigger`, then the popup holding its children, and
connects them: the trigger gets `popovertarget`, `aria-expanded`, and an
anchor name, and the popup's `data-side` follows the side it opens on, so it
slides away from the trigger. Other props, `ref` included, are the popup
`<div>`'s.

| Prop | Effect |
| --- | --- |
| `trigger` | The element that opens it, such as a `<Button>` or a `<FilterChip>` |
| `id` | The popup's id; generated when left out. Pass your own to close it from a button inside, with `popoverTarget` and `popoverTargetAction="hide"` |

```tsx
const id = useId();

<Popup id={id} trigger={<FilterChip label="Name contains" />}>
  <div style={{ display: "grid", gap: 16, padding: 12 }}>
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
