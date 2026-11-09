import { describe, expect, test } from "bun:test";
import { FilterChip, Filters } from "@harmo-ui/react";
import { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { flatChildren } from "../../../packages/react/src/children.ts";

// What docs/components/filters.md says about what it renders.
const labels = { "aria-label": "Filter", resetLabel: "Reset" };

const chip = (label: string) => <FilterChip key={label} label={label} />;

const mine = () => <FilterChip label="Mine" />;

describe("Filters", () => {
  test("a named group, and every filter in the row without a visibleCount", () => {
    const markup = renderToStaticMarkup(<Filters {...labels}>{["A", "B"].map(chip)}</Filters>);
    expect(markup).toContain('aria-label="Filter"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain(">A<");
    expect(markup).toContain(">B<");
    expect(markup).not.toContain("hfilters-more");
  });

  test("past visibleCount, filters go in the panel", () => {
    const markup = renderToStaticMarkup(
      <Filters {...labels} visibleCount={1} moreLabel="More">
        {["A", "B", "C"].map(chip)}
      </Filters>,
    );
    const panel = markup.slice(markup.indexOf("hfilters-more"));
    expect(markup.slice(0, markup.indexOf("hfilters-more"))).toContain(">A<");
    expect(panel).toContain(">B<");
    expect(panel).toContain(">C<");
    expect(panel).not.toContain(">A<");
  });

  test("no panel when they all fit", () => {
    const markup = renderToStaticMarkup(
      <Filters {...labels} visibleCount={2} moreLabel="More">
        {["A", "B"].map(chip)}
      </Filters>,
    );
    expect(markup).not.toContain("hfilters-more");
  });

  test("a fragment is looked through, and a component of yours is one filter", () => {
    const Mine = mine;
    const markup = renderToStaticMarkup(
      <Filters {...labels} visibleCount={1} moreLabel="More">
        <>
          <Mine />
          {chip("B")}
        </>
      </Filters>,
    );
    const panel = markup.slice(markup.indexOf("hfilters-more"));
    expect(panel).toContain(">B<");
    expect(panel).not.toContain(">Mine<");
  });

  test("two keyed fragments keep their children's keys apart", () => {
    const keys = flatChildren(
      <>
        <Fragment key="a">{chip("A")}</Fragment>
        <Fragment key="b">{chip("A")}</Fragment>
      </>,
    ).map((node) => (node as { key: string }).key);
    expect(new Set(keys).size).toBe(2);
  });

  test("on the server nothing is counted yet, even with a value showing", () => {
    const markup = renderToStaticMarkup(
      <Filters {...labels} visibleCount={0} moreLabel="More">
        <FilterChip label="A" values={["Chosen"]} />
      </Filters>,
    );
    expect(markup).toContain("hfilter-chip-values");
    expect(markup).toMatch(/<span class="hfilters-count" hidden="">0<\/span>/);
    expect(markup).toMatch(/hidden=""[^>]*>Reset<|class="hfilters-reset" hidden=""/);
  });

  test("showReset shows Reset with nothing chosen", () => {
    const markup = renderToStaticMarkup(
      <Filters {...labels} showReset>
        {chip("A")}
      </Filters>,
    );
    expect(markup).toContain('<button type="button" class="hfilters-reset">Reset</button>');
  });
});
