# OTP Input

A one-time code, such as a sign-in's second step or a code that confirms an
email: one field holds the code, with a slot drawn over it for each character.
Without a script, it's a plain [Input](input.md) that a form still sends. For a
password, use [Password Input](password.md). For the whole step, with where the
code went and a new code after a wait, copy the
[Verify Code](../patterns/verify-code.md) pattern.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `otp-input.css`, `input.css`; `field.css` for a label |
| Element | `<div class="hotp-input" dir="ltr">` |
| Parts | `<input class="hinput" type="text">`, then `.hotp-input-slots`, `aria-hidden="true"`, holding a `.hotp-input-slot` for each character, with a `.hotp-input-separator` between groups |
| Required | On the input: a name, a `<label for>` matching its `id` or `aria-label`; `maxlength`, the code's length, as many as there are slots; a `pattern` to match, such as `[0-9]{6}`; `autocomplete="one-time-code"`; `inputmode`; `spellcheck="false"` and `autocorrect="off"`. `dir="ltr"` on `.hotp-input` |
| Unique | The input's `id` |
| Script | To show the slots and keep the field to what a code holds; without one, it's a plain Input. See [What a script does](#what-a-script-does) |

## Markup

Six digits, rendered as they are before a script runs:

```html
<div class="hfield">
  <label class="hlabel" for="code">Verification code</label>
  <div class="hotp-input" dir="ltr">
    <input class="hinput" id="code" name="code" type="text" inputmode="numeric"
      autocomplete="one-time-code" autocorrect="off" spellcheck="false"
      maxlength="6" pattern="[0-9]{6}" />
    <div class="hotp-input-slots" aria-hidden="true">
      <span class="hotp-input-slot"></span>
      <span class="hotp-input-slot"></span>
      <span class="hotp-input-slot"></span>
      <span class="hotp-input-slot"></span>
      <span class="hotp-input-slot"></span>
      <span class="hotp-input-slot"></span>
    </div>
  </div>
</div>
```

In groups, such as 4 and 4, with letters too:

```html
<div class="hotp-input" dir="ltr" data-characters="alphanumeric">
  <input class="hinput" id="recovery-code" name="recovery-code" type="text" inputmode="text"
    autocapitalize="characters" autocomplete="one-time-code" autocorrect="off" spellcheck="false"
    maxlength="8" pattern="[A-Za-z0-9]{8}" />
  <div class="hotp-input-slots" aria-hidden="true">
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-separator"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
    <span class="hotp-input-slot"></span>
  </div>
</div>
```

A field with a value has it in each slot too, with `data-filled`:
`<span class="hotp-input-slot" data-filled>4</span>`.

## Options

| Hook | Effect |
| --- | --- |
| `maxlength` and `pattern` on the input, and as many `.hotp-input-slot`s | The code's length, from 4 to 12, such as `maxlength="4"` with `pattern="[0-9]{4}"` and four slots |
| `data-characters="alphanumeric"` on `.hotp-input` | Letters and digits, in capitals, in `--harmo-font-family-mono`, with `inputmode="text"`, `autocapitalize="characters"`, and `pattern="[A-Za-z0-9]{8}"` on the input. Without it, digits only, with `inputmode="numeric"` |
| `.hotp-input-separator` between two slots | A dash between groups, such as 123–456 |
| `data-ready` on `.hotp-input` (script) | The slots show, and the field turns see-through over them |
| `data-filled` on a slot (script) | It holds a character |
| `data-active` on a slot (script) | Typing goes there: the caret's slot, or each slot of a selection |
| `aria-invalid="true"` on the input | Every slot's border turns `--harmo-color-danger`, and the focused slot's ring red |
| `readonly` on the input | The slots' background turns `--harmo-color-background-secondary`; the code can be focused, selected, and copied, but not changed |
| `disabled` on the input | The slots take a disabled Input's look: secondary background, no shadow, and `--harmo-color-text-tertiary` characters |

## Appearance and states

- A slot is 40px wide and 44px tall (`--harmo-control-height` plus
  `--harmo-space-2xs`, and plus `--harmo-space-xs`), with an Input's border,
  8px radius, background, and shadow. Its character is 20px
  (`--harmo-font-size-lg`), medium, with tabular digits. Slots sit 6px apart
  (`--harmo-space-2xs`). Where the row doesn't fit, as on a narrow phone, the
  slots get narrower.
- The dash between groups: 10px (`--harmo-space-xs`) by 2px, in
  `--harmo-color-text-tertiary`, with the slots' 6px on each side.
- Letters and digits use the monospaced font, whose 0 and O, and 1 and I,
  differ.
- Focused, the slot where typing goes has Input's focus look: a
  `--harmo-color-focus` border, and a 3px ring of it at 20%. An empty one shows
  a 2px caret in `--harmo-color-text`, which blinks once a second, and under
  reduced motion holds still. A selection marks each of its slots, such as all
  of them after select-all.
- While the field is focused, the slots change at once as the caret moves,
  since it moves with every key.
- Hover (hover devices): every slot's border turns `--harmo-color-focus` over
  150ms (`--harmo-duration-fast`), as an Input's does, except while the field
  is focused, read-only, disabled, or invalid, and not while only its Field's
  label is under the pointer.
- Without `data-ready`, before a script runs or if none does, the field is a
  plain Input, the size the slots will take, so nothing moves when they show;
  the slots wait unseen (`visibility: hidden`). With
  `data-characters="alphanumeric"`, its text shows in capitals, in the
  monospaced font.
- With `data-ready`, the field's text, caret, selection, border, and ring are
  see-through, and stay so in forced-colors mode, where the slots are drawn in
  the system's colors. The field stays over the slots, so a press reaches it.
- The field's text is 16px, or the browser's base size if that's larger, so
  iOS Safari doesn't zoom in when it's focused.
- A code reads left to right in every language: `dir="ltr"` keeps the slots in
  order in a right-to-left page, where the code sits at the field's start, on
  the right.

## Accessibility

- It's one text field: a screen reader meets one field, named once by its
  Field's label, with the whole code as its value, read and edited as any
  field is. The slots are `aria-hidden`. The arrow keys, select-all, copying,
  pasting, undo, and input methods are the field's own.
- `autocomplete="one-time-code"` lets a phone offer the code from a message
  as you focus the field, and fill it in with one tap. It's a convenience,
  not a defense against a look-alike site, which can ask for the code too;
  [Verify Code's Security](../patterns/verify-code.md#security) says what
  helps. `inputmode="numeric"`
  brings up a keypad of digits; with letters, `inputmode="text"` and
  `autocapitalize="characters"` a keyboard in capitals.
- Say how many characters in the Field's description, such as "Enter the
  6-digit code we sent to your phone.": only the slots show it otherwise.
- The code isn't masked, and needs no `type="password"`: it's short-lived and
  works once, and seeing it helps type it in from another device, such as
  reading it off a phone. For a secret that's kept, such as a PIN, use a
  [Password Input](password.md).
- Harmo keeps no copy of the code and logs nothing: it's the field's value,
  sent with its form like any other.
- `spellcheck="false"` and `autocorrect="off"`: a code isn't a word, so no
  red underline, and no keyboard changing it.
- Without a script, before it loads or if it never does, the field is a plain
  Input: its text and caret show, the slots don't, and a form posts it with
  its `name`. `maxlength` keeps it to the code's length, and `pattern` stops
  the form with the browser's own message while the code is short or holds
  what it can't; a `title` on the input adds to that message. Letters keep the
  case they're typed in, and a paste with spaces or dashes is cut short by
  `maxlength`, so read the code on the server in capitals, without spaces and
  dashes.
- Set `aria-invalid="true"` only after checking the code, as for any field.

## What a script does

| Change | When |
| --- | --- |
| Set `data-ready` on `.hotp-input` | As the script starts: the slots show |
| Each slot's character, and `data-filled` on those that have one | As the value changes; after a form reset, once the browser has put the first value back; after your own script sets the value |
| `data-active` on the slot the caret is in, or on each slot of a selection; then on none | While the field is focused, as the caret moves; when it loses focus |
| Leave out what the code can't hold, and type letters in capitals; fullwidth and Arabic digits become ASCII ones | As it's typed or pasted, and when an input method finishes a word |
| Type over the characters after the caret, rather than pushing them along; at the end of a whole code, typing does nothing | As it's typed (`beforeinput`) |
| Paste without spaces, dashes, and what the code can't hold, at the caret; a whole code, or more, replaces the one there | On paste |
| Select a slot's character, so the next key replaces it, or, past what's typed, put the caret at the end | On a mouse press on a slot; on a touch, once it's let go, so the keyboard opens |

A script that keeps `maxlength` and `pattern` leaves a form's checks as they
were. Typing and pasting go through `document.execCommand("insertText")`,
which types as the browser does, so undo still works. Characters that only
the `input` event sees, such as from an input method, are cleaned up there.
`examples/html/src/scripts/otp-input.js` is an example script, which also sends
an example's form once the code is complete.

## React

`<OtpInput>` renders all of this and does the above. With `label`, it renders
the [Field](field.md#react) too; in a Field of your own, the field takes its
label and descriptions just the same. `className` goes on `.hotp-input`, and
`hidden` on its Field, or on `.hotp-input` without a `label`; other props, such
as `name`, `required`, `autoFocus`, or `aria-invalid`, go on the input, and
`ref` is the input.

| Prop | Effect |
| --- | --- |
| `label`, `optional`, `description`, `error` | As for a [Field](field.md#react); the last three need a `label` |
| `length` | How many characters, 6 by default. Kept from 4 to 12: less is 4, more is 12. It sets `maxlength` and `pattern` |
| `characters` | `numeric`, the default: digits only. `alphanumeric`: letters and digits, in capitals |
| `groups` | The groups' sizes, from the start, such as `[3, 3]`: a dash after each group that ends inside the code. None by default, as where a dash goes follows how the app's message writes the code, and a length such as 5 or 7 has no one way to split |
| `value`, `defaultValue`, `onChange` | As for any input. What's typed or pasted is cleaned up first, so `event.target.value` is the code, in capitals, without spaces or dashes. A form reset puts `defaultValue` back |
| `onComplete` | Called with the code when its last character arrives, typed, pasted, or filled in from a message, and again if it's changed while whole. A form can send itself then, with `requestSubmit()` |

On the server, it renders the plain field, with `maxlength`, `pattern`, and
`name`, so a form posts the code before the page's JavaScript has loaded, or
without it, as a React form action does; once the component has mounted, it
sets `data-ready` and the slots show.

```tsx
"use client";

import { useRef } from "react";
import { Button, OtpInput } from "@harmo-ui/react";

function VerifyCode({ verify, error }: { verify: (data: FormData) => Promise<void>; error?: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={verify}>
      <OtpInput
        label="Verification code"
        description="Enter the 6-digit code we sent to your phone."
        error={error}
        name="code"
        groups={[3, 3]}
        onComplete={() => form.current?.requestSubmit()}
      />
      <Button type="submit">Verify</Button>
    </form>
  );
}
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background-secondary`,
`--harmo-color-danger`, `--harmo-color-focus`, `--harmo-color-text`,
`--harmo-color-text-tertiary`, `--harmo-control-height`,
`--harmo-duration-fast`, `--harmo-font-family`, `--harmo-font-family-mono`,
`--harmo-font-size-base`, `--harmo-font-size-lg`,
`--harmo-font-weight-medium`, `--harmo-input-box-shadow`,
`--harmo-input-color-background`, `--harmo-input-color-border`,
`--harmo-space-2xs`, `--harmo-space-xs`, plus [Input](input.md)'s.
