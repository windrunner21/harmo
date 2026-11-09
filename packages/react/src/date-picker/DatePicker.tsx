"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "../Button.tsx";
import { Calendar, type CalendarProps } from "../calendar/Calendar.tsx";
import { isDate, isDateTime } from "../calendar/dates.ts";
import { Field, FieldContext, type StackedFieldProps } from "../field/Field.tsx";
import { calendar } from "../icons.ts";
import { Input } from "../Input.tsx";
import { placePopup } from "../Popup.tsx";
import { useMergedRef } from "../useMergedRef.ts";
import {
  longDateOf,
  readNaturalDate,
  typedDateOf,
  type NaturalDateParser,
} from "./typedDate.ts";

export type { NaturalDateParser };

type DatePickerReading =
  | { natural?: undefined; parse?: undefined; time?: never }
  | { natural: NaturalDateParser; parse?: never; time?: boolean }
  | { natural?: undefined; parse: (text: string) => string | null; time?: boolean };

type DatePickerControlProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "type" | "onChange" | "min" | "max" | "children"
> &
  Pick<CalendarProps, "locale" | "previousLabel" | "nextLabel" | "weekStartsOn" | "today"> & {
    calendarLabel: string;
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    onInvalidChange?: (invalid: boolean) => void;
    min?: string;
    max?: string;
    format?: (date: string) => string;
  } & DatePickerReading;

type DatePickerField =
  | ({ label: StackedFieldProps["label"] } & Partial<
      Pick<StackedFieldProps, "optional" | "description" | "error">
    >)
  | {
      label?: undefined;
      optional?: never;
      description?: never;
      error?: never;
    };

export type DatePickerProps = DatePickerControlProps & DatePickerField;

const calendarIcon = (
  <svg className="hicon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {calendar.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

export const DatePicker = (datePickerProps: DatePickerProps) => {
  const { label, optional, description, error, hidden, ...props } = datePickerProps;
  if (label === undefined) return <DatePickerControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in datePickerProps && { error })}
    >
      <DatePickerControl {...props} />
    </Field>
  );
};

const DatePickerControl = ({
  locale,
  calendarLabel,
  previousLabel,
  nextLabel,
  value: valueProp,
  defaultValue,
  onValueChange,
  onInvalidChange,
  min,
  max,
  weekStartsOn,
  today,
  natural,
  parse,
  time,
  format,
  name,
  form,
  disabled,
  readOnly,
  hidden,
  ref,
  onBlur,
  onKeyDown,
  ...props
}: DatePickerControlProps) => {
  const popupId = useId();
  const anchor = `--${useId()}`;
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const inputRef = useMergedRef(ref, input);
  const caret = useRef<number | null>(null);
  const pressingButton = useRef(false);

  const typing = useMemo(() => typedDateOf(locale), [locale]);
  const long = useMemo(() => longDateOf(locale, time), [locale, time]);
  const free = Boolean(natural || parse);
  const written = (date: string | null) =>
    date ? (format ?? (natural || time ? long : typing.format))(date) : "";
  const read = (typed: string) => {
    if (natural) return readNaturalDate(natural, typed, { time, today: isDate(today) ? today : undefined });
    return (parse ?? typing.parse)(typed);
  };
  const isValue = (candidate?: string | null): candidate is string =>
    time ? isDateTime(candidate) : isDate(candidate);

  const [chosen, setChosen] = useState(isValue(defaultValue) ? defaultValue : null);
  const current = valueProp === undefined ? chosen : isValue(valueProp) ? valueProp : null;
  const [text, setText] = useState(() => written(current));
  const [invalid, setInvalid] = useState(false);
  const [followed, setFollowed] = useState(current);
  if (current !== followed) {
    setFollowed(current);
    setText(written(current));
    setInvalid(false);
  }

  const shown = written(current);
  const [lastShown, setLastShown] = useState(shown);
  if (shown !== lastShown) {
    setLastShown(shown);
    if (text === lastShown) setText(shown);
  }

  const [open, setOpen] = useState(false);
  const [openings, setOpenings] = useState(0);

  const reportedInvalid = useRef(false);
  useEffect(() => {
    if (reportedInvalid.current === invalid) return;
    reportedInvalid.current = invalid;
    onInvalidChange?.(invalid);
  });

  useLayoutEffect(() => {
    if (caret.current === null) return;
    const field = input.current;
    if (field && field === field.ownerDocument.activeElement) {
      const position = typing.caretAfter(text, caret.current);
      field.setSelectionRange(position, position);
    }
    caret.current = null;
  });

  useEffect(() => {
    const node = popup.current;
    if (!node) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      node.querySelector<HTMLElement>('.hcalendar-day[tabindex="0"]')?.focus();
    };
    node.addEventListener("toggle", toggled);
    return () => node.removeEventListener("toggle", toggled);
  }, []);

  useEffect(() => {
    const owner = input.current?.form;
    if (!owner) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        const initial = isValue(defaultValue) ? defaultValue : null;
        setChosen(initial);
        setFollowed(valueProp === undefined ? initial : current);
        setText(written(valueProp === undefined ? initial : current));
        setInvalid(false);
      });
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  });

  const allowed = (date: string) =>
    (!isDate(min) || date.slice(0, 10) >= min) && (!isDate(max) || date.slice(0, 10) <= max);

  const settle = (next: string | null) => {
    if (next === current) return;
    setFollowed(next);
    setChosen(next);
    onValueChange?.(next);
  };

  const commit = () => {
    const typed = text.trim();
    if (!typed) {
      setInvalid(false);
      settle(null);
      return;
    }
    if (typed === written(current)) return;
    const parsed = read(typed);
    if (isValue(parsed) && allowed(parsed)) {
      setText(written(parsed));
      setInvalid(false);
      settle(parsed);
    } else {
      setInvalid(true);
      settle(null);
    }
  };

  const type = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (free) {
      setText(raw);
      return;
    }
    const masked = typing.mask(raw);
    const digits = typing.digitsIn(raw.slice(0, event.target.selectionStart ?? raw.length));
    if (masked === text) {
      const position = typing.caretAfter(masked, digits);
      event.target.value = masked;
      event.target.setSelectionRange(position, position);
      return;
    }
    caret.current = digits;
    setText(masked);
  };

  const leaveField = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    commit();
  };

  const pressInField = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter") return;
    if (text.trim() === written(current)) return;
    event.preventDefault();
    commit();
  };

  const pick = (date: string) => {
    const next = time ? `${date}T${current?.slice(11) ?? "00:00"}` : date;
    setText(written(next));
    setInvalid(false);
    settle(next);
    popup.current?.hidePopover();
    button.current?.focus();
  };

  const leavePopup = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    const pressed = next === button.current && pressingButton.current;
    if (next && !pressed && !event.currentTarget.contains(next)) {
      event.currentTarget.hidePopover();
    }
  };

  return (
    <>
      <div
        className="hdate-picker"
        hidden={hidden}
        style={{ anchorName: anchor } as CSSProperties}
      >
        <Input
          {...props}
          ref={inputRef}
          type="text"
          inputMode={free ? props.inputMode : (props.inputMode ?? "numeric")}
          autoComplete={props.autoComplete ?? "off"}
          form={form}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          aria-invalid={invalid ? true : props["aria-invalid"]}
          onChange={type}
          onBlur={leaveField}
          onKeyDown={pressInField}
          suppressHydrationWarning
        />
        <FieldContext value={{}}>
          <Button
            ref={button}
            variant="tertiary"
            size="small"
            aria-label={calendarLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            popoverTarget={popupId}
            disabled={disabled || readOnly}
            onPointerDown={() => {
              pressingButton.current = true;
            }}
            onClick={() => {
              pressingButton.current = false;
            }}
          >
            {calendarIcon}
          </Button>
        </FieldContext>
        {name && (
          <input type="hidden" name={name} form={form} disabled={disabled} value={current ?? ""} />
        )}
      </div>
      <div
        ref={popup}
        className="hpopup hdate-picker-popup"
        id={popupId}
        popover=""
        role="dialog"
        aria-label={calendarLabel}
        style={{ positionAnchor: anchor } as CSSProperties}
        onBlur={leavePopup}
        onBeforeToggle={(event) => {
          const opening = event.newState === "open";
          setOpen(opening);
          if (opening) setOpenings((count) => count + 1);
          placePopup(event.currentTarget, opening);
        }}
      >
        <FieldContext value={{}}>
          <Calendar
            key={openings}
            locale={locale}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
            value={current?.slice(0, 10) ?? null}
            onValueChange={pick}
            min={min}
            max={max}
            weekStartsOn={weekStartsOn}
            today={today}
          />
        </FieldContext>
      </div>
    </>
  );
};
