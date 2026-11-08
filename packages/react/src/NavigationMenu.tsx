"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { renders } from "./children.ts";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface NavigationMenuProps extends ComponentPropsWithRef<"nav"> {
  "aria-label": string;
  orientation?: "vertical";
  align?: "start";
}

export interface NavigationMenuLinkProps extends ComponentPropsWithRef<"a"> {
  href: string;
  current?: boolean;
}

export interface NavigationMenuItemProps
  extends Omit<ComponentPropsWithRef<"button">, "type"> {
  label: ReactNode;
}

export interface NavigationMenuRowProps
  extends Omit<ComponentPropsWithRef<"a">, "children"> {
  href: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  current?: boolean;
}

interface MenuState {
  active: string | null;
  // The pointer came to a trigger, or to a link, which is null.
  enter: (id: string | null) => void;
  press: (id: string) => void;
}

const MenuContext = createContext<MenuState | null>(null);

const useMenu = () => {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error("A NavigationMenu's parts go inside a NavigationMenu");
  return menu;
};

const contents = (nav: HTMLElement) => [
  ...nav.querySelectorAll<HTMLElement>(":scope > ul > li > .hnavigation-menu-content"),
];

// The frame's size, from the rows', and how far to move it to stay 8px inside
// the window. It sits at the menu's end, or with data-align="start", its start.
const placeFrame = (nav: HTMLElement, rows: HTMLElement) => {
  nav.style.setProperty("--hnavigation-menu-width", `${rows.offsetWidth}px`);
  nav.style.setProperty("--hnavigation-menu-height", `${rows.offsetHeight}px`);
  const width = rows.offsetWidth + 18;
  const box = nav.getBoundingClientRect();
  const rtl = getComputedStyle(nav).direction === "rtl";
  const atEnd = nav.dataset.align !== "start";
  const left = rtl === atEnd ? box.left : box.right - width;
  const furthest = Math.max(document.documentElement.clientWidth - 8 - width, 8);
  nav.style.setProperty("--hnavigation-menu-shift", `${Math.min(Math.max(left, 8), furthest) - left}px`);
};

// A trigger the pointer can't open.
const inactive = (item: HTMLElement) => {
  const trigger = item.querySelector<HTMLButtonElement>(":scope > .hnavigation-menu-trigger");
  return trigger?.disabled || trigger?.getAttribute("aria-disabled") === "true";
};

export const NavigationMenu = ({
  orientation,
  align,
  className,
  children,
  ref,
  onPointerLeave,
  onClick,
  onFocus,
  onBlur,
  ...props
}: NavigationMenuProps) => {
  const nav = useRef<HTMLElement>(null);
  const mergedRef = useMergedRef(nav as Ref<HTMLElement>, ref as Ref<HTMLElement> | undefined);
  const [active, setActive] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  // Opened by a click, it stays when the pointer leaves.
  const pinned = useRef(false);
  const vertical = orientation === "vertical";

  const openItem = () =>
    active === null ? null : (document.getElementById(active)?.parentElement ?? null);
  // While the keyboard is in the open item, the pointer leaves it alone.
  const keyboardInside = () => !!openItem()?.querySelector(":focus-visible");

  const show = (id: string, pin: boolean) => {
    // The pointer coming back over its own trigger doesn't unpin a panel.
    if (id === active) {
      pinned.current ||= pin;
      return;
    }
    pinned.current = pin;
    setMoving(active !== null);
    setActive(id);
  };
  // `moving` stays set, so a move that's under way finishes as it fades.
  const hide = useCallback(() => {
    pinned.current = false;
    setActive(null);
  }, []);

  // The frame takes the size of the open panel's rows, on screen, and the
  // other panels wait to the side their triggers are on, before the browser
  // paints, and again if the rows or the window change.
  useLayoutEffect(() => {
    const element = nav.current;
    if (!element || active === null || vertical) return;
    const panels = contents(element);
    const index = panels.findIndex((panel) => panel.id === active);
    const rows = panels[index]?.querySelector<HTMLElement>(".hnavigation-menu-rows");
    if (!rows) return;
    panels.forEach((panel, position) => {
      if (position === index) panel.removeAttribute("data-position");
      else panel.setAttribute("data-position", position < index ? "before" : "after");
    });
    const measure = () => placeFrame(element, rows);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rows);
    addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      removeEventListener("resize", measure);
    };
  }, [active, vertical, align]);

  // If the open item is removed or hidden, there's nothing left to show.
  useLayoutEffect(() => {
    if (active === null) return;
    const panel = document.getElementById(active);
    if (!panel || panel.closest("li")?.hidden) hide();
  });

  // A vertical menu is part of the page, as an Accordion is: Escape and a
  // press outside are for whatever it's in. A panel takes Escape for itself,
  // so whatever it's in stays open.
  useEffect(() => {
    if (active === null || vertical) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const inside = nav.current?.contains(document.activeElement);
      const trigger = document.getElementById(active)?.previousElementSibling as HTMLElement | null;
      hide();
      if (inside) trigger?.focus();
    };
    const away = (event: globalThis.PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) hide();
    };
    addEventListener("keydown", escape);
    addEventListener("pointerdown", away);
    return () => {
      removeEventListener("keydown", escape);
      removeEventListener("pointerdown", away);
    };
  }, [active, vertical, hide]);

  // In a Popup, it starts closed each time the Popup opens.
  useEffect(() => {
    const popover = nav.current?.closest("[popover]");
    if (!popover) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") hide();
    };
    popover.addEventListener("toggle", toggled);
    return () => popover.removeEventListener("toggle", toggled);
  }, [hide]);

  const menu: MenuState = {
    active,
    enter: (id) => {
      if (vertical || keyboardInside()) return;
      if (id !== null) show(id, false);
      else if (!pinned.current) hide();
    },
    // A press on a panel the pointer opened keeps it open; another closes it.
    press: (id) => {
      if (active !== id) show(id, true);
      else if (pinned.current) hide();
      else pinned.current = true;
    },
  };

  return (
    <MenuContext value={menu}>
      <nav
        {...props}
        ref={mergedRef}
        className={withClass("hnavigation-menu", className)}
        data-orientation={orientation}
        data-align={align}
        data-open={active !== null ? "" : undefined}
        data-moving={moving ? "" : undefined}
        onPointerLeave={(event: PointerEvent<HTMLElement>) => {
          onPointerLeave?.(event);
          if (event.pointerType !== "mouse" || vertical || pinned.current || keyboardInside()) return;
          hide();
        }}
        onClick={(event: MouseEvent<HTMLElement>) => {
          onClick?.(event);
          if (vertical || !(event.target as Element).closest("a")) return;
          // A click with a modifier key opens a new tab, and this one stays.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const item = openItem();
          const trigger = item?.querySelector<HTMLElement>(":scope > .hnavigation-menu-trigger");
          const inside = item?.contains(document.activeElement);
          hide();
          if (inside) trigger?.focus();
        }}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          onFocus?.(event);
          if (vertical) return;
          const item = openItem();
          if (item && !item.contains(event.target)) hide();
        }}
        onBlur={(event: FocusEvent<HTMLElement>) => {
          onBlur?.(event);
          if (vertical) return;
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) hide();
        }}
      >
        <div className="hnavigation-menu-frame" aria-hidden="true" />
        <ul className="hnavigation-menu-list">{children}</ul>
      </nav>
    </MenuContext>
  );
};

export const NavigationMenuLink = ({
  current,
  className,
  hidden,
  ...props
}: NavigationMenuLinkProps) => {
  const menu = useMenu();
  const Anchor = useLinkComponent();

  return (
    <li
      hidden={hidden}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") menu.enter(null);
      }}
    >
      <Anchor
        {...props}
        className={withClass("hnavigation-menu-link", className)}
        aria-current={current ? "page" : undefined}
      />
    </li>
  );
};

export const NavigationMenuItem = ({
  label,
  className,
  children,
  hidden,
  onClick,
  ...props
}: NavigationMenuItemProps) => {
  const menu = useMenu();
  const id = useId();

  return (
    <li
      hidden={hidden}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && !inactive(event.currentTarget)) menu.enter(id);
      }}
    >
      <button
        {...props}
        className={withClass("hnavigation-menu-trigger", className)}
        type="button"
        aria-expanded={menu.active === id}
        aria-controls={id}
        onClick={(event) => {
          onClick?.(event);
          if (!inactive(event.currentTarget.parentElement as HTMLElement)) menu.press(id);
        }}
      >
        {label}
        <ExpandChevron />
      </button>
      <div className="hnavigation-menu-content" id={id} inert={menu.active !== id}>
        <ul className="hnavigation-menu-rows">{children}</ul>
      </div>
    </li>
  );
};

export const NavigationMenuRow = ({
  label,
  description,
  icon,
  current,
  className,
  hidden,
  ...props
}: NavigationMenuRowProps) => {
  const Anchor = useLinkComponent();

  return (
    <li hidden={hidden}>
      <Anchor
        {...props}
        className={withClass("hnavigation-menu-row", className)}
        aria-current={current ? "page" : undefined}
      >
        {renders(icon) && (
          <span className="hnavigation-menu-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="hnavigation-menu-text">
          <span className="hnavigation-menu-title">{label}</span>
          {renders(description) && <span className="hnavigation-menu-description">{description}</span>}
        </span>
      </Anchor>
    </li>
  );
};
