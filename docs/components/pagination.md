# Pagination

Moves through a list shown a page at a time, such as a table's rows or a
blog's posts: Previous and Next, and the page numbers between them if you
show them. Each is a link where the page is in the URL, or a button where
your app holds it.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `pagination.css`, `button.css`, `chevron.css` |
| Element | `<nav class="hpagination">` |
| Parts | Previous and Next as `.hbutton`s with `data-variant="secondary"` and a `.hchevron`; between them, optionally, `<ul class="hpagination-pages">` holding a `<li>` around each `.hpagination-page`, a link or a button, and `<li class="hpagination-ellipsis" aria-hidden="true">` where pages are left out |
| Required | An `aria-label` on the nav, in the page's language, such as "Pages"; an `aria-label` on each page, such as "Page 5"; `aria-current="page"` on the page you're on |
| Unique | None |
| Script | Only to ignore a disabled Previous or Next, as for a [Button](button.md); without one, following it reloads the page you're on |

## Markup

Links, on page 5 of 12:

```html
<nav class="hpagination" aria-label="Pages">
  <a class="hbutton" data-variant="secondary" href="?page=4" rel="prev">
    <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
    </svg>
    <span class="hbutton-label">Previous</span>
  </a>
  <ul class="hpagination-pages">
    <li><a class="hpagination-page" href="?page=1" aria-label="Page 1">1</a></li>
    <li class="hpagination-ellipsis" aria-hidden="true">…</li>
    <li><a class="hpagination-page" href="?page=4" aria-label="Page 4">4</a></li>
    <li><a class="hpagination-page" href="?page=5" aria-label="Page 5" aria-current="page">5</a></li>
    <li><a class="hpagination-page" href="?page=6" aria-label="Page 6">6</a></li>
    <li class="hpagination-ellipsis" aria-hidden="true">…</li>
    <li><a class="hpagination-page" href="?page=12" aria-label="Page 12">12</a></li>
  </ul>
  <a class="hbutton" data-variant="secondary" href="?page=6" rel="next">
    <span class="hbutton-label">Next</span>
    <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
    </svg>
  </a>
</nav>
```

Which numbers to show is your app's: the first and last pages, and the one
you're on with one either side, with an ellipsis for each run of two or more
pages left out. So there are always seven, and the row keeps its width as
you move through it, up to 999 pages; with seven pages or fewer, show them
all. Leave the
list out for Previous and Next only.

On the first page, Previous stays in its place, disabled with
`aria-disabled="true"` and linking to the page you're on, without `rel`, so
focus stays on it; on the last page, so does Next. A script ignores a click
on it; without one, following it reloads the page you're on. Hide the whole
nav when there's only one page.

Where your app holds the page rather than the URL, such as in a dialog, use
buttons:

```html
<nav class="hpagination" aria-label="Pages">
  <button class="hbutton" data-variant="secondary" type="button" aria-disabled="true">
    <svg class="hicon hchevron" data-direction="back" …>…</svg>
    <span class="hbutton-label">Previous</span>
  </button>
  <ul class="hpagination-pages">
    <li><button class="hpagination-page" type="button" aria-label="Page 1" aria-current="page">1</button></li>
    <li><button class="hpagination-page" type="button" aria-label="Page 2">2</button></li>
    <li><button class="hpagination-page" type="button" aria-label="Page 3">3</button></li>
  </ul>
  <button class="hbutton" data-variant="secondary" type="button">
    <span class="hbutton-label">Next</span>
    <svg class="hicon hchevron" …>…</svg>
  </button>
</nav>
```

Text beside it, such as "11–20 of 115 results", "Page 2 of 12", or a "Rows
per page" Select, is your app's. Put the page in a `role="status"` that's in the page from the start,
so a screen reader hears it change.

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="page"` on a page | The page you're on |
| `aria-disabled="true"` on Previous or Next | Disabled in place, on the first or last page |

## Appearance and states

- Previous and Next: secondary [Buttons](button.md), with a chevron pointing
  toward the start or the end of the line.
- Pages: 34px squares, as tall as a control, 4px apart, 8px from Previous
  and Next. 14px numbers in `--harmo-color-text-secondary`, of one width
  each; numbers up to 999 fit the square, so the row doesn't shift, and a
  longer one widens its square. Hovered, `--harmo-color-text` on
  `--harmo-color-background-hover`; pressed, they shrink slightly, as a
  Button does.
- The page you're on: `--harmo-color-primary` on
  `--harmo-color-primary-tint`, with a 1px `--harmo-color-primary` line just
  inside its edge, so it's told apart without its color, and in
  forced-colors mode. Focused, the focus ring takes the line's place.
- An ellipsis: as wide as a page, in `--harmo-color-text-secondary`.
- On a screen 30rem wide or narrower, such as a phone's, the numbers hide,
  leaving Previous and Next. In a container too narrow for them, Previous,
  the numbers, and Next wrap, and so do the numbers themselves.
- Right-to-left, the first page is on the right, and Previous and Next point
  in the reading direction.

## Accessibility

- A `<nav>` with its own name, such as "Pages", so it's found among the
  page's landmarks, apart from the main navigation.
- Each page is named for what it is, such as "Page 5", where a screen
  reader would read only "5". The name contains the number shown, so a voice
  command such as "click 5" still finds it.
- `aria-current="page"` says which page you're on, and the line around it
  shows it as well as its color.
- The ellipses are hidden from screen readers: the numbers on either side
  say what's left out.
- A disabled Previous or Next stays focusable, so focus isn't lost when you
  reach the first or last page.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| Ignore activation | While Previous or Next has `aria-disabled="true"` |

Your app or its router renders the page you're on, and the numbers around
it.

The playground's example script, `examples/html/src/scripts/pagination.js`,
stands in for that: a click moves the page rather than leave the page, and
a disabled Previous or Next ignores clicks.

## React

`<Pagination>` renders the nav, the numbers it works out for you, and
Previous and Next, disabled at either end. Other props are the `<nav>`'s
attributes. It has no `"use client"` of its own, so a server component can
render it and pass `href` and `pageLabel` as functions; `onPageChange` needs
a client component.

| Prop | Effect |
| --- | --- |
| `aria-label` | The nav's name, such as "Pages" |
| `page` | The page you're on, from 1 to `pageCount`. Keep it in range, such as going back to the first page when the count shrinks: outside it, no page is current |
| `pageCount` | How many pages there are |
| `href` | A page's URL, such as ``(page) => `?page=${page}` ``; links through `HarmoProvider`'s `linkComponent` (an `<a>` by default) |
| `onPageChange` | Called with the page chosen. Without `href`, they're buttons; with it, a plain click calls this instead of following the link, and a click with a modifier key, such as to open a new tab, is still the browser's |
| `numbered` | Shows the page numbers |
| `pageLabel` | With `numbered`, each page's name, such as ``(page) => `Page ${page}` `` |
| `previousLabel`, `nextLabel` | Previous's and Next's text |

```tsx
<Pagination
  aria-label="Pages"
  page={page}
  pageCount={12}
  href={(page) => `?page=${page}`}
  numbered
  pageLabel={(page) => `Page ${page}`}
  previousLabel="Previous"
  nextLabel="Next"
/>

<Pagination
  aria-label="Pages"
  page={page}
  pageCount={pageCount}
  onPageChange={setPage}
  previousLabel="Previous"
  nextLabel="Next"
/>
```

## Tokens

`--harmo-control-height`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-button-font-weight`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-background-hover`,
`--harmo-color-primary`, `--harmo-color-primary-tint`,
`--harmo-border-radius`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-button-duration`,
`--harmo-ease-out-quad`; Button's, for Previous and Next.
