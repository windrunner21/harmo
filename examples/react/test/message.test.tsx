import { describe, expect, test } from "bun:test";
import { Message } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/message.md says: a time is written in the reader's own
// format and time zone, which only the browser knows, so the server leaves
// its words out, keeping its datetime.
describe("Message", () => {
  test("on the server, a time keeps its datetime, and leaves its words to the browser", () => {
    const html = renderToStaticMarkup(
      <Message from="user" time={new Date("2026-11-18T09:42:00Z")}>
        Hi
      </Message>,
    );
    expect(html).toMatch(/<time class="hmessage-time" datetime="2026-11-18T09:42:00.000Z"><\/time>/i);
  });
});
