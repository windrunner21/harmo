import { describe, expect, test } from "bun:test";
import { Field, Input, TextArea } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/input.md and textarea.md say about what they render.
const pattern = /\{\{\d+\}\}/g;

describe("highlight", () => {
  test("an Input with none is only the input", () => {
    expect(renderToStaticMarkup(<Input defaultValue="a" />)).toBe('<input class="hinput" value="a"/>');
  });

  test("what matches is marked, over a field that keeps its value", () => {
    const markup = renderToStaticMarkup(<Input defaultValue="Hi {{1}} and {{2}}!" highlight={pattern} />);
    expect(markup).toContain('<div class="hinput-highlight"><input');
    expect(markup).toContain('value="Hi {{1}} and {{2}}!"');
    expect(markup).toContain(
      '<div class="hinput-highlight-backdrop" aria-hidden="true"><span>Hi <mark>{{1}}</mark> and <mark>{{2}}</mark>!</span></div>',
    );
  });

  test("a pattern without the g flag still marks them all", () => {
    const markup = renderToStaticMarkup(<Input value="{{1}} {{2}}" readOnly highlight={/\{\{\d+\}\}/} />);
    expect(markup.match(/<mark>/g)).toHaveLength(2);
  });

  test("a pattern that can match nothing doesn't hang or mark empty text", () => {
    expect(renderToStaticMarkup(<Input defaultValue="abc" highlight={/x*/g} />)).not.toContain("<mark");
  });

  test("a field that hides or formats its text isn't highlighted, so a password stays hidden", () => {
    for (const type of ["password", "PASSWORD", "number", "date", "search"]) {
      const markup = renderToStaticMarkup(<Input type={type} defaultValue="secret" highlight={/.+/} />);
      expect(markup).not.toContain("highlight");
      expect(markup).not.toContain("<mark");
    }
  });

  test("a field that shows its text as typed is highlighted", () => {
    for (const type of ["text", "email", "tel", "url", "TEXT"]) {
      expect(renderToStaticMarkup(<Input type={type} defaultValue="a" highlight={/a/} />)).toContain("<mark>a</mark>");
    }
  });

  test("a TextArea matches only the text, not the line break added to draw it", () => {
    expect(renderToStaticMarkup(<TextArea defaultValue="x" highlight={/x\s/} />)).not.toContain("<mark");
    expect(renderToStaticMarkup(<TextArea defaultValue="x" highlight={/x(?!\n)/} />)).toContain("<mark>x</mark>");
  });

  test("a Field's label still reaches the field", () => {
    const markup = renderToStaticMarkup(
      <Field label="Subject">
        <Input highlight={pattern} />
      </Field>,
    );
    const id = /<label[^>]*for="([^"]+)"/.exec(markup)![1];
    expect(markup).toContain(`id="${id}"`);
    expect(markup).toMatch(new RegExp(`<input[^>]*id="${id}"`));
  });

  test("a TextArea wraps the same way, with its counter outside", () => {
    const markup = renderToStaticMarkup(<TextArea defaultValue="{{1}}" maxLength={10} highlight={pattern} />);
    expect(markup).toContain('<div class="htextarea-highlight"><textarea');
    expect(markup).toContain("<span><mark>{{1}}</mark>\n</span>");
    expect(markup.indexOf("htextarea-counter")).toBeGreaterThan(markup.indexOf("htextarea-highlight-backdrop"));
  });
});
