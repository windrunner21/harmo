"use client";

import {
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { withClass } from "../withClass.ts";
import { GroupContext, optionsOf, shownFor, useListbox } from "./Listbox.tsx";

export interface OptionGroupProps extends ComponentPropsWithRef<"li"> {
  label: ReactNode;
  filter?: boolean;
}

export const OptionGroup = ({
  label,
  filter = true,
  hidden,
  className,
  children,
  ...props
}: OptionGroupProps) => {
  const id = useId();
  const listbox = useListbox();
  // A group inside another takes its settings too: unfiltered, or hidden,
  // with it.
  const outer = useContext(GroupContext);
  const filtered = outer.filter && filter;
  const hiddenHere = outer.hidden || Boolean(hidden);
  const shown = optionsOf(children).some((option) =>
    shownFor(listbox.query, filtered ? option : { ...option, text: null }),
  );

  return (
    <li
      {...props}
      className={withClass("hoption-group", className)}
      role="presentation"
      hidden={hiddenHere || !shown || undefined}
    >
      <span className="hoption-group-label" id={id}>
        {label}
      </span>
      <ul role="group" aria-labelledby={id}>
        <GroupContext value={{ filter: filtered, hidden: hiddenHere }}>{children}</GroupContext>
      </ul>
    </li>
  );
};
