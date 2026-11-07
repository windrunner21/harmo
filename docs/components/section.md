# Section

A part of a page, such as one group of settings or one set of figures: its
title, an optional description, and optional actions at its end, over a line,
then its content, stacked. It styles only its own parts, so what's inside, such
as a [Settings List](settings.md) or a form's fields, keeps its own look. For a
frame around content, use a [Card](card.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `section.css` |
| Element | `<section class="hsection">` |
| Parts | `<header class="hsection-header">` holding `.hsection-text`, with `.hsection-title` (an `<h2>`, or the level the page needs) and an optional `.hsection-description`, and optional `.hsection-actions`; then `.hsection-body` with the content |
| Required | None. For a main part of a page, `aria-labelledby` on the section, naming its title, makes it a region; see [Accessibility](#accessibility) |
| Unique | The title's `id`, when it names the section |
| Script | None |

## Markup

```html
<section class="hsection" aria-labelledby="widget-title">
  <header class="hsection-header">
    <div class="hsection-text">
      <h2 class="hsection-title" id="widget-title">Chat widget</h2>
      <p class="hsection-description">How the widget greets people on your site.</p>
    </div>
    <div class="hsection-actions">
      <button class="hbutton" data-variant="secondary" type="button">
        <span class="hbutton-label">Preview</span>
      </button>
      <button class="hbutton" type="button">
        <span class="hbutton-label">Save changes</span>
      </button>
    </div>
  </header>
  <div class="hsection-body">…</div>
</section>
```

## Options

| Hook | Effect |
| --- | --- |
| `.hsection-description` | A line or two under the title |
| `.hsection-actions` | Buttons or other controls at the header's end, 8px apart, each in its own variant |
| The title's element | `<h2>` by default; `<h3>` and lower for a section inside another |

## Appearance and states

- The title is 20px bold in `--harmo-color-text`; the description is 14px in
  `--harmo-color-text-secondary`, 4px under it.
- The actions sit at the header's end, centered on its text. Where there isn't
  room beside the text, at least 16rem for it, they wrap under it.
- A 1px `--harmo-color-border` line runs under the header, 12px below its
  text, and the content starts 24px below the line.
- The content is stacked, 20px apart, and keeps its own look: Section styles
  nothing inside it.
- Sections one after another are the page's to space, as it spaces any of its
  blocks.

## Accessibility

- A `<section>` with a name is a region: screen readers list the page's
  regions and jump to one by its name. Name the main parts of a page this
  way, such as a settings page's groups, with `aria-labelledby`, the title's
  `id`. Regions are for what's worth going to directly, so leave the name off
  a small group inside another part: its heading is enough to find it, and
  a page of many regions is harder to move through.
- Its title is a heading, so it also takes its place in the page's outline:
  `<h2>` under the page's `<h1>`, and a level lower for a section inside
  another.
- Each action is a native button or link, named by its own text.

## What a script does

None.

## React

`<Section>` renders the section, with its children in the body, and names it
by its title, which makes it a region. For a small group inside another part,
`aria-labelledby={undefined}` leaves the name off. Other props are the
`<section>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | Required. The title, which names the section |
| `description` | The text under the title |
| `labelAs` | The title's element: `h2` by default, or `h3` to `h6` |
| `actions` | What goes at the header's end, usually buttons |

```tsx
<Section
  label="Chat widget"
  description="How the widget greets people on your site."
  actions={
    <>
      <Button variant="secondary">Preview</Button>
      <Button>Save changes</Button>
    </>
  }
>
  <Field label="Greeting">
    <Input name="greeting" defaultValue="Hi! How can we help?" />
  </Field>
</Section>
```

## Tokens

`--harmo-color-border`, `--harmo-color-text`, `--harmo-color-text-secondary`,
`--harmo-font-family`, `--harmo-font-line-height`, `--harmo-font-size-lg`,
`--harmo-font-size-sm`, `--harmo-font-weight-bold`.
