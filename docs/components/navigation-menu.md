# Navigation Menu

A site's main navigation: links, and triggers that each open a panel of rows,
on hover, a click, or Enter. One frame shows the open panel, resizing as you
move between triggers while the rows slide sideways. On a phone, the triggers
stack and each panel opens in place. To open it on a phone, use a
[Menu Button](menu-button.md). For an app's navigation down the side of the
window, use a [Sidebar](sidebar.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `navigation-menu.css`, `expand-chevron.css` |
| Element | `<nav class="hnavigation-menu">` |
| Parts | First, `<div class="hnavigation-menu-frame" aria-hidden="true">`; then `<ul class="hnavigation-menu-list">`, whose `<li>`s hold either an `<a class="hnavigation-menu-link">`, or a `<button class="hnavigation-menu-trigger">` with an [Expand Chevron](expand-chevron.md), followed at once by its `.hnavigation-menu-content`. That holds `<ul class="hnavigation-menu-rows">`, whose `<li>`s hold an `<a class="hnavigation-menu-row">`: optionally `.hnavigation-menu-icon` around an icon, then `.hnavigation-menu-text` with `.hnavigation-menu-title` and optionally `.hnavigation-menu-description` |
| Required | An `aria-label` on the nav, in the page's language, such as "Main"; `type="button"`, `aria-expanded`, and `aria-controls` naming its panel on a trigger; `inert` on a closed panel; `aria-hidden="true"` on an icon's `.hnavigation-menu-icon` |
| Unique | Each panel's `id` |
| Script | Required, to open and close the panels and size the frame; see [What a script does](#what-a-script-does) |

## Markup

```html
<nav class="hnavigation-menu" aria-label="Main">
  <div class="hnavigation-menu-frame" aria-hidden="true"></div>
  <ul class="hnavigation-menu-list">
    <li><a class="hnavigation-menu-link" href="/product">Product</a></li>
    <li>
      <button class="hnavigation-menu-trigger" type="button" aria-expanded="false" aria-controls="nav-solutions">
        Solutions
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
          <g class="hexpand-chevron-head">
            <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
            <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
          </g>
        </svg>
      </button>
      <div class="hnavigation-menu-content" id="nav-solutions" inert>
        <ul class="hnavigation-menu-rows">
          <li>
            <a class="hnavigation-menu-row" href="/solutions/commerce">
              <span class="hnavigation-menu-icon" aria-hidden="true">
                <svg class="hicon" …>…</svg>
              </span>
              <span class="hnavigation-menu-text">
                <span class="hnavigation-menu-title">Commerce</span>
                <span class="hnavigation-menu-description">Drive sales and convert chats</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </li>
  </ul>
</nav>
```

Each panel follows its trigger in the page, so Tab goes from a trigger into its
links. The frame and the panels are separate boxes of the same size in the same
place, so they look like one.

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="page"` on a link or row | The page you're on: a link in `--harmo-color-primary` and medium weight; a row with its title in `--harmo-color-primary`, on `--harmo-color-primary-tint`, with a 1px line just inside its edge |
| `data-align="start"` | The panel opens at the menu's start rather than its end, for a menu near the start of the window, where the panel would run off the edge |
| `data-orientation="vertical"` | The triggers stack, and each panel opens in place beneath its trigger, with no hover and no frame, such as in a [Popup](popup.md) on a phone. It's part of the page, as an Accordion is: Escape and a press outside are for whatever it's in |

## Appearance and states

- Links and triggers: 14px in `--harmo-color-text-secondary`, in a pill. Hovered,
  or open, `--harmo-color-text` on `--harmo-color-background-hover`, in 200ms.
- The panel: 8px under the menu, at its end, with 8px of padding, a 1px
  `--harmo-color-border` border, the 8px corners, and `--harmo-box-shadow-sm`.
  It stays 8px inside the window, its rows wrapping to fit and the panel moving
  over if it has to. It's sized to its rows, and follows them if they change.
- Opening: it fades in and grows from `scale(0.98)` in 200ms, and closes in
  150ms. Moving from one trigger to another, the frame resizes while the rows slide
  sideways, both in 200ms, with no fade. Reduced motion: it only fades.
- A row: 12px and 16px of padding, a bordered 34px tile with a 16px icon, 12px
  before a 14px medium title with a 12px description in
  `--harmo-color-text-secondary` 8px under it. Hovered or focused, the tile fills
  with `--harmo-color-primary-fill`, in 200ms, and the description darkens. On a
  screen 30rem wide or narrower, where a row may wrap, it has more room between
  its lines and less around them.
- Vertical: 16px triggers in a full-width row, and panels that grow in place, in
  200ms and close in 150ms. Reduced motion: at once.
- Right-to-left, the panel opens at the menu's left end and the rows slide the
  other way.

## Accessibility

- It's the disclosure pattern: triggers are buttons with `aria-expanded` that show
  a list of links, not a `role="menu"`, so it's read as navigation and the links
  work as links.
- Each panel follows its trigger in the page, so the order matches what you see.
  A closed panel's links are out of the Tab order and hidden from screen readers.
- Enter or Space opens a panel; Tab moves into its links and on to the next
  trigger, closing it; Escape closes it and returns focus to its trigger, and
  leaves anything around the menu, such as a dialog, open.
- While the keyboard is in the open item, the pointer leaves it alone, so focus
  isn't lost. A closed panel is `inert` at once, while it fades.
- Choosing a link closes the panel and returns focus to its trigger, so focus
  isn't lost if the page stays. A click with a modifier key, to open a new tab,
  leaves it open.
- On a touch screen, a tap opens a panel and a second closes it.
- The current page is marked by more than its color: a link by its weight, and
  a row by the line around it.
- A row's name is its title and description together; keep them short.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded="true"` on the trigger, no `inert` on its panel, and `data-open` on the nav; on close, undo them | Open: the pointer enters a trigger, unless the keyboard is in the open item or the trigger is disabled, or on a click or Enter |
| Close | The pointer leaves the menu, unless a click opened the panel or the keyboard is in it; a click on a panel's own trigger, once a click has opened it; a press outside; Escape, which is prevented, so what's around the menu stays open; focus leaving the panel's item; choosing a link, without a modifier key; the [Popup](popup.md) around it closing. A vertical menu closes only on a click on its trigger, or with its Popup |
| Keep a panel the pointer opened when its trigger is clicked | On that click |
| Set `--hnavigation-menu-width` and `--hnavigation-menu-height` on the nav to the size of the open panel's `.hnavigation-menu-rows`, and `--hnavigation-menu-shift` to how far, in px, the panel has to move to stay 8px inside the window | When a panel opens, and as its rows or the window change size, unless `data-orientation="vertical"` |
| `data-position="before"` or `"after"` on the other panels, by where their triggers are | When a panel opens, unless `data-orientation="vertical"` |
| `data-moving` on the nav, which animates the frame and the rows | When moving from one trigger to another, until a panel next opens from closed, so a move finishes as it fades |
| Return focus to the trigger | On Escape or choosing a link, if focus was in the menu |

The playground's example script, `examples/html/src/scripts/navigation-menu.js`,
does this.

## React

`<NavigationMenu>` renders it, and does all of this. Its children are
`<NavigationMenuLink>`s and `<NavigationMenuItem>`s, which hold
`<NavigationMenuRow>`s. Other props are the element's attributes: the `<nav>`'s,
the `<a>`'s, or the trigger's. Links go through `HarmoProvider`'s `linkComponent`.

| Prop | Effect |
| --- | --- |
| `aria-label` | `NavigationMenu`: its name, such as "Main" |
| `orientation` | `NavigationMenu`: `"vertical"` |
| `align` | `NavigationMenu`: `"start"` |
| `href` | `NavigationMenuLink`, `NavigationMenuRow`: where it goes |
| `current` | `NavigationMenuLink`, `NavigationMenuRow`: the page you're on |
| `label` | `NavigationMenuItem`: the trigger's text. `NavigationMenuRow`: its title |
| `description` | `NavigationMenuRow`: under the title |
| `icon` | `NavigationMenuRow`: the icon, such as an `<svg className="hicon">` |

```tsx
<NavigationMenu aria-label="Main">
  <NavigationMenuLink href="/product">Product</NavigationMenuLink>
  <NavigationMenuItem label="Solutions">
    <NavigationMenuRow
      href="/solutions/commerce"
      icon={<CommerceIcon className="hicon" />}
      label="Commerce"
      description="Drive sales and convert chats"
    />
  </NavigationMenuItem>
</NavigationMenu>
```

## Tokens

`--harmo-font-family`, `--harmo-font-size-base`, `--harmo-font-size-sm`,
`--harmo-font-size-2xs`, `--harmo-font-weight-normal`,
`--harmo-font-weight-medium`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-primary`,
`--harmo-color-primary-tint`, `--harmo-color-primary-fill`,
`--harmo-color-on-primary`,
`--harmo-color-background`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-border-radius`, `--harmo-border-radius-sm`,
`--harmo-border-radius-full`, `--harmo-box-shadow-sm`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-ease-in-out-cubic`; Expand Chevron's.
