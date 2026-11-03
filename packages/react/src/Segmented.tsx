"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { useField } from "./field/Field.tsx";
import {
  RadioGroupContext,
  useRadioGroupInput,
  type RadioGroupOptions,
} from "./RadioGroup.tsx";
import { withClass } from "./withClass.ts";

export interface SegmentedProps
  extends Omit<ComponentPropsWithRef<"div">, "defaultValue">,
    RadioGroupOptions {
  label?: ReactNode;
}

export const Segmented = ({
  label,
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  className,
  hidden,
  ...props
}: SegmentedProps) => {
  const id = useId();
  const labelId = `${id}-label`;
  const field = useField(props);

  const control = (
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
        hidden={label ? undefined : hidden}
        role="radiogroup"
        aria-labelledby={label ? labelId : field["aria-labelledby"]}
        aria-describedby={field["aria-describedby"]}
      />
    </RadioGroupContext>
  );

  if (!label) return control;

  return (
    <div className="hfield" hidden={hidden}>
      <span className="hlabel" id={labelId}>
        {label}
      </span>
      {control}
    </div>
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
      <input {...group} {...props} onChange={group.onChange} type="radio" />
      {children}
    </label>
  );
};
