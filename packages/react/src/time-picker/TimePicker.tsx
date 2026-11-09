"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ExpandChevron } from "../ExpandChevron.tsx";
import { Field, useField, type StackedFieldProps } from "../field/Field.tsx";
import { Popup } from "../Popup.tsx";
import { withClass } from "../withClass.ts";
import { clockOf, isTime, minutesOf, type ClockColumn } from "./clock.ts";

type TimePickerControlProps = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "defaultValue" | "type" | "children"
> & {
  locale: string;
  hourLabel: string;
  minuteLabel: string;
  periodLabel: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: ReactNode;
  minuteStep?: number;
  hour12?: boolean;
};

type TimePickerField =
  | ({ label: StackedFieldProps["label"] } & Partial<
      Pick<StackedFieldProps, "optional" | "description" | "error">
    >)
  | {
      label?: undefined;
      optional?: never;
      description?: never;
      error?: never;
    };

export type TimePickerProps = TimePickerControlProps & TimePickerField;

export const TimePicker = (timePickerProps: TimePickerProps) => {
  const { label, optional, description, error, hidden, ...props } = timePickerProps;
  if (label === undefined) return <TimePickerControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      control="button"
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in timePickerProps && { error })}
    >
      <TimePickerControl {...props} />
    </Field>
  );
};

interface ColumnOption {
  value: number;
  text: string;
}

const showChosen = (column: HTMLElement, center: boolean) => {
  const option = column.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!option) return;
  if (center) {
    column.scrollTop = option.offsetTop - (column.clientHeight - option.offsetHeight) / 2;
  } else if (option.offsetTop < column.scrollTop) {
    column.scrollTop = option.offsetTop;
  } else if (option.offsetTop + option.offsetHeight > column.scrollTop + column.clientHeight) {
    column.scrollTop = option.offsetTop + option.offsetHeight - column.clientHeight;
  }
};

const TimePickerControl = ({
  locale,
  hourLabel,
  minuteLabel,
  periodLabel,
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  placeholder,
  minuteStep = 15,
  hour12,
  disabled,
  ref,
  className,
  ...props
}: TimePickerControlProps) => {
  const field = useField(props);
  const baseId = useId();
  const valueId = `${baseId}-value`;
  const buttonId = field.id ?? `${baseId}-button`;
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const pressingTrigger = useRef(false);
  useImperativeHandle(ref, () => trigger.current as HTMLButtonElement, []);

  const clock = useMemo(() => clockOf(locale, hour12), [locale, hour12]);

  const [chosen, setChosen] = useState(isTime(defaultValue) ? defaultValue : null);
  const current = valueProp === undefined ? chosen : isTime(valueProp) ? valueProp : null;
  const [hour, minute] = current ? current.split(":").map(Number) : [undefined, undefined];

  const [kept, setKept] = useState<number[]>([]);
  if (minute !== undefined && !kept.includes(minute) && !minutesOf(minuteStep).includes(minute)) {
    setKept([...kept, minute]);
  }

  const panels = () => popup.current?.querySelectorAll<HTMLElement>(".htime-picker-column") ?? [];

  useEffect(() => {
    const node = popup.current;
    if (!node) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      for (const column of panels()) showChosen(column, true);
      panels()[0]?.focus();
    };
    node.addEventListener("toggle", toggled);
    return () => node.removeEventListener("toggle", toggled);
  }, [disabled]);

  useEffect(() => {
    for (const column of panels()) showChosen(column, false);
  }, [current]);

  useEffect(() => {
    const form = trigger.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (!event.defaultPrevented) setChosen(isTime(defaultValue) ? defaultValue : null);
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);

  const choose = (nextHour: number, nextMinute: number) => {
    const next = `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
    if (next === current) return;
    setChosen(next);
    onValueChange?.(next);
  };

  const afternoon = (hour ?? 0) >= 12;
  const shownHour = hour === undefined ? undefined : clock.twelve ? hour % 12 || 12 : hour;
  const toDay = (picked: number, pm: boolean) => (clock.twelve ? (picked % 12) + (pm ? 12 : 0) : picked);

  const columns: Record<
    ClockColumn,
    { label: string; options: ColumnOption[]; selected?: number; pick: (value: number) => void }
  > = {
    hour: {
      label: hourLabel,
      options: clock.hours.map((value) => ({ value, text: clock.digits(value) })),
      selected: shownHour,
      pick: (value) => choose(toDay(value, afternoon), minute ?? 0),
    },
    minute: {
      label: minuteLabel,
      options: minutesOf(minuteStep, minute === undefined ? kept : [...kept, minute]).map((value) => ({
        value,
        text: clock.digits(value),
      })),
      selected: minute,
      pick: (value) => choose(hour ?? 0, value),
    },
    dayPeriod: {
      label: periodLabel,
      options: clock.periods.map((text, value) => ({ value, text })),
      selected: hour === undefined ? undefined : afternoon ? 1 : 0,
      pick: (value) => choose(((hour ?? 0) % 12) + value * 12, minute ?? 0),
    },
  };

  const press = (event: KeyboardEvent<HTMLUListElement>, name: ClockColumn, place: number) => {
    const { options, selected, pick } = columns[name];
    const index = options.findIndex((option) => option.value === selected);
    const step = (direction: number) => {
      event.preventDefault();
      const next = index < 0 ? (direction > 0 ? 0 : options.length - 1) : (index + direction + options.length) % options.length;
      pick((options[next] as ColumnOption).value);
    };
    const toColumn = (direction: number) => {
      event.preventDefault();
      panels()[place + direction]?.focus();
    };
    const forward = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    if (event.key === "ArrowDown") step(1);
    else if (event.key === "ArrowUp") step(-1);
    else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      pick((options[event.key === "Home" ? 0 : options.length - 1] as ColumnOption).value);
    } else if (event.key === "ArrowRight") toColumn(forward);
    else if (event.key === "ArrowLeft") toColumn(-forward);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      popup.current?.hidePopover();
      trigger.current?.focus();
    }
  };

  const leave = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    const pressed = next === trigger.current && pressingTrigger.current;
    if (next && !pressed && !event.currentTarget.contains(next)) {
      event.currentTarget.hidePopover();
    }
  };

  const named = field["aria-labelledby"] ?? (props["aria-label"] === undefined ? undefined : buttonId);

  const button = (
    <button
      {...props}
      {...field}
      id={buttonId}
      ref={trigger}
      className={withClass("htime-picker", className)}
      type="button"
      aria-labelledby={named ? `${named} ${valueId}` : undefined}
      aria-haspopup="dialog"
      aria-expanded={false}
      disabled={disabled}
      onPointerDown={(event) => {
        pressingTrigger.current = true;
        props.onPointerDown?.(event);
      }}
      onClick={(event) => {
        pressingTrigger.current = false;
        props.onClick?.(event);
      }}
    >
      <span
        className="htime-picker-value"
        id={valueId}
        data-placeholder={current ? undefined : ""}
        suppressHydrationWarning
      >
        {current ? clock.written(current) : placeholder}
      </span>
      <ExpandChevron />
    </button>
  );

  return (
    <>
      {disabled ? (
        button
      ) : (
        <Popup
          ref={popup}
          trigger={button}
          className="htime-picker-popup"
          role="dialog"
          aria-labelledby={field["aria-labelledby"]}
          aria-label={field["aria-labelledby"] ? undefined : props["aria-label"]}
          onBlur={leave}
        >
          {(clock.twelve ? clock.columns : clock.columns.filter((column) => column !== "dayPeriod")).map(
            (column, place) => {
              const { label, options, selected, pick } = columns[column];
              const optionId = (value: number) => `${baseId}-${column}-${value}`;
              return (
                <ul
                  key={column}
                  className="htime-picker-column"
                  role="listbox"
                  aria-label={label}
                  tabIndex={0}
                  aria-activedescendant={selected === undefined ? undefined : optionId(selected)}
                  onKeyDown={(event) => press(event, column, place)}
                >
                  {options.map((option) => (
                    <li
                      key={option.value}
                      className="htime-picker-option"
                      id={optionId(option.value)}
                      role="option"
                      aria-selected={option.value === selected}
                      onClick={() => pick(option.value)}
                      suppressHydrationWarning
                    >
                      {option.text}
                    </li>
                  ))}
                </ul>
              );
            },
          )}
        </Popup>
      )}
      {name && (
        <input type="hidden" name={name} value={current ?? ""} form={props.form} disabled={disabled} />
      )}
    </>
  );
};
