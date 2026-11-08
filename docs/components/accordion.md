# Accordion

Items that each show or hide their content, such as questions and their
answers, or the parts of a ticket's details: one open at a time, or several.
Each item is a native `<details>` with its `<summary>`, so opening and closing
need no script: a click, Enter, or Space toggles it, and the browser tells
screen readers whether it's open. Items that share a `name` open one at a
time. One item on its own is a panel to show or hide, such as options most
people leave alone.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `accordion.css`, `expand-chevron.css` |
| Element | `<details class="haccordion-item">` holding `<summary class="haccordion-summary">` and `<div class="haccordion-content">`; for several, a `<div class="haccordion">` around them |
| Parts | In the summary, `.haccordion-label` with the label, then an [Expand Chevron](expand-chevron.md) |
| Required | A label in each summary |
| Unique | One `name` for each group whose items open one at a time |
| Script | None |

## Markup

```html
<div class="haccordion">
  <details class="haccordion-item" name="billing-questions">
    <summary class="haccordion-summary">
      <span class="haccordion-label">How am I billed?</span>
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
        <g class="hexpand-chevron-head">
          <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
          <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
        </g>
      </svg>
    </summary>
    <div class="haccordion-content">
      <p>Each month, for the conversations your team handled that month.</p>
    </div>
  </details>
  …
</div>
```

The content can be anything, such as text, a list, or controls. Its first
child's top margin and its last child's bottom margin are taken away, so a
paragraph sits as close to the summary as plain text does.

## Options

| Hook | Effect |
| --- | --- |
| `name` on each item of a group | One open at a time: opening one closes the one that was open. Without it, each opens on its own |
| `open` on an item | Open, such as from the start |
| `.haccordion` around the items | A line between the items that are shown; without it, an item stands alone |
| `data-size="small"` on `.haccordion`, or on an item | Small: 14px summary text with 8px above and below it, and 13px content with 8px under it, for a panel beside other things, such as help next to a message box |

## Appearance and states

- The summary: the label, 16px medium in `--harmo-color-text`, with 16px
  above and below it, and the chevron at its end in
  `--harmo-color-text-secondary`, folding up while the item is open. A long
  label wraps; the whole row is clickable.
- The content: 14px `--harmo-color-text-secondary`, with 16px under it.
- A 1px `--harmo-color-border` line between items in `.haccordion`.
- Keyboard focus on a summary: the focus ring, with small corners.
- Opening, the content grows to its height in 200ms; closing, it shrinks in
  150ms, both with `--harmo-ease-out-cubic`, as a grid row animates from
  `0fr` to `1fr` on `::details-content`. Safari grows it as it opens, and
  may close it at once. Reduced motion: it opens and closes at once.
- The content shows as soon as the item opens, so Tab reaches what's inside
  while it grows; closing, it stays shown until it has shrunk.
- The box that clips the growing content reaches 4px past the item on each
  side and 8px up into the summary's padding, so the focus ring of a control
  inside isn't cut off, even one that sits a little above the content, as a
  Switch beside its label does. A click there still goes to the summary.
- A closed item is only its summary.

## Accessibility

- The `<summary>` is the control: the browser makes it focusable, toggles it
  with Enter and Space, and tells screen readers whether it's expanded. Its
  name is its label; the chevron is hidden from them.
- A heading inside `<summary>` is valid HTML, but screen readers don't all
  announce it as a heading, so someone jumping between headings may skip the
  questions of a long list. Where that matters, give the list a heading of
  its own, or use a heading with a button for each item instead, as the
  WAI-ARIA accordion pattern does.
- In Chrome and Firefox, finding text on the page opens a closed item that
  holds it.
- Opening an item doesn't move focus.

## What a script does

None. `examples/html` has no script for it.

## React

`<Accordion>` renders `.haccordion`, and `<AccordionItem>` an item, with the
summary and the chevron. An `<AccordionItem>` works on its own, too. An
item's content starts afresh: an `<AccordionItem>` inside it isn't in the
outer group, and an `<Accordion exclusive>` inside it makes a group of its
own. Other props are the `<div>`'s, or the `<details>`'s, attributes.

| Prop | Effect |
| --- | --- |
| `exclusive` on `Accordion` | One item open at a time: its items share a generated `name` |
| `size="small"` on `Accordion` or `AccordionItem` | Small, as `data-size="small"` |
| `label` on `AccordionItem` | Required: the summary's text |
| `defaultOpen` | Open from the start; read once, as the item first renders |
| `open` | Open; a change opens or closes it. The item also opens and closes itself, as `<details>` does, and tells `onOpenChange` |
| `onOpenChange` | Called with whether it's open, after each opening or closing of this item, not of one inside it |
| `name` | Groups it with other items by hand, rather than by `exclusive` |

```tsx
<Accordion exclusive>
  <AccordionItem label="How am I billed?">
    <p>Each month, for the conversations your team handled that month.</p>
  </AccordionItem>
  <AccordionItem label="Can I change my plan later?">
    <p>Yes, at any time, in Settings under Plans.</p>
  </AccordionItem>
</Accordion>

<AccordionItem label="Advanced options">…</AccordionItem>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-border`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-base`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-font-weight-medium`; Expand Chevron's.
