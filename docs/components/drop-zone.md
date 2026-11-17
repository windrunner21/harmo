# Drop Zone

An area that takes files dropped anywhere on it, such as a chat, a folder's
page, or a list of attachments. While files are dragged over it, a dashed
frame covers it, saying where they'll go. It's an extra for a pointer: pair
it with a [File Input](file-input.md), or a button that opens the picker,
which do the same from the keyboard. For a strip or an area that's only there
to take files, use a File Input's own drop area.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `drop-zone.css` |
| Element | `<div class="hdrop-zone">`, around what's in the area |
| Parts | `<div class="hdrop-zone-overlay" aria-hidden="true">` last inside it, holding an optional icon (`.hicon`) and `<p class="hdrop-zone-label">` |
| Required | The label's words, such as "Drop files to attach", in your app's language; another way to add files, such as a File Input or a button that opens the picker |
| Unique | None |
| Script | Required: to show the frame, and to take the files; see [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hdrop-zone">
  <ul class="hfile-list" role="list" aria-label="Shared files" tabindex="-1">…</ul>
  <div class="hdrop-zone-overlay" aria-hidden="true">
    <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">…</svg>
    <p class="hdrop-zone-label">Drop files to share them</p>
  </div>
</div>
```

The area's own layout is yours: it only gains `position: relative`, so the
frame can cover it.

## Options

| Hook | Effect |
| --- | --- |
| `data-dragging` on `.hdrop-zone` | Shows the frame, while files are dragged over it |

## Appearance and states

- The frame covers the area to its edges, with its corners: a 2px dashed
  `--harmo-color-primary` line on `--harmo-color-primary-tint`, nearly
  opaque, so what's under it shows faintly. In the middle, an optional 24px
  icon and the label, 14px medium, both in `--harmo-color-primary`, 6px apart.
- It fades in over 150ms (`--harmo-duration-fast`) as files come over the
  area, and out as fast as they leave or are dropped.
- It takes no presses or drags, so the drop is the area's.
- In forced-colors mode, it's on the page's background, with a border in the
  system's highlight color.

## Accessibility

- Dragging is for a pointer only, so the area needs another way to add files,
  such as a File Input or a button that opens the picker, which the keyboard
  and screen readers use. The frame is hidden from screen readers, as it only
  repeats that.
- Say what was added, as a File List does by listing each file.
- Dropped files aren't checked by the picker's `accept`: check their types and
  sizes as they arrive, and again on your server.

## What a script does

A script listens on the whole page, by the same rules as a File Input's drop
area, so a drop that just misses doesn't open the file in the tab.

| Change | When |
| --- | --- |
| Add `data-dragging` to the area the files are over, the innermost if one is inside another | Files are dragged over it; count each `dragenter` and `dragleave` on the page, as moving over what's inside sends both, and remove it once they're even |
| Call `preventDefault()` on `dragover`, with `dropEffect` `"copy"` over the area and `"none"` elsewhere | Files are dragged over the page, but not over a field or an editor outside every area, which is left alone; a field inside the area is the area's |
| Call `preventDefault()`, remove `data-dragging`, and take the dropped files, without folders | Files are dropped on it |
| Call `preventDefault()` only | Files are dropped elsewhere on the page, so they don't open in the tab |
| Remove `data-dragging` | Two seconds without a drag event, as when what's under the pointer is removed |
| Nothing | Anything but files is dragged, such as text, or another script has answered the drag |

`examples/html/src/scripts/drop-zone.js` is an example.

## React

`<DropZone>` renders the area and its frame, and gives you the files as
they're dropped, as a [File Input](file-input.md)'s drop area takes them: the
two share their handling of a drag. Other props are the div's.

| Prop | Effect |
| --- | --- |
| `label` | Required. The frame's words |
| `onFiles` | Required. Called with the files dropped |
| `icon` | An icon over the label, such as an `<svg className="hicon">` of an upload |
| `disabled` | Takes no files, and shows no frame |

```tsx
<DropZone label="Drop files to share them" icon={<UploadIcon className="hicon" />} onFiles={addFiles}>
  <FileList aria-label="Shared files" files={files} removeLabel={(file) => `Remove ${file.name}`} onRemove={remove} />
</DropZone>
```

## Tokens

`--harmo-color-primary`, `--harmo-color-primary-tint`,
`--harmo-duration-fast`, `--harmo-font-family`, `--harmo-font-size-sm`,
`--harmo-font-weight-medium`, `--harmo-space-2xs`, `--harmo-space-sm`
