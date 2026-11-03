import { Children, Fragment, isValidElement, type ReactNode } from "react";

export const flatChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatChildren(child.props.children)
      : [child],
  );

export const shownChildren = (children: ReactNode): ReactNode[] =>
  flatChildren(children).filter(
    (child) =>
      !(isValidElement<{ hidden?: boolean }>(child) && child.props.hidden),
  );
