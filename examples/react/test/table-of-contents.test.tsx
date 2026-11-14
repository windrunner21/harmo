import { describe, expect, test } from "bun:test";
import { TableOfContents } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/table-of-contents.md says about what it renders.
const items = [
  { id: "one", label: "One" },
  { id: "two", label: "Two", level: 2 as const },
];

describe("TableOfContents", () => {
  test("a named navigation of links to each heading, kept a list for Safari", () => {
    const markup = renderToStaticMarkup(<TableOfContents aria-label="On this page" items={items} />);
    expect(markup).toStartWith('<nav aria-label="On this page" class="htoc">');
    expect(markup).toContain('<span class="htoc-marker" aria-hidden="true"></span><ul class="htoc-list" role="list">');
    expect(markup).toContain('<a class="htoc-link" href="#one">One</a>');
  });

  test("a level goes on its item, and none is marked until it can see the page", () => {
    const markup = renderToStaticMarkup(<TableOfContents aria-label="On this page" items={items} />);
    expect(markup).toContain('<li class="htoc-item" data-level="2">');
    expect(markup).not.toContain("aria-current");
  });

  test("only the end side is marked", () => {
    expect(renderToStaticMarkup(<TableOfContents aria-label="x" items={items} />)).not.toContain("data-side");
    expect(renderToStaticMarkup(<TableOfContents aria-label="x" items={items} side="end" />)).toContain('data-side="end"');
  });

  test("an id is encoded for its link, so that it can be found again", () => {
    const markup = renderToStaticMarkup(<TableOfContents aria-label="x" items={[{ id: "café", label: "C" }]} />);
    expect(markup).toContain('href="#caf%C3%A9"');
  });

  test("className goes on the nav", () => {
    expect(renderToStaticMarkup(<TableOfContents aria-label="x" items={[]} className="y" />)).toContain('class="htoc y"');
  });
});
