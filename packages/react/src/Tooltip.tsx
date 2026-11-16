"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { milliseconds } from "./milliseconds.ts";
import { withClass } from "./withClass.ts";

interface TooltipControl {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
}

interface TooltipOptions
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  side?: "top" | "left" | "right" | "inline-start" | "inline-end";
  variant?: "hint";
  children: ReactElement<TooltipControl>;
}

export type TooltipProps = TooltipOptions &
  (
    | { label: ReactNode; description?: never }
    | { description?: ReactNode; label?: never }
  );

let lastHide = -Infinity;
let lastTrigger: HTMLElement | null = null;

const openedAt = new WeakMap<EventTarget, number>();
let openings = 0;

if (typeof document !== "undefined") {
  document.addEventListener(
    "beforetoggle",
    (event) => {
      if ((event as ToggleEvent).newState === "open" && event.target) {
        openedAt.set(event.target, ++openings);
      }
    },
    true,
  );
}

const topmost = (element: HTMLElement) => {
  const open = Array.from(
    document.querySelectorAll(':popover-open:not([popover="manual"]), dialog:modal'),
  );
  const order = (layer: Element) => openedAt.get(layer) ?? 0;
  const latest = Math.max(...open.map(order));
  return open.every((layer) => order(layer) < latest || layer.contains(element));
};

export const useTooltip = (open = false) => {
  const tooltip = useRef<HTMLSpanElement>(null);
  const element = useRef<HTMLElement | null>(null);
  const entered = useRef(0);
  const delay = useRef(0);
  const [dismissed, setDismissed] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDismissed(false);
  }

  const shown = () =>
    tooltip.current !== null &&
    tooltip.current.checkVisibility({ visibilityProperty: true });

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !shown()) return;
      setDismissed(true);
      lastHide = performance.now();
      if (topmost(tooltip.current as HTMLElement)) event.preventDefault();
    };
    const focused = (event: FocusEvent) => {
      const trigger = tooltip.current?.closest(".htooltip-trigger");
      if (trigger?.contains(event.target as Node) && trigger.matches(":has(:focus-visible)")) {
        trigger.setAttribute("data-instant", "");
      }
    };
    addEventListener("keydown", dismiss);
    addEventListener("focusin", focused);
    return () => {
      removeEventListener("keydown", dismiss);
      removeEventListener("focusin", focused);
    };
  }, []);

  return {
    trigger: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        const recent = performance.now() - lastHide < 400;
        const trigger = event.currentTarget;
        trigger.style.setProperty("--htooltip-delay", recent ? "0ms" : "");
        trigger.toggleAttribute("data-instant", recent);
        if (recent && lastTrigger !== trigger) {
          lastTrigger?.setAttribute("data-instant", "");
        }
        element.current = trigger;
        entered.current = performance.now();
        delay.current = recent
          ? 0
          : milliseconds(
              getComputedStyle(event.currentTarget).getPropertyValue(
                "--harmo-tooltip-delay",
              ),
              300,
            );
      },
      onPointerLeave: () => {
        if (performance.now() - entered.current >= delay.current) {
          lastHide = performance.now();
          lastTrigger = element.current;
        }
        setDismissed(false);
      },
      onBlur: () => setDismissed(false),
    },
    tooltip: { ref: tooltip, "data-dismissed": dismissed ? "" : undefined },
  };
};

export const Tooltip = ({
  label,
  description,
  side,
  variant,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  onBlur,
  ...props
}: TooltipProps) => {
  const id = useId();
  const { trigger, tooltip } = useTooltip(
    (props as { "data-open"?: unknown })["data-open"] != null,
  );
  const names = label !== undefined && label !== null;
  const text = names ? label : description;
  const shown = renders(text);

  const join = (ids?: string) => (ids ? `${ids} ${id}` : id);
  const control = !shown
    ? children
    : cloneElement(
        children,
        names
          ? { "aria-labelledby": join(children.props["aria-labelledby"]) }
          : { "aria-describedby": join(children.props["aria-describedby"]) },
      );

  return (
    <span
      {...props}
      className={withClass("htooltip-trigger", className)}
      onPointerEnter={(event) => {
        trigger.onPointerEnter(event);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        trigger.onPointerLeave();
        onPointerLeave?.(event);
      }}
      onBlur={(event) => {
        trigger.onBlur();
        onBlur?.(event);
      }}
    >
      {control}
      {shown && (
        <span
          {...tooltip}
          className="htooltip"
          role="tooltip"
          id={id}
          data-side={side}
          data-variant={variant}
        >
          {text}
        </span>
      )}
    </span>
  );
};
