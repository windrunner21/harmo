# Menu Button

Three bars that turn into a cross while it's expanded, for opening a site's menu
on a phone. It's a [Button](button.md), and it opens whatever you point it at,
such as a [Popup](popup.md) holding a vertical
[Navigation Menu](navigation-menu.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `menu-button.css`, `button.css`; `popup.css` to open a Popup |
| Element | `<button class="hbutton hmenu-button" type="button">` |
| Parts | `<svg class="hicon hmenu-button-bars">` holding `<line>`s `.hmenu-button-top`, `.hmenu-button-middle`, and `.hmenu-button-bottom` |
| Required | `aria-label`, in the page's language, such as "Menu"; `aria-expanded`; `aria-hidden="true"` and `focusable="false"` on the svg |
| Unique | The `id` and anchor name of a Popup it opens |
| Script | Keep `aria-expanded` current; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton hmenu-button" data-variant="secondary" data-size="small" type="button" aria-label="Menu" aria-expanded="false" popovertarget="site-menu" style="anchor-name: --site-menu">
  <svg class="hicon hmenu-button-bars" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <line class="hmenu-button-top" x1="3" y1="5" x2="17" y2="5" />
    <line class="hmenu-button-middle" x1="3" y1="10" x2="17" y2="10" />
    <line class="hmenu-button-bottom" x1="3" y1="15" x2="17" y2="15" />
  </svg>
</button>
<div class="hpopup" id="site-menu" popover style="position-anchor: --site-menu">…</div>
```

What it opens has to leave it showing, so its cross can close it. A
[Popup](popup.md) does, or your own sheet below the header; a
[Drawer](drawer.md) covers it, and has its own close button.

## Options

| Hook | Effect |
| --- | --- |
| `aria-expanded="true"` | The bars turn into a cross |
| `data-variant`, `data-size` | Button's; usually `secondary` and `small` |

## Appearance and states

- It's an icon-only [Button](button.md), with 16px bars 2px thick, 5px apart.
- Expanded: the top and bottom bars move to the middle and turn 45 degrees, and
  the middle one fades, in 200ms. Reduced motion: at once.

## Accessibility

- It has one name, such as "Menu", and `aria-expanded` says whether it's open, so
  the name doesn't change with the bars.
- The bars are hidden from screen readers.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` | As what it opens opens and closes |

The playground's `examples/html/src/scripts/popup.js` does this for a Popup.

## React

`<MenuButton>` renders it. Other props are the `<button>`'s. Inside a
[Popup](popup.md)'s `trigger`, the Popup keeps it current.

| Prop | Effect |
| --- | --- |
| `aria-label` | Its name, such as "Menu" |
| `open` | Whether what it opens is open |
| `onOpenChange` | Called with the new state on a press, with `open` |
| `variant`, `size` | Button's: `secondary` and `small` by default |

```tsx
<Popup trigger={<MenuButton aria-label="Menu" />}>
  <NavigationMenu aria-label="Main" orientation="vertical">…</NavigationMenu>
</Popup>

<MenuButton aria-label="Menu" open={open} onOpenChange={setOpen} />
```

## Tokens

`--harmo-duration-normal`, `--harmo-ease-in-out-cubic`; Button's.
