import { describe, expect, test } from "bun:test";
import { Option, OptionGroup, Select } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// The tags of one kind in markup, each as its attributes, whatever order
// React writes them in.
const tags = (markup: string, tag: string) =>
  [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*?)/?>`, "g"))].map(([, attributes]) =>
    Object.fromEntries([...attributes!.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, key, value]) => [key, value ?? ""])),
  );

// The fallback's <select>, and its options as [value, text, ...states].
const fallbackOf = (markup: string) => {
  const select = /<span class="hselect-fallback"( hidden="")?><select\b([^>]*)>([\s\S]*?)<\/select>/.exec(markup);
  if (!select) return undefined;
  return {
    hidden: Boolean(select[1]),
    select: tags(`<select${select[2]}>`, "select")[0]!,
    options: [...select[3]!.matchAll(/<option\b([^>]*)>([^<]*)<\/option>/g)].map(([, attributes, text]) => {
      const { value, ...states } = tags(`<option${attributes}>`, "option")[0]!;
      return [value, text, ...Object.keys(states).sort()];
    }),
  };
};

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
  test("with a name, a native select sends the value, and the trigger names it for scripts; nothing else does", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" defaultValue="b">
        {options}
      </Select>,
    );
    expect(fallbackOf(markup)).toEqual({
      hidden: false,
      select: { name: "s", "aria-label": "S" },
      options: [
        ["a", "A"],
        ["b", "B", "selected"],
      ],
    });
    expect(markup).toMatch(/^<span class="hselect-fallback"><select[^>]*>.*<\/select><svg class="hexpand-chevron"/);
    expect(tags(markup, "button")[0]).toMatchObject({ class: "hselect", "data-name": "s" });
    expect(tags(markup, "input")).toEqual([]);
    expect(markup.match(/ name="s"/g)).toHaveLength(1);
  });

  test("without a name, there's no fallback and no form value, as before", () => {
    const markup = renderToStaticMarkup(<Select aria-label="S" defaultValue="a">{options}</Select>);
    expect(markup).not.toContain("hselect-fallback");
    expect(markup).not.toContain("<select");
    expect(markup).not.toContain("name=");
    expect(markup).toStartWith("<button ");
  });

  test("a placeholder is the first option, empty, disabled, and selected while nothing is chosen", () => {
    expect(
      fallbackOf(renderToStaticMarkup(<Select aria-label="S" name="s" placeholder="Pick one">{options}</Select>))?.options,
    ).toEqual([
      ["", "Pick one", "disabled", "selected"],
      ["a", "A"],
      ["b", "B"],
    ]);
    expect(
      fallbackOf(renderToStaticMarkup(<Select aria-label="S" name="s" placeholder="Pick one" defaultValue="a">{options}</Select>))
        ?.options,
    ).toEqual([
      ["", "Pick one", "disabled"],
      ["a", "A", "selected"],
      ["b", "B"],
    ]);
  });

  test("with nothing chosen and no placeholder, an empty option is selected, so the browser doesn't choose the first", () => {
    expect(fallbackOf(renderToStaticMarkup(<Select aria-label="S" name="s">{options}</Select>))?.options).toEqual([
      ["", "", "disabled", "selected"],
      ["a", "A"],
      ["b", "B"],
    ]);
  });

  test("choosing several, a multiple select with each chosen option selected, no placeholder, and no chevron", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" multiple placeholder="Any" defaultValue={["a", "b"]}>
        {options}
      </Select>,
    );
    expect(fallbackOf(markup)).toMatchObject({
      select: { name: "s", multiple: "" },
      options: [
        ["a", "A", "selected"],
        ["b", "B", "selected"],
      ],
    });
    expect(markup).toMatch(/<\/select><\/span><button/);
    expect(fallbackOf(renderToStaticMarkup(<Select aria-label="S" name="s" multiple>{options}</Select>))?.options).toEqual([
      ["a", "A"],
      ["b", "B"],
    ]);
  });

  test("its label, description, and error name and describe the fallback as they do the trigger", () => {
    const markup = renderToStaticMarkup(
      <Select label="Channel" description="Where to send it." error="Choose one." name="s" aria-required>
        {options}
      </Select>,
    );
    const [trigger] = tags(markup, "button");
    const { select } = fallbackOf(markup)!;
    expect(select["aria-labelledby"]).toBe(trigger!["aria-labelledby"]);
    expect(markup).toContain(`<span class="hlabel" id="${trigger!["aria-labelledby"]}">Channel</span>`);
    expect(select["aria-describedby"]).toBe(trigger!["aria-describedby"]);
    expect(select["aria-describedby"]!.split(" ")).toHaveLength(2);
    expect(select["aria-invalid"]).toBe("true");
    expect(select.required).toBe("");
    expect(trigger!["aria-required"]).toBe("true");
    expect(trigger!.id).toBeDefined();
    expect(select.id).toBeUndefined();
  });

  test("outside its form, the trigger and the fallback name the form", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" form="f" defaultValue="a">
        {options}
      </Select>,
    );
    expect(markup).toMatch(/<button[^>]*form="f"/);
    expect(fallbackOf(markup)?.select.form).toBe("f");
  });

  test("disabled, it has no popup and no aria-controls, and its fallback is disabled", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" defaultValue="a" disabled>
        {options}
      </Select>,
    );
    expect(markup).not.toContain("hpopup");
    expect(markup).not.toContain("aria-controls");
    expect(fallbackOf(markup)?.select.disabled).toBe("");
  });

  test("hidden without a label, the fallback is hidden too", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" hidden>
        {options}
      </Select>,
    );
    expect(fallbackOf(markup)?.hidden).toBe(true);
    expect(tags(markup, "button")[0]?.hidden).toBe("");
  });

  test("groups become optgroups, and options their text alone, without icons, descriptions, or badges", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="S" name="s" defaultValue="pro">
        <OptionGroup label="Plans">
          <Option value="free" description="For one person" badge="New">
            <svg aria-hidden="true" />
            Free
          </Option>
          <Option value="pro" disabled>
            Pro
          </Option>
        </OptionGroup>
        <>
          <Option value="other" hidden>
            Other
          </Option>
        </>
      </Select>,
    );
    const select = /<select\b[^>]*>([\s\S]*?)<\/select>/.exec(markup)![1];
    expect(select).toBe(
      '<optgroup label="Plans"><option value="free">Free</option><option value="pro" disabled="" selected="">Pro</option></optgroup>' +
        '<option value="other" hidden="">Other</option>',
    );
  });
});
