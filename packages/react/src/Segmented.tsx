"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { renders } from "./children.ts";
import { Field, useField } from "./field/Field.tsx";
import {
  RadioGroupContext,
  useRadioGroupInput,
  type RadioGroupOptions,
} from "./RadioGroup.tsx";
import type { ControlField } from "./types.ts";
import { withClass } from "./withClass.ts";

type SegmentedControlProps = Omit<ComponentPropsWithRef<"div">, "defaultValue"> &
  RadioGroupOptions;

export type SegmentedProps = SegmentedControlProps & ControlField;

export const Segmented = (segmentedProps: SegmentedProps) => {
  const { label, optional, description, error, hidden, ...props } = segmentedProps;
  if (!renders(label)) return <SegmentedControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      control="button"
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in segmentedProps && { error })}
    >
      <SegmentedControl {...props} />
    </Field>
  );
};

const SegmentedControl = ({
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  className,
  ...props
}: SegmentedControlProps) => {
  const id = useId();
  const field = useField(props);

  return (
    <RadioGroupContext
      value={{
        name: name ?? id,
        value,
        defaultValue,
        onValueChange,
        required,
        disabled,
      }}
    >
      <div
        {...props}
        className={withClass("hsegmented", className)}
        role="radiogroup"
        aria-labelledby={field["aria-labelledby"]}
        aria-describedby={field["aria-describedby"]}
        aria-invalid={field["aria-invalid"]}
      />
    </RadioGroupContext>
  );
};

export type SegmentedOptionProps = Omit<ComponentPropsWithRef<"input">, "type">;

export const SegmentedOption = ({
  className,
  style,
  hidden,
  children,
  ...props
}: SegmentedOptionProps) => {
  const group = useRadioGroupInput(props);

  return (
    <label
      className={withClass("hsegmented-option", className)}
      style={style}
      hidden={hidden}
    >
      <input
        {...group}
        {...props}
        disabled={group.disabled || props.disabled}
        required={group.required || props.required}
        onChange={group.onChange}
        type="radio"
      />
      {children}
    </label>
  );
};
