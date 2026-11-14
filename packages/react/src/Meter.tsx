import type { ComponentPropsWithRef } from "react";
import type { Naming } from "./types.ts";
import { withClass } from "./withClass.ts";

export type MeterProps = Omit<
  ComponentPropsWithRef<"div">,
  "aria-label" | "aria-labelledby"
> &
  Naming & {
    value: number;
    max: number;
    status?: "success" | "warning" | "info" | "error";
  };

export const Meter = ({
  value,
  max,
  status,
  className,
  ...props
}: MeterProps) => {
  const steps = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 1;
  const now = Number.isNaN(value) ? 0 : Math.min(steps, Math.max(0, value));

  return (
    <div
      {...props}
      className={withClass("hmeter", className)}
      data-status={status}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={steps}
      aria-valuenow={now}
    >
      {Array.from({ length: steps }, (_, index) => (
        <span
          key={index}
          className="hmeter-segment"
          data-filled={index < Math.floor(now) ? "" : undefined}
        />
      ))}
    </div>
  );
};
