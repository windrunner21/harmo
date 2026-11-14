"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { renders } from "./children.ts";
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
  const labelled = renders(label);

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
        hidden={labelled ? undefined : hidden}
        role="radiogroup"
        aria-labelledby={labelled ? labelId : field["aria-labelledby"]}
        aria-describedby={field["aria-describedby"]}
      />
    </RadioGroupContext>
  );

  if (!labelled) return control;

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
