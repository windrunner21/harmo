# Language Picker

Switches the language a site or app is in: a tertiary [Button](button.md) with a
globe, the language in use, and a chevron, which opens a [Popup](popup.md) with a
[Listbox](listbox.md) of languages, each named in its own. Choosing one hands its
value to your app, which saves it or goes to that language's address. For a form
field that picks from a list, use a [Select](select.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `language-picker.css`, `button.css`, `popup.css`, `listbox.css`, `expand-chevron.css` |
| Element | `<button class="hbutton hlanguage-picker" data-variant="tertiary" type="button" role="combobox">`, followed by a `.hpopup[popover]` holding a `.hlistbox` |
| Parts | In the button: a globe `.hicon`, a `.hbutton-label` holding the language's name in a `<span lang>`, and `.hexpand-chevron`. In the list: `.hoption`, a `.hoption-label` holding the same `<span lang>`, and `.hoption-check` |
| Required | On the button: `aria-label`, such as "Language", `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (the list's id), `popovertarget` (the popup's id), and `style="anchor-name: --…"` matching the popup's `position-anchor`. On the list: the same `aria-label`. On each option: `role="option"`, an `id`, `aria-selected`, and `data-value`. On each language's name: `lang`, the language it's written in |
| Unique | Every id, and each anchor name |
| Script | Required: keyboard, selection, the language shown, and telling your app; see [What a script does](#what-a-script-does) |

## Markup

```html
<button class="hbutton hlanguage-picker" data-variant="tertiary" type="button"
  role="combobox" aria-label="Language" aria-haspopup="listbox" aria-expanded="false"
  aria-controls="language-listbox" popovertarget="language-popup" style="anchor-name: --language">
  <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="M8 3H9C7.05 8.84 7.05 15.16 9 21H8" />
    <path d="M15 3C16.95 8.84 16.95 15.16 15 21" />
    <path d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16" />
    <path d="M3 9C8.84 7.05 15.16 7.05 21 9" />
  </svg>
  <span class="hbutton-label"><span lang="en">English</span></span>
  <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
    <g class="hexpand-chevron-head">
      <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
      <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
    </g>
  </svg>
</button>
<div class="hpopup" id="language-popup" popover style="position-anchor: --language">
  <ul class="hlistbox" id="language-listbox" role="listbox" aria-label="Language">
    <li class="hoption" id="language-en" role="option" data-value="en" aria-selected="true">
      <span class="hoption-label"><span lang="en">English</span></span>
      <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
        <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" />
      </svg>
    </li>
    <li class="hoption" id="language-fr" role="option" data-value="fr" aria-selected="false">
      <span class="hoption-label"><span lang="fr">Français</span></span>
    </li>
  </ul>
</div>
```

The `lang` goes on a span inside `.hoption-label`, rather than on the option, so
that a description in the page's language isn't marked as the other one.

## Options

| Hook | Effect |
| --- | --- |
| `.hoption-text` around the label, and a `.hoption-description` | The language's name in the page's language, under its own, as a [Listbox](listbox.md) description |
| `.hoption-group`, with `.hlanguage-picker-regions` on the popup | A region and its languages, in a panel: see [Regions](#regions). The button shows the region before the language, in a `.hlanguage-picker-region`, then a space |
| `--hlanguage-picker-open`, `--hlanguage-picker-close` | The parentheses around the language after a region, `"("` and `")"` by default |
| `<span class="hlanguage-picker-icon" aria-hidden="true">` | A picture, such as a flag, which your app brings: before a region's name, in its `.hoption-group-label`, or before a language's, in its `.hoption-label` |
| `.hlistbox-search` | A search row, for a long list, as Listbox has; it finds a language by its name or its description, and by its region's name with `data-example-keywords` in the HTML examples |
| `data-size="small"` | The small [Button](button.md) size |
| `aria-expanded="true"` | Open: the hover background, and the chevron folds up |
| `disabled` | Disabled, as a Button is |

## Appearance and states

- A tertiary Button: secondary text, no border, and the hover background on
  hover and while it's open.
- The globe is 20px, as every icon in a Button is. The label stays on one line,
  and ends with an ellipsis when the button has no room for it.
- With regions, the region, then the language in parentheses, such as "United
  States (English)". The markup has a space between them; CSS draws the
  parentheses, as `--hlanguage-picker-open` and `--hlanguage-picker-close`, which
  you can set to others, such as "（" and "）" in Chinese or Japanese.
- The list is a Listbox, with a check on the language in use. The popup opens
  below the button, or above it when there's more room there, as in a footer.
- In a right-to-left page, the globe and the chevron swap sides.
- A picture sits in a 24px by 20px box, 10px (`--harmo-space-xs`) before the
  name: a 3:2 flag is 24px by 16px. An image or SVG in it fills the box's width,
  with 3px rounded corners and a faint rim, so that a flag with white at its
  edge keeps its shape on a white panel.

## Regions

With every language in a region, the popup is a panel:

```html
<div class="hpopup hlanguage-picker-regions" id="region-popup" popover style="position-anchor: --region">
  <ul class="hlistbox" id="region-listbox" role="listbox" aria-label="Region and language">
    <li class="hoption-group" role="presentation">
      <span class="hoption-group-label" id="region-france"><span class="hlanguage-picker-icon" aria-hidden="true"><img src="/flags/fr.svg" alt="" /></span>France</span>
      <ul role="group" aria-labelledby="region-france">
        <li class="hoption" id="region-fr-fr" role="option" data-value="fr-FR" aria-selected="false">
          <span class="hoption-label"><span lang="fr-FR">Français</span></span>
        </li>
        <li class="hoption" id="region-en-fr" role="option" data-value="en-FR" aria-selected="false">
          <span class="hoption-label"><span lang="en-FR">English</span></span>
        </li>
      </ul>
    </li>
  </ul>
</div>
```

- The regions are in columns: two from two regions, three from three, and four
  from seven, each as wide as its longest region. Under 48rem of window there
  are at most two, and under 30rem one. The panel keeps that width. It opens
  below the button, or above it when there's more room there, lined up with
  either end of the button where it fits, or else in the middle of the window, so
  a region's languages stay on one line. Only a window too narrow for the panel
  makes them wrap.
- Each region has its picture and its name, in the text color, and under the
  name its languages, beside one another, in the secondary color.
- The region in use has the check, white in a 20px circle of
  `--harmo-color-primary-fill`, in its picture's place (the check is the chosen
  option's `.hoption-check`, placed there, so when a search hides that option, the
  picture is back), and the language in use is in the text color and medium
  weight. In forced colors, the circle is `Highlight`.
- Flags belong here, beside a country, where a flag is accurate. Before a
  language, a flag is a guess: English could be the United States or the United
  Kingdom. Emoji flags show as two letters on Windows, so use images where that
  matters.

## Accessibility

- `<button role="combobox">` with `aria-label`: a screen reader says
  "Language, Français". The label, in the page's language, is how someone who
  can't read the language in use finds the picker.
- Each language is named in its own, with `lang` on its name, so a screen reader
  says "Deutsch" in German (WCAG 3.1.2, Language of Parts). A description is in
  the page's language, so it has no `lang` of its own.
- A picture is `aria-hidden`, as the name beside it says what it shows. Typing
  to jump leaves it out, so "F" still finds "Français" after a flag.
- Focus stays on the button while the list is open, as for a
  [Select](select.md#accessibility), with the same keys: Down and Up, Home and
  End, typing to jump, Enter or Space to choose, and Escape to close. In a panel
  of regions, Left and Right move between languages too, the other way round
  right to left. With a search row, focus moves to the search field.
- Search engines find a page in other languages through
  `<link rel="alternate" hreflang="…">` in its head, not through this picker, so
  add those too.

## What a script does

| Change | When |
| --- | --- |
| `aria-expanded` on the button | On every open and close (see [Popup](popup.md)) |
| The [Listbox](listbox.md) behavior: highlight, `aria-activedescendant`, selection, and closing after a choice | While open |
| The highlight moved by Left and Right, as by Up and Down, the other way round right to left | In a panel of regions, while open |
| The button's label: a copy of the chosen option's `<span lang>`, after a `.hlanguage-picker-region` with its region's name and a space when it's in one | When a language is chosen |
| Telling your app, which saves the language, such as in a cookie, or goes to that language's address | When a language other than the one in use is chosen |

`examples/html/src/scripts/popup.js`, `listbox.js`, and `language-picker.js` are
example scripts that do the first three.

## React

`<LanguagePicker>` renders this markup and does all of the above. One that's
`disabled`, `aria-disabled`, or `hidden` has no popup, so that no key can open it
and an open one closes. Other props are the `<button>`'s attributes.

| Prop | Effect |
| --- | --- |
| `aria-label` | Required: its name, such as "Language", in the page's language |
| `languages` | The languages, in order; or regions, `{ label, icon, languages }`, each holding its languages, for a [panel](#regions). A region's `label` is its name, as text, in the page's language, and a search finds its languages by it; `icon` is its picture |
| `value` or `defaultValue` | The `value` of the language in use |
| `onValueChange` | Called with a language's `value` when one other than the language in use is chosen |
| `searchLabel` | Adds a search row, with this as its placeholder and name |
| `emptyMessage` | Required with `searchLabel`: shown when the search matches nothing, such as "No languages found" |
| `size` | `"small"`, as for a [Button](button.md#react) |

Each language is `{ value, label, lang, description, keywords, icon, disabled }`:

| Field | Meaning |
| --- | --- |
| `value` | What `onValueChange` is called with, such as a locale |
| `label` | Its name in its own language, such as "Français" |
| `lang` | The language `label` is written in, as a tag such as `fr`; `value` when left out, so give it when `value` isn't a tag |
| `description` | Its name in the page's language, such as "French" |
| `keywords` | Other words a search finds it by |
| `icon` | A picture before its name, such as an image |
| `disabled` | Shown, but can't be chosen |

```tsx
<LanguagePicker
  aria-label="Language"
  value={locale}
  onValueChange={setLocale}
  languages={[
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch", description: "German" },
    { value: "fr", label: "Français", description: "French" },
  ]}
/>
```

## Tokens

`--harmo-color-background-hover`, `--harmo-color-border`, `--harmo-space-2xs`,
and those of [Button](button.md#tokens), [Popup](popup.md#tokens), and
[Listbox](listbox.md#tokens).
