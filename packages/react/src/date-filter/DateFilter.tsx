"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from "react";
import { Button } from "../Button.tsx";
import type { CalendarProps } from "../calendar/Calendar.tsx";
import { isDate } from "../calendar/dates.ts";
import { DatePicker } from "../date-picker/DatePicker.tsx";
import { typedDateOf } from "../date-picker/typedDate.ts";
import { FilterChip } from "../FilterChip.tsx";
import { Input } from "../Input.tsx";
import { Option } from "../listbox/Option.tsx";
import { Popup } from "../Popup.tsx";
import { Select } from "../Select.tsx";
import { useMergedRef } from "../useMergedRef.ts";
import {
  amountOf,
  cleaned,
  describeRange,
  draftOf,
  FIRST_DAY,
  isComplete,
  LAST_DAY,
  NO_RANGE,
  rangeOf,
  type DateFilterCondition,
  type DateFilterDraft,
  type DateFilterUnit,
  type DateFilterValue,
} from "./range.ts";

export type { DateFilterCondition, DateFilterUnit, DateFilterValue };

export interface DateFilterLabels {
  conditions: Record<DateFilterCondition, string>;
  units: Record<DateFilterUnit, string>;
  condition: string;
  amount: string;
  unit: string;
  date: string;
  startDate: string;
  endDate: string;
  and: string;
  datePlaceholder?: string;
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  apply: string;
  clear: string;
  afterDate?: (date: string) => string;
  beforeDate?: (date: string) => string;
  invalidDate?: string;
  endBeforeStart?: string;
}

type Problem = "invalid" | "order" | null;

const sameDraft = (one: DateFilterDraft, other: DateFilterDraft) =>
  one.condition === other.condition &&
  one.amount === other.amount &&
  one.unit === other.unit &&
  one.date === other.date &&
  one.endDate === other.endDate;

export interface DateFilterProps
  extends Omit<
      ComponentPropsWithRef<"button">,
      "value" | "defaultValue" | "type" | "children"
    >,
    Pick<CalendarProps, "weekStartsOn" | "today"> {
  label: string;
  locale: string;
  labels: DateFilterLabels;
  value?: DateFilterValue;
  defaultValue?: DateFilterValue;
  onValueChange?: (value: DateFilterValue) => void;
}

const CONDITIONS: DateFilterCondition[] = ["last", "equal", "between", "after", "before"];
const UNITS: DateFilterUnit[] = ["minutes", "hours", "days", "weeks", "months"];

const subscribe = () => () => {};

export const DateFilter = ({
  label,
  locale,
  labels,
  value: valueProp,
  defaultValue,
  onValueChange,
  weekStartsOn,
  today,
  disabled,
  ref,
  ...props
}: DateFilterProps) => {
  const popup = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const chipRef = useMergedRef(ref, chip);
  const dates = useRef<HTMLDivElement>(null);
  const messageId = useId();
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  const typing = useMemo(() => typedDateOf(locale), [locale]);

  const [chosen, setChosen] = useState(defaultValue);
  const current = cleaned(valueProp === undefined ? chosen : valueProp);
  const [draft, setDraft] = useState(() => draftOf(NO_RANGE));
  const opened = useRef(draft);
  const [openings, setOpenings] = useState(0);
  const [entered, setEntered] = useState(0);
  const [, recheck] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);

  useEffect(() => {
    const node = popup.current;
    if (!node) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      node.querySelector<HTMLElement>(".hselect")?.focus();
    };
    node.addEventListener("toggle", toggled);
    return () => node.removeEventListener("toggle", toggled);
  }, [disabled]);

  const edit = (change: Partial<DateFilterDraft>) => setDraft((was) => ({ ...was, ...change }));

  const amount = amountOf(draft.amount, draft.unit, typing.toLatin);
  const complete = isComplete(draft, amount);
  const between = draft.condition === "between";
  const applied = current.gte !== null || current.lte !== null;

  // In the browser only: the days are the viewer's, which a server can't know.
  const shown = inBrowser
    ? describeRange(current, locale, {
        after: labels.conditions.after,
        before: labels.conditions.before,
        afterDate: labels.afterDate,
        beforeDate: labels.beforeDate,
      })
    : null;

  const change = (next: DateFilterValue) => {
    setChosen(next);
    onValueChange?.(next);
  };

  // Nothing changed since it opened: the value applied stays as it is, as
  // the fields show only its days.
  const apply = () => {
    if (!complete) return;
    if (!applied || !sameDraft(draft, opened.current)) change(cleaned(rangeOf(draft, amount)));
    popup.current?.hidePopover();
    chip.current?.focus();
  };

  const clear = () => {
    popup.current?.querySelector<HTMLElement>(".hselect")?.focus();
    change(NO_RANGE);
    opened.current = draftOf(NO_RANGE);
    setDraft(opened.current);
    setOpenings((count) => count + 1);
  };

  // Enter in a date applies once the fields are complete, after the Date
  // Picker has settled what was typed. Under "is between", Enter in the start
  // date only settles it, even with an end date already there.
  const enterInDate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const field = event.target as Element;
    if (!field.matches(".hdate-picker > .hinput")) return;
    event.preventDefault();
    if (between && field.parentElement === dates.current?.querySelector(".hdate-picker")) return;
    setEntered((count) => count + 1);
  };

  // Why a date shown can't be used, read from the Date Pickers once they've
  // settled what was typed: a date out of order under "is between", or else
  // one that isn't a date.
  const problemIn = (pickers: HTMLElement[]): Problem => {
    for (const [index, picker] of pickers.entries()) {
      const field = picker.querySelector<HTMLInputElement>(".hinput");
      if (picker.hidden || !field || field.getAttribute("aria-invalid") !== "true") continue;
      const typed = typing.parse(field.value.trim());
      const other = index === 0 ? draft.endDate : draft.date;
      const outOfOrder =
        between && other !== null && isDate(typed) && (index === 0 ? typed > other : typed < other);
      return outOfOrder ? "order" : "invalid";
    }
    return null;
  };

  useLayoutEffect(() => {
    const pickers = Array.from(dates.current?.querySelectorAll<HTMLElement>(".hdate-picker") ?? []);
    setProblem(draft.condition === "last" ? null : problemIn(pickers));
  });

  useEffect(() => {
    if (entered > 0 && complete) apply();
  }, [entered]);

  const message =
    problem === "order"
      ? (labels.endBeforeStart ?? labels.invalidDate)
      : problem === "invalid"
        ? labels.invalidDate
        : undefined;
  const explains = labels.invalidDate !== undefined || labels.endBeforeStart !== undefined;

  const picker = {
    locale,
    calendarLabel: labels.calendar,
    previousLabel: labels.previousMonth,
    nextLabel: labels.nextMonth,
    placeholder: labels.datePlaceholder,
    weekStartsOn,
    today,
    onBlur: () => recheck((count) => count + 1),
    onInvalidChange: () => recheck((count) => count + 1),
  };

  const trigger = (
    <FilterChip
      {...props}
      ref={chipRef}
      label={label}
      values={shown === null ? [] : [shown]}
      aria-haspopup="dialog"
      aria-expanded={false}
      disabled={disabled}
    />
  );

  if (disabled) return trigger;

  return (
    <Popup
      ref={popup}
      className="hdate-filter"
      role="dialog"
      aria-label={label}
      onBeforeToggle={(event) => {
        if (event.newState !== "open") return;
        opened.current = draftOf(current);
        setDraft(opened.current);
        setOpenings((count) => count + 1);
      }}
      trigger={trigger}
    >
      <Select
        aria-label={labels.condition}
        value={draft.condition}
        onValueChange={(condition) => edit({ condition: condition as DateFilterCondition })}
      >
        {CONDITIONS.map((condition) => (
          <Option key={condition} value={condition}>
            {labels.conditions[condition]}
          </Option>
        ))}
      </Select>
      <div className="hdate-filter-fields" hidden={draft.condition !== "last"}>
        <Input
          className="hdate-filter-amount"
          aria-label={labels.amount}
          inputMode="numeric"
          autoComplete="off"
          value={draft.amount}
          onChange={(event) => edit({ amount: event.target.value })}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            apply();
          }}
        />
        <Select
          aria-label={labels.unit}
          value={draft.unit}
          onValueChange={(unit) => edit({ unit: unit as DateFilterUnit })}
        >
          {UNITS.map((unit) => (
            <Option key={unit} value={unit}>
              {labels.units[unit]}
            </Option>
          ))}
        </Select>
      </div>
      <div
        ref={dates}
        className="hdate-filter-fields"
        hidden={draft.condition === "last"}
        onKeyDown={enterInDate}
      >
        <DatePicker
          {...picker}
          key={`start-${openings}`}
          aria-label={between ? labels.startDate : labels.date}
          value={draft.date}
          onValueChange={(date) => edit({ date })}
          min={FIRST_DAY}
          max={(between && draft.endDate) || LAST_DAY}
        />
        <span className="hdate-filter-and" hidden={!between}>
          {labels.and}
        </span>
        <DatePicker
          {...picker}
          key={`end-${openings}`}
          aria-label={labels.endDate}
          hidden={!between}
          value={draft.endDate}
          onValueChange={(endDate) => edit({ endDate })}
          min={draft.date ?? FIRST_DAY}
          max={LAST_DAY}
        />
      </div>
      {explains && (
        <p className="hdate-filter-message" id={messageId} role="status">
          {message}
        </p>
      )}
      <div className="hdate-filter-actions">
        <Button variant="tertiary" hidden={!applied} onClick={clear}>
          {labels.clear}
        </Button>
        <Button
          aria-disabled={complete ? undefined : true}
          aria-describedby={explains ? messageId : undefined}
          onClick={apply}
        >
          {labels.apply}
        </Button>
      </div>
    </Popup>
  );
};
