"use client";

import { useState, useSyncExternalStore, type ComponentPropsWithRef, type ReactNode } from "react";
import { withClass } from "./withClass.ts";

export interface SelectionBarProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  deselectLabel: ReactNode;
  onDeselect: () => void;
}

const subscribe = () => () => {};

export const SelectionBar = ({
  label,
  deselectLabel,
  onDeselect,
  className,
  children,
  ...props
}: SelectionBarProps) => {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  const [added] = useState(inBrowser);

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
