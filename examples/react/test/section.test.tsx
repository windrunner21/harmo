import { describe, expect, test } from "bun:test";
import { Dialog, Drawer, Section, Setting } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// A description, or Section's actions, of 0 renders inside its part, as React
// renders 0, rather than loose; an empty one renders nothing.
describe("Section", () => {
  test("a description or actions of 0 go in their parts", () => {
    const markup = renderToStaticMarkup(<Section label="Members" description={0} actions={0} />);
    expect(markup).toContain('<p class="hsection-description">0</p>');
    expect(markup).toContain('<div class="hsection-actions">0</div>');
  });

  test("an empty description or no actions render no part", () => {
    const markup = renderToStaticMarkup(<Section label="Members" description="" />);
    expect(markup).not.toContain("hsection-description");
    expect(markup).not.toContain("hsection-actions");
  });

  test("it's named by its title, unless the name is left off", () => {
    expect(renderToStaticMarkup(<Section label="Members" />)).toMatch(/<section aria-labelledby="[^"]+-title"/);
    expect(renderToStaticMarkup(<Section label="Members" aria-labelledby={undefined} />)).not.toContain("aria-labelledby");
  });
});

describe("a description of 0", () => {
  test("in a Setting, goes in its part", () => {
    expect(renderToStaticMarkup(<Setting label="Seats" description={0} />)).toMatch(
      /<p class="hsetting-description" id="[^"]+">0<\/p>/,
    );
  });

  for (const [name, element] of [
    ["Dialog", <Dialog id="seats" label="Seats" closeLabel="Close" description={0} />],
    ["Drawer", <Drawer id="seats" label="Seats" closeLabel="Close" description={0} />],
  ] as const) {
    test(`in a ${name}, goes in its part, and describes it`, () => {
      const markup = renderToStaticMarkup(element);
      expect(markup).toMatch(/id="seats-description"[^>]*>0</);
      expect(markup).toContain('aria-describedby="seats-description"');
    });
  }
});
