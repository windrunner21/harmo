"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

export type FilterBarProps = ComponentPropsWithRef<"nav"> & {
  "aria-label": string;
  as?: "nav" | "div";
};

interface FilterBarItemOptions {
  label: ReactNode;
  count: ReactNode;
  current?: boolean;
}

export type FilterBarItemProps =
  | (FilterBarItemOptions &
      Omit<ComponentPropsWithRef<"button">, "children" | "type" | "value"> & { href?: undefined })
  | (FilterBarItemOptions & Omit<ComponentPropsWithRef<"a">, "children"> & { href: string });

export const FilterBar = ({ as: Root = "nav", className, ...props }: FilterBarProps) => (
  <Root
    {...(props as ComponentPropsWithRef<"div">)}
    role={Root === "div" ? "group" : undefined}
    className={withClass("hfilter-bar", className)}
  />
);

export const FilterBarItem = ({
  label,
  count,
  current = false,
  className,
  ...props
}: FilterBarItemProps) => {
  const Anchor = useLinkComponent();
  const classes = withClass("hfilter-bar-item", className);
  const parts = (
    <>
      <span className="hfilter-bar-label">{label}</span>
      <span className="hfilter-bar-count">{count}</span>
    </>
  );

  if (props.href !== undefined) {
    return (
      <Anchor {...props} className={classes} aria-current={current ? "true" : undefined}>
        {parts}
      </Anchor>
    );
  }
  return (
    <button {...props} type="button" className={classes} aria-pressed={current}>
      {parts}
    </button>
  );
};
