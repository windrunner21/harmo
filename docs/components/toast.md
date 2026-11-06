# Toast

A short message at the edge of the window that goes away by itself, such as
"Quick reply saved": an icon, a title, an optional description, and an
optional action. It shows at the bottom center, or at any of six positions. For a notice that stays in the page, use a
[Banner](banner.md).

Toast is inspired by [Sonner](https://sonner.emilkowal.ski), by
[Emil Kowalski](https://emilkowal.ski): the stack, newest in front, spreading
out on hover; its timing; and how toasts leave. How a toast changes shape
follows the Dynamic Island in his
[Animations on the Web](https://animations.dev) course.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `toast.css`; `button.css` for an action |
| Element | One region, `<section class="htoaster" popover="manual">`, holding `<ol class="htoaster-list">` and two announcers, `<div class="htoaster-announce" aria-atomic="false">`, one `role="status"` and one `role="alert"`; each toast is an `<li class="htoast">` in the list |
| Parts | `.htoast-body` holding the icon (`.htoast-icon`), `.htoast-content` with `.htoast-title` and an optional `.htoast-description`, and an optional small secondary `.hbutton` |
| Required | `aria-label` on the region, in the app's language, naming its hotkey; `tabindex="-1"` on it; the two announcers, empty, from the start; `aria-hidden="true"` and `focusable="false"` on the icon |
| Unique | One region on the page |
| Script | Required: it shows the region, adds and removes toasts, and measures them; see [What a script does](#what-a-script-does) |

## Markup

The region, once in the page:

```html
<section class="htoaster" popover="manual" tabindex="-1" aria-label="Notifications (F8)">
  <ol class="htoaster-list"></ol>
  <div class="htoaster-announce" role="status" aria-atomic="false"></div>
  <div class="htoaster-announce" role="alert" aria-atomic="false"></div>
</section>
```

A toast, as the script adds it to the list:

```html
<li class="htoast" data-status="success">
  <div class="htoast-body">
    <svg class="htoast-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">…</svg>
    <div class="htoast-content">
      <span class="htoast-title">Quick reply saved</span>
      <span class="htoast-description">Type /ship in a chat to use it.</span>
    </div>
  </div>
</li>
```

With an action, after `.htoast-content`:

```html
<button class="hbutton" data-variant="secondary" data-size="small" type="button">
  <span class="hbutton-label">View run</span>
</button>
```

Draw the icon with `fill="currentColor"` or `stroke="currentColor"`; the toast
colors it by its status.

## Options

| Hook | Effect |
| --- | --- |
| `data-status="info"`, or none | Icon in `--harmo-status-color-info`; read when the screen reader is free |
| `data-status="success"` | Icon in `--harmo-status-color-success`; read when the screen reader is free |
| `data-status="warning"` | Icon in `--harmo-status-color-warning`; read at once |
| `data-status="error"` | Icon in `--harmo-status-color-error`; read at once |
| A time limit | 4 seconds by default; any other, or none, which keeps it until it's dismissed or changed |
| An id | Sent again with the same id, a toast changes in place, rather than another coming |
| `data-position` on the region | `top-start`, `top-center`, `top-end`, `bottom-start`, or `bottom-end`; the bottom center when left out |

## Appearance and states

- A card on `--harmo-color-background`: 1px `--harmo-color-border` border, 8px
  radius, `--harmo-box-shadow-sm`, 12px 16px padding, and 12px gaps, 24px
  above the bottom of the window, centered.
- At the top (`top-*`), it's 24px below the top of the window, and everything
  that moves toward or away from the bottom edge moves toward or away from the
  top instead: toasts come in from above, the stack goes down, and they leave
  upward. At the start or end (`*-start`, `*-end`), toasts line up on that
  edge, 24px in, and are no wider than the window less 48px. The title is 14px medium in
  `--harmo-color-text`, with the description under it in
  `--harmo-color-text-secondary`; the icon is 20px. Text wraps at 480px, and
  a toast is never wider than the window less 32px.
- It comes in from below, fading in, in 400ms with `ease`.
- Toasts stack: the newest in front, each one further back 5% smaller and 14px
  higher, in the front one's shape, with its content hidden; past three back,
  hidden. When one comes or goes, the stack changes shape into the new front
  one's, with a spring, in 500ms.
- Hovered with a mouse, tapped, or with focus inside, the stack spreads out
  into a list, newest at the bottom, 12px apart, each at its own size.
- Each toast counts its own time, held while the stack is spread out or the
  page is hidden. Those whose time is up leave one at a time, the oldest
  first, 0.7 seconds apart: the front one slides back down in 400ms, and one
  further back sinks behind it as it fades.
- Changed in place, a toast's box changes size with the spring, while what it
  showed fades out, slightly blurred, over what it shows now.
- With reduced motion, toasts fade in and out where they are, and their sizes
  change at once.

## Accessibility

- Screen readers read each toast's title and description as it comes or
  changes: a success or info one when they're free, through the
  `role="status"` announcer, and a warning or error one at once, through the
  `role="alert"` announcer. The announcers are in the region, empty, from the
  start, since a live region that arrives with its text isn't always read,
  and the toasts themselves stay list items. They're `aria-atomic="false"`,
  so each toast is read once, as it's added, rather than with the ones before
  it.
- F8 moves focus to the region, which spreads the stack out and holds it, so
  a keyboard user can reach an action before the toast goes; Tab moves
  through the actions, and Escape puts focus back where it was. Name the
  hotkey in the region's `aria-label`, such as "Notifications (F8)".
- While a Dialog or Drawer is open, the page behind it is inert: a toast
  there couldn't be clicked, focused, or read. So the region moves into the
  open dialog, and back out once it has closed: while its exit plays, it's
  still modal.
- A toast goes away by itself, so it's never the only place for what someone
  needs: neither the only way to do something, nor information they'll have
  to act on, such as which rows of an import failed. Keep that in the page
  too, such as in an import report, or keep the toast open
  (`duration: Infinity`) until it's dealt with. Keep a toast short.
- A leaving toast is `inert`, so its action can't run twice; focus that was
  in it stays with the other toasts, or goes back where it was before F8.
  Changed while focus is on its action, a toast keeps focus in the region.

## What a script does

Everything but the look:

- **Shows the region** with `showPopover()`, so it's in the top layer, above
  the page, and does so again each time it moves.
- **Adds and removes toasts.** A leaving toast gets `data-removed` and
  `inert` for its exit, then goes, after its longest transition, so a longer
  `--harmo-toast-duration` still plays out.
- **Measures each toast** as it comes or changes, and again when the window
  is resized or a font loads: its content's width at `max-content`, rounded
  up to a whole pixel, since rounded down the last word no longer fits and
  wraps, and its height at that width. It sets `--htoast-body-width`,
  `--htoast-width`, and `--htoast-height` on the toast, two pixels more for
  the border, and `--htoaster-width` on the region: the widest toast shown at
  its own size, so the toasts stay centered as they change size.
- **Announces each toast** as it comes or changes, a tenth of a second later,
  once the region is where it can be read:
  a `<div>` with its title and description, each in a `<p>`, added to the
  announcer for its status, and taken out again after a second and a half.
- **Places them,** newest first: `--htoast-index` and `data-front` on the
  front one, `data-beyond` past three back, and `--htoast-offset`, the height
  of the ones in front of it with 12px gaps, for when the stack is spread out.
  On the region: `--htoaster-front-width` and `--htoaster-front-height`, and
  `--htoaster-spread`, how far the spread-out list reaches above the front.
- **Spreads the stack out** with `data-expanded` on the region, while it's
  hovered with a mouse, tapped, or has focus inside, and holds the toasts'
  time meanwhile, and while the page is hidden.
- **Times them,** and sends them out one at a time, 0.7 seconds apart.
- **Changes a toast in place:** what it showed stays, absolutely placed, with
  `data-leaving` and `inert`, until its fade ends. If focus was on its
  action, focus moves to the region.
- **Moves the region** into the topmost open modal dialog, which is the one
  with focus, and back where it was once the dialog closes or is taken out of
  the page. Moved, each toast is in the page again and would start over, so
  first it notes where each one is, as `--htoast-moved-opacity`,
  `--htoast-moved-transform`, `--htoast-moved-width`, `--htoast-moved-height`,
  `--htoast-moved-body-opacity`, and `--htoast-moved-body-filter`, and sets
  `data-moved` on each toast and its content for two frames: each starts from
  there, and carries on with whatever it was doing, such as changing shape
  into a toast that has just come in front of it. A toast that comes during
  those frames isn't marked, so it comes in as usual. What a changed toast
  showed before gets an `animation-delay` of minus the time its fade has
  played, so the fade carries on too.
- **F8 and Escape,** as above: F8 remembers where focus was only when it
  comes from outside the toasts.

`examples/html/src/scripts/toast.js` is an example script that does this.

## React

`<Toaster>` renders the region, once, near the root of your app; `toast()`
shows a toast from anywhere, and returns its id. On the server, and at first,
the region is rendered where `<Toaster>` is; then in an element at the end of
the page, which moves into an open dialog and back, so the toasts move
without being built again.

```tsx
<Toaster
  label="Notifications (F8)"
  icons={{
    success: <SuccessIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
  }}
/>
```

```tsx
toast({
  status: "success",
  title: "Campaign run scheduled",
  description: "Order shipped · 1,240 recipients",
  action: { label: "View run", onClick: openRun },
});
```

| `<Toaster>` prop | Effect |
| --- | --- |
| `label` | Required. The region's `aria-label`, naming its hotkey, in your app's language |
| `icons` | Required. An icon for each status, as elements from your app; Toaster adds `.htoast-icon` and hides them from screen readers |
| `position` | Where toasts show: `"bottom-center"` by default, or `"top-start"`, `"top-center"`, `"top-end"`, `"bottom-start"`, `"bottom-end"` |
| `hotkey` | The key that moves focus to the toasts: `"F8"` by default |

| `toast()` option | Effect |
| --- | --- |
| `title` | Required. What happened, in a few words |
| `description` | More, under the title |
| `status` | `success`, `warning`, `info`, or `error`; `info` when left out |
| `action` | `{ label, onClick, disabled? }`: a small secondary button |
| `duration` | How long it stays, in milliseconds: 4000 by default; `Infinity` keeps it |
| `id` | Changes the toast with this id in place, if it's still shown |

`toast.dismiss(id)` sends a toast out at once.

A notice that stays until something changes, such as being offline, is a toast
with an id and no time limit, changed when it's over:

```tsx
toast({ id: "connection", status: "error", title: "You're offline", duration: Infinity });
// Later:
toast({ id: "connection", status: "success", title: "Back online", duration: 2000 });
```

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-color-background`,
`--harmo-color-border`, `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-duration-normal`, `--harmo-ease-spring`, `--harmo-font-family`,
`--harmo-font-line-height`, `--harmo-font-size-sm`,
`--harmo-font-weight-medium`, `--harmo-status-color-error`,
`--harmo-status-color-info`, `--harmo-status-color-success`,
`--harmo-status-color-warning`, `--harmo-toast-duration`,
`--harmo-toast-ease`, `--harmo-toast-morph-duration`. The action's tokens are
[Button](button.md)'s.
