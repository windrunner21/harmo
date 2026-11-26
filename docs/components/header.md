# Header

The bar across the top of a page or an app: a logo, navigation or search, and
actions, in a row as wide as the page's content. It stays at the top as the
page scrolls, frosted, with a hairline once the page has scrolled; or it
scrolls away; or it moves away with the page as you scroll down, and comes
back as you scroll up.
The [Headers pattern](../patterns/headers.md) puts it together for a site, an
app, and a sign-in page.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `header.css`; the CSS of what's in it, such as `navigation-menu.css` and `button.css` |
| Element | `<header class="hheader">` |
| Parts | `<div class="hheader-bar">` holding an optional `.hheader-brand` with the logo's link, then what goes in the middle, such as a [Navigation Menu](navigation-menu.md) or a [Command Menu](command-menu.md), then an optional `.hheader-actions`. In the link, an optional `.hheader-brand-name` holding a name and its `.hheader-brand-tagline`, a line of its own under it, such as a role |
| Required | A name for each navigation in it, such as `aria-label="Main"`; the logo link's name, from its text or its image's `alt` |
| Unique | None |
| Script | Required: to show the hairline once the page has scrolled, and, with `data-scroll="hide"`, to hide it; see [What a script does](#what-a-script-does) |

## Markup

```html
<header class="hheader">
  <div class="hheader-bar">
    <div class="hheader-brand">
      <a href="/"><img src="/logo.svg" alt="" width="20" height="20" />Speedwagon</a>
    </div>
    <nav class="hnavigation-menu" aria-label="Main">…</nav>
    <div class="hheader-actions">
      <a class="hbutton" href="/order"><span class="hbutton-label">Order now</span></a>
    </div>
  </div>
</header>
```

A name over a line of its own, such as a personal site's name and role,
beside a logo or without one. Keep a space between the name and the tagline
in the markup, so a screen reader names the link "Alex Kim Product
engineer", not "Alex KimProduct engineer"; laid out as a grid, the space
takes no room:

```html
<div class="hheader-brand">
  <a href="/">
    <span class="hheader-brand-name">Alex Kim <span class="hheader-brand-tagline">Product engineer</span></span>
  </a>
</div>
```

The brand's link is a plain link, or your framework's, such as Next.js's
`<Link>`, which renders one, or Harmo's [Link](link.md), which keeps the
brand's look there.

## Options

| Hook | Effect |
| --- | --- |
| `data-scroll="away"` | It scrolls away with the page, rather than staying at the top |
| `data-scroll="hide"` | It moves away with the page as you scroll down, and back as you scroll up |
| `data-transparent` | It's clear over what's under it until the page scrolls, as over a hero. Pull what's under it up by its height, 54px: `margin-block-start: -3.375rem` |
| `data-bordered` | Its hairline shows from the start, not only once the page has scrolled, as beside a [Sidebar](sidebar.md), whose edge meets it |
| `--hheader-width` | The row's width: `--harmo-page-width`, 75rem (1200px), which a page's own container can share; its sides are padded by `--harmo-page-padding`, 16px |
| `--hheader-height` | The row's height: 54px, its 34px controls (`--harmo-control-height`) with 10px (`--harmo-space-xs`) above and below |

## Appearance and states

- 54px tall: its 34px controls with 10px above and below. The row is at
  most 1200px wide, centered, with 16px (`--harmo-space-sm`) at its sides;
  its parts are 26px (`--harmo-space-md`) apart, and its actions 6px.
- Frosted: the page's background at 80%, over what scrolls under it, blurred
  12px. Where less transparency is asked for, it's solid; in forced-colors
  mode, `Canvas`.
- Once the page has scrolled, a 1px hairline in `--harmo-color-border` shows
  under it, over 200ms (`--harmo-duration-normal`); with `data-bordered`,
  it's there from the start.
- The logo is 15px semibold, its link with the focus ring. A tagline under
  the name is 13px, regular, in `--harmo-color-text-secondary`.
- Its own rules for the brand's link are one class, (0,1,0), so a class of
  yours on the link restyles it, as it comes after Harmo's, such as a
  tagline in a monospace font, or lowercase.
- With `data-scroll="hide"`, it follows the scroll: it moves up with the page
  as you scroll down, as far as its own height, and back as you scroll up,
  so nothing animates while you scroll. Where the scrolling stops partway,
  it settles to whichever is nearer: shown in 200ms
  (`--harmo-duration-normal`), or hidden in 150ms (`--harmo-duration-fast`),
  eased out. Near the top, it stays where the scroll put it. With reduced
  motion, nothing follows the scroll: it fades away as you scroll down past
  it, and back as you scroll up.
- A clear header turns frosted, its color and its blur together, over
  200ms.
- With `data-transparent`, it has no background or blur until the page
  scrolls.
- It's a size container, so what's in it can follow its width with container
  queries, as the Headers pattern's menu does.

## Accessibility

- A `<header>` at the top level of the page is its banner landmark. Name each
  navigation in it.
- Hidden, it stays in the Tab order: tabbing into it brings it back, so focus
  is never out of sight, and a popup or menu open from it, anything in it
  with `aria-expanded="true"`, keeps it in view.
- With reduced motion, it doesn't fade away or back for a wobble of 4px or
  less, as on a trackpad.
- It stays over the page, so give what a link jumps to `scroll-margin-top`
  of its height, or the target lands under it.

## What a script does

| Change | When |
| --- | --- |
| Find what it scrolls with: the nearest element around it that scrolls, or the window; the page's own scrolling is the window's even where `<html>` or `<body>` sets its overflow, as the document gets its scroll events | Once |
| Add `data-scrolled`, or remove it | That has scrolled, or is back at the top |
| With `data-scroll="hide"`, set its `translate` to `0 Ypx`, Y the distance scrolled, down taking it up and up bringing it back, from 0 to minus its height; take off `data-hidden` and `data-settling` first, starting from where it is | It scrolls, unless focus is in it or something in it is open and shown, a popup or anything with `aria-expanded="true"`, which shows it; a trigger left expanded in a closed panel doesn't count |
| Settle: add `data-settling="show"` and a `translate` of `0 0`, or `data-settling="hide"` and minus its height, whichever is nearer; near the top, where the scroll puts it, as a header that scrolls with the page | The scrolling stops: its `scrollend`, or 150ms without a scroll where that isn't fired |
| Take off `data-settling` and the `translate`, and add `data-hidden` if it's hidden | The settle's `transitionend` |
| Show it: take off `data-hidden`, `data-settling`, and the `translate` | Focus comes into it |
| With reduced motion, add `data-hidden`, or take it off; take off any `translate` and `data-settling` left from before it was turned on | You've scrolled down more than 4px past its height, or up more than 4px |
| Take off its `translate`, `data-settling`, and `data-hidden` | It stops hiding as you scroll, such as React's `scroll` changing |

`examples/html/src/scripts/header.js` is an example.

## React

`<Header>` renders the header and its row, and follows the scrolling. What it
holds goes in the middle; other props are the `<header>`'s.

| Prop | Effect |
| --- | --- |
| `brand` | The logo's link, at the start; for a name over a tagline, the same markup as in HTML, with `className` |
| `actions` | At the end |
| `scroll` | `"stay"`, the default; `"away"`; or `"hide"` |
| `transparent` | Clear until the page scrolls |
| `bordered` | Its hairline from the start |

```tsx
<Header brand={<a href="/">Speedwagon</a>} actions={<Button href="/order">Order now</Button>} scroll="hide">
  <NavigationMenu aria-label="Main">
    <NavigationMenuLink href="/shop">Shop</NavigationMenuLink>
  </NavigationMenu>
</Header>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background`,
`--harmo-color-border`, `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-control-height`, `--harmo-duration-fast`, `--harmo-duration-normal`,
`--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-md`,
`--harmo-font-size-xs`, `--harmo-font-weight-normal`,
`--harmo-font-weight-semibold`, `--harmo-page-padding`, `--harmo-page-width`,
`--harmo-space-2xs`, `--harmo-space-md`, `--harmo-space-xs`.
