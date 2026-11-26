# Card

A frame around a group of content: a tinted panel on the page, a raised item
such as a card on a board, or a ghost row that leads somewhere, such as a link
to a settings page. It frames, and lays nothing out: what's inside keeps its
own layout. Given a title, it lays out its parts: an icon at the start, the
title and a description beside it, and a chevron at the end, as in a list of
settings pages or help links.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `card.css`; `chevron-to-arrow.css` for a chevron |
| Element | Any block element with `class="hcard"`, such as `<div>`, `<section>`, or `<article>`; `<a class="hcard" href="…">` or `<button class="hcard" type="button">` for a card that leads somewhere |
| Parts | None, or, in this order: `<span class="hcard-icon" aria-hidden="true">` around an icon, an `<svg>` or an `<img>`; `.hcard-title`; `<span class="hcard-meta">`, a detail at the end of the title row, such as a date; `<p class="hcard-description">`; a [ChevronToArrow](chevron-to-arrow.md) with `hcard-chevron`. Each but the title is optional |
| Required | `type` on a `<button>`. The title is a heading, a `<p>`, or a `<span>`; in a `<button>` card, a `<span>`, and the description too, since a button holds only phrasing content |
| Unique | None |
| Script | None |

## Markup

```html
<div class="hcard">
  <p>Your trial ends in 12 days. Add a payment method to keep your campaigns running.</p>
</div>

<article class="hcard" data-variant="raised">
  <p>Refund not received</p>
  <span class="htag">Billing</span>
</article>

<nav aria-label="Settings">
  <a class="hcard" data-variant="ghost" href="/settings/team">Team members</a>
  <a class="hcard" data-variant="ghost" href="/settings/billing">Billing</a>
</nav>
```

With parts:

```html
<nav aria-label="Settings">
  <a class="hcard" data-variant="ghost" href="/settings/security">
    <span class="hcard-icon" aria-hidden="true">
      <svg class="hicon" …>…</svg>
    </span>
    <h3 class="hcard-title">Security</h3>
    <p class="hcard-description">Two-step verification, and the devices signed in to your account.</p>
  </a>
</nav>

<a class="hcard" data-variant="ghost" href="/contact">
  <p class="hcard-title">Talk to us</p>
  <p class="hcard-description">Questions about plans or setup? We're glad to help.</p>
  <svg class="hicon hchevron-to-arrow hcard-chevron" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g class="hchevron-to-arrow-head">
      <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" />
      <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" />
    </g>
    <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" />
  </svg>
</a>
```

A ghost card keeps its padding, so the frame a hover shows has room. In a
list, that padding adds to the space above the first row and below the last.
Pulling the list up and down by the cards' padding and their 1px border puts
the first and last rows' text where other content would start and end, while
their frames line up with the sides of what's around them:

```html
<nav aria-label="Settings" style="margin-block: calc(-1px - var(--harmo-card-padding))">
  <a class="hcard" data-variant="ghost" href="/settings/team">Team members</a>
  <a class="hcard" data-variant="ghost" href="/settings/billing">Billing</a>
</nav>
```

The first row's frame then reaches 17px above the list's place, by default,
so leave at least that much room above it, as a Section's gap under its
header does.

A detail at the end of the title row, such as a role's years or a post's
date, goes in `.hcard-meta`, after the title. On a card that's a link, it
sits before the chevron. A line that leads to another site can end in an
arrow, with [Link](link.md)'s `.hexternal`:

```html
<a class="hcard" data-variant="ghost" href="https://example.com/golden-spacing">
  <p class="hcard-title">Spacing on the golden ratio</p>
  <span class="hcard-meta"><time datetime="2026-10-02">Oct 2</time></span>
  <p class="hcard-description"><span class="hexternal">On example.com</span></p>
</a>
```

## Options

| Hook | Effect |
| --- | --- |
| Default | Tinted: `--harmo-color-background-secondary`, with no border |
| `data-variant="raised"` | `--harmo-color-background`, a 1px `--harmo-color-border` border, and `--harmo-box-shadow-sm` |
| `data-variant="ghost"` | No background; on a link or button card, `--harmo-color-background-hover` on hover |
| `--harmo-card-padding` | The padding: `--harmo-space-sm`, 16px, by default; set it on a card for a tighter one. Built on `:root`, so a section that changes `--harmo-space-sm` redeclares it there too |
| `.hcard-title` inside | Lays out the parts in a grid: the icon, the title and description, the detail at the title row's end, and the chevron |

## Appearance and states

- 8px radius and 16px padding. Every variant has a 1px border, transparent
  unless raised, so all three are the same size, and forced-colors mode, which
  drops backgrounds, still draws the frame.
- The first and last child's own block margins are removed, since the card's
  padding spaces its content.
- A link or button card is a block that reads like its content: no underline,
  the text color around it, and a button fills its row. Focus shows the usual
  focus ring.
- A ghost link or button card fades to the hover background in 150ms on
  devices that hover. The others don't change on hover.
- Pressed, any link or button card is a step darker, fading in 150ms, so a
  tap on a touch screen shows before the next page loads:
  `--harmo-color-background-active` on a tinted or ghost card, and
  `--harmo-color-background-hover` on a raised one, as a pressed secondary
  Button is.
- On the tint, and on a hovered ghost card, tertiary text is 4.6:1, just over
  WCAG AA's 4.5:1: use it or darker, never anything lighter.
- With parts: the icon is a 40px tile with the 8px corners and a 24px icon in
  `--harmo-color-primary`, at the start and at the top, 16px
  (`--harmo-space-sm`) before the title. The tile is `--harmo-color-background-secondary`, or on a tinted
  card, `--harmo-color-background`, so it stays a tile; its transparent
  border is drawn in forced colors.
- The title: 16px medium, in `--harmo-color-primary` in a card that's a link
  or a button, as a link's text is, and in `--harmo-color-text` otherwise.
  The description: 14px in `--harmo-color-text-secondary`, 6px
  (`--harmo-space-2xs`) under it.
- The detail: 14px in `--harmo-color-text-secondary`, on the title's line at
  the row's end, 16px after the title, its digits even, so dates in a list
  line up; the description runs under the title and it. It's on one line,
  unless the card's too narrow, when it wraps, at most half the row, rather
  than push the chevron out.
- The chevron: in `--harmo-color-text-secondary` at the end, centered, 16px
  (`--harmo-space-sm`) after the text. It turns into an arrow while the card is hovered or
  focused, as a ChevronToArrow does in any link or button.
- A part left out leaves no room. A long word or address in the title or
  description breaks rather than running into the chevron. Right-to-left,
  the icon is at the right and the chevron, at the left, points left.

## Accessibility

- A card is only a frame: give a group a heading, or a `<section>` with a name,
  where it needs one, as without a card.
- A card that leads somewhere is a native link or button, so its whole content
  is its name. Keep that content short, such as a title and one line, since a
  screen reader reads all of it.
- A title that's a heading lets someone moving through a page's headings find
  each card, as on a settings page; in a list of links, such as help links, a
  `<p>` is enough.
- The icon and the chevron are hidden from screen readers.

## What a script does

None.

## React

`<Card>` renders a `<div>`, or with `href`, a link through the app's link
component, as [Button](button.md) does. Other props are the element's
attributes.

| Prop | Effect |
| --- | --- |
| `variant` | `raised` or `ghost` |
| `href` | Renders a link |
| `label` | The title; with it, the card renders its parts rather than its children. A label that draws nothing, such as `false` or `[]`, isn't one |
| `labelAs` | The title's element: `"h3"` by default, or `"h2"` to `"h6"`, or `"p"` where it's no heading |
| `icon` | The icon, such as an `<svg className="hicon">`, in its tile; needs `label` |
| `description` | The description; needs `label` |
| `meta` | A detail at the end of the title row, such as a date; needs `label` |
| `chevron` | A ChevronToArrow at the end; needs `label` |

```tsx
<Card>
  <p>Your trial ends in 12 days.</p>
</Card>

<Card variant="ghost" href="/settings/team">
  Team members
</Card>

<Card
  variant="ghost"
  href="/settings/security"
  icon={<LockIcon className="hicon" />}
  label="Security"
  description="Two-step verification, and the devices signed in to your account."
/>

<Card variant="ghost" href="/contact" label="Talk to us" labelAs="p" description="Questions about plans or setup? We're glad to help." chevron />
```

For a card that's a button, put `className="hcard"` on a `<button>`; for an
`<article>` or a `<section>`, put it on that element.

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-card-padding`,
`--harmo-color-background`, `--harmo-color-background-active`,
`--harmo-color-background-hover`, `--harmo-color-background-secondary`,
`--harmo-color-border`, `--harmo-color-primary`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-base`,
`--harmo-font-size-sm`, `--harmo-font-weight-medium`, `--harmo-space-2xs`,
`--harmo-space-sm`; ChevronToArrow's, for the chevron.
