# Kanban

A board of columns, ready to copy into your app: cards that are dragged from
one column to another, or moved from each card's menu. It suits anything that
moves through stages, such as tasks, support tickets, or orders.

| React | What it is |
| --- | --- |
| `KanbanBoard` | The board: its columns, each with a count and an Empty State while it has no cards; dragging, with a mouse, a long press, or the keys; and each card's menu, which moves it too |
| `KanbanCard` | A card's layout: its title, a line under it, and a footer, with its menu in the corner; a card that links to its page, with `href`, or opens in place, with `onOpen` |

You render each card; the board places it, drags it, and asks your app
before a card moves, and saves the move with it.

## Try the demo

| Board | Try | You see |
| --- | --- | --- |
| Task board | Drag a card with a mouse, or on a touch screen after a long press, to another column | A dashed outline shows where it will land, the column is tinted, and the counts change as it moves |
| Task board | Tab to a card's handle, which shows as it takes focus, then press Space, the arrow keys, and Space | The card moves within its column, then to the next, and drops; a screen reader hears each step |
| Task board | Point at a card | Its menu shows in its corner, and its border darkens: it links to its page, which the playground doesn't follow |
| Task board | Press Escape while dragging | The card goes back where it was |
| Task board | Open a card's menu, then Move to Done | It moves, and focus goes to its menu button |
| Support tickets | Press a ticket | It opens in a Drawer; dragging one doesn't open it |
| Support tickets | In ticket 1042's Drawer, press Resolve, then Assign to me, Urgent, and Resolve | First Status says it needs an assignee; then the card shows Ana and Urgent, and moves to Resolved as the Drawer closes |
| Support tickets | In ticket 1039's Drawer, choose Waiting on customer | It moves, then comes back, and Status says someone else is editing it |
| Support tickets | Drag ticket 1042, which isn't assigned, over Resolved | The column fades; let go and it comes back, and a Banner says why |
| Support tickets | Move ticket 1039 | It moves, then, a moment later, comes back, and a Banner says someone else is editing it |
| Confirm before Done | Move a card to Done | A Dialog asks first; Cancel puts it back |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript; `@dnd-kit/core` and `@dnd-kit/sortable`, which the CLI installs |
| HTML | Harmo's CSS, and a script of your own for dragging, as [HTML](#html) says |
| Your app | Its columns and cards, and a way to save a move, best a server action |

## React

### Install

```sh
npx harmo-ui add kanban
```

It copies into `components/harmo/patterns/`:

- `kanban/`, the board, the card's layout, and `kanban.css`, which lays them
  out.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. It installs `@dnd-kit/core` and `@dnd-kit/sortable` with your
project's package manager, at the versions Harmo is tested with, unless your
project already lists them; `--no-install` prints the command instead.
Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), set them up
as [Patterns](README.md#install) says, and install the two packages.

### Use it

Give the board your columns, each with its cards, and say how to render a
card. Keep the columns in your app's state, and save each move to them.

```tsx
"use client";

import { useState } from "react";
import { KanbanBoard, type KanbanColumn } from "@/components/harmo/patterns/kanban/KanbanBoard";
import { KanbanCard } from "@/components/harmo/patterns/kanban/KanbanCard";

interface Task {
  id: string;
  title: string;
}

export const Tasks = ({ initial }: { initial: KanbanColumn<Task>[] }) => {
  const [columns, setColumns] = useState(initial);

  return (
    <KanbanBoard
      aria-label="Website launch"
      columns={columns}
      cardId={(task) => task.id}
      cardLabel={(task) => task.title}
      onMove={({ card, to, index }) =>
        setColumns((now) =>
          now.map((column) => {
            const cards = column.cards.filter((each) => each.id !== card.id);
            if (column.id === to) cards.splice(index, 0, card);
            return { ...column, cards };
          }),
        )
      }
      renderCard={(task, parts) => <KanbanCard parts={parts} title={task.title} />}
    />
  );
};
```

`renderCard` gets the card and its `parts`: its `handle`, the button that
drags it from the keys, and its `menu`. Put both in the card, as
`KanbanCard` does, or in a layout of your own. A card is dragged from
anywhere on it with a mouse, and by a long press on a touch screen.

### A card that opens

Give `KanbanCard` `href`, and its title becomes a link to the card's own
page, through your router's link, as Harmo's [Link](../components/link.md)
is; or `onOpen`, and it becomes a button that opens the card in place, such
as in a Drawer. Either covers the whole card: a press anywhere on it opens
it, while a drag doesn't. Its menu stays above it.

```tsx
<KanbanCard parts={parts} title={task.title} href={`/tasks/${task.id}`} />

<KanbanCard
  parts={parts}
  title={ticket.subject}
  description={`#${ticket.number} · ${ticket.customer}`}
  onOpen={() => setOpen(ticket)}
/>
```

A link is the better choice for a page: it opens in a new tab, its address
can be copied, and your router can load it ahead. A Drawer suits a quick
look and a few changes, with the board still beside it, as the Support
tickets example does: its status, assignee, and priority, and Resolve, with
a link to the ticket's own page. A status chosen there moves the card by
the same rules as a drag: change your columns, and the board follows.

Anything else in the card that's pressed needs `position: relative` and a
`z-index`, to sit above the title's link or button.

### Saving a move

A card moves as soon as it's dropped. Then the board calls `onMove` with the
card, the column it came `from`, the one it went `to`, and its `index` there.
What `onMove` returns, or the promise it returns resolves to, says what
happened:

| Answer | What the board does |
| --- | --- |
| Nothing | The move stands. Save it to your columns, so they agree |
| `false` | The card goes back where it was, and nothing's said |
| A string | The card goes back, and a Banner over the board says the string |

If `onMove` throws, or its promise rejects, the card goes back, and the
Banner says "That didn't move. Try again." While a move saves, the card
stays where it was dropped; another can move meanwhile, and only the one
that's turned down goes back.

```tsx
onMove={async (move) => {
  const answer = await saveMove(move.card.id, move.to, move.index);
  if (answer.error) return answer.error;
  setColumns((now) => moved(now, move));
}}
```

To ask first, keep the move waiting: open a Dialog, and resolve with
`false` if it's cancelled, as the Confirm before Done example does.

### Where a card can go

`canMove` is asked as a card is dragged over each column, and before a menu
moves it. Return `true`, or a string that says why it can't go there: that
column fades as the card is dragged over it, a screen reader hears the
string, and if the card is let go there, it goes back, and the Banner says
the string. A card can always go back to its own column.

```tsx
canMove={(ticket, to) =>
  to === "resolved" && !ticket.assignee ? `Assign ticket ${ticket.number} before resolving it.` : true
}
```

### The menu

Each card's menu moves it up or down its column, or to another column's top.
To add your own items, such as Edit or Delete, give `menuItems`; they come
first, over a separator.

```tsx
menuItems={(task) => (
  <DropdownMenuItem destructive onClick={() => remove(task.id)}>
    Delete
  </DropdownMenuItem>
)}
```

### Props

| `KanbanBoard` | Effect |
| --- | --- |
| `aria-label` | Required. The board's name, such as "Website launch" |
| `columns` | Required. Each column's `id`, `title`, `cards`, and `status`, a [Status](../components/status.md) dot by its title: `"neutral"`, `"info"`, `"success"`, `"warning"`, or `"error"` |
| `cardId` | Required. A card's id, unique on the board, and not a column's |
| `cardLabel` | Required. A card's name, as the handle, the menu, and a screen reader say it, such as "Move Fix the postcode check" |
| `renderCard` | Required. A card, with its `parts`, as [Use it](#use-it) says |
| `onMove` | Saves a move, as [Saving a move](#saving-a-move) says |
| `canMove` | Where a card can go, as [Where a card can go](#where-a-card-can-go) says |
| `menuItems` | Your own items in each card's menu |
| `emptyLabel` | What an empty column says: "Nothing here yet" by default |

| `KanbanCard` | Effect |
| --- | --- |
| `parts` | Required. The handle and menu `renderCard` was given |
| `title` | Required. The card's title, an `<h3>` |
| `description` | A line under it, at most three lines long |
| `children` | Anything else, under them, such as a Meter |
| `footer` | Its last row: its first part at the start, such as a Tag, the rest at the end, such as a date and an Avatar |
| `href` | Makes its title a link to its page, as [A card that opens](#a-card-that-opens) says |
| `onOpen` | Makes its title a button that opens it in place |

The columns follow `columns` whenever it changes, but not mid-drag; the
board's own order lasts until then.

### Without JavaScript

The board shows its columns and cards, each column's count, and the empty
ones' Empty State; nothing moves until the script runs.

## HTML

### Markup

The playground shows each board's whole markup; these are its parts.

```html
<section class="hkanban" aria-label="Website launch">
  <div class="hbanner" data-status="error" hidden>…why a move didn't happen…</div>
  <p class="hkanban-status" role="status"></p>
  <div class="hkanban-columns">
    <div class="hkanban-column" role="group" aria-labelledby="to-do">
      <div class="hkanban-column-header">
        <h2 class="hkanban-column-title" id="to-do"><span class="hstatus">To do</span></h2>
        <span class="hbadge" data-variant="neutral">3</span>
      </div>
      <div class="hkanban-column-body">
        <ul class="hkanban-list" aria-labelledby="to-do">
          <li class="hkanban-item">
            <div class="hcard hkanban-card" data-variant="raised">…</div>
          </li>
        </ul>
        <div class="hempty-state" data-size="small" data-variant="dashed" hidden>…</div>
      </div>
    </div>
  </div>
</section>
```

A card holds its title, a line under it, its footer, and, in its corner,
its handle and menu:

```html
<div class="hcard hkanban-card" data-variant="raised">
  <h3 class="hkanban-card-title">
    <button class="hkanban-card-open" type="button">Refund for a missed delivery</button>
  </h3>
  <p class="hkanban-card-description">#1031 · Priya Nair</p>
  <div class="hkanban-card-footer">…a Tag, a date, an Avatar…</div>
  <div class="hkanban-card-actions">
    <button class="hbutton hkanban-handle" type="button" data-variant="tertiary" data-size="xsmall"
      aria-label="Move Ticket 1031, Refund for a missed delivery" aria-describedby="kanban-instructions">…grip…</button>
    <span class="hkanban-menu">…a Dropdown Menu…</span>
  </div>
</div>
```

A card that doesn't open has its title as text, without the button.

### Built with

| Part | Harmo component |
| --- | --- |
| Each card | [Card](../components/card.md), `raised` |
| A column's count | [Badge](../components/badge.md), `neutral` |
| A column's dot | [Status](../components/status.md) |
| An empty column | [Empty State](../components/empty-state.md), `small` and `dashed` |
| The handle, and the menu's button | [Button](../components/button.md), `tertiary` and `xsmall` |
| A card's menu | [Dropdown Menu](../components/dropdown-menu.md) |
| Why a move didn't happen | [Banner](../components/banner.md), `error` |
| The examples' cards | [Tag](../components/tag.md), [Avatar](../components/avatar.md) |
| Asking first | [Dialog](../components/dialog.md) |

The board's layout, the dragging, and the grip icon are the pattern's own:
dragging, in React, from [dnd kit](https://dndkit.com).

### Classes

The pattern's own, in `kanban.css`:

| Class | What it's for |
| --- | --- |
| `.hkanban` | The board |
| `.hkanban-status` | What a move from a menu says, out of sight: a status, there from the start |
| `.hkanban-columns` | The columns, side by side, as tall as the tallest, scrolling sideways where there's no room |
| `.hkanban-column` | A column; `data-over="allowed"` where a dragged card would land, which looks the same, and `"refused"` where it can't go, faded |
| `.hkanban-column-header`, `.hkanban-column-title` | Its title and count |
| `.hkanban-column-body`, `.hkanban-list` | Its cards, and its Empty State |
| `.hkanban-item` | A card's place in the list; `data-dragging` while it's away |
| `.hkanban-card`, `.hkanban-card-title`, `.hkanban-card-description`, `.hkanban-card-footer` | A card's layout |
| `.hkanban-card-open` | The link or button in a title that opens the card, covering it |
| `.hkanban-card-actions` | Its corner: the handle and the menu |
| `.hkanban-handle` | The button that drags it from the keys, shown while it has focus |
| `.hkanban-menu` | Around its Dropdown Menu, shown while the card is pointed at or has focus, or on a touch screen |
| `.hkanban-overlay` | The copy that follows the pointer |

### What your script does

The components' example scripts do some of it, as their docs say:
`dropdown-menu.js` each card's menu, `dialog.js` the Dialog.
[kanban.js](../../examples/html/src/scripts/kanban.js) is an example of the
rest:

- **With a pointer**, from anywhere on the card but its corner, once a
  mouse has moved 4px, or after a long press on a touch screen, 250ms
  without moving more than 5px, so a swipe still scrolls: a copy of the
  card follows it, lifted, with `.hkanban-overlay`; the card's place,
  `data-dragging`, moves by where the copy's middle is: to the column it's
  over, before the first card whose middle is below it, the cards sliding
  out of the way, and stays put between two columns; that column gets
  `data-over`. The board keeps its height until the cards have slid to
  their places, so the columns stay still. Near an edge, the board scrolls.
  Letting go drops it, and the click that follows doesn't open the card;
  Escape puts it back. A link or picture in the card doesn't start the
  browser's own drag.
- **From the keys**, Space or Enter on the handle picks the card up; ↑ and
  ↓ move it, ← and → move it to the next column; Space, Enter, or Tab drops
  it; Escape puts it back. Focus stays on the handle.
- **The menu** moves the card up, down, or to another column's top, then
  focuses the menu's button.
- **After each move**, each column's count and Empty State, and each card's
  menu, follow the cards, and the status says where the card is, such as
  "Moved Write the delivery FAQ to Done, 1 of 1."
- **Your app** saves the move, or turns it down: then the card goes back,
  and the Banner says why.

## Customize

- **Words**: they're written in, in English, in `KanbanBoard`'s `words`,
  such as "Move up" and what a screen reader hears as a card moves. Change
  them in your copy, or put your app's translation calls in their place.
- **Columns**: as many as you have; each is at least 232px wide, and they
  share what's left. Where there's no room, the board scrolls sideways, each
  column snapping to its start.
- **Cards**: any layout, with `renderCard`; `KanbanCard` is one. Keep the
  footer to one row: a card says more once it's opened.
- **A long column**: give `.hkanban-column-body` a `max-block-size` and
  `overflow-y: auto`, and it scrolls on its own; a dragged card scrolls it
  near its edges.

## Accessibility

- The board is a region named by its `aria-label`; each column a group named
  by its title, an `<h2>`; its cards a list; each card's title an `<h3>`,
  and in a card that opens, a button named by the title.
- Every move can be made without dragging, as WCAG 2.5.7 asks: from each
  card's menu, which says "Move up", "Move down", and "Move to Done", or
  from the keys, on the handle.
- The handle is a button named "Move" and the card, such as "Move Write the
  delivery FAQ", described by how to drag from the keys. It's out of sight
  until it has focus, as a mouse drags the whole card and a touch screen a
  long press; the menu shows as the card is pointed at, or has focus, and
  always on a touch screen. As it's dragged, a
  screen reader hears where the card is, such as "Write the delivery FAQ is
  in Done, 1 of 2", and where it can't go, why.
- A move from the menu, and one that comes back, is said in the board's
  status. Focus goes to the moved card's menu button.
- Where a card can't go, the column fades and the Banner says why, in words,
  not only by the fade.
- The copy that follows the pointer is hidden from screen readers, and inert.
- With reduced motion, the cards don't slide, and a dropped card doesn't
  settle; it's there at once.

## Design details

- **Board**: the Banner, when there is one, then the columns, 16px apart,
  each at least 232px wide.
- **Column**: tinted, `--harmo-color-background-secondary`, with the
  border radius, 6px padding, as tall as the tallest; its title, 14px
  medium, with a Status's dot, lined up with the cards' text, and its count,
  a neutral Badge, at the end; its cards 6px under them, and 6px apart.
  Where a dragged card can't go, its cards are at `--harmo-opacity-disabled`.
- **Card**: a raised Card with 16px padding; its title, 14px medium; 6px
  under it, its line, 13px in the secondary text color, at most three
  lines; 10px under that, its footer, 12px, a 20px Avatar at its end. Its
  menu, an extra-small tertiary Button, sits in the top corner, level with
  the title's first line, which leaves it room, fading in over 150ms as the
  card is pointed at. A card that opens darkens its border as it's pointed
  at, and draws its focus ring around the whole card.
- **Dragging**: the card's place is a dashed outline its size, as an empty
  column's Empty State, and it moves by where the dragged card's middle is,
  once half of it is over another column or past another card's middle;
  the copy that follows the pointer has the primary color's border and a
  deeper shadow. The other cards make room in 200ms, easing out, so they
  answer at once; let go, the copy settles into place in 200ms, easing out.
