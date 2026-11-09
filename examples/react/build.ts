// Builds the React playground into dist/: the HTML playground's pages, with
// each example rendered by its React version in src/components/<slug>.tsx.
// The examples are rendered here, as a server would, and src/client.tsx
// hydrates them in the browser. examples/playground.ts builds the pages.
//
//   bun examples/react/build.ts           build once
//   bun examples/react/build.ts --watch   rebuild when an example, a
//                                         component, or the HTML playground
//                                         changes

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { buildPlayground, dedent, runBuild, watchPlayground } from "../playground.ts";
import { AccentPicker } from "./src/AccentPicker.tsx";
import { components } from "./src/examples.ts";
import { Ready } from "./src/Ready.tsx";

const src = join(import.meta.dir, "src");

if (process.argv.includes("--watch")) {
  watchPlayground(import.meta.path, [
    src,
    join(import.meta.dir, "..", "html", "src"),
    join(import.meta.dir, "..", "..", "packages", "react", "dist"),
  ]);
} else {
  // A classic script rather than a module, so the pages work opened from
  // disk, as the HTML playground's do. Development builds of React, which
  // explain a hydration mismatch in the console.
  const client = await Bun.build({
    entrypoints: [join(src, "client.tsx")],
    target: "browser",
    format: "iife",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
  });
  if (!client.success) {
    console.error("Playground build failed:", ...client.logs);
    process.exit(1);
  }
  const script = await client.outputs[0].text();

  runBuild(() => {
    const code = new Map(Object.keys(components).map((slug) => [slug, codeOf(slug)]));
    buildPlayground({
      out: join(import.meta.dir, "dist"),
      title: "Harmo — React playground",
      overview: join(src, "overview.html"),
      about: "The examples use Harmo's React components and CSS; the page around them is styled by playground.css, which isn't part of Harmo.",
      codeLabel: "Code",
      components: new Set(Object.keys(components)),
      scripts: ["client.js"],
      copy: ["playground.css", "playground.js", "images"],
      write: { "client.js": script },
      accent: `<div id="play-accent-root">${renderToString(createElement(AccentPicker), { identifierPrefix: "play-accent-" })}</div>`,
      render: ({ slug, title, id }) => {
        const Example = components[slug]?.[title];
        if (!Example) return undefined;
        const demo = renderToString(createElement(Ready, null, createElement(Example)), { identifierPrefix: `${id}-` });
        return { demo: withoutHints(demo), code: code.get(slug)?.get(title) ?? "", hydrate: true };
      },
    });
  });
}

// Each example's code as an app would write it: the JSX it returns, or the
// whole body of an example that sets something up first. Examples are
// written as `"Title": () => (…),` or `Title: () => {…},` entries of
// `export const examples`, two spaces in.
function codeOf(slug: string) {
  const source = readFileSync(join(src, "components", `${slug}.tsx`), "utf8");
  const body = source.slice(source.indexOf("export const examples = {"));
  const entries = [...body.matchAll(/^  (?:"([^"]+)"|(\w+)): \(\) => (.*)$/gm)];
  const code = new Map<string, string>();
  // What an example needs from outside Harmo and React, so its code says where
  // that comes from.
  const imports = [...source.matchAll(/^import \* as (\w+) from "[^"]+";$/gm)];
  entries.forEach((entry, index) => {
    const title = entry[1] ?? entry[2] ?? "";
    const opening = entry[3] ?? "";
    const start = (entry.index ?? 0) + entry[0].length;
    const end = entries[index + 1]?.index ?? body.lastIndexOf("\n};");
    const text = body.slice(start, end);
    if (opening === "(") code.set(title, dedent(text.replace(/\n  \),\s*$/, "")));
    else if (opening === "{") code.set(title, dedent(text.replace(/\n  \},\s*$/, "")));
    else code.set(title, opening.replace(/,$/, ""));
    const needed = imports.filter(([, name]) => new RegExp(`\\b${name}\\b`).test(text));
    if (needed.length) code.set(title, `${needed.map(([line]) => line).join("\n")}\n\n${code.get(title)}`);
  });
  for (const title of Object.keys(components[slug] ?? {})) {
    if (!code.get(title)) throw new Error(`src/components/${slug}.tsx: can't find the code of "${title}"`);
  }
  return code;
}

// React hoists a preload hint for each image into the document's head.
// Rendered on its own, with no head, it writes the hints ahead of the markup.
function withoutHints(markup: string) {
  return markup.replace(/<link\b[^>]*\brel="preload"[^>]*>/g, "");
}
