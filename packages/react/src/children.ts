import { Children, Fragment, isValidElement, type ReactNode } from "react";

export const flatChildren = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatChildren(child.props.children)
      : [child],
  );
