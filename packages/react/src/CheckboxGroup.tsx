"use client";

import {
  createContext,
  useContext,
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
} from "react";
import { Field, type StackedFieldProps } from "./field/Field.tsx";

export interface CheckboxGroupProps
  extends Omit<StackedFieldProps, "orientation" | "role" | "defaultValue"> {
  name?: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
}

interface CheckboxGroupState {
  name: string;
  value?: string[];
  defaultValue?: string[];
  disabled?: boolean;
  onValueChange?: (value: string[]) => void;
}

const CheckboxGroupContext = createContext<CheckboxGroupState | undefined>(
  undefined,
);

export const useCheckboxGroupInput = ({
  value,
  onChange,
}: Pick<ComponentPropsWithRef<"input">, "value" | "onChange">) => {
  const group = useContext(CheckboxGroupContext);
  const chosen = (choice?: string[]) =>
    choice === undefined ? undefined : choice.some((item) => item === value);

  return {
    name: group?.name,
    checked: chosen(group?.value),
    defaultChecked: chosen(group?.defaultValue),
    disabled: group?.disabled,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      if (!group?.onValueChange) return;
      const boxes = event.target
        .closest('[role="group"]')
        ?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      group.onValueChange(
        Array.from(boxes ?? [])
          .filter((box) => box.name === group.name && box.checked)
          .map((box) => box.value),
      );
    },
  };
};

export const CheckboxGroup = ({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: CheckboxGroupProps) => {
  const generatedName = useId();

  return (
    <CheckboxGroupContext
      value={{
        name: name ?? generatedName,
        value,
        defaultValue,
        disabled,
        onValueChange,
      }}
    >
      <Field {...props} role="group" />
    </CheckboxGroupContext>
  );
};
