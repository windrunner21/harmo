"use client";

import type { ComponentPropsWithRef } from "react";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

export interface LinkProps extends ComponentPropsWithRef<"a"> {
  href: string;
  underlined?: boolean;
  visited?: boolean;
}

export const Link = ({
  underlined,
  visited,
  className,
  ...props
}: LinkProps) => {
  const Anchor = useLinkComponent();

  return (
    <Anchor
      {...props}
      className={withClass("hlink", className)}
      data-underlined={underlined ? "" : undefined}
      data-visited={visited ? "" : undefined}
    />
  );
};
