"use client";

import type { ComponentPropsWithRef } from "react";
import { close as closePaths, search as searchPaths } from "./icons.ts";
import { Input } from "./Input.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";

export interface SearchProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  clearLabel?: string;
}

const searchIcon = (
  <svg
    className="hicon"
    width="1.125em"
    height="1.125em"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {searchPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const clearIcon = (
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
);

// Empties the field as typing would, so onChange, and any input listener of
// the app's, hear it; a read-only field stays as it is.
const empty = (input: HTMLInputElement) => {
  if (input.readOnly) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

export const Search = ({
  clearLabel,
  ref,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  hidden,
  ...props
}: SearchProps) => {
  const current = useCurrentValue({ ref, value, defaultValue, onChange });

  return (
    <div className="hsearch" hidden={hidden}>
      {searchIcon}
      <Input
        {...props}
        ref={current.ref}
        type="search"
        value={value}
        defaultValue={defaultValue}
        onChange={current.onChange}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          const input = event.currentTarget;
          // An IME's Escape cancels what it's composing.
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.defaultPrevented || event.key !== "Escape" || !input.value || input.readOnly) return;
          event.preventDefault();
          empty(input);
        }}
      />
      {clearLabel !== undefined && (
        <button
          className="hsearch-clear"
          type="button"
          tabIndex={-1}
          aria-label={clearLabel}
          hidden={current.value === "" || props.readOnly}
          disabled={props.disabled}
          onClick={() => {
            const input = current.ref.current;
            if (!input) return;
            empty(input);
            input.focus();
          }}
        >
          {clearIcon}
        </button>
      )}
    </div>
  );
};
