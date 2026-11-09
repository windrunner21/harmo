// A date parser your app brings, such as chrono-node, or one of its languages.
export interface NaturalDateParser {
  parseDate: (text: string, reference?: Date) => Date | null | undefined;
}

// What a natural-language parser found, as "2026-11-18", or with "T14:00". Read
// from the Date's local parts: its UTC parts can be a different day.
export const readNaturalDate = (
  parser: NaturalDateParser,
  text: string,
  { time, today }: { time?: boolean; today?: string },
) => {
  const date = parser.parseDate(text, today ? new Date(`${today}T12:00:00`) : undefined);
  if (!date || Number.isNaN(date.getTime())) return null;
  const part = (value: number, length = 2) => String(value).padStart(length, "0");
  const day = `${part(date.getFullYear(), 4)}-${part(date.getMonth() + 1)}-${part(date.getDate())}`;
  return time ? `${day}T${part(date.getHours())}:${part(date.getMinutes())}` : day;
};

// A date in words, "November 18, 2026", and its time if it has one.
export const longDateOf = (locale: string, time?: boolean) => {
  const long = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    timeZone: "UTC",
    dateStyle: "long",
    ...(time && { timeStyle: "short" }),
  });
  return (value: string) => long.format(new Date(time ? `${value}:00Z` : `${value}T00:00:00Z`));
};

type Part = "day" | "month" | "year";

const LENGTH: Record<Part, number> = { day: 2, month: 2, year: 4 };
const DIGITS = 8;

const isPart = (type: string): type is Part => type in LENGTH;

// How a locale writes a date in digits: its order, its separator, and its
// digits. The separator is kept whole, as right-to-left dates need its marks.
export const typedDateOf = (locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(Date.UTC(2026, 10, 9)));
  const order = parts.map(({ type }) => type).filter(isPart);
  const separator = parts[parts.findIndex(({ type }) => isPart(type)) + 1]?.value ?? "/";

  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  const digits = Array.from({ length: 10 }, (_, digit) => number.format(digit));

  const toLatin = (text: string) =>
    Array.from(text)
      .flatMap((character) => {
        const digit = digits.indexOf(character);
        if (digit >= 0) return [String(digit)];
        return /[0-9]/.test(character) ? [character] : [];
      })
      .join("");
  const toLocal = (latin: string) =>
    Array.from(latin, (digit) => digits[Number(digit)]).join("");

  const mask = (text: string) => {
    const latin = toLatin(text).slice(0, DIGITS);
    let used = 0;
    const pieces: string[] = [];
    for (const part of order) {
      const piece = latin.slice(used, used + LENGTH[part]);
      if (!piece) break;
      pieces.push(toLocal(piece));
      used += LENGTH[part];
    }
    return pieces.join(separator);
  };

  const format = (date: string) => {
    const [year = "", month = "", day = ""] = date.split("-");
    const values: Record<Part, string> = { day, month, year };
    return order.map((part) => toLocal(values[part])).join(separator);
  };

  const parse = (text: string) => {
    const latin = toLatin(text);
    if (latin.length !== DIGITS) return null;
    let used = 0;
    const values: Record<Part, string> = { day: "", month: "", year: "" };
    for (const part of order) {
      values[part] = latin.slice(used, used + LENGTH[part]);
      used += LENGTH[part];
    }
    return `${values.year}-${values.month}-${values.day}`;
  };

  const digitsIn = (text: string) => toLatin(text).length;

  // Where the caret goes, after that many digits of the text.
  const caretAfter = (text: string, count: number) => {
    if (count === 0) return 0;
    let seen = 0;
    let offset = 0;
    for (const character of text) {
      offset += character.length;
      if (digitsIn(character)) seen += 1;
      if (seen === count) return offset;
    }
    return text.length;
  };

  return { mask, format, parse, digitsIn, caretAfter };
};
