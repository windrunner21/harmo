# Password Input

A password field with a show/hide toggle and, for new passwords, a strength
word, [Meter](meter.md), and hint. For other text, use an [Input](input.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `password.css`, `input.css`, `field.css`, `tooltip.css`; `meter.css` for the strength |
| Element | `<div class="hpassword">` holding an `<input class="hinput" type="password">` and the toggle |
| Parts | `.hpassword-toggle` with `.hpassword-icon-show` and `.hpassword-icon-hide`; for a new password, `.hpassword-strength`, `.hpassword-details`, and `.hpassword-hint` |
| Required | On the toggle: `type="button"`, an `aria-label` in the page's language, such as "Show password", `aria-pressed`, and `aria-controls` (the input's id), and `disabled` whenever the input is disabled; `aria-live="polite"` on the strength word |
| Unique | Every id |
| Script | Required: the toggle, hiding the password again as its form is sent or reset, revealing and resetting the details, and the strength; see [What a script does](#what-a-script-does) |

## Markup

A current password needs only the box and toggle (the eye icons are any SVGs
drawn in `currentColor`):

```html
<div class="hfield">
  <label class="hlabel" for="password">Password</label>
  <div class="hpassword">
    <input class="hinput" id="password" type="password" autocomplete="current-password" />
    <span class="htooltip-trigger">
      <button class="hpassword-toggle" type="button" aria-label="Show password"
        aria-pressed="false" aria-controls="password" hidden>
        <svg class="hpassword-icon-show" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
        <svg class="hpassword-icon-hide" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
      </button>
      <span class="htooltip" role="tooltip" aria-hidden="true" data-side="inline-end">Show password</span>
    </span>
  </div>
</div>
```

A new password adds the strength word, meter, and hint. Render them empty,
as here; a script fills them in as the user types:

```html
<div class="hfield">
  <div class="hfield-label-row">
    <label class="hlabel" for="new-password">New password</label>
    <span class="hpassword-strength" id="new-password-strength" aria-live="polite"></span>
  </div>
  <div class="hpassword">
    <input class="hinput" id="new-password" type="password" autocomplete="new-password"
      aria-describedby="new-password-strength new-password-hint" />
    <span class="htooltip-trigger">
      <button class="hpassword-toggle" type="button" aria-label="Show password"
        aria-pressed="false" aria-controls="new-password" hidden>
        <svg class="hpassword-icon-show" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
        <svg class="hpassword-icon-hide" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
      </button>
      <span class="htooltip" role="tooltip" aria-hidden="true" data-side="inline-end">Show password</span>
    </span>
  </div>
  <div class="hpassword-details" hidden>
    <div>
      <div class="hmeter" role="meter" aria-label="Password strength"
        aria-valuemin="0" aria-valuemax="3" aria-valuenow="0">
        <span class="hmeter-segment"></span>
        <span class="hmeter-segment"></span>
        <span class="hmeter-segment"></span>
      </div>
      <p class="hpassword-hint" id="new-password-hint"></p>
    </div>
  </div>
</div>
```

`.hpassword-details` needs the inner `<div>`: the collapse animates its single
row.

A link beside the label, such as "Forgot your password?" on a sign-in form, goes
in the label row as `.hfield-label-end`, which puts it at the row's end at the
label's size:

```html
<div class="hfield">
  <div class="hfield-label-row">
    <label class="hlabel" for="password">Password</label>
    <a class="hlink hfield-label-end" href="/reset-password">Forgot your password?</a>
  </div>
  <div class="hpassword">…</div>
</div>
```

With a strength word, the link goes after it: the word keeps to the row's end
and the link follows it, the row's 6px gap away. While the word is empty, the
link is at the row's end itself.

## Options

| Hook | Effect |
| --- | --- |
| `aria-pressed="true"` on the toggle | The crossed eye shows (the password is visible) |
| `hidden` on `.hpassword-toggle` | Hides the toggle |
| `hidden` on `.hpassword-details` | Collapses the meter and hint |
| `disabled` on the input and the toggle | Disabled, as for [Input](input.md); the toggle is a separate button, so disable both together |
| (no `data-status`) on the word and hint | `--harmo-color-text-tertiary` |
| `data-status="success"` on the word and hint | `--harmo-color-success` |
| `data-status="warning"` on the word and hint | `--harmo-color-warning` |
| `data-status="error"` on the word and hint | `--harmo-color-danger` |

## Appearance and states

- The input is a regular [Input](input.md) with room at its end for the
  toggle, so focus, invalid, and disabled states are the same.
- The toggle's [Tooltip](tooltip.md) opens at the field's end,
  `data-side="inline-end"`, so it doesn't cover what's under the field, such
  as a form's next field or its button: to the toggle's right in
  left-to-right text, and to its left in right-to-left text. It sits
  Tooltip's 8px past the field's border, rather than past the toggle inside
  it.
- The toggle: a bare 20px eye in `--harmo-icon-color` (3.42:1 on white),
  `--harmo-icon-hover-color` on hover, and `--harmo-color-text-tertiary` when
  disabled. Its edge is 10px from the border, like the text's start. The eye
  shows while the password is hidden, the crossed eye while it shows. Its focus
  ring has no offset, since it sits inside the input. The eye, its button, and
  the room kept for it grow with the browser's font size.
- Its [Tooltip](tooltip.md) names the click it will perform, "Show password" or
  "Hide password", on hover and keyboard focus; see
  [Accessibility](#accessibility) for the toggle's own name.
- The strength word sits at the end of the label row, before a
  `.hfield-label-end` if there is one, 12px, colored by `data-status` in the text colors above. The meter's bars use the brighter
  status colors.
- The hint: 10px (`--harmo-space-xs`) below the bars, colored like the word.
  The focus ring of a link in it shows whole, as in a Field's error.
- The details open 10px below the input, growing and fading in over 200ms
  (`--harmo-ease-out-cubic`) and closing in 150ms. Reduced motion: they appear
  in place and fade in; closing, they fade out in place, then their space
  closes.
- While its Field shows an error, such as a form's "This password has
  appeared in a data breach", the strength word and the details step aside,
  with `hidden`, so a green "Strong" never sits beside a red error; the input
  is described by the error alone. They come back as the error goes.
- Edge's built-in reveal button is hidden, so there is only one toggle.

## Accessibility

- The toggle's name stays "Show password" and `aria-pressed` reports whether
  the password shows, so its name doesn't change under the user. The tooltip
  is only the visual label: it carries `aria-hidden="true"` and no `id`, an
  exception to Tooltip's usual contract, so screen readers don't hear the
  name twice.
- The input's `aria-describedby` points at the word and hint, read on focus;
  while the Field shows an error, at the error alone, so a screen reader
  doesn't read "Strong" after "This password has appeared in a data breach".
- The word is a polite live region, so "Too weak", "Medium", and "Strong" are
  announced as they change, once per level rather than per keystroke.

## What a script does

| Change | When |
| --- | --- |
| Remove `hidden` from `.hpassword-toggle`, and add it back | When the input gets a value, and when it's emptied |
| Toggle `aria-pressed` and switch the input's `type` between `password` and `text` | On toggle click |
| Set the tooltip text to "Hide password" or "Show password" for the next click | On toggle click |
| Remove `hidden` from `.hpassword-details`, and add it back, leaving the meter and hint as they were, so that they close without changing, and clearing only the strength word | When the input gets a value, and when it's emptied |
| Set the word, hint text, and meter values, with the same `data-status` on all three; clear them | When the strength level changes; when the input is emptied |
| Set `aria-invalid="true"` on the input, and remove it | While the password is too weak; otherwise, unless the Field's `.herror` has text |
| Set `hidden` on `.hpassword-strength` and `.hpassword-details`, and take the word's and hint's ids out of the input's `aria-describedby`; put them back | While the Field's `.herror` has text; once it's empty |
| Set `disabled` on the toggle, and remove it | When the input is disabled or enabled |
| Hide the password again (`aria-pressed="false"`, `type="password"`, and the tooltip's "Show password"), then all of the above for the value the form puts back | When its form resets, unless a listener cancels the reset |
| Hide the password again, as above, before the browser reads the form, so the browser never keeps it as a text field's entry, to suggest later, and it isn't showing to whoever comes back to the page | When its form is sent, in a `submit` listener in the capture phase, whether or not another listener cancels the send |
| Hide the password again, as above | When the page comes back from the browser's back-forward cache, on `pageshow` with `persisted` |

The strength rule and wording belong to the app. For example: under 10
characters is "Too weak" (`error`); upper case, lower case, digits, and
symbols together are "Strong" (`success`); anything between is "Medium" (no
status). `examples/html/src/scripts/password.js` is an example script.

## React

`<PasswordInput>` renders the whole field: the Field, the input, the toggle
with its tooltip, and, with `strength`, the meter, word, and hint. Other
props are the `<input>`'s attributes, such as `autoComplete`.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react). While `error` shows, the strength steps aside |
| `showPasswordLabel`, `hidePasswordLabel` | Required: the toggle's name, such as "Show password", and its tooltip while the password shows, such as "Hide password" |
| `strength` | Rates the password as it's typed: a function from the password to `{ level, word, hint, status }`. `level` fills 1 to 3 segments, `word` shows next to the label, and `hint` and `status` are optional; an `error` status also marks the input invalid |
| `strengthLabel` | Required with `strength`: the meter's name, such as "Password strength" |
| `labelAccessory` | Placed in the label row, after the strength word, such as a "Forgot your password?" `<Link className="hfield-label-end">`, which puts it at the row's end at the label's size |

```tsx
<PasswordInput
  label="New password"
  showPasswordLabel="Show password"
  hidePasswordLabel="Hide password"
  autoComplete="new-password"
  strength={(password) =>
    password.length < 8
      ? { level: 1, word: "Too weak", status: "error" }
      : { level: 3, word: "Strong", status: "success" }
  }
  strengthLabel="Password strength"
/>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-danger`, `--harmo-color-success`,
`--harmo-color-text-tertiary`, `--harmo-color-warning`,
`--harmo-duration-fast`, `--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-focus-outline`, `--harmo-focus-outline-offset`, `--harmo-font-family`,
`--harmo-font-size-2xs`, `--harmo-font-weight-normal`, `--harmo-icon-color`,
`--harmo-icon-hover-color`, `--harmo-space-xs`, plus [Input](input.md)'s and
[Meter](meter.md)'s.
