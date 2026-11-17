# Badge

A count that asks to be looked at, such as unread messages or new
notifications, or a dot where there's something new without a number. On its
own, it sits in the line; in a [Button](button.md), on its top corner. For a
label that names a thing, such as a status or a category, use a
[Tag](tag.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `badge.css`; `button.css` on a Button |
| Element | `<span class="hbadge">` holding the count, or nothing with `data-dot` |
| Parts | None |
| Required | On a Button, `aria-hidden="true"` on the badge, and the count in the button's name, such as `aria-label="Messages, 3 unread"` |
| Unique | None |
| Script | None; changing the count, or adding the badge as it arrives, is your app's, see [What a script does](#what-a-script-does) |

## Markup

```html
<span class="hbadge">3</span>
```

On a Button, after its content:

```html
<button class="hbutton" data-variant="tertiary" type="button" aria-label="Messages, 3 unread">
  <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">…</svg>
  <span class="hbadge" aria-hidden="true">3</span>
</button>
```

## Options

| Hook | Effect |
| --- | --- |
| (default) | Red, `--harmo-color-danger-fill`: a count that asks to be looked at |
| `data-variant="accent"` | `--harmo-color-primary-fill`: quieter, a count that's information |
| `data-variant="neutral"` | Gray, `--harmo-color-background-active`, with `--harmo-color-text-secondary` |
| `data-dot` | An 8px dot, without a number: something new |
| `data-new` | It settles in, as it arrives. Leave it off a badge there as the page loads |
| `--hbadge-ring` | The ring around it on a Button: `--harmo-color-background` by default. Set it to what's behind the button, such as a Card's background |

## Appearance and states

- 20px tall, and at least as wide: a pill as the count grows, with 6px on each
  side. 12px semibold numbers, all the same width, so a count that changes
  doesn't jiggle, in `--harmo-color-on-primary`.
- On a Button, on its top corner at the end, 6px over the edge, with a 2px
  ring in the page's background, so it reads as on top. A dot sits inside the
  corner, 2px from it.
- With `data-new`, it settles in from 0.8 over 200ms (`--harmo-duration-normal`),
  easing out. With reduced motion, it only fades in.
- In forced-colors mode, it has a border in the text color.

## Accessibility

- On a Button, the badge is hidden from screen readers, and the button's name
  says the count, such as "Messages, 3 unread". Change the name as the count
  changes. A button with text must keep its text first in its name, with the
  count after it, as it's seen, such as "Inbox 12 unread", so someone who
  says what they see, with voice control, can press it. A screen reader that's elsewhere doesn't hear it; for a count that
  matters, such as a reply that's come, also put it in a polite live region.
- On its own, it's read as its number, so put it where that makes sense, such
  as after a tab's label, "Inbox 12", or name what it counts with
  `aria-label` on the badge.
- A dot has no text: say what it means in the name of what it's on.
- Red isn't the only thing that marks it: it's a shape with a number, and the
  name says what it is.

## What a script does

| Change | When |
| --- | --- |
| The count, and the name of the button it's on | As it changes |
| Add the badge with `data-new` | As the first of what it counts arrives |
| Remove it, or add `hidden` | When there's nothing left to count |

`examples/html/src/scripts/badge.js` is an example.

## React

`<Badge>` renders the span. On a Button, give the Button `badge`: a number
renders a Badge, hidden from screen readers; or pass your own Badge, such as a
neutral one. A badge added after the page has loaded settles in.

| Prop | Effect |
| --- | --- |
| `count` | The number. Over `max`, it's `max` and a plus, such as `99+` |
| `max` | `99` by default |
| `variant` | `"accent"` or `"neutral"`; red without it |
| `dot` | A dot, without a number |

```tsx
<Button variant="tertiary" aria-label={`Messages, ${unread} unread`} badge={unread || undefined}>
  <MessagesIcon className="hicon" />
</Button>

<Badge variant="neutral" count={12} />
```

## Tokens

`--harmo-border-radius-full`, `--harmo-color-background`,
`--harmo-color-background-active`, `--harmo-color-danger-fill`,
`--harmo-color-on-primary`, `--harmo-color-primary-fill`,
`--harmo-color-text-secondary`, `--harmo-duration-normal`,
`--harmo-ease-out-cubic`, `--harmo-font-family`, `--harmo-font-size-2xs`,
`--harmo-font-weight-semibold`
