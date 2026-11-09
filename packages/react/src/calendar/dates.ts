// A date is "2026-11-09": a day on the calendar, with no time or timezone. The
// arithmetic runs in UTC so that daylight saving can't move a day.
const DAY = 86_400_000;

// The first and last dates it can show: a Date reads a year below 100 as 19xx,
// and one past 9999 no longer fits this format.
export const FIRST_DATE = "0100-01-01";
export const LAST_DATE = "9999-12-31";

export const dateOf = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const isoOf = (date: Date) => date.toISOString().slice(0, 10);

export const isDate = (value?: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < FIRST_DATE) return false;
  const date = dateOf(value);
  return !Number.isNaN(date.getTime()) && isoOf(date) === value;
};

export const isMonth = (value?: string | null): value is string =>
  !!value && isDate(`${value}-01`);

export const monthOf = (iso: string) => iso.slice(0, 7);

export const addDays = (iso: string, days: number) =>
  isoOf(new Date(dateOf(iso).getTime() + days * DAY));

// The same day of another month, or that month's last day if it's shorter.
export const addMonths = (iso: string, months: number) => {
  const date = dateOf(iso);
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0),
  );
  target.setUTCDate(Math.min(date.getUTCDate(), target.getUTCDate()));
  return isoOf(target);
};

export const todayDate = () => {
  const now = new Date();
  const part = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}`;
};

// A month's six rows of seven: each a date, or null outside the month.
export const weeksOf = (month: string, firstDay: number) => {
  const first = dateOf(`${month}-01`);
  const blanks = (first.getUTCDay() - firstDay + 7) % 7;
  const length = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const day = week * 7 + weekday - blanks + 1;
      return day >= 1 && day <= length
        ? `${month}-${String(day).padStart(2, "0")}`
        : null;
    }),
  );
};

interface WeekInfoLocale extends Intl.Locale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

// The first day of the week, with Sunday as 0; Monday where the browser can't say.
export const firstDayOf = (locale: string) => {
  const info = new Intl.Locale(locale) as WeekInfoLocale;
  return (info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay ?? 1) % 7;
};
