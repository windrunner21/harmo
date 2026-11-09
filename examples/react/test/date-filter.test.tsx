import { describe, expect, test } from "bun:test";
import { DateFilter } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  amountOf,
  cleaned,
  describeRange,
  draftOf,
  isComplete,
  rangeOf,
} from "../../../packages/react/src/date-filter/range.ts";

// What docs/components/date-filter.md says about what it renders and reads.
const labels = {
  conditions: { last: "last", equal: "equal", between: "between", after: "after", before: "before" },
  units: { minutes: "minutes", hours: "hours", days: "days", weeks: "weeks", months: "months" },
  condition: "Condition",
  amount: "Amount",
  unit: "Unit",
  date: "Date",
  startDate: "Start",
  endDate: "End",
  and: "and",
  calendar: "Choose",
  previousMonth: "Previous",
  nextMonth: "Next",
  apply: "Apply",
  clear: "Clear",
};

const filter = (value?: { gte: number | null; lte: number | null }) =>
  renderToStaticMarkup(
    <DateFilter label="Due" locale="en-US" today="2026-11-09" labels={labels} value={value} />,
  );

const local = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0) =>
  new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000;

const latin = (text: string) => text.replace(/\D/g, "");

const empty = { condition: "last", amount: "", unit: "days", date: null, endDate: null } as const;

const inZone = (zone: string, check: () => void) => {
  const was = Intl.DateTimeFormat().resolvedOptions().timeZone;
  process.env.TZ = zone;
  try {
    check();
  } finally {
    process.env.TZ = was;
  }
};

describe("DateFilter", () => {
  test("on the server it shows no dates, since the days are the viewer's", () => {
    const markup = filter({ gte: 1793491200, lte: 1794268799 });
    expect(markup).not.toContain("hfilter-chip-values");
    expect(markup).toContain('aria-haspopup="dialog"');
  });

  test("Clear is hidden until something is applied", () => {
    expect(filter()).toMatch(/<button type="button" hidden=""[^>]*><span class="hbutton-label">Clear/);
    expect(filter({ gte: 1793491200, lte: null })).not.toMatch(
      /<button type="button" hidden=""[^>]*><span class="hbutton-label">Clear/,
    );
  });

  test("what a URL holds that can't be a date counts as not being there", () => {
    expect(cleaned({ gte: Number.NaN, lte: Number.POSITIVE_INFINITY })).toEqual({ gte: null, lte: null });
    expect(cleaned({ gte: 1e20, lte: -1e20 })).toEqual({ gte: null, lte: null });
    expect(cleaned({ gte: "12" as unknown as number, lte: 12 })).toEqual({ gte: null, lte: 12 });
    expect(cleaned(undefined)).toEqual({ gte: null, lte: null });
  });

  test("the limits don't depend on the time zone, so a server and a browser agree", () => {
    const edge = 253402300799;
    for (const zone of ["UTC", "Asia/Baku", "Pacific/Kiritimati", "Etc/GMT+12"]) {
      inZone(zone, () => {
        expect(cleaned({ gte: edge, lte: null })).toEqual({ gte: null, lte: null });
        expect(cleaned({ gte: edge - 2 * 86400, lte: null })).toEqual({
          gte: edge - 2 * 86400,
          lte: null,
        });
      });
    }
  });

  test("a value that can't be a date renders as nothing applied", () => {
    expect(filter({ gte: Number.NaN, lte: Number.NaN })).toContain('hidden=""');
  });
});

describe("the condition a value describes", () => {
  const start = local(2026, 11, 18);
  const end = local(2026, 11, 18, 23, 59, 59);

  test("nothing, only gte, only lte, one whole day, and anything else", () => {
    expect(draftOf({ gte: null, lte: null })).toMatchObject({ condition: "last", date: null });
    expect(draftOf({ gte: start, lte: null })).toMatchObject({ condition: "after", date: "2026-11-18" });
    expect(draftOf({ gte: null, lte: end })).toMatchObject({ condition: "before", date: "2026-11-18" });
    expect(draftOf({ gte: start, lte: end })).toMatchObject({ condition: "equal", date: "2026-11-18" });
    expect(draftOf({ gte: start, lte: local(2026, 11, 20, 23, 59, 59) })).toMatchObject({
      condition: "between",
      date: "2026-11-18",
      endDate: "2026-11-20",
    });
    expect(draftOf({ gte: start + 60, lte: end })).toMatchObject({ condition: "between" });
  });
});

describe("a draft", () => {
  test("is complete with what its condition needs, and start can't be after end", () => {
    expect(isComplete(empty, null)).toBe(false);
    expect(isComplete(empty, 3)).toBe(true);
    expect(isComplete({ ...empty, condition: "equal" }, null)).toBe(false);
    expect(isComplete({ ...empty, condition: "after", date: "2026-11-18" }, null)).toBe(true);
    const between = { ...empty, condition: "between", date: "2026-11-18" } as const;
    expect(isComplete(between, null)).toBe(false);
    expect(isComplete({ ...between, endDate: "2026-11-18" }, null)).toBe(true);
    expect(isComplete({ ...between, endDate: "2026-11-17" }, null)).toBe(false);
  });

  test("reads an amount, and refuses what isn't one or would reach too far", () => {
    expect(amountOf(" 7 ", "days", latin)).toBe(7);
    expect(amountOf("0", "days", latin)).toBeNull();
    expect(amountOf("", "days", latin)).toBeNull();
    expect(amountOf("1a", "days", latin)).toBeNull();
    expect(amountOf("99999999", "months", latin)).toBeNull();
  });

  test("runs to the true end of a day whose last hour happens twice", () => {
    inZone("Asia/Beirut", () => {
      const day = rangeOf({ ...empty, condition: "equal", date: "2026-10-24" }, null);
      expect(day).toEqual({
        gte: Date.UTC(2026, 9, 23, 21) / 1000,
        lte: Date.UTC(2026, 9, 24, 21, 59, 59) / 1000,
      });
      expect(draftOf(day)).toMatchObject({ condition: "equal" });
    });
  });

  test("stands for the bounds of its days", () => {
    const date = "2026-11-18";
    const start = local(2026, 11, 18);
    const end = local(2026, 11, 18, 23, 59, 59);
    expect(rangeOf({ ...empty, condition: "equal", date }, null)).toEqual({ gte: start, lte: end });
    expect(rangeOf({ ...empty, condition: "after", date }, null)).toEqual({ gte: start, lte: null });
    expect(rangeOf({ ...empty, condition: "before", date }, null)).toEqual({ gte: null, lte: end });
  });
});

describe("what the chip shows", () => {
  const words = { after: "after", before: "before" };

  test("nothing, one side, a range, and an upside-down range without throwing", () => {
    const start = local(2026, 11, 18);
    expect(describeRange({ gte: null, lte: null }, "en-US", words)).toBeNull();
    expect(describeRange({ gte: start, lte: null }, "en-US", words)).toBe("after Nov 18, 2026");
    expect(describeRange({ gte: null, lte: start }, "en-US", words)).toBe("before Nov 18, 2026");
    expect(describeRange({ gte: start + 86400 * 2, lte: start }, "en-US", words)).toBe(
      "Nov 20, 2026 – Nov 18, 2026",
    );
  });

  test("one whole day as a date, and part of a day with its times", () => {
    const whole = describeRange(
      { gte: local(2026, 11, 18), lte: local(2026, 11, 18, 23, 59, 59) },
      "en-US",
      words,
    );
    expect(whole).toBe("Nov 18, 2026");
    const part = describeRange(
      { gte: local(2026, 11, 18, 14), lte: local(2026, 11, 18, 14, 30) },
      "en-US",
      words,
    );
    expect(part).toMatch(/2:00.*2:30/);
  });
});
