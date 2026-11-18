"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Chevron } from "./Chevron.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { Popup, type PopupProps } from "./Popup.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

interface MenuTrigger {
  id?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface DropdownMenuProps extends Omit<PopupProps, "trigger" | "role"> {
  trigger: ReactElement<MenuTrigger>;
}

type Focus = "first" | "last" | "menu" | "none";

const menuOf = (element: Element) => element.closest(".hdropdown-menu");

const itemsOf = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>(".hdropdown-menu-item")).filter(
    (item) => menuOf(item) === menu && !item.matches(":disabled") && !item.closest("[hidden]"),
  );

const rootOf = (menu: HTMLElement) => {
  let root = menu;
  for (let outer = menu.parentElement && menuOf(menu.parentElement); outer; outer = outer.parentElement && menuOf(outer.parentElement)) {
    root = outer as HTMLElement;
  }
  return root;
};

const triggerOf = (menu: HTMLElement) =>
  Array.from(menu.ownerDocument.querySelectorAll<HTMLElement>(`[popovertarget="${CSS.escape(menu.id)}"]`)).find(
    (element) => !menu.contains(element),
  );

const subOf = (item: Element) => {
  const id = item.getAttribute("aria-haspopup") === "menu" ? item.getAttribute("popovertarget") : null;
  return id ? item.ownerDocument.getElementById(id) : null;
};

const openSubOf = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>(".hdropdown-menu:popover-open")).find(
    (inner) => inner.parentElement && menuOf(inner.parentElement) === menu,
  );

// Focus, and the menu scrolled to show the item clear of its scroll arrows,
// by the item's offset and the menu's scroll-padding: neither focus() nor
// scrollIntoView() goes far enough in a submenu, a popup in the top layer
// inside another.
const focusItem = (item: HTMLElement) => {
  item.focus({ preventScroll: true });
  const menu = item.closest<HTMLElement>(".hdropdown-menu");
  if (!menu) return;
  const room = parseFloat(getComputedStyle(menu).scrollPaddingBlockStart) || 0;
  const top = item.offsetTop - room;
  const bottom = item.offsetTop + item.offsetHeight + room;
  if (top < menu.scrollTop) menu.scrollTop = top;
  else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
};

const forward = (element: Element, key: string) =>
  key === (getComputedStyle(element).direction === "rtl" ? "ArrowLeft" : "ArrowRight");

const Menu = ({
  trigger,
  sub,
  className,
  ref,
  onToggle,
  onKeyDown,
  onPointerMove,
  onPointerLeave,
  onClick,
  children,
  ...props
}: DropdownMenuProps & { sub?: boolean }) => {
  const generatedId = useId();
  const triggerId = trigger.props.id ?? `${generatedId}-trigger`;
  const menu = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(menu, ref);
  const rest: Focus = sub ? "none" : "menu";
  const focusOnOpen = useRef<Focus>(rest);
  const fromKeys = useRef(false);
  const typed = useRef("");
  const typedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const subTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelSub = () => {
    clearTimeout(subTimer.current);
    subTimer.current = undefined;
  };
  useEffect(() => cancelSub, []);

  const focusTo = (to: Focus) => {
    const element = menu.current;
    if (!element || to === "none") return;
    const items = itemsOf(element);
    const target = to === "first" ? items[0] : to === "last" ? items.at(-1) : undefined;
    if (target) focusItem(target);
    else element.focus();
  };

  const findTyped = (key: string, items: HTMLElement[], from: number) => {
    clearTimeout(typedTimer.current);
    typedTimer.current = setTimeout(() => (typed.current = ""), 500);
    typed.current += key.toLowerCase();
    const cycling = [...typed.current].every((letter) => letter === typed.current[0]);
    const text = cycling ? typed.current[0] : typed.current;
    const start = from < 0 ? 0 : from + (cycling ? 1 : 0);
    return [...items.slice(start), ...items.slice(0, start)].find((item) =>
      (item.textContent ?? "").trim().toLowerCase().startsWith(text ?? ""),
    );
  };

  const [ends, setEnds] = useState({ up: false, down: false });
  const scrolling = useRef(0);
  useEffect(() => {
    const node = menu.current;
    if (!node) return;
    const update = () => {
      const up = node.scrollTop > 0;
      const down = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      setEnds((now) => (now.up === up && now.down === down ? now : { up, down }));
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    node.addEventListener("toggle", update);
    node.addEventListener("transitionend", update);
    const resized = new ResizeObserver(update);
    resized.observe(node);
    const changed = new MutationObserver(update);
    changed.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    return () => {
      node.removeEventListener("scroll", update);
      node.removeEventListener("toggle", update);
      node.removeEventListener("transitionend", update);
      resized.disconnect();
      changed.disconnect();
      cancelAnimationFrame(scrolling.current);
    };
  }, []);
  const stopScrolling = () => cancelAnimationFrame(scrolling.current);
  const scrollToward = (way: 1 | -1) => () => {
    const node = menu.current;
    if (!node) return;
    stopScrolling();
    let last = performance.now();
    const step = (now: number) => {
      node.scrollTop += way * 0.5 * (now - last);
      last = now;
      const more = way < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if (more) scrolling.current = requestAnimationFrame(step);
    };
    scrolling.current = requestAnimationFrame(step);
  };
  const arrow = (direction: "up" | "down") => (
    <div
      className="hdropdown-menu-scroll"
      data-direction={direction}
      role="presentation"
      aria-hidden="true"
      onPointerEnter={scrollToward(direction === "up" ? -1 : 1)}
      onPointerLeave={stopScrolling}
    />
  );

  const opens = (event: KeyboardEvent<HTMLElement>) =>
    sub ? forward(event.currentTarget, event.key) : event.key === "ArrowDown" || event.key === "ArrowUp";

  return (
    <Popup
      {...props}
      ref={mergedRef}
      role="menu"
      tabIndex={-1}
      aria-labelledby={props["aria-label"] ? props["aria-labelledby"] : (props["aria-labelledby"] ?? triggerId)}
      className={withClass("hdropdown-menu", className)}
      trigger={cloneElement(trigger, {
        id: triggerId,
        "aria-haspopup": "menu",
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event);
          if (!fromKeys.current) focusOnOpen.current = event.detail === 0 ? "first" : rest;
          fromKeys.current = false;
          if (sub && event.detail === 0 && menu.current?.matches(":popover-open")) focusTo("first");
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          trigger.props.onKeyDown?.(event);
          if (event.defaultPrevented || !opens(event)) return;
          event.preventDefault();
          const to = event.key === "ArrowUp" ? "last" : "first";
          if (menu.current?.matches(":popover-open")) return focusTo(to);
          focusOnOpen.current = to;
          fromKeys.current = true;
          event.currentTarget.click();
        },
      } as MenuTrigger)}
      onToggle={(event) => {
        if (event.target !== event.currentTarget) return;
        onToggle?.(event);
        if (event.newState === "open") focusTo(focusOnOpen.current);
        else cancelSub();
        focusOnOpen.current = rest;
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        cancelSub();
        const element = event.currentTarget;
        if (event.key === "Tab") {
          if (rootOf(element) !== element) return;
          triggerOf(element)?.focus();
          element.hidePopover();
          return;
        }
        if (event.defaultPrevented || event.nativeEvent.isComposing) return;
        if (menuOf(event.target as Element) !== element) return;
        const items = itemsOf(element);
        const at = items.indexOf(document.activeElement as HTMLElement);
        let next: HTMLElement | undefined;
        switch (event.key) {
          case "ArrowDown":
            next = items[at < 0 ? 0 : Math.min(at + 1, items.length - 1)];
            break;
          case "ArrowUp":
            next = at < 0 ? items.at(-1) : items[Math.max(at - 1, 0)];
            break;
          case "Home":
            next = items[0];
            break;
          case "End":
            next = items.at(-1);
            break;
          case "ArrowLeft":
          case "ArrowRight":
            if (!sub || forward(element, event.key)) return;
            event.preventDefault();
            triggerOf(element)?.focus();
            element.hidePopover();
            return;
          case " ":
            if (typed.current === "" && items[at]?.matches("a")) {
              event.preventDefault();
              items[at]?.click();
              return;
            }
            if (typed.current === "") return;
            next = findTyped(event.key, items, at);
            break;
          default:
            if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return;
            next = findTyped(event.key, items, at);
        }
        event.preventDefault();
        if (next) focusItem(next);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (event.pointerType !== "mouse") return;
        const element = event.currentTarget;
        const target = event.target as Element;
        const item = target.closest<HTMLElement>(".hdropdown-menu-item");
        if (menuOf(target) !== element) return cancelSub();
        const focused = item ?? element;
        if (document.activeElement !== focused) focused.focus({ preventScroll: true });
        const open = openSubOf(element);
        const wanted = item ? subOf(item) : null;
        if (open && open === wanted) return cancelSub();
        if (open || wanted) {
          subTimer.current ??= setTimeout(() => {
            subTimer.current = undefined;
            const now = document.activeElement;
            const settled = now && element.contains(now) && menuOf(now) === element ? subOf(now) : null;
            const shown = openSubOf(element);
            if (shown && shown !== settled && !shown.contains(now)) shown.hidePopover();
            if (settled && !settled.matches(":popover-open")) settled.showPopover();
          }, open ? 200 : 100);
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (event.pointerType === "mouse" && event.currentTarget.contains(document.activeElement)) {
          event.currentTarget.focus({ preventScroll: true });
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        const element = event.currentTarget;
        const item = (event.target as Element).closest(".hdropdown-menu-item");
        if (!item || menuOf(item) !== element || subOf(item)) return;
        if (item.matches("a") && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        rootOf(element).hidePopover();
      }}
    >
      {ends.up && arrow("up")}
      {children}
      {ends.down && arrow("down")}
    </Popup>
  );
};

export const DropdownMenu = (props: DropdownMenuProps) => <Menu {...props} />;

export interface DropdownMenuSubProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

export const DropdownMenuSub = ({ label, icon, children, ...props }: DropdownMenuSubProps) => (
  <Menu
    {...props}
    sub
    trigger={
      <button
        type="button"
        className="hdropdown-menu-item"
        role="menuitem"
        tabIndex={-1}
        popoverTargetAction="show"
      >
        {icon}
        {label}
        <Chevron className="hdropdown-menu-sub-chevron" />
      </button>
    }
  >
    {children}
  </Menu>
);

export type DropdownMenuItemProps = { icon?: ReactNode; destructive?: boolean } & (
  | (ComponentPropsWithRef<"button"> & { href?: undefined })
  | (ComponentPropsWithRef<"a"> & { href: string })
);

export const DropdownMenuItem = ({ icon, destructive, className, children, ...props }: DropdownMenuItemProps) => {
  const Anchor = useLinkComponent();
  const attributes = {
    className: withClass("hdropdown-menu-item", className),
    role: "menuitem",
    tabIndex: -1,
    "data-destructive": destructive ? "" : undefined,
  };

  if (props.href !== undefined) {
    return (
      <Anchor {...props} {...attributes}>
        {icon}
        {children}
      </Anchor>
    );
  }

  return (
    <button type="button" {...(props as ComponentPropsWithRef<"button">)} {...attributes}>
      {icon}
      {children}
    </button>
  );
};

export interface DropdownMenuGroupProps extends ComponentPropsWithRef<"div"> {
  label?: ReactNode;
}

export const DropdownMenuGroup = ({ label, children, ...props }: DropdownMenuGroupProps) => {
  const id = useId();

  return (
    <div role="group" aria-labelledby={label ? id : undefined} {...props}>
      {label && (
        <div className="hdropdown-menu-group-label" id={id} role="presentation">
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = ({ className, ...props }: ComponentPropsWithRef<"div">) => (
  <div role="separator" className={withClass("hdropdown-menu-separator", className)} {...props} />
);
