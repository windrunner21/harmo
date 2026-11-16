"use client";

import {
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { flatChildren } from "./children.ts";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { Field, useField, type StackedFieldProps } from "./field/Field.tsx";
import {
  Listbox,
  optionsOf,
  SelectContext,
  textOf,
  toList,
  type ListboxSearch,
  type ListboxSelection,
} from "./listbox/Listbox.tsx";
import { OptionGroup } from "./listbox/OptionGroup.tsx";
import { Popup } from "./Popup.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

type SelectControlProps = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "defaultValue" | "type"
> &
  ListboxSelection &
  ListboxSearch & {
    name?: string;
    placeholder?: string;
    renderValue?: (values: string[]) => ReactNode;
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
  renderValue,
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
  const triggerRef = useMergedRef(trigger, ref);
  const fallback = useRef<HTMLSelectElement>(null);
  const [ready, setReady] = useState(false);

  const [uncontrolled, setUncontrolled] = useState(() => toList(defaultValue));
  const selected = value === undefined ? uncontrolled : toList(value);
  const chosen = optionsOf(children).filter((option) =>
    selected.includes(option.value),
  );
  const values = chosen.map((option) => option.value);
  const required =
    props["aria-required"] === true || props["aria-required"] === "true";

  const change = (next: string | string[]) => {
    setUncontrolled(toList(next));
    (onValueChange as ((value: string | string[]) => void) | undefined)?.(
      next,
    );
  };

  useEffect(() => {
    const select = fallback.current;
    if (!select) return;
    const picked = [...select.selectedOptions]
      .filter((option) => !(option.disabled && option.value === ""))
      .map((option) => option.value);
    if (picked.join("\n") !== values.join("\n")) {
      change(multiple ? picked : (picked[0] ?? ""));
    }
    setReady(true);
  }, [Boolean(name)]);

  useEffect(() => {
    if (ready) selectIn(fallback.current, values);
  });

  const defaults = JSON.stringify(toList(defaultValue));
  const resetting = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetting.current), []);
  useEffect(() => {
    const form = trigger.current?.form;
    if (!form) return;
    const reset = (event: Event) => {
      clearTimeout(resetting.current);
      resetting.current = setTimeout(() => {
        if (event.defaultPrevented) return;
        const restored: string[] = JSON.parse(defaults);
        setUncontrolled(restored);
        selectIn(fallback.current, value === undefined ? restored : values);
        if (value !== undefined || restored.join("\n") === uncontrolled.join("\n")) return;
        (onValueChange as ((value: string | string[]) => void) | undefined)?.(
          multiple ? restored : (restored[0] ?? ""),
        );
      });
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  });

  const selection = {
    multiple,
    value: multiple ? selected : (selected[0] ?? null),
    onValueChange: change,
  } as ListboxSelection;

  const button = (
    <button
      {...props}
      {...field}
      ref={triggerRef}
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
          ? (renderValue?.(values) ?? chosen.map((option) => option.label).join(", "))
          : placeholder}
      </span>
      <ExpandChevron />
    </button>
  );

  return (
    <>
      {name && (
        <span
          className="hselect-fallback"
          hidden={ready || props.hidden || undefined}
        >
          <select
            ref={fallback}
            name={name}
            form={props.form}
            multiple={multiple || undefined}
            disabled={disabled}
            required={(required && !ready) || undefined}
            aria-label={field["aria-label"]}
            aria-labelledby={field["aria-labelledby"]}
            aria-describedby={field["aria-describedby"]}
            aria-invalid={field["aria-invalid"]}
            defaultValue={multiple ? values : (values[0] ?? "")}
          >
            {!multiple && (placeholder !== undefined || !values.length) && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {fallbackOptions(children)}
          </select>
          {!multiple && <ExpandChevron />}
        </span>
      )}
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
    </>
  );
};

const selectIn = (select: HTMLSelectElement | null, values: string[]) => {
  if (!select) return;
  if (!select.multiple) select.value = values[0] ?? "";
  else for (const option of select.options) option.selected = values.includes(option.value);
};

type FallbackChild = {
  value?: unknown;
  label?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  children?: ReactNode;
};

const fallbackOptions = (node: ReactNode, grouped = false, prefix = ""): ReactNode[] =>
  flatChildren(node).flatMap((child) => {
    if (!isValidElement<FallbackChild>(child)) return [];
    const { value, label, disabled, hidden, children } = child.props;
    const key = `${prefix}${child.key}`;
    if (typeof value === "string") {
      return (
        <option
          key={key}
          value={value}
          disabled={disabled}
          hidden={hidden}
          suppressHydrationWarning
        >
          {textOf(children)}
        </option>
      );
    }
    if (child.type !== OptionGroup || grouped) {
      return fallbackOptions(children, grouped, key);
    }
    return (
      <optgroup key={key} label={textOf(label)} hidden={hidden}>
        {fallbackOptions(children, true, key)}
      </optgroup>
    );
  });
