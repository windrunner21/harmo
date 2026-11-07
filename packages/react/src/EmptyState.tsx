import type { ComponentPropsWithRef, ReactNode } from "react";
import { renders } from "./children.ts";
import { withClass } from "./withClass.ts";

export interface EmptyStateProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label?: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  align?: "start";
  size?: "small";
  variant?: "dashed";
}

export const EmptyState = ({
  label,
  labelAs: Label = "h2",
  description,
  icon,
  actions,
  align,
  size,
  variant,
  className,
  ...props
}: EmptyStateProps) => (
  <div
    {...props}
    className={withClass("hempty-state", className)}
    data-align={align}
    data-size={size}
    data-variant={variant}
  >
    {renders(icon) && (
      <div className="hempty-state-icon" aria-hidden="true">
        {icon}
      </div>
    )}
    {renders(label) && <Label className="hempty-state-title">{label}</Label>}
    {renders(description) && (
      <p className="hempty-state-description">{description}</p>
    )}
    {renders(actions) && <div className="hempty-state-actions">{actions}</div>}
  </div>
);
