# Empty State

What shows where there's nothing yet: a list before its first item, a search
that found nothing, or a page you're not allowed to see. An icon, a title
that's a heading, a description, and actions, each optional, centered in the
space it's given or lined up at its start. Small, it fits inside a page, such
as an empty column or list; dashed, it stands in for what would be there.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `empty-state.css`; `button.css` for actions |
| Element | `<div class="hempty-state">` |
| Parts | All optional, in this order: `.hempty-state-icon` around an icon, an `<svg>` or an `<img>` (`aria-hidden="true"`); `.hempty-state-title`, a heading of the level that fits the page, such as `<h2>`; `<p class="hempty-state-description">`; `.hempty-state-actions` around buttons or links |
| Required | A title or a description |
| Unique | None |
| Script | None |

## Markup

```html
<div class="hempty-state">
  <div class="hempty-state-icon" aria-hidden="true">
    <svg class="hicon" …>…</svg>
  </div>
  <h2 class="hempty-state-title">No quick replies yet</h2>
  <p class="hempty-state-description">Save answers you send often, and add them to a chat in two clicks.</p>
  <div class="hempty-state-actions">
    <button class="hbutton" type="button">
      <span class="hbutton-label">Add quick reply</span>
    </button>
  </div>
</div>
```

It takes the space your layout gives it, such as where a table's rows would
be, and centers itself in it; give that space a height when it should fill
a page.

When a search or a filter leaves nothing, show the empty state inside an
element with `role="status"` that's in the page from the start, so screen
readers can read it as it appears; one added with its text already in it is
less often read. How much each reads varies, so check yours: a status is
read as a whole, title, description, and button together.

```html
<div role="status">
  <div class="hempty-state" data-size="small" hidden>
    <h3 class="hempty-state-title">No quick replies found</h3>
    <p class="hempty-state-description">Try another word, or clear the search to see them all.</p>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-align="start"` | Lined up at its start rather than centered, such as where a table's rows would be |
| `data-size="small"` | For one inside a page, such as an empty column, list, or table body: less room around it, a 32px icon tile, a 14px title, and a 13px description |
| `data-variant="dashed"` | A dashed border, where it stands in for what would be there, such as a Kanban column's cards |

## Appearance and states

- 40px of space above and below it, and 24px at its sides; small, 24px and
  12px.
- The icon: 24px in `--harmo-color-primary`, in a 40px tile of
  `--harmo-color-background-secondary` with the 8px corners, 16px above the
  title. An `<img>` there is sized the same, and in forced-colors mode the
  tile keeps a border.
- The title: 20px bold in `--harmo-color-text`. The description: 14px in
  `--harmo-color-text-secondary`, 4px under the title, and at most 400px
  wide, so a long one wraps into a short block.
- The actions: in a row, 8px apart, 16px under the text, wrapping when they
  don't fit.
- Dashed: a 1px dashed `--harmo-color-border-control` border with the 8px
  corners.

## Accessibility

- The title is a heading, so someone moving through a page's headings finds
  it; choose its level for where it is in the page.
- The icon only illustrates the title, so it's hidden from screen readers.
- An empty state that appears after a search or a filter goes in a
  `role="status"` element that's in the page from the start, so it's read as
  it appears.
- A page you're not allowed to see says why, and how to get access, and
  links back.
- Text comes from your app, in its language.

## What a script does

None. Showing it when there's nothing to show is your app's.

## React

`<EmptyState>` renders it, with the parts you give it. Other props are the
`<div>`'s attributes, such as `role` or `hidden`.

| Prop | Effect |
| --- | --- |
| `label` | The title |
| `labelAs` | The title's element: `"h2"` by default, or `"h3"` to `"h6"`, or `"p"` where it's no heading |
| `description` | The description |
| `icon` | The icon, such as an `<svg className="hicon">` |
| `actions` | The actions, such as `<Button>`s |
| `align` | `"start"`: lined up at its start |
| `size` | `"small"` |
| `variant` | `"dashed"` |

```tsx
<EmptyState
  icon={<MessagesIcon className="hicon" />}
  label="No quick replies yet"
  description="Save answers you send often, and add them to a chat in two clicks."
  actions={<Button>Add quick reply</Button>}
/>

<EmptyState size="small" variant="dashed" description="No tickets in this column" />
```

## Tokens

`--harmo-color-primary`, `--harmo-color-background-secondary`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-color-border-control`, `--harmo-border-radius`,
`--harmo-font-family`, `--harmo-font-size-lg`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-font-weight-bold`,
`--harmo-font-weight-medium`, `--harmo-font-line-height`.
