# Footers

The foot of the page, ready to copy into your app. There are three, one for
each kind of page:

| Use case | React | What it is |
| --- | --- | --- |
| A site | `SiteFooter` | The logo and a line about the site; groups of links, such as Shop, Company, Legal, and Social, which fold on a phone; and the copyright, the address, and a Language Picker of regions |
| A site with a newsletter | `NewsletterFooter` | The same, with an email field and Subscribe beside the links |
| A sign-in page or an app | `SimpleFooter` | The copyright and a few small links, in one row |

Each is a Harmo [Footer](../components/footer.md), whose groups sit side by
side, and fold, as an Accordion's items do, where it's 640px wide or less.

## Try the demo

| Footer | Try | You see |
| --- | --- | --- |
| Site | Press a Social link | It opens in a new tab |
| Site | Choose a region and language, at the bottom row's end | The Language Picker shows both, such as "Germany (Deutsch)" |
| Site on a phone | Press a group's heading | Its links open under it; press it again to close them |
| Newsletter | Press Subscribe with the field empty, or with "anna" | It says what's wrong under the field, which takes focus |
| Newsletter | Subscribe with taken@example.com | "That address is already subscribed." under the field |
| Newsletter | Subscribe with any other address | The button shows it's working; then the field empties, and "Subscribed." shows under the form |
| Simple | Narrow the window | Its row wraps |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript |
| HTML | Harmo's CSS, and the components' scripts, as [HTML](#html) says |
| Your app | Its logo and links; for the newsletter, a call that adds an address to your mailing list |

## React

### Install

```sh
npx harmo-ui add footers
```

It copies into `components/harmo/patterns/`:

- `footers/`, the three footers, and `footers.css`, which lays out the
  newsletter's sign-up.
- `form-action/`, whose email check the newsletter shares with the other
  patterns' forms.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. Delete the footers you don't need. Without the CLI, copy the
same files from [examples/react/src/patterns](../../examples/react/src/patterns),
and set them up as [Patterns](README.md#install) says.

### Use it

Put the footer last in your page's layout.

```tsx
<SiteFooter
  logo={<><img src="/logo.svg" alt="" width={20} height={20} />Speedwagon</>}
  description="Fresh produce, delivered the morning after it's picked."
  language={<LanguagePicker aria-label="Region and language" side="top" value={locale} onValueChange={setLocale} languages={regions} />}
  groups={[
    { label: "Shop", links: [{ label: "This week's offers", href: "/offers" }] },
    {
      label: "Social",
      links: [{ label: "Instagram", href: "https://instagram.com/…", icon: <InstagramIcon className="hicon" />, target: "_blank", rel: "noreferrer" }],
    },
  ]}
  copyright="© 2026 Speedwagon Ltd."
  address="1 Joestar Lane, Morioh"
/>
```

A group is `{ label, links }`; a link is `{ label, href, icon? }`, and any of
a link's props, such as `target` for one that opens in a new tab.

```tsx
<NewsletterFooter
  logo={logo}
  title="Fresh picks, every Friday"
  description="What's in season, and a recipe for it."
  onSubscribe={async (email) => {
    const response = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
    if (response.status === 409) return "That address is already subscribed.";
  }}
  groups={groups}
  copyright="© 2026 Speedwagon Ltd."
  links={[{ label: "Privacy", href: "/privacy" }]}
/>
```

`onSubscribe` gets the address, already checked to look like one, and
returns nothing once it's added, or a message to show under the field. One
that throws says "Something went wrong. Try again."

```tsx
<SimpleFooter copyright="© 2026 Speedwagon Ltd." links={[{ label: "Privacy", href: "/privacy" }]} />
```

### Props

| `SiteFooter` | Effect |
| --- | --- |
| `logo` | Required. What the home link shows: your logo and name |
| `homeHref` | The home link's address: `"/"` by default |
| `description` | A line under the logo |
| `language` | At the bottom row's end: a [Language Picker](../components/language-picker.md), with regions or without, and `side="top"`, so it opens above |
| `groups` | Required. The groups of links |
| `copyright` | Required. The bottom row's first line |
| `address` | The bottom row's `<address>` |

| `NewsletterFooter` | Effect |
| --- | --- |
| `logo`, `homeHref`, `groups`, `copyright` | As `SiteFooter`'s |
| `title`, `description` | Required, and optional: over the field |
| `onSubscribe` | Required. Adds the address to your list, as [Use it](#use-it) says |
| `links` | Required. The bottom row's small links, such as Privacy |

| `SimpleFooter` | Effect |
| --- | --- |
| `copyright` | Required |
| `links` | Required. Its small links |

### Without JavaScript

Before a script runs, each footer shows, its groups side by side with their
links, and its links work. On a phone, each group folds and opens with no
script, as a `<details>`. The newsletter's form waits for the script.

## HTML

### Markup

The playground shows each footer's whole markup; these are its parts.

```html
<footer class="hfooter hsite-footer">
  <div class="hfooter-main">
    <div class="hfooter-brand">
      <a href="/">…Speedwagon</a>
      <p>Fresh produce, delivered the morning after it's picked.</p>
    </div>
    <nav class="hfooter-groups" aria-label="Footer">
      <details class="hfooter-group">…Shop…</details>
    </nav>
  </div>
  <div class="hfooter-bottom">
    <p>© 2026 Speedwagon Ltd.</p>
    <address>1 Joestar Lane, Morioh</address>
    …a Language Picker…
  </div>
</footer>
```

The newsletter's sign-up goes in the brand, under the logo:

```html
<div class="hnewsletter-footer-signup">
  <p class="hnewsletter-footer-title">Fresh picks, every Friday</p>
  <form class="hnewsletter-footer-form" novalidate>
    <div class="hfield">…Email, its input, and its error…</div>
    <button class="hbutton" type="submit"><span class="hbutton-label">Subscribe</span></button>
  </form>
  <p class="hnewsletter-footer-status" role="status"></p>
</div>
```

### Built with

| Part | Harmo component |
| --- | --- |
| The footer, its groups, and how they fold | [Footer](../components/footer.md) |
| The language | [Language Picker](../components/language-picker.md) |
| The newsletter's sign-up | [Field](../components/field.md), [Input](../components/input.md), [Button](../components/button.md) |

The newsletter's layout is the pattern's own, in `footers.css`.

### Classes

The pattern's own, in `footers.css`:

| Class | What it's for |
| --- | --- |
| `.hsite-footer` on the Footer | A site's |
| `.hnewsletter-footer` on the Footer | One with a newsletter sign-up |
| `.hnewsletter-footer-signup` | The sign-up, under the logo, at most 384px wide |
| `.hnewsletter-footer-title` | Its title, in the text's color |
| `.hnewsletter-footer-form` | The field and Subscribe in a row |
| `.hnewsletter-footer-status` | What it says once someone has subscribed: a status, there from the start |
| `.hsimple-footer` on the Footer | A sign-in page's or an app's |

### What your script does

The components' example scripts do most of it, as their docs say:
`footer.js` keeps the groups open while they're side by side;
`language-picker.js` the Language Picker.

[footers.js](../../examples/html/src/scripts/footers.js) is an example of the
rest:

- **Subscribe** checks the address: empty or malformed, it says so in the
  field's error, with `aria-invalid` on the input, which takes focus.
  Otherwise the button shows it's working, `aria-busy` and a spinner, while
  your app adds the address; its message goes in the field's error, or, once
  subscribed, the field is emptied and the status says so. Typing takes the
  error away.

## Customize

- **Words**: they're written in, in English, such as "Email", "Subscribe",
  and "Legal". Change them in your copy, or put your app's translation calls
  in their place.
- **Groups**: as many as you have; side by side, each takes at least 128px,
  and they wrap under the logo where there's no room.
- **Where they fold**: at 40rem, in the Footer's container queries.
- **The look**: the Footer's `--hfooter-width`, set on `.hfooter`.

## Accessibility

- Each footer is the page's contentinfo landmark. Its groups are a
  navigation named "Footer"; the bottom row's small links, "Legal".
- Each group's heading is an `<h2>`, at every width. Side by side, the
  groups are open, their summaries out of the Tab order; folded, each
  summary opens its group, and says whether it's open.
- A Social link that opens a new tab has `target="_blank"` and
  `rel="noreferrer"`; its name is the network's, with its icon hidden.
- The newsletter's field has its label, Email, and its error, which a
  screen reader hears as it changes; "Subscribed." is a status, there from
  the start, so it's heard as it's filled in.

## Design details

The [Footer](../components/footer.md)'s docs give its own. The pattern adds:

- **Site:** under the logo, 16px apart, the line about the site; four
  groups, Social's links with 16px icons; in the bottom row, the copyright
  and the address, and at its end the Language Picker, as small print, the
  region before the language; its panel opens above it, its five regions in
  two columns.
- **Newsletter:** under the logo, at most 384px wide, its title, 14px medium
  in `--harmo-color-text`, and its line, 6px apart; 10px under them, the
  field and Subscribe in a row, 6px apart, Subscribe level with the input;
  then, once subscribed, the status in `--harmo-color-success`.
- **Simple:** the bottom row alone: the copyright and its links, 16px apart.
