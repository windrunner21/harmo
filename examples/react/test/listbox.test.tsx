import { describe, expect, test } from "bun:test";
import { Listbox, Option } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/listbox.md says of the React Listbox's footer: it goes
// in its own part, after the list, and only when there is one.
const withFooter = (footer: React.ReactNode) =>
  renderToStaticMarkup(
    <Listbox aria-label="Period" footer={footer}>
      <Option value="7">Last 7 days</Option>
    </Listbox>,
  );

describe("Listbox", () => {
  test("a footer that renders nothing, such as an empty fragment, adds none", () => {
    expect(withFooter(<></>)).not.toContain("hlistbox-footer");
    expect(withFooter([])).not.toContain("hlistbox-footer");
    expect(withFooter(undefined)).not.toContain("hlistbox-footer");
  });

  test("a footer of 0 goes in its part, not loose after the list", () => {
    expect(withFooter(0)).toMatch(/<\/ul><div class="hlistbox-footer">0<\/div>$/);
  });
});
