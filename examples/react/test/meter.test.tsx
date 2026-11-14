import { describe, expect, test } from "bun:test";
import { Meter } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/meter.md says about the React Meter: it needs a name,
// and it keeps a value it can show, as a native <meter> does: max a whole
// number of at least 1, the value between 0 and max, and a segment filled for
// each whole step reached.
const read = (markup: string) => ({
  max: markup.match(/aria-valuemax="([^"]*)"/)?.[1],
  now: markup.match(/aria-valuenow="([^"]*)"/)?.[1],
  segments: markup.match(/class="hmeter-segment"/g)?.length ?? 0,
  filled: markup.match(/data-filled=""/g)?.length ?? 0,
});

describe("Meter", () => {
  test("a value past max is shown, and announced, as max", () => {
    expect(read(renderToStaticMarkup(<Meter value={4} max={3} aria-label="Strength" />))).toEqual({
      max: "3",
      now: "3",
      segments: 3,
      filled: 3,
    });
  });

  test("a value below 0, or not a number, is 0", () => {
    for (const value of [-1, NaN]) {
      expect(read(renderToStaticMarkup(<Meter value={value} max={3} aria-label="Strength" />))).toEqual({
        max: "3",
        now: "0",
        segments: 3,
        filled: 0,
      });
    }
  });

  test("max is rounded down to a whole number of at least 1, and one that isn't finite is 1, rather than throwing", () => {
    expect(read(renderToStaticMarkup(<Meter value={2} max={3.7} aria-label="Strength" />))).toMatchObject({
      max: "3",
      segments: 3,
    });
    for (const max of [0, -2, Infinity, NaN]) {
      expect(read(renderToStaticMarkup(<Meter value={1} max={max} aria-label="Strength" />))).toMatchObject({
        max: "1",
        segments: 1,
      });
    }
  });

  test("a fractional value fills the whole steps it has reached", () => {
    expect(read(renderToStaticMarkup(<Meter value={2.5} max={3} aria-label="Strength" />))).toEqual({
      max: "3",
      now: "2.5",
      segments: 3,
      filled: 2,
    });
  });

  test("it takes aria-labelledby in place of aria-label", () => {
    const markup = renderToStaticMarkup(<Meter value={1} max={3} aria-labelledby="strength" />);
    expect(markup).toContain('aria-labelledby="strength"');
    expect(markup).not.toContain("aria-label=");
  });

  test("TypeScript requires one name, not none or two", () => {
    // Checked by mise run check:react: each is an error, and an unused
    // directive would be one too.
    // @ts-expect-error A meter needs a name.
    void (<Meter value={1} max={3} />);
    // @ts-expect-error One name, not two.
    void (<Meter value={1} max={3} aria-label="Strength" aria-labelledby="strength" />);
  });
});
