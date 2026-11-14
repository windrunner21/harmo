import { describe, expect, test } from "bun:test";
import { Option, Select } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// Each hidden input's attributes, whatever order React writes them in.
const hiddenInputs = (markup: string) =>
  [...markup.matchAll(/<input ([^>]*?)\/?>/g)]
    .map(([, attributes]) => Object.fromEntries([...attributes!.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])))
    .filter((input) => input.type === "hidden");

// What docs/components/select.md says about what it renders for a form.
const options = [
  <Option key="a" value="a">
    A
  </Option>,
  <Option key="b" value="b">
    B
  </Option>,
];

describe("Select", () => {
  test("a single select always sends a value, empty while nothing is chosen", () => {
    expect(renderToStaticMarkup(<Select aria-label="S" name="s">{options}</Select>)).toContain(
      '<input type="hidden" name="s" value=""/>',
    );
    expect(renderToStaticMarkup(<Select aria-label="S" name="s" defaultValue="b">{options}</Select>)).toContain(
      '<input type="hidden" name="s" value="b"/>',
    );
  });

  test("choosing several, one hidden input for each, and none while nothing is chosen", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" multiple defaultValue={["a", "b"]}>
        {options}
      </Select>,
    );
    expect(markup.match(/<input type="hidden" name="s"/g)).toHaveLength(2);
    expect(renderToStaticMarkup(<Select aria-label="S" name="s" multiple>{options}</Select>)).not.toContain(
      'type="hidden"',
    );
  });

  test("outside its form, the trigger and each hidden input name the form", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" form="f" multiple defaultValue={["a", "b"]}>
        {options}
      </Select>,
    );
    expect(markup).toMatch(/<button[^>]*form="f"/);
    expect(hiddenInputs(markup)).toEqual([
      { type: "hidden", name: "s", value: "a", form: "f" },
      { type: "hidden", name: "s", value: "b", form: "f" },
    ]);
  });

  test("disabled, it has no popup and no aria-controls, and its hidden input is disabled", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" defaultValue="a" disabled>
        {options}
      </Select>,
    );
    expect(markup).not.toContain("hpopup");
    expect(markup).not.toContain("aria-controls");
    expect(hiddenInputs(markup)).toEqual([{ type: "hidden", name: "s", value: "a", disabled: "" }]);
  });
});
