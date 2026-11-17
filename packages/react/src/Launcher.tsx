"use client";

import { useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button } from "./Button.tsx";
import { closeIcon } from "./closeIcon.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface LauncherProps extends Omit<ComponentPropsWithRef<"div">, "aria-label"> {
  "aria-label": string;
  buttonLabel?: string;
  icon: ReactNode;
  badge?: ReactNode;
  status?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Launcher = ({
  "aria-label": label,
  buttonLabel,
  icon,
  badge,
  status,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ref,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: LauncherProps) => {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const panel = useRef<HTMLDivElement>(null);
  const merged = useMergedRef(panel, ref);
  const button = useRef<HTMLButtonElement>(null);
  const shown = useRef(open);
  const pressed = useRef(false);
  const inside = useRef(false);
  const id = useId();

  const change = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
  };

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element || open === shown.current) return;
    shown.current = open;
    if (open && pressed.current) (element.querySelector<HTMLElement>("[data-autofocus]") ?? element).focus();
    if (!open) {
      const active = document.activeElement;
      const lost = active === null || active === document.body;
      if (element.matches(":focus-within") || (inside.current && lost)) button.current?.focus();
      inside.current = false;
    }
    pressed.current = false;
  });

  return (
    <div className="hlauncher">
      <div
        {...props}
        ref={merged}
        id={id}
        className={withClass("hlauncher-panel", className)}
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        data-open={open ? "" : undefined}
        onFocus={(event) => {
          onFocus?.(event);
          inside.current = true;
        }}
        onBlur={(event) => {
          onBlur?.(event);
          const next = event.relatedTarget;
          if (next && !event.currentTarget.contains(next)) inside.current = false;
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key !== "Escape" || event.defaultPrevented) return;
          event.preventDefault();
          change(false);
        }}
      >
        {children}
      </div>
      <Button
        ref={button}
        className="hlauncher-button"
        aria-label={buttonLabel ?? label}
        aria-expanded={open}
        aria-controls={id}
        badge={badge}
        onClick={() => {
          pressed.current = true;
          change(!open);
        }}
      >
        <span className="hicon hlauncher-icons" aria-hidden="true">
          {icon}
          {closeIcon}
        </span>
      </Button>
      <p className="hlauncher-status" aria-live="polite">
        {status}
      </p>
    </div>
  );
};
