"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
} from "react";
import { Button } from "../Button.tsx";
import type { CalendarProps } from "../calendar/Calendar.tsx";
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
  isComplete,
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
}

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
  ref,
  ...props
}: DateFilterProps) => {
  const popup = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const chipRef = useMergedRef(ref, chip);
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  const toLatin = useMemo(() => typedDateOf(locale).toLatin, [locale]);

  const [chosen, setChosen] = useState(defaultValue);
  const current = cleaned(valueProp === undefined ? chosen : valueProp);
  const [draft, setDraft] = useState(() => draftOf(NO_RANGE));
  const [openings, setOpenings] = useState(0);

  useEffect(() => {
    const node = popup.current;
    if (!node) return;
    const toggled = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      node.querySelector<HTMLElement>(".hselect")?.focus();
    };
    node.addEventListener("toggle", toggled);
    return () => node.removeEventListener("toggle", toggled);
  }, []);

  const edit = (change: Partial<DateFilterDraft>) => setDraft((was) => ({ ...was, ...change }));

  const amount = amountOf(draft.amount, draft.unit, toLatin);
  const complete = isComplete(draft, amount);
  const between = draft.condition === "between";
  const applied = current.gte !== null || current.lte !== null;

  // In the browser only: the days are the viewer's, which a server can't know.
  const shown = inBrowser ? describeRange(current, locale, labels.conditions) : null;

  const change = (next: DateFilterValue) => {
    setChosen(next);
    onValueChange?.(next);
  };

  const apply = () => {
    if (!complete) return;
    change(rangeOf(draft, amount));
    popup.current?.hidePopover();
    chip.current?.focus();
  };

  const clear = () => {
    popup.current?.querySelector<HTMLElement>(".hselect")?.focus();
    change(NO_RANGE);
    setDraft(draftOf(NO_RANGE));
    setOpenings((count) => count + 1);
  };

  const picker = {
    locale,
    calendarLabel: labels.calendar,
    previousLabel: labels.previousMonth,
    nextLabel: labels.nextMonth,
    placeholder: labels.datePlaceholder,
    weekStartsOn,
    today,
  };

  return (
    <Popup
      ref={popup}
      className="hdate-filter"
      role="dialog"
      aria-label={label}
      onBeforeToggle={(event) => {
        if (event.newState !== "open") return;
        setDraft(draftOf(current));
        setOpenings((count) => count + 1);
      }}
      trigger={
        <FilterChip
          {...props}
          ref={chipRef}
          label={label}
          values={shown === null ? [] : [shown]}
          aria-haspopup="dialog"
        />
      }
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
      <div className="hdate-filter-fields" hidden={draft.condition === "last"}>
        <DatePicker
          {...picker}
          key={`start-${openings}`}
          aria-label={between ? labels.startDate : labels.date}
          value={draft.date}
          onValueChange={(date) => edit({ date })}
          max={between ? (draft.endDate ?? undefined) : undefined}
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
          min={draft.date ?? undefined}
        />
      </div>
      <div className="hdate-filter-actions">
        <Button variant="tertiary" hidden={!applied} onClick={clear}>
          {labels.clear}
        </Button>
        <Button aria-disabled={complete ? undefined : true} onClick={apply}>
          {labels.apply}
        </Button>
      </div>
    </Popup>
  );
};
