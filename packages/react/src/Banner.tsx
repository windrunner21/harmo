import {
  cloneElement,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { withClass } from "./withClass.ts";

export interface BannerProps extends ComponentPropsWithRef<"div"> {
  status?: "success" | "warning" | "info" | "error";
  icon: ReactElement<ComponentPropsWithRef<"svg">>;
  action?: ReactNode;
}

export const Banner = ({
  status,
  icon,
  action,
  className,
  children,
  ...props
}: BannerProps) => (
  <div
    {...props}
    className={withClass("hbanner", className)}
    data-status={status}
  >
    {cloneElement(icon, {
      className: withClass("hbanner-icon", icon.props.className),
      "aria-hidden": true,
      focusable: "false",
    })}
    <p className="hbanner-message">{children}</p>
    {action}
  </div>
);
