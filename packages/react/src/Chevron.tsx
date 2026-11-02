import type { ComponentPropsWithRef } from "react";
import { chevron } from "./icons.ts";
import { withClass } from "./withClass.ts";

export interface ChevronProps extends ComponentPropsWithRef<"svg"> {
  direction?: "forward" | "back";
}

export const Chevron = ({
  direction = "forward",
  className,
  ...props
}: ChevronProps) => (
  <svg
    width="1.125em"
    height="1.125em"
    {...props}
    className={withClass("hicon hchevron", className)}
    data-direction={direction === "back" ? "back" : undefined}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {chevron.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);
