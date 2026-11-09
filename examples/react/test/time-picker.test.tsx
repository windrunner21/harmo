import { describe, expect, test } from "bun:test";
import { TimePicker } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { clockOf, isTime, minutesOf } from "../../../packages/react/src/time-picker/clock.ts";

const labels = { locale: "en-US", "aria-label": "Time", hourLabel: "Hour", minuteLabel: "Minute", periodLabel: "Period" };

// What docs/components/time-picker.md says about the clock and its values.
describe("the clock", () => {
  test("a time is 24-hour and has to exist", () => {
    expect(isTime("00:00")).toBe(true);
    expect(isTime("23:59")).toBe(true);
    expect(isTime("24:00")).toBe(false);
    expect(isTime("9:30")).toBe(false);
    expect(isTime("12:60")).toBe(false);
  });

  test("the locale decides 12 or 24 hours, and hour12 overrides it", () => {
    expect(clockOf("en-US").twelve).toBe(true);
    expect(clockOf("en-GB").twelve).toBe(false);
    expect(clockOf("en-GB", true).twelve).toBe(true);
    expect(clockOf("en-US", false).twelve).toBe(false);
  });

  test("hours run 12, 1 to 11, or 0 to 23, and midnight is never 24", () => {
    expect(clockOf("en-US").hours.slice(0, 2)).toEqual([12, 1]);
    expect(clockOf("en-GB").hours).toHaveLength(24);
    expect(clockOf("en-GB").written("00:05")).toBe("00:05");
    expect(clockOf("en-US", false).written("00:05")).toBe("00:05");
    expect(clockOf("en-US").written("00:05")).toMatch(/^12:05\sAM$/);
  });

  test("the columns follow the locale's order", () => {
    expect(clockOf("en-US").columns).toEqual(["hour", "minute", "dayPeriod"]);
    expect(clockOf("ko-KR").columns).toEqual(["dayPeriod", "hour", "minute"]);
  });

  test("minutes go by the step, and include the time's own", () => {
    expect(minutesOf(15)).toEqual([0, 15, 30, 45]);
    expect(minutesOf(30)).toEqual([0, 30]);
    expect(minutesOf(15, [7])).toEqual([0, 7, 15, 30, 45]);
    expect(minutesOf(15, [30])).toEqual([0, 15, 30, 45]);
    expect(minutesOf(45)).toEqual([0, 45]);
    expect(minutesOf(60)).toEqual([0]);
    expect(minutesOf(90)).toEqual([0]);
    expect(minutesOf(0)).toEqual([0, 15, 30, 45]);
  });
});

describe("TimePicker", () => {
  test("a time that doesn't exist is ignored", () => {
    const markup = renderToStaticMarkup(<TimePicker {...labels} defaultValue="25:00" placeholder="Pick" />);
    expect(markup).toContain(">Pick<");
    expect(markup).toContain("data-placeholder");
  });

  test("a name sends the time as 14:30, whatever it shows", () => {
    const markup = renderToStaticMarkup(<TimePicker {...labels} name="at" defaultValue="14:30" />);
    expect(markup).toContain('<input type="hidden" name="at" value="14:30"/>');
    expect(markup).toMatch(/02:30\sPM/);
  });

  test("the trigger's name includes the time, and disabled leaves out the popup", () => {
    const markup = renderToStaticMarkup(<TimePicker {...labels} defaultValue="14:30" disabled />);
    expect(markup).not.toContain("hpopup");
    expect(markup).toMatch(/aria-labelledby="[^" ]+ [^" ]+"/);
  });
});
