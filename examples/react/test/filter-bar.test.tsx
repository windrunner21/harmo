import { describe, expect, test } from "bun:test";
import { FilterBar, FilterBarItem } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/filter-bar.md says about what it renders.
const Wrapped = () => <FilterBarItem href="?" label="All" count={3} />;

describe("FilterBar", () => {
  test("it's a nav by default, and items with an href are links", () => {
    const markup = renderToStaticMarkup(
      <FilterBar aria-label="Status">
        <FilterBarItem href="?" label="All" count={3} current />
      </FilterBar>,
    );
    expect(markup).toContain('<nav aria-label="Status" class="hfilter-bar">');
    expect(markup).toContain('aria-current="true"');
    expect(markup).not.toContain("aria-pressed");
  });

  test("items inside a component of yours are still in a nav", () => {
    const markup = renderToStaticMarkup(
      <FilterBar aria-label="Status">
        <Wrapped />
      </FilterBar>,
    );
    expect(markup).toContain("<nav");
    expect(markup).toContain('<a href="?"');
  });

  test('as="div" makes a group, and items with no href are buttons', () => {
    const markup = renderToStaticMarkup(
      <FilterBar as="div" aria-label="Status">
        <FilterBarItem label="All" count={3} />
      </FilterBar>,
    );
    expect(markup).toContain('role="group"');
    expect(markup).not.toContain("<nav");
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('type="button"');
  });

  test("a link takes a link's attributes, and a count of 0 shows", () => {
    const markup = renderToStaticMarkup(
      <FilterBar aria-label="Status">
        <FilterBarItem href="?" target="_blank" label="None" count={0} />
      </FilterBar>,
    );
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('<span class="hfilter-bar-count">0</span>');
  });
});
