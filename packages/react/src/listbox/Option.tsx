"use client";

import {
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { check as checkPaths } from "../icons.ts";
import { withClass } from "../withClass.ts";
import { matches, SelectContext, useListbox } from "./Listbox.tsx";

export interface OptionProps
  extends Omit<ComponentPropsWithRef<"li">, "value"> {
  value: string;
  disabled?: boolean;
  badge?: ReactNode;
}

export const Option = ({
  value,
  disabled,
  badge,
  id: ownId,
  hidden,
  className,
  children,
  onPointerMove,
  onMouseDown,
  onClick,
  ...props
}: OptionProps) => {
  const generatedId = useId();
  const id = ownId ?? generatedId;
  const listbox = useListbox();
  const select = useContext(SelectContext);
  const selected = listbox.isSelected(value);

  return (
    <li
      {...props}
      className={withClass("hoption", className)}
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-value={select?.named ? value : undefined}
      data-active={listbox.activeId === id ? "" : undefined}
      hidden={hidden || !matches(listbox.query, children) || undefined}
      onPointerMove={(event) => {
        listbox.highlight(disabled ? null : id);
        onPointerMove?.(event);
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown?.(event);
      }}
      onClick={(event) => {
        if (!disabled) listbox.choose(value);
        onClick?.(event);
      }}
    >
      {listbox.multiple && (
        <span className="hoption-checkbox" aria-hidden="true" />
      )}
      <span className="hoption-label">{children}</span>
      {badge && (
        <>
          {" "}
          <span className="hoption-badge">{badge}</span>
        </>
      )}
      {selected && !listbox.multiple && check}
    </li>
  );
};

const check = (
  <svg
    className="hoption-check"
    viewBox="5.845 5.87 14 14"
    aria-hidden="true"
    focusable="false"
  >
    {checkPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);
