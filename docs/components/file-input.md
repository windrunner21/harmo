# File Input

Picks one file for your app to upload: a button that opens the file picker, then
shows the file's name with a way to remove it. It can also take a dropped file, in
a compact strip, a large area, or an avatar circle. It doesn't upload anything
itself.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `file-input.css`, `button.css`; `avatar.css` for an avatar; `field.css` for a label and a message |
| Element | `<div class="hfile-input">` |
| Parts | `<label class="hbutton" data-variant="secondary">` holding `<input class="hfile-input-control" type="file">`, an icon, and `.hbutton-label`; then a `<button class="hbutton">` that removes the file |
| Required | A name for the input, from a `<label for>` or `aria-label`; the button's text and the remove button's `aria-label`, in the page's language |
| Unique | The input's `id` |
| Script | To show the file's name and remove it, and to take a dropped file. See [What a script does](#what-a-script-does) |

## Markup

```html
<div class="hfield">
  <label class="hlabel" for="attachment">Attachment</label>
  <div class="hfile-input">
    <label class="hbutton" data-variant="secondary">
      <input class="hfile-input-control" id="attachment" name="attachment" type="file" />
      <svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 16V10M12 10L9 12M12 10L15 12M23 15C23 12.7909 21.2091 11 19 11C18.9764 11 18.9532 11.0002 18.9297 11.0006C18.4447 7.60802 15.5267 5 12 5C9.20335 5 6.79019 6.64004 5.66895 9.01082C3.06206 9.18144 1 11.3498 1 13.9999C1 16.7613 3.23858 19.0001 6 19.0001L19 19C21.2091 19 23 17.2091 23 15Z" /></svg>
      <span class="hbutton-label">Choose file</span>
    </label>
    <button class="hbutton" data-variant="tertiary" type="button" aria-label="Remove attachment" hidden>
      <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
    </button>
  </div>
</div>
```

To say why a file was refused, follow it with a Field's error, connected with
`aria-describedby`:

```html
<input class="hfile-input-control" id="task-list" type="file" accept=".csv" aria-describedby="task-list-error" />
…
<p class="herror" id="task-list-error"></p>
```

To take dropped files, give `.hfile-input` a `data-variant`. A strip puts
`.hfile-input-drop` first; it shows after the button. A large area adds an icon, a
heading, and a hint:

```html
<div class="hfile-input" data-variant="area">
  <span class="hfile-input-icon"><!-- an icon --></span>
  <span class="hfile-input-heading">Upload a task list</span>
  <span class="hfile-input-drop">Drag it here, or choose it below.</span>
  <span class="hfile-input-hint">A CSV file, up to 1 MB.</span>
  <label class="hbutton" data-variant="secondary">
    <input class="hfile-input-control" id="tasks" name="tasks" type="file" aria-label="Task list" />
    <span class="hbutton-label">Choose file</span>
  </label>
  <!-- the remove button -->
</div>
```

An avatar's circle and text are one `<label>`, so all of it opens the picker. The
picture goes last in the circle. Its two texts sit one over the other, with
`data-inactive` on the one not showing, so that changing between them can't move
the circle:

```html
<div class="hfile-input" data-variant="avatar">
  <label class="hfile-input-target">
    <input class="hfile-input-control" name="avatar" type="file" accept="image/*" />
    <span class="havatar">
      <!-- an icon -->
      <img class="hfile-input-preview" src="me.webp" alt="" />
    </span>
    <span class="hfile-input-heading"><span data-inactive="">Upload picture</span><span>Change picture</span></span>
    <span class="hfile-input-hint">PNG or JPG</span>
  </label>
  <button class="hbutton" data-variant="tertiary" type="button" aria-label="Remove picture">
    <!-- a close icon -->
  </button>
</div>
```

## Options

| Attribute | On | Effect |
| --- | --- | --- |
| `data-variant` | `.hfile-input` | `strip`, `area`, or `avatar`: a place to drop a file |
| `data-dragging` | `.hfile-input` | Set by a script: `page` while a file is dragged over the page, `over` while it's over the area |
| `accept` | The input | Narrows what the picker offers. People can still choose any file, so check it too |
| `name` | The input | Sends the file with a form |
| `disabled` | The input, and the remove button | Dims the button, and no file can be chosen or removed |
| `hidden` | The remove button | While there's no file to remove |

## Appearance and states

- The button is a secondary [Button](button.md), 34px tall, with a 20px icon: it
  hovers, presses, and shows focus as one does, following the input inside it.
- The icon gains a check once there's a file, and the text becomes its name.
- The remove button is a tertiary icon-only Button, 8px after it.
- A long name ends in an ellipsis, with the remove button still beside it. Its
  `title` shows the whole name on hover, and screen readers read all of it.
- A strip is as wide as what's in it, up to the width it's given. A large area
  fills it, and spaces its parts on the `--harmo-space-*` scale: the heading and
  its text a small step apart, the button a big one away.
- A drop area has a 1px dashed `--harmo-color-border-control` border. It turns
  `--harmo-color-primary` over 150ms as soon as a file is dragged over the page,
  and fills with `--harmo-color-primary-tint` when the file is over it, while the
  arrow in its icon rises 2px. On a touch screen, where nothing can be dragged,
  the frame and the drop text are hidden.
- As a file arrives, the check in the icon draws itself over 300ms, the button
  changes width over 200ms, and the remove button settles in.
- An avatar's circle is 6rem and dashed, and solid once it has a picture. The
  picture fades and settles in over 200ms, and fades out in 150ms when removed,
  and the remove button sits beside the circle. Pressing the circle scales it to
  0.98.
- With reduced motion, only colors and fades change: nothing moves or scales.
- Disabled: the button is dimmed, with a not-allowed cursor.

## Accessibility

- The input is out of sight, not hidden, so it stays in the tab order: Tab reaches
  it, and Space opens the picker.
- It's named by both labels, the field's and the button's text, so a screen
  reader says "Attachment Choose file", then "Attachment project-brief.pdf". Some
  screen readers read only the first.
- Name the remove button after the field, such as "Remove attachment", so that
  several on a page can be told apart. Removing a file moves focus to the input.
- `accept` isn't a check, and doesn't apply to a dropped file at all. Check the
  type and size when a file is chosen, and again on your server.
- Dropping is an extra for a pointer. The button, or an avatar's circle, does the
  same from the keyboard, and the drop text stays out of the button's name.
- Set `aria-invalid="true"` and show the reason in the connected `.herror` when a
  file is refused.

## What a script does

| Change | When |
| --- | --- |
| The button's text, its `title` with the file's name, its icon, and `hidden` on the remove button | A file is chosen or removed, or the form is reset |
| Emptying the input (`value = ""`), and moving focus to it | The remove button is pressed |
| Emptying the input, `aria-invalid`, and the `.herror`'s text | A file is refused |
| `data-dragging` on `.hfile-input` | A file is dragged over the page or the area |
| Setting the input's `files` to the first file, and sending `change` | A file is dropped on the area |
| Stopping a drop elsewhere on the page, which would open the file in the tab | A file is dropped outside the area, except on another file input |
| Adding `.hfile-input-preview`, or setting `data-leaving` on it and taking it away once it has faded, and moving `data-inactive` between its two texts, for an avatar | A picture is chosen or removed |

`examples/html/src/scripts/file-input.js` is an example script.

## React

`<FileInput>` renders all of this, and in a [Field](field.md#react) takes the
field's id and descriptions. Its props go on the input, except `className` and
`hidden`, which go on `.hfile-input`.

| Prop | Effect |
| --- | --- |
| `chooseLabel` | Required. The button's text before there's a file |
| `removeLabel` | Required. The remove button's name |
| `onFileChange` | Called with the `File`, or `null` when there's none: removed, or refused |
| `validate` | Called with the chosen `File`. Return a message to refuse it, or `null`. The message shows below, and the input is emptied so that a form doesn't send the file |
| `defaultFileName` | The name of a file your app already has. It shows until another is chosen or it's removed, and comes back when the form is reset. If it changes while no file has been chosen, the new name shows. Not on an avatar |
| `variant` | `strip`, `area`, or `avatar`: takes a dropped file too |
| `dropLabel` | Required on a strip or an area. What tells people they can drop a file |
| `heading` | An area's heading |
| `hint` | A line of small text on an area or an avatar, such as the limits |
| `icon` | Replaces the icon |
| `changeLabel` | An avatar's text once it has a picture |
| `defaultPreview` | The URL of a picture your app already has, for an avatar. It behaves as `defaultFileName` does |

It picks one file; there's no `multiple`, and of several dropped it takes the
first. Refusing a file also clears what was there before, and `onFileChange` gets
`null`. A drop area adds listeners to the document while it's on the page, so that
it lights up, and so that a drop that just misses doesn't open the file in the tab.

```tsx
<Field label="Task list" description="A CSV file, up to 1 MB.">
  <FileInput
    name="task-list"
    accept=".csv"
    chooseLabel="Choose file"
    removeLabel="Remove task list"
    validate={(file) => (file.size > 1024 * 1024 ? "Use a file of 1 MB or less." : null)}
    onFileChange={setFile}
  />
</Field>
```

## Tokens

`--harmo-space-2xs`, `--harmo-space-xs`, `--harmo-space-sm`, `--harmo-space-md`,
`--harmo-space-lg`, `--harmo-color-border-control`, `--harmo-color-primary`,
`--harmo-color-primary-tint`, `--harmo-color-background`,
`--harmo-color-background-secondary`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-font-size-base`, `--harmo-font-size-sm`,
`--harmo-font-size-xs`, `--harmo-font-weight-medium`, `--harmo-duration-fast`,
`--harmo-duration-normal`, `--harmo-duration-slow`, and those of
[Button](button.md#tokens), [Avatar](avatar.md#tokens), and
[Field](field.md#tokens).
