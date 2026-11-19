"use client";

import {
  Badge,
  Banner,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
  Status,
  type StatusProps,
} from "@harmo-ui/react";
import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ErrorIcon, GripIcon, MoreIcon } from "./icons.tsx";

export interface KanbanColumn<Card> {
  id: string;
  title: string;
  status?: "neutral" | NonNullable<StatusProps["status"]>;
  cards: Card[];
}

export interface KanbanMove<Card> {
  card: Card;
  from: string;
  to: string;
  index: number;
}

export type KanbanAnswer = void | false | string;

export interface KanbanCardParts {
  handle: ReactNode;
  menu: ReactNode;
}

export interface KanbanBoardProps<Card> {
  "aria-label": string;
  columns: KanbanColumn<Card>[];
  cardId: (card: Card) => string;
  cardLabel: (card: Card) => string;
  renderCard: (card: Card, parts: KanbanCardParts) => ReactNode;
  menuItems?: (card: Card) => ReactNode;
  onMove?: (move: KanbanMove<Card>) => KanbanAnswer | Promise<KanbanAnswer>;
  canMove?: (card: Card, to: string) => true | string;
  emptyLabel?: ReactNode;
}

type Lists = Record<string, string[]>;

const words = {
  instructions:
    "To pick up a card, press Space or Enter on its handle. Move it with the arrow keys, within its column or to another, then press Space or Enter to drop it, or Escape to put it back. Its Actions menu moves it too.",
  failed: "That didn't move. Try again.",
  dismiss: "Dismiss",
  moveUp: "Move up",
  moveDown: "Move down",
  moveTo: (column: string) => `Move to ${column}`,
  handle: (card: string) => `Move ${card}`,
  actions: (card: string) => `Actions for ${card}`,
  place: (column: string, position: number, count: number) => `${column}, ${position} of ${count}`,
  pickedUp: (card: string, place: string) => `Picked up ${card}, in ${place}.`,
  over: (card: string, place: string) => `${card} is in ${place}.`,
  overNothing: (card: string) => `${card} is over no column.`,
  dropped: (card: string, place: string) => `Dropped ${card} in ${place}.`,
  moved: (card: string, place: string) => `Moved ${card} to ${place}.`,
  back: (card: string, place: string) => `${card} is back in ${place}.`,
};

const listsOf = <Card,>(columns: KanbanColumn<Card>[], cardId: (card: Card) => string): Lists =>
  Object.fromEntries(columns.map((column) => [column.id, column.cards.map(cardId)]));

const moved = (lists: Lists, item: string, to: string, index: number): Lists => {
  const from = Object.keys(lists).find((column) => lists[column]?.includes(item));
  if (from === undefined || !Object.hasOwn(lists, to)) return lists;
  const list = (lists[to] ?? []).filter((each) => each !== item);
  const at = Math.min(index, list.length);
  if (from === to && lists[to]?.indexOf(item) === at) return lists;
  list.splice(at, 0, item);
  const next = { ...lists, [to]: list };
  if (from !== to) next[from] = (lists[from] ?? []).filter((each) => each !== item);
  return next;
};

const restoredAt = (now: readonly string[], source: readonly string[], item: string) => {
  const rest = now.filter((each) => each !== item);
  const at = source.indexOf(item);
  for (let earlier = at - 1; earlier >= 0; earlier--) {
    const found = rest.indexOf(source[earlier] ?? "");
    if (found !== -1) return found + 1;
  }
  for (let later = at + 1; later < source.length; later++) {
    const found = rest.indexOf(source[later] ?? "");
    if (found !== -1) return found;
  }
  return Math.min(at, rest.length);
};

const mouse = { activationConstraint: { distance: 4 } };
const touch = { activationConstraint: { delay: 250, tolerance: 5 } };
const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

const easeOut = "cubic-bezier(0.215, 0.61, 0.355, 1)";

const Column = ({
  id,
  title,
  status,
  count,
  over,
  empty,
  children,
}: {
  id: string;
  title: string;
  status?: KanbanColumn<unknown>["status"];
  count: number;
  over?: "allowed" | "refused";
  empty: ReactNode;
  children: ReactNode;
}) => {
  const { setNodeRef } = useDroppable({ id });
  const heading = useId();

  return (
    <div ref={setNodeRef} className="hkanban-column" role="group" aria-labelledby={heading} data-over={over}>
      <div className="hkanban-column-header">
        <h2 className="hkanban-column-title" id={heading}>
          {status ? <Status status={status === "neutral" ? undefined : status}>{title}</Status> : title}
        </h2>
        <Badge variant="neutral" count={count} />
      </div>
      <div className="hkanban-column-body">
        <ul className="hkanban-list" aria-labelledby={heading} hidden={count === 0}>
          {children}
        </ul>
        <EmptyState size="small" variant="dashed" description={empty} hidden={count > 0} />
      </div>
    </div>
  );
};

interface Target {
  id: string;
  title: string;
}

interface SortableCardProps<Card> {
  id: string;
  card: Card;
  saving: boolean;
  label: string;
  column: string;
  index: number;
  count: number;
  targets: Target[];
  instructions: string;
  still: boolean;
  renderCard: (card: Card, parts: KanbanCardParts) => ReactNode;
  menuItems?: (card: Card) => ReactNode;
  moveTo: (item: string, to: string, index: number) => void;
}

const stop = (event: SyntheticEvent) => event.stopPropagation();

function SortableCardContent<Card>({
  id,
  card,
  saving,
  label,
  column,
  index,
  count,
  targets,
  instructions,
  still,
  renderCard,
  menuItems,
  moveTo,
}: SortableCardProps<Card>) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    disabled: saving ? { draggable: true, droppable: false } : false,
    transition: still ? null : { duration: 200, easing: easeOut },
  });
  const content = useMemo(() => {
    const own = menuItems?.(card);
    const handle = (
      <Button
        {...attributes}
        role={undefined}
        tabIndex={undefined}
        aria-roledescription={undefined}
        aria-describedby={instructions}
        ref={setActivatorNodeRef}
        className="hkanban-handle"
        variant="tertiary"
        size="xsmall"
        aria-label={words.handle(label)}
        onKeyDown={(event: KeyboardEvent) => listeners?.onKeyDown?.(event)}
      >
        <GripIcon className="hicon" />
      </Button>
    );
    const menu = (
      <span className="hkanban-menu" onMouseDown={stop} onTouchStart={stop}>
        <DropdownMenu
          align="end"
          trigger={
            <Button variant="tertiary" size="xsmall" aria-label={words.actions(label)}>
              <MoreIcon className="hicon" />
            </Button>
          }
        >
          {own}
          {own && <DropdownMenuSeparator />}
          {index > 0 && (
            <DropdownMenuItem disabled={saving} onClick={() => moveTo(id, column, index - 1)}>
              {words.moveUp}
            </DropdownMenuItem>
          )}
          {index < count - 1 && (
            <DropdownMenuItem disabled={saving} onClick={() => moveTo(id, column, index + 1)}>
              {words.moveDown}
            </DropdownMenuItem>
          )}
          {targets
            .filter((other) => other.id !== column)
            .map((other) => (
              <DropdownMenuItem key={other.id} disabled={saving} onClick={() => moveTo(id, other.id, 0)}>
                {words.moveTo(other.title)}
              </DropdownMenuItem>
            ))}
        </DropdownMenu>
      </span>
    );
    return renderCard(card, { handle, menu });
  }, [id, card, saving, label, column, index, count, targets, instructions, renderCard, menuItems, moveTo, attributes, listeners, setActivatorNodeRef]);

  return (
    <li
      ref={setNodeRef}
      className="hkanban-item"
      data-card={id}
      data-dragging={isDragging || undefined}
      aria-busy={saving || undefined}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      onMouseDown={(event) => listeners?.onMouseDown?.(event)}
      onTouchStart={(event) => listeners?.onTouchStart?.(event)}
      onContextMenu={(event) => {
        if (isDragging) event.preventDefault();
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {content}
    </li>
  );
}

const SortableCard = memo(SortableCardContent) as typeof SortableCardContent;

const standIn = { handle: null, menu: null };

export const KanbanBoard = <Card,>({
  "aria-label": label,
  columns,
  cardId,
  cardLabel,
  renderCard,
  menuItems,
  onMove,
  canMove,
  emptyLabel = "Nothing here yet",
}: KanbanBoardProps<Card>) => {
  const [lists, setLists] = useState(() => listsOf(columns, cardId));
  const [seen, setSeen] = useState(columns);
  const [active, setActive] = useState<string | null>(null);
  const [target, setTarget] = useState<{ column: string; allowed: boolean } | null>(null);
  const [still, setStill] = useState(false);
  const [pending, setPending] = useState<Record<string, { to: string; index: number }>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const latest = useRef(lists);
  const before = useRef(lists);
  const ended = useRef("");
  const announced = useRef("");
  const focusAfter = useRef<string | null>(null);
  const lastOver = useRef<UniqueIdentifier | null>(null);
  const dragged = useRef(false);
  const release = useRef<ReturnType<typeof setTimeout>>(undefined);
  const board = useRef<HTMLElement>(null);
  const columnsBox = useRef<HTMLDivElement>(null);
  const id = useId();

  if (seen !== columns && !active) {
    setSeen(columns);
    setLists(Object.entries(pending).reduce((now, [item, { to, index }]) => moved(now, item, to, index), listsOf(columns, cardId)));
  }

  useLayoutEffect(() => {
    latest.current = lists;
  });

  useLayoutEffect(() => {
    const item = focusAfter.current;
    if (!item) return;
    focusAfter.current = null;
    board.current?.querySelector<HTMLElement>(`[data-card="${CSS.escape(item)}"] .hkanban-menu .hbutton`)?.focus();
  });

  const stepping = useRef<KeyboardCoordinateGetter>(() => undefined);
  const keys = useMemo(() => ({ coordinateGetter: ((event, args) => stepping.current(event, args)) as KeyboardCoordinateGetter }), []);
  const sensors = useSensors(useSensor(MouseSensor, mouse), useSensor(TouchSensor, touch), useSensor(KeyboardSensor, keys));

  const isColumn = (key: UniqueIdentifier) => String(key).startsWith(`${id}:`);
  const collision: CollisionDetection = (args) => {
    if (!args.pointerCoordinates) return closestCorners(args);
    const { collisionRect, droppableRects, droppableContainers } = args;
    const middle = collisionRect.left + collisionRect.width / 2;
    const column = droppableContainers.find((each) => {
      const rect = droppableRects.get(each.id);
      return isColumn(each.id) && rect !== undefined && middle >= rect.left && middle <= rect.right;
    });
    if (column) {
      const items = latest.current[String(column.id).slice(id.length + 1)] ?? [];
      const nearest =
        items.length > 0
          ? closestCenter({ ...args, droppableContainers: droppableContainers.filter((each) => items.includes(String(each.id))) })[0]
          : column;
      if (nearest) lastOver.current = nearest.id;
    }
    return lastOver.current === null ? [] : [{ id: lastOver.current }];
  };

  const hold = () => {
    clearTimeout(release.current);
    const box = columnsBox.current;
    if (box) box.style.minBlockSize = `${box.offsetHeight}px`;
  };
  const letGo = () => {
    dragged.current = true;
    release.current = setTimeout(() => {
      if (columnsBox.current) columnsBox.current.style.minBlockSize = "";
    }, 220);
  };

  const cards = new Map(columns.flatMap((column) => column.cards.map((card) => [cardId(card), card] as const)));
  const put = (next: Lists) => {
    latest.current = next;
    setLists(next);
  };
  const columnOf = (item: UniqueIdentifier, from = latest.current) => {
    const key = String(item);
    const named = key.startsWith(`${id}:`) ? key.slice(id.length + 1) : undefined;
    if (named !== undefined && named in from) return named;
    return Object.keys(from).find((column) => from[column]?.includes(key));
  };
  const nameOf = (item: UniqueIdentifier) => {
    const card = cards.get(String(item));
    return card ? cardLabel(card) : "";
  };
  const placeOf = (item: string, over?: UniqueIdentifier) => {
    const column = columnOf(item);
    const list = column ? (latest.current[column] ?? []) : [];
    const overIndex = over === undefined ? -1 : list.indexOf(String(over));
    const title = columns.find((each) => each.id === column)?.title ?? "";
    return words.place(title, (overIndex === -1 ? list.indexOf(item) : overIndex) + 1, list.length);
  };
  const verdict = (item: string, to: string) => {
    const card = cards.get(item);
    if (!card || !canMove || to === columnOf(item, before.current)) return true;
    return canMove(card, to);
  };

  const settle = (item: string) =>
    setPending((now) => {
      const next = { ...now };
      delete next[item];
      return next;
    });

  const commit = async (card: Card, item: string, from: string, to: string, index: number, source: readonly string[]) => {
    if (!onMove) return;
    setPending((now) => ({ ...now, [item]: { to, index } }));
    let answer: KanbanAnswer;
    try {
      answer = await onMove({ card, from, to, index });
    } catch {
      answer = words.failed;
    }
    settle(item);
    if (answer === undefined) return;
    if (board.current?.querySelector(`[data-card="${CSS.escape(item)}"]`)?.contains(document.activeElement)) focusAfter.current = item;
    put(moved(latest.current, item, from, restoredAt(latest.current[from] ?? [], source, item)));
    if (typeof answer === "string") setError(answer);
    setStatus(`${typeof answer === "string" ? `${answer} ` : ""}${words.back(cardLabel(card), placeOf(item))}`);
  };

  const moveTo = (item: string, to: string, index: number) => {
    const from = columnOf(item);
    const card = cards.get(item);
    if (!from || !card || Object.hasOwn(pending, item)) return;
    before.current = latest.current;
    focusAfter.current = item;
    const permitted = verdict(item, to);
    if (permitted !== true) {
      setError(permitted);
      setStatus(permitted);
      return;
    }
    setError("");
    const source = latest.current[from] ?? [];
    put(moved(latest.current, item, to, index));
    setStatus(words.moved(cardLabel(card), placeOf(item)));
    void commit(card, item, from, to, index, source);
  };

  const step: KeyboardCoordinateGetter = (event, { context: { active: picked, over: under, collisionRect, droppableRects } }) => {
    const directions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!directions.includes(event.code)) return undefined;
    event.preventDefault();
    if (!picked || !collisionRect) return undefined;
    const item = String(picked.id);
    const column = columnOf(item);
    if (!column) return undefined;
    const list = latest.current[column] ?? [];
    const at = under ? list.indexOf(String(under.id)) : -1;
    const index = at === -1 ? list.indexOf(item) : at;
    let target: string | undefined;
    if (event.code === "ArrowUp") target = list[index - 1];
    else if (event.code === "ArrowDown") target = list[index + 1];
    else {
      const order = columns.map((each) => each.id);
      const reversed = board.current ? getComputedStyle(board.current).direction === "rtl" : false;
      const step = (event.code === "ArrowRight") !== reversed ? 1 : -1;
      const next = order[order.indexOf(column) + step];
      if (!next) return undefined;
      const others = latest.current[next] ?? [];
      target = others.length > 0 ? others[Math.min(index, others.length - 1)] : `${id}:${next}`;
    }
    const rect = target === undefined ? undefined : droppableRects.get(target);
    if (!rect) return undefined;
    const after = event.code === "ArrowDown";
    return { x: rect.left, y: after ? rect.top + rect.height - collisionRect.height : rect.top };
  };

  const moving = useRef(moveTo);
  useLayoutEffect(() => {
    moving.current = moveTo;
    stepping.current = step;
  });
  const move = useCallback((item: string, to: string, index: number) => moving.current(item, to, index), []);
  const targets = useMemo(() => columns.map(({ id: column, title }) => ({ id: column, title })), [columns]);

  const announcements: Announcements = {
    onDragStart: ({ active: picked }) => {
      announced.current = placeOf(String(picked.id));
      return words.pickedUp(nameOf(picked.id), announced.current);
    },
    onDragOver: ({ active: picked, over }) => {
      const item = String(picked.id);
      const to = over ? columnOf(over.id) : undefined;
      const permitted = to && to !== columnOf(item) ? verdict(item, to) : true;
      const place = !over ? "" : permitted === true ? placeOf(item, over.id) : permitted;
      if (place === announced.current) return undefined;
      announced.current = place;
      if (!over) return words.overNothing(nameOf(item));
      return permitted === true ? words.over(nameOf(item), place) : permitted;
    },
    onDragEnd: () => ended.current,
    onDragCancel: () => ended.current,
  };

  const start = ({ active: picked }: DragStartEvent) => {
    before.current = latest.current;
    lastOver.current = null;
    hold();
    setError("");
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setActive(String(picked.id));
    setTarget({ column: columnOf(picked.id) ?? "", allowed: true });
  };

  const over = ({ active: picked, over: under }: DragOverEvent) => {
    const item = String(picked.id);
    const from = columnOf(item);
    const to = under ? columnOf(under.id) : undefined;
    if (!under || !from || !to) {
      setTarget(null);
      return;
    }
    const permitted = verdict(item, to) === true;
    setTarget((now) => (now?.column === to && now.allowed === permitted ? now : { column: to, allowed: permitted }));
    if (from === to || !permitted) return;
    const list = latest.current[to] ?? [];
    const overIndex = list.indexOf(String(under.id));
    const dragged = picked.rect.current.translated;
    const below = dragged ? dragged.top > under.rect.top + under.rect.height / 2 : false;
    put(moved(latest.current, item, to, overIndex === -1 ? list.length : overIndex + (below ? 1 : 0)));
  };

  const end = ({ active: picked, over: under }: DragEndEvent) => {
    const item = String(picked.id);
    const card = cards.get(item);
    const previous = before.current;
    const from = columnOf(item, previous);
    const to = under ? columnOf(under.id) : undefined;
    setActive(null);
    setTarget(null);
    letGo();
    if (!card || !from) return;
    const permitted = to ? verdict(item, to) : true;
    if (!under || !to || permitted !== true) {
      put(moved(latest.current, item, from, (previous[from] ?? []).indexOf(item)));
      if (typeof permitted === "string") setError(permitted);
      ended.current = `${typeof permitted === "string" ? `${permitted} ` : ""}${words.back(cardLabel(card), placeOf(item))}`;
      return;
    }
    const list = latest.current[to] ?? [];
    const overIndex = list.indexOf(String(under.id));
    const index = overIndex !== -1 ? overIndex : list.includes(item) ? list.indexOf(item) : list.length;
    put(moved(latest.current, item, to, index));
    ended.current = words.dropped(cardLabel(card), placeOf(item));
    const fromIndex = (previous[from] ?? []).indexOf(item);
    if (from === to && fromIndex === index) return;
    void commit(card, item, from, to, index, previous[from] ?? []);
  };

  const cancel = ({ active: picked }: DragCancelEvent) => {
    const item = String(picked.id);
    const from = columnOf(item, before.current);
    setActive(null);
    setTarget(null);
    letGo();
    if (from) put(moved(latest.current, item, from, (before.current[from] ?? []).indexOf(item)));
    ended.current = words.back(nameOf(picked.id), placeOf(String(picked.id)));
  };

  const picked = active ? cards.get(active) : undefined;

  return (
    <section
      ref={board}
      className="hkanban"
      aria-label={label}
      onPointerDownCapture={() => {
        dragged.current = false;
      }}
      onKeyDownCapture={() => {
        dragged.current = false;
      }}
      onClickCapture={(event) => {
        if (!dragged.current) return;
        dragged.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Banner
        status="error"
        icon={<ErrorIcon />}
        hidden={!error}
        action={
          <Button variant="tertiary" size="small" onClick={() => setError("")}>
            {words.dismiss}
          </Button>
        }
      >
        {error}
      </Banner>
      <p className="hkanban-status" role="status">
        {status}
      </p>
      <p id={`${id}-instructions`} hidden>
        {words.instructions}
      </p>
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={collision}
        measuring={measuring}
        accessibility={{ announcements, screenReaderInstructions: { draggable: "" } }}
        onDragStart={start}
        onDragOver={over}
        onDragEnd={end}
        onDragCancel={cancel}
      >
        <div ref={columnsBox} className="hkanban-columns">
          {columns.map((column) => {
            const list = lists[column.id] ?? [];
            return (
              <Column
                key={column.id}
                id={`${id}:${column.id}`}
                title={column.title}
                status={column.status}
                count={list.length}
                over={active && target?.column === column.id ? (target.allowed ? "allowed" : "refused") : undefined}
                empty={emptyLabel}
              >
                <SortableContext id={column.id} items={list} strategy={verticalListSortingStrategy}>
                  {list.map((item, index) => {
                    const card = cards.get(item);
                    if (!card) return null;
                    return (
                      <SortableCard
                        key={item}
                        id={item}
                        card={card}
                        saving={Object.hasOwn(pending, item)}
                        label={cardLabel(card)}
                        column={column.id}
                        index={index}
                        count={list.length}
                        targets={targets}
                        instructions={`${id}-instructions`}
                        still={still}
                        renderCard={renderCard}
                        menuItems={menuItems}
                        moveTo={move}
                      />
                    );
                  })}
                </SortableContext>
              </Column>
            );
          })}
        </div>
        <DragOverlay dropAnimation={still ? null : { duration: 200, easing: easeOut }} transition={still ? "none" : undefined}>
          {picked && (
            <div className="hkanban-overlay" aria-hidden="true" inert>
              {renderCard(picked, standIn)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </section>
  );
};
