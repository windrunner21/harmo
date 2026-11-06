# Drawer

A modal panel at the window's edge, the full height of the window, for a form
or details beside the page: creating or editing something, with the page still
in view. An aside can sit beside the form, such as a preview of what it makes.
For a short task or a decision, use a [Dialog](dialog.md); a Drawer opens,
closes, and takes focus the same way.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `drawer.css`; `button.css` for its close button |
| Element | `<dialog class="hdrawer">`, opened by a button with `commandfor` and `command="show-modal"`, or by `showModal()` |
| Parts | `.hdrawer-header` holding `.hdrawer-title` (an `<h2>`), an optional `.hdrawer-description`, and `.hdrawer-close`; `.hdrawer-body`; an optional `.hdrawer-footer`; an optional `<form>` around the body and footer; an optional `.hdrawer-aside` after them |
| Required | An `id`; `aria-labelledby` naming the title, and `aria-describedby` the description when there is one; `aria-label` on the close button |
| Unique | Every id |
| Script | None to open, close, or focus it; one slides it out as it closes, in every browser; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" type="button" commandfor="reply-drawer" command="show-modal">
  <span class="hbutton-label">New quick reply</span>
</button>

<dialog class="hdrawer" id="reply-drawer" closedby="closerequest"
  aria-labelledby="reply-drawer-title">
  <header class="hdrawer-header">
    <h2 class="hdrawer-title" id="reply-drawer-title">New quick reply</h2>
    <button class="hbutton hdrawer-close" data-variant="tertiary" type="button"
      commandfor="reply-drawer" command="request-close" aria-label="Close">
      <svg class="hicon" …></svg>
    </button>
  </header>
  <form method="dialog">
    <div class="hdrawer-body">…</div>
    <footer class="hdrawer-footer">
      <button class="hbutton" data-variant="secondary" type="button"
        commandfor="reply-drawer" command="request-close">
        <span class="hbutton-label">Cancel</span>
      </button>
      <button class="hbutton" type="submit">
        <span class="hbutton-label">Save</span>
      </button>
    </footer>
  </form>
</dialog>
```

With an aside, after the body and footer:

```html
<dialog class="hdrawer" …>
  <header class="hdrawer-header">…</header>
  <form method="dialog">
    <div class="hdrawer-body">…</div>
    <footer class="hdrawer-footer">…</footer>
  </form>
  <div class="hdrawer-aside">
    <p>How it looks to a customer:</p>
    …
  </div>
</dialog>
```

## Opening and closing

As a [Dialog](dialog.md#opening-and-closing) does: a button with `commandfor`
and `command="show-modal"`, or `showModal()`; the close button and buttons
with `command="request-close"`, Escape, a click outside with `closedby="any"`,
and a `<form method="dialog">` as it's sent; and from a URL, when the app's
router decides whether it's open.

## Options

| Hook | Effect |
| --- | --- |
| `closedby="any"` | Escape and a click outside close it |
| `closedby="closerequest"` | Only Escape and its own buttons do, so a half-filled form isn't lost to a stray click |
| `autofocus` on a control inside | Where focus goes when it opens; without one, the first control, which is the close button |
| `tabindex="0"` on `.hdrawer-body` | For a body that scrolls with nothing inside that takes focus, so a keyboard can scroll it in Safari, which doesn't let it otherwise |
| `tabindex="0"` on `.hdrawer-aside` | The same, for an aside that scrolls, such as a long preview |
| `--hdrawer-inline-size` | The body's width: 480px by default. Something inside with a set width, such as a table or an image, widens it; it's never wider than the window |
| `--hdrawer-aside-inline-size` | The widest the aside gets: 480px by default |

## Appearance and states

- At the window's end edge, the right, or the left on a right-to-left page,
  the full height of the window, with a 1px `--harmo-color-border` border,
  8px radius on its two inner corners, and `--harmo-box-shadow-sm`. Its
  body is 480px wide, or as wide as something inside with a set width needs,
  such as a table or an image; text, fields, and buttons wrap or shrink
  instead, and a long word, such as a key or a link, breaks where it must.
  It's never wider than the window: on a narrow one, it fills the width, and
  a body too wide for it scrolls sideways.
- The header has 16px 20px padding and a line under it; the title is 20px
  bold in `--harmo-color-text`, with the description 14px in
  `--harmo-color-text-secondary` under it, and the close button, a tertiary
  icon [Button](button.md), at its end.
- The body has 20px padding and scrolls; the footer stays under it, with 20px
  padding, a line above it, and its actions at its end, 8px apart. The first
  and last child's own block margins in the body and aside are removed.
- The aside sits beside the body and footer, below the header: 40px padding
  on `--harmo-color-background-secondary`, a line on its start side, as wide
  as its content up to its cap, scrolling on its own. The drawer widens to fit
  both. Where the window is narrower than 68rem, the aside goes below the body,
  the drawer scrolls as a whole, and its header and footer stay in view.
- The page behind is dimmed by `--harmo-dialog-backdrop-color`, as a Dialog's
  is, and doesn't scroll while it's open.
- It slides in from its edge in 200ms, and slides out in 150ms before it
  closes, as a Dialog fades. With reduced motion, it fades in and out where it
  is. A closed drawer isn't rendered.

## Accessibility

As a [Dialog](dialog.md#accessibility): the browser makes it a modal dialog,
with the page behind inert, focus moved inside and back, and Escape. Its title
names it and its description describes it; the close button needs
`aria-label`, in the app's language.

## What a script does

None to open, close, or focus it. The example script, the same one Dialog's
examples use, holds the drawer's close while `data-closing` slides it out, then
closes it, unless the app has stopped the close, such as to confirm unsaved
changes; and it opens the drawer that `?dialog=` names, as an app's router
would. Without it, the drawer still closes, sliding out in Chromium and at once
in Firefox and Safari.

## React

`<Drawer>` renders the drawer, with its children in the body, and takes
[Dialog's props](dialog.md#react): `label` and `closeLabel`, both required,
`description`, `trigger`, `open` and `onOpenChange`, `onToggle` and
`onBeforeToggle`, `footer`, `form`, `bodyProps`, `closedby`, and `id`. It adds:

| Prop | Effect |
| --- | --- |
| `aside` | What goes in the aside, beside the body and footer |
| `asideProps` | Props for the aside, such as `{ tabIndex: 0 }` |

`<DrawerClose>` makes the button inside it close the drawer.

```tsx
<Drawer
  label="Edit template"
  closeLabel="Close"
  closedby="closerequest"
  trigger={<Button>Edit template</Button>}
  form={{ method: "dialog", onSubmit: save }}
  footer={
    <>
      <DrawerClose>
        <Button variant="secondary">Cancel</Button>
      </DrawerClose>
      <Button type="submit">Save template</Button>
    </>
  }
  aside={<TemplatePreview />}
>
  …
</Drawer>
```

From a URL, use [Dialog's recipe](dialog.md#react), with `<Drawer>` in place of
`<Dialog>`.

## Tokens

`--harmo-border-radius`, `--harmo-box-shadow-sm`, `--harmo-color-background`,
`--harmo-color-background-secondary`, `--harmo-color-border`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-dialog-backdrop-color`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-lg`,
`--harmo-font-size-sm`, `--harmo-font-weight-bold`.
