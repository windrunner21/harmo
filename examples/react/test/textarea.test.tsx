import { describe, expect, test } from "bun:test";
import { TextArea } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/textarea.md says about the counter: only with
// maxLength, describing the field, reading "12/500" unless formatCount writes
// it in the app's words.
const counterOf = (markup: string) => /<p class="htextarea-counter" id="([^"]+)"[^>]*>([^<]*)<\/p>/.exec(markup);

describe("TextArea", () => {
  test("without maxLength, there's no counter", () => {
    expect(renderToStaticMarkup(<TextArea aria-label="Message" />)).not.toContain("htextarea-counter");
  });

  test("with maxLength, the counter reads the length out of it, and describes the field", () => {
    const markup = renderToStaticMarkup(<TextArea aria-label="Message" maxLength={500} defaultValue="Hello" />);
    const [, id, text] = counterOf(markup) ?? [];
    expect(text).toBe("5/500");
    expect(markup).toContain(` aria-describedby="${id}"`);
  });

  test("formatCount writes the counter's text from the length and maxLength", () => {
    const markup = renderToStaticMarkup(
      <TextArea
        aria-label="Text message"
        maxLength={160}
        defaultValue="Hello"
        formatCount={(length, maxLength) => `${maxLength - length} characters left`}
      />,
    );
    expect(counterOf(markup)?.[2]).toBe("155 characters left");
  });
});
