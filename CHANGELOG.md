# Changelog

What changed in each release of Harmo's three packages, `@harmo-ui/css`,
`@harmo-ui/react`, and `harmo-ui`, which are released together, at the same
version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/): until 1.0, a
minor version may change an API, and says how to upgrade when it does.

## [Unreleased]

### Added

- Combobox: `<div class="hcombobox">` with an Input of `role="combobox"`, and a
  Listbox in a popup, or `<Combobox>`, a text field that filters a list as you
  type: to pick one of its options, or, with `freeText`, to be helped by it.
  The arrow keys move through the list while focus stays in the field, Enter
  picks, and Escape closes the list, then empties the field. Field's
  `control="combobox"` names the field and its list. With `data-multiple`, or
  `multiple`, it chooses several, each a Tag in the field with a remove
  button, as in an email's To field, and stays one row high: the tags that
  fit, then "+N" for the rest, or, while you're in it, every tag in a row
  that scrolls. With free text too, typed text, such as an address, is a
  choice of its own.

  ```html preview
  <div>
    <div class="hcombobox" style="anchor-name: --changelog-assignee">
      <input class="hinput" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-label="Assign to" placeholder="Search agents" value="" />
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
    </div>
  </div>
  ```

- Command Menu: `.hcommand-menu`, or `<CommandMenu>`, places to go and
  things to do, found by typing, such as pages, settings, and "New ticket",
  and results your app finds as you type, such as customers. Under a Search
  field, its list opens in a popup, as in a dashboard's header; with `modal`,
  a button that looks like a Search field opens it in a dialog near the top
  of the window, as on a website. Typing filters by each option's label,
  description, and keywords, and marks what matched; the arrow keys move
  while focus stays in the field, and Enter goes to the highlighted one. A
  shortcut, such as ⌘K or /, reaches it from anywhere on the page. Under a
  field, its list opens and closes at once, as it's opened many times a day;
  the dialog fades in as a Dialog does.

  ```html preview
  <div style="display: grid; gap: 12px; inline-size: 20rem">
    <div class="hsearch">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <input class="hinput" type="text" aria-label="Search" placeholder="Search" />
      <kbd class="hkbd" aria-hidden="true">/</kbd>
    </div>
    <button class="hcommand-menu-trigger" type="button">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <span class="hcommand-menu-trigger-label">Search documentation</span>
      <kbd class="hkbd" aria-hidden="true">Ctrl K</kbd>
    </button>
  </div>
  ```

- Listbox: an option's description under its label, as `.hoption-text`
  holding the label and a `.hoption-description`, or `<Option description>`,
  and `<mark class="hoption-match">` for what a search found in either.
  `<Option keywords>` are words a search finds it by that it doesn't show,
  such as "billing" for Plans, and `<OptionGroup filter={false}>` keeps a
  search from hiding its options, such as results your app found for it. A
  search, in a Select, a Combobox, or a Command Menu, finds an option by its
  label, description, and keywords.

  ```html preview
  <div>
    <ul class="hlistbox" role="listbox" aria-label="Go to" style="inline-size: 18rem">
      <li class="hoption" role="option" aria-selected="false" data-active>
        <span class="hoption-text"><span class="hoption-label"><mark class="hoption-match">An</mark>alytics</span> <span class="hoption-description">Reports</span></span>
      </li>
      <li class="hoption" role="option" aria-selected="false">
        <span class="hoption-text"><span class="hoption-label">Pl<mark class="hoption-match">an</mark>s</span> <span class="hoption-description">Settings</span></span>
      </li>
    </ul>
  </div>
  ```

- Search: `<div class="hsearch">` around an Input with `type="search"`, or
  `<Search>`, a field for searching, such as above a list: filled in gray,
  with a magnifier at its start and an optional clear button at its end once
  there's text. Escape empties it too, and stops there, so a dialog around it
  stays open. A Kbd after the input shows the shortcut that reaches it, such
  as /.

  ```html preview
  <div>
    <div class="hsearch">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <input class="hinput" type="search" placeholder="Search conversations" aria-label="Search conversations" />
    </div>
  </div>
  ```

- Section: `<section class="hsection">`, or `<Section>`, a part of a page,
  such as a group of settings: its title, an optional description, and
  optional actions at its end, over a line, then its content, stacked. It
  styles only its own parts, and names itself by its title, so screen readers
  can jump to it.

  ```html preview
  <div>
    <section class="hsection" aria-labelledby="widget-title">
      <header class="hsection-header">
        <div class="hsection-text">
          <h2 class="hsection-title" id="widget-title">Chat widget</h2>
          <p class="hsection-description">How the widget greets people on your site.</p>
        </div>
        <div class="hsection-actions">
          <button class="hbutton" data-variant="secondary" type="button">
            <span class="hbutton-label">Preview</span>
          </button>
          <button class="hbutton" type="button">
            <span class="hbutton-label">Save changes</span>
          </button>
        </div>
      </header>
      <div class="hsection-body">
        <div class="hfield">
          <label class="hlabel" for="widget-greeting">Greeting</label>
          <input class="hinput" id="widget-greeting" type="text" value="Hi! How can we help?" />
        </div>
      </div>
    </section>
  </div>
  ```

- Tag: `.htag-remove`, or `<TagRemove>`, a button after the text that
  removes the tag, such as a filter: a 12px cross with a 24px target, named
  in your app's language.

  ```html preview
  <div>
    <span class="htag">
      Billing
      <button class="htag-remove" type="button" aria-label="Remove Billing">
        <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
      </button>
    </span>
  </div>
  ```

- Tag List: `<ul class="htag-list">`, or `<TagList>`, tags in one row that
  never wraps, such as a ticket's tags in a table: as many as fit its width,
  then "+N" for the rest, which shows them on hover and keyboard focus. It
  counts again as the width changes.

  ```html preview
  <div>
    <ul class="htag-list" style="inline-size: 16rem">
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
          <button class="htag-list-count" type="button" aria-label="2 more" aria-describedby="changelog-tags-more">+2</button>
          <span class="htooltip" data-variant="hint" role="tooltip" id="changelog-tags-more">
            <span class="htag-list-rest">
              <span class="htag">Partner</span>
              <span class="htag">Urgent</span>
            </span>
          </span>
        </span>
      </li>
    </ul>
  </div>
  ```

- Tooltip: `data-open` on `.htooltip-trigger` shows it until removed, for a
  tooltip a press pins open, as on a touch screen, which neither hovers nor
  shows keyboard focus. A Tag List's "+N" uses it.

  ```html preview
  <div>
    <span class="htooltip-trigger" data-open>
      <button class="hbutton" data-variant="secondary" type="button" aria-describedby="changelog-pinned-tip">
        <span class="hbutton-label">Export</span>
      </button>
      <span class="htooltip" role="tooltip" id="changelog-pinned-tip">Download the current view as CSV</span>
    </span>
  </div>
  ```

### Changed

- A list's message for no matches is a status, so a screen reader reads it
  as it appears: `.hlistbox-empty` gets `role="status"` and is in the page
  from the start, empty until nothing matches. `<Listbox>`, `<Select>`,
  `<FilterChip>`, and `<Combobox>` do this themselves. In HTML, render it
  empty after the list, and fill it when nothing matches, rather than add it
  then.

  In 0.3.0, added when nothing matches:

  ```html
  <p class="hlistbox-empty">No agents found</p>
  ```

  In 0.4.0, in the page from the start, and filled when nothing matches:

  ```html
  <p class="hlistbox-empty" role="status"></p>
  ```

### Fixed

- A list, in a Select or a popup, keeps its keyboard highlight when it opens
  or moves under a pointer at rest; leaving it clears the highlight only once
  the pointer has moved in it.
- `<OptionGroup hidden>` hides the group and its options: it showed them,
  and the arrow keys reached them. The example script, `listbox.js`, skips
  the options of a hidden group too.

## [0.3.0] - 2026-11-07

Three overlays, Dialog, Drawer, and Toast, and destructive buttons, with
hold to confirm.

### Added

- Dialog: `<dialog class="hdialog">`, or `<Dialog>`, a modal window for a task
  or a decision. A button opens it with `commandfor` and
  `command="show-modal"`, or with React's `trigger`; code or a URL can open it
  with `open` and `onOpenChange`. The browser holds the page behind, moves
  focus in and back out, and closes it on Escape, and with `closedby="any"`, on
  a click outside. It opens in 200ms, growing from 95%, and fades out in 150ms
  before it closes, in every browser: the React Dialog, or the example script
  with plain HTML, holds the close until the fade has played.
  `<DialogClose>` makes a button close it.

  ```html preview
  <div>
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
          <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
        </button>
      </header>
      <form method="dialog">
        <div class="hdialog-body">
          <div class="hfield">
            <label class="hlabel" for="invite-email">Email</label>
            <input class="hinput" id="invite-email" name="email" type="email" autocomplete="email" autofocus />
          </div>
        </div>
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
  </div>
  ```
- Drawer: `<dialog class="hdrawer">`, or `<Drawer>`, a modal panel at the
  window's end edge, the full height of the window, for a form or details. It
  opens, closes, and takes focus as Dialog does, slides in and out, and has a
  body that scrolls, a footer under it, and an optional aside beside them,
  such as a preview. `<DrawerClose>` makes a button close it.

  ```html preview
  <div>
    <button class="hbutton" type="button" commandfor="reply-drawer" command="show-modal">
      <span class="hbutton-label">New quick reply</span>
    </button>
    <dialog class="hdrawer" id="reply-drawer" closedby="closerequest"
      aria-labelledby="reply-drawer-title">
      <header class="hdrawer-header">
        <h2 class="hdrawer-title" id="reply-drawer-title">New quick reply</h2>
        <button class="hbutton hdrawer-close" data-variant="tertiary" type="button"
          commandfor="reply-drawer" command="request-close" aria-label="Close">
          <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
        </button>
      </header>
      <form method="dialog">
        <div class="hdrawer-body">
          <div class="hfield">
            <label class="hlabel" for="reply-shortcut">Shortcut</label>
            <input class="hinput" id="reply-shortcut" name="shortcut" type="text" autofocus />
          </div>
        </div>
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
  </div>
  ```
- Toast: `toast()` and `<Toaster>`, or `<section class="htoaster">` with a
  script, a short message at the bottom of the window that goes away by
  itself, with an icon by status, an optional description, and an optional
  action. Toasts stack, newest in front, spread out on hover, a tap, or F8,
  and leave one at a time; the same id changes a toast in place, and its box
  changes shape with a spring. They show at the bottom center, or at the top
  or bottom, at the start, center, or end. While a Dialog or Drawer is open,
  toasts show inside it, where they can be used. Inspired by
  [Sonner](https://sonner.emilkowal.ski), by
  [Emil Kowalski](https://emilkowal.ski), and its change of shape by the
  Dynamic Island in his [Animations on the Web](https://animations.dev)
  course.

  ```html preview
  <div>
    <button
      class="hbutton"
      data-variant="secondary"
      type="button"
      data-example-toast-status="success"
      data-example-toast-title="Quick reply saved"
      data-example-toast-description="Type /ship in a chat to use it."
    >
      <span class="hbutton-label">Save quick reply</span>
    </button>
  </div>
  ```

  In an app, `toast()` sends one, with `<Toaster>` once near the root:

  ```tsx
  toast({
    status: "success",
    title: "Quick reply saved",
    description: "Type /ship in a chat to use it.",
  });
  ```
- Destructive buttons: Button's `destructive`, or `data-destructive`, red in
  any variant, for an action that destroys something.

  ```html preview
  <div>
    <button class="hbutton" data-destructive type="button">
      <span class="hbutton-label">Delete workspace</span>
    </button>
    <button class="hbutton" data-variant="secondary" data-destructive type="button">
      <span class="hbutton-label">Remove member</span>
    </button>
    <button class="hbutton" data-variant="tertiary" data-destructive type="button">
      <span class="hbutton-label">Discard draft</span>
    </button>
  </div>
  ```
- Hold to confirm: Button's `onHold`, or `data-hold` with a `.hbutton-hold`
  fill, for an action that's hard to undo, such as "Hold to delete". Held
  for 1.5 seconds (`holdDuration`), by pointer or by Enter or Space, its
  fill wipes across, red on a destructive button and the accent on any
  other, and the action runs. A screen reader's press runs it at once.

  At rest, and held all the way (`data-held`). Its script does the holding;
  this one has none, so it shows the two looks without holding:

  ```html preview
  <div>
    <button class="hbutton" data-variant="secondary" data-size="small" data-destructive type="button" data-hold>
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
      <span class="hbutton-label">Hold to delete</span>
      <span class="hbutton-hold" aria-hidden="true">
        <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
        <span class="hbutton-label">Hold to delete</span>
      </span>
    </button>
    <button class="hbutton" data-variant="secondary" data-size="small" data-destructive type="button" data-hold data-held>
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
      <span class="hbutton-label">Hold to delete</span>
      <span class="hbutton-hold" aria-hidden="true">
        <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
        <span class="hbutton-label">Hold to delete</span>
      </span>
    </button>
  </div>
  ```

  In React:

  ```tsx
  <Button variant="secondary" size="small" destructive loading={deleting} onHold={remove}>
    <TrashIcon className="hicon" />
    {deleting ? "Deleting" : "Hold to delete"}
  </Button>
  ```
- Button's `commandfor` and `command` props, for the button's command on
  another element, such as opening a dialog:

  ```tsx
  <Button commandfor="invite-dialog" command="show-modal">
    Invite people
  </Button>
  ```
- Tokens: `--harmo-dialog-backdrop-color`, and `--harmo-font-size-lg`, 20px,
  for a dialog's title; `--harmo-ease-spring`, a spring with about 3%
  overshoot; and `--harmo-toast-duration`, `--harmo-toast-ease`, and
  `--harmo-toast-morph-duration`; `--harmo-color-danger-background` and
  `--harmo-color-danger-border`, a tint and border around danger text; and
  `--harmo-color-danger-fill`, `-hover`, `-active`, and
  `--harmo-color-on-danger`, for a destructive button.

### Changed

- A Button's width changes over 200ms when its text or loading state does,
  rather than jumping, and its spinner fades in.
- An icon beside a Button's label sits 3px further in, so it looks as far
  from the border as the label's text.
- The Settings list is a component, under Forms, rather than a pattern. Its
  page moved to `docs/components/settings.md`.

## [0.2.0] - 2026-11-06

Dark mode, eight accents, a theme for any brand color with
`npx harmo-ui theme`, and two new components, Kbd and Card.

### Upgrading

- **Buttons and switches use the new fill tokens.** A primary button's colors
  are now `--harmo-color-primary-fill`, `--harmo-color-primary-fill-hover`, and
  `--harmo-color-primary-fill-active`, and a switch's is
  `--harmo-color-primary-fill`. On `:root` they follow your
  `--harmo-color-primary`: the fill is the primary, one step darker on hover and
  another when pressed.

  What you'll notice: if you set `--harmo-color-primary-hover` or
  `--harmo-color-primary-active` to restyle buttons, they now hover one step
  darker than your primary, not in your hover color. Set the fill tokens
  instead; the other two still color text and links.

  In 0.1.1:

  ```css title="globals.css"
  :root {
    --harmo-color-primary: #0f75b6;
    --harmo-color-primary-hover: #0265a0;
    --harmo-color-primary-active: #005589;
  }
  ```

  In 0.2.0:

  ```css title="globals.css"
  :root {
    --harmo-color-primary: #0f75b6;
    --harmo-color-primary-fill-hover: #0265a0;
    --harmo-color-primary-fill-active: #005589;
  }
  ```

  Or run `npx harmo-ui theme "#0f75b6"`, which sets every role, in light and
  dark mode.
- **A theme on an element needs the fill tokens there too.** A token built from
  another is worked out on `:root`, so on an element, the fills don't follow a
  primary set there.

  What you'll notice: in a section you colored with `--harmo-color-primary`,
  what uses the primary itself takes the color, such as an accent tag, but
  buttons and switches stay purple:

  ```html preview
  <section style="--harmo-color-primary: light-dark(#0f75b6, #30aed9)">
    <span class="htag" data-variant="accent">Unread</span>
    <button class="hbutton" type="button">
      <span class="hbutton-label">Save</span>
    </button>
    <input class="hswitch" type="checkbox" role="switch" checked aria-label="Email recaps" />
  </section>
  ```

  Set the fills on the section as well:

  ```html preview
  <section
    style="
      --harmo-color-primary: light-dark(#0f75b6, #30aed9);
      --harmo-color-primary-fill: light-dark(#0f75b6, #1f6bb0);
      --harmo-color-primary-fill-hover: light-dark(#0a5d92, #2478c4);
      --harmo-color-primary-fill-active: light-dark(#064c79, #1b62a0);
    "
  >
    <span class="htag" data-variant="accent">Unread</span>
    <button class="hbutton" type="button">
      <span class="hbutton-label">Save</span>
    </button>
    <input class="hswitch" type="checkbox" role="switch" checked aria-label="Email recaps" />
  </section>
  ```

  An accent on the section, such as `data-harmo-accent="blue"`, sets them for
  you.

### Added

- Dark mode. Every color is a light and dark pair, through `light-dark()`. A
  page stays light until it opts in with `color-scheme: dark`, or
  `color-scheme: light dark` to follow the system, on `:root` or on any part of
  the page.
- Accents. `data-harmo-accent` on `<html>`, or on any element, recolors what's
  inside it: `purple` (the default), `blue`, `teal`, `green`, `amber`, `red`,
  `pink`, or `mono`, which is black, or near-white in dark mode. Each passes
  WCAG AA in every role, in both modes. `index.css` includes them, and
  `npx harmo-ui add` copies `accents.css` with `tokens.css`; with
  per-component imports, load `accents.css` after `tokens.css`.
- `npx harmo-ui theme "<hex>"`, which writes `harmo-theme.css`: your brand
  color in every role, in light and dark mode, at WCAG AA, adapted from the
  nearest accent. It adds the file to `harmo.css` when there is one.
- Kbd: `<kbd class="hkbd">`, or `<Kbd>`, for a key or shortcut, such as Enter
  or ⌘K, in text or on a button.
- Card: `.hcard`, or `<Card>`, a frame around a group of content, tinted by
  default, `raised`, or `ghost` for rows that lead somewhere.
- Tokens: `--harmo-color-primary-fill`, `-fill-hover`, and `-fill-active`, for
  what has white text on it, Button and Switch;
  `--harmo-link-hover-text-decoration`; and `--harmo-card-padding`.

### Changed

- A primary button is one step darker on hover and another when pressed, and
  in dark mode one step lighter on hover, instead of turning dark purple.
- `@harmo-ui/react` declares `"sideEffects": false`, so a bundler can leave out
  the components an app doesn't use.
- The packages' npm pages link to [harmo-ui.com](https://harmo-ui.com).

### Fixed

- A popup, and the list inside it, stay 8px from the window's edge, as on a
  phone, and a list fills a popup wider than its 32rem cap.
- An open list no longer shows the browser's own focus ring, clipped by its
  popup. When the list has keyboard focus and no option is highlighted, its
  popup shows Harmo's focus ring.
- The React README shows `HarmoProvider` in a Client Component, as the Next.js
  App Router needs.

## [0.1.1] - 2026-11-03

The first release on npm: 26 components and the Settings list pattern, in
CSS and React, and `npx harmo-ui add`.

### Added

- `@harmo-ui/css`: Avatar, Banner, Breadcrumb, Button, Checkbox,
  ChevronToArrow, Expand chevron, Field, Filter chip, Icons, Input, Link,
  Listbox, Meter, Password input, Popup, Radio, Segmented control, Select,
  Spinner, Status, Switch, Tabs, Tag, TextArea, and Tooltip, and the Settings
  list pattern, themed with `--harmo-*` custom properties.
- `@harmo-ui/react`: the same components in React, rendering the same markup.
- `harmo-ui`: `npx harmo-ui add <component>`, which copies components, with
  their styles and what they need, into a project.

[Unreleased]: https://github.com/windrunner21/harmo/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/windrunner21/harmo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/windrunner21/harmo/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/windrunner21/harmo/releases/tag/v0.1.1
