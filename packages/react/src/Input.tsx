"use client";

import type { ComponentPropsWithRef, UIEvent } from "react";
import { useField } from "./field/Field.tsx";
import { highlightedParts, useBackdrop } from "./highlight.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";
import { withClass } from "./withClass.ts";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  highlight?: RegExp;
}

const highlightable = ["text", "email", "tel", "url"];

export const Input = ({ highlight, ...props }: InputProps) =>
  highlight && highlightable.includes(props.type?.toLowerCase() ?? "text") ? (
    <HighlightedInput {...props} highlight={highlight} />
  ) : (
    <PlainInput {...props} />
  );

const PlainInput = ({ className, ...props }: ComponentPropsWithRef<"input">) => {
  const field = useField(props);

  return (
    <input {...props} {...field} className={withClass("hinput", className)} />
  );
};

const HighlightedInput = ({
  highlight,
  ref,
  value,
  defaultValue,
  onChange,
  onScroll,
  className,
  ...props
}: InputProps & { highlight: RegExp }) => {
  const field = useField(props);
  const current = useCurrentValue({ ref, value, defaultValue, onChange });
  const { backdrop, follow } = useBackdrop(current.element, true);

  return (
    <div className="hinput-highlight" hidden={props.hidden}>
      <input
        {...props}
        {...field}
        ref={current.ref}
        value={value}
        defaultValue={defaultValue}
        onChange={current.onChange}
        onScroll={(event: UIEvent<HTMLInputElement>) => {
          onScroll?.(event);
          follow();
        }}
        className={withClass("hinput", className)}
      />
      <div ref={backdrop} className="hinput-highlight-backdrop" aria-hidden="true">
        <span>{highlightedParts(current.value, highlight)}</span>
      </div>
    </div>
  );
};
