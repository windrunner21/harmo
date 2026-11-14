import { describe, expect, test } from "bun:test";
import { Radio, RadioGroup } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/radio.md says a RadioGroup gives the radios in it: one
// name, the chosen value, and required and disabled on every one.
const radios = (markup: string) => markup.match(/<input[^>]*>/g) ?? [];
const attribute = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1];
const has = (markup: string, name: string) => radios(markup).map((radio) => radio.includes(` ${name}=""`));

describe("RadioGroup", () => {
  test("its radios share its name, or one it generates", () => {
    const named = renderToStaticMarkup(
      <RadioGroup label="Export format" name="format">
        <Radio value="csv" />
        <Radio value="pdf" />
      </RadioGroup>,
    );
    expect(radios(named).map((radio) => attribute(radio, "name"))).toEqual(["format", "format"]);

    const generated = radios(
      renderToStaticMarkup(
        <RadioGroup label="Export format">
          <Radio value="csv" />
          <Radio value="pdf" />
        </RadioGroup>,
      ),
    ).map((radio) => attribute(radio, "name"));
    expect(generated[0]).toBeTruthy();
    expect(generated[1]).toBe(generated[0]);
  });

  test("value and defaultValue choose the radio with that value; a null value chooses none", () => {
    const group = (props: { value?: string | null; defaultValue?: string }) =>
      renderToStaticMarkup(
        <RadioGroup label="Export format" onValueChange={() => {}} {...props}>
          <Radio value="csv" />
          <Radio value="pdf" />
        </RadioGroup>,
      );
    expect(has(group({ value: "pdf" }), "checked")).toEqual([false, true]);
    expect(has(group({ defaultValue: "pdf" }), "checked")).toEqual([false, true]);
    expect(has(group({ value: null }), "checked")).toEqual([false, false]);
  });

  test("required and disabled are set on every radio in it, even one that says otherwise", () => {
    const markup = renderToStaticMarkup(
      <RadioGroup label="Data region" required disabled>
        <Radio value="eu" />
        <Radio value="us" required={false} disabled={false} />
        <Radio value="ap" required={undefined} disabled={undefined} />
      </RadioGroup>,
    );
    expect(has(markup, "required")).toEqual([true, true, true]);
    expect(has(markup, "disabled")).toEqual([true, true, true]);
  });

  test("a radio's own required and disabled still count in a group that isn't", () => {
    const markup = renderToStaticMarkup(
      <RadioGroup label="Template category">
        <Radio value="marketing" />
        <Radio value="authentication" required disabled />
      </RadioGroup>,
    );
    expect(has(markup, "required")).toEqual([false, true]);
    expect(has(markup, "disabled")).toEqual([false, true]);
  });

  test("the group keeps the ARIA attributes passed to it: its own name wins, and descriptions combine", () => {
    const group = (markup: string) => /<div[^>]*role="radiogroup"[^>]*>/.exec(markup)?.[0] ?? "";
    const described = group(
      renderToStaticMarkup(
        <RadioGroup label="Delivery" description="In your account's time zone." aria-describedby="delivery-help" aria-invalid>
          <Radio value="now" />
        </RadioGroup>,
      ),
    );
    expect(attribute(described, "aria-describedby")).toMatch(/^\S+-description delivery-help$/);
    expect(attribute(described, "aria-invalid")).toBe("true");
    expect(attribute(described, "aria-labelledby")).toMatch(/-label$/);

    const labelled = group(
      renderToStaticMarkup(
        <RadioGroup label="Delivery" aria-labelledby="delivery-heading">
          <Radio value="now" />
        </RadioGroup>,
      ),
    );
    expect(attribute(labelled, "aria-labelledby")).toBe("delivery-heading");
  });
});
