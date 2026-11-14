import { describe, expect, test } from "bun:test";
import { Combobox, Option } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// Each hidden input's attributes, whatever order React writes them in.
const hiddenInputs = (markup: string) =>
  [...markup.matchAll(/<input ([^>]*?)\/?>/g)]
    .map(([, attributes]) => Object.fromEntries([...attributes!.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])))
    .filter((input) => input.type === "hidden");

// What docs/components/combobox.md says about what it renders for a form.
const options = [
  <Option key="sam" value="sam">
    Sam Rivera
  </Option>,
  <Option key="ana" value="ana">
    Ana Lopez
  </Option>,
];
const several = { removeLabel: (label: string) => `Remove ${label}`, moreLabel: (count: number) => `${count} more` };

describe("Combobox", () => {
  test("in pick mode, the field shows the pick's label, and a hidden input sends its value", () => {
    const markup = renderToStaticMarkup(
      <Combobox aria-label="Owner" name="owner" defaultValue="ana">
        {options}
      </Combobox>,
    );
    expect(markup).toMatch(/<input[^>]*role="combobox"[^>]*value="Ana Lopez"/);
    expect(markup).toContain('<input type="hidden" name="owner" value="ana"/>');
  });

  test("with free text, the field itself has the name, and there's no hidden input", () => {
    const markup = renderToStaticMarkup(
      <Combobox aria-label="To" freeText name="to" defaultValue="sam@example.com">
        {options}
      </Combobox>,
    );
    expect(markup).toMatch(/<input[^>]*name="to"[^>]*value="sam@example.com"/);
    expect(markup).not.toContain('type="hidden"');
  });

  test("choosing several, one hidden input for each choice, with the form it names", () => {
    const markup = renderToStaticMarkup(
      <Combobox aria-label="Notify" multiple name="notify" form="f" defaultValue={["sam", "ana"]} {...several}>
        {options}
      </Combobox>,
    );
    expect(hiddenInputs(markup)).toEqual([
      { type: "hidden", name: "notify", value: "sam", form: "f" },
      { type: "hidden", name: "notify", value: "ana", form: "f" },
    ]);
    expect(markup).not.toMatch(/<input[^>]*role="combobox"[^>]*name=/);
  });

  test("disabled, it has no popup and no aria-controls, and its hidden inputs are disabled", () => {
    const pick = renderToStaticMarkup(
      <Combobox aria-label="Owner" name="owner" defaultValue="sam" disabled>
        {options}
      </Combobox>,
    );
    expect(pick).not.toContain("hpopup");
    expect(pick).not.toContain("aria-controls");
    expect(hiddenInputs(pick)).toEqual([{ type: "hidden", name: "owner", value: "sam", disabled: "" }]);

    const chosen = renderToStaticMarkup(
      <Combobox aria-label="Notify" multiple name="notify" defaultValue={["ana"]} disabled {...several}>
        {options}
      </Combobox>,
    );
    expect(hiddenInputs(chosen)).toEqual([{ type: "hidden", name: "notify", value: "ana", disabled: "" }]);
  });
});
