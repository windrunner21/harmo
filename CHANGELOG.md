# Changelog

What changed in each release of Harmo's three packages, `@harmo-ui/css`,
`@harmo-ui/react`, and `harmo-ui`, which are released together, at the same
version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/): until 1.0, a
minor version may change an API, and says how to upgrade when it does.

## [Unreleased]

### Added

- Input and TextArea: `highlight`, a regular expression whose matches are marked
  as you type, such as the variables in a template.

- File List: `.hfile-list`, or `<FileList>`, the files your app is holding or
  sending, as rows or a thumbnail grid, with progress and a way to try again.

  ```html preview="file-list/Default"
  <ul class="hfile-list" aria-label="Attachments" tabindex="-1">
    <li class="hfile-list-item">
      <div class="hfile-list-text"><span class="hfile-list-name">project-brief.pdf</span></div>
    </li>
  </ul>
  ```

- Tokens: `--harmo-space-2xs` to `--harmo-space-2xl`, a spacing scale whose steps
  grow by the golden ratio.
- File Input: `.hfile-input`, or `<FileInput>`, which picks one file for your app
  to upload, shows its name, and removes it, with `validate` to refuse a file and
  `defaultFileName` for one already attached. `variant` makes it take a dropped
  file, as a compact strip, a large area, or an avatar circle, and `multiple` takes
  several for your app to hold.

  ```html preview="file-input/Default"
  <div class="hfile-input">
    <label class="hbutton" data-variant="secondary">
      <input class="hfile-input-control" type="file" aria-label="Attachment" />
      <span class="hbutton-label">Choose file</span>
    </label>
  </div>
  ```

## [0.5.1] - 2026-11-10

A fix for a Toolbar's controls, and a Date Picker's setup in words, in its docs.

### Fixed

- Toolbar: controls stay beside short filters, rather than going below them in a
  row with room for both.

## [0.5.0] - 2026-11-09

Nine new components for lists and dates: Table, with selecting, row links,
columns, and pages; Toolbar, Selection Bar, Filters, Filter Bar, and Date Filter;
and Calendar, Date Picker, and Time Picker.

### Added

- Table: `.htable` on a normal `<table>`, or `<DataTable>` with `useRowSelection`
  and `useColumnVisibility`: selecting rows, rows that are links all the way
  across, choosing columns, and a footer of pages that stays in view.

  ```html preview="table/Default"
  <table class="htable" aria-label="Tasks">
    <thead><tr><th scope="col">Task</th><th scope="col">Status</th></tr></thead>
    <tbody><tr><th scope="row">Write the brief</th><td>Active</td></tr></tbody>
  </table>
  ```

- Toolbar: `.htoolbar`, or `<Toolbar controls={…}>`, a row above a list with
  filters at the start and controls at the end.
- Selection Bar: `.hselection-bar`, or `<SelectionBar>`, what's selected in a list
  and what can be done with it: a count, a way to deselect, then the actions.

  ```html preview
  <div class="hselection-bar">
    <span class="hselection-bar-count" role="status">3 selected</span>
    <button class="hselection-bar-deselect" type="button">Deselect</button>
    <button class="hbutton" data-variant="secondary" data-size="small" type="button">
      <span class="hbutton-label">Assign</span>
    </button>
  </div>
  ```

- Filters: `<Filters>`, a row of Filter Chips above a list: the first few in the
  row, the rest behind a chip with a count of those in force, and a way to reset
  them all. What's chosen stays in your app or your URL.

  ```html preview="filters/With filters in force"
  <div class="hfilters" role="group" aria-label="Filter tasks">
    <button class="hfilter-chip" type="button">
      <span class="hfilter-chip-label">Status</span>
      <span class="hfilter-chip-values">
        <span class="hfilter-chip-value">Active</span>
      </span>
    </button>
    <button class="hfilter-chip" type="button">
      <span class="hfilter-chip-label">More filters</span>
      <span class="hfilters-count">1</span>
    </button>
    <button class="hfilters-reset" type="button">Reset filters</button>
  </div>
  ```

- Date Filter: `<DateFilter>`, a chip that filters a list by date: within the
  last few minutes or months, on a day, between two days, after a day, or before
  one. Its value is `{ gte, lte }` in Unix seconds, so a link can restore it, and
  the panel reopens on the condition the value describes.

  ```html preview="date-filter/Default"
  <button class="hfilter-chip" type="button" aria-haspopup="dialog">
    <span class="hfilter-chip-label">Due date</span>
    <span class="hfilter-chip-values">
      <span class="hfilter-chip-value">Nov 1 – 9, 2026</span>
    </span>
  </button>
  ```

- Filter Bar: `.hfilter-bar`, or `<FilterBar>` with `<FilterBarItem>`s, quick
  filters above a list, as a row of cards that each show how many items they'd
  leave. Links where the filter is in the URL, so it can be shared, or buttons
  where your app holds it.

  ```html preview
  <nav class="hfilter-bar" aria-label="Task status" style="inline-size: 28rem">
    <a class="hfilter-bar-item" href="#all" aria-current="true">
      <span class="hfilter-bar-label">All</span>
      <span class="hfilter-bar-count">128</span>
    </a>
    <a class="hfilter-bar-item" href="#active">
      <span class="hfilter-bar-label">Active</span>
      <span class="hfilter-bar-count">37</span>
    </a>
    <a class="hfilter-bar-item" href="#done">
      <span class="hfilter-bar-label">Done</span>
      <span class="hfilter-bar-count">85</span>
    </a>
  </nav>
  ```

- Calendar: `.hcalendar`, or `<Calendar>`, a month of days to pick a date from.
  The month's name sits between Previous and Next, and the days are a grid of
  real buttons, always six rows, so it stays the same height from month to
  month. Names come from `Intl`, in the language of `locale`, which also says
  where the week starts. The keyboard moves by a day, a week, a month, or a
  year, and `min` and `max` limit what can be chosen. Dates are strings, as
  `"2026-11-09"`, so a timezone can't move them.

  ```html preview="calendar/Default"
  <div class="hcalendar">
    <div class="hcalendar-header"><!-- Previous, the title, Next --></div>
    <table class="hcalendar-grid" role="grid" aria-labelledby="month-title">
      <!-- the weekdays, then six rows of days -->
    </table>
  </div>
  ```

- Date Picker: `.hdate-picker`, or `<DatePicker>`, a date typed in the locale's
  order, or chosen from a Calendar that a button in the field opens. Digits get
  their separators as you type, a date that doesn't exist stays in the field,
  marked invalid, and `name` sends the date as `2026-11-09`. `natural` takes a
  date parser your app brings, such as `chrono-node`, so "in 2 days" works, and
  `time` keeps the time too, as `2026-11-09T14:00`. Harmo gains no dependency:
  your app installs the parser and passes it in.

  ```html preview="date-picker/Default"
  <div class="hdate-picker">
    <input class="hinput" type="text" inputmode="numeric" autocomplete="off" />
    <!-- the button, and a hidden input with the date -->
  </div>
  <!-- a Popup holding a Calendar -->
  ```

- Time Picker: `.htime-picker`, or `<TimePicker>`, a time of day chosen from a
  column each for the hour, the minute, and, on a 12-hour clock, AM or PM. The locale decides the clock, its digits, and the order of
  the columns, and `name` sends the time as `14:30`.

  ```html preview="time-picker/Default"
  <button class="htime-picker" type="button" aria-haspopup="dialog">
    <span class="htime-picker-value">02:30 PM</span>
  </button>
  <!-- a Popup holding a listbox for each column -->
  ```

### Fixed

- Popup: one inside another no longer marks the outer one as closed, or resets
  what's in it, when it opens or closes.
- Popup: one fading out no longer takes presses from what's under it.
- Popup: Escape from one opened over another hands focus back to what opened it,
  as a browser does only for the first one open.
- Popup: in Firefox, one whose direction isn't the page's, such as a right-to-left
  widget on a left-to-right page, lines up with what opened it.
- Filter Chip: a value keeps its background while the chip is hovered or open.

## [0.4.0] - 2026-11-08

Thirteen new components, among them Sidebar, Command Menu, Combobox, Navigation
Menu, and Pagination, and a card's icon, title, description, and chevron.

### Upgrading

- **A list's message for no matches is a status.** So a screen reader reads it
  as it appears, `.hlistbox-empty` gets `role="status"` and is in the page from
  the start, empty until nothing matches. `<Listbox>`, `<Select>`,
  `<FilterChip>`, and `<Combobox>` do this themselves. In HTML, render it empty
  after the list, and fill it when nothing matches, rather than add it then.

  What you'll notice: if you keep adding it when nothing matches, it looks the
  same, but a screen reader may not read it.

  In 0.3.0, added when nothing matches:

  ```html
  <p class="hlistbox-empty">No agents found</p>
  ```

  In 0.4.0, in the page from the start, and filled when nothing matches:

  ```html
  <p class="hlistbox-empty" role="status"></p>
  ```

### Added

- Accordion: `<details class="haccordion-item">` with its
  `<summary class="haccordion-summary">`, in a `.haccordion`, or
  `<Accordion>` with `<AccordionItem>`s: items that each show or hide their
  content, such as questions and their answers. Items that share a `name`, or
  `<Accordion exclusive>`, open one at a time. It needs no script: the browser
  opens and closes it, and the content grows and shrinks in CSS. One item on
  its own is a panel to show or hide. `data-size="small"`, or `size="small"`,
  makes it compact, with 14px text.

  ```html preview
  <div class="haccordion" style="inline-size: 24rem">
    <details class="haccordion-item" name="changelog-questions" open>
      <summary class="haccordion-summary">
        <span class="haccordion-label">How am I billed?</span>
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
      </summary>
      <div class="haccordion-content">
        <p>Each month, for the conversations your team handled that month.</p>
      </div>
    </details>
    <details class="haccordion-item" name="changelog-questions">
      <summary class="haccordion-summary">
        <span class="haccordion-label">Can I change my plan later?</span>
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
      </summary>
      <div class="haccordion-content">
        <p>Yes, at any time, in Settings under Plans.</p>
      </div>
    </details>
  </div>
  ```

- Card: given a `.hcard-title`, a card lays out its parts: an icon in a
  `.hcard-icon` tile at the start, the title and a `.hcard-description`
  beside it, and a ChevronToArrow with `hcard-chevron` at the end, which
  turns into an arrow while the card is hovered or focused, as in a list of
  settings pages or help links. Each but the title can be left out. In a card
  that's a link or a button, the title is in the accent. In React, `<Card
  icon label description chevron>`.

  ```html preview
  <div style="display: grid; gap: 4px; inline-size: 24rem">
    <a class="hcard" data-variant="ghost" href="#security">
      <span class="hcard-icon" aria-hidden="true"><svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M18 10.75C17.59 10.75 17.25 10.41 17.25 10V8C17.25 4.85 16.36 2.75 12 2.75C7.64 2.75 6.75 4.85 6.75 8V10C6.75 10.41 6.41 10.75 6 10.75C5.59 10.75 5.25 10.41 5.25 10V8C5.25 5.1 5.95 1.25 12 1.25C18.05 1.25 18.75 5.1 18.75 8V10C18.75 10.41 18.41 10.75 18 10.75Z" fill="currentColor" /> <path d="M12 19.25C10.21 19.25 8.75 17.79 8.75 16C8.75 14.21 10.21 12.75 12 12.75C13.79 12.75 15.25 14.21 15.25 16C15.25 17.79 13.79 19.25 12 19.25ZM12 14.25C11.04 14.25 10.25 15.04 10.25 16C10.25 16.96 11.04 17.75 12 17.75C12.96 17.75 13.75 16.96 13.75 16C13.75 15.04 12.96 14.25 12 14.25Z" fill="currentColor" /> <path d="M17 22.75H7C2.59 22.75 1.25 21.41 1.25 17V15C1.25 10.59 2.59 9.25 7 9.25H17C21.41 9.25 22.75 10.59 22.75 15V17C22.75 21.41 21.41 22.75 17 22.75ZM7 10.75C3.42 10.75 2.75 11.43 2.75 15V17C2.75 20.57 3.42 21.25 7 21.25H17C20.58 21.25 21.25 20.57 21.25 17V15C21.25 11.43 20.58 10.75 17 10.75H7Z" fill="currentColor" /> </svg></span>
      <h3 class="hcard-title">Security</h3>
      <p class="hcard-description">Two-step verification, and the devices signed in to your account.</p>
    </a>
    <a class="hcard" data-variant="ghost" href="#contact">
      <p class="hcard-title">Talk to us</p>
      <p class="hcard-description">Questions about plans or setup? We're glad to help.</p>
      <svg class="hicon hchevron-to-arrow hcard-chevron" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"> <g class="hchevron-to-arrow-head"> <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" /> <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" /> </g> <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" /> </svg>
    </a>
  </div>
  ```

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

  ```html preview="combobox/Default"
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

  ```html preview="command-menu/Default"
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

- Copy Button: `<button class="hbutton hcopy">`, or `<CopyButton>`, copies
  text, such as a link or an ID, and says so in place: for two seconds, its
  icon turns into a check, its tooltip or its text says it's copied, and a
  status tells screen readers. `.hcopy-field`, or `<CopyField>`, puts one
  inside a read-only Input in a monospace font, for a value such as a key.
  `<ShareButton>` opens the device's share sheet where the browser has one,
  and elsewhere copies the link. A new token, `--harmo-font-family-mono`, is
  for text that's read character by character.

  ```html preview="copy/With its text"
  <button class="hbutton hcopy" data-variant="secondary" type="button">
    <span class="hicon hcopy-icons" aria-hidden="true"><svg class="hcopy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M10.5 8.5H17.5C18.6 8.5 19.5 9.4 19.5 10.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H10.5C9.4 19.5 8.5 18.6 8.5 17.5V10.5C8.5 9.4 9.4 8.5 10.5 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /> <path d="M6.5 15.5H6C5.17 15.5 4.5 14.83 4.5 14V6C4.5 5.17 5.17 4.5 6 4.5H14C14.83 4.5 15.5 5.17 15.5 6V6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /> </svg><svg class="hcopy-done" viewBox="4.85 4.88 16 16" fill="none" aria-hidden="true" focusable="false"> <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" /> </svg></span>
    <span class="hbutton-label">Copy</span>
  </button>
  ```

- Empty State: `<div class="hempty-state">`, or `<EmptyState>`, what shows
  where there's nothing yet, such as a list before its first item, a search
  with no results, or a page you're not allowed to see: an icon, a title
  that's a heading, a description, and actions. It's centered, or lined up at
  its start with `data-align="start"`; `data-size="small"` fits it inside a
  page, and `data-variant="dashed"` gives it a dashed border.

  ```html preview
  <div class="hempty-state" style="inline-size: 24rem">
    <div class="hempty-state-icon" aria-hidden="true"><svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17.8701 21.8698C17.5601 21.8698 17.2501 21.7898 16.9701 21.6198L12.9601 19.2397C12.5401 19.2297 12.1201 19.1998 11.7201 19.1398C11.4501 19.0998 11.2201 18.9197 11.1201 18.6597C11.0201 18.3997 11.0701 18.1197 11.2501 17.9097C11.9101 17.1397 12.2501 16.2197 12.2501 15.2397C12.2501 12.8197 10.1201 10.8497 7.50008 10.8497C6.52008 10.8497 5.58007 11.1198 4.79007 11.6398C4.57007 11.7798 4.30007 11.7998 4.06007 11.6898C3.83007 11.5798 3.66008 11.3597 3.63008 11.0997C3.60008 10.8197 3.58008 10.5398 3.58008 10.2498C3.58008 5.28976 7.88008 1.25977 13.1601 1.25977C18.4401 1.25977 22.7401 5.28976 22.7401 10.2498C22.7401 12.9698 21.4801 15.4697 19.2601 17.1797L19.6001 19.8998C19.6801 20.5798 19.3801 21.2198 18.8101 21.5898C18.5301 21.7698 18.2001 21.8698 17.8701 21.8698ZM13.1501 17.7297C13.2901 17.7197 13.4301 17.7598 13.5501 17.8398L17.7401 20.3298C17.8501 20.3998 17.9401 20.3698 18.0001 20.3298C18.0501 20.2998 18.1301 20.2198 18.1101 20.0798L17.7201 16.9197C17.6901 16.6397 17.8101 16.3698 18.0301 16.2098C20.0701 14.7798 21.2401 12.5997 21.2401 10.2297C21.2401 6.09974 17.6201 2.73975 13.1601 2.73975C8.87008 2.73975 5.35007 5.85979 5.09007 9.77979C5.84007 9.48979 6.65008 9.32977 7.49008 9.32977C10.9401 9.32977 13.7401 11.9697 13.7401 15.2197C13.7501 16.0997 13.5401 16.9497 13.1501 17.7297Z" fill="currentColor"/> <path d="M4.57977 22.7498C4.31977 22.7498 4.06977 22.6798 3.83977 22.5298C3.38977 22.2398 3.14978 21.7398 3.20978 21.2098L3.40977 19.6698C2.05977 18.5698 1.25977 16.9398 1.25977 15.2298C1.25977 13.2798 2.27978 11.4598 3.98978 10.3698C5.01978 9.69981 6.23977 9.33984 7.50977 9.33984C10.9598 9.33984 13.7598 11.9798 13.7598 15.2298C13.7598 16.5498 13.2798 17.8498 12.3998 18.8798C11.2698 20.2498 9.57977 21.0498 7.71977 21.1098L5.27977 22.5598C5.05977 22.6898 4.81977 22.7498 4.57977 22.7498ZM7.49977 10.8398C6.51977 10.8398 5.57976 11.1098 4.78976 11.6298C3.50976 12.4498 2.74977 13.7898 2.74977 15.2298C2.74977 16.6198 3.42978 17.8898 4.62978 18.7098C4.85978 18.8698 4.97977 19.1398 4.94977 19.4198L4.72977 21.1298L7.11977 19.7098C7.23977 19.6398 7.36977 19.5998 7.49977 19.5998C8.96977 19.5998 10.3598 18.9698 11.2398 17.8998C11.8998 17.1198 12.2498 16.1998 12.2498 15.2198C12.2498 12.8098 10.1198 10.8398 7.49977 10.8398Z" fill="currentColor"/> </svg></div>
    <h3 class="hempty-state-title">No quick replies yet</h3>
    <p class="hempty-state-description">Save answers you send often, and add them to a chat in two clicks.</p>
    <div class="hempty-state-actions">
      <button class="hbutton" type="button"><svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"> <path d="M12 5V19M5 12H19" /> </svg><span class="hbutton-label">Add quick reply</span></button>
    </div>
  </div>
  ```

- Expand Chevron: in the `<summary>` of an open `<details>`, it points up,
  with no script, as in an Accordion item.

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

- Menu Button: `<button class="hbutton hmenu-button">`, or `<MenuButton>`, three
  bars that turn into a cross while it's expanded, for opening a site's menu on
  a phone.

  ```html preview="menu-button/Default"
  <button class="hbutton hmenu-button" data-variant="secondary" data-size="small" type="button" aria-label="Menu" aria-expanded="false"><svg class="hicon hmenu-button-bars" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><line class="hmenu-button-top" x1="3" y1="5" x2="17" y2="5" /><line class="hmenu-button-middle" x1="3" y1="10" x2="17" y2="10" /><line class="hmenu-button-bottom" x1="3" y1="15" x2="17" y2="15" /></svg></button>
  ```

- Navigation Menu: `<nav class="hnavigation-menu">`, or `<NavigationMenu>`, a
  site's main navigation: links, and triggers that each open a panel of rows, on
  hover, a click, or Enter. One frame shows the open panel, resizing as you move
  between triggers while the rows slide. Each panel follows its trigger in the
  page, so Tab goes from a trigger into its links. `data-orientation="vertical"`
  stacks the triggers, with each panel opening in place, for a phone.

  ```html preview="navigation-menu/Default"
  <nav class="hnavigation-menu" aria-label="Main">
    <div class="hnavigation-menu-frame" aria-hidden="true"></div>
    <ul class="hnavigation-menu-list">
      <li><a class="hnavigation-menu-link" href="#product">Product</a></li>
      <li><button class="hnavigation-menu-trigger" type="button" aria-expanded="false">Solutions<svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg></button></li>
      <li><button class="hnavigation-menu-trigger" type="button" aria-expanded="false">Resources<svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg></button></li>
    </ul>
  </nav>
  ```

- Pagination: `<nav class="hpagination">`, or `<Pagination>`, moves through
  a list shown a page at a time: Previous and Next, as Buttons, and the page
  numbers between them if you show them, the first and last pages and the one
  you're on with one either side, so the row keeps its width, up to 999
  pages. Each is a link where the page is in the URL, or a button where your
  app holds it. On the first or last page, Previous or Next stays in place,
  disabled. On a phone, only Previous and Next show.

  ```html preview="pagination/Numbered"
  <nav class="hpagination" aria-label="Pages">
    <a class="hbutton" data-variant="secondary" href="?page=4" rel="prev"><svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" /></svg><span class="hbutton-label">Previous</span></a>
    <ul class="hpagination-pages">
      <li><a class="hpagination-page" href="?page=1" aria-label="Page 1">1</a></li>
      <li class="hpagination-ellipsis" aria-hidden="true">…</li>
      <li><a class="hpagination-page" href="?page=4" aria-label="Page 4">4</a></li>
      <li><a class="hpagination-page" href="?page=5" aria-label="Page 5" aria-current="page">5</a></li>
      <li><a class="hpagination-page" href="?page=6" aria-label="Page 6">6</a></li>
      <li class="hpagination-ellipsis" aria-hidden="true">…</li>
      <li><a class="hpagination-page" href="?page=12" aria-label="Page 12">12</a></li>
    </ul>
    <a class="hbutton" data-variant="secondary" href="?page=6" rel="next"><span class="hbutton-label">Next</span><svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" /></svg></a>
  </nav>
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

- Sidebar: `.hsidebar` around `<nav class="hsidebar-nav">`, or `<Sidebar>`,
  an app's navigation down the side: links in groups, each an icon and its
  label, with a count such as unread messages, and the page you're on marked
  by `aria-current="page"`. A link can open links under it (a
  `<details class="hsidebar-sub">`), each group on its own, or, sharing a
  `name` or with `<Sidebar exclusive>`, one at a time, with no script.
  A toggle just past its edge collapses it to its icons alone
  (`data-collapsed`), each naming itself in a tooltip, with its groups
  opening beside it, one at a time. On a narrow screen, it can go in a
  Drawer.

  ```html preview
  <div class="hsidebar" style="block-size: auto">
    <nav class="hsidebar-nav" aria-label="Changelog example">
      <div class="hsidebar-group">
        <p class="hsidebar-group-label" id="changelog-sidebar-tools">Tools</p>
        <ul class="hsidebar-list" aria-labelledby="changelog-sidebar-tools">
          <li class="htooltip-trigger">
            <a class="hsidebar-item" href="#">
              <svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17.79 22.75H6.21C3.47 22.75 1.25 20.52 1.25 17.78V10.37C1.25 9.00997 2.09 7.29997 3.17 6.45997L8.56 2.25997C10.18 0.999974 12.77 0.939974 14.45 2.11997L20.63 6.44997C21.82 7.27997 22.75 9.05997 22.75 10.51V17.79C22.75 20.52 20.53 22.75 17.79 22.75ZM9.48 3.43997L4.09 7.63997C3.38 8.19997 2.75 9.46997 2.75 10.37V17.78C2.75 19.69 4.3 21.25 6.21 21.25H17.79C19.7 21.25 21.25 19.7 21.25 17.79V10.51C21.25 9.54997 20.56 8.21997 19.77 7.67997L13.59 3.34997C12.45 2.54997 10.57 2.58997 9.48 3.43997Z" fill="currentColor"/> <path d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18C12.75 18.41 12.41 18.75 12 18.75Z" fill="currentColor"/> </svg>
              <span class="hsidebar-label">Home</span>
            </a>
          </li>
          <li class="htooltip-trigger">
            <a class="hsidebar-item" href="#" aria-current="page">
              <svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17 20.75H7C2.59 20.75 1.25 19.41 1.25 15V14.5C1.25 14.09 1.59 13.75 2 13.75C2.96 13.75 3.75 12.96 3.75 12C3.75 11.04 2.96 10.25 2 10.25C1.59 10.25 1.25 9.91 1.25 9.5V9C1.25 4.59 2.59 3.25 7 3.25H17C21.41 3.25 22.75 4.59 22.75 9V10C22.75 10.41 22.41 10.75 22 10.75C21.04 10.75 20.25 11.54 20.25 12.5C20.25 13.46 21.04 14.25 22 14.25C22.41 14.25 22.75 14.59 22.75 15C22.75 19.41 21.41 20.75 17 20.75ZM2.75 15.16C2.77 18.6 3.48 19.25 7 19.25H17C20.34 19.25 21.15 18.66 21.24 15.66C19.81 15.32 18.75 14.03 18.75 12.5C18.75 10.97 19.82 9.68 21.25 9.34V9C21.25 5.43 20.58 4.75 17 4.75H7C3.48 4.75 2.77 5.4 2.75 8.84C4.18 9.18 5.25 10.47 5.25 12C5.25 13.53 4.18 14.82 2.75 15.16Z" fill="currentColor"/> <path d="M10 7.25C9.59 7.25 9.25 6.91 9.25 6.5V4C9.25 3.59 9.59 3.25 10 3.25C10.41 3.25 10.75 3.59 10.75 4V6.5C10.75 6.91 10.41 7.25 10 7.25Z" fill="currentColor"/> <path d="M10 14.58C9.59 14.58 9.25 14.24 9.25 13.83V10.16C9.25 9.75003 9.59 9.41003 10 9.41003C10.41 9.41003 10.75 9.75003 10.75 10.16V13.83C10.75 14.25 10.41 14.58 10 14.58Z" fill="currentColor"/> <path d="M10 20.75C9.59 20.75 9.25 20.41 9.25 20V17.5C9.25 17.09 9.59 16.75 10 16.75C10.41 16.75 10.75 17.09 10.75 17.5V20C10.75 20.41 10.41 20.75 10 20.75Z" fill="currentColor"/> </svg>
              <span class="hsidebar-label">Tickets</span>
              <span class="hsidebar-badge">3</span>
            </a>
          </li>
          <li class="htooltip-trigger">
            <details class="hsidebar-sub">
              <summary class="hsidebar-item">
                <svg class="hicon" width="20" height="20" viewBox="0 0 25 25" fill="none" aria-hidden="true" focusable="false"> <path d="M12.6154 14.05C12.4854 14.05 12.3554 14.02 12.2354 13.95L3.40538 8.84C3.05538 8.63 2.92538 8.17 3.13538 7.81C3.34538 7.45 3.80538 7.33 4.16538 7.54L12.6154 12.43L21.0154 7.57C21.3754 7.36 21.8354 7.49 22.0454 7.84C22.2554 8.2 22.1254 8.66 21.7754 8.87L13.0054 13.95C12.8754 14.01 12.7454 14.05 12.6154 14.05Z" fill="currentColor"/> <path d="M12.6154 23.11C12.2054 23.11 11.8654 22.77 11.8654 22.36V13.29C11.8654 12.88 12.2054 12.54 12.6154 12.54C13.0254 12.54 13.3654 12.88 13.3654 13.29V22.36C13.3654 22.77 13.0254 23.11 12.6154 23.11Z" fill="currentColor"/> <path d="M12.6154 23.5C11.7354 23.5 10.8654 23.31 10.1754 22.93L4.83539 19.96C3.38539 19.16 2.25539 17.23 2.25539 15.57V9.92C2.25539 8.26 3.38539 6.34 4.83539 5.53L10.1754 2.57C11.5454 1.81 13.6854 1.81 15.0554 2.57L20.3954 5.54C21.8454 6.34 22.9754 8.27 22.9754 9.93V15.58C22.9754 17.24 21.8454 19.16 20.3954 19.97L15.0554 22.93C14.3654 23.31 13.4954 23.5 12.6154 23.5ZM12.6154 3.5C11.9854 3.5 11.3654 3.63 10.9054 3.88L5.56539 6.85C4.60539 7.38 3.75539 8.82 3.75539 9.92V15.57C3.75539 16.67 4.60539 18.11 5.56539 18.65L10.9054 21.62C11.8154 22.13 13.4154 22.13 14.3254 21.62L19.6654 18.65C20.6254 18.11 21.4754 16.68 21.4754 15.57V9.92C21.4754 8.82 20.6254 7.38 19.6654 6.84L14.3254 3.87C13.8654 3.63 13.2454 3.5 12.6154 3.5Z" fill="currentColor"/> </svg>
                <span class="hsidebar-label">Campaigns</span>
                <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
              </summary>
              <ul class="hsidebar-sub-list">
                <li class="hsidebar-sub-heading" aria-hidden="true">Campaigns</li>
                <li><a class="hsidebar-sub-item" href="#">Runs</a></li>
                <li><a class="hsidebar-sub-item" href="#">Templates</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </nav>
  </div>
  ```

- Stat: `<div class="hstat">`, or `<Stat>`, a number to watch, such as the
  tickets that came in today: its label, which is a heading, how it has
  changed, such as "+12%", the number, and a caption, with an info button
  whose tooltip explains it, and an action, such as a link. The trend is
  neutral, since whether up is good depends on the number; with a hint, such
  as the periods it compares, it's a button for its tooltip. A press pins a
  tooltip open, for a touch screen. In a `.hstat-group`, or `<StatGroup>`,
  each Stat is a tile on a tray, as many to a row as fit, with numbers and
  captions lined up across a row.

  ```html preview
  <div class="hstat-group" style="inline-size: 32rem">
    <div class="hstat">
      <div class="hstat-header">
        <div class="hstat-title"><h3 class="hstat-label">New tickets</h3></div>
        <span class="hstat-trend" data-direction="up"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4.28326 17C3.95708 17 3.6309 16.8815 3.37339 16.6275C2.87554 16.1366 2.87554 15.324 3.37339 14.833L8.86695 9.41554C9.14163 9.14467 9.50215 9.00923 9.897 9.04309C10.2747 9.07695 10.618 9.28011 10.8412 9.60177L12.7124 12.3782L18.8069 6.36822C19.3047 5.87726 20.1288 5.87726 20.6266 6.36822C21.1245 6.85918 21.1245 7.6718 20.6266 8.16275L13.4163 15.2732C13.1416 15.5441 12.7811 15.6795 12.3863 15.6456C12.0086 15.6118 11.6652 15.4086 11.4421 15.087L9.57082 12.3105L5.19313 16.6275C4.93562 16.8815 4.60944 17 4.28326 17Z" fill="currentColor" /><path d="M19.7143 12C19.0114 12 18.4286 11.4171 18.4286 10.7143V8.57143H16.2857C15.5829 8.57143 15 7.98857 15 7.28571C15 6.58286 15.5829 6 16.2857 6H19.7143C20.4171 6 21 6.58286 21 7.28571V10.7143C21 11.4171 20.4171 12 19.7143 12Z" fill="currentColor" /></svg>+12%</span>
      </div>
      <p class="hstat-value">128</p>
      <p class="hstat-caption">Compared to yesterday</p>
    </div>
    <div class="hstat">
      <div class="hstat-header">
        <div class="hstat-title"><h3 class="hstat-label">First response time</h3></div>
        <span class="hstat-trend" data-direction="down"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M19.7167 17C19.3906 17 19.0644 16.8815 18.8069 16.6275L12.7124 10.6175L10.8412 13.394C10.6352 13.7157 10.2747 13.9188 9.897 13.9527C9.50215 13.9865 9.12446 13.8511 8.86695 13.5802L3.37339 8.16275C2.87554 7.6718 2.87554 6.85918 3.37339 6.36822C3.87124 5.87726 4.69528 5.87726 5.19313 6.36822L9.57082 10.6853L11.4421 7.90881C11.6481 7.60408 11.9914 7.40092 12.3863 7.35013C12.7811 7.31628 13.1588 7.45171 13.4163 7.72259L20.6266 14.833C21.1245 15.324 21.1245 16.1366 20.6266 16.6275C20.3691 16.8815 20.0429 17 19.7167 17Z" fill="currentColor" /><path d="M19.7143 17H16.2857C15.5829 17 15 16.4171 15 15.7143C15 15.0114 15.5829 14.4286 16.2857 14.4286H18.4286V12.2857C18.4286 11.5829 19.0114 11 19.7143 11C20.4171 11 21 11.5829 21 12.2857V15.7143C21 16.4171 20.4171 17 19.7143 17Z" fill="currentColor" /></svg>−18%</span>
      </div>
      <p class="hstat-value">4m 12s</p>
      <p class="hstat-caption">Median, in working hours</p>
    </div>
  </div>
  ```

- Tag: `.htag-remove`, or `<TagRemove>`, a button after the text that
  removes the tag, such as a filter: a 12px cross with a 24px target, named
  in your app's language.

  ```html preview="tag/With a remove button"
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
    <ul class="htag-list">
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

  ```html
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

- Button: an icon beside the label is drawn at 20px, as an icon-only
  button's is, whatever size its SVG declares, so icons from different sets
  match each other and the loading spinner. In 0.3.0 it kept its SVG's own
  size, so a 24px icon beside a label looked bigger than an 18px one.
  ChevronToArrow and the Expand Chevron keep their own sizes.

### Fixed

- A list, in a Select or a popup, keeps its keyboard highlight when it opens
  or moves under a pointer at rest; leaving it clears the highlight only once
  the pointer has moved in it.
- `<OptionGroup hidden>` hides the group and its options: it showed them,
  and the arrow keys reached them. The example script, `listbox.js`, skips
  the options of a hidden group too.
- React: a part given something that draws nothing, such as `true`, `[]`,
  or an empty fragment, is left out, as one given `null` is, rather than
  rendered empty, such as a Tooltip with no text or an Option's empty
  description.
- `<Tooltip label={0}>` or `description={0}` names or describes its control
  and shows 0 in the tooltip: a 0 was taken for no text, leaving the control
  unnamed and a stray 0 beside it.

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

[Unreleased]: https://github.com/windrunner21/harmo/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/windrunner21/harmo/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/windrunner21/harmo/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/windrunner21/harmo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/windrunner21/harmo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/windrunner21/harmo/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/windrunner21/harmo/releases/tag/v0.1.1
