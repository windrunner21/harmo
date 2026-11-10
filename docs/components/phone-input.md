# Phone Input

A phone number: a searchable list of country codes, then a field that formats the
number as it's typed. Your app brings the parser, such as
[libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js), so Harmo
gains no dependency. It gives your app the number in E.164, such as `+14155552671`,
and whether it's valid.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `phone-input.css`, `select.css`, `input.css`, `popup.css`, `listbox.css`, `expand-chevron.css`; `field.css` for a label |
| Element | `<div class="hphone-input">` |
| Parts | A [Select](select.md) with `.hphone-input-country`, whose value holds `.hphone-input-flag`, the code, and `.hphone-input-name` with the country's name for screen readers; `<input class="hinput" type="tel" dir="ltr">`; a hidden input for a form |
| Required | A name for the Select and for the field; the search's placeholder and "nothing found" text |
| Unique | The field's `id`, and the Select's and its list's |
| Script | To format the number and follow the country. See [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="phone">Phone</label>
  <div class="hphone-input">
    <button class="hselect hphone-input-country" type="button" role="combobox" aria-label="Country code"
      aria-haspopup="listbox" aria-expanded="false" aria-controls="phone-countries"
      popovertarget="phone-popup" style="anchor-name: --phone-popup">
      <span class="hselect-value">
        <span class="hphone-input-flag" aria-hidden="true">🇺🇸</span>
        <span dir="ltr">+1</span>
        <span class="hphone-input-name">United States</span>
      </span>
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6"></line><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6"></line></g></svg>
    </button>
    <div class="hpopup" id="phone-popup" popover style="position-anchor: --phone-popup">
      <div class="hlistbox-search">
        <input class="hlistbox-search-input" type="text" role="combobox" placeholder="Search countries"
          aria-label="Search countries" aria-expanded="true" aria-controls="phone-countries" aria-autocomplete="list" />
      </div>
      <ul class="hlistbox" id="phone-countries" role="listbox" aria-label="Country code">
        <li class="hoption" id="phone-az" role="option" aria-selected="false">
          <span class="hoption-label"><span class="hphone-input-flag" aria-hidden="true">🇦🇿</span>Azerbaijan</span>
          <span class="hoption-badge"><span dir="ltr">+994</span></span>
        </li>
        <li class="hoption" id="phone-us" role="option" aria-selected="true">
          <span class="hoption-label"><span class="hphone-input-flag" aria-hidden="true">🇺🇸</span>United States</span>
          <span class="hoption-badge"><span dir="ltr">+1</span></span>
        </li>
      </ul>
      <p class="hlistbox-empty" role="status"></p>
    </div>
    <input class="hinput" id="phone" type="tel" dir="ltr" inputmode="tel" autocomplete="tel-national" />
    <input type="hidden" name="phone" value="" />
  </div>
</div>
```

## Options

| Attribute | On | Effect |
| --- | --- | --- |
| `name` | The hidden input | Sends the number in E.164 with a form. It's empty until the number is valid |
| `disabled` | The Select's button, the field, and the hidden input | Nothing can be chosen or typed |

## Appearance and states

- The Select is as wide as its flag and code, and the field takes the rest, 6px
  away. Both are `--harmo-control-height` tall.
- Choosing a country empties the field, as the digits were for the old one, and
  moves focus to it.
- The list is all the countries the parser knows, by name in `locale`, unless
  `countries` narrows it. Search matches a name, a code such as `+994`, or `AZ`.
- A phone number reads left to right in every language: in a right-to-left form the
  field stays left to right, with its text at the end.
- Flags are emoji, which Windows shows as two letters. `renderFlag` replaces them.

## Accessibility

- Name the field with a `<label for>` in a [Field](field.md), and the Select with
  `aria-label`, such as "Country code". Flags are hidden from screen readers, which
  read the country's name instead, as several countries share a calling code.
- Set `aria-invalid="true"` only after the application has validated the number,
  such as when the field is left.
- `autocomplete="tel-national"` lets a browser fill in the number without its
  country code, which the Select holds.
- Deleting a space or bracket deletes the digit beside it too, or the formatting
  would put it straight back and the key would seem to do nothing. The caret stays
  where it was among the digits as the number is formatted again, and nothing is
  formatted until an input method has finished composing.

## What a script does

| Change | When |
| --- | --- |
| The field's text, formatted, with the caret kept among the digits | As it's typed |
| The Select's value and the field's text | A complete international number is typed or pasted, starting with `+`. Until it's complete it stays international |
| Emptying the field, and moving focus to it | A country is chosen |
| The hidden input's value, in E.164, or empty until it's valid | As the number changes |

`examples/html/src/scripts/phone-input.js` is an example script, which stands in for
a parser with six countries.

## React

`<PhoneInput>` renders all of this and does the above. In a [Field](field.md#react),
the field takes the label and descriptions. Other props go on the field.

```bash
npm install libphonenumber-js
```

```tsx
"use client";

import * as libphonenumber from "libphonenumber-js";
import { Field, PhoneInput } from "@harmo-ui/react";

<Field label="Phone">
  <PhoneInput
    phone={libphonenumber}
    locale="en"
    defaultCountry="US"
    countryLabel="Country code"
    searchLabel="Search countries"
    emptyMessage="No countries found"
    onValueChange={(value, { valid, country }) => save(value, valid, country)}
  />
</Field>
```

The parser is a set of functions, so in Next.js this goes in a client component.

| Prop | Effect |
| --- | --- |
| `phone` | Required. The parser: anything with `AsYouType`, `getCountries`, `getCountryCallingCode`, and `parsePhoneNumberFromString`, as `libphonenumber-js` has |
| `locale` | Required. The language of the country names |
| `defaultCountry` | Required. The country to start with |
| `countryLabel` | Required. The Select's name |
| `searchLabel`, `emptyMessage` | Required. The search's placeholder and name, and what shows when it finds nothing |
| `defaultValue` | A number in E.164 to start with. It sets the country too, and comes back when the form is reset |
| `countries` | Only these, in this order. Otherwise all of them, by name. A number from any other country isn't valid, and doesn't change the Select; a `defaultCountry` or `defaultValue` from one is ignored, starting from the first listed |
| `validation` | `valid`, the default, or `possible`, which only checks the length, for numbers a country's rules don't cover |
| `examples` | Number examples, such as `libphonenumber-js/examples.mobile.json`, to show one as the placeholder. The parser needs `getExampleNumber`, or it's ignored |
| `renderFlag` | Replaces the emoji flag, given the country code |
| `onValueChange` | Called with the number in E.164, or `""` until it's valid, and `{ country, valid }` |

`onValueChange` is also called once as it mounts when `defaultValue` is a number the
parser understands, so a form knows from the start whether it's valid.

Anything that isn't a digit, or a `+` at the start, is left out as it's typed or
pasted. Arabic and fullwidth digits become ASCII ones.

## Tokens

`--harmo-space-2xs`, `--harmo-space-xs`, `--harmo-space-sm`, `--harmo-font-size-base`,
and those of [Select](select.md#tokens), [Input](input.md#tokens), and
[Listbox](listbox.md#tokens).
