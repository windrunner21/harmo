# Contributing

How Harmo is built. Users should start with the [README](README.md);
component contracts live in [docs/components](docs/components/README.md)
and the principles behind them in [docs/philosophy.md](docs/philosophy.md).

## Setup

Harmo's tools are managed by [mise](https://mise.jdx.dev/), which installs
the versions `mise.toml` names: [Bun](https://bun.com), as the runtime,
package manager, bundler, test runner, and type checker; the standalone
[Dart Sass](https://sass-lang.com/dart-sass/), which compiles the SCSS; and
Node, which only runs [Playwright](https://playwright.dev)'s test runner for
the browser tests.

```sh
mise install                # install Bun, Dart Sass, and Node
bun install                 # link the workspace's packages
mise run build:css          # compile the CSS
mise run check:react        # type-check the React package, playground, and tests
mise run test:react         # compare the React examples with the HTML examples
mise run test:browser       # test both playgrounds in Chromium, in Docker
```

The browser tests run in Playwright's Docker image, with the browsers CI
uses, on any system. They need Docker, and the image, pulled once at the
version of `@playwright/test` in `tests/package.json`:

```sh
docker pull mcr.microsoft.com/playwright:v1.64.1-noble
```

Consumers of the compiled CSS need none of this.

## Project layout

```text
packages/css/          @harmo-ui/css: SCSS in src/, compiled to dist/
packages/react/        @harmo-ui/react: TypeScript in src/, compiled to dist/esm and dist/cjs
packages/cli/          harmo: the CLI that copies components into a project, and the
                       script that builds what it copies
examples/catalog.ts    the playgrounds' table of contents
examples/playground.ts builds the pages of both playgrounds
examples/html/         the HTML playground: the examples (the contract), example
                       scripts, and icons, in src/
examples/react/        the React playground: the same examples in React, its
                       build, and the markup test
tests/                 the browser tests, run with Playwright on both playgrounds
docs/components/       one page per component
docs/patterns/         compositions of components, such as the Settings list
docs/philosophy.md     design principles and API guidelines
docs/internal/         notes for contributors, such as how testing works
llms.txt               the index of the docs for AI agents
mise.toml              tool versions and tasks
```

The packages are a Bun workspace: `examples/react` depends on
`@harmo-ui/react` and imports it as an app would, and `tests` holds the
browser tests' own dependencies.

## Commands

```sh
mise run build:accents            # regenerate packages/css/src/accents.scss from packages/cli/src/palettes/palettes.ts
mise run build:css                # clean build: packages/css/src -> packages/css/dist
mise run watch:css                # rebuild on change while working on examples
mise run build:react              # clean build: packages/react/src -> packages/react/dist, as ES modules and CommonJS
mise run watch:react              # recompile the ES modules on change while working on the React playground
mise run build:cli                # build the CSS, then what the CLI copies, and the CLI itself
mise run build:playground         # build the CSS, then the HTML playground into examples/html/dist
mise run watch:playground         # rebuild the HTML playground on change (run watch:css alongside)
mise run build:react-playground   # build the CSS and React, then the React playground into examples/react/dist
mise run watch:react-playground   # rebuild the React playground on change (run watch:css and watch:react alongside)
mise run check:react              # type-check the React package, the React playground, the CLI, and the tests
mise run test:react               # compare the React examples' markup with the HTML examples, and check the compiled package
mise run test:cli                 # test what the CLI copies, and that the copies type-check
mise run test:browser             # build both playgrounds, then test them in Chromium, in Docker
mise run test:browser:all         # the same in Chromium, Firefox, and WebKit
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

Note each change people using Harmo would notice under Unreleased in
[CHANGELOG.md](CHANGELOG.md), as it lands: Added, Changed, or Fixed. A change
that asks something of them goes under Upgrading: what it is, what they'll
notice if they do nothing, and the code before and after. After a code block's
language, `title="globals.css"` names its file, and `preview` shows its HTML
live on the website's changelog, as the second 0.2.0 entry does; GitHub shows
both as plain code.

For assisted development, agree on the scope of each patch. Run
installations, builds, and other toolchain commands only with explicit
approval, using the project's mise setup. Source-only review and browser
validation must be reported separately.

The maintainer keeps the roadmap and the notes on how each component was
adapted privately, outside the repository; the docs describe Harmo only.

## Adding a component

Update these together, so the CSS, the docs, both playgrounds, and the tests
stay in step:

1. **CSS:** its SCSS in `packages/css/src`, and its `@use` in `index.scss`. A
   rule that sets `display` also needs `&[hidden] { display: none; }`, as a
   class's `display` overrides the attribute; `tests/pages.spec.ts` checks
   every part of every example.
2. **HTML examples:** `examples/html/src/components/<slug>.html`, any example
   script it needs in `examples/html/src/scripts`, and its entry in
   `examples/catalog.ts`.
3. **Docs:** its page in `docs/components` (the sections are listed in
   [docs/components/README.md](docs/components/README.md#page-structure)),
   the tables in that README, the README's component table, and
   [llms.txt](llms.txt).
4. **React:** the component in `packages/react/src`, exported from
   `src/index.ts`, and its entry in `packages/cli/build-registry.ts`, whose build
   fails until every source file has a place in the copy.
5. **React examples:** `examples/react/src/components/<slug>.tsx`, listed in
   `examples/react/src/examples.ts`, until `mise run test:react` shows no
   failure and no to-do for it.
6. **Browser tests:** for a component with behavior, `tests/<slug>.spec.ts`,
   testing what its page's "What a script does" table says, on both
   playgrounds.

## Releasing

`@harmo-ui/css`, `@harmo-ui/react`, and `harmo-ui` are released together, at the same
version, so the CLI copies the code of the packages with its version.

1. Set the version in the three `package.json` files, then run `bun install`.
   In `CHANGELOG.md`, move what's under Unreleased to a new section for the
   version, with the date and a one-line summary under its heading, and update
   the links at the end. Packing copies the
   changelog into each package, for npm and for the website's changelog page.
2. Run `mise run check:react`, `mise run test:react`, `mise run test:cli`, and
   `mise run test:browser:all`.
3. Check what would be published: `bunx publint packages/css`,
   `bunx publint packages/react`, `bunx publint packages/cli`, and
   `bunx @arethetypeswrong/cli --pack packages/react`. `publint`'s suggestion
   of `engines.node` for `@harmo-ui/react` is expected: the components run in the
   browser, so it's left out, as most UI libraries leave it out.
4. Commit, push, and wait for CI to pass.
5. From each of `packages/css`, `packages/react`, and `packages/cli`, run
   `npm publish`, which builds the package first.
6. Tag the commit `v<version>`, and push the tag.

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
  `src/client.tsx` hydrates it in the browser. Both wrap it in
  `src/Ready.tsx`, which marks it `data-play-ready` once its effects have
  run, for the browser tests.
- Write each example on its own, without helpers shared across the file,
  since the playground shows its code to copy. `src/app-icons.tsx` stands in
  for an app's own icons.

## Testing

- `mise run check:react` type-checks the React package, the React
  playground with its build and markup test, and the browser tests, strictly
  and with unused code reported.
- `mise run test:react` renders every React example and compares its markup
  with the HTML example of the same title. An HTML example without a React
  version shows as a to-do.
- Both playground builds check every page: no repeated ids, and every
  `aria-labelledby`, `aria-describedby`, `aria-controls`, `for`, and
  `popovertarget` points to an element.
- `mise run test:cli` runs the built CLI in throwaway projects: each component
  brings every file it imports and the styles of every class it uses, everything
  copied type-checks under a default Next.js setup, and a file you've changed is
  never replaced without asking.
- `mise run test:browser` opens every page of both playgrounds in Chromium:
  no console errors, every React example gets ready, and axe finds no WCAG
  2.2 A or AA violation, as the page loads and with each popup open. Then it
  tests what each component's scripts do, such as Listbox's keys and Tabs'
  underline. Each test in `tests/` runs on both playgrounds, and the
  config lists Chromium, Firefox, and WebKit; `mise run test:browser:all`
  runs all three. Both tasks run in Playwright's Docker image (see Setup);
  `bunx playwright test`, in `tests/`, runs without it, if you've installed
  Playwright's browsers. A failed test runs once more, recording a trace,
  kept in `tests/test-results` to open with `bunx playwright show-trace`.
- GitHub Actions (`.github/workflows/ci.yml`) runs all of these on every push
  to `master` and every pull request, the browser tests in two jobs per
  browser, each running half of them, all side by side. A failure shows on
  the pull request, and each job keeps Playwright's report, with each failed
  test's trace.

[docs/internal/testing.md](docs/internal/testing.md) explains the approach
and why.

## CSS authoring

- Author SCSS in `packages/css/src` and compile it to CSS in
  `packages/css/dist`. HTML and React use the same styles. Each component's
  markup, hooks, states, and tokens are documented in
  [docs/components](docs/components/README.md).
- In `packages/css/src`, each file without a leading underscore compiles to
  `dist/<name>.css` and is exported as `@harmo-ui/css/<name>.css`; partials
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

- Target zero runtime dependencies for `@harmo-ui/css`.
- Keep the React adapter minimal. React and React DOM are
  application-supplied peer dependencies; simple primitives do not need
  third-party UI or styling helpers.
- Treat each additional dependency as a deliberate decision. Fewer
  dependencies reduce the external code to maintain, but dependency count
  alone is not a security guarantee.
- Keep optional agent tooling separate from the runtime packages.
