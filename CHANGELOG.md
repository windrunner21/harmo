# Changelog

What changed in each release of Harmo's three packages, `@harmo-ui/css`,
`@harmo-ui/react`, and `harmo-ui`, which are released together, at the same
version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/): until 1.0, a
minor version may change an API, and says how to upgrade when it does.

## [Unreleased]

## [0.2.0] - 2026-11-06

### Upgrading

- A primary button's colors are now `--harmo-color-primary-fill`,
  `--harmo-color-primary-fill-hover`, and `--harmo-color-primary-fill-active`,
  and a switch's is `--harmo-color-primary-fill`. On `:root` they follow your
  `--harmo-color-primary`: the fill is the primary, one step darker on hover and
  another when pressed. If you set `--harmo-color-primary-hover` or
  `--harmo-color-primary-active` to restyle buttons, set the fill tokens
  instead; those two still color text and links.
- A theme set on an element rather than on `:root` needs the fill tokens there
  too, since a token built from another is worked out on `:root`. An accent, or
  a theme from `npx harmo-ui theme`, sets them for you.

### Added

- Dark mode. Every color is a light and dark pair, through `light-dark()`. A
  page stays light until it opts in with `color-scheme: dark`, or
  `color-scheme: light dark` to follow the system, on `:root` or on any part of
  the page.
- Accents. `data-harmo-accent` on `<html>`, or on any element, recolors what's
  inside it: `purple` (the default), `blue`, `teal`, `green`, `amber`, `red`,
  `pink`, or `mono`, which is black, or near-white in dark mode. Each passes
  WCAG AA in every role, in both modes. `index.css` includes them, and
  `npx harmo-ui add` copies `accents.css` with `tokens.css`; with
  per-component imports, load `accents.css` after `tokens.css`.
- `npx harmo-ui theme "<hex>"`, which writes `harmo-theme.css`: your brand
  color in every role, in light and dark mode, at WCAG AA, adapted from the
  nearest accent. It adds the file to `harmo.css` when there is one.
- Kbd: `<kbd class="hkbd">`, or `<Kbd>`, for a key or shortcut, such as Enter
  or ⌘K, in text or on a button.
- Card: `.hcard`, or `<Card>`, a frame around a group of content, tinted by
  default, `raised`, or `ghost` for rows that lead somewhere.
- Tokens: `--harmo-color-primary-fill`, `-fill-hover`, and `-fill-active`, for
  what has white text on it, Button and Switch;
  `--harmo-link-hover-text-decoration`; and `--harmo-card-padding`.

### Changed

- A primary button is one step darker on hover and another when pressed, and
  in dark mode one step lighter on hover, instead of turning dark purple.
- `@harmo-ui/react` declares `"sideEffects": false`, so a bundler can leave out
  the components an app doesn't use.
- The packages' npm pages link to [harmo-ui.com](https://harmo-ui.com).

### Fixed

- A popup, and the list inside it, stay 8px from the window's edge, as on a
  phone, and a list fills a popup wider than its 32rem cap.
- An open list no longer shows the browser's own focus ring, clipped by its
  popup. When the list has keyboard focus and no option is highlighted, its
  popup shows Harmo's focus ring.
- The React README shows `HarmoProvider` in a Client Component, as the Next.js
  App Router needs.

## [0.1.1] - 2026-11-03

The first release on npm.

### Added

- `@harmo-ui/css`: Avatar, Banner, Breadcrumb, Button, Checkbox,
  ChevronToArrow, Expand chevron, Field, Filter chip, Icons, Input, Link,
  Listbox, Meter, Password input, Popup, Radio, Segmented control, Select,
  Spinner, Status, Switch, Tabs, Tag, TextArea, and Tooltip, and the Settings
  list pattern, themed with `--harmo-*` custom properties.
- `@harmo-ui/react`: the same components in React, rendering the same markup.
- `harmo-ui`: `npx harmo-ui add <component>`, which copies components, with
  their styles and what they need, into a project.

[Unreleased]: https://github.com/windrunner21/harmo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/windrunner21/harmo/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/windrunner21/harmo/releases/tag/v0.1.1
