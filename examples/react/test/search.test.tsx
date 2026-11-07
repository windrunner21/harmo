import { describe, expect, test } from "bun:test";
import { Search } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/search.md says about the clear button: there's one only
// with clearLabel, hidden while the field is empty, and while it's read-only.
describe("Search", () => {
  test("without clearLabel, there's no clear button", () => {
    expect(renderToStaticMarkup(<Search aria-label="Search" defaultValue="ship" />)).not.toContain("hsearch-clear");
  });

  test("with text, the clear button shows; read-only, it's hidden", () => {
    const shown = renderToStaticMarkup(<Search aria-label="Search" clearLabel="Clear" defaultValue="ship" />);
    expect(shown).toMatch(/<button class="hsearch-clear"(?![^>]*hidden)[^>]*>/);
    const readOnly = renderToStaticMarkup(
      <Search aria-label="Search" clearLabel="Clear" defaultValue="ship" readOnly />,
    );
    expect(readOnly).toMatch(/<button class="hsearch-clear"[^>]*hidden=""/);
  });
});
