"use client";

import { useId, type ComponentPropsWithRef, type UIEvent } from "react";
import { useField } from "./field/Field.tsx";
import { highlightedParts, useBackdrop } from "./highlight.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";
import { withClass } from "./withClass.ts";

export interface TextAreaProps extends ComponentPropsWithRef<"textarea"> {
  highlight?: RegExp;
}

export const TextArea = ({
  highlight,
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
  const counted = props.maxLength !== undefined;
  const field = useField(props, {
    describedBy: counted ? counterId : undefined,
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
      {counted && (
        <p className="htextarea-counter" id={counterId} hidden={props.hidden}>
          {current.value.length}/{props.maxLength}
        </p>
      )}
    </>
  );
};
