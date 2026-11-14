import { describe, expect, test } from "bun:test";
import { Search } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/search.md says about the clear button: there's one only
// with clearLabel, hidden while the field is empty, and while it's read-only,
// and disabled with the field; and about the shortcut's hint: a Kbd after the
// field, hidden from screen readers, only with shortcutHint.
describe("Search", () => {
  test("shortcutHint puts the hint in a Kbd after the field, hidden from screen readers; without it, there's none", () => {
    const markup = renderToStaticMarkup(
      <Search aria-label="Search" aria-keyshortcuts="Control+K" shortcutHint="Ctrl K" clearLabel="Clear" />,
    );
    expect(markup).toMatch(/<input[^>]* aria-keyshortcuts="Control\+K"[^>]*\/><kbd aria-hidden="true" class="hkbd">Ctrl K<\/kbd><button class="hsearch-clear"/);
    for (const shortcutHint of [undefined, ""]) {
      expect(renderToStaticMarkup(<Search aria-label="Search" shortcutHint={shortcutHint} />)).not.toContain("hkbd");
    }
  });

  test("shortcutHint isn't passed on to the input as an attribute", () => {
    const markup = renderToStaticMarkup(<Search aria-label="Search" shortcutHint="/" />);
    expect(markup).not.toMatch(/shortcut-?hint=/i);
  });

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

  test("disabled, the clear button is disabled too", () => {
    const enabled = renderToStaticMarkup(<Search aria-label="Search" clearLabel="Clear" defaultValue="ship" />);
    expect(enabled).toMatch(/<button class="hsearch-clear"(?![^>]*disabled)[^>]*>/);
    const disabled = renderToStaticMarkup(
      <Search aria-label="Search" clearLabel="Clear" defaultValue="ship" disabled />,
    );
    expect(disabled).toMatch(/<button class="hsearch-clear"[^>]*disabled=""/);
  });
});
