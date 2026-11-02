# Harmo

Composable UI building blocks you can install, adapt, or copy into your project.
Familiar to use, polished by default.

Harmo is a CSS-first UI library for dashboards and applications. Every
component is a native HTML element with one class, styled by plain CSS and
themed with custom properties. Use it as HTML and CSS, through its React
components, or by copying the source into your project and making it yours.
Its name comes from the Greek idea of fitting things together: small, useful
pieces that compose into more capable interfaces.

> **Status:** Early development. The CSS and React packages are usable from
> source today; neither is published to npm yet. APIs may still change before
> the first release.

[Components](docs/components/README.md) ·
[Patterns](docs/patterns/README.md) ·
[Playground](#playground) ·
[Philosophy](docs/philosophy.md) ·
[For AI agents](llms.txt) ·
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

Harmo isn't on npm yet. The planned packages are:

```sh
bun add @harmo/css @harmo/react
# or: npm install @harmo/css @harmo/react
```

Until the first release, use Harmo from source:

- **CSS:** build it with `mise run build:css` (see
  [CONTRIBUTING.md](CONTRIBUTING.md#setup)) and copy `packages/css/dist` into
  your project, or copy components from `packages/css/src` and adapt them.
- **React:** the components in `packages/react/src` are TypeScript source.
  Copy them into a React 19 project whose bundler compiles TypeScript.

## Quick start

### HTML and CSS

Load the full stylesheet, tokens and every component, then use the `.h*`
classes. With `packages/css/dist` copied into your project as `harmo/`:

```html
<link rel="stylesheet" href="harmo/index.css" />

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
@import "@harmo/css/tokens.css";
@import "@harmo/css/button.css";
@import "@harmo/css/link.css";
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

`@harmo/react` renders the same markup and does what the scripts do. Load the
CSS once, then use the components:

```tsx
import "@harmo/css";
import { Button, Field, Input, Link } from "@harmo/react";

<Button type="submit">Save changes</Button>
<Button variant="secondary">Cancel</Button>

<Link href="/reports">View reports</Link>

<Field label="Email address" description="We'll send your receipt here.">
  <Input name="email" type="email" />
</Field>
```

Set your router's link component and your framework's image component once,
at the root, and Link, Button, TabLink, and Avatar use them:

```tsx
<HarmoProvider linkComponent={NextLink} imageComponent={NextImage}>
  {children}
</HarmoProvider>
```

Harmo builds in no text: every word a component shows or announces comes from
you, so an app in any language reads as one. Each component page's React
section lists its props.

## Components

| Group | Components |
| --- | --- |
| Actions | [Button](docs/components/button.md), [Link](docs/components/link.md) |
| Forms | [Field](docs/components/field.md), [Input](docs/components/input.md), [TextArea](docs/components/textarea.md), [Password input](docs/components/password.md), [Select](docs/components/select.md), [Checkbox](docs/components/checkbox.md), [Radio](docs/components/radio.md), [Switch](docs/components/switch.md), [Segmented control](docs/components/segmented.md) |
| Overlays | [Popup](docs/components/popup.md), [Listbox](docs/components/listbox.md), [Tooltip](docs/components/tooltip.md) |
| Navigation | [Breadcrumb](docs/components/breadcrumb.md), [Tabs](docs/components/tabs.md) |
| Data | [Filter chip](docs/components/filter-chip.md) |
| Feedback | [Banner](docs/components/banner.md), [Meter](docs/components/meter.md), [Spinner](docs/components/spinner.md) |
| Display | [Avatar](docs/components/avatar.md), [Status](docs/components/status.md), [Tag](docs/components/tag.md) |
| Icons | [Icons](docs/components/icons.md), [ChevronToArrow](docs/components/chevron-to-arrow.md), [Expand chevron](docs/components/expand-chevron.md) |
| Patterns | [Settings list](docs/patterns/settings.md) |

Every page has the same sections: a Contract table, copyable markup, the
options, appearance and states, accessibility, what a script does, the React
component, and the tokens it reads.

## Theming

Theme Harmo by overriding `--harmo-*` custom properties. Token names say what
is colored, then the variant, then the state (`--harmo-color-primary-hover`).
`--harmo-color-*` names are semantic roles; plain names such as
`--harmo-purple` are the palette they default to, so you can re-theme by
changing roles without touching components:

```css
:root {
  --harmo-color-primary: #0f75b6;
  --harmo-color-primary-hover: #0265a0;
  --harmo-color-primary-active: #005589;
}
```

The font is the system's by default. To match an existing app, set it once:

```css
:root {
  --harmo-font-family: "Helvetica Neue", Helvetica, sans-serif;
}
```

Token defaults are declared on `:where(:root)`, so your overrides win
whichever stylesheet loads last. For a local theme, override the role on the
component or a containing element instead of `:root`. Tokens built from
another token are worked out on `:root`, so a local override doesn't reach
them: redeclare those in the same place.

```css
.dark-panel {
  --harmo-color-focus: #8ab4ff;
  --harmo-focus-outline: 2px solid var(--harmo-color-focus);
}
```

The built tokens are `--harmo-focus-outline`, the link, input, switch, icon,
and secondary-button tokens, and the button and chevron durations; see
`tokens.css`. Each component page lists every token it reads.

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
