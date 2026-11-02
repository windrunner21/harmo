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
import { withClass } from "./withClass.ts";

interface TooltipControl {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
}

interface TooltipOptions
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  side?: "top" | "left" | "right";
  variant?: "hint";
  children: ReactElement<TooltipControl>;
}

export type TooltipProps = TooltipOptions &
  (
    | { label: ReactNode; description?: never }
    | { description?: ReactNode; label?: never }
  );

let lastHide = -Infinity;

const milliseconds = (time: string) =>
  parseFloat(time) * (time.trim().endsWith("ms") ? 1 : 1000);

export const useTooltip = () => {
  const tooltip = useRef<HTMLSpanElement>(null);
  const entered = useRef(0);
  const delay = useRef(0);
  const [dismissed, setDismissed] = useState(false);

  const shown = () =>
    tooltip.current !== null &&
    getComputedStyle(tooltip.current).visibility === "visible";

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !shown()) return;
      setDismissed(true);
      lastHide = performance.now();
    };
    addEventListener("keydown", dismiss);
    return () => removeEventListener("keydown", dismiss);
  }, []);

  return {
    trigger: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        const recent = performance.now() - lastHide < 400;
        event.currentTarget.style.setProperty(
          "--htooltip-delay",
          recent ? "0ms" : "",
        );
        entered.current = performance.now();
        delay.current = recent
          ? 0
          : milliseconds(
              getComputedStyle(event.currentTarget).getPropertyValue(
                "--harmo-tooltip-delay",
              ),
            );
      },
      onPointerLeave: () => {
        if (performance.now() - entered.current >= delay.current) {
          lastHide = performance.now();
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
  const { trigger, tooltip } = useTooltip();
  const text = label ?? description;

  const join = (ids?: string) => (ids ? `${ids} ${id}` : id);
  const control = !text
    ? children
    : cloneElement(
        children,
        label
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
      {text && (
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
