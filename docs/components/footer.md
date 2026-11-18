# Footer

The foot of a site's or an app's pages: its brand, groups of links, and a
bottom row for the copyright and the small print, as wide as the page's
content, as a [Header](header.md)'s row is. Wider than 640px, the groups sit
side by side; 640px wide or less, each folds, as an
[Accordion](accordion.md) item does, so a phone shows their headings first.
The [Footers pattern](../patterns/footers.md) puts it together for a site,
a newsletter, and a sign-in page.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `footer.css`, `expand-chevron.css` |
| Element | `<footer class="hfooter">` |
| Parts | `<div class="hfooter-main">` holding an optional `.hfooter-brand`, with the logo's link first, and `<nav class="hfooter-groups">` of groups: each `<details class="hfooter-group">` holding `<summary class="hfooter-summary">`, with `<h2 class="hfooter-heading">` and an [Expand Chevron](expand-chevron.md), then `<ul class="hfooter-links">` of `<a class="hfooter-link">`s. Then an optional `<div class="hfooter-bottom">`, which can hold `<ul class="hfooter-bottom-links">` |
| Required | A name for the groups' nav, such as `aria-label="Footer"`; the logo link's name, from its text or its image's `alt` |
| Unique | None |
| Script | Required, to keep the groups open while they're side by side; see [What a script does](#what-a-script-does) |

## Markup

```html
<footer class="hfooter">
  <div class="hfooter-main">
    <div class="hfooter-brand">
      <a href="/"><img src="/logo.svg" alt="" width="20" height="20" />Speedwagon</a>
      <p>Fresh produce, delivered the morning after it's picked.</p>
    </div>
    <nav class="hfooter-groups" aria-label="Footer">
      <details class="hfooter-group">
        <summary class="hfooter-summary">
          <h2 class="hfooter-heading">Shop</h2>
          …an Expand Chevron…
        </summary>
        <ul class="hfooter-links">
          <li><a class="hfooter-link" href="/offers">This week's offers</a></li>
        </ul>
      </details>
    </nav>
  </div>
  <div class="hfooter-bottom">
    <p>© 2026 Speedwagon Ltd.</p>
    <ul class="hfooter-bottom-links">
      <li><a class="hfooter-link" href="/privacy">Privacy</a></li>
    </ul>
  </div>
</footer>
```

A group's heading is an `<h2>` inside its summary, so a screen reader can go
from heading to heading at every width. A link can start with an icon, such
as a social network's, `.hicon`. Without a brand or groups, a Footer is its
bottom row alone, as for an app or a sign-in page.

## Options

| Hook | Effect |
| --- | --- |
| `--hfooter-width` | The row's width: 75rem (1200px), as a Header's |

## Appearance and states

- A 1px line in `--harmo-color-border` along its top, on
  `--harmo-color-background`, its text 14px in
  `--harmo-color-text-secondary`.
- The brand and the groups are 42px (`--harmo-space-lg`) from its top and
  from the bottom row, in a row at most 1200px wide, centered, 16px in. The
  brand takes at least 240px, its logo 15px semibold as a Header's, and
  what's under it 16px apart; the groups at least 480px, side by side, each
  at least 128px wide, 26px apart, wrapping under the brand where there's
  no room.
- A group's heading is 14px semibold in `--harmo-color-text`, 16px over its
  links, which are 10px apart; pointed at, a link takes
  `--harmo-color-text`. An icon before a link is 16px, 6px from it.
- 640px wide or less, its own width, as it's a size container: the groups
  stack under the brand, 16px below it, a line between them, each a row
  that folds, its heading 16px above and below, with an Expand Chevron at
  its end. A group opens in 200ms and closes in 150ms, as an Accordion item
  does; with reduced motion, at once.
- The bottom row: 13px, 26px above and below, its parts 26px apart and
  wrapping, under a line across the whole footer where the groups are
  above it, its content in line with theirs. Its small links are 16px
  apart.

## Accessibility

- A `<footer>` at the top level of the page is its contentinfo landmark;
  the groups are a navigation, named by its `aria-label`.
- Each group's heading is an `<h2>`, in its summary, at every width.
- Side by side, the groups are open, so a screen reader hears them as
  expanded, and their summaries are out of the Tab order, as there's
  nothing to open; their links are reached as usual. Folded, each summary
  is a control: a click, Enter, or Space opens it, and the browser says
  whether it's open.
- Before a script runs, the groups side by side still show their links,
  whether open or not.

## What a script does

| Change | When |
| --- | --- |
| Open each group, and take its summary out of the Tab order, `tabindex="-1"` | The footer is wider than 40rem, as its CSS measures, when the page loads and as it crosses that width |
| Close each group, and put its summary back in the Tab order | The footer is 40rem wide or less, when the page loads and as it crosses that width; a group opened since stays open until it crosses again |
| Prevent a click on a summary's default | The footer is wider than 40rem, so a group can't be closed there |

`examples/html/src/scripts/footer.js` is an example.

## React

`<Footer>` renders the footer, its `brand`, its children, the groups, in
their nav, and its `bottom` row, and keeps the groups open while it's wide.
Other props are the `<footer>`'s, except `aria-label`, which names the
groups' nav.

| Component | Effect |
| --- | --- |
| `Footer` | `aria-label`, the groups' name; `brand`, what goes in `.hfooter-brand`; `bottom`, what goes in `.hfooter-bottom` |
| `FooterGroup` | A group: `label`, its heading; `links`, each `{ label, href, icon? }` and any of a link's props, such as `target`, through `HarmoProvider`'s `linkComponent` |

```tsx
<Footer
  aria-label="Footer"
  brand={<a href="/">Speedwagon</a>}
  bottom={<p>© 2026 Speedwagon Ltd.</p>}
>
  <FooterGroup label="Shop" links={[{ label: "This week's offers", href: "/offers" }]} />
  <FooterGroup label="Company" links={[{ label: "About", href: "/about" }]} />
</Footer>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background`,
`--harmo-color-border`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-md`,
`--harmo-font-size-sm`, `--harmo-font-size-xs`,
`--harmo-font-weight-semibold`, `--harmo-space-2xs`, `--harmo-space-lg`,
`--harmo-space-md`, `--harmo-space-sm`, `--harmo-space-xs`
