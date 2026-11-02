"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { useField } from "./field/Field.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";
import { withClass } from "./withClass.ts";

export type TextAreaProps = ComponentPropsWithRef<"textarea">;

export const TextArea = ({
  ref,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: TextAreaProps) => {
  const counterId = useId();
  const current = useCurrentValue({ ref, value, defaultValue, onChange });
  const counted = props.maxLength !== undefined;
  const field = useField(props, {
    describedBy: counted ? counterId : undefined,
  });

  return (
    <>
      <textarea
        {...props}
        {...field}
        ref={current.ref}
        value={value}
        defaultValue={defaultValue}
        onChange={current.onChange}
        className={withClass("htextarea", className)}
      />
      {counted && (
        <p className="htextarea-counter" id={counterId}>
          {current.value.length}/{props.maxLength}
        </p>
      )}
    </>
  );
};
