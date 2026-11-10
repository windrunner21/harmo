import { describe, expect, test } from "bun:test";
import { Field, PhoneInput, type PhoneParser } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/phone-input.md says about what it renders. A parser that
// knows two countries and one number stands in for a real one.
const number = (country: string, e164: string, national: string) => ({
  country,
  number: e164,
  isValid: () => true,
  isPossible: () => true,
  formatNational: () => national,
});

const phone = {
  AsYouType: class {
    input(text: string) {
      return text;
    }
  },
  getCountries: () => ["US", "AZ"],
  getCountryCallingCode: (country: string) => ({ US: "1", AZ: "994" })[country]!,
  parsePhoneNumberFromString: (text: string) =>
    text === "+994501234567" || text === "050 123 45 67"
      ? number("AZ", "+994501234567", "050 123 45 67")
      : undefined,
} as unknown as PhoneParser;

const labels = {
  phone,
  locale: "en",
  defaultCountry: "US",
  countryLabel: "Country code",
  searchLabel: "Search",
  emptyMessage: "None",
};

describe("PhoneInput", () => {
  test("a Select with the flag and code, then a left-to-right telephone field", () => {
    const markup = renderToStaticMarkup(<PhoneInput {...labels} />);
    expect(markup).toStartWith('<div class="hphone-input">');
    expect(markup).toContain('aria-label="Country code"');
    expect(markup).toContain('<span dir="ltr">+<!-- -->1</span>'.replace("<!-- -->", ""));
    expect(markup).toMatch(/<input[^>]*type="tel"[^>]*dir="ltr"/);
    expect(markup).toContain('autoComplete="tel-national"');
  });

  test("a flag is an emoji, or yours, hidden from screen readers", () => {
    expect(renderToStaticMarkup(<PhoneInput {...labels} />)).toContain("🇺🇸");
    const markup = renderToStaticMarkup(<PhoneInput {...labels} renderFlag={(country) => <i>{country}</i>} />);
    expect(markup).toContain('<span class="hphone-input-flag" aria-hidden="true"><i>US</i></span>');
    expect(markup).not.toContain("🇺🇸");
  });

  test("a number to start with sets the country and shows nationally", () => {
    const markup = renderToStaticMarkup(<PhoneInput {...labels} name="phone" defaultValue="+994501234567" />);
    expect(markup).toContain('value="050 123 45 67"');
    expect(markup).toContain("🇦🇿");
    expect(markup).toContain('<input type="hidden" name="phone" value="+994501234567"/>');
  });

  test("all the countries by name, or only those given, in that order", () => {
    const listOf = (markup: string) => markup.slice(markup.indexOf('role="listbox"'));
    const all = listOf(renderToStaticMarkup(<PhoneInput {...labels} />));
    expect(all.indexOf("Azerbaijan")).toBeLessThan(all.indexOf("United States"));
    const given = listOf(renderToStaticMarkup(<PhoneInput {...labels} countries={["US", "AZ"]} />));
    expect(given.indexOf("United States")).toBeLessThan(given.indexOf("Azerbaijan"));
    expect(renderToStaticMarkup(<PhoneInput {...labels} countries={["AZ"]} />)).not.toContain("United States");
  });

  test("a country that isn't listed gives way to the first that is", () => {
    const markup = renderToStaticMarkup(<PhoneInput {...labels} countries={["AZ"]} name="phone" defaultValue="+1" />);
    expect(markup).toContain("🇦🇿");
    expect(markup).toContain('<span class="hphone-input-name">Azerbaijan</span>');
  });

  test("the button names its country for a screen reader", () => {
    expect(renderToStaticMarkup(<PhoneInput {...labels} />)).toContain(
      '<span class="hphone-input-name">United States</span>',
    );
  });

  test("no hidden input without a name, and an incomplete number sends nothing", () => {
    expect(renderToStaticMarkup(<PhoneInput {...labels} />)).not.toContain('type="hidden"');
    expect(renderToStaticMarkup(<PhoneInput {...labels} name="phone" />)).toContain('name="phone" value=""');
  });

  test("in a Field, the label reaches the telephone field, not the Select", () => {
    const markup = renderToStaticMarkup(
      <Field label="Phone">
        <PhoneInput {...labels} />
      </Field>,
    );
    const id = /<label[^>]*for="([^"]+)"/.exec(markup)![1];
    expect(markup).toMatch(new RegExp(`<input[^>]*id="${id}"`));
    expect(markup).not.toMatch(new RegExp(`<button[^>]*id="${id}"`));
  });

  test("disabled reaches the Select, the field, and the hidden input", () => {
    const markup = renderToStaticMarkup(<PhoneInput {...labels} name="phone" disabled />);
    expect(markup).toMatch(/<button[^>]*disabled=""/);
    expect(markup).toMatch(/<input[^>]*type="tel"[^>]*disabled=""|<input[^>]*disabled=""[^>]*type="tel"/);
    expect(markup).toMatch(/<input type="hidden"[^>]*disabled=""/);
  });

  test("className and hidden go on the root", () => {
    expect(renderToStaticMarkup(<PhoneInput {...labels} className="x" hidden />)).toStartWith(
      '<div class="hphone-input x" hidden="">',
    );
  });
});
