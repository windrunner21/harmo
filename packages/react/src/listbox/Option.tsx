"use client";

import {
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { renders } from "../children.ts";
import { check as checkPaths } from "../icons.ts";
import { withClass } from "../withClass.ts";
import {
  GroupContext,
  matches,
  searchText,
  SelectContext,
  useListbox,
} from "./Listbox.tsx";

export interface OptionProps
  extends Omit<ComponentPropsWithRef<"li">, "value"> {
  value: string;
  disabled?: boolean;
  badge?: ReactNode;
  description?: ReactNode;
  keywords?: readonly string[];
}

export const Option = ({
  value,
  disabled,
  badge,
  description,
  keywords,
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
  const group = useContext(GroupContext);
  const selected = listbox.isSelected(value);
  const shown =
    !group.filter ||
    matches(listbox.query, searchText(children, description, keywords));
  const label = (
    <span className="hoption-label">{marked(children, listbox.mark)}</span>
  );

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
      hidden={hidden || group.hidden || !shown || undefined}
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
      {renders(description) ? (
        <span className="hoption-text">
          {label}{" "}
          <span className="hoption-description">
            {marked(description, listbox.mark)}
          </span>
        </span>
      ) : (
        label
      )}
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

// The first place a text holds what's typed, marked.
const marked = (node: ReactNode, typed: string) => {
  const wanted = typed.trim().toLowerCase();
  if (typeof node !== "string" || wanted === "") return node;
  const lower = node.toLowerCase();
  const at = lower.indexOf(wanted);
  if (at < 0 || lower.length !== node.length) return node;
  return (
    <>
      {node.slice(0, at)}
      <mark className="hoption-match">
        {node.slice(at, at + wanted.length)}
      </mark>
      {node.slice(at + wanted.length)}
    </>
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
