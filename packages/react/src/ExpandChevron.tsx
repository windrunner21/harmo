import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export type ExpandChevronProps = ComponentPropsWithRef<"svg">;

export const ExpandChevron = ({ className, ...props }: ExpandChevronProps) => (
  <svg
    {...props}
    className={withClass("hexpand-chevron", className)}
    viewBox="0 0 16 12"
    aria-hidden="true"
    focusable="false"
  >
    <g className="hexpand-chevron-head">
      <line className="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
      <line className="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
    </g>
  </svg>
);
