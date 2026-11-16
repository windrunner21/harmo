import { describe, expect, test } from "bun:test";
import { basename, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { components } from "../src/examples.ts";
import { htmlExamples, normalize } from "./markup.ts";

// The HTML partials are the contract, so they set what's tested: every HTML
// example is compared with the React example of the same title in
// src/components/<slug>.tsx, which src/examples.ts lists. An HTML example
// without a React version fails, unless it's one of these, which show what
// only HTML can: Tabs before its script runs, and the empty list a search
// leaves, which React shows only once you've typed.
const htmlOnly: Record<string, string[]> = {
  listbox: ["No results"],
  tabs: ["Without the script"],
};
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
        if (htmlOnly[slug]?.includes(title)) continue;
        test(title, () => {
          throw new Error(`src/components/${slug}.tsx has no example "${title}"`);
        });
        continue;
      }
      test(title, () => {
        const rendered = withoutFormActions(withoutHints(renderToStaticMarkup(<Example />)));
        expect(normalize(rendered)).toBe(normalize(withEndpoint(withoutMultipart(markup))));
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

for (const [slug, titles] of Object.entries(htmlOnly)) {
  for (const title of titles) {
    test(`${slug}: ${title} is HTML only`, () => {
      expect(htmlExamples(slug).has(title), `components/${slug}.html has no example "${title}"`).toBe(true);
      expect(components[slug]?.[title], `src/components/${slug}.tsx has "${title}", so it's compared`).toBeUndefined();
    });
  }
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

// A form whose action is a function, as a pattern's is, gets what React writes
// for it. For a function that runs in the browser, it writes an action that
// throws, so the browser never sends the form itself, and a script that holds
// a form sent before the page hydrates, to send it once it has; a button's
// formAction gets the same action. For a server action, it writes
// method="POST" and hidden fields that name it, so the form posts without
// JavaScript, as the HTML examples' method="post" does. Only these are
// changed: React's action on a form reads as method="post", its formAction on
// a button as the endpoint below, and its script goes.
const reactFormAction = "javascript:throw new Error(&#x27;React form unexpectedly submitted.&#x27;)";
const withoutFormActions = (markup: string) =>
  markup
    .replace(/<script>addEventListener\("submit",(?:(?!<\/script>)[\s\S])*\$\$reactFormReplay(?:(?!<\/script>)[\s\S])*<\/script>/g, "")
    .replaceAll(` action="${reactFormAction}"`, ' method="post"')
    .replaceAll(` formAction="${reactFormAction}"`, endpoint);

// A button that posts to an action of its own, such as Verify Code's resend,
// has a formaction in HTML, the server's endpoint for it, which an example
// can only make up, and in React the formAction it writes for a function.
// Each reads as the same endpoint, so what's compared is that the button has
// one where the HTML's does.
const endpoint = ' formaction="(its own action)"';
const withEndpoint = (markup: string) => markup.replace(/\sformaction="[^"]*"/gi, endpoint);

// An HTML form that posts files says so, enctype="multipart/form-data", so it
// sends them without a script. React takes no encType with a function action,
// and writes it itself for a server action, always multipart, so a posting
// form's is left out of the HTML before the two are compared.
const withoutMultipart = (markup: string) =>
  markup.replace(/<form\b[^>]*>/g, (tag) =>
    /\smethod="post"/i.test(tag) ? tag.replace(/\s+enctype="multipart\/form-data"/i, "") : tag,
  );

test("withoutMultipart leaves out the enctype only of a form that posts", () => {
  expect(withoutMultipart('<form method="post" enctype="multipart/form-data" novalidate>')).toBe(
    '<form method="post" novalidate>',
  );
  expect(withoutMultipart('<form enctype="multipart/form-data">')).toBe('<form enctype="multipart/form-data">');
});

test("withoutFormActions changes only what React writes for a function action", () => {
  const Form = () => (
    <form action={async () => {}} noValidate>
      <button type="submit" formAction={async () => {}}>Resend</button>
    </form>
  );
  const markup = withoutFormActions(renderToStaticMarkup(<Form />));
  expect(normalize(markup)).toBe(
    normalize(withEndpoint('<form method="post" novalidate><button type="submit" formaction="/resend">Resend</button></form>')),
  );
  expect(withoutFormActions('<form action="/sign-in"></form>')).toBe('<form action="/sign-in"></form>');
});

// A textarea's text is its first value and a <pre>'s is shown as written, so
// their whitespace counts, but for the newline the parser drops after the
// opening tag, which React writes before text that starts with one.
test("normalize keeps the whitespace in a textarea or a pre", () => {
  expect(normalize("<textarea>a\nb</textarea>")).not.toBe(normalize("<textarea>a b</textarea>"));
  expect(normalize("<textarea>\nb</textarea>")).toBe(normalize("<textarea>b</textarea>"));
  expect(normalize("<textarea>\n\nb</textarea>")).not.toBe(normalize("<textarea>b</textarea>"));
  expect(normalize("<pre><code>a  b</code></pre>")).not.toBe(normalize("<pre><code>a b</code></pre>"));
  expect(normalize("<p>a\n  b</p>")).toBe(normalize("<p>a b</p>"));
});

// A <details> name is renumbered, as React generates its own, but an empty
// one, which groups nothing, isn't made to look like one that does.
test("normalize keeps an empty details name apart from a group's", () => {
  const twice = (name: string) => `<details name="${name}"></details><details name="${name}"></details>`;
  expect(normalize(twice("faq"))).toBe(normalize(twice("questions")));
  expect(normalize(twice(""))).not.toBe(normalize(twice("faq")));
});
