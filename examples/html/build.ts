// Builds the HTML playground into dist/: each example shows its own markup,
// and the scripts in src/scripts stand in for what the React components do.
// examples/playground.ts builds the pages, and describes the partials in
// src/components.
//
//   bun examples/html/build.ts           build once
//   bun examples/html/build.ts --watch   rebuild when src/ or the catalog changes

import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { accentPickerHtml } from "../accents.ts";
import { buildPlayground, runBuild, stripExampleHooks, watchPlayground } from "../playground.ts";

const src = join(import.meta.dir, "src");

if (process.argv.includes("--watch")) {
  watchPlayground(import.meta.path, [src]);
} else {
  runBuild(() =>
    buildPlayground({
      out: join(import.meta.dir, "dist"),
      title: "Harmo — Playground",
      overview: join(src, "overview.html"),
      about: "The examples use only Harmo's CSS; the page around them is styled by playground.css, which isn't part of Harmo.",
      codeLabel: "Markup",
      components: new Set(
        readdirSync(join(src, "components"))
          .filter((file) => file.endsWith(".html"))
          .map((file) => basename(file, ".html")),
      ),
      scripts: readdirSync(join(src, "scripts"))
        .filter((file) => file.endsWith(".js"))
        .sort()
        .map((file) => `scripts/${file}`),
      copy: ["playground.css", "playground.js", "scripts", "images"],
      accent: accentPickerHtml(),
      render: (example) => ({ demo: example.markup, code: stripExampleHooks(example.markup) }),
    }),
  );
}
