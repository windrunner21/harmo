import { describe, expect, test } from "bun:test";
import { basename, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { components } from "../src/examples.ts";
import { htmlExamples, normalize } from "./markup.ts";

// The HTML partials are the contract, so they set what's tested: every HTML
// example is compared with the React example of the same title in
// src/components/<slug>.tsx, which src/examples.ts lists. An HTML example
// without a React version is a to-do.
const slugsIn = (folder: string, extension: string) =>
  [...new Bun.Glob(`*${extension}`).scanSync(join(import.meta.dir, "..", ...folder.split("/")))]
    .map((file) => basename(file, extension))
    .sort();

const contracts = slugsIn("../html/src/components", ".html");
const ported = slugsIn("src/components", ".tsx");

for (const slug of contracts) {
  const html = htmlExamples(slug);
  const examples = components[slug] ?? {};

  describe(slug, () => {
    for (const [title, markup] of html) {
      const Example = examples[title];
      if (!Example) {
        test.todo(title);
        continue;
      }
      test(title, () => {
        const rendered = withoutHints(renderToStaticMarkup(<Example />));
        expect(normalize(rendered)).toBe(normalize(markup));
      });
    }

    for (const title of Object.keys(examples)) {
      if (html.has(title)) continue;
      test(title, () => {
        throw new Error(`components/${slug}.html has no example "${title}"`);
      });
    }
  });
}

for (const slug of ported.filter((slug) => !components[slug])) {
  test(slug, () => {
    throw new Error(`src/components/${slug}.tsx isn't listed in src/examples.ts`);
  });
}

for (const slug of Object.keys(components).filter((slug) => !contracts.includes(slug))) {
  test(slug, () => {
    throw new Error(`src/examples.ts lists ${slug}, but there's no components/${slug}.html`);
  });
}

// React hoists a preload hint for each image into the document's head.
// Rendered on its own, with no head, it writes the hints ahead of the markup.
const withoutHints = (markup: string) =>
  markup.replace(/<link\b[^>]*\brel="preload"[^>]*>/g, "");

// A <details> name is renumbered, as React generates its own, but an empty
// one, which groups nothing, isn't made to look like one that does.
test("normalize keeps an empty details name apart from a group's", () => {
  const twice = (name: string) => `<details name="${name}"></details><details name="${name}"></details>`;
  expect(normalize(twice("faq"))).toBe(normalize(twice("questions")));
  expect(normalize(twice(""))).not.toBe(normalize(twice("faq")));
});
