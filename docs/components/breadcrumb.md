# Breadcrumb

A navigation trail ending at the current page. For a single link back, use a
[Link](link.md) with a ChevronToArrow.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `breadcrumb.css`, `link.css`, `chevron.css` |
| Element | `<nav class="hbreadcrumb">` around an `<ol>` |
| Parts | `.hbreadcrumb-separator` (with `.hchevron`) before every item after the first; `.hlink` for links |
| Required | An `aria-label` on the nav, in the page's language, such as "Breadcrumb"; `aria-current="page"` on the last item; `aria-hidden="true"` and `focusable="false"` on separators |
| Unique | None |
| Script | None |

## Markup

```html
<nav class="hbreadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a class="hlink" href="/settings">Settings</a></li>
    <li>
      <svg class="hbreadcrumb-separator hchevron" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
      </svg>
      <a class="hlink" href="/settings/users">Users</a>
    </li>
    <li>
      <svg class="hbreadcrumb-separator hchevron" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
      </svg>
      <span aria-current="page">Jane Smith</span>
    </li>
  </ol>
</nav>
```

## Appearance and states

- 14px medium text that wraps onto more lines when space runs out; a long item
  wraps within itself.
- A separator in the first item is hidden.
- Separators are `1.125em` in `--harmo-color-text-secondary`, with
  `--harmo-icon-gap` (6px) between them and the text. In right-to-left text
  they point left.
- Links look like [Link](link.md) and turn `--harmo-color-text` (black) on
  hover; the current page is `--harmo-color-text`.

## Accessibility

- A `<nav>` with `aria-label="Breadcrumb"` holding an ordered list, so screen
  readers announce the trail and its length.
- The last item is marked `aria-current="page"`.
- Separators are `aria-hidden`, so they aren't read between items.

## What a script does

None.

## React

`<Breadcrumb>` renders this markup from its children, one item each, in
order: it adds the separators and marks the last item as the current page.
Name it with `aria-label`, which is required, such as "Breadcrumb". Other
props are the `<nav>`'s attributes.

```tsx
<Breadcrumb aria-label="Breadcrumb">
  <Link href="/settings">Settings</Link>
  <Link href="/settings/users">Users</Link>
  Jane Smith
</Breadcrumb>
```

## Tokens

`--harmo-color-text`, `--harmo-color-text-secondary`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-sm`,
`--harmo-font-weight-medium`, `--harmo-icon-gap`, plus [Link](link.md)'s.
