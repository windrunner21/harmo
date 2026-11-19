import {
  Avatar,
  Button,
  Dialog,
  DialogClose,
  Drawer,
  DropdownMenuItem,
  Option,
  Segmented,
  SegmentedOption,
  Select,
  Tag,
} from "@harmo-ui/react";
import { useRef, useState } from "react";
import { KanbanBoard, type KanbanCardParts, type KanbanColumn, type KanbanMove } from "../patterns/kanban/KanbanBoard.tsx";
import { KanbanCard } from "../patterns/kanban/KanbanCard.tsx";

// Example only: each board's columns are this page's state, standing in for
// your app's, and each move is saved to it, as your app would save it to its
// server. Each task links to a page of its own, here an address in this
// page; a ticket opens in a Drawer, which changes it there.
interface Task {
  id: string;
  title: string;
  description?: string;
  tag: { label: string; color: string };
  assignee?: { name: string; initials: string };
  due: string;
}

const ana = { name: "Ana Petrova", initials: "AP" };
const sam = { name: "Sam Okafor", initials: "SO" };
const lee = { name: "Lee Chen", initials: "LC" };

const design = { label: "Design", color: "var(--harmo-purple)" };
const website = { label: "Website", color: "var(--harmo-cyan)" };
const marketing = { label: "Marketing", color: "var(--harmo-amber)" };

const tasks = (): KanbanColumn<Task>[] => [
  {
    id: "to-do",
    title: "To do",
    status: "neutral",
    cards: [
      { id: "menu-photos", title: "Photograph the autumn menu", tag: design, assignee: lee, due: "Oct 14" },
      {
        id: "faq",
        title: "Write the delivery FAQ",
        description: "Cut-off times, delivery windows, and what happens when no one's home.",
        tag: website,
        due: "Oct 18",
      },
      { id: "newsletter", title: "Send the October newsletter", tag: marketing, assignee: ana, due: "Oct 20" },
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    status: "info",
    cards: [
      {
        id: "postcode",
        title: "Fix the postcode check at checkout",
        description: "Postcodes with a space at the end are turned away.",
        tag: website,
        assignee: sam,
        due: "Oct 11",
      },
      { id: "stall", title: "Plan the Saturday market stall", tag: marketing, assignee: ana, due: "Oct 12" },
    ],
  },
  { id: "done", title: "Done", status: "success", cards: [] },
];

// The card as it is now, which a change since the move began may have
// changed, moved to its new place.
const moveIn = <Card extends { id: string }>(columns: KanbanColumn<Card>[], { card, to, index }: KanbanMove<Card>) => {
  const current = columns.flatMap((column) => column.cards).find((each) => each.id === card.id) ?? card;
  return columns.map((column) => {
    const cards = column.cards.filter((each) => each.id !== card.id);
    if (column.id === to) cards.splice(index, 0, current);
    return { ...column, cards };
  });
};

const TaskCard = ({ task, parts, href }: { task: Task; parts: KanbanCardParts; href?: string }) => (
  <KanbanCard
    parts={parts}
    href={href}
    title={task.title}
    description={task.description}
    footer={
      <>
        <Tag color={task.tag.color}>{task.tag.label}</Tag>
        <span>{task.due}</span>
        {task.assignee && (
          <Avatar alt={task.assignee.name} title={task.assignee.name}>
            {task.assignee.initials}
          </Avatar>
        )}
      </>
    }
  />
);

const TaskBoard = () => {
  const [columns, setColumns] = useState(tasks);

  return (
    <KanbanBoard
      aria-label="Website launch"
      columns={columns}
      cardId={(task) => task.id}
      cardLabel={(task) => task.title}
      onMove={(move) => setColumns((now) => moveIn(now, move))}
      menuItems={(task) => (
        <DropdownMenuItem
          destructive
          onClick={() =>
            setColumns((now) => now.map((column) => ({ ...column, cards: column.cards.filter((each) => each.id !== task.id) })))
          }
        >
          Delete
        </DropdownMenuItem>
      )}
      renderCard={(task, parts) => <TaskCard task={task} parts={parts} href={`#tasks/${task.id}`} />}
    />
  );
};

interface Ticket {
  id: string;
  number: number;
  subject: string;
  customer: string;
  priority: "Urgent" | "High" | "Normal";
  assignee?: { name: string; initials: string };
  updated: string;
  message: string;
}

const priorities = {
  Urgent: "var(--harmo-red)",
  High: "var(--harmo-amber)",
};

const tickets = (): KanbanColumn<Ticket>[] => [
  {
    id: "open",
    title: "Open",
    status: "warning",
    cards: [
      {
        id: "t-1042",
        number: 1042,
        subject: "Order arrived without the eggs",
        customer: "Maria Santos",
        priority: "High",
        updated: "4 min ago",
        message: "Everything else was there, but the dozen eggs from my list weren't in any of the bags.",
      },
      {
        id: "t-1039",
        number: 1039,
        subject: "Can't change my delivery window",
        customer: "Tom Becker",
        priority: "Normal",
        assignee: sam,
        updated: "1 h ago",
        message: "I need Thursday's delivery moved to the evening, but every window shows as full.",
      },
    ],
  },
  {
    id: "waiting",
    title: "Waiting on customer",
    status: "info",
    cards: [
      {
        id: "t-1031",
        number: 1031,
        subject: "Refund for a missed delivery",
        customer: "Priya Nair",
        priority: "Urgent",
        assignee: ana,
        updated: "Yesterday",
        message: "No one came on Monday, and I was home all morning. Can I have my money back?",
      },
    ],
  },
  {
    id: "resolved",
    title: "Resolved",
    status: "success",
    cards: [
      {
        id: "t-1027",
        number: 1027,
        subject: "Gift card code doesn't work",
        customer: "Jonas Weber",
        priority: "Normal",
        assignee: lee,
        updated: "Mon",
        message: "The code on my birthday card says it's already been used.",
      },
    ],
  },
];

// Stands in for your app's server: a moment later, it saves the move, but
// for ticket 1039, which someone else is editing.
const save = (move: KanbanMove<Ticket>) =>
  new Promise<string | void>((resolve) =>
    setTimeout(
      () => resolve(move.card.number === 1039 ? "Sam is editing ticket 1039. Try again once they're done." : undefined),
      600,
    ),
  );

const teammates = [ana, sam, lee];
const me = ana;

const canResolve = (ticket: Ticket, to: string) =>
  to === "resolved" && !ticket.assignee ? `Assign ticket ${ticket.number} to someone before resolving it.` : true;

const TicketBoard = () => {
  const [columns, setColumns] = useState(tickets);
  const [shownId, setShownId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [savingIds, setSavingIds] = useState<readonly string[]>([]);
  const opening = useRef(0);
  const saving = shownId !== null && savingIds.includes(shownId);

  // One save at a time for each ticket, from the board or the Drawer.
  const saveOne = async (move: KanbanMove<Ticket>) => {
    setSavingIds((now) => [...now, move.card.id]);
    const answer = await save(move);
    setSavingIds((now) => now.filter((id) => id !== move.card.id));
    return answer;
  };

  const placeOf = (id: string) => {
    for (const column of columns) {
      const index = column.cards.findIndex((each) => each.id === id);
      if (index !== -1) return { ticket: column.cards[index] as Ticket, status: column.id, index };
    }
    return undefined;
  };
  const shown = shownId ? placeOf(shownId) : undefined;
  const ticket = shown?.ticket;

  const change = (id: string, changes: Partial<Ticket>) =>
    setColumns((now) =>
      now.map((column) => ({ ...column, cards: column.cards.map((each) => (each.id === id ? { ...each, ...changes } : each)) })),
    );

  // A status chosen in the Drawer moves the card, by the board's rules, and
  // is saved as a drag is.
  const changeStatus = async (to: string) => {
    if (!shown || shown.status === to || saving) return true;
    const permitted = canResolve(shown.ticket, to);
    if (permitted !== true) {
      setStatusError(permitted);
      return false;
    }
    setStatusError("");
    const mine = opening.current;
    const move = { card: shown.ticket, from: shown.status, to, index: 0 };
    setColumns((now) => moveIn(now, move));
    const answer = await saveOne(move);
    if (!answer) return opening.current === mine;
    setColumns((now) => moveIn(now, { card: shown.ticket, from: to, to: shown.status, index: shown.index }));
    if (opening.current !== mine) return false;
    setStatusError(answer);
    return false;
  };

  return (
    <>
      <KanbanBoard
        aria-label="Support tickets"
        columns={columns}
        cardId={(each) => each.id}
        cardLabel={(each) => `Ticket ${each.number}, ${each.subject}`}
        emptyLabel="No tickets"
        canMove={canResolve}
        onMove={async (move) => {
          if (savingIds.includes(move.card.id)) return `Ticket ${move.card.number} is still saving. Try again in a moment.`;
          const answer = await saveOne(move);
          if (answer) return answer;
          setColumns((now) => moveIn(now, move));
        }}
        renderCard={(each, parts) => (
          <KanbanCard
            parts={parts}
            title={each.subject}
            description={`#${each.number} · ${each.customer}`}
            onOpen={() => {
              opening.current += 1;
              setShownId(each.id);
              setStatusError("");
              setOpen(true);
            }}
            footer={
              <>
                {each.priority !== "Normal" && <Tag color={priorities[each.priority]}>{each.priority}</Tag>}
                <span>{each.updated}</span>
                {each.assignee && (
                  <Avatar alt={each.assignee.name} title={each.assignee.name}>
                    {each.assignee.initials}
                  </Avatar>
                )}
              </>
            }
          />
        )}
      />
      <Drawer
        label={ticket?.subject ?? ""}
        description={ticket ? `#${ticket.number} · ${ticket.customer}` : ""}
        closeLabel="Close"
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <Button variant="secondary" href={`#tickets/${ticket?.number ?? ""}`}>
              Open ticket
            </Button>
            <Button
              loading={saving}
              disabled={shown?.status === "resolved"}
              onClick={async () => {
                if (await changeStatus("resolved")) setOpen(false);
              }}
            >
              Resolve
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--harmo-space-sm)" }}>
          <p style={{ margin: 0 }}>{ticket?.message}</p>
          <Select label="Status" value={shown?.status ?? "open"} onValueChange={changeStatus} error={statusError} disabled={saving}>
            {columns.map((column) => (
              <Option key={column.id} value={column.id}>
                {column.title}
              </Option>
            ))}
          </Select>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--harmo-space-2xs)" }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Assignee"
                value={ticket?.assignee?.initials ?? "none"}
                onValueChange={(initials) => {
                  if (!ticket) return;
                  setStatusError("");
                  change(ticket.id, { assignee: teammates.find((each) => each.initials === initials) });
                }}
              >
                <Option value="none">Unassigned</Option>
                {teammates.map((each) => (
                  <Option key={each.initials} value={each.initials}>
                    {each.name}
                  </Option>
                ))}
              </Select>
            </div>
            <Button
              variant="secondary"
              disabled={ticket?.assignee === me}
              onClick={() => {
                if (!ticket) return;
                setStatusError("");
                change(ticket.id, { assignee: me });
              }}
            >
              Assign to me
            </Button>
          </div>
          <Segmented
            label="Priority"
            name="priority"
            value={ticket?.priority ?? "Normal"}
            onValueChange={(priority) => {
              if (ticket) change(ticket.id, { priority: priority as Ticket["priority"] });
            }}
          >
            <SegmentedOption value="Normal">Normal</SegmentedOption>
            <SegmentedOption value="High">High</SegmentedOption>
            <SegmentedOption value="Urgent">Urgent</SegmentedOption>
          </Segmented>
        </div>
      </Drawer>
    </>
  );
};

const ConfirmBoard = () => {
  const [columns, setColumns] = useState(tasks);
  const [asking, setAsking] = useState<Task | null>(null);
  const answer = useRef<(done: boolean) => void>(() => {});

  const close = (done: boolean) => {
    answer.current(done);
    setAsking(null);
  };

  return (
    <>
      <KanbanBoard
        aria-label="Website launch"
        columns={columns}
        cardId={(task) => task.id}
        cardLabel={(task) => task.title}
        onMove={async (move) => {
          if (move.to === "done" && move.from !== "done") {
            setAsking(move.card);
            const done = await new Promise<boolean>((resolve) => {
              answer.current = resolve;
            });
            if (!done) return false;
          }
          setColumns((now) => moveIn(now, move));
        }}
        renderCard={(task, parts) => <TaskCard task={task} parts={parts} />}
      />
      <Dialog
        label={`Mark “${asking?.title ?? ""}” as done?`}
        description="It moves to Done, and its assignee hears that it's finished."
        closeLabel="Close"
        open={asking !== null}
        onOpenChange={(open) => {
          if (!open && asking) close(false);
        }}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={() => close(true)}>Mark as done</Button>
          </>
        }
      />
    </>
  );
};

export const examples = {
  "Task board": () => <TaskBoard />,
  "Support tickets": () => <TicketBoard />,
  "Confirm before Done": () => <ConfirmBoard />,
};
