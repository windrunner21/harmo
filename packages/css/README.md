# @harmo-ui/css

The styles of [Harmo](https://github.com/windrunner21/harmo), a CSS-first UI
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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@harmo-ui/css@0.1/dist/index.css" />
```

Then write the markup:

```html
<button class="hbutton" type="button">
  <span class="hbutton-label">Save changes</span>
</button>
```

For React, use [`@harmo-ui/react`](https://www.npmjs.com/package/@harmo-ui/react).

## Learn more

- [Components](https://github.com/windrunner21/harmo/blob/master/docs/components/README.md):
  the markup, options, and tokens of each one
- [Theming](https://github.com/windrunner21/harmo#theming)

Harmo is at `0.x`, so its APIs may still change between releases.

## License

[MIT](LICENSE)
