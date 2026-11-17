"use client";

import type { ComponentPropsWithRef } from "react";
import { useAddedLater } from "./useAddedLater.ts";
import { withClass } from "./withClass.ts";

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  count?: number;
  max?: number;
  variant?: "accent" | "neutral";
  dot?: boolean;
}

export const Badge = ({ count, max = 99, variant, dot, className, children, ...props }: BadgeProps) => {
  const added = useAddedLater();

  return (
    <span
      {...props}
      className={withClass("hbadge", className)}
      data-variant={variant}
      data-dot={dot ? "" : undefined}
      data-new={added ? "" : undefined}
    >
      {dot ? null : (children ?? (count === undefined ? null : count > max ? `${max}+` : count))}
    </span>
  );
};
