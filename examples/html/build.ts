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

// The Globe's script, with three.js, as a classic script, since a page opened
// from disk can't load modules; scripts/globe.js loads it where there's a
// globe.
const globeBundle = async () => {
  const built = await Bun.build({
    entrypoints: [join(src, "globe-bundle.ts")],
    target: "browser",
    format: "iife",
    minify: true,
  });
  if (!built.success) {
    console.error("Globe bundle failed:", ...built.logs);
    process.exit(1);
  }
  return built.outputs[0]?.text() ?? "";
};

if (process.argv.includes("--watch")) {
  watchPlayground(import.meta.path, [src, join(import.meta.dir, "..", "react", "src", "patterns", "globe")]);
} else {
  const globe = await globeBundle();
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
      write: { "globe-bundle.js": globe },
      accent: accentPickerHtml(),
      render: (example) => ({ demo: example.markup, code: stripExampleHooks(example.markup) }),
    }),
  );
}
