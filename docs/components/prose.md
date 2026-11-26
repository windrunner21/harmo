# Prose

Formatted text, such as an assistant's reply, a note, help, or a blog post:
paragraphs, headings, lists, quotes, code, links, tables, and images, spaced
to read, at the size of the text around it. What a Markdown renderer makes fits inside, its plain
elements styled as Harmo's.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `prose.css`; `link.css` for a `.hlink` inside |
| Element | `<div class="hprose">` |
| Parts | `<p>`, `<h2>` to `<h4>`, `<ul>`, `<ol>`, `<blockquote>`, `<pre><code>`, `<hr>`, `<table>`, `<img>`, and `<figure>` with `<figcaption>`, and in a line `<strong>`, `<em>`, `<code>`, and `<a>`. A wide table goes in `<div class="hprose-table" role="region" aria-label="…" tabindex="0">` |
| Required | None |
| Unique | None |
| Script | None, unless it builds the markup from text; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hprose">
  <p>Your weekly report is ready. <strong>3 of 5 checks passed</strong>:</p>
  <ul>
    <li>Replies took 4 minutes on average, down from 6.</li>
  </ul>
  <p>Read the <a href="/reports/42">full report</a>, or run <code>export --week</code>:</p>
  <pre><code>npx reports export --week 2026-46</code></pre>
</div>
```

A table stays a table, so screen readers keep reading its rows and columns.
A wide one goes in `.hprose-table`, which scrolls sideways rather than the
page. Give it a name, `aria-label` or `aria-labelledby`, `role="region"`, and
`tabindex="0"`, so the keyboard can reach and scroll it. A Markdown renderer
that lets you swap the element for a table can add the wrapper itself:

```html
<div class="hprose-table" role="region" aria-label="Delivery windows" tabindex="0">
  <table>
    <thead>
      <tr><th>Area</th><th>Days</th><th>Order by</th></tr>
    </thead>
    <tbody>
      <tr><td>City center</td><td>Every day</td><td>8 PM the day before</td></tr>
    </tbody>
  </table>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `--hprose-line-height` | Its line height: 1.625 by default, 26px for 16px text. In a [Conversation](conversation.md), it takes the conversation's instead, whatever it's set to, so a reply's lines match the rest of the chat |

## Appearance and states

- The text is the size of what's around it, on its own line height, 1.625,
  26px for 16px text, unless `--hprose-line-height` says otherwise, so it reads the same however
  its container is set, in `--harmo-color-text`; a long word or address
  breaks rather than widening it.
- Its spacing is the golden-ratio scale's steps in em, so it grows and
  shrinks with the text: blocks are 1em apart; a heading is 1.625em of the
  text from what's above it and 0.375em from what's under it, so it sits with
  the part it heads; list items are 0.375em apart. At 16px text, that's 16px,
  26px, 6px, and 6px. The em is always the text's, worked out once on
  `.hprose`, so a block with a smaller size of its own, such as a block of
  code, is spaced the same.
- Headings are semibold, each on Prose's own line, `1lh`, which follows
  `--hprose-line-height`: `<h2>` 1.25 times the text, `<h3>` 1.125, `<h4>`
  the same size. At 16px text, an `<h2>` is 20px on a 26px line.
- Lists are indented 1.5em. Bold is semibold.
- A quote is set 10px in from a 2px line in `--harmo-color-border`, in
  `--harmo-color-text-secondary`. A rule is a 1px line, with 1.625em above
  and below.
- Code in a line is in `--harmo-font-family-mono`, at 0.875 times the text, on
  `--harmo-color-background-secondary` with 4px corners. A block of code is
  13px monospace in a panel on the same color, with a 1px border, 8px
  corners, and 10px by 16px of padding; it scrolls sideways rather than
  wrapping.
- A table looks as a [Table](table.md) does, from the same rules: as wide
  as the text, 14px rows in `--harmo-color-text-secondary`, padded 12px by
  16px, with a line in `--harmo-color-border` above each, and 12px medium
  header cells on one line. Unlike a Table's, its cells wrap, as a Markdown
  table's can hold sentences, its words whole, and each column at least
  6em, so it never shrinks to a word a line. In `.hprose-table`, it scrolls
  sideways only when its columns still can't fit; focused, the region has
  the standard ring. A Table inside keeps its own look.
- An image is as wide as the text at most, never stretched, with 8px
  corners: one as Markdown places it, in a paragraph, a list item, a
  figure, a quote, a cell, or a link, so a component's, such as an
  [Avatar](avatar.md)'s, keeps its own shape. In a `<figure>`, it's a block,
  its `<figcaption>` 6px under it, 0.875 times the text, in
  `--harmo-color-text-secondary`.
- A plain `<a>` looks as an underlined [Link](link.md) does, hover and focus
  included.

## Accessibility

- Use the heading levels that fit the page: under a page's `<h1>` and a
  section's `<h2>`, a reply's headings start at `<h3>`.
- Links are underlined, so color isn't the only thing that marks them, and
  their words should say where they go.
- A block of code can scroll sideways; it's text, so a screen reader reads it
  as it is.
- Text from elsewhere, such as an AI service's reply, is untrusted: build it
  as elements, or sanitize the HTML a Markdown renderer makes, and never add
  it with `innerHTML` as it comes.
- A table keeps its rows and columns for screen readers. A wide one's
  region, `.hprose-table`, is named and takes focus, so the keyboard can
  scroll it, and screen readers announce it by its name.
- An image's `alt` says what it shows; a decorative one has `alt=""`.

## What a script does

None for markup you write. To show text as it comes, such as an AI service's
reply, your script builds the elements from it, setting `textContent`, as
[chat.js](../../examples/html/src/scripts/chat.js) does, or runs a Markdown
renderer and sanitizes what it makes.

## React

`<Prose>` renders the div, around what you give it. With `text`, it formats a
small part of Markdown itself, building elements, never HTML:

| In `text` | Becomes |
| --- | --- |
| Blank lines between paragraphs; a line break in one | `<p>`, and `<br>` |
| Lines starting with `-`, `*`, or `•`; or with `1.` | `<ul>`, or `<ol>` from that number |
| Lines between two lines of three backticks | `<pre><code>`; a block still being written, without its last line, is a block too |
| `**bold**` | `<strong>` |
| `` `code` `` | `<code>` |
| `[text](address)`, or an address written out | A [Link](link.md), underlined, opening in a new tab. Only `http`, `https`, and `mailto` addresses become links |

Anything else shows as it's written. For more, such as tables and images,
render the text with your Markdown library, sanitize what it makes, and put
that inside `<Prose>`. `<ProseTable>` renders a wide table's region, with
`role="region"` and `tabIndex={0}`: TypeScript requires its name, with
`aria-label` or `aria-labelledby`. Put the table in it. `prosePlainText(text)` gives the text without its marks, such as
for a screen reader's live region.

| Prop | Effect |
| --- | --- |
| `text` | Formats this text, rather than showing the children |

```tsx
<Prose text={reply} />

<Prose>
  <h3>Returns</h3>
  <p>You can return anything within 30 days.</p>
</Prose>

<Prose>
  <ProseTable aria-label="Delivery windows">
    <table>…</table>
  </ProseTable>
</Prose>
```

## Tokens

`--harmo-border-radius`, `--harmo-border-radius-sm`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-color-text`, `--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-family-mono`, `--harmo-font-line-height`,
`--harmo-font-size-2xs`, `--harmo-font-size-sm`, `--harmo-font-size-xs`,
`--harmo-font-weight-medium`, `--harmo-font-weight-normal`,
`--harmo-font-weight-semibold`, `--harmo-link-color-text`,
`--harmo-link-hover-color-text`, `--harmo-space-sm`, `--harmo-space-xs`.
