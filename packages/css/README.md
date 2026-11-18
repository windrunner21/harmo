# @harmo-ui/css

The styles of [Harmo](https://harmo-ui.com), a CSS-first UI
library for dashboards and applications. Every component is a native HTML
element with one class, themed with `--harmo-*` custom properties.

## Install

```sh
bun add @harmo-ui/css
# or: npm install @harmo-ui/css
```

## Use

Load everything at once:

```css
@import "@harmo-ui/css";
```

Or load `tokens.css` once, then only the components you use:

```css
@import "@harmo-ui/css/tokens.css";
@import "@harmo-ui/css/button.css";
```

Without a build step, load it from a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@harmo-ui/css@0.8/dist/index.css" />
```

Then write the markup:

```html
<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>
```

For dark mode, set `color-scheme`. Without it, Harmo stays light:

```css
:root {
  color-scheme: light dark; /* follows the system; or dark, for always */
}
```

For another accent color, set `data-harmo-accent` on `<html>` or any section:
`purple` (the default), `blue`, `teal`, `green`, `amber`, `red`, `pink`, or
`mono`, which is black, or near-white in dark mode. `index.css` includes the
accents; otherwise load `accents.css` after `tokens.css`.

For React, use [`@harmo-ui/react`](https://www.npmjs.com/package/@harmo-ui/react).

## SCSS source

The SCSS that the CSS is compiled from ships in `src`. With Dart Sass's
`pkg:` importer, your own SCSS can use its shortcuts, named after the tokens.
Give the file's whole name:

```scss
@use "pkg:@harmo-ui/css/src/_shortcuts.scss" as *;

.invoice-total {
  padding: $space-xs;

  color: $color-text-secondary;
}
```

The shortcuts are references, such as `var(--harmo-color-text-secondary)`,
not values, so the page still needs `tokens.css`, or `index.css`, loaded once.

## Learn more

- [Components](https://github.com/windrunner21/harmo/blob/master/docs/components/README.md):
  the markup, options, and tokens of each one
- [Theming](https://github.com/windrunner21/harmo#theming)

Harmo is at `0.x`, so its APIs may still change between releases.

## License

[MIT](LICENSE)
