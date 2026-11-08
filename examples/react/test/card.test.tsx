import { describe, expect, test } from "bun:test";
import { Card } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/card.md says: with a label, a card renders its parts
// rather than its children; a label that draws nothing isn't one.
describe("Card", () => {
  test("a label renders the parts, 0 included", () => {
    const markup = renderToStaticMarkup(<Card label={0} description="Unread">Ignored</Card>);
    expect(markup).toContain('<h3 class="hcard-title">0</h3>');
    expect(markup).toContain('<p class="hcard-description">Unread</p>');
    expect(markup).not.toContain("Ignored");
  });

  test("a label that draws nothing, such as true, [], or an empty fragment, keeps the children", () => {
    for (const label of [true, [], <></>, [null, false, ""]]) {
      const markup = renderToStaticMarkup(
        <Card href="/team" label={label}>
          Team members
        </Card>,
      );
      expect(markup).toBe('<a href="/team" class="hcard">Team members</a>');
    }
  });
});
