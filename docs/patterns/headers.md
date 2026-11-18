# Headers

The bar across the top, ready to copy into your app. There are three, one for
each kind of page:

| Use case | React | What it is |
| --- | --- | --- |
| A site | `SiteHeader` | The logo, a menu whose sections open panels as you point at them, and actions such as Sign in; on a phone, a menu button that slides the menu and actions in under the bar |
| An app | `AppHeader` | Beside your app's sidebar: search at the start, its list opening under it; Help, notifications with an unread count, and Settings at the end, then a round Create |
| A sign-in page | `SimpleHeader` | The logo, home, and one action, such as a link for help |

Each is a Harmo [Header](../components/header.md), which stays at the top,
scrolls away, or moves away with the page as you scroll down and comes back
as you scroll up, as [Built with](#built-with) lists.

## Try the demo

| Header | Try | You see |
| --- | --- | --- |
| Site | Scroll the page down, then up | It's clear over the hero, then frosted; it moves away going down, and comes back going up |
| Site | Point at Shop, then Recipes | Each one's panel, a row for each link, the panel changing its size from one to the other |
| Site on a phone | Press the menu button | The menu slides in under the bar, the button turning into a close; Escape, or the close, slides it out |
| Site on a phone | Open Recipes in it | The menu, a bigger site's, scrolls on its own; Sign in and Order now stay at the foot |
| App | Press the search, or / where you aren't typing | Its list, under it: pages and recent items |
| App | Press the bell, then Mark all as read | The notifications; the unread lose their dot, and the bell its count |
| App | Press +, or focus it and press ↓ | What you can create, a menu aligned to the button's end; the arrows move through it |
| Simple | Scroll the page | It scrolls away |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript |
| HTML | Harmo's CSS, and the components' scripts, as [HTML](#html) says |
| Your app | Its logo and links; for an app's header, its search, notifications, and what can be created |

## React

### Install

```sh
npx harmo-ui add headers
```

It copies into `components/harmo/patterns/`:

- `headers/`, the three headers; `icons.tsx`, the bell, help, settings, and
  plus icons; and `headers.css`, which lays out what's in them.

It also copies the Harmo components they use, and adds the stylesheet to
`harmo.css`. Delete the headers you don't need. Without the CLI, copy the same
files from [examples/react/src/patterns](../../examples/react/src/patterns),
and set them up as [Patterns](README.md#install) says.

### Use it

Put the header first in your page's layout, outside what scrolls inside it.

```tsx
<SiteHeader
  logo={<><img src="/logo.svg" alt="" width={20} height={20} />Speedwagon</>}
  menu={[
    {
      label: "Shop",
      links: [
        { label: "This week's offers", description: "What's in season, for less", href: "/offers", icon: <OffersIcon className="hicon" /> },
        { label: "Delivery", description: "To your door, in a window you choose", href: "/delivery", icon: <DeliveryIcon className="hicon" /> },
      ],
    },
    { label: "Recipes", href: "/recipes" },
  ]}
  current="/recipes"
  actions={[
    { label: "Sign in", href: "/sign-in" },
    { label: "Order now", href: "/order", primary: true },
  ]}
  scroll="hide"
/>
```

A menu item is a link, `{ label, href }`, or a section, `{ label, links }`,
whose links open in a panel with an optional description and icon. `current`
is the href of the page you're on. An action is a link: tertiary in the bar
and secondary in the phone's menu, or with `primary`, the main one in both.

```tsx
<AppHeader
  search={<CommandMenu label="Search" placeholder="Search" shortcut={singleKeys ? { keys: "/", label: "/" } : undefined} onPick={go}>…</CommandMenu>}
  helpHref="/help"
  settingsHref="/settings"
  notifications={notifications}
  onMarkAllRead={markAllRead}
  create={[{ label: "Order", href: "/orders/new", icon: <OrderIcon className="hicon" /> }]}
/>
```

The search opens with <kbd>/</kbd>, as a search field always in view
usually does; `singleKeys` is your app's setting for keys alone, as
[Accessibility](#accessibility) says. What + lists is
`{ label, href, icon? }`: a word or two each, as it's already about
creating. A notification is
`{ id, title, detail?, time, href, unread?, avatar? }`,
`time` written as you show it, such as "2 minutes ago". With none, the panel
says "You're all caught up". The app header has no logo, as your sidebar
has it, and no account, which lives there too.

```tsx
<SimpleHeader logo={logo} action={<Link href="/help">Need help?</Link>} />
```

### Props

| `SiteHeader` | Effect |
| --- | --- |
| `logo` | Required. What the home link shows: your logo and name |
| `homeHref` | The home link's address: `"/"` by default |
| `menu` | Required. The links and sections |
| `actions` | Required. `{ label, href, primary? }`: at the end, and at the foot of the phone's menu |
| `current` | The href of the page you're on |
| `scroll`, `transparent` | The [Header](../components/header.md)'s: `"stay"` by default |

| `AppHeader` | Effect |
| --- | --- |
| `search` | Required. At the start: your Command Menu, its list opening under it |
| `helpHref`, `settingsHref` | Required. Where Help and Settings go |
| `notifications`, `onMarkAllRead` | Required, and the Mark all as read button |
| `create` | Required. What + lists: `{ label, href, icon? }`, each a link |
| `scroll` | The Header's |

| `SimpleHeader` | Effect |
| --- | --- |
| `logo`, `homeHref` | As `SiteHeader`'s |
| `action` | At the end |
| `scroll` | The Header's: `"away"` by default |

### Without JavaScript

Before a script runs, each header shows and its links work. What opens, the
panels, the phone's menu, the Popups, and the search, waits for the script;
give a site's sections a page of their own to link to where it matters.

## HTML

### Markup

The playground shows each header's whole markup; these are its parts.

```html
<header class="hheader hsite-header" data-scroll="hide">
  <div class="hheader-bar">
    <div class="hheader-brand"><a href="/">…Speedwagon</a></div>
    <nav class="hnavigation-menu" aria-label="Main">…</nav>
    <div class="hheader-actions">
      <div class="hsite-header-actions">…Sign in, Order now…</div>
      <button class="hbutton hmenu-button hsite-header-menu" data-variant="secondary" data-size="small" type="button"
        aria-label="Menu" aria-controls="site-menu" aria-expanded="false">…</button>
      <div class="hsite-header-panel" id="site-menu">
        <div class="hsite-header-panel-menu">
          <nav class="hnavigation-menu" aria-label="Main" data-orientation="vertical">…</nav>
        </div>
        <div class="hsite-header-panel-actions">…Sign in, Order now…</div>
      </div>
    </div>
  </div>
</header>
```

An app's header has the search at the start, and Popups at the end:

```html
<header class="hheader happ-header" data-bordered>
  <div class="hheader-bar">
    <div class="happ-header-search">…a Command Menu: its field, and its list in a popup…</div>
    <div class="hheader-actions">
      <a class="hbutton" data-variant="tertiary" href="/help" aria-label="Help">…</a>
      <button class="hbutton" data-variant="tertiary" type="button" aria-label="Notifications, 2 unread" popovertarget="notifications">
        …<span class="hbadge" data-variant="accent" aria-hidden="true">2</span>
      </button>
      <div class="hpopup happ-header-notifications" id="notifications" data-align="end" popover>…</div>
      <a class="hbutton" data-variant="tertiary" href="/settings" aria-label="Settings">…</a>
      <button class="hbutton happ-header-create" data-size="xsmall" data-shape="circle" type="button" id="create-trigger"
        aria-label="Create" aria-haspopup="menu" popovertarget="create">…</button>
      <div class="hpopup hdropdown-menu happ-header-create-menu" id="create" role="menu" tabindex="-1"
        aria-labelledby="create-trigger" data-align="end" popover>
        <a class="hdropdown-menu-item" href="/orders/new" role="menuitem" tabindex="-1">…icon…Order</a>
      </div>
    </div>
  </div>
</header>
```

### Built with

| Part | Harmo component |
| --- | --- |
| The bar, and how it scrolls | [Header](../components/header.md) |
| A site's menu | [Navigation Menu](../components/navigation-menu.md) |
| The menu button on a phone | [Menu Button](../components/menu-button.md) |
| An app's search | [Command Menu](../components/command-menu.md) |
| Notifications | [Popup](../components/popup.md), [Button](../components/button.md), [Badge](../components/badge.md), [Avatar](../components/avatar.md), [Empty State](../components/empty-state.md) |
| Create | [Button](../components/button.md), round and extra small, and [Dropdown Menu](../components/dropdown-menu.md) |

The phone's menu panel and the notifications' list are the pattern's own,
in `headers.css`.

### Classes

The pattern's own, in `headers.css`:

| Class | What it's for |
| --- | --- |
| `.hsite-header` on the Header | A site's: its menu and actions, or on a narrow page, its menu button |
| `.hsite-header-actions` | The actions, in the bar |
| `.hsite-header-menu` on a Menu Button | Shown on a page 640px wide or less, opening the panel it names in `aria-controls` |
| `.hsite-header-panel` with `data-open` | The phone's menu, under the bar, sliding in from the end |
| `--hsite-header-menu-height` | The panel's height: the window under the header, by default |
| `.hsite-header-panel-menu` | The menu, stacked, scrolling on its own when it's long |
| `.hsite-header-panel-actions` | The actions, side by side, at the panel's foot, over a line |
| `.happ-header` on the Header | An app's |
| `.happ-header-search` | The search, at the start; on a narrow page, without its shortcut |
| `.happ-header-create` on a Button | Create: a step apart from the icons |
| `.happ-header-create-menu` on a Dropdown Menu | What Create makes: its words in the accent color, its icons in the text's |
| `.happ-header-notifications` on a Popup, `-head`, `-title`, `-list` | The notifications: a title, Mark all as read, and the list |
| `.happ-header-notification`, `-text`, `-title`, `-detail`, `-time`; `data-unread` | A notification: a link, with an avatar, its words, and an unread dot |
| `.hsimple-header` on the Header | A sign-in page's |

### What your script does

The components' example scripts do most of it, as their docs say:
`header.js` follows the scrolling; `navigation-menu.js` opens the panels;
`popup.js` the Popups; `command-menu.js` the search, with `listbox.js` for
its list's keys; `dropdown-menu.js` Create's menu and its keys;
`menu-button.js` turns the Menu Button's `aria-expanded`.

[headers.js](../../examples/html/src/scripts/headers.js) is an example of the
rest:

- **The phone's menu** follows its Menu Button: `data-open` on the panel
  while the button's `aria-expanded` is `"true"`. Escape, on the button or in
  the panel, closes it and moves focus to the button; a link in it closes it,
  and so does focus moving on past it, as Tab does from its last action, so
  it never covers what has focus.
- **Mark all as read** takes `data-unread` off each notification, and its
  dot, and the bell's Badge, says "Notifications" in the bell's name, moves
  focus to the first notification, and removes itself.

## Customize

- **Words**: they're written in, in English, such as "Menu", "Help", and
  "Mark all as read". Change them in your copy, or put your app's translation
  calls in their place.
- **Icons**: the bell, help, settings, and plus are in `icons.tsx`. Use your
  app's own, with `className="hicon"` on each.
- **Where the menu moves**: the site header's menu goes into its panel, and
  the app's search leaves out its shortcut, at 40rem, in `headers.css`'s
  container queries.
  Change them to suit your menu's length.
- **The look**: the Header's `--hheader-width` and `--hheader-height`, set on
  `.hheader`.

## Accessibility

- Each header is the page's banner landmark. Its navigation is named
  "Main". Create's menu is named by its button, "Create", and its keys are
  a [Dropdown Menu](../components/dropdown-menu.md)'s.
- The icon buttons are named by `aria-label`: Help, Notifications with how
  many are unread, Settings, and Create. Popups don't take a Tooltip on their
  trigger, as it would cover what they open.
- An unread notification's dot is named "Unread", so it isn't only a color.
- The search's <kbd>/</kbd> is a key alone, which WCAG 2.1.4 asks people be
  able to turn off: give your app a setting, and leave `shortcut` out while
  it's off. Without one, use a key with
  a modifier, such as ⌘K:
  `{ keys: "Mod+K", label: { apple: "⌘K", other: "Ctrl K" } }`. Either way,
  the field shows it, and names it in `aria-keyshortcuts`.
- On a phone, the Menu Button says whether the menu is open with
  `aria-expanded`, and names it with `aria-controls`. The menu isn't modal:
  Escape closes it, and focus goes back to the button; Tab past its last
  action closes it too, so it never covers what has focus.
- Mark all as read, which goes once pressed, moves focus to the first
  notification, so the keyboard isn't left nowhere.
- While the phone's menu or a Popup is open, the header stays in view.
- Hidden as you scroll, a header stays in the Tab order: tabbing into it
  brings it back.

## Design details

The [Header](../components/header.md)'s docs give the bar's own. The pattern
adds:

- **Site:** the menu after the logo, 26px apart; the actions at the end, 6px
  apart, a tertiary Sign in and a primary Order now.
- **Site on a phone, 640px wide or less:** the logo and a secondary Menu
  Button, its bars turning into a close as the menu opens. The menu fills
  the window under the bar, on the page's background: the menu stacked,
  16px in, scrolling on its own when it's long; and at the foot, over a 1px
  line, the actions side by side, each as wide, 10px apart, 16px in, a
  secondary Sign in and a primary Order now, clear of a phone's home
  indicator. It slides in from the end in 200ms, eased out, and back in
  150ms; with reduced motion, it fades.
- **App:** its hairline from the start, `bordered`, where the sidebar's
  edge meets it. The search at the start, a field at most 384px wide, its list
  opening under it; at 640px or less, without its shortcut. At the end,
  tertiary icon Buttons, Help, Notifications, its count an accent Badge, and
  Settings, 6px apart; then, 12px from them, Create, a primary Button, a
  24px circle, which takes presses over 34px, as the icons beside it do.
  What opens from them is aligned to their buttons' end, with
  `align="end"`.
- **Create:** a Dropdown Menu of links, each a 20px icon in
  `--harmo-color-text` and a word in 14px `--harmo-color-primary`, the one
  with focus on `--harmo-color-background-hover`.
- **Notifications:** a Popup 352px wide: its title, 14px medium, and Mark all
  as read, a Link, over a 1px line; then each notification, a 32px avatar,
  its title in 14px, medium while unread, its detail in 13px
  `--harmo-color-text-secondary`, and its time in 12px
  `--harmo-color-text-tertiary`, each 6px apart, and an accent dot while
  unread, as the bell's count is.
  Pointed at, a notification takes `--harmo-color-background-hover`.
- **Simple:** the logo and its action; it scrolls away.
