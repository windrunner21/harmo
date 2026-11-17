"use client";

import {
  createContext,
  useContext,
  type ComponentPropsWithRef,
} from "react";
import { close as closePaths } from "./icons.ts";
import { withClass } from "./withClass.ts";

export interface TagProps extends ComponentPropsWithRef<"span"> {
  variant?: "accent";
  color?: string;
}

export const Tag = ({
  variant,
  color,
  className,
  style,
  children,
  ...props
}: TagProps) => (
  <span
    {...props}
    className={withClass("htag", className)}
    data-variant={variant}
    style={
      color ? { ...style, "--htag-color": color } : style
    }
  >
    {color && <span className="htag-dot" aria-hidden="true" />}
    {children}
  </span>
);

export const TagCopyContext = createContext(false);

export interface TagRemoveProps
  extends Omit<ComponentPropsWithRef<"button">, "type" | "children"> {
  "aria-label": string;
}

export const TagRemove = ({ className, ...props }: TagRemoveProps) => {
  const copy = useContext(TagCopyContext);
  if (copy) return null;
  return (
    <button {...props} className={withClass("htag-remove", className)} type="button">
      <svg
        className="hicon"
        width="24"
        height="24"
        viewBox="0 0 25 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        {closePaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </button>
  );
};
