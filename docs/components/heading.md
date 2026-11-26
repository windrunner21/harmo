# Heading

A page's title, and the headings of its parts outside [Prose](prose.md), on
the golden-ratio scale: a title, such as "Orders" over a page, and headings,
such as "Today" and "This week" over its parts. A heading is the size of
Prose's `h2`, on the same line, so one beside Prose looks the same.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `heading.css` |
| Element | `<h1 class="htitle">` for a page's title; `<h2 class="hheading">`, or `h3` to `h6`, for the headings of its parts |
| Parts | None |
| Required | Heading levels in order: the title the page's `h1`, its parts' headings under it |
| Unique | One title on a page |
| Script | None |

## Markup

```html
<h1 class="htitle">Orders</h1>

<h2 class="hheading">Today</h2>
<p>12 orders to pack, and 3 to deliver before noon.</p>
```

## Options

None. For a larger, display title, such as a home page's, set its size to
`--harmo-font-size-2xl`, 54px, and its line to match.

## Appearance and states

- A title: 33px, `--harmo-font-size-xl`, on a 42px line, semibold, in
  `--harmo-color-text`.
- A heading: 20px, `--harmo-font-size-lg`, on a 26px line, semibold, in
  `--harmo-color-text`: the size of Prose's `h2`, on the same line.
- In Harmo's font, `--harmo-font-family`. Prose's headings take the font of
  the text around them, so with [base.css](../../README.md#html-and-css), or
  your `body` in `--harmo-font-family`, the two look the same.
- No margin: the page spaces them, as it does its other parts. Over its
  text, a heading sits 6px from it, as in Prose.

## Accessibility

- They're headings: screen readers list them, and move from one to the next.
  The title is the page's `h1`; each part's heading a level under it, in
  order, without skipping one.
- Only their look is Harmo's. A heading's level is the page's outline, so
  choose it by where the heading sits, not by its size.

## What a script does

None.

## React

`<Title>` renders an `h1`, and `<Heading>` an `h2`, or with `as`, `h3` to
`h6`. Their props are the heading's attributes.

```tsx
<Title>Orders</Title>

<Heading>Today</Heading>
<Heading as="h3">Morning deliveries</Heading>
```

## Tokens

`--harmo-color-text`, `--harmo-font-family`, `--harmo-font-size-lg`,
`--harmo-font-size-xl`, `--harmo-font-weight-semibold`.
