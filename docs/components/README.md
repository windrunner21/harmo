# Components

Markup and styling contracts for `@harmo-ui/css`. Each page lists the markup, the
hooks and attributes that style it, the tokens it reads, and what a script must
handle. Its React section shows the component from `@harmo-ui/react` that renders
the same markup and does what the script would.

| Component | Page |
| --- | --- |
| Accordion | [accordion.md](accordion.md) |
| Avatar | [avatar.md](avatar.md) |
| Banner | [banner.md](banner.md) |
| Breadcrumb | [breadcrumb.md](breadcrumb.md) |
| Button | [button.md](button.md) |
| Card | [card.md](card.md) |
| Checkbox | [checkbox.md](checkbox.md) |
| ChevronToArrow | [chevron-to-arrow.md](chevron-to-arrow.md) |
| Combobox | [combobox.md](combobox.md) |
| Command Menu | [command-menu.md](command-menu.md) |
| Dialog | [dialog.md](dialog.md) |
| Drawer | [drawer.md](drawer.md) |
| Expand Chevron | [expand-chevron.md](expand-chevron.md) |
| Field, Label, Description, Optional, Error | [field.md](field.md) |
| Filter Chip | [filter-chip.md](filter-chip.md) |
| Icons (`.hicon`, `.hchevron`) | [icons.md](icons.md) |
| Input | [input.md](input.md) |
| Kbd | [kbd.md](kbd.md) |
| Link | [link.md](link.md) |
| Listbox | [listbox.md](listbox.md) |
| Meter | [meter.md](meter.md) |
| Password Input | [password.md](password.md) |
| Popup | [popup.md](popup.md) |
| Radio | [radio.md](radio.md) |
| Search | [search.md](search.md) |
| Section | [section.md](section.md) |
| Segmented Control | [segmented.md](segmented.md) |
| Select | [select.md](select.md) |
| Settings List | [settings.md](settings.md) |
| Spinner | [spinner.md](spinner.md) |
| Status | [status.md](status.md) |
| Switch | [switch.md](switch.md) |
| Tabs | [tabs.md](tabs.md) |
| Tag | [tag.md](tag.md) |
| Tag List | [tag-list.md](tag-list.md) |
| TextArea | [textarea.md](textarea.md) |
| Toast | [toast.md](toast.md) |
| Tooltip | [tooltip.md](tooltip.md) |

## Page structure

Every component page has the same sections, in this order; a page leaves out
Options when nothing changes the component.

1. **Purpose**, under the title: what it's for, and what to use instead.
2. **Contract**: a table with the same six rows on every page, so an agent or
   a person can build correct markup at a glance:
   - **CSS**: the files to load besides `tokens.css`;
   - **Element**: the root element and its class;
   - **Parts**: the classes inside it;
   - **Required**: attributes that must be present;
   - **Unique**: what must not repeat on a page, such as ids and anchor names;
   - **Script**: "None", or what a script must do.

   A row with nothing to say reads "None".
3. **Markup**: complete, copyable HTML. Harmo's own drawings, such as the
   chevrons, are written out in full, since the CSS styles their parts; an
   icon the app chooses is shown as `…`.
4. **Options**: a `Hook | Effect` table of the attributes, classes, and
   custom properties that change it.
5. **Appearance and states**: sizes, colors, motion, and every state.
6. **Accessibility**: semantics, naming, keyboard, and screen readers.
7. **What a script does**: a `Change | When` table of what a page must change
   from script, or "None." when CSS covers it; then the example script in
   `examples/html/src/scripts`, if any.
8. **React**: the React component, what it renders, a `Prop | Effect` table
   of its own props, and an example. Other props are the attributes of the
   element named there.
9. **Tokens**: every `--harmo-*` it reads, taken from its stylesheet.

## Loading the CSS

`@harmo-ui/css` (`index.css`) contains the token defaults and every component. For
per-component imports, load `tokens.css` once and then the components you use.
Each component file uses `--harmo-*` properties without defining them.

Token defaults are declared on `:where(:root)`, so an application's own `:root`
overrides win regardless of which stylesheet loads last.

Some components are built from others, so their files need company:

| File | Also load |
| --- | --- |
| `accordion.css` | `expand-chevron.css` |
| `breadcrumb.css` | `link.css`, `chevron.css` |
| `combobox.css` | `input.css`, `popup.css`, `listbox.css`, `expand-chevron.css`; `field.css` for a label; `tag-list.css`, `tag.css`, and `tooltip.css` to choose several |
| `command-menu.css` | `listbox.css`, `kbd.css`; `search.css`, `input.css`, and `popup.css` under a field; `dialog.css` in a dialog |
| `button.css` | `spinner.css` for loading; `chevron-to-arrow.css`, `expand-chevron.css`, or `tooltip.css` when used |
| `banner.css` | `button.css` for its action |
| `filter-chip.css` | `popup.css`; `listbox.css` for a list; `button.css` for a footer or a panel's action; `field.css` and `input.css` for a text panel |
| `link.css` | `chevron.css` or `chevron-to-arrow.css` for an icon |
| `listbox.css` | `popup.css`; `button.css` for a footer |
| `password.css` | `input.css`, `field.css`; `meter.css` for the strength; `tooltip.css` for the toggle's tooltip |
| `search.css` | `input.css`; `field.css` for a label |
| `select.css` | `popup.css`, `listbox.css`, `expand-chevron.css`, `field.css` |
| `settings.css` | The controls it holds, such as `switch.css` |
| `tag-list.css` | `tag.css`, `tooltip.css` |
| `input.css`, `textarea.css`, `checkbox.css`, `radio.css`, `switch.css`, `segmented.css` | `field.css` for labels and messages |

## Shared conventions

- **Class names.** Every component has one class, `.h<name>`, which opts an
  element into its styling and names its React component, if it has one:
  `.hoption` is `<Option>`, `.hsetting` is `<Setting>`. A part that another
  component renders, such as a Field's `.hlabel`, has none. Components used
  inside others keep their own name, so a label is `.hlabel` in a Field and
  in a radio group alike.
- **Parts** that exist only inside one component are `.h<name>-<part>`,
  nesting further for parts of parts: `.hbutton-label`, `.hfield-optional`,
  `.hlistbox-search-input`.
- **Variants and states are attributes, never classes** (`.hchevron`, which
  marks a particular icon, is the one exception).
- **Low specificity.** Most selectors carry their target class plus at most a
  state, about (0,2,0), with any context they depend on in `:where()`, which
  counts as nothing. An app's rule of the same weight, loaded after Harmo,
  wins: `.hoption[aria-selected="true"]` overrides Harmo's selected option
  without `!important`. A few rules that combine states are heavier, such as a
  banner's action button on hover; override those with a matching selector.
- **Token names** are inspired by Stripe's Elements Appearance API: what is colored,
  then the variant, then the state (`--harmo-color-text-secondary`,
  `--harmo-color-primary-hover`); component tokens start with the component
  (`--harmo-input-color-background`). Text runs `color-text`, `-secondary`,
  `-tertiary`, from most to least prominent. The `$shortcuts` in
  `_shortcuts.scss` have the same names.
- **Dark mode** comes from CSS's `color-scheme`. Colors that differ are
  `light-dark()` pairs, light first, and a page stays light until it sets
  `color-scheme: dark`, or `light dark` to follow the system. The primary is
  lighter on a dark page, so text and marks read, so whatever has white text on
  it uses `--harmo-color-primary-fill` instead: Button and Switch.
- **Accents** recolor the primary roles for everything inside an element with
  `data-harmo-accent`: `purple` (the default), `blue`, `teal`, `green`,
  `amber`, `red`, `pink`, or `mono`, which is black, or near-white in dark mode,
  with dark text on its buttons there, and links underlined on hover. They come
  from `accents.css`. Each has the purple's contrast in every role, in both
  modes, and sets every role itself, so an accent inside another inherits
  nothing from it. They're set with `:where()`, so an app's own values on the
  same element still win; an accent on a section is overridden on that section.
- **State comes from native attributes and ARIA** wherever one exists:
  `disabled`, `checked`, `hidden`, `aria-invalid`, `aria-expanded`,
  `aria-selected`, `aria-disabled`, `aria-busy`, `aria-pressed`,
  `aria-current`. The rest are data attributes:

  | Attribute | Meaning | Used by |
  | --- | --- | --- |
  | `data-variant` | Appearance | Button, Tag, Status, Tooltip |
  | `data-status` | `success`, `warning`, `info`, or `error` (Password Input's word and hint: no `info`) | Status, Banner, Meter, Password Input |
  | `data-size` | `small` or `large` | Spinner, Button (`small` only) |
  | `data-orientation` | `horizontal` | Field |
  | `data-direction` | `back` | ChevronToArrow |
  | `data-side` | Preferred or actual side | Tooltip, Popup |
  | `data-position` | Where the region is: `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-end` | Toast |
  | `data-delay` | Wait 300ms before showing | Spinner |
  | `data-placeholder` | No value chosen | Select |
  | `data-filled` | A filled segment | Meter |
  | `data-active` | Highlighted option (script) | Listbox |
| `data-value`, `data-name` | An option's value, and the name a form sends it under | Listbox, Select |
  | `data-ready`, `data-on-current` | Measured, pill over current (script) | Tabs |
  | `data-dismissed` | Hidden by Escape (script) | Tooltip |
  | `data-underlined`, `data-visited` | Opt-in underline / visited color | Link |
- **Text sizes are in rem**, so text follows the browser's default font-size
  setting as well as zoom. The scale runs `--harmo-font-size-base` (16px),
  `-sm` (14px), `-xs` (13px), `-2xs` (12px), and `-3xs` (11px); line heights
  are unitless or rem, never px. Pixel sizes in these docs are at the default
  16px.
- **Control height.** Buttons, inputs, and select triggers share
  `--harmo-control-height` (34px), so they line up in a row. Inputs and select
  triggers also share their box, border, focus ring, and states through the
  `%control` placeholder in `_control.scss`.
- **Icons scale with text.** Inline icons are sized in `em`; ChevronToArrow,
  a fixed 24px, is the exception. The space between text and an icon's box is
  `--harmo-icon-gap` (6px); icons with wide blank margins, such as the static
  chevron, offset them so every visible gap matches.
- **Motion.** Durations come from `--harmo-duration-*` and curves from
  `--harmo-ease-*`. Most entrances take 200ms and exits 150ms; the others,
  such as Tooltip's 150ms in and 100ms out or a Field error's 300ms in, are on
  their pages. Exits are always quicker than entrances. Reduced motion keeps
  the state change and drops the movement.
- **Hiding.** `hidden` hides any component or part of one, at once, since
  `display: none` can't animate. A Field's error and the password details are
  the exceptions: with `hidden` they stay rendered and collapse, which is how
  they animate closed. Popups and tooltips close through their own states
  instead, so don't add `hidden` to one that should fade. Browsers ignore
  `hidden` on SVG, so leave an icon out to hide it.
- **Hover** styles apply only on devices that hover with a fine pointer.
- **Focus rings** are `--harmo-focus-outline` (2px solid `--harmo-color-focus`),
  named after Stripe's `focusOutline`, at `--harmo-focus-outline-offset`
  (2px). Two exceptions keep their own offset: tabs (always 2px, so the ring
  stays above the divider) and the password toggle (0, since it sits inside
  the input). Text
  fields and select triggers instead turn their border the focus color and add
  a 3px tinted ring.

## What scripts handle

CSS covers appearance and everything the platform already does. Scripts, or
the React components, set:

| Attribute | Where | Purpose |
| --- | --- | --- |
| `indeterminate` (property) | Checkbox | Mixed state |
| `aria-busy`, `aria-disabled` | Button | Loading state; scripts also ignore presses while busy |
| `--htabs-*`, `data-ready`, the strip's scroll position | Tabs | Sliding hover pill and underline; the current tab in view |
| `aria-selected`, `tabindex`, panel `hidden` | Tabs in a tablist | Selection, arrow keys, the shown panel |
| `data-dismissed`, `--htooltip-delay` | Tooltip | Escape to hide; neighbors show at once |
| `aria-expanded` | Popup triggers, select triggers | Open ring, chevron direction |
| `.hfilter-chip-value` items | Filter Chip | The chosen values, or a count past two |
| `data-side="top"` | Popup | Slide away from a trigger it opened above |
| `data-active` | Listbox option | Highlight that follows keyboard and pointer |
| `aria-selected` | Listbox option | Selection |
| `aria-activedescendant` | Select trigger, search field, or the list | Announces the highlighted option |
| Hidden inputs | Select in a form | The chosen values, kept in step, restored on reset, disabled with the trigger |
| Error text, `hidden` | Field | Shows a validation error; `hidden` closes it, then the text is cleared |
| Counter text | TextArea | Characters used |
| `aria-pressed`, input `type`, `hidden`, `data-status`, `aria-invalid` | Password Input | Show/hide, reveal the strength, color it |
| `aria-valuenow`, `aria-valuetext`, `data-filled`, `data-status` | Meter | The value |
| `role="status"` or `role="alert"` | Banner | Announce a banner that appears after load |
| `data-closing` | Dialog, Drawer | Hold the close while the exit plays |
| The toasts, the announcers' text, `--htoast-*`, `--htoaster-*`, `data-front`, `data-beyond`, `data-expanded`, `data-removed`, `data-leaving`, `data-moved`, `inert` | Toast | Show, announce, measure, stack, spread out, time, and move them into an open dialog |

Each component page's "What a script does" section has the details.

## Browser features used

The popover attribute; CSS anchor positioning, including `anchor-scope` and
`@position-try` (in all major browsers since January 2026);
`field-sizing: content` (since June 2026); `@starting-style` and
`allow-discrete` transitions, for Popup and Tooltip; `interpolate-size`, for
Field's error, with a fallback where it's missing; `:has()`, `:where()`,
`:dir()`, `color-mix()`, `light-dark()`, for dark mode, and logical properties.
Firefox cannot yet keep a closing popup in the top layer during its fade, so
the fade may briefly pass under other content there.
