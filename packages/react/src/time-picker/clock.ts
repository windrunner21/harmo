// A time is "14:30": 24-hour, with no date or timezone.
export const isTime = (value?: string | null): value is string =>
  !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export type ClockColumn = "hour" | "minute" | "dayPeriod";

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 0, 1, hour, minute));

// How a locale tells the time: 12 or 24 hours, the order of its columns, and
// its digits and AM and PM.
export const clockOf = (locale: string, hour12?: boolean) => {
  const { hourCycle } = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions();
  const twelve = hour12 ?? (hourCycle === "h11" || hourCycle === "h12");
  const format = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: twelve ? "h12" : "h23",
  });
  const columns = format
    .formatToParts(at(9, 0))
    .map(({ type }) => type)
    .filter((type): type is ClockColumn => type === "hour" || type === "minute" || type === "dayPeriod");
  const number = new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: 2 });
  const period = (hour: number) =>
    format.formatToParts(at(hour, 0)).find(({ type }) => type === "dayPeriod")?.value ?? "";

  return {
    twelve,
    columns,
    digits: (value: number) => number.format(value),
    written: (time: string) => {
      const [hour = 0, minute = 0] = time.split(":").map(Number);
      return format.format(at(hour, minute));
    },
    hours: twelve ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : Array.from({ length: 24 }, (_, hour) => hour),
    periods: [period(9), period(15)] as const,
  };
};

// The minutes offered: every step, from 1 to 60, and any others to keep, such
// as a time's own that falls between them.
export const minutesOf = (step: number, kept: number[] = []) => {
  const every = Math.min(Math.max(Math.round(step) || 15, 1), 60);
  const minutes = Array.from({ length: Math.ceil(60 / every) }, (_, index) => index * every);
  for (const minute of kept) {
    if (!minutes.includes(minute)) minutes.push(minute);
  }
  return minutes.sort((a, b) => a - b);
};
