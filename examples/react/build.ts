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
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { buildPlayground, dedent, runBuild, watchPlayground } from "../playground.ts";
import { AccentPicker } from "./src/AccentPicker.tsx";
import { components } from "./src/examples.ts";
import { Ready } from "./src/Ready.tsx";

const src = join(import.meta.dir, "src");
const transpiler = new Bun.Transpiler({ loader: "tsx" });

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
        const demo = renderToString(createElement(StrictMode, null, createElement(Ready, null, createElement(Example))), {
          identifierPrefix: `${id}-`,
        });
        return { demo: withoutHints(demo), code: code.get(slug)?.get(title) ?? "", hydrate: true };
      },
    });
  });
}

// Each example's code as an app would write it: the JSX it returns, or the
// whole body of an example that sets something up first. Examples are
// written as `"Title": () => (…),` or `Title: () => {…},` entries of
// `export const examples`, two spaces in. A line ending in `// playground only`
// is left out, such as one that ties an example to the page around it; and an
// example that has to run differently on the playground than in an app shows
// its entry in `export const shownCode`, a template literal per title.
function codeOf(slug: string) {
  const file = `src/components/${slug}.tsx`;
  const source = readFileSync(join(src, "components", `${slug}.tsx`), "utf8");
  // The examples object alone, up to its own closing brace, so the last
  // example ends there rather than taking in what follows, such as shownCode.
  const opening = source.indexOf("export const examples = {");
  const closing = source.indexOf("\n};", opening);
  if (opening < 0 || closing < 0) throw new Error(`${file}: can't find \`export const examples = { … };\``);
  const body = source.slice(opening, closing);
  const entries = [...body.matchAll(/^  (?:"([^"]+)"|(\w+)): \(\) => (.*)$/gm)];
  const code = new Map<string, string>();
  entries.forEach((entry, index) => {
    const title = entry[1] ?? entry[2] ?? "";
    const first = entry[3] ?? "";
    const start = (entry.index ?? 0) + entry[0].length;
    const text = body.slice(start, entries[index + 1]?.index ?? body.length);
    if (first === "(") code.set(title, dedent(text.replace(/\n  \),\s*$/, "")));
    else if (first === "{") code.set(title, dedent(text.replace(/\n  \},\s*$/, "")));
    else code.set(title, first.replace(/,$/, ""));
  });
  const shown = source.indexOf("export const shownCode = {");
  if (shown >= 0) {
    for (const [, quoted, plain, text] of source.slice(shown).matchAll(/^  (?:"([^"]+)"|(\w+)): `([^`]*)`,$/gm)) {
      code.set(quoted ?? plain ?? "", dedent(text ?? "").trim());
    }
  }
  // What an example needs from outside Harmo and React, so its code says where
  // that comes from: a whole module, or a default export such as a JSON file.
  const imports = [...source.matchAll(/^import (?:\* as )?(\w+) from "[^"]+";$/gm)];
  const declarations = declarationsOf(source.slice(0, opening));
  for (const title of Object.keys(components[slug] ?? {})) {
    const text = code.get(title)?.replace(/^[^\n]*\/\/ playground only\n/gm, "");
    if (!text) throw new Error(`${file}: can't find the code of "${title}"`);
    if (!parses(text)) throw new Error(`${file}: the code shown for "${title}" isn't valid TSX:\n\n${text}`);
    const own = used(declarations, text);
    const all = [...own.map((declaration) => declaration.text), text].join("\n");
    const needed = imports.filter(([, name]) => new RegExp(`\\b${name}\\b`).test(all)).map(([line]) => line);
    const shown = [needed.join("\n"), own.map((declaration) => declaration.text).join("\n\n"), text].filter(Boolean).join("\n\n");
    if (own.length && !parses(shown)) throw new Error(`${file}: the code shown for "${title}", with what it uses, isn't valid TSX:\n\n${shown}`);
    code.set(title, shown);
  }
  return code;
}

// The file's own declarations above its examples: each constant, function, or
// type, with the comment above it, by the name it declares. A copied example
// brings those it uses, so it runs on its own.
function declarationsOf(source: string) {
  const found: { name: string; text: string }[] = [];
  let comment: string[] = [];
  let current: { name: string; lines: string[] } | undefined;
  const end = () => {
    if (current) found.push({ name: current.name, text: current.lines.join("\n").trimEnd() });
    current = undefined;
  };
  for (const line of source.split("\n")) {
    const declared = /^(?:export\s+)?(?:const|let|function|async function|type|interface|class)\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (declared) {
      end();
      current = { name: declared[1] as string, lines: [...comment, line] };
      comment = [];
    } else if (line.startsWith("//")) {
      end();
      comment.push(line);
    } else if (current && (line === "" || /^[\s})\]]/.test(line))) {
      current.lines.push(line);
    } else {
      end();
      comment = [];
    }
  }
  end();
  return found;
}

// The declarations a piece of code uses, and those they use in turn, in the
// file's order.
function used(declarations: { name: string; text: string }[], code: string) {
  // A name not after a dot, nor before "=" or ":", so that a JSX attribute,
  // an object's key, or a declaration of its own isn't taken for a use.
  const uses = (text: string, name: string) =>
    new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}\\b(?!\\s*(?:=(?![=>])|:))`).test(text);
  const taken = new Set<string>();
  let reach = [code];
  while (reach.length) {
    const next = declarations.filter(({ name }) => !taken.has(name) && reach.some((text) => uses(text, name)));
    for (const declaration of next) taken.add(declaration.name);
    reach = next.map((declaration) => declaration.text);
  }
  return declarations.filter(({ name }) => taken.has(name));
}

// Whether an example's code parses, as the JSX an example returns or as the
// body of one that sets something up first, so a copied example works.
function parses(code: string) {
  return [`(() => (\n${code}\n));`, `(() => {\n${code}\n});`].some((wrapped) => {
    try {
      transpiler.transformSync(wrapped);
      return true;
    } catch {
      return false;
    }
  });
}

// React hoists a preload hint for each image into the document's head.
// Rendered on its own, with no head, it writes the hints ahead of the markup.
function withoutHints(markup: string) {
  return markup.replace(/<link\b[^>]*\brel="preload"[^>]*>/g, "");
}
