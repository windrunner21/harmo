# Table of Contents

The headings of a long page, beside it, with the one you've reached marked. It stays
in view as the page scrolls.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `table-of-contents.css` |
| Element | `<nav class="htoc">` with a name from `aria-label` |
| Parts | `<span class="htoc-marker" aria-hidden="true">`, then `<ul class="htoc-list" role="list">`, and in each `<li class="htoc-item">` an `<a class="htoc-link">` to a heading's `id` |
| Required | A name for the list, and an `id` on each heading it links to |
| Unique | Each heading's `id` |
| Script | To mark the current section. See [What a script does](#what-a-script-does) |

## Markup

```html
<nav class="htoc" aria-label="On this page">
  <span class="htoc-marker" aria-hidden="true"></span>
  <ul class="htoc-list" role="list">
    <li class="htoc-item"><a class="htoc-link" href="#overview" aria-current="location">Overview</a></li>
    <li class="htoc-item"><a class="htoc-link" href="#milestones">Milestones</a></li>
    <li class="htoc-item" data-level="2"><a class="htoc-link" href="#first-release">First release</a></li>
  </ul>
</nav>
```

Put it beside the page's content in a flex row, so that it can stick and go to its
side. Keeping it before the content in the markup suits either side, as it's where
the keyboard reaches it.

## Options

| Attribute | On | Effect |
| --- | --- | --- |
| `aria-current="location"` | `.htoc-link` | Marks the section you've reached, in `--harmo-color-primary` |
| `data-side="end"` | `.htoc` | Puts it after the content in a flex row, with its line on the edge that faces the content. Without it, it comes first |
| `data-level` | `.htoc-item` | `2` or `3`: indents a heading under another |
| `--htoc-width` | `.htoc` | Its width; the default is 11rem |
| `--htoc-max-height` | `.htoc` | The most it can grow to. The default fits the window; in a scrolling box, set it to the box's height |
| `--htoc-top` | `.htoc` | How far from the top it sticks; the default is `--harmo-space-sm`. Add a sticky header's height |

## Appearance and states

- A 1px `--harmo-color-border` line down the edge that faces the content, which
  each link draws its own piece of. An accent marker slides along it to the current
  link over 200ms (`--harmo-duration-normal`), with `--harmo-ease-in-out-cubic`, as
  a Tab's indicator does. It's placed at once as the page loads, and moves at once
  with reduced motion. Until a script has placed it, the current link colors its
  own piece of the line instead.
- Following a link inside a scrolling box glides there; with reduced motion it's
  at once. On the page itself, the browser's own jump is used: give `html`
  `scroll-behavior: smooth`, inside `@media (prefers-reduced-motion: no-preference)`,
  for it to glide too.
- Links are `--harmo-color-text-secondary`, and `--harmo-color-text` on hover.
- It sticks to the top of what's scrolling, and scrolls itself if it's taller than
  the screen, keeping the current link in view.
- A focus ring sits inside the link, so that the list's scrolling can't clip it.
- In forced colors, the marker is the system's `Highlight`.

## Accessibility

- Name it, such as "On this page", so that it can be told apart from the page's other
  navigation.
- `aria-current="location"` tells screen readers which section is current.
- `role="list"` keeps it a list in Safari, which stops treating one without bullets as
  a list.
- Links are ordinary links to `#id`, so they work without a script. Give headings
  `scroll-margin-top` if something sticky would cover them.

## What a script does

| Change | When |
| --- | --- |
| `aria-current="location"` on the link to the last heading above the top of the view | As it scrolls or resizes, or the content's height changes |
| `aria-current` on the last link | The end of the scrolling is reached, as a short last section can't reach the top |
| `aria-current` on a link that's followed with a plain click, until you next scroll with a wheel, a touch, or a key | A link is followed |
| Scrolling only the box to its heading, smoothly unless motion is reduced, and adding it to the address, in place of the browser's own jump, which would scroll the page too | A link is followed to a heading in a scrolling box |
| `aria-current` on the link to the address's `#id` | The page opens with one, or it changes with Back or Forward |
| The list's `scrollTop`, to keep the current link in view | The current link changes |
| `--htoc-marker-y` and `--htoc-marker-size` on `.htoc`, from the current link's `offsetTop` and `offsetHeight`, and `data-ready` once it's first placed | The current link changes, or the list's size does |

`examples/html/src/scripts/table-of-contents.js` is an example script, which reads
a sticky header's height from `data-example-offset`.

## React

`<TableOfContents>` renders this and does the above. It follows the window, or the
nearest element that scrolls around the headings. Headings are tracked in the order
they come on the page, whatever the order of `items`.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required. The list's name |
| `items` | Each has an `id`, the id of its heading, a `label`, and an optional `level` of 1, 2, or 3 |
| `offset` | How many pixels a sticky header covers at the top |
| `side` | `start`, the default, or `end`: which side of a flex row it goes to |

```tsx
<TableOfContents
  aria-label="On this page"
  offset={64}
  items={[
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Milestones" },
    { id: "first-release", label: "First release", level: 2 },
  ]}
/>
```

## Tokens

`--harmo-space-2xs`, `--harmo-space-xs`, `--harmo-space-sm`, `--harmo-space-md`,
`--harmo-color-border`, `--harmo-color-primary`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-duration-fast`, `--harmo-focus-outline`.
