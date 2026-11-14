import { describe, expect, test } from "bun:test";
import { FilterChip, Option } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/filter-chip.md says about what it renders.
const status = (disabled?: boolean) =>
  renderToStaticMarkup(
    <FilterChip label="Status" defaultValue="active" disabled={disabled}>
      <Option value="active">Active</Option>
      <Option value="done">Done</Option>
    </FilterChip>,
  );

describe("FilterChip", () => {
  test("with options, it renders the chip that opens a popup of them", () => {
    const markup = status();
    expect(markup).toContain('aria-haspopup="listbox"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup.toLowerCase()).toContain("popovertarget=");
    expect(markup).toContain('class="hpopup"');
    expect(markup).toContain('role="listbox"');
  });

  test("disabled, it renders the chip without its popup, so one that's open closes", () => {
    const markup = status(true);
    expect(markup).toContain("disabled=");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('<span class="hfilter-chip-value">Active</span>');
    expect(markup.toLowerCase()).not.toContain("popovertarget=");
    expect(markup).not.toContain("hpopup");
    expect(markup).not.toContain('role="listbox"');
  });
});
