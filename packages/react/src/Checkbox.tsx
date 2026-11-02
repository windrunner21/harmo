"use client";

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
} from "react";
import { useCheckboxGroupInput } from "./CheckboxGroup.tsx";
import { useField } from "./field/Field.tsx";
import { withClass } from "./withClass.ts";

export interface CheckboxProps
  extends Omit<ComponentPropsWithRef<"input">, "type"> {
  indeterminate?: boolean;
}

export const Checkbox = ({
  indeterminate = false,
  ref,
  className,
  ...props
}: CheckboxProps) => {
  const field = useField(props);
  const group = useCheckboxGroupInput(props);
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement, []);

  useLayoutEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  });

  return (
    <input
      {...group}
      {...props}
      {...field}
      onChange={group.onChange}
      ref={input}
      className={withClass("hcheckbox", className)}
      type="checkbox"
    />
  );
};
