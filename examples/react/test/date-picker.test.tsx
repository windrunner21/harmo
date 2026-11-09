import { describe, expect, test } from "bun:test";
import { DatePicker } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { isDateTime } from "../../../packages/react/src/calendar/dates.ts";
import { longDateOf, readNaturalDate, typedDateOf } from "../../../packages/react/src/date-picker/typedDate.ts";

const labels = {
  locale: "en-US",
  calendarLabel: "Choose",
  previousLabel: "Previous",
  nextLabel: "Next",
  today: "2026-11-09",
};

// What docs/components/date-picker.md says about how a date is written.
describe("typed dates", () => {
  test("each locale's order and separator", () => {
    expect(typedDateOf("en-US").format("2026-11-09")).toBe("11/09/2026");
    expect(typedDateOf("en-GB").format("2026-11-09")).toBe("09/11/2026");
    expect(typedDateOf("de-DE").format("2026-11-09")).toBe("09.11.2026");
    expect(typedDateOf("ja-JP").format("2026-11-09")).toBe("2026/11/09");
  });

  test("reads a date back in the same order", () => {
    for (const locale of ["en-US", "en-GB", "de-DE", "ja-JP", "ar-EG"]) {
      const typing = typedDateOf(locale);
      expect(typing.parse(typing.format("2026-11-09"))).toBe("2026-11-09");
    }
    expect(typedDateOf("en-US").parse("11/09")).toBeNull();
  });

  test("adds separators only once a digit follows, and stops at eight digits", () => {
    const { mask } = typedDateOf("en-US");
    expect(mask("1")).toBe("1");
    expect(mask("11")).toBe("11");
    expect(mask("111")).toBe("11/1");
    expect(mask("1109")).toBe("11/09");
    expect(mask("11092026999")).toBe("11/09/2026");
    expect(mask("1a/1b")).toBe("11");
  });

  test("takes the locale's digits and Latin ones, and shows the locale's", () => {
    const typing = typedDateOf("ar-EG");
    expect(typing.parse("٠٩/١١/٢٠٢٦")).toBe("2026-11-09");
    expect(typing.parse("09112026")).toBe("2026-11-09");
    expect(typing.mask("09")).toBe("٠٩");
  });

  test("puts the caret after the same digit", () => {
    const { caretAfter } = typedDateOf("en-US");
    expect(caretAfter("11/09/2026", 0)).toBe(0);
    expect(caretAfter("11/09/2026", 2)).toBe(2);
    expect(caretAfter("11/09/2026", 3)).toBe(4);
    expect(caretAfter("11/09", 8)).toBe(5);
  });

  test("counts the caret in UTF-16, for digits that take two units", () => {
    const typing = typedDateOf("en-US-u-nu-mathbold");
    const masked = typing.mask("11");
    expect(masked).toHaveLength(4);
    expect(typing.caretAfter(masked, 1)).toBe(2);
    expect(typing.parse(typing.format("2026-11-09"))).toBe("2026-11-09");
  });
});

describe("natural language", () => {
  const at = (date: Date) => ({ parseDate: () => date });

  test("reads the day on the clock where it was typed, however late", () => {
    expect(readNaturalDate(at(new Date(2026, 10, 18, 23, 30)), "x", {})).toBe("2026-11-18");
    expect(readNaturalDate(at(new Date(2026, 10, 18, 0, 30)), "x", {})).toBe("2026-11-18");
  });

  test("with time, keeps the hour and minute", () => {
    expect(readNaturalDate(at(new Date(2026, 10, 18, 14, 5)), "x", { time: true })).toBe("2026-11-18T14:05");
  });

  test("nothing found is no date", () => {
    expect(readNaturalDate({ parseDate: () => null }, "x", {})).toBeNull();
    expect(readNaturalDate(at(new Date("nope")), "x", {})).toBeNull();
  });

  test("today is what the words count from", () => {
    let reference: Date | undefined;
    readNaturalDate({ parseDate: (_, from) => ((reference = from), null) }, "tomorrow", { today: "2026-11-09" });
    expect(reference?.getDate()).toBe(9);
    expect(reference?.getMonth()).toBe(10);
  });

  test("writes the date in full, and the time with it", () => {
    expect(longDateOf("en-US")("2026-11-18")).toBe("November 18, 2026");
    expect(longDateOf("en-US", true)("2026-11-18T14:00")).toMatch(/November 18, 2026.*2:00\sPM/);
  });

  test("a date and time has to exist", () => {
    expect(isDateTime("2026-11-18T14:00")).toBe(true);
    expect(isDateTime("2026-11-18")).toBe(false);
    expect(isDateTime("2026-02-31T14:00")).toBe(false);
    expect(isDateTime("2026-11-18T24:00")).toBe(false);
  });
});

describe("DatePicker", () => {
  test("a date that doesn't exist is ignored, and a controlled value wins", () => {
    expect(renderToStaticMarkup(<DatePicker {...labels} aria-label="Date" defaultValue="2026-02-31" />)).toContain('value=""');
    expect(renderToStaticMarkup(<DatePicker {...labels} aria-label="Date" value="2026-11-18" defaultValue="2026-01-01" />)).toContain('value="11/18/2026"');
  });

  test("a name sends the date, as 2026-11-18", () => {
    const markup = renderToStaticMarkup(<DatePicker {...labels} aria-label="Date" name="due" defaultValue="2026-11-18" />);
    expect(markup).toContain('<input type="hidden" name="due" value="2026-11-18"/>');
  });

  test("no name, no hidden input", () => {
    expect(renderToStaticMarkup(<DatePicker {...labels} aria-label="Date" />)).not.toContain('type="hidden"');
  });

  test("natural writes the date in full, takes any text, and marks it in the Calendar", () => {
    const markup = renderToStaticMarkup(
      <DatePicker {...labels} aria-label="Date" defaultValue="2026-11-18" natural={{ parseDate: () => null }} />,
    );
    expect(markup).toContain('value="November 18, 2026"');
    expect(markup).not.toContain("inputmode");
    expect(markup).toContain('aria-selected="true"><button class="hcalendar-day" type="button" tabindex="0" data-date="2026-11-18"');
  });

  test("with time, the value keeps its time, a date alone is ignored, and the Calendar marks the day", () => {
    const natural = { parseDate: () => null };
    const markup = renderToStaticMarkup(
      <DatePicker {...labels} aria-label="Date" name="at" time natural={natural} defaultValue="2026-11-18T14:00" />,
    );
    expect(markup).toContain('<input type="hidden" name="at" value="2026-11-18T14:00"/>');
    expect(markup).toMatch(/value="November 18, 2026[^"]*2:00\sPM"/);
    expect(markup).toContain('aria-selected="true"><button class="hcalendar-day" type="button" tabindex="0" data-date="2026-11-18"');
    expect(renderToStaticMarkup(<DatePicker {...labels} aria-label="Date" time natural={natural} defaultValue="2026-11-18" />)).toContain('value=""');
  });

  test("format writes the date in the field, and a field with parse isn't numeric", () => {
    const markup = renderToStaticMarkup(
      <DatePicker {...labels} aria-label="Date" defaultValue="2026-11-18" parse={() => null} format={() => "Soon"} />,
    );
    expect(markup).toContain('value="Soon"');
    expect(markup).not.toContain("inputmode");
  });
});
