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
| Required | `aria-label` on the nav, such as "Main"; on the toggle's button, `aria-labelledby` naming its tooltip, whose text says what pressing it does, such as "Collapse" or "Expand", in your app's language |
| Unique | Every id |
| Script | For the toggle and the groups of links while collapsed; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hsidebar">
  <span class="htooltip-trigger hsidebar-toggle">
    <button class="hsidebar-toggle-button" type="button" aria-labelledby="main-sidebar-toggle">
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
such as a group of links, or an [Account Menu](account-menu.md), who's
signed in, which a collapsed sidebar shows as their avatar. To hide a link or a
group of links, put `hidden` on its `<li>`, so the list leaves no gap.

## Options

| Hook | Effect |
| --- | --- |
| `aria-current="page"` on a link | The page you're on |
| `aria-current="true"` on a link | A section you're in, such as Blog while you read a post under it: it looks as the page you're on does |
| `.hsidebar-badge` in a link | A count, such as "3"; name the link with it in words, such as `aria-label="Messages 3 unread"`, which keeps the visible "Messages 3" in its name |
| `open` on a group of links | Open, such as the group holding the page you're on |
| One `name` on a sidebar's groups of links | One group open at a time: opening one closes the one that was open. Without it, each opens and closes on its own |
| `data-collapsed` on `.hsidebar` | Collapsed to its icons |
| `--hsidebar-inline-size`, `--hsidebar-collapsed-inline-size` | Its width, 15rem, and collapsed, 60px |
| `--hsidebar-color-background` | Its background, `--harmo-color-background`, which a collapsed count's ring also takes: set this rather than `background-color`, so the two match |
| `.hsidebar` in a `.hdrawer-body` | Fills the [Drawer](drawer.md), with no edge of its own; leave out the toggle |

## Appearance and states

- 15rem wide, with `--harmo-space-sm` (16px) of padding, as far between
  its header, nav, and footer, a background of `--hsidebar-color-background`,
  and a 1px `--harmo-color-border` line on its end edge.
- A link: a 20px (1.25rem) icon and its 14px label, `--harmo-space-xs`
  (10px) apart, with 8px of padding,
  in `--harmo-color-text-secondary`; on hover, the hover background. The
  page you're on is in `--harmo-color-primary`, medium weight, with the
  primary tint on hover. A count is a pill at the link's end, in the same
  `--harmo-color-primary`, with its digits in `--harmo-color-background`,
  which reads on it in light and dark, and `--harmo-space-2xs` (6px) either
  side of them.
- A group's label: 12px `--harmo-color-text-tertiary`, 6px
  (`--harmo-space-2xs`) above its links,
  with `--harmo-space-md` (26px) between groups.
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
- Collapsed: 60px wide, and 8px of padding at the sides. The icons alone,
  centered. Hovering or focusing one shows its tooltip at once, without a
  fade, so two never overlap, `--harmo-space-xs` (10px) past its row, so 2px clear of the edge. A count
  is a 10px dot on its icon, in the same color. A
  group's links open beside its icon, at once, in a panel the same distance
  out, with the group's name at its top, one group at a time, or upward
  where there's no room below. The panel is fixed to the window and
  anchored to its icon, as the tooltips are, so the nav can scroll without
  cutting it off, and it follows its icon. The room before it belongs to it,
  so the pointer crosses to the links without leaving the group. Group
  labels are hidden, and take no room, but still name their lists.
- Collapsing and expanding, its width glides over 200ms
  (`--harmo-duration-normal`), on `--harmo-ease-in-out-cubic`, the curve for
  things moving on screen, and the page beside it moves with it. The icons
  stay where they are, but for the 4px between where they rest expanded and
  collapsed, which they slide. The labels and chevrons, clipped by their rows,
  fade out in 100ms (`--harmo-duration-faster`) as it narrows, and back in over
  150ms once it has widened most of the way (after 100ms); faded, a label still
  names its link. Each group label's room closes or opens with the width, its
  text fading as the labels do, so the rows below glide. Counts become dots.
  Changed midway, it turns around from where it had got to. All of it is CSS.
- Reduced motion: it collapses and expands at once, and the toggle and its
  groups don't move.
- On a right-to-left page, the edge, the toggle, the tooltips, and the
  panels mirror.
- Forced colors (Windows contrast themes): the edge is drawn in `CanvasText`,
  as backgrounds are removed, and a collapsed count's dot in `Highlight`.

## Accessibility

- The nav is a landmark, named by its `aria-label`. A group's list is named
  by its label.
- Collapsed, the labels are hidden from view but stay in the page, so each
  link keeps its name; the tooltips show them, and are hidden from screen
  readers, which already read the name.
- The toggle is a button, named by its tooltip with what pressing it does,
  "Collapse" or "Expand", so a screen reader hears "Collapse, button". It has
  no `aria-expanded`, which would say the state a second time, in the
  opposite word: "Collapse, expanded".
- A group of links is a `<details>`: its summary is reachable with Tab and
  opens with Enter or Space, and screen readers hear whether it's expanded.
- Collapsed, a group's links open beside its icon by a click, Enter, or
  Space, and by hovering with a mouse, until the pointer leaves the group
  and its links, unless focus is inside; Tab moves into them. Escape closes
  them from anywhere, returning focus to the group's icon if it was inside,
  and leaving it where it was otherwise, unless it's pressed in a dialog or a
  popup over the sidebar; so does a press elsewhere, focus moving out, or
  picking a link, which returns focus to the group's icon if it was in its
  links. Opening one group closes another, and while focus is in a group's
  links, hovering another icon doesn't open it, so focus isn't left in a
  closed group.
- The heading at the top of a collapsed group's panel repeats the group's
  name for sight only, so it's hidden from screen readers.

## What a script does

| Change | When |
| --- | --- |
| Toggle `data-collapsed` on `.hsidebar`, and its tooltip's text | On a click of the toggle |
| Close any group that's open | When the sidebar becomes collapsed, by the toggle or by your app |
| Collapsed, open a group, and close it again | When a mouse comes over its icon, unless focus is in another open group's links; and when it leaves the group and its links, unless a click has kept it open or focus is inside |
| Collapsed, close any other open group | When a group opens |
| Collapsed, close an open group | On Escape, anywhere but in a dialog or a popup over the sidebar, which returns focus to its summary if it was inside; on a press outside it; when focus moves out of it; and when a link in it is picked, which returns focus to its summary if it was in its links |

`examples/html/src/scripts/sidebar.js` is an example script for it, with
`tooltip.js` for the tooltips' Escape. Opening and closing a group while the
sidebar is expanded needs no script. Your app keeps whether it's collapsed,
such as in local storage, and sets it on a narrow screen.

## React

`<Sidebar>` renders the sidebar, the toggle when it's given both labels, and
the nav around its children: `<SidebarGroup>`s holding `<SidebarItem>`s and
`<SidebarSub>`s, whose links are `<SidebarSubItem>`s. It does all of the
above.

| Prop | Effect |
| --- | --- |
| `aria-label` on `Sidebar` | Required: the nav's name, such as "Main" |
| `exclusive` | One group of links open at a time: its groups, in the header and footer too, share a generated `name` |
| `collapsed`, `defaultCollapsed`, `onCollapsedChange` | Collapsed, held by you or from the start, and told when the toggle changes it |
| `collapseLabel`, `expandLabel` | The toggle's names, what pressing it does, in your app's language, such as "Collapse" and "Expand"; without both, there's no toggle |
| `header`, `footer` | What goes above and below the nav |
| `label` on `SidebarGroup` | The group's label; without one, it has none |
| `href`, `icon`, `badge`, `current` on `SidebarItem` | Where it goes, its icon, a count, and whether it's the page you're on; it renders with your router's link through `HarmoProvider` |
| `label`, `icon`, `defaultOpen`, `open` on `SidebarSub` | A group of links: its name, its icon, and whether it's open from the start, or now. As a `<details>` does, it also opens and closes itself, by a click, a hover while collapsed, or another group opening, so `open` isn't strictly held by you |
| `onOpenChange` on `SidebarSub` | Called with whether it's open, after each opening or closing of the group |
| `href`, `current` on `SidebarSubItem` | One of a `SidebarSub`'s links: where it goes, and whether it's the page you're on, through your router's link. It's text only, so it takes no `icon` or `badge`. A `SidebarItem` there renders as one too, without its icon and count |
| `hidden` on `SidebarItem`, `SidebarSubItem`, or `SidebarSub` | Hides the whole item, its `<li>` |

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
      <SidebarSubItem href="/campaigns/runs">Runs</SidebarSubItem>
      <SidebarSubItem href="/campaigns/templates">Templates</SidebarSubItem>
    </SidebarSub>
  </SidebarGroup>
</Sidebar>
```

### The page you're on, in Next.js

`current` is your app's to say. A root layout is a Server Component, which
doesn't know the path, so read it in a small Client Component with
`usePathname()`, and put that in the layout. `current` marks the page you're
on, `aria-current="page"`. On a page under a link's section, such as a post
under Blog, give that link `aria-current="true"` instead: it looks the same,
and says it's the current one of the set, not the page itself. Compare paths
without a trailing slash, and a section by its start with a `/` after it, so
`/blogroll` isn't under Blog:

```tsx
"use client";

import { SidebarGroup, SidebarItem } from "@harmo-ui/react";
import { usePathname } from "next/navigation";

const at = (path: string, href: string) => (path.replace(/(.)\/$/, "$1")) === href;
const under = (path: string, href: string) => href !== "/" && path.startsWith(`${href}/`);

export function ToolsGroup() {
  const path = usePathname() ?? "";
  return (
    <SidebarGroup label="Tools">
      <SidebarItem
        href="/tickets"
        icon={<TicketsIcon className="hicon" />}
        current={at(path, "/tickets")}
        aria-current={under(path, "/tickets") ? "true" : undefined}
      >
        Tickets
      </SidebarItem>
      <SidebarItem
        href="/campaigns"
        icon={<CampaignsIcon className="hicon" />}
        current={at(path, "/campaigns")}
        aria-current={under(path, "/campaigns") ? "true" : undefined}
      >
        Campaigns
      </SidebarItem>
    </SidebarGroup>
  );
}
```

A `SidebarSubItem` takes `current` and `aria-current` the same way.

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
`--harmo-icon-color`, `--harmo-space-2xs`, `--harmo-space-xs`,
`--harmo-space-sm`, `--harmo-space-md`; and those of Tooltip and Expand
Chevron.
