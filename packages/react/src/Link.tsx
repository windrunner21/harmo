"use client";

import type { ComponentPropsWithRef } from "react";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

export interface LinkProps extends ComponentPropsWithRef<"a"> {
  href: string;
  underlined?: boolean;
  visited?: boolean;
  external?: boolean;
}

export const Link = ({
  underlined,
  visited,
  external,
  className,
  ...props
}: LinkProps) => {
  const Anchor = useLinkComponent();

  return (
    <Anchor
      {...props}
      className={withClass(external ? "hlink hexternal" : "hlink", className)}
      data-underlined={underlined ? "" : undefined}
      data-visited={visited ? "" : undefined}
    />
  );
};
