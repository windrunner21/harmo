import type { ComponentPropsWithRef, ReactNode } from "react";
import { withClass } from "./withClass.ts";

interface SpinnerOptions
  extends Omit<ComponentPropsWithRef<"span">, "aria-hidden" | "children"> {
  size?: "small" | "large";
  delay?: boolean;
}

export type SpinnerProps = SpinnerOptions &
  (
    | { "aria-hidden": true | "true"; children?: undefined }
    | { "aria-hidden"?: false | "false"; children: ReactNode }
  );

export const Spinner = ({
  size,
  delay,
  className,
  children,
  ...props
}: SpinnerProps) => {
  const hidden =
    props["aria-hidden"] === true || props["aria-hidden"] === "true";

  return (
    <span
      {...props}
      className={withClass("hspinner", className)}
      data-size={size}
      data-delay={delay ? "" : undefined}
      role={hidden ? undefined : "status"}
    >
      {!hidden && <span className="hspinner-label">{children}</span>}
    </span>
  );
};
