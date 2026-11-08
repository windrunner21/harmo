"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { Tooltip, useTooltip } from "./Tooltip.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

const GroupsContext = createContext<string | undefined>(undefined);
const SubContext = createContext(false);

export interface SidebarProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  "aria-label": string;
  exclusive?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapseLabel?: string;
  expandLabel?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export const Sidebar = ({
  "aria-label": ariaLabel,
  exclusive,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapseLabel,
  expandLabel,
  header,
  footer,
  id,
  ref,
  className,
  children,
  ...props
}: SidebarProps) => {
  const generatedId = useId();
  const sidebarId = id ?? generatedId;
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useMergedRef(root, ref);
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? collapsedState;

  const subs = () =>
    Array.from(
      root.current?.querySelectorAll<HTMLDetailsElement>(".hsidebar-sub") ?? [],
    );

  const toggle = () => {
    const next = !isCollapsed;
    setCollapsedState(next);
    onCollapsedChange?.(next);
  };

  // Becoming collapsed, however it happens, closes the groups that were
  // open, before they'd show as panels beside the icons.
  useLayoutEffect(() => {
    if (!isCollapsed) return;
    for (const sub of subs()) sub.open = false;
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) return;
    const element = root.current;
    if (!element) return;
    const hovered = new WeakSet<HTMLDetailsElement>();
    const subOf = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLDetailsElement>(".hsidebar-sub")
        : null;
    const itemOf = (sub: HTMLDetailsElement) => sub.parentElement as HTMLElement;

    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      for (const sub of subs()) {
        if (sub.open || event.target !== itemOf(sub)) continue;
        sub.open = true;
        hovered.add(sub);
      }
    };
    // A group that has focus inside stays open as the pointer leaves.
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      for (const sub of subs()) {
        if (event.target !== itemOf(sub) || !hovered.has(sub)) continue;
        hovered.delete(sub);
        if (!sub.contains(document.activeElement)) sub.open = false;
      }
    };
    // However a group closes, it's no longer one a hover opened; and while
    // collapsed, one group opens at a time.
    const toggled = (event: Event) => {
      const sub = event.target;
      if (!(sub instanceof HTMLDetailsElement)) return;
      if (!sub.open) {
        hovered.delete(sub);
        return;
      }
      for (const other of subs()) {
        if (other === sub || !other.open) continue;
        hovered.delete(other);
        other.open = false;
      }
    };
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const picked = subOf(event.target.closest(".hsidebar-sub-item"));
      if (picked) {
        hovered.delete(picked);
        picked.open = false;
        return;
      }
      const sub = subOf(event.target.closest(".hsidebar-sub > summary"));
      if (!sub || !hovered.has(sub)) return;
      event.preventDefault();
      hovered.delete(sub);
    };
    const focusOut = (event: FocusEvent) => {
      const sub = subOf(event.target);
      if (sub?.open && !sub.contains(event.relatedTarget as Node | null)) {
        sub.open = false;
      }
    };
    // Escape closes an open group from anywhere, as one a hover opened may
    // be over the page while focus is elsewhere; focus inside goes back to
    // its summary, and focus elsewhere stays.
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const sub = subs().find((each) => each.open);
      if (!sub) return;
      event.preventDefault();
      const inside = sub.contains(document.activeElement);
      sub.open = false;
      if (inside) sub.querySelector<HTMLElement>(":scope > summary")?.focus();
    };
    const pointerDown = (event: PointerEvent) => {
      for (const sub of subs()) {
        if (sub.open && !itemOf(sub).contains(event.target as Node)) {
          sub.open = false;
        }
      }
    };

    element.addEventListener("pointerenter", enter, true);
    element.addEventListener("pointerleave", leave, true);
    element.addEventListener("toggle", toggled, true);
    element.addEventListener("click", click);
    element.addEventListener("focusout", focusOut);
    addEventListener("keydown", keyDown);
    addEventListener("pointerdown", pointerDown);
    return () => {
      element.removeEventListener("pointerenter", enter, true);
      element.removeEventListener("pointerleave", leave, true);
      element.removeEventListener("toggle", toggled, true);
      element.removeEventListener("click", click);
      element.removeEventListener("focusout", focusOut);
      removeEventListener("keydown", keyDown);
      removeEventListener("pointerdown", pointerDown);
    };
  }, [isCollapsed]);

  return (
    <div
      {...props}
      ref={rootRef}
      id={sidebarId}
      className={withClass("hsidebar", className)}
      data-collapsed={isCollapsed ? "" : undefined}
    >
      {collapseLabel !== undefined && expandLabel !== undefined && (
        <Tooltip
          label={isCollapsed ? expandLabel : collapseLabel}
          side="right"
          className="hsidebar-toggle"
        >
          <button
            className="hsidebar-toggle-button"
            type="button"
            aria-expanded={!isCollapsed}
            aria-controls={sidebarId}
            onClick={toggle}
          >
            {toggleIcon}
          </button>
        </Tooltip>
      )}
      {renders(header) && <div className="hsidebar-header">{header}</div>}
      <nav className="hsidebar-nav" aria-label={ariaLabel}>
        <GroupsContext value={exclusive ? `${generatedId}-groups` : undefined}>
          {children}
        </GroupsContext>
      </nav>
      {renders(footer) && <div className="hsidebar-footer">{footer}</div>}
    </div>
  );
};

export interface SidebarGroupProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label?: ReactNode;
  children?: ReactNode;
}

export const SidebarGroup = ({
  label,
  className,
  children,
  ...props
}: SidebarGroupProps) => {
  const labelId = useId();
  const labelled = renders(label);

  return (
    <div {...props} className={withClass("hsidebar-group", className)}>
      {labelled && (
        <p className="hsidebar-group-label" id={labelId}>
          {label}
        </p>
      )}
      <ul
        className="hsidebar-list"
        aria-labelledby={labelled ? labelId : undefined}
      >
        {children}
      </ul>
    </div>
  );
};

export interface SidebarItemProps extends ComponentPropsWithRef<"a"> {
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  current?: boolean;
}

export const SidebarItem = ({
  icon,
  badge,
  current,
  hidden,
  className,
  children,
  ...props
}: SidebarItemProps) => {
  const Anchor = useLinkComponent();
  const inSub = useContext(SubContext);
  const { trigger, tooltip } = useTooltip();

  if (inSub) {
    return (
      <li hidden={hidden}>
        <Anchor
          {...props}
          className={withClass("hsidebar-sub-item", className)}
          aria-current={current ? "page" : undefined}
        >
          {children}
        </Anchor>
      </li>
    );
  }

  return (
    <li
      className="htooltip-trigger"
      hidden={hidden}
      onPointerEnter={trigger.onPointerEnter}
      onPointerLeave={trigger.onPointerLeave}
      onBlur={trigger.onBlur}
    >
      <Anchor
        {...props}
        className={withClass("hsidebar-item", className)}
        aria-current={current ? "page" : undefined}
      >
        {icon}
        <span className="hsidebar-label">{children}</span>
        {renders(badge) && (
          <>
            {" "}
            <span className="hsidebar-badge">{badge}</span>
          </>
        )}
      </Anchor>
      <span
        {...tooltip}
        className="htooltip hsidebar-tooltip"
        data-side="right"
        aria-hidden="true"
      >
        {children}
      </span>
    </li>
  );
};

export interface SidebarSubProps
  extends Omit<ComponentPropsWithRef<"details">, "children"> {
  label: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export const SidebarSub = ({
  label,
  icon,
  open,
  defaultOpen,
  onOpenChange,
  onToggle,
  name,
  hidden,
  className,
  children,
  ...props
}: SidebarSubProps) => {
  const groups = useContext(GroupsContext);
  const [initiallyOpen] = useState(defaultOpen);
  const { trigger, tooltip } = useTooltip();

  return (
    <li
      className="htooltip-trigger"
      hidden={hidden}
      onPointerEnter={trigger.onPointerEnter}
      onPointerLeave={trigger.onPointerLeave}
      onBlur={trigger.onBlur}
    >
      <details
        {...props}
        className={withClass("hsidebar-sub", className)}
        name={name ?? groups}
        open={open ?? initiallyOpen}
        onToggle={(event) => {
          onToggle?.(event);
          if (event.target === event.currentTarget) {
            onOpenChange?.(event.currentTarget.open);
          }
        }}
      >
        <summary className="hsidebar-item">
          {icon}
          <span className="hsidebar-label">{label}</span>
          <ExpandChevron />
        </summary>
        <ul className="hsidebar-sub-list">
          <li className="hsidebar-sub-heading" aria-hidden="true">
            {label}
          </li>
          <SubContext value={true}>{children}</SubContext>
        </ul>
      </details>
      <span
        {...tooltip}
        className="htooltip hsidebar-tooltip"
        data-side="right"
        aria-hidden="true"
      >
        {label}
      </span>
    </li>
  );
};

const toggleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g className="hsidebar-toggle-head">
      <line className="hsidebar-toggle-start" x1="12" y1="4" x2="12" y2="12" />
      <line className="hsidebar-toggle-end" x1="12" y1="20" x2="12" y2="12" />
    </g>
  </svg>
);
