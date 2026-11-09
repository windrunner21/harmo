# Date Filter

A chip that filters a list by date: within the last few minutes or months, on a
day, between two days, after a day, or before one. Its value is a pair of Unix
timestamps, the shape a URL or an API holds, so a link can restore the filter.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `date-filter.css`, `filter-chip.css`, `popup.css`, `select.css`, `listbox.css`, `expand-chevron.css`, `input.css`, `date-picker.css`, `calendar.css`, `button.css`, `chevron.css` |
| Element | `<button class="hfilter-chip" aria-haspopup="dialog">`, opening `<div class="hpopup hdate-filter" popover role="dialog">` |
| Parts | In the panel, in order: a [Select](select.md) of conditions; `.hdate-filter-fields` with `.hdate-filter-amount` and a Select of units; `.hdate-filter-fields` with a [Date Picker](date-picker.md), `.hdate-filter-and`, and a second Date Picker; `.hdate-filter-actions` with Clear and Apply as `.hbutton`s |
| Required | An `aria-label` on the panel and on each field, in the page's language. `popovertarget` and anchor names, as each popup needs. `hidden` on what the condition doesn't need |
| Unique | The `id`s of the popups, lists, options, and Calendar titles, and the anchor names |
| Script | Required: for everything but opening and closing, which are the browser's, from `popover`. See What a script does |

## Markup

The fields for every condition are in the page, with those not needed hidden:

```html
<button class="hfilter-chip" type="button" aria-haspopup="dialog" popovertarget="due-filter" aria-expanded="false" style="anchor-name:--due-filter">
  <svg class="hicon" width="18" height="18" viewBox="0 0 24 25" fill="none" aria-hidden="true" focusable="false">
<path d="M12 23.625C6.07 23.625 1.25 18.805 1.25 12.875C1.25 6.945 6.07 2.125 12 2.125C17.93 2.125 22.75 6.945 22.75 12.875C22.75 18.805 17.93 23.625 12 23.625ZM12 3.625C6.9 3.625 2.75 7.775 2.75 12.875C2.75 17.975 6.9 22.125 12 22.125C17.1 22.125 21.25 17.975 21.25 12.875C21.25 7.775 17.1 3.625 12 3.625Z" fill="currentColor" />
<path d="M16 13.625H8C7.59 13.625 7.25 13.285 7.25 12.875C7.25 12.465 7.59 12.125 8 12.125H16C16.41 12.125 16.75 12.465 16.75 12.875C16.75 13.285 16.41 13.625 16 13.625Z" fill="currentColor" />
<path d="M12 17.625C11.59 17.625 11.25 17.285 11.25 16.875V8.875C11.25 8.465 11.59 8.125 12 8.125C12.41 8.125 12.75 8.465 12.75 8.875V16.875C12.75 17.285 12.41 17.625 12 17.625Z" fill="currentColor" />
</svg>
  <span class="hfilter-chip-label">Due date</span>
</button>
<div class="hpopup hdate-filter" id="due-filter" role="dialog" aria-label="Due date" popover style="position-anchor:--due-filter">
  <button class="hselect" type="button" role="combobox" aria-label="Condition" aria-haspopup="listbox" aria-expanded="false" aria-controls="due-condition-list" popovertarget="due-condition" style="anchor-name:--due-condition">
    <span class="hselect-value">is in the last</span>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
<g class="hexpand-chevron-head">
  <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
  <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
</g>
</svg>
  </button>
  <div class="hpopup" id="due-condition" popover style="position-anchor:--due-condition">
    <ul class="hlistbox" id="due-condition-list" role="listbox" aria-label="Condition">
      <li class="hoption" id="due-condition-last" role="option" aria-selected="true">
        <span class="hoption-label">is in the last</span>
        <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
<path
  d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z"
  fill="currentColor"
/>
</svg>
      </li>
      <li class="hoption" id="due-condition-equal" role="option" aria-selected="false">
        <span class="hoption-label">is equal to</span>
      </li>
      <li class="hoption" id="due-condition-between" role="option" aria-selected="false">
        <span class="hoption-label">is between</span>
      </li>
      <li class="hoption" id="due-condition-after" role="option" aria-selected="false">
        <span class="hoption-label">is after</span>
      </li>
      <li class="hoption" id="due-condition-before" role="option" aria-selected="false">
        <span class="hoption-label">is before</span>
      </li>
    </ul>
  </div>
  <div class="hdate-filter-fields">
    <input class="hinput hdate-filter-amount" aria-label="How many" inputmode="numeric" autocomplete="off" value="" />
    <button class="hselect" type="button" role="combobox" aria-label="Unit" aria-haspopup="listbox" aria-expanded="false" aria-controls="due-unit-list" popovertarget="due-unit" style="anchor-name:--due-unit">
      <span class="hselect-value">days</span>
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
<g class="hexpand-chevron-head">
  <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
  <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
</g>
</svg>
    </button>
    <div class="hpopup" id="due-unit" popover style="position-anchor:--due-unit">
      <ul class="hlistbox" id="due-unit-list" role="listbox" aria-label="Unit">
        <li class="hoption" id="due-unit-minutes" role="option" aria-selected="false">
          <span class="hoption-label">minutes</span>
        </li>
        <li class="hoption" id="due-unit-hours" role="option" aria-selected="false">
          <span class="hoption-label">hours</span>
        </li>
        <li class="hoption" id="due-unit-days" role="option" aria-selected="true">
          <span class="hoption-label">days</span>
          <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
<path
  d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z"
  fill="currentColor"
/>
</svg>
        </li>
        <li class="hoption" id="due-unit-weeks" role="option" aria-selected="false">
          <span class="hoption-label">weeks</span>
        </li>
        <li class="hoption" id="due-unit-months" role="option" aria-selected="false">
          <span class="hoption-label">months</span>
        </li>
      </ul>
    </div>
  </div>
  <div class="hdate-filter-fields" hidden>
    <div class="hdate-picker" style="anchor-name:--due-start">
      <input class="hinput" type="text" placeholder="mm/dd/yyyy" aria-label="Date" inputmode="numeric" autocomplete="off" value="" />
      <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Choose a date" aria-haspopup="dialog" aria-expanded="false" popovertarget="due-start-calendar">
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
    </div>
    <div class="hpopup hdate-picker-popup" id="due-start-calendar" role="dialog" popover aria-label="Choose a date" style="position-anchor:--due-start">
      <div class="hcalendar">
        <div class="hcalendar-header">
          <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Previous month">
            <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
  d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
  fill="currentColor"
/>
</svg>
          </button>
          <p class="hcalendar-title" id="due-start-month" aria-live="polite">November 2026</p>
          <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Next month">
            <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
  d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
  fill="currentColor"
/>
</svg>
          </button>
        </div>
        <table class="hcalendar-grid" role="grid" aria-labelledby="due-start-month">
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
              <td><button class="hcalendar-day" type="button" tabindex="0" data-date="2026-11-09" aria-label="Monday, November 9, 2026" aria-current="date">9</button></td>
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
              <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-18" aria-label="Wednesday, November 18, 2026">18</button></td>
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
    <span class="hdate-filter-and" hidden>and</span>
    <div class="hdate-picker" hidden style="anchor-name:--due-end">
      <input class="hinput" type="text" placeholder="mm/dd/yyyy" aria-label="End date" inputmode="numeric" autocomplete="off" value="" />
      <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Choose a date" aria-haspopup="dialog" aria-expanded="false" popovertarget="due-end-calendar">
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
    </div>
    <div class="hpopup hdate-picker-popup" id="due-end-calendar" role="dialog" popover aria-label="Choose a date" style="position-anchor:--due-end">
      <div class="hcalendar">
        <div class="hcalendar-header">
          <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Previous month">
            <svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
  d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
  fill="currentColor"
/>
</svg>
          </button>
          <p class="hcalendar-title" id="due-end-month" aria-live="polite">November 2026</p>
          <button class="hbutton" data-variant="tertiary" data-size="small" type="button" aria-label="Next month">
            <svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
<path
  d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z"
  fill="currentColor"
/>
</svg>
          </button>
        </div>
        <table class="hcalendar-grid" role="grid" aria-labelledby="due-end-month">
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
              <td><button class="hcalendar-day" type="button" tabindex="0" data-date="2026-11-09" aria-label="Monday, November 9, 2026" aria-current="date">9</button></td>
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
              <td><button class="hcalendar-day" type="button" tabindex="-1" data-date="2026-11-18" aria-label="Wednesday, November 18, 2026">18</button></td>
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
  <div class="hdate-filter-actions">
    <button class="hbutton" data-variant="tertiary" type="button" hidden>
      <span class="hbutton-label">Clear</span>
    </button>
    <button class="hbutton" type="button" aria-disabled="true">
      <span class="hbutton-label">Apply</span>
    </button>
  </div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `hidden` on `.hdate-filter-fields`, `.hdate-filter-and`, or the second `.hdate-picker` | Fields the condition doesn't need |
| `hidden` on Clear | Nothing is applied to clear |
| `aria-disabled="true"` on Apply | The fields aren't complete |
| `.hfilter-chip-values` in the chip | The range applied: one `.hfilter-chip-value`, as a [Filter Chip](filter-chip.md) shows |

## Appearance and states

- The chip is a Filter Chip. The panel is a Popup at least 200px wide, or as wide
  as the chip, with 8px of padding and 8px between its rows. Its width follows
  the fields of the condition.
- The amount is 4rem wide and the unit takes the rest. Two dates are side by side
  at 9.75rem each with the word between them, and wrap on a narrow screen, where
  each takes the whole row.
- The word between the dates is 14px in `--harmo-color-text-secondary`.
- The buttons are 8px further down, and share the row equally.
- Apply looks as a Button with `aria-disabled` does until the fields are complete.
- Right-to-left, the panel and its calendars read from the right.

## Accessibility

- The chip has `aria-haspopup="dialog"` and `aria-expanded`, and the range
  applied is part of its text, so screen readers hear it with its name.
- The panel is a dialog named by the filter. Opening moves focus to the
  condition, and Apply moves it back to the chip. Clear leaves the panel open
  and moves focus to the condition, since Clear itself goes.
- There are no visible labels, so each field has an `aria-label`: the condition,
  the amount, the unit, and each date.
- Apply uses `aria-disabled` rather than `disabled`, so a date typed and Apply
  pressed in one click both count: the date settles as the field loses focus,
  and the press lands on a button that is by then ready.
- A list or a Calendar opens over the panel: Escape closes it first, then the
  panel, and a press inside it leaves the panel open.

## What a script does

| Change | When |
| --- | --- |
| `hidden` on the fields | The condition changes |
| `aria-disabled` on Apply | The fields change. The amount must be a whole number above zero; two dates must be in order |
| The first date's latest day, and the second's earliest | The dates change, under "is between" |
| Fill the fields from the value applied, with the condition worked out from it | The panel opens |
| Write the value, show it in the chip, close the panel, focus the chip | Apply, or Enter in the amount |
| Empty the value, the chip, and the fields, and focus the condition. The panel stays open | Clear |

The value is `gte` and `lte`, in Unix seconds, either of which can be `null`:

| Condition | `gte` | `lte` |
| --- | --- | --- |
| is in the last | That long before Apply was pressed | When Apply was pressed |
| is equal to | The start of the day | The last second of the day |
| is between | The start of the first day | The last second of the last day |
| is after | The start of the day | `null` |
| is before | `null` | The last second of the day |

Days are the viewer's own, in their time zone. A month is a calendar month: one
month before March 31 is February 28. A number of minutes, hours, days, or weeks
is that many seconds.

The value says when, not how it was chosen, so the panel works the condition out
from it: only `gte` is "is after", only `lte` is "is before", one whole day is
"is equal to", and anything else, a number of days back included, is "is
between". The chip shows a range of days, or the times where it's part of one.

The playground's example script, `examples/html/src/scripts/date-filter.js`,
does all of this.

## React

`<DateFilter>` renders the chip and the panel, and does what the script above
does. Other props go to the chip.

| Prop | Effect |
| --- | --- |
| `label` | The chip's name, and the panel's |
| `locale` | The language and order of its dates |
| `labels` | Every word it shows or announces, below |
| `value`, `defaultValue` | `{ gte, lte }`, in Unix seconds. What can't be a date, as a URL may hold, counts as `null` |
| `onValueChange` | Called with the new `{ gte, lte }` on Apply and on Clear |
| `weekStartsOn`, `today` | As on a [Calendar](calendar.md) |

| `labels` | What it names |
| --- | --- |
| `conditions` | The five conditions: `last`, `equal`, `between`, `after`, `before`. `after` and `before` also go in front of the date in the chip |
| `units` | `minutes`, `hours`, `days`, `weeks`, `months` |
| `condition`, `amount`, `unit` | The fields' names |
| `date`, `startDate`, `endDate` | The date field's name, and the two dates' under "is between" |
| `and` | The word between two dates |
| `datePlaceholder` | Optional: what an empty date field shows, such as "mm/dd/yyyy" |
| `calendar`, `previousMonth`, `nextMonth` | A Date Picker's button, and its Calendar's |
| `apply`, `clear` | The buttons |

Rendered on a server, the chip shows no dates until the page is ready in the
browser, since the day a timestamp falls on is the viewer's.

To keep a filter in the URL so that a link restores it, read the value from the
URL and write it back on a change. With the Next.js App Router, in a component
inside `<Suspense>`, given `labels` from your app's translations:

```tsx
"use client";

import { DateFilter, type DateFilterLabels, type DateFilterValue } from "@harmo-ui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const secondsIn = (params: URLSearchParams, key: string) => {
  const found = params.get(key);
  return found === null ? null : Number(found);
};

export function DueDateFilter({ labels }: { labels: DateFilterLabels }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const write = ({ gte, lte }: DateFilterValue) => {
    const next = new URLSearchParams(params);
    for (const [key, seconds] of [["due[gte]", gte], ["due[lte]", lte]] as const) {
      if (seconds === null) next.delete(key);
      else next.set(key, String(seconds));
    }
    router.replace(next.size ? `?${next}` : pathname, { scroll: false });
  };

  return (
    <DateFilter
      label="Due date"
      locale="en-US"
      labels={labels}
      value={{ gte: secondsIn(params, "due[gte]"), lte: secondsIn(params, "due[lte]") }}
      onValueChange={write}
    />
  );
}
```

With another router, the same: the value from its URL, and a replace on a change.

## Tokens

`--harmo-font-size-sm`, `--harmo-color-text-secondary`, and those of its parts.
