"use client";

import type { ComponentPropsWithRef } from "react";
import { useField } from "./field/Field.tsx";
import { useRadioGroupInput } from "./RadioGroup.tsx";
import { withClass } from "./withClass.ts";

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "type">;

export const Radio = ({ className, ...props }: RadioProps) => {
  const field = useField(props);
  const group = useRadioGroupInput(props);

  return (
    <input
      {...group}
      {...props}
      {...field}
      disabled={group.disabled || props.disabled}
      required={group.required || props.required}
      onChange={group.onChange}
      className={withClass("hradio", className)}
      type="radio"
    />
  );
};
