import { describe, expect, test } from "bun:test";
import { Field, Segmented, SegmentedOption } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/segmented.md says a Segmented Control gives its
// options, how its label names it, and how its description and error
// describe it.
const options = (markup: string) => markup.match(/<input[^>]*>/g) ?? [];
const has = (markup: string, name: string) => options(markup).map((option) => option.includes(` ${name}=""`));

describe("Segmented", () => {
  test("required and disabled are set on every option, even one that says otherwise", () => {
    const markup = renderToStaticMarkup(
      <Segmented aria-label="Assign to" required disabled>
        <SegmentedOption value="team">Team</SegmentedOption>
        <SegmentedOption value="agent" required={false} disabled={false}>
          Agent
        </SegmentedOption>
        <SegmentedOption value="ai" required={undefined} disabled={undefined}>
          AI agent
        </SegmentedOption>
      </Segmented>,
    );
    expect(has(markup, "required")).toEqual([true, true, true]);
    expect(has(markup, "disabled")).toEqual([true, true, true]);
  });

  test("an option's own disabled still counts in a group that isn't", () => {
    const markup = renderToStaticMarkup(
      <Segmented aria-label="Assign to" defaultValue="team">
        <SegmentedOption value="team">Team</SegmentedOption>
        <SegmentedOption value="ai" disabled>
          AI agent
        </SegmentedOption>
      </Segmented>,
    );
    expect(has(markup, "disabled")).toEqual([false, true]);
    expect(has(markup, "checked")).toEqual([true, false]);
  });

  test("a label of 0 names the group, as React renders 0", () => {
    const markup = renderToStaticMarkup(
      <Segmented label={0}>
        <SegmentedOption value="none">None</SegmentedOption>
      </Segmented>,
    );
    const id = /<span class="hlabel" id="([^"]+)">0<\/span>/.exec(markup)?.[1];
    expect(id).toBeTruthy();
    const group = /<div[^>]* role="radiogroup"[^>]*>/.exec(markup)?.[0] ?? "";
    expect(group).toContain(` aria-labelledby="${id}"`);
  });

  test("an empty label renders no field around it", () => {
    const markup = renderToStaticMarkup(
      <Segmented label="" aria-label="Message header">
        <SegmentedOption value="none">None</SegmentedOption>
      </Segmented>,
    );
    expect(markup).not.toContain("hfield");
    expect(markup).toMatch(/^<div[^>]* class="hsegmented"/);
  });

  const groupOf = (markup: string) => /<div[^>]* role="radiogroup"[^>]*>/.exec(markup)?.[0] ?? "";
  const attribute = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1];

  test("its Field's description and error describe the group, and the error marks it invalid", () => {
    const markup = renderToStaticMarkup(
      <Segmented label="Reply tone" optional="Optional" description="Used for suggested replies." error="Choose a tone">
        <SegmentedOption value="friendly">Friendly</SegmentedOption>
      </Segmented>,
    );
    const labelId = /<span class="hlabel" id="([^"]+)">Reply tone<\/span>/.exec(markup)?.[1];
    const optionalId = /<span class="hfield-optional" id="([^"]+)">/.exec(markup)?.[1];
    const descriptionId = /<p class="hdescription" id="([^"]+)">/.exec(markup)?.[1];
    const errorId = attribute(/<p[^>]* class="herror"[^>]*>Choose a tone/.exec(markup)?.[0] ?? "", "id");
    const group = groupOf(markup);
    expect(attribute(group, "aria-labelledby")).toBe(labelId);
    expect(attribute(group, "aria-describedby")).toBe(`${optionalId} ${descriptionId} ${errorId}`);
    expect(attribute(group, "aria-invalid")).toBe("true");
  });

  test("without an error, the group isn't marked invalid, and the error is ready to show", () => {
    const markup = renderToStaticMarkup(
      <Segmented label="Reply tone" error={undefined}>
        <SegmentedOption value="friendly">Friendly</SegmentedOption>
      </Segmented>,
    );
    expect(attribute(groupOf(markup), "aria-invalid")).toBeUndefined();
    expect(markup).toContain('class="herror"');
  });

  test("an aria-labelledby of the app's own wins over the label", () => {
    const markup = renderToStaticMarkup(
      <Segmented label="Reply tone" aria-labelledby="settings-heading">
        <SegmentedOption value="friendly">Friendly</SegmentedOption>
      </Segmented>,
    );
    expect(attribute(groupOf(markup), "aria-labelledby")).toBe("settings-heading");
  });

  test("in a Field of the app's own with control=\"button\", the Field's label names the group", () => {
    const markup = renderToStaticMarkup(
      <Field label="Reply tone" control="button" description="Used for suggested replies.">
        <Segmented>
          <SegmentedOption value="friendly">Friendly</SegmentedOption>
        </Segmented>
      </Field>,
    );
    const labelId = /<span class="hlabel" id="([^"]+)">Reply tone<\/span>/.exec(markup)?.[1];
    const descriptionId = /<p class="hdescription" id="([^"]+)">/.exec(markup)?.[1];
    expect(attribute(groupOf(markup), "aria-labelledby")).toBe(labelId);
    expect(attribute(groupOf(markup), "aria-describedby")).toBe(descriptionId);
  });
});
