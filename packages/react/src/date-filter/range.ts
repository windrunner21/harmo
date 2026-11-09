import { addDays, addMonths, dateOf, FIRST_DATE, LAST_DATE } from "../calendar/dates.ts";

export type DateFilterCondition = "last" | "equal" | "between" | "after" | "before";
export type DateFilterUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export interface DateFilterValue {
  gte: number | null;
  lte: number | null;
}

export interface DateFilterDraft {
  condition: DateFilterCondition;
  amount: string;
  unit: DateFilterUnit;
  date: string | null;
  endDate: string | null;
}

export const NO_RANGE: DateFilterValue = { gte: null, lte: null };

const SECONDS = { minutes: 60, hours: 3600, days: 86400, weeks: 604800, months: 2678400 };

// So far back that a Date Picker can still show where it lands.
const LONGEST = 50_000_000_000;

const part = (value: number, length = 2) => String(value).padStart(length, "0");

const localDate = (moment: Date) =>
  `${part(moment.getFullYear(), 4)}-${part(moment.getMonth() + 1)}-${part(moment.getDate())}`;

const momentOf = (date: string, hours = 0, minutes = 0, seconds = 0) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year!, month! - 1, day!, hours, minutes, seconds);
};

const secondsOf = (moment: Date) => Math.floor(moment.getTime() / 1000);
const dayOf = (seconds: number) => localDate(new Date(seconds * 1000));
const startOfDay = (date: string) => secondsOf(momentOf(date));
// The next day's start, less a second: where clocks go back at midnight, the
// last hour of the day happens twice.
const endOfDay = (date: string) => secondsOf(momentOf(date, 24)) - 1;

const isOneWholeDay = (gte: number, lte: number) =>
  gte === startOfDay(dayOf(gte)) && lte === endOfDay(dayOf(gte));

// A day inside the dates a Date Picker can show, so that it's a date in every
// time zone, and a server takes the same values as the viewer's browser.
const EARLIEST = dateOf(addDays(FIRST_DATE, 1)).getTime() / 1000;
const LATEST = dateOf(addDays(LAST_DATE, -1)).getTime() / 1000;

// A URL can hold anything, so what can't be a date counts as not being there.
const readable = (seconds: unknown) =>
  typeof seconds === "number" && seconds >= EARLIEST && seconds <= LATEST ? seconds : null;

export const cleaned = (value?: DateFilterValue | null): DateFilterValue => ({
  gte: readable(value?.gte),
  lte: readable(value?.lte),
});

const conditionOf = ({ gte, lte }: DateFilterValue): DateFilterCondition => {
  if (gte === null && lte === null) return "last";
  if (lte === null) return "after";
  if (gte === null) return "before";
  return isOneWholeDay(gte, lte) ? "equal" : "between";
};

export const draftOf = (value: DateFilterValue): DateFilterDraft => {
  const { gte, lte } = value;
  const first = gte ?? lte;
  return {
    condition: conditionOf(value),
    amount: "",
    unit: "days",
    date: first === null ? null : dayOf(first),
    endDate: gte === null || lte === null ? null : dayOf(lte),
  };
};

export const amountOf = (text: string, unit: DateFilterUnit, toLatin: (text: string) => string) => {
  const typed = text.trim();
  const latin = toLatin(typed);
  if (!latin || latin.length !== Array.from(typed).length) return null;
  const amount = Number(latin);
  return amount > 0 && amount * SECONDS[unit] <= LONGEST ? amount : null;
};

export const isComplete = (draft: DateFilterDraft, amount: number | null) => {
  if (draft.condition === "last") return amount !== null;
  if (draft.condition !== "between") return draft.date !== null;
  return draft.date !== null && draft.endDate !== null && draft.date <= draft.endDate;
};

const earlierBy = (now: Date, amount: number, unit: DateFilterUnit) => {
  if (unit !== "months") return secondsOf(now) - amount * SECONDS[unit];
  const hours = [now.getHours(), now.getMinutes(), now.getSeconds()] as const;
  return secondsOf(momentOf(addMonths(localDate(now), -amount), ...hours));
};

// The times a complete draft stands for. Those for a number of days back are
// worked out now, so a link to them shows the window that was seen.
export const rangeOf = (draft: DateFilterDraft, amount: number | null): DateFilterValue => {
  const date = draft.date as string;
  switch (draft.condition) {
    case "last": {
      const now = new Date();
      return { gte: earlierBy(now, amount as number, draft.unit), lte: secondsOf(now) };
    }
    case "equal":
      return { gte: startOfDay(date), lte: endOfDay(date) };
    case "between":
      return { gte: startOfDay(date), lte: endOfDay(draft.endDate as string) };
    case "after":
      return { gte: startOfDay(date), lte: null };
    case "before":
      return { gte: null, lte: endOfDay(date) };
  }
};

// What the chip shows: a range of days, or of times within one day.
export const describeRange = (
  { gte, lte }: DateFilterValue,
  locale: string,
  words: { after: string; before: string },
) => {
  const dates = new Intl.DateTimeFormat(locale, { calendar: "gregory", dateStyle: "medium" });
  if (gte === null && lte === null) return null;
  if (lte === null) return `${words.after} ${dates.format(gte! * 1000)}`;
  if (gte === null) return `${words.before} ${dates.format(lte * 1000)}`;
  if (gte > lte) return `${dates.format(gte * 1000)} – ${dates.format(lte * 1000)}`;
  const partOfDay = dayOf(gte) === dayOf(lte) && !isOneWholeDay(gte, lte);
  const format = partOfDay
    ? new Intl.DateTimeFormat(locale, { calendar: "gregory", dateStyle: "medium", timeStyle: "short" })
    : dates;
  return format.formatRange(gte * 1000, lte * 1000);
};
