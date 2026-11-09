# Calendar

A month of days to pick a date from, by pointer or keyboard: the month's name
between Previous and Next, then the days. Its names come from the locale, so it
speaks the language of your page.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `calendar.css`, `button.css`, `chevron.css` |
| Element | `<div class="hcalendar">` |
| Parts | `.hcalendar-header`, holding Previous and Next as small tertiary `.hbutton`s with only a `.hchevron`, around `<p class="hcalendar-title">`; then `<table class="hcalendar-grid" role="grid">`, with a `<thead>` of seven `<th scope="col" abbr="…">` and a `<tbody>` of six rows of seven `<td>`, each empty or holding a `<button class="hcalendar-day" type="button">` |
| Required | An `aria-label` on Previous and Next, in the page's language; `aria-live="polite"` on the title; `aria-labelledby` on the grid, naming the title; on each day, an `aria-label` with its whole date and `data-date` with its date, as `2026-11-09`; `tabindex="0"` on one day, and `tabindex="-1"` on the rest |
| Unique | The title's `id` |
| Script | Required: to change month, to choose a day, and for the keyboard |

## Markup

November 2026, with the 18th chosen and today the 9th. There are six rows
whatever the month, with empty cells for days outside it:

```html
<div class="hcalendar">
  <div class="hcalendar-header">
    <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Previous month">
      <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
    </svg>
    </button>
    <p class="hcalendar-title" id="month-title" aria-live="polite">November 2026</p>
    <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Next month">
      <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
    </svg>
    </button>
  </div>
  <table class="hcalendar-grid" role="grid" aria-labelledby="month-title">
    <thead>
      <tr>
        <th scope="col" abbr="Sunday">Sun</th>
        <th scope="col" abbr="Monday">Mon</th>
        <th scope="col" abbr="Tuesday">Tue</th>
        <th scope="col" abbr="Wednesday">Wed</th>
        <th scope="col" abbr="Thursday">Thu</th>
        <th scope="col" abbr="Friday">Fri</th>
        <th scope="col" abbr="Saturday">Sat</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-01" aria-label="Sunday, November 1, 2026">1</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-02" aria-label="Monday, November 2, 2026">2</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-03" aria-label="Tuesday, November 3, 2026">3</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-04" aria-label="Wednesday, November 4, 2026">4</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-05" aria-label="Thursday, November 5, 2026">5</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-06" aria-label="Friday, November 6, 2026">6</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-07" aria-label="Saturday, November 7, 2026">7</button></td>
      </tr>
      <tr>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-08" aria-label="Sunday, November 8, 2026">8</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-09" aria-label="Monday, November 9, 2026" aria-current="date">9</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-10" aria-label="Tuesday, November 10, 2026">10</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-11" aria-label="Wednesday, November 11, 2026">11</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-12" aria-label="Thursday, November 12, 2026">12</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-13" aria-label="Friday, November 13, 2026">13</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-14" aria-label="Saturday, November 14, 2026">14</button></td>
      </tr>
      <tr>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-15" aria-label="Sunday, November 15, 2026">15</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-16" aria-label="Monday, November 16, 2026">16</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-17" aria-label="Tuesday, November 17, 2026">17</button></td>
        <td aria-selected="true"><button class="hcalendar-day" type="button" tabindex="0" data-date="2026-11-18" aria-label="Wednesday, November 18, 2026">18</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-19" aria-label="Thursday, November 19, 2026">19</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-20" aria-label="Friday, November 20, 2026">20</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-21" aria-label="Saturday, November 21, 2026">21</button></td>
      </tr>
      <tr>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-22" aria-label="Sunday, November 22, 2026">22</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-23" aria-label="Monday, November 23, 2026">23</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-24" aria-label="Tuesday, November 24, 2026">24</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-25" aria-label="Wednesday, November 25, 2026">25</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-26" aria-label="Thursday, November 26, 2026">26</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-27" aria-label="Friday, November 27, 2026">27</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-28" aria-label="Saturday, November 28, 2026">28</button></td>
      </tr>
      <tr>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-29" aria-label="Sunday, November 29, 2026">29</button></td>
        <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-30" aria-label="Monday, November 30, 2026">30</button></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>
```

`Intl` gives the names in any language: `Intl.DateTimeFormat` for the title,
the weekdays, and each day's whole date, and `Intl.Locale`'s week info for
where the week starts.

## Options

| Hook | Effect |
| --- | --- |
| `aria-selected="true"` on a `<td>` | The chosen date, filled |
| `aria-current="date"` on a day | Today, tinted |
| `disabled` on a day | A day that can't be chosen, faded |
| `aria-disabled="true"` on Previous or Next | At the first or last month that can be shown; it stays focusable, as a [Button](button.md) does |
| `--hcalendar-day-size` on `.hcalendar` | The size of a day: 40px, or smaller if a 320px screen needs it. Seven days need seven times this, so set it smaller for a narrower container, such as `2rem` in a 240px sidebar |

## Appearance and states

- 16px between the header and the grid. The title: 14px at medium weight in
  `--harmo-color-text`. Previous and Next: small tertiary [Buttons](button.md)
  with a chevron, at the header's two ends.
- Weekdays: 12px in `--harmo-color-text-secondary`, 8px above the days.
- Days: 40px squares, 14px numbers at medium weight, of one width each, with
  `--harmo-border-radius-sm` corners. Hovered, on
  `--harmo-color-background-hover`; pressed, they shrink slightly, as a Button
  does.
- Today: on `--harmo-color-background-secondary`. In forced-colors mode, where
  a tint is gone, a 1px line just inside its edge.
- The chosen date: `--harmo-color-on-primary` on `--harmo-color-primary-fill`,
  and in forced-colors mode in the system's highlight.
- A disabled day: at `--harmo-opacity-disabled`, with a not-allowed cursor.
- Always six rows, so it's the same height in every month, and Previous and
  Next stay where they are.
- Right-to-left, the week runs from the right, Previous and Next swap sides,
  and their chevrons point in the reading direction.

## Accessibility

- A `role="grid"` table, named by the month, whose column headers carry each
  weekday's whole name in `abbr`.
- Each day is a real button named with its whole date, such as "Monday,
  November 9, 2026", where a screen reader would read only "9". The name
  contains the number shown, so a voice command such as "click 9" still finds
  it.
- One day is in the Tab order, the WAI-ARIA date grid's roving focus: the one
  the keyboard is on, else the chosen date, else today, else the month's first
  day that can be chosen.
- The title is a polite live region, so a screen reader says the month as it
  changes.
- `aria-selected` says which date is chosen, and `aria-current="date"` which
  is today.
- Text comes from your app, in its language.

| Key | Moves to |
| --- | --- |
| Left and Right arrows | The day before or after, following what you see in right-to-left text |
| Up and Down arrows | The same weekday, a week earlier or later |
| Home and End | The start or end of the week, within the month |
| Page Up and Page Down | The same day of the month before or after, or that month's last day if it's shorter |
| Shift with Page Up and Page Down | The same day a year earlier or later |
| Enter and Space | Chooses the day, as any button |

Moving past the month shown shows the next one. Moving past the minimum or
maximum stops there, and so does moving past the years 100 and 9999, the first
and last it can show.

## What a script does

| Change | When |
| --- | --- |
| Redraw the title, the rows, and the `aria-disabled` on Previous and Next | When the month changes |
| Move `aria-selected="true"` to the day's `<td>` | When a day is chosen |
| Move focus and the one `tabindex="0"` | When the keyboard moves, by the table above |
| Ignore activation | While Previous or Next has `aria-disabled="true"` |

Count dates in UTC, as `2026-11-09` strings, so that daylight saving can't
move a day. Ask `Intl.DateTimeFormat` for the Gregorian calendar, which the
grid is.

The playground's example script, `examples/html/src/scripts/calendar.js`, does
all of this.

## React

`<Calendar>` renders the month and does everything above. Dates are strings,
as `"2026-11-09"`, and months as `"2026-11"`, with no time or timezone to go
wrong, as a native date input's value is. Other props are the `<div>`'s
attributes.

| Prop | Effect |
| --- | --- |
| `locale` | Required: the language of its names and where the week starts, such as `"en-US"` |
| `previousLabel`, `nextLabel` | Required: Previous's and Next's names, such as "Previous month" |
| `value`, `defaultValue` | The chosen date. A date that doesn't exist, or is before the year 100, is ignored |
| `onValueChange` | Called with the date chosen |
| `month`, `defaultMonth` | The month shown; otherwise the chosen date's, or today's. Unless you hold it with `month`, it follows `value` as that changes |
| `onMonthChange` | Called with the month as it changes |
| `min`, `max` | The first and last dates that can be chosen. The month shown stays within them, unless you hold it with `month` |
| `weekStartsOn` | The first day of the week, from `0` for Sunday, in place of the locale's. A browser with no week info gets Monday, so set this where the week has to be right everywhere |
| `today` | The date to mark as today, in place of the browser's |

```tsx
<Calendar
  locale="en-US"
  previousLabel="Previous month"
  nextLabel="Next month"
  value={date}
  onValueChange={setDate}
  min="2026-11-05"
/>
```

Only the browser knows today's date. Rendered on the server, with no `value`,
`defaultMonth`, or `today`, it's blank at its full size until the page is
interactive, so nothing shifts.

Servers and browsers word dates slightly differently, such as "Sunday, 1
February" and "Sunday 1 February", so the names rendered on the server can
differ a little from the browser's. They stay until the month changes, with no
hydration warning. Where the two could disagree about where the week starts,
set `weekStartsOn`.

## Tokens

`--harmo-font-family`, `--harmo-font-size-sm`, `--harmo-font-size-xs`,
`--harmo-font-weight-medium`, `--harmo-font-weight-normal`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-color-background-secondary`, `--harmo-color-background-hover`,
`--harmo-color-primary-fill`, `--harmo-color-primary-fill-hover`,
`--harmo-color-on-primary`, `--harmo-border-radius-sm`,
`--harmo-opacity-disabled`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`, `--harmo-button-duration`,
`--harmo-ease-out-quad`; Button's, for Previous and Next.
