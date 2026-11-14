import { describe, expect, test } from "bun:test";
import { Segmented, SegmentedOption } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/segmented.md says a Segmented Control gives its
// options, and how its label names it.
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
});
