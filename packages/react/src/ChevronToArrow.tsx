import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export interface ChevronToArrowProps extends ComponentPropsWithRef<"svg"> {
  direction?: "forward" | "back";
}

export const ChevronToArrow = ({
  direction = "forward",
  className,
  ...props
}: ChevronToArrowProps) => (
  <svg
    {...props}
    className={withClass("hicon hchevron-to-arrow", className)}
    data-direction={direction === "back" ? "back" : undefined}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <g className="hchevron-to-arrow-head">
      <line
        className="hchevron-to-arrow-upper"
        x1="12"
        y1="6"
        x2="12"
        y2="12"
      />
      <line
        className="hchevron-to-arrow-lower"
        x1="12"
        y1="18"
        x2="12"
        y2="12"
      />
    </g>
    <line className="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" />
  </svg>
);
