import type { ComponentPropsWithRef, ReactNode } from "react";
import { renders } from "./children.ts";
import { withClass } from "./withClass.ts";

export interface ToolbarProps extends ComponentPropsWithRef<"div"> {
  controls?: ReactNode;
}

export const Toolbar = ({ controls, className, children, ...props }: ToolbarProps) => (
  <div {...props} className={withClass("htoolbar", className)}>
    {children}
    {renders(controls) && <div className="htoolbar-controls">{controls}</div>}
  </div>
);
