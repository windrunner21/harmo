import type { ComponentPropsWithRef, CSSProperties } from "react";
import { withClass } from "./withClass.ts";

export interface TagProps extends ComponentPropsWithRef<"span"> {
  variant?: "accent";
  color?: string;
}

export const Tag = ({
  variant,
  color,
  className,
  style,
  children,
  ...props
}: TagProps) => (
  <span
    {...props}
    className={withClass("htag", className)}
    data-variant={variant}
    style={
      color ? ({ ...style, "--htag-color": color } as CSSProperties) : style
    }
  >
    {color && <span className="htag-dot" aria-hidden="true" />}
    {children}
  </span>
);
