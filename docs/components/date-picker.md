# Date Picker

A date typed in the locale's order, or chosen from a [Calendar](calendar.md)
that a button inside the field opens. Type digits and the separators are added
for you; a date that doesn't exist stays where it is, marked invalid, so nothing
you typed is lost.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `date-picker.css`, `input.css`, `button.css`, `popup.css`, `calendar.css`, `chevron.css`; `field.css` for a label |
| Element | `<div class="hdate-picker">`, followed by `<div class="hpopup hdate-picker-popup" popover role="dialog">` |
| Parts | In `.hdate-picker`: `<input class="hinput" type="text">`, a small tertiary `.hbutton` with only a `.hicon`, and a hidden input with the date for a form. In the popup: a [Calendar](calendar.md) |
| Required | `anchor-name` on `.hdate-picker`, and the same name as the popup's `position-anchor`; `popovertarget` on the button, naming the popup; an `aria-label` on the button and on the popup, in the page's language; `aria-haspopup="dialog"` and `aria-expanded` on the button; `autocomplete="off"` on the input, which a [Field](field.md) labels |
| Unique | The input's and the popup's `id`s, the Calendar title's `id`, and the anchor name |
| Script | Required: to write and read the date, and for the Calendar. Opening, Escape, and a press outside are the browser's, from `popovertarget` |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="due-date">Due date</label>
  <div class="hdate-picker" style="anchor-name: --due-date">
    <input class="hinput" id="due-date" type="text" inputmode="numeric" autocomplete="off" placeholder="mm/dd/yyyy" value="11/18/2026" />
    <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Choose a date" aria-haspopup="dialog" aria-expanded="false" popovertarget="due-date-calendar">
      <svg class="hicon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M8 5.75C7.59 5.75 7.25 5.41 7.25 5V2C7.25 1.59 7.59 1.25 8 1.25C8.41 1.25 8.75 1.59 8.75 2V5C8.75 5.41 8.41 5.75 8 5.75Z" fill="currentColor" />
        <path d="M16 5.75C15.59 5.75 15.25 5.41 15.25 5V2C15.25 1.59 15.59 1.25 16 1.25C16.41 1.25 16.75 1.59 16.75 2V5C16.75 5.41 16.41 5.75 16 5.75Z" fill="currentColor" />
        <path d="M8.5 14.5001C8.37 14.5001 8.24 14.4701 8.12 14.4201C7.99 14.3701 7.89 14.3001 7.79 14.2101C7.61 14.0201 7.5 13.7701 7.5 13.5001C7.5 13.3701 7.53 13.2401 7.58 13.1201C7.63 13.0001 7.7 12.8901 7.79 12.7901C7.89 12.7001 7.99 12.6301 8.12 12.5801C8.48 12.4301 8.93 12.5101 9.21 12.7901C9.39 12.9801 9.5 13.2401 9.5 13.5001C9.5 13.5601 9.49 13.6301 9.48 13.7001C9.47 13.7601 9.45 13.8201 9.42 13.8801C9.4 13.9401 9.37 14.0001 9.33 14.0601C9.3 14.1101 9.25 14.1601 9.21 14.2101C9.02 14.3901 8.76 14.5001 8.5 14.5001Z" fill="currentColor" />
        <path d="M12 14.4999C11.87 14.4999 11.74 14.4699 11.62 14.4199C11.49 14.3699 11.39 14.2999 11.29 14.2099C11.11 14.0199 11 13.7699 11 13.4999C11 13.3699 11.03 13.2399 11.08 13.1199C11.13 12.9999 11.2 12.8899 11.29 12.7899C11.39 12.6999 11.49 12.6299 11.62 12.5799C11.98 12.4199 12.43 12.5099 12.71 12.7899C12.89 12.9799 13 13.2399 13 13.4999C13 13.5599 12.99 13.6299 12.98 13.6999C12.97 13.7599 12.95 13.8199 12.92 13.8799C12.9 13.9399 12.87 13.9999 12.83 14.0599C12.8 14.1099 12.75 14.1599 12.71 14.2099C12.52 14.3899 12.26 14.4999 12 14.4999Z" fill="currentColor" />
        <path d="M15.5 14.4999C15.37 14.4999 15.24 14.4699 15.12 14.4199C14.99 14.3699 14.89 14.2999 14.79 14.2099C14.75 14.1599 14.71 14.1099 14.67 14.0599C14.63 13.9999 14.6 13.9399 14.58 13.8799C14.55 13.8199 14.53 13.7599 14.52 13.6999C14.51 13.6299 14.5 13.5599 14.5 13.4999C14.5 13.2399 14.61 12.9799 14.79 12.7899C14.89 12.6999 14.99 12.6299 15.12 12.5799C15.49 12.4199 15.93 12.5099 16.21 12.7899C16.39 12.9799 16.5 13.2399 16.5 13.4999C16.5 13.5599 16.49 13.6299 16.48 13.6999C16.47 13.7599 16.45 13.8199 16.42 13.8799C16.4 13.9399 16.37 13.9999 16.33 14.0599C16.3 14.1099 16.25 14.1599 16.21 14.2099C16.02 14.3899 15.76 14.4999 15.5 14.4999Z" fill="currentColor" />
        <path d="M8.5 17.9999C8.37 17.9999 8.24 17.97 8.12 17.92C8 17.87 7.89 17.7999 7.79 17.7099C7.61 17.5199 7.5 17.2599 7.5 16.9999C7.5 16.8699 7.53 16.7399 7.58 16.6199C7.63 16.4899 7.7 16.38 7.79 16.29C8.16 15.92 8.84 15.92 9.21 16.29C9.39 16.48 9.5 16.7399 9.5 16.9999C9.5 17.2599 9.39 17.5199 9.21 17.7099C9.02 17.8899 8.76 17.9999 8.5 17.9999Z" fill="currentColor" />
        <path d="M12 17.9999C11.74 17.9999 11.48 17.8899 11.29 17.7099C11.11 17.5199 11 17.2599 11 16.9999C11 16.8699 11.03 16.7399 11.08 16.6199C11.13 16.4899 11.2 16.38 11.29 16.29C11.66 15.92 12.34 15.92 12.71 16.29C12.8 16.38 12.87 16.4899 12.92 16.6199C12.97 16.7399 13 16.8699 13 16.9999C13 17.2599 12.89 17.5199 12.71 17.7099C12.52 17.8899 12.26 17.9999 12 17.9999Z" fill="currentColor" />
        <path d="M15.5 17.9999C15.24 17.9999 14.98 17.8899 14.79 17.7099C14.7 17.6199 14.63 17.5099 14.58 17.3799C14.53 17.2599 14.5 17.1299 14.5 16.9999C14.5 16.8699 14.53 16.7399 14.58 16.6199C14.63 16.4899 14.7 16.3799 14.79 16.2899C15.02 16.0599 15.37 15.9499 15.69 16.0199C15.76 16.0299 15.82 16.0499 15.88 16.0799C15.94 16.0999 16 16.1299 16.06 16.1699C16.11 16.1999 16.16 16.2499 16.21 16.2899C16.39 16.4799 16.5 16.7399 16.5 16.9999C16.5 17.2599 16.39 17.5199 16.21 17.7099C16.02 17.8899 15.76 17.9999 15.5 17.9999Z" fill="currentColor" />
        <path d="M20.5 9.83984H3.5C3.09 9.83984 2.75 9.49984 2.75 9.08984C2.75 8.67984 3.09 8.33984 3.5 8.33984H20.5C20.91 8.33984 21.25 8.67984 21.25 9.08984C21.25 9.49984 20.91 9.83984 20.5 9.83984Z" fill="currentColor" />
        <path d="M16 22.75H8C4.35 22.75 2.25 20.65 2.25 17V8.5C2.25 4.85 4.35 2.75 8 2.75H16C19.65 2.75 21.75 4.85 21.75 8.5V17C21.75 20.65 19.65 22.75 16 22.75ZM8 4.25C5.14 4.25 3.75 5.64 3.75 8.5V17C3.75 19.86 5.14 21.25 8 21.25H16C18.86 21.25 20.25 19.86 20.25 17V8.5C20.25 5.64 18.86 4.25 16 4.25H8Z" fill="currentColor" />
      </svg>
    </button>
    <input type="hidden" name="due" value="2026-11-18" />
  </div>
  <div class="hpopup hdate-picker-popup" id="due-date-calendar" popover role="dialog" aria-label="Choose a date" style="position-anchor: --due-date">
    <div class="hcalendar">
      <div class="hcalendar-header">
        <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Previous month">
          <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
          </svg>
        </button>
        <p class="hcalendar-title" id="due-date-month" aria-live="polite">November 2026</p>
        <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Next month">
          <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <table class="hcalendar-grid" role="grid" aria-labelledby="due-date-month">
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
  </div>
</div>
```

The hidden input holds the date as `2026-11-18`, whatever the field shows.

## Options

| Hook | Effect |
| --- | --- |
| `aria-invalid="true"` on the input | What's typed isn't a date that can be chosen: the Input's error look |
| `disabled` on the input and the button | It can't be used |
| `disabled` on the hidden input | The date isn't sent with a form |

## Appearance and states

- An [Input](input.md), with room at its end for a small tertiary
  [Button](button.md) with a calendar icon, 2px from the edge.
- The popup opens under the field, at its start, 16px around the Calendar, as
  wide as the Calendar whatever the field's width. Without room, it opens above,
  or moves, as any [Popup](popup.md) does.
- Right-to-left, the button is at the left end and the popup starts at the
  field's right.

## Accessibility

- The field is a real text input, labelled by its Field, and typing a date
  needs no pointer.
- The button is named, and says it opens a dialog and whether it's open. The
  popup is a dialog with the same name.
- Opening moves focus to the chosen date, else today, else the month's first day
  that can be chosen. Escape closes it and returns focus to the button, and so
  does picking a date. Tab past the Calendar closes it, and so does Shift+Tab
  back to the button.
- A date that can't be chosen sets `aria-invalid` and keeps what you typed.
  Say why with a [Field](field.md)'s error, which `aria-describedby` connects.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| Keep only the digits typed, and add the separators in the locale's order, keeping the caret after the same digit | As someone types |
| Rewrite the field, set the hidden input's value, and remove `aria-invalid` | When a real date is typed and the field is left, or Enter is pressed |
| Keep the text, set `aria-invalid="true"`, and empty the hidden input | When what's typed is half a date, doesn't exist, or is outside the limits |
| Show the Calendar on the date chosen, else today, and move focus to its day in the Tab order | As the popup opens |
| Set the field and the hidden input, close the popup, and focus the button | When a day is picked |
| Close the popup | When focus leaves it for something outside it, unless the button is being pressed, which toggles it |
| Restore the field, the hidden input, and `aria-invalid` to how the page loaded | On the form's reset |

`Intl.DateTimeFormat`'s `formatToParts` gives the locale's order and separator.
Keep the separator whole: a right-to-left date needs the marks inside it.

The playground's example script, `examples/html/src/scripts/date-picker.js`,
does all of this, and `calendar.js` the Calendar.

## React

`<DatePicker>` renders the Field, the field, the button, the popup, and the
[Calendar](calendar.md), and does everything above. Dates are strings, as
`"2026-11-18"`. Other props are the `<input>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | The Field around it. Without a `label`, name the input with `aria-label` |
| `locale` | Required: the order and digits of the date, and the Calendar's language |
| `calendarLabel` | Required: the name of the button and the popup, such as "Choose a date" |
| `previousLabel`, `nextLabel` | Required: the Calendar's Previous and Next names |
| `value`, `defaultValue` | The date, or `null` for none |
| `onValueChange` | Called with the date, or `null` when it's cleared, or what's typed can't be chosen |
| `onInvalidChange` | Called with `true` when what's typed can't be chosen, and `false` once that's over, so your app can set `error` |
| `name` | Sends the date with a form, in a hidden input, as `2026-11-18` |
| `min`, `max` | The first and last dates that can be chosen, typed or picked. They're dates, as `"2026-11-05"`, even with `time`; check a time yourself in `onValueChange` |
| `weekStartsOn`, `today` | As for the Calendar |
| `natural` | A date parser your app brings, such as `chrono-node`: anything with a `parseDate` method that takes text and returns a `Date`, or `null`. What's typed is read in words, and written in full, such as "November 18, 2026" |
| `parse` | Reads what's typed yourself: returns a date as `"2026-11-18"`, or `null`. With it, digits aren't arranged as you type. A date it accepts is rewritten when it settles, in the locale's digits unless you pass `format` |
| `time` | With `natural` or `parse`: the value has a time too, as `"2026-11-18T14:00"`, the format of a native `datetime-local` input. A date picked from the Calendar keeps the time |
| `format` | Writes the value in the field, in place of the locale's digits, or the date in full |

```tsx
<DatePicker
  label="Due date"
  name="due"
  locale="en-US"
  placeholder="mm/dd/yyyy"
  calendarLabel="Choose a date"
  previousLabel="Previous month"
  nextLabel="Next month"
  value={date}
  onValueChange={setDate}
/>
```

Enter settles a date that's changed rather than send the form; pressed again,
it sends it.

Harmo doesn't include a date parser or depend on one. For natural language,
install `chrono-node`, or any parser with a `parseDate` method, in your app and
pass it in:

```tsx
import * as chrono from "chrono-node";

<DatePicker natural={chrono} time label="Send on" locale="en-US" calendarLabel="Choose a date" previousLabel="Previous month" nextLabel="Next month" />
```

Pass one language's parser, such as `chrono.de`, for German, and to keep the
other languages out of your bundle.

Without `natural` or `parse`, the value is a date with no time. For a separate
time field, put a [Time Picker](time-picker.md) beside it.

## Tokens

`--harmo-color-background`, as for a [Popup](popup.md); those of the
[Input](input.md), the [Button](button.md), and the [Calendar](calendar.md).
