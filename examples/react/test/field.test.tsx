import { describe, expect, test } from "bun:test";
import { Field, Input } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/field.md says Field renders: an optional marker, a label
// accessory, or an error of 0 shows, as React renders 0, and an error marks
// the control.
const attribute = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1];
const inputOf = (markup: string) => /<input[^>]*>/.exec(markup)?.[0] ?? "";
const errorOf = (markup: string) => {
  const [, tag = "", text] = /(<p[^>]* class="herror"[^>]*>)([^<]*)<\/p>/.exec(markup) ?? [];
  return { id: attribute(tag, "id"), text };
};

describe("Field", () => {
  test("an optional marker of 0 shows in the label row, and describes the control", () => {
    const markup = renderToStaticMarkup(
      <Field label="Seats" optional={0}>
        <Input />
      </Field>,
    );
    const id = /<span class="hfield-optional" id="([^"]+)">0<\/span>/.exec(markup)?.[1];
    expect(markup).toContain('<div class="hfield-label-row">');
    expect(id).toBeTruthy();
    expect(attribute(inputOf(markup), "aria-describedby")).toBe(id);
  });

  test("a label accessory of 0 shows in the label row", () => {
    const markup = renderToStaticMarkup(
      <Field label="Seats" labelAccessory={0}>
        <Input />
      </Field>,
    );
    expect(markup).toMatch(/<div class="hfield-label-row"><label[^>]*>Seats<\/label>0<\/div>/);
  });

  test("an error of 0 shows, and marks the control invalid", () => {
    const markup = renderToStaticMarkup(
      <Field label="Seats" error={0}>
        <Input />
      </Field>,
    );
    const error = errorOf(markup);
    expect(error.text).toBe("0");
    expect(error.id).toBeTruthy();
    expect(attribute(inputOf(markup), "aria-invalid")).toBe("true");
    expect(attribute(inputOf(markup), "aria-describedby")).toBe(error.id);
  });

  test("no error, or an empty one, leaves the control valid and the error empty", () => {
    for (const error of [undefined, ""]) {
      const markup = renderToStaticMarkup(
        <Field label="Seats" error={error}>
          <Input />
        </Field>,
      );
      expect(errorOf(markup).text).toBe("");
      expect(attribute(inputOf(markup), "aria-invalid")).toBeUndefined();
    }
  });
});
