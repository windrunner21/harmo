# Harmo

Composable UI building blocks you can install, adapt, or copy into your project.
Familiar to use, polished by default.

Harmo is a CSS-first UI library for dashboards and applications. Every
component is a native HTML element with one class, styled by plain CSS and
themed with custom properties. Use it as HTML and CSS, through its React
components, or by copying the source into your project and making it yours.
Its name comes from the Greek idea of fitting things together: small, useful
pieces that compose into more capable interfaces.

> **Status:** Early development, at `0.x`: APIs may still change between
> releases.

[Website](https://harmo-ui.com) ·
[Components](docs/components/README.md) ·
[Playground](#playground) ·
[Philosophy](docs/philosophy.md) ·
[For AI agents](llms.txt) ·
[Changelog](CHANGELOG.md) ·
[Contributing](CONTRIBUTING.md)

## Why Harmo

- **Composable building blocks.** Each component has one clear job, and they
  fit together without knowing your product: Popup and Listbox make a Select,
  and Field arranges any control's label, description, and error.
- **Native first.** Real `<button>`, `<input>`, and `<a>` elements, with their
  native attributes, keyboard behavior, and semantics preserved.
- **One markup for HTML and React.** The React components render exactly the
  HTML in the docs, which a test checks, and do what the example scripts do.
- **Themeable without fighting CSS.** A palette plus semantic roles, exposed
  as `--harmo-*` custom properties, with low-specificity selectors so your
  overrides win.
- **Polished by default.** Considered spacing, focus states, and motion, with
  reduced-motion alternatives.
- **Ready for agents.** Every component page opens with a Contract table, and
  [llms.txt](llms.txt) indexes the docs and the rules for using them.

The principles behind these choices are in
[docs/philosophy.md](docs/philosophy.md).

## Installation

There are two ways to use Harmo in a project. Choose one.

**Install it,** and get updates through your package manager:

```sh
bun add @harmo-ui/css @harmo-ui/react
# or: npm install @harmo-ui/css @harmo-ui/react
```

[`@harmo-ui/react`](https://www.npmjs.com/package/@harmo-ui/react) needs React 19.3
or later. For HTML and CSS alone, install only
[`@harmo-ui/css`](https://www.npmjs.com/package/@harmo-ui/css), or load it from a
CDN as below.

**Copy it,** and make it yours:

```sh
npx harmo-ui add tabs
```

[`harmo-ui`](https://www.npmjs.com/package/harmo-ui) copies a component, its styles,
and what it needs into your project, so you can change anything. Copied files don't
get updates on their own.

## Quick start

### HTML and CSS

Load the full stylesheet, tokens and every component, then use the `.h*`
classes:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@harmo-ui/css@0.1/dist/index.css" />

<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>

<button class="hbutton" data-variant="secondary" type="button">
  <span class="hbutton-label">Cancel</span>
</button>

<a class="hlink" href="/reports">View reports</a>
```

To load only what you need, import `tokens.css` once, then each component:

```css
@import "@harmo-ui/css/tokens.css";
@import "@harmo-ui/css/button.css";
@import "@harmo-ui/css/link.css";
```

Component files use the `--harmo-*` properties without defining them, so
`tokens.css` is required. Some components also need companion files, such as
`popup.css` and `listbox.css` for `select.css`; see
[Loading the CSS](docs/components/README.md#loading-the-css).

Components with behavior, such as Select, Tabs, and Tooltip, need a script
that keeps their attributes current. Each page's "What a script does" lists
it, and the playground's example scripts show how. The React components do it
for you.

### React

`@harmo-ui/react` renders the same markup and does what the scripts do. Load the
CSS once, then use the components:

```tsx
import "@harmo-ui/css";
import { Button, Field, Input, Link } from "@harmo-ui/react";

<Button type="submit">Save changes</Button>
<Button variant="secondary">Cancel</Button>

<Link href="/reports">View reports</Link>

<Field label="Email address" description="We'll send your receipt here.">
  <Input name="email" type="email" />
</Field>
```

Set your router's link component and your framework's image component once,
at the root, and Link, Button, TabLink, and Avatar use them. In the Next.js App
Router, do it in a Client Component, because a Server Component can't pass
functions to one, and wrap your root layout's `{children}` in it:

```tsx
"use client";

import NextImage from "next/image";
import NextLink from "next/link";
import { HarmoProvider } from "@harmo-ui/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HarmoProvider linkComponent={NextLink} imageComponent={NextImage}>
      {children}
    </HarmoProvider>
  );
}
```

Harmo builds in no text: every word a component shows or announces comes from
you, so an app in any language reads as one. Each component page's React
section lists its props.

## Components

| Group | Components |
| --- | --- |
| Actions | [Button](docs/components/button.md), [Copy Button](docs/components/copy.md), [Link](docs/components/link.md) |
| Forms | [Calendar](docs/components/calendar.md), [Date Picker](docs/components/date-picker.md), [Time Picker](docs/components/time-picker.md), [Field](docs/components/field.md), [Input](docs/components/input.md), [TextArea](docs/components/textarea.md), [Password Input](docs/components/password.md), [Search](docs/components/search.md), [Select](docs/components/select.md), [Combobox](docs/components/combobox.md), [Checkbox](docs/components/checkbox.md), [Radio](docs/components/radio.md), [Switch](docs/components/switch.md), [Segmented Control](docs/components/segmented.md), [Settings List](docs/components/settings.md) |
| Overlays | [Dialog](docs/components/dialog.md), [Drawer](docs/components/drawer.md), [Popup](docs/components/popup.md), [Listbox](docs/components/listbox.md), [Tooltip](docs/components/tooltip.md) |
| Navigation | [Breadcrumb](docs/components/breadcrumb.md), [Command Menu](docs/components/command-menu.md), [Menu Button](docs/components/menu-button.md), [Navigation Menu](docs/components/navigation-menu.md), [Pagination](docs/components/pagination.md), [Sidebar](docs/components/sidebar.md), [Tabs](docs/components/tabs.md) |
| Data | [Date Filter](docs/components/date-filter.md), [Filter Bar](docs/components/filter-bar.md), [Filter Chip](docs/components/filter-chip.md), [Filters](docs/components/filters.md) |
| Feedback | [Banner](docs/components/banner.md), [Empty State](docs/components/empty-state.md), [Meter](docs/components/meter.md), [Spinner](docs/components/spinner.md), [Toast](docs/components/toast.md) |
| Display | [Accordion](docs/components/accordion.md), [Avatar](docs/components/avatar.md), [Card](docs/components/card.md), [Kbd](docs/components/kbd.md), [Section](docs/components/section.md), [Stat](docs/components/stat.md), [Status](docs/components/status.md), [Tag](docs/components/tag.md), [Tag List](docs/components/tag-list.md) |
| Icons | [Icons](docs/components/icons.md), [ChevronToArrow](docs/components/chevron-to-arrow.md), [Expand Chevron](docs/components/expand-chevron.md) |

Every page has the same sections: a Contract table, copyable markup, the
options, appearance and states, accessibility, what a script does, the React
component, and the tokens it reads.

## Theming

Harmo's colors, type, and shapes are `--harmo-*` custom properties. The quickest
way to change its color is an accent. For your own brand color, generate a
theme. Any token can also be set by hand.

### Accents

`data-harmo-accent` recolors everything inside it, in light and dark mode: text
and links in the primary, checked marks and their tints, buttons, switches, and
the focus ring.

```html
<html data-harmo-accent="blue">
```

The accents are `purple` (the default), `blue`, `teal`, `green`, `amber`, `red`,
`pink`, and `mono`, which is black, or near-white in dark mode. Each has the
same contrast as the purple in every role, so text, and the text on buttons,
pass WCAG AA in both modes. Put the attribute on any element to recolor only
that part of the page. `index.css` includes `accents.css`, and
`npx harmo-ui add` copies it with `tokens.css`; with per-component imports,
load `accents.css` after `tokens.css`.

### Your brand color

```sh
npx harmo-ui theme "#0f75b6"
```

That writes `harmo-theme.css`: your color in every role, in light and dark
mode, adapted from the nearest accent at the same contrast, so text and buttons
pass WCAG AA too. A color too light for white text, such as a bright yellow, is
darkened for text and buttons, and the file says so. It's ordinary CSS: change
any line you like, since your values win over Harmo's wherever the file loads.
In a project with a `harmo.css` from `npx harmo-ui add`, it's added there.

### Tokens

Token names say what is colored, then the variant, then the state
(`--harmo-color-primary-hover`). `--harmo-color-*` names are semantic roles;
plain names such as `--harmo-purple` are the palette they default to, so you can
re-theme by changing roles without touching components. The font is the
system's by default. To match an existing app, set it once:

```css
:root {
  --harmo-font-family: "Helvetica Neue", Helvetica, sans-serif;
}
```

Token defaults are declared on `:where(:root)`, and accents with `:where()`
too, so your overrides on `:root` win whichever stylesheet loads last, over an
accent on `<html>` as well. An accent on a section sets its colors on that
section, which win inside it over what it inherits from `:root`: to change one,
override it on the section. For a local theme, override the role on the
component or a containing element instead of `:root`. Tokens built from another
token are worked out on `:root`, so a local override doesn't reach them:
redeclare those in the same place.

```css
.dark-panel {
  --harmo-color-focus: #8ab4ff;
  --harmo-focus-outline: 2px solid var(--harmo-color-focus);
}
```

The built tokens are `--harmo-focus-outline`, the primary fills, the link,
input, switch, icon, and secondary-button tokens, and the button and chevron
durations; see `tokens.css`. Each component page lists every token it reads.

### Dark mode

Harmo's colors come in light and dark pairs, through CSS's `light-dark()`. A
page stays light until it opts in with `color-scheme`, even on a dark system:

```css
:root { color-scheme: dark; }        /* always dark */
:root { color-scheme: light dark; }  /* follows the system */
.sidebar { color-scheme: dark; }     /* one part of the page */
```

Every accent, and every theme `harmo-ui theme` writes, covers both modes. To set
colors by hand for both, give each as a pair, such as
`light-dark(#0f75b6, #30aed9)`. Button and Switch use the
`--harmo-color-primary-fill` tokens rather than the primary: a dark-mode primary
light enough to read as text on a dark page is too light to sit behind white
text.

## Browser support

Harmo targets current versions of Chrome, Edge, Firefox, and Safari. It uses
the popover attribute, CSS anchor positioning (in all major browsers since
January 2026), `field-sizing: content` (since June 2026), `@starting-style`,
and `:has()`; see
[Browser features used](docs/components/README.md#browser-features-used).

## Playground

Two playgrounds show every component and variation, with the code to copy:
one in plain HTML and CSS, the other built with the React components. Both
open straight from disk, no server needed:

```sh
mise run build:playground          # then open examples/html/dist/index.html
mise run build:react-playground    # then open examples/react/dist/index.html
```

## For AI agents

[llms.txt](llms.txt) indexes the docs and the rules for writing Harmo markup
and using the React components. Every component page opens with a Contract
table: the files to load, the elements and parts, the required attributes,
what must be unique, and what a script does.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers setup with mise and Bun, the
project's layout, and how the CSS, docs, examples, and tests fit together.

## About

Harmo is built and maintained by **Imran Hajiyev**, extracted from components
originally built for production dashboard work, so every component here has
already survived real use.

- X: [x.com/imranhajiyev](https://x.com/imranhajiyev)
- LinkedIn: [linkedin.com/in/imranhajiyev](https://www.linkedin.com/in/imranhajiyev)

## License

[MIT](LICENSE)
