# Tabs

Switches between sibling pages, such as the sections of Analytics or Settings,
or between panels on one page. A hover pill and an underline slide between
tabs. For one choice among a few options in a form, use a
[segmented control](segmented.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tabs.css` |
| Element | `<nav class="htabs">` around a `<ul>` of links, or `<div class="htabs">` around a `role="tablist"` of buttons |
| Parts | `.htabs-highlight` and `.htabs-indicator`, after the list |
| Required | `aria-label` on the nav or tablist; links: `aria-current="page"` on the current one; buttons: `role="tab"`, `aria-selected`, `aria-controls`, and `tabindex="-1"` on unselected tabs |
| Unique | The tabs' and panels' ids |
| Script | Optional for links (the sliding pill and underline, and keeping the current tab in view); required for panels; see [What a script does](#what-a-script-does) |

## Markup

Between pages, tabs are links in a `<nav>`:

```html
<nav class="htabs" aria-label="Analytics">
  <ul>
    <li><a href="/analytics/tickets" aria-current="page">Tickets</a></li>
    <li><a href="/analytics/campaigns">Campaigns</a></li>
  </ul>
  <span class="htabs-highlight" aria-hidden="true"></span>
  <span class="htabs-indicator" aria-hidden="true"></span>
</nav>
```

On one page, the same look holds a tablist of buttons, each controlling a
panel:

```html
<div class="htabs">
  <div role="tablist" aria-label="Quick replies">
    <button type="button" role="tab" id="replies-all" aria-selected="true" aria-controls="replies-all-panel">All</button>
    <button type="button" role="tab" id="replies-team" aria-selected="false" aria-controls="replies-team-panel" tabindex="-1">Team</button>
  </div>
  <span class="htabs-highlight" aria-hidden="true"></span>
  <span class="htabs-indicator" aria-hidden="true"></span>
</div>
<div role="tabpanel" id="replies-all-panel" aria-labelledby="replies-all" tabindex="0">Every quick reply you can use.</div>
<div role="tabpanel" id="replies-team-panel" aria-labelledby="replies-team" tabindex="0" hidden>Replies shared with your team.</div>
```

The panels are the application's own; Tabs doesn't style them.

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="page"` on a link | The current tab |
| `aria-selected="true"` on a `role="tab"` button | The selected tab, drawn like the current link |
| `hidden` on a `<li>` or a `role="tab"` button | Hides that tab, with no gap left |
| `data-ready` on `.htabs` | Set by the script: the sliding pill and underline take over |
| `data-on-current` on `.htabs-highlight` | Set by the script: the pill is over the current tab |

## Appearance and states

- Tabs stay on one line. When they don't fit, the strip scrolls sideways on
  its own, with no scrollbar, and the page stays still; a tab cut off at the
  edge shows there's more. A flex or grid parent doesn't widen for the tabs.
- 14px medium `--harmo-color-text-secondary` text, `--harmo-color-text` on
  hover; the current or selected tab is `--harmo-color-primary` with a 2px
  underline over the divider. Links and buttons look the same.
- With the script, the pill (`--harmo-color-background-hover`, or
  `--harmo-color-primary-tint` over the current tab) follows the pointer, and
  the underline slides to a newly current tab, both in 200ms
  (`--harmo-ease-in-out-cubic`). Each spans the strip and is clipped to its
  tab with `clip-path`, which moves and resizes it without layout work and
  keeps its corners round. The pill appears in place rather than sliding in
  from its last position.
- The current tab slides to the middle of the strip, or as near as the strip
  scrolls, with the underline. On load, from the keyboard, and after a resize,
  it moves at once.
- From the keyboard, and after a resize, the underline moves at once: arrow
  keys repeat quickly, and the moment a tab is chosen is what matters. With no
  current tab, it shrinks away.
- Reduced motion: the pill still fades in and out but jumps between tabs, and
  the underline and the strip jump.
- Without the script, the current tab shows a static underline and each tab
  its own hover background. The strip still scrolls, but doesn't move to the
  current tab.
- Focus: `--harmo-focus-outline` at a fixed 2px offset, so the ring stays
  above the divider even if `--harmo-focus-outline-offset` changes. So that
  scrolling doesn't clip the ring, the strip reaches 4px past its container at
  the top and the start, with padding to match. Set the space around it on a
  wrapper, or add those 4px back if you change its margin there.
- Forced colors (Windows contrast themes): the underline is drawn in the
  system highlight color, since backgrounds are removed, and the divider is a
  border, with the underline just above it.

## Accessibility

- **Between pages:** links in a `<nav>` with an `aria-label`, the current one
  marked `aria-current="page"`. Not an ARIA tablist, which is for panels on
  one page.
- **On one page:** the WAI-ARIA tabs pattern. A `role="tablist"` with an
  `aria-label` holds `role="tab"` buttons, each pointing at its
  `role="tabpanel"` with `aria-controls`. Only the selected tab is in the Tab
  order (`tabindex="-1"` on the others), so Tab moves from the tabs into the
  panel, and the arrow keys move between tabs.
- The pill and underline are `aria-hidden`.

## What a script does

| Change | When |
| --- | --- |
| `--htabs-highlight-x`, `--htabs-highlight-width`, `--htabs-highlight-opacity` on `.htabs` | As the pointer moves over the tabs |
| `--htabs-indicator-x`, `--htabs-indicator-width` on `.htabs` | On load, resize, and a change of current tab; at once (no transition) after a key press or a resize, and a width of `0px` while no tab is current |
| `--htabs-list-width` on `.htabs` | With the underline: the width of the `<ul>` or tablist, so the pill and underline reach every tab |
| Scroll the strip, and only the strip, to bring the current tab to its middle | On load, on a resize, and on a change of current tab: at once on load, on a resize, after a key press, or with reduced motion; otherwise smoothly |
| `data-on-current` on `.htabs-highlight` | When the pill is over the current tab |
| `data-ready` on `.htabs` | Once measured |

Measure each `-x` from the left edge of the `<ul>` or tablist, whichever the
reading direction: the pill and underline start there, and scroll with it, so
scrolling needs no measuring.

On one page it also:

| Change | When |
| --- | --- |
| `aria-selected` and `tabindex` on the tabs, `hidden` on the panels | When a tab is chosen |
| Focus and select the next or previous enabled tab that's shown, following the reading direction; Home and End go to the first and last such tab | Arrow keys on a tab |

`examples/html/src/scripts/tabs.js` is an example script. For the playground,
it stops links from leaving the page and moves the current tab instead; on a
real site, let link clicks navigate and set `aria-current` on the new page.
Permission and feature gating stay in the application.

## React

For links, `<TabNav>` renders the `<nav>`, with a `<TabLink>` for each link.
For panels, `<Tabs>` holds the selection, `<TabList>` renders the strip, and
each `<Tab>` and its `<TabPanel>` share a `value`, from which their ids and
connections are built. Both strips run the highlight and underline, and are
`hidden` when one tab or none is shown, so a lone panel keeps its name.
`<TabList>` handles the arrow keys, Home, and End. Other props are each
element's attributes, except that a `<TabList>`'s `className` and `style` go to
the `.htabs` wrapper, and its other props and `ref` to the `role="tablist"`
element. Name a `<TabNav>` or `<TabList>` with `aria-label`.

| Prop | On | Effect |
| --- | --- | --- |
| `current` | `TabLink` | Marks the current page with `aria-current="page"` |
| `alwaysShow` | `TabNav`, `TabList` | Shows the strip even with one tab |
| `value` or `defaultValue` | `Tabs` | The selected tab's value; one of them is required |
| `onValueChange` | `Tabs` | Called with the newly selected value |
| `value` | `Tab`, `TabPanel` | Pairs a tab with its panel |

```tsx
<TabNav aria-label="Analytics">
  <TabLink href="/analytics/tickets" current>
    Tickets
  </TabLink>
  <TabLink href="/analytics/campaigns">Campaigns</TabLink>
</TabNav>

<Tabs defaultValue="all">
  <TabList aria-label="Quick replies">
    <Tab value="all">All</Tab>
    <Tab value="private">Private</Tab>
  </TabList>
  <TabPanel value="all">Every quick reply you can use.</TabPanel>
  <TabPanel value="private">Replies only you can see.</TabPanel>
</Tabs>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-color-primary`, `--harmo-color-primary-tint`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-duration-normal`, `--harmo-ease-in-out-cubic`,
`--harmo-focus-outline`, `--harmo-font-family`, `--harmo-font-line-height`,
`--harmo-font-size-sm`, `--harmo-font-weight-medium`.
