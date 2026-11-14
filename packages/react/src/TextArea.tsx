"use client";

import { useId, type ComponentPropsWithRef, type ReactNode, type UIEvent } from "react";
import { useField } from "./field/Field.tsx";
import { highlightedParts, useBackdrop } from "./highlight.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";
import { withClass } from "./withClass.ts";

export interface TextAreaProps extends ComponentPropsWithRef<"textarea"> {
  highlight?: RegExp;
  formatCount?: (length: number, maxLength: number) => ReactNode;
}

const count = (length: number, maxLength: number) => `${length}/${maxLength}`;

export const TextArea = ({
  highlight,
  formatCount = count,
  ref,
  value,
  defaultValue,
  onChange,
  onScroll,
  className,
  ...props
}: TextAreaProps) => {
  const counterId = useId();
  const current = useCurrentValue({ ref, value, defaultValue, onChange });
  const { maxLength } = props;
  const field = useField(props, {
    describedBy: maxLength !== undefined ? counterId : undefined,
  });
  const { backdrop, follow } = useBackdrop(current.element, Boolean(highlight));

  const box = (
    <textarea
      {...props}
      {...field}
      ref={current.ref}
      value={value}
      defaultValue={defaultValue}
      onChange={current.onChange}
      onScroll={(event: UIEvent<HTMLTextAreaElement>) => {
        onScroll?.(event);
        follow();
      }}
      className={withClass("htextarea", className)}
    />
  );

  return (
    <>
      {highlight ? (
        <div className="htextarea-highlight" hidden={props.hidden}>
          {box}
          <div ref={backdrop} className="htextarea-highlight-backdrop" aria-hidden="true">
            <span>{highlightedParts(current.value, highlight, "\n")}</span>
          </div>
        </div>
      ) : (
        box
      )}
      {maxLength !== undefined && (
        <p className="htextarea-counter" id={counterId} hidden={props.hidden}>
          {formatCount(current.value.length, maxLength)}
        </p>
      )}
    </>
  );
};
