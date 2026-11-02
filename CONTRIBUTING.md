# Contributing

How Harmo is built. Users should start with the [README](README.md);
component contracts live in [docs/components](docs/components/README.md)
and the principles behind them in [docs/philosophy.md](docs/philosophy.md).

## Setup

Harmo's tools are managed by [mise](https://mise.jdx.dev/), which installs
the versions `mise.toml` names: [Bun](https://bun.com), as the runtime,
package manager, bundler, test runner, and type checker, and the standalone
[Dart Sass](https://sass-lang.com/dart-sass/), which compiles the SCSS.
Node isn't needed.

```sh
mise install                # install Bun and Dart Sass
bun install                 # link the workspace's packages
mise run build:css          # compile the CSS
mise run check:react        # type-check the React package and playground
mise run test:react         # compare the React examples with the HTML examples
```

Consumers of the compiled CSS need none of this.

## Project layout

```text
packages/css/          @harmo/css: SCSS in src/, compiled to dist/
packages/react/        @harmo/react: the React components, as TypeScript in src/
examples/catalog.ts    the playgrounds' table of contents
examples/playground.ts builds the pages of both playgrounds
examples/html/         the HTML playground: the examples (the contract), example
                       scripts, and icons, in src/
examples/react/        the React playground: the same examples in React, its
                       build, and the markup test
docs/components/       one page per component
docs/patterns/         compositions of components, such as the Settings list
docs/philosophy.md     design principles and API guidelines
docs/internal/         notes for contributors, such as how testing works
llms.txt               the index of the docs for AI agents
mise.toml              tool versions and tasks
```

The packages are a Bun workspace: `examples/react` depends on
`@harmo/react` and imports it as an app would.

## Commands

```sh
mise run build:css                # clean build: packages/css/src -> packages/css/dist
mise run watch:css                # rebuild on change while working on examples
mise run build:playground         # build the CSS, then the HTML playground into examples/html/dist
mise run watch:playground         # rebuild the HTML playground on change (run watch:css alongside)
mise run build:react-playground   # build the CSS, then the React playground into examples/react/dist
mise run watch:react-playground   # rebuild the React playground on change (run watch:css alongside)
mise run check:react              # type-check the React package and the React playground
mise run test:react               # compare the React examples' markup with the HTML examples
```

Package dependencies belong in the appropriate `package.json`; tools belong
in `mise.toml`.

## Development approach

Work in small, reviewable checkpoints: inspect the source component, explain
the proposed adaptation, implement the agreed scope, then review before moving
on.

Start with HTML/SCSS and meaningful examples; add the React component after
the markup and styling contract is understood. Validate keyboard behavior,
narrow layouts, long content, zoom, disabled/error states, reduced motion,
and token overrides.

For assisted development, agree on the scope of each patch. Run
installations, builds, and other toolchain commands only with explicit
approval, using the project's mise setup. Source-only review and browser
validation must be reported separately.

The maintainer keeps the roadmap and the notes on how each component was
adapted privately, outside the repository; the docs describe Harmo only.

## Adding a component

Update these together, so the CSS, the docs, both playgrounds, and the tests
stay in step:

1. **CSS:** its SCSS in `packages/css/src`, and its `@use` in `index.scss`.
2. **HTML examples:** `examples/html/src/components/<slug>.html`, any example
   script it needs in `examples/html/src/scripts`, and its entry in
   `examples/catalog.ts`.
3. **Docs:** its page in `docs/components` (the sections are listed in
   [docs/components/README.md](docs/components/README.md#page-structure)),
   the tables in that README, the README's component table, and
   [llms.txt](llms.txt).
4. **React:** the component in `packages/react/src`, exported from
   `src/index.ts`.
5. **React examples:** `examples/react/src/components/<slug>.tsx`, listed in
   `examples/react/src/examples.ts`, until `mise run test:react` shows no
   failure and no to-do for it.

## Playground

`examples/html/build.ts` assembles the HTML playground from
`examples/html/src` into `examples/html/dist`, which is built output and never
edited by hand. Open `dist/index.html` straight from disk; no server is needed.
`examples/playground.ts` builds the pages for both playgrounds.

- `examples/catalog.ts` lists the groups and components for both the HTML and
  React playgrounds, sorted by title.
- `src/components/<slug>.html` holds one component's examples, written with
  `<play-example>`, `<play-note>`, and `<play-icon>`; the top of
  `examples/playground.ts` describes them. Icons live once in `src/icons/`
  and come out in full, so every example can be copied as-is.
- `src/scripts/<slug>.js` holds behavior a demo needs, wrapped in a block so
  its names stay its own. Elements it uses are marked with `data-example-*`
  attributes, which the copyable markup leaves out.
- `src/layout.html`, `src/overview.html`, `src/playground.css`, and
  `src/playground.js` are the page around the examples; they aren't part of
  Harmo.

`examples/react/build.ts` builds the React playground into
`examples/react/dist` the same way, and its pages open from disk too:

- Each example's title, note, and options come from the HTML partial, and
  what renders inside it from `examples/react/src/components/<slug>.tsx`.
  That file exports `examples`, keyed by the HTML examples' titles, and is
  listed in `src/examples.ts`.
- The build renders every example with React, as a server would, and
  `src/client.tsx` hydrates it in the browser.
- Write each example on its own, without helpers shared across the file,
  since the playground shows its code to copy. `src/app-icons.tsx` stands in
  for an app's own icons.

## Testing

- `mise run check:react` type-checks both React packages, strictly and with
  unused code reported.
- `mise run test:react` renders every React example and compares its markup
  with the HTML example of the same title. An HTML example without a React
  version shows as a to-do.
- Both playground builds check every page: no repeated ids, and every
  `aria-labelledby`, `aria-describedby`, `aria-controls`, `for`, and
  `popovertarget` points to an element.

[docs/internal/testing.md](docs/internal/testing.md) explains the approach
and why; browser tests are planned.

## CSS authoring

- Author SCSS in `packages/css/src` and compile it to CSS in
  `packages/css/dist`. HTML and React use the same styles. Each component's
  markup, hooks, states, and tokens are documented in
  [docs/components](docs/components/README.md).
- In `packages/css/src`, each file without a leading underscore compiles to
  `dist/<name>.css` and is exported as `@harmo/css/<name>.css`; partials
  such as `_shortcuts.scss` and `_control.scss` (the box shared by inputs
  and select triggers) are internal.
- Author with `$variables` from `_shortcuts.scss` that reference the
  `--harmo-*` custom properties defined in `tokens.scss`. Consumers can
  theme the compiled CSS without Sass.

For example, a shortcut:

```scss
$color-primary: var(--harmo-color-primary);
```

lets a consumer customize the role through ordinary CSS — see the theming
example in the [README](README.md#theming).

Shared sizes keep components aligned: buttons, inputs, and select triggers
are `--harmo-control-height` tall, and `--harmo-icon-gap` separates text
from icons in buttons, links, and breadcrumbs.

### CSS / SCSS property order

Use two-space indentation and group declarations in this order:

| Order | Group | Examples |
| --- | --- | --- |
| 1 | Local custom properties | `--component-size` |
| 2 | Positioning | `position`, `inset`, `top`, `z-index` |
| 3 | Layout | `display`, flex/grid properties, alignment, `gap` |
| 4 | Box model | `box-sizing`, dimensions, `margin`, `padding`, `overflow` |
| 5 | Typography | Font properties, `line-height`, text alignment/decoration |
| 6 | Appearance | Colors, backgrounds, borders, radius, shadows, `opacity`, `object-fit` |
| 7 | Interaction | `cursor`, `pointer-events`, `user-select`, `touch-action` |
| 8 | Motion | `transform`, `transition`, `animation` |

Separate groups with one blank line and omit empty groups. Put shorthands
before intentional longhand overrides. Keep related nested states together
after the base declarations.

## Dependency policy

- Target zero runtime dependencies for `@harmo/css`.
- Keep the React adapter minimal. React and React DOM are
  application-supplied peer dependencies; simple primitives do not need
  third-party UI or styling helpers.
- Treat each additional dependency as a deliberate decision. Fewer
  dependencies reduce the external code to maintain, but dependency count
  alone is not a security guarantee.
- Keep optional agent tooling separate from the runtime packages.
