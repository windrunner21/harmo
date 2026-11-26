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
| Parts | `<div class="hfooter-main">` holding an optional `.hfooter-brand`, with the logo's link first, and `<nav class="hfooter-groups">` of groups: each `<details class="hfooter-group">` holding `<summary class="hfooter-summary">`, with `<h2 class="hfooter-heading">` and an [Expand Chevron](expand-chevron.md), then `<ul class="hfooter-links">` of `<a class="hfooter-link">`s. Then an optional `<div class="hfooter-bottom">`, which can hold `<ul class="hfooter-bottom-links">` and a [Language Picker](language-picker.md) |
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

A group's heading is an `<h2>` inside its summary, at every width; see
[Accessibility](#accessibility) for how screen readers take it. Don't give
the groups a `name`: a browser keeps only one `<details>` of a name open, so
side by side, opening one would close the rest. A link can start with an
icon, such as a social network's, `.hicon`. Without a brand or groups, a
Footer is its bottom row alone, as for an app or a sign-in page.

## Options

| Hook | Effect |
| --- | --- |
| `--hfooter-width` | The row's width: `--harmo-page-width`, 75rem (1200px), as a Header's, padded by `--harmo-page-padding`, 16px |

## Appearance and states

- A 1px line in `--harmo-color-border` along its top, on
  `--harmo-color-background`, its text 14px in
  `--harmo-color-text-secondary`.
- The brand and the groups are 42px (`--harmo-space-lg`) from its top and
  from the bottom row, in a row at most 1200px wide, centered, 16px in. The
  brand takes at least 240px, its logo 15px semibold as a Header's, and
  what's under it 16px apart; the groups at least 480px, side by side, each
  at least 128px wide, 26px apart, wrapping under the brand where there's
  no room. Its own rules for the brand's link and lines are one class,
  (0,1,0), so a class of yours on one restyles it.
- A group's heading is 14px semibold in `--harmo-color-text`, 16px over its
  links, which are 10px apart; pointed at, a link takes
  `--harmo-color-text`. An icon before a link is 16px, 6px from it.
- 640px wide or less, its own width, as it's a size container: the groups
  stack under the brand, 16px below it, a line between them, each a row
  that folds, its heading 16px above and below, with an Expand Chevron at
  its end. A group opens in 200ms and closes in 150ms, as an Accordion item
  does; with reduced motion, at once.
- The bottom row: 13px, 26px above and below, its parts 26px apart and
  wrapping, its last part at its end, under a line across the whole footer
  where the groups are above it, its content in line with theirs. Its
  small links are 16px apart.
- A [Language Picker](language-picker.md) in the bottom row reads as the
  small print does, at the row's end: its words in the row's 13px and
  color, its globe 16px and 6px from them, with no padding or fill, so it
  ends where the row does. Pointed at, or open, it takes
  `--harmo-color-text`. With regions, it shows the region and the language,
  such as "United Kingdom (English)". Give it `side="top"`, or
  `data-preferred-side="top"` on its popup, so its list opens above it, as
  at the foot of a page there's seldom room below.

## Keep the footer at the bottom

On a short page, a Footer follows the page's content, so it can end above
the window's foot. It can't stay at the bottom by itself, since that's its
parent's layout: make `body` a column at least as tall as the window, and let
the main content take the room that's left.

```css
body {
  display: flex;
  flex-direction: column;
  min-block-size: 100svh;
}

main {
  flex-grow: 1;
}

.page {
  box-sizing: border-box;
  inline-size: 100%;
  max-inline-size: var(--harmo-page-width);
  margin-inline: auto;
  padding-inline: var(--harmo-page-padding);
}
```

In a flex column, an element centered with `margin-inline: auto` shrinks to
its content's width, so a centered page wrapper such as `.page` also needs
`inline-size: 100%`. `base.css` leaves this out, since a body laid out as a
column would change an app's own layout.

## Accessibility

- A `<footer>` at the top level of the page is its contentinfo landmark;
  the groups are a navigation, named by its `aria-label`.
- Each group's heading is an `<h2>`, in its summary, at every width. A
  heading inside `<summary>` is valid HTML, but screen readers don't all
  announce it as a heading, as with an [Accordion](accordion.md#accessibility),
  so someone jumping between headings may skip the groups; the navigation's
  name still leads to them.
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
| Open each group, and take its summary out of the Tab order, `tabindex="-1"` | `--hfooter-layout` on `.hfooter-groups` is `wide`: the CSS sets it from the container query that lays the groups out, wider than 40rem, so the script follows the same width. When the page loads, as it changes, and for a group added later |
| Close each group, and put its summary back in the Tab order | `--hfooter-layout` is `folded`, 40rem wide or less, when the page loads, as it changes, and for a group added later; a group opened since stays open until it changes again |
| Prevent a click on a summary's default | `--hfooter-layout` is `wide`, so a group can't be closed there |

`examples/html/src/scripts/footer.js` is an example.

## React

`<Footer>` renders the footer, its `brand`, its children, the groups, in
their nav, and its `bottom` row, each only when it renders something, so no
groups means no nav; and keeps the groups open while it's wide, those added
later too. Other props are the `<footer>`'s, except `aria-label`, which
names the groups' nav: give it one whenever there are groups.

| Component | Effect |
| --- | --- |
| `Footer` | `aria-label`, the groups' name; `brand`, what goes in `.hfooter-brand`; `bottom`, what goes in `.hfooter-bottom` |
| `FooterGroup` | A group: `label`, its heading; `links`, each `{ label, href, icon? }` and any of a link's props, such as `target`, through `HarmoProvider`'s `linkComponent`. Its other props are the `<details>`'s, except `name` |

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
`--harmo-color-border`, `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-duration-fast`, `--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-md`,
`--harmo-font-size-sm`, `--harmo-font-size-xs`,
`--harmo-font-weight-semibold`, `--harmo-page-padding`, `--harmo-page-width`,
`--harmo-space-2xs`, `--harmo-space-lg`, `--harmo-space-md`,
`--harmo-space-sm`, `--harmo-space-xs`.
