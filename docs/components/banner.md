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
| Required | `aria-hidden="true"` and `focusable="false"` on the icon; for a banner shown after the page loads, a `role="status"` element around it that's in the page from the start, or, when it's urgent, `role="alert"` on the banner |
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

A banner shown after the page loads, when it can wait for the current speech,
goes inside an element with `role="status"` that's in the page from the start,
so screen readers read it as it appears; a live region added with its text
already in it is less often read:

```html
<div role="status">
  <div class="hbanner" data-status="success" hidden>
    <svg class="hbanner-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
    <p class="hbanner-message">Your WhatsApp number is connected and ready to send.</p>
  </div>
</div>
```

An urgent one, such as an error that blocks the task, takes `role="alert"`
itself, and can be kept in the page with `hidden` until it shows.

## Options

| Hook | Effect |
| --- | --- |
| `data-status="info"`, or none | Icon in `--harmo-status-color-info` |
| `data-status="success"` | Icon in `--harmo-status-color-success` |
| `data-status="warning"` | Icon in `--harmo-status-color-warning` |
| `data-status="error"` | Icon in `--harmo-status-color-error` |
| A direct `.hbutton` with `data-variant="secondary"` | The action; on hover and pressed its background fills and its border stays put |
| `hidden` | Hides the banner |

## Appearance and states

- A card on `--harmo-color-background`: 1px `--harmo-color-border` border, 8px radius,
  `--harmo-box-shadow-sm`, 10px 16px padding (`--harmo-space-xs` and
  `--harmo-space-sm`), and 10px gaps.
- A 14px `--harmo-color-text-secondary` message that wraps; the icon is 20px
  at that size, as in a Toast, and scales with it.
- The action is a small secondary [Button](button.md) (`data-size="small"`,
  29px), as in a Toast. On hover its background fills with
  `--harmo-color-background-hover`, and pressed with
  `--harmo-color-background-active`, and its border doesn't darken. Where
  there isn't room for it beside at least 12em of the message, it moves under
  the message, at the end, rather than squeezing it.

## Accessibility

A banner present when the page loads needs no role. One shown later must be
announced. When it can wait for the current speech, show it inside a
`role="status"` element that's in the page from the start, as in
[Markup](#markup), rather than giving the banner the role: a live region that
arrives with its text is less often read. When it's urgent, such as an error
that blocks the task, `role="alert"` on the banner itself is read at once.
How much each screen reader reads varies, so check yours.

## What a script does

None. An app that shows a banner after the page loads puts it in a status
that's in the page from the start, or gives an urgent one `role="alert"`, as
above; it can keep the banner in the page with `hidden` and remove that to
show it. `examples/html/src/scripts/banner.js` is an example script that
shows an urgent one.

## React

`<Banner>` renders this markup, with its children as the message. Other props
are the `<div>`'s attributes, such as `role="alert"` for an urgent banner shown
after the page loads. One that can wait goes inside a `role="status"` element
that's in the page from the start, as in [Markup](#markup).

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
`--harmo-color-background-active`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-color-text-secondary`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-sm`, `--harmo-space-sm`,
`--harmo-space-xs`, `--harmo-status-color-error`, `--harmo-status-color-info`,
`--harmo-status-color-success`, `--harmo-status-color-warning`. The action's
other tokens are [Button](button.md)'s.
