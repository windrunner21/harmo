# Tag List

Tags in one row that never wraps, such as a ticket's tags in a table: as
many as fit its width, then "+N" for the rest, which shows them in a
[Tooltip](tooltip.md) on hover and keyboard focus. A
[Combobox](combobox.md) choosing several holds its choices in one.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tag-list.css`, `tag.css`, `tooltip.css` |
| Element | `<ul class="htag-list" role="list">`, each [Tag](tag.md) in an `<li>` |
| Parts | `.htag-list-more`, the last `<li>`, holding a [Tooltip](tooltip.md) trigger: a `<button class="htag-list-count" type="button">` for "+N", and a `data-variant="hint"` tooltip holding `.htag-list-rest`, with the hidden tags |
| Required | `aria-label` on `.htag-list-count`, in the app's language, such as "2 more", and `aria-describedby` naming the tooltip. The count's text is the app's too, such as "+2" |
| Unique | The tooltip's `id` |
| Script | Required: counting what fits; see [What a script does](#what-a-script-does) |

## Markup

```html
<ul class="htag-list" role="list">
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
`.htag-list-rest`, until the script counts. The copies in `.htag-list-rest`
have no remove buttons and no `id`s: they're only to look at.

## Options

| Hook | Effect |
| --- | --- |
| `hidden` on a tag's `<li>` | Hidden, counted into "+N" |
| `hidden` on `.htag-list-more` | No "+N", while every tag fits |

## Appearance and states

- One row, 6px (`--harmo-space-2xs`) between tags, filling its container's
  width; a tag never wraps its text here. In a table, give the column a
  width: a cell sized by its content fits every tag.
- Until it's counted, and while every tag fits, the row is cut at its end, so
  tags shown before the count, as on a page rendered on the server, don't run
  into what's beside it. It's cut 4px past its edges, where a focus ring
  reaches, in a browser that supports `overflow-clip-margin`, and at its edges
  in one that doesn't. While "+N" shows, nothing is cut.
- "+N" looks like a Tag filled in `--harmo-color-background-secondary`, 13px
  `--harmo-color-text-secondary` text, with the standard focus ring. Its text
  is the app's, such as "+2", "+٢" in Arabic digits, or "2 others" in words.
- Its tooltip is Tooltip's hint card, on the page's background, copies of
  the hidden tags in a column 6px apart, without their remove buttons: a
  tooltip holds nothing to press.
- Where even the first tag doesn't fit beside "+N", only "+N" shows.

## Accessibility

- It's a list, so a screen reader says how many tags it shows. `role="list"`
  keeps it a list in Safari, which stops treating one without bullets as a
  list.
- "+N" is a button, so the keyboard reaches it and its tooltip; its name is
  yours, such as "2 more", and its description is the hidden tags, read after
  it. Pressing it pins the tooltip open (`data-open` on its trigger), for a
  touch screen, which neither hovers nor shows keyboard focus, until it's
  pressed again, a press lands elsewhere, Escape, or focus leaves.
- While "+N" has focus, it stays, however wide the list grows, so focus
  isn't lost to the page; the tags are counted again once focus leaves it.
- The copies in the tooltip have no remove buttons, so "+N"'s description is
  only the tags' names.
- The tooltip follows [Tooltip](tooltip.md): it shows on hover and keyboard
  focus, the pointer can move onto it, and Escape hides it.

## What a script does

| Change | When |
| --- | --- |
| Show each tag to measure it, then hide those past the room left for "+N", with `hidden` on their `<li>`; show `.htag-list-more` with the app's "+N" and its `aria-label`, and copies of the hidden tags in `.htag-list-rest`, without their `.htag-remove` buttons or `id`s, with a space between them, so they're read apart. With every tag fitting, hide `.htag-list-more` | On load, and when the list, its container, or a tag changes size, such as when a font loads, or tags come, go, or change |
| Keep `.htag-list-more` shown, with at least one tag in it, while counting; count again | While "+N" has focus; when focus leaves it |
| Add `data-open` to the tooltip's trigger; remove it | On a press of "+N"; on a press of it again, a press elsewhere, Escape, or focus leaving it |
| Scroll a tag wholly into view | When focus comes to something in it, in a row that scrolls, as in a Combobox |

Measure "+N" with the text it would show, written as the app writes it for
the tags it would hold: from the most tags that leave room for it, one fewer
at a time, until it fits beside them. A smaller count can be wider, such as
"one other" beside "4 others", so measuring only the largest isn't enough.
`examples/html/src/scripts/tag-list.js` is an example script for it, with
`tooltip.js` for Escape; it reads the text from `data-example-more-text`,
such as `+{count}`, and the name from `data-example-more-label`, such as
`{count} more`, with the count in the digits of the list's `lang`. For a
count the language writes in another plural form, it reads that form's
own, from hooks named for the form, such as `data-example-more-text-one` and
`data-example-more-label-one` for one.

## React

`<TagList>` renders the list, counts what fits, and keeps counting. Its
children are [Tag](tag.md#react)s, in fragments or not; a hidden one, or an
empty string, is left out and not counted. Other props are the `<ul>`'s
attributes.

The tooltip renders the hidden tags a second time, so give a tag in a Tag
List no `id` or `ref`: an id would be on the page twice, and a ref would
point at either copy. A [TagRemove](tag.md#react) renders nothing in the
tooltip.

| Prop | Effect |
| --- | --- |
| `moreLabel` | Required: names "+N" from the count, in your app's language, such as ``(count) => `${count} more` `` |
| `formatCount` | Writes "+N"'s text from the count, such as ``(count) => `+${count.toLocaleString("ar")}` `` for Arabic digits, or ``(count) => (count === 1 ? "one other" : `${count} others`)``; ``(count) => `+${count}` `` by default. Each count it could show is measured as it writes it, as a smaller one can be wider |

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
`--harmo-space-2xs`, and those of Tag and Tooltip.
