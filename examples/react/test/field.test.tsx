import { describe, expect, test } from "bun:test";
import { Field, Input, useField, type FieldControl } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/field.md says Field renders: an optional marker, a label
// accessory, or an error of 0 shows, as React renders 0, the error is a live
// region, and an error marks the control, one of the app's own too, through
// useField, which keeps the control's own name.
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

  test("the error is a polite live region, empty or not, so a message set later is announced", () => {
    for (const error of [undefined, "Enter a number"]) {
      const markup = renderToStaticMarkup(
        <Field label="Seats" error={error}>
          <Input />
        </Field>,
      );
      const tag = /<p[^>]* class="herror"[^>]*>/.exec(markup)?.[0] ?? "";
      expect(attribute(tag, "aria-live")).toBe("polite");
    }
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

  test("a control of the app's own gets the label's id, the description and error, and aria-invalid through useField, with its own description kept", () => {
    const AmountInput = (props: FieldControl) => {
      const field = useField(props, { describedBy: "amount-currency" });
      return <input {...field} name="amount" />;
    };
    const markup = renderToStaticMarkup(
      <Field label="Amount" description="Before tax." error="Enter an amount">
        <AmountInput aria-describedby="amount-hint" />
      </Field>,
    );
    const input = inputOf(markup);
    const labelFor = /<label class="hlabel" for="([^"]+)"/.exec(markup)?.[1];
    const descriptionId = /<p class="hdescription" id="([^"]+)"/.exec(markup)?.[1];
    expect(attribute(input, "id")).toBe(labelFor);
    expect(attribute(input, "aria-describedby")).toBe(`${descriptionId} ${errorOf(markup).id} amount-hint amount-currency`);
    expect(attribute(input, "aria-invalid")).toBe("true");
  });

  test("useField passes on a control's own aria-label, which names it outside a Field and instead of a Field's label", () => {
    const Editor = (props: FieldControl) => {
      const field = useField(props);
      return <div {...field} role="textbox" />;
    };
    const editorOf = (markup: string) => /<div[^>]* role="textbox"[^>]*>/.exec(markup)?.[0] ?? "";

    const alone = editorOf(renderToStaticMarkup(<Editor aria-label="Notes" />));
    expect(attribute(alone, "aria-label")).toBe("Notes");

    const labelled = renderToStaticMarkup(
      <Field label="Notes" control="button">
        <Editor />
      </Field>,
    );
    const labelId = /<span class="hlabel" id="([^"]+)"/.exec(labelled)?.[1];
    expect(labelId).toBeTruthy();
    expect(attribute(editorOf(labelled), "aria-labelledby")).toBe(labelId);
    expect(attribute(editorOf(labelled), "aria-label")).toBeUndefined();

    const named = editorOf(
      renderToStaticMarkup(
        <Field label="Notes" control="button">
          <Editor aria-label="Meeting notes" />
        </Field>,
      ),
    );
    expect(attribute(named, "aria-label")).toBe("Meeting notes");
    expect(attribute(named, "aria-labelledby")).toBeUndefined();
  });
});
