import { describe, expect, test } from "bun:test";
import { LanguagePicker } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/language-picker.md says about what it renders.
const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français", description: "French" },
];

describe("LanguagePicker", () => {
  test("a tertiary button named by its label, showing the language in use in its own", () => {
    const markup = renderToStaticMarkup(<LanguagePicker aria-label="Language" defaultValue="fr" languages={languages} />);
    expect(markup).toStartWith('<button type="button" aria-label="Language" role="combobox" aria-haspopup="listbox"');
    expect(markup).toContain('class="hbutton hlanguage-picker" data-variant="tertiary"');
    expect(markup).toContain('<span class="hbutton-label"><span lang="fr">Français</span></span>');
    expect(markup).toContain('<ul aria-label="Language" class="hlistbox"');
  });

  test("each name is in a span with its language, and a description isn't", () => {
    const markup = renderToStaticMarkup(<LanguagePicker aria-label="Language" defaultValue="en" languages={languages} />);
    expect(markup).toContain('data-value="fr"><span class="hoption-text"><span class="hoption-label"><span lang="fr">Français</span></span> <span class="hoption-description">French</span></span>');
  });

  test("lang is the value unless it's given", () => {
    const markup = renderToStaticMarkup(
      <LanguagePicker aria-label="Language" defaultValue="british" languages={[{ value: "british", label: "English", lang: "en-GB" }]} />,
    );
    expect(markup).toContain('<span lang="en-GB">English</span>');
    expect(markup).not.toContain('lang="british"');
  });

  test("a region groups its languages, and the button shows it first", () => {
    const markup = renderToStaticMarkup(
      <LanguagePicker
        aria-label="Region and language"
        defaultValue="es-US"
        languages={[{ label: "United States", languages: [{ value: "en-US", label: "English" }, { value: "es-US", label: "Español" }] }]}
      />,
    );
    expect(markup).toContain('<span class="hbutton-label"><span class="hlanguage-picker-region">United States</span> <span lang="es-US">Español</span></span>');
    expect(markup).toContain('<span class="hoption-group-label"');
  });

  test("with regions, the popup is a panel, and a picture is kept from screen readers", () => {
    const markup = renderToStaticMarkup(
      <LanguagePicker
        aria-label="Region and language"
        defaultValue="fr-FR"
        languages={[{ label: "France", icon: "🇫🇷", languages: [{ value: "fr-FR", label: "Français" }] }]}
      />,
    );
    expect(markup).toContain('class="hpopup hlanguage-picker-regions"');
    expect(markup).toMatch(/<span class="hoption-group-label" id="[^"]+"><span class="hlanguage-picker-icon" aria-hidden="true">🇫🇷<\/span>France<\/span>/);
    expect(renderToStaticMarkup(<LanguagePicker aria-label="Language" languages={languages} />)).not.toContain("hlanguage-picker-regions");
  });

  test("a language's picture goes before its name", () => {
    const markup = renderToStaticMarkup(
      <LanguagePicker aria-label="Language" languages={[{ value: "fr", label: "Français", icon: "🇫🇷" }]} />,
    );
    expect(markup).toContain('<span class="hoption-label"><span class="hlanguage-picker-icon" aria-hidden="true">🇫🇷</span><span lang="fr">Français</span></span>');
  });

  test("with no language in use, the button shows none", () => {
    const markup = renderToStaticMarkup(<LanguagePicker aria-label="Language" languages={languages} />);
    expect(markup).not.toContain("hbutton-label");
  });

  test("one that's disabled, aria-disabled, or hidden has no popup", () => {
    for (const markup of [
      renderToStaticMarkup(<LanguagePicker aria-label="Language" defaultValue="en" disabled languages={languages} />),
      renderToStaticMarkup(<LanguagePicker aria-label="Language" defaultValue="en" aria-disabled languages={languages} />),
      renderToStaticMarkup(<LanguagePicker aria-label="Language" defaultValue="en" hidden languages={languages} />),
    ]) {
      expect(markup).not.toContain("hpopup");
      expect(markup).not.toContain("aria-controls");
    }
    expect(renderToStaticMarkup(<LanguagePicker aria-label="Language" hidden languages={languages} />)).toContain("hidden");
  });
});
