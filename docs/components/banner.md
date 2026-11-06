# Banner

An inline notice: an icon, a message, and an optional action, such as "The
24-hour reply window has closed". For a passing confirmation, use a
[Toast](toast.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `banner.css`; `button.css` for an action |
| Element | `<div class="hbanner">` |
| Parts | `.hbanner-icon`, `.hbanner-message`; an optional small secondary `.hbutton` |
| Required | `aria-hidden="true"` and `focusable="false"` on the icon; `role="status"` or `role="alert"` on a banner added after the page loads |
| Unique | None |
| Script | None |

## Markup

```html
<div class="hbanner" data-status="warning">
  <svg class="hbanner-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  <p class="hbanner-message">The 24-hour reply window has closed. Send a template to reply.</p>
  <button class="hbutton" data-variant="secondary" data-size="small" type="button">
    <span class="hbutton-label">Send template</span>
  </button>
</div>
```

Draw the icon with `fill="currentColor"` or `stroke="currentColor"`; the banner
colors it.

## Options

| Hook | Effect |
| --- | --- |
| `data-status="info"`, or none | Icon in `--harmo-status-color-info` |
| `data-status="success"` | Icon in `--harmo-status-color-success` |
| `data-status="warning"` | Icon in `--harmo-status-color-warning` |
| `data-status="error"` | Icon in `--harmo-status-color-error` |
| A direct `.hbutton` with `data-variant="secondary"` | The action; on hover its background fills and its border stays put |
| `hidden` | Hides the banner |

## Appearance and states

- A card on `--harmo-color-background`: 1px `--harmo-color-border` border, 8px radius,
  `--harmo-box-shadow-sm`, 12px 16px padding, and 12px gaps.
- A 14px `--harmo-color-text-secondary` message that wraps; the icon is 18px
  at that size and scales with it.
- The action is a small secondary [Button](button.md) (`data-size="small"`,
  29px). On hover its background fills with
  `--harmo-color-background-secondary` and its border doesn't darken.

## Accessibility

A banner present when the page loads needs no role. One added later announces
itself: `role="status"` when it can wait for the current speech, `role="alert"`
when it's urgent, such as an error that blocks the task.

## What a script does

None. An app that shows a banner after the page loads gives it the role
above; it can keep the banner in the page with `hidden` and remove that to
show it. `examples/html/src/scripts/banner.js` is an example script that
does this.

## React

`<Banner>` renders this markup, with its children as the message. Other props
are the `<div>`'s attributes, such as `role="alert"` for a banner shown after
the page loads.

| Prop | Effect |
| --- | --- |
| `icon` | The icon, as an element, such as `<WarningIcon />` from your app; Banner adds `.hbanner-icon` to its `className` and hides it from screen readers |
| `status` | `success`, `warning`, `info`, or `error`; `info` when left out |
| `action` | Placed after the message, such as a small secondary `<Button>` |

```tsx
<Banner
  status="warning"
  icon={<WarningIcon />}
  action={
    <Button variant="secondary" size="small">
      Send template
    </Button>
  }
>
  The 24-hour reply window has closed. Send a template to reply.
</Banner>
```

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`,
`--harmo-button-secondary-color-border`, `--harmo-color-background`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-color-text-secondary`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-sm`,
`--harmo-status-color-error`, `--harmo-status-color-info`,
`--harmo-status-color-success`, `--harmo-status-color-warning`. The action's
other tokens are [Button](button.md)'s.
