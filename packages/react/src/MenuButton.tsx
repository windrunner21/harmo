"use client";

import type { ComponentPropsWithRef } from "react";
import { Button } from "./Button.tsx";
import { withClass } from "./withClass.ts";

export interface MenuButtonProps
  extends Omit<ComponentPropsWithRef<"button">, "children" | "type"> {
  "aria-label": string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "secondary" | "tertiary";
  size?: "small";
}

export const MenuButton = ({
  open,
  onOpenChange,
  variant = "secondary",
  size = "small",
  className,
  onClick,
  "aria-expanded": expanded,
  ...props
}: MenuButtonProps) => (
  <Button
    {...props}
    className={withClass("hmenu-button", className)}
    variant={variant}
    size={size}
    aria-expanded={open ?? expanded ?? false}
    onClick={(event) => {
      onClick?.(event);
      if (open !== undefined) onOpenChange?.(!open);
    }}
  >
    <svg className="hicon hmenu-button-bars" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <line className="hmenu-button-top" x1="3" y1="5" x2="17" y2="5" />
      <line className="hmenu-button-middle" x1="3" y1="10" x2="17" y2="10" />
      <line className="hmenu-button-bottom" x1="3" y1="15" x2="17" y2="15" />
    </svg>
  </Button>
);
