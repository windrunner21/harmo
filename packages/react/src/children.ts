import { Children, Fragment, isValidElement, type ReactNode } from "react";

export const flatChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatChildren(child.props.children)
      : [child],
  );

// Whether a node renders anything: not nothing, false, or an empty string.
// Zero does, as React renders it, so it goes in its part, not loose.
export const renders = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== "";

export const shownChildren = (children: ReactNode): ReactNode[] =>
  flatChildren(children).filter(
    (child) =>
      !(isValidElement<{ hidden?: boolean }>(child) && child.props.hidden),
  );
