# Kbd

A key on the keyboard, such as Enter, or a shortcut, such as ⌘K: in
instructions, in a list of shortcuts, or on a button that has one.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `kbd.css` |
| Element | `<kbd class="hkbd">` with the key or shortcut as its text |
| Parts | None |
| Required | On a control with a shortcut: `aria-keyshortcuts` on the control, and `aria-hidden="true"` on the `.hkbd` |
| Unique | None |
| Script | None |

## Markup

```html
<p>Press <kbd class="hkbd">Enter</kbd> to choose, or <kbd class="hkbd">Esc</kbd> to close.</p>

<p><kbd class="hkbd">⌘K</kbd> opens the search.</p>

<button class="hbutton" type="button" aria-keyshortcuts="N">
  <span class="hbutton-label">Create <kbd class="hkbd" aria-hidden="true">N</kbd></span>
</button>
```

## Options

None. One `.hkbd` holds one key, or one shortcut pressed together, such as
`⌘K`; keys used one after another, such as ↑ and ↓, each get their own.

## Appearance and states

- A small rectangle: 4px radius, 1px `--harmo-color-border` border, 2px 4px
  padding, 13px medium-weight `--harmo-color-text-secondary` text on
  `--harmo-color-background`, kept on one line.
- Inline, with a line height of 1, so it flows with the text around it without
  changing the height of its lines.
- On a filled [Button](button.md), inside its label: an outline in the label's
  color, with no background, so its text has the label's contrast. On a
  secondary or tertiary button, it looks as it does in text.

## Accessibility

- In text, the key is read as part of it: "Press Enter to choose".
- On a control, the key is a hint, not part of its name: put the shortcut in
  `aria-keyshortcuts` on the control, which screen readers announce as its
  shortcut, and hide the `.hkbd` with `aria-hidden="true"`. The button above
  is named "Create", not "Create N". The app handles the key itself.
- Screen readers read symbols such as ⌘ and ↵ differently, or not at all. In
  instructions, prefer words, such as "Enter", where a word fits.

## What a script does

None.

## React

`<Kbd>` renders the key, with its children as the text. Its props are the
`<kbd>`'s attributes.

```tsx
<p>
  Press <Kbd>Enter</Kbd> to choose.
</p>

<Button aria-keyshortcuts="N">
  Create <Kbd aria-hidden="true">N</Kbd>
</Button>
```

## Tokens

`--harmo-border-radius-sm`, `--harmo-color-background`, `--harmo-color-border`,
`--harmo-color-text-secondary`, `--harmo-font-family`, `--harmo-font-size-xs`,
`--harmo-font-weight-medium`.
