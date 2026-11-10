# File List

The files your app is holding or sending: rows, or a grid of thumbnails, with
progress, a way to try again, and a way to remove each. Pair it with a
[File Input](file-input.md) that takes several files. It uploads nothing itself:
your app says how far each file has got.

## Contract

| Item | Requirement |
| --- | --- |
| CSS | `file-list.css`; `button.css` for its buttons |
| Element | `<ul class="hfile-list" role="list" tabindex="-1">` with a name from `aria-label` or `aria-labelledby` |
| Parts | `<li class="hfile-list-item">`, holding `.hfile-list-thumb`, `.hfile-list-text` (`.hfile-list-name`, then `.hfile-list-detail` or `.hfile-list-error`), `.hfile-list-actions` (`.hfile-list-remove`), and `.hfile-list-progress` while there's progress to show |
| Required | Each remove button's `aria-label`; a name for each progress bar |
| Unique | The id of each `.hfile-list-name`, for its progress bar |
| Script | Yours, to add and remove files and show progress. See [What a script does](#what-a-script-does) |

## Markup

```html
<ul class="hfile-list" role="list" aria-label="Uploads" tabindex="-1">
  <li class="hfile-list-item" data-status="uploading">
    <span class="hfile-list-thumb"><!-- an icon, or <img alt=""> --></span>
    <div class="hfile-list-text">
      <span class="hfile-list-name" id="timeline-name" title="timeline.xlsx">timeline.xlsx</span>
      <span class="hfile-list-detail">86 kB</span>
    </div>
    <div class="hfile-list-actions">
      <button class="hbutton hfile-list-remove" data-variant="tertiary" type="button" aria-label="Remove timeline.xlsx">
        <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
      </button>
    </div>
    <div class="hfile-list-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"
      aria-labelledby="timeline-name" style="--hfile-list-progress: 0.4"></div>
  </li>
</ul>
```

## Options

| Attribute | On | Effect |
| --- | --- | --- |
| `data-layout="grid"` | `.hfile-list` | Square thumbnails with the name and actions below each |
| `data-status` | `.hfile-list-item` | `uploading`, `done`, or `error` |
| `data-new` | `.hfile-list-item` | It settles in as it's added. Leave it off the files there as the page loads |
| `data-leaving` | `.hfile-list-item` | It's being removed: other files don't count it when focus moves |
| `--hfile-list-progress` | `.hfile-list-progress` | How far it has got, from 0 to 1 |

## Appearance and states

- Rows are 1px `--harmo-color-border` cards, 10px apart, with a 42px thumbnail.
  In a grid, tiles are at least 9rem wide, and fill the row.
- A long name ends in an ellipsis. Its `title` shows the whole of it on hover.
- In a narrow row, the actions wrap to a line of their own. In a tile, a failure's
  button has a line of its own.
- A file that has just arrived fades and settles in over 200ms; those there as
  the page loads don't. Removing one fades it and closes
  its row over 150ms, and in a grid the others slide into its place over 200ms.
- The progress bar runs along the bottom edge of the row, 3px tall, so that it
  can't change the row's height as it comes and goes.
- Once a file has finished, a check in `--harmo-color-success` draws itself over
  300ms and the bar fades.
- A failed file says why, in `--harmo-color-danger`, instead of its detail.
- With reduced motion, a file only fades: nothing moves, scales, or closes.
- In forced colors, the bar is drawn in `Highlight`.

## Accessibility

- Name the list, and each remove button after its file, such as "Remove
  timeline.xlsx". `role="list"` keeps it a list in Safari, which stops treating
  one without bullets as a list.
- The list has `tabindex="-1"`. When a file goes while focus is inside it, however
  it's removed, focus moves to the next file's remove button, or the one before;
  after the last, to the list. If your app takes the list away when it's empty,
  move focus somewhere yourself.
- After a retry, the button that was pressed has gone, so focus moves to the
  file's remove button.
- A progress bar is named by its file, through `aria-labelledby`.
- A failure has `role="alert"`, so it's announced as it appears.
- Thumbnails have an empty `alt`, since the name is beside them.

## What a script does

| Change | When |
| --- | --- |
| Adding a `.hfile-list-item` with `data-new`; it settles in by itself | A file arrives |
| `data-status`, `aria-valuenow`, and `--hfile-list-progress` | An upload moves |
| `.hfile-list-error` in place of the detail, and a retry button | An upload fails |
| `data-leaving` and `inert` on the row, moving focus out of it if it's inside, then fading and closing it and removing it | A file is removed |
| Sliding the tiles to their new places | A tile has gone from a grid |

`examples/html/src/scripts/file-list.js` is an example script.

## React

`<FileList>` renders this from `files`, and animates files in and out as the array
changes.

| Prop | Effect |
| --- | --- |
| `files` | The files, in order; see below |
| `aria-label` or `aria-labelledby` | Required. The list's name |
| `layout` | `rows`, the default, or `grid` |
| `onRemove` | Called with a file to remove. Take it out of `files` |
| `removeLabel` | Required with `onRemove`. A function from a file to its button's name |
| `onRetry` | Called with a failed file. Shows a button beside its error |
| `retryLabel` | Required with `onRetry`. The button's text |

Each file has an `id` and a `name`, and these if you have them:

| Field | Effect |
| --- | --- |
| `detail` | A line under the name, such as its size |
| `preview` | An image's URL, for the thumbnail |
| `icon` | Replaces the file icon |
| `progress` | From 0 to 100; 100 draws the check. Leave it out to show no progress |
| `error` | Why it failed, in place of the detail. It takes the bar's place too |

```tsx
const [files, setFiles] = useState<FileListItem[]>([]);

<FileInput
  aria-label="Files to upload"
  multiple
  variant="area"
  dropLabel="Drag them here, or choose them below."
  chooseLabel="Choose files"
  onFilesAdd={(added) =>
    setFiles((all) => [...all, ...added.map((file) => ({ id: crypto.randomUUID(), name: file.name, progress: 0 }))])
  }
/>
<FileList
  aria-label="Uploads"
  files={files}
  removeLabel={(file) => `Remove ${file.name}`}
  onRemove={(file) => setFiles((all) => all.filter((other) => other.id !== file.id))}
/>
```

A file's `preview` is yours to manage: release one you made with
`URL.createObjectURL` when you remove the file. For columns of their own, such as
a type or a download link, use a [Data Table](table.md) with the same files.

## Tokens

`--harmo-space-2xs`, `--harmo-space-xs`, `--harmo-space-lg`,
`--harmo-color-background`, `--harmo-color-background-secondary`,
`--harmo-color-border`, `--harmo-color-border-control`, `--harmo-color-primary`,
`--harmo-color-success`, `--harmo-color-danger`, `--harmo-color-text`,
`--harmo-color-text-secondary`, `--harmo-font-size-sm`, `--harmo-font-size-xs`,
`--harmo-font-weight-medium`, `--harmo-border-radius`, `--harmo-border-radius-sm`,
`--harmo-duration-fast`, `--harmo-duration-normal`, `--harmo-duration-slow`,
`--harmo-ease-out-cubic`, `--harmo-ease-in-out-cubic`, and those of
[Button](button.md#tokens).
