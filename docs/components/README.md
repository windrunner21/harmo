# Components

Markup and styling contracts for `@harmo-ui/css`. Each page lists the markup, the
hooks and attributes that style it, the tokens it reads, and what a script must
handle. Its React section shows the component from `@harmo-ui/react` that renders
the same markup and does what the script would.

| Component | Page |
| --- | --- |
| Accordion | [accordion.md](accordion.md) |
| Avatar | [avatar.md](avatar.md) |
| Banner | [banner.md](banner.md) |
| Breadcrumb | [breadcrumb.md](breadcrumb.md) |
| Button | [button.md](button.md) |
| Calendar | [calendar.md](calendar.md) |
| Card | [card.md](card.md) |
| Checkbox | [checkbox.md](checkbox.md) |
| ChevronToArrow | [chevron-to-arrow.md](chevron-to-arrow.md) |
| Combobox | [combobox.md](combobox.md) |
| Command Menu | [command-menu.md](command-menu.md) |
| Copy Button | [copy.md](copy.md) |
| Date Filter | [date-filter.md](date-filter.md) |
| Date Picker | [date-picker.md](date-picker.md) |
| Dialog | [dialog.md](dialog.md) |
| Drawer | [drawer.md](drawer.md) |
| Empty State | [empty-state.md](empty-state.md) |
| Expand Chevron | [expand-chevron.md](expand-chevron.md) |
| Field, Label, Description, Optional, Error | [field.md](field.md) |
| File Input | [file-input.md](file-input.md) |
| File List | [file-list.md](file-list.md) |
| Filter Bar | [filter-bar.md](filter-bar.md) |
| Filter Chip | [filter-chip.md](filter-chip.md) |
| Filters | [filters.md](filters.md) |
| Icons (`.hicon`, `.hchevron`) | [icons.md](icons.md) |
| Input | [input.md](input.md) |
| Kbd | [kbd.md](kbd.md) |
| Language Picker | [language-picker.md](language-picker.md) |
| Link | [link.md](link.md) |
| Listbox | [listbox.md](listbox.md) |
| Menu Button | [menu-button.md](menu-button.md) |
| Meter | [meter.md](meter.md) |
| Navigation Menu | [navigation-menu.md](navigation-menu.md) |
| OTP Input | [otp-input.md](otp-input.md) |
| Pagination | [pagination.md](pagination.md) |
| Password Input | [password.md](password.md) |
| Phone Input | [phone-input.md](phone-input.md) |
| Popup | [popup.md](popup.md) |
| Radio | [radio.md](radio.md) |
| Search | [search.md](search.md) |
| Section | [section.md](section.md) |
| Segmented Control | [segmented.md](segmented.md) |
| Select | [select.md](select.md) |
| Selection Bar | [selection-bar.md](selection-bar.md) |
| Settings List | [settings.md](settings.md) |
| Sidebar | [sidebar.md](sidebar.md) |
| Spinner | [spinner.md](spinner.md) |
| Stat | [stat.md](stat.md) |
| Status | [status.md](status.md) |
| Switch | [switch.md](switch.md) |
| Table | [table.md](table.md) |
| Table of Contents | [table-of-contents.md](table-of-contents.md) |
| Tabs | [tabs.md](tabs.md) |
| Tag | [tag.md](tag.md) |
| Tag List | [tag-list.md](tag-list.md) |
| TextArea | [textarea.md](textarea.md) |
| Time Picker | [time-picker.md](time-picker.md) |
| Toast | [toast.md](toast.md) |
| Toolbar | [toolbar.md](toolbar.md) |
| Tooltip | [tooltip.md](tooltip.md) |

## Page structure

Every component page has the same sections, in this order; a page leaves out
Options when nothing changes the component.

1. **Purpose**, under the title: what it's for, and what to use instead.
2. **Contract**: a table with the same six rows on every page, so an agent or
   a person can build correct markup at a glance:
   - **CSS**: the files to load besides `tokens.css`;
   - **Element**: the root element and its class;
   - **Parts**: the classes inside it;
   - **Required**: attributes that must be present;
   - **Unique**: what must not repeat on a page, such as ids and anchor names;
   - **Script**: "None", or what a script must do.

   A row with nothing to say reads "None".
3. **Markup**: complete, copyable HTML. Harmo's own drawings, such as the
   chevrons, are written out in full, since the CSS styles their parts; an
   icon the app chooses is shown as `…`.
4. **Options**: a `Hook | Effect` table of the attributes, classes, and
   custom properties that change it.
5. **Appearance and states**: sizes, colors, motion, and every state.
6. **Accessibility**: semantics, naming, keyboard, and screen readers.
7. **What a script does**: a `Change | When` table of what a page must change
   from script, or "None." when CSS covers it; then the example script in
   `examples/html/src/scripts`, if any.
8. **React**: the React component, what it renders, a `Prop | Effect` table
   of its own props, and an example. Other props are the attributes of the
   element named there.
9. **Tokens**: every `--harmo-*` it reads, taken from its stylesheet.

A modal's page, Dialog's and Drawer's, adds **Opening and closing** after
Markup: every way it opens and closes, and what each one plays.

## Loading the CSS

`@harmo-ui/css` (`index.css`) contains the token defaults and every component. For
per-component imports, load `tokens.css` once and then the components you use.
Each component file uses `--harmo-*` properties without defining them.

Token defaults are declared on `:where(:root)`, so an application's own `:root`
overrides win regardless of which stylesheet loads last.

Some components are built from others, so their files need company:

| File | Also load |
| --- | --- |
| `accordion.css` | `expand-chevron.css` |
| `banner.css` | `button.css` for its action |
| `breadcrumb.css` | `link.css`, `chevron.css` |
| `button.css` | `spinner.css` for loading; `chevron-to-arrow.css`, `expand-chevron.css`, `kbd.css`, or `tooltip.css` when used |
| `calendar.css` | `button.css`, `chevron.css` |
| `card.css` | `chevron-to-arrow.css` for a chevron |
| `combobox.css` | `input.css`, `popup.css`, `listbox.css`, `expand-chevron.css`; `field.css` for a label; `tag-list.css`, `tag.css`, and `tooltip.css` to choose several |
| `command-menu.css` | `listbox.css`, `kbd.css`; `search.css`, `input.css`, and `popup.css` under a field; `dialog.css` in a dialog |
| `copy.css` | `button.css`; `tooltip.css` for an icon-only one; `input.css` and `field.css` for a field |
| `date-filter.css` | `filter-chip.css`, `popup.css`, `select.css`, `listbox.css`, `expand-chevron.css`, `input.css`, `date-picker.css`, `calendar.css`, `button.css`, `chevron.css` |
| `date-picker.css` | `input.css`, `button.css`, `popup.css`, `calendar.css`, `chevron.css`; `field.css` for a label |
| `dialog.css`, `drawer.css` | `button.css` for the close button |
| `empty-state.css` | `button.css` for actions |
| `field.css` | The control's own, such as `input.css` or `checkbox.css` |
| `file-input.css` | `button.css`; `avatar.css` for an avatar; `field.css` for a label and a message |
| `file-list.css` | `button.css` for its buttons |
| `filter-chip.css` | `popup.css`; `listbox.css` for a list; `button.css` for a footer or a panel's action; `field.css` and `input.css` for a text panel |
| `filters.css` | `filter-chip.css`, `popup.css`, and those of the filters in it |
| `language-picker.css` | `button.css`, `popup.css`, `listbox.css`, `expand-chevron.css` |
| `link.css` | `chevron.css` or `chevron-to-arrow.css` for an icon |
| `listbox.css` | `popup.css`; `button.css` for a footer or a button that opens it |
| `menu-button.css` | `button.css`; `popup.css` to open a Popup |
| `navigation-menu.css` | `expand-chevron.css` |
| `otp-input.css` | `input.css`; `field.css` for a label |
| `pagination.css` | `button.css`, `chevron.css` |
| `password.css` | `input.css`, `field.css`, `tooltip.css`; `meter.css` for the strength |
| `phone-input.css` | `select.css`, `input.css`, `popup.css`, `listbox.css`, `expand-chevron.css`; `field.css` for a label |
| `search.css` | `input.css`; `field.css` for a label; `kbd.css` for a shortcut |
| `select.css` | `popup.css`, `listbox.css`, `expand-chevron.css`, `field.css` |
| `selection-bar.css` | `button.css` for its actions; `tooltip.css` for a reason one is blocked |
| `settings.css` | The controls it holds, such as `switch.css` |
| `sidebar.css` | `tooltip.css`; `expand-chevron.css` for a group of links |
| `stat.css` | `tooltip.css` for a hint; `link.css` for a link as its action |
| `table.css` | `checkbox.css` to select rows; `select.css`, `listbox.css`, `popup.css`, `expand-chevron.css`, `pagination.css`, `button.css`, `chevron.css` for a footer |
| `tag-list.css` | `tag.css`, `tooltip.css` |
| `time-picker.css` | `popup.css`, `expand-chevron.css`; `field.css` for a label |
| `toast.css` | `button.css` for an action |
| `toolbar.css` | Those of what's in it |
| `input.css`, `textarea.css`, `checkbox.css`, `radio.css`, `switch.css`, `segmented.css` | `field.css` for labels and messages |

## Shared conventions

- **Class names.** Every component has one class, `.h<name>`, which opts an
  element into its styling and names its React component, if it has one:
  `.hoption` is `<Option>`, `.hsetting` is `<Setting>`. A part that another
  component renders, such as a Field's `.hlabel`, has none. Components used
  inside others keep their own name, so a label is `.hlabel` in a Field and
  in a radio group alike.
- **Parts** that exist only inside one component are `.h<name>-<part>`,
  nesting further for parts of parts: `.hbutton-label`, `.hfield-optional`,
  `.hlistbox-search-input`.
- **Variants and states are attributes, never classes** (`.hchevron`, which
  marks a particular icon, is the one exception).
- **Low specificity.** Most selectors carry their target class plus at most a
  state, about (0,2,0), with any context they depend on in `:where()`, which
  counts as nothing. An app's rule of the same weight, loaded after Harmo,
  wins: `.hoption[aria-selected="true"]` overrides Harmo's selected option
  without `!important`. A few rules are heavier, and a matching selector
  overrides them: a Field's description under its label, and the control in a
  horizontal Field; a Setting's control; the room Search and Password Input
  keep for their buttons; the field under a highlight in Input and TextArea,
  and over OTP Input's slots;
  and a Banner's or Toast's action on hover and press.
- **Token names** are inspired by Stripe's Elements Appearance API: what is colored,
  then the variant, then the state (`--harmo-color-text-secondary`,
  `--harmo-color-primary-hover`); component tokens start with the component
  (`--harmo-input-color-background`). Text runs `color-text`, `-secondary`,
  `-tertiary`, from most to least prominent. The `$shortcuts` in
  `_shortcuts.scss` have the same names.
- **Dark mode** comes from CSS's `color-scheme`. Colors that differ are
  `light-dark()` pairs, light first, and a page stays light until it sets
  `color-scheme: dark`, or `light dark` to follow the system. The primary is
  lighter on a dark page, so text and marks read, so whatever has white text on
  it uses `--harmo-color-primary-fill` instead: Button and Switch.
- **Accents** recolor the primary roles for everything inside an element with
  `data-harmo-accent`: `purple` (the default), `blue`, `teal`, `green`,
  `amber`, `red`, `pink`, or `mono`, which is black, or near-white in dark mode,
  with dark text on its buttons there, and links underlined on hover. They come
  from `accents.css`. Each has the purple's contrast in every role, in both
  modes, and sets every role itself, so an accent inside another inherits
  nothing from it. They're set with `:where()`, so an app's own values on the
  same element still win; an accent on a section is overridden on that section.
- **State comes from native attributes and ARIA** wherever one exists:
  `disabled`, `checked`, `hidden`, `aria-invalid`, `aria-expanded`,
  `aria-selected`, `aria-disabled`, `aria-busy`, `aria-pressed`,
  `aria-current`. The rest are data attributes:

  | Attribute | Meaning | Used by |
  | --- | --- | --- |
  | `data-variant` | Appearance | Button, Tag, Status, Tooltip, Card, Empty State, File Input |
  | `data-status` | `success`, `warning`, `info`, or `error` (Password Input's word and hint: no `info`); on a file, `uploading`, `done`, or `error` | Status, Banner, Meter, Password Input, Toast, File List |
  | `data-size` | `small` or `large` | Spinner; `small` on Button, Accordion, Empty State |
  | `data-orientation` | `horizontal` on Field, `vertical` on Navigation Menu | Field, Navigation Menu |
  | `data-direction` | `back` on the chevrons, `up` or `down` on a trend | ChevronToArrow, Chevron, Stat |
  | `data-side` | Preferred or actual side; `end` puts a Table of Contents after the content | Tooltip, Popup, Table of Contents |
  | `data-position` | Where the region is: `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-end`; or, on a panel waiting beside the open one, `before` or `after` (script) | Toast, Navigation Menu |
  | `data-delay` | Wait 300ms before showing | Spinner |
  | `data-placeholder` | No value chosen | Select, Time Picker |
  | `data-filled` | A filled segment; a slot with a character (script) | Meter, OTP Input |
  | `data-active` | Highlighted option; the slot typing goes to (script) | Listbox, OTP Input |
  | `data-value` | An option's value | Listbox, and what's built on it: Select, Combobox, Filter Chip, Language Picker |
  | `data-name` | The name a form sends the chosen values under: a Select's `<select>` has it as `name` | Select, Combobox |
  | `data-ready` | Measured and placed; the slots shown (script) | Tabs, Table of Contents, OTP Input |
  | `data-on-current` | The pill is over the current tab (script) | Tabs |
  | `data-level` | `2` or `3`: a heading under another | Table of Contents |
  | `data-dismissed` | Hidden by Escape (script) | Tooltip |
  | `data-underlined`, `data-visited` | Opt-in underline / visited color | Link |
  | `data-align` | `start`: lined up at the start, or a panel opening there | Empty State, Navigation Menu |
  | `data-destructive` | For an action that destroys something | Button |
  | `data-hold`, `data-holding`, `data-held` | Held to confirm, and how far along (script) | Button |
  | `data-pinned`, `data-refit` | Keeping or finding its place (script) | Popup |
  | `data-open` | Shown, or open (script) | Tooltip's trigger, Navigation Menu |
  | `data-moving` | Moving between panels (script) | Navigation Menu |
  | `data-copied` | Just copied (script) | Copy Button |
  | `data-collapsed` | Down to its icons | Sidebar |
  | `data-multiple` | Choosing several | Combobox |
| `data-characters` | `alphanumeric`: letters too | OTP Input |
  | `data-free-text` | What's typed is the value | Combobox |
  | `data-closing` | Closing, while its exit plays (script) | Dialog, Drawer |
  | `data-dragging` | `page` or `over`: a file is being dragged (script) | File Input |
  | `data-stacked`, `data-inactive` | Two texts in one place, and the one not showing | File Input |
  | `data-leaving` | Fading out before it's taken away (script) | File Input, Toast |
  | `data-layout` | `grid`: thumbnails | File List |
  | `data-new` | Just added or changed, settling in; left off what's there as the page loads | File List, File Input, Selection Bar |
  | `data-instant` | Changes at once, without its motion: yours on a Button whose text changes often, such as a countdown, for its width; a script's on a tooltip's trigger, when it shows with no delay, and on a Time Picker's column while the arrow keys move its choice | Button, Tooltip, Time Picker |
  | `data-emphasis`, `data-footer` | A cell that stands out; `static`, a footer that stays under the table | Table |
  | `data-front`, `data-beyond`, `data-expanded`, `data-overflowing`, `data-removed`, `data-moved` | Its place in the stack, spread out, scrolling when spread out taller than the window, leaving, and moving (script) | Toast |
- **Text sizes are in rem**, so text follows the browser's default font-size
  setting as well as zoom. The scale runs `--harmo-font-size-lg` (20px),
  `-base` (16px), `-md` (15px), `-sm` (14px), `-xs` (13px), `-2xs` (12px),
  and `-3xs` (11px); line heights are unitless or rem, never px. Pixel sizes
  in these docs are at the default 16px.
- **Spacing** follows a scale in rem, each step the one before it times the
  golden ratio: `--harmo-space-2xs` (6px), `-xs` (10px), `-sm` (16px), `-md`
  (26px), `-lg` (42px), `-xl` (68px), and `-2xl` (110px). Separate things sit
  a big step apart, such as the buttons in a row, 10px; parts of one thing a
  small one, 6px (`-2xs`), with no exception: a Field's label and its
  control, a title and its description, an icon and its text in a row, or
  the tags in a Tag List. Padding that sets a row's or a
  chip's height, such as a list option's or a table cell's, hairlines, insets
  under 6px, and the room kept for focus rings stay in px, and so do the
  distances of popups, tooltips, and toasts from what they open from and from
  the window's edges.
- **Control height.** Buttons, inputs, and select triggers share
  `--harmo-control-height` (34px), so they line up in a row; a small Button
  is `--harmo-control-height-small` (29px), and a field that holds one, such
  as a Copy Field, keeps room for it. Inputs and select triggers also share
  their box, border, focus ring, and states through the `%control`
  placeholder in `_control.scss`, and where their text starts, 10px in, from
  its `$padding-inline`.
- **Icons scale with text.** Inline icons are sized in `em`, and a Button
  draws its icons at 20px, in `rem`. ChevronToArrow is the exception: 24px
  by default, the size it's drawn for, and 20px only alone in an icon-only
  Button, as every icon there. The space between text and an icon's box is
  `--harmo-icon-gap` (6px); icons with wide blank margins, such as the static
  chevron, offset them so every visible gap matches.
- **Motion.** Durations come from `--harmo-duration-*` and curves from
  `--harmo-ease-*`. Most entrances take 200ms and exits 150ms; the others,
  such as Tooltip's 150ms in and 100ms out or the Drawer's 300ms slide, are on
  their pages. Exits are quicker than entrances, except Toast's, whose exit
  matches its 400ms entrance. Fades, like entrances, use
  `--harmo-ease-out-cubic`; a color or background fading on hover uses the
  plain CSS `ease`, which has no token. A timing a component keeps for itself,
  such as a spinner's turn, is a property of its own, such as
  `--hspinner-duration`, in its page's Options. What happens often, or
  follows the arrow keys, changes at once: a selection moving with the arrow
  keys, Command Menu's dialog, a checkbox or radio toggled from the keyboard,
  and a tooltip that shows with no delay. Reduced motion keeps the state
  change and drops the movement.
- **Hiding.** `hidden` hides any component or part of one, at once, since
  `display: none` can't animate. A Field's error and the password details are
  the exceptions: with `hidden` they stay rendered and collapse, which is how
  they animate closed. Popups and tooltips close through their own states
  instead, so don't add `hidden` to one that should fade. Browsers ignore
  `hidden` on SVG, so leave an icon out to hide it.
- **Hover** styles apply only on devices that hover with a fine pointer.
- **Disabled.** A box or a mark, such as a button, a checkbox, a switch, an
  option's checkbox, or an icon in a field, dims to
  `--harmo-opacity-disabled`. Text, such as an option, a tab, or a Navigation
  Menu trigger, turns `--harmo-color-text-tertiary`. Text fields and select
  triggers take the secondary background, with tertiary text. Each has a
  `not-allowed` cursor and no hover.
- **Focus rings** are `--harmo-focus-outline` (2px solid `--harmo-color-focus`),
  named after Stripe's `focusOutline`, at `--harmo-focus-outline-offset`
  (2px). Some keep their own offset: tabs (always 2px, so the ring stays above
  the divider); a Sidebar item (0, in the room its nav keeps around the items,
  so its scrolling can't cut the ring off); controls inside another control or
  a clipped or scrolling panel, such as the password toggle, Search's clear
  button, a Copy Field's button, a Navigation Menu row, or a Table of Contents
  link, whose ring stays inside it; and Stat's hint, whose ring is on its 24px
  button, with no offset. Text fields and select triggers instead turn their
  border the focus color and add a 3px tinted ring.

## What scripts handle

CSS covers appearance and everything the platform already does. Scripts, or
the React components, set:

| Attribute | Where | Purpose |
| --- | --- | --- |
| `indeterminate` (property) | Checkbox | Mixed state |
| `aria-busy`, `aria-disabled`, `data-holding`, `data-held`, the width | Button | Loading; ignoring presses while disabled; hold to confirm; the width following its content |
| `--htabs-*`, `data-ready`, the strip's scroll position | Tabs | Sliding hover pill and underline; the current tab in view |
| `aria-current="location"`, `--htable-of-contents-marker-y`, `--htable-of-contents-marker-size`, `data-ready` | Table of Contents | Follow the section you've reached, and move the marker to it |
| `aria-selected`, `tabindex`, panel `hidden` | Tabs in a tablist | Selection, arrow keys, the shown panel |
| `data-dismissed`, `--htooltip-delay` | Tooltip | Escape to hide; neighbors show at once |
| `aria-expanded` | Popup triggers, select triggers, Menu Button | Open ring, chevron direction, the bars' cross |
| `aria-expanded`, `aria-activedescendant`, `data-active`, option `hidden`, `.hoption-match`, the status, tags, hidden inputs | Combobox | Filter, highlight, pick, and choose several |
| `aria-expanded`, `aria-activedescendant`, `aria-keyshortcuts`, `data-active`, option `hidden`, `.hoption-match` | Command Menu | Filter, highlight, the shortcut, and opening |
| `aria-expanded`, `inert`, `data-open`, `data-moving`, `data-position`, `--hnavigation-menu-*` | Navigation Menu | Open and close its panels, and size its frame |
| `data-collapsed`, the toggle's tooltip text, a group's `open` | Sidebar | Collapse to its icons, with the toggle named by what it does next, while CSS glides the width; close the open groups as it collapses; and, collapsed, open a group's links beside its icon, one group at a time |
| The clear button's `hidden`, the field's value | Search | Show the clear button; empty the field on it, or on Escape |
| The tag itself, focus | Tag | Remove it, and keep the keyboard's place |
| Tags' `hidden`, `.htag-list-rest`, the count, `data-open` | Tag List | Count what fits, and pin its tooltip open |
| `data-open` | Stat | Pin a hint's or a trend's tooltip open on a press |
| `data-copied`, `data-open`, the tooltip's or label's text, the status | Copy Button, Share Button | Copy or share, and say so for two seconds |
| Ignoring activation | Pagination | On a disabled Previous or Next |
| `.hfilter-chip-value` items | Filter Chip | The chosen values, or a count past two |
| The count and `hidden` on it, `hidden` on Reset | Filters | Follow which chips show a value |
| `aria-pressed`, or `aria-current` from your router | Filter Bar | The filter in force |
| The button's text and icon, the remove button's `hidden`, `data-new` on what a change puts in, the message and `aria-invalid` | File Input | Show the file, remove it, and say why one was refused |
| `data-status`, the progress, the rows themselves, and a finished file's check, with `data-new` | File List | Follow your app's uploads |
| The field's text, the country, and the hidden value | Phone Input | Format the number and follow the country |
| The button's label; the highlight, by Left and Right in a panel of regions | Language Picker | Show the language chosen, and its region; move between columns |
| The bar, with `data-new` as a selection begins, and the count's text | Selection Bar | Follows the selection, which is your app's |
| `checked` and `indeterminate`, hidden columns, the rows and the page; `tabindex`, `role`, and the table's `aria-label` or `aria-labelledby` on `.htable-scroll` while it overflows | Table | Follow the selection, the columns chosen, and the page, which are your app's; make a scroll area that overflows a named region the keyboard can scroll |
| Which fields are `hidden`, Apply's `aria-disabled`, the dates' first and last days, the chip's value | Date Filter | Follow the condition, the fields, and the value applied |
| The title, the rows, Previous's and Next's `aria-disabled`, `aria-selected`, focus and `tabindex` | Calendar | Change the month, choose a day, and move by keyboard |
| The field's text, `aria-invalid`, the hidden input, the Calendar's day | Date Picker | Write and read the date in the locale's order, or pick it from the Calendar |
| `aria-selected`, `aria-activedescendant`, `data-instant`, `.htime-picker-value`, `data-placeholder`, the hidden input | Time Picker | Choose the time, by pointer or keyboard, and show it; the keyboard's moves change at once |
| `data-side="top"`, `data-refit`, `data-pinned`, focus back on the trigger | Popup | Slide away from a trigger it opened above, find its place afresh as it opens, close where it is, and hand focus back when one opened over another closes |
| `data-active` | Listbox option | Highlight that follows keyboard and pointer |
| `aria-selected` | Listbox option | Selection |
| `aria-activedescendant` | Select trigger, search field, or the list | Announces the highlighted option |
| `hidden` on `.hselect-fallback`; the `<select>`'s chosen options and `disabled` | Select in a form | Show the trigger in place of the native select it starts as; keep that select, which the form sends, on the chosen values, restored on reset, disabled with the trigger |
| Error text, `hidden` | Field | Shows a validation error; `hidden` closes it, then the text is cleared |
| Counter text | TextArea | Characters used |
| The backdrop's text and `<mark>`s, its size and scrolling | Input, TextArea | Mark parts of the text |
| `aria-pressed`, input `type`, `hidden`, `data-status`, `aria-invalid` | Password Input | Show/hide, reveal the strength, color it |
| `data-ready`, the slots' characters, `data-filled`, `data-active`, the field's value and caret | OTP Input | Show the slots, keep the field to what a code holds, type over, and follow the caret |
| `aria-valuenow`, `aria-valuetext`, `data-filled`, `data-status` | Meter | The value |
| `role="status"` or `role="alert"` | Banner | Announce a banner that appears after load |
| `data-closing` | Dialog, Drawer | Hold the close while the exit plays |
| The toasts, the announcers' text, `--htoast-*`, `--htoaster-*`, `data-front`, `data-beyond`, `data-expanded`, `data-overflowing`, `data-removed`, `data-leaving`, `data-moved`, `inert` | Toast | Show, announce, measure, stack, spread out, scroll, time, close on an action, and move them into an open dialog |

Each component page's "What a script does" section has the details.

## Browser features used

The popover attribute; CSS anchor positioning, including `anchor-scope` and
`@position-try` (in all major browsers since January 2026);
`field-sizing: content` (since June 2026); `@starting-style`, for what
fades or slides in as it appears, such as Tooltip, Dialog, Drawer, and Toast;
`allow-discrete` transitions, for Popup, Tooltip, Dialog, and Drawer, with
`overlay` for Popup, Dialog, and Drawer, which leave the top layer as they
fade; for Dialog and Drawer, invoker commands (`commandfor` and `command`),
`closedby`, `requestClose()`, and the dialog's `beforetoggle` and `toggle`
events; `interpolate-size`, for
Field's error, with a fallback where it's missing; `::details-content`, for
Accordion and Sidebar; `subgrid`, for Stat's group; the `inert` attribute and
`overflow: clip`, for Navigation Menu; the Clipboard and Web Share APIs, in
Copy Button's and Share Button's scripts; `:has()`, `:where()`,
`:dir()`, `color-mix()`, `light-dark()`, for dark mode, and logical properties.
Firefox cannot yet keep a closing popup in the top layer during its fade, so
the fade may briefly pass under other content there.
