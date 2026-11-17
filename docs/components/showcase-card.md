# Showcase Card

A card that shows where it leads before it's opened, such as a post in a
product's news, a template, or a customer's story: what it leads to, small or
as an image, on a dashed grid, then its title, what it's about, and an action
line, such as "Read more". The whole card is one link. For a row that leads to a
page of settings, with an icon rather than a picture, use a
[Card](card.md#markup) that's a link.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `showcase-card.css`; `chevron-to-arrow.css` for the action line |
| Element | `<a class="hshowcase-card" href="…">` |
| Parts | `.hshowcase-card-media`, with `aria-hidden="true"` and `inert`; `.hshowcase-card-body`, holding `.hshowcase-card-title` and `.hshowcase-card-description`; `.hshowcase-card-action`, with `aria-hidden="true"`, holding its words and a ChevronToArrow |
| Required | `href`; a title, which with the description names the link |
| Unique | Nothing |
| Script | None |

## Markup

```html
<a class="hshowcase-card" href="/news/scheduled-messages">
  <div class="hshowcase-card-media" aria-hidden="true" inert>
    <img src="/news/scheduled-messages.png" alt="" />
  </div>
  <div class="hshowcase-card-body">
    <h3 class="hshowcase-card-title">Messages that go out on time</h3>
    <p class="hshowcase-card-description">Schedule a reply for later, and it's sent when you chose, even while you're away.</p>
  </div>
  <span class="hshowcase-card-action" aria-hidden="true">
    Read more
    <svg class="hicon hchevron-to-arrow" …>…</svg>
  </span>
</a>
```

The media holds anything that shows where the card leads: an image, which
fills it, as above, or something small drawn there, such as a few Harmo
components. It's inside the link, so
nothing in it can be a control: `inert` keeps anything in it from being
reached, and `aria-hidden` keeps it from being read. The `…` is
[ChevronToArrow](chevron-to-arrow.md#markup)'s icon.

For a gallery, put the cards in a list:

```html
<ul role="list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr)); gap: var(--harmo-space-sm); margin: 0; padding: 0; list-style: none">
  <li><a class="hshowcase-card" href="/news/scheduled-messages">…</a></li>
  <li><a class="hshowcase-card" href="/news/saved-replies">…</a></li>
</ul>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-fold` on the card | Its top corner at the end folds over, as a page's corner turned down |
| `--hshowcase-card-fold-color` on the card | What shows where the folded corner was: `--harmo-color-background` by default, the page's. Set it to the surface the card sits on, if that's another |
| `<img>`, `<picture>`, or `<video>` in the media | Fills it, cropped to its shape |
| No `.hshowcase-card-action` | No action line; the card still lifts its front |

## Appearance and states

- A 1px `--harmo-color-border` frame with 8px corners, on
  `--harmo-color-background`.
- The media is a golden rectangle, 1.618 times as wide as it's tall, in
  `--harmo-color-background-secondary`, with a dashed grid of three rows and
  four columns of 1px `--harmo-color-border` lines, 2px dashes 2px apart.
  What it holds is centered, and clipped at its edges.
- Under it, 26px (`--harmo-space-md`) above and below and 16px
  (`--harmo-space-sm`) at the sides: the title, 20px medium in
  `--harmo-color-text`, then 6px (`--harmo-space-2xs`) under it the
  description, 14px in `--harmo-color-text-secondary`.
- The action line: 14px medium in `--harmo-color-primary`, its words then a
  ChevronToArrow at their size, 2px apart, so the arrow lands 6px from them.
- Hover or keyboard focus, on a device that can hover, with motion welcome:
  the media's content lifts 12px, the front 36px, and the action line comes
  up 24px into the room it leaves, fading in. Up in 200ms
  (`--harmo-duration-normal`), back down in 150ms (`--harmo-duration-fast`),
  easing in and out (`--harmo-ease-in-out-cubic`), as things moving between
  two places on screen do. The card itself stays still, so the pointer never
  slips off it.
- The action line's chevron stays a chevron while the card is hovered, and
  turns into an arrow once the line itself is: pointing at the line is
  pointing at the way on. It takes `--harmo-color-primary-hover` then.
  Keyboard focus shows the arrow.
- Keyboard focus: the standard ring around the card.
- On a touch screen, nothing lifts, and the action line is in place under the
  description from the start. With reduced motion asked for, nothing moves
  either: the line has its place under the description, and fades in there.
- The fold: a 42px (`--harmo-space-lg`) square at the top end, cut along its
  diagonal by a 1px crease, with the surface behind on the outside and the
  card's color on the flap, and a 1px frame on its two inner sides. In a
  right-to-left page, it's at the top left.

## Accessibility

- The card is one link, named by its text: the title, then the description.
  The media and the action line are hidden from screen readers, as they
  repeat what the link says, and the media is `inert`, so Tab never stops
  inside it.
- Make the title a heading where the cards are a section's items, such as an
  `<h3>` under the gallery's `<h2>`, so moving through headings finds each
  one; or a `<p>` where they aren't.
- A gallery is a list, so a screen reader says how many there are.
- The lift only shows what the card already says, so a device that can't
  hover, or reduced motion, loses nothing.

## What a script does

None.

## React

`<ShowcaseCard>` renders the link, with the router's link component from
[HarmoProvider](../../packages/react/README.md#use), its media, body, and
action line. Other props are the link's attributes.

| Prop | Effect |
| --- | --- |
| `href` | Required. Where it leads |
| `label` | Required. The title |
| `labelAs` | The title's tag: `"h3"` by default, or `"h2"` to `"h6"`, or `"p"` |
| `description` | What it's for, under the title |
| `media` | What the media holds: an image, or something small drawn there |
| `action` | The action line's words, such as `"Read more"`. Without it, there's no line |
| `fold` | `true` folds the top corner at the end over |

```tsx
<ShowcaseCard
  href="/news/scheduled-messages"
  media={<img src="/news/scheduled-messages.png" alt="" />}
  label="Messages that go out on time"
  description="Schedule a reply for later, and it's sent when you chose, even while you're away."
  action="Read more"
/>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-color-primary`, `--harmo-color-primary-hover`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-in-out-cubic`,
`--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`, `--harmo-font-size-lg`,
`--harmo-font-size-sm`, `--harmo-font-weight-medium`, `--harmo-space-2xs`,
`--harmo-space-lg`, `--harmo-space-md`, `--harmo-space-sm`,
`--harmo-space-xs`.
