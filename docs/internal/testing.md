# Testing the React components

Internal, for contributors. The HTML examples in `examples/html/src` are
Harmo's contract: hand-written markup that the CSS is built and documented
against. A React component is correct when it renders that markup, and when
it does what the HTML example's script does. Harmo tests the two separately.

## 1. Markup comparison

`examples/react/test/markup.test.tsx` renders each React example to static
HTML and compares it with the HTML example of the same title. A difference
fails the test with a line-by-line diff.

```sh
mise run test:react
```

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
- whitespace between tags dropped, and whitespace in text collapsed;
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
  dropped.

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
  version, or a whole component without one, shows as to-dos, so what's left
  is visible.
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

## 2. Behavior in a browser (planned)

Browser tests, with Bun.WebView under `bun test` or with Playwright (not yet
decided), will run against both playgrounds and test what the scripts do:
keyboard navigation and focus in Listbox, Select, and Tabs; opening and
closing popups and the side they open on; Escape on tooltips; the sliding
pill and underline; and the error message's animation. Every React page must
also hydrate without a console error, and axe will add automated
accessibility checks to the same pages.
