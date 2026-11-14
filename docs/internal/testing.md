# Testing

Internal, for contributors. The HTML examples in `examples/html/src` are
Harmo's contract: hand-written markup that the CSS is built and documented
against. A React component is correct when it renders that markup, and when
it does what the HTML example's script does. Harmo tests the two separately,
and the CLI on its own.

## 1. Markup comparison

`examples/react/test/markup.test.tsx` renders each React example to static
HTML and compares it with the HTML example of the same title. A difference
fails the test with a line-by-line diff.

`examples/react/test/hidden.test.tsx` renders the components whose other props
go to an element inside, such as PasswordInput's to its input, and checks that
`hidden` still reaches the whole component. No example shows that.

The other `examples/react/test/<slug>.test.tsx` files test what a component
renders from its props where no example shows it, such as the name an exclusive
Accordion gives its items, or a Calendar's days in another locale. They render
to static markup too, so they see no effects or layout; behavior is the
browser tests' (step 2). `mise run test:react` runs them all, with the markup
comparison.

`examples/react/test/package.test.tsx` checks what an app gets from npm. The
playground already imports `@harmo-ui/react` as compiled, so every test runs on the
published ES modules; this adds that each source file became one JavaScript file
and one types file in each format, that each keeps its `"use client"` or lack of
one, that no JavaScript import still ends in `.ts` or `.tsx`, that every entry
point in `package.json` exists, and that Node can load the package through both
`import` and `require`. A deliberately wrong prop, marked `@ts-expect-error`,
makes `mise run check:react` fail if the types stop working.

### Why this, and not the usual tools

- **Snapshot tests** record whatever a component renders the first time and
  fail when it changes. The recorded markup is the code's own output, so a
  wrong first version is recorded as right, and changed snapshots tend to be
  accepted without being read. Harmo already has a better reference: the HTML
  examples, written by hand and reviewed with the CSS. Comparing against them
  checks the thing that matters, that React and HTML stay the same.
- **A simulated DOM** (jsdom, happy-dom) has no layout, no popover top layer,
  no anchor positioning, and no CSS-driven `visibility`, which Popup, Listbox,
  Select, Tooltip, and Tabs depend on. Markup needs no DOM at all, and
  behavior needs a real browser (step 2 below).

### What counts as the same

`examples/react/test/markup.ts` reads the HTML examples the way the playground build does,
without their `<play-note>` and with each `<play-icon>` expanded to its SVG,
then brings both sides to one canonical form:

- attribute names lowercased, since HTML reads them case-insensitively (React
  writes `popoverTarget`), then sorted; a bare attribute equals an empty one;
- class names sorted, and style declarations spaced the same way;
- ids, and the anchor names in `anchor-name` and `position-anchor`, numbered
  in order of appearance, since React generates its own; references to an id
  must still point at the same element;
- whitespace between tags dropped, and whitespace in text collapsed, except
  inside `<textarea>` and `<pre>`, whose text is a value or shown as written,
  so it's kept, less the one newline the parser drops after the opening tag;
- `<path />` equal to `<path></path>`, and character references decoded;
- `data-example-*` hooks, which only the playground's scripts read, left out;
- React's preload hints for images left out: in a page, React puts them in
  the document's head, but a component rendered alone gets them ahead of its
  markup.

Anything else is a real difference: a missing or extra element or attribute,
a different value, or a different order of elements.

It can't see:

- behavior, or anything a script changes after the page loads; React examples
  render the state the HTML example shows on load;
- CSS;
- whether whitespace between inline elements matters, since all of it is
  dropped outside `<textarea>` and `<pre>`.

### Adding examples

`examples/react/src/components/<slug>.tsx` ports
`examples/html/src/components/<slug>.html`. It exports `examples`, an object
of components keyed by the HTML examples' titles, and is listed in
`examples/react/src/examples.ts`:

```tsx
export const examples = {
  "Label and control": () => (
    <Field label="Full name">
      <Input name="full-name" type="text" autoComplete="name" required />
    </Field>
  ),
};
```

- The HTML partials set what's tested. An HTML example without a React
  version fails, unless `markup.test.tsx` lists it as HTML only, for what only
  HTML can show: Tabs before its script runs, and the list a typed search
  leaves empty. Each one on that list must still be in the HTML, and still
  have no React version.
- A React example whose title isn't in the HTML fails, and so does a file in
  `src/components` that `src/examples.ts` doesn't list.
- Write each example the way an app would use the component, not to make the
  test pass. When the two differ, fix the component, or, if the HTML example
  is wrong, fix the HTML example and record why.
- Write each example on its own, without helpers shared across the file:
  the React playground shows its code to copy.
- Give an example the behavior its HTML example's script has, with local
  state, as an app would: the test checks the first render, and the
  playground is what people try.
- `src/app-icons.tsx` stands in for an app's own icons, drawn from the
  playground's SVG files, for examples that pass one to a component as the
  HTML does with `<play-icon>`.

The examples are the React playground's own, so the markup the test checks is
the markup the playground shows.

## 2. Behavior in a browser

`tests/` holds browser tests, run with [Playwright](https://playwright.dev)
against the built playgrounds, opened from disk as people open them. Each
test runs on both playgrounds, so the React components are checked against
what the HTML examples' scripts do, as the markup test checks them against
the HTML.

```sh
mise run test:browser    # builds both playgrounds, then tests them in Chromium
```

`tests/pages.spec.ts` opens every page of both playgrounds and checks that:

- it has a page for every component in `examples/catalog.ts`, and no other,
  so a component left out of a playground fails rather than going untested;
- every React example gets ready: hydrated, with its effects run, which add
  listeners such as Listbox's keys. Each example runs under `StrictMode`, as
  a framework's development server runs an app, so every effect and ref
  callback runs, is cleaned up, and runs again. `examples/react/src/Ready.tsx`
  wraps each example, on the server too, so the markup and ids stay the same,
  and marks its root `data-play-ready` once every effect inside has run;
- [axe](https://github.com/dequelabs/axe-core) finds no WCAG 2.2 A or AA
  violation, as the page loads and with each example's popup open, its
  trigger included: each popup opened by its `popovertarget` button, one that
  doesn't open failing; each popup a button inside an open one opens, with
  both open; and each list a script opens from its field, such as a
  Combobox's, opened with a click, unless it stays closed, as a read-only one
  does. Each example's dialog is opened by its button, or by script for one
  opened from a link, and every `commandfor` must reach a dialog, so a button
  that misses its dialog fails. axe is loaded into the page once, and the
  whole check, each popup opened and checked once it's fully open, runs in
  one call to the page;
- `hidden` hides every part of every example, except Field's error and the
  password details, which stay rendered to animate closed.

The other files are named after what they test. A component's,
`<slug>.spec.ts`, tests what the "What a script does" table on its page in
`docs/components` says, and what its Appearance section promises that a script
or a measurement can check, such as a popup's 8px from its trigger. A few test
something across components or the playgrounds themselves:

| File | Tests |
| --- | --- |
| `pages.spec.ts` | Every page, as above |
| `hidden.spec.ts` | What `hidden` does across components: the password details still animating closed; Settings rows and Breadcrumb items taking the first or last one's look, and the arrow keys skipping a tab, when one is hidden |
| `accents.spec.ts` | `data-harmo-accent` recoloring what's inside it |
| `color-scheme.spec.ts` | Dark mode from `color-scheme` |
| `input-highlight.spec.ts` | Marking text in an Input or a TextArea |
| `playground-nav.spec.ts` | The playgrounds' own navigation, built with Sidebar: the page you're on marked, and the sheet a menu button opens on a narrow screen |

Every test fails if the page logs a console error or throws, which includes
React's hydration mismatches; `test` in `tests/playgrounds.ts` adds that
check. `tests/lists.ts` holds the checks shared by Listbox, Select, and
Filter Chip.

### Writing a test

- Wrap a component's tests in `onEachPlayground("<slug>", () => …)`, so each
  runs on both playgrounds, and find elements by role and name inside the
  example, never by id: React generates its own.
- Test what the docs promise, and only what Harmo does: not what the
  browser does anyway, such as a disabled button not opening a popup, and
  not the playground's own glue, such as a link that stays on the page.
- Get the example with `example(page, "<slug>-<title>")`, which scrolls its
  demo to the middle of the window, so a popup it opens has room.
- Inside an open popup, point with `pointAt` and click with `clickAt`, not
  Playwright's `hover` and `click`. Playwright scrolls the page first, even
  for an element already in view, and the popup follows its trigger a frame
  later, away from the pointer; a click that lands outside closes the popup.
- After opening a list with a click, wait for focus to land before pressing
  keys, as a person sees it: focus can move into a popup only once it shows,
  in its `toggle` event, a moment after the click. A select's trigger keeps
  focus, so keys can follow at once there; to test keys that arrive before
  the `toggle` event, send them in one task with `dispatchEvent`.
- Don't time things with the clock. To check that something animates, or
  doesn't, count the transitions it starts with `watchTransitions`; to check
  a delay, read it from the CSS; to look mid-animation, make its transitions
  long before they start, and finish them after: pausing one once it has
  started can come too late on a busy machine. To wait out a script's timer,
  such as Button's two seconds of loading, put the page on Playwright's
  paused clock and move it on (see `button.spec.ts`). A wait is fine only
  when it can't be too short, such as waiting out a script's half-second
  pause, and says so.
- Keep calls to the page few. In WebKit each one takes about a tenth of a
  second, against a hundredth in Chromium, so a check that goes through many
  elements, as `pages.spec.ts` does, works through them inside one
  `page.evaluate`.
- Make sure a new test can fail: break what it tests, in the built
  playground or the source, and watch it fail.

One axe rule is left out for open listboxes: `scrollable-region-focusable`
asks that a list that scrolls be in the Tab order. A listbox, or its
select's trigger, takes focus when it opens instead, and the arrow keys
scroll it, which `listbox.spec.ts` tests.

A test of a known bug is marked with `test.fail`, naming the browsers it
fails in and why, so the suite stays green while the bug is open, and fails
once it's fixed, as a reminder to remove the mark.

What they can't see:

- Link's visited color: browsers hide `:visited` styles from scripts, for
  privacy.
- In React, a press on a loading or `aria-disabled` Button calling the app's
  `onClick` anyway: the example's own handler shows nothing more.
- In Chrome, whether a closing popup is pinned: Chrome doesn't move a
  closing popup either way. Firefox does, as it leaves the top layer, and
  the closing test fails there without the pin.
- In Firefox, whether the tooltip scripts count a tooltip as having shown:
  Chrome still shows it when the pointer leaves, so reading its style works
  there too. Firefox has hidden it already, and the "right after one closes"
  test fails there with that reading.
- Firefox and WebKit, until CI runs them.

### Why Playwright

- It runs the three engines Harmo supports: Chromium (Chrome and Edge),
  Firefox, and WebKit (Safari), all on Linux. Harmo relies on recent
  features, such as anchor positioning and `field-sizing`, and engines
  differ most where their implementations are new.
- Its browser versions are pinned to its own version, so a test gives the
  same result on every machine.
- It waits for elements before acting on them, and keeps a trace of each
  failed test. axe runs in all three browsers.

Its test runner runs on Node, which mise installs; Bun does everything else.
Bun's own browser, Bun.WebView, drives only Chrome on Linux, and Safari's
engine only on macOS.

### Browsers

- **Locally, in Docker:** `mise run test:browser` runs Chromium, and
  `mise run test:browser:all` all three, in Playwright's image,
  `mcr.microsoft.com/playwright`, at the version of `@playwright/test` in
  `tests/package.json`: the same Ubuntu and browsers as CI, on any system.
  Name specs, then pass Playwright's options after `--`, such as
  `mise run test:browser button -- --grep hold` or
  `mise run test:browser:all -- --project=webkit`.
- **Without Docker:** `bunx playwright test` in `tests/` runs every browser
  the config lists, once installed with `bunx playwright install`.
  Playwright supports Ubuntu, Debian, and macOS officially; elsewhere, such
  as on Arch, its browsers may not install.
- **On CI,** `.github/workflows/ci.yml` follows Playwright's CI and sharding
  guides. Each browser runs in three jobs, each with a third of its tests
  (`--shard`), all side by side, in the same Playwright image as local runs,
  with the browsers and their system libraries already in it; installing
  those with apt on each run took from 11 seconds to 13 minutes. Each job
  writes a blob report, and a last job merges them into one HTML report,
  `html-report--attempt-<n>`, kept as an artifact for 14 days, and notes
  each failure once on the pull request. A failure's trace is in the report;
  it opens with `bunx playwright show-trace`. A job's tests stop after 15
  minutes, so a stuck run still writes its report.

Local runs use a quarter of the CPU's cores for workers, so the computer stays
usable during a run. Each worker runs a whole browser, so Playwright's default
of half the cores kept a 16-core machine about 95% busy. For a faster run, add
`--workers=8`. CI's runners do nothing else, so they keep the default.

Locally, passing tests record no trace: a failed test runs once more, and
that run records one. A test that fails and then passes shows as flaky.
Recording every test, to keep only the failures' traces, took about 40% of a
run's CPU. On 40 Button tests: about 46 CPU-seconds in a system's full
Chromium, recording every test; 27 without recording; 16 in the image's
Chromium, Playwright's headless build. CI records every test, and keeps a
failure's trace.

## 3. The CLI

```sh
mise run test:cli
```

`packages/cli/test/harmo.test.ts` runs the built CLI in Node, as `npx` would, in
throwaway projects inside `packages/cli/test-output`, so their copies find that
package's React and TypeScript. It checks, for every component, that each copied
file's imports point to copied files and that each `.h*` class it uses has styles
in the copied CSS; then that `--all` type-checks under a default Next.js setup. It
also covers the folders, `harmo.css`, the overwrite rules, `--dry-run`, and the
errors. It can't answer the CLI's question about a changed file, which needs a
terminal, so try that by hand after changing it.
