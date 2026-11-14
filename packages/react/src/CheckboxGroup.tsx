"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type RefObject,
} from "react";
import { Field, type StackedFieldProps } from "./field/Field.tsx";
import { useMergedRef } from "./useMergedRef.ts";

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
  element: RefObject<HTMLDivElement | null>;
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
      const boxes = group.element.current?.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
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
  ref,
  ...props
}: CheckboxGroupProps) => {
  const generatedName = useId();
  const element = useRef<HTMLDivElement>(null);
  const merged = useMergedRef<HTMLDivElement>(element, ref);

  return (
    <CheckboxGroupContext
      value={{
        name: name ?? generatedName,
        value,
        defaultValue,
        disabled,
        onValueChange,
        element,
      }}
    >
      <Field {...props} ref={merged} role="group" />
    </CheckboxGroupContext>
  );
};
