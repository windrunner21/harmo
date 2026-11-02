import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export interface MeterProps extends ComponentPropsWithRef<"div"> {
  value: number;
  max: number;
  status?: "success" | "warning" | "info" | "error";
}

export const Meter = ({
  value,
  max,
  status,
  className,
  ...props
}: MeterProps) => (
  <div
    {...props}
    className={withClass("hmeter", className)}
    data-status={status}
    role="meter"
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
  >
    {Array.from({ length: max }, (_, index) => (
      <span
        key={index}
        className="hmeter-segment"
        data-filled={index < value ? "" : undefined}
      />
    ))}
  </div>
);
