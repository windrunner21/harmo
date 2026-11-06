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
  `dialog.close()` close it at once.
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

- 24px padding, 8px radius, and a 1px `--harmo-color-border` border on
  `--harmo-color-background`, from 400px to 600px wide, at least 24px from the
  window's edges. On a phone, 20px padding and 12px from the edges.
- Taller than the window, its body scrolls, and its header and footer stay in
  view.
- The title is 20px bold in `--harmo-color-text`; the description is 14px in
  `--harmo-color-text-secondary`, 8px below it. The close button is a tertiary
  icon [Button](button.md) at the title's end.
- The footer holds its actions at its end, 8px apart, 20px below the body.
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
  and back to what opened it as it closes. Escape closes it. Tab can step out
  to the browser's own toolbar, as with any native dialog, but not into the
  page.
- Its title names it, through `aria-labelledby`, and its description describes
  it.
- The close button is an icon, so it needs `aria-label`, in the app's
  language: Harmo builds in no text.

## What a script does

None to open, close, or focus it. The example script:

| Behavior | What it does |
| --- | --- |
| Fading out | Holds the dialog's `cancel` event, which Escape, a click outside, and `command="request-close"` send first, and a form sent with `method="dialog"`, its own or its submit button's `formmethod`, unless the app's own handler has stopped it, such as to confirm unsaved changes; sets `data-closing` until the fade has played, then closes it. The browser lets a page hold Escape only after the person has used it, so a dialog that opened by itself closes at once on its first Escape. |
| Opening from a link | See below |

For the "Opened from a link" example, it stands in for an app's router: it opens the dialog that `?dialog=` names on load and
on Back, adds the parameter when its link is followed, and on closing goes
back, or takes the parameter off when the dialog was opened straight from a
link, leaving the URL's other parameters. A click with a modifier key is left
to the browser, so the link can open in a new tab.

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
| `open`, `onOpenChange` | Its state, held by you, for code or a URL; `onOpenChange` is called each way it opens or closes |
| `onToggle`, `onBeforeToggle` | The dialog's own `toggle` and `beforetoggle` events, as a native `ToggleEvent`; `onBeforeToggle` can stop it opening |
| `footer` | What goes in the footer, usually buttons |
| `form` | Props for a `<form>` around the body and footer, such as `{ method: "dialog" }` or `onSubmit` |
| `bodyProps` | Props for the body, such as `{ tabIndex: 0 }` |
| `closedby` | `"any"` by default, or `"closerequest"` |
| `id` | Its id, for a button elsewhere to open it |

`<DialogClose>` makes the button inside it close the dialog. Every way it
closes fades it out first, as the example script does, setting `open` to
`false` included; setting it back to `true` while it fades keeps it open. An
`onCancel` that calls `preventDefault()`, such as to confirm unsaved changes,
keeps it open on Escape, a click outside, and `command="request-close"`.

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
the URL's others as they are:

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
      <Link href={`?${withDialog}`} onClick={() => setLinked(true)}>
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

## Tokens

`--harmo-border-radius`, `--harmo-color-background`, `--harmo-color-border`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-dialog-backdrop-color`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-ease-out-cubic`, `--harmo-focus-outline`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-lg`,
`--harmo-font-size-sm`, `--harmo-font-weight-bold`.
