import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export interface StatusProps extends ComponentPropsWithRef<"span"> {
  status?: "success" | "warning" | "info" | "error";
  variant?: "bordered";
}

export const Status = ({
  status,
  variant,
  className,
  ...props
}: StatusProps) => (
  <span
    {...props}
    className={withClass("hstatus", className)}
    data-status={status}
    data-variant={variant}
  />
);
