# Tag List

Tags in one row that never wraps, such as a ticket's tags in a table: as
many as fit its width, then "+N" for the rest, which shows them in a
[Tooltip](tooltip.md) on hover and keyboard focus. A
[Combobox](combobox.md) choosing several holds its choices in one.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tag-list.css`, `tag.css`, `tooltip.css` |
| Element | `<ul class="htag-list">`, each [Tag](tag.md) in an `<li>` |
| Parts | `.htag-list-more`, the last `<li>`, holding a [Tooltip](tooltip.md) trigger: a `<button class="htag-list-count" type="button">` for "+N", and a `data-variant="hint"` tooltip holding `.htag-list-rest`, with the hidden tags |
| Required | `aria-label` on `.htag-list-count`, in the app's language, such as "2 more", and `aria-describedby` naming the tooltip |
| Unique | The tooltip's `id` |
| Script | Required: counting what fits; see [What a script does](#what-a-script-does) |

## Markup

```html
<ul class="htag-list">
  <li>
    <span class="htag" style="--htag-color: var(--harmo-amber)">
      <span class="htag-dot" aria-hidden="true"></span>Billing
    </span>
  </li>
  <li><span class="htag">Refund</span></li>
  <li hidden><span class="htag">Partner</span></li>
  <li hidden><span class="htag">Urgent</span></li>
  <li class="htag-list-more">
    <span class="htooltip-trigger">
      <button class="htag-list-count" type="button" aria-label="2 more"
        aria-describedby="ticket-tags-more">+2</button>
      <span class="htooltip" data-variant="hint" role="tooltip" id="ticket-tags-more">
        <span class="htag-list-rest">
          <span class="htag">Partner</span>
          <span class="htag">Urgent</span>
        </span>
      </span>
    </span>
  </li>
</ul>
```

That's the list once counted. As the page loads, every tag shows, and
`.htag-list-more` is `hidden`, with an empty button and an empty
`.htag-list-rest`, until the script counts.

## Options

| Hook | Effect |
| --- | --- |
| `hidden` on a tag's `<li>` | Hidden, counted into "+N" |
| `hidden` on `.htag-list-more` | No "+N", while every tag fits |

## Appearance and states

- One row, 4px between tags, filling its container's width; a tag never
  wraps its text here. In a table, give the column a width: a cell sized by
  its content fits every tag.
- "+N" looks like a Tag filled in `--harmo-color-background-secondary`, 13px
  `--harmo-color-text-secondary` text, with the standard focus ring.
- Its tooltip is the white hint card, the hidden tags in a column 4px apart.
  Remove buttons in them are hidden: a tooltip holds nothing to press.
- Where even the first tag doesn't fit beside "+N", only "+N" shows.

## Accessibility

- It's a list, so a screen reader says how many tags it shows.
- "+N" is a button, so the keyboard reaches it and its tooltip; its name is
  yours, such as "2 more", and its description is the hidden tags, read after
  it. Pressing it pins the tooltip open (`data-open` on its trigger), for a
  touch screen, which neither hovers nor shows keyboard focus, until it's
  pressed again, a press lands elsewhere, Escape, or focus leaves.
- The tooltip follows [Tooltip](tooltip.md): it shows on hover and keyboard
  focus, the pointer can move onto it, and Escape hides it.

## What a script does

| Change | When |
| --- | --- |
| Show each tag to measure it, then hide those past the room left for "+N", with `hidden` on their `<li>`; show `.htag-list-more` with "+N" and its `aria-label`, and copies of the hidden tags in `.htag-list-rest`, with a space between them, so they're read apart. With every tag fitting, hide `.htag-list-more` | On load, and when the list, its container, or a tag changes size, such as when a font loads, or tags come, go, or change |
| Add `data-open` to the tooltip's trigger; remove it | On a press of "+N"; on a press of it again, a press elsewhere, Escape, or focus leaving it |
| Scroll a tag wholly into view | When focus comes to something in it, in a row that scrolls, as in a Combobox |

Measure "+N" with the most digits it could show, so the count it ends up
with fits. `examples/html/src/scripts/tag-list.js` is an example script for
it, with `tooltip.js` for Escape.

## React

`<TagList>` renders the list, counts what fits, and keeps counting. Its
children are [Tag](tag.md#react)s. Other props are the `<ul>`'s attributes.

| Prop | Effect |
| --- | --- |
| `moreLabel` | Required: names "+N" from the count, in your app's language, such as ``(count) => `${count} more` `` |

```tsx
<TagList moreLabel={(count) => `${count} more`}>
  <Tag color="var(--harmo-amber)">Billing</Tag>
  <Tag>Refund</Tag>
  <Tag>Partner</Tag>
</TagList>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background-secondary`,
`--harmo-color-border`, `--harmo-color-text-secondary`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-xs`,
and those of Tag and Tooltip.
