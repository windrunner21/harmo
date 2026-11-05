# Link

Navigation, inside text or on its own. For an action, use a
[Button](button.md); for a link that looks like a button, use `.hbutton` on the
`<a>`.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `link.css`; `chevron.css` or `chevron-to-arrow.css` for an icon |
| Element | `<a class="hlink" href="…">` |
| Parts | None; an optional direct `.hicon` after the text |
| Required | `href` |
| Unique | None |
| Script | None |

## Markup

```html
<a class="hlink" href="/docs">documentation</a>

<p>Read the <a class="hlink" data-underlined href="/docs">documentation</a> first.</p>

<a class="hlink" href="/settings">
  Settings
  <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
  </svg>
</a>
```

For an arrow that appears on hover, use a [ChevronToArrow](chevron-to-arrow.md)
in place of the static chevron.

## Options

| Hook | Effect |
| --- | --- |
| A direct `.hicon` | `inline-flex`, with `--harmo-icon-gap` (6px) between the text and the icon |
| `data-underlined` | Underlined, 0.2em below the text, for links in running text; off by default |
| `data-visited` | Visited links turn `--harmo-link-visited-color-text` (dark purple), without a color transition; off by default |

## Appearance and states

- Inherits the surrounding font, in `--harmo-link-color-text` (purple).
- Hover (hover devices) and press: `--harmo-link-hover-color-text` and
  `--harmo-link-active-color-text` (both the text color), over 150ms
  (`--harmo-duration-fast`). `--harmo-link-hover-text-decoration` (`none`)
  set to `underline` also underlines a link on hover, as the mono accent does,
  whose links already have the text color.
- With an icon, the link stays on the text's baseline, so put icons after the
  text; an icon first would sit slightly high.
- Focus: the standard ring (`--harmo-focus-outline`, 2px offset).

## Accessibility

Links with an icon and breadcrumb links are identifiable without an underline,
but inside a sentence color is the only cue, and purple is 2.03:1 against body
text: below what WCAG 1.4.1 asks (an underline, or 3:1 plus a hover cue). Put
`data-underlined` on links in running text to meet it; standalone and icon
links can stay ununderlined. Visited links look unvisited unless the link
carries `data-visited`.

## What a script does

None.

## React

`<Link>` renders the link, through `HarmoProvider`'s `linkComponent` (an `<a>`
by default). Put an icon after the text, as a child. Other props are the
link's attributes; `href` is required.

| Prop | Effect |
| --- | --- |
| `underlined` | Adds the underline, for a link in running text |
| `visited` | Turns it dark purple once its page is in the browser's history |

```tsx
<p>
  Read the{" "}
  <Link underlined href="/help/unsubscribes">
    unsubscribe policy
  </Link>{" "}
  for the details.
</p>
```

## Tokens

`--harmo-duration-fast`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-icon-gap`,
`--harmo-link-active-color-text`, `--harmo-link-color-text`,
`--harmo-link-hover-color-text`, `--harmo-link-hover-text-decoration`,
`--harmo-link-visited-color-text`.
