"use client";

import {
  isValidElement,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { flatChildren } from "../children.ts";
import { withClass } from "../withClass.ts";
import { matches, useListbox } from "./Listbox.tsx";

export interface OptionGroupProps extends ComponentPropsWithRef<"li"> {
  label: ReactNode;
}

export const OptionGroup = ({
  label,
  className,
  children,
  ...props
}: OptionGroupProps) => {
  const id = useId();
  const listbox = useListbox();
  const shown = flatChildren(children).some(
    (option) =>
      isValidElement<{ hidden?: boolean; children?: ReactNode }>(option) &&
      !option.props.hidden &&
      matches(listbox.query, option.props.children),
  );

  return (
    <li
      {...props}
      className={withClass("hoption-group", className)}
      role="presentation"
      hidden={!shown || undefined}
    >
      <span className="hoption-group-label" id={id}>
        {label}
      </span>
      <ul role="group" aria-labelledby={id}>
        {children}
      </ul>
    </li>
  );
};
