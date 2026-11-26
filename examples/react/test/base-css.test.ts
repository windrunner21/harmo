import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// base.css: the page's margin, font, text color, and background, optional and
// at no specificity, so any rule of an app's for body wins; index.css, which
// every app loads, leaves them out.
const dist = join(import.meta.dir, "..", "..", "..", "packages", "css", "dist");

test("base.css sets the page's margin, font, color, and background under :where(body), and index.css doesn't", () => {
  const base = /:where\(body\)\s*\{([^}]*)\}/.exec(readFileSync(join(dist, "base.css"), "utf8"))?.[1] ?? "";
  for (const declaration of [
    "margin: 0",
    "font-family: var(--harmo-font-family)",
    "color: var(--harmo-color-text)",
    "background-color: var(--harmo-color-background)",
  ]) {
    expect(base).toContain(declaration);
  }
  expect(readFileSync(join(dist, "index.css"), "utf8")).not.toContain(":where(body)");
});
