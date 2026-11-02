# Tooltip

A short description shown on hover and keyboard focus: dark by default, for
labels and reasons, or a white hint card that explains something. For content
someone opens and interacts with, use a [Popup](popup.md).

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `tooltip.css` |
| Element | `<span class="htooltip-trigger">` around the control and a `<span class="htooltip">` |
| Parts | `.htooltip`, a direct child of `.htooltip-trigger`, after the control |
| Required | `role="tooltip"` and an `id` on `.htooltip`; `aria-describedby`, or `aria-labelledby` when it names an icon-only control, on the control |
| Unique | The tooltip's `id` |
| Script | Required for Escape to hide it (WCAG 1.4.13); optional for showing neighbors at once; see [What a script does](#what-a-script-does) |

## Markup

```html
<span class="htooltip-trigger">
  <button class="hbutton" type="button" aria-describedby="export-tip">
    <span class="hbutton-label">Export</span>
  </button>
  <span class="htooltip" role="tooltip" id="export-tip">Download the current view as CSV</span>
</span>
```

## Options

| Hook | Effect |
| --- | --- |
| (default) | Below the trigger |
| `data-side="top"`, `"left"`, or `"right"` | Preferred side; it flips when there isn't room. Sides are physical, as in Radix and Floating UI: `left` stays left in right-to-left text |
| `data-variant="hint"` | Explains something, such as a KPI: a white card with 13px `--harmo-color-text-secondary` text, a border, and a soft shadow, up to 280px wide, start-aligned |

## Appearance and states

- The default is `--harmo-tooltip-color-background` (rich black) with
  `--harmo-tooltip-color-text` (white) 14px centered text and
  `--harmo-tooltip-box-shadow`, up to 240px wide, 8px from the trigger.
- Shows on hover after `--harmo-tooltip-delay` (300ms; devices that hover) and
  at once on keyboard focus. The pointer can move onto the tooltip without it
  closing.
- Fixed positioning, anchored to its trigger through `anchor-scope`, so
  scrolling and `overflow: hidden` containers don't clip it. `z-index: 1000`
  keeps it above sticky content.
- A hidden tooltip isn't rendered (`display: none`), so it picks its side each
  time it shows.
- Motion: in 150ms (`--harmo-ease-out-cubic`), fading and scaling from 0.95
  toward the trigger side; out in 100ms. Reduced motion: fade only. Firefox
  can't animate `display`, so there a tooltip hides without fading.
- Its 1px border is transparent; forced colors (Windows contrast themes) draw
  it, giving the tooltip an edge where its shadow is removed.

## Accessibility

- A tooltip that **describes** a control is referenced with `aria-describedby`,
  so screen readers read it after the control's name.
- A tooltip that **names** an icon-only control is referenced with
  `aria-labelledby` instead, so screen readers say "Close, button" once rather
  than the name and then the same description; see [Button](button.md).
- To explain an unavailable button, use `aria-disabled="true"` rather than
  `disabled`: a `disabled` button can't take keyboard focus, so keyboard users
  would never see its tooltip.

## What a script does

| Change | When |
| --- | --- |
| `data-dismissed` on `.htooltip` | Escape hides an open tooltip until the pointer or focus leaves |
| `--htooltip-delay: 0ms` on the trigger or any ancestor | Right after another tooltip closed, so neighbors show at once |

`examples/html/src/scripts/tooltip.js` is an example script.

## React

`<Tooltip>` wraps one control, its only child, and renders the tooltip after
it. Pass `label` to name the control, as for an icon-only button, or
`description` to describe it; the tooltip is connected through
`aria-labelledby` or `aria-describedby` to match. It hides on Escape, and
neighbors show at once. Other props are the trigger `<span>`'s attributes.

| Prop | Effect |
| --- | --- |
| `label` | The control's name |
| `description` | The control's description |
| `side` | `top`, `left`, or `right`; below when left out |
| `variant` | `hint`, a white card that explains something |

```tsx
<Tooltip label="Close">
  <Button variant="tertiary">
    <CloseIcon className="hicon" />
  </Button>
</Tooltip>
<Tooltip description="Download the current view as a CSV file">
  <Button variant="secondary">Export</Button>
</Tooltip>
```

## Tokens

`--harmo-border-radius`, `--harmo-color-background`, `--harmo-color-border`,
`--harmo-color-text-secondary`, `--harmo-duration-fast`,
`--harmo-duration-faster`, `--harmo-ease-out-cubic`, `--harmo-font-family`,
`--harmo-font-size-sm`, `--harmo-font-size-xs`, `--harmo-tooltip-box-shadow`,
`--harmo-tooltip-color-background`, `--harmo-tooltip-color-text`,
`--harmo-tooltip-delay`, `--harmo-tooltip-hint-box-shadow`.
