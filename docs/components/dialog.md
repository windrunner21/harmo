# Dialog

A modal window for a task or a decision: a form such as inviting someone or
creating a team, a confirmation, or details that don't fit on the page. It
holds the page until it's closed. For a small panel beside its trigger, use a
[Popup](popup.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `dialog.css`; `button.css` for its close button |
| Element | `<dialog class="hdialog">`, opened by a button with `commandfor` and `command="show-modal"`, or by `showModal()` |
| Parts | `.hdialog-header` holding `.hdialog-title` (an `<h2>`), an optional `.hdialog-description`, and `.hdialog-close`; `.hdialog-body`; an optional `.hdialog-footer`; an optional `<form>` around the body and footer |
| Required | An `id`; `aria-labelledby` naming the title, and `aria-describedby` the description when there is one; `aria-label` on the close button |
| Unique | Every id |
| Script | None to open, close, or focus it; one fades it out as it closes, in every browser; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton" type="button" commandfor="invite-dialog" command="show-modal">
  <span class="hbutton-label">Invite people</span>
</button>

<dialog class="hdialog" id="invite-dialog" closedby="any"
  aria-labelledby="invite-dialog-title" aria-describedby="invite-dialog-description">
  <header class="hdialog-header">
    <h2 class="hdialog-title" id="invite-dialog-title">Invite people</h2>
    <p class="hdialog-description" id="invite-dialog-description">
      They get an email with a link to join this workspace.
    </p>
    <button class="hbutton hdialog-close" data-variant="tertiary" type="button"
      commandfor="invite-dialog" command="request-close" aria-label="Close">
      <svg class="hicon" …></svg>
    </button>
  </header>
  <form method="dialog">
    <div class="hdialog-body">…</div>
    <footer class="hdialog-footer">
      <button class="hbutton" data-variant="secondary" type="button"
        commandfor="invite-dialog" command="request-close">
        <span class="hbutton-label">Cancel</span>
      </button>
      <button class="hbutton" type="submit">
        <span class="hbutton-label">Send invite</span>
      </button>
    </footer>
  </form>
</dialog>
```

## Opening and closing

- **Opening:** a button with `commandfor` naming the dialog and
  `command="show-modal"`, anywhere on the page, or `dialog.showModal()` from a
  script.
- **Closing:** the close button, or any button with
  `command="request-close"`; Escape; a click outside, with `closedby="any"`; a
  `<form method="dialog">` when it's sent; or `dialog.requestClose()`. Each of
  these fades it out first, with the script. `command="close"` and
  `dialog.close()` close it at once. A `value` on a `command="request-close"`
  button becomes `returnValue` once the exit has played. A value passed to
  `dialog.requestClose(value)` from a script isn't kept while the exit plays:
  close it with `close(value)` instead.
- **Kept open:** a `cancel` listener of the app's that calls
  `preventDefault()` keeps it open on Escape, a click outside, and
  `command="request-close"`, which all send `cancel` first; one on its form's
  `submit` keeps it open as the form is sent. The script leaves a close the app
  has stopped alone, when the app's `cancel` listener runs before its own:
  added before it, or on `document` with `capture: true`. A `submit` listener
  on the form always does. A close the browser doesn't let the page stop still
  closes it: after the page stops one Escape, it may stop another only once
  the person has clicked or typed. The "Unsaved changes" example asks this way
  before dropping changes, in a second dialog opened above the first: Discard
  fades both out together, in one 150ms exit, then closes the second and,
  right after it, the first, so focus goes back through the first to the
  button that opened them; Keep editing goes back to the first, with focus
  inside it. The first closes the second as it starts closing, in its
  `beforetoggle`, so the second always closes first, whichever fade ends
  first.
- **From a URL:** a link such as `?dialog=invite-dialog`, a reload, and Back,
  when the app's router decides whether it's open. See
  [React](#react) for the recipe, and the "Opened from a link" example.

## Options

| Hook | Effect |
| --- | --- |
| `closedby="any"` | Escape and a click outside close it |
| `closedby="closerequest"` | Only Escape and its own buttons do, so a half-filled form isn't lost to a stray click |
| `autofocus` on a control inside | Where focus goes when it opens; without one, the first control, which is the close button |
| `tabindex="0"` on `.hdialog-body` | For a body that scrolls with nothing inside that takes focus, so the keyboard can scroll it |
| `--hdialog-max-inline-size` | The widest it gets: 600px by default |

## Appearance and states

- 26px padding (`--harmo-space-md`), 8px radius, and a 1px
  `--harmo-color-border` border on `--harmo-color-background`, from 400px to
  600px wide, at least 26px from the window's edges. On a phone, 16px padding
  (`--harmo-space-sm`) and 10px (`--harmo-space-xs`) from the edges.
- Taller than the window, its body scrolls, and its header and footer stay in
  view.
- The title is 20px bold in `--harmo-color-text`; the description is 14px in
  `--harmo-color-text-secondary`, 6px (`--harmo-space-2xs`) below it. The
  close button is a tertiary icon [Button](button.md) at the title's end.
- A long word in the title, description, or body, such as an email address or
  a key, breaks where it must, rather than running under the close button or
  scrolling sideways.
- The footer holds its actions at its end, 10px apart (`--harmo-space-xs`),
  20px below the body.
- The page behind is dimmed by `--harmo-dialog-backdrop-color`, and doesn't
  scroll while it's open. A page that scrolls as a whole, where scrollbars take
  room, can set `scrollbar-gutter: stable` on its root, so it doesn't shift as
  the scrollbar goes and comes back.
- It opens in 200ms, growing from 95% as it fades in, and fades out in 150ms
  where it is, then closes. With reduced motion, it fades without growing.
- Closing, it stays open while `data-closing` fades it, then closes, as a
  library keeps a closing element until its exit has played: CSS alone can't
  keep a modal dialog shown after it closes in Firefox and Safari. Without the
  script, it still closes, fading in Chromium and at once in the others.
- A closed dialog isn't rendered, as the browser's own isn't: hidden any other
  way, Safari can't move focus inside as it opens.

## Accessibility

- The browser makes it a modal dialog: the page behind is inert, focus moves
  inside as it opens, to the control with `autofocus` or else the first one,
  and back to what opened it as it closes. Escape closes it; an Escape that
  hides a [Tooltip](tooltip.md) shown inside it hides only that, and the next
  one closes it, also in a second dialog open over another, as in "Unsaved
  changes". Tab can step out
  to the browser's own toolbar, as with any native dialog, but not into the
  page.
- Its title names it, through `aria-labelledby`, and its description describes
  it.
- The close button is an icon, so it needs `aria-label`, in the app's
  language: Harmo builds in no text.

## What a script does

None to open, close, or focus it. The example script:

| Change | When |
| --- | --- |
| `data-closing` on the dialog, then `close()` once its fade has played | Its `cancel` event, which Escape, a click outside, and `command="request-close"` send first, or a form sent with `method="dialog"`, its own or its submit button's `formmethod`; not when the app's own handler has stopped it, such as to confirm unsaved changes |
| `data-closing` removed, and it stays open | When something wants it open while it fades, as Command Menu's shortcut does |
| `showModal()` | When `?dialog=` names it, on load and on Back |
| `?dialog=` added to the URL | When its link is followed, without a modifier key, which is left to the browser, so the link can open in a new tab |
| Back, or `?dialog=` taken off the URL | As it closes: back when its link opened it, otherwise taking the parameter off and leaving the URL's others |

The browser lets a page hold Escape only after the person has used it, so a
dialog that opened by itself closes at once on its first Escape. The last
three rows are for the "Opened from a link" example, where the script stands
in for an app's router. In the "Unsaved changes" example, it stands in for the
app: it stops the settings' `cancel` while their fields differ from what was
saved and opens the dialog that asks, fades the settings out on Discard as
that one fades, closes that one as the settings close, and resets the form as
they open.

## React

`<Dialog>` renders the dialog, with its children in the body. Other props are
the `<dialog>`'s attributes; an `aria-describedby` of yours is added after the
description's id, and an `aria-labelledby` replaces the title's.

| Prop | Effect |
| --- | --- |
| `label` | Required. The title, an `<h2>`, which names the dialog |
| `closeLabel` | Required. The close button's `aria-label`, in your app's language |
| `description` | The description under the title |
| `trigger` | A button that opens it, given `commandfor` and `command="show-modal"` |
| `open`, `onOpenChange` | Its state, held by you, for code or a URL. While `open` is `false`, a button that would open it, `trigger` included, calls `onOpenChange(true)` instead, and it opens once `open` is `true`. It closes by itself, as below, and calls `onOpenChange(false)`: `open` must follow. `onOpenChange` isn't called as it follows a change to `open` |
| `onToggle`, `onBeforeToggle` | The dialog's own `toggle` and `beforetoggle` events, as a native `ToggleEvent`; `onBeforeToggle` can stop it opening |
| `footer` | What goes in the footer, usually buttons |
| `form` | Props for a `<form>` around the body and footer, such as `{ method: "dialog" }` or `onSubmit` |
| `bodyProps` | Props for the body, such as `{ tabIndex: 0 }` |
| `closedby` | `"any"` by default, or `"closerequest"` |
| `id` | Its id, for a button elsewhere to open it |

`<DialogClose>` makes the button inside it close the dialog. Every way it
closes fades it out first, as the example script does, setting `open` to
`false` included; setting it back to `true` while it fades keeps it open. A
close is the browser's, as some closes, such as the first Escape after it
opened by itself, can't be stopped, so with `open` held by you, set it to
`false` on `onOpenChange(false)`. To keep it open, stop the close before it
happens: an `onCancel` that calls `preventDefault()` keeps it open on Escape,
a click outside, and `command="request-close"`, and a `form` `onSubmit` that
does keeps it open as its form is sent. `onBeforeToggle` can't stop a close.

A button opens it, beside it with `trigger` or anywhere else by its `id`:

```tsx
<Dialog
  label="Invite people"
  closeLabel="Close"
  trigger={<Button>Invite people</Button>}
  form={{ method: "dialog" }}
  footer={
    <>
      <DialogClose>
        <Button variant="secondary">Cancel</Button>
      </DialogClose>
      <Button type="submit">Send invite</Button>
    </>
  }
>
  <Field label="Email">
    <Input name="email" type="email" autoFocus />
  </Field>
</Dialog>

<Dialog id="shortcuts" label="Keyboard shortcuts" closeLabel="Close">…</Dialog>
<Button commandfor="shortcuts" command="show-modal">Shortcuts</Button>
```

Anything else decides, with `open` held by you: your code, such as once an
export is ready, or the URL. In the Next.js App Router, closing goes back when
a link on the page opened it, and otherwise takes its parameter off, leaving
the URL's others as they are. A click with a modifier key opens the link in a
new tab or window instead, pushing nothing here, so it doesn't count:

```tsx
"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Dialog, Link } from "@harmo-ui/react";

export function NewTeam() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [linked, setLinked] = useState(false);
  const open = params.get("create") === "team";
  const withDialog = new URLSearchParams(params);
  withDialog.set("create", "team");
  const withoutDialog = new URLSearchParams(params);
  withoutDialog.delete("create");

  return (
    <>
      <Link
        href={`?${withDialog}`}
        onClick={(event) => {
          if (
            !event.defaultPrevented &&
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          )
            setLinked(true);
        }}
      >
        New team
      </Link>
      <Dialog
        label="New team"
        closeLabel="Close"
        open={open}
        onOpenChange={(next) => {
          if (next || !open) return;
          if (linked) router.back();
          else router.replace(withoutDialog.size ? `?${withoutDialog}` : pathname);
          setLinked(false);
        }}
      >
        …
      </Dialog>
    </>
  );
}
```

With another router, the same: `open` from its URL, and back or replace on
closing.

The "Unsaved changes" example asks before dropping changes, in a second Dialog,
and loads what was saved each time it opens. With `editing`, `asking`, the
form's `draft` and `saved` values, and an `asker` ref to the second, held by
you, Discard sets `editing` to `false` as its `DialogClose` closes the second,
so both fade out together. The first closes the second in its
`onBeforeToggle`, so the second closes first, and focus goes back through the
first to the button that opened them:

```tsx
<Dialog
  label="Workspace settings"
  closeLabel="Close"
  trigger={<Button>Workspace settings</Button>}
  open={editing}
  onOpenChange={setEditing}
  onBeforeToggle={(event) => {
    if (event.newState === "open") setDraft(saved);
    else asker.current?.close();
  }}
  onCancel={(event) => {
    if (!changed || !event.cancelable) return;
    event.preventDefault();
    setAsking(true);
  }}
  form={{ method: "dialog", onSubmit: () => setSaved(draft) }}
  footer={…}
>
  …
</Dialog>

<Dialog
  ref={asker}
  label="Discard unsaved changes?"
  closeLabel="Close"
  open={asking}
  onOpenChange={setAsking}
  footer={
    <>
      <DialogClose>
        <Button variant="secondary">Keep editing</Button>
      </DialogClose>
      <DialogClose>
        <Button destructive onClick={() => setEditing(false)}>
          Discard
        </Button>
      </DialogClose>
    </>
  }
>
  <p>Your changes to the workspace settings haven't been saved.</p>
</Dialog>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background`, `--harmo-color-border`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-dialog-backdrop-color`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-lg`,
`--harmo-font-size-sm`, `--harmo-font-weight-bold`, `--harmo-space-md`,
`--harmo-space-sm`, `--harmo-space-xs`, `--harmo-space-2xs`.
