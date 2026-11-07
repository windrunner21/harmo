# Command Menu

Places to go and things to do, found by typing: pages, settings, and actions
such as "New ticket", and results your app finds as you type, such as
customers. It comes in two forms:

- **Under a Search field**, as in a dashboard's header: a [Search](search.md)
  field whose list opens in a [Popup](popup.md) under it.
- **In a dialog**, as on a website: a button that looks like a Search field
  opens a [Dialog](dialog.md) near the top of the window, with the field and
  the whole list.

Either way, typing filters the list by each option's label, its description,
and its keywords, and marks what matched; the arrow keys move through it while
focus stays in the field, and Enter goes to the highlighted one. A shortcut,
such as <kbd>⌘K</kbd> or <kbd>/</kbd>, reaches it from anywhere on the page.
It's the WAI-ARIA editable combobox with list autocomplete, like a
[Combobox](combobox.md), except that a pick goes somewhere rather than becomes
a value.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `command-menu.css`, `listbox.css`, `kbd.css`; under a field, `search.css`, `input.css`, and `popup.css`; in a dialog, `dialog.css` |
| Element | Under a field: `<div class="hsearch">` holding a magnifier, `<input class="hinput" type="text" role="combobox">`, and a [Kbd](kbd.md) for the shortcut; then `<div class="hpopup hcommand-menu" popover="manual">` holding a [Listbox](listbox.md). In a dialog: `<button class="hcommand-menu-trigger">`, then `<dialog class="hdialog hcommand-menu">` holding a `.hlistbox-search` row with `<input class="hlistbox-search-input" type="text" role="combobox">`, and a Listbox |
| Parts | On the input: `aria-autocomplete="list"`, `aria-expanded` (always `true` in a dialog), `aria-controls` naming the list, and `autocomplete="off"`. Under a field, `anchor-name` on `.hsearch`, and the same name as the popup's `position-anchor`. In a dialog, the trigger's `commandfor` names the dialog, with `command="show-modal"` and `aria-haspopup="dialog"`, and the dialog has `closedby="any"`. Optional: `.hlistbox-empty` after the list, and `.hcommand-menu-footer` with the keys to use |
| Required | A name: `aria-label` on the input and the list, and in a dialog, on the dialog too. With a shortcut, `aria-keyshortcuts` on the input, or on the trigger, and `aria-hidden="true"` on its `.hkbd` |
| Unique | Every id, and each anchor name; one Command Menu for each shortcut on a page |
| Script | Required: opening, filtering, the keyboard, picking, and the shortcut; see [What a script does](#what-a-script-does) |

## Markup

Under a Search field:

```html
<div class="hsearch" style="anchor-name: --header-search">
  <svg class="hicon" …>…</svg>
  <input class="hinput" type="text" role="combobox" autocomplete="off"
    aria-autocomplete="list" aria-expanded="false" aria-controls="header-search-listbox"
    aria-label="Search" aria-keyshortcuts="/" placeholder="Search" value="" />
  <kbd class="hkbd" aria-hidden="true">/</kbd>
</div>
<div class="hpopup hcommand-menu" popover="manual" style="position-anchor: --header-search">
  <ul class="hlistbox" id="header-search-listbox" role="listbox" aria-label="Search">
    <li class="hoption-group" role="presentation">
      <span class="hoption-group-label" id="header-search-go">Go to</span>
      <ul role="group" aria-labelledby="header-search-go">
        <li class="hoption" id="header-search-tickets" role="option" aria-selected="false">
          <span class="hoption-text">
            <span class="hoption-label">Tickets</span>
            <span class="hoption-description">All tickets</span>
          </span>
          <span class="hoption-badge">Current</span>
        </li>
        …
      </ul>
    </li>
    …
  </ul>
  <p class="hlistbox-empty" role="status"></p>
  <div class="hcommand-menu-footer">
    <span><kbd class="hkbd">Enter</kbd> to open</span>
    <span><kbd class="hkbd">↑</kbd> <kbd class="hkbd">↓</kbd> to move</span>
  </div>
</div>
```

In a dialog:

```html
<button class="hcommand-menu-trigger" type="button" commandfor="docs-search"
  command="show-modal" aria-haspopup="dialog" aria-keyshortcuts="Control+K">
  <svg class="hicon" …>…</svg>
  <span class="hcommand-menu-trigger-label">Search documentation</span>
  <kbd class="hkbd" aria-hidden="true">Ctrl K</kbd>
</button>
<dialog class="hdialog hcommand-menu" id="docs-search" closedby="any"
  aria-label="Search documentation">
  <div class="hlistbox-search">
    <svg class="hicon" …>…</svg>
    <input class="hlistbox-search-input" type="text" role="combobox" autocomplete="off"
      aria-autocomplete="list" aria-expanded="true" aria-controls="docs-search-listbox"
      aria-label="Search documentation" placeholder="Search documentation" value="" />
  </div>
  <ul class="hlistbox" id="docs-search-listbox" role="listbox" aria-label="Search documentation">
    …
  </ul>
  <p class="hlistbox-empty" role="status"></p>
  <div class="hcommand-menu-footer">…</div>
</dialog>
```

The options are a [Listbox](listbox.md)'s, in groups such as "Go to" and
"Create", each with its description in `.hoption-text`, and a badge such as
"Current" for where you are. Nothing is ever selected: every option has
`aria-selected="false"`. Results your app finds, such as customers, go in a
group of their own; to see them all, end it with an option such as "View all
customers".

## Options

| Hook | Effect |
| --- | --- |
| `.hpopup.hcommand-menu` | Under a field: as wide as the field, and at least 24rem where the window has room, up to 480px high |
| `.hdialog.hcommand-menu` | In a dialog: 640px wide at most, near the top of the window (12% of its height, at most 120px), so the field stays put as the list grows and shrinks; up to 36rem high, with the list scrolling |
| `.hkbd` at the end of `.hsearch`, or of the trigger | The shortcut, as a hint; not shown on a device that can't hover, such as a phone, which has no keyboard to press it |
| `.hlistbox-empty` after the list | The status when nothing shows, `role="status"`, in the page from the start and empty: such as "No results", or "Searching…" while your app looks |
| `.hcommand-menu-footer` | The keys to use, each in a span with its [Kbd](kbd.md)s, in your app's language; hidden while nothing shows, and on a device that can't hover |
| `readonly` on the input | Read-only: under a field, the list stays closed, and neither Escape nor leaving empties the text |
| `hidden` on `.hsearch` or the trigger | Hidden, as anything is; the script leaves its shortcut to the page |

## Appearance and states

- Under a field, the field is a [Search](search.md) field, with the shortcut
  10px in from its end. The list opens below it, or above where there's more
  room, as a [Popup](popup.md) does; while it's open, the field has its focus
  ring, as a Combobox's does.
- Under a field, the list opens and closes at once, without a Popup's fade
  and slide: it's opened many times a day, often from the keyboard, where any
  motion makes it feel slow. The dialog, opened less often, fades and grows
  in as a [Dialog](dialog.md) does.
- In a dialog, the trigger looks like a Search field: the secondary
  background, the magnifier, its text in the secondary color, and the
  shortcut at its end. It shows its border on hover and its ring on keyboard
  focus. The dialog has no title or padding of its own: the field, at the
  page's text size, is its top row, over a border.
- Each option shows its label in the text color, and its description under
  it, smaller, each cut to one line. What's typed is marked in both, in the
  primary tint.
- The highlighted option is shown as in any [Listbox](listbox.md); options
  keep no room for a check.

## Accessibility

- The field is a `combobox`: focus stays in it the whole time, and
  `aria-activedescendant` names the highlighted option, so a screen reader
  reads it as the arrow keys move. An option is read with its description
  and its badge, such as "Tickets, All tickets, Current".
- The field, its list, and in a dialog the dialog itself share one name.
- Keys:

  | Key | Does |
  | --- | --- |
  | Typing | Filters the list, and highlights the first match; under a field, opens the list |
  | ↓ / ↑ | Move through the list; under a field, open it at the first option, or the last |
  | Enter | Goes to the highlighted option: the list or the dialog closes, and the field empties. With none, nothing happens, and a form around it isn't sent |
  | Escape | Under a field, closes the list; closed, empties the field. In a dialog, closes it, as Escape does any dialog |
  | The shortcut | Opens the dialog, or moves focus to the field and opens its list; pressed again, takes focus back to the field |

- A shortcut with ⌘, written `Mod`, is ⌘ on Apple devices and Ctrl elsewhere,
  and works anywhere on the page; a key alone, such as <kbd>/</kbd>, works
  only where it isn't typed into a field. A key alone also needs a way for
  people to turn it off or change it, as WCAG 2.1.4 asks, since it fires on
  its own for someone using speech input: a setting in your app, such as the
  Default example's switch, which leaves out the shortcut while it's off. `aria-keyshortcuts` names it for
  the device, such as `Meta+K` or `Control+K`, which screen readers announce;
  the `.hkbd` shows it, hidden from them, so it isn't read twice.
- When nothing shows, the status says so, and a screen reader reads it as it
  appears, as it does "Searching…" while your app looks.
- In a dialog, closing it, by a pick, Escape, or a click outside, returns
  focus to where it was before it opened: the trigger, or, opened by the
  shortcut, what had focus then.

## What a script does

| Change | When |
| --- | --- |
| Hide the options whose label, description, and keywords don't hold the text, and the groups left with none; mark the text in each label and description (`<mark class="hoption-match">`); highlight the first match (`data-active`, and `aria-activedescendant` on the field); put the message in the status when nothing shows, and empty it otherwise | On typing |
| Under a field: show the popup and set `aria-expanded`; with nothing to show and no status, keep it closed | On typing, a click on the field, ↓ or ↑, and the shortcut |
| Under a field: close the popup, and empty the field | Escape closes; again, it empties. Leaving the field does both, unless the window lost focus |
| In a dialog: open it with `showModal()`, or focus the field when it's open | On the shortcut; its trigger opens it itself |
| In a dialog: empty the field, and show the whole list again | Once the dialog has closed, so the list doesn't change as it fades |
| Highlight the first option | As the popup or the dialog opens |
| Close the popup and empty the field, or close the dialog with `requestClose()`, as Escape does; then go where the option leads | On a pick, by Enter or a click |
| Keep the pointer from taking focus from the field | On a press in the list |
| Set `aria-keyshortcuts` for the device, and the `.hkbd`'s text | As the page loads |
| Leave the key to the page, and the browser | While the shortcut is off, or the menu is hidden or disabled |

`examples/html/src/scripts/command-menu.js` is an example script for it, with
`listbox.js` for the list, `popup.js` for where the popup opens, and
`dialog.js` for the dialog's exit.

## React

`<CommandMenu>` renders the field and its popup, or, with `modal`, the trigger
and the dialog. Its children are [Listbox](listbox.md#react) `<Option>`s and
`<OptionGroup>`s; give an option a `description`, and `keywords` it's found
by too, and give a group of your results `filter={false}`, so they show as
you send them. Other props are the input's attributes.

| Prop | Effect |
| --- | --- |
| `label` | Required: the name of the field, its list, and the dialog, such as "Search" |
| `placeholder` | The field's placeholder, and in a dialog the trigger's text; without it, or empty, the trigger shows the `label` |
| `modal` | In a dialog, opened by a trigger that looks like a Search field |
| `open`, `onOpenChange` | With `modal`: whether the dialog is open, held by you, and when it opens or closes |
| `shortcut` | The keys that reach it, as `{ keys, label }`: `keys` as `aria-keyshortcuts` writes them, with `Control`, `Meta`, `Shift`, `Alt`, and `Mod` for ⌘ on Apple devices and Ctrl elsewhere, such as `"Mod+K"`, or a key alone, such as `"/"`; any other modifier is an error. `label` is what its Kbd shows, the same everywhere, or `{ apple, other }`, such as `{ apple: "⌘K", other: "Ctrl K" }`. Leave it out to turn the shortcut off, as a key alone needs a way to be |
| `onPick` | Called with the picked option's value as the list or the dialog closes: go there, such as with your router |
| `inputValue`, `onInputChange` | The field's text, held by you, such as to look for results as it changes |
| `filter` | `false` leaves all the filtering to you: every option you render shows |
| `emptyMessage` | The status shown, and read, when nothing shows, such as "No results", or "Searching…" while you look |
| `hints` | The keys to use, at the end of the list, such as `<span><Kbd>Enter</Kbd> to open</span>` |
| `disabled` | The field, or the trigger, can't be used, and the shortcut is left to the page |
| `hidden` | Hides the field, or the trigger, and closes the list or the dialog; the shortcut is left to the page |
| `readOnly` | Under a field, the list stays closed, and the text stays |

```tsx
<CommandMenu
  label="Search"
  placeholder="Search"
  shortcut={{ keys: "Mod+K", label: { apple: "⌘K", other: "Ctrl K" } }}
  onInputChange={setQuery}
  onPick={(value) => router.push(paths[value])}
  emptyMessage={searching ? "Searching…" : "No results"}
  hints={<span><Kbd>Enter</Kbd> to open</span>}
>
  <OptionGroup label="Go to">
    <Option value="tickets" description="All tickets" badge="Current">
      Tickets
    </Option>
    <Option value="plans" description="Settings" keywords={["billing"]}>
      Plans
    </Option>
  </OptionGroup>
  <OptionGroup label="Customers" filter={false} hidden={customers.length === 0}>
    {customers.map((customer) => (
      <Option key={customer.id} value={customer.id} description={customer.email}>
        {customer.name}
      </Option>
    ))}
    <Option value="all-customers">View all customers</Option>
  </OptionGroup>
</CommandMenu>

<CommandMenu modal label="Search documentation" placeholder="Search documentation" …>
  …
</CommandMenu>
```

An option goes somewhere by `onPick`, not by a link: ⌘-click and a middle
click don't open it in a new tab.

## Tokens

`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-color-primary-tint`, `--harmo-color-border`, and those of Search,
Popup, Dialog, Listbox, and Kbd.
