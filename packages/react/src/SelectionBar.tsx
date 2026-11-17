"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useAddedLater } from "./useAddedLater.ts";
import { withClass } from "./withClass.ts";

export interface SelectionBarProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  deselectLabel: ReactNode;
  onDeselect: () => void;
}

export const SelectionBar = ({
  label,
  deselectLabel,
  onDeselect,
  className,
  children,
  ...props
}: SelectionBarProps) => {
  const added = useAddedLater();

  return (
    <div data-new={added ? "" : undefined} {...props} className={withClass("hselection-bar", className)}>
      <span className="hselection-bar-count" role="status">
        {label}
      </span>
      <button type="button" className="hselection-bar-deselect" onClick={onDeselect}>
        {deselectLabel}
      </button>
      {children}
    </div>
  );
};
