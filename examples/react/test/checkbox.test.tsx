import { describe, expect, test } from "bun:test";
import { Checkbox, CheckboxGroup } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/checkbox.md says a CheckboxGroup gives the checkboxes
// in it: one name, the checked values, and disabled.
const boxes = (markup: string) => markup.match(/<input[^>]*>/g) ?? [];
const attribute = (tag: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1];
const groupOf = (markup: string) => /<div[^>]*role="group"[^>]*>/.exec(markup)?.[0] ?? "";

describe("CheckboxGroup", () => {
  test("its checkboxes share its name, or one it generates", () => {
    const named = renderToStaticMarkup(
      <CheckboxGroup label="Notify me about" name="notify">
        <Checkbox value="messages" />
        <Checkbox value="mentions" />
      </CheckboxGroup>,
    );
    expect(boxes(named).map((box) => attribute(box, "name"))).toEqual(["notify", "notify"]);

    const generated = boxes(
      renderToStaticMarkup(
        <CheckboxGroup label="Notify me about">
          <Checkbox value="messages" />
          <Checkbox value="mentions" />
        </CheckboxGroup>,
      ),
    ).map((box) => attribute(box, "name"));
    expect(generated[0]).toBeTruthy();
    expect(generated[1]).toBe(generated[0]);
  });

  test("value and defaultValue check the checkboxes whose values they hold", () => {
    for (const group of [
      <CheckboxGroup label="Notify me about" value={["mentions"]}>
        <Checkbox value="messages" />
        <Checkbox value="mentions" />
      </CheckboxGroup>,
      <CheckboxGroup label="Notify me about" defaultValue={["mentions"]}>
        <Checkbox value="messages" />
        <Checkbox value="mentions" />
      </CheckboxGroup>,
    ]) {
      expect(boxes(renderToStaticMarkup(group)).map((box) => box.includes('checked=""'))).toEqual([false, true]);
    }
  });

  test("disabled disables every checkbox in it, even one that says otherwise", () => {
    const markup = renderToStaticMarkup(
      <CheckboxGroup label="Notify me about" disabled>
        <Checkbox value="messages" />
        <Checkbox value="mentions" disabled={false} />
        <Checkbox value="failures" disabled={undefined} />
      </CheckboxGroup>,
    );
    expect(boxes(markup)).toHaveLength(3);
    for (const box of boxes(markup)) expect(box).toContain('disabled=""');
  });

  test("a checkbox's own disabled still counts in a group that isn't", () => {
    const markup = renderToStaticMarkup(
      <CheckboxGroup label="Notify me about">
        <Checkbox value="messages" />
        <Checkbox value="mentions" disabled />
      </CheckboxGroup>,
    );
    expect(boxes(markup).map((box) => box.includes('disabled=""'))).toEqual([false, true]);
  });

  test("the group keeps the ARIA attributes passed to it: its own name wins, and descriptions combine", () => {
    const described = groupOf(
      renderToStaticMarkup(
        <CheckboxGroup label="Notify me about" description="We send these by email." aria-describedby="notify-help" aria-invalid>
          <Checkbox value="messages" />
        </CheckboxGroup>,
      ),
    );
    expect(attribute(described, "aria-describedby")).toMatch(/^\S+-description notify-help$/);
    expect(attribute(described, "aria-invalid")).toBe("true");
    expect(attribute(described, "aria-labelledby")).toMatch(/-label$/);

    const named = groupOf(
      renderToStaticMarkup(
        <CheckboxGroup label="Notify me about" aria-label="Notifications">
          <Checkbox value="messages" />
        </CheckboxGroup>,
      ),
    );
    expect(attribute(named, "aria-label")).toBe("Notifications");
    expect(attribute(named, "aria-labelledby")).toBeUndefined();
  });
});
