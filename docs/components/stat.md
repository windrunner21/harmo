# Stat

A number to watch, such as the tickets that came in today: its label, how it
has changed, the number, and a caption saying what it covers, with a hint to
explain it and an action, such as a link to the tickets. It has no frame of
its own: in a `.hstat-group`, each Stat is a tile on a tray.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `stat.css`; `tooltip.css` for a hint; `link.css` for a link as its action |
| Element | `<div class="hstat">` |
| Parts | `.hstat-header`, holding `.hstat-title` (`.hstat-label`, a heading of the level that fits the page or a `<p>`, then optionally a hint) and optionally `.hstat-trend`; then `<p class="hstat-value">`, and optionally `<p class="hstat-caption">` and `.hstat-actions` |
| Required | A hint is a [Tooltip](tooltip.md) trigger around `<button class="hstat-hint" type="button">`, named by its `data-variant="hint"` tooltip with `aria-labelledby`. A trend with a hint is a `<button class="hstat-trend" type="button">` in a Tooltip trigger, described by it with `aria-describedby`. `aria-hidden="true"` and `focusable="false"` on the icons |
| Unique | Each tooltip's `id` |
| Script | Tooltip's, for Escape; and to pin a tooltip open on a press, for a touch screen; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hstat">
  <div class="hstat-header">
    <div class="hstat-title">
      <h3 class="hstat-label">Open tickets</h3>
      <span class="htooltip-trigger">
        <button class="hstat-hint" type="button" aria-labelledby="open-tickets-hint">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25ZM12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25Z" fill="currentColor" />
            <path d="M12 10.25C12.41 10.25 12.75 10.59 12.75 11V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V11C11.25 10.59 11.59 10.25 12 10.25Z" fill="currentColor" />
            <path d="M12 7C12.55 7 13 7.45 13 8C13 8.55 12.55 9 12 9C11.45 9 11 8.55 11 8C11 7.45 11.45 7 12 7Z" fill="currentColor" />
          </svg>
        </button>
        <span class="htooltip" role="tooltip" id="open-tickets-hint" data-side="top" data-variant="hint">Tickets that aren't closed yet, across every channel.</span>
      </span>
    </div>
    <span class="hstat-trend" data-direction="down">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M19.7167 17C19.3906 17 19.0644 16.8815 18.8069 16.6275L12.7124 10.6175L10.8412 13.394C10.6352 13.7157 10.2747 13.9188 9.897 13.9527C9.50215 13.9865 9.12446 13.8511 8.86695 13.5802L3.37339 8.16275C2.87554 7.6718 2.87554 6.85918 3.37339 6.36822C3.87124 5.87726 4.69528 5.87726 5.19313 6.36822L9.57082 10.6853L11.4421 7.90881C11.6481 7.60408 11.9914 7.40092 12.3863 7.35013C12.7811 7.31628 13.1588 7.45171 13.4163 7.72259L20.6266 14.833C21.1245 15.324 21.1245 16.1366 20.6266 16.6275C20.3691 16.8815 20.0429 17 19.7167 17Z" fill="currentColor" />
        <path d="M19.7143 17H16.2857C15.5829 17 15 16.4171 15 15.7143C15 15.0114 15.5829 14.4286 16.2857 14.4286H18.4286V12.2857C18.4286 11.5829 19.0114 11 19.7143 11C20.4171 11 21 11.5829 21 12.2857V15.7143C21 16.4171 20.4171 17 19.7143 17Z" fill="currentColor" />
      </svg>
      −8%
    </span>
  </div>
  <p class="hstat-value">37</p>
  <p class="hstat-caption">Compared to yesterday</p>
  <div class="hstat-actions">
    <a class="hlink" href="/tickets">View tickets</a>
  </div>
</div>
```

The trend going up draws this arrow instead:

```html
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
  <path d="M4.28326 17C3.95708 17 3.6309 16.8815 3.37339 16.6275C2.87554 16.1366 2.87554 15.324 3.37339 14.833L8.86695 9.41554C9.14163 9.14467 9.50215 9.00923 9.897 9.04309C10.2747 9.07695 10.618 9.28011 10.8412 9.60177L12.7124 12.3782L18.8069 6.36822C19.3047 5.87726 20.1288 5.87726 20.6266 6.36822C21.1245 6.85918 21.1245 7.6718 20.6266 8.16275L13.4163 15.2732C13.1416 15.5441 12.7811 15.6795 12.3863 15.6456C12.0086 15.6118 11.6652 15.4086 11.4421 15.087L9.57082 12.3105L5.19313 16.6275C4.93562 16.8815 4.60944 17 4.28326 17Z" fill="currentColor" />
  <path d="M19.7143 12C19.0114 12 18.4286 11.4171 18.4286 10.7143V8.57143H16.2857C15.5829 8.57143 15 7.98857 15 7.28571C15 6.58286 15.5829 6 16.2857 6H19.7143C20.4171 6 21 6.58286 21 7.28571V10.7143C21 11.4171 20.4171 12 19.7143 12Z" fill="currentColor" />
</svg>
```

Its text is your app's, such as "+12%" or "−8%". Format it with
`Intl.NumberFormat`, with `style: "percent"` and `signDisplay: "exceptZero"`:
in right-to-left languages, it adds the marks that keep the sign before the
number.

When the trend compares two periods, say which in a hint on it: it's then a
button for its tooltip.

```html
<span class="htooltip-trigger">
  <button class="hstat-trend" type="button" data-direction="up" aria-describedby="tickets-trend">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M4.28326 17C3.95708 17 3.6309 16.8815 3.37339 16.6275C2.87554 16.1366 2.87554 15.324 3.37339 14.833L8.86695 9.41554C9.14163 9.14467 9.50215 9.00923 9.897 9.04309C10.2747 9.07695 10.618 9.28011 10.8412 9.60177L12.7124 12.3782L18.8069 6.36822C19.3047 5.87726 20.1288 5.87726 20.6266 6.36822C21.1245 6.85918 21.1245 7.6718 20.6266 8.16275L13.4163 15.2732C13.1416 15.5441 12.7811 15.6795 12.3863 15.6456C12.0086 15.6118 11.6652 15.4086 11.4421 15.087L9.57082 12.3105L5.19313 16.6275C4.93562 16.8815 4.60944 17 4.28326 17Z" fill="currentColor" />
      <path d="M19.7143 12C19.0114 12 18.4286 11.4171 18.4286 10.7143V8.57143H16.2857C15.5829 8.57143 15 7.98857 15 7.28571C15 6.58286 15.5829 6 16.2857 6H19.7143C20.4171 6 21 6.58286 21 7.28571V10.7143C21 11.4171 20.4171 12 19.7143 12Z" fill="currentColor" />
    </svg>
    +12%
  </button>
  <span class="htooltip" role="tooltip" id="tickets-trend" data-side="top" data-variant="hint">Nov 1–7, 2026, compared with Oct 25–31, 2026.</span>
</span>
```

Several Stats go in a `.hstat-group`, a tray of tiles:

```html
<div class="hstat-group">
  <div class="hstat">…</div>
  <div class="hstat">…</div>
  <div class="hstat">…</div>
</div>
```

## Options

| Hook | Effect |
| --- | --- |
| `data-direction="up"` or `"down"` on `.hstat-trend` | Which way it changed. It looks the same both ways but for its arrow: color it from here where your app knows whether up is good |
| `.hstat-group` around Stats | Each is a tile on a tray, as many to a row as fit at 180px or wider |

## Appearance and states

- The label: 14px in `--harmo-color-text-secondary`. The hint: a 14px info
  icon in `--harmo-color-text`, 4px after the label, in a 24px button, the
  least WCAG asks of a target, that reaches past it without taking room.
- The trend: at the end of the row, 12px text and a 14px arrow in
  `--harmo-color-text`, in a 1px `--harmo-color-border` frame with the 8px
  corners, 8px from the title. Neutral, since whether up is good depends on
  the number: more open tickets is worse.
- The label wraps first. The trend moves onto a line of its own, still at
  the end, only when even the label's longest word, the hint, and the trend
  can't share one; text too long for its row wraps, and so does a word too
  long for the label's.
- The label's row is as tall as a trend, with one or without, so numbers
  side by side line up.
- The value: 20px in `--harmo-color-text`, 4px under the label. The caption:
  12px in `--harmo-color-text-secondary`, 4px under it. The action: 14px,
  16px under them.
- The hint's and the trend's tooltips are Tooltip's `hint` variant, above
  them.
- In a group: a `--harmo-color-background-secondary` tray with 24px corners
  and 16px padding, holding `--harmo-color-background` tiles with the 8px
  corners and 16px padding, 16px apart, as many to a row as fit at 180px or
  wider; one to a row on a phone. Each tile's parts share rows with its
  neighbors', so headers, numbers, captions, and actions line up across a
  row, whatever wraps and whichever parts a tile leaves out. The tray and
  the tiles have a transparent border, which forced-colors mode draws,
  where their backgrounds are gone.
- Right-to-left, the trend is at the left end of the row; the arrows don't
  mirror, since up and down read the same both ways.

## Accessibility

- The label is a heading, so someone moving through a page's headings finds
  each number; choose its level for where it is in the page, or a `<p>`.
- The hint is a real button, so it's reached with Tab, and its tooltip names
  it, so a screen reader reads the explanation.
- A trend with a hint is a button described by its tooltip, so the periods
  it compares are read after the change. Without one, it's text.
- The arrows are hidden from screen readers: the sign says which way.
- A tooltip shows on hover and keyboard focus; a press pins it open, for a
  touch screen; Escape hides it.
- Text comes from your app, in its language.

## What a script does

| Change | When |
| --- | --- |
| Tooltip's: hide the tooltip | On Escape |
| Add `data-open` to the `.htooltip-trigger`, which shows the tooltip; remove it on a press again, a press elsewhere, Escape, or focus leaving | On a press of the hint or of a trend with a hint, as a touch screen neither hovers nor shows keyboard focus |

The playground's example script, `examples/html/src/scripts/stat.js`, does
this.

## React

`<Stat>` renders it, with the parts you give it, and its icons. Other props
are the `<div>`'s attributes. `<StatGroup>` renders the tray.

| Prop | Effect |
| --- | --- |
| `label` | The label |
| `labelAs` | The label's element: `"h3"` by default, or `"h2"` to `"h6"`, or `"p"` where it's no heading |
| `value` | The number, as your app formats it |
| `caption` | The caption |
| `hint` | What the number means: an info button whose tooltip it is |
| `trend` | `{ direction: "up" \| "down", label }`, such as `{ direction: "up", label: "+12%" }` |
| `trendHint` | What the trend compares, such as the two periods: the trend becomes a button whose tooltip it is |
| `actions` | Below, such as a `<Link>` |

`<StatGroup trendHint>` gives every Stat in it that `trendHint`, unless it has
its own, since a page's numbers usually compare the same periods.

```tsx
<Stat
  label="Open tickets"
  hint="Tickets that aren't closed yet, across every channel."
  value="37"
  caption="Compared to yesterday"
  trend={{ direction: "down", label: "−8%" }}
  actions={<Link href="/tickets">View tickets</Link>}
/>

<StatGroup trendHint="Nov 1–7, 2026, compared with Oct 25–31, 2026.">
  <Stat label="Tickets" value="1,284" caption="Total for this period" trend={{ direction: "up", label: "+12%" }} />
  <Stat label="First response time" value="4m 12s" caption="Median, in working hours" trend={{ direction: "down", label: "−18%" }} />
</StatGroup>
```

## Tokens

`--harmo-font-family`, `--harmo-font-size-lg`, `--harmo-font-size-sm`,
`--harmo-font-size-2xs`, `--harmo-font-weight-normal`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-color-border`,
`--harmo-color-background`, `--harmo-color-background-secondary`,
`--harmo-border-radius`, `--harmo-border-radius-sm`, `--harmo-focus-outline`,
`--harmo-focus-outline-offset`; Tooltip's, for the hints.
