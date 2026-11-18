# Dropdown Menu

A list of actions and links that a button opens, such as a row's More, an
account's menu, or a header's Create. Each item is a link or a button, with
an optional icon, in groups with labels and between dividers; an item can
open a submenu beside it. For choosing a
value, use a [Select](select.md); for a site's main navigation, a
[Navigation Menu](navigation-menu.md); for a panel or a form, a
[Popup](popup.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `dropdown-menu.css`, `popup.css`; `button.css` for its trigger |
| Element | `<div class="hpopup hdropdown-menu" role="menu" tabindex="-1" popover>`, a [Popup](popup.md), opened by a trigger with `aria-haspopup="menu"` |
| Parts | `.hdropdown-menu-item` with `role="menuitem"` and `tabindex="-1"`: an `<a href>`, or a `<button type="button">`, its icon first; `role="group"` with a `.hdropdown-menu-group-label` first; `.hdropdown-menu-separator` with `role="separator"`. A submenu: a `<button class="hdropdown-menu-item">` with `aria-haspopup="menu"`, `popovertarget`, and `popovertargetaction="show"`, ending in a [Chevron](chevron.md) with `.hdropdown-menu-sub-chevron`, followed at once by its own `.hdropdown-menu`, inside this one. `.hdropdown-menu-scroll`, which the script adds |
| Required | A Popup's: an `id` on the menu, `popovertarget` and `aria-expanded` on the trigger, and the anchor names; a name for the menu, `aria-labelledby` naming its trigger, or `aria-label`; `aria-labelledby` naming a group's label, with `role="presentation"` on the label |
| Unique | Every id, and each anchor name |
| Script | Required, to move focus with the keys and close the menu as an item is chosen; and the Popup's own. See [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" data-variant="secondary" type="button" id="actions-trigger"
  aria-haspopup="menu" aria-expanded="false" popovertarget="actions-menu"
  style="anchor-name: --actions-menu">
  <span class="hbutton-label">Actions</span>
  …an Expand Chevron…
</button>

<div class="hpopup hdropdown-menu" id="actions-menu" role="menu" tabindex="-1"
  aria-labelledby="actions-trigger" popover style="position-anchor: --actions-menu">
  <button class="hdropdown-menu-item" type="button" role="menuitem" tabindex="-1">
    <svg class="hicon" aria-hidden="true">…</svg>Duplicate
  </button>
  <a class="hdropdown-menu-item" href="/orders/4821/share" role="menuitem" tabindex="-1">Share</a>
  <div class="hdropdown-menu-separator" role="separator"></div>
  <div role="group" aria-labelledby="actions-danger">
    <div class="hdropdown-menu-group-label" id="actions-danger" role="presentation">Danger zone</div>
    <button class="hdropdown-menu-item" type="button" role="menuitem" tabindex="-1" data-destructive>Delete</button>
  </div>
</div>
```

The items aren't in the Tab order: the arrow keys move between them, as in a
menu on the desktop.

A submenu is a Dropdown Menu inside this one, right after the item that
opens it, which has an `id` and the trigger's attributes, with
`popovertargetaction="show"` so a press doesn't close it again:

```html
<button class="hdropdown-menu-item" type="button" role="menuitem" tabindex="-1" id="actions-share-trigger"
  aria-haspopup="menu" aria-expanded="false" popovertarget="actions-share" popovertargetaction="show"
  style="anchor-name: --actions-share">
  …icon…Share<svg class="hicon hchevron hdropdown-menu-sub-chevron" aria-hidden="true">…</svg>
</button>
<div class="hpopup hdropdown-menu" id="actions-share" role="menu" tabindex="-1"
  aria-labelledby="actions-share-trigger" popover style="position-anchor: --actions-share">
  <button class="hdropdown-menu-item" type="button" role="menuitem" tabindex="-1">Email</button>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-destructive` on an item | For an action that destroys something: red, on red's tint while it has focus |
| `disabled` on a button item | Dimmed, in `--harmo-color-text-tertiary`, and the keys pass it by, as they do an item in a hidden group |
| `data-align="end"` on the menu | The [Popup](popup.md)'s: aligned to its trigger's end, as from the end of a bar or a row |

## Appearance and states

- A [Popup](popup.md): it opens 8px from its trigger and slides in, at least
  128px wide or its trigger's width, at most 320px, where a long item wraps,
  with 4px inside.
- Taller than it can be, it scrolls with its scrollbar hidden, as a
  [Listbox](listbox.md) does: `.hdropdown-menu-scroll`, a scroll arrow,
  `data-direction="up"` or `"down"`, shows at an end while there's more that
  way, a 32px band over the menu's edge with a 16px chevron in
  `--harmo-icon-color`, on `--harmo-color-background`, fading over its last
  8px. Resting the pointer on it scrolls the menu that way, half a pixel a
  millisecond, to the end; an item the keys reach stops clear of it.
- Its items are a [Listbox](listbox.md) option's rows: 14px text in
  `--harmo-color-text-secondary` on a 21px line, 8px above and below, 10px
  from the sides, so 37px tall, with a 4px radius. An icon comes first,
  drawn at 20px, whatever size the SVG declares, 10px from the text.
- The item with focus takes `--harmo-color-background-hover`, from the keys
  or the pointer: the mouse moves focus with it, so only one item is ever
  shown. A destructive item is `--harmo-color-danger`, on
  `--harmo-color-danger-background` with focus. In forced-colors mode, the
  item with focus is outlined in `Highlight`.
- A group's label is a Listbox group's: 11px bold capitals, spaced, in
  `--harmo-color-primary`.
- A separator is a 1px line in `--harmo-color-border`, across the menu to its
  edges, 4px above and below.
- A submenu's item ends in a 16px [Chevron](chevron.md), pointing where it
  opens, and keeps the hover background while it's open. The submenu opens
  beside it, 4px past the menu's edge, its first item level with it, at most
  400px tall, as a Popup is, or the window's height less 16px, scrolling
  past that. Without room at the end, it opens at the start; without room
  below, it ends level with the item; in a window too short for either, it's
  centered on the item, shifted to stay in the window; with no room beside
  the menu at all, as on a phone, it's over the menu, centered on the item
  the same way. It's the same height
  wherever it lands, so it scrolls to its last item in each place. It fades
  in without sliding, as it opens on hover.

## Accessibility

- The trigger says it opens a menu with `aria-haspopup="menu"`, and whether
  it's open with `aria-expanded`. The menu is named by its trigger, through
  `aria-labelledby`, or by `aria-label`.
- Its items are `role="menuitem"`, links too, which a screen reader
  announces as menu items. The arrow keys reach them, not Tab.
- The keys follow the WAI-ARIA menu button pattern:

  | Key | On the trigger | In the menu |
  | --- | --- | --- |
  | <kbd>Enter</kbd>, <kbd>Space</kbd> | Opens it, focus on the first item | Chooses the item with focus |
  | <kbd>↓</kbd> | Opens it, focus on the first item | Focus to the next item, stopping at the last |
  | <kbd>↑</kbd> | Opens it, focus on the last item | Focus to the item before, stopping at the first |
  | <kbd>Home</kbd>, <kbd>End</kbd> | | Focus to the first or last item |
  | A letter | | Focus to the next item that starts with it; letters typed together match more |
  | <kbd>→</kbd> | | On a submenu's item, opens it, focus on its first item |
  | <kbd>←</kbd> | | In a submenu, closes it, focus back on its item |
  | <kbd>Escape</kbd> | | Closes it, or only the submenu it's in, focus back on what opened it |
  | <kbd>Tab</kbd> | | Closes it, and its submenu, and moves on from the trigger |

  In a right-to-left page, <kbd>←</kbd> and <kbd>→</kbd> swap.

- Opened with the pointer, focus goes to the menu itself, so no item is
  shown as chosen until the pointer or a key moves to one.
- The scroll arrows are for the pointer: hidden from screen readers with
  `aria-hidden="true"`, and never focused, as the keys bring the item they
  reach into view.
- Choosing an item closes the menu and hands focus back to the trigger,
  unless the item moved it elsewhere, such as into a dialog it opened.
  Choosing one in a submenu closes every menu.
- Pointed at, a submenu's item opens it 100ms later, focus staying on the
  item. The pointer moving to another item closes it 200ms later, unless the
  pointer reaches the submenu first, so it can cross other items on its
  way.

## What a script does

The [Popup](popup.md)'s script opens and closes it, keeps the trigger's
`aria-expanded`, and hands focus back to the trigger as it closes. Its own:

| Change | When |
| --- | --- |
| Focus to the first item | It opens from the trigger's <kbd>Enter</kbd> or <kbd>Space</kbd>, a click whose `detail` is 0, or <kbd>↓</kbd>, which opens it with a click on the trigger, or moves focus in if it's open |
| Focus to the last item | It opens from the trigger's <kbd>↑</kbd> |
| Focus to the menu | It opens from a click with the pointer, or the mouse leaves an item for the menu's padding, a label, or a separator, or leaves the menu |
| Focus to an item | The keys in the menu table above; or the mouse moves over it, as `pointermove`, focused without scrolling |
| A press of the link with focus | <kbd>Space</kbd> on a link, which a link doesn't do itself |
| Focus to the trigger, then `hidePopover()` | <kbd>Tab</kbd> in the menu, not prevented, so it moves on from the trigger |
| `hidePopover()` on the outermost menu | A click on an item, after the item's own; not a link clicked with a modifier key, which opens elsewhere, nor a submenu's item |
| A submenu's `showPopover()` | 100ms after the mouse moves over its item, if focus is still there |
| A submenu's `hidePopover()` | 200ms after the mouse moves over another item of its menu, if the pointer hasn't reached it; <kbd>←</kbd> in it, focus back to its item |
| Focus to a submenu's first item | <kbd>→</kbd>, <kbd>Enter</kbd>, or <kbd>Space</kbd> on its item; a click with the pointer leaves focus on the item |
| Add a scroll arrow at each end, `<div class="hdropdown-menu-scroll" data-direction="up" role="presentation" aria-hidden="true" hidden>` first and the `"down"` one last, and keep them there | As the menu is set up, and whenever its items change |
| Remove `hidden` from the up arrow while the menu is scrolled down at all, and from the down arrow while there's more below, and set it back at the ends | When the menu scrolls, changes size, or its items change |
| Scroll the menu toward an arrow, half a pixel a millisecond, until it reaches that end | While the pointer rests on the arrow |

Each menu handles the keys, the pointer, and the clicks on its own items,
not those of a submenu inside it, though they bubble through it; the
outermost menu handles Tab.

`examples/html/src/scripts/dropdown-menu.js` is an example script.

## React

`<DropdownMenu>` renders its `trigger`, then a [Popup](popup.md) holding its
items, and connects them: the trigger gets `aria-haspopup="menu"`, an `id`
if it has none, and the Popup's attributes, and the menu is named by it.
Other props, `align` and `ref` included, are the Popup's.

| Component | Effect |
| --- | --- |
| `DropdownMenu` | `trigger`, the button that opens it, such as a `<Button>` |
| `DropdownMenuItem` | An item: a link with `href`, through `HarmoProvider`'s `linkComponent`, or else a button, whose `onClick` is the action; `icon`, before its text; `destructive` |
| `DropdownMenuGroup` | Items under a `label` |
| `DropdownMenuSeparator` | A line between items or groups |
| `DropdownMenuSub` | An item that opens a submenu of its children: `label`, and `icon` |

```tsx
<DropdownMenu
  align="end"
  trigger={
    <Button variant="tertiary" aria-label="More actions">
      <MoreIcon className="hicon" />
    </Button>
  }
>
  <DropdownMenuItem icon={<CopyIcon className="hicon" />} onClick={duplicate}>
    Duplicate
  </DropdownMenuItem>
  <DropdownMenuItem href="/orders/4821/share">Share</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem icon={<TrashIcon className="hicon" />} destructive onClick={confirmDelete}>
    Delete
  </DropdownMenuItem>
</DropdownMenu>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-color-danger`,
`--harmo-color-danger-background`, `--harmo-color-primary`,
`--harmo-color-text-secondary`, `--harmo-font-line-height`,
`--harmo-color-background`, `--harmo-icon-color`,
`--harmo-font-size-3xs`, `--harmo-font-size-sm`,
`--harmo-font-weight-bold`, `--harmo-space-2xs`, `--harmo-space-xs`; and the
[Popup](popup.md)'s and the [Chevron](chevron.md)'s.
