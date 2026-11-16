import { describe, expect, test } from "bun:test";
import { Field, OtpInput } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/otp-input.md says about the React OtpInput's server
// render: the field a form sends without a script, its length kept from 4 to
// 12, a dash after each group, and no data-ready, which only the client sets.
const slotsIn = (markup: string) => markup.match(/class="hotp-input-slot"/g)?.length ?? 0;
const inputOf = (markup: string) => /<input [^>]*>/.exec(markup)?.[0] ?? "";
// An attribute's value, whatever the case of its name: React writes inputMode.
const attributeOf = (element: string, name: string) => new RegExp(` ${name}="([^"]*)"`, "i").exec(element)?.[1];

describe("OtpInput", () => {
  test("six digits by default, with what a form needs without a script", () => {
    const markup = renderToStaticMarkup(<OtpInput aria-label="Code" name="code" />);
    const input = inputOf(markup);
    expect(slotsIn(markup)).toBe(6);
    expect({
      name: attributeOf(input, "name"),
      type: attributeOf(input, "type"),
      inputmode: attributeOf(input, "inputmode"),
      autocomplete: attributeOf(input, "autocomplete"),
      maxlength: attributeOf(input, "maxlength"),
      pattern: attributeOf(input, "pattern"),
      spellcheck: attributeOf(input, "spellcheck"),
      autocorrect: attributeOf(input, "autocorrect"),
    }).toEqual({
      name: "code",
      type: "text",
      inputmode: "numeric",
      autocomplete: "one-time-code",
      maxlength: "6",
      pattern: "[0-9]{6}",
      spellcheck: "false",
      autocorrect: "off",
    });
    expect(markup).not.toContain("data-ready");
    expect(markup).toContain('dir="ltr"');
  });

  test("length is kept from 4 to 12", () => {
    expect(slotsIn(renderToStaticMarkup(<OtpInput aria-label="Code" length={2} />))).toBe(4);
    expect(slotsIn(renderToStaticMarkup(<OtpInput aria-label="Code" length={20} />))).toBe(12);
    expect(attributeOf(inputOf(renderToStaticMarkup(<OtpInput aria-label="Code" length={20} />)), "maxlength")).toBe("12");
  });

  test("letters and digits: capitals, the text keyboard, and a pattern that takes either case", () => {
    const markup = renderToStaticMarkup(
      <OtpInput aria-label="Code" length={8} characters="alphanumeric" defaultValue="k7-qx m2pa" />,
    );
    expect(markup).toContain('data-characters="alphanumeric"');
    const input = inputOf(markup);
    expect(attributeOf(input, "value")).toBe("K7QXM2PA");
    expect(attributeOf(input, "inputmode")).toBe("text");
    expect(attributeOf(input, "autocapitalize")).toBe("characters");
    expect(attributeOf(input, "pattern")).toBe("[A-Za-z0-9]{8}");
  });

  test("a dash goes after each group that ends inside the code", () => {
    const dashes = (groups: number[]) =>
      renderToStaticMarkup(<OtpInput aria-label="Code" groups={groups} />).match(/hotp-input-separator/g)?.length ?? 0;
    expect(dashes([3, 3])).toBe(1);
    expect(dashes([2, 2, 2])).toBe(2);
    expect(dashes([6])).toBe(0);
    expect(dashes([4, 4])).toBe(1);
  });

  test("a value it can't hold is cleaned up and cut to its length", () => {
    const markup = renderToStaticMarkup(<OtpInput aria-label="Code" value="12-34 56 78" onChange={() => {}} />);
    expect(attributeOf(inputOf(markup), "value")).toBe("123456");
    expect(markup).toContain('<span class="hotp-input-slot" data-filled="">6</span>');
  });

  test("hidden with a label hides its whole field, and without one the code", () => {
    const root = (markup: string) => /^<div [^>]*>/.exec(markup)?.[0] ?? "";
    const labelled = root(renderToStaticMarkup(<OtpInput label="Code" hidden />));
    expect(attributeOf(labelled, "class")).toBe("hfield");
    expect(attributeOf(labelled, "hidden")).toBe("");
    const alone = root(renderToStaticMarkup(<OtpInput aria-label="Code" hidden />));
    expect(attributeOf(alone, "class")).toBe("hotp-input");
    expect(attributeOf(alone, "hidden")).toBe("");
  });

  test("in a Field, it takes the Field's id, description, and error", () => {
    const markup = renderToStaticMarkup(
      <Field label="Code" description="Six digits." error="Wrong code.">
        <OtpInput />
      </Field>,
    );
    const input = inputOf(markup);
    const id = /id="([^"]+)"/.exec(input)?.[1];
    expect(markup).toContain(`for="${id}"`);
    expect(input).toContain('aria-invalid="true"');
    expect(input).toMatch(/aria-describedby="[^"]+ [^"]+"/);
  });
});
