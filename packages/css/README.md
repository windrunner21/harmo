# @harmo/css

The styles of [Harmo](https://github.com/windrunner21/harmo), a CSS-first UI
library for dashboards and applications. Every component is a native HTML
element with one class, themed with `--harmo-*` custom properties.

## Install

```sh
bun add @harmo/css
# or: npm install @harmo/css
```

## Use

Load everything at once:

```css
@import "@harmo/css";
```

Or load `tokens.css` once, then only the components you use:

```css
@import "@harmo/css/tokens.css";
@import "@harmo/css/button.css";
```

Without a build step, load it from a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@harmo/css@0.1/dist/index.css" />
```

Then write the markup:

```html
<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>
```

For React, use [`@harmo/react`](https://www.npmjs.com/package/@harmo/react).

## Learn more

- [Components](https://github.com/windrunner21/harmo/blob/master/docs/components/README.md):
  the markup, options, and tokens of each one
- [Theming](https://github.com/windrunner21/harmo#theming)

Harmo is at `0.x`, so its APIs may still change between releases.

## License

[MIT](LICENSE)
