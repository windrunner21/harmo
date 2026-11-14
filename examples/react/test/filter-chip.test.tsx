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

  test("a single choice given clearLabel ends its list with Clear while it has a value", () => {
    const cleared: (string | null)[] = [];
    const chip = (defaultValue?: string) =>
      renderToStaticMarkup(
        <FilterChip
          label="Status"
          defaultValue={defaultValue}
          clearLabel="Clear filter"
          onValueChange={(value) => cleared.push(value)}
        >
          <Option value="active">Active</Option>
        </FilterChip>,
      );
    expect(chip("active")).toContain('<div class="hlistbox-footer">');
    expect(chip("active")).toContain("Clear filter");
    expect(chip()).not.toContain("hlistbox-footer");
    expect(status()).not.toContain("hlistbox-footer");
  });

  test("a single choice's onValueChange takes null only where it can be cleared", () => {
    const plain = (
      <FilterChip label="Status" onValueChange={(value) => value.toUpperCase()}>
        <Option value="active">Active</Option>
      </FilterChip>
    );
    const clearable = (
      <FilterChip label="Status" clearLabel="Clear filter" onValueChange={(value) => value?.toUpperCase()}>
        <Option value="active">Active</Option>
      </FilterChip>
    );
    // @ts-expect-error: a chip without options has no list to clear.
    const listless = <FilterChip label="Status" values={["Active"]} clearLabel="Clear filter" />;
    expect([plain, clearable, listless]).toHaveLength(3);
  });

  test("renderValue shows what it returns for the chosen values, one pill each", () => {
    const Translated = ({ id }: { id: string }) => <>{id.toUpperCase()}</>;
    const markup = renderToStaticMarkup(
      <FilterChip
        label="Status"
        defaultValue="active"
        renderValue={(values) => values.map((value) => <Translated key={value} id={value} />)}
      >
        <Option value="active">
          <Translated id="active" />
        </Option>
        <Option value="done">
          <Translated id="done" />
        </Option>
      </FilterChip>,
    );
    expect(markup).toContain('<span class="hfilter-chip-value">ACTIVE</span>');
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
