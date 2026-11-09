import { describe, expect, test } from "bun:test";
import { Calendar } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { addDays, addMonths, isDate, isMonth, weeksOf } from "../../../packages/react/src/calendar/dates.ts";

const labels = { locale: "en-US", previousLabel: "Previous", nextLabel: "Next" };

// What docs/components/calendar.md says about rendering on the server, and about
// dates that don't exist.
describe("Calendar", () => {
  test("with no date to go on, the server renders it blank, with all its rows", () => {
    const markup = renderToStaticMarkup(<Calendar {...labels} />);
    expect(markup).not.toContain("hcalendar-day");
    expect(markup.match(/<tr>/g)).toHaveLength(7);
    expect(markup).toContain('aria-live="polite"></p>');
  });

  test("given today, or a value, or a month, it shows that month", () => {
    expect(renderToStaticMarkup(<Calendar {...labels} today="2026-11-09" />)).toContain(">November 2026<");
    expect(renderToStaticMarkup(<Calendar {...labels} defaultValue="2027-03-02" />)).toContain(">March 2027<");
    expect(renderToStaticMarkup(<Calendar {...labels} defaultMonth="2028-07" />)).toContain(">July 2028<");
  });

  test("defaultMonth wins over the chosen date's month, and month over both", () => {
    const value = "2026-11-18";
    expect(renderToStaticMarkup(<Calendar {...labels} defaultValue={value} defaultMonth="2027-01" />)).toContain(">January 2027<");
    expect(renderToStaticMarkup(<Calendar {...labels} value={value} month="2027-03" defaultMonth="2027-01" />)).toContain(">March 2027<");
  });

  test("the month shown stays within min and max, with a day to Tab to", () => {
    const after = renderToStaticMarkup(<Calendar {...labels} today="2026-11-09" min="2026-12-05" />);
    expect(after).toContain(">December 2026<");
    expect(after.match(/tabindex="0"/g)).toHaveLength(1);
    expect(after).toContain('tabindex="0" data-date="2026-12-05"');

    const before = renderToStaticMarkup(<Calendar {...labels} today="2026-11-09" max="2026-10-20" />);
    expect(before).toContain(">October 2026<");
    expect(before).toContain('tabindex="0" data-date="2026-10-01"');
  });

  test("a month you hold is shown as it is, even outside min and max", () => {
    const markup = renderToStaticMarkup(<Calendar {...labels} month="2026-11" min="2026-12-05" />);
    expect(markup).toContain(">November 2026<");
    expect(markup).not.toContain('tabindex="0"');
  });

  test("navigation stops at the first and last years it can show", () => {
    const last = renderToStaticMarkup(<Calendar {...labels} month="9999-12" />);
    expect(last).toContain(">December 9999<");
    expect(last.match(/aria-disabled="true"/g)).toHaveLength(1);
    const first = renderToStaticMarkup(<Calendar {...labels} month="0100-01" />);
    expect(first.match(/aria-disabled="true"/g)).toHaveLength(1);
  });

  test("a date that doesn't exist is ignored", () => {
    const markup = renderToStaticMarkup(
      <Calendar {...labels} today="2026-11-09" value="2026-02-31" min="soon" max="2026-13-01" />,
    );
    expect(markup).toContain(">November 2026<");
    expect(markup).not.toContain("aria-selected");
    expect(markup).not.toContain("disabled");
  });

  test("weekStartsOn replaces the locale's week", () => {
    const sunday = renderToStaticMarkup(<Calendar {...labels} today="2026-11-09" />);
    const monday = renderToStaticMarkup(<Calendar {...labels} today="2026-11-09" weekStartsOn={1} />);
    expect(sunday).toContain('<th scope="col" abbr="Sunday">Sun</th><th scope="col" abbr="Monday">');
    expect(monday).toContain('<th scope="col" abbr="Monday">Mon</th><th scope="col" abbr="Tuesday">');
  });

  test("names are the locale's, in the Gregorian calendar whatever the locale's own", () => {
    const persian = renderToStaticMarkup(
      <Calendar {...labels} locale="fa-IR" defaultMonth="2026-11" />,
    );
    expect(persian).toContain("۲۰۲۶");
  });
});

describe("Calendar dates", () => {
  test("a date has to exist, from the year 100", () => {
    expect(isDate("2028-02-29")).toBe(true);
    expect(isDate("2027-02-29")).toBe(false);
    expect(isDate("2026-13-01")).toBe(false);
    expect(isDate("0099-12-31")).toBe(false);
    expect(isDate("0100-01-01")).toBe(true);
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("0099-12")).toBe(false);
  });

  test("a shorter month takes its last day, leap years included", () => {
    expect(addMonths("2026-10-31", 1)).toBe("2026-11-30");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2027-01-15", -1)).toBe("2026-12-15");
  });

  test("days count across months, years, and the leap day", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });

  test("always six rows of seven, with the 1st under its weekday", () => {
    const sundayFirst = weeksOf("2026-11", 0);
    expect(sundayFirst).toHaveLength(6);
    expect(sundayFirst.every((week) => week.length === 7)).toBe(true);
    expect(sundayFirst[0]?.[0]).toBe("2026-11-01");
    const mondayFirst = weeksOf("2026-11", 1);
    expect(mondayFirst[0]?.[6]).toBe("2026-11-01");
    expect(weeksOf("2026-08", 0).flat().filter(Boolean)).toHaveLength(31);
  });
});
