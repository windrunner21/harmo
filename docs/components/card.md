# Card

A frame around a group of content: a tinted panel on the page, a raised item
such as a card on a board, or a ghost row that leads somewhere, such as a link
to a settings page. It frames, and lays nothing out: what's inside keeps its
own layout.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `card.css` |
| Element | Any block element with `class="hcard"`, such as `<div>`, `<section>`, or `<article>`; `<a class="hcard" href="…">` or `<button class="hcard" type="button">` for a card that leads somewhere |
| Parts | None; the content is the app's |
| Required | `type` on a `<button>` |
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

## Options

| Hook | Effect |
| --- | --- |
| Default | Tinted: `--harmo-color-background-secondary`, with no border |
| `data-variant="raised"` | `--harmo-color-background`, a 1px `--harmo-color-border` border, and `--harmo-box-shadow-sm` |
| `data-variant="ghost"` | No background; on a link or button card, `--harmo-color-background-hover` on hover |
| `--harmo-card-padding` | The padding, 16px by default; set it on a card for a tighter one |

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

## Accessibility

- A card is only a frame: give a group a heading, or a `<section>` with a name,
  where it needs one, as without a card.
- A card that leads somewhere is a native link or button, so its whole content
  is its name. Keep that content short, such as a title and one line, since a
  screen reader reads all of it.

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

```tsx
<Card>
  <p>Your trial ends in 12 days.</p>
</Card>

<Card variant="ghost" href="/settings/team">
  Team members
</Card>
```

For a card that's a button, put `className="hcard"` on a `<button>`.

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-card-padding`,
`--harmo-color-background`, `--harmo-color-background-hover`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-duration-fast`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`.
