"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { Field, useField, type StackedFieldProps } from "./field/Field.tsx";
import {
  Listbox,
  optionsOf,
  SelectContext,
  toList,
  type ListboxSearch,
  type ListboxSelection,
} from "./listbox/Listbox.tsx";
import { Popup } from "./Popup.tsx";
import { withClass } from "./withClass.ts";

type SelectControlProps = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "defaultValue" | "type"
> &
  ListboxSelection &
  ListboxSearch & {
    name?: string;
    placeholder?: string;
  };

type SelectField =
  | ({ label: StackedFieldProps["label"] } & Partial<
      Pick<StackedFieldProps, "optional" | "description" | "error">
    >)
  | {
      label?: undefined;
      optional?: never;
      description?: never;
      error?: never;
    };

export type SelectProps = SelectControlProps & SelectField;

export const Select = (selectProps: SelectProps) => {
  const { label, optional, description, error, hidden, ...props } = selectProps;
  if (label === undefined) return <SelectControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      control="button"
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in selectProps && { error })}
    >
      <SelectControl {...props} />
    </Field>
  );
};

const SelectControl = ({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder,
  searchLabel,
  emptyMessage,
  disabled,
  ref,
  className,
  children,
  ...props
}: SelectControlProps) => {
  const field = useField(props);
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => trigger.current as HTMLButtonElement, []);

  const [uncontrolled, setUncontrolled] = useState(() => toList(defaultValue));
  const selected = value === undefined ? uncontrolled : toList(value);
  const chosen = optionsOf(children).filter((option) =>
    selected.includes(option.value),
  );
  const values = chosen.map((option) => option.value);
  const submitted = multiple || values.length ? values : [""];

  useEffect(() => {
    const form = trigger.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (!event.defaultPrevented) setUncontrolled(toList(defaultValue));
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);

  const change = (next: string | string[]) => {
    setUncontrolled(toList(next));
    (onValueChange as ((value: string | string[]) => void) | undefined)?.(
      next,
    );
  };

  const selection = {
    multiple,
    value: multiple ? selected : (selected[0] ?? null),
    onValueChange: change,
  } as ListboxSelection;

  const button = (
    <button
      {...props}
      {...field}
      ref={trigger}
      className={withClass("hselect", className)}
      type="button"
      data-name={name}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={false}
      aria-controls={disabled ? undefined : listId}
      disabled={disabled}
    >
      <span
        className="hselect-value"
        data-placeholder={chosen.length ? undefined : ""}
      >
        {chosen.length
          ? chosen.map((option) => option.label).join(", ")
          : placeholder}
      </span>
      <ExpandChevron />
    </button>
  );

  return (
    <>
      {disabled ? (
        button
      ) : (
        <Popup trigger={button}>
          <SelectContext value={{ named: Boolean(name) }}>
            <Listbox
              {...selection}
              id={listId}
              aria-labelledby={field["aria-labelledby"]}
              aria-label={
                field["aria-labelledby"] ? undefined : props["aria-label"]
              }
              {...({ searchLabel, emptyMessage } as ListboxSearch)}
            >
              {children}
            </Listbox>
          </SelectContext>
        </Popup>
      )}
      {name &&
        submitted.map((item, index) => (
          <input
            key={index}
            type="hidden"
            name={name}
            value={item}
            form={props.form}
            disabled={disabled}
          />
        ))}
    </>
  );
};
