import type { ComponentPropsWithRef, ReactNode } from "react";
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
}: SelectionBarProps) => (
  <div {...props} className={withClass("hselection-bar", className)}>
    <span className="hselection-bar-count" role="status">
      {label}
    </span>
    <button type="button" className="hselection-bar-deselect" onClick={onDeselect}>
      {deselectLabel}
    </button>
    {children}
  </div>
);
