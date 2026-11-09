# Selection Bar

What's selected in a list and what can be done with it: a count, a way to
deselect, then the actions. It often takes the place of a
[Toolbar](toolbar.md)'s controls while rows are selected.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `selection-bar.css`; `button.css` for its actions, `tooltip.css` for a reason one is blocked |
| Element | `<div class="hselection-bar">` |
| Parts | `<span class="hselection-bar-count" role="status">`, `<button class="hselection-bar-deselect" type="button">`, then the actions |
| Required | The count and the button's text, in the page's language |
| Unique | None |
| Script | Yours: to keep the count and to deselect. See What a script does |

## Markup

```html
<div class="hselection-bar">
  <span class="hselection-bar-count" role="status">3 selected</span>
  <button class="hselection-bar-deselect" type="button">Deselect</button>
  <button class="hbutton" data-variant="secondary" data-size="small" type="button">
    <span class="hbutton-label">Assign</span>
  </button>
  <button class="hbutton" data-variant="secondary" data-size="small" type="button" data-destructive="">
    <span class="hbutton-label">Delete</span>
  </button>
</div>
```

An action that can't be used yet explains why with a [Tooltip](tooltip.md), on a
Button with `aria-disabled`:

```html
<div class="hselection-bar">
  <span class="hselection-bar-count" role="status">2 selected</span>
  <button class="hselection-bar-deselect" type="button">Deselect</button>
  <button class="hbutton" data-variant="secondary" data-size="small" type="button">
    <span class="hbutton-label">Assign</span>
  </button>
  <span class="htooltip-trigger">
    <button class="hbutton" data-variant="secondary" data-size="small" type="button" aria-disabled="true" aria-describedby="bar-blocked-1" data-destructive="">
      <span class="hbutton-label">Delete</span>
    </button>
    <span class="htooltip" id="bar-blocked-1" role="tooltip">Only a project&#x27;s owner can delete its tasks.</span>
  </span>
</div>
```

## Options

None of its own: small [Buttons](button.md) suit the actions, with `destructive`
on one that deletes and `loading` while one runs.

## Appearance and states

- In a row, vertically centered, 8px apart, which wraps when it doesn't fit.
- The count is 14px in `--harmo-color-text-secondary`, at least 28px tall, with
  16px after it and then a 1px `--harmo-color-border` divider on its end. Long
  text wraps.
- Deselect is 14px, underlined, in `--harmo-color-text-secondary`, with 2px 8px
  of padding, and 25px tall. Hovered, it's `--harmo-color-text`. Focused, the
  standard ring. Long text wraps.
- Right-to-left, the count starts on the right, with its divider on its left.

## Accessibility

- The count is a status, so a change to it is read out. Where the bar appears
  along with its first count, some screen readers miss that one: the checkbox
  that was just ticked says as much.
- Deselect goes when the bar does, so focus has to go somewhere else. Your app
  knows where: move it in `onDeselect`, as the example does with its first task. A
  [DataTable](table.md) sends it to the checkbox in its header by itself.
- Explain a blocked action with `aria-disabled="true"`, not `disabled`: a
  `disabled` button can't take keyboard focus, so keyboard users would never reach
  the reason.

## What a script does

| Change | When |
| --- | --- |
| The count's text | The selection changes |
| Remove the bar, and move focus | Deselect is pressed, or the selection is emptied |

The playground's example script, `examples/html/src/scripts/selection-bar.js`,
does this for its example.

## React

`<SelectionBar>` renders the count and Deselect, then its children. Other props
are the element's attributes.

| Prop | Effect |
| --- | --- |
| `label` | Required: the count, as your app words it, such as "3 selected" |
| `deselectLabel` | Required: Deselect's text |
| `onDeselect` | Required: called when it's pressed, to clear the selection and move focus |

```tsx
<Toolbar
  controls={
    selected.length > 0 ? (
      <SelectionBar
        label={`${selected.length} selected`}
        deselectLabel="Deselect"
        onDeselect={() => {
          setSelected([]);
          selectAll.current?.focus();
        }}
      >
        <Button variant="secondary" size="small">Assign</Button>
        <Tooltip description="Only a project's owner can delete its tasks.">
          <Button variant="secondary" size="small" destructive aria-disabled="true">Delete</Button>
        </Tooltip>
      </SelectionBar>
    ) : (
      <Button variant="secondary" size="small">Export</Button>
    )
  }
>
  <Filters aria-label="Filter tasks" resetLabel="Reset filters">…</Filters>
</Toolbar>
```

## Tokens

`--harmo-font-family`, `--harmo-font-size-sm`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-border`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-duration-fast`.
