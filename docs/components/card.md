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
| Parts | None, or, in this order: `<span class="hcard-icon" aria-hidden="true">` around an icon, an `<svg>` or an `<img>`; `.hcard-title`; `<p class="hcard-description">`; a [ChevronToArrow](chevron-to-arrow.md) with `hcard-chevron`. Each but the title is optional |
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

## Options

| Hook | Effect |
| --- | --- |
| Default | Tinted: `--harmo-color-background-secondary`, with no border |
| `data-variant="raised"` | `--harmo-color-background`, a 1px `--harmo-color-border` border, and `--harmo-box-shadow-sm` |
| `data-variant="ghost"` | No background; on a link or button card, `--harmo-color-background-hover` on hover |
| `--harmo-card-padding` | The padding, 16px by default; set it on a card for a tighter one |
| `.hcard-title` inside | Lays out the parts in a grid: the icon, the title and description, and the chevron |

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
- On the tint, and on a hovered ghost card, use secondary text or darker:
  tertiary text is 4.4:1 there, below WCAG AA.
- With parts: the icon is a 40px tile with the 8px corners and a 24px icon in
  `--harmo-color-primary`, at the start and at the top, 16px before the
  title. The tile is `--harmo-color-background-secondary`, or on a tinted
  card, `--harmo-color-background`, so it stays a tile; its transparent
  border is drawn in forced colors.
- The title: 16px medium, in `--harmo-color-primary` in a card that's a link
  or a button, as a link's text is, and in `--harmo-color-text` otherwise.
  The description: 14px in `--harmo-color-text-secondary`, 4px under it.
- The chevron: in `--harmo-color-text-secondary` at the end, centered, 16px
  after the text. It turns into an arrow while the card is hovered or
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
| `icon` | The icon, such as an `<svg className="hicon">`, in its tile |
| `description` | The description |
| `chevron` | A ChevronToArrow at the end |

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

For a card that's a button, put `className="hcard"` on a `<button>`.

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-card-padding`,
`--harmo-color-background`, `--harmo-color-background-hover`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-color-primary`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-size-base`, `--harmo-font-size-sm`,
`--harmo-font-weight-medium`; ChevronToArrow's, for the chevron.
