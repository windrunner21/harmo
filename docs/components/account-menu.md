# Account Menu

Who's signed in, with their avatar and a line under their name, such as the
account they're in or their email, as a button that opens a
[Dropdown Menu](dropdown-menu.md) of what's theirs: their settings, the
accounts they can switch to, and signing out. It goes at the top of a
[Sidebar](sidebar.md), which, collapsed, shows it as the avatar alone. With
`profile`, the menu starts with who's signed in again, as on an account
page; with many accounts, put them in a submenu, as
[Many accounts](#many-accounts) says.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `account-menu.css`, `dropdown-menu.css`, `popup.css`, `avatar.css`, `expand-chevron.css` |
| Element | `<button class="haccount-menu" type="button">`, the trigger of a [Dropdown Menu](dropdown-menu.md) |
| Parts | In the button: an [Avatar](avatar.md), `.havatar`; `.haccount-menu-text` holding `.haccount-menu-name` and an optional `.haccount-menu-description`; an [Expand Chevron](expand-chevron.md). Then the Dropdown Menu it opens, which can start with `<div class="haccount-menu-profile" role="presentation">`, the avatar, `.haccount-menu-name`, and `.haccount-menu-description` again, and a separator |
| Required | A Dropdown Menu trigger's: an `id`, `aria-haspopup="menu"`, `aria-expanded`, `popovertarget`, and its anchor name; `alt=""` on a photo, or `aria-hidden="true"` on initials, as the name says who it is |
| Unique | Every id, and each anchor name |
| Script | The [Dropdown Menu](dropdown-menu.md)'s, and the [Popup](popup.md)'s; none of its own |

## Markup

```html
<button class="haccount-menu" type="button" id="account-trigger" aria-haspopup="menu"
  aria-expanded="false" popovertarget="account-menu" style="anchor-name: --account-menu">
  <img class="havatar" src="/avatars/imran.webp" alt="" />
  <span class="haccount-menu-text">
    <span class="haccount-menu-name">Imran Hajiyev</span>
    <span class="haccount-menu-description">Speedwagon</span>
  </span>
  …an Expand Chevron…
</button>

<div class="hpopup hdropdown-menu" id="account-menu" role="menu" tabindex="-1"
  aria-labelledby="account-trigger" popover style="position-anchor: --account-menu">
  <a class="hdropdown-menu-item" href="/settings" role="menuitem" tabindex="-1">Settings</a>
  <div class="hdropdown-menu-separator" role="separator"></div>
  <div role="group" aria-labelledby="account-switch">
    <div class="hdropdown-menu-group-label" id="account-switch" role="presentation">Switch account</div>
    <a class="hdropdown-menu-item" href="/accounts/joestar-group" role="menuitem" tabindex="-1">Joestar Group</a>
  </div>
  <div class="hdropdown-menu-separator" role="separator"></div>
  <a class="hdropdown-menu-item" href="/sign-out" role="menuitem" tabindex="-1">Sign out</a>
</div>
```

The menu is a [Dropdown Menu](dropdown-menu.md), with its items, groups,
and separators. As wide as what it's in, the button fills it; the menu opens
under it, at least as wide.

With `profile`, the menu starts with who's signed in again, then a
separator:

```html
<div class="haccount-menu-profile" role="presentation">
  <img class="havatar" src="/avatars/imran.webp" alt="" />
  <span class="haccount-menu-name">Imran Hajiyev</span>
  <span class="haccount-menu-description">Speedwagon</span>
</div>
<div class="hdropdown-menu-separator" role="separator"></div>
```

### Many accounts

A few accounts can go in the menu, in a group, as above. Many would push
Sign out down past them, so put them in a submenu, Other accounts, beside
the menu: at most 400px tall, as a Popup is, it scrolls past that, with an
arrow at the end that has more, as a Select's list has; typing a letter in
it goes to the next account that starts with it.

```html
…Settings…
<button class="hdropdown-menu-item" type="button" role="menuitem" tabindex="-1" id="accounts-other-trigger"
  aria-haspopup="menu" aria-expanded="false" popovertarget="accounts-other" popovertargetaction="show"
  style="anchor-name: --accounts-other">
  …icon…Other accounts…a Chevron…
</button>
<div class="hpopup hdropdown-menu" id="accounts-other" role="menu" tabindex="-1"
  aria-labelledby="accounts-other-trigger" popover style="position-anchor: --accounts-other">
  …an item for each account…
</div>
```

For hundreds of accounts, a search does better: a
[Command Menu](command-menu.md) opened from an item such as Switch account.

## Appearance and states

- A row as wide as what it's in, 6px in, with an 8px radius: a 32px avatar,
  then, 10px from it, the name in 14px medium `--harmo-color-text` over the
  line under it in 12px `--harmo-color-text-secondary`, each on one line and
  cut short with an ellipsis, then the Expand Chevron in
  `--harmo-color-text-secondary`.
- Pointed at, and while its menu is open, it takes
  `--harmo-color-background-hover`. Focus: the standard ring, without an
  offset, as a Sidebar's links have.
- Open, its chevron turns up, as an Expand Chevron does beside
  `aria-expanded="true"`.
- With `profile`, the menu starts with who's signed in, in the middle: a
  40px avatar, 10px over the name in 15px `--harmo-color-text` and the line
  under it in 13px, each cut short with an ellipsis, 16px from the menu's
  top and 10px from its sides, then a separator.
- In a collapsed [Sidebar](sidebar.md), its text and chevron fade as the
  Sidebar's labels do, quickly as it narrows and back as it finishes
  widening, leaving the avatar in the middle of the 60px rail. Faded, they
  still name the button.

## Accessibility

- The button is named by its text: the name and the line under it, which
  stay, faded, in a collapsed Sidebar. The avatar beside them is hidden, a
  photo with `alt=""` or initials with `aria-hidden="true"`, so the name
  isn't said twice.
- The menu is named by the button, and its keys are a
  [Dropdown Menu](dropdown-menu.md)'s.
- It takes no [Tooltip](tooltip.md) in a collapsed Sidebar: a tooltip would
  cover the menu it opens, as on any Popup's trigger.
- The profile at the top of the menu is `role="presentation"`, as it says
  again who the button already names: the arrow keys pass it by.

## React

`<AccountMenu>` renders the button and a
[Dropdown Menu](dropdown-menu.md) holding its children, the menu's items.
Other props are the button's.

| Prop | Effect |
| --- | --- |
| `name` | Required. Who's signed in |
| `description` | The line under the name, such as the account they're in or their email |
| `avatar` | Required. An [Avatar](avatar.md), with `alt=""` |
| `profile` | Starts the menu with who's signed in: the avatar, name, and description again, then a separator |
| `align` | The menu's, `"start"` or `"end"` |
| `children` | The menu's `DropdownMenuItem`s, `DropdownMenuGroup`s, and `DropdownMenuSeparator`s |

```tsx
<Sidebar
  aria-label="Main"
  header={
    <AccountMenu name="Imran Hajiyev" description="Speedwagon" avatar={<Avatar src={photo} alt="" />}>
      <DropdownMenuItem href="/settings" icon={<SettingsIcon className="hicon" />}>
        Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuGroup label="Switch account">
        {otherAccounts.map((account) => (
          <DropdownMenuItem key={account.id} href={`/${account.id}`}>
            {account.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
    </AccountMenu>
  }
>
  …
</Sidebar>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background-hover`,
`--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-duration-fast`, `--harmo-duration-faster`, `--harmo-focus-outline`,
`--harmo-font-size-2xs`, `--harmo-font-size-md`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-space-sm`,
`--harmo-font-weight-medium`, `--harmo-space-2xs`, `--harmo-space-xs`; and
the [Dropdown Menu](dropdown-menu.md)'s.
