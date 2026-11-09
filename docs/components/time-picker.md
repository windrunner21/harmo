# Time Picker

A time of day, chosen from a column each for the hour, the minute, and, on a
12-hour clock, AM or PM. It shows the time on the locale's clock and holds it as
`14:30`.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `time-picker.css`, `popup.css`, `expand-chevron.css`; `field.css` for a label |
| Element | `<button class="htime-picker" type="button">`, followed by a `<div class="hpopup htime-picker-popup" popover role="dialog">` |
| Parts | In the trigger: `.htime-picker-value` and an [Expand Chevron](expand-chevron.md). In the popup: a `<ul class="htime-picker-column" role="listbox">` for each column, with `<li class="htime-picker-option" role="option">`s. After the popup, a hidden input with the time for a form |
| Required | On the trigger: `aria-labelledby` naming both its label and `.htime-picker-value`, `aria-haspopup="dialog"`, `aria-expanded`, `popovertarget` naming the popup, and `anchor-name`, the same name as the popup's `position-anchor`. On the popup: a name. On each column: an `aria-label` in the page's language, `tabindex="0"`, and `aria-activedescendant` naming its chosen option. On each option: an `id` and `aria-selected` |
| Unique | Every `id`, and each anchor name |
| Script | Required: to choose, for the keyboard, and to show the time. Opening, Escape, and a press outside are the browser's, from `popovertarget` |

## Markup

```html
<div class="hfield">
  <span class="hlabel" id="opens-at-label">Opens at</span>
  <button class="htime-picker" id="opens-at" type="button" aria-labelledby="opens-at-label opens-at-value" aria-haspopup="dialog" aria-expanded="false" popovertarget="opens-at-popup" style="anchor-name: --opens-at">
    <span class="htime-picker-value" id="opens-at-value">09:00</span>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
      <g class="hexpand-chevron-head">
      <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
      <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
      </g>
    </svg>
  </button>
  <div class="hpopup htime-picker-popup" id="opens-at-popup" popover role="dialog" aria-labelledby="opens-at-label" style="position-anchor: --opens-at">
    <ul class="htime-picker-column" role="listbox" aria-label="Hour" tabindex="0" aria-activedescendant="opens-at-hour-9">
      <li class="htime-picker-option" id="opens-at-hour-0" role="option" aria-selected="false">00</li>
      <li class="htime-picker-option" id="opens-at-hour-1" role="option" aria-selected="false">01</li>
      <li class="htime-picker-option" id="opens-at-hour-2" role="option" aria-selected="false">02</li>
      <li class="htime-picker-option" id="opens-at-hour-3" role="option" aria-selected="false">03</li>
      <li class="htime-picker-option" id="opens-at-hour-4" role="option" aria-selected="false">04</li>
      <li class="htime-picker-option" id="opens-at-hour-5" role="option" aria-selected="false">05</li>
      <li class="htime-picker-option" id="opens-at-hour-6" role="option" aria-selected="false">06</li>
      <li class="htime-picker-option" id="opens-at-hour-7" role="option" aria-selected="false">07</li>
      <li class="htime-picker-option" id="opens-at-hour-8" role="option" aria-selected="false">08</li>
      <li class="htime-picker-option" id="opens-at-hour-9" role="option" aria-selected="true">09</li>
      <li class="htime-picker-option" id="opens-at-hour-10" role="option" aria-selected="false">10</li>
      <li class="htime-picker-option" id="opens-at-hour-11" role="option" aria-selected="false">11</li>
      <li class="htime-picker-option" id="opens-at-hour-12" role="option" aria-selected="false">12</li>
      <li class="htime-picker-option" id="opens-at-hour-13" role="option" aria-selected="false">13</li>
      <li class="htime-picker-option" id="opens-at-hour-14" role="option" aria-selected="false">14</li>
      <li class="htime-picker-option" id="opens-at-hour-15" role="option" aria-selected="false">15</li>
      <li class="htime-picker-option" id="opens-at-hour-16" role="option" aria-selected="false">16</li>
      <li class="htime-picker-option" id="opens-at-hour-17" role="option" aria-selected="false">17</li>
      <li class="htime-picker-option" id="opens-at-hour-18" role="option" aria-selected="false">18</li>
      <li class="htime-picker-option" id="opens-at-hour-19" role="option" aria-selected="false">19</li>
      <li class="htime-picker-option" id="opens-at-hour-20" role="option" aria-selected="false">20</li>
      <li class="htime-picker-option" id="opens-at-hour-21" role="option" aria-selected="false">21</li>
      <li class="htime-picker-option" id="opens-at-hour-22" role="option" aria-selected="false">22</li>
      <li class="htime-picker-option" id="opens-at-hour-23" role="option" aria-selected="false">23</li>
    </ul>
    <ul class="htime-picker-column" role="listbox" aria-label="Minute" tabindex="0" aria-activedescendant="opens-at-minute-0">
      <li class="htime-picker-option" id="opens-at-minute-0" role="option" aria-selected="true">00</li>
      <li class="htime-picker-option" id="opens-at-minute-15" role="option" aria-selected="false">15</li>
      <li class="htime-picker-option" id="opens-at-minute-30" role="option" aria-selected="false">30</li>
      <li class="htime-picker-option" id="opens-at-minute-45" role="option" aria-selected="false">45</li>
    </ul>
  </div>
  <input type="hidden" name="opens" value="09:00" />
</div>
```

The hidden input holds the time as `09:00`, 24-hour, whatever the trigger shows.

## Options

| Hook | Effect |
| --- | --- |
| `aria-selected="true"` on an option | The hour, minute, or period chosen, filled |
| `data-placeholder` on `.htime-picker-value` | No time chosen: the placeholder's color |
| `disabled` on the trigger and the hidden input | It can't be opened, and the time isn't sent with a form |

## Appearance and states

- The trigger looks like a [Select](select.md), as wide as what it shows, with
  digits of one width, so it doesn't shift as the time changes. Set an
  `inline-size` to make it wider.
- The popup opens under the trigger, one column beside the next with a line
  between them. Columns are 200px tall at most and scroll on their own.
- Options: 40 by 32px, 14px text, with `--harmo-border-radius-sm` corners.
  Hovered, on `--harmo-color-background-hover`. Chosen,
  `--harmo-color-on-primary` on `--harmo-color-primary-fill`, and in
  forced-colors mode in the system's highlight.
- A column that has keyboard focus shows the focus ring just inside its edge.
- Right-to-left, the columns run from the right.

## Accessibility

- The trigger's name is its label and the time, such as "Start time 02:30 PM",
  so a screen reader says both.
- Each column is a listbox of its own, named in your language. As in a listbox,
  the choice moves with the keyboard.
- Text comes from your app, in its language; the digits and AM and PM come from
  `Intl`.

| Key | Does |
| --- | --- |
| Up and Down arrows | Chooses the option before or after, wrapping at the ends |
| Home and End | Chooses the first or last option |
| Left and Right arrows | Moves to the column before or after, following what you see in right-to-left text |
| Tab | Moves through the columns; past the last, or Shift+Tab from the first, it closes the popup |
| Enter and Space | Closes the popup and returns focus to the trigger |
| Escape | Closes the popup and returns focus to the trigger |

## What a script does

| Change | When |
| --- | --- |
| Move `aria-selected` and `aria-activedescendant`, write the time in `.htime-picker-value`, remove `data-placeholder`, and set the hidden input | When an option is chosen |
| Scroll each column to its chosen option, and focus the first column | As the popup opens |
| Keep the chosen option in view | As the keyboard moves through a column |
| Close the popup and focus the trigger | On Enter or Space in a column |
| Close the popup | When focus leaves it for something outside it, unless the trigger is being pressed, which toggles it |
| Restore the time, the options, and the hidden input to how the page loaded | On the form's reset |

What hasn't been chosen yet counts as its column's first option, so the first
choice makes a whole time.

The playground's example script, `examples/html/src/scripts/time-picker.js`,
does all of this.

## React

`<TimePicker>` renders the Field, the trigger, the popup, and its columns, and
does everything above. Times are strings, as `"14:30"`, 24-hour. Other props are
the `<button>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | The Field around it. Without a `label`, name it with `aria-label` |
| `locale` | Required: its clock, digits, and order of columns |
| `hourLabel`, `minuteLabel`, `periodLabel` | Required: the columns' names |
| `value`, `defaultValue` | The time, or `null` for none. A time that doesn't exist is ignored |
| `onValueChange` | Called with the time as it changes |
| `name` | Sends the time with a form, in a hidden input |
| `placeholder` | What it shows with no time chosen |
| `minuteStep` | The minutes offered, every 15 by default, from 1 to 60. A time between them is still offered, and stays offered as you move off it |
| `hour12` | `true` or `false` for a 12 or 24-hour clock, in place of the locale's |

```tsx
<TimePicker
  label="Start time"
  name="start"
  locale="en-US"
  hourLabel="Hour"
  minuteLabel="Minute"
  periodLabel="AM or PM"
  value={time}
  onValueChange={setTime}
/>
```

## Tokens

`--harmo-font-size-sm`, `--harmo-color-text`, `--harmo-color-border`,
`--harmo-color-background-hover`, `--harmo-color-primary-fill`,
`--harmo-color-primary-fill-hover`, `--harmo-color-on-primary`,
`--harmo-border-radius-sm`, `--harmo-focus-outline`, `--harmo-button-duration`,
`--harmo-control-height`, `--harmo-color-text-secondary`,
`--harmo-color-text-tertiary`; those of an [Input](input.md) and the
[Popup](popup.md).
