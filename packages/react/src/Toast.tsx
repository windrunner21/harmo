"use client";
import {
  cloneElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export type ToastStatus = "success" | "warning" | "info" | "error";

export interface ToastAction {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface ToastOptions {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  action?: ToastAction;
  duration?: number;
}

interface Shown extends ToastOptions {
  id: string;
  key: string;
  version: number;
  previous?: Shown;
  removed?: boolean;
}

// The toasts, shared by toast() and the Toaster, in the order they came.
let shown: Shown[] = [];
const none: Shown[] = [];
const listeners = new Set<() => void>();
const publish = (next: Shown[]) => {
  shown = next;
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
let count = 0;

const show = (options: ToastOptions) => {
  const id = options.id ?? `htoast-${++count}`;
  const current = shown.find((item) => item.id === id && !item.removed);
  if (current) {
    const previous = { ...current, previous: undefined };
    publish(
      shown.map((item) =>
        item === current
          ? { ...options, id, key: current.key, version: current.version + 1, previous }
          : item,
      ),
    );
  } else {
    publish([...shown, { ...options, id, key: `${id}-${++count}`, version: 0 }]);
  }
  return id;
};

const dismiss = (id: string) => {
  if (!shown.some((item) => item.id === id && !item.removed)) return;
  publish(
    shown.map((item) =>
      item.id === id && !item.removed ? { ...item, removed: true } : item,
    ),
  );
};

const forget = (key: string) => publish(shown.filter((item) => item.key !== key));

// Shows a toast and returns its id; the same id again changes that toast.
export const toast = Object.assign(show, { dismiss });

export type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

export interface ToasterProps
  extends Omit<ComponentPropsWithRef<"section">, "children"> {
  label: string;
  icons: Record<ToastStatus, ReactElement<ComponentPropsWithRef<"svg">>>;
  position?: ToastPosition;
  hotkey?: string;
}

const GAP = 12;
const DURATION = 4000;
const EXIT_SPACING = 700;
const ANNOUNCE_DELAY = 100;
const ANNOUNCE_TIME = 1500;

interface Clock {
  version: number;
  remaining: number;
  started?: number;
  handle?: ReturnType<typeof setTimeout>;
}

interface Size {
  version: number;
  epoch: number;
  width: number;
  height: number;
}

// The content's own size: its exact width, which can be a fraction of a pixel,
// rounded up, since rounded down the last word no longer fits and wraps.
const measure = (body: HTMLElement) => {
  body.style.inlineSize = "max-content";
  const width = Math.ceil(parseFloat(getComputedStyle(body).width));
  body.style.inlineSize = `${width}px`;
  const height = parseFloat(getComputedStyle(body).height);
  body.style.inlineSize = "";
  return { width, height };
};

const urgent = (status?: ToastStatus) => status === "error" || status === "warning";

const ToastBody = ({
  item,
  icon,
  leaving,
  onLeft,
}: {
  item: Shown;
  icon: ReactElement<ComponentPropsWithRef<"svg">>;
  leaving?: boolean;
  onLeft?: () => void;
}) => (
  <div
    className="htoast-body"
    data-leaving={leaving ? "" : undefined}
    inert={leaving || undefined}
    onAnimationEnd={leaving ? onLeft : undefined}
  >
    {cloneElement(icon, {
      className: withClass("htoast-icon", icon.props.className),
      "aria-hidden": true,
      focusable: "false",
    })}
    <div className="htoast-content">
      <span className="htoast-title">{item.title}</span>
      {item.description && (
        <span className="htoast-description">{item.description}</span>
      )}
    </div>
    {item.action && (
      <Button
        variant="secondary"
        size="small"
        disabled={item.action.disabled}
        onClick={item.action.onClick}
      >
        {item.action.label}
      </Button>
    )}
  </div>
);

const ToastItem = ({
  item,
  icons,
}: {
  item: Shown;
  icons: ToasterProps["icons"];
}) => {
  const [left, setLeft] = useState(-1);
  const status = item.status ?? "info";
  const previous = item.previous && item.previous.version > left ? item.previous : undefined;
  return (
    <li
      className="htoast"
      data-status={status}
      data-removed={item.removed ? "" : undefined}
      inert={item.removed || undefined}
    >
      {previous && (
        <ToastBody
          key={previous.version}
          item={previous}
          icon={icons[previous.status ?? "info"]}
          leaving
          onLeft={() => setLeft(previous.version)}
        />
      )}
      <ToastBody key={item.version} item={item} icon={icons[status]} />
    </li>
  );
};

export const Toaster = ({
  label,
  icons,
  position = "bottom-center",
  hotkey = "F8",
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: ToasterProps) => {
  const toasts = useSyncExternalStore(subscribe, () => shown, () => none);
  const region = useRef<HTMLElement | null>(null);
  const regionRef = useMergedRef(region, ref);
  const polite = useRef<HTMLDivElement | null>(null);
  const assertive = useRef<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  const [epoch, setEpoch] = useState(0);
  const hovered = useRef(false);
  const returnTo = useRef<HTMLElement | null>(null);
  const lastFocused = useRef<Element | null>(null);
  const lostFocusAt = useRef(0);
  const sizes = useRef(new Map<string, Size>());
  const announced = useRef(new Map<string, number>());
  const clocks = useRef(new Map<string, Clock>());
  const due = useRef(new Set<string>());
  const forgetting = useRef(new Set<string>());
  const lastExit = useRef(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const paused = expanded || hidden;
  const pausedNow = useRef(paused);
  pausedNow.current = paused;

  // Spread out while hovered with a mouse, or while focus is inside.
  const update = () =>
    setExpanded(
      shown.some((item) => !item.removed) &&
        (hovered.current || !!region.current?.contains(document.activeElement)),
    );

  // Focus goes back where it was before F8, or, with nowhere to go back to,
  // leaves the toasts.
  const giveFocusBack = () => {
    const back = returnTo.current;
    returnTo.current = null;
    if (back?.isConnected && !region.current?.contains(back)) back.focus();
    else (document.activeElement as HTMLElement | null)?.blur();
  };

  // Those whose time is up leave one at a time, the oldest first.
  const leaveInTurn = () => {
    clearTimeout(exitTimer.current);
    if (!due.current.size || pausedNow.current) return;
    const wait = lastExit.current + EXIT_SPACING - Date.now();
    if (wait > 0) {
      exitTimer.current = setTimeout(leaveInTurn, wait);
      return;
    }
    const oldest = shown.find((item) => !item.removed && due.current.has(item.key));
    if (!oldest) {
      due.current.clear();
      return;
    }
    due.current.delete(oldest.key);
    lastExit.current = Date.now();
    dismiss(oldest.id);
    if (due.current.size) exitTimer.current = setTimeout(leaveInTurn, EXIT_SPACING);
  };

  // Each toast counts its own time, held while the stack is spread out or the
  // page is hidden; a changed toast starts again.
  useEffect(() => {
    const live = toasts.filter((item) => !item.removed);
    const keys = new Set(live.map((item) => item.key));
    for (const [key, clock] of clocks.current) {
      if (keys.has(key)) continue;
      clearTimeout(clock.handle);
      clocks.current.delete(key);
      due.current.delete(key);
    }
    for (const item of live) {
      let clock = clocks.current.get(item.key);
      if (!clock || clock.version !== item.version) {
        clearTimeout(clock?.handle);
        due.current.delete(item.key);
        clock = { version: item.version, remaining: item.duration ?? DURATION };
        clocks.current.set(item.key, clock);
      }
      if (paused) {
        if (clock.handle === undefined) continue;
        clearTimeout(clock.handle);
        clock.handle = undefined;
        clock.remaining -= Date.now() - (clock.started ?? Date.now());
      } else if (
        clock.handle === undefined &&
        clock.remaining !== Infinity &&
        !due.current.has(item.key)
      ) {
        const running = clock;
        const key = item.key;
        running.started = Date.now();
        running.handle = setTimeout(() => {
          running.handle = undefined;
          due.current.add(key);
          leaveInTurn();
        }, running.remaining);
      }
    }
    leaveInTurn();
  }, [toasts, paused]);

  // Unmounted, or unmounted and mounted again by StrictMode: each clock keeps
  // the time it has left, so it starts again from there.
  useEffect(
    () => () => {
      for (const clock of clocks.current.values()) {
        if (clock.handle === undefined) continue;
        clearTimeout(clock.handle);
        clock.handle = undefined;
        clock.remaining -= Date.now() - (clock.started ?? Date.now());
      }
      clearTimeout(exitTimer.current);
    },
    [],
  );

  // In the top layer from the start, rendered in place, until the holder
  // takes it; before the toasts are measured, since a closed popover isn't
  // rendered and has no size to measure.
  useLayoutEffect(() => {
    const element = region.current;
    if (element && !element.matches(":popover-open")) element.showPopover();
  }, [host]);

  // Measures each toast as it comes or changes, or when the window or its
  // fonts change, then places them: newest in front, each further one back by
  // its place, or, spread out, above the ones in front of it. Announces each
  // as it comes or changes, and keeps focus with the toasts, or gives it
  // back, when the one it was in leaves.
  useLayoutEffect(() => {
    const element = region.current;
    const items = element?.querySelector(".htoaster-list")?.children;
    if (!element || !items) return;
    toasts.forEach((item, index) => {
      const node = items[index] as HTMLElement | undefined;
      if (!node) return;
      let size = sizes.current.get(item.key);
      if (!size || size.version !== item.version || size.epoch !== epoch) {
        const leaving = node.querySelector<HTMLElement>(":scope > .htoast-body[data-leaving]");
        if (leaving && size && size.version !== item.version && !leaving.style.inlineSize) {
          leaving.style.inlineSize = `${size.width - 2}px`;
        }
        // What was focused is in what it showed before, now inert: focus
        // stays with the toasts.
        const active = document.activeElement;
        const justLost = Date.now() - lostFocusAt.current < 300;
        if (
          leaving &&
          (leaving.contains(active) ||
            (active === document.body && justLost && !!lastFocused.current && leaving.contains(lastFocused.current)))
        ) {
          lastFocused.current = null;
          element.focus();
        }
        const body = node.querySelector<HTMLElement>(":scope > .htoast-body:not([data-leaving])");
        if (!body) return;
        const { width, height } = measure(body);
        // Not shown, it has no size; it's measured again once it is.
        if (!Number.isFinite(width) || !Number.isFinite(height)) return;
        size = { version: item.version, epoch, width: width + 2, height: height + 2 };
        sizes.current.set(item.key, size);
      }
      node.style.setProperty("--htoast-body-width", `${size.width - 2}px`);
      node.style.setProperty("--htoast-width", `${size.width}px`);
      node.style.setProperty("--htoast-height", `${size.height}px`);

      if (!item.removed && announced.current.get(item.key) !== item.version) {
        announced.current.set(item.key, item.version);
        const body = node.querySelector<HTMLElement>(":scope > .htoast-body:not([data-leaving])");
        const lines = [
          body?.querySelector(".htoast-title")?.textContent,
          body?.querySelector(".htoast-description")?.textContent,
        ].filter(Boolean) as string[];
        const announcer = urgent(item.status) ? assertive : polite;
        setTimeout(() => {
          const target = announcer.current;
          if (!target || !lines.length) return;
          const note = document.createElement("div");
          for (const line of lines) {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            note.append(paragraph);
          }
          target.append(note);
          setTimeout(() => note.remove(), ANNOUNCE_TIME);
        }, ANNOUNCE_DELAY);
      }

      // Gone once its exit has played: as long as its longest transition,
      // whatever the tokens make that.
      if (item.removed && !forgetting.current.has(item.key)) {
        forgetting.current.add(item.key);
        const seconds = Math.max(
          0,
          ...getComputedStyle(node).transitionDuration.split(",").map(parseFloat),
        );
        setTimeout(() => {
          forgetting.current.delete(item.key);
          sizes.current.delete(item.key);
          announced.current.delete(item.key);
          forget(item.key);
        }, seconds * 1000 + 50);
      }

      // Only when focus went with it, not when it left for the page earlier.
      if (item.removed && lastFocused.current && node.contains(lastFocused.current)) {
        const active = document.activeElement;
        const justLost = Date.now() - lostFocusAt.current < 300;
        if (!active || node.contains(active) || (active === document.body && justLost)) {
          lastFocused.current = null;
          if (toasts.some((other) => !other.removed)) element.focus();
          else giveFocusBack();
        }
      }
    });
    const live = toasts
      .map((item, index) => ({ item, node: items[index] as HTMLElement | undefined }))
      .filter(({ item, node }) => node && !item.removed)
      .reverse();
    let offset = 0;
    live.forEach(({ item, node }, index) => {
      if (!node) return;
      node.style.setProperty("--htoast-index", `${index}`);
      node.style.setProperty("--htoast-offset", `${offset}px`);
      node.toggleAttribute("data-front", index === 0);
      node.toggleAttribute("data-beyond", index > 2);
      offset += (sizes.current.get(item.key)?.height ?? 0) + GAP;
    });
    const front = live[0] && sizes.current.get(live[0].item.key);
    if (front) {
      element.style.setProperty("--htoaster-front-width", `${front.width}px`);
      element.style.setProperty("--htoaster-front-height", `${front.height}px`);
      element.style.setProperty("--htoaster-spread", `${offset - front.height - GAP}px`);
    }
    // The region's width: the widest toast shown at its own size, the front
    // one, one leaving from the front, or, spread out, any of them.
    const widths = toasts
      .filter((_, index) => expanded || (items[index] as HTMLElement | undefined)?.hasAttribute("data-front"))
      .map((item) => sizes.current.get(item.key)?.width ?? 0);
    const width = Math.max(front?.width ?? 0, ...widths);
    if (width) element.style.setProperty("--htoaster-width", `${width}px`);
    if (!live.length && expanded) setExpanded(false);
  });

  // A holder it owns, which it moves, so the region moves without React
  // building it again: in the page, or inside an open modal dialog, where it
  // isn't inert. Rendered in place on the server and at first, then in it.
  useEffect(() => {
    const element = document.createElement("div");
    element.style.display = "contents";
    document.body.append(element);
    setHost(element);
    return () => element.remove();
  }, []);

  // Where the person is: inside the topmost open modal dialog, else on the
  // page. It stays in a dialog until the dialog closes, or is taken out of the
  // page: while its exit plays, the dialog is still modal, and outside it the
  // toasts would be inert, and what they announce unread.
  useEffect(() => {
    if (!host) return;
    const modals: HTMLDialogElement[] = [];
    // Moved, each toast is in the page again and would start over. Noting
    // where each one is, as --htoast-moved-*, and marking it data-moved, lets
    // it carry on from there; a toast that comes during the move, unmarked,
    // comes in as usual. What a changed toast showed fades on from where it
    // was.
    const note = () => {
      const items = region.current?.querySelector(".htoaster-list")?.children ?? [];
      const noted: HTMLElement[] = [];
      for (const item of items as Iterable<HTMLElement>) {
        const style = getComputedStyle(item);
        item.style.setProperty("--htoast-moved-opacity", style.opacity);
        item.style.setProperty("--htoast-moved-transform", style.transform);
        item.style.setProperty("--htoast-moved-width", style.width);
        item.style.setProperty("--htoast-moved-height", style.height);
        noted.push(item);
        for (const body of item.querySelectorAll<HTMLElement>(":scope > .htoast-body")) {
          if (body.hasAttribute("data-leaving")) {
            const elapsed = Number(body.getAnimations()[0]?.currentTime ?? 0);
            body.style.animationDelay = `-${elapsed}ms`;
            continue;
          }
          const bodyStyle = getComputedStyle(body);
          item.style.setProperty("--htoast-moved-body-opacity", bodyStyle.opacity);
          item.style.setProperty("--htoast-moved-body-filter", bodyStyle.filter);
          noted.push(body);
        }
      }
      for (const node of noted) node.setAttribute("data-moved", "");
      return noted;
    };
    const place = () => {
      const section = region.current;
      const parent = modals.at(-1) ?? document.body;
      if (host.parentElement === parent && section?.matches(":popover-open")) return;
      const noted = note();
      if (section?.matches(":popover-open")) section.hidePopover();
      parent.append(host);
      section?.showPopover();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const node of noted) node.removeAttribute("data-moved");
        }),
      );
    };
    const enter = (dialog: HTMLDialogElement) => {
      if (modals.includes(dialog)) return;
      modals.push(dialog);
      place();
    };
    const leave = (dialog: HTMLDialogElement) => {
      const index = modals.indexOf(dialog);
      if (index < 0) return;
      modals.splice(index, 1);
      place();
    };
    const toggled = (event: Event) => {
      const dialog = event.target;
      if (
        dialog instanceof HTMLDialogElement &&
        (event as ToggleEvent).newState === "open" &&
        dialog.matches(":modal") &&
        !dialog.hasAttribute("data-closing")
      ) {
        enter(dialog);
      }
    };
    const toggling = (event: Event) => {
      const dialog = event.target;
      if (dialog instanceof HTMLDialogElement && (event as ToggleEvent).newState === "closed") {
        leave(dialog);
      }
    };
    const observer = new MutationObserver((records) => {
      if (!modals.length) return;
      for (const record of records) {
        if (!record.removedNodes.length) continue;
        for (const open of [...modals]) if (!open.isConnected) leave(open);
      }
    });
    // Any already open: the one with focus on top, since only the topmost
    // modal can have it; the others in the page's order.
    const open = [...document.querySelectorAll("dialog")].filter((dialog) => dialog.matches(":modal"));
    const focused = open.find((dialog) => dialog.contains(document.activeElement));
    modals.push(...open.filter((dialog) => dialog !== focused), ...(focused ? [focused] : []));
    place();
    document.addEventListener("toggle", toggled, true);
    document.addEventListener("beforetoggle", toggling, true);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => {
      document.removeEventListener("toggle", toggled, true);
      document.removeEventListener("beforetoggle", toggling, true);
      observer.disconnect();
    };
  }, [host]);

  // At the start or end, a toast has less room: measured again.
  const placed = useRef(position);
  useEffect(() => {
    if (placed.current === position) return;
    placed.current = position;
    setEpoch((value) => value + 1);
  }, [position]);

  // The hotkey moves focus to the toasts, remembering where it was, unless
  // it's already there; Escape there gives it back. The window's size and
  // late fonts change how toasts fit, so they're measured again.
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const element = region.current;
      if (!element) return;
      if (event.key === hotkey && shown.some((item) => !item.removed)) {
        event.preventDefault();
        if (!element.contains(document.activeElement)) {
          returnTo.current = document.activeElement as HTMLElement | null;
        }
        element.focus();
      } else if (event.key === "Escape" && element.contains(document.activeElement)) {
        event.preventDefault();
        giveFocusBack();
      }
    };
    const visibility = () => setHidden(document.hidden);
    const tapOutside = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "mouse") return;
      if (region.current?.contains(event.target as Node)) return;
      hovered.current = false;
      update();
    };
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setEpoch((value) => value + 1));
    };
    visibility();
    document.addEventListener("keydown", keydown);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("pointerdown", tapOutside);
    addEventListener("resize", remeasure);
    document.fonts?.addEventListener("loadingdone", remeasure);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("pointerdown", tapOutside);
      removeEventListener("resize", remeasure);
      document.fonts?.removeEventListener("loadingdone", remeasure);
    };
  }, [hotkey]);

  const section = (
    <section
      {...props}
      ref={regionRef}
      className={withClass("htoaster", className)}
      popover="manual"
      tabIndex={-1}
      aria-label={label}
      data-position={position === "bottom-center" ? undefined : position}
      data-expanded={expanded ? "" : undefined}
      onPointerEnter={(event: PointerEvent<HTMLElement>) => {
        onPointerEnter?.(event);
        if (
          event.pointerType === "mouse" &&
          matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          hovered.current = true;
          update();
        }
      }}
      onPointerLeave={(event: PointerEvent<HTMLElement>) => {
        onPointerLeave?.(event);
        if (event.pointerType !== "mouse") return;
        hovered.current = false;
        update();
      }}
      onPointerDown={(event: PointerEvent<HTMLElement>) => {
        onPointerDown?.(event);
        if (event.pointerType === "mouse") return;
        hovered.current = true;
        update();
      }}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        onFocus?.(event);
        lastFocused.current = event.target;
        update();
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        onBlur?.(event);
        const next = event.relatedTarget;
        if (next && !region.current?.contains(next as Node)) lastFocused.current = null;
        else if (!next) lostFocusAt.current = Date.now();
        requestAnimationFrame(update);
      }}
    >
      <ol className="htoaster-list">
        {toasts.map((item) => (
          <ToastItem key={item.key} item={item} icons={icons} />
        ))}
      </ol>
      <div className="htoaster-announce" role="status" aria-atomic="false" ref={polite} />
      <div className="htoaster-announce" role="alert" aria-atomic="false" ref={assertive} />
    </section>
  );

  return host ? createPortal(section, host) : section;
};
