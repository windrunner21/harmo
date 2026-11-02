"use client";

import {
  createContext,
  useContext,
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
} from "react";
import { Field, type StackedFieldProps } from "./field/Field.tsx";

export interface RadioGroupOptions {
  name?: string;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<StackedFieldProps, "orientation" | "role" | "defaultValue">,
    RadioGroupOptions {}

interface RadioGroupState extends RadioGroupOptions {
  name: string;
}

export const RadioGroupContext = createContext<RadioGroupState | undefined>(
  undefined,
);

export const useRadioGroupInput = ({
  value,
  onChange,
}: Pick<ComponentPropsWithRef<"input">, "value" | "onChange">) => {
  const group = useContext(RadioGroupContext);
  const chosen = (choice?: string | null) =>
    choice === undefined ? undefined : choice === value;

  return {
    name: group?.name,
    checked: chosen(group?.value),
    defaultChecked: chosen(group?.defaultValue),
    required: group?.required,
    disabled: group?.disabled,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      group?.onValueChange?.(event.target.value);
    },
  };
};

export const RadioGroup = ({
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  ...props
}: RadioGroupProps) => {
  const generatedName = useId();

  return (
    <RadioGroupContext
      value={{
        name: name ?? generatedName,
        value,
        defaultValue,
        onValueChange,
        required,
        disabled,
      }}
    >
      <Field {...props} role="radiogroup" />
    </RadioGroupContext>
  );
};
