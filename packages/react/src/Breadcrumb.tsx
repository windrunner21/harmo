import type { ComponentPropsWithRef } from "react";
import { flatChildren } from "./children.ts";
import { chevron } from "./icons.ts";
import { withClass } from "./withClass.ts";

export interface BreadcrumbProps extends ComponentPropsWithRef<"nav"> {
  "aria-label": string;
}

const separator = (
  <svg
    className="hbreadcrumb-separator hchevron"
    width="24"
    height="24"
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

export const Breadcrumb = ({
  className,
  children,
  ...props
}: BreadcrumbProps) => {
  const items = flatChildren(children);

  return (
    <nav
      {...props}
      className={withClass("hbreadcrumb", className)}
    >
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {index > 0 && separator}
            {index === items.length - 1 ? (
              <span aria-current="page">{item}</span>
            ) : (
              item
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
