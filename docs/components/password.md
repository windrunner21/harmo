# Password input

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
| Script | Required: the toggle, revealing and resetting the details, and the strength; see [What a script does](#what-a-script-does) |

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
      <span class="htooltip" role="tooltip" aria-hidden="true">Show password</span>
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
      <span class="htooltip" role="tooltip" aria-hidden="true">Show password</span>
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
- The toggle: a bare 20px eye in `--harmo-icon-color` (3.42:1 on white),
  `--harmo-icon-hover-color` on hover, and `--harmo-color-text-tertiary` when
  disabled. Its edge is 12px from the border, like the text's start. The eye
  shows while the password is hidden, the crossed eye while it shows. Its focus
  ring has no offset, since it sits inside the input.
- Its [Tooltip](tooltip.md) names the click it will perform, "Show password" or
  "Hide password", on hover and keyboard focus; see
  [Accessibility](#accessibility) for the toggle's own name.
- The strength word sits at the end of the label row, 12px, colored by
  `data-status` in the text colors above. The meter's bars use the brighter
  status colors.
- The hint: 12px below the bars, colored like the word.
- The details open 12px below the input, growing and fading in over 200ms
  (`--harmo-ease-out-cubic`) and closing in 150ms. Reduced motion: they appear
  in place and fade.
- Edge's built-in reveal button is hidden, so there is only one toggle.

## Accessibility

- The toggle's name stays "Show password" and `aria-pressed` reports whether
  the password shows, so its name doesn't change under the user. The tooltip
  is only the visual label: it carries `aria-hidden="true"` and no `id`, an
  exception to Tooltip's usual contract, so screen readers don't hear the
  name twice.
- The input's `aria-describedby` points at the word and hint, read on focus.
- The word is a polite live region, so "Too weak", "Medium", and "Strong" are
  announced as they change, once per level rather than per keystroke.

## What a script does

| Change | When |
| --- | --- |
| Remove `hidden` from `.hpassword-toggle`, and add it back | When the input gets a value, and when it's emptied |
| Toggle `aria-pressed` and switch the input's `type` between `password` and `text` | On toggle click |
| Set the tooltip text to "Hide password" or "Show password" for the next click | On toggle click |
| Remove `hidden` from `.hpassword-details`, and add it back | When the input gets a value, and when it's emptied |
| Set the word, hint text, and meter values, with the same `data-status` on all three; clear them | When the strength level changes; when the input is emptied |
| Set `aria-invalid="true"` on the input, and remove it | While the password is too weak; otherwise |
| Set `disabled` on the toggle, and remove it | When the input is disabled or enabled |

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
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react) |
| `showPasswordLabel`, `hidePasswordLabel` | Required: the toggle's name, such as "Show password", and its tooltip while the password shows, such as "Hide password" |
| `strength` | Rates the password as it's typed: a function from the password to `{ level, word, hint, status }`. `level` fills 1 to 3 segments, `word` shows next to the label, and `hint` and `status` are optional; an `error` status also marks the input invalid |
| `strengthLabel` | Required with `strength`: the meter's name, such as "Password strength" |

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
`--harmo-focus-outline`, `--harmo-font-family`, `--harmo-font-size-2xs`,
`--harmo-font-weight-normal`, `--harmo-icon-color`,
`--harmo-icon-hover-color`, plus [Input](input.md)'s and [Meter](meter.md)'s.
