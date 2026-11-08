# Sidebar

An app's navigation down the side of the window: links in groups, each an
icon and its label, between an optional header and footer, such as the
account and a link to settings. A link can have links under it, which open
below it, each group on its own, or one at a time. A toggle just past its edge collapses it to
its icons alone, each naming itself in a [Tooltip](tooltip.md), with its
groups opening beside it, one at a time; your app keeps whether it's collapsed, and can collapse it itself,
such as on a narrow screen. On a narrow screen, the same sidebar can also go
in a [Drawer](drawer.md) opened by a menu button.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `sidebar.css`, `tooltip.css`; `expand-chevron.css` for a group of links |
| Element | `<div class="hsidebar">` holding `<nav class="hsidebar-nav">`, with `.hsidebar-group`s inside |
| Parts | `.hsidebar-group` holding an optional `.hsidebar-group-label` and a `<ul class="hsidebar-list">`; in each `<li class="htooltip-trigger">`, a link, `<a class="hsidebar-item">` with an icon (`.hicon`), a `.hsidebar-label`, and an optional `.hsidebar-badge`, then its tooltip, `<span class="htooltip hsidebar-tooltip" data-side="right" aria-hidden="true">`. A group of links: `<details class="hsidebar-sub">` holding `<summary class="hsidebar-item">` (an icon, a `.hsidebar-label`, and an [Expand Chevron](expand-chevron.md)) and `<ul class="hsidebar-sub-list">`, whose first item is `<li class="hsidebar-sub-heading" aria-hidden="true">` with the group's name, then `<li>`s with `<a class="hsidebar-sub-item">`. Optional: `.hsidebar-header` and `.hsidebar-footer` around the nav; the toggle, `.hsidebar-toggle` |
| Required | `aria-label` on the nav, such as "Main"; on the toggle's button, `aria-expanded`, `aria-controls` naming the sidebar, and `aria-labelledby` naming its tooltip, whose text says what it does, in your app's language |
| Unique | Every id |
| Script | For the toggle, and for the groups of links while collapsed; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hsidebar" id="main-sidebar">
  <span class="htooltip-trigger hsidebar-toggle">
    <button class="hsidebar-toggle-button" type="button" aria-expanded="true"
      aria-controls="main-sidebar" aria-labelledby="main-sidebar-toggle">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g class="hsidebar-toggle-head">
          <line class="hsidebar-toggle-start" x1="12" y1="4" x2="12" y2="12" />
          <line class="hsidebar-toggle-end" x1="12" y1="20" x2="12" y2="12" />
        </g>
      </svg>
    </button>
    <span class="htooltip" role="tooltip" id="main-sidebar-toggle" data-side="right">Collapse</span>
  </span>
  <nav class="hsidebar-nav" aria-label="Main">
    <div class="hsidebar-group">
      <p class="hsidebar-group-label" id="main-sidebar-tools">Tools</p>
      <ul class="hsidebar-list" aria-labelledby="main-sidebar-tools">
        <li class="htooltip-trigger">
          <a class="hsidebar-item" href="/tickets" aria-current="page">
            <svg class="hicon" …>…</svg>
            <span class="hsidebar-label">Tickets</span>
          </a>
          <span class="htooltip hsidebar-tooltip" data-side="right" aria-hidden="true">Tickets</span>
        </li>
        <li class="htooltip-trigger">
          <details class="hsidebar-sub">
            <summary class="hsidebar-item">
              <svg class="hicon" …>…</svg>
              <span class="hsidebar-label">Campaigns</span>
              <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
                <g class="hexpand-chevron-head">
                  <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
                  <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
                </g>
              </svg>
            </summary>
            <ul class="hsidebar-sub-list">
              <li class="hsidebar-sub-heading" aria-hidden="true">Campaigns</li>
              <li><a class="hsidebar-sub-item" href="/campaigns/runs">Runs</a></li>
              …
            </ul>
          </details>
          <span class="htooltip hsidebar-tooltip" data-side="right" aria-hidden="true">Campaigns</span>
        </li>
      </ul>
    </div>
  </nav>
</div>
```

The sidebar is as tall as what it's in, such as a full-height column of your
layout; the nav scrolls when the links don't fit, expanded or collapsed, and
the footer stays at the bottom. A group without a label is a
`.hsidebar-group` with only its list. The header and footer hold anything,
such as a group of links, or your account switcher. To hide a link or a
group of links, put `hidden` on its `<li>`, so the list leaves no gap.

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="page"` on a link | The page you're on |
| `.hsidebar-badge` in a link | A count, such as "3"; name the link with it in words, such as `aria-label="Messages 3 unread"`, which keeps the visible "Messages 3" in its name |
| `open` on a group of links | Open, such as the group holding the page you're on |
| One `name` on a sidebar's groups of links | One group open at a time: opening one closes the one that was open. Without it, each opens and closes on its own |
| `data-collapsed` on `.hsidebar` | Collapsed to its icons |
| `--hsidebar-inline-size`, `--hsidebar-collapsed-inline-size` | Its width, 15rem, and collapsed, 60px |
| `.hsidebar` in a `.hdrawer-body` | Fills the [Drawer](drawer.md), with no edge of its own; leave out the toggle |

## Appearance and states

- 15rem wide, with 16px of padding, the background color, and a 1px
  `--harmo-color-border` line on its end edge.
- A link: a 20px icon and its 14px label, 12px apart, with 8px of padding,
  in `--harmo-color-text-secondary`; on hover, the hover background. The
  page you're on is in `--harmo-color-primary`, medium weight, with the
  primary tint on hover. A count is a pill at the link's end, in the same
  `--harmo-color-primary`, with its digits in `--harmo-color-background`,
  which reads on it in light and dark.
- A group's label: 12px `--harmo-color-text-tertiary`, with 24px between
  groups.
- A group of links: a link's row, with an Expand Chevron at its end that
  folds up while it's open; its links open under it, lined up with the
  labels above, growing in 200ms and shrinking in 150ms, as an
  [Accordion](accordion.md) item does. Each group opens and closes on its
  own, or, sharing a `name`, one at a time. Closed, or collapsed, a group
  holding the page you're on shows it on its own row.
- The toggle: a short line halfway down, 8px past the edge. On hover or
  keyboard focus, in 150ms, the edge moves 8px toward where the sidebar
  would go, and the line bends into a chevron pointing that way: expanded,
  its tip comes to where the edge was; collapsed, the button moves 8px
  further out. Its tooltip, just past the chevron, says what it does.
- Collapsed: 60px wide, and 8px of padding at the sides; the width changes
  in 200ms (`--harmo-ease-out-cubic`). The icons alone, centered; hovering
  or focusing one shows its tooltip at once, 12px past its row, so 4px clear
  of the edge. A count is a 10px dot on its icon, in the same color. A
  group's links open beside its icon, at once, in a panel the same distance
  out, with the group's name at its top, one group at a time, or upward
  where there's no room below. The panel is fixed to the window and
  anchored to its icon, as the tooltips are, so the nav can scroll without
  cutting it off, and it follows its icon. The 12px before it belong to it,
  so the pointer crosses to the links without leaving the group. Group
  labels are hidden.
- Reduced motion: it collapses and expands at once, and the toggle and its
  groups don't move.
- On a right-to-left page, the edge, the toggle, the tooltips, and the
  panels mirror.

## Accessibility

- The nav is a landmark, named by its `aria-label`. A group's list is named
  by its label.
- Collapsed, the labels are hidden from view but stay in the page, so each
  link keeps its name; the tooltips show them, and are hidden from screen
  readers, which already read the name.
- The toggle is a button, named by its tooltip, "Collapse" or "Expand", and
  `aria-expanded` says whether the sidebar is expanded.
- A group of links is a `<details>`: its summary is reachable with Tab and
  opens with Enter or Space, and screen readers hear whether it's expanded.
- Collapsed, a group's links open beside its icon by a click, Enter, or
  Space, and by hovering with a mouse, until the pointer leaves the group
  and its links, unless focus is inside; Tab moves into them. Escape closes
  them from anywhere, returning focus to the group's icon if it was inside,
  and leaving it where it was otherwise; so does a press elsewhere, focus
  moving out, or picking a link. Opening one group closes another.
- The heading at the top of a collapsed group's panel repeats the group's
  name for sight only, so it's hidden from screen readers.

## What a script does

| Change | When |
| --- | --- |
| Toggle `data-collapsed` on `.hsidebar`, `aria-expanded` on the toggle, and its tooltip's text | On a click of the toggle |
| Close any group that's open | When the sidebar becomes collapsed, by the toggle or by your app |
| Collapsed, open a group, and close it again | When a mouse comes over its icon, and when it leaves the group and its links, unless a click has kept it open or focus is inside |
| Collapsed, close any other open group | When a group opens |
| Collapsed, close an open group | On Escape, anywhere, which returns focus to its summary if it was inside; on a press outside it; when focus moves out of it; and when a link in it is picked |

`examples/html/src/scripts/sidebar.js` is an example script for it, with
`tooltip.js` for the tooltips' Escape. Opening and closing a group while the
sidebar is expanded needs no script. Your app keeps whether it's collapsed,
such as in local storage, and sets it on a narrow screen.

## React

`<Sidebar>` renders the sidebar, the toggle when it's given both labels, and
the nav around its children: `<SidebarGroup>`s holding `<SidebarItem>`s and
`<SidebarSub>`s. It does all of the above.

| Prop | Effect |
| --- | --- |
| `aria-label` on `Sidebar` | Required: the nav's name, such as "Main" |
| `exclusive` | One group of links open at a time: its groups share a generated `name` |
| `collapsed`, `defaultCollapsed`, `onCollapsedChange` | Collapsed, held by you or from the start, and told when the toggle changes it |
| `collapseLabel`, `expandLabel` | The toggle's names, in your app's language, such as "Collapse" and "Expand"; without both, there's no toggle |
| `header`, `footer` | What goes above and below the nav |
| `label` on `SidebarGroup` | The group's label; without one, it has none |
| `href`, `icon`, `badge`, `current` on `SidebarItem` | Where it goes, its icon, a count, and whether it's the page you're on; it renders with your router's link through `HarmoProvider`. Inside a `SidebarSub`, it's one of the group's links, with no icon |
| `label`, `icon`, `defaultOpen`, `open` on `SidebarSub` | A group of links: its name, its icon, and whether it's open from the start, or now. As a `<details>` does, it also opens and closes itself, by a click, a hover while collapsed, or another group opening, so `open` isn't strictly held by you |
| `onOpenChange` on `SidebarSub` | Called with whether it's open, after each opening or closing of the group |
| `hidden` on `SidebarItem` or `SidebarSub` | Hides the whole item, its `<li>` |

```tsx
<Sidebar
  aria-label="Main"
  collapseLabel="Collapse"
  expandLabel="Expand"
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
  footer={
    <SidebarGroup>
      <SidebarItem href="/settings" icon={<SettingsIcon className="hicon" />}>
        Settings
      </SidebarItem>
    </SidebarGroup>
  }
>
  <SidebarGroup label="Tools">
    <SidebarItem href="/tickets" icon={<TicketsIcon className="hicon" />} current>
      Tickets
    </SidebarItem>
    <SidebarSub label="Campaigns" icon={<CampaignsIcon className="hicon" />}>
      <SidebarItem href="/campaigns/runs">Runs</SidebarItem>
      <SidebarItem href="/campaigns/templates">Templates</SidebarItem>
    </SidebarSub>
  </SidebarGroup>
</Sidebar>
```

## Tokens

`--harmo-border-radius`, `--harmo-border-radius-full`,
`--harmo-border-radius-sm`, `--harmo-box-shadow-sm`,
`--harmo-color-background`, `--harmo-color-background-hover`,
`--harmo-color-border`, `--harmo-color-primary`, `--harmo-color-primary-tint`,
`--harmo-color-text-secondary`, `--harmo-color-text-tertiary`,
`--harmo-duration-fast`, `--harmo-duration-normal`, `--harmo-ease-out-cubic`,
`--harmo-focus-outline`, `--harmo-font-family`, `--harmo-font-size-2xs`,
`--harmo-font-size-3xs`, `--harmo-font-size-sm`, `--harmo-font-weight-bold`,
`--harmo-font-weight-medium`, `--harmo-font-weight-normal`,
`--harmo-icon-color`; and those of Tooltip and Expand Chevron.
