"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from "react";
import { Button } from "../Button.tsx";
import { Chevron } from "../Chevron.tsx";
import { withClass } from "../withClass.ts";
import {
  addDays,
  addMonths,
  dateOf,
  FIRST_DATE,
  firstDayOf,
  isDate,
  isMonth,
  LAST_DATE,
  monthOf,
  todayDate,
  weeksOf,
} from "./dates.ts";

export interface CalendarProps
  extends Omit<ComponentPropsWithRef<"div">, "children" | "defaultValue"> {
  locale: string;
  previousLabel: string;
  nextLabel: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  month?: string;
  defaultMonth?: string;
  onMonthChange?: (month: string) => void;
  min?: string;
  max?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  today?: string;
}

const formatsOf = (locale: string) => {
  const options = { calendar: "gregory", timeZone: "UTC" };
  return {
    title: new Intl.DateTimeFormat(locale, { ...options, month: "long", year: "numeric" }),
    date: new Intl.DateTimeFormat(locale, { ...options, dateStyle: "full" }),
    number: new Intl.NumberFormat(locale, { useGrouping: false }),
    weekday: new Intl.DateTimeFormat(locale, { ...options, weekday: "short" }),
    weekdayName: new Intl.DateTimeFormat(locale, { ...options, weekday: "long" }),
  };
};

// A Sunday, to count weekdays from.
const SUNDAY = "2023-01-01";

const BLANK_WEEKS = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));

const subscribe = () => () => {};

export const Calendar = ({
  locale,
  previousLabel,
  nextLabel,
  value: valueProp,
  defaultValue,
  onValueChange,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  min: minProp,
  max: maxProp,
  weekStartsOn,
  today: todayProp,
  className,
  ...props
}: CalendarProps) => {
  const titleId = useId();
  const grid = useRef<HTMLTableElement>(null);
  const focusNext = useRef<string | null>(null);

  const [chosen, setChosen] = useState(defaultValue ?? null);
  const current = valueProp === undefined ? chosen : valueProp;
  const value = isDate(current) ? current : null;
  const min = isDate(minProp) ? minProp : FIRST_DATE;
  const max = isDate(maxProp) ? maxProp : LAST_DATE;

  const clientToday = useSyncExternalStore(subscribe, todayDate, () => null);
  const today = isDate(todayProp) ? todayProp : clientToday;

  const [viewed, setViewed] = useState(isMonth(defaultMonth) ? defaultMonth : value && monthOf(value));
  const [followed, setFollowed] = useState(value);
  if (value !== followed) {
    setFollowed(value);
    if (value) setViewed(monthOf(value));
  }
  const inView = viewed ?? (today ? monthOf(today) : null);
  const allowed = (shown: string) =>
    shown < monthOf(min) ? monthOf(min) : shown > monthOf(max) ? monthOf(max) : shown;
  const month = isMonth(monthProp) ? monthProp : inView && allowed(inView);

  const [cursor, setCursor] = useState<string | null>(null);

  const formats = useMemo(() => formatsOf(locale), [locale]);
  const firstDay = weekStartsOn ?? firstDayOf(locale);
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => dateOf(addDays(SUNDAY, firstDay + index))),
    [firstDay],
  );
  const weeks = useMemo(() => (month ? weeksOf(month, firstDay) : BLANK_WEEKS), [month, firstDay]);

  useEffect(() => {
    if (!focusNext.current) return;
    const day = grid.current?.querySelector<HTMLElement>(`[data-date="${focusNext.current}"]`);
    if (!day) return;
    focusNext.current = null;
    day.focus();
  });

  const inRange = (date: string) => date >= min && date <= max;
  const clamp = (date: string) => (date < min ? min : date > max ? max : date);
  const showable = (date: string | null): date is string =>
    !!date && !!month && monthOf(date) === month && inRange(date);

  const firstInMonth = month ? clamp(`${month}-01`) : null;
  const tabStop = [cursor, value, today, firstInMonth].find(showable);

  const stepTo = (months: number) => (month ? monthOf(addMonths(`${month}-01`, months)) : null);
  const previousMonth = stepTo(-1);
  const nextMonth = stepTo(1);
  const previousBlocked = !month || month <= monthOf(min);
  const nextBlocked = !month || month >= monthOf(max);

  const show = (next: string) => {
    setViewed(next);
    onMonthChange?.(next);
  };

  const turnTo = (next: string | null) => {
    if (!next) return;
    focusNext.current = null;
    show(next);
  };

  const choose = (date: string) => {
    focusNext.current = null;
    setChosen(date);
    setCursor(date);
    onValueChange?.(date);
  };

  const move = (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const from = (event.target as HTMLElement).dataset.date;
    if (!from || !month) return;
    const forward = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    const weekday = (dateOf(from).getUTCDay() - firstDay + 7) % 7;
    const start = addDays(from, -weekday);
    const end = addDays(from, 6 - weekday);
    const lastOfMonth = addDays(addMonths(`${month}-01`, 1), -1);
    const targets: Record<string, string> = {
      ArrowRight: addDays(from, forward),
      ArrowLeft: addDays(from, -forward),
      ArrowDown: addDays(from, 7),
      ArrowUp: addDays(from, -7),
      Home: monthOf(start) === month ? start : `${month}-01`,
      End: monthOf(end) === month ? end : lastOfMonth,
      PageUp: addMonths(from, event.shiftKey ? -12 : -1),
      PageDown: addMonths(from, event.shiftKey ? 12 : 1),
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    if (!isDate(target)) return;
    const to = clamp(target);
    if (to === from) return;
    setCursor(to);
    if (monthOf(to) === month) {
      grid.current?.querySelector<HTMLElement>(`[data-date="${to}"]`)?.focus();
    } else {
      focusNext.current = to;
      show(monthOf(to));
    }
  };

  return (
    <div {...props} className={withClass("hcalendar", className)}>
      <div className="hcalendar-header">
        <Button
          variant="tertiary"
          size="small"
          aria-label={previousLabel}
          aria-disabled={previousBlocked || undefined}
          onClick={previousBlocked ? undefined : () => turnTo(previousMonth)}
        >
          <Chevron direction="back" />
        </Button>
        <p className="hcalendar-title" id={titleId} aria-live="polite" suppressHydrationWarning>
          {month && formats.title.format(dateOf(`${month}-01`))}
        </p>
        <Button
          variant="tertiary"
          size="small"
          aria-label={nextLabel}
          aria-disabled={nextBlocked || undefined}
          onClick={nextBlocked ? undefined : () => turnTo(nextMonth)}
        >
          <Chevron />
        </Button>
      </div>
      <table
        ref={grid}
        className="hcalendar-grid"
        role="grid"
        aria-labelledby={titleId}
        onKeyDown={move}
      >
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th
                key={weekday.getTime()}
                scope="col"
                abbr={formats.weekdayName.format(weekday)}
                suppressHydrationWarning
              >
                {formats.weekday.format(weekday)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, row) => (
            <tr key={row}>
              {week.map((date, column) =>
                date ? (
                  <td key={column} aria-selected={date === value || undefined}>
                    <button
                      className="hcalendar-day"
                      type="button"
                      tabIndex={date === tabStop ? 0 : -1}
                      data-date={date}
                      aria-label={formats.date.format(dateOf(date))}
                      aria-current={date === today ? "date" : undefined}
                      disabled={!inRange(date)}
                      onClick={() => choose(date)}
                      suppressHydrationWarning
                    >
                      {formats.number.format(dateOf(date).getUTCDate())}
                    </button>
                  </td>
                ) : (
                  <td key={column} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
